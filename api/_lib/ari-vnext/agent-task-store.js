// ARI vNext — server-only durable multi-agent task/session persistence.

export const ARI_AGENT_TASK_STORE_VERSION = "1.0.0";

const SESSION_TABLE = "ari_vnext_agent_task_sessions";
const WORKER_TABLE = "ari_vnext_agent_task_workers";
const READ_TIMEOUT_MS = 1200;
const WRITE_TIMEOUT_MS = 1500;
const OPEN_STATUSES = new Set(["planning", "running", "verifying", "waiting"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function loadAgentTaskSession({
  userId,
  executionSessionId
} = {}) {
  const id = cleanUserId(userId);
  const execId = clean(executionSessionId, 180);
  const config = supabaseConfig();
  if (!id || !execId || !config) return null;

  const params = new URLSearchParams({
    select: "id,user_id,execution_session_id,conversation_id,root_turn_id,last_turn_id,goal,success_criteria,status,plan,verification,synthesis,next_step,round_count,max_rounds,created_at,updated_at,completed_at",
    user_id: `eq.${id}`,
    execution_session_id: `eq.${execId}`,
    limit: "1"
  });

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${SESSION_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return normalizeSession(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return null;
  }
}

export async function createAgentTaskSession({
  userId,
  executionSessionId,
  conversationId = null,
  rootTurnId = null,
  goal,
  successCriteria = "",
  plan = {},
  maxRounds = 2
} = {}) {
  const id = cleanUserId(userId);
  const execId = clean(executionSessionId, 180);
  const config = supabaseConfig();
  if (!id || !execId || !config) return { stored: false, session: null, reason: "not_configured" };

  const payload = {
    user_id: id,
    execution_session_id: execId,
    conversation_id: clean(conversationId, 180) || null,
    root_turn_id: clean(rootTurnId, 180) || null,
    last_turn_id: clean(rootTurnId, 180) || null,
    goal: clean(goal, 900) || "Complete the current substantial task.",
    success_criteria: clean(successCriteria, 1200) || null,
    status: "planning",
    plan: safeJson(plan),
    verification: {},
    synthesis: null,
    next_step: "Run the planned specialist assignments and reconcile their evidence.",
    round_count: 0,
    max_rounds: boundedInt(maxRounds, 2, 1, 4)
  };

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${SESSION_TABLE}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, { Prefer: "return=representation" }),
        body: JSON.stringify(payload)
      },
      WRITE_TIMEOUT_MS
    );

    if (response.status === 409) {
      const existing = await loadAgentTaskSession({ userId: id, executionSessionId: execId });
      return {
        stored: Boolean(existing),
        session: existing,
        reason: existing ? "already_exists" : "conflict"
      };
    }

    if (!response.ok) return { stored: false, session: null, reason: "write_failed" };
    const rows = await response.json().catch(() => []);
    const session = normalizeSession(Array.isArray(rows) ? rows[0] : rows);
    return { stored: Boolean(session), session, reason: session ? "created" : "invalid_response" };
  } catch {
    return { stored: false, session: null, reason: "write_failed" };
  }
}

export async function updateAgentTaskSession({
  userId,
  taskId,
  patch = {}
} = {}) {
  const id = cleanUserId(userId);
  const task = cleanUuid(taskId);
  const config = supabaseConfig();
  if (!id || !task || !config) return { stored: false, session: null, reason: "not_configured" };

  const normalized = normalizeSessionPatch(patch);
  if (!Object.keys(normalized).length) {
    const session = await loadAgentTaskSessionById({ userId: id, taskId: task });
    return { stored: false, session, reason: "empty_patch" };
  }

  normalized.updated_at = new Date().toISOString();
  const params = new URLSearchParams({
    id: `eq.${task}`,
    user_id: `eq.${id}`
  });

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${SESSION_TABLE}?${params.toString()}`,
      {
        method: "PATCH",
        headers: serverHeaders(config.key, { Prefer: "return=representation" }),
        body: JSON.stringify(normalized)
      },
      WRITE_TIMEOUT_MS
    );
    if (!response.ok) return { stored: false, session: null, reason: "write_failed" };
    const rows = await response.json().catch(() => []);
    const session = normalizeSession(Array.isArray(rows) ? rows[0] : rows);
    return { stored: Boolean(session), session, reason: session ? "updated" : "not_found" };
  } catch {
    return { stored: false, session: null, reason: "write_failed" };
  }
}

export async function loadAgentTaskWorkers({
  userId,
  taskId
} = {}) {
  const id = cleanUserId(userId);
  const task = cleanUuid(taskId);
  const config = supabaseConfig();
  if (!id || !task || !config) return [];

  const params = new URLSearchParams({
    select: "id,task_id,worker_key,role,objective,round,followup,status,mailbox_message_id,provider_model,error_code,created_at,started_at,completed_at,updated_at",
    user_id: `eq.${id}`,
    task_id: `eq.${task}`,
    order: "round.asc,created_at.asc",
    limit: "24"
  });

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${WORKER_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return (Array.isArray(rows) ? rows : []).map(normalizeWorker).filter(Boolean);
  } catch {
    return [];
  }
}

export async function upsertAgentTaskWorker({
  userId,
  taskId,
  worker = {}
} = {}) {
  const id = cleanUserId(userId);
  const task = cleanUuid(taskId);
  const workerKey = clean(worker?.workerKey, 80);
  const config = supabaseConfig();
  if (!id || !task || !workerKey || !config) {
    return { stored: false, worker: null, reason: "not_configured" };
  }

  const now = new Date().toISOString();
  const status = normalizeWorkerStatus(worker?.status);
  const payload = {
    user_id: id,
    task_id: task,
    worker_key: workerKey,
    role: clean(worker?.role, 120) || "specialist",
    objective: clean(worker?.objective, 1600) || "Analyze the assigned task.",
    round: boundedInt(worker?.round, 0, 0, 4),
    followup: worker?.followup === true,
    status,
    mailbox_message_id: cleanUuid(worker?.mailboxMessageId) || null,
    provider_model: clean(worker?.providerModel, 160) || null,
    error_code: clean(worker?.errorCode, 240) || null,
    started_at: status === "running"
      ? clean(worker?.startedAt, 120) || now
      : clean(worker?.startedAt, 120) || null,
    completed_at: ["completed", "failed", "skipped"].includes(status)
      ? clean(worker?.completedAt, 120) || now
      : clean(worker?.completedAt, 120) || null,
    updated_at: now
  };

  const params = new URLSearchParams({ on_conflict: "task_id,worker_key" });

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${WORKER_TABLE}?${params.toString()}`,
      {
        method: "POST",
        headers: serverHeaders(config.key, {
          Prefer: "resolution=merge-duplicates,return=representation"
        }),
        body: JSON.stringify(payload)
      },
      WRITE_TIMEOUT_MS
    );
    if (!response.ok) return { stored: false, worker: null, reason: "write_failed" };
    const rows = await response.json().catch(() => []);
    const stored = normalizeWorker(Array.isArray(rows) ? rows[0] : rows);
    return { stored: Boolean(stored), worker: stored, reason: stored ? "upserted" : "invalid_response" };
  } catch {
    return { stored: false, worker: null, reason: "write_failed" };
  }
}

export async function syncAgentTaskSessionWithExecution({
  userId,
  executionSession = null,
  turnId = null
} = {}) {
  const executionId = clean(executionSession?.id, 180);
  if (!executionId) return { stored: false, session: null, reason: "execution_session_missing" };

  const current = await loadAgentTaskSession({
    userId,
    executionSessionId: executionId
  });
  if (!current) return { stored: false, session: null, reason: "task_session_missing" };

  const executionStatus = clean(executionSession?.status, 40).toLowerCase();
  const mappedStatus =
    executionStatus === "completed" ? "completed" :
    executionStatus === "abandoned" ? "abandoned" :
    executionStatus === "blocked" || executionStatus === "waiting" ? "waiting" :
    null;

  const patch = {
    lastTurnId: clean(turnId, 180) || current.lastTurnId || null,
    nextStep: executionStatus === "completed"
      ? null
      : clean(executionSession?.nextStep, 1200) || current.nextStep || null
  };

  if (mappedStatus) patch.status = mappedStatus;
  if (mappedStatus === "completed" || mappedStatus === "abandoned") {
    patch.completedAt = new Date().toISOString();
  }

  if (
    !mappedStatus &&
    patch.nextStep === current.nextStep &&
    patch.lastTurnId === current.lastTurnId
  ) {
    return { stored: false, session: current, reason: "no_change" };
  }

  return await updateAgentTaskSession({
    userId,
    taskId: current.id,
    patch
  });
}

export function publicAgentTaskSession(session = null, workers = []) {
  const value = normalizeSession(session);
  if (!value) return null;
  const list = (Array.isArray(workers) ? workers : []).map(normalizeWorker).filter(Boolean);
  return {
    version: ARI_AGENT_TASK_STORE_VERSION,
    id: value.id,
    executionSessionId: value.executionSessionId,
    status: value.status,
    roundCount: value.roundCount,
    maxRounds: value.maxRounds,
    resumed: value.resumed === true,
    workerCount: list.length,
    completedWorkers: list.filter(item => item.status === "completed").length,
    failedWorkers: list.filter(item => item.status === "failed").length,
    mailboxThreadId: value.id,
    nextStep: value.nextStep,
    updatedAt: value.updatedAt,
    hiddenChainOfThoughtStored: false,
    rawWorkerTextStoredInTaskLedger: false
  };
}

export function isOpenAgentTaskSession(session = null) {
  const value = normalizeSession(session);
  return Boolean(value && OPEN_STATUSES.has(value.status));
}

async function loadAgentTaskSessionById({ userId, taskId } = {}) {
  const id = cleanUserId(userId);
  const task = cleanUuid(taskId);
  const config = supabaseConfig();
  if (!id || !task || !config) return null;
  const params = new URLSearchParams({
    select: "id,user_id,execution_session_id,conversation_id,root_turn_id,last_turn_id,goal,success_criteria,status,plan,verification,synthesis,next_step,round_count,max_rounds,created_at,updated_at,completed_at",
    user_id: `eq.${id}`,
    id: `eq.${task}`,
    limit: "1"
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${SESSION_TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return normalizeSession(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return null;
  }
}

function normalizeSession(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const id = cleanUuid(row.id);
  const executionSessionId = clean(row.execution_session_id ?? row.executionSessionId, 180);
  if (!id || !executionSessionId) return null;
  return {
    id,
    userId: cleanUserId(row.user_id ?? row.userId),
    executionSessionId,
    conversationId: clean(row.conversation_id ?? row.conversationId, 180) || null,
    rootTurnId: clean(row.root_turn_id ?? row.rootTurnId, 180) || null,
    lastTurnId: clean(row.last_turn_id ?? row.lastTurnId, 180) || null,
    goal: clean(row.goal, 900),
    successCriteria: clean(row.success_criteria ?? row.successCriteria, 1200) || null,
    status: normalizeSessionStatus(row.status),
    plan: safeJson(row.plan),
    verification: safeJson(row.verification),
    synthesis: clean(row.synthesis, 9000) || null,
    nextStep: clean(row.next_step ?? row.nextStep, 1200) || null,
    roundCount: boundedInt(row.round_count ?? row.roundCount, 0, 0, 4),
    maxRounds: boundedInt(row.max_rounds ?? row.maxRounds, 2, 1, 4),
    createdAt: clean(row.created_at ?? row.createdAt, 120) || null,
    updatedAt: clean(row.updated_at ?? row.updatedAt, 120) || null,
    completedAt: clean(row.completed_at ?? row.completedAt, 120) || null,
    resumed: row.resumed === true
  };
}

function normalizeSessionPatch(patch = {}) {
  const out = {};
  if (patch.status !== undefined) out.status = normalizeSessionStatus(patch.status);
  if (patch.plan !== undefined) out.plan = safeJson(patch.plan);
  if (patch.verification !== undefined) out.verification = safeJson(patch.verification);
  if (patch.synthesis !== undefined) out.synthesis = clean(patch.synthesis, 9000) || null;
  if (patch.nextStep !== undefined) out.next_step = clean(patch.nextStep, 1200) || null;
  if (patch.roundCount !== undefined) out.round_count = boundedInt(patch.roundCount, 0, 0, 4);
  if (patch.lastTurnId !== undefined) out.last_turn_id = clean(patch.lastTurnId, 180) || null;
  if (patch.completedAt !== undefined) out.completed_at = clean(patch.completedAt, 120) || null;
  return out;
}

function normalizeWorker(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const id = cleanUuid(row.id);
  const taskId = cleanUuid(row.task_id ?? row.taskId);
  const workerKey = clean(row.worker_key ?? row.workerKey, 80);
  if (!taskId || !workerKey) return null;
  return {
    id,
    taskId,
    workerKey,
    role: clean(row.role, 120) || "specialist",
    objective: clean(row.objective, 1600),
    round: boundedInt(row.round, 0, 0, 4),
    followup: row.followup === true,
    status: normalizeWorkerStatus(row.status),
    mailboxMessageId: cleanUuid(row.mailbox_message_id ?? row.mailboxMessageId) || null,
    providerModel: clean(row.provider_model ?? row.providerModel, 160) || null,
    errorCode: clean(row.error_code ?? row.errorCode, 240) || null,
    createdAt: clean(row.created_at ?? row.createdAt, 120) || null,
    startedAt: clean(row.started_at ?? row.startedAt, 120) || null,
    completedAt: clean(row.completed_at ?? row.completedAt, 120) || null,
    updatedAt: clean(row.updated_at ?? row.updatedAt, 120) || null
  };
}

function normalizeSessionStatus(value) {
  const text = clean(value, 40).toLowerCase();
  return ["planning", "running", "verifying", "waiting", "completed", "failed", "abandoned"].includes(text)
    ? text
    : "planning";
}

function normalizeWorkerStatus(value) {
  const text = clean(value, 40).toLowerCase();
  return ["planned", "running", "completed", "failed", "skipped"].includes(text)
    ? text
    : "planned";
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

async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
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

function cleanUserId(value) {
  const id = clean(value, 120).toLowerCase();
  return UUID_PATTERN.test(id) ? id : "";
}

function cleanUuid(value) {
  const id = clean(value, 120).toLowerCase();
  return UUID_PATTERN.test(id) ? id : "";
}

function boundedInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
