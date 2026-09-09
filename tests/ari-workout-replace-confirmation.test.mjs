import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("ari/actions/ari-workout-plan-action.js", "utf8");

test("workout action source remains valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(source));
});

test("superseding a create proposal over an existing workout promotes it to replace", () => {
  const block = source.match(/const pendingWorkout = getPendingWorkout\(\);[\s\S]*?const editContext = readEditContext\(\);/)?.[0] || "";
  assert.match(block, /const existing = await inspectDate\(merged\.scheduledDate\)/);
  assert.match(block, /const inheritedMode = clean\(pendingWorkout\?\.payload\?\.existing_workout_mode \|\| "create"\)/);
  assert.match(block, /const mode = existing && inheritedMode === "create" \? "replace" : inheritedMode/);
  assert.match(block, /CalBuddy\.cancelPendingAction\?\.\(\)/);
  assert.match(block, /buildPendingActionFromOptions\([\s\S]*?mode/);
});

test("stored workout edit context becomes an explicit replace proposal", () => {
  assert.match(source, /function readEditContext\(\)/);
  const block = source.match(/const editContext = readEditContext\(\);[\s\S]*?const storedConflict = readConflict\(\);/)?.[0] || "";
  assert.match(block, /existingWorkoutMode: "replace"/);
  assert.match(block, /buildPendingAction\(message, replacementDecision, requestedDate, "replace"\)/);
  assert.match(block, /workoutEditConvertedToReplacement: true/);
});

test("a concrete edit request can immediately create a replacement confirmation", () => {
  const editBlock = source.match(/if \(clean\(decision\.action\) === "edit_workout"\)[\s\S]*?if \(existing\) \{/)?.[0] || source;
  assert.match(source, /const hasConcreteRevision = Boolean\(/);
  assert.match(source, /buildPendingAction\(message, replacementDecision, requestedDate, "replace"\)/);
});

test("executor still refuses an un-authorized create over an existing workout", () => {
  assert.match(source, /if \(existing && mode === "create"\) return \{ success: false, conflict: true/);
});

test("successful workout writes clear stale edit state", () => {
  assert.match(source, /await controller\.save\(\{ remote: true \}\);[\s\S]*?clearEditContext\(\)/);
});
