// =====================================================
// ARI REBIRTH
// File: AriFoodCruciferousVegetables.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline cruciferous vegetable
//   reference data for ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Broccoli, raw + cooked
//   - Cauliflower, raw + cooked
//   - Brussels sprouts, raw + cooked
//   - Kale, raw + cooked
//   - Collard greens, raw + cooked
//   - Mustard greens, raw + cooked
//   - Turnip greens, raw + cooked
//   - Bok choy / pak choi, raw + cooked
//   - Arugula, raw
//   - Watercress, raw
//
// Category boundary:
//   These Brassicaceae foods are intentionally NOT
//   duplicated in AriFoodLeafyVegetables.
//
// Reliability:
//   - USDA Foundation Foods when appropriate.
//   - USDA SR Legacy for stable generic references.
//   - Canonical basis: 100 g edible portion.
//   - Raw/cooked states stay distinct.
//   - Added fats, sauces, cheese, bacon, breading,
//     broth, and salt are excluded.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables v1+
// =====================================================

(function initializeAriFoodCruciferousVegetables(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCruciferousVegetables";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "ownedByThisModule": [
      "broccoli",
      "cauliflower",
      "Brussels sprouts",
      "kale",
      "collard greens",
      "mustard greens",
      "turnip greens",
      "bok choy / pak choi",
      "arugula",
      "watercress"
    ],
    "notDuplicatedInLeafyVegetables": true
  },
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current raw analytical commodities when available",
    "USDA FoodData Central SR Legacy for stable generic raw/cooked vegetable references",
    "USDA-derived mirrors used only to cross-check nutrient values and identifiers during authoring"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked states separate.",
    "Do not duplicate these Brassicaceae foods in AriFoodLeafyVegetables.",
    "Do not create roasted, sauteed, air-fried, cheesy, breaded, bacon-seasoned, or sauced records from plain USDA vegetable data.",
    "A steamed alias may map to a plain cooked reference only when no meaningful added fat or sauce is implied.",
    "Traditional greens prepared with meat, broth, or fat are prepared dishes and must not reuse plain boiled-green nutrition.",
    "Weight-based servings are preferred in this first version to avoid false precision from variable floret, leaf, bunch, and chopped-cup packing.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CRUCIFEROUS_VEGETABLE_FOODS =
    [
  {
    "id": "vegetable-broccoli-raw",
    "name": "Broccoli",
    "displayName": "Broccoli â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "broccoli",
      "raw broccoli",
      "fresh broccoli",
      "broccoli florets"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "broccoli",
      "broccoli",
      "raw",
      "florets"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 34,
      "protein": 2.82,
      "carbs": 6.64,
      "fat": 0.37,
      "fiber": 2.6,
      "sodium": 33,
      "potassium": 316,
      "saturatedFat": 0.039
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "broccoli",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Broccoli, raw",
        "release": "April 2018 (final)",
        "fdcId": 170379
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-broccoli-cooked-boiled-no-salt",
    "name": "Broccoli",
    "displayName": "Broccoli â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked broccoli",
      "boiled broccoli",
      "plain broccoli",
      "steamed broccoli"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "broccoli",
      "broccoli",
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
      "protein": 2.38,
      "carbs": 7.18,
      "fat": 0.41,
      "fiber": 3.3,
      "sodium": 41,
      "potassium": 293,
      "saturatedFat": 0.079
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "broccoli",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Broccoli, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy plain cooked-broccoli reference. The 'steamed broccoli' alias is for a plain no-added-fat preparation when a more exact steamed record is unavailable."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-cauliflower-raw",
    "name": "Cauliflower",
    "displayName": "Cauliflower â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "cauliflower",
      "raw cauliflower",
      "cauliflower florets"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "cauliflower",
      "cauliflower",
      "raw",
      "florets"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 25,
      "protein": 1.92,
      "carbs": 4.97,
      "fat": 0.28,
      "fiber": 2.0,
      "sodium": 30,
      "potassium": 299,
      "saturatedFat": 0.13
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "cauliflower",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Cauliflower, raw",
        "release": "April 2026",
        "sourceNote": "Cauliflower, raw is included in USDA Foundation Foods; exact Foundation FDC ID is intentionally omitted here rather than inferred."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-cauliflower-cooked-boiled-no-salt",
    "name": "Cauliflower",
    "displayName": "Cauliflower â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked cauliflower",
      "boiled cauliflower",
      "plain cauliflower",
      "steamed cauliflower"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "cauliflower",
      "cauliflower",
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
      "protein": 1.84,
      "carbs": 4.11,
      "fat": 0.45,
      "fiber": 2.3,
      "sodium": 15,
      "potassium": 142,
      "saturatedFat": 0.07
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "cauliflower",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cauliflower, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 170397
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-brussels-sprouts-raw",
    "name": "Brussels Sprouts",
    "displayName": "Brussels Sprouts â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "brussels sprouts",
      "brussel sprouts",
      "raw brussels sprouts"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "brussels-sprouts",
      "brussels-sprouts",
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
      "calories": 43,
      "protein": 3.38,
      "carbs": 8.95,
      "fat": 0.3,
      "fiber": 3.8,
      "sodium": 25,
      "potassium": 389,
      "saturatedFat": 0.062
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "brussels-sprouts",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Brussels sprouts, raw",
        "release": "April 2026",
        "fdcId": 170383,
        "sourceNote": "USDA current Foundation inventory includes Brussels sprouts, raw. The retained identifier also maps to the longstanding FoodData Central profile."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-brussels-sprouts-cooked-boiled-no-salt",
    "name": "Brussels Sprouts",
    "displayName": "Brussels Sprouts â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked brussels sprouts",
      "boiled brussels sprouts",
      "plain brussels sprouts"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "brussels-sprouts",
      "brussels-sprouts",
      "cooked",
      "boiled",
      "no-salt"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 36,
      "protein": 2.55,
      "carbs": 7.1,
      "fat": 0.5,
      "fiber": 2.6,
      "sodium": 21,
      "potassium": 317,
      "saturatedFat": 0.102
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "brussels-sprouts",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Brussels sprouts, cooked, boiled, drained, without salt",
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
      "brandSpecific": false,
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-kale-raw",
    "name": "Kale",
    "displayName": "Kale â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "kale",
      "raw kale",
      "fresh kale",
      "curly kale"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "kale",
      "kale",
      "raw",
      "leafy-crucifer"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 49,
      "protein": 4.28,
      "carbs": 8.75,
      "fat": 0.93,
      "fiber": 3.6,
      "sodium": 38,
      "potassium": 491,
      "saturatedFat": 0.091
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "kale",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Kale, raw",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy generic kale profile. Newer USDA kale entries can differ by cultivar and analytic dataset; ARI preserves this stable identified generic reference for offline use."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-kale-cooked-boiled-no-salt",
    "name": "Kale",
    "displayName": "Kale â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked kale",
      "boiled kale",
      "plain kale"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "kale",
      "kale",
      "cooked",
      "boiled",
      "no-salt",
      "leafy-crucifer"
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
      "protein": 1.9,
      "carbs": 5.63,
      "fat": 0.4,
      "fiber": 2.0,
      "sodium": 23,
      "potassium": 228,
      "saturatedFat": 0.052
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "kale",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Kale, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 169238
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-collard-greens-raw",
    "name": "Collard Greens",
    "displayName": "Collard Greens â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "collard greens",
      "collards",
      "raw collards",
      "raw collard greens"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "collards",
      "collards",
      "raw",
      "leafy-crucifer"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 32,
      "protein": 3.02,
      "carbs": 5.42,
      "fat": 0.61,
      "fiber": 4.0,
      "sodium": 17,
      "potassium": 213,
      "saturatedFat": 0.055
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "collards",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Collards, raw",
        "release": "April 2026",
        "sourceNote": "Collards, raw are included in USDA Foundation Foods. Exact current Foundation FDC ID is intentionally omitted rather than inferred."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-collard-greens-cooked-boiled-no-salt",
    "name": "Collard Greens",
    "displayName": "Collard Greens â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked collard greens",
      "cooked collards",
      "boiled collard greens",
      "plain collards"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "collards",
      "collards",
      "cooked",
      "boiled",
      "no-salt",
      "leafy-crucifer"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33,
      "protein": 2.71,
      "carbs": 5.65,
      "fat": 0.72,
      "fiber": 4.0,
      "sodium": 15,
      "potassium": 117,
      "saturatedFat": 0.047
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "collards",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Collards, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 170407
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
      "notes": "Plain boiled collard greens without salt or added fat. Traditional collard recipes with bacon, ham hock, smoked turkey, broth, or added oil must be logged as prepared dishes."
    }
  },
  {
    "id": "vegetable-mustard-greens-raw",
    "name": "Mustard Greens",
    "displayName": "Mustard Greens â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "mustard greens",
      "raw mustard greens",
      "mustard leaves"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "mustard-greens",
      "mustard-greens",
      "raw",
      "leafy-crucifer"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 27,
      "protein": 2.86,
      "carbs": 4.67,
      "fat": 0.42,
      "fiber": 3.2,
      "sodium": 20,
      "potassium": 384,
      "saturatedFat": 0.01
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "mustard-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mustard greens, raw",
        "release": "April 2018 (final)",
        "fdcId": 169256
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-mustard-greens-cooked-boiled-no-salt",
    "name": "Mustard Greens",
    "displayName": "Mustard Greens â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked mustard greens",
      "boiled mustard greens",
      "plain mustard greens"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "mustard-greens",
      "mustard-greens",
      "cooked",
      "boiled",
      "no-salt",
      "leafy-crucifer"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 26,
      "protein": 2.56,
      "carbs": 4.51,
      "fat": 0.47,
      "fiber": 2.0,
      "sodium": 9,
      "potassium": 162,
      "saturatedFat": 0.01
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "mustard-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mustard greens, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 169257
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-turnip-greens-raw",
    "name": "Turnip Greens",
    "displayName": "Turnip Greens â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "turnip greens",
      "raw turnip greens",
      "turnip leaves"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "turnip-greens",
      "turnip-greens",
      "raw",
      "leafy-crucifer"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 32,
      "protein": 1.5,
      "carbs": 7.13,
      "fat": 0.3,
      "fiber": 3.2,
      "sodium": 40,
      "potassium": 296,
      "saturatedFat": 0.039
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "turnip-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Turnip greens, raw",
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
      "brandSpecific": false,
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-turnip-greens-cooked-boiled-no-salt",
    "name": "Turnip Greens",
    "displayName": "Turnip Greens â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked turnip greens",
      "boiled turnip greens",
      "plain turnip greens"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "turnip-greens",
      "turnip-greens",
      "cooked",
      "boiled",
      "no-salt",
      "leafy-crucifer"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 20,
      "protein": 1.14,
      "carbs": 4.36,
      "fat": 0.23,
      "fiber": 3.5,
      "sodium": 29,
      "potassium": 203,
      "saturatedFat": 0.055
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "turnip-greens",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Turnip greens, cooked, boiled, drained, without salt",
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
      "brandSpecific": false,
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-bok-choy-raw",
    "name": "Bok Choy",
    "displayName": "Bok Choy â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "bok choy",
      "pak choi",
      "pak-choi",
      "Chinese cabbage",
      "raw bok choy"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "bok-choy",
      "bok-choy",
      "pak-choi",
      "raw",
      "leafy-crucifer"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 13,
      "protein": 1.5,
      "carbs": 2.18,
      "fat": 0.2,
      "fiber": 1.0,
      "sodium": 65,
      "potassium": 252,
      "saturatedFat": 0.027
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "bok-choy",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Cabbage, chinese (pak-choi), raw",
        "release": "April 2026",
        "sourceNote": "Cabbage, bok choy, raw is included in USDA Foundation Foods. Exact current Foundation FDC ID is intentionally omitted rather than inferred."
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-bok-choy-cooked-boiled-no-salt",
    "name": "Bok Choy",
    "displayName": "Bok Choy â Cooked, Boiled, No Salt",
    "category": "vegetable",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "cooked bok choy",
      "boiled bok choy",
      "cooked pak choi",
      "plain bok choy"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "bok-choy",
      "bok-choy",
      "pak-choi",
      "cooked",
      "boiled",
      "no-salt",
      "leafy-crucifer"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 12,
      "protein": 1.56,
      "carbs": 1.78,
      "fat": 0.16,
      "fiber": 1.0,
      "sodium": 34,
      "potassium": 371,
      "saturatedFat": 0.021
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "bok-choy",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cabbage, chinese (pak-choi), cooked, boiled, drained, without salt",
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
      "brandSpecific": false,
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-arugula-raw",
    "name": "Arugula",
    "displayName": "Arugula â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "arugula",
      "rocket",
      "rucola",
      "roquette",
      "baby arugula"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "arugula",
      "arugula",
      "rocket",
      "raw",
      "salad-green"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 25,
      "protein": 2.58,
      "carbs": 3.65,
      "fat": 0.66,
      "fiber": 1.6,
      "sodium": 27,
      "potassium": 369,
      "saturatedFat": 0.086
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "arugula",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Arugula, raw",
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
      "brandSpecific": false,
      "notes": "Baby arugula is treated as a search alias for raw arugula rather than a fabricated separate macro profile."
    }
  },
  {
    "id": "vegetable-watercress-raw",
    "name": "Watercress",
    "displayName": "Watercress â Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "watercress",
      "water cress",
      "raw watercress"
    ],
    "tags": [
      "vegetable",
      "cruciferous",
      "watercress",
      "watercress",
      "raw",
      "salad-green"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 11,
      "protein": 2.3,
      "carbs": 1.29,
      "fat": 0.1,
      "fiber": 0.5,
      "sodium": 41,
      "potassium": 330,
      "saturatedFat": 0.023
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
    "source": "AriFoodCruciferousVegetables",
    "verified": true,
    "metadata": {
      "foodFamily": "cruciferous-vegetable",
      "vegetableType": "watercress",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Watercress, raw",
        "release": "April 2018 (final)",
        "fdcId": 170068
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
      "notes": "Plain unbranded cruciferous vegetable reference. Added oil, butter, cheese, dressing, bacon, salt, broth, sauce, breading, or other recipe ingredients are not included."
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
            registry.remove(
              food.id
            );
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
      ARI_CRUCIFEROUS_VEGETABLE_FOODS,
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
        ARI_CRUCIFEROUS_VEGETABLE_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "broccoli",
        "cauliflower",
        "brussels-sprouts",
        "kale",
        "collards",
        "mustard-greens",
        "turnip-greens",
        "bok-choy",
        "arugula",
        "watercress"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} cruciferous-vegetable record(s).`,
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

  global.AriFoodCruciferousVegetables =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CRUCIFEROUS_VEGETABLE_FOODS.length;
      },

      getFoodIds() {
        return ARI_CRUCIFEROUS_VEGETABLE_FOODS.map(
          food => food.id
        );
      },

      getVegetableTypes() {
        return Array.from(
          new Set(
            ARI_CRUCIFEROUS_VEGETABLE_FOODS.map(
              food => food.metadata.vegetableType
            )
          )
        );
      },

      getRawRecords() {
        return ARI_CRUCIFEROUS_VEGETABLE_FOODS
          .filter(
            food => food.state === "raw"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_CRUCIFEROUS_VEGETABLE_FOODS
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
          ARI_CRUCIFEROUS_VEGETABLE_FOODS.find(
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
        "ari:food-cruciferous-vegetables-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_CRUCIFEROUS_VEGETABLE_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CRUCIFEROUS_VEGETABLE_FOODS.length} source-traceable cruciferous vegetable records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
