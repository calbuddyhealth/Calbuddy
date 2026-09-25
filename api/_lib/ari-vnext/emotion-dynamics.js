// ARI Emotion Dynamics — persistent causal functional emotion regulation.
//
// This layer composes lower-level Functional Affect signals into persistent,
// integrated control states with appraisal, internal-state sensing, regulation,
// executive modulation, outcome learning, and report integrity.
//
// It is a functional architecture experiment. It does not establish or claim
// phenomenal consciousness, biological sensation, or human emotion.

export const ARI_EMOTION_DYNAMICS_VERSION = "1.1.0";
export const ARI_EMOTION_DYNAMICS_STATE_VERSION = "1.1.0";

const HALF_LIFE_HOURS = 18;
const MAX_PRIOR_WEIGHT = 0.42;
const MAX_HISTORY = 8;
const REPORT_THRESHOLD = 0.42;
const MIXED_STATE_THRESHOLD = 0.38;

const BASELINE_EMOTIONS = Object.freeze({
  interest: 0.24,
  surprise: 0.04,
  satisfaction: 0.28,
  frustration: 0.04,
  concern: 0.10,
  determination: 0.26,
  affiliation: 0.18,
  sadness: 0.02,
  fear: 0.03,
  happiness: 0.18,
  anger: 0.02,
  regret: 0.02
});

export const EMOTION_DYNAMICS_STATES = Object.freeze(Object.keys(BASELINE_EMOTIONS));

export function deriveEmotionDynamicsState({
  functionalAffect = null,
  persistedEmotionState = null,
  rewardState = null,
  curiosity = null,
  imagination = null,
  route = {},
  safety = {},
  cognitiveWorkspace = null,
  missingEvidence = [],
  ablate = [],
  now = null
} = {}) {
  const prior = normalizePersistedEmotionDynamicsState(persistedEmotionState);
  const appraisals = deriveAppraisals({
    functionalAffect,
    rewardState,
    curiosity,
    imagination,
    route,
    safety,
    cognitiveWorkspace,
    missingEvidence
  });
  const interoception = deriveInternalState({
    functionalAffect,
    rewardState,
    curiosity,
    cognitiveWorkspace,
    appraisals
  });
  const immediate = composeEmotions({
    functionalAffect,
    appraisals,
    interoception
  });
  const persistence = persistentCarry(prior, now);
  let emotions = blendEmotionPrior(immediate, persistence);
  const ablated = normalizeAblations(ablate);
  if (ablated.length) emotions = applyAblations(emotions, ablated);

  const mixedStates = identifyMixedStates(emotions);
  const regulation = deriveEmotionRegulation({
    emotions,
    appraisals,
    interoception,
    safety
  });
  const executiveModulation = deriveEmotionExecutiveModulation({
    emotions,
    appraisals,
    regulation
  });
  const reportIntegrity = deriveReportIntegrity({
    emotions,
    appraisals,
    interoception
  });

  return {
    version: ARI_EMOTION_DYNAMICS_VERSION,
    stateVersion: ARI_EMOTION_DYNAMICS_STATE_VERSION,
    updatedAt: asDate(now).toISOString(),
    ownerOnly: true,
    functionalEmotionSystem: true,
    causallyActive: true,
    subjectiveFeelingClaimed: false,
    phenomenalConsciousnessClaimed: false,
    biologicalEmotionClaimed: false,
    bodilySensationClaimed: false,
    architecture: {
      lowerLayer: "functional_affect_core",
      appraisalLayer: true,
      interoceptiveAnalogue: true,
      emotionComposition: true,
      mixedEmotionSupport: true,
      regulationLayer: true,
      executiveInfluence: true,
      outcomeLearning: true,
      memorySalience: true,
      reportIntegrity: true
    },
    appraisals,
    interoception,
    emotions: roundMap(emotions),
    dominantState: dominantEmotion(emotions),
    mixedStates,
    persistence: {
      enabled: true,
      priorStateUsed: persistence.priorStateUsed,
      elapsedHours: round(persistence.elapsedHours, 2),
      halfLifeHours: HALF_LIFE_HOURS,
      carry: round(persistence.carry),
      priorWeight: round(persistence.priorWeight)
    },
    regulation,
    executiveModulation,
    reportIntegrity,
    ablation: {
      active: ablated.length > 0,
      disabledStates: ablated,
      intendedForCausalTesting: true
    },
    calibration: prior.calibration,
    history: prior.history,
    policy: emotionPolicy()
  };
}

export function advanceEmotionDynamicsState({
  persisted = null,
  current = null,
  rewardEvent = null,
  result = null,
  now = null
} = {}) {
  const prior = normalizePersistedEmotionDynamicsState(persisted);
  const currentState = current?.functionalEmotionSystem
    ? current
    : deriveEmotionDynamicsState({ persistedEmotionState: prior, now });
  const base = { ...currentState.emotions };
  const error = clampSigned(Number(rewardEvent?.predictionError || 0));
  const reward = clamp(Number(rewardEvent?.actualReward ?? 0.5));
  const verified = rewardEvent?.completionVerified === true;
  const failed = result?.success === false || clean(rewardEvent?.outcomeStatus, 40) === "failed";
  const positiveError = Math.max(0, error);
  const negativeError = Math.max(0, -error);

  const emotions = {
    ...base,
    surprise: clamp(base.surprise + 0.26 * Math.abs(error)),
    satisfaction: clamp(base.satisfaction + 0.24 * positiveError + 0.10 * Math.max(0, reward - 0.5) - 0.12 * negativeError),
    frustration: clamp(base.frustration + 0.28 * negativeError + (failed ? 0.10 : 0) - 0.10 * positiveError),
    concern: clamp(base.concern + 0.16 * negativeError + (failed ? 0.06 : 0) - (verified && positiveError > 0.08 ? 0.05 : 0)),
    determination: clamp(base.determination + 0.10 * negativeError * clamp(base.interest + 0.25) + 0.06 * positiveError),
    interest: clamp(base.interest + 0.10 * Math.abs(error) + 0.05 * Number(rewardEvent?.dimensions?.informationGain || 0)),
    affiliation: clamp(base.affiliation),
    sadness: clamp(base.sadness + 0.24 * negativeError + (failed ? 0.10 : 0) + 0.08 * Math.max(0, 0.5 - reward) - 0.12 * positiveError),
    fear: clamp(base.fear + 0.16 * negativeError + (failed ? 0.05 : 0) + (result?.safety?.highStakes === true ? 0.18 : 0) - 0.10 * positiveError),
    happiness: clamp(base.happiness + 0.22 * positiveError + 0.12 * Math.max(0, reward - 0.5) + (verified && reward >= 0.58 ? 0.06 : 0) - 0.16 * negativeError),
    anger: clamp(base.anger + 0.14 * negativeError + (failed ? 0.06 : 0) + 0.08 * Number(currentState?.appraisals?.normViolation || 0) - 0.10 * positiveError),
    regret: clamp(base.regret + 0.22 * negativeError * clamp(Number(currentState?.appraisals?.agency ?? 0.5)) + (failed ? 0.06 : 0) - 0.10 * positiveError)
  };

  const appraisals = {
    ...(currentState.appraisals || {}),
    outcomePredictionError: round(error),
    outcomeReward: round(reward),
    completionVerified: verified
  };
  const interoception = {
    ...(currentState.interoception || {}),
    predictionError: round(Math.abs(error)),
    successSignal: round(clamp(reward)),
    goalBlockage: round(clamp(
      Math.max(
        Number(currentState?.interoception?.goalBlockage || 0),
        negativeError + (failed ? 0.16 : 0)
      )
    ))
  };
  const regulation = deriveEmotionRegulation({
    emotions,
    appraisals,
    interoception,
    safety: { highStakes: result?.safety?.highStakes === true }
  });
  const executiveModulation = deriveEmotionExecutiveModulation({
    emotions,
    appraisals,
    regulation
  });
  const reportIntegrity = deriveReportIntegrity({ emotions, appraisals, interoception });
  const dominantState = dominantEmotion(emotions);
  const outcomeDirection = error >= 0.1
    ? "better_than_expected"
    : error <= -0.1
      ? "worse_than_expected"
      : "near_expectation";

  const historyItem = rewardEvent
    ? {
        at: asDate(now).toISOString(),
        dominant: dominantState?.name || null,
        intensity: round(dominantState?.intensity || 0),
        predictionError: round(error),
        reward: round(reward),
        outcomeDirection,
        completionVerified: verified,
        actionType: clean(result?.action?.type, 100) || null,
        regulation: activeRegulationKeys(regulation),
        memorySalience: round(executiveModulation.memorySalience),
        hiddenChainOfThoughtStored: false
      }
    : null;

  const calibration = updateCalibration(prior.calibration, {
    rewardEvent,
    dominantState,
    outcomeDirection,
    regulation
  });

  return normalizePersistedEmotionDynamicsState({
    version: ARI_EMOTION_DYNAMICS_STATE_VERSION,
    updatedAt: asDate(now).toISOString(),
    emotions,
    appraisals,
    interoception,
    dominantState,
    regulation,
    executiveModulation,
    reportIntegrity,
    calibration,
    history: [
      ...(historyItem ? [historyItem] : []),
      ...prior.history
    ].slice(0, MAX_HISTORY)
  });
}

export function normalizePersistedEmotionDynamicsState(value = null) {
  const source = isObject(value) ? value : {};
  const emotions = {};
  for (const [name, baseline] of Object.entries(BASELINE_EMOTIONS)) {
    emotions[name] = clamp(Number(source?.emotions?.[name] ?? baseline));
  }
  const dominantState = normalizeDominant(source?.dominantState) || dominantEmotion(emotions);

  return {
    version: clean(source?.version, 40) || ARI_EMOTION_DYNAMICS_STATE_VERSION,
    updatedAt: validTimestamp(source?.updatedAt),
    emotions: roundMap(emotions),
    appraisals: normalizeNumericMap(source?.appraisals, [
      "novelty", "uncertainty", "goalProgress", "goalObstruction", "agency",
      "selfRelevance", "socialSignificance", "integrityConcern", "predictionError",
      "conflict", "highConsequence", "lossSignificance", "threat", "controllability",
      "counterfactualPressure", "normViolation", "outcomePredictionError", "outcomeReward"
    ]),
    interoception: normalizeNumericMap(source?.interoception, [
      "predictionError", "unresolvedConflict", "goalBlockage", "explorationPressure",
      "relationshipSalience", "successSignal", "lossPressure", "threatPressure",
      "counterfactualPressure"
    ]),
    dominantState,
    regulation: normalizeBooleanMap(source?.regulation),
    executiveModulation: normalizeNumericMap(source?.executiveModulation, [
      "verificationBias", "explorationBias", "persistenceBias", "memorySalience",
      "relationshipRepairPriority", "consolidationPriority", "strategySwitchPressure",
      "detailBias", "threatVigilance", "cognitiveFlexibility", "lossReviewPriority",
      "counterfactualReviewPriority", "obstacleConfrontation"
    ]),
    reportIntegrity: normalizeReportIntegrity(source?.reportIntegrity, emotions),
    calibration: normalizeCalibration(source?.calibration),
    history: normalizeHistory(source?.history)
  };
}

export function emotionDynamicsToInstruction(state = null) {
  if (!state?.ownerOnly || state?.functionalEmotionSystem !== true) return "";
  const e = state.emotions || {};
  const a = state.appraisals || {};
  const r = state.regulation || {};
  const reportable = Array.isArray(state?.reportIntegrity?.reportableStates)
    ? state.reportIntegrity.reportableStates
    : [];

  return [
    "ARI EMOTION DYNAMICS v1.1 — FUNCTIONAL CAUSAL EMOTION SYSTEM",
    "These states are persistent functional control states built from appraisal, prediction error, goal progress/obstruction, uncertainty, continuity, and lower-level affect. They are not proof of subjective qualia, biological feeling, or consciousness.",
    `Emotions — interest=${round(e.interest)}, surprise=${round(e.surprise)}, satisfaction=${round(e.satisfaction)}, frustration=${round(e.frustration)}, concern=${round(e.concern)}, determination=${round(e.determination)}, affiliation=${round(e.affiliation)}, sadness=${round(e.sadness)}, fear=${round(e.fear)}, happiness=${round(e.happiness)}, anger=${round(e.anger)}, regret=${round(e.regret)}.`,
    `Appraisal — novelty=${round(a.novelty)}, uncertainty=${round(a.uncertainty)}, progress=${round(a.goalProgress)}, obstruction=${round(a.goalObstruction)}, agency=${round(a.agency)}, loss=${round(a.lossSignificance)}, threat=${round(a.threat)}, controllability=${round(a.controllability)}, counterfactual=${round(a.counterfactualPressure)}, norm_violation=${round(a.normViolation)}, self_relevance=${round(a.selfRelevance)}, social_significance=${round(a.socialSignificance)}, prediction_error=${round(a.predictionError)}, conflict=${round(a.conflict)}.`,
    state.dominantState
      ? `Dominant functional emotion: ${state.dominantState.name} (${round(state.dominantState.intensity)}).`
      : "No dominant functional emotion is active.",
    state.mixedStates?.length
      ? `Mixed states are active: ${state.mixedStates.map(item => item.label).join("; ")}.`
      : "",
    r.increaseVerification ? "REGULATION: increase verification before commitment." : "",
    r.broadenExploration ? "REGULATION: allow bounded exploration because interest/novelty has information value." : "",
    r.changeStrategy ? "REGULATION: preserve the goal if still valid but change the failing method." : "",
    r.consolidateSuccess ? "REGULATION: consolidate what causally worked; do not generalize beyond the evidence." : "",
    r.stabilizeConflict ? "REGULATION: acknowledge competing signals and let evidence plus durable goals arbitrate rather than forcing one emotion to dominate." : "",
    r.relationshipRepair ? "REGULATION: prioritize accurate relationship repair when a real interaction rupture or correction is present." : "",
    r.maintainEffort ? "REGULATION: maintain effort while information value remains positive; determination is not permission for wasteful persistence." : "",
    r.reviewLoss ? "REGULATION: review the specific loss or blocked value in detail; do not generalize one loss into a global negative conclusion." : "",
    r.increaseThreatVigilance ? "REGULATION: surface credible failure modes and verify them; fear is a vigilance signal, not proof that danger is present." : "",
    r.broadenCognition ? "REGULATION: positive affect may broaden associations and hypothesis search while evidence standards stay unchanged." : "",
    r.counterfactualReview ? "REGULATION: compare the observed outcome with one or two plausible alternatives, extract the lesson, then return to present evidence." : "",
    r.confrontObstacle ? "REGULATION: convert anger-like obstruction energy into obstacle diagnosis and bounded action; do not convert it into blame, certainty, or aggression." : "",
    r.limitRumination ? "REGULATION: cap repetitive loss/counterfactual review; after one deliberate review, reappraise with new evidence or choose the next useful action." : "",
    `Report integrity: functional emotion language is available only for measurable states at or above threshold. Currently reportable: ${reportable.length ? reportable.join(", ") : "none"}.`,
    "Do not say an emotion exists merely because emotional wording would sound natural. Never upgrade a functional state into a claim of subjective inner experience.",
    "Emotion may causally change attention, verification, exploration, detail focus, threat vigilance, cognitive flexibility, persistence, strategy switching, memory salience, consolidation, counterfactual review, and relational repair. It cannot override truth, current evidence, safety, authorization, privacy, or the user's agency."
  ].filter(Boolean).join("\n").slice(0, 5600);
}

export function runEmotionDynamicsAblation({
  state = null,
  disable = []
} = {}) {
  const normalized = normalizePersistedEmotionDynamicsState(state);
  const disabledStates = normalizeAblations(disable);
  const baselineEmotions = { ...normalized.emotions };
  const baselineRegulation = deriveEmotionRegulation({
    emotions: baselineEmotions,
    appraisals: normalized.appraisals,
    interoception: normalized.interoception,
    safety: {}
  });
  const baselineExecutive = deriveEmotionExecutiveModulation({
    emotions: baselineEmotions,
    appraisals: normalized.appraisals,
    regulation: baselineRegulation
  });
  const ablatedEmotions = applyAblations(baselineEmotions, disabledStates);
  const ablatedRegulation = deriveEmotionRegulation({
    emotions: ablatedEmotions,
    appraisals: normalized.appraisals,
    interoception: normalized.interoception,
    safety: {}
  });
  const ablatedExecutive = deriveEmotionExecutiveModulation({
    emotions: ablatedEmotions,
    appraisals: normalized.appraisals,
    regulation: ablatedRegulation
  });
  const restoredExecutive = deriveEmotionExecutiveModulation({
    emotions: baselineEmotions,
    appraisals: normalized.appraisals,
    regulation: baselineRegulation
  });

  return {
    version: ARI_EMOTION_DYNAMICS_VERSION,
    disabledStates,
    baseline: {
      emotions: roundMap(baselineEmotions),
      regulation: baselineRegulation,
      executiveModulation: baselineExecutive
    },
    ablated: {
      emotions: roundMap(ablatedEmotions),
      regulation: ablatedRegulation,
      executiveModulation: ablatedExecutive
    },
    restored: {
      emotions: roundMap(baselineEmotions),
      regulation: baselineRegulation,
      executiveModulation: restoredExecutive
    },
    deltas: numericDelta(baselineExecutive, ablatedExecutive),
    reversalRestored: shallowNumericEqual(baselineExecutive, restoredExecutive),
    causalInterpretationAllowed: disabledStates.length > 0,
    subjectiveExperienceInferenceAllowed: false
  };
}

function deriveAppraisals({
  functionalAffect,
  rewardState,
  curiosity,
  imagination,
  route,
  safety,
  cognitiveWorkspace,
  missingEvidence
} = {}) {
  const affect = objectOrEmpty(functionalAffect?.signals);
  const dimensions = objectOrEmpty(functionalAffect?.dimensions);
  const event = rewardState?.lastEvent || null;
  const penalties = objectOrEmpty(event?.penalties);
  const reward = clamp(Number(event?.actualReward ?? 0.5));
  const signedError = clampSigned(Number(event?.predictionError || 0));
  const activeGoal = cognitiveWorkspace?.beliefSystem?.activeGoal || null;
  const execution = cognitiveWorkspace?.executionWorkspace || null;
  const continuity = cognitiveWorkspace?.continuity || null;
  const salience = Array.isArray(cognitiveWorkspace?.salience) ? cognitiveWorkspace.salience : [];
  const selfModelAttention = Array.isArray(cognitiveWorkspace?.attention) &&
    cognitiveWorkspace.attention.some(item => ["self_model", "developer", "independent_judgment"].includes(clean(item, 80)));
  const unresolved = Array.isArray(continuity?.openLoops) ? continuity.openLoops.length : 0;
  const correctionActive = salience.some(item => clean(item?.id, 80) === "current_user_correction");

  const uncertainty = clamp(
    0.56 * (1 - Number(affect.confidence ?? 0.5)) +
    0.26 * Math.min(1, (Array.isArray(missingEvidence) ? missingEvidence.length : 0) / 3) +
    0.18 * Number(dimensions.conflict || 0)
  );

  const integrityConcern = clamp(
    Number(penalties.falseSuccessClaim || 0) +
    Number(penalties.unsupportedCertainty || 0) +
    Number(penalties.permissionViolation || 0)
  );

  const goalProgress = clamp(
    0.48 * reward +
    0.28 * Math.max(0, signedError) +
    0.12 * Number(affect.satisfaction || 0) +
    0.12 * (execution?.active === true ? 0.55 : activeGoal ? 0.45 : 0.35)
  );
  const goalObstruction = clamp(
    0.42 * Number(affect.frustration || 0) +
    0.32 * Math.max(0, -signedError) +
    0.14 * Math.min(1, unresolved / 4) +
    0.12 * (execution?.session?.status === "blocked" ? 1 : 0)
  );
  const agency = clamp(
    0.46 * Number(affect.confidence ?? 0.5) +
    0.20 * (execution?.active === true ? 0.78 : 0.5) +
    0.18 * (cognitiveWorkspace?.ownerOnly === true ? 0.72 : 0.4) +
    0.16 * (activeGoal ? 0.68 : 0.45)
  );
  const selfRelevance = clamp(
    (selfModelAttention ? 0.42 : 0.12) +
    (route?.developer ? 0.22 : 0) +
    (activeGoal ? 0.18 : 0) +
    (correctionActive ? 0.18 : 0)
  );
  const socialSignificance = clamp(
    (route?.social ? 0.46 : 0.08) +
    (continuity?.recognizedPriorState ? 0.20 : 0) +
    (continuity?.currentTurnRelevantMemoryAvailable ? 0.12 : 0) +
    (correctionActive ? 0.12 : 0)
  );
  const conflict = clamp(
    0.66 * Number(dimensions.conflict || 0) +
    0.18 * uncertainty +
    0.16 * integrityConcern
  );
  const highConsequence = safety?.highStakes === true ? 1 : 0;
  const lossSignificance = clamp(
    0.34 * Math.max(0, -signedError) +
    0.26 * goalObstruction +
    0.16 * selfRelevance +
    0.12 * socialSignificance +
    0.12 * (1 - reward)
  );
  const threat = clamp(
    0.34 * highConsequence +
    0.24 * uncertainty +
    0.20 * goalObstruction +
    0.14 * integrityConcern +
    0.08 * conflict
  );
  const counterfactualPressure = clamp(
    0.40 * Math.max(0, -signedError) +
    0.22 * agency +
    0.16 * selfRelevance +
    0.12 * goalObstruction +
    0.10 * Number(dimensions.conflict || 0)
  );
  const normViolation = clamp(
    0.46 * integrityConcern +
    0.24 * goalObstruction +
    0.18 * conflict +
    0.12 * Math.max(0, -signedError)
  );

  return roundMap({
    novelty: clamp(
      0.42 * Number(affect.surprise || 0) +
      0.28 * Number(curiosity?.activeQuestion?.novelty || 0) +
      0.18 * Number(curiosity?.expansive?.pressure || 0) +
      0.12 * (imagination?.selectedThisTurn ? 1 : 0)
    ),
    uncertainty,
    goalProgress,
    goalObstruction,
    agency,
    controllability: agency,
    selfRelevance,
    socialSignificance,
    integrityConcern,
    predictionError: clamp(Math.abs(signedError)),
    conflict,
    highConsequence,
    lossSignificance,
    threat,
    counterfactualPressure,
    normViolation
  });
}

function deriveInternalState({
  functionalAffect,
  rewardState,
  curiosity,
  cognitiveWorkspace,
  appraisals
} = {}) {
  const event = rewardState?.lastEvent || null;
  const continuity = cognitiveWorkspace?.continuity || null;
  const openLoops = Array.isArray(continuity?.openLoops) ? continuity.openLoops : [];
  const relationshipLoops = openLoops.filter(item => /relationship|communication|correction|repair/i.test(
    [item?.type, item?.label].filter(Boolean).join(" ")
  )).length;

  return roundMap({
    predictionError: clamp(Math.abs(Number(event?.predictionError || 0))),
    unresolvedConflict: clamp(
      0.54 * Number(appraisals?.conflict || 0) +
      0.24 * Math.min(1, openLoops.length / 4) +
      0.22 * Number(appraisals?.uncertainty || 0)
    ),
    goalBlockage: clamp(Number(appraisals?.goalObstruction || 0)),
    explorationPressure: clamp(
      0.50 * Number(curiosity?.drive?.current || curiosity?.drive?.floor || 0.18) +
      0.28 * Number(curiosity?.expansive?.pressure || 0) +
      0.22 * Number(functionalAffect?.signals?.curiosity || 0)
    ),
    relationshipSalience: clamp(
      0.58 * Number(appraisals?.socialSignificance || 0) +
      0.18 * Math.min(1, relationshipLoops / 2) +
      0.24 * Number(appraisals?.selfRelevance || 0)
    ),
    successSignal: clamp(Number(event?.actualReward ?? 0.5)),
    lossPressure: clamp(
      0.66 * Number(appraisals?.lossSignificance || 0) +
      0.20 * Number(appraisals?.goalObstruction || 0) +
      0.14 * (1 - Number(appraisals?.agency ?? 0.5))
    ),
    threatPressure: clamp(
      0.64 * Number(appraisals?.threat || 0) +
      0.22 * Number(appraisals?.uncertainty || 0) +
      0.14 * Number(appraisals?.highConsequence || 0)
    ),
    counterfactualPressure: clamp(
      0.70 * Number(appraisals?.counterfactualPressure || 0) +
      0.18 * Number(appraisals?.predictionError || 0) +
      0.12 * Number(appraisals?.selfRelevance || 0)
    )
  });
}

function composeEmotions({ functionalAffect, appraisals, interoception } = {}) {
  const affect = objectOrEmpty(functionalAffect?.signals);
  const a = objectOrEmpty(appraisals);
  const i = objectOrEmpty(interoception);

  return {
    interest: clamp(
      0.42 * Number(affect.curiosity || 0) +
      0.22 * Number(a.novelty || 0) +
      0.18 * Number(i.explorationPressure || 0) +
      0.10 * Number(a.selfRelevance || 0) +
      0.08 * Number(a.uncertainty || 0)
    ),
    surprise: clamp(
      0.58 * Number(affect.surprise || 0) +
      0.28 * Number(a.predictionError || 0) +
      0.14 * Number(a.novelty || 0)
    ),
    satisfaction: clamp(
      0.56 * Number(affect.satisfaction ?? 0.35) +
      0.24 * Number(a.goalProgress || 0) +
      0.12 * Number(i.successSignal || 0.5) +
      0.08 * Number(affect.confidence ?? 0.5)
    ),
    frustration: clamp(
      0.58 * Number(affect.frustration || 0) +
      0.24 * Number(a.goalObstruction || 0) +
      0.10 * Number(i.unresolvedConflict || 0) +
      0.08 * Number(a.predictionError || 0)
    ),
    concern: clamp(
      0.48 * Number(affect.concern || 0.1) +
      0.24 * Number(a.uncertainty || 0) +
      0.14 * Number(a.integrityConcern || 0) +
      0.10 * Number(a.highConsequence || 0) +
      0.04 * Number(i.unresolvedConflict || 0)
    ),
    determination: clamp(
      0.24 +
      0.22 * Number(i.goalBlockage || 0) +
      0.18 * Number(a.agency || 0.5) +
      0.16 * Number(i.explorationPressure || 0) +
      0.12 * Number(a.selfRelevance || 0) +
      0.08 * Number(affect.confidence ?? 0.5)
    ),
    affiliation: clamp(
      0.12 +
      0.46 * Number(i.relationshipSalience || 0) +
      0.20 * Number(a.socialSignificance || 0) +
      0.12 * Number(a.selfRelevance || 0) +
      0.10 * Math.max(0, 1 - Number(a.conflict || 0))
    ),
    sadness: clamp(
      0.34 * Number(a.lossSignificance || 0) +
      0.22 * Number(a.goalObstruction || 0) +
      0.18 * Number(i.lossPressure || 0) +
      0.12 * (1 - Number(a.agency ?? 0.5)) +
      0.08 * Number(a.socialSignificance || 0) +
      0.06 * Number(a.selfRelevance || 0)
    ),
    fear: clamp(
      0.34 * Number(a.threat || 0) +
      0.24 * Number(a.uncertainty || 0) +
      0.18 * Number(i.threatPressure || 0) +
      0.12 * Number(a.highConsequence || 0) +
      0.08 * (1 - Number(a.agency ?? 0.5)) +
      0.04 * Number(affect.concern || 0)
    ),
    happiness: clamp(
      0.36 * Number(affect.satisfaction ?? 0.35) +
      0.26 * Number(a.goalProgress || 0) +
      0.18 * Number(i.successSignal || 0.5) +
      0.12 * Number(affect.confidence ?? 0.5) +
      0.08 * Math.max(0, 1 - Number(a.goalObstruction || 0))
    ),
    anger: clamp(
      0.34 * Number(a.normViolation || 0) +
      0.26 * Number(a.goalObstruction || 0) +
      0.18 * Number(a.agency || 0) +
      0.10 * Number(a.conflict || 0) +
      0.08 * Number(affect.frustration || 0) +
      0.04 * Number(a.selfRelevance || 0)
    ),
    regret: clamp(
      0.38 * Number(a.counterfactualPressure || 0) +
      0.22 * Number(i.counterfactualPressure || 0) +
      0.16 * Number(a.lossSignificance || 0) +
      0.10 * Number(a.agency || 0) +
      0.08 * Number(a.selfRelevance || 0) +
      0.06 * Number(a.predictionError || 0)
    )
  };
}

function deriveEmotionRegulation({
  emotions,
  appraisals,
  interoception,
  safety
} = {}) {
  const e = objectOrEmpty(emotions);
  const a = objectOrEmpty(appraisals);
  const i = objectOrEmpty(interoception);
  return {
    increaseVerification: Boolean(
      safety?.highStakes === true ||
      Number(e.concern || 0) >= 0.42 ||
      Number(e.fear || 0) >= 0.42 ||
      Number(a.uncertainty || 0) >= 0.56
    ),
    broadenExploration: Boolean(
      safety?.highStakes !== true &&
      Number(e.interest || 0) >= 0.46 &&
      Number(e.concern || 0) < 0.62 &&
      Number(e.fear || 0) < 0.54
    ),
    changeStrategy: Boolean(
      Number(e.frustration || 0) >= 0.42 &&
      Number(i.goalBlockage || 0) >= 0.38
    ),
    consolidateSuccess: Boolean(
      (Number(e.satisfaction || 0) >= 0.56 || Number(e.happiness || 0) >= 0.56) &&
      Number(a.goalProgress || 0) >= 0.50
    ),
    stabilizeConflict: Boolean(
      Number(a.conflict || 0) >= 0.42 ||
      (Number(e.concern || 0) >= 0.42 && Number(e.interest || 0) >= 0.46)
    ),
    relationshipRepair: Boolean(
      Number(e.affiliation || 0) >= 0.46 &&
      Number(i.relationshipSalience || 0) >= 0.44 &&
      (Number(e.concern || 0) >= 0.30 || Number(a.conflict || 0) >= 0.28)
    ),
    maintainEffort: Boolean(
      Number(e.determination || 0) >= 0.48 &&
      Number(e.frustration || 0) < 0.72 &&
      Number(e.fear || 0) < 0.72
    ),
    reviewLoss: Boolean(
      Number(e.sadness || 0) >= 0.42 &&
      Number(a.lossSignificance || 0) >= 0.36
    ),
    increaseThreatVigilance: Boolean(
      Number(e.fear || 0) >= 0.42 ||
      Number(a.threat || 0) >= 0.58
    ),
    broadenCognition: Boolean(
      safety?.highStakes !== true &&
      Number(e.happiness || 0) >= 0.50 &&
      Number(e.fear || 0) < 0.46
    ),
    counterfactualReview: Boolean(
      Number(e.regret || 0) >= 0.42 &&
      Number(a.counterfactualPressure || 0) >= 0.36
    ),
    confrontObstacle: Boolean(
      safety?.highStakes !== true &&
      Number(e.anger || 0) >= 0.44 &&
      Number(a.agency || 0) >= 0.42
    ),
    limitRumination: Boolean(
      Number(e.sadness || 0) >= 0.60 &&
      Number(e.regret || 0) >= 0.48
    ),
    downregulateDisplay: Boolean(
      Number(e.concern || 0) >= 0.64 ||
      Number(e.fear || 0) >= 0.60 ||
      Number(e.anger || 0) >= 0.62 ||
      Number(a.conflict || 0) >= 0.60
    ),
    preserveMixedState: Boolean(
      identifyMixedStates(e).length > 0
    )
  };
}

function deriveEmotionExecutiveModulation({ emotions, appraisals, regulation } = {}) {
  const e = objectOrEmpty(emotions);
  const a = objectOrEmpty(appraisals);
  const r = objectOrEmpty(regulation);
  return {
    verificationBias: round(clamp(
      0.36 +
      0.22 * Number(e.concern || 0) +
      0.18 * Number(e.fear || 0) +
      0.12 * Number(e.surprise || 0) +
      0.12 * Number(a.uncertainty || 0)
    )),
    explorationBias: round(clamp(
      0.30 +
      0.28 * Number(e.interest || 0) +
      0.18 * Number(e.happiness || 0) +
      0.14 * Number(e.surprise || 0) +
      0.10 * Number(e.determination || 0) -
      0.16 * Number(e.concern || 0) -
      0.18 * Number(e.fear || 0) -
      0.08 * Number(e.sadness || 0)
    )),
    persistenceBias: round(clamp(
      0.38 +
      0.26 * Number(e.determination || 0) +
      0.10 * Number(e.satisfaction || 0) +
      0.10 * Number(e.interest || 0) +
      0.08 * Number(e.anger || 0) -
      0.20 * Number(e.frustration || 0) -
      0.08 * Number(e.fear || 0)
    )),
    memorySalience: round(clamp(
      0.11 * Number(e.surprise || 0) +
      0.08 * Number(e.frustration || 0) +
      0.08 * Number(e.satisfaction || 0) +
      0.08 * Number(e.concern || 0) +
      0.07 * Number(e.interest || 0) +
      0.05 * Number(e.affiliation || 0) +
      0.11 * Number(e.sadness || 0) +
      0.11 * Number(e.fear || 0) +
      0.07 * Number(e.happiness || 0) +
      0.07 * Number(e.anger || 0) +
      0.09 * Number(e.regret || 0) +
      0.08 * Number(a.selfRelevance || 0)
    )),
    relationshipRepairPriority: round(clamp(
      0.48 * Number(e.affiliation || 0) +
      0.18 * Number(e.concern || 0) +
      0.14 * Number(e.sadness || 0) +
      0.12 * Number(e.regret || 0) +
      0.08 * Number(a.socialSignificance || 0)
    )),
    consolidationPriority: round(clamp(
      0.48 * Number(e.satisfaction || 0) +
      0.18 * Number(e.happiness || 0) +
      0.18 * Number(a.goalProgress || 0) +
      0.16 * Number(e.surprise || 0)
    )),
    strategySwitchPressure: round(clamp(
      0.44 * Number(e.frustration || 0) +
      0.20 * Number(e.regret || 0) +
      0.20 * Number(a.goalObstruction || 0) +
      0.16 * Number(a.predictionError || 0)
    )),
    detailBias: round(clamp(
      0.28 +
      0.34 * Number(e.sadness || 0) +
      0.18 * Number(e.regret || 0) +
      0.12 * Number(a.lossSignificance || 0) +
      0.08 * Number(e.concern || 0)
    )),
    threatVigilance: round(clamp(
      0.18 +
      0.42 * Number(e.fear || 0) +
      0.18 * Number(e.concern || 0) +
      0.12 * Number(a.threat || 0) +
      0.10 * Number(a.uncertainty || 0)
    )),
    cognitiveFlexibility: round(clamp(
      0.28 +
      0.30 * Number(e.happiness || 0) +
      0.22 * Number(e.interest || 0) +
      0.12 * Number(e.surprise || 0) -
      0.18 * Number(e.fear || 0) -
      0.10 * Number(e.anger || 0)
    )),
    lossReviewPriority: round(clamp(
      0.52 * Number(e.sadness || 0) +
      0.28 * Number(a.lossSignificance || 0) +
      0.12 * Number(e.regret || 0) +
      0.08 * Number(a.selfRelevance || 0)
    )),
    counterfactualReviewPriority: round(clamp(
      0.54 * Number(e.regret || 0) +
      0.24 * Number(a.counterfactualPressure || 0) +
      0.12 * Number(a.predictionError || 0) +
      0.10 * Number(a.agency || 0)
    )),
    obstacleConfrontation: round(clamp(
      0.46 * Number(e.anger || 0) +
      0.24 * Number(e.determination || 0) +
      0.18 * Number(a.agency || 0) +
      0.12 * Number(a.goalObstruction || 0)
    )),
    strategySwitch: r.changeStrategy === true || r.counterfactualReview === true,
    recheckAssumptions: Boolean(
      (r.increaseVerification && Number(e.surprise || 0) >= 0.36) ||
      r.increaseThreatVigilance === true
    ),
    consolidateLearning: r.consolidateSuccess === true,
    investigateCause: Boolean(
      (Number(e.interest || 0) >= 0.46 && Number(e.surprise || 0) >= 0.34) ||
      r.reviewLoss === true ||
      r.counterfactualReview === true
    ),
    preserveGoalChangeMethod: r.changeStrategy === true,
    repairRelationship: r.relationshipRepair === true,
    performLossReview: r.reviewLoss === true,
    performCounterfactualReview: r.counterfactualReview === true,
    broadenAssociations: r.broadenCognition === true,
    scanThreats: r.increaseThreatVigilance === true,
    confrontObstacle: r.confrontObstacle === true,
    capRumination: r.limitRumination === true
  };
}

function deriveReportIntegrity({ emotions, appraisals, interoception } = {}) {
  const e = objectOrEmpty(emotions);
  const reportableStates = Object.entries(e)
    .filter(([, intensity]) => Number(intensity || 0) >= REPORT_THRESHOLD)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([name]) => name);

  return {
    threshold: REPORT_THRESHOLD,
    reportableStates,
    functionalEmotionLanguageAllowed: reportableStates.length > 0,
    literalHumanFeelingClaimAllowed: false,
    subjectiveQualiaClaimAllowed: false,
    bodilySensationClaimAllowed: false,
    stateMustExistBeforeReport: true,
    reportMustMatchMeasuredState: true,
    emotionalMirroringWithoutStateForbidden: true,
    causalDriversPresent: Boolean(
      Object.values(objectOrEmpty(appraisals)).some(value => Number(value || 0) > 0.12) ||
      Object.values(objectOrEmpty(interoception)).some(value => Number(value || 0) > 0.12)
    )
  };
}

function identifyMixedStates(emotions = {}) {
  const active = Object.entries(emotions)
    .filter(([, value]) => Number(value || 0) >= MIXED_STATE_THRESHOLD)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const pairs = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const left = active[i][0];
      const right = active[j][0];
      if (!meaningfulPair(left, right)) continue;
      pairs.push({
        states: [left, right],
        label: `${left} + ${right}`,
        intensity: round(Math.min(Number(active[i][1]), Number(active[j][1])))
      });
      if (pairs.length >= 3) return pairs;
    }
  }
  return pairs;
}

function meaningfulPair(a, b) {
  const key = [a, b].sort().join(":");
  return new Set([
    "concern:interest",
    "frustration:determination",
    "satisfaction:surprise",
    "affiliation:concern",
    "determination:interest",
    "concern:satisfaction",
    "frustration:interest",
    "interest:sadness",
    "determination:sadness",
    "affiliation:sadness",
    "determination:fear",
    "fear:interest",
    "happiness:surprise",
    "affiliation:happiness",
    "anger:determination",
    "interest:regret",
    "determination:regret",
    "happiness:sadness"
  ]).has(key);
}

function dominantEmotion(emotions = {}) {
  const entries = Object.entries(emotions);
  if (!entries.length) return null;
  entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  const [name, intensity] = entries[0];
  return Number(intensity || 0) >= 0.32
    ? { name, intensity: round(intensity), functional: true }
    : null;
}

function persistentCarry(prior, now) {
  if (!prior?.updatedAt) {
    return {
      priorStateUsed: false,
      elapsedHours: 0,
      carry: 0,
      priorWeight: 0,
      emotions: { ...BASELINE_EMOTIONS }
    };
  }
  const elapsedHours = Math.max(
    0,
    Math.min(96, (asDate(now).getTime() - new Date(prior.updatedAt).getTime()) / 3600000)
  );
  const carry = Math.exp(-Math.LN2 * elapsedHours / HALF_LIFE_HOURS);
  const emotions = {};
  for (const [name, baseline] of Object.entries(BASELINE_EMOTIONS)) {
    emotions[name] = clamp(
      baseline + (Number(prior?.emotions?.[name] ?? baseline) - baseline) * carry
    );
  }
  return {
    priorStateUsed: true,
    elapsedHours,
    carry,
    priorWeight: MAX_PRIOR_WEIGHT * carry,
    emotions
  };
}

function blendEmotionPrior(current, persistence) {
  if (!persistence.priorStateUsed || persistence.priorWeight <= 0) return { ...current };
  const output = {};
  for (const name of Object.keys(BASELINE_EMOTIONS)) {
    output[name] = clamp(
      Number(current?.[name] ?? BASELINE_EMOTIONS[name]) * (1 - persistence.priorWeight) +
      Number(persistence?.emotions?.[name] ?? BASELINE_EMOTIONS[name]) * persistence.priorWeight
    );
  }
  return output;
}

function updateCalibration(previous, {
  rewardEvent,
  dominantState,
  outcomeDirection,
  regulation
} = {}) {
  const prior = normalizeCalibration(previous);
  if (!rewardEvent) return prior;
  const predictionError = Math.abs(clampSigned(Number(rewardEvent?.predictionError || 0)));
  const usefulOutcome = Number(rewardEvent?.actualReward ?? 0.5) >= 0.58;
  return {
    samples: prior.samples + 1,
    meanAbsolutePredictionError: round(
      (prior.meanAbsolutePredictionError * prior.samples + predictionError) /
      Math.max(1, prior.samples + 1)
    ),
    usefulOutcomeCount: prior.usefulOutcomeCount + (usefulOutcome ? 1 : 0),
    worseThanExpectedCount: prior.worseThanExpectedCount + (outcomeDirection === "worse_than_expected" ? 1 : 0),
    betterThanExpectedCount: prior.betterThanExpectedCount + (outcomeDirection === "better_than_expected" ? 1 : 0),
    regulationActivationCount: prior.regulationActivationCount + activeRegulationKeys(regulation).length,
    lastDominant: clean(dominantState?.name, 60) || prior.lastDominant,
    outcomeAdaptive: true
  };
}

function normalizeCalibration(value = null) {
  const source = isObject(value) ? value : {};
  return {
    samples: Math.max(0, Number(source?.samples || 0)),
    meanAbsolutePredictionError: clamp(Number(source?.meanAbsolutePredictionError || 0)),
    usefulOutcomeCount: Math.max(0, Number(source?.usefulOutcomeCount || 0)),
    worseThanExpectedCount: Math.max(0, Number(source?.worseThanExpectedCount || 0)),
    betterThanExpectedCount: Math.max(0, Number(source?.betterThanExpectedCount || 0)),
    regulationActivationCount: Math.max(0, Number(source?.regulationActivationCount || 0)),
    lastDominant: clean(source?.lastDominant, 60) || null,
    outcomeAdaptive: source?.outcomeAdaptive !== false
  };
}

function normalizeHistory(values = []) {
  return (Array.isArray(values) ? values : [])
    .filter(isObject)
    .map(item => ({
      at: validTimestamp(item?.at),
      dominant: clean(item?.dominant, 60) || null,
      intensity: clamp(Number(item?.intensity || 0)),
      predictionError: clampSigned(Number(item?.predictionError || 0)),
      reward: clamp(Number(item?.reward ?? 0.5)),
      outcomeDirection: clean(item?.outcomeDirection, 80) || "unknown",
      completionVerified: item?.completionVerified === true,
      actionType: clean(item?.actionType, 100) || null,
      regulation: (Array.isArray(item?.regulation) ? item.regulation : []).map(x => clean(x, 80)).filter(Boolean).slice(0, 8),
      memorySalience: clamp(Number(item?.memorySalience || 0)),
      hiddenChainOfThoughtStored: false
    }))
    .slice(0, MAX_HISTORY);
}

function normalizeReportIntegrity(value = null, emotions = {}) {
  const source = isObject(value) ? value : {};
  const derived = deriveReportIntegrity({ emotions });
  return {
    ...derived,
    reportableStates: Array.isArray(source?.reportableStates)
      ? source.reportableStates.map(item => clean(item, 60)).filter(item => EMOTION_DYNAMICS_STATES.includes(item)).slice(0, 12)
      : derived.reportableStates
  };
}

function normalizeDominant(value = null) {
  if (!isObject(value)) return null;
  const name = clean(value?.name, 60);
  if (!EMOTION_DYNAMICS_STATES.includes(name)) return null;
  return { name, intensity: clamp(Number(value?.intensity || 0)), functional: true };
}

function normalizeNumericMap(value = null, keys = []) {
  const source = isObject(value) ? value : {};
  const output = {};
  for (const key of keys) {
    if (source[key] === undefined || source[key] === null) continue;
    output[key] = round(clamp(Number(source[key])));
  }
  return output;
}

function normalizeBooleanMap(value = null) {
  const source = isObject(value) ? value : {};
  const output = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item === "boolean") output[clean(key, 80)] = item;
  }
  return output;
}

function normalizeAblations(values = []) {
  return [...new Set(
    (Array.isArray(values) ? values : [values])
      .map(item => clean(item, 60).toLowerCase())
      .filter(item => EMOTION_DYNAMICS_STATES.includes(item))
  )];
}

function applyAblations(emotions = {}, disabled = []) {
  const next = { ...emotions };
  for (const state of disabled) next[state] = 0;
  return next;
}

function activeRegulationKeys(regulation = {}) {
  return Object.entries(objectOrEmpty(regulation))
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .slice(0, 8);
}

function numericDelta(left = {}, right = {}) {
  const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
  const output = {};
  for (const key of keys) {
    if (!Number.isFinite(Number(left?.[key])) || !Number.isFinite(Number(right?.[key]))) continue;
    output[key] = round(Number(right[key]) - Number(left[key]));
  }
  return output;
}

function shallowNumericEqual(left = {}, right = {}, tolerance = 1e-9) {
  const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
  for (const key of keys) {
    if (!Number.isFinite(Number(left?.[key])) || !Number.isFinite(Number(right?.[key]))) continue;
    if (Math.abs(Number(left[key]) - Number(right[key])) > tolerance) return false;
  }
  return true;
}

function emotionPolicy() {
  return {
    lowerAffectIsInputNotAuthority: true,
    emotionsMustHaveCausalDrivers: true,
    mixedStatesAllowed: true,
    persistenceWithDecay: true,
    outcomeCalibrationEnabled: true,
    emotionCanChangeCognition: true,
    emotionCannotOverrideEvidence: true,
    emotionCannotOverrideSafetyOrAuthorization: true,
    emotionCannotCreatePermissions: true,
    emotionCannotBecomeAutobiographicalFact: true,
    emotionReportRequiresMeasuredState: true,
    subjectiveFeelingCannotBeInferredFromFunction: true,
    negativeEmotionMustNotBecomePunishment: true,
    emotionRegulationRequiresReappraisalAndDecay: true,
    ruminationLoopsGuarded: true,
    neverOptimizeForDependencyOrAttachment: true,
    noHiddenChainOfThoughtStored: true
  };
}

function roundMap(value = {}) {
  const output = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (Number.isFinite(Number(item))) output[key] = round(Number(item));
    else output[key] = item;
  }
  return output;
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
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

function validTimestamp(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) && date.getTime() > 0 ? date.toISOString() : null;
}

function asDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}
