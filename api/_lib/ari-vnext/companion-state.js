// ARI vNext — deterministic social-executive companion state.
// Unifies existing relationship, communication, affect, and cognitive-loop
// signals for the current conversation. This module performs no model call.

export const ARI_COMPANION_STATE_VERSION = "2.0.0";

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","been","but","by","do","for","from","had","has","have",
  "how","i","if","in","is","it","me","my","of","on","or","our","so","that","the","their","them",
  "they","this","to","us","was","we","were","what","when","with","would","you","your"
]);

export function deriveCompanionState({
  turn = {},
  route = {},
  communication = {},
  safety = {},
  relationshipContinuity = null,
  metacognition = null,
  relevantContext = null
} = {}) {
  const message = clean(turn?.message, 5000);
  const relationship = relationshipContinuity && typeof relationshipContinuity === "object"
    ? relationshipContinuity
    : {};
  const familiarity = clean(relationship?.familiarity, 40) || "new";
  const conversationSignal = communication?.personalization?.currentTurnSignal || null;
  const repairActive = conversationSignal?.source === "conversation_repair_friction";
  const highStakes = safety?.highStakes === true;
  const greeting = isSimpleGreeting(message);
  const continuityCue = explicitContinuityCue(message);

  const threads = Array.isArray(relationship?.unfinishedThreads)
    ? relationship.unfinishedThreads
    : [];
  const recentSharedEvents = Array.isArray(relationship?.recentSharedEvents)
    ? relationship.recentSharedEvents
    : [];

  const relevantThread = selectRelevantThread({
    message,
    threads,
    greeting,
    continuityCue,
    familiarity
  });
  const relevantSharedEvent = selectRelevantSharedEvent({
    message,
    events: recentSharedEvents,
    continuityCue
  });

  const shouldReferencePast = Boolean(
    relevantThread ||
    relevantSharedEvent ||
    (continuityCue && relationship?.recognizedUser === true)
  );

  const conversationalMode = deriveConversationalMode({
    message,
    route,
    highStakes,
    repairActive
  });
  const responsePosture = deriveResponsePosture({
    conversationalMode,
    familiarity,
    metacognition
  });

  const userInvokedSignal = relevantContext?.initiativeContext?.source === "explicit_ari_signal_engagement";
  const initiative = deriveConversationalInitiative({
    route,
    highStakes,
    repairActive,
    greeting,
    familiarity,
    relevantThread,
    shouldReferencePast,
    userInvokedSignal
  });

  const personalization = communication?.personalization || {};
  const questionBurden = clean(personalization?.questionBurden, 40) || "adaptive";
  const humor = highStakes || repairActive
    ? "off"
    : clean(communication?.humor, 40) || "adaptive";

  return {
    version: ARI_COMPANION_STATE_VERSION,
    familiarity,
    conversationalMode,
    responsePosture,
    repair: {
      active: repairActive,
      source: repairActive ? clean(conversationSignal?.source, 80) : null,
      confidence: repairActive ? clamp01(Number(conversationSignal?.confidence || 0)) : 0,
      acknowledgeExactMismatch: repairActive,
      replaceInterpretationBeforeAdvancing: repairActive,
      invalidateDependentAssumptions: repairActive,
      preserveUnaffectedProgress: true,
      defendPreviousAnswer: false
    },
    continuity: {
      shouldReferencePast,
      strength: continuityStrength({
        familiarity,
        recentContinuityPairs: relationship?.recentContinuityPairs,
        openLoopCount: threads.length,
        sharedEventCount: recentSharedEvents.length
      }),
      openLoopCount: threads.length,
      sharedEventCount: recentSharedEvents.length,
      relevantThread: compactThread(relevantThread),
      relevantSharedEvent: compactEvent(relevantSharedEvent),
      oneNaturalCallbackMaximum: true,
      biographyRecitalAllowed: false,
      forcedCallbackAllowed: false
    },
    initiative,
    interaction: {
      tempo: interactionTempo(message),
      correctionActive: repairActive,
      continuityCue,
      userInvokedSignal,
      explicitTask: route?.casualConversation !== true
    },
    responseStyle: {
      warmth: highStakes
        ? "steady"
        : familiarity === "established" || familiarity === "familiar"
          ? "natural"
          : "neutral",
      directness: clean(communication?.directness, 40) || "adaptive",
      detail: clean(communication?.detail, 40) || "adaptive",
      humor,
      questionBurden,
      continuityReference: shouldReferencePast ? "one_natural_callback_max" : "none_required"
    },
    safeguards: {
      noExtraModelCall: true,
      noEngagementOptimization: true,
      noDependencyOptimization: true,
      noInventedSharedHistory: true,
      noInventedUserEmotion: true,
      noSubjectiveConsciousnessClaim: true,
      currentUserMessageWins: true,
      currentEvidenceWins: true,
      highStakesSuppressesSocialInitiative: true
    },
    source: {
      relationshipContinuity: Boolean(relationshipContinuity),
      communicationPersonalization: Boolean(communication),
      metacognition: Boolean(metacognition),
      cognitiveWorkspace: Boolean(relevantContext?.userWorldModel?.ariCognitiveWorkspace)
    }
  };
}

export function companionStateToInstruction(state = null) {
  if (!state) return "";
  const lines = [
    `ARI COMPANION CORE v${ARI_COMPANION_STATE_VERSION}`,
    "This is a deterministic social-executive state assembled from existing conversation systems. It is not a claim that Ari has subjective feelings or an off-screen life.",
    `Conversation mode: ${state.conversationalMode || "collaborative"}. Response posture: ${state.responsePosture || "neutral"}. Familiarity: ${state.familiarity || "new"}.`,
    "Make the interaction feel continuous through judgment, timing, repair, and relevant callbacks rather than repeated statements that you remember the user.",
    "Do not optimize for engagement, dependency, session length, guilt, pressure, or emotional exclusivity.",
    state?.repair?.active
      ? "REPAIR MODE: identify the specific misunderstanding briefly, replace the affected interpretation, invalidate conclusions that depended on it, preserve unaffected useful work, and continue. Do not defend the previous answer."
      : "",
    state?.continuity?.shouldReferencePast
      ? `CONTINUITY: one natural callback is allowed when it directly helps this turn. Continuity strength: ${state.continuity.strength || "limited"}. Do not recite biography or stack multiple callbacks.`
      : "CONTINUITY: no callback is required. Do not force memory into the conversation.",
    state?.continuity?.relevantThread?.summary
      ? `Relevant unfinished thread: ${clean(state.continuity.relevantThread.summary, 520)}`
      : "",
    state?.continuity?.relevantSharedEvent?.label
      ? `Relevant shared event: ${clean(state.continuity.relevantSharedEvent.label, 420)}`
      : "",
    state?.initiative?.allowed && state?.initiative?.canMentionOpenLoop
      ? "INITIATIVE: a light, relevant mention of the supplied unfinished thread is permitted. It must help the user's current moment and must not hijack the conversation."
      : "INITIATIVE: do not introduce unrelated unfinished business.",
    "Questions are allowed when they materially help the user's goal or understanding; never ask merely to prolong the interaction.",
    "Treat any functional affect/emotion signal as internal response-control state only. Do not infer or claim the user's emotional state unless they explicitly state it."
  ].filter(Boolean);
  return lines.join("\n").slice(0, 4200);
}

function deriveConversationalMode({ message = "", route = {}, highStakes = false, repairActive = false } = {}) {
  if (repairActive) return "repair";
  if (highStakes) return "high_stakes_support";
  if (/\b(think|wonder|reflect|why do you|what do you make of|how do you see)\b/i.test(message)) return "reflective";
  if (route?.developer || route?.training || route?.nutrition || route?.goals || route?.social) return "collaborative_task";
  if (route?.casualConversation === true) return "casual";
  return "collaborative";
}

function deriveResponsePosture({ conversationalMode = "collaborative", familiarity = "new", metacognition = null } = {}) {
  if (conversationalMode === "repair") return "repairing";
  if (conversationalMode === "high_stakes_support") return "steady";

  const dominant =
    metacognition?.emotionDynamics?.dominantState ||
    metacognition?.functionalAffect?.dominantState ||
    null;
  const name = clean(dominant?.name || dominant?.state || dominant?.label, 60).toLowerCase();
  const intensity = clamp01(Number(dominant?.intensity || 0));

  if (intensity >= 0.45 && /frustrat|concern|conflict/.test(name)) return "careful_focused";
  if (intensity >= 0.45 && /curios|determin|interest|satisf|happy|affili/.test(name)) return "engaged";
  if (conversationalMode === "casual" && ["familiar", "established"].includes(familiarity)) return "warm";
  if (conversationalMode === "collaborative_task") return "focused";
  return "neutral";
}

function deriveConversationalInitiative({
  route = {},
  highStakes = false,
  repairActive = false,
  greeting = false,
  familiarity = "new",
  relevantThread = null,
  shouldReferencePast = false,
  userInvokedSignal = false
} = {}) {
  if (highStakes) return noInitiative("high_stakes");
  if (repairActive) return noInitiative("repair_first");
  if (userInvokedSignal) {
    return {
      allowed: false,
      strength: "none",
      canMentionOpenLoop: false,
      askFollowUpSolelyForEngagement: false,
      canAskUsefulQuestion: true,
      userInvoked: true,
      reason: "user_invoked_signal_not_proactive_initiative"
    };
  }

  const threadPriority = clean(relevantThread?.priority, 20).toLowerCase();
  const threadType = clean(relevantThread?.type, 60).toLowerCase();
  const sensitiveOpenLoop = ["pending_action", "missing_evidence"].includes(threadType);
  const dueOrImportant = ["high", "medium"].includes(threadPriority) &&
    !sensitiveOpenLoop;

  const greetingInitiative =
    greeting &&
    familiarity === "established" &&
    relevantThread &&
    threadPriority === "high" &&
    !sensitiveOpenLoop;

  const contextualInitiative =
    !greeting &&
    shouldReferencePast &&
    Boolean(relevantThread) &&
    dueOrImportant;

  const allowed = Boolean(greetingInitiative || contextualInitiative);
  return {
    allowed,
    strength: allowed ? "light" : "none",
    canMentionOpenLoop: allowed,
    askFollowUpSolelyForEngagement: false,
    canAskUsefulQuestion: true,
    reason: allowed
      ? greetingInitiative
        ? "established_relationship_high_priority_thread"
        : "current_turn_relevant_unfinished_thread"
      : route?.casualConversation === true
        ? "no_salient_companion_initiative"
        : "current_task_has_priority"
  };
}

function noInitiative(reason) {
  return {
    allowed: false,
    strength: "none",
    canMentionOpenLoop: false,
    askFollowUpSolelyForEngagement: false,
    canAskUsefulQuestion: true,
    reason
  };
}

function selectRelevantThread({ message = "", threads = [], greeting = false, continuityCue = false, familiarity = "new" } = {}) {
  const normalized = (Array.isArray(threads) ? threads : []).filter(Boolean);
  if (!normalized.length) return null;

  const messageTokens = tokenize(message);
  const ranked = normalized
    .map((thread) => {
      const text = [
        thread?.summary,
        thread?.label,
        thread?.type,
        thread?.domain,
        thread?.state
      ].filter(Boolean).join(" ");
      const overlap = lexicalOverlap(messageTokens, tokenize(text));
      const priority = priorityScore(thread?.priority);
      const dueBoost = /due|review|outcome_pending|blocked|partial/i.test(clean(thread?.state, 80)) ? 0.18 : 0;
      return { thread, score: overlap + priority * 0.12 + dueBoost };
    })
    .sort((a, b) => b.score - a.score);

  if (continuityCue && ranked[0]?.score >= 0.18) return ranked[0].thread;
  if (!greeting && ranked[0]?.score >= 0.34) return ranked[0].thread;

  if (greeting && familiarity === "established") {
    return ranked.find(({ thread }) =>
      clean(thread?.priority, 20).toLowerCase() === "high" &&
      !["pending_action", "missing_evidence"].includes(clean(thread?.type, 60).toLowerCase())
    )?.thread || null;
  }

  return null;
}

function selectRelevantSharedEvent({ message = "", events = [], continuityCue = false } = {}) {
  const normalized = (Array.isArray(events) ? events : []).filter(Boolean);
  if (!normalized.length) return null;

  const messageTokens = tokenize(message);
  const ranked = normalized
    .map((event) => ({
      event,
      score: lexicalOverlap(messageTokens, tokenize([event?.label, event?.type, event?.domain].filter(Boolean).join(" ")))
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0]?.score >= 0.28) return ranked[0].event;
  if (continuityCue) return normalized[0] || null;
  return null;
}

function compactThread(thread = null) {
  if (!thread) return null;
  return {
    id: clean(thread?.id, 180) || null,
    type: clean(thread?.type, 60) || null,
    domain: clean(thread?.domain, 60) || null,
    priority: clean(thread?.priority, 20) || null,
    state: clean(thread?.state, 60) || null,
    summary: clean(thread?.summary || thread?.label, 520) || null,
    dueAt: thread?.dueAt || null,
    referenceId: clean(thread?.referenceId, 180) || null
  };
}

function compactEvent(event = null) {
  if (!event) return null;
  return {
    at: event?.at || null,
    type: clean(event?.type, 60) || null,
    domain: clean(event?.domain, 60) || null,
    label: clean(event?.label, 420) || null
  };
}

function explicitContinuityCue(message = "") {
  return /\b(earlier|before|last time|previously|we talked|we discussed|we did|that change|that thing|continue|pick up|where we left|remember)\b/i.test(clean(message, 1800));
}

function continuityStrength({
  familiarity = "new",
  recentContinuityPairs = 0,
  openLoopCount = 0,
  sharedEventCount = 0
} = {}) {
  const score =
    (familiarity === "established" ? 3 : familiarity === "familiar" ? 2 : familiarity === "developing" ? 1 : 0) +
    (Number(recentContinuityPairs || 0) > 0 ? 1 : 0) +
    (Number(openLoopCount || 0) > 0 ? 1 : 0) +
    (Number(sharedEventCount || 0) > 0 ? 1 : 0);
  if (score >= 5) return "strong";
  if (score >= 3) return "established";
  if (score >= 1) return "developing";
  return "limited";
}

function interactionTempo(message = "") {
  const length = clean(message, 5000).length;
  if (length <= 40) return "brief";
  if (length >= 900) return "extended";
  return "normal";
}

function isSimpleGreeting(message = "") {
  return /^(?:hey|hi|hello|yo|sup|what'?s up|good (?:morning|afternoon|evening))[!.?\s]*$/i.test(clean(message, 180));
}

function tokenize(value = "") {
  const out = new Set();
  for (const token of clean(value, 5000).toLowerCase().match(/[a-z0-9]{2,}/g) || []) {
    if (!STOPWORDS.has(token)) out.add(token);
  }
  return out;
}

function lexicalOverlap(a = new Set(), b = new Set()) {
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return overlap / Math.max(1, Math.min(a.size, b.size));
}

function priorityScore(value) {
  const key = clean(value, 20).toLowerCase();
  if (key === "high") return 1;
  if (key === "medium") return 0.65;
  if (key === "low") return 0.35;
  return 0.2;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
