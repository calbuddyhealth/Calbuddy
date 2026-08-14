import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const actions = fs.readFileSync(path.join(root, "js/ari-user-actions.js"), "utf8");
const core = fs.readFileSync(path.join(root, "calbuddy-core.js"), "utf8");

test("home loads the deterministic Ari user action layer", () => {
  assert.match(auth, /ari-user-actions\.js\?v=1\.0\.0/);
  assert.match(auth, /script\.type\s*=\s*"module"/);
});

test("meal logging cannot end as a conversation-only promise", () => {
  assert.match(actions, /isMealLogRequest/);
  assert.match(actions, /action_type:\s*"log_meal"/);
  assert.match(actions, /createAndStorePendingAction/);
  assert.match(actions, /estimateMealThenConfirm/);
  assert.match(actions, /Do not say it was logged/);
  assert.match(core, /if \(type === "log_meal"\) return await CalBuddy\.logMeal\(payload\)/);
});

test("dated workout creation uses the existing Training builder and plan store", () => {
  assert.match(actions, /import WorkoutBuilder from "\.\/training\/workouts\/workout-builder\.js"/);
  assert.match(actions, /import WorkoutPlanStore from "\.\/training\/workout-plan-store\.js"/);
  assert.match(actions, /action_type:\s*"create_workout_plan"/);
  assert.match(actions, /WorkoutBuilder\.build\(options\)/);
  assert.match(actions, /WorkoutPlanStore\.setBuiltWorkout\(day, workout, \{ weekKey \}\)/);
});

test("workout requests require a date instead of assuming today", () => {
  assert.match(actions, /if \(!resolvedDate\)/);
  assert.match(actions, /what date do you want this workout for\?/i);
  assert.match(actions, /needsWorkoutDate:\s*true/);
  assert.match(actions, /ariPendingWorkoutDateRequest/);
});

test("relative and named workout dates resolve to exact calendar keys", () => {
  assert.match(actions, /\\btoday\\b/);
  assert.match(actions, /\\btomorrow\\b/);
  assert.match(actions, /WEEKDAYS/);
  assert.match(actions, /formatDateKey\(date\)/);
  assert.match(actions, /date:\s*resolvedDate\.dateKey/);
  assert.match(actions, /date_label:\s*resolvedDate\.label/);
});

test("date-only follow-up completes a waiting workout request", () => {
  assert.match(actions, /getPendingWorkoutRequest\(\)/);
  assert.match(actions, /resolvedFollowupDate = resolveWorkoutDate\(message\)/);
  assert.match(actions, /createWorkoutPendingAction\(waitingWorkout\.request, resolvedFollowupDate\)/);
});

test("confirmation says the exact resolved date before workout write", () => {
  assert.match(actions, /Add this workout to \$\{resolvedDate\.label\}\?/);
  assert.match(actions, /Done — I added \$\{workout\.title \|\| "your workout"\} to/);
});
