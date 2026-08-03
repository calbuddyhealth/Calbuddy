// =====================================================
// ARI REBIRTH
// File: AriFoodLamb.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline lamb reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   Ground lamb, leg, loin/chops, rib/rack, shoulder,
//   and lamb shank.
//
// Reliability:
//   - Current April 2026 USDA Foundation ground-lamb data.
//   - USDA SR Legacy for exact cuts/preparations.
//   - 100 g edible-portion nutrition basis.
//   - No fabricated gyro/kebab/curry/sauced values.
//   - No runtime internet required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+
// =====================================================

(function initializeAriFoodLamb(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodLamb";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze({
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current 2026 analytical ground lamb",
    "USDA FoodData Central SR Legacy for exact lamb cuts, trim states, and cooked preparations"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Use the April 2026 analytical raw ground-lamb profile rather than blindly retaining the older SR Legacy profile.",
    "Keep raw/cooked and lean-only/lean-and-fat records separate.",
    "Use loin records for lamb loin chops and rib records for rack of lamb.",
    "Do not fabricate gyro, kebab, curry, breaded, glazed, sauced, or restaurant values.",
    "Baked/grilled aliases only map to closely corresponding plain dry-heat references.",
    "Identifiers are embedded only when confidently confirmed.",
    "No runtime internet access is required."
  ]
});

  const RAW_LAMB_DATA = [
  {
    "id": "lamb-ground-raw-current-foundation",
    "name": "Ground Lamb",
    "displayName": "Ground Lamb â Raw",
    "cut": "ground",
    "state": "raw",
    "preparation": "raw",
    "calories": 242,
    "protein": 17.5,
    "carbs": 0,
    "fat": 18.6,
    "sodium": 53.5,
    "potassium": 272.1,
    "aliases": [
      "ground lamb",
      "minced lamb",
      "lamb mince",
      "raw ground lamb",
      "lamb burger meat"
    ],
    "tags": [
      "ground",
      "current-foundation"
    ],
    "popularity": 100,
    "source": {
      "dataset": "Foundation Foods",
      "description": "Lamb, ground, raw",
      "release": "April 2026",
      "identifier": null
    },
    "notes": "Uses the newer April 2026 USDA Foundation analytical profile rather than the older SR Legacy 282 kcal / 23.4 g fat profile. Slightly negative analytical carbohydrate is normalized to 0 g.",
    "serving": "ground"
  },
  {
    "id": "lamb-ground-cooked-broiled",
    "name": "Ground Lamb",
    "displayName": "Ground Lamb â Cooked, Broiled",
    "cut": "ground",
    "state": "cooked",
    "preparation": "broiled",
    "calories": 283,
    "protein": 24.8,
    "carbs": 0,
    "fat": 19.6,
    "sodium": 81,
    "potassium": 339,
    "saturatedFat": 8.12,
    "cholesterol": 97,
    "aliases": [
      "cooked ground lamb",
      "ground lamb cooked",
      "lamb burger",
      "lamb burger patty",
      "broiled ground lamb"
    ],
    "tags": [
      "ground",
      "burger"
    ],
    "popularity": 98,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, ground, cooked, broiled",
      "release": "April 2018 (final)",
      "identifier": "NDB 17225"
    },
    "notes": "Plain cooked ground lamb. Bun, cheese, sauce, or added cooking fat are not included.",
    "serving": "ground"
  },
  {
    "id": "lamb-leg-whole-choice-raw-lean-only",
    "name": "Leg of Lamb",
    "displayName": "Leg of Lamb â Choice, Raw, Lean Only",
    "cut": "leg",
    "state": "raw",
    "preparation": "raw",
    "calories": 128,
    "protein": 20.56,
    "carbs": 0,
    "fat": 4.51,
    "sodium": 62,
    "potassium": 289,
    "saturatedFat": 1.61,
    "cholesterol": 64,
    "aliases": [
      "leg of lamb",
      "lamb leg",
      "raw lamb leg",
      "lean lamb leg"
    ],
    "tags": [
      "choice",
      "lean-only"
    ],
    "popularity": 98,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, leg, whole (shank and sirloin), separable lean only, trimmed to 1/4 inch fat, choice, raw",
      "release": "April 2018 (final)",
      "identifier": "NDB 17013"
    }
  },
  {
    "id": "lamb-leg-whole-choice-roasted-lean-only",
    "name": "Leg of Lamb",
    "displayName": "Leg of Lamb â Choice, Roasted, Lean Only",
    "cut": "leg",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 191,
    "protein": 28.3,
    "carbs": 0,
    "fat": 7.74,
    "aliases": [
      "leg of lamb",
      "roasted lamb leg",
      "roast lamb",
      "baked leg of lamb",
      "lean roasted lamb leg"
    ],
    "tags": [
      "choice",
      "lean-only",
      "roasted"
    ],
    "popularity": 100,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, leg, whole (shank and sirloin), separable lean only, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": null
    },
    "notes": "The baked alias applies only to plain dry-heat lamb without meaningful added oil, glaze, or sauce."
  },
  {
    "id": "lamb-leg-whole-choice-roasted-lean-fat",
    "name": "Leg of Lamb",
    "displayName": "Leg of Lamb â Choice, Roasted, Lean & Fat",
    "cut": "leg",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 258,
    "protein": 25.55,
    "carbs": 0,
    "fat": 16.48,
    "sodium": 66,
    "potassium": 313,
    "aliases": [
      "leg of lamb with fat",
      "roasted lamb leg fat eaten",
      "roast lamb leg",
      "lamb roast with fat"
    ],
    "tags": [
      "choice",
      "lean-and-fat",
      "roasted"
    ],
    "popularity": 96,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "FDC 174312"
    }
  },
  {
    "id": "lamb-loin-choice-raw-lean-only",
    "name": "Lamb Loin",
    "displayName": "Lamb Loin â Choice, Raw, Lean Only",
    "cut": "loin",
    "state": "raw",
    "preparation": "raw",
    "calories": 143,
    "protein": 20.88,
    "carbs": 0,
    "fat": 5.94,
    "aliases": [
      "lamb loin",
      "lamb loin chop",
      "loin lamb chop",
      "raw lamb chop",
      "lean lamb chop"
    ],
    "tags": [
      "chop",
      "choice",
      "lean-only"
    ],
    "popularity": 96,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, loin, separable lean only, trimmed to 1/4 inch fat, choice, raw",
      "release": "April 2018 (final)",
      "identifier": null
    }
  },
  {
    "id": "lamb-loin-choice-roasted-lean-only",
    "name": "Lamb Loin",
    "displayName": "Lamb Loin â Choice, Roasted, Lean Only",
    "cut": "loin",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 202,
    "protein": 26.59,
    "carbs": 0,
    "fat": 9.76,
    "aliases": [
      "lamb loin",
      "roasted lamb loin",
      "lamb loin chop",
      "roasted lamb chop",
      "baked lamb loin chop"
    ],
    "tags": [
      "chop",
      "choice",
      "lean-only",
      "roasted"
    ],
    "popularity": 98,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, loin, separable lean only, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "NDB 17028"
    },
    "notes": "The baked alias applies only to a plain dry-heat loin/chop without meaningful oil, breading, glaze, or sauce."
  },
  {
    "id": "lamb-loin-choice-broiled-lean-only",
    "name": "Lamb Loin",
    "displayName": "Lamb Loin â Choice, Broiled, Lean Only",
    "cut": "loin",
    "state": "cooked",
    "preparation": "broiled",
    "calories": 216,
    "protein": 29.99,
    "carbs": 0,
    "fat": 9.73,
    "aliases": [
      "broiled lamb loin",
      "grilled lamb loin",
      "grilled lamb chop",
      "broiled lamb chop",
      "lamb loin chop cooked"
    ],
    "tags": [
      "chop",
      "choice",
      "lean-only",
      "broiled"
    ],
    "popularity": 97,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, loin, separable lean only, trimmed to 1/4 inch fat, choice, cooked, broiled",
      "release": "April 2018 (final)",
      "identifier": null
    },
    "notes": "The grilled alias is for a plain high-heat loin/chop with no meaningful added oil, glaze, or sauce."
  },
  {
    "id": "lamb-rib-choice-raw-lean-only",
    "name": "Lamb Rib",
    "displayName": "Lamb Rib / Rack â Choice, Raw, Lean Only",
    "cut": "rib",
    "state": "raw",
    "preparation": "raw",
    "calories": 169,
    "protein": 19.98,
    "carbs": 0,
    "fat": 9.23,
    "aliases": [
      "lamb rib",
      "rack of lamb",
      "lamb rack",
      "lamb rib chop",
      "raw rack of lamb"
    ],
    "tags": [
      "rack",
      "choice",
      "lean-only"
    ],
    "popularity": 96,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, rib, separable lean only, trimmed to 1/4 inch fat, choice, raw",
      "release": "April 2018 (final)",
      "identifier": null
    }
  },
  {
    "id": "lamb-rib-choice-roasted-lean-only",
    "name": "Lamb Rib",
    "displayName": "Lamb Rib / Rack â Choice, Roasted, Lean Only",
    "cut": "rib",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 232,
    "protein": 26.16,
    "carbs": 0,
    "fat": 13.31,
    "sodium": 81,
    "potassium": 315,
    "aliases": [
      "rack of lamb",
      "roasted rack of lamb",
      "lamb rib chop",
      "roasted lamb rib",
      "baked rack of lamb"
    ],
    "tags": [
      "rack",
      "choice",
      "lean-only",
      "roasted"
    ],
    "popularity": 100,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, rib, separable lean only, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "NDB 17034"
    }
  },
  {
    "id": "lamb-rib-choice-broiled-lean-only",
    "name": "Lamb Rib",
    "displayName": "Lamb Rib / Rack â Choice, Broiled, Lean Only",
    "cut": "rib",
    "state": "cooked",
    "preparation": "broiled",
    "calories": 235,
    "protein": 27.74,
    "carbs": 0,
    "fat": 12.95,
    "aliases": [
      "grilled rack of lamb",
      "broiled rack of lamb",
      "grilled lamb rib chop",
      "lamb rib cooked"
    ],
    "tags": [
      "rack",
      "choice",
      "lean-only",
      "broiled"
    ],
    "popularity": 98,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, rib, separable lean only, trimmed to 1/4 inch fat, choice, cooked, broiled",
      "release": "April 2018 (final)",
      "identifier": null
    }
  },
  {
    "id": "lamb-rib-choice-roasted-lean-fat",
    "name": "Lamb Rib",
    "displayName": "Lamb Rib / Rack â Choice, Roasted, Lean & Fat",
    "cut": "rib",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 341,
    "protein": 21.82,
    "carbs": 0,
    "fat": 27.53,
    "aliases": [
      "rack of lamb with fat",
      "roasted lamb rib fat eaten",
      "lamb rib chop with fat",
      "fatty rack of lamb"
    ],
    "tags": [
      "rack",
      "choice",
      "lean-and-fat",
      "roasted"
    ],
    "popularity": 92,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, rib, separable lean and fat, trimmed to 1/8 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "FDC 172552"
    }
  },
  {
    "id": "lamb-shoulder-arm-choice-raw-lean-only",
    "name": "Lamb Shoulder",
    "displayName": "Lamb Shoulder Arm â Choice, Raw, Lean Only",
    "cut": "shoulder",
    "state": "raw",
    "preparation": "raw",
    "calories": 132,
    "protein": 19.99,
    "carbs": 0,
    "fat": 5.2,
    "aliases": [
      "lamb shoulder",
      "lamb shoulder arm",
      "raw lamb shoulder",
      "lean lamb shoulder"
    ],
    "tags": [
      "arm",
      "choice",
      "lean-only"
    ],
    "popularity": 90,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, shoulder, arm, separable lean only, trimmed to 1/4 inch fat, choice, raw",
      "release": "April 2018 (final)",
      "identifier": null
    }
  },
  {
    "id": "lamb-shoulder-arm-choice-roasted-lean-only",
    "name": "Lamb Shoulder",
    "displayName": "Lamb Shoulder Arm â Choice, Roasted, Lean Only",
    "cut": "shoulder",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 192,
    "protein": 25.46,
    "carbs": 0,
    "fat": 9.26,
    "aliases": [
      "lamb shoulder",
      "roasted lamb shoulder",
      "baked lamb shoulder",
      "lean lamb shoulder cooked"
    ],
    "tags": [
      "arm",
      "choice",
      "lean-only",
      "roasted"
    ],
    "popularity": 94,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, shoulder, arm, separable lean only, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "NDB 17050"
    }
  },
  {
    "id": "lamb-shoulder-blade-choice-broiled-lean-only",
    "name": "Lamb Shoulder",
    "displayName": "Lamb Shoulder Blade â Choice, Broiled, Lean Only",
    "cut": "shoulder",
    "state": "cooked",
    "preparation": "broiled",
    "calories": 211,
    "protein": 25.48,
    "carbs": 0,
    "fat": 11.32,
    "sodium": 88,
    "potassium": 368,
    "saturatedFat": 4.04,
    "cholesterol": 91,
    "aliases": [
      "lamb shoulder blade",
      "broiled lamb shoulder",
      "grilled lamb shoulder",
      "lamb shoulder steak"
    ],
    "tags": [
      "blade",
      "choice",
      "lean-only",
      "broiled"
    ],
    "popularity": 92,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, shoulder, blade, separable lean only, trimmed to 1/4 inch fat, choice, cooked, broiled",
      "release": "April 2018 (final)",
      "identifier": "NDB 17057"
    }
  },
  {
    "id": "lamb-shoulder-blade-choice-roasted-lean-fat",
    "name": "Lamb Shoulder",
    "displayName": "Lamb Shoulder Blade â Choice, Roasted, Lean & Fat",
    "cut": "shoulder",
    "state": "cooked",
    "preparation": "roasted",
    "calories": 281,
    "protein": 22.25,
    "carbs": 0,
    "fat": 20.61,
    "aliases": [
      "lamb shoulder with fat",
      "roasted lamb shoulder fat eaten",
      "lamb shoulder roast",
      "fatty lamb shoulder"
    ],
    "tags": [
      "blade",
      "choice",
      "lean-and-fat",
      "roasted"
    ],
    "popularity": 93,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, shoulder, blade, separable lean and fat, trimmed to 1/4 inch fat, choice, cooked, roasted",
      "release": "April 2018 (final)",
      "identifier": "FDC 174333"
    }
  },
  {
    "id": "lamb-foreshank-choice-raw-lean-only",
    "name": "Lamb Shank",
    "displayName": "Lamb Foreshank â Choice, Raw, Lean Only",
    "cut": "shank",
    "state": "raw",
    "preparation": "raw",
    "calories": 120,
    "protein": 21.08,
    "carbs": 0,
    "fat": 3.29,
    "aliases": [
      "lamb shank",
      "foreshank",
      "raw lamb shank",
      "lean lamb shank"
    ],
    "tags": [
      "foreshank",
      "choice",
      "lean-only"
    ],
    "popularity": 91,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, foreshank, separable lean only, trimmed to 1/4 inch fat, choice, raw",
      "release": "April 2018 (final)",
      "identifier": null
    }
  },
  {
    "id": "lamb-foreshank-choice-braised-lean-only",
    "name": "Lamb Shank",
    "displayName": "Lamb Foreshank â Choice, Braised, Lean Only",
    "cut": "shank",
    "state": "cooked",
    "preparation": "braised",
    "calories": 187,
    "protein": 31.01,
    "carbs": 0,
    "fat": 6.02,
    "aliases": [
      "lamb shank",
      "braised lamb shank",
      "slow cooked lamb shank",
      "cooked lamb shank"
    ],
    "tags": [
      "foreshank",
      "choice",
      "lean-only",
      "braised"
    ],
    "popularity": 96,
    "source": {
      "dataset": "SR Legacy",
      "description": "Lamb, domestic, foreshank, separable lean only, trimmed to 1/4 inch fat, choice, cooked, braised",
      "release": "April 2018 (final)",
      "identifier": null
    },
    "notes": "Plain braised lamb shank meat. Braising liquid, wine, vegetables, flour, butter, or sauce are not included."
  }
];

  const GROUND_SERVINGS = [
    { id: "4-oz-patty", label: "1 Ã 4 oz patty", amount: 1, unit: "patty", grams: 113.398, isDefault: true },
    { id: "3-oz", label: "3 oz", amount: 3, unit: "oz", grams: 85.0486, isDefault: false },
    { id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: false }
  ];

  const STANDARD_SERVINGS = [
    { id: "3-oz", label: "3 oz", amount: 3, unit: "oz", grams: 85.0486, isDefault: true },
    { id: "4-oz", label: "4 oz", amount: 4, unit: "oz", grams: 113.398, isDefault: false },
    { id: "100-g", label: "100 g", amount: 100, unit: "g", grams: 100, isDefault: false }
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

  function buildFood(raw) {
    const nutrition = {
      calories: raw.calories,
      protein: raw.protein,
      carbs: raw.carbs,
      fat: raw.fat
    };

    const verifiedNutrients = [
      "calories",
      "protein",
      "carbs",
      "fat"
    ];

    for (const key of [
      "sodium",
      "potassium",
      "saturatedFat",
      "cholesterol"
    ]) {
      if (raw[key] !== undefined && raw[key] !== null) {
        nutrition[key] = raw[key];
        verifiedNutrients.push(key);
      }
    }

    return {
      id: raw.id,
      name: raw.name,
      displayName: raw.displayName,
      category: "protein",
      state: raw.state,
      preparation: raw.preparation,
      aliases: raw.aliases,
      tags: ["lamb", raw.cut, ...raw.tags],
      popularity: raw.popularity,

      nutritionBasis: {
        type: "weight",
        amount: 100,
        unit: "g",
        grams: 100
      },

      nutrition,

      servings:
        raw.serving === "ground"
          ? clone(GROUND_SERVINGS)
          : clone(STANDARD_SERVINGS),

      source: MODULE_NAME,
      verified: true,

      metadata: {
        foodFamily: "lamb",
        cut: raw.cut,
        dataVerifiedAt: VERIFIED_AT,
        confidence: "high",
        referenceBasis: "100 g edible portion",

        sourceProvenance: {
          provider: "USDA Agricultural Research Service",
          database: "FoodData Central",
          dataset: raw.source.dataset,
          sourceDescription: raw.source.description,
          release: raw.source.release,
          identifier: raw.source.identifier || null
        },

        verifiedNutrients,
        offlineReference: true,

        notes:
          raw.notes ||
          "Generic lamb reference value. Actual nutrition varies with origin, breed, trim, retained fat, cooking loss, doneness, added oil, seasoning, marinade, glaze, or sauce."
      }
    };
  }

  const ARI_LAMB_FOODS =
    RAW_LAMB_DATA.map(buildFood);

  function markFailed(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

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
    ARI_LAMB_FOODS,
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
      foodCount: ARI_LAMB_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "ground-lamb",
        "leg",
        "loin",
        "rib-rack",
        "shoulder",
        "shank"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} lamb record(s).`,
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

  global.AriFoodLamb = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_LAMB_FOODS.length;
    },

    getFoodIds() {
      return ARI_LAMB_FOODS.map(food => food.id);
    },

    getCuts() {
      return Array.from(
        new Set(
          ARI_LAMB_FOODS.map(food => food.metadata.cut)
        )
      );
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();
      const record = ARI_LAMB_FOODS.find(food => food.id === id);
      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-lamb-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_LAMB_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_LAMB_FOODS.length} source-traceable lamb reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
