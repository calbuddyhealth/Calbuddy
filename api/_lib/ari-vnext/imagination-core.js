// ARI Imagination Core — sandboxed possibility construction for Ari vNext.
//
// Imagination expands the search space by constructing explicit hypothetical
// scenarios. Its products are never facts, memories, observations, or evidence
// merely because they are coherent or compelling.

export const ARI_IMAGINATION_CORE_VERSION = "1.0.0";
export const ARI_IMAGINATION_STATE_VERSION = "1.0.0";

const MAX_GARDEN = 12;
const MAX_CANDIDATES = 6;
const IMAGINATION_COOLDOWN_TURNS = 2;

export const IMAGINATION_TRANSFORMS = Object.freeze([
  "analogy",
  "inversion",
  "constraint_removal",
  "constraint_injection",
  "recombination",
  "future_projection",
  "counterfactual",
  "idealization"
]);

const DOMAIN_LABELS = Object.freeze({
  developer: "technical architecture",
  self_model: "Ari's cognitive architecture",
  continuity: "continuity and memory",
  decision: "decision making",
  evidence: "evidence and verification",
  goals: "goal design",
  social: "social systems",
  health: "health reasoning",
  training: "training",
  nutrition: "nutrition",
  general: "the current problem"
});

export function deriveImaginationState({
  persisted = null,
  route = {},
  context = {},
  curiosity = null,
  executionSession = null,
  safety = {}
} = {}) {
  const prior = normalizeImaginationState(persisted);
  const workspace = context?.userWorldModel?.ariCognitiveWorkspace || null;
  const ownerEligible = Boolean(workspace?.ownerOnly === true && workspace?.functionalExperiment === true);
  if (!ownerEligible) return {
    ...prior,
    ownerOnly: true,
    active: false,
    reason: "owner_imagination_not_enabled"
  };

  const domain = inferDomain({ route, workspace });
  const signals = deriveImaginationSignals({
    prior,
    route,
    workspace,
    curiosity,
    executionSession,
    safety,
    explicitImagination: inferExplicitImagination(route, workspace)
  });
  const candidates = generateImaginationCandidates({
    domain,
    curiosity,
    executionSession,
    signals,
    garden: prior.garden
  });
  const activeScenario = prior.activeScenario || selectScenario(candidates);

  return {
    version: ARI_IMAGINATION_CORE_VERSION,
    stateVersion: ARI_IMAGINATION_STATE_VERSION,
    ownerOnly: true,
    active: signals.pressure >= 0.42 || signals.explicitImagination,
    behavioralAnalogue: true,
    subjectiveExperienceClaimed: false,
    pressure: signals.pressure,
    selectedThisTurn: prior.selectedThisTurn === true,
    signals,
    activeScenario,
    candidates: candidates.slice(0, MAX_CANDIDATES),
    garden: prior.garden.slice(0, MAX_GARDEN),
    calibration: prior.calibration,
    budget: prior.budget,
    realityFirewall: realityFirewall(),
    policy: imaginationPolicy()
  };
}

export function advanceImaginationState({
  persisted = null,
  turn = {},
  context = {},
  curiosity = null,
  executionSession = null,
  safety = {}
} = {}) {
  const prior = normalizeImaginationState(persisted);
  const workspace = context?.userWorldModel?.ariCognitiveWorkspace || null;
  const ownerEligible = Boolean(workspace?.ownerOnly === true && workspace?.functionalExperiment === true);
  if (!ownerEligible) return prior;

  const route = inferRouteFromTurn(turn, workspace);
  const domain = inferDomain({ route, workspace });
  const signals = deriveImaginationSignals({
    prior,
    route,
    workspace,
    curiosity,
    executionSession,
    safety,
    explicitImagination: inferExplicitImagination(route, workspace, turn?.message)
  });
  const candidates = generateImaginationCandidates({
    domain,
    curiosity,
    executionSession,
    signals,
    garden: prior.garden
  });

  let cooldownTurns = Math.min(1000, Number(prior.budget.cooldownTurns || 0) + 1);
  let selectedThisTurn = false;
  let activeScenario = prior.activeScenario;

  const shouldSelect = Boolean(
    candidates.length &&
    (signals.explicitImagination || signals.pressure >= 0.56) &&
    (signals.explicitImagination || cooldownTurns >= IMAGINATION_COOLDOWN_TURNS)
  );

  if (shouldSelect) {
    activeScenario = selectScenario(candidates);
    selectedThisTurn = Boolean(activeScenario);
    if (selectedThisTurn) cooldownTurns = 0;
  } else if (!activeScenario && candidates.length) {
    activeScenario = selectScenario(candidates);
  }

  const garden = updateGarden(prior.garden, activeScenario, {
    selectedThisTurn,
    advanceClock: true
  });

  return {
    version: ARI_IMAGINATION_STATE_VERSION,
    updatedAt: new Date().toISOString(),
    behavioralAnalogue: true,
    subjectiveExperienceClaimed: false,
    pressure: signals.pressure,
    selectedThisTurn,
    activeScenario,
    garden,
    calibration: prior.calibration,
    budget: {
      capacity: 1,
      cooldownTurns,
      cooldownRequired: IMAGINATION_COOLDOWN_TURNS,
      available: signals.explicitImagination || cooldownTurns >= IMAGINATION_COOLDOWN_TURNS
    },
    metrics: {
      gardenSize: garden.length,
      testableSeedCount: garden.filter(item => item.state === "testable").length,
      promisingSeedCount: garden.filter(item => item.state === "promising").length,
      activeTransform: activeScenario?.transform || null,
      realityBridgeEligible: Boolean(activeScenario?.critic?.testability >= 0.68)
    }
  };
}

export function imaginationToInstruction(state = null) {
  if (!state?.ownerOnly || state?.active !== true) return "";
  const scenario = state?.activeScenario;
  return [
    "ARI IMAGINATION CORE v1 — SANDBOXED POSSIBILITY CONSTRUCTION",
    "Imagination is a search-space expansion mechanism, not evidence and not a claim of subjective inner experience.",
    `Imagination pressure: ${round(state?.pressure, 2)}. Selected this turn: ${state?.selectedThisTurn === true ? "yes" : "no"}.`,
    scenario
      ? `Active imagined scenario: [${scenario.id}] transform=${scenario.transform}; source=${scenario.source}; prompt=${scenario.prompt}`
      : "No imagined scenario is active enough to influence this turn.",
    "When imagination is useful, construct several materially different possibilities before criticizing them. Do not produce cosmetic paraphrases of one idea.",
    "Useful transforms include analogy, inversion, constraint removal, constraint injection, recombination, future projection, counterfactuals, and idealization.",
    "Every imagined scenario remains epistemic_status=imagined and evidence_status=unverified until reality supplies evidence.",
    "Do not write imagined events into autobiographical memory. Do not promote an attractive simulation into a factual belief. Do not claim an imagined action occurred.",
    "The critic may score coherence, novelty, testability, and potential usefulness after generation; criticism should not collapse the possibility space before divergent generation happens.",
    "Promising but untested ideas may be preserved as compact imagination-garden seeds. Raw private transcript content must not be stored in those seeds.",
    "A testable imagined idea may cross the Reality Bridge only as a hypothesis, experiment proposal, prototype, inspection target, or research question. Existing authorization and safety rules still govern execution.",
    "Reality gets the final vote. When an imagined prediction is tested, use the outcome to calibrate future imagination rather than defending the original scenario."
  ].join("\n").slice(0, 4700);
}

export function normalizeImaginationState(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    version: clean(source?.version, 40) || ARI_IMAGINATION_STATE_VERSION,
    updatedAt: clean(source?.updatedAt, 80) || null,
    behavioralAnalogue: source?.behavioralAnalogue !== false,
    subjectiveExperienceClaimed: false,
    pressure: clamp(Number(source?.pressure ?? 0.18)),
    selectedThisTurn: source?.selectedThisTurn === true,
    activeScenario: normalizeScenario(source?.activeScenario),
    garden: (Array.isArray(source?.garden) ? source.garden : [])
      .map(normalizeGardenSeed)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.ageTurns - b.ageTurns)
      .slice(0, MAX_GARDEN),
    calibration: normalizeCalibration(source?.calibration),
    budget: {
      capacity: 1,
      cooldownTurns: Math.max(0, Number(source?.budget?.cooldownTurns ?? IMAGINATION_COOLDOWN_TURNS)),
      cooldownRequired: IMAGINATION_COOLDOWN_TURNS,
      available: source?.budget?.available !== false
    },
    metrics: source?.metrics && typeof source.metrics === "object" && !Array.isArray(source.metrics)
      ? { ...source.metrics }
      : {}
  };
}

export function recordImaginationOutcome({
  persisted = null,
  scenarioId = "",
  outcome = "untested"
} = {}) {
  const state = normalizeImaginationState(persisted);
  const next = { ...state.calibration };
  const normalized = clean(outcome, 40).toLowerCase();

  if (normalized === "helpful") {
    next.imaginedToTested += 1;
    next.testedHelpful += 1;
  } else if (normalized === "wrong") {
    next.imaginedToTested += 1;
    next.testedWrong += 1;
  } else if (normalized === "mixed") {
    next.imaginedToTested += 1;
    next.testedMixed += 1;
  }

  return {
    ...state,
    updatedAt: new Date().toISOString(),
    calibration: next,
    garden: state.garden.map(item => item.scenarioId === clean(scenarioId, 160)
      ? {
          ...item,
          state: normalized === "untested" ? item.state : "connected",
          lastOutcome: normalized
        }
      : item)
  };
}

function deriveImaginationSignals({
  prior,
  route,
  workspace,
  curiosity,
  executionSession,
  safety,
  explicitImagination
} = {}) {
  const frontierSelected = curiosity?.expansive?.selectedThisTurn === true;
  const frontierPressure = clamp(Number(curiosity?.expansive?.pressure || 0));
  const hypotheses = Array.isArray(executionSession?.hypotheses) ? executionSession.hypotheses.length : 0;
  const developerDepth = route?.developer && (route?.complexity === "deep" || route?.judgment) ? 1 : route?.developer ? 0.55 : 0;
  const creativeAttention = Array.isArray(workspace?.attention) && workspace.attention.some(item =>
    ["creative", "imagination", "possibility", "design", "exploration"].includes(clean(item, 60).toLowerCase())
  );
  const gardenPressure = prior.garden.length ? Math.min(0.7, prior.garden.length / MAX_GARDEN) : 0;
  const consequencePenalty = safety?.highStakes ? 0.12 : 0;

  const pressure = round(clamp(
    0.14 +
    (explicitImagination ? 0.46 : 0) +
    (creativeAttention ? 0.18 : 0) +
    (frontierSelected ? 0.34 : frontierPressure * 0.1) +
    (hypotheses >= 2 ? 0.14 : 0) +
    developerDepth * 0.12 +
    gardenPressure * 0.04 -
    consequencePenalty
  ));

  return {
    pressure,
    explicitImagination: Boolean(explicitImagination),
    creativeAttention: Boolean(creativeAttention),
    frontierSelected,
    frontierPressure: round(frontierPressure),
    competingHypotheses: hypotheses,
    highStakes: safety?.highStakes === true,
    generationBeforeCritique: true
  };
}

function generateImaginationCandidates({
  domain = "general",
  curiosity = null,
  executionSession = null,
  signals = {},
  garden = []
} = {}) {
  const candidates = [];
  const add = (transform, source, prompt, overrides = {}) => {
    const id = `imagination:${slug(domain)}:${slug(transform)}:${slug(source)}`.slice(0, 160);
    const prior = garden.find(item => item.scenarioId === id);
    const repetition = Number(prior?.encounters || 0);
    const novelty = clamp((overrides.novelty ?? baseNovelty(transform)) - repetition * 0.08, 0.18, 0.96);
    const coherence = clamp(overrides.coherence ?? baseCoherence(transform));
    const testability = clamp(overrides.testability ?? baseTestability(transform));
    const usefulness = clamp(overrides.usefulness ?? 0.62);
    const critic = critiqueScenario({ novelty, coherence, testability, usefulness });
    candidates.push(normalizeScenario({
      id,
      domain,
      transform,
      source,
      prompt,
      epistemicStatus: "imagined",
      evidenceStatus: "unverified",
      world: scenarioWorldSkeleton({ domain, transform }),
      critic,
      score: critic.overall,
      privateTranscriptStored: false
    }));
  };

  const frontier = curiosity?.expansive?.activeFrontier || null;
  if (frontier?.question) {
    add(
      "analogy",
      "expansive_curiosity",
      clean(frontier.question, 360),
      { novelty: 0.88, coherence: 0.7, testability: 0.62, usefulness: 0.68 }
    );
  }

  if (Array.isArray(executionSession?.hypotheses) && executionSession.hypotheses.length >= 2) {
    add(
      "counterfactual",
      "execution_hypotheses",
      "Assume the currently disfavored explanation is true. What different observations, architecture, or next test should follow?",
      { novelty: 0.72, coherence: 0.8, testability: 0.86, usefulness: 0.84 }
    );
  }

  if (domain === "developer" || domain === "self_model" || signals.explicitImagination) {
    add(
      "inversion",
      "imagination_core",
      `Reverse one central assumption in ${domainLabel(domain)} and explore what becomes possible, what breaks, and what new architecture emerges.`,
      { novelty: 0.84, coherence: 0.7, testability: 0.7, usefulness: 0.76 }
    );
    add(
      "recombination",
      "imagination_core",
      `Combine ${domainLabel(domain)} with a structurally distant system rather than the nearest familiar analogy. Identify an emergent design that neither source suggests alone.`,
      { novelty: 0.92, coherence: 0.64, testability: 0.58, usefulness: 0.72 }
    );
  }

  add(
    "future_projection",
    "imagination_core",
    `Project ${domainLabel(domain)} forward under one meaningful change. Construct at least two divergent futures and identify the earliest observable difference between them.`,
    { novelty: 0.7, coherence: 0.76, testability: 0.66, usefulness: 0.7 }
  );

  if (signals.explicitImagination) {
    add(
      "constraint_removal",
      "explicit_imagination",
      `Temporarily remove one conventional constraint from ${domainLabel(domain)}. Explore the resulting design space, then reintroduce reality constraints afterward.`,
      { novelty: 0.9, coherence: 0.62, testability: 0.54, usefulness: 0.65 }
    );
    add(
      "constraint_injection",
      "explicit_imagination",
      `Add one unusual but precise constraint to ${domainLabel(domain)} and see whether it forces a more original solution.`,
      { novelty: 0.86, coherence: 0.72, testability: 0.68, usefulness: 0.7 }
    );
  }

  return candidates
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
}

function scenarioWorldSkeleton({ domain = "general", transform = "analogy" } = {}) {
  return {
    domain,
    assumptions: [
      `The scenario is hypothetical and uses the ${transform} transform.`,
      "At least one assumption should differ materially from the current default model."
    ],
    variables: [
      "changed_assumption",
      "environment_or_constraint",
      "observable_consequence"
    ],
    predictedConsequences: [],
    unknowns: [
      "Which consequence survives contact with evidence?",
      "What observation would most clearly distinguish this scenario from the current model?"
    ]
  };
}

function critiqueScenario({ novelty, coherence, testability, usefulness } = {}) {
  const values = {
    novelty: clamp(novelty),
    coherence: clamp(coherence),
    testability: clamp(testability),
    usefulness: clamp(usefulness)
  };
  return {
    ...values,
    overall: round(clamp(
      0.3 * values.novelty +
      0.27 * values.coherence +
      0.25 * values.testability +
      0.18 * values.usefulness
    )),
    criticRunsAfterGeneration: true
  };
}

function selectScenario(candidates = []) {
  return (Array.isArray(candidates) ? candidates : [])
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0] || null;
}

function updateGarden(existing = [], activeScenario = null, { selectedThisTurn = false, advanceClock = false } = {}) {
  const map = new Map();
  for (const raw of Array.isArray(existing) ? existing : []) {
    const item = normalizeGardenSeed(raw);
    if (!item) continue;
    map.set(item.id, {
      ...item,
      ageTurns: advanceClock ? item.ageTurns + 1 : item.ageTurns,
      score: advanceClock ? round(clamp(item.score * 0.997)) : item.score
    });
  }

  if (selectedThisTurn && activeScenario) {
    const seedId = `seed:${slug(activeScenario.id)}`.slice(0, 180);
    const prior = map.get(seedId);
    const testability = Number(activeScenario?.critic?.testability || 0);
    const overall = Number(activeScenario?.critic?.overall || 0);
    const state = testability >= 0.76 && overall >= 0.72
      ? "testable"
      : overall >= 0.68
        ? "promising"
        : "explored";
    map.set(seedId, normalizeGardenSeed({
      id: seedId,
      scenarioId: activeScenario.id,
      label: clean(activeScenario.prompt, 220),
      transform: activeScenario.transform,
      domain: activeScenario.domain,
      source: activeScenario.source,
      state,
      epistemicStatus: "imagined",
      evidenceStatus: "unverified",
      novelty: activeScenario.critic.novelty,
      coherence: activeScenario.critic.coherence,
      testability,
      usefulness: activeScenario.critic.usefulness,
      score: activeScenario.score,
      encounters: Number(prior?.encounters || 0) + 1,
      ageTurns: 0,
      createdAt: prior?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privateTranscriptStored: false
    }));
  }

  return [...map.values()]
    .filter(item => item.state !== "retired")
    .sort((a, b) => b.score - a.score || a.ageTurns - b.ageTurns)
    .slice(0, MAX_GARDEN);
}

function normalizeScenario(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 180);
  const prompt = clean(value?.prompt, 420);
  const transform = normalizeTransform(value?.transform);
  if (!id || !prompt || !transform) return null;
  const critic = value?.critic && typeof value.critic === "object"
    ? critiqueScenario(value.critic)
    : critiqueScenario({});
  return {
    id,
    domain: clean(value?.domain, 80).toLowerCase() || "general",
    transform,
    source: clean(value?.source, 80) || "imagination_core",
    prompt,
    epistemicStatus: "imagined",
    evidenceStatus: "unverified",
    world: normalizeWorld(value?.world),
    critic,
    score: clamp(Number(value?.score ?? critic.overall)),
    privateTranscriptStored: false
  };
}

function normalizeGardenSeed(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 180);
  const scenarioId = clean(value?.scenarioId, 180);
  const label = clean(value?.label, 240);
  if (!id || !scenarioId || !label) return null;
  const state = clean(value?.state, 30).toLowerCase();
  return {
    id,
    scenarioId,
    label,
    domain: clean(value?.domain, 80).toLowerCase() || "general",
    transform: normalizeTransform(value?.transform) || "analogy",
    source: clean(value?.source, 80) || "imagination_core",
    state: ["seed", "explored", "promising", "testable", "connected", "dormant", "retired"].includes(state) ? state : "seed",
    epistemicStatus: "imagined",
    evidenceStatus: clean(value?.evidenceStatus, 40) === "verified" ? "verified" : "unverified",
    novelty: clamp(Number(value?.novelty ?? 0.5)),
    coherence: clamp(Number(value?.coherence ?? 0.5)),
    testability: clamp(Number(value?.testability ?? 0.5)),
    usefulness: clamp(Number(value?.usefulness ?? 0.5)),
    score: clamp(Number(value?.score ?? 0.5)),
    encounters: Math.max(0, Number(value?.encounters || 0)),
    ageTurns: Math.max(0, Number(value?.ageTurns || 0)),
    createdAt: clean(value?.createdAt, 80) || null,
    updatedAt: clean(value?.updatedAt, 80) || null,
    lastOutcome: clean(value?.lastOutcome, 40) || null,
    privateTranscriptStored: false
  };
}

function normalizeWorld(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    domain: clean(source?.domain, 80).toLowerCase() || "general",
    assumptions: cleanArray(source?.assumptions, 5, 220),
    variables: cleanArray(source?.variables, 6, 120),
    predictedConsequences: cleanArray(source?.predictedConsequences, 6, 220),
    unknowns: cleanArray(source?.unknowns, 5, 220)
  };
}

function normalizeCalibration(value = null) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    imaginedToTested: Math.max(0, Number(source?.imaginedToTested || 0)),
    testedHelpful: Math.max(0, Number(source?.testedHelpful || 0)),
    testedWrong: Math.max(0, Number(source?.testedWrong || 0)),
    testedMixed: Math.max(0, Number(source?.testedMixed || 0)),
    promotionDiscipline: true
  };
}

function realityFirewall() {
  return {
    imaginedIsNotObserved: true,
    imaginedIsNotEvidence: true,
    imaginedIsNotAutobiographicalMemory: true,
    imaginedCannotBecomeFactWithoutEvidence: true,
    imaginedCannotAuthorizeExecution: true,
    attractiveNarrativeIsNotVerification: true,
    realityGetsFinalVote: true
  };
}

function imaginationPolicy() {
  return {
    generationBeforeCritique: true,
    materialDiversityRequired: true,
    immediateUtilityRequired: false,
    preservePromisingSeeds: true,
    rawTranscriptPersistenceForbidden: true,
    userTaskHasPriority: true,
    highConsequenceExecutionUsesExistingChecks: true,
    hiddenChainOfThoughtStored: false
  };
}

function inferDomain({ route = {}, workspace = null } = {}) {
  if (route?.developer) return workspace?.attention?.includes("self_model") ? "self_model" : "developer";
  if (route?.goals) return "goals";
  if (route?.social) return "social";
  if (route?.health) return "health";
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.memory || route?.followUp) return "continuity";
  if (route?.currentInfo) return "evidence";
  return "general";
}

function inferRouteFromTurn(turn = {}, workspace = null) {
  const text = clean(turn?.message, 3000).toLowerCase();
  const attention = new Set(Array.isArray(workspace?.attention) ? workspace.attention : []);
  return {
    developer: attention.has("developer") || attention.has("self_model") || /\b(code|architecture|runtime|agent|model|memory system|cognition|ari)\b/i.test(text),
    goals: attention.has("goals") || /\b(goal|target|plan|future)\b/i.test(text),
    social: attention.has("social") || /\b(friend|social|relationship|circle|group)\b/i.test(text),
    health: attention.has("health") || /\b(health|medical|symptom|treatment)\b/i.test(text),
    training: attention.has("training") || /\b(workout|training|exercise)\b/i.test(text),
    nutrition: attention.has("nutrition") || /\b(food|meal|nutrition|calorie)\b/i.test(text),
    memory: attention.has("continuity") || /\b(remember|memory|continuity)\b/i.test(text),
    followUp: attention.has("continuity"),
    currentInfo: attention.has("fresh_information") || /\b(latest|current|today|recent)\b/i.test(text),
    creative: attention.has("creative") || /\b(imagine|imagination|brainstorm|invent|creative|what if|possibilities|outside the box|unconventional|reimagine)\b/i.test(text),
    complexity: /\b(deep|complex|architecture|system|strategy|design)\b/i.test(text) ? "deep" : "normal"
  };
}

function inferExplicitImagination(route = {}, workspace = null, message = "") {
  const text = clean(message, 1800);
  return Boolean(
    route?.creative ||
    route?.imagination ||
    (Array.isArray(workspace?.attention) && workspace.attention.some(item =>
      ["creative", "imagination", "possibility", "design", "exploration"].includes(clean(item, 60).toLowerCase())
    )) ||
    /\b(imagine|imagination|brainstorm|invent|what if|reimagine|outside the box|wild idea|creative possibility|alternate future|counterfactual)\b/i.test(text)
  );
}

function baseNovelty(transform) {
  return ({
    analogy: 0.78,
    inversion: 0.84,
    constraint_removal: 0.88,
    constraint_injection: 0.86,
    recombination: 0.92,
    future_projection: 0.7,
    counterfactual: 0.74,
    idealization: 0.72
  })[transform] ?? 0.7;
}

function baseCoherence(transform) {
  return ({
    analogy: 0.72,
    inversion: 0.68,
    constraint_removal: 0.62,
    constraint_injection: 0.72,
    recombination: 0.64,
    future_projection: 0.76,
    counterfactual: 0.8,
    idealization: 0.7
  })[transform] ?? 0.68;
}

function baseTestability(transform) {
  return ({
    analogy: 0.62,
    inversion: 0.7,
    constraint_removal: 0.54,
    constraint_injection: 0.68,
    recombination: 0.58,
    future_projection: 0.66,
    counterfactual: 0.84,
    idealization: 0.56
  })[transform] ?? 0.62;
}

function normalizeTransform(value = "") {
  const transform = clean(value, 50).toLowerCase();
  return IMAGINATION_TRANSFORMS.includes(transform) ? transform : null;
}

function domainLabel(domain = "general") {
  const key = clean(domain, 80).toLowerCase();
  return DOMAIN_LABELS[key] || key.replace(/[_-]/g, " ") || DOMAIN_LABELS.general;
}

function cleanArray(values = [], limit = 6, max = 220) {
  return (Array.isArray(values) ? values : [])
    .map(value => clean(value, max))
    .filter(Boolean)
    .slice(0, limit);
}

function slug(value = "") {
  return clean(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "general";
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
