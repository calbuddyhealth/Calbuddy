import assert from "node:assert/strict";
import test from "node:test";

import handler from "../api/ari-signals.js";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: null,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { return this; },
    header(name) { return headers.get(String(name).toLowerCase()); }
  };
}

function jsonResponse(status, value) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return value; }
  };
}

function configureEnv() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";
  process.env.ARI_OWNER_USER_ID = OWNER_ID;
  process.env.ARI_OWNER_EMAIL = "owner@example.com";
}

test("Ari Signals rejects an authenticated non-owner", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/auth\/v1\/user$/);
    return jsonResponse(200, { id: OTHER_ID, email: "other@example.com" });
  };

  try {
    const req = { method: "GET", headers: { authorization: "Bearer valid-session" } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body?.code, "OWNER_ACCESS_DENIED");
    assert.equal(res.header("x-ari-signals-mode"), "owner-only");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Ari Signals owner feed ranks actionable workflow signals", async () => {
  configureEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.endsWith("/auth/v1/user")) {
      return jsonResponse(200, { id: OWNER_ID, email: "owner@example.com" });
    }
    if (href.includes("/rest/v1/ari_vnext_initiative_events")) {
      return jsonResponse(200, [{
        id: "signal-1",
        user_id: OWNER_ID,
        initiative_key: "meal-log-retry",
        reason_id: "tool_log_failed_retry",
        priority: "high",
        status: "surfaced",
        payload: {
          opener: "Meal logging needs a retry.",
          followUpPrompt: "Retry the meal log?",
          action: "retry_log",
          domain: "meals"
        },
        surfaced_at: new Date().toISOString(),
        engaged_at: null,
        dismissed_at: null,
        expires_at: null,
        updated_at: new Date().toISOString()
      }]);
    }
    if (href.includes("/rest/v1/ari_signal_preferences")) {
      return jsonResponse(200, []);
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  try {
    const req = { method: "GET", headers: { authorization: "Bearer owner-session" } };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.ownerMode, true);
    assert.equal(res.body?.version, "2.0.0-owner");
    assert.equal(res.body?.signals?.length, 1);
    assert.equal(res.body.signals[0].category, "workflow");
    assert.equal(res.body.signals[0].ownerOnly, true);
    assert.equal(res.body.signals[0].actionable, true);
    assert.equal(res.body.signals[0].attention, "act_now");
    assert.equal(res.body.attentionCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
