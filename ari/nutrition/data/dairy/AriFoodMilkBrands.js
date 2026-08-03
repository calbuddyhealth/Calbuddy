// =====================================================
// ARI REBIRTH
// File: AriFoodMilkBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first packaged milk database for ARI Nutrition.
//
// Collection:
//   AriFoodDairy
//
// Brands in V1:
//   - fairlife
//   - LACTAID
//   - Horizon Organic
//   - Organic Valley
//   - Darigold
//
// Data policy:
//   - Manufacturer label/page first.
//   - Exact package serving retained in metadata.
//   - Canonical nutrition normalized to 100 g.
//   - Volume-based labels use explicit nominal
//     1 mL = 1 g normalization for fluid milk.
//   - Specialty formulations remain distinct.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodMilkBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodMilkBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first packaged milk module",
  "brands": [
    "Darigold",
    "Horizon Organic",
    "LACTAID",
    "Organic Valley",
    "fairlife"
  ],
  "recordCount": 25,
  "rules": [
    "Manufacturer product pages are the primary source for branded milk.",
    "Preserve exact manufacturer serving facts in metadata.labelNutrition.",
    "Normalize to the ARI 100 g basis using an explicit nominal 1 mL = 1 g fluid-milk equivalence.",
    "Do not silently replace branded milk with DairyCore when a matching branded record exists.",
    "Keep lactose-free, ultra-filtered, protein-enhanced, organic, grassfed, chocolate, and conventional products distinct.",
    "If the manufacturer changes a label, update the branded record rather than forcing compatibility with the old value.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_MILK_BRAND_FOODS =
    [
  {
    "id": "dairy-brand-fairlife-whole-ultra-filtered-milk",
    "name": "Whole Ultra-Filtered Milk",
    "displayName": "fairlife Whole Ultra-Filtered Milk",
    "brand": "fairlife",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "fairlife whole milk",
      "fairlife whole",
      "fairlife whole ultra filtered milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "fairlife",
      "ultra-filtered-whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 62.5,
      "protein": 5.417,
      "carbs": 2.5,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 2.5,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 50.0,
      "potassium": 166.667,
      "cholesterol": 12.5,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 150,
        "protein": 13,
        "carbs": 6,
        "fat": 8,
        "fiber": 0,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 120,
        "potassium": 400,
        "cholesterol": 30,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://fairlife.com/ultra-filtered-milk/whole-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Ultra-Filtered Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz bottle",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-fairlife-2-percent-ultra-filtered-milk",
    "name": "2% Reduced Fat Ultra-Filtered Milk",
    "displayName": "fairlife 2% Reduced Fat Ultra-Filtered Milk",
    "brand": "fairlife",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "fairlife 2% milk",
      "fairlife 2 percent",
      "fairlife reduced fat milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "fairlife",
      "ultra-filtered-2-percent"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 50.0,
      "protein": 5.417,
      "carbs": 2.5,
      "fat": 1.875,
      "fiber": 0.0,
      "sugar": 2.5,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 50.0,
      "potassium": 166.667,
      "cholesterol": 8.333,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 120,
        "protein": 13,
        "carbs": 6,
        "fat": 4.5,
        "fiber": 0,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 120,
        "potassium": 400,
        "cholesterol": 20,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://fairlife.com/ultra-filtered-milk/reduced-fat-2-percent-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Reduced Fat Ultra-Filtered Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz bottle",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-fairlife-fat-free-ultra-filtered-milk",
    "name": "Fat-Free Ultra-Filtered Milk",
    "displayName": "fairlife Fat-Free Ultra-Filtered Milk",
    "brand": "fairlife",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "fairlife skim milk",
      "fairlife fat free milk",
      "fairlife nonfat milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "fairlife",
      "ultra-filtered-fat-free"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33.33,
      "protein": 5.417,
      "carbs": 2.5,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 2.5,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 50.0,
      "potassium": 166.667,
      "cholesterol": 2.083,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-fat-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 80,
        "protein": 13,
        "carbs": 6,
        "fat": 0,
        "fiber": 0,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 120,
        "potassium": 400,
        "cholesterol": 5,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://fairlife.com/ultra-filtered-milk/fat-free-skim-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Nonfat Ultra-Filtered Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz bottle",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-fairlife-chocolate-2-percent-ultra-filtered-milk",
    "name": "Chocolate 2% Ultra-Filtered Milk",
    "displayName": "fairlife Chocolate 2% Ultra-Filtered Milk",
    "brand": "fairlife",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "fairlife chocolate milk",
      "fairlife chocolate 2%",
      "fairlife chocolate ultra filtered milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "fairlife",
      "ultra-filtered-chocolate-2-percent"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 58.33,
      "protein": 5.417,
      "carbs": 5.417,
      "fat": 1.875,
      "fiber": 0.417,
      "sugar": 5.0,
      "addedSugar": 2.5,
      "saturatedFat": 1.25,
      "sodium": 116.667,
      "potassium": 229.167,
      "cholesterol": 8.333,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-chocolate-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 140,
        "protein": 13,
        "carbs": 13,
        "fat": 4.5,
        "fiber": 1,
        "sugar": 12,
        "addedSugar": 6,
        "saturatedFat": 3,
        "sodium": 280,
        "potassium": 550,
        "cholesterol": 20,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://fairlife.com/ultra-filtered-milk/chocolate-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Reduced Fat Ultra-filtered Milk, Sugar, Alkalized Cocoa, Lactase Enzyme, Dipotassium Phosphate, Salt, Acesulfame Potassium, Carrageenan, Natural And Artificial Flavors, Sucralose, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz bottle",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-whole-milk",
    "name": "Lactose-Free Whole Milk",
    "displayName": "LACTAID Lactose-Free Whole Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid whole milk",
      "lactaid whole",
      "lactose free whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "lactose-free-whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 52.083,
      "potassium": 166.667,
      "cholesterol": 14.583,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "lactose-free-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 160,
        "protein": 8,
        "carbs": 13,
        "fat": 8,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 125,
        "potassium": 400,
        "cholesterol": 35,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-whole-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Milk, Lactase Enzyme, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "32, 64, and 96 fl oz sizes",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-2-percent-milk",
    "name": "Reduced Fat 2% Lactose-Free Milk",
    "displayName": "LACTAID Reduced Fat 2% Lactose-Free Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid 2% milk",
      "lactaid 2 percent",
      "lactaid reduced fat milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "lactose-free-2-percent"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.17,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 52.083,
      "potassium": 170.833,
      "cholesterol": 8.333,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "lactose-free-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 130,
        "protein": 8,
        "carbs": 13,
        "fat": 5,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 125,
        "potassium": 410,
        "cholesterol": 20,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-milk/lactaid-reduced-fat-2-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Reduced Fat Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "32, 64, and 96 fl oz sizes",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-1-percent-milk",
    "name": "Lowfat 1% Lactose-Free Milk",
    "displayName": "LACTAID Lowfat 1% Lactose-Free Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid 1% milk",
      "lactaid lowfat milk",
      "lactaid 1 percent milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "lactose-free-1-percent"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 1.042,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.625,
      "sodium": 52.083,
      "potassium": 170.833,
      "cholesterol": 6.25,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "lactose-free-1-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 8,
        "carbs": 13,
        "fat": 2.5,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 1.5,
        "sodium": 125,
        "potassium": 410,
        "cholesterol": 15,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-lowfat-milk-1-percent",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Lowfat Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "64 fl oz reference",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-fat-free-milk",
    "name": "Fat-Free Lactose-Free Milk",
    "displayName": "LACTAID Fat-Free Lactose-Free Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid fat free milk",
      "lactaid skim milk",
      "lactaid nonfat milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "lactose-free-fat-free"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 37.5,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 52.083,
      "potassium": 175.0,
      "cholesterol": 2.083,
      "calcium": 129.167
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "lactose-free-fat-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 90,
        "protein": 8,
        "carbs": 13,
        "fat": 0,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 125,
        "potassium": 420,
        "cholesterol": 5,
        "calcium": 310
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-fat-free-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Fat Free Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "32, 64, and 96 fl oz sizes",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-protein-whole-milk",
    "name": "Protein Whole Milk",
    "displayName": "LACTAID Protein Whole Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid protein whole milk",
      "lactaid high protein whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "protein-whole"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 75.0,
      "protein": 5.417,
      "carbs": 5.0,
      "fat": 3.75,
      "fiber": 0.0,
      "sugar": 4.583,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 47.917,
      "potassium": 175.0,
      "cholesterol": 16.667,
      "calcium": 179.167
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "protein-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 180,
        "protein": 13,
        "carbs": 12,
        "fat": 9,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 115,
        "potassium": 420,
        "cholesterol": 40,
        "calcium": 430
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-protein-whole-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Whole Milk, Ultra-Filtered Skim Milk, Lactase Enzyme, Nonfat Milk, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-protein-2-percent-milk",
    "name": "Protein 2% Reduced Fat Milk",
    "displayName": "LACTAID Protein 2% Reduced Fat Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid protein 2% milk",
      "lactaid high protein 2 percent milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "protein-2-percent"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 62.5,
      "protein": 5.417,
      "carbs": 5.0,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 4.583,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 47.917,
      "potassium": 175.0,
      "cholesterol": 10.417,
      "calcium": 179.167
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "protein-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 150,
        "protein": 13,
        "carbs": 12,
        "fat": 5,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 115,
        "potassium": 420,
        "cholesterol": 25,
        "calcium": 430
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-protein-2-percent-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Reduced Fat Milk, Ultra-Filtered Skim Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": "52 fl oz",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-calcium-enriched-whole-milk",
    "name": "Calcium-Enriched Whole Milk",
    "displayName": "LACTAID Calcium-Enriched Whole Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid calcium whole milk",
      "lactaid calcium enriched whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "calcium-enriched-whole"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 52.083,
      "potassium": 170.833,
      "cholesterol": 14.583,
      "calcium": 208.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "calcium-enriched-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 160,
        "protein": 8,
        "carbs": 13,
        "fat": 8,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 125,
        "potassium": 410,
        "cholesterol": 35,
        "calcium": 500
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/lactaid-calcium-enriched-whole-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Whole Fat Milk, Tribasic Calcium Phosphate, Carrageenan, Guar Gum, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "64 fl oz reference",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-lactaid-calcium-enriched-fat-free-milk",
    "name": "Calcium-Enriched Fat-Free Milk",
    "displayName": "LACTAID Calcium-Enriched Fat-Free Milk",
    "brand": "LACTAID",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "lactaid calcium fat free milk",
      "lactaid calcium enriched skim milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "lactaid",
      "calcium-enriched-fat-free"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 37.5,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 52.083,
      "potassium": 170.833,
      "cholesterol": 2.083,
      "calcium": 208.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "calcium-enriched-fat-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 90,
        "protein": 8,
        "carbs": 13,
        "fat": 0,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 125,
        "potassium": 410,
        "cholesterol": 5,
        "calcium": 500
      },
      "sourceProvenance": {
        "provider": "LACTAID",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.lactaid.com/products/calcium-enriched-fat-free-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Fat Free Milk, Tribasic Calcium Phosphate, Carrageenan, Guar Gum, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": false,
      "packageNote": "64 fl oz reference",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-whole-milk",
    "name": "Organic Whole Milk",
    "displayName": "Horizon Organic Organic Whole Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon whole milk",
      "horizon organic whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-whole"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 56.25,
      "potassium": 158.333,
      "cholesterol": 14.583,
      "calcium": 120.833
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 160,
        "protein": 8,
        "carbs": 13,
        "fat": 8,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 135,
        "potassium": 380,
        "cholesterol": 35,
        "calcium": 290
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-whole-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A Organic Milk, Vitamin D3.",
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": "Refrigerated milk; about 8 servings per container",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-1-percent-milk",
    "name": "Organic 1% Lowfat Milk",
    "displayName": "Horizon Organic Organic 1% Lowfat Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon 1% milk",
      "horizon lowfat milk",
      "horizon organic 1 percent milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-1-percent"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 1.042,
      "fiber": 0.0,
      "sugar": 5.417,
      "addedSugar": 0.0,
      "saturatedFat": 0.625,
      "sodium": 56.25,
      "potassium": 158.333,
      "cholesterol": 6.25,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-1-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 8,
        "carbs": 13,
        "fat": 2.5,
        "fiber": 0,
        "sugar": 13,
        "addedSugar": 0,
        "saturatedFat": 1.5,
        "sodium": 135,
        "potassium": 380,
        "cholesterol": 15,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-1-percent-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A Lowfat Organic Milk, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-grassfed-whole-milk",
    "name": "Organic Grassfed Whole Milk",
    "displayName": "Horizon Organic Organic Grassfed Whole Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon grassfed whole milk",
      "horizon grass fed whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-grassfed-whole"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 70.83,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 3.75,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 58.333,
      "potassium": 179.167,
      "cholesterol": 14.583,
      "calcium": 137.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-grassfed-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 170,
        "protein": 8,
        "carbs": 13,
        "fat": 9,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 140,
        "potassium": 430,
        "cholesterol": 35,
        "calcium": 330
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-grassfed-whole-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A Grassfed Organic Milk, Vitamin D3.",
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-grassfed-2-percent-milk",
    "name": "Organic Grassfed 2% Milk",
    "displayName": "Horizon Organic Organic Grassfed 2% Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon grassfed 2% milk",
      "horizon grass fed 2 percent milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-grassfed-2-percent"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.17,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 56.25,
      "potassium": 175.0,
      "cholesterol": 8.333,
      "calcium": 133.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-grassfed-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 130,
        "protein": 8,
        "carbs": 13,
        "fat": 5,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 135,
        "potassium": 420,
        "cholesterol": 20,
        "calcium": 320
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-grassfed-2-percent-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-lactose-free-whole-milk",
    "name": "Organic Lactose-Free Whole Milk",
    "displayName": "Horizon Organic Organic Lactose-Free Whole Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon lactose free whole milk",
      "horizon organic lactose free whole"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-lactose-free-whole"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 56.25,
      "potassium": 170.833,
      "cholesterol": 14.583,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-lactose-free-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 160,
        "protein": 8,
        "carbs": 13,
        "fat": 8,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 135,
        "potassium": 410,
        "cholesterol": 35,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-lactose-free-whole-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": true,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-horizon-organic-lactose-free-2-percent-milk",
    "name": "Organic Lactose-Free 2% Milk",
    "displayName": "Horizon Organic Organic Lactose-Free 2% Milk",
    "brand": "Horizon Organic",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "horizon lactose free 2% milk",
      "horizon organic lactose free 2 percent"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "horizon-organic",
      "organic-lactose-free-2-percent"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.17,
      "protein": 3.333,
      "carbs": 5.417,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 54.167,
      "potassium": 166.667,
      "cholesterol": 8.333,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-lactose-free-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 130,
        "protein": 8,
        "carbs": 13,
        "fat": 5,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 130,
        "potassium": 400,
        "cholesterol": 20,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "Horizon Organic",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://horizon.com/organic-dairy-products/organic-milk/organic-lactose-free-2-percent-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": true,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-organic-valley-whole-milk",
    "name": "Organic Whole Milk",
    "displayName": "Organic Valley Organic Whole Milk",
    "brand": "Organic Valley",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "organic valley whole milk",
      "OV whole milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "organic-valley",
      "organic-whole"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 62.5,
      "protein": 3.333,
      "carbs": 5.0,
      "fat": 3.333,
      "fiber": 0.0,
      "sugar": 4.583,
      "addedSugar": 0.0,
      "saturatedFat": 2.083,
      "sodium": 50.0,
      "potassium": 145.833,
      "cholesterol": 12.5,
      "calcium": 116.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-whole",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 150,
        "protein": 8,
        "carbs": 12,
        "fat": 8,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 0,
        "saturatedFat": 5,
        "sodium": 120,
        "potassium": 350,
        "cholesterol": 30,
        "calcium": 280
      },
      "sourceProvenance": {
        "provider": "Organic Valley",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.organicvalley.coop/products/whole-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-organic-valley-skim-fat-free-milk",
    "name": "Organic Skim Fat-Free Milk",
    "displayName": "Organic Valley Organic Skim Fat-Free Milk",
    "brand": "Organic Valley",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "organic valley skim milk",
      "organic valley fat free milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "organic-valley",
      "organic-fat-free"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 37.5,
      "protein": 3.333,
      "carbs": 5.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 52.083,
      "potassium": 150.0,
      "cholesterol": 2.083,
      "calcium": 125.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-fat-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 90,
        "protein": 8,
        "carbs": 12,
        "fat": 0,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 125,
        "potassium": 360,
        "cholesterol": 5,
        "calcium": 300
      },
      "sourceProvenance": {
        "provider": "Organic Valley",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.organicvalley.coop/products/skim-fat-free-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-organic-valley-lactose-free-2-percent-milk",
    "name": "Organic Lactose-Free 2% Reduced Fat Milk",
    "displayName": "Organic Valley Organic Lactose-Free 2% Reduced Fat Milk",
    "brand": "Organic Valley",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "organic valley lactose free 2% milk",
      "organic valley lactose free reduced fat milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "organic-valley",
      "organic-lactose-free-2-percent"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.17,
      "protein": 3.333,
      "carbs": 5.0,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 4.583,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 50.0,
      "potassium": 145.833,
      "cholesterol": 8.333,
      "calcium": 120.833
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "organic-lactose-free-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 130,
        "protein": 8,
        "carbs": 12,
        "fat": 5,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 120,
        "potassium": 350,
        "cholesterol": 20,
        "calcium": 290
      },
      "sourceProvenance": {
        "provider": "Organic Valley",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.organicvalley.coop/products/2-percent-reduced-fat-milk-lactose-free",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Organic Grade A Reduced Fat Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": true,
      "ultraFiltered": false,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-organic-valley-protein-plus-2-percent-milk",
    "name": "Protein Plus Ultra-Filtered Organic 2% Milk",
    "displayName": "Organic Valley Protein Plus Ultra-Filtered Organic 2% Milk",
    "brand": "Organic Valley",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "organic valley protein plus 2%",
      "organic valley ultra filtered 2 percent"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "organic-valley",
      "protein-plus-ultra-filtered-2-percent"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 50.0,
      "protein": 5.417,
      "carbs": 2.5,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 2.5,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 50.0,
      "potassium": 166.667,
      "cholesterol": 8.333,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "protein-plus-ultra-filtered-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 120,
        "protein": 13,
        "carbs": 6,
        "fat": 5,
        "fiber": 0,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 120,
        "potassium": 400,
        "cholesterol": 20,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "Organic Valley",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.organicvalley.coop/products/organic-valley-protein-plus-ultra-filtered-reduced-fat-2-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Organic Ultra-Filtered Grade A Reduced Fat Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": true,
      "ultraFiltered": true,
      "packageNote": "48 oz",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-organic-valley-protein-plus-skim-milk",
    "name": "Protein Plus Ultra-Filtered Organic Skim Milk",
    "displayName": "Organic Valley Protein Plus Ultra-Filtered Organic Skim Milk",
    "brand": "Organic Valley",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "organic valley protein plus skim",
      "organic valley protein plus fat free milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "organic-valley",
      "protein-plus-ultra-filtered-fat-free"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33.33,
      "protein": 5.417,
      "carbs": 2.5,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 2.5,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 50.0,
      "potassium": 166.667,
      "cholesterol": 2.083,
      "calcium": 158.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "protein-plus-ultra-filtered-fat-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 80,
        "protein": 13,
        "carbs": 6,
        "fat": 0,
        "fiber": 0,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 120,
        "potassium": 400,
        "cholesterol": 5,
        "calcium": 380
      },
      "sourceProvenance": {
        "provider": "Organic Valley",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.organicvalley.coop/products/organic-valley-protein-plus-ultra-filtered-skim-fat-free-milk",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Organic Ultra-Filtered Grade A Fat Free Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": true,
      "ultraFiltered": true,
      "packageNote": "48 oz",
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-darigold-ultra-filtered-2-percent-milk",
    "name": "Ultra-Filtered 2% Reduced Fat Milk",
    "displayName": "Darigold Ultra-Filtered 2% Reduced Fat Milk",
    "brand": "Darigold",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "darigold ultra filtered milk",
      "darigold 2% ultra filtered",
      "darigold fit 2%"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "darigold",
      "ultra-filtered-2-percent"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.17,
      "protein": 5.833,
      "carbs": 2.917,
      "fat": 2.083,
      "fiber": 0.0,
      "sugar": 2.917,
      "addedSugar": 0.0,
      "saturatedFat": 1.25,
      "sodium": 33.333,
      "potassium": 106.25,
      "cholesterol": 10.417,
      "calcium": 171.25
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 130,
        "protein": 14,
        "carbs": 7,
        "fat": 5,
        "fiber": 0,
        "sugar": 7,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 80,
        "potassium": 255,
        "cholesterol": 25,
        "calcium": 411
      },
      "sourceProvenance": {
        "provider": "Darigold",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.darigold.com/product/ultra-filtered-2-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Ultra-Filtered Skim Milk, Milk, Lactase Enzyme, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": null,
      "offlineReference": true
    }
  },
  {
    "id": "dairy-brand-darigold-ultra-filtered-chocolate-milk",
    "name": "Ultra-Filtered Chocolate Milk",
    "displayName": "Darigold Ultra-Filtered Chocolate Milk",
    "brand": "Darigold",
    "category": "dairy",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "darigold chocolate milk",
      "darigold ultra filtered chocolate milk"
    ],
    "tags": [
      "dairy",
      "milk",
      "branded",
      "darigold",
      "ultra-filtered-chocolate"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 70.83,
      "protein": 5.833,
      "carbs": 6.667,
      "fat": 2.083,
      "fiber": 0.417,
      "sugar": 5.833,
      "addedSugar": 3.333,
      "saturatedFat": 1.458,
      "sodium": 66.667,
      "potassium": 149.167,
      "cholesterol": 10.417,
      "calcium": 167.083
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 240,
        "grams": 240,
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
    "source": "AriFoodMilkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "milk",
      "productLine": "ultra-filtered-chocolate",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer label",
      "normalizationMethod": "Manufacturer label is volume-based. ARI preserves the exact label serving and normalizes to 100 g using a nominal 1 mL = 1 g fluid-milk equivalence.",
      "normalizedNutritionApproximation": true,
      "labelNutrition": {
        "servingSize": "1 cup (240 mL)",
        "servingMilliliters": 240,
        "calories": 170,
        "protein": 14,
        "carbs": 16,
        "fat": 5,
        "fiber": 1,
        "sugar": 14,
        "addedSugar": 8,
        "saturatedFat": 3.5,
        "sodium": 160,
        "potassium": 358,
        "cholesterol": 25,
        "calcium": 401
      },
      "sourceProvenance": {
        "provider": "Darigold",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.darigold.com/product/ultra-filtered-chocolate-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Ultra-Filtered Skim Milk, Milk, Liquid Sugar (Sugar, Water), Fructose, Cocoa Processed with Alkali, Natural Flavors, Lactase Enzyme, Salt, Carrageenan, Vitamin A Palmitate, Vitamin D3.",
      "lactoseFree": true,
      "organic": false,
      "ultraFiltered": true,
      "packageNote": null,
      "offlineReference": true
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
    if (!global.AriFoodDairy) {
      return false;
    }

    if (typeof global.AriFoodDairy.isExpectedModule === "function") {
      try {
        return global.AriFoodDairy.isExpectedModule(MODULE_NAME);
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

    if (
      global.AriFoodDairy &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodDairy.markModuleFailed === "function"
    ) {
      global.AriFoodDairy.markModuleFailed(
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

  if (!registry || typeof registry.registerMany !== "function") {
    reportFailure("AriFoodRegistry.registerMany() is unavailable.");
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`,
        error
      );
    }
  }

  const registration = registry.registerMany(
    ARI_MILK_BRAND_FOODS,
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
      foodCount: ARI_MILK_BRAND_FOODS.length,
      brandCount: new Set(
        ARI_MILK_BRAND_FOODS.map(food => food.brand)
      ).size,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} milk-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodDairy &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodDairy.markModuleLoaded === "function"
  ) {
    global.AriFoodDairy.markModuleLoaded(MODULE_NAME, moduleResult);
  }

  global.AriFoodMilkBrands = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_MILK_BRAND_FOODS.length;
    },

    getFoodIds() {
      return ARI_MILK_BRAND_FOODS.map(food => food.id);
    },

    getBrands() {
      return Array.from(
        new Set(
          ARI_MILK_BRAND_FOODS.map(food => food.brand)
        )
      );
    },

    getByBrand(brand) {
      const normalized = String(brand || "").trim().toLowerCase();

      return ARI_MILK_BRAND_FOODS
        .filter(
          food => String(food.brand || "").toLowerCase() === normalized
        )
        .map(clone);
    },

    getLactoseFree() {
      return ARI_MILK_BRAND_FOODS
        .filter(food => food.metadata?.lactoseFree === true)
        .map(clone);
    },

    getUltraFiltered() {
      return ARI_MILK_BRAND_FOODS
        .filter(food => food.metadata?.ultraFiltered === true)
        .map(clone);
    },

    getOrganic() {
      return ARI_MILK_BRAND_FOODS
        .filter(food => food.metadata?.organic === true)
        .map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();
      const record = ARI_MILK_BRAND_FOODS.find(food => food.id === id);
      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-milk-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_MILK_BRAND_FOODS.length,
            brandCount: moduleResult.metadata.brandCount,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_MILK_BRAND_FOODS.length} manufacturer-label milk records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);