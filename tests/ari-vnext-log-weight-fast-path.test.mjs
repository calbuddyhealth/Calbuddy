import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatDeterministicPendingReply } from "../api/_lib/ari-vnext/orchestrator.js";

const orchestrator = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

test("primary log_weight proposals share the proven low-risk logging fast path", () => {
  assert.match(orchestrator, /"propose_log_weight"/);
  assert.match(orchestrator, /!LOW_RISK_PRIMARY_FAST_PATHS\.has\(primaryFunctionName\)/);
});

test("weight confirmation is deterministic from the pending payload", () => {
  assert.equal(
    formatDeterministicPendingReply("log_weight", { value: 185.6, unit: "lb" }),
    "Ready to log your weight at 185.6 lb. Confirm to save it."
  );
});

test("non-fast-path operations still retain the model confirmation path", () => {
  assert.equal(formatDeterministicPendingReply("update_goal", { value: 180 }), "");
  assert.match(orchestrator, /const second = await callResponses\(/);
});

test("trusted validation remains before pending creation", () => {
  const validationIndex = orchestrator.indexOf("let validation = validateToolCall(functionCall, route)");
  const pendingIndex = orchestrator.indexOf("const pendingAction = createPendingAction");
  assert.ok(validationIndex >= 0);
  assert.ok(pendingIndex > validationIndex);
});
