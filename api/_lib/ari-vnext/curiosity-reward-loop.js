// ARI vNext — reward-conditioned curiosity learning.
//
// Persistent reward history can reshape curiosity priorities while a separate
// exploration bonus prevents lock-in to historically rewarding domains.

export const ARI_CURIOSITY_REWARD_LOOP_VERSION = "1.0.0";

const BASELINE_UTILITY = 0.5;
const DOMAIN_TO_TOPIC = Object.freeze({
  developer: "developer",
  health: "health",
  training: "training",
  nutrition: "nutrition",
  goals: "goals",
  social: "social",
  memory: "continuity",
  evidence: "evidence",
  conversation: "general"
});

export function applyRewardLearningToCuriosity({
  curiosity = null,
  rewardState = null,
  selfAdaptation = null,
  route = {}
} = {}) {
  if (!curiosity?.ownerOnly || curiosity?.behavioralAnalogue !== true) return curiosity;

  const domain = inferDomain(route);
  const topic = DOMAIN_TO_TOPIC[domain] || "general";
  const domainStat = (Array.isArray(rewardState?.domainStats) ? rewardState.domainStats : [])
    .find((item) => clean(item?.domain, 80) === domain) || null;
  const sampleSize = Math.max(0, Number(domainStat?.sampleSize || 0));
  const learnedUtility = deriveLearnedUtility(domainStat);
  const explorationBonus = deriveExplorationBonus(sampleSize, selfAdaptation);
  const predictionError = Number(rewardState?.lastEvent?.predictionError || 0);

  const questions = (Array.isArray(curiosity?.questions) ? curiosity.questions : [])
    .map((item) => adjustQuestion(item, { topic, learnedUtility, explorationBonus, predictionError }))
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  const activeQuestion = selectActiveQuestion({
    original: curiosity?.activeQuestion,
    questions,
    currentTopic: topic
  });
  const interests = adjustInterests(curiosity?.interests, {
    topic,
    learnedUtility,
    explorationBonus,
    sampleSize
  });

  const currentDrive = Number(curiosity?.drive?.current ?? curiosity?.drive?.floor ?? 0.18);
  const curiosityLift =
    0.08 * Math.max(0, learnedUtility - BASELINE_UTILITY) +
    0.12 * explorationBonus +
    0.04 * Math.max(0, predictionError);

  return {
    ...curiosity,
    drive: {
      ...(curiosity?.drive || {}),
      current: round(clamp(currentDrive + curiosityLift))
    },
    activeQuestion,
    questions: questions.slice(0, 8),
    interests: interests.slice(0, 8),
    rewardLearning: {
      version: ARI_CURIOSITY_REWARD_LOOP_VERSION,
      domain,
      topic,
      sampleSize,
      learnedUtility: round(learnedUtility),
      explorationBonus: round(explorationBonus),
      predictionError: round(predictionError),
      exploitationAndExplorationBalanced: true,
      lowHistoricalRewardCannotEliminateCuriosity: true
    }
  };
}

export function curiosityRewardToInstruction(curiosity = null) {
  const state = curiosity?.rewardLearning;
  if (!state) return "";
  return [
    "CURIOSITY ↔ REWARD CLOSED LOOP",
    `Current reward-conditioned curiosity utility for ${state.topic}: ${round(state.learnedUtility)} from ${state.sampleSize} prior samples; exploration bonus ${round(state.explorationBonus)}.`,
    "Use learned utility to favor investigations that repeatedly produce real information gain, better calibration, or useful outcomes.",
    "Keep an exploration bonus for underexplored domains so past reward does not create tunnel vision. A low-reward history may lower priority modestly, but it may never erase the persistent curiosity floor or prevent investigating a surprising new possibility.",
    "Positive reward prediction error is a reason to ask what made the investigation unexpectedly useful. Negative reward prediction error is a reason to change method, not to become generally less curious.",
    "Optimize for becoming less wrong and more capable, not for maximizing a reward score."
  ].join("\n").slice(0, 2400);
}

function adjustQuestion(item = {}, { topic, learnedUtility, explorationBonus, predictionError }) {
  const questionTopic = clean(item?.topic, 80).toLowerCase();
  const matches = questionTopic === topic || questionTopic.split("_").includes(topic);
  const utilityDelta = matches ? (learnedUtility - BASELINE_UTILITY) * 0.16 : 0;
  const explorationDelta = matches
    ? explorationBonus * 0.18
    : Math.min(0.035, explorationBonus * 0.08);
  const surpriseDelta = matches ? Math.max(0, predictionError) * 0.05 : 0;
  const adjusted = clamp(Number(item?.priority || 0) + utilityDelta + explorationDelta + surpriseDelta);
  return {
    ...item,
    priority: round(adjusted),
    learnedUtility: round(matches ? learnedUtility : BASELINE_UTILITY),
    explorationBonus: round(matches ? explorationBonus : explorationBonus * 0.4)
  };
}

function selectActiveQuestion({ original = null, questions = [], currentTopic = "general" } = {}) {
  const ranked = (Array.isArray(questions) ? questions : [])
    .filter((item) => item?.status !== "resolved")
    .sort((a, b) => {
      const aMatch = topicMatches(a?.topic, currentTopic) ? 1.08 : 1;
      const bMatch = topicMatches(b?.topic, currentTopic) ? 1.08 : 1;
      return Number(b.priority || 0) * bMatch - Number(a.priority || 0) * aMatch;
    });
  if (!ranked.length) return original;
  const best = ranked[0];
  if (original && Number(original?.priority || 0) > Number(best?.priority || 0) + 0.08) return original;
  return best;
}

function adjustInterests(existing = [], { topic, learnedUtility, explorationBonus, sampleSize }) {
  const map = new Map();
  for (const raw of Array.isArray(existing) ? existing : []) {
    const currentTopic = clean(raw?.topic, 80).toLowerCase();
    if (!currentTopic) continue;
    map.set(currentTopic, { ...raw, topic: currentTopic, weight: clamp(Number(raw?.weight ?? 0.25)) });
  }

  const prior = map.get(topic) || { topic, weight: 0.26, encounters: 0, updatedAt: null };
  const utilityDelta = (learnedUtility - BASELINE_UTILITY) * 0.12;
  const explorationDelta = explorationBonus * 0.08;
  map.set(topic, {
    ...prior,
    weight: round(clamp(Number(prior.weight || 0.26) + utilityDelta + explorationDelta, 0.05, 0.95)),
    rewardConditioned: true,
    rewardSampleSize: sampleSize
  });

  return [...map.values()].sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0));
}

function deriveLearnedUtility(domainStat = null) {
  if (!domainStat || Number(domainStat?.sampleSize || 0) <= 0) return BASELINE_UTILITY;
  const sampleConfidence = Math.min(1, Number(domainStat.sampleSize || 0) / 8);
  const raw = clamp(
    BASELINE_UTILITY +
    0.8 * (Number(domainStat?.meanReward ?? 0.55) - 0.55) +
    0.45 * Number(domainStat?.meanPredictionError || 0) +
    0.12 * (Number(domainStat?.meanProductiveEffort || 0) - 0.5)
  );
  return clamp(BASELINE_UTILITY * (1 - sampleConfidence) + raw * sampleConfidence);
}

function deriveExplorationBonus(sampleSize = 0, selfAdaptation = null) {
  const underexplored = 0.18 * (1 - Math.min(1, Math.max(0, Number(sampleSize || 0)) / 6));
  const adaptiveBias = Math.max(0, Number(selfAdaptation?.biases?.exploration || BASELINE_UTILITY) - BASELINE_UTILITY) * 0.15;
  return round(clamp(underexplored + adaptiveBias, 0.02, 0.2));
}

function topicMatches(value, currentTopic) {
  const topic = clean(value, 80).toLowerCase();
  return topic === currentTopic || topic.split("_").includes(currentTopic);
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
