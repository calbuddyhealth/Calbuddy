// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch1.js
// Version: 1.0.0
//
// Purpose:
//   Top Brands gap batch 1 across high-utility missing free-user categories.
//
// Data policy:
//   - Exact branded product, not a generic estimate.
//   - Manufacturer/package label first.
//   - Current retailer package-label capture only when needed.
//   - Exact labeled serving retained in metadata.labelNutrition.
//   - Canonical nutrition normalized mathematically.
//   - No runtime internet connection required.
// =====================================================

(function initializeAriFoodTopBrandsBatch1(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch1";
  const VERIFIED_AT = "2026-08-29";

  const LABEL_RECORDS = [
    { id:"protein-brand-tyson-grilled-chicken-breast-strips", name:"Grilled Chicken Breast Strips", displayName:"Tyson Grilled Chicken Breast Strips", brand:"Tyson", category:"protein", state:"cooked", preparation:"fully-cooked-packaged", aliases:["Tyson Grilled Chicken Breast Strips","Tyson frozen grilled chicken strips"], tags:["chicken","poultry"], basis:{type:"weight"}, labelNutrition:{servingLabel:"3 oz (84 g)",servingGrams:84,calories:120,protein:22,carbs:2,fat:3,fiber:0,sugar:0,saturatedFat:1,cholesterol:60,sodium:360,potassium:410}, sourceUrl:"https://www.tyson.com/products/unbreaded/00023700016256" },
    { id:"protein-brand-tyson-fresh-chicken-breast-strips", name:"Chicken Breast Strips", displayName:"Tyson Trimmed & Ready Chicken Breast Strips", brand:"Tyson", category:"protein", state:"raw", preparation:"fresh-packaged", aliases:["Tyson Trimmed & Ready Chicken Breast Strips","Tyson fresh chicken breast strips"], tags:["chicken","poultry","raw"], basis:{type:"weight"}, labelNutrition:{servingLabel:"4 oz (112 g)",servingGrams:112,calories:110,protein:27,carbs:0,fat:1,fiber:0,sugar:0,saturatedFat:0,cholesterol:80,sodium:45,potassium:370}, sourceUrl:"https://www.tyson.com/products/fresh-frozen-chicken/90075620309348" },
    { id:"protein-brand-justbare-lightly-breaded-chunks", name:"Lightly Breaded Chicken Breast Chunks", displayName:"Just Bare Lightly Breaded Chicken Breast Chunks", brand:"Just Bare", category:"protein", state:"cooked", preparation:"frozen-fully-cooked", aliases:["Just Bare Chicken Chunks","Just Bare Lightly Breaded Chicken Chunks"], tags:["chicken","poultry","breaded"], basis:{type:"weight"}, labelNutrition:{servingLabel:"3 oz (84 g)",servingGrams:84,calories:160,protein:16,carbs:9,fat:7,fiber:0,sugar:2,saturatedFat:1,cholesterol:50,sodium:540,potassium:300}, sourceUrl:"https://justbarechicken.com/product/lightly-breaded-chicken-breast-chunks-family-pack/" },
    { id:"protein-brand-justbare-spicy-bites", name:"Lightly Breaded Spicy Chicken Breast Bites", displayName:"Just Bare Lightly Breaded Spicy Chicken Breast Bites", brand:"Just Bare", category:"protein", state:"cooked", preparation:"frozen-fully-cooked", aliases:["Just Bare Spicy Chicken Bites","Just Bare Lightly Breaded Spicy Bites"], tags:["chicken","poultry","breaded","spicy"], basis:{type:"weight"}, labelNutrition:{servingLabel:"3 oz (84 g)",servingGrams:84,calories:160,protein:16,carbs:10,fat:7,fiber:0,sugar:2,saturatedFat:1,cholesterol:50,sodium:680,potassium:300}, sourceUrl:"https://justbarechicken.com/product/new-lightly-breaded-spicy-chicken-breast-bites/" },
    { id:"snack-brand-quest-cookie-dough-protein-bar", name:"Chocolate Chip Cookie Dough Protein Bar", displayName:"Quest Chocolate Chip Cookie Dough Protein Bar", brand:"Quest", category:"snacks", state:"ready-to-eat", preparation:"packaged-bar", aliases:["Quest Cookie Dough Protein Bar","Quest Chocolate Chip Cookie Dough"], tags:["protein-bar","nutrition-bar"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 bar (60 g)",servingGrams:60,calories:190,protein:21,carbs:22,fat:9,fiber:12,sugar:1,saturatedFat:3,cholesterol:5,sodium:220,potassium:140}, sourceUrl:"https://www.questnutrition.com/products/chocolate-chip-cookie-dough-protein-bar" },
    { id:"snack-brand-kind-dark-chocolate-nuts-sea-salt", name:"Dark Chocolate Nuts & Sea Salt Bar", displayName:"KIND Dark Chocolate Nuts & Sea Salt Bar", brand:"KIND", category:"snacks", state:"ready-to-eat", preparation:"packaged-bar", aliases:["KIND Dark Chocolate Nuts and Sea Salt","KIND Dark Chocolate Nut Bar"], tags:["nut-bar","snack-bar"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 bar (40 g)",servingGrams:40,calories:190,protein:6,carbs:16,fat:15,fiber:7,sugar:5,saturatedFat:3,cholesterol:0,sodium:140,potassium:210}, sourceUrl:"https://www.kindsnacks.com/products/nut-bar/dark-chocolate-nuts-sea-salt" },
    { id:"snack-brand-naturevalley-oats-honey-granola-bars", name:"Oats 'n Honey Crunchy Granola Bars", displayName:"Nature Valley Oats 'n Honey Crunchy Granola Bars", brand:"Nature Valley", category:"snacks", state:"ready-to-eat", preparation:"packaged-bar", aliases:["Nature Valley Oats and Honey Bars","Nature Valley Crunchy Oats n Honey"], tags:["granola-bar","snack-bar"], basis:{type:"weight"}, labelNutrition:{servingLabel:"2 bars (42 g)",servingGrams:42,calories:190,protein:3,carbs:29,fat:7,fiber:2,sugar:11,saturatedFat:1,cholesterol:0,sodium:140,potassium:0}, sourceUrl:"https://www.naturevalley.com/products/oats-n-honey-crunchy-granola-bars" },
    { id:"grain-brand-eggo-homestyle-waffles", name:"Homestyle Waffles", displayName:"Eggo Homestyle Waffles", brand:"Eggo", category:"grain", state:"frozen", preparation:"frozen-ready-to-heat", aliases:["Eggo Homestyle","Kellogg's Eggo Homestyle Waffles"], tags:["waffle","breakfast"], basis:{type:"weight"}, labelNutrition:{servingLabel:"2 waffles (70 g)",servingGrams:70,calories:180,protein:4,carbs:31,fat:4.5,fiber:0.5,sugar:5,saturatedFat:1,cholesterol:0,sodium:230,potassium:30}, sourceUrl:"https://smartlabel.kelloggs.com/Product/Index/038000711978", provider:"Kellanova / Eggo", notes:"Current label reports dietary fiber as <1 g; 0.5 g is used conservatively for normalization and should be refreshed if the label publishes an exact value." },
    { id:"grain-brand-daves-21-whole-grains-seeds", name:"21 Whole Grains and Seeds Bread", displayName:"Dave's Killer Bread 21 Whole Grains and Seeds", brand:"Dave's Killer Bread", category:"grain", state:"ready-to-eat", preparation:"packaged-bread", aliases:["Dave's 21 Whole Grains","DKB 21 Whole Grains and Seeds"], tags:["bread","whole-grain"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 slice (45 g)",servingGrams:45,calories:110,protein:6,carbs:22,fat:1.5,fiber:4,sugar:4,sodium:170}, sourceUrl:"https://www.daveskillerbread.com/nutrition" },
    { id:"grain-brand-daves-powerseed", name:"Powerseed Bread", displayName:"Dave's Killer Bread Powerseed", brand:"Dave's Killer Bread", category:"grain", state:"ready-to-eat", preparation:"packaged-bread", aliases:["Dave's Powerseed","DKB Powerseed"], tags:["bread","whole-grain"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 slice (42 g)",servingGrams:42,calories:90,protein:5,carbs:18,fat:2,fiber:4,sugar:1,sodium:130}, sourceUrl:"https://www.daveskillerbread.com/nutrition" },
    { id:"grain-brand-mission-carb-balance-soft-taco", name:"Carb Balance Soft Taco Flour Tortilla", displayName:"Mission Carb Balance Soft Taco Flour Tortilla", brand:"Mission", category:"grain", state:"ready-to-eat", preparation:"packaged-tortilla", aliases:["Mission Carb Balance Soft Taco","Mission low carb tortilla"], tags:["tortilla","wrap","low-carb"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 tortilla (42 g)",servingGrams:42,calories:70,protein:5,carbs:19,fat:3,fiber:13,sugar:0,saturatedFat:1,cholesterol:0,sodium:320}, sourceUrl:"https://www.missionfoods.com/products/carb-balance-soft-taco-restaurant-style-flour-tortillas/", sourceTier:"manufacturer-plus-current-retail-label", sourceType:"official manufacturer identity/macros plus current retailer package-label capture", confidence:"medium-high", notes:"Mission's current product page confirms the product and key macros; current package-label capture supplies serving mass and sodium. Refresh from the package/manufacturer if formulation changes." },
    { id:"prepared-brand-jimmydean-sausage-egg-cheese-croissant", name:"Sausage, Egg & Cheese Croissant Sandwich", displayName:"Jimmy Dean Sausage, Egg & Cheese Croissant Sandwich", brand:"Jimmy Dean", category:"prepared-meals", state:"frozen", preparation:"frozen-ready-to-heat", aliases:["Jimmy Dean Sausage Egg Cheese Croissant","Jimmy Dean Croissant Breakfast Sandwich"], tags:["breakfast-sandwich"], basis:{type:"weight"}, labelNutrition:{servingLabel:"1 sandwich (128 g)",servingGrams:128,calories:400,protein:13,carbs:29,fat:26,fiber:2,sugar:5,saturatedFat:10,cholesterol:120,sodium:610,potassium:200}, sourceUrl:"https://www.jimmydean.com/products/breakfast-sandwiches/00077900502101" },
    { id:"prepared-brand-jimmydean-original-pork-sausage-patties", name:"Fully Cooked Original Pork Sausage Patties", displayName:"Jimmy Dean Fully Cooked Original Pork Sausage Patties", brand:"Jimmy Dean", category:"prepared-meals", state:"cooked", preparation:"fully-cooked-packaged", aliases:["Jimmy Dean Original Sausage Patties","Jimmy Dean Fully Cooked Sausage Patties"], tags:["breakfast","sausage"], basis:{type:"weight"}, labelNutrition:{servingLabel:"2 patties (68 g)",servingGrams:68,calories:280,protein:8,carbs:1,fat:27,fiber:0,sugar:1,saturatedFat:9,cholesterol:50,sodium:490}, sourceUrl:"https://www.jimmydean.com/products/fully-cooked-sausage/00077900192098" },
    { id:"prepared-brand-campbells-homestyle-chicken-noodle", name:"Homestyle Chicken Noodle Soup", displayName:"Campbell's Homestyle Chicken Noodle Soup", brand:"Campbell's", category:"prepared-meals", state:"ready-to-eat", preparation:"canned-ready-to-heat", aliases:["Campbell's Homestyle Chicken Noodle","Campbells chicken noodle soup"], tags:["soup","canned"], basis:{type:"volume"}, labelNutrition:{servingLabel:"1 cup (240 mL)",servingMilliliters:240,calories:80,protein:6,carbs:9,fat:2.5,fiber:1,sugar:1,saturatedFat:1,cholesterol:20,sodium:790,potassium:190}, sourceUrl:"https://www.campbells.com/products/homestyle/homestyle-chicken-noodle-soup/" }
  ];

  function round(value) { return Math.round(Number(value) * 1000) / 1000; }

  function normalizeRecord(record) {
    const serving = record.labelNutrition;
    const isVolume = record.basis.type === "volume";
    const basisAmount = Number(isVolume ? serving.servingMilliliters : serving.servingGrams);
    const factor = 100 / basisAmount;
    const nutrition = {};

    for (const key of ["calories","protein","carbs","fat","fiber","sugar","saturatedFat","transFat","cholesterol","sodium","potassium"]) {
      if (Number.isFinite(Number(serving[key]))) nutrition[key] = round(Number(serving[key]) * factor);
    }

    const servingObject = isVolume
      ? { id:"label-serving", label:serving.servingLabel, amount:1, unit:"serving", milliliters:serving.servingMilliliters, isDefault:true }
      : { id:"label-serving", label:serving.servingLabel, amount:1, unit:"serving", grams:serving.servingGrams, isDefault:true };

    return {
      id: record.id,
      name: record.name,
      displayName: record.displayName,
      brand: record.brand,
      category: record.category,
      state: record.state || "ready-to-eat",
      preparation: record.preparation || "packaged",
      aliases: record.aliases || [record.displayName],
      tags: Array.from(new Set([record.category,"branded","packaged",...(record.tags || [])])),
      popularity: record.popularity || 100,
      nutritionBasis: isVolume
        ? { type:"volume", amount:100, unit:"mL", milliliters:100 }
        : { type:"weight", amount:100, unit:"g", grams:100 },
      nutrition,
      servings: [
        servingObject,
        isVolume
          ? { id:"100-ml", label:"100 mL", amount:100, unit:"mL", milliliters:100, isDefault:false }
          : { id:"100-g", label:"100 g", amount:100, unit:"g", grams:100, isDefault:false }
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
        normalizationMethod: isVolume ? "Exact label serving normalized mathematically to 100 mL." : "Exact label serving normalized mathematically to 100 g.",
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
      for (const food of registry.getBySource(MODULE_NAME, { includeDisabled:true }) || []) if (food?.id) registry.remove(food.id);
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(FOODS, { source:MODULE_NAME });
  global.AriFoodTopBrandsBatch1 = Object.freeze({
    VERSION, MODULE_NAME, VERIFIED_AT,
    count: () => FOODS.length,
    getFoodIds: () => FOODS.map(food => food.id),
    getBrands: () => Array.from(new Set(FOODS.map(food => food.brand)))
  });

  if ((registration.rejected || 0) > 0) console.error(`[ARI Nutrition] ${MODULE_NAME} rejected ${registration.rejected} record(s).`);
  else console.info(`[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${FOODS.length} branded records.`);
})(typeof window !== "undefined" ? window : globalThis);
