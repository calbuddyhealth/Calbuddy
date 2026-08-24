// ARI vNext — conversation/outcome association storage and learning boundary.
// V2 expands the original fitness-only communication learner into a bounded,
// user-scoped conversation personalization system while preserving the same table.

import {
  analyzeResponseStrategy,
  ARI_CONVERSATION_PERSONALIZATION_VERSION,
  conversationPersonalizationToInstruction,
  detectConversationSignal,
  resolveConversationDomain,
  summarizeConversationPersonalization
} from "./conversation-personalization.js";

export const ARI_COMMUNICATION_OUTCOMES_VERSION = "2.0.0";
const TABLE = "ari_vnext_communication_outcomes";

export async function listCommunicationOutcomes({ userId, statuses = [], limit = 40 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,turn_id,domain,strategy_key,strategy,baseline,followup,status,outcome_direction,association_confidence,evaluation_source,review_at,created_at,resolved_at,updated_at",
    order: "created_at.desc",
    limit: String(clampInt(limit, 1, 80, 40))
  });
  const normalized = (Array.isArray(statuses) ? statuses : []).map((item) => clean(item, 30)).filter(Boolean);
  if (normalized.length === 1) params.set("status", `eq.${normalized[0]}`);
  if (normalized.length > 1) params.set("status", `in.(${normalized.join(",")})`);
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function buildCommunicationExposure({ turnId = null, route = {}, result = null, turn = null } = {}) {
  const reply = clean(result?.reply, 12000);
  const userMessage = clean(turn?.message, 4000);
  if (!reply || result?.success === false) return null;

  const trivialGreeting = reply.length < 90 && userMessage.length < 80 &&
    /^(?:hey|hi|hello|yo|sup|what'?s up|good (?:morning|afternoon|evening))[!.\s]*$/i.test(userMessage);
  if (trivialGreeting) return null;

  const meaningful = Boolean(
    reply.length >= 80 ||
    result?.action ||
    result?.pendingAction ||
    result?.scientificIntelligence?.hypotheses?.length ||
    result?.proactiveInsights?.primary
  );
  if (!meaningful) return null;

  const strategy = analyzeResponseStrategy({
    reply,
    communication: result?.communication || {},
    selfModel: result?.selfModel || null
  });
  const baseline = behaviorSnapshot(result?.longitudinalState);
  const domain = resolveConversationDomain(route);
  const strategyKey = strategyFingerprint(strategy);

  return {
    turnId: clean(turnId, 200) || null,
    domain,
    strategyKey,
    strategy,
    baseline: {
      ...baseline,
      conversationVersion: ARI_CONVERSATION_PERSONALIZATION_VERSION,
      userMessageLength: userMessage.length,
      actionProposed: Boolean(result?.action || result?.pendingAction)
    },
    reviewDays: domain === "training" ? 7 : ["nutrition", "goals"].includes(domain) ? 6 : 2
  };
}

export async function recordCommunicationExposure({ userId, exposure } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id || !exposure?.strategyKey) return { stored: false };

  const recent = await listCommunicationOutcomes({ userId: id, statuses: ["open"], limit: 16 });
  const fitnessLike = ["training", "nutrition", "goals"].includes(exposure.domain);
  const duplicateWindowMs = fitnessLike ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const duplicate = recent.find((item) =>
    item.domain === exposure.domain &&
    item.strategyKey === exposure.strategyKey &&
    Date.now() - Date.parse(item.createdAt || 0) < duplicateWindowMs
  );
  if (duplicate) return { stored: false, reason: "duplicate_recent_strategy", exposure: duplicate };

  const now = new Date();
  const reviewDays = clampInt(exposure.reviewDays, 1, 21, 2);
  const row = {
    user_id: id,
    turn_id: exposure.turnId || null,
    domain: clean(exposure.domain, 60) || "general",
    strategy_key: clean(exposure.strategyKey, 300),
    strategy: safeObject(exposure.strategy),
    baseline: safeObject(exposure.baseline),
    status: "open",
    review_at: new Date(now.getTime() + reviewDays * 86400000).toISOString(),
    updated_at: now.toISOString()
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved ? { stored: true, exposure: normalizeRow(saved) } : { stored: false };
  } catch {
    return { stored: false };
  }
}

export async function resolveCommunicationOutcomes({
  userId,
  longitudinalState = null,
  message = "",
  rows = null
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { resolved: 0, signal: null };

  const supplied = Array.isArray(rows) ? rows : null;
  const open = supplied
    ? supplied.filter((item) => item?.status === "open")
    : await listCommunicationOutcomes({ userId: id, statuses: ["open"], limit: 16 });
  if (!open.length) return { resolved: 0, signal: null };

  const nowMs = Date.now();
  const conversationSignal = detectConversationSignal({ message });
  const candidates = conversationSignal
    ? open
        .filter((item) => nowMs - Date.parse(item.createdAt || 0) <= 48 * 60 * 60 * 1000)
        .slice(0, 1)
    : open
        .filter((item) => item.reviewAt && Date.parse(item.reviewAt) <= nowMs)
        .slice(0, 4);
  if (!candidates.length) return { resolved: 0, signal: conversationSignal };

  let resolved = 0;
  for (const item of candidates) {
    const evaluation = conversationSignal || evaluateFollowThrough(item, longitudinalState);
    const ok = await patchResolution({ userId: id, item, evaluation });
    if (ok) resolved += 1;
  }
  return { resolved, signal: conversationSignal };
}

export function summarizeCommunicationLearning(rows = [], options = {}) {
  const resolved = (Array.isArray(rows) ? rows : []).filter((item) => item.status === "resolved");
  const groups = new Map();
  for (const item of resolved) {
    const key = item.strategyKey || "unknown";
    const group = groups.get(key) || {
      strategyKey: key,
      strategy: item.strategy || {},
      count: 0,
      positive: 0,
      negative: 0,
      mixed: 0,
      inconclusive: 0,
      confidenceTotal: 0
    };
    group.count += 1;
    if (item.outcomeDirection === "positive") group.positive += 1;
    else if (item.outcomeDirection === "negative") group.negative += 1;
    else if (item.outcomeDirection === "mixed") group.mixed += 1;
    else group.inconclusive += 1;
    group.confidenceTotal += Number(item.associationConfidence || 0);
    groups.set(key, group);
  }

  const strategies = [...groups.values()].map((group) => {
    const scorable = group.positive + group.negative;
    const positiveRate = scorable ? group.positive / scorable : null;
    return {
      strategyKey: group.strategyKey,
      strategy: group.strategy,
      sampleSize: group.count,
      scorableSample: scorable,
      positiveRate: positiveRate === null ? null : round(positiveRate, 2),
      averageAssociationConfidence: group.count ? round(group.confidenceTotal / group.count, 2) : null,
      status: scorable >= 3 ? "usable_association" : "insufficient_sample"
    };
  }).sort((a, b) => (b.positiveRate ?? -1) - (a.positiveRate ?? -1) || b.scorableSample - a.scorableSample);

  const usable = strategies.filter((item) => item.status === "usable_association");
  const best = usable[0] || null;
  const worst = usable.length > 1 ? usable[usable.length - 1] : null;
  const meaningfulDifference = Boolean(
    best && worst &&
    best.positiveRate !== null &&
    worst.positiveRate !== null &&
    best.positiveRate - worst.positiveRate >= 0.25
  );

  const personalization = summarizeConversationPersonalization(rows, options);

  return {
    version: ARI_COMMUNICATION_OUTCOMES_VERSION,
    conversationPersonalizationVersion: ARI_CONVERSATION_PERSONALIZATION_VERSION,
    resolvedCount: resolved.length,
    strategyCount: strategies.length,
    strategies: strategies.slice(0, 8),
    preferredAssociation: meaningfulDifference ? best : null,
    avoidAssociation: meaningfulDifference ? worst : null,
    personalization,
    adaptiveProfile: personalization.adaptiveProfile,
    evidence: personalization.evidence,
    confidence: personalization.confidence,
    shouldAdapt: personalization.shouldAdapt,
    guidance: personalization.shouldAdapt
      ? personalization.guidance
      : meaningfulDifference
        ? `When the user's current instruction does not specify style, the ${describeStrategy(best.strategy)} pattern has been followed by better measured follow-through than ${describeStrategy(worst.strategy)}. Treat this as association, not causal proof.`
        : "Communication history is not strong enough to justify learned adaptation. Follow current-turn instructions and the explicit communication profile.",
    causalClaimAllowed: false,
    explicitUserPreferenceAlwaysWins: true,
    currentTurnInstructionAlwaysWins: true,
    circleSocialDataAllowed: false,
    engagementOptimizationAllowed: false,
    timeInAppOptimizationAllowed: false
  };
}

export function communicationLearningToInstruction(state = null) {
  if (!state) return "";
  return [
    "COMMUNICATION OUTCOME LEARNING",
    "This history contains bounded associations between Ari response strategies and later explicit feedback/follow-through. It does NOT prove that wording caused behavior.",
    "The user's current explicit style request and stored explicit communication preferences always outrank learned associations.",
    "Never optimize guilt, pressure, dependency, deception, engagement, session length, or time-in-app.",
    "Never use Ari Circle/social behavior for conversation personalization.",
    conversationPersonalizationToInstruction(state.personalization || state),
    state.guidance || "No communication adaptation is justified yet."
  ].join("\n").slice(0, 7000);
}

function evaluateFollowThrough(item = {}, longitudinalState = null) {
  const baseline = item?.baseline || {};
  const current = behaviorSnapshot(longitudinalState);
  const domain = item?.domain || "general";

  if (domain === "training") {
    const before = finiteOrNull(baseline.trainingAdherence);
    const after = finiteOrNull(current.trainingAdherence);
    if (before !== null && after !== null && Number(current.plannedTrainingExposure || 0) >= 4) {
      const delta = after - before;
      if (delta >= 0.12) return outcome("positive", 0.58, "training_adherence_improved", current);
      if (delta <= -0.12) return outcome("negative", 0.58, "training_adherence_declined", current);
      return outcome("inconclusive", 0.4, "training_adherence_materially_unchanged", current);
    }
  }

  if (domain === "nutrition" || domain === "goals") {
    const beforeDays = finiteOrNull(baseline.nutritionLoggedDays);
    const afterDays = finiteOrNull(current.nutritionLoggedDays);
    if (beforeDays !== null && afterDays !== null) {
      const delta = afterDays - beforeDays;
      if (delta >= 2) return outcome("positive", 0.52, "nutrition_follow_through_increased", current);
      if (delta <= -2) return outcome("negative", 0.52, "nutrition_follow_through_decreased", current);
      return outcome("inconclusive", 0.36, "nutrition_follow_through_not_distinguishable", current);
    }
  }

  return outcome("inconclusive", 0.3, "insufficient_follow_through_evidence", current);
}

async function patchResolution({ userId, item, evaluation }) {
  const config = supabaseConfig();
  if (!config || !item?.id || !evaluation) return false;
  const now = new Date().toISOString();
  const params = new URLSearchParams({ id: `eq.${item.id}`, user_id: `eq.${userId}`, status: "eq.open" });
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        status: "resolved",
        outcome_direction: evaluation.direction,
        association_confidence: evaluation.confidence,
        evaluation_source: evaluation.source,
        followup: safeObject(evaluation.followup),
        resolved_at: now,
        updated_at: now
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

function behaviorSnapshot(longitudinalState = null) {
  return {
    trainingAdherence: finiteOrNull(longitudinalState?.training?.adherence?.rate),
    plannedTrainingExposure: finiteOrNull(longitudinalState?.training?.adherence?.plannedCount),
    completedTrainingExposure: finiteOrNull(longitudinalState?.training?.adherence?.completedCount),
    nutritionLoggedDays: finiteOrNull(longitudinalState?.nutrition?.loggedDayCount),
    weightVelocityPerWeek: longitudinalState?.weight?.available ? finiteOrNull(longitudinalState?.weight?.velocityPerWeek) : null
  };
}

function strategyFingerprint(strategy = {}) {
  return [
    `direct=${clean(strategy.directness, 30) || "adaptive"}`,
    `detail=${clean(strategy.detail, 30) || "adaptive"}`,
    `complex=${clean(strategy.complexity, 30) || "adaptive"}`,
    `len=${clean(strategy.realizedReplyLength, 30) || "balanced"}`,
    `q=${clean(strategy.questionBurden, 30) || "unknown"}`,
    `format=${clean(strategy.formatStyle, 30) || "unknown"}`
  ].join("|").slice(0, 300);
}

function describeStrategy(strategy = {}) {
  return `${clean(strategy.directness, 30) || "adaptive"}/${clean(strategy.detail, 30) || "adaptive"}/${clean(strategy.realizedReplyLength, 30) || "balanced"}/${clean(strategy.questionBurden, 30) || "unknown"}`;
}

function outcome(direction, confidence, source, followup) {
  return { direction, confidence, source, followup: safeObject(followup) };
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.user_id || null,
    turnId: row.turn_id || null,
    domain: clean(row.domain, 60),
    strategyKey: clean(row.strategy_key, 300),
    strategy: safeObject(row.strategy),
    baseline: safeObject(row.baseline),
    followup: safeObject(row.followup),
    status: clean(row.status, 30),
    outcomeDirection: row.outcome_direction || null,
    associationConfidence: finiteOrNull(row.association_confidence),
    evaluationSource: row.evaluation_source || null,
    reviewAt: row.review_at || null,
    createdAt: row.created_at || null,
    resolvedAt: row.resolved_at || null,
    updatedAt: row.updated_at || null
  };
}

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra };
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
