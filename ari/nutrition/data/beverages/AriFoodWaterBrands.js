// =====================================================
// ARI REBIRTH
// File: AriFoodWaterBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first bottled water and mineral-water module
//   for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// V1 brands:
//   - DASANI
//   - Aquafina
//   - LIFEWTR
//   - smartwater
//   - Essentia
//   - FIJI Water
//   - evian
//   - Acqua Panna
//   - Topo Chico
//   - S.Pellegrino
//   - Liquid Death
//
// Coverage:
//   12 current branded water formulations.
//
// Canonical basis:
//   100 mL.
//
// Water-specific policy:
//   - Exact Nutrition Facts first.
//   - Official water-quality/mineral analysis when useful.
//   - Mineral values remain traceable in mg/L metadata.
//   - No invented electrolyte quantities.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodWaterBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodWaterBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first bottled water and mineral-water module",
  "recordCount": 12,
  "brands": [
    "Acqua Panna",
    "Aquafina",
    "DASANI",
    "Essentia",
    "FIJI Water",
    "LIFEWTR",
    "Liquid Death",
    "S.Pellegrino",
    "Topo Chico",
    "evian",
    "smartwater"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "Official current manufacturer Nutrition Facts panel",
    "Official current bottled-water quality or mineral-analysis report",
    "Official manufacturer product-facts database",
    "Current retailer package-label capture when a full manufacturer panel is unavailable"
  ],
  "rules": [
    "Canonical beverage basis is 100 mL.",
    "Preserve exact Nutrition Facts servings when a package label is available.",
    "Preserve official mineral analyses in metadata.mineralAnalysisMgPerL.",
    "Convert mg/L composition to mg/100 mL only for nutrients ARI's schema supports.",
    "Do not turn 'not detected' or unpublished minerals into invented zero values.",
    "Do not infer exact electrolyte quantities merely because minerals appear in an ingredient list.",
    "Keep purified, alkaline, spring, artesian, mineral, still, and sparkling waters distinguishable.",
    "Keep flavored, sweetened, juice-containing, tea, and energy-water products out of plain-water records.",
    "Do not create duplicate records solely for alternate package sizes when the water formulation is unchanged.",
    "Branded water records outrank AriFoodBeverageCore generic water fallbacks.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_WATER_BRAND_FOODS =
    [
  {
    "id": "beverage-water-dasani-purified",
    "name": "Purified Water",
    "displayName": "DASANI Purified Water",
    "brand": "DASANI",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Dasani",
      "Dasani Water",
      "Dasani Purified Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "purified-water",
      "still",
      "dasani"
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "purified-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "DASANI",
        "sourceType": "official manufacturer Nutrition Facts panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/dasani",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Purified water, magnesium sulfate, potassium chloride.",
      "availableSizes": [
        "10 fl oz",
        "12 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "1 L",
        "1.5 L"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "Minerals are added for taste. The current U.S. Nutrition Facts panel rounds sodium to 0 mg per 20 fl oz."
    }
  },
  {
    "id": "beverage-water-aquafina-purified",
    "name": "Purified Water",
    "displayName": "Aquafina Purified Water",
    "brand": "Aquafina",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Aquafina",
      "Aquafina Water",
      "Aquafina Purified Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "purified-water",
      "still",
      "aquafina"
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
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "purified-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (20 fl oz / 591 mL)",
        "servingMilliliters": 591,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "caffeine": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "Aquafina",
        "sourceType": "official PepsiCo product facts",
        "sourceUrl": "https://www.pepsicoproductfacts.com/Home/Product?form=RTD&formula=91246*01*01-01&size=20",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Purified drinking water.",
      "availableSizes": [
        "12 fl oz can",
        "12 fl oz bottle",
        "16 fl oz",
        "16.9 fl oz",
        "20 fl oz",
        "33.8 fl oz",
        "42.3 fl oz",
        "50.7 fl oz"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "PepsiCo's current product-facts page explicitly lists the 20 fl oz / 591 mL serving and 0 mg caffeine. Trace minerals are not invented."
    }
  },
  {
    "id": "beverage-water-lifewtr-purified",
    "name": "Purified Water",
    "displayName": "LIFEWTR Purified Water",
    "brand": "LIFEWTR",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "LIFEWTR",
      "Life Water",
      "LIFEWTR Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "purified-water-electrolytes",
      "still",
      "lifewtr"
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
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "purified-water-electrolytes",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (16.9 fl oz / 500 mL)",
        "servingMilliliters": 500,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "caffeine": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "LIFEWTR",
        "sourceType": "official PepsiCo product facts",
        "sourceUrl": "https://www.pepsicoproductfacts.com/Home/product?gtin=00012000171659",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Purified water with electrolytes added for taste.",
      "availableSizes": [
        "16.9 fl oz",
        "20 fl oz",
        "23.7 fl oz",
        "33.8 fl oz"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "The current PepsiCo product-facts page explicitly reports a 500 mL serving and 0 mg caffeine. Unpublished electrolyte quantities are not inferred."
    }
  },
  {
    "id": "beverage-water-smartwater-original",
    "name": "Original",
    "displayName": "smartwater Original",
    "brand": "smartwater",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "smartwater",
      "Smart Water",
      "glaceau smartwater",
      "smartwater Original"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "vapor-distilled-electrolyte-water",
      "still",
      "smartwater"
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (33.8 fl oz / 1 L)",
        "amount": 1,
        "unit": "container",
        "milliliters": 1000,
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "vapor-distilled-electrolyte-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (33.8 fl oz / 1 L)",
        "servingMilliliters": 1000,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "smartwater",
        "sourceType": "official manufacturer Nutrition Facts panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/smartwater/products",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Vapor distilled water, calcium chloride, magnesium chloride, potassium bicarbonate.",
      "availableSizes": [
        "12 fl oz can",
        "20 fl oz",
        "23.7 fl oz",
        "33.8 fl oz",
        "1.5 L"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "Electrolytes are added for taste; current U.S. label reports 0 mg sodium."
    }
  },
  {
    "id": "beverage-water-smartwater-alkaline-antioxidant",
    "name": "Alkaline with Antioxidant",
    "displayName": "smartwater Alkaline with Antioxidant",
    "brand": "smartwater",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "smartwater Alkaline",
      "Smart Water Alkaline",
      "smartwater antioxidant",
      "smartwater alkaline antioxidant"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "alkaline-electrolyte-water",
      "still",
      "smartwater"
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
      "sugar": 0.0,
      "addedSugar": 0.0,
      "sodium": 0.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (33.8 fl oz / 1 L)",
        "amount": 1,
        "unit": "container",
        "milliliters": 1000,
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "alkaline-electrolyte-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (33.8 fl oz / 1 L)",
        "servingMilliliters": 1000,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "addedSugar": 0,
        "sodium": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": 9.5,
      "sourceProvenance": {
        "provider": "smartwater",
        "sourceType": "official manufacturer Nutrition Facts panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/smartwater/products",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Vapor distilled water, calcium chloride, magnesium chloride, potassium bicarbonate, sodium selenate.",
      "availableSizes": [
        "12 fl oz can",
        "20 fl oz",
        "23.7 fl oz",
        "33.8 fl oz",
        "1.5 L"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "Current U.S. product is marketed as 9.5+ pH and includes selenium. The page reports selenium as %DV rather than a mass amount, so ARI does not invent a selenium milligram value."
    }
  },
  {
    "id": "beverage-water-essentia-ionized-alkaline",
    "name": "Ionized Alkaline Water",
    "displayName": "Essentia Ionized Alkaline Water",
    "brand": "Essentia",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Essentia",
      "Essentia Water",
      "Essentia Alkaline Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "ionized-alkaline-water",
      "still",
      "essentia"
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
      "sodium": 1.5,
      "potassium": 0.73
    },
    "servings": [
      {
        "id": "reference-serving",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "ionized-alkaline-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": false,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": null,
      "mineralAnalysisMgPerL": {
        "magnesium": 1.42,
        "potassium": 7.3,
        "sodium": 15.0,
        "sulfate": 3.17,
        "bicarbonateAlkalinity": 33.55,
        "totalDissolvedSolids": 61.33
      },
      "pH": 9.92,
      "sourceProvenance": {
        "provider": "Essentia",
        "sourceType": "official 2025 water analysis report published April 2026",
        "sourceUrl": "https://essentiawater.com/wp-content/uploads/2026/04/Essentia-EN-2025-April-28-2026.pdf",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Purified water with trace electrolytes including potassium, magnesium, calcium and sodium; ionized alkaline water.",
      "availableSizes": [
        "12 fl oz",
        "500 mL",
        "20 fl oz",
        "1 L",
        "1.5 L"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "The current 2025 analysis reports average representative samples across Essentia bottling locations. Calcium was not detected in that report, so no calcium amount is inserted into ARI's nutrition object."
    }
  },
  {
    "id": "beverage-water-fiji-natural-artesian",
    "name": "Natural Artesian Water",
    "displayName": "FIJI Water Natural Artesian Water",
    "brand": "FIJI Water",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "FIJI",
      "Fiji Water",
      "FIJI Artesian Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "natural-artesian-water",
      "still",
      "fiji-water"
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
      "sodium": 1.7,
      "potassium": 0.48,
      "calcium": 1.8
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (500 mL)",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "natural-artesian-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": false,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": null,
      "mineralAnalysisMgPerL": {
        "bicarbonate": 126.4,
        "calcium": 18,
        "chloride": 9,
        "fluoride": 0.2,
        "magnesium": 14,
        "potassium": 4.8,
        "sodium": 17,
        "silica": 86,
        "sulfate": 0.5,
        "totalDissolvedSolids": 210,
        "totalAlkalinity": 130
      },
      "pH": 7.91,
      "sourceProvenance": {
        "provider": "FIJI Water",
        "sourceType": "official March 2026 bottled-water quality report",
        "sourceUrl": "https://cdn.shopify.com/s/files/1/0051/7262/5477/files/2026_CA_Water_Quality_Report_English_-_FINAL_-_3.30.2026.pdf",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Natural artesian water.",
      "availableSizes": [
        "330 mL",
        "500 mL",
        "700 mL",
        "1 L",
        "1.5 L",
        "700 mL sport cap"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "Mineral values come from FIJI Water Company's March 2026 report with February 2026 sampling."
    }
  },
  {
    "id": "beverage-water-evian-natural-spring",
    "name": "Natural Spring Water",
    "displayName": "evian Natural Spring Water",
    "brand": "evian",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "evian",
      "Evian Water",
      "Evian Spring Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "natural-spring-water",
      "still",
      "evian"
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
      "sodium": 0.65,
      "potassium": 0.1,
      "calcium": 8.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (500 mL)",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "natural-spring-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": false,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": null,
      "mineralAnalysisMgPerL": {
        "calcium": 80,
        "magnesium": 26,
        "potassium": 1,
        "sodium": 6.5,
        "nitrates": 3.8,
        "bicarbonates": 360,
        "sulfates": 15,
        "silica": 14,
        "chlorides": 10,
        "totalDissolvedSolids": 345
      },
      "pH": 7.2,
      "sourceProvenance": {
        "provider": "evian",
        "sourceType": "official manufacturer water-attributes/mineral-composition page",
        "sourceUrl": "https://www.evian.com/en_int/what-is-mineral-water/water-quality/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Natural spring water.",
      "availableSizes": [
        "330 mL",
        "500 mL",
        "750 mL",
        "1 L",
        "1.5 L"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": null
    }
  },
  {
    "id": "beverage-water-acqua-panna-natural-spring",
    "name": "Natural Spring Water",
    "displayName": "Acqua Panna Natural Spring Water",
    "brand": "Acqua Panna",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Acqua Panna",
      "Panna Water",
      "Acqua Panna Spring Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "natural-spring-water",
      "still",
      "acqua-panna"
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
      "sodium": 0.7,
      "potassium": 0.09,
      "calcium": 3.22
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (500 mL)",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "natural-spring-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": false,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": null,
      "mineralAnalysisMgPerL": {
        "bicarbonate": 107,
        "calcium": 32.2,
        "sulfate": 23.0,
        "chloride": 8.2,
        "silica": 7.1,
        "sodium": 7.0,
        "magnesium": 6.7,
        "nitrate": 2.4,
        "potassium": 0.9,
        "totalDissolvedSolids": 142,
        "totalMineralisation": 195
      },
      "pH": 8.0,
      "sourceProvenance": {
        "provider": "Acqua Panna",
        "sourceType": "official manufacturer current water analysis",
        "sourceUrl": "https://www.acquapanna.com/intl/50-cl-glass-water-bottle",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Natural spring water.",
      "availableSizes": [
        "250 mL glass",
        "500 mL glass",
        "750 mL glass",
        "1 L glass"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": null
    }
  },
  {
    "id": "beverage-water-topo-chico-mineral",
    "name": "Sparkling Mineral Water",
    "displayName": "Topo Chico Sparkling Mineral Water",
    "brand": "Topo Chico",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Topo Chico",
      "Topo Chico Mineral Water",
      "Topo Chico Sparkling Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "sparkling-mineral-water",
      "sparkling",
      "topo-chico"
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
      "sodium": 4.225,
      "calcium": 11.268
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "1 bottle (12 fl oz / 355 mL)",
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "sparkling-mineral-water",
      "carbonated": true,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 bottle (12 fl oz / 355 mL)",
        "servingMilliliters": 355,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 15,
        "calcium": 40
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "Topo Chico",
        "sourceType": "official manufacturer Nutrition Facts panel",
        "sourceUrl": "https://www.coca-cola.com/us/en/brands/topo-chico/products/mineral-water",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Mineral water, carbon dioxide.",
      "availableSizes": [
        "6.5 fl oz",
        "12 fl oz",
        "25.4 fl oz"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "ARI uses the current U.S. Nutrition Facts panel for nutrition. A separate annual water-quality report may show unrounded source-water mineral concentrations that differ from FDA label rounding."
    }
  },
  {
    "id": "beverage-water-sanpellegrino-sparkling-mineral",
    "name": "Sparkling Natural Mineral Water",
    "displayName": "S.Pellegrino Sparkling Natural Mineral Water",
    "brand": "S.Pellegrino",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "San Pellegrino Water",
      "S Pellegrino",
      "S.Pellegrino",
      "Sanpellegrino mineral water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "sparkling-mineral-water",
      "sparkling",
      "spellegrino"
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
      "sodium": 1.0,
      "calcium": 6.0
    },
    "servings": [
      {
        "id": "reference-serving",
        "label": "manufacturer reference serving (12 fl oz / 360 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 360,
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "sparkling-mineral-water",
      "carbonated": true,
      "brandSpecific": true,
      "labelVerified": false,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": null,
      "mineralAnalysisMgPerL": {
        "sodium": 10,
        "calcium": 60
      },
      "pH": null,
      "sourceProvenance": {
        "provider": "S.Pellegrino",
        "sourceType": "official U.S. manufacturer typical analysis",
        "sourceUrl": "https://www.sanpellegrino.com/us/water/500-ml-glass-bottle",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Carbonated natural mineral water.",
      "availableSizes": [
        "250 mL glass",
        "500 mL glass",
        "750 mL glass",
        "1 L glass",
        "500 mL PET",
        "1 L PET"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "The current U.S. page publishes 0 calories and a typical analysis of 10 mg/L sodium and 60 mg/L calcium. More detailed international mineral panels are intentionally not mixed into this U.S.-anchored record."
    }
  },
  {
    "id": "beverage-water-liquid-death-mountain-water",
    "name": "Mountain Water",
    "displayName": "Liquid Death Mountain Water",
    "brand": "Liquid Death",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "Liquid Death Water",
      "Liquid Death Mountain Water",
      "Liquid Death Still Water"
    ],
    "tags": [
      "beverage",
      "water",
      "branded",
      "mountain-water",
      "still",
      "liquid-death"
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
        "id": "reference-serving",
        "label": "1 can (19.2 fl oz / 568 mL)",
        "amount": 1,
        "unit": "container",
        "milliliters": 568,
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
    "source": "AriFoodWaterBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "waterType": "mountain-water",
      "carbonated": false,
      "brandSpecific": true,
      "labelVerified": true,
      "compositionVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "labelNutrition": {
        "servingSize": "1 can (19.2 fl oz / 568 mL)",
        "servingMilliliters": 568,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sodium": 0
      },
      "mineralAnalysisMgPerL": null,
      "pH": null,
      "sourceProvenance": {
        "provider": "Liquid Death",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.kroger.com/p/liquid-death-mountain-water/0085003170031",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "100% mountain water.",
      "availableSizes": [
        "19.2 fl oz can"
      ],
      "offlineReference": true,
      "normalizationMethod": "Package Nutrition Facts are normalized mathematically to 100 mL when an exact label serving is available. Official water-quality or mineral-analysis values published in mg/L are divided by 10 for ARI's 100 mL nutrient basis. Non-schema minerals remain in metadata.mineralAnalysisMgPerL.",
      "notes": "Plain still Mountain Water only. Flavored sparkling waters, teas, and Liquid Death energy products require separate records."
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
      ARI_WATER_BRAND_FOODS,
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
        ARI_WATER_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_WATER_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      sparklingCount:
        ARI_WATER_BRAND_FOODS.filter(
          food =>
            food.metadata?.carbonated === true
        ).length,

      stillCount:
        ARI_WATER_BRAND_FOODS.filter(
          food =>
            food.metadata?.carbonated !== true
        ).length,

      mineralAnalysisCount:
        ARI_WATER_BRAND_FOODS.filter(
          food =>
            food.metadata?.mineralAnalysisMgPerL
        ).length,

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
      `Registration rejected ${registration.rejected} water-brand record(s).`,
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

  global.AriFoodWaterBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_WATER_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_WATER_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_WATER_BRAND_FOODS.map(
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

        return ARI_WATER_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getStillWater() {
        return ARI_WATER_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.carbonated !== true
          )
          .map(clone);
      },

      getSparklingWater() {
        return ARI_WATER_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.carbonated === true
          )
          .map(clone);
      },

      getWithMineralAnalysis() {
        return ARI_WATER_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.mineralAnalysisMgPerL
          )
          .map(clone);
      },

      getByWaterType(waterType) {
        const normalized =
          String(waterType || "")
            .trim()
            .toLowerCase();

        return ARI_WATER_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.waterType || ""
              ).toLowerCase() === normalized
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
          ARI_WATER_BRAND_FOODS.find(
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
        "ari:food-water-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_WATER_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

            stillCount:
              moduleResult.metadata.stillCount,

            sparklingCount:
              moduleResult.metadata.sparklingCount,

            mineralAnalysisCount:
              moduleResult.metadata.mineralAnalysisCount,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_WATER_BRAND_FOODS.length} branded water records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);