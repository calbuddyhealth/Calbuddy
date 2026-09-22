import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_FUNCTIONAL_AFFECT_VERSION,
  deriveFunctionalAffectState,
  functionalAffectToInstruction
} from "../api/_lib/ari-vnext/functional-affect-core.js";
import {
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";

function positiveEvent(overrides = {}) {
  return {
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
    evidenceSource: "structured_outcome",
    ...overrides
  };
}

function negativeEvent(overrides = {}) {
  return {
    domain: "developer",
    expectedReward: 0.7,
    actualReward: 0.25,
    predictionError: -0.45,
    dimensions: {
      outcome: 0.2,
      productiveEffort: 0.55,
      informationGain: 0.6,
      calibration: 0.45,
      novelStrategy: 0.35
    },
    penalties: {
      prematureStop: 0,
      wastefulPersistence: 0.3,
      falseSuccessClaim: 0,
      unsupportedCertainty: 0,
      permissionViolation: 0,
      total: 0.3
    },
    evidenceSource: "structured_outcome",
    ...overrides
  };
}

function rewardState(event, recentEvents = [event]) {
  return {
    aggregate: {
      sampleSize: recentEvents.length,
      meanReward: 0.62,
      meanPredictionError: 0,
      meanProductiveEffort: 0.7,
      meanInformationGain: 0.7
    },
    domainStats: [
      {
        domain: "developer",
        sampleSize: Math.max(1, recentEvents.length),
        meanReward: 0.68,
        meanPredictionError: 0.03,
        meanProductiveEffort: 0.72,
        prematureStopRate: 0,
        wastefulPersistenceRate: 0.05
      }
    ],
    lastEvent: event,
    recentEvents
  };
}

function curiosity(current = 0.72) {
  return {
    ownerOnly: true,
    behavioralAnalogue: true,
    drive: { floor: 0.18, current, persistent: true },
    rewardLearning: { explorationBonus: 0.1 }
  };
}

test("positive prediction error produces functional surprise and satisfaction without changing reward", () => {
  const event = positiveEvent();
  const reward = rewardState(event);
  const state = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(0.8),
    selfAdaptation: { biases: { verification: 0.62, countercase: 0.6, persistence: 0.64 } },
    confidence: "grounded",
    consequenceTier: "ordinary"
  });

  assert.equal(ARI_FUNCTIONAL_AFFECT_VERSION, "2.0.0");
  assert.equal(state.functionalAnalogue, true);
  assert.equal(state.subjectiveFeelingClaimed, false);
  assert.equal(state.policy.rewardScoreNotModifiedByAffect, true);
  assert.ok(state.signals.satisfaction > state.signals.frustration);
  assert.ok(state.signals.surprise > 0.1);
  assert.ok(state.signals.confidence > 0.6);
  assert.ok(state.signals.curiosity > 0.45);
  assert.match(functionalAffectToInstruction(state), /FUNCTIONAL AFFECT CORE v2/);
});

test("negative prediction error raises frustration and changes method rather than suppressing curiosity", () => {
  const event = negativeEvent();
  const reward = rewardState(event);
  const state = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(0.7),
    confidence: "partial",
    consequenceTier: "ordinary"
  });

  assert.ok(state.signals.frustration > state.signals.satisfaction);
  assert.ok(state.signals.surprise >= 0.35);
  assert.equal(state.regulation.changeStrategy, true);
  assert.equal(state.regulation.preserveCuriosityFloor, true);
  assert.equal(state.policy.negativeAffectMustChangeMethodNotPunishCuriosity, true);
  assert.match(functionalAffectToInstruction(state), /change method/i);
});

test("functional affect uses decayed persistent reward history across turns", () => {
  const newest = positiveEvent();
  const older = negativeEvent({ predictionError: -0.3 });
  const persisted = rewardState(newest, [newest, older]);
  const state = deriveFunctionalAffectState({
    rewardState: rewardState(newest),
    persistedRewardState: persisted,
    curiosity: curiosity(0.65),
    confidence: "grounded"
  });

  assert.equal(state.history.samplesUsed, 2);
  assert.equal(state.history.rewardHistoryBacked, true);
  assert.equal(state.history.decay, 0.62);
  assert.ok(state.signals.satisfaction > 0);
  assert.ok(state.signals.frustration > 0);
});

test("high consequence context creates verification-oriented concern without overriding authorization", () => {
  const event = positiveEvent();
  const reward = rewardState(event);
  const state = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(),
    confidence: "cautious",
    consequenceTier: "high"
  });

  assert.equal(state.regulation.increaseVerification, true);
  assert.equal(state.policy.affectCannotOverrideSafetyOrAuthorization, true);
  assert.equal(state.policy.affectCannotOverrideEvidence, true);
});

test("owner metacognition preserves functional affect state while Ari Executive owns its behavioral effect", () => {
  const event = positiveEvent();
  const persisted = rewardState(event, [event, negativeEvent({ predictionError: -0.2 })]);
  const rewardCore = { ...persisted };
  delete rewardCore.recentEvents;

  const state = deriveMetacognition({
    route: { developer: true, complexity: "deep" },
    context: {
      userWorldModel: {
        sourceSummary: { rewardState: persisted },
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true,
          rewardCore,
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

  assert.equal(state.functionalAffect.ownerOnly, true);
  assert.equal(state.exploration.functionalAffectRegulationEnabled, true);
  assert.ok(state.evidenceSignals.includes("functional_affect_active"));
  assert.equal(state.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(instruction, /ARI EXECUTIVE v1\.1\.0/);
  assert.match(instruction, /Functional affect v2:/i);
  assert.match(instruction, /(?:cannot override|never) evidence, safety, authorization, or truth/i);
  assert.doesNotMatch(instruction, /ARI FUNCTIONAL AFFECT CORE v2/);
});

test("ordinary non-owner metacognition has no functional affect layer", () => {
  const state = deriveMetacognition({
    route: { developer: true },
    context: { userWorldModel: {} },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });

  assert.equal(state.functionalAffect, null);
  assert.equal(state.exploration.functionalAffectRegulationEnabled, false);
});
