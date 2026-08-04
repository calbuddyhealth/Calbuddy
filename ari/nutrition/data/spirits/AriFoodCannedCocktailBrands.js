// =====================================================
// ARI REBIRTH
// File: AriFoodCannedCocktailBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first spirit-based canned cocktail database for
//   ARI Nutrition's Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// V1 brands:
//   - Cutwater
//   - Surfside
//
// Coverage:
//   20 branded canned RTD products.
//
// Includes:
//   - Tequila canned cocktails
//   - Vodka canned cocktails
//   - Rum canned cocktails
//   - Multi-spirit canned cocktails
//   - Vodka tea / lemonade RTDs
//
// Excludes:
//   - Hard seltzer
//     -> AriFoodHardSeltzerBrands
//   - Malt beverages / hard tea made from malt
//     -> AriFoodMaltBeverageBrands
//   - Bottled / multi-serve cocktails
//     -> AriFoodCocktailBrands
//
// Canonical basis:
//   100 mL.
//
// Default serving:
//   12 fl oz / 355 mL can.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1.1+
// =====================================================

(function initializeAriFoodCannedCocktailBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCannedCocktailBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first spirit-based canned ready-to-drink cocktail module",
  "recordCount": 20,
  "brands": [
    "Cutwater",
    "Surfside"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "defaultServing": {
    "label": "1 can (12 fl oz)",
    "amount": 12,
    "unit": "fl oz",
    "milliliters": 355
  },
  "scope": {
    "include": [
      "spirit-based single-serve canned cocktails",
      "vodka tea and lemonade canned RTDs",
      "tequila canned cocktails",
      "rum canned cocktails",
      "multi-spirit canned cocktails"
    ],
    "exclude": [
      "hard seltzers",
      "malt beverages",
      "beer",
      "wine",
      "straight liquor",
      "bottled or multi-serve cocktails"
    ]
  },
  "rules": [
    "Canonical nutrition basis is 100 mL.",
    "Default serving is one 12 fl oz / 355 mL can for V1 records.",
    "Preserve manufacturer can-level nutrition in metadata.labelNutrition.",
    "Preserve exact product or current product-line ABV.",
    "Calculate pure alcohol grams from serving mL Ã ABV Ã 0.789 g/mL.",
    "Use 14 g pure alcohol for U.S. standard-drink metadata.",
    "Hard seltzers belong in AriFoodHardSeltzerBrands.",
    "Malt beverages belong in AriFoodMaltBeverageBrands.",
    "Bottled/multi-serve cocktails belong in AriFoodCocktailBrands.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CANNED_COCKTAIL_BRAND_FOODS = Object.freeze(
[
  {
    "id": "spirits-canned-cocktail-cutwater-lime-margarita",
    "name": "Lime Margarita",
    "displayName": "Cutwater Lime Margarita",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Lime Margarita",
      "Cutwater",
      "Lime Margarita",
      "Cutwater Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "margarita",
      "lime",
      "tequila"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 101.408,
      "protein": 0.0,
      "carbs": 7.606,
      "fat": 0.0,
      "sugar": 7.606
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "margarita",
      "flavor": "lime",
      "alcoholBase": "tequila",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 360,
        "protein": 0,
        "carbs": 27,
        "fat": 0,
        "sugar": 27
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 35.01,
        "standardDrinksPerServing": 2.5,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/lime-margarita",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-spicy-mango-margarita",
    "name": "Spicy Mango Margarita",
    "displayName": "Cutwater Spicy Mango Margarita",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Spicy Mango Margarita",
      "Cutwater",
      "Spicy Mango Margarita",
      "Cutwater Spicy Mango",
      "Cutwater Mango Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "margarita",
      "spicy-mango",
      "tequila"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 97.465,
      "protein": 0.0,
      "carbs": 6.479,
      "fat": 0.0,
      "sugar": 6.197
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "margarita",
      "flavor": "spicy-mango",
      "alcoholBase": "tequila",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 346,
        "protein": 0,
        "carbs": 23,
        "fat": 0,
        "sugar": 22
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 35.01,
        "standardDrinksPerServing": 2.5,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/spicy-mango-margarita",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-peach-margarita",
    "name": "Peach Margarita",
    "displayName": "Cutwater Peach Margarita",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Peach Margarita",
      "Cutwater",
      "Peach Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "margarita",
      "peach",
      "tequila"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 83.099,
      "protein": 0.0,
      "carbs": 7.042,
      "fat": 0.0,
      "sugar": 6.761
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "margarita",
      "flavor": "peach",
      "alcoholBase": "tequila",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 295,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "sugar": 24
      },
      "alcohol": {
        "abvPercent": 10.0,
        "alcoholGramsPerServing": 28.01,
        "standardDrinksPerServing": 2.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/peach-margarita",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-tequila-paloma",
    "name": "Tequila Paloma",
    "displayName": "Cutwater Tequila Paloma",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Tequila Paloma",
      "Cutwater",
      "Tequila Paloma",
      "Cutwater Paloma"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "paloma",
      "grapefruit",
      "tequila"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 59.718,
      "protein": 0.0,
      "carbs": 4.789,
      "fat": 0.0,
      "sugar": 4.789
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "paloma",
      "flavor": "grapefruit",
      "alcoholBase": "tequila",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 212,
        "protein": 0,
        "carbs": 17,
        "fat": 0,
        "sugar": 17
      },
      "alcohol": {
        "abvPercent": 7.0,
        "alcoholGramsPerServing": 19.61,
        "standardDrinksPerServing": 1.4,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/tequila-paloma",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-vodka-transfusion",
    "name": "Vodka Transfusion",
    "displayName": "Cutwater Vodka Transfusion",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Vodka Transfusion",
      "Cutwater",
      "Vodka Transfusion",
      "Cutwater Transfusion"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "transfusion",
      "grape-ginger",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 57.746,
      "protein": 0.0,
      "carbs": 5.127,
      "fat": 0.0,
      "sugar": 5.07
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "transfusion",
      "flavor": "grape-ginger",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 205,
        "protein": 0,
        "carbs": 18.2,
        "fat": 0,
        "sugar": 18
      },
      "alcohol": {
        "abvPercent": 7.0,
        "alcoholGramsPerServing": 19.61,
        "standardDrinksPerServing": 1.4,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/vodka-transfusion",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-vodka-mule",
    "name": "Vodka Mule",
    "displayName": "Cutwater Vodka Mule",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Vodka Mule",
      "Cutwater",
      "Vodka Mule",
      "Cutwater Mule",
      "Cutwater Moscow Mule"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "moscow-mule",
      "ginger-lime",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 76.056,
      "protein": 0.0,
      "carbs": 6.761,
      "fat": 0.0,
      "sugar": 6.479
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "moscow-mule",
      "flavor": "ginger-lime",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 270,
        "protein": 0,
        "carbs": 24,
        "fat": 0,
        "sugar": 23
      },
      "alcohol": {
        "abvPercent": 7.0,
        "alcoholGramsPerServing": 19.61,
        "standardDrinksPerServing": 1.4,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/vodka-mule",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-tiki-rum-mai-tai",
    "name": "Tiki Rum Mai Tai",
    "displayName": "Cutwater Tiki Rum Mai Tai",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Tiki Rum Mai Tai",
      "Cutwater",
      "Tiki Rum Mai Tai",
      "Cutwater Mai Tai",
      "Cutwater Rum Mai Tai"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "mai-tai",
      "pineapple-coconut-citrus",
      "rum"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 98.592,
      "protein": 0.0,
      "carbs": 6.761,
      "fat": 0.0,
      "sugar": 6.761
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "mai-tai",
      "flavor": "pineapple-coconut-citrus",
      "alcoholBase": "rum",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 350,
        "protein": 0,
        "carbs": 24,
        "fat": 0,
        "sugar": 24
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 35.01,
        "standardDrinksPerServing": 2.5,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/tiki-rum-mai-tai",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-long-island-iced-tea",
    "name": "Long Island Iced Tea",
    "displayName": "Cutwater Long Island Iced Tea",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Long Island Iced Tea",
      "Cutwater",
      "Long Island Iced Tea",
      "Cutwater Long Island"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "long-island-iced-tea",
      "citrus-cola",
      "multiple-spirits"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 97.183,
      "protein": 0.0,
      "carbs": 5.634,
      "fat": 0.0,
      "sugar": 5.634
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "long-island-iced-tea",
      "flavor": "citrus-cola",
      "alcoholBase": "multiple-spirits",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 345,
        "protein": 0,
        "carbs": 20,
        "fat": 0,
        "sugar": 20
      },
      "alcohol": {
        "abvPercent": 13.0,
        "alcoholGramsPerServing": 36.41,
        "standardDrinksPerServing": 2.6,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/long-island-iced-tea",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-spicy-bloody-mary",
    "name": "Spicy Bloody Mary",
    "displayName": "Cutwater Spicy Bloody Mary",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Spicy Bloody Mary",
      "Cutwater",
      "Spicy Bloody Mary",
      "Cutwater Bloody Mary"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "bloody-mary",
      "spicy-tomato",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 71.831,
      "protein": 1.69,
      "carbs": 3.944,
      "fat": 0.0,
      "sugar": 2.535
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "bloody-mary",
      "flavor": "spicy-tomato",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 255,
        "protein": 6,
        "carbs": 14,
        "fat": 0,
        "sugar": 9
      },
      "alcohol": {
        "abvPercent": 10.0,
        "alcoholGramsPerServing": 28.01,
        "standardDrinksPerServing": 2.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/spicy-bloody-mary",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-cutwater-lemon-drop-martini",
    "name": "Lemon Drop Martini",
    "displayName": "Cutwater Lemon Drop Martini",
    "brand": "Cutwater",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Cutwater Lemon Drop Martini",
      "Cutwater",
      "Lemon Drop Martini",
      "Cutwater Lemon Drop",
      "Cutwater Lemon Martini"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "cutwater",
      "lemon-drop-martini",
      "lemon",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 83.944,
      "protein": 0.0,
      "carbs": 5.352,
      "fat": 0.0,
      "sugar": 5.352
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "lemon-drop-martini",
      "flavor": "lemon",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 298,
        "protein": 0,
        "carbs": 19,
        "fat": 0,
        "sugar": 19
      },
      "alcohol": {
        "abvPercent": 11.0,
        "alcoholGramsPerServing": 30.81,
        "standardDrinksPerServing": 2.2,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Cutwater",
        "sourceType": "official manufacturer product-level serving facts",
        "sourceUrl": "https://www.cutwaterspirits.com/canned-cocktails/lemon-drop-martini",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-iced-tea",
    "name": "Iced Tea + Vodka",
    "displayName": "Surfside Iced Tea + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Iced Tea + Vodka",
      "Surfside",
      "Iced Tea + Vodka",
      "Surfside Iced Tea",
      "Surfside Tea and Vodka"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-iced-tea",
      "iced-tea",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-iced-tea",
      "flavor": "iced-tea",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-peach-tea",
    "name": "Peach Tea + Vodka",
    "displayName": "Surfside Peach Tea + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Peach Tea + Vodka",
      "Surfside",
      "Peach Tea + Vodka",
      "Surfside Peach Tea",
      "Surfside Peach"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-iced-tea",
      "peach-tea",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-iced-tea",
      "flavor": "peach-tea",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/peach-tea-vodka/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-raspberry-tea",
    "name": "Raspberry Tea + Vodka",
    "displayName": "Surfside Raspberry Tea + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Raspberry Tea + Vodka",
      "Surfside",
      "Raspberry Tea + Vodka",
      "Surfside Raspberry Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-iced-tea",
      "raspberry-tea",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-iced-tea",
      "flavor": "raspberry-tea",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-green-tea",
    "name": "Green Tea + Vodka",
    "displayName": "Surfside Green Tea + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Green Tea + Vodka",
      "Surfside",
      "Green Tea + Vodka",
      "Surfside Green Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-green-tea",
      "green-tea",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-green-tea",
      "flavor": "green-tea",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-iced-tea-lemonade",
    "name": "Iced Tea & Lemonade + Vodka",
    "displayName": "Surfside Iced Tea & Lemonade + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Iced Tea & Lemonade + Vodka",
      "Surfside",
      "Iced Tea & Lemonade + Vodka",
      "Surfside Half & Half",
      "Surfside Iced Tea Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-half-and-half",
      "iced-tea-lemonade",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-half-and-half",
      "flavor": "iced-tea-lemonade",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/iced-tea-lemonade-vodka/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-lemonade",
    "name": "Lemonade + Vodka",
    "displayName": "Surfside Lemonade + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Lemonade + Vodka",
      "Surfside",
      "Lemonade + Vodka",
      "Surfside Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-lemonade",
      "lemonade",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-lemonade",
      "flavor": "lemonade",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-raspberry-lemonade",
    "name": "Raspberry Lemonade + Vodka",
    "displayName": "Surfside Raspberry Lemonade + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Raspberry Lemonade + Vodka",
      "Surfside",
      "Raspberry Lemonade + Vodka",
      "Surfside Raspberry Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-lemonade",
      "raspberry-lemonade",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-lemonade",
      "flavor": "raspberry-lemonade",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-strawberry-lemonade",
    "name": "Strawberry Lemonade + Vodka",
    "displayName": "Surfside Strawberry Lemonade + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Strawberry Lemonade + Vodka",
      "Surfside",
      "Strawberry Lemonade + Vodka",
      "Surfside Strawberry Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-lemonade",
      "strawberry-lemonade",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-lemonade",
      "flavor": "strawberry-lemonade",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-blueberry-lemonade",
    "name": "Blueberry Lemonade + Vodka",
    "displayName": "Surfside Blueberry Lemonade + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Blueberry Lemonade + Vodka",
      "Surfside",
      "Blueberry Lemonade + Vodka",
      "Surfside Blueberry Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-lemonade",
      "blueberry-lemonade",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-lemonade",
      "flavor": "blueberry-lemonade",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  },
  {
    "id": "spirits-canned-cocktail-surfside-raspberry-half-and-half",
    "name": "Raspberry Half & Half + Vodka",
    "displayName": "Surfside Raspberry Half & Half + Vodka",
    "brand": "Surfside",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-can",
    "aliases": [
      "Surfside Raspberry Half & Half + Vodka",
      "Surfside",
      "Raspberry Half & Half + Vodka",
      "Surfside Raspberry Half & Half"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "canned-cocktail",
      "ready-to-drink",
      "spirit-based",
      "branded",
      "surfside",
      "vodka-half-and-half",
      "raspberry-half-and-half",
      "vodka"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 0.845,
      "fat": 0.0,
      "sugar": 0.563
    },
    "servings": [
      {
        "id": "12-fl-oz-can",
        "label": "1 can (12 fl oz)",
        "amount": 12,
        "unit": "fl oz",
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
    "source": "AriFoodCannedCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "canned-cocktail",
      "cocktailType": "vodka-half-and-half",
      "flavor": "raspberry-half-and-half",
      "alcoholBase": "vodka",
      "packageFormat": "can",
      "brandSpecific": true,
      "spiritBased": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "355 mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Surfside",
        "sourceType": "official manufacturer current flavor identity + manufacturer line-wide serving facts",
        "sourceUrl": "https://www.drinksurfside.com/flavors/raspberry-half-half-vodka/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Current 12 fl oz / 355 mL can nutrition was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Spirit-based canned RTD. Do not merge with malt beverages, hard seltzers, or bottled/multi-serve cocktail records."
    }
  }
]
  );

  function clone(value) {
    try {
      return typeof structuredClone === "function"
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function controllerExpectsThisModule() {
    if (!global.AriFoodSpirits) {
      return false;
    }

    if (
      typeof global.AriFoodSpirits.isExpectedModule ===
      "function"
    ) {
      try {
        return global.AriFoodSpirits.isExpectedModule(
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
      global.AriFoodSpirits &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodSpirits.markModuleFailed ===
        "function"
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
    ARI_CANNED_COCKTAIL_BRAND_FOODS,
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

      foodCount:
        ARI_CANNED_COCKTAIL_BRAND_FOODS.length,

      brandCount: new Set(
        ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
          food => food.brand
        )
      ).size,

      brands: Array.from(
        new Set(
          ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
            food => food.brand
          )
        )
      ),

      cocktailTypes: Array.from(
        new Set(
          ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
            food => food.metadata?.cocktailType
          )
        )
      ),

      runtimeInternetRequired: false,
      brandFirst: true,
      alcoholTracked: true,
      spiritBased: true,

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

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} canned-cocktail record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSpirits &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodSpirits.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSpirits.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodCannedCocktailBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CANNED_COCKTAIL_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getCocktailTypes() {
        return Array.from(
          new Set(
            ARI_CANNED_COCKTAIL_BRAND_FOODS.map(
              food => food.metadata?.cocktailType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_CANNED_COCKTAIL_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) === normalized
          )
          .map(clone);
      },

      getByCocktailType(cocktailType) {
        const normalized =
          normalizeText(cocktailType);

        return ARI_CANNED_COCKTAIL_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.cocktailType
              ) === normalized
          )
          .map(clone);
      },

      getByAlcoholBase(alcoholBase) {
        const normalized =
          normalizeText(alcoholBase);

        return ARI_CANNED_COCKTAIL_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.alcoholBase
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_CANNED_COCKTAIL_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? clone(record)
          : null;
      },

      getAlcoholMetrics(foodId) {
        const record =
          ARI_CANNED_COCKTAIL_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? clone(record.metadata?.alcohol)
          : null;
      },

      getStandardDrinks(foodId) {
        const record =
          ARI_CANNED_COCKTAIL_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? Number(
              record.metadata
                ?.alcohol
                ?.standardDrinksPerServing
            )
          : null;
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
        "ari:food-canned-cocktail-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_CANNED_COCKTAIL_BRAND_FOODS.length,
            brandCount:
              moduleResult.metadata.brandCount,
            alcoholTracked: true,
            spiritBased: true,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CANNED_COCKTAIL_BRAND_FOODS.length} branded canned-cocktail records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
