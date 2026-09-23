import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const runtime = read("ari/runtime/ari-runtime-controller.js");
const auth = read("js/auth.js");
const home = read("home.html");
const nutrition = read("nutrition.html");
const contextGuard = read("ari/vnext/ari-vnext-context-guard.js");

assert.match(runtime, /const DEFAULT_MODE = "vnext"/, "vNext must remain the default Ari runtime");
assert.match(runtime, /const VERSION = "1\.6\.0"/);
assert.match(runtime, /ari-vnext-action-adapter\.js\?v=1\.6\.0/);
assert.doesNotMatch(runtime, /ari-vnext-meal-plan-adapter|ari-whole-workout-replacement/);
assert.match(runtime, /ari-vnext-context-guard\.js\?v=1\.2\.3/);
assert.match(runtime, /AriVNextContextGuard\?\.ready === true/);
assert.match(runtime, /ari-vnext-initiative\.js\?v=1\.2\.1/);

assert.doesNotMatch(auth, /ari-central-intent-router\.js|ari-meal-action\.js/);
assert.match(auth, /ari-nutrition-action-ui\.js\?v=1\.3\.0/);
assert.match(home, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.0/);
assert.match(nutrition, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.0/);

assert.match(contextGuard, /window\.AriVNextContextGuard =/);
assert.doesNotMatch(contextGuard, /readTodayPlannedMeals|nutrition_plan_items|mealPlan:\s*\{/);
assert.match(contextGuard, /burnedAddsFoodAllowance: false/);
assert.match(contextGuard, /unknownGoalMustRemainUnknown: true/);
assert.match(contextGuard, /ownerMode === true/);

const world = deriveUserWorldModel({
  persisted: null,
  turn: { message: "Keep it concise." },
  context: {},
  communication: { detail: "brief", directness: "direct", tone: "natural" },
  selfModel: { current: { mode: "natural_conversation", familiarity: "established" } },
  coachingState: null,
  longitudinalState: null
});

assert.equal(world.responseProfile.familiarity, "established");
assert.equal(world.relationship.familiarity, "established");

console.log("ari-vnext-unified-runtime.test.mjs passed");
