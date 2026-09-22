import test from "node:test";
import assert from "node:assert/strict";
import { persistAriActionProposal } from "../api/_lib/ari-vnext/action-ledger.js";

function withLedgerEnv(t) {
  const prior = {
    url: process.env.SUPABASE_URL,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret: process.env.SUPABASE_SECRET_KEY
  };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  delete process.env.SUPABASE_SECRET_KEY;
  t.after(() => {
    if (prior.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prior.url;
    if (prior.serviceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prior.serviceRole;
    if (prior.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = prior.secret;
  });
}

const pending = {
  id: "vnext-action-1",
  name: "plan_workout",
  arguments: {
    dateText: "today",
    focus: "chest",
    exercises: [{ exerciseId: "barbell_bench_press", name: "Barbell Bench Press", sets: 3, reps: 10 }]
  },
  sourceTurnId: "turn-1",
  sourceMessage: "Create a chest workout for today",
  expiresAt: "2026-09-22T23:59:00.000Z"
};

test("server persists a proposed vNext mutation before it can be confirmed", async (t) => {
  withLedgerEnv(t);
  let captured = null;
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    captured = { url: String(url), options, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 201,
      json: async () => [{ id: "ledger-1", status: "proposed", vnext_action_id: pending.id, source_turn_id: pending.sourceTurnId }]
    };
  });

  const result = await persistAriActionProposal({ userId: "user-1", pendingAction: pending });

  assert.equal(result.stored, true);
  assert.equal(result.required, true);
  assert.equal(result.id, "ledger-1");
  assert.match(captured.url, /ai_app_actions/);
  assert.equal(captured.body.user_id, "user-1");
  assert.equal(captured.body.action_type, "plan_workout");
  assert.equal(captured.body.status, "proposed");
  assert.equal(captured.body.vnext_action_id, pending.id);
  assert.equal(captured.body.source_turn_id, pending.sourceTurnId);
  assert.deepEqual(captured.body.vnext_pending_action.arguments.exercises[0], pending.arguments.exercises[0]);
});

test("a replay conflict resolves to the existing durable action instead of creating another action", async (t) => {
  withLedgerEnv(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, options = {}) => {
    calls += 1;
    if (options.method === "POST") {
      return { ok: false, status: 409, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => [{ id: "ledger-existing", status: "pending", vnext_action_id: pending.id, source_turn_id: pending.sourceTurnId }]
    };
  });

  const result = await persistAriActionProposal({ userId: "user-1", pendingAction: pending });

  assert.equal(calls, 2);
  assert.equal(result.stored, true);
  assert.equal(result.duplicate, true);
  assert.equal(result.id, "ledger-existing");
});

test("ordinary non-action turns do not require the action ledger", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    throw new Error("fetch should not run");
  });

  const result = await persistAriActionProposal({ userId: "user-1", pendingAction: null });

  assert.equal(result.stored, false);
  assert.equal(result.required, false);
  assert.equal(calls, 0);
});


test("experiment confirmations do not create orphaned app-action ledger rows", async (t) => {
  withLedgerEnv(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    throw new Error("fetch should not run");
  });

  const result = await persistAriActionProposal({
    userId: "user-1",
    pendingAction: { ...pending, id: "experiment-1", name: "track_experiment" }
  });

  assert.equal(result.required, false);
  assert.equal(result.reason, "separate_trusted_executor");
  assert.equal(calls, 0);
});


test("server action ledger accepts the current Supabase secret key when the legacy service-role variable is absent", async (t) => {
  const prior = {
    url: process.env.SUPABASE_URL,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret: process.env.SUPABASE_SECRET_KEY
  };
  process.env.SUPABASE_URL = "https://example.supabase.co";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SECRET_KEY = "test-secret-key";
  t.after(() => {
    if (prior.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prior.url;
    if (prior.serviceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prior.serviceRole;
    if (prior.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = prior.secret;
  });

  let authorization = "";
  t.mock.method(globalThis, "fetch", async (_url, options = {}) => {
    authorization = String(options?.headers?.Authorization || "");
    return {
      ok: true,
      status: 201,
      json: async () => [{ id: "ledger-secret", status: "proposed", vnext_action_id: pending.id, source_turn_id: pending.sourceTurnId }]
    };
  });

  const result = await persistAriActionProposal({ userId: "user-1", pendingAction: pending });

  assert.equal(result.stored, true);
  assert.equal(result.id, "ledger-secret");
  assert.equal(authorization, "Bearer test-secret-key");
});
