// ARI Rebirth — bounded JFrog Artifactory agent mailbox.
//
// This module intentionally exposes only one configured Generic repository and
// one configured prefix. Callers cannot choose a JFrog host, repository, token,
// or arbitrary path.

import { createHash, randomUUID } from "node:crypto";

export const ARI_ARTIFACTORY_MAILBOX_VERSION = "1.0.0";

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
const SECRET_FIELD = /(authorization|api[-_]?key|secret|password|passwd|cookie|session[-_]?token|access[-_]?token|refresh[-_]?token|private[-_]?key)/i;
const SECRET_VALUE = /\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,}|eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/;

export function getArtifactoryMailboxConfiguration() {
  const root = clean(process.env.ARI_ARTIFACTORY_URL, 1200).replace(/\/+$/, "");
  const repository = clean(process.env.ARI_ARTIFACTORY_REPO, 160);
  const prefix = normalizePrefix(process.env.ARI_ARTIFACTORY_PREFIX || "ari-agent-mailbox");
  const readToken = clean(
    process.env.ARI_ARTIFACTORY_READ_TOKEN ||
      process.env.ARI_ARTIFACTORY_TOKEN,
    9000
  );
  const writeToken = clean(
    process.env.ARI_ARTIFACTORY_WRITE_TOKEN ||
      process.env.ARI_ARTIFACTORY_TOKEN,
    9000
  );
  const enabled = String(process.env.ARI_ARTIFACTORY_MAILBOX_ENABLED || "true")
    .trim()
    .toLowerCase() !== "false";
  const artifactoryBase = root
    ? (/\/artifactory$/i.test(root) ? root : `${root}/artifactory`)
    : "";

  return {
    root,
    artifactoryBase,
    repository,
    prefix,
    readToken,
    writeToken,
    enabled,
    configured: Boolean(
      enabled &&
      artifactoryBase &&
      /^[A-Za-z0-9._-]{1,160}$/.test(repository) &&
      prefix &&
      readToken &&
      writeToken
    )
  };
}

export async function sendAgentMailboxMessage({
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
  const config = getArtifactoryMailboxConfiguration();
  if (!config.configured) return unavailable();

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

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10).replaceAll("-", "/");
  const filename = `${createdAt.replace(/[:.]/g, "-")}__${normalized.sender}__to__${normalized.recipient}__${id}.json`;
  const path = `${config.prefix}/messages/${day}/${filename}`;
  const document = {
    schema: "ari.agent.mailbox.v1",
    version: ARI_ARTIFACTORY_MAILBOX_VERSION,
    messageId: id,
    threadId: normalized.threadId || id,
    replyTo: normalized.replyTo,
    sender: normalized.sender,
    recipient: normalized.recipient,
    kind: normalized.kind,
    subject: normalized.subject,
    createdAt,
    payload: normalized.payload,
    metadata: {
      ...normalized.metadata,
      transport: "jfrog_artifactory",
      immutable: true
    }
  };

  const body = JSON.stringify(document, null, 2);
  const bytes = Buffer.byteLength(body, "utf8");
  if (bytes > MAX_MESSAGE_BYTES) {
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_MESSAGE_TOO_LARGE",
      message: `Mailbox messages are limited to ${MAX_MESSAGE_BYTES} bytes.`
    };
  }

  const sha256 = createHash("sha256").update(body).digest("hex");
  const response = await mailboxFetch(
    `${config.artifactoryBase}/${encodeURIComponent(config.repository)}/${encodePath(path)}`,
    config.writeToken,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Checksum-Sha256": sha256
      },
      body
    },
    fetchImpl
  );

  if (!response.ok) {
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_WRITE_FAILED",
      message: response.message,
      status: response.status
    };
  }

  return {
    success: true,
    version: ARI_ARTIFACTORY_MAILBOX_VERSION,
    messageId: id,
    threadId: document.threadId,
    sender: document.sender,
    recipient: document.recipient,
    kind: document.kind,
    subject: document.subject,
    createdAt,
    path,
    sha256,
    bytes
  };
}

export async function listAgentMailboxMessages({
  recipient = "",
  sender = "",
  kind = "",
  limit = 50,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = getArtifactoryMailboxConfiguration();
  if (!config.configured) return unavailable();

  const boundedLimit = Math.max(1, Math.min(MAX_LIST, Number(limit) || 50));
  const listRoot = `${config.prefix}/messages`;
  const url =
    `${config.artifactoryBase}/api/storage/${encodeURIComponent(config.repository)}/${encodePath(listRoot)}` +
    "?list&deep=1&listFolders=0";

  const response = await mailboxFetch(url, config.readToken, { method: "GET" }, fetchImpl);
  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: true,
        version: ARI_ARTIFACTORY_MAILBOX_VERSION,
        configured: true,
        messages: [],
        count: 0
      };
    }
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_LIST_FAILED",
      message: response.message,
      status: response.status
    };
  }

  const wantedRecipient = cleanAgentFilter(recipient);
  const wantedSender = cleanAgentFilter(sender);
  const wantedKind = clean(kind, 80).toLowerCase();

  const candidates = (Array.isArray(response.data?.files) ? response.data.files : [])
    .filter(item => item && item.folder !== true && String(item.uri || "").endsWith(".json"))
    .map(item => ({
      path: `${listRoot}${String(item.uri || "").startsWith("/") ? "" : "/"}${String(item.uri || "")}`,
      size: Number(item.size) || null,
      lastModified: clean(item.lastModified, 120) || null
    }))
    .sort((a, b) => String(b.lastModified || "").localeCompare(String(a.lastModified || "")))
    .slice(0, Math.max(boundedLimit * 3, boundedLimit));

  const messages = [];
  for (const item of candidates) {
    if (messages.length >= boundedLimit) break;
    const read = await readAgentMailboxMessage({ path: item.path, fetchImpl });
    if (!read.success) continue;
    const message = read.message;
    if (wantedRecipient && message.recipient !== wantedRecipient) continue;
    if (wantedSender && message.sender !== wantedSender) continue;
    if (wantedKind && message.kind !== wantedKind) continue;
    messages.push({
      ...message,
      path: item.path,
      size: item.size
    });
  }

  return {
    success: true,
    version: ARI_ARTIFACTORY_MAILBOX_VERSION,
    configured: true,
    count: messages.length,
    messages
  };
}

export async function readAgentMailboxMessage({
  path,
  fetchImpl = globalThis.fetch
} = {}) {
  const config = getArtifactoryMailboxConfiguration();
  if (!config.configured) return unavailable();

  const safePath = normalizeMessagePath(path, config.prefix);
  if (!safePath) {
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_PATH_INVALID",
      message: "The mailbox message path is invalid."
    };
  }

  const response = await mailboxFetch(
    `${config.artifactoryBase}/${encodeURIComponent(config.repository)}/${encodePath(safePath)}`,
    config.readToken,
    { method: "GET" },
    fetchImpl,
    { parseJson: true }
  );
  if (!response.ok) {
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_READ_FAILED",
      message: response.message,
      status: response.status
    };
  }

  const message = sanitizeStoredMessage(response.data);
  if (!message) {
    return {
      success: false,
      code: "ARTIFACTORY_MAILBOX_DOCUMENT_INVALID",
      message: "The stored mailbox document is not a valid ARI message."
    };
  }

  return {
    success: true,
    version: ARI_ARTIFACTORY_MAILBOX_VERSION,
    path: safePath,
    message
  };
}

export function mailboxStatus() {
  const config = getArtifactoryMailboxConfiguration();
  return {
    success: true,
    version: ARI_ARTIFACTORY_MAILBOX_VERSION,
    configured: config.configured,
    enabled: config.enabled,
    repository: config.repository || null,
    prefix: config.prefix || null,
    provider: "jfrog_artifactory",
    credentialsExposed: false
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
    return { valid: false, code: "ARTIFACTORY_MAILBOX_SENDER_INVALID", message: "A valid sender is required." };
  }
  if (!recipient) {
    return { valid: false, code: "ARTIFACTORY_MAILBOX_RECIPIENT_INVALID", message: "A valid recipient is required." };
  }
  if (!SAFE_KIND.has(kind)) {
    return { valid: false, code: "ARTIFACTORY_MAILBOX_KIND_INVALID", message: "The mailbox message kind is unsupported." };
  }

  const payload = cloneSafeJson(input.payload);
  const metadata = cloneSafeJson(input.metadata);
  if (payload === null || metadata === null) {
    return {
      valid: false,
      code: "ARTIFACTORY_MAILBOX_PAYLOAD_INVALID",
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

function sanitizeStoredMessage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.schema !== "ari.agent.mailbox.v1") return null;
  const sender = normalizeAgent(value.sender);
  const recipient = normalizeAgent(value.recipient, { allowBroadcast: true });
  const kind = clean(value.kind, 80).toLowerCase();
  if (!sender || !recipient || !SAFE_KIND.has(kind)) return null;
  const payload = cloneSafeJson(value.payload);
  const metadata = cloneSafeJson(value.metadata);
  if (payload === null || metadata === null) return null;
  return {
    messageId: clean(value.messageId, 120),
    threadId: clean(value.threadId, 120),
    replyTo: clean(value.replyTo, 120) || null,
    sender,
    recipient,
    kind,
    subject: clean(value.subject, 240),
    createdAt: clean(value.createdAt, 120),
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

async function mailboxFetch(url, token, options, fetchImpl, { parseJson = true } = {}) {
  if (typeof fetchImpl !== "function") {
    return { ok: false, status: 503, message: "Artifactory transport is unavailable.", data: null };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetchImpl(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {})
      },
      signal: controller.signal
    });
    const data = parseJson
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      data,
      message: response.ok
        ? ""
        : clean(data?.message || data?.errors?.[0]?.message || data?.error || `Artifactory request failed with HTTP ${response.status}.`, 800)
    };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      data: null,
      message: error?.name === "AbortError" ? "Artifactory request timed out." : "Artifactory request failed."
    };
  } finally {
    clearTimeout(timeout);
  }
}

function unavailable() {
  return {
    success: false,
    code: "ARTIFACTORY_MAILBOX_NOT_CONFIGURED",
    message: "The Artifactory agent mailbox is not configured."
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

function normalizePrefix(value) {
  const text = clean(value, 320)
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
  if (!text || text.includes("..")) return "";
  if (!/^[A-Za-z0-9._/-]+$/.test(text)) return "";
  return text;
}

function normalizeMessagePath(value, prefix) {
  const text = clean(value, 700)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");
  const root = `${prefix}/messages/`;
  if (!text.startsWith(root) || text.includes("..") || !text.endsWith(".json")) return "";
  return text;
}

function encodePath(path = "") {
  return String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
