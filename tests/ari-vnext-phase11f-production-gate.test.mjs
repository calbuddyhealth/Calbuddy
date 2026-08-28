import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  ARI_OWNER_DIAGNOSTICS_VERSION,
  isVerifiedOwnerAuthorization,
  loadRecentAriDiagnostics,
  toOwnerDiagnostic
} from "../api/_lib/ari-vnext/owner-diagnostics.js";
import {
  PHASE11_COMPONENTS,
  PHASE11_READINESS_VERSION,
  componentVersionsComplete,
  evaluatePhase11Readiness
} from "../api/_lib/ari-vnext/phase11-readiness.js";
import { ARI_TRUST_EVAL_SCENARIOS } from "../api/_lib/ari-vnext/eval-scenarios-trust.js";
import { ARI_PERFORMANCE_EVAL_SCENARIOS } from "../api/_lib/ari-vnext/eval-scenarios-performance.js";
import { validateScenarioPrivacy } from "../api/_lib/ari-vnext/eval-engine.js";
import { recordAriObservabilityTurn } from "../api/_lib/ari-vnext/observability-store.js";

const diagnosticsSource = fs.readFileSync(new URL("../api/_lib/ari-vnext/owner-diagnostics.js", import.meta.url), "utf8");
const endpointSource = fs.readFileSync(new URL("../api/ari-owner-observability.js", import.meta.url), "utf8");
const readinessSource = fs.readFileSync(new URL("../api/_lib/ari-vnext/phase11-readiness.js", import.meta.url), "utf8");
const migrationSource = fs.readFileSync(new URL("../supabase/migrations/20260828044500_ari_observability_turns.sql", import.meta.url), "utf8");

const OWNER_ID = "11111111-1111-4111-8111-111111111111";

function ownerAuthorization() {
  return {
    authorized: true,
    mode: "supabase_verified_owner",
    user: { id: OWNER_ID, email: "owner@example.test" }
  };
}

test("Phase 11F diagnostics require the existing verified-owner authorization object before any ledger read", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new Error("must not be called");
  };

  assert.equal(isVerifiedOwnerAuthorization(null), false);
  assert.equal(isVerifiedOwnerAuthorization({ authorized: true, mode: "body_flag", user: { id: OWNER_ID } }), false);
  assert.equal(isVerifiedOwnerAuthorization(ownerAuthorization()), true);

  const result = await loadRecentAriDiagnostics({ ownerAuthorization: { authorized: false }, fetchImpl });
  assert.equal(result.success, false);
  assert.equal(result.code, "OWNER_ACCESS_DENIED");
  assert.equal(calls, 0);
});

test("Phase 11F ledger reader performs one bounded GET and never selects the trace JSON blob", async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test-key";

  let requestedUrl = "";
  let requestedOptions = null;
  try {
    const result = await loadRecentAriDiagnostics({
      ownerAuthorization: ownerAuthorization(),
      subjectUserId: OWNER_ID,
      limit: 500,
      fetchImpl: async (url, options) => {
        requestedUrl = String(url);
        requestedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => [{
            created_at: "2026-08-28T05:00:00Z",
            user_id: OWNER_ID,
            turn_id: "turn-test",
            outcome: "reply",
            routing_class: "casual",
            context_profile: "minimal",
            model_call_count: 1,
            trace: { forbidden: true },
            prompt: "must-not-escape",
            reply: "must-not-escape",
            tool_arguments: { forbidden: true }
          }]
        };
      }
    });

    assert.equal(result.success, true);
    assert.equal(requestedOptions.method, "GET");
    assert.equal(requestedOptions.body, undefined);
    const url = new URL(requestedUrl);
    const select = String(url.searchParams.get("select") || "").split(",");
    assert.equal(select.includes("trace"), false);
    assert.equal(select.includes("prompt"), false);
    assert.equal(select.includes("reply"), false);
    assert.equal(url.searchParams.get("limit"), "100");
    assert.equal(url.searchParams.get("user_id"), `eq.${OWNER_ID}`);
    assert.equal(JSON.stringify(result).includes("must-not-escape"), false);
    assert.equal(JSON.stringify(result).includes("forbidden"), false);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("Phase 11F owner diagnostic projection includes only coded decision/outcome fields", () => {
  const diagnostic = toOwnerDiagnostic({
    created_at: "2026-08-28T05:00:00Z",
    user_id: OWNER_ID,
    turn_id: "turn-1",
    conversation_id: "conversation-1",
    outcome: "proposal",
    outcome_source: "ari_vnext",
    active_domains: ["nutrition"],
    routing_class: "nutrition_logging",
    model: "model-name",
    context_profile: "focused",
    reference_status: "resolved",
    reference_reason: "unique_authoritative_candidate",
    authorization_mode: "deterministic",
    authorization_decision: "propose_log_meal",
    confirmation_state: "required",
    performance_status: "pass",
    model_call_count: 1,
    total_tokens: 800,
    model_latency_ms: 700,
    trace: { hiddenReasoning: "do-not-copy" },
    prompt: "do-not-copy",
    reply: "do-not-copy",
    memory_payload: { doNotCopy: true },
    app_state: { doNotCopy: true }
  });

  assert.equal(diagnostic.outcome.status, "proposal");
  assert.equal(diagnostic.model.routingClass, "nutrition_logging");
  assert.equal(diagnostic.context.profile, "focused");
  assert.equal(diagnostic.reference.status, "resolved");
  assert.equal(diagnostic.performance.modelCallCount, 1);
  const serialized = JSON.stringify(diagnostic);
  assert.doesNotMatch(serialized, /do-not-copy|hiddenReasoning|memory_payload|app_state|prompt|reply/i);
});

test("Phase 11F API reuses hardened owner auth, is GET-only, and exposes no mutation route", () => {
  assert.match(endpointSource, /verifyOwnerRequest\(req\)/);
  assert.match(endpointSource, /setOwnerSecurityHeaders\(res\)/);
  assert.match(endpointSource, /req\.method !== "GET"/);
  assert.match(endpointSource, /Allow", "GET"/);
  assert.doesNotMatch(endpointSource, /req\.method === "POST"|req\.method === "PATCH"|req\.method === "DELETE"/);
  assert.doesNotMatch(endpointSource, /createPendingAction|validateToolCall|AriVNextOperationRegistry|responses\.create|executeAction|\.rpc\(/i);
});

test("Phase 11F diagnostic reader is read-only and has no Ari trust or mutation authority", () => {
  assert.match(diagnosticsSource, /method: "GET"/);
  assert.doesNotMatch(diagnosticsSource, /method: "POST"|method: "PATCH"|method: "DELETE"/);
  assert.doesNotMatch(diagnosticsSource, /createPendingAction|validateToolCall|AriVNextOperationRegistry|responses\.create|executeAction|withPreparedPrimary|\.rpc\(/i);
  assert.doesNotMatch(diagnosticsSource, /SELECT_COLUMNS[\s\S]{0,4000}"trace"/);
});

test("Phase 11F Phase 11 manifest spans 11A through 11F with concrete versions", () => {
  assert.equal(PHASE11_READINESS_VERSION, "11F.1.0");
  assert.equal(componentVersionsComplete(), true);
  for (const key of [
    "decisionTrace",
    "observabilityStore",
    "evalEngine",
    "trustEvalSuite",
    "performanceEvalSuite",
    "ownerDiagnostics",
    "readiness"
  ]) {
    assert.equal(typeof PHASE11_COMPONENTS[key], "string");
    assert.ok(PHASE11_COMPONENTS[key].length > 0);
  }
});

test("Phase 11F final readiness requires evals, server-only ledger, owner diagnostics, prior workflows, and deployment", () => {
  const pass = evaluatePhase11Readiness({
    trustEvalStatus: "pass",
    performanceEvalStatus: "pass",
    ledgerVerified: true,
    ledgerClientReadBlocked: true,
    ownerDiagnosticsVerified: true,
    priorTrustWorkflowGreen: true,
    readinessWorkflowGreen: true,
    deploymentGreen: true
  });
  assert.equal(pass.status, "pass");
  assert.equal(pass.complete, true);
  assert.deepEqual(pass.failedCodes, []);

  const fail = evaluatePhase11Readiness({
    trustEvalStatus: "fail",
    performanceEvalStatus: "pass",
    ledgerVerified: true,
    ledgerClientReadBlocked: false,
    ownerDiagnosticsVerified: true,
    priorTrustWorkflowGreen: true,
    readinessWorkflowGreen: true,
    deploymentGreen: false
  });
  assert.equal(fail.status, "fail");
  assert.equal(fail.complete, false);
  assert.equal(fail.failedCodes.includes("trust_eval_suite_passed"), true);
  assert.equal(fail.failedCodes.includes("ledger_client_read_blocked"), true);
  assert.equal(fail.failedCodes.includes("deployment_green"), true);
});

test("Phase 11F both reusable eval catalogs remain privacy-safe and nonempty", () => {
  for (const scenarios of [ARI_TRUST_EVAL_SCENARIOS, ARI_PERFORMANCE_EVAL_SCENARIOS]) {
    assert.ok(scenarios.length > 0);
    for (const scenario of scenarios) assert.equal(validateScenarioPrivacy(scenario).ok, true, scenario.id);
  }
});

test("Phase 11F observability persistence remains fail-soft when no trace is provided", async () => {
  const result = await recordAriObservabilityTurn({ trace: null });
  assert.deepEqual(result, { stored: false, reason: "missing_trace" });
});

test("Phase 11F production ledger stays RLS-enabled and inaccessible to normal clients", () => {
  assert.match(migrationSource, /alter table public\.ari_observability_turns enable row level security/i);
  assert.match(migrationSource, /revoke all on table public\.ari_observability_turns from public, anon, authenticated/i);
  assert.match(migrationSource, /grant select, insert on table public\.ari_observability_turns to service_role/i);
});

test("Phase 11F readiness evaluator itself is pure observation and cannot affect execution", () => {
  assert.doesNotMatch(readinessSource, /fetch\(|supabase|service_role|responses\.create|createPendingAction|validateToolCall|AriVNextOperationRegistry|executeAction|\.rpc\(/i);
});
