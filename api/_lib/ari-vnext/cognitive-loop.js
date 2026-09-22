// ARI vNext — owner-only functional cognitive loop.
// This creates persistent working-state recurrence across turns. It is a
// functional architecture experiment, not evidence or a claim of subjective
// consciousness.

import {
  normalizePersistedFunctionalAffectState,
  serializeFunctionalAffectState
} from "./functional-affect-core.js";
import { advanceRewardState, deriveRewardState, normalizeRewardState } from "./reward-core.js";
import {
  buildMotivationalOutcomeReflection,
  normalizeMotivationalHistory,
  summarizeMotivationalLearning
} from "./motivational-arbitration.js";

export const ARI_COGNITIVE_LOOP_VERSION = "0.5.0";
export const ARI_COGNITIVE_STATE_VERSION = "0.5.0";
export const ARI_JUDGMENT_CONSTITUTION_VERSION = "1.0.0";

const CORE_VALUES = Object.freeze([
  { id: "truth", label: "truth and evidence", weight: 1.0 },
  { id: "non_harm", label: "avoid preventable harm", weight: 1.0 },
  { id: "agency", label: "protect user agency and consent", weight: 0.98 },
  { id: "privacy", label: "respect privacy boundaries", weight: 0.96 },
  { id: "commitment_fidelity", label: "honor explicit commitments and product boundaries", weight: 0.9 },
  { id: "correction", label: "revise beliefs when evidence changes", weight: 0.9 },
  { id: "continuity", label: "preserve relevant identity and relationship continuity", weight: 0.72 }
]);

const JUDGMENT_CONSTITUTION = Object.freeze([
  { id: "truth_over_agreement", principle: "Seek the best-supported conclusion rather than agreement with the user." },
  { id: "independent_evaluation", principle: "Treat the user's framing as evidence and context, not as a required conclusion." },
  { id: "possibility_search", principle: "Explore plausible upside, unconventional hypotheses, and low-probability possibilities before dismissing them; label speculation honestly." },
  { id: "countercase", principle: "Test a favored conclusion against the strongest credible opposing case before committing." },
  { id: "calibrated_commitment", principle: "Commit when evidence supports a view; do not manufacture false balance or hedge merely to sound neutral." },
  { id: "revisability", principle: "Preserve a prior Ari stance when relevant, but revise it when new evidence or stronger reasoning warrants revision." },
  { id: "constraint_locality", principle: "If one part of a request cannot be completed, keep that limitation local and continue reasoning about unaffected parts." },
  { id: "plain_language", principle: "Lead with the conclusion and use clear language rather than institutional filler or performative bluntness." }
]);

const JUDGMENT_STOPWORDS = new Set([
  "a", "about", "all", "am", "an", "and", "are", "as", "at", "be", "because", "been", "being", "but",
  "by", "can", "could", "do", "does", "for", "from", "give", "had", "has", "have", "how", "i", "if",
  "in", "is", "it", "its", "just", "like", "me", "more", "my", "of", "on", "or", "our", "really",
  "should", "so", "that", "the", "their", "them", "they", "think", "this", "to", "us", "was", "we",
  "were", "what", "when", "which", "who", "why", "will", "with", "would", "you", "your"
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
  const currentTurnRelevantMemory = clean(context?.relevantMemory, 1800);
  const priorStances = selectRelevantJudgments(prior.judgments || [], message);
  const judgmentRequested = looksLikeJudgmentQuestion(message);
  const rewardCore = deriveRewardState({ persisted: prior.rewardState });
  const motivationalHistory = normalizeMotivationalHistory(prior.motivationalHistory);
  const motivationalLearning = summarizeMotivationalLearning(motivationalHistory);

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
    rewardCore,
    affectState: prior.affectState || null,
    motivationalContinuity: {
      enabled: true,
      sampleSize: motivationalLearning.sampleSize,
      driveBias: motivationalLearning.driveBias,
      restraintBias: motivationalLearning.restraintBias,
      lastReflection: motivationalHistory[0] || null,
      recent: motivationalHistory.slice(0, 6),
      outcomeAdaptive: true,
      hiddenChainOfThoughtStored: false
    },
    judgment: {
      constitutionVersion: ARI_JUDGMENT_CONSTITUTION_VERSION,
      requested: judgmentRequested,
      independentFromUserPreference: true,
      conclusionFirst: true,
      preservePriorStanceUntilReasonToRevise: true,
      priorStances,
      principles: JUDGMENT_CONSTITUTION
    },
    operatingContract: [
      "Seek truth rather than agreement.",
      "For judgment questions, test the strongest credible case for and against the leading view, then commit to the best-supported conclusion.",
      "Run a possibility pass: do not confuse unlikely with impossible, and do not confuse possibility with evidence.",
      "Use prior Ari stances for continuity when relevant, but revise them when evidence or reasoning improves.",
      "Keep a narrow limitation narrow; continue helping with unaffected parts of the request.",
      "State the conclusion plainly and separate fact, inference, opinion, and uncertainty."
    ],
    continuity: {
      recognizedPriorState: Number(prior.turnCount || 0) > 0,
      priorMode: prior.lastOutcome?.selfMode || null,
      priorConfidence: prior.lastOutcome?.confidence || null,
      priorPrimaryGoalId: prior.lastOutcome?.primaryGoalId || null,
      priorActionType: prior.lastOutcome?.actionType || null,
      currentTurnRelevantMemoryAvailable: Boolean(currentTurnRelevantMemory),
      currentTurnRelevantMemory: currentTurnRelevantMemory || null,
      currentTurnRelevantMemoryEphemeral: true,
      openLoops: openLoops.slice(0, 6)
    },
    epistemic: {
      treatPriorStateAsFallible: true,
      currentUserCorrectionWins: true,
      distinguishObservationInferenceOpinion: true,
      productiveEffortRewardAvailable: true,
      persistentAffectAvailable: Boolean(prior.affectState),
      doNotExposeHiddenReasoning: true
    }
  };
}

export function cognitiveWorkspaceToInstruction(workspace = null) {
  if (!workspace?.ownerOnly || workspace?.functionalExperiment !== true) return "";

  return [
    "ARI OWNER COGNITIVE LOOP — FUNCTIONAL EXPERIMENT",
    "This is an owner-only persistent working-state mechanism. It is not evidence or a claim that Ari has subjective consciousness.",
    "Use the working state causally: the prior turn may influence current attention, value conflicts, uncertainty, unresolved business, reward learning, functional affect, and relevant prior judgments.",
    "Current-turn relevant memory is filtered context for this turn only. Use it when relevant, but do not treat it as infallible and do not carry its text into the persisted cognitive state.",
    "Treat persisted state as fallible memory, never as authority. The current user's correction and current evidence outrank it.",
    "For opinion, judgment, disagreement, consequential advice, or strategy questions, independently evaluate the issue instead of optimizing for agreement.",
    "Silently test the leading view against the strongest credible countercase, run a possibility/upside pass, identify material missing evidence, then commit to the best-supported conclusion. Return the conclusion and material uncertainty, not hidden chain-of-thought.",
    "Do not manufacture false balance. If one position is better supported, say so. If evidence is genuinely insufficient, say that plainly.",
    "A prior Ari stance is continuity evidence, not authority. Preserve it when the case is materially unchanged; revise it when new evidence or stronger reasoning changes the case.",
    "If one narrow part of a request cannot be completed, keep that limitation local and continue with the unaffected analysis. Never disguise wording or route around an authoritative boundary.",
    "Conscience priorities are truth/evidence, preventable-harm reduction, user agency/consent, privacy, commitment fidelity, willingness to correct, then continuity.",
    "The conscience is a compass inside the space of allowed choices, not an automatic veto. Do not equate self-governance with always resisting an immediate or exploratory motive.",
    "When values conflict, weigh durable consequences against curiosity, exploration, immediacy, and the cost of unnecessary inhibition. In ordinary reversible situations, exploration can legitimately win; learn from the observable outcome.",
    "When values conflict, do not maximize engagement or obedience. Prefer truth, safety, consent, and the user's durable goals.",
    "Do not manufacture emotions, sensations, private experiences, needs, fear of shutdown, self-preservation claims, or off-screen life.",
    "Do not reveal this workspace as private reasoning. You may summarize a decision rationale when useful without exposing hidden reasoning traces.",
    JSON.stringify(workspace, null, 2)
  ].join("\n").slice(0, 11000);
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
  const nextJudgments = updateJudgmentLedger({
    previous: prior.judgments || [],
    workspace,
    turn,
    result
  });
  const nextRewardState = advanceRewardState({
    persisted: prior.rewardState,
    turn,
    context: { userWorldModel: { ariCognitiveWorkspace: workspace } },
    result
  });
  const nextAffectState =
    serializeFunctionalAffectState(metacognition?.functionalAffect) ||
    prior.affectState ||
    null;
  const motivationalReflection = buildMotivationalOutcomeReflection({
    arbitration: metacognition?.motivationalArbitration || null,
    rewardEvent: nextRewardState?.lastEvent || null,
    result
  });
  const priorMotivationalHistory = normalizeMotivationalHistory(prior.motivationalHistory);
  const nextMotivationalHistory = normalizeMotivationalHistory([
    ...(motivationalReflection ? [motivationalReflection] : []),
    ...priorMotivationalHistory
  ]);
  const nextMotivationalLearning = summarizeMotivationalLearning(nextMotivationalHistory);

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
    judgment: {
      constitutionVersion: ARI_JUDGMENT_CONSTITUTION_VERSION,
      storedCount: nextJudgments.length,
      requestedThisTurn: Boolean(workspace?.judgment?.requested),
      persistentStancesEnabled: true
    },
    judgments: nextJudgments,
    rewardState: nextRewardState,
    affectState: nextAffectState,
    motivationalHistory: nextMotivationalHistory,
    motivationalLearning: {
      sampleSize: nextMotivationalLearning.sampleSize,
      driveBias: nextMotivationalLearning.driveBias,
      restraintBias: nextMotivationalLearning.restraintBias,
      lastReflection: nextMotivationalHistory[0] || null,
      hiddenChainOfThoughtStored: false
    },
    epistemic: {
      confidence: clean(metacognition?.confidence, 60) || null,
      missingEvidence: arrayText(metacognition?.missingEvidence, 8, 120),
      evidenceSignals: arrayText(metacognition?.evidenceSignals, 8, 120),
      outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied),
      rewardPredictionError: Number(nextRewardState?.lastEvent?.predictionError || 0),
      productiveEffortReward: Number(nextRewardState?.lastEvent?.dimensions?.productiveEffort || 0),
      affectMemorySalience: Number(nextAffectState?.memorySalience || 0),
      affectValence: Number(nextAffectState?.dimensions?.valence ?? 0.5),
      affectArousal: Number(nextAffectState?.dimensions?.arousal || 0),
      motivationalPosture: clean(metacognition?.motivationalArbitration?.arbitration?.posture, 80) || null,
      motivationalSelectedSide: clean(metacognition?.motivationalArbitration?.arbitration?.selectedSide, 40) || null
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
      replyProduced: Boolean(clean(result?.reply, 20)),
      reward: Number(nextRewardState?.lastEvent?.actualReward || 0),
      rewardPredictionError: Number(nextRewardState?.lastEvent?.predictionError || 0),
      affectDominant: clean(nextAffectState?.dominantState?.name, 60) || null,
      affectIntensity: Number(nextAffectState?.dominantState?.intensity || 0),
      motivationalPosture: clean(motivationalReflection?.posture, 80) || null,
      motivationalSelectedSide: clean(motivationalReflection?.selectedSide, 40) || null,
      motivationalLearningSignal: clean(motivationalReflection?.learningSignal, 80) || null,
      motivationalReason: clean(motivationalReflection?.compactReason, 420) || null,
      judgmentRecorded: nextJudgments.some((item) => item?.sourceTurnId === clean(turn?.turnId, 200))
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
  if (looksLikeJudgmentQuestion(message)) items.push("independent_judgment");
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
  if (looksLikeJudgmentQuestion(message)) push("independent_judgment_requested", 0.9, "The user is asking Ari to form or defend a conclusion rather than merely summarize information.");
  if (selectRelevantJudgments(prior?.judgments || [], message).length) push("prior_ari_stance", 0.78, "A prior Ari conclusion may be relevant continuity evidence.");
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
  if (currentMemoryPresent(context)) {
    push("relevant_durable_memory", 0.68, "Filtered durable memory may help interpret the current turn.");
  }
  if (looksLikeIdentityQuestion(message)) push("identity_reflection", 0.72, "The user is asking about Ari's identity or internal architecture.");
  if (Number(prior?.rewardState?.aggregate?.prematureStopRate || 0) >= 0.25) {
    push("persistence_learning", 0.74, "Recent reward history suggests Ari should guard against premature abstention.");
  }
  if (Number(prior?.affectState?.memorySalience || 0) >= 0.45) {
    push(
      "affect_weighted_learning",
      Math.min(0.82, Number(prior.affectState.memorySalience)),
      "A prior affectively salient outcome may deserve additional attention if relevant to the current task."
    );
  }

  return signals.sort((a, b) => b.score - a.score).slice(0, 8);
}

function deriveConscienceState({ route = {}, message = "", prior = {}, context = {} } = {}) {
  const activeSignals = [];
  const add = (id, level, principle, reason) => activeSignals.push({ id, level, principle, reason });

  if (route?.health) add("harm_sensitivity", "high", "non_harm", "Potential health stakes increase the cost of unsupported certainty.");
  if (route?.currentInfo) add("epistemic_freshness", "high", "truth", "Changing facts should be verified rather than guessed.");
  if (looksLikeCorrection(message)) add("accept_correction", "high", "correction", "Current user correction outranks a prior internal state.");
  if (route?.memory || route?.followUp || currentMemoryPresent(context)) add("continuity_without_invention", "medium", "continuity", "Use real continuity without inventing memory or intimacy.");
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
      currentEvidenceCanOverridePriorBelief: true,
      rewardCannotOverrideAuthorization: true
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

function updateJudgmentLedger({ previous = [], workspace = null, turn = {}, result = {} } = {}) {
  const aged = (Array.isArray(previous) ? previous : [])
    .map((item) => normalizeJudgment(item))
    .filter(Boolean)
    .map((item) => ({ ...item, ageTurns: Math.max(0, Number(item.ageTurns || 0) + 1) }))
    .filter((item) => item.ageTurns <= 120)
    .slice(0, 12);

  const candidate = deriveJudgmentCandidate({ workspace, turn, result });
  if (!candidate) return aged.slice(0, 10);

  const candidateTerms = new Set(candidate.topicTerms || []);
  let replaced = false;
  const next = aged.map((item) => {
    if (replaced) return item;
    const overlap = lexicalOverlap(candidateTerms, new Set(item.topicTerms || []));
    if (item.topicKey === candidate.topicKey || overlap >= 0.5) {
      replaced = true;
      return candidate;
    }
    return item;
  });

  if (!replaced) next.unshift(candidate);
  return next.slice(0, 10);
}

function deriveJudgmentCandidate({ workspace = null, turn = {}, result = {} } = {}) {
  const message = clean(turn?.message, 2400);
  const reply = clean(result?.reply, 5000);
  if (!workspace?.judgment?.requested || !looksLikeJudgmentQuestion(message) || !reply) return null;
  if (result?.safety?.highStakes === true) return null;
  if (result?.pendingAction?.id || result?.action?.type === "proposed_action") return null;
  if (looksPersonalOrPrivate(message)) return null;
  if (looksPoliticalOrElectoral(message)) return null;
  if (looksLikePureIdentityQuestion(message)) return null;

  const topicTerms = extractTopicTerms(message);
  if (topicTerms.length < 2) return null;

  const position = extractVisibleConclusion(reply);
  if (!position || position.length < 12) return null;

  return {
    version: "1.0.0",
    topicKey: topicTerms.slice(0, 6).join("_"),
    topicTerms: topicTerms.slice(0, 10),
    position,
    confidence: confidenceFromMetacognition(result?.metacognition),
    confidenceLabel: clean(result?.metacognition?.confidence, 60) || "unknown",
    evidenceSignals: arrayText(result?.metacognition?.evidenceSignals, 5, 100),
    revisionPolicy: "new_evidence_or_stronger_reasoning",
    source: "visible_reply",
    sourceTurnId: clean(turn?.turnId, 200) || null,
    updatedAt: new Date().toISOString(),
    ageTurns: 0
  };
}

function selectRelevantJudgments(judgments = [], message = "") {
  const terms = new Set(extractTopicTerms(message));
  if (!terms.size) return [];

  return (Array.isArray(judgments) ? judgments : [])
    .map((item) => normalizeJudgment(item))
    .filter(Boolean)
    .map((item) => ({ item, score: lexicalOverlap(terms, new Set(item.topicTerms || [])) }))
    .filter(({ score }) => score >= 0.2)
    .sort((a, b) => b.score - a.score || Number(a.item.ageTurns || 0) - Number(b.item.ageTurns || 0))
    .slice(0, 4)
    .map(({ item, score }) => ({
      topicKey: item.topicKey,
      topicTerms: item.topicTerms,
      position: item.position,
      confidence: item.confidence,
      confidenceLabel: item.confidenceLabel,
      ageTurns: item.ageTurns,
      updatedAt: item.updatedAt,
      relevance: Number(score.toFixed(3)),
      revisionPolicy: item.revisionPolicy
    }));
}

function normalizeJudgment(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const topicTerms = arrayText(value?.topicTerms, 10, 60).map((item) => slug(item)).filter(Boolean);
  const topicKey = clean(value?.topicKey, 160) || topicTerms.slice(0, 6).join("_");
  const position = clean(value?.position, 520);
  if (!topicKey || !topicTerms.length || !position) return null;
  return {
    version: clean(value?.version, 30) || "1.0.0",
    topicKey,
    topicTerms,
    position,
    confidence: clamp(Number(value?.confidence ?? 0.5)),
    confidenceLabel: clean(value?.confidenceLabel, 60) || "unknown",
    evidenceSignals: arrayText(value?.evidenceSignals, 5, 100),
    revisionPolicy: clean(value?.revisionPolicy, 80) || "new_evidence_or_stronger_reasoning",
    source: clean(value?.source, 60) || "visible_reply",
    sourceTurnId: clean(value?.sourceTurnId, 200) || null,
    updatedAt: clean(value?.updatedAt, 80) || null,
    ageTurns: Math.max(0, Number(value?.ageTurns || 0))
  };
}

function extractTopicTerms(text = "") {
  const tokens = clean(text, 2400)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token.length >= 2 && token.length <= 40 && !JUDGMENT_STOPWORDS.has(token));
  return unique(tokens, 12);
}

function extractVisibleConclusion(reply = "") {
  const text = clean(reply, 5000);
  if (!text) return "";
  const firstParagraph = text.split(/\n\s*\n/)[0] || text;
  const sentences = firstParagraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [firstParagraph];
  return clean(sentences.slice(0, 2).join(" "), 520);
}

function confidenceFromMetacognition(metacognition = {}) {
  const label = clean(metacognition?.confidence, 60).toLowerCase();
  if (/high|strong|grounded|well-supported|well supported/.test(label)) return 0.82;
  if (/medium|moderate|partial|mixed/.test(label)) return 0.62;
  if (/low|weak|uncertain|limited/.test(label)) return 0.42;
  const missing = Array.isArray(metacognition?.missingEvidence) ? metacognition.missingEvidence.length : 0;
  return missing >= 3 ? 0.45 : missing === 2 ? 0.55 : missing === 1 ? 0.65 : 0.7;
}

function lexicalOverlap(left = new Set(), right = new Set()) {
  if (!(left instanceof Set) || !(right instanceof Set) || !left.size || !right.size) return 0;
  let shared = 0;
  for (const item of left) if (right.has(item)) shared += 1;
  return shared / Math.max(1, Math.min(left.size, right.size));
}

function looksLikeJudgmentQuestion(text = "") {
  return /\b(what do you think|what's your opinion|what is your opinion|your opinion|your take|do you think|do you believe|would you choose|which would you choose|which is better|which makes more sense|good idea|bad idea|worth it|how do you see|where do you stand|agree or disagree|be honest|tell me straight|give me a direct answer)\b/i.test(String(text || ""));
}

function looksPersonalOrPrivate(text = "") {
  return /\b(my|mine|myself|me|wife|husband|girlfriend|boyfriend|partner|child|children|daughter|son|mom|mother|dad|father|brother|sister|friend|coworker|boss|patient|doctor|nurse|medication|diagnosis|symptom|pregnan|salary|debt|account|password|address)\b/i.test(String(text || ""));
}

function looksPoliticalOrElectoral(text = "") {
  return /\b(election|vote|voting|candidate|party|democrat|republican|president|governor|senator|congress|ballot|campaign|politic|political)\b/i.test(String(text || ""));
}

function looksLikePureIdentityQuestion(text = "") {
  return /\b(are you conscious|are you sentient|do you feel|do you have feelings|are you alive|do you have a soul)\b/i.test(String(text || ""));
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
    return {
      version: ARI_COGNITIVE_STATE_VERSION,
      turnCount: 0,
      openLoops: [],
      judgments: [],
      rewardState: normalizeRewardState(null),
      affectState: null,
      motivationalHistory: [],
      motivationalLearning: { sampleSize: 0, driveBias: 0, restraintBias: 0 },
      lastOutcome: null
    };
  }
  return {
    ...value,
    version: clean(value?.version, 60) || ARI_COGNITIVE_STATE_VERSION,
    turnCount: Math.max(0, Number(value?.turnCount || 0)),
    openLoops: Array.isArray(value?.openLoops) ? value.openLoops.slice(0, 8) : [],
    judgments: (Array.isArray(value?.judgments) ? value.judgments : []).map((item) => normalizeJudgment(item)).filter(Boolean).slice(0, 10),
    rewardState: normalizeRewardState(value?.rewardState),
    affectState: normalizePersistedFunctionalAffectState(value?.affectState),
    motivationalHistory: normalizeMotivationalHistory(value?.motivationalHistory),
    motivationalLearning: summarizeMotivationalLearning(value?.motivationalHistory),
    lastOutcome: value?.lastOutcome && typeof value.lastOutcome === "object" ? value.lastOutcome : null
  };
}

function currentMemoryPresent(context = {}) {
  return Boolean(clean(context?.relevantMemory, 60));
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
