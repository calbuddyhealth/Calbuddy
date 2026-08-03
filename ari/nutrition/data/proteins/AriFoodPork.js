// =====================================================
// ARI REBIRTH
// File: AriFoodPork.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline pork reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Ground pork
//   - Pork loin
//   - Pork tenderloin
//   - Center-cut / center-loin pork chops
//   - Pork shoulder / Boston butt
//   - Pork spareribs
//   - Pork belly
//   - Bacon
//   - Ham
//   - Fresh pork sausage
//
// Reliability policy:
//   - Current USDA Foundation Foods first for supported
//     analytically sampled raw pork references.
//   - USDA SR Legacy for exact cooked preparations and
//     established processed-pork references.
//   - Nutrition basis is 100 g edible portion.
//   - Raw and cooked records remain distinct.
//   - Lean-only and lean-and-fat records remain distinct.
//   - No fabricated air-fried, BBQ, glazed, breaded,
//     sauced, or brand-specific values.
//   - Processed/cured meats are explicitly tagged.
//   - No runtime internet connection is required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+ (recommended for tracking)
// =====================================================

(function initializeAriFoodPork(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPork";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytically sampled generic raw pork when available",
    "USDA FoodData Central SR Legacy for exact cooked preparations and established processed-pork reference foods"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked foods separate.",
    "Keep visible-fat-eaten and lean-only cooked references separate when the source distinguishes them.",
    "Use food-specific Atwater energy for current Foundation records when both general and specific values are published; preserve the alternate value in provenance.",
    "Do not fabricate air-fried, glazed, BBQ, breaded, sauced, or restaurant-style values from plain pork records.",
    "Tag bacon, ham, and sausage as processed/cured foods instead of treating them as plain fresh pork.",
    "Weight is preferred over piece count for variable foods such as bacon, chops, ribs, and sausage.",
    "Every record carries an auditable USDA dataset description plus an FDC or NDB identifier when confidently resolved."
  ]
}
  );

  const ARI_PORK_FOODS =
    [
  {
    "id": "pork-ground-raw",
    "name": "Ground Pork",
    "displayName": "Ground Pork â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground pork",
      "minced pork",
      "pork mince",
      "raw ground pork"
    ],
    "tags": [
      "pork",
      "ground"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 233,
      "protein": 17.8,
      "carbs": 0,
      "fat": 17.5,
      "sodium": 53.6,
      "potassium": 317.7,
      "saturatedFat": 6.3,
      "cholesterol": 71.2,
      "transFat": 0.1
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, ground, raw",
        "fdcId": 2514745,
        "release": "April 2026 current Foundation download",
        "published": "2023-04-20"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol",
        "transFat"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-loin-boneless-raw",
    "name": "Pork Loin",
    "displayName": "Pork Loin â Boneless, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pork loin",
      "boneless pork loin",
      "raw pork loin",
      "pork loin roast raw"
    ],
    "tags": [
      "pork",
      "loin",
      "boneless"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 174,
      "protein": 21.1,
      "carbs": 0,
      "fat": 9.47,
      "sodium": 40.2,
      "potassium": 361.2,
      "saturatedFat": 3.3,
      "cholesterol": 55.9
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, loin, boneless, raw",
        "fdcId": 2646168,
        "release": "April 2026 current Foundation download"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-tenderloin-boneless-raw",
    "name": "Pork Tenderloin",
    "displayName": "Pork Tenderloin â Boneless, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pork tenderloin",
      "raw pork tenderloin",
      "pork filet",
      "pork fillet"
    ],
    "tags": [
      "pork",
      "loin",
      "tenderloin",
      "boneless",
      "lean"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 125,
      "protein": 21.6,
      "carbs": 0,
      "fat": 3.9,
      "sodium": 41.4,
      "potassium": 397.4,
      "saturatedFat": 0.9,
      "cholesterol": 59.6
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, loin, tenderloin, boneless, raw",
        "fdcId": 2646169,
        "release": "April 2026 current Foundation download"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-chop-center-cut-raw",
    "name": "Pork Chop",
    "displayName": "Pork Chop â Center Cut, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pork chop",
      "center cut pork chop",
      "center-cut pork chop",
      "raw pork chop"
    ],
    "tags": [
      "pork",
      "chop",
      "center-cut"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 145,
      "protein": 22.8,
      "carbs": 0,
      "fat": 5.48,
      "sodium": 39.3,
      "potassium": 366,
      "cholesterol": 57.3
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, chop, center cut, raw",
        "fdcId": 2727575,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 138
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "USDA analytical carbohydrate-by-difference is slightly negative from analytical variation; ARI normalizes digestible carbohydrate to 0 g. The source reports 138 kcal by general Atwater factors and 145 kcal by food-specific Atwater factors; ARI uses the specific-factor value."
    }
  },
  {
    "id": "pork-belly-with-skin-raw",
    "name": "Pork Belly",
    "displayName": "Pork Belly â With Skin, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pork belly",
      "raw pork belly",
      "pork belly with skin"
    ],
    "tags": [
      "pork",
      "belly",
      "skin-on"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 385,
      "protein": 15.2,
      "carbs": 0,
      "fat": 35.8,
      "sodium": 49.7,
      "potassium": 208,
      "cholesterol": 66.6
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, belly, with skin, raw",
        "fdcId": 2727576,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 380
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "USDA analytical carbohydrate-by-difference is slightly negative from analytical variation; ARI normalizes digestible carbohydrate to 0 g. Pork belly varies substantially in lean-to-fat ratio."
    }
  },
  {
    "id": "pork-ground-cooked",
    "name": "Ground Pork",
    "displayName": "Ground Pork â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground pork cooked",
      "cooked ground pork",
      "cooked pork mince"
    ],
    "tags": [
      "pork",
      "ground"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 297,
      "protein": 25.7,
      "carbs": 0,
      "fat": 20.8,
      "sodium": 73,
      "potassium": 362,
      "saturatedFat": 7.72,
      "cholesterol": 94
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, ground, cooked",
        "fdcId": 167903,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-loin-roasted-lean-only",
    "name": "Pork Loin",
    "displayName": "Pork Loin â Roasted, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roast pork loin",
      "roasted pork loin",
      "baked pork loin",
      "pork loin cooked lean"
    ],
    "tags": [
      "pork",
      "loin",
      "roasted",
      "lean-only"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 209,
      "protein": 28.6,
      "carbs": 0,
      "fat": 9.63,
      "saturatedFat": 3.51,
      "cholesterol": 81
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, loin, whole, separable lean only, cooked, roasted",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "The 'baked pork loin' alias maps to this plain dry-heat reference only when meaningful added oil, glaze, or sauce is absent."
    }
  },
  {
    "id": "pork-loin-roasted-lean-fat",
    "name": "Pork Loin",
    "displayName": "Pork Loin â Roasted, Lean & Fat",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roast pork loin with fat",
      "roasted pork loin fat eaten",
      "baked pork loin with fat"
    ],
    "tags": [
      "pork",
      "loin",
      "roasted",
      "lean-and-fat"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 248,
      "protein": 27.1,
      "carbs": 0,
      "fat": 14.6,
      "saturatedFat": 5.37,
      "cholesterol": 82
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, loin, whole, separable lean and fat, cooked, roasted",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-tenderloin-roasted-lean",
    "name": "Pork Tenderloin",
    "displayName": "Pork Tenderloin â Roasted, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roasted pork tenderloin",
      "baked pork tenderloin",
      "cooked pork tenderloin",
      "pork tenderloin cooked"
    ],
    "tags": [
      "pork",
      "loin",
      "tenderloin",
      "roasted",
      "lean-only"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 26.17,
      "carbs": 0,
      "fat": 3.51,
      "sodium": 57,
      "potassium": 421
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted",
        "fdcId": 168250,
        "release": "April 2018 (final)"
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
      "processedMeat": false,
      "notes": "The 'baked pork tenderloin' alias maps to this plain dry-heat reference only when meaningful added oil, glaze, or sauce is absent."
    }
  },
  {
    "id": "pork-chop-center-loin-pan-broiled-lean-only",
    "name": "Pork Chop",
    "displayName": "Pork Chop â Center Loin, Pan-Broiled, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "pan broiled",
    "aliases": [
      "pork chop cooked",
      "lean pork chop",
      "pan broiled pork chop",
      "grilled pork chop lean"
    ],
    "tags": [
      "pork",
      "chop",
      "center-loin",
      "lean-only"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 162,
      "protein": 30.02,
      "carbs": 0,
      "fat": 4.65,
      "sodium": 91,
      "potassium": 407
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, loin, center loin (chops), boneless, separable lean only, cooked, pan-broiled",
        "fdcId": 168285,
        "ndbNumber": "10163",
        "release": "April 2018 (final)"
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
      "processedMeat": false,
      "notes": "Use when visible external fat is not eaten. 'Grilled pork chop lean' is a search alias for a similar plain dry-heat result, not a claim that grilling and pan-broiling are nutritionally identical."
    }
  },
  {
    "id": "pork-chop-center-loin-pan-broiled-lean-fat",
    "name": "Pork Chop",
    "displayName": "Pork Chop â Center Loin, Pan-Broiled, Lean & Fat",
    "category": "protein",
    "state": "cooked",
    "preparation": "pan broiled",
    "aliases": [
      "pork chop cooked",
      "pork chop fat eaten",
      "pan broiled pork chop",
      "grilled pork chop with fat"
    ],
    "tags": [
      "pork",
      "chop",
      "center-loin",
      "lean-and-fat"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 229,
      "protein": 26.68,
      "carbs": 0,
      "fat": 13.6,
      "sodium": 86,
      "potassium": 366,
      "saturatedFat": 4.89,
      "cholesterol": 75
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, loin, center loin (chops), boneless, separable lean and fat, cooked, pan-broiled",
        "ndbNumber": "10189",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-shoulder-boston-roast-lean-only",
    "name": "Pork Shoulder",
    "displayName": "Pork Shoulder / Boston Butt â Roasted, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "pork shoulder",
      "boston butt",
      "pork butt",
      "roasted pork shoulder lean",
      "pulled pork plain lean"
    ],
    "tags": [
      "pork",
      "shoulder",
      "boston-butt",
      "lean-only"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 232,
      "protein": 24.2,
      "carbs": 0,
      "fat": 14.4,
      "sodium": 88,
      "potassium": 427,
      "saturatedFat": 5.18,
      "cholesterol": 85.1
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, shoulder, blade, boston (roasts), separable lean only, cooked, roasted",
        "fdcId": 167852,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Use only for plain cooked shoulder meat. BBQ sauce, sugar rubs, and added cooking fat must be logged separately."
    }
  },
  {
    "id": "pork-shoulder-boston-roast-lean-fat",
    "name": "Pork Shoulder",
    "displayName": "Pork Shoulder / Boston Butt â Roasted, Lean & Fat",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "pork shoulder",
      "boston butt",
      "pork butt",
      "roasted pork shoulder",
      "plain pulled pork"
    ],
    "tags": [
      "pork",
      "shoulder",
      "boston-butt",
      "lean-and-fat"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 269,
      "protein": 23.1,
      "carbs": 0,
      "fat": 18.8,
      "sodium": 67,
      "potassium": 332,
      "saturatedFat": 6.94,
      "cholesterol": 86
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, shoulder, blade, boston (roasts), separable lean and fat, cooked, roasted",
        "fdcId": 168259,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "Use only for plain cooked shoulder with edible fat retained. BBQ sauce, sugar rubs, and added cooking fat must be logged separately."
    }
  },
  {
    "id": "pork-spareribs-braised-lean-fat",
    "name": "Pork Spareribs",
    "displayName": "Pork Spareribs â Braised, Lean & Fat",
    "category": "protein",
    "state": "cooked",
    "preparation": "braised",
    "aliases": [
      "pork ribs",
      "spareribs",
      "spare ribs",
      "braised pork ribs",
      "cooked pork ribs"
    ],
    "tags": [
      "pork",
      "ribs",
      "spareribs",
      "lean-and-fat"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 397,
      "protein": 29.06,
      "carbs": 0,
      "fat": 30.3
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, fresh, spareribs, separable lean and fat, cooked, braised",
        "fdcId": 167854,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "processedMeat": false,
      "notes": "This is plain pork rib meat and edible fat. Sweet BBQ sauce, glaze, or breading is not included."
    }
  },
  {
    "id": "pork-bacon-cooked-baked",
    "name": "Pork Bacon",
    "displayName": "Pork Bacon â Cooked, Baked",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "bacon",
      "pork bacon",
      "cooked bacon",
      "baked bacon",
      "crispy bacon"
    ],
    "tags": [
      "pork",
      "processed",
      "cured",
      "bacon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 548,
      "protein": 35.73,
      "carbs": 1.35,
      "fat": 43.27,
      "sodium": 2193,
      "potassium": 539
    },
    "servings": [
      {
        "id": "slice-approx",
        "label": "1 cooked slice (~8 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 8,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, cured, bacon, cooked, baked",
        "fdcId": 167914,
        "release": "April 2018 (final)"
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
      "processedMeat": true,
      "notes": "Bacon varies dramatically by slice thickness and doneness. Weight is more reliable than slice count; the 8 g slice is only a convenience approximation."
    }
  },
  {
    "id": "pork-bacon-cooked-restaurant",
    "name": "Pork Bacon",
    "displayName": "Pork Bacon â Cooked, Restaurant Composite",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "restaurant bacon",
      "breakfast bacon",
      "cooked restaurant bacon",
      "bacon"
    ],
    "tags": [
      "pork",
      "processed",
      "cured",
      "bacon",
      "restaurant-composite"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500,
      "protein": 40.9,
      "carbs": 2.1,
      "fat": 36.5,
      "sodium": 1830,
      "potassium": 557,
      "saturatedFat": 13
    },
    "servings": [
      {
        "id": "slice-approx",
        "label": "1 cooked slice (~8 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 8,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pork, cured, bacon, cooked, restaurant",
        "fdcId": 749420,
        "release": "April 2026 current Foundation download",
        "published": "2019-12-16"
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
      "processedMeat": true,
      "notes": "USDA Foundation restaurant composite based on multiple restaurant bacon samples. Use weight when possible."
    }
  },
  {
    "id": "pork-ham-boneless-regular-roasted",
    "name": "Ham",
    "displayName": "Ham â Boneless, Regular, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "ham",
      "roasted ham",
      "boneless ham",
      "cooked ham"
    ],
    "tags": [
      "pork",
      "processed",
      "cured",
      "ham"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 178,
      "protein": 22,
      "carbs": 0,
      "fat": 9,
      "sodium": 1500,
      "potassium": 409,
      "saturatedFat": 3,
      "cholesterol": 59
    },
    "servings": [
      {
        "id": "2-oz",
        "label": "2 oz",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, cured, ham, boneless, regular (approximately 11% fat), roasted",
        "ndbNumber": "10136",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": true,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-ham-boneless-low-sodium-roasted",
    "name": "Ham",
    "displayName": "Ham â Boneless, Low Sodium, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "low sodium ham",
      "reduced sodium ham",
      "boneless low sodium ham",
      "ham"
    ],
    "tags": [
      "pork",
      "processed",
      "cured",
      "ham",
      "low-sodium"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 165,
      "protein": 22,
      "carbs": 0.5,
      "fat": 7.7,
      "saturatedFat": 2.62,
      "cholesterol": 57
    },
    "servings": [
      {
        "id": "2-oz",
        "label": "2 oz",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork, cured, ham, boneless, low sodium, extra lean and regular, roasted",
        "fdcId": 169906,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "processedMeat": true,
      "notes": "Generic reference value. Actual nutrition can vary with trim, retained fat, moisture loss, curing, brand formulation, added oil, breading, seasoning, glaze, or sauce."
    }
  },
  {
    "id": "pork-sausage-fresh-raw",
    "name": "Pork Sausage",
    "displayName": "Pork Sausage â Fresh, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pork sausage",
      "breakfast sausage raw",
      "fresh pork sausage",
      "sausage"
    ],
    "tags": [
      "pork",
      "processed",
      "sausage",
      "fresh-sausage"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 304,
      "protein": 15,
      "carbs": 0,
      "fat": 26,
      "sodium": 636,
      "potassium": 248
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork sausage, fresh, raw",
        "ndbNumber": "07063",
        "release": "April 2018 (final)"
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
      "processedMeat": true,
      "notes": "Generic fresh pork sausage; commercial formulations can vary substantially in fat, sodium, sugar, and seasoning."
    }
  },
  {
    "id": "pork-sausage-fresh-cooked",
    "name": "Pork Sausage",
    "displayName": "Pork Sausage â Fresh, Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "pork sausage",
      "breakfast sausage",
      "cooked pork sausage",
      "sausage link"
    ],
    "tags": [
      "pork",
      "processed",
      "sausage",
      "fresh-sausage"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 339,
      "protein": 19,
      "carbs": 0,
      "fat": 28,
      "sodium": 749,
      "potassium": 294
    },
    "servings": [
      {
        "id": "link",
        "label": "1 cooked link (~24 g)",
        "amount": 1,
        "unit": "link",
        "grams": 24,
        "isDefault": true
      },
      {
        "id": "2-links",
        "label": "2 cooked links (~48 g)",
        "amount": 2,
        "unit": "link",
        "grams": 48,
        "isDefault": false
      }
    ],
    "source": "AriFoodPork",
    "verified": true,
    "metadata": {
      "foodFamily": "pork",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pork sausage, fresh, cooked",
        "ndbNumber": "07064",
        "release": "April 2018 (final)"
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
      "processedMeat": true,
      "notes": "Generic fresh cooked pork sausage. The ~24 g link is a convenience serving based on the USDA-linked serving reference; branded links vary."
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
      global.AriFoodProteins &&
      typeof global.AriFoodProteins.markModuleFailed === "function"
    ) {
      global.AriFoodProteins.markModuleFailed(
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

  // Clear prior AriFoodPork records on hot reload so stale
  // earlier versions cannot coexist with this dataset.
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
      ARI_PORK_FOODS,
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
      foodCount: ARI_PORK_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "ground-pork",
        "loin",
        "tenderloin",
        "pork-chops",
        "shoulder",
        "ribs",
        "belly",
        "bacon",
        "ham",
        "sausage"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} pork record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodProteins &&
    typeof global.AriFoodProteins.markModuleLoaded === "function"
  ) {
    global.AriFoodProteins.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodPork =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_PORK_FOODS.length;
      },

      getFoodIds() {
        return ARI_PORK_FOODS.map(
          food => food.id
        );
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_PORK_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getProcessedRecords() {
        return ARI_PORK_FOODS
          .filter(
            food =>
              food.metadata &&
              food.metadata.processedMeat === true
          )
          .map(clone);
      },

      getRegistrationResult() {
        return clone(registration);
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-pork-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_PORK_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_PORK_FOODS.length} source-traceable pork reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
