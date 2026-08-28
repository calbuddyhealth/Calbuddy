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

test("Training exposes reference-only activity edit and delete capabilities", () => {
  const tools = getAriTools({ training: true });
  const update = tools.find((tool) => tool?.name === "propose_update_activity_log");
  const remove = tools.find((tool) => tool?.name === "propose_delete_activity_log");

  assert.ok(update);
  assert.ok(remove);
  assert.deepEqual(Object.keys(update.parameters.properties), ["referenceId", "changes"]);
  assert.deepEqual(Object.keys(remove.parameters.properties), ["referenceId"]);
  assert.equal(toolToApplicationAction(update.name), "update_activity_log");
  assert.equal(toolToApplicationAction(remove.name), "delete_activity_log");
  assert.equal(getAriTools({ nutrition: true }).some((tool) => tool.name === update.name), false);
  assert.equal(getAriTools({ nutrition: true }).some((tool) => tool.name === remove.name), false);
});

test("activity reference tools accept only a trusted reference id plus bounded changes", () => {
  const update = validateToolCall({
    name: "propose_update_activity_log",
    arguments: JSON.stringify({
      referenceId: "ref_action_run123",
      activityId: "model-must-not-control-this",
      changes: [
        { field: "duration_minutes", numberValue: 45, textValue: null },
        { field: "calories_burned", numberValue: 400, textValue: null }
      ]
    })
  }, { training: true });

  assert.equal(update.valid, true, update.error);
  assert.deepEqual(update.arguments, {
    referenceId: "ref_action_run123",
    changes: [
      { field: "duration_minutes", numberValue: 45, textValue: null },
      { field: "calories_burned", numberValue: 400, textValue: null }
    ]
  });
  assert.equal("activityId" in update.arguments, false);

  const duplicate = validateToolCall({
    name: "propose_update_activity_log",
    arguments: JSON.stringify({
      referenceId: "ref_action_run123",
      changes: [
        { field: "duration_minutes", numberValue: 30, textValue: null },
        { field: "duration_minutes", numberValue: 45, textValue: null }
      ]
    })
  }, { training: true });
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.error, "activity_reference_change_duplicate");

  const wrongRoute = validateToolCall({
    name: "propose_delete_activity_log",
    arguments: JSON.stringify({ referenceId: "ref_action_run123" })
  }, { nutrition: true });
  assert.equal(wrongRoute.valid, false);
});

test("explicit current-turn activity corrections and deletes are verified deterministically", () => {
  const route = { training: true };

  const update = reviewDeterministicRoutineLogIntent({
    turn: { message: "Actually make that 45 minutes." },
    route,
    functionCall: { name: "propose_update_activity_log" },
    availableTools: ["propose_update_activity_log"]
  });
  assert.equal(update?.decision, "propose_update_activity_log");
  assert.equal(update?.source, "deterministic_reference_activity_update");

  const remove = reviewDeterministicRoutineLogIntent({
    turn: { message: "Can you delete that run?" },
    route,
    functionCall: { name: "propose_delete_activity_log" },
    availableTools: ["propose_delete_activity_log"]
  });
  assert.equal(remove?.decision, "propose_delete_activity_log");
  assert.equal(remove?.source, "deterministic_reference_activity_delete");

  const bareFact = reviewDeterministicRoutineLogIntent({
    turn: { message: "I ran 45 minutes." },
    route,
    functionCall: { name: "propose_update_activity_log" },
    availableTools: ["propose_update_activity_log"]
  });
  assert.equal(bareFact, null);
});

test("activity reference lifecycle is observational and follows trusted registry execution", () => {
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");
  const registry = read("ari/vnext/ari-vnext-operation-registry.js");

  assert.match(lifecycle, /const registry = window\.AriVNextOperationRegistry/);
  assert.match(lifecycle, /registry\.registerAfterExecution/);
  assert.match(lifecycle, /const authoritative = execution\?\.authoritativeReference/);
  assert.match(lifecycle, /const target = authoritative\?\.target \|\| resolveReference/);
  assert.match(lifecycle, /\/undo\|delete\/\.test\(operation\)/);
  assert.match(lifecycle, /\/update\|edit\/\.test\(operation\)/);
  assert.match(lifecycle, /state: "persisted"/);
  assert.match(lifecycle, /state: "deleted"/);
  assert.doesNotMatch(lifecycle, /AriVNextActionAdapter/);
  assert.match(registry, /async function executeConfirmed/);
});

test("Training reference execution stays on canonical identity and the user-scoped activity service", () => {
  const tools = read("api/_lib/ari-vnext/tools.js");
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");
  const adapter = read("ari/vnext/ari-vnext-activity-adapter.js");

  assert.doesNotMatch(tools, /properties:\s*\{\s*activityId:/);
  assert.match(tools, /referenceId:/);
  assert.match(lifecycle, /authoritative\?\.target \|\| resolveReference\(pendingAction\?\.arguments\?\.referenceId/);
  assert.match(lifecycle, /verifiedByTrustedExecutor: true/);
  assert.match(adapter, /service\.listActivities\(date\)/);
  assert.match(adapter, /service\.updateActivity\(activityId/);
  assert.match(adapter, /service\.deleteActivity\(activityId\)/);
  assert.match(adapter, /registerOperation\("update_activity_log"/);
  assert.match(adapter, /registerOperation\("delete_activity_log"/);
});
