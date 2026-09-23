import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { getAriTools, validateToolCall, toolToApplicationAction } from "../api/_lib/ari-vnext/tools.js";

const adapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");
const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");

function replacementArgs() {
  return {
    dateText: "2026-09-23",
    focus: "chest",
    durationMinutes: 60,
    difficulty: "intermediate",
    warmup: "5 minute warm-up",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "" },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, restSeconds: 75, notes: "" }
    ],
    finisher: "",
    notes: ""
  };
}

test("Ari exposes an explicit whole-workout replacement tool", () => {
  const names = getAriTools({}).map((tool) => tool.name);
  assert.equal(names.includes("propose_replace_workout"), true);
  assert.equal(toolToApplicationAction("propose_replace_workout"), "replace_workout");
});

test("whole-workout replacement requires an exact date and complete replacement", () => {
  assert.equal(validateToolCall({ name: "propose_replace_workout", arguments: JSON.stringify(replacementArgs()) }, {}).valid, true);
  const invalid = validateToolCall({ name: "propose_replace_workout", arguments: JSON.stringify({ ...replacementArgs(), dateText: "today" }) }, {});
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, "workout_replace_exact_date_required");
});

test("replacement is owned by the canonical adapter", () => {
  assert.doesNotThrow(() => new vm.Script(adapter));
  assert.match(adapter, /mapWorkoutReplacementValidated/);
  assert.match(adapter, /executeValidatedWorkoutReplacement/);
  assert.match(adapter, /workout_replace_completed_session/);
  assert.match(adapter, /workout_replace_target_changed/);
  assert.match(adapter, /workout_replace_registry_revalidation_failed/);
  assert.match(adapter, /setBuiltWorkoutForDate/);
  assert.doesNotMatch(runtime, /ari-whole-workout-replacement/);
});
