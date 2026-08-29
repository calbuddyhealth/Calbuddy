// =====================================================
// ARI REBIRTH
// File: AriFoodEverydaySoupsMeals2.js
// Version: 1.0.0
//
// Curated everyday generic foods. One user-facing concept per record.
// Values are representative estimates anchored to USDA FoodData Central /
// FNDDS-style generic foods. Recipe variation is expected; these records
// are intentionally not marked as exact verified matches.
// =====================================================
(function initializeAriFoodEverydaySoupsMeals2(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodEverydaySoupsMeals2";
  const AUDITED_AT = "2026-08-28";

  function food(id, displayName, aliases, serving, grams, nutrition, tags = []) {
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
      popularity: 98,
      nutritionBasis: { type: "serving", amount: 1, unit: "serving", grams },
      nutrition: { ...nutrition },
      servings: [
        { id: "default-serving", label: serving, amount: 1, unit: "serving", grams, isDefault: true },
        { id: "grams", label: "grams", amount: 1, unit: "g", grams: 1 }
      ],
      source: MODULE_NAME,
      verified: false,
      metadata: Object.freeze({
        foodFamily: "prepared-meals",
        genericFood: true,
        brandSpecific: false,
        curatedEverydayConcept: true,
        dataVerifiedAt: AUDITED_AT,
        confidence: "medium",
        estimate: true,
        sourceProvenance: Object.freeze({
          provider: "USDA FoodData Central / FNDDS reference anchor",
          dataset: "FNDDS 2021-2023",
          sourceType: "curated representative generic prepared-food estimate",
          specificMatchVerified: false,
          fdcId: null,
          auditedAt: AUDITED_AT
        }),
        offlineReference: true,
        notes: "Representative generic estimate. Recipe, restaurant, and serving-size variation can materially change nutrition; exact branded or restaurant nutrition should override this record."
      })
    });
  }

  const FOODS = Object.freeze([
    food("prepared-tomato-soup", "Tomato Soup", ["tomato soup", "cream of tomato soup"], "1 cup", 245, { calories: 160, protein: 4, carbs: 28, fat: 4, fiber: 2, sugar: 12, sodiumMg: 750 }, ["soup"]),
    food("prepared-lentil-soup", "Lentil Soup", ["lentil soup", "lentil vegetable soup"], "1 cup", 245, { calories: 190, protein: 12, carbs: 30, fat: 3, fiber: 9, sugar: 5, sodiumMg: 650 }, ["soup", "vegetarian"]),
    food("prepared-minestrone-soup", "Minestrone Soup", ["minestrone", "minestrone soup", "vegetable pasta soup"], "1 cup", 245, { calories: 150, protein: 6, carbs: 26, fat: 3, fiber: 5, sugar: 6, sodiumMg: 700 }, ["soup", "vegetarian"]),
    food("prepared-broccoli-cheddar-soup", "Broccoli Cheddar Soup", ["broccoli cheddar soup", "broccoli cheese soup"], "1 cup", 245, { calories: 300, protein: 10, carbs: 20, fat: 20, fiber: 3, sugar: 7, sodiumMg: 900 }, ["soup"]),
    food("prepared-beef-stew", "Beef Stew", ["beef stew", "beef vegetable stew"], "1 cup", 245, { calories: 250, protein: 22, carbs: 22, fat: 8, fiber: 4, sugar: 5, sodiumMg: 700 }, ["stew"]),
    food("prepared-chicken-rice-bowl", "Chicken and Rice Bowl", ["chicken rice bowl", "chicken and rice", "grilled chicken rice bowl"], "1 bowl", 350, { calories: 520, protein: 38, carbs: 62, fat: 13, fiber: 3, sugar: 3, sodiumMg: 700 }, ["bowl", "chicken"]),
    food("prepared-beef-rice-bowl", "Beef and Rice Bowl", ["beef rice bowl", "beef and rice", "ground beef rice bowl"], "1 bowl", 350, { calories: 580, protein: 32, carbs: 60, fat: 24, fiber: 3, sugar: 3, sodiumMg: 750 }, ["bowl", "beef"]),
    food("prepared-chicken-alfredo", "Chicken Alfredo", ["chicken alfredo", "fettuccine alfredo with chicken", "chicken fettuccine alfredo"], "2 cups", 400, { calories: 700, protein: 40, carbs: 68, fat: 30, fiber: 4, sugar: 6, sodiumMg: 1050 }, ["pasta", "chicken"]),
    food("prepared-lasagna-meat", "Meat Lasagna", ["lasagna", "meat lasagna", "beef lasagna"], "1 piece", 300, { calories: 450, protein: 26, carbs: 42, fat: 20, fiber: 4, sugar: 8, sodiumMg: 900 }, ["pasta", "beef"]),
    food("prepared-baked-ziti", "Baked Ziti", ["baked ziti", "baked pasta with cheese", "ziti"], "2 cups", 400, { calories: 620, protein: 28, carbs: 78, fat: 22, fiber: 6, sugar: 12, sodiumMg: 1050 }, ["pasta"]),
    food("prepared-chicken-parmesan", "Chicken Parmesan", ["chicken parmesan", "chicken parm", "breaded chicken parmesan"], "1 chicken cutlet with sauce & cheese", 300, { calories: 520, protein: 42, carbs: 30, fat: 26, fiber: 3, sugar: 7, sodiumMg: 1050 }, ["chicken"]),
    food("prepared-meatloaf", "Meatloaf", ["meatloaf", "beef meatloaf"], "2 slices", 170, { calories: 360, protein: 28, carbs: 18, fat: 20, fiber: 1, sugar: 7, sodiumMg: 750 }, ["beef"]),
    food("prepared-tuna-salad-sandwich", "Tuna Salad Sandwich", ["tuna sandwich", "tuna salad sandwich", "tuna mayo sandwich"], "1 sandwich", 220, { calories: 430, protein: 25, carbs: 36, fat: 21, fiber: 3, sugar: 5, sodiumMg: 850 }, ["sandwich", "tuna"]),
    food("prepared-chicken-salad-sandwich", "Chicken Salad Sandwich", ["chicken salad sandwich", "chicken sandwich with mayo"], "1 sandwich", 230, { calories: 460, protein: 28, carbs: 36, fat: 23, fiber: 3, sugar: 5, sodiumMg: 800 }, ["sandwich", "chicken"]),
    food("prepared-peanut-butter-jelly", "Peanut Butter & Jelly Sandwich", ["pb&j", "pbj", "peanut butter jelly sandwich", "peanut butter and jelly"], "1 sandwich", 150, { calories: 380, protein: 13, carbs: 52, fat: 15, fiber: 5, sugar: 22, sodiumMg: 400 }, ["sandwich"]),
    food("prepared-hot-dog-bun", "Hot Dog with Bun", ["hot dog", "hotdog", "hot dog with bun"], "1 hot dog", 100, { calories: 290, protein: 11, carbs: 24, fat: 17, fiber: 1, sugar: 4, sodiumMg: 850 }, ["sandwich"])
  ]);

  const registry = global.AriFoodRegistry;
  if (!registry || typeof registry.registerMany !== "function") {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: AriFoodRegistry.registerMany() is unavailable.`);
    return;
  }
  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      const existing = registry.getBySource(MODULE_NAME, { includeDisabled: true });
      if (Array.isArray(existing)) for (const item of existing) if (item?.id) registry.remove(item.id);
    } catch (error) { console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error); }
  }
  const registration = registry.registerMany(FOODS, { source: MODULE_NAME });
  if ((registration.rejected || 0) > 0) console.error(`[ARI Nutrition] ${MODULE_NAME}: rejected ${registration.rejected} record(s).`);

  global.AriFoodEverydaySoupsMeals2 = Object.freeze({
    VERSION, MODULE_NAME, AUDITED_AT,
    count: () => FOODS.length,
    getFoodIds: () => FOODS.map((food) => food.id),
    getRecord(foodId) { const found = FOODS.find((food) => food.id === foodId); return found ? JSON.parse(JSON.stringify(found)) : null; }
  });
})(window);
