// =====================================================
// ARI REBIRTH
// File: AriFoodSportsDrinkBrands.js
// Version: 1.0.0
//
// Purpose:
//   Manufacturer-first branded sports/hydration drink
//   module for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - Gatorade
//   - POWERADE
//   - BODYARMOR
//   - Electrolit
//   - PRIME
//
// Coverage:
//   16 current sports/hydration drink formulations.
//
// Canonical basis:
//   100 mL.
//
// Data policy:
//   - Exact current package/manufacturer labels first.
//   - Sodium and potassium explicitly tracked.
//   - Additional electrolytes preserved in label metadata.
//   - Sports drinks remain separate from energy drinks.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodSportsDrinkBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSportsDrinkBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "manufacturer-first branded sports and hydration drink module",
  "recordCount": 16,
  "brands": [
    "BODYARMOR",
    "Electrolit",
    "Gatorade",
    "POWERADE",
    "PRIME"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official manufacturer nutrition panels",
    "Official manufacturer product identity plus current retailer package-label capture",
    "Current retailer package-label capture when manufacturer nutrition is not crawlable"
  ],
  "rules": [
    "Preserve exact package nutrition in metadata.labelNutrition.",
    "Normalize current package values mathematically to 100 mL.",
    "Track sodium and potassium as core hydration nutrients.",
    "Preserve calcium, magnesium, and chloride in labelNutrition when the package reports them.",
    "Track caffeine explicitly; current V1 sports/hydration products are caffeine-free.",
    "Keep full-sugar, zero-sugar, low-sugar, and rapid-rehydration formulations separate.",
    "Do not assume flavors have identical nutrition unless each selected record is supported by a current label or official product panel.",
    "Do not create separate records merely for different bottle sizes when formulation is unchanged.",
    "Do not merge sports drinks with energy drinks.",
    "Branded products outrank AriFoodBeverageCore fallbacks.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SPORTS_DRINK_BRAND_FOODS =
    [
  {
    "id": "beverage-sports-gatorade-thirst-quencher-lemon-lime",
    "name": "Thirst Quencher Lemon-Lime",
    "displayName": "Gatorade Thirst Quencher Lemon-Lime",
    "brand": "Gatorade",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gatorade Lemon Lime",
      "Gatorade Lemon-Lime",
      "Lemon Lime Gatorade"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "thirst-quencher-lemon-lime",
      "gatorade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 23.69,
      "protein": 0.0,
      "carbs": 6.091,
      "fat": 0.0,
      "sodium": 45.685,
      "caffeine": 0.0,
      "sugar": 5.753,
      "addedSugar": 5.753,
      "potassium": 13.536
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "thirst-quencher-lemon-lime",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 140,
        "protein": 0,
        "carbs": 36,
        "fat": 0,
        "sodium": 270,
        "caffeine": 0,
        "sugar": 34,
        "addedSugar": 34,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "Gatorade",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.gatorade.com/sports-drinks/gatorade-thirst-quencher/lemon-lime",
        "labelUrl": "https://www.target.com/p/-/A-13674077"
      },
      "ingredients": "Water, sugar, dextrose, citric acid, sodium citrate, salt, monopotassium phosphate, gum arabic, glycerol ester of rosin, natural flavor, Yellow 5.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-gatorade-thirst-quencher-fruit-punch",
    "name": "Thirst Quencher Fruit Punch",
    "displayName": "Gatorade Thirst Quencher Fruit Punch",
    "brand": "Gatorade",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gatorade Fruit Punch",
      "Fruit Punch Gatorade"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "thirst-quencher-fruit-punch",
      "gatorade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 23.69,
      "protein": 0.0,
      "carbs": 5.922,
      "fat": 0.0,
      "sodium": 45.685,
      "caffeine": 0.0,
      "sugar": 5.922,
      "addedSugar": 5.922,
      "potassium": 13.536
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "thirst-quencher-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 140,
        "protein": 0,
        "carbs": 35,
        "fat": 0,
        "sodium": 270,
        "caffeine": 0,
        "sugar": 35,
        "addedSugar": 35,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "Gatorade",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.gatorade.com/",
        "labelUrl": "https://www.target.com/p/-/A-12953968"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-gatorade-zero-glacier-freeze",
    "name": "Zero Glacier Freeze",
    "displayName": "Gatorade Zero Glacier Freeze",
    "brand": "Gatorade",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gatorade Zero Glacier Freeze",
      "Glacier Freeze Gatorade Zero"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "zero-glacier-freeze",
      "gatorade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.85,
      "protein": 0.0,
      "carbs": 0.338,
      "fat": 0.0,
      "sodium": 45.685,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 13.536
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "zero-glacier-freeze",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 270,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "Gatorade",
        "sourceType": "official manufacturer product line + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.gatorade.com/gatorade-zero",
        "labelUrl": "https://www.target.com/p/-/A-54232871"
      },
      "ingredients": "Water, citric acid, sodium citrate, salt, monopotassium phosphate, modified food starch, natural flavor, sucralose, acesulfame potassium, glycerol ester of rosin, Blue 1.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-gatorade-zero-fruit-punch",
    "name": "Zero Fruit Punch",
    "displayName": "Gatorade Zero Fruit Punch",
    "brand": "Gatorade",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gatorade Zero Fruit Punch",
      "Fruit Punch Gatorade Zero"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "zero-fruit-punch",
      "gatorade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.85,
      "protein": 0.0,
      "carbs": 0.338,
      "fat": 0.0,
      "sodium": 45.685,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 13.536
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "zero-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 270,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "Gatorade",
        "sourceType": "official manufacturer product line + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.gatorade.com/gatorade-zero",
        "labelUrl": "https://www.target.com/p/-/A-78797341"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-gatorlyte-strawberry-kiwi",
    "name": "Gatorlyte Strawberry Kiwi",
    "displayName": "Gatorade Gatorlyte Strawberry Kiwi",
    "brand": "Gatorade",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Gatorlyte Strawberry Kiwi",
      "Gatorade Gatorlyte Strawberry Kiwi"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "gatorlyte-strawberry-kiwi",
      "gatorade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 8.46,
      "protein": 0.0,
      "carbs": 2.369,
      "fat": 0.0,
      "sodium": 82.91,
      "caffeine": 0.0,
      "sugar": 2.03,
      "addedSugar": 2.03,
      "potassium": 59.222,
      "calcium": 20.305
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "gatorlyte-strawberry-kiwi",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 50,
        "protein": 0,
        "carbs": 14,
        "fat": 0,
        "sodium": 490,
        "caffeine": 0,
        "sugar": 12,
        "addedSugar": 12,
        "potassium": 350,
        "calcium": 120,
        "magnesium": 105,
        "chloride": 1040
      },
      "sourceProvenance": {
        "provider": "Gatorade",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.gatorade.com/sports-drinks/gatorlyte",
        "labelUrl": "https://www.target.com/p/-/A-85756489"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Gatorlyte tracks additional electrolytes in metadata.labelNutrition: calcium, magnesium, and chloride."
    }
  },
  {
    "id": "beverage-sports-powerade-mountain-berry-blast",
    "name": "Mountain Berry Blast",
    "displayName": "POWERADE Mountain Berry Blast",
    "brand": "POWERADE",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Powerade Mountain Berry Blast",
      "Blue Powerade",
      "Mountain Berry Powerade"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "mountain-berry-blast",
      "powerade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 22.54,
      "protein": 0.0,
      "carbs": 5.915,
      "fat": 0.0,
      "sodium": 67.606,
      "caffeine": 0.0,
      "sugar": 5.915,
      "addedSugar": 5.915,
      "potassium": 22.535
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "mountain-berry-blast",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 80,
        "protein": 0,
        "carbs": 21,
        "fat": 0,
        "sodium": 240,
        "caffeine": 0,
        "sugar": 21,
        "addedSugar": 21,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "POWERADE",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.powerade.com/products/powerade",
        "labelUrl": "https://www.powerade.com/products/powerade"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-powerade-fruit-punch",
    "name": "Fruit Punch",
    "displayName": "POWERADE Fruit Punch",
    "brand": "POWERADE",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Powerade Fruit Punch",
      "Fruit Punch Powerade"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "fruit-punch",
      "powerade"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 22.54,
      "protein": 0.0,
      "carbs": 5.915,
      "fat": 0.0,
      "sodium": 67.606,
      "caffeine": 0.0,
      "sugar": 5.915,
      "addedSugar": 5.915,
      "potassium": 22.535
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 80,
        "protein": 0,
        "carbs": 21,
        "fat": 0,
        "sodium": 240,
        "caffeine": 0,
        "sugar": 21,
        "addedSugar": 21,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "POWERADE",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.powerade.com/products/powerade",
        "labelUrl": "https://www.powerade.com/products/powerade"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-powerade-zero-mixed-berry",
    "name": "Zero Mixed Berry",
    "displayName": "POWERADE Zero Mixed Berry",
    "brand": "POWERADE",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Powerade Zero Mixed Berry",
      "Powerade Zero Berry"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "zero-mixed-berry",
      "powerade"
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
      "sodium": 67.606,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 22.535
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "zero-mixed-berry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 240,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "POWERADE",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.powerade.com/products/powerade-zero",
        "labelUrl": "https://www.powerade.com/products/powerade-zero"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-powerade-zero-fruit-punch",
    "name": "Zero Fruit Punch",
    "displayName": "POWERADE Zero Fruit Punch",
    "brand": "POWERADE",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Powerade Zero Fruit Punch",
      "Fruit Punch Powerade Zero"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "zero-fruit-punch",
      "powerade"
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
      "sodium": 70.423,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 22.535
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "zero-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 250,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 80
      },
      "sourceProvenance": {
        "provider": "POWERADE",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.powerade.com/products/powerade-zero",
        "labelUrl": "https://www.powerade.com/products/powerade-zero"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-bodyarmor-fruit-punch",
    "name": "Sports Drink Fruit Punch",
    "displayName": "BODYARMOR Sports Drink Fruit Punch",
    "brand": "BODYARMOR",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "BODYARMOR Fruit Punch",
      "Body Armor Fruit Punch"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "sports-drink-fruit-punch",
      "bodyarmor"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 23.26,
      "protein": 0.0,
      "carbs": 5.285,
      "fat": 0.0,
      "sodium": 5.285,
      "caffeine": 0.0,
      "sugar": 5.285,
      "addedSugar": 4.863,
      "potassium": 143.763
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16 fl oz / 473 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "sports-drink-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 110,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "sodium": 25,
        "caffeine": 0,
        "sugar": 25,
        "addedSugar": 23,
        "potassium": 680
      },
      "sourceProvenance": {
        "provider": "BODYARMOR",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-16972586"
      },
      "ingredients": "Filtered water, cane sugar, coconut water concentrate, citric acid, electrolyte blend, vitamins, natural fruit punch flavor, stevia.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Current package label includes high potassium and vitamin/electrolyte content distinct from conventional sodium-heavy sports drinks."
    }
  },
  {
    "id": "beverage-sports-bodyarmor-zero-fruit-punch",
    "name": "Zero Sugar Fruit Punch",
    "displayName": "BODYARMOR Zero Sugar Fruit Punch",
    "brand": "BODYARMOR",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "BODYARMOR Zero Fruit Punch",
      "Body Armor Zero Fruit Punch",
      "BODYARMOR Zero Sugar Fruit Punch"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "zero-sugar-fruit-punch",
      "bodyarmor"
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
      "carbs": 0.0,
      "fat": 0.0,
      "sodium": 2.114,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 131.078
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16 fl oz / 473 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "zero-sugar-fruit-punch",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 10,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 10,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 620
      },
      "sourceProvenance": {
        "provider": "BODYARMOR",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-93734055"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-bodyarmor-lyte-peach-mango",
    "name": "LYTE Peach Mango",
    "displayName": "BODYARMOR LYTE Peach Mango",
    "brand": "BODYARMOR",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "BODYARMOR Lyte Peach Mango",
      "Body Armor Lyte Peach Mango"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "lyte-peach-mango",
      "bodyarmor"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 4.23,
      "protein": 0.0,
      "carbs": 1.057,
      "fat": 0.0,
      "sodium": 6.342,
      "caffeine": 0.0,
      "sugar": 0.423,
      "addedSugar": 0.0,
      "potassium": 143.763,
      "calcium": 42.283
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16 fl oz / 473 mL)",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "lyte-peach-mango",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16 fl oz / 473 mL)",
        "servingMilliliters": 473,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sodium": 30,
        "caffeine": 0,
        "sugar": 2,
        "addedSugar": 0,
        "potassium": 680,
        "calcium": 200
      },
      "sourceProvenance": {
        "provider": "BODYARMOR",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-52062359"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-electrolit-strawberry-kiwi",
    "name": "Strawberry Kiwi",
    "displayName": "Electrolit Strawberry Kiwi",
    "brand": "Electrolit",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Electrolit Strawberry Kiwi",
      "Strawberry Kiwi Electrolit"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "strawberry-kiwi",
      "electrolit"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 20.8,
      "protein": 0.0,
      "carbs": 4.96,
      "fat": 0.0,
      "sodium": 68.8,
      "caffeine": 0.0,
      "sugar": 4.96,
      "addedSugar": 4.96,
      "potassium": 78.4,
      "calcium": 8.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (21 fl oz / 625 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 625,
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "strawberry-kiwi",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (21 fl oz / 625 mL)",
        "servingMilliliters": 625,
        "calories": 130,
        "protein": 0,
        "carbs": 31,
        "fat": 0,
        "sodium": 430,
        "caffeine": 0,
        "sugar": 31,
        "addedSugar": 31,
        "potassium": 490,
        "calcium": 50,
        "magnesium": 30,
        "chloride": 670
      },
      "sourceProvenance": {
        "provider": "Electrolit",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://electrolit.com/products/strawberry-kiwi-ih",
        "labelUrl": "https://electrolit.com/products/strawberry-kiwi-ih"
      },
      "ingredients": "Water, dextrose monohydrate, natural strawberry kiwi flavor, sodium lactate, citric acid, potassium chloride, malic acid, molasses, magnesium chloride, calcium chloride, salt, sweeteners.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-electrolit-watermelon-lime",
    "name": "Watermelon Lime",
    "displayName": "Electrolit Watermelon Lime",
    "brand": "Electrolit",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Electrolit Watermelon Lime",
      "Watermelon Lime Electrolit"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "watermelon-lime",
      "electrolit"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 20.8,
      "protein": 0.0,
      "carbs": 4.96,
      "fat": 0.0,
      "sodium": 68.8,
      "caffeine": 0.0,
      "sugar": 4.96,
      "addedSugar": 4.96,
      "potassium": 78.4,
      "calcium": 8.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (21 fl oz / 625 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 625,
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "watermelon-lime",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (21 fl oz / 625 mL)",
        "servingMilliliters": 625,
        "calories": 130,
        "protein": 0,
        "carbs": 31,
        "fat": 0,
        "sodium": 430,
        "caffeine": 0,
        "sugar": 31,
        "addedSugar": 31,
        "potassium": 490,
        "calcium": 50,
        "magnesium": 30,
        "chloride": 670
      },
      "sourceProvenance": {
        "provider": "Electrolit",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://electrolit.com/products/watermelon-lime-ih",
        "labelUrl": "https://electrolit.com/products/watermelon-lime-ih"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-prime-hydration-ice-pop",
    "name": "Hydration Ice Pop",
    "displayName": "PRIME Hydration Ice Pop",
    "brand": "PRIME",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "PRIME Ice Pop",
      "Prime Hydration Ice Pop",
      "Ice Pop Prime"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "hydration-ice-pop",
      "prime"
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
      "carbs": 1.2,
      "fat": 0.0,
      "sodium": 2.0,
      "caffeine": 0.0,
      "sugar": 0.4,
      "addedSugar": 0.0,
      "potassium": 140.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "hydration-ice-pop",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 20,
        "protein": 0,
        "carbs": 6,
        "fat": 0,
        "sodium": 10,
        "caffeine": 0,
        "sugar": 2,
        "addedSugar": 0,
        "potassium": 700,
        "magnesium": 124
      },
      "sourceProvenance": {
        "provider": "PRIME",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://drinkprime.com/",
        "labelUrl": "https://www.target.com/p/-/A-94282842"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared container volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-sports-prime-hydration-berry-freeze",
    "name": "Hydration Berry Freeze",
    "displayName": "PRIME Hydration Berry Freeze",
    "brand": "PRIME",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "PRIME Berry Freeze",
      "Prime Hydration Berry Freeze",
      "Berry Freeze Prime"
    ],
    "tags": [
      "beverage",
      "sports-drink",
      "hydration",
      "electrolyte-drink",
      "branded",
      "hydration-berry-freeze",
      "prime"
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
      "carbs": 1.0,
      "fat": 0.0,
      "sodium": 6.0,
      "caffeine": 0.0,
      "sugar": 0.4,
      "addedSugar": 0.0,
      "potassium": 140.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (16.9 fl oz / 500 mL)",
        "amount": 1,
        "unit": "container",
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
    "source": "AriFoodSportsDrinkBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sports-drink",
      "productLine": "hydration-berry-freeze",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sodium": 30,
        "caffeine": 0,
        "sugar": 2,
        "addedSugar": 0,
        "potassium": 700
      },
      "sourceProvenance": {
        "provider": "PRIME",
        "sourceType": "official manufacturer product identity + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://drinkprime.com/",
        "labelUrl": "https://www.target.com/p/-/A-94282844"
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
      ARI_SPORTS_DRINK_BRAND_FOODS,
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
        ARI_SPORTS_DRINK_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_SPORTS_DRINK_BRAND_FOODS.map(
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
      `Registration rejected ${registration.rejected} sports-drink record(s).`,
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

  global.AriFoodSportsDrinkBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SPORTS_DRINK_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_SPORTS_DRINK_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_SPORTS_DRINK_BRAND_FOODS.map(
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

        return ARI_SPORTS_DRINK_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_SPORTS_DRINK_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.sugar
              ) === 0
          )
          .map(clone);
      },

      getHighSodium(minimumMgPerContainer = 400) {
        const threshold =
          Number(minimumMgPerContainer);

        return ARI_SPORTS_DRINK_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.sodium || 0
              ) >= threshold
          )
          .map(clone);
      },

      getHighPotassium(minimumMgPerContainer = 300) {
        const threshold =
          Number(minimumMgPerContainer);

        return ARI_SPORTS_DRINK_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.labelNutrition?.potassium || 0
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
          ARI_SPORTS_DRINK_BRAND_FOODS.find(
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
        "ari:food-sports-drink-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SPORTS_DRINK_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SPORTS_DRINK_BRAND_FOODS.length} branded sports/hydration drink records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
