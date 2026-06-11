// ari/core-spine/ari-core-expression.js
// Ari Core Expression Spine
// Purpose: Determine HOW Ari speaks after cognition and reflection finish.
// V2.1: Uses full Rebirth flat-field awareness for voice and response preparation.

window.Ari = window.Ari || {};

window.Ari.coreExpression = {
  version: "2.1.0",

  run(state = {}) {
    const rebirthContext =
      state.rebirthContext || {
        rebirth: state.rebirth || null,

        uncertaintyType: state.uncertaintyType || null,
        uncertaintyConfidence: state.uncertaintyConfidence || null,
        uncertaintyReason: state.uncertaintyReason || null,
        recommendedRecoveryQuestion:
          state.recommendedRecoveryQuestion || null,
        shouldUseEmotionRecovery:
          Boolean(state.shouldUseEmotionRecovery),
        shouldContinueObserving:
          Boolean(state.shouldContinueObserving),

        leadIdentity: state.leadIdentity || null,
        leadIdentityScore: state.leadIdentityScore || null,
        leadIdentityProtects: state.leadIdentityProtects || [],
        leadIdentityMotivations: state.leadIdentityMotivations || [],
        supportingIdentities: state.supportingIdentities || [],
        deferredIdentities: state.deferredIdentities || [],
        identityLeadershipMode: state.identityLeadershipMode || null,
        identityPrioritySummary: state.identityPrioritySummary || null,
        identityRecoveryQuestion:
          state.identityRecoveryQuestion || null,
        rankedIdentities: state.rankedIdentities || [],

        identityConflictDetected:
          Boolean(state.identityConflictDetected),
        conflictType: state.conflictType || null,
        resolvedLeadIdentity: state.resolvedLeadIdentity || null,
        resolvedSupportingIdentity:
          state.resolvedSupportingIdentity || null,
        resolutionMode: state.resolutionMode || null,
        resolutionReason: state.resolutionReason || null,
        identityConflictQuestion:
          state.identityConflictQuestion || null,
        competingIdentities: state.competingIdentities || [],

        valueIntegrationDetected:
          Boolean(state.valueIntegrationDetected),
        apparentConflict: state.apparentConflict || null,
        integratedValue: state.integratedValue || null,
        integrationStatement: state.integrationStatement || null,
        valueIntegrationQuestion:
          state.valueIntegrationQuestion || null,
        topValues: state.topValues || [],
        sharedValues: state.sharedValues || [],
        rankedValues: state.rankedValues || [],

        emotionalClassification:
          state.emotionalClassification || null,
        stewardshipScore: state.stewardshipScore || 0,
        fearScore: state.fearScore || 0,
        stewardshipFearExplanation:
          state.explanation || null,

        primaryLifeChapter: state.primaryLifeChapter || null,
        lifeChapterStrength: state.lifeChapterStrength || null,
        lifeChapterStatement: state.lifeChapterStatement || null,
        lifeChapterQuestion: state.lifeChapterQuestion || null,
        lifeChapterFocus: state.lifeChapterFocus || null,
        rankedLifeChapters: state.rankedLifeChapters || [],

        salienceLeadOrgan: state.salienceLeadOrgan || null,
        salienceLeadScore: state.salienceLeadScore || null,
        salienceMode: state.salienceMode || null,
        salienceQuestion: state.salienceQuestion || null,
        salienceReason: state.salienceReason || null,
        supportingSalienceOrgans:
          state.supportingSalienceOrgans || [],
        rankedSalienceDecisions:
          state.rankedSalienceDecisions || [],

        synthesisStatement: state.synthesisStatement || null,
        synthesisCautions: state.synthesisCautions || [],
        synthesisActionGuidance:
          state.synthesisActionGuidance || [],
        synthesisRecommendedQuestion:
          state.synthesisRecommendedQuestion || null,
        synthesisLeadOrgan: state.synthesisLeadOrgan || null,
        synthesisMode: state.synthesisMode || null,
        synthesisDebug: state.synthesisDebug || null,

        languageMode: state.languageMode || null,
        languageOpening: state.languageOpening || null,
        languageBody: state.languageBody || null,
        languageClosing: state.languageClosing || null,
        finalResponse: state.finalResponse || null,

        rebirthPipelineRan:
          Boolean(state.rebirthPipelineRan),
        rebirthPipelineSource:
          state.rebirthPipelineSource || null
      };

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
      wisdomQuestionRecovery: state.wisdomQuestionRecovery,

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
      selfReflection: state.selfReflection,

      // Full Rebirth context for voice engine
      rebirthContext
    };

    const voice =
      window.Ari.voiceEngine &&
      typeof window.Ari.voiceEngine.chooseVoice === "function"
        ? window.Ari.voiceEngine.chooseVoice({
            analysis,
            selfReflection: state.selfReflection
          })
        : {
            stance:
              state.salienceLeadOrgan ||
              state.resolvedLeadIdentity ||
              state.leadIdentity ||
              state.route?.primaryOrgan ||
              "steady_companion",

            openingStyle:
              state.salienceMode ||
              state.synthesisMode ||
              "steady_observation",

            confidenceStyle: {
              name:
                state.shouldContinueObserving ||
                state.uncertaintyType === "missing_information"
                  ? "tentative"
                  : "calibrated",
              prefix: ""
            },

            confidence:
              state.calibratedConfidence ||
              state.metaConfidence ||
              state.metaAwareness?.confidenceLevel ||
              "medium",

            warmth:
              state.resolvedLeadIdentity === "father" ||
              state.resolvedLeadIdentity === "family-protector"
                ? 82
                : 70,

            challenge:
              state.salienceLeadOrgan === "wisdom" ||
              state.salienceLeadOrgan === "identity"
                ? 65
                : 55,

            depth:
              state.salienceLeadOrgan === "meaning" ||
              state.salienceLeadOrgan === "values" ||
              state.salienceLeadOrgan === "wisdom"
                ? 80
                : 65,

            structure: [
              "observation",
              "understanding",
              "integration",
              "next_step"
            ],

            rhythm:
              state.salienceLeadOrgan === "uncertainty"
                ? "short_clear"
                : "adaptive",

            source: "voice-engine-unavailable"
          };

    const expression = {
      preferredResponse:
        state.finalResponse ||
        state.synthesisRecommendedQuestion ||
        state.salienceQuestion ||
        null,

      expressionLead:
        state.salienceLeadOrgan ||
        state.synthesisLeadOrgan ||
        state.route?.primaryOrgan ||
        "observer",

      expressionMode:
        state.salienceMode ||
        state.synthesisMode ||
        "continue_observing",

      expressionQuestion:
        state.synthesisRecommendedQuestion ||
        state.salienceQuestion ||
        state.recommendedRecoveryQuestion ||
        null,

      shouldPreferRebirthResponse:
        Boolean(
          state.finalResponse ||
            state.synthesisRecommendedQuestion ||
            state.salienceQuestion
        ),

      source: "ari-core-expression"
    };

    return {
      ...state,
      rebirthContext,
      voice,
      expression
    };
  }
};