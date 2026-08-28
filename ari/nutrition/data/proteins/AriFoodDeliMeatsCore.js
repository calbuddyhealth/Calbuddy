// =====================================================
// ARI REBIRTH
// File: AriFoodDeliMeatsCore.js
// Version: 1.0.1
//
// Curated generic deli/lunch meats. One human food concept per record.
// USDA FoodData Central/FNDDS is a reference anchor; branded products
// belong in exact-match manufacturer-label records.
// =====================================================
(function initializeAriFoodDeliMeatsCore(global) {
  "use strict";

  const VERSION = "1.0.1";
  const MODULE_NAME = "AriFoodDeliMeatsCore";
  const VERIFIED_AT = "2026-08-28";

  const rows = [
    ["deli-turkey-breast", "Deli Turkey Breast", ["deli turkey", "turkey lunch meat", "sliced turkey", "turkey breast lunch meat"], 60, 11, 2, 1, 500],
    ["deli-ham", "Deli Ham", ["deli ham", "ham lunch meat", "sliced ham"], 70, 10, 2, 2, 650],
    ["deli-roast-beef", "Deli Roast Beef", ["deli roast beef", "roast beef lunch meat", "sliced roast beef"], 80, 12, 1, 3, 500],
    ["deli-chicken-breast", "Deli Chicken Breast", ["deli chicken", "chicken lunch meat", "sliced chicken breast"], 60, 11, 2, 1, 500],
    ["deli-hard-salami", "Hard Salami", ["salami", "hard salami", "deli salami", "sliced salami"], 220, 12, 2, 18, 900],
    ["deli-bologna", "Bologna", ["bologna", "baloney", "bologna lunch meat"], 170, 7, 4, 14, 600],
    ["deli-pastrami", "Pastrami", ["pastrami", "deli pastrami", "sliced pastrami"], 90, 12, 1, 4, 600],
    ["deli-prosciutto", "Prosciutto", ["prosciutto", "sliced prosciutto", "italian ham"], 140, 16, 0, 8, 1000],
    ["deli-pepperoni", "Pepperoni", ["pepperoni", "sliced pepperoni", "deli pepperoni"], 280, 12, 2, 25, 1000],
    ["deli-mortadella", "Mortadella", ["mortadella", "deli mortadella", "sliced mortadella"], 180, 9, 2, 15, 650]
  ];

  const FOODS = Object.freeze(rows.map(([id, displayName, aliases, calories, protein, carbs, fat, sodiumMg]) => Object.freeze({
    id,
    name: displayName,
    displayName,
    brand: null,
    category: "proteins",
    subcategory: "deli-meats",
    state: "ready-to-eat",
    preparation: "sliced",
    aliases,
    tags: ["protein", "deli-meat", "lunch-meat", "generic", "everyday"],
    popularity: 95,
    nutritionBasis: { type: "weight", amount: 2, unit: "oz", grams: 56 },
    nutrition: { calories, protein, carbs, fat, fiber: 0, sugar: 1, sodiumMg },
    servings: [
      { id: "two-ounces", label: "2 oz", amount: 2, unit: "oz", grams: 56, isDefault: true },
      { id: "one-ounce", label: "1 oz", amount: 1, unit: "oz", grams: 28 },
      { id: "three-ounces", label: "3 oz", amount: 3, unit: "oz", grams: 85 }
    ],
    source: MODULE_NAME,
    verified: false,
    metadata: Object.freeze({
      foodFamily: "deli-meats",
      genericFood: true,
      brandSpecific: false,
      curatedEverydayConcept: true,
      dataVerifiedAt: VERIFIED_AT,
      confidence: "medium",
      sourceProvenance: Object.freeze({
        provider: "USDA FoodData Central / FNDDS reference anchor",
        sourceType: "curated generic deli-meat estimate",
        verifiedAt: VERIFIED_AT
      }),
      offlineReference: true,
      estimate: true,
      notes: "Representative generic 2 oz deli-meat estimate. Sodium, fat, curing, and slice weight vary by product; manufacturer-label data should override this for branded exact matches."
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
        for (const food of existing) if (food?.id) registry.remove(food.id);
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(FOODS, { source: MODULE_NAME });
  if ((registration.rejected || 0) > 0) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: rejected ${registration.rejected} record(s).`);
  }

  global.AriFoodDeliMeatsCore = Object.freeze({
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
