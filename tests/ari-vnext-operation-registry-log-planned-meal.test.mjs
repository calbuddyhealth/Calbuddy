import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "ari/vnext/ari-vnext-operation-registry.js"), "utf8");
const nutritionUi = fs.readFileSync(path.join(process.cwd(), "ari/actions/ari-nutrition-action-ui.js"), "utf8");

test("planned-meal logging is no longer an Ari operation", () => {
  assert.doesNotMatch(source, /["']log_planned_meal["']/);
  assert.doesNotMatch(source, /prepareLogPlannedMeal/);
});

test("Nutrition confirmation UI only owns normal meal logging", () => {
  assert.match(nutritionUi, /NUTRITION_ACTION_TYPES = new Set\(\["log_meal"\]\)/);
  assert.doesNotMatch(nutritionUi, /plan_meal|log_planned_meal|consume_meal_plan/);
});
