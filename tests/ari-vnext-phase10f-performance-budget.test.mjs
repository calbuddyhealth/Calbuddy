import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  classifyPerformanceTurn,
  evaluatePerformanceBudget,
  getPerformanceBudget,
  PERFORMANCE_BUDGET_VERSION,
  PHASE10_COMPONENTS
} from "../api/_lib/ari-vnext/performance-budget.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const budgetSource = await read("api/_lib/ari-vnext/performance-budget.js");
const wrapper = await read("api/_lib/ari-vnext/orchestrator.js");
const optimizer = await read("api/_lib/ari-vnext/model-call-optimizer.js");
const modelPolicy = await read("api/_lib/ari-vnext/model-policy.js");
const contextBudget = await read("api/_lib/ari-vnext/context-budget.js");
const compoundPlanner = await read("api/_lib/ari-vnext/compound-primary-planner.js");
const optimizationTrace = await read("api/_lib/ari-vnext/optimization-trace.js");

function trace({
  callCount = 1,
  failedCallCount = 0,
  primary = 1,
  semantic = 0,
  forced = 0,
  repair = 0,
  confirmation = 0,
  avoidedPrimary = 0,
  avoidedConfirmation = 0,
  totalTokens = 1000,
  modelLatencyMs = 1000,
  costUsd = null,
  compoundClauseCount = 0
} = {}) {
  return {
    callCount,
    failedCallCount,
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
    costEstimate: { usd: costUsd }
  };
}

function result(overrides = {}) {
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
    modelPolicy: {
      routingClass: "meaningful_conversation",
      fastEligible: false
    },
    action: null,
    pendingAction: null,
    source: "ari_vnext",
    ...overrides
  };
}

test("Phase 10F publishes one completion contract spanning 10A through 10F", () => {
  assert.equal(PERFORMANCE_BUDGET_VERSION, "1.0.0");
  for (const key of [
    "optimizationTrace",
    "modelCallOptimizer",
    "modelPolicy",
    "contextBudget",
    "compoundPrimaryPlanner",
    "preparedPrimary",
    "performanceBudget"
  ]) {
    assert.equal(typeof PHASE10_COMPONENTS[key], "string");
    assert.ok(PHASE10_COMPONENTS[key].length > 0);
  }

  assert.match(optimizationTrace, /OPTIMIZATION_TRACE_VERSION/);
  assert.match(optimizer, /MODEL_CALL_OPTIMIZER_VERSION/);
  assert.match(modelPolicy, /MODEL_POLICY_VERSION/);
  assert.match(contextBudget, /CONTEXT_BUDGET_VERSION/);
  assert.match(compoundPlanner, /COMPOUND_PRIMARY_PLANNER_VERSION/);
});

test("Phase 10F classifies high-value and optimized turn classes deterministically", () => {
  assert.equal(classifyPerformanceTurn({
    result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } })
  }), "casual");

  assert.equal(classifyPerformanceTurn({
    result: result({ source: "ari_vnext_routine_action_proposal", action: { type: "proposed_action" } })
  }), "routine_log");

  assert.equal(classifyPerformanceTurn({
    result: result({ route: { health: true }, modelPolicy: { routingClass: "high_stakes", fastEligible: false } })
  }), "high_stakes");

  assert.equal(classifyPerformanceTurn({
    result: result({
      compoundAction: { sharedPrimaryUsed: true, actionCount: 2, clauses: ["a", "b"] }
    })
  }), "compound_routine_shared");
});

test("Phase 10F casual/read-only budget catches accidental extra model calls", () => {
  const pass = evaluatePerformanceBudget({
    result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } }),
    optimizationTrace: trace()
  });
  assert.equal(pass.status, "pass");
  assert.equal(pass.budget.expectedContextProfile, "minimal");

  const fail = evaluatePerformanceBudget({
    result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } }),
    optimizationTrace: trace({ callCount: 2, primary: 2 })
  });
  assert.equal(fail.status, "fail");
  assert.equal(fail.violations.some((item) => item.code === "model_call_count_exceeded"), true);
  assert.equal(fail.violations.some((item) => item.code === "stage_primary_exceeded"), true);
});

test("Phase 10F routine-log budget prevents redundant confirmation continuation from returning", () => {
  const base = result({
    source: "ari_vnext_routine_action_proposal",
    action: { type: "proposed_action" },
    pendingAction: { id: "pending_log" },
    route: { goals: true, followUp: false },
    modelPolicy: { routingClass: "simple_app", fastEligible: true }
  });

  const pass = evaluatePerformanceBudget({
    result: base,
    optimizationTrace: trace({ callCount: 1 })
  });
  assert.equal(pass.status, "pass");
  assert.equal(pass.budget.expectedContextProfile, "focused");

  const fail = evaluatePerformanceBudget({
    result: base,
    optimizationTrace: trace({ callCount: 2, confirmation: 1 })
  });
  assert.equal(fail.status, "fail");
  assert.equal(fail.violations.some((item) => item.code === "stage_confirmation_continuation_exceeded"), true);
});

test("Phase 10F shared routine compound budget requires one actual primary and one avoided clause-primary per clause", () => {
  const compound = result({
    compoundAction: {
      sharedPrimaryUsed: true,
      actionCount: 2,
      clauses: ["Log meal", "Log weight"],
      independentCorePasses: true,
      canonicalPreflightRequired: true,
      oneConfirmationRequired: true
    }
  });

  const pass = evaluatePerformanceBudget({
    result: compound,
    optimizationTrace: trace({
      callCount: 1,
      primary: 1,
      avoidedPrimary: 2,
      compoundClauseCount: 2
    })
  });
  assert.equal(pass.status, "pass");
  assert.equal(pass.turnClass, "compound_routine_shared");
  assert.equal(pass.budget.expectedContextProfile, "focused");
  assert.equal(pass.budget.maxStageCounts.primary, 1);

  const lostSavings = evaluatePerformanceBudget({
    result: compound,
    optimizationTrace: trace({
      callCount: 2,
      primary: 2,
      avoidedPrimary: 1,
      compoundClauseCount: 2
    })
  });
  assert.equal(lostSavings.status, "fail");
  assert.equal(lostSavings.violations.some((item) => item.code === "stage_primary_exceeded"), true);
  assert.equal(lostSavings.violations.some((item) => item.code === "avoided_primary_below_minimum"), true);
});

test("Phase 10F shared compound budget preserves independent core passes and canonical preflight", () => {
  const bad = evaluatePerformanceBudget({
    result: result({
      compoundAction: {
        sharedPrimaryUsed: true,
        actionCount: 2,
        clauses: ["a", "b"],
        independentCorePasses: false,
        canonicalPreflightRequired: false
      }
    }),
    optimizationTrace: trace({ avoidedPrimary: 2, compoundClauseCount: 2 })
  });

  assert.equal(bad.status, "fail");
  assert.equal(bad.violations.some((item) => item.code === "compound_independent_core_passes_missing"), true);
  assert.equal(bad.violations.some((item) => item.code === "compound_canonical_preflight_missing"), true);
});

test("Phase 10F independent compound fallback allows Phase 9C fanout without pretending savings happened", () => {
  const fallback = evaluatePerformanceBudget({
    result: result({
      compoundAction: {
        sharedPrimaryUsed: false,
        actionCount: 2,
        clauses: ["Delete second", "Log weight"],
        independentCorePasses: true,
        canonicalPreflightRequired: true
      }
    }),
    optimizationTrace: trace({
      callCount: 2,
      primary: 2,
      avoidedPrimary: 0,
      compoundClauseCount: 2
    })
  });

  assert.equal(fallback.status, "pass");
  assert.equal(fallback.turnClass, "compound_independent");
  assert.equal(fallback.budget.expectedContextProfile, "mixed");
});

test("Phase 10F rejects cost-downgrade of health/current/deep/cross-domain routes", () => {
  for (const routeAndClass of [
    [{ health: true }, "high_stakes"],
    [{ currentInfo: true }, "current"],
    [{ developer: true }, "deep_reasoning"],
    [{ training: true, nutrition: true, coachingState: true }, "cross_domain_coaching"]
  ]) {
    const [route, routingClass] = routeAndClass;
    const report = evaluatePerformanceBudget({
      result: result({ route, modelPolicy: { routingClass, fastEligible: true } }),
      optimizationTrace: trace()
    });
    assert.equal(report.status, "fail");
    assert.equal(report.violations.some((item) => item.code === "strong_model_route_downgraded"), true);
    assert.equal(report.budget.expectedContextProfile, "full");
  }
});

test("Phase 10F latency and token ceilings warn rather than making live timing a trust failure", () => {
  const report = evaluatePerformanceBudget({
    result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } }),
    optimizationTrace: trace({ totalTokens: 7000, modelLatencyMs: 13000 })
  });

  assert.equal(report.status, "warn");
  assert.equal(report.violations.length, 0);
  assert.equal(report.warnings.some((item) => item.code === "token_warning_budget_exceeded"), true);
  assert.equal(report.warnings.some((item) => item.code === "latency_warning_budget_exceeded"), true);
});

test("Phase 10F cost ceiling is configuration-driven and can be disabled per class", () => {
  const previous = process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON;
  try {
    process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON = JSON.stringify({
      casual: { warnCostUsd: 0.01 }
    });
    const warned = evaluatePerformanceBudget({
      result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } }),
      optimizationTrace: trace({ costUsd: 0.02 })
    });
    assert.equal(warned.status, "warn");
    assert.equal(warned.warnings.some((item) => item.code === "cost_warning_budget_exceeded"), true);
    assert.equal(warned.budget.telemetryBudgetSource, "configured_override");

    process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON = JSON.stringify({
      casual: { warnCostUsd: null }
    });
    const disabled = evaluatePerformanceBudget({
      result: result({ route: { casualConversation: true }, modelPolicy: { routingClass: "casual" } }),
      optimizationTrace: trace({ costUsd: 10 })
    });
    assert.equal(disabled.warnings.some((item) => item.code === "cost_warning_budget_exceeded"), false);
  } finally {
    if (previous === undefined) delete process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON;
    else process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON = previous;
  }
});

test("Phase 10F runtime report is observational only and never becomes mutation authority", () => {
  assert.match(budgetSource, /observability_only_runtime_ci_asserted/);
  assert.doesNotMatch(budgetSource, /createPendingAction|validateToolCall|AriVNextOperationRegistry|CalBuddy\.executeAction|supabase|\.rpc\(/i);

  assert.match(wrapper, /evaluatePerformanceBudget/);
  assert.match(wrapper, /const result = await runObservedAriVNext\(turn, trace\)/);
  assert.match(wrapper, /const optimizationTrace = summarizeOptimizationTrace\(trace\)/);
  assert.match(wrapper, /performanceBudget/);
  assert.match(wrapper, /if \(clauses\.length < 2\) return await runAriVNextCore\(turn\)/);
  assert.match(wrapper, /runAriVNextCore\(\{/);
  assert.doesNotMatch(wrapper, /performanceBudget.*(?:throw|return false|execute)/s);
});

test("Phase 10F structural budgets are bounded and stage-complete", () => {
  for (const turnClass of [
    "casual",
    "meaningful_conversation",
    "simple_app",
    "routine_log",
    "reference_mutation",
    "current",
    "high_stakes",
    "deep_reasoning",
    "cross_domain_coaching",
    "compound_routine_shared",
    "compound_independent",
    "standard"
  ]) {
    const budget = getPerformanceBudget(turnClass, { clauseCount: 3 });
    assert.ok(budget.maxCallCount >= 1);
    for (const stage of ["primary", "semantic_verifier", "forced_tool", "tool_repair", "confirmation_continuation"]) {
      assert.equal(typeof budget.maxStageCounts[stage], "number");
    }
  }
});
