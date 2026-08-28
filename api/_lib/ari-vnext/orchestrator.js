// ARI vNext — Phase 9C compound-aware orchestration wrapper.
// Phase 10A adds request-scoped model-call/token/latency auditing around the
// existing trust path without changing what Ari is allowed to do.
// Phase 10D applies trust-preserving context budgets before each single-action
// core pass while leaving canonical app/reference state intact.
// Phase 10E can share one bounded primary interpretation across independent
// deterministic clauses; every clause still traverses the mature core afterward.
// Phase 10F evaluates structural performance budgets after orchestration only.
// Phase 11A/B records sanitized decisions/outcomes outside the trusted core.

import { COMPOUND_ACTION_VERSION, MAX_COMPOUND_ACTIONS, splitCompoundActionClauses } from "./compound-actions.js";
import { planCompoundPrimary, COMPOUND_PRIMARY_PLANNER_VERSION } from "./compound-primary-planner.js";
import { budgetTurnContext } from "./context-budget.js";
import { buildAriDecisionTrace, buildAriFailureTrace } from "./decision-trace.js";
import { recordAriObservabilityTurn, ARI_OBSERVABILITY_STORE_VERSION } from "./observability-store.js";
import { runAriVNext as runAriVNextCore } from "./orchestrator-core.js";
import {
  markCompoundFanout,
  summarizeOptimizationTrace,
  withOptimizationTrace
} from "./optimization-trace.js";
import { evaluatePerformanceBudget } from "./performance-budget.js";
import { createPendingAction } from "./pending-action.js";
import { withPreparedPrimary } from "./prepared-primary.js";

const BATCHABLE_OPERATIONS = new Set([
  "log_meal",
  "log_activity",
  "log_weight",
  "update_goal",
  "plan_meal",
  "log_planned_meal",
  "create_circle_meetup",
  "join_circle_meetup",
  "leave_circle_meetup",
  "cancel_circle_meetup",
  "create_circle_mission",
  "join_circle_mission",
  "submit_circle_mission_progress",
  "create_circle_crew",
  "accept_circle_crew_invite",
  "decline_circle_crew_invite",
  "leave_circle_crew",
  "archive_circle_crew",
  "plan_workout",
  "edit_workout",
  "update_nutrition_meal",
  "undo_nutrition_mutation",
  "update_weight_log",
  "delete_weight_log",
  "update_activity_log",
  "delete_activity_log",
  "edit_referenced_workout",
  "delete_workout",
  "log_referenced_planned_meal",
  "log_referenced_plan_components",
  "discard_referenced_meal_plan",
  "replace_referenced_meal_plan"
]);

const DESTRUCTIVE_OPERATIONS = new Set([
  "undo_nutrition_mutation",
  "discard_referenced_meal_plan",
  "delete_weight_log",
  "delete_activity_log",
  "delete_workout",
  "cancel_circle_meetup",
  "leave_circle_meetup",
  "leave_circle_crew",
  "archive_circle_crew"
]);

const STRONG_COMPOUND_SIGNAL = /(?:;|,\s*(?:and\s+)?then\b|\band\s+then\b|\bthen\b|,\s*(?:log|record|save|add|change|update|edit|correct|fix|remove|delete|undo|discard|replace|swap|move|set|make|clear|cancel)\b|\band\s+(?:log|record|save|add|remove|delete|undo|discard|replace|swap|move|clear|cancel)\b)/i;

async function persistSuccessfulObservation(turn = {}, result = {}) {
  try {
    const decisionTrace = buildAriDecisionTrace({ turn, result });
    const persistence = await recordAriObservabilityTurn({
      userId: turn?.userId || null,
      turnId: turn?.turnId || null,
      conversationId: turn?.conversationId || null,
      trace: decisionTrace
    });
    return {
      ...result,
      decisionTrace,
      observability: {
        version: ARI_OBSERVABILITY_STORE_VERSION,
        stored: persistence?.stored === true,
        reason: clean(persistence?.reason, 100) || null
      }
    };
  } catch {
    return {
      ...result,
      observability: {
        version: ARI_OBSERVABILITY_STORE_VERSION,
        stored: false,
        reason: "observation_error"
      }
    };
  }
}

async function rethrowObservedError({ turn = {}, error = null, trace = null } = {}) {
  try {
    const optimizationTrace = summarizeOptimizationTrace(trace);
    const decisionTrace = buildAriFailureTrace({ turn, error, optimizationTrace });
    await recordAriObservabilityTurn({
      userId: turn?.userId || null,
      turnId: turn?.turnId || null,
      conversationId: turn?.conversationId || null,
      trace: decisionTrace
    });
    if (error && typeof error === "object") error.ariDecisionTrace = decisionTrace;
  } catch {
    // Observability is fail-soft and must never replace the original failure.
  }
  throw error;
}

export async function runAriVNext(turn = {}) {
  return await withOptimizationTrace(turn, async (trace) => {
    const result = await runObservedAriVNext(turn, trace).catch(async (error) => await rethrowObservedError({ turn, error, trace }));
    const optimizationTrace = summarizeOptimizationTrace(trace);
    const performanceBudget = evaluatePerformanceBudget({
      turn,
      result,
      optimizationTrace
    });
    const observedResult = {
      ...result,
      optimizationTrace,
      performanceBudget
    };
    return await persistSuccessfulObservation(turn, observedResult);
  });
}

async function runObservedAriVNext(turn = {}, trace = null) {
  const clauses = compoundClauses(turn?.message || "");

  if (clauses.length < 2) {
    const budgeted = budgetTurnContext(turn);
    turn = {
      ...budgeted.turn,
      phase10dContextBudget: budgeted.budget
    };
  }
  if (clauses.length < 2) return await runAriVNextCore(turn);

  markCompoundFanout(trace, clauses.length);
  const sharedPlan = await planCompoundPrimary({ turn, clauses });

  const subResults = await Promise.all(clauses.map(async (clause, index) => {
    const budgeted = budgetTurnContext({
      ...turn,
      message: clause,
      pendingAction: null,
      phase9cCompound: {
        version: COMPOUND_ACTION_VERSION,
        index,
        total: clauses.length,
        originalMessage: clean(turn?.message, 1600)
      }
    });

    const runCore = async () => await runAriVNextCore({
      ...budgeted.turn,
      phase10dContextBudget: budgeted.budget,
      phase10eSharedPrimary: sharedPlan?.usable === true
        ? {
            version: COMPOUND_PRIMARY_PLANNER_VERSION,
            index,
            total: clauses.length,
            prepared: true
          }
        : null
    });

    const prepared = sharedPlan?.usable === true ? sharedPlan.preparedCalls?.[index] : null;
    return prepared
      ? await withPreparedPrimary(prepared, runCore)
      : await runCore();
  }));

  const providerInputs = sharedPlan?.provider
    ? [{ provider: sharedPlan.provider }, ...subResults]
    : subResults;

  const proposals = [];
  for (let index = 0; index < subResults.length; index += 1) {
    const result = subResults[index] || {};
    const pending = result?.pendingAction || null;
    const proposed = result?.action?.type === "proposed_action";
    const name = clean(pending?.name, 120);

    if (!pending?.id || !pending?.sourceTurnId || !proposed || !BATCHABLE_OPERATIONS.has(name)) {
      return blockedCompoundResult({
        turn,
        clauses,
        subResults,
        failedIndex: index,
        failedResult: result,
        sharedProvider: sharedPlan?.provider || null,
        sharedPrimaryUsed: sharedPlan?.usable === true
      });
    }

    proposals.push({
      index,
      name,
      toolName: "",
      arguments: pending?.arguments && typeof pending.arguments === "object" && !Array.isArray(pending.arguments)
        ? pending.arguments
        : {},
      clause: clauses[index],
      sourcePendingId: clean(pending.id, 220)
    });
  }

  const conflict = compoundConflict(proposals);
  if (conflict) {
    return blockedCompoundResult({
      turn,
      clauses,
      subResults,
      failedIndex: conflict.index,
      failedResult: null,
      reason: conflict.reason,
      sharedProvider: sharedPlan?.provider || null,
      sharedPrimaryUsed: sharedPlan?.usable === true
    });
  }

  const pendingAction = createPendingAction({
    turn,
    name: "compound_action_batch",
    args: { actions: proposals },
    confirmationRequired: true
  });
  const primary = subResults[0] || {};
  const sharedPrimaryUsed = sharedPlan?.usable === true;

  return {
    ...primary,
    success: true,
    ready: true,
    reply: `I’ve got ${proposals.length} changes ready to apply together. Review them below and confirm once.`,
    route: mergeRoutes(subResults.map((result) => result?.route)),
    pendingAction,
    action: {
      type: "proposed_action",
      applicationAction: "compound_action_batch",
      pendingActionId: pendingAction.id,
      arguments: pendingAction.arguments
    },
    provider: aggregateProvider(providerInputs),
    semanticActionReview: {
      version: COMPOUND_ACTION_VERSION,
      decision: "compound_action_batch",
      confidence: 1,
      reason: "Every compound clause independently produced a trusted confirmation-required application proposal.",
      model: null
    },
    compoundAction: {
      version: COMPOUND_ACTION_VERSION,
      actionCount: proposals.length,
      clauses,
      independentlyPrepared: true,
      independentCorePasses: true,
      oneConfirmationRequired: true,
      canonicalPreflightRequired: true,
      sharedPrimaryUsed,
      sharedPrimaryVersion: sharedPrimaryUsed ? COMPOUND_PRIMARY_PLANNER_VERSION : null,
      sharedPrimaryFallbackReason: sharedPrimaryUsed ? null : clean(sharedPlan?.reason, 160) || null
    },
    source: sharedPrimaryUsed
      ? "ari_vnext_phase10e_compound_action_proposal"
      : "ari_vnext_phase9c_compound_action_proposal"
  };
}

function compoundClauses(message = "") {
  const text = clean(message, 1800);
  if (!text || !STRONG_COMPOUND_SIGNAL.test(text)) return [];
  const clauses = splitCompoundActionClauses(text, 2);
  if (clauses.length < 2 || clauses.length > MAX_COMPOUND_ACTIONS) return [];
  return clauses;
}

function compoundConflict(actions = []) {
  const seen = new Set();
  const byReference = new Map();

  for (const action of actions) {
    const duplicateKey = `${action.name}|${stableJson(action.arguments)}`;
    if (seen.has(duplicateKey)) return { index: action.index, reason: "Two compound clauses resolved to the exact same mutation. Tell Ari which one you want once." };
    seen.add(duplicateKey);

    const referenceId = clean(action?.arguments?.referenceId, 180);
    if (!referenceId) continue;
    if (!byReference.has(referenceId)) byReference.set(referenceId, []);
    byReference.get(referenceId).push(action);
  }

  for (const group of byReference.values()) {
    if (group.length < 2) continue;
    if (group.some((action) => DESTRUCTIVE_OPERATIONS.has(action.name))) {
      return {
        index: group.find((action) => DESTRUCTIVE_OPERATIONS.has(action.name))?.index || 0,
        reason: "That request both changes and removes the same saved item. I need you to choose which outcome you want before I prepare it."
      };
    }
  }
  return null;
}

function blockedCompoundResult({
  turn = {},
  clauses = [],
  subResults = [],
  failedIndex = 0,
  failedResult = null,
  reason = "",
  sharedProvider = null,
  sharedPrimaryUsed = false
} = {}) {
  const failed = failedResult || subResults[failedIndex] || {};
  const reply = clean(reason, 1200) || clean(failed?.reply, 1200) ||
    `I can handle those changes together, but change ${failedIndex + 1} is not safe to prepare yet. Specify the exact target for that change and I won’t guess.`;
  const providerInputs = sharedProvider ? [{ provider: sharedProvider }, ...subResults] : subResults;

  return {
    ...failed,
    success: true,
    ready: true,
    reply,
    pendingAction: null,
    action: null,
    provider: aggregateProvider(providerInputs),
    compoundAction: {
      version: COMPOUND_ACTION_VERSION,
      blocked: true,
      failedIndex,
      clauses,
      preparedCount: subResults.filter((result) => result?.pendingAction?.id && result?.action?.type === "proposed_action").length,
      sharedPrimaryUsed: Boolean(sharedPrimaryUsed)
    },
    source: "ari_vnext_phase9c_compound_action_blocked",
    turn: turn?.turnId ? { turnId: turn.turnId } : undefined
  };
}

function mergeRoutes(routes = []) {
  const values = routes.filter((route) => route && typeof route === "object" && !Array.isArray(route));
  if (!values.length) return {};
  const merged = { ...values[0] };
  for (const route of values.slice(1)) {
    for (const [key, value] of Object.entries(route)) {
      if (typeof value === "boolean") merged[key] = Boolean(merged[key] || value);
    }
  }
  return merged;
}

function aggregateProvider(results = []) {
  const providers = results.map((result) => result?.provider).filter((provider) => provider?.usage);
  if (!providers.length) return results.find((result) => result?.provider)?.provider || null;
  const ids = providers.map((provider) => clean(provider?.id, 160)).filter(Boolean);
  const models = providers.map((provider) => clean(provider?.model, 120)).filter(Boolean);
  return {
    id: ids.length ? `compound:${ids.join("+").slice(0, 180)}` : null,
    model: models[0] || null,
    usage: sumUsage(providers.map((provider) => provider.usage)),
    compoundModels: [...new Set(models)]
  };
}

function sumUsage(usages = []) {
  const output = {};
  for (const usage of usages) mergeNumbers(output, usage);
  return output;
}

function mergeNumbers(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      target[key] = Number(target[key] || 0) + value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = target[key] && typeof target[key] === "object" ? target[key] : {};
      mergeNumbers(target[key], value);
    }
  }
  return target;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}