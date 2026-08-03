// =====================================================
// ARI REBIRTH
// File: AriFoodCitrus.js
// Version: 1.0.0
//
// Purpose:
//   Raw citrus reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Orange
//   - Mandarin
//   - Clementine
//   - Pink / red grapefruit
//   - Lemon
//   - Lime
//   - Pomelo / pummelo
//
// Data policy:
//   - Generic-first whole/raw citrus.
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - Current Foundation data preferred deliberately.
//   - Food-specific Atwater energy preferred when supplied.
//   - Juice, marmalade, peel, sweetened/canned forms excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodCitrus(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCitrus";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first raw citrus reference module",
  "recordCount": 7,
  "citrus": [
    "orange",
    "mandarin",
    "clementine",
    "pink / red grapefruit",
    "lemon",
    "lime",
    "pomelo / pummelo"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods when a current analytical citrus record is deliberately selected",
    "USDA FoodData Central SR Legacy for stable generic raw citrus references",
    "USDA household/common-measure weights for practical whole-fruit and cup servings"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Prefer food-specific Atwater energy for current Foundation records when both specific and general values are published.",
    "Preserve alternate general-factor energy in source provenance when applicable.",
    "Keep mandarin and clementine separately searchable because users commonly identify them separately.",
    "Do not map juice, bottled juice, marmalade, candied peel, sweetened cups, canned citrus, or syrup-packed citrus to raw whole-fruit records.",
    "Do not invent missing sugar, saturated-fat, or micronutrient values.",
    "Keep grapefruit varieties separate if future profiles show materially different nutrition and ARI needs cultivar-level logging.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CITRUS_FOODS =
    [
  {
    "id": "fruit-orange-raw",
    "name": "Orange",
    "displayName": "Orange â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "orange",
      "oranges",
      "raw orange",
      "fresh orange",
      "navel orange",
      "valencia orange"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "orange"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 47,
      "protein": 0.94,
      "carbs": 11.75,
      "fat": 0.12,
      "fiber": 2.4,
      "sugar": 9.35,
      "saturatedFat": 0.015,
      "sodium": 0,
      "potassium": 181
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium orange",
        "amount": 1,
        "unit": "medium orange",
        "grams": 131,
        "isDefault": true
      },
      {
        "id": "1-small",
        "label": "1 small orange",
        "amount": 1,
        "unit": "small orange",
        "grams": 96,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large orange",
        "amount": 1,
        "unit": "large orange",
        "grams": 184,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "orange",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Oranges, raw, all commercial varieties",
        "verifiedAt": "2026-08-03",
        "fdcId": 169097,
        "ndbNumber": "09200",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "Generic commercial orange fallback. Cultivar-specific orange records should be added separately only when their nutrition is independently source-supported."
    }
  },
  {
    "id": "fruit-mandarin-seedless-peeled-raw",
    "name": "Mandarin",
    "displayName": "Mandarin â Seedless, Peeled, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "mandarin",
      "mandarin orange",
      "seedless mandarin",
      "fresh mandarin",
      "peeled mandarin"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "mandarin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 55.6,
      "protein": 1.04,
      "carbs": 13.4,
      "fat": 0.458,
      "fiber": 1.33,
      "sugar": 9.12,
      "sodium": 0,
      "potassium": 167.2
    },
    "servings": [
      {
        "id": "1-medium-reference",
        "label": "1 medium mandarin",
        "amount": 1,
        "unit": "medium mandarin",
        "grams": 88,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "mandarin",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Mandarin, seedless, peeled, raw",
        "verifiedAt": "2026-08-03",
        "fdcId": 2710832,
        "release": "Current through April 2026",
        "energySelection": {
          "selected": {
            "method": "Atwater Specific Factors",
            "kcalPer100g": 55.6
          },
          "alternate": {
            "method": "Atwater General Factors",
            "kcalPer100g": 62.0
          },
          "policy": "ARI prefers the USDA food-specific Atwater energy value when both food-specific and general-factor values are published."
        }
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "USDA Foundation Food profile. ARI uses the food-specific Atwater energy value (55.6 kcal/100 g) and preserves the USDA general-factor energy (62 kcal/100 g) in source provenance. The 88 g medium-fruit convenience measure is retained as a practical mandarin/tangerine reference rather than treated as an analytical Foundation sample weight."
    }
  },
  {
    "id": "fruit-clementine-raw",
    "name": "Clementine",
    "displayName": "Clementine â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "clementine",
      "clementines",
      "cutie orange",
      "cuties",
      "small mandarin"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "clementine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 47,
      "protein": 0.85,
      "carbs": 12.02,
      "fat": 0.15,
      "fiber": 1.7,
      "sugar": 9.18,
      "sodium": 1,
      "potassium": 177
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 clementine",
        "amount": 1,
        "unit": "clementine",
        "grams": 74,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "clementine",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Clementines, raw",
        "verifiedAt": "2026-08-03",
        "fdcId": 168195,
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "Kept separate from the broader mandarin record because users commonly log clementines by name and the USDA reference profile is distinct."
    }
  },
  {
    "id": "fruit-grapefruit-pink-red-raw",
    "name": "Grapefruit",
    "displayName": "Grapefruit â Pink or Red, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "grapefruit",
      "pink grapefruit",
      "red grapefruit",
      "ruby red grapefruit",
      "raw grapefruit"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "grapefruit"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 42,
      "protein": 0.77,
      "carbs": 10.7,
      "fat": 0.14,
      "fiber": 1.6,
      "sugar": 6.89,
      "saturatedFat": 0.021,
      "sodium": 0,
      "potassium": 135
    },
    "servings": [
      {
        "id": "half-medium",
        "label": "1/2 medium grapefruit",
        "amount": 0.5,
        "unit": "medium grapefruit",
        "grams": 123,
        "isDefault": true
      },
      {
        "id": "1-cup-sections",
        "label": "1 cup grapefruit sections",
        "amount": 1,
        "unit": "cup",
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "grapefruit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Grapefruit, raw, pink and red, all areas",
        "verifiedAt": "2026-08-03",
        "fdcId": 174673,
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "Pink/red grapefruit reference. USDA added a newer generic Grapefruit, raw Foundation Food in April 2026; this V1 retains the fully traceable SR pink/red record until the newer analytical profile is deliberately adopted into ARI."
    }
  },
  {
    "id": "fruit-lemon-raw-without-peel",
    "name": "Lemon",
    "displayName": "Lemon â Raw, Without Peel",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "lemon",
      "lemons",
      "raw lemon",
      "fresh lemon",
      "lemon flesh"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "lemon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 29,
      "protein": 1.1,
      "carbs": 9.32,
      "fat": 0.3,
      "fiber": 2.8,
      "sugar": 2.5,
      "saturatedFat": 0.039,
      "sodium": 2,
      "potassium": 138
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 lemon",
        "amount": 1,
        "unit": "lemon",
        "grams": 84,
        "isDefault": true
      },
      {
        "id": "1-wedge",
        "label": "1 lemon wedge",
        "amount": 1,
        "unit": "lemon wedge",
        "grams": 7,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "lemon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Lemons, raw, without peel",
        "verifiedAt": "2026-08-03",
        "fdcId": 167746,
        "ndbNumber": "09150",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "This record is whole edible lemon flesh without peel. Lemon juice and lemon peel are separate food forms and should not resolve to this record when the user specifies them."
    }
  },
  {
    "id": "fruit-lime-raw",
    "name": "Lime",
    "displayName": "Lime â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "lime",
      "limes",
      "raw lime",
      "fresh lime"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "lime"
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
      "protein": 0.7,
      "carbs": 10.54,
      "fat": 0.2,
      "fiber": 2.8,
      "sugar": 1.69,
      "saturatedFat": 0.022,
      "sodium": 2,
      "potassium": 102
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 lime",
        "amount": 1,
        "unit": "lime",
        "grams": 67,
        "isDefault": true
      },
      {
        "id": "1-wedge",
        "label": "1 lime wedge",
        "amount": 1,
        "unit": "lime wedge",
        "grams": 8,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "lime",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Limes, raw",
        "verifiedAt": "2026-08-03",
        "fdcId": 168155,
        "ndbNumber": "09159",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "Whole raw lime reference. Bottled lime juice and raw expressed lime juice should be separate records if added later."
    }
  },
  {
    "id": "fruit-pummelo-raw",
    "name": "Pomelo",
    "displayName": "Pomelo / Pummelo â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pomelo",
      "pummelo",
      "shaddock",
      "raw pomelo",
      "fresh pomelo"
    ],
    "tags": [
      "fruit",
      "citrus",
      "raw",
      "pomelo"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 38,
      "protein": 0.76,
      "carbs": 9.62,
      "fat": 0.04,
      "fiber": 1.0,
      "sodium": 1,
      "potassium": 216
    },
    "servings": [
      {
        "id": "1-cup-sections",
        "label": "1 cup pomelo sections",
        "amount": 1,
        "unit": "cup",
        "grams": 190,
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
    "source": "AriFoodCitrus",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "citrus",
      "citrusType": "pomelo",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pummelo, raw",
        "verifiedAt": "2026-08-03",
        "fdcId": 167754,
        "ndbNumber": "09295",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA SR Legacy common measures or a directly corresponding USDA household-measure reference.",
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
      "notes": "USDA spells the food 'Pummelo'; common user-facing spelling 'Pomelo' is used in the name and both spellings are searchable. Total sugar and saturated fat are omitted because they are not present in the selected SR Legacy reference profile."
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
      ARI_CITRUS_FOODS,
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
        ARI_CITRUS_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "orange",
        "mandarin",
        "clementine",
        "grapefruit",
        "lemon",
        "lime",
        "pomelo"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} citrus record(s).`,
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

  global.AriFoodCitrus =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CITRUS_FOODS.length;
      },

      getFoodIds() {
        return ARI_CITRUS_FOODS.map(
          food => food.id
        );
      },

      getCitrusTypes() {
        return Array.from(
          new Set(
            ARI_CITRUS_FOODS.map(
              food =>
                food.metadata.citrusType
            )
          )
        );
      },

      getByCitrusType(citrusType) {
        const normalized =
          String(citrusType || "")
            .trim()
            .toLowerCase();

        return ARI_CITRUS_FOODS
          .filter(
            food =>
              String(
                food.metadata?.citrusType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getFoundationRecords() {
        return ARI_CITRUS_FOODS
          .filter(
            food =>
              food.metadata?.sourceProvenance?.dataset ===
              "Foundation Foods"
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
          ARI_CITRUS_FOODS.find(
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
        "ari:food-citrus-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_CITRUS_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CITRUS_FOODS.length} raw citrus records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);