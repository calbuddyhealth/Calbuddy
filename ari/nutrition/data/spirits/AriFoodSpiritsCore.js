// =====================================================
// ARI REBIRTH
// File: AriFoodSpiritsCore.js
// Version: 1.0.0
//
// Purpose:
//   Minimal generic fallback records for ARI Nutrition's
//   brand-first Spirits pathway.
//
// Pathway:
//   ari/nutrition/data/spirits/
//
// Records:
//   - Beer — Regular, 5% ABV
//   - Beer — Light, 4.2% ABV
//   - Wine — Red Table, 12% ABV
//   - Wine — White Table, 12% ABV
//   - Distilled Spirits — 80 Proof, 40% ABV
//
// Strategy:
//   BRAND FIRST.
//
//   These five records are emergency/generic fallbacks.
//   Exact branded beer, wine, liquor, hard seltzer,
//   canned cocktail, malt beverage, etc. should always
//   outrank this module when available.
//
// Canonical basis:
//   100 mL.
//
// Standard drink:
//   ARI uses the U.S. NIAAA definition:
//     1 standard drink = 14 g pure alcohol.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1+
// =====================================================

(function initializeAriFoodSpiritsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSpiritsCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "minimal generic fallback layer for a brand-first Spirits pathway",
  "recordCount": 5,
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "standardDrink": {
    "country": "United States",
    "gramsPureAlcohol": 14,
    "source": "NIAAA",
    "examples": {
      "regularBeer": "12 fl oz at about 5% ABV",
      "tableWine": "5 fl oz at about 12% ABV",
      "distilledSpirits": "1.5 fl oz at about 40% ABV"
    }
  },
  "sourceHierarchy": [
    "USDA FoodData Central SR Legacy for generic nutrition",
    "NIAAA for U.S. standard-drink definition and representative ABV/serving examples",
    "Exact manufacturer/brewery/winery/distillery data must override these generic fallbacks"
  ],
  "rules": [
    "Spirits is brand-first; these generic records are fallback only.",
    "Canonical nutrition basis is 100 mL.",
    "Preserve original USDA per-100-g nutrition in metadata.sourceNutritionPer100g.",
    "Document approximate density used for weight-to-volume normalization.",
    "Calculate alcohol grams from serving volume and ABV, not from calorie subtraction.",
    "Use 14 g pure alcohol as the U.S. standard-drink denominator.",
    "Do not assume every beer is 5%, every wine is 12%, or every liquor is 40%.",
    "Do not use the generic distilled record for liqueurs, flavored spirits, cream liqueurs, premixed cocktails, or products with added carbohydrate unless no better fallback exists.",
    "Exact branded alcohol records outrank Spirits Core.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SPIRITS_CORE_FOODS =
    [
  {
    "id": "spirits-core-beer-regular-5pct",
    "name": "Beer",
    "displayName": "Beer — Regular, 5% ABV",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "beer",
      "regular beer",
      "lager",
      "ale",
      "5 percent beer",
      "5% beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "alcoholic-drink",
      "fallback",
      "beer"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 101.0
    },
    "nutrition": {
      "calories": 43.43,
      "protein": 0.465,
      "carbs": 3.585,
      "fat": 0.0,
      "fiber": 0.0,
      "caffeine": 0.0,
      "alcohol": 3.939
    },
    "servings": [
      {
        "id": "default-serving",
        "label": "12 fl oz beer",
        "amount": 12,
        "unit": "fl oz",
        "milliliters": 354.882,
        "grams": 358.431,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "grams": 101.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodSpiritsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "beer",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 mL normalized from USDA per-100-g data",
      "alcohol": {
        "abvPercent": 5.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL × ABV fraction × 0.789 g/mL ethanol"
      },
      "sourceNutritionPer100g": {
        "calories": 43,
        "protein": 0.46,
        "carbs": 3.55,
        "fat": 0,
        "fiber": 0,
        "caffeine": 0,
        "alcohol": 3.9
      },
      "sourceProvenance": {
        "nutritionProvider": "USDA Agricultural Research Service",
        "nutritionDatabase": "FoodData Central",
        "nutritionDataset": "SR Legacy",
        "fdcId": 168746,
        "ndbNumber": "14003",
        "sourceDescription": "Alcoholic beverage, beer, regular, all",
        "nutritionSourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168746/nutrients",
        "standardDrinkProvider": "National Institute on Alcohol Abuse and Alcoholism (NIAAA)",
        "standardDrinkSourceUrl": "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink",
        "verifiedAt": "2026-08-03"
      },
      "density": {
        "gramsPerMilliliter": 1.01,
        "basis": "generic regular beer approximate density for volume normalization",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrition is published per 100 g. ARI converts it to the Spirits pathway's 100 mL basis using an explicit approximate density. Alcohol grams and standard drinks are calculated independently from serving volume and ABV using 0.789 g/mL ethanol and the U.S. 14 g standard-drink definition.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "caffeine"
      ],
      "offlineReference": true,
      "genericFallbackOnly": true,
      "notes": "Broad fallback only. Exact beer brand/style/ABV should override this record. NIAAA uses 12 fl oz at about 5% ABV as the standard regular-beer example."
    }
  },
  {
    "id": "spirits-core-beer-light-4-2pct",
    "name": "Light Beer",
    "displayName": "Beer — Light, 4.2% ABV",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "light beer",
      "lite beer",
      "low calorie beer",
      "4.2 percent beer",
      "4.2% beer"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "alcoholic-drink",
      "fallback",
      "light-beer"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 100.0
    },
    "nutrition": {
      "calories": 29.0,
      "protein": 0.24,
      "carbs": 1.64,
      "fat": 0.0,
      "fiber": 0.0,
      "caffeine": 0.0,
      "alcohol": 3.1
    },
    "servings": [
      {
        "id": "default-serving",
        "label": "12 fl oz light beer",
        "amount": 12,
        "unit": "fl oz",
        "milliliters": 354.882,
        "grams": 354.882,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodSpiritsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "light-beer",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 mL normalized from USDA per-100-g data",
      "alcohol": {
        "abvPercent": 4.2,
        "alcoholGramsPerServing": 11.76,
        "standardDrinksPerServing": 0.84,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL × ABV fraction × 0.789 g/mL ethanol"
      },
      "sourceNutritionPer100g": {
        "calories": 29,
        "protein": 0.24,
        "carbs": 1.64,
        "fat": 0,
        "fiber": 0,
        "caffeine": 0,
        "alcohol": 3.1
      },
      "sourceProvenance": {
        "nutritionProvider": "USDA Agricultural Research Service",
        "nutritionDatabase": "FoodData Central",
        "nutritionDataset": "SR Legacy",
        "fdcId": 168749,
        "ndbNumber": "14006",
        "sourceDescription": "Alcoholic beverage, beer, light",
        "nutritionSourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/168749/nutrients",
        "standardDrinkProvider": "National Institute on Alcohol Abuse and Alcoholism (NIAAA)",
        "standardDrinkSourceUrl": "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink",
        "verifiedAt": "2026-08-03"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "generic light beer water-like density approximation",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrition is published per 100 g. ARI converts it to the Spirits pathway's 100 mL basis using an explicit approximate density. Alcohol grams and standard drinks are calculated independently from serving volume and ABV using 0.789 g/mL ethanol and the U.S. 14 g standard-drink definition.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "caffeine"
      ],
      "offlineReference": true,
      "genericFallbackOnly": true,
      "notes": "Broad fallback only. NIAAA notes many light beers are around 4.2% ABV. Exact branded light beer should replace this record."
    }
  },
  {
    "id": "spirits-core-wine-red-table-12pct",
    "name": "Red Wine",
    "displayName": "Wine — Red Table, 12% ABV",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "red wine",
      "table red wine",
      "red table wine",
      "glass of red wine"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "alcoholic-drink",
      "fallback",
      "red-wine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 99.0
    },
    "nutrition": {
      "calories": 84.15,
      "protein": 0.069,
      "carbs": 2.584,
      "fat": 0.0,
      "fiber": 0.0,
      "caffeine": 0.0,
      "alcohol": 10.494
    },
    "servings": [
      {
        "id": "default-serving",
        "label": "5 fl oz wine",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 147.868,
        "grams": 146.389,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "grams": 99.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodSpiritsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "red-wine",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 mL normalized from USDA per-100-g data",
      "alcohol": {
        "abvPercent": 12.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL × ABV fraction × 0.789 g/mL ethanol"
      },
      "sourceNutritionPer100g": {
        "calories": 85,
        "protein": 0.07,
        "carbs": 2.61,
        "fat": 0,
        "fiber": 0,
        "caffeine": 0,
        "alcohol": 10.6
      },
      "sourceProvenance": {
        "nutritionProvider": "USDA Agricultural Research Service",
        "nutritionDatabase": "FoodData Central",
        "nutritionDataset": "SR Legacy",
        "fdcId": 173190,
        "ndbNumber": "14096",
        "sourceDescription": "Alcoholic beverage, wine, table, red",
        "nutritionSourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/173190/nutrients",
        "standardDrinkProvider": "National Institute on Alcohol Abuse and Alcoholism (NIAAA)",
        "standardDrinkSourceUrl": "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink",
        "verifiedAt": "2026-08-03"
      },
      "density": {
        "gramsPerMilliliter": 0.99,
        "basis": "generic table wine approximate density for volume normalization",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrition is published per 100 g. ARI converts it to the Spirits pathway's 100 mL basis using an explicit approximate density. Alcohol grams and standard drinks are calculated independently from serving volume and ABV using 0.789 g/mL ethanol and the U.S. 14 g standard-drink definition.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "caffeine"
      ],
      "offlineReference": true,
      "genericFallbackOnly": true,
      "notes": "Broad red table wine fallback. Varietal and branded wine records should override it. NIAAA uses 5 fl oz at about 12% ABV as one U.S. standard drink."
    }
  },
  {
    "id": "spirits-core-wine-white-table-12pct",
    "name": "White Wine",
    "displayName": "Wine — White Table, 12% ABV",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "white wine",
      "table white wine",
      "white table wine",
      "glass of white wine"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "alcoholic-drink",
      "fallback",
      "white-wine"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 99.0
    },
    "nutrition": {
      "calories": 81.18,
      "protein": 0.069,
      "carbs": 2.574,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.95,
      "sodium": 4.95,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "default-serving",
        "label": "5 fl oz wine",
        "amount": 5,
        "unit": "fl oz",
        "milliliters": 147.868,
        "grams": 146.389,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "grams": 99.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodSpiritsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "white-wine",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 mL normalized from USDA per-100-g data",
      "alcohol": {
        "abvPercent": 12.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL × ABV fraction × 0.789 g/mL ethanol"
      },
      "sourceNutritionPer100g": {
        "calories": 82,
        "protein": 0.07,
        "carbs": 2.6,
        "fat": 0,
        "fiber": 0,
        "sugar": 0.96,
        "sodium": 5,
        "caffeine": 0
      },
      "sourceProvenance": {
        "nutritionProvider": "USDA Agricultural Research Service",
        "nutritionDatabase": "FoodData Central",
        "nutritionDataset": "SR Legacy",
        "fdcId": 174837,
        "ndbNumber": "14106",
        "sourceDescription": "Alcoholic beverage, wine, table, white",
        "nutritionSourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/174837/nutrients",
        "standardDrinkProvider": "National Institute on Alcohol Abuse and Alcoholism (NIAAA)",
        "standardDrinkSourceUrl": "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink",
        "verifiedAt": "2026-08-03"
      },
      "density": {
        "gramsPerMilliliter": 0.99,
        "basis": "generic table wine approximate density for volume normalization",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrition is published per 100 g. ARI converts it to the Spirits pathway's 100 mL basis using an explicit approximate density. Alcohol grams and standard drinks are calculated independently from serving volume and ABV using 0.789 g/mL ethanol and the U.S. 14 g standard-drink definition.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "caffeine"
      ],
      "offlineReference": true,
      "genericFallbackOnly": true,
      "notes": "Broad white table wine fallback. Varietal and branded wine records should override it. ABV is the NIAAA standard-drink example rather than a claim that every white wine is exactly 12%."
    }
  },
  {
    "id": "spirits-core-distilled-80-proof-40pct",
    "name": "Distilled Spirits",
    "displayName": "Distilled Spirits — 80 Proof, 40% ABV",
    "category": "spirits",
    "state": "ready-to-drink",
    "preparation": "packaged-or-poured",
    "aliases": [
      "liquor",
      "spirits",
      "hard liquor",
      "80 proof liquor",
      "40 percent liquor",
      "40% liquor",
      "vodka",
      "tequila",
      "rum",
      "gin",
      "whiskey",
      "whisky",
      "bourbon"
    ],
    "tags": [
      "spirits",
      "alcohol",
      "alcoholic-drink",
      "fallback",
      "distilled-spirits"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 94.6
    },
    "nutrition": {
      "calories": 218.53,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 0.946,
      "potassium": 1.892,
      "caffeine": 0.0,
      "alcohol": 31.596
    },
    "servings": [
      {
        "id": "default-serving",
        "label": "1.5 fl oz shot",
        "amount": 1.5,
        "unit": "fl oz",
        "milliliters": 44.36,
        "grams": 41.965,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100,
        "grams": 94.6,
        "isDefault": false
      }
    ],
    "source": "AriFoodSpiritsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "spirits",
      "spiritType": "distilled-spirits",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 mL normalized from USDA per-100-g data",
      "alcohol": {
        "abvPercent": 40.0,
        "alcoholGramsPerServing": 14.0,
        "standardDrinksPerServing": 1.0,
        "standardDrinkDefinition": "United States: 14 g pure alcohol",
        "standardDrinkBasisGrams": 14.0,
        "ethanolDensityGramsPerMilliliter": 0.789,
        "calculationMethod": "serving mL × ABV fraction × 0.789 g/mL ethanol"
      },
      "sourceNutritionPer100g": {
        "calories": 231,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 1,
        "potassium": 2,
        "caffeine": 0,
        "alcohol": 33.4
      },
      "sourceProvenance": {
        "nutritionProvider": "USDA Agricultural Research Service",
        "nutritionDatabase": "FoodData Central",
        "nutritionDataset": "SR Legacy",
        "fdcId": 174815,
        "ndbNumber": null,
        "sourceDescription": "Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey), 80 proof",
        "nutritionSourceUrl": "https://fdc.nal.usda.gov/fdc-app.html#/food-details/174815/nutrients",
        "standardDrinkProvider": "National Institute on Alcohol Abuse and Alcoholism (NIAAA)",
        "standardDrinkSourceUrl": "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink",
        "verifiedAt": "2026-08-03"
      },
      "density": {
        "gramsPerMilliliter": 0.946,
        "basis": "approximate density of a 40% ABV ethanol-water spirit, used only for generic USDA weight-to-volume normalization",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrition is published per 100 g. ARI converts it to the Spirits pathway's 100 mL basis using an explicit approximate density. Alcohol grams and standard drinks are calculated independently from serving volume and ABV using 0.789 g/mL ethanol and the U.S. 14 g standard-drink definition.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "caffeine"
      ],
      "offlineReference": true,
      "genericFallbackOnly": true,
      "notes": "Emergency fallback for unbranded 80-proof distilled liquor. Exact tequila, vodka, rum, gin, whiskey, bourbon, cognac, flavored spirits, and higher/lower-proof products need their own branded or specific records."
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
    if (!global.AriFoodSpirits) {
      return false;
    }

    if (
      typeof global.AriFoodSpirits.isExpectedModule === "function"
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
      typeof global.AriFoodSpirits.markModuleFailed === "function"
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
      ARI_SPIRITS_CORE_FOODS,
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
        ARI_SPIRITS_CORE_FOODS.length,

      runtimeInternetRequired:
        false,

      brandFirst:
        true,

      fallbackOnly:
        true,

      standardDrinkBasisGrams:
        14,

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
      `Registration rejected ${registration.rejected} Spirits Core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSpirits &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodSpirits.markModuleLoaded === "function"
  ) {
    global.AriFoodSpirits.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodSpiritsCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SPIRITS_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_SPIRITS_CORE_FOODS.map(
          food => food.id
        );
      },

      getRecords() {
        return ARI_SPIRITS_CORE_FOODS.map(clone);
      },

      getBySpiritType(spiritType) {
        const normalized =
          String(spiritType || "")
            .trim()
            .toLowerCase();

        return ARI_SPIRITS_CORE_FOODS
          .filter(
            food =>
              String(
                food.metadata?.spiritType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_SPIRITS_CORE_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getAlcoholMetrics(foodId) {
        const record =
          ARI_SPIRITS_CORE_FOODS.find(
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
        "ari:food-spirits-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SPIRITS_CORE_FOODS.length,

            brandFirst:
              true,

            fallbackOnly:
              true,

            standardDrinkBasisGrams:
              14,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SPIRITS_CORE_FOODS.length} generic alcohol fallback records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
