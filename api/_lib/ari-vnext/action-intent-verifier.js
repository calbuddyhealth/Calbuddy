// ARI vNext — simple deterministic mutation intent facade.
//
// The primary Ari model chooses the capability. This layer does NOT spend a
// second model call re-judging the first model. It only checks that the selected
// function is actually available for the current route and preserves the mature
// deterministic reference/routine checks where they add value.
//
// Safety remains downstream and independent: tool validation, canonical
// reference resolution, account ownership, pending-action scoping, domain
// policy, and repository constraints still decide whether a mutation can run.

import {
  reviewDeterministicRoutineLogIntent as reviewCoreDeterministicRoutineLogIntent
} from "./action-intent-verifier-core.js";
import { normalizeNutritionPlanReview } from "./nutrition-plan-policy.js";

const DIRECT_SAFE_TOOLS = Object.freeze({
  propose_update_goal: ["set", "update", "change"],
  propose_plan_workout: ["plan", "create", "build", "make"],
  propose_create_circle_meetup: ["create", "host", "schedule", "make"],
  propose_create_circle_mission: ["create", "start", "make"],
  propose_create_circle_crew: ["create", "make", "form"]
});

const REFERENCE_LANGUAGE = /\b(?:it|that|this|those|these|them|one|ones|first|second|third|former|latter|same|previous|other)\b/i;

export function reviewDeterministicRoutineLogIntent(args = {}) {
  return reviewCoreDeterministicRoutineLogIntent(args);
}

export async function reviewExplicitApplicationIntent(args = {}) {
  const deterministic = reviewCoreDeterministicRoutineLogIntent(args);
  if (deterministic) {
    return normalizeNutritionPlanReview({ review: deterministic, route: args?.route || {} });
  }

  const direct = reviewDeterministicDirectMutation(args);
  if (direct) {
    return normalizeNutritionPlanReview({ review: direct, route: args?.route || {} });
  }

  const decision = clean(args?.functionCall?.name, 120);
  if (!decision) return null;

  const available = availableToolNames(args?.tools);
  if (!available.has(decision)) return null;

  // Do not reinterpret product policy or call another LLM here. The primary
  // model already selected a capability. Canonicalization and the simple action
  // policy determine whether it executes immediately or remains reviewable.
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
    route: args?.route || {}
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

function availableToolNames(tools = []) {
  return new Set(
    (Array.isArray(tools) ? tools : [])
      .filter((tool) => tool?.type === "function" && tool?.name)
      .map((tool) => clean(tool.name, 120))
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
