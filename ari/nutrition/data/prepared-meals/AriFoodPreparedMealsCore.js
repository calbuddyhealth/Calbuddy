// =====================================================
// ARI REBIRTH
// File: AriFoodPreparedMealsCore.js
// Version: 1.0.0
//
// Purpose:
//   Curated everyday prepared-meal fallbacks for ARI Nutrition.
//   This module deliberately favors one human food concept over
//   large sets of near-duplicate database records.
//
// Rules:
//   - One generic record per everyday food concept.
//   - Portions are servings, not separate food records.
//   - Branded/restaurant items belong in separate exact-match data.
//   - Generic values are representative estimates, not a claim that
//     every recipe or restaurant preparation is identical.
// =====================================================

(function initializeAriFoodPreparedMealsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPreparedMealsCore";
  const VERIFIED_AT = "2026-08-28";

  const FOODS = Object.freeze([
    {
      id: "prepared-cheeseburger-single",
      name: "Cheeseburger, Single Patty",
      displayName: "Cheeseburger",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "assembled",
      aliases: ["cheeseburger", "cheese burger", "burger with cheese", "single cheeseburger"],
      tags: ["prepared-meal", "burger", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "sandwich", grams: 150 },
      nutrition: { calories: 303, protein: 17, carbs: 30, fat: 14, fiber: 1.5, sugar: 6, sodiumMg: 720 },
      servings: [
        { id: "one-sandwich", label: "1 cheeseburger", amount: 1, unit: "sandwich", grams: 150, isDefault: true }
      ]
    },
    {
      id: "prepared-turkey-sandwich",
      name: "Turkey Sandwich",
      displayName: "Turkey Sandwich",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "assembled",
      aliases: ["turkey sandwich", "deli turkey sandwich", "turkey on bread"],
      tags: ["prepared-meal", "sandwich", "turkey", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "sandwich", grams: 180 },
      nutrition: { calories: 300, protein: 22, carbs: 34, fat: 8, fiber: 3, sugar: 5, sodiumMg: 820 },
      servings: [
        { id: "one-sandwich", label: "1 sandwich", amount: 1, unit: "sandwich", grams: 180, isDefault: true }
      ]
    },
    {
      id: "prepared-grilled-cheese",
      name: "Grilled Cheese Sandwich",
      displayName: "Grilled Cheese",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "grilled",
      aliases: ["grilled cheese", "grilled cheese sandwich", "cheese toastie"],
      tags: ["prepared-meal", "sandwich", "cheese", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "sandwich", grams: 140 },
      nutrition: { calories: 400, protein: 16, carbs: 33, fat: 22, fiber: 2, sugar: 5, sodiumMg: 900 },
      servings: [
        { id: "one-sandwich", label: "1 sandwich", amount: 1, unit: "sandwich", grams: 140, isDefault: true }
      ]
    },
    {
      id: "prepared-chicken-burrito",
      name: "Chicken Burrito",
      displayName: "Chicken Burrito",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "assembled",
      aliases: ["chicken burrito", "burrito with chicken", "chicken rice burrito"],
      tags: ["prepared-meal", "burrito", "chicken", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "burrito", grams: 300 },
      nutrition: { calories: 500, protein: 30, carbs: 55, fat: 18, fiber: 7, sugar: 4, sodiumMg: 1100 },
      servings: [
        { id: "one-burrito", label: "1 burrito", amount: 1, unit: "burrito", grams: 300, isDefault: true }
      ]
    },
    {
      id: "prepared-bean-cheese-burrito",
      name: "Bean and Cheese Burrito",
      displayName: "Bean & Cheese Burrito",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "assembled",
      aliases: ["bean and cheese burrito", "bean cheese burrito", "bean burrito with cheese"],
      tags: ["prepared-meal", "burrito", "beans", "cheese", "generic", "everyday"],
      popularity: 95,
      nutritionBasis: { type: "unit", amount: 1, unit: "burrito", grams: 240 },
      nutrition: { calories: 380, protein: 14, carbs: 52, fat: 13, fiber: 8, sugar: 3, sodiumMg: 950 },
      servings: [
        { id: "one-burrito", label: "1 burrito", amount: 1, unit: "burrito", grams: 240, isDefault: true }
      ]
    },
    {
      id: "prepared-beef-taco",
      name: "Beef Taco",
      displayName: "Beef Taco",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "assembled",
      aliases: ["beef taco", "ground beef taco", "taco with beef"],
      tags: ["prepared-meal", "taco", "beef", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "taco", grams: 110 },
      nutrition: { calories: 210, protein: 10, carbs: 21, fat: 10, fiber: 3, sugar: 2, sodiumMg: 430 },
      servings: [
        { id: "one-taco", label: "1 taco", amount: 1, unit: "taco", grams: 110, isDefault: true }
      ]
    },
    {
      id: "prepared-chicken-quesadilla",
      name: "Chicken Quesadilla",
      displayName: "Chicken Quesadilla",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "griddled",
      aliases: ["chicken quesadilla", "quesadilla with chicken", "cheese chicken quesadilla"],
      tags: ["prepared-meal", "quesadilla", "chicken", "cheese", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "quesadilla", grams: 220 },
      nutrition: { calories: 450, protein: 28, carbs: 34, fat: 22, fiber: 3, sugar: 3, sodiumMg: 900 },
      servings: [
        { id: "one-quesadilla", label: "1 quesadilla", amount: 1, unit: "quesadilla", grams: 220, isDefault: true }
      ]
    },
    {
      id: "prepared-spaghetti-meat-sauce",
      name: "Spaghetti with Meat Sauce",
      displayName: "Spaghetti with Meat Sauce",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "cooked",
      aliases: ["spaghetti with meat sauce", "spaghetti meat sauce", "spaghetti bolognese", "pasta with meat sauce"],
      tags: ["prepared-meal", "pasta", "beef", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "volume", amount: 1, unit: "cup", grams: 250 },
      nutrition: { calories: 330, protein: 17, carbs: 45, fat: 10, fiber: 4, sugar: 8, sodiumMg: 650 },
      servings: [
        { id: "one-cup", label: "1 cup", amount: 1, unit: "cup", grams: 250, isDefault: true }
      ]
    },
    {
      id: "prepared-mac-cheese",
      name: "Macaroni and Cheese",
      displayName: "Mac & Cheese",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "cooked",
      aliases: ["mac and cheese", "mac & cheese", "macaroni and cheese", "mac n cheese"],
      tags: ["prepared-meal", "pasta", "cheese", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "volume", amount: 1, unit: "cup", grams: 220 },
      nutrition: { calories: 350, protein: 14, carbs: 45, fat: 13, fiber: 2, sugar: 6, sodiumMg: 720 },
      servings: [
        { id: "one-cup", label: "1 cup", amount: 1, unit: "cup", grams: 220, isDefault: true }
      ]
    },
    {
      id: "prepared-chicken-noodle-soup",
      name: "Chicken Noodle Soup",
      displayName: "Chicken Noodle Soup",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "cooked",
      aliases: ["chicken noodle soup", "chicken soup with noodles"],
      tags: ["prepared-meal", "soup", "chicken", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "volume", amount: 1, unit: "cup", grams: 245 },
      nutrition: { calories: 150, protein: 9, carbs: 18, fat: 5, fiber: 2, sugar: 3, sodiumMg: 760 },
      servings: [
        { id: "one-cup", label: "1 cup", amount: 1, unit: "cup", grams: 245, isDefault: true }
      ]
    },
    {
      id: "prepared-beef-chili",
      name: "Beef Chili with Beans",
      displayName: "Beef Chili",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "cooked",
      aliases: ["beef chili", "chili with beans", "ground beef chili", "chili con carne"],
      tags: ["prepared-meal", "chili", "beef", "beans", "generic", "everyday"],
      popularity: 95,
      nutritionBasis: { type: "volume", amount: 1, unit: "cup", grams: 255 },
      nutrition: { calories: 300, protein: 20, carbs: 30, fat: 12, fiber: 8, sugar: 6, sodiumMg: 850 },
      servings: [
        { id: "one-cup", label: "1 cup", amount: 1, unit: "cup", grams: 255, isDefault: true }
      ]
    },
    {
      id: "prepared-pepperoni-pizza-slice",
      name: "Pepperoni Pizza, Slice",
      displayName: "Pepperoni Pizza",
      brand: null,
      category: "prepared-meals",
      state: "prepared",
      preparation: "baked",
      aliases: ["pepperoni pizza", "pepperoni pizza slice", "slice of pepperoni pizza"],
      tags: ["prepared-meal", "pizza", "pepperoni", "generic", "everyday"],
      popularity: 100,
      nutritionBasis: { type: "unit", amount: 1, unit: "slice", grams: 120 },
      nutrition: { calories: 300, protein: 13, carbs: 34, fat: 13, fiber: 2, sugar: 4, sodiumMg: 700 },
      servings: [
        { id: "one-slice", label: "1 slice", amount: 1, unit: "slice", grams: 120, isDefault: true }
      ]
    }
  ].map((food) => Object.freeze({
    ...food,
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
        provider: "Curated generic nutrition references",
        sourceType: "frozen representative prepared-food estimate",
        verifiedAt: VERIFIED_AT
      }),
      offlineReference: true,
      notes: "Representative generic prepared-food entry. Recipe and restaurant variations can materially change nutrition."
    })
  })));

  const registry = global.AriFoodRegistry;
  if (!registry || typeof registry.registerMany !== "function") {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: AriFoodRegistry.registerMany() is unavailable.`);
    return;
  }

  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      const existing = registry.getBySource(MODULE_NAME, { includeDisabled: true });
      if (Array.isArray(existing)) {
        for (const food of existing) {
          if (food?.id) registry.remove(food.id);
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

  global.AriFoodPreparedMealsCore = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,
    count: () => FOODS.length,
    getFoodIds: () => FOODS.map((food) => food.id),
    getRecord(foodId) {
      const found = FOODS.find((food) => food.id === foodId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  });
})(window);
