import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_FUNCTIONAL_AFFECT_VERSION,
  deriveFunctionalAffectState,
  serializeFunctionalAffectState
} from "../api/_lib/ari-vnext/functional-affect-core.js";
import {
  ARI_EXECUTIVE_VERSION,
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";
import {
  ARI_COGNITIVE_STATE_VERSION,
  advanceCognitiveState,
  deriveCognitiveWorkspace
} from "../api/_lib/ari-vnext/cognitive-loop.js";

function negativeEvent(overrides = {}) {
  return {
    domain: "developer",
    actualReward: 0.2,
    expectedReward: 0.7,
    predictionError: -0.5,
    dimensions: {
      outcome: 0.15,
      productiveEffort: 0.6,
      informationGain: 0.75,
      calibration: 0.4
    },
    penalties: {
      wastefulPersistence: 0.35,
      prematureStop: 0,
      falseSuccessClaim: 0,
      unsupportedCertainty: 0,
      permissionViolation: 0,
      total: 0.35
    },
    createdAt: "2026-09-17T08:00:00Z",
    ...overrides
  };
}

function rewardState(event) {
  return {
    aggregate: {
      sampleSize: 1,
      meanReward: event.actualReward,
      prematureStopRate: 0
    },
    domainStats: [],
    lastEvent: event,
    recentEvents: [event]
  };
}

function curiosity() {
  return {
    drive: { floor: 0.18, current: 0.82, persistent: true },
    rewardLearning: { explorationBonus: 0.12, learnedUtility: 0.7 }
  };
}

test("Functional Affect v2 persists a compact affect vector with time-based homeostatic decay", () => {
  const reward = rewardState(negativeEvent());
  const first = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(),
    confidence: "partial",
    now: "2026-09-17T09:00:00Z"
  });
  const persisted = serializeFunctionalAffectState(first);
  const sixHours = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    persistedAffectState: persisted,
    curiosity: curiosity(),
    confidence: "partial",
    now: "2026-09-17T15:00:00Z"
  });
  const seventyTwoHours = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    persistedAffectState: persisted,
    curiosity: curiosity(),
    confidence: "partial",
    now: "2026-09-20T09:00:00Z"
  });

  assert.equal(ARI_FUNCTIONAL_AFFECT_VERSION, "2.0.0");
  assert.ok(first.signals.frustration > first.signals.satisfaction);
  assert.ok(first.signals.curiosity > 0.45);
  assert.equal(first.regulation.changeStrategy, true);
  assert.ok(first.executiveModulation.memorySalience > 0);
  assert.ok(persisted?.signals?.frustration > 0);
  assert.equal(sixHours.persistence.priorStateUsed, true);
  assert.ok(sixHours.persistence.carry > seventyTwoHours.persistence.carry);
  assert.ok(seventyTwoHours.persistence.carry < 0.05);
});

test("Ari Executive consumes the full affect vector and changes runtime strategy", () => {
  const reward = rewardState(negativeEvent());
  const affect = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(),
    confidence: "partial",
    now: "2026-09-17T09:00:00Z"
  });
  const policy = deriveAriExecutivePolicy({
    route: { developer: true, complexity: "deep" },
    confidence: "partial",
    curiosity: curiosity(),
    rewardCore: reward,
    functionalAffect: affect,
    selfAdaptation: {
      biases: {
        verification: 0.5,
        persistence: 0.5,
        countercase: 0.5,
        peerConsultation: 0.5,
        exploration: 0.5
      },
      autonomousUpdate: { allowed: false }
    },
    instructionActivation: { compactBase: false }
  });
  const instruction = executivePolicyToInstruction(policy);

  assert.equal(ARI_EXECUTIVE_VERSION, "1.1.0");
  assert.equal(policy.directives.persistence, "change_method");
  assert.ok(policy.directives.affectActions.includes("change_strategy"));
  assert.ok(policy.directives.affectActions.includes("investigate_cause"));
  assert.equal(policy.directives.countercase, true);
  assert.ok(Object.hasOwn(policy.signals.affect, "frustration"));
  assert.ok(Object.hasOwn(policy.signals.affect, "valence"));
  assert.ok(Object.hasOwn(policy.signals.affect, "memorySalience"));
  assert.ok(instruction.length <= 4400);
  assert.match(instruction, /Functional affect v2:/i);
});

test("cognitive recurrence persists and reloads the compact affect snapshot", () => {
  const reward = rewardState(negativeEvent());
  const affect = deriveFunctionalAffectState({
    rewardState: reward,
    persistedRewardState: reward,
    curiosity: curiosity(),
    confidence: "partial",
    now: "2026-09-17T09:00:00Z"
  });
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Investigate this architecture." },
    route: { developer: true },
    context: {}
  });
  const next = advanceCognitiveState({
    previous: null,
    workspace: firstWorkspace,
    turn: { turnId: "affect-v2-1", message: "Investigate this architecture." },
    result: {
      success: false,
      reply: "I changed the method and checked the conflicting evidence.",
      safety: { highStakes: false },
      metacognition: {
        functionalAffect: affect,
        confidence: "partial",
        missingEvidence: [],
        evidenceSignals: []
      }
    }
  });
  const nextWorkspace = deriveCognitiveWorkspace({
    previous: next,
    turn: { message: "Continue." },
    route: { developer: true },
    context: {}
  });

  assert.equal(ARI_COGNITIVE_STATE_VERSION, "0.6.0");
  assert.ok(next.affectState?.signals?.frustration > 0);
  assert.ok(next.affectState?.updatedAt);
  assert.equal(nextWorkspace.epistemic.persistentAffectAvailable, true);
  assert.ok(nextWorkspace.affectState?.signals?.curiosity >= 0);
});
