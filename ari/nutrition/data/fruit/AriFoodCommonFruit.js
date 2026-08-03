// =====================================================
// ARI REBIRTH
// File: AriFoodCommonFruit.js
// Version: 1.0.0
//
// Purpose:
//   Common whole-fruit reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Apple
//   - Banana
//   - Pear
//   - Red / green table grapes
//   - Green kiwi
//   - Pomegranate arils
//   - Japanese persimmon
//   - Fresh fig
//   - Guava
//   - Avocado
//
// Data policy:
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - Practical fruit-piece/cup servings preserved where
//     reliable USDA gram equivalents are available.
//   - No cultivar-specific nutrition unless separately
//     source-supported.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodCommonFruit(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCommonFruit";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first common whole-fruit reference module",
  "recordCount": 10,
  "foods": [
    "apple",
    "banana",
    "pear",
    "grapes",
    "green kiwi",
    "pomegranate arils",
    "Japanese persimmon",
    "fig",
    "guava",
    "avocado"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods when a current analytical fruit record is intentionally selected",
    "USDA FoodData Central SR Legacy for stable generic whole-fruit references",
    "USDA household/common-measure weights for practical piece and cup servings"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Household servings are gram-equivalent convenience entries and do not replace the canonical reference.",
    "Whole-fruit weights exclude non-edible refuse when USDA describes the serving as edible portion.",
    "Do not create cultivar-specific records unless cultivar-specific nutrition is independently source-supported.",
    "Do not merge dried, canned, cooked, sweetened, juiced, or syrup-packed fruit into raw whole-fruit records.",
    "Pomegranate values refer to edible arils.",
    "Avocado is owned by the fruit collection; do not duplicate it in vegetables.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_COMMON_FRUIT_FOODS =
    [
  {
    "id": "fruit-apple-raw-with-skin",
    "name": "Apple",
    "displayName": "Apple â Raw, With Skin",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "apple",
      "raw apple",
      "apple with skin",
      "fresh apple"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "apple"
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
      "protein": 0.26,
      "carbs": 13.81,
      "fat": 0.17,
      "fiber": 2.4,
      "sugar": 10.39,
      "saturatedFat": 0.028,
      "sodium": 1,
      "potassium": 107
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium apple",
        "amount": 1,
        "unit": "medium apple",
        "grams": 182,
        "isDefault": true
      },
      {
        "id": "1-small",
        "label": "1 small apple",
        "amount": 1,
        "unit": "small apple",
        "grams": 149,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large apple",
        "amount": 1,
        "unit": "large apple",
        "grams": 223,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "apple",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171688,
        "ndbNumber": "09003",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Generic raw apple with skin. Specific cultivar records such as Fuji, Gala, Granny Smith, Honeycrisp, and Red Delicious should be added separately when their current Foundation Food profiles are intentionally incorporated."
    }
  },
  {
    "id": "fruit-banana-raw",
    "name": "Banana",
    "displayName": "Banana â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "banana",
      "raw banana",
      "fresh banana",
      "ripe banana"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "banana"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 89,
      "protein": 1.09,
      "carbs": 22.84,
      "fat": 0.33,
      "fiber": 2.6,
      "sugar": 12.23,
      "saturatedFat": 0.112,
      "sodium": 1,
      "potassium": 358
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium banana",
        "amount": 1,
        "unit": "medium banana",
        "grams": 118,
        "isDefault": true
      },
      {
        "id": "1-small",
        "label": "1 small banana",
        "amount": 1,
        "unit": "small banana",
        "grams": 101,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large banana",
        "amount": 1,
        "unit": "large banana",
        "grams": 136,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "banana",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173944,
        "ndbNumber": "09040",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-pear-raw",
    "name": "Pear",
    "displayName": "Pear â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pear",
      "raw pear",
      "fresh pear"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "pear"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 57,
      "protein": 0.36,
      "carbs": 15.23,
      "fat": 0.14,
      "fiber": 3.1,
      "sugar": 9.75,
      "saturatedFat": 0.022,
      "sodium": 1,
      "potassium": 116
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium pear",
        "amount": 1,
        "unit": "medium pear",
        "grams": 178,
        "isDefault": true
      },
      {
        "id": "1-small",
        "label": "1 small pear",
        "amount": 1,
        "unit": "small pear",
        "grams": 148,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large pear",
        "amount": 1,
        "unit": "large pear",
        "grams": 230,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "pear",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169118,
        "ndbNumber": "09252",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-grapes-red-or-green-raw",
    "name": "Grapes",
    "displayName": "Grapes â Red or Green, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "grapes",
      "red grapes",
      "green grapes",
      "seedless grapes",
      "raw grapes",
      "fresh grapes"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "grapes"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 69,
      "protein": 0.72,
      "carbs": 18.1,
      "fat": 0.16,
      "fiber": 0.9,
      "sugar": 15.48,
      "saturatedFat": 0.054,
      "sodium": 2,
      "potassium": 191
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup grapes",
        "amount": 1,
        "unit": "cup",
        "grams": 151,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "grapes",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 174683,
        "ndbNumber": "09132",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "USDA SR Legacy combines common red and green European-type table grapes in this reference record."
    }
  },
  {
    "id": "fruit-kiwi-green-raw",
    "name": "Kiwi",
    "displayName": "Green Kiwifruit â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "kiwi",
      "kiwifruit",
      "green kiwi",
      "green kiwifruit",
      "raw kiwi"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "kiwi"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 61,
      "protein": 1.14,
      "carbs": 14.66,
      "fat": 0.52,
      "fiber": 3.0,
      "sugar": 8.99,
      "saturatedFat": 0.029,
      "sodium": 3,
      "potassium": 312
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 kiwi",
        "amount": 1,
        "unit": "kiwi",
        "grams": 69,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "kiwi",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 168153,
        "ndbNumber": "09148",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-pomegranate-arils-raw",
    "name": "Pomegranate",
    "displayName": "Pomegranate Arils â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pomegranate",
      "pomegranate arils",
      "pomegranate seeds",
      "raw pomegranate"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "pomegranate"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 83,
      "protein": 1.67,
      "carbs": 18.7,
      "fat": 1.17,
      "fiber": 4.0,
      "sugar": 13.67,
      "saturatedFat": 0.12,
      "sodium": 3,
      "potassium": 236
    },
    "servings": [
      {
        "id": "half-cup-arils",
        "label": "1/2 cup arils",
        "amount": 0.5,
        "unit": "cup",
        "grams": 87,
        "isDefault": true
      },
      {
        "id": "1-cup-arils",
        "label": "1 cup arils",
        "amount": 1,
        "unit": "cup",
        "grams": 174,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "pomegranate",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169134,
        "ndbNumber": "09286",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Nutrition and serving weights refer to the edible arils, not the whole fruit including rind and membrane."
    }
  },
  {
    "id": "fruit-persimmon-japanese-raw",
    "name": "Persimmon",
    "displayName": "Japanese Persimmon â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "persimmon",
      "Japanese persimmon",
      "kaki",
      "Fuyu persimmon",
      "Hachiya persimmon"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "persimmon"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 70,
      "protein": 0.58,
      "carbs": 18.6,
      "fat": 0.19,
      "fiber": 3.6,
      "sugar": 12.5,
      "saturatedFat": 0.02,
      "sodium": 1,
      "potassium": 161
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 persimmon",
        "amount": 1,
        "unit": "persimmon",
        "grams": 168,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "persimmon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169941,
        "ndbNumber": "09263",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "USDA reference is Japanese persimmon. Cultivar-specific records are not separated in this V1 common-fruit module."
    }
  },
  {
    "id": "fruit-fig-raw",
    "name": "Fig",
    "displayName": "Fig â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "fig",
      "fresh fig",
      "raw fig",
      "figs"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "fig"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 74,
      "protein": 0.75,
      "carbs": 19.18,
      "fat": 0.3,
      "fiber": 2.9,
      "sugar": 16.26,
      "saturatedFat": 0.06,
      "sodium": 1,
      "potassium": 232
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium fig",
        "amount": 1,
        "unit": "medium fig",
        "grams": 50,
        "isDefault": true
      },
      {
        "id": "1-large",
        "label": "1 large fig",
        "amount": 1,
        "unit": "large fig",
        "grams": 64,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "fig",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173021,
        "ndbNumber": "09089",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-guava-common-raw",
    "name": "Guava",
    "displayName": "Guava â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "guava",
      "common guava",
      "raw guava",
      "fresh guava"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "guava"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 68,
      "protein": 2.55,
      "carbs": 14.32,
      "fat": 0.95,
      "fiber": 5.4,
      "sugar": 8.92,
      "saturatedFat": 0.272,
      "sodium": 2,
      "potassium": 417
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 guava",
        "amount": 1,
        "unit": "guava",
        "grams": 55,
        "isDefault": true
      },
      {
        "id": "1-cup",
        "label": "1 cup guava",
        "amount": 1,
        "unit": "cup",
        "grams": 165,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "guava",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173044,
        "ndbNumber": "09139",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-avocado-raw",
    "name": "Avocado",
    "displayName": "Avocado â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "avocado",
      "raw avocado",
      "fresh avocado",
      "avocado flesh"
    ],
    "tags": [
      "fruit",
      "common-fruit",
      "raw",
      "avocado"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 160,
      "protein": 2.0,
      "carbs": 8.53,
      "fat": 14.66,
      "fiber": 6.7,
      "sugar": 0.66,
      "saturatedFat": 2.126,
      "sodium": 7,
      "potassium": 485
    },
    "servings": [
      {
        "id": "half-fruit",
        "label": "1/2 avocado",
        "amount": 0.5,
        "unit": "avocado",
        "grams": 100.5,
        "isDefault": true
      },
      {
        "id": "1-fruit",
        "label": "1 avocado",
        "amount": 1,
        "unit": "avocado",
        "grams": 201,
        "isDefault": false
      },
      {
        "id": "1-cup-cubed",
        "label": "1 cup cubed avocado",
        "amount": 1,
        "unit": "cup",
        "grams": 150,
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
    "source": "AriFoodCommonFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitType": "avocado",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171705,
        "ndbNumber": "09037",
        "verifiedAt": "2026-08-03"
      },
      "householdServingSource": "USDA SR Legacy common measures",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Kept in the fruit collection botanically and nutritionally. Culinary vegetable records such as tomato, pepper, cucumber, and squash remain owned by the vegetable collection to prevent duplicate ownership."
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

  function controllerExpectsThisModule() {
    if (!global.AriFoodFruit) {
      return false;
    }

    if (
      typeof global.AriFoodFruit.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodFruit.isExpectedModule(
          MODULE_NAME
        );
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(
      `[ARI Nutrition] ${MODULE_NAME}: ${message}`
    );

    if (
      global.AriFoodFruit &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodFruit.markModuleFailed === "function"
    ) {
      global.AriFoodFruit.markModuleFailed(
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
    reportFailure(
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
      ARI_COMMON_FRUIT_FOODS,
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
        ARI_COMMON_FRUIT_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "apple",
        "banana",
        "pear",
        "grapes",
        "kiwi",
        "pomegranate",
        "persimmon",
        "fig",
        "guava",
        "avocado"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} common-fruit record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodFruit &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodFruit.markModuleLoaded === "function"
  ) {
    global.AriFoodFruit.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodCommonFruit =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_COMMON_FRUIT_FOODS.length;
      },

      getFoodIds() {
        return ARI_COMMON_FRUIT_FOODS.map(
          food => food.id
        );
      },

      getFruitTypes() {
        return Array.from(
          new Set(
            ARI_COMMON_FRUIT_FOODS.map(
              food =>
                food.metadata.fruitType
            )
          )
        );
      },

      getByFruitType(fruitType) {
        const normalized =
          String(fruitType || "")
            .trim()
            .toLowerCase();

        return ARI_COMMON_FRUIT_FOODS
          .filter(
            food =>
              String(
                food.metadata?.fruitType || ""
              ).toLowerCase() === normalized
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
          ARI_COMMON_FRUIT_FOODS.find(
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
        "ari:food-common-fruit-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_COMMON_FRUIT_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_COMMON_FRUIT_FOODS.length} common whole-fruit records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
