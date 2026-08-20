import assert from "node:assert/strict";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";

function validPlanArguments() {
  return {
    summary: "A balanced lunch and dinner for the rest of today.",
    budgetBasis: "daily_goal",
    targetCalories: 1200,
    meals: [
      {
        mealSlot: "lunch",
        name: "Chicken rice bowl",
        calories: 520,
        proteinG: 46,
        carbsG: 55,
        fatG: 13,
        servingSize: "1 bowl",
        items: [
          { name: "Chicken breast", amount: "6 oz", calories: 280, proteinG: 52, carbsG: 0, fatG: 6 },
          { name: "Rice", amount: "3/4 cup", calories: 180, proteinG: 4, carbsG: 40, fatG: 1 },
          { name: "Vegetables", amount: "1 cup", calories: 60, proteinG: 2, carbsG: 15, fatG: 0 }
        ],
        notes: ""
      },
      {
        mealSlot: "dinner",
        name: "Salmon potato plate",
        calories: 650,
        proteinG: 45,
        carbsG: 58,
        fatG: 25,
        servingSize: "1 plate",
        items: [
          { name: "Salmon", amount: "6 oz", calories: 360, proteinG: 39, carbsG: 0, fatG: 22 },
          { name: "Potato", amount: "10 oz", calories: 220, proteinG: 5, carbsG: 50, fatG: 0 },
          { name: "Green beans", amount: "1 cup", calories: 70, proteinG: 2, carbsG: 8, fatG: 0 }
        ],
        notes: ""
      }
    ]
  };
}

{
  const route = routeContext({
    message: "Make me a meal plan for today based on my daily calorie intake.",
    history: [],
    context: {}
  });

  assert.equal(route.nutrition, true, "meal plan should load Nutrition context");
  assert.equal(route.currentInfo, false, "app-local 'today' must not trigger live web/current-info routing");
  assert.equal(route.complexity, "standard", "routine meal planning should use the standard economy path");

  const policy = resolveModelPolicy(route);
  assert.equal(policy.mode, "standard");
  assert.equal(policy.model, process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini");
  assert.ok(policy.maxOutputTokens >= 1800, "structured meal plans need sufficient output room");
}

{
  const tools = getAriTools({ nutrition: true });
  assert.ok(tools.some((tool) => tool.name === "propose_today_meal_plan"));
  assert.ok(tools.some((tool) => tool.name === "propose_log_planned_meal"));
  assert.equal(toolToApplicationAction("propose_today_meal_plan"), "plan_meal");
  assert.equal(toolToApplicationAction("propose_log_planned_meal"), "log_planned_meal");
}

{
  const validation = validateToolCall({
    name: "propose_today_meal_plan",
    arguments: JSON.stringify(validPlanArguments())
  }, { nutrition: true });

  assert.equal(validation.valid, true, validation.error || "valid plan rejected");
}

{
  const duplicate = validPlanArguments();
  duplicate.meals[1].mealSlot = "lunch";
  const validation = validateToolCall({
    name: "propose_today_meal_plan",
    arguments: JSON.stringify(duplicate)
  }, { nutrition: true });

  // Tool normalization intentionally collapses duplicate model rows for the
  // same meal slot into one meal so the executor cannot persist two active
  // lunches. The nutrition/components from both rows must be preserved.
  assert.equal(validation.valid, true, validation.error || "same-slot normalization failed");
  assert.equal(validation.arguments.meals.length, 1);
  assert.equal(validation.arguments.meals[0].mealSlot, "lunch");
  assert.equal(validation.arguments.meals[0].calories, 1170);
  assert.equal(validation.arguments.meals[0].items.length, 6);
}

{
  const route = routeContext({
    message: "What is the weather today?",
    history: [],
    context: {}
  });
  assert.equal(route.currentInfo, true, "real live-info requests must still use current-info routing");
}

console.log("ari-vnext-meal-plan-tool.test.mjs passed");