import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(
  new URL("../assets/css/workout-day-editor-mobile.css", import.meta.url),
  "utf8"
);

const polish = fs.readFileSync(
  new URL("../js/training/workout-plans-card-polish.js", import.meta.url),
  "utf8"
);

test("Edit Training Day uses the larger mobile readability sheet", () => {
  assert.match(css, /#workoutDayEditor \.workout-dialog__panel[\s\S]*width:\s*min\(94vw,\s*580px\)/);
  assert.match(css, /#workoutDayEditor \.workout-dialog__panel[\s\S]*max-height:\s*84dvh/);
  assert.match(css, /#workoutDayEditor #workoutDayEditorTitle[\s\S]*1\.55rem/);
});

test("Edit Training Day form controls stay large enough to read and tap", () => {
  assert.match(css, /\.workout-builder-field select[\s\S]*min-height:\s*56px/);
  assert.match(css, /\.workout-builder-field select[\s\S]*font-size:\s*18px/);
  assert.match(css, /#workoutAddExerciseButton[\s\S]*min-height:\s*52px/);
  assert.match(css, /\.workout-empty-state[\s\S]*font-size:\s*1rem/);
});

test("Workout Plans exercise searches stay at iPhone-safe 16px text", () => {
  assert.match(css, /#workoutExercisePickerSearch,[\s\S]*#exerciseLibrarySearch[\s\S]*font-size:\s*16px/);
  assert.doesNotMatch(css, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
});

test("Workout Plans polish layer loads the mobile editor stylesheet and formats the editor date", () => {
  assert.match(polish, /workout-day-editor-mobile\.css\?v=1\.0\.1/);
  assert.match(polish, /workoutDayEditorTitle/);
  assert.match(polish, /formatDateLabel\(title\.textContent\)/);
});
