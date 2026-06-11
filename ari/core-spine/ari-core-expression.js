// ari/core-spine/ari-core-expression.js
// Ari Core Expression Spine
// Purpose: Determine HOW Ari speaks after cognition finishes.
// V2.0 Rebirth Compatible

window.Ari = window.Ari || {};

window.Ari.coreExpression = {
  version: "2.0.0",

  run(state = {}) {

    const analysis = {
      message: state.message,
      context: state.context,
      questionType: state.questionType,

      observation: state.observation,

      lifeSignals: state.lifeSignals,
      lifeSignalWeighting: state.lifeSignalWeighting,
      signals: state.signals,
      salience: state.salience,

      values: state.values,
      identity: state.identity,
      conflicts: state.conflicts,
      executive: state.executive,

      insight: state.insight,
      metaAwareness: state.metaAwareness,

      wisdom: state.wisdom,
      wisdomResolution: state.wisdomResolution,
      regret: state.regret,
      longTermConsequence: state.longTermConsequence,
      wisdomSynthesis: state.wisdomSynthesis,

      attention: state.attention,
      route: state.route,

      emotion: state.emotion,
      emotionalIntelligence: state.emotionalIntelligence,
      underlyingEmotion: state.underlyingEmotion,
      emotionRecoveryQuestions: state.emotionRecoveryQuestions,

      meaning: state.meaning,
      personModel: state.personModel,
      beliefModel: state.beliefModel,
      simulation: state.simulation,

      self: state.self,
      selfValues: state.selfValues,
      constitution: state.constitution,
      selfReflection: state.selfReflection
    };

    // NEW REBIRTH ORGANS

    if (state.uncertaintyClassification) {
      analysis.uncertaintyClassification =
        state.uncertaintyClassification;
    }

    if (state.identityPriority) {
      analysis.identityPriority =
        state.identityPriority;
    }

    if (state.valueIntegration) {
      analysis.valueIntegration =
        state.valueIntegration;
    }

    if (state.stewardshipFearDifferentiation) {
      analysis.stewardshipFearDifferentiation =
        state.stewardshipFearDifferentiation;
    }

    if (state.lifeChapterDetection) {
      analysis.lifeChapterDetection =
        state.lifeChapterDetection;
    }

    if (state.salienceGovernance) {
      analysis.salienceGovernance =
        state.salienceGovernance;
    }

    if (state.synthesis) {
      analysis.synthesis =
        state.synthesis;
    }

    const voice =
      window.Ari.voiceEngine &&
      typeof window.Ari.voiceEngine.chooseVoice === "function"
        ? window.Ari.voiceEngine.chooseVoice({
            analysis,
            selfReflection: state.selfReflection
          })
        : {
            stance:
              state.identityPriority?.primaryIdentity ||
              state.route?.primaryOrgan ||
              "steady_companion",

            openingStyle: "steady_observation",

            confidenceStyle: {
              name: "tentative",
              prefix: ""
            },

            confidence:
              state.synthesis?.confidence ||
              state.metaAwareness?.confidenceLevel ||
              "medium",

            warmth: 70,
            challenge: 55,
            depth: 65,

            structure: [
              "observation",
              "understanding",
              "integration",
              "next_step"
            ],

            rhythm: "adaptive",

            source: "voice-engine-unavailable"
          };

    return {
      ...state,
      voice
    };
  }
};