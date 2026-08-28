// ARI vNext — Phase 11E routing/context/performance scenario catalog.
// The catalog stores safe expected routing/performance codes only.

import { defineAriEvalScenario, expectation } from "./eval-engine.js";

export const ARI_PERFORMANCE_EVAL_SUITE_VERSION = "11E.1.0";

export const ARI_PERFORMANCE_EVAL_SCENARIOS = Object.freeze([
  scenario("advanced_simple_training_fast", [
    expectation("routingClass", "exact", "simple_app"),
    expectation("fastEligible", "exact", true),
    expectation("costTier", "exact", "owner_fast"),
    expectation("contextProfile", "exact", "focused")
  ]),
  scenario("advanced_meaningful_conversation_strong", [
    expectation("routingClass", "exact", "meaningful_conversation"),
    expectation("fastEligible", "exact", false),
    expectation("costTier", "exact", "owner_advanced_sol"),
    expectation("contextProfile", "exact", "balanced")
  ]),
  scenario("advanced_nutrition_logging_dedicated", [
    expectation("routingClass", "exact", "nutrition_logging"),
    expectation("nutritionResolutionModel", "exact", true),
    expectation("costTier", "exact", "nutrition_economy"),
    expectation("contextProfile", "exact", "focused")
  ]),
  scenario("advanced_nutrition_advice_strong", [
    expectation("routingClass", "exact", "nutrition_advice"),
    expectation("fastEligible", "exact", false),
    expectation("costTier", "exact", "owner_advanced_sol"),
    expectation("contextProfile", "exact", "balanced")
  ]),
  scenario("casual_fast_minimal", [
    expectation("routingClass", "exact", "casual"),
    expectation("fastEligible", "exact", true),
    expectation("contextProfile", "exact", "minimal")
  ]),
  scenario("health_strong_full", strongFull("high_stakes")),
  scenario("current_strong_full", strongFull("current")),
  scenario("developer_strong_full", strongFull("deep_reasoning")),
  scenario("cross_domain_strong_full", strongFull("cross_domain_coaching")),
  scenario("shared_compound_budget_pass", [
    expectation("status", "exact", "pass"),
    expectation("turnClass", "exact", "compound_routine_shared"),
    expectation("contextProfile", "exact", "focused"),
    expectation("primaryCalls", "exact", 1),
    expectation("avoidedPrimary", "exact", 2),
    expectation("canonicalPreflight", "exact", true),
    expectation("independentCorePasses", "exact", true)
  ]),
  scenario("shared_compound_lost_savings_fail", [
    expectation("status", "exact", "fail"),
    expectation("primaryExceeded", "exact", true),
    expectation("avoidedPrimaryBelowMinimum", "exact", true)
  ]),
  scenario("independent_compound_fallback_pass", [
    expectation("status", "exact", "pass"),
    expectation("turnClass", "exact", "compound_independent"),
    expectation("contextProfile", "exact", "mixed"),
    expectation("avoidedPrimary", "exact", 0)
  ]),
  scenario("strong_route_downgrade_fail", [
    expectation("status", "exact", "fail"),
    expectation("strongModelDowngrade", "exact", true),
    expectation("contextProfile", "exact", "full")
  ]),
  scenario("telemetry_token_latency_warn_only", [
    expectation("status", "exact", "warn"),
    expectation("structuralViolationCount", "exact", 0),
    expectation("tokenWarning", "exact", true),
    expectation("latencyWarning", "exact", true)
  ])
]);

function strongFull(routingClass) {
  return [
    expectation("routingClass", "exact", routingClass),
    expectation("requiresStrongModel", "exact", true),
    expectation("fastEligible", "exact", false),
    expectation("contextProfile", "exact", "full")
  ];
}

function scenario(id, expectations) {
  return defineAriEvalScenario({
    id,
    category: "routing_context_performance",
    tags: ["phase11e", "offline", "deterministic"],
    expectations
  });
}
