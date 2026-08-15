import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const routerClient = fs.readFileSync(path.join(root, "ari/intent/ari-central-intent-router.js"), "utf8");
const routerApi = fs.readFileSync(path.join(root, "api/ari-intent-router.js"), "utf8");
const meals = fs.readFileSync(path.join(root, "ari/actions/ari-meal-action.js"), "utf8");
const workouts = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");
const nutritionUi = fs.readFileSync(path.join(root, "ari/actions/ari-nutrition-action-ui.js"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "js/nutrition.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home.html"), "utf8");
const core = fs.readFileSync(path.join(root, "calbuddy-core.js"), "utf8");

test("Home and Nutrition share one OpenAI central intent router", () => {
  assert.match(auth, /ari\/intent\/ari-central-intent-router\.js\?v=1\.1\.0/);
  assert.match(routerClient, /CalBuddy\.askAri = async function ariCentralIntentBoundary/);
  assert.match(routerClient, /intentDecision/);
  assert.match(routerClient, /\/api\/ari-intent-router/);
  assert.match(routerApi, /response_format/);
  assert.match(routerApi, /json_schema/);
  assert.match(routerApi, /strict:\s*true/);
});

test("central router fails closed instead of letting AI invent app writes", () => {
  assert.match(routerClient, /I couldn’t verify that request with my action router/);
  assert.match(routerClient, /intentRouterError:\s*true/);
  assert.match(routerClient, /confidence < 0\.8/);
});

test("both Ari composers still call the shared CalBuddy runtime", () => {
  assert.match(nutrition, /window\.CalBuddy\.askAri/);
  assert.match(nutrition, /page:\s*"nutrition"/);
  assert.match(core, /CalBuddy\.askAri/);
});

test("meal action meaning comes only from the central intent decision", () => {
  assert.match(auth, /ari\/actions\/ari-meal-action\.js\?v=2\.0\.0/);
  assert.match(meals, /ari_meal_action_v2_central_router/);
  assert.match(meals, /isMealDecision\(decision/);
  assert.match(meals, /decision\.action/);
  assert.match(meals, /log_meal/);
  assert.doesNotMatch(meals, /function isMealLogRequest/);
  assert.doesNotMatch(meals, /directLogCommand/);
  assert.doesNotMatch(meals, /getLastAriMealEstimate/);
});

test("meal logging remains current-turn structured nutrition plus confirmation", () => {
  assert.match(meals, /requestCurrentTurnEstimate/);
  assert.match(meals, /history:\s*\[\]/);
  assert.match(meals, /protein_g/);
  assert.match(meals, /carbs_g/);
  assert.match(meals, /fat_g/);
  assert.match(meals, /reply:\s*pending\.confirmation_text/);
  assert.match(core, /if \(type === "log_meal"\) return await CalBuddy\.logMeal\(payload\)/);
});

test("training action meaning comes only from the central intent decision", () => {
  assert.match(home, /ari\/actions\/ari-workout-plan-action\.js\?v=3\.0\.0/);
  assert.match(auth, /ari\/actions\/ari-workout-plan-action\.js\?v=3\.0\.0/);
  assert.match(workouts, /ari_workout_action_v3_central_router/);
  assert.match(workouts, /isTrainingDecision\(decision/);
  assert.match(workouts, /plan_workout/);
  assert.match(workouts, /edit_workout/);
  assert.doesNotMatch(workouts, /looksLikeWorkoutPlanRequest/);
});

test("Training persistence still goes only through WorkoutPlanController", () => {
  assert.match(workouts, /workout-plan-controller\.js/);
  assert.doesNotMatch(workouts, /workout-plan-store\.js/);
  assert.doesNotMatch(workouts, /workout-plan-api\.js/);
});

test("Nutrition UI presents shared actions but never creates them", () => {
  assert.match(nutritionUi, /confirmPendingAction/);
  assert.match(nutritionUi, /cancelPendingAction/);
  assert.match(nutritionUi, /calbuddy:pendingAction/);
  assert.doesNotMatch(nutritionUi, /createPendingAction/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"log_meal"/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"plan_workout"/);
});
