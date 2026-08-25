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
const mealAdapter = read("ari/vnext/ari-vnext-meal-plan-adapter.js");
const contextGuard = read("ari/vnext/ari-vnext-context-guard.js");

assert.match(runtime, /const DEFAULT_MODE = "vnext"/, "vNext must remain the default Ari runtime");
assert.match(runtime, /ari-vnext-meal-plan-adapter\.js\?v=1\.0\.1/, "runtime must boot the trusted Meal Plan adapter");
assert.match(runtime, /ari-vnext-context-guard\.js\?v=1\.1\.0/, "runtime must boot the canonical context/continuity guard");
assert.match(runtime, /AriVNextMealPlanAdapter\?\.ready === true/, "runtime must wait for Meal Plan adapter readiness");
assert.match(runtime, /AriVNextContextGuard\?\.ready === true/, "runtime must wait for canonical context guard readiness");

assert.match(router, /ari-runtime-controller\.js\?v=1\.3\.5/, "shared Home/Nutrition router must boot the repaired unified runtime controller");
assert.doesNotMatch(router, /appendOrderedScript\([\s\S]{0,120}ari-vnext-context-guard\.js/, "router should not independently race the runtime controller for vNext brain dependencies");
assert.match(auth, /ari-central-intent-router\.js\?v=1\.5\.3/, "auth bootstrap must request the repaired shared router version");

assert.match(mealAdapter, /window\.AriVNextMealPlanAdapter =/, "Meal Plan adapter must expose readiness state");
assert.match(mealAdapter, /window\.AriVNextMealPlanAdapter\.ready = true/, "Meal Plan adapter must signal ready only after trusted action wrapping");
assert.match(contextGuard, /window\.AriVNextContextGuard =/, "context guard must expose readiness state");
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
