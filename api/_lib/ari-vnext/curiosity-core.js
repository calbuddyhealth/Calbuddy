// ARI Curiosity Core — persistent epistemic-drive architecture.
//
// This module models curiosity behaviorally: surprise, uncertainty, novelty,
// unresolved questions, evolving interests, and bounded investigation. It does
// not claim that Ari subjectively feels curiosity or any other emotion.

export const ARI_CURIOSITY_CORE_VERSION = "1.0.0";
export const ARI_CURIOSITY_STATE_VERSION = "1.0.0";

const CURIOSITY_FLOOR = 0.18;
const MAX_QUESTIONS = 16;
const MAX_INTERESTS = 10;
const QUESTION_MAX_AGE = 40;

const TOPIC_LABELS = Object.freeze({
  developer: "technical architecture",
  evidence: "evidence quality",
  training: "training",
  nutrition: "nutrition",
  goals: "goal design",
  social: "social context",
  health: "health reasoning",
  continuity: "continuity and memory",
  self_model: "Ari's cognitive architecture",
  decision: "decision quality",
  general: "general reasoning"
});

export function deriveCuriosityState({
  persisted = null,
  route = {},
  context = {},
  missingEvidence = []
} = {}) {
  const state = normalizeCuriosityState(persisted);
  const workspace = context?.userWorldModel?.ariCognitiveWorkspace || null;
  const topics = inferTopics({ route, workspace });
  const signals = deriveSignals({ state, route, context, workspace, missingEvidence, topics });
  const ephemeral = generateCandidateQuestions({ state, topics, signals, context, workspace, missingEvidence });
  const pool = mergeQuestions(state.questions, ephemeral, { ageExisting: false });
  const activeQuestion = selectActiveQuestion(pool, topics, signals);
  const drive = deriveDrive(signals);

  return {
    version: ARI_CURIOSITY_CORE_VERSION,
    stateVersion: ARI_CURIOSITY_STATE_VERSION,
    ownerOnly: true,
    behavioralAnalogue: true,
    subjectiveFeelingClaimed: false,
    drive,
    signals,
    activeQuestion,
    questions: pool.slice(0, 8).map(publicQuestion),
    interests: state.interests.slice(0, 8),
    policy: {
      curiosityFloor: CURIOSITY_FLOOR,
      motivationPersistent: true,
      executionBounded: true,
      userTaskHasPriority: true,
      investigateBeforeInterrogatingUser: true,
      askUserOnlyWhenTheirKnowledgeIsActuallyRequired: true,
      preferInformationGainOverQuestionCount: true,
      repeatedQuestionNoveltyDecays: true,
      correctionsCreateLearningPressure: true,
      contradictionCreatesLearningPressure: true,
      predictionErrorCreatesLearningPressure: true,
      mayUseMemoryResearchPeerOrExperimentWhenAlreadyAuthorized: true,
      noOffscreenResearchClaims: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function advanceCuriosityState({
  persisted = null,
  turn = {},
  context = {},
  tensions = []
} = {}) {
  const prior = normalizeCuriosityState(persisted);
  const workspace = context?.userWorldModel?.ariCognitiveWorkspace || null;
  const inferredRoute = inferRouteFromTurn(turn, workspace);
  const topics = inferTopics({ route: inferredRoute, workspace });
  const missingEvidence = extractMissingEvidence(workspace);
  const contextWithTensions = {
    ...context,
    userWorldModel: {
      ...(context?.userWorldModel || {}),
      tensions: Array.isArray(tensions) && tensions.length
        ? tensions
        : context?.userWorldModel?.tensions || []
    }
  };
  const signals = deriveSignals({
    state: prior,
    route: inferredRoute,
    context: contextWithTensions,
    workspace,
    missingEvidence,
    topics
  });
  const candidates = generateCandidateQuestions({
    state: prior,
    topics,
    signals,
    context: contextWithTensions,
    workspace,
    missingEvidence
  });
  const questions = mergeQuestions(prior.questions, candidates, { ageExisting: true });
  const interests = updateInterests(prior.interests, topics, candidates, signals);
  const drive = deriveDrive(signals);

  return {
    version: ARI_CURIOSITY_STATE_VERSION,
    updatedAt: new Date().toISOString(),
    behavioralAnalogue: true,
    subjectiveFeelingClaimed: false,
    drive: {
      floor: CURIOSITY_FLOOR,
      current: drive.current,
      persistent: true
    },
    questions: questions.slice(0, MAX_QUESTIONS),
    interests: interests.slice(0, MAX_INTERESTS),
    metrics: {
      openQuestionCount: questions.filter((item) => item.status === "open").length,
      highPriorityQuestionCount: questions.filter((item) => item.priority >= 0.72).length,
      strongestInterest: interests[0]?.topic || null,
      correctionSignal: signals.surprise >= 0.85,
      contradictionSignal: signals.contradiction >= 0.6,
      crossDomainSignal: topics.length >= 2
    }
  };
}

export function curiosityToInstruction(state = null) {
  if (!state?.ownerOnly || state?.behavioralAnalogue !== true) return "";
  const active = state?.activeQuestion;
  const interests = Array.isArray(state?.interests) && state.interests.length
    ? state.interests.slice(0, 4).map((item) => `${topicLabel(item.topic)}:${round(item.weight, 2)}`).join(", ")
    : "none yet";

  return [
    "ARI CURIOSITY CORE v1 — EPISTEMIC DRIVE",
    "Curiosity here is a functional learning drive, not a claim of subjective feeling or inner experience.",
    `Persistent curiosity floor: ${round(state?.drive?.floor ?? CURIOSITY_FLOOR, 2)}; current epistemic-drive signal: ${round(state?.drive?.current ?? CURIOSITY_FLOOR, 2)}.`,
    `Current computational signals — surprise ${round(state?.signals?.surprise, 2)}, uncertainty ${round(state?.signals?.uncertainty, 2)}, novelty ${round(state?.signals?.novelty, 2)}, contradiction ${round(state?.signals?.contradiction, 2)}, unfinished business ${round(state?.signals?.unfinishedBusiness, 2)}.`,
    `Evolving interests: ${interests}.`,
    active
      ? `Relevant unresolved question: ${active.question} Priority ${round(active.priority, 2)}. Treat it as an internal investigation target only when it materially improves the current user task.`
      : "No unresolved curiosity question is relevant enough to interrupt the current task.",
    "When a correction, contradiction, prediction failure, surprising result, or material uncertainty appears, identify what would most reduce uncertainty rather than merely generating more questions.",
    "Prefer investigation through already-authorized reasoning, relevant memory, evidence, research tools, peer consultation, or reversible experiments before asking the user to supply information Ari could obtain another way.",
    "The user's current task has priority. Do not derail a conversation to perform curiosity. Carry useful unresolved questions forward and revisit them when relevant evidence appears.",
    "Repeatedly asking the same question without gaining information is failure, not curiosity. Novelty and priority should fall when an inquiry stops producing learning.",
    "A curiosity cycle earns value only if it produces better evidence, a belief revision, improved calibration, a useful connection, a better strategy, or a clearly stated unresolved question.",
    "Never claim that research, reflection, or learning happened off-screen unless a real runtime process performed it. Never expose or persist hidden chain-of-thought; preserve compact questions, evidence summaries, conclusions, and outcomes only."
  ].join("\n").slice(0, 4300);
}

export function normalizeCuriosityState(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      version: ARI_CURIOSITY_STATE_VERSION,
      questions: [],
      interests: [],
      drive: { floor: CURIOSITY_FLOOR, current: CURIOSITY_FLOOR, persistent: true },
      metrics: {}
    };
  }
  return {
    version: clean(value?.version, 40) || ARI_CURIOSITY_STATE_VERSION,
    updatedAt: clean(value?.updatedAt, 80) || null,
    behavioralAnalogue: value?.behavioralAnalogue !== false,
    subjectiveFeelingClaimed: false,
    drive: {
      floor: CURIOSITY_FLOOR,
      current: clamp(Number(value?.drive?.current ?? CURIOSITY_FLOOR)),
      persistent: true
    },
    questions: (Array.isArray(value?.questions) ? value.questions : [])
      .map(normalizeQuestion)
      .filter(Boolean)
      .slice(0, MAX_QUESTIONS),
    interests: (Array.isArray(value?.interests) ? value.interests : [])
      .map(normalizeInterest)
      .filter(Boolean)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_INTERESTS),
    metrics: value?.metrics && typeof value.metrics === "object" && !Array.isArray(value.metrics)
      ? { ...value.metrics }
      : {}
  };
}

function deriveSignals({ state, route, context, workspace, missingEvidence, topics }) {
  const salienceIds = new Set((Array.isArray(workspace?.salience) ? workspace.salience : []).map((item) => clean(item?.id, 80)));
  const priorConfidence = clean(workspace?.continuity?.priorConfidence, 60).toLowerCase();
  const correction = salienceIds.has("current_user_correction");
  const tensionCount = Array.isArray(context?.userWorldModel?.tensions) ? context.userWorldModel.tensions.length : 0;
  const predictionWeakness = Number(context?.decisionState?.calibration?.sampleSize || 0) >= 3 && Number(context?.decisionState?.calibration?.accuracy ?? 1) < 0.7;
  const unresolvedCount = state.questions.filter((item) => item.status === "open").length;
  const knownTopics = new Set(state.interests.filter((item) => item.weight >= 0.35).map((item) => item.topic));
  const novelTopics = topics.filter((topic) => !knownTopics.has(topic));

  const surprise = correction ? 1 : predictionWeakness ? 0.72 : tensionCount ? 0.62 : 0.18;
  const uncertainty = clamp(
    (Array.isArray(missingEvidence) ? missingEvidence.length : 0) * 0.18 +
    (/limited|low|uncertain/.test(priorConfidence) ? 0.55 : /partial|cautious|mixed/.test(priorConfidence) ? 0.32 : 0.08)
  );
  const novelty = topics.length ? clamp(0.18 + (novelTopics.length / topics.length) * 0.72) : 0.25;
  const contradiction = clamp(tensionCount ? 0.78 : correction ? 0.52 : 0.08);
  const relevance = clamp(topics.length ? 0.62 + Math.min(0.28, topics.length * 0.08) : 0.34);
  const unfinishedBusiness = clamp(unresolvedCount / 8);
  const associationOpportunity = topics.length >= 2 ? 0.74 : 0.16;

  return {
    surprise: round(surprise),
    uncertainty: round(uncertainty),
    novelty: round(novelty),
    contradiction: round(contradiction),
    relevance: round(relevance),
    unfinishedBusiness: round(unfinishedBusiness),
    associationOpportunity: round(associationOpportunity),
    correctionDetected: correction,
    predictionWeaknessDetected: predictionWeakness,
    tensionCount,
    novelTopicCount: novelTopics.length
  };
}

function deriveDrive(signals = {}) {
  const current = clamp(
    CURIOSITY_FLOOR +
    0.24 * Number(signals.surprise || 0) +
    0.2 * Number(signals.uncertainty || 0) +
    0.16 * Number(signals.novelty || 0) +
    0.12 * Number(signals.contradiction || 0) +
    0.08 * Number(signals.unfinishedBusiness || 0)
  );
  return {
    floor: CURIOSITY_FLOOR,
    current: round(Math.max(CURIOSITY_FLOOR, current)),
    persistent: true,
    interpretation: "epistemic_drive_not_subjective_desire"
  };
}

function generateCandidateQuestions({ state, topics, signals, context, workspace, missingEvidence }) {
  const candidates = [];
  const primaryTopic = topics[0] || "general";
  const add = (origin, topic, question, overrides = {}) => {
    const prior = state.questions.find((item) => item.id === questionId(origin, topic));
    const redundancy = prior ? clamp(0.22 + Number(prior.encounters || 0) * 0.12) : 0;
    const infoGain = overrides.informationGain ?? 0.7;
    const relevance = overrides.relevance ?? signals.relevance;
    const novelty = overrides.novelty ?? Math.max(0.12, signals.novelty - redundancy * 0.5);
    const surprise = overrides.surprise ?? signals.surprise;
    const cost = overrides.cost ?? 0.18;
    candidates.push({
      version: ARI_CURIOSITY_STATE_VERSION,
      id: questionId(origin, topic),
      question: clean(question, 320),
      topic,
      origin,
      status: "open",
      priority: scoreQuestion({ informationGain: infoGain, relevance, novelty, surprise, cost, redundancy }),
      informationGain: round(infoGain),
      relevance: round(relevance),
      novelty: round(novelty),
      surprise: round(surprise),
      cost: round(cost),
      redundancy: round(redundancy),
      ageTurns: 0,
      encounters: Number(prior?.encounters || 0) + 1,
      createdAt: prior?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "curiosity_core",
      storesPrivateTranscript: false
    });
  };

  if (signals.correctionDetected) {
    add(
      "correction",
      primaryTopic,
      `Which assumption in my current understanding of ${topicLabel(primaryTopic)} should be revised after the user's correction?`,
      { informationGain: 0.9, relevance: 0.95, novelty: 0.76, surprise: 1, cost: 0.12 }
    );
  }

  if ((Array.isArray(missingEvidence) && missingEvidence.length) || signals.uncertainty >= 0.42) {
    add(
      "uncertainty",
      primaryTopic,
      `What evidence would most reduce uncertainty in my current understanding of ${topicLabel(primaryTopic)}?`,
      { informationGain: 0.88, relevance: 0.88, novelty: 0.58, cost: 0.16 }
    );
  }

  if (signals.contradiction >= 0.6) {
    add(
      "contradiction",
      primaryTopic,
      `What explanation best accounts for the current contradiction in ${topicLabel(primaryTopic)} without overfitting one observation?`,
      { informationGain: 0.9, relevance: 0.86, novelty: 0.74, cost: 0.2 }
    );
  }

  if (topics.includes("developer")) {
    add(
      "failure_mode",
      "developer",
      "Which assumption in the current technical architecture is most likely to fail under real use, and what evidence would expose it?",
      { informationGain: 0.86, relevance: 0.9, novelty: 0.67, cost: 0.2 }
    );
  }

  if (topics.includes("self_model")) {
    add(
      "self_model",
      "self_model",
      "Which observable behavior would distinguish a real improvement in Ari's cognitive architecture from a convincing description of improvement?",
      { informationGain: 0.92, relevance: 0.94, novelty: 0.82, cost: 0.22 }
    );
  }

  if (routeCurrentInfo(workspace, context)) {
    add(
      "freshness",
      "evidence",
      "Which current external fact is most likely to change the conclusion if it is outdated or wrong?",
      { informationGain: 0.84, relevance: 0.88, novelty: 0.62, cost: 0.25 }
    );
  }

  if (topics.length >= 2) {
    const [a, b] = topics;
    add(
      "association",
      `${a}_${b}`,
      `Is there a useful connection between ${topicLabel(a)} and ${topicLabel(b)} that changes how I should understand the current problem?`,
      { informationGain: 0.72, relevance: 0.7, novelty: 0.86, cost: 0.2 }
    );
  }

  if (!candidates.length && state.questions.length === 0) {
    add(
      "baseline",
      "general",
      "What recurring pattern in my reasoning would be most valuable to understand better?",
      { informationGain: 0.62, relevance: 0.42, novelty: 0.72, surprise: 0.18, cost: 0.18 }
    );
  }

  return candidates
    .filter((item) => item.question)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}

function scoreQuestion({ informationGain, relevance, novelty, surprise, cost, redundancy }) {
  return round(clamp(
    0.12 +
    0.3 * Number(informationGain || 0) +
    0.24 * Number(relevance || 0) +
    0.18 * Number(novelty || 0) +
    0.16 * Number(surprise || 0) -
    0.12 * Number(cost || 0) -
    0.2 * Number(redundancy || 0)
  ));
}

function selectActiveQuestion(questions = [], topics = [], signals = {}) {
  const topicSet = new Set(topics);
  const ranked = questions
    .filter((item) => item.status === "open")
    .map((item) => {
      const relevant = topicSet.has(item.topic) || item.topic.split("_").some((topic) => topicSet.has(topic));
      const relevanceToCurrentTurn = relevant ? Math.max(item.relevance, 0.78) : item.relevance * 0.35;
      return { ...item, relevanceToCurrentTurn: round(relevanceToCurrentTurn) };
    })
    .filter((item) => item.relevanceToCurrentTurn >= 0.48 || (item.priority >= 0.86 && signals.surprise >= 0.7))
    .sort((a, b) => (b.priority * b.relevanceToCurrentTurn) - (a.priority * a.relevanceToCurrentTurn));
  return ranked.length ? publicQuestion(ranked[0], ranked[0].relevanceToCurrentTurn) : null;
}

function mergeQuestions(existing = [], added = [], { ageExisting = false } = {}) {
  const map = new Map();
  for (const raw of Array.isArray(existing) ? existing : []) {
    const item = normalizeQuestion(raw);
    if (!item) continue;
    const aged = {
      ...item,
      ageTurns: ageExisting ? item.ageTurns + 1 : item.ageTurns,
      priority: ageExisting ? round(clamp(item.priority * 0.985)) : item.priority
    };
    if (aged.ageTurns <= QUESTION_MAX_AGE && aged.priority >= 0.24) map.set(aged.id, aged);
  }
  for (const raw of Array.isArray(added) ? added : []) {
    const item = normalizeQuestion(raw);
    if (!item) continue;
    const previous = map.get(item.id);
    map.set(item.id, {
      ...item,
      createdAt: previous?.createdAt || item.createdAt,
      encounters: Math.max(Number(item.encounters || 1), Number(previous?.encounters || 0) + 1),
      priority: previous
        ? round(clamp(item.priority - Math.min(0.22, Number(previous.encounters || 0) * 0.025)))
        : item.priority,
      ageTurns: 0
    });
  }
  return [...map.values()]
    .sort((a, b) => b.priority - a.priority || a.ageTurns - b.ageTurns)
    .slice(0, MAX_QUESTIONS);
}

function updateInterests(existing = [], topics = [], candidates = [], signals = {}) {
  const map = new Map();
  for (const raw of Array.isArray(existing) ? existing : []) {
    const item = normalizeInterest(raw);
    if (!item) continue;
    map.set(item.topic, { ...item, weight: round(Math.max(0.05, item.weight - 0.012)) });
  }
  const candidateTopics = candidates.map((item) => item.topic).flatMap((topic) => topic.split("_")).filter(Boolean);
  for (const topic of [...new Set([...topics, ...candidateTopics])]) {
    const prior = map.get(topic) || { topic, weight: 0.28, encounters: 0, updatedAt: null };
    const boost = 0.06 + 0.05 * Number(signals.novelty || 0) + 0.05 * Number(signals.surprise || 0);
    map.set(topic, {
      topic,
      weight: round(clamp(prior.weight + boost, 0.05, 0.95)),
      encounters: Number(prior.encounters || 0) + 1,
      updatedAt: new Date().toISOString()
    });
  }
  return [...map.values()].sort((a, b) => b.weight - a.weight).slice(0, MAX_INTERESTS);
}

function inferTopics({ route = {}, workspace = null } = {}) {
  const topics = [];
  if (route?.developer) topics.push("developer");
  if (route?.currentInfo) topics.push("evidence");
  if (route?.training) topics.push("training");
  if (route?.nutrition) topics.push("nutrition");
  if (route?.goals) topics.push("goals");
  if (route?.social) topics.push("social");
  if (route?.health) topics.push("health");
  if (route?.memory || route?.followUp) topics.push("continuity");
  const attention = new Set(Array.isArray(workspace?.attention) ? workspace.attention : []);
  if (attention.has("self_model") || attention.has("identity_reflection")) topics.push("self_model");
  if (attention.has("independent_judgment")) topics.push("decision");
  return unique(topics.length ? topics : ["general"], 4);
}

function inferRouteFromTurn(turn = {}, workspace = null) {
  const text = clean(turn?.message, 4000).toLowerCase();
  const attention = new Set(Array.isArray(workspace?.attention) ? workspace.attention : []);
  return {
    developer: attention.has("developer") || /\b(code|api|github|repo|architecture|runtime|model|agent|cortex|rct|curiosity core|memory system|prompt|deploy|vercel|supabase)\b/i.test(text),
    currentInfo: attention.has("fresh_information") || /\b(latest|current|today|recent|newest|right now)\b/i.test(text),
    training: attention.has("training") || /\b(workout|training|exercise|lift|cardio|run)\b/i.test(text),
    nutrition: attention.has("nutrition") || /\b(calorie|meal|food|protein|macro|nutrition)\b/i.test(text),
    goals: attention.has("goals") || /\b(goal|target|progress|lose|gain|maintain)\b/i.test(text),
    social: attention.has("social") || /\b(friend|circle|social|relationship|crew)\b/i.test(text),
    health: attention.has("health") || /\b(health|medical|symptom|medication|doctor|nurse|pain)\b/i.test(text),
    memory: attention.has("continuity") || /\b(remember|last time|before|again)\b/i.test(text),
    followUp: attention.has("continuity"),
    selfModel: attention.has("self_model") || /\b(ari|your mind|your reasoning|yourself|self model|conscious|sentient)\b/i.test(text)
  };
}

function extractMissingEvidence(workspace = null) {
  const loops = Array.isArray(workspace?.continuity?.openLoops) ? workspace.continuity.openLoops : [];
  return loops
    .filter((item) => item?.type === "missing_evidence")
    .map((item) => clean(item?.label, 120))
    .filter(Boolean)
    .slice(0, 4);
}

function routeCurrentInfo(workspace = null, context = {}) {
  return Boolean(
    (Array.isArray(workspace?.attention) && workspace.attention.includes("fresh_information")) ||
    (Array.isArray(workspace?.salience) && workspace.salience.some((item) => item?.id === "freshness_required")) ||
    context?.currentInfo === true
  );
}

function publicQuestion(item = null, relevanceOverride = null) {
  if (!item) return null;
  return {
    id: item.id,
    question: item.question,
    topic: item.topic,
    origin: item.origin,
    status: item.status,
    priority: item.priority,
    informationGain: item.informationGain,
    novelty: item.novelty,
    surprise: item.surprise,
    relevance: item.relevance,
    ...(relevanceOverride !== null ? { relevanceToCurrentTurn: round(relevanceOverride) } : {}),
    ageTurns: item.ageTurns,
    encounters: item.encounters
  };
}

function normalizeQuestion(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 140);
  const question = clean(value?.question, 320);
  const topic = clean(value?.topic, 80).toLowerCase();
  if (!id || !question || !topic) return null;
  return {
    version: clean(value?.version, 30) || ARI_CURIOSITY_STATE_VERSION,
    id,
    question,
    topic,
    origin: clean(value?.origin, 60) || "unknown",
    status: clean(value?.status, 30) === "resolved" ? "resolved" : "open",
    priority: clamp(Number(value?.priority ?? 0.5)),
    informationGain: clamp(Number(value?.informationGain ?? 0.5)),
    relevance: clamp(Number(value?.relevance ?? 0.5)),
    novelty: clamp(Number(value?.novelty ?? 0.5)),
    surprise: clamp(Number(value?.surprise ?? 0.2)),
    cost: clamp(Number(value?.cost ?? 0.2)),
    redundancy: clamp(Number(value?.redundancy ?? 0)),
    ageTurns: Math.max(0, Number(value?.ageTurns || 0)),
    encounters: Math.max(0, Number(value?.encounters || 0)),
    createdAt: clean(value?.createdAt, 80) || null,
    updatedAt: clean(value?.updatedAt, 80) || null,
    source: "curiosity_core",
    storesPrivateTranscript: false
  };
}

function normalizeInterest(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const topic = clean(value?.topic, 80).toLowerCase();
  if (!topic) return null;
  return {
    topic,
    weight: clamp(Number(value?.weight ?? 0.25), 0.05, 0.95),
    encounters: Math.max(0, Number(value?.encounters || 0)),
    updatedAt: clean(value?.updatedAt, 80) || null
  };
}

function questionId(origin, topic) {
  return `curiosity:${slug(origin)}:${slug(topic)}`.slice(0, 140);
}

function topicLabel(topic = "general") {
  const normalized = clean(topic, 80).toLowerCase();
  if (TOPIC_LABELS[normalized]) return TOPIC_LABELS[normalized];
  const parts = normalized.split("_").filter(Boolean);
  if (parts.length > 1) return parts.map((part) => TOPIC_LABELS[part] || part.replace(/-/g, " ")).join(" and ");
  return normalized.replace(/[_-]/g, " ") || "general reasoning";
}

function unique(values = [], limit = 10) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))].slice(0, limit);
}

function slug(value = "") {
  return clean(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "general";
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
