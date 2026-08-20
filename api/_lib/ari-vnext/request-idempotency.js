// ARI vNext — server-side request idempotency for paid model turns.
// A client retry with the same user_id + turn_id must never start a second
// OpenAI request while the first attempt is processing or after it completes.

export const ARI_REQUEST_IDEMPOTENCY_VERSION = "1.0.0";

const TABLE = "ari_request_dedup";
const READ_TIMEOUT_MS = 700;
const WRITE_TIMEOUT_MS = 900;
const STALE_PROCESSING_MS = 2 * 60 * 1000;

export async function claimAriRequest({ userId, turnId } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  const config = supabaseConfig();

  // Idempotency is a cost/reliability enhancement, not a reason to break chat
  // if a rolling deployment briefly reaches code before the migration exists.
  if (!user || !turn || !config) {
    return { enabled: false, claimed: true, replay: null, inProgress: false };
  }

  try {
    return await claimWithConfig({ user, turn, config, allowExpiredRetry: true });
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("[ARI Request Idempotency] Claim unavailable:", error?.message || error);
    }
    return {
      enabled: false,
      claimed: true,
      replay: null,
      inProgress: false,
      reason: error?.name === "AbortError" ? "claim_timeout" : "claim_unavailable"
    };
  }
}

export async function completeAriRequest({ userId, turnId, responsePayload } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  const config = supabaseConfig();
  if (!user || !turn || !config) return false;

  const payload = safePayload(responsePayload);
  if (!payload) return false;

  try {
    const params = new URLSearchParams({
      user_id: `eq.${user}`,
      turn_id: `eq.${turn}`,
      status: "eq.processing"
    });
    const now = new Date().toISOString();
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        status: "completed",
        response_payload: payload,
        completed_at: now,
        updated_at: now
      })
    }, WRITE_TIMEOUT_MS);
    return response.ok;
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("[ARI Request Idempotency] Completion persistence failed:", error?.message || error);
    }
    return false;
  }
}

export async function releaseAriRequest({ userId, turnId } = {}) {
  const user = clean(userId, 200);
  const turn = clean(turnId, 200);
  const config = supabaseConfig();
  if (!user || !turn || !config) return false;

  try {
    const params = new URLSearchParams({
      user_id: `eq.${user}`,
      turn_id: `eq.${turn}`,
      status: "eq.processing"
    });
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "DELETE",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" })
    }, WRITE_TIMEOUT_MS);
    return response.ok;
  } catch {
    return false;
  }
}

async function claimWithConfig({ user, turn, config, allowExpiredRetry }) {
  const now = new Date().toISOString();
  const insert = await timedFetch(
    `${config.url}/rest/v1/${TABLE}?on_conflict=user_id%2Cturn_id`,
    {
      method: "POST",
      headers: serverHeaders(config.key, {
        Prefer: "resolution=ignore-duplicates,return=representation"
      }),
      body: JSON.stringify({
        user_id: user,
        turn_id: turn,
        status: "processing",
        started_at: now,
        updated_at: now
      })
    },
    WRITE_TIMEOUT_MS
  );

  if (!insert.ok) {
    const text = await insert.text().catch(() => "");
    throw new Error(`claim_insert_${insert.status}:${text.slice(0, 180)}`);
  }

  const insertedRows = await insert.json().catch(() => []);
  if (Array.isArray(insertedRows) && insertedRows.length > 0) {
    return { enabled: true, claimed: true, replay: null, inProgress: false, source: "new_claim" };
  }

  let existing = await readExisting({ user, turn, config });
  if (!existing) {
    // Very small visibility race after ON CONFLICT. Treat as in-progress instead
    // of paying for another model call.
    return { enabled: true, claimed: false, replay: null, inProgress: true, source: "claim_visibility_race" };
  }

  if (existing.status === "completed" && existing.response_payload) {
    return {
      enabled: true,
      claimed: false,
      replay: safePayload(existing.response_payload),
      inProgress: false,
      source: "completed_replay"
    };
  }

  const expiresAt = Date.parse(String(existing.expires_at || ""));
  if (allowExpiredRetry && Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    await deleteExisting({ user, turn, config });
    return await claimWithConfig({ user, turn, config, allowExpiredRetry: false });
  }

  const startedAt = Date.parse(String(existing.started_at || ""));
  const stale = Number.isFinite(startedAt) && Date.now() - startedAt >= STALE_PROCESSING_MS;
  if (stale) {
    const takeover = await tryTakeover({ user, turn, config, startedAt: existing.started_at });
    if (takeover) {
      return { enabled: true, claimed: true, replay: null, inProgress: false, source: "stale_takeover" };
    }
    existing = await readExisting({ user, turn, config });
    if (existing?.status === "completed" && existing?.response_payload) {
      return {
        enabled: true,
        claimed: false,
        replay: safePayload(existing.response_payload),
        inProgress: false,
        source: "completed_after_takeover_race"
      };
    }
  }

  return { enabled: true, claimed: false, replay: null, inProgress: true, source: "already_processing" };
}

async function readExisting({ user, turn, config }) {
  const params = new URLSearchParams({
    select: "status,response_payload,started_at,updated_at,completed_at,expires_at",
    user_id: `eq.${user}`,
    turn_id: `eq.${turn}`,
    limit: "1"
  });
  const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
    headers: serverHeaders(config.key)
  }, READ_TIMEOUT_MS);
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function tryTakeover({ user, turn, config, startedAt }) {
  const params = new URLSearchParams({
    user_id: `eq.${user}`,
    turn_id: `eq.${turn}`,
    status: "eq.processing",
    started_at: `eq.${String(startedAt || "")}`
  });
  const now = new Date().toISOString();
  const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
    method: "PATCH",
    headers: serverHeaders(config.key, { Prefer: "return=representation" }),
    body: JSON.stringify({
      started_at: now,
      updated_at: now,
      completed_at: null,
      response_payload: null
    })
  }, WRITE_TIMEOUT_MS);
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

async function deleteExisting({ user, turn, config }) {
  const params = new URLSearchParams({
    user_id: `eq.${user}`,
    turn_id: `eq.${turn}`
  });
  const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
    method: "DELETE",
    headers: serverHeaders(config.key, { Prefer: "return=minimal" })
  }, WRITE_TIMEOUT_MS);
  return response.ok;
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra
  };
}

async function timedFetch(url, options = {}, timeoutMs = 800) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function safePayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
