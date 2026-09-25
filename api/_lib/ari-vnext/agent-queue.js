// ARI vNext — server-only PGMQ background agent queue client.

export const ARI_AGENT_QUEUE_VERSION = "1.0.0";

const DEFAULT_VISIBILITY_SECONDS = 300;
const DEFAULT_MAX_ATTEMPTS = 3;

export async function enqueueAgentJob({
  userId,
  taskId,
  workerKey,
  jobType = "specialist",
  role = "specialist",
  objective = "",
  round = 1,
  followup = false,
  toolScope = "analysis",
  input = {},
  maxAttempts = DEFAULT_MAX_ATTEMPTS
} = {}) {
  return await rpc("ari_vnext_agent_job_enqueue", {
    requested_user_id: userId,
    requested_task_id: taskId,
    requested_worker_key: workerKey,
    requested_job_type: jobType,
    requested_role: role,
    requested_objective: objective,
    requested_round: boundedInt(round, 1, 0, 4),
    requested_followup: followup === true,
    requested_tool_scope: normalizeToolScope(toolScope),
    requested_input: safeJson(input),
    requested_max_attempts: boundedInt(maxAttempts, DEFAULT_MAX_ATTEMPTS, 1, 6)
  });
}

export async function claimAgentJobs({
  limit = 2,
  visibilitySeconds = DEFAULT_VISIBILITY_SECONDS
} = {}) {
  const result = await rpc("ari_vnext_agent_job_claim", {
    requested_limit: boundedInt(limit, 2, 1, 6),
    requested_visibility_seconds: boundedInt(
      visibilitySeconds,
      DEFAULT_VISIBILITY_SECONDS,
      60,
      900
    )
  });
  return Array.isArray(result) ? result.map(normalizeClaim).filter(Boolean) : [];
}

export async function completeAgentJob({
  msgId,
  taskId,
  workerKey,
  mailboxMessageId = null,
  providerModel = null
} = {}) {
  return await rpc("ari_vnext_agent_job_complete", {
    requested_msg_id: Number(msgId),
    requested_task_id: taskId,
    requested_worker_key: workerKey,
    requested_mailbox_message_id: mailboxMessageId || null,
    requested_provider_model: clean(providerModel, 160) || null
  });
}

export async function retryAgentJob({
  msgId,
  taskId,
  workerKey,
  delaySeconds = 60,
  error = "",
  errorCode = null
} = {}) {
  return await rpc("ari_vnext_agent_job_retry", {
    requested_msg_id: Number(msgId),
    requested_task_id: taskId,
    requested_worker_key: workerKey,
    requested_delay_seconds: boundedInt(delaySeconds, 60, 15, 3600),
    requested_error: clean(error, 1000) || "worker_failed",
    requested_error_code: clean(errorCode, 240) || null
  });
}

export async function deadletterAgentJob({
  msgId,
  taskId,
  workerKey,
  error = "",
  errorCode = null
} = {}) {
  return await rpc("ari_vnext_agent_job_deadletter", {
    requested_msg_id: Number(msgId),
    requested_task_id: taskId,
    requested_worker_key: workerKey,
    requested_error: clean(error, 1000) || "worker_failed",
    requested_error_code: clean(errorCode, 240) || null
  });
}

export async function readAgentQueueMetrics() {
  return await rpc("ari_vnext_agent_job_metrics", {});
}

export function retryDelaySeconds(job = {}, error = null) {
  const providerDelay = Number(error?.retryAfterSeconds);
  if (Number.isFinite(providerDelay) && providerDelay > 0) {
    return Math.max(15, Math.min(3600, Math.ceil(providerDelay)));
  }
  const readCount = Math.max(1, Number(job?.readCount || job?.read_ct || 1));
  const base = Number(error?.status) === 429 ? 60 : 30;
  return Math.max(15, Math.min(3600, base * (2 ** Math.min(6, readCount - 1))));
}

function normalizeClaim(row) {
  if (!row || typeof row !== "object") return null;
  const msgId = Number(row.msg_id);
  if (!Number.isFinite(msgId) || msgId <= 0) return null;
  return {
    msgId,
    readCount: Math.max(1, Number(row.read_ct) || 1),
    userId: clean(row.user_id, 120),
    taskId: clean(row.task_id, 120),
    executionSessionId: clean(row.execution_session_id, 180),
    workerKey: clean(row.worker_key, 80),
    jobType: clean(row.job_type, 40).toLowerCase(),
    role: clean(row.role, 120),
    objective: clean(row.objective, 1600),
    round: boundedInt(row.round, 1, 0, 4),
    followup: row.followup === true,
    toolScope: normalizeToolScope(row.tool_scope),
    maxAttempts: boundedInt(row.max_attempts, DEFAULT_MAX_ATTEMPTS, 1, 6),
    input: safeJson(row.input),
    taskGoal: clean(row.task_goal, 900),
    successCriteria: clean(row.success_criteria, 1200),
    taskPlan: safeJson(row.task_plan),
    taskVerification: safeJson(row.task_verification),
    taskRoundCount: boundedInt(row.task_round_count, 0, 0, 4),
    taskMaxRounds: boundedInt(row.task_max_rounds, 2, 1, 4)
  };
}

async function rpc(name, body) {
  const config = supabaseConfig();
  if (!config) {
    const error = new Error("Supabase agent queue configuration is missing.");
    error.code = "AGENT_QUEUE_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serverHeaders(config.key),
    body: JSON.stringify(body || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      clean(data?.message || data?.error || data?.hint || response.statusText, 1000) ||
      `Supabase RPC ${name} failed.`
    );
    error.status = response.status;
    error.code = clean(data?.code, 120) || "AGENT_QUEUE_RPC_FAILED";
    throw error;
  }
  return data;
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

function serverHeaders(key) {
  return {
    apikey: key,
    ...(looksLikeJwt(key) ? { Authorization: `Bearer ${key}` } : {}),
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

function looksLikeJwt(value = "") {
  return String(value).split(".").length === 3;
}

function normalizeToolScope(value) {
  const scope = clean(value, 40).toLowerCase();
  return ["analysis", "web", "developer_read"].includes(scope) ? scope : "analysis";
}

function safeJson(value) {
  try {
    return JSON.parse(JSON.stringify(value && typeof value === "object" ? value : {}));
  } catch {
    return {};
  }
}

function boundedInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
