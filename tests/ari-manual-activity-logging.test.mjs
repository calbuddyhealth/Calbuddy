import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tools = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/tools.js"), "utf8");
const runtime = fs.readFileSync(path.join(root, "ari/runtime/ari-runtime-controller.js"), "utf8");
const activityAdapter = fs.readFileSync(path.join(root, "ari/vnext/ari-vnext-activity-adapter.js"), "utf8");
const service = fs.readFileSync(path.join(root, "js/training/activity-log-service.js"), "utf8");
const quickLog = fs.readFileSync(path.join(root, "js/training/activity-quick-log.js"), "utf8");
const goalsSync = fs.readFileSync(path.join(root, "js/goals-activity-burn-sync.js"), "utf8");
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260819031500_extend_activity_logs_for_quick_log.sql"), "utf8");

function source(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

test("manual activity request routes to Training and exposes the real logging tool", async () => {
  const { routeContext } = await import(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url));
  const { getAriTools } = await import(new URL("../api/_lib/ari-vnext/tools.js", import.meta.url));
  const route = routeContext({ message: "Log that I walked for 30 minutes today." });
  assert.equal(route.training, true);
  assert.ok(getAriTools(route).some((tool) => tool.name === "propose_log_activity"));
});

test("completed activity vocabulary routes runs walks rides hikes and bodyweight work through Training", async () => {
  const { routeContext } = await import(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url));
  for (const message of [
    "Log my 5k run",
    "I walked for 45 minutes",
    "Record my bike ride",
    "I hiked for two hours",
    "Log 100 push-ups"
  ]) {
    assert.equal(routeContext({ message }).training, true, message);
  }
});

test("Ari activity tool preserves user-reported calories and structured workout details", async () => {
  const { validateToolCall } = await import(new URL("../api/_lib/ari-vnext/tools.js", import.meta.url));
  const validation = validateToolCall({
    name: "propose_log_activity",
    arguments: JSON.stringify({
      activityName: "Push-ups",
      durationMinutes: 20,
      sets: 5,
      repsPerSet: 20,
      caloriesBurned: 180,
      intensity: "moderate",
      averageHeartRate: 125,
      dateText: "today",
      notes: "manual activity"
    })
  }, { training: true });
  assert.equal(validation.valid, true, validation.error || "valid activity rejected");
  assert.equal(validation.arguments.caloriesBurned, 180);
  assert.equal(validation.arguments.sets, 5);
  assert.equal(validation.arguments.repsPerSet, 20);
});

test("Ari activity logging requires duration when calories are unknown", async () => {
  const { validateToolCall } = await import(new URL("../api/_lib/ari-vnext/tools.js", import.meta.url));
  const validation = validateToolCall({
    name: "propose_log_activity",
    arguments: JSON.stringify({
      activityName: "Walk",
      durationMinutes: null,
      sets: null,
      repsPerSet: null,
      caloriesBurned: null,
      intensity: "moderate",
      averageHeartRate: null,
      dateText: "today",
      notes: ""
    })
  }, { training: true });
  assert.equal(validation.valid, false);
  assert.equal(validation.error, "activity_duration_or_calories_required");
});

test("shared Training calorie engine produces a profile-based activity estimate", async () => {
  assert.match(service, /import CalorieCalculator from "\.\/energy\/calorie-calculator\.js"/);
  assert.match(service, /export default ActivityLogService/);

  const { estimateActivity } = await import(new URL("../js/training/activity-log-service.js", import.meta.url));
  const estimate = await estimateActivity({
    activityName: "Walking",
    durationMinutes: 30,
    intensity: "moderate"
  }, {
    weightLb: 185,
    age: 34,
    restingHeartRate: 60,
    maxHeartRate: 186
  });

  assert.equal(estimate.success, true, estimate.code || "activity estimate failed");
  assert.equal(estimate.estimated, true);
  assert.ok(Number(estimate.calories) > 0);
  assert.match(String(estimate.method), /estimate|hybrid|met|heart/i);
});

test("Training Quick Log loads from shared auth bootstrap and mounts opposite the date selector", () => {
  const currentAuth = source("js/auth.js");
  const currentQuickLog = source("js/training/activity-quick-log.js");

  assert.match(currentAuth, /bootstrapTrainingQuickLog/);
  assert.match(currentAuth, /activity-quick-log\.js\?v=1\.1\.0/);
  assert.match(currentQuickLog, /\.ari-training-date-row/);
  assert.match(currentQuickLog, /\+ Quick Log/);
  assert.match(currentQuickLog, /ACTIVITY \/ WORKOUT NAME/i);
  assert.match(currentQuickLog, /CALORIES BURNED/i);
  assert.match(currentQuickLog, /Estimated from your Goals profile/i);
});

test("Quick Log and Ari share one profile-based calorie estimator and activity writer", () => {
  assert.match(quickLog, /import\("\.\/activity-log-service\.js\?v=1\.1\.0"\)/);
  assert.match(quickLog, /service\.estimateActivity\(input\)/);
  assert.match(quickLog, /service\.logActivity\(input/);

  assert.match(activityAdapter, /import\("\.\.\/\.\.\/js\/training\/activity-log-service\.js\?v=1\.1\.0"\)/);
  assert.match(activityAdapter, /service\.prepareActivity\(/);
  assert.match(activityAdapter, /service\.logActivity\(action\?\.payload/);
});

test("Ari confirmation executes log_activity through the trusted activity adapter", () => {
  assert.match(runtime, /ari-vnext-activity-adapter\.js\?v=1\.1\.0/);
  assert.match(runtime, /AriVNextActionAdapter\.executeConfirmed/);
  assert.match(activityAdapter, /clean\(pendingAction\?\.name, 120\) === "log_activity"/);
  assert.match(activityAdapter, /action_type: "log_activity"/);
  assert.match(activityAdapter, /type !== "log_activity"/);
  assert.match(activityAdapter, /window\.CalBuddy\.executeAction = async function patchedExecute/);
  assert.match(activityAdapter, /await service\.logActivity/);
  assert.match(service, /client\.from\("activity_logs"\)\.insert/);
});

test("Goals combines completed Training calories with activity_logs instead of maintaining competing totals", () => {
  assert.doesNotThrow(() => new Function(goalsSync));
  assert.match(goalsSync, /ari_training_completed_sessions_v2/);
  assert.match(goalsSync, /ari_training_workout_progress_v3/);
  assert.match(goalsSync, /\.from\("ari_workout_sessions"\)/);
  assert.match(goalsSync, /\.from\("activity_logs"\)/);
  assert.match(goalsSync, /const training = Math\.max\(cloudTraining, localTrainingCalories\(key\)\)/);
  assert.match(goalsSync, /const total = training \+ other/);
});

test("activity_logs migration stores structured manual workout details without creating another ledger", () => {
  assert.match(migration, /add column if not exists sets/i);
  assert.match(migration, /add column if not exists reps_per_set/i);
  assert.match(migration, /add column if not exists intensity/i);
  assert.match(migration, /add column if not exists average_heart_rate/i);
  assert.doesNotMatch(migration, /create table/i);
});
