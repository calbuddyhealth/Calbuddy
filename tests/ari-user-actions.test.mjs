import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const compatibility = fs.readFileSync(path.join(root, "js/ari-user-actions.js"), "utf8");
const meals = fs.readFileSync(path.join(root, "ari/actions/ari-meal-action.js"), "utf8");
const workouts = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");
const core = fs.readFileSync(path.join(root, "calbuddy-core.js"), "utf8");

test("legacy Ari user actions loader no longer contains meal or workout business logic", () => {
  assert.match(auth, /ari-user-actions\.js\?v=1\.0\.0/);
  assert.match(compatibility, /ari\/actions\/ari-meal-action\.js/);
  assert.doesNotMatch(compatibility, /WorkoutBuilder/);
  assert.doesNotMatch(compatibility, /extractMealName/);
  assert.doesNotMatch(compatibility, /getLastAriMealEstimate/);
});

test("meal logging has one current-turn action originator", () => {
  assert.match(meals, /SINGLE originator for Ari-created meal-log mutations/);
  assert.match(meals, /ari_meal_action_v1_current_turn/);
  assert.match(meals, /result\?\.mealEstimate/);
  assert.match(meals, /protein_g/);
  assert.match(meals, /carbs_g/);
  assert.match(meals, /fat_g/);
  assert.doesNotMatch(meals, /getLastAriMealEstimate/);
  assert.match(core, /if \(type === "log_meal"\) return await CalBuddy\.logMeal\(payload\)/);
});

test("meal titles come from structured estimates instead of raw user sentences", () => {
  assert.match(meals, /normalizeMealTitle/);
  assert.match(meals, /estimate\.description/);
  assert.match(meals, /estimate\.foods/);
  assert.match(meals, /\.join\(" \+ "\)/);
  assert.match(meals, /title\.length > 72/);
});

test("training remains isolated in the dedicated workout action service", () => {
  assert.match(workouts, /SINGLE originator for Ari-created workout-plan mutations/);
  assert.doesNotMatch(meals, /WorkoutPlanController/);
  assert.doesNotMatch(compatibility, /create_workout_plan/);
});
