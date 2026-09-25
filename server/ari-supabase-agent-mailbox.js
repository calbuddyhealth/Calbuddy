// ARI Rebirth — server-only Supabase agent mailbox.
//
// Durable, auditable agent-to-agent messages live in Postgres. Browser clients
// never receive service-role credentials and never access the mailbox table
// directly. The table is append-only from application code.

import { createHash, randomUUID } from "node:crypto";

export const ARI_SUPABASE_MAILBOX_VERSION = "2.0.0";
export const ARI_SUPABASE_MAILBOX_TABLE = "ari_agent_mailbox_messages";

const MAX_MESSAGE_BYTES = 24_000;
const MAX_LIST = 100;
const SAFE_AGENT = /^[a-z0-9][a-z0-9_-]{1,47}$/;
const SAFE_KIND = new Set([
  "finding",
  "question",
  "answer",
  "experiment_result",
  "handoff",
  "ack",
  "status"
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_FIELD = /(authorization|api[-_]?key|secret|password|passwd|cookie|session[-_]?token|access[-_]?token|refresh[-_]?token|private[-_]?key)/i;
const SECRET_VALUE = /\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,}|eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/;

export function getSupabaseMailboxConfiguration() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 9000);
  const enabled = String(process.env.ARI_AGENT_MAILBOX_ENABLED || "true")
    .trim()
    .toLowerCase() !== "false";

  return {
    url,
    serviceRoleKey,
    table: ARI_SUPABASE_MAILBOX_TABLE,
    enabled,
    configured: Boolean(enabled && url && serviceRoleKey)
  };
}

export async function sendAgentMailboxMessage({
  userId,
  sender,
  recipient,
  kind = "finding",
  threadId = null,
  replyTo = null,
  subject = "",
  payload = {},
  metadata = {},
  fetchImpl = globalThis.fetch
} = {}) {
  const config = getSupabaseMailboxConfiguration();
  if (!config.configured) return unavailable();

  const ownerUserId = clean(userId, 120).toLowerCase();
  if (!UUID_PATTERN.test(ownerUserId)) {
    return {
      success: false,
      code: "AGENT_MAILBOX_USER_INVALID",
      message: "A valid owner user identity is required."
    };
  }

  const normalized = normalizeMessageInput({
    sender,
    recipient,
    kind,
    threadId,
    replyTo,
    subject,
    payload,
    metadata
  });
  if (!normalized.valid) {
    return {
      success: false,
      code: normalized.code,
      message: normalized.message
    };
  }

  const messageId = randomUUID();
  const effectiveThreadId = normalized.threadId || messageId;
  const createdAt = new Date().toISOString();
  const document = {
    schema: "ari.agent.mailbox.v2",
    version: ARI_SUPABASE_MAILBOX_VERSION,
    messageId,
    threadId: effectiveThreadId,
    replyTo: normalized.replyTo,
    sender: normalized.sender,
    recipient: normalized.recipient,
    kind: normalized.kind,
    subject: normalized.subject,
    createdAt,
    payload: normalized.payload,
    metadata: {
      ...normalized.metadata,
      transport: "supabase_postgres",
      immutable: true
    }
  };

  const serialized = JSON.stringify(document);
  const bytes = Buffer.byteLength(serialized, "utf8");
  if (bytes > MAX_MESSAGE_BYTES) {
    return {
      success: false,
      code: "AGENT_MAILBOX_MESSAGE_TOO_LARGE",
      message: `Mailbox messages are limited to ${MAX_MESSAGE_BYTES} bytes.`
    };
  }

  const sha256 = createHash("sha256").update(serialized).digest("hex");
  const response = await supabaseFetch(
    config,
    `/rest/v1/${config.table}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        id: messageId,
        user_id: ownerUserId,
        schema_version: "ari.agent.mailbox.v2",
        thread_id: effectiveThreadId,
        reply_to: normalized.replyTo,
        sender: normalized.sender,
        recipient: normalized.recipient,
        kind: normalized.kind,
        subject: normalized.subject,
        payload: normalized.payload,
        metadata: document.metadata,
        message_bytes: bytes,
        content_sha256: sha256,
        created_at: createdAt
      })
    },
    fetchImpl
  );

  if (!response.ok) {
    return {
      success: false,
      code: "AGENT_MAILBOX_WRITE_FAILED",
      message: response.message,
      status: response.status
    };
  }

  const row = Array.isArray(response.data) ? response.data[0] : response.data;
  return {
    success: true,
    version: ARI_SUPABASE_MAILBOX_VERSION,
    messageId,
    threadId: effectiveThreadId,
    sender: normalized.sender,
    recipient: normalized.recipient,
    kind: normalized.kind,
    subject: normalized.subject,
    createdAt: clean(row?.created_at, 120) || createdAt,
    sha256,
    bytes
  };
}

export async function listAgentMailboxMessages({
  userId,
  recipient = "",
  sender = "",
  kind = "",
  limit = 50,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = getSupabaseMailboxConfiguration();
  if (!config.configured) return unavailable();

  const ownerUserId = clean(userId, 120).toLowerCase();
  if (!UUID_PATTERN.test(ownerUserId)) {
    return {
      success: false,
      code: "AGENT_MAILBOX_USER_INVALID",
      message: "A valid owner user identity is required."
    };
  }

  const boundedLimit = Math.max(1, Math.min(MAX_LIST, Number(limit) || 50));
  const wantedRecipient = cleanAgentFilter(recipient);
  const wantedSender = cleanAgentFilter(sender);
  const wantedKind = clean(kind, 80).toLowerCase();
  if (wantedKind && !SAFE_KIND.has(wantedKind)) {
    return {
      success: false,
      code: "AGENT_MAILBOX_KIND_INVALID",
      message: "The mailbox message kind is unsupported."
    };
  }

  const params = new URLSearchParams({
    select: "id,thread_id,reply_to,sender,recipient,kind,subject,payload,metadata,message_bytes,content_sha256,created_at",
    user_id: `eq.${ownerUserId}`,
    order: "created_at.desc",
    limit: String(boundedLimit)
  });
  if (wantedRecipient) params.set("recipient", `eq.${wantedRecipient}`);
  if (wantedSender) params.set("sender", `eq.${wantedSender}`);
  if (wantedKind) params.set("kind", `eq.${wantedKind}`);

  const response = await supabaseFetch(
    config,
    `/rest/v1/${config.table}?${params.toString()}`,
    { method: "GET" },
    fetchImpl
  );

  if (!response.ok) {
    return {
      success: false,
      code: "AGENT_MAILBOX_LIST_FAILED",
      message: response.message,
      status: response.status
    };
  }

  const rows = Array.isArray(response.data) ? response.data : [];
  const messages = rows
    .map(rowToMessage)
    .filter(Boolean);

  return {
    success: true,
    version: ARI_SUPABASE_MAILBOX_VERSION,
    configured: true,
    count: messages.length,
    messages
  };
}

export async function readAgentMailboxMessage({
  userId,
  messageId,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = getSupabaseMailboxConfiguration();
  if (!config.configured) return unavailable();

  const ownerUserId = clean(userId, 120).toLowerCase();
  const id = clean(messageId, 120).toLowerCase();
  if (!UUID_PATTERN.test(ownerUserId) || !UUID_PATTERN.test(id)) {
    return {
      success: false,
      code: "AGENT_MAILBOX_MESSAGE_ID_INVALID",
      message: "The mailbox message identity is invalid."
    };
  }

  const params = new URLSearchParams({
    select: "id,thread_id,reply_to,sender,recipient,kind,subject,payload,metadata,message_bytes,content_sha256,created_at",
    user_id: `eq.${ownerUserId}`,
    id: `eq.${id}`,
    limit: "1"
  });
  const response = await supabaseFetch(
    config,
    `/rest/v1/${config.table}?${params.toString()}`,
    { method: "GET" },
    fetchImpl
  );

  if (!response.ok) {
    return {
      success: false,
      code: "AGENT_MAILBOX_READ_FAILED",
      message: response.message,
      status: response.status
    };
  }

  const row = Array.isArray(response.data) ? response.data[0] : null;
  const message = rowToMessage(row);
  if (!message) {
    return {
      success: false,
      code: "AGENT_MAILBOX_NOT_FOUND",
      message: "The mailbox message was not found.",
      status: 404
    };
  }

  return {
    success: true,
    version: ARI_SUPABASE_MAILBOX_VERSION,
    message
  };
}

export function mailboxStatus() {
  const config = getSupabaseMailboxConfiguration();
  return {
    success: true,
    version: ARI_SUPABASE_MAILBOX_VERSION,
    configured: config.configured,
    enabled: config.enabled,
    table: config.table,
    provider: "supabase_postgres",
    accessModel: "server_only_service_role",
    credentialsExposed: false
  };
}

function rowToMessage(row) {
  if (!row || typeof row !== "object") return null;
  const sender = normalizeAgent(row.sender);
  const recipient = normalizeAgent(row.recipient, { allowBroadcast: true });
  const kind = clean(row.kind, 80).toLowerCase();
  const messageId = clean(row.id, 120).toLowerCase();
  if (!UUID_PATTERN.test(messageId) || !sender || !recipient || !SAFE_KIND.has(kind)) return null;

  const payload = cloneSafeJson(row.payload);
  const metadata = cloneSafeJson(row.metadata);
  if (payload === null || metadata === null) return null;

  return {
    messageId,
    threadId: clean(row.thread_id, 120),
    replyTo: clean(row.reply_to, 120) || null,
    sender,
    recipient,
    kind,
    subject: clean(row.subject, 240),
    createdAt: clean(row.created_at, 120),
    payload,
    metadata,
    bytes: Number(row.message_bytes) || null,
    sha256: clean(row.content_sha256, 64) || null
  };
}

function normalizeMessageInput(input = {}) {
  const sender = normalizeAgent(input.sender);
  const recipient = normalizeAgent(input.recipient, { allowBroadcast: true });
  const kind = clean(input.kind, 80).toLowerCase();
  const threadId = clean(input.threadId, 120) || null;
  const replyTo = clean(input.replyTo, 120) || null;
  const subject = clean(input.subject, 240);

  if (!sender) {
    return { valid: false, code: "AGENT_MAILBOX_SENDER_INVALID", message: "A valid sender is required." };
  }
  if (!recipient) {
    return { valid: false, code: "AGENT_MAILBOX_RECIPIENT_INVALID", message: "A valid recipient is required." };
  }
  if (!SAFE_KIND.has(kind)) {
    return { valid: false, code: "AGENT_MAILBOX_KIND_INVALID", message: "The mailbox message kind is unsupported." };
  }

  const payload = cloneSafeJson(input.payload);
  const metadata = cloneSafeJson(input.metadata);
  if (payload === null || metadata === null) {
    return {
      valid: false,
      code: "AGENT_MAILBOX_PAYLOAD_INVALID",
      message: "Mailbox payloads must be JSON-safe and may not contain credential-like fields or values."
    };
  }

  return {
    valid: true,
    sender,
    recipient,
    kind,
    threadId,
    replyTo,
    subject,
    payload,
    metadata
  };
}

function cloneSafeJson(value) {
  try {
    const seen = new WeakSet();
    const sanitize = (item, depth = 0) => {
      if (depth > 8) throw new Error("too_deep");
      if (item === null || typeof item === "boolean" || typeof item === "number") return item;
      if (typeof item === "string") {
        const text = item.slice(0, 12_000);
        if (SECRET_VALUE.test(text)) throw new Error("secret_value");
        return text;
      }
      if (Array.isArray(item)) return item.slice(0, 120).map(entry => sanitize(entry, depth + 1));
      if (typeof item !== "object") throw new Error("unsupported");
      if (seen.has(item)) throw new Error("cycle");
      seen.add(item);
      const out = {};
      for (const [key, nested] of Object.entries(item).slice(0, 120)) {
        if (SECRET_FIELD.test(key)) throw new Error("secret_field");
        out[clean(key, 120)] = sanitize(nested, depth + 1);
      }
      return out;
    };
    return sanitize(value ?? {});
  } catch {
    return null;
  }
}

async function supabaseFetch(config, path, options, fetchImpl) {
  if (typeof fetchImpl !== "function") {
    return { ok: false, status: 503, message: "Supabase mailbox transport is unavailable.", data: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetchImpl(`${config.url}${path}`, {
      ...options,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: "application/json",
        ...(options?.headers || {})
      },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data,
      message: response.ok
        ? ""
        : clean(data?.message || data?.hint || data?.details || data?.error || `Supabase request failed with HTTP ${response.status}.`, 800)
    };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      data: null,
      message: error?.name === "AbortError" ? "Supabase mailbox request timed out." : "Supabase mailbox request failed."
    };
  } finally {
    clearTimeout(timeout);
  }
}

function unavailable() {
  return {
    success: false,
    code: "AGENT_MAILBOX_NOT_CONFIGURED",
    message: "The Supabase agent mailbox is not configured."
  };
}

function normalizeAgent(value, { allowBroadcast = false } = {}) {
  const text = clean(value, 48).toLowerCase();
  if (allowBroadcast && text === "broadcast") return text;
  return SAFE_AGENT.test(text) ? text : "";
}

function cleanAgentFilter(value) {
  const text = clean(value, 48).toLowerCase();
  if (!text) return "";
  if (text === "broadcast") return text;
  return SAFE_AGENT.test(text) ? text : "";
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
