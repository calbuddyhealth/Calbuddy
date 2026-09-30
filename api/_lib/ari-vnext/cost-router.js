// ARI vNext — cost-aware cognitive gateway helpers.
// Keeps model tiering and prompt budgets deterministic and testable.

import { estimateOpenAICost } from "../ai-provider-usage.js";

export const ARI_COST_ROUTER_VERSION = "1.0.0";

const DEFAULT_OWNER_MODEL = "gpt-5.6-terra";
const DEFAULT_OWNER_DEEP_MODEL = "gpt-5.6-sol";
const DEFAULT_BACKGROUND_FAST_MODEL = "gpt-5.6-luna";
const DEFAULT_BACKGROUND_REASONING_MODEL = "gpt-5.6-terra";

export function resolveOwnerInteractiveModel({
  mode = "standard",
  route = {},
  reasoningProfile = "adaptive"
} = {}) {
  const normalModel =
    clean(process.env.OPENAI_ARI_OWNER_DEFAULT_MODEL, 160) ||
    clean(process.env.OPENAI_ARI_OWNER_BALANCED_MODEL, 160) ||
    DEFAULT_OWNER_MODEL;

  const deepModel =
    clean(process.env.OPENAI_ARI_OWNER_DEEP_MODEL, 160) ||
    clean(process.env.OPENAI_ARI_OWNER_MODEL, 160) ||
    clean(process.env.OPENAI_ARI_ADVANCED_MODEL, 160) ||
    DEFAULT_OWNER_DEEP_MODEL;

  const forceEconomy =
    String(process.env.ARI_OWNER_FORCE_TERRA || "").trim().toLowerCase() === "true";

  const explicitDeepProfile = clean(reasoningProfile, 40).toLowerCase() === "deep";
  const deepRoute = mode === "deep" || route?.complexity === "deep" || route?.health === true;
  const escalate = !forceEconomy && (deepRoute || explicitDeepProfile);

  return {
    model: escalate ? deepModel : normalModel,
    escalated: escalate,
    reason: escalate
      ? explicitDeepProfile
        ? "explicit_deep_profile"
        : route?.health === true
          ? "high_stakes_health"
          : "deep_complexity"
      : forceEconomy
        ? "owner_force_terra"
        : "terra_default"
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

  if (!allowSol && isSolClassModel(requested)) {
    return reasoning ? DEFAULT_BACKGROUND_REASONING_MODEL : DEFAULT_BACKGROUND_FAST_MODEL;
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
  const perCallLimitUsd = positiveNumber(process.env.ARI_OWNER_MAX_SOL_CALL_USD, 0.20);
  const allowOversizeSol =
    String(process.env.ARI_OWNER_ALLOW_OVERSIZE_SOL || "").trim().toLowerCase() === "true";

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
    isSolClassModel(policy?.model) &&
    estimatedMaxCostUsd > perCallLimitUsd &&
    !allowOversizeSol
  ) {
    const model =
      clean(process.env.OPENAI_ARI_OWNER_DEFAULT_MODEL, 160) ||
      clean(process.env.OPENAI_ARI_OWNER_BALANCED_MODEL, 160) ||
      DEFAULT_OWNER_MODEL;
    return {
      ...policy,
      model,
      supportsReasoning: true,
      costTier: "owner_terra_budget_guard",
      escalated: false,
      routingReason: "sol_per_call_budget_guard",
      costGuard: {
        ...costGuard,
        downgraded: true,
        reason: "sol_estimate_above_per_call_limit"
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
  return boundedInt(process.env.ARI_RELEVANT_CONTEXT_CHARS, 9000, 6000, 18000);
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
  return model === "gpt-5.6" || model.includes("gpt-5.6-sol") || /(?:^|[-_])sol(?:$|[-_])/.test(model);
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
