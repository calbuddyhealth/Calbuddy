import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEvidenceGraph,
  chooseHighestValueQuestion,
  deriveScientificIntelligence,
  designExperiment,
  rankHypotheses
} from "../api/_lib/ari-vnext/scientific-intelligence.js";

function baseLongitudinal() {
  return {
    weight: { available: true, velocityPerWeek: -1.4, weeklyGoal: -0.75, direction: "down", spanDays: 21, pointCount: 8 },
    training: {
      adherence: { plannedCount: 10, completedCount: 9, missedCount: 1, rate: 0.9 },
      progression: { comparableExerciseCount: 5, upCount: 0, stableCount: 2, downCount: 3, windowPrCount: 0, plateauCandidateCount: 1 },
      volumeChange: { available: false }
    },
    nutrition: { loggedDayCount: 5, averageLoggedCalories: 1850, averageLoggedProteinG: 145 },
    signals: [{ id: "broad_performance_pressure", confidence: "low", summary: "Several lifts are down." }]
  };
}

test("evidence graph includes durable prior outcomes as supporting evidence", () => {
  const graph = buildEvidenceGraph({
    context: {
      goals: { goalType: "lose" },
      relevantMemory: "- User reported a positive outcome after recent training guidance: performance improved. Recent Ari guidance context: keep volume stable."
    },
    coachingState: { goal: "lose", evidence: { reported: {} }, signals: [] },
    longitudinalState: baseLongitudinal()
  });

  assert.equal(graph.outcomeMemoryCount, 1);
  assert.ok(graph.nodes.some((node) => node.type === "prior_outcome"));
  assert.ok(graph.nodes.some((node) => node.id === "weight_velocity"));
  assert.ok(graph.nodes.some((node) => node.id === "training_adherence"));
});

test("low adherence makes execution gap the leading explanation", () => {
  const longitudinal = baseLongitudinal();
  longitudinal.training.adherence = { plannedCount: 10, completedCount: 4, missedCount: 6, rate: 0.4 };
  longitudinal.signals.push({ id: "adherence_before_program_change", confidence: "moderate" });

  const hypotheses = rankHypotheses({
    evidenceGraph: { nodes: [] },
    coachingState: { goal: "lose", evidence: { reported: {} }, signals: [] },
    longitudinalState: longitudinal
  });

  assert.equal(hypotheses[0].id, "execution_gap");
  assert.equal(hypotheses[0].status, "leading");

  const experiment = designExperiment({
    hypotheses,
    coachingState: { goal: "lose", evidence: { reported: {} } },
    longitudinalState: longitudinal
  });
  assert.equal(experiment.readiness, "ready");
  assert.match(experiment.intervention, /complet/i);
  assert.match(experiment.intervention, /program design stable/i);
});

test("fast loss plus performance pressure raises energy availability hypothesis", () => {
  const longitudinal = baseLongitudinal();
  longitudinal.signals.push(
    { id: "weight_velocity_differs_from_target", confidence: "moderate" },
    { id: "possible_recovery_or_deficit_pressure", confidence: "moderate" }
  );
  const coaching = {
    goal: "lose",
    evidence: { reported: { performanceDecline: true, fatigue: false, poorSleep: false, persistentSoreness: false } },
    signals: [{ id: "possible_recovery_or_deficit_pressure", confidence: "moderate" }]
  };

  const hypotheses = rankHypotheses({ evidenceGraph: { nodes: [] }, coachingState: coaching, longitudinalState: longitudinal });
  assert.ok(hypotheses.slice(0, 2).some((item) => item.id === "energy_availability_pressure"));
});

test("recovery hypothesis asks one high-value recovery question when user has not reported recovery quality", () => {
  const longitudinal = baseLongitudinal();
  longitudinal.signals.push({ id: "recovery_load_conflict", confidence: "moderate" });
  const coaching = {
    goal: "maintain",
    evidence: { reported: { performanceDecline: true, fatigue: false, poorSleep: false, persistentSoreness: false } },
    signals: [{ id: "recovery_load_conflict", confidence: "moderate" }]
  };
  const hypotheses = rankHypotheses({ evidenceGraph: { nodes: [] }, coachingState: coaching, longitudinalState: longitudinal });
  const next = chooseHighestValueQuestion({ hypotheses, coachingState: coaching, longitudinalState: longitudinal, metacognition: { confidence: "grounded" } });

  assert.ok(next);
  assert.equal(next.id, "recovery_quality");
  assert.ok(next.decisionValue >= 0.9);
});

test("high adherence plus repeated plateau candidates makes program stimulus mismatch actionable", () => {
  const longitudinal = baseLongitudinal();
  longitudinal.training.progression = {
    comparableExerciseCount: 6,
    upCount: 0,
    stableCount: 5,
    downCount: 1,
    windowPrCount: 0,
    plateauCandidateCount: 3
  };
  longitudinal.signals = [{ id: "multi_exercise_plateau_pattern", confidence: "moderate" }];
  const coaching = { goal: "maintain", evidence: { reported: {} }, signals: [] };
  const hypotheses = rankHypotheses({ evidenceGraph: { nodes: [] }, coachingState: coaching, longitudinalState: longitudinal });

  assert.equal(hypotheses[0].id, "program_stimulus_mismatch");
  const experiment = designExperiment({ hypotheses, coachingState: coaching, longitudinalState: longitudinal });
  assert.equal(experiment.readiness, "ready");
  assert.match(experiment.intervention, /one progression\/stimulus variable/i);
  assert.match(experiment.weakensHypothesisIf, /remains stalled/i);
});

test("pain blocks performance experimentation", () => {
  const state = deriveScientificIntelligence({
    route: { training: true },
    context: {},
    coachingState: {
      goal: "maintain",
      evidence: { reported: { painOrInjury: true } },
      signals: []
    },
    longitudinalState: {
      weight: { available: false },
      training: {
        adherence: { plannedCount: 0, completedCount: 0, rate: null },
        progression: { comparableExerciseCount: 0, upCount: 0, stableCount: 0, downCount: 0, windowPrCount: 0, plateauCandidateCount: 0 },
        volumeChange: { available: false }
      },
      nutrition: { loggedDayCount: 0 },
      signals: []
    },
    metacognition: { confidence: "limited", missingEvidence: ["training"] }
  });

  assert.equal(state.experiment.readiness, "blocked_by_safety");
});
