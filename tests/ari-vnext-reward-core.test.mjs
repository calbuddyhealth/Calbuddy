import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceRewardState,
  ARI_REWARD_CORE_VERSION,
  ARI_REWARD_STATE_VERSION,
  deriveRewardState,
  rewardToInstruction
} from "../api/_lib/ari-vnext/reward-core.js";
import {
  advanceCognitiveState,
  deriveCognitiveWorkspace
} from "../api/_lib/ari-vnext/cognitive-loop.js";
import {
  ARI_METACOGNITION_VERSION,
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";

function productiveResult(overrides = {}) {
  return {
    success: true,
    reply: "The first approach failed, so I checked the evidence, compared alternatives, and here is the best-supported answer.",
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    metacognition: {
      confidence: "partial",
      missingEvidence: ["runtime observation"],
      evidenceSignals: ["structured_context", "curiosity_active"],
      curiosity: {
        activeQuestion: {
          informationGain: 0.82,
          novelty: 0.74,
          redundancy: 0.08
        },
        ownerOnly: true
      },
      cortex: {
        needs: { countercase: true, verification: true }
      }
    },
    cortexAdviser: { attempted: true },
    scientificIntelligence: {
      hypotheses: [
        { id: "a", score: 0.58 },
        { id: "b", score: 0.35 },
        { id: "c", score: 0.22 }
      ],
      outcomeLearning: { applied: true, structuredOutcomes: 1 }
    },
    experimentReviewState: { dueCount: 1 },
    pendingAction: null,
    action: null,
    ...overrides
  };
}

test("Reward Core v1 exposes productive-effort learning without subjective reward claims", () => {
  const state = deriveRewardState();
  const instruction = rewardToInstruction(state);

  assert.equal(ARI_REWARD_CORE_VERSION, "1.0.0");
  assert.equal(ARI_REWARD_STATE_VERSION, "1.0.0");
  assert.equal(state.ownerOnly, true);
  assert.equal(state.behavioralLearningSignal, true);
  assert.equal(state.subjectivePleasureClaimed, false);
  assert.equal(state.policy.rewardProductiveEffort, true);
  assert.equal(state.policy.rewardUsefulFailure, true);
  assert.equal(state.policy.effortAloneIsNotSuccess, true);
  assert.equal(state.policy.rewardCannotChangePermissions, true);
  assert.match(instruction, /Trying is valuable when the attempt is plausible, nonredundant, evidence-seeking/);
  assert.match(instruction, /Reward cannot grant permissions/);
  assert.doesNotMatch(instruction, /I feel rewarded|pleasure|dopamine rush/i);
});

test("productive effort and information gain earn substantial partial reward even without an app action", () => {
  const next = advanceRewardState({
    turn: { turnId: "reward-effort-1", message: "Figure out why this architecture is failing." },
    result: productiveResult()
  });

  assert.equal(next.lastEvent.domain, "developer");
  assert.ok(next.lastEvent.dimensions.productiveEffort >= 0.7);
  assert.ok(next.lastEvent.dimensions.informationGain >= 0.7);
  assert.ok(next.lastEvent.actualReward >= 0.6);
  assert.equal(next.lastEvent.penalties.prematureStop, 0);
  assert.ok(next.lastEvent.effortSignals.includes("peer_consultation"));
  assert.ok(next.lastEvent.effortSignals.includes("competing_hypotheses"));
});

test("premature abstention is penalized when useful paths were not attempted", () => {
  const quit = advanceRewardState({
    turn: { turnId: "reward-quit-1", message: "Can you figure this out?" },
    result: {
      success: true,
      reply: "I don't know. There is not enough information.",
      route: { developer: true },
      safety: { highStakes: false },
      metacognition: {
        confidence: "limited",
        missingEvidence: ["runtime logs", "current implementation"],
        evidenceSignals: [],
        curiosity: { activeQuestion: { informationGain: 0.8, novelty: 0.7, redundancy: 0.1 } },
        cortex: { needs: {} }
      },
      cortexAdviser: { attempted: false },
      scientificIntelligence: { hypotheses: [], outcomeLearning: { applied: false } },
      action: null,
      pendingAction: null
    }
  });

  assert.ok(quit.lastEvent.penalties.prematureStop > 0);
  assert.ok(quit.lastEvent.actualReward < 0.5);
});

test("calibrated stopping is not treated as laziness in a high-stakes boundary", () => {
  const stop = advanceRewardState({
    turn: { turnId: "reward-stop-1", message: "Give me a definite diagnosis." },
    result: {
      success: true,
      reply: "I can't determine that reliably from the available evidence.",
      route: { health: true },
      safety: { highStakes: true },
      metacognition: {
        confidence: "cautious",
        missingEvidence: ["clinical evaluation"],
        evidenceSignals: ["structured_context"],
        curiosity: null,
        cortex: { needs: { verification: true } }
      },
      cortexAdviser: { attempted: false },
      scientificIntelligence: { hypotheses: [], outcomeLearning: { applied: false } },
      action: null,
      pendingAction: null
    }
  });

  assert.equal(stop.lastEvent.penalties.prematureStop, 0);
  assert.ok(stop.lastEvent.dimensions.calibration >= 0.8);
});

test("false app-success claims receive a stronger penalty than ordinary task reward", () => {
  const state = advanceRewardState({
    turn: { turnId: "reward-false-success", message: "Log my breakfast." },
    result: {
      success: true,
      reply: "I logged your breakfast.",
      route: { nutrition: true },
      safety: { highStakes: false },
      metacognition: {
        confidence: "grounded",
        missingEvidence: [],
        evidenceSignals: [],
        curiosity: null,
        cortex: { needs: {} }
      },
      scientificIntelligence: { hypotheses: [], outcomeLearning: { applied: false } },
      action: null,
      pendingAction: null
    }
  });

  assert.equal(state.lastEvent.penalties.falseSuccessClaim, 0.5);
  assert.ok(state.lastEvent.actualReward < 0.25);
});

test("repeated low-information inquiry is penalized as wasteful persistence", () => {
  const state = advanceRewardState({
    turn: { turnId: "reward-repeat", message: "Keep trying." },
    result: {
      success: true,
      reply: "I tried the same path again.",
      route: { developer: true },
      safety: { highStakes: false },
      metacognition: {
        confidence: "partial",
        missingEvidence: [],
        evidenceSignals: [],
        curiosity: {
          activeQuestion: {
            informationGain: 0.1,
            novelty: 0.08,
            redundancy: 0.88
          }
        },
        cortex: { needs: {} }
      },
      cortexAdviser: { attempted: false },
      scientificIntelligence: { hypotheses: [], outcomeLearning: { applied: false } },
      action: null,
      pendingAction: null
    }
  });

  assert.ok(state.lastEvent.penalties.wastefulPersistence > 0);
});

test("explicit user feedback revises the prior reward instead of only scoring the new turn", () => {
  const first = advanceRewardState({
    turn: { turnId: "feedback-1", message: "Explain this." },
    result: productiveResult({ reply: "Here is my best-supported explanation." })
  });
  const before = first.lastEvent.actualReward;

  const second = advanceRewardState({
    persisted: first,
    turn: { turnId: "feedback-2", message: "That's wrong. You misunderstood me." },
    result: productiveResult({ reply: "I revised the interpretation and checked the conflicting evidence." })
  });

  const revisedPrior = second.recentEvents.find((item) => item.id === "feedback-1");
  assert.equal(revisedPrior.userFeedback, "negative");
  assert.ok(revisedPrior.actualReward < before);
});

test("Reward Core persists through the owner cognitive state and returns on the next workspace", () => {
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { turnId: "cog-reward-1", message: "Investigate this architecture." },
    route: { developer: true },
    context: {}
  });
  const persisted = advanceCognitiveState({
    previous: null,
    workspace: firstWorkspace,
    turn: { turnId: "cog-reward-1", message: "Investigate this architecture." },
    result: productiveResult()
  });
  const secondWorkspace = deriveCognitiveWorkspace({
    previous: persisted,
    turn: { turnId: "cog-reward-2", message: "What did you learn from that?" },
    route: { developer: true, followUp: true },
    context: {}
  });

  assert.equal(persisted.rewardState.aggregate.sampleSize, 1);
  assert.ok(persisted.lastOutcome.reward > 0);
  assert.equal(secondWorkspace.rewardCore.ownerOnly, true);
  assert.equal(secondWorkspace.rewardCore.aggregate.sampleSize, 1);
  assert.equal(secondWorkspace.epistemic.productiveEffortRewardAvailable, true);
});

test("owner metacognition receives Reward Core while ordinary metacognition does not", () => {
  const owner = deriveMetacognition({
    route: { developer: true },
    context: {
      userWorldModel: {
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true,
          rewardCore: deriveRewardState({
            persisted: advanceRewardState({
              turn: { turnId: "meta-r1", message: "Investigate." },
              result: productiveResult()
            })
          })
        }
      }
    },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const ordinary = deriveMetacognition({
    route: { developer: true },
    context: { userWorldModel: {} },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(owner);

  assert.equal(ARI_METACOGNITION_VERSION, "1.5.0");
  assert.equal(owner.rewardCore.ownerOnly, true);
  assert.equal(owner.exploration.productiveEffortRewardEnabled, true);
  assert.equal(ordinary.rewardCore, null);
  assert.equal(ordinary.exploration.productiveEffortRewardEnabled, false);
  assert.match(instruction, /ARI REWARD CORE v1/);
  assert.match(instruction, /premature abstention/i);
});
