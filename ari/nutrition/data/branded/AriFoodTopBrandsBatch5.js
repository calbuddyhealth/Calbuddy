// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch5.js
// Version: 1.0.0
//
// Purpose:
//   Continue high-demand branded grocery expansion with everyday deli
//   and frozen convenience foods users commonly search by brand/name.
//
// Data policy:
//   - Exact branded product, never a generic estimate.
//   - Official manufacturer nutrition is the source of truth.
//   - Exact labeled serving is retained in metadata.labelNutrition.
//   - Canonical nutrition is normalized mathematically to 100 g.
//   - Product formulations can change; newer package labels supersede
//     this offline snapshot.
// =====================================================

(function initializeAriFoodTopBrandsBatch5(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch5";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken",
      name: "Deli Fresh Rotisserie Seasoned Chicken Breast",
      displayName: "Oscar Mayer Deli Fresh Rotisserie Seasoned Chicken Breast",
      brand: "Oscar Mayer",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Oscar Mayer chicken", "Oscar Mayer deli chicken", "Oscar Mayer rotisserie chicken", "Oscar Mayer chicken breast lunch meat", "Deli Fresh chicken"],
      tags: ["deli-meat", "chicken", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 50, protein: 9, carbs: 2, fat: 1, fiber: 0, sugar: 1, saturatedFat: 0, transFat: 0, cholesterol: 30, sodium: 540 },
      sourceUrl: "https://www.oscarmayer.com/products/00044700075098/deli-fresh-rotisserie-chicken-breast"
    },
    {
      id: "protein-brand-hillshire-ultra-thin-honey-ham",
      name: "Ultra Thin Honey Ham",
      displayName: "Hillshire Farm Ultra Thin Honey Ham",
      brand: "Hillshire Farm",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Hillshire honey ham", "Hillshire Farm honey ham", "Hillshire deli ham", "Hillshire lunch meat ham", "Ultra Thin honey ham"],
      tags: ["deli-meat", "ham", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 70, protein: 9, carbs: 4, fat: 3, fiber: 0, sugar: 3, saturatedFat: 1, transFat: 0, cholesterol: 25, sodium: 570, potassium: 280 },
      sourceUrl: "https://www.hillshirefarm.com/products/deli-lunch-meats/00044500976489"
    },
    {
      id: "prepared-brand-hot-pockets-hickory-ham-cheddar",
      name: "Hickory Ham and Cheddar Crispy Crust Frozen Sandwich",
      displayName: "Hot Pockets Hickory Ham & Cheddar",
      brand: "Hot Pockets",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Hot Pockets ham and cheese", "Hot Pocket ham and cheese", "Hot Pockets ham cheddar", "Hot Pocket ham cheddar", "Hickory ham Hot Pocket"],
      tags: ["frozen-meal", "frozen-sandwich", "ham", "cheese", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (127 g)", servingGrams: 127, calories: 290, protein: 9, carbs: 41, fat: 10, fiber: 0.5, sugar: 4, saturatedFat: 5, transFat: 0, cholesterol: 15, sodium: 580, potassium: 140 },
      sourceUrl: "https://www.goodnes.com/hot-pockets/products/ham-cheddar-crispy-crust-frozen-sandwich/",
      notes: "Manufacturer label reports dietary fiber as <1 g; 0.5 g is retained conservatively for canonical normalization."
    },
    {
      id: "prepared-brand-lean-cuisine-four-cheese-pizza",
      name: "Four Cheese Frozen Pizza",
      displayName: "Lean Cuisine Four Cheese Pizza",
      brand: "Lean Cuisine",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Lean Cuisine cheese pizza", "Lean Cuisine four cheese", "Lean Cuisine frozen pizza", "Lean Cuisine personal cheese pizza"],
      tags: ["frozen-meal", "frozen-pizza", "pizza", "cheese", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (170 g)", servingGrams: 170, calories: 390, protein: 20, carbs: 60, fat: 8, fiber: 3, sugar: 7, saturatedFat: 3, transFat: 0, cholesterol: 15, sodium: 590, potassium: 350 },
      sourceUrl: "https://www.goodnes.com/lean-cuisine/products/four-cheese-frozen-pizza-6oz/"
    }
  ];

  function round(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function normalizeRecord(record) {
    const serving = record.labelNutrition;
    const servingGrams = Number(serving.servingGrams);
    const factor = 100 / servingGrams;
    const nutrition = {};

    for (const key of ["calories", "protein", "carbs", "fat", "fiber", "sugar", "saturatedFat", "transFat", "cholesterol", "sodium", "potassium"]) {
      if (Number.isFinite(Number(serving[key]))) nutrition[key] = round(Number(serving[key]) * factor);
    }

    return {
      id: record.id,
      name: record.name,
      displayName: record.displayName,
      brand: record.brand,
      category: record.category,
      state: record.state || "ready-to-eat",
      preparation: record.preparation || "packaged",
      aliases: record.aliases || [record.displayName],
      tags: Array.from(new Set([record.category, "branded", "packaged", ...(record.tags || [])])),
      popularity: record.popularity || 100,
      nutritionBasis: { type: "weight", amount: 100, unit: "g", grams: 100 },
      nutrition,
      servings: [
        { id: "label-serving", label: serving.servingLabel, amount: 1, unit: "serving", grams: servingGrams, isDefault: true },
        { id: "one-ounce", label: "1 oz", amount: 1, unit: "oz", grams: 28.3495, isDefault: false },
        { id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: false }
      ],
      source: MODULE_NAME,
      verified: true,
      metadata: {
        brandSpecific: true,
        packagedProduct: true,
        dataVerifiedAt: VERIFIED_AT,
        confidence: "high",
        labelNutrition: { ...serving },
        sourceProvenance: {
          provider: record.brand,
          sourceType: "official manufacturer product nutrition",
          sourceUrl: record.sourceUrl,
          sourceTier: "manufacturer",
          verifiedAt: VERIFIED_AT
        },
        offlineReference: true,
        normalizationMethod: "Exact manufacturer label serving normalized mathematically to 100 g.",
        notes: record.notes || "Product formulations can change; a newer package or manufacturer label supersedes this offline snapshot."
      }
    };
  }

  const FOODS = Object.freeze(LABEL_RECORDS.map(normalizeRecord));
  const registry = global.AriFoodRegistry;
  if (!registry || typeof registry.registerMany !== "function") {
    console.error(`[ARI Nutrition] ${MODULE_NAME} requires AriFoodRegistry.registerMany().`);
    return;
  }

  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      for (const food of registry.getBySource(MODULE_NAME, { includeDisabled: true }) || []) {
        if (food?.id) registry.remove(food.id);
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(FOODS, { source: MODULE_NAME });
  if ((registration.rejected || 0) > 0) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: rejected ${registration.rejected} record(s).`);
  }

  global.AriFoodTopBrandsBatch5 = Object.freeze({
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
