// =====================================================
// ARI REBIRTH
// File: AriFoodTopBrandsBatch5.js
// Version: 1.1.0
//
// Purpose:
//   High-demand branded grocery expansion with 25 everyday foods
//   across deli, breakfast, frozen convenience, yogurt, sandwiches,
//   taquitos, chicken, and pizza snacks.
//
// Data policy:
//   - Exact branded product, never a generic estimate.
//   - Official manufacturer nutrition is authoritative.
//   - Exact labeled serving is retained in metadata.labelNutrition.
//   - Canonical nutrition is normalized mathematically to 100 g.
//   - Retail package-label capture is used only when the manufacturer
//     exposes nutrition but omits a crawlable serving mass.
//   - Product formulations can change; newer package labels supersede
//     this offline snapshot.
// =====================================================

(function initializeAriFoodTopBrandsBatch5(global) {
  "use strict";

  const VERSION = "1.1.0";
  const MODULE_NAME = "AriFoodTopBrandsBatch5";
  const VERIFIED_AT = "2026-08-30";

  const LABEL_RECORDS = [
    {
      id: "protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken",
      name: "Deli Fresh Rotisserie Seasoned Chicken Breast",
      displayName: "Oscar Mayer Deli Fresh Rotisserie Seasoned Chicken Breast",
      brand: "Oscar Mayer", category: "protein", state: "ready-to-eat", preparation: "packaged-deli-meat",
      aliases: ["Oscar Mayer chicken", "Oscar Mayer deli chicken", "Oscar Mayer rotisserie chicken", "Oscar Mayer chicken breast lunch meat", "Deli Fresh chicken"],
      tags: ["deli-meat", "chicken", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 50, protein: 9, carbs: 2, fat: 1, fiber: 0, sugar: 1, saturatedFat: 0, transFat: 0, cholesterol: 30, sodium: 540 },
      sourceUrl: "https://www.oscarmayer.com/products/00044700075098/deli-fresh-rotisserie-chicken-breast"
    },
    {
      id: "protein-brand-hillshire-ultra-thin-honey-ham",
      name: "Ultra Thin Honey Ham",
      displayName: "Hillshire Farm Ultra Thin Honey Ham",
      brand: "Hillshire Farm", category: "protein", state: "ready-to-eat", preparation: "packaged-deli-meat",
      aliases: ["Hillshire honey ham", "Hillshire Farm honey ham", "Hillshire deli ham", "Hillshire lunch meat ham", "Ultra Thin honey ham"],
      tags: ["deli-meat", "ham", "lunch-meat", "sandwich"],
      labelNutrition: { servingLabel: "2 oz (56 g)", servingGrams: 56, calories: 70, protein: 9, carbs: 4, fat: 3, fiber: 0, sugar: 3, saturatedFat: 1, transFat: 0, cholesterol: 25, sodium: 570, potassium: 280 },
      sourceUrl: "https://www.hillshirefarm.com/products/deli-lunch-meats/00044500976489"
    },
    {
      id: "prepared-brand-hot-pockets-hickory-ham-cheddar",
      name: "Hickory Ham and Cheddar Crispy Crust Frozen Sandwich",
      displayName: "Hot Pockets Hickory Ham & Cheddar",
      brand: "Hot Pockets", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
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
      brand: "Lean Cuisine", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Lean Cuisine cheese pizza", "Lean Cuisine four cheese", "Lean Cuisine frozen pizza", "Lean Cuisine personal cheese pizza"],
      tags: ["frozen-meal", "frozen-pizza", "pizza", "cheese", "prepared-meal"],
      labelNutrition: { servingLabel: "1 package (170 g)", servingGrams: 170, calories: 390, protein: 20, carbs: 60, fat: 8, fiber: 3, sugar: 7, saturatedFat: 3, transFat: 0, cholesterol: 15, sodium: 590, potassium: 350 },
      sourceUrl: "https://www.goodnes.com/lean-cuisine/products/four-cheese-frozen-pizza-6oz/"
    },

    {
      id: "prepared-brand-uncrustables-peanut-butter-grape-jelly",
      name: "Peanut Butter & Grape Jelly Sandwich",
      displayName: "Uncrustables Peanut Butter & Grape Jelly Sandwich",
      brand: "Uncrustables", category: "prepared-meals", state: "frozen", preparation: "thaw-and-eat",
      aliases: ["Uncrustables grape", "Uncrustables PB&J grape", "Smuckers Uncrustables grape", "peanut butter grape Uncrustable"],
      tags: ["frozen-sandwich", "peanut-butter", "jelly", "pbj", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (58 g)", servingGrams: 58, calories: 210, protein: 6, carbs: 28, fat: 9, fiber: 2, sugar: 10, saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 220, potassium: 130 },
      sourceUrl: "https://www.smuckersuncrustables.com/sandwiches/peanut-butter-and-grape-jelly"
    },
    {
      id: "prepared-brand-uncrustables-reduced-sugar-grape-wheat",
      name: "Reduced Sugar Peanut Butter & Grape Spread Sandwich on Wheat",
      displayName: "Uncrustables Reduced Sugar Peanut Butter & Grape Spread on Wheat",
      brand: "Uncrustables", category: "prepared-meals", state: "frozen", preparation: "thaw-and-eat",
      aliases: ["Uncrustables reduced sugar grape", "Uncrustables wheat grape", "reduced sugar PB&J Uncrustable", "Smuckers Uncrustables reduced sugar grape"],
      tags: ["frozen-sandwich", "peanut-butter", "grape", "pbj", "wheat-bread", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (58 g)", servingGrams: 58, calories: 190, protein: 6, carbs: 23, fat: 9, fiber: 3, sugar: 7, saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 190, potassium: 155 },
      sourceUrl: "https://www.smuckersuncrustables.com/sandwiches/peanut-butter-and-grape-jelly-on-wheat"
    },
    {
      id: "prepared-brand-uncrustables-peanut-butter-chocolate",
      name: "Peanut Butter & Chocolate Flavored Spread Sandwich",
      displayName: "Uncrustables Peanut Butter & Chocolate Flavored Spread Sandwich",
      brand: "Uncrustables", category: "prepared-meals", state: "frozen", preparation: "thaw-and-eat",
      aliases: ["Uncrustables chocolate", "Uncrustables peanut butter chocolate", "chocolate Uncrustable", "Smuckers Uncrustables chocolate"],
      tags: ["frozen-sandwich", "peanut-butter", "chocolate", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (58 g)", servingGrams: 58, calories: 220, protein: 6, carbs: 28, fat: 10, fiber: 2, sugar: 7, saturatedFat: 2, transFat: 0, cholesterol: 0, sodium: 230, potassium: 150 },
      sourceUrl: "https://www.smuckersuncrustables.com/sandwiches/peanut-butter-and-chocolate"
    },

    {
      id: "prepared-brand-jimmy-dean-sausage-egg-cheese-biscuit",
      name: "Sausage, Egg & Cheese Biscuit Sandwich",
      displayName: "Jimmy Dean Sausage, Egg & Cheese Biscuit Sandwich",
      brand: "Jimmy Dean", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Jimmy Dean sausage egg cheese biscuit", "Jimmy Dean sausage biscuit sandwich", "Jimmy Dean breakfast biscuit"],
      tags: ["breakfast", "breakfast-sandwich", "sausage", "egg", "cheese", "frozen-meal"],
      labelNutrition: { servingLabel: "1 sandwich (128 g)", servingGrams: 128, calories: 410, protein: 12, carbs: 27, fat: 28, fiber: 2, sugar: 4, saturatedFat: 12, transFat: 0, cholesterol: 115, sodium: 850, potassium: 210 },
      sourceUrl: "https://www.jimmydean.com/products/breakfast-sandwiches/00077900502095"
    },
    {
      id: "prepared-brand-jimmy-dean-sausage-egg-cheese-cheddar-biscuit",
      name: "Sausage, Egg & Cheese Cheddar Biscuit Sandwich",
      displayName: "Jimmy Dean Sausage, Egg & Cheese Cheddar Biscuit Sandwich",
      brand: "Jimmy Dean", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Jimmy Dean cheddar biscuit", "Jimmy Dean sausage egg cheese cheddar biscuit", "Jimmy Dean cheddar breakfast sandwich"],
      tags: ["breakfast", "breakfast-sandwich", "sausage", "egg", "cheese", "cheddar-biscuit", "frozen-meal"],
      labelNutrition: { servingLabel: "1 sandwich (128 g)", servingGrams: 128, calories: 390, protein: 12, carbs: 28, fat: 25, fiber: 2, sugar: 4, saturatedFat: 11, transFat: 0, cholesterol: 110, sodium: 910, potassium: 220 },
      sourceUrl: "https://www.jimmydean.com/products/breakfast-sandwiches/00077900501739"
    },
    {
      id: "prepared-brand-jimmy-dean-bacon-egg-cheese-biscuit",
      name: "Bacon, Egg & Cheese Biscuit Sandwich",
      displayName: "Jimmy Dean Bacon, Egg & Cheese Biscuit Sandwich",
      brand: "Jimmy Dean", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Jimmy Dean bacon egg cheese biscuit", "Jimmy Dean bacon biscuit sandwich", "Jimmy Dean bacon breakfast sandwich"],
      tags: ["breakfast", "breakfast-sandwich", "bacon", "egg", "cheese", "frozen-meal"],
      labelNutrition: { servingLabel: "1 sandwich (102 g)", servingGrams: 102, calories: 310, protein: 10, carbs: 26, fat: 19, fiber: 2, sugar: 4, saturatedFat: 9, transFat: 0, cholesterol: 100, sodium: 720, potassium: 230 },
      sourceUrl: "https://www.jimmydean.com/products/breakfast-sandwiches/00077900502125"
    },
    {
      id: "prepared-brand-jimmy-dean-sausage-egg-cheese-biscuit-rollups",
      name: "Sausage, Egg & Cheese Biscuit Roll-Ups",
      displayName: "Jimmy Dean Sausage, Egg & Cheese Biscuit Roll-Ups",
      brand: "Jimmy Dean", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Jimmy Dean biscuit roll ups", "Jimmy Dean sausage egg cheese roll ups", "Jimmy Dean breakfast roll ups"],
      tags: ["breakfast", "breakfast-rollup", "sausage", "egg", "cheese", "frozen-meal"],
      labelNutrition: { servingLabel: "2 pieces (90 g)", servingGrams: 90, calories: 270, protein: 10, carbs: 24, fat: 15, fiber: 2, sugar: 3, saturatedFat: 7, transFat: 0, cholesterol: 70, sodium: 650, potassium: 110 },
      sourceUrl: "https://www.jimmydean.com/products/biscuit-roll-ups/00077900502231"
    },
    {
      id: "prepared-brand-jimmy-dean-maple-sausage-egg-cheese-biscuit-rollups",
      name: "Sausage, Egg & Cheese Maple Biscuit Roll-Ups",
      displayName: "Jimmy Dean Sausage, Egg & Cheese Maple Biscuit Roll-Ups",
      brand: "Jimmy Dean", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Jimmy Dean maple biscuit roll ups", "Jimmy Dean maple breakfast roll ups", "Jimmy Dean sausage egg cheese maple roll ups"],
      tags: ["breakfast", "breakfast-rollup", "sausage", "egg", "cheese", "maple", "frozen-meal"],
      labelNutrition: { servingLabel: "2 pieces (90 g)", servingGrams: 90, calories: 280, protein: 9, carbs: 25, fat: 16, fiber: 2, sugar: 6, saturatedFat: 8, transFat: 0, cholesterol: 65, sodium: 700, potassium: 120 },
      sourceUrl: "https://www.jimmydean.com/products/biscuit-roll-ups/00077900001116"
    },

    {
      id: "prepared-brand-el-monterey-chicken-cheese-taquitos",
      name: "Chicken & Cheese Taquitos",
      displayName: "El Monterey Chicken & Cheese Taquitos",
      brand: "El Monterey", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["El Monterey chicken taquitos", "El Monterey chicken cheese taquitos", "chicken cheese taquitos El Monterey"],
      tags: ["taquitos", "chicken", "cheese", "frozen-meal", "mexican"],
      labelNutrition: { servingLabel: "3 taquitos (85 g)", servingGrams: 85, calories: 230, protein: 7, carbs: 26, fat: 11, fiber: 0, sugar: 1, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 230, potassium: 120 },
      sourceUrl: "https://elmonterey.com/products/taquitos/chicken-cheese-taquitos/"
    },
    {
      id: "prepared-brand-el-monterey-steak-cheese-taquitos",
      name: "Steak & Cheese Taquitos",
      displayName: "El Monterey Steak & Cheese Taquitos",
      brand: "El Monterey", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["El Monterey steak taquitos", "El Monterey steak cheese taquitos", "steak and cheese taquitos"],
      tags: ["taquitos", "beef", "steak", "cheese", "frozen-meal", "mexican"],
      labelNutrition: { servingLabel: "3 taquitos (85 g)", servingGrams: 85, calories: 230, protein: 8, carbs: 26, fat: 11, fiber: 0, sugar: 1, saturatedFat: 2.5, transFat: 0, cholesterol: 10, sodium: 310, potassium: 100 },
      sourceUrl: "https://elmonterey.com/products/taquitos/steak-cheese-taquitos/"
    },
    {
      id: "prepared-brand-el-monterey-extra-crunchy-southwest-chicken-taquitos",
      name: "Extra Crunchy Southwest Chicken Taquitos",
      displayName: "El Monterey Extra Crunchy Southwest Chicken Taquitos",
      brand: "El Monterey", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["El Monterey southwest chicken taquitos", "El Monterey extra crunchy chicken taquitos", "southwest chicken taquitos"],
      tags: ["taquitos", "chicken", "southwest", "extra-crunchy", "frozen-meal", "mexican"],
      labelNutrition: { servingLabel: "3 taquitos (98 g)", servingGrams: 98, calories: 240, protein: 7, carbs: 28, fat: 11, fiber: 2, sugar: 1, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 450, potassium: 110 },
      sourceUrl: "https://elmonterey.com/products/taquitos/extra-crunchy-southwest-chicken-taquitos/"
    },
    {
      id: "prepared-brand-el-monterey-extra-crunchy-beef-cheese-taquitos",
      name: "Extra Crunchy Taco Seasoned Beef & Cheese Taquitos",
      displayName: "El Monterey Extra Crunchy Taco Seasoned Beef & Cheese Taquitos",
      brand: "El Monterey", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["El Monterey beef cheese taquitos", "El Monterey extra crunchy beef taquitos", "taco seasoned beef taquitos"],
      tags: ["taquitos", "beef", "cheese", "extra-crunchy", "frozen-meal", "mexican"],
      labelNutrition: { servingLabel: "3 taquitos (98 g)", servingGrams: 98, calories: 260, protein: 7, carbs: 26, fat: 13, fiber: 0, sugar: 1, saturatedFat: 4, transFat: 0, cholesterol: 15, sodium: 350, potassium: 200 },
      sourceUrl: "https://elmonterey.com/products/taquitos/extra-crunchy-taco-seasoned-beef-cheese-taquitos/"
    },

    {
      id: "protein-brand-tyson-crispy-chicken-strips",
      name: "Crispy Chicken Strips",
      displayName: "Tyson Crispy Chicken Strips",
      brand: "Tyson", category: "protein", state: "frozen", preparation: "fully-cooked-breaded",
      aliases: ["Tyson crispy chicken strips", "Tyson chicken strips", "Tyson breaded chicken strips"],
      tags: ["chicken", "breaded", "chicken-strips", "frozen-protein"],
      labelNutrition: { servingLabel: "3 oz (84 g)", servingGrams: 84, calories: 200, protein: 13, carbs: 15, fat: 9, fiber: 0, sugar: 0, saturatedFat: 2, transFat: 0, cholesterol: 35, sodium: 410, potassium: 320 },
      sourceUrl: "https://www.tyson.com/products/breaded-strips-tenderloins/00023700014108"
    },
    {
      id: "protein-brand-tyson-chicken-patties",
      name: "Chicken Patties",
      displayName: "Tyson Chicken Patties",
      brand: "Tyson", category: "protein", state: "frozen", preparation: "fully-cooked-breaded",
      aliases: ["Tyson chicken patties", "Tyson frozen chicken patty", "Tyson breaded chicken patties"],
      tags: ["chicken", "breaded", "chicken-patty", "frozen-protein"],
      labelNutrition: { servingLabel: "1 piece (76 g)", servingGrams: 76, calories: 200, protein: 10, carbs: 10, fat: 13, fiber: 0, sugar: 0, saturatedFat: 3, transFat: 0, cholesterol: 35, sodium: 380, potassium: 160 },
      sourceUrl: "https://www.tyson.com/products/nuggets-patties/00023700060235"
    },
    {
      id: "protein-brand-tyson-honey-battered-breast-tenders",
      name: "Honey Battered Breast Tenders",
      displayName: "Tyson Honey Battered Breast Tenders",
      brand: "Tyson", category: "protein", state: "frozen", preparation: "fully-cooked-battered",
      aliases: ["Tyson honey battered tenders", "Tyson honey chicken tenders", "Tyson honey battered chicken"],
      tags: ["chicken", "battered", "chicken-tenders", "honey", "frozen-protein"],
      labelNutrition: { servingLabel: "5 pieces (90 g)", servingGrams: 90, calories: 230, protein: 10, carbs: 17, fat: 14, fiber: 1, sugar: 3, saturatedFat: 4, transFat: 0, cholesterol: 40, sodium: 400, potassium: 110 },
      sourceUrl: "https://www.tyson.com/products/nuggets-patties/00023700014122"
    },
    {
      id: "prepared-brand-tyson-original-chicken-breast-sandwich",
      name: "Original Chicken Breast Sandwich",
      displayName: "Tyson Original Chicken Breast Sandwich",
      brand: "Tyson", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Tyson chicken sandwich", "Tyson original chicken breast sandwich", "Tyson frozen chicken sandwich"],
      tags: ["chicken", "chicken-sandwich", "frozen-sandwich", "prepared-meal"],
      labelNutrition: { servingLabel: "1 sandwich (170 g)", servingGrams: 170, calories: 460, protein: 24, carbs: 57, fat: 15, fiber: 2, sugar: 7, saturatedFat: 3, transFat: 0, cholesterol: 50, sodium: 840, potassium: 470 },
      sourceUrl: "https://www.tyson.com/products/sandwiches/00023700055880"
    },

    {
      id: "dairy-brand-yoplait-original-strawberry-6oz",
      name: "Original Strawberry Low Fat Yogurt",
      displayName: "Yoplait Original Strawberry Yogurt 6 oz",
      brand: "Yoplait", category: "dairy", state: "ready-to-eat", preparation: "packaged-yogurt",
      aliases: ["Yoplait strawberry", "Yoplait Original strawberry", "Yoplait strawberry yogurt", "Yoplait 6 oz strawberry"],
      tags: ["yogurt", "strawberry", "low-fat", "single-serve"],
      labelNutrition: { servingLabel: "1 container (6 oz / 170 g)", servingGrams: 170, calories: 140, protein: 5, carbs: 26, fat: 1.5, fiber: 0, sugar: 18, saturatedFat: 1, transFat: 0, cholesterol: 5, sodium: 85 },
      sourceUrl: "https://www.yoplait.com/products/original-single-serve-strawberry"
    },
    {
      id: "dairy-brand-yoplait-original-french-vanilla-6oz",
      name: "Original French Vanilla Low Fat Yogurt",
      displayName: "Yoplait Original French Vanilla Yogurt 6 oz",
      brand: "Yoplait", category: "dairy", state: "ready-to-eat", preparation: "packaged-yogurt",
      aliases: ["Yoplait vanilla", "Yoplait French vanilla", "Yoplait Original vanilla yogurt", "Yoplait 6 oz vanilla"],
      tags: ["yogurt", "vanilla", "low-fat", "single-serve"],
      labelNutrition: { servingLabel: "1 container (6 oz / 170 g)", servingGrams: 170, calories: 140, protein: 5, carbs: 26, fat: 1.5, fiber: 0, sugar: 19, saturatedFat: 1, transFat: 0, cholesterol: 5, sodium: 80, potassium: 240 },
      sourceUrl: "https://www.yoplait.com/products/original-single-serve-french-vanilla"
    },
    {
      id: "dairy-brand-yoplait-original-mountain-blueberry-6oz",
      name: "Original Mountain Blueberry Low Fat Yogurt",
      displayName: "Yoplait Original Mountain Blueberry Yogurt 6 oz",
      brand: "Yoplait", category: "dairy", state: "ready-to-eat", preparation: "packaged-yogurt",
      aliases: ["Yoplait blueberry", "Yoplait mountain blueberry", "Yoplait Original blueberry yogurt", "Yoplait 6 oz blueberry"],
      tags: ["yogurt", "blueberry", "low-fat", "single-serve"],
      labelNutrition: { servingLabel: "1 container (6 oz / 170 g)", servingGrams: 170, calories: 140, protein: 5, carbs: 27, fat: 1.5, fiber: 0, sugar: 19, saturatedFat: 1, transFat: 0, cholesterol: 5, sodium: 80, potassium: 240 },
      sourceUrl: "https://www.yoplait.com/products/original-single-serve-mountain-blueberry"
    },

    {
      id: "prepared-brand-totinos-pepperoni-pizza-rolls",
      name: "Pepperoni Pizza Rolls",
      displayName: "Totino's Pepperoni Pizza Rolls",
      brand: "Totino's", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Totinos pepperoni pizza rolls", "Totino's pepperoni rolls", "pepperoni pizza rolls", "Totinos pizza rolls pepperoni"],
      tags: ["pizza-rolls", "pepperoni", "frozen-snack", "frozen-meal"],
      labelNutrition: { servingLabel: "6 rolls (85 g)", servingGrams: 85, calories: 200, protein: 5, carbs: 31, fat: 7, fiber: 1, sugar: 2, saturatedFat: 2.5, transFat: 0, cholesterol: 5, sodium: 350, potassium: 160 },
      sourceUrl: "https://www.totinos.com/products/pepperoni-pizza-rolls",
      sourceTier: "manufacturer-plus-current-retail-label",
      sourceType: "official manufacturer nutrition plus current retailer package serving weight",
      confidence: "medium-high",
      notes: "Manufacturer page is authoritative for current nutrition; current retailer package label supplies the 85 g mass for the manufacturer's 6-roll serving."
    },
    {
      id: "prepared-brand-totinos-cheese-pizza-rolls",
      name: "Cheese Pizza Rolls",
      displayName: "Totino's Cheese Pizza Rolls",
      brand: "Totino's", category: "prepared-meals", state: "frozen", preparation: "frozen-ready-to-heat",
      aliases: ["Totinos cheese pizza rolls", "Totino's cheese rolls", "cheese pizza rolls", "Totinos pizza rolls cheese"],
      tags: ["pizza-rolls", "cheese", "frozen-snack", "frozen-meal"],
      labelNutrition: { servingLabel: "6 rolls (85 g)", servingGrams: 85, calories: 200, protein: 4, carbs: 32, fat: 6, fiber: 1, sugar: 3, saturatedFat: 2.5, transFat: 0, cholesterol: 0, sodium: 360, potassium: 190 },
      sourceUrl: "https://www.totinos.com/products/cheese-pizza-rolls",
      sourceTier: "manufacturer-plus-current-retail-label",
      sourceType: "official manufacturer nutrition plus current retailer package serving weight",
      confidence: "medium-high",
      notes: "Manufacturer page is authoritative for current nutrition; current retailer package label supplies the 85 g mass for the manufacturer's 6-roll serving."
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
        normalizationMethod: "Exact package label serving normalized mathematically to 100 g.",
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
