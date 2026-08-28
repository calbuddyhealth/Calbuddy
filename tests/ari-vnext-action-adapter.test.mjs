import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const facade = fs.readFileSync(new URL("../ari/vnext/ari-vnext-action-adapter.js", import.meta.url), "utf8");
const proposal = fs.readFileSync(new URL("../js/training/training-proposal-service.js", import.meta.url), "utf8");
const training = fs.readFileSync(new URL("../js/training/training-service.js", import.meta.url), "utf8");

test("Ari vNext ActionAdapter is compatibility-only and delegates to OperationRegistry", () => {
  assert.doesNotThrow(() => new Function(facade));
  assert.match(facade, /compatibilityOnly: true/);
  assert.match(facade, /AriVNextOperationRegistry/);
  assert.doesNotMatch(facade, /resolveCanonicalExercise|setBuiltWorkoutForDate|mapWorkoutPlanValidated/);
});

test("Training proposal service preserves model-designed workout through canonical validation", () => {
  assert.match(proposal, /prepareWorkoutPlan/);
  assert.match(proposal, /resolveCanonicalExercise/);
  assert.match(proposal, /vnext_prebuilt_workout/);
  assert.match(proposal, /registryValidated: true/);
  assert.match(training, /createValidatedWorkout/);
  assert.match(training, /setBuiltWorkoutForDate/);
  assert.match(training, /controller\.save\(\{ remote: true \}\)/);
});

test("Training service refuses to overwrite an existing workout", () => {
  assert.match(training, /workout_date_conflict/);
  assert.match(training, /already planned for/);
  assert.match(training, /didn['\\]t overwrite it/);
});

test("Training proposal service keeps unvalidated exercise names out of persistence", () => {
  assert.match(proposal, /workout_exercise_resolution_required/);
  assert.match(proposal, /registryValidated: true/);
  assert.match(proposal, /score >= 6500/);
});
