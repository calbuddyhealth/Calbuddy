// =====================================================
// ARI REBIRTH
// File: AriFoodBeverageBrands3.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first ready-to-drink protein and nutrition
//   shake expansion for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - fairlife Core Power
//   - Premier Protein
//   - Ensure
//   - Orgain
//
// Coverage:
//   16 ready-to-drink protein / nutrition shake products.
//
// Canonical basis:
//   100 mL.
//
// Design rule:
//   These are packaged beverage products, not generic
//   milk records. Exact formulations remain distinct.
//
// Data policy:
//   - Manufacturer source first.
//   - Exact serving values preserved.
//   - No DV-to-mass nutrient invention.
//   - Missing exact nutrients are omitted.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodBeverageBrands3(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBeverageBrands3";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first ready-to-drink protein and nutrition shake expansion",
  "recordCount": 16,
  "brands": [
    "Ensure",
    "Orgain",
    "Premier Protein",
    "fairlife"
  ],
  "coverage": [
    "high-protein milk shakes",
    "ready-to-drink protein shakes",
    "plant-protein shakes",
    "complete nutrition / meal replacement shakes"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official current manufacturer Nutrition Facts or product pages",
    "Official current manufacturer consumer nutrition comparison / FAQ",
    "Official manufacturer healthcare technical nutrition profiles"
  ],
  "rules": [
    "Preserve exact manufacturer serving values in metadata.labelNutrition.",
    "Normalize each product mathematically to 100 mL.",
    "Keep protein shakes, plant-protein shakes, and complete nutrition shakes distinct.",
    "Do not treat a protein/nutrition shake as plain milk even when milk is the main ingredient.",
    "Do not infer micronutrient mass from percent Daily Value alone.",
    "Omit nutrients when the current manufacturer source does not expose an exact amount.",
    "Keep formulas and protein levels separate when nutrition differs materially.",
    "Do not duplicate package sizes when formulation is unchanged.",
    "Do not merge protein shakes into energy drinks simply because a product may be marketed for performance.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BEVERAGE_BRANDS_3_FOODS =
    [
  {
    "id": "beverage-brand3-core-power-chocolate-26g",
    "name": "Core Power Chocolate 26g",
    "displayName": "fairlife Core Power Chocolate 26g",
    "brand": "fairlife",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Core Power Chocolate",
      "Fairlife Core Power Chocolate",
      "Fairlife protein shake chocolate 26g"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "core-power-26g-chocolate",
      "fairlife"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 41.06,
      "protein": 6.28,
      "carbs": 1.932,
      "fat": 1.087,
      "fiber": 0.483,
      "sugar": 1.208,
      "addedSugar": 0.0,
      "saturatedFat": 0.725,
      "sodium": 62.802,
      "potassium": 207.729,
      "calcium": 161.836
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (14 fl oz / 414 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 414,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "core-power-26g-chocolate",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (14 fl oz / 414 mL)",
        "servingMilliliters": 414,
        "calories": 170,
        "protein": 26,
        "carbs": 8,
        "fat": 4.5,
        "fiber": 2,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 260,
        "potassium": 860,
        "calcium": 670
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://fairlife.com/core-power/chocolate-protein-shake/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Filtered lowfat Grade A milk, alkalized cocoa, natural flavors, monk fruit juice concentrate, stevia leaf extract, carrageenan, cellulose gel, cellulose gum, acesulfame potassium, sucralose, lactase enzyme, vitamin A palmitate, vitamin D3.",
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-core-power-vanilla-26g",
    "name": "Core Power Vanilla 26g",
    "displayName": "fairlife Core Power Vanilla 26g",
    "brand": "fairlife",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Core Power Vanilla",
      "Fairlife Core Power Vanilla",
      "Fairlife protein shake vanilla 26g"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "core-power-26g-vanilla",
      "fairlife"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 41.06,
      "protein": 6.28,
      "carbs": 1.449,
      "fat": 1.087,
      "fiber": 0.242,
      "sugar": 1.208,
      "addedSugar": 0.0,
      "saturatedFat": 0.725,
      "sodium": 62.802,
      "potassium": 188.406,
      "calcium": 161.836
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (14 fl oz / 414 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 414,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "core-power-26g-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (14 fl oz / 414 mL)",
        "servingMilliliters": 414,
        "calories": 170,
        "protein": 26,
        "carbs": 6,
        "fat": 4.5,
        "fiber": 1,
        "sugar": 5,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 260,
        "potassium": 780,
        "calcium": 670
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://fairlife.com/core-power/vanilla-protein-shake/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Filtered lowfat Grade A milk, natural flavors, monk fruit juice concentrate, stevia leaf extract, carrageenan, cellulose gel, cellulose gum, acesulfame potassium, sucralose, lactase enzyme, vitamin A palmitate, vitamin D3.",
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-core-power-strawberry-banana-26g",
    "name": "Core Power Strawberry Banana 26g",
    "displayName": "fairlife Core Power Strawberry Banana 26g",
    "brand": "fairlife",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Core Power Strawberry Banana",
      "Fairlife Strawberry Banana Protein Shake",
      "Fairlife Core Power Strawberry Banana 26g"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "core-power-26g-strawberry-banana",
      "fairlife"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 41.06,
      "protein": 6.28,
      "carbs": 1.691,
      "fat": 1.087,
      "fiber": 0.242,
      "sugar": 1.449,
      "addedSugar": 0.0,
      "saturatedFat": 0.725,
      "sodium": 67.633,
      "potassium": 190.821,
      "calcium": 161.836
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (14 fl oz / 414 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 414,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "core-power-26g-strawberry-banana",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (14 fl oz / 414 mL)",
        "servingMilliliters": 414,
        "calories": 170,
        "protein": 26,
        "carbs": 7,
        "fat": 4.5,
        "fiber": 1,
        "sugar": 6,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 280,
        "potassium": 790,
        "calcium": 670
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://fairlife.com/core-power/strawberry-banana-protein-shake/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Filtered lowfat Grade A milk, strawberry puree, banana puree, natural flavors, monk fruit juice concentrate, stevia leaf extract, carrageenan, cellulose gel, cellulose gum, acesulfame potassium, sucralose, lactase enzyme, vitamin A palmitate, vitamin D3.",
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-core-power-elite-chocolate-42g",
    "name": "Core Power Elite Chocolate 42g",
    "displayName": "fairlife Core Power Elite Chocolate 42g",
    "brand": "fairlife",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Core Power Elite Chocolate",
      "Fairlife 42g Chocolate",
      "Fairlife Core Power Elite 42g"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "high-protein-shake",
      "core-power-elite-42g-chocolate",
      "fairlife"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 55.56,
      "protein": 10.145,
      "carbs": 2.174,
      "fat": 0.845,
      "fiber": 0.483,
      "sugar": 1.691,
      "addedSugar": 0.0,
      "saturatedFat": 0.483,
      "sodium": 62.802,
      "potassium": 169.082,
      "calcium": 217.391
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (14 fl oz / 414 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 414,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "high-protein-shake",
      "productLine": "core-power-elite-42g-chocolate",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (14 fl oz / 414 mL)",
        "servingMilliliters": 414,
        "calories": 230,
        "protein": 42,
        "carbs": 9,
        "fat": 3.5,
        "fiber": 2,
        "sugar": 7,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 260,
        "potassium": 700,
        "calcium": 900
      },
      "sourceProvenance": {
        "provider": "fairlife",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://fairlife.com/core-power/chocolate-protein-shake-42g/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Filtered lowfat Grade A milk, alkalized cocoa, natural flavors, salt, acesulfame potassium, carrageenan, monk fruit juice concentrate, cellulose gel, cellulose gum, stevia leaf extract, sucralose, lactase enzyme, vitamin A palmitate, vitamin D3.",
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-premier-protein-chocolate",
    "name": "Chocolate Protein Shake",
    "displayName": "Premier Protein Chocolate Protein Shake",
    "brand": "Premier Protein",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Premier Chocolate Shake",
      "Premier Protein Chocolate"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "chocolate",
      "premier-protein"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 49.23,
      "protein": 9.231,
      "carbs": 1.231,
      "fat": 0.923,
      "fiber": 0.615,
      "sugar": 0.308,
      "addedSugar": 0.0,
      "saturatedFat": 0.308,
      "sodium": 70.769,
      "potassium": 98.462,
      "calcium": 200.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 shake (11 fl oz / 325 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 325,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "chocolate",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 shake (11 fl oz / 325 mL)",
        "servingMilliliters": 325,
        "calories": 160,
        "protein": 30,
        "carbs": 4,
        "fat": 3,
        "fiber": 2,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 1,
        "sodium": 230,
        "potassium": 320,
        "calcium": 650
      },
      "sourceProvenance": {
        "provider": "Premier Protein",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.premierprotein.com/products/chocolate-protein-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-premier-protein-vanilla",
    "name": "Vanilla Protein Shake",
    "displayName": "Premier Protein Vanilla Protein Shake",
    "brand": "Premier Protein",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Premier Vanilla Shake",
      "Premier Protein Vanilla"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "vanilla",
      "premier-protein"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 49.23,
      "protein": 9.231,
      "carbs": 0.923,
      "fat": 0.923,
      "fiber": 0.0,
      "sugar": 0.308,
      "addedSugar": 0.0,
      "saturatedFat": 0.154,
      "sodium": 76.923,
      "potassium": 55.385,
      "calcium": 200.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 shake (11 fl oz / 325 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 325,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 shake (11 fl oz / 325 mL)",
        "servingMilliliters": 325,
        "calories": 160,
        "protein": 30,
        "carbs": 3,
        "fat": 3,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 0.5,
        "sodium": 250,
        "potassium": 180,
        "calcium": 650
      },
      "sourceProvenance": {
        "provider": "Premier Protein",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.premierprotein.com/products/vanilla-protein-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-premier-protein-cookies-cream",
    "name": "Cookies & Cream Protein Shake",
    "displayName": "Premier Protein Cookies & Cream Protein Shake",
    "brand": "Premier Protein",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Premier Cookies and Cream",
      "Premier Protein Cookies Cream"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "cookies-cream",
      "premier-protein"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 49.23,
      "protein": 9.231,
      "carbs": 1.231,
      "fat": 0.923,
      "fiber": 0.308,
      "sugar": 0.308,
      "addedSugar": 0.0,
      "saturatedFat": 0.154,
      "sodium": 67.692,
      "potassium": 64.615,
      "calcium": 200.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 shake (11 fl oz / 325 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 325,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "cookies-cream",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 shake (11 fl oz / 325 mL)",
        "servingMilliliters": 325,
        "calories": 160,
        "protein": 30,
        "carbs": 4,
        "fat": 3,
        "fiber": 1,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 0.5,
        "sodium": 220,
        "potassium": 210,
        "calcium": 650
      },
      "sourceProvenance": {
        "provider": "Premier Protein",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.premierprotein.com/products/cookies-cream-protein-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-premier-protein-white-chocolate-raspberry",
    "name": "White Chocolate Raspberry Protein Shake",
    "displayName": "Premier Protein White Chocolate Raspberry Protein Shake",
    "brand": "Premier Protein",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Premier White Chocolate Raspberry",
      "Premier Raspberry Protein Shake"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-shake",
      "white-chocolate-raspberry",
      "premier-protein"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 52.31,
      "protein": 9.231,
      "carbs": 1.538,
      "fat": 0.923,
      "fiber": 0.0,
      "sugar": 0.923,
      "addedSugar": 0.615,
      "saturatedFat": 0.154,
      "sodium": 67.692,
      "potassium": 55.385,
      "calcium": 200.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 shake (11 fl oz / 325 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 325,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-shake",
      "productLine": "white-chocolate-raspberry",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 shake (11 fl oz / 325 mL)",
        "servingMilliliters": 325,
        "calories": 170,
        "protein": 30,
        "carbs": 5,
        "fat": 3,
        "fiber": 0,
        "sugar": 3,
        "addedSugar": 2,
        "saturatedFat": 0.5,
        "sodium": 220,
        "potassium": 180,
        "calcium": 650
      },
      "sourceProvenance": {
        "provider": "Premier Protein",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.premierprotein.com/products/white-chocolate-raspberry-indulgence-protein-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-premier-almondmilk-chocolate",
    "name": "Chocolate Almondmilk Protein Shake",
    "displayName": "Premier Protein Chocolate Almondmilk Protein Shake",
    "brand": "Premier Protein",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Premier Almondmilk Chocolate",
      "Premier Plant Protein Chocolate",
      "Premier Chocolate Almond Milk Shake"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "plant-protein-shake",
      "chocolate-almondmilk",
      "premier-protein"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 49.23,
      "protein": 6.154,
      "carbs": 2.769,
      "fat": 1.538,
      "fiber": 0.615,
      "sugar": 1.538,
      "addedSugar": 1.231,
      "saturatedFat": 0.308,
      "sodium": 104.615,
      "potassium": 187.692,
      "calcium": 58.462
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 shake (11 fl oz / 325 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 325,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "plant-protein-shake",
      "productLine": "chocolate-almondmilk",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 shake (11 fl oz / 325 mL)",
        "servingMilliliters": 325,
        "calories": 160,
        "protein": 20,
        "carbs": 9,
        "fat": 5,
        "fiber": 2,
        "sugar": 5,
        "addedSugar": 4,
        "saturatedFat": 1,
        "sodium": 340,
        "potassium": 610,
        "calcium": 190
      },
      "sourceProvenance": {
        "provider": "Premier Protein",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.premierprotein.com/products/chocolate-almondmilk-protein-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Almondmilk, soy protein isolate, sugar, cocoa powder, stabilizers, natural flavors, stevia, monk fruit, vitamins and minerals.",
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-ensure-original-vanilla",
    "name": "Original Vanilla Nutrition Shake",
    "displayName": "Ensure Original Vanilla Nutrition Shake",
    "brand": "Ensure",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ensure Original",
      "Ensure Vanilla",
      "Ensure Original Vanilla"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "nutrition-shake",
      "original-vanilla",
      "ensure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 92.83,
      "protein": 3.797,
      "carbs": 13.502,
      "fat": 2.532,
      "sugar": 4.219
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (8 fl oz / 237 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 237,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "nutrition-shake",
      "productLine": "original-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (8 fl oz / 237 mL)",
        "servingMilliliters": 237,
        "calories": 220,
        "protein": 9,
        "carbs": 32,
        "fat": 6,
        "sugar": 10
      },
      "sourceProvenance": {
        "provider": "Ensure",
        "sourceType": "official manufacturer current nutrition Q&A/product page",
        "sourceUrl": "https://www.ensure.com/nutrition-products/ensure-original/vanilla-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Current Ensure consumer Q&A explicitly distinguishes the ready-to-drink bottle from powder and reports 220 kcal, 9 g protein, 32 g carbohydrate, 10 g sugars and 6 g fat per 8 fl oz bottle. Nutrients not exposed as exact mass values in the current crawl are intentionally omitted."
    }
  },
  {
    "id": "beverage-brand3-ensure-plus-vanilla",
    "name": "Plus Vanilla Nutrition Shake",
    "displayName": "Ensure Plus Vanilla Nutrition Shake",
    "brand": "Ensure",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ensure Plus",
      "Ensure Plus Vanilla",
      "Ensure weight gain shake"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "nutrition-shake",
      "plus-vanilla",
      "ensure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 147.68,
      "protein": 6.751,
      "carbs": 20.253,
      "fat": 4.641,
      "sugar": 8.439
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (8 fl oz / 237 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 237,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "nutrition-shake",
      "productLine": "plus-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (8 fl oz / 237 mL)",
        "servingMilliliters": 237,
        "calories": 350,
        "protein": 16,
        "carbs": 48,
        "fat": 11,
        "sugar": 20
      },
      "sourceProvenance": {
        "provider": "Ensure",
        "sourceType": "official manufacturer current product comparison",
        "sourceUrl": "https://www.ensure.com/nutrition-products/compare-meal-replacement-shakes",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Current Ensure comparison page reports 350 kcal, 16 g protein, 48 g carbohydrate, 20 g sugar and 11 g fat per 8 fl oz."
    }
  },
  {
    "id": "beverage-brand3-ensure-complete-vanilla",
    "name": "COMPLETE Vanilla Nutrition Shake",
    "displayName": "Ensure COMPLETE Vanilla Nutrition Shake",
    "brand": "Ensure",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ensure Complete",
      "Ensure COMPLETE Vanilla",
      "Ensure 30g Protein"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "nutrition-shake",
      "complete-vanilla",
      "ensure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 118.24,
      "protein": 10.135,
      "carbs": 14.189,
      "fat": 2.703,
      "fiber": 1.351,
      "sugar": 5.068
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (10 fl oz / 296 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 296,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "nutrition-shake",
      "productLine": "complete-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (10 fl oz / 296 mL)",
        "servingMilliliters": 296,
        "calories": 350,
        "protein": 30,
        "carbs": 42,
        "fat": 8,
        "fiber": 4,
        "sugar": 15
      },
      "sourceProvenance": {
        "provider": "Ensure",
        "sourceType": "official manufacturer current product page and comparison",
        "sourceUrl": "https://www.ensure.com/nutrition-products/ensure-complete-shake/vanilla",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Current manufacturer pages report 350 kcal, 30 g protein, 42 g carbohydrate, 8 g fat, 15 g sugar and 4 g fiber per 10 fl oz."
    }
  },
  {
    "id": "beverage-brand3-ensure-high-protein-vanilla",
    "name": "High Protein Vanilla Shake",
    "displayName": "Ensure High Protein Vanilla Shake",
    "brand": "Ensure",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ensure High Protein",
      "Ensure High Protein Vanilla"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "protein-nutrition-shake",
      "high-protein-vanilla",
      "ensure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 67.51,
      "protein": 6.751,
      "carbs": 8.017,
      "fat": 0.844,
      "sugar": 1.688
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (8 fl oz / 237 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 237,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "protein-nutrition-shake",
      "productLine": "high-protein-vanilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 bottle (8 fl oz / 237 mL)",
        "servingMilliliters": 237,
        "calories": 160,
        "protein": 16,
        "carbs": 19,
        "fat": 2,
        "sugar": 4
      },
      "sourceProvenance": {
        "provider": "Ensure",
        "sourceType": "official manufacturer current nutrition FAQ",
        "sourceUrl": "https://www.ensure.com/nutrition-products/ensure-high-protein/vanilla-shake",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Ensure's current FAQ explicitly reports 160 kcal, 16 g protein, 2 g fat, 19 g carbohydrate and 4 g sugar per serving."
    }
  },
  {
    "id": "beverage-brand3-orgain-grass-fed-sweet-vanilla-bean",
    "name": "Organic Nutrition Grass-Fed Sweet Vanilla Bean",
    "displayName": "Orgain Organic Nutrition Grass-Fed Sweet Vanilla Bean",
    "brand": "Orgain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Orgain Vanilla Shake",
      "Orgain Grass Fed Vanilla",
      "Orgain Organic Nutrition Vanilla"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "nutrition-shake",
      "grass-fed-sweet-vanilla-bean",
      "orgain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 75.76,
      "protein": 4.848,
      "carbs": 8.485,
      "fat": 2.424,
      "fiber": 0.303,
      "sugar": 3.636,
      "addedSugar": 3.333,
      "saturatedFat": 0.303,
      "sodium": 78.788,
      "potassium": 63.636,
      "calcium": 154.545
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 carton (11 fl oz / 330 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 330,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "nutrition-shake",
      "productLine": "grass-fed-sweet-vanilla-bean",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 carton (11 fl oz / 330 mL)",
        "servingMilliliters": 330,
        "calories": 250,
        "protein": 16,
        "carbs": 28,
        "fat": 8,
        "fiber": 1,
        "sugar": 12,
        "addedSugar": 11,
        "saturatedFat": 1,
        "sodium": 260,
        "potassium": 210,
        "calcium": 510
      },
      "sourceProvenance": {
        "provider": "Orgain",
        "sourceType": "official manufacturer healthcare nutrition profile",
        "sourceUrl": "https://healthcare.orgain.com/media/rdocs/Orgain_HCP_NutritionalProfileOfProducts_120424_final.pdf",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-orgain-grass-fed-chocolate-fudge",
    "name": "Organic Nutrition Grass-Fed Creamy Chocolate Fudge",
    "displayName": "Orgain Organic Nutrition Grass-Fed Creamy Chocolate Fudge",
    "brand": "Orgain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Orgain Chocolate Shake",
      "Orgain Creamy Chocolate Fudge",
      "Orgain Grass Fed Chocolate"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "nutrition-shake",
      "grass-fed-creamy-chocolate-fudge",
      "orgain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 75.76,
      "protein": 4.848,
      "carbs": 8.485,
      "fat": 2.424,
      "fiber": 0.303,
      "sugar": 3.636,
      "addedSugar": 3.333,
      "saturatedFat": 0.303,
      "sodium": 81.818,
      "potassium": 96.97,
      "calcium": 151.515
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 carton (11 fl oz / 330 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 330,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "nutrition-shake",
      "productLine": "grass-fed-creamy-chocolate-fudge",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 carton (11 fl oz / 330 mL)",
        "servingMilliliters": 330,
        "calories": 250,
        "protein": 16,
        "carbs": 28,
        "fat": 8,
        "fiber": 1,
        "sugar": 12,
        "addedSugar": 11,
        "saturatedFat": 1,
        "sodium": 270,
        "potassium": 320,
        "calcium": 500
      },
      "sourceProvenance": {
        "provider": "Orgain",
        "sourceType": "official manufacturer healthcare nutrition profile",
        "sourceUrl": "https://healthcare.orgain.com/media/rdocs/Orgain_HCP_NutritionalProfileOfProducts_120424_final.pdf",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand3-orgain-plant-protein-vanilla",
    "name": "Organic Nutrition Plant Protein Vanilla Bean",
    "displayName": "Orgain Organic Nutrition Plant Protein Vanilla Bean",
    "brand": "Orgain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Orgain Plant Protein Vanilla",
      "Orgain Vegan Vanilla Shake",
      "Orgain Organic Plant Vanilla"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-3",
      "protein-shake",
      "plant-nutrition-shake",
      "plant-protein-vanilla-bean",
      "orgain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 69.7,
      "protein": 4.848,
      "carbs": 8.485,
      "fat": 1.818,
      "fiber": 0.606,
      "sugar": 3.03,
      "addedSugar": 3.03,
      "saturatedFat": 0.303,
      "sodium": 78.788,
      "potassium": 36.364,
      "calcium": 45.455
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 carton (11 fl oz / 330 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 330,
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
    "source": "AriFoodBeverageBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "plant-nutrition-shake",
      "productLine": "plant-protein-vanilla-bean",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package/manufacturer serving",
      "labelNutrition": {
        "servingSize": "1 carton (11 fl oz / 330 mL)",
        "servingMilliliters": 330,
        "calories": 230,
        "protein": 16,
        "carbs": 28,
        "fat": 6,
        "fiber": 2,
        "sugar": 10,
        "addedSugar": 10,
        "saturatedFat": 1,
        "sodium": 260,
        "potassium": 120,
        "calcium": 150
      },
      "sourceProvenance": {
        "provider": "Orgain",
        "sourceType": "official manufacturer healthcare nutrition profile",
        "sourceUrl": "https://healthcare.orgain.com/media/rdocs/Orgain_HCP_NutritionalProfileOfProducts_120424_final.pdf",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact current manufacturer/package values are preserved in metadata.labelNutrition and normalized mathematically to ARI's canonical 100 mL beverage basis.",
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
    if (!global.AriFoodBeverages) return false;

    if (typeof global.AriFoodBeverages.isExpectedModule === "function") {
      try {
        return global.AriFoodBeverages.isExpectedModule(MODULE_NAME);
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

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
      console.warn(
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`,
        error
      );
    }
  }

  const registration = registry.registerMany(
    ARI_BEVERAGE_BRANDS_3_FOODS,
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
      foodCount: ARI_BEVERAGE_BRANDS_3_FOODS.length,
      brandCount: new Set(
        ARI_BEVERAGE_BRANDS_3_FOODS.map(food => food.brand)
      ).size,
      runtimeInternetRequired: false,
      brandFirst: true,
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
      `Registration rejected ${registration.rejected} Beverage Brands 3 record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodBeverages &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodBeverages.markModuleLoaded === "function"
  ) {
    global.AriFoodBeverages.markModuleLoaded(MODULE_NAME, moduleResult);
  }

  global.AriFoodBeverageBrands3 = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_BEVERAGE_BRANDS_3_FOODS.length;
    },

    getFoodIds() {
      return ARI_BEVERAGE_BRANDS_3_FOODS.map(food => food.id);
    },

    getBrands() {
      return Array.from(
        new Set(ARI_BEVERAGE_BRANDS_3_FOODS.map(food => food.brand))
      );
    },

    getByBrand(brand) {
      const normalized = String(brand || "").trim().toLowerCase();

      return ARI_BEVERAGE_BRANDS_3_FOODS
        .filter(food => String(food.brand || "").toLowerCase() === normalized)
        .map(clone);
    },

    getByBeverageType(beverageType) {
      const normalized = String(beverageType || "").trim().toLowerCase();

      return ARI_BEVERAGE_BRANDS_3_FOODS
        .filter(
          food =>
            String(food.metadata?.beverageType || "").toLowerCase() === normalized
        )
        .map(clone);
    },

    getHighProtein(minimumGramsPerContainer = 20) {
      const threshold = Number(minimumGramsPerContainer);

      return ARI_BEVERAGE_BRANDS_3_FOODS
        .filter(
          food =>
            Number(food.metadata?.labelNutrition?.protein || 0) >= threshold
        )
        .map(clone);
    },

    getPlantBased() {
      return ARI_BEVERAGE_BRANDS_3_FOODS
        .filter(
          food =>
            String(food.metadata?.beverageType || "").includes("plant")
        )
        .map(clone);
    },

    getNutritionShakes() {
      return ARI_BEVERAGE_BRANDS_3_FOODS
        .filter(
          food =>
            String(food.metadata?.beverageType || "").includes("nutrition")
        )
        .map(clone);
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRecord(foodId) {
      const id = String(foodId || "").trim();
      const record = ARI_BEVERAGE_BRANDS_3_FOODS.find(food => food.id === id);
      return record ? clone(record) : null;
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-beverage-brands-3-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_BEVERAGE_BRANDS_3_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BEVERAGE_BRANDS_3_FOODS.length} branded protein/nutrition shake records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
