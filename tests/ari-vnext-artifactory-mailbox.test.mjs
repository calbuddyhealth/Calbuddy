import assert from "node:assert/strict";
import test from "node:test";

import {
  getArtifactoryMailboxConfiguration,
  listAgentMailboxMessages,
  mailboxStatus,
  readAgentMailboxMessage,
  sendAgentMailboxMessage
} from "../server/ari-artifactory-mailbox.js";
import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";

function configureMailbox() {
  process.env.ARI_ARTIFACTORY_MAILBOX_ENABLED = "true";
  process.env.ARI_ARTIFACTORY_URL = "https://ari-test.jfrog.io";
  process.env.ARI_ARTIFACTORY_REPO = "ari-agent-mailbox-local";
  process.env.ARI_ARTIFACTORY_PREFIX = "ari-agent-mailbox";
  process.env.ARI_ARTIFACTORY_READ_TOKEN = "read-test-token";
  process.env.ARI_ARTIFACTORY_WRITE_TOKEN = "write-test-token";
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => typeof data === "string" ? data : JSON.stringify(data)
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

test("Artifactory mailbox configuration exposes no credentials", () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    const config = getArtifactoryMailboxConfiguration();
    assert.equal(config.configured, true);
    const status = mailboxStatus();
    assert.equal(status.configured, true);
    assert.equal(status.repository, "ari-agent-mailbox-local");
    assert.equal(status.prefix, "ari-agent-mailbox");
    assert.equal(status.credentialsExposed, false);
    assert.equal(Object.hasOwn(status, "readToken"), false);
    assert.equal(Object.hasOwn(status, "writeToken"), false);
  } finally {
    process.env = original;
  }
});

test("mailbox send writes only to the configured repository and prefix", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let observed = null;
    const result = await sendAgentMailboxMessage({
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "finding",
      subject: "Repository ownership",
      payload: { content: "The runtime controller owns the current transition." },
      fetchImpl: async (url, options) => {
        observed = { url, options };
        return response(201, { repo: "ari-agent-mailbox-local" });
      }
    });

    assert.equal(result.success, true);
    assert.match(observed.url, /^https:\/\/ari-test\.jfrog\.io\/artifactory\/ari-agent-mailbox-local\/ari-agent-mailbox\/messages\//);
    assert.equal(observed.options.method, "PUT");
    assert.equal(observed.options.headers.Authorization, "Bearer write-test-token");
    assert.equal(observed.options.headers["Content-Type"], "application/json; charset=utf-8");
    const body = JSON.parse(observed.options.body);
    assert.equal(body.schema, "ari.agent.mailbox.v1");
    assert.equal(body.sender, "sol-researcher");
    assert.equal(body.recipient, "ari-orchestrator");
    assert.equal(body.payload.content, "The runtime controller owns the current transition.");
  } finally {
    process.env = original;
  }
});

test("mailbox rejects credential-like payloads before network access", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    let called = false;
    const result = await sendAgentMailboxMessage({
      sender: "sol-researcher",
      recipient: "ari-orchestrator",
      kind: "finding",
      payload: { api_key: "should-never-leave" },
      fetchImpl: async () => {
        called = true;
        return response(201, {});
      }
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "ARTIFACTORY_MAILBOX_PAYLOAD_INVALID");
    assert.equal(called, false);
  } finally {
    process.env = original;
  }
});

test("mailbox list and read stay inside the configured message prefix", async () => {
  const original = { ...process.env };
  try {
    configureMailbox();
    const path = "ari-agent-mailbox/messages/2026/09/24/example.json";
    const stored = {
      schema: "ari.agent.mailbox.v1",
      version: "1.0.0",
      messageId: "msg-test",
      threadId: "thread-test",
      replyTo: null,
      sender: "sol-reviewer",
      recipient: "ari-orchestrator",
      kind: "answer",
      subject: "Review complete",
      createdAt: "2026-09-24T20:30:00.000Z",
      payload: { content: "The candidate fix is consistent with the observed source." },
      metadata: { transport: "jfrog_artifactory" }
    };

    const urls = [];
    const fetchImpl = async (url, options) => {
      urls.push({ url, options });
      if (url.includes("/api/storage/")) {
        return response(200, {
          files: [{
            uri: "/2026/09/24/example.json",
            folder: false,
            size: 400,
            lastModified: "2026-09-24T20:30:00.000Z"
          }]
        });
      }
      return response(200, stored);
    };

    const list = await listAgentMailboxMessages({
      recipient: "ari-orchestrator",
      limit: 10,
      fetchImpl
    });
    assert.equal(list.success, true);
    assert.equal(list.count, 1);
    assert.equal(list.messages[0].messageId, "msg-test");
    assert.equal(list.messages[0].path, path);
    assert.equal(urls[0].options.headers.Authorization, "Bearer read-test-token");

    let traversalCalled = false;
    const blocked = await readAgentMailboxMessage({
      path: "../other-repo/secret.json",
      fetchImpl: async () => {
        traversalCalled = true;
        return response(200, {});
      }
    });
    assert.equal(blocked.success, false);
    assert.equal(blocked.code, "ARTIFACTORY_MAILBOX_PATH_INVALID");
    assert.equal(traversalCalled, false);
  } finally {
    process.env = original;
  }
});

test("owner SOL exposes bounded mailbox list/read/send tools", () => {
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

  const validated = validateToolCall({
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

  assert.equal(validated.valid, true);
  assert.equal(validated.arguments.kind, "handoff");
});
