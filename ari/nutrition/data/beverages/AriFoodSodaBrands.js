// =====================================================
// ARI REBIRTH
// File: AriFoodSodaBrands.js
// Version: 1.0.0
//
// Purpose:
//   Manufacturer-first branded soda module for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - Coca-Cola
//   - Sprite
//   - Fanta
//   - Pepsi
//   - 7UP
//   - Canada Dry
//
// Coverage:
//   17 current branded soda formulations.
//
// Canonical basis:
//   100 mL.
//
// Data policy:
//   - Official manufacturer label first.
//   - Exact package serving preserved in metadata.labelNutrition.
//   - Formulations remain distinct.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodSodaBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSodaBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "manufacturer-first branded soda module",
  "recordCount": 17,
  "brands": [
    "7UP",
    "Canada Dry",
    "Coca-Cola",
    "Fanta",
    "Pepsi",
    "Sprite"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official U.S. manufacturer product pages",
    "Exact package serving and nutrition panel published by the brand",
    "No third-party nutrition substitution when manufacturer data is available"
  ],
  "rules": [
    "Preserve exact manufacturer label values in metadata.labelNutrition.",
    "Normalize each formulation mathematically to 100 mL.",
    "Do not create a separate food record for every bottle/can size when the formulation is identical.",
    "Keep sugar-sweetened, diet, zero-sugar, caffeine-free, and cane-sugar formulations distinct.",
    "Do not infer added sugar when the current manufacturer panel does not publish it.",
    "Do not infer caffeine quantity merely because caffeine appears in ingredients.",
    "Caffeine may be stored as 0 when the manufacturer explicitly presents the product as caffeine-free or the ingredient panel excludes caffeine for that formulation.",
    "Branded soda records should outrank AriFoodBeverageCore generic fallbacks.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SODA_BRAND_FOODS =
    [
  {
    "id": "beverage-soda-coca-cola-original",
    "name": "Original Taste",
    "displayName": "Coca-Cola Original Taste",
    "brand": "Coca-Cola",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Coke",
      "Coca Cola",
      "Coca-Cola Original",
      "regular Coke"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola",
      "coca-cola"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.61,
      "protein": 0.0,
      "carbs": 10.998,
      "fat": 0.0,
      "sodium": 12.69,
      "sugar": 10.998,
      "addedSugar": 10.998
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (20 fl oz / 591 mL)",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 240,
        "protein": 0,
        "carbs": 65,
        "fat": 0,
        "sodium": 75,
        "sugar": 65,
        "addedSugar": 65
      },
      "sourceProvenance": {
        "provider": "Coca-Cola",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/coca-cola/products/original",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "8 fl oz",
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-coca-cola-caffeine-free",
    "name": "Caffeine Free",
    "displayName": "Coca-Cola Caffeine Free",
    "brand": "Coca-Cola",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Caffeine Free Coke",
      "Coke Caffeine Free"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-caffeine-free",
      "coca-cola"
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
      "protein": 0.0,
      "carbs": 10.986,
      "fat": 0.0,
      "sodium": 12.676,
      "sugar": 10.986,
      "addedSugar": 10.986,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-caffeine-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 140,
        "protein": 0,
        "carbs": 39,
        "fat": 0,
        "sodium": 45,
        "sugar": 39,
        "addedSugar": 39,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Coca-Cola",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/coca-cola/products/original",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz",
        "2 L"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-coca-cola-mexico",
    "name": "Mexico",
    "displayName": "Coca-Cola Mexico",
    "brand": "Coca-Cola",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mexican Coke",
      "Coca-Cola Mexico",
      "Coke Mexico",
      "Coca Cola Mexican"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-cane-sugar",
      "coca-cola"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 42.25,
      "protein": 0.0,
      "carbs": 10.986,
      "fat": 0.0,
      "sodium": 23.944,
      "sugar": 10.986,
      "addedSugar": 10.986
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (355 mL)",
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-cane-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 bottle (355 mL)",
        "servingMilliliters": 355,
        "calories": 150,
        "protein": 0,
        "carbs": 39,
        "fat": 0,
        "sodium": 85,
        "sugar": 39,
        "addedSugar": 39
      },
      "sourceProvenance": {
        "provider": "Coca-Cola",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/coca-cola/products/original",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz",
        "16.9 fl oz"
      ],
      "ingredients": "Carbonated water, cane sugar, caramel color, phosphoric acid, natural flavors, caffeine.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Cane-sugar formulation sold as Coca-Cola Mexico in the United States. Do not merge with standard U.S. Coca-Cola Original."
    }
  },
  {
    "id": "beverage-soda-coca-cola-zero-sugar",
    "name": "Zero Sugar",
    "displayName": "Coca-Cola Zero Sugar",
    "brand": "Coca-Cola",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Coke Zero",
      "Coca-Cola Zero",
      "Coke Zero Sugar"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-zero-sugar",
      "coca-cola"
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
      "sodium": 11.268,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 16.901,
      "caffeine": 9.577
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 40,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 60,
        "caffeine": 34
      },
      "sourceProvenance": {
        "provider": "Coca-Cola",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/coca-cola/products/zero",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "8 fl oz",
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine, stevia extract.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-diet-coke",
    "name": "Diet Coke",
    "displayName": "Coca-Cola Diet Coke",
    "brand": "Coca-Cola",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Diet Coke",
      "Coke Diet"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "diet-cola",
      "coca-cola"
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
      "sodium": 11.268,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "caffeine": 12.958
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "diet-cola",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 40,
        "sugar": 0,
        "addedSugar": 0,
        "caffeine": 46
      },
      "sourceProvenance": {
        "provider": "Coca-Cola",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/diet-coke/products",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "8 fl oz",
        "12 fl oz",
        "13.2 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-sprite-original",
    "name": "Original",
    "displayName": "Sprite Original",
    "brand": "Sprite",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Sprite",
      "Sprite Original",
      "regular Sprite"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "lemon-lime",
      "sprite"
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
      "protein": 0.0,
      "carbs": 10.704,
      "fat": 0.0,
      "sodium": 18.31,
      "sugar": 10.704,
      "addedSugar": 10.704,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "lemon-lime",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 140,
        "protein": 0,
        "carbs": 38,
        "fat": 0,
        "sodium": 65,
        "sugar": 38,
        "addedSugar": 38,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Sprite",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/sprite/products",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "8 fl oz",
        "12 fl oz",
        "13.2 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "1 L",
        "1.25 L",
        "2 L",
        "3 L"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-sprite-zero-sugar",
    "name": "Zero Sugar",
    "displayName": "Sprite Zero Sugar",
    "brand": "Sprite",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Sprite Zero",
      "Sprite Zero Sugar"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "lemon-lime-zero-sugar",
      "sprite"
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
      "sodium": 9.859,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 30.986,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "lemon-lime-zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 35,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 110,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Sprite",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/sprite/products",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "2 L"
      ],
      "ingredients": "Carbonated water, citric acid, potassium citrate, natural flavors, potassium benzoate, aspartame, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-fanta-orange",
    "name": "Orange",
    "displayName": "Fanta Orange",
    "brand": "Fanta",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Fanta Orange",
      "orange Fanta"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "orange-soda",
      "fanta"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.69,
      "protein": 0.0,
      "carbs": 12.521,
      "fat": 0.0,
      "sodium": 13.536,
      "sugar": 12.352,
      "addedSugar": 12.352,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (20 fl oz / 591 mL)",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "orange-soda",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 270,
        "protein": 0,
        "carbs": 74,
        "fat": 0,
        "sodium": 80,
        "sugar": 73,
        "addedSugar": 73,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Fanta",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/fanta/products",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz",
        "13.2 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "2 L"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, less than 2% of citric acid, natural flavors, sodium benzoate, modified food starch, glycerol ester of rosin, Yellow 6, Red 40.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-pepsi-original",
    "name": "Pepsi",
    "displayName": "Pepsi Pepsi",
    "brand": "Pepsi",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pepsi",
      "Pepsi Cola",
      "regular Pepsi"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola",
      "pepsi"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 42.25,
      "protein": 0.0,
      "carbs": 11.549,
      "fat": 0.0,
      "sodium": 8.451,
      "sugar": 11.549,
      "addedSugar": 11.549
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 150,
        "protein": 0,
        "carbs": 41,
        "fat": 0,
        "sodium": 30,
        "sugar": 41,
        "addedSugar": 41
      },
      "sourceProvenance": {
        "provider": "Pepsi",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.pepsi.com/products/pepsi",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "24 fl oz",
        "1 L",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sugar, phosphoric acid, caffeine, citric acid, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-pepsi-zero-sugar",
    "name": "Zero Sugar",
    "displayName": "Pepsi Zero Sugar",
    "brand": "Pepsi",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pepsi Zero",
      "Pepsi Zero Sugar"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-zero-sugar",
      "pepsi"
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
      "sodium": 11.268,
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 40,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Pepsi",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.pepsi.com/products/pepsi-zero-sugar",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "24 fl oz",
        "1 L",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, caffeine, natural flavor, acesulfame potassium, citric acid, Panax ginseng root extract, calcium disodium EDTA.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-diet-pepsi",
    "name": "Diet Pepsi",
    "displayName": "Pepsi Diet Pepsi",
    "brand": "Pepsi",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Diet Pepsi",
      "Pepsi Diet"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "diet-cola",
      "pepsi"
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
      "sodium": 9.859,
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "diet-cola",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 35,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Pepsi",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.pepsi.com/products/diet-pepsi",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "24 fl oz",
        "1 L",
        "1.25 L",
        "2 L"
      ],
      "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, caffeine, citric acid, natural flavor, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-pepsi-real-sugar",
    "name": "Pepsi-Cola Made With Real Sugar",
    "displayName": "Pepsi Pepsi-Cola Made With Real Sugar",
    "brand": "Pepsi",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pepsi Real Sugar",
      "Pepsi Made With Real Sugar",
      "Pepsi cane sugar"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-real-sugar",
      "pepsi"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 42.25,
      "protein": 0.0,
      "carbs": 11.268,
      "fat": 0.0,
      "sodium": 8.451,
      "sugar": 11.268,
      "addedSugar": 11.268
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-real-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 150,
        "protein": 0,
        "carbs": 40,
        "fat": 0,
        "sodium": 30,
        "sugar": 40,
        "addedSugar": 40
      },
      "sourceProvenance": {
        "provider": "Pepsi",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.pepsi.com/products/pepsi-cola-made-real-sugar",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "7.5 fl oz",
        "12 fl oz"
      ],
      "ingredients": "Carbonated water, sugar, caramel color, phosphoric acid, caffeine, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-pepsi-caffeine-free",
    "name": "Caffeine Free",
    "displayName": "Pepsi Caffeine Free",
    "brand": "Pepsi",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Caffeine Free Pepsi",
      "Pepsi Caffeine Free"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "cola-caffeine-free",
      "pepsi"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 42.25,
      "protein": 0.0,
      "carbs": 11.549,
      "fat": 0.0,
      "sodium": 8.451,
      "sugar": 11.549,
      "addedSugar": 11.549,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "cola-caffeine-free",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 150,
        "protein": 0,
        "carbs": 41,
        "fat": 0,
        "sodium": 30,
        "sugar": 41,
        "addedSugar": 41,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Pepsi",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.pepsi.com/products/pepsi-caffeine-free",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz",
        "16 fl oz",
        "16.9 fl oz",
        "67 fl oz"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sugar, phosphoric acid, citric acid, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-7up-original",
    "name": "Original",
    "displayName": "7UP Original",
    "brand": "7UP",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "7UP",
      "7 Up",
      "Original 7UP"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "lemon-lime",
      "7up"
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
      "protein": 0.0,
      "carbs": 10.986,
      "fat": 0.0,
      "sodium": 12.676,
      "sugar": 10.704,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "lemon-lime",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 140,
        "protein": 0,
        "carbs": 39,
        "fat": 0,
        "sodium": 45,
        "sugar": 38,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "7UP",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.7up.com/en/products/7up",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz"
      ],
      "ingredients": "Filtered carbonated water, high fructose corn syrup, citric acid, potassium citrate, natural flavors, calcium disodium EDTA.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-7up-zero-sugar",
    "name": "Zero Sugar",
    "displayName": "7UP Zero Sugar",
    "brand": "7UP",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "7UP Zero",
      "7 Up Zero Sugar",
      "7UP Zero Sugar"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "lemon-lime-zero-sugar",
      "7up"
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
      "sodium": 12.676,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "lemon-lime-zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 45,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "7UP",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.7up.com/en/products/7up-zero-sugar",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz"
      ],
      "ingredients": "Filtered carbonated water, citric acid, potassium citrate, potassium benzoate, aspartame, acesulfame potassium, natural flavors, calcium disodium EDTA.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "The current official product page explicitly reports zero calories and zero carbohydrate. Sugar is intentionally not inserted into labelNutrition unless the current displayed panel explicitly reports it."
    }
  },
  {
    "id": "beverage-soda-canada-dry-ginger-ale",
    "name": "Ginger Ale",
    "displayName": "Canada Dry Ginger Ale",
    "brand": "Canada Dry",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Canada Dry",
      "Canada Dry Ginger Ale",
      "ginger ale Canada Dry"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "ginger-ale",
      "canada-dry"
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
      "protein": 0.0,
      "carbs": 10.141,
      "fat": 0.0,
      "sodium": 14.085,
      "sugar": 9.296,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "ginger-ale",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 140,
        "protein": 0,
        "carbs": 36,
        "fat": 0,
        "sodium": 50,
        "sugar": 33,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Canada Dry",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.canadadry.com/products/ginger-ale",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz"
      ],
      "ingredients": "Carbonated water, high fructose corn syrup and less than 2% of ginger extract, natural flavors, citric acid, sodium benzoate, caramel color.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-soda-canada-dry-ginger-ale-zero-sugar",
    "name": "Ginger Ale Zero Sugar",
    "displayName": "Canada Dry Ginger Ale Zero Sugar",
    "brand": "Canada Dry",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Canada Dry Zero",
      "Canada Dry Zero Sugar",
      "Canada Dry Ginger Ale Zero"
    ],
    "tags": [
      "beverage",
      "soda",
      "soft-drink",
      "branded",
      "ginger-ale-zero-sugar",
      "canada-dry"
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
      "sodium": 33.803,
      "sugar": 0.0,
      "caffeine": 0.0
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
    "source": "AriFoodSodaBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "soda",
      "sodaType": "ginger-ale-zero-sugar",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from manufacturer label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 120,
        "sugar": 0,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "Canada Dry",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.canadadry.com/our-products/ginger-ale",
        "verifiedAt": "2026-08-03"
      },
      "availableSizes": [
        "12 fl oz"
      ],
      "ingredients": "Carbonated water and less than 2% of ginger extract, natural flavors, citric acid, malic acid, sodium citrate, sodium benzoate, calcium disodium EDTA, aspartame, acesulfame potassium, caramel color.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
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

  // Clear stale records owned by this exact module on hot reload.
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
      ARI_SODA_BRAND_FOODS,
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
        ARI_SODA_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_SODA_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

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
      `Registration rejected ${registration.rejected} soda-brand record(s).`,
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

  global.AriFoodSodaBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SODA_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_SODA_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_SODA_BRAND_FOODS.map(
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

        return ARI_SODA_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_SODA_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.sodaType || ""
              ).includes("zero-sugar")
          )
          .map(clone);
      },

      getCaffeineFree() {
        return ARI_SODA_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.nutrition?.caffeine
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
          ARI_SODA_BRAND_FOODS.find(
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
        "ari:food-soda-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SODA_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SODA_BRAND_FOODS.length} branded soda records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
