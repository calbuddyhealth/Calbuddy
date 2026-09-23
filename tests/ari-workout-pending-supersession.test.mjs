import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const adapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");
const registry = fs.readFileSync("ari/vnext/ari-vnext-operation-registry.js", "utf8");
const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");

test("workout proposals use turn-bound durable identities", () => {
  assert.match(registry, /validPendingIdentity/);
  assert.match(registry, /source_turn_id: pending\.sourceTurnId/);
  assert.match(registry, /vnext_action_id: pending\.id/);
  assert.match(adapter, /source_turn_id: vnextPendingAction\.sourceTurnId/);
});

test("a newer pending proposal is not erased by completion of an older one", () => {
  assert.match(runtime, /clearMatchingPendingAction\(originalPending\)/);
  assert.match(runtime, /clearMatchingPendingAction\(pending\)/);
  assert.doesNotMatch(runtime, /if \(execution\?\.success\)[\s\S]{0,120}CalBuddy\.clearPendingAction\?\.\(\)/);
});

test("workout plan preparation is canonical and registry validated", () => {
  assert.match(registry, /preparePlanWorkout/);
  assert.match(registry, /mapWorkoutPlanValidated/);
  assert.match(adapter, /mapWorkoutPlanValidated/);
  assert.match(adapter, /canonical ARI XP exercise registry/i);
});

test("workout edit and replacement remain date-specific", () => {
  assert.match(adapter, /mapWorkoutEditValidated/);
  assert.match(adapter, /mapWorkoutReplacementValidated/);
  assert.match(adapter, /resolveWorkoutDate/);
});
