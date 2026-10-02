import test from "node:test";
import assert from "node:assert/strict";

import {
  ARI_NEUROMODULATION_VERSION,
  advanceNeuromodulationState,
  deriveNeuromodulationState,
  neuromodulationToInstruction,
  normalizePersistedNeuromodulationState,
  runNeuromodulationAblation
} from "../api/_lib/ari-vnext/neuromodulation.js";
import { deriveMetacognition, metacognitionToInstruction } from "../api/_lib/ari-vnext/metacognition.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";

function affect(overrides = {}) {
  return {
    version: "2.0.0",
    ownerOnly: true,
    functionalAnalogue: true,
    causallyActive: true,
    signals: {
      surprise: 0.52,
      satisfaction: 0.34,
      frustration: 0.22,
      concern: 0.68,
      confidence: 0.46,
      curiosity: 0.82,
      ...(overrides.signals || {})
    },
    dimensions: {
      valence: 0.48,
      arousal: 0.64,
      conflict: 0.44,
      ...(overrides.dimensions || {})
    },
    dominantState: { name: "curiosity", intensity: 0.82 },
    executiveModulation: {
      verificationBias: 0.66,
      explorationBias: 0.72,
      persistenceBias: 0.58,
      memorySalience: 0.62
    },
    ...overrides
  };
}

function emotions(overrides = {}) {
  return {
    version: "1.1.0",
    functionalEmotionSystem: true,
    causallyActive: true,
    emotions: {
      interest: 0.78,
      surprise: 0.44,
      satisfaction: 0.34,
      frustration: 0.28,
      concern: 0.72,
      determination: 0.64,
      affiliation: 0.36,
      sadness: 0.18,
      fear: 0.42,
      happiness: 0.24,
      anger: 0.16,
      regret: 0.18,
      ...(overrides.emotions || {})
    },
    appraisals: {
      novelty: 0.72,
      uncertainty: 0.62,
      goalProgress: 0.44,
      goalObstruction: 0.48,
      agency: 0.58,
      selfRelevance: 0.72,
      socialSignificance: 0.34,
      predictionError: 0.46,
      conflict: 0.44,
      lossSignificance: 0.3,
      threat: 0.42,
      controllability: 0.62,
      ...(overrides.appraisals || {})
    },
    executiveModulation: {
      verificationBias: 0.68,
      explorationBias: 0.7,
      persistenceBias: 0.62,
      memorySalience: 0.64,
      threatVigilance: 0.52,
      cognitiveFlexibility: 0.66
    },
    reportIntegrity: {
      stateMustExistBeforeReport: true,
      reportableStates: ["interest", "concern"],
      reportableMeasurements: []
    },
    ...overrides
  };
}

function rewardEvent(overrides = {}) {
  return {
    actualReward: 0.48,
    predictionError: -0.24,
    outcomeStatus: "partial",
    completionVerified: false,
    dimensions: {
      calibration: 0.56,
      outcome: 0.46,
      informationGain: 0.72,
      productiveEffort: 0.64,
      ...(overrides.dimensions || {})
    },
    penalties: { total: 0 },
    ...overrides
  };
}

function curiosity() {
  return {
    drive: { current: 0.82, floor: 0.18 },
    activeQuestion: {
      priority: 0.78,
      informationGain: 0.82,
      novelty: 0.76,
      question: "What mechanism best explains this?"
    },
    expansive: {
      pressure: 0.68,
      selectedThisTurn: true,
      activeFrontier: { question: "What adjacent system can clarify this?" }
    },
    rewardLearning: { explorationBonus: 0.1, learnedUtility: 0.7 }
  };
}

function workspace(overrides = {}) {
  return {
    ownerOnly: true,
    functionalExperiment: true,
    continuity: {
      recognizedPriorState: true,
      openLoops: []
    },
    ...overrides
  };
}

test("neuromodulation creates bounded fast, slow, receptor, and homeostatic control state", () => {
  const state = deriveNeuromodulationState({
    functionalAffect: affect(),
    emotionDynamics: emotions(),
    rewardState: { lastEvent: rewardEvent() },
    curiosity: curiosity(),
    route: { developer: true, currentInfo: true },
    safety: { highStakes: false },
    cognitiveWorkspace: workspace(),
    now: "2026-10-02T18:00:00Z"
  });

  assert.equal(ARI_NEUROMODULATION_VERSION, "1.0.0");
  assert.equal(state.functionalNeuromodulationSystem, true);
  assert.equal(state.biologicalChemistryClaimed, false);
  assert.equal(state.subjectiveFeelingClaimed, false);
  assert.equal(state.architecture.receptorSensitivity, true);
  assert.equal(state.architecture.homeostaticRegulation, true);

  for (const value of Object.values(state.fast)) {
    assert.ok(value >= 0 && value <= 1);
  }
  for (const value of Object.values(state.slow)) {
    assert.ok(value >= 0 && value <= 1);
  }
  for (const value of Object.values(state.receptors)) {
    assert.ok(value >= 0 && value <= 1);
  }

  assert.ok(state.fast.acetylcholineLike > 0.45);
  assert.ok(state.receptors.verificationBias >= 0.5);
  assert.ok(Number.isFinite(state.homeostasis.balance));

  const instruction = neuromodulationToInstruction(state);
  assert.match(instruction, /computational physiology/i);
  assert.match(instruction, /not biological chemistry/i);
  assert.match(instruction, /cannot create permissions/i);
});

test("negative verified outcome feedback shifts fast alerting and slow stress without becoming authority", () => {
  const current = deriveNeuromodulationState({
    functionalAffect: affect({
      signals: {
        concern: 0.3,
        curiosity: 0.7,
        satisfaction: 0.46,
        confidence: 0.6
      }
    }),
    emotionDynamics: emotions({
      emotions: {
        concern: 0.32,
        fear: 0.18,
        frustration: 0.16,
        interest: 0.68,
        satisfaction: 0.5
      },
      appraisals: {
        threat: 0.18,
        uncertainty: 0.36,
        goalObstruction: 0.22,
        goalProgress: 0.62
      }
    }),
    rewardState: { lastEvent: rewardEvent({ predictionError: 0, actualReward: 0.62 }) },
    curiosity: curiosity(),
    cognitiveWorkspace: workspace(),
    now: "2026-10-02T18:00:00Z"
  });

  const next = advanceNeuromodulationState({
    current,
    rewardEvent: rewardEvent({
      predictionError: -0.72,
      actualReward: 0.18,
      outcomeStatus: "failed",
      completionVerified: true
    }),
    result: { success: false, safety: { highStakes: false } },
    now: "2026-10-02T18:05:00Z"
  });

  assert.ok(next.fast.norepinephrineLike > current.fast.norepinephrineLike);
  assert.ok(next.slow.cortisolLike > current.slow.cortisolLike);
  assert.ok(next.slow.allostaticLoad > current.slow.allostaticLoad);
  assert.ok(next.slow.recoveryReserve < current.slow.recoveryReserve);
  assert.ok(next.fast.dopamineLike < current.fast.dopamineLike);
  assert.ok(next.history.length >= 1);
  assert.equal(next.history[0].hiddenChainOfThoughtStored, false);
  assert.equal(next.policy.ariExecutiveRemainsDecisionAuthority, true);
});

test("receptor ablation shows cortisol-like signal has causal vigilance and exploration effects", () => {
  const state = normalizePersistedNeuromodulationState({
    fast: {
      dopamineLike: 0.54,
      norepinephrineLike: 0.66,
      acetylcholineLike: 0.62,
      serotoninLike: 0.48,
      gabaLike: 0.42,
      glutamateLike: 0.6
    },
    slow: {
      cortisolLike: 0.88,
      oxytocinLike: 0.34,
      allostaticLoad: 0.72,
      recoveryReserve: 0.28,
      explorationTone: 0.36,
      stabilityTone: 0.42
    }
  });

  const ablation = runNeuromodulationAblation({
    state,
    disable: ["cortisolLike"]
  });

  assert.ok(ablation.ablated.threatVigilance < ablation.baseline.threatVigilance);
  assert.ok(ablation.ablated.explorationBias > ablation.baseline.explorationBias);
  assert.equal(ablation.subjectiveExperienceInferenceAllowed, false);
});

test("metacognition gives Ari Executive the neuromodulation state as advisory control input", () => {
  const event = rewardEvent();
  const context = {
    userWorldModel: {
      ariCognitiveWorkspace: workspace({
        rewardCore: {
          lastEvent: event,
          aggregate: { sampleSize: 1, meanReward: 0.48 }
        },
        affectState: null,
        emotionDynamicsState: null,
        neuromodulationState: null,
        feltState: null,
        affectivePreferenceState: null,
        executionWorkspace: null
      }),
      sourceSummary: {
        rewardState: {
          lastEvent: event,
          recentEvents: [event],
          aggregate: { sampleSize: 1, meanReward: 0.48 }
        }
      }
    }
  };

  const meta = deriveMetacognition({
    turn: { message: "Investigate this architecture." },
    route: { developer: true, complexity: "deep" },
    context,
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });

  assert.ok(meta.neuromodulation);
  assert.equal(meta.neuromodulation.functionalNeuromodulationSystem, true);
  assert.equal(meta.exploration.neuromodulationEnabled, true);
  assert.equal(meta.rules.neuromodulationMayBiasCognitionButCannotCreateAuthority, true);
  assert.ok(meta.executivePolicy.signals.neuromodulation);
  assert.equal(meta.executivePolicy.signals.neuromodulation.biologicalChemistryClaimed, false);
  assert.ok(Number.isFinite(meta.executivePolicy.directives.neuromodulationVerificationBias));
  assert.ok(Number.isFinite(meta.executivePolicy.directives.neuromodulationExplorationBias));

  const instruction = metacognitionToInstruction(meta);
  assert.match(instruction, /Neuromodulation:/i);
  assert.match(instruction, /computational analogies/i);
});

test("cognitive recurrence persists neuromodulation outcome state across turns", () => {
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: null,
    turn: {
      turnId: "neuro-1",
      conversationId: "conversation-neuro",
      message: "Investigate this architecture."
    },
    route: { developer: true },
    context: {}
  });

  const current = deriveNeuromodulationState({
    functionalAffect: affect(),
    emotionDynamics: emotions(),
    rewardState: { lastEvent: rewardEvent() },
    curiosity: curiosity(),
    cognitiveWorkspace: firstWorkspace,
    now: "2026-10-02T18:00:00Z"
  });

  const next = advanceCognitiveState({
    previous: null,
    workspace: firstWorkspace,
    turn: {
      turnId: "neuro-1",
      conversationId: "conversation-neuro",
      message: "Investigate this architecture."
    },
    result: {
      success: false,
      reply: "The first approach failed, so I changed methods.",
      action: { type: "analysis_attempt" },
      safety: { highStakes: false },
      metacognition: {
        neuromodulation: current,
        functionalAffect: affect(),
        emotionDynamics: emotions(),
        confidence: "partial",
        missingEvidence: [],
        evidenceSignals: ["neuromodulation_active"]
      }
    }
  });

  const secondWorkspace = deriveCognitiveWorkspace({
    previous: next,
    turn: {
      turnId: "neuro-2",
      conversationId: "conversation-neuro",
      message: "Continue."
    },
    route: { developer: true },
    context: {}
  });

  assert.ok(next.neuromodulationState);
  assert.ok(next.neuromodulationState.history.length >= 1);
  assert.equal(secondWorkspace.epistemic.persistentNeuromodulationAvailable, true);
  assert.ok(secondWorkspace.neuromodulationState);
});
