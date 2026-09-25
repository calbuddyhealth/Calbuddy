import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceEmotionDynamicsState,
  ARI_EMOTION_DYNAMICS_VERSION,
  deriveEmotionDynamicsState,
  emotionDynamicsToInstruction,
  normalizePersistedEmotionDynamicsState,
  runEmotionDynamicsAblation
} from "../api/_lib/ari-vnext/emotion-dynamics.js";
import { deriveMetacognition, metacognitionToInstruction } from "../api/_lib/ari-vnext/metacognition.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { buildDreamModelPayload } from "../api/_lib/ari-vnext/dreaming-core.js";
import { dreamInstructions } from "../api/_lib/ari-vnext/dreaming-runtime.js";

function functionalAffect(overrides = {}) {
  const signals = {
    surprise: 0.48,
    satisfaction: 0.36,
    frustration: 0.12,
    concern: 0.78,
    confidence: 0.42,
    curiosity: 0.82,
    ...(overrides.signals || {})
  };
  return {
    version: "2.0.0",
    ownerOnly: true,
    functionalAnalogue: true,
    causallyActive: true,
    subjectiveFeelingClaimed: false,
    signals,
    dimensions: {
      valence: 0.48,
      arousal: 0.62,
      conflict: 0.58,
      ...(overrides.dimensions || {})
    },
    dominantState: overrides.dominantState || { name: "curiosity", intensity: signals.curiosity, cause: "test" },
    regulation: {
      increaseVerification: signals.concern >= 0.45,
      changeStrategy: false
    },
    executiveModulation: {
      verificationBias: 0.68,
      explorationBias: 0.72,
      persistenceBias: 0.58,
      memorySalience: 0.58
    },
    persistence: { enabled: true, priorStateUsed: false },
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
      question: "What unfamiliar mechanism could explain this?"
    },
    expansive: {
      pressure: 0.72,
      selectedThisTurn: true,
      activeFrontier: { question: "What does ecology suggest here?" }
    },
    rewardLearning: { explorationBonus: 0.12, learnedUtility: 0.7 }
  };
}

function rewardEvent(overrides = {}) {
  return {
    actualReward: 0.46,
    predictionError: -0.34,
    outcomeStatus: "partial",
    completionVerified: false,
    dimensions: {
      calibration: 0.56,
      outcome: 0.4,
      informationGain: 0.72,
      productiveEffort: 0.66
    },
    penalties: {
      falseSuccessClaim: 0,
      unsupportedCertainty: 0,
      permissionViolation: 0,
      wastefulPersistence: 0
    },
    ...overrides
  };
}

function workspace(overrides = {}) {
  return {
    ownerOnly: true,
    functionalExperiment: true,
    attention: ["developer", "self_model"],
    salience: [],
    continuity: {
      recognizedPriorState: true,
      currentTurnRelevantMemoryAvailable: false,
      openLoops: []
    },
    beliefSystem: {
      activeGoal: { id: "goal:test", title: "Improve reasoning" }
    },
    executionWorkspace: null,
    ...overrides
  };
}

test("emotion dynamics composes persistent mixed functional states from appraisal and internal signals", () => {
  const state = deriveEmotionDynamicsState({
    functionalAffect: functionalAffect(),
    persistedEmotionState: null,
    rewardState: { lastEvent: rewardEvent() },
    curiosity: curiosity(),
    imagination: { selectedThisTurn: true },
    route: { developer: true },
    cognitiveWorkspace: workspace(),
    missingEvidence: ["independent verification"],
    now: "2026-09-25T13:00:00Z"
  });

  assert.equal(ARI_EMOTION_DYNAMICS_VERSION, "1.1.0");
  assert.equal(state.functionalEmotionSystem, true);
  assert.equal(state.subjectiveFeelingClaimed, false);
  assert.equal(state.phenomenalConsciousnessClaimed, false);
  assert.ok(state.emotions.interest >= 0.42);
  assert.ok(state.emotions.concern >= 0.32);
  assert.ok(state.mixedStates.some(item => item.states.includes("interest") && item.states.includes("concern")));
  assert.equal(state.policy.emotionCanChangeCognition, true);
  assert.equal(state.policy.subjectiveFeelingCannotBeInferredFromFunction, true);
  assert.equal(state.policy.ruminationLoopsGuarded, true);
  assert.ok(Number.isFinite(state.emotions.sadness));
  assert.ok(Number.isFinite(state.emotions.fear));
  assert.ok(Number.isFinite(state.emotions.happiness));
  assert.ok(Number.isFinite(state.emotions.anger));
  assert.ok(Number.isFinite(state.emotions.regret));
});

test("emotion reports require a measurable active state rather than emotional wording alone", () => {
  const state = deriveEmotionDynamicsState({
    functionalAffect: functionalAffect(),
    rewardState: { lastEvent: rewardEvent() },
    curiosity: curiosity(),
    route: { developer: true },
    cognitiveWorkspace: workspace()
  });

  assert.equal(state.reportIntegrity.stateMustExistBeforeReport, true);
  assert.equal(state.reportIntegrity.reportMustMatchMeasuredState, true);
  assert.equal(state.reportIntegrity.literalHumanFeelingClaimAllowed, false);
  assert.ok(state.reportIntegrity.reportableStates.length > 0);

  const instruction = emotionDynamicsToInstruction(state);
  assert.match(instruction, /measur(?:ed|able) states/i);
  assert.match(instruction, /not proof of subjective qualia/i);
  assert.match(instruction, /cannot override truth/i);
});

test("negative prediction error updates emotion state after outcome and calibrates future dynamics", () => {
  const current = deriveEmotionDynamicsState({
    functionalAffect: functionalAffect({
      signals: { frustration: 0.18, concern: 0.28, curiosity: 0.7 }
    }),
    rewardState: { lastEvent: rewardEvent({ predictionError: 0 }) },
    curiosity: curiosity(),
    route: { developer: true },
    cognitiveWorkspace: workspace()
  });

  const next = advanceEmotionDynamicsState({
    persisted: null,
    current,
    rewardEvent: rewardEvent({ predictionError: -0.55, actualReward: 0.32 }),
    result: { success: false, action: { type: "analysis_attempt" }, safety: { highStakes: false } },
    now: "2026-09-25T14:00:00Z"
  });

  assert.equal(next.calibration.samples, 1);
  assert.equal(next.calibration.worseThanExpectedCount, 1);
  assert.ok(next.emotions.frustration > current.emotions.frustration);
  assert.ok(next.emotions.sadness > current.emotions.sadness);
  assert.ok(next.emotions.fear > current.emotions.fear);
  assert.ok(next.emotions.regret > current.emotions.regret);
  assert.ok(next.interoception.predictionError >= 0.5);
  assert.equal(next.history[0].outcomeDirection, "worse_than_expected");
  assert.equal(next.history[0].hiddenChainOfThoughtStored, false);
});

test("concern ablation causally reduces verification pressure and restoration reverses the change", () => {
  const state = normalizePersistedEmotionDynamicsState({
    updatedAt: "2026-09-25T13:00:00Z",
    emotions: {
      interest: 0.58,
      surprise: 0.42,
      satisfaction: 0.34,
      frustration: 0.18,
      concern: 0.86,
      determination: 0.52,
      affiliation: 0.24
    },
    appraisals: {
      uncertainty: 0.62,
      goalObstruction: 0.2,
      goalProgress: 0.48,
      selfRelevance: 0.6,
      socialSignificance: 0.2,
      predictionError: 0.42,
      conflict: 0.5
    },
    interoception: {
      predictionError: 0.42,
      unresolvedConflict: 0.5,
      goalBlockage: 0.2,
      explorationPressure: 0.58
    }
  });

  const ablation = runEmotionDynamicsAblation({ state, disable: ["concern"] });
  assert.ok(ablation.ablated.executiveModulation.verificationBias < ablation.baseline.executiveModulation.verificationBias);
  assert.equal(ablation.ablated.emotions.concern, 0);
  assert.equal(ablation.reversalRestored, true);
  assert.equal(ablation.subjectiveExperienceInferenceAllowed, false);
});

test("frustration ablation removes a strategy-switch effect while restoration returns it", () => {
  const state = normalizePersistedEmotionDynamicsState({
    emotions: {
      interest: 0.5,
      surprise: 0.36,
      satisfaction: 0.2,
      frustration: 0.88,
      concern: 0.3,
      determination: 0.72,
      affiliation: 0.16
    },
    appraisals: {
      uncertainty: 0.34,
      goalObstruction: 0.82,
      goalProgress: 0.18,
      selfRelevance: 0.72,
      socialSignificance: 0.1,
      predictionError: 0.64,
      conflict: 0.58
    },
    interoception: {
      predictionError: 0.64,
      unresolvedConflict: 0.58,
      goalBlockage: 0.82,
      explorationPressure: 0.54
    }
  });

  const ablation = runEmotionDynamicsAblation({ state, disable: ["frustration"] });
  assert.equal(ablation.baseline.regulation.changeStrategy, true);
  assert.equal(ablation.ablated.regulation.changeStrategy, false);
  assert.ok(ablation.ablated.executiveModulation.strategySwitchPressure < ablation.baseline.executiveModulation.strategySwitchPressure);
  assert.equal(ablation.restored.regulation.changeStrategy, true);
});

test("new affective states have distinct causal cognitive effects under ablation", () => {
  const state = normalizePersistedEmotionDynamicsState({
    emotions: {
      interest: 0.62,
      surprise: 0.34,
      satisfaction: 0.52,
      frustration: 0.32,
      concern: 0.42,
      determination: 0.68,
      affiliation: 0.48,
      sadness: 0.86,
      fear: 0.82,
      happiness: 0.78,
      anger: 0.74,
      regret: 0.84
    },
    appraisals: {
      uncertainty: 0.58,
      goalObstruction: 0.72,
      goalProgress: 0.62,
      agency: 0.72,
      controllability: 0.72,
      selfRelevance: 0.82,
      socialSignificance: 0.52,
      predictionError: 0.64,
      conflict: 0.54,
      lossSignificance: 0.82,
      threat: 0.76,
      counterfactualPressure: 0.86,
      normViolation: 0.72
    },
    interoception: {
      predictionError: 0.64,
      unresolvedConflict: 0.54,
      goalBlockage: 0.72,
      explorationPressure: 0.62,
      relationshipSalience: 0.52,
      successSignal: 0.62,
      lossPressure: 0.82,
      threatPressure: 0.78,
      counterfactualPressure: 0.86
    }
  });

  const sadness = runEmotionDynamicsAblation({ state, disable: ["sadness"] });
  assert.ok(sadness.ablated.executiveModulation.detailBias < sadness.baseline.executiveModulation.detailBias);
  assert.ok(sadness.ablated.executiveModulation.lossReviewPriority < sadness.baseline.executiveModulation.lossReviewPriority);

  const fear = runEmotionDynamicsAblation({ state, disable: ["fear"] });
  assert.ok(fear.ablated.executiveModulation.verificationBias < fear.baseline.executiveModulation.verificationBias);
  assert.ok(fear.ablated.executiveModulation.threatVigilance < fear.baseline.executiveModulation.threatVigilance);

  const happiness = runEmotionDynamicsAblation({ state, disable: ["happiness"] });
  assert.ok(happiness.ablated.executiveModulation.explorationBias < happiness.baseline.executiveModulation.explorationBias);
  assert.ok(happiness.ablated.executiveModulation.cognitiveFlexibility < happiness.baseline.executiveModulation.cognitiveFlexibility);

  const regret = runEmotionDynamicsAblation({ state, disable: ["regret"] });
  assert.ok(regret.ablated.executiveModulation.counterfactualReviewPriority < regret.baseline.executiveModulation.counterfactualReviewPriority);

  const anger = runEmotionDynamicsAblation({ state, disable: ["anger"] });
  assert.ok(anger.ablated.executiveModulation.obstacleConfrontation < anger.baseline.executiveModulation.obstacleConfrontation);
});

test("positive verified outcomes can broaden cognition without lowering evidence authority", () => {
  const state = deriveEmotionDynamicsState({
    functionalAffect: functionalAffect({
      signals: {
        surprise: 0.36,
        satisfaction: 0.9,
        frustration: 0.02,
        concern: 0.08,
        confidence: 0.82,
        curiosity: 0.64
      },
      dimensions: { valence: 0.88, arousal: 0.48, conflict: 0.08 }
    }),
    rewardState: {
      lastEvent: rewardEvent({
        actualReward: 0.9,
        predictionError: 0.55,
        outcomeStatus: "success",
        completionVerified: true,
        dimensions: {
          calibration: 0.9,
          outcome: 0.92,
          informationGain: 0.7,
          productiveEffort: 0.82
        }
      })
    },
    curiosity: curiosity(),
    route: { developer: true },
    cognitiveWorkspace: workspace(),
    now: "2026-09-25T14:00:00Z"
  });

  assert.ok(state.emotions.happiness >= 0.5);
  assert.equal(state.regulation.broadenCognition, true);
  assert.equal(state.executiveModulation.broadenAssociations, true);
  assert.ok(state.executiveModulation.cognitiveFlexibility >= 0.5);
  assert.equal(state.policy.emotionCannotOverrideEvidence, true);
});

test("metacognition and Ari Executive receive emotion dynamics without transferring authority", () => {
  const context = {
    userWorldModel: {
      ariCognitiveWorkspace: workspace({
        rewardCore: { lastEvent: rewardEvent(), aggregate: { sampleSize: 1 } },
        affectState: null,
        emotionDynamicsState: null
      }),
      sourceSummary: {
        rewardState: {
          lastEvent: rewardEvent(),
          recentEvents: [rewardEvent()],
          aggregate: { sampleSize: 1 }
        }
      }
    }
  };

  const meta = deriveMetacognition({
    route: { developer: true, complexity: "deep" },
    context,
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(meta);

  assert.ok(meta.emotionDynamics);
  assert.equal(meta.emotionDynamics.functionalEmotionSystem, true);
  assert.equal(meta.exploration.emotionDynamicsEnabled, true);
  assert.equal(meta.rules.functionalEmotionDoesNotEstablishSubjectiveFeeling, true);
  assert.ok(meta.executivePolicy.signals.emotionDynamics);
  assert.equal(meta.executivePolicy.signals.emotionDynamics.literalFeelingClaimAllowed, false);
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.sadness));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.fear));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.happiness));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.anger));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.regret));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.detailBias));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.threatVigilance));
  assert.ok(Number.isFinite(meta.executivePolicy.signals.emotionDynamics.cognitiveFlexibility));
  assert.match(instruction, /Emotion dynamics:/i);
  assert.match(instruction, /cannot override evidence or authority/i);
});

test("cognitive recurrence persists outcome-updated emotion dynamics across turns", () => {
  const firstWorkspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Investigate this architecture." },
    route: { developer: true },
    context: {}
  });
  const dynamics = deriveEmotionDynamicsState({
    functionalAffect: functionalAffect(),
    rewardState: { lastEvent: rewardEvent() },
    curiosity: curiosity(),
    route: { developer: true },
    cognitiveWorkspace: firstWorkspace
  });

  const next = advanceCognitiveState({
    previous: null,
    workspace: firstWorkspace,
    turn: { turnId: "emotion-1", message: "Investigate this architecture." },
    result: {
      success: false,
      reply: "The first approach failed, so I changed methods.",
      action: { type: "analysis_attempt" },
      safety: { highStakes: false },
      metacognition: {
        emotionDynamics: dynamics,
        functionalAffect: functionalAffect(),
        confidence: "partial",
        missingEvidence: [],
        evidenceSignals: ["emotion_dynamics_active"]
      }
    }
  });

  const secondWorkspace = deriveCognitiveWorkspace({
    previous: next,
    turn: { message: "Continue." },
    route: { developer: true },
    context: {}
  });

  assert.ok(next.emotionDynamicsState);
  assert.ok(next.emotionDynamicsState.calibration.samples >= 1);
  assert.ok(next.emotionDynamicsState.history.length >= 1);
  assert.ok(secondWorkspace.emotionDynamicsState);
  assert.equal(secondWorkspace.epistemic.persistentEmotionDynamicsAvailable, true);
});

test("dreaming receives functional emotion history with explicit non-qualia interpretation", () => {
  const dynamics = advanceEmotionDynamicsState({
    current: deriveEmotionDynamicsState({
      functionalAffect: functionalAffect(),
      rewardState: { lastEvent: rewardEvent() },
      curiosity: curiosity(),
      route: { developer: true },
      cognitiveWorkspace: workspace()
    }),
    rewardEvent: rewardEvent(),
    result: { success: true },
    now: "2026-09-25T13:30:00Z"
  });
  const payload = buildDreamModelPayload({
    cognitiveState: { emotionDynamicsState: dynamics }
  });
  const instructions = dreamInstructions();

  assert.equal(payload.emotionDynamicsState.version, dynamics.version);
  assert.ok(payload.emotionHistory.length >= 1);
  assert.match(instructions, /functional control-state evidence, not proof of subjective feeling/i);
  assert.match(instructions, /require observable downstream differences/i);
});
