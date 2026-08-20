// ARI vNext — server-only persistence for the owner cognitive loop.

import { ARI_COGNITIVE_STATE_VERSION } from "./cognitive-loop.js";

const TABLE = "ari_vnext_cognitive_states";
const READ_TIMEOUT_MS = 900;
const WRITE_TIMEOUT_MS = 900;

export async function loadAriCognitiveState({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return null;

  try {
    const params = new URLSearchParams({
      select: "state_version,state,updated_at",
      user_id: `eq.${id}`,
      limit: "1"
    });
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, READ_TIMEOUT_MS);

    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.state || typeof row.state !== "object" || Array.isArray(row.state)) return null;

    return {
      ...row.state,
      version: String(row?.state_version || row?.state?.version || ARI_COGNITIVE_STATE_VERSION),
      persistedAt: row?.updated_at || null
    };
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("[ARI Cognitive Loop] State load failed:", error?.message || error);
    }
    return null;
  }
}

export async function persistAriCognitiveState({ userId, state } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !state || typeof state !== "object" || Array.isArray(state)) return false;

  const now = new Date().toISOString();
  const payload = {
    user_id: id,
    state_version: ARI_COGNITIVE_STATE_VERSION,
    state: compactState(state),
    updated_at: now
  };

  try {
    const params = new URLSearchParams({ on_conflict: "user_id" });
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(payload)
    }, WRITE_TIMEOUT_MS);
    return response.ok;
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("[ARI Cognitive Loop] State persistence failed:", error?.message || error);
    }
    return false;
  }
}

function compactState(state) {
  try {
    const copy = JSON.parse(JSON.stringify(state));
    delete copy.persistedAt;
    return copy;
  } catch {
    return {
      version: ARI_COGNITIVE_STATE_VERSION,
      turnCount: Math.max(0, Number(state?.turnCount || 0)),
      openLoops: []
    };
  }
}

function supabaseConfig() {
  const url = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
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

async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

function cleanUserId(value) {
  const id = String(value || "").trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}
