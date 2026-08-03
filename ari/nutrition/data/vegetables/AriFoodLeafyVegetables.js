// =====================================================
// ARI REBIRTH
// File: AriFoodLeafyVegetables.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline leafy vegetable data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Spinach, raw + cooked
//   - Romaine lettuce
//   - Iceberg lettuce
//   - Green leaf lettuce
//   - Red leaf lettuce
//   - Butterhead / Bibb / Boston lettuce
//   - Swiss chard, raw + cooked
//   - Dandelion greens, raw + cooked
//   - Endive
//   - Beet greens, raw + cooked
//
// Category boundary:
//   Brassicaceae greens such as kale, collards,
//   mustard greens, turnip greens, arugula,
//   watercress, and bok choy are intentionally
//   reserved for AriFoodCruciferousVegetables.
//
// Reliability:
//   - USDA FoodData Central generic references.
//   - Canonical nutrition basis: 100 g edible portion.
//   - Raw/cooked states remain distinct.
//   - No sauces, dressings, fats, or salt included.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables v1+
// =====================================================

(function initializeAriFoodLeafyVegetables(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodLeafyVegetables";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "includedHere": [
      "spinach",
      "lettuces",
      "Swiss chard",
      "dandelion greens",
      "endive",
      "beet greens"
    ],
    "reservedForCruciferousModule": [
      "kale",
      "collard greens",
      "mustard greens",
      "turnip greens",
      "arugula",
      "watercress",
      "bok choy"
    ]
  },
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact generic vegetable records",
    "Current USDA-derived mirrors used only to cross-check the historical USDA profiles during authoring"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked leafy vegetables separate when USDA provides materially distinct references.",
    "Do not duplicate Brassicaceae leafy vegetables in this module; those belong to AriFoodCruciferousVegetables.",
    "Do not include salad dressing, oil, butter, cheese, bacon, sauce, broth, salt, or other additions in plain vegetable records.",
    "Use USDA household gram equivalents only when sufficiently defensible; otherwise prefer weight-based servings.",
    "Baby spinach is a search alias for plain raw spinach rather than a fabricated separate macro profile.",
    "Rainbow chard is a search alias for Swiss chard rather than a fabricated separate macro profile.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_LEAFY_VEGETABLE_FOODS =
    [
  {
    "id": "vegetable-spinach-raw",
    "name": "Spinach",
    "displayName": "Spinach â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "spinach",
      "raw spinach",
      "baby spinach",
      "fresh spinach"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "spinach",
      "spinach",
      "raw",
      "salad-green"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 23,
      "protein": 2.86,
      "carbs": 3.63,
      "fat": 0.39,
      "fiber": 2.2,
      "sodium": 79,
      "potassium": 558,
      "saturatedFat": 0.063
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 30,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "spinach",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Spinach, raw",
        "fdcId": 168462
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-spinach-cooked-boiled-no-salt",
    "name": "Spinach",
    "displayName": "Spinach â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked spinach",
      "boiled spinach",
      "plain cooked spinach"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "spinach",
      "spinach",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 23,
      "protein": 2.97,
      "carbs": 3.75,
      "fat": 0.26,
      "fiber": 2.4,
      "sodium": 70,
      "potassium": 466,
      "saturatedFat": 0.043
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 180,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "spinach",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Spinach, cooked, boiled, drained, without salt",
        "sourceNote": "USDA SR Legacy exact generic cooked-spinach profile."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-lettuce-romaine-raw",
    "name": "Romaine Lettuce",
    "displayName": "Romaine Lettuce",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "romaine",
      "romaine lettuce",
      "cos lettuce",
      "hearts of romaine"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "romaine",
      "lettuce",
      "romaine",
      "salad-green"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 17,
      "protein": 1.23,
      "carbs": 3.29,
      "fat": 0.3,
      "fiber": 2.1,
      "sodium": 8,
      "potassium": 247,
      "saturatedFat": 0.039
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 47,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "romaine",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Lettuce, cos or romaine, raw",
        "fdcId": 169247
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-lettuce-iceberg-raw",
    "name": "Iceberg Lettuce",
    "displayName": "Iceberg Lettuce",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "iceberg",
      "iceberg lettuce",
      "crisphead lettuce"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "iceberg",
      "lettuce",
      "iceberg",
      "crisphead",
      "salad-green"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 14,
      "protein": 0.9,
      "carbs": 2.97,
      "fat": 0.14,
      "fiber": 1.2,
      "sodium": 10,
      "potassium": 141,
      "saturatedFat": 0.018
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 72,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "iceberg",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Lettuce, iceberg (includes crisphead types), raw",
        "fdcId": 169248
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-lettuce-green-leaf-raw",
    "name": "Green Leaf Lettuce",
    "displayName": "Green Leaf Lettuce",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green leaf lettuce",
      "leaf lettuce",
      "green lettuce"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "green-leaf-lettuce",
      "lettuce",
      "green-leaf",
      "salad-green"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 15,
      "protein": 1.36,
      "carbs": 2.87,
      "fat": 0.15,
      "fiber": 1.3,
      "sodium": 28,
      "potassium": 194,
      "saturatedFat": 0.02
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 36,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "green-leaf-lettuce",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Lettuce, green leaf, raw",
        "fdcId": 169249
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-lettuce-red-leaf-raw",
    "name": "Red Leaf Lettuce",
    "displayName": "Red Leaf Lettuce",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red leaf lettuce",
      "red lettuce",
      "leaf lettuce red"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "red-leaf-lettuce",
      "lettuce",
      "red-leaf",
      "salad-green"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 13,
      "protein": 1.33,
      "carbs": 2.26,
      "fat": 0.22,
      "fiber": 0.9,
      "sodium": 25,
      "potassium": 187,
      "saturatedFat": 0.028
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 28,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "red-leaf-lettuce",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Lettuce, red leaf, raw",
        "fdcId": 168431
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-lettuce-butterhead-raw",
    "name": "Butterhead Lettuce",
    "displayName": "Butterhead Lettuce",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "butterhead lettuce",
      "butter lettuce",
      "bibb lettuce",
      "boston lettuce"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "butterhead",
      "lettuce",
      "butterhead",
      "bibb",
      "boston",
      "salad-green"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 13,
      "protein": 1.35,
      "carbs": 2.23,
      "fat": 0.22,
      "fiber": 1.1,
      "sodium": 5,
      "potassium": 238,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "butterhead",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Lettuce, butterhead (includes boston and bibb types), raw",
        "sourceNote": "Exact USDA SR Legacy food description; identifier intentionally omitted rather than inferred."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-swiss-chard-raw",
    "name": "Swiss Chard",
    "displayName": "Swiss Chard â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "swiss chard",
      "chard",
      "rainbow chard",
      "raw chard"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "swiss-chard",
      "chard",
      "raw",
      "leafy-green"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 19,
      "protein": 1.8,
      "carbs": 3.74,
      "fat": 0.2,
      "fiber": 1.6,
      "sodium": 213,
      "potassium": 379,
      "saturatedFat": 0.03
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 36,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "swiss-chard",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Chard, swiss, raw",
        "sourceNote": "USDA SR Legacy generic Swiss-chard profile."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-swiss-chard-cooked-boiled-no-salt",
    "name": "Swiss Chard",
    "displayName": "Swiss Chard â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked swiss chard",
      "boiled chard",
      "cooked chard"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "swiss-chard",
      "chard",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 20,
      "protein": 1.88,
      "carbs": 4.13,
      "fat": 0.08,
      "fiber": 2.1,
      "sodium": 179,
      "potassium": 549,
      "saturatedFat": 0.013
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 175,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "swiss-chard",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Chard, swiss, cooked, boiled, drained, without salt",
        "sourceNote": "USDA SR Legacy generic cooked Swiss-chard profile."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-dandelion-greens-raw",
    "name": "Dandelion Greens",
    "displayName": "Dandelion Greens â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "dandelion greens",
      "raw dandelion greens",
      "dandelion leaves"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "dandelion-greens",
      "dandelion",
      "raw",
      "bitter-green"
    ],
    "popularity": 75,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 45,
      "protein": 2.7,
      "carbs": 9.2,
      "fat": 0.7,
      "fiber": 3.5,
      "sodium": 76,
      "potassium": 397,
      "saturatedFat": 0.17
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 55,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "dandelion-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Dandelion greens, raw",
        "fdcId": 169226
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-dandelion-greens-cooked-boiled-no-salt",
    "name": "Dandelion Greens",
    "displayName": "Dandelion Greens â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked dandelion greens",
      "boiled dandelion greens",
      "dandelion greens cooked"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "dandelion-greens",
      "dandelion",
      "cooked",
      "boiled",
      "no-salt",
      "bitter-green"
    ],
    "popularity": 72,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33,
      "protein": 2.0,
      "carbs": 6.4,
      "fat": 0.6,
      "fiber": 2.9,
      "potassium": 232
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "dandelion-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Dandelion greens, cooked, boiled, drained, without salt",
        "fdcId": 169227
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-endive-raw",
    "name": "Endive",
    "displayName": "Endive â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "endive",
      "curly endive",
      "frisee",
      "frisÃ©e",
      "raw endive"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "endive",
      "endive",
      "chicory-family",
      "salad-green",
      "bitter-green"
    ],
    "popularity": 85,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 17,
      "protein": 1.25,
      "carbs": 3.35,
      "fat": 0.2,
      "fiber": 3.1,
      "sodium": 22,
      "potassium": 314,
      "saturatedFat": 0.048
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "endive",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Endive, raw",
        "sourceNote": "USDA SR Legacy generic endive profile."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-beet-greens-raw",
    "name": "Beet Greens",
    "displayName": "Beet Greens â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "beet greens",
      "beet leaves",
      "raw beet greens"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "beet-greens",
      "beet-greens",
      "raw",
      "leafy-green"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 22,
      "protein": 2.2,
      "carbs": 4.33,
      "fat": 0.13,
      "fiber": 3.7,
      "sodium": 226,
      "potassium": 762,
      "saturatedFat": 0.02
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 38,
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "beet-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Beet greens, raw",
        "sourceNote": "USDA SR Legacy generic beet-greens profile."
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-beet-greens-cooked-boiled-no-salt",
    "name": "Beet Greens",
    "displayName": "Beet Greens â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked beet greens",
      "boiled beet greens",
      "beet leaves cooked"
    ],
    "tags": [
      "vegetable",
      "leafy-vegetable",
      "beet-greens",
      "beet-greens",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 80,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 27,
      "protein": 2.57,
      "carbs": 5.46,
      "fat": 0.2,
      "fiber": 2.9,
      "sodium": 241,
      "potassium": 909,
      "saturatedFat": 0.032
    },
    "servings": [
      {
        "id": "cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
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
    "source": "AriFoodLeafyVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "leafy-vegetable",
      "leafyType": "beet-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "release": "April 2018 (final)",
        "sourceDescription": "Beet greens, cooked, boiled, drained, without salt",
        "fdcId": 170376,
        "ndbNumber": "11087"
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
      "notes": "Plain unbranded vegetable reference. Added oil, butter, dressing, cheese, salt, sauce, bacon, broth, or other recipe ingredients are not included."
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior module records.`,
        error
      );
    }
  }

  const registration =
    registry.registerMany(
      ARI_LEAFY_VEGETABLE_FOODS,
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
        ARI_LEAFY_VEGETABLE_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "spinach",
        "romaine",
        "iceberg",
        "green-leaf-lettuce",
        "red-leaf-lettuce",
        "butterhead",
        "swiss-chard",
        "dandelion-greens",
        "endive",
        "beet-greens"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} leafy-vegetable record(s).`,
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

  global.AriFoodLeafyVegetables =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_LEAFY_VEGETABLE_FOODS.length;
      },

      getFoodIds() {
        return ARI_LEAFY_VEGETABLE_FOODS.map(
          food => food.id
        );
      },

      getLeafyTypes() {
        return Array.from(
          new Set(
            ARI_LEAFY_VEGETABLE_FOODS.map(
              food => food.metadata.leafyType
            )
          )
        );
      },

      getRawRecords() {
        return ARI_LEAFY_VEGETABLE_FOODS
          .filter(
            food => food.state === "raw"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_LEAFY_VEGETABLE_FOODS
          .filter(
            food => food.state === "cooked"
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
          ARI_LEAFY_VEGETABLE_FOODS.find(
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
        "ari:food-leafy-vegetables-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_LEAFY_VEGETABLE_FOODS.length,
            runtimeInternetRequired: false,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_LEAFY_VEGETABLE_FOODS.length} source-traceable leafy vegetable records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);