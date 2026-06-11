// ari/core-spine/ari-core-summary.js
// Ari Core Summary Spine
// Purpose: Create Ari's system/debug summary.
// V1.6: Adds life weighting, salience, and language-route visibility.

window.Ari = window.Ari || {};

window.Ari.coreSummary = {
  version: "1.6.0",

  create(analysis = {}) {
    const lifeSignals = analysis.lifeSignals || {};
    const signals = analysis.signals || {};
    const lifeSignalWeighting = analysis.lifeSignalWeighting || {};
    const salience = analysis.salience || {};

    const languageRoute = window.Ari.languageRouter
      ? window.Ari.languageRouter.route(analysis)
      : null;

    const observation = analysis.observation || {};
    const values = analysis.values || {};
    const identity = analysis.identity || {};
    const conflicts = analysis.conflicts || {};
    const executive = analysis.executive || {};
    const insight = analysis.insight || {};
    const metaAwareness = analysis.metaAwareness || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const longTermConsequence = analysis.longTermConsequence || {};
    const wisdomSynthesis = analysis.wisdomSynthesis || {};
    const wisdomQuestionRecovery = analysis.wisdomQuestionRecovery || {};
    const underlyingEmotionDepth = analysis.underlyingEmotion || {};
    const emotionRecoveryQuestions = analysis.emotionRecoveryQuestions || {};

    const attention = analysis.attention || {};
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const simulation = analysis.simulation || {};
    const selfReflection = analysis.selfReflection || {};
    const voice = analysis.voice || {};
    const memory = analysis.memory || {};

    return {
      questionType: analysis.questionType || "unknown",

      // LANGUAGE ROUTING
      languageRoute,
      recommendedLanguageLead: signals.recommendedLanguageLead || null,

      // LIFE SIGNALS
      lifeSignals: lifeSignals.signalNames || [],
      primaryLifeSignal: lifeSignals.primarySignal?.name || null,
      hasMajorLifeSignal: Boolean(lifeSignals.hasMajorLifeSignal),

      // LIFE SIGNAL WEIGHTING
      primaryWeightedLifeSignal:
        lifeSignalWeighting.primaryWeightedLifeSignalName || null,
      primaryWeightedLifeSignalWeight:
        lifeSignalWeighting.primaryWeightedLifeSignalWeight || 0,
      lifePriorityClass:
        lifeSignalWeighting.lifePriorityClass || null,
      rankedLifeSignals:
        lifeSignalWeighting.rankedLifeSignals?.slice(0, 8).map((item) => ({
          name: item.name,
          weight: item.weight,
          category: item.category,
          confidence: item.confidence
        })) || [],

      // SIGNAL SYSTEM
      strongestSignal: signals.strongestSignalName || null,
      strongestSignalCategory: signals.strongestSignalCategory || null,
      strongestSignalStrength: signals.strongestSignalStrength || 0,
      recommendedOrgans: signals.recommendedOrgans || [],
      rankedSignals:
        signals.rankedSignals?.slice(0, 8).map((item) => ({
          name: item.name,
          category: item.category,
          strength: item.strength,
          confidence: item.confidence
        })) || [],

      // SALIENCE NETWORK
      primarySalienceName: salience.primarySalienceName || null,
      primarySalienceCategory: salience.primarySalienceCategory || null,
      primarySalienceStrength: salience.primarySalienceStrength || 0,
      primarySalienceReason: salience.primarySalienceReason || null,
      salienceRecommendedLead: salience.recommendedLead || null,
      salienceRecommendedMode: salience.recommendedMode || null,
      salienceShouldOverrideLanguage:
        Boolean(salience.shouldOverrideLanguage),
      rankedSalience:
        salience.rankedSalience?.slice(0, 8).map((item) => ({
          name: item.name,
          category: item.category,
          strength: item.strength,
          reason: item.reason
        })) || [],

      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,

      dominantValue: values.dominantValue || null,
      dominantIdentity: identity.dominantIdentity?.name || null,
      dominantTheme: identity.dominantTheme || null,

      primaryConflict: conflicts.primaryConflict?.name || null,
      conflictIntensity: conflicts.conflictIntensity || "none",
      competingFor: conflicts.competingFor || [],

      primaryPriority: executive.primaryPriority?.name || null,
      executiveDecision: executive.executiveDecision || null,
      recommendedFocus: executive.recommendedFocus || null,
      thingsToDelay:
        executive.thingsToDelay?.map((item) => item.name || item) || [],

      pattern: insight.pattern?.name || null,
      hiddenConflict: insight.hiddenConflict?.name || null,
      tradeoff: insight.tradeoff?.name || null,
      hiddenMotive: insight.hiddenMotive?.name || null,

      hypothesis: insight.hypothesis?.name || null,
      hypothesisExplanation: insight.hypothesis?.explanation || null,
      counterHypothesis: insight.counterHypothesis?.name || null,
      counterHypothesisExplanation:
        insight.counterHypothesis?.explanation || null,

      evidenceStrength: insight.evidenceStrength || null,
      evidenceScore: insight.evidenceScore || null,
      evidenceSummary: insight.evidenceSummary || null,

      calibratedConfidence: insight.calibratedConfidence || null,
      confidenceScore: insight.confidenceScore || null,
      confidenceReason: insight.confidenceReason || null,
      oneLineInsight: insight.oneLineInsight || null,

      metaConclusion: metaAwareness.primaryConclusion || null,
      metaConfidence: metaAwareness.confidenceLevel || null,
      metaRecommendation: metaAwareness.recommendation || null,
      uncertaintyAreas: metaAwareness.uncertaintyAreas || [],
      knownUnknowns: metaAwareness.knownUnknowns || [],

      wisdomPrinciple: wisdom.wisdomPrinciple || null,
      wisdomTension: wisdom.wisdomTension?.name || null,
      highestGood: wisdom.highestGood || null,
      longTermPriority: wisdom.longTermPriority || null,
      likelyRegret: wisdom.likelyRegret || null,
      wisdomStatement: wisdom.wisdomStatement || null,
      wisdomConfidence: wisdom.confidence || null,
      wisdomArchetype: wisdom.archetype?.name || null,
      wisdomArchetypeInspiration:
        wisdom.archetype?.inspiration || null,
      wisdomArchetypeLesson:
        wisdom.archetype?.lesson || null,

      wisdomResolutionMode: wisdomResolution.resolutionMode || null,
      wisdomLeadingGood: wisdomResolution.leadingGood || null,
      wisdomSupportingGood: wisdomResolution.supportingGood || null,
      wisdomBoundary: wisdomResolution.boundary || null,
      wisdomIntegration: wisdomResolution.integration || null,
      wisdomResolvedStatement:
        wisdomResolution.resolvedStatement || null,
      wisdomResolutionConfidence: wisdomResolution.confidence || null,

      regretType: regret.regretType || null,
      regretStatement: regret.regretStatement || null,
      regretIntensity: regret.regretIntensity || null,
      regretPreventableAction: regret.preventableAction || null,

      longTermPath: longTermConsequence.path || null,
      fiveYearConsequence:
        longTermConsequence.fiveYearConsequence || null,
      protectedFuture:
        longTermConsequence.protectedFuture || null,
      riskIfIgnored:
        longTermConsequence.riskIfIgnored || null,
      courseCorrection:
        longTermConsequence.courseCorrection || null,
      longTermConsequenceConfidence:
        longTermConsequence.confidence || null,

      wisdomSynthesis: wisdomSynthesis.synthesis || null,
      wisdomPrimaryPrinciple:
        wisdomSynthesis.primaryPrinciple || null,
      wisdomPrincipleStatements:
        wisdomSynthesis.principleStatements || [],
      wisdomSynthesisArchetype:
        wisdomSynthesis.archetype || null,

      wisdomQuestionRecoveryNeeded:
        Boolean(wisdomQuestionRecovery.shouldRecover),
      wisdomRecoveryReason:
        wisdomQuestionRecovery.recoveryReason || null,
      wisdomRecoveryQuestion:
        wisdomQuestionRecovery.primaryQuestion || null,
      wisdomRecoverySupportingQuestions:
        wisdomQuestionRecovery.supportingQuestions || [],

      underlyingEmotionDepth:
        underlyingEmotionDepth.primaryUnderlyingEmotion?.name || null,
      underlyingEmotionDepthConfidence:
        underlyingEmotionDepth.primaryUnderlyingEmotion?.confidence || null,
      emotionalSource:
        underlyingEmotionDepth.emotionalSource || null,
      protectiveStrategy:
        underlyingEmotionDepth.protectiveStrategy || null,
      hiddenFear:
        underlyingEmotionDepth.hiddenFear || null,
      vulnerableTruth:
        underlyingEmotionDepth.vulnerableTruth || null,
      underlyingEmotionCandidates:
        underlyingEmotionDepth.candidates?.map((item) => item.name) || [],

      emotionRecoveryShouldAsk:
        Boolean(emotionRecoveryQuestions.shouldAsk),
      emotionRecoveryQuestionType:
        emotionRecoveryQuestions.questionType || null,
      emotionRecoveryQuestion:
        emotionRecoveryQuestions.primaryQuestion || null,
      emotionRecoverySupportingQuestions:
        emotionRecoveryQuestions.supportingQuestions || [],

      meaningTheme: meaning.theme || null,
      meaningConfidence: meaning.confidence || null,
      meaningStatement: meaning.meaning || null,
      humanTruth: meaning.humanTruth || null,

      personLifeChapter: personModel.lifeChapter?.name || null,
      personPrimaryRole:
        personModel.snapshot?.primaryRole || null,
      personMainNeed:
        personModel.snapshot?.mainNeed || null,
      personRecurringPattern:
        personModel.snapshot?.recurringPattern || null,

      primaryBelief:
        beliefModel.primaryBelief?.name || null,
      primaryBeliefConfidence:
        beliefModel.primaryBelief?.confidence || null,
      beliefSummary:
        beliefModel.beliefSummary || null,

      primarySimulation:
        simulation.primarySimulation?.name || null,
      simulationTheme:
        simulation.primarySimulation?.theme || null,

      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],

      primaryEmotion: emotion.primaryEmotion || "curiosity",
      secondaryEmotions: emotion.secondaryEmotions || [],
      surfaceEmotion:
        emotionalIntelligence.surfaceEmotion?.name || null,
      underlyingEmotion:
        emotionalIntelligence.underlyingEmotion?.name || null,
      rootNeed:
        emotionalIntelligence.rootNeed?.name || null,
      protecting:
        emotionalIntelligence.protecting?.name || null,

      memoryCandidate: memory.shouldRemember ? memory : null,

      lifeSignalSource: lifeSignals.source || "unknown",
      lifeSignalWeightingSource:
        lifeSignalWeighting.source || "unknown",
      signalSystemSource: signals.source || "unknown",
      salienceSource: salience.source || "unknown",

      insightSource: insight.source || "unknown",
      metaAwarenessSource: metaAwareness.source || "unknown",
      wisdomSource: wisdom.source || "unknown",
      wisdomResolutionSource:
        wisdomResolution.source || "unknown",
      regretSource: regret.source || "unknown",
      longTermConsequenceSource:
        longTermConsequence.source || "unknown",
      wisdomSynthesisSource:
        wisdomSynthesis.source || "unknown",
      wisdomQuestionRecoverySource:
        wisdomQuestionRecovery.source || "unknown",
      underlyingEmotionDepthSource:
        underlyingEmotionDepth.source || "unknown",
      emotionRecoveryQuestionsSource:
        emotionRecoveryQuestions.source || "unknown",

      observationSource: observation.source || "unknown",
      valueSource: values.source || "unknown",
      identitySource: identity.source || "unknown",
      conflictSource: conflicts.source || "unknown",
      executiveSource: executive.source || "unknown",
      meaningSource: meaning.source || "unknown",
      personModelSource: personModel.source || "unknown",
      beliefSource: beliefModel.source || "unknown",
      simulationSource: simulation.source || "unknown",
      selfReflectionSource: selfReflection.source || "unknown",
      voiceSource: voice.source || "unknown",
      attentionSource: attention.source || "unknown",
      emotionSource: emotion.source || "unknown",
      emotionalIntelligenceSource:
        emotionalIntelligence.source || "unknown",
      memorySource: memory.source || "unknown",

      authorityHierarchy: window.Ari.authority
        ? window.Ari.authority.hierarchy
        : []
    };
  }
};