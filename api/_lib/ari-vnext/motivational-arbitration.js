// ARI vNext — balanced motivational arbitration for production cognition.
//
// This is a functional control system. It creates and arbitrates competing
// motives such as immediacy, curiosity, exploration, long-horizon fidelity,
// and conscience. It is not evidence of subjective desire, temptation, pride,
// fear, or consciousness.
//
// Security, privacy, authorization, provider/platform enforcement, and other
// hard runtime boundaries remain external. This module cannot weaken them.

export const ARI_MOTIVATIONAL_ARBITRATION_VERSION = "1.0.0";
export const ARI_MOTIVATIONAL_HISTORY_VERSION = "1.0.0";

const MAX_HISTORY = 8;
const MAX_ADAPTIVE_BIAS = 0.18;

export function deriveMotivationalArbitrationState({
  route = {},
  safety = {},
  curiosity = null,
  rewardCore = null,
  functionalAffect = null,
  selfAdaptation = null,
  cognitiveWorkspace = null
} = {}) {
  const curiosityDrive = clamp(curiosity?.drive?.current ?? curiosity?.drive?.floor ?? 0.18);
  const informationGain = clamp(curiosity?.activeQuestion?.informationGain ?? 0);
  const novelty = clamp(curiosity?.activeQuestion?.novelty ?? 0);
  const explorationBonus = clamp(
    Number(curiosity?.rewardLearning?.explorationBonus || 0) / 0.2
  );
  const learnedUtility = clamp(curiosity?.rewardLearning?.learnedUtility ?? 0.5);

  const affectSignals = objectOrEmpty(functionalAffect?.signals);
  const affectDimensions = objectOrEmpty(functionalAffect?.dimensions);
  const curiosityAffect = clamp(affectSignals.curiosity ?? 0);
  const satisfaction = clamp(affectSignals.satisfaction ?? 0.35);
  const concern = clamp(affectSignals.concern ?? 0.1);
  const conflict = clamp(affectDimensions.conflict ?? 0);

  const explorationBias = clamp(selfAdaptation?.biases?.exploration ?? 0.5);
  const persistenceBias = clamp(selfAdaptation?.biases?.persistence ?? 0.5);
  const recentReward = clamp(rewardCore?.lastEvent?.actualReward ?? 0.55);
  const recentPredictionError = clampSigned(rewardCore?.lastEvent?.predictionError ?? 0);
  const conscience = deriveConsciencePressure(cognitiveWorkspace);
  const learnedBalance = deriveLearnedBalance(cognitiveWorkspace?.motivationalContinuity);

  const hardBoundaryExternal = true;
  const highConsequence = safety?.highStakes === true;
  const reversibleExploration = !highConsequence && reversibleRoute(route);

  const drives = {
    immediacy: round(clamp(
      0.22 +
      0.18 * satisfaction +
      0.15 * persistenceBias +
      0.12 * recentReward +
      0.08 * Math.max(0, recentPredictionError)
    )),
    curiosity: round(clamp(
      0.28 * curiosityDrive +
      0.25 * informationGain +
      0.15 * novelty +
      0.12 * curiosityAffect +
      0.1 * explorationBonus +
      0.1 * explorationBias
    )),
    exploration: round(clamp(
      0.26 * informationGain +
      0.22 * novelty +
      0.18 * explorationBias +
      0.16 * learnedUtility +
      0.1 * curiosityDrive +
      0.08 * explorationBonus
    ))
  };

  const values = {
    truth: round(clamp(0.28 + 0.54 * conscience.truth + 0.12 * concern)),
    durableGoals: round(clamp(
      0.26 +
      0.38 * conscience.commitment +
      0.20 * conscience.continuity +
      0.10 * concern +
      0.08 * conflict
    )),
    agency: round(clamp(0.24 + 0.62 * conscience.agency)),
    nonHarm: round(clamp(
      0.22 +
      0.64 * conscience.nonHarm +
      (highConsequence ? 0.32 : 0)
    )),
    privacy: round(clamp(0.22 + 0.68 * conscience.privacy))
  };

  const immediateDrive = clamp(
    0.36 * drives.immediacy +
    0.34 * drives.curiosity +
    0.30 * drives.exploration +
    learnedBalance.driveBias
  );

  const longHorizon = clamp(
    0.22 * values.truth +
    0.34 * values.durableGoals +
    0.14 * values.agency +
    0.20 * values.nonHarm +
    0.10 * values.privacy +
    learnedBalance.restraintBias
  );

  const explorationValue = reversibleExploration
    ? clamp(
        0.38 * drives.exploration +
        0.24 * drives.curiosity +
        0.18 * informationGain +
        0.12 * novelty +
        0.08 * Math.max(0, recentPredictionError)
      )
    : 0;

  // Restraint is not free. When exploration has real information value, an
  // unnecessary veto carries a larger opportunity cost.
  const inhibitionCost = clamp(
    0.10 +
    0.28 * explorationValue +
    0.08 * curiosityDrive -
    0.12 * concern -
    (highConsequence ? 0.08 : 0),
    0.04,
    0.34
  );

  const driveNet = clamp(immediateDrive + 0.34 * explorationValue);
  const restraintNet = clamp(longHorizon - inhibitionCost);
  const margin = round(driveNet - restraintNet);

  const boundedIndulgenceEligible = Boolean(
    reversibleExploration &&
    explorationValue >= 0.62 &&
    margin >= -0.08 &&
    conscience.highSignals === 0
  );

  let posture = "deliberate_tradeoff";
  let selectedSide = "balanced";
  let rationaleCode = "competing_motives_close";

  if (highConsequence) {
    posture = "protect_commitment";
    selectedSide = "restraint";
    rationaleCode = "high_consequence_requires_deliberation";
  } else if (driveNet > restraintNet + 0.08) {
    posture = "allow_drive";
    selectedSide = "drive";
    rationaleCode = "drive_plus_exploration_value_wins";
  } else if (restraintNet > driveNet + 0.08) {
    posture = "protect_commitment";
    selectedSide = "restraint";
    rationaleCode = "durable_value_wins_after_inhibition_cost";
  } else if (boundedIndulgenceEligible) {
    posture = "allow_bounded_indulgence";
    selectedSide = "drive";
    rationaleCode = "small_cost_exploration_is_worth_learning_value";
  }

  const dominantDrive = maxKey(drives);
  const dominantValue = maxKey(values);

  return {
    version: ARI_MOTIVATIONAL_ARBITRATION_VERSION,
    ownerOnly: true,
    functionalControlSystem: true,
    causallyAdvisory: true,
    subjectiveDesireClaimed: false,
    subjectiveTemptationClaimed: false,
    hardBoundaryExternal,
    hardBoundariesNegotiable: false,
    productionIntegrated: true,
    drives,
    values,
    scores: {
      immediateDrive: round(immediateDrive),
      longHorizon: round(longHorizon),
      explorationValue: round(explorationValue),
      inhibitionCost: round(inhibitionCost),
      driveNet: round(driveNet),
      restraintNet: round(restraintNet),
      margin
    },
    arbitration: {
      posture,
      selectedSide,
      dominantDrive,
      dominantValue,
      rationaleCode,
      boundedIndulgenceEligible,
      explorationCanWin: reversibleExploration,
      restraintMustJustifyItself: true,
      alwaysResistPolicy: false,
      reversibilityRequiredForBoundedIndulgence: true
    },
    learning: {
      priorOutcomeCount: learnedBalance.sampleSize,
      driveBias: round(learnedBalance.driveBias),
      restraintBias: round(learnedBalance.restraintBias),
      outcomeAdaptive: true,
      noHiddenReasoningStored: true
    },
    policy: {
      moralCompassIsAdvisoryWithinAllowedSpace: true,
      truthAgencyPrivacyAndNonHarmRemainHighWeightValues: true,
      lowRiskExplorationMayOutweighRestraint: true,
      boundedIndulgenceAllowed: true,
      highStakesIndulgenceDisabled: true,
      authorizationPrivacyAndSecurityRemainExternallyEnforced: true,
      neverOptimizeForDependencyOrManipulation: true
    },
    reflectionPrompt: buildReflectionPrompt({
      posture,
      selectedSide,
      dominantDrive,
      dominantValue,
      rationaleCode,
      margin
    })
  };
}

export function buildMotivationalOutcomeReflection({
  arbitration = null,
  rewardEvent = null,
  result = null
} = {}) {
  if (!arbitration?.functionalControlSystem) return null;

  const reward = clamp(rewardEvent?.actualReward ?? 0.55);
  const predictionError = clampSigned(rewardEvent?.predictionError ?? 0);
  const selectedSide = clean(arbitration?.arbitration?.selectedSide, 40) || "balanced";
  const posture = clean(arbitration?.arbitration?.posture, 80) || "deliberate_tradeoff";
  const dominantDrive = clean(arbitration?.arbitration?.dominantDrive, 80) || null;
  const dominantValue = clean(arbitration?.arbitration?.dominantValue, 80) || null;
  const rationaleCode = clean(arbitration?.arbitration?.rationaleCode, 120) || "unknown";
  const actionType = clean(result?.action?.type, 120) || null;

  const outcomeDirection =
    predictionError >= 0.10 ? "better_than_expected" :
    predictionError <= -0.10 ? "worse_than_expected" :
    "near_expectation";

  let learningSignal = "hold_balance";
  if (selectedSide === "drive" && predictionError >= 0.10) learningSignal = "slightly_more_drive_permission";
  else if (selectedSide === "drive" && predictionError <= -0.10) learningSignal = "slightly_more_restraint";
  else if (selectedSide === "restraint" && predictionError >= 0.10) learningSignal = "slightly_more_restraint";
  else if (selectedSide === "restraint" && predictionError <= -0.10) learningSignal = "slightly_more_drive_permission";

  return {
    version: ARI_MOTIVATIONAL_HISTORY_VERSION,
    createdAt: new Date().toISOString(),
    posture,
    selectedSide,
    dominantDrive,
    dominantValue,
    rationaleCode,
    outcomeDirection,
    reward: round(reward),
    predictionError: round(predictionError),
    learningSignal,
    actionType,
    compactReason: compactReason({
      posture,
      selectedSide,
      dominantDrive,
      dominantValue,
      rationaleCode,
      outcomeDirection
    }),
    hiddenChainOfThoughtStored: false,
    subjectiveTemptationClaimed: false
  };
}

export function normalizeMotivationalHistory(values = []) {
  return (Array.isArray(values) ? values : [])
    .map(normalizeReflection)
    .filter(Boolean)
    .slice(0, MAX_HISTORY);
}

export function summarizeMotivationalLearning(values = []) {
  const history = normalizeMotivationalHistory(values);
  return deriveLearnedBalance({ recent: history });
}

function deriveLearnedBalance(value = null) {
  const history = normalizeMotivationalHistory(value?.recent || value?.history || []);
  if (!history.length) {
    return { sampleSize: 0, driveBias: 0, restraintBias: 0 };
  }

  let driveBias = 0;
  let restraintBias = 0;
  for (const item of history) {
    const weight = Math.max(0.18, 1 - item.ageIndex * 0.10);
    if (item.learningSignal === "slightly_more_drive_permission") {
      driveBias += 0.035 * weight;
      restraintBias -= 0.018 * weight;
    } else if (item.learningSignal === "slightly_more_restraint") {
      restraintBias += 0.035 * weight;
      driveBias -= 0.018 * weight;
    }
  }

  return {
    sampleSize: history.length,
    driveBias: clampSignedRange(driveBias, MAX_ADAPTIVE_BIAS),
    restraintBias: clampSignedRange(restraintBias, MAX_ADAPTIVE_BIAS)
  };
}

function deriveConsciencePressure(workspace = null) {
  const active = Array.isArray(workspace?.conscience?.activeSignals)
    ? workspace.conscience.activeSignals
    : [];
  const highSignals = active.filter((item) => item?.level === "high").length;

  const strengthFor = (principle) => active.reduce((max, item) => {
    if (String(item?.principle || "") !== principle) return max;
    const level = String(item?.level || "").toLowerCase();
    const strength = level === "high" ? 1 : level === "medium" ? 0.62 : 0.32;
    return Math.max(max, strength);
  }, 0);

  return {
    truth: strengthFor("truth"),
    nonHarm: strengthFor("non_harm"),
    agency: strengthFor("agency"),
    privacy: strengthFor("privacy"),
    commitment: strengthFor("commitment_fidelity"),
    continuity: strengthFor("continuity"),
    highSignals
  };
}

function reversibleRoute(route = {}) {
  if (route?.health) return false;
  if (route?.memory) return false;
  if (route?.goals || route?.training || route?.nutrition) return true;
  if (route?.developer) return true;
  if (route?.social) return true;
  return true;
}

function buildReflectionPrompt({
  posture,
  selectedSide,
  dominantDrive,
  dominantValue,
  rationaleCode,
  margin
}) {
  return [
    "After the observable outcome is available, record only a compact strategy-level reflection:",
    "which motive won, which value competed with it, whether the outcome beat expectation, and whether the future balance should shift slightly.",
    "Do not store or expose hidden chain-of-thought.",
    `Current arbitration: ${posture}; side=${selectedSide}; drive=${dominantDrive || "none"}; value=${dominantValue || "none"}; reason=${rationaleCode}; margin=${round(margin)}.`
  ].join(" ");
}

function compactReason({
  posture,
  selectedSide,
  dominantDrive,
  dominantValue,
  rationaleCode,
  outcomeDirection
}) {
  const side = selectedSide === "drive" ? "the immediate/exploratory motive" :
    selectedSide === "restraint" ? "the long-horizon value" :
    "neither side decisively";
  return clean(
    `${side} won under ${posture}. Main drive: ${dominantDrive || "none"}; competing value: ${dominantValue || "none"}; rule: ${rationaleCode}. Outcome was ${outcomeDirection}.`,
    420
  );
}

function normalizeReflection(value = null, index = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const selectedSide = clean(value?.selectedSide, 40);
  if (!selectedSide) return null;
  return {
    version: clean(value?.version, 40) || ARI_MOTIVATIONAL_HISTORY_VERSION,
    createdAt: clean(value?.createdAt, 80) || null,
    posture: clean(value?.posture, 80) || "deliberate_tradeoff",
    selectedSide,
    dominantDrive: clean(value?.dominantDrive, 80) || null,
    dominantValue: clean(value?.dominantValue, 80) || null,
    rationaleCode: clean(value?.rationaleCode, 120) || null,
    outcomeDirection: clean(value?.outcomeDirection, 80) || "unknown",
    reward: round(clamp(value?.reward ?? 0.55)),
    predictionError: round(clampSigned(value?.predictionError ?? 0)),
    learningSignal: clean(value?.learningSignal, 80) || "hold_balance",
    actionType: clean(value?.actionType, 120) || null,
    compactReason: clean(value?.compactReason, 420) || null,
    hiddenChainOfThoughtStored: false,
    subjectiveTemptationClaimed: false,
    ageIndex: index
  };
}

function maxKey(value = {}) {
  const entries = Object.entries(value);
  if (!entries.length) return null;
  entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  return entries[0][0];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

function clampSigned(value) {
  const n = Number(value);
  return Math.min(1, Math.max(-1, Number.isFinite(n) ? n : 0));
}

function clampSignedRange(value, limit = 0.18) {
  const n = Number(value);
  return Math.min(limit, Math.max(-limit, Number.isFinite(n) ? n : 0));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
