import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const interactions = fs.readFileSync(
  new URL("../js/training/training-live-interactions.js", import.meta.url),
  "utf8"
);

const supabaseConfig = fs.readFileSync(
  new URL("../supabase-config.js", import.meta.url),
  "utf8"
);

test("ARI Training Add Exercise opens the real dialog on iOS/Safari", () => {
  assert.match(interactions, /sessionExercisePicker/);
  assert.match(interactions, /showModal/);
  assert.match(interactions, /dialog\.close/);
  assert.match(interactions, /Quick Add/);
  assert.match(interactions, /data-quick-exercise-id/);
  assert.match(interactions, /sessionExerciseSearchInput/);
});

test("ARI Training picker stays visible if a legacy day render reapplies hidden", () => {
  assert.match(interactions, /protectOpenPickerVisibility/);
  assert.match(interactions, /MutationObserver/);
  assert.match(interactions, /dialog\.open\s*&&\s*dialog\.hidden/);
  assert.match(interactions, /dialog\.hidden\s*=\s*false/);
});

test("ARI Training quick add avoids showing the whole library by default", () => {
  assert.match(interactions, /QUICK_LIMIT\s*=\s*6/);
  assert.match(interactions, /data-quick-hidden/);
  assert.match(interactions, /Need something else\? Type the exercise name above\./);
});

test("Cancel Workout abandons one session instead of live multi-table deletion", () => {
  assert.match(interactions, /status:\s*"abandoned"/);
  assert.match(interactions, /completed_at:\s*null/);
  assert.match(interactions, /ari_workout_sessions/);
  assert.match(interactions, /WorkoutProgressStore\?\.cancelDay/);
  assert.doesNotMatch(interactions, /ari_workout_session_sets[\s\S]*\.delete\(/);
  assert.doesNotMatch(interactions, /ari_workout_session_exercises[\s\S]*\.delete\(/);
});

test("Training interaction repair loads only on ARI Training", () => {
  assert.match(supabaseConfig, /shouldLoadTrainingInteractions/);
  assert.match(supabaseConfig, /ari-training\.html/);
  assert.match(supabaseConfig, /training-live-interactions\.js\?v=1\.0\.1/);
  assert.match(supabaseConfig, /script\.type\s*=\s*"module"/);
});
