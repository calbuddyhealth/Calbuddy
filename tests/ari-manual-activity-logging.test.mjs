import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getAriTools,
  validateToolCall,
  toolToApplicationAction
} from "../api/_lib/ari-vnext/tools.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import CalorieCalculator from "../js/training/energy/calorie-calculator.js";

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("manual activity request routes to Training and exposes the real logging tool", () => {
  const route = routeContext({
    message: "I ran for 20 minutes and burned 202 calories. Can you log that?",
    history: [],
    context: {}
  });
  assert.equal(route.training, true);

  const names = getAriTools(route).map((tool) => tool.name);
  assert.ok(names.includes("propose_log_activity"));
  assert.equal(toolToApplicationAction("propose_log_activity"), "log_activity");
});

test("completed activity vocabulary routes runs walks rides hikes and bodyweight work through Training", () => {
  const messages = [
    "I walked for 45 minutes, log it",
    "I biked for 30 minutes and burned 260 calories",
    "I hiked for 90 minutes",
    "I did 4 sets of 50 push-ups",
    "I swam for half an hour"
  ];

  for (const message of messages) {
    const route = routeContext({ message, history: [], context: {} });
    assert.equal(route.training, true, message);
  }
});

test("Ari activity tool preserves user-reported calories and structured workout details", () => {
  const validation = validateToolCall({
    name: "propose_log_activity",
    arguments: JSON.stringify({
      activityName: "Push-ups",
      durationMinutes: 10,
      sets: 4,
      repsPerSet: 50,
      caloriesBurned: 90,
      intensity: "vigorous",
      averageHeartRate: null,
      dateText: "today",
      notes: ""
    })
  }, { training: true });

  assert.equal(validation.valid, true);
  assert.equal(validation.arguments.caloriesBurned, 90);
  assert.equal(validation.arguments.sets, 4);
  assert.equal(validation.arguments.repsPerSet, 50);
});

test("Ari activity logging requires duration when calories are unknown", () => {
  const validation = validateToolCall({
    name: "propose_log_activity",
    arguments: JSON.stringify({
      activityName: "Run",
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
  const estimate = CalorieCalculator.estimateHybridSession({
    session: { title: "Run", exercises: [{ name: "Run" }] },
    weightLb: 190,
    durationMinutes: 20,
    intensity: "moderate"
  });

  assert.ok(estimate);
  assert.equal(estimate.estimated, true);
  assert.ok(Number(estimate.roundedCalories) > 0);
  assert.match(String(estimate.method), /estimate/i);
});

test("Training Quick Log loads from shared auth bootstrap and mounts opposite the date selector", () => {
  const auth = source("js/auth.js");
  const quickLog = source("js/training/activity-quick-log.js");

  assert.match(auth, /bootstrapTrainingQuickLog/);
  assert.match(auth, /activity-quick-log\.js\?v=1\.0\.0/);
  assert.match(quickLog, /\.ari-training-date-row/);
  assert.match(quickLog, /\+ Quick Log/);
  assert.match(quickLog, /activity \/ workout name/i);
  assert.match(quickLog, /Calories burned/);
  assert.match(quickLog, /Estimated from your Goals profile/i);
});

test("Quick Log and Ari share one profile-based calorie estimator and activity writer", () => {
  const service = source("js/training/activity-log-service.js");
  const quickLog = source("js/training/activity-quick-log.js");
  const adapter = source("ari/vnext/ari-vnext-activity-adapter.js");

  assert.match(service, /estimateHybridSession/);
  assert.match(service, /from\("profiles"\)/);
  assert.match(service, /from\("activity_logs"\)/);
  assert.match(service, /duration_minutes/);
  assert.match(service, /calorie_source/);
  assert.match(service, /user_reported/);
  assert.match(service, /profile_estimate/);
  assert.match(quickLog, /activity-log-service\.js/);
  assert.match(adapter, /activity-log-service\.js/);
});

test("Ari confirmation executes log_activity through the trusted writer instead of claiming success conversationally", () => {
  const adapter = source("ari/vnext/ari-vnext-activity-adapter.js");
  const controller = source("ari/runtime/ari-runtime-controller.js");

  assert.match(adapter, /type !== "log_activity"/);
  assert.match(adapter, /service\.logActivity/);
  assert.match(adapter, /throw new Error\(result\?\.message/);
  assert.match(controller, /ari-vnext-activity-adapter\.js\?v=1\.0\.0/);
  assert.match(controller, /legacy\.confirmPendingAction/);
});

test("Goals combines completed Training calories with activity_logs instead of maintaining competing totals", () => {
  const goalsSync = source("js/goals-activity-burn-sync.js");
  const auth = source("js/auth.js");

  assert.match(goalsSync, /from\("ari_workout_sessions"\)/);
  assert.match(goalsSync, /from\("activity_logs"\)/);
  assert.match(goalsSync, /const total = training \+ other/);
  assert.match(goalsSync, /Calories Burned/);
  assert.match(auth, /bootstrapGoalsActivityBurnSync/);
});

test("activity_logs migration stores structured manual workout details without creating another ledger", () => {
  const migration = source("supabase/migrations/20260819031500_extend_activity_logs_for_quick_log.sql");
  assert.match(migration, /alter table public\.activity_logs/);
  assert.match(migration, /sets integer/);
  assert.match(migration, /reps_per_set integer/);
  assert.match(migration, /average_heart_rate integer/);
  assert.match(migration, /calorie_source text/);
  assert.match(migration, /activity_logs_user_log_date_idx/);
  assert.doesNotMatch(migration, /create table/i);
});
