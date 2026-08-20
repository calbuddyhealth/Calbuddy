import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tools = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/tools.js"), "utf8");
const router = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/context-router.js"), "utf8");
const adapter = fs.readFileSync(path.join(root, "ari/vnext/ari-vnext-action-adapter.js"), "utf8");
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

test("shared Training calorie engine produces a profile-based activity estimate", () => {
  assert.doesNotThrow(() => new Function(service));
  assert.match(service, /estimateActivityCalories/);
  assert.match(service, /estimateFromHeartRate/);
  assert.match(service, /estimateFromMet/);

  const estimates = [];
  const factory = new Function("window", "document", "CustomEvent", `${service}; return window.AriActivityLogService;`);
  const mockWindow = {
    localStorage: { getItem: () => null, setItem: () => {} },
    CalBuddy: {},
    dispatchEvent: () => {}
  };
  const api = factory(mockWindow, {}, class CustomEvent {});
  const estimate = api.estimateActivityCalories({
    activityName: "Walking",
    durationMinutes: 30,
    profile: { weightLb: 185, age: 34, sex: "male", restingHr: 60, estimatedMaxHr: 186 }
  });
  estimates.push(estimate);
  assert.ok(estimate);
  assert.equal(estimate.estimated, true);
  assert.ok(Number(estimate.roundedCalories) > 0);
  assert.match(String(estimate.method), /estimate/i);
});

test("Training Quick Log loads from shared auth bootstrap and mounts opposite the date selector", () => {
  const auth = source("js/auth.js");
  const quickLog = source("js/training/activity-quick-log.js");

  assert.match(auth, /bootstrapTrainingQuickLog/);
  assert.match(auth, /activity-quick-log\.js\?v=1\.1\.0/);
  assert.match(quickLog, /\.ari-training-date-row/);
  assert.match(quickLog, /\+ Quick Log/);
  assert.match(quickLog, /activity \/ workout name/i);
  assert.match(quickLog, /Calories burned/);
  assert.match(quickLog, /Estimated from your Goals profile/i);
});

test("Quick Log and Ari share one profile-based calorie estimator and activity writer", () => {
  assert.match(quickLog, /AriActivityLogService/);
  assert.match(adapter, /AriActivityLogService/);
  assert.match(quickLog, /saveActivity/);
  assert.match(adapter, /saveActivity/);
});

test("Ari confirmation executes log_activity through the trusted writer instead of claiming success conversationally", () => {
  assert.match(adapter, /actionType === "log_activity"/);
  assert.match(adapter, /await executeLogActivity/);
  assert.match(adapter, /AriActivityLogService\.saveActivity/);
  assert.match(adapter, /saved?.id/);
});

test("Goals combines completed Training calories with activity_logs instead of maintaining competing totals", () => {
  assert.doesNotThrow(() => new Function(goalsSync));
  assert.match(goalsSync, /activity_logs/);
  assert.match(goalsSync, /WorkoutPlanStore/);
  assert.match(goalsSync, /calbuddyCaloriesBurned/);
  assert.match(goalsSync, /calbuddyCaloriesBurnedDate/);
});

test("activity_logs migration stores structured manual workout details without creating another ledger", () => {
  assert.match(migration, /add column if not exists sets/i);
  assert.match(migration, /add column if not exists reps_per_set/i);
  assert.match(migration, /add column if not exists intensity/i);
  assert.match(migration, /add column if not exists average_heart_rate/i);
  assert.doesNotMatch(migration, /create table/i);
});
