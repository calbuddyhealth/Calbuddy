// =====================================================
// ARI REBIRTH
// File: AriFoodWineBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first wine data for the Spirits pathway.
//
// V1:
//   14 branded wines across FitVine,
//   Cupcake Vineyards Lighthearted, and
//   Kim Crawford Illuminate.
//
// Verification requirement:
//   Manufacturer-published nutrition + ABV.
//
// Canonical basis:
//   100 mL.
//
// Default serving:
//   5 fl oz / 148 mL.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1+
// =====================================================

(function initializeAriFoodWineBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodWineBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first wine module using only manufacturer-published nutrition and ABV",
  "recordCount": 14,
  "brands": [
    "Cupcake Vineyards",
    "FitVine",
    "Kim Crawford"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "defaultServing": {
    "amount": 5,
    "unit": "fl oz",
    "milliliters": 148
  },
  "standardDrink": {
    "country": "United States",
    "gramsPureAlcohol": 14,
    "source": "NIAAA"
  },
  "rules": [
    "Every V1 record requires manufacturer-published nutrition and ABV.",
    "No generic USDA nutrition is hidden inside a verified branded wine record.",
    "Exact 5 fl oz manufacturer values remain in metadata.labelNutrition.",
    "Nutrition is normalized to 100 mL.",
    "Alcohol grams and standard drinks are calculated from manufacturer ABV.",
    "Do not invent exact sugar when the manufacturer only publishes a qualifier.",
    "Future vintage-specific records may supersede product-level entries."
  ]
}
  );

  const ARI_WINE_BRAND_FOODS =
    [
  {
    "id": "spirits-wine-fitvine-cabernet-sauvignon",
    "name": "Cabernet Sauvignon",
    "displayName": "FitVine Cabernet Sauvignon",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Cabernet",
      "FitVine Cab"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "cabernet-sauvignon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 81.76,
      "protein": 0,
      "carbs": 3.243,
      "fat": 0,
      "sugar": 0.081
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "cabernet-sauvignon",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 13.5,
        "alcoholGramsPerServing": 15.76,
        "standardDrinksPerServing": 1.126,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 121,
        "protein": 0,
        "carbs": 4.8,
        "fat": 0,
        "abvPercent": 13.5,
        "sugar": 0.12
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/fitvine-wine-cabernet-sauvignon",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-pinot-noir",
    "name": "Pinot Noir",
    "displayName": "FitVine Pinot Noir",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Pinot Noir"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "pinot-noir"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 80.41,
      "protein": 0,
      "carbs": 3.108,
      "fat": 0,
      "sugar": 0.054
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "pinot-noir",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 13.5,
        "alcoholGramsPerServing": 15.76,
        "standardDrinksPerServing": 1.126,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 119,
        "protein": 0,
        "carbs": 4.6,
        "fat": 0,
        "abvPercent": 13.5,
        "sugar": 0.08
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/pinot-noir",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-red-blend",
    "name": "Red Blend",
    "displayName": "FitVine Red Blend",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Red Blend"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "red-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 81.76,
      "protein": 0,
      "carbs": 3.243,
      "fat": 0,
      "sugar": 0.088
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "red-blend",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 13.5,
        "alcoholGramsPerServing": 15.76,
        "standardDrinksPerServing": 1.126,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 121,
        "protein": 0,
        "carbs": 4.8,
        "fat": 0,
        "abvPercent": 13.5,
        "sugar": 0.13
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/red-blend",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-chardonnay",
    "name": "Chardonnay",
    "displayName": "FitVine Chardonnay",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Chardonnay"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "chardonnay"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 79.73,
      "protein": 0,
      "carbs": 1.959,
      "fat": 0,
      "sugar": 0.128
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "chardonnay",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 13.5,
        "alcoholGramsPerServing": 15.76,
        "standardDrinksPerServing": 1.126,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 118,
        "protein": 0,
        "carbs": 2.9,
        "fat": 0,
        "abvPercent": 13.5,
        "sugar": 0.19
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/fitvine-wine-chardonnay",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-pinot-grigio",
    "name": "Pinot Grigio",
    "displayName": "FitVine Pinot Grigio",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Pinot Grigio"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "pinot-grigio"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 74.32,
      "protein": 0,
      "carbs": 1.959,
      "fat": 0,
      "sugar": 0.081
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "pinot-grigio",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 14.6,
        "standardDrinksPerServing": 1.043,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 110,
        "protein": 0,
        "carbs": 2.9,
        "fat": 0,
        "abvPercent": 12.5,
        "sugar": 0.12
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/fitvine-pinot-grigio",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-sauvignon-blanc",
    "name": "Sauvignon Blanc",
    "displayName": "FitVine Sauvignon Blanc",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Sauvignon Blanc",
      "FitVine Sauv Blanc"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "sauvignon-blanc"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 74.32,
      "protein": 0,
      "carbs": 2.095,
      "fat": 0,
      "sugar": 0.128
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "sauvignon-blanc",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 14.6,
        "standardDrinksPerServing": 1.043,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 110,
        "protein": 0,
        "carbs": 3.1,
        "fat": 0,
        "abvPercent": 12.5,
        "sugar": 0.19
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/sauvignon-blanc",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-fitvine-prosecco",
    "name": "Prosecco",
    "displayName": "FitVine Prosecco",
    "brand": "FitVine",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "FitVine Prosecco",
      "FitVine Sparkling Wine"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "prosecco"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 62.16,
      "protein": 0,
      "carbs": 2.027,
      "fat": 0,
      "sugar": 0.473
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "prosecco",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 11.0,
        "alcoholGramsPerServing": 12.84,
        "standardDrinksPerServing": 0.917,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 92,
        "protein": 0,
        "carbs": 3.0,
        "fat": 0,
        "abvPercent": 11.0,
        "sugar": 0.7
      },
      "sourceProvenance": {
        "provider": "FitVine",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.fitvinewine.com/products/prosecco",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-cupcake-lighthearted-chardonnay",
    "name": "Lighthearted Chardonnay",
    "displayName": "Cupcake Vineyards Lighthearted Chardonnay",
    "brand": "Cupcake Vineyards",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Cupcake Lighthearted Chardonnay"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-chardonnay"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.05,
      "protein": 0,
      "carbs": 2.703,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-chardonnay",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 8.0,
        "alcoholGramsPerServing": 9.34,
        "standardDrinksPerServing": 0.667,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 80,
        "protein": 0,
        "carbs": 4.0,
        "fat": 0,
        "abvPercent": 8.0,
        "sugarQualifier": "<1 g per 5 fl oz"
      },
      "sourceProvenance": {
        "provider": "Cupcake Vineyards",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.cupcakevineyards.com/wine/lighthearted-chardonnay/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": "Manufacturer publishes sugar as less than 1 g per 5 fl oz; no exact sugar amount is invented."
    }
  },
  {
    "id": "spirits-wine-cupcake-lighthearted-sauvignon-blanc",
    "name": "Lighthearted Sauvignon Blanc",
    "displayName": "Cupcake Vineyards Lighthearted Sauvignon Blanc",
    "brand": "Cupcake Vineyards",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Cupcake Lighthearted Sauvignon Blanc"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-sauvignon-blanc"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.05,
      "protein": 0,
      "carbs": 2.703,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-sauvignon-blanc",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 8.0,
        "alcoholGramsPerServing": 9.34,
        "standardDrinksPerServing": 0.667,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 80,
        "protein": 0,
        "carbs": 4.0,
        "fat": 0,
        "abvPercent": 8.0,
        "sugarQualifier": "<1 g per 5 fl oz"
      },
      "sourceProvenance": {
        "provider": "Cupcake Vineyards",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.cupcakevineyards.com/wine/lighthearted-sauvignon-blanc/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": "Manufacturer publishes sugar as less than 1 g per 5 fl oz; no exact sugar amount is invented."
    }
  },
  {
    "id": "spirits-wine-cupcake-lighthearted-pinot-grigio",
    "name": "Lighthearted Pinot Grigio",
    "displayName": "Cupcake Vineyards Lighthearted Pinot Grigio",
    "brand": "Cupcake Vineyards",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Cupcake Lighthearted Pinot Grigio"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-pinot-grigio"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.05,
      "protein": 0,
      "carbs": 2.703,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-pinot-grigio",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 8.0,
        "alcoholGramsPerServing": 9.34,
        "standardDrinksPerServing": 0.667,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 80,
        "protein": 0,
        "carbs": 4.0,
        "fat": 0,
        "abvPercent": 8.0,
        "sugarQualifier": "<1 g per 5 fl oz"
      },
      "sourceProvenance": {
        "provider": "Cupcake Vineyards",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.cupcakevineyards.com/wine/lighthearted-pinot-grigio/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": "Manufacturer publishes sugar as less than 1 g per 5 fl oz; no exact sugar amount is invented."
    }
  },
  {
    "id": "spirits-wine-cupcake-lighthearted-rose",
    "name": "Lighthearted RosÃ©",
    "displayName": "Cupcake Vineyards Lighthearted RosÃ©",
    "brand": "Cupcake Vineyards",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Cupcake Lighthearted Rose",
      "Cupcake Light RosÃ©"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-rose"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.05,
      "protein": 0,
      "carbs": 2.703,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-rose",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 8.0,
        "alcoholGramsPerServing": 9.34,
        "standardDrinksPerServing": 0.667,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 80,
        "protein": 0,
        "carbs": 4.0,
        "fat": 0,
        "abvPercent": 8.0,
        "sugarQualifier": "<1 g per 5 fl oz"
      },
      "sourceProvenance": {
        "provider": "Cupcake Vineyards",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.cupcakevineyards.com/wine/lighthearted-rose/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": "Manufacturer publishes sugar as less than 1 g per 5 fl oz; no exact sugar amount is invented."
    }
  },
  {
    "id": "spirits-wine-cupcake-lighthearted-pinot-noir",
    "name": "Lighthearted Pinot Noir",
    "displayName": "Cupcake Vineyards Lighthearted Pinot Noir",
    "brand": "Cupcake Vineyards",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Cupcake Lighthearted Pinot Noir"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-pinot-noir"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.05,
      "protein": 0,
      "carbs": 2.703,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-pinot-noir",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 8.0,
        "alcoholGramsPerServing": 9.34,
        "standardDrinksPerServing": 0.667,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 80,
        "protein": 0,
        "carbs": 4.0,
        "fat": 0,
        "abvPercent": 8.0,
        "sugarQualifier": "<1 g per 5 fl oz"
      },
      "sourceProvenance": {
        "provider": "Cupcake Vineyards",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.cupcakevineyards.com/wine/lighthearted-pinot-noir/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": "Manufacturer publishes sugar as less than 1 g per 5 fl oz; no exact sugar amount is invented."
    }
  },
  {
    "id": "spirits-wine-kim-crawford-illuminate-sauvignon-blanc",
    "name": "Illuminate Sauvignon Blanc",
    "displayName": "Kim Crawford Illuminate Sauvignon Blanc",
    "brand": "Kim Crawford",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Kim Crawford Illuminate",
      "Kim Crawford Light Sauvignon Blanc"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-sauvignon-blanc"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 47.3,
      "protein": 0,
      "carbs": 2.838,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-sauvignon-blanc",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 7.0,
        "alcoholGramsPerServing": 8.17,
        "standardDrinksPerServing": 0.584,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 70,
        "protein": 0,
        "carbs": 4.2,
        "fat": 0,
        "abvPercent": 7.0
      },
      "sourceProvenance": {
        "provider": "Kim Crawford",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kimcrawfordwines.com/products/illuminate-sauvignon-blanc",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
      "notes": null
    }
  },
  {
    "id": "spirits-wine-kim-crawford-illuminate-sparkling",
    "name": "Illuminate Sparkling",
    "displayName": "Kim Crawford Illuminate Sparkling",
    "brand": "Kim Crawford",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Kim Crawford Illuminate Sparkling",
      "Kim Crawford Light Sparkling"
    ],
    "tags": [
      "spirits",
      "wine",
      "branded",
      "light-sparkling-wine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 47.3,
      "protein": 0,
      "carbs": 3.243,
      "fat": 0
    },
    "servings": [
      {
        "id": "five-fl-oz",
        "label": "5 fl oz glass",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 148,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodWineBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "wine",
      "wineType": "light-sparkling-wine",
      "brandSpecific": true,
      "labelVerified": true,
      "abvVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer 5 fl oz analysis",
      "alcohol": {
        "abvPercent": 7.0,
        "alcoholGramsPerServing": 8.17,
        "standardDrinksPerServing": 0.584,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "labelNutrition": {
        "servingSize": "5 fl oz",
        "servingMilliliters": 148,
        "calories": 70,
        "protein": 0,
        "carbs": 4.8,
        "fat": 0,
        "abvPercent": 7.0
      },
      "sourceProvenance": {
        "provider": "Kim Crawford",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kimcrawfordwines.com/products/illuminate-sparkling",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 5 fl oz analysis normalized mathematically to 100 mL; alcohol metrics calculated from manufacturer ABV.",
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
    if (!global.AriFoodSpirits) return false;

    if (typeof global.AriFoodSpirits.isExpectedModule === "function") {
      try {
        return global.AriFoodSpirits.isExpectedModule(MODULE_NAME);
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

    if (
      global.AriFoodSpirits &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodSpirits.markModuleFailed === "function"
    ) {
      global.AriFoodSpirits.markModuleFailed(
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
          if (food && food.id) registry.remove(food.id);
        }
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(
    ARI_WINE_BRAND_FOODS,
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
      foodCount: ARI_WINE_BRAND_FOODS.length,
      brandCount: new Set(ARI_WINE_BRAND_FOODS.map(food => food.brand)).size,
      runtimeInternetRequired: false,
      brandFirst: true,
      nutritionVerifiedForAll: true,
      abvVerifiedForAll: true,
      standardDrinkBasisGrams: 14,
      canonicalBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },
      sourcePolicy: clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} wine-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSpirits &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodSpirits.markModuleLoaded === "function"
  ) {
    global.AriFoodSpirits.markModuleLoaded(MODULE_NAME, moduleResult);
  }

  global.AriFoodWineBrands = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_WINE_BRAND_FOODS.length;
    },

    getFoodIds() {
      return ARI_WINE_BRAND_FOODS.map(food => food.id);
    },

    getBrands() {
      return Array.from(new Set(ARI_WINE_BRAND_FOODS.map(food => food.brand)));
    },

    getByBrand(brand) {
      const normalized = String(brand || "").trim().toLowerCase();
      return ARI_WINE_BRAND_FOODS
        .filter(food => String(food.brand || "").toLowerCase() === normalized)
        .map(clone);
    },

    getByWineType(wineType) {
      const normalized = String(wineType || "").trim().toLowerCase();
      return ARI_WINE_BRAND_FOODS
        .filter(food => String(food.metadata?.wineType || "").toLowerCase() === normalized)
        .map(clone);
    },

    getLowerAlcohol(maxAbvPercent = 9) {
      const maxAbv = Number(maxAbvPercent);
      return ARI_WINE_BRAND_FOODS
        .filter(food => Number(food.metadata?.alcohol?.abvPercent) <= maxAbv)
        .map(clone);
    },

    getAlcoholMetrics(foodId) {
      const record = ARI_WINE_BRAND_FOODS.find(
        food => food.id === String(foodId || "").trim()
      );
      return record ? clone(record.metadata?.alcohol) : null;
    },

    getRecord(foodId) {
      const record = ARI_WINE_BRAND_FOODS.find(
        food => food.id === String(foodId || "").trim()
      );
      return record ? clone(record) : null;
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
        "ari:food-wine-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_WINE_BRAND_FOODS.length,
            brandCount: moduleResult.metadata.brandCount,
            nutritionVerifiedForAll: true,
            abvVerifiedForAll: true,
            standardDrinkBasisGrams: 14,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_WINE_BRAND_FOODS.length} verified branded wine records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
