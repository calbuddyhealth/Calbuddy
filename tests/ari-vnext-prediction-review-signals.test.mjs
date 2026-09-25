import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildDecisionReviewPacket } from "../api/_lib/ari-vnext/decision-journal.js";
import { deriveInitiativeCandidate } from "../api/_lib/ari-vnext/initiative-engine-core.js";

function decision(overrides = {}) {
  return {
    id: "decision-noise-1",
    domain: "goals",
    decisionType: "predictive_assessment",
    proposition: "Normal session variability or measurement noise",
    confidence: 0.6,
    evidence: {
      for: ["few_comparable_exercises", "limited_decline_pattern"],
      against: [],
      unknowns: []
    },
    prediction: {
      kind: "prediction",
      statement: "The apparent change disappears or varies normally across comparable sessions.",
      successCriteria: "The apparent change disappears or varies normally across comparable sessions.",
      disconfirming: "The same direction repeats across several comparable exposures or spreads across multiple exercises.",
      horizonDays: 2,
      reviewAt: "2026-09-25T00:00:00Z",
      hypothesisId: "normal_variability_or_measurement_noise",
      baseline: {
        goal: "maintain",
        weightVelocityPerWeek: 0.1,
        adherenceRate: 0.8,
        progression: { up: 0, stable: 1, down: 1, plateaus: 0, recentWindowPrs: 0 }
      },
      measure: ["like-for-like exercise performance", "recovery context"],
      holdConstant: ["exercise order", "rep target"]
    },
    status: "open",
    createdAt: "2026-09-23T00:00:00Z",
    reviewDueAt: "2026-09-25T00:00:00Z",
    ...overrides
  };
}

function longitudinal({ comparable = 4, up = 0, stable = 3, down = 1, signals = [] } = {}) {
  return {
    weight: {
      available: true,
      velocityPerWeek: 0.08,
      spanDays: 14,
      pointCount: 6
    },
    training: {
      adherence: { plannedCount: 8, completedCount: 7, rate: 0.875 },
      progression: {
        comparableExerciseCount: comparable,
        upCount: up,
        stableCount: stable,
        downCount: down,
        windowPrCount: 1,
        plateauCandidateCount: 0
      }
    },
    nutrition: {
      loggedDayCount: 5,
      averageLoggedCalories: 2200,
      averageLoggedProteinG: 145
    },
    signals
  };
}

test("normal-variability review can be preliminarily supported by repeated comparable evidence", () => {
  const packet = buildDecisionReviewPacket({
    decision: decision(),
    longitudinalState: longitudinal(),
    now: new Date("2026-09-25T04:00:00Z")
  });

  assert.equal(packet.observationWindow.due, true);
  assert.equal(packet.preliminaryVerdict, "supported");
  assert.equal(packet.evidenceQuality.label, "strong");
  assert.match(packet.originalPrediction, /disappears or varies normally/i);
  assert.ok(packet.baseline.metrics.some((item) => /Training adherence/i.test(item)));
  assert.ok(packet.currentEvidence.some((item) => item.id === "performance_trajectory"));
  assert.equal(packet.finalVerdictRequired, true);
});

test("normal-variability review is weakened when decline repeats across comparable exposures", () => {
  const packet = buildDecisionReviewPacket({
    decision: decision(),
    longitudinalState: longitudinal({
      comparable: 5,
      up: 0,
      stable: 2,
      down: 3,
      signals: [{
        id: "broad_performance_pressure",
        confidence: "low",
        summary: "Several comparable exercise trends are down."
      }]
    }),
    now: new Date("2026-09-25T04:00:00Z")
  });

  assert.equal(packet.preliminaryVerdict, "weakened");
  assert.match(packet.preliminaryRationale, /less like isolated session noise/i);
});

test("due review stays inconclusive when comparable evidence remains sparse", () => {
  const packet = buildDecisionReviewPacket({
    decision: decision(),
    longitudinalState: longitudinal({ comparable: 1, up: 0, stable: 0, down: 1 }),
    now: new Date("2026-09-25T04:00:00Z")
  });

  assert.equal(packet.preliminaryVerdict, "inconclusive");
  assert.match(packet.preliminaryRationale, /not enough comparable evidence/i);
});

test("prediction initiative carries the matched review packet into the owner briefing", () => {
  const reviewPacket = buildDecisionReviewPacket({
    decision: decision(),
    longitudinalState: longitudinal(),
    now: new Date("2026-09-25T04:00:00Z")
  });
  const state = deriveInitiativeCandidate({
    relationshipContinuity: {
      unfinishedThreads: [{
        id: "decision:decision-noise-1",
        type: "decision",
        domain: "goals",
        priority: "medium",
        state: "prediction_due",
        summary: "A prior prediction has reached its real-world review point: Normal session variability or measurement noise.",
        dueAt: "2026-09-25T00:00:00Z",
        referenceId: "decision-noise-1"
      }]
    },
    decisionReviews: [reviewPacket],
    now: new Date("2026-09-25T04:00:00Z")
  });

  assert.equal(state.shouldInitiate, true);
  assert.equal(state.candidate.action, "review_prediction");
  assert.equal(state.candidate.ownerBrief.reviewPacket.decisionId, "decision-noise-1");
  assert.match(state.candidate.ownerBrief.whySent, /trigger to compare evidence, not proof/i);
  assert.match(state.candidate.followUpPrompt, /Preliminary comparison: supported/i);
  assert.match(state.candidate.followUpPrompt, /do not treat this preliminary comparison as final/i);
  assert.ok(state.candidate.ownerBrief.evidence.some((item) => /Comparable exercise trajectory/i.test(item.label)));
});

test("Signal UI exposes review evidence and stages it for the next Ari turn", async () => {
  const [signals, runtime, bridge, api, events] = await Promise.all([
    readFile(new URL("../js/ari-signals.js", import.meta.url), "utf8"),
    readFile(new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url), "utf8"),
    readFile(new URL("../ari/vnext/ari-vnext-bridge.js", import.meta.url), "utf8"),
    readFile(new URL("../api/ari-signals.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/initiative-events.js", import.meta.url), "utf8")
  ]);

  assert.match(signals, /ORIGINAL PREDICTION/);
  assert.match(signals, /NEW EVIDENCE/);
  assert.match(signals, /PRELIMINARY COMPARISON/);
  assert.match(signals, /Final review required/);
  assert.match(signals, /stageInitiativeContext/);
  assert.match(runtime, /stageInitiativeContext/);
  assert.match(runtime, /initiativeContext/);
  assert.match(bridge, /initiativeContext/);
  assert.match(api, /reviewPacket/);
  assert.match(events, /compactReviewPacket/);
});
