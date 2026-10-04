// ARI vNext — adaptive owner developer task budget and progress controller.
// Durable functional telemetry only. This stores budget counters and evidence
// progress; it never stores hidden reasoning or raw source contents.

export const ARI_DEVELOPER_TASK_CONTROLLER_VERSION = "1.0.0";
export const DEVELOPER_ABSOLUTE_STEP_LIMIT = 24;

const DEFAULT_LIMITS = Object.freeze({
  minimumSteps: 6,
  maxSteps: DEVELOPER_ABSOLUTE_STEP_LIMIT,
  maxModelCalls: 24,
  maxTokens: 120_000,
  maxRuntimeMs: 50_000,
  maxWindowEstimatedCostUsd: 1.25,
  maxTaskEstimatedCostUsd: 5,
  maxConsecutiveUnproductiveSteps: 3
});

export function startDeveloperTaskController(previous = null, options = {}) {
  const prior = normalizeDeveloperTaskController(previous);
  const limits = resolveLimits(options?.limits || prior?.limits || {});
  const now = validIso(options?.now) || new Date().toISOString();
  return {
    version: ARI_DEVELOPER_TASK_CONTROLLER_VERSION,
    limits,
    window: emptyWindow(now),
    cumulative: prior?.cumulative || emptyCumulative(),
    lastEvidenceFingerprint: prior?.lastEvidenceFingerprint || null,
    lastDecision: null,
    hiddenChainOfThoughtStored: false
  };
}

export function recordDeveloperTaskStep(state = null, {
  response = null,
  evidence = null,
  toolResult = null,
  runtimeMs = 0,
  now = null
} = {}) {
  const base = normalizeDeveloperTaskController(state) || startDeveloperTaskController(null, { now });
  const usage = providerUsage(response);
  const rates = configuredRates();
  const stepCost = estimateUsageCostUsd(usage, rates);
  const fingerprint = evidenceFingerprint(evidence);
  const previousFingerprint = base.lastEvidenceFingerprint;
  const evidenceChanged = Boolean(fingerprint && fingerprint !== previousFingerprint);
  const verificationProgress = Boolean(
    evidence?.verification?.status &&
    evidence?.verification?.status !== "attempted"
  );
  const usefulFailure = toolResult?.success === false || evidence?.verification?.status === "failed";
  const productive = evidenceChanged || verificationProgress || usefulFailure;
  const runtime = boundedNumber(runtimeMs, 0, 120_000, 0);
  const nowIso = validIso(now) || new Date().toISOString();

  const window = {
    ...base.window,
    steps: base.window.steps + 1,
    modelCalls: base.window.modelCalls + (response ? 1 : 0),
    inputTokens: base.window.inputTokens + usage.inputTokens,
    outputTokens: base.window.outputTokens + usage.outputTokens,
    runtimeMs: base.window.runtimeMs + runtime,
    estimatedCostUsd: addNullableCost(base.window.estimatedCostUsd, stepCost),
    productiveSteps: base.window.productiveSteps + (productive ? 1 : 0),
    consecutiveUnproductiveSteps: productive ? 0 : base.window.consecutiveUnproductiveSteps + 1,
    evidenceUpdates: base.window.evidenceUpdates + (evidenceChanged ? 1 : 0),
    lastProgressAt: productive ? nowIso : base.window.lastProgressAt,
    updatedAt: nowIso
  };
  const cumulative = {
    windows: Math.max(1, base.cumulative.windows),
    steps: base.cumulative.steps + 1,
    modelCalls: base.cumulative.modelCalls + (response ? 1 : 0),
    inputTokens: base.cumulative.inputTokens + usage.inputTokens,
    outputTokens: base.cumulative.outputTokens + usage.outputTokens,
    runtimeMs: base.cumulative.runtimeMs + runtime,
    estimatedCostUsd: addNullableCost(base.cumulative.estimatedCostUsd, stepCost),
    evidenceUpdates: base.cumulative.evidenceUpdates + (evidenceChanged ? 1 : 0)
  };

  const updated = {
    ...base,
    window,
    cumulative,
    lastEvidenceFingerprint: fingerprint || previousFingerprint || null,
    lastDecision: null
  };
  const decision = developerTaskBudgetDecision(updated);
  return { ...updated, lastDecision: decision };
}

export function recordDeveloperInitialModelCall(state = null, response = null) {
  const base = normalizeDeveloperTaskController(state) || startDeveloperTaskController();
  if (!response) return base;
  const usage = providerUsage(response);
  const stepCost = estimateUsageCostUsd(usage, configuredRates());
  return {
    ...base,
    window: {
      ...base.window,
      modelCalls: base.window.modelCalls + 1,
      inputTokens: base.window.inputTokens + usage.inputTokens,
      outputTokens: base.window.outputTokens + usage.outputTokens,
      estimatedCostUsd: addNullableCost(base.window.estimatedCostUsd, stepCost)
    },
    cumulative: {
      ...base.cumulative,
      windows: Math.max(1, base.cumulative.windows),
      modelCalls: base.cumulative.modelCalls + 1,
      inputTokens: base.cumulative.inputTokens + usage.inputTokens,
      outputTokens: base.cumulative.outputTokens + usage.outputTokens,
      estimatedCostUsd: addNullableCost(base.cumulative.estimatedCostUsd, stepCost)
    }
  };
}

export function developerTaskBudgetDecision(state = null) {
  const value = normalizeDeveloperTaskController(state) || startDeveloperTaskController();
  const { window, cumulative, limits } = value;
  const totalTokens = window.inputTokens + window.outputTokens;
  const hardReasons = [
    window.steps >= limits.maxSteps ? "step_cap" : null,
    window.modelCalls >= limits.maxModelCalls ? "model_call_cap" : null,
    totalTokens >= limits.maxTokens ? "token_cap" : null,
    window.runtimeMs >= limits.maxRuntimeMs ? "runtime_cap" : null,
    costReached(window.estimatedCostUsd, limits.maxWindowEstimatedCostUsd) ? "window_cost_cap" : null,
    costReached(cumulative.estimatedCostUsd, limits.maxTaskEstimatedCostUsd) ? "task_cost_cap" : null
  ].filter(Boolean);
  if (hardReasons.length) {
    return {
      continue: false,
      reason: hardReasons[0],
      hardStop: true,
      remainingSteps: Math.max(0, limits.maxSteps - window.steps)
    };
  }

  if (
    window.steps >= limits.minimumSteps &&
    window.consecutiveUnproductiveSteps >= limits.maxConsecutiveUnproductiveSteps
  ) {
    return {
      continue: false,
      reason: "evidence_stalled",
      hardStop: false,
      remainingSteps: Math.max(0, limits.maxSteps - window.steps)
    };
  }

  return {
    continue: true,
    reason: window.steps < limits.minimumSteps ? "minimum_investigation_depth" : "evidence_progressing",
    hardStop: false,
    remainingSteps: Math.max(0, limits.maxSteps - window.steps)
  };
}

export function normalizeDeveloperTaskController(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const limits = resolveLimits(value.limits || {});
  const window = normalizeWindow(value.window);
  const cumulative = normalizeCumulative(value.cumulative);
  if (!window || !cumulative) return null;
  const decision = value.lastDecision && typeof value.lastDecision === "object"
    ? {
        continue: value.lastDecision.continue === true,
        reason: clean(value.lastDecision.reason, 80) || null,
        hardStop: value.lastDecision.hardStop === true,
        remainingSteps: boundedInt(value.lastDecision.remainingSteps, 0, limits.maxSteps, 0)
      }
    : null;
  return {
    version: ARI_DEVELOPER_TASK_CONTROLLER_VERSION,
    limits,
    window,
    cumulative,
    lastEvidenceFingerprint: clean(value.lastEvidenceFingerprint, 120) || null,
    lastDecision: decision,
    hiddenChainOfThoughtStored: false
  };
}

export function developerTaskControllerSummary(value = null) {
  const state = normalizeDeveloperTaskController(value);
  if (!state) return null;
  const decision = developerTaskBudgetDecision(state);
  return {
    steps: state.window.steps,
    modelCalls: state.window.modelCalls,
    tokens: state.window.inputTokens + state.window.outputTokens,
    runtimeMs: state.window.runtimeMs,
    estimatedCostUsd: state.window.estimatedCostUsd,
    productiveSteps: state.window.productiveSteps,
    evidenceUpdates: state.window.evidenceUpdates,
    continue: decision.continue,
    stopReason: decision.continue ? null : decision.reason,
    remainingSteps: decision.remainingSteps,
    costEstimateConfigured: configuredRates() !== null
  };
}

export function developerTaskBudgetInstruction(value = null) {
  const summary = developerTaskControllerSummary(value);
  if (!summary) return "";
  const cost = summary.estimatedCostUsd === null ? "cost estimate unavailable" : `estimated window cost $${summary.estimatedCostUsd.toFixed(4)}`;
  return [
    "ADAPTIVE DEVELOPER TASK BUDGET",
    `Window: ${summary.steps} step(s), ${summary.modelCalls} model call(s), ${summary.tokens} billed token(s), ${cost}.`,
    `Evidence progress: ${summary.productiveSteps} productive step(s), ${summary.evidenceUpdates} evidence update(s).`,
    summary.continue
      ? "Continue only while the next action has a credible chance to add evidence, implement the fix, or verify the result."
      : `Pause cleanly because the adaptive budget reached ${summary.stopReason}. Preserve the exact next safe step.`
  ].join("\n");
}

function emptyWindow(now) {
  return {
    steps: 0,
    modelCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    runtimeMs: 0,
    estimatedCostUsd: null,
    productiveSteps: 0,
    consecutiveUnproductiveSteps: 0,
    evidenceUpdates: 0,
    startedAt: now,
    lastProgressAt: null,
    updatedAt: now
  };
}

function emptyCumulative() {
  return {
    windows: 1,
    steps: 0,
    modelCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    runtimeMs: 0,
    estimatedCostUsd: null,
    evidenceUpdates: 0
  };
}

function normalizeWindow(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    steps: boundedInt(value.steps, 0, DEVELOPER_ABSOLUTE_STEP_LIMIT, 0),
    modelCalls: boundedInt(value.modelCalls, 0, 1000, 0),
    inputTokens: boundedInt(value.inputTokens, 0, 10_000_000, 0),
    outputTokens: boundedInt(value.outputTokens, 0, 10_000_000, 0),
    runtimeMs: boundedInt(value.runtimeMs, 0, 10 * 60_000, 0),
    estimatedCostUsd: nullableCost(value.estimatedCostUsd),
    productiveSteps: boundedInt(value.productiveSteps, 0, DEVELOPER_ABSOLUTE_STEP_LIMIT, 0),
    consecutiveUnproductiveSteps: boundedInt(value.consecutiveUnproductiveSteps, 0, DEVELOPER_ABSOLUTE_STEP_LIMIT, 0),
    evidenceUpdates: boundedInt(value.evidenceUpdates, 0, 10_000, 0),
    startedAt: validIso(value.startedAt),
    lastProgressAt: validIso(value.lastProgressAt),
    updatedAt: validIso(value.updatedAt)
  };
}

function normalizeCumulative(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    windows: boundedInt(value.windows, 1, 10_000, 1),
    steps: boundedInt(value.steps, 0, 1_000_000, 0),
    modelCalls: boundedInt(value.modelCalls, 0, 1_000_000, 0),
    inputTokens: boundedInt(value.inputTokens, 0, 1_000_000_000, 0),
    outputTokens: boundedInt(value.outputTokens, 0, 1_000_000_000, 0),
    runtimeMs: boundedInt(value.runtimeMs, 0, 365 * 24 * 60 * 60_000, 0),
    estimatedCostUsd: nullableCost(value.estimatedCostUsd),
    evidenceUpdates: boundedInt(value.evidenceUpdates, 0, 1_000_000, 0)
  };
}

function resolveLimits(raw = {}) {
  const min = boundedInt(raw.minimumSteps, 1, 12, DEFAULT_LIMITS.minimumSteps);
  const max = boundedInt(raw.maxSteps, min, DEVELOPER_ABSOLUTE_STEP_LIMIT, DEFAULT_LIMITS.maxSteps);
  return {
    minimumSteps: min,
    maxSteps: max,
    maxModelCalls: boundedInt(raw.maxModelCalls, 2, 40, DEFAULT_LIMITS.maxModelCalls),
    maxTokens: boundedInt(raw.maxTokens, 2_000, 500_000, DEFAULT_LIMITS.maxTokens),
    maxRuntimeMs: boundedInt(raw.maxRuntimeMs, 5_000, 110_000, DEFAULT_LIMITS.maxRuntimeMs),
    maxWindowEstimatedCostUsd: boundedNumber(raw.maxWindowEstimatedCostUsd, 0.05, 20, DEFAULT_LIMITS.maxWindowEstimatedCostUsd),
    maxTaskEstimatedCostUsd: boundedNumber(raw.maxTaskEstimatedCostUsd, 0.1, 100, DEFAULT_LIMITS.maxTaskEstimatedCostUsd),
    maxConsecutiveUnproductiveSteps: boundedInt(raw.maxConsecutiveUnproductiveSteps, 1, 8, DEFAULT_LIMITS.maxConsecutiveUnproductiveSteps)
  };
}

function providerUsage(response = null) {
  const usage = response?.usage || {};
  return {
    inputTokens: boundedInt(usage.input_tokens ?? usage.inputTokens, 0, 10_000_000, 0),
    outputTokens: boundedInt(usage.output_tokens ?? usage.outputTokens, 0, 10_000_000, 0)
  };
}

function configuredRates() {
  const input = Number(process.env.ARI_DEVELOPER_EST_INPUT_USD_PER_MILLION);
  const output = Number(process.env.ARI_DEVELOPER_EST_OUTPUT_USD_PER_MILLION);
  if (!Number.isFinite(input) || input <= 0 || !Number.isFinite(output) || output <= 0) return null;
  return { input, output };
}

function estimateUsageCostUsd(usage, rates) {
  if (!rates) return null;
  return roundMoney((usage.inputTokens / 1_000_000) * rates.input + (usage.outputTokens / 1_000_000) * rates.output);
}

function evidenceFingerprint(evidence = null) {
  if (!evidence || typeof evidence !== "object") return null;
  const parts = [];
  for (const item of Array.isArray(evidence.observations) ? evidence.observations.slice(-8) : []) {
    parts.push(`${clean(item?.id, 100)}|${clean(item?.kind, 80)}|${clean(item?.summary, 220)}|${item?.verified === true}`);
  }
  for (const item of Array.isArray(evidence.artifacts) ? evidence.artifacts.slice(-6) : []) {
    parts.push(`${clean(item?.id, 100)}|${clean(item?.kind, 80)}|${clean(item?.ref || item?.url, 160)}|${item?.verified === true}`);
  }
  if (evidence.verification) parts.push(`verification|${clean(evidence.verification.status, 40)}|${clean(evidence.verification.id, 100)}|${clean(evidence.verification.summary, 220)}`);
  if (!parts.length) return null;
  let hash = 2166136261;
  for (const ch of parts.join("\n")) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function addNullableCost(left, right) {
  if (left === null && right === null) return null;
  return roundMoney(Number(left || 0) + Number(right || 0));
}
function nullableCost(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? roundMoney(number) : null;
}
function costReached(value, limit) {
  return value !== null && Number.isFinite(value) && value >= limit;
}
function roundMoney(value) {
  return Math.round(Number(value || 0) * 1_000_000) / 1_000_000;
}
function boundedInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}
function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
function validIso(value) {
  if (!value) return null;
  const time = Date.parse(String(value));
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
