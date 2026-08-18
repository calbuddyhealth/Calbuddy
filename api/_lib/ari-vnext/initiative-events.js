// ARI vNext — persistent initiative lifecycle and repeat suppression.

export const ARI_INITIATIVE_EVENTS_VERSION = "1.0.0";
const TABLE = "ari_vnext_initiative_events";

export async function listRecentInitiatives({ userId, limit = 20 } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id) return [];
  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,user_id,initiative_key,reason_id,priority,status,payload,surfaced_at,engaged_at,dismissed_at,expires_at,updated_at",
    order: "surfaced_at.desc",
    limit: String(clampInt(limit, 1, 40, 20))
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow) : [];
  } catch {
    return [];
  }
}

export function shouldSuppressInitiative({ candidate = null, events = [], now = new Date() } = {}) {
  if (!candidate?.initiativeKey) return { suppress: true, reason: "candidate_missing_key" };
  const matching = (Array.isArray(events) ? events : []).find((item) => item?.initiativeKey === candidate.initiativeKey);
  if (!matching) return { suppress: false, reason: "new_initiative" };

  const nowMs = dateValue(now);
  const surfacedMs = dateValue(matching.surfacedAt);
  const ageHours = surfacedMs ? Math.max(0, (nowMs - surfacedMs) / 3600000) : Number.POSITIVE_INFINITY;
  const baseCooldown = clampInt(candidate.cooldownHours, 12, 168, 48);
  const required = matching.status === "dismissed"
    ? Math.max(baseCooldown, 168)
    : matching.status === "engaged"
      ? Math.max(baseCooldown, 72)
      : baseCooldown;

  return ageHours < required
    ? { suppress: true, reason: `${matching.status || "surfaced"}_cooldown`, ageHours: round(ageHours, 1), requiredHours: required }
    : { suppress: false, reason: "cooldown_elapsed", ageHours: round(ageHours, 1), requiredHours: required };
}

export async function recordInitiativeSurface({ userId, candidate } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  if (!config || !id || !candidate?.initiativeKey) return { stored: false };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + clampInt(candidate.cooldownHours, 12, 168, 48) * 3600000).toISOString();
  const row = {
    user_id: id,
    initiative_key: clean(candidate.initiativeKey, 260),
    reason_id: clean(candidate.reasonId, 200) || "initiative",
    priority: clean(candidate.priority, 40) || "medium",
    status: "surfaced",
    payload: compactCandidate(candidate),
    surfaced_at: now.toISOString(),
    expires_at: expiresAt,
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
    return response.ok && saved ? { stored: true, event: normalizeRow(saved) } : { stored: false };
  } catch {
    return { stored: false };
  }
}

export async function updateInitiativeStatus({ userId, initiativeId, status } = {}) {
  const config = supabaseConfig();
  const id = clean(userId, 200);
  const eventId = clean(initiativeId, 200);
  const next = clean(status, 30);
  if (!config || !id || !eventId || !["engaged", "dismissed"].includes(next)) return { success: false, code: "invalid_initiative_update" };
  const now = new Date().toISOString();
  const patch = {
    status: next,
    updated_at: now,
    ...(next === "engaged" ? { engaged_at: now } : { dismissed_at: now })
  };
  try {
    const params = new URLSearchParams({ id: `eq.${eventId}`, user_id: `eq.${id}` });
    const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify(patch)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved ? { success: true, event: normalizeRow(saved) } : { success: false, code: "initiative_update_failed" };
  } catch {
    return { success: false, code: "initiative_update_failed" };
  }
}

function compactCandidate(candidate = {}) {
  return {
    reasonId: clean(candidate.reasonId, 200),
    source: clean(candidate.source, 80),
    domain: clean(candidate.domain, 80),
    priority: clean(candidate.priority, 40),
    confidence: finiteOrNull(candidate.confidence),
    opener: clean(candidate.opener, 800),
    followUpPrompt: clean(candidate.followUpPrompt, 1000),
    action: clean(candidate.action, 120),
    context: clean(candidate.context, 900),
    cooldownHours: clampInt(candidate.cooldownHours, 12, 168, 48),
    requiresLanguageModelCall: false
  };
}
function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id || null,
    userId: row.user_id || null,
    initiativeKey: clean(row.initiative_key, 260),
    reasonId: clean(row.reason_id, 200),
    priority: clean(row.priority, 40),
    status: clean(row.status, 30),
    payload: safeObject(row.payload),
    surfacedAt: row.surfaced_at || null,
    engagedAt: row.engaged_at || null,
    dismissedAt: row.dismissed_at || null,
    expiresAt: row.expires_at || null,
    updatedAt: row.updated_at || null
  };
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function dateValue(value) {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function round(value, digits = 1) {
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
