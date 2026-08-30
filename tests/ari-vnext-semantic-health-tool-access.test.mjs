import test from "node:test";
import assert from "node:assert/strict";

import { getAriTools, toolToApplicationAction, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

const neutralRoute = {
  nutrition: false,
  training: false,
  goals: false,
  social: false,
  circleAllowed: false,
  teenMode: false
};

function toolNames(route = neutralRoute) {
  return new Set(getAriTools(route).map((tool) => tool?.name).filter(Boolean));
}

function mealArguments() {
  return {
    name: "High Noon Raspberry Vodka Seltzer",
    quantity: 1,
    unit: "can",
    servingSize: "1 can",
    mealCategory: "Snack",
    calories: 100,
    proteinG: 0,
    carbsG: 2.6,
    fatG: 0,
    notes: "Brand nutrition resolved by Ari."
  };
}

test("core health mutation capabilities remain visible when context routing misses the domain", () => {
  const names = toolNames();

  for (const name of [
    "propose_log_meal",
    "propose_today_meal_plan",
    "propose_log_planned_meal",
    "propose_log_activity",
    "propose_workout_plan",
    "propose_edit_workout",
    "propose_cancel_workout",
    "propose_log_weight",
    "propose_update_goal"
  ]) {
    assert.equal(names.has(name), true, name);
  }
});

test("semantic capability exposure does not turn on unrelated experiment or Circle mutations", () => {
  const names = toolNames();

  assert.equal(names.has("propose_track_experiment"), false);
  assert.equal(names.has("propose_complete_experiment"), false);
  assert.equal(names.has("propose_cancel_experiment"), false);
  assert.equal(names.has("propose_create_circle_meetup"), false);
  assert.equal(names.has("propose_create_circle_crew"), false);
});

test("trusted validation accepts a resolved meal even when the context router missed nutrition", () => {
  const result = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(mealArguments())
  }, neutralRoute);

  assert.equal(result.valid, true, result.error);
  assert.equal(result.arguments.name, "High Noon Raspberry Vodka Seltzer");
  assert.equal(result.arguments.calories, 100);
});

test("workout cancellation requires an exact resolved calendar date", () => {
  const valid = validateToolCall({
    name: "propose_cancel_workout",
    arguments: JSON.stringify({ scheduledDate: "2026-08-30" })
  }, neutralRoute);
  assert.equal(valid.valid, true, valid.error);
  assert.equal(valid.arguments.scheduledDate, "2026-08-30");
  assert.equal(toolToApplicationAction("propose_cancel_workout"), "cancel_workout");

  const unresolved = validateToolCall({
    name: "propose_cancel_workout",
    arguments: JSON.stringify({ scheduledDate: "today" })
  }, neutralRoute);
  assert.equal(unresolved.valid, false);
  assert.equal(unresolved.error, "workout_cancel_exact_date_required");
});

test("teen entitlement still prevents adult goal mutation capability", () => {
  const names = toolNames({ ...neutralRoute, teenMode: true });

  assert.equal(names.has("propose_log_weight"), true);
  assert.equal(names.has("propose_update_goal"), false);
});
