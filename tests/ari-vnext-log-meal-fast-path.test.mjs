import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const orchestrator = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

test("primary log_meal proposals bypass the semantic verifier through the shared logging fast path", () => {
  assert.match(orchestrator, /const primaryFunctionName = String\(functionCall\?\.name \|\| ""\)\.trim\(\)/);
  assert.match(orchestrator, /"propose_log_meal"/);
  assert.match(orchestrator, /!LOW_RISK_PRIMARY_FAST_PATHS\.has\(primaryFunctionName\)/);
});

test("missed command-like requests still retain semantic verifier fallback", () => {
  assert.match(orchestrator, /\(Boolean\(functionCall\) \|\| shouldReviewNoToolTurn\(turn\)\)/);
  assert.match(orchestrator, /reviewExplicitApplicationIntent\(\{ turn, route, tools \}\)/);
});

test("trusted validation and confirmation remain downstream of the fast path", () => {
  const verifierIndex = orchestrator.indexOf("const shouldVerify =");
  const validationIndex = orchestrator.indexOf("let validation = validateToolCall(functionCall, route)");
  const pendingIndex = orchestrator.indexOf("const pendingAction = createPendingAction");
  const deterministicIndex = orchestrator.indexOf("formatDeterministicPendingReply(applicationAction, pendingAction.arguments)");

  assert.ok(verifierIndex >= 0);
  assert.ok(validationIndex > verifierIndex);
  assert.ok(pendingIndex > validationIndex);
  assert.ok(deterministicIndex > pendingIndex);
});
