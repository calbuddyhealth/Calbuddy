// ARI vNext — compact metacognitive evidence state.
// This tracks what evidence is available for the current turn; it never stores
// or exposes hidden chain-of-thought.

export const ARI_METACOGNITION_VERSION = "1.1.0";

export function deriveMetacognition({ route = {}, context = {}, safety = {}, coachingState = null, longitudinalState = null } = {}) {
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

  const evidenceSignals = [];
  if (Array.isArray(coachingState?.signals) && coachingState.signals.length) evidenceSignals.push("cross_feature_signals");
  if (Array.isArray(longitudinalState?.signals) && longitudinalState.signals.length) evidenceSignals.push("longitudinal_signals");
  if (longitudinalState?.weight?.available) evidenceSignals.push("weight_velocity");
  if (longitudinalState?.training?.progression?.comparableExerciseCount > 0) evidenceSignals.push("performance_history");

  return {
    version: ARI_METACOGNITION_VERSION,
    attention: requestedDomains.length ? requestedDomains : ["conversation"],
    confidence,
    coverage,
    missingEvidence: missing,
    evidenceSignals,
    exploration: {
      consequenceTier,
      uncertaintyIsInformationNotParalysis: true,
      hypothesisFormationAllowed: true,
      reversibleExperimentAllowed: consequenceTier !== "high",
      consequentialExecutionRequiresExistingChecks: true,
      failureIsEvidenceNotVerdict: true,
      generalizedRetreatFromSingleFailure: false
    },
    rules: {
      unknownIsNotNegativeEvidence: true,
      currentUserCorrectionWins: true,
      distinguishObservationFromInference: true,
      askOnlyWhenMissingInformationBlocksUsefulness: true,
      lowConfidenceIsNotAStopSignal: true,
      guardConsequencesNotImagination: true,
      learnLocallyFromFailure: true
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

  return [
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
  ].join("\n").slice(0, 2600);
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
