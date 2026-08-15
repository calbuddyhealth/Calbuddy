import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const meals = fs.readFileSync(path.join(root, "ari/actions/ari-meal-action.js"), "utf8");
const workouts = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");
const nutritionUi = fs.readFileSync(path.join(root, "ari/actions/ari-nutrition-action-ui.js"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "js/nutrition.js"), "utf8");
const core = fs.readFileSync(path.join(root, "calbuddy-core.js"), "utf8");

test("Home and Nutrition share the canonical Ari meal service", () => {
  assert.match(auth, /currentAriSurface/);
  assert.match(auth, /surface !== "home" && surface !== "nutrition"/);
  assert.match(auth, /ari\/actions\/ari-meal-action\.js\?v=1\.0\.0/);
  assert.doesNotMatch(auth, /ari-user-actions\.js/);
});

test("Nutrition uses the same canonical workout service as Home", () => {
  assert.match(auth, /bootstrapAriWorkoutActionForNutrition/);
  assert.match(auth, /ari\/actions\/ari-workout-plan-action\.js\?v=2\.0\.0/);
  assert.match(workouts, /SINGLE originator for Ari-created workout-plan mutations/);
});

test("both Ari composers call the shared CalBuddy runtime", () => {
  assert.match(nutrition, /window\.CalBuddy\.askAri/);
  assert.match(nutrition, /page:\s*"nutrition"/);
  assert.match(core, /CalBuddy\.askAri/);
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

test("Nutrition action UI presents shared actions but never creates them", () => {
  assert.match(nutritionUi, /confirmPendingAction/);
  assert.match(nutritionUi, /cancelPendingAction/);
  assert.match(nutritionUi, /calbuddy:pendingAction/);
  assert.doesNotMatch(nutritionUi, /createPendingAction/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"log_meal"/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"plan_workout"/);
});

test("training remains isolated in the dedicated workout action service", () => {
  assert.match(workouts, /SINGLE originator for Ari-created workout-plan mutations/);
  assert.doesNotMatch(meals, /WorkoutPlanController/);
  assert.doesNotMatch(meals, /create_workout_plan/);
});
