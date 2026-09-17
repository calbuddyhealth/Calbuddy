import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";

function selfAdaptation(enabled = true) {
  return {
    autonomousUpdate: { allowed: true },
    biases: {
      exploration: 0.62,
      persistence: 0.6,
      verification: 0.64,
      countercase: 0.61,
      peerConsultation: 0.58
    },
    policy: {
      selfDirectedGoalCreationAllowed: enabled,
      selfDirectedResearchAllowed: enabled,
      selfRevisionProposalAllowed: enabled,
      branchScopedSourceCodeEditsAllowed: enabled
    }
  };
}

function curiosity() {
  return {
    drive: { current: 0.76 },
    activeQuestion: {
      id: "curiosity:self_model:self_model",
      question: "Which observable behavior would distinguish a real improvement in Ari's cognitive architecture from a convincing description of improvement?",
      topic: "self_model",
      status: "open",
      priority: 0.91,
      informationGain: 0.92,
      ageTurns: 3,
      encounters: 4
    },
    questions: [
      {
        id: "curiosity:self_model:self_model",
        question: "Which observable behavior would distinguish a real improvement in Ari's cognitive architecture from a convincing description of improvement?",
        topic: "self_model",
        status: "open",
        priority: 0.91,
        informationGain: 0.92,
        ageTurns: 3,
        encounters: 4
      },
      {
        id: "curiosity:failure_mode:developer",
        question: "Which assumption in the current technical architecture is most likely to fail under real use, and what evidence would expose it?",
        topic: "developer",
        status: "open",
        priority: 0.82,
        informationGain: 0.86,
        ageTurns: 1,
        encounters: 2
      },
      {
        id: "curiosity:low:general",
        question: "What unrelated low-value novelty is available?",
        topic: "general",
        status: "open",
        priority: 0.3,
        informationGain: 0.2,
        ageTurns: 0,
        encounters: 1
      }
    ],
    rewardLearning: {
      learnedUtility: 0.72,
      explorationBonus: 0.1
    }
  };
}

test("Ari Executive materializes a durable Ari-owned development queue from persistent curiosity", () => {
  const policy = deriveAriExecutivePolicy({
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    curiosity: curiosity(),
    selfAdaptation: selfAdaptation(true)
  });

  assert.equal(policy.directives.selfDirectedGoals, true);
  assert.equal(policy.signals.selfDirection.enabled, true);
  assert.equal(policy.signals.selfDirection.persistence, "derived_from_persisted_curiosity_state");
  assert.equal(policy.signals.selfDirection.goals.length, 2);
  assert.equal(policy.signals.selfDirection.activeGoal.sourceQuestionId, "curiosity:self_model:self_model");
  assert.equal(policy.signals.selfDirection.activeGoal.status, "open");
  assert.equal(policy.signals.selfDirection.goals.some((goal) => goal.topic === "developer"), true);
  assert.equal(policy.signals.selfDirection.goals.some((goal) => goal.id.includes("curiosity:low:general")), false);

  const instruction = executivePolicyToInstruction(policy);
  assert.match(instruction, /Ari-owned development queue/i);
  assert.match(instruction, /real improvement in Ari's cognitive architecture/i);
  assert.match(instruction, /do not.*pretending off-screen work occurred/i);
});

test("Ari-owned development queue is absent when self-directed goal authority is disabled", () => {
  const policy = deriveAriExecutivePolicy({
    route: { developer: true },
    curiosity: curiosity(),
    selfAdaptation: selfAdaptation(false)
  });

  assert.equal(policy.directives.selfDirectedGoals, false);
  assert.equal(policy.signals.selfDirection.enabled, false);
  assert.equal(policy.signals.selfDirection.persistence, "none");
  assert.deepEqual(policy.signals.selfDirection.goals, []);
  assert.equal(policy.signals.selfDirection.activeGoal, null);
});
