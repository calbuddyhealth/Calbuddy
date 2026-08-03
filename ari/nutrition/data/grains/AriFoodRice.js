// =====================================================
// ARI REBIRTH
// File: AriFoodRice.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline rice reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Coverage:
//   - White long-grain rice, raw + cooked
//   - Brown long-grain rice, raw + cooked
//   - White medium-grain rice, cooked
//   - White short-grain rice, cooked
//   - Glutinous / sticky rice, cooked
//   - Parboiled rice, cooked
//   - Wild rice, raw + cooked
//   - Black rice, raw
//   - Red rice, raw
//
// Critical rule:
//   DRY RICE AND COOKED RICE ARE NOT INTERCHANGEABLE.
//   Water absorption materially changes calories and
//   macros per 100 g.
//
// Reliability:
//   - USDA Foundation Foods when appropriate.
//   - USDA SR Legacy for exact identified generic rice.
//   - Nutrition basis is 100 g edible portion.
//   - No invented jasmine/basmati equivalence.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodRice(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodRice";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytical black/red rice when available",
    "USDA FoodData Central SR Legacy for exact identified raw/cooked generic rice references"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Never interchange dry/raw rice nutrition with cooked rice nutrition.",
    "Water absorption during cooking is the primary reason cooked rice has far fewer calories per 100 g than dry rice.",
    "Use no-salt/plain cooked references when possible so added salt or fats can be logged separately.",
    "Keep long-grain, medium-grain, short-grain, glutinous, parboiled, wild, black, and red rice as distinct references.",
    "Do not automatically label generic long-grain rice as jasmine or basmati without an exact source-supported variety record.",
    "Do not treat sushi rice as plain short-grain rice after vinegar, sugar, or salt has been added.",
    "Do not treat mango sticky rice as plain glutinous rice because coconut milk and sugar materially change nutrition.",
    "Cup weights are intentionally not hard-coded in this first production version because cooked-rice volume weight varies with hydration and packing; weight-based logging is more reliable.",
    "Every record carries auditable USDA provenance and an FDC/NDB identifier when confidently confirmed.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_RICE_FOODS =
    [
  {
    "id": "rice-white-long-grain-raw-unenriched",
    "name": "White Rice",
    "displayName": "White Rice â Long-Grain, Raw, Unenriched",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "white rice",
      "long grain rice",
      "long-grain white rice",
      "uncooked white rice",
      "dry white rice"
    ],
    "tags": [
      "grain",
      "rice",
      "white-long-grain",
      "white",
      "long-grain",
      "unenriched",
      "dry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 365,
      "protein": 7.13,
      "carbs": 79.95,
      "fat": 0.66,
      "fiber": 1.3,
      "sodium": 5,
      "potassium": 115,
      "saturatedFat": 0.18
    },
    "servings": [
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "1-oz-dry",
        "label": "1 oz dry",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "white-long-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, long-grain, regular, raw, unenriched",
        "fdcId": 169756,
        "release": "April 2018 (final)"
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
      "glutenFreeByNature": true,
      "notes": "Generic rice reference. Cooked rice nutrition per 100 g changes substantially with water absorption, so dry and cooked entries must never be interchanged. Added oil, butter, salt, broth, coconut milk, sauces, or seasonings are not included."
    }
  },
  {
    "id": "rice-white-long-grain-cooked-no-salt",
    "name": "White Rice",
    "displayName": "White Rice â Long-Grain, Cooked, No Salt",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "white rice",
      "cooked white rice",
      "long grain white rice",
      "plain white rice",
      "steamed white rice"
    ],
    "tags": [
      "grain",
      "rice",
      "white-long-grain",
      "white",
      "long-grain",
      "cooked",
      "no-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 130,
      "protein": 2.69,
      "carbs": 28.17,
      "fat": 0.28,
      "fiber": 0.4,
      "sodium": 1,
      "potassium": 35,
      "saturatedFat": 0.077
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "white-long-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, long-grain, regular, cooked, unenriched, without salt",
        "ndbNumber": "20445",
        "release": "April 2018 (final)"
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
      "glutenFreeByNature": true,
      "notes": "Plain cooked long-grain white rice without salt or added fat. Do not use this entry for dry rice weight."
    }
  },
  {
    "id": "rice-brown-long-grain-raw",
    "name": "Brown Rice",
    "displayName": "Brown Rice â Long-Grain, Raw",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "brown rice",
      "long grain brown rice",
      "uncooked brown rice",
      "dry brown rice"
    ],
    "tags": [
      "grain",
      "rice",
      "brown-long-grain",
      "brown",
      "long-grain",
      "whole-grain",
      "dry"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 367,
      "protein": 7.54,
      "carbs": 76.25,
      "fat": 3.2,
      "fiber": 3.6,
      "sodium": 5,
      "potassium": 250,
      "saturatedFat": 0.66
    },
    "servings": [
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "1-oz-dry",
        "label": "1 oz dry",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "brown-long-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, brown, long-grain, raw",
        "fdcId": 169703,
        "release": "April 2018 (final)"
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
      "glutenFreeByNature": true,
      "notes": "Generic rice reference. Cooked rice nutrition per 100 g changes substantially with water absorption, so dry and cooked entries must never be interchanged. Added oil, butter, salt, broth, coconut milk, sauces, or seasonings are not included."
    }
  },
  {
    "id": "rice-brown-long-grain-cooked",
    "name": "Brown Rice",
    "displayName": "Brown Rice â Long-Grain, Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "brown rice",
      "cooked brown rice",
      "long grain brown rice",
      "plain brown rice"
    ],
    "tags": [
      "grain",
      "rice",
      "brown-long-grain",
      "brown",
      "long-grain",
      "whole-grain",
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
      "calories": 123,
      "protein": 2.74,
      "carbs": 25.58,
      "fat": 0.97,
      "fiber": 1.6,
      "sodium": 4,
      "potassium": 86
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "brown-long-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, brown, long-grain, cooked",
        "fdcId": 169704,
        "release": "April 2018 (final)"
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
      "glutenFreeByNature": true,
      "notes": "Plain cooked long-grain brown rice. Do not use this entry for dry rice weight."
    }
  },
  {
    "id": "rice-white-medium-grain-cooked-unenriched",
    "name": "White Rice",
    "displayName": "White Rice â Medium-Grain, Cooked, Unenriched",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "medium grain rice",
      "medium-grain white rice",
      "cooked medium grain rice",
      "white rice medium grain"
    ],
    "tags": [
      "grain",
      "rice",
      "white-medium-grain",
      "white",
      "medium-grain",
      "cooked",
      "unenriched"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 130,
      "protein": 2.38,
      "carbs": 28.59,
      "fat": 0.21,
      "sodium": 0,
      "potassium": 29,
      "saturatedFat": 0.057
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "white-medium-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, medium-grain, cooked, unenriched",
        "fdcId": 168930,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "glutenFreeByNature": true,
      "notes": "USDA does not report dietary fiber for this exact legacy record, so ARI leaves fiber unset rather than inventing a value."
    }
  },
  {
    "id": "rice-white-short-grain-cooked-unenriched",
    "name": "White Rice",
    "displayName": "White Rice â Short-Grain, Cooked, Unenriched",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "short grain rice",
      "short-grain white rice",
      "cooked short grain rice",
      "white short grain rice",
      "sushi style rice plain"
    ],
    "tags": [
      "grain",
      "rice",
      "white-short-grain",
      "white",
      "short-grain",
      "cooked",
      "unenriched"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 130,
      "protein": 2.36,
      "carbs": 28.7,
      "fat": 0.19,
      "sodium": 0,
      "potassium": 26,
      "saturatedFat": 0.051
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "white-short-grain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, short-grain, cooked, unenriched",
        "fdcId": 168932,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "glutenFreeByNature": true,
      "notes": "This is plain cooked short-grain white rice, not prepared sushi rice. Sushi vinegar, sugar, and salt must be logged separately."
    }
  },
  {
    "id": "rice-white-glutinous-cooked-unenriched",
    "name": "Glutinous Rice",
    "displayName": "Glutinous / Sticky Rice â Cooked, Unenriched",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "sticky rice",
      "glutinous rice",
      "sweet rice",
      "cooked sticky rice",
      "thai sticky rice"
    ],
    "tags": [
      "grain",
      "rice",
      "glutinous",
      "white",
      "glutinous",
      "sticky-rice",
      "cooked"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 97,
      "protein": 2.02,
      "carbs": 21.09,
      "fat": 0.19,
      "fiber": 1.0,
      "saturatedFat": 0.039
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "glutinous",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, glutinous, unenriched, cooked",
        "fdcId": 169711,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat"
      ],
      "offlineReference": true,
      "glutenFreeByNature": true,
      "notes": "Plain cooked glutinous/sticky rice. This is NOT mango sticky rice; coconut milk and sugar are not included."
    }
  },
  {
    "id": "rice-white-long-grain-parboiled-enriched-cooked",
    "name": "Parboiled Rice",
    "displayName": "White Rice â Long-Grain, Parboiled, Enriched, Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "parboiled rice",
      "converted rice",
      "cooked parboiled rice",
      "parboiled white rice"
    ],
    "tags": [
      "grain",
      "rice",
      "parboiled",
      "white",
      "long-grain",
      "parboiled",
      "enriched",
      "cooked"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 123,
      "protein": 2.91,
      "carbs": 26.0,
      "fat": 0.37,
      "fiber": 0.9,
      "saturatedFat": 0.074
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "parboiled",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rice, white, long-grain, parboiled, enriched, cooked",
        "fdcId": 169708,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat"
      ],
      "offlineReference": true,
      "glutenFreeByNature": true,
      "notes": "Generic rice reference. Cooked rice nutrition per 100 g changes substantially with water absorption, so dry and cooked entries must never be interchanged. Added oil, butter, salt, broth, coconut milk, sauces, or seasonings are not included."
    }
  },
  {
    "id": "rice-wild-raw",
    "name": "Wild Rice",
    "displayName": "Wild Rice â Raw",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "wild rice",
      "dry wild rice",
      "uncooked wild rice"
    ],
    "tags": [
      "grain",
      "rice",
      "wild-rice",
      "wild-rice",
      "aquatic-grass-seed",
      "dry"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357,
      "protein": 14.7,
      "carbs": 74.9,
      "fat": 1.08,
      "fiber": 6.2,
      "sodium": 7,
      "potassium": 427,
      "saturatedFat": 0.16
    },
    "servings": [
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "1-oz-dry",
        "label": "1 oz dry",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "wild-rice",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Wild rice, raw",
        "fdcId": 169726,
        "ndbNumber": "20088",
        "release": "April 2018 (final)",
        "sourceNote": "USDA added a new Foundation 'Wild rice, dry, raw' record in April 2026. ARI retains the fully identified SR Legacy entry here until the new Foundation record is separately integrated with its exact analytical profile."
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
      "glutenFreeByNature": true,
      "notes": "Generic rice reference. Cooked rice nutrition per 100 g changes substantially with water absorption, so dry and cooked entries must never be interchanged. Added oil, butter, salt, broth, coconut milk, sauces, or seasonings are not included."
    }
  },
  {
    "id": "rice-wild-cooked",
    "name": "Wild Rice",
    "displayName": "Wild Rice â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "wild rice",
      "cooked wild rice",
      "plain wild rice"
    ],
    "tags": [
      "grain",
      "rice",
      "wild-rice",
      "wild-rice",
      "aquatic-grass-seed",
      "cooked"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 101,
      "protein": 3.99,
      "carbs": 21.34,
      "fat": 0.34,
      "fiber": 1.8,
      "sodium": 3,
      "potassium": 101,
      "saturatedFat": 0.05
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "wild-rice",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Wild rice, cooked",
        "fdcId": 168897,
        "ndbNumber": "20089",
        "release": "April 2018 (final)"
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
      "glutenFreeByNature": true,
      "notes": "Generic rice reference. Cooked rice nutrition per 100 g changes substantially with water absorption, so dry and cooked entries must never be interchanged. Added oil, butter, salt, broth, coconut milk, sauces, or seasonings are not included."
    }
  },
  {
    "id": "rice-black-unenriched-raw",
    "name": "Black Rice",
    "displayName": "Black Rice â Unenriched, Raw",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "black rice",
      "forbidden rice",
      "purple rice raw",
      "uncooked black rice"
    ],
    "tags": [
      "grain",
      "rice",
      "black-rice",
      "black-rice",
      "whole-grain",
      "unenriched",
      "foundation"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 361,
      "protein": 7.57,
      "carbs": 77.19,
      "fat": 3.44,
      "fiber": 4.18,
      "potassium": 255.6
    },
    "servings": [
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "1-oz-dry",
        "label": "1 oz dry",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "black-rice",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Rice, black, unenriched, raw",
        "release": "April 2026",
        "energyMethod": "Atwater specific/general reviewed",
        "sourceNote": "USDA added this Foundation food in April 2026. Exact FDC ID is intentionally omitted here until directly confirmed."
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
      "glutenFreeByNature": true,
      "notes": "Current USDA Foundation black-rice analytical profile. Because black rice cultivars vary, branded/package data should override this generic reference when available."
    }
  },
  {
    "id": "rice-red-unenriched-dry-raw",
    "name": "Red Rice",
    "displayName": "Red Rice â Unenriched, Dry, Raw",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red rice",
      "raw red rice",
      "dry red rice",
      "whole grain red rice"
    ],
    "tags": [
      "grain",
      "rice",
      "red-rice",
      "red-rice",
      "whole-grain",
      "unenriched",
      "foundation"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 360,
      "protein": 8.56,
      "carbs": 76.2,
      "fat": 3.44,
      "fiber": 4.2,
      "sodium": 0.438,
      "potassium": 245
    },
    "servings": [
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "1-oz-dry",
        "label": "1 oz dry",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodRice",
    "verified": true,
    "metadata": {
      "foodFamily": "rice",
      "riceType": "red-rice",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Rice, red, unenriched, dry, raw",
        "fdcId": 2710838,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 370
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
      "glutenFreeByNature": true,
      "notes": "USDA reports 370 kcal/100 g using general Atwater factors and 360 kcal/100 g using food-specific Atwater factors. ARI stores 360 kcal as the primary value and preserves 370 in provenance."
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
    console.error(
      `[ARI Nutrition] ${MODULE_NAME}: ${message}`
    );

    if (
      global.AriFoodGrains &&
      typeof global.AriFoodGrains.markModuleFailed === "function"
    ) {
      global.AriFoodGrains.markModuleFailed(
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

  const registry =
    global.AriFoodRegistry;

  if (
    !registry ||
    typeof registry.registerMany !== "function"
  ) {
    markFailed(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

  // Clear stale rice records on hot reload.
  if (
    typeof registry.getBySource === "function" &&
    typeof registry.remove === "function"
  ) {
    try {
      const existing =
        registry.getBySource(
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior module records.`,
        error
      );
    }
  }

  const registration =
    registry.registerMany(
      ARI_RICE_FOODS,
      {
        source: MODULE_NAME
      }
    );

  const moduleResult = {
    registered:
      registration.registered || 0,

    replaced:
      registration.replaced || 0,

    rejected:
      registration.rejected || 0,

    duplicates:
      registration.duplicates || 0,

    metadata: {
      version: VERSION,
      verifiedAt: VERIFIED_AT,
      foodCount: ARI_RICE_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "white-long-grain",
        "brown-long-grain",
        "white-medium-grain",
        "white-short-grain",
        "glutinous",
        "parboiled",
        "wild-rice",
        "black-rice",
        "red-rice"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} rice record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodGrains &&
    typeof global.AriFoodGrains.markModuleLoaded === "function"
  ) {
    global.AriFoodGrains.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodRice =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_RICE_FOODS.length;
      },

      getFoodIds() {
        return ARI_RICE_FOODS.map(
          food => food.id
        );
      },

      getRiceTypes() {
        return Array.from(
          new Set(
            ARI_RICE_FOODS.map(
              food => food.metadata.riceType
            )
          )
        );
      },

      getDryRecords() {
        return ARI_RICE_FOODS
          .filter(
            food =>
              food.state === "raw" ||
              food.state === "dry"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_RICE_FOODS
          .filter(
            food =>
              food.state === "cooked"
          )
          .map(clone);
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_RICE_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getRegistrationResult() {
        return clone(registration);
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-rice-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_RICE_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_RICE_FOODS.length} source-traceable rice reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
