// =====================================================
// ARI REBIRTH
// File: AriFoodEggs.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline egg reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Chicken whole egg, raw
//   - Hard-boiled egg
//   - Poached egg
//   - Fried egg
//   - Scrambled egg
//   - Plain omelet
//   - Egg white
//   - Egg yolk
//   - Duck egg
//   - Goose egg
//   - Quail egg
//   - Turkey egg
//
// Reliability:
//   - Uses exact USDA FoodData Central SR Legacy
//     generic egg records.
//   - Nutrition basis is 100 g edible portion.
//   - Piece-count serving weights are embedded.
//   - Cooking/preparation records remain distinct.
//   - No live internet is required at runtime.
//   - Source provenance is embedded in every record.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+ (recommended for tracking)
// =====================================================

(function initializeAriFoodEggs(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodEggs";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact generic egg records",
    "USDA FoodData Central documentation for dataset provenance and serving-weight conventions"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Provide piece-based gram equivalents because eggs are commonly logged by count.",
    "Keep raw, hard-boiled, poached, fried, scrambled, and omelet records separate.",
    "Do not assume added butter, oil, milk, cream, cheese, meat, or vegetables are included unless the source preparation implies them.",
    "For fried and scrambled eggs, recipe-level added fats or dairy should be logged separately when known.",
    "Keep whole egg, egg white, and egg yolk records separate.",
    "Support duck, goose, quail, and turkey eggs as distinct species-specific records.",
    "Every record carries a USDA FoodData Central FDC ID and SR Legacy description for offline auditing."
  ]
}
  );

  const ARI_EGG_FOODS =
    [
  {
    "id": "chicken-egg-whole-raw",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "egg",
      "eggs",
      "whole egg",
      "raw egg",
      "chicken egg",
      "large egg"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
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
      "calories": 143,
      "protein": 12.56,
      "carbs": 0.72,
      "fat": 9.51,
      "sodium": 142,
      "potassium": 138,
      "saturatedFat": 3.126,
      "cholesterol": 372
    },
    "servings": [
      {
        "id": "large-egg",
        "label": "1 large egg",
        "amount": 1,
        "unit": "egg",
        "grams": 50,
        "isDefault": true
      },
      {
        "id": "small-egg",
        "label": "1 small egg",
        "amount": 1,
        "unit": "small egg",
        "grams": 38,
        "isDefault": false
      },
      {
        "id": "medium-egg",
        "label": "1 medium egg",
        "amount": 1,
        "unit": "medium egg",
        "grams": 44,
        "isDefault": false
      },
      {
        "id": "extra-large-egg",
        "label": "1 extra-large egg",
        "amount": 1,
        "unit": "extra large egg",
        "grams": 56,
        "isDefault": false
      },
      {
        "id": "jumbo-egg",
        "label": "1 jumbo egg",
        "amount": 1,
        "unit": "jumbo egg",
        "grams": 63,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, raw, fresh",
        "fdcId": 171287,
        "release": "April 2018 (final)",
        "ndbNumber": "01123"
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
      "allergens": [
        "egg"
      ],
      "notes": "Raw whole chicken egg. USDA standard edible weights are used for common shell-egg sizes: small 38 g, medium 44 g, large 50 g, extra-large 56 g, jumbo 63 g."
    }
  },
  {
    "id": "chicken-egg-whole-hard-boiled",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Hard-Boiled",
    "category": "protein",
    "state": "cooked",
    "preparation": "hard boiled",
    "aliases": [
      "egg",
      "boiled egg",
      "hard boiled egg",
      "hard-boiled egg",
      "cooked egg"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
      "hard-boiled"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 155,
      "protein": 12.58,
      "carbs": 1.12,
      "fat": 10.61,
      "sodium": 124,
      "potassium": 126,
      "saturatedFat": 3.267,
      "cholesterol": 373
    },
    "servings": [
      {
        "id": "large-egg",
        "label": "1 large egg",
        "amount": 1,
        "unit": "egg",
        "grams": 50,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, cooked, hard-boiled",
        "fdcId": 173424,
        "release": "April 2018 (final)",
        "ndbNumber": "01129"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA portion reference: 1 large hard-boiled egg = 50 g edible portion."
    }
  },
  {
    "id": "chicken-egg-whole-poached",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Poached",
    "category": "protein",
    "state": "cooked",
    "preparation": "poached",
    "aliases": [
      "egg",
      "poached egg",
      "poached eggs",
      "cooked poached egg"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
      "poached"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 12.51,
      "carbs": 0.71,
      "fat": 9.47,
      "sodium": 297,
      "potassium": 138,
      "saturatedFat": 3.121,
      "cholesterol": 370
    },
    "servings": [
      {
        "id": "large-egg",
        "label": "1 large egg",
        "amount": 1,
        "unit": "egg",
        "grams": 50,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, cooked, poached",
        "fdcId": 172186,
        "release": "April 2018 (final)",
        "ndbNumber": "01131"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA portion reference: 1 large poached egg = 50 g. The USDA reference has higher sodium than raw egg; use a recipe-specific entry if salt or other ingredients are measured separately."
    }
  },
  {
    "id": "chicken-egg-whole-fried",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Fried",
    "category": "protein",
    "state": "cooked",
    "preparation": "fried",
    "aliases": [
      "egg",
      "fried egg",
      "fried eggs",
      "sunny side egg",
      "over easy egg"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
      "fried"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 196,
      "protein": 13.61,
      "carbs": 0.83,
      "fat": 14.84,
      "sodium": 207,
      "potassium": 152,
      "saturatedFat": 4.323,
      "cholesterol": 401
    },
    "servings": [
      {
        "id": "large-fried-egg",
        "label": "1 large fried egg",
        "amount": 1,
        "unit": "egg",
        "grams": 46,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, cooked, fried",
        "fdcId": 173423,
        "release": "April 2018 (final)",
        "ndbNumber": "01128"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA portion reference: 1 large fried egg = 46 g, approximately 90 calories. Actual frying fat can change calories substantially; use recipe-level added oil/butter when known."
    }
  },
  {
    "id": "chicken-egg-whole-scrambled",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Scrambled",
    "category": "protein",
    "state": "cooked",
    "preparation": "scrambled",
    "aliases": [
      "egg",
      "scrambled egg",
      "scrambled eggs",
      "plain scrambled eggs"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
      "scrambled"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 149,
      "protein": 9.99,
      "carbs": 1.61,
      "fat": 10.98,
      "sodium": 145,
      "potassium": 132,
      "saturatedFat": 3.33,
      "cholesterol": 277
    },
    "servings": [
      {
        "id": "large-scrambled-egg",
        "label": "1 large scrambled egg equivalent",
        "amount": 1,
        "unit": "egg",
        "grams": 61,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, cooked, scrambled",
        "fdcId": 172187,
        "release": "April 2018 (final)",
        "ndbNumber": "01132"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA cooked scrambled reference. A large serving equivalent is approximately 61 g and about 91 calories. Milk, cream, cheese, butter, or extra oil should be logged separately when known."
    }
  },
  {
    "id": "chicken-egg-whole-omelet",
    "name": "Chicken Egg",
    "displayName": "Chicken Egg â Plain Omelet",
    "category": "protein",
    "state": "cooked",
    "preparation": "omelet",
    "aliases": [
      "egg",
      "omelet",
      "omelette",
      "plain omelet",
      "plain omelette"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "whole",
      "omelet"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 154,
      "protein": 10.57,
      "carbs": 0.64,
      "fat": 11.66,
      "sodium": 155,
      "potassium": 117,
      "saturatedFat": 3.33,
      "cholesterol": 313
    },
    "servings": [
      {
        "id": "large-omelet-egg-equivalent",
        "label": "1 large omelet egg equivalent",
        "amount": 1,
        "unit": "egg",
        "grams": 61,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, whole, cooked, omelet",
        "fdcId": 172185,
        "release": "April 2018 (final)",
        "ndbNumber": "01130"
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
      "allergens": [
        "egg"
      ],
      "notes": "Plain USDA omelet reference. Cheese, meat, vegetables, milk, cream, butter, and added oil are not represented as separate user-entered recipe ingredients in this generic record."
    }
  },
  {
    "id": "chicken-egg-white-raw",
    "name": "Egg White",
    "displayName": "Chicken Egg White â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "egg white",
      "egg whites",
      "white of egg",
      "liquid egg white",
      "raw egg white"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "white",
      "egg-white",
      "low-fat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 52,
      "protein": 10.9,
      "carbs": 0.73,
      "fat": 0.17,
      "sodium": 166,
      "potassium": 163,
      "saturatedFat": 0,
      "cholesterol": 0
    },
    "servings": [
      {
        "id": "large-egg-white",
        "label": "1 large egg white",
        "amount": 1,
        "unit": "egg white",
        "grams": 33,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, white, raw, fresh",
        "fdcId": 172183,
        "release": "April 2018 (final)",
        "ndbNumber": "01124"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA reference for raw fresh egg white. One large chicken egg white is approximately 33 g. Carton egg-white products may contain additives and should use the product label when available."
    }
  },
  {
    "id": "chicken-egg-yolk-raw",
    "name": "Egg Yolk",
    "displayName": "Chicken Egg Yolk â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "egg yolk",
      "egg yolks",
      "yolk",
      "raw egg yolk"
    ],
    "tags": [
      "eggs",
      "chicken-egg",
      "yolk",
      "egg-yolk"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 322,
      "protein": 15.86,
      "carbs": 3.59,
      "fat": 26.54,
      "sodium": 48,
      "potassium": 109,
      "saturatedFat": 9.551,
      "cholesterol": 1085
    },
    "servings": [
      {
        "id": "large-egg-yolk",
        "label": "1 large egg yolk",
        "amount": 1,
        "unit": "egg yolk",
        "grams": 17,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "chicken-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, yolk, raw, fresh",
        "fdcId": 172184,
        "release": "April 2018 (final)",
        "ndbNumber": "01125"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA reference for raw fresh yolk. One large chicken egg yolk is approximately 17 g."
    }
  },
  {
    "id": "duck-egg-whole-raw",
    "name": "Duck Egg",
    "displayName": "Duck Egg â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "duck egg",
      "duck eggs",
      "raw duck egg"
    ],
    "tags": [
      "eggs",
      "duck-egg",
      "whole",
      "duck"
    ],
    "popularity": 72,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 185,
      "protein": 12.81,
      "carbs": 1.45,
      "fat": 13.77,
      "sodium": 146,
      "potassium": 222,
      "saturatedFat": 3.681,
      "cholesterol": 884
    },
    "servings": [
      {
        "id": "duck-egg",
        "label": "1 duck egg",
        "amount": 1,
        "unit": "egg",
        "grams": 70,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "duck-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, duck, whole, fresh, raw",
        "fdcId": 172189,
        "release": "April 2018 (final)",
        "ndbNumber": "01138"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA serving reference: 1 duck egg is approximately 70 g edible portion."
    }
  },
  {
    "id": "goose-egg-whole-raw",
    "name": "Goose Egg",
    "displayName": "Goose Egg â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "goose egg",
      "goose eggs",
      "raw goose egg"
    ],
    "tags": [
      "eggs",
      "goose-egg",
      "whole",
      "goose"
    ],
    "popularity": 48,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 185,
      "protein": 13.87,
      "carbs": 1.35,
      "fat": 13.27,
      "sodium": 138,
      "potassium": 210,
      "saturatedFat": 3.6,
      "cholesterol": 852
    },
    "servings": [
      {
        "id": "goose-egg",
        "label": "1 goose egg",
        "amount": 1,
        "unit": "egg",
        "grams": 144,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "goose-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, goose, whole, fresh, raw",
        "fdcId": 172190,
        "release": "April 2018 (final)",
        "ndbNumber": "01139"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA serving reference: 1 goose egg is approximately 144 g edible portion."
    }
  },
  {
    "id": "quail-egg-whole-raw",
    "name": "Quail Egg",
    "displayName": "Quail Egg â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "quail egg",
      "quail eggs",
      "raw quail egg"
    ],
    "tags": [
      "eggs",
      "quail-egg",
      "whole",
      "quail"
    ],
    "popularity": 68,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 158,
      "protein": 13.05,
      "carbs": 0.41,
      "fat": 11.09,
      "sodium": 141,
      "potassium": 132,
      "saturatedFat": 3.56,
      "cholesterol": 844
    },
    "servings": [
      {
        "id": "quail-egg",
        "label": "1 quail egg",
        "amount": 1,
        "unit": "egg",
        "grams": 9,
        "isDefault": true
      },
      {
        "id": "5-quail-eggs",
        "label": "5 quail eggs",
        "amount": 5,
        "unit": "egg",
        "grams": 45,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "quail-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, quail, whole, fresh, raw",
        "fdcId": 172191,
        "release": "April 2018 (final)",
        "ndbNumber": "01140"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA serving reference: 1 quail egg is approximately 9 g edible portion."
    }
  },
  {
    "id": "turkey-egg-whole-raw",
    "name": "Turkey Egg",
    "displayName": "Turkey Egg â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "turkey egg",
      "turkey eggs",
      "raw turkey egg"
    ],
    "tags": [
      "eggs",
      "turkey-egg",
      "whole",
      "turkey"
    ],
    "popularity": 42,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 171,
      "protein": 13.7,
      "carbs": 1.15,
      "fat": 11.9,
      "sodium": 151,
      "potassium": 142,
      "saturatedFat": 3.63,
      "cholesterol": 933
    },
    "servings": [
      {
        "id": "turkey-egg",
        "label": "1 turkey egg",
        "amount": 1,
        "unit": "egg",
        "grams": 79,
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
    "source": "AriFoodEggs",
    "verified": true,
    "metadata": {
      "foodFamily": "turkey-egg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Egg, turkey, whole, fresh, raw",
        "fdcId": 172192,
        "release": "April 2018 (final)",
        "ndbNumber": "01141"
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
      "allergens": [
        "egg"
      ],
      "notes": "USDA serving reference: 1 turkey egg is approximately 79 g edible portion."
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

  // Clear stale egg records from prior hot reloads.
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
      ARI_EGG_FOODS,
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
      foodCount: ARI_EGG_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "whole-chicken-eggs",
        "egg-components",
        "duck-eggs",
        "goose-eggs",
        "quail-eggs",
        "turkey-eggs"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} egg record(s).`,
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

  global.AriFoodEggs =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_EGG_FOODS.length;
      },

      getFoodIds() {
        return ARI_EGG_FOODS.map(
          food => food.id
        );
      },

      getFamilies() {
        return Array.from(
          new Set(
            ARI_EGG_FOODS.map(
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
          ARI_EGG_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getChickenEggRecords() {
        return ARI_EGG_FOODS
          .filter(
            food =>
              food.metadata.foodFamily === "chicken-egg"
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
        "ari:food-eggs-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_EGG_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_EGG_FOODS.length} source-traceable egg reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
