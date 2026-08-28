// ARI vNext — Phase 10A request-scoped optimization audit.
//
// This layer observes OpenAI Responses API request metadata only. It never
// records prompts, user text, tool arguments, model output, or chain-of-thought.
// AsyncLocalStorage keeps concurrent server requests isolated while still
// allowing compound clauses to contribute to one turn-level trace.

import { AsyncLocalStorage } from "node:async_hooks";

export const OPTIMIZATION_TRACE_VERSION = "1.0.0";

const RUNTIME_KEY = Symbol.for("ari.phase10.optimization.runtime.v1");
const DEFAULT_RESPONSES_URL = "https://api.openai.com/v1/responses";

const runtime = globalThis[RUNTIME_KEY] || createRuntime();
if (!globalThis[RUNTIME_KEY]) globalThis[RUNTIME_KEY] = runtime;
installFetchObserver(runtime);

export async function withOptimizationTrace(turn = {}, callback) {
  if (typeof callback !== "function") throw new TypeError("Optimization trace callback is required.");
  const existing = runtime.storage.getStore();
  if (existing) return await callback(existing);

  const trace = createTrace(turn);
  return await runtime.storage.run(trace, async () => await callback(trace));
}

export function currentOptimizationTrace() {
  return runtime.storage.getStore() || null;
}

export function markCompoundFanout(trace = null, clauseCount = 0) {
  const target = trace || currentOptimizationTrace();
  if (!target) return null;
  const count = Math.max(0, Math.min(16, Math.floor(Number(clauseCount) || 0)));
  target.compoundClauseCount = Math.max(Number(target.compoundClauseCount || 0), count);
  return target;
}

export function recordOptimizationCall(trace = null, call = {}) {
  const target = trace || currentOptimizationTrace();
  if (!target) return null;

  const normalized = {
    index: target.calls.length + 1,
    stage: clean(call?.stage, 80) || "primary",
    model: clean(call?.model, 120) || null,
    providerRequestId: clean(call?.providerRequestId, 180) || null,
    status: clean(call?.status, 40) || "completed",
    httpStatus: finiteNumber(call?.httpStatus),
    latencyMs: Math.max(0, finiteNumber(call?.latencyMs) || 0),
    maxOutputTokens: Math.max(0, finiteNumber(call?.maxOutputTokens) || 0),
    reasoningEffort: clean(call?.reasoningEffort, 40) || null,
    toolChoice: clean(call?.toolChoice, 80) || null,
    usage: compactUsage(call?.usage)
  };

  target.calls.push(normalized);
  return normalized;
}

export function summarizeOptimizationTrace(trace = null) {
  if (!trace) return null;
  const calls = Array.isArray(trace.calls) ? trace.calls : [];
  const stageCounts = {};
  const modelCounts = {};
  const usage = {};
  let modelLatencyMs = 0;
  let failedCallCount = 0;

  for (const call of calls) {
    const stage = clean(call?.stage, 80) || "unknown";
    const model = clean(call?.model, 120) || "unknown";
    stageCounts[stage] = Number(stageCounts[stage] || 0) + 1;
    modelCounts[model] = Number(modelCounts[model] || 0) + 1;
    modelLatencyMs += Math.max(0, finiteNumber(call?.latencyMs) || 0);
    if (call?.status !== "completed") failedCallCount += 1;
    mergeNumbers(usage, call?.usage);
  }

  const pricing = estimateCost(calls);
  return {
    version: OPTIMIZATION_TRACE_VERSION,
    callCount: calls.length,
    failedCallCount,
    compoundClauseCount: Math.max(0, Number(trace.compoundClauseCount || 0)),
    modelLatencyMs,
    elapsedMs: Math.max(0, Date.now() - Number(trace.startedAtMs || Date.now())),
    stageCounts,
    modelCounts,
    usage,
    costEstimate: pricing,
    calls: calls.map((call) => ({ ...call }))
  };
}

export function classifyOpenAIRequest(body = {}) {
  const tools = Array.isArray(body?.tools) ? body.tools : [];
  const input = Array.isArray(body?.input) ? body.input : [];
  const instructions = String(body?.instructions || "");
  const toolChoice = body?.tool_choice;

  if (tools.some((tool) => tool?.type === "function" && tool?.name === "verify_action_intent")) {
    return "semantic_verifier";
  }
  if (/TOOL ARGUMENT CORRECTION/i.test(instructions)) return "tool_repair";
  if (input.some((item) => item?.type === "function_call_output")) return "confirmation_continuation";
  if (toolChoice && typeof toolChoice === "object" && toolChoice?.type === "function") return "forced_tool";
  return "primary";
}

function createRuntime() {
  return {
    storage: new AsyncLocalStorage(),
    originalFetch: typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null,
    patched: false
  };
}

function installFetchObserver(state) {
  if (state.patched || typeof state.originalFetch !== "function") return;
  state.patched = true;

  globalThis.fetch = async function ariOptimizationObservedFetch(input, init = {}) {
    const trace = state.storage.getStore();
    if (!trace || !isResponsesRequest(input)) {
      return await state.originalFetch(input, init);
    }

    const requestBody = parseJson(init?.body);
    const stage = classifyOpenAIRequest(requestBody);
    const startedAt = Date.now();

    try {
      const response = await state.originalFetch(input, init);
      const latencyMs = Date.now() - startedAt;
      const payload = await cloneJson(response);
      recordOptimizationCall(trace, {
        stage,
        model: payload?.model || requestBody?.model,
        providerRequestId: payload?.id,
        status: response?.ok ? "completed" : "provider_error",
        httpStatus: response?.status,
        latencyMs,
        maxOutputTokens: requestBody?.max_output_tokens,
        reasoningEffort: requestBody?.reasoning?.effort,
        toolChoice: summarizeToolChoice(requestBody?.tool_choice),
        usage: payload?.usage
      });
      return response;
    } catch (error) {
      recordOptimizationCall(trace, {
        stage,
        model: requestBody?.model,
        status: error?.name === "AbortError" ? "timeout" : "transport_error",
        latencyMs: Date.now() - startedAt,
        maxOutputTokens: requestBody?.max_output_tokens,
        reasoningEffort: requestBody?.reasoning?.effort,
        toolChoice: summarizeToolChoice(requestBody?.tool_choice),
        usage: null
      });
      throw error;
    }
  };
}

function isResponsesRequest(input) {
  const value = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : typeof input?.url === "string"
        ? input.url
        : "";
  if (!value) return false;
  const configured = String(process.env.OPENAI_RESPONSES_URL || DEFAULT_RESPONSES_URL).trim();
  return value === configured || value.replace(/\/+$/, "") === configured.replace(/\/+$/, "");
}

function parseJson(value) {
  if (typeof value !== "string" || !value.trim()) return {};
  try { return JSON.parse(value); } catch { return {}; }
}

async function cloneJson(response) {
  if (!response || typeof response.clone !== "function") return {};
  try { return await response.clone().json(); } catch { return {}; }
}

function compactUsage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  mergeNumbers(output, value);
  return output;
}

function mergeNumbers(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      target[key] = Number(target[key] || 0) + value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = target[key] && typeof target[key] === "object" && !Array.isArray(target[key]) ? target[key] : {};
      mergeNumbers(target[key], value);
    }
  }
  return target;
}

function estimateCost(calls = []) {
  const rates = parsePricingRates(process.env.ARI_PHASE10_MODEL_PRICING_JSON);
  if (!rates) return { usd: null, source: "pricing_rates_not_configured" };

  let total = 0;
  let pricedCalls = 0;
  for (const call of calls) {
    const model = clean(call?.model, 120);
    const rate = rates?.[model];
    if (!rate) continue;
    const input = Number(call?.usage?.input_tokens || 0);
    const cached = Number(call?.usage?.input_tokens_details?.cached_tokens || 0);
    const output = Number(call?.usage?.output_tokens || 0);
    const uncached = Math.max(0, input - cached);
    total += uncached * Number(rate.inputPer1M || 0) / 1_000_000;
    total += cached * Number(rate.cachedInputPer1M ?? rate.inputPer1M ?? 0) / 1_000_000;
    total += output * Number(rate.outputPer1M || 0) / 1_000_000;
    pricedCalls += 1;
  }

  return pricedCalls
    ? { usd: Math.round(total * 1e8) / 1e8, source: "configured_model_rates", pricedCalls }
    : { usd: null, source: "no_matching_model_rate" };
}

function parsePricingRates(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function summarizeToolChoice(value) {
  if (!value) return null;
  if (typeof value === "string") return clean(value, 80);
  if (value?.type === "function") return `function:${clean(value?.name, 60) || "unknown"}`;
  return clean(value?.type, 80) || "object";
}

function createTrace(turn = {}) {
  return {
    version: OPTIMIZATION_TRACE_VERSION,
    startedAtMs: Date.now(),
    turnId: clean(turn?.turnId, 200) || null,
    compoundClauseCount: 0,
    calls: []
  };
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
