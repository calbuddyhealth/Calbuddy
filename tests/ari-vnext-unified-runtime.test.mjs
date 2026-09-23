import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const runtime = read("ari/runtime/ari-runtime-controller.js");
const router = read("ari/intent/ari-central-intent-router.js");
const auth = read("js/auth.js");
const contextGuard = read("ari/vnext/ari-vnext-context-guard.js");

assert.match(runtime, /const DEFAULT_MODE = "vnext"/, "vNext must remain the default Ari runtime");
assert.doesNotMatch(runtime, /ari-vnext-meal-plan-adapter/, "runtime must not boot the removed Meal Plan adapter");
assert.match(runtime, /ari-vnext-context-guard\.js\?v=1\.2\.2/, "runtime must boot the canonical context/continuity guard");
assert.doesNotMatch(runtime, /AriVNextMealPlanAdapter/, "runtime must not wait on removed Meal Plan state");
assert.match(runtime, /AriVNextContextGuard\?\.ready === true/, "runtime must wait for canonical context guard readiness");
assert.match(runtime, /ari-vnext-initiative\.js\?v=1\.2\.1/, "runtime must cache-bust the simplified initiative loader");

assert.match(router, /ari-runtime-controller\.js\?v=1\.3\.13/, "shared Home/Nutrition router must boot the simplified unified runtime controller");
assert.doesNotMatch(router, /appendOrderedScript\([\s\S]{0,120}ari-vnext-context-guard\.js/, "router should not independently race the runtime controller for vNext brain dependencies");
assert.doesNotMatch(router, /ari-meal-plan-action-v2|ari-meal-plan-goal-guard/, "router must not load legacy Meal Plan services");
assert.match(auth, /ari-central-intent-router\.js\?v=1\.5\.7/, "auth bootstrap must request the simplified shared router version");
assert.match(auth, /ari-nutrition-action-ui\.js\?v=1\.3\.0/, "auth bootstrap must cache-bust the simplified nutrition action UI");

assert.match(contextGuard, /window\.AriVNextContextGuard =/, "context guard must expose readiness state");
assert.doesNotMatch(contextGuard, /readTodayPlannedMeals|nutrition_plan_items|mealPlan:\s*\{/, "removed Meal Plan state must not be hydrated into Ari context");
assert.match(contextGuard, /burnedAddsFoodAllowance: false/, "vNext nutrition context must not add exercise calories to food allowance");
assert.match(contextGuard, /unknownGoalMustRemainUnknown: true/, "vNext must never synthesize a missing Daily Calorie Goal");
assert.match(contextGuard, /ownerMode === true/, "Owner Mode should opt into the bounded peer-reflection path");

const world = deriveUserWorldModel({
  persisted: null,
  turn: { message: "Keep it concise." },
  context: {},
  communication: { detail: "brief", directness: "direct", tone: "natural" },
  selfModel: { current: { mode: "natural_conversation", familiarity: "established" } },
  coachingState: null,
  longitudinalState: null
});

assert.equal(world.responseProfile.familiarity, "established", "response profile should preserve self-model familiarity");
assert.equal(world.relationship.familiarity, "established", "relationship world state should preserve self-model familiarity");

console.log("ari-vnext-unified-runtime.test.mjs passed");
