// =====================================================
// ARI REBIRTH
// File: AriFoodEnergyDrinkBrands.js
// Version: 1.0.0
//
// Purpose:
//   Manufacturer-first branded energy-drink module for
//   ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - Red Bull
//   - Monster Energy
//   - CELSIUS
//   - Alani Nu
//   - Rockstar
//   - GHOST
//
// Coverage:
//   16 current branded energy-drink formulations.
//
// Canonical basis:
//   100 mL.
//
// Important:
//   Caffeine is stored as mg and normalized to 100 mL,
//   while the exact per-can caffeine value remains in
//   metadata.labelNutrition.
//
// Data policy:
//   - Exact current product/package data first.
//   - Official manufacturer source preferred.
//   - Current retailer label capture allowed when the
//     manufacturer does not expose the full panel.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodEnergyDrinkBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodEnergyDrinkBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "manufacturer-first branded energy-drink module",
  "recordCount": 16,
  "brands": [
    "Alani Nu",
    "CELSIUS",
    "GHOST",
    "Monster Energy",
    "Red Bull",
    "Rockstar"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official manufacturer nutrition/product pages",
    "Current retailer package-label captures when manufacturer pages expose product identity/caffeine but not the full Nutrition Facts panel",
    "No generic energy-drink substitution when an exact branded product exists"
  ],
  "rules": [
    "Caffeine is a first-class optional nutrition field measured in mg.",
    "Preserve exact can/container values in metadata.labelNutrition.",
    "Normalize package values mathematically to 100 mL.",
    "Keep sugar-sweetened and zero-sugar formulations separate.",
    "Keep flavor/product lines separate when the package nutrition differs.",
    "Do not infer caffeine from ingredients alone; use an explicit manufacturer or package value.",
    "Do not infer added sugar if a current label does not explicitly report it.",
    "Do not substitute sports drinks or hydration drinks for energy drinks.",
    "Do not create duplicate records solely for alternate can sizes when formulation is identical.",
    "Branded energy drinks outrank generic beverage fallback records.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_ENERGY_DRINK_BRAND_FOODS =
    [
  {
    "id": "beverage-energy-red-bull-original",
    "name": "Energy Drink",
    "displayName": "Red Bull Energy Drink",
    "brand": "Red Bull",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Red Bull",
      "Original Red Bull",
      "Red Bull Original"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "original",
      "red-bull"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 44.0,
      "protein": 0.0,
      "carbs": 11.6,
      "fat": 0.0,
      "sodium": 42.0,
      "caffeine": 32.0,
      "sugar": 10.4
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (8.4 fl oz / 250 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 250,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (8.4 fl oz / 250 mL)",
        "servingMilliliters": 250,
        "calories": 110,
        "protein": 0,
        "carbs": 29,
        "fat": 0,
        "sodium": 105,
        "caffeine": 80,
        "sugar": 26
      },
      "sourceProvenance": {
        "provider": "Red Bull",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-energy-drink",
        "labelUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-energy-drink-ingredients-list"
      },
      "ingredients": "Caffeine, taurine, B-group vitamins, sugars, water.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-red-bull-sugarfree",
    "name": "Sugarfree",
    "displayName": "Red Bull Sugarfree",
    "brand": "Red Bull",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Red Bull Sugar Free",
      "Sugarfree Red Bull",
      "Red Bull SF"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "sugarfree",
      "red-bull"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 4.0,
      "protein": 0.0,
      "carbs": 0.8,
      "fat": 0.0,
      "sodium": 42.0,
      "caffeine": 32.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (8.4 fl oz / 250 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 250,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "sugarfree",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (8.4 fl oz / 250 mL)",
        "servingMilliliters": 250,
        "calories": 10,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 105,
        "caffeine": 80,
        "sugar": 0
      },
      "sourceProvenance": {
        "provider": "Red Bull",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-sugarfree",
        "labelUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-sugarfree-ingredients-list"
      },
      "ingredients": "Caffeine, taurine, B-group vitamins, sucralose, acesulfame K, water.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-red-bull-zero",
    "name": "Zero",
    "displayName": "Red Bull Zero",
    "brand": "Red Bull",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Red Bull Zero",
      "Zero Red Bull"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "zero",
      "red-bull"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.0,
      "protein": 0.0,
      "carbs": 2.0,
      "fat": 0.0,
      "sodium": 8.0,
      "caffeine": 32.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (8.4 fl oz / 250 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 250,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "zero",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (8.4 fl oz / 250 mL)",
        "servingMilliliters": 250,
        "calories": 5,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sodium": 20,
        "caffeine": 80,
        "sugar": 0
      },
      "sourceProvenance": {
        "provider": "Red Bull",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-zero",
        "labelUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-zero-ingredients-list"
      },
      "ingredients": "Caffeine, taurine, B-group vitamins, monk fruit extract, sucralose, erythritol, water.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-red-bull-red-edition",
    "name": "Red Edition",
    "displayName": "Red Bull Red Edition",
    "brand": "Red Bull",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Red Bull Red Edition",
      "Watermelon Red Bull"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "red-edition",
      "red-bull"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 44.0,
      "protein": 0.0,
      "carbs": 11.2,
      "fat": 0.0,
      "sodium": 36.0,
      "caffeine": 32.0,
      "sugar": 10.8
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (8.4 fl oz / 250 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 250,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "red-edition",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (8.4 fl oz / 250 mL)",
        "servingMilliliters": 250,
        "calories": 110,
        "protein": 0,
        "carbs": 28,
        "fat": 0,
        "sodium": 90,
        "caffeine": 80,
        "sugar": 27
      },
      "sourceProvenance": {
        "provider": "Red Bull",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-red-edition",
        "labelUrl": "https://www.redbull.com/us-en/energydrink/products/red-bull-red-edition-ingredients-list"
      },
      "ingredients": "Caffeine, taurine, B-group vitamins, sugars, water, flavoring.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-monster-original",
    "name": "Original Green",
    "displayName": "Monster Energy Original Green",
    "brand": "Monster Energy",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Monster",
      "Monster Original",
      "Green Monster",
      "Monster Energy Original"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "original",
      "monster-energy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.63,
      "protein": 0.0,
      "carbs": 12.262,
      "fat": 0.0,
      "sodium": 78.224,
      "caffeine": 33.827,
      "sugar": 11.416,
      "addedSugar": 11.416
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 230,
        "protein": 0,
        "carbs": 58,
        "fat": 0,
        "sodium": 370,
        "caffeine": 160,
        "sugar": 54,
        "addedSugar": 54
      },
      "sourceProvenance": {
        "provider": "Monster Energy",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.monsterenergy.com/en-us/energy-drinks/monster-energy/original-green/",
        "labelUrl": "https://www.target.com/p/-/A-12953443"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-monster-zero-sugar",
    "name": "Zero Sugar",
    "displayName": "Monster Energy Zero Sugar",
    "brand": "Monster Energy",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Monster Zero Sugar",
      "Zero Sugar Monster"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "zero-sugar",
      "monster-energy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.11,
      "protein": 0.0,
      "carbs": 1.268,
      "fat": 0.0,
      "sodium": 80.338,
      "caffeine": 33.827,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 6,
        "fat": 0,
        "sodium": 380,
        "caffeine": 160,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Monster Energy",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.monsterenergy.com/en-us/energy-drinks/monster-energy/zero-sugar/",
        "labelUrl": "https://www.target.com/p/-/A-13370157"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-monster-zero-ultra",
    "name": "Zero Ultra",
    "displayName": "Monster Energy Zero Ultra",
    "brand": "Monster Energy",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "White Monster",
      "Monster Ultra White",
      "Monster Zero Ultra",
      "Ultra Zero"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "ultra-zero",
      "monster-energy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.11,
      "protein": 0.0,
      "carbs": 1.268,
      "fat": 0.0,
      "sodium": 80.338,
      "caffeine": 31.712,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "ultra-zero",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 6,
        "fat": 0,
        "sodium": 380,
        "caffeine": 150,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Monster Energy",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.monsterenergy.com/en-us/energy-drinks/zero-sugar/zero-ultra/",
        "labelUrl": "https://www.target.com/p/-/A-14940501"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-monster-ultra-strawberry-dreams",
    "name": "Ultra Strawberry Dreams",
    "displayName": "Monster Energy Ultra Strawberry Dreams",
    "brand": "Monster Energy",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Monster Strawberry Dreams",
      "Ultra Strawberry Dreams"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "ultra-strawberry-dreams",
      "monster-energy"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.11,
      "protein": 0.0,
      "carbs": 1.268,
      "fat": 0.0,
      "sodium": 54.968,
      "caffeine": 31.712,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "ultra-strawberry-dreams",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 6,
        "fat": 0,
        "sodium": 260,
        "caffeine": 150,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Monster Energy",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.monsterenergy.com/en-us/energy-drinks/zero-sugar/ultra-strawberry-dreams/",
        "labelUrl": "https://www.target.com/p/-/A-87852180"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-celsius-sparkling-orange",
    "name": "Sparkling Orange",
    "displayName": "CELSIUS Sparkling Orange",
    "brand": "CELSIUS",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Celsius Orange",
      "CELSIUS Sparkling Orange"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "sparkling-orange",
      "celsius"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.82,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 1.408,
      "caffeine": 56.338,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 355,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "sparkling-orange",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 10,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 5,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "CELSIUS",
        "sourceType": "official manufacturer caffeine specification + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.celsius.com/",
        "labelUrl": "https://www.target.com/p/-/A-88371393"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-celsius-electric-vibe",
    "name": "Electric Vibe",
    "displayName": "CELSIUS Electric Vibe",
    "brand": "CELSIUS",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Celsius Electric Vibe",
      "Electric Vibe Celsius"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "electric-vibe",
      "celsius"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 1.41,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 56.338,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 355,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "electric-vibe",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 5,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 0,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "CELSIUS",
        "sourceType": "official manufacturer caffeine specification + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.celsius.com/essential-facts/",
        "labelUrl": "https://www.target.com/p/-/A-1009093154"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-alani-nu-pink-slush",
    "name": "Pink Slush",
    "displayName": "Alani Nu Pink Slush",
    "brand": "Alani Nu",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Alani Pink Slush",
      "Pink Slush Alani"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "pink-slush",
      "alani-nu"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 1.41,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sodium": 50.704,
      "caffeine": 56.338,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 355,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "pink-slush",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 5,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sodium": 180,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Alani Nu",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.alaninu.com/products/energy-drink-pink-slush",
        "labelUrl": "https://www.alaninu.com/products/energy-drink-pink-slush"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-alani-nu-strawberry-sunrise",
    "name": "Strawberry Sunrise",
    "displayName": "Alani Nu Strawberry Sunrise",
    "brand": "Alani Nu",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Alani Strawberry Sunrise",
      "Strawberry Sunrise Alani"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "strawberry-sunrise",
      "alani-nu"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 4.23,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sodium": 56.338,
      "caffeine": 56.338,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 355,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "strawberry-sunrise",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 15,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sodium": 200,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Alani Nu",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.alaninu.com/products/energy-drink-strawberry-sunrise",
        "labelUrl": "https://www.alaninu.com/products/energy-drink-strawberry-sunrise"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-rockstar-original",
    "name": "The Original",
    "displayName": "Rockstar The Original",
    "brand": "Rockstar",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Rockstar Original",
      "Original Rockstar",
      "Rockstar Energy"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "original",
      "rockstar"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.97,
      "protein": 0.0,
      "carbs": 13.531,
      "fat": 0.0,
      "sodium": 17.97,
      "caffeine": 33.827,
      "sugar": 13.319,
      "addedSugar": 13.319
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 260,
        "protein": 0,
        "carbs": 64,
        "fat": 0,
        "sodium": 85,
        "caffeine": 160,
        "sugar": 63,
        "addedSugar": 63
      },
      "sourceProvenance": {
        "provider": "Rockstar",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.rockstarenergy.com/products/the-original",
        "labelUrl": "https://www.rockstarenergy.com/products/the-original"
      },
      "ingredients": "Carbonated water, sugar, glucose syrup, citric acid, taurine, natural and artificial flavor, sodium citrate, caffeine, and other ingredients.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-rockstar-pure-zero-fruit-punch",
    "name": "Pure Zero Fruit Punch",
    "displayName": "Rockstar Pure Zero Fruit Punch",
    "brand": "Rockstar",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Rockstar Pure Zero",
      "Rockstar Zero Fruit Punch",
      "Pure Zero Fruit Punch"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "pure-zero-fruit-punch",
      "rockstar"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 4.23,
      "protein": 0.0,
      "carbs": 0.423,
      "fat": 0.0,
      "sodium": 80.338,
      "caffeine": 50.74,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "pure-zero-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 20,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 380,
        "caffeine": 240,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Rockstar",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.rockstarenergy.com/products/pure-zero-fruit-punch",
        "labelUrl": "https://www.rockstarenergy.com/products/pure-zero-fruit-punch"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-ghost-original",
    "name": "Energy Original",
    "displayName": "GHOST Energy Original",
    "brand": "GHOST",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ghost Energy",
      "Ghost Original",
      "GHOST Energy Original"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "original",
      "ghost"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.11,
      "protein": 0.0,
      "carbs": 0.423,
      "fat": 0.0,
      "sodium": 7.4,
      "caffeine": 42.283,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 35,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "GHOST",
        "sourceType": "current retailer package-label capture for GHOST Energy",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-95024723"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-energy-ghost-blue-raspberry",
    "name": "Energy Blue Raspberry",
    "displayName": "GHOST Energy Blue Raspberry",
    "brand": "GHOST",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ghost Blue Raspberry",
      "GHOST Energy Blue Raspberry"
    ],
    "tags": [
      "beverage",
      "energy-drink",
      "branded",
      "blue-raspberry",
      "ghost"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.11,
      "protein": 0.0,
      "carbs": 0.423,
      "fat": 0.0,
      "sodium": 6.342,
      "caffeine": 42.283,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (16 fl oz / 473 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 473,
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
    "source": "AriFoodEnergyDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "energy-drink",
      "productLine": "blue-raspberry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 30,
        "caffeine": 200,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "GHOST",
        "sourceType": "current retailer package-label capture for GHOST Energy",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-95024724"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
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
    if (!global.AriFoodBeverages) {
      return false;
    }

    if (
      typeof global.AriFoodBeverages.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodBeverages.isExpectedModule(
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
      global.AriFoodBeverages &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodBeverages.markModuleFailed === "function"
    ) {
      global.AriFoodBeverages.markModuleFailed(
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
      ARI_ENERGY_DRINK_BRAND_FOODS,
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
        ARI_ENERGY_DRINK_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_ENERGY_DRINK_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      runtimeInternetRequired:
        false,

      brandFirst:
        true,

      caffeineTracked:
        true,

      canonicalBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} energy-drink record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodBeverages &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodBeverages.markModuleLoaded === "function"
  ) {
    global.AriFoodBeverages.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodEnergyDrinkBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_ENERGY_DRINK_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_ENERGY_DRINK_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_ENERGY_DRINK_BRAND_FOODS.map(
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

        return ARI_ENERGY_DRINK_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_ENERGY_DRINK_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.sugar
              ) === 0
          )
          .map(clone);
      },

      getHighCaffeine(minimumMgPerContainer = 200) {
        const threshold =
          Number(minimumMgPerContainer);

        return ARI_ENERGY_DRINK_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.caffeine || 0
              ) >= threshold
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
          ARI_ENERGY_DRINK_BRAND_FOODS.find(
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
        "ari:food-energy-drink-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_ENERGY_DRINK_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

            caffeineTracked:
              true,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_ENERGY_DRINK_BRAND_FOODS.length} branded energy-drink records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
