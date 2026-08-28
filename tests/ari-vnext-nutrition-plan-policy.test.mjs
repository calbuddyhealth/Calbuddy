import assert from "node:assert/strict";
import test from "node:test";

import {
  NUTRITION_PLAN_POLICY_VERSION,
  normalizeNutritionPlanReview
} from "../api/_lib/ari-vnext/nutrition-plan-policy.js";

test("Nutrition Plan future-date limitation is a domain-policy outcome, not an authorization failure", () => {
  const result = normalizeNutritionPlanReview({
    route: { nutrition: true },
    review: {
      decision: "blocked_future_meal_plan",
      confidence: 0.96,
      source: "semantic_verifier"
    }
  });

  assert.equal(NUTRITION_PLAN_POLICY_VERSION, "1.0.0");
  assert.equal(result.decision, "none");
  assert.equal(result.source, "nutrition_plan_policy");
  assert.equal(result.legacyDecision, "blocked_future_meal_plan");
  assert.equal(result.domainPolicy.domain, "nutrition");
  assert.equal(result.domainPolicy.capability, "meal_plan");
  assert.equal(result.domainPolicy.code, "future_date_not_supported");
  assert.equal(result.domainPolicy.allowed, false);
  assert.equal(result.domainPolicy.supportedScope, "today");
});

test("Nutrition Plan missing calorie budget is a domain-policy outcome, not an authorization failure", () => {
  const result = normalizeNutritionPlanReview({
    route: { nutrition: true },
    review: {
      decision: "blocked_missing_daily_goal",
      confidence: 0.91,
      source: "semantic_verifier"
    }
  });

  assert.equal(result.decision, "none");
  assert.equal(result.source, "nutrition_plan_policy");
  assert.equal(result.legacyDecision, "blocked_missing_daily_goal");
  assert.equal(result.domainPolicy.code, "calorie_budget_required");
  assert.equal(result.domainPolicy.requiresInput, "daily_calorie_goal_or_explicit_calorie_target");
});

test("Nutrition Plan policy does not rewrite ordinary trusted operation decisions", () => {
  const review = {
    decision: "propose_today_meal_plan",
    confidence: 1,
    source: "deterministic_direct_mutation"
  };

  assert.equal(
    normalizeNutritionPlanReview({ route: { nutrition: true }, review }),
    review
  );
});

test("Nutrition Plan policy cannot reinterpret non-Nutrition routes", () => {
  const review = {
    decision: "blocked_future_meal_plan",
    confidence: 1,
    source: "test"
  };

  assert.equal(
    normalizeNutritionPlanReview({ route: { training: true, nutrition: false }, review }),
    review
  );
});
