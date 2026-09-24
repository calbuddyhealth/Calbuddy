// ARI vNext — persistence and retrieval for Dreaming & Consolidation.

import {
  ARI_DREAMING_VERSION,
  sanitizeDreamConversation,
  selectDreamInsightsForTurn
} from "./dreaming-core.js";

const RUN_TABLE = "ari_vnext_dream_runs";
const INSIGHT_TABLE = "ari_vnext_dream_insights";
const TIMEOUT_MS = 4500;

export function dreamingEnabled() {
  return process.env.ARI_DREAMING_ENABLED !== "false";
}

export async function loadDreamingEvidence({ userId, now = new Date(), days = 14 } = {}) {
  const id = cleanUserId(userId);
  if (!id || !dreamingEnabled()) return { available: false, reason: "dreaming_disabled_or_user_missing", evidence: emptyEvidence(now, days) };
  const config = supabaseConfig();
  if (!config) return { available: false, reason: "persistence_unavailable", evidence: emptyEvidence(now, days) };

  const end = validDate(now);
  const start = new Date(end.getTime() - Math.max(2, Math.min(30, Number(days) || 14)) * 86400000);
  const worldRows = await readTable(config, "ari_vnext_user_models", {
    user_id: `eq.${id}`,
    select: "model_version,preferences,goals,constraints,behavior,response_profile,relationship,source_summary,privacy_controls,updated_at",
    limit: "1"
  });
  const worldRow = worldRows[0] || null;
  const blocked = Array.isArray(worldRow?.privacy_controls?.blockedCategories)
    ? worldRow.privacy_controls.blockedCategories
    : Array.isArray(worldRow?.privacy_controls?.blocked_categories)
      ? worldRow.privacy_controls.blocked_categories
      : [];

  const [
    turns, cognitiveRows, goals, goalEvents, decisions, communication, community, strategies, institutional, priorDreams, trajectories
  ] = await Promise.all([
    readTable(config, "ari_conversation_turns", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      expires_at: `gt.${end.toISOString()}`,
      select: "turn_id,conversation_id,user_message,assistant_message,page_path,created_at,expires_at",
      order: "created_at.desc",
      limit: "32"
    }),
    readTable(config, "ari_vnext_cognitive_states", {
      user_id: `eq.${id}`,
      select: "state_version,state,updated_at",
      limit: "1"
    }),
    readTable(config, "ari_vnext_project_goals", {
      user_id: `eq.${id}`,
      select: "id,status,state,updated_at",
      order: "updated_at.desc",
      limit: "20"
    }),
    readTable(config, "ari_vnext_goal_events", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      select: "goal_id,event_id,event_type,event,created_at",
      order: "created_at.desc",
      limit: "40"
    }),
    readTable(config, "ari_vnext_decisions", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      select: "id,domain,decision_type,proposition,confidence,evidence,alternatives,prediction,status,outcome_direction,outcome,resolution_source,created_at,resolved_at,updated_at",
      order: "updated_at.desc",
      limit: "24"
    }),
    readTable(config, "ari_vnext_communication_outcomes", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      select: "id,turn_id,domain,strategy_key,strategy,status,outcome_direction,association_confidence,evaluation_source,created_at,resolved_at,updated_at",
      order: "updated_at.desc",
      limit: "30"
    }),
    readTable(config, "ari_vnext_community_interactions", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      select: "id,thread_id,action,thread_reply_count,reply_id,payload,created_at",
      order: "created_at.desc",
      limit: "24"
    }),
    readTable(config, "ari_vnext_adaptive_strategies", {
      user_id: `eq.${id}`,
      status: "in.(testing,adopted,practical_prior,retired)",
      select: "id,strategy_key,title,instruction,lesson_summary,domains,status,confidence,maturity_score,trials,positive_outcomes,negative_outcomes,neutral_outcomes,metadata,updated_at",
      order: "updated_at.desc",
      limit: "24"
    }),
    readTable(config, "ari_vnext_institutional_memory", {
      user_id: `eq.${id}`,
      active: "eq.true",
      select: "id,lesson_key,domain,title,summary,lesson,tags,confidence,evidence_basis,source_turn_id,metadata,updated_at",
      order: "updated_at.desc",
      limit: "20"
    }),
    readTable(config, INSIGHT_TABLE, {
      user_id: `eq.${id}`,
      status: "eq.active",
      select: "id,insight_key,kind,domain,title,summary,confidence,evidence_refs,evidence_basis,action,transfer_conditions,disconfirmers,updated_at",
      order: "updated_at.desc",
      limit: "20"
    }),
    readTable(config, "ari_vnext_cognitive_trajectories", {
      user_id: `eq.${id}`,
      created_at: `gte.${start.toISOString()}`,
      select: "id,turn_id,domain,plan_mode,route,sources,planner,verification,evaluation,outcome,learning,created_at",
      order: "created_at.desc",
      limit: "40"
    })
  ]);

  const conversations = turns.map(row => sanitizeDreamConversation({
    ref: `turn:${clean(row.turn_id, 160) || clean(row.created_at, 80)}`,
    ...row
  }, blocked)).filter(Boolean);

  const evidence = {
    version: ARI_DREAMING_VERSION,
    window: { start: start.toISOString(), end: end.toISOString() },
    conversations,
    worldModel: worldRow ? {
      ref: "world-model:latest",
      updatedAt: worldRow.updated_at || null,
      preferences: safeObject(worldRow.preferences),
      goals: safeObject(worldRow.goals),
      constraints: safeObject(worldRow.constraints),
      behavior: safeObject(worldRow.behavior),
      responseProfile: safeObject(worldRow.response_profile),
      relationship: safeObject(worldRow.relationship),
      sourceSummary: safeObject(worldRow.source_summary),
      privacyControls: safeObject(worldRow.privacy_controls)
    } : null,
    cognitiveState: cognitiveRows[0] ? compactCognitiveState(cognitiveRows[0]) : null,
    goals: goals.map(row => compactGoal(row)).filter(Boolean),
    goalEvents: goalEvents.map(row => compactGoalEvent(row)).filter(Boolean),
    decisions: decisions.map(row => ({ ref: `decision:${row.id}`, ...compact(row, 2800) })),
    communicationOutcomes: communication.map(row => ({ ref: `communication:${row.id}`, ...compact(row, 2200) })),
    communityInteractions: community.map(row => ({
      ref: `community:${row.id}`,
      id: row.id,
      threadId: clean(row.thread_id, 220),
      action: clean(row.action, 80),
      replyId: clean(row.reply_id, 220) || null,
      threadReplyCount: Number(row.thread_reply_count || 0),
      payload: safeObject(row.payload),
      at: row.created_at || null,
      untrustedPublicData: true
    })),
    strategies: strategies.map(row => ({ ref: `strategy:${row.id}`, ...compact(row, 2400) })),
    institutionalMemory: institutional.map(row => ({ ref: `institutional:${row.id}`, ...compact(row, 2200) })),
    priorDreamInsights: priorDreams.map(normalizeInsightRow).filter(Boolean),
    cognitiveTrajectories: trajectories.map(row => ({
      ref: `trajectory:${clean(row.id || row.turn_id, 160)}`,
      id: clean(row.id, 120),
      turnId: clean(row.turn_id, 180),
      domain: clean(row.domain, 60),
      planMode: clean(row.plan_mode, 60),
      route: safeObject(row.route),
      sources: safeObject(row.sources),
      planner: safeObject(row.planner),
      verification: safeObject(row.verification),
      evaluation: safeObject(row.evaluation),
      outcome: safeObject(row.outcome),
      learning: safeObject(row.learning),
      at: row.created_at || null,
      sanitizedEvaluationOnly: true,
      hiddenChainOfThoughtStored: false
    })),
    updatedAt: end.toISOString()
  };
  evidence.counts = evidenceCounts(evidence);
  return { available: true, evidence };
}

export async function loadLatestDreamRun({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !dreamingEnabled()) return null;
  const rows = await readTable(config, RUN_TABLE, {
    user_id: `eq.${id}`,
    select: "id,status,evidence_fingerprint,evidence_counts,model,summary,insight_count,started_at,completed_at,updated_at",
    order: "started_at.desc",
    limit: "1"
  });
  return rows[0] || null;
}

export async function startDreamRun({ userId, runId, fingerprint, counts, model, now = new Date() } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !runId) return { stored: false, reason: "store_unavailable" };
  return writeTable(config, RUN_TABLE, {
    user_id: id,
    id: runId,
    status: "started",
    evidence_fingerprint: fingerprint,
    evidence_counts: counts || {},
    model: clean(model, 120) || null,
    insight_count: 0,
    started_at: validDate(now).toISOString(),
    updated_at: validDate(now).toISOString(),
    metadata: { version: ARI_DREAMING_VERSION, hiddenChainOfThoughtStored: false, rawEvidenceStored: false }
  }, "POST");
}

export async function finishDreamRun({ userId, runId, status, summary = "", insightCount = 0, error = null, now = new Date() } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !runId) return { stored: false, reason: "store_unavailable" };
  const query = new URLSearchParams({ user_id: `eq.${id}`, id: `eq.${runId}` });
  const response = await timedFetch(`${config.url}/rest/v1/${RUN_TABLE}?${query}`, {
    method: "PATCH",
    headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
    body: JSON.stringify({
      status: ["completed", "failed", "skipped"].includes(status) ? status : "failed",
      summary: clean(summary, 1600),
      insight_count: Math.max(0, Number(insightCount) || 0),
      completed_at: validDate(now).toISOString(),
      updated_at: validDate(now).toISOString(),
      metadata: { version: ARI_DREAMING_VERSION, hiddenChainOfThoughtStored: false, rawEvidenceStored: false, ...(error ? { error: clean(error, 360) } : {}) }
    })
  });
  return { stored: response.ok, reason: response.ok ? null : `http_${response.status}` };
}

export async function persistDreamInsights({ userId, runId, insights = [], now = new Date() } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !runId || !Array.isArray(insights) || !insights.length) return { stored: 0 };
  let stored = 0;
  for (const insight of insights.slice(0, 8)) {
    const row = {
      user_id: id,
      id: insight.id,
      insight_key: insight.insightKey,
      run_id: runId,
      kind: insight.kind,
      domain: insight.domain,
      title: insight.title,
      summary: insight.summary,
      confidence: insight.confidence,
      evidence_refs: insight.evidenceRefs,
      evidence_basis: insight.evidenceBasis,
      action: insight.action,
      transfer_conditions: insight.transferConditions,
      disconfirmers: insight.disconfirmers,
      status: "active",
      last_seen_at: validDate(now).toISOString(),
      updated_at: validDate(now).toISOString(),
      metadata: { version: ARI_DREAMING_VERSION, provisional: true, hiddenChainOfThoughtStored: false }
    };
    const params = new URLSearchParams({ on_conflict: "user_id,insight_key" });
    try {
      const response = await timedFetch(`${config.url}/rest/v1/${INSIGHT_TABLE}?${params}`, {
        method: "POST",
        headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(row)
      });
      if (response.ok) stored += 1;
    } catch {}
  }
  return { stored };
}

export async function loadDreamingContext({ userId, message = "", route = {}, limit = 5 } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config || !dreamingEnabled()) return { version: ARI_DREAMING_VERSION, active: false, insights: [], lastDreamAt: null };
  const [insightRows, run] = await Promise.all([
    readTable(config, INSIGHT_TABLE, {
      user_id: `eq.${id}`,
      status: "eq.active",
      updated_at: `gte.${new Date(Date.now() - 90 * 86400000).toISOString()}`,
      select: "id,insight_key,kind,domain,title,summary,confidence,evidence_refs,evidence_basis,action,transfer_conditions,disconfirmers,status,last_seen_at,updated_at",
      order: "confidence.desc,updated_at.desc",
      limit: "32"
    }),
    loadLatestDreamRun({ userId: id })
  ]);
  const normalized = insightRows.map(normalizeInsightRow).filter(Boolean);
  const selected = selectDreamInsightsForTurn(normalized, { message, route, limit });
  return {
    version: ARI_DREAMING_VERSION,
    active: true,
    lastDreamAt: run?.completed_at || null,
    insightCount: normalized.length,
    insights: selected
  };
}

async function readTable(config, table, query = {}) {
  try {
    const params = new URLSearchParams(query);
    const response = await timedFetch(`${config.url}/rest/v1/${table}?${params}`, { headers: serverHeaders(config.key) });
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch { return []; }
}

async function writeTable(config, table, body, method = "POST") {
  try {
    const response = await timedFetch(`${config.url}/rest/v1/${table}`, {
      method,
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify(body)
    });
    return { stored: response.ok, reason: response.ok ? null : `http_${response.status}` };
  } catch (error) {
    return { stored: false, reason: error?.name || "write_failed" };
  }
}

function compactCognitiveState(row) {
  const state = row?.state && typeof row.state === "object" ? row.state : {};
  return {
    ref: "cognitive-state:latest",
    updatedAt: row?.updated_at || null,
    turnCount: Number(state.turnCount || 0),
    attention: array(state.attention, 8),
    salience: array(state.salience, 8),
    beliefSystem: safeObject(state.beliefSystem),
    motivationalLearning: safeObject(state.motivationalLearning),
    epistemic: safeObject(state.epistemic),
    continuity: safeObject(state.continuity),
    lastOutcome: safeObject(state.lastOutcome),
    openLoops: array(state.openLoops, 8),
    judgments: array(state.judgments, 6)
  };
}

function compactGoal(row) {
  const goal = row?.state && typeof row.state === "object" ? row.state : null;
  if (!goal?.id) return null;
  return {
    ref: `goal:${goal.id}`,
    id: goal.id,
    title: clean(goal.title, 220),
    purpose: clean(goal.purpose, 700),
    status: clean(goal.status, 40),
    successCriteria: clean(goal.successCriteria, 700),
    commitment: safeObject(goal.commitment),
    budget: safeObject(goal.budget),
    nextAction: clean(goal.nextAction, 400),
    approaches: array(goal.approaches, 6),
    attempts: array(goal.attempts, 8),
    lessons: array(goal.lessons, 8),
    latestOutcome: safeObject(goal.latestOutcome),
    updatedAt: row.updated_at || goal.updatedAt || null
  };
}

function compactGoalEvent(row) {
  if (!row?.event_id) return null;
  const event = row.event && typeof row.event === "object" ? row.event : {};
  return {
    ref: `goal-event:${row.event_id}`,
    goalId: row.goal_id,
    eventId: row.event_id,
    type: row.event_type,
    source: clean(event.source, 120),
    receipt: event.receipt?.verified === true ? safeObject(event.receipt) : null,
    payload: safeObject(event.payload),
    at: row.created_at || event.at || null
  };
}

function normalizeInsightRow(row) {
  if (!row?.id || !row?.kind || !row?.summary) return null;
  return {
    ref: `dream:${row.id}`,
    id: row.id,
    insightKey: row.insight_key || row.id,
    kind: row.kind,
    domain: row.domain || "general",
    title: clean(row.title, 180),
    summary: clean(row.summary, 900),
    confidence: Number(row.confidence || 0),
    evidenceRefs: array(row.evidence_refs, 10),
    evidenceBasis: clean(row.evidence_basis, 900),
    action: clean(row.action, 40),
    transferConditions: array(row.transfer_conditions, 4),
    disconfirmers: array(row.disconfirmers, 4),
    status: row.status || "active",
    updatedAt: row.updated_at || null
  };
}

function evidenceCounts(evidence) {
  return {
    conversations: evidence.conversations.length,
    goals: evidence.goals.length,
    goalEvents: evidence.goalEvents.length,
    decisions: evidence.decisions.length,
    communicationOutcomes: evidence.communicationOutcomes.length,
    communityInteractions: evidence.communityInteractions.length,
    strategies: evidence.strategies.length,
    institutionalMemory: evidence.institutionalMemory.length,
    priorDreamInsights: evidence.priorDreamInsights.length,
    cognitiveTrajectories: evidence.cognitiveTrajectories.length,
    cognitiveState: evidence.cognitiveState ? 1 : 0,
    worldModel: evidence.worldModel ? 1 : 0
  };
}

function emptyEvidence(now, days) {
  const end = validDate(now);
  return { version: ARI_DREAMING_VERSION, window: { start: new Date(end.getTime() - (Number(days) || 14) * 86400000).toISOString(), end: end.toISOString() }, conversations: [], goals: [], goalEvents: [], decisions: [], communicationOutcomes: [], communityInteractions: [], strategies: [], institutionalMemory: [], priorDreamInsights: [], cognitiveTrajectories: [], cognitiveState: null, worldModel: null, counts: {} };
}
function compact(value, max = 2400) {
  try { return JSON.parse(JSON.stringify(value).slice(0, max)); } catch { return safeObject(value); }
}
function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try { return JSON.parse(JSON.stringify(value)); } catch { return {}; }
}
function array(value, limit) { return (Array.isArray(value) ? value : []).slice(0, limit); }
function validDate(value) { const d = value instanceof Date ? value : new Date(value); return Number.isFinite(d.getTime()) ? d : new Date(); }
function cleanUserId(value) { const id = clean(value, 200).toLowerCase(); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : ""; }
function supabaseConfig() { const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, ""); const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000); return url && key ? { url, key } : null; }
function serverHeaders(key, extra = {}) { return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...extra }; }
async function timedFetch(url, options = {}) { return fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" }); }
function clean(value, max = 1000) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
