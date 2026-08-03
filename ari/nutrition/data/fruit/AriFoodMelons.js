// =====================================================
// ARI REBIRTH
// File: AriFoodMelons.js
// Version: 1.0.0
//
// Purpose:
//   Raw melon reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Watermelon
//   - Cantaloupe
//   - Honeydew
//
// Data policy:
//   - Generic-first raw whole fruit.
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - Practical USDA cup/wedge measures included.
//   - Complete stable profiles preferred over mixing
//     incomplete newer records with older datasets.
//   - Sweetened/canned/processed forms excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodMelons(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodMelons";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first raw melon reference module",
  "recordCount": 3,
  "melons": [
    "watermelon",
    "cantaloupe",
    "honeydew"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods when a current analytical melon record has a complete comparable profile",
    "USDA FoodData Central SR Legacy for stable complete raw-melon references",
    "USDA household/common-measure weights for practical cup and wedge servings"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Do not mix nutrient values from separate USDA datasets simply to fill missing fields.",
    "Use a complete stable SR Legacy profile when a newer Foundation record is incomplete for the nutrients ARI needs.",
    "Keep watermelon, cantaloupe, and honeydew separate.",
    "Do not map frozen sweetened melon, canned melon, syrup-packed melon, melon juice, or flavored melon products to raw melon records.",
    "Household measures are practical gram-equivalent servings and do not replace the canonical 100 g reference.",
    "Casaba, Canary, Galia, Crenshaw, Santa Claus, and other specialty melons can be added later as independent source-supported records.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_MELON_FOODS =
    [
  {
    "id": "fruit-watermelon-raw",
    "name": "Watermelon",
    "displayName": "Watermelon â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "watermelon",
      "raw watermelon",
      "fresh watermelon",
      "seedless watermelon",
      "watermelon flesh"
    ],
    "tags": [
      "fruit",
      "melon",
      "raw",
      "watermelon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 30,
      "protein": 0.61,
      "carbs": 7.55,
      "fat": 0.15,
      "fiber": 0.4,
      "sugar": 6.2,
      "saturatedFat": 0.016,
      "sodium": 1,
      "potassium": 112
    },
    "servings": [
      {
        "id": "1-cup-diced",
        "label": "1 cup diced watermelon",
        "amount": 1,
        "unit": "cup",
        "grams": 152,
        "isDefault": true
      },
      {
        "id": "1-wedge",
        "label": "1 watermelon wedge",
        "amount": 1,
        "unit": "wedge",
        "grams": 286,
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
    "source": "AriFoodMelons",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "melon",
      "melonType": "watermelon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 167765,
        "ndbNumber": "09326",
        "sourceDescription": "Watermelon, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
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
      "notes": "USDA added a newer Foundation Food record for seedless watermelon flesh in December 2025. That analytical record currently does not expose a complete comparable macronutrient profile in all public views, so ARI V1 retains the stable SR Legacy raw-watermelon profile rather than mixing nutrients across datasets."
    }
  },
  {
    "id": "fruit-cantaloupe-raw",
    "name": "Cantaloupe",
    "displayName": "Cantaloupe â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "cantaloupe",
      "rockmelon",
      "rock melon",
      "raw cantaloupe",
      "fresh cantaloupe",
      "cantaloupe melon"
    ],
    "tags": [
      "fruit",
      "melon",
      "raw",
      "cantaloupe"
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
      "protein": 0.84,
      "carbs": 8.16,
      "fat": 0.19,
      "fiber": 0.9,
      "sugar": 7.86,
      "saturatedFat": 0.051,
      "sodium": 16,
      "potassium": 267
    },
    "servings": [
      {
        "id": "1-cup-cubes",
        "label": "1 cup cantaloupe cubes",
        "amount": 1,
        "unit": "cup",
        "grams": 160,
        "isDefault": true
      },
      {
        "id": "1-cup-balls",
        "label": "1 cup cantaloupe balls",
        "amount": 1,
        "unit": "cup",
        "grams": 177,
        "isDefault": false
      },
      {
        "id": "1-medium-wedge",
        "label": "1 medium cantaloupe wedge",
        "amount": 1,
        "unit": "wedge",
        "grams": 69,
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
    "source": "AriFoodMelons",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "melon",
      "melonType": "cantaloupe",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169092,
        "ndbNumber": "09181",
        "sourceDescription": "Melons, cantaloupe, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
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
    "id": "fruit-honeydew-raw",
    "name": "Honeydew Melon",
    "displayName": "Honeydew Melon â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "honeydew",
      "honeydew melon",
      "raw honeydew",
      "fresh honeydew",
      "green melon"
    ],
    "tags": [
      "fruit",
      "melon",
      "raw",
      "honeydew"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 36,
      "protein": 0.54,
      "carbs": 9.09,
      "fat": 0.14,
      "fiber": 0.8,
      "sugar": 8.12,
      "saturatedFat": 0.038,
      "sodium": 18,
      "potassium": 228
    },
    "servings": [
      {
        "id": "1-cup-diced",
        "label": "1 cup diced honeydew",
        "amount": 1,
        "unit": "cup",
        "grams": 170,
        "isDefault": true
      },
      {
        "id": "1-cup-balls",
        "label": "1 cup honeydew balls",
        "amount": 1,
        "unit": "cup",
        "grams": 177,
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
    "source": "AriFoodMelons",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "melon",
      "melonType": "honeydew",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169911,
        "ndbNumber": "09184",
        "sourceDescription": "Melons, honeydew, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
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

  const registry = global.AriFoodRegistry;

  if (
    !registry ||
    typeof registry.registerMany !== "function"
  ) {
    reportFailure(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

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
      ARI_MELON_FOODS,
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
        ARI_MELON_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "watermelon",
        "cantaloupe",
        "honeydew"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} melon record(s).`,
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

  global.AriFoodMelons =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_MELON_FOODS.length;
      },

      getFoodIds() {
        return ARI_MELON_FOODS.map(
          food => food.id
        );
      },

      getMelonTypes() {
        return Array.from(
          new Set(
            ARI_MELON_FOODS.map(
              food =>
                food.metadata.melonType
            )
          )
        );
      },

      getByMelonType(melonType) {
        const normalized =
          String(melonType || "")
            .trim()
            .toLowerCase();

        return ARI_MELON_FOODS
          .filter(
            food =>
              String(
                food.metadata?.melonType || ""
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
          ARI_MELON_FOODS.find(
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
        "ari:food-melons-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_MELON_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_MELON_FOODS.length} raw melon records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
