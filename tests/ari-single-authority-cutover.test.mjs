import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const nutrition = fs.readFileSync("nutrition.html", "utf8");
const auth = fs.readFileSync("js/auth.js", "utf8");
const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");
const core = fs.readFileSync("calbuddy-core.js", "utf8");
const legacyRouter = fs.readFileSync("ari/intent/ari-central-intent-router.js", "utf8");
const legacyMeal = fs.readFileSync("ari/actions/ari-meal-action.js", "utf8");
const legacyWorkout = fs.readFileSync("ari/actions/ari-workout-plan-action.js", "utf8");
const activityGuard = fs.readFileSync("js/ari-activity-guard.js", "utf8");

test("Home and Nutrition directly load the canonical vNext runtime", () => {
  assert.match(home, /calbuddy-core\.js\?v=3\.8\.0[\s\S]*ari\/runtime\/ari-runtime-controller\.js\?v=1\.4\.0/);
  assert.match(nutrition, /calbuddy-core\.js\?v=3\.8\.0[\s\S]*ari\/runtime\/ari-runtime-controller\.js\?v=1\.4\.0/);
});

test("normal Home/Nutrition bootstrap does not load competing semantic wrappers", () => {
  const active = [home, nutrition, auth].join("\n");
  for (const removed of [
    "ari-rebirth-app-bridge.js",
    "ari/actions/ari-meal-action.js",
    "ari/actions/ari-workout-plan-action.js",
    "ari/intent/ari-central-intent-router.js",
    "ari/runtime/ari-conversation-router.js",
    "ari/runtime/ari-fast-conversation.js",
    "js/ari-activity-guard.js"
  ]) {
    assert.doesNotMatch(active, new RegExp(removed.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
});

test("legacy semantic wrappers are inert compatibility tombstones", () => {
  assert.doesNotMatch(legacyRouter, /CalBuddy\.askAri\s*=/);
  assert.doesNotMatch(legacyMeal, /_askAriInternal\s*=/);
  assert.doesNotMatch(legacyWorkout, /_askAriInternal\s*=/);
  assert.doesNotMatch(activityGuard, /prepareCalBuddyAction\s*=|CalBuddy\.askAri\s*=/);
  assert.match(legacyRouter, /semanticAuthority:\s*false/);
  assert.match(legacyMeal, /semanticAuthority:\s*false/);
  assert.match(legacyWorkout, /semanticAuthority:\s*false/);
});

test("legacy fallback is explicitly read-only and skips legacy action detection", () => {
  assert.match(runtime, /runReadOnlyLegacyFallback/);
  assert.match(runtime, /readOnlyFallback:\s*true/);
  assert.match(runtime, /pendingAction:\s*null/);
  assert.match(core, /readOnlyFallback = false/);
  assert.match(core, /if \(!readOnlyFallback\)[\s\S]*detectAriActionFromMessage/);
});

test("runtime controller is the only normal CalBuddy ask authority after bootstrap", () => {
  assert.match(runtime, /CalBuddy\.askAri = ask/);
  assert.doesNotMatch(auth, /ariCentralIntentRouterScript|ariMealActionScript/);
});
