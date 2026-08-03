// =====================================================
// ARI REBIRTH
// File: AriFoodRootVegetables.js
// Version: 1.0.0
//
// Purpose:
//   Offline root vegetable reference data for
//   ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Carrot, raw + cooked
//   - Beet root, raw + cooked
//   - Turnip root, raw + cooked
//   - Parsnip, raw + cooked
//   - Red radish, raw
//   - Daikon radish, raw
//   - Rutabaga, raw + cooked
//   - Celeriac / celery root, raw + cooked
//   - Jicama, raw
//   - Burdock root, raw + cooked
//
// Category boundary:
//   Potatoes, sweet potatoes, cassava/yuca, yams,
//   taro, corn, peas, and other high-starch vegetables
//   are reserved for AriFoodStarchyVegetables.
//
// Reliability:
//   - USDA Foundation Foods where appropriate.
//   - USDA SR Legacy stable generic references.
//   - Canonical basis: 100 g edible portion.
//   - Raw/cooked states remain distinct.
//   - Added fats, glazes, sauces, salt, and recipe
//     ingredients are excluded.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables v1+
// =====================================================

(function initializeAriFoodRootVegetables(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodRootVegetables";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "ownedByThisModule": [
      "carrots",
      "beet roots",
      "turnip roots",
      "parsnips",
      "red radishes",
      "daikon radish",
      "rutabaga",
      "celeriac",
      "jicama",
      "burdock root"
    ],
    "reservedForStarchyVegetables": [
      "white potatoes",
      "red potatoes",
      "yellow potatoes",
      "sweet potatoes",
      "yams",
      "cassava / yuca",
      "taro",
      "corn",
      "green peas"
    ],
    "notDuplicatedAcrossVegetableModules": true
  },
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for newer current raw commodity references when available",
    "USDA FoodData Central SR Legacy for stable generic raw/cooked references"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked states separate when USDA provides distinct references.",
    "Do not include oil, butter, glaze, sugar, salt, dressing, sauce, cheese, broth, or breading.",
    "Do not map roasted or air-fried preparations to boiled records when meaningful water loss or added fat is likely.",
    "Baby carrots are an alias for raw carrots rather than a separate fabricated nutrient profile.",
    "Red/salad radish and daikon are separate records.",
    "Potatoes, sweet potatoes, cassava, yams, taro, corn, peas, and similar high-starch vegetables are reserved for AriFoodStarchyVegetables.",
    "Weight-based servings are preferred to avoid false precision from variable whole-root sizes.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_ROOT_VEGETABLE_FOODS =
    [
  {
    "id": "vegetable-carrot-raw",
    "name": "Carrot",
    "displayName": "Carrot â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "carrot",
      "carrots",
      "raw carrot",
      "raw carrots",
      "baby carrot",
      "baby carrots"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "carrot",
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
      "calories": 41,
      "protein": 0.93,
      "carbs": 9.58,
      "fat": 0.24,
      "fiber": 2.8
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "carrot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Carrot, raw",
        "release": "April 2018 (final)",
        "fdcId": 170393
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-carrot-cooked-boiled-no-salt",
    "name": "Carrot",
    "displayName": "Carrot â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked carrot",
      "cooked carrots",
      "boiled carrot",
      "boiled carrots",
      "plain cooked carrots",
      "steamed carrots"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "carrot",
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
      "calories": 35,
      "protein": 0.76,
      "carbs": 8.22,
      "fat": 0.18,
      "fiber": 3.0
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "carrot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Carrot, cooked, boiled, no salt",
        "release": "April 2018 (final)",
        "fdcId": 170394
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-beet-root-raw",
    "name": "Beet",
    "displayName": "Beet â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "beet",
      "beets",
      "beetroot",
      "raw beet",
      "raw beets",
      "red beet"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "beet",
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
      "calories": 43,
      "protein": 1.61,
      "carbs": 9.56,
      "fat": 0.17,
      "fiber": 2.8
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "beet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beet, raw",
        "release": "April 2018 (final)",
        "fdcId": 169145
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-beet-root-cooked-boiled",
    "name": "Beet",
    "displayName": "Beet â Cooked, Boiled",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked beet",
      "cooked beets",
      "boiled beet",
      "boiled beets",
      "cooked beetroot"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "beet",
      "cooked"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 44,
      "protein": 1.68,
      "carbs": 9.96,
      "fat": 0.18,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "beet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beet, cooked, boiled",
        "release": "April 2018 (final)",
        "fdcId": 169146
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-turnip-root-raw",
    "name": "Turnip",
    "displayName": "Turnip â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "turnip",
      "turnips",
      "raw turnip",
      "raw turnips",
      "purple top turnip"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "turnip",
      "raw"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 28,
      "protein": 0.9,
      "carbs": 6.43,
      "fat": 0.1,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "turnip",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Turnips, raw",
        "release": "December 2025 / current through April 2026",
        "sourceNote": "Turnips, raw were added to USDA Foundation Foods in December 2025. Exact current Foundation FDC ID is intentionally omitted rather than inferred."
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-turnip-root-cooked-boiled-no-salt",
    "name": "Turnip",
    "displayName": "Turnip â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked turnip",
      "cooked turnips",
      "boiled turnip",
      "boiled turnips",
      "plain turnips"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "turnip",
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
      "calories": 22,
      "protein": 0.71,
      "carbs": 5.06,
      "fat": 0.08,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "turnip",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Turnip, cooked, boiled, no salt",
        "release": "April 2018 (final)",
        "fdcId": 170058
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-parsnip-raw",
    "name": "Parsnip",
    "displayName": "Parsnip â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "parsnip",
      "parsnips",
      "raw parsnip",
      "raw parsnips"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "parsnip",
      "raw"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 75,
      "protein": 1.2,
      "carbs": 17.99,
      "fat": 0.3,
      "fiber": 4.9
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "parsnip",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Parsnips, raw",
        "release": "December 2025 / current through April 2026",
        "sourceNote": "Parsnips, raw were added to USDA Foundation Foods in December 2025. Exact current Foundation FDC ID is intentionally omitted rather than inferred."
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-parsnip-cooked-boiled-no-salt",
    "name": "Parsnip",
    "displayName": "Parsnip â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked parsnip",
      "cooked parsnips",
      "boiled parsnip",
      "boiled parsnips",
      "plain parsnips"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "parsnip",
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
      "calories": 71,
      "protein": 1.32,
      "carbs": 17.01,
      "fat": 0.3,
      "fiber": 3.6
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "parsnip",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Parsnip, cooked, boiled, no salt",
        "release": "April 2018 (final)",
        "fdcId": 170009
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-radish-red-raw",
    "name": "Red Radish",
    "displayName": "Red Radish â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "radish",
      "radishes",
      "red radish",
      "red radishes",
      "raw radish",
      "salad radish"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "radish",
      "raw"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 16,
      "protein": 0.68,
      "carbs": 3.4,
      "fat": 0.1,
      "fiber": 1.6
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "radish",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Radishes, raw",
        "release": "April 2018 (final)",
        "fdcId": 169276
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-daikon-radish-raw",
    "name": "Daikon Radish",
    "displayName": "Daikon Radish â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "daikon",
      "daikon radish",
      "oriental radish",
      "white radish",
      "Japanese radish",
      "raw daikon"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "daikon",
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
      "calories": 18,
      "protein": 0.6,
      "carbs": 4.1,
      "fat": 0.1,
      "fiber": 1.6
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "daikon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Radishes, oriental, raw",
        "release": "April 2018 (final)",
        "fdcId": 168451
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-rutabaga-raw",
    "name": "Rutabaga",
    "displayName": "Rutabaga â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "rutabaga",
      "rutabagas",
      "swede",
      "Swedish turnip",
      "yellow turnip",
      "raw rutabaga"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "rutabaga",
      "raw"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 37,
      "protein": 1.08,
      "carbs": 8.62,
      "fat": 0.16,
      "fiber": 2.3
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "rutabaga",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rutabaga, raw",
        "release": "April 2018 (final)",
        "fdcId": 168454
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-rutabaga-cooked-boiled-no-salt",
    "name": "Rutabaga",
    "displayName": "Rutabaga â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked rutabaga",
      "boiled rutabaga",
      "cooked swede",
      "boiled swede",
      "mashed rutabaga plain"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "rutabaga",
      "cooked"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 30,
      "protein": 0.93,
      "carbs": 6.84,
      "fat": 0.18,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "rutabaga",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Rutabaga, cooked, boiled, no salt",
        "release": "April 2018 (final)",
        "fdcId": 168455
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-celeriac-raw",
    "name": "Celeriac",
    "displayName": "Celeriac â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "celeriac",
      "celery root",
      "celery-root",
      "knob celery",
      "raw celeriac"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "celeriac",
      "raw"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 42,
      "protein": 1.5,
      "carbs": 9.2,
      "fat": 0.3,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "celeriac",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Celeriac, raw",
        "release": "April 2018 (final)",
        "fdcId": 170400
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-celeriac-cooked-boiled-no-salt",
    "name": "Celeriac",
    "displayName": "Celeriac â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked celeriac",
      "boiled celeriac",
      "cooked celery root",
      "boiled celery root",
      "plain celery root"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "celeriac",
      "cooked"
    ],
    "popularity": 81,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 27,
      "protein": 0.96,
      "carbs": 5.9,
      "fat": 0.19,
      "fiber": 1.2
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "celeriac",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Celeriac, cooked, boiled, no salt",
        "release": "April 2018 (final)",
        "fdcId": 169987
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-jicama-raw",
    "name": "Jicama",
    "displayName": "Jicama â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "jicama",
      "yam bean",
      "Mexican turnip",
      "Mexican potato",
      "raw jicama"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "jicama",
      "raw"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 38,
      "protein": 0.72,
      "carbs": 8.82,
      "fat": 0.09,
      "fiber": 4.9
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "jicama",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Jicama, raw",
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-burdock-root-raw",
    "name": "Burdock Root",
    "displayName": "Burdock Root â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "burdock root",
      "burdock",
      "gobo",
      "raw burdock",
      "raw gobo"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "burdock",
      "raw"
    ],
    "popularity": 76,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 72,
      "protein": 1.53,
      "carbs": 17.34,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "burdock",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Burdock root, raw",
        "release": "April 2018 (final)",
        "fdcId": 169974
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-burdock-root-cooked-boiled-no-salt",
    "name": "Burdock Root",
    "displayName": "Burdock Root â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked burdock root",
      "boiled burdock",
      "cooked gobo",
      "boiled gobo"
    ],
    "tags": [
      "vegetable",
      "root-vegetable",
      "burdock",
      "cooked"
    ],
    "popularity": 75,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 88,
      "protein": 2.09,
      "carbs": 21.2,
      "fat": 0.14,
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
    "source": "AriFoodRootVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "root-vegetable",
      "rootType": "burdock",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Burdock root, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 170384
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
      "notes": "Plain unbranded root vegetable reference. Added oil, butter, salt, sugar, glaze, sauce, dressing, broth, cheese, breading, or other recipe ingredients are not included."
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior module records.`,
        error
      );
    }
  }

  const registration = registry.registerMany(
    ARI_ROOT_VEGETABLE_FOODS,
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
      foodCount: ARI_ROOT_VEGETABLE_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "carrot",
        "beet",
        "turnip",
        "parsnip",
        "radish",
        "daikon",
        "rutabaga",
        "celeriac",
        "jicama",
        "burdock"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} root-vegetable record(s).`,
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

  global.AriFoodRootVegetables = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_ROOT_VEGETABLE_FOODS.length;
    },

    getFoodIds() {
      return ARI_ROOT_VEGETABLE_FOODS.map(food => food.id);
    },

    getRootTypes() {
      return Array.from(
        new Set(
          ARI_ROOT_VEGETABLE_FOODS.map(
            food => food.metadata.rootType
          )
        )
      );
    },

    getRawRecords() {
      return ARI_ROOT_VEGETABLE_FOODS
        .filter(food => food.state === "raw")
        .map(clone);
    },

    getCookedRecords() {
      return ARI_ROOT_VEGETABLE_FOODS
        .filter(food => food.state === "cooked")
        .map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();

      const record = ARI_ROOT_VEGETABLE_FOODS.find(
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
        "ari:food-root-vegetables-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_ROOT_VEGETABLE_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_ROOT_VEGETABLE_FOODS.length} root vegetable records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);