// =====================================================
// ARI REBIRTH
// File: AriFoodBerries.js
// Version: 1.0.0
//
// Purpose:
//   Raw berry reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Strawberries
//   - Blueberries
//   - Raspberries
//   - Blackberries
//   - Cranberries
//   - Mulberries
//   - Gooseberries
//   - Red / white currants
//
// Data policy:
//   - Generic-first whole/raw berry records.
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - USDA household measures where reliable.
//   - Sweetened/dried/processed berry products excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodBerries(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBerries";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first raw berry reference module",
  "recordCount": 8,
  "berries": [
    "strawberry",
    "blueberry",
    "raspberry",
    "blackberry",
    "cranberry",
    "mulberry",
    "gooseberry",
    "red / white currant"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods when a current analytical berry record is intentionally adopted",
    "USDA FoodData Central SR Legacy for stable generic raw-berry references",
    "USDA common-measure weights for practical cup and fruit servings"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Keep raw berries separate from dried, cooked, canned, jammed, juiced, or sweetened forms.",
    "Do not infer one berry cultivar's composition for another cultivar without a specific source.",
    "Do not treat sweetened dried cranberries as raw cranberries.",
    "Do not treat Zante currants / dried currants as fresh red or white currants.",
    "Omit nutrients that are not confidently supported rather than inserting zero or inferred values.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BERRY_FOODS =
    [
  {
    "id": "fruit-strawberries-raw",
    "name": "Strawberries",
    "displayName": "Strawberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "strawberry",
      "strawberries",
      "fresh strawberries",
      "raw strawberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "strawberry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 32,
      "protein": 0.67,
      "carbs": 7.68,
      "fat": 0.3,
      "fiber": 2.0,
      "sugar": 4.89,
      "saturatedFat": 0.015,
      "sodium": 1,
      "potassium": 153
    },
    "servings": [
      {
        "id": "1-cup-halves",
        "label": "1 cup strawberry halves",
        "amount": 1,
        "unit": "cup",
        "grams": 152,
        "isDefault": true
      },
      {
        "id": "1-medium",
        "label": "1 medium strawberry",
        "amount": 1,
        "unit": "medium strawberry",
        "grams": 12,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large strawberry",
        "amount": 1,
        "unit": "large strawberry",
        "grams": 18,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "strawberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09316",
        "sourceDescription": "Strawberries, raw",
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
    "id": "fruit-blueberries-raw",
    "name": "Blueberries",
    "displayName": "Blueberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "blueberry",
      "blueberries",
      "fresh blueberries",
      "raw blueberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "blueberry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 57,
      "protein": 0.74,
      "carbs": 14.49,
      "fat": 0.33,
      "fiber": 2.4,
      "sugar": 9.96,
      "saturatedFat": 0.028,
      "sodium": 1,
      "potassium": 77
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup blueberries",
        "amount": 1,
        "unit": "cup",
        "grams": 148,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "blueberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09050",
        "sourceDescription": "Blueberries, raw",
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
    "id": "fruit-raspberries-raw",
    "name": "Raspberries",
    "displayName": "Raspberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "raspberry",
      "raspberries",
      "fresh raspberries",
      "raw raspberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "raspberry"
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
      "protein": 1.2,
      "carbs": 11.94,
      "fat": 0.65,
      "fiber": 6.5,
      "sugar": 4.42,
      "saturatedFat": 0.019,
      "sodium": 1,
      "potassium": 151
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup raspberries",
        "amount": 1,
        "unit": "cup",
        "grams": 123,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "raspberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09302",
        "sourceDescription": "Raspberries, raw",
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
    "id": "fruit-blackberries-raw",
    "name": "Blackberries",
    "displayName": "Blackberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "blackberry",
      "blackberries",
      "fresh blackberries",
      "raw blackberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "blackberry"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 43,
      "protein": 1.39,
      "carbs": 9.61,
      "fat": 0.49,
      "fiber": 5.3,
      "sugar": 4.88,
      "saturatedFat": 0.014,
      "sodium": 1,
      "potassium": 162
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup blackberries",
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "blackberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09042",
        "sourceDescription": "Blackberries, raw",
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
      "notes": "FoodData Central currently also carries a Foundation Food blackberry record. This V1 module keeps the stable SR Legacy profile while retaining the same raw-food identity."
    }
  },
  {
    "id": "fruit-cranberries-raw",
    "name": "Cranberries",
    "displayName": "Cranberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "cranberry",
      "cranberries",
      "fresh cranberries",
      "raw cranberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "cranberry"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 46,
      "protein": 0.46,
      "carbs": 11.97,
      "fat": 0.13,
      "fiber": 3.6,
      "sugar": 4.27,
      "saturatedFat": 0.011,
      "sodium": 2,
      "potassium": 80
    },
    "servings": [
      {
        "id": "1-cup-whole",
        "label": "1 cup whole cranberries",
        "amount": 1,
        "unit": "cup",
        "grams": 100,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "cranberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09078",
        "sourceDescription": "Cranberries, raw",
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
      "notes": "Do not use this record for dried sweetened cranberries, cranberry sauce, juice cocktail, or other sweetened cranberry products."
    }
  },
  {
    "id": "fruit-mulberries-raw",
    "name": "Mulberries",
    "displayName": "Mulberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "mulberry",
      "mulberries",
      "fresh mulberries",
      "raw mulberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "mulberry"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 43,
      "protein": 1.44,
      "carbs": 9.8,
      "fat": 0.39,
      "fiber": 1.7,
      "sugar": 8.1,
      "saturatedFat": 0.027,
      "sodium": 10,
      "potassium": 194
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup mulberries",
        "amount": 1,
        "unit": "cup",
        "grams": 140,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "mulberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09190",
        "sourceDescription": "Mulberries, raw",
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
    "id": "fruit-gooseberries-raw",
    "name": "Gooseberries",
    "displayName": "Gooseberries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "gooseberry",
      "gooseberries",
      "fresh gooseberries",
      "raw gooseberries"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "gooseberry"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 44,
      "protein": 0.88,
      "carbs": 10.18,
      "fat": 0.58,
      "fiber": 4.3,
      "saturatedFat": 0.038,
      "sodium": 1,
      "potassium": 198
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup gooseberries",
        "amount": 1,
        "unit": "cup",
        "grams": 150,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "gooseberry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09107",
        "sourceDescription": "Gooseberries, raw",
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
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Total sugars are intentionally omitted because this module only preserves nutrients confidently retained from the selected reference profile."
    }
  },
  {
    "id": "fruit-currants-red-white-raw",
    "name": "Red and White Currants",
    "displayName": "Currants â Red and White, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red currants",
      "white currants",
      "currants",
      "fresh currants",
      "raw currants"
    ],
    "tags": [
      "fruit",
      "berries",
      "raw",
      "currant-red-white"
    ],
    "popularity": 85,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 56,
      "protein": 1.4,
      "carbs": 13.8,
      "fat": 0.2,
      "fiber": 4.3,
      "sugar": 7.37,
      "saturatedFat": 0.017,
      "sodium": 1,
      "potassium": 275
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup currants",
        "amount": 1,
        "unit": "cup",
        "grams": 112,
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
    "source": "AriFoodBerries",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "berry",
      "berryType": "currant-red-white",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "ndbNumber": "09084",
        "sourceDescription": "Currants, red and white, raw",
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
      "notes": "This record refers to red and white currant fruit. It is not the same as dried Zante currants, which belong in AriFoodDriedFruit."
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
      ARI_BERRY_FOODS,
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
        ARI_BERRY_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "strawberry",
        "blueberry",
        "raspberry",
        "blackberry",
        "cranberry",
        "mulberry",
        "gooseberry",
        "currant-red-white"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} berry record(s).`,
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

  global.AriFoodBerries =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_BERRY_FOODS.length;
      },

      getFoodIds() {
        return ARI_BERRY_FOODS.map(
          food => food.id
        );
      },

      getBerryTypes() {
        return Array.from(
          new Set(
            ARI_BERRY_FOODS.map(
              food =>
                food.metadata.berryType
            )
          )
        );
      },

      getByBerryType(berryType) {
        const normalized =
          String(berryType || "")
            .trim()
            .toLowerCase();

        return ARI_BERRY_FOODS
          .filter(
            food =>
              String(
                food.metadata?.berryType || ""
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
          ARI_BERRY_FOODS.find(
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
        "ari:food-berries-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_BERRY_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BERRY_FOODS.length} raw berry records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
