import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const adapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");
const replacement = fs.readFileSync("js/training/ari-whole-workout-replacement.js", "utf8");

test("canonical workout action sources remain valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(adapter));
  assert.doesNotThrow(() => new vm.Script(replacement));
});

test("whole-workout replacement is prepared against an existing date-specific workout", () => {
  assert.match(adapter, /mapWorkoutReplacementValidated/);
  assert.match(adapter, /const existing = controller\.getDate\(scheduledDate\)/);
  assert.match(adapter, /workout_replace_target_missing/);
  assert.match(adapter, /workout_replace_completed_session/);
  assert.match(adapter, /existing_workout_mode: "replace"/);
  assert.match(adapter, /confirmation_text:[\s\S]{0,220}Replace/);
});

test("replacement execution revalidates target identity and canonical exercises", () => {
  assert.match(replacement, /workout_replace_target_changed/);
  assert.match(replacement, /workout_replace_registry_revalidation_failed/);
  assert.match(replacement, /controller\.getExercise\(entry\.exerciseId\)/);
  assert.match(replacement, /controller\.setBuiltWorkoutForDate/);
  assert.match(replacement, /controller\.save\(\{ remote: true \}\)/);
});

test("completed workouts cannot be replaced", () => {
  assert.match(adapter, /existing\?\.completed === true \|\| existing\?\.progress\?\.completed === true/);
  assert.match(replacement, /existing\?\.completed === true \|\| existing\?\.progress\?\.completed === true/);
});
