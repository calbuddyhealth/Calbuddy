import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getAriTools,
  validateToolCall,
  toolToApplicationAction
} from "../api/_lib/ari-vnext/tools.js";

const shim = fs.readFileSync("js/training/ari-whole-workout-replacement.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

function replacementArgs() {
  return {
    dateText: "2026-09-09",
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
  const valid = validateToolCall({
    name: "propose_replace_workout",
    arguments: JSON.stringify(replacementArgs())
  }, {});
  assert.equal(valid.valid, true);

  const invalid = validateToolCall({
    name: "propose_replace_workout",
    arguments: JSON.stringify({ ...replacementArgs(), dateText: "today" })
  }, {});
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, "workout_replace_exact_date_required");
});

test("trusted browser patch distinguishes whole replacement from exercise replacement", () => {
  assert.match(shim, /pendingAction\?\.name[\s\S]*!== "replace_workout"/);
  assert.match(shim, /existing_workout_mode: "replace"/);
  assert.match(shim, /workout_replace_completed_session/);
  assert.match(shim, /workout_replace_target_changed/);
  assert.match(shim, /workout_replace_registry_revalidation_failed/);
  assert.match(shim, /setBuiltWorkoutForDate/);
  assert.match(shim, /mode: "replace"/);
});

test("Home loads replacement support before pending-action recovery", () => {
  const replacementIndex = home.indexOf("js/training/ari-whole-workout-replacement.js?v=1.0.0");
  const pendingRecoveryIndex = home.indexOf("js/ari-pending-action-recovery.js?v=1.0.0");
  assert.ok(replacementIndex >= 0);
  assert.ok(pendingRecoveryIndex > replacementIndex);
});
