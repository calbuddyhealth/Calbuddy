import { listCommunicationOutcomes, summarizeCommunicationLearning } from "./_lib/ari-vnext/communication-outcomes.js";
import { listRecentDecisions, summarizeDecisionState } from "./_lib/ari-vnext/decision-journal.js";
import { listUserExperiments, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { categoryForMemory } from "./_lib/ari-vnext/memory-service.js";
import { loadUserWorldModel, normalizePrivacyControls } from "./_lib/ari-vnext/user-world-model.js";

const AUTH_TIMEOUT_MS = 3500;
const CATEGORIES = new Set(["identity", "preferences", "goals", "constraints", "behavior", "fitness_outcomes", "relationship"]);

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_knowledge" });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({ success: false, error: auth.message, code: auth.code, source: "ari_vnext_knowledge" });
    }

    if (req.method === "GET") return sendSnapshot(res, auth.userId);

    const body = resolveBody(req);
    const action = clean(body?.action, 80).toLowerCase();

    if (action === "set_category_memory") {
      const category = clean(body?.category, 80).toLowerCase();
      const remember = body?.remember === true;
      if (!CATEGORIES.has(category)) return res.status(400).json({ success: false, code: "INVALID_MEMORY_CATEGORY" });
      const result = await setCategoryMemory({ userId: auth.userId, category, remember });
      if (!result.success) return res.status(500).json(result);
      return sendSnapshot(res, auth.userId, { mutation: result });
    }

    if (action === "forget_memory") {
      const memoryId = clean(body?.memoryId, 200);
      if (!memoryId) return res.status(400).json({ success: false, code: "MEMORY_ID_REQUIRED" });
      await deleteFromTable("ari_user_memory", auth.userId, { id: memoryId });
      return sendSnapshot(res, auth.userId, { mutation: { success: true, action } });
    }

    if (action === "clear_recent_conversation") {
      await deleteFromTable("ari_conversation_turns", auth.userId);
      return sendSnapshot(res, auth.userId, { mutation: { success: true, action } });
    }

    if (action === "clear_durable_memory") {
      await deleteFromTable("ari_user_memory", auth.userId);
      return sendSnapshot(res, auth.userId, { mutation: { success: true, action } });
    }

    if (action === "clear_world_model") {
      const model = await loadUserWorldModel({ userId: auth.userId });
      const privacy = normalizePrivacyControls(model?.privacyControls);
      const ok = await patchWorldModel(auth.userId, {
        identity: {}, preferences: {}, goals: {}, constraints: {}, behavior: {}, response_profile: {},
        physiological_response: {}, relationship: {}, source_summary: {}, privacy_controls: privacy
      });
      return sendSnapshot(res, auth.userId, { mutation: { success: ok, action } });
    }

    if (action === "clear_completed_experiments") {
      const ok = await deleteRowsByStatuses("ari_vnext_experiments", auth.userId, ["completed", "cancelled"]);
      return sendSnapshot(res, auth.userId, { mutation: { success: ok, action } });
    }

    if (action === "clear_decision_history") {
      await deleteFromTable("ari_vnext_decisions", auth.userId);
      return sendSnapshot(res, auth.userId, { mutation: { success: true, action } });
    }

    if (action === "clear_communication_learning") {
      await deleteFromTable("ari_vnext_communication_outcomes", auth.userId);
      return sendSnapshot(res, auth.userId, { mutation: { success: true, action } });
    }

    return res.status(400).json({ success: false, error: "Unsupported knowledge action.", code: "KNOWLEDGE_ACTION_UNSUPPORTED" });
  } catch (error) {
    console.warn("[ARI vNext Knowledge]", error?.message || error);
    return res.status(500).json({ success: false, error: "Ari knowledge controls are temporarily unavailable.", source: "ari_vnext_knowledge" });
  }
}

async function sendSnapshot(res, userId, extra = {}) {
  const [worldModel, memories, experiments, decisions, communication] = await Promise.all([
    loadUserWorldModel({ userId }),
    fetchMemories(userId, 50),
    listUserExperiments({ userId, statuses: ["active", "completed", "cancelled"], limit: 16 }),
    listRecentDecisions({ userId, limit: 16 }),
    listCommunicationOutcomes({ userId, limit: 24 })
  ]);
  const userMemories = memories.filter((item) => item.memoryType !== "peer_reflection");

  return res.status(200).json({
    success: true,
    source: "ari_vnext_knowledge",
    worldModel,
    privacyControls: normalizePrivacyControls(worldModel?.privacyControls),
    memories: userMemories,
    memoryCount: userMemories.length,
    experimentLedger: summarizeExperimentLedger(experiments),
    decisions: summarizeDecisionState(decisions),
    communicationLearning: summarizeCommunicationLearning(communication),
    controls: {
      categories: [...CATEGORIES],
      activeExperimentsArePreservedByBroadClears: true,
      peerReflectionsHiddenFromUserMemoryList: true
    },
    ...extra
  });
}

async function setCategoryMemory({ userId, category, remember }) {
  const model = await loadUserWorldModel({ userId });
  const controls = normalizePrivacyControls(model?.privacyControls);
  const blocked = new Set(controls.blockedCategories);
  if (remember) blocked.delete(category);
  else blocked.add(category);
  const nextControls = { blockedCategories: [...blocked], updatedAt: new Date().toISOString() };

  const clearPatch = categoryWorldModelPatch(category);
  const patch = {
    privacy_controls: nextControls,
    ...(remember ? {} : clearPatch),
    updated_at: new Date().toISOString()
  };
  const modelUpdated = await patchWorldModel(userId, patch);
  if (!modelUpdated) return { success: false, code: "PRIVACY_CONTROL_UPDATE_FAILED" };

  let deletedMemories = 0;
  if (!remember) {
    const memories = await fetchMemories(userId, 80);
    const ids = memories.filter((item) => categoryForMemory(item) === category).map((item) => item.id).filter(Boolean);
    if (ids.length) {
      const deleted = await deleteMemoryIds(userId, ids);
      deletedMemories = deleted ? ids.length : 0;
    }
  }
  return { success: true, action: "set_category_memory", category, remember, deletedMemories };
}

function categoryWorldModelPatch(category) {
  if (category === "identity") return { identity: {} };
  if (category === "preferences") return { preferences: {} };
  if (category === "goals") return { goals: {} };
  if (category === "constraints") return { constraints: {} };
  if (category === "behavior") return { behavior: {} };
  if (category === "fitness_outcomes") return { physiological_response: {} };
  if (category === "relationship") return { relationship: {} };
  return {};
}

async function fetchMemories(userId, limit = 50) {
  const config = supabaseConfig();
  if (!config) return [];
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: "id,memory_type,topic,content,importance,confidence,tags,created_at,updated_at",
    order: "updated_at.desc",
    limit: String(Math.max(1, Math.min(100, Number(limit) || 50)))
  });
  try {
    const response = await fetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id || null,
      memoryType: row.memory_type || null,
      topic: row.topic || null,
      content: clean(row.content, 1200),
      importance: row.importance ?? null,
      confidence: row.confidence ?? null,
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    }));
  } catch {
    return [];
  }
}

async function patchWorldModel(userId, patch = {}) {
  const config = supabaseConfig();
  if (!config) return false;
  try {
    const params = new URLSearchParams({ user_id: `eq.${userId}` });
    let response = await fetch(`${config.url}/rest/v1/ari_vnext_user_models?${params.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
    });
    let data = await response.json().catch(() => []);
    if (response.ok && Array.isArray(data) && data.length) return true;

    response = await fetch(`${config.url}/rest/v1/ari_vnext_user_models`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({ user_id: userId, model_version: "1.1.0", ...patch, updated_at: new Date().toISOString() })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deleteMemoryIds(userId, ids = []) {
  const config = supabaseConfig();
  if (!config || !ids.length) return false;
  const safeIds = ids.map((item) => clean(item, 200)).filter(Boolean);
  if (!safeIds.length) return false;
  const params = new URLSearchParams({ user_id: `eq.${userId}`, id: `in.(${safeIds.join(",")})` });
  try {
    const response = await fetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, {
      method: "DELETE",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deleteFromTable(table, userId, extra = {}) {
  const config = supabaseConfig();
  if (!config) return false;
  const params = new URLSearchParams({ user_id: `eq.${userId}` });
  for (const [key, value] of Object.entries(extra || {})) if (value) params.set(key, `eq.${clean(value, 300)}`);
  try {
    const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
      method: "DELETE",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deleteRowsByStatuses(table, userId, statuses = []) {
  const config = supabaseConfig();
  if (!config) return false;
  const safe = statuses.map((item) => clean(item, 40)).filter(Boolean);
  const params = new URLSearchParams({ user_id: `eq.${userId}`, status: `in.(${safe.join(",")})` });
  try {
    const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
      method: "DELETE",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 6000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = clean(user?.id, 200);
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    return { authenticated: true, userId };
  } catch (error) {
    return { authenticated: false, status: 503, code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED", message: "ARI could not verify the signed-in session." };
  } finally {
    clearTimeout(timeoutId);
  }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}
function serverHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra };
}
function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Knowledge-Controls", "v1.1");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
