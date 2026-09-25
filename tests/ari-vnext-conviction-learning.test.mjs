import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGoalEvent,
  buildOutcomeEvent,
  createGoal,
  goalCandidateFromMessage,
  rankGoalOptions,
  selectResumableGoalAttempt
} from "../api/_lib/ari-vnext/conviction-learning.js";
import { advanceRewardState } from "../api/_lib/ari-vnext/reward-core.js";
import { classifyReportedOutcome } from "../api/_lib/ari-vnext/long-horizon-outcomes.js";
import { evaluateStrategyOutcome } from "../api/_lib/ari-vnext/adaptive-strategy.js";

test("a worthwhile purpose survives a failed method and records verified learning", () => {
  const initial = createGoal({
    id: "goal-1",
    purpose: "Build an independent reasoning system",
    successCriteria: "Ari chooses and revises useful attempts",
    commitment: 0.9
  }, { id: "goal-1" });
  const started = applyGoalEvent(initial, {
    id: "attempt-event-1",
    type: "attempt_started",
    source: "test",
    payload: {
      attemptId: "attempt-1",
      method: "Use a single confidence threshold",
      prediction: "A threshold will select worthwhile long-shot experiments",
      successCriteria: initial.successCriteria,
      feasibility: null
    }
  });
  const observed = applyGoalEvent(started, {
    id: "outcome-event-1",
    type: "outcome_observed",
    source: "test",
    receipt: { id: "receipt-1", attemptId: "attempt-1", verified: true },
    payload: {
      attemptId: "attempt-1",
      status: "failed",
      evidence: "The threshold blocked an informative reversible experiment.",
      learning: "A universal probability cutoff can reject useful experiments.",
      beliefUpdate: "Use expected learning and reversibility alongside feasibility.",
      learningKind: "judgment"
    }
  });

  assert.equal(observed.status, "active");
  assert.equal(observed.commitment.strength, 0.9);
  assert.equal(observed.attempts[0].status, "failed");
  assert.equal(observed.attempts[0].verified, true);
  assert.equal(observed.latestOutcome.newLearning, true);
  assert.equal(observed.lessons.length, 1);
  assert.match(observed.lessons[0].statement, /universal probability cutoff/i);
});

test("pending explicit experiment attempts resume instead of spawning a duplicate attempt", () => {
  const goal = createGoal({
    purpose: "Test exploratory courage",
    successCriteria: "Matched opportunities show useful exploration"
  }, { id: "goal-resume" });

  const started = applyGoalEvent(goal, {
    id: "attempt-event-resume",
    type: "attempt_started",
    payload: {
      attemptId: "ecology-001",
      method: "Ecology dependency-network reasoning probe",
      prediction: "Dependency mapping will reveal a material shared dependency",
      successCriteria: "A matched comparison shows decision-relevant improvement"
    }
  });

  assert.equal(selectResumableGoalAttempt(started, { message: "Continue the ecology experiment and test it." })?.id, "ecology-001");
  assert.equal(selectResumableGoalAttempt(started, { message: "What did we talk about yesterday?" }), null);

  const observed = applyGoalEvent(started, {
    id: "outcome-resume",
    type: "outcome_observed",
    payload: {
      attemptId: "ecology-001",
      status: "partial",
      evidence: "The matched comparison produced one useful distinction."
    }
  });
  assert.equal(selectResumableGoalAttempt(observed, { message: "Continue the ecology experiment." }), null);
});

test("goal completion cannot be inferred from a conversation or unverified success", () => {
  const goal = createGoal({ purpose: "Run a real experiment", successCriteria: "A verified executor receipt exists" });
  const started = applyGoalEvent(goal, {
    id: "attempt-event-2",
    type: "attempt_started",
    payload: { attemptId: "attempt-2", method: "Claim completion", prediction: "The reply will prove completion", successCriteria: goal.successCriteria }
  });
  const outcome = applyGoalEvent(started, {
    id: "outcome-event-2",
    type: "outcome_observed",
    payload: { attemptId: "attempt-2", status: "succeeded", evidence: "The model said it worked." }
  });
  assert.equal(outcome.attempts[0].status, "unknown");
  assert.throws(() => applyGoalEvent(outcome, {
    id: "review-1", type: "goal_review", payload: { status: "achieved", reason: "The reply sounded confident." }
  }), /verified_attempt/);
});

test("unknown feasibility can favor a reversible informative attempt", () => {
  const goal = createGoal({ purpose: "Explore a difficult question", successCriteria: "Evidence improves the next choice" });
  const ranked = rankGoalOptions(goal, [
    { methodId: "repeat", progressValue: 0.7, feasibility: 0.8, cost: 0.8, learningValue: 0.02, reusableValue: 0.05, delayCost: 0.05, changedAssumption: false, reversible: false },
    { methodId: "experiment", progressValue: 0.35, feasibility: null, cost: 0.15, learningValue: 0.9, reusableValue: 0.6, delayCost: 0.25, changedAssumption: true, reversible: true }
  ]);
  assert.equal(ranked[0].needsEvidence, true);
  assert.equal(ranked[0].methodId, "experiment");
});

test("goal candidate extraction recognizes Ari independence work", () => {
  const candidate = goalCandidateFromMessage("I want Ari to become an independent intelligence that learns from failure and can reason about difficult goals.");
  assert.ok(candidate);
  assert.equal(candidate.autonomy, true);
  assert.equal(candidate.domain, "ari_independence");
});

test("failed runtime results are recorded as behavioral evidence", () => {
  const state = advanceRewardState({
    turn: { turnId: "failed-turn", message: "Try the next approach." },
    result: { success: false, route: { developer: true }, reply: "The runtime failed before the attempt completed." }
  });
  assert.equal(state.lastEvent.outcomeStatus, "failed");
  assert.equal(state.lastEvent.completionVerified, false);
  assert.equal(state.recentEvents.length, 1);
});

test("pending actions do not receive verified completion evidence", () => {
  const state = advanceRewardState({
    turn: { turnId: "pending-turn", message: "Prepare this change." },
    result: { success: true, pendingAction: { id: "p1" }, action: { type: "proposed_action" }, route: { developer: true } }
  });
  assert.equal(state.lastEvent.evidenceSource, "primary_reasoning");
  assert.equal(state.lastEvent.completionVerified, false);
  assert.ok(state.lastEvent.actualReward < 0.8);
});

test("hypothetical outcome language remains unresolved", () => {
  assert.equal(classifyReportedOutcome("If that worked, we could use it next month."), null);
  assert.equal(classifyReportedOutcome("That worked and the result held up."), "supported");
});

test("neutral strategy exposure does not establish adoption", () => {
  let strategy = { id: "s1", strategyKey: "probe", title: "Probe", instruction: "Probe", status: "testing", confidence: 0.8, trials: 0, positiveOutcomes: 0, negativeOutcomes: 0, neutralOutcomes: 0 };
  for (let i = 0; i < 7; i++) strategy = evaluateStrategyOutcome(strategy, "neutral").strategy;
  assert.equal(strategy.status, "testing");
  assert.equal(strategy.positiveOutcomes, 0);
  assert.equal(strategy.confidence, 0.8);
});

test("buildOutcomeEvent leaves conversational completion unverified", () => {
  const event = buildOutcomeEvent({ attemptId: "a1", turn: { turnId: "t1" }, result: { success: true, reply: "I made progress." } });
  assert.equal(event.payload.status, "unknown");
  assert.equal(event.receipt, null);
});
