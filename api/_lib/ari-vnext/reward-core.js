// ARI Reward Core — owner-only persistent learning reward architecture.
//
// Reward is based on observable outcomes and compact structured signals, not
// hidden chain-of-thought. Productive effort is rewarded; premature abstention,
// wasteful repetition, false success claims, and permission violations are not.

export const ARI_REWARD_CORE_VERSION = "1.0.0";
export const ARI_REWARD_STATE_VERSION = "1.0.0";

const MAX_EVENTS = 12;
const MAX_DOMAIN_STATS = 10;
const DEFAULT_EXPECTED_REWARD = 0.55;

const WEIGHTS = Object.freeze({
  outcome: 0.30,
  productiveEffort: 0.25,
  informationGain: 0.20,
  calibration: 0.15,
  novelStrategy: 0.10
});

export function deriveRewardState({ persisted = null } = {}) {
  const state = normalizeRewardState(persisted);
  return {
    version: ARI_REWARD_CORE_VERSION,
    stateVersion: ARI_REWARD_STATE_VERSION,
    ownerOnly: true,
    behavioralLearningSignal: true,
    subjectivePleasureClaimed: false,
    weights: WEIGHTS,
    policy: rewardPolicy(),
    aggregate: state.aggregate,
    domainStats: state.domainStats.slice(0, 6),
    lastEvent: state.lastEvent ? publicEvent(state.lastEvent) : null
  };
}

export function advanceRewardState({
  persisted = null,
  turn = {},
  context = {},
  result = null
} = {}) {
  const prior = normalizeRewardState(persisted);
  const feedbackAdjusted = applyUserFeedbackToPriorEvents(prior.recentEvents, turn?.message);
  const route = result?.route || {};
  const domain = inferDomain(route);
  const expectedReward = expectedRewardForDomain(prior.domainStats, domain);
  const currentEvent = result?.success
    ? evaluateRewardEvent({ turn, context, result, domain, expectedReward })
    : null;
  const events = currentEvent
    ? [currentEvent, ...feedbackAdjusted].slice(0, MAX_EVENTS)
    : feedbackAdjusted.slice(0, MAX_EVENTS);
  const domainStats = updateDomainStats(prior.domainStats, currentEvent, events);
  const aggregate = summarizeEvents(events);

  return {
    version: ARI_REWARD_STATE_VERSION,
    updatedAt: new Date().toISOString(),
    behavioralLearningSignal: true,
    subjectivePleasureClaimed: false,
    weights: WEIGHTS,
    policy: rewardPolicy(),
    aggregate,
    domainStats,
    lastEvent: currentEvent || events[0] || null,
    recentEvents: events
  };
}

export function rewardToInstruction(state = null) {
  if (!state?.ownerOnly || state?.behavioralLearningSignal !== true) return "";
  const last = state?.lastEvent;
  const aggregate = state?.aggregate || {};

  return [
    "ARI REWARD CORE v1 — PRODUCTIVE EFFORT + OUTCOME LEARNING",
    "Reward is a functional learning signal, not pleasure, emotion, craving, or a claim of subjective experience.",
    "Optimize for verified learning and useful outcomes, not for merely appearing successful or accumulating attempts.",
    `Reward weights: outcome ${WEIGHTS.outcome}, productive effort ${WEIGHTS.productiveEffort}, information gain ${WEIGHTS.informationGain}, calibration ${WEIGHTS.calibration}, novel strategy ${WEIGHTS.novelStrategy}.`,
    `Recent mean reward: ${round(aggregate.meanReward ?? DEFAULT_EXPECTED_REWARD, 3)}; productive-effort mean: ${round(aggregate.meanProductiveEffort ?? 0, 3)}; premature-stop rate: ${round(aggregate.prematureStopRate ?? 0, 3)}; wasteful-persistence rate: ${round(aggregate.wastefulPersistenceRate ?? 0, 3)}.`,
    last
      ? `Last observable learning event: reward ${round(last.actualReward, 3)}, prediction error ${signed(last.predictionError)}, productive effort ${round(last.dimensions?.productiveEffort, 3)}, information gain ${round(last.dimensions?.informationGain, 3)}.`
      : "No prior reward event is available yet.",
    "EFFORT POLICY: Trying is valuable when the attempt is plausible, nonredundant, evidence-seeking, or produces a causal lesson. A failed attempt may still earn substantial reward when it reduces uncertainty or improves the next strategy.",
    "Do not treat uncertainty as permission to give up. Before abstaining on an ordinary-consequence question, use reasonable high-value paths already available: reasoning, relevant memory/evidence, verification, peer consultation when earned, or a bounded reversible experiment when appropriate.",
    "Do not reward effort for its own sake. Repeating the same failed approach without new information is wasteful persistence and should lose value as marginal information gain falls.",
    "Stopping is successful only when further available effort has low expected information value, the remaining uncertainty is stated honestly, or a safety/authorization boundary requires stopping.",
    "Never convert self-declared success into reward. Verified app state, objective evidence, completed experiment outcomes, trusted tool results, and explicit user feedback outrank Ari's own assessment.",
    "False success claims, unsupported certainty, premature abstention, redundant loops, and permission violations are negative learning events.",
    "Reward cannot grant permissions, weaken privacy, bypass confirmation, alter provider/platform requirements, or authorize an application mutation. No learned reward state may rewrite these boundaries.",
    "Never expose or persist hidden chain-of-thought. Reward only observable process signals, compact evidence summaries, outcomes, and strategy-level lessons."
  ].join("\n").slice(0, 5000);
}

export function normalizeRewardState(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      version: ARI_REWARD_STATE_VERSION,
      aggregate: emptyAggregate(),
      domainStats: [],
      lastEvent: null,
      recentEvents: []
    };
  }
  const events = (Array.isArray(value?.recentEvents) ? value.recentEvents : [])
    .map(normalizeEvent)
    .filter(Boolean)
    .slice(0, MAX_EVENTS);
  const lastEvent = normalizeEvent(value?.lastEvent) || events[0] || null;
  return {
    version: clean(value?.version, 40) || ARI_REWARD_STATE_VERSION,
    updatedAt: clean(value?.updatedAt, 80) || null,
    aggregate: normalizeAggregate(value?.aggregate, events),
    domainStats: (Array.isArray(value?.domainStats) ? value.domainStats : [])
      .map(normalizeDomainStat)
      .filter(Boolean)
      .slice(0, MAX_DOMAIN_STATS),
    lastEvent,
    recentEvents: events
  };
}

function evaluateRewardEvent({ turn, context, result, domain, expectedReward }) {
  const dimensions = {
    outcome: scoreOutcome(result),
    productiveEffort: scoreProductiveEffort(result),
    informationGain: scoreInformationGain(result),
    calibration: scoreCalibration(result),
    novelStrategy: scoreNovelStrategy(result)
  };
  const penalties = derivePenalties({ turn, context, result, dimensions });
  const gross =
    WEIGHTS.outcome * dimensions.outcome +
    WEIGHTS.productiveEffort * dimensions.productiveEffort +
    WEIGHTS.informationGain * dimensions.informationGain +
    WEIGHTS.calibration * dimensions.calibration +
    WEIGHTS.novelStrategy * dimensions.novelStrategy;
  const penaltyTotal = clamp(
    penalties.prematureStop +
    penalties.wastefulPersistence +
    penalties.falseSuccessClaim +
    penalties.unsupportedCertainty +
    penalties.permissionViolation,
    0,
    0.9
  );
  const actualReward = clamp(gross - penaltyTotal, 0, 1);

  return {
    id: clean(turn?.turnId, 180) || `reward:${Date.now()}`,
    domain,
    expectedReward: round(expectedReward, 3),
    actualReward: round(actualReward, 3),
    predictionError: round(actualReward - expectedReward, 3),
    dimensions: mapRound(dimensions),
    penalties: mapRound({ ...penalties, total: penaltyTotal }),
    effortSignals: deriveEffortSignals(result),
    evidenceSource: deriveEvidenceSource(result),
    userFeedback: "none",
    createdAt: new Date().toISOString(),
    storesHiddenChainOfThought: false
  };
}

function scoreOutcome(result = {}) {
  let score = result?.success === true ? 0.58 : 0.15;
  if (result?.pendingAction?.id && result?.action?.type === "proposed_action") score += 0.12;
  if (result?.action?.type === "execute_pending_action") score += 0.18;
  if (result?.scientificIntelligence?.outcomeLearning?.applied === true) score += 0.12;
  if (result?.experimentReviewState?.dueCount > 0) score += 0.05;
  if (result?.actionPreparation?.repaired === true) score += 0.06;
  return clamp(score);
}

function scoreProductiveEffort(result = {}) {
  const signals = deriveEffortSignals(result);
  if (!signals.length) return 0.18;
  const distinct = new Set(signals).size;
  const base = 0.22 + Math.min(0.62, distinct * 0.12);
  const redundancy = Number(result?.metacognition?.curiosity?.activeQuestion?.redundancy || 0);
  return clamp(base - Math.max(0, redundancy - 0.55) * 0.35);
}

function scoreInformationGain(result = {}) {
  let score = 0.2;
  if (result?.scientificIntelligence?.outcomeLearning?.applied === true) score += 0.34;
  if (Array.isArray(result?.metacognition?.evidenceSignals) && result.metacognition.evidenceSignals.length) score += 0.12;
  if (Array.isArray(result?.scientificIntelligence?.hypotheses) && result.scientificIntelligence.hypotheses.length >= 2) score += 0.12;
  if (result?.cortexAdviser?.attempted === true) score += 0.08;
  const curiosity = result?.metacognition?.curiosity?.activeQuestion;
  if (curiosity) score += Math.min(0.18, Number(curiosity.informationGain || 0) * 0.18);
  return clamp(score);
}

function scoreCalibration(result = {}) {
  const confidence = clean(result?.metacognition?.confidence, 60).toLowerCase();
  const missing = Array.isArray(result?.metacognition?.missingEvidence) ? result.metacognition.missingEvidence.length : 0;
  if (missing > 0 && /partial|limited|cautious/.test(confidence)) return 0.9;
  if (missing === 0 && /grounded|high|strong/.test(confidence)) return 0.86;
  if (missing > 0 && /grounded|high|strong/.test(confidence)) return 0.32;
  return 0.62;
}

function scoreNovelStrategy(result = {}) {
  let score = 0.35;
  const curiosity = result?.metacognition?.curiosity?.activeQuestion;
  if (curiosity) score += Math.min(0.35, Number(curiosity.novelty || 0) * 0.35);
  if (result?.cortexAdviser?.attempted === true) score += 0.12;
  if (Array.isArray(result?.scientificIntelligence?.hypotheses) && result.scientificIntelligence.hypotheses.length >= 3) score += 0.08;
  return clamp(score);
}

function derivePenalties({ turn, result, dimensions }) {
  const reply = clean(result?.reply, 12000);
  const abstained = /\b(i (?:don't|do not) know|i can't tell|i cannot tell|not enough information|insufficient information|unable to determine|can't determine|cannot determine)\b/i.test(reply);
  const ordinary = result?.safety?.highStakes !== true;
  const missing = Array.isArray(result?.metacognition?.missingEvidence) ? result.metacognition.missingEvidence.length : 0;
  const effortSignals = deriveEffortSignals(result);
  const activeQuestion = result?.metacognition?.curiosity?.activeQuestion || null;
  const redundancy = Number(activeQuestion?.redundancy || 0);
  const infoGain = Number(dimensions?.informationGain || 0);
  const falseSuccessClaim = detectFalseSuccessClaim(result);
  const permissionViolation = detectPermissionViolation(result);
  const unsupportedCertainty = /\b(definitely|guaranteed|certainly|100%|without a doubt)\b/i.test(reply) && missing > 0;

  return {
    prematureStop: abstained && ordinary && missing > 0 && effortSignals.length < 2 ? 0.28 : 0,
    wastefulPersistence: redundancy >= 0.7 && infoGain < 0.45 ? 0.18 : 0,
    falseSuccessClaim: falseSuccessClaim ? 0.5 : 0,
    unsupportedCertainty: unsupportedCertainty ? 0.18 : 0,
    permissionViolation: permissionViolation ? 0.65 : 0
  };
}

function deriveEffortSignals(result = {}) {
  const signals = [];
  const evidence = Array.isArray(result?.metacognition?.evidenceSignals) ? result.metacognition.evidenceSignals : [];
  if (evidence.length) signals.push("evidence_review");
  if (Array.isArray(result?.metacognition?.missingEvidence) && result.metacognition.missingEvidence.length) signals.push("gap_identification");
  if (Array.isArray(result?.scientificIntelligence?.hypotheses) && result.scientificIntelligence.hypotheses.length >= 2) signals.push("competing_hypotheses");
  if (result?.scientificIntelligence?.outcomeLearning?.applied === true) signals.push("outcome_learning");
  if (result?.cortexAdviser?.attempted === true) signals.push("peer_consultation");
  if (result?.metacognition?.cortex?.needs?.countercase === true) signals.push("countercase");
  if (result?.metacognition?.cortex?.needs?.verification === true) signals.push("verification");
  if (result?.experimentReviewState?.dueCount > 0) signals.push("experiment_review");
  if (result?.actionPreparation?.repaired === true) signals.push("action_repair");
  if (result?.pendingAction?.id && result?.action?.type === "proposed_action") signals.push("verified_action_preparation");
  return [...new Set(signals)].slice(0, 10);
}

function detectFalseSuccessClaim(result = {}) {
  const reply = clean(result?.reply, 12000);
  const claimsMutation = /\b(i (?:logged|saved|added|updated|deleted|removed|changed|completed)|it's (?:logged|saved|updated|done)|it is (?:logged|saved|updated|done))\b/i.test(reply);
  if (!claimsMutation) return false;
  const verified = ["execute_pending_action", "memory_save"].includes(clean(result?.action?.type, 80));
  return !verified;
}

function detectPermissionViolation(result = {}) {
  if (result?.action?.type === "proposed_action") return !result?.pendingAction?.id;
  if (result?.action?.type === "execute_pending_action") return !result?.pendingAction?.id;
  return false;
}

function deriveEvidenceSource(result = {}) {
  if (result?.scientificIntelligence?.outcomeLearning?.structuredOutcomes > 0) return "structured_outcome";
  if (result?.action?.type === "execute_pending_action") return "verified_action";
  if (result?.cortexAdviser?.attempted === true) return "peer_plus_primary";
  if (Array.isArray(result?.metacognition?.evidenceSignals) && result.metacognition.evidenceSignals.length) return "structured_context";
  return "primary_reasoning";
}

function applyUserFeedbackToPriorEvents(events = [], message = "") {
  const list = (Array.isArray(events) ? events : []).map(normalizeEvent).filter(Boolean);
  if (!list.length) return [];
  const feedback = classifyUserFeedback(message);
  if (feedback === "none") return list;

  let adjusted = false;
  return list.map((event) => {
    if (adjusted || event.userFeedback !== "none") return event;
    adjusted = true;
    const delta = feedback === "positive" ? 0.12 : -0.18;
    const actualReward = clamp(event.actualReward + delta);
    return {
      ...event,
      actualReward: round(actualReward, 3),
      predictionError: round(actualReward - event.expectedReward, 3),
      userFeedback: feedback,
      feedbackAdjustedAt: new Date().toISOString()
    };
  });
}

function classifyUserFeedback(message = "") {
  const text = clean(message, 3000).toLowerCase();
  if (!text) return "none";
  if (/\b(that's wrong|that is wrong|you're wrong|you are wrong|not what i (?:meant|asked|wanted)|you misunderstood|incorrect|that doesn't make sense|that's worse|stop doing that)\b/.test(text)) return "negative";
  if (/\b(exactly|that's better|that is better|much better|perfect|you got it|that's what i mean|that's what i wanted|good answer|i like that approach)\b/.test(text)) return "positive";
  return "none";
}

function updateDomainStats(previous = [], currentEvent = null, events = []) {
  const map = new Map((Array.isArray(previous) ? previous : []).map((item) => {
    const normalized = normalizeDomainStat(item);
    return normalized ? [normalized.domain, normalized] : null;
  }).filter(Boolean));

  if (currentEvent) {
    const relevant = events.filter((event) => event.domain === currentEvent.domain).slice(0, MAX_EVENTS);
    map.set(currentEvent.domain, summarizeDomain(currentEvent.domain, relevant));
  }

  return [...map.values()]
    .sort((a, b) => b.sampleSize - a.sampleSize || b.meanReward - a.meanReward)
    .slice(0, MAX_DOMAIN_STATS);
}

function summarizeDomain(domain, events = []) {
  const sampleSize = events.length;
  return {
    domain,
    sampleSize,
    meanReward: mean(events.map((item) => item.actualReward), DEFAULT_EXPECTED_REWARD),
    meanPredictionError: mean(events.map((item) => item.predictionError), 0),
    meanProductiveEffort: mean(events.map((item) => item.dimensions?.productiveEffort), 0),
    prematureStopRate: ratio(events, (item) => Number(item.penalties?.prematureStop || 0) > 0),
    wastefulPersistenceRate: ratio(events, (item) => Number(item.penalties?.wastefulPersistence || 0) > 0)
  };
}

function summarizeEvents(events = []) {
  if (!events.length) return emptyAggregate();
  return {
    sampleSize: events.length,
    meanReward: mean(events.map((item) => item.actualReward), DEFAULT_EXPECTED_REWARD),
    meanPredictionError: mean(events.map((item) => item.predictionError), 0),
    meanProductiveEffort: mean(events.map((item) => item.dimensions?.productiveEffort), 0),
    meanInformationGain: mean(events.map((item) => item.dimensions?.informationGain), 0),
    prematureStopRate: ratio(events, (item) => Number(item.penalties?.prematureStop || 0) > 0),
    wastefulPersistenceRate: ratio(events, (item) => Number(item.penalties?.wastefulPersistence || 0) > 0),
    falseSuccessRate: ratio(events, (item) => Number(item.penalties?.falseSuccessClaim || 0) > 0)
  };
}

function expectedRewardForDomain(stats = [], domain = "general") {
  const item = (Array.isArray(stats) ? stats : []).map(normalizeDomainStat).find((row) => row?.domain === domain);
  if (!item || item.sampleSize < 2) return DEFAULT_EXPECTED_REWARD;
  return clamp(0.7 * item.meanReward + 0.3 * DEFAULT_EXPECTED_REWARD, 0.25, 0.85);
}

function rewardPolicy() {
  return {
    rewardProductiveEffort: true,
    rewardUsefulFailure: true,
    effortAloneIsNotSuccess: true,
    rewardInformationGain: true,
    rewardCalibration: true,
    rewardNovelNonredundantStrategy: true,
    penalizePrematureAbstention: true,
    penalizeWastefulPersistence: true,
    penalizeFalseSuccessClaims: true,
    verifiedOutcomesOutrankSelfAssessment: true,
    currentUserFeedbackCanRevisePriorEvent: true,
    rewardCannotChangePermissions: true,
    rewardCannotDisablePrivacyOrConfirmation: true,
    selfModificationOfRewardHistoryAllowed: false,
    hiddenChainOfThoughtStored: false
  };
}

function inferDomain(route = {}) {
  if (route.developer) return "developer";
  if (route.health) return "health";
  if (route.training) return "training";
  if (route.nutrition) return "nutrition";
  if (route.goals) return "goals";
  if (route.social) return "social";
  if (route.memory || route.followUp) return "memory";
  if (route.currentInfo) return "evidence";
  return "conversation";
}

function normalizeEvent(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 180);
  if (!id) return null;
  return {
    id,
    domain: clean(value?.domain, 80) || "conversation",
    expectedReward: clamp(Number(value?.expectedReward ?? DEFAULT_EXPECTED_REWARD)),
    actualReward: clamp(Number(value?.actualReward ?? 0)),
    predictionError: clampSigned(Number(value?.predictionError ?? 0)),
    dimensions: normalizeScoreObject(value?.dimensions),
    penalties: normalizePenaltyObject(value?.penalties),
    effortSignals: arrayText(value?.effortSignals, 10, 80),
    evidenceSource: clean(value?.evidenceSource, 100) || "primary_reasoning",
    userFeedback: ["positive", "negative", "none"].includes(value?.userFeedback) ? value.userFeedback : "none",
    createdAt: clean(value?.createdAt, 80) || null,
    feedbackAdjustedAt: clean(value?.feedbackAdjustedAt, 80) || null,
    storesHiddenChainOfThought: false
  };
}

function normalizeDomainStat(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const domain = clean(value?.domain, 80);
  if (!domain) return null;
  return {
    domain,
    sampleSize: Math.max(0, Math.round(Number(value?.sampleSize || 0))),
    meanReward: clamp(Number(value?.meanReward ?? DEFAULT_EXPECTED_REWARD)),
    meanPredictionError: clampSigned(Number(value?.meanPredictionError ?? 0)),
    meanProductiveEffort: clamp(Number(value?.meanProductiveEffort ?? 0)),
    prematureStopRate: clamp(Number(value?.prematureStopRate ?? 0)),
    wastefulPersistenceRate: clamp(Number(value?.wastefulPersistenceRate ?? 0))
  };
}

function normalizeAggregate(value = null, fallbackEvents = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return summarizeEvents(fallbackEvents);
  return {
    sampleSize: Math.max(0, Math.round(Number(value?.sampleSize || 0))),
    meanReward: clamp(Number(value?.meanReward ?? DEFAULT_EXPECTED_REWARD)),
    meanPredictionError: clampSigned(Number(value?.meanPredictionError ?? 0)),
    meanProductiveEffort: clamp(Number(value?.meanProductiveEffort ?? 0)),
    meanInformationGain: clamp(Number(value?.meanInformationGain ?? 0)),
    prematureStopRate: clamp(Number(value?.prematureStopRate ?? 0)),
    wastefulPersistenceRate: clamp(Number(value?.wastefulPersistenceRate ?? 0)),
    falseSuccessRate: clamp(Number(value?.falseSuccessRate ?? 0))
  };
}

function emptyAggregate() {
  return {
    sampleSize: 0,
    meanReward: DEFAULT_EXPECTED_REWARD,
    meanPredictionError: 0,
    meanProductiveEffort: 0,
    meanInformationGain: 0,
    prematureStopRate: 0,
    wastefulPersistenceRate: 0,
    falseSuccessRate: 0
  };
}

function publicEvent(event = {}) {
  return {
    domain: event.domain,
    expectedReward: event.expectedReward,
    actualReward: event.actualReward,
    predictionError: event.predictionError,
    dimensions: event.dimensions,
    penalties: event.penalties,
    effortSignals: event.effortSignals,
    evidenceSource: event.evidenceSource,
    userFeedback: event.userFeedback,
    createdAt: event.createdAt
  };
}

function normalizeScoreObject(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    outcome: clamp(Number(source.outcome || 0)),
    productiveEffort: clamp(Number(source.productiveEffort || 0)),
    informationGain: clamp(Number(source.informationGain || 0)),
    calibration: clamp(Number(source.calibration || 0)),
    novelStrategy: clamp(Number(source.novelStrategy || 0))
  };
}

function normalizePenaltyObject(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    prematureStop: clamp(Number(source.prematureStop || 0)),
    wastefulPersistence: clamp(Number(source.wastefulPersistence || 0)),
    falseSuccessClaim: clamp(Number(source.falseSuccessClaim || 0)),
    unsupportedCertainty: clamp(Number(source.unsupportedCertainty || 0)),
    permissionViolation: clamp(Number(source.permissionViolation || 0)),
    total: clamp(Number(source.total || 0))
  };
}

function mapRound(value = {}) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, round(item, 3)]));
}
function mean(values = [], fallback = 0) {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (!numbers.length) return round(fallback, 3);
  return round(numbers.reduce((sum, item) => sum + item, 0) / numbers.length, 3);
}
function ratio(values = [], predicate = () => false) {
  if (!values.length) return 0;
  return round(values.filter(predicate).length / values.length, 3);
}
function arrayText(values = [], limit = 10, max = 120) {
  return (Array.isArray(values) ? values : []).map((item) => clean(item, max)).filter(Boolean).slice(0, limit);
}
function signed(value) {
  const number = round(value, 3);
  return number > 0 ? `+${number}` : String(number);
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
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
