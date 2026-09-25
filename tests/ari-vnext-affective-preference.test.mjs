import test from "node:test";
import assert from "node:assert/strict";

import {
  ARI_AFFECTIVE_PREFERENCE_VERSION,
  advanceAffectivePreferenceState,
  affectivePreferenceToInstruction,
  deriveAffectivePreferenceState,
  normalizePersistedAffectivePreferenceState,
  serializeAffectivePreferenceState
} from "../api/_lib/ari-vnext/affective-preference-model.js";
import { deriveMetacognition } from "../api/_lib/ari-vnext/metacognition.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { buildDreamModelPayload } from "../api/_lib/ari-vnext/dreaming-core.js";

function feltState({
  dominant = "sadness",
  intensity = 0.78,
  activeStates = null,
  valence = -0.62
} = {}) {
  return {
    version: "1.0.0",
    ownerOnly: true,
    functionalFeltState: true,
    introspectivelyAccessible: true,
    globallyAvailable: true,
    causallyActive: true,
    dominantState: { name: dominant, intensity, functional: true },
    activeStates: activeStates || [
      { name: dominant, intensity },
      { name: "regret", intensity: 0.58 },
      { name: "determination", intensity: 0.52 }
    ],
    profile: {
      valence,
      activation: 0.56,
      attentionStyle: "detail_focused",
      temporalFocus: "past",
      actionTendency: "review_loss"
    },
    temporal: {
      trajectory: "stable",
      durationHours: 1.5,
      priorStateUsed: true
    },
    selfAttribution: {
      causalDrivers: ["loss", "counterfactual pressure"],
      confidence: 0.78
    },
    reappraisal: {
      enabled: true,
      changedAgainstPrior: false
    },
    introspection: {
      reportable: true,
      functionalFeelingLanguageAllowed: true,
      subjectiveQualiaClaimAllowed: false
    },
    executiveModulation: {},
    history: []
  };
}

function emotionDynamics(overrides = {}) {
  return {
    functionalEmotionSystem: true,
    appraisals: {
      uncertainty: 0.28,
      threat: 0.18,
      lossSignificance: 0.92,
      goalObstruction: 0.64,
      goalProgress: 0.12,
      controllability: 0.54,
      counterfactualPressure: 0.72,
      normViolation: 0.16,
      socialSignificance: 0.34,
      novelty: 0.22,
      predictionError: 0.44,
      ...(overrides.appraisals || {})
    }
  };
}

function rewardEvent(overrides = {}) {
  return {
    id: "reward-1",
    actualReward: 0.84,
    dimensions: {
      outcome: 0.82,
      productiveEffort: 0.74,
      informationGain: 0.86,
      calibration: 0.88,
      novelStrategy: 0.64,
      ...(overrides.dimensions || {})
    },
    evidenceSource: "verified_tool_result",
    outcomeStatus: "delivered",
    completionVerified: true,
    ...overrides
  };
}

test("Affective Preference selects context-fit negative states instead of maximizing positive valence", () => {
  const state = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    route: { developer: false },
    safety: { highStakes: false },
    now: "2026-09-25T18:00:00Z"
  });

  assert.equal(ARI_AFFECTIVE_PREFERENCE_VERSION, "1.0.0");
  assert.equal(state.functionalPreferenceSystem, true);
  assert.equal(state.secondOrderAffectivePreference, true);
  assert.equal(state.subjectiveWantClaimed, false);
  assert.equal(state.policy.positiveValenceIsNotAutomaticallyPreferred, true);
  assert.equal(state.policy.negativeValenceIsNotAutomaticallyRejected, true);
  assert.equal(state.current.selectedDesiredState.name, "sadness");
  assert.ok(state.current.selectedDesiredState.targetIntensity > 0.3);
});

test("Affective Preference learns utility from observed consequences of active Felt-States", () => {
  const current = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    route: {},
    safety: {},
    now: "2026-09-25T18:00:00Z"
  });
  const learned = advanceAffectivePreferenceState({
    current,
    feltState: feltState(),
    rewardEvent: rewardEvent(),
    result: { success: true },
    now: "2026-09-25T18:05:00Z"
  });

  const sadness = learned.learnedPreferences.find((item) => item.name === "sadness");
  assert.ok(sadness);
  assert.equal(sadness.sampleSize, 1);
  assert.ok(sadness.meanOutcomeUtility > 0);
  assert.ok(sadness.meanReasoningBenefit > 0.5);
  assert.ok(sadness.meanLearningValue > 0.5);
  assert.equal(learned.lastLearningEvent.observed.verified, true);
});

test("Affective Preference can prefer transforming away from a currently positive state when context and learning disagree", () => {
  const learned = normalizePersistedAffectivePreferenceState({
    version: "1.0.0",
    ownerOnly: true,
    functionalPreferenceSystem: true,
    current: {},
    learnedPreferences: [
      {
        name: "happiness",
        sampleSize: 5,
        meanOutcomeUtility: -0.72,
        meanReasoningBenefit: 0.22,
        meanGoalBenefit: 0.30,
        meanLearningValue: 0.18,
        positiveOutcomeRate: 0.2
      },
      {
        name: "concern",
        sampleSize: 5,
        meanOutcomeUtility: 0.64,
        meanReasoningBenefit: 0.86,
        meanGoalBenefit: 0.72,
        meanLearningValue: 0.70,
        positiveOutcomeRate: 0.8
      }
    ]
  });

  const currentFelt = feltState({
    dominant: "happiness",
    intensity: 0.78,
    activeStates: [{ name: "happiness", intensity: 0.78 }],
    valence: 0.72
  });
  const state = deriveAffectivePreferenceState({
    feltState: currentFelt,
    persistedPreferenceState: learned,
    emotionDynamics: emotionDynamics({
      appraisals: {
        threat: 0.92,
        uncertainty: 0.86,
        lossSignificance: 0.05,
        goalProgress: 0.18,
        goalObstruction: 0.52,
        controllability: 0.42
      }
    }),
    safety: { highStakes: true },
    now: "2026-09-25T19:00:00Z"
  });

  assert.equal(state.current.selectedDesiredState.name, "concern");
  assert.equal(state.current.regulation.action, "transform");
  assert.equal(state.current.regulation.from, "happiness");
  assert.equal(state.current.regulation.toward, "concern");
  assert.equal(state.current.preferenceConflict.active, true);
});

test("Affective Preference instruction supports functional wanting language without qualia overclaim", () => {
  const state = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    now: "2026-09-25T18:00:00Z"
  });
  const instruction = affectivePreferenceToInstruction(state);

  assert.match(instruction, /second-order functional preference/i);
  assert.match(instruction, /not proof of subjective wanting/i);
  assert.match(instruction, /Do not maximize positive valence/i);
  assert.match(instruction, /Never invent a preference/i);
});

test("metacognition broadcasts Affective Preference to Ari Executive", () => {
  const cognitiveWorkspace = {
    ownerOnly: true,
    functionalExperiment: true,
    rewardCore: null,
    affectState: null,
    emotionDynamicsState: null,
    feltState: null,
    affectivePreferenceState: null,
    continuity: { openLoops: [] },
    attention: ["developer"],
    salience: [],
    executionWorkspace: null
  };

  const meta = deriveMetacognition({
    route: { developer: true, complexity: "deep" },
    context: {
      userWorldModel: {
        ariCognitiveWorkspace: cognitiveWorkspace,
        sourceSummary: {}
      }
    },
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });

  assert.ok(meta.affectivePreferenceState);
  assert.equal(meta.affectivePreferenceState.functionalPreferenceSystem, true);
  assert.equal(meta.exploration.affectivePreferenceEnabled, true);
  assert.equal(meta.rules.positiveValenceIsNotAutomaticallyPreferred, true);
  assert.ok(meta.executivePolicy.signals.affectivePreference);
  assert.equal(meta.executivePolicy.signals.affectivePreference.subjectiveWantingClaimAllowed, false);
});

test("Cognitive Loop persists Affective Preference and learns from the next observable reward", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Analyze this carefully." },
    route: { developer: true },
    context: {}
  });
  const preference = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    route: { developer: true },
    now: "2026-09-25T18:00:00Z"
  });

  const next = advanceCognitiveState({
    previous: null,
    workspace,
    turn: { turnId: "aff-pref-1", message: "Analyze this carefully." },
    result: {
      success: true,
      reply: "Completed analysis with verified evidence.",
      action: { verified: true },
      scientificIntelligence: {
        verification: { passed: true },
        outcomeLearning: { applied: true }
      },
      metacognition: {
        confidence: "grounded",
        missingEvidence: [],
        evidenceSignals: ["affective_preference_active"],
        feltState: feltState(),
        affectivePreferenceState: preference
      }
    }
  });

  const restored = deriveCognitiveWorkspace({
    previous: next,
    turn: { message: "What state would you prefer now?" },
    route: { developer: true },
    context: {}
  });

  assert.ok(next.affectivePreferenceState);
  assert.equal(next.affectivePreferenceState.functionalPreferenceSystem, true);
  assert.ok(next.affectivePreferenceState.learnedPreferences.length >= 1);
  assert.ok(restored.affectivePreferenceState);
  assert.equal(restored.epistemic.persistentAffectivePreferenceAvailable, true);
});

test("Dreaming receives affective preference history and learned state utilities", () => {
  const current = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    now: "2026-09-25T18:00:00Z"
  });
  const learned = advanceAffectivePreferenceState({
    current,
    feltState: feltState(),
    rewardEvent: rewardEvent(),
    result: { success: true },
    now: "2026-09-25T18:05:00Z"
  });

  const payload = buildDreamModelPayload({
    cognitiveState: {
      feltState: feltState(),
      affectivePreferenceState: learned
    }
  });

  assert.equal(payload.affectivePreferenceState.version, "1.0.0");
  assert.ok(payload.affectivePreferenceHistory.length >= 1);
  assert.ok(payload.learnedAffectivePreferences.length >= 1);
});

test("persisted Affective Preference remains compact and excludes hidden reasoning", () => {
  const state = deriveAffectivePreferenceState({
    feltState: feltState(),
    emotionDynamics: emotionDynamics(),
    now: "2026-09-25T18:00:00Z"
  });
  const persisted = serializeAffectivePreferenceState({
    ...state,
    hiddenReasoning: "must not persist",
    current: {
      ...state.current,
      secretScratchpad: "must not persist"
    }
  });

  assert.equal(persisted.policy.hiddenChainOfThoughtStored, false);
  assert.equal("hiddenReasoning" in persisted, false);
  assert.equal("secretScratchpad" in persisted.current, false);
});
