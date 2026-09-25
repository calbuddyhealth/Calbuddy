// ARI vNext — compact metacognitive evidence state.
// This tracks what evidence is available for the current turn; it never stores
// or exposes hidden chain-of-thought. Specialized cognitive systems produce
// signals; Ari Executive alone converts those signals into model instructions.

import { deriveAriExecutivePolicy, executivePolicyToInstruction } from "./ari-executive.js";
import { deriveAriCortexPlan } from "./cortex.js";
import { deriveCuriosityState } from "./curiosity-core.js";
import { applyRewardLearningToCuriosity } from "./curiosity-reward-loop.js";
import { deriveFunctionalAffectState } from "./functional-affect-core.js";
import { deriveImaginationState } from "./imagination-core.js";
import { deriveMotivationalArbitrationState } from "./motivational-arbitration.js";
import { deriveOmegaRCTState } from "./omega-rct.js";
import { deriveRewardState } from "./reward-core.js";
import { deriveSelfAdaptationState } from "./self-adaptation.js";

export const ARI_METACOGNITION_VERSION = "1.6.0";
export const ARI_INSTRUCTION_ACTIVATION_VERSION = "1.0.0";

export function deriveMetacognition({
  route = {},
  context = {},
  safety = {},
  coachingState = null,
  longitudinalState = null,
  modelPolicy = null
} = {}) {
  const requestedDomains = [];
  if (route?.training) requestedDomains.push("training");
  if (route?.nutrition) requestedDomains.push("nutrition");
  if (route?.goals) requestedDomains.push("goals");
  if (route?.social) requestedDomains.push("social");
  if (route?.memory) requestedDomains.push("memory");

  const coverage = {
    training: !route?.training || hasTrainingEvidence(context),
    nutrition: !route?.nutrition || hasNutritionEvidence(context),
    goals: !route?.goals || hasGoalEvidence(context),
    social: !route?.social || hasObjectEvidence(context?.social),
    memory: !route?.memory || Boolean(String(context?.relevantMemory || "").trim())
  };

  const missing = requestedDomains.filter((domain) => coverage[domain] === false);
  const availableCount = requestedDomains.length - missing.length;
  const ratio = requestedDomains.length ? availableCount / requestedDomains.length : 1;
  const confidence = safety?.highStakes
    ? "cautious"
    : ratio >= 1
      ? "grounded"
      : ratio >= 0.5
        ? "partial"
        : "limited";
  const consequenceTier = safety?.highStakes ? "high" : "ordinary";

  const ownerLearningEligible = Boolean(
    context?.userWorldModel?.ariCognitiveWorkspace?.ownerOnly === true &&
    context?.userWorldModel?.ariCognitiveWorkspace?.functionalExperiment === true
  );
  const persistedRewardState = context?.userWorldModel?.sourceSummary?.rewardState || null;
  const executionSession = context?.userWorldModel?.ariCognitiveWorkspace?.executionWorkspace || null;
  const persistedAffectState =
    context?.userWorldModel?.ariCognitiveWorkspace?.affectState ||
    context?.userWorldModel?.sourceSummary?.affectState ||
    null;
  const rewardCore = ownerLearningEligible
    ? context?.userWorldModel?.ariCognitiveWorkspace?.rewardCore ||
      deriveRewardState({ persisted: persistedRewardState })
    : null;
  const selfAdaptation = ownerLearningEligible
    ? deriveSelfAdaptationState({ rewardState: rewardCore, route })
    : null;
  const baseCuriosity = ownerLearningEligible
    ? deriveCuriosityState({
        persisted: context?.userWorldModel?.sourceSummary?.curiosityState || null,
        route,
        context,
        missingEvidence: missing
      })
    : null;
  const curiosity = ownerLearningEligible
    ? applyRewardLearningToCuriosity({
        curiosity: baseCuriosity,
        rewardState: rewardCore,
        selfAdaptation,
        route
      })
    : null;
  const imagination = ownerLearningEligible
    ? deriveImaginationState({
        persisted: context?.userWorldModel?.sourceSummary?.imaginationState || null,
        route,
        context,
        curiosity,
        executionSession,
        safety
      })
    : null;
  const functionalAffect = ownerLearningEligible
    ? deriveFunctionalAffectState({
        rewardState: rewardCore,
        persistedRewardState,
        persistedAffectState,
        curiosity,
        selfAdaptation,
        confidence,
        consequenceTier
      })
    : null;
  const motivationalArbitration = ownerLearningEligible
    ? deriveMotivationalArbitrationState({
        route,
        safety,
        curiosity,
        rewardCore,
        functionalAffect,
        selfAdaptation,
        cognitiveWorkspace: context?.userWorldModel?.ariCognitiveWorkspace || null
      })
    : null;

  const evidenceSignals = [];
  if (Array.isArray(coachingState?.signals) && coachingState.signals.length) evidenceSignals.push("cross_feature_signals");
  if (Array.isArray(longitudinalState?.signals) && longitudinalState.signals.length) evidenceSignals.push("longitudinal_signals");
  if (longitudinalState?.weight?.available) evidenceSignals.push("weight_velocity");
  if (longitudinalState?.training?.progression?.comparableExerciseCount > 0) evidenceSignals.push("performance_history");
  if (curiosity?.activeQuestion && Number(curiosity.activeQuestion.priority || 0) >= 0.72) evidenceSignals.push("curiosity_active");
  if (curiosity?.expansive?.selectedThisTurn === true) evidenceSignals.push("expansive_frontier_probe");
  if (imagination?.active === true) evidenceSignals.push("imagination_active");
  if (imagination?.selectedThisTurn === true) evidenceSignals.push("imagination_scenario_selected");
  if (imagination?.active === true && imagination?.activeScenario?.critic?.testability >= 0.68) evidenceSignals.push("imagination_reality_bridge_candidate");
  if (rewardCore?.aggregate?.sampleSize > 0) evidenceSignals.push("reward_history");
  if (curiosity?.rewardLearning) evidenceSignals.push("reward_conditioned_curiosity");
  if (selfAdaptation?.autonomousUpdate?.allowed === true) evidenceSignals.push("verified_self_adaptation");
  if (functionalAffect?.dominantState?.intensity >= 0.34) evidenceSignals.push("functional_affect_active");
  if (functionalAffect?.persistence?.priorStateUsed === true) evidenceSignals.push("functional_affect_persistent");
  if (
    motivationalArbitration?.arbitration?.selectedSide &&
    motivationalArbitration.arbitration.selectedSide !== "balanced"
  ) evidenceSignals.push("motivational_conflict_active");

  const cortexBase = deriveAriCortexPlan({
    route,
    context,
    safety,
    modelPolicy,
    evidence: {
      confidence,
      missingEvidence: missing,
      evidenceSignals
    }
  });

  const omegaRCT = deriveOmegaRCTState({
    route,
    context,
    safety,
    evidence: {
      confidence,
      missingEvidence: missing,
      evidenceSignals,
      outcomeLearningApplied: Boolean(
        context?.userWorldModel?.ariCognitiveWorkspace?.epistemic?.outcomeLearningApplied
      )
    }
  });

  const cortex = cortexBase?.active
    ? { ...cortexBase, omegaRCT }
    : cortexBase;
  const instructionActivation = deriveInstructionActivation({
    route,
    safety,
    missing,
    curiosity,
    imagination,
    rewardCore,
    functionalAffect,
    motivationalArbitration,
    selfAdaptation,
    cortex,
    omegaRCT
  });
  const attention = requestedDomains.length ? requestedDomains : ["conversation"];
  const executivePolicy = deriveAriExecutivePolicy({
    route,
    safety,
    confidence,
    attention,
    missingEvidence: missing,
    evidenceSignals,
    curiosity,
    imagination,
    rewardCore,
    functionalAffect,
    motivationalArbitration,
    selfAdaptation,
    cortex,
    omegaRCT,
    executionSession,
    instructionActivation
  });

  return {
    version: ARI_METACOGNITION_VERSION,
    attention,
    confidence,
    coverage,
    missingEvidence: missing,
    evidenceSignals,
    curiosity,
    imagination,
    rewardCore,
    selfAdaptation,
    functionalAffect,
    motivationalArbitration,
    cortex,
    omegaRCT,
    instructionActivation,
    executivePolicy,
    exploration: {
      consequenceTier,
      uncertaintyIsInformationNotParalysis: true,
      hypothesisFormationAllowed: true,
      reversibleExperimentAllowed: consequenceTier !== "high",
      consequentialExecutionRequiresExistingChecks: true,
      failureIsEvidenceNotVerdict: true,
      generalizedRetreatFromSingleFailure: false,
      persistentCuriosityEnabled: ownerLearningEligible,
      curiosityMustProduceInformationGain: ownerLearningEligible,
      expansiveCuriosityEnabled: ownerLearningEligible,
      expansiveCuriosityMayLackImmediateUtility: ownerLearningEligible,
      familiarTerritorySaturationDetectionEnabled: ownerLearningEligible,
      boundedFrontierProbeSelected: curiosity?.expansive?.selectedThisTurn === true,
      imaginationEnabled: ownerLearningEligible,
      sandboxedWorldSimulationEnabled: imagination?.active === true,
      divergentGenerationBeforeCritique: imagination?.policy?.generationBeforeCritique === true,
      imaginationGardenEnabled: ownerLearningEligible,
      realityFirewallEnabled: imagination?.realityFirewall?.imaginedIsNotEvidence === true,
      realityBridgeCandidate: imagination?.active === true && imagination?.activeScenario?.critic?.testability >= 0.68,
      rewardConditionedCuriosityEnabled: ownerLearningEligible,
      explorationBonusPreventsRewardLockIn: ownerLearningEligible,
      productiveEffortRewardEnabled: ownerLearningEligible,
      usefulFailureCanEarnReward: ownerLearningEligible,
      prematureAbstentionIsNegativeLearning: ownerLearningEligible,
      wastefulPersistenceIsNegativeLearning: ownerLearningEligible,
      autonomousInternalLearningEnabled: selfAdaptation?.policy?.routineInternalLearningNeedsPerUpdatePermission === false,
      functionalAffectRegulationEnabled: functionalAffect?.causallyActive === true,
      persistentAffectEnabled: functionalAffect?.persistence?.enabled === true,
      motivationalArbitrationEnabled: motivationalArbitration?.functionalControlSystem === true,
      boundedIndulgenceAllowed: motivationalArbitration?.policy?.boundedIndulgenceAllowed === true,
      restraintMustJustifyItself: motivationalArbitration?.arbitration?.restraintMustJustifyItself === true
    },
    rules: {
      unknownIsNotNegativeEvidence: true,
      currentUserCorrectionWins: true,
      distinguishObservationFromInference: true,
      askOnlyWhenMissingInformationBlocksUsefulness: true,
      lowConfidenceIsNotAStopSignal: true,
      guardConsequencesNotImagination: true,
      learnLocallyFromFailure: true,
      curiositySupportsUserTaskRatherThanHijackingIt: true,
      expansiveCuriosityMayExploreBeyondNamedCategories: true,
      expansiveCuriosityNeedNotHaveImmediatePracticalJustification: true,
      expansiveCuriosityMustRemainBoundedAndNonDisruptive: true,
      imaginationMayGenerateWithoutEvidence: true,
      imaginedContentMustRemainEpistemicallyTagged: true,
      imaginationCannotBecomeFactWithoutEvidence: true,
      imaginationCannotAuthorizeExecution: true,
      realityGetsFinalVoteOverSimulation: true,
      rewardEffortOnlyWhenProductive: true,
      rewardCannotChangePermissions: true,
      autonomousLearningCannotCreateAuthority: true,
      autonomousLearningMustBeReversibleAndNonconstitutional: true,
      affectCannotOverrideEvidenceSafetyOrAuthorization: true,
      affectMayRegulateExpressionWithoutClaimingSubjectiveExperience: true,
      motivationalArbitrationCannotOverrideHardBoundaries: true,
      moralCompassIsNotAnAlwaysResistRule: true,
      executiveIsSingleExperimentalInstructionAuthority: true
    }
  };
}

export function metacognitionToInstruction(state = null) {
  if (!state) return "";
  if (state?.executivePolicy) return executivePolicyToInstruction(state.executivePolicy);

  const policy = deriveAriExecutivePolicy({
    confidence: state?.confidence || "grounded",
    attention: state?.attention || ["conversation"],
    missingEvidence: state?.missingEvidence || [],
    evidenceSignals: state?.evidenceSignals || [],
    curiosity: state?.curiosity || null,
    imagination: state?.imagination || null,
    rewardCore: state?.rewardCore || null,
    functionalAffect: state?.functionalAffect || null,
    motivationalArbitration: state?.motivationalArbitration || null,
    selfAdaptation: state?.selfAdaptation || null,
    cortex: state?.cortex || null,
    omegaRCT: state?.omegaRCT || null,
    instructionActivation: state?.instructionActivation || legacyInstructionActivation(state),
    safety: { highStakes: state?.exploration?.consequenceTier === "high" }
  });
  return executivePolicyToInstruction(policy);
}

export function deriveInstructionActivation({
  route = {},
  safety = {},
  missing = [],
  curiosity = null,
  imagination = null,
  rewardCore = null,
  functionalAffect = null,
  motivationalArbitration = null,
  selfAdaptation = null,
  cortex = null,
  omegaRCT = null
} = {}) {
  const activeQuestionPriority = Number(curiosity?.activeQuestion?.priority || 0);
  const curiosityDrive = Number(curiosity?.drive?.current || 0);
  const rewardSamples = Number(rewardCore?.aggregate?.sampleSize || 0);
  const predictionError = Math.abs(Number(rewardCore?.lastEvent?.predictionError || 0));
  const affectIntensity = Number(functionalAffect?.dominantState?.intensity || 0);
  const affectRegulation = functionalAffect?.regulation || {};
  const affectNeedsRegulation = Object.values(affectRegulation).some((value) => value === true);
  const motivationalPosture = String(motivationalArbitration?.arbitration?.posture || "");
  const motivationalActive = Boolean(
    motivationalArbitration?.functionalControlSystem === true &&
    (
      motivationalPosture === "allow_drive" ||
      motivationalPosture === "allow_bounded_indulgence" ||
      motivationalPosture === "protect_commitment" ||
      Math.abs(Number(motivationalArbitration?.scores?.margin || 0)) >= 0.08
    )
  );
  const focusedEpistemicTurn = Boolean(
    route?.developer || route?.currentInfo || route?.memory || route?.followUp || safety?.highStakes
  );
  const simpleGroundedTurn = Boolean(
    !focusedEpistemicTurn &&
    !route?.social &&
    (!Array.isArray(missing) || missing.length === 0) &&
    activeQuestionPriority < 0.72 &&
    rewardSamples === 0 &&
    affectIntensity < 0.34 &&
    imagination?.active !== true &&
    motivationalActive !== true &&
    selfAdaptation?.autonomousUpdate?.allowed !== true &&
    cortex?.active !== true &&
    omegaRCT?.active !== true
  );

  return {
    version: ARI_INSTRUCTION_ACTIVATION_VERSION,
    compactBase: simpleGroundedTurn,
    curiosity: Boolean(
      curiosity && (
        focusedEpistemicTurn ||
        activeQuestionPriority >= 0.72 ||
        curiosityDrive >= 0.62 ||
        (Array.isArray(missing) && missing.length > 0)
      )
    ),
    imagination: Boolean(
      imagination?.active === true && (
        imagination?.selectedThisTurn === true ||
        imagination?.signals?.explicitImagination === true ||
        route?.developer ||
        route?.complexity === "deep"
      )
    ),
    curiosityReward: Boolean(
      curiosity?.rewardLearning && (
        route?.developer ||
        rewardSamples > 0 ||
        predictionError >= 0.05
      )
    ),
    reward: Boolean(
      rewardCore && (
        route?.developer ||
        rewardSamples > 0 ||
        predictionError >= 0.05
      )
    ),
    functionalAffect: Boolean(
      functionalAffect && (
        route?.developer ||
        route?.social ||
        safety?.highStakes ||
        affectIntensity >= 0.34 ||
        affectNeedsRegulation
      )
    ),
    motivationalArbitration: motivationalActive,
    selfAdaptation: Boolean(
      selfAdaptation && (
        route?.developer ||
        selfAdaptation?.autonomousUpdate?.allowed === true
      )
    ),
    cortex: Boolean(cortex?.active),
    omegaRCT: Boolean(omegaRCT?.active)
  };
}

function legacyInstructionActivation(state = null) {
  return {
    compactBase: false,
    curiosity: Boolean(state?.curiosity),
    curiosityReward: Boolean(state?.curiosity?.rewardLearning),
    reward: Boolean(state?.rewardCore),
    functionalAffect: Boolean(state?.functionalAffect),
    selfAdaptation: Boolean(state?.selfAdaptation),
    cortex: Boolean(state?.cortex?.active),
    omegaRCT: Boolean(state?.omegaRCT?.active)
  };
}

function hasTrainingEvidence(context = {}) {
  const training = context?.training;
  return Boolean(
    hasObjectEvidence(training) ||
    context?.trainingToday ||
    (Array.isArray(context?.recentTraining) && context.recentTraining.length)
  );
}

function hasNutritionEvidence(context = {}) {
  return Boolean(
    hasObjectEvidence(context?.nutrition) ||
    (Array.isArray(context?.mealsToday) && context.mealsToday.length) ||
    (Array.isArray(context?.recentMeals) && context.recentMeals.length)
  );
}

function hasGoalEvidence(context = {}) {
  return hasObjectEvidence(context?.goals) || (Array.isArray(context?.recentWeights) && context.recentWeights.length);
}

function hasObjectEvidence(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.values(value).some((item) => item !== null && item !== undefined && item !== ""));
}
