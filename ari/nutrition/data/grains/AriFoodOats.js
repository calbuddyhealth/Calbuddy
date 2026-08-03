// =====================================================
// ARI REBIRTH
// File: AriFoodOats.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline oat reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Coverage:
//   - Plain dry oats
//   - Plain cooked oatmeal
//   - Plain fortified instant oats, dry
//   - Plain fortified instant oatmeal, prepared
//   - Oat bran, raw
//   - Oat bran, cooked
//
// Important:
//   - Dry oats and cooked oatmeal are never interchangeable.
//   - Rolled / old-fashioned / quick / steel-cut are searchable
//     through the plain dry-oat record instead of inventing
//     unsupported macro differences.
//   - Flavored packets and brands are excluded.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodOats(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodOats";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "displayNamingRule": "User-facing names stay plain and do not append the word generic.",
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact oat, oatmeal, instant oat, and oat-bran records",
    "USDA Foundation Foods used as a secondary provenance check where current records are incomplete for full macros",
    "Manufacturer label data reserved for later brand-specific oat products"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Never interchange dry oats and cooked oatmeal.",
    "Plain rolled, old-fashioned, quick, and steel-cut oats share the unbranded dry-oat reference unless a stronger exact composition record justifies separation.",
    "Do not fabricate separate macros merely because oats are cut or rolled differently.",
    "Keep fortified instant oats separate from ordinary plain dry oats.",
    "Keep oat bran separate from whole oats because its nutrient profile is materially different.",
    "Do not include flavored oatmeal packets, overnight-oat recipes, baked oats, granola, milk, fruit, sugar, syrup, nuts, seeds, or protein powder in base oat records.",
    "Brands will be handled later with manufacturer nutrition labels.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_OAT_FOODS =
    [
  {
    "id": "oats-plain-dry",
    "name": "Oats",
    "displayName": "Oats â Dry, Plain",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "oats",
      "rolled oats",
      "old fashioned oats",
      "old-fashioned oats",
      "quick oats",
      "quick cooking oats",
      "steel cut oats",
      "steel-cut oats",
      "irish oats",
      "oat groats",
      "plain oats",
      "dry oats"
    ],
    "tags": [
      "grain",
      "oats",
      "plain-dry",
      "rolled",
      "old-fashioned",
      "quick",
      "steel-cut",
      "plain",
      "whole-grain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 379,
      "protein": 13.15,
      "carbs": 67.7,
      "fat": 6.52,
      "fiber": 10.1,
      "sodium": 6,
      "potassium": 362,
      "saturatedFat": 1.11
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 40,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "plain-dry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cereals, oats, regular and quick, not fortified, dry",
        "release": "April 2018 (final)",
        "fdcId": 173904
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
      "notes": "USDA SR Legacy plain dry-oat reference. Rolled, old-fashioned, quick, and steel-cut oats are searchable aliases here because cutting/rolling primarily changes particle size and cooking time; ARI does not invent separate macro profiles without a better exact source. Branded oat products should later override this record with manufacturer label data."
    }
  },
  {
    "id": "oatmeal-plain-cooked-water-no-salt",
    "name": "Oatmeal",
    "displayName": "Oatmeal â Cooked with Water",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked with water",
    "aliases": [
      "oatmeal",
      "cooked oats",
      "plain oatmeal",
      "rolled oats cooked",
      "quick oats cooked",
      "steel cut oatmeal",
      "oats cooked in water"
    ],
    "tags": [
      "grain",
      "oats",
      "cooked-oatmeal",
      "cooked",
      "water",
      "no-salt",
      "plain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 71,
      "protein": 2.54,
      "carbs": 12.0,
      "fat": 1.52,
      "fiber": 1.7,
      "sodium": 4,
      "saturatedFat": 0.31
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 234,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 117,
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "cooked-oatmeal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt",
        "release": "April 2018 (final)",
        "fdcId": 173905,
        "ndbNumber": "08121"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Plain oatmeal prepared with water and no salt. Milk, plant milk, sugar, honey, syrup, fruit, nuts, seeds, protein powder, or other additions are separate ingredients."
    }
  },
  {
    "id": "oats-instant-fortified-plain-dry",
    "name": "Instant Oats",
    "displayName": "Instant Oats â Plain, Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "instant oats",
      "instant oatmeal plain",
      "plain instant oatmeal packet",
      "quick instant oats"
    ],
    "tags": [
      "grain",
      "oats",
      "instant",
      "instant",
      "fortified",
      "plain"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 362,
      "protein": 11.9,
      "carbs": 69.5,
      "fat": 6.9,
      "fiber": 10.0,
      "sodium": 220,
      "potassium": 366,
      "saturatedFat": 1.35
    },
    "servings": [
      {
        "id": "packet",
        "label": "1 plain packet",
        "amount": 1,
        "unit": "packet",
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "instant",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cereals, oats, instant, fortified, plain, dry",
        "release": "April 2018 (final)",
        "fdcId": 171661,
        "ndbNumber": "08122"
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
      "notes": "Plain fortified instant-oat reference. This is not a flavored packet. Cinnamon-spice, maple, apple, brown-sugar, protein, and other flavored instant oatmeals belong in branded or prepared-food layers."
    }
  },
  {
    "id": "oatmeal-instant-fortified-plain-water",
    "name": "Instant Oatmeal",
    "displayName": "Instant Oatmeal â Plain, Prepared with Water",
    "category": "grain",
    "state": "cooked",
    "preparation": "prepared with water",
    "aliases": [
      "instant oatmeal",
      "plain instant oatmeal",
      "instant oats cooked",
      "instant oatmeal with water"
    ],
    "tags": [
      "grain",
      "oats",
      "instant",
      "instant",
      "fortified",
      "prepared",
      "water",
      "plain"
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
      "protein": 2.37,
      "carbs": 11.7,
      "fat": 1.36,
      "fiber": 1.7,
      "sodium": 49,
      "potassium": 61,
      "saturatedFat": 0.226
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup prepared",
        "amount": 1,
        "unit": "cup",
        "grams": 234,
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "instant",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Cereals, oats, instant, fortified, plain, prepared with water (boiling water added or microwaved)",
        "release": "April 2018 (final)",
        "fdcId": 171662,
        "ndbNumber": "08123"
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
      "notes": "Plain fortified instant oatmeal prepared with water. Flavored packets are not included."
    }
  },
  {
    "id": "oat-bran-raw",
    "name": "Oat Bran",
    "displayName": "Oat Bran â Raw",
    "category": "grain",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "oat bran",
      "raw oat bran",
      "dry oat bran"
    ],
    "tags": [
      "grain",
      "oats",
      "oat-bran",
      "bran",
      "raw",
      "high-fiber"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 246,
      "protein": 17.3,
      "carbs": 66.22,
      "fat": 7.03,
      "fiber": 15.4,
      "sodium": 4,
      "potassium": 566
    },
    "servings": [
      {
        "id": "quarter-cup",
        "label": "1/4 cup",
        "amount": 0.25,
        "unit": "cup",
        "grams": 23.5,
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "oat-bran",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Oat bran, raw",
        "release": "April 2018 (final)",
        "fdcId": 168872
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
      "notes": "Unbranded USDA oat reference. Dry oats and prepared oatmeal are not interchangeable because water materially changes nutrient density per 100 g. Added milk, sugar, syrup, fruit, nuts, protein powder, butter, or other toppings are not included."
    }
  },
  {
    "id": "oat-bran-cooked",
    "name": "Oat Bran",
    "displayName": "Oat Bran â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "cooked oat bran",
      "oat bran cereal",
      "oat bran porridge"
    ],
    "tags": [
      "grain",
      "oats",
      "oat-bran",
      "bran",
      "cooked",
      "high-fiber"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 40,
      "protein": 3.21,
      "carbs": 11.44,
      "fat": 0.86,
      "fiber": 2.6,
      "sodium": 1,
      "potassium": 92
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 219,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 109.5,
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
    "source": "AriFoodOats",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "oatType": "oat-bran",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Oat bran, cooked",
        "release": "April 2018 (final)",
        "fdcId": 168873
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
      "notes": "Plain cooked oat-bran reference. Added milk, sweetener, fruit, protein powder, or toppings are not included."
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
      global.AriFoodGrains &&
      typeof global.AriFoodGrains.markModuleFailed === "function"
    ) {
      global.AriFoodGrains.markModuleFailed(
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

  if (
    !registry ||
    typeof registry.registerMany !== "function"
  ) {
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
    ARI_OAT_FOODS,
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
      foodCount: ARI_OAT_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "plain-dry",
        "cooked-oatmeal",
        "instant",
        "oat-bran"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} oat record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodGrains &&
    typeof global.AriFoodGrains.markModuleLoaded === "function"
  ) {
    global.AriFoodGrains.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodOats = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_OAT_FOODS.length;
    },

    getFoodIds() {
      return ARI_OAT_FOODS.map(food => food.id);
    },

    getOatTypes() {
      return Array.from(
        new Set(
          ARI_OAT_FOODS.map(food => food.metadata.oatType)
        )
      );
    },

    getDryRecords() {
      return ARI_OAT_FOODS
        .filter(food => food.state === "dry" || food.state === "raw")
        .map(clone);
    },

    getCookedRecords() {
      return ARI_OAT_FOODS
        .filter(food => food.state === "cooked")
        .map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();
      const record = ARI_OAT_FOODS.find(food => food.id === id);
      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-oats-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_OAT_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OAT_FOODS.length} source-traceable oat reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
