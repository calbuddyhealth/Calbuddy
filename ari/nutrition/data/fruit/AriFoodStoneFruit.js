// =====================================================
// ARI REBIRTH
// File: AriFoodStoneFruit.js
// Version: 1.0.0
//
// Purpose:
//   Raw stone-fruit reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Yellow peach
//   - Nectarine
//   - Plum
//   - Apricot
//   - Sweet cherries
//   - Sour / tart red cherries
//
// Data policy:
//   - Generic-first raw whole fruit.
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - Practical USDA common measures where available.
//   - Sweet and tart cherries remain distinct.
//   - Dried/canned/syrup/jam/pie forms excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodStoneFruit(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodStoneFruit";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first raw stone-fruit reference module",
  "recordCount": 6,
  "stoneFruit": [
    "yellow peach",
    "nectarine",
    "plum",
    "apricot",
    "sweet cherry",
    "sour / tart red cherry"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods when a current analytical stone-fruit record is deliberately selected",
    "USDA FoodData Central SR Legacy for stable generic raw stone-fruit references",
    "USDA common-measure weights for practical whole-fruit and cup servings"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Keep sweet cherries separate from sour/tart cherries.",
    "Keep fresh/raw stone fruit separate from dried, canned, syrup-packed, cooked, jammed, preserved, or pie-filling forms.",
    "Do not create cultivar-specific peach, nectarine, plum, or cherry records unless nutrition is independently source-supported.",
    "Do not use generic plum nutrition for pluots, plumcots, apriums, or other interspecific hybrids when a specific record is desired.",
    "Household measures are practical gram-equivalent servings and do not replace the canonical 100 g reference.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_STONE_FRUIT_FOODS =
    [
  {
    "id": "fruit-peach-yellow-raw",
    "name": "Peach",
    "displayName": "Peach â Yellow, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "peach",
      "peaches",
      "yellow peach",
      "raw peach",
      "fresh peach"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "peach"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 39,
      "protein": 0.91,
      "carbs": 9.54,
      "fat": 0.25,
      "fiber": 1.5,
      "sugar": 8.39,
      "saturatedFat": 0.019,
      "sodium": 0,
      "potassium": 190
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium peach",
        "amount": 1,
        "unit": "medium peach",
        "grams": 150,
        "isDefault": true
      },
      {
        "id": "1-small",
        "label": "1 small peach",
        "amount": 1,
        "unit": "small peach",
        "grams": 130,
        "isDefault": false
      },
      {
        "id": "1-large",
        "label": "1 large peach",
        "amount": 1,
        "unit": "large peach",
        "grams": 175,
        "isDefault": false
      },
      {
        "id": "1-cup-slices",
        "label": "1 cup peach slices",
        "amount": 1,
        "unit": "cup",
        "grams": 154,
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "peach",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169928,
        "ndbNumber": "09236",
        "sourceDescription": "Peaches, yellow, raw",
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
      "notes": "Yellow peach is the generic V1 supermarket peach reference. White peach, donut/Saturn peach, and cultivar-specific profiles should be added only when separately source-supported."
    }
  },
  {
    "id": "fruit-nectarine-raw",
    "name": "Nectarine",
    "displayName": "Nectarine â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "nectarine",
      "nectarines",
      "raw nectarine",
      "fresh nectarine"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "nectarine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 44,
      "protein": 1.06,
      "carbs": 10.55,
      "fat": 0.32,
      "fiber": 1.7,
      "sugar": 7.89,
      "saturatedFat": 0.025,
      "sodium": 0,
      "potassium": 201
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium nectarine",
        "amount": 1,
        "unit": "medium nectarine",
        "grams": 142,
        "isDefault": true
      },
      {
        "id": "1-cup-slices",
        "label": "1 cup nectarine slices",
        "amount": 1,
        "unit": "cup",
        "grams": 143,
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "nectarine",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169914,
        "ndbNumber": "09191",
        "sourceDescription": "Nectarines, raw",
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
      "notes": "Generic raw nectarine. White-flesh and yellow-flesh nectarines are not split in V1."
    }
  },
  {
    "id": "fruit-plum-raw",
    "name": "Plum",
    "displayName": "Plum â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "plum",
      "plums",
      "raw plum",
      "fresh plum"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "plum"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 46,
      "protein": 0.7,
      "carbs": 11.42,
      "fat": 0.28,
      "fiber": 1.4,
      "sugar": 9.92,
      "saturatedFat": 0.017,
      "sodium": 0,
      "potassium": 157
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 plum",
        "amount": 1,
        "unit": "plum",
        "grams": 66,
        "isDefault": true
      },
      {
        "id": "1-cup-slices",
        "label": "1 cup sliced plums",
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "plum",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169949,
        "ndbNumber": "09279",
        "sourceDescription": "Plums, raw",
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
      "notes": "Generic raw plum. Black, red, yellow, prune-type, pluot, plumcot, aprium, and other hybrid/cultivar records are not merged into separate V1 entries without independent source support."
    }
  },
  {
    "id": "fruit-apricot-raw",
    "name": "Apricot",
    "displayName": "Apricot â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "apricot",
      "apricots",
      "raw apricot",
      "fresh apricot"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "apricot"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 48,
      "protein": 1.4,
      "carbs": 11.12,
      "fat": 0.39,
      "fiber": 2.0,
      "sugar": 9.24,
      "saturatedFat": 0.027,
      "sodium": 1,
      "potassium": 259
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 apricot",
        "amount": 1,
        "unit": "apricot",
        "grams": 35,
        "isDefault": true
      },
      {
        "id": "1-cup-halves",
        "label": "1 cup apricot halves",
        "amount": 1,
        "unit": "cup",
        "grams": 155,
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "apricot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171697,
        "ndbNumber": "09021",
        "sourceDescription": "Apricots, raw",
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
      "notes": "This record is fresh raw apricot flesh. Dried apricots are much more nutrient-dense by weight and belong in AriFoodDriedFruit."
    }
  },
  {
    "id": "fruit-cherries-sweet-raw",
    "name": "Sweet Cherries",
    "displayName": "Sweet Cherries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "sweet cherries",
      "cherries",
      "cherry",
      "Bing cherries",
      "dark sweet cherries",
      "raw cherries",
      "fresh cherries"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "sweet-cherry"
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
      "protein": 1.06,
      "carbs": 16.01,
      "fat": 0.2,
      "fiber": 2.1,
      "sugar": 12.82,
      "saturatedFat": 0.038,
      "sodium": 0,
      "potassium": 222
    },
    "servings": [
      {
        "id": "1-cup-without-pits",
        "label": "1 cup sweet cherries, without pits",
        "amount": 1,
        "unit": "cup",
        "grams": 154,
        "isDefault": true
      },
      {
        "id": "1-cherry",
        "label": "1 sweet cherry",
        "amount": 1,
        "unit": "cherry",
        "grams": 8.2,
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "sweet-cherry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171719,
        "ndbNumber": "09070",
        "sourceDescription": "Cherries, sweet, raw",
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
      "notes": "Generic sweet-cherry reference. Bing is retained as a search alias, not as a claim that all sweet cherries share one cultivar-specific analysis."
    }
  },
  {
    "id": "fruit-cherries-sour-red-raw",
    "name": "Tart Cherries",
    "displayName": "Sour / Tart Red Cherries â Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tart cherries",
      "sour cherries",
      "red sour cherries",
      "Montmorency cherries",
      "raw tart cherries"
    ],
    "tags": [
      "fruit",
      "stone-fruit",
      "raw",
      "sour-cherry"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 50,
      "protein": 1.0,
      "carbs": 12.18,
      "fat": 0.3,
      "fiber": 1.6,
      "sugar": 8.49,
      "saturatedFat": 0.068,
      "sodium": 3,
      "potassium": 173
    },
    "servings": [
      {
        "id": "1-cup-without-pits",
        "label": "1 cup tart cherries, without pits",
        "amount": 1,
        "unit": "cup",
        "grams": 155,
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
    "source": "AriFoodStoneFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "stone-fruit",
      "stoneFruitType": "sour-cherry",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173954,
        "ndbNumber": "09063",
        "sourceDescription": "Cherries, sour, red, raw",
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
      "notes": "Raw sour/tart cherries are kept separate from sweet cherries. Dried tart cherries, cherry juice concentrate, pie filling, and sweetened canned cherries require separate records."
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
      ARI_STONE_FRUIT_FOODS,
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
        ARI_STONE_FRUIT_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "peach",
        "nectarine",
        "plum",
        "apricot",
        "sweet-cherry",
        "sour-cherry"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} stone-fruit record(s).`,
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

  global.AriFoodStoneFruit =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_STONE_FRUIT_FOODS.length;
      },

      getFoodIds() {
        return ARI_STONE_FRUIT_FOODS.map(
          food => food.id
        );
      },

      getStoneFruitTypes() {
        return Array.from(
          new Set(
            ARI_STONE_FRUIT_FOODS.map(
              food =>
                food.metadata.stoneFruitType
            )
          )
        );
      },

      getByStoneFruitType(stoneFruitType) {
        const normalized =
          String(stoneFruitType || "")
            .trim()
            .toLowerCase();

        return ARI_STONE_FRUIT_FOODS
          .filter(
            food =>
              String(
                food.metadata?.stoneFruitType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getCherries() {
        return ARI_STONE_FRUIT_FOODS
          .filter(
            food =>
              ["sweet-cherry", "sour-cherry"].includes(
                food.metadata?.stoneFruitType
              )
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
          ARI_STONE_FRUIT_FOODS.find(
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
        "ari:food-stone-fruit-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_STONE_FRUIT_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_STONE_FRUIT_FOODS.length} raw stone-fruit records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
