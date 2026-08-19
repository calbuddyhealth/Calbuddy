import test from "node:test";
import assert from "node:assert/strict";

import { buildDecisionRecord, summarizeCalibration, summarizeDecisionState } from "../api/_lib/ari-vnext/decision-journal.js";
import { deriveProactiveInsights } from "../api/_lib/ari-vnext/proactive-insights.js";
import { deriveTemporalTimeline } from "../api/_lib/ari-vnext/temporal-timeline.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";

test("sparse turns do not erase previously observed user behavior", () => {
  const model = deriveUserWorldModel({
    persisted: {
      behavior: {
        trainingAdherence: 0.72,
        plannedTrainingExposure: 18,
        completedTrainingExposure: 13,
        nutritionLoggedDays: 6,
        recentPerformance: { up: 2, stable: 3, down: 1, plateaus: 0 },
        weightVelocityPerWeek: -0.8
      },
      physiologicalResponse: {
        completedExperiments: 2,
        recentOutcomes: [{ hypothesisId: "energy_availability_pressure", outcomeDirection: "positive" }]
      },
      goals: { stated: ["My goal is to lose weight."], current: { goalType: "lose" } },
      preferences: { items: ["I prefer short answers."] },
      constraints: { items: [] },
      sourceSummary: { longitudinalTraining: true, longitudinalWeight: true, experimentOutcomes: 2 }
    },
    turn: { message: "What's up?" },
    context: {},
    longitudinalState: null
  });

  assert.equal(model.behavior.trainingAdherence, 0.72);
  assert.equal(model.behavior.weightVelocityPerWeek, -0.8);
  assert.equal(model.physiologicalResponse.completedExperiments, 2);
  assert.equal(model.physiologicalResponse.recentOutcomes.length, 1);
});

test("world model notices ambition versus observed adherence without changing the goal", () => {
  const model = deriveUserWorldModel({
    persisted: { goals: { stated: ["I want to train 6 days a week."], current: {} } },
    turn: { message: "Should I keep six days?" },
    context: {},
    longitudinalState: {
      training: {
        adherence: { rate: 0.5, plannedCount: 12, completedCount: 6 },
        progression: {}
      },
      weight: { available: false },
      nutrition: {}
    }
  });

  assert.equal(model.goals.stated[0], "I want to train 6 days a week.");
  assert.ok(model.tensions.some((item) => item.id === "ambition_vs_observed_adherence"));
});

test("decision journal captures evidence provenance alternatives and prediction", () => {
  const record = buildDecisionRecord({
    turnId: "turn-1",
    route: { training: true },
    result: {
      scientificIntelligence: {
        evidenceGraph: {
          nodes: [
            { source: "weight_logs", type: "observation", label: "Weight velocity", confidence: 0.86 },
            { source: "completed_training_history", type: "observation", label: "Performance trajectory", confidence: 0.84 }
          ]
        },
        hypotheses: [
          {
            id: "energy_availability_pressure",
            label: "Energy intake/deficit pressure may be contributing",
            score: 0.68,
            status: "leading",
            supportingEvidence: ["weight_velocity:-1.4_target:-0.75", "down_trends:3"],
            contradictingEvidence: ["nutrition_coverage_partial"],
            unknowns: ["Need more complete nutrition coverage."]
          },
          { id: "recovery_pressure", label: "Recovery pressure", score: 0.55, status: "credible_alternative" }
        ],
        experiment: {
          readiness: "ready",
          hypothesisId: "energy_availability_pressure",
          durationDays: 12,
          supportsHypothesisIf: "Performance improves while weight velocity moderates.",
          weakensHypothesisIf: "Performance remains pressured despite consistent target intake."
        }
      }
    }
  });

  assert.equal(record.decisionType, "predictive_assessment");
  assert.equal(record.confidence, 0.68);
  assert.equal(record.evidence.for.length, 2);
  assert.equal(record.evidence.against.length, 1);
  assert.equal(record.provenance.length, 2);
  assert.equal(record.alternatives[0].id, "recovery_pressure");
  assert.equal(record.prediction.hypothesisId, "energy_availability_pressure");
});

test("calibration detects overconfidence only after a minimally useful sample", () => {
  const calibration = summarizeCalibration([
    { confidence: 0.8, outcomeDirection: "supported" },
    { confidence: 0.8, outcomeDirection: "supported" },
    { confidence: 0.8, outcomeDirection: "weakened" }
  ]);

  assert.equal(calibration.available, true);
  assert.equal(calibration.sampleSize, 3);
  assert.equal(calibration.accuracy, 0.667);
  assert.equal(calibration.meanConfidence, 0.8);
  assert.equal(calibration.tendency, "overconfident");
});

test("timeline orders user events experiments and Ari judgments by actual date", () => {
  const timeline = deriveTemporalTimeline({
    context: {
      recentWeights: [{ weight_lbs: 180, logged_at: "2026-08-10T08:00:00Z" }],
      recentTraining: [{ title: "Push", completed: true, completed_at: "2026-08-12T08:00:00Z" }]
    },
    experiments: [{
      id: "exp-1",
      domain: "training",
      hypothesisId: "recovery_pressure",
      hypothesisLabel: "Recovery pressure",
      startedAt: "2026-08-13T08:00:00Z",
      completedAt: "2026-08-17T08:00:00Z",
      outcomeDirection: "positive"
    }],
    decisions: [{
      id: "dec-1",
      domain: "training",
      proposition: "Recovery pressure",
      confidence: 0.62,
      status: "resolved",
      createdAt: "2026-08-13T07:00:00Z",
      resolvedAt: "2026-08-17T09:00:00Z",
      outcomeDirection: "supported"
    }]
  });

  assert.equal(timeline.events[0].type, "ari_decision_resolved");
  assert.equal(timeline.events[1].type, "experiment_completed");
  assert.ok(timeline.events.some((item) => item.type === "weight"));
});

test("proactive engine surfaces meaningful change but keeps self-calibration internal", () => {
  const decisionState = summarizeDecisionState([
    { status: "resolved", confidence: 0.9, outcomeDirection: "supported", proposition: "A" },
    { status: "resolved", confidence: 0.9, outcomeDirection: "weakened", proposition: "B" },
    { status: "resolved", confidence: 0.9, outcomeDirection: "weakened", proposition: "C" }
  ]);
  const insights = deriveProactiveInsights({
    coachingState: { goal: "maintain", signals: [] },
    longitudinalState: {
      weight: { available: false },
      training: {
        adherence: { rate: 0.9, plannedCount: 10 },
        progression: { comparableExerciseCount: 5, downCount: 3, windowPrCount: 0 }
      },
      signals: []
    },
    decisionState,
    experimentLedger: { dueCount: 1 },
    userWorldModel: { tensions: [] }
  });

  assert.equal(insights.shouldSurface, true);
  assert.equal(insights.primary.id, "experiment_review_due");
  assert.ok(insights.items.some((item) => item.id === "broad_performance_regression"));
  assert.ok(insights.items.some((item) => item.id === "ari_self_calibration_overconfidence" && item.priority === "internal"));
});
