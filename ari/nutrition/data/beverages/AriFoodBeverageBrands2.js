// =====================================================
// ARI REBIRTH
// File: AriFoodBeverageBrands2.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first miscellaneous grocery beverage expansion
//   for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 coverage:
//   - Simply lemonades / limeade
//   - Minute Maid lemonades / fruit drinks
//   - Vita Coco coconut waters
//   - Spindrift real-fruit sparkling waters
//   - LaCroix sparkling waters
//   - bubly sparkling waters
//   - Waterloo sparkling water
//   - Polar seltzer
//
// Records:
//   22
//
// Canonical basis:
//   100 mL.
//
// Design rule:
//   This module fills important grocery-store beverage
//   gaps without duplicating products owned by dedicated
//   soda, energy, sports, juice, coffee/tea, or water files.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodBeverageBrands2(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBeverageBrands2";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first miscellaneous grocery beverage expansion",
  "recordCount": 22,
  "brands": [
    "LaCroix",
    "Minute Maid",
    "Polar",
    "Simply",
    "Spindrift",
    "Vita Coco",
    "Waterloo",
    "bubly"
  ],
  "coverage": [
    "lemonades and limeade",
    "fruit drinks and punches",
    "coconut water",
    "real-fruit sparkling water",
    "zero-calorie flavored sparkling water"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official current manufacturer nutrition panels",
    "Current retailer package-label captures",
    "Manufacturer/brand-expert product claims only where they directly support a field"
  ],
  "rules": [
    "Preserve exact package or manufacturer label values in metadata.labelNutrition.",
    "Normalize label values mathematically to 100 mL.",
    "Keep lemonade, fruit drinks, coconut water, fruit sparkling water, and flavored sparkling water distinct.",
    "Track percentJuice only when the current product page or package explicitly publishes it.",
    "Do not infer caffeine values unless explicitly supported.",
    "Do not treat coconut water as plain water.",
    "Do not treat Spindrift as zero-calorie generic sparkling water because it contains real fruit juice/puree.",
    "Keep sugar-sweetened and zero-sugar lemonade formulations separate.",
    "Do not duplicate products already owned by the dedicated soda, energy, sports, juice, coffee/tea, or plain-water modules.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BEVERAGE_BRANDS_2_FOODS =
    [
  {
    "id": "beverage-brand2-simply-lemonade",
    "name": "Lemonade",
    "displayName": "Simply Lemonade",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Lemonade",
      "Simply regular lemonade"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "lemonade",
      "lemonade",
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
      "protein": 0.0,
      "carbs": 12.083,
      "fat": 0.0,
      "sugar": 11.25,
      "addedSugar": 11.25,
      "sodium": 8.333
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "lemonade",
      "productLine": "lemonade",
      "percentJuice": null,
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
        "carbs": 29,
        "fat": 0,
        "sugar": 27,
        "addedSugar": 27,
        "sodium": 20
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/simply/products/simply-lemonade",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, lemon juice, cane sugar, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-simply-raspberry-lemonade",
    "name": "Lemonade with Raspberry",
    "displayName": "Simply Lemonade with Raspberry",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Raspberry Lemonade",
      "Simply lemonade raspberry"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "lemonade",
      "raspberry-lemonade",
      "simply"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 45.83,
      "protein": 0.0,
      "carbs": 11.25,
      "fat": 0.0,
      "sugar": 10.417,
      "addedSugar": 10.417,
      "sodium": 6.25
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "lemonade",
      "productLine": "raspberry-lemonade",
      "percentJuice": null,
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
        "carbs": 27,
        "fat": 0,
        "sugar": 25,
        "addedSugar": 25,
        "sodium": 15
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/simply/products/simply-lemonade",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, cane sugar, lemon juice, raspberry puree, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-simply-blueberry-lemonade",
    "name": "Lemonade with Blueberry",
    "displayName": "Simply Lemonade with Blueberry",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Blueberry Lemonade",
      "Simply lemonade blueberry"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "lemonade",
      "blueberry-lemonade",
      "simply"
    ],
    "popularity": 97,
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
      "sugar": 10.833,
      "addedSugar": 10.833,
      "sodium": 6.25
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "lemonade",
      "productLine": "blueberry-lemonade",
      "percentJuice": null,
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
        "sugar": 26,
        "addedSugar": 26,
        "sodium": 15
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/simply/products/simply-lemonade",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, cane sugar, lemon juice, blueberry puree, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-simply-limeade",
    "name": "Limeade",
    "displayName": "Simply Limeade",
    "brand": "Simply",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Simply Limeade",
      "Simply lime juice drink"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "limeade",
      "limeade",
      "simply"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 50.0,
      "protein": 0.0,
      "carbs": 12.917,
      "fat": 0.0,
      "sugar": 11.667,
      "addedSugar": 11.667,
      "sodium": 6.25
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "limeade",
      "productLine": "limeade",
      "percentJuice": null,
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
        "carbs": 31,
        "fat": 0,
        "sugar": 28,
        "addedSugar": 28,
        "sodium": 15
      },
      "sourceProvenance": {
        "provider": "Simply",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/simply/products/simply-lemonade",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, lime juice, cane sugar, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-minute-maid-lemonade",
    "name": "Lemonade",
    "displayName": "Minute Maid Lemonade",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Lemonade",
      "Minute Maid regular lemonade"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "lemonade",
      "lemonade",
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
      "calories": 41.67,
      "protein": 0.0,
      "carbs": 12.083,
      "fat": 0.0,
      "sugar": 11.25,
      "addedSugar": 11.25,
      "sodium": 14.583
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "lemonade",
      "productLine": "lemonade",
      "percentJuice": 12,
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
        "sugar": 27,
        "addedSugar": 27,
        "sodium": 35
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/lemonades-and-fruit-drinks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, high fructose corn syrup, lemon juice from concentrate, natural flavors, citric acid, modified cornstarch, glycerol ester of rosin, preservatives, Yellow 5.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-minute-maid-pink-lemonade",
    "name": "Pink Lemonade",
    "displayName": "Minute Maid Pink Lemonade",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Pink Lemonade",
      "pink Minute Maid"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "lemonade",
      "pink-lemonade",
      "minute-maid"
    ],
    "popularity": 99,
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
      "sugar": 11.25,
      "addedSugar": 11.25,
      "sodium": 14.583
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "lemonade",
      "productLine": "pink-lemonade",
      "percentJuice": 13,
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
        "sugar": 27,
        "addedSugar": 27,
        "sodium": 35
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/lemonades-and-fruit-drinks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, high fructose corn syrup, lemon juice from concentrate, natural flavors, citric acid, modified cornstarch, glycerol ester of rosin, preservatives, Red 40.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-minute-maid-fruit-punch",
    "name": "Fruit Punch",
    "displayName": "Minute Maid Fruit Punch",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Fruit Punch",
      "Minute Maid punch"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "fruit-drink",
      "fruit-punch",
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
      "calories": 45.83,
      "protein": 0.0,
      "carbs": 12.5,
      "fat": 0.0,
      "sugar": 12.083,
      "addedSugar": 11.667,
      "sodium": 33.333
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "fruit-drink",
      "productLine": "fruit-punch",
      "percentJuice": 5,
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
        "carbs": 30,
        "fat": 0,
        "sugar": 29,
        "addedSugar": 28,
        "sodium": 80
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/lemonades-and-fruit-drinks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, high fructose corn syrup, pear, pineapple and orange juices from concentrate, passionfruit juice from concentrate, flavors, citric acid, sugar, stabilizers, preservatives and colors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-minute-maid-mango-punch",
    "name": "Mango Punch",
    "displayName": "Minute Maid Mango Punch",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Mango Punch",
      "Minute Maid Mango"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "fruit-drink",
      "mango-punch",
      "minute-maid"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 37.5,
      "protein": 0.0,
      "carbs": 10.417,
      "fat": 0.0,
      "sugar": 10.0,
      "addedSugar": 9.583,
      "sodium": 6.25
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "fruit-drink",
      "productLine": "mango-punch",
      "percentJuice": 5,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 90,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "sugar": 24,
        "addedSugar": 23,
        "sodium": 15
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/lemonades-and-fruit-drinks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, high fructose corn syrup, mango puree from concentrate, apple, pear and pineapple juices from concentrate, natural flavors, citric acid, sucralose, turmeric and vegetable juice for color.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-minute-maid-zero-sugar-lemonade",
    "name": "Zero Sugar Lemonade",
    "displayName": "Minute Maid Zero Sugar Lemonade",
    "brand": "Minute Maid",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Minute Maid Zero Lemonade",
      "Minute Maid Zero Sugar Lemonade"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "zero-sugar-lemonade",
      "zero-sugar-lemonade",
      "minute-maid"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.417,
      "fat": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 8.333,
      "potassium": 20.833
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "zero-sugar-lemonade",
      "productLine": "zero-sugar-lemonade",
      "percentJuice": 5,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 0,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 20,
        "potassium": 50
      },
      "sourceProvenance": {
        "provider": "Minute Maid",
        "sourceType": "official manufacturer current nutrition panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/minute-maid/products/zero-low-sugar-juice-drinks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pure filtered water, lemon juice from concentrate, natural flavors, citric acid, vitamin C, potassium citrate, stabilizers, aspartame, acesulfame potassium.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": "Uses the current zero/low-sugar product page rather than older package captures that showed a different calorie/sodium formulation."
    }
  },
  {
    "id": "beverage-brand2-vita-coco-original",
    "name": "Original Coconut Water",
    "displayName": "Vita Coco Original Coconut Water",
    "brand": "Vita Coco",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Vita Coco",
      "Vita Coco Original",
      "Vita Coco Coconut Water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "coconut-water",
      "original",
      "vita-coco"
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
      "protein": 0.0,
      "carbs": 4.583,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 4.167,
      "addedSugar": 0.417,
      "sodium": 20.833,
      "potassium": 195.833,
      "calcium": 12.083
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "coconut-water",
      "productLine": "original",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 45,
        "protein": 0,
        "carbs": 11,
        "fat": 0,
        "fiber": 0,
        "sugar": 10,
        "addedSugar": 1,
        "sodium": 50,
        "potassium": 470,
        "calcium": 29,
        "magnesium": 24
      },
      "sourceProvenance": {
        "provider": "Vita Coco",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-15024464",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Coconut water, less than 1% sugar, vitamin C (ascorbic acid).",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-vita-coco-pressed",
    "name": "Pressed Coconut Water",
    "displayName": "Vita Coco Pressed Coconut Water",
    "brand": "Vita Coco",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Vita Coco Pressed",
      "Vita Coco Pressed Coconut"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "coconut-water",
      "pressed",
      "vita-coco"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 25.0,
      "protein": 0.0,
      "carbs": 5.0,
      "fat": 0.417,
      "fiber": 0.0,
      "sugar": 4.167,
      "addedSugar": 0.417,
      "sodium": 43.75,
      "potassium": 195.833,
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "coconut-water",
      "productLine": "pressed",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 60,
        "protein": 0,
        "carbs": 12,
        "fat": 1,
        "fiber": 0,
        "sugar": 10,
        "addedSugar": 1,
        "sodium": 105,
        "potassium": 470,
        "calcium": 20,
        "magnesium": 20
      },
      "sourceProvenance": {
        "provider": "Vita Coco",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-53186919",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Coconut water from concentrate, coconut puree, less than 1% sugar, ascorbic acid, gellan gum.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-vita-coco-peach",
    "name": "Peach Coconut Water",
    "displayName": "Vita Coco Peach Coconut Water",
    "brand": "Vita Coco",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Vita Coco Peach",
      "Vita Coco Peach Coconut Water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "coconut-water",
      "peach",
      "vita-coco"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 25.0,
      "protein": 0.0,
      "carbs": 5.833,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.833,
      "addedSugar": 0.0,
      "sodium": 8.333,
      "potassium": 195.833,
      "calcium": 15.0
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "coconut-water",
      "productLine": "peach",
      "percentJuice": 100,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 60,
        "protein": 0,
        "carbs": 14,
        "fat": 0,
        "fiber": 0,
        "sugar": 14,
        "addedSugar": 0,
        "sodium": 20,
        "potassium": 470,
        "calcium": 36,
        "magnesium": 18
      },
      "sourceProvenance": {
        "provider": "Vita Coco",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-15421103",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Coconut water, mango puree, peach puree, ascorbic acid (vitamin C).",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-vita-coco-pineapple",
    "name": "Pineapple Coconut Water",
    "displayName": "Vita Coco Pineapple Coconut Water",
    "brand": "Vita Coco",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Vita Coco Pineapple",
      "Vita Coco Pineapple Coconut Water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "coconut-water",
      "pineapple",
      "vita-coco"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 25.0,
      "protein": 0.0,
      "carbs": 5.833,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 5.833,
      "addedSugar": 0.0,
      "sodium": 16.667,
      "potassium": 195.833,
      "calcium": 15.0
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "coconut-water",
      "productLine": "pineapple",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "8 fl oz (240 mL)",
        "servingMilliliters": 240,
        "calories": 60,
        "protein": 0,
        "carbs": 14,
        "fat": 0,
        "fiber": 0,
        "sugar": 14,
        "addedSugar": 0,
        "sodium": 40,
        "potassium": 470,
        "calcium": 36,
        "magnesium": 18
      },
      "sourceProvenance": {
        "provider": "Vita Coco",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-15421102",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Coconut water and pineapple flavor/juice blend as labeled.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-spindrift-lemon",
    "name": "Lemon Sparkling Water",
    "displayName": "Spindrift Lemon Sparkling Water",
    "brand": "Spindrift",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Spindrift Lemon",
      "Spindrift lemon seltzer"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "fruit-sparkling-water",
      "lemon",
      "spindrift"
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
      "carbs": 0.282,
      "fat": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "fruit-sparkling-water",
      "productLine": "lemon",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 3,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Spindrift",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://drinkspindrift.com/products/lemon-sparkling-water",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, lemon juice.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-spindrift-lime",
    "name": "Lime Sparkling Water",
    "displayName": "Spindrift Lime Sparkling Water",
    "brand": "Spindrift",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Spindrift Lime",
      "Spindrift lime seltzer"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "fruit-sparkling-water",
      "lime",
      "spindrift"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 1.13,
      "protein": 0.0,
      "carbs": 0.282,
      "fat": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "fruit-sparkling-water",
      "productLine": "lime",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 4,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Spindrift",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://drinkspindrift.com/products/lime-sparkling-water",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, lime juice, lime extract.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-spindrift-raspberry-lime",
    "name": "Raspberry Lime Sparkling Water",
    "displayName": "Spindrift Raspberry Lime Sparkling Water",
    "brand": "Spindrift",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Spindrift Raspberry Lime",
      "Spindrift raspberry"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "fruit-sparkling-water",
      "raspberry-lime",
      "spindrift"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 1.41,
      "protein": 0.0,
      "carbs": 0.282,
      "fat": 0.0,
      "sugar": 0.282,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "fruit-sparkling-water",
      "productLine": "raspberry-lime",
      "percentJuice": null,
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
        "carbs": 1,
        "fat": 0,
        "sugar": 1,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Spindrift",
        "sourceType": "official manufacturer nutrition panel",
        "sourceUrl": "https://drinkspindrift.com/products/raspberry-lime-sparkling-water",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, raspberry puree, lime juice.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-lacroix-pure",
    "name": "Pure Sparkling Water",
    "displayName": "LaCroix Pure Sparkling Water",
    "brand": "LaCroix",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "LaCroix Pure",
      "La Croix Pure",
      "LaCroix plain"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "pure",
      "lacroix"
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
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "pure",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 0,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "LaCroix",
        "sourceType": "current retailer package-label capture + brand caffeine-free claim",
        "sourceUrl": "https://www.target.com/p/-/A-17090152",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-lacroix-lime",
    "name": "Lime Sparkling Water",
    "displayName": "LaCroix Lime Sparkling Water",
    "brand": "LaCroix",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "LaCroix Lime",
      "La Croix Lime"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "lime",
      "lacroix"
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
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "lime",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 0
      },
      "sourceProvenance": {
        "provider": "LaCroix",
        "sourceType": "current retailer package-label capture + LaCroix brand-expert claim",
        "sourceUrl": "https://www.target.com/p/-/A-14915875",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, naturally essenced.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-bubly-lime",
    "name": "Lime Sparkling Water",
    "displayName": "bubly Lime Sparkling Water",
    "brand": "bubly",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "bubly Lime",
      "Bubly lime water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "lime",
      "bubly"
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
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0,
      "potassium": 0.0,
      "calcium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "lime",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0,
        "potassium": 0,
        "calcium": 0
      },
      "sourceProvenance": {
        "provider": "bubly",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-53081700",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-bubly-grapefruit",
    "name": "Grapefruit Sparkling Water",
    "displayName": "bubly Grapefruit Sparkling Water",
    "brand": "bubly",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "bubly Grapefruit",
      "Bubly grapefruit water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "grapefruit",
      "bubly"
    ],
    "popularity": 99,
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "grapefruit",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0
      },
      "sourceProvenance": {
        "provider": "bubly",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-53081697",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, natural flavor.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-waterloo-blackberry-lemonade",
    "name": "Blackberry Lemonade Sparkling Water",
    "displayName": "Waterloo Blackberry Lemonade Sparkling Water",
    "brand": "Waterloo",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Waterloo Blackberry Lemonade",
      "Waterloo blackberry"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "blackberry-lemonade",
      "waterloo"
    ],
    "popularity": 98,
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "blackberry-lemonade",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0
      },
      "sourceProvenance": {
        "provider": "Waterloo",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-84632377",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Purified carbonated water, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
      "notes": null
    }
  },
  {
    "id": "beverage-brand2-polar-lime-seltzer",
    "name": "Lime Seltzer",
    "displayName": "Polar Lime Seltzer",
    "brand": "Polar",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Polar Lime",
      "Polar Lime Seltzer Water"
    ],
    "tags": [
      "beverage",
      "branded",
      "beverage-expansion-2",
      "sparkling-water",
      "lime",
      "polar"
    ],
    "popularity": 97,
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0,
      "potassium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 can (12 fl oz / 355 mL)",
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
    "source": "AriFoodBeverageBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "sparkling-water",
      "productLine": "lime",
      "percentJuice": null,
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from package label",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0,
        "potassium": 0
      },
      "sourceProvenance": {
        "provider": "Polar",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-78365119",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated water, natural flavors.",
      "offlineReference": true,
      "normalizationMethod": "Current package-label values divided by the declared serving volume and normalized mathematically to ARI's canonical 100 mL beverage basis.",
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
      ARI_BEVERAGE_BRANDS_2_FOODS,
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
        ARI_BEVERAGE_BRANDS_2_FOODS.length,

      brandCount:
        new Set(
          ARI_BEVERAGE_BRANDS_2_FOODS.map(
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
      `Registration rejected ${registration.rejected} Beverage Brands 2 record(s).`,
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

  global.AriFoodBeverageBrands2 =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_BEVERAGE_BRANDS_2_FOODS.length;
      },

      getFoodIds() {
        return ARI_BEVERAGE_BRANDS_2_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_BEVERAGE_BRANDS_2_FOODS.map(
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

        return ARI_BEVERAGE_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getByBeverageType(beverageType) {
        const normalized =
          String(beverageType || "")
            .trim()
            .toLowerCase();

        return ARI_BEVERAGE_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.metadata?.beverageType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getCoconutWater() {
        return ARI_BEVERAGE_BRANDS_2_FOODS
          .filter(
            food =>
              food.metadata?.beverageType === "coconut-water"
          )
          .map(clone);
      },

      getSparklingWater() {
        return ARI_BEVERAGE_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.metadata?.beverageType || ""
              ).includes("sparkling-water")
          )
          .map(clone);
      },

      getLemonade() {
        return ARI_BEVERAGE_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.metadata?.beverageType || ""
              ).includes("lemonade")
          )
          .map(clone);
      },

      getZeroSugar() {
        return ARI_BEVERAGE_BRANDS_2_FOODS
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
          ARI_BEVERAGE_BRANDS_2_FOODS.find(
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
        "ari:food-beverage-brands-2-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_BEVERAGE_BRANDS_2_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BEVERAGE_BRANDS_2_FOODS.length} miscellaneous branded beverage records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
