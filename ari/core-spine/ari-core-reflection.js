// ari/core-spine/ari-core-reflection.js
// Ari Core Reflection Spine
// Purpose: Handle Ari's self model, values, constitution, and self reflection.
// Answers: Who is Ari in this moment?
// V1.2: Adds full Rebirth flat-field awareness after cognition bridge.

window.Ari = window.Ari || {};

window.Ari.coreReflection = {
  version: "1.2.0",

  run(state = {}) {
    const self = window.Ari.selfModel
      ? window.Ari.selfModel.getSelf()
      : null;

    const selfValues = window.Ari.selfValues
      ? window.Ari.selfValues.getValues()
      : [];

    const constitution = window.Ari.constitution
      ? window.Ari.constitution.getHierarchy()
      : [];

    const rebirthContext = {
      // Full grouped Rebirth object from cognition bridge
      rebirth: state.rebirth || null,

      // Uncertainty
      uncertaintyType: state.uncertaintyType || null,
      uncertaintyConfidence: state.uncertaintyConfidence || null,
      uncertaintyReason: state.uncertaintyReason || null,
      recommendedRecoveryQuestion:
        state.recommendedRecoveryQuestion || null,
      shouldUseEmotionRecovery:
        Boolean(state.shouldUseEmotionRecovery),
      shouldContinueObserving:
        Boolean(state.shouldContinueObserving),

      // Identity priority
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

      // Identity conflict
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

      // Values
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

      // Stewardship vs fear
      emotionalClassification:
        state.emotionalClassification || null,
      stewardshipScore: state.stewardshipScore || 0,
      fearScore: state.fearScore || 0,
      stewardshipFearConfidence: state.confidence || null,
      stewardshipFearExplanation:
        state.explanation || null,

      // Life chapter
      primaryLifeChapter: state.primaryLifeChapter || null,
      lifeChapterStrength: state.lifeChapterStrength || null,
      lifeChapterStatement: state.lifeChapterStatement || null,
      lifeChapterQuestion: state.lifeChapterQuestion || null,
      lifeChapterFocus: state.lifeChapterFocus || null,
      rankedLifeChapters: state.rankedLifeChapters || [],

      // Rebirth salience governor
      salienceLeadOrgan: state.salienceLeadOrgan || null,
      salienceLeadScore: state.salienceLeadScore || null,
      salienceMode: state.salienceMode || null,
      salienceQuestion: state.salienceQuestion || null,
      salienceReason: state.salienceReason || null,
      supportingSalienceOrgans:
        state.supportingSalienceOrgans || [],
      rankedSalienceDecisions:
        state.rankedSalienceDecisions || [],

      // Synthesis
      synthesisStatement: state.synthesisStatement || null,
      synthesisCautions: state.synthesisCautions || [],
      synthesisActionGuidance:
        state.synthesisActionGuidance || [],
      synthesisRecommendedQuestion:
        state.synthesisRecommendedQuestion || null,
      synthesisLeadOrgan: state.synthesisLeadOrgan || null,
      synthesisMode: state.synthesisMode || null,
      synthesisDebug: state.synthesisDebug || null,

      // Language composer
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

    const selfReflection = window.Ari.selfReflection
      ? window.Ari.selfReflection.reflect({
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

          earlyInsight: state.earlyInsight,
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

          // Full Rebirth context
          rebirthContext,

          self,
          selfValues,
          constitution
        })
      : {
          stance: {
            name:
              state.salienceLeadOrgan ||
              state.resolvedLeadIdentity ||
              state.leadIdentity ||
              state.route?.primaryOrgan ||
              "steady_companion"
          },
          leadPrinciple:
            state.integratedValue ||
            state.highestGood ||
            null,
          leadValue:
            state.integratedValue ||
            state.wisdomLeadingGood ||
            null,
          approach:
            state.salienceMode ||
            state.synthesisMode ||
            null,
          confidence:
            state.calibratedConfidence ||
            state.metaConfidence ||
            "low",
          source: "self-reflection-unavailable"
        };

    return {
      ...state,
      self,
      selfValues,
      constitution,
      rebirthContext,
      selfReflection
    };
  }
};