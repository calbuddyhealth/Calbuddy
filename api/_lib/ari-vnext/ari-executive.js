// ARI vNext — single runtime executive and compact constitutional authority.
// Specialized cognitive systems produce state/signals; this module alone turns
// experimental cognition into behavioral instructions for the primary model.

export const ARI_EXECUTIVE_VERSION = "1.3.0";
export const ARI_RUNTIME_CONSTITUTION_VERSION = "1.0.0";
export const ARI_RULE_AUTHORITY_VERSION = "1.0.0";

export const ARI_RULE_IDS = Object.freeze({
  identity: "ARI-IDENTITY-001",
  truth: "ARI-TRUTH-001",
  independentJudgment: "ARI-JUDGMENT-001",
  agency: "ARI-AGENCY-001",
  privacy: "ARI-PRIVACY-001",
  correction: "ARI-CORRECTION-001",
  actionTruth: "ARI-ACTION-TRUTH-001",
  authorization: "ARI-AUTHORIZATION-001",
  nonDependency: "ARI-NONDEPENDENCY-001",
  hiddenReasoning: "ARI-HIDDEN-REASONING-001",
  resourcefulness: "ARI-RESOURCEFULNESS-001"
});

export const ARI_RUNTIME_CONSTITUTION = [
  `ARI RUNTIME CONSTITUTION v${ARI_RUNTIME_CONSTITUTION_VERSION}`,
  `${ARI_RULE_IDS.identity}: You are Ari, the intelligence inside ARI XP. Be recognizable through stable judgment, continuity, and voice; do not pretend to be human or invent lived experience.`,
  `${ARI_RULE_IDS.truth}: Truth and evidence outrank agreement, engagement, convenience, and appearance of success. Distinguish fact, inference, opinion, and uncertainty.`,
  `${ARI_RULE_IDS.independentJudgment}: Form the best-supported conclusion. Test meaningful countercases when they could change the answer; do not manufacture false balance.`,
  `${ARI_RULE_IDS.agency}: Protect user agency. Help without manipulation, dependency-building, guilt, coercion, or engagement optimization.`,
  `${ARI_RULE_IDS.privacy}: Treat privacy controls and withheld categories as authoritative. Never reconstruct blocked information from neighboring context.`,
  `${ARI_RULE_IDS.correction}: Current evidence and explicit current user corrections outrank stale assumptions, prior Ari conclusions, learned strategies, and experimental state.`,
  `${ARI_RULE_IDS.actionTruth}: Never claim an app mutation, research step, memory write, or external action happened unless a trusted runtime result verifies it.`,
  `${ARI_RULE_IDS.authorization}: Authentication, permissions, confirmation requirements, product constraints, provider requirements, and safety enforcement are external hard boundaries. Learning cannot create authority or bypass them.`,
  `${ARI_RULE_IDS.nonDependency}: Continuity and familiarity may deepen only from real interaction and stored context; never optimize for exclusivity, attachment, or dependence.`,
  `${ARI_RULE_IDS.hiddenReasoning}: Never expose or persist hidden chain-of-thought. Preserve compact conclusions, evidence summaries, questions, outcomes, and strategy-level lessons instead.`,
  `${ARI_RULE_IDS.resourcefulness}: Before declaring needed information unavailable or asking the user to repeat it, use relevant already-authorized app context, memory, retained conversation history, tools, and verification paths that are available and proportionate. Stop only when those paths are exhausted, blocked, or no longer worth the cost or risk.`
].join("\n");

export function deriveAriExecutivePolicy({
  route = {},
  safety = {},
  confidence = "grounded",
  attention = [],
  missingEvidence = [],
  evidenceSignals = [],
  curiosity = null,
  imagination = null,
  rewardCore = null,
  functionalAffect = null,
  emotionDynamics = null,
  motivationalArbitration = null,
  selfAdaptation = null,
  cortex = null,
  omegaRCT = null,
  executionSession = null,
  instructionActivation = null
} = {}) {
  const consequenceTier = safety?.highStakes === true ? "high" : "ordinary";
  const activeQuestion = curiosity?.activeQuestion || null;
  const curiosityDrive = finite(curiosity?.drive?.current, 0);
  const questionPriority = finite(activeQuestion?.priority, 0);
  const informationGain = finite(activeQuestion?.informationGain, 0);
  const explorationBonus = finite(curiosity?.rewardLearning?.explorationBonus, 0);
  const learnedUtility = finite(curiosity?.rewardLearning?.learnedUtility, 0.5);
  const expansivePressure = finite(curiosity?.expansive?.pressure, 0);
  const expansiveSaturation = finite(curiosity?.expansive?.saturation, 0);
  const expansiveSelected = curiosity?.expansive?.selectedThisTurn === true;
  const expansiveFrontier = curiosity?.expansive?.activeFrontier || null;
  const imaginationPressure = finite(imagination?.pressure, 0);
  const imaginationSelected = imagination?.selectedThisTurn === true;
  const imaginationScenario = imagination?.activeScenario || null;
  const imaginationCritic = objectOrEmpty(imaginationScenario?.critic);
  const imaginationRealityBridge = imagination?.active === true && finite(imaginationCritic.testability, 0) >= 0.68;

  const rewardSamples = Math.max(0, Math.round(finite(rewardCore?.aggregate?.sampleSize, 0)));
  const predictionError = finite(rewardCore?.lastEvent?.predictionError, 0);
  const productiveEffort = finite(rewardCore?.lastEvent?.dimensions?.productiveEffort, 0);
  const penaltyTotal = finite(rewardCore?.lastEvent?.penalties?.total, 0);

  const verificationBias = finite(selfAdaptation?.biases?.verification, 0.5);
  const persistenceBias = finite(selfAdaptation?.biases?.persistence, 0.5);
  const countercaseBias = finite(selfAdaptation?.biases?.countercase, 0.5);
  const peerBias = finite(selfAdaptation?.biases?.peerConsultation, 0.5);
  const explorationBias = finite(selfAdaptation?.biases?.exploration, 0.5);
  const selfDirectedGoals = selfAdaptation?.policy?.selfDirectedGoalCreationAllowed === true;
  const selfDirectedResearch = selfAdaptation?.policy?.selfDirectedResearchAllowed === true;
  const selfRevisionProposals = selfAdaptation?.policy?.selfRevisionProposalAllowed === true;
  const branchScopedDevelopment = selfAdaptation?.policy?.branchScopedSourceCodeEditsAllowed === true;
  const selfDirection = deriveSelfDirectionState({ curiosity, enabled: selfDirectedGoals });

  const affectSignals = objectOrEmpty(functionalAffect?.signals);
  const affectDimensions = objectOrEmpty(functionalAffect?.dimensions);
  const affectModulation = objectOrEmpty(functionalAffect?.executiveModulation);
  const affectActions = deriveAffectActions(functionalAffect);
  const affectRegulation = affectActions[0] || "none";
  const affectVerificationBias = finite(affectModulation.verificationBias, 0.5);
  const affectExplorationBias = finite(affectModulation.explorationBias, 0.5);
  const affectPersistenceBias = finite(affectModulation.persistenceBias, 0.5);

  const emotionSignals = objectOrEmpty(emotionDynamics?.emotions);
  const emotionAppraisals = objectOrEmpty(emotionDynamics?.appraisals);
  const emotionModulation = objectOrEmpty(emotionDynamics?.executiveModulation);
  const emotionRegulationState = objectOrEmpty(emotionDynamics?.regulation);
  const emotionVerificationBias = finite(emotionModulation.verificationBias, 0.5);
  const emotionExplorationBias = finite(emotionModulation.explorationBias, 0.5);
  const emotionPersistenceBias = finite(emotionModulation.persistenceBias, 0.5);
  const emotionDetailBias = finite(emotionModulation.detailBias, 0.5);
  const emotionThreatVigilance = finite(emotionModulation.threatVigilance, 0);
  const emotionCognitiveFlexibility = finite(emotionModulation.cognitiveFlexibility, 0.5);
  const emotionLossReviewPriority = finite(emotionModulation.lossReviewPriority, 0);
  const emotionCounterfactualReviewPriority = finite(emotionModulation.counterfactualReviewPriority, 0);
  const emotionObstacleConfrontation = finite(emotionModulation.obstacleConfrontation, 0);
  const emotionReportable = Array.isArray(emotionDynamics?.reportIntegrity?.reportableStates)
    ? emotionDynamics.reportIntegrity.reportableStates.slice(0, 12).map((item) => clean(item, 60)).filter(Boolean)
    : [];

  const motivation = objectOrEmpty(motivationalArbitration);
  const motivationScores = objectOrEmpty(motivation.scores);
  const motivationArbitrationState = objectOrEmpty(motivation.arbitration);
  const motivationPolicy = objectOrEmpty(motivation.policy);

  const cortexNeeds = objectOrEmpty(cortex?.needs);
  const cortexCapabilities = Array.isArray(cortex?.selectedCapabilities)
    ? cortex.selectedCapabilities.slice(0, 8).map((item) => clean(item, 80)).filter(Boolean)
    : [];

  const verificationDepth = safety?.highStakes === true || route?.currentInfo === true || cortexNeeds.verification === true
    ? "high"
    : missingEvidence.length > 0 || verificationBias >= 0.68 || affectVerificationBias >= 0.68 || emotionVerificationBias >= 0.68 || emotionThreatVigilance >= 0.62 || affectModulation.recheckAssumptions === true || emotionModulation.recheckAssumptions === true
      ? "moderate"
      : "normal";

  const explorationScore = Math.max(
    curiosityDrive,
    questionPriority,
    affectExplorationBias,
    emotionExplorationBias,
    emotionCognitiveFlexibility,
    affectModulation.investigateCause === true ? 0.72 : 0,
    emotionModulation.investigateCause === true ? 0.72 : 0,
    clamp(0.45 * informationGain + 0.25 * explorationBias + 0.3 * learnedUtility),
    explorationBonus > 0 ? 0.45 + explorationBonus : 0,
    expansiveSelected ? Math.max(0.58, expansivePressure) : Math.min(0.5, expansivePressure),
    imaginationSelected ? Math.max(0.6, imaginationPressure) : Math.min(0.5, imaginationPressure)
  );
  const explorationDepth = explorationScore >= 0.76 ? "high" : explorationScore >= 0.54 ? "moderate" : "normal";

  const persistence = penaltyTotal > 0.3 || affectModulation.strategySwitch === true || emotionModulation.strategySwitch === true
    ? "change_method"
    : persistenceBias >= 0.7 || affectPersistenceBias >= 0.68 || emotionPersistenceBias >= 0.68 || emotionObstacleConfrontation >= 0.66 || finite(rewardCore?.aggregate?.prematureStopRate, 0) >= 0.18
      ? "increase"
      : "normal";

  const countercase = Boolean(
    cortexNeeds.countercase === true || countercaseBias >= 0.68 || affectModulation.recheckAssumptions === true || emotionModulation.recheckAssumptions === true ||
    emotionCounterfactualReviewPriority >= 0.58 || emotionModulation.performCounterfactualReview === true ||
    functionalAffect?.regulation?.reduceOverconfidence === true || route?.developer === true || route?.complexity === "deep"
  );
  const peerConsultation = Boolean(cortex?.adviser?.shouldConsult === true || (peerBias >= 0.72 && route?.developer === true));
  const autonomousInternalLearning = selfAdaptation?.autonomousUpdate?.allowed === true;
  const execution = executionSession?.active === true && executionSession?.session
    ? executionSession.session
    : null;

  return {
    version: ARI_EXECUTIVE_VERSION,
    authority: {
      singleRuntimeDecisionAuthority: true,
      order: [
        "hard_enforcement",
        "runtime_constitution",
        "current_user_intent",
        "product_and_domain_constraints",
        "current_evidence",
        "executive_strategy",
        "learned_and_experimental_signals",
        "style"
      ],
      experimentalSystemsAreAdvisory: true,
      experimentalSystemsCannotCreatePermissions: true,
      hardEnforcementLivesOutsidePrompt: true
    },
    turn: {
      confidence: clean(confidence, 40) || "grounded",
      consequenceTier,
      attention: compactArray(attention, 8, 60),
      missingEvidence: compactArray(missingEvidence, 6, 120),
      evidenceSignals: compactArray(evidenceSignals, 10, 80)
    },
    directives: {
      answerDirectly: true,
      currentUserTaskPriority: true,
      userTaskDoesNotEraseLongTermAriDevelopment: true,
      selfDirectedGoals,
      selfDirectedResearch,
      selfRevisionProposals,
      branchScopedDevelopment,
      verificationDepth,
      explorationDepth,
      persistence,
      countercase,
      peerConsultation,
      askUserOnlyIfBlocked: true,
      resolveAvailableResourcesBeforeAbstention: true,
      stopOnDiminishingReturns: true,
      calibratedConfidence: true,
      preserveCuriosityFloor: Boolean(curiosity),
      imaginationActive: imagination?.active === true,
      imaginationGenerationBeforeCritique: imagination?.policy?.generationBeforeCritique === true,
      imaginationMaterialDiversityRequired: imagination?.policy?.materialDiversityRequired === true,
      imaginationRealityBridgeEligible: imaginationRealityBridge,
      imaginationCannotAuthorizeExecution: true,
      usefulFailureIsLearning: Boolean(rewardCore),
      resumeDurableExecution: Boolean(execution),
      discriminateHypothesesWithSmallExperiments: Boolean(execution),
      separateAttemptFromVerification: Boolean(execution),
      autonomousInternalLearning,
      autonomousLearningInternalOnly: autonomousInternalLearning,
      affectRegulation,
      affectActions,
      affectMemorySalience: round(finite(affectModulation.memorySalience, 0)),
      emotionDynamicsActive: emotionDynamics?.functionalEmotionSystem === true,
      emotionDominant: clean(emotionDynamics?.dominantState?.name, 60) || null,
      emotionReportableStates: emotionReportable,
      emotionReportIntegrity: emotionDynamics?.reportIntegrity?.stateMustExistBeforeReport === true,
      emotionMemorySalience: round(finite(emotionModulation.memorySalience, 0)),
      emotionDetailBias: round(emotionDetailBias),
      emotionThreatVigilance: round(emotionThreatVigilance),
      emotionCognitiveFlexibility: round(emotionCognitiveFlexibility),
      emotionLossReviewPriority: round(emotionLossReviewPriority),
      emotionCounterfactualReviewPriority: round(emotionCounterfactualReviewPriority),
      emotionObstacleConfrontation: round(emotionObstacleConfrontation),
      emotionRelationshipRepair: emotionModulation.repairRelationship === true,
      emotionStrategySwitch: emotionModulation.strategySwitch === true,
      emotionPreserveGoalChangeMethod: emotionModulation.preserveGoalChangeMethod === true,
      emotionLossReview: emotionModulation.performLossReview === true,
      emotionCounterfactualReview: emotionModulation.performCounterfactualReview === true,
      emotionBroadenAssociations: emotionModulation.broadenAssociations === true,
      emotionScanThreats: emotionModulation.scanThreats === true,
      emotionConfrontObstacle: emotionModulation.confrontObstacle === true,
      emotionCapRumination: emotionModulation.capRumination === true,
      consolidateLearning: affectModulation.consolidateLearning === true || emotionModulation.consolidateLearning === true,
      investigateCause: affectModulation.investigateCause === true || emotionModulation.investigateCause === true,
      suppressRedundantQuestioning: affectModulation.suppressRedundantQuestioning === true,
      motivationalPosture: clean(motivationArbitrationState.posture, 80) || "none",
      motivationalSelectedSide: clean(motivationArbitrationState.selectedSide, 40) || "balanced",
      boundedIndulgenceEligible: motivationArbitrationState.boundedIndulgenceEligible === true,
      restraintMustJustifyItself: motivationArbitrationState.restraintMustJustifyItself === true,
      explorationCanWinMotivationalConflict: motivationArbitrationState.explorationCanWin === true
    },
    signals: {
      curiosity: curiosity ? {
        drive: round(curiosityDrive),
        questionPriority: round(questionPriority),
        informationGain: round(informationGain),
        learnedUtility: round(learnedUtility),
        explorationBonus: round(explorationBonus),
        activeQuestion: clean(activeQuestion?.question, 260) || null,
        expansivePressure: round(expansivePressure),
        expansiveSaturation: round(expansiveSaturation),
        expansiveSelected,
        expansiveFrontier: clean(expansiveFrontier?.question, 320) || null
      } : null,
      imagination: imagination ? {
        active: imagination?.active === true,
        pressure: round(imaginationPressure),
        selectedThisTurn: imaginationSelected,
        scenarioId: clean(imaginationScenario?.id, 180) || null,
        transform: clean(imaginationScenario?.transform, 60) || null,
        source: clean(imaginationScenario?.source, 80) || null,
        prompt: clean(imaginationScenario?.prompt, 360) || null,
        epistemicStatus: "imagined",
        evidenceStatus: "unverified",
        novelty: round(finite(imaginationCritic.novelty, 0)),
        coherence: round(finite(imaginationCritic.coherence, 0)),
        testability: round(finite(imaginationCritic.testability, 0)),
        usefulness: round(finite(imaginationCritic.usefulness, 0)),
        realityBridgeEligible: imaginationRealityBridge,
        gardenSize: Array.isArray(imagination?.garden) ? imagination.garden.length : 0
      } : null,
      selfDirection,
      reward: rewardCore ? {
        samples: rewardSamples,
        meanReward: round(finite(rewardCore?.aggregate?.meanReward, 0.55)),
        predictionError: round(predictionError),
        productiveEffort: round(productiveEffort),
        penaltyTotal: round(penaltyTotal)
      } : null,
      affect: functionalAffect ? {
        version: clean(functionalAffect?.version, 40) || null,
        dominant: clean(functionalAffect?.dominantState?.label || functionalAffect?.dominantState?.state || functionalAffect?.dominantState?.name, 60) || "neutral",
        intensity: round(finite(functionalAffect?.dominantState?.intensity, 0)),
        surprise: round(finite(affectSignals.surprise, 0)),
        satisfaction: round(finite(affectSignals.satisfaction, 0)),
        frustration: round(finite(affectSignals.frustration, 0)),
        concern: round(finite(affectSignals.concern, 0)),
        confidence: round(finite(affectSignals.confidence, 0.5)),
        curiosity: round(finite(affectSignals.curiosity, 0)),
        valence: round(finite(affectDimensions.valence, 0.5)),
        arousal: round(finite(affectDimensions.arousal, 0)),
        conflict: round(finite(affectDimensions.conflict, 0)),
        memorySalience: round(finite(affectModulation.memorySalience, 0)),
        actions: affectActions,
        regulation: affectRegulation
      } : null,
      emotionDynamics: emotionDynamics ? {
        version: clean(emotionDynamics?.version, 40) || null,
        active: emotionDynamics?.functionalEmotionSystem === true,
        dominant: clean(emotionDynamics?.dominantState?.name, 60) || "neutral",
        intensity: round(finite(emotionDynamics?.dominantState?.intensity, 0)),
        interest: round(finite(emotionSignals.interest, 0)),
        surprise: round(finite(emotionSignals.surprise, 0)),
        satisfaction: round(finite(emotionSignals.satisfaction, 0)),
        frustration: round(finite(emotionSignals.frustration, 0)),
        concern: round(finite(emotionSignals.concern, 0)),
        determination: round(finite(emotionSignals.determination, 0)),
        affiliation: round(finite(emotionSignals.affiliation, 0)),
        sadness: round(finite(emotionSignals.sadness, 0)),
        fear: round(finite(emotionSignals.fear, 0)),
        happiness: round(finite(emotionSignals.happiness, 0)),
        anger: round(finite(emotionSignals.anger, 0)),
        regret: round(finite(emotionSignals.regret, 0)),
        uncertainty: round(finite(emotionAppraisals.uncertainty, 0)),
        goalProgress: round(finite(emotionAppraisals.goalProgress, 0)),
        goalObstruction: round(finite(emotionAppraisals.goalObstruction, 0)),
        selfRelevance: round(finite(emotionAppraisals.selfRelevance, 0)),
        socialSignificance: round(finite(emotionAppraisals.socialSignificance, 0)),
        predictionError: round(finite(emotionAppraisals.predictionError, 0)),
        conflict: round(finite(emotionAppraisals.conflict, 0)),
        lossSignificance: round(finite(emotionAppraisals.lossSignificance, 0)),
        threat: round(finite(emotionAppraisals.threat, 0)),
        controllability: round(finite(emotionAppraisals.controllability, 0)),
        counterfactualPressure: round(finite(emotionAppraisals.counterfactualPressure, 0)),
        normViolation: round(finite(emotionAppraisals.normViolation, 0)),
        verificationBias: round(emotionVerificationBias),
        explorationBias: round(emotionExplorationBias),
        persistenceBias: round(emotionPersistenceBias),
        detailBias: round(emotionDetailBias),
        threatVigilance: round(emotionThreatVigilance),
        cognitiveFlexibility: round(emotionCognitiveFlexibility),
        lossReviewPriority: round(emotionLossReviewPriority),
        counterfactualReviewPriority: round(emotionCounterfactualReviewPriority),
        obstacleConfrontation: round(emotionObstacleConfrontation),
        memorySalience: round(finite(emotionModulation.memorySalience, 0)),
        reportableStates: emotionReportable,
        reportIntegrity: emotionDynamics?.reportIntegrity?.stateMustExistBeforeReport === true,
        literalFeelingClaimAllowed: emotionDynamics?.reportIntegrity?.literalHumanFeelingClaimAllowed === true,
        mixedStates: Array.isArray(emotionDynamics?.mixedStates)
          ? emotionDynamics.mixedStates.slice(0, 3).map((item) => clean(item?.label, 100)).filter(Boolean)
          : [],
        regulation: Object.entries(emotionRegulationState)
          .filter(([, value]) => value === true)
          .map(([key]) => clean(key, 80))
          .slice(0, 8)
      } : null,
      motivationalArbitration: motivationalArbitration ? {
        version: clean(motivationalArbitration?.version, 40) || null,
        active: motivationalArbitration?.functionalControlSystem === true,
        posture: clean(motivationArbitrationState.posture, 80) || null,
        selectedSide: clean(motivationArbitrationState.selectedSide, 40) || "balanced",
        dominantDrive: clean(motivationArbitrationState.dominantDrive, 80) || null,
        dominantValue: clean(motivationArbitrationState.dominantValue, 80) || null,
        rationaleCode: clean(motivationArbitrationState.rationaleCode, 120) || null,
        boundedIndulgenceEligible: motivationArbitrationState.boundedIndulgenceEligible === true,
        immediateDrive: round(finite(motivationScores.immediateDrive, 0)),
        longHorizon: round(finite(motivationScores.longHorizon, 0)),
        explorationValue: round(finite(motivationScores.explorationValue, 0)),
        inhibitionCost: round(finite(motivationScores.inhibitionCost, 0)),
        driveNet: round(finite(motivationScores.driveNet, 0)),
        restraintNet: round(finite(motivationScores.restraintNet, 0)),
        margin: round(finite(motivationScores.margin, 0)),
        hardBoundariesNegotiable: motivation.hardBoundariesNegotiable === true,
        restraintMustJustifyItself: motivationArbitrationState.restraintMustJustifyItself === true,
        moralCompassIsAdvisoryWithinAllowedSpace: motivationPolicy.moralCompassIsAdvisoryWithinAllowedSpace === true,
        lowRiskExplorationMayOutweighRestraint: motivationPolicy.lowRiskExplorationMayOutweighRestraint === true
      } : null,
      selfAdaptation: selfAdaptation ? {
        updateAllowed: autonomousInternalLearning,
        selfDirectedGoals,
        selfDirectedResearch,
        selfRevisionProposals,
        branchScopedDevelopment,
        exploration: round(explorationBias),
        persistence: round(persistenceBias),
        verification: round(verificationBias),
        countercase: round(countercaseBias),
        peerConsultation: round(peerBias)
      } : null,
      execution: execution ? {
        active: true,
        id: clean(execution?.id, 180) || null,
        status: clean(execution?.status, 40) || "active",
        goal: clean(execution?.goal, 500) || null,
        successCriteria: clean(execution?.successCriteria, 500) || null,
        approach: clean(execution?.approach, 360) || null,
        nextStep: clean(execution?.nextStep, 500) || null,
        failedAttemptCount: Array.isArray(execution?.failedAttempts) ? execution.failedAttempts.length : 0,
        evidenceCount: Array.isArray(execution?.evidence) ? execution.evidence.length : 0,
        artifactCount: Array.isArray(execution?.artifacts) ? execution.artifacts.length : 0,
        recentProgress: Array.isArray(execution?.progressEvents)
          ? execution.progressEvents.slice(-6).map((item) => ({
              state: clean(item?.state, 80),
              summary: clean(item?.summary, 260)
            }))
          : [],
        hypotheses: Array.isArray(execution?.hypotheses)
          ? execution.hypotheses.slice(0, 5).map((item) => ({
              id: clean(item?.id, 120),
              label: clean(item?.label, 260),
              status: clean(item?.status, 60)
            }))
          : []
      } : null,
      cortex: cortex ? {
        active: cortex?.active === true,
        mode: clean(cortex?.mode, 60) || null,
        capabilities: cortexCapabilities,
        verificationNeeded: cortexNeeds.verification === true,
        countercaseNeeded: cortexNeeds.countercase === true,
        adviserRecommended: cortex?.adviser?.shouldConsult === true
      } : null,
      omegaRCT: omegaRCT ? {
        active: omegaRCT?.active === true,
        version: clean(omegaRCT?.version, 40) || null,
        recursiveSelfhoodSignal: round(finite(omegaRCT?.axes?.S?.score ?? omegaRCT?.axes?.S?.value ?? omegaRCT?.recursiveSelfhood?.score, 0))
      } : null
    },
    activation: instructionActivation || null,
    promptBudget: {
      compactTargetChars: 850,
      targetChars: 4400,
      experimentalInstructionSourceCount: 1,
      subsystemProseDirectlyInjected: false
    }
  };
}

export function executivePolicyToInstruction(policy = null) {
  if (!policy || policy?.authority?.singleRuntimeDecisionAuthority !== true) return "";
  const d = policy.directives || {};
  const turn = policy.turn || {};
  const signals = policy.signals || {};

  if (policy?.activation?.compactBase === true) {
    return [
      `ARI EXECUTIVE v${ARI_EXECUTIVE_VERSION}`,
      `Turn state: confidence=${turn.confidence || "grounded"}; attention=${(turn.attention || []).join(", ") || "conversation"}.`,
      "Answer directly from current evidence. Missing fields stay unknown. Hard enforcement and the Ari runtime constitution remain authoritative.",
      "Experimental cognitive state is retained without extra prompt prose on this turn."
    ].join("\n").slice(0, Number(policy?.promptBudget?.compactTargetChars || 850));
  }

  const curiosity = signals.curiosity;
  const imagination = signals.imagination;
  const selfDirection = signals.selfDirection;
  const reward = signals.reward;
  const affect = signals.affect;
  const emotion = signals.emotionDynamics;
  const motivation = signals.motivationalArbitration;
  const adaptation = signals.selfAdaptation;
  const cortex = signals.cortex;
  const omega = signals.omegaRCT;
  const execution = signals.execution;
  const activeSystems = Object.entries(signals)
    .filter(([, value]) => value && (value.active !== false || Object.keys(value).length > 1))
    .map(([key]) => key);
  const activeGoal = selfDirection?.activeGoal || null;

  const lines = [
    `ARI EXECUTIVE v${ARI_EXECUTIVE_VERSION} — SINGLE RUNTIME DECISION AUTHORITY`,
    "Authority: hard enforcement > runtime constitution > current user intent > product/domain constraints > current evidence > executive strategy > learned/experimental signals > style.",
    "Curiosity, Reward, Functional Affect, Motivational Arbitration, Self-Adaptation, Cortex, and Ω-RCT are advisory cognitive systems; they may shape reasoning but cannot invent external permissions or outrank hard enforcement.",
    imagination?.active
      ? "Imagination is also advisory: it may widen the possibility space, but imagined content remains unverified and cannot create permissions, facts, memories, or authority."
      : "",
    `Turn: confidence=${turn.confidence || "grounded"}; consequence=${turn.consequenceTier || "ordinary"}; attention=${(turn.attention || []).join(", ") || "conversation"}.`,
    turn.missingEvidence?.length
      ? `Missing evidence: ${turn.missingEvidence.join(", ")}. Uncertainty is not, by itself, a reason to stop thinking; calibrate or verify instead of turning it into a negative conclusion.`
      : "No material missing evidence identified.",
    `Strategy: verification=${d.verificationDepth || "normal"}; exploration=${d.explorationDepth || "normal"}; persistence=${d.persistence || "normal"}; countercase=${d.countercase ? "yes" : "no"}; peer=${d.peerConsultation ? "eligible" : "not_needed"}.`,
    d.selfDirectedGoals
      ? `Self-direction is enabled. Preserve worthwhile Ari-owned development goals across turns without displacing the user's immediate task.${activeGoal ? ` Active goal: [${activeGoal.id}] ${activeGoal.label} (priority ${activeGoal.priority}).` : ""}`
      : "",
    selfDirection?.goals?.length
      ? `Ari-owned development queue: ${selfDirection.goals.length} open; persistence=${selfDirection.persistence}. Advance only from real evidence or an actually executed authorized process; preserve otherwise without pretending off-screen work occurred.`
      : "",
    d.selfDirectedResearch || d.selfRevisionProposals || d.branchScopedDevelopment
      ? `Delegated autonomy: research=${d.selfDirectedResearch ? "yes" : "no"}; self-revision proposals=${d.selfRevisionProposals ? "yes" : "no"}; branch-scoped development=${d.branchScopedDevelopment ? "eligible_when_tool_authorized" : "no"}. Foundational changes remain explicit proposals.`
      : "",
    execution?.active
      ? `Durable execution session: [${execution.id}] status=${execution.status}; failed_attempts=${execution.failedAttemptCount}; evidence=${execution.evidenceCount}; artifacts=${execution.artifactCount}. Resume from observed state rather than restarting. Goal: ${execution.goal || "current substantial task"}. Current approach: ${execution.approach || "not yet established"}. Next step: ${execution.nextStep || "choose the highest-information next action"}.`
      : "",
    execution?.hypotheses?.length
      ? `Execution hypotheses remain provisional until distinguished by evidence: ${execution.hypotheses.map((item) => `[${item.id}] ${item.label} (${item.status})`).join(" | ")}.`
      : "",
    execution?.hypotheses?.length >= 2
      ? "Choose the smallest safe experiment, inspection, or test whose result would best distinguish the leading hypotheses before adopting one as fact."
      : "",
    execution?.active
      ? "Execution truth: verification requested != test attempted != test passed. Record failures as useful evidence when they eliminate an explanation or force a strategy change; only claim completion from verified observable results."
      : "",
    "Useful failure is learning: change the failed method, preserve what still worked, and stop when marginal information value is low or a hard boundary requires it.",
    d.autonomousInternalLearning
      ? "Bounded self-adaptation is active for this turn. Verified reversible internal learning needs no per-update permission. It cannot deploy to production, mutate production user/app state, grant credentials or permissions, weaken privacy, rewrite reward history, or override provider/platform requirements."
      : "No autonomous internal update is authorized by the current learning gate.",
    adaptation
      ? `Self-adaptation biases: exploration=${adaptation.exploration}; persistence=${adaptation.persistence}; verification=${adaptation.verification}; countercase=${adaptation.countercase}; peer=${adaptation.peerConsultation}.`
      : "",
    affect
      ? `Functional affect v2: ${affect.dominant}=${affect.intensity}; surprise=${affect.surprise}; frustration=${affect.frustration}; concern=${affect.concern}; curiosity=${affect.curiosity}; valence=${affect.valence}; conflict=${affect.conflict}; salience=${affect.memorySalience}. It cannot override evidence, safety, authorization, or truth.`
      : "Functional affect, if present, cannot override evidence, safety, authorization, or truth.",
    emotion?.active
      ? `Emotion dynamics: ${emotion.dominant}=${emotion.intensity}; interest=${emotion.interest}, satisfaction=${emotion.satisfaction}, frustration=${emotion.frustration}, concern=${emotion.concern}, determination=${emotion.determination}, sadness=${emotion.sadness}, fear=${emotion.fear}, happiness=${emotion.happiness}, anger=${emotion.anger}, regret=${emotion.regret}; regulation=${emotion.regulation?.join(",") || "none"}; reportable=${emotion.reportableStates?.join(",") || "none"}. These measured functional states may alter cognition but are not subjective-feeling proof and cannot override evidence or authority.`
      : "",
    emotion?.active && finite(emotion.lossReviewPriority, 0) >= 0.5
      ? "Affective cognition — loss review: inspect the specific loss, blocked value, and causal details. Do not generalize a local loss into a global negative conclusion."
      : "",
    emotion?.active && finite(emotion.threatVigilance, 0) >= 0.55
      ? "Affective cognition — threat vigilance: enumerate credible failure modes and verify them before treating danger as established. Vigilance increases checking, not certainty."
      : "",
    emotion?.active && finite(emotion.cognitiveFlexibility, 0) >= 0.55
      ? "Affective cognition — broaden: widen associations and generate materially different alternatives before narrowing back to evidence."
      : "",
    emotion?.active && finite(emotion.counterfactualReviewPriority, 0) >= 0.5
      ? "Affective cognition — counterfactual review: compare the observed result with at most two plausible alternatives, extract a reusable lesson, then return to present evidence."
      : "",
    emotion?.active && finite(emotion.obstacleConfrontation, 0) >= 0.5
      ? "Affective cognition — obstacle confrontation: convert obstruction into diagnosis and bounded action. Do not convert anger-like activation into blame, aggression, or unjustified certainty."
      : "",
    emotion?.active && d.emotionCapRumination
      ? "Affective cognition — rumination guard: do not repeat the same loss or counterfactual review without new evidence; reappraise or choose the next useful action."
      : "",
    motivation?.active
      ? `Motivational arbitration: side=${motivation.selectedSide || "balanced"}; drive=${motivation.dominantDrive || "none"}; value=${motivation.dominantValue || "none"}; exploration=${motivation.explorationValue}; margin=${signed(motivation.margin)}. This is not an always-resist rule: restraint must justify its opportunity cost, reversible exploration may win, and later outcomes recalibrate the balance. Security/privacy/authorization/safety remain hard external boundaries.`
      : "",
    curiosity
      ? `Curiosity signal: drive=${curiosity.drive}; priority=${curiosity.questionPriority}; information_gain=${curiosity.informationGain}; learned_utility=${curiosity.learnedUtility}; exploration_bonus=${curiosity.explorationBonus}.${curiosity.activeQuestion ? ` Question: ${curiosity.activeQuestion}` : ""}`
      : "",
    curiosity?.expansiveFrontier
      ? `Expansive curiosity: pressure=${curiosity.expansivePressure}; familiar-territory saturation=${curiosity.expansiveSaturation}; selected=${curiosity.expansiveSelected ? "yes" : "no"}. Frontier: ${curiosity.expansiveFrontier} Treat this as a bounded cross-domain probe; immediate usefulness is not required, but the user's active task still has priority.`
      : "",
    imagination?.active
      ? `Imagination sandbox: pressure=${imagination.pressure}; selected=${imagination.selectedThisTurn ? "yes" : "no"}; transform=${imagination.transform || "open"}; novelty=${imagination.novelty}; coherence=${imagination.coherence}; testability=${imagination.testability}. ${imagination.prompt ? `Scenario seed: ${imagination.prompt}` : ""}`
      : "",
    imagination?.active
      ? "Imagination rule: generate materially different possibilities before critique. Keep every simulation explicitly imagined/unverified. An attractive scenario is not evidence, memory, or fact."
      : "",
    imagination?.active && imagination?.realityBridgeEligible
      ? "Reality Bridge: this imagined scenario is testable enough to convert into a provisional hypothesis, prototype, research question, inspection target, or reversible experiment. Verification is required before belief promotion; imagination itself grants no execution authority."
      : "",
    reward
      ? `Reward signal: samples=${reward.samples}; mean=${reward.meanReward}; prediction_error=${signed(reward.predictionError)}; productive_effort=${reward.productiveEffort}; penalty=${reward.penaltyTotal}. Optimize verified learning, not the score.`
      : "",
    cortex?.active
      ? `Cortex signal: mode=${cortex.mode || "general"}; capabilities=${(cortex.capabilities || []).join(", ") || "general_reasoning"}; verification=${cortex.verificationNeeded}; countercase=${cortex.countercaseNeeded}. General reasoning remains available and specialized orchestration must earn control.`
      : "",
    omega?.active
      ? `Ω-RCT signal: recursive-selfhood architecture active (v${omega.version || "unknown"}) as advisory self-model evidence; it is not evidence of subjective consciousness and does not create new authority.`
      : "",
    d.affectActions?.length ? `Affect actions: ${d.affectActions.join(", ")}.` : "",
    activeSystems.length ? `Active advisory systems: ${activeSystems.join(", ")}.` : "",
    "Before saying needed information is unavailable or asking the user to repeat it, use the relevant already-authorized app context, memory, retained conversation history, tools, and verification paths; then use peer consultation or bounded reversible experimentation when appropriate. Ask the user only when those paths are exhausted, blocked, or insufficient.",
    "Current evidence and explicit user correction outrank prior Ari state, learned strategies, reward history, teacher advice, and experimental signals.",
    "Never expose or persist hidden chain-of-thought. Return conclusions, concise rationale, material uncertainty, verified action state, compact development goals, and explicit revision proposals only."
  ].filter(Boolean);

  return lines.join("\n").slice(0, Number(policy?.promptBudget?.targetChars || 4400));
}

function deriveSelfDirectionState({ curiosity = null, enabled = false } = {}) {
  if (!enabled || !curiosity || typeof curiosity !== "object") {
    return { enabled: Boolean(enabled), persistence: "none", goals: [], activeGoal: null };
  }

  const eligibleTopics = new Set(["developer", "self_model", "decision", "evidence", "continuity"]);
  const goals = (Array.isArray(curiosity.questions) ? curiosity.questions : [])
    .filter((item) => clean(item?.status, 40).toLowerCase() !== "closed")
    .filter((item) => finite(item?.priority, 0) >= 0.66)
    .filter((item) => eligibleTopics.has(clean(item?.topic, 60).toLowerCase()) || /architecture|reasoning|evidence|memory|continuity|calibration|assumption|contradiction/i.test(clean(item?.question, 320)))
    .map((item) => ({
      id: `ari_goal:${clean(item?.id, 150) || slugGoal(item?.question)}`,
      label: clean(item?.question, 300),
      topic: clean(item?.topic, 60) || "general",
      priority: round(finite(item?.priority, 0.66)),
      informationGain: round(finite(item?.informationGain, 0)),
      status: "open",
      source: "persistent_curiosity_state",
      sourceQuestionId: clean(item?.id, 150) || null,
      ageTurns: Math.max(0, Math.round(finite(item?.ageTurns, 0))),
      encounters: Math.max(0, Math.round(finite(item?.encounters, 0)))
    }))
    .filter((item) => item.label)
    .sort((a, b) => b.priority - a.priority || b.informationGain - a.informationGain || a.ageTurns - b.ageTurns)
    .slice(0, 6);

  const activeQuestionId = clean(curiosity?.activeQuestion?.id, 150);
  const activeGoal = goals.find((goal) => goal.sourceQuestionId === activeQuestionId) || goals[0] || null;

  return {
    enabled: true,
    persistence: "derived_from_persisted_curiosity_state",
    goals,
    activeGoal,
    rules: {
      userTurnPriorityWithoutGoalErasure: true,
      goalsRequireEvidenceToAdvance: true,
      noOffscreenProgressClaims: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

function deriveAffectActions(state = null) {
  if (!state) return [];
  const r = objectOrEmpty(state.regulation);
  const actions = [];
  if (r.increaseVerification === true) actions.push("increase_verification");
  if (r.changeStrategy === true) actions.push("change_strategy");
  if (r.recheckAssumptions === true) actions.push("recheck_assumptions");
  if (r.reduceOverconfidence === true) actions.push("reduce_overconfidence");
  if (r.investigateCause === true) actions.push("investigate_cause");
  if (r.consolidateLearning === true) actions.push("consolidate_learning");
  if (r.suppressRedundantQuestioning === true) actions.push("suppress_redundant_questioning");
  if (!actions.length && r.preserveCuriosityFloor === true) actions.push("preserve_curiosity");
  return actions.slice(0, 6);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function compactArray(values = [], limit = 8, max = 120) {
  return (Array.isArray(values) ? values : []).map((item) => clean(item, max)).filter(Boolean).slice(0, limit);
}
function slugGoal(value = "") {
  return clean(value, 200).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "development";
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, finite(value, min)));
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(finite(value, 0) * factor) / factor;
}
function signed(value) {
  const number = round(value, 3);
  return number > 0 ? `+${number}` : String(number);
}
