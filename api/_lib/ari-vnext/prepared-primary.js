// ARI vNext — Phase 10E request-scoped prepared primary injection.
//
// A shared compound model pass may prepare one function call per independent
// clause. This layer lets each existing single-action core consume its prepared
// function call instead of spending another primary model call. Every verifier,
// trusted validator, canonicalizer, confirmation boundary, and operation-registry
// check inside the mature core still runs normally.

import { AsyncLocalStorage } from "node:async_hooks";
import {
  classifyOpenAIRequest,
  currentOptimizationTrace,
  recordAvoidedModelCall
} from "./optimization-trace.js";

export const PREPARED_PRIMARY_VERSION = "1.0.0";

const RUNTIME_KEY = Symbol.for("ari.phase10e.prepared-primary.runtime.v1");
const DEFAULT_RESPONSES_URL = "https://api.openai.com/v1/responses";

const runtime = globalThis[RUNTIME_KEY] || createRuntime();
if (!globalThis[RUNTIME_KEY]) globalThis[RUNTIME_KEY] = runtime;
installPreparedPrimaryInterceptor(runtime);

export async function withPreparedPrimary(prepared = null, callback) {
  if (typeof callback !== "function") throw new TypeError("Prepared-primary callback is required.");
  if (!isPreparedCall(prepared)) return await callback();

  return await runtime.storage.run({
    prepared: normalizePreparedCall(prepared),
    consumed: false
  }, async () => await callback());
}

export function isPreparedPrimaryActive() {
  const store = runtime.storage.getStore();
  return Boolean(store?.prepared && store?.consumed !== true);
}

function createRuntime() {
  return {
    storage: new AsyncLocalStorage(),
    originalFetch: typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null,
    patched: false
  };
}

function installPreparedPrimaryInterceptor(state) {
  if (state.patched || typeof state.originalFetch !== "function") return;
  state.patched = true;

  globalThis.fetch = async function ariPreparedPrimaryFetch(input, init = {}) {
    const store = state.storage.getStore();
    if (!store?.prepared || store.consumed === true || !isResponsesRequest(input)) {
      return await state.originalFetch(input, init);
    }

    const requestBody = parseJson(init?.body);
    if (classifyOpenAIRequest(requestBody) !== "primary") {
      return await state.originalFetch(input, init);
    }

    store.consumed = true;
    recordAvoidedModelCall(currentOptimizationTrace(), {
      stage: "primary",
      reason: "phase10e_shared_compound_primary",
      applicationAction: null,
      model: requestBody?.model
    });

    const call = store.prepared;
    const payload = {
      id: `phase10e_${clean(call.call_id, 80) || "prepared"}`,
      object: "response",
      status: "completed",
      model: requestBody?.model || null,
      output: [{
        type: "function_call",
        status: "completed",
        call_id: call.call_id,
        name: call.name,
        arguments: call.arguments
      }],
      output_text: "",
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      }
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
}

function normalizePreparedCall(value = {}) {
  return {
    call_id: clean(value?.call_id, 180) || `phase10e_${Date.now()}`,
    name: clean(value?.name, 120),
    arguments: typeof value?.arguments === "string"
      ? value.arguments
      : JSON.stringify(value?.arguments && typeof value.arguments === "object" ? value.arguments : {})
  };
}

function isPreparedCall(value) {
  return Boolean(value && typeof value === "object" && clean(value?.name, 120));
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

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
