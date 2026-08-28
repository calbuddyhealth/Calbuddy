// =====================================================
// ARI REBIRTH
// File: AriFoodEverydayBreakfastSides.js
// Version: 1.0.0
//
// Purpose:
//   Curated generic breakfast foods and common sides.
//
// Data policy:
//   - USDA FoodData Central / FNDDS is the reference anchor.
//   - One human food concept per record.
//   - Portions are servings, not duplicate food records.
//   - Generic prepared foods are representative estimates because
//     recipes and restaurants vary materially.
// =====================================================

(function initializeAriFoodEverydayBreakfastSides(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodEverydayBreakfastSides";
  const VERIFIED_AT = "2026-08-28";

  function food(id, displayName, aliases, tags, serving, nutrition) {
    return Object.freeze({
      id,
      name: displayName,
      displayName,
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "prepared",
      aliases,
      tags: ["prepared-meal", "generic", "everyday", ...tags],
      popularity: 100,
      nutritionBasis: {
        type: serving.unit === "cup" ? "volume" : "unit",
        amount: 1,
        unit: serving.unit,
        grams: serving.grams
      },
      nutrition,
      servings: [Object.freeze({
        id: "default-serving",
        label: serving.label,
        amount: 1,
        unit: serving.unit,
        grams: serving.grams,
        isDefault: true
      })],
      source: MODULE_NAME,
      verified: true,
      metadata: Object.freeze({
        foodFamily: "prepared-meals",
        genericFood: true,
        brandSpecific: false,
        curatedEverydayConcept: true,
        dataVerifiedAt: VERIFIED_AT,
        confidence: "medium",
        sourceProvenance: Object.freeze({
          provider: "USDA FoodData Central / FNDDS",
          sourceType: "curated representative generic prepared-food reference",
          verifiedAt: VERIFIED_AT
        }),
        offlineReference: true,
        estimate: true,
        notes: "Representative generic serving anchored to USDA FoodData Central/FNDDS prepared-food references. Recipes and restaurants can vary materially."
      })
    });
  }

  const FOODS = Object.freeze([
    food(
      "prepared-pancakes-plain",
      "Pancakes",
      ["pancakes", "plain pancakes", "breakfast pancakes"],
      ["breakfast", "pancakes"],
      { label: "2 medium pancakes", unit: "serving", grams: 150 },
      { calories: 340, protein: 9, carbs: 56, fat: 9, fiber: 2, sugar: 10, sodiumMg: 760 }
    ),
    food(
      "prepared-waffle-plain",
      "Waffle",
      ["waffle", "plain waffle", "breakfast waffle"],
      ["breakfast", "waffle"],
      { label: "1 round waffle", unit: "waffle", grams: 75 },
      { calories: 220, protein: 6, carbs: 27, fat: 10, fiber: 1, sugar: 6, sodiumMg: 380 }
    ),
    food(
      "prepared-french-toast",
      "French Toast",
      ["french toast", "2 slices french toast"],
      ["breakfast", "french-toast"],
      { label: "2 slices", unit: "serving", grams: 130 },
      { calories: 300, protein: 10, carbs: 37, fat: 12, fiber: 2, sugar: 9, sodiumMg: 520 }
    ),
    food(
      "prepared-breakfast-burrito",
      "Breakfast Burrito",
      ["breakfast burrito", "egg breakfast burrito", "egg cheese burrito"],
      ["breakfast", "burrito"],
      { label: "1 burrito", unit: "burrito", grams: 250 },
      { calories: 500, protein: 23, carbs: 46, fat: 25, fiber: 4, sugar: 3, sodiumMg: 1050 }
    ),
    food(
      "prepared-breakfast-sandwich",
      "Breakfast Sandwich",
      ["breakfast sandwich", "egg and cheese sandwich", "sausage egg cheese sandwich"],
      ["breakfast", "sandwich"],
      { label: "1 sandwich", unit: "sandwich", grams: 170 },
      { calories: 430, protein: 20, carbs: 31, fat: 25, fiber: 2, sugar: 4, sodiumMg: 960 }
    ),
    food(
      "prepared-cheese-omelet",
      "Cheese Omelet",
      ["cheese omelet", "cheese omelette", "2 egg cheese omelet"],
      ["breakfast", "eggs", "omelet"],
      { label: "1 two-egg omelet", unit: "omelet", grams: 140 },
      { calories: 280, protein: 19, carbs: 3, fat: 21, fiber: 0, sugar: 2, sodiumMg: 520 }
    ),
    food(
      "prepared-mashed-potatoes",
      "Mashed Potatoes",
      ["mashed potatoes", "mashed potato"],
      ["side", "potatoes"],
      { label: "1 cup", unit: "cup", grams: 210 },
      { calories: 240, protein: 4, carbs: 35, fat: 10, fiber: 3, sugar: 3, sodiumMg: 650 }
    ),
    food(
      "prepared-french-fries",
      "French Fries",
      ["french fries", "fries", "fried potatoes"],
      ["side", "potatoes", "fried"],
      { label: "1 medium serving", unit: "serving", grams: 117 },
      { calories: 365, protein: 4, carbs: 48, fat: 17, fiber: 4, sugar: 0, sodiumMg: 250 }
    ),
    food(
      "prepared-roasted-potatoes",
      "Roasted Potatoes",
      ["roasted potatoes", "oven roasted potatoes", "roast potatoes"],
      ["side", "potatoes", "roasted"],
      { label: "1 cup", unit: "cup", grams: 180 },
      { calories: 220, protein: 4, carbs: 37, fat: 7, fiber: 4, sugar: 2, sodiumMg: 320 }
    ),
    food(
      "prepared-coleslaw",
      "Coleslaw",
      ["coleslaw", "cole slaw", "cabbage slaw"],
      ["side", "coleslaw"],
      { label: "1 cup", unit: "cup", grams: 150 },
      { calories: 170, protein: 2, carbs: 15, fat: 12, fiber: 3, sugar: 11, sodiumMg: 280 }
    ),
    food(
      "prepared-stuffing",
      "Stuffing",
      ["stuffing", "bread stuffing", "dressing side dish"],
      ["side", "stuffing"],
      { label: "1 cup", unit: "cup", grams: 200 },
      { calories: 320, protein: 8, carbs: 50, fat: 10, fiber: 4, sugar: 5, sodiumMg: 900 }
    ),
    food(
      "prepared-baked-beans",
      "Baked Beans",
      ["baked beans", "beans baked", "barbecue baked beans"],
      ["side", "beans"],
      { label: "1 cup", unit: "cup", grams: 250 },
      { calories: 240, protein: 12, carbs: 48, fat: 2, fiber: 10, sugar: 18, sodiumMg: 850 }
    ),
    food(
      "prepared-potato-salad",
      "Potato Salad",
      ["potato salad", "creamy potato salad"],
      ["side", "potatoes", "salad"],
      { label: "1 cup", unit: "cup", grams: 250 },
      { calories: 360, protein: 7, carbs: 41, fat: 19, fiber: 4, sugar: 5, sodiumMg: 900 }
    )
  ]);

  const registry = global.AriFoodRegistry;
  if (!registry || typeof registry.registerMany !== "function") {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: AriFoodRegistry.registerMany() is unavailable.`);
    return;
  }

  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      const existing = registry.getBySource(MODULE_NAME, { includeDisabled: true });
      if (Array.isArray(existing)) {
        for (const existingFood of existing) {
          if (existingFood?.id) registry.remove(existingFood.id);
        }
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(FOODS, { source: MODULE_NAME });
  if ((registration.rejected || 0) > 0) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: rejected ${registration.rejected} record(s).`);
  }

  global.AriFoodEverydayBreakfastSides = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,
    count: () => FOODS.length,
    getFoodIds: () => FOODS.map((entry) => entry.id),
    getRecord(foodId) {
      const found = FOODS.find((entry) => entry.id === foodId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  });
})(window);
