// ARI vNext — deterministic initiative selection.
// Ari may surface meaningful unfinished business or objective changes without an
// LLM call. Initiative exists to help, not to maximize engagement.

export const ARI_INITIATIVE_ENGINE_VERSION = "1.1.0";

export function deriveInitiativeCandidate({
  proactiveInsights = null,
  relationshipContinuity = null,
  experimentLedger = null,
  circleEvents = null,
  now = new Date()
} = {}) {
  const candidates = [];
  const insights = Array.isArray(proactiveInsights?.items) ? proactiveInsights.items : [];
  const threads = Array.isArray(relationshipContinuity?.unfinishedThreads) ? relationshipContinuity.unfinishedThreads : [];
  const socialEvents = Array.isArray(circleEvents?.items) ? circleEvents.items : [];

  for (const event of socialEvents) {
    const mapped = candidateFromCircleEvent(event);
    if (mapped) candidates.push(mapped);
  }

  for (const insight of insights) {
    if (!insight || insight.priority === "internal") continue;
    const mapped = candidateFromInsight(insight);
    if (mapped) candidates.push(mapped);
  }

  for (const thread of threads) {
    const mapped = candidateFromThread(thread);
    if (mapped) candidates.push(mapped);
  }

  const deduped = dedupe(candidates)
    .filter((item) => item.userFacing !== false)
    .sort((a, b) => initiativeWeight(b.priority) - initiativeWeight(a.priority) || Number(b.confidence || 0) - Number(a.confidence || 0));

  const best = deduped[0] || null;
  if (!best || !["high", "medium", "positive"].includes(best.priority)) {
    return noInitiative("nothing_meaningful_enough");
  }

  return {
    version: ARI_INITIATIVE_ENGINE_VERSION,
    shouldInitiate: true,
    generatedAt: toIso(now),
    candidate: {
      ...best,
      initiativeKey: initiativeKey(best),
      generatedBy: "deterministic_vnext_initiative_engine",
      requiresLanguageModelCall: false
    },
    rules: initiativeRules()
  };
}

export function initiativeToConversationContext(candidate = null) {
  if (!candidate) return null;
  return {
    id: candidate.reasonId || null,
    initiativeKey: candidate.initiativeKey || null,
    opener: candidate.opener || null,
    context: candidate.context || null,
    followUpPrompt: candidate.followUpPrompt || null,
    priority: candidate.priority || null,
    userInitiatedFollowUp: true
  };
}

function candidateFromCircleEvent(event = {}) {
  const eventId = clean(event.eventId, 180);
  const type = clean(event.type, 100).toLowerCase();
  const subjectId = clean(event.subjectId, 180);
  if (!eventId || !type || !subjectId) return null;

  const actorName = clean(event?.actor?.displayName, 100);
  const actorPhrase = actorName ? `${actorName} ` : "The host ";
  const base = {
    reasonId: `circle_${type.replace(/[^a-z0-9]+/g, "_")}_${eventId}`.slice(0, 240),
    source: "circle_domain_event",
    priority: "medium",
    confidence: 0.99,
    domain: "social",
    context: `Verified Circle state change: ${type}.`,
    signature: clean(`${eventId}|${type}|${subjectId}|${event.occurredAt || ""}`, 1200),
    userFacing: true,
    cooldownHours: 24
  };

  if (type === "meetup.accepted") {
    return {
      ...base,
      priority: "high",
      opener: `${actorPhrase}accepted your meetup request.`,
      followUpPrompt: "Show me my upcoming Circle schedule and what I should know about the meetup that was just accepted.",
      action: "review_circle_schedule"
    };
  }

  if (type === "meetup.cancelled") {
    return {
      ...base,
      priority: "high",
      opener: "A meetup you were attending was cancelled.",
      followUpPrompt: "A Circle meetup I was attending was cancelled. Show me the best current alternatives that fit my active intent.",
      action: "find_circle_replacement"
    };
  }

  if (type === "meetup.waitlisted") {
    return {
      ...base,
      priority: "medium",
      opener: "Your meetup request moved to the waitlist.",
      followUpPrompt: "My Circle request was waitlisted. Show me my current status and other good opportunities I could choose instead.",
      action: "review_circle_status"
    };
  }

  if (type === "meetup.declined") {
    return {
      ...base,
      priority: "medium",
      opener: "Your meetup request wasn't accepted.",
      followUpPrompt: "My Circle meetup request was declined. Find the strongest current alternatives that fit what I wanted to do.",
      action: "find_circle_alternative"
    };
  }

  if (type === "mission.progress_verified") {
    return {
      ...base,
      priority: "positive",
      opener: "Your Mission progress was verified.",
      followUpPrompt: "My Mission progress was verified. Show me where the Mission stands now and what remains.",
      action: "review_mission_progress",
      cooldownHours: 48
    };
  }

  if (type === "mission.progress_rejected") {
    return {
      ...base,
      priority: "medium",
      opener: "A Mission progress submission wasn't verified.",
      followUpPrompt: "My Mission progress was rejected. Show me the current Mission state and what I can do next without guessing why it was rejected.",
      action: "review_mission_progress"
    };
  }

  if (type === "mission.objective_reached") {
    return {
      ...base,
      priority: "positive",
      opener: "Your Mission reached its objective.",
      followUpPrompt: "The Circle Mission reached its objective. Show me the final progress and what we accomplished.",
      action: "review_mission_completion",
      cooldownHours: 72
    };
  }

  return null;
}

function candidateFromInsight(insight = {}) {
  const id = clean(insight.id, 140);
  const base = {
    reasonId: id,
    source: "proactive_insight",
    priority: normalizePriority(insight.priority),
    confidence: finiteOr(insight.confidence, 0.65),
    domain: clean(insight.domain, 80) || "general",
    context: clean(insight.reason, 700),
    signature: clean(`${id}|${insight.trigger || ""}|${insight.reason || ""}`, 1200),
    userFacing: true
  };

  if (id === "experiment_review_due") {
    return {
      ...base,
      priority: "high",
      opener: "Our experiment is ready for review. I have the before-and-after context when you want to look at it.",
      followUpPrompt: "Review the experiment we were tracking and tell me what the new evidence supports, weakens, or still cannot answer.",
      action: "review_experiment",
      cooldownHours: 24
    };
  }

  if (id === "broad_performance_regression") {
    return {
      ...base,
      priority: "high",
      opener: "I noticed something in your training. Several comparable lifts are trending down at the same time.",
      followUpPrompt: "You noticed several of my comparable lifts trending down. Walk me through what changed and what you think we should investigate before changing the program.",
      action: "open_investigator",
      cooldownHours: 48
    };
  }

  if (id === "multi_pr_window") {
    return {
      ...base,
      priority: "positive",
      opener: "I noticed something good: you have multiple recent PR signals. Something we're doing may be working.",
      followUpPrompt: "You noticed multiple recent PR signals. Tell me what looks genuinely improved and what you would keep stable for now.",
      action: "celebrate_and_review",
      cooldownHours: 72
    };
  }

  if (id === "adherence_drop") {
    return {
      ...base,
      opener: "I think the current training plan may be fighting your real schedule. Your recent completion pattern changed enough that it's worth looking at.",
      followUpPrompt: "You noticed my recent training adherence dropped. Help me decide whether the plan is unrealistic or whether something else changed.",
      action: "review_constraints",
      cooldownHours: 72
    };
  }

  if (id === "weight_loss_faster_than_target") {
    return {
      ...base,
      opener: "Your weight trend is moving faster than the pace we were aiming for. I think it's worth checking recovery and performance before we push harder.",
      followUpPrompt: "You noticed my weight is moving faster than planned. Review the trend with my training and recovery before recommending any change.",
      action: "review_recovery_and_intake",
      cooldownHours: 72
    };
  }

  if (id === "recovery_or_deficit_pressure") {
    return {
      ...base,
      opener: "I noticed a pattern I don't want to ignore: performance is slipping while recovery or deficit pressure is showing up too.",
      followUpPrompt: "You noticed performance declines alongside recovery or deficit pressure. Compare the competing explanations before we change anything.",
      action: "open_investigator",
      cooldownHours: 72
    };
  }

  if (id.startsWith("world_model_")) {
    return {
      ...base,
      priority: "medium",
      opener: "I noticed a mismatch between the plan and what has actually been happening. I think we should design around reality instead of forcing the old assumption.",
      followUpPrompt: "You noticed a mismatch between my stated plan and my observed behavior. Show me the mismatch and help me decide whether to change the plan or intentionally test a new one.",
      action: "review_goal_tradeoff",
      cooldownHours: 96
    };
  }

  return null;
}

function candidateFromThread(thread = {}) {
  const state = clean(thread.state, 80);
  const id = clean(thread.id, 200);
  const base = {
    reasonId: id,
    source: "relationship_continuity",
    priority: normalizePriority(thread.priority),
    confidence: state === "review_due" ? 0.98 : state === "prediction_due" ? 0.82 : 0.62,
    domain: clean(thread.domain, 80) || "general",
    context: clean(thread.summary, 700),
    signature: clean(`${id}|${state}|${thread.dueAt || ""}|${thread.summary || ""}`, 1200),
    userFacing: true
  };

  if (thread.type === "experiment" && state === "review_due") {
    return {
      ...base,
      priority: "high",
      opener: "We have unfinished business: the experiment we were tracking has reached its review point.",
      followUpPrompt: "Review the experiment we were tracking now that its observation window is complete.",
      action: "review_experiment",
      cooldownHours: 24
    };
  }

  if (thread.type === "decision" && state === "prediction_due") {
    return {
      ...base,
      priority: "medium",
      opener: "Remember the pattern we decided to watch instead of changing immediately? Its observation window is up, so we can finally revisit it with new evidence.",
      followUpPrompt: "Revisit the prediction we were watching now that its observation horizon has passed, and compare it with the new evidence.",
      action: "review_prediction",
      cooldownHours: 72
    };
  }

  return null;
}

function initiativeKey(candidate = {}) {
  const reason = clean(candidate.reasonId, 160) || "initiative";
  return `${reason}:${hash(candidate.signature || candidate.context || candidate.opener || reason)}`.slice(0, 260);
}

function hash(value = "") {
  let h = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function dedupe(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item?.reasonId || ""}|${item?.action || ""}`;
    if (!item?.opener || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
function initiativeRules() {
  return {
    noEngagementBait: true,
    noLonelinessOrGuiltMessages: true,
    noDependencyLanguage: true,
    noInitiationBecauseUserWasAbsent: true,
    onlyMeaningfulStateChangesOrUnfinishedBusiness: true,
    deterministicDetectionFirst: true,
    languageModelNotRequiredToSurface: true,
    userCanDismiss: true,
    repeatsAreSuppressed: true,
    circleEventsMustBeServerGrounded: true,
    noGenericCircleCreationInitiative: true,
    noCircleMutationFromInitiative: true
  };
}
function noInitiative(reason) {
  return { version: ARI_INITIATIVE_ENGINE_VERSION, shouldInitiate: false, reason, candidate: null, rules: initiativeRules() };
}
function normalizePriority(value) {
  return ["high", "medium", "positive"].includes(value) ? value : "medium";
}
function initiativeWeight(value) {
  if (value === "high") return 4;
  if (value === "medium") return 3;
  if (value === "positive") return 2;
  return 1;
}
function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
