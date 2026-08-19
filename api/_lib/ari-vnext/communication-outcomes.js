// ARI vNext — conservative communication/outcome association learning.
// Learns which response strategies are followed by better user follow-through,
// without claiming the communication style caused the behavior change.

export const ARI_COMMUNICATION_OUTCOMES_VERSION = "1.0.0";
const TABLE = "ari_vnext_communication_outcomes";

export async function listCommunicationOutcomes({ userId, statuses = [], limit = 24 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,turn_id,domain,strategy_key,strategy,baseline,followup,status,outcome_direction,association_confidence,evaluation_source,review_at,created_at,resolved_at,updated_at",
    order: "created_at.desc",
    limit: String(clampInt(limit, 1, 50, 24))
  });
  const normalized = (Array.isArray(statuses) ? statuses : []).map((item) => clean(item, 30)).filter(Boolean);
  if (normalized.length === 1) params.set("status", `eq.${normalized[0]}`);
  if (normalized.length > 1) params.set("status", `in.(${normalized.join(",")})`);
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow) : [];
  } catch {
    return [];
  }
}

export function buildCommunicationExposure({ turnId = null, route = {}, result = null } = {}) {
  const leading = result?.scientificIntelligence?.hypotheses?.[0] || null;
  const meaningful = Boolean(
    clean(result?.reply, 5000) &&
    (route?.training || route?.nutrition || route?.goals) &&
    (Number(leading?.score || 0) >= 0.42 || result?.action || result?.proactiveInsights?.primary)
  );
  if (!meaningful) return null;

  const communication = result?.communication || {};
  const selfMode = clean(result?.selfModel?.current?.mode, 80) || "unknown";
  const reply = clean(result?.reply, 12000);
  const replyLength = reply.length < 420 ? "brief" : reply.length < 1100 ? "balanced" : "detailed";
  const questionCount = (reply.match(/\?/g) || []).length;
  const strategy = {
    tone: clean(communication?.tone, 40) || "adaptive",
    directness: clean(communication?.directness, 40) || "adaptive",
    detail: clean(communication?.detail, 40) || "adaptive",
    complexity: clean(communication?.complexity, 40) || "adaptive",
    selfMode,
    realizedReplyLength: replyLength,
    questionCount: Math.min(6, questionCount)
  };
  const baseline = behaviorSnapshot(result?.longitudinalState);
  const domain = route?.training ? "training" : route?.nutrition ? "nutrition" : route?.goals ? "goals" : "fitness";
  const strategyKey = strategyFingerprint(strategy);

  return {
    turnId: clean(turnId, 200) || null,
    domain,
    strategyKey,
    strategy,
    baseline,
    reviewDays: domain === "training" ? 7 : 6
  };
}

export async function recordCommunicationExposure({ userId, exposure } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id || !exposure?.strategyKey) return { stored: false };

  const recent = await listCommunicationOutcomes({ userId: id, statuses: ["open"], limit: 8 });
  const duplicate = recent.find((item) =>
    item.domain === exposure.domain &&
    item.strategyKey === exposure.strategyKey &&
    Date.now() - Date.parse(item.createdAt || 0) < 72 * 60 * 60 * 1000
  );
  if (duplicate) return { stored: false, reason: "duplicate_recent_strategy", exposure: duplicate };

  const now = new Date();
  const reviewDays = clampInt(exposure.reviewDays, 3, 21, 7);
  const row = {
    user_id: id,
    turn_id: exposure.turnId || null,
    domain: clean(exposure.domain, 60) || "fitness",
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

export async function resolveCommunicationOutcomes({ userId, longitudinalState = null, message = "" } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { resolved: 0 };

  const open = await listCommunicationOutcomes({ userId: id, statuses: ["open"], limit: 12 });
  if (!open.length) return { resolved: 0 };

  const nowMs = Date.now();
  const explicit = explicitCommunicationFeedback(message);
  const candidates = explicit
    ? open.slice(0, 1)
    : open.filter((item) => item.reviewAt && Date.parse(item.reviewAt) <= nowMs).slice(0, 4);
  if (!candidates.length) return { resolved: 0 };

  let resolved = 0;
  for (const item of candidates) {
    const evaluation = explicit || evaluateFollowThrough(item, longitudinalState);
    const ok = await patchResolution({ userId: id, item, evaluation });
    if (ok) resolved += 1;
  }
  return { resolved };
}

export function summarizeCommunicationLearning(rows = []) {
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
  const meaningfulDifference = Boolean(best && worst && best.positiveRate !== null && worst.positiveRate !== null && best.positiveRate - worst.positiveRate >= 0.25);

  return {
    version: ARI_COMMUNICATION_OUTCOMES_VERSION,
    resolvedCount: resolved.length,
    strategyCount: strategies.length,
    strategies: strategies.slice(0, 6),
    preferredAssociation: meaningfulDifference ? best : null,
    avoidAssociation: meaningfulDifference ? worst : null,
    guidance: meaningfulDifference
      ? `When the user's current instruction does not specify style, the ${describeStrategy(best.strategy)} pattern has been followed by better measured follow-through than ${describeStrategy(worst.strategy)} in the available sample. Treat this as a weak personalization signal, not causal proof.`
      : "Communication-outcome history is too small or too similar to justify changing Ari's style. Follow the user's explicit preferences and the normal communication profile.",
    causalClaimAllowed: false,
    explicitUserPreferenceAlwaysWins: true
  };
}

export function communicationLearningToInstruction(state = null) {
  if (!state) return "";
  return [
    "COMMUNICATION OUTCOME LEARNING",
    "This history contains weak associations between Ari response strategies and later follow-through. It does NOT establish that wording caused the behavior.",
    "The user's current explicit style request and stored explicit communication preference always outrank these associations.",
    "Never use guilt, pressure, emotional dependency, deception, or manipulation to improve adherence metrics.",
    "Use learned strategy only as a tie-breaker when two communication approaches are otherwise equally appropriate.",
    state.guidance || "No communication adaptation is justified yet.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 6500);
}

function evaluateFollowThrough(item = {}, longitudinalState = null) {
  const baseline = item?.baseline || {};
  const current = behaviorSnapshot(longitudinalState);
  const domain = item?.domain || "fitness";

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

function explicitCommunicationFeedback(message = "") {
  const text = clean(message, 1200);
  if (!text) return null;
  const positive = /\b(i like|i love|keep)\b.{0,50}\b(how you|the way you|being direct|being concise|explained|talk to me|answer me)|\bthat (?:way of explaining|tone|style) (?:helped|works|is better)\b/i.test(text);
  const negative = /\b(too wordy|too much text|too long|stop lecturing|don't lecture|do not lecture|too preachy|too gentle|too harsh|don't talk to me like|do not talk to me like|i don't like how you|i do not like how you)\b/i.test(text);
  if (!positive && !negative) return null;
  if (positive && negative) return outcome("mixed", 0.78, "explicit_mixed_communication_feedback", {});
  return positive
    ? outcome("positive", 0.88, "explicit_positive_communication_feedback", {})
    : outcome("negative", 0.88, "explicit_negative_communication_feedback", {});
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
        followup: evaluation.followup,
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
    `tone=${clean(strategy.tone, 30) || "adaptive"}`,
    `direct=${clean(strategy.directness, 30) || "adaptive"}`,
    `detail=${clean(strategy.detail, 30) || "adaptive"}`,
    `mode=${clean(strategy.selfMode, 50) || "unknown"}`,
    `len=${clean(strategy.realizedReplyLength, 30) || "balanced"}`
  ].join("|").slice(0, 300);
}

function describeStrategy(strategy = {}) {
  return `${clean(strategy.directness, 30) || "adaptive"}/${clean(strategy.detail, 30) || "adaptive"}/${clean(strategy.realizedReplyLength, 30) || "balanced"}`;
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
