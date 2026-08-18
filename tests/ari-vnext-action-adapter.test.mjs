import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../ari/vnext/ari-vnext-action-adapter.js", import.meta.url), "utf8");

test("Ari vNext action adapter parses as browser JavaScript", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("workout adapter preserves model-designed workout through canonical validation", () => {
  assert.match(source, /mapWorkoutPlanValidated/);
  assert.match(source, /resolveCanonicalExercise/);
  assert.match(source, /vnext_prebuilt_workout/);
  assert.match(source, /setBuiltWorkoutForDate/);
  assert.match(source, /getExercise\(entry\.exerciseId\)/);
});

test("workout adapter refuses to overwrite an existing workout", () => {
  assert.match(source, /workout_date_conflict/);
  assert.match(source, /I didn't overwrite it/);
});

test("workout adapter keeps unvalidated exercise names out of persistence", () => {
  assert.match(source, /workout_exercise_resolution_required/);
  assert.match(source, /registryValidated: true/);
  assert.match(source, /score >= 6500/);
});
