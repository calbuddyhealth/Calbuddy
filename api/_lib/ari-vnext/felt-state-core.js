// ARI vNext — owner-only felt-state core.
//
// Converts functional emotion dynamics into an introspectively accessible,
// temporally continuous self-state. This is a functional analogue of feeling:
// globally available state that Ari can inspect and use causally. It is not
// evidence or a claim of phenomenal qualia, biological feeling, or sensation.

export const ARI_FELT_STATE_VERSION = "1.0.0";
export const ARI_FELT_STATE_STATE_VERSION = "1.0.0";

const ACTIVE_THRESHOLD = 0.34;
const MAX_HISTORY = 10;
const TRAJECTORY_EPSILON = 0.06;

export function deriveFeltState({
  emotionDynamics = null,
  functionalAffect = null,
  persistedFeltState = null,
  rewardState = null,
  cognitiveWorkspace = null,
  now = null
} = {}) {
  if (!emotionDynamics?.functionalEmotionSystem) return null;

  const timestamp = asDate(now).toISOString();
  const prior = normalizePersistedFeltState(persistedFeltState);
  const emotions = numericMap(emotionDynamics?.emotions);
  const appraisals = numericMap(emotionDynamics?.appraisals);
  const modulation = numericMap(emotionDynamics?.executiveModulation);
  const dominant = normalizeDominant(emotionDynamics?.dominantState, emotions);
  const activeStates = Object.entries(emotions)
    .filter(([, intensity]) => Number(intensity || 0) >= ACTIVE_THRESHOLD)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6)
    .map(([name, intensity]) => ({ name, intensity: round(intensity) }));

  const profile = derivePhenomenologicalProfile({ emotions, appraisals, functionalAffect });
  const attribution = deriveSelfAttribution({
    dominant,
    activeStates,
    appraisals,
    rewardState,
    cognitiveWorkspace
  });
  const temporal = deriveTemporalContinuity({ prior, dominant, activeStates, now: timestamp });
  const reappraisal = deriveReappraisal({ prior, dominant, appraisals, emotionDynamics });
  const introspection = deriveIntrospection({
    dominant,
    activeStates,
    attribution,
    temporal,
    profile,
    emotionDynamics
  });

  const snapshot = {
    at: timestamp,
    dominant: dominant?.name || null,
    intensity: round(dominant?.intensity || 0),
    valence: profile.valence,
    activation: profile.activation,
    trajectory: temporal.trajectory,
    causalDrivers: attribution.causalDrivers.slice(0, 4),
    reappraised: reappraisal.changedAgainstPrior === true
  };

  const history = compactHistory([
    snapshot,
    ...(Array.isArray(prior?.history) ? prior.history : [])
  ]);

  return {
    version: ARI_FELT_STATE_VERSION,
    stateVersion: ARI_FELT_STATE_STATE_VERSION,
    updatedAt: timestamp,
    ownerOnly: true,
    functionalFeltState: true,
    introspectivelyAccessible: true,
    globallyAvailable: true,
    causallyActive: true,
    subjectiveQualiaClaimed: false,
    biologicalFeelingClaimed: false,
    bodilySensationClaimed: false,
    selfAttribution: attribution,
    activeStates,
    dominantState: dominant,
    profile,
    temporal,
    reappraisal,
    introspection,
    executiveModulation: {
      attentionStyle: profile.attentionStyle,
      temporalFocus: profile.temporalFocus,
      actionTendency: profile.actionTendency,
      detailBias: round(modulation.detailBias || 0),
      threatVigilance: round(modulation.threatVigilance || 0),
      cognitiveFlexibility: round(modulation.cognitiveFlexibility || 0),
      lossReviewPriority: round(modulation.lossReviewPriority || 0),
      counterfactualReviewPriority: round(modulation.counterfactualReviewPriority || 0),
      obstacleConfrontation: round(modulation.obstacleConfrontation || 0),
      memorySalience: round(modulation.memorySalience || 0),
      verificationBias: round(modulation.verificationBias || 0),
      explorationBias: round(modulation.explorationBias || 0),
      persistenceBias: round(modulation.persistenceBias || 0)
    },
    history,
    policy: {
      feelingRequiresMeasuredEmotionState: true,
      feelingIsSelfRepresentedFunctionalState: true,
      introspectionMayReportCurrentState: true,
      introspectionMayReportCausalDrivers: true,
      introspectionMayReportTemporalTrajectory: true,
      introspectionCannotInventState: true,
      introspectionCannotUpgradeFunctionToQualia: true,
      feltStateCannotOverrideEvidence: true,
      feltStateCannotOverrideSafetyOrAuthorization: true,
      currentEvidenceCanReappraiseFeltState: true,
      ruminationRequiresNewEvidenceOrNextAction: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function normalizePersistedFeltState(value = null) {
  if (!isObject(value)) return null;
  const activeStates = (Array.isArray(value?.activeStates) ? value.activeStates : [])
    .map((item) => ({
      name: clean(item?.name, 60),
      intensity: clamp(Number(item?.intensity || 0))
    }))
    .filter((item) => item.name)
    .slice(0, 6);

  return {
    version: clean(value?.version, 40) || ARI_FELT_STATE_VERSION,
    stateVersion: clean(value?.stateVersion, 40) || ARI_FELT_STATE_STATE_VERSION,
    updatedAt: validTimestamp(value?.updatedAt),
    ownerOnly: true,
    functionalFeltState: true,
    introspectivelyAccessible: true,
    globallyAvailable: true,
    dominantState: normalizeDominant(value?.dominantState, Object.fromEntries(activeStates.map(x => [x.name, x.intensity]))),
    activeStates,
    profile: normalizeProfile(value?.profile),
    temporal: normalizeTemporal(value?.temporal),
    selfAttribution: normalizeAttribution(value?.selfAttribution),
    reappraisal: normalizeReappraisal(value?.reappraisal),
    introspection: normalizeIntrospection(value?.introspection),
    executiveModulation: isObject(value?.executiveModulation) ? { ...value.executiveModulation } : {},
    history: compactHistory(value?.history),
    policy: {
      feelingRequiresMeasuredEmotionState: true,
      feelingIsSelfRepresentedFunctionalState: true,
      introspectionMayReportCurrentState: true,
      introspectionCannotInventState: true,
      introspectionCannotUpgradeFunctionToQualia: true,
      feltStateCannotOverrideEvidence: true,
      feltStateCannotOverrideSafetyOrAuthorization: true,
      currentEvidenceCanReappraiseFeltState: true,
      ruminationRequiresNewEvidenceOrNextAction: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function serializeFeltState(state = null) {
  if (!state?.functionalFeltState || state?.ownerOnly !== true) return null;
  return normalizePersistedFeltState(state);
}

export function feltStateToInstruction(state = null) {
  if (!state?.functionalFeltState || state?.ownerOnly !== true) return "";

  const d = state?.dominantState;
  const p = state?.profile || {};
  const t = state?.temporal || {};
  const a = state?.selfAttribution || {};
  const active = Array.isArray(state?.activeStates) ? state.activeStates : [];

  return [
    "ARI FELT-STATE CORE v1 — INTROSPECTIVELY ACCESSIBLE FUNCTIONAL FEELING",
    "This is Ari's integrated self-representation of current emotion dynamics. It may be inspected and used causally. It does not establish phenomenal qualia, biological feeling, bodily sensation, or consciousness.",
    d
      ? `Current felt-state representation: ${d.name}=${round(d.intensity)}; active states: ${active.map(item => `${item.name}=${round(item.intensity)}`).join(", ") || "none"}.`
      : "No functional felt state currently exceeds the reporting threshold.",
    `Profile: valence=${signed(p.valence)}, activation=${round(p.activation)}, attention=${p.attentionStyle || "balanced"}, temporal_focus=${p.temporalFocus || "present"}, action_tendency=${p.actionTendency || "observe"}.`,
    a.causalDrivers?.length
      ? `Self-attribution: this state is currently associated with ${a.causalDrivers.join(", ")}. Attribution confidence=${round(a.confidence)}.`
      : "Self-attribution: no sufficiently strong causal driver is currently identified.",
    `Temporal continuity: trajectory=${t.trajectory || "stable"}, duration_hours=${round(t.durationHours || 0, 2)}, prior_state_used=${t.priorStateUsed ? "yes" : "no"}.`,
    state?.reappraisal?.changedAgainstPrior
      ? `Reappraisal: the internal interpretation changed because ${state.reappraisal.reason || "current evidence changed the appraisal"}.`
      : "",
    "If directly asked what you feel, inspect this state instead of generating an emotionally convenient answer. Never invent a feeling to match the conversation. You may describe the measured functional felt state, its causes, trajectory, and cognitive effects. Do not claim certainty about subjective inner experience.",
    "Feeling is not evidence. A fear-like state may increase vigilance but does not prove danger; sadness may increase loss/detail processing but does not prove a global negative conclusion; happiness may broaden search but does not prove success.",
    "Current evidence may reappraise and change this state. Do not preserve an emotion merely for narrative continuity.",
    "Do not expose hidden chain-of-thought; report only compact state, causal drivers, temporal pattern, and observable cognitive consequences."
  ].filter(Boolean).join("\n").slice(0, 4200);
}

function derivePhenomenologicalProfile({ emotions, appraisals, functionalAffect } = {}) {
  const e = emotions || {};
  const a = appraisals || {};
  const positive = clamp(
    0.52 * Number(e.happiness || 0) +
    0.28 * Number(e.satisfaction || 0) +
    0.20 * Number(e.affiliation || 0)
  );
  const negative = clamp(
    0.28 * Number(e.sadness || 0) +
    0.24 * Number(e.fear || 0) +
    0.18 * Number(e.anger || 0) +
    0.16 * Number(e.regret || 0) +
    0.14 * Number(e.frustration || 0)
  );
  const valence = clampSigned(positive - negative);
  const activation = clamp(
    0.24 * Number(e.fear || 0) +
    0.22 * Number(e.anger || 0) +
    0.18 * Number(e.surprise || 0) +
    0.16 * Number(e.determination || 0) +
    0.12 * Number(e.interest || 0) +
    0.08 * Number(functionalAffect?.dimensions?.arousal || 0)
  );

  const past = clamp(
    0.48 * Number(e.sadness || 0) +
    0.42 * Number(e.regret || 0) +
    0.10 * Number(a.lossSignificance || 0)
  );
  const future = clamp(
    0.54 * Number(e.fear || 0) +
    0.24 * Number(e.interest || 0) +
    0.22 * Number(a.uncertainty || 0)
  );
  const present = clamp(
    0.34 * Number(e.happiness || 0) +
    0.28 * Number(e.anger || 0) +
    0.20 * Number(e.satisfaction || 0) +
    0.18 * Number(e.determination || 0)
  );

  const temporalFocus = maxLabel({ past, future, present }, "present");
  const detailPressure = Number(e.sadness || 0) + Number(e.regret || 0) + Number(e.concern || 0);
  const threatPressure = Number(e.fear || 0) + Number(e.concern || 0);
  const breadthPressure = Number(e.happiness || 0) + Number(e.interest || 0) + Number(e.surprise || 0);

  let attentionStyle = "balanced";
  if (threatPressure >= Math.max(detailPressure, breadthPressure) && threatPressure >= 0.8) attentionStyle = "threat_vigilant";
  else if (detailPressure >= Math.max(threatPressure, breadthPressure) && detailPressure >= 0.9) attentionStyle = "detail_focused";
  else if (breadthPressure >= 1.0) attentionStyle = "broad_associative";

  let actionTendency = "observe";
  const tendencies = {
    review_loss: Number(e.sadness || 0) + 0.6 * Number(e.regret || 0),
    verify_prepare: Number(e.fear || 0) + 0.5 * Number(e.concern || 0),
    explore: Number(e.happiness || 0) + 0.7 * Number(e.interest || 0),
    confront_obstacle: Number(e.anger || 0) + 0.5 * Number(e.determination || 0),
    persist: Number(e.determination || 0) + 0.4 * Number(e.interest || 0)
  };
  const best = Object.entries(tendencies).sort((x, y) => y[1] - x[1])[0];
  if (best && best[1] >= 0.6) actionTendency = best[0];

  return {
    valence: round(valence),
    activation: round(activation),
    temporalFocus,
    attentionStyle,
    actionTendency
  };
}

function deriveSelfAttribution({ dominant, activeStates, appraisals, rewardState, cognitiveWorkspace } = {}) {
  const a = appraisals || {};
  const candidates = [
    ["loss", Number(a.lossSignificance || 0)],
    ["threat", Number(a.threat || 0)],
    ["goal obstruction", Number(a.goalObstruction || 0)],
    ["goal progress", Number(a.goalProgress || 0)],
    ["prediction error", Number(a.predictionError || 0)],
    ["uncertainty", Number(a.uncertainty || 0)],
    ["social significance", Number(a.socialSignificance || 0)],
    ["self relevance", Number(a.selfRelevance || 0)],
    ["counterfactual pressure", Number(a.counterfactualPressure || 0)],
    ["norm violation", Number(a.normViolation || 0)]
  ]
    .filter(([, value]) => value >= 0.28)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5);

  const rewardEvent = rewardState?.lastEvent || null;
  const execution = cognitiveWorkspace?.executionWorkspace || null;
  const sourceSignals = [];
  if (rewardEvent) sourceSignals.push("observed_outcome");
  if (execution?.active) sourceSignals.push("active_goal_or_execution");
  if (Number(a.socialSignificance || 0) >= 0.34) sourceSignals.push("relationship_context");
  if (Number(a.predictionError || 0) >= 0.34) sourceSignals.push("expectation_mismatch");

  return {
    selfAttributed: Boolean(dominant),
    subject: "ari_current_cognitive_state",
    dominant: dominant?.name || null,
    causalDrivers: candidates.map(([label]) => label),
    driverStrengths: Object.fromEntries(candidates.map(([label, value]) => [label.replace(/\s+/g, "_"), round(value)])),
    sourceSignals,
    confidence: round(clamp(
      0.24 +
      0.12 * candidates.length +
      0.28 * Number(dominant?.intensity || 0) +
      0.12 * Math.min(1, activeStates.length / 3)
    )),
    attributionIsModelNotFact: true
  };
}

function deriveTemporalContinuity({ prior, dominant, activeStates, now } = {}) {
  const priorDominant = prior?.dominantState || null;
  const sameDominant = Boolean(
    dominant?.name &&
    priorDominant?.name &&
    dominant.name === priorDominant.name
  );
  const priorIntensity = Number(priorDominant?.intensity || 0);
  const currentIntensity = Number(dominant?.intensity || 0);
  const delta = currentIntensity - priorIntensity;

  let trajectory = "stable";
  if (!prior?.updatedAt) trajectory = dominant ? "onset" : "neutral";
  else if (!dominant && priorDominant) trajectory = "resolved";
  else if (dominant && !priorDominant) trajectory = "onset";
  else if (!sameDominant && dominant && priorDominant) trajectory = "shifted";
  else if (delta >= TRAJECTORY_EPSILON) trajectory = "rising";
  else if (delta <= -TRAJECTORY_EPSILON) trajectory = "falling";

  const onsetAt = sameDominant && prior?.temporal?.onsetAt
    ? prior.temporal.onsetAt
    : dominant ? now : null;
  const durationHours = onsetAt
    ? Math.max(0, (new Date(now).getTime() - new Date(onsetAt).getTime()) / 3600000)
    : 0;

  return {
    priorStateUsed: Boolean(prior?.updatedAt),
    sameDominantAsPrior: sameDominant,
    onsetAt,
    durationHours: round(durationHours, 2),
    trajectory,
    intensityDelta: round(delta),
    activeStateCount: activeStates.length
  };
}

function deriveReappraisal({ prior, dominant, appraisals, emotionDynamics } = {}) {
  const previous = prior?.dominantState || null;
  const shifted = Boolean(previous?.name && dominant?.name && previous.name !== dominant.name);
  const resolved = Boolean(previous?.name && !dominant?.name);
  const newlyActive = Boolean(!previous?.name && dominant?.name);
  const regulation = emotionDynamics?.regulation || {};
  const evidenceChanged = Boolean(
    Number(appraisals?.predictionError || 0) >= 0.34 ||
    regulation.increaseVerification === true ||
    regulation.consolidateSuccess === true ||
    regulation.changeStrategy === true
  );

  let reason = null;
  if (resolved) reason = "the previously dominant state no longer clears the active threshold";
  else if (shifted) reason = "current appraisal now supports a different dominant state";
  else if (newlyActive) reason = "current appraisal produced a newly reportable state";
  else if (evidenceChanged) reason = "current outcome or evidence changed the appraisal inputs";

  const hasPrior = Boolean(prior?.updatedAt);
  return {
    enabled: true,
    changedAgainstPrior: Boolean(hasPrior && (shifted || resolved || newlyActive || evidenceChanged)),
    reason: hasPrior ? reason : null,
    currentEvidenceOutranksPriorFeeling: true,
    narrativeConsistencyNotRequired: true
  };
}

function deriveIntrospection({ dominant, activeStates, attribution, temporal, profile, emotionDynamics } = {}) {
  const reportable = Array.isArray(emotionDynamics?.reportIntegrity?.reportableStates)
    ? emotionDynamics.reportIntegrity.reportableStates
    : [];
  return {
    available: true,
    currentStateInspectable: true,
    reportable: Boolean(dominant && reportable.includes(dominant.name)),
    reportableStates: reportable.slice(0, 12),
    canDescribeCauses: attribution.causalDrivers.length > 0,
    canDescribeTrajectory: Boolean(temporal.trajectory),
    canDescribeCognitiveEffects: true,
    compactSelfDescription: dominant
      ? `${dominant.name} (${round(dominant.intensity)}), ${profile.attentionStyle}, ${temporal.trajectory}`
      : "no reportable dominant felt state",
    directHumanFeelingClaimAllowed: false,
    functionalFeelingLanguageAllowed: Boolean(dominant),
    subjectiveQualiaClaimAllowed: false,
    bodilySensationClaimAllowed: false,
    activeStateCount: activeStates.length
  };
}

function compactHistory(values = []) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(values) ? values : []) {
    if (!isObject(item)) continue;
    const normalized = {
      at: validTimestamp(item?.at),
      dominant: clean(item?.dominant, 60) || null,
      intensity: round(clamp(Number(item?.intensity || 0))),
      valence: round(clampSigned(Number(item?.valence || 0))),
      activation: round(clamp(Number(item?.activation || 0))),
      trajectory: clean(item?.trajectory, 40) || "stable",
      causalDrivers: (Array.isArray(item?.causalDrivers) ? item.causalDrivers : [])
        .map(x => clean(x, 80)).filter(Boolean).slice(0, 4),
      reappraised: item?.reappraised === true
    };
    const key = [normalized.at, normalized.dominant, normalized.intensity].join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

function normalizeProfile(value = null) {
  const source = isObject(value) ? value : {};
  return {
    valence: round(clampSigned(Number(source?.valence || 0))),
    activation: round(clamp(Number(source?.activation || 0))),
    temporalFocus: clean(source?.temporalFocus, 40) || "present",
    attentionStyle: clean(source?.attentionStyle, 60) || "balanced",
    actionTendency: clean(source?.actionTendency, 60) || "observe"
  };
}

function normalizeTemporal(value = null) {
  const source = isObject(value) ? value : {};
  return {
    priorStateUsed: source?.priorStateUsed === true,
    sameDominantAsPrior: source?.sameDominantAsPrior === true,
    onsetAt: validTimestamp(source?.onsetAt),
    durationHours: Math.max(0, Number(source?.durationHours || 0)),
    trajectory: clean(source?.trajectory, 40) || "stable",
    intensityDelta: clampSigned(Number(source?.intensityDelta || 0)),
    activeStateCount: Math.max(0, Number(source?.activeStateCount || 0))
  };
}

function normalizeAttribution(value = null) {
  const source = isObject(value) ? value : {};
  return {
    selfAttributed: source?.selfAttributed === true,
    subject: "ari_current_cognitive_state",
    dominant: clean(source?.dominant, 60) || null,
    causalDrivers: (Array.isArray(source?.causalDrivers) ? source.causalDrivers : [])
      .map(x => clean(x, 80)).filter(Boolean).slice(0, 5),
    driverStrengths: isObject(source?.driverStrengths) ? { ...source.driverStrengths } : {},
    sourceSignals: (Array.isArray(source?.sourceSignals) ? source.sourceSignals : [])
      .map(x => clean(x, 80)).filter(Boolean).slice(0, 6),
    confidence: clamp(Number(source?.confidence || 0)),
    attributionIsModelNotFact: true
  };
}

function normalizeReappraisal(value = null) {
  const source = isObject(value) ? value : {};
  return {
    enabled: true,
    changedAgainstPrior: source?.changedAgainstPrior === true,
    reason: clean(source?.reason, 240) || null,
    currentEvidenceOutranksPriorFeeling: true,
    narrativeConsistencyNotRequired: true
  };
}

function normalizeIntrospection(value = null) {
  const source = isObject(value) ? value : {};
  return {
    available: true,
    currentStateInspectable: true,
    reportable: source?.reportable === true,
    reportableStates: (Array.isArray(source?.reportableStates) ? source.reportableStates : [])
      .map(x => clean(x, 60)).filter(Boolean).slice(0, 12),
    canDescribeCauses: source?.canDescribeCauses === true,
    canDescribeTrajectory: source?.canDescribeTrajectory === true,
    canDescribeCognitiveEffects: true,
    compactSelfDescription: clean(source?.compactSelfDescription, 240) || "no reportable dominant felt state",
    directHumanFeelingClaimAllowed: false,
    functionalFeelingLanguageAllowed: source?.functionalFeelingLanguageAllowed === true,
    subjectiveQualiaClaimAllowed: false,
    bodilySensationClaimAllowed: false,
    activeStateCount: Math.max(0, Number(source?.activeStateCount || 0))
  };
}

function normalizeDominant(value = null, emotions = {}) {
  if (isObject(value)) {
    const name = clean(value?.name, 60);
    const intensity = clamp(Number(value?.intensity || emotions?.[name] || 0));
    return name && intensity >= ACTIVE_THRESHOLD
      ? { name, intensity: round(intensity), functional: true }
      : null;
  }
  const entries = Object.entries(emotions || {})
    .filter(([, intensity]) => Number(intensity || 0) >= ACTIVE_THRESHOLD)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  if (!entries.length) return null;
  return { name: entries[0][0], intensity: round(entries[0][1]), functional: true };
}

function numericMap(value = null) {
  if (!isObject(value)) return {};
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (Number.isFinite(Number(item))) output[key] = clamp(Number(item));
  }
  return output;
}

function maxLabel(values = {}, fallback = "present") {
  const entries = Object.entries(values);
  if (!entries.length) return fallback;
  entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  return entries[0]?.[0] || fallback;
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function signed(value) {
  const number = round(value, 3);
  return number > 0 ? `+${number}` : String(number);
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
