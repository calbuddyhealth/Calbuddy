// Bounded, deterministic signal propagation. No I/O, timers, workers, or authority.
export const COGNITIVE_SIGNAL_VERSION = "1.0.0";
export const SIGNAL_LIMITS = Object.freeze({ inputs: 24, deliveries: 64, hops: 4, firings: 12, trace: 32 });
const HALF_LIFE_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 30 * 1000;
const NODES = Object.freeze({
  memory: { threshold: 0.65, action: "attend_memory", edges: [["reasoning", 0.35]] },
  relationship: { threshold: 0.65, action: "attend_relationship", edges: [["memory", 0.35]] },
  verification: { threshold: 0.68, action: "verify_evidence", edges: [["reasoning", 0.55]] },
  curiosity: { threshold: 0.70, action: "investigate", optional: true, edges: [["imagination", 0.65], ["reasoning", 0.25]] },
  imagination: { threshold: 0.70, action: "consider_alternative", optional: true, edges: [["reasoning", 0.50]] },
  goals: { threshold: 0.65, action: "persist_goal", edges: [["reasoning", 0.45]] },
  developer: { threshold: 0.70, action: "inspect_repository", edges: [["verification", 0.75], ["reasoning", 0.35]] },
  cost: { threshold: 0.65, action: "conserve_compute", edges: [["curiosity", -0.65], ["imagination", -0.65]] },
  reasoning: { threshold: 0.70, action: "integrate_evidence", edges: [["verification", 0.15]] }
});
export const COGNITIVE_SIGNAL_NODES = Object.freeze(Object.keys(NODES));
const STIMULI = Object.freeze({
  relevant_memory: ["memory", "reasoning"], continuity: ["relationship", "memory"],
  uncertainty: ["verification"], failure: ["verification", "imagination", "goals"],
  surprise: ["curiosity"], alternative: ["imagination"], observed_evidence: ["verification", "reasoning"], goal: ["goals"], technical: ["developer"],
  budget: ["cost"], correction: ["relationship", "verification"],
  inhibit_exploration: ["curiosity", "imagination"]
});
const SOURCES = new Set(["perception", "memory", "affect", "goals", "tools", "cost", "relationship"]);

export function normalizeCognitiveSignalState(value = null) {
  if (!value || value.version !== COGNITIVE_SIGNAL_VERSION) return null;
  const updatedAt = time(value.updatedAt);
  const nodes = {};
  for (const id of COGNITIVE_SIGNAL_NODES) {
    const node = value.nodes?.[id];
    const lastFiredAt = time(node?.lastFiredAt);
    nodes[id] = { activation: unit(node?.activation),
      lastFiredAt: lastFiredAt !== null && updatedAt !== null && lastFiredAt <= updatedAt ? lastFiredAt : null };
  }
  return {
    version: COGNITIVE_SIGNAL_VERSION,
    conversationId: identifier(value.conversationId), updatedAt,
    lastTurnId: identifier(value.lastTurnId), nodes,
    feedback: {
      failureStreak: Math.min(3, Math.floor(unit(value.feedback?.failureStreak, 3))),
      lastOutcome: ["failed", "verified", "unknown"].includes(value.feedback?.lastOutcome) ? value.feedback.lastOutcome : "unknown"
    }
  };
}

export function runCognitiveSignalNetwork({
  signals = [], previous = null, conversationId = null, turnId = null,
  neuromodulators = {}, now = Date.now(), ablate = []
} = {}) {
  const timestamp = time(now) ?? Date.now();
  const scope = identifier(conversationId);
  const priorCandidate = normalizeCognitiveSignalState(previous);
  // Clock rollback or a new conversation discards activation and cooldowns.
  const prior = scope && priorCandidate?.conversationId === scope && priorCandidate.updatedAt !== null &&
    timestamp >= priorCandidate.updatedAt ? priorCandidate : null;
  const elapsed = prior ? timestamp - prior.updatedAt : Infinity;
  const carry = prior ? 2 ** (-elapsed / HALF_LIFE_MS) : 0;
  const blocked = new Set(COGNITIVE_SIGNAL_NODES.filter(id => ablate.includes(id)));
  const modulation = {
    curiosity: unit(neuromodulators.curiosity), concern: unit(neuromodulators.concern),
    determination: unit(neuromodulators.determination), frustration: unit(neuromodulators.frustration),
    affiliation: unit(neuromodulators.affiliation), urgency: unit(neuromodulators.urgency)
  };
  const nodes = {};
  for (const id of COGNITIVE_SIGNAL_NODES) {
    nodes[id] = {
      activation: Math.min(0.35, unit(prior?.nodes?.[id]?.activation) * carry),
      threshold: threshold(id, modulation), lastFiredAt: prior?.nodes?.[id]?.lastFiredAt ?? null,
      fired: false, refractoryUntilHop: -1
    };
  }
  const stats = { inputCount: 0, processed: 0, fired: 0, invalid: 0, duplicate: 0, expired: 0, suppressed: 0, dropped: 0 };
  const trace = [];
  const actions = [];
  const record = entry => { if (trace.length < SIGNAL_LIMITS.trace) trace.push(entry); };
  const seen = new Set();
  let queue = [];
  const inputs = Array.isArray(signals) ? signals : [];
  stats.dropped = Math.max(0, inputs.length - SIGNAL_LIMITS.inputs);
  for (const raw of inputs.slice(0, SIGNAL_LIMITS.inputs)) {
    stats.inputCount++;
    const signal = normalizeSignal(raw, timestamp);
    if (!signal) { stats.invalid++; continue; }
    if (signal.ttl === 0 || signal.timestamp > timestamp || timestamp - signal.timestamp > HALF_LIFE_MS) {
      stats.expired++; continue;
    }
    const key = `${signal.source}:${signal.type}:${signal.polarity}:${signal.targets.join(",")}`;
    if (seen.has(key)) { stats.duplicate++; continue; }
    seen.add(key);
    queue.push(signal);
  }
  const duplicateTurn = Boolean(turnId && prior?.lastTurnId === identifier(turnId));
  if (duplicateTurn) { stats.duplicate += queue.length; queue = []; }
  // Aggregate excitation and inhibition before firing; input ordering cannot evade inhibition.
  for (let hop = 0; queue.length && hop < SIGNAL_LIMITS.hops; hop++) {
    const deltas = {};
    queue.sort((a, b) => b.urgency - a.urgency || a.type.localeCompare(b.type));
    for (const signal of queue) {
      if (signal.ttl <= 0) { stats.expired++; continue; }
      for (const target of signal.targets) {
        if (stats.processed >= SIGNAL_LIMITS.deliveries) { stats.dropped++; continue; }
        stats.processed++;
        if (blocked.has(target)) { stats.suppressed++; record({ hop, node: target, reason: "ablated" }); continue; }
        const delta = signal.strength * signal.confidence * signal.polarity;
        const entry = deltas[target] ||= { delta: 0, ttl: 0 };
        entry.delta += delta;
        if (delta > 0) entry.ttl = Math.max(entry.ttl, signal.ttl);
        record({ hop, source: signal.source, type: signal.type, node: target, delta: round(delta) });
      }
    }
    // Inhibitory connections settle before excitatory nodes fire, including
    // cost pressure delivered in the same wave as curiosity.
    for (const id of COGNITIVE_SIGNAL_NODES) {
      if (deltas[id]) nodes[id].activation = unit(nodes[id].activation * (hop ? 0.9 : 1) + deltas[id].delta);
    }
    const cost = nodes.cost;
    if (deltas.cost?.ttl > 1 && cost.activation >= cost.threshold && !cost.fired) {
      for (const [target, weight] of NODES.cost.edges) {
        nodes[target].activation = unit(nodes[target].activation + weight);
        record({ hop, source: "cost", type: "inhibition", node: target, delta: weight });
      }
    }
    const next = [];
    for (const id of COGNITIVE_SIGNAL_NODES) {
      const entry = deltas[id];
      if (!entry) continue;
      const node = nodes[id];
      if (node.activation < node.threshold) continue;
      const cooling = NODES[id].optional && node.lastFiredAt !== null && timestamp - node.lastFiredAt < COOLDOWN_MS;
      if (node.fired || hop <= node.refractoryUntilHop || cooling) {
        stats.suppressed++; record({ hop, node: id, reason: "refractory" }); continue;
      }
      if (stats.fired >= SIGNAL_LIMITS.firings) { stats.dropped++; continue; }
      node.fired = true;
      node.lastFiredAt = timestamp;
      node.refractoryUntilHop = hop + 2;
      stats.fired++;
      actions.push({ node: id, action: NODES[id].action, strength: round(node.activation), hop });
      record({ hop, node: id, reason: "threshold_crossed", activation: round(node.activation), threshold: node.threshold });
      node.activation *= 0.25;
      if (entry.ttl > 1) {
        for (const [target, weight] of NODES[id].edges.filter(([, weight]) => weight > 0)) next.push({
          source: id, type: "propagation", strength: Math.abs(weight), confidence: 1,
          polarity: Math.sign(weight), targets: [target], ttl: entry.ttl - 1,
          urgency: modulation.urgency, timestamp
        });
      }
    }
    queue = next;
  }
  stats.dropped += queue.length;
  const active = action => actions.some(item => item.action === action);
  const changeMethod = active("consider_alternative") && (
    inputs.slice(0, SIGNAL_LIMITS.inputs).some(item => item?.type === "failure") || modulation.frustration >= 0.6
  );
  const state = {
    version: COGNITIVE_SIGNAL_VERSION, conversationId: scope, updatedAt: timestamp,
    lastTurnId: identifier(turnId),
    nodes: Object.fromEntries(COGNITIVE_SIGNAL_NODES.map(id => [id, {
      activation: round(nodes[id].activation), lastFiredAt: nodes[id].lastFiredAt
    }])),
    feedback: prior?.feedback || { failureStreak: 0, lastOutcome: "unknown" }
  };
  return {
    version: COGNITIVE_SIGNAL_VERSION, active: true, priorStateUsed: Boolean(prior), duplicateTurn,
    neuromodulators: modulation,
    nodes: Object.fromEntries(COGNITIVE_SIGNAL_NODES.map(id => [id, {
      activation: round(nodes[id].activation), threshold: nodes[id].threshold, fired: nodes[id].fired
    }])),
    actions, directives: {
      verifyEvidence: active("verify_evidence"), changeMethod,
      investigate: active("investigate"), considerAlternative: active("consider_alternative"),
      persistGoal: active("persist_goal"), attendMemory: active("attend_memory"),
      attendRelationship: active("attend_relationship"), inspectRepository: active("inspect_repository"),
      conserveCompute: active("conserve_compute")
    }, stats, trace, state,
    policy: { noExtraModelCall: true, noPermissionExpansion: true, noScheduledWork: true, hiddenChainOfThoughtStored: false }
  };
}

// Store only compact node state and outcomes. Tool text, prompts, and signals are ephemeral.
export function advanceCognitiveSignalState({ current = null, result = {} } = {}) {
  const state = normalizeCognitiveSignalState(current?.state);
  if (!state || current?.duplicateTurn) return state;
  const verified = result?.success !== false && result?.executionEvidence?.verification?.status === "passed";
  const failed = !verified && (current?.observedOutcome === "failed" || result?.success === false || result?.executionEvidence?.verification?.status === "failed");
  state.feedback = {
    failureStreak: failed ? Math.min(3, state.feedback.failureStreak + 1) : verified ? 0 : state.feedback.failureStreak,
    lastOutcome: failed ? "failed" : verified ? "verified" : "unknown"
  };
  return state;
}

function normalizeSignal(raw, now) {
  if (!raw || !SOURCES.has(raw.source) || !Object.hasOwn(STIMULI, raw.type)) return null;
  if (!Number.isFinite(raw.strength) || !Number.isFinite(raw.confidence) || !Number.isFinite(raw.urgency ?? 0)) return null;
  if (raw.polarity !== undefined && raw.polarity !== 1 && raw.polarity !== -1) return null;
  const allowed = STIMULI[raw.type];
  const requested = raw.targets === undefined ? allowed : raw.targets;
  if (!Array.isArray(requested) || !requested.length || requested.some(id => !allowed.includes(id))) return null;
  const ttl = raw.ttl === undefined ? 3 : raw.ttl;
  if (!Number.isFinite(ttl) || ttl < 0) return null;
  const timestamp = raw.timestamp === undefined ? now : time(raw.timestamp);
  if (timestamp === null) return null;
  return {
    source: raw.source, type: raw.type, strength: unit(raw.strength), confidence: unit(raw.confidence),
    urgency: unit(raw.urgency), polarity: raw.polarity ?? 1, targets: [...new Set(requested)].sort(),
    ttl: Math.min(SIGNAL_LIMITS.hops, Math.floor(ttl)), timestamp
  };
}
function threshold(id, m) {
  let adjustment = 0;
  if (id === "curiosity" || id === "imagination") adjustment -= 0.12 * m.curiosity;
  if (id === "imagination") adjustment -= 0.08 * m.frustration;
  if (id === "verification") adjustment -= 0.12 * m.concern;
  if (id === "goals") adjustment -= 0.12 * m.determination;
  if (id === "relationship" || id === "memory") adjustment -= 0.08 * m.affiliation;
  return round(Math.max(0.45, Math.min(0.9, NODES[id].threshold + adjustment)));
}
function unit(value, max = 1) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0; }
function time(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null; }
function identifier(value) { return typeof value === "string" ? value.trim().slice(0, 200) || null : null; }
function round(value) { return Math.round(value * 1000) / 1000; }
