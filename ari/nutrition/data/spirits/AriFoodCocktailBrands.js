// =====================================================
// ARI REBIRTH
// File: AriFoodCocktailBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first bottled and multi-serve ready-to-serve
//   cocktail database for ARI Nutrition's Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// V1 brands:
//   - Jose Cuervo
//   - 1800
//   - Chi-Chi's
//   - On The Rocks
//
// Coverage:
//   17 branded cocktail products.
//
// Scope:
//   INCLUDED:
//   - Bottled ready-to-serve cocktails
//   - Multi-serve premixed cocktails
//
//   EXCLUDED:
//   - Single-serve canned cocktails
//     -> AriFoodCannedCocktailBrands
//   - Hard seltzers
//     -> AriFoodHardSeltzerBrands
//   - Malt beverages
//     -> AriFoodMaltBeverageBrands
//
// Canonical basis:
//   100 mL.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1.1+
// =====================================================

(function initializeAriFoodCocktailBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCocktailBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first bottled and multi-serve ready-to-serve cocktail module",
  "recordCount": 17,
  "brands": [
    "1800",
    "Chi-Chi's",
    "Jose Cuervo",
    "On The Rocks"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "scope": {
    "include": [
      "bottled ready-to-serve cocktails",
      "multi-serve premixed cocktails"
    ],
    "exclude": [
      "single-serve canned cocktails",
      "hard seltzers",
      "malt beverages",
      "straight liquor",
      "beer",
      "wine"
    ]
  },
  "rules": [
    "Canonical nutrition basis is 100 mL.",
    "Preserve the source/reference serving in metadata.labelNutrition.",
    "Preserve exact product ABV when available.",
    "Calculate pure alcohol grams from serving mL Ã ABV Ã 0.789 g/mL.",
    "Use 14 g pure alcohol for U.S. standard-drink metadata.",
    "Do not merge bottled multi-serve products with materially different canned formulations.",
    "Single-serve canned cocktail products belong in AriFoodCannedCocktailBrands.",
    "Hard seltzers belong in AriFoodHardSeltzerBrands.",
    "Malt beverages belong in AriFoodMaltBeverageBrands.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_COCKTAIL_BRAND_FOODS = Object.freeze(
[
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-classic-lime-margarita",
    "name": "Authentic Classic Lime Margarita",
    "displayName": "Jose Cuervo Authentic Classic Lime Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Classic Lime Margarita",
      "Jose Cuervo",
      "Authentic Classic Lime Margarita",
      "Jose Cuervo Classic Margarita",
      "Cuervo Classic Margarita",
      "Cuervo Lime Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "classic-lime"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 117.223,
      "protein": 0.0,
      "carbs": 16.456,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "classic-lime",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 52,
        "protein": 0,
        "carbs": 7.3,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/products/classic-margarita/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-classic-lime-margarita-995-alc/ojx0guD4Qqur6KCSqeGq_Q",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-golden-margarita",
    "name": "Golden Margarita",
    "displayName": "Jose Cuervo Golden Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Golden Margarita",
      "Jose Cuervo",
      "Golden Margarita",
      "Cuervo Golden Margarita",
      "Jose Cuervo Gold Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "golden-classic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 119.477,
      "protein": 0.0,
      "carbs": 13.526,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "golden-classic",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 53,
        "protein": 0,
        "carbs": 6.0,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 12.7,
        "alcoholGramsPerServing": 4.45,
        "standardDrinksPerServing": 0.32,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-golden-margarita-127-alc/rMrIQAg9QyG5e6Nls25ucw",
        "sourceType": "current market identity/ABV + nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-strawberry-margarita",
    "name": "Authentic Strawberry Margarita",
    "displayName": "Jose Cuervo Authentic Strawberry Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Strawberry Margarita",
      "Jose Cuervo",
      "Authentic Strawberry Margarita",
      "Jose Cuervo Strawberry Margarita",
      "Cuervo Strawberry Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "strawberry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 123.986,
      "protein": 0.0,
      "carbs": 18.26,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "strawberry",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 55,
        "protein": 0,
        "carbs": 8.1,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/products/strawberry-lime-margarita/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-strawberry-margarita-995-alc/K7_-XlSySE-gS8mEzqLITw",
        "sourceType": "manufacturer current strawberry margarita line + nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Manufacturer currently markets Strawberry Lime naming; nutrition reference uses Authentic Strawberry Margarita naming. Keep as a distinct frozen reference until a current Strawberry Lime package panel is captured."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-lime-light-margarita",
    "name": "Authentic Lime Light Margarita",
    "displayName": "Jose Cuervo Authentic Lime Light Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Lime Light Margarita",
      "Jose Cuervo",
      "Authentic Lime Light Margarita",
      "Jose Cuervo Light Margarita",
      "Cuervo Lime Light Margarita",
      "Cuervo Light Classic Lime"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "classic-lime-light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 78.9,
      "protein": 0.0,
      "carbs": 6.988,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "classic-lime-light",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 35,
        "protein": 0,
        "carbs": 3.1,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/products/light-margarita/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-lime-light-margarita-995-alc/npxOGMcNS1SA1Hd-FCrcTg",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-watermelon-margarita",
    "name": "Authentic Watermelon Margarita",
    "displayName": "Jose Cuervo Authentic Watermelon Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Watermelon Margarita",
      "Jose Cuervo",
      "Authentic Watermelon Margarita",
      "Jose Cuervo Watermelon Margarita",
      "Cuervo Watermelon Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "watermelon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 108.206,
      "protein": 0.0,
      "carbs": 14.878,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "watermelon",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 48,
        "protein": 0,
        "carbs": 6.6,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/products/watermelon-margarita/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-watermelon-margarita-995-alc/RskX8OdxR1aQ9OQwhC-DPw",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-mango-margarita",
    "name": "Authentic Mango Margarita",
    "displayName": "Jose Cuervo Authentic Mango Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Mango Margarita",
      "Jose Cuervo",
      "Authentic Mango Margarita",
      "Jose Cuervo Mango Margarita",
      "Cuervo Mango Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "mango"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 121.731,
      "protein": 0.0,
      "carbs": 16.907,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "mango",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 54,
        "protein": 0,
        "carbs": 7.5,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/products/mango-margarita/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-mango-margarita-995-alc/FLPwpyLmQdC6iaFgSr88JA",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-jose-cuervo-authentic-pomegranate-margarita",
    "name": "Authentic Pomegranate Margarita",
    "displayName": "Jose Cuervo Authentic Pomegranate Margarita",
    "brand": "Jose Cuervo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Jose Cuervo Authentic Pomegranate Margarita",
      "Jose Cuervo",
      "Authentic Pomegranate Margarita",
      "Jose Cuervo Pomegranate Margarita",
      "Cuervo Pomegranate Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "jose-cuervo",
      "margarita",
      "pomegranate"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 117.223,
      "protein": 0.0,
      "carbs": 16.907,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "pomegranate",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 52,
        "protein": 0,
        "carbs": 7.5,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 3.48,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://cuervo.com/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-cocktails-authentic-pomegranate-margarita-995-alc/XR3EsQhXSEShF9l4B0KrrQ",
        "sourceType": "nutrition database reference; market availability may vary",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Availability may vary by U.S. market. Keep independent from current core flavors."
    }
  },
  {
    "id": "spirits-cocktail-1800-ultimate-margarita-original",
    "name": "Ultimate Margarita Original",
    "displayName": "1800 The Ultimate Margarita Original",
    "brand": "1800",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "1800 The Ultimate Margarita Original",
      "1800",
      "Ultimate Margarita Original",
      "1800 Ultimate Margarita",
      "1800 Original Margarita",
      "1800 Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "1800",
      "margarita",
      "classic-lime"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 108.333,
      "protein": 0.0,
      "carbs": 27.5,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "4 fl oz",
        "amount": 4.058,
        "unit": "fl oz",
        "milliliters": 120,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "classic-lime",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "4 fl oz",
        "servingMilliliters": 120,
        "calories": 130,
        "protein": 0,
        "carbs": 33,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 9.42,
        "standardDrinksPerServing": 0.67,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.1800tequila.com/products/1800-original",
        "nutritionUrl": "https://sureketo.com/is-it-keto/1800-ultimate-margarita",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 120 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-1800-ultimate-mango-margarita",
    "name": "Ultimate Mango Margarita",
    "displayName": "1800 Ultimate Mango Margarita",
    "brand": "1800",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "1800 Ultimate Mango Margarita",
      "1800",
      "Ultimate Mango Margarita",
      "1800 Mango Margarita",
      "1800 Ultimate Mango"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "1800",
      "margarita",
      "mango"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 108.333,
      "protein": 0.0,
      "carbs": 27.5,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "4 fl oz",
        "amount": 4.058,
        "unit": "fl oz",
        "milliliters": 120,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "mango",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "4 fl oz",
        "servingMilliliters": 120,
        "calories": 130,
        "protein": 0,
        "carbs": 33,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 9.42,
        "standardDrinksPerServing": 0.67,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.1800tequila.com/products/margaritas-1800-mango",
        "nutritionUrl": "https://sureketo.com/is-it-keto/1800-ultimate-mango-margarita",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 120 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-1800-ultimate-pineapple-margarita",
    "name": "Ultimate Pineapple Margarita",
    "displayName": "1800 Ultimate Pineapple Margarita",
    "brand": "1800",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "1800 Ultimate Pineapple Margarita",
      "1800",
      "Ultimate Pineapple Margarita",
      "1800 Pineapple Margarita",
      "1800 Ultimate Pineapple"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "1800",
      "margarita",
      "pineapple"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 108.333,
      "protein": 0.0,
      "carbs": 27.5,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "4 fl oz",
        "amount": 4.058,
        "unit": "fl oz",
        "milliliters": 120,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "pineapple",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "4 fl oz",
        "servingMilliliters": 120,
        "calories": 130,
        "protein": 0,
        "carbs": 33,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 9.95,
        "alcoholGramsPerServing": 9.42,
        "standardDrinksPerServing": 0.67,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.1800tequila.com/products/1800-pineapple/",
        "nutritionUrl": "https://sureketo.com/is-it-keto/1800-ultimate-pineapple-margarita",
        "sourceType": "official manufacturer identity/ABV + current nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 120 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-chi-chis-original-margarita",
    "name": "Original Margarita",
    "displayName": "Chi-Chi's Original Margarita",
    "brand": "Chi-Chi's",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Chi-Chi's Original Margarita",
      "Chi-Chi's",
      "Original Margarita",
      "Chi Chis Original Margarita",
      "Chi-Chi's Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "chi-chi-s",
      "margarita",
      "classic-lime"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 123.986,
      "protein": 0.0,
      "carbs": 15.78,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "classic-lime",
      "alcoholBase": "prepared-cocktail",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 55,
        "protein": 0,
        "carbs": 7,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 10.0,
        "alcoholGramsPerServing": 3.5,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.instacart.com/categories/2-alcohol/56-spirits/5870-prepared-cocktails-and-novelties?brand=chi-chi-s",
        "nutritionUrl": "https://www.instacart.com/products/16951905-chi-chis-margarita-750-ml",
        "sourceType": "current retailer product listing and nutrition panel",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-chi-chis-long-island-iced-tea",
    "name": "Long Island Iced Tea",
    "displayName": "Chi-Chi's Long Island Iced Tea",
    "brand": "Chi-Chi's",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Chi-Chi's Long Island Iced Tea",
      "Chi-Chi's",
      "Long Island Iced Tea",
      "Chi Chis Long Island",
      "Chi-Chi's Long Island"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "chi-chi-s",
      "long-island-iced-tea",
      "classic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 123.986,
      "protein": 0.0,
      "carbs": 13.526,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "long-island-iced-tea",
      "flavor": "classic",
      "alcoholBase": "prepared-cocktail",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 55,
        "protein": 0,
        "carbs": 6,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 4.38,
        "standardDrinksPerServing": 0.31,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.instacart.com/categories/2-alcohol/56-spirits/5870-prepared-cocktails-and-novelties?brand=chi-chi-s",
        "nutritionUrl": "https://www.instacart.com/products/16951911-chi-chi-s-long-island-iced-tea-750-ml",
        "sourceType": "current retailer product listing and nutrition panel",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-chi-chis-mexican-mudslide",
    "name": "Mexican Mudslide",
    "displayName": "Chi-Chi's Mexican Mudslide",
    "brand": "Chi-Chi's",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Chi-Chi's Mexican Mudslide",
      "Chi-Chi's",
      "Mexican Mudslide",
      "Chi Chis Mudslide",
      "Chi-Chi's Mudslide"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "chi-chi-s",
      "mudslide",
      "chocolate-coffee-cream"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 293.057,
      "protein": 0.0,
      "carbs": 36.069,
      "fat": 6.763
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "mudslide",
      "flavor": "chocolate-coffee-cream",
      "alcoholBase": "prepared-cocktail",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 130,
        "protein": 0,
        "carbs": 16,
        "fat": 3
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 4.38,
        "standardDrinksPerServing": 0.31,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.instacart.com/categories/2-alcohol/56-spirits/5870-prepared-cocktails-and-novelties?brand=chi-chi-s",
        "nutritionUrl": "https://www.instacart.com/products/317952-chi-chis-mexican-mudslide-1-75-l",
        "sourceType": "current retailer product listing and nutrition panel",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-chi-chis-white-russian",
    "name": "White Russian",
    "displayName": "Chi-Chi's White Russian",
    "brand": "Chi-Chi's",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Chi-Chi's White Russian",
      "Chi-Chi's",
      "White Russian",
      "Chi Chis White Russian",
      "Chi-Chi's White Russian Cocktail"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "chi-chi-s",
      "white-russian",
      "coffee-cream"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 281.785,
      "protein": 0.0,
      "carbs": 33.814,
      "fat": 6.763
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "white-russian",
      "flavor": "coffee-cream",
      "alcoholBase": "prepared-cocktail",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 125,
        "protein": 0,
        "carbs": 15,
        "fat": 3
      },
      "alcohol": {
        "abvPercent": 12.5,
        "alcoholGramsPerServing": 4.38,
        "standardDrinksPerServing": 0.31,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.instacart.com/categories/2-alcohol/56-spirits/5870-prepared-cocktails-and-novelties?brand=chi-chi-s",
        "nutritionUrl": "https://www.instacart.com/products/3053167-chi-chis-white-russian-liqueur-1-75-l",
        "sourceType": "current retailer product listing and nutrition panel",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-chi-chis-mai-tai",
    "name": "Mai Tai",
    "displayName": "Chi-Chi's Mai Tai",
    "brand": "Chi-Chi's",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "Chi-Chi's Mai Tai",
      "Chi-Chi's",
      "Mai Tai",
      "Chi Chis Mai Tai",
      "Chi-Chi's Mai Tai Cocktail"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "chi-chi-s",
      "mai-tai",
      "tropical"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 112.714,
      "protein": 0.0,
      "carbs": 13.526,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "mai-tai",
      "flavor": "tropical",
      "alcoholBase": "prepared-cocktail",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 44.36,
        "calories": 50,
        "protein": 0,
        "carbs": 6,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 10.0,
        "alcoholGramsPerServing": 3.5,
        "standardDrinksPerServing": 0.25,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.instacart.com/categories/2-alcohol/56-spirits/5870-prepared-cocktails-and-novelties?brand=chi-chi-s",
        "nutritionUrl": "https://www.instacart.com/products/317950-chi-chis-mai-tai-1-75-l",
        "sourceType": "current retailer product listing and nutrition panel",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 44.36 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-on-the-rocks-margarita",
    "name": "Margarita",
    "displayName": "On The Rocks Margarita with Hornitos Plata Tequila",
    "brand": "On The Rocks",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "On The Rocks Margarita with Hornitos Plata Tequila",
      "On The Rocks",
      "Margarita",
      "OTR Margarita",
      "On The Rocks Margarita",
      "On The Rocks Hornitos Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "on-the-rocks",
      "margarita",
      "classic-lime"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 156.757,
      "protein": 0.0,
      "carbs": 12.162,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "2.5 fl oz",
        "amount": 2.502,
        "unit": "fl oz",
        "milliliters": 74,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "margarita",
      "flavor": "classic-lime",
      "alcoholBase": "tequila",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2.5 fl oz",
        "servingMilliliters": 74,
        "calories": 116,
        "protein": 0,
        "carbs": 9,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 20.0,
        "alcoholGramsPerServing": 11.68,
        "standardDrinksPerServing": 0.83,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.otrcocktails.com/ready-to-drink-cocktails/margarita-cocktail",
        "nutritionUrl": "https://www.mynetdiary.com/food/calories-in-the-margarita-with-hornitos-tequila-by-on-the-rocks-ml-52916799-0.html",
        "sourceType": "official manufacturer identity + current retailer ABV + nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 74 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
    }
  },
  {
    "id": "spirits-cocktail-on-the-rocks-old-fashioned",
    "name": "Old Fashioned",
    "displayName": "On The Rocks Old Fashioned with Knob Creek Bourbon",
    "brand": "On The Rocks",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "On The Rocks Old Fashioned with Knob Creek Bourbon",
      "On The Rocks",
      "Old Fashioned",
      "OTR Old Fashioned",
      "On The Rocks Old Fashioned",
      "On The Rocks Knob Creek Old Fashioned"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "cocktail",
      "ready-to-serve",
      "multi-serve",
      "branded",
      "on-the-rocks",
      "old-fashioned",
      "orange-bitters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 220.93,
      "protein": 0.0,
      "carbs": 2.326,
      "fat": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1.5 fl oz",
        "amount": 1.454,
        "unit": "fl oz",
        "milliliters": 43,
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
    "source": "AriFoodCocktailBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "cocktail",
      "cocktailType": "old-fashioned",
      "flavor": "orange-bitters",
      "alcoholBase": "bourbon-whiskey",
      "brandSpecific": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1.5 fl oz",
        "servingMilliliters": 43,
        "calories": 95,
        "protein": 0,
        "carbs": 1,
        "fat": 0
      },
      "alcohol": {
        "abvPercent": 35.0,
        "alcoholGramsPerServing": 11.87,
        "standardDrinksPerServing": 0.85,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.otrcocktails.com/ready-to-drink-cocktails/old-fashioned-cocktail",
        "nutritionUrl": "https://www.mynetdiary.com/food/calories-in-the-old-fashioned-premium-coktail-with-knob-creek-by-on-the-rocks-ml-37817147-0.html",
        "sourceType": "official manufacturer identity + current retailer ABV + nutrition database reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 43 mL was normalized mathematically to 100 mL.",
      "notes": "Bottled/multi-serve ready-to-serve cocktail. Single-serve canned cocktails belong in AriFoodCannedCocktailBrands."
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
    ARI_COCKTAIL_BRAND_FOODS,
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
      foodCount: ARI_COCKTAIL_BRAND_FOODS.length,

      brandCount: new Set(
        ARI_COCKTAIL_BRAND_FOODS.map(
          food => food.brand
        )
      ).size,

      cocktailTypes: Array.from(
        new Set(
          ARI_COCKTAIL_BRAND_FOODS.map(
            food => food.metadata?.cocktailType
          )
        )
      ),

      runtimeInternetRequired: false,
      brandFirst: true,
      alcoholTracked: true,
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
      `Registration rejected ${registration.rejected} cocktail-brand record(s).`,
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

  global.AriFoodCocktailBrands = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_COCKTAIL_BRAND_FOODS.length;
    },

    getFoodIds() {
      return ARI_COCKTAIL_BRAND_FOODS.map(
        food => food.id
      );
    },

    getBrands() {
      return Array.from(
        new Set(
          ARI_COCKTAIL_BRAND_FOODS.map(
            food => food.brand
          )
        )
      );
    },

    getCocktailTypes() {
      return Array.from(
        new Set(
          ARI_COCKTAIL_BRAND_FOODS.map(
            food => food.metadata?.cocktailType
          )
        )
      );
    },

    getByBrand(brand) {
      const normalized = normalizeText(brand);

      return ARI_COCKTAIL_BRAND_FOODS
        .filter(
          food =>
            normalizeText(food.brand) === normalized
        )
        .map(clone);
    },

    getByCocktailType(cocktailType) {
      const normalized =
        normalizeText(cocktailType);

      return ARI_COCKTAIL_BRAND_FOODS
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

      return ARI_COCKTAIL_BRAND_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.alcoholBase
            ) === normalized
        )
        .map(clone);
    },

    getRecord(foodId) {
      const normalized =
        String(foodId || "").trim();

      const record =
        ARI_COCKTAIL_BRAND_FOODS.find(
          food => food.id === normalized
        );

      return record ? clone(record) : null;
    },

    getAlcoholMetrics(foodId) {
      const record =
        ARI_COCKTAIL_BRAND_FOODS.find(
          food =>
            food.id ===
            String(foodId || "").trim()
        );

      return record
        ? clone(record.metadata?.alcohol)
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
        "ari:food-cocktail-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_COCKTAIL_BRAND_FOODS.length,
            brandCount:
              moduleResult.metadata.brandCount,
            alcoholTracked: true,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_COCKTAIL_BRAND_FOODS.length} branded bottled/multi-serve cocktail records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
