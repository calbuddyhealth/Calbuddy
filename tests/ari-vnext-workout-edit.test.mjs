import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

test("training route exposes precise workout edit capability", () => {
  const tool = getAriTools({ training: true }).find((item) => item.name === "propose_edit_workout");
  assert.ok(tool);
  assert.deepEqual(tool.parameters.properties.operation.enum, ["add", "remove", "replace", "move", "update"]);
  assert.ok(tool.parameters.properties.sets);
  assert.ok(tool.parameters.properties.reps);
  assert.ok(tool.parameters.properties.restSeconds);
  assert.ok(tool.parameters.properties.position);
});

test("valid replacement edit passes semantic validation", () => {
  const result = validateToolCall({
    name: "propose_edit_workout",
    arguments: JSON.stringify({
      dateText: "tomorrow",
      operation: "replace",
      exercise: "Dumbbell Bench Press",
      replacementExercise: "Barbell Bench Press",
      sets: null,
      reps: null,
      restSeconds: null,
      position: null,
      durationMinutes: null,
      title: "",
      instruction: "Replace dumbbell bench with barbell bench"
    })
  }, { training: true });
  assert.equal(result.valid, true);
});

test("move edit requires a valid position", () => {
  const result = validateToolCall({
    name: "propose_edit_workout",
    arguments: JSON.stringify({
      dateText: "tomorrow",
      operation: "move",
      exercise: "Squat",
      replacementExercise: "",
      sets: null,
      reps: null,
      restSeconds: null,
      position: null,
      durationMinutes: null,
      title: "",
      instruction: "Move squat first"
    })
  }, { training: true });
  assert.equal(result.valid, false);
  assert.equal(result.error, "workout_edit_position_required");
});

test("Training proposal and persistence services own canonical surgical edit APIs", () => {
  const proposal = fs.readFileSync(new URL("../js/training/training-proposal-service.js", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../js/training/training-service.js", import.meta.url), "utf8");
  assert.match(proposal, /prepareWorkoutEdit/);
  assert.match(proposal, /resolveDayExercise/);
  assert.match(proposal, /completed workout cannot be rewritten/i);
  assert.match(service, /applyValidatedWorkoutEdit/);
  assert.match(service, /controller\.addExercise/);
  assert.match(service, /moveExercise/);
  assert.match(service, /controller\.removeExercise/);
  assert.match(service, /controller\.updateExercise/);
  assert.match(service, /controller\.setDateTitle/);
  assert.match(service, /controller\.setDateDuration/);
  assert.match(service, /workout_edit_target_changed/);
});
