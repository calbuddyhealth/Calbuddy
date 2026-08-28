// ARI vNext — Nutrition Meal Plan product policy.
//
// Product capability rules belong here, not in global mutation authorization.
// This module converts legacy Meal Plan boundary classifications into a
// domain-policy result while preserving the global verifier's trust decision.

export const NUTRITION_PLAN_POLICY_VERSION = "1.0.0";

const LEGACY_BOUNDARIES = new Set([
  "blocked_future_meal_plan",
  "blocked_missing_daily_goal"
]);

export function normalizeNutritionPlanReview({ review = null, route = {} } = {}) {
  if (!review || typeof review !== "object" || Array.isArray(review)) return review;

  const legacyDecision = clean(review?.decision, 120);
  if (!LEGACY_BOUNDARIES.has(legacyDecision)) return review;

  // These legacy decisions are Nutrition product constraints, not evidence that
  // the user failed to authorize a write. Normalize them to a non-write result
  // and expose the product boundary separately for diagnostics/UI evolution.
  if (route?.nutrition !== true) return review;

  const future = legacyDecision === "blocked_future_meal_plan";
  const domainPolicy = future
    ? {
        version: NUTRITION_PLAN_POLICY_VERSION,
        domain: "nutrition",
        capability: "meal_plan",
        code: "future_date_not_supported",
        allowed: false,
        requestedOperation: "plan_meal",
        supportedScope: "today",
        requiresInput: null
      }
    : {
        version: NUTRITION_PLAN_POLICY_VERSION,
        domain: "nutrition",
        capability: "meal_plan",
        code: "calorie_budget_required",
        allowed: false,
        requestedOperation: "plan_meal",
        supportedScope: "today",
        requiresInput: "daily_calorie_goal_or_explicit_calorie_target"
      };

  return {
    ...review,
    // `none` means the global authorization layer is no longer pretending a
    // domain limitation is an authorization failure. The orchestrator will
    // answer conversationally with mutation tools suppressed for this turn.
    decision: "none",
    confidence: Math.max(0.9, number(review?.confidence)),
    reason: future
      ? "Nutrition Meal Plan product policy currently supports today only; authorization itself was not rejected."
      : "Nutrition Meal Plan product policy needs a calorie budget source; authorization itself was not rejected.",
    source: "nutrition_plan_policy",
    legacyDecision,
    domainPolicy
  };
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function number(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}
