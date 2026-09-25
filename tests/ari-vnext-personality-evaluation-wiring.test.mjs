import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Ari vNext exposes behavioral identity and personality evaluation diagnostics", async () => {
  const [api, cognitive, router] = await Promise.all([
    readFile(new URL("../api/ari-vnext.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/cognitive-loop.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url), "utf8")
  ]);

  assert.match(api, /summarizePersonalityEvaluation/);
  assert.match(api, /personalityEvaluationRollingScore/);
  assert.match(api, /behavioralIdentity:/);
  assert.match(cognitive, /deriveBehavioralIdentityControl/);
  assert.match(cognitive, /evaluatePersonalityContinuityTurn/);
  assert.match(cognitive, /personalityEvaluation:\s*nextPersonalityEvaluation/);
  assert.match(router, /behavioralIdentityToInstruction/);
});
