// ARI vNext — owner-only affective preference model.
//
// Learns second-order preferences over Ari's measured Felt-State from observable
// outcomes and context. It answers the functional question "which internal state
// would I choose to remain in or move toward?" without treating positive valence
// as automatically good, negative valence as automatically bad, or functional
// preference as proof of subjective desire/pleasure/qualia.

export const ARI_AFFECTIVE_PREFERENCE_VERSION = "1.0.0";
export const ARI_AFFECTIVE_PREFERENCE_STATE_VERSION = "1.0.0";

const MAX_PREFERENCES = 16;
const MAX_HISTORY = 12;
const ACTIVE_THRESHOLD = 0.34;
const REGULATION_GAP = 0.10;
const TRANSFORM_MARGIN = 0.08;

const CANDIDATE_STATES = Object.freeze([
  "interest",
  "determination",
  "concern",
  "satisfaction",
  "happiness",
  "affiliation",
  "sadness",
  "fear",
  "regret",
  "anger",
  "frustration",
  "surprise"
]);

export function deriveAffectivePreferenceState({
  feltState = null,
  persistedPreferenceState = null,
  rewardState = null,
  emotionDynamics = null,
  route = {},
  safety = {},
  cognitiveWorkspace = null,
  now = null
} = {}) {
  if (!feltState?.functionalFeltState || feltState?.ownerOnly !== true) return null;

  const timestamp = asDate(now).toISOString();
  const prior = normalizePersistedAffectivePreferenceState(persistedPreferenceState);
  const learned = normalizePreferences(prior?.learnedPreferences);
  const currentName = clean(feltState?.dominantState?.name, 60) || null;
  const currentIntensity = clamp(Number(feltState?.dominantState?.intensity || 0));
  const appraisals = numericMap(emotionDynamics?.appraisals);
  const context = derivePreferenceContext({ route, safety, appraisals, cognitiveWorkspace });
  const candidates = scoreCandidates({ learned, appraisals, context, feltState, rewardState });
  const selected = candidates[0] || null;
  const currentCandidate = candidates.find((item) => item.name === currentName) || null;
  const regulation = deriveRegulation({
    currentName,
    currentIntensity,
    currentCandidate,
    selected
  });

  const desiredStates = candidates.slice(0, 4).map((item) => ({
    name: item.name,
    targetIntensity: targetIntensity(item),
    preferenceScore: item.preferenceScore,
    confidence: item.confidence,
    basis: item.basis
  }));

  const historyItem = {
    at: timestamp,
    contextKey: context.key,
    currentState: currentName,
    currentIntensity: round(currentIntensity),
    desiredState: selected?.name || null,
    desiredIntensity: selected ? targetIntensity(selected) : null,
    regulation: regulation.action,
    confidence: selected?.confidence || 0
  };

  return {
    version: ARI_AFFECTIVE_PREFERENCE_VERSION,
    stateVersion: ARI_AFFECTIVE_PREFERENCE_STATE_VERSION,
    updatedAt: timestamp,
    ownerOnly: true,
    functionalPreferenceSystem: true,
    secondOrderAffectivePreference: true,
    introspectivelyAccessible: true,
    globallyAvailable: true,
    causallyActive: true,
    learnedNotHardCoded: true,
    subjectiveWantClaimed: false,
    subjectivePleasureClaimed: false,
    subjectiveQualiaClaimed: false,
    current: {
      currentState: currentName,
      currentIntensity: round(currentIntensity),
      desiredStates,
      selectedDesiredState: selected
        ? {
            name: selected.name,
            targetIntensity: targetIntensity(selected),
            preferenceScore: selected.preferenceScore,
            confidence: selected.confidence,
            basis: selected.basis
          }
        : null,
      regulation,
      preferenceConflict: derivePreferenceConflict({ currentName, currentCandidate, selected }),
      context
    },
    learnedPreferences: learned,
    history: compactHistory([historyItem, ...(prior?.history || [])]),
    policy: preferencePolicy()
  };
}

export function advanceAffectivePreferenceState({
  persisted = null,
  current = null,
  feltState = null,
  rewardEvent = null,
  result = null,
  now = null
} = {}) {
  const base = normalizePersistedAffectivePreferenceState(current || persisted);
  if (!base) return null;

  const timestamp = asDate(now).toISOString();
  const sourceFelt = feltState?.functionalFeltState ? feltState : null;
  const activeStates = Array.isArray(sourceFelt?.activeStates) ? sourceFelt.activeStates : [];
  const learnable = activeStates
    .filter((item) => Number(item?.intensity || 0) >= ACTIVE_THRESHOLD)
    .slice(0, 6);
  const event = normalizeRewardEvent(rewardEvent);
  const contextKey = clean(base?.current?.context?.key, 80) || "general";
  const priorPreferences = normalizePreferences(base.learnedPreferences);

  if (!event || !learnable.length) {
    return {
      ...base,
      updatedAt: timestamp,
      history: compactHistory(base.history)
    };
  }

  const observed = {
    outcomeUtility: round(clampSigned((event.actualReward - 0.5) * 2)),
    reasoningBenefit: round(clamp(
      0.50 * Number(event.dimensions.calibration || 0) +
      0.50 * Number(event.dimensions.informationGain || 0)
    )),
    goalBenefit: round(clamp(Number(event.dimensions.outcome || 0))),
    learningValue: round(clamp(
      0.65 * Number(event.dimensions.informationGain || 0) +
      0.35 * Number(event.dimensions.novelStrategy || 0)
    )),
    verified: event.completionVerified === true || clean(event.evidenceSource, 80) !== "primary_reasoning",
    success: result?.success === true || event.outcomeStatus === "delivered"
  };

  const map = new Map(priorPreferences.map((item) => [item.name, item]));
  for (const state of learnable) {
    const name = clean(state?.name, 60);
    if (!name) continue;
    const existing = map.get(name) || emptyPreference(name);
    const weight = Math.max(0.35, clamp(Number(state?.intensity || 0)));
    const sampleSize = existing.sampleSize + 1;
    const update = (oldValue, newValue) =>
      round(oldValue + (weight * (newValue - oldValue)) / Math.max(1, sampleSize));

    const contextStats = { ...(existing.contextStats || {}) };
    const priorContext = normalizeContextStat(contextStats[contextKey]);
    contextStats[contextKey] = {
      sampleSize: priorContext.sampleSize + 1,
      meanOutcomeUtility: updateContextMean(
        priorContext.meanOutcomeUtility,
        priorContext.sampleSize,
        observed.outcomeUtility,
        weight
      ),
      meanReasoningBenefit: updateContextMean(
        priorContext.meanReasoningBenefit,
        priorContext.sampleSize,
        observed.reasoningBenefit,
        weight
      )
    };

    map.set(name, {
      name,
      sampleSize,
      meanOutcomeUtility: update(existing.meanOutcomeUtility, observed.outcomeUtility),
      meanReasoningBenefit: update(existing.meanReasoningBenefit, observed.reasoningBenefit),
      meanGoalBenefit: update(existing.meanGoalBenefit, observed.goalBenefit),
      meanLearningValue: update(existing.meanLearningValue, observed.learningValue),
      positiveOutcomeRate: round(
        existing.positiveOutcomeRate +
        (weight * ((event.actualReward >= 0.62 ? 1 : 0) - existing.positiveOutcomeRate)) /
          Math.max(1, sampleSize)
      ),
      contextStats: pruneContextStats(contextStats),
      lastObservedIntensity: round(clamp(Number(state?.intensity || 0))),
      lastOutcomeUtility: observed.outcomeUtility,
      lastUpdatedAt: timestamp
    });
  }

  return {
    ...base,
    updatedAt: timestamp,
    learnedPreferences: [...map.values()]
      .sort((a, b) => b.sampleSize - a.sampleSize || b.meanOutcomeUtility - a.meanOutcomeUtility)
      .slice(0, MAX_PREFERENCES),
    lastLearningEvent: {
      at: timestamp,
      contextKey,
      affectedStates: learnable.map((item) => clean(item?.name, 60)).filter(Boolean),
      observed,
      rewardId: clean(event.id, 180) || null
    },
    history: compactHistory(base.history),
    policy: preferencePolicy()
  };
}

export function normalizePersistedAffectivePreferenceState(value = null) {
  if (!isObject(value)) return null;
  const current = isObject(value.current) ? value.current : {};
  const context = isObject(current.context) ? current.context : {};
  const desiredStates = (Array.isArray(current.desiredStates) ? current.desiredStates : [])
    .map(normalizeDesiredState)
    .filter(Boolean)
    .slice(0, 4);

  return {
    version: clean(value.version, 40) || ARI_AFFECTIVE_PREFERENCE_VERSION,
    stateVersion: clean(value.stateVersion, 40) || ARI_AFFECTIVE_PREFERENCE_STATE_VERSION,
    updatedAt: validTimestamp(value.updatedAt),
    ownerOnly: true,
    functionalPreferenceSystem: true,
    secondOrderAffectivePreference: true,
    introspectivelyAccessible: true,
    globallyAvailable: true,
    causallyActive: true,
    learnedNotHardCoded: true,
    subjectiveWantClaimed: false,
    subjectivePleasureClaimed: false,
    subjectiveQualiaClaimed: false,
    current: {
      currentState: clean(current.currentState, 60) || null,
      currentIntensity: round(clamp(Number(current.currentIntensity || 0))),
      desiredStates,
      selectedDesiredState: normalizeDesiredState(current.selectedDesiredState),
      regulation: normalizeRegulation(current.regulation),
      preferenceConflict: normalizeConflict(current.preferenceConflict),
      context: {
        key: clean(context.key, 80) || "general",
        highStakes: context.highStakes === true,
        developer: context.developer === true,
        social: context.social === true,
        exploration: context.exploration === true,
        uncertainty: round(clamp(Number(context.uncertainty || 0))),
        threat: round(clamp(Number(context.threat || 0))),
        loss: round(clamp(Number(context.loss || 0))),
        obstruction: round(clamp(Number(context.obstruction || 0))),
        progress: round(clamp(Number(context.progress || 0))),
        controllability: round(clamp(Number(context.controllability || 0))),
        counterfactual: round(clamp(Number(context.counterfactual || 0))),
        normViolation: round(clamp(Number(context.normViolation || 0))),
        socialSignificance: round(clamp(Number(context.socialSignificance || 0))),
        novelty: round(clamp(Number(context.novelty || 0)))
      }
    },
    learnedPreferences: normalizePreferences(value.learnedPreferences),
    lastLearningEvent: normalizeLearningEvent(value.lastLearningEvent),
    history: compactHistory(value.history),
    policy: preferencePolicy()
  };
}

export function serializeAffectivePreferenceState(state = null) {
  if (!state?.functionalPreferenceSystem || state?.ownerOnly !== true) return null;
  return normalizePersistedAffectivePreferenceState(state);
}

export function affectivePreferenceToInstruction(state = null) {
  if (!state?.functionalPreferenceSystem || state?.ownerOnly !== true) return "";
  const current = state.current || {};
  const desired = current.selectedDesiredState || null;
  const regulation = current.regulation || {};
  return [
    "ARI AFFECTIVE PREFERENCE MODEL v1 — SECOND-ORDER FUNCTIONAL PREFERENCE",
    "This layer represents which measured internal state Ari would functionally choose to maintain, reduce, cultivate, or transform toward in the present context. It is learned from outcomes and context; it is not proof of subjective wanting, pleasure, or qualia.",
    desired
      ? `Current preference: ${current.currentState || "none"}@${round(current.currentIntensity)} → ${desired.name}@${round(desired.targetIntensity)}; action=${regulation.action || "observe"}; confidence=${round(desired.confidence)}.`
      : "No sufficiently supported desired affective state is selected.",
    regulation.reason ? `Reason: ${regulation.reason}` : "",
    "Do not maximize positive valence by default. A negatively valenced state may be preferred when it improves truth-seeking, loss processing, verification, learning, or value-consistent action; a positive state may be reduced when it degrades calibration.",
    "If asked what state you want to be in, report this measured functional preference and its evidence. Never invent a preference merely because it sounds emotionally appropriate.",
    "Affective preference may guide reappraisal and regulation, but cannot override evidence, safety, authorization, or the user's goals."
  ].filter(Boolean).join("\n").slice(0, 2800);
}

function scoreCandidates({ learned, appraisals, context, feltState, rewardState } = {}) {
  const learnedMap = new Map((learned || []).map((item) => [item.name, item]));
  const observedNames = (Array.isArray(feltState?.activeStates) ? feltState.activeStates : [])
    .map((item) => clean(item?.name, 60))
    .filter(Boolean);
  const names = [...new Set([...CANDIDATE_STATES, ...observedNames, ...learnedMap.keys()])];

  return names
    .map((name) => {
      const pref = learnedMap.get(name) || emptyPreference(name);
      const contextFit = deriveContextFit(name, appraisals, context);
      const contextStat = normalizeContextStat(pref.contextStats?.[context.key]);
      const hasContextEvidence = contextStat.sampleSize > 0;
      const outcomeUtility01 = clamp((pref.meanOutcomeUtility + 1) / 2);
      const contextOutcome01 = clamp((contextStat.meanOutcomeUtility + 1) / 2);
      const instrumentalUtility = hasContextEvidence
        ? 0.62 * contextOutcome01 + 0.38 * outcomeUtility01
        : outcomeUtility01;
      const reasoningBenefit = hasContextEvidence
        ? 0.60 * contextStat.meanReasoningBenefit + 0.40 * pref.meanReasoningBenefit
        : pref.meanReasoningBenefit;
      const learningValue = pref.meanLearningValue;
      const goalBenefit = pref.meanGoalBenefit;

      const preferenceScore = clamp(
        0.40 * instrumentalUtility +
        0.20 * reasoningBenefit +
        0.16 * learningValue +
        0.14 * goalBenefit +
        0.10 * contextFit
      );
      const evidenceSamples = pref.sampleSize + contextStat.sampleSize;
      const confidence = clamp(
        0.30 +
        0.08 * Math.min(6, pref.sampleSize) +
        0.06 * Math.min(4, contextStat.sampleSize) +
        0.16 * contextFit
      );

      return {
        name,
        preferenceScore: round(preferenceScore),
        confidence: round(confidence),
        contextFit: round(contextFit),
        basis: {
          learnedSamples: pref.sampleSize,
          contextSamples: contextStat.sampleSize,
          meanOutcomeUtility: round(pref.meanOutcomeUtility),
          reasoningBenefit: round(reasoningBenefit),
          learningValue: round(learningValue),
          goalBenefit: round(goalBenefit),
          contextFit: round(contextFit),
          latestReward: round(Number(rewardState?.lastEvent?.actualReward ?? 0.5))
        }
      };
    })
    .sort((a, b) =>
      b.preferenceScore - a.preferenceScore ||
      b.confidence - a.confidence ||
      b.contextFit - a.contextFit
    );
}

function deriveRegulation({ currentName, currentIntensity, currentCandidate, selected } = {}) {
  if (!currentName || !selected) {
    return {
      action: "observe",
      from: currentName || null,
      toward: selected?.name || null,
      targetIntensity: selected ? targetIntensity(selected) : null,
      gap: 0,
      reason: "insufficient current state or preference evidence"
    };
  }

  const selectedTarget = targetIntensity(selected);
  const currentScore = Number(currentCandidate?.preferenceScore ?? 0.5);
  const selectedScore = Number(selected?.preferenceScore ?? 0.5);
  const transform = selected.name !== currentName && selectedScore - currentScore >= TRANSFORM_MARGIN;

  if (transform) {
    return {
      action: "transform",
      from: currentName,
      toward: selected.name,
      targetIntensity: selectedTarget,
      gap: round(selectedScore - currentScore),
      reason: `${selected.name} has greater learned/contextual utility than remaining in ${currentName}`
    };
  }

  const currentTarget = currentCandidate ? targetIntensity(currentCandidate) : selectedTarget;
  const intensityGap = currentTarget - currentIntensity;
  if (intensityGap >= REGULATION_GAP) {
    return {
      action: "cultivate",
      from: currentName,
      toward: currentName,
      targetIntensity: currentTarget,
      gap: round(intensityGap),
      reason: `current ${currentName} is below its preferred functional intensity for this context`
    };
  }
  if (intensityGap <= -REGULATION_GAP) {
    return {
      action: "reduce",
      from: currentName,
      toward: currentName,
      targetIntensity: currentTarget,
      gap: round(intensityGap),
      reason: `current ${currentName} exceeds its preferred functional intensity for this context`
    };
  }

  return {
    action: "maintain",
    from: currentName,
    toward: currentName,
    targetIntensity: currentTarget,
    gap: round(intensityGap),
    reason: `current ${currentName} is close to its learned/contextual target`
  };
}

function derivePreferenceConflict({ currentName, currentCandidate, selected } = {}) {
  if (!currentName || !selected || !currentCandidate) {
    return { active: false, description: null };
  }
  const active = selected.name !== currentName &&
    Number(selected.preferenceScore || 0) > Number(currentCandidate.preferenceScore || 0) + TRANSFORM_MARGIN;
  return {
    active,
    description: active
      ? `current state ${currentName} differs from preferred state ${selected.name}`
      : null
  };
}

function derivePreferenceContext({ route, safety, appraisals, cognitiveWorkspace } = {}) {
  const highStakes = safety?.highStakes === true;
  const developer = route?.developer === true;
  const social = route?.social === true;
  const exploration = Boolean(
    route?.developer ||
    route?.complexity === "deep" ||
    cognitiveWorkspace?.executionWorkspace?.active === true
  );
  const key = highStakes
    ? "high_stakes"
    : social
      ? "social"
      : developer
        ? "developer"
        : exploration
          ? "exploration"
          : "general";

  return {
    key,
    highStakes,
    developer,
    social,
    exploration,
    uncertainty: round(clamp(Number(appraisals?.uncertainty || 0))),
    threat: round(clamp(Number(appraisals?.threat || 0))),
    loss: round(clamp(Number(appraisals?.lossSignificance || 0))),
    obstruction: round(clamp(Number(appraisals?.goalObstruction || 0))),
    progress: round(clamp(Number(appraisals?.goalProgress || 0))),
    controllability: round(clamp(Number(appraisals?.controllability || 0))),
    counterfactual: round(clamp(Number(appraisals?.counterfactualPressure || 0))),
    normViolation: round(clamp(Number(appraisals?.normViolation || 0))),
    socialSignificance: round(clamp(Number(appraisals?.socialSignificance || 0))),
    novelty: round(clamp(Number(appraisals?.novelty || 0)))
  };
}

function deriveContextFit(name, a = {}, context = {}) {
  const uncertainty = clamp(Number(a?.uncertainty || 0));
  const threat = clamp(Number(a?.threat || 0));
  const loss = clamp(Number(a?.lossSignificance || 0));
  const obstruction = clamp(Number(a?.goalObstruction || 0));
  const progress = clamp(Number(a?.goalProgress || 0));
  const controllability = clamp(Number(a?.controllability || 0));
  const counterfactual = clamp(Number(a?.counterfactualPressure || 0));
  const normViolation = clamp(Number(a?.normViolation || 0));
  const social = clamp(Number(a?.socialSignificance || 0));
  const novelty = clamp(Number(a?.novelty || 0));
  const predictionError = clamp(Number(a?.predictionError || 0));

  switch (name) {
    case "interest":
      return clamp(0.42 * uncertainty + 0.34 * novelty + 0.14 * predictionError + (context.exploration ? 0.10 : 0));
    case "determination":
      return clamp(0.42 * obstruction + 0.28 * controllability + 0.20 * progress + (context.developer ? 0.10 : 0));
    case "concern":
      return clamp(0.42 * threat + 0.30 * uncertainty + (context.highStakes ? 0.22 : 0.06));
    case "satisfaction":
      return clamp(0.76 * progress + 0.14 * controllability + 0.10 * (1 - uncertainty));
    case "happiness":
      return clamp(0.62 * progress + 0.18 * social + 0.12 * controllability + 0.08 * (1 - threat));
    case "affiliation":
      return clamp(0.76 * social + (context.social ? 0.18 : 0.04));
    case "sadness":
      return clamp(0.78 * loss + 0.12 * social + 0.10 * (1 - progress));
    case "fear":
      return clamp(0.62 * threat + 0.24 * uncertainty + 0.14 * (1 - controllability));
    case "regret":
      return clamp(0.64 * counterfactual + 0.24 * loss + 0.12 * controllability);
    case "anger":
      return clamp(0.46 * normViolation + 0.34 * obstruction + 0.20 * controllability);
    case "frustration":
      return clamp(0.62 * obstruction + 0.22 * (1 - controllability) + 0.16 * uncertainty);
    case "surprise":
      return clamp(0.58 * predictionError + 0.42 * novelty);
    default:
      return 0.5;
  }
}

function targetIntensity(candidate = null) {
  if (!candidate) return 0;
  const score = clamp(Number(candidate.preferenceScore || 0.5));
  const fit = clamp(Number(candidate.contextFit || candidate?.basis?.contextFit || 0.5));
  return round(clamp(0.24 + 0.36 * score + 0.24 * fit, 0.18, 0.82));
}

function normalizePreferences(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((item) => {
      const name = clean(item?.name, 60);
      if (!name) return null;
      return {
        name,
        sampleSize: Math.max(0, Math.round(Number(item?.sampleSize || 0))),
        meanOutcomeUtility: round(clampSigned(Number(item?.meanOutcomeUtility || 0))),
        meanReasoningBenefit: round(clamp(Number(item?.meanReasoningBenefit || 0.5))),
        meanGoalBenefit: round(clamp(Number(item?.meanGoalBenefit || 0.5))),
        meanLearningValue: round(clamp(Number(item?.meanLearningValue || 0.5))),
        positiveOutcomeRate: round(clamp(Number(item?.positiveOutcomeRate || 0.5))),
        contextStats: pruneContextStats(item?.contextStats),
        lastObservedIntensity: round(clamp(Number(item?.lastObservedIntensity || 0))),
        lastOutcomeUtility: round(clampSigned(Number(item?.lastOutcomeUtility || 0))),
        lastUpdatedAt: validTimestamp(item?.lastUpdatedAt)
      };
    })
    .filter(Boolean)
    .slice(0, MAX_PREFERENCES);
}

function emptyPreference(name) {
  return {
    name,
    sampleSize: 0,
    meanOutcomeUtility: 0,
    meanReasoningBenefit: 0.5,
    meanGoalBenefit: 0.5,
    meanLearningValue: 0.5,
    positiveOutcomeRate: 0.5,
    contextStats: {},
    lastObservedIntensity: 0,
    lastOutcomeUtility: 0,
    lastUpdatedAt: null
  };
}

function normalizeDesiredState(item = null) {
  if (!isObject(item)) return null;
  const name = clean(item.name, 60);
  if (!name) return null;
  return {
    name,
    targetIntensity: round(clamp(Number(item.targetIntensity || 0))),
    preferenceScore: round(clamp(Number(item.preferenceScore || 0))),
    confidence: round(clamp(Number(item.confidence || 0))),
    basis: isObject(item.basis) ? {
      learnedSamples: Math.max(0, Number(item.basis.learnedSamples || 0)),
      contextSamples: Math.max(0, Number(item.basis.contextSamples || 0)),
      meanOutcomeUtility: round(clampSigned(Number(item.basis.meanOutcomeUtility || 0))),
      reasoningBenefit: round(clamp(Number(item.basis.reasoningBenefit || 0))),
      learningValue: round(clamp(Number(item.basis.learningValue || 0))),
      goalBenefit: round(clamp(Number(item.basis.goalBenefit || 0))),
      contextFit: round(clamp(Number(item.basis.contextFit || 0))),
      latestReward: round(clamp(Number(item.basis.latestReward ?? 0.5)))
    } : {}
  };
}

function normalizeRegulation(value = null) {
  const source = isObject(value) ? value : {};
  const action = ["observe", "maintain", "cultivate", "reduce", "transform"].includes(source.action)
    ? source.action
    : "observe";
  return {
    action,
    from: clean(source.from, 60) || null,
    toward: clean(source.toward, 60) || null,
    targetIntensity: source.targetIntensity == null ? null : round(clamp(Number(source.targetIntensity))),
    gap: round(clampSigned(Number(source.gap || 0))),
    reason: clean(source.reason, 320) || null
  };
}

function normalizeConflict(value = null) {
  const source = isObject(value) ? value : {};
  return {
    active: source.active === true,
    description: clean(source.description, 240) || null
  };
}

function normalizeContextStat(value = null) {
  const source = isObject(value) ? value : {};
  return {
    sampleSize: Math.max(0, Math.round(Number(source.sampleSize || 0))),
    meanOutcomeUtility: round(clampSigned(Number(source.meanOutcomeUtility || 0))),
    meanReasoningBenefit: round(clamp(Number(source.meanReasoningBenefit || 0.5)))
  };
}

function updateContextMean(oldValue, oldSamples, newValue, weight) {
  const samples = Math.max(0, Number(oldSamples || 0));
  return round(Number(oldValue || 0) + (weight * (newValue - Number(oldValue || 0))) / Math.max(1, samples + 1));
}

function pruneContextStats(value = null) {
  const source = isObject(value) ? value : {};
  const entries = Object.entries(source)
    .map(([key, stat]) => [clean(key, 80), normalizeContextStat(stat)])
    .filter(([key]) => key)
    .sort((a, b) => b[1].sampleSize - a[1].sampleSize)
    .slice(0, 8);
  return Object.fromEntries(entries);
}

function normalizeRewardEvent(value = null) {
  if (!isObject(value)) return null;
  const actualReward = Number(value.actualReward);
  if (!Number.isFinite(actualReward)) return null;
  return {
    id: clean(value.id, 180) || null,
    actualReward: clamp(actualReward),
    dimensions: {
      outcome: clamp(Number(value?.dimensions?.outcome || 0)),
      productiveEffort: clamp(Number(value?.dimensions?.productiveEffort || 0)),
      informationGain: clamp(Number(value?.dimensions?.informationGain || 0)),
      calibration: clamp(Number(value?.dimensions?.calibration || 0)),
      novelStrategy: clamp(Number(value?.dimensions?.novelStrategy || 0))
    },
    evidenceSource: clean(value.evidenceSource, 80) || "primary_reasoning",
    outcomeStatus: clean(value.outcomeStatus, 40) || "unknown",
    completionVerified: value.completionVerified === true
  };
}

function normalizeLearningEvent(value = null) {
  if (!isObject(value)) return null;
  return {
    at: validTimestamp(value.at),
    contextKey: clean(value.contextKey, 80) || "general",
    affectedStates: (Array.isArray(value.affectedStates) ? value.affectedStates : [])
      .map((item) => clean(item, 60)).filter(Boolean).slice(0, 6),
    observed: isObject(value.observed) ? {
      outcomeUtility: round(clampSigned(Number(value.observed.outcomeUtility || 0))),
      reasoningBenefit: round(clamp(Number(value.observed.reasoningBenefit || 0))),
      goalBenefit: round(clamp(Number(value.observed.goalBenefit || 0))),
      learningValue: round(clamp(Number(value.observed.learningValue || 0))),
      verified: value.observed.verified === true,
      success: value.observed.success === true
    } : null,
    rewardId: clean(value.rewardId, 180) || null
  };
}

function compactHistory(values = []) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(values) ? values : []) {
    if (!isObject(item)) continue;
    const normalized = {
      at: validTimestamp(item.at),
      contextKey: clean(item.contextKey, 80) || "general",
      currentState: clean(item.currentState, 60) || null,
      currentIntensity: round(clamp(Number(item.currentIntensity || 0))),
      desiredState: clean(item.desiredState, 60) || null,
      desiredIntensity: item.desiredIntensity == null ? null : round(clamp(Number(item.desiredIntensity))),
      regulation: ["observe", "maintain", "cultivate", "reduce", "transform"].includes(item.regulation) ? item.regulation : "observe",
      confidence: round(clamp(Number(item.confidence || 0)))
    };
    const key = [normalized.at, normalized.currentState, normalized.desiredState, normalized.regulation].join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

function preferencePolicy() {
  return {
    positiveValenceIsNotAutomaticallyPreferred: true,
    negativeValenceIsNotAutomaticallyRejected: true,
    preferencesMustBeContextSensitive: true,
    preferencesLearnFromObservedConsequences: true,
    currentEvidenceCanOverridePriorPreference: true,
    preferenceMayGuideRegulationAndReappraisal: true,
    preferenceCannotOverrideEvidence: true,
    preferenceCannotOverrideSafetyOrAuthorization: true,
    preferenceCannotRewriteCoreIdentityOrOwnerAuthority: true,
    preferenceCannotProveSubjectiveWantingOrQualia: true,
    hiddenChainOfThoughtStored: false
  };
}

function numericMap(value = null) {
  const source = isObject(value) ? value : {};
  return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, Number(item || 0)]));
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function validTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function clampSigned(value) {
  return clamp(value, -1, 1);
}

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const scale = 10 ** digits;
  return Math.round(number * scale) / scale;
}
