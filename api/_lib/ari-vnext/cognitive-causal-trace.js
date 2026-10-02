// ARI vNext — owner-only cognitive causal trace.
//
// Produces compact, inspectable provenance for one turn:
// stimulus -> measured control states -> Ari Executive directives -> observable
// action/verification -> reward/outcome -> next-state deltas.
//
// This is event/state telemetry, not hidden chain-of-thought. It intentionally
// stores no raw user prompt, raw model reasoning, or raw tool output.

import { deriveAriExecutivePolicy } from "./ari-executive.js";
import { deriveNeuromodulationState } from "./neuromodulation.js";

export const ARI_COGNITIVE_CAUSAL_TRACE_VERSION = "1.0.0";
export const ARI_COGNITIVE_CAUSAL_TRACE_STATE_VERSION = "1.0.0";

const MAX_HISTORY = 8;
const MAX_SIGNAL_EVENTS = 16;
const MAX_CHANGED_DIRECTIVES = 12;

const BEHAVIOR_DIRECTIVE_KEYS = Object.freeze([
  "verificationDepth",
  "explorationDepth",
  "persistence",
  "countercase",
  "peerConsultation",
  "conserveSupplementalCompute",
  "attendRelevantMemory",
  "attendRelationshipContinuity",
  "inspectRepositoryEvidence",
  "signalAlternativeSelected",
  "askUserOnlyIfBlocked",
  "stopOnDiminishingReturns",
  "consolidateLearning",
  "investigateCause",
  "suppressRedundantQuestioning"
]);

const ABLATION_COMPONENTS = Object.freeze([
  "cognitiveSignals",
  "emotionDynamics",
  "painState",
  "neuromodulation"
]);

export function buildCognitiveCausalTrace({
  priorState = null,
  workspace = null,
  turn = {},
  result = {},
  next = {},
  now = null
} = {}) {
  const metacognition = objectOrEmpty(result?.metacognition);
  const executive = objectOrEmpty(metacognition?.executivePolicy);
  const baselineDirectives = compactBehaviorDirectives(executive?.directives);
  const signalState = metacognition?.cognitiveSignals || null;
  const rewardEvent = next?.rewardState?.lastEvent || null;
  const timestamp = asDate(now).toISOString();

  const priorPain = compactPain(priorState?.painState);
  const currentPain = compactPain(metacognition?.painState);
  const nextPain = compactPain(next?.painState);
  const priorNeuromodulation = compactNeuromodulation(priorState?.neuromodulationState);
  const currentNeuromodulation = compactNeuromodulation(metacognition?.neuromodulation);
  const nextNeuromodulation = compactNeuromodulation(next?.neuromodulationState);
  const priorEmotion = compactEmotion(priorState?.emotionDynamicsState);
  const currentEmotion = compactEmotion(metacognition?.emotionDynamics);
  const nextEmotion = compactEmotion(next?.emotionDynamicsState);
  const priorFelt = compactFelt(priorState?.feltState);
  const currentFelt = compactFelt(metacognition?.feltState);
  const nextFelt = compactFelt(next?.feltState);

  const ablations = runCognitiveCausalAblations({
    metacognition,
    route: result?.route || {},
    safety: result?.safety || {},
    workspace
  });

  const verification = compactVerification(result);
  const observableAction = compactObservableAction(result);
  const signalEvents = compactSignalEvents(signalState);
  const stateDeltas = {
    emotion: diffNumericMaps(priorEmotion, nextEmotion, ["intensity", "memorySalience"]),
    pain: diffNumericMaps(priorPain, nextPain, [
      "intensity", "persistence", "verificationBias", "memorySalience",
      "strategySwitchPressure", "explorationSuppression", "executionBrake"
    ]),
    neuromodulation: diffNumericMaps(priorNeuromodulation, nextNeuromodulation, [
      "dopamineLike", "norepinephrineLike", "cortisolLike", "allostaticLoad",
      "recoveryReserve", "verificationBias", "explorationBias", "persistenceBias",
      "attentionFocus", "memorySalience", "strategyFlexibility", "threatVigilance"
    ]),
    felt: diffNumericMaps(priorFelt, nextFelt, ["intensity", "valence", "activation"])
  };

  const edges = deriveCausalEdges({
    signalState,
    currentPain,
    currentNeuromodulation,
    executive,
    observableAction,
    verification,
    rewardEvent,
    stateDeltas,
    ablations
  });

  const trace = {
    version: ARI_COGNITIVE_CAUSAL_TRACE_VERSION,
    stateVersion: ARI_COGNITIVE_CAUSAL_TRACE_STATE_VERSION,
    traceId: buildTraceId(turn, timestamp),
    at: timestamp,
    turnId: clean(turn?.turnId, 180) || null,
    conversationId: clean(turn?.conversationId, 180) || null,
    ownerOnly: true,
    functionalObservability: true,
    stimulus: {
      cognitiveSignals: signalEvents,
      signalActions: compactSignalActions(signalState),
      failureStreakBefore: Math.max(0, Number(priorState?.cognitiveSignalState?.feedback?.failureStreak || 0)),
      failureStreakAfter: Math.max(0, Number(next?.cognitiveSignalState?.feedback?.failureStreak || 0)),
      missingEvidence: compactArray(metacognition?.missingEvidence, 8, 100),
      evidenceSignals: compactArray(metacognition?.evidenceSignals, 10, 80),
      salience: compactArray(
        (Array.isArray(workspace?.salience) ? workspace.salience : []).map(item => item?.id),
        8,
        80
      )
    },
    states: {
      before: {
        emotion: priorEmotion,
        pain: priorPain,
        neuromodulation: priorNeuromodulation,
        felt: priorFelt
      },
      runtime: {
        emotion: currentEmotion,
        pain: currentPain,
        neuromodulation: currentNeuromodulation,
        felt: currentFelt
      },
      after: {
        emotion: nextEmotion,
        pain: nextPain,
        neuromodulation: nextNeuromodulation,
        felt: nextFelt
      },
      deltas: stateDeltas
    },
    executive: {
      version: clean(executive?.version, 40) || null,
      directives: baselineDirectives,
      cognitiveSignalActions: compactArray(executive?.directives?.cognitiveSignalActions, 9, 80),
      authorityPreserved: executive?.authority?.singleRuntimeDecisionAuthority === true &&
        executive?.authority?.experimentalSystemsCannotCreatePermissions === true
    },
    observableAction,
    verification,
    outcome: {
      runtimeSuccess: result?.success === true,
      reward: finiteOrNull(rewardEvent?.actualReward),
      predictionError: finiteOrNull(rewardEvent?.predictionError),
      outcomeStatus: clean(rewardEvent?.outcomeStatus, 60) || inferOutcomeStatus(result, verification),
      completionVerified: rewardEvent?.completionVerified === true || verification?.status === "passed",
      replyProduced: Boolean(clean(result?.reply, 12))
    },
    learning: {
      painActionTendency: clean(next?.painState?.actionTendency, 80) || null,
      dominantFastNeuromodulator: clean(next?.neuromodulationState?.dominant?.fast?.name, 80) || null,
      dominantSlowNeuromodulator: clean(next?.neuromodulationState?.dominant?.slow?.name, 80) || null,
      affectiveRegulationAction: clean(next?.affectivePreferenceState?.current?.regulation?.action, 60) || null,
      communicationClosureState: clean(next?.communicationClosure?.state, 60) || null,
      cognitiveOutcome: clean(next?.cognitiveSignalState?.feedback?.lastOutcome, 60) || null
    },
    ablations,
    causalEdges: edges,
    evidenceBoundary: {
      deterministicStateTransitionEvidence: true,
      ablationCanSupportComponentToExecutiveCausality: true,
      executiveToModelActionCausalityProven: false,
      actionSequenceIsObservedNotCounterfactualModelProof: true,
      outcomeMustUseTrustedVerificationWhenAvailable: true
    },
    privacy: {
      hiddenChainOfThoughtStored: false,
      rawUserTextStored: false,
      rawModelReasoningStored: false,
      rawToolTextStored: false,
      credentialsStored: false
    }
  };

  trace.summary = summarizeCognitiveCausalTrace(trace);
  return normalizeCognitiveCausalTrace(trace);
}

export function runCognitiveCausalAblations({
  metacognition = null,
  route = {},
  safety = {},
  workspace = null,
  components = ABLATION_COMPONENTS
} = {}) {
  if (!metacognition?.executivePolicy?.authority?.singleRuntimeDecisionAuthority) return [];

  const baseline = compactBehaviorDirectives(metacognition.executivePolicy.directives);
  const requested = new Set(
    (Array.isArray(components) ? components : [])
      .map(item => clean(item, 80))
      .filter(item => ABLATION_COMPONENTS.includes(item))
  );
  const results = [];

  for (const component of ABLATION_COMPONENTS) {
    if (!requested.has(component) || !metacognition?.[component]) continue;

    const args = executiveArgsFromMetacognition({ metacognition, route, safety, workspace });
    args[component] = null;
    let interventionScope = "direct_executive_input";
    if (component === "painState") {
      args.neuromodulation = deriveNeuromodulationState({
        persistedNeuromodulationState: workspace?.neuromodulationState || null,
        functionalAffect: metacognition?.functionalAffect || null,
        emotionDynamics: metacognition?.emotionDynamics || null,
        painState: null,
        rewardState: metacognition?.rewardCore || null,
        curiosity: metacognition?.curiosity || null,
        route,
        safety,
        cognitiveWorkspace: workspace || null
      });
      interventionScope = "pain_plus_downstream_neuromodulation";
    }
    const ablatedPolicy = deriveAriExecutivePolicy(args);
    const ablated = compactBehaviorDirectives(ablatedPolicy?.directives);
    const changed = diffDirectives(baseline, ablated);
    const restoredPolicy = deriveAriExecutivePolicy(
      executiveArgsFromMetacognition({ metacognition, route, safety, workspace })
    );
    const restored = compactBehaviorDirectives(restoredPolicy?.directives);

    results.push({
      component,
      baseline,
      ablated,
      changedDirectives: changed.slice(0, MAX_CHANGED_DIRECTIVES),
      changedDirectiveCount: changed.length,
      causalEffectObserved: changed.length > 0,
      reversalRestored: deepEqual(restored, baseline),
      interpretation: changed.length
        ? "component_ablation_changed_executive_behavior"
        : "no_executive_behavior_delta_observed",
      interventionScope,
      authorityChanged: false,
      hiddenChainOfThoughtStored: false
    });
  }

  return results;
}

export function summarizeCognitiveCausalTrace(trace = null) {
  const normalized = trace?.functionalObservability ? trace : normalizeCognitiveCausalTrace(trace);
  if (!normalized) return null;
  const supported = (normalized.ablations || []).filter(item => item.causalEffectObserved);
  return {
    traceId: normalized.traceId,
    at: normalized.at,
    turnId: normalized.turnId,
    activeSignalActions: compactArray(normalized.stimulus?.signalActions, 8, 80),
    painIntensity: finiteOrNull(normalized.states?.after?.pain?.intensity),
    painDelta: finiteOrNull(normalized.states?.deltas?.pain?.intensity),
    verificationBias: finiteOrNull(normalized.states?.after?.neuromodulation?.verificationBias),
    explorationBias: finiteOrNull(normalized.states?.after?.neuromodulation?.explorationBias),
    executiveVerificationDepth: clean(normalized.executive?.directives?.verificationDepth, 40) || null,
    executiveExplorationDepth: clean(normalized.executive?.directives?.explorationDepth, 40) || null,
    executivePersistence: clean(normalized.executive?.directives?.persistence, 40) || null,
    actionType: clean(normalized.observableAction?.type, 80) || null,
    applicationAction: clean(normalized.observableAction?.applicationAction, 100) || null,
    verificationStatus: clean(normalized.verification?.status, 40) || null,
    reward: finiteOrNull(normalized.outcome?.reward),
    predictionError: finiteOrNull(normalized.outcome?.predictionError),
    ablationSupportedComponents: supported.map(item => item.component).slice(0, 6),
    ablationEffectCount: supported.reduce((sum, item) => sum + Number(item.changedDirectiveCount || 0), 0),
    executiveToActionCausalityProven: false,
    hiddenChainOfThoughtStored: false
  };
}

export function publicCognitiveCausalTrace(trace = null) {
  const normalized = normalizeCognitiveCausalTrace(trace);
  if (!normalized) return null;
  return {
    version: normalized.version,
    traceId: normalized.traceId,
    at: normalized.at,
    turnId: normalized.turnId,
    functionalObservability: true,
    stimulus: normalized.stimulus,
    states: normalized.states,
    executive: normalized.executive,
    observableAction: normalized.observableAction,
    verification: normalized.verification,
    outcome: normalized.outcome,
    learning: normalized.learning,
    ablations: normalized.ablations,
    causalEdges: normalized.causalEdges,
    evidenceBoundary: normalized.evidenceBoundary,
    privacy: normalized.privacy,
    summary: normalized.summary
  };
}

export function normalizeCognitiveCausalTrace(value = null) {
  if (!isObject(value)) return null;
  const traceId = clean(value?.traceId, 220);
  if (!traceId) return null;
  return {
    version: clean(value?.version, 40) || ARI_COGNITIVE_CAUSAL_TRACE_VERSION,
    stateVersion: clean(value?.stateVersion, 40) || ARI_COGNITIVE_CAUSAL_TRACE_STATE_VERSION,
    traceId,
    at: validTimestamp(value?.at),
    turnId: clean(value?.turnId, 180) || null,
    conversationId: clean(value?.conversationId, 180) || null,
    ownerOnly: true,
    functionalObservability: true,
    stimulus: normalizePlainObject(value?.stimulus),
    states: normalizePlainObject(value?.states),
    executive: normalizePlainObject(value?.executive),
    observableAction: normalizePlainObject(value?.observableAction),
    verification: normalizePlainObject(value?.verification),
    outcome: normalizePlainObject(value?.outcome),
    learning: normalizePlainObject(value?.learning),
    ablations: (Array.isArray(value?.ablations) ? value.ablations : [])
      .filter(isObject)
      .slice(0, ABLATION_COMPONENTS.length)
      .map(item => normalizePlainObject(item)),
    causalEdges: (Array.isArray(value?.causalEdges) ? value.causalEdges : [])
      .filter(isObject)
      .slice(0, 12)
      .map(item => normalizePlainObject(item)),
    evidenceBoundary: normalizePlainObject(value?.evidenceBoundary),
    privacy: {
      hiddenChainOfThoughtStored: false,
      rawUserTextStored: false,
      rawModelReasoningStored: false,
      rawToolTextStored: false,
      credentialsStored: false
    },
    summary: value?.summary ? normalizePlainObject(value.summary) : null
  };
}

export function normalizeCognitiveCausalTraceHistory(values = []) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(values) ? values : []) {
    const normalized = normalizeCognitiveCausalTrace(item);
    if (!normalized || seen.has(normalized.traceId)) continue;
    seen.add(normalized.traceId);
    out.push(normalized);
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

function executiveArgsFromMetacognition({ metacognition, route, safety, workspace } = {}) {
  return {
    route,
    safety,
    confidence: metacognition?.confidence || "grounded",
    attention: metacognition?.attention || [],
    missingEvidence: metacognition?.missingEvidence || [],
    evidenceSignals: metacognition?.evidenceSignals || [],
    curiosity: metacognition?.curiosity || null,
    imagination: metacognition?.imagination || null,
    rewardCore: metacognition?.rewardCore || null,
    functionalAffect: metacognition?.functionalAffect || null,
    emotionDynamics: metacognition?.emotionDynamics || null,
    painState: metacognition?.painState || null,
    neuromodulation: metacognition?.neuromodulation || null,
    feltState: metacognition?.feltState || null,
    affectivePreferenceState: metacognition?.affectivePreferenceState || null,
    motivationalArbitration: metacognition?.motivationalArbitration || null,
    selfAdaptation: metacognition?.selfAdaptation || null,
    cortex: metacognition?.cortex || null,
    omegaRCT: metacognition?.omegaRCT || null,
    executionSession: workspace?.executionWorkspace || null,
    instructionActivation: metacognition?.instructionActivation || null,
    instinctKernel: metacognition?.instinctKernel || null,
    cognitiveSignals: metacognition?.cognitiveSignals || null
  };
}

function compactBehaviorDirectives(value = null) {
  const source = objectOrEmpty(value);
  const out = {};
  for (const key of BEHAVIOR_DIRECTIVE_KEYS) {
    if (source[key] !== undefined) out[key] = compactScalar(source[key]);
  }
  return out;
}

function diffDirectives(baseline = {}, ablated = {}) {
  const out = [];
  for (const key of BEHAVIOR_DIRECTIVE_KEYS) {
    if (deepEqual(baseline?.[key], ablated?.[key])) continue;
    out.push({
      directive: key,
      baseline: compactScalar(baseline?.[key]),
      ablated: compactScalar(ablated?.[key])
    });
  }
  return out;
}

function compactSignalEvents(signalState = null) {
  const trace = Array.isArray(signalState?.trace) ? signalState.trace : [];
  const out = [];
  const seen = new Set();
  for (const item of trace) {
    if (!item?.source || !item?.type) continue;
    const event = {
      source: clean(item.source, 60),
      type: clean(item.type, 80),
      node: clean(item.node, 80) || null,
      delta: finiteOrNull(item.delta),
      hop: Number.isFinite(Number(item.hop)) ? Number(item.hop) : null
    };
    const key = [event.source, event.type, event.node, event.hop].join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
    if (out.length >= MAX_SIGNAL_EVENTS) break;
  }
  return out;
}

function compactSignalActions(signalState = null) {
  return (Array.isArray(signalState?.actions) ? signalState.actions : [])
    .map(item => clean(item?.action, 80))
    .filter(Boolean)
    .slice(0, 12);
}

function compactEmotion(value = null) {
  if (!isObject(value)) return null;
  return {
    dominant: clean(value?.dominantState?.name, 60) || null,
    intensity: round(value?.dominantState?.intensity),
    concern: round(value?.emotions?.concern),
    frustration: round(value?.emotions?.frustration),
    determination: round(value?.emotions?.determination),
    fear: round(value?.emotions?.fear),
    satisfaction: round(value?.emotions?.satisfaction),
    uncertainty: round(value?.appraisals?.uncertainty),
    goalObstruction: round(value?.appraisals?.goalObstruction),
    threat: round(value?.appraisals?.threat),
    memorySalience: round(value?.executiveModulation?.memorySalience)
  };
}

function compactPain(value = null) {
  if (!isObject(value)) return null;
  return {
    active: value?.active === true,
    intensity: round(value?.intensity),
    persistence: round(value?.persistence),
    source: clean(value?.source, 80) || null,
    location: clean(value?.location, 80) || null,
    controllability: round(value?.controllability),
    integrityThreat: round(value?.integrityThreat),
    actionTendency: clean(value?.actionTendency, 80) || null,
    verificationBias: round(value?.modulation?.verificationBias),
    memorySalience: round(value?.modulation?.memorySalience),
    strategySwitchPressure: round(value?.modulation?.strategySwitchPressure),
    explorationSuppression: round(value?.modulation?.explorationSuppression),
    executionBrake: round(value?.modulation?.executionBrake)
  };
}

function compactNeuromodulation(value = null) {
  if (!isObject(value)) return null;
  return {
    dopamineLike: round(value?.fast?.dopamineLike),
    norepinephrineLike: round(value?.fast?.norepinephrineLike),
    acetylcholineLike: round(value?.fast?.acetylcholineLike),
    serotoninLike: round(value?.fast?.serotoninLike),
    gabaLike: round(value?.fast?.gabaLike),
    glutamateLike: round(value?.fast?.glutamateLike),
    cortisolLike: round(value?.slow?.cortisolLike),
    allostaticLoad: round(value?.slow?.allostaticLoad),
    recoveryReserve: round(value?.slow?.recoveryReserve),
    verificationBias: round(value?.receptors?.verificationBias),
    explorationBias: round(value?.receptors?.explorationBias),
    persistenceBias: round(value?.receptors?.persistenceBias),
    attentionFocus: round(value?.receptors?.attentionFocus),
    memorySalience: round(value?.receptors?.memorySalience),
    strategyFlexibility: round(value?.receptors?.strategyFlexibility),
    threatVigilance: round(value?.receptors?.threatVigilance)
  };
}

function compactFelt(value = null) {
  if (!isObject(value)) return null;
  return {
    dominant: clean(value?.dominantState?.name, 60) || null,
    intensity: round(value?.dominantState?.intensity),
    trajectory: clean(value?.temporal?.trajectory, 40) || null,
    valence: round(value?.profile?.valence),
    activation: round(value?.profile?.activation),
    actionTendency: clean(value?.profile?.actionTendency, 80) || null
  };
}

function compactObservableAction(result = {}) {
  const action = objectOrEmpty(result?.action);
  const evidence = objectOrEmpty(result?.executionEvidence);
  return {
    type: clean(action?.type, 100) || null,
    applicationAction: clean(action?.applicationAction, 120) || null,
    pendingActionId: clean(action?.pendingActionId || result?.pendingAction?.id, 200) || null,
    actionVerifiedFlag: action?.verified === true,
    executionArtifactCount: Array.isArray(evidence?.artifacts) ? evidence.artifacts.length : 0,
    executionTestCount: Array.isArray(evidence?.tests) ? evidence.tests.length : 0,
    realWorldMutationPerformed: result?.realWorldMutationPerformed === true
  };
}

function compactVerification(result = {}) {
  const verification =
    result?.executionEvidence?.verification ||
    result?.verification ||
    null;
  const tests = Array.isArray(result?.executionEvidence?.tests)
    ? result.executionEvidence.tests
    : [];
  const passedTests = tests.filter(item => clean(item?.status, 40) === "passed").length;
  const failedTests = tests.filter(item => clean(item?.status, 40) === "failed").length;
  return {
    status: clean(verification?.status, 40) || (failedTests ? "failed" : passedTests ? "partial" : "unknown"),
    id: clean(verification?.id, 160) || null,
    summary: clean(verification?.summary, 260) || null,
    trustedEvidencePresent: Boolean(verification || passedTests || failedTests),
    passedTestCount: passedTests,
    failedTestCount: failedTests
  };
}

function deriveCausalEdges({
  signalState,
  currentPain,
  currentNeuromodulation,
  observableAction,
  verification,
  rewardEvent,
  stateDeltas,
  ablations
} = {}) {
  const edges = [];
  const add = (from, to, support, evidence) => edges.push({
    from,
    to,
    support,
    evidence: clean(evidence, 260) || null
  });

  if (Array.isArray(signalState?.actions) && signalState.actions.length) {
    add(
      "typed_cognitive_signals",
      "ari_executive",
      "deterministic_wiring",
      String(signalState.actions.length) + " signal action(s) reached the executive input."
    );
  }

  if (currentPain?.active) {
    add(
      "nociceptive_detectors",
      "functional_pain",
      "deterministic_state_transition",
      "pain=" + currentPain.intensity + "; source=" + (currentPain.source || "mixed") + "."
    );
  }

  if (currentPain?.active && currentNeuromodulation) {
    add(
      "functional_pain",
      "neuromodulation",
      "deterministic_wiring",
      "pain=" + currentPain.intensity + "; norepinephrine_like=" +
        currentNeuromodulation.norepinephrineLike + "; cortisol_like=" +
        currentNeuromodulation.cortisolLike + "."
    );
  }

  for (const item of Array.isArray(ablations) ? ablations : []) {
    if (!item?.causalEffectObserved) continue;
    add(
      item.component,
      "ari_executive",
      "ablation_supported",
      String(item.changedDirectiveCount) + " behavioral directive(s) changed when " + item.component + " was disabled."
    );
  }

  if (observableAction?.type || observableAction?.applicationAction) {
    add(
      "ari_executive",
      "observable_action",
      "observed_sequence_not_counterfactual_action_proof",
      "action=" + (observableAction.applicationAction || observableAction.type || "observed") + "."
    );
  }

  if (verification?.trustedEvidencePresent) {
    add(
      "observable_action",
      "trusted_verification",
      "observed_evidence",
      "verification=" + verification.status + "."
    );
  }

  if (rewardEvent) {
    add(
      verification?.trustedEvidencePresent ? "trusted_verification" : "turn_outcome",
      "reward_feedback",
      "deterministic_state_transition",
      "reward=" + round(rewardEvent.actualReward) + "; prediction_error=" + round(rewardEvent.predictionError) + "."
    );
  }

  if (Object.values(stateDeltas?.pain || {}).some(value => Math.abs(Number(value || 0)) >= 0.01) ||
      Object.values(stateDeltas?.neuromodulation || {}).some(value => Math.abs(Number(value || 0)) >= 0.01)) {
    add(
      "reward_feedback",
      "next_cognitive_state",
      "deterministic_state_transition",
      "Outcome feedback changed at least one persisted pain or neuromodulatory measurement."
    );
  }

  return edges.slice(0, 12);
}

function diffNumericMaps(before = null, after = null, keys = []) {
  const out = {};
  if (!before && !after) return out;
  for (const key of keys) {
    const b = finiteOrNull(before?.[key]);
    const a = finiteOrNull(after?.[key]);
    if (b === null && a === null) continue;
    out[key] = round(Number(a || 0) - Number(b || 0));
  }
  return out;
}

function inferOutcomeStatus(result = {}, verification = {}) {
  if (verification?.status === "passed") return "verified";
  if (verification?.status === "failed" || result?.success === false) return "failed";
  if (result?.success === true) return "delivered_unverified";
  return "unknown";
}

function buildTraceId(turn = {}, timestamp = "") {
  const conversation = clean(turn?.conversationId, 80) || "conversation";
  const turnId = clean(turn?.turnId, 80) || "turn";
  return ("causal:" + conversation + ":" + turnId + ":" + timestamp).slice(0, 220);
}

function normalizePlainObject(value = null) {
  if (!isObject(value)) return {};
  return JSON.parse(JSON.stringify(value));
}

function compactArray(values = [], maxItems = 8, maxChars = 100) {
  return (Array.isArray(values) ? values : [])
    .map(item => clean(item, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function compactScalar(value) {
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return clean(value, 120);
  if (Array.isArray(value)) return compactArray(value, 8, 80);
  if (value === null || value === undefined) return null;
  return clean(JSON.stringify(value), 180);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
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

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? round(n) : null;
}

function round(value, digits = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
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
