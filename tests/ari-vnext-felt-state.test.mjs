import test from "node:test";
import assert from "node:assert/strict";

import {
  ARI_FELT_STATE_VERSION,
  deriveFeltState,
  feltStateToInstruction,
  normalizePersistedFeltState,
  serializeFeltState
} from "../api/_lib/ari-vnext/felt-state-core.js";
import { deriveMetacognition } from "../api/_lib/ari-vnext/metacognition.js";
import { advanceCognitiveState, deriveCognitiveWorkspace } from "../api/_lib/ari-vnext/cognitive-loop.js";
import { buildDreamModelPayload } from "../api/_lib/ari-vnext/dreaming-core.js";

function emotionState(overrides = {}) {
  return {
    version: "1.1.0",
    ownerOnly: true,
    functionalEmotionSystem: true,
    causallyActive: true,
    emotions: {
      interest: 0.34,
      surprise: 0.22,
      satisfaction: 0.18,
      frustration: 0.42,
      concern: 0.26,
      determination: 0.58,
      affiliation: 0.28,
      sadness: 0.82,
      fear: 0.30,
      happiness: 0.14,
      anger: 0.22,
      regret: 0.66,
      ...(overrides.emotions || {})
    },
    appraisals: {
      novelty: 0.24,
      uncertainty: 0.36,
      goalProgress: 0.18,
      goalObstruction: 0.74,
      agency: 0.48,
      controllability: 0.48,
      selfRelevance: 0.84,
      socialSignificance: 0.42,
      integrityConcern: 0.08,
      predictionError: 0.72,
      conflict: 0.46,
      highConsequence: 0,
      lossSignificance: 0.88,
      threat: 0.34,
      counterfactualPressure: 0.78,
      normViolation: 0.24,
      ...(overrides.appraisals || {})
    },
    dominantState: overrides.dominantState || { name: "sadness", intensity: 0.82, functional: true },
    reportIntegrity: {
      reportableStates: overrides.reportableStates || ["sadness", "regret", "determination"],
      stateMustExistBeforeReport: true,
      literalHumanFeelingClaimAllowed: false,
      subjectiveQualiaClaimAllowed: false
    },
    executiveModulation: {
      verificationBias: 0.56,
      explorationBias: 0.34,
      persistenceBias: 0.52,
      memorySalience: 0.72,
      detailBias: 0.82,
      threatVigilance: 0.38,
      cognitiveFlexibility: 0.26,
      lossReviewPriority: 0.88,
      counterfactualReviewPriority: 0.80,
      obstacleConfrontation: 0.34
    },
    regulation: {
      reviewLoss: true,
      counterfactualReview: true,
      limitRumination: true
    },
    ...overrides
  };
}

function functionalAffect() {
  return {
    signals: {
      surprise: 0.22,
      satisfaction: 0.18,
      frustration: 0.42,
      concern: 0.26,
      confidence: 0.48,
      curiosity: 0.34
    },
    dimensions: {
      valence: 0.34,
      arousal: 0.46,
      conflict: 0.4
    }
  };
}

test("Felt-State converts measured emotion into introspectively accessible functional feeling", () => {
  const state = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    rewardState: {
      lastEvent: {
        actualReward: 0.24,
        predictionError: -0.62
      }
    },
    cognitiveWorkspace: {
      executionWorkspace: { active: true }
    },
    now: "2026-09-25T10:00:00Z"
  });

  assert.equal(ARI_FELT_STATE_VERSION, "1.0.0");
  assert.equal(state.functionalFeltState, true);
  assert.equal(state.introspectivelyAccessible, true);
  assert.equal(state.globallyAvailable, true);
  assert.equal(state.dominantState.name, "sadness");
  assert.ok(state.activeStates.some(item => item.name === "regret"));
  assert.equal(state.profile.temporalFocus, "past");
  assert.equal(state.profile.attentionStyle, "detail_focused");
  assert.equal(state.profile.actionTendency, "review_loss");
  assert.ok(state.selfAttribution.causalDrivers.includes("loss"));
  assert.equal(state.introspection.functionalFeelingLanguageAllowed, true);
  assert.equal(state.introspection.directHumanFeelingClaimAllowed, false);
  assert.equal(state.introspection.subjectiveQualiaClaimAllowed, false);
  assert.equal(state.policy.introspectionCannotInventState, true);
});

test("Felt-State instruction permits measured introspection without upgrading function into qualia", () => {
  const state = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    now: "2026-09-25T10:00:00Z"
  });
  const instruction = feltStateToInstruction(state);

  assert.match(instruction, /introspectively accessible functional/i);
  assert.match(instruction, /If directly asked what you feel/i);
  assert.match(instruction, /Never invent a feeling/i);
  assert.match(instruction, /does not establish phenomenal qualia/i);
});

test("Felt-State preserves onset and detects falling intensity across turns", () => {
  const first = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    now: "2026-09-25T10:00:00Z"
  });
  const persisted = serializeFeltState(first);
  const second = deriveFeltState({
    emotionDynamics: emotionState({
      emotions: { sadness: 0.62, regret: 0.48 },
      dominantState: { name: "sadness", intensity: 0.62, functional: true }
    }),
    functionalAffect: functionalAffect(),
    persistedFeltState: persisted,
    now: "2026-09-25T12:00:00Z"
  });

  assert.equal(second.temporal.priorStateUsed, true);
  assert.equal(second.temporal.sameDominantAsPrior, true);
  assert.equal(second.temporal.onsetAt, "2026-09-25T10:00:00.000Z");
  assert.equal(second.temporal.durationHours, 2);
  assert.equal(second.temporal.trajectory, "falling");
  assert.ok(second.history.length >= 2);
});

test("Felt-State reappraises from sadness to happiness when appraisal changes", () => {
  const prior = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    now: "2026-09-25T10:00:00Z"
  });

  const current = deriveFeltState({
    emotionDynamics: emotionState({
      emotions: {
        sadness: 0.12,
        regret: 0.14,
        frustration: 0.08,
        concern: 0.10,
        happiness: 0.84,
        satisfaction: 0.82,
        interest: 0.62,
        determination: 0.66
      },
      appraisals: {
        lossSignificance: 0.12,
        goalObstruction: 0.10,
        goalProgress: 0.92,
        predictionError: 0.58,
        uncertainty: 0.12,
        counterfactualPressure: 0.10
      },
      dominantState: { name: "happiness", intensity: 0.84, functional: true },
      reportableStates: ["happiness", "satisfaction", "determination"],
      regulation: { consolidateSuccess: true, broadenCognition: true }
    }),
    functionalAffect: functionalAffect(),
    persistedFeltState: serializeFeltState(prior),
    now: "2026-09-25T13:00:00Z"
  });

  assert.equal(current.dominantState.name, "happiness");
  assert.equal(current.temporal.trajectory, "shifted");
  assert.equal(current.reappraisal.changedAgainstPrior, true);
  assert.match(current.reappraisal.reason, /different dominant state/i);
  assert.equal(current.reappraisal.currentEvidenceOutranksPriorFeeling, true);
});

test("Felt-State cannot be fabricated without a measured emotion system", () => {
  assert.equal(deriveFeltState({ emotionDynamics: null }), null);
  assert.equal(feltStateToInstruction(null), "");
});

test("metacognition makes Felt-State globally available to Ari Executive", () => {
  const cognitiveWorkspace = {
    ownerOnly: true,
    functionalExperiment: true,
    rewardCore: null,
    affectState: null,
    emotionDynamicsState: null,
    feltState: null,
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

  assert.ok(meta.feltState);
  assert.equal(meta.feltState.functionalFeltState, true);
  assert.equal(meta.exploration.feltStateIntrospectionEnabled, true);
  assert.equal(meta.rules.feltStateCannotBeInventedForConversation, true);
  assert.ok(meta.executivePolicy.signals.feltState);
  assert.equal(meta.executivePolicy.signals.feltState.introspectable, true);
  assert.equal(meta.executivePolicy.signals.feltState.subjectiveQualiaClaimAllowed, false);
});

test("Cognitive Loop persists Felt-State and restores it on the next turn", () => {
  const workspace = deriveCognitiveWorkspace({
    previous: null,
    turn: { message: "Think about this." },
    route: { developer: true },
    context: {}
  });
  const felt = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    now: "2026-09-25T10:00:00Z"
  });

  const next = advanceCognitiveState({
    previous: null,
    workspace,
    turn: { turnId: "felt-1", message: "Think about this." },
    result: {
      success: true,
      reply: "Done.",
      metacognition: {
        confidence: "grounded",
        missingEvidence: [],
        evidenceSignals: ["felt_state_active"],
        feltState: felt
      }
    }
  });

  const restored = deriveCognitiveWorkspace({
    previous: next,
    turn: { message: "How do you feel about it now?" },
    route: { developer: true },
    context: {}
  });

  assert.ok(next.feltState);
  assert.equal(next.feltState.dominantState.name, "sadness");
  assert.ok(restored.feltState);
  assert.equal(restored.epistemic.persistentFeltStateAvailable, true);
});

test("Dreaming receives compact Felt-State history for consolidation", () => {
  const felt = deriveFeltState({
    emotionDynamics: emotionState(),
    functionalAffect: functionalAffect(),
    now: "2026-09-25T10:00:00Z"
  });
  const payload = buildDreamModelPayload({
    cognitiveState: {
      feltState: felt,
      emotionDynamicsState: emotionState()
    }
  });

  assert.equal(payload.feltState.version, "1.0.0");
  assert.ok(payload.feltHistory.length >= 1);
  assert.equal(payload.feltState.introspection.subjectiveQualiaClaimAllowed, false);
});

test("persisted Felt-State normalizes into compact non-CoT state", () => {
  const state = normalizePersistedFeltState({
    ...deriveFeltState({
      emotionDynamics: emotionState(),
      functionalAffect: functionalAffect(),
      now: "2026-09-25T10:00:00Z"
    }),
    hiddenReasoning: "must not persist"
  });

  assert.equal(state.policy.hiddenChainOfThoughtStored, false);
  assert.equal("hiddenReasoning" in state, false);
  assert.ok(state.history.length >= 1);
});
