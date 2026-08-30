// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch4.js
// Version: 1.0.0
//
// Purpose:
//   High-demand branded grocery expansion focused on everyday deli,
//   sliced cheese, salad kits, and frozen convenience meals.
//
// Data policy:
//   - Exact branded product, never a generic estimate.
//   - Official manufacturer nutrition is the source of truth.
//   - Exact labeled serving is retained in metadata.labelNutrition.
//   - Canonical nutrition is normalized mathematically to 100 g.
//   - Product formulations can change; newer package labels supersede
//     this offline snapshot.
// =====================================================

(function initializeAriFoodTopBrandsBatch4(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch4";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "protein-brand-oscar-mayer-deli-fresh-black-forest-ham",
      name: "Deli Fresh Black Forest Uncured Ham",
      displayName: "Oscar Mayer Deli Fresh Black Forest Uncured Ham",
      brand: "Oscar Mayer",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Oscar Mayer ham", "Oscar Mayer black forest ham", "Oscar Mayer deli ham", "Oscar Mayer lunch meat ham", "Deli Fresh ham"],
      tags: ["deli-meat", "ham", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 60, protein: 9, carbs: 1, fat: 1.5, fiber: 0, sugar: 1, saturatedFat: 0, transFat: 0, cholesterol: 25, sodium: 560 },
      sourceUrl: "https://www.oscarmayer.com/products/00044700072615-deli-fresh-black-forest-uncured-ham"
    },
    {
      id: "dairy-brand-sargento-provolone-smoke-slices",
      name: "Provolone with Smoke Flavor Sliced Cheese",
      displayName: "Sargento Provolone with Smoke Flavor Sliced Cheese",
      brand: "Sargento",
      category: "dairy",
      state: "ready-to-eat",
      preparation: "packaged-sliced-cheese",
      aliases: ["Sargento provolone", "Sargento provolone slices", "Sargento sliced provolone", "Sargento smoked provolone", "provolone cheese slices"],
      tags: ["cheese", "provolone", "sliced-cheese", "sandwich"],
      labelNutrition: { servingLabel: "1 slice (19 g)", servingGrams: 19, calories: 70, protein: 5, carbs: 0, fat: 5, fiber: 0, sugar: 0, saturatedFat: 3, transFat: 0, cholesterol: 15, sodium: 130, potassium: 25 },
      sourceUrl: "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-provolone-natural-cheese-with-natural-smoke-flavor-24-slices"
    },
    {
      id: "dairy-brand-sargento-swiss-slices",
      name: "Swiss Sliced Cheese",
      displayName: "Sargento Swiss Sliced Cheese",
      brand: "Sargento",
      category: "dairy",
      state: "ready-to-eat",
      preparation: "packaged-sliced-cheese",
      aliases: ["Sargento Swiss", "Sargento Swiss slices", "Sargento sliced Swiss", "Swiss cheese slices", "Sargento natural Swiss"],
      tags: ["cheese", "swiss", "sliced-cheese", "sandwich"],
      labelNutrition: { servingLabel: "1 slice (18 g)", servingGrams: 18, calories: 70, protein: 5, carbs: 1, fat: 5, fiber: 0, sugar: 0, saturatedFat: 3, cholesterol: 15, sodium: 35, potassium: 15 },
      sourceUrl: "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-swiss-natural-cheese-22-slices"
    },
    {
      id: "prepared-brand-taylor-farms-southwest-chopped-salad-kit",
      name: "Southwest Chopped Salad Kit",
      displayName: "Taylor Farms Southwest Chopped Salad Kit",
      brand: "Taylor Farms",
      category: "prepared-meals",
      state: "ready-to-eat",
      preparation: "packaged-salad-kit",
      aliases: ["Taylor Farms Southwest", "Taylor Southwest salad", "Taylor Farms Southwest chopped kit", "Southwest salad kit Taylor Farms"],
      tags: ["salad", "salad-kit", "southwest", "prepared-meal"],
      labelNutrition: { servingLabel: "1 cup (100 g)", servingGrams: 100, calories: 150, protein: 4, carbs: 9, fat: 12, fiber: 2, sugar: 3, saturatedFat: 2, transFat: 0, cholesterol: 5, sodium: 170, potassium: 260 },
      sourceUrl: "https://www.taylorfarms.com/products/southwest-chopped-kit/"
    },
    {
      id: "prepared-brand-hot-pockets-pepperoni-pizza",
      name: "Pepperoni Pizza Italian Style Seasoned Crust",
      displayName: "Hot Pockets Pepperoni Pizza",
      brand: "Hot Pockets",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Hot Pocket pepperoni pizza", "Hot Pockets pepperoni", "pepperoni Hot Pocket", "Hot Pockets pizza pocket"],
      tags: ["frozen-meal", "frozen-snack", "pizza", "pepperoni", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (127 g)", servingGrams: 127, calories: 330, protein: 10, carbs: 39, fat: 15, fiber: 1, sugar: 4, saturatedFat: 7, transFat: 0, cholesterol: 25, sodium: 690, potassium: 220 },
      sourceUrl: "https://www.goodnes.com/hot-pockets/products/pepperoni-pizza-italian-seasoned-crust/"
    },
    {
      id: "prepared-brand-lean-cuisine-herb-roasted-chicken",
      name: "Herb Roasted Chicken Frozen Meal",
      displayName: "Lean Cuisine Herb Roasted Chicken",
      brand: "Lean Cuisine",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Lean Cuisine herb chicken", "Lean Cuisine roasted chicken", "Lean Cuisine herb roasted chicken meal", "Lean Cuisine chicken potatoes broccoli"],
      tags: ["frozen-meal", "chicken", "potatoes", "broccoli", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (226 g)", servingGrams: 226, calories: 180, protein: 18, carbs: 17, fat: 4.5, fiber: 2, sugar: 4, saturatedFat: 1, transFat: 0, cholesterol: 40, sodium: 580, potassium: 910 },
      sourceUrl: "https://www.goodnes.com/lean-cuisine/products/herb-roasted-chicken-frozen-meal/"
    },
    {
      id: "prepared-brand-stouffers-macaroni-cheese-for-one",
      name: "Macaroni & Cheese Frozen Meal for One",
      displayName: "Stouffer's Macaroni & Cheese For One",
      brand: "Stouffer's",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Stouffer's mac and cheese", "Stouffers mac and cheese", "Stouffer's macaroni cheese", "Stouffer's frozen mac and cheese"],
      tags: ["frozen-meal", "mac-and-cheese", "pasta", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (340 g)", servingGrams: 340, calories: 480, protein: 21, carbs: 51, fat: 21, fiber: 2, sugar: 5, saturatedFat: 9, transFat: 0.5, cholesterol: 40, sodium: 1280, potassium: 450 },
      sourceUrl: "https://www.goodnes.com/stouffers/products/macaroni-cheese-for-one/"
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
        notes: "Product formulations can change; a newer package or manufacturer label supersedes this offline snapshot."
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

  global.AriFoodTopBrandsBatch4 = Object.freeze({
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
