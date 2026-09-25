// ARI vNext — server-only durable communication closure ledger.

export const ARI_COMMUNICATION_CLOSURE_STORE_VERSION = "1.0.0";

const TABLE = "ari_vnext_communication_closures";
const WRITE_TIMEOUT_MS = 1600;

export async function persistCommunicationClosure({ userId, closure } = {}) {
  const id = cleanUserId(userId);
  const value = normalizeClosure(closure);
  const config = supabaseConfig();
  if (!id || !value?.id || !config) {
    return { stored: false, closure: value, reason: !config ? "not_configured" : "invalid_closure" };
  }

  const payload = {
    id: value.id,
    user_id: id,
    conversation_id: clean(value.conversationId, 180) || null,
    root_turn_id: clean(value.rootTurnId, 180) || null,
    last_turn_id: clean(value.lastTurnId, 180) || null,
    level: boundedInt(value.level, 1, 1, 3),
    status: clean(value.state, 40) || "unknown",
    terminal_state: clean(value.terminalState, 40) || "open",
    record: safeJson(value),
    updated_at: value.updatedAt || new Date().toISOString(),
    closed_at: value.closedAt || null
  };

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?on_conflict=id`,
      {
        method: "POST",
        headers: serverHeaders(config.key, {
          Prefer: "resolution=merge-duplicates,return=representation"
        }),
        body: JSON.stringify(payload)
      },
      WRITE_TIMEOUT_MS
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        stored: false,
        closure: value,
        reason: clean(data?.message || data?.error || response.statusText, 400) || "write_failed",
        status: response.status
      };
    }
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      stored: true,
      closure: row?.record && typeof row.record === "object" ? row.record : value,
      reason: null
    };
  } catch (error) {
    return {
      stored: false,
      closure: value,
      reason: clean(error?.message || error, 400) || "write_failed"
    };
  }
}

function normalizeClosure(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = clean(value?.id, 180);
  if (!id) return null;
  return {
    ...safeJson(value),
    id,
    level: boundedInt(value?.level, 1, 1, 3),
    state: clean(value?.state, 40) || "unknown",
    terminalState: clean(value?.terminalState, 40) || "open",
    conversationId: clean(value?.conversationId, 180) || null,
    rootTurnId: clean(value?.rootTurnId, 180) || null,
    lastTurnId: clean(value?.lastTurnId, 180) || null,
    updatedAt: validIso(value?.updatedAt) || new Date().toISOString(),
    closedAt: validIso(value?.closedAt),
    hiddenChainOfThoughtStored: false
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(
    process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    9000
  );
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    ...(looksLikeJwt(key) ? { Authorization: `Bearer ${key}` } : {}),
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}

function looksLikeJwt(value = "") {
  return String(value).split(".").length === 3;
}

async function timedFetch(url, options = {}, timeoutMs = 1600) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(value) {
  try {
    return JSON.parse(JSON.stringify(value && typeof value === "object" ? value : {}));
  } catch {
    return {};
  }
}

function cleanUserId(value = "") {
  const id = clean(value, 120);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function boundedInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function validIso(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
