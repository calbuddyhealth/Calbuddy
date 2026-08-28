import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const routerClient = fs.readFileSync(path.join(root, "ari/intent/ari-central-intent-router.js"), "utf8");
const routerHandler = fs.readFileSync(path.join(root, "api/_lib/gateway/ari-intent-router-handler.js"), "utf8");
const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");
const mealPlanAction = fs.readFileSync(path.join(root, "ari/actions/ari-meal-plan-action-v2.js"), "utf8");
const mealPlanGoalGuard = fs.readFileSync(path.join(root, "ari/actions/ari-meal-plan-goal-guard.js"), "utf8");
const nutritionPlanPolicy = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/nutrition-plan-policy.js"), "utf8");
const meals = fs.readFileSync(path.join(root, "ari/actions/ari-meal-action.js"), "utf8");
const workouts = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");
const nutritionUi = fs.readFileSync(path.join(root, "ari/actions/ari-nutrition-action-ui.js"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "js/nutrition.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home.html"), "utf8");
const core = fs.readFileSync(path.join(root, "calbuddy-core.js"), "utf8");

test("Home and Nutrition share one central intent gateway boundary", () => {
  assert.match(auth, /ari\/intent\/ari-central-intent-router\.js\?v=1\.5\.3/);
  assert.match(routerClient, /CalBuddy\.askAri = async function ariCentralIntentBoundary/);
  assert.match(routerClient, /intentDecision/);
  assert.match(routerClient, /\/api\/ari-intent-router/);
  assert.match(vercel, /"source": "\/api\/ari-intent-router"[\s\S]*"destination": "\/api\/secure-ai-gateway\?route=intent"/);
  assert.match(routerHandler, /response_format/);
  assert.match(routerHandler, /json_schema/);
  assert.match(routerHandler, /strict:\s*true/);
});

test("normal conversation bypasses the extra mutation preflight", () => {
  assert.match(routerClient, /const MUTATION_CUE_PATTERN/);
  assert.match(routerClient, /return !isLikelyMutationMessage\(message\)/);
  assert.match(routerClient, /Normal conversation, advice, questions, and greetings go directly to/);
});

test("explicit Meal Plan requests never ask users to restate app-owned calorie budget", () => {
  assert.match(routerHandler, /deterministicMealPlanDecision/);
  assert.match(routerHandler, /explicitPlanRequest/);
  assert.match(routerHandler, /action:\s*"plan_meal"/);
  assert.match(routerHandler, /needs_clarification:\s*false/);
  assert.match(routerHandler, /remaining calories, and Daily Calorie Goal are application context/);
  assert.match(routerHandler, /routeSource:\s*"deterministic_meal_plan"/);
});

test("today-only Meal Plan reads goal and consumption context itself", () => {
  assert.match(mealPlanAction, /calbuddyDailyCalorieGoal/);
  assert.match(mealPlanAction, /consumedCalories/);
  assert.match(mealPlanAction, /plannedCalories/);
  assert.match(mealPlanAction, /remainingCalories/);
  assert.match(mealPlanAction, /Daily calorie goal:/);
  assert.match(mealPlanAction, /Unallocated calories today:/);
});

test("Meal Plan product boundaries are server-owned and the legacy browser guard has no veto authority", () => {
  // Keep the old script load temporarily for compatibility with existing pages,
  // but it must no longer wrap the Ask Ari runtime or independently reject plans.
  assert.match(routerClient, /ari-meal-plan-goal-guard\.js\?v=1\.0\.0/);
  assert.match(mealPlanGoalGuard, /Compatibility shim only/);
  assert.doesNotMatch(mealPlanGoalGuard, /CalBuddy\._askAriInternal\s*=/);
  assert.doesNotMatch(mealPlanGoalGuard, /dailyCalorieGoal\(\) <= 0/);
  assert.match(nutritionPlanPolicy, /future_date_not_supported/);
  assert.match(nutritionPlanPolicy, /calorie_budget_required/);
  assert.match(nutritionPlanPolicy, /authorization itself was not rejected/);
});

test("central router is the authority over legacy action classification", () => {
  assert.match(routerClient, /centralIntentLegacyGate/);
  assert.match(routerClient, /clean\(decision\.action\) === "none"/);
  assert.match(routerClient, /\["nutrition", "training"\]/);
  assert.match(routerClient, /__activeIntentDecision/);
});

test("central router fails closed instead of letting AI invent app writes", () => {
  assert.match(routerClient, /I couldn’t verify that request with my action router/);
  assert.match(routerClient, /intentRouterError:\s*true/);
  assert.match(routerClient, /intentDecision\.confidence < 0\.8/);
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

test("training action meaning stays on Home/Training and never bootstraps through Nutrition", () => {
  assert.match(home, /ari\/actions\/ari-workout-plan-action\.js\?v=3\.0\.0/);
  assert.doesNotMatch(auth, /ari\/actions\/ari-workout-plan-action\.js\?v=3\.0\.0/);
  assert.doesNotMatch(auth, /bootstrapAriWorkoutActionForNutrition/);
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

test("Nutrition UI presents nutrition actions but never creates domain actions", () => {
  assert.match(nutritionUi, /NUTRITION_ACTION_TYPES/);
  assert.match(nutritionUi, /confirmPendingAction/);
  assert.match(nutritionUi, /cancelPendingAction/);
  assert.match(nutritionUi, /calbuddy:pendingAction/);
  assert.doesNotMatch(nutritionUi, /createPendingAction/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"log_meal"/);
  assert.doesNotMatch(nutritionUi, /action_type:\s*"plan_workout"/);
});
