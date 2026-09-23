import test from "node:test";
import assert from "node:assert/strict";

import {
  enrichMealFunctionCall,
  hasCompleteMealNutrition,
  markModelEstimateWhenNeeded
} from "../api/_lib/ari-vnext/orchestrator.js";

function mealCall(args) {
  return {
    type: "function_call",
    name: "propose_log_meal",
    call_id: "call-meal-1",
    arguments: JSON.stringify(args)
  };
}

function parse(call) {
  return JSON.parse(call.arguments);
}

test("complete model nutrition is immediately usable even when registry enrichment misses", async () => {
  const calls = [];
  const functionCall = mealCall({
    name: "Apple Pie",
    quantity: 1,
    unit: "slice",
    servingSize: "1 slice",
    mealCategory: "Dessert",
    calories: 350,
    proteinG: 4,
    carbsG: 52,
    fatG: 15,
    notes: ""
  });

  const result = await enrichMealFunctionCall({
    functionCall,
    turn: { message: "I had a slice of apple pie. Can you log that?" },
    nutritionResolver: async (input) => {
      calls.push(input);
      return { resolved: false, reason: "no_strong_food_match", source: "ari_canonical_food_registry" };
    }
  });

  const args = parse(result.functionCall);
  assert.equal(args.calories, 350);
  assert.equal(args.proteinG, 4);
  assert.equal(args.carbsG, 52);
  assert.equal(args.fatG, 15);
  assert.match(args.notes, /Estimated by Ari/i);
  assert.equal(result.nutritionResolution.source, "ari_model_estimate");
  assert.equal(result.nutritionResolution.reason, "model_estimate_primary");
  assert.equal(calls[0].canonicalOnly, true);
  assert.equal(calls[0].allowExternal, false);
});

test("ordinary zucchini estimate does not require a database record", async () => {
  const functionCall = mealCall({
    name: "Zucchini",
    quantity: 1,
    unit: "zucchini",
    servingSize: "1 medium zucchini",
    mealCategory: "Meal",
    calories: 33,
    proteinG: 2.4,
    carbsG: 6.1,
    fatG: 0.6,
    notes: "Estimated from a standard medium zucchini."
  });

  const result = await enrichMealFunctionCall({
    functionCall,
    turn: { message: "I had a zucchini can you log that" },
    nutritionResolver: async () => ({ resolved: false, reason: "no_strong_food_match" })
  });

  const args = parse(result.functionCall);
  assert.equal(args.calories, 33);
  assert.equal(args.proteinG, 2.4);
  assert.equal(result.nutritionResolution.source, "ari_model_estimate");
});

test("fuzzy or non-exact registry results cannot overwrite a complete model estimate", async () => {
  const functionCall = mealCall({
    name: "Apple Pie",
    quantity: 1,
    unit: "slice",
    servingSize: "1 slice",
    mealCategory: "Dessert",
    calories: 350,
    proteinG: 4,
    carbsG: 52,
    fatG: 15,
    notes: "Estimated by Ari."
  });

  const result = await enrichMealFunctionCall({
    functionCall,
    turn: { message: "Log one slice of apple pie" },
    nutritionResolver: async () => ({
      resolved: true,
      source: "ari_canonical_food_registry",
      arguments: {
        name: "Apple Pie",
        quantity: 1,
        unit: "slice",
        servingSize: "1 slice",
        mealCategory: "Dessert",
        calories: 510,
        proteinG: 8,
        carbsG: 75,
        fatG: 22,
        notes: "Fuzzy match."
      },
      match: { exactIdentity: false, verified: true }
    })
  });

  assert.equal(parse(result.functionCall).calories, 350);
  assert.equal(result.nutritionResolution.source, "ari_model_estimate");
});

test("exact canonical serving may upgrade a model estimate", async () => {
  const functionCall = mealCall({
    name: "Pepperoni Pizza",
    quantity: 1,
    unit: "slice",
    servingSize: "1 slice",
    mealCategory: "Meal",
    calories: 320,
    proteinG: 14,
    carbsG: 36,
    fatG: 14,
    notes: "Estimated by Ari."
  });

  const result = await enrichMealFunctionCall({
    functionCall,
    turn: { message: "Log one slice of pepperoni pizza" },
    nutritionResolver: async () => ({
      resolved: true,
      source: "ari_canonical_food_registry",
      arguments: {
        name: "Pepperoni Pizza",
        quantity: 1,
        unit: "slice",
        servingSize: "1 slice",
        mealCategory: "Meal",
        calories: 300,
        proteinG: 13,
        carbsG: 34,
        fatG: 13,
        notes: "Canonical serving."
      },
      match: { exactIdentity: true, verified: true }
    })
  });

  assert.equal(parse(result.functionCall).calories, 300);
  assert.equal(result.nutritionResolution.source, "ari_canonical_food_registry");
});

test("incomplete model nutrition may still be deterministically filled by the registry without another model call", async () => {
  const functionCall = mealCall({
    name: "Banana",
    quantity: 1,
    unit: "banana",
    servingSize: "1 medium banana",
    mealCategory: "Snack",
    calories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    notes: ""
  });

  const result = await enrichMealFunctionCall({
    functionCall,
    turn: { message: "Log a banana" },
    nutritionResolver: async (input) => {
      assert.equal(input.canonicalOnly, false);
      assert.equal(input.allowExternal, true);
      return {
        resolved: true,
        source: "ari_canonical_food_registry",
        arguments: {
          name: "Banana",
          quantity: 1,
          unit: "banana",
          servingSize: "1 medium banana",
          mealCategory: "Snack",
          calories: 105,
          proteinG: 1.3,
          carbsG: 27,
          fatG: 0.4,
          notes: "Canonical serving."
        },
        match: { exactIdentity: true, verified: true }
      };
    }
  });

  assert.equal(parse(result.functionCall).calories, 105);
});

test("meal nutrition completeness accepts realistic estimates and rejects malformed values", () => {
  assert.equal(hasCompleteMealNutrition({ calories: 350, proteinG: 4, carbsG: 52, fatG: 15 }), true);
  assert.equal(hasCompleteMealNutrition({ calories: 0, proteinG: 4, carbsG: 52, fatG: 15 }), false);
  assert.equal(hasCompleteMealNutrition({ calories: 350, proteinG: null, carbsG: 52, fatG: 15 }), false);
});

test("user-supplied complete nutrition is not mislabeled as an estimate", () => {
  const args = markModelEstimateWhenNeeded(
    { calories: 400, proteinG: 10, carbsG: 40, fatG: 20, notes: "" },
    "It was 400 calories, 10g protein, 40g carbs, and 20g fat."
  );
  assert.equal(args.notes, "");
});
