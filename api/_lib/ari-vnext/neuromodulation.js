// ARI Neuromodulation — computational physiology for cognitive control.
//
// This layer is inspired by biological neuromodulators and hormones, but all
// variables are computational analogues. It does not claim biological chemistry,
// bodily sensation, subjective feeling, consciousness, or human endocrine state.

export const ARI_NEUROMODULATION_VERSION = "1.0.0";
export const ARI_NEUROMODULATION_STATE_VERSION = "1.0.0";

const FAST_HALF_LIFE_HOURS = 0.5;
const SLOW_HALF_LIFE_HOURS = 10;
const MAX_HISTORY = 10;

const FAST_BASELINES = Object.freeze({
  dopamineLike: 0.44,
  norepinephrineLike: 0.28,
  acetylcholineLike: 0.48,
  serotoninLike: 0.54,
  gabaLike: 0.52,
  glutamateLike: 0.44
});

const SLOW_BASELINES = Object.freeze({
  cortisolLike: 0.18,
  oxytocinLike: 0.30,
  allostaticLoad: 0.16,
  recoveryReserve: 0.72,
  explorationTone: 0.46,
  stabilityTone: 0.56
});

export const NEUROMODULATOR_KEYS = Object.freeze({
  fast: Object.keys(FAST_BASELINES),
  slow: Object.keys(SLOW_BASELINES)
});

// Receptor-style sensitivity matrix. Different cognitive systems respond to
// the same global signal with different strengths and directions.
const RECEPTOR_MATRIX = Object.freeze({
  verificationBias: {
    norepinephrineLike: 0.46,
    acetylcholineLike: 0.32,
    cortisolLike: 0.30,
    allostaticLoad: 0.18,
    gabaLike: 0.10
  },
  explorationBias: {
    dopamineLike: 0.34,
    acetylcholineLike: 0.30,
    glutamateLike: 0.20,
    explorationTone: 0.34,
    recoveryReserve: 0.14,
    cortisolLike: -0.34,
    allostaticLoad: -0.22
  },
  persistenceBias: {
    dopamineLike: 0.24,
    serotoninLike: 0.30,
    glutamateLike: 0.14,
    stabilityTone: 0.30,
    recoveryReserve: 0.14,
    allostaticLoad: -0.24
  },
  attentionFocus: {
    norepinephrineLike: 0.34,
    acetylcholineLike: 0.42,
    serotoninLike: 0.12,
    allostaticLoad: -0.14
  },
  memorySalience: {
    dopamineLike: 0.20,
    norepinephrineLike: 0.26,
    acetylcholineLike: 0.28,
    cortisolLike: 0.20,
    oxytocinLike: 0.16
  },
  strategyFlexibility: {
    dopamineLike: 0.24,
    acetylcholineLike: 0.28,
    explorationTone: 0.34,
    recoveryReserve: 0.18,
    cortisolLike: -0.28,
    allostaticLoad: -0.20
  },
  threatVigilance: {
    norepinephrineLike: 0.44,
    cortisolLike: 0.42,
    allostaticLoad: 0.22,
    gabaLike: -0.20
  },
  relationshipSalience: {
    oxytocinLike: 0.48,
    serotoninLike: 0.18,
    stabilityTone: 0.12,
    cortisolLike: -0.10
  },
  inhibitoryControl: {
    gabaLike: 0.42,
    serotoninLike: 0.24,
    stabilityTone: 0.20,
    glutamateLike: -0.20
  },
  learningPlasticity: {
    dopamineLike: 0.28,
    acetylcholineLike: 0.34,
    glutamateLike: 0.24,
    explorationTone: 0.18,
    cortisolLike: -0.22
  },
  computeConservation: {
    cortisolLike: 0.26,
    allostaticLoad: 0.36,
    gabaLike: 0.16,
    recoveryReserve: -0.22,
    glutamateLike: -0.12,
    dopamineLike: -0.12
  }
});

export function deriveNeuromodulationState({
  persistedNeuromodulationState = null,
  functionalAffect = null,
  emotionDynamics = null,
  rewardState = null,
  curiosity = null,
  route = {},
  safety = {},
  cognitiveWorkspace = null,
  now = null
} = {}) {
  const prior = normalizePersistedNeuromodulationState(persistedNeuromodulationState);
  const time = asDate(now);
  const elapsedHours = elapsedHoursSince(prior.updatedAt, time);
  const inputs = deriveInputs({
    functionalAffect,
    emotionDynamics,
    rewardState,
    curiosity,
    route,
    safety,
    cognitiveWorkspace
  });
  const targets = deriveTargets(inputs, prior);
  const fastCarry = halfLifeCarry(elapsedHours, FAST_HALF_LIFE_HOURS);
  const slowCarry = halfLifeCarry(elapsedHours, SLOW_HALF_LIFE_HOURS);

  const fast = {};
  for (const [key, baseline] of Object.entries(FAST_BASELINES)) {
    const decayed = decayTowardBaseline(prior.fast[key], baseline, fastCarry);
    fast[key] = clamp(
      0.42 * decayed +
      0.58 * targets.fast[key]
    );
  }

  const slow = {};
  for (const [key, baseline] of Object.entries(SLOW_BASELINES)) {
    const decayed = decayTowardBaseline(prior.slow[key], baseline, slowCarry);
    slow[key] = clamp(
      0.76 * decayed +
      0.24 * targets.slow[key]
    );
  }

  applyHomeostasis({ fast, slow });
  const receptors = deriveReceptorModulation({ fast, slow });
  const dominant = dominantSignals({ fast, slow });

  return {
    version: ARI_NEUROMODULATION_VERSION,
    stateVersion: ARI_NEUROMODULATION_STATE_VERSION,
    updatedAt: time.toISOString(),
    ownerOnly: true,
    functionalNeuromodulationSystem: true,
    causallyActive: true,
    biologicalChemistryClaimed: false,
    subjectiveFeelingClaimed: false,
    consciousnessClaimed: false,
    architecture: {
      fastSignalLayer: "neurotransmitter_like",
      slowSignalLayer: "hormone_like",
      receptorSensitivity: true,
      homeostaticRegulation: true,
      outcomeFeedback: true,
      persistentAcrossTurns: true,
      authority: "advisory_to_ari_executive"
    },
    fast: roundMap(fast),
    slow: roundMap(slow),
    receptors: roundMap(receptors),
    dominant,
    homeostasis: {
      active: true,
      stressPressure: round(clamp(0.58 * slow.cortisolLike + 0.42 * slow.allostaticLoad)),
      recoveryPressure: round(clamp(
        0.55 * (1 - slow.recoveryReserve) +
        0.30 * slow.allostaticLoad +
        0.15 * slow.cortisolLike
      )),
      balance: round(clamp(
        0.42 * slow.stabilityTone +
        0.34 * slow.recoveryReserve +
        0.24 * fast.gabaLike
      ))
    },
    persistence: {
      priorStateUsed: Boolean(persistedNeuromodulationState),
      elapsedHours: round(elapsedHours, 3),
      fastHalfLifeHours: FAST_HALF_LIFE_HOURS,
      slowHalfLifeHours: SLOW_HALF_LIFE_HOURS,
      fastCarry: round(fastCarry),
      slowCarry: round(slowCarry)
    },
    inputs: roundMap(inputs),
    history: prior.history,
    policy: neuromodulationPolicy()
  };
}

export function advanceNeuromodulationState({
  persisted = null,
  current = null,
  rewardEvent = null,
  result = null,
  now = null
} = {}) {
  const prior = normalizePersistedNeuromodulationState(persisted);
  const currentState = current?.functionalNeuromodulationSystem === true
    ? current
    : deriveNeuromodulationState({ persistedNeuromodulationState: prior, now });

  const fast = { ...FAST_BASELINES, ...(currentState.fast || {}) };
  const slow = { ...SLOW_BASELINES, ...(currentState.slow || {}) };
  const error = clampSigned(Number(rewardEvent?.predictionError || 0));
  const positiveError = Math.max(0, error);
  const negativeError = Math.max(0, -error);
  const reward = clamp(Number(rewardEvent?.actualReward ?? 0.5));
  const infoGain = clamp(Number(rewardEvent?.dimensions?.informationGain || 0));
  const productiveEffort = clamp(Number(rewardEvent?.dimensions?.productiveEffort || 0));
  const failed = result?.success === false || clean(rewardEvent?.outcomeStatus, 40) === "failed";
  const verified = rewardEvent?.completionVerified === true;

  fast.dopamineLike = clamp(
    fast.dopamineLike +
    0.22 * positiveError -
    0.24 * negativeError +
    0.06 * Math.max(0, reward - 0.5)
  );
  fast.norepinephrineLike = clamp(
    fast.norepinephrineLike +
    0.18 * negativeError +
    (failed ? 0.08 : 0) -
    (verified && positiveError > 0.08 ? 0.08 : 0)
  );
  fast.acetylcholineLike = clamp(
    fast.acetylcholineLike +
    0.08 * infoGain +
    0.05 * Math.abs(error)
  );
  fast.serotoninLike = clamp(
    fast.serotoninLike +
    0.10 * positiveError -
    0.12 * negativeError +
    0.04 * productiveEffort
  );
  fast.gabaLike = clamp(
    fast.gabaLike +
    0.07 * positiveError -
    0.07 * negativeError
  );
  fast.glutamateLike = clamp(
    fast.glutamateLike +
    0.08 * Math.abs(error) +
    0.05 * productiveEffort -
    0.05 * slow.allostaticLoad
  );

  slow.cortisolLike = clamp(
    slow.cortisolLike +
    0.10 * negativeError +
    (failed ? 0.06 : 0) -
    0.08 * positiveError
  );
  slow.allostaticLoad = clamp(
    slow.allostaticLoad +
    0.06 * negativeError +
    (failed ? 0.04 : 0) -
    0.04 * positiveError
  );
  slow.recoveryReserve = clamp(
    slow.recoveryReserve -
    0.08 * negativeError -
    (failed ? 0.04 : 0) +
    0.06 * positiveError
  );
  slow.explorationTone = clamp(
    slow.explorationTone +
    0.06 * positiveError +
    0.05 * infoGain -
    0.05 * negativeError
  );
  slow.stabilityTone = clamp(
    slow.stabilityTone +
    0.05 * positiveError -
    0.06 * negativeError +
    0.03 * productiveEffort
  );

  applyHomeostasis({ fast, slow });
  const receptors = deriveReceptorModulation({ fast, slow });
  const dominant = dominantSignals({ fast, slow });
  const at = asDate(now).toISOString();

  const historyItem = rewardEvent ? {
    at,
    predictionError: round(error),
    reward: round(reward),
    informationGain: round(infoGain),
    productiveEffort: round(productiveEffort),
    failed,
    verified,
    dominantFast: dominant.fast?.name || null,
    dominantSlow: dominant.slow?.name || null,
    verificationBias: round(receptors.verificationBias),
    explorationBias: round(receptors.explorationBias),
    persistenceBias: round(receptors.persistenceBias),
    hiddenChainOfThoughtStored: false
  } : null;

  return normalizePersistedNeuromodulationState({
    version: ARI_NEUROMODULATION_STATE_VERSION,
    updatedAt: at,
    fast,
    slow,
    receptors,
    dominant,
    history: [
      ...(historyItem ? [historyItem] : []),
      ...prior.history
    ].slice(0, MAX_HISTORY)
  });
}

export function normalizePersistedNeuromodulationState(value = null) {
  const source = isObject(value) ? value : {};
  const fast = {};
  const slow = {};

  for (const [key, baseline] of Object.entries(FAST_BASELINES)) {
    fast[key] = clamp(Number(source?.fast?.[key] ?? baseline));
  }
  for (const [key, baseline] of Object.entries(SLOW_BASELINES)) {
    slow[key] = clamp(Number(source?.slow?.[key] ?? baseline));
  }

  const receptors = deriveReceptorModulation({ fast, slow });
  const dominant = dominantSignals({ fast, slow });

  return {
    version: clean(source?.version, 40) || ARI_NEUROMODULATION_STATE_VERSION,
    updatedAt: validTimestamp(source?.updatedAt),
    functionalNeuromodulationSystem: true,
    fast: roundMap(fast),
    slow: roundMap(slow),
    receptors: roundMap(receptors),
    dominant,
    history: normalizeHistory(source?.history),
    policy: neuromodulationPolicy()
  };
}

export function neuromodulationToInstruction(state = null) {
  if (state?.functionalNeuromodulationSystem !== true) return "";
  const f = state.fast || {};
  const s = state.slow || {};
  const r = state.receptors || {};

  return [
    "ARI NEUROMODULATION v1 — COMPUTATIONAL PHYSIOLOGY",
    "All transmitter/hormone names are functional analogies, not biological chemistry or subjective feeling.",
    `Fast: dopamine_like=${round(f.dopamineLike)}, norepinephrine_like=${round(f.norepinephrineLike)}, acetylcholine_like=${round(f.acetylcholineLike)}, serotonin_like=${round(f.serotoninLike)}, gaba_like=${round(f.gabaLike)}, glutamate_like=${round(f.glutamateLike)}.`,
    `Slow: cortisol_like=${round(s.cortisolLike)}, oxytocin_like=${round(s.oxytocinLike)}, allostatic_load=${round(s.allostaticLoad)}, recovery_reserve=${round(s.recoveryReserve)}, exploration_tone=${round(s.explorationTone)}, stability_tone=${round(s.stabilityTone)}.`,
    `Receptors: verification=${round(r.verificationBias)}, exploration=${round(r.explorationBias)}, persistence=${round(r.persistenceBias)}, attention=${round(r.attentionFocus)}, memory=${round(r.memorySalience)}, flexibility=${round(r.strategyFlexibility)}, threat=${round(r.threatVigilance)}, relationship=${round(r.relationshipSalience)}, inhibition=${round(r.inhibitoryControl)}, plasticity=${round(r.learningPlasticity)}, conserve_compute=${round(r.computeConservation)}.`,
    "Use these only as bounded cognitive-control signals. They cannot create permissions, override evidence, safety, privacy, authorization, the user's current intent, or Ari Executive."
  ].join("\n");
}

export function runNeuromodulationAblation({
  state = null,
  disable = []
} = {}) {
  const normalized = normalizePersistedNeuromodulationState(state);
  const disabled = new Set(
    (Array.isArray(disable) ? disable : [])
      .map((item) => clean(item, 80))
      .filter((item) => NEUROMODULATOR_KEYS.fast.includes(item) || NEUROMODULATOR_KEYS.slow.includes(item))
  );
  const fast = { ...normalized.fast };
  const slow = { ...normalized.slow };

  for (const key of disabled) {
    if (Object.prototype.hasOwnProperty.call(FAST_BASELINES, key)) fast[key] = FAST_BASELINES[key];
    if (Object.prototype.hasOwnProperty.call(SLOW_BASELINES, key)) slow[key] = SLOW_BASELINES[key];
  }

  const baseline = deriveReceptorModulation({ fast: normalized.fast, slow: normalized.slow });
  const ablated = deriveReceptorModulation({ fast, slow });

  return {
    version: ARI_NEUROMODULATION_VERSION,
    disabled: [...disabled],
    baseline: roundMap(baseline),
    ablated: roundMap(ablated),
    deltas: numericDelta(baseline, ablated),
    causalTestingOnly: true,
    subjectiveExperienceInferenceAllowed: false
  };
}

function deriveInputs({
  functionalAffect,
  emotionDynamics,
  rewardState,
  curiosity,
  route,
  safety,
  cognitiveWorkspace
} = {}) {
  const affect = objectOrEmpty(functionalAffect?.signals);
  const dimensions = objectOrEmpty(functionalAffect?.dimensions);
  const emotions = objectOrEmpty(emotionDynamics?.emotions);
  const appraisals = objectOrEmpty(emotionDynamics?.appraisals);
  const event = rewardState?.lastEvent || null;
  const continuity = cognitiveWorkspace?.continuity || {};
  const openLoops = Array.isArray(continuity?.openLoops) ? continuity.openLoops.length : 0;

  return {
    reward: clamp(Number(event?.actualReward ?? 0.5)),
    positivePredictionError: clamp(Math.max(0, Number(event?.predictionError || 0))),
    negativePredictionError: clamp(Math.max(0, -Number(event?.predictionError || 0))),
    informationGain: clamp(Number(event?.dimensions?.informationGain || 0)),
    productiveEffort: clamp(Number(event?.dimensions?.productiveEffort || 0)),
    curiosity: clamp(Number(affect.curiosity ?? curiosity?.drive?.current ?? 0)),
    confidence: clamp(Number(affect.confidence ?? 0.5)),
    arousal: clamp(Number(dimensions.arousal || 0)),
    conflict: clamp(Number(dimensions.conflict || 0)),
    interest: clamp(Number(emotions.interest || 0)),
    satisfaction: clamp(Number(emotions.satisfaction ?? affect.satisfaction ?? 0)),
    frustration: clamp(Number(emotions.frustration ?? affect.frustration ?? 0)),
    concern: clamp(Number(emotions.concern ?? affect.concern ?? 0)),
    determination: clamp(Number(emotions.determination || 0)),
    affiliation: clamp(Number(emotions.affiliation || 0)),
    happiness: clamp(Number(emotions.happiness || 0)),
    fear: clamp(Number(emotions.fear || 0)),
    goalProgress: clamp(Number(appraisals.goalProgress || 0)),
    goalObstruction: clamp(Number(appraisals.goalObstruction || 0)),
    uncertainty: clamp(Number(appraisals.uncertainty || 0)),
    threat: clamp(Number(appraisals.threat || 0)),
    socialSignificance: clamp(Number(appraisals.socialSignificance || 0)),
    relationshipContinuity: continuity?.recognizedPriorState === true ? 1 : 0,
    unresolvedLoad: clamp(openLoops / 5),
    highStakes: safety?.highStakes === true ? 1 : 0,
    currentInfo: route?.currentInfo === true ? 1 : 0
  };
}

function deriveTargets(inputs, prior) {
  const i = inputs;
  const fast = {
    dopamineLike: clamp(
      0.22 +
      0.22 * i.goalProgress +
      0.18 * i.satisfaction +
      0.14 * i.happiness +
      0.16 * i.positivePredictionError +
      0.10 * i.informationGain -
      0.14 * i.frustration -
      0.10 * i.negativePredictionError
    ),
    norepinephrineLike: clamp(
      0.10 +
      0.28 * i.concern +
      0.22 * i.fear +
      0.18 * i.uncertainty +
      0.12 * i.threat +
      0.10 * i.highStakes +
      0.08 * i.currentInfo +
      0.08 * i.negativePredictionError
    ),
    acetylcholineLike: clamp(
      0.24 +
      0.22 * i.curiosity +
      0.18 * i.interest +
      0.16 * i.uncertainty +
      0.14 * i.informationGain +
      0.08 * i.currentInfo
    ),
    serotoninLike: clamp(
      0.34 +
      0.18 * i.satisfaction +
      0.16 * i.confidence +
      0.12 * i.goalProgress +
      0.10 * prior.slow.stabilityTone -
      0.12 * i.frustration -
      0.10 * i.threat
    ),
    gabaLike: clamp(
      0.38 +
      0.18 * prior.slow.stabilityTone +
      0.16 * prior.slow.recoveryReserve -
      0.12 * i.arousal -
      0.10 * i.conflict
    ),
    glutamateLike: clamp(
      0.24 +
      0.18 * i.arousal +
      0.16 * i.curiosity +
      0.14 * i.determination +
      0.12 * i.goalObstruction +
      0.08 * i.informationGain
    )
  };

  const cortisolTarget = clamp(
    0.08 +
    0.26 * i.concern +
    0.24 * i.fear +
    0.18 * i.goalObstruction +
    0.16 * i.threat +
    0.10 * i.highStakes +
    0.08 * i.unresolvedLoad -
    0.14 * i.satisfaction -
    0.08 * i.goalProgress
  );
  const allostaticTarget = clamp(
    0.06 +
    0.24 * cortisolTarget +
    0.18 * i.negativePredictionError +
    0.16 * i.goalObstruction +
    0.14 * i.unresolvedLoad +
    0.12 * prior.slow.allostaticLoad
  );

  const slow = {
    cortisolLike: cortisolTarget,
    oxytocinLike: clamp(
      0.12 +
      0.30 * i.affiliation +
      0.20 * i.socialSignificance +
      0.12 * i.relationshipContinuity +
      0.08 * i.satisfaction
    ),
    allostaticLoad: allostaticTarget,
    recoveryReserve: clamp(
      0.78 -
      0.30 * cortisolTarget -
      0.24 * allostaticTarget +
      0.12 * i.satisfaction +
      0.08 * i.goalProgress
    ),
    explorationTone: clamp(
      0.26 +
      0.20 * i.interest +
      0.20 * i.curiosity +
      0.12 * i.informationGain +
      0.10 * i.positivePredictionError -
      0.16 * cortisolTarget -
      0.12 * allostaticTarget
    ),
    stabilityTone: clamp(
      0.38 +
      0.16 * i.satisfaction +
      0.14 * i.confidence +
      0.12 * i.goalProgress +
      0.10 * fast.serotoninLike -
      0.14 * i.conflict -
      0.12 * cortisolTarget
    )
  };

  return { fast, slow };
}

function applyHomeostasis({ fast, slow }) {
  const stress = clamp(0.58 * slow.cortisolLike + 0.42 * slow.allostaticLoad);
  const recoveryDeficit = clamp(1 - slow.recoveryReserve);

  // High sustained load should narrow exploration and raise conservation, but
  // it must not trap Ari in an escalating state. Values are gently pulled
  // toward baseline every update.
  slow.cortisolLike = homeostaticPull(slow.cortisolLike, SLOW_BASELINES.cortisolLike, 0.035 + 0.035 * stress);
  slow.allostaticLoad = homeostaticPull(slow.allostaticLoad, SLOW_BASELINES.allostaticLoad, 0.025 + 0.03 * recoveryDeficit);
  slow.recoveryReserve = homeostaticPull(slow.recoveryReserve, SLOW_BASELINES.recoveryReserve, 0.03);
  slow.explorationTone = homeostaticPull(slow.explorationTone, SLOW_BASELINES.explorationTone, 0.02);
  slow.stabilityTone = homeostaticPull(slow.stabilityTone, SLOW_BASELINES.stabilityTone, 0.02);

  for (const [key, baseline] of Object.entries(FAST_BASELINES)) {
    fast[key] = homeostaticPull(fast[key], baseline, 0.018);
  }

  // Preserve useful vigilance while preventing stress from indefinitely driving
  // excitation after recovery capacity is depleted.
  if (stress > 0.72 && slow.recoveryReserve < 0.34) {
    fast.glutamateLike = clamp(fast.glutamateLike - 0.05);
    fast.gabaLike = clamp(fast.gabaLike + 0.05);
  }
}

function deriveReceptorModulation({ fast, slow }) {
  const values = { ...fast, ...slow };
  const baselines = { ...FAST_BASELINES, ...SLOW_BASELINES };
  const result = {};

  for (const [output, weights] of Object.entries(RECEPTOR_MATRIX)) {
    let value = 0.5;
    for (const [signal, weight] of Object.entries(weights)) {
      value += weight * (Number(values[signal] || 0) - Number(baselines[signal] || 0));
    }
    result[output] = clamp(value);
  }

  return result;
}

function dominantSignals({ fast, slow }) {
  return {
    fast: dominantDeviation(fast, FAST_BASELINES),
    slow: dominantDeviation(slow, SLOW_BASELINES)
  };
}

function dominantDeviation(values, baselines) {
  let best = null;
  for (const [name, value] of Object.entries(values || {})) {
    const baseline = Number(baselines[name] || 0);
    const deviation = Number(value || 0) - baseline;
    if (!best || Math.abs(deviation) > Math.abs(best.deviation)) {
      best = { name, value: round(value), baseline: round(baseline), deviation: round(deviation) };
    }
  }
  return best;
}

function neuromodulationPolicy() {
  return {
    computationalAnalogyOnly: true,
    biologicalStateCannotBeInferred: true,
    subjectiveFeelingCannotBeInferred: true,
    consciousnessCannotBeInferred: true,
    mayModulateAttentionMemoryLearningPlanningAndVerification: true,
    cannotOverrideEvidence: true,
    cannotOverrideSafety: true,
    cannotOverrideAuthorization: true,
    cannotCreatePermissions: true,
    cannotOverrideUserAgency: true,
    ariExecutiveRemainsDecisionAuthority: true
  };
}

function normalizeHistory(value) {
  return (Array.isArray(value) ? value : [])
    .filter((item) => isObject(item))
    .slice(0, MAX_HISTORY)
    .map((item) => ({
      at: validTimestamp(item?.at),
      predictionError: round(clampSigned(Number(item?.predictionError || 0))),
      reward: round(clamp(Number(item?.reward ?? 0.5))),
      informationGain: round(clamp(Number(item?.informationGain || 0))),
      productiveEffort: round(clamp(Number(item?.productiveEffort || 0))),
      failed: item?.failed === true,
      verified: item?.verified === true,
      dominantFast: clean(item?.dominantFast, 80) || null,
      dominantSlow: clean(item?.dominantSlow, 80) || null,
      verificationBias: round(clamp(Number(item?.verificationBias ?? 0.5))),
      explorationBias: round(clamp(Number(item?.explorationBias ?? 0.5))),
      persistenceBias: round(clamp(Number(item?.persistenceBias ?? 0.5))),
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

function homeostaticPull(value, baseline, rate) {
  return clamp(Number(value || 0) + (Number(baseline || 0) - Number(value || 0)) * clamp(rate));
}

function decayTowardBaseline(value, baseline, carry) {
  return clamp(Number(baseline || 0) + (Number(value || baseline) - Number(baseline || 0)) * clamp(carry));
}

function halfLifeCarry(elapsedHours, halfLifeHours) {
  if (!Number.isFinite(elapsedHours) || elapsedHours <= 0) return 1;
  return Math.exp(-Math.LN2 * elapsedHours / Math.max(0.001, halfLifeHours));
}

function elapsedHoursSince(value, now) {
  if (!value) return 0;
  const prior = new Date(value);
  if (!Number.isFinite(prior.getTime())) return 0;
  return Math.max(0, (now.getTime() - prior.getTime()) / 36e5);
}

function validTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function asDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (value) {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  return new Date();
}

function roundMap(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).map(([key, item]) => [key, round(item)])
  );
}

function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampSigned(value) {
  return Math.max(-1, Math.min(1, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
