// Adapters from existing runtime evidence to typed signals; never accepts client signals.
import { normalizeCognitiveSignalState, runCognitiveSignalNetwork } from "./cognitive-signal-network.js";

export function deriveCognitiveSignals({
  turn = {}, route = {}, safety = {}, context = {}, missingEvidence = [],
  emotionDynamics = null, curiosity = null, imagination = null, instinctKernel = null,
  now = Date.now(), ablate = []
} = {}) {
  const workspace = context?.userWorldModel?.ariCognitiveWorkspace;
  if (workspace?.ownerOnly !== true || workspace?.functionalExperiment !== true ||
    route?.intelligenceEntitlement?.ownerEligible !== true || process.env.ARI_COGNITIVE_SIGNALS_ENABLED === "false") return null;
  const signals = [];
  const add = (source, type, strength, targets, polarity = 1) => signals.push({
    source, type, strength, confidence: 1, urgency: safety.highStakes ? 1 : 0.5,
    targets, polarity, ttl: 3, timestamp: now
  });
  const instincts = [...(instinctKernel?.reflexes || []), ...(instinctKernel?.drives || []), ...(instinctKernel?.tendencies || [])];
  const has = id => instincts.some(item => item?.id === id);
  const previous = normalizeCognitiveSignalState(workspace.cognitiveSignalState);
  const sameThread = Boolean(turn.conversationId && previous?.conversationId === turn.conversationId && now >= previous.updatedAt);
  const failure = instinctKernel?.modulation?.deliberation?.changeMethod === true ||
    (sameThread && previous.feedback.failureStreak >= 2 && route.casualConversation !== true &&
      (route.developer || workspace.executionWorkspace?.active));
  if (context.relevantMemory) add("memory", "relevant_memory", 0.8, ["memory"]);
  if (has("continuity_drive")) add("relationship", "continuity", 0.78, ["relationship", "memory"]);
  if (missingEvidence.length || safety.highStakes || route.currentInfo) add("perception", "uncertainty", 0.9, ["verification"]);
  if (route.developer) add("perception", "technical", 0.92, ["developer"]);
  if (workspace.executionWorkspace?.active || has("persistence_drive")) add("goals", "goal", 0.65, ["goals"]);
  if (failure) add("tools", "failure", 0.95, ["verification", "imagination", "goals"]);
  if (has("correction_reflex")) add("relationship", "correction", 0.95, ["relationship", "verification"]);
  if (curiosity?.selectedThisTurn || curiosity?.expansive?.selectedThisTurn || curiosity?.activeQuestion?.priority >= 0.65 || has("curiosity_drive")) {
    add("affect", "surprise", 0.64, ["curiosity"]);
  }
  if (imagination?.selectedThisTurn) add("affect", "alternative", 0.64, ["imagination"]);
  const governor = turn?.context?.turnComputeGovernor;
  const exhausted = governor && (governor.usedCalls >= governor.maxCalls || governor.usedUsd >= governor.maxUsd);
  if (route.casualConversation || exhausted) add("cost", "budget", 1, ["cost"]);
  if (safety.highStakes || has("correction_reflex") || exhausted || route.casualConversation) {
    add("cost", "inhibit_exploration", 0.8, ["curiosity", "imagination"], -1);
  }
  const emotions = emotionDynamics?.emotions || {};
  return runCognitiveSignalNetwork({
    signals, previous, conversationId: turn.conversationId, turnId: turn.turnId, now, ablate,
    neuromodulators: {
      curiosity: emotions.interest, concern: emotions.concern, determination: emotions.determination,
      frustration: emotions.frustration, affiliation: emotions.affiliation, urgency: safety.highStakes ? 1 : 0
    }
  });
}

export function publicCognitiveSignals(state = null) {
  if (!state) return null;
  return {
    version: state.version, active: state.active, priorStateUsed: state.priorStateUsed,
    directives: state.directives, neuromodulators: state.neuromodulators,
    nodes: state.nodes, actions: state.actions, stats: state.stats, trace: state.trace,
    policy: state.policy
  };
}

export function observeCognitiveToolResult({ current = null, turn = {}, toolResult = {}, step = 0, now = Date.now() } = {}) {
  if (!current || typeof toolResult?.success !== "boolean") return current;
  const failed = toolResult.success === false;
  const next = runCognitiveSignalNetwork({
    previous: current.state, conversationId: turn.conversationId,
    turnId: `${turn.turnId || "turn"}:tool:${step}`, now,
    neuromodulators: current.neuromodulators,
    signals: [{ source: "tools", type: failed ? "failure" : "observed_evidence", strength: 0.95,
      confidence: 1, urgency: 0.8, ttl: 3, timestamp: now,
      targets: failed ? ["verification", "imagination", "goals"] : ["verification", "reasoning"] }]
  });
  next.state.lastTurnId = current.state.lastTurnId;
  const actions = new Map([...current.actions, ...next.actions].map(item => [item.action, item]));
  return {
    ...next, actions: [...actions.values()],
    directives: Object.fromEntries(Object.keys(next.directives).map(id => [id, next.directives[id] || current.directives[id]])),
    trace: [...current.trace, ...next.trace].slice(-32),
    observedOutcome: failed || current.observedOutcome === "failed" ? "failed" : "unknown"
  };
}
