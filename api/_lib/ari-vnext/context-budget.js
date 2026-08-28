// ARI vNext — Phase 10D context/token budgeting.
//
// This optimizer runs before model orchestration but never removes canonical app
// collections, reference state, account/intelligence entitlements, or other
// trust inputs. It only trims conversation history and non-authoritative
// cognitive context on turns that Phase 10C already classified as cheap/simple.

import { routeContext } from "./context-router.js";
import { resolveRoutingClass } from "./model-policy.js";

export const CONTEXT_BUDGET_VERSION = "1.0.0";

const COGNITIVE_OPTIONAL_KEYS = Object.freeze([
  "userWorldModel",
  "experimentLedger",
  "decisionState",
  "communicationLearning",
  "temporalTimeline"
]);

export function budgetTurnContext(turn = {}) {
  const route = routeContext(turn);
  const routing = resolveRoutingClass(route);
  const profile = resolveContextBudgetProfile({ route, routing });
  const sourceContext = isObject(turn?.context) ? turn.context : {};
  const sourceHistory = Array.isArray(turn?.history) ? turn.history : [];
  const historyLimit = route?.followUp === true
    ? Math.max(profile.historyTurns, 6)
    : profile.historyTurns;
  const history = historyLimit >= sourceHistory.length
    ? sourceHistory
    : sourceHistory.slice(-historyLimit);
  const context = { ...sourceContext };
  const removedSections = [];

  if (profile.pruneOptionalCognitiveContext) {
    for (const key of COGNITIVE_OPTIONAL_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(context, key)) continue;
      delete context[key];
      removedSections.push(key);
    }
  }

  // Memory is only removed when the route itself did not ask for memory/continuity.
  // The source memory is never mutated and explicit reference/app state is untouched.
  const memory = profile.pruneOptionalCognitiveContext && route?.memory !== true
    ? null
    : turn?.memory;

  const budgetedTurn = {
    ...turn,
    history,
    context,
    memory
  };

  const summary = {
    version: CONTEXT_BUDGET_VERSION,
    profile: profile.name,
    routingClass: routing.routingClass,
    historyTurnsBefore: sourceHistory.length,
    historyTurnsAfter: history.length,
    removedSections,
    canonicalContextPreserved: true,
    referenceStatePreserved: context?.referenceState === sourceContext?.referenceState,
    estimatedHistoryCharsBefore: estimateHistoryChars(sourceHistory),
    estimatedHistoryCharsAfter: estimateHistoryChars(history),
    estimatedOptionalContextCharsRemoved: estimateRemovedChars(sourceContext, removedSections)
  };

  return { turn: budgetedTurn, route, routing, budget: summary };
}

export function resolveContextBudgetProfile({ route = {}, routing = resolveRoutingClass(route) } = {}) {
  const routingClass = String(routing?.routingClass || "standard");

  if (["current", "high_stakes", "deep_reasoning", "cross_domain_coaching"].includes(routingClass)) {
    return profile("full", 10, false);
  }

  if (["meaningful_conversation", "nutrition_advice", "standard"].includes(routingClass)) {
    return profile("balanced", 8, false);
  }

  if (routingClass === "casual") {
    return profile("minimal", 2, true);
  }

  if (["simple_app", "nutrition_logging"].includes(routingClass)) {
    return profile("focused", 4, true);
  }

  return profile("balanced", 8, false);
}

function profile(name, historyTurns, pruneOptionalCognitiveContext) {
  return { name, historyTurns, pruneOptionalCognitiveContext };
}

function estimateHistoryChars(history = []) {
  return (Array.isArray(history) ? history : []).reduce((total, item) => {
    return total + String(item?.content || "").length + String(item?.role || "").length;
  }, 0);
}

function estimateRemovedChars(source = {}, keys = []) {
  let total = 0;
  for (const key of keys) {
    try { total += JSON.stringify(source?.[key] ?? null).length; } catch { /* no-op */ }
  }
  return total;
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
