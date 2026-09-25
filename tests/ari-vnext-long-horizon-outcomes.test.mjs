import test from "node:test";
import assert from "node:assert/strict";

import { shouldRunAdaptiveStrategyReflection } from "../api/_lib/ari-vnext/adaptive-strategy.js";
import { buildRelevantContext } from "../api/_lib/ari-vnext/context-router.js";
import { summarizeDecisionState } from "../api/_lib/ari-vnext/decision-journal.js";
import {
  buildLongHorizonDecisionRecord,
  classifyReportedOutcome,
  detectReportedDecisionOutcome,
  shouldTrackLongHorizonDecision
} from "../api/_lib/ari-vnext/long-horizon-outcomes.js";
import { deriveRelationshipContinuity } from "../api/_lib/ari-vnext/relationship-continuity.js";

test("general developer decisions become long-horizon journal records", () => {
  const record = buildLongHorizonDecisionRecord({
    turnId: "turn-dev-1",
    turn: { message: "Should we extend Ari's existing decision journal instead of building another brain core?" },
    route: { developer: true, complexity: "deep", casualConversation: false },
    result: {
      success: true,
      reply: "I recommend extending the existing decision journal so the same calibration history stays intact. That should reduce duplication and make later outcomes easier to compare.",
      safety: { highStakes: false },
      metacognition: {
        confidence: "grounded",
        evidenceSignals: ["existing_decision_journal", "persistent_strategy_store"],
        missingEvidence: ["long_term_outcomes_not_yet_generalized"]
      },
      provider: { model: "gpt-5.6" },
      modelPolicy: { mode: "deep" }
    },
    now: new Date("2026-09-21T16:00:00Z")
  });

  assert.ok(record);
  assert.equal(record.domain, "developer");
  assert.equal(record.decisionType, "long_horizon_recommendation");
  assert.equal(record.confidence, 0.78);
  assert.equal(record.prediction.horizonDays, 14);
  assert.equal(record.prediction.reviewAt, "2026-10-05T16:00:00.000Z");
  assert.equal(record.prediction.kind, "recommendation");
  assert.match(record.prediction.decisionContext, /decision journal/i);
  assert.equal(record.prediction.outcomeSourcePreference, "real_world_observation_over_conversational_agreement");
});

test("explicit long horizons override default review timing", () => {
  const record = buildLongHorizonDecisionRecord({
    turnId: "turn-forecast-1",
    turn: { message: "What would happen if we use this architecture over 3 months?" },
    route: { developer: true, complexity: "deep", casualConversation: false },
    result: {
      success: true,
      reply: "I expect the architecture to become more reliable as repeated outcomes accumulate and weak assumptions are revised.",
      safety: { highStakes: false },
      metacognition: { confidence: "partial", evidenceSignals: [], missingEvidence: ["future production outcomes"] }
    },
    now: new Date("2026-09-21T00:00:00Z")
  });

  assert.ok(record);
  assert.equal(record.decisionType, "long_horizon_prediction");
  assert.equal(record.prediction.horizonDays, 90);
  assert.equal(record.prediction.reviewAt, "2026-12-20T00:00:00.000Z");
});

test("transient factual lookups do not create long-horizon wisdom records", () => {
  const track = shouldTrackLongHorizonDecision({
    message: "What will the weather be tomorrow?",
    reply: "It will likely be sunny tomorrow.",
    route: { currentInfo: true, casualConversation: false },
    result: { safety: { highStakes: false } }
  });

  assert.equal(track, false);
});

test("reported outcomes classify support, weakening, and mixed results", () => {
  assert.equal(classifyReportedOutcome("That worked really well."), "supported");
  assert.equal(classifyReportedOutcome("That did not work and made things worse."), "weakened");
  assert.equal(classifyReportedOutcome("It partly worked but not completely."), "mixed");
});

test("one explicit real-world report resolves a single open long-horizon decision", () => {
  const feedback = detectReportedDecisionOutcome({
    message: "That worked. The new architecture stopped the repeated failure.",
    now: new Date("2026-10-06T00:00:00Z"),
    decisions: [{
      id: "decision-1",
      status: "open",
      decisionType: "long_horizon_recommendation",
      domain: "developer",
      proposition: "Use the existing decision journal as the long-running feedback loop.",
      prediction: {
        kind: "recommendation",
        statement: "Use the existing decision journal as the long-running feedback loop.",
        decisionContext: "Should we extend the decision journal?",
        reviewAt: "2026-10-05T00:00:00Z"
      },
      createdAt: "2026-09-21T00:00:00Z"
    }]
  });

  assert.equal(feedback.matched, true);
  assert.equal(feedback.decisionId, "decision-1");
  assert.equal(feedback.outcomeDirection, "supported");
  assert.match(feedback.outcome.lesson, /real-world outcome supported/i);
});

test("ambiguous deictic feedback does not choose among several unrelated open decisions", () => {
  const feedback = detectReportedDecisionOutcome({
    message: "That worked.",
    now: new Date("2026-09-25T00:00:00Z"),
    decisions: [
      {
        id: "decision-a",
        status: "open",
        decisionType: "long_horizon_recommendation",
        proposition: "Use a new caching strategy.",
        prediction: { kind: "recommendation", decisionContext: "Should we change caching?" },
        createdAt: "2026-09-20T00:00:00Z"
      },
      {
        id: "decision-b",
        status: "open",
        decisionType: "long_horizon_recommendation",
        proposition: "Change the conversation memory policy.",
        prediction: { kind: "recommendation", decisionContext: "Should we change memory?" },
        createdAt: "2026-09-19T00:00:00Z"
      }
    ]
  });

  assert.equal(feedback.matched, false);
  assert.equal(feedback.reason, "outcome_target_ambiguous");
});

test("specific wording can resolve the correct decision among several open decisions", () => {
  const feedback = detectReportedDecisionOutcome({
    message: "The caching strategy worked well and reduced the repeated API failures.",
    now: new Date("2026-09-25T00:00:00Z"),
    decisions: [
      {
        id: "decision-cache",
        status: "open",
        decisionType: "long_horizon_recommendation",
        proposition: "Use a bounded caching strategy for repeated API requests.",
        prediction: {
          kind: "recommendation",
          statement: "Use a bounded caching strategy for repeated API requests.",
          decisionContext: "Should we change caching to reduce repeated API failures?"
        },
        createdAt: "2026-09-20T00:00:00Z"
      },
      {
        id: "decision-memory",
        status: "open",
        decisionType: "long_horizon_recommendation",
        proposition: "Change the conversation memory policy.",
        prediction: {
          kind: "recommendation",
          statement: "Change the conversation memory policy.",
          decisionContext: "Should we change memory retrieval?"
        },
        createdAt: "2026-09-19T00:00:00Z"
      }
    ]
  });

  assert.equal(feedback.matched, true);
  assert.equal(feedback.decisionId, "decision-cache");
  assert.equal(feedback.outcomeDirection, "supported");
});

test("decision summary exposes due reviews and recent resolved outcomes", () => {
  const state = summarizeDecisionState([
    {
      id: "due-1",
      status: "open",
      decisionType: "long_horizon_prediction",
      domain: "developer",
      proposition: "The change should reduce retries.",
      confidence: 0.7,
      prediction: { reviewAt: "2026-09-20T00:00:00Z", kind: "prediction" },
      createdAt: "2026-09-01T00:00:00Z"
    },
    {
      id: "resolved-1",
      status: "resolved",
      domain: "career",
      proposition: "The interview strategy should help.",
      confidence: 0.72,
      outcomeDirection: "supported",
      outcome: { lesson: "The structured preparation helped." },
      createdAt: "2026-08-01T00:00:00Z",
      resolvedAt: "2026-09-10T00:00:00Z"
    }
  ], new Date("2026-09-21T00:00:00Z"));

  assert.equal(state.dueCount, 1);
  assert.equal(state.due[0].id, "due-1");
  assert.equal(state.recentResolved[0].id, "resolved-1");
});

test("developer reasoning receives decision history outside fitness routes", () => {
  const decisionState = {
    openCount: 1,
    dueCount: 1,
    recentOpen: [{ id: "d1", proposition: "Use a feedback loop." }]
  };
  const selected = buildRelevantContext({
    memory: "Prior architecture discussion",
    context: {
      decisionState,
      temporalTimeline: { events: [{ at: "2026-09-20T00:00:00Z", type: "ari_decision" }] }
    }
  }, {
    developer: true,
    casualConversation: false
  });

  assert.equal(selected.decisionState, decisionState);
  assert.equal(selected.temporalTimeline.events.length, 1);
  assert.match(selected.relevantMemory, /architecture discussion/i);
});

test("relationship continuity keeps the newest shared events when timeline input is unordered", () => {
  const events = [
    { at: "2026-09-01T00:00:00Z", type: "conversation", domain: "general", label: "oldest" },
    { at: "2026-09-10T00:00:00Z", type: "conversation", domain: "general", label: "new-10" },
    { at: "2026-09-03T00:00:00Z", type: "conversation", domain: "general", label: "old-3" },
    { at: "2026-09-09T00:00:00Z", type: "conversation", domain: "general", label: "new-9" },
    { at: "2026-09-05T00:00:00Z", type: "conversation", domain: "general", label: "mid-5" },
    { at: "2026-09-08T00:00:00Z", type: "conversation", domain: "general", label: "new-8" },
    { at: "2026-09-02T00:00:00Z", type: "conversation", domain: "general", label: "old-2" },
    { at: "2026-09-07T00:00:00Z", type: "conversation", domain: "general", label: "new-7" },
    { at: "2026-09-04T00:00:00Z", type: "conversation", domain: "general", label: "old-4" },
    { at: "2026-09-06T00:00:00Z", type: "conversation", domain: "general", label: "new-6" }
  ];

  const continuity = deriveRelationshipContinuity({
    temporalTimeline: { events }
  });

  assert.equal(continuity.recentSharedEvents.length, 8);
  assert.deepEqual(
    continuity.recentSharedEvents.map((item) => item.label),
    ["new-10", "new-9", "new-8", "new-7", "new-6", "mid-5", "old-4", "old-3"]
  );
  assert.equal(continuity.recentSharedEvents.some((item) => item.label === "oldest"), false);
  assert.equal(continuity.recentSharedEvents.some((item) => item.label === "old-2"), false);
});

test("relationship continuity uses explicit long-horizon review dates", () => {
  const continuity = deriveRelationshipContinuity({
    decisionState: {
      recentOpen: [{
        id: "decision-due",
        domain: "developer",
        proposition: "Use outcome-based strategy updates.",
        decisionType: "long_horizon_recommendation",
        prediction: {
          kind: "recommendation",
          reviewAt: "2026-09-20T00:00:00Z"
        },
        createdAt: "2026-09-01T00:00:00Z"
      }]
    },
    now: new Date("2026-09-21T00:00:00Z")
  });

  const thread = continuity.unfinishedThreads.find((item) => item.referenceId === "decision-due");
  assert.ok(thread);
  assert.equal(thread.state, "prediction_due");
  assert.equal(thread.dueAt, "2026-09-20T00:00:00.000Z");
});

test("real-world decision outcomes trigger adaptive strategy reflection", () => {
  const shouldReflect = shouldRunAdaptiveStrategyReflection({
    message: "That worked.",
    result: {
      success: true,
      reply: "Good. The observed outcome supports the earlier recommendation.",
      action: null,
      scientificIntelligence: null,
      metacognition: { confidence: "grounded", missingEvidence: [] },
      safety: { highStakes: false }
    },
    cognitiveTurnCount: 2,
    decisionOutcomeLearning: {
      resolved: true,
      outcomeDirection: "supported"
    }
  });

  assert.equal(shouldReflect, true);
});
