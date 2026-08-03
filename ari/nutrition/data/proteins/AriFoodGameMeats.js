// =====================================================
// ARI REBIRTH
// File: AriFoodGameMeats.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline game-meat reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Deer / venison
//   - Elk
//   - Bison (lean + ground)
//   - Wild rabbit
//   - Wild boar
//   - Goat
//   - Antelope / pronghorn
//   - Pheasant
//
// Reliability:
//   - USDA FoodData Central SR Legacy generic references.
//   - Nutrition basis is 100 g edible portion.
//   - Raw and cooked records remain distinct.
//   - Ground and lean bison remain distinct.
//   - No fabricated backstrap/tenderloin/jerky/sausage
//     values from generic game-meat records.
//   - No runtime internet connection is required.
//   - Source provenance is embedded in every record.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+
// =====================================================

(function initializeAriFoodGameMeats(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodGameMeats";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact generic game-meat records",
    "USDA FoodData Central April 2026 documentation used to confirm SR Legacy remains the final historical reference dataset",
    "Independent USDA-derived database mirrors used only to cross-check values and identifiers during authoring"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked records separate.",
    "Keep lean bison and ground bison separate.",
    "Treat venison/deer, elk, antelope, rabbit, boar, goat, bison, and pheasant as distinct foods.",
    "Do not fabricate species-specific cuts such as backstrap or tenderloin when the authoritative generic dataset does not provide an exact matching composition record.",
    "Do not treat sausage, jerky, bacon, burger toppings, marinades, gravies, or sauces as part of the plain meat reference.",
    "Use weight-based servings by default because hunted-game portion and cut sizes vary substantially.",
    "Game-meat composition may vary more than standardized commercial meat because species, diet, season, age, sex, and trim can differ.",
    "Every record carries an auditable USDA description and an FDC/NDB identifier when confidently confirmed.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_GAME_MEAT_FOODS =
    [
  {
    "id": "game-deer-venison-raw",
    "name": "Venison",
    "displayName": "Venison / Deer â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "venison",
      "deer",
      "deer meat",
      "raw venison",
      "raw deer meat"
    ],
    "tags": [
      "game-meat",
      "deer",
      "venison",
      "deer",
      "lean"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 120,
      "protein": 22.96,
      "carbs": 0,
      "fat": 2.42,
      "sodium": 51,
      "potassium": 318,
      "saturatedFat": 0.95,
      "cholesterol": 85
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "deer",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, deer, raw",
        "release": "April 2018 (final)",
        "ndbNumber": "17164"
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
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-deer-venison-cooked-roasted",
    "name": "Venison",
    "displayName": "Venison / Deer â Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "venison",
      "cooked venison",
      "roasted venison",
      "deer steak",
      "cooked deer meat"
    ],
    "tags": [
      "game-meat",
      "deer",
      "venison",
      "deer",
      "roasted",
      "lean"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 158,
      "protein": 30.21,
      "carbs": 0,
      "fat": 3.19
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "deer",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, deer, cooked, roasted",
        "release": "April 2018 (final)",
        "ndbNumber": "17165"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "wildGameVariability": true,
      "notes": "Plain roasted deer/venison reference. Added oil, butter, bacon, marinade, gravy, or sausage ingredients are not included."
    }
  },
  {
    "id": "game-elk-raw",
    "name": "Elk",
    "displayName": "Elk â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "elk",
      "elk meat",
      "raw elk",
      "elk steak raw"
    ],
    "tags": [
      "game-meat",
      "elk",
      "elk",
      "lean"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 111,
      "protein": 23.0,
      "carbs": 0,
      "fat": 1.45,
      "sodium": 58,
      "potassium": 312,
      "saturatedFat": 0.53,
      "cholesterol": 55
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "elk",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, elk, raw",
        "release": "April 2018 (final)",
        "fdcId": 175301,
        "ndbNumber": "17166"
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
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-elk-cooked-roasted",
    "name": "Elk",
    "displayName": "Elk â Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "elk",
      "cooked elk",
      "roasted elk",
      "elk steak",
      "grilled elk"
    ],
    "tags": [
      "game-meat",
      "elk",
      "elk",
      "roasted",
      "lean"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 146,
      "protein": 30.19,
      "carbs": 0,
      "fat": 1.9,
      "sodium": 61,
      "potassium": 328,
      "saturatedFat": 0.7,
      "cholesterol": 73
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "elk",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, elk, cooked, roasted",
        "release": "April 2018 (final)",
        "fdcId": 175302,
        "ndbNumber": "17167"
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
      "wildGameVariability": true,
      "notes": "The grilled alias is for a plain high-heat elk preparation without meaningful added fat or sauce; USDA's exact reference is roasted."
    }
  },
  {
    "id": "game-bison-lean-raw",
    "name": "Bison",
    "displayName": "Bison â Lean Only, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "bison",
      "buffalo meat",
      "raw bison",
      "bison steak",
      "lean bison"
    ],
    "tags": [
      "game-meat",
      "bison",
      "bison",
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
      "calories": 109,
      "protein": 21.62,
      "carbs": 0,
      "fat": 1.84,
      "sodium": 54,
      "potassium": 343,
      "saturatedFat": 0.69,
      "cholesterol": 62
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "bison",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, bison, separable lean only, raw",
        "release": "April 2018 (final)",
        "ndbNumber": "17156"
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-bison-lean-cooked-roasted",
    "name": "Bison",
    "displayName": "Bison â Lean Only, Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "bison",
      "cooked bison",
      "roasted bison",
      "bison steak cooked",
      "buffalo steak"
    ],
    "tags": [
      "game-meat",
      "bison",
      "bison",
      "lean-only",
      "roasted"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 28.44,
      "carbs": 0,
      "fat": 2.42,
      "sodium": 57,
      "potassium": 361,
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "bison",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, bison, separable lean only, cooked, roasted",
        "release": "April 2018 (final)",
        "fdcId": 173852
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-bison-ground-raw",
    "name": "Ground Bison",
    "displayName": "Ground Bison â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground bison",
      "bison burger meat",
      "ground buffalo",
      "raw ground bison"
    ],
    "tags": [
      "game-meat",
      "bison",
      "bison",
      "ground"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 223,
      "protein": 18.67,
      "carbs": 0,
      "fat": 15.93,
      "sodium": 66,
      "potassium": 307,
      "saturatedFat": 6.802,
      "cholesterol": 70
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      },
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "bison",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, bison, ground, raw",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy generic ground-bison reference."
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-bison-ground-grass-fed-cooked",
    "name": "Ground Bison",
    "displayName": "Ground Bison â Grass-Fed, Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground bison cooked",
      "bison burger",
      "grass fed bison burger",
      "cooked ground buffalo"
    ],
    "tags": [
      "game-meat",
      "bison",
      "bison",
      "ground",
      "grass-fed"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 179,
      "protein": 25.45,
      "carbs": 0,
      "fat": 8.62,
      "sodium": 76,
      "potassium": 353
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      },
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "bison",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bison, ground, grass-fed, cooked",
        "release": "April 2018 (final)",
        "fdcId": 173847
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
      "wildGameVariability": false,
      "notes": "Grass-fed cooked ground-bison reference. Bun, cheese, sauce, and added cooking fat are not included."
    }
  },
  {
    "id": "game-rabbit-wild-raw",
    "name": "Wild Rabbit",
    "displayName": "Wild Rabbit â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "rabbit",
      "wild rabbit",
      "rabbit meat",
      "raw rabbit",
      "game rabbit"
    ],
    "tags": [
      "game-meat",
      "wild-rabbit",
      "rabbit",
      "wild",
      "lean"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 114,
      "protein": 21.8,
      "carbs": 0,
      "fat": 2.32,
      "sodium": 50,
      "potassium": 378,
      "saturatedFat": 0.69,
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "wild-rabbit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, rabbit, wild, raw",
        "release": "April 2018 (final)",
        "ndbNumber": "17180"
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
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-rabbit-wild-cooked-stewed",
    "name": "Wild Rabbit",
    "displayName": "Wild Rabbit â Cooked, Stewed",
    "category": "protein",
    "state": "cooked",
    "preparation": "stewed",
    "aliases": [
      "rabbit",
      "cooked rabbit",
      "stewed rabbit",
      "braised rabbit",
      "wild rabbit cooked"
    ],
    "tags": [
      "game-meat",
      "wild-rabbit",
      "rabbit",
      "wild",
      "stewed",
      "lean"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 173,
      "protein": 33.02,
      "carbs": 0,
      "fat": 3.51,
      "sodium": 45,
      "potassium": 343,
      "saturatedFat": 1.05,
      "cholesterol": 123
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "wild-rabbit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, rabbit, wild, cooked, stewed",
        "release": "April 2018 (final)",
        "fdcId": 174348,
        "ndbNumber": "17181"
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
      "wildGameVariability": true,
      "notes": "Plain stewed rabbit meat. Braising liquid, wine, flour, butter, vegetables, or sauce are not included as separate recipe ingredients."
    }
  },
  {
    "id": "game-boar-wild-raw",
    "name": "Wild Boar",
    "displayName": "Wild Boar â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "wild boar",
      "boar",
      "wild hog",
      "feral hog meat",
      "raw wild boar"
    ],
    "tags": [
      "game-meat",
      "wild-boar",
      "boar",
      "wild-hog"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 122,
      "protein": 21.51,
      "carbs": 0,
      "fat": 3.33
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "wild-boar",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, boar, wild, raw",
        "release": "April 2018 (final)",
        "ndbNumber": "17158"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-boar-wild-cooked-roasted",
    "name": "Wild Boar",
    "displayName": "Wild Boar â Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "wild boar",
      "cooked wild boar",
      "roasted boar",
      "wild hog cooked",
      "boar roast"
    ],
    "tags": [
      "game-meat",
      "wild-boar",
      "boar",
      "wild-hog",
      "roasted"
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
      "protein": 28.3,
      "carbs": 0,
      "fat": 4.38,
      "saturatedFat": 1.3,
      "cholesterol": 77
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "wild-boar",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, boar, wild, cooked, roasted",
        "release": "April 2018 (final)",
        "fdcId": 175298,
        "ndbNumber": "17159"
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
      "wildGameVariability": true,
      "notes": "Plain roasted wild-boar reference. Sausage, cured boar, bacon, sauces, and added fat are separate foods."
    }
  },
  {
    "id": "game-goat-raw",
    "name": "Goat",
    "displayName": "Goat Meat â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "goat",
      "goat meat",
      "raw goat",
      "chevon",
      "cabrito meat"
    ],
    "tags": [
      "game-meat",
      "goat",
      "goat",
      "chevon",
      "lean"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 109,
      "protein": 20.6,
      "carbs": 0,
      "fat": 2.31,
      "sodium": 82,
      "potassium": 385,
      "saturatedFat": 0.71,
      "cholesterol": 57
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "goat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, goat, raw",
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-goat-cooked-roasted",
    "name": "Goat",
    "displayName": "Goat Meat â Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "goat",
      "cooked goat",
      "roasted goat",
      "goat meat cooked",
      "chevon cooked"
    ],
    "tags": [
      "game-meat",
      "goat",
      "goat",
      "chevon",
      "roasted",
      "lean"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 27.1,
      "carbs": 0,
      "fat": 3.03,
      "saturatedFat": 0.93,
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "goat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, goat, cooked, roasted",
        "release": "April 2018 (final)",
        "fdcId": 175304
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-antelope-raw",
    "name": "Antelope",
    "displayName": "Antelope â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "antelope",
      "antelope meat",
      "pronghorn",
      "raw antelope",
      "pronghorn meat"
    ],
    "tags": [
      "game-meat",
      "antelope",
      "antelope",
      "pronghorn",
      "lean"
    ],
    "popularity": 78,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 114,
      "protein": 22.38,
      "carbs": 0,
      "fat": 2.03,
      "sodium": 51,
      "potassium": 353,
      "saturatedFat": 0.74,
      "cholesterol": 95
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "antelope",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, antelope, raw",
        "release": "April 2018 (final)",
        "fdcId": 175292,
        "ndbNumber": "17144"
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
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-antelope-cooked-roasted",
    "name": "Antelope",
    "displayName": "Antelope â Cooked, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "antelope",
      "cooked antelope",
      "roasted antelope",
      "pronghorn cooked",
      "antelope steak"
    ],
    "tags": [
      "game-meat",
      "antelope",
      "antelope",
      "pronghorn",
      "roasted",
      "lean"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 150,
      "protein": 29.45,
      "carbs": 0,
      "fat": 2.67,
      "sodium": 54,
      "saturatedFat": 0.97
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "antelope",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Game meat, antelope, cooked, roasted",
        "release": "April 2018 (final)",
        "fdcId": 173844,
        "ndbNumber": "17145"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "wildGameVariability": true,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-pheasant-raw-meat-only",
    "name": "Pheasant",
    "displayName": "Pheasant â Raw, Meat Only",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pheasant",
      "pheasant meat",
      "raw pheasant",
      "pheasant breast",
      "game bird pheasant"
    ],
    "tags": [
      "game-meat",
      "pheasant",
      "pheasant",
      "game-bird",
      "meat-only"
    ],
    "popularity": 79,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 133,
      "protein": 23.57,
      "carbs": 0,
      "fat": 3.64,
      "sodium": 37,
      "potassium": 262,
      "saturatedFat": 1.24,
      "cholesterol": 66
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "pheasant",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pheasant, raw, meat only",
        "release": "April 2018 (final)",
        "fdcId": 174473,
        "ndbNumber": "05154"
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
      "wildGameVariability": false,
      "notes": "Generic USDA reference value. Wild/game meat can vary substantially with species, age, sex, season, diet, trim, harvest conditions, processing, and cooking loss."
    }
  },
  {
    "id": "game-pheasant-cooked-total-edible",
    "name": "Pheasant",
    "displayName": "Pheasant â Cooked, Total Edible",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "pheasant",
      "cooked pheasant",
      "roasted pheasant",
      "game bird cooked"
    ],
    "tags": [
      "game-meat",
      "pheasant",
      "pheasant",
      "game-bird",
      "total-edible"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 239,
      "protein": 32.4,
      "carbs": 0,
      "fat": 12.1
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
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": false
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
    "source": "AriFoodGameMeats",
    "verified": true,
    "metadata": {
      "foodFamily": "pheasant",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pheasant, cooked, total edible",
        "release": "April 2018 (final)",
        "fdcId": 169903,
        "ndbNumber": "43283"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "wildGameVariability": false,
      "notes": "USDA 'total edible' cooked pheasant reference. This is not interchangeable with a skinless breast-only pheasant serving; edible skin/fat changes the nutrition profile."
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

  // Clear stale module records on hot reload.
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
      ARI_GAME_MEAT_FOODS,
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
      foodCount: ARI_GAME_MEAT_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "venison",
        "elk",
        "bison",
        "rabbit",
        "wild-boar",
        "goat",
        "antelope",
        "pheasant"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} game-meat record(s).`,
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

  global.AriFoodGameMeats =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_GAME_MEAT_FOODS.length;
      },

      getFoodIds() {
        return ARI_GAME_MEAT_FOODS.map(
          food => food.id
        );
      },

      getFamilies() {
        return Array.from(
          new Set(
            ARI_GAME_MEAT_FOODS.map(
              food => food.metadata.foodFamily
            )
          )
        );
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_GAME_MEAT_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getWildGameRecords() {
        return ARI_GAME_MEAT_FOODS
          .filter(
            food =>
              food.metadata?.wildGameVariability === true
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
        "ari:food-game-meats-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_GAME_MEAT_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_GAME_MEAT_FOODS.length} source-traceable game-meat reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
