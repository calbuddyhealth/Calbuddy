// =====================================================
// ARI REBIRTH
// File: AriFoodSeasoningBrands.js
// Version: 1.0.0
//
// Purpose:
//   Required branded dry-seasoning database for
//   ARI Nutrition's Seasonings pathway.
//
// Collection:
//   AriFoodSeasonings
//
// V1 brands:
//   - TAJÍN
//   - OLD BAY
//   - Lawry's
//   - Dash
//   - Tony Chachere's
//
// Coverage:
//   20 branded seasoning products.
//
// Includes:
//   - Chili-lime seasoning
//   - Seasoned salt
//   - Seafood seasoning
//   - Salt-free seasoning blends
//   - Creole seasoning
//
// Excludes:
//   - Liquid sauces
//   - Marinades
//   - Hot sauces
//   - Cooking oils
//
// Canonical basis:
//   100 g.
//
// Important:
//   Branded seasoning label servings are tiny and subject
//   to FDA rounding. Preserve metadata.labelNutrition for
//   direct serving calculations.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSeasonings v1+
// =====================================================

(function initializeAriFoodSeasoningBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSeasoningBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "required branded dry-seasoning layer for the ARI Seasonings pathway",
  "recordCount": 20,
  "brands": [
    "Dash",
    "Lawry's",
    "OLD BAY",
    "TAJÍN",
    "Tony Chachere's"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Exact branded seasoning records outrank AriFoodSeasoningsCore generic fallbacks.",
    "Preserve manufacturer/package label serving weights.",
    "Normalize label nutrition mathematically to 100 g for registry consistency.",
    "For actual branded serving calculations, prefer metadata.labelNutrition because tiny FDA serving sizes can create exaggerated normalized values due to label rounding.",
    "Keep liquid hot sauces, marinades, and condiments in AriFoodCondiments.",
    "Keep cooking oils in AriFoodOils.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SEASONING_BRAND_FOODS = Object.freeze(
[
  {
    "id": "seasonings-brand-tajin-clasico",
    "name": "Clásico Seasoning",
    "displayName": "TAJÍN Clásico Seasoning",
    "brand": "TAJÍN",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "TAJÍN Clásico Seasoning",
      "TAJÍN",
      "Clásico Seasoning",
      "Tajin Clasico",
      "Tajín Clásico",
      "Tajin seasoning"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "chili-lime-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 19000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1 g)",
        "grams": 1.0,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "chili-lime-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1 g)",
        "servingGrams": 1.0,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 190
      },
      "sourceProvenance": {
        "provider": "TAJÍN",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.tajin.com/us/tajin-clasico-seasoning-new/",
        "nutritionUrl": "https://www.tajin.com/us/tajin-clasico-seasoning-new/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.0 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-tajin-clasico-reduced-sodium",
    "name": "Clásico Seasoning Reduced Sodium",
    "displayName": "TAJÍN Clásico Seasoning Reduced Sodium",
    "brand": "TAJÍN",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "TAJÍN Clásico Seasoning Reduced Sodium",
      "TAJÍN",
      "Clásico Seasoning Reduced Sodium",
      "Tajin Reduced Sodium",
      "Tajín Bajo en Sodio"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "chili-lime-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 12000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1 g)",
        "grams": 1.0,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "chili-lime-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1 g)",
        "servingGrams": 1.0,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 120
      },
      "sourceProvenance": {
        "provider": "TAJÍN",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.tajin.com/ca/product/tajin-clasico-seasoning-reduced-sodium/",
        "nutritionUrl": "https://www.tajin.com/ca/product/tajin-clasico-seasoning-reduced-sodium/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.0 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-old-bay-original",
    "name": "Seasoning",
    "displayName": "OLD BAY Seasoning",
    "brand": "OLD BAY",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "OLD BAY Seasoning",
      "OLD BAY",
      "Seasoning",
      "Old Bay",
      "Old Bay Original",
      "Old Bay Classic"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seafood-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 20833.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.6 g)",
        "grams": 0.6,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seafood-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.6 g)",
        "servingGrams": 0.6,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 125
      },
      "sourceProvenance": {
        "provider": "OLD BAY",
        "sourceType": "official manufacturer current product identity + current supplier label data",
        "sourceUrl": "https://www.mccormick.com/collections/old-bay-seasonings",
        "nutritionUrl": "https://www.shoprite.com/product/old-bay-classic-seafood-seasoning-6-oz-id-00070328005230",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.6 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-old-bay-hot",
    "name": "Hot Seasoning",
    "displayName": "OLD BAY Hot Seasoning",
    "brand": "OLD BAY",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "OLD BAY Hot Seasoning",
      "OLD BAY",
      "Hot Seasoning",
      "Old Bay Hot",
      "Hot Old Bay"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seafood-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 19285.714
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seafood-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 135
      },
      "sourceProvenance": {
        "provider": "OLD BAY",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/products/old-bay-hot-seasoning-2-5-oz",
        "nutritionUrl": "https://www.mccormick.com/products/old-bay-hot-seasoning-2-5-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-old-bay-less-sodium",
    "name": "30% Less Sodium Seasoning",
    "displayName": "OLD BAY 30% Less Sodium Seasoning",
    "brand": "OLD BAY",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "OLD BAY 30% Less Sodium Seasoning",
      "OLD BAY",
      "30% Less Sodium Seasoning",
      "Old Bay Less Sodium",
      "Old Bay Reduced Sodium"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seafood-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 14166.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.6 g)",
        "grams": 0.6,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seafood-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.6 g)",
        "servingGrams": 0.6,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 85
      },
      "sourceProvenance": {
        "provider": "OLD BAY",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/products/old-bay-less-sodium-seasoning-2-62-oz",
        "nutritionUrl": "https://www.mccormick.com/products/old-bay-less-sodium-seasoning-2-62-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.6 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-old-bay-garlic-herb",
    "name": "Garlic Herb Seasoning",
    "displayName": "OLD BAY Garlic Herb Seasoning",
    "brand": "OLD BAY",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "OLD BAY Garlic Herb Seasoning",
      "OLD BAY",
      "Garlic Herb Seasoning",
      "Old Bay Garlic Herb",
      "Garlic Herb Old Bay"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seafood-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 25000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.3 g)",
        "grams": 0.3,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seafood-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.3 g)",
        "servingGrams": 0.3,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 75
      },
      "sourceProvenance": {
        "provider": "OLD BAY",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/products/old-bay-garlic-herb-seasoning-2-62-oz",
        "nutritionUrl": "https://www.mccormick.com/products/old-bay-garlic-herb-seasoning-2-62-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.3 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-old-bay-lemon-herb",
    "name": "Lemon Herb Seasoning",
    "displayName": "OLD BAY Lemon Herb Seasoning",
    "brand": "OLD BAY",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "OLD BAY Lemon Herb Seasoning",
      "OLD BAY",
      "Lemon Herb Seasoning",
      "Old Bay Lemon Herb",
      "Lemon Herb Old Bay"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seafood-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 18571.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seafood-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 130
      },
      "sourceProvenance": {
        "provider": "OLD BAY",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/products/old-bay-lemon-herb-seasoning-3-oz",
        "nutritionUrl": "https://www.mccormick.com/products/old-bay-lemon-herb-seasoning-3-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-lawrys-seasoned-salt",
    "name": "Seasoned Salt",
    "displayName": "Lawry's Seasoned Salt",
    "brand": "Lawry's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Lawry's Seasoned Salt",
      "Lawry's",
      "Seasoned Salt",
      "Lawrys Seasoned Salt",
      "Lawry's Seasoning Salt"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seasoned-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 31666.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1.2 g)",
        "grams": 1.2,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seasoned-salt",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1.2 g)",
        "servingGrams": 1.2,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 380
      },
      "sourceProvenance": {
        "provider": "Lawry's",
        "sourceType": "official manufacturer current product identity + current supplier label data",
        "sourceUrl": "https://www.mccormick.com/collections/lawrys-spice-blends/products/lawrys-seasoned-salt-8-oz",
        "nutritionUrl": "https://www.costco.com/p/-/lawrys-seasoned-salt-40-oz/100403323",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.2 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-lawrys-25-less-sodium-seasoned-salt",
    "name": "25% Less Sodium Seasoned Salt",
    "displayName": "Lawry's 25% Less Sodium Seasoned Salt",
    "brand": "Lawry's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Lawry's 25% Less Sodium Seasoned Salt",
      "Lawry's",
      "25% Less Sodium Seasoned Salt",
      "Lawrys Less Sodium Seasoned Salt",
      "Lawry's Reduced Sodium Seasoned Salt"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seasoned-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 22500.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1.2 g)",
        "grams": 1.2,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seasoned-salt",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1.2 g)",
        "servingGrams": 1.2,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 270
      },
      "sourceProvenance": {
        "provider": "Lawry's",
        "sourceType": "official manufacturer current product identity + current package label reference",
        "sourceUrl": "https://www.mccormick.com/products/lawrys-25-less-sodium-seasoned-salt-8-oz",
        "nutritionUrl": "https://www.mccormick.com/products/lawrys-25-less-sodium-seasoned-salt-8-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.2 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-lawrys-fry-seasoning",
    "name": "Fry Seasoning",
    "displayName": "Lawry's Fry Seasoning",
    "brand": "Lawry's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Lawry's Fry Seasoning",
      "Lawry's",
      "Fry Seasoning",
      "Lawrys Fry Seasoning",
      "Lawry's French Fry Seasoning"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "seasoning-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 18750.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.8 g)",
        "grams": 0.8,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "seasoning-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.8 g)",
        "servingGrams": 0.8,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 150
      },
      "sourceProvenance": {
        "provider": "Lawry's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/products/lawrys-fry-seasoning-5-360-oz",
        "nutritionUrl": "https://www.mccormick.com/products/lawrys-fry-seasoning-5-360-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.8 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-original",
    "name": "Original Blend",
    "displayName": "Dash Original Salt-Free Seasoning Blend",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Original Salt-Free Seasoning Blend",
      "Dash",
      "Original Blend",
      "Mrs Dash Original",
      "Dash Original Blend"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 142.857,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/original-blend/",
        "nutritionUrl": "https://mrsdash.com/products/original-blend/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-garlic-herb",
    "name": "Garlic & Herb",
    "displayName": "Dash Garlic & Herb Salt-Free Seasoning Blend",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Garlic & Herb Salt-Free Seasoning Blend",
      "Dash",
      "Garlic & Herb",
      "Mrs Dash Garlic Herb",
      "Dash Garlic and Herb"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 142.857,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/garlic-herb-seasoning-blend/",
        "nutritionUrl": "https://mrsdash.com/products/garlic-herb-seasoning-blend/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-everything-but-salt",
    "name": "Everything But the Salt",
    "displayName": "Dash Everything But the Salt",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Everything But the Salt",
      "Dash",
      "Everything But the Salt",
      "Mrs Dash Everything But Salt",
      "Dash Everything Seasoning"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 111.111,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.9 g)",
        "grams": 0.9,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.9 g)",
        "servingGrams": 0.9,
        "calories": 0,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/everything-but-the-salt/",
        "nutritionUrl": "https://mrsdash.com/products/everything-but-the-salt/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.9 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-fiesta-lime",
    "name": "Fiesta Lime",
    "displayName": "Dash Fiesta Lime Salt-Free Seasoning Blend",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Fiesta Lime Salt-Free Seasoning Blend",
      "Dash",
      "Fiesta Lime",
      "Mrs Dash Fiesta Lime",
      "Dash Fiesta Lime"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/fiesta-lime-seasoning-blend/",
        "nutritionUrl": "https://mrsdash.com/products/fiesta-lime-seasoning-blend/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-lemon-pepper",
    "name": "Lemon Pepper",
    "displayName": "Dash Lemon Pepper Salt-Free Seasoning Blend",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Lemon Pepper Salt-Free Seasoning Blend",
      "Dash",
      "Lemon Pepper",
      "Mrs Dash Lemon Pepper",
      "Dash Lemon Pepper"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 142.857,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.7 g)",
        "grams": 0.7,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.7 g)",
        "servingGrams": 0.7,
        "calories": 0,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/lemon-pepper-seasoning-blend/",
        "nutritionUrl": "https://mrsdash.com/products/lemon-pepper-seasoning-blend/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.7 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-dash-italian-medley",
    "name": "Italian Medley",
    "displayName": "Dash Italian Medley Salt-Free Seasoning Blend",
    "brand": "Dash",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Dash Italian Medley Salt-Free Seasoning Blend",
      "Dash",
      "Italian Medley",
      "Mrs Dash Italian Medley",
      "Dash Italian Seasoning"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.6 g)",
        "grams": 0.6,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.6 g)",
        "servingGrams": 0.6,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Dash",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://mrsdash.com/products/italian-medley-seasoning-blend/",
        "nutritionUrl": "https://mrsdash.com/products/italian-medley-seasoning-blend/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.6 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-tony-chacheres-original-creole",
    "name": "Original Creole Seasoning",
    "displayName": "Tony Chachere's Original Creole Seasoning",
    "brand": "Tony Chachere's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Tony Chachere's Original Creole Seasoning",
      "Tony Chachere's",
      "Original Creole Seasoning",
      "Tony's Original",
      "Tony Chacheres Original",
      "Tony's Creole Seasoning"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "creole-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 30909.091
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1.1 g)",
        "grams": 1.1,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "creole-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1.1 g)",
        "servingGrams": 1.1,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 340
      },
      "sourceProvenance": {
        "provider": "Tony Chachere's",
        "sourceType": "official manufacturer current product + official manufacturer catalog nutrition",
        "sourceUrl": "https://www.tonychachere.com/product/original-creole-seasoning/",
        "nutritionUrl": "https://www.tonychachere.com/wp-content/uploads/2024/04/Tony-Chacheres-Digital-Catalog-4-16-24.pdf",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.1 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-tony-chacheres-more-spice",
    "name": "More Spice Seasoning",
    "displayName": "Tony Chachere's More Spice Seasoning",
    "brand": "Tony Chachere's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Tony Chachere's More Spice Seasoning",
      "Tony Chachere's",
      "More Spice Seasoning",
      "Tony's More Spice",
      "Tony Chacheres More Spice"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "creole-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 29000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1 g)",
        "grams": 1.0,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "creole-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1 g)",
        "servingGrams": 1.0,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 290
      },
      "sourceProvenance": {
        "provider": "Tony Chachere's",
        "sourceType": "official manufacturer current product + current package nutrition reference",
        "sourceUrl": "https://www.tonychachere.com/product/more-spice-seasoning/",
        "nutritionUrl": "https://www.cajungrocer.com/foods/tony-chacheres-more-spice-seasoning-30oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.0 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-tony-chacheres-bold",
    "name": "BOLD Creole Seasoning",
    "displayName": "Tony Chachere's BOLD Creole Seasoning",
    "brand": "Tony Chachere's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Tony Chachere's BOLD Creole Seasoning",
      "Tony Chachere's",
      "BOLD Creole Seasoning",
      "Tony's Bold",
      "Tony Chacheres Bold"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "creole-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 29000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (1 g)",
        "grams": 1.0,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "creole-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (1 g)",
        "servingGrams": 1.0,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 290
      },
      "sourceProvenance": {
        "provider": "Tony Chachere's",
        "sourceType": "official manufacturer current product + current package nutrition reference",
        "sourceUrl": "https://www.tonychachere.com/product/bold/",
        "nutritionUrl": "https://www.cajun.com/tony-chachere%27s-bold-creole-seasoning-30-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 1.0 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
    }
  },
  {
    "id": "seasonings-brand-tony-chacheres-no-salt",
    "name": "No Salt Seasoning Blend",
    "displayName": "Tony Chachere's No Salt Seasoning Blend",
    "brand": "Tony Chachere's",
    "category": "seasonings",
    "state": "dry",
    "preparation": "packaged-ready-to-use",
    "aliases": [
      "Tony Chachere's No Salt Seasoning Blend",
      "Tony Chachere's",
      "No Salt Seasoning Blend",
      "Tony's No Salt",
      "Tony Chacheres No Salt"
    ],
    "tags": [
      "seasonings",
      "branded",
      "packaged",
      "dry-seasoning",
      "salt-free-seasoning"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 625.0,
      "protein": 0.0,
      "carbs": 125.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 tsp (0.8 g)",
        "grams": 0.8,
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
    "source": "AriFoodSeasoningBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt-free-seasoning",
      "brandSpecific": true,
      "packagedProduct": true,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1/4 tsp (0.8 g)",
        "servingGrams": 0.8,
        "calories": 5,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Tony Chachere's",
        "sourceType": "official manufacturer current product + official manufacturer catalog nutrition",
        "sourceUrl": "https://www.tonychachere.com/product/no-salt-seasoning/",
        "nutritionUrl": "https://www.tonychachere.com/wp-content/uploads/2024/04/Tony-Chacheres-Digital-Catalog-4-16-24.pdf",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 0.8 g was normalized mathematically to the ARI Seasonings canonical basis of 100 g.",
      "roundingCaution": "Seasoning label servings are extremely small. FDA label rounding can make mathematically normalized 100 g carbohydrate or calorie values look disproportionate. Runtime serving calculations should prefer metadata.labelNutrition for exact branded household servings.",
      "notes": "Exact branded dry-seasoning record. Prefer this over AriFoodSeasoningsCore when the user's brand/product matches."
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
    if (!global.AriFoodSeasonings) {
      return false;
    }

    if (
      typeof global.AriFoodSeasonings.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodSeasonings.isKnownModule(
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
      global.AriFoodSeasonings &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodSeasonings.markModuleFailed ===
        "function"
    ) {
      global.AriFoodSeasonings.markModuleFailed(
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
      ARI_SEASONING_BRAND_FOODS,
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
        ARI_SEASONING_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_SEASONING_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_SEASONING_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      seasoningTypes:
        Array.from(
          new Set(
            ARI_SEASONING_BRAND_FOODS.map(
              food =>
                food.metadata?.seasoningType
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
      `Registration rejected ${registration.rejected} seasoning-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSeasonings &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodSeasonings.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSeasonings.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodSeasoningBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SEASONING_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_SEASONING_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_SEASONING_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getSeasoningTypes() {
        return Array.from(
          new Set(
            ARI_SEASONING_BRAND_FOODS.map(
              food =>
                food.metadata?.seasoningType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_SEASONING_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) ===
              normalized
          )
          .map(clone);
      },

      getBySeasoningType(
        seasoningType
      ) {
        const normalized =
          normalizeText(seasoningType);

        return ARI_SEASONING_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.seasoningType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SEASONING_BRAND_FOODS.find(
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
        "ari:food-seasoning-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SEASONING_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SEASONING_BRAND_FOODS.length} branded seasoning records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);