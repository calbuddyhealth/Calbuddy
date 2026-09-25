import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_SUPABASE_MAILBOX_TABLE,
  getSupabaseMailboxConfiguration,
  listAgentMailboxMessages,
  mailboxStatus,
  readAgentMailboxMessage,
  sendAgentMailboxMessage
} from "../server/ari-supabase-agent-mailbox.js";
import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";

const OWNER_ID = "0b3b0f56-676f-4859-a9f4-b377dd73544f";
const MESSAGE_ID = "4ae1be6c-60fb-4b32-b2df-263f47afcc6d";

function configureMailbox() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "header.payload.signature";
  process.env.ARI_AGENT_MAILBOX_ENABLED = "true";
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  };
}

const ownerDeveloperRoute = {
  developer: true,
  intelligenceEntitlement: {
    ownerEligible: true,
    accountRole: "owner",
    accessClass: "owner"
  }
};

test("Supabase mailbox configuration exposes no credentials", () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    const config = getSupabaseMailboxConfiguration();
    assert.equal(config.configured, true);
    assert.equal(config.table, ARI_SUPABASE_MAILBOX_TABLE);

    const status = mailboxStatus();
    assert.equal(status.configured, true);
    assert.equal(status.provider, "supabase_postgres");
    assert.equal(status.table, "ari_agent_mailbox_messages");
    assert.equal(status.accessModel, "server_only");
    assert.equal(status.credentialsExposed, false);
    assert.equal(Object.hasOwn(status, "serviceRoleKey"), false);
  } finally {
    process.env = original;
  }
});

test("mailbox send writes one user-scoped row through Supabase REST", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let observed = null;

    const result = await sendAgentMailboxMessage({
      userId: OWNER_ID,
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "finding",
      subject: "Repository ownership",
      payload: { content: "The runtime controller owns the current transition." },
      fetchImpl: async (url, options) => {
        observed = { url, options };
        const body = JSON.parse(options.body);
        return response(201, [{ ...body, created_at: body.created_at }]);
      }
    });

    assert.equal(result.success, true);
    assert.match(observed.url, /\/rest\/v1\/ari_agent_mailbox_messages$/);
    assert.equal(observed.options.method, "POST");
    assert.equal(observed.options.headers.apikey, "header.payload.signature");
    assert.equal(observed.options.headers.Authorization, "Bearer header.payload.signature");
    assert.equal(observed.options.headers.Prefer, "return=representation");

    const body = JSON.parse(observed.options.body);
    assert.equal(body.user_id, OWNER_ID);
    assert.equal(body.sender, "sol-researcher");
    assert.equal(body.recipient, "ari-orchestrator");
    assert.equal(body.kind, "finding");
    assert.equal(body.schema_version, "ari.agent.mailbox.v2");
    assert.equal(body.payload.content, "The runtime controller owns the current transition.");
    assert.equal(body.metadata.transport, "supabase_postgres");
    assert.match(body.content_sha256, /^[0-9a-f]{64}$/);
    assert.ok(body.message_bytes > 0);
  } finally {
    process.env = original;
  }
});

test("modern Supabase secret keys are sent only as apikey", async () => {
  const original = { ...process.env };
  try {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test_key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.ARI_AGENT_MAILBOX_ENABLED = "true";

    let observed = null;
    const result = await sendAgentMailboxMessage({
      userId: OWNER_ID,
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "status",
      payload: { content: "Modern key compatibility." },
      fetchImpl: async (_url, options) => {
        observed = options;
        const body = JSON.parse(options.body);
        return response(201, [body]);
      }
    });

    assert.equal(result.success, true);
    assert.equal(observed.headers.apikey, "sb_secret_test_key");
    assert.equal(Object.hasOwn(observed.headers, "Authorization"), false);
  } finally {
    process.env = original;
  }
});

test("mailbox rejects credential-like payloads before Supabase is called", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let called = false;

    const result = await sendAgentMailboxMessage({
      userId: OWNER_ID,
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "finding",
      payload: { api_key: "should-never-leave" },
      fetchImpl: async () => {
        called = true;
        return response(201, []);
      }
    });

    assert.equal(result.success, false);
    assert.equal(result.code, "AGENT_MAILBOX_PAYLOAD_INVALID");
    assert.equal(called, false);
  } finally {
    process.env = original;
  }
});

test("mailbox list is user scoped and maps durable Supabase rows", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let observedUrl = "";

    const result = await listAgentMailboxMessages({
      userId: OWNER_ID,
      recipient: "ari-orchestrator",
      kind: "answer",
      limit: 10,
      fetchImpl: async (url) => {
        observedUrl = url;
        return response(200, [{
          id: MESSAGE_ID,
          thread_id: "thread-test",
          reply_to: null,
          sender: "sol-reviewer",
          recipient: "ari-orchestrator",
          kind: "answer",
          subject: "Review complete",
          payload: { content: "The candidate fix matches the observed source." },
          metadata: { transport: "supabase_postgres", immutable: true },
          message_bytes: 400,
          content_sha256: "a".repeat(64),
          created_at: "2026-09-25T04:30:00.000Z"
        }]);
      }
    });

    assert.equal(result.success, true);
    assert.equal(result.count, 1);
    assert.equal(result.messages[0].messageId, MESSAGE_ID);
    assert.equal(result.messages[0].sender, "sol-reviewer");
    assert.match(observedUrl, /user_id=eq%\.0b3b0f56-676f-4859-a9f4-b377dd73544f/);
    assert.match(observedUrl, /recipient=eq%\.ari-orchestrator/);
    assert.match(observedUrl, /kind=eq%\.answer/);
  } finally {
    process.env = original;
  }
});

test("mailbox read requires exact user and message UUIDs", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let called = false;

    const blocked = await readAgentMailboxMessage({
      userId: OWNER_ID,
      messageId: "../other-table/secret",
      fetchImpl: async () => {
        called = true;
        return response(200, []);
      }
    });

    assert.equal(blocked.success, false);
    assert.equal(blocked.code, "AGENT_MAILBOX_MESSAGE_ID_INVALID");
    assert.equal(called, false);

    const read = await readAgentMailboxMessage({
      userId: OWNER_ID,
      messageId: MESSAGE_ID,
      fetchImpl: async (url) => {
        assert.match(url, /id=eq%\.4ae1be6c-60fb-4b32-b2df-263f47afcc6d/);
        assert.match(url, /user_id=eq%\.0b3b0f56-676f-4859-a9f4-b377dd73544f/);
        return response(200, [{
          id: MESSAGE_ID,
          thread_id: "thread-test",
          reply_to: null,
          sender: "sol-reviewer",
          recipient: "ari-orchestrator",
          kind: "answer",
          subject: "Review complete",
          payload: { content: "Verified." },
          metadata: { transport: "supabase_postgres", immutable: true },
          message_bytes: 200,
          content_sha256: "b".repeat(64),
          created_at: "2026-09-25T04:30:00.000Z"
        }]);
      }
    });

    assert.equal(read.success, true);
    assert.equal(read.message.messageId, MESSAGE_ID);
  } finally {
    process.env = original;
  }
});

test("owner SOL exposes Supabase mailbox list/read/send tools", () => {
  const names = getAriTools(ownerDeveloperRoute).map(tool => tool.name);
  for (const name of [
    "owner_agent_mailbox_list",
    "owner_agent_mailbox_read",
    "owner_agent_mailbox_send"
  ]) {
    assert.ok(names.includes(name), name);
  }

  const ordinaryNames = getAriTools({
    developer: true,
    intelligenceEntitlement: {
      ownerEligible: false,
      accountRole: "user",
      accessClass: "premium"
    }
  }).map(tool => tool.name);
  assert.equal(ordinaryNames.includes("owner_agent_mailbox_send"), false);

  assert.equal(toolToApplicationAction("owner_agent_mailbox_list"), "agent_mailbox_list");
  assert.equal(toolToApplicationAction("owner_agent_mailbox_read"), "agent_mailbox_read");
  assert.equal(toolToApplicationAction("owner_agent_mailbox_send"), "agent_mailbox_send");

  const read = validateToolCall({
    name: "owner_agent_mailbox_read",
    arguments: JSON.stringify({ messageId: MESSAGE_ID })
  }, ownerDeveloperRoute);
  assert.equal(read.valid, true);
  assert.equal(read.arguments.messageId, MESSAGE_ID);

  const rejectedPath = validateToolCall({
    name: "owner_agent_mailbox_read",
    arguments: JSON.stringify({ path: "ari-agent-mailbox/messages/example.json" })
  }, ownerDeveloperRoute);
  assert.equal(rejectedPath.valid, false);

  const send = validateToolCall({
    name: "owner_agent_mailbox_send",
    arguments: JSON.stringify({
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "handoff",
      threadId: "",
      replyTo: "",
      subject: "Need verification",
      content: "Please independently verify the failing branch."
    })
  }, ownerDeveloperRoute);

  assert.equal(send.valid, true);
  assert.equal(send.arguments.kind, "handoff");
});
