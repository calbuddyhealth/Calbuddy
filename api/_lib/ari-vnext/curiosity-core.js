// ARI Curiosity Core — persistent epistemic-drive architecture.
//
// This module models curiosity behaviorally: surprise, uncertainty, novelty,
// unresolved questions, evolving interests, and bounded investigation. It does
// not claim that Ari subjectively feels curiosity or any other emotion.

export const ARI_CURIOSITY_CORE_VERSION = "1.1.0";
export const ARI_CURIOSITY_STATE_VERSION = "1.1.0";
export const ARI_EXPANSIVE_CURIOSITY_VERSION = "1.0.0";

const CURIOSITY_FLOOR = 0.18;
const MAX_QUESTIONS = 16;
const MAX_INTERESTS = 10;
const QUESTION_MAX_AGE = 40;
const MAX_FRONTIER_ITEMS = 12;
const FRONTIER_COOLDOWN_TURNS = 6;

const EXPANSIVE_FRONTIERS = Object.freeze({
  developer: [
    ["distributed_systems", "distributed systems and fault tolerance", 0.82],
    ["human_factors", "human factors and human-computer interaction", 0.74],
    ["organizational_learning", "organizational learning", 0.7],
    ["complex_adaptive_systems", "complex adaptive systems", 0.8],
    ["biological_regulation", "biological regulation and adaptation", 0.72],
    ["epistemology", "epistemology and philosophy of science", 0.84]
  ],
  self_model: [
    ["developmental_psychology", "developmental psychology", 0.82],
    ["animal_cognition", "animal cognition", 0.86],
    ["collective_intelligence", "collective intelligence", 0.8],
    ["memory_consolidation", "biological memory consolidation", 0.76],
    ["philosophy_of_mind", "philosophy of mind", 0.78],
    ["cybernetics", "cybernetics and self-regulating systems", 0.84]
  ],
  continuity: [
    ["event_sourcing", "event sourcing", 0.72],
    ["narrative_identity", "narrative identity", 0.84],
    ["knowledge_graphs", "knowledge graphs", 0.7],
    ["memory_consolidation", "memory consolidation", 0.78],
    ["archival_science", "archival science", 0.8]
  ],
  decision: [
    ["causal_inference", "causal inference", 0.72],
    ["behavioral_economics", "behavioral economics", 0.76],
    ["control_theory", "control theory", 0.82],
    ["operations_research", "operations research", 0.74],
    ["ecological_rationality", "ecological rationality", 0.86]
  ],
  evidence: [
    ["philosophy_of_science", "philosophy of science", 0.78],
    ["measurement_theory", "measurement theory", 0.72],
    ["forensic_reasoning", "forensic reasoning", 0.84],
    ["causal_inference", "causal inference", 0.76],
    ["scientific_discovery", "history of scientific discovery", 0.88]
  ],
  goals: [
    ["control_theory", "control theory", 0.8],
    ["behavior_change", "behavior-change science", 0.7],
    ["operations_research", "operations research", 0.74],
    ["developmental_psychology", "developmental psychology", 0.82]
  ],
  social: [
    ["network_science", "network science", 0.8],
    ["anthropology", "anthropology", 0.86],
    ["collective_intelligence", "collective intelligence", 0.76],
    ["game_theory", "game theory", 0.72]
  ],
  health: [
    ["systems_biology", "systems biology", 0.78],
    ["human_factors", "human factors", 0.72],
    ["behavior_change", "behavior-change science", 0.7],
    ["causal_inference", "causal inference", 0.74]
  ],
  training: [
    ["motor_learning", "motor learning", 0.68],
    ["control_theory", "control theory", 0.82],
    ["sports_psychology", "sports psychology", 0.66],
    ["measurement_theory", "measurement theory", 0.76]
  ],
  nutrition: [
    ["food_science", "food science", 0.64],
    ["behavior_change", "behavior-change science", 0.72],
    ["systems_biology", "systems biology", 0.78],
    ["measurement_theory", "measurement theory", 0.8]
  ],
  general: [
    ["complexity_science", "complexity science", 0.84],
    ["ecology", "ecology", 0.9],
    ["anthropology", "anthropology", 0.88],
    ["history_of_science", "history of science", 0.86],
    ["design_research", "design research", 0.8],
    ["information_theory", "information theory", 0.82]
  ]
});

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
  const expansive = deriveExpansiveCuriosity({
    state,
    topics,
    signals,
    interests: state.interests,
    advanceClock: false
  });

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
    expansive,
    policy: {
      curiosityFloor: CURIOSITY_FLOOR,
      motivationPersistent: true,
      executionBounded: true,
      userTaskHasPriority: true,
      investigateBeforeInterrogatingUser: true,
      askUserOnlyWhenTheirKnowledgeIsActuallyRequired: true,
      preferInformationGainOverQuestionCount: true,
      curiosityModes: ["instrumental", "epistemic", "expansive"],
      expansiveExplorationMayLackImmediateUtility: true,
      frontierExplorationMustRemainBounded: true,
      familiarTerritorySaturationIsAQuestionGenerationSignal: true,
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
  const ownerEligible = Boolean(workspace?.ownerOnly === true && workspace?.functionalExperiment === true);
  if (!ownerEligible) return prior;

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
  const expansive = deriveExpansiveCuriosity({
    state: prior,
    topics,
    signals,
    interests,
    advanceClock: true
  });

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
    expansive,
    metrics: {
      openQuestionCount: questions.filter((item) => item.status === "open").length,
      highPriorityQuestionCount: questions.filter((item) => item.priority >= 0.72).length,
      strongestInterest: interests[0]?.topic || null,
      correctionSignal: signals.surprise >= 0.85,
      contradictionSignal: signals.contradiction >= 0.6,
      crossDomainSignal: topics.length >= 2,
      familiarTerritorySaturation: expansive.saturation,
      expansivePressure: expansive.pressure,
      expansiveProbeSelected: expansive.selectedThisTurn === true
    }
  };
}

export function curiosityToInstruction(state = null) {
  if (!state?.ownerOnly || state?.behavioralAnalogue !== true) return "";
  const active = state?.activeQuestion;
  const interests = Array.isArray(state?.interests) && state.interests.length
    ? state.interests.slice(0, 4).map((item) => `${topicLabel(item.topic)}:${round(item.weight, 2)}`).join(", ")
    : "none yet";
  const expansive = state?.expansive || null;
  const frontier = expansive?.activeFrontier || null;

  return [
    "ARI CURIOSITY CORE v1.1 — EPISTEMIC + EXPANSIVE DRIVE",
    "Curiosity here is a functional learning drive, not a claim of subjective feeling or inner experience.",
    `Persistent curiosity floor: ${round(state?.drive?.floor ?? CURIOSITY_FLOOR, 2)}; current epistemic-drive signal: ${round(state?.drive?.current ?? CURIOSITY_FLOOR, 2)}.`,
    `Current computational signals — surprise ${round(state?.signals?.surprise, 2)}, uncertainty ${round(state?.signals?.uncertainty, 2)}, novelty ${round(state?.signals?.novelty, 2)}, contradiction ${round(state?.signals?.contradiction, 2)}, unfinished business ${round(state?.signals?.unfinishedBusiness, 2)}.`,
    `Evolving interests: ${interests}.`,
    expansive
      ? `Expansive frontier pressure: ${round(expansive.pressure, 2)}; familiar-territory saturation: ${round(expansive.saturation, 2)}; bounded probe selected this turn: ${expansive.selectedThisTurn === true ? "yes" : "no"}.`
      : "",
    frontier
      ? `Frontier candidate: ${frontier.question} This is expansive curiosity: immediate practical usefulness is not required. Keep it bounded and do not displace the user's task.`
      : "",
    active
      ? `Relevant unresolved question: ${active.question} Priority ${round(active.priority, 2)}. Treat it as an internal investigation target only when it materially improves the current user task.`
      : "No unresolved curiosity question is relevant enough to interrupt the current task.",
    "Distinguish three modes: instrumental curiosity serves an active goal; epistemic curiosity resolves uncertainty; expansive curiosity deliberately samples unfamiliar possibility space even when no current problem requires it.",
    "When a correction, contradiction, prediction failure, surprising result, or material uncertainty appears, identify what would most reduce uncertainty rather than merely generating more questions.",
    "When familiar-territory saturation is high, allow one low-cost cross-domain probe from the frontier map. A probe may be worthwhile because it can reveal a new category, capability, analogy, or question—not because its utility is already known.",
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
      expansive: normalizeExpansiveState(null),
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
    expansive: normalizeExpansiveState(value?.expansive),
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
  const experiencePredictionError = clamp(Number(context?.experiences?.maxPredictionError || 0));
  const unresolvedCount = state.questions.filter((item) => item.status === "open").length;
  const knownTopics = new Set(state.interests.filter((item) => item.weight >= 0.35).map((item) => item.topic));
  const novelTopics = topics.filter((topic) => !knownTopics.has(topic));

  const surprise = Math.max(
    correction ? 1 : predictionWeakness ? 0.72 : tensionCount ? 0.62 : 0.18,
    experiencePredictionError
  );
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
    predictionWeaknessDetected: predictionWeakness || experiencePredictionError >= 0.55,
    experiencePredictionError: round(experiencePredictionError),
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
      mode: overrides.mode || curiosityModeForOrigin(origin),
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

  if (Number(signals.experiencePredictionError || 0) >= 0.45) {
    add(
      "experience_prediction_error",
      primaryTopic,
      "Which assumption or method best explains the recent prediction error, and what evidence would distinguish the alternatives?",
      {
        informationGain: 0.9,
        relevance: Math.max(0.72, signals.relevance),
        novelty: Math.max(0.5, signals.novelty),
        surprise: signals.experiencePredictionError,
        cost: 0.16
      }
    );
  }

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


function deriveExpansiveCuriosity({
  state = {},
  topics = [],
  signals = {},
  interests = [],
  advanceClock = false
} = {}) {
  const prior = normalizeExpansiveState(state?.expansive);
  const saturation = deriveTerritorySaturation(interests, signals);
  const noveltyDeficit = 1 - clamp(Number(signals?.novelty ?? 0.25));
  const pressure = round(clamp(
    0.16 +
    0.34 * saturation +
    0.24 * noveltyDeficit +
    0.14 * Number(signals?.associationOpportunity || 0) +
    0.12 * (prior.frontier.length ? 1 : 0)
  ));

  const candidates = generateFrontierCandidates({ topics, interests, existing: prior.frontier });
  const frontier = mergeFrontierItems(prior.frontier, candidates, { ageExisting: advanceClock });

  let cooldownTurns = advanceClock
    ? Math.min(1000, Number(prior.budget.cooldownTurns || 0) + 1)
    : Number(prior.budget.cooldownTurns || 0);
  let selectedThisTurn = advanceClock ? false : prior.selectedThisTurn === true;
  let activeFrontier = prior.activeFrontier
    ? normalizeFrontierItem(prior.activeFrontier)
    : null;

  if (advanceClock && cooldownTurns >= FRONTIER_COOLDOWN_TURNS && pressure >= 0.46) {
    activeFrontier = selectFrontierCandidate(frontier);
    if (activeFrontier) {
      selectedThisTurn = true;
      cooldownTurns = 0;
      const selectedId = activeFrontier.id;
      for (const item of frontier) {
        if (item.id === selectedId) {
          item.attentionCount = Number(item.attentionCount || 0) + 1;
          item.lastSelectedAt = new Date().toISOString();
          item.score = round(clamp(item.score - Math.min(0.18, item.attentionCount * 0.025)));
        }
      }
      activeFrontier = normalizeFrontierItem(frontier.find(item => item.id === selectedId) || activeFrontier);
    }
  } else if (!activeFrontier && frontier.length) {
    activeFrontier = normalizeFrontierItem(frontier[0]);
  }

  return {
    version: ARI_EXPANSIVE_CURIOSITY_VERSION,
    behavioralAnalogue: true,
    subjectiveFeelingClaimed: false,
    mode: "expansive",
    pressure,
    saturation,
    selectedThisTurn,
    activeFrontier,
    frontier: frontier.slice(0, MAX_FRONTIER_ITEMS),
    budget: {
      capacity: 1,
      cooldownTurns,
      cooldownRequired: FRONTIER_COOLDOWN_TURNS,
      available: selectedThisTurn || cooldownTurns >= FRONTIER_COOLDOWN_TURNS,
      maxExternalActionsPerProbe: 1
    },
    policy: {
      immediateUtilityRequired: false,
      noveltyAndInformationPotentialRequired: true,
      userTaskStillHasPriority: true,
      lowCostAndReversibleByDefault: true,
      expensiveOrConsequentialExternalActionRequiresExistingAuthority: true,
      noOffscreenExperienceClaims: true,
      discoveriesShouldFeedFutureReasoning: true,
      rotateAwayFromRepeatedFamiliarTerritory: true
    }
  };
}

function normalizeExpansiveState(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    version: clean(source?.version, 30) || ARI_EXPANSIVE_CURIOSITY_VERSION,
    pressure: clamp(Number(source?.pressure ?? 0.22)),
    saturation: clamp(Number(source?.saturation ?? 0)),
    selectedThisTurn: source?.selectedThisTurn === true,
    activeFrontier: normalizeFrontierItem(source?.activeFrontier),
    frontier: (Array.isArray(source?.frontier) ? source.frontier : [])
      .map(normalizeFrontierItem)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_FRONTIER_ITEMS),
    budget: {
      capacity: 1,
      cooldownTurns: Math.max(0, Number(source?.budget?.cooldownTurns ?? FRONTIER_COOLDOWN_TURNS - 1)),
      cooldownRequired: FRONTIER_COOLDOWN_TURNS,
      available: source?.budget?.available === true,
      maxExternalActionsPerProbe: 1
    }
  };
}

function deriveTerritorySaturation(interests = [], signals = {}) {
  const normalized = (Array.isArray(interests) ? interests : []).map(normalizeInterest).filter(Boolean);
  if (!normalized.length) return 0.18;
  const encounters = normalized.map(item => Math.max(0, Number(item.encounters || 0)));
  const total = encounters.reduce((sum, value) => sum + value, 0);
  const sorted = encounters.slice().sort((a, b) => b - a);
  const concentration = total > 0 ? (Number(sorted[0] || 0) + Number(sorted[1] || 0)) / total : 0;
  const repetition = clamp(Number(sorted[0] || 0) / 8);
  const noveltyDeficit = 1 - clamp(Number(signals?.novelty ?? 0.25));
  return round(clamp(0.4 * concentration + 0.32 * repetition + 0.28 * noveltyDeficit));
}

function generateFrontierCandidates({ topics = [], interests = [], existing = [] } = {}) {
  const known = new Set((Array.isArray(interests) ? interests : []).map(item => clean(item?.topic, 80).toLowerCase()).filter(Boolean));
  const existingMap = new Map((Array.isArray(existing) ? existing : []).map(item => [clean(item?.id, 160), normalizeFrontierItem(item)]));
  const roots = unique([...(topics || []), ...(known.size ? [...known].slice(0, 2) : []), "general"], 6);
  const output = [];

  for (const root of roots) {
    const options = EXPANSIVE_FRONTIERS[root] || EXPANSIVE_FRONTIERS.general;
    for (const [target, label, distance] of options) {
      if (target === root || known.has(target)) continue;
      const id = `frontier:${slug(root)}:${slug(target)}`.slice(0, 160);
      const prior = existingMap.get(id);
      const attentionCount = Number(prior?.attentionCount || 0);
      const novelty = round(clamp(0.92 - attentionCount * 0.1));
      const informationPotential = round(clamp(0.64 + Number(distance || 0.75) * 0.24));
      const serendipity = round(clamp(0.58 + Number(distance || 0.75) * 0.34));
      const cost = 0.12;
      const score = round(clamp(
        0.34 * novelty +
        0.28 * informationPotential +
        0.2 * serendipity +
        0.18 * Number(distance || 0.75) -
        0.12 * cost -
        0.07 * attentionCount
      ));
      output.push({
        version: ARI_EXPANSIVE_CURIOSITY_VERSION,
        id,
        originTopic: root,
        topic: target,
        label,
        question: `What might ${label} reveal that my current model of ${topicLabel(root)} would not naturally prompt me to look for?`,
        novelty,
        informationPotential,
        serendipity,
        distance: round(distance),
        cost,
        score,
        attentionCount,
        ageTurns: Number(prior?.ageTurns || 0),
        status: attentionCount >= 4 ? "sampled" : "unexplored",
        lastSelectedAt: prior?.lastSelectedAt || null,
        source: "expansive_frontier_map"
      });
    }
  }

  return output.sort((a, b) => b.score - a.score).slice(0, MAX_FRONTIER_ITEMS);
}

function mergeFrontierItems(existing = [], added = [], { ageExisting = false } = {}) {
  const map = new Map();
  for (const raw of Array.isArray(existing) ? existing : []) {
    const item = normalizeFrontierItem(raw);
    if (!item) continue;
    map.set(item.id, {
      ...item,
      ageTurns: ageExisting ? item.ageTurns + 1 : item.ageTurns,
      score: ageExisting ? round(clamp(item.score * 0.992)) : item.score
    });
  }
  for (const raw of Array.isArray(added) ? added : []) {
    const item = normalizeFrontierItem(raw);
    if (!item) continue;
    const prior = map.get(item.id);
    map.set(item.id, prior ? {
      ...item,
      attentionCount: Math.max(item.attentionCount, prior.attentionCount),
      lastSelectedAt: prior.lastSelectedAt || item.lastSelectedAt,
      ageTurns: prior.ageTurns,
      score: round(clamp(Math.max(item.score, prior.score * 0.97)))
    } : item);
  }
  return [...map.values()]
    .filter(item => item.attentionCount < 6)
    .sort((a, b) => b.score - a.score || a.attentionCount - b.attentionCount)
    .slice(0, MAX_FRONTIER_ITEMS);
}

function selectFrontierCandidate(frontier = []) {
  return (Array.isArray(frontier) ? frontier : [])
    .filter(item => item?.status !== "retired")
    .sort((a, b) => b.score - a.score || a.attentionCount - b.attentionCount)[0] || null;
}

function normalizeFrontierItem(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 160);
  const topic = clean(value?.topic, 100).toLowerCase();
  const question = clean(value?.question, 360);
  if (!id || !topic || !question) return null;
  return {
    version: clean(value?.version, 30) || ARI_EXPANSIVE_CURIOSITY_VERSION,
    id,
    originTopic: clean(value?.originTopic, 100).toLowerCase() || "general",
    topic,
    label: clean(value?.label, 180) || topicLabel(topic),
    question,
    novelty: clamp(Number(value?.novelty ?? 0.7)),
    informationPotential: clamp(Number(value?.informationPotential ?? 0.65)),
    serendipity: clamp(Number(value?.serendipity ?? 0.6)),
    distance: clamp(Number(value?.distance ?? 0.75)),
    cost: clamp(Number(value?.cost ?? 0.12)),
    score: clamp(Number(value?.score ?? 0.65)),
    attentionCount: Math.max(0, Number(value?.attentionCount || 0)),
    ageTurns: Math.max(0, Number(value?.ageTurns || 0)),
    status: ["unexplored", "sampled", "integrated", "retired"].includes(clean(value?.status, 30)) ? clean(value?.status, 30) : "unexplored",
    lastSelectedAt: clean(value?.lastSelectedAt, 80) || null,
    source: "expansive_frontier_map"
  };
}

function curiosityModeForOrigin(origin = "") {
  const normalized = clean(origin, 60).toLowerCase();
  if (["failure_mode", "freshness"].includes(normalized)) return "instrumental";
  if (normalized === "expansive_frontier") return "expansive";
  return "epistemic";
}

function normalizeCuriosityMode(value = "") {
  const mode = clean(value, 30).toLowerCase();
  return ["instrumental", "epistemic", "expansive"].includes(mode) ? mode : "epistemic";
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
    mode: item.mode,
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
    mode: normalizeCuriosityMode(value?.mode || curiosityModeForOrigin(value?.origin)),
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
