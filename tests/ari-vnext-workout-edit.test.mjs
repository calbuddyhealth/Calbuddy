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

test("browser action adapter parses and uses canonical surgical edit APIs", () => {
  const source = fs.readFileSync(new URL("../ari/vnext/ari-vnext-action-adapter.js", import.meta.url), "utf8");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /mapWorkoutEditValidated/);
  assert.match(source, /executeValidatedWorkoutEdit/);
  assert.match(source, /controller\.addExercise/);
  assert.match(source, /controller\.updateExercise/);
  assert.match(source, /controller\.removeExercise/);
  assert.match(source, /controller\.setDate/);
  assert.match(source, /workout_edit_target_changed/);
  assert.match(source, /completed workout cannot be rewritten/i);
});
