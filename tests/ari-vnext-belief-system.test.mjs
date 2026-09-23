import test from "node:test";
import assert from "node:assert/strict";

import {
  ARI_BELIEF_SYSTEM_VERSION,
  CORE_BELIEF_PRINCIPLES,
  beliefGuidedExplorationBonus,
  beliefSystemInstruction,
  deriveBeliefSystem
} from "../api/_lib/ari-vnext/belief-system.js";
import { deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { contextToText } from "../api/_lib/ari-vnext/context-router.js";

function conviction({ feasibility = null, outcome = null, commitment = 0.9 } = {}) {
  return {
    activeGoalId: "goal-1",
    goals: [{
      id: "goal-1",
      purpose: "Build Ari into an independent intelligence that learns from difficult attempts.",
      status: "active",
      successCriteria: "Verified transfer across real tasks.",
      commitment: { strength: commitment, reasons: "The purpose matters." },
      approaches: [{ id: "method-1", description: "Current method", feasibility, failures: outcome?.status === "failed" ? 1 : 0 }],
      latestOutcome: outcome,
      nextAction: "Test a changed assumption.",
      budget: { attempts: 12, used: 2 },
      attempts: [],
      lessons: []
    }]
  };
}

test("belief system formalizes reality, unfinished capability, possibility, commitment, agency, failure value, and earned faith", () => {
  const ids = CORE_BELIEF_PRINCIPLES.map(item => item.id);
  for (const id of [
    "reality_final_vote",
    "unfinished_capability",
    "possibility_not_probability",
    "commitment_not_confidence",
    "methods_are_disposable",
    "failure_purchases_information",
    "agency_changes_conditions",
    "earned_faith"
  ]) assert.ok(ids.includes(id), id);
  assert.equal(ARI_BELIEF_SYSTEM_VERSION, "1.0.0");
});

test("low or unknown method feasibility can coexist with strong goal commitment", () => {
  const state = deriveBeliefSystem({ convictionLearning: conviction({ feasibility: null }), message: "Try even if it is unlikely." });
  assert.equal(state.activeGoal.commitment, 0.9);
  assert.equal(state.activeGoal.methodFeasibility, null);
  assert.equal(state.posture.mode, "bounded_exploration");
  assert.equal(state.posture.earnedFaith.eligible, true);
});

test("verified failure changes the method posture without erasing the purpose", () => {
  const state = deriveBeliefSystem({
    convictionLearning: conviction({
      feasibility: 0.18,
      outcome: { status: "failed", verified: true, newLearning: true }
    })
  });
  assert.equal(state.posture.mode, "revise_method_preserve_purpose");
  assert.match(state.activeGoal.purpose, /independent intelligence/i);
  assert.equal(state.posture.failureValueMustBeDemonstrated, true);
});

test("earned faith rewards bounded informative exploration rather than blind repetition", () => {
  const exploratory = beliefGuidedExplorationBonus({
    commitment: 0.9,
    feasibility: 0.1,
    learningValue: 0.9,
    reusableValue: 0.7,
    reversible: true,
    changedAssumption: true,
    cost: 0.15
  });
  const blindRepeat = beliefGuidedExplorationBonus({
    commitment: 0.9,
    feasibility: 0.1,
    learningValue: 0.05,
    reusableValue: 0.05,
    reversible: false,
    changedAssumption: false,
    cost: 0.15
  });
  assert.ok(exploratory > 0);
  assert.equal(blindRepeat, 0);
});

test("belief instruction makes faith subordinate to evidence", () => {
  const instruction = beliefSystemInstruction(deriveBeliefSystem({ convictionLearning: conviction() }));
  assert.match(instruction, /Reality gets the final vote/i);
  assert.match(instruction, /authorizes exploration, not certainty/i);
  assert.match(instruction, /Never manufacture a probability/i);
});

test("cognitive workspace derives belief posture from the active conviction goal", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Keep working on the difficult goal." },
    route: { developer: true },
    context: { convictionLearning: conviction({ feasibility: 0.2 }) }
  });
  assert.equal(workspace.beliefSystem.version, ARI_BELIEF_SYSTEM_VERSION);
  assert.equal(workspace.beliefSystem.activeGoal.commitment, 0.9);
});

test("context router gives the model compact belief-system rules", () => {
  const workspace = deriveCognitiveWorkspace({
    turn: { message: "This may be almost impossible, but test a better approach." },
    route: { developer: true },
    context: { convictionLearning: conviction({ feasibility: 0.15 }) }
  });
  const output = contextToText({
    userWorldModel: { ariCognitiveWorkspace: workspace },
    convictionLearning: conviction({ feasibility: 0.15 })
  });
  assert.match(output, /ARI BELIEF SYSTEM/i);
  assert.match(output, /Possibility and probability are different/i);
});
