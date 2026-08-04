// =====================================================
// ARI REBIRTH
// File: AriFoodMaltBeverageBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first flavored malt beverage database for
//   ARI Nutrition's Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// V1 brands:
//   - Mike's Hard
//   - Cayman Jack
//   - Twisted Tea
//   - Smirnoff Ice
//   - Seagram's Escapes
//
// Coverage:
//   20 branded malt-beverage records.
//
// Includes:
//   - Hard lemonade made from malt
//   - Hard iced tea made from malt
//   - Malt coolers
//   - Margarita-style malt beverages
//   - Other flavored malt beverages
//
// Excludes:
//   - Beer -> AriFoodBeerBrands
//   - Hard seltzer -> AriFoodHardSeltzerBrands
//   - Spirit-based canned cocktails
//     -> AriFoodCannedCocktailBrands
//   - Bottled/multi-serve cocktails
//     -> AriFoodCocktailBrands
//
// Canonical basis:
//   100 mL.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1.1+
// =====================================================

(function initializeAriFoodMaltBeverageBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodMaltBeverageBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first flavored malt beverage / hard tea / malt cooler module",
  "recordCount": 20,
  "brands": [
    "Cayman Jack",
    "Mike's Hard",
    "Seagram's Escapes",
    "Smirnoff Ice",
    "Twisted Tea"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "scope": {
    "include": [
      "flavored malt beverages",
      "hard lemonade made from malt",
      "hard iced tea made from malt",
      "malt coolers",
      "margarita-style malt beverages"
    ],
    "exclude": [
      "beer records already covered by AriFoodBeerBrands",
      "hard seltzers",
      "spirit-based canned cocktails",
      "bottled spirit-based cocktails",
      "straight liquor",
      "wine"
    ]
  },
  "excludedV1": {
    "Four Loko": "ABV varies by state/product configuration; avoid freezing a misleading single record without state-aware variants."
  },
  "rules": [
    "Canonical nutrition basis is 100 mL.",
    "Preserve source package nutrition in metadata.labelNutrition.",
    "Preserve exact product/line ABV when verified.",
    "Calculate pure alcohol grams from serving mL Ã ABV Ã 0.789 g/mL.",
    "Use 14 g pure alcohol for U.S. standard-drink metadata.",
    "Do not merge malt-based products with spirit-based RTDs solely because the flavor name resembles a cocktail.",
    "Do not duplicate beer, hard-seltzer, or canned-cocktail records owned by other Spirits modules.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_MALT_BEVERAGE_BRAND_FOODS = Object.freeze(
[
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-lemonade",
    "name": "Lemonade",
    "displayName": "Mike's Hard Zero Sugar Lemonade",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Lemonade",
      "Mike's Hard",
      "Lemonade",
      "Mike's Lemonade Zero Sugar",
      "Mikes Lemonade Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
      "lemonade"
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
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "lemonade",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-black-cherry",
    "name": "Black Cherry",
    "displayName": "Mike's Hard Zero Sugar Black Cherry",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Black Cherry",
      "Mike's Hard",
      "Black Cherry",
      "Mike's Black Cherry Zero Sugar",
      "Mikes Black Cherry Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
      "black-cherry"
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
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "black-cherry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-watermelon",
    "name": "Watermelon",
    "displayName": "Mike's Hard Zero Sugar Watermelon",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Watermelon",
      "Mike's Hard",
      "Watermelon",
      "Mike's Watermelon Zero Sugar",
      "Mikes Watermelon Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "watermelon",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-strawberry",
    "name": "Strawberry",
    "displayName": "Mike's Hard Zero Sugar Strawberry",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Strawberry",
      "Mike's Hard",
      "Strawberry",
      "Mike's Strawberry Zero Sugar",
      "Mikes Strawberry Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "strawberry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-mango",
    "name": "Mango",
    "displayName": "Mike's Hard Zero Sugar Mango",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Mango",
      "Mike's Hard",
      "Mango",
      "Mike's Mango Zero Sugar",
      "Mikes Mango Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "mango",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-mikes-hard-zero-sugar-tropical",
    "name": "Tropical",
    "displayName": "Mike's Hard Zero Sugar Tropical",
    "brand": "Mike's Hard",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Mike's Hard Zero Sugar Tropical",
      "Mike's Hard",
      "Tropical",
      "Mike's Tropical Zero Sugar",
      "Mikes Tropical Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "mike-s-hard",
      "hard-lemonade",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 3.662,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-lemonade",
      "flavor": "tropical",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.mikeshard.com/",
        "nutritionUrl": "https://www.mikeshard.com/",
        "sourceType": "official manufacturer current line nutrition + official manufacturer ABV FAQ",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-cayman-jack-zero-sugar-original-margarita",
    "name": "Zero Sugar  Margarita",
    "displayName": "Cayman Jack Zero Sugar Margarita",
    "brand": "Cayman Jack",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Cayman Jack Zero Sugar Margarita",
      "Cayman Jack",
      "Zero Sugar  Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "cayman-jack",
      "margarita-style-malt-beverage",
      "original"
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
      "carbs": 1.408,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "margarita-style-malt-beverage",
      "flavor": "original",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.caymanjack.com/flavors/zero-sugar-margarita/",
        "nutritionUrl": "https://www.caymanjack.com/flavors/zero-sugar-margarita/",
        "sourceType": "official manufacturer current product nutrition + current U.S. retail ABV cross-check",
        "nutritionScope": "manufacturer product-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-cayman-jack-zero-sugar-strawberry-margarita",
    "name": "Zero Sugar Strawberry Margarita",
    "displayName": "Cayman Jack Zero Sugar Strawberry Margarita",
    "brand": "Cayman Jack",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Cayman Jack Zero Sugar Strawberry Margarita",
      "Cayman Jack",
      "Zero Sugar Strawberry Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "cayman-jack",
      "margarita-style-malt-beverage",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 1.408,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "margarita-style-malt-beverage",
      "flavor": "strawberry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.caymanjack.com/flavors/zero-sugar-strawberry-margarita/",
        "nutritionUrl": "https://www.caymanjack.com/flavors/zero-sugar-strawberry-margarita/",
        "sourceType": "official manufacturer current product nutrition + current U.S. retail ABV cross-check",
        "nutritionScope": "manufacturer product-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-cayman-jack-zero-sugar-mango-margarita",
    "name": "Zero Sugar Mango Margarita",
    "displayName": "Cayman Jack Zero Sugar Mango Margarita",
    "brand": "Cayman Jack",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Cayman Jack Zero Sugar Mango Margarita",
      "Cayman Jack",
      "Zero Sugar Mango Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "cayman-jack",
      "margarita-style-malt-beverage",
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
      "calories": 28.169,
      "protein": 0.0,
      "carbs": 1.408,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "margarita-style-malt-beverage",
      "flavor": "mango",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.caymanjack.com/flavors/zero-sugar-mango-margarita/",
        "nutritionUrl": "https://www.caymanjack.com/flavors/zero-sugar-mango-margarita/",
        "sourceType": "official manufacturer current product nutrition + current U.S. retail ABV cross-check",
        "nutritionScope": "manufacturer product-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-cayman-jack-zero-sugar-passionfruit-margarita",
    "name": "Zero Sugar Passionfruit Margarita",
    "displayName": "Cayman Jack Zero Sugar Passionfruit Margarita",
    "brand": "Cayman Jack",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Cayman Jack Zero Sugar Passionfruit Margarita",
      "Cayman Jack",
      "Zero Sugar Passionfruit Margarita"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "cayman-jack",
      "margarita-style-malt-beverage",
      "passionfruit"
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
      "carbs": 1.408,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "margarita-style-malt-beverage",
      "flavor": "passionfruit",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.8,
        "alcoholGramsPerServing": 13.44,
        "standardDrinksPerServing": 0.96,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.caymanjack.com/flavors/zero-sugar-passionfruit-margarita/",
        "nutritionUrl": "https://www.caymanjack.com/flavors/zero-sugar-passionfruit-margarita/",
        "sourceType": "official manufacturer current product nutrition + current U.S. retail ABV cross-check",
        "nutritionScope": "manufacturer product-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-original",
    "name": "Original",
    "displayName": "Twisted Tea Original",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Original",
      "Twisted Tea",
      "Original",
      "Original Twisted Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "original"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 54.648,
      "protein": 0.0,
      "carbs": 7.296,
      "fat": 0.0,
      "sugar": 6.563
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "original",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 194,
        "protein": 0,
        "carbs": 25.9,
        "fat": 0,
        "sugar": 23.3
      },
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/products/",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-original-hard-iced-tea-5-alc/uGdL1qkTRfGjSGSa3usFuQ",
        "sourceType": "official manufacturer current product line/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-half-and-half",
    "name": "Half & Half",
    "displayName": "Twisted Tea Half & Half",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Half & Half",
      "Twisted Tea",
      "Half & Half",
      "Twisted Tea Half and Half",
      "Twisted Tea Lemonade"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "half-and-half"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 60.563,
      "protein": 0.0,
      "carbs": 8.592,
      "fat": 0.0,
      "sugar": 7.493
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "half-and-half",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 215,
        "protein": 0,
        "carbs": 30.5,
        "fat": 0,
        "sugar": 26.6
      },
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/products/twisted-tea-half-and-half",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-half-half-hard-iced-tea-5-alc/aVFhbNJ6TxW9cXwnpMIUHA",
        "sourceType": "official manufacturer current product/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-peach",
    "name": "Peach",
    "displayName": "Twisted Tea Peach",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Peach",
      "Twisted Tea",
      "Peach",
      "Peach Twisted Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "peach"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 61.972,
      "protein": 0.0,
      "carbs": 8.93,
      "fat": 0.0,
      "sugar": 7.972
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "peach",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 220,
        "protein": 0,
        "carbs": 31.7,
        "fat": 0,
        "sugar": 28.3
      },
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/products/twisted-tea-peach",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-peach-hard-iced-tea-5-alc/eJ-4C2cKSya6HKCAIQlSWQ",
        "sourceType": "official manufacturer current product/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-raspberry",
    "name": "Raspberry",
    "displayName": "Twisted Tea Raspberry",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Raspberry",
      "Twisted Tea",
      "Raspberry",
      "Raspberry Twisted Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "raspberry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 58.873,
      "protein": 0.0,
      "carbs": 8.197,
      "fat": 0.0,
      "sugar": 7.352
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "raspberry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 209,
        "protein": 0,
        "carbs": 29.1,
        "fat": 0,
        "sugar": 26.1
      },
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/products/twisted-tea-raspberry",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-raspberry-hard-iced-tea-5-alc/G36zZlEBRXeu5LDlutQWUg",
        "sourceType": "official manufacturer current product/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-light",
    "name": "Light",
    "displayName": "Twisted Tea Light",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Light",
      "Twisted Tea",
      "Light",
      "Light Twisted Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 30.704,
      "protein": 0.0,
      "carbs": 2.479,
      "fat": 0.0,
      "sugar": 1.746
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "light",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 109,
        "protein": 0,
        "carbs": 8.8,
        "fat": 0,
        "sugar": 6.2
      },
      "alcohol": {
        "abvPercent": 4.0,
        "alcoholGramsPerServing": 11.2,
        "standardDrinksPerServing": 0.8,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/products/twisted-tea-light",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-light-hard-iced-tea-4-alc/7tnV-5yYQby32kHytBjbXQ",
        "sourceType": "official manufacturer current product/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-twisted-tea-blueberry",
    "name": "Blueberry",
    "displayName": "Twisted Tea Blueberry",
    "brand": "Twisted Tea",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Twisted Tea Blueberry",
      "Twisted Tea",
      "Blueberry",
      "Blueberry Twisted Tea"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "twisted-tea",
      "hard-iced-tea",
      "blueberry"
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
      "carbs": 7.944,
      "fat": 0.0,
      "sugar": 6.648
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle/can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "hard-iced-tea",
      "flavor": "blueberry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 bottle/can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 205,
        "protein": 0,
        "carbs": 28.2,
        "fat": 0,
        "sugar": 23.6
      },
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.twistedtea.com/contact-us",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-ciders-twisted-tea-blueberry-hard-iced-tea-5-alc/yfIJiqgWRle5XFGpKi95qg",
        "sourceType": "official manufacturer current style list + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-smirnoff-ice-zero-sugar-original",
    "name": "Ice Zero Sugar Original",
    "displayName": "Smirnoff Ice Zero Sugar Original",
    "brand": "Smirnoff Ice",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Smirnoff Ice Zero Sugar Original",
      "Smirnoff Ice",
      "Ice Zero Sugar Original",
      "Smirnoff Ice Original Zero Sugar",
      "Smirnoff Zero Sugar Original"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "smirnoff-ice",
      "flavored-malt-beverage",
      "original-lemon-lime"
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
      "carbs": 0.704,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "flavored-malt-beverage",
      "flavor": "original-lemon-lime",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 2.5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.smirnoff.com/en-us/products/ready-to-drink/smirnoff-ice-original-zero-sugar-6pk",
        "nutritionUrl": "https://www.smirnoff.com/en-us/products/ready-to-drink/smirnoff-ice-original-zero-sugar-6pk",
        "sourceType": "official manufacturer current product nutrition + current U.S. retailer ABV cross-check",
        "nutritionScope": "manufacturer product-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-smirnoff-ice-zero-sugar-red-white-berry",
    "name": "Ice Zero Sugar Red, White & Berry",
    "displayName": "Smirnoff Ice Zero Sugar Red, White & Berry",
    "brand": "Smirnoff Ice",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Smirnoff Ice Zero Sugar Red, White & Berry",
      "Smirnoff Ice",
      "Ice Zero Sugar Red, White & Berry",
      "Smirnoff Red White Berry Zero Sugar",
      "Smirnoff Ice RWB Zero Sugar"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "smirnoff-ice",
      "flavored-malt-beverage",
      "red-white-and-berry"
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
      "carbs": 0.704,
      "fat": 0.0,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 can (12 fl oz)",
        "amount": 12.004,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "flavored-malt-beverage",
      "flavor": "red-white-and-berry",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 can (12 fl oz)",
        "servingMilliliters": 355,
        "calories": 100,
        "protein": 0,
        "carbs": 2.5,
        "fat": 0,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.5,
        "alcoholGramsPerServing": 12.6,
        "standardDrinksPerServing": 0.9,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.smirnoff.com/en-us/products/ready-to-drink/smirnoff-ice-rwb-zero-sugar-can-12-pk",
        "nutritionUrl": "https://www.smirnoff.com/en-us/products/ready-to-drink/smirnoff-ice-zero-sugar-variety-pack",
        "sourceType": "official manufacturer current zero-sugar line nutrition + current U.S. retailer ABV cross-check",
        "nutritionScope": "manufacturer line-level",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 355 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-seagrams-escapes-jamaican-me-happy",
    "name": "Jamaican Me Happy",
    "displayName": "Seagram's Escapes Jamaican Me Happy",
    "brand": "Seagram's Escapes",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Seagram's Escapes Jamaican Me Happy",
      "Seagram's Escapes",
      "Jamaican Me Happy",
      "Seagrams Jamaican Me Happy",
      "Jamaican Me Happy Seagrams"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "seagram-s-escapes",
      "malt-cooler",
      "jamaican-me-happy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 61.329,
      "protein": 0.0,
      "carbs": 10.876,
      "fat": 0.0,
      "sugar": 6.798
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle (11.2 fl oz)",
        "amount": 11.192,
        "unit": "fl oz",
        "milliliters": 331,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "malt-cooler",
      "flavor": "jamaican-me-happy",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle (11.2 fl oz)",
        "servingMilliliters": 331,
        "calories": 203,
        "protein": 0,
        "carbs": 36,
        "fat": 0,
        "sugar": 22.5
      },
      "alcohol": {
        "abvPercent": 3.2,
        "alcoholGramsPerServing": 8.36,
        "standardDrinksPerServing": 0.6,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.seagramsescapes.com/seagrams-escapes",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-alcoholic-sodas-coolers-jamaican-me-happy-malt-cooler-32-alc/KSB-6dDAQ0qqDcch3AqALg",
        "sourceType": "official manufacturer current lineup/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 331 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
    }
  },
  {
    "id": "spirits-malt-seagrams-escapes-strawberry-daiquiri",
    "name": "Strawberry Daiquiri",
    "displayName": "Seagram's Escapes Strawberry Daiquiri",
    "brand": "Seagram's Escapes",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Seagram's Escapes Strawberry Daiquiri",
      "Seagram's Escapes",
      "Strawberry Daiquiri",
      "Seagrams Strawberry Daiquiri",
      "Strawberry Daiquiri Seagrams"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "malt-beverage",
      "ready-to-drink",
      "branded",
      "seagram-s-escapes",
      "malt-cooler",
      "strawberry-daiquiri"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 67.674,
      "protein": 0.0,
      "carbs": 12.387,
      "fat": 0.0,
      "sugar": 8.459
    },
    "servings": [
      {
        "id": "package-serving",
        "label": "1 bottle (11.2 fl oz)",
        "amount": 11.192,
        "unit": "fl oz",
        "milliliters": 331,
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
    "source": "AriFoodMaltBeverageBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "malt-beverage",
      "maltStyle": "malt-cooler",
      "flavor": "strawberry-daiquiri",
      "alcoholBase": "malt-fermented",
      "brandSpecific": true,
      "abvVerified": true,
      "nutritionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 bottle (11.2 fl oz)",
        "servingMilliliters": 331,
        "calories": 224,
        "protein": 0,
        "carbs": 41,
        "fat": 0,
        "sugar": 28
      },
      "alcohol": {
        "abvPercent": 3.2,
        "alcoholGramsPerServing": 8.36,
        "standardDrinksPerServing": 0.6,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "identityUrl": "https://www.seagramsescapes.com/seagrams-escapes",
        "nutritionUrl": "https://www.calorieking.com/us/en/foods/f/calories-in-alcoholic-sodas-coolers-strawberry-daiquiri-malt-cooler-32-alc/jsjDAaz3QM2hrLuePSHlqQ",
        "sourceType": "official manufacturer current lineup/ABV + current nutrition database",
        "nutritionScope": "product-level reference",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Reference nutrition for 331 mL was normalized mathematically to the ARI Spirits canonical basis of 100 mL.",
      "notes": "Flavored malt beverage record. Spirit-based canned cocktails belong in AriFoodCannedCocktailBrands; hard seltzers belong in AriFoodHardSeltzerBrands."
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
    ARI_MALT_BEVERAGE_BRAND_FOODS,
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
        ARI_MALT_BEVERAGE_BRAND_FOODS.length,

      brandCount: new Set(
        ARI_MALT_BEVERAGE_BRAND_FOODS.map(
          food => food.brand
        )
      ).size,

      brands: Array.from(
        new Set(
          ARI_MALT_BEVERAGE_BRAND_FOODS.map(
            food => food.brand
          )
        )
      ),

      maltStyles: Array.from(
        new Set(
          ARI_MALT_BEVERAGE_BRAND_FOODS.map(
            food => food.metadata?.maltStyle
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
      `Registration rejected ${registration.rejected} malt-beverage record(s).`,
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

  global.AriFoodMaltBeverageBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_MALT_BEVERAGE_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_MALT_BEVERAGE_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_MALT_BEVERAGE_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getMaltStyles() {
        return Array.from(
          new Set(
            ARI_MALT_BEVERAGE_BRAND_FOODS.map(
              food => food.metadata?.maltStyle
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized = normalizeText(brand);

        return ARI_MALT_BEVERAGE_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) === normalized
          )
          .map(clone);
      },

      getByMaltStyle(maltStyle) {
        const normalized =
          normalizeText(maltStyle);

        return ARI_MALT_BEVERAGE_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.maltStyle
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_MALT_BEVERAGE_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record ? clone(record) : null;
      },

      getAlcoholMetrics(foodId) {
        const record =
          ARI_MALT_BEVERAGE_BRAND_FOODS.find(
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
          ARI_MALT_BEVERAGE_BRAND_FOODS.find(
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
        "ari:food-malt-beverage-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_MALT_BEVERAGE_BRAND_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_MALT_BEVERAGE_BRAND_FOODS.length} branded malt-beverage records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
