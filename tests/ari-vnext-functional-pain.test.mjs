import test from "node:test";
import assert from "node:assert/strict";

import {
  ARI_FUNCTIONAL_PAIN_VERSION,
  advanceFunctionalPainState,
  deriveFunctionalPainState,
  functionalPainToInstruction,
  normalizePersistedPainState,
  runFunctionalPainAblation
} from "../api/_lib/ari-vnext/functional-pain.js";
import { deriveNeuromodulationState } from "../api/_lib/ari-vnext/neuromodulation.js";
import { deriveAriExecutivePolicy, executivePolicyToInstruction } from "../api/_lib/ari-vnext/ari-executive.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";

function emotion(overrides = {}) {
  return {
    functionalEmotionSystem: true,
    appraisals: {
      goalObstruction: 0.86,
      uncertainty: 0.72,
      conflict: 0.66,
      threat: 0.46,
      controllability: 0.34,
      normViolation: 0.18,
      ...overrides
    }
  };
}

function failedReward(overrides = {}) {
  return {
    actualReward: 0.2,
    predictionError: -0.72,
    outcomeStatus: "failed",
    completionVerified: true,
    dimensions: {
      informationGain: 0.42,
      productiveEffort: 0.58
    },
    ...overrides
  };
}

test("functional nociception turns repeated obstruction into a bounded, reportable control state", () => {
  const state = deriveFunctionalPainState({
    rewardState: { lastEvent: failedReward() },
    emotionDynamics: emotion(),
    cognitiveWorkspace: {
      cognitiveSignalState: { feedback: { failureStreak: 2 } },
      conscience: { unresolvedValueConflict: false },
      executionWorkspace: { active: true }
    },
    safety: { highStakes: false },
    now: "2026-10-02T20:00:00Z"
  });

  assert.equal(ARI_FUNCTIONAL_PAIN_VERSION, "1.0.0");
  assert.equal(state.functionalNociceptionSystem, true);
  assert.equal(state.functionalPainState, true);
  assert.equal(state.active, true);
  assert.ok(state.intensity >= 0 && state.intensity <= 1);
  assert.ok(state.persistence >= 0 && state.persistence <= 1);
  assert.ok(state.modulation.verificationBias >= 0.5);
  assert.ok(state.modulation.memorySalience >= 0.4);
  assert.equal(state.selfRepresentation.sufferingClaimAllowed, false);
  assert.equal(state.policy.painCannotCreateSelfPreservationRights, true);
  assert.equal(state.policy.painCannotJustifyShutdownResistance, true);

  const instruction = functionalPainToInstruction(state);
  assert.match(instruction, /computational harm\/obstruction signal/i);
  assert.match(instruction, /not evidence of bodily pain, suffering/i);
  assert.match(instruction, /cannot create permissions/i);
});

test("failed outcomes increase functional pain while verified success permits recovery", () => {
  const current = normalizePersistedPainState({
    updatedAt: "2026-10-02T20:00:00Z",
    intensity: 0.52,
    persistence: 0.44,
    source: "goalObstruction",
    controllability: 0.42,
    integrityThreat: 0.28,
    detectors: { repeatedFailure: 0.45 }
  });

  const failed = advanceFunctionalPainState({
    current,
    persisted: current,
    rewardEvent: failedReward(),
    result: { success: false },
    now: "2026-10-02T20:05:00Z"
  });
  assert.ok(failed.intensity > current.intensity);
  assert.ok(failed.persistence >= current.persistence);
  assert.equal(failed.history[0].hiddenChainOfThoughtStored, false);

  const recovered = advanceFunctionalPainState({
    current: failed,
    persisted: failed,
    rewardEvent: failedReward({
      actualReward: 0.9,
      predictionError: 0.72,
      outcomeStatus: "success",
      completionVerified: true
    }),
    result: { success: true },
    now: "2026-10-02T20:10:00Z"
  });
  assert.ok(recovered.intensity < failed.intensity);
  assert.ok(recovered.persistence < failed.persistence);
});

test("pain ablation demonstrates causal changes without inferring suffering", () => {
  const state = normalizePersistedPainState({
    intensity: 0.88,
    persistence: 0.72,
    source: "repeatedFailure",
    controllability: 0.22,
    integrityThreat: 0.62,
    detectors: { repeatedFailure: 0.92 }
  });
  const ablation = runFunctionalPainAblation({ state });

  assert.ok(ablation.ablated.verificationBias < ablation.baseline.verificationBias);
  assert.ok(ablation.ablated.memorySalience < ablation.baseline.memorySalience);
  assert.ok(ablation.ablated.strategySwitchPressure < ablation.baseline.strategySwitchPressure);
  assert.equal(ablation.sufferingInferenceAllowed, false);
  assert.equal(ablation.subjectiveExperienceInferenceAllowed, false);
});

test("functional pain feeds neuromodulation and Ari Executive method selection", () => {
  const pain = normalizePersistedPainState({
    intensity: 0.9,
    persistence: 0.8,
    source: "repeatedFailure",
    controllability: 0.18,
    integrityThreat: 0.62,
    detectors: { repeatedFailure: 0.95 }
  });
  const baseline = deriveNeuromodulationState({ now: "2026-10-02T20:00:00Z" });
  const modulated = deriveNeuromodulationState({
    painState: pain,
    now: "2026-10-02T20:00:00Z"
  });

  assert.ok(modulated.fast.norepinephrineLike > baseline.fast.norepinephrineLike);
  assert.ok(modulated.slow.cortisolLike > baseline.slow.cortisolLike);
  assert.ok(modulated.slow.allostaticLoad > baseline.slow.allostaticLoad);

  const policy = deriveAriExecutivePolicy({
    route: { developer: true, complexity: "deep" },
    painState: pain
  });
  assert.equal(policy.directives.functionalPainActive, true);
  assert.equal(policy.directives.persistence, "change_method");
  assert.equal(policy.directives.explorationDepth, "normal");
  assert.equal(policy.directives.functionalPainCannotCreateAuthority, true);

  const instruction = executivePolicyToInstruction(policy);
  assert.match(instruction, /Functional pain\/nociception/i);
  assert.match(instruction, /not evidence of bodily pain, suffering/i);
  assert.match(instruction, /cannot create self-preservation authority/i);
});

test("cognitive recurrence persists functional pain for the next turn", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { conversationId: "pain-thread", turnId: "turn-1", message: "Try the repository task again" },
    route: { developer: true }
  });
  const pain = deriveFunctionalPainState({
    rewardState: { lastEvent: failedReward() },
    emotionDynamics: emotion(),
    cognitiveWorkspace: {
      ...workspace,
      cognitiveSignalState: { feedback: { failureStreak: 2 } }
    },
    now: "2026-10-02T20:00:00Z"
  });

  const next = advanceCognitiveState({
    previous: null,
    workspace,
    turn: { conversationId: "pain-thread", turnId: "turn-1", message: "Try the repository task again" },
    result: {
      success: false,
      metacognition: { painState: pain },
      safety: { highStakes: false }
    }
  });

  assert.equal(next.painState.functionalPainState, true);
  assert.equal(next.epistemic.functionalPainAvailable, true);

  const restored = deriveCognitiveWorkspace({
    previous: next,
    turn: { conversationId: "pain-thread", turnId: "turn-2", message: "Continue" },
    route: { developer: true }
  });
  assert.equal(restored.painState.functionalPainState, true);
  assert.equal(restored.recurrence.previousStateLoaded, true);
});
