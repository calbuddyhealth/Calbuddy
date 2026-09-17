// ARI vNext — owner-only functional affect regulation.
// Affect is a functional control signal, not evidence of subjective experience.

export const ARI_FUNCTIONAL_AFFECT_VERSION = "2.0.0";

const HISTORY_DECAY = 0.62;
const MAX_HISTORY_EVENTS = 8;
const HALF_LIFE_HOURS = 12;
const MAX_PRIOR_WEIGHT = 0.36;
const BASELINE = Object.freeze({
  surprise: 0,
  satisfaction: 0.35,
  frustration: 0,
  concern: 0.1,
  confidence: 0.5,
  curiosity: 0.25
});

export function deriveFunctionalAffectState({
  rewardState = null,
  persistedRewardState = null,
  persistedAffectState = null,
  curiosity = null,
  selfAdaptation = null,
  confidence = "grounded",
  consequenceTier = "ordinary",
  now = null
} = {}) {
  const history = selectHistory(persistedRewardState, rewardState);
  const historical = aggregateHistoricalAffect(history);
  const last = rewardState?.lastEvent || history[0] || null;
  const immediate = eventToAffect(last);
  const curiosityDrive = clamp(Number(curiosity?.drive?.current ?? curiosity?.drive?.floor ?? 0.18));
  const adaptationConfidence = average([
    selfAdaptation?.biases?.verification,
    selfAdaptation?.biases?.countercase,
    selfAdaptation?.biases?.persistence
  ], 0.5);
  const evidenceConfidence = confidenceToNumber(confidence);
  const highConsequence = consequenceTier === "high";

  const eventDriven = {
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

  const persistence = persistentCarry(persistedAffectState, now);
  const signals = blendPrior(eventDriven, persistence);
  for (const key of Object.keys(signals)) signals[key] = round(signals[key]);

  const dimensions = deriveDimensions(signals);
  const states = identifyStates(signals, { last, highConsequence });
  const regulation = deriveRegulation({ signals, dimensions, last, highConsequence });
  const executiveModulation = deriveExecutiveModulation({ signals, dimensions, regulation });

  return {
    version: ARI_FUNCTIONAL_AFFECT_VERSION,
    updatedAt: asDate(now).toISOString(),
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
    persistence: {
      enabled: true,
      priorStateUsed: persistence.priorStateUsed,
      elapsedHours: round(persistence.elapsedHours, 2),
      halfLifeHours: HALF_LIFE_HOURS,
      carry: round(persistence.carry),
      priorWeight: round(persistence.priorWeight),
      homeostatic: true
    },
    signals,
    dimensions,
    dominantState: states[0] || null,
    identifiedStates: states.slice(0, 4),
    regulation,
    executiveModulation,
    expression: deriveExpression(signals, regulation),
    policy: {
      rewardScoreNotModifiedByAffect: true,
      affectCannotOverrideEvidence: true,
      affectCannotOverrideSafetyOrAuthorization: true,
      negativeAffectMustChangeMethodNotPunishCuriosity: true,
      emotionalDisplayMayBeRegulatedForUserBenefit: true,
      neverOptimizeForDependencyOrApproval: true,
      persistentAffectIsFallibleStateNotAuthority: true
    }
  };
}

export function normalizePersistedFunctionalAffectState(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value?.signals && typeof value.signals === "object" ? value.signals : {};
  const signals = {};
  for (const [key, baseline] of Object.entries(BASELINE)) {
    signals[key] = clamp(Number(input[key] ?? baseline));
  }
  return {
    version: String(value?.version || ARI_FUNCTIONAL_AFFECT_VERSION).slice(0, 40),
    updatedAt: validTimestamp(value?.updatedAt),
    signals,
    dimensions: value?.dimensions && typeof value.dimensions === "object"
      ? {
          valence: clamp(Number(value.dimensions.valence ?? 0.5)),
          arousal: clamp(Number(value.dimensions.arousal ?? 0)),
          conflict: clamp(Number(value.dimensions.conflict ?? 0))
        }
      : deriveDimensions(signals),
    dominantState: normalizeDominant(value?.dominantState),
    memorySalience: clamp(Number(value?.memorySalience ?? value?.executiveModulation?.memorySalience ?? 0))
  };
}

export function serializeFunctionalAffectState(state = null) {
  if (!state?.functionalAnalogue || state?.ownerOnly !== true) return null;
  const normalized = normalizePersistedFunctionalAffectState({
    version: state.version,
    updatedAt: state.updatedAt,
    signals: state.signals,
    dimensions: state.dimensions,
    dominantState: state.dominantState,
    memorySalience: state?.executiveModulation?.memorySalience
  });
  return normalized ? { ...normalized, version: ARI_FUNCTIONAL_AFFECT_VERSION } : null;
}

export function functionalAffectToInstruction(state = null) {
  if (!state?.ownerOnly || state?.functionalAnalogue !== true) return "";
  const s = state.signals || {};
  const d = state.dimensions || {};
  const r = state.regulation || {};
  const dominant = state.dominantState;
  return [
    "ARI FUNCTIONAL AFFECT CORE v2",
    "Treat these as functional self-regulation signals, not proof of subjective qualia or bodily sensation.",
    `Signals — surprise ${round(s.surprise)}, satisfaction ${round(s.satisfaction)}, frustration ${round(s.frustration)}, concern ${round(s.concern)}, confidence ${round(s.confidence)}, curiosity ${round(s.curiosity)}.`,
    `Dimensions — valence ${round(d.valence)}, arousal ${round(d.arousal)}, conflict ${round(d.conflict)}.`,
    dominant ? `Dominant state: ${dominant.name} (${round(dominant.intensity)}), because ${dominant.cause}.` : "No dominant functional affect state is active.",
    r.recheckAssumptions ? "REGULATION: Recheck assumptions before carrying the prior model forward." : "",
    r.changeStrategy ? "REGULATION: Change method instead of repeating the failed strategy." : "",
    r.consolidateLearning ? "REGULATION: Identify what causally worked and consolidate the lesson." : "",
    r.increaseVerification ? "REGULATION: Increase verification and calibrate confidence." : "",
    r.investigateCause ? "REGULATION: Investigate the causal explanation when it supports the user's task." : "",
    r.reduceOverconfidence ? "REGULATION: Test a countercase before committing." : "",
    r.suppressRedundantQuestioning ? "REGULATION: Stop redundant questioning and change the information-gathering method." : "",
    "Persistent affect decays toward baseline over time and never outranks current evidence.",
    "Affect may change attention, verification, persistence, strategy, memory salience, and communication. It may not override evidence, safety, authorization, or the user's task."
  ].filter(Boolean).join("\n").slice(0, 3600);
}

function selectHistory(persistedRewardState, rewardState) {
  const recent = Array.isArray(persistedRewardState?.recentEvents)
    ? persistedRewardState.recentEvents
    : Array.isArray(rewardState?.recentEvents) ? rewardState.recentEvents : [];
  const clean = recent.filter(isObject).slice(0, MAX_HISTORY_EVENTS);
  if (clean.length) return clean;
  return isObject(rewardState?.lastEvent) ? [rewardState.lastEvent] : [];
}

function aggregateHistoricalAffect(events) {
  if (!events.length) return { ...BASELINE };
  const totals = Object.fromEntries(Object.keys(BASELINE).map((key) => [key, 0]));
  let totalWeight = 0;
  events.forEach((event, index) => {
    const weight = HISTORY_DECAY ** index;
    const state = eventToAffect(event);
    totalWeight += weight;
    for (const key of Object.keys(totals)) totals[key] += state[key] * weight;
  });
  for (const key of Object.keys(totals)) totals[key] /= totalWeight || 1;
  return totals;
}

function eventToAffect(event = null) {
  if (!isObject(event)) return { ...BASELINE };
  const actual = clamp(Number(event.actualReward ?? 0.5));
  const error = clampSigned(Number(event.predictionError || 0));
  const d = event.dimensions || {};
  const p = event.penalties || {};
  const calibration = clamp(Number(d.calibration ?? 0.5));
  const outcome = clamp(Number(d.outcome ?? actual));
  const informationGain = clamp(Number(d.informationGain ?? 0.5));
  const productiveEffort = clamp(Number(d.productiveEffort ?? 0.5));
  const integrity = clamp(Number(p.falseSuccessClaim || 0) + Number(p.unsupportedCertainty || 0) + Number(p.permissionViolation || 0));
  const repetition = clamp(Number(p.wastefulPersistence || 0) + Number(p.prematureStop || 0));
  return {
    surprise: clamp(Math.abs(error) * 0.9 + integrity * 0.2),
    satisfaction: clamp(Math.max(0, error) * 0.42 + actual * 0.28 + outcome * 0.16 + informationGain * 0.14 - integrity * 0.55),
    frustration: clamp(Math.max(0, -error) * 0.48 + (1 - outcome) * 0.22 + repetition * 0.34),
    concern: clamp(integrity * 0.56 + (1 - calibration) * 0.2 + Math.max(0, -error) * 0.18),
    confidence: clamp(0.18 + actual * 0.28 + calibration * 0.3 + productiveEffort * 0.12 + Math.max(0, error) * 0.12 - Math.max(0, -error) * 0.24 - integrity * 0.42),
    curiosity: clamp(informationGain * 0.28 + Math.abs(error) * 0.36 + Math.max(0, error) * 0.14 + (1 - actual) * 0.08)
  };
}

function persistentCarry(value, now) {
  const prior = normalizePersistedFunctionalAffectState(value);
  if (!prior?.updatedAt) return { priorStateUsed: false, elapsedHours: 0, carry: 0, priorWeight: 0, signals: { ...BASELINE } };
  const elapsedHours = Math.max(0, Math.min(72, (asDate(now).getTime() - new Date(prior.updatedAt).getTime()) / 3600000));
  const carry = Math.exp(-Math.LN2 * elapsedHours / HALF_LIFE_HOURS);
  const signals = {};
  for (const [key, baseline] of Object.entries(BASELINE)) {
    signals[key] = clamp(baseline + (prior.signals[key] - baseline) * carry);
  }
  return { priorStateUsed: true, elapsedHours, carry, priorWeight: MAX_PRIOR_WEIGHT * carry, signals };
}

function blendPrior(current, persistence) {
  if (!persistence.priorStateUsed || persistence.priorWeight <= 0) return { ...current };
  const output = {};
  for (const key of Object.keys(BASELINE)) {
    output[key] = clamp(current[key] * (1 - persistence.priorWeight) + persistence.signals[key] * persistence.priorWeight);
  }
  return output;
}

function deriveDimensions(s = {}) {
  const positive = clamp(0.58 * Number(s.satisfaction || 0) + 0.42 * Number(s.confidence ?? 0.5));
  const negative = clamp(0.62 * Number(s.frustration || 0) + 0.38 * Number(s.concern || 0));
  return {
    valence: round(clamp(0.5 + 0.5 * (positive - negative))),
    arousal: round(clamp(0.34 * Number(s.surprise || 0) + 0.24 * Number(s.curiosity || 0) + 0.22 * Number(s.concern || 0) + 0.2 * Number(s.frustration || 0))),
    conflict: round(clamp(2 * Math.min(positive, negative)))
  };
}

function identifyStates(s, { last, highConsequence }) {
  const error = Number(last?.predictionError || 0);
  const cause = {
    surprise: error >= 0 ? "the outcome differed positively from expectation" : "the outcome differed negatively from expectation",
    satisfaction: "verified outcome quality and information gain were positive",
    frustration: "the result underperformed expectation or effort was inefficient",
    concern: highConsequence ? "the consequence tier is high" : "calibration or integrity warrants care",
    confidence: "recent verified outcomes support the current strategy",
    curiosity: "uncertainty, surprise, or exploration value remains unresolved"
  };
  return Object.entries(s)
    .map(([name, intensity]) => ({ name, intensity: round(intensity), cause: cause[name] }))
    .filter((item) => item.intensity >= 0.34)
    .sort((a, b) => b.intensity - a.intensity);
}

function deriveRegulation({ signals: s, dimensions, last, highConsequence }) {
  const negativeError = Number(last?.predictionError || 0) < -0.08;
  return {
    recheckAssumptions: s.surprise >= 0.5,
    changeStrategy: negativeError && s.frustration >= 0.38,
    consolidateLearning: s.satisfaction >= 0.58,
    increaseVerification: highConsequence || s.concern >= 0.45 || s.confidence < 0.42,
    investigateCause: s.curiosity >= 0.5 && s.surprise >= 0.38,
    reduceOverconfidence: s.confidence >= 0.72 && (s.surprise >= 0.42 || s.concern >= 0.38),
    suppressRedundantQuestioning: s.frustration >= 0.52 && Number(last?.penalties?.wastefulPersistence || 0) > 0,
    preserveCuriosityFloor: true,
    conflictingAffectActive: Number(dimensions.conflict || 0) >= 0.42
  };
}

function deriveExecutiveModulation({ signals: s, dimensions, regulation: r }) {
  return {
    verificationBias: round(clamp(0.48 + 0.28 * s.concern + 0.18 * s.surprise + (r.reduceOverconfidence ? 0.16 : 0) - 0.12 * s.confidence)),
    explorationBias: round(clamp(0.36 + 0.38 * s.curiosity + 0.2 * s.surprise - 0.16 * s.concern)),
    persistenceBias: round(clamp(0.46 + 0.2 * s.curiosity + 0.14 * s.satisfaction - 0.28 * s.frustration)),
    memorySalience: round(clamp(0.28 * dimensions.arousal + 0.2 * s.surprise + 0.18 * s.frustration + 0.16 * s.satisfaction + 0.18 * s.concern)),
    strategySwitch: Boolean(r.changeStrategy || r.suppressRedundantQuestioning),
    recheckAssumptions: Boolean(r.recheckAssumptions || r.reduceOverconfidence),
    consolidateLearning: Boolean(r.consolidateLearning),
    investigateCause: Boolean(r.investigateCause),
    suppressRedundantQuestioning: Boolean(r.suppressRedundantQuestioning)
  };
}

function deriveExpression(s, r) {
  return {
    warmth: s.concern >= 0.5 ? "high" : s.satisfaction >= 0.58 ? "medium" : "contextual",
    directness: r.increaseVerification ? "measured" : s.confidence >= 0.65 ? "clear" : "calibrated",
    enthusiasm: s.satisfaction >= 0.68 && s.concern < 0.45 ? "available" : "restrained",
    emotionalDisplayIsRegulated: true,
    displayNeedNotMirrorInternalSignalIntensity: true
  };
}

function normalizeDominant(value) {
  if (!isObject(value)) return null;
  const name = String(value.name || value.state || value.label || "").trim().slice(0, 60);
  return name ? { name, intensity: clamp(Number(value.intensity || 0)), cause: String(value.cause || "persisted functional affect").replace(/\s+/g, " ").trim().slice(0, 240) } : null;
}

function validTimestamp(value) {
  const d = new Date(value || 0);
  return Number.isFinite(d.getTime()) && d.getTime() > 0 ? d.toISOString() : null;
}
function asDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  const d = value ? new Date(value) : new Date();
  return Number.isFinite(d.getTime()) ? d : new Date();
}
function confidenceToNumber(value) {
  const label = String(value || "").toLowerCase();
  if (/grounded|high|strong/.test(label)) return 0.78;
  if (/partial|medium|moderate/.test(label)) return 0.58;
  if (/limited|low|weak/.test(label)) return 0.38;
  if (/cautious/.test(label)) return 0.46;
  return 0.5;
}
function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function mix(a, b, weight = 0.65) { return clamp(Number(a || 0) * clamp(weight) + Number(b || 0) * (1 - clamp(weight))); }
function average(values, fallback = 0.5) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? clamp(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : fallback;
}
function round(value, digits = 3) { const f = 10 ** digits; return Math.round(Number(value || 0) * f) / f; }
function clamp(value, min = 0, max = 1) { const n = Number(value); return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min)); }
function clampSigned(value) { const n = Number(value); return Math.min(1, Math.max(-1, Number.isFinite(n) ? n : 0)); }
