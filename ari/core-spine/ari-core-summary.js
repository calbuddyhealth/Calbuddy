// ari/core-spine/ari-core-summary.js
// Ari Core Summary Spine
// Purpose: Create Ari's base system/debug summary.
// V3.0
// Adds:
// - Safety Context Gate placeholders/debug fields.
// - Observer Evidence placeholders/debug fields.
// - Situation Contract placeholders/debug fields.
// - Contract Bridge / Contract Authority placeholders.
// - Keeps legacy governor / multi-lane / authority fields for comparison only.
// - Keeps Rebirth pipeline outside this file to prevent duplicate execution.

window.Ari = window.Ari || {};

window.Ari.coreSummary = {
  version: "3.0.0",

  create(analysis = {}) {
    const lifeSignals = analysis.lifeSignals || {};
    const signals = analysis.signals || {};
    const lifeSignalWeighting = analysis.lifeSignalWeighting || {};
    const salience = analysis.salience || {};
    const observation = analysis.observation || {};

    const languageRoute = window.Ari.languageRouter
      ? window.Ari.languageRouter.route(analysis)
      : null;

    const safetyContextGate =
      analysis.safetyContextGate ||
      analysis.safetyGate ||
      {};

    const observerEvidence =
      analysis.observerEvidence ||
      analysis.observer ||
      {};

    const situationMap =
      analysis.situationMap ||
      analysis.situation ||
      {};

const triage =
  analysis.triage ||
  analysis.triageEngine ||
  analysis.triageResult ||
  {};

    const situationContract =
      analysis.situationContract ||
      analysis.contract ||
      {};

    const contractBridge =
      analysis.contractBridge ||
      {};

    const domainGovernor =
      analysis.domainGovernor ||
      analysis.universalDomainGovernor ||
      analysis.domainDecision ||
      {};

    const authorityMap =
      analysis.authorityMap ||
      analysis.authority ||
      {};

    const multiLanePlan =
      analysis.multiLanePlan ||
      analysis.multiLanePlanner ||
      {};

    const situationReview =
      analysis.situationReview ||
      analysis.situationReviewConsole ||
      {};

    const knowledge =
      analysis.knowledge ||
      analysis.knowledgeRouter ||
      analysis.knowledgeResult ||
      {};

    const teaching =
      analysis.teaching ||
      analysis.teachingAnswer ||
      analysis.teachingResult ||
      {};

    const dualSalience =
      analysis.dualSalience ||
      observation.dualSalience ||
      {};

    const observerHierarchy =
      analysis.observerHierarchy ||
      analysis.hierarchy ||
      observation.observerHierarchy ||
      observation.hierarchy ||
      {};

    const observationLedger =
      analysis.observationLedger ||
      observerEvidence.observationLedger ||
      observerEvidence.observations ||
      observation.observationLedger ||
      [];

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
    const organism = analysis.organism || {};
    const responseIntent = analysis.responseIntent || {};
    const mouthDirector = analysis.mouthDirector || {};

    const stewardshipFear =
      analysis.stewardshipFear ||
      analysis.stewardshipFearDifferentiator ||
      analysis.emotionalClassification ||
      {};

    const emotionIntegrator =
      analysis.emotionIntegrator ||
      analysis.emotionIntegration ||
      analysis.integratedEmotion ||
      {};

    const lifeChapter =
      analysis.lifeChapter ||
      analysis.meaningChapter ||
      analysis.chapter ||
      {};

    const identityPriority =
      analysis.identityPriority ||
      analysis.identityLeadership ||
      analysis.identity ||
      {};

    const valueIntegration =
      analysis.valueIntegration ||
      analysis.valuesIntegration ||
      analysis.values ||
      {};

    const salienceGovernor =
      analysis.salienceGovernor ||
      analysis.governor ||
      analysis.salienceDecision ||
      {};

    const rawUserMessage =
      analysis.userMessage ||
      analysis.message ||
      analysis.input ||
      observation.message ||
      observation.originalMessage ||
      observation.rawMessage ||
      "";

    const normalizedUserMessage =
      observation.normalizedMessage ||
      analysis.normalizedMessage ||
      String(rawUserMessage || "").toLowerCase().trim();

    return {
      userMessage: rawUserMessage,
      message: rawUserMessage,
      input: rawUserMessage,
      normalizedMessage: normalizedUserMessage,

      questionType: analysis.questionType || "unknown",
      languageRoute,
      recommendedLanguageLead: signals.recommendedLanguageLead || null,

      // ==================================================
      // NEW CORE CHAIN: SAFETY CONTEXT GATE
      // ==================================================

      safetyContextGate,

      safetyContextGateRan:
        safetyContextGate.safetyContextGateRan ??
        analysis.safetyContextGateRan ??
        null,

      safetyContextGateVersion:
        safetyContextGate.safetyContextGateVersion ||
        analysis.safetyContextGateVersion ||
        null,

      safetyContextGateSource:
        safetyContextGate.source ||
        analysis.safetyContextGateSource ||
        "not-yet-run",

      safetyOverride:
        safetyContextGate.override ??
        analysis.override ??
        null,

      safetyRiskLevel:
        safetyContextGate.riskLevel ||
        analysis.riskLevel ||
        "none",

      safetyRiskType:
        safetyContextGate.riskType ||
        analysis.riskType ||
        "none",

      safetyFollowUpNeeded:
        safetyContextGate.followUpNeeded ??
        analysis.followUpNeeded ??
        false,

      safetyFollowUpQuestion:
        safetyContextGate.followUpQuestion ||
        analysis.followUpQuestion ||
        null,

      safetyShouldStopNormalResponse:
        safetyContextGate.shouldStopNormalResponse ??
        analysis.shouldStopNormalResponse ??
        false,

      safetyGateReasons:
        safetyContextGate.reasons ||
        analysis.safetyGateReasons ||
        [],

      safetyGateEvidence:
        safetyContextGate.evidence ||
        analysis.safetyGateEvidence ||
        [],

      // ==================================================
      // NEW CORE CHAIN: OBSERVER EVIDENCE
      // ==================================================

      observerEvidence,

      observerEvidenceRan:
        observerEvidence.observerEvidenceRan ??
        analysis.observerEvidenceRan ??
        null,

      observerEvidenceVersion:
        observerEvidence.observerEvidenceVersion ||
        analysis.observerEvidenceVersion ||
        null,

      observerEvidenceSource:
        observerEvidence.observerEvidenceSource ||
        observerEvidence.source ||
        analysis.observerEvidenceSource ||
        "not-yet-run",

      rawUserMessage:
        observerEvidence.rawUserMessage ||
        rawUserMessage,

      normalizedObservedText:
        observerEvidence.normalizedObservedText ||
        normalizedUserMessage,

      observations:
        observerEvidence.observations ||
        analysis.observations ||
        [],

      observationCount:
        observerEvidence.observationCount ??
        analysis.observationCount ??
        0,

      observedTypes:
        observerEvidence.observedTypes ||
        analysis.observedTypes ||
        [],

      observedValues:
        observerEvidence.observedValues ||
        analysis.observedValues ||
        [],

      // Compatibility with older lab/debug outputs
      observationLedger,
      observationLedgerRan: Array.isArray(observationLedger),
      observationLedgerCount: observationLedger.length || 0,

      strongestObservation:
        analysis.strongestObservation ||
        observationLedger[0]?.signal ||
        observationLedger[0]?.value ||
        null,

      strongestObservationCategory:
        analysis.strongestObservationCategory ||
        observationLedger[0]?.category ||
        observationLedger[0]?.type ||
        null,

      strongestObservationType:
        analysis.strongestObservationType ||
        observationLedger[0]?.observationType ||
        observationLedger[0]?.type ||
        null,

      strongestObservationConfidence:
        analysis.strongestObservationConfidence ||
        observationLedger[0]?.confidence ||
        0,

      strongestObservationWeight:
        analysis.strongestObservationWeight ||
        observationLedger[0]?.weight ||
        0,

      rankedLedgerObservations:
        observationLedger.slice(0, 10),

      // ==================================================
      // NEW CORE CHAIN: SITUATION MAP
      // ==================================================

      situationMap,

      situationMapRan:
        situationMap.situationMapRan ??
        analysis.situationMapRan ??
        null,

      situationMapVersion:
        situationMap.situationMapVersion ||
        analysis.situationMapVersion ||
        null,

      situationMapSource:
        situationMap.source ||
        analysis.situationMapSource ||
        "not-yet-run",

      situationMapDomains:
        situationMap.domains ||
        analysis.domains ||
        [],

      situationMapSituations:
        situationMap.situations ||
        analysis.situations ||
        [],

      situationMapNeeds:
        situationMap.needs ||
        analysis.needs ||
        [],

      situationMapRisks:
        situationMap.risks ||
        analysis.risks ||
        [],

      situationMapQuestions:
        situationMap.questions ||
        analysis.questions ||
        [],

      situationMapResponseRequirements:
        situationMap.responseRequirements ||
        analysis.responseRequirements ||
        [],

      situationMapEventContext:
        situationMap.eventContext ||
        analysis.eventContext ||
        {},

      situationMapEventState:
        situationMap.eventState ||
        analysis.eventState ||
        null,

      situationMapOwnership:
        situationMap.ownership ||
        analysis.ownership ||
        null,

      situationMapRiskLevel:
        situationMap.riskLevel ||
        analysis.riskLevel ||
        null,

      situationMapGravity:
        situationMap.gravity ??
        analysis.gravity ??
        null,

      situationMapUrgency:
        situationMap.urgency ||
        analysis.urgency ||
        null,

      situationMapComplexity:
        situationMap.complexity ||
        analysis.complexity ||
        null,

      situationMapHorizon:
        situationMap.horizon ||
        analysis.horizon ||
        null,

      situationMapPrimaryLaneSuggestion:
        situationMap.primaryLaneSuggestion ||
        analysis.primaryLaneSuggestion ||
        null,

      situationMapSupportLaneSuggestions:
        situationMap.supportLaneSuggestions ||
        analysis.supportLaneSuggestions ||
        [],

      situationMapBriefLaneSuggestions:
        situationMap.briefLaneSuggestions ||
        analysis.briefLaneSuggestions ||
        [],

      situationMapContextLaneSuggestions:
        situationMap.contextLaneSuggestions ||
        analysis.contextLaneSuggestions ||
        [],

      situationMapDeferredLaneSuggestions:
        situationMap.deferredLaneSuggestions ||
        analysis.deferredLaneSuggestions ||
        [],

      situationMapShouldUseMultiLaneResponse:
        situationMap.shouldUseMultiLaneResponse ??
        analysis.shouldUseMultiLaneResponse ??
        false,

      situationMapShouldAskClarifyingQuestion:
        situationMap.shouldAskClarifyingQuestion ??
        analysis.shouldAskClarifyingQuestion ??
        false,

      situationMapRecommendedQuestion:
        situationMap.recommendedQuestion ||
        analysis.recommendedQuestion ||
        null,

// ==================================================
// NEW CORE CHAIN: TRIAGE ENGINE
// ==================================================

triage,

triageEngineRan:
  triage.triageEngineRan ??
  analysis.triageEngineRan ??
  null,

triageEngineVersion:
  triage.triageEngineVersion ||
  analysis.triageEngineVersion ||
  null,

triageEngineSource:
  triage.source ||
  triage.triageEngineSource ||
  analysis.triageEngineSource ||
  "not-yet-run",

triagePrimaryLane:
  triage.primaryLane ||
  analysis.triagePrimaryLane ||
  situationMap.primaryLane ||
  situationMap.primaryLaneSuggestion ||
  null,

triagePriorityClass:
  triage.priorityClass ||
  analysis.triagePriorityClass ||
  null,

triageConfidence:
  triage.confidence ??
  analysis.triageConfidence ??
  null,

triageBlockedLanes:
  triage.blockedLanes ||
  analysis.triageBlockedLanes ||
  situationMap.blockedLanes ||
  [],

triageDeferredLanes:
  triage.deferredLanes ||
  analysis.triageDeferredLanes ||
  situationMap.deferredLaneSuggestions ||
  [],

triageSupportLanes:
  triage.supportLanes ||
  analysis.triageSupportLanes ||
  situationMap.supportLanes ||
  situationMap.supportLaneSuggestions ||
  [],

triageResponseConstraints:
  triage.responseConstraints ||
  analysis.triageResponseConstraints ||
  situationMap.responseConstraints ||
  [],

triageCandidates:
  triage.candidates ||
  triage.triageCandidates ||
  analysis.triageCandidates ||
  situationMap.triageCandidates ||
  [],

triageReason:
  triage.reason ||
  analysis.triageReason ||
  null,

      // ==================================================
      // NEW CORE CHAIN: SITUATION CONTRACT
      // ==================================================

      situationContract,

      situationContractRan:
        situationContract.situationContractRan ??
        analysis.situationContractRan ??
        null,

      situationContractVersion:
        situationContract.situationContractVersion ||
        analysis.situationContractVersion ||
        null,

      situationContractSource:
        situationContract.source ||
        analysis.situationContractSource ||
        "not-yet-run",

      situationContractPrimary:
        analysis.situationContractPrimary ||
        situationContract.primary ||
        null,

      situationContractSupport:
        analysis.situationContractSupport ||
        situationContract.support ||
        [],

      situationContractBrief:
        analysis.situationContractBrief ||
        situationContract.brief ||
        [],

      situationContractContext:
        analysis.situationContractContext ||
        situationContract.context ||
        [],

      situationContractDeferred:
        analysis.situationContractDeferred ||
        situationContract.deferred ||
        [],

      situationContractBlocked:
        analysis.situationContractBlocked ||
        situationContract.blocked ||
        [],

      situationContractRisk:
        situationContract.risk ||
        analysis.situationContractRisk ||
        {},

      situationContractClarity:
        situationContract.clarity ||
        analysis.situationContractClarity ||
        {},

      situationContractResponseShape:
        situationContract.responseShape ||
        analysis.responseShape ||
        null,

      situationContractResponseRules:
        situationContract.responseRules ||
        analysis.situationContractResponseRules ||
        [],

      situationContractMouthDirective:
        situationContract.mouthDirective ||
        analysis.situationContractMouthDirective ||
        {},

      situationContractReasons:
        situationContract.reasons ||
        analysis.situationContractReasons ||
        [],

      // ==================================================
      // NEW CORE CHAIN: CONTRACT BRIDGE / AUTHORITY
      // ==================================================

      contractBridge,

      contractBridgeRan:
        analysis.contractBridgeRan ??
        contractBridge.contractBridgeRan ??
        null,

      contractBridgeSource:
        analysis.contractBridgeSource ||
        contractBridge.contractBridgeSource ||
        "not-yet-run",

      contractBridgeLeadOrgan:
        analysis.contractBridgeLeadOrgan ||
        contractBridge.contractBridgeLeadOrgan ||
        null,

      contractBridgeMode:
        analysis.contractBridgeMode ||
        contractBridge.contractBridgeMode ||
        null,

      contractBridgeResponseIntent:
        analysis.contractBridgeResponseIntent ||
        contractBridge.contractBridgeResponseIntent ||
        null,

      contractAuthorityReasserted:
        analysis.contractAuthorityReasserted ??
        false,

      contractAuthoritySource:
        analysis.contractAuthoritySource ||
        "not-yet-run",

      // ==================================================
      // RESPONSE INTENT / MOUTH
      // ==================================================

      responseIntent:
        analysis.responseIntent ||
        responseIntent.responseIntent ||
        null,

      responseShape:
        analysis.responseShape ||
        situationContract.responseShape ||
        responseIntent.responseShape ||
        null,

      responseIntentReason:
        analysis.responseIntentReason ||
        responseIntent.responseIntentReason ||
        null,

      responseIntentSource:
        analysis.responseIntentSource ||
        responseIntent.responseIntentSource ||
        "not-yet-run",

      mouthDirector: mouthDirector || null,
      mouthDirectorSource: mouthDirector.source || analysis.mouthDirectorSource || "not-yet-run",
      mouthExplanationLevel: mouthDirector.explanationLevel || analysis.mouthExplanationLevel || null,
      mouthResponsePattern: mouthDirector.responsePattern || analysis.mouthResponsePattern || null,
      mouthMaxBodySections: mouthDirector.maxBodySections || analysis.mouthMaxBodySections || null,
      mouthAskBeforeTeaching: mouthDirector.askBeforeTeaching ?? analysis.mouthAskBeforeTeaching ?? null,

      mouthAllows: {
        meaning: mouthDirector.allowMeaning ?? analysis.mouthAllows?.meaning ?? null,
        emotion: mouthDirector.allowEmotion ?? analysis.mouthAllows?.emotion ?? null,
        truth: mouthDirector.allowTruth ?? analysis.mouthAllows?.truth ?? null,
        wisdom: mouthDirector.allowWisdom ?? analysis.mouthAllows?.wisdom ?? null,
        action: mouthDirector.allowAction ?? analysis.mouthAllows?.action ?? null
      },

      // ==================================================
      // LEGACY / SUPPORT DEBUG FIELDS
      // ==================================================

      lifeSignals: lifeSignals.signalNames || [],
      primaryLifeSignal: lifeSignals.primarySignal?.name || null,
      hasMajorLifeSignal: Boolean(lifeSignals.hasMajorLifeSignal),

      primaryWeightedLifeSignal:
        lifeSignalWeighting.primaryWeightedLifeSignalName || null,
      primaryWeightedLifeSignalWeight:
        lifeSignalWeighting.primaryWeightedLifeSignalWeight || 0,
      lifePriorityClass: lifeSignalWeighting.lifePriorityClass || null,
      rankedLifeSignals:
        lifeSignalWeighting.rankedLifeSignals?.slice(0, 8).map((item) => ({
          name: item.name,
          weight: item.weight,
          category: item.category,
          confidence: item.confidence
        })) || [],

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

      primarySalienceName: salience.primarySalienceName || null,
      primarySalienceCategory: salience.primarySalienceCategory || null,
      primarySalienceStrength: salience.primarySalienceStrength || 0,
      primarySalienceReason: salience.primarySalienceReason || null,
      salienceRecommendedLead: salience.recommendedLead || null,
      salienceRecommendedMode: salience.recommendedMode || null,
      salienceShouldOverrideLanguage: Boolean(salience.shouldOverrideLanguage),
      rankedSalience:
        salience.rankedSalience?.slice(0, 8).map((item) => ({
          name: item.name,
          category: item.category,
          strength: item.strength,
          reason: item.reason
        })) || [],

      dualSalienceAvailable: dualSalience.available ?? null,
      dualSalienceObjective: dualSalience.objective || {},
      dualSalienceSubjective: dualSalience.subjective || {},
      dualSalienceGaps: dualSalience.gaps || [],
      dualSalienceLead: dualSalience.priority?.lead || null,
      dualSalienceMode: dualSalience.priority?.mode || null,
      dualSalienceObjectiveLead: dualSalience.priority?.objectiveLead || null,
      dualSalienceSubjectiveLead: dualSalience.priority?.subjectiveLead || null,
      dualSalienceReason: dualSalience.priority?.reason || null,
      dualSalienceClarityConfidence: dualSalience.clarity?.confidence || null,
      dualSalienceClarityAction: dualSalience.clarity?.action || null,
      dualSalienceRecommendedMove: dualSalience.recommendedMove || null,

      observerHierarchyPrimaryObservation:
        observerHierarchy.primaryObservation || null,
      observerHierarchyPrimaryCategory:
        observerHierarchy.primaryCategory || null,
      observerHierarchyPrimaryReason:
        observerHierarchy.primaryReason || null,
      observerHierarchyPrimaryConfidence:
        observerHierarchy.primaryConfidence || null,
      observerHierarchySupportingObservations:
        observerHierarchy.supportingObservations || [],
      observerHierarchyDominantTension:
        observerHierarchy.dominantTension || null,
      observerHierarchyLifeChapter:
        observerHierarchy.lifeChapter || null,
      observerHierarchyObjectiveLead:
        observerHierarchy.objectiveLead || null,
      observerHierarchySubjectiveLead:
        observerHierarchy.subjectiveLead || null,
      observerHierarchyDualSalienceMode:
        observerHierarchy.dualSalienceMode || null,
      observerHierarchyExecutiveInstruction:
        observerHierarchy.recommendedExecutiveInstruction || null,
      observerHierarchyShouldAskClarifyingQuestion:
        observerHierarchy.shouldAskClarifyingQuestion ?? null,
      observerHierarchyRecommendedQuestion:
        observerHierarchy.recommendedQuestion || null,
      observerHierarchyRankedObservations:
        observerHierarchy.rankedObservations?.slice(0, 8) || [],

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
      wisdomArchetypeInspiration: wisdom.archetype?.inspiration || null,
      wisdomArchetypeLesson: wisdom.archetype?.lesson || null,

      wisdomResolutionMode: wisdomResolution.resolutionMode || null,
      wisdomLeadingGood: wisdomResolution.leadingGood || null,
      wisdomSupportingGood: wisdomResolution.supportingGood || null,
      wisdomBoundary: wisdomResolution.boundary || null,
      wisdomIntegration: wisdomResolution.integration || null,
      wisdomResolvedStatement: wisdomResolution.resolvedStatement || null,
      wisdomResolutionConfidence: wisdomResolution.confidence || null,

      regretType: regret.regretType || null,
      regretStatement: regret.regretStatement || null,
      regretIntensity: regret.regretIntensity || null,
      regretPreventableAction: regret.preventableAction || null,

      longTermPath: longTermConsequence.path || null,
      fiveYearConsequence: longTermConsequence.fiveYearConsequence || null,
      protectedFuture: longTermConsequence.protectedFuture || null,
      riskIfIgnored: longTermConsequence.riskIfIgnored || null,
      courseCorrection: longTermConsequence.courseCorrection || null,
      longTermConsequenceConfidence: longTermConsequence.confidence || null,

      wisdomSynthesis: wisdomSynthesis.synthesis || null,
      wisdomPrimaryPrinciple: wisdomSynthesis.primaryPrinciple || null,
      wisdomPrincipleStatements: wisdomSynthesis.principleStatements || [],
      wisdomSynthesisArchetype: wisdomSynthesis.archetype || null,

      wisdomQuestionRecoveryNeeded: Boolean(wisdomQuestionRecovery.shouldRecover),
      wisdomRecoveryReason: wisdomQuestionRecovery.recoveryReason || null,
      wisdomRecoveryQuestion: wisdomQuestionRecovery.primaryQuestion || null,
      wisdomRecoverySupportingQuestions:
        wisdomQuestionRecovery.supportingQuestions || [],

      underlyingEmotionDepth:
        underlyingEmotionDepth.primaryUnderlyingEmotion?.name || null,
      underlyingEmotionDepthConfidence:
        underlyingEmotionDepth.primaryUnderlyingEmotion?.confidence || null,
      emotionalSource: underlyingEmotionDepth.emotionalSource || null,
      protectiveStrategy: underlyingEmotionDepth.protectiveStrategy || null,
      hiddenFear: underlyingEmotionDepth.hiddenFear || null,
      vulnerableTruth: underlyingEmotionDepth.vulnerableTruth || null,
      underlyingEmotionCandidates:
        underlyingEmotionDepth.candidates?.map((item) => item.name) || [],

      emotionRecoveryShouldAsk: Boolean(emotionRecoveryQuestions.shouldAsk),
      emotionRecoveryQuestionType: emotionRecoveryQuestions.questionType || null,
      emotionRecoveryQuestion: emotionRecoveryQuestions.primaryQuestion || null,
      emotionRecoverySupportingQuestions:
        emotionRecoveryQuestions.supportingQuestions || [],

      meaningTheme: meaning.theme || null,
      meaningConfidence: meaning.confidence || null,
      meaningStatement: meaning.meaning || null,
      humanTruth: meaning.humanTruth || null,

      personLifeChapter: personModel.lifeChapter?.name || null,
      personPrimaryRole: personModel.snapshot?.primaryRole || null,
      personMainNeed: personModel.snapshot?.mainNeed || null,
      personRecurringPattern: personModel.snapshot?.recurringPattern || null,

      primaryBelief: beliefModel.primaryBelief?.name || null,
      primaryBeliefConfidence: beliefModel.primaryBelief?.confidence || null,
      beliefSummary: beliefModel.beliefSummary || null,

      primarySimulation: simulation.primarySimulation?.name || null,
      simulationTheme: simulation.primarySimulation?.theme || null,

      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],

      primaryEmotion:
        emotionIntegrator.primaryEmotion ||
        emotionalIntelligence.primaryEmotion ||
        emotion.primaryEmotion ||
        "curiosity",

      secondaryEmotions:
        emotion.secondaryEmotions || [],

      surfaceEmotion:
        emotionalIntelligence.surfaceEmotion?.name ||
        emotionIntegrator.surfaceEmotion ||
        null,

      underlyingEmotion:
        emotionalIntelligence.underlyingEmotion?.name ||
        underlyingEmotionDepth.primaryUnderlyingEmotion?.name ||
        emotionIntegrator.underlyingEmotion ||
        null,

      rootNeed:
        emotionIntegrator.rootNeed ||
        emotionalIntelligence.rootNeed?.name ||
        null,

      protecting:
        emotionIntegrator.protecting ||
        emotionalIntelligence.protecting?.name ||
        null,

      emotionalClassification:
        emotionIntegrator.emotionalClassification ||
        stewardshipFear.emotionalClassification ||
        emotionalIntelligence.emotionalClassification ||
        null,

      emotionalIntegratedValue:
        emotionIntegrator.integratedValue ||
        emotionalIntelligence.integratedValue ||
        null,

      communicationStyle:
        emotionIntegrator.communicationStyle ||
        emotionalIntelligence.communicationStyle ||
        null,

      integratedEmotion:
        emotionIntegrator.integratedEmotion || null,

      integratedEmotionMode:
        emotionIntegrator.integratedEmotionMode || null,

      integratedEmotionReason:
        emotionIntegrator.integratedEmotionReason || null,

      recommendedEmotionResponseMode:
        emotionIntegrator.recommendedEmotionResponseMode || null,

      rankedIntegratedEmotions:
        emotionIntegrator.rankedIntegratedEmotions || [],

      memoryCandidate: memory.shouldRemember ? memory : null,

      organismFunction: organism.organismFunction || null,
      organismNeed: organism.organismNeed || null,
      organismNeedBlocked: organism.organismNeedBlocked ?? null,
      organismUrgency: organism.organismUrgency || null,
      organismRecommendedMode: organism.organismRecommendedMode || null,
      organismReason: organism.organismReason || null,
      organismSource:
        organism.organismSource ||
        organism.source ||
        "unknown",

      organismEngineRan:
        organism.organismEngineRan ?? null,

      organismEngineVersion:
        organism.organismEngineVersion || null,

      organismPrimaryFunction:
        organism.organismPrimaryFunction || null,

      organismPrimaryFunctionScore:
        organism.organismPrimaryFunctionScore || 0,

      organismFunctions:
        organism.organismFunctions || [],

      organismDisruption:
        organism.organismDisruption || null,

      organismNeedsStabilization:
        organism.organismNeedsStabilization ?? null,

      organismRecommendedAction:
        organism.organismRecommendedAction || null,

      // Life Chapter
      primaryLifeChapter:
        lifeChapter.primaryLifeChapter || null,

      lifeChapterStrength:
        lifeChapter.lifeChapterStrength || 0,

      lifeChapterStatement:
        lifeChapter.lifeChapterStatement || null,

      lifeChapterQuestion:
        lifeChapter.lifeChapterQuestion || null,

      lifeChapterFocus:
        lifeChapter.lifeChapterFocus || null,

      rankedLifeChapters:
        lifeChapter.rankedLifeChapters || [],

      // Identity Priority
      leadIdentity:
        identityPriority.leadIdentity || null,

      leadIdentityScore:
        identityPriority.leadIdentityScore || 0,

      leadIdentityProtects:
        identityPriority.leadIdentityProtects || [],

      leadIdentityMotivations:
        identityPriority.leadIdentityMotivations || [],

      supportingIdentities:
        identityPriority.supportingIdentities || [],

      identityLeadershipMode:
        identityPriority.identityLeadershipMode || null,

      identityPrioritySummary:
        identityPriority.identityPrioritySummary || null,

      identityRecoveryQuestion:
        identityPriority.identityRecoveryQuestion || null,

      rankedIdentities:
        identityPriority.rankedIdentities || [],

      // Value Integration
      valueIntegrationDetected:
        valueIntegration.valueIntegrationDetected || false,

      apparentConflict:
        valueIntegration.apparentConflict || null,

      integratedValue:
        valueIntegration.integratedValue || null,

      integrationStatement:
        valueIntegration.integrationStatement || null,

      valueIntegrationQuestion:
        valueIntegration.valueIntegrationQuestion || null,

      topValues:
        valueIntegration.topValues || [],

      sharedValues:
        valueIntegration.sharedValues || [],

      // Salience Governor
      salienceLeadOrgan:
        salienceGovernor.salienceLeadOrgan ||
        analysis.salienceLeadOrgan ||
        null,

      salienceLeadScore:
        salienceGovernor.salienceLeadScore ||
        analysis.salienceLeadScore ||
        0,

      salienceMode:
        salienceGovernor.salienceMode ||
        analysis.salienceMode ||
        null,

      salienceQuestion:
        salienceGovernor.salienceQuestion ||
        analysis.salienceQuestion ||
        null,

      salienceReason:
        salienceGovernor.salienceReason ||
        analysis.salienceReason ||
        null,

      supportingSalienceOrgans:
        salienceGovernor.supportingSalienceOrgans ||
        analysis.supportingSalienceOrgans ||
        [],

      rankedSalienceDecisions:
        salienceGovernor.rankedSalienceDecisions ||
        analysis.rankedSalienceDecisions ||
        [],

      // Knowledge Router / Teaching Engine
      knowledgeRouterRan:
        knowledge.knowledgeRouterRan ?? null,

      knowledgeRouterSource:
        knowledge.knowledgeRouterSource ||
        knowledge.source ||
        "not-yet-run",

      knowledgeSource:
        knowledge.knowledgeSource || null,

      knowledgeProvider:
        knowledge.knowledgeProvider || null,

      knowledgeAnswer:
        knowledge.knowledgeAnswer || null,

      knowledgeConfidence:
        knowledge.knowledgeConfidence || null,

      knowledgeCitations:
        knowledge.knowledgeCitations || [],

      knowledgeError:
        knowledge.knowledgeError || null,

      openAIKnowledgeUsed:
        Boolean(knowledge.openAIKnowledgeUsed),

      openAIKnowledgeSource:
        knowledge.openAIKnowledgeSource || null,

      teachingAnswerEngineRan:
        teaching.teachingAnswerEngineRan ?? null,

      teachingAnswerEngineSource:
        teaching.teachingAnswerEngineSource ||
        teaching.source ||
        "not-yet-run",

      teachingMode:
        teaching.teachingMode || null,

      teachingTopic:
        teaching.teachingTopic || null,

      teachingAnswer:
        teaching.teachingAnswer || null,

      teachingConfidence:
        teaching.teachingConfidence || null,

      teachingSource:
        teaching.teachingSource || null,

      teachingCitations:
        teaching.teachingCitations || [],

      // Legacy Multi-Lane Response Planner
      multiLanePlan,

      multiLanePlannerRan:
        multiLanePlan.multiLanePlannerRan ?? null,

      multiLanePlannerVersion:
        multiLanePlan.multiLanePlannerVersion || null,

      multiLanePlannerSource:
        multiLanePlan.source || "not-yet-run",

      multiLanePrimaryLane:
        multiLanePlan.primaryLane || null,

      multiLaneLanes:
        multiLanePlan.lanes || [],

      multiLaneSupportLanes:
        multiLanePlan.supportLanes || [],

      multiLaneBriefLanes:
        multiLanePlan.briefLanes || [],

      multiLaneDeferredLanes:
        multiLanePlan.deferredLanes || [],

      multiLaneBlockedLanes:
        multiLanePlan.blockedLanes || [],

      multiLaneWeights:
        multiLanePlan.laneWeights || {},

      multiLaneBudgets:
        multiLanePlan.laneBudgets || {},

      multiLaneRoles:
        multiLanePlan.laneRoles || {},

      multiLaneResponseOrder:
        multiLanePlan.responseOrder || [],

      multiLaneResponseShape:
        multiLanePlan.responseShape || null,

      multiLaneConflictRules:
        multiLanePlan.conflictRules || [],

      multiLaneBlindSpots:
        multiLanePlan.blindSpots || [],

      multiLaneComposerDirective:
        multiLanePlan.composerDirective || {},

      // Situation Review Console
      situationReview,

      situationReviewConsoleRan:
        situationReview.situationReviewConsoleRan ?? null,

      situationReviewConsoleVersion:
        situationReview.situationReviewConsoleVersion || null,

      situationReviewSource:
        situationReview.source || "not-yet-run",

      situationReviewScores:
        situationReview.scores || {},

      situationReviewPassFail:
        situationReview.passFail || null,

      situationReviewPossibleInterpretations:
        situationReview.possibleInterpretations || [],

      situationReviewUncertaintyAreas:
        situationReview.uncertaintyAreas || [],

      situationReviewBlindSpots:
        situationReview.blindSpots || [],

      situationReviewWarnings:
        situationReview.warnings || [],

      situationReviewLikelyFailurePoints:
        situationReview.likelyFailurePoints || [],

      situationReviewSuggestedFixes:
        situationReview.suggestedFixes || [],

      // Legacy Universal Domain Governor
      universalDomainGovernorRan:
        domainGovernor.universalDomainGovernorRan ?? null,

      universalDomainGovernorVersion:
        domainGovernor.universalDomainGovernorVersion || null,

      domainLead:
        domainGovernor.domainLead || null,

      domainSuperLead:
        domainGovernor.domainSuperLead || null,

      domainLeadScore:
        domainGovernor.domainLeadScore || 0,

      domainAuthority:
        domainGovernor.domainAuthority || 0,

      domainLeadOrgan:
        domainGovernor.domainLeadOrgan || null,

      domainMode:
        domainGovernor.domainMode || null,

      domainQuestion:
        domainGovernor.domainQuestion || null,

      domainReasons:
        domainGovernor.domainReasons || [],

      domainPermissions:
        domainGovernor.domainPermissions || {},

      domainBlockedPermissions:
        domainGovernor.domainBlockedPermissions || [],

      rankedUniversalDomains:
        domainGovernor.rankedUniversalDomains || [],

      // Legacy Authority Map
      authorityMap,

      allowTeaching:
        analysis.allowTeaching ??
        authorityMap.authorityAllows?.teaching ??
        true,

      allowEmotion:
        analysis.allowEmotion ??
        authorityMap.authorityAllows?.emotion ??
        true,

      allowMeaning:
        analysis.allowMeaning ??
        authorityMap.authorityAllows?.meaning ??
        true,

      allowIdentity:
        analysis.allowIdentity ??
        authorityMap.authorityAllows?.identity ??
        true,

      allowWisdom:
        analysis.allowWisdom ??
        authorityMap.authorityAllows?.wisdom ??
        true,

      allowAction:
        analysis.allowAction ??
        authorityMap.authorityAllows?.action ??
        true,

      authorityReason:
        analysis.authorityReason ||
        authorityMap.authorityReason ||
        null,

      authoritySource:
        analysis.authoritySource ||
        authorityMap.source ||
        "ari-authority-map-engine",

      shouldBlockLifeChapter:
        Boolean(domainGovernor.shouldBlockLifeChapter),

      shouldBlockIdentity:
        Boolean(domainGovernor.shouldBlockIdentity),

      shouldBlockEmotionRecovery:
        Boolean(domainGovernor.shouldBlockEmotionRecovery),

      shouldBlockMeaningProjection:
        Boolean(domainGovernor.shouldBlockMeaningProjection),

      shouldPreferTeaching:
        Boolean(domainGovernor.shouldPreferTeaching),

      shouldPreferBodyStabilization:
        Boolean(domainGovernor.shouldPreferBodyStabilization),

      shouldPreferSafety:
        Boolean(domainGovernor.shouldPreferSafety),

      // Sources
      lifeChapterSource:
        lifeChapter.source || "unknown",

      domainGovernorSource:
        domainGovernor.source || "unknown",

      identityPrioritySource:
        identityPriority.source || "unknown",

      valueIntegrationSource:
        valueIntegration.source || values.source || "unknown",

      salienceGovernorSource:
        salienceGovernor.source || "unknown",

      lifeSignalSource: lifeSignals.source || "unknown",
      lifeSignalWeightingSource: lifeSignalWeighting.source || "unknown",
      signalSystemSource: signals.source || "unknown",
      salienceSource: salience.source || "unknown",

      insightSource: insight.source || "unknown",
      metaAwarenessSource: metaAwareness.source || "unknown",
      wisdomSource: wisdom.source || "unknown",
      wisdomResolutionSource: wisdomResolution.source || "unknown",
      regretSource: regret.source || "unknown",
      longTermConsequenceSource: longTermConsequence.source || "unknown",
      wisdomSynthesisSource: wisdomSynthesis.source || "unknown",
      wisdomQuestionRecoverySource: wisdomQuestionRecovery.source || "unknown",
      underlyingEmotionDepthSource: underlyingEmotionDepth.source || "unknown",
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
      emotionalIntelligenceSource: emotionalIntelligence.source || "unknown",
      stewardshipFearSource: stewardshipFear.source || "unknown",
      emotionIntegratorSource: emotionIntegrator.source || "unknown",
      memorySource: memory.source || "unknown",
      dualSalienceSource: dualSalience.system || "unknown",
      observerHierarchySource: observerHierarchy.system || "unknown",

      authorityHierarchy: window.Ari.authority
        ? window.Ari.authority.hierarchy
        : []
    };
  }
};