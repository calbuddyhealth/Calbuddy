import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const nutrition = fs.readFileSync("nutrition.html", "utf8");
const auth = fs.readFileSync("js/auth.js", "utf8");
const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");
const core = fs.readFileSync("calbuddy-core.js", "utf8");

const deletedLegacyPaths = [
  "api/_lib/gateway/ari-intent-router-handler.js",
  "ari/intent/ari-central-intent-router.js",
  "ari/actions/ari-meal-action.js",
  "ari/actions/ari-workout-plan-action.js",
  "ari/runtime/ari-conversation-router.js",
  "ari/runtime/ari-fast-conversation.js",
  "ari/actions/ari-meal-plan-action-v2.js",
  "ari/actions/ari-meal-plan-goal-guard.js",
  "ari/vnext/ari-vnext-meal-plan-adapter.js",
  "assets/css/nutrition-meal-plan-today.css",
  "js/ari-activity-guard.js",
  "js/training/ari-whole-workout-replacement.js"
];

test("Home and Nutrition directly load the canonical vNext runtime", () => {
  assert.match(home, /calbuddy-core\.js\?v=3\.8\.0[\s\S]*ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.0/);
  assert.match(nutrition, /calbuddy-core\.js\?v=3\.8\.0[\s\S]*ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.0/);
});

test("normal Home/Nutrition bootstrap has no competing semantic wrappers", () => {
  const active = [home, nutrition, auth].join("\n");
  for (const removed of [
    "ari-rebirth-app-bridge.js",
    "ari/actions/ari-meal-action.js",
    "ari/actions/ari-workout-plan-action.js",
    "ari/intent/ari-central-intent-router.js",
    "ari/runtime/ari-conversation-router.js",
    "ari/runtime/ari-fast-conversation.js",
    "js/ari-activity-guard.js",
    "js/training/ari-whole-workout-replacement.js"
  ]) {
    assert.doesNotMatch(active, new RegExp(removed.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
});

test("confirmed dead legacy paths are physically removed", () => {
  for (const path of deletedLegacyPaths) {
    assert.equal(fs.existsSync(path), false, `${path} should remain deleted`);
  }
});

test("legacy fallback is read-only and cannot become a second write authority", () => {
  assert.match(runtime, /runReadOnlyLegacyFallback/);
  assert.match(runtime, /readOnlyFallback:\s*true/);
  assert.match(runtime, /pendingAction:\s*null/);
  assert.doesNotMatch(runtime, /legacy\.confirmPendingAction|legacy\.cancelPendingAction/);
  assert.match(core, /readOnlyFallback = false/);
});

test("runtime controller is the normal CalBuddy ask authority", () => {
  assert.match(runtime, /CalBuddy\.askAri = ask/);
  assert.doesNotMatch(auth, /ariCentralIntentRouterScript|ariMealActionScript/);
});
