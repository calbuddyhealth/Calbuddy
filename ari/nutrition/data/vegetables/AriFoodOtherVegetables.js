// =====================================================
// ARI REBIRTH
// File: AriFoodOtherVegetables.js
// Version: 1.1.0
//
// Purpose:
//   Offline culinary-vegetable reference data that
//   does not belong in Leafy, Cruciferous, Root,
//   Starchy, Pepper, or Dried Chile modules.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Tomato + tomatillo
//   - Onion, garlic, scallion, leek
//   - Cucumber
//   - Zucchini + spaghetti squash
//   - Eggplant
//   - Asparagus, raw + cooked
//   - Celery
//   - Green beans, raw + cooked
//   - Okra, raw + cooked
//   - White mushrooms, raw + cooked
//   - Artichoke, cooked
//   - Fennel bulb
//
// Culinary classification:
//   Some entries are botanical fruits or fungi.
//   ARI keeps them in vegetables because this database
//   is organized for real-world food logging rather
//   than strict botanical taxonomy.
//
// Reliability:
//   - USDA Foundation Foods when appropriate.
//   - USDA SR Legacy stable generic references.
//   - Canonical basis: 100 g edible portion.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables v1+
// =====================================================

(function initializeAriFoodOtherVegetables(global) {
  "use strict";

  const VERSION = "1.1.0";
  const MODULE_NAME = "AriFoodOtherVegetables";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.1.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "ownedByThisModule": [
      "tomatoes",
      "tomatillos",
      "onions",
      "garlic",
      "green onions / scallions",
      "leeks",
      "cucumbers",
      "zucchini",
      "spaghetti squash",
      "eggplant",
      "asparagus",
      "celery",
      "green beans",
      "okra",
      "mushrooms",
      "artichokes",
      "fennel"
    ],
    "excludedBecauseOwnedElsewhere": {
      "leafy": [
        "spinach",
        "lettuces",
        "Swiss chard",
        "dandelion greens",
        "endive",
        "beet greens"
      ],
      "cruciferous": [
        "broccoli",
        "cauliflower",
        "Brussels sprouts",
        "kale",
        "collards",
        "mustard greens",
        "turnip greens",
        "bok choy",
        "arugula",
        "watercress"
      ],
      "root": [
        "carrots",
        "beets",
        "turnips",
        "parsnips",
        "radishes",
        "rutabaga",
        "celeriac",
        "jicama",
        "burdock"
      ],
      "starchy": [
        "potatoes",
        "sweet potatoes",
        "yams",
        "cassava",
        "taro",
        "corn",
        "green peas",
        "plantains"
      ],
      "peppers": [
        "green bell pepper",
        "red bell pepper",
        "yellow bell pepper",
        "orange bell pepper",
        "jalapeno",
        "poblano",
        "serrano",
        "banana / Hungarian wax pepper",
        "generic hot chiles"
      ],
      "driedChiles": [
        "ancho",
        "guajillo",
        "pasilla / chile negro",
        "chile de arbol",
        "chipotle",
        "morita",
        "cascabel",
        "puya",
        "California / Anaheim chile",
        "New Mexico chile",
        "mulato"
      ]
    }
  },
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytical commodity records when available",
    "USDA FoodData Central SR Legacy for stable generic raw/cooked references"
  ],
  "rules": [
    "Store canonical nutrition per 100 g edible portion.",
    "Keep raw and cooked states separate when USDA provides materially distinct references.",
    "Do not add oil, butter, cheese, cream, dressing, sauce, broth, breading, salt, or sugar to plain records.",
    "Steamed aliases may map to plain boiled references only when no added fat or sauce is implied.",
    "Botanical fruits such as tomato, cucumber, squash, eggplant, and okra remain in this culinary vegetable module because ARI follows real-world food logging.",
    "Mushrooms remain in this module as culinary vegetables while metadata explicitly notes that they are fungi.",
    "Do not duplicate foods owned by Leafy, Cruciferous, Root, Starchy, Pepper, or Dried Chile modules.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_OTHER_VEGETABLE_FOODS =
    [
  {
    "id": "vegetable-tomato-red-ripe-raw",
    "name": "Tomato",
    "displayName": "Tomato â Red, Ripe, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tomato",
      "tomatoes",
      "red tomato",
      "ripe tomato",
      "raw tomato",
      "sliced tomato",
      "chopped tomato"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "tomato",
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
      "calories": 18,
      "protein": 0.88,
      "carbs": 3.89,
      "fat": 0.2,
      "fiber": 1.2,
      "sodium": 5,
      "potassium": 237,
      "saturatedFat": 0.028
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "tomato",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tomatoes, red, ripe, raw, year round average",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170457
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-tomatillo-raw",
    "name": "Tomatillo",
    "displayName": "Tomatillo â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tomatillo",
      "tomatillos",
      "Mexican husk tomato",
      "husk tomato",
      "raw tomatillo"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "tomatillo",
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
      "calories": 32,
      "protein": 0.96,
      "carbs": 5.84,
      "fat": 1.02,
      "fiber": 1.9,
      "sodium": 1,
      "potassium": 268
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "tomatillo",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Tomatillos, dehusked, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "USDA updated the Foundation Foods tomatillo profile in December 2025, including total dietary fiber."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-onion-raw",
    "name": "Onion",
    "displayName": "Onion â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "onion",
      "onions",
      "raw onion",
      "yellow onion",
      "white onion",
      "brown onion"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "onion",
      "allium",
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
      "calories": 40,
      "protein": 1.1,
      "carbs": 9.34,
      "fat": 0.1,
      "fiber": 1.7,
      "sodium": 4,
      "potassium": 146,
      "saturatedFat": 0.042
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "onion",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Onions, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170000
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-garlic-raw",
    "name": "Garlic",
    "displayName": "Garlic â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "garlic",
      "raw garlic",
      "garlic clove",
      "garlic cloves",
      "fresh garlic"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "garlic",
      "allium",
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
      "calories": 149,
      "protein": 6.36,
      "carbs": 33.06,
      "fat": 0.5,
      "fiber": 2.1,
      "sodium": 17,
      "potassium": 401,
      "saturatedFat": 0.089
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "garlic",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Garlic, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169230
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-green-onion-raw",
    "name": "Green Onion",
    "displayName": "Green Onion / Scallion â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green onion",
      "green onions",
      "scallion",
      "scallions",
      "spring onion",
      "spring onions"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "green-onion",
      "scallion",
      "allium",
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
      "calories": 32,
      "protein": 1.83,
      "carbs": 7.34,
      "fat": 0.19,
      "fiber": 2.6,
      "sodium": 16,
      "potassium": 276,
      "saturatedFat": 0.032
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "green-onion",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Onions, spring or scallions (includes tops and bulb), raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "USDA updated total dietary fiber in green onion, top and bulb, in December 2025."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-leek-raw",
    "name": "Leek",
    "displayName": "Leek â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "leek",
      "leeks",
      "raw leek",
      "raw leeks"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "leek",
      "allium",
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
      "calories": 61,
      "protein": 1.5,
      "carbs": 14.15,
      "fat": 0.3,
      "fiber": 1.8,
      "sodium": 20,
      "potassium": 180,
      "saturatedFat": 0.04
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "leek",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Leeks, bulb and greens, root removed, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "USDA updated the Foundation Foods leek profile in December 2025, including total dietary fiber."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-cucumber-with-peel-raw",
    "name": "Cucumber",
    "displayName": "Cucumber â With Peel, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "cucumber",
      "cucumbers",
      "raw cucumber",
      "cucumber with skin",
      "cucumber with peel"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "cucumber",
      "raw",
      "with-peel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 15,
      "protein": 0.65,
      "carbs": 3.63,
      "fat": 0.11,
      "fiber": 0.5,
      "sodium": 2,
      "potassium": 147,
      "saturatedFat": 0.037
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "cucumber",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cucumber, with peel, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 168409
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-zucchini-raw-with-skin",
    "name": "Zucchini",
    "displayName": "Zucchini â Raw, With Skin",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "zucchini",
      "raw zucchini",
      "courgette",
      "green squash",
      "summer squash zucchini"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "zucchini",
      "summer-squash",
      "raw"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 17,
      "protein": 1.21,
      "carbs": 3.11,
      "fat": 0.32,
      "fiber": 1.0,
      "sodium": 8,
      "potassium": 261,
      "saturatedFat": 0.084
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "zucchini",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Squash, summer, zucchini, includes skin, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169291
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-spaghetti-squash-raw",
    "name": "Spaghetti Squash",
    "displayName": "Spaghetti Squash â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "spaghetti squash",
      "raw spaghetti squash"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "spaghetti-squash",
      "squash",
      "spaghetti-squash",
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
      "calories": 31,
      "protein": 0.64,
      "carbs": 6.91,
      "fat": 0.57,
      "fiber": 1.5
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "spaghetti-squash",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Squash, spaghetti, peeled, seeded, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "USDA updated total dietary fiber for spaghetti squash in December 2025."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-eggplant-raw",
    "name": "Eggplant",
    "displayName": "Eggplant â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "eggplant",
      "aubergine",
      "raw eggplant"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "eggplant",
      "aubergine",
      "raw"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 25,
      "protein": 0.98,
      "carbs": 5.88,
      "fat": 0.18,
      "fiber": 3.0,
      "sodium": 2,
      "potassium": 229,
      "saturatedFat": 0.034
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "eggplant",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Eggplant, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169228
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-asparagus-green-raw",
    "name": "Asparagus",
    "displayName": "Asparagus â Green, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "asparagus",
      "raw asparagus",
      "green asparagus",
      "asparagus spears"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "asparagus",
      "green",
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
      "calories": 20,
      "protein": 2.2,
      "carbs": 3.88,
      "fat": 0.12,
      "fiber": 2.1,
      "sodium": 2,
      "potassium": 202,
      "saturatedFat": 0.04
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "asparagus",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Asparagus, green, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "Green asparagus, raw was added to USDA Foundation Foods in October 2024."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-asparagus-cooked-boiled-no-salt",
    "name": "Asparagus",
    "displayName": "Asparagus â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked asparagus",
      "boiled asparagus",
      "plain asparagus",
      "steamed asparagus"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "asparagus",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 22,
      "protein": 2.4,
      "carbs": 4.11,
      "fat": 0.22,
      "fiber": 2.0,
      "sodium": 14,
      "potassium": 224,
      "saturatedFat": 0.048
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "asparagus",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Asparagus, cooked, boiled, drained, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 168389
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-celery-raw",
    "name": "Celery",
    "displayName": "Celery â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "celery",
      "raw celery",
      "celery stalk",
      "celery sticks"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "celery",
      "raw"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 14,
      "protein": 0.69,
      "carbs": 2.97,
      "fat": 0.17,
      "fiber": 1.6,
      "sodium": 80,
      "potassium": 260,
      "saturatedFat": 0.042
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "celery",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Celery, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169988
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-green-beans-raw",
    "name": "Green Beans",
    "displayName": "Green Beans â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green beans",
      "string beans",
      "snap beans",
      "raw green beans",
      "French beans"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "green-beans",
      "string-beans",
      "raw"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 31,
      "protein": 1.83,
      "carbs": 6.97,
      "fat": 0.22,
      "fiber": 2.7,
      "sodium": 6,
      "potassium": 211,
      "saturatedFat": 0.05
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "green-beans",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, snap, green, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169961
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-green-beans-cooked-boiled-no-salt",
    "name": "Green Beans",
    "displayName": "Green Beans â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked green beans",
      "boiled green beans",
      "plain green beans",
      "steamed green beans"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "green-beans",
      "string-beans",
      "cooked",
      "boiled",
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
      "calories": 35,
      "protein": 1.89,
      "carbs": 7.88,
      "fat": 0.28,
      "fiber": 3.2,
      "sodium": 1,
      "potassium": 146,
      "saturatedFat": 0.064
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "green-beans",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, snap, green, cooked, boiled, drained, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169962
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-okra-raw",
    "name": "Okra",
    "displayName": "Okra â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "okra",
      "raw okra",
      "lady fingers",
      "ladies fingers"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "okra",
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
      "calories": 33,
      "protein": 1.93,
      "carbs": 7.45,
      "fat": 0.19,
      "fiber": 3.2,
      "sodium": 7,
      "potassium": 299,
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "okra",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Okra, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169260
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit pod; classified here by common culinary use.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-okra-cooked-boiled-no-salt",
    "name": "Okra",
    "displayName": "Okra â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked okra",
      "boiled okra",
      "plain okra"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "okra",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 22,
      "protein": 1.87,
      "carbs": 4.51,
      "fat": 0.21,
      "fiber": 2.5
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "okra",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Okra, cooked, boiled, drained, without salt",
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-mushroom-white-raw",
    "name": "White Mushroom",
    "displayName": "White Mushroom â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "white mushroom",
      "white mushrooms",
      "button mushroom",
      "button mushrooms",
      "raw mushroom",
      "raw mushrooms"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "mushroom-white",
      "mushroom",
      "white-mushroom",
      "button-mushroom",
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
      "calories": 22,
      "protein": 3.09,
      "carbs": 3.26,
      "fat": 0.34,
      "fiber": 1.0,
      "sodium": 5,
      "potassium": 318,
      "saturatedFat": 0.05
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "mushroom-white",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mushrooms, white, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169251
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Fungus rather than a botanical plant; included here because users log mushrooms as culinary vegetables.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-mushroom-white-cooked-boiled-no-salt",
    "name": "White Mushroom",
    "displayName": "White Mushroom â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked mushroom",
      "cooked mushrooms",
      "boiled mushroom",
      "plain mushrooms",
      "cooked white mushrooms"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "mushroom-white",
      "mushroom",
      "white-mushroom",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 28,
      "protein": 2.17,
      "carbs": 5.29,
      "fat": 0.47,
      "fiber": 2.2
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "mushroom-white",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mushrooms, white, cooked, boiled, drained, without salt",
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Fungus rather than a botanical plant; included here because users log mushrooms as culinary vegetables.",
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-artichoke-globe-cooked-boiled-no-salt",
    "name": "Artichoke",
    "displayName": "Artichoke â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "artichoke",
      "artichokes",
      "cooked artichoke",
      "boiled artichoke",
      "globe artichoke"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "artichoke",
      "artichoke",
      "globe-artichoke",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53,
      "protein": 2.89,
      "carbs": 11.95,
      "fat": 0.34,
      "fiber": 5.7,
      "sodium": 60,
      "potassium": 286,
      "saturatedFat": 0.078
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "artichoke",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Artichokes, (globe or french), cooked, boiled, drained, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 169206
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-fennel-bulb-raw",
    "name": "Fennel",
    "displayName": "Fennel Bulb â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "fennel",
      "fennel bulb",
      "raw fennel",
      "Florence fennel"
    ],
    "tags": [
      "vegetable",
      "other-vegetable",
      "fennel",
      "fennel-bulb",
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
      "calories": 31,
      "protein": 1.24,
      "carbs": 7.3,
      "fat": 0.2,
      "fiber": 3.1,
      "sodium": 52,
      "potassium": 414,
      "saturatedFat": 0.09
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
    "source": "AriFoodOtherVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "other-vegetable",
      "vegetableType": "fennel",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Fennel, bulb, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "sourceNote": "Fennel, bulb, raw was added to USDA Foundation Foods in December 2025."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": null,
      "notes": "Plain unbranded culinary vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, broth, breading, sugar, cream, or other recipe ingredients are not included."
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

  // Clear stale records owned by this exact module on hot reload.
  if (
    typeof registry.getBySource === "function" &&
    typeof registry.remove === "function"
  ) {
    try {
      const existing =
        registry.getBySource(
          MODULE_NAME,
          {
            includeDisabled: true
          }
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

  const registration =
    registry.registerMany(
      ARI_OTHER_VEGETABLE_FOODS,
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

      foodCount:
        ARI_OTHER_VEGETABLE_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "tomato",
        "tomatillo",
        "onion",
        "garlic",
        "green-onion",
        "leek",
        "cucumber",
        "zucchini",
        "spaghetti-squash",
        "eggplant",
        "asparagus",
        "celery",
        "green-beans",
        "okra",
        "mushroom",
        "artichoke",
        "fennel"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} other-vegetable record(s).`,
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

  global.AriFoodOtherVegetables =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_OTHER_VEGETABLE_FOODS.length;
      },

      getFoodIds() {
        return ARI_OTHER_VEGETABLE_FOODS.map(
          food => food.id
        );
      },

      getVegetableTypes() {
        return Array.from(
          new Set(
            ARI_OTHER_VEGETABLE_FOODS.map(
              food => food.metadata.vegetableType
            )
          )
        );
      },

      getRawRecords() {
        return ARI_OTHER_VEGETABLE_FOODS
          .filter(
            food => food.state === "raw"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_OTHER_VEGETABLE_FOODS
          .filter(
            food => food.state === "cooked"
          )
          .map(clone);
      },

      getCulinaryNonBotanicalVegetables() {
        return ARI_OTHER_VEGETABLE_FOODS
          .filter(
            food =>
              Boolean(
                food.metadata?.botanicalNote
              )
          )
          .map(clone);
      },

      getSourcePolicy() {
        return clone(
          SOURCE_POLICY
        );
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_OTHER_VEGETABLE_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getRegistrationResult() {
        return clone(
          registration
        );
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-other-vegetables-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_OTHER_VEGETABLE_FOODS.length,

            runtimeInternetRequired:
              false,

            registration:
              moduleResult
          }
        }
      )
    );
  } catch (error) {
    // Non-browser environments may not support CustomEvent.
  }

  console.info(
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OTHER_VEGETABLE_FOODS.length} source-traceable other-vegetable records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
