// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch2.js
// Version: 1.0.0
//
// Purpose:
//   High-demand branded grocery foods people commonly search by name.
//   Prioritizes deli meat, sliced cheese, salad kits, frozen meals,
//   and frozen pizza without changing the existing search architecture.
//
// Data policy:
//   - Exact branded product, never a generic estimate.
//   - Manufacturer label is the source of truth.
//   - Exact labeled serving is retained in metadata.labelNutrition.
//   - Canonical nutrition is normalized mathematically to 100 g.
//   - Product formulations can change; newer package labels supersede
//     this offline snapshot.
// =====================================================

(function initializeAriFoodTopBrandsBatch2(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch2";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "protein-brand-hillshire-ultra-thin-oven-roasted-turkey",
      name: "Ultra Thin Oven Roasted Turkey Breast",
      displayName: "Hillshire Farm Ultra Thin Oven Roasted Turkey Breast",
      brand: "Hillshire Farm",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Hillshire Farm turkey", "Hillshire turkey breast", "Hillshire oven roasted turkey", "Hillshire deli turkey", "Hillshire lunch meat turkey"],
      tags: ["deli-meat", "turkey", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 60, protein: 10, carbs: 2, fat: 2, fiber: 0, sugar: 0, saturatedFat: 0, cholesterol: 25, sodium: 600, potassium: 240 },
      sourceUrl: "https://www.hillshirefarm.com/products/deli-lunch-meats/00044500976502"
    },
    {
      id: "protein-brand-oscar-mayer-deli-fresh-oven-roasted-turkey",
      name: "Deli Fresh Oven Roasted Turkey Breast",
      displayName: "Oscar Mayer Deli Fresh Oven Roasted Turkey Breast",
      brand: "Oscar Mayer",
      category: "protein",
      state: "ready-to-eat",
      preparation: "packaged-deli-meat",
      aliases: ["Oscar Mayer turkey", "Oscar Mayer deli turkey", "Oscar Mayer oven roasted turkey", "Oscar Mayer lunch meat turkey", "Deli Fresh turkey"],
      tags: ["deli-meat", "turkey", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 60, protein: 9, carbs: 3, fat: 1, fiber: 0, sugar: 1, saturatedFat: 0, cholesterol: 25, sodium: 530 },
      sourceUrl: "https://www.oscarmayer.com/products/00044700031285-deli-fresh-oven-roasted-turkey-breast"
    },
    {
      id: "dairy-brand-kraft-singles-american",
      name: "American Slices",
      displayName: "Kraft Singles American Slices",
      brand: "Kraft Singles",
      category: "dairy",
      state: "ready-to-eat",
      preparation: "packaged-sliced-cheese",
      aliases: ["Kraft Singles", "Kraft American cheese", "Kraft American slice", "Kraft cheese slice", "Kraft Singles American cheese"],
      tags: ["cheese", "american-cheese", "sliced-cheese", "sandwich"],
      labelNutrition: { servingLabel: "1 slice (21 g)", servingGrams: 21, calories: 50, protein: 4, carbs: 2, fat: 3.5, fiber: 0, sugar: 2, saturatedFat: 2, cholesterol: 15, sodium: 230, potassium: 60 },
      sourceUrl: "https://www.kraftheinz.com/kraft-singles/products/00021000604647-american-slices"
    },
    {
      id: "dairy-brand-sargento-mild-cheddar-slices",
      name: "Natural Mild Cheddar Sliced Cheese",
      displayName: "Sargento Natural Mild Cheddar Sliced Cheese",
      brand: "Sargento",
      category: "dairy",
      state: "ready-to-eat",
      preparation: "packaged-sliced-cheese",
      aliases: ["Sargento mild cheddar", "Sargento cheddar slices", "Sargento sliced cheddar", "Sargento cheese slice", "Sargento natural cheddar"],
      tags: ["cheese", "cheddar", "sliced-cheese", "sandwich"],
      labelNutrition: { servingLabel: "1 slice (21 g)", servingGrams: 21, calories: 80, protein: 5, carbs: 0, fat: 7, fiber: 0, sugar: 0, saturatedFat: 4.5, cholesterol: 20, sodium: 140, potassium: 20 },
      sourceUrl: "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-mild-natural-cheddar-cheese/"
    },
    {
      id: "prepared-brand-taylor-farms-caesar-salad-kit",
      name: "Caesar Salad Kit",
      displayName: "Taylor Farms Caesar Salad Kit",
      brand: "Taylor Farms",
      category: "prepared-meals",
      state: "ready-to-eat",
      preparation: "packaged-salad-kit",
      aliases: ["Taylor Farms Caesar", "Taylor Farms Caesar kit", "Taylor Caesar salad", "Taylor Farms salad kit Caesar"],
      tags: ["salad", "salad-kit", "caesar", "prepared-meal"],
      labelNutrition: { servingLabel: "1 cup (100 g)", servingGrams: 100, calories: 180, protein: 4, carbs: 7, fat: 16, fiber: 2, sugar: 1, saturatedFat: 3.5, cholesterol: 15, sodium: 270, potassium: 180 },
      sourceUrl: "https://www.taylorfarms.com/products/caesar/"
    },
    {
      id: "prepared-brand-fresh-express-caesar-supreme-salad-kit",
      name: "Caesar Supreme Salad Kit",
      displayName: "Fresh Express Caesar Supreme Salad Kit",
      brand: "Fresh Express",
      category: "prepared-meals",
      state: "ready-to-eat",
      preparation: "packaged-salad-kit",
      aliases: ["Fresh Express Caesar", "Fresh Express Caesar Supreme", "Fresh Express Caesar salad", "Fresh Express salad kit Caesar"],
      tags: ["salad", "salad-kit", "caesar", "prepared-meal"],
      labelNutrition: { servingLabel: "1.5 cups (100 g)", servingGrams: 100, calories: 170, protein: 4, carbs: 6, fat: 15, fiber: 2, sugar: 1, saturatedFat: 3, cholesterol: 15, sodium: 290, potassium: 190 },
      sourceUrl: "https://www.freshexpress.com/products/salad-kits/caesar-supreme-salad-kit"
    },
    {
      id: "prepared-brand-lean-cuisine-alfredo-chicken-broccoli",
      name: "Alfredo Chicken & Broccoli Frozen Meal",
      displayName: "Lean Cuisine Alfredo Chicken & Broccoli",
      brand: "Lean Cuisine",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Lean Cuisine chicken alfredo", "Lean Cuisine Alfredo chicken broccoli", "Lean Cuisine chicken and broccoli", "Lean Cuisine Alfredo"],
      tags: ["frozen-meal", "chicken", "broccoli", "alfredo", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (253 g)", servingGrams: 253, calories: 200, protein: 18, carbs: 17, fat: 7, fiber: 4, sugar: 8, saturatedFat: 2, cholesterol: 40, sodium: 510, potassium: 580 },
      sourceUrl: "https://www.goodnes.com/lean-cuisine/products/alfredo-chicken-and-broccoli-frozen-meal/"
    },
    {
      id: "prepared-brand-stouffers-lasagna-meat-sauce-for-one",
      name: "Lasagna with Meat & Sauce Frozen Meal",
      displayName: "Stouffer's Lasagna with Meat & Sauce",
      brand: "Stouffer's",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-ready-to-heat",
      aliases: ["Stouffer's lasagna", "Stouffers lasagna", "Stouffer's meat lasagna", "Stouffer's lasagna with meat sauce", "Stouffers meat sauce lasagna"],
      tags: ["frozen-meal", "lasagna", "pasta", "beef", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (297 g)", servingGrams: 297, calories: 360, protein: 22, carbs: 40, fat: 12, fiber: 3, sugar: 7, saturatedFat: 6, transFat: 0.5, cholesterol: 40, sodium: 1010, potassium: 610 },
      sourceUrl: "https://www.goodnes.com/stouffers/products/lasagna-with-meat-sauce-for-one/"
    },
    {
      id: "prepared-brand-digiorno-rising-crust-pepperoni",
      name: "Rising Crust Pepperoni Frozen Pizza",
      displayName: "DiGiorno Rising Crust Pepperoni Pizza",
      brand: "DiGiorno",
      category: "prepared-meals",
      state: "frozen",
      preparation: "frozen-bake",
      aliases: ["DiGiorno pepperoni pizza", "Digiorno rising crust pepperoni", "DiGiorno frozen pizza", "Digiorno pepperoni"],
      tags: ["frozen-pizza", "pizza", "pepperoni", "prepared-meal"],
      labelNutrition: { servingLabel: "1/5 pizza (140 g)", servingGrams: 140, calories: 330, protein: 16, carbs: 40, fat: 13, fiber: 2, sugar: 6, saturatedFat: 6, cholesterol: 25, sodium: 780, potassium: 190 },
      sourceUrl: "https://www.goodnes.com/digiorno/products/rising-crust-ultimate-pepperoni-2-pack/"
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

  global.AriFoodTopBrandsBatch2 = Object.freeze({
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
