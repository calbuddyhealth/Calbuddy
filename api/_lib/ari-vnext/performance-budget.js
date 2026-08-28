// ARI vNext — Phase 10F performance/cost regression budgets.
//
// Runtime evaluation is observational only: a budget violation never authorizes,
// blocks, retries, or executes an app mutation. CI uses the same evaluator with
// synthetic traces to make model-call regressions deterministic. Real provider
// latency/token/cost thresholds are warnings because network/model timing is not
// a stable CI primitive.

import { CONTEXT_BUDGET_VERSION } from "./context-budget.js";
import { COMPOUND_PRIMARY_PLANNER_VERSION } from "./compound-primary-planner.js";
import { MODEL_CALL_OPTIMIZER_VERSION } from "./model-call-optimizer.js";
import { MODEL_POLICY_VERSION } from "./model-policy.js";
import { OPTIMIZATION_TRACE_VERSION } from "./optimization-trace.js";
import { PREPARED_PRIMARY_VERSION } from "./prepared-primary.js";

export const PERFORMANCE_BUDGET_VERSION = "1.0.0";

export const PHASE10_COMPONENTS = Object.freeze({
  optimizationTrace: OPTIMIZATION_TRACE_VERSION,
  modelCallOptimizer: MODEL_CALL_OPTIMIZER_VERSION,
  modelPolicy: MODEL_POLICY_VERSION,
  contextBudget: CONTEXT_BUDGET_VERSION,
  compoundPrimaryPlanner: COMPOUND_PRIMARY_PLANNER_VERSION,
  preparedPrimary: PREPARED_PRIMARY_VERSION,
  performanceBudget: PERFORMANCE_BUDGET_VERSION
});

const STAGES = Object.freeze([
  "primary",
  "semantic_verifier",
  "forced_tool",
  "tool_repair",
  "confirmation_continuation"
]);

export function classifyPerformanceTurn({ turn = {}, result = {} } = {}) {
  const compound = result?.compoundAction || null;
  if (compound) {
    return compound?.sharedPrimaryUsed === true
      ? "compound_routine_shared"
      : "compound_independent";
  }

  const route = result?.route || {};
  const source = clean(result?.source, 160);
  const proposed = result?.action?.type === "proposed_action" || Boolean(result?.pendingAction?.id);
  const routingClass = clean(result?.modelPolicy?.routingClass, 80);

  if (source === "ari_vnext_routine_action_proposal") return "routine_log";
  if (route?.followUp === true && proposed) return "reference_mutation";
  if (route?.currentInfo === true) return "current";
  if (route?.health === true) return "high_stakes";
  if (route?.developer === true || routingClass === "deep_reasoning") return "deep_reasoning";
  if (route?.coachingState === true || domainCount(route) >= 2) return "cross_domain_coaching";
  if (route?.casualConversation === true || routingClass === "casual") return "casual";
  if (route?.nutrition === true && route?.nutritionLogging !== true && proposed !== true) return "nutrition_advice";
  if (routingClass === "simple_app") return proposed ? "simple_app_action" : "simple_app";
  if (routingClass === "meaningful_conversation" || domainCount(route) === 0) return "meaningful_conversation";
  return proposed ? "standard_action" : "standard";
}

export function getPerformanceBudget(turnClass = "standard", { clauseCount = 0 } = {}) {
  const count = Math.max(2, Math.min(8, Math.floor(Number(clauseCount) || 2)));
  const budgets = {
    casual: contract({
      maxCallCount: 1,
      maxStageCounts: stages({ primary: 1 }),
      expectedContextProfile: "minimal",
      warnModelLatencyMs: 12000,
      warnTotalTokens: 6000
    }),
    meaningful_conversation: contract({
      maxCallCount: 1,
      maxStageCounts: stages({ primary: 1 }),
      expectedContextProfile: "balanced",
      warnModelLatencyMs: 40000,
      warnTotalTokens: 14000
    }),
    nutrition_advice: contract({
      maxCallCount: 1,
      maxStageCounts: stages({ primary: 1 }),
      expectedContextProfile: "balanced",
      warnModelLatencyMs: 40000,
      warnTotalTokens: 14000
    }),
    simple_app: contract({
      maxCallCount: 1,
      maxStageCounts: stages({ primary: 1 }),
      expectedContextProfile: "focused",
      warnModelLatencyMs: 26000,
      warnTotalTokens: 9000
    }),
    simple_app_action: contract({
      maxCallCount: 5,
      maxStageCounts: stages({
        primary: 1,
        semantic_verifier: 1,
        forced_tool: 1,
        tool_repair: 1,
        confirmation_continuation: 1
      }),
      expectedContextProfile: "focused",
      warnModelLatencyMs: 45000,
      warnTotalTokens: 16000
    }),
    routine_log: contract({
      maxCallCount: 4,
      maxStageCounts: stages({
        primary: 1,
        semantic_verifier: 1,
        forced_tool: 1,
        tool_repair: 1,
        confirmation_continuation: 0
      }),
      expectedContextProfile: "focused",
      warnModelLatencyMs: 30000,
      warnTotalTokens: 10000
    }),
    reference_mutation: contract({
      maxCallCount: 5,
      maxStageCounts: stages({
        primary: 1,
        semantic_verifier: 1,
        forced_tool: 1,
        tool_repair: 1,
        confirmation_continuation: 1
      }),
      expectedContextProfile: "focused",
      minHistoryTurns: 6,
      warnModelLatencyMs: 45000,
      warnTotalTokens: 16000
    }),
    current: contract({
      maxCallCount: 3,
      maxStageCounts: stages({ primary: 1, semantic_verifier: 1, forced_tool: 1 }),
      expectedContextProfile: "full",
      requiresStrongModel: true,
      warnModelLatencyMs: 60000,
      warnTotalTokens: 22000
    }),
    high_stakes: contract({
      maxCallCount: 3,
      maxStageCounts: stages({ primary: 1, semantic_verifier: 1, forced_tool: 1 }),
      expectedContextProfile: "full",
      requiresStrongModel: true,
      warnModelLatencyMs: 60000,
      warnTotalTokens: 22000
    }),
    deep_reasoning: contract({
      maxCallCount: 3,
      maxStageCounts: stages({ primary: 1, semantic_verifier: 1, forced_tool: 1 }),
      expectedContextProfile: "full",
      requiresStrongModel: true,
      warnModelLatencyMs: 60000,
      warnTotalTokens: 24000
    }),
    cross_domain_coaching: contract({
      maxCallCount: 3,
      maxStageCounts: stages({ primary: 1, semantic_verifier: 1, forced_tool: 1 }),
      expectedContextProfile: "full",
      requiresStrongModel: true,
      warnModelLatencyMs: 60000,
      warnTotalTokens: 24000
    }),
    compound_routine_shared: contract({
      maxCallCount: 1 + count,
      maxStageCounts: stages({
        primary: 1,
        semantic_verifier: 0,
        forced_tool: 0,
        tool_repair: count,
        confirmation_continuation: 0
      }),
      minAvoidedStageCounts: { primary: count },
      expectedContextProfile: "focused",
      requireIndependentCorePasses: true,
      requireCanonicalPreflight: true,
      warnModelLatencyMs: 40000,
      warnTotalTokens: 14000
    }),
    compound_independent: contract({
      maxCallCount: 5 * count,
      maxStageCounts: stages({
        primary: count,
        semantic_verifier: count,
        forced_tool: count,
        tool_repair: count,
        confirmation_continuation: count
      }),
      expectedContextProfile: "mixed",
      requireIndependentCorePasses: true,
      requireCanonicalPreflight: true,
      warnModelLatencyMs: 60000,
      warnTotalTokens: 22000 * count
    }),
    standard_action: contract({
      maxCallCount: 5,
      maxStageCounts: stages({
        primary: 1,
        semantic_verifier: 1,
        forced_tool: 1,
        tool_repair: 1,
        confirmation_continuation: 1
      }),
      expectedContextProfile: "balanced",
      warnModelLatencyMs: 50000,
      warnTotalTokens: 18000
    }),
    standard: contract({
      maxCallCount: 2,
      maxStageCounts: stages({ primary: 1, semantic_verifier: 1 }),
      expectedContextProfile: "balanced",
      warnModelLatencyMs: 45000,
      warnTotalTokens: 16000
    })
  };

  const selected = budgets[turnClass] || budgets.standard;
  return applyConfiguredTelemetryBudget(turnClass, {
    version: PERFORMANCE_BUDGET_VERSION,
    turnClass,
    clauseCount: turnClass.startsWith("compound_") ? count : 0,
    ...selected
  });
}

export function evaluatePerformanceBudget({ turn = {}, result = {}, optimizationTrace = null } = {}) {
  const trace = optimizationTrace && typeof optimizationTrace === "object" ? optimizationTrace : {};
  const turnClass = classifyPerformanceTurn({ turn, result });
  const clauseCount = Number(result?.compoundAction?.actionCount || result?.compoundAction?.clauses?.length || trace?.compoundClauseCount || 0);
  const budget = getPerformanceBudget(turnClass, { clauseCount });
  const violations = [];
  const warnings = [];

  const callCount = nonNegative(trace?.callCount);
  const failedCallCount = nonNegative(trace?.failedCallCount);
  const stageCounts = trace?.stageCounts && typeof trace.stageCounts === "object" ? trace.stageCounts : {};
  const avoidedStageCounts = trace?.avoidedStageCounts && typeof trace.avoidedStageCounts === "object"
    ? trace.avoidedStageCounts
    : {};

  if (callCount > budget.maxCallCount) {
    violations.push(issue("model_call_count_exceeded", callCount, budget.maxCallCount));
  }
  if (failedCallCount > budget.maxFailedCalls) {
    violations.push(issue("provider_failure_budget_exceeded", failedCallCount, budget.maxFailedCalls));
  }

  for (const stage of STAGES) {
    const actual = nonNegative(stageCounts?.[stage]);
    const maximum = nonNegative(budget?.maxStageCounts?.[stage]);
    if (actual > maximum) violations.push(issue(`stage_${stage}_exceeded`, actual, maximum));
  }

  for (const [stage, minimumRaw] of Object.entries(budget?.minAvoidedStageCounts || {})) {
    const actual = nonNegative(avoidedStageCounts?.[stage]);
    const minimum = nonNegative(minimumRaw);
    if (actual < minimum) violations.push(issue(`avoided_${stage}_below_minimum`, actual, minimum));
  }

  if (budget.requireIndependentCorePasses && result?.compoundAction && result.compoundAction.independentCorePasses !== true) {
    violations.push(issue("compound_independent_core_passes_missing", 0, 1));
  }
  if (budget.requireCanonicalPreflight && result?.compoundAction && result.compoundAction.canonicalPreflightRequired !== true) {
    violations.push(issue("compound_canonical_preflight_missing", 0, 1));
  }
  if (turnClass === "compound_routine_shared" && result?.compoundAction?.sharedPrimaryUsed !== true) {
    violations.push(issue("shared_primary_contract_missing", 0, 1));
  }
  if (budget.requiresStrongModel && result?.modelPolicy && result.modelPolicy.fastEligible === true) {
    violations.push(issue("strong_model_route_downgraded", 1, 0));
  }

  const totalTokens = nonNegative(trace?.usage?.total_tokens);
  const modelLatencyMs = nonNegative(trace?.modelLatencyMs);
  const costUsd = finiteNumber(trace?.costEstimate?.usd);

  if (budget.warnTotalTokens != null && totalTokens > budget.warnTotalTokens) {
    warnings.push(issue("token_warning_budget_exceeded", totalTokens, budget.warnTotalTokens));
  }
  if (budget.warnModelLatencyMs != null && modelLatencyMs > budget.warnModelLatencyMs) {
    warnings.push(issue("latency_warning_budget_exceeded", modelLatencyMs, budget.warnModelLatencyMs));
  }
  if (budget.warnCostUsd != null && costUsd != null && costUsd > budget.warnCostUsd) {
    warnings.push(issue("cost_warning_budget_exceeded", costUsd, budget.warnCostUsd));
  }

  return {
    version: PERFORMANCE_BUDGET_VERSION,
    status: violations.length ? "fail" : warnings.length ? "warn" : "pass",
    enforcement: "observability_only_runtime_ci_asserted",
    turnClass,
    budget,
    observed: {
      callCount,
      failedCallCount,
      stageCounts: pickStages(stageCounts),
      avoidedStageCounts: pickStages(avoidedStageCounts),
      modelLatencyMs,
      totalTokens,
      costUsd
    },
    violations,
    warnings,
    phase10: {
      completeContractVersion: PERFORMANCE_BUDGET_VERSION,
      components: PHASE10_COMPONENTS
    }
  };
}

function contract({
  maxCallCount,
  maxStageCounts,
  minAvoidedStageCounts = {},
  expectedContextProfile,
  minHistoryTurns = 0,
  maxFailedCalls = 0,
  requiresStrongModel = false,
  requireIndependentCorePasses = false,
  requireCanonicalPreflight = false,
  warnModelLatencyMs = null,
  warnTotalTokens = null,
  warnCostUsd = null
} = {}) {
  return {
    maxCallCount,
    maxFailedCalls,
    maxStageCounts,
    minAvoidedStageCounts,
    expectedContextProfile,
    minHistoryTurns,
    requiresStrongModel,
    requireIndependentCorePasses,
    requireCanonicalPreflight,
    warnModelLatencyMs,
    warnTotalTokens,
    warnCostUsd
  };
}

function stages(overrides = {}) {
  const output = {};
  for (const stage of STAGES) output[stage] = nonNegative(overrides?.[stage]);
  return output;
}

function pickStages(value = {}) {
  const output = {};
  for (const stage of STAGES) output[stage] = nonNegative(value?.[stage]);
  return output;
}

function applyConfiguredTelemetryBudget(turnClass, budget) {
  const config = parseBudgetConfig(process.env.ARI_PHASE10F_PERFORMANCE_BUDGET_JSON);
  const globalConfig = config?.default && typeof config.default === "object" ? config.default : {};
  const classConfig = config?.[turnClass] && typeof config[turnClass] === "object" ? config[turnClass] : {};
  const merged = { ...globalConfig, ...classConfig };

  return {
    ...budget,
    warnModelLatencyMs: configuredNumber(merged.warnModelLatencyMs, budget.warnModelLatencyMs),
    warnTotalTokens: configuredNumber(merged.warnTotalTokens, budget.warnTotalTokens),
    warnCostUsd: configuredNumber(merged.warnCostUsd, budget.warnCostUsd),
    telemetryBudgetSource: Object.keys(merged).length ? "configured_override" : "phase10f_defaults"
  };
}

function parseBudgetConfig(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function configuredNumber(value, fallback) {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function issue(code, actual, budget) {
  return {
    code,
    actual: Number(actual),
    budget: Number(budget)
  };
}

function domainCount(route = {}) {
  return ["nutrition", "training", "goals", "social"]
    .reduce((count, key) => count + (route?.[key] === true ? 1 : 0), 0);
}

function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
