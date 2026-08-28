import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ARI_DECISION_TRACE_VERSION,
  assertSanitizedDecisionTrace,
  buildAriDecisionTrace,
  buildAriFailureTrace
} from "../api/_lib/ari-vnext/decision-trace.js";
import {
  ARI_OBSERVABILITY_STORE_VERSION,
  recordAriObservabilityTurn,
  toObservabilityRow
} from "../api/_lib/ari-vnext/observability-store.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const orchestrator = await read("api/_lib/ari-vnext/orchestrator.js");
const migration = await read("supabase/migrations/20260828044500_ari_observability_turns.sql");

function routineResult() {
  return {
    success: true,
    ready: true,
    source: "ari_vnext_routine_action_proposal",
    route: { nutrition: true, nutritionLogging: true },
    modelPolicy: {
      model: "gpt-5.6-luna",
      routingClass: "nutrition_logging",
      mode: "standard",
      reasoningEffort: "low",
      fastEligible: true
    },
    provider: { model: "gpt-5.6-luna" },
    observabilityContextBudget: {
      profile: "focused",
      historyBefore: 9,
      historyAfter: 4,
      referenceHistoryFloorApplied: false,
      canonicalStatePreserved: true,
      referenceStatePreserved: true
    },
    semanticActionReview: {
      decision: "propose_log_meal",
      confidence: 1,
      model: null
    },
    pendingAction: { id: "pending_safe", name: "log_meal" },
    action: {
      type: "proposed_action",
      applicationAction: "log_meal",
      arguments: { privateFoodPayload: "must-not-enter-trace" }
    },
    optimizationTrace: {
      callCount: 1,
      avoidedCallCount: 1,
      failedCallCount: 0,
      modelLatencyMs: 120,
      usage: { total_tokens: 400 },
      costEstimate: { usd: 0.001 }
    },
    performanceBudget: { status: "pass", turnClass: "routine_log" },
    reply: "This text must never enter the trace."
  };
}

test("Phase 11A builds an explainable trace without prompt, reply, arguments, memory, or hidden reasoning", () => {
  const trace = buildAriDecisionTrace({
    turn: {
      turnId: "turn_11a",
      conversationId: "conversation_11a",
      message: "Log my secret meal description.",
      memory: "private memory payload",
      context: { userWorldModel: { private: true } }
    },
    result: routineResult()
  });

  assert.equal(trace.version, ARI_DECISION_TRACE_VERSION);
  assert.deepEqual(trace.route.activeDomains, ["nutrition"]);
  assert.equal(trace.model.routingClass, "nutrition_logging");
  assert.equal(trace.context.profile, "focused");
  assert.equal(trace.authorization.mode, "deterministic");
  assert.equal(trace.authorization.decision, "propose_log_meal");
  assert.equal(trace.action.applicationAction, "log_meal");
  assert.equal(trace.action.confirmation, "required");
  assert.equal(trace.performance.callCount, 1);
  assert.equal(trace.outcome.status, "proposal");
  assert.equal(assertSanitizedDecisionTrace(trace), true);

  const serialized = JSON.stringify(trace);
  assert.doesNotMatch(serialized, /secret meal description/i);
  assert.doesNotMatch(serialized, /private memory payload/i);
  assert.doesNotMatch(serialized, /privateFoodPayload/i);
  assert.doesNotMatch(serialized, /This text must never enter/i);
});

test("Phase 11A failure trace stores only a safe error code and counters", () => {
  const error = new Error("User text and provider details must not be stored here");
  error.code = "TOOL_VALIDATION_FAILED";
  const trace = buildAriFailureTrace({
    turn: { turnId: "turn_fail", conversationId: "conversation_fail", message: "private request" },
    error,
    optimizationTrace: { callCount: 2, failedCallCount: 1, modelLatencyMs: 55, usage: { total_tokens: 12 } }
  });

  assert.equal(trace.outcome.status, "error");
  assert.equal(trace.outcome.errorCode, "tool_validation_failed");
  assert.equal(trace.performance.callCount, 2);
  assert.equal(assertSanitizedDecisionTrace(trace), true);
  assert.doesNotMatch(JSON.stringify(trace), /User text and provider details|private request/i);
});

test("Phase 11B row projection contains decision codes and counters only", () => {
  const trace = buildAriDecisionTrace({ turn: { turnId: "turn_row" }, result: routineResult() });
  const row = toObservabilityRow({
    userId: "00000000-0000-0000-0000-000000000001",
    turnId: "turn_row",
    conversationId: "conversation_row",
    trace
  });

  assert.equal(ARI_OBSERVABILITY_STORE_VERSION, "1.0.0");
  assert.equal(row.application_action, "log_meal");
  assert.equal(row.authorization_mode, "deterministic");
  assert.equal(row.context_profile, "focused");
  assert.equal(row.performance_status, "pass");
  assert.equal(row.total_tokens, 400);
  assert.equal(row.trace.privacy.containsHiddenReasoning, false);
  assert.equal(Object.hasOwn(row, "message"), false);
  assert.equal(Object.hasOwn(row, "reply"), false);
  assert.equal(Object.hasOwn(row, "arguments"), false);
});

test("Phase 11B persistence is idempotent, service-role only, and fail-soft", async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  const requests = [];
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return new Response(null, { status: 201 });
  };

  try {
    const trace = buildAriDecisionTrace({ turn: { turnId: "turn_store" }, result: routineResult() });
    const stored = await recordAriObservabilityTurn({
      userId: "00000000-0000-0000-0000-000000000001",
      turnId: "turn_store",
      conversationId: "conversation_store",
      trace
    });
    assert.equal(stored.stored, true);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /ari_observability_turns\?on_conflict=user_id%2Cturn_id/);
    assert.equal(requests[0].init.headers.apikey, "server-only-key");
    assert.match(requests[0].init.headers.Prefer, /ignore-duplicates/);

    const payload = requests[0].init.body;
    assert.doesNotMatch(payload, /secret meal description|privateFoodPayload|This text must never enter/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("Phase 11A/B integration runs after trust orchestration and never replaces the core", () => {
  assert.match(orchestrator, /runObservedAriVNext\(turn, trace\)/);
  assert.match(orchestrator, /evaluatePerformanceBudget/);
  assert.match(orchestrator, /buildAriDecisionTrace/);
  assert.match(orchestrator, /recordAriObservabilityTurn/);
  assert.match(orchestrator, /runAriVNextCore/);
  assert.match(orchestrator, /canonicalPreflightRequired: true/);
  assert.match(orchestrator, /independentCorePasses: true/);
  assert.doesNotMatch(orchestrator, /decisionTrace.*createPendingAction/s);
});

test("Phase 11B schema is RLS-enabled and inaccessible to normal clients", () => {
  assert.match(migration, /alter table public\.ari_observability_turns enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_observability_turns from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert on table public\.ari_observability_turns to service_role/i);
  assert.match(migration, /unique \(user_id, turn_id\)/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.doesNotMatch(migration, /grant .*authenticated/i);
});
