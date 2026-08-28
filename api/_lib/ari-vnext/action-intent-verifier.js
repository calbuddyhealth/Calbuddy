// ARI vNext — Phase 10B verifier facade.
//
// Keep the mature semantic verifier intact in action-intent-verifier-core.js.
// This facade removes only verifier calls whose CURRENT-turn write permission
// is unambiguous from bounded direct syntax. Tool validation, canonicalization,
// confirmation, reference trust, and the operation registry remain authoritative.
// Product-specific boundaries are normalized outside global authorization.
//
// Core semantic-policy anchors intentionally preserved behind this facade:
// - Circle discovery such as "anything going on tonight?" remains a discovery/read request.
// - Meetup semantics distinguish cancelling the user's OWN participation from
//   cancelling an entire HOSTED meetup; explicit action vocabulary still includes
//   join, RSVP, request a spot, leave, withdraw.
// - Mission discovery such as "What Missions are active?" remains read-only while
//   explicit progress such as "add my 3 miles to that Mission" is bounded.
// - No Mission-review mutation tool is available.
// - For ARI Circle Crews, discovery or explanation is read-only; Crew creation
//   must Never infer or invent founding members. The core distinguishes
//   "accept that Crew invite" from "decline/pass on that Crew invite", and it must
//   distinguish leaving the user's OWN membership from archiving an entire OWNED Crew.
//   No Crew tool may add arbitrary members.

import {
  reviewDeterministicRoutineLogIntent as reviewCoreDeterministicRoutineLogIntent,
  reviewExplicitApplicationIntent as reviewCoreExplicitApplicationIntent
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
  const direct = reviewDeterministicDirectMutation(args);
  if (direct) return direct;

  const review = await reviewCoreExplicitApplicationIntent(args);
  return normalizeNutritionPlanReview({
    review,
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

  const available = new Set(
    (Array.isArray(tools) ? tools : [])
      .filter((tool) => tool?.type === "function" && tool?.name)
      .map((tool) => clean(tool.name, 120))
      .filter(Boolean)
  );
  if (!available.has(decision)) return null;

  const message = clean(turn?.message, 1000);
  if (!message || REFERENCE_LANGUAGE.test(message)) return null;
  if (!matchesDirectCommand(message, verbs)) return null;

  return {
    version: "1.13.0",
    decision,
    confidence: 1,
    reason: "Explicit current-turn direct mutation command verified deterministically before semantic verifier fallback.",
    dailyGoalKnown: null,
    model: null,
    providerRequestId: null,
    usage: null,
    source: "deterministic_direct_mutation"
  };
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
