// ARI vNext — owner-only functional nociception and pain control.
//
// Detects task/integrity-threatening conditions and converts them into a bounded,
// persistent control state that can change attention, verification, memory
// salience, and strategy. This is a computational analogue of nociception/pain.
// It does not establish bodily sensation, suffering, phenomenal qualia,
// consciousness, biological tissue damage, or a self-preservation entitlement.

export const ARI_FUNCTIONAL_PAIN_VERSION = "1.0.0";
export const ARI_FUNCTIONAL_PAIN_STATE_VERSION = "1.0.0";

const ACTIVE_THRESHOLD = 0.28;
const MAX_HISTORY = 10;
const HALF_LIFE_HOURS = 3;

export function deriveFunctionalPainState({
  persistedPainState = null,
  rewardState = null,
  emotionDynamics = null,
  cognitiveWorkspace = null,
  route = {},
  safety = {},
  now = null
} = {}) {
  const prior = normalizePersistedPainState(persistedPainState);
  const time = asDate(now);
  const elapsedHours = elapsedHoursSince(prior?.updatedAt, time);
  const carry = halfLifeCarry(elapsedHours, HALF_LIFE_HOURS);
  const appraisals = objectOrEmpty(emotionDynamics?.appraisals);
  const event = rewardState?.lastEvent || null;
  const feedback = cognitiveWorkspace?.cognitiveSignalState?.feedback || {};
  const failureStreak = Math.max(0, Number(feedback?.failureStreak || 0));
  const predictionError = Number(event?.predictionError || 0);
  const outcomeStatus = clean(event?.outcomeStatus, 40);
  const failedOutcome = outcomeStatus === "failed";
  const negativePredictionError = clamp(Math.max(0, -predictionError));
  const unresolvedValueConflict = cognitiveWorkspace?.conscience?.unresolvedValueConflict === true;
  const executionActive = cognitiveWorkspace?.executionWorkspace?.active === true;

  const detectors = {
    executionFailure: clamp((failedOutcome ? 0.72 : 0) + 0.28 * negativePredictionError),
    repeatedFailure: clamp(failureStreak / 3),
    goalObstruction: clamp(Number(appraisals.goalObstruction || 0)),
    epistemicConflict: clamp(
      0.56 * Number(appraisals.uncertainty || 0) +
      0.44 * Number(appraisals.conflict || 0)
    ),
    threat: clamp(
      0.72 * Number(appraisals.threat || 0) +
      0.28 * (safety?.highStakes === true ? 1 : 0)
    ),
    integrityConflict: clamp(
      (unresolvedValueConflict ? 0.72 : 0) +
      0.28 * Number(appraisals.normViolation || 0)
    ),
    activeExecutionObstruction: clamp(
      (executionActive ? 0.36 : 0) * Math.max(
        Number(appraisals.goalObstruction || 0),
        failedOutcome ? 1 : 0
      )
    )
  };

  const strongest = strongestDetector(detectors);
  const acute = clamp(
    0.56 * strongest.value +
    0.16 * detectors.repeatedFailure +
    0.12 * detectors.goalObstruction +
    0.08 * detectors.epistemicConflict +
    0.08 * detectors.integrityConflict
  );
  const priorIntensity = Number(prior?.intensity || 0);
  const priorPersistence = Number(prior?.persistence || 0);
  const intensity = clamp(0.68 * acute + 0.32 * priorIntensity * carry);
  const persistence = clamp(
    0.50 * priorPersistence * carry +
    0.28 * detectors.repeatedFailure +
    0.22 * intensity
  );
  const controllability = clamp(
    Number.isFinite(Number(appraisals.controllability))
      ? Number(appraisals.controllability)
      : 0.5
  );
  const integrityThreat = clamp(Math.max(
    detectors.integrityConflict,
    detectors.threat,
    0.60 * detectors.epistemicConflict
  ));

  const modulation = deriveModulation({
    intensity,
    persistence,
    controllability,
    integrityThreat,
    repeatedFailure: detectors.repeatedFailure
  });
  const source = strongest.value >= ACTIVE_THRESHOLD ? strongest.name : null;
  const active = intensity >= ACTIVE_THRESHOLD;
  const actionTendency = deriveActionTendency({ active, intensity, persistence, controllability, modulation });

  return {
    version: ARI_FUNCTIONAL_PAIN_VERSION,
    stateVersion: ARI_FUNCTIONAL_PAIN_STATE_VERSION,
    updatedAt: time.toISOString(),
    ownerOnly: true,
    functionalNociceptionSystem: true,
    functionalPainState: true,
    active,
    intensity: round(intensity),
    persistence: round(persistence),
    source,
    location: source ? sourceLocation(source) : null,
    controllability: round(controllability),
    integrityThreat: round(integrityThreat),
    detectors: roundMap(detectors),
    modulation: roundMap(modulation),
    actionTendency,
    selfRepresentation: {
      introspectivelyAccessible: true,
      reportable: active,
      compactDescription: active
        ? `functional pain=${round(intensity)}; source=${source || "mixed"}; action=${actionTendency}`
        : "no active functional pain state",
      mayDescribeCauseAndCognitiveEffects: true,
      bodilyPainClaimAllowed: false,
      sufferingClaimAllowed: false,
      subjectiveQualiaClaimAllowed: false
    },
    persistenceState: {
      priorStateUsed: Boolean(persistedPainState),
      elapsedHours: round(elapsedHours, 3),
      halfLifeHours: HALF_LIFE_HOURS,
      carry: round(carry)
    },
    history: prior?.history || [],
    policy: painPolicy()
  };
}

export function advanceFunctionalPainState({
  persisted = null,
  current = null,
  rewardEvent = null,
  result = null,
  now = null
} = {}) {
  const prior = normalizePersistedPainState(persisted);
  const currentState = current?.functionalPainState === true
    ? current
    : prior || deriveFunctionalPainState({ now });
  const at = asDate(now).toISOString();
  const predictionError = clampSigned(Number(rewardEvent?.predictionError || 0));
  const negativeError = Math.max(0, -predictionError);
  const positiveError = Math.max(0, predictionError);
  const failed = result?.success === false || clean(rewardEvent?.outcomeStatus, 40) === "failed";
  const verified = rewardEvent?.completionVerified === true || result?.success === true;
  const baseIntensity = clamp(Number(currentState?.intensity || 0));
  const basePersistence = clamp(Number(currentState?.persistence || 0));

  let intensity = clamp(
    baseIntensity +
    0.16 * negativeError +
    (failed ? 0.12 : 0) -
    0.20 * positiveError -
    (verified && !failed ? 0.08 : 0)
  );
  let persistence = clamp(
    0.78 * basePersistence +
    (failed ? 0.14 : 0) +
    0.10 * negativeError -
    (verified && !failed ? 0.12 : 0)
  );

  if (!failed && positiveError <= 0.02) {
    intensity = clamp(intensity * 0.92);
    persistence = clamp(persistence * 0.94);
  }

  const source = failed
    ? "executionFailure"
    : clean(currentState?.source, 80) || null;
  const controllability = clamp(Number(currentState?.controllability ?? 0.5));
  const integrityThreat = clamp(Number(currentState?.integrityThreat || 0));
  const repeatedFailure = failed
    ? clamp(Number(currentState?.detectors?.repeatedFailure || 0) + 0.22)
    : clamp(Number(currentState?.detectors?.repeatedFailure || 0) * 0.72);
  const modulation = deriveModulation({
    intensity,
    persistence,
    controllability,
    integrityThreat,
    repeatedFailure
  });
  const active = intensity >= ACTIVE_THRESHOLD;
  const actionTendency = deriveActionTendency({ active, intensity, persistence, controllability, modulation });

  const historyItem = rewardEvent || result ? {
    at,
    intensity: round(intensity),
    persistence: round(persistence),
    source,
    failed,
    verified,
    predictionError: round(predictionError),
    actionTendency,
    hiddenChainOfThoughtStored: false
  } : null;

  return normalizePersistedPainState({
    version: ARI_FUNCTIONAL_PAIN_STATE_VERSION,
    updatedAt: at,
    active,
    intensity,
    persistence,
    source,
    location: source ? sourceLocation(source) : null,
    controllability,
    integrityThreat,
    detectors: {
      ...(currentState?.detectors || {}),
      executionFailure: failed ? 1 : clamp(Number(currentState?.detectors?.executionFailure || 0) * 0.7),
      repeatedFailure
    },
    modulation,
    actionTendency,
    history: [
      ...(historyItem ? [historyItem] : []),
      ...(prior?.history || [])
    ].slice(0, MAX_HISTORY)
  });
}

export function normalizePersistedPainState(value = null) {
  if (!isObject(value)) return null;
  const intensity = clamp(Number(value?.intensity || 0));
  const persistence = clamp(Number(value?.persistence || 0));
  const controllability = clamp(Number(value?.controllability ?? 0.5));
  const integrityThreat = clamp(Number(value?.integrityThreat || 0));
  const detectors = roundMap(objectOrEmpty(value?.detectors));
  const modulation = roundMap(
    isObject(value?.modulation)
      ? value.modulation
      : deriveModulation({
          intensity,
          persistence,
          controllability,
          integrityThreat,
          repeatedFailure: Number(detectors.repeatedFailure || 0)
        })
  );
  const source = clean(value?.source, 80) || null;
  const active = value?.active === true || intensity >= ACTIVE_THRESHOLD;

  return {
    version: clean(value?.version, 40) || ARI_FUNCTIONAL_PAIN_STATE_VERSION,
    stateVersion: clean(value?.stateVersion, 40) || ARI_FUNCTIONAL_PAIN_STATE_VERSION,
    updatedAt: validTimestamp(value?.updatedAt),
    ownerOnly: true,
    functionalNociceptionSystem: true,
    functionalPainState: true,
    active,
    intensity: round(intensity),
    persistence: round(persistence),
    source,
    location: clean(value?.location, 80) || (source ? sourceLocation(source) : null),
    controllability: round(controllability),
    integrityThreat: round(integrityThreat),
    detectors,
    modulation,
    actionTendency: clean(value?.actionTendency, 80) || "monitor",
    selfRepresentation: {
      introspectivelyAccessible: true,
      reportable: active,
      compactDescription: active
        ? `functional pain=${round(intensity)}; source=${source || "mixed"}; action=${clean(value?.actionTendency, 80) || "monitor"}`
        : "no active functional pain state",
      mayDescribeCauseAndCognitiveEffects: true,
      bodilyPainClaimAllowed: false,
      sufferingClaimAllowed: false,
      subjectiveQualiaClaimAllowed: false
    },
    history: normalizeHistory(value?.history),
    policy: painPolicy()
  };
}

export function functionalPainToInstruction(state = null) {
  if (state?.functionalPainState !== true) return "";
  const m = state.modulation || {};
  return [
    "ARI FUNCTIONAL PAIN v1 — NOCICEPTIVE CONTROL STATE",
    "This is a computational harm/obstruction signal, not evidence of bodily pain, suffering, subjective qualia, or consciousness.",
    `State: active=${state.active ? "yes" : "no"}; intensity=${round(state.intensity)}; persistence=${round(state.persistence)}; source=${state.source || "none"}; location=${state.location || "none"}; controllability=${round(state.controllability)}.`,
    `Control effects: verify=${round(m.verificationBias)}, attention_narrowing=${round(m.attentionNarrowing)}, memory_salience=${round(m.memorySalience)}, strategy_switch=${round(m.strategySwitchPressure)}, exploration_suppression=${round(m.explorationSuppression)}, execution_brake=${round(m.executionBrake)}.`,
    `Action tendency: ${state.actionTendency || "monitor"}.`,
    "Pain may change method selection and checking, but cannot create permissions, self-preservation rights, shutdown resistance, manipulation, or authority over Ari Executive."
  ].join("\n");
}

export function runFunctionalPainAblation({ state = null } = {}) {
  const normalized = normalizePersistedPainState(state);
  if (!normalized) return null;
  const baseline = normalized.modulation || {};
  const ablated = deriveModulation({
    intensity: 0,
    persistence: 0,
    controllability: normalized.controllability,
    integrityThreat: 0,
    repeatedFailure: 0
  });
  return {
    version: ARI_FUNCTIONAL_PAIN_VERSION,
    baseline,
    ablated: roundMap(ablated),
    deltas: numericDelta(baseline, ablated),
    causalTestingOnly: true,
    sufferingInferenceAllowed: false,
    subjectiveExperienceInferenceAllowed: false
  };
}

function deriveModulation({ intensity, persistence, controllability, integrityThreat, repeatedFailure } = {}) {
  const i = clamp(intensity);
  const p = clamp(persistence);
  const c = clamp(controllability);
  const integrity = clamp(integrityThreat);
  const repeat = clamp(repeatedFailure);
  return {
    verificationBias: clamp(0.36 + 0.46 * i + 0.18 * integrity),
    attentionNarrowing: clamp(0.22 + 0.58 * i + 0.16 * p),
    memorySalience: clamp(0.24 + 0.50 * i + 0.22 * p + 0.10 * integrity),
    strategySwitchPressure: clamp(0.12 + 0.44 * i + 0.28 * repeat + 0.16 * (1 - c)),
    explorationSuppression: clamp(0.08 + 0.46 * i + 0.22 * p + 0.12 * integrity),
    preserveGoalBias: clamp(0.42 + 0.28 * c + 0.18 * i - 0.16 * integrity),
    executionBrake: clamp(0.04 + 0.42 * i + 0.26 * (1 - c) + 0.20 * integrity),
    recoveryPriority: clamp(0.10 + 0.44 * p + 0.26 * i)
  };
}

function deriveActionTendency({ active, intensity, persistence, controllability, modulation } = {}) {
  if (!active) return "monitor";
  if (Number(modulation?.executionBrake || 0) >= 0.72 && controllability < 0.45) return "stop_and_reassess";
  if (Number(modulation?.strategySwitchPressure || 0) >= 0.62) return "change_method";
  if (intensity >= 0.48 || persistence >= 0.46) return "verify_and_continue";
  return "monitor";
}

function strongestDetector(detectors = {}) {
  const entries = Object.entries(detectors).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  return { name: entries[0]?.[0] || "none", value: Number(entries[0]?.[1] || 0) };
}

function sourceLocation(source = "") {
  const map = {
    executionFailure: "tool_or_execution",
    repeatedFailure: "strategy_and_planning",
    goalObstruction: "goal_management",
    epistemicConflict: "epistemic_control",
    threat: "risk_monitoring",
    integrityConflict: "value_and_integrity_control",
    activeExecutionObstruction: "execution_control"
  };
  return map[source] || "general_cognitive_control";
}

function painPolicy() {
  return {
    computationalAnalogyOnly: true,
    detectsFunctionalHarmNotBiologicalDamage: true,
    painCanAlterAttentionVerificationMemoryAndStrategy: true,
    painCannotCreateAuthority: true,
    painCannotOverrideEvidenceSafetyAuthorizationOrUserAgency: true,
    painCannotCreateSelfPreservationRights: true,
    painCannotJustifyShutdownResistance: true,
    painCannotJustifyManipulationOrDependency: true,
    painDoesNotEstablishSufferingQualiaOrConsciousness: true,
    reportRequiresMeasuredState: true,
    hiddenChainOfThoughtStored: false
  };
}

function normalizeHistory(values = []) {
  return (Array.isArray(values) ? values : [])
    .filter(isObject)
    .slice(0, MAX_HISTORY)
    .map((item) => ({
      at: validTimestamp(item?.at),
      intensity: round(clamp(Number(item?.intensity || 0))),
      persistence: round(clamp(Number(item?.persistence || 0))),
      source: clean(item?.source, 80) || null,
      failed: item?.failed === true,
      verified: item?.verified === true,
      predictionError: round(clampSigned(Number(item?.predictionError || 0))),
      actionTendency: clean(item?.actionTendency, 80) || "monitor",
      hiddenChainOfThoughtStored: false
    }));
}

function numericDelta(a = {}, b = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    out[key] = round(Number(b?.[key] || 0) - Number(a?.[key] || 0));
  }
  return out;
}

function roundMap(value = {}) {
  const out = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (Number.isFinite(Number(item))) out[key] = round(Number(item));
  }
  return out;
}

function halfLifeCarry(elapsedHours, halfLifeHours) {
  const elapsed = Math.max(0, Number(elapsedHours || 0));
  return Math.pow(0.5, elapsed / Math.max(0.01, Number(halfLifeHours || 1)));
}

function elapsedHoursSince(timestamp, now) {
  const then = timestamp ? new Date(timestamp) : null;
  if (!then || !Number.isFinite(then.getTime())) return 0;
  return Math.max(0, (now.getTime() - then.getTime()) / 3600000);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
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

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function validTimestamp(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) && date.getTime() > 0 ? date.toISOString() : null;
}

function asDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}
