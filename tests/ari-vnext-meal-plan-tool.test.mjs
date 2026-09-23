import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";

const root = process.cwd();
const verifier = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/action-intent-verifier.js"), "utf8");
const orchestrator = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/orchestrator.js"), "utf8");

{
  const route = routeContext({
    message: "Make me a meal plan for tomorrow.",
    history: [],
    context: {}
  });

  assert.equal(route.nutrition, true, "meal-planning language may still load Nutrition context for advice");
  assert.equal(route.currentInfo, false, "app-local planning language must not trigger live web/current-info routing");

  const names = new Set(getAriTools(route).map((tool) => tool.name));
  assert.equal(names.has("propose_log_meal"), true, "normal meal logging must remain available");
  assert.equal(names.has("propose_today_meal_plan"), false, "Meal Plan creation must not be exposed");
  assert.equal(names.has("propose_log_planned_meal"), false, "planned-meal logging must not be exposed");
  assert.equal(toolToApplicationAction("propose_today_meal_plan"), "none");
  assert.equal(toolToApplicationAction("propose_log_planned_meal"), "none");

  const rejected = validateToolCall({
    name: "propose_today_meal_plan",
    arguments: JSON.stringify({ summary: "test", meals: [] })
  }, route);
  assert.equal(rejected.valid, false);
  assert.equal(rejected.error, "tool_not_allowed_for_turn");
}

{
  const route = routeContext({
    message: "Create a leg workout tomorrow",
    history: [],
    context: {}
  });

  assert.equal(route.training, true);
  assert.equal(route.nutrition, false);
  const names = new Set(getAriTools(route).map((tool) => tool.name));
  assert.equal(names.has("propose_workout_plan"), true, "future workout creation must remain available");
}

assert.doesNotMatch(verifier, /blocked_future_meal_plan|blocked_missing_daily_goal/);
assert.doesNotMatch(orchestrator, /Meal Plan only tracks today|blocked_future_meal_plan|blocked_missing_daily_goal/);
assert.match(verifier, /Meal Plan is not an Ari application capability/);

console.log("ari-vnext-meal-plan-tool.test.mjs passed");
