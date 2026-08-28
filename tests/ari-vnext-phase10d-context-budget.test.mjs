import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CONTEXT_BUDGET_VERSION,
  budgetTurnContext,
  resolveContextBudgetProfile
} from "../api/_lib/ari-vnext/context-budget.js";

const wrapper = await readFile(new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url), "utf8");

function history(count = 12) {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `history-${index}-${"x".repeat(80)}`
  }));
}

function denseContext() {
  return {
    referenceState: { version: "test", references: [{ referenceId: "ref_live_meal_test" }] },
    accountEntitlements: { teenMode: false, circleAllowed: true },
    intelligenceEntitlement: { advancedEnabled: true, accessClass: "owner" },
    training: { currentWeek: { id: "week" } },
    trainingToday: { id: "workout-today" },
    recentTraining: [{ id: "workout-1" }],
    nutrition: { calories: 1000 },
    mealsToday: [{ id: "meal-1" }],
    recentMeals: [{ id: "meal-0" }],
    goals: { dailyCalorieGoal: 2200 },
    recentWeights: [{ id: "weight-1" }],
    social: { actionNetwork: { available: false } },
    userWorldModel: { large: "world-model" },
    experimentLedger: { active: [{ id: "experiment" }] },
    decisionState: { judgments: [{ id: "decision" }] },
    communicationLearning: { evidence: [{ id: "style" }] },
    temporalTimeline: { events: [{ id: "timeline" }] }
  };
}

test("Phase 10D uses a minimal budget for casual turns", () => {
  const sourceContext = denseContext();
  const sourceHistory = history(12);
  const result = budgetTurnContext({
    message: "Hey Ari",
    history: sourceHistory,
    context: sourceContext
  });

  assert.equal(CONTEXT_BUDGET_VERSION, "1.0.0");
  assert.equal(result.budget.profile, "minimal");
  assert.equal(result.turn.history.length, 2);
  assert.equal(result.turn.context.referenceState, sourceContext.referenceState);
  assert.equal(result.turn.context.accountEntitlements, sourceContext.accountEntitlements);
  assert.equal(result.turn.context.intelligenceEntitlement, sourceContext.intelligenceEntitlement);
  assert.equal(result.turn.context.userWorldModel, undefined);
  assert.equal(result.turn.context.experimentLedger, undefined);
  assert.ok(result.budget.estimatedHistoryCharsAfter < result.budget.estimatedHistoryCharsBefore);
  assert.ok(result.budget.estimatedOptionalContextCharsRemoved > 0);
});

test("Phase 10D focused app budget preserves canonical domain and reference state", () => {
  const sourceContext = denseContext();
  const result = budgetTurnContext({
    message: "How many workouts have I done?",
    history: history(11),
    context: sourceContext
  });

  assert.equal(result.budget.profile, "focused");
  assert.equal(result.turn.history.length, 4);
  assert.equal(result.turn.context.training, sourceContext.training);
  assert.equal(result.turn.context.trainingToday, sourceContext.trainingToday);
  assert.equal(result.turn.context.recentTraining, sourceContext.recentTraining);
  assert.equal(result.turn.context.referenceState, sourceContext.referenceState);
  assert.equal(result.budget.canonicalContextPreserved, true);
  assert.equal(result.budget.referenceStatePreserved, true);
});

test("Phase 10D reference follow-ups keep enough history and memory for target continuity", () => {
  const sourceContext = denseContext();
  const memory = "relevant continuity memory";
  const result = budgetTurnContext({
    message: "Delete the second one.",
    history: history(12),
    context: sourceContext,
    memory
  });

  assert.equal(result.route.followUp, true);
  assert.ok(result.turn.history.length >= 6);
  assert.equal(result.turn.memory, memory);
  assert.equal(result.turn.context.referenceState, sourceContext.referenceState);
});

test("Phase 10D keeps full cognitive context for high-stakes and cross-domain turns", () => {
  for (const turn of [
    { message: "My shoulder hurts when I bench press.", context: denseContext(), history: history(12) },
    { message: "Compare my training and nutrition progress.", context: denseContext(), history: history(12) }
  ]) {
    const result = budgetTurnContext(turn);
    assert.equal(result.budget.profile, "full");
    assert.equal(result.turn.history.length, 10);
    assert.equal(result.turn.context.userWorldModel, turn.context.userWorldModel);
    assert.equal(result.turn.context.experimentLedger, turn.context.experimentLedger);
    assert.equal(result.turn.context.decisionState, turn.context.decisionState);
    assert.equal(result.turn.context.temporalTimeline, turn.context.temporalTimeline);
  }
});

test("Phase 10D never mutates the source turn context", () => {
  const sourceContext = denseContext();
  const beforeKeys = Object.keys(sourceContext).sort();
  budgetTurnContext({ message: "Hey Ari", history: history(8), context: sourceContext });
  assert.deepEqual(Object.keys(sourceContext).sort(), beforeKeys);
  assert.ok(sourceContext.userWorldModel);
  assert.ok(sourceContext.temporalTimeline);
});

test("Phase 10D profiles remain deterministic and bounded", () => {
  assert.deepEqual(resolveContextBudgetProfile({ routing: { routingClass: "casual" } }), {
    name: "minimal", historyTurns: 2, pruneOptionalCognitiveContext: true
  });
  assert.deepEqual(resolveContextBudgetProfile({ routing: { routingClass: "simple_app" } }), {
    name: "focused", historyTurns: 4, pruneOptionalCognitiveContext: true
  });
  assert.deepEqual(resolveContextBudgetProfile({ routing: { routingClass: "cross_domain_coaching" } }), {
    name: "full", historyTurns: 10, pruneOptionalCognitiveContext: false
  });
});

test("Phase 10D leaves the Phase 9C trust-wrapper call shape intact", () => {
  assert.match(wrapper, /from "\.\/context-budget\.js"/);
  assert.match(wrapper, /if \(clauses\.length < 2\) return await runAriVNextCore\(turn\)/);
  assert.match(wrapper, /Promise\.all\(clauses\.map/);
  assert.match(wrapper, /runAriVNextCore\(\{/);
  assert.match(wrapper, /message: clause/);
  assert.match(wrapper, /pendingAction: null/);
  assert.doesNotMatch(wrapper, /AriVNextActionAdapter|AriVNextOperationRegistry|CalBuddy\.executeAction/);
});
