// ARI vNext — durable cognitive scheduler state, fairness history, and urgent triggers.

export const ARI_COGNITIVE_SCHEDULER_STORE_VERSION = "1.0.0";

const EVENT_TABLE = "ari_vnext_cognitive_schedule_events";
const TRIGGER_TABLE = "ari_vnext_cognitive_triggers";

export async function listCognitiveScheduleEvents({
  userId,
  since = null,
  limit = 120,
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,lane,decision_mode,reason,score,candidates,signals,trigger_id,created_at",
    order: "created_at.desc",
    limit: String(clampInt(limit, 1, 300, 120))
  });
  const sinceIso = isoOrNull(since);
  if (sinceIso) params.set("created_at", `gte.${sinceIso}`);

  try {
    const response = await fetcher(`${config.url}/rest/v1/${EVENT_TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeEvent).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function recordCognitiveScheduleEvent({
  userId,
  lane = null,
  decisionMode,
  reason = "",
  score = null,
  candidates = [],
  signals = {},
  triggerId = null,
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const mode = clean(decisionMode, 60);
  if (!config || !id || !mode) return { stored: false, reason: "scheduler_store_unavailable" };

  const row = {
    user_id: id,
    lane: clean(lane, 40) || null,
    decision_mode: mode,
    reason: clean(reason, 400) || null,
    score: finiteOrNull(score),
    candidates: safeJson(Array.isArray(candidates) ? candidates.slice(0, 12) : []),
    signals: safeJson(signals),
    trigger_id: clean(triggerId, 80) || null
  };

  try {
    const response = await fetcher(`${config.url}/rest/v1/${EVENT_TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(5000)
    });
    return { stored: response.ok, reason: response.ok ? null : `http_${response.status}` };
  } catch {
    return { stored: false, reason: "scheduler_event_write_failed" };
  }
}

export async function enqueueCognitiveTrigger({
  userId,
  lane,
  reason,
  priority = "urgent",
  payload = {},
  notBefore = null,
  expiresAt = null,
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const normalizedLane = normalizeLane(lane);
  const normalizedPriority = ["normal","high","urgent"].includes(clean(priority, 20).toLowerCase())
    ? clean(priority, 20).toLowerCase()
    : "urgent";
  if (!config || !id || !normalizedLane || !clean(reason, 400)) {
    return { queued: false, reason: "invalid_trigger" };
  }

  const now = new Date();
  const row = {
    user_id: id,
    lane: normalizedLane,
    reason: clean(reason, 400),
    priority: normalizedPriority,
    payload: safeJson(payload),
    not_before: isoOrNull(notBefore) || now.toISOString(),
    expires_at: isoOrNull(expiresAt) || new Date(now.getTime() + 24 * 3600000).toISOString(),
    status: "pending",
    updated_at: now.toISOString()
  };

  try {
    const response = await fetcher(`${config.url}/rest/v1/${TRIGGER_TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved
      ? { queued: true, trigger: normalizeTrigger(saved) }
      : { queued: false, reason: `http_${response.status}` };
  } catch {
    return { queued: false, reason: "trigger_write_failed" };
  }
}

export async function claimCognitiveTrigger({ userId, fetcher = fetch } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return { claimed: false, reason: "scheduler_store_unavailable" };

  try {
    const response = await fetcher(`${config.url}/rest/v1/rpc/ari_claim_cognitive_trigger`, {
      method: "POST",
      headers: serverHeaders(config.key),
      body: JSON.stringify({ p_user_id: id }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.claimed) {
      return { claimed: false, reason: clean(data?.reason, 120) || `http_${response.status}` };
    }
    return { claimed: true, trigger: normalizeTrigger(data.trigger) };
  } catch {
    return { claimed: false, reason: "trigger_claim_failed" };
  }
}

export async function finishCognitiveTrigger({
  userId,
  triggerId,
  success = true,
  payload = {},
  fetcher = fetch
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const trigger = clean(triggerId, 100);
  if (!config || !id || !trigger) return { stored: false };

  const params = new URLSearchParams({ id: `eq.${trigger}`, user_id: `eq.${id}`, status: "eq.running" });
  const now = new Date().toISOString();
  try {
    const response = await fetcher(`${config.url}/rest/v1/${TRIGGER_TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        status: success ? "completed" : "failed",
        payload: safeJson(payload),
        completed_at: now,
        updated_at: now
      }),
      signal: AbortSignal.timeout(5000)
    });
    return { stored: response.ok };
  } catch {
    return { stored: false };
  }
}

function normalizeEvent(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.user_id || null,
    lane: normalizeLane(row.lane),
    decisionMode: clean(row.decision_mode, 60),
    reason: clean(row.reason, 400),
    score: finiteOrNull(row.score),
    candidates: Array.isArray(row.candidates) ? row.candidates : [],
    signals: safeJson(row.signals),
    triggerId: row.trigger_id || null,
    createdAt: row.created_at || null
  };
}
function normalizeTrigger(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.userId || row.user_id || null,
    lane: normalizeLane(row.lane),
    reason: clean(row.reason, 400),
    priority: clean(row.priority, 20) || "urgent",
    payload: safeJson(row.payload),
    status: clean(row.status, 30),
    createdAt: row.created_at || null
  };
}
function normalizeLane(value) {
  const lane = clean(value, 40).toLowerCase();
  return ["repair","autonomy","experience","community","dreaming","theory"].includes(lane) ? lane : "";
}
function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}
function isoOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function safeJson(value) {
  if (!value || typeof value !== "object") return Array.isArray(value) ? [] : {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return Array.isArray(value) ? [] : {}; }
}
function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
