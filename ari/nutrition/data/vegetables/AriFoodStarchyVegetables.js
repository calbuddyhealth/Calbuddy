// =====================================================
// ARI REBIRTH
// File: AriFoodStarchyVegetables.js
// Version: 1.0.0
//
// Purpose:
//   Offline starchy vegetable reference data for
//   ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Russet, red, and gold potatoes
//   - Plain boiled potato
//   - Sweet potato, raw + baked + boiled
//   - True yam, raw + cooked
//   - Cassava / yuca raw reference
//   - Taro raw reference + cooked
//   - Sweet yellow corn, raw + cooked
//   - Green peas, raw + cooked
//   - Ripe plantain raw reference
//
// Important boundaries:
//   Fries, chips, tots, loaded/mashed potatoes,
//   candied sweet potato, elote, creamed corn,
//   fried plantains, tostones, maduros, and similar
//   prepared dishes are NOT represented here.
//
// Reliability:
//   - USDA Foundation Foods where appropriate.
//   - USDA SR Legacy stable generic references.
//   - Canonical basis: 100 g edible portion.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables v1+
// =====================================================

(function initializeAriFoodStarchyVegetables(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodStarchyVegetables";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "ownedByThisModule": [
      "potatoes",
      "sweet potatoes",
      "true yams",
      "cassava / yuca",
      "taro",
      "sweet corn",
      "green peas",
      "plantains"
    ],
    "preparedDishesExcluded": [
      "French fries",
      "tater tots",
      "potato chips",
      "loaded baked potatoes",
      "mashed potatoes with dairy or fat",
      "candied sweet potatoes",
      "elote",
      "creamed corn",
      "fried plantains",
      "tostones",
      "maduros cooked in oil"
    ]
  },
  "rules": [
    "Store canonical nutrition per 100 g edible portion.",
    "Prefer USDA food-specific Atwater energy for current Foundation records.",
    "Keep materially different raw, boiled, and baked states separate.",
    "Do not infer fried or air-fried nutrition from raw vegetables.",
    "Cassava and taro raw entries are source references and explicitly marked as requiring cooking.",
    "Plantain cooked nutrition is not fabricated from the raw Foundation record.",
    "Do not force questionable Foundation analytical fiber fields into legacy-style potato profiles; omit fiber where comparability is uncertain.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_STARCHY_VEGETABLE_FOODS =
    [
  {
    "id": "vegetable-potato-russet-raw-no-skin",
    "name": "Russet Potato",
    "displayName": "Russet Potato â Raw, Without Skin",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "russet potato",
      "russet potatoes",
      "raw russet potato",
      "Idaho potato",
      "baking potato raw"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "potato-russet",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81,
      "protein": 2.27,
      "carbs": 17.8,
      "fat": 0.36,
      "sodium": 2.74,
      "potassium": 450
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "potato-russet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Potatoes, russet, without skin, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2346401,
        "sourceNote": "Energy uses the USDA food-specific Atwater value. Fiber is intentionally omitted because the current Foundation analytical fiber field is not treated as directly comparable with older generic potato fiber values."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-potato-russet-baked-skin",
    "name": "Russet Potato",
    "displayName": "Russet Potato â Baked, Flesh and Skin",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "baked russet potato",
      "baked potato",
      "russet baked potato",
      "jacket potato",
      "plain baked potato"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "potato-russet",
      "cooked"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 95,
      "protein": 2.63,
      "carbs": 21.44,
      "fat": 0.13,
      "fiber": 2.3,
      "sodium": 14,
      "potassium": 550
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "potato-russet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Potatoes, Russet, flesh and skin, baked",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170030
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-potato-boiled-flesh-no-salt",
    "name": "Potato",
    "displayName": "Potato â Boiled, Flesh, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "boiled potato",
      "boiled potatoes",
      "plain potato",
      "plain boiled potatoes",
      "potato boiled no salt"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "potato",
      "cooked"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 87,
      "protein": 1.87,
      "carbs": 20.13,
      "fat": 0.1,
      "fiber": 1.8,
      "sodium": 4,
      "potassium": 379,
      "saturatedFat": 0.026
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "potato",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Potatoes, boiled, cooked in skin, flesh, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170438
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-potato-red-raw-no-skin",
    "name": "Red Potato",
    "displayName": "Red Potato â Raw, Without Skin",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red potato",
      "red potatoes",
      "raw red potato",
      "red skin potato raw"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "potato-red",
      "raw"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 73.4,
      "protein": 2.06,
      "carbs": 16.3,
      "fat": 0.248,
      "sodium": 2.86,
      "potassium": 472
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "potato-red",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Potatoes, red, without skin, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2346402,
        "sourceNote": "Energy uses the USDA food-specific Atwater value. Fiber is intentionally omitted rather than forcing a non-comparable Foundation analytical field into the generic macro profile."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-potato-gold-raw-no-skin",
    "name": "Gold Potato",
    "displayName": "Gold Potato â Raw, Without Skin",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "gold potato",
      "gold potatoes",
      "yellow potato",
      "yellow potatoes",
      "Yukon Gold potato",
      "Yukon Gold potatoes"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "potato-gold",
      "raw"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 71.6,
      "protein": 1.81,
      "carbs": 16.0,
      "fat": 0.264,
      "sodium": 2.24,
      "potassium": 446
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "potato-gold",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Potatoes, gold, without skin, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2346403,
        "sourceNote": "Energy uses the USDA food-specific Atwater value. Yukon Gold is a search alias; the canonical USDA food remains gold potato."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-sweet-potato-orange-raw-no-skin",
    "name": "Sweet Potato",
    "displayName": "Sweet Potato â Orange Flesh, Raw, Without Skin",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "sweet potato",
      "sweet potatoes",
      "orange sweet potato",
      "raw sweet potato"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "sweet-potato",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 77.4,
      "protein": 1.58,
      "carbs": 17.3,
      "fat": 0.375,
      "fiber": 4.44,
      "sodium": 0,
      "potassium": 486
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "sweet-potato",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Sweet potatoes, orange flesh, without skin, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "Energy uses the USDA food-specific Atwater value."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-sweet-potato-baked-flesh-no-salt",
    "name": "Sweet Potato",
    "displayName": "Sweet Potato â Baked, Flesh, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "baked sweet potato",
      "plain baked sweet potato",
      "sweet potato baked no salt"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "sweet-potato",
      "cooked"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 90,
      "protein": 2.01,
      "carbs": 20.71,
      "fat": 0.15,
      "fiber": 3.3
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "sweet-potato",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Sweet potato, cooked, baked in skin, flesh, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 168483
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-sweet-potato-boiled-no-skin",
    "name": "Sweet Potato",
    "displayName": "Sweet Potato â Boiled, Without Skin",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "boiled sweet potato",
      "boiled sweet potatoes",
      "plain sweet potato",
      "sweet potato boiled"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "sweet-potato",
      "cooked"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 76,
      "protein": 1.37,
      "carbs": 17.72,
      "fat": 0.14,
      "fiber": 2.5,
      "sodium": 27,
      "potassium": 230,
      "saturatedFat": 0.031
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "sweet-potato",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Sweet potato, cooked, boiled, without skin",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 168484
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-yam-raw",
    "name": "Yam",
    "displayName": "Yam â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "yam",
      "yams",
      "true yam",
      "raw yam"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "yam",
      "raw"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 118,
      "protein": 1.53,
      "carbs": 27.88,
      "fat": 0.17,
      "fiber": 4.1
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "yam",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yam, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-yam-cooked-plain-no-salt",
    "name": "Yam",
    "displayName": "Yam â Cooked, Plain, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled-or-baked",
    "aliases": [
      "cooked yam",
      "boiled yam",
      "baked yam",
      "plain yam",
      "true yam cooked"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "yam",
      "cooked"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 116,
      "protein": 1.49,
      "carbs": 27.48,
      "fat": 0.14,
      "fiber": 3.9,
      "sodium": 8,
      "potassium": 670,
      "saturatedFat": 0.029
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "yam",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yam, cooked, boiled, drained, or baked, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170072
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-cassava-raw-reference",
    "name": "Cassava",
    "displayName": "Cassava / Yuca â Raw Reference",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw-reference",
    "aliases": [
      "cassava",
      "yuca",
      "yucca root",
      "manioc",
      "cassava root"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "cassava",
      "raw"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 160,
      "protein": 1.36,
      "carbs": 38.06,
      "fat": 0.28,
      "fiber": 1.8
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "cassava",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cassava, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169985
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": true,
      "safetyNote": "Cassava is not treated as ready-to-eat raw. This record is retained only as a source-traceable ingredient reference.",
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-taro-raw-reference",
    "name": "Taro",
    "displayName": "Taro â Raw Reference",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw-reference",
    "aliases": [
      "taro",
      "taro root",
      "raw taro"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "taro",
      "raw"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 112,
      "protein": 1.5,
      "carbs": 26.46,
      "fat": 0.2,
      "fiber": 4.1,
      "potassium": 591
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "taro",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Taro, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169308
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": true,
      "safetyNote": "Raw taro contains irritating calcium oxalate crystals and should be cooked before eating.",
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-taro-cooked-no-salt",
    "name": "Taro",
    "displayName": "Taro â Cooked, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "cooked taro",
      "boiled taro",
      "plain taro",
      "taro root cooked"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "taro",
      "cooked"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 142,
      "protein": 0.52,
      "carbs": 34.6,
      "fat": 0.11,
      "fiber": 5.1,
      "sodium": 15,
      "potassium": 484
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "taro",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Taro, cooked, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 168486
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-corn-sweet-yellow-raw",
    "name": "Sweet Corn",
    "displayName": "Sweet Corn â Yellow, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "corn",
      "sweet corn",
      "yellow corn",
      "raw corn",
      "corn kernels raw"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "corn",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 86,
      "protein": 3.27,
      "carbs": 18.7,
      "fat": 1.35,
      "fiber": 2.0
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "corn",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Corn, sweet, yellow, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169998
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-corn-sweet-yellow-cooked-no-salt",
    "name": "Sweet Corn",
    "displayName": "Sweet Corn â Yellow, Cooked, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked corn",
      "boiled corn",
      "corn on the cob plain",
      "sweet corn cooked",
      "corn kernels cooked"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "corn",
      "cooked"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 96,
      "protein": 3.41,
      "carbs": 20.98,
      "fat": 1.5,
      "fiber": 2.4,
      "sodium": 1,
      "potassium": 218,
      "saturatedFat": 0.197
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "corn",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Corn, sweet, yellow, cooked, boiled, drained, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169999
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-green-peas-raw",
    "name": "Green Peas",
    "displayName": "Green Peas â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green peas",
      "peas",
      "sweet peas",
      "garden peas",
      "raw peas"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "green-peas",
      "raw"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81,
      "protein": 5.42,
      "carbs": 14.45,
      "fat": 0.4,
      "fiber": 5.1
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "green-peas",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Peas, green, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-green-peas-cooked-boiled-no-salt",
    "name": "Green Peas",
    "displayName": "Green Peas â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked peas",
      "boiled peas",
      "green peas cooked",
      "plain peas",
      "sweet peas cooked"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "green-peas",
      "cooked"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 84,
      "protein": 5.36,
      "carbs": 15.63,
      "fat": 0.22,
      "fiber": 5.5
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "green-peas",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Peas, green, cooked, boiled, drained, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-plantain-ripe-raw-reference",
    "name": "Plantain",
    "displayName": "Plantain â Ripe, Raw Reference",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw-reference",
    "aliases": [
      "plantain",
      "plantains",
      "ripe plantain",
      "yellow plantain",
      "maduros raw ingredient"
    ],
    "tags": [
      "vegetable",
      "starchy-vegetable",
      "plantain",
      "raw"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 123,
      "protein": 1.16,
      "carbs": 31.0,
      "fat": 0.893,
      "fiber": 2.12,
      "sodium": 0,
      "potassium": 396
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodStarchyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "starchy-vegetable",
      "starchyType": "plantain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Plantains, ripe, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "Energy uses the USDA food-specific Atwater value. Fried, baked, boiled, or air-fried plantains are not inferred from this raw record because cooking and added fat can materially change calories per 100 g."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "requiresCookingBeforeConsumption": false,
      "safetyNote": null,
      "notes": "Plain unbranded starchy vegetable reference. Added oil, butter, milk, cream, cheese, salt, sugar, syrup, breading, sauce, or other recipe ingredients are not included."
    }
  }
];

  function clone(value) {
    try {
      return typeof structuredClone === "function"
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function markFailed(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

    if (
      global.AriFoodVegetables &&
      typeof global.AriFoodVegetables.markModuleFailed === "function"
    ) {
      global.AriFoodVegetables.markModuleFailed(
        MODULE_NAME,
        message,
        {
          version: VERSION,
          verifiedAt: VERIFIED_AT,
          ...metadata
        }
      );
    }
  }

  const registry = global.AriFoodRegistry;

  if (!registry || typeof registry.registerMany !== "function") {
    markFailed("AriFoodRegistry.registerMany() is unavailable.");
    return;
  }

  if (
    typeof registry.getBySource === "function" &&
    typeof registry.remove === "function"
  ) {
    try {
      const existing = registry.getBySource(
        MODULE_NAME,
        { includeDisabled: true }
      );

      if (Array.isArray(existing)) {
        for (const food of existing) {
          if (food && food.id) {
            registry.remove(food.id);
          }
        }
      }
    } catch (error) {
      console.warn(
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`,
        error
      );
    }
  }

  const registration = registry.registerMany(
    ARI_STARCHY_VEGETABLE_FOODS,
    { source: MODULE_NAME }
  );

  const moduleResult = {
    registered: registration.registered || 0,
    replaced: registration.replaced || 0,
    rejected: registration.rejected || 0,
    duplicates: registration.duplicates || 0,
    metadata: {
      version: VERSION,
      verifiedAt: VERIFIED_AT,
      foodCount: ARI_STARCHY_VEGETABLE_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "potato",
        "sweet-potato",
        "yam",
        "cassava",
        "taro",
        "corn",
        "green-peas",
        "plantain"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} starchy-vegetable record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodVegetables &&
    typeof global.AriFoodVegetables.markModuleLoaded === "function"
  ) {
    global.AriFoodVegetables.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodStarchyVegetables = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_STARCHY_VEGETABLE_FOODS.length;
    },

    getFoodIds() {
      return ARI_STARCHY_VEGETABLE_FOODS.map(food => food.id);
    },

    getStarchyTypes() {
      return Array.from(
        new Set(
          ARI_STARCHY_VEGETABLE_FOODS.map(
            food => food.metadata.starchyType
          )
        )
      );
    },

    getRawRecords() {
      return ARI_STARCHY_VEGETABLE_FOODS
        .filter(food => food.state === "raw")
        .map(clone);
    },

    getCookedRecords() {
      return ARI_STARCHY_VEGETABLE_FOODS
        .filter(food => food.state === "cooked")
        .map(clone);
    },

    getRequiresCookingRecords() {
      return ARI_STARCHY_VEGETABLE_FOODS
        .filter(
          food =>
            food.metadata?.requiresCookingBeforeConsumption === true
        )
        .map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();

      const record = ARI_STARCHY_VEGETABLE_FOODS.find(
        food => food.id === id
      );

      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-starchy-vegetables-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_STARCHY_VEGETABLE_FOODS.length,
            runtimeInternetRequired: false,
            registration: moduleResult
          }
        }
      )
    );
  } catch (error) {
    // Non-browser environments may not support CustomEvent.
  }

  console.info(
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_STARCHY_VEGETABLE_FOODS.length} source-traceable starchy vegetable records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);