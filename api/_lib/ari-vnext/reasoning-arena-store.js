// ARI vNext — server-only persistence for blind reasoning arena outcomes.
// Stores compact scores and hashes only; never raw prompts, candidate answers, or hidden reasoning.

const TABLE = "ari_vnext_reasoning_arena_results";
const TIMEOUT_MS = 1200;

export async function persistBlindReasoningArenaResult({ userId, record } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !record || typeof record !== "object") {
    return { stored: false, reason: "invalid_input" };
  }

  const turnId = clean(record?.turnId, 220);
  const challengerModel = clean(record?.challengerModel, 120);
  const judgeModel = clean(record?.judgeModel, 120);
  const winner = clean(record?.winner, 30);
  if (!turnId || !challengerModel || !judgeModel || !["ari", "challenger", "tie", "invalid"].includes(winner)) {
    return { stored: false, reason: "invalid_record" };
  }

  const row = {
    user_id: id,
    turn_id: turnId,
    arena_version: clean(record?.version, 60) || "1.0.0",
    domains: compactArray(record?.domains, 4, 40),
    ari_model: clean(record?.ariModel, 120) || null,
    challenger_model: challengerModel,
    judge_model: judgeModel,
    winner,
    confidence: clamp(Number(record?.confidence || 0), 0, 1),
    evidence_weight: clamp(Number(record?.evidenceWeight || 0), 0, 2),
    judge_independent: record?.judgeIndependent === true,
    ari_blind_label: clean(record?.ariBlindLabel, 1) || null,
    challenger_blind_label: clean(record?.challengerBlindLabel, 1) || null,
    scores: normalizeObject(record?.scores),
    decisive_reasons: compactArray(record?.decisiveReasons, 3, 220),
    uncertainty: clean(record?.uncertainty, 320) || null,
    problem_hash: clean(record?.problemHash, 80) || null,
    ari_answer_hash: clean(record?.ariAnswerHash, 80) || null,
    challenger_answer_hash: clean(record?.challengerAnswerHash, 80) || null,
    metadata: {
      rawCandidatesStored: false,
      hiddenChainOfThoughtStored: false
    }
  };

  try {
    const params = new URLSearchParams({ on_conflict: "user_id,turn_id,challenger_model" });
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=ignore-duplicates,return=representation" }),
      body: JSON.stringify(row)
    }, TIMEOUT_MS);
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok
      ? { stored: true, duplicate: !saved, record: saved ? normalizeRow(saved) : null }
      : { stored: false, reason: "arena_write_failed" };
  } catch {
    return { stored: false, reason: "arena_write_failed" };
  }
}

export async function loadRecentBlindReasoningArenaResults({ userId, limit = 80 } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return [];

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    select: "turn_id,arena_version,domains,ari_model,challenger_model,judge_model,winner,confidence,evidence_weight,judge_independent,scores,decisive_reasons,uncertainty,created_at",
    order: "created_at.desc",
    limit: String(Math.max(1, Math.min(120, Number(limit || 80))))
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

function normalizeRow(row = {}) {
  const challengerModel = clean(row?.challenger_model ?? row?.challengerModel, 120);
  const judgeModel = clean(row?.judge_model ?? row?.judgeModel, 120);
  const winner = clean(row?.winner, 30);
  if (!challengerModel || !judgeModel || !["ari", "challenger", "tie", "invalid"].includes(winner)) return null;
  return {
    turnId: clean(row?.turn_id ?? row?.turnId, 220) || null,
    version: clean(row?.arena_version ?? row?.version, 60) || "1.0.0",
    domains: compactArray(row?.domains, 4, 40),
    ariModel: clean(row?.ari_model ?? row?.ariModel, 120) || null,
    challengerModel,
    judgeModel,
    winner,
    confidence: clamp(Number(row?.confidence || 0), 0, 1),
    evidenceWeight: clamp(Number(row?.evidence_weight ?? row?.evidenceWeight ?? 0), 0, 2),
    judgeIndependent: Boolean(row?.judge_independent ?? row?.judgeIndependent),
    scores: normalizeObject(row?.scores),
    decisiveReasons: compactArray(row?.decisive_reasons ?? row?.decisiveReasons, 3, 220),
    uncertainty: clean(row?.uncertainty, 320) || null,
    createdAt: row?.created_at ?? row?.createdAt ?? null
  };
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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); }
  catch { return {}; }
}

function compactArray(values, limit, max) {
  return (Array.isArray(values) ? values : [])
    .map((item) => clean(item, max))
    .filter(Boolean)
    .slice(0, limit);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
