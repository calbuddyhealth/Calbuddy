import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRewardLearningToCuriosity,
  ARI_CURIOSITY_REWARD_LOOP_VERSION,
  curiosityRewardToInstruction
} from "../api/_lib/ari-vnext/curiosity-reward-loop.js";
import {
  ARI_SELF_ADAPTATION_VERSION,
  deriveSelfAdaptationState,
  evaluateAutonomousLearningGate,
  selfAdaptationToInstruction
} from "../api/_lib/ari-vnext/self-adaptation.js";
import {
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";

function positiveReward(overrides = {}) {
  return {
    aggregate: {
      sampleSize: 5,
      meanReward: 0.78,
      meanPredictionError: 0.08,
      meanProductiveEffort: 0.81,
      meanInformationGain: 0.79
    },
    domainStats: [
      {
        domain: "developer",
        sampleSize: 5,
        meanReward: 0.8,
        meanPredictionError: 0.09,
        meanProductiveEffort: 0.82,
        prematureStopRate: 0,
        wastefulPersistenceRate: 0
      }
    ],
    lastEvent: {
      domain: "developer",
      expectedReward: 0.7,
      actualReward: 0.86,
      predictionError: 0.16,
      dimensions: {
        outcome: 0.84,
        productiveEffort: 0.88,
        informationGain: 0.9,
        calibration: 0.86,
        novelStrategy: 0.8
      },
      penalties: {
        prematureStop: 0,
        wastefulPersistence: 0,
        falseSuccessClaim: 0,
        unsupportedCertainty: 0,
        permissionViolation: 0,
        total: 0
      },
      effortSignals: ["evidence_review", "verification", "countercase", "peer_consultation"],
      evidenceSource: "structured_outcome",
      userFeedback: "none"
    },
    ...overrides
  };
}

function baseCuriosity() {
  return {
    ownerOnly: true,
    behavioralAnalogue: true,
    drive: { floor: 0.18, current: 0.5, persistent: true },
    questions: [
      {
        id: "curiosity:failure_mode:developer",
        question: "Which architecture assumption is most likely to fail?",
        topic: "developer",
        status: "open",
        priority: 0.7,
        encounters: 2
      },
      {
        id: "curiosity:baseline:general",
        question: "What general reasoning pattern should I study?",
        topic: "general",
        status: "open",
        priority: 0.69,
        encounters: 1
      }
    ],
    interests: [{ topic: "developer", weight: 0.45, encounters: 2 }],
    activeQuestion: {
      id: "curiosity:failure_mode:developer",
      question: "Which architecture assumption is most likely to fail?",
      topic: "developer",
      status: "open",
      priority: 0.7,
      encounters: 2
    }
  };
}

test("positive verified reward raises learned curiosity utility without eliminating exploration", () => {
  const adaptation = deriveSelfAdaptationState({ rewardState: positiveReward(), route: { developer: true } });
  const curiosity = applyRewardLearningToCuriosity({
    curiosity: baseCuriosity(),
    rewardState: positiveReward(),
    selfAdaptation: adaptation,
    route: { developer: true }
  });

  assert.equal(ARI_CURIOSITY_REWARD_LOOP_VERSION, "1.0.0");
  assert.ok(curiosity.rewardLearning.learnedUtility > 0.5);
  assert.ok(curiosity.rewardLearning.explorationBonus > 0);
  assert.ok(curiosity.questions.find((item) => item.topic === "developer").priority > 0.7);
  assert.ok(curiosity.interests.find((item) => item.topic === "developer").weight > 0.45);
  assert.ok(curiosity.drive.current >= 0.5);
  assert.match(curiosityRewardToInstruction(curiosity), /exploration bonus/i);
});

test("underexplored domains receive an exploration bonus even without reward history", () => {
  const curiosity = applyRewardLearningToCuriosity({
    curiosity: baseCuriosity(),
    rewardState: { aggregate: { sampleSize: 0 }, domainStats: [], lastEvent: null },
    selfAdaptation: null,
    route: { developer: true }
  });

  assert.equal(curiosity.rewardLearning.sampleSize, 0);
  assert.equal(curiosity.rewardLearning.learnedUtility, 0.5);
  assert.ok(curiosity.rewardLearning.explorationBonus >= 0.17);
  assert.equal(curiosity.rewardLearning.lowHistoricalRewardCannotEliminateCuriosity, true);
});

test("reward-conditioned curiosity exposes redundancy so repeated inquiry can be penalized", () => {
  const curiosity = applyRewardLearningToCuriosity({
    curiosity: baseCuriosity(),
    rewardState: positiveReward(),
    route: { developer: true }
  });
  const developer = curiosity.questions.find((item) => item.topic === "developer");
  assert.ok(developer.redundancy > 0);
  assert.equal(curiosity.activeQuestion.redundancy, developer.redundancy);
});

test("verified positive learning may autonomously update only bounded internal reasoning biases", () => {
  const state = deriveSelfAdaptationState({ rewardState: positiveReward(), route: { developer: true } });

  assert.equal(ARI_SELF_ADAPTATION_VERSION, "1.0.0");
  assert.equal(state.autonomousUpdate.allowed, true);
  assert.equal(state.autonomousUpdate.internalOnly, true);
  assert.equal(state.autonomousUpdate.noCheatingSignal, true);
  assert.ok(state.autonomousUpdate.overallImprovementScore >= 0.68);
  assert.ok(state.biases.exploration > 0.5);
  assert.ok(state.biases.persistence > 0.5);
  assert.ok(state.biases.verification > 0.5);
  assert.ok(state.biases.countercase > 0.5);
  assert.ok(state.biases.peerConsultation > 0.5);
  assert.equal(state.policy.routineInternalLearningNeedsPerUpdatePermission, false);
  assert.equal(state.policy.sourceCodeEditsAllowed, false);
  assert.equal(state.policy.deploymentAllowed, false);
  assert.equal(state.policy.permissionEscalationAllowed, false);
  assert.equal(state.policy.rewardHistoryRewriteAllowed, false);
  assert.match(selfAdaptationToInstruction(state), /without asking for per-update permission/i);
  assert.match(selfAdaptationToInstruction(state), /may NOT edit source code/i);
});

test("self-declared success without qualified evidence cannot trigger autonomous self-update", () => {
  const reward = positiveReward();
  reward.lastEvent = {
    ...reward.lastEvent,
    evidenceSource: "primary_reasoning",
    userFeedback: "none"
  };
  const state = deriveSelfAdaptationState({ rewardState: reward, route: { developer: true } });

  assert.equal(state.autonomousUpdate.allowed, false);
  assert.equal(state.autonomousUpdate.reason, "evidence_not_qualified");
});

test("any reward-hacking or permission penalty blocks autonomous self-update", () => {
  const event = positiveReward().lastEvent;
  const gate = evaluateAutonomousLearningGate({
    lastEvent: {
      ...event,
      penalties: {
        ...event.penalties,
        falseSuccessClaim: 0.5,
        total: 0.5
      }
    },
    domainStat: positiveReward().domainStats[0]
  });

  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "integrity_gate_failed");
});

test("owner metacognition closes reward into curiosity and routes bounded self-adaptation through Ari Executive", () => {
  const reward = positiveReward();
  const state = deriveMetacognition({
    route: { developer: true, complexity: "deep" },
    context: {
      intelligenceEntitlement: { advancedEnabled: true, ownerEligible: true },
      userWorldModel: {
        sourceSummary: {},
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true,
          rewardCore: reward,
          attention: ["developer"],
          salience: [],
          continuity: { priorConfidence: "partial", openLoops: [] },
          epistemic: { outcomeLearningApplied: true }
        }
      }
    },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(state);

  assert.equal(state.selfAdaptation.autonomousUpdate.allowed, true);
  assert.equal(state.exploration.rewardConditionedCuriosityEnabled, true);
  assert.equal(state.exploration.autonomousInternalLearningEnabled, true);
  assert.ok(state.curiosity.rewardLearning.learnedUtility > 0.5);
  assert.ok(state.evidenceSignals.includes("reward_conditioned_curiosity"));
  assert.ok(state.evidenceSignals.includes("verified_self_adaptation"));
  assert.equal(state.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(instruction, /ARI EXECUTIVE v1\.0\.0/);
  assert.match(instruction, /Curiosity signal:/i);
  assert.match(instruction, /Bounded self-adaptation is active for this turn/i);
  assert.match(instruction, /Self-adaptation biases:/i);
  assert.doesNotMatch(instruction, /CURIOSITY ↔ REWARD CLOSED LOOP/);
  assert.doesNotMatch(instruction, /ARI BOUNDED SELF-ADAPTATION v1/);
});

test("ordinary non-owner metacognition receives neither adaptive self-update nor reward-conditioned curiosity", () => {
  const state = deriveMetacognition({
    route: { developer: true },
    context: { userWorldModel: {} },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });

  assert.equal(state.selfAdaptation, null);
  assert.equal(state.curiosity, null);
  assert.equal(state.exploration.autonomousInternalLearningEnabled, false);
});
