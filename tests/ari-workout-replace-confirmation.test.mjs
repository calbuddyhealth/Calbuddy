import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const adapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");

test("canonical workout adapter remains valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(adapter));
});

test("whole-workout replacement is prepared against an existing date-specific workout", () => {
  assert.match(adapter, /mapWorkoutReplacementValidated/);
  assert.match(adapter, /const existing = controller\.getDate\(scheduledDate\)/);
  assert.match(adapter, /workout_replace_target_missing/);
  assert.match(adapter, /workout_replace_completed_session/);
  assert.match(adapter, /existing_workout_mode:\s*"replace"/);
  assert.match(adapter, /confirmation_text:[\s\S]{0,260}Replace/);
});

test("replacement execution revalidates target identity and canonical exercises", () => {
  assert.match(adapter, /executeValidatedWorkoutReplacement/);
  assert.match(adapter, /workout_replace_target_changed/);
  assert.match(adapter, /workout_replace_registry_revalidation_failed/);
  assert.match(adapter, /controller\.getExercise\(entry\.exerciseId\)/);
  assert.match(adapter, /controller\.setBuiltWorkoutForDate/);
  assert.match(adapter, /controller\.save\(\{ remote: true \}\)/);
});

test("completed workouts cannot be replaced", () => {
  assert.match(adapter, /existing\?\.completed === true \|\| existing\?\.progress\?\.completed === true/);
});
