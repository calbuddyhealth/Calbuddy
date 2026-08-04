// =====================================================
// ARI REBIRTH
// File: AriFoodBeerBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first beer database for ARI Nutrition's
//   Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// Coverage:
//   20 branded beers across major Mexican imports,
//   U.S. lagers/light lagers, European imports, stout,
//   wheat beer, and mainstream craft beer.
//
// Canonical basis:
//   100 mL.
//
// Alcohol tracking:
//   Actual ABV, grams pure alcohol per 12 fl oz, and
//   U.S. standard drinks per 12 fl oz.
//
// Strategy:
//   BRAND FIRST. Generic beer is fallback only.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1+
// =====================================================

(function initializeAriFoodBeerBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBeerBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first beer module for the Spirits pathway",
  "recordCount": 20,
  "brands": [
    "Blue Moon",
    "Bud Light",
    "Budweiser",
    "Coors Light",
    "Corona",
    "Dos Equis",
    "Guinness",
    "Heineken",
    "Michelob ULTRA",
    "Miller Lite",
    "Modelo",
    "Pacifico",
    "Sierra Nevada",
    "Stella Artois"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "standardDrink": {
    "country": "United States",
    "gramsPureAlcohol": 14,
    "provider": "NIAAA"
  },
  "sourceHierarchy": [
    "Official current U.S. brewery/manufacturer product nutrition page",
    "Official brewery product identity/ABV cross-checked to current package-label capture",
    "Current retailer package label or manufacturer-supplied retailer product data when the brewery site does not expose the full nutrition panel"
  ],
  "rules": [
    "Exact branded beer records outrank AriFoodSpiritsCore.",
    "Use the product actual ABV for alcohol grams and standard-drink calculations.",
    "Do not assume every 12 fl oz beer equals one standard drink.",
    "Preserve exact 12 fl oz calories/macros in metadata.labelNutrition.",
    "Normalize nutrition mathematically to 100 mL.",
    "Do not invent sodium, sugar, or other nutrients when a current label does not publish them.",
    "Keep light, regular, dark, wheat, stout, import, and craft formulations distinct.",
    "Different package sizes do not require duplicate records when formulation is unchanged.",
    "Cheladas, micheladas, hard seltzers, malt beverages, and canned cocktails belong in dedicated modules.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BEER_BRAND_FOODS =
    [
  {
    "id": "spirits-beer-modelo-especial",
    "name": "Especial",
    "displayName": "Modelo Especial",
    "brand": "Modelo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Modelo",
      "Modelo Especial",
      "Modelo beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "mexican-pilsner-lager",
      "modelo"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.28,
      "carbs": 3.831,
      "fat": 0.0,
      "alcohol": 3.472,
      "protein": 0.31,
      "sodium": 5.634,
      "potassium": 25.352
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "mexican-pilsner-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 143,
        "carbs": 13.6,
        "fat": 0,
        "abvPercent": 4.4,
        "protein": 1.1,
        "sodium": 20,
        "potassium": 90
      },
      "alcohol": {
        "abvPercent": 4.4,
        "proofApprox": 8.8,
        "alcoholGramsPerServing": 12.32,
        "standardDrinksPerServing": 0.88,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Modelo",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.modelousa.com/products/especial",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, non-malted cereals, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-modelo-negra",
    "name": "Negra",
    "displayName": "Modelo Negra",
    "brand": "Modelo",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Negra Modelo",
      "Modelo Negra",
      "Modelo dark beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "munich-dunkel-dark-lager",
      "modelo"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 48.45,
      "carbs": 4.423,
      "fat": 0.0,
      "alcohol": 4.261,
      "protein": 0.423,
      "sodium": 4.225,
      "potassium": 39.437
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "munich-dunkel-dark-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 172,
        "carbs": 15.7,
        "fat": 0,
        "abvPercent": 5.4,
        "protein": 1.5,
        "sodium": 15,
        "potassium": 140
      },
      "alcohol": {
        "abvPercent": 5.4,
        "proofApprox": 10.8,
        "alcoholGramsPerServing": 15.13,
        "standardDrinksPerServing": 1.08,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Modelo",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.modelousa.com/products/negra",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, non-malted cereals, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-pacifico-clara",
    "name": "Clara",
    "displayName": "Pacifico Clara",
    "brand": "Pacifico",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Pacifico",
      "Pacifico Clara",
      "Pacifico beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "mexican-lager",
      "pacifico"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.28,
      "carbs": 3.831,
      "fat": 0.0,
      "alcohol": 3.472,
      "protein": 0.31
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "mexican-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 143,
        "carbs": 13.6,
        "fat": 0,
        "abvPercent": 4.4,
        "protein": 1.1
      },
      "alcohol": {
        "abvPercent": 4.4,
        "proofApprox": 8.8,
        "alcoholGramsPerServing": 12.32,
        "standardDrinksPerServing": 0.88,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Pacifico",
        "sourceType": "official U.S. manufacturer product page",
        "sourceUrl": "https://www.discoverpacifico.com/pages/la-cerveza",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Barley, hops, water and lager brewing ingredients.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-corona-extra",
    "name": "Extra",
    "displayName": "Corona Extra",
    "brand": "Corona",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Corona",
      "Corona Extra",
      "regular Corona"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "mexican-lager",
      "corona"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 41.69,
      "carbs": 3.915,
      "fat": 0.0,
      "alcohol": 3.629,
      "protein": 0.338
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "mexican-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 148,
        "carbs": 13.9,
        "fat": 0,
        "abvPercent": 4.6,
        "protein": 1.2
      },
      "alcohol": {
        "abvPercent": 4.6,
        "proofApprox": 9.2,
        "alcoholGramsPerServing": 12.88,
        "standardDrinksPerServing": 0.92,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Corona",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.coronausa.com/pages/corona-extra",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, non-malted cereals, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-corona-light",
    "name": "Light",
    "displayName": "Corona Light",
    "brand": "Corona",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Corona Light",
      "light Corona"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "light-mexican-lager",
      "corona"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 27.89,
      "carbs": 1.352,
      "fat": 0.0,
      "alcohol": 3.156,
      "protein": 0.225
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "light-mexican-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 99,
        "carbs": 4.8,
        "fat": 0,
        "abvPercent": 4.0,
        "protein": 0.8
      },
      "alcohol": {
        "abvPercent": 4.0,
        "proofApprox": 8.0,
        "alcoholGramsPerServing": 11.2,
        "standardDrinksPerServing": 0.8,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Corona",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.coronausa.com/pages/corona-light",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, non-malted cereals, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-corona-premier",
    "name": "Premier",
    "displayName": "Corona Premier",
    "brand": "Corona",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Corona Premier",
      "Premier Corona"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "premium-light-mexican-lager",
      "corona"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 25.35,
      "carbs": 0.732,
      "fat": 0.0,
      "alcohol": 3.156,
      "protein": 0.197
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "premium-light-mexican-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 90,
        "carbs": 2.6,
        "fat": 0,
        "abvPercent": 4.0,
        "protein": 0.7
      },
      "alcohol": {
        "abvPercent": 4.0,
        "proofApprox": 8.0,
        "alcoholGramsPerServing": 11.2,
        "standardDrinksPerServing": 0.8,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Corona",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.coronausa.com/pages/corona-premier",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, non-malted cereals, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-dos-equis-lager-especial",
    "name": "Lager Especial",
    "displayName": "Dos Equis Lager Especial",
    "brand": "Dos Equis",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Dos Equis",
      "Dos Equis Lager",
      "XX Lager",
      "Dos XX"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "mexican-pilsner-lager",
      "dos-equis"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 36.9,
      "carbs": 3.099,
      "fat": 0.0,
      "alcohol": 3.314
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "mexican-pilsner-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 131,
        "carbs": 11,
        "fat": 0,
        "abvPercent": 4.2
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Dos Equis",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.dosequis.com/en-us/our-products/dos-equis-lager-especial/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-dos-equis-ambar-especial",
    "name": "Ambar Especial",
    "displayName": "Dos Equis Ambar Especial",
    "brand": "Dos Equis",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Dos Equis Amber",
      "Dos Equis Ambar",
      "XX Amber"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "vienna-amber-lager",
      "dos-equis"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.85,
      "carbs": 3.099,
      "fat": 0.0,
      "alcohol": 3.708
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "vienna-amber-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 145,
        "carbs": 11,
        "fat": 0,
        "abvPercent": 4.7
      },
      "alcohol": {
        "abvPercent": 4.7,
        "proofApprox": 9.4,
        "alcoholGramsPerServing": 13.16,
        "standardDrinksPerServing": 0.94,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Dos Equis",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.dosequis.com/en-us/our-products/dos-equis-ambar-especial/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-bud-light",
    "name": "American Light Lager",
    "displayName": "Bud Light American Light Lager",
    "brand": "Bud Light",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Bud Light",
      "Budlight",
      "BL beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-light-lager",
      "bud-light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 30.99,
      "carbs": 1.859,
      "fat": 0.0,
      "alcohol": 3.314,
      "protein": 0.282,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-light-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 110,
        "carbs": 6.6,
        "fat": 0,
        "abvPercent": 4.2,
        "protein": 1,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Bud Light",
        "sourceType": "current U.S. package-label capture / manufacturer-supplied retailer data",
        "sourceUrl": "https://www.target.com/p/-/A-13396457",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley, rice, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-budweiser",
    "name": "American Lager",
    "displayName": "Budweiser American Lager",
    "brand": "Budweiser",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Budweiser",
      "Bud",
      "Bud heavy",
      "Bud beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-lager",
      "budweiser"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.85,
      "carbs": 2.986,
      "fat": 0.0,
      "alcohol": 3.945,
      "protein": 0.366
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 145,
        "carbs": 10.6,
        "fat": 0,
        "abvPercent": 5.0,
        "protein": 1.3
      },
      "alcohol": {
        "abvPercent": 5.0,
        "proofApprox": 10.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Budweiser",
        "sourceType": "current retailer product data cross-checked to current package nutrition",
        "sourceUrl": "https://www.target.com/p/-/A-13396460",
        "verifiedAt": "2026-08-03",
        "secondarySourceUrl": "https://directionsforme.org/product/17560"
      },
      "ingredients": "Water, barley malt, rice, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-michelob-ultra",
    "name": "Superior Light Lager",
    "displayName": "Michelob ULTRA Superior Light Lager",
    "brand": "Michelob ULTRA",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Michelob Ultra",
      "Mich Ultra",
      "Ultra beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-light-lager",
      "michelob-ultra"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 26.76,
      "carbs": 0.732,
      "fat": 0.0,
      "alcohol": 3.314,
      "protein": 0.282
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-light-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 95,
        "carbs": 2.6,
        "fat": 0,
        "abvPercent": 4.2,
        "protein": 1
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Michelob ULTRA",
        "sourceType": "current U.S. package-label capture / manufacturer-supplied retailer data",
        "sourceUrl": "https://www.target.com/p/-/A-13392442",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley, hops, yeast.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-coors-light",
    "name": "Light Lager",
    "displayName": "Coors Light Light Lager",
    "brand": "Coors Light",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Coors Light",
      "Coors lite",
      "silver bullet"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-light-lager",
      "coors-light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 28.73,
      "carbs": 1.408,
      "fat": 0.0,
      "alcohol": 3.314
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-light-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 102,
        "carbs": 5,
        "fat": 0,
        "abvPercent": 4.2
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Coors Light",
        "sourceType": "official manufacturer nutrition page",
        "sourceUrl": "https://www.coorslight.com/en-US/our-beer",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, hop extract, lager yeast, corn syrup used in fermentation.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": "Official manufacturer reports protein as <1 g; ARI omits an exact protein value rather than inventing one."
    }
  },
  {
    "id": "spirits-beer-miller-lite",
    "name": "American Pilsner",
    "displayName": "Miller Lite American Pilsner",
    "brand": "Miller Lite",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Miller Lite",
      "Miller Light",
      "Miller beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-light-pilsner",
      "miller-lite"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 27.04,
      "carbs": 0.901,
      "fat": 0.0,
      "alcohol": 3.314,
      "protein": 0.282
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-light-pilsner",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 96,
        "carbs": 3.2,
        "fat": 0,
        "abvPercent": 4.2,
        "protein": 1
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Miller Lite",
        "sourceType": "official manufacturer macro panel cross-checked to current retail ABV/package label",
        "sourceUrl": "https://www.millerlite.com/",
        "verifiedAt": "2026-08-03",
        "secondarySourceUrl": "https://www.kroger.com/p/miller-lite-pilsner-beer-4-16-fl-oz-cans/0003410000158"
      },
      "ingredients": "Water, barley malt, corn syrup (dextrose used in fermentation), yeast, hops, hop extract.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-stella-artois",
    "name": "Premium Lager",
    "displayName": "Stella Artois Premium Lager",
    "brand": "Stella Artois",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Stella",
      "Stella Artois",
      "Stella beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "belgian-style-lager",
      "stella-artois"
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
      "carbs": 3.239,
      "fat": 0.0,
      "alcohol": 3.945,
      "protein": 0.507
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "belgian-style-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 150,
        "carbs": 11.5,
        "fat": 0,
        "abvPercent": 5.0,
        "protein": 1.8
      },
      "alcohol": {
        "abvPercent": 5.0,
        "proofApprox": 10.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Stella Artois",
        "sourceType": "current U.S. package-label capture / manufacturer-supplied retailer data",
        "sourceUrl": "https://www.target.com/p/-/A-50300447",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, barley malt, hops.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": "Current 2026 U.S. retail package data reports 5.0% ABV and 150 calories per 12 fl oz."
    }
  },
  {
    "id": "spirits-beer-heineken-original",
    "name": "Original",
    "displayName": "Heineken Original",
    "brand": "Heineken",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Heineken",
      "Heineken Original",
      "Heineken beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "european-pale-lager",
      "heineken"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 40.0,
      "carbs": 3.099,
      "fat": 0.0,
      "alcohol": 3.945,
      "protein": 0.563,
      "sugar": 0.0
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "european-pale-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 142,
        "carbs": 11,
        "fat": 0,
        "abvPercent": 5.0,
        "protein": 2,
        "sugar": 0
      },
      "alcohol": {
        "abvPercent": 5.0,
        "proofApprox": 10.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Heineken",
        "sourceType": "official U.S. manufacturer nutrition page",
        "sourceUrl": "https://www.heineken.com/us/en/our-beers/heineken-original",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, malted barley, hop extract, Heineken A-Yeast.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-heineken-light",
    "name": "Light",
    "displayName": "Heineken Light",
    "brand": "Heineken",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Heineken Light",
      "light Heineken"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "light-european-lager",
      "heineken"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 25.35,
      "carbs": 1.69,
      "fat": 0.0,
      "alcohol": 2.604
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "light-european-lager",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 90,
        "carbs": 6,
        "fat": 0,
        "abvPercent": 3.3
      },
      "alcohol": {
        "abvPercent": 3.3,
        "proofApprox": 6.6,
        "alcoholGramsPerServing": 9.24,
        "standardDrinksPerServing": 0.66,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Heineken",
        "sourceType": "official U.S. manufacturer beer portfolio nutrition data",
        "sourceUrl": "https://www.heineken.com/us/en/our-beers/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, malted barley, hops/hop extract, yeast.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-guinness-draught",
    "name": "Draught Stout",
    "displayName": "Guinness Draught Stout",
    "brand": "Guinness",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Guinness",
      "Guinness Draught",
      "Guinness stout"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "irish-dry-stout",
      "guinness"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 35.21,
      "carbs": 2.648,
      "fat": 0.0,
      "alcohol": 3.314
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "irish-dry-stout",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 125,
        "carbs": 9.4,
        "fat": 0,
        "abvPercent": 4.2
      },
      "alcohol": {
        "abvPercent": 4.2,
        "proofApprox": 8.4,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Guinness",
        "sourceType": "official U.S. manufacturer product nutrition page",
        "sourceUrl": "https://www.guinness.com/en-us/beers/guinness-draught",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Water, malted barley, barley, roasted barley, hops, nitrogen, yeast.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-blue-moon-belgian-white",
    "name": "Belgian White",
    "displayName": "Blue Moon Belgian White",
    "brand": "Blue Moon",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Blue Moon",
      "Blue Moon Belgian White",
      "Blue Moon beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "belgian-style-wheat-ale",
      "blue-moon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 47.32,
      "carbs": 3.972,
      "fat": 0.0,
      "alcohol": 4.261,
      "protein": 0.535
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "belgian-style-wheat-ale",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 168,
        "carbs": 14.1,
        "fat": 0,
        "abvPercent": 5.4,
        "protein": 1.9
      },
      "alcohol": {
        "abvPercent": 5.4,
        "proofApprox": 10.8,
        "alcoholGramsPerServing": 15.13,
        "standardDrinksPerServing": 1.08,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Blue Moon",
        "sourceType": "official manufacturer ABV/identity cross-checked to current package nutrition",
        "sourceUrl": "https://www.bluemoonbrewingcompany.com/en-US/beers/blue-moon-belgian-white",
        "verifiedAt": "2026-08-03",
        "secondarySourceUrl": "https://www.target.com/p/-/A-83371597"
      },
      "ingredients": "Water, barley malt, wheat, yeast, hop extracts, oats, orange peel, coriander.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-blue-moon-light",
    "name": "Light Citrus Wheat",
    "displayName": "Blue Moon Light Citrus Wheat",
    "brand": "Blue Moon",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Blue Moon Light",
      "Blue Moon LightSky",
      "Blue Moon citrus wheat"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "light-wheat-ale",
      "blue-moon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 26.76,
      "carbs": 1.014,
      "fat": 0.0,
      "alcohol": 3.156,
      "protein": 0.31
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "light-wheat-ale",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 95,
        "carbs": 3.6,
        "fat": 0,
        "abvPercent": 4.0,
        "protein": 1.1
      },
      "alcohol": {
        "abvPercent": 4.0,
        "proofApprox": 8.0,
        "alcoholGramsPerServing": 11.2,
        "standardDrinksPerServing": 0.8,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Blue Moon",
        "sourceType": "official manufacturer nutrition page",
        "sourceUrl": "https://www.bluemoonbrewingcompany.com/currently-available/blue-moon-light",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
      "notes": null
    }
  },
  {
    "id": "spirits-beer-sierra-nevada-pale-ale",
    "name": "Pale Ale",
    "displayName": "Sierra Nevada Pale Ale",
    "brand": "Sierra Nevada",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Sierra Nevada Pale Ale",
      "Sierra Pale Ale",
      "Sierra Nevada"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "beer",
      "branded",
      "american-pale-ale",
      "sierra-nevada"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "nutrition": {
      "calories": 49.3,
      "carbs": 4.028,
      "fat": 0.0,
      "alcohol": 4.418,
      "protein": 0.535
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz (355 mL)",
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
    "source": "AriFoodBeerBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "beerStyle": "american-pale-ale",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL normalized from current 12 fl oz product data",
      "labelNutrition": {
        "servingSize": "12 fl oz (355 mL)",
        "servingMilliliters": 355,
        "calories": 175,
        "carbs": 14.3,
        "fat": 0,
        "abvPercent": 5.6,
        "protein": 1.9
      },
      "alcohol": {
        "abvPercent": 5.6,
        "proofApprox": 11.2,
        "alcoholGramsPerServing": 15.69,
        "standardDrinksPerServing": 1.12,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
      },
      "sourceProvenance": {
        "provider": "Sierra Nevada",
        "sourceType": "official manufacturer stats and nutrition page",
        "sourceUrl": "https://sierranevada.com/brews/pale-ale",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Two-row pale and caramelized malts, Cascade hops, ale yeast, water.",
      "offlineReference": true,
      "normalizationMethod": "Current product calories/macros are normalized mathematically from the product's 12 fl oz reference serving to 100 mL. Pure alcohol grams are calculated from actual ABV using 0.789 g/mL ethanol; standard drinks use the U.S. 14 g definition.",
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
    if (!global.AriFoodSpirits) return false;
    if (typeof global.AriFoodSpirits.isExpectedModule === "function") {
      try { return global.AriFoodSpirits.isExpectedModule(MODULE_NAME); }
      catch (error) { return false; }
    }
    return true;
  }

  function reportFailure(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);
    if (global.AriFoodSpirits && controllerExpectsThisModule() && typeof global.AriFoodSpirits.markModuleFailed === "function") {
      global.AriFoodSpirits.markModuleFailed(MODULE_NAME, message, { version: VERSION, verifiedAt: VERIFIED_AT, ...metadata });
    }
  }

  const registry = global.AriFoodRegistry;
  if (!registry || typeof registry.registerMany !== "function") {
    reportFailure("AriFoodRegistry.registerMany() is unavailable.");
    return;
  }

  if (typeof registry.getBySource === "function" && typeof registry.remove === "function") {
    try {
      const existing = registry.getBySource(MODULE_NAME, { includeDisabled: true });
      if (Array.isArray(existing)) {
        for (const food of existing) { if (food && food.id) registry.remove(food.id); }
      }
    } catch (error) {
      console.warn(`[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`, error);
    }
  }

  const registration = registry.registerMany(ARI_BEER_BRAND_FOODS, { source: MODULE_NAME });

  const moduleResult = {
    registered: registration.registered || 0,
    replaced: registration.replaced || 0,
    rejected: registration.rejected || 0,
    duplicates: registration.duplicates || 0,
    metadata: {
      version: VERSION, verifiedAt: VERIFIED_AT, foodCount: ARI_BEER_BRAND_FOODS.length,
      brandCount: new Set(ARI_BEER_BRAND_FOODS.map(food => food.brand)).size,
      runtimeInternetRequired: false, brandFirst: true, alcoholTracked: true, standardDrinkBasisGrams: 14,
      canonicalBasis: { type: "volume", amount: 100, unit: "mL", milliliters: 100 },
      sourcePolicy: clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(`Registration rejected ${registration.rejected} beer-brand record(s).`, moduleResult.metadata);
  } else if (global.AriFoodSpirits && controllerExpectsThisModule() && typeof global.AriFoodSpirits.markModuleLoaded === "function") {
    global.AriFoodSpirits.markModuleLoaded(MODULE_NAME, moduleResult);
  }

  global.AriFoodBeerBrands = Object.freeze({
    VERSION, MODULE_NAME, VERIFIED_AT,
    count() { return ARI_BEER_BRAND_FOODS.length; },
    getFoodIds() { return ARI_BEER_BRAND_FOODS.map(food => food.id); },
    getBrands() { return Array.from(new Set(ARI_BEER_BRAND_FOODS.map(food => food.brand))); },
    getByBrand(brand) {
      const n=String(brand||"").trim().toLowerCase();
      return ARI_BEER_BRAND_FOODS.filter(food=>String(food.brand||"").toLowerCase()===n).map(clone);
    },
    getByStyle(style) {
      const n=String(style||"").trim().toLowerCase();
      return ARI_BEER_BRAND_FOODS.filter(food=>String(food.metadata?.beerStyle||"").toLowerCase()===n).map(clone);
    },
    getByAbvRange(minAbv=0,maxAbv=Infinity) {
      const min=Number(minAbv), max=Number(maxAbv);
      return ARI_BEER_BRAND_FOODS.filter(food=>{ const a=Number(food.metadata?.alcohol?.abvPercent); return Number.isFinite(a)&&a>=min&&a<=max; }).map(clone);
    },
    getLightBeers() { return ARI_BEER_BRAND_FOODS.filter(food=>String(food.metadata?.beerStyle||"").includes("light")).map(clone); },
    getStandardDrinks(foodId) {
      const r=ARI_BEER_BRAND_FOODS.find(food=>food.id===String(foodId||"").trim());
      return r ? Number(r.metadata?.alcohol?.standardDrinksPerServing) : null;
    },
    getAlcoholMetrics(foodId) {
      const r=ARI_BEER_BRAND_FOODS.find(food=>food.id===String(foodId||"").trim());
      return r ? clone(r.metadata?.alcohol) : null;
    },
    getRecord(foodId) {
      const r=ARI_BEER_BRAND_FOODS.find(food=>food.id===String(foodId||"").trim());
      return r ? clone(r) : null;
    },
    getSourcePolicy() { return clone(SOURCE_POLICY); },
    getRegistrationResult() { return clone(registration); }
  });

  try {
    global.dispatchEvent(new CustomEvent("ari:food-beer-brands-ready", { detail: { version: VERSION, module: MODULE_NAME, verifiedAt: VERIFIED_AT, foodCount: ARI_BEER_BRAND_FOODS.length, brandCount: moduleResult.metadata.brandCount, alcoholTracked: true, standardDrinkBasisGrams: 14, runtimeInternetRequired: false, registration: moduleResult } }));
  } catch (error) {}

  console.info(`[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BEER_BRAND_FOODS.length} branded beer records across ${moduleResult.metadata.brandCount} brands.`);

})(typeof window !== "undefined" ? window : globalThis);
