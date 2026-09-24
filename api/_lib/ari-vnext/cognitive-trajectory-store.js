// ARI vNext — server-only cognitive trajectory persistence.
//
// Stores compact outcome/evaluation metadata for learning and evals. It never
// stores prompt/reply text, tool arguments, app state, secrets, or hidden CoT.

import { summarizeCognitiveTrajectoryHistory } from "./cognitive-evaluator.js";

export const ARI_COGNITIVE_TRAJECTORY_VERSION = "1.0.0";
const TABLE = "ari_vnext_cognitive_trajectories";
const TIMEOUT_MS = 4500;

export async function loadRecentCognitiveTrajectories({
  userId,
  limit = 24,
  domain = null
} = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return [];

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "id,turn_id,conversation_id,surface,domain,plan_mode,route,sources,planner,verification,evaluation,outcome,learning,created_at",
    order: "created_at.desc",
    limit: String(Math.max(1, Math.min(60, Number(limit) || 24)))
  });
  const normalizedDomain = clean(domain, 60).toLowerCase();
  if (normalizedDomain) params.set("domain", `eq.${normalizedDomain}`);

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function loadCognitiveTrajectorySummary({
  userId,
  limit = 24,
  domain = null
} = {}) {
  const rows = await loadRecentCognitiveTrajectories({ userId, limit, domain });
  return summarizeCognitiveTrajectoryHistory(rows);
}

export async function persistCognitiveTrajectory({
  userId,
  trajectory
} = {}) {
  const id = cleanUserId(userId);
  const turnId = clean(trajectory?.turnId, 220);
  const config = supabaseConfig();
  if (!id || !turnId || !config || !trajectory || typeof trajectory !== "object") {
    return { stored: false, reason: "invalid_trajectory" };
  }

  const row = {
    user_id: id,
    turn_id: turnId,
    conversation_id: clean(trajectory?.conversationId, 220) || null,
    surface: clean(trajectory?.surface, 120) || null,
    domain: clean(trajectory?.domain || "general", 60).toLowerCase() || "general",
    plan_mode: clean(trajectory?.planMode || "direct", 60).toLowerCase() || "direct",
    route: safeObject(trajectory?.route),
    sources: safeObject(trajectory?.sources),
    planner: safeObject(trajectory?.planner),
    verification: safeObject(trajectory?.verification),
    evaluation: safeObject(trajectory?.evaluation),
    outcome: safeObject(trajectory?.outcome),
    learning: safeObject(trajectory?.learning),
    trajectory_version: clean(trajectory?.version || ARI_COGNITIVE_TRAJECTORY_VERSION, 40),
    created_at: validIso(trajectory?.createdAt) || new Date().toISOString()
  };

  // Defense in depth: fail closed if any prohibited raw-content keys ever
  // appear in a trajectory object.
  if (containsProhibitedKey(row)) {
    return { stored: false, reason: "prohibited_raw_content" };
  }

  try {
    const params = new URLSearchParams({ on_conflict: "user_id,turn_id" });
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, {
          Prefer: "resolution=merge-duplicates,return=representation"
        }),
        body: JSON.stringify(row)
      },
      TIMEOUT_MS
    );
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved
      ? {
          stored: true,
          id: saved.id || null,
          turnId,
          score: Number(saved?.evaluation?.score ?? row.evaluation?.score ?? 0)
        }
      : { stored: false, reason: "trajectory_write_failed" };
  } catch {
    return { stored: false, reason: "trajectory_write_failed" };
  }
}

function normalizeRow(row = null) {
  if (!row || typeof row !== "object") return null;
  return {
    id: clean(row.id, 120),
    turnId: clean(row.turn_id, 220),
    conversationId: clean(row.conversation_id, 220) || null,
    surface: clean(row.surface, 120) || null,
    domain: clean(row.domain, 60) || "general",
    planMode: clean(row.plan_mode, 60) || "direct",
    route: safeObject(row.route),
    sources: safeObject(row.sources),
    planner: safeObject(row.planner),
    verification: safeObject(row.verification),
    evaluation: safeObject(row.evaluation),
    outcome: safeObject(row.outcome),
    learning: safeObject(row.learning),
    createdAt: row.created_at || null
  };
}

function containsProhibitedKey(value) {
  const prohibited = new Set([
    "prompt",
    "prompt_text",
    "user_message",
    "message",
    "reply",
    "assistant_message",
    "tool_arguments",
    "tool_args",
    "app_state",
    "memory_payload",
    "chain_of_thought",
    "hidden_reasoning",
    "scratchpad",
    "secret",
    "access_token",
    "refresh_token"
  ]);

  const visit = (item, depth = 0) => {
    if (depth > 8 || item === null || item === undefined) return false;
    if (Array.isArray(item)) return item.some((child) => visit(child, depth + 1));
    if (typeof item !== "object") return false;
    for (const [key, child] of Object.entries(item)) {
      if (prohibited.has(String(key).toLowerCase())) return true;
      if (visit(child, depth + 1)) return true;
    }
    return false;
  };

  return visit(value);
}

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    const clone = JSON.parse(JSON.stringify(value));
    return containsProhibitedKey(clone) ? {} : clone;
  } catch {
    return {};
  }
}

function validIso(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
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

async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

function cleanUserId(value) {
  const id = clean(value, 80).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
