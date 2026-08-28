// ARI vNext — simple deterministic mutation intent facade.
//
// The primary Ari model chooses the capability. This layer does NOT spend a
// second model call re-judging the first model. It only preserves the few
// deterministic checks that make execution trustworthy: current-route tool
// availability, canonical reference resolution, and bounded current-turn
// routine/correction authorization.
//
// Product policy does not belong here. Account ownership, payload validation,
// repository constraints, idempotency, and actual persistence remain downstream.

import {
  reviewDeterministicRoutineLogIntent as reviewCoreDeterministicRoutineLogIntent
} from "./action-intent-verifier-core.js";
import { normalizeNutritionPlanReview } from "./nutrition-plan-policy.js";
import { resolveReferenceTarget } from "./reference-context.js";

const DIRECT_SAFE_TOOLS = Object.freeze({
  propose_update_goal: ["set", "update", "change"],
  propose_plan_workout: ["plan", "create", "build", "make"],
  propose_create_circle_meetup: ["create", "host", "schedule", "make"],
  propose_create_circle_mission: ["create", "start", "make"],
  propose_create_circle_crew: ["create", "make", "form"]
});

const SINGLE_REFERENCE_MUTATION_TOOLS = new Set([
  "propose_undo_nutrition_mutation",
  "propose_update_nutrition_meal",
  "propose_log_referenced_planned_meal",
  "propose_discard_referenced_meal_plan",
  "propose_replace_referenced_meal_plan",
  "propose_update_activity_log",
  "propose_delete_activity_log",
  "propose_update_weight_log",
  "propose_delete_weight_log",
  "propose_edit_referenced_workout",
  "propose_delete_workout"
]);

const REFERENCE_LANGUAGE = /\b(?:it|that|this|those|these|them|one|ones|first|second|third|former|latter|same|previous|other)\b/i;

export function reviewDeterministicRoutineLogIntent(args = {}) {
  return reviewCoreDeterministicRoutineLogIntent({
    turn: args?.turn || {},
    route: args?.route || {},
    functionCall: args?.functionCall || null,
    availableTools: Array.from(availableToolNames(args?.tools || args?.availableTools))
  });
}

export async function reviewExplicitApplicationIntent(args = {}) {
  const turn = args?.turn || {};
  const route = args?.route || {};
  const functionCall = args?.functionCall || null;
  const availableTools = Array.from(availableToolNames(args?.tools));
  const decision = clean(functionCall?.name, 120);

  const resolution = attachReferenceResolution({ turn, route });
  if (decision && SINGLE_REFERENCE_MUTATION_TOOLS.has(decision) && referenceResolutionBlocks(resolution)) {
    return {
      version: "2.0.0",
      decision: "none",
      confidence: 1,
      reason: "Reference target is ambiguous or unresolved; clarification is required before mutation.",
      dailyGoalKnown: null,
      model: null,
      providerRequestId: null,
      usage: null,
      source: "deterministic_reference_resolution_block"
    };
  }

  const deterministic = reviewCoreDeterministicRoutineLogIntent({
    turn,
    route,
    functionCall,
    availableTools
  });
  if (deterministic) {
    return normalizeNutritionPlanReview({ review: deterministic, route });
  }

  const direct = reviewDeterministicDirectMutation({ ...args, route });
  if (direct) {
    return normalizeNutritionPlanReview({ review: direct, route });
  }

  if (!decision) return null;
  if (!new Set(availableTools).has(decision)) return null;

  // No semantic verifier model call. The primary Ari capability proceeds to
  // deterministic tool validation/canonicalization and the simple action policy.
  return normalizeNutritionPlanReview({
    review: {
      version: "2.0.0",
      decision,
      confidence: 1,
      reason: "Primary Ari capability accepted for deterministic validation; no secondary semantic verifier call.",
      dailyGoalKnown: null,
      model: null,
      providerRequestId: null,
      usage: null,
      source: "primary_capability"
    },
    route
  });
}

export function reviewDeterministicDirectMutation({
  turn = {},
  tools = [],
  functionCall = null
} = {}) {
  const decision = clean(functionCall?.name, 120);
  const verbs = DIRECT_SAFE_TOOLS[decision];
  if (!verbs) return null;

  const available = availableToolNames(tools);
  if (!available.has(decision)) return null;

  const message = clean(turn?.message, 1000);
  if (!message || REFERENCE_LANGUAGE.test(message)) return null;
  if (!matchesDirectCommand(message, verbs)) return null;

  return {
    version: "2.0.0",
    decision,
    confidence: 1,
    reason: "Explicit current-turn direct mutation command verified deterministically.",
    dailyGoalKnown: null,
    model: null,
    providerRequestId: null,
    usage: null,
    source: "deterministic_direct_mutation"
  };
}

function attachReferenceResolution({ turn = {}, route = {} } = {}) {
  if (!route || typeof route !== "object" || Array.isArray(route)) return null;
  const resolution = resolveReferenceTarget({
    message: turn?.message || "",
    referenceState: turn?.context?.referenceState || {},
    route
  });
  route.referenceResolution = resolution;
  return resolution;
}

function referenceResolutionBlocks(resolution = null) {
  if (!resolution || typeof resolution !== "object") return false;
  if (resolution?.requiresClarification === true) return true;
  return resolution?.status === "ambiguous" || resolution?.status === "unresolved";
}

function availableToolNames(tools = []) {
  const values = Array.isArray(tools) ? tools : [];
  return new Set(
    values
      .map((tool) => typeof tool === "string" ? tool : (tool?.type === "function" ? tool?.name : ""))
      .map((name) => clean(name, 120))
      .filter(Boolean)
  );
}

function matchesDirectCommand(message = "", verbs = []) {
  const alternatives = verbs.map(escapeRegex).join("|");
  if (!alternatives) return false;
  const ari = "(?:(?:(?:hey|hi)\\s+)?ari[,:-]?\\s*)?";
  const direct = new RegExp(`^${ari}(?:please\\s+)?(?:${alternatives})\\b`, "i");
  const ask = new RegExp(`^${ari}(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(?:${alternatives})\\b`, "i");
  const want = new RegExp(`^${ari}i\\s+(?:want|need)\\s+you\\s+to\\s+(?:please\\s+)?(?:${alternatives})\\b`, "i");
  return direct.test(message) || ask.test(message) || want.test(message);
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
