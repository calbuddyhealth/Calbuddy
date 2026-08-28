import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { verifyOwnerRequest } from "../server/ari-owner-auth.js";
import editHandler from "../api/ari-github-edit.js";
import readHandler from "../api/ari-github-read.js";

const OWNER_ID = "0b3b0f56-676f-4859-a9f4-b377dd73544f";
const OWNER_EMAIL = "onofreerostico@yahoo.com";

function configureOwnerEnvironment() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "publishable-test-key";
  process.env.ARI_OWNER_USER_ID = OWNER_ID;
  process.env.ARI_OWNER_EMAIL = OWNER_EMAIL;
}

function makeRequest(token = "", body = {}) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body
  };
}

function mockSupabaseUser(user, status = 200) {
  return async (_url, options) => {
    assert.equal(options.method, "GET");
    assert.equal(options.headers.apikey, "publishable-test-key");
    assert.match(options.headers.Authorization, /^Bearer /);

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => user
    };
  };
}

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("ARI owner authorization", async (t) => {
  const originalEnvironment = { ...process.env };

  t.after(() => {
    process.env = originalEnvironment;
  });

  await t.test("rejects a client owner_access flag without a JWT", async () => {
    configureOwnerEnvironment();

    const result = await verifyOwnerRequest(
      makeRequest("", { owner_access: true }),
      {
        fetchImpl: async () => {
          throw new Error("Supabase must not be called without a JWT");
        }
      }
    );

    assert.equal(result.authorized, false);
    assert.equal(result.status, 401);
    assert.equal(result.code, "OWNER_AUTH_REQUIRED");
  });

  await t.test("accepts the verified owner UUID and email", async () => {
    configureOwnerEnvironment();

    const result = await verifyOwnerRequest(makeRequest("valid-token"), {
      fetchImpl: mockSupabaseUser({ id: OWNER_ID, email: OWNER_EMAIL })
    });

    assert.equal(result.authorized, true);
    assert.equal(result.mode, "supabase_verified_owner");
    assert.equal(result.user.id, OWNER_ID);
  });

  await t.test("rejects a different authenticated user", async () => {
    configureOwnerEnvironment();

    const result = await verifyOwnerRequest(makeRequest("valid-token"), {
      fetchImpl: mockSupabaseUser({
        id: "7a8d11b9-b6db-4514-a9f0-31efbfbd1898",
        email: "someone@example.com"
      })
    });

    assert.equal(result.authorized, false);
    assert.equal(result.status, 403);
    assert.equal(result.code, "OWNER_ACCESS_DENIED");
  });

  await t.test("rejects an owner UUID with the wrong configured email", async () => {
    configureOwnerEnvironment();

    const result = await verifyOwnerRequest(makeRequest("valid-token"), {
      fetchImpl: mockSupabaseUser({
        id: OWNER_ID,
        email: "changed@example.com"
      })
    });

    assert.equal(result.authorized, false);
    assert.equal(result.status, 403);
  });

  await t.test("rejects an invalid or expired Supabase JWT", async () => {
    configureOwnerEnvironment();

    const result = await verifyOwnerRequest(makeRequest("expired-token"), {
      fetchImpl: mockSupabaseUser({}, 401)
    });

    assert.equal(result.authorized, false);
    assert.equal(result.status, 401);
    assert.equal(result.code, "OWNER_AUTH_INVALID");
  });

  await t.test("fails closed when the owner UUID is not configured", async () => {
    configureOwnerEnvironment();
    delete process.env.ARI_OWNER_USER_ID;

    const result = await verifyOwnerRequest(makeRequest("valid-token"), {
      fetchImpl: mockSupabaseUser({ id: OWNER_ID, email: OWNER_EMAIL })
    });

    assert.equal(result.authorized, false);
    assert.equal(result.status, 500);
    assert.equal(result.code, "OWNER_AUTH_NOT_CONFIGURED");
  });
});

test("GitHub APIs contain no client owner_access authorization fallback", async () => {
  const apiFiles = [
    "api/ari-github-read.js",
    "api/ari-github-edit.js"
  ];

  for (const relativePath of apiFiles) {
    const source = await readFile(
      new URL(`../${relativePath}`, import.meta.url),
      "utf8"
    );

    assert.doesNotMatch(source, /\bowner_access\b/);
    assert.match(source, /verifyOwnerRequest/);
  }
});

test("GitHub APIs reject a forged owner_access body before GitHub is called", async () => {
  configureOwnerEnvironment();

  for (const handler of [readHandler, editHandler]) {
    const response = makeResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: { owner_access: true }
      },
      response
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.payload.success, false);
    assert.equal(response.payload.code, "OWNER_AUTH_REQUIRED");
  }
});

test("verified owner status reuses the GitHub read function", async () => {
  configureOwnerEnvironment();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = mockSupabaseUser({
    id: OWNER_ID,
    email: OWNER_EMAIL
  });

  try {
    const response = makeResponse();

    await readHandler(
      {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        body: {}
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.success, true);
    assert.equal(response.payload.isOwner, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Vercel API surface matches the reviewed ARI XP release contract", async () => {
  const entries = await readdir(new URL("../api/", import.meta.url), {
    withFileTypes: true
  });
  const functionFiles = entries
    .filter(entry => entry.isFile() && /\.(?:js|mjs|cjs|ts)$/i.test(entry.name))
    .map(entry => entry.name)
    .sort();

  // Public compatibility routes such as /api/ari-intent-router, /api/ask-calbuddy,
  // and /api/usage are Vercel rewrites into secure-ai-gateway. Only actual
  // serverless entry-point files belong in this reviewed allowlist.
  const reviewed = [
    "ari-circle-moderation.js",
    "ari-circle-push-dispatch.js",
    "ari-conversation.js",
    "ari-food-search.js",
    "ari-github-edit.js",
    "ari-github-read.js",
    "ari-owner-intelligence-controls.js",
    "ari-owner-observability.js",
    "ari-signals-scan.js",
    "ari-signals.js",
    "ari-vnext-circle-context-bridge.js",
    "ari-vnext-circle-context.js",
    "ari-vnext-experiments.js",
    "ari-vnext-expert.js",
    "ari-vnext-growth.js",
    "ari-vnext-initiative.js",
    "ari-vnext-knowledge.js",
    "ari-vnext-peer.js",
    "ari-vnext-runtime-self-test.js",
    "ari-vnext.js",
    "image-analyze.js",
    "knowledge.js",
    "memory.js",
    "profile.js",
    "secure-ai-gateway.js"
  ].sort();

  assert.deepEqual(
    functionFiles,
    reviewed,
    `Unexpected Vercel API surface. Reviewed ${reviewed.length} functions; found: ${functionFiles.join(", ")}`
  );

  const names = new Set(functionFiles);
  assert.equal(names.has("secure-ai-gateway.js"), true, "compatibility AI routes must remain behind the secure gateway");
  assert.equal(names.has("ari-vnext.js"), true, "vNext primary runtime must remain present");
  assert.equal(names.has("ari-owner-intelligence-controls.js"), true, "owner intelligence controls must remain explicit server API surface");
  assert.equal(names.has("ari-owner-observability.js"), true, "owner observability must remain explicit reviewed server API surface");
  assert.equal(names.has("ari-circle-push-dispatch.js"), true, "Circle native push dispatcher must remain explicit reviewed server API surface");
  assert.equal(names.has("ari-vnext-circle-context-bridge.js"), true, "ARI Next context transport bridge must remain explicit reviewed server API surface");

  for (const removed of [
    "actions.js",
    "ari-create-knowledge-node.js",
    "ari-embed-knowledge.js",
    "ari-github-search.js",
    "ari-intent-router.js",
    "ask-calbuddy.js",
    "usage.js"
  ]) {
    assert.equal(names.has(removed), false, `${removed} should remain removed as a direct serverless file`);
  }
});

test("homepage no longer forces owner mode for every signed-in user", async () => {
  const source = await readFile(
    new URL("../js/home.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /ownerMode\s*:\s*true/);
});
