// =====================================================
// ARI REBIRTH
// File: AriFoodYogurtBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first packaged yogurt database for ARI Nutrition.
//
// Collection:
//   AriFoodDairy
//
// Brands in V1:
//   - Chobani
//   - Oikos
//   - FAGE
//   - siggi's
//   - Too Good
//
// Coverage:
//   - Plain and flavored Greek yogurt
//   - Nonfat and reduced-fat products
//   - Zero-sugar / lower-sugar products
//   - Lactose-free products
//   - High-protein yogurt / cultured ultra-filtered milk
//   - Icelandic-style skyr
//
// Data policy:
//   - Manufacturer label/page first.
//   - Current retailer label capture only when needed.
//   - Exact package serving retained in metadata.
//   - Canonical nutrition normalized to 100 g.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodYogurtBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodYogurtBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first packaged yogurt module",
  "brands": [
    "Chobani",
    "FAGE",
    "Oikos",
    "Too Good",
    "siggi's"
  ],
  "recordCount": 20,
  "sourceHierarchy": [
    "Official manufacturer product or nutrition page",
    "Current retailer package-label capture when the manufacturer's site does not expose the full nutrition panel in crawlable text"
  ],
  "rules": [
    "Preserve exact package-label serving mass in metadata.labelNutrition.",
    "Normalize label nutrition mathematically to 100 g for ARI calculations.",
    "Keep plain, flavored, nonfat, lowfat, whole-milk, lactose-free, zero-sugar, lower-sugar, and high-protein products distinct.",
    "Do not infer one flavor's nutrition for another flavor unless an exact matching label is available.",
    "Do not substitute AriFoodDairyCore when a matching branded yogurt record exists.",
    "If a manufacturer updates a product label, update the branded record and retain the new verification date.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_YOGURT_BRAND_FOODS =
    [
  {
    "id": "dairy-brand-chobani-plain-nonfat-greek-yogurt",
    "name": "Plain Nonfat Greek Yogurt",
    "displayName": "Chobani Plain Nonfat Greek Yogurt",
    "brand": "Chobani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Chobani plain Greek yogurt",
      "Chobani nonfat plain",
      "Chobani 0% plain"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "chobani",
      "greek-plain-nonfat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53.33,
      "protein": 9.333,
      "carbs": 4.0,
      "fat": 0.0,
      "fiber": 0.667,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 36.667,
      "cholesterol": 6.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "greek-plain-nonfat",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 80,
        "protein": 14,
        "carbs": 6,
        "fat": 0,
        "fiber": 1,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 55,
        "cholesterol": 10
      },
      "sourceProvenance": {
        "provider": "Target / Chobani",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-23974732",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured nonfat milk; 6 live and active cultures.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-chobani-vanilla-nonfat-greek-yogurt",
    "name": "Vanilla Blended Nonfat Greek Yogurt",
    "displayName": "Chobani Vanilla Blended Nonfat Greek Yogurt",
    "brand": "Chobani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Chobani vanilla Greek yogurt",
      "Chobani vanilla nonfat",
      "Chobani vanilla 0%"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "chobani",
      "greek-vanilla-nonfat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 73.33,
      "protein": 8.0,
      "carbs": 10.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 9.333,
      "addedSugar": 6.0,
      "saturatedFat": 0.0,
      "sodium": 36.667,
      "cholesterol": 3.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "greek-vanilla-nonfat",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 110,
        "protein": 12,
        "carbs": 15,
        "fat": 0,
        "fiber": 0,
        "sugar": 14,
        "addedSugar": 9,
        "saturatedFat": 0,
        "sodium": 55,
        "cholesterol": 5
      },
      "sourceProvenance": {
        "provider": "Target / Chobani",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-13173301",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured nonfat milk, cane sugar, water, natural flavors, fruit pectin, guar gum, locust bean gum, vanilla extract, lemon juice concentrate.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": false,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-chobani-zero-sugar-vanilla",
    "name": "Zero Sugar Vanilla Greek Yogurt",
    "displayName": "Chobani Zero Sugar Vanilla Greek Yogurt",
    "brand": "Chobani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Chobani zero sugar vanilla",
      "Chobani zero sugar yogurt vanilla"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "chobani",
      "zero-sugar-vanilla"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 40.0,
      "protein": 8.0,
      "carbs": 3.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 43.333,
      "cholesterol": 6.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "zero-sugar-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 60,
        "protein": 12,
        "carbs": 5,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 65,
        "cholesterol": 10
      },
      "sourceProvenance": {
        "provider": "Kroger / Chobani",
        "sourceType": "current retailer package-label capture; manufacturer product page cross-check",
        "sourceUrl": "https://www.kroger.com/p/chobani-zero-sugar-vanilla-greek-yogurt-cup/0081829001828",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Ultra-filtered nonfat milk, water, skim milk, allulose, less than 2% of natural flavors, tapioca flour, citrus fiber, guar gum, sea salt, stevia leaf extract, monk fruit extract, vanilla extract, cultures.",
      "lactoseFree": true,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-chobani-zero-sugar-toasted-coconut-vanilla",
    "name": "Zero Sugar Toasted Coconut Vanilla Greek Yogurt",
    "displayName": "Chobani Zero Sugar Toasted Coconut Vanilla Greek Yogurt",
    "brand": "Chobani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Chobani zero sugar coconut",
      "Chobani toasted coconut vanilla yogurt"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "chobani",
      "zero-sugar-toasted-coconut-vanilla"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 40.0,
      "protein": 8.0,
      "carbs": 3.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 46.667,
      "cholesterol": 6.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "zero-sugar-toasted-coconut-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 60,
        "protein": 12,
        "carbs": 5,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 70,
        "cholesterol": 10
      },
      "sourceProvenance": {
        "provider": "Kroger / Chobani",
        "sourceType": "current retailer package-label capture; manufacturer product page cross-check",
        "sourceUrl": "https://www.kroger.com/p/chobani-zero-sugar-toasted-coconut-vanilla/0081829001867",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Ultra-filtered nonfat milk, water, skim milk, allulose, less than 2% of natural flavors, tapioca flour, citrus fiber, sea salt, guar gum, stevia leaf extract, monk fruit extract, cultures.",
      "lactoseFree": true,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-oikos-triple-zero-vanilla",
    "name": "Triple Zero Vanilla Nonfat Greek Yogurt",
    "displayName": "Oikos Triple Zero Vanilla Nonfat Greek Yogurt",
    "brand": "Oikos",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Oikos Triple Zero vanilla",
      "Oikos vanilla Triple Zero"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "oikos",
      "triple-zero-vanilla"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53.33,
      "protein": 10.0,
      "carbs": 4.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 36.667,
      "cholesterol": 6.667,
      "potassium": 100.0,
      "calcium": 100.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "triple-zero-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 80,
        "protein": 15,
        "carbs": 6,
        "fat": 0,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 55,
        "cholesterol": 10,
        "potassium": 150,
        "calcium": 150
      },
      "sourceProvenance": {
        "provider": "Oikos / Danone",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.oikos.com/all-products/triple-zero/product/vanilla/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Grade A nonfat milk, water, less than 1% natural flavors, tapioca starch, stevia leaf extract, lemon juice concentrate, sea salt, vitamin D3.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-oikos-pro-vanilla",
    "name": "PRO Vanilla High Protein Yogurt-Cultured Ultra-Filtered Milk",
    "displayName": "Oikos PRO Vanilla High Protein Yogurt-Cultured Ultra-Filtered Milk",
    "brand": "Oikos",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Oikos Pro vanilla",
      "Oikos 20g protein vanilla yogurt"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "oikos",
      "pro-vanilla"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 86.67,
      "protein": 13.333,
      "carbs": 4.0,
      "fat": 2.0,
      "fiber": 0.0,
      "sugar": 2.0,
      "addedSugar": 0.0,
      "saturatedFat": 1.667,
      "sodium": 30.0,
      "cholesterol": 16.667,
      "potassium": 140.0,
      "calcium": 146.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "pro-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 130,
        "protein": 20,
        "carbs": 6,
        "fat": 3,
        "fiber": 0,
        "sugar": 3,
        "addedSugar": 0,
        "saturatedFat": 2.5,
        "sodium": 45,
        "cholesterol": 25,
        "potassium": 210,
        "calcium": 220
      },
      "sourceProvenance": {
        "provider": "Oikos / Danone",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.oikos.com/all-products/pro-yogurt-cultured-ultra-filtered-milk/product/vanilla",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Grade A ultra-filtered nonfat milk, water, whey protein concentrate, cream, less than 1% tapioca starch, natural flavors, lemon juice concentrate, stevia extract, potassium sorbate, vitamin D3, vitamins B6/B2, yogurt cultures.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-0-plain",
    "name": "Total 0% Plain Greek Yogurt",
    "displayName": "FAGE Total 0% Plain Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage 0% plain",
      "FAGE Total 0",
      "Fage nonfat plain"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-0-plain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53.33,
      "protein": 10.667,
      "carbs": 3.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 36.667,
      "cholesterol": 6.667,
      "potassium": 153.333,
      "calcium": 120.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-0-plain",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 80,
        "protein": 16,
        "carbs": 5,
        "fat": 0,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 55,
        "cholesterol": 10,
        "potassium": 230,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer nutrition page",
        "sourceUrl": "https://usa.fage/nutrition",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A pasteurized skimmed milk, live active yogurt cultures.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-2-plain",
    "name": "Total 2% Plain Greek Yogurt",
    "displayName": "FAGE Total 2% Plain Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage 2% plain",
      "FAGE Total 2",
      "Fage Greek yogurt 2 percent"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-2-plain"
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
      "protein": 10.0,
      "carbs": 3.333,
      "fat": 2.0,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 1.333,
      "sodium": 33.333,
      "cholesterol": 10.0,
      "potassium": 153.333,
      "calcium": 120.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-2-plain",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 100,
        "protein": 15,
        "carbs": 5,
        "fat": 3,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 50,
        "cholesterol": 15,
        "potassium": 230,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer nutrition page",
        "sourceUrl": "https://usa.fage/nutrition",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A pasteurized skimmed milk and cream, live active yogurt cultures.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-bestself-0-plain-lactose-free",
    "name": "BestSelf 0% Plain Lactose-Free Greek Yogurt",
    "displayName": "FAGE BestSelf 0% Plain Lactose-Free Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage BestSelf 0 plain",
      "Fage lactose free plain 0%"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "bestself-0-plain"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53.33,
      "protein": 10.667,
      "carbs": 3.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 36.667,
      "cholesterol": 6.667,
      "potassium": 153.333,
      "calcium": 120.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "bestself-0-plain",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 80,
        "protein": 16,
        "carbs": 5,
        "fat": 0,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 55,
        "cholesterol": 10,
        "potassium": 230,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://usa.fage/fage-bestself-plain-53-oz-0",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A pasteurized skimmed milk, live active yogurt cultures, lactase enzyme.",
      "lactoseFree": true,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-bestself-2-plain-lactose-free",
    "name": "BestSelf 2% Plain Lactose-Free Greek Yogurt",
    "displayName": "FAGE BestSelf 2% Plain Lactose-Free Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage BestSelf 2 plain",
      "Fage lactose free plain 2%"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "bestself-2-plain"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 73.33,
      "protein": 10.0,
      "carbs": 3.333,
      "fat": 2.0,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "saturatedFat": 1.333,
      "sodium": 33.333,
      "cholesterol": 10.0,
      "potassium": 153.333,
      "calcium": 120.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "bestself-2-plain",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 110,
        "protein": 15,
        "carbs": 5,
        "fat": 3,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 50,
        "cholesterol": 15,
        "potassium": 230,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer nutrition page",
        "sourceUrl": "https://usa.fage/nutrition",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Grade A pasteurized skimmed milk and cream, cultures, lactase enzyme.",
      "lactoseFree": true,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-2-split-raspberry",
    "name": "Total 2% Split Cup Raspberry Greek Yogurt",
    "displayName": "FAGE Total 2% Split Cup Raspberry Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage raspberry 2%",
      "Fage split cup raspberry"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-2-split-raspberry"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 80.0,
      "protein": 8.0,
      "carbs": 9.333,
      "fat": 1.667,
      "fiber": 0.667,
      "sugar": 7.333,
      "addedSugar": 4.667,
      "saturatedFat": 1.0,
      "sodium": 26.667,
      "cholesterol": 10.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-2-split-raspberry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 120,
        "protein": 12,
        "carbs": 14,
        "fat": 2.5,
        "fiber": 1,
        "sugar": 11,
        "addedSugar": 7,
        "saturatedFat": 1.5,
        "sodium": 40,
        "cholesterol": 15
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://usa.fage/fage-total-2-split-cup",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": false,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-2-split-mixed-berries",
    "name": "Total 2% Split Cup Mixed Berries Greek Yogurt",
    "displayName": "FAGE Total 2% Split Cup Mixed Berries Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage mixed berries 2%",
      "Fage split cup mixed berries"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-2-split-mixed-berries"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 80.0,
      "protein": 8.0,
      "carbs": 8.667,
      "fat": 1.667,
      "fiber": 0.0,
      "sugar": 7.333,
      "addedSugar": 4.667,
      "saturatedFat": 1.0,
      "sodium": 26.667,
      "cholesterol": 10.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-2-split-mixed-berries",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 120,
        "protein": 12,
        "carbs": 13,
        "fat": 2.5,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 7,
        "saturatedFat": 1.5,
        "sodium": 40,
        "cholesterol": 15
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://usa.fage/fage-total-2-split-cup",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": false,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-2-split-strawberry",
    "name": "Total 2% Split Cup Strawberry Greek Yogurt",
    "displayName": "FAGE Total 2% Split Cup Strawberry Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage strawberry 2%",
      "Fage split cup strawberry"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-2-split-strawberry"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 80.0,
      "protein": 8.0,
      "carbs": 8.667,
      "fat": 1.667,
      "fiber": 0.0,
      "sugar": 7.333,
      "addedSugar": 4.667,
      "saturatedFat": 1.0,
      "sodium": 30.0,
      "cholesterol": 10.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-2-split-strawberry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 120,
        "protein": 12,
        "carbs": 13,
        "fat": 2.5,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 7,
        "saturatedFat": 1.5,
        "sodium": 45,
        "cholesterol": 15
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://usa.fage/fage-total-2-split-cup",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": false,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-fage-total-2-split-blueberry",
    "name": "Total 2% Split Cup Blueberry Greek Yogurt",
    "displayName": "FAGE Total 2% Split Cup Blueberry Greek Yogurt",
    "brand": "FAGE",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Fage blueberry 2%",
      "Fage split cup blueberry"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "fage",
      "total-2-split-blueberry"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 80.0,
      "protein": 8.0,
      "carbs": 9.333,
      "fat": 1.667,
      "fiber": 0.667,
      "sugar": 7.333,
      "addedSugar": 4.667,
      "saturatedFat": 1.0,
      "sodium": 26.667,
      "cholesterol": 10.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "total-2-split-blueberry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 120,
        "protein": 12,
        "carbs": 14,
        "fat": 2.5,
        "fiber": 1,
        "sugar": 11,
        "addedSugar": 7,
        "saturatedFat": 1.5,
        "sodium": 40,
        "cholesterol": 15
      },
      "sourceProvenance": {
        "provider": "FAGE USA",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://usa.fage/fage-total-2-split-cup",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": false,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-siggis-plain-nonfat-skyr",
    "name": "Plain Nonfat Skyr",
    "displayName": "siggi's Plain Nonfat Skyr",
    "brand": "siggi's",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "siggis plain nonfat",
      "siggi's plain skyr",
      "siggis 0% plain"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "siggis",
      "plain-nonfat-skyr"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 58.82,
      "protein": 11.176,
      "carbs": 4.118,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 2.941,
      "addedSugar": 0.0,
      "saturatedFat": 0.0,
      "sodium": 38.235,
      "cholesterol": 5.882,
      "potassium": 123.529,
      "calcium": 100.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
        "grams": 170,
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "plain-nonfat-skyr",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "170 g",
        "servingGrams": 170,
        "calories": 100,
        "protein": 19,
        "carbs": 7,
        "fat": 0,
        "fiber": 0,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 0,
        "sodium": 65,
        "cholesterol": 10,
        "potassium": 210,
        "calcium": 170
      },
      "sourceProvenance": {
        "provider": "siggi's",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://siggis.com/product/plain-nonfat-24oz/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured pasteurized skim milk.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": false,
      "plain": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-siggis-vanilla-nonfat-skyr",
    "name": "Vanilla Nonfat Skyr",
    "displayName": "siggi's Vanilla Nonfat Skyr",
    "brand": "siggi's",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "siggis vanilla nonfat",
      "siggi's vanilla 0%",
      "siggis vanilla skyr"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "siggis",
      "vanilla-nonfat-skyr"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 70.59,
      "protein": 10.588,
      "carbs": 7.647,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.882,
      "addedSugar": 3.529,
      "saturatedFat": 0.0,
      "sodium": 35.294,
      "cholesterol": 5.882,
      "potassium": 117.647,
      "calcium": 94.118
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
        "grams": 170,
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "vanilla-nonfat-skyr",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "170 g",
        "servingGrams": 170,
        "calories": 120,
        "protein": 18,
        "carbs": 13,
        "fat": 0,
        "fiber": 0,
        "sugar": 10,
        "addedSugar": 6,
        "saturatedFat": 0,
        "sodium": 60,
        "cholesterol": 10,
        "potassium": 200,
        "calcium": 160
      },
      "sourceProvenance": {
        "provider": "siggi's",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://siggis.com/product/vanilla-nonfat-24oz/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured pasteurized skim milk, cane sugar, Madagascar Bourbon vanilla, fruit pectin.",
      "lactoseFree": false,
      "nonfat": true,
      "highProtein": true,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-siggis-vanilla-whole-milk-skyr",
    "name": "Vanilla Whole Milk Skyr",
    "displayName": "siggi's Vanilla Whole Milk Skyr",
    "brand": "siggi's",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "siggis vanilla whole milk",
      "siggi's whole milk vanilla skyr"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "siggis",
      "vanilla-whole-skyr"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 112.0,
      "protein": 10.4,
      "carbs": 8.8,
      "fat": 3.6,
      "fiber": 0.0,
      "sugar": 6.4,
      "addedSugar": 4.0,
      "saturatedFat": 2.4,
      "sodium": 48.0,
      "cholesterol": 16.0,
      "potassium": 136.0,
      "calcium": 96.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
        "grams": 125,
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "vanilla-whole-skyr",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "125 g",
        "servingGrams": 125,
        "calories": 140,
        "protein": 13,
        "carbs": 11,
        "fat": 4.5,
        "fiber": 0,
        "sugar": 8,
        "addedSugar": 5,
        "saturatedFat": 3,
        "sodium": 60,
        "cholesterol": 20,
        "potassium": 170,
        "calcium": 120
      },
      "sourceProvenance": {
        "provider": "siggi's",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://siggis.com/product/vanilla-whole-milk/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured pasteurized whole milk, cane sugar, Madagascar Bourbon vanilla, fruit pectin.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-siggis-vanilla-cinnamon-lowfat-skyr",
    "name": "Vanilla & Cinnamon Lowfat Skyr",
    "displayName": "siggi's Vanilla & Cinnamon Lowfat Skyr",
    "brand": "siggi's",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "siggis vanilla cinnamon",
      "siggi's vanilla cinnamon skyr"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "siggis",
      "vanilla-cinnamon-lowfat"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 93.33,
      "protein": 10.0,
      "carbs": 8.667,
      "fat": 1.333,
      "fiber": 0.0,
      "sugar": 7.333,
      "addedSugar": 4.667,
      "saturatedFat": 0.667,
      "sodium": 26.667,
      "cholesterol": 10.0,
      "potassium": 120.0,
      "calcium": 86.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "vanilla-cinnamon-lowfat",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 140,
        "protein": 15,
        "carbs": 13,
        "fat": 2,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 7,
        "saturatedFat": 1,
        "sodium": 40,
        "cholesterol": 15,
        "potassium": 180,
        "calcium": 130
      },
      "sourceProvenance": {
        "provider": "siggi's",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://siggis.com/product/vanilla-cinnamon-lowfat/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured pasteurized skim milk, pasteurized cream, cane sugar, organic honey, Madagascar Bourbon vanilla, fruit pectin, cinnamon.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": false,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-siggis-lower-sugar-vanilla-skyr",
    "name": "Lower Sugar Vanilla Skyr",
    "displayName": "siggi's Lower Sugar Vanilla Skyr",
    "brand": "siggi's",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "siggis lower sugar vanilla",
      "siggi's lower sugar skyr"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "siggis",
      "lower-sugar-vanilla"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 9.333,
      "carbs": 2.667,
      "fat": 2.0,
      "fiber": 0.0,
      "sugar": 1.333,
      "addedSugar": 0.0,
      "saturatedFat": 1.0,
      "sodium": 23.333,
      "cholesterol": 10.0,
      "potassium": 86.667,
      "calcium": 106.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "lower-sugar-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 100,
        "protein": 14,
        "carbs": 4,
        "fat": 3,
        "fiber": 0,
        "sugar": 2,
        "addedSugar": 0,
        "saturatedFat": 1.5,
        "sodium": 35,
        "cholesterol": 15,
        "potassium": 130,
        "calcium": 160
      },
      "sourceProvenance": {
        "provider": "siggi's",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://siggis.com/product/vanilla-multipack-lower-sugar/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized skim milk, pasteurized cream, milk protein concentrate, native corn starch, natural flavor, fruit pectin, fruit and vegetable juice concentrates, stevia Reb M, sea salt, live active cultures.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-too-good-vanilla-lowfat-greek-yogurt",
    "name": "Lower Sugar Vanilla Lowfat Greek Yogurt",
    "displayName": "Too Good Lower Sugar Vanilla Lowfat Greek Yogurt",
    "brand": "Too Good",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Two Good vanilla",
      "Too Good vanilla yogurt",
      "Two Good lower sugar vanilla"
    ],
    "tags": [
      "dairy",
      "yogurt",
      "branded",
      "too-good",
      "lower-sugar-vanilla"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53.33,
      "protein": 8.0,
      "carbs": 2.667,
      "fat": 1.333,
      "fiber": 0.0,
      "sugar": 1.333,
      "addedSugar": 0.0,
      "saturatedFat": 0.667,
      "sodium": 23.333,
      "cholesterol": 3.333,
      "potassium": 60.0,
      "calcium": 73.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 container",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodYogurtBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "yogurt",
      "productLine": "lower-sugar-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "150 g",
        "servingGrams": 150,
        "calories": 80,
        "protein": 12,
        "carbs": 4,
        "fat": 2,
        "fiber": 0,
        "sugar": 2,
        "addedSugar": 0,
        "saturatedFat": 1,
        "sodium": 35,
        "cholesterol": 5,
        "potassium": 90,
        "calcium": 110
      },
      "sourceProvenance": {
        "provider": "Target / Too Good",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-54609545",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Grade A ultra-filtered nonfat milk, cultured Grade A reduced fat milk, water, less than 1% tapioca starch, natural flavors, lemon juice concentrate, gellan gum, fruit and vegetable juice concentrate, stevia extract, sea salt, vanilla bean specks, vitamin D3, active yogurt cultures.",
      "lactoseFree": false,
      "nonfat": false,
      "highProtein": true,
      "lowerSugar": true,
      "plain": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized to ARI's canonical 100 g basis."
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

    if (
      typeof global.AriFoodDairy.isExpectedModule === "function"
    ) {
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
      ARI_YOGURT_BRAND_FOODS,
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
        ARI_YOGURT_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_YOGURT_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} yogurt-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodDairy &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodDairy.markModuleLoaded === "function"
  ) {
    global.AriFoodDairy.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodYogurtBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_YOGURT_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_YOGURT_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_YOGURT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_YOGURT_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getHighProtein() {
        return ARI_YOGURT_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.highProtein === true
          )
          .map(clone);
      },

      getLowerSugar() {
        return ARI_YOGURT_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.lowerSugar === true
          )
          .map(clone);
      },

      getLactoseFree() {
        return ARI_YOGURT_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.lactoseFree === true
          )
          .map(clone);
      },

      getPlain() {
        return ARI_YOGURT_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.plain === true
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
          ARI_YOGURT_BRAND_FOODS.find(
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
        "ari:food-yogurt-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_YOGURT_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_YOGURT_BRAND_FOODS.length} package-label yogurt records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);