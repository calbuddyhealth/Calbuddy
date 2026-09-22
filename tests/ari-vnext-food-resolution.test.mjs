import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCandidateNutrition,
  chooseStrongMatch,
  explicitNutritionFields,
  resolveMealNutritionFromFoodSearch
} from "../api/_lib/ari-vnext/food-resolution.js";

function chickFilAFood() {
  return {
    id: "cloud-chick-fil-a-spicy-chicken-biscuit",
    name: "Spicy Chicken Biscuit",
    displayName: "Chick-fil-A Spicy Chicken Biscuit",
    brand: "Chick-fil-A",
    aliases: ["spicy chicken biscuit", "chick fil a spicy biscuit"],
    verified: true,
    nutritionBasis: { type: "weight", amount: 100, unit: "g", grams: 100 },
    nutrition: {
      calories: 286.7,
      protein: 10.7,
      carbs: 31.3,
      fat: 12.7
    },
    servings: [
      { id: "label-serving", label: "1 sandwich", amount: 1, unit: "serving", grams: 150, isDefault: true }
    ],
    metadata: {
      confidence: 0.98,
      searchScore: 1400,
      sourceType: "ari_catalog",
      sourceProvider: "ARI Food Database",
      labelNutrition: {
        servingLabel: "1 sandwich",
        servingGrams: 150,
        calories: 430,
        protein: 16,
        carbs: 47,
        fat: 19
      }
    }
  };
}

test("strong ARI food search match replaces model-estimated meal nutrition", async () => {
  const result = await resolveMealNutritionFromFoodSearch({
    arguments: {
      name: "Chick-fil-A Spicy Chicken Biscuit",
      quantity: 1,
      unit: "sandwich",
      servingSize: "1 sandwich",
      mealCategory: "Breakfast",
      calories: 500,
      proteinG: 20,
      carbsG: 55,
      fatG: 25,
      notes: "Estimated by the model."
    },
    message: "I ate a spicy chicken chikfila biscuit sandwich. Log that",
    searchFn: async () => ({
      success: true,
      results: [chickFilAFood()],
      catalogHits: 1,
      externalSource: null
    })
  });

  assert.equal(result.resolved, true);
  assert.equal(result.arguments.calories, 430);
  assert.equal(result.arguments.proteinG, 16);
  assert.equal(result.arguments.carbsG, 47);
  assert.equal(result.arguments.fatG, 19);
  assert.deepEqual(result.appliedFields, ["calories", "proteinG", "carbsG", "fatG"]);
  assert.equal(result.match.verified, true);
  assert.match(result.arguments.notes, /ARI Food Database/);
});

test("food search preserves nutrition the user explicitly supplied while filling the rest", async () => {
  const result = await resolveMealNutritionFromFoodSearch({
    arguments: {
      name: "Chick-fil-A Spicy Chicken Biscuit",
      quantity: 1,
      unit: "sandwich",
      servingSize: "1 sandwich",
      mealCategory: "Breakfast",
      calories: 360,
      proteinG: 10,
      carbsG: 10,
      fatG: 10,
      notes: ""
    },
    message: "Log my Chick-fil-A spicy chicken biscuit. It was 360 calories.",
    searchFn: async () => ({
      success: true,
      results: [chickFilAFood()],
      catalogHits: 1,
      externalSource: null
    })
  });

  assert.equal(result.resolved, true);
  assert.equal(result.arguments.calories, 360);
  assert.equal(result.arguments.proteinG, 16);
  assert.equal(result.arguments.carbsG, 47);
  assert.equal(result.arguments.fatG, 19);
  assert.deepEqual(result.preservedExplicitFields, ["calories"]);
});

test("weak food matches are rejected instead of silently attaching the wrong nutrition", async () => {
  const unrelated = {
    ...chickFilAFood(),
    id: "cloud-chicken-noodle-soup",
    name: "Chicken Noodle Soup",
    displayName: "Generic Chicken Noodle Soup",
    brand: "",
    aliases: ["chicken soup"],
    verified: false,
    metadata: {
      ...chickFilAFood().metadata,
      confidence: 0.55,
      searchScore: 160,
      sourceProvider: "External Catalog"
    }
  };

  const result = await resolveMealNutritionFromFoodSearch({
    arguments: {
      name: "Chick-fil-A Spicy Chicken Biscuit",
      quantity: 1,
      unit: "sandwich"
    },
    message: "Log my Chick-fil-A spicy chicken biscuit.",
    searchFn: async () => ({ success: true, results: [unrelated] })
  });

  assert.equal(result.resolved, false);
  assert.equal(result.reason, "no_strong_food_match");
});

test("weight-based amounts calculate macros from the food nutrition basis", () => {
  const food = {
    name: "Chicken breast",
    displayName: "Chicken breast",
    verified: true,
    nutritionBasis: { type: "weight", amount: 100, unit: "g", grams: 100 },
    nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    metadata: {}
  };

  const result = calculateCandidateNutrition(food, { quantity: 200, unit: "g" });

  assert.equal(result.calories, 330);
  assert.equal(result.proteinG, 62);
  assert.equal(result.carbsG, 0);
  assert.equal(result.fatG, 7.2);
  assert.equal(result.servingResolution, "weight:200g");
});

test("explicit nutrition parser recognizes calories and individual macros", () => {
  const fields = explicitNutritionFields(
    "It was 520 calories, 32g protein, 44 g carbs, and fat 21g."
  );
  assert.deepEqual([...fields].sort(), ["calories", "carbsG", "fatG", "proteinG"].sort());
});

test("match scoring accepts a real branded identity and rejects token overlap alone", () => {
  const strong = chooseStrongMatch(
    "Chick-fil-A Spicy Chicken Biscuit",
    [chickFilAFood()]
  );
  assert.ok(strong);
  assert.equal(strong.exactIdentity, true);

  const weak = chooseStrongMatch(
    "Chick-fil-A Spicy Chicken Biscuit",
    [{
      ...chickFilAFood(),
      name: "Chicken Biscuit Crackers",
      displayName: "Other Brand Chicken Biscuit Crackers",
      brand: "Other Brand",
      verified: false,
      aliases: [],
      metadata: { confidence: 0.5, searchScore: 100 }
    }]
  );
  assert.equal(weak, null);
});
