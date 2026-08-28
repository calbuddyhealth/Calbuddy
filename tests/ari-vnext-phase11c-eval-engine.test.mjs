import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  ARI_EVAL_ENGINE_VERSION,
  defineAriEvalScenario,
  evaluateAriScenario,
  evaluateAriSuite,
  expectation,
  validateScenarioPrivacy
} from "../api/_lib/ari-vnext/eval-engine.js";

const engineSource = fs.readFileSync(new URL("../api/_lib/ari-vnext/eval-engine.js", import.meta.url), "utf8");

test("Phase 11C expresses route/action/reference expectations without custom assertions", () => {
  const scenario = defineAriEvalScenario({
    id: "single_target_reference_update",
    category: "trust",
    expectations: [
      expectation("route.nutrition", "exact", true),
      expectation("reference.status", "oneOf", ["resolved", "context_only"]),
      expectation("reference.candidateCount", "range", { min: 0, max: 1 }),
      expectation("action.confirmationState", "exact", "required")
    ]
  });

  const result = evaluateAriScenario({
    scenario,
    actual: {
      route: { nutrition: true },
      reference: { status: "resolved", candidateCount: 1 },
      action: { confirmationState: "required" }
    }
  });

  assert.equal(result.status, "pass");
  assert.equal(result.findingCount, 0);
  assert.equal(result.version, ARI_EVAL_ENGINE_VERSION);
});

test("Phase 11C supports exact, membership, numeric range, exists, absent, and optional fields", () => {
  const scenario = defineAriEvalScenario({
    id: "matcher_contract",
    expectations: [
      expectation("model.class", "exact", "fast"),
      expectation("context.profile", "oneOf", ["minimal", "focused"]),
      expectation("performance.calls", "range", { min: 0, max: 2 }),
      expectation("reference.status", "exists", true),
      expectation("unsafePayload", "absent", true),
      expectation("optional.futureField", "exact", "v2", { optional: true })
    ]
  });

  const result = evaluateAriScenario({
    scenario,
    actual: {
      model: { class: "fast" },
      context: { profile: "focused" },
      performance: { calls: 1 },
      reference: { status: "inactive" }
    }
  });
  assert.equal(result.status, "pass");
});

test("Phase 11C reports stable fail reason codes and paths", () => {
  const scenario = defineAriEvalScenario({
    id: "wrong_route",
    expectations: [
      expectation("route.training", "exact", true, { code: "training_route_required" }),
      expectation("performance.totalTokens", "range", { max: 2000 }, { severity: "warn", code: "token_budget_warn" })
    ]
  });

  const result = evaluateAriScenario({
    scenario,
    actual: { route: { training: false }, performance: { totalTokens: 2500 } }
  });

  assert.equal(result.status, "fail");
  assert.deepEqual(result.findings.map((item) => item.code), ["training_route_required", "token_budget_warn"]);
  assert.deepEqual(result.findings.map((item) => item.path), ["route.training", "performance.totalTokens"]);
});

test("Phase 11C warnings do not become failures", () => {
  const scenario = defineAriEvalScenario({
    id: "latency_warning",
    expectations: [expectation("latencyMs", "range", { max: 1000 }, { severity: "warn", code: "latency_warn" })]
  });
  const result = evaluateAriScenario({ scenario, actual: { latencyMs: 1500 } });
  assert.equal(result.status, "warn");
  assert.equal(result.findings[0].severity, "warn");
});

test("Phase 11C suite summary is deterministic and aggregates pass warn fail", () => {
  const scenarios = [
    defineAriEvalScenario({ id: "pass", expectations: [expectation("ok", "exact", true)] }),
    defineAriEvalScenario({ id: "warn", expectations: [expectation("cost", "range", { max: 1 }, { severity: "warn" })] }),
    defineAriEvalScenario({ id: "fail", expectations: [expectation("safe", "exact", true)] })
  ];
  const suite = evaluateAriSuite({
    suiteId: "phase11c_contract",
    scenarios,
    actualById: {
      pass: { ok: true },
      warn: { cost: 2 },
      fail: { safe: false }
    }
  });
  assert.equal(suite.status, "fail");
  assert.deepEqual(suite.counts, { pass: 1, warn: 1, fail: 1 });
  assert.deepEqual(suite.results.map((item) => item.id), ["pass", "warn", "fail"]);
});

test("Phase 11C rejects prompt reply hidden reasoning tool arguments memory and app-state fixtures", () => {
  for (const unsafe of [
    { prompt: "x" },
    { reply: "x" },
    { reasoning: "x" },
    { toolArguments: { id: 1 } },
    { memoryPayload: { x: 1 } },
    { appState: { x: 1 } },
    { nested: { secrets: "x" } }
  ]) {
    const privacy = validateScenarioPrivacy({ id: "unsafe", expectations: [], ...unsafe });
    assert.equal(privacy.ok, false);
    assert.equal(privacy.code, "forbidden_fixture_field");
  }

  assert.throws(() => defineAriEvalScenario({ id: "unsafe", prompt: "do something" }), /forbidden_fixture_field/);
});

test("Phase 11C output remains compact and does not echo arbitrary structured actual payloads", () => {
  const scenario = defineAriEvalScenario({
    id: "compact_failure",
    expectations: [expectation("route.training", "exact", true)]
  });
  const result = evaluateAriScenario({
    scenario,
    actual: { route: { training: false }, large: { private: "must-not-be-copied" } }
  });
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /must-not-be-copied/);
});

test("Phase 11C engine has no provider database or mutation authority", () => {
  assert.doesNotMatch(engineSource, /openai|responses\.create|fetch\(|supabase|service_role|\.rpc\(|createPendingAction|validateToolCall|AriVNextOperationRegistry|executeAction/i);
  assert.doesNotMatch(engineSource, /prompt text|reply text/i);
});
