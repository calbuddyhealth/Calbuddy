import test from "node:test";
import assert from "node:assert/strict";

import {
  getAriTools,
  validateToolCall,
  toolToApplicationAction
} from "../api/_lib/ari-vnext/tools.js";

const nutritionRoute = {
  nutrition: true,
  training: false,
  goals: false,
  social: false,
  teenMode: false
};

function mealArguments(overrides = {}) {
  return {
    name: "Chicken and rice",
    quantity: 1,
    unit: "meal",
    servingSize: "1 plate",
    mealCategory: "Lunch",
    calories: 540,
    proteinG: 48,
    carbsG: 58,
    fatG: 12,
    notes: "Nutrition estimated by Ari.",
    ...overrides
  };
}

test("log_meal model contract requires resolved numeric nutrition", () => {
  const tool = getAriTools(nutritionRoute).find((entry) => entry.name === "propose_log_meal");
  assert.ok(tool);
  assert.equal(tool.parameters.properties.calories.type, "number");
  assert.equal(tool.parameters.properties.proteinG.type, "number");
  assert.equal(tool.parameters.properties.carbsG.type, "number");
  assert.equal(tool.parameters.properties.fatG.type, "number");
});

test("resolved log_meal proposal crosses the trusted application boundary", () => {
  const result = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(mealArguments())
  }, nutritionRoute);

  assert.equal(result.valid, true, result.error);
  assert.equal(toolToApplicationAction(result.name), "log_meal");
  assert.equal(result.arguments.calories, 540);
  assert.equal(result.arguments.proteinG, 48);
});

test("unresolved calories cannot become a pending executable meal", () => {
  const result = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(mealArguments({ calories: null }))
  }, nutritionRoute);

  assert.equal(result.valid, false);
  assert.equal(result.error, "meal_nutrition_required");
});

test("unresolved macros cannot become a pending executable meal", () => {
  for (const field of ["proteinG", "carbsG", "fatG"]) {
    const result = validateToolCall({
      name: "propose_log_meal",
      arguments: JSON.stringify(mealArguments({ [field]: null }))
    }, nutritionRoute);

    assert.equal(result.valid, false, field);
    assert.equal(result.error, "meal_nutrition_required", field);
  }
});

test("zero macros remain valid for foods that legitimately contain none", () => {
  const result = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(mealArguments({ proteinG: 0, carbsG: 0, fatG: 0, calories: 120 }))
  }, nutritionRoute);

  assert.equal(result.valid, true, result.error);
});
