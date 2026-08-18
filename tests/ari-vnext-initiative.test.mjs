import test from "node:test";
import assert from "node:assert/strict";

import { deriveInitiativeCandidate } from "../api/_lib/ari-vnext/initiative-engine.js";
import { shouldSuppressInitiative } from "../api/_lib/ari-vnext/initiative-events.js";
import { deriveRelationshipContinuity } from "../api/_lib/ari-vnext/relationship-continuity.js";
import { deriveSelfModel } from "../api/_lib/ari-vnext/self-model.js";

const NOW = new Date("2026-08-18T12:00:00.000Z");

test("persistent world evidence produces earned returning-user recognition", () => {
  const continuity = deriveRelationshipContinuity({
    userWorldModel: {
      identity: { displayName: "Sam" },
      preferences: { items: ["User prefers concise coaching."] },
      goals: { stated: ["User wants to preserve strength while losing weight."] },
      constraints: { items: ["Night-shift schedule"] },
      behavior: { trainingAdherence: 0.78 },
      sourceSummary: { durableMemoryLines: 5, longitudinalTraining: true }
    },
    decisionState: { recentOpen: [] },
    experimentLedger: { active: [] },
    temporalTimeline: { events: [] },
    now: NOW
  });

  assert.equal(continuity.recognizedUser, true);
  assert.equal(continuity.familiarity, "established");
  assert.equal(continuity.preferredName, "Sam");
});

test("self model uses persistent relationship continuity instead of resetting familiarity", () => {
  const relationshipContinuity = {
    recognizedUser: true,
    familiarity: "established"
  };
  const model = deriveSelfModel({
    turn: { message: "hey", history: [], relationshipContinuity },
    route: {},
    safety: {}
  });
  assert.equal(model.current.familiarity, "established");
  assert.equal(model.current.persistentRecognition, true);
});

test("due experiment becomes high-priority unfinished business", () => {
  const continuity = deriveRelationshipContinuity({
    userWorldModel: {},
    decisionState: { recentOpen: [] },
    experimentLedger: {
      active: [{ id: "exp-1", hypothesisId: "energy_availability_pressure", reviewAt: "2026-08-17T12:00:00.000Z" }]
    },
    temporalTimeline: { events: [] },
    now: NOW
  });
  assert.equal(continuity.unfinishedThreads[0].state, "review_due");
  assert.equal(continuity.unfinishedThreads[0].priority, "high");
});

test("prediction horizon creates unfinished-business review only when due", () => {
  const continuity = deriveRelationshipContinuity({
    userWorldModel: {},
    decisionState: {
      recentOpen: [{
        id: "d1",
        domain: "training",
        proposition: "Recovery pressure is the leading explanation",
        createdAt: "2026-08-01T12:00:00.000Z",
        prediction: { horizonDays: 14 }
      }]
    },
    experimentLedger: { active: [] },
    temporalTimeline: { events: [] },
    now: NOW
  });
  assert.equal(continuity.unfinishedThreads[0].state, "prediction_due");
});

test("high-signal proactive insight can make Ari initiate with zero LLM requirement", () => {
  const state = deriveInitiativeCandidate({
    proactiveInsights: {
      items: [{
        id: "broad_performance_regression",
        priority: "high",
        confidence: 0.84,
        domain: "training",
        reason: "3 comparable exercise trends are currently down.",
        trigger: "three_or_more_comparable_down_trends"
      }]
    },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.shouldInitiate, true);
  assert.equal(state.candidate.reasonId, "broad_performance_regression");
  assert.equal(state.candidate.requiresLanguageModelCall, false);
  assert.match(state.candidate.opener, /noticed/i);
});

test("internal self-calibration cannot become a user-facing initiative", () => {
  const state = deriveInitiativeCandidate({
    proactiveInsights: {
      items: [{
        id: "ari_self_calibration_overconfidence",
        priority: "internal",
        confidence: 0.9,
        domain: "ari_self_model",
        reason: "confidence gap",
        trigger: "calibration_overconfidence"
      }]
    },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.shouldInitiate, false);
});

test("same surfaced initiative is suppressed during its cooldown", () => {
  const candidate = {
    initiativeKey: "broad_performance_regression:abc",
    cooldownHours: 48
  };
  const suppression = shouldSuppressInitiative({
    candidate,
    events: [{ initiativeKey: candidate.initiativeKey, status: "surfaced", surfacedAt: "2026-08-18T00:00:00.000Z" }],
    now: NOW
  });
  assert.equal(suppression.suppress, true);
});

test("dismissal suppresses the identical initiative for at least seven days", () => {
  const candidate = { initiativeKey: "adherence_drop:abc", cooldownHours: 48 };
  const suppression = shouldSuppressInitiative({
    candidate,
    events: [{ initiativeKey: candidate.initiativeKey, status: "dismissed", surfacedAt: "2026-08-15T12:00:00.000Z" }],
    now: NOW
  });
  assert.equal(suppression.suppress, true);
  assert.equal(suppression.requiredHours, 168);
});

test("materially changed initiative key is not suppressed by an older version", () => {
  const suppression = shouldSuppressInitiative({
    candidate: { initiativeKey: "broad_performance_regression:new", cooldownHours: 48 },
    events: [{ initiativeKey: "broad_performance_regression:old", status: "surfaced", surfacedAt: "2026-08-18T10:00:00.000Z" }],
    now: NOW
  });
  assert.equal(suppression.suppress, false);
});

test("initiative rules prohibit engagement bait and absence-based outreach", () => {
  const state = deriveInitiativeCandidate({
    proactiveInsights: {
      items: [{
        id: "multi_pr_window",
        priority: "positive",
        confidence: 0.82,
        domain: "training",
        reason: "2 PRs",
        trigger: "two_or_more_recent_prs"
      }]
    },
    relationshipContinuity: { unfinishedThreads: [] },
    now: NOW
  });
  assert.equal(state.rules.noEngagementBait, true);
  assert.equal(state.rules.noInitiationBecauseUserWasAbsent, true);
  assert.equal(state.rules.noDependencyLanguage, true);
});
