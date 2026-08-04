// =====================================================
// ARI REBIRTH
// File: AriFoodSnacksCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic savory-snack fallback dataset for
//   ARI Nutrition.
//
// Collection:
//   AriFoodSnacks
//
// Coverage:
//   20 generic snack records.
//
// Included:
//   - Plain salted potato chips
//   - Baked potato chips
//   - Tortilla chips
//   - Corn chips
//   - Pretzels
//   - Air-popped popcorn
//   - Oil-popped popcorn
//   - Kettle corn
//   - Saltine crackers
//   - Whole-wheat crackers
//   - Cheese crackers
//   - Butter crackers
//   - Pita chips
//   - Rice crackers
//   - Cheese puffs
//   - Cheese curls
//   - Savory snack mix
//   - Plantain chips
//
// Strategy:
//   Generic fallback only. Exact branded products from
//   AriFoodSnackBrands should outrank these records.
//
// Canonical basis:
//   100 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSnacks v1+
// =====================================================

(function initializeAriFoodSnacksCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSnacksCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic savory-snack fallback core for the ARI Snacks pathway",
  "recordCount": 20,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "sourceHierarchy": [
    "USDA FoodData Central generic snack references",
    "Frozen offline common-food reference values"
  ],
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Preserve a realistic common serving for each snack type.",
    "Generic records are fallbacks; exact branded products should outrank them.",
    "Keep flavor-specific branded products separate when nutrition differs.",
    "Do not infer how much of a bag or container a user consumed.",
    "Keep nuts in AriFoodNuts.",
    "Keep candy, cookies, desserts, protein bars, granola bars, and jerky outside this pathway.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SNACK_CORE_FOODS = Object.freeze(
[
  {
    "id": "snacks-potato-chips-plain-salted",
    "name": "Potato Chips, Plain, Salted",
    "displayName": "Plain Salted Potato Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "plain-salted",
    "aliases": [
      "Plain Salted Potato Chips",
      "Potato Chips, Plain, Salted",
      "potato chips",
      "plain chips",
      "salted potato chips",
      "regular chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "potato-chips",
      "plain-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 536,
      "protein": 7.0,
      "carbs": 52.9,
      "fat": 34.6,
      "fiber": 4.8,
      "sugar": 0.5,
      "sodiumMg": 525
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 150.1,
          "protein": 1.96,
          "carbs": 14.81,
          "fat": 9.69,
          "fiber": 1.34,
          "sugar": 0.14,
          "sodiumMg": 147.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "potato-chips",
      "snackStyle": "plain-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-potato-chips-baked",
    "name": "Potato Chips, Baked",
    "displayName": "Baked Potato Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "baked",
    "aliases": [
      "Baked Potato Chips",
      "Potato Chips, Baked",
      "baked chips",
      "baked potato chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "potato-chips",
      "baked"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 469,
      "protein": 5.7,
      "carbs": 71.4,
      "fat": 18.2,
      "fiber": 4.1,
      "sugar": 3.8,
      "sodiumMg": 605
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 131.3,
          "protein": 1.6,
          "carbs": 19.99,
          "fat": 5.1,
          "fiber": 1.15,
          "sugar": 1.06,
          "sodiumMg": 169.4
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "potato-chips",
      "snackStyle": "baked",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-tortilla-chips-plain-salted",
    "name": "Tortilla Chips, Plain, Salted",
    "displayName": "Plain Salted Tortilla Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "plain-salted",
    "aliases": [
      "Plain Salted Tortilla Chips",
      "Tortilla Chips, Plain, Salted",
      "tortilla chips",
      "corn tortilla chips",
      "plain tortilla chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "tortilla-chips",
      "plain-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 497,
      "protein": 6.2,
      "carbs": 67.0,
      "fat": 23.4,
      "fiber": 5.3,
      "sugar": 1.4,
      "sodiumMg": 498
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 139.2,
          "protein": 1.74,
          "carbs": 18.76,
          "fat": 6.55,
          "fiber": 1.48,
          "sugar": 0.39,
          "sodiumMg": 139.4
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "snackStyle": "plain-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-tortilla-chips-unsalted",
    "name": "Tortilla Chips, Unsalted",
    "displayName": "Unsalted Tortilla Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "unsalted",
    "aliases": [
      "Unsalted Tortilla Chips",
      "Tortilla Chips, Unsalted",
      "unsalted tortilla chips",
      "no salt tortilla chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "tortilla-chips",
      "unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 497,
      "protein": 6.2,
      "carbs": 67.0,
      "fat": 23.4,
      "fiber": 5.3,
      "sugar": 1.4,
      "sodiumMg": 25
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 139.2,
          "protein": 1.74,
          "carbs": 18.76,
          "fat": 6.55,
          "fiber": 1.48,
          "sugar": 0.39,
          "sodiumMg": 7.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "snackStyle": "unsalted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-corn-chips-plain-salted",
    "name": "Corn Chips, Plain, Salted",
    "displayName": "Plain Salted Corn Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "plain-salted",
    "aliases": [
      "Plain Salted Corn Chips",
      "Corn Chips, Plain, Salted",
      "corn chips",
      "plain corn chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "corn-chips",
      "plain-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 557,
      "protein": 6.2,
      "carbs": 57.0,
      "fat": 35.0,
      "fiber": 4.2,
      "sugar": 0.6,
      "sodiumMg": 875
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 156.0,
          "protein": 1.74,
          "carbs": 15.96,
          "fat": 9.8,
          "fiber": 1.18,
          "sugar": 0.17,
          "sodiumMg": 245.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "corn-chips",
      "snackStyle": "plain-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-pretzels-hard-salted",
    "name": "Pretzels, Hard, Salted",
    "displayName": "Hard Salted Pretzels",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "hard-salted",
    "aliases": [
      "Hard Salted Pretzels",
      "Pretzels, Hard, Salted",
      "pretzels",
      "hard pretzels",
      "salted pretzels"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "pretzels",
      "hard-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380,
      "protein": 10.0,
      "carbs": 80.0,
      "fat": 2.6,
      "fiber": 3.5,
      "sugar": 2.8,
      "sodiumMg": 1200
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 106.4,
          "protein": 2.8,
          "carbs": 22.4,
          "fat": 0.73,
          "fiber": 0.98,
          "sugar": 0.78,
          "sodiumMg": 336.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "snackStyle": "hard-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-pretzels-hard-unsalted",
    "name": "Pretzels, Hard, Unsalted",
    "displayName": "Hard Unsalted Pretzels",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "hard-unsalted",
    "aliases": [
      "Hard Unsalted Pretzels",
      "Pretzels, Hard, Unsalted",
      "unsalted pretzels",
      "no salt pretzels"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "pretzels",
      "hard-unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380,
      "protein": 10.0,
      "carbs": 80.0,
      "fat": 2.6,
      "fiber": 3.5,
      "sugar": 2.8,
      "sodiumMg": 50
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 106.4,
          "protein": 2.8,
          "carbs": 22.4,
          "fat": 0.73,
          "fiber": 0.98,
          "sugar": 0.78,
          "sodiumMg": 14.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "snackStyle": "hard-unsalted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-popcorn-air-popped",
    "name": "Popcorn, Air-Popped",
    "displayName": "Air-Popped Popcorn",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "air-popped",
    "aliases": [
      "Air-Popped Popcorn",
      "Popcorn, Air-Popped",
      "air popped popcorn",
      "plain popcorn",
      "popcorn no oil"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "popcorn",
      "air-popped"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 387,
      "protein": 12.9,
      "carbs": 77.8,
      "fat": 4.5,
      "fiber": 14.5,
      "sugar": 0.9,
      "sodiumMg": 8
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "3 cups (24 g)",
        "grams": 24,
        "isDefault": true,
        "nutrition": {
          "calories": 92.9,
          "protein": 3.1,
          "carbs": 18.67,
          "fat": 1.08,
          "fiber": 3.48,
          "sugar": 0.22,
          "sodiumMg": 1.9
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "popcorn",
      "snackStyle": "air-popped",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-popcorn-oil-popped-salted",
    "name": "Popcorn, Oil-Popped, Salted",
    "displayName": "Oil-Popped Salted Popcorn",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "oil-popped-salted",
    "aliases": [
      "Oil-Popped Salted Popcorn",
      "Popcorn, Oil-Popped, Salted",
      "oil popped popcorn",
      "salted popcorn",
      "movie style popcorn generic"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "popcorn",
      "oil-popped-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 583,
      "protein": 7.3,
      "carbs": 45.1,
      "fat": 43.6,
      "fiber": 8.1,
      "sugar": 0.5,
      "sodiumMg": 430
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "3 cups (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 163.2,
          "protein": 2.04,
          "carbs": 12.63,
          "fat": 12.21,
          "fiber": 2.27,
          "sugar": 0.14,
          "sodiumMg": 120.4
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "popcorn",
      "snackStyle": "oil-popped-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-kettle-corn",
    "name": "Kettle Corn",
    "displayName": "Kettle Corn",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "sweet-salted",
    "aliases": [
      "Kettle Corn",
      "kettle popcorn",
      "sweet salty popcorn",
      "kettle corn"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "popcorn",
      "sweet-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 430,
      "protein": 5.5,
      "carbs": 72.0,
      "fat": 14.0,
      "fiber": 7.0,
      "sugar": 20.0,
      "sodiumMg": 300
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 120.4,
          "protein": 1.54,
          "carbs": 20.16,
          "fat": 3.92,
          "fiber": 1.96,
          "sugar": 5.6,
          "sodiumMg": 84.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "popcorn",
      "snackStyle": "sweet-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-saltine-crackers",
    "name": "Saltine Crackers",
    "displayName": "Saltine Crackers",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "saltine",
    "aliases": [
      "Saltine Crackers",
      "saltines",
      "soda crackers",
      "saltine cracker"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "crackers",
      "saltine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 421,
      "protein": 9.0,
      "carbs": 74.0,
      "fat": 8.6,
      "fiber": 2.8,
      "sugar": 0.8,
      "sodiumMg": 1021
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "5 crackers (15 g)",
        "grams": 15,
        "isDefault": true,
        "nutrition": {
          "calories": 63.2,
          "protein": 1.35,
          "carbs": 11.1,
          "fat": 1.29,
          "fiber": 0.42,
          "sugar": 0.12,
          "sodiumMg": 153.2
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "snackStyle": "saltine",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-whole-wheat-crackers",
    "name": "Whole Wheat Crackers",
    "displayName": "Whole Wheat Crackers",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "whole-wheat",
    "aliases": [
      "Whole Wheat Crackers",
      "wheat crackers",
      "whole grain crackers",
      "whole wheat cracker"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "crackers",
      "whole-wheat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 455,
      "protein": 9.4,
      "carbs": 68.0,
      "fat": 17.4,
      "fiber": 6.9,
      "sugar": 6.0,
      "sodiumMg": 700
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 127.4,
          "protein": 2.63,
          "carbs": 19.04,
          "fat": 4.87,
          "fiber": 1.93,
          "sugar": 1.68,
          "sodiumMg": 196.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "snackStyle": "whole-wheat",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-cheese-crackers",
    "name": "Cheese Crackers",
    "displayName": "Cheese Crackers",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "cheese-flavored",
    "aliases": [
      "Cheese Crackers",
      "cheddar crackers",
      "cheese flavored crackers",
      "cheese snack crackers"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "crackers",
      "cheese-flavored"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 503,
      "protein": 10.0,
      "carbs": 59.0,
      "fat": 25.0,
      "fiber": 3.5,
      "sugar": 7.0,
      "sodiumMg": 1000
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 140.8,
          "protein": 2.8,
          "carbs": 16.52,
          "fat": 7.0,
          "fiber": 0.98,
          "sugar": 1.96,
          "sodiumMg": 280.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "snackStyle": "cheese-flavored",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-butter-crackers",
    "name": "Butter Crackers",
    "displayName": "Butter Crackers",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "buttery",
    "aliases": [
      "Butter Crackers",
      "buttery crackers",
      "round butter crackers"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "crackers",
      "buttery"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 492,
      "protein": 7.6,
      "carbs": 63.0,
      "fat": 23.0,
      "fiber": 2.5,
      "sugar": 7.0,
      "sodiumMg": 760
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 137.8,
          "protein": 2.13,
          "carbs": 17.64,
          "fat": 6.44,
          "fiber": 0.7,
          "sugar": 1.96,
          "sodiumMg": 212.8
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "snackStyle": "buttery",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-pita-chips-plain",
    "name": "Pita Chips, Plain",
    "displayName": "Plain Pita Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "plain",
    "aliases": [
      "Plain Pita Chips",
      "Pita Chips, Plain",
      "pita chips",
      "plain pita chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "pita-chips",
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
      "calories": 457,
      "protein": 9.0,
      "carbs": 69.0,
      "fat": 17.0,
      "fiber": 4.0,
      "sugar": 3.5,
      "sodiumMg": 650
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 128.0,
          "protein": 2.52,
          "carbs": 19.32,
          "fat": 4.76,
          "fiber": 1.12,
          "sugar": 0.98,
          "sodiumMg": 182.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pita-chips",
      "snackStyle": "plain",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-rice-crackers-plain",
    "name": "Rice Crackers, Plain",
    "displayName": "Plain Rice Crackers",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "plain",
    "aliases": [
      "Plain Rice Crackers",
      "Rice Crackers, Plain",
      "rice crackers",
      "plain rice crackers",
      "rice crisps"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "rice-crackers",
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
      "calories": 416,
      "protein": 10.0,
      "carbs": 82.0,
      "fat": 5.0,
      "fiber": 2.7,
      "sugar": 2.0,
      "sodiumMg": 333
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 116.5,
          "protein": 2.8,
          "carbs": 22.96,
          "fat": 1.4,
          "fiber": 0.76,
          "sugar": 0.56,
          "sodiumMg": 93.2
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "rice-crackers",
      "snackStyle": "plain",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-cheese-puffs",
    "name": "Cheese Puffs",
    "displayName": "Cheese Puffs",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "puffed-cheese-flavored",
    "aliases": [
      "Cheese Puffs",
      "cheese puffs",
      "cheese curls",
      "cheese puff snack"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "cheese-snacks",
      "puffed-cheese-flavored"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 560,
      "protein": 6.7,
      "carbs": 52.0,
      "fat": 36.7,
      "fiber": 1.5,
      "sugar": 3.0,
      "sodiumMg": 850
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 156.8,
          "protein": 1.88,
          "carbs": 14.56,
          "fat": 10.28,
          "fiber": 0.42,
          "sugar": 0.84,
          "sodiumMg": 238.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "cheese-snacks",
      "snackStyle": "puffed-cheese-flavored",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-cheese-curls",
    "name": "Cheese Curls",
    "displayName": "Cheese Curls",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "crunchy-cheese-flavored",
    "aliases": [
      "Cheese Curls",
      "cheese curls",
      "crunchy cheese snacks",
      "cheese crunchies"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "cheese-snacks",
      "crunchy-cheese-flavored"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 550,
      "protein": 6.5,
      "carbs": 53.0,
      "fat": 35.0,
      "fiber": 1.7,
      "sugar": 3.0,
      "sodiumMg": 900
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 154.0,
          "protein": 1.82,
          "carbs": 14.84,
          "fat": 9.8,
          "fiber": 0.48,
          "sugar": 0.84,
          "sodiumMg": 252.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "cheese-snacks",
      "snackStyle": "crunchy-cheese-flavored",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-savory-snack-mix",
    "name": "Savory Snack Mix",
    "displayName": "Savory Snack Mix",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "mixed-savory",
    "aliases": [
      "Savory Snack Mix",
      "snack mix",
      "party mix",
      "savory party mix",
      "cracker pretzel mix"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "snack-mix",
      "mixed-savory"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 497,
      "protein": 10.0,
      "carbs": 62.0,
      "fat": 24.0,
      "fiber": 4.0,
      "sugar": 5.0,
      "sodiumMg": 900
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 139.2,
          "protein": 2.8,
          "carbs": 17.36,
          "fat": 6.72,
          "fiber": 1.12,
          "sugar": 1.4,
          "sodiumMg": 252.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "snack-mix",
      "snackStyle": "mixed-savory",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  },
  {
    "id": "snacks-plantain-chips-salted",
    "name": "Plantain Chips, Salted",
    "displayName": "Salted Plantain Chips",
    "brand": null,
    "category": "snacks",
    "state": "solid",
    "preparation": "fried-salted",
    "aliases": [
      "Salted Plantain Chips",
      "Plantain Chips, Salted",
      "plantain chips",
      "fried plantain chips",
      "salted plantain chips"
    ],
    "tags": [
      "snacks",
      "generic",
      "savory-snack",
      "plantain-chips",
      "fried-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 531,
      "protein": 2.3,
      "carbs": 58.4,
      "fat": 33.6,
      "fiber": 3.5,
      "sugar": 17.0,
      "sodiumMg": 300
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 oz (28 g)",
        "grams": 28,
        "isDefault": true,
        "nutrition": {
          "calories": 148.7,
          "protein": 0.64,
          "carbs": 16.35,
          "fat": 9.41,
          "fiber": 0.98,
          "sugar": 4.76,
          "sodiumMg": 84.0
        }
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
    "source": "AriFoodSnacksCore",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "plantain-chips",
      "snackStyle": "fried-salted",
      "genericFood": true,
      "brandSpecific": false,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic snack references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic savory-snack fallback. Exact branded products and flavors should use AriFoodSnackBrands when available because calories, fat, sodium, sugar, and package serving size can differ materially."
    }
  }
]
  );

  function clone(value) {
    try {
      return typeof structuredClone === "function"
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function controllerKnowsThisModule() {
    if (!global.AriFoodSnacks) {
      return false;
    }

    if (
      typeof global.AriFoodSnacks.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodSnacks.isKnownModule(
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
      global.AriFoodSnacks &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodSnacks.markModuleFailed ===
        "function"
    ) {
      global.AriFoodSnacks.markModuleFailed(
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

  const registration =
    registry.registerMany(
      ARI_SNACK_CORE_FOODS,
      { source: MODULE_NAME }
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
        ARI_SNACK_CORE_FOODS.length,

      snackTypes:
        Array.from(
          new Set(
            ARI_SNACK_CORE_FOODS.map(
              food =>
                food.metadata?.snackType
            )
          )
        ),

      runtimeInternetRequired: false,
      genericCore: true,

      canonicalBasis: {
        type: "weight",
        amount: 100,
        unit: "g",
        grams: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} snack-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSnacks &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodSnacks.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSnacks.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodSnacksCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SNACK_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_SNACK_CORE_FOODS.map(
          food => food.id
        );
      },

      getSnackTypes() {
        return Array.from(
          new Set(
            ARI_SNACK_CORE_FOODS.map(
              food =>
                food.metadata?.snackType
            )
          )
        );
      },

      getBySnackType(snackType) {
        const normalized =
          normalizeText(snackType);

        return ARI_SNACK_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.snackType
              ) === normalized
          )
          .map(clone);
      },

      getByStyle(style) {
        const normalized =
          normalizeText(style);

        return ARI_SNACK_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.snackStyle
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SNACK_CORE_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? clone(record)
          : null;
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRegistrationResult() {
        return clone(registration);
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-snacks-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SNACK_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SNACK_CORE_FOODS.length} generic snack records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
