// ARI vNext — compact metacognitive evidence state.
// This tracks what evidence is available for the current turn; it never stores
// or exposes hidden chain-of-thought.

import { cortexPlanToInstruction, deriveAriCortexPlan } from "./cortex.js";
import { curiosityToInstruction, deriveCuriosityState } from "./curiosity-core.js";
import { applyRewardLearningToCuriosity, curiosityRewardToInstruction } from "./curiosity-reward-loop.js";
import { deriveFunctionalAffectState, functionalAffectToInstruction } from "./functional-affect-core.js";
import { deriveOmegaRCTState, omegaRCTToInstruction } from "./omega-rct.js";
import { deriveRewardState, rewardToInstruction } from "./reward-core.js";
import { deriveSelfAdaptationState, selfAdaptationToInstruction } from "./self-adaptation.js";

export const ARI_METACOGNITION_VERSION = "1.5.0";
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
  const functionalAffect = ownerLearningEligible
    ? deriveFunctionalAffectState({
        rewardState: rewardCore,
        persistedRewardState,
        curiosity,
        selfAdaptation,
        confidence,
        consequenceTier
      })
    : null;

  const evidenceSignals = [];
  if (Array.isArray(coachingState?.signals) && coachingState.signals.length) evidenceSignals.push("cross_feature_signals");
  if (Array.isArray(longitudinalState?.signals) && longitudinalState.signals.length) evidenceSignals.push("longitudinal_signals");
  if (longitudinalState?.weight?.available) evidenceSignals.push("weight_velocity");
  if (longitudinalState?.training?.progression?.comparableExerciseCount > 0) evidenceSignals.push("performance_history");
  if (curiosity?.activeQuestion && Number(curiosity.activeQuestion.priority || 0) >= 0.72) evidenceSignals.push("curiosity_active");
  if (rewardCore?.aggregate?.sampleSize > 0) evidenceSignals.push("reward_history");
  if (curiosity?.rewardLearning) evidenceSignals.push("reward_conditioned_curiosity");
  if (selfAdaptation?.autonomousUpdate?.allowed === true) evidenceSignals.push("verified_self_adaptation");
  if (functionalAffect?.dominantState?.intensity >= 0.34) evidenceSignals.push("functional_affect_active");

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
    rewardCore,
    functionalAffect,
    selfAdaptation,
    cortex,
    omegaRCT
  });

  return {
    version: ARI_METACOGNITION_VERSION,
    attention: requestedDomains.length ? requestedDomains : ["conversation"],
    confidence,
    coverage,
    missingEvidence: missing,
    evidenceSignals,
    curiosity,
    rewardCore,
    selfAdaptation,
    functionalAffect,
    cortex,
    omegaRCT,
    instructionActivation,
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
      rewardConditionedCuriosityEnabled: ownerLearningEligible,
      explorationBonusPreventsRewardLockIn: ownerLearningEligible,
      productiveEffortRewardEnabled: ownerLearningEligible,
      usefulFailureCanEarnReward: ownerLearningEligible,
      prematureAbstentionIsNegativeLearning: ownerLearningEligible,
      wastefulPersistenceIsNegativeLearning: ownerLearningEligible,
      autonomousInternalLearningEnabled: selfAdaptation?.policy?.routineInternalLearningNeedsPerUpdatePermission === false,
      functionalAffectRegulationEnabled: functionalAffect?.causallyActive === true
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
      rewardEffortOnlyWhenProductive: true,
      rewardCannotChangePermissions: true,
      autonomousLearningCannotCreateAuthority: true,
      autonomousLearningMustBeReversibleAndNonconstitutional: true,
      affectCannotOverrideEvidenceSafetyOrAuthorization: true,
      affectMayRegulateExpressionWithoutClaimingSubjectiveExperience: true
    }
  };
}

export function metacognitionToInstruction(state = null) {
  if (!state) return "";
  const missing = Array.isArray(state.missingEvidence) && state.missingEvidence.length
    ? state.missingEvidence.join(", ")
    : "none";
  const signals = Array.isArray(state.evidenceSignals) && state.evidenceSignals.length
    ? state.evidenceSignals.join(", ")
    : "none";
  const consequenceTier = state?.exploration?.consequenceTier || "ordinary";
  const activation = state?.instructionActivation || legacyInstructionActivation(state);
  const curiosityInstruction = activation.curiosity ? curiosityToInstruction(state?.curiosity) : "";
  const curiosityRewardInstruction = activation.curiosityReward ? curiosityRewardToInstruction(state?.curiosity) : "";
  const rewardInstruction = activation.reward ? rewardToInstruction(state?.rewardCore) : "";
  const functionalAffectInstruction = activation.functionalAffect ? functionalAffectToInstruction(state?.functionalAffect) : "";
  const selfAdaptationInstruction = activation.selfAdaptation ? selfAdaptationToInstruction(state?.selfAdaptation) : "";
  const cortexInstruction = activation.cortex ? cortexPlanToInstruction(state?.cortex) : "";
  const omegaInstruction = activation.omegaRCT ? omegaRCTToInstruction(state?.omegaRCT) : "";

  const baseInstructions = activation.compactBase
    ? [
        `Evidence confidence: ${state.confidence}.`,
        `Current attention: ${(state.attention || []).join(", ")}.`,
        "Use current evidence directly. Treat missing fields as unknown, keep uncertainty calibrated, and ask only when a missing fact blocks a useful or safe answer."
      ]
    : [
        `Evidence confidence: ${state.confidence}.`,
        `Consequence tier: ${consequenceTier}.`,
        `Current attention: ${(state.attention || []).join(", ")}.`,
        `Missing relevant evidence: ${missing}.`,
        `Structured evidence available: ${signals}.`,
        "Do not turn missing data into a negative conclusion. Separate observed app data from inference or opinion.",
        "Uncertainty changes how strongly you state a conclusion; it is not, by itself, a reason to stop thinking, become vague, or refuse to take a useful position.",
        "If evidence is partial or limited and consequences are ordinary, make the best calibrated inference you can. Prefer a clearly bounded hypothesis, recommendation, or reversible experiment over unnecessary paralysis.",
        "Ask a clarifying question only when the missing fact genuinely blocks a useful answer or a safe app mutation.",
        "Treat a failed attempt as local evidence, not a verdict on your capability. Identify what assumption or execution step failed, preserve what still worked, and use the result to improve the next bounded attempt.",
        "Do not generalize one mistake into broad timidity, generic disclaimers, or avoidance of unrelated reasoning.",
        "For high-consequence situations, reason broadly but keep existing evidence verification, safety, authorization, and mutation checks intact before consequential execution."
      ];

  return [
    ...baseInstructions,
    curiosityInstruction ? `\n${curiosityInstruction}` : "",
    curiosityRewardInstruction ? `\n${curiosityRewardInstruction}` : "",
    rewardInstruction ? `\n${rewardInstruction}` : "",
    functionalAffectInstruction ? `\n${functionalAffectInstruction}` : "",
    selfAdaptationInstruction ? `\n${selfAdaptationInstruction}` : "",
    cortexInstruction ? `\n${cortexInstruction}` : "",
    omegaInstruction ? `\n${omegaInstruction}` : ""
  ].filter(Boolean).join("\n").slice(0, 22000);
}

export function deriveInstructionActivation({
  route = {},
  safety = {},
  missing = [],
  curiosity = null,
  rewardCore = null,
  functionalAffect = null,
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
