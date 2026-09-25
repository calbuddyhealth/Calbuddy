import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExperienceKey,
  computePredictionError,
  experienceContextToInstruction,
  selectExperienceSeeds,
  summarizeExperienceContext
} from "../api/_lib/ari-vnext/experience-core.js";
import {
  buildPersistenceRecord,
  runAriExperienceCycle
} from "../api/_lib/ari-vnext/experience-runtime.js";

test("prediction error reflects the gap between expected and observed outcome", () => {
  assert.equal(computePredictionError({ confidence: 0.8, outcomeDirection: "supported" }), 0.2);
  assert.equal(computePredictionError({ confidence: 0.8, outcomeDirection: "weakened" }), 0.8);
  assert.equal(computePredictionError({ confidence: 0.8, outcomeDirection: "mixed" }), 0.3);
  assert.equal(computePredictionError({ confidence: 0.8, outcomeDirection: "inconclusive" }), null);
});

test("experience seeds come from unresolved curiosity and evidence-linked dream frontiers", () => {
  const seeds = selectExperienceSeeds({
    curiosityState: {
      questions: [{
        id: "q1",
        question: "Would durable revisions reduce authorization ambiguity after restarts?",
        topic: "developer",
        status: "open",
        priority: 0.86,
        informationGain: 0.92
      }],
      interests: [{ topic: "distributed_systems", weight: 0.74 }]
    },
    dreamInsights: [{
      id: "d1",
      kind: "contradiction",
      domain: "developer",
      title: "Lease duration tradeoff",
      summary: "Availability and stale authorization risk may move in opposite directions.",
      confidence: 0.78,
      action: "investigate"
    }],
    recentExperiences: []
  });

  assert.ok(seeds.length >= 2);
  assert.equal(seeds[0].domain, "developer");
  assert.ok(seeds.some(item => item.sourceType === "curiosity"));
  assert.ok(seeds.some(item => item.sourceType === "dream"));
  assert.ok(buildExperienceKey(seeds[0]).length === 32);
});

test("resolved experiences become compact future reasoning context", () => {
  const rows = [{
    id: "exp-1",
    experience_key: "key-1",
    status: "resolved",
    source_type: "curiosity",
    domain: "developer",
    trigger_summary: "Authorization caching through replica lag",
    prior_belief: "Expiry would dominate restart behavior.",
    prediction: { statement: "Expiry-only caching will degrade cleanly.", confidence: 0.8, horizonDays: 7 },
    observed_outcome: { summary: "Clock rollback kept stale authority alive.", direction: "contradiction", confidence: 0.9 },
    prediction_error: 0.8,
    surprise: 0.8,
    information_gain: 0.9,
    belief_update: { summary: "Durable revision evidence deserves more weight.", direction: "revise", confidence: 0.84 },
    strategy_update: { summary: "Test clock anomalies explicitly.", adopt: true, confidence: 0.82 },
    unresolved_questions: ["How does replica lag interact with revision propagation?"],
    related_refs: [],
    updated_at: new Date().toISOString()
  }];

  const context = summarizeExperienceContext(rows, {
    message: "What did we learn about authorization caching and clock rollback?",
    route: { developer: true },
    limit: 4
  });

  assert.equal(context.active, true);
  assert.equal(context.maxPredictionError, 0.8);
  const instruction = experienceContextToInstruction(context);
  assert.match(instruction, /CONSEQUENCE-BEARING HISTORY/);
  assert.match(instruction, /prediction error/i);
  assert.match(instruction, /Durable revision evidence/);
  assert.match(instruction, /not a fictional biography/i);
});

test("follow-up evidence resolves a prediction and computes prediction error", () => {
  const now = new Date("2026-09-25T14:00:00Z");
  const record = buildPersistenceRecord({
    now,
    job: {
      mode: "follow_up",
      experience: {
        id: "exp-2",
        experienceKey: "key-2",
        sourceType: "curiosity",
        domain: "developer",
        triggerRef: "curiosity:q2",
        triggerSummary: "Test a cache prediction.",
        attentionReason: "Failure handling was uncertain.",
        priorBelief: "Restarts would be harmless.",
        prediction: {
          statement: "The cache will recover safely after restart.",
          confidence: 0.75,
          horizonDays: 7
        },
        investigation: { findings: "Initial evidence was mixed." },
        unresolvedQuestions: [],
        relatedRefs: [],
        startedAt: "2026-09-18T14:00:00Z",
        metadata: { followupCount: 0 }
      }
    },
    raw: {
      encounter: { summary: "Follow-up", attentionReason: "", domain: "developer" },
      priorBelief: "",
      prediction: { statement: "", confidence: 0.5, horizonDays: 7, successCriteria: "", disconfirming: "" },
      investigation: { question: "Did it recover?", findings: "The restart reproduced stale access.", evidence: [] },
      observedOutcome: { summary: "Stale access persisted after restart.", direction: "contradiction", confidence: 0.9 },
      outcomeDirection: "weakened",
      surprise: 0.78,
      informationGain: 0.88,
      affectUpdate: { dominant: "concern", intensity: 0.5, reason: "Security assumption failed." },
      beliefUpdate: { summary: "Restart behavior needs durable revision evidence.", direction: "revise", confidence: 0.86 },
      strategyUpdate: { summary: "Include restart and clock tests.", adopt: true, conditions: "Authorization cache changes", confidence: 0.84 },
      unresolvedQuestions: [],
      followUpQuestion: "",
      nextHorizonDays: 7,
      relatedRefs: []
    }
  });

  assert.equal(record.status, "resolved");
  assert.equal(record.predictionError, 0.75);
  assert.equal(record.metadata.followupCount, 1);
  assert.equal(record.affectUpdate.subjectiveFeelingClaimed, false);
  assert.ok(record.resolvedAt);
});

test("scheduled cycle is bounded and persists a new consequence-bearing encounter", async () => {
  const stored = [];
  const now = new Date("2026-09-25T14:00:00Z");
  const result = await runAriExperienceCycle({
    userId: "11111111-1111-4111-8111-111111111111",
    now,
    loadDue: async () => [],
    loadRecent: async () => [],
    countToday: async () => 0,
    loadSeeds: async () => [{
      sourceType: "curiosity",
      sourceRef: "curiosity:test",
      domain: "developer",
      topic: "distributed_systems",
      prompt: "What recent fault-tolerance result would challenge a restart assumption?",
      priority: 0.9,
      origin: "test"
    }],
    investigate: async () => ({
      encounter: { summary: "A bounded public result", attentionReason: "It tests the assumption.", domain: "developer" },
      priorBelief: "Restarts should be mostly benign.",
      prediction: {
        statement: "A revision-backed design will recover more reliably in the next controlled restart test.",
        confidence: 0.72,
        horizonDays: 7,
        successCriteria: "No contract-violating stale allow after restart.",
        disconfirming: "Revision-backed design still permits a contract-violating stale allow."
      },
      investigation: { question: "What changed?", findings: "A failure mode was identified.", evidence: [] },
      observedOutcome: { summary: "The evidence exposed a restart-sensitive failure mode.", direction: "new_evidence", confidence: 0.8 },
      outcomeDirection: "not_applicable",
      surprise: 0.68,
      informationGain: 0.82,
      affectUpdate: { dominant: "interest", intensity: 0.42, reason: "Unexpected failure structure." },
      beliefUpdate: { summary: "Restart safety needs explicit evidence.", direction: "revise", confidence: 0.78 },
      strategyUpdate: { summary: "Always include restart tests.", adopt: true, conditions: "Durable authorization state", confidence: 0.76 },
      unresolvedQuestions: ["Does clock rollback produce the same failure?"],
      followUpQuestion: "Did the controlled restart validate the prediction?",
      nextHorizonDays: 7,
      relatedRefs: [],
      provider: { id: "test", model: "test-model" }
    }),
    persist: async ({ experience }) => {
      stored.push(experience);
      return { stored: true, experience: { id: "exp-new", ...experience } };
    }
  });

  assert.equal(result.success, true);
  assert.equal(result.attempted, 1);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].status, "awaiting_outcome");
  assert.equal(stored[0].predictionError, null);
  assert.equal(stored[0].metadata.externalMutationAuthority, false);
  assert.ok(stored[0].followUpAt);
});
