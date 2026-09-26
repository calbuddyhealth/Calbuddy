import { randomUUID } from "node:crypto";

const THREAD_TABLE = "ari_chatgpt_browser_threads";
const JOB_TABLE = "ari_chatgpt_browser_jobs";
const WORKER_TABLE = "ari_chatgpt_browser_workers";
const DEFAULT_WAIT_MS = 12000;
const MAX_THREAD_TURNS = 12;
const MAX_MESSAGE_CHARS = 8000;
const MAX_RESPONSE_CHARS = 24000;

export function chatgptBrowserBridgeEnabled() {
  return String(process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED || "true").trim().toLowerCase() !== "false";
}

export function normalizeChatgptConversationUrl(value = "") {
  const raw = clean(value, 2000);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "chatgpt.com") return "";
    if (!/^\/c\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)) return "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export async function executeOwnerChatgptDiscussionAction({
  userId,
  action,
  arguments: args = {},
  waitMs = DEFAULT_WAIT_MS
} = {}) {
  if (!chatgptBrowserBridgeEnabled()) {
    return {
      success: false,
      code: "CHATGPT_BROWSER_BRIDGE_DISABLED",
      state: "disabled",
      message: "The owner ChatGPT browser bridge is disabled."
    };
  }

  if (action === "chatgpt_discussion_status") {
    return getOwnerChatgptBrowserStatus({ userId });
  }

  if (action === "chatgpt_discussion_read") {
    return readOwnerChatgptDiscussion({ userId, threadId: args.threadId });
  }

  if (action !== "chatgpt_discussion_start" && action !== "chatgpt_discussion_continue") {
    return { success: false, code: "CHATGPT_BROWSER_ACTION_UNSUPPORTED", state: "rejected" };
  }

  const queued = await enqueueOwnerChatgptDiscussion({
    userId,
    operation: action === "chatgpt_discussion_start" ? "start" : "continue",
    threadId: args.threadId,
    title: args.title,
    message: args.message
  });

  if (!queued?.success || !queued?.job?.id) return queued;
  if (queued?.worker?.online !== true) {
    return {
      ...queued,
      state: "queued",
      message: "The discussion job is queued, but no authenticated owner browser worker is online."
    };
  }

  const settled = await waitForChatgptBrowserJob({
    userId,
    jobId: queued.job.id,
    timeoutMs: Math.max(0, Math.min(Number(waitMs) || DEFAULT_WAIT_MS, 22000))
  });

  return settled?.state === "pending"
    ? { ...queued, state: "queued", message: "The ChatGPT discussion is still running in the owner browser worker." }
    : settled;
}

export async function getOwnerChatgptBrowserStatus({ userId } = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) {
    return { success: false, code: "CHATGPT_BROWSER_STORAGE_UNAVAILABLE", state: "unavailable" };
  }

  const workerRows = await restSelect(config, WORKER_TABLE, new URLSearchParams({
    select: "worker_id,last_seen_at,session_state,version,status",
    owner_user_id: `eq.${id}`,
    order: "last_seen_at.desc",
    limit: "1"
  }));
  const worker = Array.isArray(workerRows) ? workerRows[0] || null : null;
  const lastSeen = Date.parse(String(worker?.last_seen_at || ""));
  const online = Number.isFinite(lastSeen) && Date.now() - lastSeen < 35000;

  const threadRows = await restSelect(config, THREAD_TABLE, new URLSearchParams({
    select: "id,status,turn_count,updated_at",
    owner_user_id: `eq.${id}`,
    status: "in.(pending,active,paused)",
    order: "updated_at.desc",
    limit: "20"
  }));

  return {
    success: true,
    state: online && worker?.session_state === "authenticated" ? "ready" : "not_ready",
    worker: {
      online,
      workerId: clean(worker?.worker_id, 120) || null,
      sessionState: clean(worker?.session_state, 40) || "unknown",
      status: clean(worker?.status, 40) || "unknown",
      version: clean(worker?.version, 80) || null,
      lastSeenAt: worker?.last_seen_at || null
    },
    activeThreadCount: Array.isArray(threadRows) ? threadRows.length : 0,
    discussionOnly: true,
    passwordStored: false
  };
}

export async function enqueueOwnerChatgptDiscussion({
  userId,
  operation,
  threadId,
  title,
  message
} = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const kind = operation === "continue" ? "continue" : operation === "start" ? "start" : "";
  const text = cleanMultiline(message, MAX_MESSAGE_CHARS);
  if (!id || !config) return { success: false, code: "CHATGPT_BROWSER_STORAGE_UNAVAILABLE", state: "unavailable" };
  if (!kind || text.length < 2) return { success: false, code: "CHATGPT_BROWSER_JOB_INVALID", state: "rejected" };

  let thread = null;
  if (kind === "start") {
    const threadTitle = clean(title, 160) || clean(text, 80) || "Ari ↔ ChatGPT discussion";
    const created = await restInsert(config, THREAD_TABLE, {
      owner_user_id: id,
      title: threadTitle,
      status: "pending",
      turn_count: 0
    });
    thread = created?.[0] || created || null;
  } else {
    thread = await fetchThread(config, id, threadId);
    if (!thread) return { success: false, code: "CHATGPT_BROWSER_THREAD_NOT_FOUND", state: "rejected" };
    if (!["active", "paused", "pending"].includes(String(thread.status || ""))) {
      return { success: false, code: "CHATGPT_BROWSER_THREAD_CLOSED", state: "rejected" };
    }
    if (Number(thread.turn_count || 0) >= MAX_THREAD_TURNS) {
      return { success: false, code: "CHATGPT_BROWSER_THREAD_TURN_LIMIT", state: "limit_reached", thread: publicThread(thread) };
    }
    if (!normalizeChatgptConversationUrl(thread.chatgpt_conversation_url)) {
      return { success: false, code: "CHATGPT_BROWSER_THREAD_URL_MISSING", state: "rejected", thread: publicThread(thread) };
    }
  }

  if (!thread?.id) return { success: false, code: "CHATGPT_BROWSER_THREAD_CREATE_FAILED", state: "failed" };

  const pending = await restSelect(config, JOB_TABLE, new URLSearchParams({
    select: "id,status,created_at",
    owner_user_id: `eq.${id}`,
    thread_id: `eq.${thread.id}`,
    status: "in.(queued,running)",
    order: "created_at.desc",
    limit: "1"
  }));
  if (Array.isArray(pending) && pending.length) {
    return {
      success: false,
      code: "CHATGPT_BROWSER_THREAD_BUSY",
      state: "busy",
      thread: publicThread(thread),
      job: publicJob(pending[0])
    };
  }

  const inserted = await restInsert(config, JOB_TABLE, {
    owner_user_id: id,
    thread_id: thread.id,
    operation: kind,
    message: text,
    status: "queued"
  });
  const job = inserted?.[0] || inserted || null;
  const status = await getOwnerChatgptBrowserStatus({ userId: id });
  return {
    success: Boolean(job?.id),
    state: job?.id ? "queued" : "failed",
    thread: publicThread(thread),
    job: publicJob(job),
    worker: status?.worker || null
  };
}

export async function waitForChatgptBrowserJob({ userId, jobId, timeoutMs = DEFAULT_WAIT_MS } = {}) {
  const id = cleanUserId(userId);
  const jid = cleanUuid(jobId);
  const config = supabaseConfig();
  if (!id || !jid || !config) return { success: false, code: "CHATGPT_BROWSER_JOB_INVALID", state: "failed" };

  const deadline = Date.now() + Math.max(0, Math.min(Number(timeoutMs) || 0, 22000));
  do {
    const rows = await restSelect(config, JOB_TABLE, new URLSearchParams({
      select: "id,thread_id,operation,status,message,response_text,chatgpt_conversation_url,error_code,error_message,created_at,started_at,completed_at",
      id: `eq.${jid}`,
      owner_user_id: `eq.${id}`,
      limit: "1"
    }));
    const job = Array.isArray(rows) ? rows[0] || null : null;
    if (!job) return { success: false, code: "CHATGPT_BROWSER_JOB_NOT_FOUND", state: "failed" };
    if (job.status === "succeeded") {
      const thread = await fetchThread(config, id, job.thread_id);
      return {
        success: true,
        state: "completed",
        thread: publicThread(thread),
        job: publicJob(job),
        chatgptReply: cleanMultiline(job.response_text, MAX_RESPONSE_CHARS),
        conversationUrl: normalizeChatgptConversationUrl(job.chatgpt_conversation_url)
      };
    }
    if (job.status === "failed") {
      const thread = await fetchThread(config, id, job.thread_id);
      return {
        success: false,
        state: "failed",
        code: clean(job.error_code, 120) || "CHATGPT_BROWSER_JOB_FAILED",
        message: clean(job.error_message, 1000) || "The owner ChatGPT browser worker could not complete the discussion turn.",
        thread: publicThread(thread),
        job: publicJob(job)
      };
    }
    if (Date.now() >= deadline) {
      return { success: true, state: "pending", job: publicJob(job) };
    }
    await sleep(650);
  } while (true);
}

export async function readOwnerChatgptDiscussion({ userId, threadId } = {}) {
  const id = cleanUserId(userId);
  const tid = cleanUuid(threadId);
  const config = supabaseConfig();
  if (!id || !tid || !config) return { success: false, code: "CHATGPT_BROWSER_THREAD_INVALID", state: "failed" };

  const thread = await fetchThread(config, id, tid);
  if (!thread) return { success: false, code: "CHATGPT_BROWSER_THREAD_NOT_FOUND", state: "failed" };
  const jobs = await restSelect(config, JOB_TABLE, new URLSearchParams({
    select: "id,operation,status,message,response_text,chatgpt_conversation_url,error_code,error_message,created_at,completed_at",
    owner_user_id: `eq.${id}`,
    thread_id: `eq.${tid}`,
    order: "created_at.asc",
    limit: "24"
  }));

  return {
    success: true,
    state: "loaded",
    thread: publicThread(thread),
    transcript: (Array.isArray(jobs) ? jobs : []).map((job) => ({
      jobId: job.id,
      operation: job.operation,
      status: job.status,
      ariMessage: cleanMultiline(job.message, MAX_MESSAGE_CHARS),
      chatgptReply: cleanMultiline(job.response_text, MAX_RESPONSE_CHARS),
      errorCode: clean(job.error_code, 120) || null,
      createdAt: job.created_at || null,
      completedAt: job.completed_at || null
    }))
  };
}

export async function heartbeatChatgptBrowserWorker({
  ownerUserId,
  workerId,
  version,
  sessionState,
  status = "online"
} = {}) {
  const id = cleanUserId(ownerUserId);
  const wid = cleanWorkerId(workerId);
  const config = supabaseConfig();
  if (!id || !wid || !config) return false;
  const payload = {
    owner_user_id: id,
    worker_id: wid,
    version: clean(version, 80),
    session_state: normalizeSessionState(sessionState),
    status: clean(status, 40) || "online",
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const rows = await restUpsert(config, WORKER_TABLE, payload, "owner_user_id,worker_id");
  return Boolean(rows?.[0]?.worker_id || rows?.worker_id);
}

export async function claimNextChatgptBrowserJob({ ownerUserId, workerId } = {}) {
  const id = cleanUserId(ownerUserId);
  const wid = cleanWorkerId(workerId);
  const config = supabaseConfig();
  if (!id || !wid || !config) return null;

  const candidates = await restSelect(config, JOB_TABLE, new URLSearchParams({
    select: "id,thread_id,operation,message,attempts,created_at",
    owner_user_id: `eq.${id}`,
    status: "eq.queued",
    order: "created_at.asc",
    limit: "3"
  }));

  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const thread = await fetchThread(config, id, candidate.thread_id);
    if (!thread) continue;
    const leaseToken = randomUUID();
    const patch = {
      status: "running",
      worker_id: wid,
      lease_token: leaseToken,
      lease_expires_at: new Date(Date.now() + 150000).toISOString(),
      attempts: Math.max(0, Number(candidate.attempts || 0)) + 1,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const rows = await restPatch(config, JOB_TABLE, new URLSearchParams({
      id: `eq.${candidate.id}`,
      owner_user_id: `eq.${id}`,
      status: "eq.queued"
    }), patch);
    const claimed = rows?.[0] || null;
    if (!claimed?.id) continue;
    return {
      id: claimed.id,
      threadId: claimed.thread_id,
      operation: claimed.operation,
      message: cleanMultiline(claimed.message, MAX_MESSAGE_CHARS),
      leaseToken,
      conversationUrl: normalizeChatgptConversationUrl(thread.chatgpt_conversation_url),
      turnCount: Number(thread.turn_count || 0),
      maxTurns: MAX_THREAD_TURNS
    };
  }
  return null;
}

export async function completeChatgptBrowserJob({
  ownerUserId,
  workerId,
  jobId,
  leaseToken,
  success,
  responseText,
  conversationUrl,
  errorCode,
  errorMessage
} = {}) {
  const id = cleanUserId(ownerUserId);
  const wid = cleanWorkerId(workerId);
  const jid = cleanUuid(jobId);
  const lease = cleanUuid(leaseToken);
  const config = supabaseConfig();
  if (!id || !wid || !jid || !lease || !config) return { success: false, code: "CHATGPT_BROWSER_COMPLETION_INVALID" };

  const rows = await restSelect(config, JOB_TABLE, new URLSearchParams({
    select: "id,thread_id,status,worker_id,lease_token",
    id: `eq.${jid}`,
    owner_user_id: `eq.${id}`,
    worker_id: `eq.${wid}`,
    lease_token: `eq.${lease}`,
    status: "eq.running",
    limit: "1"
  }));
  const job = Array.isArray(rows) ? rows[0] || null : null;
  if (!job) return { success: false, code: "CHATGPT_BROWSER_JOB_LEASE_INVALID" };

  const normalizedUrl = normalizeChatgptConversationUrl(conversationUrl);
  const ok = success === true && Boolean(normalizedUrl) && Boolean(cleanMultiline(responseText, MAX_RESPONSE_CHARS));
  const now = new Date().toISOString();
  const updatedJobs = await restPatch(config, JOB_TABLE, new URLSearchParams({
    id: `eq.${jid}`,
    owner_user_id: `eq.${id}`,
    status: "eq.running",
    lease_token: `eq.${lease}`
  }), ok
    ? {
        status: "succeeded",
        response_text: cleanMultiline(responseText, MAX_RESPONSE_CHARS),
        chatgpt_conversation_url: normalizedUrl,
        completed_at: now,
        lease_expires_at: null,
        updated_at: now
      }
    : {
        status: "failed",
        error_code: clean(errorCode, 120) || "CHATGPT_BROWSER_JOB_FAILED",
        error_message: clean(errorMessage, 1000) || "The browser worker could not complete the discussion turn.",
        completed_at: now,
        lease_expires_at: null,
        updated_at: now
      });

  if (!updatedJobs?.[0]?.id) return { success: false, code: "CHATGPT_BROWSER_COMPLETION_RACE" };

  const thread = await fetchThread(config, id, job.thread_id);
  if (thread) {
    const nextTurns = ok ? Math.min(MAX_THREAD_TURNS, Number(thread.turn_count || 0) + 1) : Number(thread.turn_count || 0);
    await restPatch(config, THREAD_TABLE, new URLSearchParams({
      id: `eq.${thread.id}`,
      owner_user_id: `eq.${id}`
    }), ok
      ? {
          status: nextTurns >= MAX_THREAD_TURNS ? "paused" : "active",
          chatgpt_conversation_url: normalizedUrl,
          turn_count: nextTurns,
          last_error: null,
          last_activity_at: now,
          updated_at: now
        }
      : {
          status: String(errorCode || "") === "CHATGPT_LOGIN_REQUIRED" ? "paused" : thread.status,
          last_error: clean(errorMessage, 1000) || clean(errorCode, 120),
          last_activity_at: now,
          updated_at: now
        });
  }

  return { success: true, state: ok ? "completed" : "failed" };
}

async function fetchThread(config, userId, threadId) {
  const tid = cleanUuid(threadId);
  if (!tid) return null;
  const rows = await restSelect(config, THREAD_TABLE, new URLSearchParams({
    select: "id,owner_user_id,title,status,chatgpt_conversation_url,turn_count,last_error,last_activity_at,created_at,updated_at",
    id: `eq.${tid}`,
    owner_user_id: `eq.${userId}`,
    limit: "1"
  }));
  return Array.isArray(rows) ? rows[0] || null : null;
}

function publicThread(thread) {
  if (!thread) return null;
  return {
    id: thread.id || null,
    title: clean(thread.title, 160),
    status: clean(thread.status, 40),
    conversationUrl: normalizeChatgptConversationUrl(thread.chatgpt_conversation_url) || null,
    turnCount: Number(thread.turn_count || 0),
    maxTurns: MAX_THREAD_TURNS,
    lastError: clean(thread.last_error, 1000) || null,
    lastActivityAt: thread.last_activity_at || null,
    createdAt: thread.created_at || null,
    updatedAt: thread.updated_at || null
  };
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id || null,
    threadId: job.thread_id || null,
    operation: clean(job.operation, 40),
    status: clean(job.status, 40),
    errorCode: clean(job.error_code, 120) || null,
    createdAt: job.created_at || null,
    startedAt: job.started_at || null,
    completedAt: job.completed_at || null
  };
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 9000);
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

async function restSelect(config, table, params) {
  const response = await timedFetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    headers: serverHeaders(config.key)
  });
  if (!response.ok) return [];
  return response.json().catch(() => []);
}

async function restInsert(config, table, payload) {
  const response = await timedFetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: serverHeaders(config.key, { Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) return [];
  return response.json().catch(() => []);
}

async function restUpsert(config, table, payload, onConflict) {
  const params = new URLSearchParams({ on_conflict: onConflict });
  const response = await timedFetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    method: "POST",
    headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) return [];
  return response.json().catch(() => []);
}

async function restPatch(config, table, params, payload) {
  const response = await timedFetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    method: "PATCH",
    headers: serverHeaders(config.key, { Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) return [];
  return response.json().catch(() => []);
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSessionState(value) {
  const state = clean(value, 40).toLowerCase();
  return ["authenticated", "login_required", "unknown"].includes(state) ? state : "unknown";
}

function cleanWorkerId(value) {
  const text = clean(value, 120).toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,119}$/.test(text) ? text : "";
}

function cleanUserId(value) {
  const id = clean(value, 200).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

function cleanUuid(value) {
  const id = clean(value, 80).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value, max = 1000) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
