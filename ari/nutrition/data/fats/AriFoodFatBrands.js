// =====================================================
// ARI REBIRTH
// File: AriFoodFatBrands.js
// Version: 1.0.0
//
// Purpose:
//   Required branded solid/semi-solid culinary-fat
//   database for ARI Nutrition's Fats pathway.
//
// Collection:
//   AriFoodFats
//
// V1 brands:
//   - Land O Lakes
//   - Kerrygold
//   - Country Crock
//   - Miyoko's
//   - Crisco
//   - 4th & Heart
//
// Coverage:
//   20 branded products.
//
// Includes:
//   - Salted and unsalted butter
//   - European-style butter
//   - Whipped butter
//   - Butter/oil spreads
//   - Plant-based butter
//   - Buttery spreads
//   - Shortening
//   - Ghee
//
// Excluded:
//   - Mayonnaise -> AriFoodCondiments
//   - Liquid cooking oils -> AriFoodOils
//   - Nut butters
//
// Canonical basis:
//   100 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFats v1+
// =====================================================

(function initializeAriFoodFatBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodFatBrands";
  const VERIFIED_AT = "2026-08-04";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-04",
  "runtimeInternetRequired": false,
  "strategy": "required branded solid/semi-solid culinary-fat layer for the ARI Fats pathway",
  "recordCount": 20,
  "brands": [
    "4th & Heart",
    "Country Crock",
    "Crisco",
    "Kerrygold",
    "Land O Lakes",
    "Miyoko's"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Exact branded fat records outrank AriFoodFatsCore generic fallbacks.",
    "Preserve each product's current package-label serving weight.",
    "Normalize label nutrition mathematically to 100 g for registry consistency.",
    "Keep mayonnaise in AriFoodCondiments.",
    "Keep liquid cooking oils in AriFoodOils.",
    "Keep nut butters outside this pathway.",
    "Do not infer cooking-fat absorption into another food.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_FAT_BRAND_FOODS = Object.freeze(
[
  {
    "id": "fats-brand-land-o-lakes-salted-butter",
    "name": "Salted Butter",
    "displayName": "Land O Lakes Salted Butter",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "salted",
    "aliases": [
      "Land O Lakes Salted Butter",
      "Land O Lakes",
      "Salted Butter",
      "Land O Lakes Butter",
      "Land O Lakes Salted"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 642.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 7,
        "sugar": 0,
        "sodiumMg": 90
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/salted-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-unsalted-butter",
    "name": "Unsalted Butter",
    "displayName": "Land O Lakes Unsalted Butter",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "unsalted",
    "aliases": [
      "Land O Lakes Unsalted Butter",
      "Land O Lakes",
      "Unsalted Butter",
      "Land O Lakes Unsalted",
      "Land O Lakes Sweet Cream Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
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
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "unsalted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 7,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/unsalted-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-extra-creamy-salted",
    "name": "Extra Creamy Salted Butter",
    "displayName": "Land O Lakes Extra Creamy Salted Butter",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "european-style-salted",
    "aliases": [
      "Land O Lakes Extra Creamy Salted Butter",
      "Land O Lakes",
      "Extra Creamy Salted Butter",
      "Land O Lakes European Style Salted Butter",
      "Land O Lakes Extra Creamy"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "european-style-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 785.714,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 85.714,
      "saturatedFat": 57.143,
      "sugar": 0.0,
      "sodiumMg": 535.714
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "european-style-salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 110,
        "protein": 0,
        "carbs": 0,
        "fat": 12,
        "saturatedFat": 8,
        "sugar": 0,
        "sodiumMg": 75
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/extra-creamy-salted-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-extra-creamy-unsalted",
    "name": "Extra Creamy Unsalted Butter",
    "displayName": "Land O Lakes Extra Creamy Unsalted Butter",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "european-style-unsalted",
    "aliases": [
      "Land O Lakes Extra Creamy Unsalted Butter",
      "Land O Lakes",
      "Extra Creamy Unsalted Butter",
      "Land O Lakes European Style Unsalted Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "european-style-unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 785.714,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 85.714,
      "saturatedFat": 57.143,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "european-style-unsalted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 110,
        "protein": 0,
        "carbs": 0,
        "fat": 12,
        "saturatedFat": 8,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/extra-creamy-unsalted-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-salted-whipped",
    "name": "Salted Whipped Butter",
    "displayName": "Land O Lakes Salted Whipped Butter",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "whipped-salted",
    "aliases": [
      "Land O Lakes Salted Whipped Butter",
      "Land O Lakes",
      "Salted Whipped Butter",
      "Land O Lakes Whipped Butter",
      "Land O Lakes Whipped Salted"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "whipped-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 85.714,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (7 g)",
        "grams": 7,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "whipped-salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (7 g)",
        "servingGrams": 7,
        "calories": 50,
        "protein": 0,
        "carbs": 0,
        "fat": 6,
        "saturatedFat": 3.5,
        "sugar": 0,
        "sodiumMg": 50
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/salted-whipped-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 7 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-butter-canola",
    "name": "Butter with Canola Oil",
    "displayName": "Land O Lakes Butter with Canola Oil",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "butter-canola-blend",
    "aliases": [
      "Land O Lakes Butter with Canola Oil",
      "Land O Lakes",
      "Butter with Canola Oil",
      "Land O Lakes Spreadable Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter-spread",
      "butter-canola-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 642.857,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 71.429,
      "saturatedFat": 25.0,
      "sugar": 0.0,
      "sodiumMg": 678.571
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter-spread",
      "fatStyle": "butter-canola-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 90,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "saturatedFat": 3.5,
        "sugar": 0,
        "sodiumMg": 95
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/butter-with-canola-oil/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-light-butter-canola",
    "name": "Light Butter with Canola Oil",
    "displayName": "Land O Lakes Light Butter with Canola Oil",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "light-butter-canola-blend",
    "aliases": [
      "Land O Lakes Light Butter with Canola Oil",
      "Land O Lakes",
      "Light Butter with Canola Oil",
      "Land O Lakes Light Spreadable Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter-spread",
      "light-butter-canola-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 42.857,
      "saturatedFat": 14.286,
      "sugar": 0.0,
      "sodiumMg": 642.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter-spread",
      "fatStyle": "light-butter-canola-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 50,
        "protein": 0,
        "carbs": 0,
        "fat": 6,
        "saturatedFat": 2,
        "sugar": 0,
        "sodiumMg": 90
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/light-butter-with-canola-oil/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-land-o-lakes-garlic-herb-butter-spread",
    "name": "Garlic & Herb Butter Spread",
    "displayName": "Land O Lakes Garlic & Herb Butter Spread",
    "brand": "Land O Lakes",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "garlic-herb",
    "aliases": [
      "Land O Lakes Garlic & Herb Butter Spread",
      "Land O Lakes",
      "Garlic & Herb Butter Spread",
      "Land O Lakes Garlic Herb Butter",
      "Garlic and Herb Butter Spread"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter-spread",
      "garlic-herb"
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
      "protein": 0.0,
      "carbs": 7.143,
      "fat": 57.143,
      "saturatedFat": 21.429,
      "sugar": 0.0,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter-spread",
      "fatStyle": "garlic-herb",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 70,
        "protein": 0,
        "carbs": 1,
        "fat": 8,
        "saturatedFat": 3,
        "sugar": 0,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Land O Lakes",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.landolakes.com/products/butter-spreads/garlic-herb-butter-spread/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-kerrygold-salted-butter",
    "name": "Salted Butter",
    "displayName": "Kerrygold Salted Butter",
    "brand": "Kerrygold",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "irish-salted",
    "aliases": [
      "Kerrygold Salted Butter",
      "Kerrygold",
      "Salted Butter",
      "Kerrygold Irish Salted Butter",
      "Kerrygold Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "irish-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 57.143,
      "sugar": 0.0,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "irish-salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 8,
        "sugar": 0,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.kerrygoldusa.com/products/salted-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-kerrygold-unsalted-butter",
    "name": "Unsalted Butter",
    "displayName": "Kerrygold Unsalted Butter",
    "brand": "Kerrygold",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "irish-unsalted",
    "aliases": [
      "Kerrygold Unsalted Butter",
      "Kerrygold",
      "Unsalted Butter",
      "Kerrygold Irish Unsalted Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "irish-unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 85.714,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "irish-unsalted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 12,
        "saturatedFat": 7,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.kerrygoldusa.com/products/unsalted-butter-sticks/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-kerrygold-naturally-softer",
    "name": "Naturally Softer Irish Butter",
    "displayName": "Kerrygold Naturally Softer Irish Butter",
    "brand": "Kerrygold",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "soft-spreadable-salted",
    "aliases": [
      "Kerrygold Naturally Softer Irish Butter",
      "Kerrygold",
      "Naturally Softer Irish Butter",
      "Kerrygold Softer Butter",
      "Kerrygold Spreadable Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "soft-spreadable-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "soft-spreadable-salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 7,
        "sugar": 0,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.kerrygoldusa.com/products/naturally-softer-irish-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-kerrygold-garlic-herb-butter",
    "name": "Garlic & Herb Butter",
    "displayName": "Kerrygold Garlic & Herb Butter",
    "brand": "Kerrygold",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "garlic-herb",
    "aliases": [
      "Kerrygold Garlic & Herb Butter",
      "Kerrygold",
      "Garlic & Herb Butter",
      "Kerrygold Garlic Herb",
      "Kerrygold Compound Butter"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "butter",
      "garlic-herb"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 642.857,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 71.429,
      "saturatedFat": 50.0,
      "sugar": 0.0,
      "sodiumMg": 607.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "garlic-herb",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 90,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "saturatedFat": 7,
        "sugar": 0,
        "sodiumMg": 85
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.kerrygoldusa.com/products/garlic-herb-butter/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-country-crock-original-spread",
    "name": "Original Spread",
    "displayName": "Country Crock Original Spread",
    "brand": "Country Crock",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "original",
    "aliases": [
      "Country Crock Original Spread",
      "Country Crock",
      "Original Spread",
      "Country Crock Original",
      "Country Crock Spread"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "buttery-spread",
      "original"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 42.857,
      "saturatedFat": 10.714,
      "sugar": 0.0,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "buttery-spread",
      "fatStyle": "original",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 50,
        "protein": 0,
        "carbs": 0,
        "fat": 6,
        "saturatedFat": 1.5,
        "sugar": 0,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Country Crock",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.countrycrock.com/en-us/our-products/original-buttery-spreads/original-spread",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-country-crock-light-spread",
    "name": "Light Spread",
    "displayName": "Country Crock Light Spread",
    "brand": "Country Crock",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "light",
    "aliases": [
      "Country Crock Light Spread",
      "Country Crock",
      "Light Spread",
      "Country Crock Light",
      "Country Crock Light Buttery Spread"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "buttery-spread",
      "light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 28.571,
      "saturatedFat": 7.143,
      "sugar": 0.0,
      "sodiumMg": 678.571
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "buttery-spread",
      "fatStyle": "light",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 35,
        "protein": 0,
        "carbs": 0,
        "fat": 4,
        "saturatedFat": 1,
        "sugar": 0,
        "sodiumMg": 95
      },
      "sourceProvenance": {
        "provider": "Country Crock",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.countrycrock.com/en-us/our-products/original-buttery-spreads/light-spread",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-country-crock-plant-butter-olive-oil-tub",
    "name": "Plant Butter with Olive Oil",
    "displayName": "Country Crock Plant Butter Tub with Olive Oil",
    "brand": "Country Crock",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "olive-oil",
    "aliases": [
      "Country Crock Plant Butter Tub with Olive Oil",
      "Country Crock",
      "Plant Butter with Olive Oil",
      "Country Crock Olive Oil Plant Butter",
      "Country Crock Plant Butter Olive"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "plant-based-spread",
      "olive-oil"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 28.571,
      "sugar": 0.0,
      "sodiumMg": 750.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-spread",
      "fatStyle": "olive-oil",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 4,
        "sugar": 0,
        "sodiumMg": 105
      },
      "sourceProvenance": {
        "provider": "Country Crock",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.countrycrock.com/en-us/our-products/plant-butter-cream/olive-oil-spread",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-country-crock-plant-butter-avocado-oil-tub",
    "name": "Plant Butter with Avocado Oil",
    "displayName": "Country Crock Plant Butter Tub with Avocado Oil",
    "brand": "Country Crock",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "avocado-oil",
    "aliases": [
      "Country Crock Plant Butter Tub with Avocado Oil",
      "Country Crock",
      "Plant Butter with Avocado Oil",
      "Country Crock Avocado Oil Plant Butter",
      "Country Crock Plant Butter Avocado"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "plant-based-spread",
      "avocado-oil"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "saturatedFat": 28.571,
      "sugar": 0.0,
      "sodiumMg": 750.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-spread",
      "fatStyle": "avocado-oil",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "saturatedFat": 4,
        "sugar": 0,
        "sodiumMg": 105
      },
      "sourceProvenance": {
        "provider": "Country Crock",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.countrycrock.com/en-us/our-products/plant-butter-cream/avocado-oil-spread",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-miyokos-cashew-milk-butter-salted",
    "name": "European Style Cashew Milk Butter Salted",
    "displayName": "Miyoko's European Style Cashew Milk Butter Salted",
    "brand": "Miyoko's",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "cultured-salted",
    "aliases": [
      "Miyoko's European Style Cashew Milk Butter Salted",
      "Miyoko's",
      "European Style Cashew Milk Butter Salted",
      "Miyokos Salted Butter",
      "Miyoko's Plant Milk Butter Salted"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "plant-based-butter",
      "cultured-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 642.857,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 71.429,
      "saturatedFat": 57.143,
      "sugar": 0.0,
      "sodiumMg": 464.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-butter",
      "fatStyle": "cultured-salted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 90,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "saturatedFat": 8,
        "sugar": 0,
        "sodiumMg": 65
      },
      "sourceProvenance": {
        "provider": "Miyoko's",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.miyokos.com/products/european-style-plant-milk-butter-salted",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-miyokos-cashew-milk-butter-unsalted",
    "name": "European Style Cashew Milk Butter Unsalted",
    "displayName": "Miyoko's European Style Cashew Milk Butter Unsalted",
    "brand": "Miyoko's",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "cultured-unsalted",
    "aliases": [
      "Miyoko's European Style Cashew Milk Butter Unsalted",
      "Miyoko's",
      "European Style Cashew Milk Butter Unsalted",
      "Miyokos Unsalted Butter",
      "Miyoko's Plant Milk Butter Unsalted"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "plant-based-butter",
      "cultured-unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 642.857,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 71.429,
      "saturatedFat": 57.143,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-butter",
      "fatStyle": "cultured-unsalted",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 90,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "saturatedFat": 8,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Miyoko's",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.miyokos.com/products/european-style-plant-milk-butter-unsalted",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 14 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-crisco-all-vegetable-shortening",
    "name": "All-Vegetable Shortening",
    "displayName": "Crisco All-Vegetable Shortening",
    "brand": "Crisco",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "all-vegetable",
    "aliases": [
      "Crisco All-Vegetable Shortening",
      "Crisco",
      "All-Vegetable Shortening",
      "Crisco Shortening",
      "Crisco Vegetable Shortening"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "shortening",
      "all-vegetable"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 916.667,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 29.167,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (12 g)",
        "grams": 12,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "shortening",
      "fatStyle": "all-vegetable",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (12 g)",
        "servingGrams": 12,
        "calories": 110,
        "protein": 0,
        "carbs": 0,
        "fat": 12,
        "saturatedFat": 3.5,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Crisco",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://crisco.com/products/all-vegetable-shortening/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 12 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-brand-fourth-heart-original-ghee",
    "name": "Original Ghee",
    "displayName": "4th & Heart Original Ghee",
    "brand": "4th & Heart",
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "original",
    "aliases": [
      "4th & Heart Original Ghee",
      "4th & Heart",
      "Original Ghee",
      "Fourth and Heart Ghee",
      "4th and Heart Ghee"
    ],
    "tags": [
      "fats",
      "branded",
      "packaged",
      "culinary-fat",
      "ghee",
      "original"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 923.077,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 76.923,
      "sugar": 0.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (13 g)",
        "grams": 13,
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
    "source": "AriFoodFatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "ghee",
      "fatStyle": "original",
      "brandSpecific": true,
      "packagedProduct": true,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (13 g)",
        "servingGrams": 13,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 13,
        "saturatedFat": 10,
        "sugar": 0,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "4th & Heart",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://fourthandheart.com/products/original-recipe-ghee",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 13 g was normalized mathematically to the ARI Fats canonical basis of 100 g.",
      "notes": "Exact branded culinary-fat record. Prefer this over AriFoodFatsCore when the user's brand/product matches. Mayonnaise remains in AriFoodCondiments; liquid cooking oils remain in AriFoodOils."
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
    if (!global.AriFoodFats) {
      return false;
    }

    if (
      typeof global.AriFoodFats.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodFats.isKnownModule(
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
      global.AriFoodFats &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodFats.markModuleFailed ===
        "function"
    ) {
      global.AriFoodFats.markModuleFailed(
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
      ARI_FAT_BRAND_FOODS,
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
        ARI_FAT_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_FAT_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_FAT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      fatTypes:
        Array.from(
          new Set(
            ARI_FAT_BRAND_FOODS.map(
              food =>
                food.metadata?.fatType
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
      `Registration rejected ${registration.rejected} fat-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodFats &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodFats.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodFats.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodFatBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_FAT_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_FAT_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_FAT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getFatTypes() {
        return Array.from(
          new Set(
            ARI_FAT_BRAND_FOODS.map(
              food =>
                food.metadata?.fatType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_FAT_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) ===
              normalized
          )
          .map(clone);
      },

      getByFatType(fatType) {
        const normalized =
          normalizeText(fatType);

        return ARI_FAT_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.fatType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_FAT_BRAND_FOODS.find(
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
        "ari:food-fat-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_FAT_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_FAT_BRAND_FOODS.length} branded fat records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
