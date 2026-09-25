// ARI Experience Engine — server-only persistence and retrieval.

import {
  ARI_EXPERIENCE_ENGINE_VERSION,
  normalizeExperienceRow,
  selectExperienceSeeds,
  summarizeExperienceContext
} from "./experience-core.js";

const TABLE = "ari_vnext_experiences";
const TIMEOUT_MS = 5000;

export function experienceEngineEnabled() {
  return String(process.env.ARI_EXPERIENCE_ENGINE_ENABLED || "").trim().toLowerCase() !== "false";
}

export async function listRecentExperiences({ userId, limit = 32, statuses = null, since = null } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !experienceEngineEnabled()) return [];

  const query = {
    user_id: `eq.${id}`,
    select: experienceSelect(),
    order: "updated_at.desc",
    limit: String(clampInt(limit, 1, 80, 32))
  };
  if (Array.isArray(statuses) && statuses.length) {
    const cleanStatuses = statuses.map(v => clean(v, 40)).filter(Boolean);
    if (cleanStatuses.length) query.status = `in.(${cleanStatuses.join(",")})`;
  }
  const sinceIso = isoOrNull(since);
  if (sinceIso) query.updated_at = `gte.${sinceIso}`;

  const rows = await readTable(config, TABLE, query);
  return rows.map(normalizeExperienceRow).filter(Boolean);
}

export async function listDueExperienceFollowups({ userId, now = new Date(), limit = 3 } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !experienceEngineEnabled()) return [];

  const rows = await readTable(config, TABLE, {
    user_id: `eq.${id}`,
    status: "eq.awaiting_outcome",
    follow_up_at: `lte.${validDate(now).toISOString()}`,
    select: experienceSelect(),
    order: "follow_up_at.asc",
    limit: String(clampInt(limit, 1, 8, 3))
  });
  return rows.map(normalizeExperienceRow).filter(Boolean);
}

export async function countExperiencesSince({ userId, since } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const sinceIso = isoOrNull(since);
  if (!id || !config || !sinceIso || !experienceEngineEnabled()) return 0;
  const rows = await readTable(config, TABLE, {
    user_id: `eq.${id}`,
    created_at: `gte.${sinceIso}`,
    select: "id",
    limit: "80"
  });
  return rows.length;
}

export async function loadExperienceSeeds({ userId, recentExperiences = [], limit = 5 } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !experienceEngineEnabled()) return [];

  const [worldRows, dreamRows] = await Promise.all([
    readTable(config, "ari_vnext_user_models", {
      user_id: `eq.${id}`,
      select: "source_summary,updated_at",
      limit: "1"
    }),
    readTable(config, "ari_vnext_dream_insights", {
      user_id: `eq.${id}`,
      status: "eq.active",
      select: "id,insight_key,kind,domain,title,summary,confidence,action,updated_at",
      order: "updated_at.desc",
      limit: "24"
    })
  ]);

  const sourceSummary = safeObject(worldRows[0]?.source_summary);
  const curiosityState = safeObject(sourceSummary?.curiosityState);
  const dreamInsights = dreamRows.map(row => ({
    id: row.id,
    insightKey: row.insight_key,
    kind: row.kind,
    domain: row.domain,
    title: row.title,
    summary: row.summary,
    confidence: row.confidence,
    action: row.action,
    updatedAt: row.updated_at
  }));

  return selectExperienceSeeds({
    curiosityState,
    dreamInsights,
    recentExperiences,
    limit
  });
}

export async function upsertExperience({ userId, experience } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const row = serializeExperience(experience, id);
  if (!id || !config || !row?.experience_key || !experienceEngineEnabled()) {
    return { stored: false, reason: "experience_store_unavailable" };
  }

  const params = new URLSearchParams({ on_conflict: "user_id,experience_key" });
  try {
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(row)
    });
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    if (!response.ok || !saved) {
      return { stored: false, reason: `http_${response.status}` };
    }
    return { stored: true, experience: normalizeExperienceRow(saved) };
  } catch (error) {
    return { stored: false, reason: error?.name || "experience_write_failed" };
  }
}

export async function loadExperienceContext({
  userId,
  message = "",
  route = {},
  limit = 4,
  now = new Date()
} = {}) {
  const id = cleanUserId(userId);
  if (!id || !experienceEngineEnabled()) {
    return {
      version: ARI_EXPERIENCE_ENGINE_VERSION,
      active: false,
      experienceCount: 0,
      resolvedCount: 0,
      maxPredictionError: null,
      meanPredictionError: null,
      experiences: []
    };
  }

  const rows = await listRecentExperiences({
    userId: id,
    statuses: ["awaiting_outcome", "resolved"],
    limit: 40,
    since: new Date(validDate(now).getTime() - 120 * 86400000)
  });

  return summarizeExperienceContext(rows, { message, route, limit, now });
}

function serializeExperience(value = {}, userId = "") {
  const now = new Date().toISOString();
  const prediction = compactObject(value?.prediction, 2400);
  const investigation = compactObject(value?.investigation, 5200);
  const observedOutcome = compactObject(value?.observedOutcome ?? value?.observed_outcome, 3200);
  const metadata = {
    version: ARI_EXPERIENCE_ENGINE_VERSION,
    hiddenChainOfThoughtStored: false,
    rawModelOutputStored: false,
    ...(compactObject(value?.metadata, 1800) || {})
  };

  return {
    user_id: userId,
    experience_key: clean(value?.experienceKey ?? value?.experience_key, 240),
    status: normalizeStatus(value?.status),
    source_type: normalizeSourceType(value?.sourceType ?? value?.source_type),
    domain: clean(value?.domain, 80).toLowerCase() || "general",
    trigger_ref: clean(value?.triggerRef ?? value?.trigger_ref, 240) || null,
    trigger_summary: clean(value?.triggerSummary ?? value?.trigger_summary, 1200),
    attention_reason: clean(value?.attentionReason ?? value?.attention_reason, 900),
    prior_belief: clean(value?.priorBelief ?? value?.prior_belief, 1000),
    prediction,
    investigation,
    observed_outcome: observedOutcome,
    prediction_error: finite01(value?.predictionError ?? value?.prediction_error),
    surprise: finite01(value?.surprise),
    information_gain: finite01(value?.informationGain ?? value?.information_gain),
    affect_update: compactObject(value?.affectUpdate ?? value?.affect_update, 1400),
    belief_update: compactObject(value?.beliefUpdate ?? value?.belief_update, 1800),
    strategy_update: compactObject(value?.strategyUpdate ?? value?.strategy_update, 1800),
    unresolved_questions: cleanArray(value?.unresolvedQuestions ?? value?.unresolved_questions, 8, 500),
    related_refs: cleanArray(value?.relatedRefs ?? value?.related_refs, 12, 260),
    follow_up_at: isoOrNull(value?.followUpAt ?? value?.follow_up_at),
    started_at: isoOrNull(value?.startedAt ?? value?.started_at) || now,
    observed_at: isoOrNull(value?.observedAt ?? value?.observed_at),
    resolved_at: isoOrNull(value?.resolvedAt ?? value?.resolved_at),
    metadata,
    updated_at: now
  };
}

function experienceSelect() {
  return [
    "id","user_id","experience_key","status","source_type","domain","trigger_ref","trigger_summary",
    "attention_reason","prior_belief","prediction","investigation","observed_outcome","prediction_error",
    "surprise","information_gain","affect_update","belief_update","strategy_update","unresolved_questions",
    "related_refs","follow_up_at","started_at","observed_at","resolved_at","metadata","created_at","updated_at"
  ].join(",");
}

async function readTable(config, table, query = {}) {
  try {
    const params = new URLSearchParams(query);
    const response = await timedFetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch {
    return [];
  }
}

function normalizeStatus(value) {
  const v = clean(value, 40).toLowerCase();
  return ["candidate","pursuing","awaiting_outcome","resolved","abandoned"].includes(v) ? v : "awaiting_outcome";
}
function normalizeSourceType(value) {
  const v = clean(value, 60).toLowerCase();
  return ["curiosity","dream","world_event","decision","goal","experiment","communication","community","manual","experience_followup"].includes(v)
    ? v
    : "world_event";
}
function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function compactObject(value, max = 2400) {
  const object = safeObject(value);
  try {
    const text = JSON.stringify(object);
    if (text.length <= max) return object;
    return { summary: clean(object?.summary || object?.findings || text, Math.max(200, max - 80)), compacted: true };
  } catch {
    return {};
  }
}
function cleanArray(values, limit, max) {
  return (Array.isArray(values) ? values : []).map(v => clean(v, max)).filter(Boolean).slice(0, limit);
}
function finite01(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null;
}
function isoOrNull(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function cleanUserId(value) {
  const id = clean(value, 200).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}
function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
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
async function timedFetch(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
