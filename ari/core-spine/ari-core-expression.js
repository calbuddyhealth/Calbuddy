// ari/core-spine/ari-core-expression.js
// Ari Core Expression Spine
// Purpose: Determine HOW Ari speaks after cognition and reflection finish.
// V2.2: Safely reads Rebirth fields from state, summary, or rebirthContext.

window.Ari = window.Ari || {};

window.Ari.coreExpression = {
  version: "2.2.0",

  run(state = {}) {
    const summary = state.summary || {};
    const existingRebirth = state.rebirthContext || state.rebirth || {};

    const get = (key, fallback = null) =>
      existingRebirth[key] ??
      summary[key] ??
      state[key] ??
      fallback;

    const rebirthContext = {
      rebirth: existingRebirth || null,

      uncertaintyType: get("uncertaintyType"),
      uncertaintyConfidence: get("uncertaintyConfidence"),
      uncertaintyReason: get("uncertaintyReason"),
      recommendedRecoveryQuestion: get("recommendedRecoveryQuestion"),
      shouldUseEmotionRecovery: Boolean(get("shouldUseEmotionRecovery", false)),
      shouldContinueObserving: Boolean(get("shouldContinueObserving", false)),
      shouldSuppressUncertainty: Boolean(get("shouldSuppressUncertainty", false)),

      leadIdentity: get("leadIdentity"),
      leadIdentityScore: get("leadIdentityScore"),
      leadIdentityProtects: get("leadIdentityProtects", []),
      leadIdentityMotivations: get("leadIdentityMotivations", []),
      supportingIdentities: get("supportingIdentities", []),
      deferredIdentities: get("deferredIdentities", []),
      identityLeadershipMode: get("identityLeadershipMode"),
      identityPrioritySummary: get("identityPrioritySummary"),
      identityRecoveryQuestion: get("identityRecoveryQuestion"),
      rankedIdentities: get("rankedIdentities", []),

      identityConflictDetected: Boolean(get("identityConflictDetected", false)),
      conflictType: get("conflictType"),
      resolvedLeadIdentity: get("resolvedLeadIdentity"),
      resolvedSupportingIdentity: get("resolvedSupportingIdentity"),
      resolutionMode: get("resolutionMode"),
      resolutionReason: get("resolutionReason"),
      identityConflictQuestion: get("identityConflictQuestion"),
      competingIdentities: get("competingIdentities", []),

      valueIntegrationDetected: Boolean(get("valueIntegrationDetected", false)),
      apparentConflict: get("apparentConflict"),
      integratedValue: get("integratedValue"),
      integrationStatement: get("integrationStatement"),
      valueIntegrationQuestion: get("valueIntegrationQuestion"),
      topValues: get("topValues", []),
      sharedValues: get("sharedValues", []),
      rankedValues: get("rankedValues", []),

      emotionalClassification: get("emotionalClassification"),
      stewardshipScore: get("stewardshipScore", 0),
      fearScore: get("fearScore", 0),
      stewardshipFearExplanation: get("explanation"),

      primaryLifeChapter: get("primaryLifeChapter"),
      lifeChapterStrength: get("lifeChapterStrength"),
      lifeChapterStatement: get("lifeChapterStatement"),
      lifeChapterQuestion: get("lifeChapterQuestion"),
      lifeChapterFocus: get("lifeChapterFocus"),
      rankedLifeChapters: get("rankedLifeChapters", []),

      salienceLeadOrgan: get("salienceLeadOrgan"),
      salienceLeadScore: get("salienceLeadScore"),
      salienceMode: get("salienceMode"),
      salienceQuestion: get("salienceQuestion"),
      salienceReason: get("salienceReason"),
      supportingSalienceOrgans: get("supportingSalienceOrgans", []),
      rankedSalienceDecisions: get("rankedSalienceDecisions", []),

      synthesisStatement: get("synthesisStatement"),
      synthesisCautions: get("synthesisCautions", []),
      synthesisActionGuidance: get("synthesisActionGuidance", []),
      synthesisRecommendedQuestion: get("synthesisRecommendedQuestion"),
      synthesisLeadOrgan: get("synthesisLeadOrgan"),
      synthesisMode: get("synthesisMode"),
      synthesisDebug: get("synthesisDebug"),

      languageMode: get("languageMode"),
      languageOpening: get("languageOpening"),
      languageBody: get("languageBody"),
      languageClosing: get("languageClosing"),
      finalResponse: get("finalResponse"),

      rebirthPipelineRan: Boolean(get("rebirthPipelineRan", false)),
      rebirthPipelineSource: get("rebirthPipelineSource")
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

      summary,
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
              rebirthContext.salienceLeadOrgan ||
              rebirthContext.resolvedLeadIdentity ||
              rebirthContext.leadIdentity ||
              state.route?.primaryOrgan ||
              "steady_companion",

            openingStyle:
              rebirthContext.salienceMode ||
              rebirthContext.synthesisMode ||
              "steady_observation",

            confidenceStyle: {
              name:
                rebirthContext.shouldContinueObserving ||
                rebirthContext.uncertaintyType === "missing_information"
                  ? "tentative"
                  : "calibrated",
              prefix: ""
            },

            confidence:
              get("calibratedConfidence") ||
              get("metaConfidence") ||
              state.metaAwareness?.confidenceLevel ||
              "medium",

            warmth:
              rebirthContext.resolvedLeadIdentity === "father" ||
              rebirthContext.resolvedLeadIdentity === "family-protector"
                ? 82
                : 70,

            challenge:
              rebirthContext.salienceLeadOrgan === "wisdom" ||
              rebirthContext.salienceLeadOrgan === "identity"
                ? 65
                : 55,

            depth:
              rebirthContext.salienceLeadOrgan === "meaning" ||
              rebirthContext.salienceLeadOrgan === "values" ||
              rebirthContext.salienceLeadOrgan === "wisdom"
                ? 80
                : 65,

            structure: [
              "observation",
              "understanding",
              "integration",
              "next_step"
            ],

            rhythm:
              rebirthContext.salienceLeadOrgan === "uncertainty"
                ? "short_clear"
                : "adaptive",

            source: "voice-engine-unavailable"
          };

    const expression = {
      preferredResponse:
        rebirthContext.finalResponse ||
        rebirthContext.synthesisRecommendedQuestion ||
        rebirthContext.salienceQuestion ||
        null,

      expressionLead:
        rebirthContext.salienceLeadOrgan ||
        rebirthContext.synthesisLeadOrgan ||
        state.route?.primaryOrgan ||
        "observer",

      expressionMode:
        rebirthContext.salienceMode ||
        rebirthContext.synthesisMode ||
        "continue_observing",

      expressionQuestion:
        rebirthContext.synthesisRecommendedQuestion ||
        rebirthContext.salienceQuestion ||
        rebirthContext.recommendedRecoveryQuestion ||
        null,

      shouldPreferRebirthResponse:
        Boolean(
          rebirthContext.finalResponse ||
            rebirthContext.synthesisRecommendedQuestion ||
            rebirthContext.salienceQuestion
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