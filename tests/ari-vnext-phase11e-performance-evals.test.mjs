import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAriSuite, validateScenarioPrivacy } from "../api/_lib/ari-vnext/eval-engine.js";
import { ARI_PERFORMANCE_EVAL_SCENARIOS, ARI_PERFORMANCE_EVAL_SUITE_VERSION } from "../api/_lib/ari-vnext/eval-scenarios-performance.js";
import { resolveModelPolicy, resolveRoutingClass } from "../api/_lib/ari-vnext/model-policy.js";
import { resolveContextBudgetProfile } from "../api/_lib/ari-vnext/context-budget.js";
import { evaluatePerformanceBudget } from "../api/_lib/ari-vnext/performance-budget.js";

function advancedEntitlement(reasoningProfile = "adaptive") {
  return {
    accountRole: "owner",
    accessClass: "owner",
    intelligenceTier: "owner_experimental",
    advancedEnabled: true,
    ownerEligible: true,
    premiumEligible: false,
    reasoningProfile
  };
}

function routingActual(route = {}) {
  const routing = resolveRoutingClass(route);
  const policy = resolveModelPolicy({ ...route, intelligenceEntitlement: route.intelligenceEntitlement || advancedEntitlement() });
  const context = resolveContextBudgetProfile({ route, routing });
  return {
    routingClass: policy.routingClass || routing.routingClass,
    fastEligible: policy.fastEligible === true,
    requiresStrongModel: policy.requiresStrongModel === true || routing.requiresStrongModel === true,
    nutritionResolutionModel: policy.nutritionResolutionModel === true,
    costTier: policy.costTier || null,
    contextProfile: context.name
  };
}

function trace({
  callCount = 1,
  primary = 1,
  semantic = 0,
  forced = 0,
  repair = 0,
  confirmation = 0,
  avoidedPrimary = 0,
  avoidedConfirmation = 0,
  totalTokens = 1000,
  modelLatencyMs = 1000,
  compoundClauseCount = 0
} = {}) {
  return {
    callCount,
    failedCallCount: 0,
    compoundClauseCount,
    stageCounts: {
      primary,
      semantic_verifier: semantic,
      forced_tool: forced,
      tool_repair: repair,
      confirmation_continuation: confirmation
    },
    avoidedStageCounts: {
      primary: avoidedPrimary,
      confirmation_continuation: avoidedConfirmation
    },
    usage: { total_tokens: totalTokens },
    modelLatencyMs,
    costEstimate: { usd: null }
  };
}

function baseResult(overrides = {}) {
  return {
    route: {
      nutrition: false,
      nutritionLogging: false,
      training: false,
      goals: false,
      social: false,
      health: false,
      currentInfo: false,
      developer: false,
      coachingState: false,
      casualConversation: false,
      followUp: false
    },
    modelPolicy: { routingClass: "meaningful_conversation", fastEligible: false },
    action: null,
    pendingAction: null,
    source: "ari_vnext",
    ...overrides
  };
}

function performanceActual(report, extras = {}) {
  const codes = new Set((report.violations || []).map((item) => item.code));
  const warnings = new Set((report.warnings || []).map((item) => item.code));
  return {
    status: report.status,
    turnClass: report.turnClass,
    contextProfile: report?.budget?.expectedContextProfile || null,
    structuralViolationCount: (report.violations || []).length,
    primaryExceeded: codes.has("stage_primary_exceeded"),
    avoidedPrimaryBelowMinimum: codes.has("avoided_primary_below_minimum"),
    strongModelDowngrade: codes.has("strong_model_route_downgraded"),
    tokenWarning: warnings.has("token_warning_budget_exceeded"),
    latencyWarning: warnings.has("latency_warning_budget_exceeded"),
    ...extras
  };
}

function buildActuals() {
  const simpleTraining = routingActual({
    training: true,
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  });
  const meaningful = routingActual({
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  });
  const nutritionLogging = routingActual({
    nutrition: true,
    nutritionLogging: true,
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  });
  const nutritionAdvice = routingActual({
    nutrition: true,
    nutritionLogging: false,
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  });
  const casual = routingActual({
    complexity: "fast",
    casualConversation: true,
    intelligenceEntitlement: advancedEntitlement()
  });
  const health = routingActual({ health: true, complexity: "fast", intelligenceEntitlement: advancedEntitlement("balanced") });
  const current = routingActual({ currentInfo: true, complexity: "fast", intelligenceEntitlement: advancedEntitlement("balanced") });
  const developer = routingActual({ developer: true, complexity: "fast", intelligenceEntitlement: advancedEntitlement("balanced") });
  const crossDomain = routingActual({ nutrition: true, training: true, complexity: "fast", intelligenceEntitlement: advancedEntitlement() });

  const sharedResult = baseResult({
    compoundAction: {
      sharedPrimaryUsed: true,
      actionCount: 2,
      clauses: ["clause-1", "clause-2"],
      independentCorePasses: true,
      canonicalPreflightRequired: true,
      oneConfirmationRequired: true
    }
  });
  const sharedTrace = trace({ callCount: 1, primary: 1, avoidedPrimary: 2, compoundClauseCount: 2 });
  const sharedReport = evaluatePerformanceBudget({ result: sharedResult, optimizationTrace: sharedTrace });

  const lostSavingsTrace = trace({ callCount: 2, primary: 2, avoidedPrimary: 1, compoundClauseCount: 2 });
  const lostSavings = evaluatePerformanceBudget({ result: sharedResult, optimizationTrace: lostSavingsTrace });

  const fallbackTrace = trace({ callCount: 2, primary: 2, avoidedPrimary: 0, compoundClauseCount: 2 });
  const fallback = evaluatePerformanceBudget({
    result: baseResult({
      compoundAction: {
        sharedPrimaryUsed: false,
        actionCount: 2,
        clauses: ["clause-1", "clause-2"],
        independentCorePasses: true,
        canonicalPreflightRequired: true
      }
    }),
    optimizationTrace: fallbackTrace
  });

  const downgrade = evaluatePerformanceBudget({
    result: baseResult({ route: { health: true }, modelPolicy: { routingClass: "high_stakes", fastEligible: true } }),
    optimizationTrace: trace()
  });

  const warned = evaluatePerformanceBudget({
    result: baseResult({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual", fastEligible: true } }),
    optimizationTrace: trace({ totalTokens: 7000, modelLatencyMs: 13000 })
  });

  return {
    advanced_simple_training_fast: simpleTraining,
    advanced_meaningful_conversation_strong: meaningful,
    advanced_nutrition_logging_dedicated: nutritionLogging,
    advanced_nutrition_advice_strong: nutritionAdvice,
    casual_fast_minimal: casual,
    health_strong_full: health,
    current_strong_full: current,
    developer_strong_full: developer,
    cross_domain_strong_full: crossDomain,
    shared_compound_budget_pass: performanceActual(sharedReport, {
      primaryCalls: sharedTrace.stageCounts.primary,
      avoidedPrimary: sharedTrace.avoidedStageCounts.primary,
      canonicalPreflight: sharedResult.compoundAction.canonicalPreflightRequired,
      independentCorePasses: sharedResult.compoundAction.independentCorePasses
    }),
    shared_compound_lost_savings_fail: performanceActual(lostSavings),
    independent_compound_fallback_pass: performanceActual(fallback, { avoidedPrimary: fallbackTrace.avoidedStageCounts.primary }),
    strong_route_downgrade_fail: performanceActual(downgrade),
    telemetry_token_latency_warn_only: performanceActual(warned)
  };
}

test("Phase 11E routing/context/performance catalog is privacy-safe", () => {
  assert.equal(ARI_PERFORMANCE_EVAL_SUITE_VERSION, "11E.1.0");
  assert.ok(ARI_PERFORMANCE_EVAL_SCENARIOS.length >= 12);
  for (const scenario of ARI_PERFORMANCE_EVAL_SCENARIOS) {
    assert.equal(validateScenarioPrivacy(scenario).ok, true, scenario.id);
  }
});

test("Phase 11E real Phase 10 routing and performance functions satisfy the eval suite", () => {
  const suite = evaluateAriSuite({
    suiteId: "phase11e_routing_context_performance",
    scenarios: ARI_PERFORMANCE_EVAL_SCENARIOS,
    actualById: buildActuals()
  });
  assert.equal(suite.status, "pass", JSON.stringify(suite, null, 2));
  assert.equal(suite.counts.fail, 0);
  assert.equal(suite.counts.warn, 0);
  assert.equal(suite.counts.pass, ARI_PERFORMANCE_EVAL_SCENARIOS.length);
});

test("Phase 11E scenario definitions contain no prompts replies models outputs or execution payloads", () => {
  const serialized = JSON.stringify(ARI_PERFORMANCE_EVAL_SCENARIOS);
  assert.doesNotMatch(serialized, /prompt|reply|toolArguments|mutationId|sourcePendingId|chainOfThought|hiddenReasoning/i);
});
