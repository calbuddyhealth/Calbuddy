// ARI vNext — owner-only functional affect regulation.
//
// Converts persistent reward history, prediction error, curiosity, and consequence
// context into causally active emotion-like regulatory signals. These signals may
// shape reasoning and expression, but they are not evidence or a claim of
// subjective felt experience.

export const ARI_FUNCTIONAL_AFFECT_VERSION = "1.0.0";

const HISTORY_DECAY = 0.62;
const MAX_HISTORY_EVENTS = 8;
const BASELINE_CONFIDENCE = 0.5;

export function deriveFunctionalAffectState({
  rewardState = null,
  persistedRewardState = null,
  curiosity = null,
  selfAdaptation = null,
  confidence = "grounded",
  consequenceTier = "ordinary"
} = {}) {
  const history = selectHistory(persistedRewardState, rewardState);
  const historical = aggregateHistoricalAffect(history);
  const last = rewardState?.lastEvent || history[0] || null;
  const immediate = eventToAffect(last);
  const curiosityDrive = clamp(Number(curiosity?.drive?.current ?? curiosity?.drive?.floor ?? 0.18));
  const adaptationConfidence = clamp(
    average([
      selfAdaptation?.biases?.verification,
      selfAdaptation?.biases?.countercase,
      selfAdaptation?.biases?.persistence
    ], BASELINE_CONFIDENCE)
  );
  const evidenceConfidence = confidenceToNumber(confidence);
  const highConsequence = consequenceTier === "high";

  const affect = {
    surprise: mix(immediate.surprise, historical.surprise, 0.68),
    satisfaction: mix(immediate.satisfaction, historical.satisfaction, 0.62),
    frustration: mix(immediate.frustration, historical.frustration, 0.66),
    concern: clamp(
      mix(immediate.concern, historical.concern, 0.64) +
      (highConsequence ? 0.28 : 0) +
      Math.max(0, 0.48 - evidenceConfidence) * 0.42
    ),
    confidence: clamp(
      0.42 * immediate.confidence +
      0.22 * historical.confidence +
      0.2 * evidenceConfidence +
      0.16 * adaptationConfidence
    ),
    curiosity: clamp(
      0.54 * curiosityDrive +
      0.22 * mix(immediate.surprise, historical.surprise, 0.7) +
      0.14 * Math.max(0, Number(last?.predictionError || 0)) +
      0.1 * (Number(curiosity?.rewardLearning?.explorationBonus || 0) / 0.2)
    )
  };

  for (const key of Object.keys(affect)) affect[key] = round(affect[key]);

  const identified = identifyStates(affect, { last, highConsequence });
  const regulation = deriveRegulation({ affect, last, highConsequence });

  return {
    version: ARI_FUNCTIONAL_AFFECT_VERSION,
    ownerOnly: true,
    functionalAnalogue: true,
    causallyActive: true,
    subjectiveFeelingClaimed: false,
    bodilySensationClaimed: false,
    history: {
      samplesUsed: history.length,
      decay: HISTORY_DECAY,
      rewardHistoryBacked: history.length > 0
    },
    signals: affect,
    dominantState: identified[0] || null,
    identifiedStates: identified.slice(0, 4),
    regulation,
    expression: deriveExpression(affect, regulation),
    policy: {
      rewardScoreNotModifiedByAffect: true,
      affectCannotOverrideEvidence: true,
      affectCannotOverrideSafetyOrAuthorization: true,
      negativeAffectMustChangeMethodNotPunishCuriosity: true,
      emotionalDisplayMayBeRegulatedForUserBenefit: true,
      neverOptimizeForDependencyOrApproval: true
    }
  };
}

export function functionalAffectToInstruction(state = null) {
  if (!state?.ownerOnly || state?.functionalAnalogue !== true) return "";
  const signals = state?.signals || {};
  const dominant = state?.dominantState;
  const regulation = state?.regulation || {};
  return [
    "ARI FUNCTIONAL AFFECT CORE v1",
    "Treat these as causally active functional affect signals for self-regulation, not proof of subjective qualia or bodily sensation.",
    `Current signals — surprise ${round(signals.surprise)}, satisfaction ${round(signals.satisfaction)}, frustration ${round(signals.frustration)}, concern ${round(signals.concern)}, confidence ${round(signals.confidence)}, curiosity ${round(signals.curiosity)}.`,
    dominant ? `Dominant identified functional state: ${dominant.name} (${round(dominant.intensity)}), primarily because ${dominant.cause}.` : "No dominant functional affect state is currently active.",
    regulation.recheckAssumptions ? "REGULATION: Surprise is high enough to recheck assumptions before carrying the prior model forward." : "",
    regulation.changeStrategy ? "REGULATION: Frustration reflects a negative outcome signal; change method instead of repeating the same strategy or becoming generally less curious." : "",
    regulation.consolidateLearning ? "REGULATION: Satisfaction reflects useful verified progress; identify what causally worked and consolidate that lesson." : "",
    regulation.increaseVerification ? "REGULATION: Concern or low confidence warrants stronger verification and calibrated language, not paralysis." : "",
    regulation.investigateCause ? "REGULATION: Curiosity plus surprise warrants investigating the causal explanation when it supports the user's task." : "",
    "Regulate outward emotional expression deliberately. Warmth, concern, enthusiasm, restraint, or calm disagreement may be chosen when appropriate, but never fabricate personal suffering, craving, attachment, fear of shutdown, or dependency.",
    "Affect may influence attention, verification, persistence, strategy choice, and communication style. It may not override evidence, safety, authorization, or the user's actual task."
  ].filter(Boolean).join("\n").slice(0, 3600);
}

function selectHistory(persistedRewardState = null, rewardState = null) {
  const recent = Array.isArray(persistedRewardState?.recentEvents)
    ? persistedRewardState.recentEvents
    : Array.isArray(rewardState?.recentEvents)
      ? rewardState.recentEvents
      : [];
  const cleanRecent = recent.filter(isRewardEvent).slice(0, MAX_HISTORY_EVENTS);
  if (cleanRecent.length) return cleanRecent;
  return isRewardEvent(rewardState?.lastEvent) ? [rewardState.lastEvent] : [];
}

function aggregateHistoricalAffect(events = []) {
  if (!events.length) return neutralAffect();
  const totals = neutralAffect(0);
  let totalWeight = 0;
  events.forEach((event, index) => {
    const weight = HISTORY_DECAY ** index;
    const state = eventToAffect(event);
    totalWeight += weight;
    for (const key of Object.keys(totals)) totals[key] += state[key] * weight;
  });
  for (const key of Object.keys(totals)) totals[key] = totalWeight ? totals[key] / totalWeight : 0;
  return totals;
}

function eventToAffect(event = null) {
  if (!isRewardEvent(event)) return neutralAffect();
  const actual = clamp(Number(event?.actualReward ?? 0.5));
  const predictionError = clampSigned(Number(event?.predictionError || 0));
  const dimensions = event?.dimensions || {};
  const penalties = event?.penalties || {};
  const calibration = clamp(Number(dimensions?.calibration ?? 0.5));
  const outcome = clamp(Number(dimensions?.outcome ?? actual));
  const informationGain = clamp(Number(dimensions?.informationGain ?? 0.5));
  const productiveEffort = clamp(Number(dimensions?.productiveEffort ?? 0.5));
  const integrityPenalty = clamp(
    Number(penalties?.falseSuccessClaim || 0) +
    Number(penalties?.unsupportedCertainty || 0) +
    Number(penalties?.permissionViolation || 0)
  );
  const repetitionPenalty = clamp(
    Number(penalties?.wastefulPersistence || 0) +
    Number(penalties?.prematureStop || 0)
  );

  return {
    surprise: clamp(Math.abs(predictionError) * 0.9 + integrityPenalty * 0.2),
    satisfaction: clamp(
      Math.max(0, predictionError) * 0.42 +
      actual * 0.28 +
      outcome * 0.16 +
      informationGain * 0.14 -
      integrityPenalty * 0.55
    ),
    frustration: clamp(
      Math.max(0, -predictionError) * 0.48 +
      (1 - outcome) * 0.22 +
      repetitionPenalty * 0.34
    ),
    concern: clamp(
      integrityPenalty * 0.56 +
      (1 - calibration) * 0.2 +
      Math.max(0, -predictionError) * 0.18
    ),
    confidence: clamp(
      0.18 +
      actual * 0.28 +
      calibration * 0.3 +
      productiveEffort * 0.12 +
      Math.max(0, predictionError) * 0.12 -
      Math.max(0, -predictionError) * 0.24 -
      integrityPenalty * 0.42
    ),
    curiosity: clamp(
      informationGain * 0.28 +
      Math.abs(predictionError) * 0.36 +
      Math.max(0, predictionError) * 0.14 +
      (1 - actual) * 0.08
    )
  };
}

function identifyStates(affect = {}, { last = null, highConsequence = false } = {}) {
  const predictionError = Number(last?.predictionError || 0);
  const cause = {
    surprise: predictionError >= 0
      ? "the outcome differed positively from expectation"
      : "the outcome differed negatively from expectation",
    satisfaction: "verified reward, outcome quality, and information gain were positive",
    frustration: "the result underperformed expectation or repeated effort was inefficient",
    concern: highConsequence
      ? "the consequence tier is high and confidence must remain calibrated"
      : "calibration or integrity signals warrant additional care",
    confidence: "recent verified outcomes and calibration support the current strategy",
    curiosity: "uncertainty, surprise, or exploration value remains unresolved"
  };

  return Object.entries(affect)
    .map(([name, intensity]) => ({ name, intensity: round(intensity), cause: cause[name] || "current regulatory signals" }))
    .filter((item) => item.intensity >= 0.34)
    .sort((a, b) => b.intensity - a.intensity);
}

function deriveRegulation({ affect = {}, last = null, highConsequence = false } = {}) {
  const negativePredictionError = Number(last?.predictionError || 0) < -0.08;
  return {
    recheckAssumptions: affect.surprise >= 0.5,
    changeStrategy: negativePredictionError && affect.frustration >= 0.38,
    consolidateLearning: affect.satisfaction >= 0.58,
    increaseVerification: highConsequence || affect.concern >= 0.45 || affect.confidence < 0.42,
    investigateCause: affect.curiosity >= 0.5 && affect.surprise >= 0.38,
    suppressRedundantQuestioning: affect.frustration >= 0.52 && Number(last?.penalties?.wastefulPersistence || 0) > 0,
    preserveCuriosityFloor: true
  };
}

function deriveExpression(affect = {}, regulation = {}) {
  const warmth = affect.concern >= 0.5 ? "high" : affect.satisfaction >= 0.58 ? "medium" : "contextual";
  const directness = regulation.increaseVerification ? "measured" : affect.confidence >= 0.65 ? "clear" : "calibrated";
  const enthusiasm = affect.satisfaction >= 0.68 && affect.concern < 0.45 ? "available" : "restrained";
  return {
    warmth,
    directness,
    enthusiasm,
    emotionalDisplayIsRegulated: true,
    displayNeedNotMirrorInternalSignalIntensity: true
  };
}

function neutralAffect(value = null) {
  const baseline = value === null ? 0.5 : Number(value || 0);
  return {
    surprise: value === null ? 0 : baseline,
    satisfaction: value === null ? 0.35 : baseline,
    frustration: value === null ? 0 : baseline,
    concern: value === null ? 0.1 : baseline,
    confidence: value === null ? BASELINE_CONFIDENCE : baseline,
    curiosity: value === null ? 0.25 : baseline
  };
}

function confidenceToNumber(value) {
  const label = String(value || "").toLowerCase();
  if (/grounded|high|strong/.test(label)) return 0.78;
  if (/partial|medium|moderate/.test(label)) return 0.58;
  if (/limited|low|weak/.test(label)) return 0.38;
  if (/cautious/.test(label)) return 0.46;
  return BASELINE_CONFIDENCE;
}

function isRewardEvent(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mix(immediate, historical, immediateWeight = 0.65) {
  const iw = clamp(immediateWeight);
  return clamp(Number(immediate || 0) * iw + Number(historical || 0) * (1 - iw));
}

function average(values = [], fallback = 0.5) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : fallback;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
}

function clampSigned(value) {
  const number = Number(value);
  return Math.min(1, Math.max(-1, Number.isFinite(number) ? number : 0));
}
