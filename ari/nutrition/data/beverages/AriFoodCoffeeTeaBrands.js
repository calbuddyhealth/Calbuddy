// =====================================================
// ARI REBIRTH
// File: AriFoodCoffeeTeaBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first packaged coffee and tea module for
//   ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - Starbucks
//   - Dunkin'
//   - STōK
//   - La Colombe
//   - Pure Leaf
//   - Gold Peak
//   - AriZona
//
// Coverage:
//   23 packaged ready-to-drink coffee and tea products.
//
// Canonical basis:
//   100 mL.
//
// Important:
//   - Packaged grocery products only.
//   - Cafe-made/customized drinks are not included.
//   - Caffeine is stored only when an explicit current
//     product/package value is available.
//   - No fake caffeine values are inferred for tea.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodCoffeeTeaBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCoffeeTeaBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first packaged coffee and tea module",
  "recordCount": 23,
  "brands": [
    "AriZona",
    "Dunkin'",
    "Gold Peak",
    "La Colombe",
    "Pure Leaf",
    "STōK",
    "Starbucks"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official manufacturer nutrition/product pages",
    "Current retailer package-label captures",
    "Current brand-expert/manufacturer caffeine disclosures when the Nutrition Facts panel omits caffeine"
  ],
  "rules": [
    "This module covers packaged ready-to-drink coffee and tea, not customized cafe-made drinks.",
    "Preserve exact package nutrition in metadata.labelNutrition.",
    "Normalize package values mathematically to 100 mL.",
    "Track caffeine only when an explicit current product/package value is available.",
    "Do not infer caffeine solely because a product is labeled caffeinated.",
    "Keep unsweetened, sweetened, zero-sugar, milk-based, oatmilk, and flavored formulations separate.",
    "Do not create duplicate records solely for alternate bottle or multipack sizes when the formulation is unchanged.",
    "Packaged Starbucks/Dunkin products remain distinct from store-made cafe recipes.",
    "Branded products outrank AriFoodBeverageCore generic coffee/tea fallbacks.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_COFFEE_TEA_BRAND_FOODS =
    [
  {
    "id": "beverage-coffee-starbucks-frappuccino-coffee",
    "name": "Frappuccino Coffee",
    "displayName": "Starbucks Frappuccino Coffee",
    "brand": "Starbucks",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Starbucks Frappuccino Coffee",
      "Starbucks bottled Frappuccino Coffee",
      "Starbucks coffee frapp bottle"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "frappuccino-coffee",
      "starbucks"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 74.07,
      "protein": 2.222,
      "carbs": 13.333,
      "fat": 1.111,
      "sodium": 34.568,
      "sugar": 11.605,
      "addedSugar": 8.395,
      "potassium": 167.16,
      "calcium": 78.765,
      "caffeine": 27.16
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "frappuccino-coffee",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 300,
        "protein": 9,
        "carbs": 54,
        "fat": 4.5,
        "sodium": 140,
        "sugar": 47,
        "addedSugar": 34,
        "potassium": 677,
        "calcium": 319,
        "caffeine": 110
      },
      "sourceProvenance": {
        "provider": "Starbucks",
        "sourceType": "current retailer package-label capture + Pepsi brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-12959301"
      },
      "ingredients": "Brewed Starbucks coffee (water, coffee), reduced-fat milk, sugar, maltodextrin, pectin.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-starbucks-frappuccino-vanilla",
    "name": "Frappuccino Vanilla",
    "displayName": "Starbucks Frappuccino Vanilla",
    "brand": "Starbucks",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Starbucks Vanilla Frappuccino",
      "Starbucks bottled vanilla Frappuccino"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "frappuccino-vanilla",
      "starbucks"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 71.6,
      "protein": 2.222,
      "carbs": 12.593,
      "fat": 1.111,
      "sodium": 37.037,
      "sugar": 10.617,
      "addedSugar": 7.407,
      "potassium": 174.568,
      "calcium": 78.519,
      "caffeine": 14.815
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "frappuccino-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 290,
        "protein": 9,
        "carbs": 51,
        "fat": 4.5,
        "sodium": 150,
        "sugar": 43,
        "addedSugar": 30,
        "potassium": 707,
        "calcium": 318,
        "caffeine": 60
      },
      "sourceProvenance": {
        "provider": "Starbucks",
        "sourceType": "current retailer package-label capture + Pepsi brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-12953983"
      },
      "ingredients": "Brewed Starbucks coffee (water, coffee), reduced-fat milk, sugar, maltodextrin, pectin, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-starbucks-frappuccino-caramel",
    "name": "Frappuccino Caramel",
    "displayName": "Starbucks Frappuccino Caramel",
    "brand": "Starbucks",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Starbucks Caramel Frappuccino",
      "Starbucks bottled caramel Frappuccino"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "frappuccino-caramel",
      "starbucks"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 74.07,
      "protein": 2.222,
      "carbs": 13.333,
      "fat": 1.235,
      "sodium": 37.037,
      "sugar": 11.358,
      "addedSugar": 7.901,
      "potassium": 173.827,
      "calcium": 79.753,
      "caffeine": 22.222
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "frappuccino-caramel",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 300,
        "protein": 9,
        "carbs": 54,
        "fat": 5,
        "sodium": 150,
        "sugar": 46,
        "addedSugar": 32,
        "potassium": 704,
        "calcium": 323,
        "caffeine": 90
      },
      "sourceProvenance": {
        "provider": "Starbucks",
        "sourceType": "current retailer package-label capture + Pepsi brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-14936867"
      },
      "ingredients": "Brewed Starbucks coffee (water, coffee), reduced-fat milk, sugar, maltodextrin, natural flavors, pectin.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-starbucks-frappuccino-mocha",
    "name": "Frappuccino Mocha",
    "displayName": "Starbucks Frappuccino Mocha",
    "brand": "Starbucks",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Starbucks Mocha Frappuccino",
      "Starbucks bottled mocha Frappuccino"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "frappuccino-mocha",
      "starbucks"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 2.469,
      "carbs": 11.852,
      "fat": 1.111,
      "sodium": 34.568,
      "sugar": 11.358,
      "addedSugar": 7.901,
      "potassium": 175.556,
      "calcium": 78.025,
      "caffeine": 25.926
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "frappuccino-mocha",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 270,
        "protein": 10,
        "carbs": 48,
        "fat": 4.5,
        "sodium": 140,
        "sugar": 46,
        "addedSugar": 32,
        "potassium": 711,
        "calcium": 316,
        "caffeine": 105
      },
      "sourceProvenance": {
        "provider": "Starbucks",
        "sourceType": "current retailer package-label capture + Pepsi brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-12958806"
      },
      "ingredients": "Brewed Starbucks coffee (water, coffee), reduced-fat milk, sugar, cocoa, pectin.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-dunkin-iced-coffee-original",
    "name": "Iced Coffee Original",
    "displayName": "Dunkin' Iced Coffee Original",
    "brand": "Dunkin'",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Dunkin Original Iced Coffee",
      "Dunkin bottled iced coffee",
      "Dunkin Donuts Original"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "iced-coffee-original",
      "dunkin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 61.73,
      "protein": 1.728,
      "carbs": 9.877,
      "fat": 1.728,
      "sodium": 20.988,
      "sugar": 9.63,
      "addedSugar": 6.914,
      "potassium": 150.617,
      "calcium": 61.728,
      "caffeine": 42.222
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "iced-coffee-original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 250,
        "protein": 7,
        "carbs": 40,
        "fat": 7,
        "sodium": 85,
        "sugar": 39,
        "addedSugar": 28,
        "potassium": 610,
        "calcium": 250,
        "caffeine": 171
      },
      "sourceProvenance": {
        "provider": "Dunkin'",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-52104436"
      },
      "ingredients": "Coffee (water, coffee), skim milk, cane sugar, cream, less than 2% potassium carbonate, potassium phosphate, ascorbic acid, gellan gum, carrageenan.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-dunkin-iced-coffee-mocha",
    "name": "Iced Coffee Mocha",
    "displayName": "Dunkin' Iced Coffee Mocha",
    "brand": "Dunkin'",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Dunkin Mocha Iced Coffee",
      "Dunkin bottled mocha",
      "Dunkin Donuts Mocha"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-coffee",
      "iced-coffee-mocha",
      "dunkin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 66.67,
      "protein": 1.975,
      "carbs": 10.617,
      "fat": 1.975,
      "sodium": 22.222,
      "fiber": 0.247,
      "sugar": 9.877,
      "addedSugar": 7.407,
      "potassium": 150.617,
      "calcium": 61.728,
      "caffeine": 45.926
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (13.7 fl oz / 405 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 405,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-coffee",
      "productLine": "iced-coffee-mocha",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (13.7 fl oz / 405 mL)",
        "servingMilliliters": 405,
        "calories": 270,
        "protein": 8,
        "carbs": 43,
        "fat": 8,
        "sodium": 90,
        "fiber": 1,
        "sugar": 40,
        "addedSugar": 30,
        "potassium": 610,
        "calcium": 250,
        "caffeine": 186
      },
      "sourceProvenance": {
        "provider": "Dunkin'",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-52104438"
      },
      "ingredients": "Skim milk, coffee (water, coffee), cane sugar, cream, less than 2% cocoa processed with alkali, potassium carbonate, potassium phosphate, gellan gum, ascorbic acid.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-stok-cold-brew-unsweetened",
    "name": "Un-Sweet Black Cold Brew",
    "displayName": "STōK Un-Sweet Black Cold Brew",
    "brand": "STōK",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "STOK Unsweetened Cold Brew",
      "STōK Black Unsweetened",
      "STOK Un-Sweet"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "cold-brew-coffee",
      "unsweetened-black",
      "stok"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 4.17,
      "protein": 0.278,
      "carbs": 0.833,
      "fat": 0.0,
      "sodium": 2.778,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 80.556,
      "calcium": 0.0,
      "caffeine": 34.722
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (360 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 360,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "cold-brew-coffee",
      "productLine": "unsweetened-black",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (360 mL)",
        "servingMilliliters": 360,
        "calories": 15,
        "protein": 1,
        "carbs": 3,
        "fat": 0,
        "sodium": 10,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 290,
        "calcium": 0,
        "caffeine": 125
      },
      "sourceProvenance": {
        "provider": "STōK",
        "sourceType": "official manufacturer nutrition panel + current brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.stokbrew.com/cold-brew/cold-brew-coffee/unsweetened-cold-brew-coffee-48oz",
        "labelUrl": "https://www.target.com/p/-/A-50694768"
      },
      "ingredients": "Coffee (filtered water, coffee), natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-stok-cold-brew-extra-bold",
    "name": "Extra Bold Black Cold Brew",
    "displayName": "STōK Extra Bold Black Cold Brew",
    "brand": "STōK",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "STOK Extra Bold",
      "STōK Extra Bold Cold Brew",
      "STOK Extra Bold Unsweetened"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "cold-brew-coffee",
      "extra-bold-unsweetened",
      "stok"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 5.56,
      "protein": 0.278,
      "carbs": 0.833,
      "fat": 0.0,
      "sodium": 2.778,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 83.333,
      "calcium": 0.0,
      "caffeine": 47.222
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (360 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 360,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "cold-brew-coffee",
      "productLine": "extra-bold-unsweetened",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (360 mL)",
        "servingMilliliters": 360,
        "calories": 20,
        "protein": 1,
        "carbs": 3,
        "fat": 0,
        "sodium": 10,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 300,
        "calcium": 0,
        "caffeine": 170
      },
      "sourceProvenance": {
        "provider": "STōK",
        "sourceType": "current retailer package-label capture + STōK caffeine specification",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-78694687"
      },
      "ingredients": "Coffee (filtered water, coffee), natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-stok-cold-brew-not-too-sweet",
    "name": "Not Too Sweet Black Cold Brew",
    "displayName": "STōK Not Too Sweet Black Cold Brew",
    "brand": "STōK",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "STOK Not Too Sweet",
      "STōK Not Too Sweet Cold Brew"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "cold-brew-coffee",
      "not-too-sweet",
      "stok"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 19.44,
      "protein": 0.278,
      "carbs": 4.167,
      "fat": 0.0,
      "sodium": 2.778,
      "fiber": 0.0,
      "sugar": 3.333,
      "addedSugar": 3.333,
      "potassium": 80.556,
      "calcium": 0.0,
      "caffeine": 36.111
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (360 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 360,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "cold-brew-coffee",
      "productLine": "not-too-sweet",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (360 mL)",
        "servingMilliliters": 360,
        "calories": 70,
        "protein": 1,
        "carbs": 15,
        "fat": 0,
        "sodium": 10,
        "fiber": 0,
        "sugar": 12,
        "addedSugar": 12,
        "potassium": 290,
        "calcium": 0,
        "caffeine": 130
      },
      "sourceProvenance": {
        "provider": "STōK",
        "sourceType": "current retailer package-label capture + STōK caffeine specification",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-50694766"
      },
      "ingredients": "Coffee (filtered water, coffee), cane sugar, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-stok-cold-brew-cappuccino",
    "name": "Cappuccino Cold Brew",
    "displayName": "STōK Cappuccino Cold Brew",
    "brand": "STōK",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "STOK Cappuccino",
      "STōK Cappuccino Cold Brew",
      "STOK creamed cold brew"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "cold-brew-coffee",
      "cappuccino",
      "stok"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 39.44,
      "protein": 1.408,
      "carbs": 6.479,
      "fat": 0.986,
      "sodium": 28.169,
      "fiber": 0.0,
      "sugar": 5.352,
      "addedSugar": 3.662,
      "potassium": 157.746,
      "calcium": 50.704,
      "caffeine": 36.62
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (355 mL)",
        "amount": 1,
        "unit": "serving",
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "cold-brew-coffee",
      "productLine": "cappuccino",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 140,
        "protein": 5,
        "carbs": 23,
        "fat": 3.5,
        "sodium": 100,
        "fiber": 0,
        "sugar": 19,
        "addedSugar": 13,
        "potassium": 560,
        "calcium": 180,
        "caffeine": 130
      },
      "sourceProvenance": {
        "provider": "STōK",
        "sourceType": "current retailer package-label capture + STōK brand-expert caffeine value",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-89613870"
      },
      "ingredients": "Coffee (filtered water, coffee), skim milk, cane sugar, cream, gellan gum, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-la-colombe-everyday-draft-latte",
    "name": "Everyday Draft Latte",
    "displayName": "La Colombe Everyday Draft Latte",
    "brand": "La Colombe",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "La Colombe Everyday Latte",
      "La Colombe Draft Latte",
      "La Colombe Double Draft Latte"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-latte",
      "everyday-draft-latte",
      "la-colombe"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.87,
      "protein": 2.256,
      "carbs": 5.639,
      "fat": 1.88,
      "sodium": 56.391,
      "fiber": 0.752,
      "sugar": 4.511,
      "addedSugar": 1.504,
      "potassium": 146.617,
      "calcium": 82.707,
      "caffeine": 58.271
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (9 fl oz / 266 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 266,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-latte",
      "productLine": "everyday-draft-latte",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (9 fl oz / 266 mL)",
        "servingMilliliters": 266,
        "calories": 130,
        "protein": 6,
        "carbs": 15,
        "fat": 5,
        "sodium": 150,
        "fiber": 2,
        "sugar": 12,
        "addedSugar": 4,
        "potassium": 390,
        "calcium": 220,
        "caffeine": 155
      },
      "sourceProvenance": {
        "provider": "La Colombe",
        "sourceType": "official manufacturer nutrition panel and caffeine specification",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.lacolombe.com/products/draft-latte",
        "labelUrl": "https://www.lacolombe.com/products/draft-latte"
      },
      "ingredients": "Whole milk, coffee (water, coffee), cane sugar, less than 1% acacia gum, gellan gum, lactase, natural flavors, nitrous oxide, trisodium phosphate, disodium phosphate.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-la-colombe-triple-draft-latte",
    "name": "Triple Draft Latte",
    "displayName": "La Colombe Triple Draft Latte",
    "brand": "La Colombe",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "La Colombe Triple Latte",
      "La Colombe Triple Draft"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-latte",
      "triple-draft-latte",
      "la-colombe"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.87,
      "protein": 2.256,
      "carbs": 6.015,
      "fat": 1.88,
      "sodium": 90.226,
      "fiber": 0.752,
      "sugar": 4.511,
      "addedSugar": 1.504,
      "potassium": 165.414,
      "calcium": 82.707,
      "caffeine": 73.308
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (9 fl oz / 266 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 266,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-latte",
      "productLine": "triple-draft-latte",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (9 fl oz / 266 mL)",
        "servingMilliliters": 266,
        "calories": 130,
        "protein": 6,
        "carbs": 16,
        "fat": 5,
        "sodium": 240,
        "fiber": 2,
        "sugar": 12,
        "addedSugar": 4,
        "potassium": 440,
        "calcium": 220,
        "caffeine": 195
      },
      "sourceProvenance": {
        "provider": "La Colombe",
        "sourceType": "official manufacturer nutrition panel and caffeine specification",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.lacolombe.com/products/triple-draft-latte",
        "labelUrl": "https://www.lacolombe.com/products/triple-draft-latte"
      },
      "ingredients": "Whole milk, coffee (water, coffee), cane sugar, less than 1% acacia gum, gellan gum, lactase, natural flavors, nitrous oxide, trisodium phosphate, disodium phosphate.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-la-colombe-vanilla-draft-latte",
    "name": "Vanilla Draft Latte",
    "displayName": "La Colombe Vanilla Draft Latte",
    "brand": "La Colombe",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "La Colombe Vanilla Latte",
      "La Colombe Vanilla Draft"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-latte",
      "vanilla-draft-latte",
      "la-colombe"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.87,
      "protein": 2.256,
      "carbs": 5.639,
      "fat": 1.88,
      "sodium": 60.15,
      "fiber": 0.752,
      "sugar": 4.511,
      "addedSugar": 1.504,
      "potassium": 127.82,
      "calcium": 78.947,
      "caffeine": 58.271
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (9 fl oz / 266 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 266,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-latte",
      "productLine": "vanilla-draft-latte",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (9 fl oz / 266 mL)",
        "servingMilliliters": 266,
        "calories": 130,
        "protein": 6,
        "carbs": 15,
        "fat": 5,
        "sodium": 160,
        "fiber": 2,
        "sugar": 12,
        "addedSugar": 4,
        "potassium": 340,
        "calcium": 210,
        "caffeine": 155
      },
      "sourceProvenance": {
        "provider": "La Colombe",
        "sourceType": "current retailer package-label capture with current caffeine specification",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-90926000"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-la-colombe-mocha-draft-latte",
    "name": "Mocha Draft Latte",
    "displayName": "La Colombe Mocha Draft Latte",
    "brand": "La Colombe",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "La Colombe Mocha Latte",
      "La Colombe Mocha Draft"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-latte",
      "mocha-draft-latte",
      "la-colombe"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.87,
      "protein": 2.256,
      "carbs": 5.639,
      "fat": 1.88,
      "sodium": 63.91,
      "fiber": 0.752,
      "sugar": 4.511,
      "addedSugar": 1.504,
      "potassium": 142.857,
      "calcium": 78.947,
      "caffeine": 58.271
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (9 fl oz / 266 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 266,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-latte",
      "productLine": "mocha-draft-latte",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (9 fl oz / 266 mL)",
        "servingMilliliters": 266,
        "calories": 130,
        "protein": 6,
        "carbs": 15,
        "fat": 5,
        "sodium": 170,
        "fiber": 2,
        "sugar": 12,
        "addedSugar": 4,
        "potassium": 380,
        "calcium": 210,
        "caffeine": 155
      },
      "sourceProvenance": {
        "provider": "La Colombe",
        "sourceType": "current retailer package-label capture with current caffeine specification",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-90926097"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-coffee-la-colombe-oatmilk-vanilla-draft-latte",
    "name": "Oatmilk Vanilla Draft Latte",
    "displayName": "La Colombe Oatmilk Vanilla Draft Latte",
    "brand": "La Colombe",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "La Colombe Oatmilk Vanilla",
      "La Colombe Oat Milk Vanilla Latte"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-latte",
      "oatmilk-vanilla-draft-latte",
      "la-colombe",
      "dairy-free",
      "oatmilk"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 52.63,
      "protein": 0.752,
      "carbs": 9.398,
      "fat": 1.504,
      "sodium": 131.579,
      "fiber": 2.256,
      "sugar": 2.632,
      "addedSugar": 2.256,
      "potassium": 90.226,
      "calcium": 45.113,
      "caffeine": 45.113
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (9 fl oz / 266 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 266,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-latte",
      "productLine": "oatmilk-vanilla-draft-latte",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (9 fl oz / 266 mL)",
        "servingMilliliters": 266,
        "calories": 140,
        "protein": 2,
        "carbs": 25,
        "fat": 4,
        "sodium": 350,
        "fiber": 6,
        "sugar": 7,
        "addedSugar": 6,
        "potassium": 240,
        "calcium": 120,
        "caffeine": 120
      },
      "sourceProvenance": {
        "provider": "La Colombe",
        "sourceType": "current retailer package-label capture with current caffeine specification",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-90923038"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-tea-pure-leaf-unsweetened-black",
    "name": "Unsweetened Black Tea",
    "displayName": "Pure Leaf Unsweetened Black Tea",
    "brand": "Pure Leaf",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pure Leaf Unsweetened",
      "Pure Leaf Black Tea Unsweetened"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "unsweetened-black-tea",
      "pure-leaf"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (18.5 fl oz / 547 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 547,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "unsweetened-black-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (18.5 fl oz / 547 mL)",
        "servingMilliliters": 547,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Pure Leaf",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.pureleaf.com/our-products/?product=Unsweetened+Tea",
        "labelUrl": "https://www.target.com/p/-/A-15275592"
      },
      "ingredients": "Brewed black tea, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Product is caffeinated, but an exact current per-bottle caffeine value is intentionally omitted because the current Nutrition Facts panel does not publish it."
    }
  },
  {
    "id": "beverage-tea-pure-leaf-sweet-black",
    "name": "Sweet Black Tea",
    "displayName": "Pure Leaf Sweet Black Tea",
    "brand": "Pure Leaf",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pure Leaf Sweet Tea",
      "Pure Leaf Sweet Black Tea"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "sweet-black-tea",
      "pure-leaf"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 29.25,
      "protein": 0.0,
      "carbs": 7.678,
      "fat": 0.0,
      "sodium": 0.914,
      "sugar": 7.678,
      "addedSugar": 7.678
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (18.5 fl oz / 547 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 547,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "sweet-black-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (18.5 fl oz / 547 mL)",
        "servingMilliliters": 547,
        "calories": 160,
        "protein": 0,
        "carbs": 42,
        "fat": 0,
        "sodium": 5,
        "sugar": 42,
        "addedSugar": 42
      },
      "sourceProvenance": {
        "provider": "Pure Leaf",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.pureleaf.com/our-products/?product=Sweet+Tea",
        "labelUrl": "https://www.target.com/p/-/A-15275591"
      },
      "ingredients": "Brewed black tea, sugar, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Product is caffeinated, but exact caffeine is omitted because the current package nutrition panel does not publish a per-bottle amount."
    }
  },
  {
    "id": "beverage-tea-pure-leaf-zero-sugar-sweet-black",
    "name": "Zero Sugar Sweet Black Tea",
    "displayName": "Pure Leaf Zero Sugar Sweet Black Tea",
    "brand": "Pure Leaf",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pure Leaf Zero Sugar",
      "Pure Leaf Zero Sweet Tea"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "zero-sugar-sweet-black-tea",
      "pure-leaf"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 0.914,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (18.5 fl oz / 547 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 547,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "zero-sugar-sweet-black-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (18.5 fl oz / 547 mL)",
        "servingMilliliters": 547,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 5,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Pure Leaf",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.pureleaf.com/our-products/?product=Zero+Sugar+Sweet+Tea",
        "labelUrl": "https://www.target.com/p/-/A-90192495"
      },
      "ingredients": "Brewed black tea, citric acid, citrus pectin, sucralose, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Product is caffeinated, but exact caffeine is omitted because the current package nutrition panel does not publish a per-bottle amount."
    }
  },
  {
    "id": "beverage-tea-gold-peak-sweet",
    "name": "Sweet Tea",
    "displayName": "Gold Peak Sweet Tea",
    "brand": "Gold Peak",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gold Peak Sweet Tea",
      "Gold Peak sweet black tea"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "sweet-tea",
      "gold-peak"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 34.0,
      "protein": 0.0,
      "carbs": 8.8,
      "fat": 0.0,
      "sodium": 2.0,
      "sugar": 8.8,
      "addedSugar": 8.8
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 500,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "sweet-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 170,
        "protein": 0,
        "carbs": 44,
        "fat": 0,
        "sodium": 10,
        "sugar": 44,
        "addedSugar": 44
      },
      "sourceProvenance": {
        "provider": "Gold Peak",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-14900254"
      },
      "ingredients": "Brewed tea (filtered water, black tea leaves), cane sugar, phosphoric acid.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Caffeinated product; exact caffeine amount is not published on the current label."
    }
  },
  {
    "id": "beverage-tea-gold-peak-unsweetened",
    "name": "Unsweetened Tea",
    "displayName": "Gold Peak Unsweetened Tea",
    "brand": "Gold Peak",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gold Peak Unsweetened",
      "Gold Peak Unsweet Tea"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "unsweetened-tea",
      "gold-peak"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 2.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 500,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "unsweetened-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 10,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Gold Peak",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-47955632"
      },
      "ingredients": "Brewed tea (filtered water, black tea leaves), phosphoric acid.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Caffeinated product; exact caffeine amount is not published on the current label."
    }
  },
  {
    "id": "beverage-tea-gold-peak-zero-sugar-sweet",
    "name": "Zero Sugar Sweet Tea",
    "displayName": "Gold Peak Zero Sugar Sweet Tea",
    "brand": "Gold Peak",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gold Peak Zero Sugar",
      "Gold Peak Zero Sweet Tea"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "zero-sugar-sweet-tea",
      "gold-peak"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 5.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 500,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "zero-sugar-sweet-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 25,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Gold Peak",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-14900255"
      },
      "ingredients": "Brewed tea (filtered water, black tea leaves), phosphoric acid, aspartame, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Caffeinated product; exact caffeine amount is not published on the current label."
    }
  },
  {
    "id": "beverage-tea-arizona-green-tea-ginseng-honey",
    "name": "Green Tea with Ginseng and Honey",
    "displayName": "AriZona Green Tea with Ginseng and Honey",
    "brand": "AriZona",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Arizona Green Tea",
      "AriZona Green Tea Ginseng Honey",
      "Arizona green tea with honey"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "green-tea-ginseng-honey",
      "arizona"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.76,
      "protein": 0.0,
      "carbs": 7.276,
      "fat": 0.0,
      "sodium": 0.0,
      "sugar": 7.107,
      "addedSugar": 7.107
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (20 fl oz / 591 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 591,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "green-tea-ginseng-honey",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 170,
        "protein": 0,
        "carbs": 43,
        "fat": 0,
        "sodium": 0,
        "sugar": 42,
        "addedSugar": 42
      },
      "sourceProvenance": {
        "provider": "AriZona",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://drinkarizona.com/products/green-tea-20oz-tallboy",
        "labelUrl": "https://drinkarizona.com/products/green-tea-20oz-tallboy"
      },
      "ingredients": "Premium brewed blend of green teas using filtered water, high fructose corn syrup, honey, ascorbic acid, citric acid, natural flavor, ginseng extract.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Current official page reports 170 calories, 43 g carbohydrate, 42 g sugar and 42 g added sugar per 20 oz container. Exact caffeine quantity is not published and is intentionally omitted."
    }
  },
  {
    "id": "beverage-tea-arizona-diet-green-tea",
    "name": "Diet Green Tea",
    "displayName": "AriZona Diet Green Tea",
    "brand": "AriZona",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Arizona Diet Green Tea",
      "AriZona Zero Cal Green Tea",
      "Arizona green tea diet"
    ],
    "tags": [
      "beverage",
      "coffee-tea",
      "branded",
      "ready-to-drink-tea",
      "diet-green-tea",
      "arizona"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 1.0,
      "protein": 0.0,
      "carbs": 0.4,
      "fat": 0.0,
      "sodium": 1.0,
      "sugar": 0.2,
      "addedSugar": 0.2
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 500,
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
    "source": "AriFoodCoffeeTeaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "ready-to-drink-tea",
      "productLine": "diet-green-tea",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 5,
        "sugar": 1,
        "addedSugar": 1
      },
      "sourceProvenance": {
        "provider": "AriZona",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://drinkarizona.com/products/zero-cal-green-tea-16_9oz",
        "labelUrl": "https://drinkarizona.com/products/zero-cal-green-tea-16_9oz"
      },
      "ingredients": "Premium brewed blend of green tea using filtered water, honey, citric acid, ascorbic acid, natural flavors, sucralose, acesulfame potassium, sodium citrate, ginseng root extract.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values are divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Exact caffeine quantity is not published on the current official Nutrition Facts panel and is intentionally omitted."
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
      ARI_COFFEE_TEA_BRAND_FOODS,
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
        ARI_COFFEE_TEA_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_COFFEE_TEA_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      coffeeCount:
        ARI_COFFEE_TEA_BRAND_FOODS.filter(
          food =>
            String(food.metadata?.beverageType || "")
              .includes("coffee") ||
            String(food.metadata?.beverageType || "")
              .includes("latte")
        ).length,

      teaCount:
        ARI_COFFEE_TEA_BRAND_FOODS.filter(
          food =>
            String(food.metadata?.beverageType || "")
              .includes("tea")
        ).length,

      caffeineKnownCount:
        ARI_COFFEE_TEA_BRAND_FOODS.filter(
          food =>
            Number.isFinite(
              Number(food.metadata?.labelNutrition?.caffeine)
            )
        ).length,

      runtimeInternetRequired:
        false,

      brandFirst:
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
      `Registration rejected ${registration.rejected} coffee/tea brand record(s).`,
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

  global.AriFoodCoffeeTeaBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_COFFEE_TEA_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_COFFEE_TEA_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_COFFEE_TEA_BRAND_FOODS.map(
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

        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getCoffee() {
        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food => {
              const type =
                String(
                  food.metadata?.beverageType || ""
                );

              return (
                type.includes("coffee") ||
                type.includes("latte")
              );
            }
          )
          .map(clone);
      },

      getTea() {
        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.beverageType || ""
              ).includes("tea")
          )
          .map(clone);
      },

      getCaffeineKnown() {
        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food =>
              Number.isFinite(
                Number(
                  food.metadata?.labelNutrition?.caffeine
                )
              )
          )
          .map(clone);
      },

      getHighCaffeine(minimumMgPerServing = 150) {
        const threshold =
          Number(minimumMgPerServing);

        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food =>
              Number.isFinite(
                Number(
                  food.metadata?.labelNutrition?.caffeine
                )
              ) &&
              Number(
                food.metadata?.labelNutrition?.caffeine
              ) >= threshold
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_COFFEE_TEA_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.sugar
              ) === 0
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
          ARI_COFFEE_TEA_BRAND_FOODS.find(
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
        "ari:food-coffee-tea-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_COFFEE_TEA_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

            coffeeCount:
              moduleResult.metadata.coffeeCount,

            teaCount:
              moduleResult.metadata.teaCount,

            caffeineKnownCount:
              moduleResult.metadata.caffeineKnownCount,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_COFFEE_TEA_BRAND_FOODS.length} packaged coffee/tea records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
