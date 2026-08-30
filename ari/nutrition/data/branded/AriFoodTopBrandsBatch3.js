// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch3.js
// Version: 1.0.0
//
// Purpose:
//   High-demand branded grocery staples users commonly search.
//
// Data policy:
//   - Exact branded product, not a generic estimate.
//   - Current manufacturer nutrition label is authoritative.
//   - Exact labeled serving retained in metadata.labelNutrition.
//   - Canonical nutrition normalized mathematically to 100 g.
//   - Search aliases favor normal consumer wording.
// =====================================================

(function initializeAriFoodTopBrandsBatch3(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch3";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "protein-brand-hormel-natural-choice-honey-deli-ham",
      name: "Natural Choice Honey Deli Ham",
      displayName: "Hormel Natural Choice Honey Deli Ham",
      brand: "Hormel Natural Choice",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Hormel honey ham", "Hormel deli ham", "Hormel Natural Choice ham", "Natural Choice honey ham"],
      tags: ["deli-meat", "ham", "lunch-meat"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 70, protein: 10, carbs: 3, fat: 1.5, fiber: 0, sugar: 3, saturatedFat: 0.5, transFat: 0, cholesterol: 30, sodium: 590, potassium: 90 },
      sourceUrl: "https://www.hormel.com/brands/hormel-natural-choice-meats/product/honey-deli-ham/"
    },
    {
      id: "dairy-brand-tillamook-medium-cheddar-slices",
      name: "Medium Cheddar Cheese Slices",
      displayName: "Tillamook Medium Cheddar Cheese Slices",
      brand: "Tillamook",
      category: "dairy",
      state: "ready-to-eat",
      preparation: "packaged-cheese",
      aliases: ["Tillamook cheddar slices", "Tillamook sliced cheddar", "Tillamook medium cheddar", "Tillamook cheese slices"],
      tags: ["cheese", "sliced-cheese", "cheddar"],
      labelNutrition: { servingLabel: "1 slice (28 g)", servingGrams: 28, calories: 120, protein: 6, carbs: 1, fat: 10, fiber: 0, sugar: 0, saturatedFat: 6, transFat: 0, cholesterol: 30, sodium: 200, potassium: 30 },
      sourceUrl: "https://www.tillamook.com/foodservice/products/cheese/all/medium-cheddar-sliced"
    },
    {
      id: "prepared-brand-el-monterey-beef-bean-burrito",
      name: "Beef & Bean Burrito",
      displayName: "El Monterey Beef & Bean Burrito",
      brand: "El Monterey",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["El Monterey beef bean burrito", "El Monterey beef and bean burrito", "El Monterey frozen burrito"],
      tags: ["frozen-meal", "burrito", "beef", "beans"],
      labelNutrition: { servingLabel: "1 burrito (113 g)", servingGrams: 113, calories: 290, protein: 9, carbs: 33, fat: 14, fiber: 3, sugar: 0, saturatedFat: 5, transFat: 0, cholesterol: 15, sodium: 330, potassium: 195 },
      sourceUrl: "https://elmonterey.com/products/classic-burritos-chimichangas/beef-bean-burrito/singles/"
    },
    {
      id: "protein-brand-tyson-chicken-nuggets",
      name: "Chicken Nuggets",
      displayName: "Tyson Chicken Nuggets",
      brand: "Tyson",
      category: "protein",
      state: "frozen",
      preparation: "frozen-fully-cooked",
      aliases: ["Tyson chicken nuggets", "Tyson frozen nuggets", "Tyson nuggets"],
      tags: ["chicken", "poultry", "breaded", "frozen-food", "nuggets"],
      labelNutrition: { servingLabel: "5 pieces (90 g)", servingGrams: 90, calories: 210, protein: 11, carbs: 12, fat: 13, fiber: 1, sugar: 0, saturatedFat: 3, transFat: 0, cholesterol: 40, sodium: 450, potassium: 190 },
      sourceUrl: "https://www.tyson.com/products/nuggets-patties/00023700060266"
    },
    {
      id: "prepared-brand-red-baron-thin-crispy-pepperoni",
      name: "Thin & Crispy Pepperoni Pizza",
      displayName: "Red Baron Thin & Crispy Pepperoni Pizza",
      brand: "Red Baron",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-bake",
      aliases: ["Red Baron pepperoni pizza", "Red Baron thin crust pepperoni", "Red Baron Thin & Crispy pepperoni"],
      tags: ["frozen-pizza", "frozen-meal", "pizza", "pepperoni"],
      labelNutrition: { servingLabel: "1/3 pizza (149 g)", servingGrams: 149, calories: 400, protein: 15, carbs: 38, fat: 20, fiber: 2, sugar: 9, saturatedFat: 10, transFat: 0, cholesterol: 45, sodium: 820 },
      sourceUrl: "https://www.redbaron.com/products/red-baron%C2%AE-thin-crispy-pepperoni-pizza"
    }
  ];

  function round(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function normalizeRecord(record) {
    const serving = record.labelNutrition;
    const basisAmount = Number(serving.servingGrams);
    const factor = 100 / basisAmount;
    const nutrition = {};

    for (const key of [
      "calories", "protein", "carbs", "fat", "fiber", "sugar",
      "saturatedFat", "transFat", "cholesterol", "sodium", "potassium"
    ]) {
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
        { id: "label-serving", label: serving.servingLabel, amount: 1, unit: "serving", grams: serving.servingGrams, isDefault: true },
        { id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: false }
      ],
      source: MODULE_NAME,
      verified: true,
      metadata: {
        brandSpecific: true,
        packagedProduct: true,
        dataVerifiedAt: VERIFIED_AT,
        confidence: record.confidence || "high",
        labelNutrition: { ...serving },
        sourceProvenance: {
          provider: record.provider || record.brand,
          sourceType: record.sourceType || "official manufacturer product nutrition",
          sourceUrl: record.sourceUrl,
          sourceTier: record.sourceTier || "manufacturer",
          verifiedAt: VERIFIED_AT
        },
        offlineReference: true,
        normalizationMethod: "Exact label serving normalized mathematically to 100 g.",
        notes: record.notes || "Product formulations can change; a newer package/manufacturer label supersedes this offline snapshot."
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

  global.AriFoodTopBrandsBatch3 = Object.freeze({
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
