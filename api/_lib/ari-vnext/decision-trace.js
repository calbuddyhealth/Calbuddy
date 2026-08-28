// ARI vNext — Phase 11A explainable decision trace.
//
// This is a decision/outcome ledger, not a reasoning transcript. It deliberately
// excludes prompt text, user/reply text, tool arguments, app payloads, memories,
// secrets, and hidden chain-of-thought.

import { budgetTurnContext } from "./context-budget.js";
import { isReferenceFollowUp, resolveReferenceTarget } from "./reference-context.js";

export const ARI_DECISION_TRACE_VERSION = "1.0.0";

const ROUTE_DOMAINS = ["nutrition", "training", "goals", "social"];

export function buildAriDecisionTrace({ turn = {}, result = {} } = {}) {
  const route = plainObject(result?.route);
  const action = plainObject(result?.action);
  const actionPolicy = plainObject(result?.actionPolicy);
  const semanticReview = plainObject(result?.semanticActionReview);
  const modelPolicy = plainObject(result?.modelPolicy);
  const optimization = plainObject(result?.optimizationTrace);
  const performance = plainObject(result?.performanceBudget);
  const compound = plainObject(result?.compoundAction);
  const contextBudget = deriveContextBudgetTrace(turn, compound);
  const reference = safeReferenceResolution(turn, route);

  return {
    version: ARI_DECISION_TRACE_VERSION,
    turnId: clean(turn?.turnId, 220) || null,
    conversationId: clean(turn?.conversationId, 220) || null,
    route: {
      activeDomains: ROUTE_DOMAINS.filter((key) => route?.[key] === true),
      followUp: route?.followUp === true,
      currentInfo: route?.currentInfo === true,
      health: route?.health === true,
      developer: route?.developer === true,
      casualConversation: route?.casualConversation === true,
      nutritionLogging: route?.nutritionLogging === true,
      coachingState: route?.coachingState === true
    },
    model: {
      model: clean(result?.provider?.model || modelPolicy?.model, 160) || null,
      routingClass: clean(modelPolicy?.routingClass, 100) || null,
      mode: clean(modelPolicy?.mode, 80) || null,
      reasoningEffort: clean(modelPolicy?.reasoningEffort, 40) || null,
      fastEligible: modelPolicy?.fastEligible === true
    },
    context: contextBudget,
    reference,
    authorization: {
      mode: authorizationMode(semanticReview),
      decision: clean(semanticReview?.decision, 160) || "none",
      confidence: boundedConfidence(semanticReview?.confidence),
      verifierModel: clean(semanticReview?.model, 160) || null
    },
    action: {
      type: clean(action?.type, 100) || "none",
      applicationAction: clean(action?.applicationAction || result?.pendingAction?.name, 160) || null,
      pending: Boolean(result?.pendingAction?.id),
      confirmation: confirmationState(result),
      policyDecision: clean(actionPolicy?.decision, 80) || null,
      risk: clean(actionPolicy?.risk, 40) || null
    },
    compound: {
      mode: compoundMode(compound),
      actionCount: nonNegative(compound?.actionCount || compound?.clauses?.length),
      independentCorePasses: compound?.independentCorePasses === true,
      canonicalPreflightRequired: compound?.canonicalPreflightRequired === true,
      blocked: compound?.blocked === true
    },
    performance: {
      status: clean(performance?.status, 40) || null,
      turnClass: clean(performance?.turnClass, 100) || null,
      callCount: nonNegative(optimization?.callCount),
      avoidedCallCount: nonNegative(optimization?.avoidedCallCount),
      failedCallCount: nonNegative(optimization?.failedCallCount),
      totalTokens: nonNegative(optimization?.usage?.total_tokens),
      modelLatencyMs: nonNegative(optimization?.modelLatencyMs),
      estimatedCostUsd: finiteNumber(optimization?.costEstimate?.usd)
    },
    outcome: {
      status: outcomeStatus(result),
      source: clean(result?.source, 180) || "ari_vnext",
      ready: result?.ready === true,
      success: result?.success !== false
    },
    privacy: {
      containsPromptText: false,
      containsUserText: false,
      containsReplyText: false,
      containsToolArguments: false,
      containsMemoryPayload: false,
      containsHiddenReasoning: false
    }
  };
}

export function buildAriFailureTrace({ turn = {}, error = null, optimizationTrace = null } = {}) {
  const optimization = plainObject(optimizationTrace);
  return {
    version: ARI_DECISION_TRACE_VERSION,
    turnId: clean(turn?.turnId, 220) || null,
    conversationId: clean(turn?.conversationId, 220) || null,
    route: {
      activeDomains: [],
      followUp: false,
      currentInfo: false,
      health: false,
      developer: false,
      casualConversation: false,
      nutritionLogging: false,
      coachingState: false
    },
    model: { model: null, routingClass: null, mode: null, reasoningEffort: null, fastEligible: false },
    context: safeFailureContextTrace(turn),
    reference: { status: "unknown", reason: "turn_failed_before_reference_outcome", candidateCount: 0, clarificationRequired: false },
    authorization: { mode: "unknown", decision: "none", confidence: 0, verifierModel: null },
    action: { type: "none", applicationAction: null, pending: false, confirmation: "none", policyDecision: null, risk: null },
    compound: { mode: "none", actionCount: 0, independentCorePasses: false, canonicalPreflightRequired: false, blocked: false },
    performance: {
      status: "error",
      turnClass: null,
      callCount: nonNegative(optimization?.callCount),
      avoidedCallCount: nonNegative(optimization?.avoidedCallCount),
      failedCallCount: nonNegative(optimization?.failedCallCount),
      totalTokens: nonNegative(optimization?.usage?.total_tokens),
      modelLatencyMs: nonNegative(optimization?.modelLatencyMs),
      estimatedCostUsd: finiteNumber(optimization?.costEstimate?.usd)
    },
    outcome: {
      status: "error",
      source: "ari_vnext_orchestrator_error",
      ready: false,
      success: false,
      errorCode: safeErrorCode(error)
    },
    privacy: {
      containsPromptText: false,
      containsUserText: false,
      containsReplyText: false,
      containsToolArguments: false,
      containsMemoryPayload: false,
      containsHiddenReasoning: false
    }
  };
}

export function assertSanitizedDecisionTrace(trace = {}) {
  const serialized = JSON.stringify(trace);
  const forbiddenKeys = [
    "message", "reply", "prompt", "instructions", "arguments", "memory", "userWorldModel",
    "relevantContext", "scientificIntelligence", "chainOfThought", "reasoningText"
  ];
  for (const key of forbiddenKeys) {
    if (new RegExp(`\\"${key}\\"\\s*:`, "i").test(serialized)) return false;
  }
  return serialized.length <= 16000;
}

function deriveContextBudgetTrace(turn = {}, compound = {}) {
  const clauses = Array.isArray(compound?.clauses)
    ? compound.clauses.map((value) => clean(value, 1800)).filter(Boolean).slice(0, 4)
    : [];

  if (clauses.length >= 2) {
    const budgets = clauses.map((clause, index) => {
      try {
        return budgetTurnContext({
          ...turn,
          message: clause,
          pendingAction: null,
          phase9cCompound: {
            version: clean(compound?.version, 40) || null,
            index,
            total: clauses.length,
            originalMessage: clean(turn?.message, 1600)
          }
        })?.budget || {};
      } catch {
        return {};
      }
    });
    return aggregateContextBudgets(budgets, clauses);
  }

  try {
    const budget = budgetTurnContext(turn)?.budget || {};
    return publicContextBudget(budget, turn?.message || "");
  } catch {
    return emptyContextTrace();
  }
}

function aggregateContextBudgets(budgets = [], clauses = []) {
  const profiles = [...new Set(budgets.map((budget) => clean(budget?.profile, 60)).filter(Boolean))];
  return {
    profile: profiles.length === 1 ? profiles[0] : profiles.length > 1 ? "mixed" : null,
    historyBefore: Math.max(0, ...budgets.map((budget) => nonNegative(budget?.historyTurnsBefore))),
    historyAfter: Math.max(0, ...budgets.map((budget) => nonNegative(budget?.historyTurnsAfter))),
    referenceHistoryFloorApplied: clauses.some((clause, index) =>
      isReferenceFollowUp(clause) && nonNegative(budgets[index]?.historyTurnsAfter) >= 6
    ),
    canonicalStatePreserved: budgets.every((budget) => budget?.canonicalContextPreserved !== false),
    referenceStatePreserved: budgets.every((budget) => budget?.referenceStatePreserved !== false)
  };
}

function publicContextBudget(budget = {}, message = "") {
  return {
    profile: clean(budget?.profile, 60) || null,
    historyBefore: nonNegative(budget?.historyTurnsBefore),
    historyAfter: nonNegative(budget?.historyTurnsAfter),
    referenceHistoryFloorApplied: isReferenceFollowUp(message) && nonNegative(budget?.historyTurnsAfter) >= 6,
    canonicalStatePreserved: budget?.canonicalContextPreserved !== false,
    referenceStatePreserved: budget?.referenceStatePreserved !== false
  };
}

function safeFailureContextTrace(turn = {}) {
  try {
    return publicContextBudget(budgetTurnContext(turn)?.budget || {}, turn?.message || "");
  } catch {
    return emptyContextTrace();
  }
}

function emptyContextTrace() {
  return {
    profile: null,
    historyBefore: 0,
    historyAfter: 0,
    referenceHistoryFloorApplied: false,
    canonicalStatePreserved: true,
    referenceStatePreserved: true
  };
}

function safeReferenceResolution(turn, route) {
  try {
    const resolution = resolveReferenceTarget({
      message: turn?.message || "",
      referenceState: turn?.context?.referenceState || null,
      route
    }) || {};
    return {
      status: clean(resolution?.status, 60) || "inactive",
      reason: clean(resolution?.reason, 120) || null,
      candidateCount: Array.isArray(resolution?.candidates) ? resolution.candidates.length : nonNegative(resolution?.candidateCount),
      clarificationRequired: resolution?.clarificationRequired === true
    };
  } catch {
    return { status: "unknown", reason: "reference_trace_unavailable", candidateCount: 0, clarificationRequired: false };
  }
}

function authorizationMode(review) {
  if (!review || !Object.keys(review).length) return "not_required";
  if (clean(review?.model, 160)) return "semantic_model";
  if (Number(review?.confidence || 0) > 0) return "deterministic";
  return "unknown";
}

function confirmationState(result = {}) {
  const actionType = clean(result?.action?.type, 100);
  const actionPolicy = plainObject(result?.actionPolicy);
  if (
    actionType === "execute_pending_action" &&
    actionPolicy?.executeImmediately === true &&
    actionPolicy?.requiresConfirmation !== true
  ) return "not_required";
  if (actionType === "execute_pending_action") return "confirmed_execute";
  if (actionType === "cancel_pending_action") return "cancelled";
  if (result?.pendingAction?.id || actionType === "proposed_action") return "required";
  return "none";
}

function compoundMode(compound = {}) {
  if (!compound || !Object.keys(compound).length) return "none";
  if (compound?.blocked === true) return "blocked";
  if (compound?.sharedPrimaryUsed === true) return "shared_primary";
  return "independent";
}

function outcomeStatus(result = {}) {
  if (result?.success === false) return "error";
  if (result?.compoundAction?.blocked === true) return "blocked";
  if (result?.action?.type === "execute_pending_action") return "execute_pending";
  if (result?.action?.type === "cancel_pending_action") return "cancelled";
  if (result?.action?.type === "proposed_action" || result?.pendingAction?.id) return "proposal";
  return "reply";
}

function safeErrorCode(error) {
  const raw = clean(error?.code || error?.name || "error", 100).toLowerCase();
  return raw.replace(/[^a-z0-9_.-]+/g, "_") || "error";
}

function boundedConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 1000) / 1000));
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
