import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const home = fs.readFileSync(path.join(root, "home.html"), "utf8");
const nutritionHtml = fs.readFileSync(path.join(root, "nutrition.html"), "utf8");
const runtime = fs.readFileSync(path.join(root, "ari/runtime/ari-runtime-controller.js"), "utf8");
const legacyRouter = fs.readFileSync(path.join(root, "ari/intent/ari-central-intent-router.js"), "utf8");
const legacyMeal = fs.readFileSync(path.join(root, "ari/actions/ari-meal-action.js"), "utf8");
const legacyWorkout = fs.readFileSync(path.join(root, "ari/actions/ari-workout-plan-action.js"), "utf8");
const routerHandler = fs.readFileSync(path.join(root, "api/_lib/gateway/ari-intent-router-handler.js"), "utf8");
const tools = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/tools.js"), "utf8");
const orchestrator = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/orchestrator.js"), "utf8");
const nutritionUi = fs.readFileSync(path.join(root, "ari/actions/ari-nutrition-action-ui.js"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "js/nutrition.js"), "utf8");

test("Home and Nutrition use vNext directly instead of a second semantic browser router", () => {
  assert.match(home, /ari\\/runtime\\/ari-runtime-controller\\.js\\?v=1\\.4\\.0/);
  assert.match(nutritionHtml, /ari\\/runtime\\/ari-runtime-controller\\.js\\?v=1\\.4\\.0/);
  assert.doesNotMatch(auth, /ari-central-intent-router\\.js|ari-meal-action\\.js/);
  assert.doesNotMatch(home, /ari-workout-plan-action\\.js|ari-conversation-router\\.js|ari-fast-conversation\\.js/);
});

test("legacy semantic wrappers are decommissioned compatibility paths", () => {
  assert.match(legacyRouter, /semanticAuthority:\\s*false/);
  assert.match(legacyMeal, /semanticAuthority:\\s*false/);
  assert.match(legacyWorkout, /semanticAuthority:\\s*false/);
  assert.doesNotMatch(legacyRouter, /CalBuddy\\.askAri\\s*=/);
  assert.doesNotMatch(legacyMeal, /_askAriInternal\\s*=/);
  assert.doesNotMatch(legacyWorkout, /_askAriInternal\\s*=/);
});

test("vNext is the one normal application action authority", () => {
  assert.match(runtime, /CalBuddy\\.askAri = ask/);
  assert.match(tools, /propose_log_meal/);
  assert.match(tools, /propose_workout_plan/);
  assert.match(tools, /propose_log_activity/);
  assert.match(orchestrator, /createPendingAction/);
});

test("legacy intent endpoint agrees that consumption alone is not write authorization", () => {
  assert.match(routerHandler, /Consumption alone is not write authorization/);
  assert.match(routerHandler, /I ate an egg roll, log it/);
  assert.match(routerHandler, /action="none"/);
});

test("Meal Plan mutation paths remain removed", () => {
  assert.doesNotMatch(routerHandler, /\\bplan_meal\\b|\\blog_planned_meal\\b|\\bmeal_plan\\b/);
  assert.match(routerHandler, /Meal planning is advisory conversation only/);
});

test("both visible composers still call the shared CalBuddy runtime", () => {
  assert.match(nutrition, /window\\.CalBuddy\\.askAri/);
  assert.match(nutrition, /page:\\s*"nutrition"/);
  assert.match(runtime, /CalBuddy\\.askAri = ask/);
});

test("Nutrition UI presents confirmations but never invents domain actions", () => {
  assert.match(nutritionUi, /NUTRITION_ACTION_TYPES/);
  assert.match(nutritionUi, /confirmPendingAction/);
  assert.match(nutritionUi, /cancelPendingAction/);
  assert.doesNotMatch(nutritionUi, /createPendingAction/);
});
