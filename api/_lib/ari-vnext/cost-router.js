// ARI vNext — cost-aware cognitive gateway helpers.
// Keeps model tiering and prompt budgets deterministic and testable.

import { estimateOpenAICost } from "../ai-provider-usage.js";

export const ARI_COST_ROUTER_VERSION = "1.2.0";
export const ARI_REASONING_GOVERNOR_VERSION = "1.0.0";

const DEFAULT_OWNER_MODEL = "gpt-6.1-sol";
const DEFAULT_OWNER_ASTRA_MODEL = "gpt-6-astra";
const DEFAULT_OWNER_BUDGET_MODEL = "gpt-6-luna";
const DEFAULT_BACKGROUND_FAST_MODEL = "gpt-6-luna";
const DEFAULT_BACKGROUND_REASONING_MODEL = "gpt-6-luna";

export function deriveReasoningDemand(route = {}) {
  const requestedComplexity = clean(route?.complexity || route?.mode || "standard", 40).toLowerCase();
  const complexity = ["fast", "standard", "deep"].includes(requestedComplexity)
    ? requestedComplexity
    : "standard";

  let score = complexity === "deep" ? 5 : complexity === "standard" ? 3 : 0;
  const reasons = [`complexity_${complexity}`];

  const add = (points, reason) => {
    if (!points) return;
    score += points;
    reasons.push(reason);
  };

  add(route?.developer === true ? 1 : 0, "developer_context");
  add(route?.health === true ? 1 : 0, "health_context");
  add(route?.coachingState === true ? 1 : 0, "cross_domain_coaching");
  add(route?.recommendationIntent === true ? 1 : 0, "recommendation_comparison");
  add(route?.solEscalationEligible === true ? 3 : 0, "hard_problem_signal");

  const messageLength = Math.max(0, Number(route?.messageLength) || 0);
  if (messageLength > 1800) add(2, "large_input");
  else if (messageLength > 800) add(1, "moderate_input");

  const domainCount = Number.isFinite(Number(route?.domainCount))
    ? Math.max(0, Number(route.domainCount))
    : ["nutrition", "training", "goals", "social", "memory"]
      .reduce((count, key) => count + (route?.[key] === true ? 1 : 0), 0);
  if (domainCount >= 3) add(1, "multi_domain_turn");

  if (
    route?.previousAttemptFailed === true ||
    route?.retryAfterFailure === true ||
    route?.toolFailure === true
  ) {
    add(3, "runtime_failure_retry");
  }

  score = Math.max(0, Math.min(12, Math.round(score)));
  const thresholds = reasoningThresholds();
  const band = score <= thresholds.lowMax
    ? "low"
    : score <= thresholds.mediumMax
      ? "medium"
      : score <= thresholds.highMax
        ? "high"
        : "critical";

  return {
    version: ARI_REASONING_GOVERNOR_VERSION,
    score,
    band,
    reasons,
    thresholds
  };
}

function reasoningThresholds() {
  const lowMax = boundedInt(process.env.ARI_REASONING_LOW_MAX, 2, 0, 10);
  const mediumCandidate = boundedInt(process.env.ARI_REASONING_MEDIUM_MAX, 4, 1, 11);
  const mediumMax = Math.max(lowMax + 1, mediumCandidate);
  const highCandidate = boundedInt(process.env.ARI_REASONING_HIGH_MAX, 7, 2, 12);
  const highMax = Math.max(mediumMax + 1, highCandidate);
  return { lowMax, mediumMax, highMax };
}

export function resolveOwnerInteractiveModel({
  mode = "standard",
  route = {},
  reasoningProfile = "adaptive"
} = {}) {
  const allowLegacyOverrides =
    String(process.env.ARI_OWNER_USE_LEGACY_MODEL_OVERRIDES || "").trim().toLowerCase() === "true";

  const normalModel =
    clean(process.env.OPENAI_ARI_OWNER_SOL_MODEL, 160) ||
    (allowLegacyOverrides
      ? clean(process.env.OPENAI_ARI_OWNER_DEFAULT_MODEL, 160) ||
        clean(process.env.OPENAI_ARI_OWNER_BALANCED_MODEL, 160)
      : "") ||
    DEFAULT_OWNER_MODEL;

  const astraModel =
    clean(process.env.OPENAI_ARI_OWNER_ASTRA_MODEL, 160) ||
    DEFAULT_OWNER_ASTRA_MODEL;

  const explicitRequest = clean(route?.ownerModelRequest, 40).toLowerCase();
  const explicitDeepProfile = clean(reasoningProfile, 40).toLowerCase() === "deep";
  const reasoningDemand = deriveReasoningDemand({
    ...route,
    complexity: mode || route?.complexity
  });
  const hardProblem =
    route?.solEscalationEligible === true &&
    reasoningDemand.band === "critical";
  const forceSol =
    String(process.env.ARI_OWNER_FORCE_SOL || "").trim().toLowerCase() === "true";

  const escalateToAstra = explicitRequest === "astra" || (
    explicitRequest !== "sol" &&
    !forceSol &&
    (hardProblem || explicitDeepProfile)
  );

  return {
    model: escalateToAstra ? astraModel : normalModel,
    fallbackModel: normalModel,
    budgetModel: DEFAULT_OWNER_BUDGET_MODEL,
    reasoningDemand,
    escalated: escalateToAstra,
    reason: escalateToAstra
      ? explicitRequest === "astra"
        ? "explicit_astra_request"
        : explicitDeepProfile
          ? "explicit_deep_profile"
          : "hard_problem"
      : explicitRequest === "sol"
        ? "explicit_sol_request"
        : forceSol
          ? "owner_force_sol"
          : "sol_default"
  };
}

export function resolveBackgroundModel({
  requestedModel = "",
  reasoning = false
} = {}) {
  const fallback = reasoning
    ? DEFAULT_BACKGROUND_REASONING_MODEL
    : DEFAULT_BACKGROUND_FAST_MODEL;
  const requested = clean(requestedModel, 160) || fallback;
  const allowSol =
    String(process.env.ARI_ALLOW_BACKGROUND_SOL || "").trim().toLowerCase() === "true";

  // Astra is never permitted for autonomous/background work. It is reserved
  // for an active owner turn, where the request and spend are visible.
  if (isAstraClassModel(requested)) return fallback;

  if (!allowSol && isSolClassModel(requested)) {
    return fallback;
  }
  return requested;
}

export function applyInteractiveCostGuard({
  policy = {},
  instructions = "",
  input = []
} = {}) {
  const telemetry = promptBudgetTelemetry({ instructions, input });
  const maxOutputTokens = Math.max(1, Number(policy?.maxOutputTokens || 1200));
  const estimate = estimateOpenAICost({
    model: policy?.model || "",
    usage: {
      inputTokens: telemetry.estimatedInputTokens,
      cachedInputTokens: 0,
      outputTokens: maxOutputTokens,
      totalTokens: telemetry.estimatedInputTokens + maxOutputTokens
    }
  });
  const estimatedMaxCostUsd = Math.max(0, Number(estimate?.estimatedCostUsd) || 0);
  const astra = isAstraClassModel(policy?.model);
  const sol = isSolClassModel(policy?.model);
  const perCallLimitUsd = astra
    ? positiveNumber(process.env.ARI_OWNER_MAX_ASTRA_CALL_USD, 0.50)
    : positiveNumber(process.env.ARI_OWNER_MAX_SOL_CALL_USD, 0.20);
  const allowOversize = astra
    ? String(process.env.ARI_OWNER_ALLOW_OVERSIZE_ASTRA || "").trim().toLowerCase() === "true"
    : String(process.env.ARI_OWNER_ALLOW_OVERSIZE_SOL || "").trim().toLowerCase() === "true";

  const costGuard = {
    version: ARI_COST_ROUTER_VERSION,
    estimatedMaxCostUsd: roundMoney(estimatedMaxCostUsd),
    perCallLimitUsd: roundMoney(perCallLimitUsd),
    estimatedInputTokens: telemetry.estimatedInputTokens,
    totalChars: telemetry.totalChars,
    downgraded: false,
    reason: "within_call_budget"
  };

  if (
    policy?.accessClass === "owner" &&
    (astra || sol) &&
    estimatedMaxCostUsd > perCallLimitUsd &&
    !allowOversize
  ) {
    const model = astra
      ? clean(policy?.fallbackModel, 160) || DEFAULT_OWNER_MODEL
      : clean(process.env.OPENAI_ARI_OWNER_BUDGET_MODEL, 160) || DEFAULT_OWNER_BUDGET_MODEL;
    return {
      ...policy,
      model,
      fallbackModel: astra ? DEFAULT_OWNER_BUDGET_MODEL : null,
      supportsReasoning: true,
      costTier: astra ? "owner_sol_budget_guard" : "owner_luna_budget_guard",
      escalated: false,
      routingReason: astra ? "astra_per_call_budget_guard" : "sol_per_call_budget_guard",
      costGuard: {
        ...costGuard,
        downgraded: true,
        reason: astra
          ? "astra_estimate_above_per_call_limit"
          : "sol_estimate_above_per_call_limit"
      }
    };
  }

  return {
    ...policy,
    costGuard
  };
}

export function compileConversationInput(turn = {}) {
  const history = Array.isArray(turn?.history) ? turn.history : [];
  const maxHistoryMessages = boundedInt(
    process.env.ARI_CONTEXT_HISTORY_MESSAGES,
    6,
    2,
    12
  );
  const maxHistoryChars = boundedInt(
    process.env.ARI_CONTEXT_HISTORY_CHARS,
    6000,
    2000,
    16000
  );
  const maxPerHistoryMessage = boundedInt(
    process.env.ARI_CONTEXT_HISTORY_MESSAGE_CHARS,
    1600,
    600,
    4000
  );
  const maxCurrentMessageChars = boundedInt(
    process.env.ARI_CONTEXT_CURRENT_MESSAGE_CHARS,
    8000,
    2000,
    20000
  );

  const selected = [];
  let usedChars = 0;

  for (let index = history.length - 1; index >= 0 && selected.length < maxHistoryMessages; index -= 1) {
    const item = history[index] || {};
    const role = item?.role === "assistant" ? "assistant" : "user";
    const content = cleanMessage(item?.content, maxPerHistoryMessage);
    if (!content) continue;

    const remaining = maxHistoryChars - usedChars;
    if (remaining <= 0) break;

    const fitted = content.slice(Math.max(0, content.length - remaining));
    if (!fitted) continue;

    selected.push({ role, content: fitted });
    usedChars += fitted.length;
  }

  selected.reverse();
  selected.push({
    role: "user",
    content: cleanMessage(turn?.message, maxCurrentMessageChars)
  });

  return selected;
}

export function compactInstructionText(value = "", {
  maxChars = null
} = {}) {
  const text = String(value || "").replace(/\n{4,}/g, "\n\n\n").trim();
  const limit = boundedInt(
    maxChars ?? process.env.ARI_CONTEXT_INSTRUCTION_CHARS,
    18000,
    10000,
    36000
  );
  if (text.length <= limit) return text;

  const marker = "\n\n[OPTIONAL MIDDLE CONTEXT COMPACTED FOR COST EFFICIENCY]\n\n";
  const available = Math.max(2000, limit - marker.length);
  const headBudget = Math.floor(available * 0.56);
  const tailBudget = available - headBudget;

  const head = trimAtBoundary(text.slice(0, headBudget), "end");
  const tail = trimAtBoundary(text.slice(text.length - tailBudget), "start");
  return (head + marker + tail).slice(0, limit);
}

export function contextBudgetChars() {
  return boundedInt(process.env.ARI_RELEVANT_CONTEXT_CHARS, 14000, 10000, 18000);
}

export function promptBudgetTelemetry({ instructions = "", input = [] } = {}) {
  const instructionChars = String(instructions || "").length;
  const inputChars = (Array.isArray(input) ? input : [])
    .reduce((sum, item) => sum + String(item?.content || "").length, 0);
  return {
    version: ARI_COST_ROUTER_VERSION,
    instructionChars,
    inputChars,
    totalChars: instructionChars + inputChars,
    estimatedInputTokens: Math.ceil((instructionChars + inputChars) / 4)
  };
}

export function isSolClassModel(value = "") {
  const model = clean(value, 160).toLowerCase();
  return model === "gpt-5.6" || /(?:^|[-_])sol(?:$|[-_])/.test(model);
}

export function isAstraClassModel(value = "") {
  const model = clean(value, 160).toLowerCase();
  return /(?:^|[-_])astra(?:$|[-_])/.test(model);
}

function trimAtBoundary(value = "", edge = "end") {
  const text = String(value || "");
  if (!text) return "";
  if (edge === "start") {
    const index = text.indexOf("\n");
    return index >= 0 && index < 500 ? text.slice(index + 1) : text;
  }
  const index = text.lastIndexOf("\n");
  return index > Math.max(0, text.length - 500) ? text.slice(0, index) : text;
}

function roundMoney(value) {
  return Math.round(Math.max(0, Number(value) || 0) * 1000000) / 1000000;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function boundedInt(value, fallback, min, max) {
  const number = Math.round(Number(value));
  return Number.isFinite(number)
    ? Math.max(min, Math.min(max, number))
    : fallback;
}

function cleanMessage(value = "", max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
