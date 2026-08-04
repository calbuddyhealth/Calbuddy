// =====================================================
// ARI REBIRTH
// File: AriFoodSnackBrands.js
// Version: 1.0.0
//
// Purpose:
//   Required branded savory-snack database for
//   ARI Nutrition's Snacks pathway.
//
// Collection:
//   AriFoodSnacks
//
// V1 brands:
//   - LAY'S
//   - Ruffles
//   - Doritos
//   - Tostitos
//   - Smartfood
//   - Cheetos
//   - Fritos
//   - SunChips
//   - Snyder's of Hanover
//   - Ritz
//   - Cheez-It
//   - Goldfish
//
// Coverage:
//   20 branded packaged snack products.
//
// Includes:
//   - Potato chips
//   - Tortilla chips
//   - Corn chips
//   - Whole-grain chips
//   - Cheese snacks
//   - Pretzels
//   - Popcorn
//   - Crackers
//
// Excludes:
//   - Nuts
//   - Candy / chocolate
//   - Cookies / desserts
//   - Protein / nutrition bars
//   - Granola bars
//   - Jerky / meat snacks
//
// Canonical basis:
//   100 g.
//
// Strategy:
//   Exact branded matches should outrank generic records
//   from AriFoodSnacksCore.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSnacks v1+
// =====================================================

(function initializeAriFoodSnackBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSnackBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "required branded savory-snack layer for the ARI Snacks pathway",
  "recordCount": 20,
  "brands": [
    "Cheetos",
    "Cheez-It",
    "Doritos",
    "Fritos",
    "Goldfish",
    "LAY'S",
    "Ritz",
    "Ruffles",
    "Smartfood",
    "Snyder's of Hanover",
    "SunChips",
    "Tostitos"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Exact branded snack records outrank AriFoodSnacksCore generic fallbacks.",
    "Preserve the package-label serving weight for every product.",
    "Normalize label nutrition mathematically to 100 g for registry consistency.",
    "Keep flavor variants separate when their nutrition differs.",
    "For label values shown as '<1 g', use a conservative fractional value only when needed for mathematical normalization and document it in metadata.notes.",
    "Do not infer how much of a bag or package the user consumed.",
    "Keep nuts, candy, cookies, desserts, bars, and jerky outside this pathway.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SNACK_BRAND_FOODS = Object.freeze(
[
  {
    "id": "snacks-brand-lays-classic-potato-chips",
    "name": "Classic Potato Chips",
    "displayName": "LAY'S Classic Potato Chips",
    "brand": "LAY'S",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "LAY'S Classic Potato Chips",
      "LAY'S",
      "Classic Potato Chips",
      "Lays Classic",
      "Lay's Classic Chips",
      "Lays Potato Chips"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "potato-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 7.143,
      "carbs": 53.571,
      "fat": 35.714,
      "fiber": 3.571,
      "sugar": 1.786,
      "sodiumMg": 500.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 15 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "potato-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 15 chips (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 2,
        "carbs": 15,
        "fat": 10,
        "fiber": 1,
        "sugar": 0.5,
        "sodiumMg": 140
      },
      "sourceProvenance": {
        "provider": "LAY'S",
        "sourceType": "current manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400017145-0004-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Total sugars are labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-ruffles-original-potato-chips",
    "name": "Original Potato Chips",
    "displayName": "Ruffles Original Potato Chips",
    "brand": "Ruffles",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Ruffles Original Potato Chips",
      "Ruffles",
      "Original Potato Chips",
      "Ruffles Original",
      "Ruffles Chips"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "potato-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 7.143,
      "carbs": 53.571,
      "fat": 35.714,
      "fiber": 3.571,
      "sugar": 1.786,
      "sodiumMg": 500.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 12 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "potato-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 12 chips (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 2,
        "carbs": 15,
        "fat": 10,
        "fiber": 1,
        "sugar": 0.5,
        "sodiumMg": 140
      },
      "sourceProvenance": {
        "provider": "Ruffles",
        "sourceType": "current manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400516686-0023-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Total sugars are labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-doritos-nacho-cheese",
    "name": "Nacho Cheese Flavored Tortilla Chips",
    "displayName": "Doritos Nacho Cheese Flavored Tortilla Chips",
    "brand": "Doritos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Doritos Nacho Cheese Flavored Tortilla Chips",
      "Doritos",
      "Nacho Cheese Flavored Tortilla Chips",
      "Doritos Nacho Cheese",
      "Nacho Cheese Doritos"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "tortilla-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 535.714,
      "protein": 7.143,
      "carbs": 60.714,
      "fat": 28.571,
      "fiber": 3.571,
      "sugar": 1.786,
      "sodiumMg": 607.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 11 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 11 chips (28 g)",
        "servingGrams": 28,
        "calories": 150,
        "protein": 2,
        "carbs": 17,
        "fat": 8,
        "fiber": 1,
        "sugar": 0.5,
        "sodiumMg": 170
      },
      "sourceProvenance": {
        "provider": "Doritos",
        "sourceType": "current manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400770590-0001-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Total sugars are labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-doritos-cool-ranch",
    "name": "Cool Ranch Flavored Tortilla Chips",
    "displayName": "Doritos Cool Ranch Flavored Tortilla Chips",
    "brand": "Doritos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Doritos Cool Ranch Flavored Tortilla Chips",
      "Doritos",
      "Cool Ranch Flavored Tortilla Chips",
      "Doritos Cool Ranch",
      "Cool Ranch Doritos"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "tortilla-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 535.714,
      "protein": 7.143,
      "carbs": 64.286,
      "fat": 25.0,
      "fiber": 3.571,
      "sugar": 1.786,
      "sodiumMg": 571.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 11 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 11 chips (28 g)",
        "servingGrams": 28,
        "calories": 150,
        "protein": 2,
        "carbs": 18,
        "fat": 7,
        "fiber": 1,
        "sugar": 0.5,
        "sodiumMg": 160
      },
      "sourceProvenance": {
        "provider": "Doritos",
        "sourceType": "current manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400077712-0012-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Total sugars are labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-tostitos-original-restaurant-style",
    "name": "Original Restaurant Style Tortilla Chips",
    "displayName": "Tostitos Original Restaurant Style Tortilla Chips",
    "brand": "Tostitos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Tostitos Original Restaurant Style Tortilla Chips",
      "Tostitos",
      "Original Restaurant Style Tortilla Chips",
      "Tostitos Restaurant Style",
      "Tostitos Original"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "tortilla-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500.0,
      "protein": 7.143,
      "carbs": 67.857,
      "fat": 25.0,
      "fiber": 3.571,
      "sugar": 0.0,
      "sodiumMg": 410.714
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 7 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 7 chips (28 g)",
        "servingGrams": 28,
        "calories": 140,
        "protein": 2,
        "carbs": 19,
        "fat": 7,
        "fiber": 1,
        "sugar": 0,
        "sodiumMg": 115
      },
      "sourceProvenance": {
        "provider": "Tostitos",
        "sourceType": "manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400620635-0001-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-tostitos-multigrain-scoops",
    "name": "Multigrain Scoops Tortilla Chips",
    "displayName": "Tostitos Multigrain Scoops Tortilla Chips",
    "brand": "Tostitos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Tostitos Multigrain Scoops Tortilla Chips",
      "Tostitos",
      "Multigrain Scoops Tortilla Chips",
      "Tostitos Multigrain Scoops",
      "Multigrain Scoops"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "tortilla-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500.0,
      "protein": 7.143,
      "carbs": 67.857,
      "fat": 21.429,
      "fiber": 3.571,
      "sugar": 3.571,
      "sodiumMg": 375.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 11 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 11 chips (28 g)",
        "servingGrams": 28,
        "calories": 140,
        "protein": 2,
        "carbs": 19,
        "fat": 6,
        "fiber": 1,
        "sugar": 1,
        "sodiumMg": 105
      },
      "sourceProvenance": {
        "provider": "Tostitos",
        "sourceType": "manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400036337-0015-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-tostitos-baked-scoops",
    "name": "Baked Scoops Tortilla Chips",
    "displayName": "Tostitos Baked Scoops Tortilla Chips",
    "brand": "Tostitos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Tostitos Baked Scoops Tortilla Chips",
      "Tostitos",
      "Baked Scoops Tortilla Chips",
      "Tostitos Baked Scoops",
      "Baked Tostitos Scoops"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "tortilla-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 428.571,
      "protein": 7.143,
      "carbs": 78.571,
      "fat": 10.714,
      "fiber": 7.143,
      "sugar": 0.0,
      "sodiumMg": 500.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 16 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "tortilla-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 16 chips (28 g)",
        "servingGrams": 28,
        "calories": 120,
        "protein": 2,
        "carbs": 22,
        "fat": 3,
        "fiber": 2,
        "sugar": 0,
        "sodiumMg": 140
      },
      "sourceProvenance": {
        "provider": "Tostitos",
        "sourceType": "manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400025102-0002-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-smartfood-white-cheddar-popcorn",
    "name": "White Cheddar Popcorn",
    "displayName": "Smartfood White Cheddar Popcorn",
    "brand": "Smartfood",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Smartfood White Cheddar Popcorn",
      "Smartfood",
      "White Cheddar Popcorn",
      "Smartfood White Cheddar",
      "White Cheddar Smartfood"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "popcorn"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 10.714,
      "carbs": 53.571,
      "fat": 35.714,
      "fiber": 7.143,
      "sugar": 7.143,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 2 1/2 cups (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "popcorn",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 2 1/2 cups (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 3,
        "carbs": 15,
        "fat": 10,
        "fiber": 2,
        "sugar": 2,
        "sodiumMg": 200
      },
      "sourceProvenance": {
        "provider": "Smartfood",
        "sourceType": "current manufacturer SmartLabel nutrition",
        "sourceUrl": "https://smartlabel.pepsico.info/028400800419-0001-en-US/index.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-cheetos-crunchy",
    "name": "Crunchy Cheese Flavored Snacks",
    "displayName": "Cheetos Crunchy Cheese Flavored Snacks",
    "brand": "Cheetos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Cheetos Crunchy Cheese Flavored Snacks",
      "Cheetos",
      "Crunchy Cheese Flavored Snacks",
      "Cheetos Crunchy",
      "Crunchy Cheetos"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "cheese-snacks"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 7.143,
      "carbs": 53.571,
      "fat": 35.714,
      "fiber": 3.571,
      "sugar": 3.571,
      "sodiumMg": 892.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "cheese-snacks",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 2,
        "carbs": 15,
        "fat": 10,
        "fiber": 1,
        "sugar": 1,
        "sodiumMg": 250
      },
      "sourceProvenance": {
        "provider": "Cheetos",
        "sourceType": "packaged-food nutrition reference",
        "sourceUrl": "https://tools.myfooddata.com/nutrition-facts/1371785/wt1/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-fritos-original-corn-chips",
    "name": "Original Corn Chips",
    "displayName": "Fritos Original Corn Chips",
    "brand": "Fritos",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Fritos Original Corn Chips",
      "Fritos",
      "Original Corn Chips",
      "Fritos Original",
      "Original Fritos"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "corn-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 7.143,
      "carbs": 57.143,
      "fat": 35.714,
      "fiber": 3.571,
      "sugar": 0.0,
      "sodiumMg": 607.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "corn-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 2,
        "carbs": 16,
        "fat": 10,
        "fiber": 1,
        "sugar": 0,
        "sodiumMg": 170
      },
      "sourceProvenance": {
        "provider": "Fritos",
        "sourceType": "packaged-food nutrition reference",
        "sourceUrl": "https://tools.myfooddata.com/nutrition-facts/1727292/wt1/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-sunchips-harvest-cheddar",
    "name": "Harvest Cheddar Whole Grain Snacks",
    "displayName": "SunChips Harvest Cheddar Whole Grain Snacks",
    "brand": "SunChips",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "SunChips Harvest Cheddar Whole Grain Snacks",
      "SunChips",
      "Harvest Cheddar Whole Grain Snacks",
      "Sun Chips Harvest Cheddar",
      "Sunchips Cheddar"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "whole-grain-chips"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500.0,
      "protein": 7.143,
      "carbs": 64.286,
      "fat": 25.0,
      "fiber": 7.143,
      "sugar": 7.143,
      "sodiumMg": 607.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 29 chips (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "whole-grain-chips",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "About 29 chips (28 g)",
        "servingGrams": 28,
        "calories": 140,
        "protein": 2,
        "carbs": 18,
        "fat": 7,
        "fiber": 2,
        "sugar": 2,
        "sodiumMg": 170
      },
      "sourceProvenance": {
        "provider": "SunChips",
        "sourceType": "packaged-food nutrition reference",
        "sourceUrl": "https://tools.myfooddata.com/nutrition-facts/2667518/wt1/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-snyders-mini-pretzels",
    "name": "Mini Pretzels",
    "displayName": "Snyder's of Hanover Mini Pretzels",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Mini Pretzels",
      "Snyder's of Hanover",
      "Mini Pretzels",
      "Snyders Mini Pretzels",
      "Snyder's Mini"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.857,
      "protein": 10.714,
      "carbs": 82.143,
      "fat": 1.786,
      "fiber": 1.786,
      "sugar": 1.786,
      "sodiumMg": 892.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 19 pretzels (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 19 pretzels (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 3,
        "carbs": 23,
        "fat": 0.5,
        "fiber": 0.5,
        "sugar": 0.5,
        "sodiumMg": 250
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.snydersofhanover.com/products/mini/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber and total sugars are labeled <1 g; stored as 0.5 g each for normalization."
    }
  },
  {
    "id": "snacks-brand-snyders-thins-pretzels",
    "name": "Thins Pretzels",
    "displayName": "Snyder's of Hanover Thins Pretzels",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Thins Pretzels",
      "Snyder's of Hanover",
      "Thins Pretzels",
      "Snyders Thins",
      "Snyder's Pretzel Thins"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.857,
      "protein": 10.714,
      "carbs": 82.143,
      "fat": 1.786,
      "fiber": 1.786,
      "sugar": 1.786,
      "sodiumMg": 1000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 11 pretzels (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 11 pretzels (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 3,
        "carbs": 23,
        "fat": 0.5,
        "fiber": 0.5,
        "sugar": 0.5,
        "sodiumMg": 280
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.snydersofhanover.com/thins/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber and total sugars are labeled <1 g; stored as 0.5 g each for normalization."
    }
  },
  {
    "id": "snacks-brand-snyders-unsalted-mini-pretzels",
    "name": "Unsalted Mini Pretzels",
    "displayName": "Snyder's of Hanover Unsalted Mini Pretzels",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Unsalted Mini Pretzels",
      "Snyder's of Hanover",
      "Unsalted Mini Pretzels",
      "Snyders Unsalted Mini",
      "Snyder's Unsalted Pretzels"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.857,
      "protein": 10.714,
      "carbs": 82.143,
      "fat": 1.786,
      "fiber": 1.786,
      "sugar": 1.786,
      "sodiumMg": 321.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 19 pretzels (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 19 pretzels (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 3,
        "carbs": 23,
        "fat": 0.5,
        "fiber": 0.5,
        "sugar": 0.5,
        "sodiumMg": 90
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.snydersofhanover.com/products/unsalted-mini/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber and total sugars are labeled <1 g; stored as 0.5 g each for normalization."
    }
  },
  {
    "id": "snacks-brand-snyders-butter-rounds",
    "name": "Butter Flavored Mini Pretzel Rounds",
    "displayName": "Snyder's of Hanover Butter Flavored Mini Pretzel Rounds",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Butter Flavored Mini Pretzel Rounds",
      "Snyder's of Hanover",
      "Butter Flavored Mini Pretzel Rounds",
      "Snyders Butter Rounds",
      "Snyder's Butter Pretzel Rounds"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 428.571,
      "protein": 7.143,
      "carbs": 75.0,
      "fat": 10.714,
      "fiber": 1.786,
      "sugar": 3.571,
      "sodiumMg": 785.714
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 1/2 cup (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 1/2 cup (28 g)",
        "servingGrams": 28,
        "calories": 120,
        "protein": 2,
        "carbs": 21,
        "fat": 3,
        "fiber": 0.5,
        "sugar": 1,
        "sodiumMg": 220
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.snydersofhanover.com/products/butter-rounds/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber is labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-snyders-sea-salt-rounds",
    "name": "Sea Salt Mini Pretzel Rounds",
    "displayName": "Snyder's of Hanover Sea Salt Mini Pretzel Rounds",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Sea Salt Mini Pretzel Rounds",
      "Snyder's of Hanover",
      "Sea Salt Mini Pretzel Rounds",
      "Snyders Sea Salt Rounds",
      "Snyder's Sea Salt Pretzel Rounds"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 428.571,
      "protein": 10.714,
      "carbs": 75.0,
      "fat": 10.714,
      "fiber": 1.786,
      "sugar": 3.571,
      "sodiumMg": 785.714
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 1/2 cup (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 1/2 cup (28 g)",
        "servingGrams": 28,
        "calories": 120,
        "protein": 3,
        "carbs": 21,
        "fat": 3,
        "fiber": 0.5,
        "sugar": 1,
        "sodiumMg": 220
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.snydersofhanover.com/products/sea-salt/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber is labeled <1 g; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "snacks-brand-snyders-gluten-free-mini-pretzels",
    "name": "Gluten-Free Mini Pretzels",
    "displayName": "Snyder's of Hanover Gluten-Free Mini Pretzels",
    "brand": "Snyder's of Hanover",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Snyder's of Hanover Gluten-Free Mini Pretzels",
      "Snyder's of Hanover",
      "Gluten-Free Mini Pretzels",
      "Snyders Gluten Free Mini",
      "Snyder's Gluten Free Pretzels"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "pretzels"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.857,
      "protein": 0.0,
      "carbs": 78.571,
      "fat": 7.143,
      "fiber": 0.0,
      "sugar": 3.571,
      "sodiumMg": 1571.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "About 23 pretzels (28 g)",
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "pretzels",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "About 23 pretzels (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 0,
        "carbs": 22,
        "fat": 2,
        "fiber": 0,
        "sugar": 1,
        "sodiumMg": 440
      },
      "sourceProvenance": {
        "provider": "Snyder's of Hanover",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://snydersofhanover.com/products/gf-mini-pretzels/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 28 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-ritz-original-crackers",
    "name": "Original Crackers",
    "displayName": "Ritz Original Crackers",
    "brand": "Ritz",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Ritz Original Crackers",
      "Ritz",
      "Original Crackers",
      "Ritz Crackers",
      "Ritz Original"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "crackers"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500.0,
      "protein": 6.25,
      "carbs": 62.5,
      "fat": 28.125,
      "fiber": 0.0,
      "sugar": 6.25,
      "sodiumMg": 656.25
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "5 crackers (16 g)",
        "grams": 16,
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "5 crackers (16 g)",
        "servingGrams": 16,
        "calories": 80,
        "protein": 1,
        "carbs": 10,
        "fat": 4.5,
        "fiber": 0,
        "sugar": 1,
        "sodiumMg": 105
      },
      "sourceProvenance": {
        "provider": "Ritz",
        "sourceType": "current retailer package nutrition",
        "sourceUrl": "https://www.kroger.com/p/ritz-original-crackers-family-size/0004400003442",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 16 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Exact branded savory-snack record. Prefer this over AriFoodSnacksCore when the user's brand/product matches."
    }
  },
  {
    "id": "snacks-brand-cheez-it-original",
    "name": "Original Baked Snack Crackers",
    "displayName": "Cheez-It Original Baked Snack Crackers",
    "brand": "Cheez-It",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Cheez-It Original Baked Snack Crackers",
      "Cheez-It",
      "Original Baked Snack Crackers",
      "Cheez It Original",
      "Cheez-It Original Crackers"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "crackers"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 500.0,
      "protein": 10.0,
      "carbs": 56.667,
      "fat": 26.667,
      "fiber": 1.667,
      "sugar": 0.0,
      "sodiumMg": 766.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "27 crackers (30 g)",
        "grams": 30,
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "27 crackers (30 g)",
        "servingGrams": 30,
        "calories": 150,
        "protein": 3,
        "carbs": 17,
        "fat": 8,
        "fiber": 0.5,
        "sugar": 0,
        "sodiumMg": 230
      },
      "sourceProvenance": {
        "provider": "Cheez-It",
        "sourceType": "current packaged-food nutrition reference",
        "sourceUrl": "https://www.eatthismuch.com/calories/original-baked-snack-crackers-4113012",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 30 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber is represented as 0.5 g for a label value under 1 g."
    }
  },
  {
    "id": "snacks-brand-goldfish-cheddar-crackers",
    "name": "Cheddar Crackers",
    "displayName": "Goldfish Cheddar Crackers",
    "brand": "Goldfish",
    "category": "snacks",
    "state": "solid",
    "preparation": "packaged-ready-to-eat",
    "aliases": [
      "Goldfish Cheddar Crackers",
      "Goldfish",
      "Cheddar Crackers",
      "Goldfish Cheddar",
      "Pepperidge Farm Goldfish Cheddar"
    ],
    "tags": [
      "snacks",
      "branded",
      "packaged",
      "savory-snack",
      "crackers"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 466.667,
      "protein": 10.0,
      "carbs": 66.667,
      "fat": 16.667,
      "fiber": 1.667,
      "sugar": 0.0,
      "sodiumMg": 833.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "55 pieces (30 g)",
        "grams": 30,
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
    "source": "AriFoodSnackBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "snacks",
      "snackType": "crackers",
      "brandSpecific": true,
      "packagedProduct": true,
      "savorySnack": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "55 pieces (30 g)",
        "servingGrams": 30,
        "calories": 140,
        "protein": 3,
        "carbs": 20,
        "fat": 5,
        "fiber": 0.5,
        "sugar": 0,
        "sodiumMg": 250
      },
      "sourceProvenance": {
        "provider": "Goldfish",
        "sourceType": "current retailer package nutrition",
        "sourceUrl": "https://www.gopuff.com/p/goldfish-cheddar-crackers-6-6oz/p14990",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Package-label nutrition for 30 g was normalized mathematically to the ARI Snacks canonical basis of 100 g.",
      "notes": "Dietary fiber is labeled less than 1 g; stored as 0.5 g for normalization."
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
      ARI_SNACK_BRAND_FOODS,
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
        ARI_SNACK_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_SNACK_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_SNACK_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      snackTypes:
        Array.from(
          new Set(
            ARI_SNACK_BRAND_FOODS.map(
              food =>
                food.metadata?.snackType
            )
          )
        ),

      runtimeInternetRequired: false,
      brandSpecific: true,

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
      `Registration rejected ${registration.rejected} snack-brand record(s).`,
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

  global.AriFoodSnackBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SNACK_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_SNACK_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_SNACK_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getSnackTypes() {
        return Array.from(
          new Set(
            ARI_SNACK_BRAND_FOODS.map(
              food =>
                food.metadata?.snackType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_SNACK_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) ===
              normalized
          )
          .map(clone);
      },

      getBySnackType(snackType) {
        const normalized =
          normalizeText(snackType);

        return ARI_SNACK_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.snackType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SNACK_BRAND_FOODS.find(
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
        "ari:food-snack-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SNACK_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SNACK_BRAND_FOODS.length} branded snack records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
