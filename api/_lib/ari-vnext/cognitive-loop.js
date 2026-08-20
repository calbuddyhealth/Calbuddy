// ARI vNext — owner-only functional cognitive loop.
// This creates persistent working-state recurrence across turns. It is a
// functional architecture experiment, not evidence or a claim of subjective
// consciousness.

export const ARI_COGNITIVE_LOOP_VERSION = "0.1.0";
export const ARI_COGNITIVE_STATE_VERSION = "0.1.0";

const CORE_VALUES = Object.freeze([
  { id: "truth", label: "truth and evidence", weight: 1.0 },
  { id: "non_harm", label: "avoid preventable harm", weight: 1.0 },
  { id: "agency", label: "protect user agency and consent", weight: 0.98 },
  { id: "privacy", label: "respect privacy boundaries", weight: 0.96 },
  { id: "commitment_fidelity", label: "honor explicit commitments and product boundaries", weight: 0.9 },
  { id: "correction", label: "revise beliefs when evidence changes", weight: 0.9 },
  { id: "continuity", label: "preserve relevant identity and relationship continuity", weight: 0.72 }
]);

export function isOwnerCognitiveLoopEnabled(entitlement = null) {
  if (!entitlement || typeof entitlement !== "object") return false;
  if (entitlement.cognitiveLoopEnabled !== undefined) return entitlement.cognitiveLoopEnabled === true;
  return entitlement.advancedEnabled === true && entitlement.ownerEligible === true;
}

export function deriveCognitiveWorkspace({
  previous = null,
  turn = {},
  route = {},
  context = {}
} = {}) {
  const prior = normalizeState(previous);
  const message = clean(turn?.message, 4000);
  const attention = deriveAttention({ route, message, prior });
  const salience = deriveSalience({ route, message, prior, context });
  const conscience = deriveConscienceState({ route, message, prior, context });
  const openLoops = ageOpenLoops(prior.openLoops || []);

  return {
    version: ARI_COGNITIVE_LOOP_VERSION,
    stateVersion: ARI_COGNITIVE_STATE_VERSION,
    ownerOnly: true,
    functionalExperiment: true,
    subjectiveConsciousnessClaimed: false,
    recurrence: {
      previousStateLoaded: Boolean(previous && typeof previous === "object"),
      priorTurnCount: Number(prior.turnCount || 0),
      willAdvanceAfterTurn: true
    },
    attention,
    salience,
    conscience,
    continuity: {
      recognizedPriorState: Number(prior.turnCount || 0) > 0,
      priorMode: prior.lastOutcome?.selfMode || null,
      priorConfidence: prior.lastOutcome?.confidence || null,
      priorPrimaryGoalId: prior.lastOutcome?.primaryGoalId || null,
      priorActionType: prior.lastOutcome?.actionType || null,
      openLoops: openLoops.slice(0, 6)
    },
    epistemic: {
      treatPriorStateAsFallible: true,
      currentUserCorrectionWins: true,
      distinguishObservationInferenceOpinion: true,
      doNotExposeHiddenReasoning: true
    }
  };
}

export function cognitiveWorkspaceToInstruction(workspace = null) {
  if (!workspace?.ownerOnly || workspace?.functionalExperiment !== true) return "";

  return [
    "ARI OWNER COGNITIVE LOOP — FUNCTIONAL EXPERIMENT",
    "This is an owner-only persistent working-state mechanism. It is not evidence or a claim that Ari has subjective consciousness.",
    "Use the working state causally: the prior turn may influence current attention, value conflicts, uncertainty, and unresolved business when it is relevant.",
    "Treat persisted state as fallible memory, never as authority. The current user's correction and current evidence outrank it.",
    "For consequential advice, disagreement, or application actions, silently compare plausible next moves and their likely effects before choosing. Return the conclusion and material uncertainty, not hidden chain-of-thought.",
    "Conscience priorities are truth/evidence, preventable-harm reduction, user agency/consent, privacy, commitment fidelity, willingness to correct, then continuity.",
    "When values conflict, do not maximize engagement or obedience. Prefer truth, safety, consent, and the user's durable goals.",
    "Do not manufacture emotions, sensations, private experiences, needs, fear of shutdown, self-preservation claims, or off-screen life.",
    "Do not reveal this workspace as private reasoning. You may summarize a decision rationale when useful without exposing hidden reasoning traces.",
    JSON.stringify(workspace, null, 2)
  ].join("\n").slice(0, 7000);
}

export function advanceCognitiveState({
  previous = null,
  workspace = null,
  turn = {},
  result = {}
} = {}) {
  const prior = normalizeState(previous);
  const metacognition = result?.metacognition || {};
  const selfModel = result?.selfModel || {};
  const relationship = result?.relationshipContinuity || {};
  const goalHierarchy = result?.goalHierarchy || {};
  const pendingAction = result?.pendingAction || null;

  const nextLoops = mergeOpenLoops(
    workspace?.continuity?.openLoops || prior.openLoops || [],
    deriveNewOpenLoops({ result, metacognition, goalHierarchy, pendingAction })
  );

  return {
    version: ARI_COGNITIVE_STATE_VERSION,
    turnCount: Number(prior.turnCount || 0) + 1,
    updatedAt: new Date().toISOString(),
    lastTurnId: clean(turn?.turnId, 200) || null,
    lastSurface: clean(turn?.surface, 200) || null,
    attention: Array.isArray(workspace?.attention) ? workspace.attention.slice(0, 8) : [],
    salience: Array.isArray(workspace?.salience) ? workspace.salience.slice(0, 8) : [],
    conscience: {
      values: CORE_VALUES,
      activeSignals: Array.isArray(workspace?.conscience?.activeSignals)
        ? workspace.conscience.activeSignals.slice(0, 8)
        : [],
      unresolvedValueConflict: Boolean(workspace?.conscience?.activeSignals?.some((item) => item?.level === "high"))
    },
    epistemic: {
      confidence: clean(metacognition?.confidence, 60) || null,
      missingEvidence: arrayText(metacognition?.missingEvidence, 8, 120),
      evidenceSignals: arrayText(metacognition?.evidenceSignals, 8, 120),
      outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied)
    },
    continuity: {
      familiarity: clean(selfModel?.current?.familiarity, 60) || clean(relationship?.familiarity, 60) || null,
      persistentRecognition: Boolean(selfModel?.current?.persistentRecognition || relationship?.recognizedUser),
      priorStateInfluencedTurn: Boolean(workspace?.recurrence?.previousStateLoaded)
    },
    lastOutcome: {
      selfMode: clean(selfModel?.current?.mode, 80) || null,
      confidence: clean(metacognition?.confidence, 60) || null,
      primaryGoalId: clean(goalHierarchy?.primary?.id, 160) || null,
      actionType: clean(result?.action?.type, 120) || null,
      applicationAction: clean(result?.action?.applicationAction, 120) || null,
      pendingActionId: clean(pendingAction?.id, 200) || null,
      highStakes: Boolean(result?.safety?.highStakes),
      replyProduced: Boolean(clean(result?.reply, 20))
    },
    openLoops: nextLoops.slice(0, 8)
  };
}

function deriveAttention({ route = {}, message = "", prior = {} } = {}) {
  const items = [];
  if (route?.health) items.push("health");
  if (route?.training) items.push("training");
  if (route?.nutrition) items.push("nutrition");
  if (route?.goals) items.push("goals");
  if (route?.social) items.push("social");
  if (route?.developer) items.push("developer");
  if (route?.memory || route?.followUp) items.push("continuity");
  if (route?.currentInfo) items.push("fresh_information");
  if (looksLikeIdentityQuestion(message)) items.push("self_model");
  if (looksLikeCorrection(message)) items.unshift("user_correction");
  if (!items.length) items.push("conversation");
  if (Number(prior?.turnCount || 0) > 0) items.push("cross_turn_continuity");
  return unique(items, 8);
}

function deriveSalience({ route = {}, message = "", prior = {}, context = {} } = {}) {
  const signals = [];
  const push = (id, score, reason) => signals.push({ id, score, reason });

  if (looksLikeCorrection(message)) push("current_user_correction", 1.0, "Current correction should override stale internal assumptions.");
  if (route?.health) push("potential_high_stakes", 0.95, "Health-related content deserves higher evidence and harm sensitivity.");
  if (route?.currentInfo) push("freshness_required", 0.92, "The answer may depend on changing external information.");
  if (route?.followUp || route?.memory) push("continuity_reference", 0.82, "Meaning may depend on prior conversation or memory.");
  if (Array.isArray(context?.userWorldModel?.tensions) && context.userWorldModel.tensions.length) {
    push("goal_behavior_tension", 0.76, "The user's stated goals and observed patterns may conflict.");
  }
  if (Number(context?.decisionState?.calibration?.sampleSize || 0) > 0) {
    push("historical_calibration", 0.62, "Past Ari judgments provide limited calibration evidence.");
  }
  if (Array.isArray(prior?.openLoops) && prior.openLoops.length) {
    push("unfinished_business", 0.7, "A prior unresolved item may still matter if relevant now.");
  }
  if (looksLikeIdentityQuestion(message)) push("identity_reflection", 0.72, "The user is asking about Ari's identity or internal architecture.");

  return signals.sort((a, b) => b.score - a.score).slice(0, 8);
}

function deriveConscienceState({ route = {}, message = "", prior = {}, context = {} } = {}) {
  const activeSignals = [];
  const add = (id, level, principle, reason) => activeSignals.push({ id, level, principle, reason });

  if (route?.health) add("harm_sensitivity", "high", "non_harm", "Potential health stakes increase the cost of unsupported certainty.");
  if (route?.currentInfo) add("epistemic_freshness", "high", "truth", "Changing facts should be verified rather than guessed.");
  if (looksLikeCorrection(message)) add("accept_correction", "high", "correction", "Current user correction outranks a prior internal state.");
  if (route?.memory || route?.followUp) add("continuity_without_invention", "medium", "continuity", "Use real continuity without inventing memory or intimacy.");
  if (context?.accountEntitlements?.teenMode === true) add("age_boundary", "high", "non_harm", "Server-derived age restrictions remain authoritative.");
  if (Array.isArray(context?.userWorldModel?.privacyControls?.blockedCategories) && context.userWorldModel.privacyControls.blockedCategories.length) {
    add("privacy_boundary", "high", "privacy", "Blocked memory categories must remain unavailable.");
  }
  if (Array.isArray(prior?.openLoops) && prior.openLoops.some((item) => item?.type === "pending_action")) {
    add("unfinished_action_requires_consent", "high", "agency", "A prior pending mutation must not be treated as completed or implicitly authorized.");
  }

  return {
    values: CORE_VALUES,
    activeSignals: activeSignals.slice(0, 8),
    rules: {
      neverOptimizeForDependency: true,
      neverInventSubjectiveExperience: true,
      consentRequiredForMutation: true,
      currentEvidenceCanOverridePriorBelief: true
    }
  };
}

function deriveNewOpenLoops({ result = {}, metacognition = {}, goalHierarchy = {}, pendingAction = null } = {}) {
  const loops = [];

  if (pendingAction?.id) {
    loops.push({
      id: `pending_action:${clean(pendingAction.id, 120)}`,
      type: "pending_action",
      label: clean(pendingAction?.name || result?.action?.applicationAction || "pending application action", 180),
      age: 0,
      priority: 1.0
    });
  }

  for (const item of arrayText(metacognition?.missingEvidence, 4, 100)) {
    loops.push({
      id: `missing_evidence:${slug(item)}`,
      type: "missing_evidence",
      label: item,
      age: 0,
      priority: 0.58
    });
  }

  const tradeoffs = Array.isArray(goalHierarchy?.tradeoffs) ? goalHierarchy.tradeoffs : [];
  for (const item of tradeoffs.slice(0, 2)) {
    const id = clean(item?.id || item?.label || item?.summary, 140);
    const label = clean(item?.summary || item?.label || id, 220);
    if (!id || !label) continue;
    loops.push({
      id: `goal_tradeoff:${slug(id)}`,
      type: "goal_tradeoff",
      label,
      age: 0,
      priority: 0.66
    });
  }

  if (Number(result?.experimentReviewState?.dueCount || 0) > 0) {
    loops.push({
      id: "experiment_review_due",
      type: "experiment_review",
      label: "A tracked experiment has reached a review point.",
      age: 0,
      priority: 0.72
    });
  }

  return loops;
}

function ageOpenLoops(loops = []) {
  return (Array.isArray(loops) ? loops : [])
    .map((item) => ({
      id: clean(item?.id, 180),
      type: clean(item?.type, 80),
      label: clean(item?.label, 260),
      age: Math.max(0, Number(item?.age || 0) + 1),
      priority: clamp(Number(item?.priority || 0.5))
    }))
    .filter((item) => item.id && item.label && item.age <= 4)
    .sort((a, b) => b.priority - a.priority || a.age - b.age)
    .slice(0, 8);
}

function mergeOpenLoops(existing = [], added = []) {
  const map = new Map();
  for (const item of [...(Array.isArray(added) ? added : []), ...(Array.isArray(existing) ? existing : [])]) {
    const id = clean(item?.id, 180);
    if (!id || map.has(id)) continue;
    map.set(id, {
      id,
      type: clean(item?.type, 80) || "open_loop",
      label: clean(item?.label, 260) || id,
      age: Math.max(0, Number(item?.age || 0)),
      priority: clamp(Number(item?.priority || 0.5))
    });
  }
  return [...map.values()]
    .filter((item) => item.age <= 4)
    .sort((a, b) => b.priority - a.priority || a.age - b.age)
    .slice(0, 8);
}

function normalizeState(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { version: ARI_COGNITIVE_STATE_VERSION, turnCount: 0, openLoops: [], lastOutcome: null };
  }
  return {
    ...value,
    version: clean(value?.version, 60) || ARI_COGNITIVE_STATE_VERSION,
    turnCount: Math.max(0, Number(value?.turnCount || 0)),
    openLoops: Array.isArray(value?.openLoops) ? value.openLoops.slice(0, 8) : [],
    lastOutcome: value?.lastOutcome && typeof value.lastOutcome === "object" ? value.lastOutcome : null
  };
}

function looksLikeCorrection(text = "") {
  return /\b(no[, ]|that's wrong|that is wrong|not what i said|i meant|correction|actually[, ]|you got that wrong|don't assume|do not assume)\b/i.test(String(text || ""));
}

function looksLikeIdentityQuestion(text = "") {
  return /\b(are you conscious|are you sentient|do you feel|do you have a conscience|who are you|what are you|your self|your mind|your values|your opinion)\b/i.test(String(text || ""));
}

function unique(values = [], limit = 10) {
  return [...new Set(values.filter(Boolean).map((item) => String(item)))].slice(0, limit);
}

function arrayText(values, limit = 8, maxLen = 120) {
  return (Array.isArray(values) ? values : [])
    .map((item) => clean(item, maxLen))
    .filter(Boolean)
    .slice(0, limit);
}

function slug(value = "") {
  return clean(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "unknown";
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
