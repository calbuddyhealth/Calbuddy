// =====================================================
// ARI REBIRTH
// File: AriFoodDairyCore.js
// Version: 1.0.0
//
// Purpose:
//   Small generic fallback backbone for ARI Nutrition's
//   brand-first dairy collection.
//
// Collection:
//   AriFoodDairy
//
// Coverage:
//   - 4 milk fat levels
//   - 4 plain yogurt / Greek yogurt references
//   - 11 common generic cheese references
//   - Heavy cream, half-and-half, sour cream
//   - Salted, unsalted, and clarified butter
//
// Brand-first rule:
//   These are FALLBACK records. When a user specifies
//   Fairlife, Chobani, Fage, Tillamook, Sargento,
//   Philadelphia, etc., ARI should use the exact branded
//   product record instead.
//
// Reliability:
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodDairyCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodDairyCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "small generic fallback backbone for a brand-first dairy collection",
  "recordCount": 25,
  "brandFirstRules": [
    "If a user specifies a brand and a matching branded product exists, use the branded record instead of DairyCore.",
    "Do not map lactose-free, ultra-filtered, high-protein, flavored, sweetened, or specialty dairy products to generic core records when the product is known.",
    "Do not treat processed cheese slices as generic cheddar.",
    "Do not treat flavored or sweetened yogurt as plain yogurt.",
    "Do not treat whipped or spreadable butter as standard stick butter.",
    "Branded products must preserve exact package-label serving information and normalize to 100 g."
  ],
  "sourceHierarchy": [
    "USDA FoodData Central SR Legacy for stable generic dairy references",
    "USDA Foundation Foods when a current analytical generic record is deliberately selected",
    "Manufacturer/package labels for branded products in separate brand modules"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Household servings are convenience conversions and do not replace the canonical 100 g reference.",
    "Keep materially different milk-fat levels separate.",
    "Keep Greek and conventional yogurt separate.",
    "Keep distinct cheese styles separate.",
    "Keep salted and unsalted butter separate because sodium differs materially.",
    "Clarified butter uses USDA butter oil / anhydrous milk fat only as a generic fallback.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_DAIRY_CORE_FOODS =
    [
  {
    "id": "dairy-milk-whole-3-25",
    "name": "Whole Milk",
    "displayName": "Whole Milk â 3.25% Milkfat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "whole milk",
      "full fat milk",
      "3.25% milk",
      "whole cow milk"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "milk",
      "whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 61,
      "protein": 3.15,
      "carbs": 4.8,
      "fat": 3.25,
      "fiber": 0,
      "sugar": 5.05,
      "saturatedFat": 1.865,
      "sodium": 43,
      "potassium": 132,
      "cholesterol": 10
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 244,
        "milliliters": 240,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "subtype": "whole",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Milk, whole, 3.25% milkfat, with added vitamin D",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171265
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-milk-reduced-fat-2-percent",
    "name": "2% Milk",
    "displayName": "Milk â 2% Reduced Fat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "2% milk",
      "2 percent milk",
      "reduced fat milk",
      "two percent milk"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "milk",
      "2-percent"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 51,
      "protein": 3.48,
      "carbs": 4.97,
      "fat": 1.92,
      "fiber": 0,
      "sodium": 52
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 244,
        "milliliters": 240,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "subtype": "2-percent",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Milk, reduced fat, fluid, 2% milkfat, with added nonfat milk solids and vitamin A and vitamin D",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170870
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-milk-lowfat-1-percent",
    "name": "1% Milk",
    "displayName": "Milk â 1% Lowfat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "1% milk",
      "1 percent milk",
      "lowfat milk",
      "low fat milk"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "milk",
      "1-percent"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 42,
      "protein": 3.37,
      "carbs": 4.99,
      "fat": 0.97,
      "fiber": 0,
      "sodium": 44,
      "potassium": 150
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 244,
        "milliliters": 240,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "subtype": "1-percent",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170872
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-milk-skim-nonfat",
    "name": "Skim Milk",
    "displayName": "Milk â Skim / Nonfat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "skim milk",
      "nonfat milk",
      "fat free milk",
      "0% milk"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "milk",
      "nonfat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 37,
      "protein": 3.57,
      "carbs": 5.02,
      "fat": 0.25,
      "fiber": 0,
      "sodium": 53,
      "potassium": 171
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 245,
        "milliliters": 240,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "subtype": "nonfat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Milk, nonfat, fluid, with added nonfat milk solids, vitamin A and vitamin D (fat free or skim)",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171270
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-yogurt-plain-whole-milk",
    "name": "Plain Whole-Milk Yogurt",
    "displayName": "Plain Yogurt â Whole Milk",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "plain whole milk yogurt",
      "whole milk yogurt",
      "full fat yogurt"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "yogurt",
      "plain-whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 61,
      "protein": 3.47,
      "carbs": 4.66,
      "fat": 3.25,
      "fiber": 0,
      "sodium": 46,
      "potassium": 155
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 245,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "subtype": "plain-whole",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yogurt, plain, whole milk",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171284
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-yogurt-plain-lowfat",
    "name": "Plain Low-Fat Yogurt",
    "displayName": "Plain Yogurt â Low Fat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "plain low fat yogurt",
      "plain lowfat yogurt",
      "low fat yogurt"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "yogurt",
      "plain-lowfat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 63,
      "protein": 5.25,
      "carbs": 7.04,
      "fat": 1.55,
      "fiber": 0,
      "sugar": 7.04,
      "sodium": 70,
      "potassium": 234
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 245,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "subtype": "plain-lowfat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yogurt, plain, low fat",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170886
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-yogurt-greek-plain-whole",
    "name": "Plain Greek Yogurt",
    "displayName": "Greek Yogurt â Plain, Whole Milk",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "plain Greek yogurt",
      "whole milk Greek yogurt",
      "full fat Greek yogurt"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "yogurt",
      "greek-whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 97,
      "protein": 9.0,
      "carbs": 3.98,
      "fat": 5.0,
      "fiber": 0,
      "sugar": 4.0,
      "saturatedFat": 2.4,
      "sodium": 35,
      "potassium": 141,
      "cholesterol": 13
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 245,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "subtype": "greek-whole",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yogurt, Greek, plain, whole milk",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171304
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-yogurt-greek-plain-nonfat",
    "name": "Nonfat Greek Yogurt",
    "displayName": "Greek Yogurt â Plain, Nonfat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "nonfat Greek yogurt",
      "fat free Greek yogurt",
      "0% Greek yogurt"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "yogurt",
      "greek-nonfat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 59,
      "protein": 10.19,
      "carbs": 3.6,
      "fat": 0.39,
      "fiber": 0,
      "sodium": 36
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "grams": 245,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "subtype": "greek-nonfat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Yogurt, Greek, plain, nonfat",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170894
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-cheddar",
    "name": "Cheddar Cheese",
    "displayName": "Cheddar Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "cheddar",
      "cheddar cheese",
      "sharp cheddar",
      "mild cheddar"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "cheddar"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 403,
      "protein": 22.87,
      "carbs": 3.37,
      "fat": 33.31,
      "fiber": 0,
      "sugar": 0.48,
      "saturatedFat": 18.87,
      "sodium": 653,
      "potassium": 76,
      "cholesterol": 99
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "cheddar",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, cheddar",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173414
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-mozzarella-whole-low-moisture",
    "name": "Mozzarella Cheese",
    "displayName": "Mozzarella â Whole Milk, Low Moisture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "mozzarella",
      "mozzarella cheese",
      "whole milk mozzarella",
      "low moisture mozzarella"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "mozzarella-whole-low-moisture"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 318,
      "protein": 21.6,
      "carbs": 2.47,
      "fat": 24.64,
      "fiber": 0,
      "sodium": 710,
      "potassium": 75
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "mozzarella-whole-low-moisture",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, mozzarella, whole milk, low moisture",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170846
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-parmesan-grated",
    "name": "Parmesan Cheese",
    "displayName": "Parmesan Cheese â Grated",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "parmesan",
      "parmesan cheese",
      "grated parmesan"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "parmesan-grated"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 420,
      "protein": 28.42,
      "carbs": 13.91,
      "fat": 27.84,
      "fiber": 0,
      "sodium": 1804,
      "potassium": 180
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "parmesan-grated",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, parmesan, grated",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171247
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-swiss",
    "name": "Swiss Cheese",
    "displayName": "Swiss Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "Swiss cheese",
      "Swiss",
      "emmental style cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "swiss"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 393,
      "protein": 26.96,
      "carbs": 1.44,
      "fat": 30.99,
      "fiber": 0,
      "saturatedFat": 18.227,
      "sodium": 187,
      "potassium": 72
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "swiss",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, swiss",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-provolone",
    "name": "Provolone Cheese",
    "displayName": "Provolone Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "provolone",
      "provolone cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "provolone"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 351,
      "protein": 25.58,
      "carbs": 2.14,
      "fat": 26.62,
      "fiber": 0,
      "sugar": 0.56,
      "saturatedFat": 17.08,
      "sodium": 727,
      "potassium": 138,
      "cholesterol": 69
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "provolone",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, provolone",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170850
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-monterey-jack",
    "name": "Monterey Jack Cheese",
    "displayName": "Monterey Jack Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "Monterey Jack",
      "Monterey Jack cheese",
      "Jack cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "monterey-jack"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 373,
      "protein": 24.48,
      "carbs": 0.68,
      "fat": 30.28,
      "fiber": 0,
      "sugar": 0.5,
      "saturatedFat": 19.066,
      "sodium": 600,
      "potassium": 81,
      "cholesterol": 89
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "monterey-jack",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, monterey",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-gouda",
    "name": "Gouda Cheese",
    "displayName": "Gouda Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "Gouda",
      "Gouda cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "gouda"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 356,
      "protein": 24.94,
      "carbs": 2.22,
      "fat": 27.44,
      "fiber": 0,
      "sugar": 2.22,
      "saturatedFat": 17.6,
      "sodium": 819,
      "potassium": 121,
      "cholesterol": 114
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "gouda",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, gouda",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171241
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-feta",
    "name": "Feta Cheese",
    "displayName": "Feta Cheese",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "feta",
      "feta cheese",
      "crumbled feta"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "feta"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 265,
      "protein": 14.21,
      "carbs": 3.88,
      "fat": 21.49,
      "fiber": 0,
      "sodium": 1139,
      "potassium": 62
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "feta",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, feta",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173420
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-ricotta-whole-milk",
    "name": "Ricotta Cheese",
    "displayName": "Ricotta Cheese â Whole Milk",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "ricotta",
      "ricotta cheese",
      "whole milk ricotta"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "ricotta-whole"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 150,
      "protein": 7.54,
      "carbs": 7.27,
      "fat": 10.18,
      "fiber": 0,
      "sodium": 110,
      "potassium": 219
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "ricotta-whole",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, ricotta, whole milk",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170851
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-cottage-full-fat",
    "name": "Cottage Cheese",
    "displayName": "Cottage Cheese â Full Fat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "cottage cheese",
      "full fat cottage cheese",
      "creamed cottage cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "cottage-full-fat"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 98,
      "protein": 11.12,
      "carbs": 3.38,
      "fat": 4.3,
      "fiber": 0
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "cottage-full-fat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, cottage, creamed, large or small curd",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 172179
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cheese-cream-full-fat",
    "name": "Cream Cheese",
    "displayName": "Cream Cheese â Full Fat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "cream cheese",
      "full fat cream cheese",
      "regular cream cheese"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cheese",
      "cream-cheese-full-fat"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 350,
      "protein": 6.15,
      "carbs": 5.52,
      "fat": 34.44,
      "fiber": 0,
      "sodium": 314,
      "potassium": 132
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "subtype": "cream-cheese-full-fat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cheese, cream",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173418
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cream-heavy-whipping",
    "name": "Heavy Cream",
    "displayName": "Heavy Whipping Cream",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "heavy cream",
      "heavy whipping cream",
      "whipping cream"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cream",
      "heavy-whipping"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 340,
      "protein": 2.84,
      "carbs": 2.84,
      "fat": 36.08,
      "fiber": 0,
      "sodium": 27,
      "potassium": 95
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 15,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cream",
      "subtype": "heavy-whipping",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cream, fluid, heavy whipping",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 170859
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cream-half-and-half",
    "name": "Half-and-Half",
    "displayName": "Half-and-Half Cream",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "half and half",
      "half-and-half",
      "half & half",
      "coffee cream"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cream",
      "half-and-half"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 131,
      "protein": 3.13,
      "carbs": 4.3,
      "fat": 11.5,
      "fiber": 0,
      "sodium": 61,
      "potassium": 132
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 15,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cream",
      "subtype": "half-and-half",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cream, fluid, half and half",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171255
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
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-cream-sour-full-fat",
    "name": "Sour Cream",
    "displayName": "Sour Cream â Full Fat",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "sour cream",
      "full fat sour cream",
      "regular sour cream"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "cream",
      "sour-cream-full-fat"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 198,
      "protein": 2.44,
      "carbs": 4.63,
      "fat": 19.4,
      "fiber": 0,
      "sugar": 3.41,
      "saturatedFat": 10.1,
      "sodium": 31,
      "potassium": 125,
      "cholesterol": 59
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 12,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cream",
      "subtype": "sour-cream-full-fat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cream, sour, cultured",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 171257
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-butter-salted",
    "name": "Salted Butter",
    "displayName": "Butter â Salted",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "salted butter",
      "butter salted",
      "regular salted butter"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "butter",
      "salted"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.85,
      "carbs": 0.06,
      "fat": 81.11,
      "fiber": 0,
      "saturatedFat": 50.49,
      "sodium": 643,
      "potassium": 24
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14.2,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "butter",
      "subtype": "salted",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Butter, salted",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173410
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-butter-unsalted",
    "name": "Unsalted Butter",
    "displayName": "Butter â Unsalted",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "unsalted butter",
      "butter without salt",
      "sweet cream butter unsalted"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "butter",
      "unsalted"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.85,
      "carbs": 0.06,
      "fat": 81.11,
      "fiber": 0,
      "saturatedFat": 49.12,
      "sodium": 11,
      "potassium": 24
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14.2,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "butter",
      "subtype": "unsalted",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Butter, without salt",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173430
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
    }
  },
  {
    "id": "dairy-butter-clarified-anhydrous",
    "name": "Clarified Butter",
    "displayName": "Clarified Butter / Butter Oil",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "plain",
    "aliases": [
      "clarified butter",
      "butter oil",
      "anhydrous butter oil",
      "ghee generic",
      "generic ghee"
    ],
    "tags": [
      "dairy",
      "dairy-core",
      "butter",
      "clarified"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 876,
      "protein": 0.28,
      "carbs": 0,
      "fat": 99.48,
      "fiber": 0,
      "saturatedFat": 61.92,
      "sodium": 2,
      "potassium": 5,
      "cholesterol": 256
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13,
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
    "source": "AriFoodDairyCore",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "butter",
      "subtype": "clarified",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Butter oil, anhydrous",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "fdcId": 173412,
        "sourceNote": "USDA butter oil / anhydrous milk fat; use only as a generic clarified-butter fallback. Branded ghee should use its package label."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "saturatedFat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "fallbackRecord": true,
      "usagePolicy": "Use as a generic fallback only when the user does not specify a brand or when no matching branded dairy product is available."
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
    if (!global.AriFoodDairy) {
      return false;
    }

    if (typeof global.AriFoodDairy.isExpectedModule === "function") {
      try {
        return global.AriFoodDairy.isExpectedModule(MODULE_NAME);
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

    if (
      global.AriFoodDairy &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodDairy.markModuleFailed === "function"
    ) {
      global.AriFoodDairy.markModuleFailed(
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
    reportFailure("AriFoodRegistry.registerMany() is unavailable.");
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
    ARI_DAIRY_CORE_FOODS,
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
      foodCount: ARI_DAIRY_CORE_FOODS.length,
      fallbackRecordCount: ARI_DAIRY_CORE_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: ["milk","yogurt","cheese","cream","butter"]
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} dairy-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodDairy &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodDairy.markModuleLoaded === "function"
  ) {
    global.AriFoodDairy.markModuleLoaded(MODULE_NAME, moduleResult);
  } else if (global.AriFoodDairy) {
    console.warn(
      `[ARI Nutrition] ${MODULE_NAME} registered successfully, but the current AriFoodDairy controller does not list it as expected.`
    );
  }

  global.AriFoodDairyCore = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_DAIRY_CORE_FOODS.length;
    },

    getFoodIds() {
      return ARI_DAIRY_CORE_FOODS.map(food => food.id);
    },

    getDairyTypes() {
      return Array.from(
        new Set(
          ARI_DAIRY_CORE_FOODS.map(food => food.metadata.dairyType)
        )
      );
    },

    getByDairyType(dairyType) {
      const normalized = String(dairyType || "").trim().toLowerCase();

      return ARI_DAIRY_CORE_FOODS
        .filter(
          food =>
            String(food.metadata?.dairyType || "").toLowerCase() === normalized
        )
        .map(clone);
    },

    getFallbackRecords() {
      return ARI_DAIRY_CORE_FOODS.map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();
      const record = ARI_DAIRY_CORE_FOODS.find(food => food.id === id);
      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    },

    getIntegrationStatus() {
      return {
        dairyControllerAvailable: Boolean(global.AriFoodDairy),
        expectedByCurrentDairyController: controllerExpectsThisModule(),
        foodCount: ARI_DAIRY_CORE_FOODS.length
      };
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-dairy-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_DAIRY_CORE_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_DAIRY_CORE_FOODS.length} generic dairy fallback records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
