export const ARI_COMMUNITY_AUTONOMY_STORE_VERSION = "1.1.0";
const TABLE = "ari_vnext_community_interactions";
const TIMEOUT_MS = 1500;

export async function listRecentCommunityInteractions({ userId, limit = 120 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,thread_id,action,thread_reply_count,reply_id,payload,created_at",
    order: "created_at.desc",
    limit: String(clampInt(limit, 1, 250, 120))
  });

  try {
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, TIMEOUT_MS);
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function recordCommunityInteraction({
  userId,
  threadId,
  action,
  threadReplyCount = 0,
  replyId = null,
  payload = {}
} = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const thread = clean(threadId, 100);
  const eventAction = clean(action, 40);
  if (!config || !id || !thread || !["scan", "learn", "reply", "post", "skip"].includes(eventAction)) {
    return { stored: false, reason: "invalid_interaction" };
  }

  const row = {
    user_id: id,
    thread_id: thread,
    action: eventAction,
    thread_reply_count: Math.max(0, Math.round(Number(threadReplyCount) || 0)),
    reply_id: clean(replyId, 100) || null,
    payload: compactObject(payload)
  };

  try {
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(row)
    }, TIMEOUT_MS);
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved
      ? { stored: true, interaction: normalizeRow(saved) }
      : { stored: false, reason: "interaction_write_failed" };
  } catch {
    return { stored: false, reason: "interaction_write_failed" };
  }
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.user_id || null,
    threadId: clean(row.thread_id, 100),
    action: clean(row.action, 40),
    threadReplyCount: Math.max(0, Number(row.thread_reply_count || 0)),
    replyId: clean(row.reply_id, 100) || null,
    payload: compactObject(row.payload),
    createdAt: row.created_at || null
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra };
}
async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
function compactObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
