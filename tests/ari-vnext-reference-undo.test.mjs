import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Nutrition exposes a reference-only Undo capability", () => {
  const tools = getAriTools({ nutrition: true });
  const undo = tools.find((tool) => tool?.name === "propose_undo_nutrition_mutation");

  assert.ok(undo);
  assert.deepEqual(Object.keys(undo.parameters.properties), ["referenceId"]);
  assert.deepEqual(undo.parameters.required, ["referenceId"]);
  assert.equal(toolToApplicationAction(undo.name), "undo_nutrition_mutation");

  const valid = validateToolCall({
    name: undo.name,
    arguments: JSON.stringify({ referenceId: "ref_action_meal123" })
  }, { nutrition: true });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.arguments, { referenceId: "ref_action_meal123" });

  const wrongRoute = validateToolCall({
    name: undo.name,
    arguments: JSON.stringify({ referenceId: "ref_action_meal123" })
  }, { training: true });
  assert.equal(wrongRoute.valid, false);
});

test("explicit current-turn Undo is verified without history granting permission", () => {
  const route = { nutrition: true };
  const tool = "propose_undo_nutrition_mutation";

  const direct = reviewDeterministicRoutineLogIntent({
    turn: { message: "Can you undo that?" },
    route,
    functionCall: { name: tool },
    availableTools: [tool]
  });
  assert.equal(direct?.decision, tool);
  assert.equal(direct?.confidence, 1);
  assert.equal(direct?.source, "deterministic_reference_undo");

  const statement = reviewDeterministicRoutineLogIntent({
    turn: { message: "That meal was good." },
    route,
    functionCall: { name: tool },
    availableTools: [tool]
  });
  assert.equal(statement, null);
});

test("reference Undo lifecycle follows authoritative execution output and tombstones the target", () => {
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");
  const registry = read("ari/vnext/ari-vnext-operation-registry.js");

  assert.match(lifecycle, /const authoritative = execution\?\.authoritativeReference/);
  assert.match(lifecycle, /const target = authoritative\?\.target \|\| resolveReference\(pendingAction\?\.arguments\?\.referenceId/);
  assert.match(lifecycle, /const operation = clean\(authoritative\?\.operation/);
  assert.match(lifecycle, /\/undo\|delete\/\.test\(operation\)/);
  assert.match(lifecycle, /return tombstone\(target, conversationId\)/);
  assert.match(lifecycle, /registry\.registerAfterExecution/);
  assert.match(lifecycle, /const referenceLifecycle = commit\(\{ pendingAction, execution \}\)/);
  assert.doesNotMatch(lifecycle, /AriVNextActionAdapter/);
  assert.match(registry, /async function executeConfirmed/);
});

test("reference lifecycle never trusts a model-supplied mutation id", () => {
  const tools = read("api/_lib/ari-vnext/tools.js");
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");

  assert.match(tools, /properties:\s*\{\s*referenceId:/);
  assert.doesNotMatch(tools, /properties:\s*\{\s*mutationId:/);
  assert.match(lifecycle, /canonical\.mutationId = clean\(findValue\(result, \["ari_mutation_id", "mutationId"\]\)/);
  assert.match(lifecycle, /verifiedByTrustedExecutor: true/);
  assert.match(lifecycle, /authoritative\?\.target \|\| resolveReference/);
  assert.match(lifecycle, /state: "deleted"/);
});
