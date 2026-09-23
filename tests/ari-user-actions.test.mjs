import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const auth = read("js/auth.js");
const home = read("home.html");
const nutritionHtml = read("nutrition.html");
const runtime = read("ari/runtime/ari-runtime-controller.js");
const tools = read("api/_lib/ari-vnext/tools.js");
const orchestrator = read("api/_lib/ari-vnext/orchestrator.js");
const verifier = read("api/_lib/ari-vnext/action-intent-verifier.js");
const adapter = read("ari/vnext/ari-vnext-action-adapter.js");
const nutritionUi = read("ari/actions/ari-nutrition-action-ui.js");
const nutrition = read("js/nutrition.js");

test("Home and Nutrition use vNext directly instead of browser semantic wrappers", () => {
  assert.match(home, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.1/);
  assert.match(nutritionHtml, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.1/);
  assert.doesNotMatch(auth, /ari-central-intent-router\.js|ari-meal-action\.js/);
  assert.doesNotMatch(home, /ari-workout-plan-action\.js|ari-conversation-router\.js|ari-fast-conversation\.js/);
});

test("removed legacy semantic/action files stay physically deleted", () => {
  for (const relative of [
    "api/_lib/gateway/ari-intent-router-handler.js",
    "ari/intent/ari-central-intent-router.js",
    "ari/actions/ari-meal-action.js",
    "ari/actions/ari-workout-plan-action.js",
    "ari/runtime/ari-conversation-router.js",
    "ari/runtime/ari-fast-conversation.js"
  ]) {
    assert.equal(fs.existsSync(path.join(root, relative)), false, `${relative} must remain deleted`);
  }
});

test("vNext is the one normal application action authority", () => {
  assert.match(runtime, /CalBuddy\.askAri = ask/);
  assert.match(tools, /propose_log_meal/);
  assert.match(tools, /propose_workout_plan/);
  assert.match(tools, /propose_log_activity/);
  assert.match(orchestrator, /createPendingAction/);
  assert.match(verifier, /semantic action verifier/i);
  assert.doesNotMatch(runtime, /legacy\.confirmPendingAction|legacy\.cancelPendingAction/);
});

test("bounded continuation is shared by primary reasoning and independent verification", () => {
  assert.match(orchestrator, /deriveAuthorizedActionContinuation/);
  assert.match(verifier, /deriveAuthorizedActionContinuation/);
  assert.match(verifier, /immediately preceding user already authorized one mutation/i);
});

test("whole-workout replacement is owned by the canonical adapter", () => {
  assert.match(adapter, /mapWorkoutReplacementValidated/);
  assert.match(adapter, /executeValidatedWorkoutReplacement/);
  assert.doesNotMatch(runtime, /ari-whole-workout-replacement/);
});

test("both visible composers call the shared CalBuddy runtime", () => {
  assert.match(nutrition, /window\.CalBuddy\.askAri/);
  assert.match(nutrition, /page:\s*"nutrition"/);
  assert.match(runtime, /CalBuddy\.askAri = ask/);
});

test("Nutrition UI presents confirmations but never invents domain actions", () => {
  assert.match(nutritionUi, /NUTRITION_ACTION_TYPES/);
  assert.match(nutritionUi, /confirmPendingAction/);
  assert.match(nutritionUi, /cancelPendingAction/);
  assert.doesNotMatch(nutritionUi, /createPendingAction/);
});
