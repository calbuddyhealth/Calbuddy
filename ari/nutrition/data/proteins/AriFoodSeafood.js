// =====================================================
// ARI REBIRTH
// File: AriFoodSeafood.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline seafood reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Atlantic salmon
//   - Sockeye salmon
//   - Atlantic / Pacific cod
//   - Tilapia
//   - Mahi mahi
//   - Halibut
//   - Snapper
//   - Ahi / yellowfin tuna
//   - Canned light tuna
//   - Shrimp
//   - Snow crab
//   - Blue crab
//   - Lobster
//   - Sea / mixed scallops
//   - Squid / calamari
//   - Swordfish
//   - Chilean sea bass
//   - Sardines
//
// Reliability:
//   - USDA Foundation Foods first when a current
//     analytical generic record is available.
//   - USDA SR Legacy for exact cooked/canned references.
//   - Nutrition basis is 100 g edible portion.
//   - No fabricated fried/breaded/sauced values.
//   - No runtime internet connection is required.
//   - Source provenance is embedded in every record.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+ (recommended for tracking)
// =====================================================

(function initializeAriFoodSeafood(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSeafood";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytically sampled generic seafood when available",
    "USDA FoodData Central SR Legacy for exact cooked preparations, canned seafood, and established reference foods"
  ],
  "energyRule": "When a current Foundation record publishes both Atwater General and Atwater Specific energy, ARI uses the food-specific Atwater value as the primary calorie value and retains the general-factor value in source provenance.",
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw, cooked, canned, and frozen reference states distinct.",
    "Keep farm-raised and wild-caught salmon references distinct.",
    "Do not fabricate fried, breaded, battered, buttered, sauced, or restaurant seafood values from plain seafood.",
    "Use drained solids for canned seafood when the source description specifies drained solids.",
    "Tag crustaceans and mollusks as shellfish allergens; finfish records are tagged as fish allergens.",
    "Prefer weight-based logging because fillet, tail, crab-leg, scallop, and shrimp piece sizes vary.",
    "Preserve high sodium when the authoritative source indicates additives, processing, or naturally elevated sodium.",
    "Every record carries an auditable USDA source description; FDC/NDB identifiers are embedded only when confidently confirmed."
  ]
}
  );

  const ARI_SEAFOOD_FOODS =
    [
  {
    "id": "salmon-atlantic-farm-raised-raw",
    "name": "Atlantic Salmon",
    "displayName": "Atlantic Salmon â Farm Raised, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "salmon",
      "atlantic salmon",
      "farmed salmon",
      "farm raised salmon",
      "raw salmon"
    ],
    "tags": [
      "seafood",
      "salmon",
      "atlantic",
      "farm-raised"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 203,
      "protein": 20.3,
      "carbs": 0,
      "fat": 13.1,
      "sodium": 49.5,
      "potassium": 378.2,
      "saturatedFat": 2.277,
      "cholesterol": 62.1
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "salmon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Fish, salmon, Atlantic, farm raised, raw",
        "fdcId": 2684441,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 197
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
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "salmon-atlantic-farm-raised-cooked-dry-heat",
    "name": "Atlantic Salmon",
    "displayName": "Atlantic Salmon â Farmed, Cooked, Dry Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "dry heat",
    "aliases": [
      "cooked salmon",
      "baked atlantic salmon",
      "grilled atlantic salmon",
      "roasted atlantic salmon"
    ],
    "tags": [
      "seafood",
      "salmon",
      "atlantic",
      "farmed",
      "dry-heat"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 206,
      "protein": 22.1,
      "carbs": 0,
      "fat": 12.35,
      "potassium": 384,
      "saturatedFat": 2.397
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "salmon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, salmon, Atlantic, farmed, cooked, dry heat",
        "fdcId": 175168,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [
        "fish"
      ],
      "notes": "Use for plain dry-heat Atlantic farmed salmon. Baked, grilled, and roasted search aliases map here only when meaningful added oil, butter, glaze, or sauce is absent."
    }
  },
  {
    "id": "salmon-sockeye-wild-raw",
    "name": "Sockeye Salmon",
    "displayName": "Sockeye Salmon â Wild Caught, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "sockeye salmon",
      "wild salmon",
      "wild caught sockeye",
      "red salmon",
      "raw sockeye"
    ],
    "tags": [
      "seafood",
      "salmon",
      "sockeye",
      "wild-caught"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 136,
      "protein": 22.3,
      "carbs": 0,
      "fat": 4.94,
      "sodium": 53.3,
      "potassium": 329.7,
      "saturatedFat": 0.722,
      "cholesterol": 59.3
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "salmon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Fish, salmon, sockeye, wild caught, raw",
        "fdcId": 2684440,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 130
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
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "salmon-sockeye-wild-cooked-dry-heat",
    "name": "Sockeye Salmon",
    "displayName": "Sockeye Salmon â Cooked, Dry Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "dry heat",
    "aliases": [
      "cooked sockeye salmon",
      "baked sockeye salmon",
      "grilled sockeye",
      "roasted sockeye salmon"
    ],
    "tags": [
      "seafood",
      "salmon",
      "sockeye",
      "wild-caught",
      "dry-heat"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 156,
      "protein": 26.5,
      "carbs": 0,
      "fat": 5.6,
      "sodium": 92,
      "potassium": 436,
      "cholesterol": 61
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "salmon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, salmon, sockeye, cooked, dry heat",
        "fdcId": 173692,
        "release": "April 2018 (final)"
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
      "allergens": [
        "fish"
      ],
      "notes": "Use for plain dry-heat sockeye. Baked, grilled, and roasted aliases do not include added oil, butter, glaze, or sauce."
    }
  },
  {
    "id": "cod-atlantic-wild-raw",
    "name": "Atlantic Cod",
    "displayName": "Atlantic Cod â Wild Caught, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "cod",
      "atlantic cod",
      "wild cod",
      "raw cod"
    ],
    "tags": [
      "seafood",
      "cod",
      "atlantic",
      "wild-caught",
      "lean-fish"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 70.5,
      "protein": 16.1,
      "carbs": 0,
      "fat": 0.668,
      "sodium": 299,
      "potassium": 245,
      "saturatedFat": 0.044,
      "cholesterol": 47.4
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "cod",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Fish, cod, Atlantic, wild caught, raw",
        "fdcId": 2684444,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 66
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
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "cod-pacific-cooked-dry-heat",
    "name": "Pacific Cod",
    "displayName": "Pacific Cod â Cooked, Dry Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "dry heat",
    "aliases": [
      "pacific cod",
      "alaskan cod",
      "cooked cod",
      "baked cod",
      "grilled cod"
    ],
    "tags": [
      "seafood",
      "cod",
      "pacific",
      "alaskan",
      "dry-heat",
      "lean-fish"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 85,
      "protein": 18.7,
      "carbs": 0,
      "fat": 0.5,
      "sodium": 372,
      "potassium": 289,
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
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "cod",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, cod, Pacific, cooked, dry heat (may contain additives to retain moisture)",
        "fdcId": 171990,
        "release": "April 2018 (final)"
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
      "allergens": [
        "fish"
      ],
      "notes": "This USDA reference may include moisture-retaining additives, which can raise sodium. Prefer package-label data when a specific packaged cod product is known."
    }
  },
  {
    "id": "tilapia-farm-raised-raw",
    "name": "Tilapia",
    "displayName": "Tilapia â Farm Raised, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tilapia",
      "raw tilapia",
      "farm raised tilapia",
      "tilapia fillet"
    ],
    "tags": [
      "seafood",
      "tilapia",
      "farm-raised",
      "lean-fish"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 100,
      "protein": 19.0,
      "carbs": 0,
      "fat": 2.48,
      "sodium": 93.7,
      "potassium": 342.4,
      "saturatedFat": 0.647,
      "cholesterol": 47.6
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "tilapia",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Fish, tilapia, farm raised, raw",
        "fdcId": 2684442,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 94.7
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
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "tilapia-cooked-dry-heat",
    "name": "Tilapia",
    "displayName": "Tilapia â Cooked, Dry Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "dry heat",
    "aliases": [
      "cooked tilapia",
      "baked tilapia",
      "grilled tilapia",
      "roasted tilapia"
    ],
    "tags": [
      "seafood",
      "tilapia",
      "dry-heat",
      "lean-fish"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 128,
      "protein": 26.1,
      "carbs": 0,
      "fat": 2.6,
      "sodium": 56,
      "potassium": 380,
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
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "tilapia",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, tilapia, cooked, dry heat",
        "fdcId": 175177,
        "release": "April 2018 (final)"
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
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "mahi-mahi-wild-frozen-raw",
    "name": "Mahi Mahi",
    "displayName": "Mahi Mahi â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "mahi mahi",
      "mahi-mahi",
      "dolphinfish",
      "dorado fish",
      "wild mahi"
    ],
    "tags": [
      "seafood",
      "mahi-mahi",
      "wild-caught",
      "frozen",
      "lean-fish"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 83.7,
      "protein": 19.8,
      "carbs": 0.3,
      "fat": 0.4
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "mahi-mahi",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Mahi mahi, frozen, wild caught",
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general",
        "identifierNote": "Source description and nutrient profile verified; FDC ID intentionally omitted until directly confirmed from the USDA record."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "halibut-wild-frozen-raw",
    "name": "Halibut",
    "displayName": "Halibut â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "halibut",
      "wild halibut",
      "frozen halibut",
      "halibut fillet"
    ],
    "tags": [
      "seafood",
      "halibut",
      "wild-caught",
      "frozen",
      "lean-fish"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81.6,
      "protein": 19.06,
      "carbs": 0,
      "fat": 0.59,
      "sodium": 108.3,
      "potassium": 430.2
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "halibut",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Halibut, frozen, wild caught",
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general",
        "identifierNote": "Source description and nutrient profile verified; FDC ID intentionally omitted until directly confirmed from the USDA record."
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
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "snapper-wild-frozen-raw",
    "name": "Snapper",
    "displayName": "Snapper â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "snapper",
      "red snapper",
      "wild snapper",
      "frozen snapper"
    ],
    "tags": [
      "seafood",
      "snapper",
      "wild-caught",
      "frozen",
      "lean-fish"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 89.5,
      "protein": 20.7,
      "carbs": 0.441,
      "fat": 0.569,
      "sodium": 93.1
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "snapper",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Snapper, frozen, wild caught",
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general",
        "identifierNote": "Source description and nutrient profile verified; FDC ID intentionally omitted until directly confirmed from the USDA record."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium"
      ],
      "offlineReference": true,
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "tuna-ahi-yellowfin-wild-frozen-raw",
    "name": "Ahi / Yellowfin Tuna",
    "displayName": "Ahi / Yellowfin Tuna â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "ahi tuna",
      "yellowfin tuna",
      "tuna steak",
      "raw tuna",
      "wild tuna"
    ],
    "tags": [
      "seafood",
      "tuna",
      "ahi",
      "yellowfin",
      "wild-caught",
      "frozen"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 102,
      "protein": 24.7,
      "carbs": 0,
      "fat": 0.388,
      "sodium": 94.4,
      "potassium": 420
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "tuna",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Tuna, ahi or yellowfin, frozen, wild caught",
        "fdcId": 2747673,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "fish"
      ],
      "notes": "USDA carbohydrate-by-difference is slightly negative from analytical variation; ARI normalizes digestible carbohydrate to 0 g."
    }
  },
  {
    "id": "tuna-light-canned-water-drained",
    "name": "Light Tuna",
    "displayName": "Light Tuna â Canned in Water, Drained",
    "category": "protein",
    "state": "canned",
    "preparation": "canned in water",
    "aliases": [
      "canned tuna",
      "tuna in water",
      "light tuna",
      "drained tuna",
      "canned light tuna"
    ],
    "tags": [
      "seafood",
      "tuna",
      "canned",
      "water-packed",
      "drained"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 86,
      "protein": 19.4,
      "carbs": 0,
      "fat": 1.0
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "tuna",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, tuna, light, canned in water, drained solids",
        "fdcId": 173709,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "fish"
      ],
      "notes": "Use drained weight. Branded tuna can differ in sodium, species mix, packing liquid, and added ingredients; use the package label when available."
    }
  },
  {
    "id": "shrimp-farm-raised-raw",
    "name": "Shrimp",
    "displayName": "Shrimp â Farm Raised, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "shrimp",
      "raw shrimp",
      "farm raised shrimp",
      "prawns"
    ],
    "tags": [
      "seafood",
      "shrimp",
      "crustacean",
      "farm-raised"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 76,
      "protein": 15.6,
      "carbs": 0.48,
      "fat": 0.8,
      "sodium": 475,
      "potassium": 146,
      "cholesterol": 136
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "shrimp",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Crustaceans, shrimp, farm raised, raw",
        "fdcId": 2684443,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 71
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "shrimp-cooked-plain",
    "name": "Shrimp",
    "displayName": "Shrimp â Cooked, Plain",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "cooked shrimp",
      "boiled shrimp",
      "steamed shrimp",
      "plain shrimp",
      "prawns cooked"
    ],
    "tags": [
      "seafood",
      "shrimp",
      "crustacean",
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
      "calories": 99,
      "protein": 23.98,
      "carbs": 0.2,
      "fat": 0.28,
      "sodium": 111,
      "potassium": 259
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "shrimp",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Crustaceans, shrimp, cooked",
        "fdcId": 175180,
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Use for plain cooked shrimp without breading or sauce. Some commercial shrimp contains moisture-retaining sodium additives; use package-label data when known."
    }
  },
  {
    "id": "snow-crab-legs-frozen",
    "name": "Snow Crab",
    "displayName": "Snow Crab Legs â Frozen",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "snow crab",
      "snow crab legs",
      "crab legs",
      "frozen snow crab"
    ],
    "tags": [
      "seafood",
      "crab",
      "crustacean",
      "snow-crab",
      "frozen"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 69.2,
      "protein": 15.5,
      "carbs": 1.11,
      "fat": 0.294,
      "sodium": 728,
      "potassium": 193
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "crab",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Snow crab, legs only, frozen",
        "fdcId": 2747670,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "blue-crab-cooked-moist-heat",
    "name": "Blue Crab",
    "displayName": "Blue Crab â Cooked, Moist Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "moist heat",
    "aliases": [
      "blue crab",
      "cooked crab",
      "steamed crab",
      "boiled crab"
    ],
    "tags": [
      "seafood",
      "crab",
      "crustacean",
      "blue-crab",
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
      "calories": 97,
      "protein": 20.0,
      "carbs": 0,
      "fat": 1.9
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "crab",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Crustaceans, crab, blue, cooked, moist heat",
        "fdcId": 172986,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "lobster-tail-wild-frozen-raw",
    "name": "Lobster Tail",
    "displayName": "Lobster Tail â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "lobster",
      "lobster tail",
      "raw lobster tail",
      "frozen lobster tail"
    ],
    "tags": [
      "seafood",
      "lobster",
      "crustacean",
      "tail",
      "wild-caught",
      "frozen"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 58.8,
      "protein": 13.0,
      "carbs": 0.886,
      "fat": 0.367,
      "sodium": 509,
      "potassium": 213
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "lobster",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Lobster, tail only, frozen, wild caught",
        "fdcId": 2747657,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "lobster-northern-cooked-moist-heat",
    "name": "Lobster",
    "displayName": "Northern Lobster â Cooked, Moist Heat",
    "category": "protein",
    "state": "cooked",
    "preparation": "moist heat",
    "aliases": [
      "cooked lobster",
      "boiled lobster",
      "steamed lobster",
      "northern lobster"
    ],
    "tags": [
      "seafood",
      "lobster",
      "crustacean",
      "cooked"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 89,
      "protein": 19.0,
      "carbs": 0,
      "fat": 0.86,
      "saturatedFat": 0.208,
      "cholesterol": 146
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "lobster",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Crustaceans, lobster, northern, cooked, moist heat",
        "fdcId": 174209,
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "scallops-sea-wild-frozen",
    "name": "Sea Scallops",
    "displayName": "Sea Scallops â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "scallops",
      "sea scallops",
      "wild scallops",
      "frozen scallops"
    ],
    "tags": [
      "seafood",
      "scallop",
      "mollusk",
      "sea-scallop",
      "wild-caught",
      "frozen"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.4,
      "protein": 13.5,
      "carbs": 1.97,
      "fat": 0.493,
      "sodium": 313,
      "potassium": 244.9
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "scallop",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Scallops, sea, frozen, wild caught",
        "fdcId": 2747667,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "scallop-mixed-species-raw",
    "name": "Scallops",
    "displayName": "Scallops â Mixed Species, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "scallop",
      "scallops",
      "raw scallops",
      "bay scallops",
      "sea scallops raw"
    ],
    "tags": [
      "seafood",
      "scallop",
      "mollusk",
      "mixed-species"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 69,
      "protein": 12.1,
      "carbs": 3.18,
      "fat": 0.49,
      "saturatedFat": 0.128,
      "cholesterol": 24
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "scallop",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mollusks, scallop, mixed species, raw",
        "fdcId": 174220,
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
      "allergens": [
        "shellfish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "squid-calamari-frozen-tubes-raw",
    "name": "Squid / Calamari",
    "displayName": "Squid (Calamari) â Frozen Tubes",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "squid",
      "calamari",
      "calamari tubes",
      "raw calamari",
      "frozen squid"
    ],
    "tags": [
      "seafood",
      "squid",
      "mollusk",
      "calamari",
      "frozen"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 43.9,
      "protein": 8.81,
      "carbs": 0.932,
      "fat": 0.551,
      "sodium": 272,
      "potassium": 9.48
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "squid",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Squid (calamari), frozen, tubes only",
        "fdcId": 2747671,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "shellfish"
      ],
      "notes": "This current USDA Foundation record has unusually low measured potassium relative to some older squid references; ARI preserves the source value instead of silently substituting another profile."
    }
  },
  {
    "id": "swordfish-wild-frozen-raw",
    "name": "Swordfish",
    "displayName": "Swordfish â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "swordfish",
      "swordfish steak",
      "wild swordfish",
      "frozen swordfish"
    ],
    "tags": [
      "seafood",
      "swordfish",
      "wild-caught",
      "frozen"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 152,
      "protein": 19.2,
      "carbs": 0.45,
      "fat": 8.12,
      "sodium": 56.9,
      "potassium": 414
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "swordfish",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Swordfish, frozen, wild caught",
        "fdcId": 2747672,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "chilean-sea-bass-wild-frozen-raw",
    "name": "Chilean Sea Bass",
    "displayName": "Chilean Sea Bass â Frozen, Wild Caught",
    "category": "protein",
    "state": "raw",
    "preparation": "frozen",
    "aliases": [
      "chilean sea bass",
      "sea bass",
      "patagonian toothfish",
      "wild sea bass"
    ],
    "tags": [
      "seafood",
      "sea-bass",
      "chilean-sea-bass",
      "wild-caught",
      "frozen",
      "fatty-fish"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 209,
      "protein": 14.9,
      "carbs": 0.139,
      "fat": 16.6,
      "sodium": 109,
      "potassium": 236
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
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "sea-bass",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Sea bass, Chilean, frozen, wild caught",
        "fdcId": 2747668,
        "release": "December 2025 / April 2026 current Foundation set",
        "energyMethod": "Atwater general"
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
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
    }
  },
  {
    "id": "sardines-atlantic-canned-oil-drained-bone",
    "name": "Atlantic Sardines",
    "displayName": "Atlantic Sardines â Canned in Oil, Drained, With Bone",
    "category": "protein",
    "state": "canned",
    "preparation": "canned in oil",
    "aliases": [
      "sardines",
      "canned sardines",
      "sardines in oil",
      "atlantic sardines"
    ],
    "tags": [
      "seafood",
      "sardine",
      "canned",
      "oil-packed",
      "drained",
      "with-bone"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 208,
      "protein": 24.6,
      "carbs": 0,
      "fat": 11.4,
      "sodium": 307,
      "potassium": 397,
      "saturatedFat": 1.53,
      "cholesterol": 142
    },
    "servings": [
      {
        "id": "can-3-75-oz-drained",
        "label": "1 can (3.75 oz), drained",
        "amount": 1,
        "unit": "can",
        "grams": 92,
        "isDefault": true
      },
      {
        "id": "2-sardines",
        "label": "2 sardines",
        "amount": 2,
        "unit": "sardine",
        "grams": 24,
        "isDefault": false
      }
    ],
    "source": "AriFoodSeafood",
    "verified": true,
    "metadata": {
      "foodFamily": "sardine",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Fish, sardine, Atlantic, canned in oil, drained solids with bone",
        "fdcId": 175139,
        "ndbNumber": "15088",
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
      "allergens": [
        "fish"
      ],
      "notes": "Generic reference seafood value. Actual nutrition can vary by species, origin, wild/farmed status, moisture loss, processing, additives, retained liquid, added oil, breading, seasoning, sauce, or brand."
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

  // Clear stale seafood records from prior hot reloads.
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
      ARI_SEAFOOD_FOODS,
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
      foodCount: ARI_SEAFOOD_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "salmon",
        "white-fish",
        "tuna",
        "shrimp",
        "crab",
        "lobster",
        "scallops",
        "squid",
        "canned-fish"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} seafood record(s).`,
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

  global.AriFoodSeafood =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SEAFOOD_FOODS.length;
      },

      getFoodIds() {
        return ARI_SEAFOOD_FOODS.map(
          food => food.id
        );
      },

      getFamilies() {
        return Array.from(
          new Set(
            ARI_SEAFOOD_FOODS.map(
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
          ARI_SEAFOOD_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getShellfishRecords() {
        return ARI_SEAFOOD_FOODS
          .filter(
            food =>
              Array.isArray(food.metadata?.allergens) &&
              food.metadata.allergens.includes("shellfish")
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
        "ari:food-seafood-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_SEAFOOD_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SEAFOOD_FOODS.length} source-traceable seafood reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
