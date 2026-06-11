// ari/core-spine/ari-core-summary.js
// Ari Core Summary Spine
// Purpose: Create Ari's system/debug summary.
// V1.2: Adds evidence, wisdom, and wisdom conflict resolution fields.

window.Ari = window.Ari || {};

window.Ari.coreSummary = {
  version: "1.2.0",

  create(analysis = {}) {
    const observation = analysis.observation || {};
    const values = analysis.values || {};
    const identity = analysis.identity || {};
    const conflicts = analysis.conflicts || {};
    const executive = analysis.executive || {};
    const insight = analysis.insight || {};
    const metaAwareness = analysis.metaAwareness || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
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

      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,

      dominantValue: values.dominantValue || null,
      dominantIdentity: identity.dominantIdentity?.name || null,
      dominantIdentityConfidence: identity.dominantIdentity?.confidence || null,
      dominantTheme: identity.dominantTheme || null,

      primaryConflict: conflicts.primaryConflict?.name || null,
      conflictIntensity: conflicts.conflictIntensity || "none",
      competingFor: conflicts.competingFor || [],
      needsExecutiveFunction: Boolean(conflicts.needsExecutiveFunction),

      primaryPriority: executive.primaryPriority?.name || null,
      secondaryPriorities:
        executive.secondaryPriorities?.map((item) => item.name) || [],
      thingsToDelay:
        executive.thingsToDelay?.map((item) => item.name) || [],
      executiveDecision: executive.executiveDecision || null,
      recommendedFocus: executive.recommendedFocus || null,

      pattern: insight.pattern?.name || null,
      patternConfidence: insight.pattern?.confidence || null,
      hiddenConflict: insight.hiddenConflict?.name || null,
      hiddenConflictConfidence: insight.hiddenConflict?.confidence || null,
      avoidance: insight.avoidance?.name || null,
      avoidanceConfidence: insight.avoidance?.confidence || null,
      tradeoff: insight.tradeoff?.name || null,
      tradeoffConfidence: insight.tradeoff?.confidence || null,
      hiddenMotive: insight.hiddenMotive?.name || null,
      hiddenMotiveConfidence: insight.hiddenMotive?.confidence || null,

      hypothesis: insight.hypothesis?.name || null,
      hypothesisConfidence: insight.hypothesis?.confidence || null,
      hypothesisExplanation: insight.hypothesis?.explanation || null,
      hypotheses: insight.hypotheses?.map((item) => item.name) || [],

      counterHypothesis: insight.counterHypothesis?.name || null,
      counterHypothesisConfidence:
        insight.counterHypothesis?.confidence || null,
      counterHypothesisExplanation:
        insight.counterHypothesis?.explanation || null,
      counterHypotheses:
        insight.counterHypotheses?.map((item) => item.name) || [],

      evidenceStrength: insight.evidenceStrength || null,
      evidenceScore: insight.evidenceScore || null,
      evidenceSummary: insight.evidenceSummary || null,
      supportingEvidence: insight.supportingEvidence || [],
      contradictingEvidence: insight.contradictingEvidence || [],
      missingEvidence: insight.missingEvidence || [],

      calibratedConfidence: insight.calibratedConfidence || null,
      confidenceScore: insight.confidenceScore || null,
      confidenceReason: insight.confidenceReason || null,
      shouldSpeakHypothesis: Boolean(insight.shouldSpeakHypothesis),

      oneLineInsight: insight.oneLineInsight || null,

      metaConclusion: metaAwareness.primaryConclusion || null,
      metaConfidence: metaAwareness.confidenceLevel || null,
      metaConfidenceScore: metaAwareness.confidenceScore || null,
      metaConfidenceReason: metaAwareness.confidenceReason || null,
      alternativeExplanation: metaAwareness.alternativeExplanation || null,

      metaEvidenceStrength: metaAwareness.evidenceStrength || null,
      metaSupportingEvidence: metaAwareness.supportingEvidence || [],
      metaContradictingEvidence: metaAwareness.contradictingEvidence || [],
      metaMissingEvidence: metaAwareness.missingEvidence || [],

      uncertaintyAreas: metaAwareness.uncertaintyAreas || [],
      knownUnknowns: metaAwareness.knownUnknowns || [],
      metaRecommendation: metaAwareness.recommendation || null,

      wisdomPrinciple: wisdom.wisdomPrinciple || null,
      wisdomTension: wisdom.wisdomTension?.name || null,
      wisdomTensionSideA: wisdom.wisdomTension?.sideA || null,
      wisdomTensionSideB: wisdom.wisdomTension?.sideB || null,
      highestGood: wisdom.highestGood || null,
      longTermPriority: wisdom.longTermPriority || null,
      likelyRegret: wisdom.likelyRegret || null,
      wisdomStatement: wisdom.wisdomStatement || null,
      wisdomConfidence: wisdom.confidence || null,
      wisdomArchetype: wisdom.archetype?.name || null,
      wisdomArchetypeInspiration: wisdom.archetype?.inspiration || null,
      wisdomArchetypeLesson: wisdom.archetype?.lesson || null,

      wisdomResolutionMode: wisdomResolution.resolutionMode || null,
      wisdomLeadingGood: wisdomResolution.leadingGood || null,
      wisdomSupportingGood: wisdomResolution.supportingGood || null,
      wisdomBoundary: wisdomResolution.boundary || null,
      wisdomIntegration: wisdomResolution.integration || null,
      wisdomResolvedStatement: wisdomResolution.resolvedStatement || null,
      wisdomResolutionConfidence: wisdomResolution.confidence || null,

      meaningTheme: meaning.theme || null,
      meaningConfidence: meaning.confidence || null,
      meaningReason: meaning.reason || null,
      meaningStatement: meaning.meaning || null,
      humanTruth: meaning.humanTruth || null,

      personLifeChapter: personModel.lifeChapter?.name || null,
      personLifeChapterConfidence: personModel.lifeChapter?.confidence || null,
      personPrimaryRole: personModel.snapshot?.primaryRole || null,
      personMainPressure: personModel.snapshot?.mainPressure || null,
      personMainNeed: personModel.snapshot?.mainNeed || null,
      personRecurringPattern: personModel.snapshot?.recurringPattern || null,

      primaryBelief: beliefModel.primaryBelief?.name || null,
      primaryBeliefConfidence: beliefModel.primaryBelief?.confidence || null,
      beliefSummary: beliefModel.beliefSummary || null,

      primarySimulation: simulation.primarySimulation?.name || null,
      simulationTheme: simulation.primarySimulation?.theme || null,
      likelyRegretFromSimulation: simulation.primarySimulation?.likelyRegret || null,

      selfStance: selfReflection.stance?.name || null,
      selfLeadPrinciple: selfReflection.leadPrinciple || null,
      selfLeadValue: selfReflection.leadValue || null,
      selfApproach: selfReflection.approach || null,
      selfReflectionConfidence: selfReflection.confidence || null,

      voiceStance: voice.stance || null,
      voiceOpeningStyle: voice.openingStyle || null,
      voiceConfidence: voice.confidence || null,
      voiceConfidenceStyle: voice.confidenceStyle?.name || null,
      voiceWarmth: voice.warmth || null,
      voiceChallenge: voice.challenge || null,
      voiceDepth: voice.depth || null,
      voiceStructure: voice.structure || [],
      voiceRhythm: voice.rhythm || null,

      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],

      guardianRequired: Boolean(
        route.guardianRequired || attention.guardianAttentionNeeded
      ),

      primaryEmotion: emotion.primaryEmotion || "curiosity",
      secondaryEmotions: emotion.secondaryEmotions || [],
      balance: emotion.balance || { brain: 70, heart: 20, soul: 10 },

      surfaceEmotion: emotionalIntelligence.surfaceEmotion?.name || null,
      underlyingEmotion:
        emotionalIntelligence.underlyingEmotion?.name || null,
      emotionalTension:
        emotionalIntelligence.emotionalTension?.level || null,
      rootNeed: emotionalIntelligence.rootNeed?.name || null,
      protecting: emotionalIntelligence.protecting?.name || null,
      regulationStrategy:
        emotionalIntelligence.regulation?.strategy || null,

      memoryCandidate: memory.shouldRemember ? memory : null,

      observationSource: observation.source || "unknown",
      valueSource: values.source || "unknown",
      identitySource: identity.source || "unknown",
      conflictSource: conflicts.source || "unknown",
      executiveSource: executive.source || "unknown",
      insightSource: insight.source || "unknown",
      metaAwarenessSource: metaAwareness.source || "unknown",
      wisdomSource: wisdom.source || "unknown",
      wisdomResolutionSource: wisdomResolution.source || "unknown",
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