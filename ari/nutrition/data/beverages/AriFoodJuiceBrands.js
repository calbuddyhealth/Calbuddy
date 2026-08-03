// =====================================================
// ARI REBIRTH
// File: AriFoodJuiceBrands.js
// Version: 1.0.0
//
// Purpose:
//   Manufacturer-first branded juice and juice-drink
//   module for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - Tropicana
//   - Simply
//   - Minute Maid
//   - Ocean Spray
//   - Welch's
//   - V8
//   - Mott's
//   - Martinelli's
//
// Coverage:
//   20 current branded juice / juice-drink products.
//
// Canonical basis:
//   100 mL.
//
// Critical distinction:
//   100% juice != juice drink != juice cocktail
//   != reduced-sugar drink != zero-sugar drink.
//
// Data policy:
//   - Exact current label first.
//   - percentJuice preserved separately when known.
//   - Naturally occurring juice sugar is not treated
//     as added sugar.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodJuiceBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodJuiceBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "manufacturer-first branded juice and juice-drink module",
  "recordCount": 20,
  "brands": [
    "Martinelli's",
    "Minute Maid",
    "Mott's",
    "Ocean Spray",
    "Simply",
    "Tropicana",
    "V8",
    "Welch's"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official manufacturer nutrition/product pages",
    "Official manufacturer product page plus current retailer package-label capture",
    "Current retailer package-label capture when the manufacturer panel is not crawlable"
  ],
  "rules": [
    "Preserve exact package nutrition in metadata.labelNutrition.",
    "Normalize current label values mathematically to 100 mL.",
    "Track percentJuice separately from the nutrient panel when known.",
    "Keep 100% juice separate from juice drinks, juice cocktails, reduced-sugar drinks, and zero-sugar drinks.",
    "Keep fruit juice, vegetable juice, and fruit-and-vegetable blends distinguishable through juiceType.",
    "Do not treat naturally occurring juice sugar as added sugar.",
    "Do not infer percent juice when the current label or product page does not clearly publish it.",
    "Do not create duplicate food records solely for alternate bottle/carton sizes when formulation is unchanged.",
    "Branded juice records outrank AriFoodBeverageCore fallback juice records.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_JUICE_BRAND_FOODS =
    [
  {
    "id": "beverage-juice-tropicana-pure-premium-original-no-pulp",
    "name": "Pure Premium Original No Pulp",
    "displayName": "Tropicana Pure Premium Original No Pulp",
    "brand": "Tropicana",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Tropicana Original",
      "Tropicana No Pulp",
      "Tropicana Pure Premium",
      "Tropicana orange juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-orange-juice",
      "tropicana"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 0.833,
      "carbs": 10.833,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 0.0,
      "sugar": 9.167,
      "addedSugar": 0.0,
      "potassium": 187.5,
      "calcium": 8.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-orange-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 2,
        "carbs": 26,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0,
        "sugar": 22,
        "addedSugar": 0,
        "potassium": 450,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Tropicana",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://tropicana.com/products/original/",
        "labelUrl": "https://www.target.com/p/-/A-90777455"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "100% orange juice, never from concentrate; no added sugar."
    }
  },
  {
    "id": "beverage-juice-simply-orange-pulp-free",
    "name": "Orange Pulp Free",
    "displayName": "Simply Orange Pulp Free",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Orange",
      "Simply Orange Pulp Free",
      "Simply orange juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-orange-juice",
      "simply"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 0.833,
      "carbs": 10.833,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 0.0,
      "sugar": 9.583,
      "addedSugar": 0.0,
      "potassium": 187.5,
      "calcium": 8.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-orange-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 2,
        "carbs": 26,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0,
        "sugar": 23,
        "addedSugar": 0,
        "potassium": 450,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices",
        "labelUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-simply-light-orange-pulp-free",
    "name": "Light Orange Pulp Free",
    "displayName": "Simply Light Orange Pulp Free",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Light Orange",
      "Simply Light Orange Juice",
      "Simply Light"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "reduced-sugar-orange-juice-drink",
      "simply"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 20.83,
      "protein": 0.0,
      "carbs": 5.0,
      "fat": 0.0,
      "sodium": 4.167,
      "caffeine": 0.0,
      "fiber": 0.0,
      "sugar": 4.583,
      "addedSugar": 0.0,
      "potassium": 79.167,
      "calcium": 4.167
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "reduced-sugar-orange-juice-drink",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 50,
        "protein": 0,
        "carbs": 12,
        "fat": 0,
        "sodium": 10,
        "caffeine": 0,
        "fiber": 0,
        "sugar": 11,
        "addedSugar": 0,
        "potassium": 190,
        "calcium": 10
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.coca-cola.com/us/en/brands/simply/products/light-juices",
        "labelUrl": "https://www.coca-cola.com/us/en/brands/simply/products/light-juices"
      },
      "ingredients": "Pure filtered water, orange juice, less than 1% of vitamin C (ascorbic acid), natural flavors, citric acid, citrus pectin, stevia leaf extract, beta carotene.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Reduced-sugar orange juice drink; not equivalent to 100% orange juice."
    }
  },
  {
    "id": "beverage-juice-simply-orange-mango",
    "name": "Orange with Mango",
    "displayName": "Simply Orange with Mango",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Orange Mango",
      "Simply Mango Orange",
      "Simply orange with mango"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-juice-blend",
      "simply"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 50.0,
      "protein": 0.833,
      "carbs": 11.667,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 0.0,
      "sugar": 10.417,
      "addedSugar": 0.0,
      "potassium": 187.5,
      "calcium": 8.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 120,
        "protein": 2,
        "carbs": 28,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0,
        "sugar": 25,
        "addedSugar": 0,
        "potassium": 450,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices",
        "labelUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices"
      },
      "ingredients": "Orange juice, mango puree, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-simply-orange-pineapple",
    "name": "Orange with Pineapple",
    "displayName": "Simply Orange with Pineapple",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Orange Pineapple",
      "Simply Pineapple Orange",
      "Simply orange with pineapple"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-juice-blend",
      "simply"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 0.833,
      "carbs": 11.25,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 0.0,
      "sugar": 10.0,
      "addedSugar": 0.0,
      "potassium": 183.333,
      "calcium": 8.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 2,
        "carbs": 27,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0,
        "sugar": 24,
        "addedSugar": 0,
        "potassium": 440,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices",
        "labelUrl": "https://www.coca-cola.com/us/en/brands/simply/products/orange-juices"
      },
      "ingredients": "Orange and pineapple juices, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-minute-maid-100-apple",
    "name": "100% Apple Juice",
    "displayName": "Minute Maid 100% Apple Juice",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Apple Juice",
      "Minute Maid 100 Apple",
      "Minute Maid apple"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-apple-juice",
      "minute-maid"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 47.89,
      "protein": 0.0,
      "carbs": 11.549,
      "fat": 0.0,
      "sodium": 8.451,
      "caffeine": 0.0,
      "sugar": 10.986,
      "addedSugar": 0.0,
      "potassium": 101.408,
      "calcium": 5.634
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (12 fl oz / 355 mL)",
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-apple-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 170,
        "protein": 0,
        "carbs": 41,
        "fat": 0,
        "sodium": 30,
        "caffeine": 0,
        "sugar": 39,
        "addedSugar": 0,
        "potassium": 360,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/minute-maid-variety-juices",
        "labelUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/minute-maid-variety-juices"
      },
      "ingredients": "Pure filtered water, concentrated apple juice, vitamin C (ascorbic acid).",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-ocean-spray-original-cranberry-cocktail",
    "name": "Original Cranberry Juice Cocktail",
    "displayName": "Ocean Spray Original Cranberry Juice Cocktail",
    "brand": "Ocean Spray",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ocean Spray Cranberry",
      "Ocean Spray Cranberry Cocktail",
      "cranberry juice cocktail"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "cranberry-juice-cocktail",
      "ocean-spray"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 0.0,
      "carbs": 11.667,
      "fat": 0.0,
      "sodium": 4.167,
      "caffeine": 0.0,
      "sugar": 10.417,
      "addedSugar": 9.583
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "cranberry-juice-cocktail",
      "percentJuice": 27,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 110,
        "protein": 0,
        "carbs": 28,
        "fat": 0,
        "sodium": 10,
        "caffeine": 0,
        "sugar": 25,
        "addedSugar": 23
      },
      "sourceProvenance": {
        "provider": "Ocean Spray",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.oceanspray.com/products/cranberry-juice-cocktail-6-10-oz",
        "labelUrl": "https://www.target.com/p/-/A-12935714"
      },
      "ingredients": "Filtered water, cranberry juice (water, cranberry juice concentrate), sugar, ascorbic acid, vegetable concentrate for color.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Juice cocktail; not 100% juice."
    }
  },
  {
    "id": "beverage-juice-ocean-spray-100-cranberry-blend",
    "name": "100% Juice Blend Cranberry",
    "displayName": "Ocean Spray 100% Juice Blend Cranberry",
    "brand": "Ocean Spray",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ocean Spray 100 Cranberry",
      "Ocean Spray 100% Cranberry Blend",
      "Ocean Spray cranberry juice blend"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-juice-blend",
      "ocean-spray"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 41.67,
      "protein": 0.0,
      "carbs": 12.083,
      "fat": 0.0,
      "sodium": 8.333,
      "caffeine": 0.0,
      "sugar": 9.583,
      "addedSugar": 0.0,
      "potassium": 95.833
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 100,
        "protein": 0,
        "carbs": 29,
        "fat": 0,
        "sodium": 20,
        "caffeine": 0,
        "sugar": 23,
        "addedSugar": 0,
        "potassium": 230
      },
      "sourceProvenance": {
        "provider": "Ocean Spray",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.oceanspray.com/products/100-juice-blend-cranberry-6-10-oz",
        "labelUrl": "https://www.target.com/p/-/A-80116765"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "100% juice blend; no added sugar."
    }
  },
  {
    "id": "beverage-juice-ocean-spray-zero-sugar-cranberry",
    "name": "ZERO Sugar Cranberry Juice Drink",
    "displayName": "Ocean Spray ZERO Sugar Cranberry Juice Drink",
    "brand": "Ocean Spray",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ocean Spray Zero Cranberry",
      "Ocean Spray Zero Sugar Cranberry",
      "zero sugar cranberry juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "zero-sugar-cranberry-juice-drink",
      "ocean-spray"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.08,
      "protein": 0.0,
      "carbs": 0.833,
      "fat": 0.0,
      "sodium": 12.5,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "zero-sugar-cranberry-juice-drink",
      "percentJuice": 5,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 30,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Ocean Spray",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-89966334"
      },
      "ingredients": "Filtered water, cranberry juice, natural flavor, citric acid, fumaric acid, stevia leaf extract, sodium citrate, ascorbic acid, vegetable concentrate for color.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Zero-sugar juice drink; not 100% juice."
    }
  },
  {
    "id": "beverage-juice-ocean-spray-100-cranberry-pomegranate",
    "name": "100% Juice Blend Cranberry Pomegranate",
    "displayName": "Ocean Spray 100% Juice Blend Cranberry Pomegranate",
    "brand": "Ocean Spray",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Ocean Spray Cranberry Pomegranate",
      "Ocean Spray Cran Pomegranate",
      "Ocean Spray 100 cranberry pomegranate"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-juice-blend",
      "ocean-spray"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 50.0,
      "protein": 0.0,
      "carbs": 13.333,
      "fat": 0.0,
      "sodium": 8.333,
      "caffeine": 0.0,
      "sugar": 10.833,
      "addedSugar": 0.0,
      "potassium": 108.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 120,
        "protein": 0,
        "carbs": 32,
        "fat": 0,
        "sodium": 20,
        "caffeine": 0,
        "sugar": 26,
        "addedSugar": 0,
        "potassium": 260
      },
      "sourceProvenance": {
        "provider": "Ocean Spray",
        "sourceType": "official manufacturer product page + current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.oceanspray.com/products/100-juice-blend-cranberry-pomegranate-64-oz",
        "labelUrl": "https://www.target.com/p/-/A-80185589"
      },
      "ingredients": "Apple, grape, plum, pear, cranberry and pomegranate juices from concentrate, natural flavor, ascorbic acid, fumaric acid.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-welchs-100-white-grape",
    "name": "100% White Grape Juice",
    "displayName": "Welch's 100% White Grape Juice",
    "brand": "Welch's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Welch's White Grape",
      "Welchs White Grape Juice",
      "Welch's 100 white grape"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-grape-juice",
      "welchs"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 58.33,
      "protein": 0.417,
      "carbs": 14.583,
      "fat": 0.0,
      "sodium": 6.25,
      "caffeine": 0.0,
      "sugar": 14.583,
      "addedSugar": 0.0,
      "potassium": 58.333,
      "calcium": 12.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-grape-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 140,
        "protein": 1,
        "carbs": 35,
        "fat": 0,
        "sodium": 15,
        "caffeine": 0,
        "sugar": 35,
        "addedSugar": 0,
        "potassium": 140,
        "calcium": 30
      },
      "sourceProvenance": {
        "provider": "Welch's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://welchs.com/en-us/juices/100-percent/white-grape/",
        "labelUrl": "https://welchs.com/en-us/juices/100-percent/white-grape/"
      },
      "ingredients": "White grape juice from concentrate, white grape juice, ascorbic acid, potassium metabisulfite, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-welchs-100-red-grape",
    "name": "100% Red Grape Juice",
    "displayName": "Welch's 100% Red Grape Juice",
    "brand": "Welch's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Welch's Red Grape",
      "Welchs Red Grape Juice",
      "Welch's 100 red grape"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-grape-juice",
      "welchs"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 58.33,
      "protein": 0.417,
      "carbs": 16.25,
      "fat": 0.0,
      "sodium": 8.333,
      "caffeine": 0.0,
      "sugar": 15.0,
      "addedSugar": 0.0,
      "potassium": 58.333,
      "calcium": 12.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-grape-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 140,
        "protein": 1,
        "carbs": 39,
        "fat": 0,
        "sodium": 20,
        "caffeine": 0,
        "sugar": 36,
        "addedSugar": 0,
        "potassium": 140,
        "calcium": 30
      },
      "sourceProvenance": {
        "provider": "Welch's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://welchs.com/en-us/juices/100-percent/red-grape/",
        "labelUrl": "https://welchs.com/en-us/juices/100-percent/red-grape/"
      },
      "ingredients": "Grape juice from concentrate, grape juice, ascorbic acid, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-welchs-grape-juice-drink",
    "name": "Grape Juice Drink",
    "displayName": "Welch's Grape Juice Drink",
    "brand": "Welch's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Welch's Grape Drink",
      "Welchs Grape Juice Drink",
      "Welch's grape beverage"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "grape-juice-drink",
      "welchs"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.68,
      "protein": 0.0,
      "carbs": 10.169,
      "fat": 0.0,
      "sodium": 3.39,
      "caffeine": 0.0,
      "sugar": 9.492,
      "addedSugar": 6.78,
      "potassium": 33.898
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (10 fl oz / 295 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 295,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "grape-juice-drink",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (10 fl oz / 295 mL)",
        "servingMilliliters": 295,
        "calories": 120,
        "protein": 0,
        "carbs": 30,
        "fat": 0,
        "sodium": 10,
        "caffeine": 0,
        "sugar": 28,
        "addedSugar": 20,
        "potassium": 100
      },
      "sourceProvenance": {
        "provider": "Welch's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://welchs.com/en-us/juices/drinks/grape/",
        "labelUrl": "https://welchs.com/en-us/juices/drinks/grape/"
      },
      "ingredients": "Filtered water, grape juice, high fructose corn syrup, less than 2% grape juice concentrate, citric acid, ascorbic acid, stevia leaf extract, pectin, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Juice drink with added sugar; not 100% juice."
    }
  },
  {
    "id": "beverage-juice-welchs-zero-sugar-grape",
    "name": "Grape Zero Sugar",
    "displayName": "Welch's Grape Zero Sugar",
    "brand": "Welch's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Welch's Zero Sugar Grape",
      "Welchs Grape Zero",
      "Welch's zero grape"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "zero-sugar-grape-juice-drink",
      "welchs"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 2.08,
      "protein": 0.0,
      "carbs": 0.833,
      "fat": 0.0,
      "sodium": 12.5,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "zero-sugar-grape-juice-drink",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "sodium": 30,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Welch's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.welchs.com/en-us/juices/zero-sugar-drinks/grapes",
        "labelUrl": "https://www.welchs.com/en-us/juices/zero-sugar-drinks/grapes"
      },
      "ingredients": "Filtered water, grape juice from concentrate, natural flavor, citric acid, grape juice concentrate for color, ascorbic acid, sodium citrate, sucralose, pectin, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Zero-sugar grape juice drink; not 100% juice."
    }
  },
  {
    "id": "beverage-juice-v8-original-100-vegetable",
    "name": "Original 100% Vegetable Juice",
    "displayName": "V8 Original 100% Vegetable Juice",
    "brand": "V8",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "V8 Original",
      "V8 Vegetable Juice",
      "Original V8"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-vegetable-juice",
      "v8"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 18.75,
      "protein": 0.833,
      "carbs": 3.75,
      "fat": 0.0,
      "sodium": 266.667,
      "caffeine": 0.0,
      "fiber": 0.833,
      "sugar": 2.917,
      "addedSugar": 0.0,
      "potassium": 195.833,
      "calcium": 16.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-vegetable-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 45,
        "protein": 2,
        "carbs": 9,
        "fat": 0,
        "sodium": 640,
        "caffeine": 0,
        "fiber": 2,
        "sugar": 7,
        "addedSugar": 0,
        "potassium": 470,
        "calcium": 40
      },
      "sourceProvenance": {
        "provider": "V8",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.campbells.com/v8/products/v8-vegetable-juice/original-100-vegetable-juice/",
        "labelUrl": "https://www.campbells.com/v8/products/v8-vegetable-juice/original-100-vegetable-juice/"
      },
      "ingredients": "Vegetable juice (water and concentrated juices of tomatoes, carrots, celery, beets, parsley, lettuce, watercress, spinach), salt, vitamin C, natural flavoring, beta carotene, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-v8-low-sodium-100-vegetable",
    "name": "Low Sodium Original 100% Vegetable Juice",
    "displayName": "V8 Low Sodium Original 100% Vegetable Juice",
    "brand": "V8",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "V8 Low Sodium",
      "Low Sodium V8",
      "V8 low sodium vegetable juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-vegetable-juice-low-sodium",
      "v8"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 18.75,
      "protein": 0.833,
      "carbs": 3.75,
      "fat": 0.0,
      "sodium": 58.333,
      "caffeine": 0.0,
      "fiber": 0.417,
      "sugar": 2.917,
      "addedSugar": 0.0,
      "potassium": 354.167,
      "calcium": 12.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (240 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 240,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-vegetable-juice-low-sodium",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 45,
        "protein": 2,
        "carbs": 9,
        "fat": 0,
        "sodium": 140,
        "caffeine": 0,
        "fiber": 1,
        "sugar": 7,
        "addedSugar": 0,
        "potassium": 850,
        "calcium": 30
      },
      "sourceProvenance": {
        "provider": "V8",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.campbells.com/v8/products/v8-vegetable-juice/low-sodium-vegetable-juice/",
        "labelUrl": "https://www.campbells.com/v8/products/v8-vegetable-juice/low-sodium-vegetable-juice/"
      },
      "ingredients": "Vegetable juice, potassium chloride, salt, vitamin C, natural flavoring, beta carotene, citric acid.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-v8-deliciously-green",
    "name": "Deliciously Green 100% Fruit & Vegetable Juice",
    "displayName": "V8 Deliciously Green 100% Fruit & Vegetable Juice",
    "brand": "V8",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "V8 Green Juice",
      "V8 Deliciously Green",
      "green V8"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-vegetable-juice-blend",
      "v8"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 38.14,
      "protein": 0.424,
      "carbs": 8.898,
      "fat": 0.0,
      "sodium": 23.305,
      "caffeine": 0.0,
      "fiber": 0.0,
      "sugar": 7.627,
      "addedSugar": 0.0,
      "potassium": 148.305,
      "calcium": 12.712
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (236 mL)",
        "amount": 1,
        "unit": "serving",
        "milliliters": 236,
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-vegetable-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (236 mL)",
        "servingMilliliters": 236,
        "calories": 90,
        "protein": 1,
        "carbs": 21,
        "fat": 0,
        "sodium": 55,
        "caffeine": 0,
        "fiber": 0,
        "sugar": 18,
        "addedSugar": 0,
        "potassium": 350,
        "calcium": 30
      },
      "sourceProvenance": {
        "provider": "V8",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.campbells.com/v8/products/v8-blends/deliciously-green/",
        "labelUrl": "https://www.campbells.com/v8/products/v8-blends/deliciously-green/"
      },
      "ingredients": "Vegetable and fruit juices from concentrate, water, citric acid, natural flavoring, banana puree, spinach puree, vitamin C, color concentrates, beta carotene, zinc gluconate.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-motts-100-pineapple-passionfruit",
    "name": "100% Pineapple Passionfruit Juice",
    "displayName": "Mott's 100% Pineapple Passionfruit Juice",
    "brand": "Mott's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mott's Pineapple Passionfruit",
      "Motts Pineapple Passion Fruit",
      "Mott's tropical juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-fruit-juice-blend",
      "motts"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 50.63,
      "protein": 0.0,
      "carbs": 12.236,
      "fat": 0.0,
      "sodium": 14.768,
      "caffeine": 0.0,
      "sugar": 11.814,
      "addedSugar": 0.0,
      "potassium": 122.363,
      "calcium": 8.439
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (8 fl oz / 237 mL)",
        "amount": 1,
        "unit": "serving",
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-fruit-juice-blend",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (8 fl oz / 237 mL)",
        "servingMilliliters": 237,
        "calories": 120,
        "protein": 0,
        "carbs": 29,
        "fat": 0,
        "sodium": 35,
        "caffeine": 0,
        "sugar": 28,
        "addedSugar": 0,
        "potassium": 290,
        "calcium": 20
      },
      "sourceProvenance": {
        "provider": "Mott's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.motts.com/products/juice/motts-100-pineapple-passionfruit-juice",
        "labelUrl": "https://www.motts.com/products/juice/motts-100-pineapple-passionfruit-juice"
      },
      "ingredients": "Apple, water, passion fruit and clarified pineapple juices from concentrate, ascorbic acid, citric acid, natural flavors, beta carotene.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-juice-motts-zero-sugar-apple",
    "name": "Zero Sugar Apple",
    "displayName": "Mott's Zero Sugar Apple",
    "brand": "Mott's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mott's Zero Apple",
      "Motts Zero Sugar Apple",
      "Mott's zero sugar apple juice"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "zero-sugar-apple-juice-drink",
      "motts"
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
      "sodium": 10.549,
      "caffeine": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "8 fl oz (237 mL)",
        "amount": 1,
        "unit": "serving",
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "zero-sugar-apple-juice-drink",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (237 mL)",
        "servingMilliliters": 237,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 25,
        "caffeine": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Mott's",
        "sourceType": "official manufacturer nutrition panel",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://www.motts.com/products/juice/motts-zero-sugar-apple",
        "labelUrl": "https://www.motts.com/products/juice/motts-zero-sugar-apple"
      },
      "ingredients": "Water, apple juice from concentrate, malic acid, natural flavors, ascorbic acid, stevia leaf extract, potassium citrate, sea salt, vegetable juice for color.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Zero-sugar apple juice drink; not 100% juice."
    }
  },
  {
    "id": "beverage-juice-martinellis-gold-medal-apple",
    "name": "Gold Medal 100% Apple Juice",
    "displayName": "Martinelli's Gold Medal 100% Apple Juice",
    "brand": "Martinelli's",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Martinelli's Apple Juice",
      "Martinellis Apple Juice",
      "Martinelli Gold Medal Apple"
    ],
    "tags": [
      "beverage",
      "juice",
      "branded",
      "100-percent-apple-juice",
      "martinellis"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 60.81,
      "protein": 0.338,
      "carbs": 14.527,
      "fat": 0.0,
      "sodium": 0.0,
      "caffeine": 0.0,
      "fiber": 0.0,
      "sugar": 13.176,
      "addedSugar": 0.0,
      "potassium": 50.676,
      "calcium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 bottle (10 fl oz / 296 mL)",
        "amount": 1,
        "unit": "serving",
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
    "source": "AriFoodJuiceBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "juice",
      "juiceType": "100-percent-apple-juice",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 bottle (10 fl oz / 296 mL)",
        "servingMilliliters": 296,
        "calories": 180,
        "protein": 1,
        "carbs": 43,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0,
        "fiber": 0,
        "sugar": 39,
        "addedSugar": 0,
        "potassium": 150,
        "calcium": 0
      },
      "sourceProvenance": {
        "provider": "Martinelli's",
        "sourceType": "current retailer package-label capture for Martinelli's",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-53424047"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "100% apple juice, not from concentrate; no added water or sugar."
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
      ARI_JUICE_BRAND_FOODS,
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
        ARI_JUICE_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_JUICE_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      runtimeInternetRequired:
        false,

      brandFirst:
        true,

      percentJuiceTracked:
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
      `Registration rejected ${registration.rejected} juice-brand record(s).`,
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

  global.AriFoodJuiceBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_JUICE_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_JUICE_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_JUICE_BRAND_FOODS.map(
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

        return ARI_JUICE_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getByJuiceType(juiceType) {
        const normalized =
          String(juiceType || "")
            .trim()
            .toLowerCase();

        return ARI_JUICE_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.juiceType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      get100PercentJuice() {
        return ARI_JUICE_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.percentJuice
              ) === 100
          )
          .map(clone);
      },

      getJuiceDrinks() {
        return ARI_JUICE_BRAND_FOODS
          .filter(
            food =>
              Number(
                food.metadata?.percentJuice
              ) !== 100
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_JUICE_BRAND_FOODS
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
          ARI_JUICE_BRAND_FOODS.find(
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
        "ari:food-juice-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_JUICE_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

            percentJuiceTracked:
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_JUICE_BRAND_FOODS.length} branded juice and juice-drink records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
