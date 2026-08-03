// =====================================================
// ARI REBIRTH
// File: AriFoodCerealBrands.js
// Version: 1.0.0
//
// Purpose:
//   Offline branded ready-to-eat cereal reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Architecture decision:
//   Branded cereal stays in the SAME grains pathway as
//   Rice, Pasta, Bread, Oats, and OtherGrains.
//
// Coverage:
//   20 high-recognition U.S. cereal products from:
//   - General Mills
//   - WK Kellogg Co
//   - Post Consumer Brands
//
// Nutrition policy:
//   - Manufacturer/package serving is the default.
//   - Milk is NEVER included.
//   - Canonical nutrition is stored per 100 g so the
//     AriFoodCalculator can scale arbitrary gram amounts.
//   - Exact package-label serving nutrition is preserved
//     separately in metadata.labelNutrition.
//   - Manufacturer labels outrank retailer transcriptions.
//   - No "generic cereal" records are created here.
//
// Important:
//   Product formulas and label serving sizes can change.
//   This file is an offline snapshot verified 2026-08-03.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+ (controller should expect
//     "AriFoodCerealBrands" after architecture update)
// =====================================================

(function initializeAriFoodCerealBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCerealBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "selectionBasis": "Twenty high-recognition, widely distributed U.S. cereal products across major manufacturers. This is a practical popularity-focused starter set, not a claim of an exact audited national sales ranking.",
  "primaryHierarchy": [
    "Manufacturer product page or manufacturer SmartLabel",
    "Manufacturer food-service nutrition sheet when consumer product page values are unavailable",
    "Current U.S. retailer package-label transcription only as a fallback"
  ],
  "rules": [
    "Use the cereal's labeled as-packaged serving; do not include milk.",
    "Store the exact label serving and label nutrients in metadata.labelNutrition.",
    "Derive the canonical 100 g nutrition profile mathematically from the labeled gram serving.",
    "Do not fabricate exact values from inequalities such as less than 1 g fiber.",
    "Treat different cereal products as separate branded foods even when made by the same manufacturer.",
    "Do not create with-milk variants. Milk is logged separately through its own food record.",
    "Product formulations can change; manufacturer/package labels supersede this offline snapshot when later refreshed.",
    "No runtime internet connection is required after the file is authored."
  ]
}
  );

  const ARI_CEREAL_BRAND_FOODS =
    [
  {
    "id": "cereal-cheerios-original",
    "name": "Original Cheerios",
    "displayName": "Original Cheerios",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cheerios",
    "aliases": [
      "Cheerios",
      "plain Cheerios",
      "original Cheerios cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 358.97,
      "protein": 12.82,
      "carbs": 74.36,
      "fat": 6.41,
      "sugar": 5.13,
      "sodium": 487.2,
      "fiber": 10.26,
      "potassium": 641.0,
      "saturatedFat": 1.28
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/2 cups (39 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 39,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Cheerios",
      "productName": "Original Cheerios",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/2 cups (39 g)",
        "servingGrams": 39,
        "calories": 140,
        "protein": 5,
        "carbs": 29,
        "fat": 2.5,
        "sugar": 2,
        "sodium": 190,
        "fiber": 4,
        "potassium": 250,
        "saturatedFat": 0.5,
        "addedSugar": 1
      },
      "sourceProvenance": {
        "provider": "Cheerios / General Mills",
        "sourceTitle": "Original Cheerios",
        "sourceUrl": "https://www.cheerios.com/products/original-cheerios",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-cheerios-honey-nut",
    "name": "Honey Nut Cheerios",
    "displayName": "Honey Nut Cheerios",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cheerios",
    "aliases": [
      "Honey Nut Cheerios",
      "honey cheerios"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 378.38,
      "protein": 8.11,
      "carbs": 81.08,
      "fat": 5.41,
      "sugar": 32.43,
      "sodium": 567.6,
      "fiber": 8.11,
      "potassium": 405.4,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (37 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 37,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Cheerios",
      "productName": "Honey Nut Cheerios",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (37 g)",
        "servingGrams": 37,
        "calories": 140,
        "protein": 3,
        "carbs": 30,
        "fat": 2,
        "sugar": 12,
        "sodium": 210,
        "fiber": 3,
        "potassium": 150,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Cheerios / General Mills",
        "sourceTitle": "Honey Nut Cheerios",
        "sourceUrl": "https://www.cheerios.com/products/honey-nut-cheerios",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "almond"
      ],
      "glutenFreeLabel": true,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-cinnamon-toast-crunch-original",
    "name": "Cinnamon Toast Crunch",
    "displayName": "Cinnamon Toast Crunch",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cinnamon Toast Crunch",
    "aliases": [
      "CTC",
      "cinnamon toast cereal",
      "cinnamon crunch cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 414.63,
      "protein": 4.88,
      "carbs": 80.49,
      "fat": 9.76,
      "sugar": 29.27,
      "sodium": 561.0,
      "fiber": 7.32,
      "potassium": 0.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (41 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 41,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Cinnamon Toast Crunch",
      "productName": "Cinnamon Toast Crunch",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (41 g)",
        "servingGrams": 41,
        "calories": 170,
        "protein": 2,
        "carbs": 33,
        "fat": 4,
        "sugar": 12,
        "sodium": 230,
        "fiber": 3,
        "potassium": 0,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Cinnamon Toast Crunch / General Mills",
        "sourceTitle": "Cinnamon Toast Crunch Cereal",
        "sourceUrl": "https://www.cinnamontoastcrunch.com/products/cinnamon-toast-crunch",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat",
        "soy"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-reeses-puffs-original",
    "name": "Reese's Puffs",
    "displayName": "Reese's Puffs",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Reese's Puffs",
    "aliases": [
      "Reeses Puffs",
      "Reese Puffs",
      "peanut butter chocolate cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 410.26,
      "protein": 7.69,
      "carbs": 76.92,
      "fat": 11.54,
      "sugar": 30.77,
      "sodium": 564.1,
      "fiber": 5.13,
      "potassium": 230.8,
      "saturatedFat": 1.28
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (39 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 39,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Reese's Puffs",
      "productName": "Reese's Puffs",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (39 g)",
        "servingGrams": 39,
        "calories": 160,
        "protein": 3,
        "carbs": 30,
        "fat": 4.5,
        "sugar": 12,
        "sodium": 220,
        "fiber": 2,
        "potassium": 90,
        "saturatedFat": 0.5,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Reese's Puffs / General Mills",
        "sourceTitle": "REESE'S PUFFS Cereal",
        "sourceUrl": "https://www.reesespuffs.com/products/reeses-puffs-cereal",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "peanut"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-chex-rice",
    "name": "Rice Chex",
    "displayName": "Rice Chex",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Chex",
    "aliases": [
      "Rice Chex cereal",
      "Chex rice cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 7.5,
      "carbs": 87.5,
      "fat": 2.5,
      "sugar": 7.5,
      "sodium": 825.0,
      "fiber": 5.0,
      "potassium": 0.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/3 cups (40 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 40,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Chex",
      "productName": "Rice Chex",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/3 cups (40 g)",
        "servingGrams": 40,
        "calories": 160,
        "protein": 3,
        "carbs": 35,
        "fat": 1,
        "sugar": 3,
        "sodium": 330,
        "fiber": 2,
        "potassium": 0,
        "saturatedFat": 0,
        "addedSugar": 3
      },
      "sourceProvenance": {
        "provider": "Chex / General Mills",
        "sourceTitle": "Rice Chex Cereal",
        "sourceUrl": "https://www.chex.com/products/rice-chex/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kix-original",
    "name": "Kix",
    "displayName": "Kix",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Kix",
    "aliases": [
      "Kix cereal",
      "original Kix"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 7.5,
      "carbs": 85.0,
      "fat": 2.5,
      "sugar": 10.0,
      "sodium": 550.0,
      "fiber": 7.5,
      "potassium": 0.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/2 cups (40 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 40,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Kix",
      "productName": "Kix",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/2 cups (40 g)",
        "servingGrams": 40,
        "calories": 160,
        "protein": 3,
        "carbs": 34,
        "fat": 1,
        "sugar": 4,
        "sodium": 220,
        "fiber": 3,
        "potassium": 0,
        "saturatedFat": 0,
        "addedSugar": 4
      },
      "sourceProvenance": {
        "provider": "Current U.S. retail package listing",
        "sourceTitle": "General Mills Kix Cereal",
        "sourceUrl": "https://www.heb.com/product-detail/general-mills-kix-cereal/984248",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Current U.S. retail label transcription for General Mills Kix. Manufacturer remains the product authority; when ARI later ingests a direct General Mills consumer label endpoint, that source should supersede this one."
    }
  },
  {
    "id": "cereal-lucky-charms-original",
    "name": "Lucky Charms",
    "displayName": "Lucky Charms",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Lucky Charms",
    "aliases": [
      "Lucky Charms cereal",
      "Lucky Charms marshmallow cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 388.89,
      "protein": 8.33,
      "carbs": 83.33,
      "fat": 4.17,
      "sugar": 33.33,
      "sodium": 611.1,
      "fiber": 5.56,
      "potassium": 0.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (36 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 36,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Lucky Charms",
      "productName": "Lucky Charms",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 3,
        "carbs": 30,
        "fat": 1.5,
        "sugar": 12,
        "sodium": 220,
        "fiber": 2,
        "potassium": 0,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Current U.S. retail package listing",
        "sourceTitle": "General Mills Lucky Charms Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-81875658",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-trix-original",
    "name": "Trix",
    "displayName": "Trix",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Trix",
    "aliases": [
      "Trix cereal",
      "Trix fruit cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "general-mills"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 410.26,
      "protein": 5.13,
      "carbs": 84.62,
      "fat": 5.13,
      "sugar": 30.77,
      "sodium": 461.5,
      "fiber": 2.56,
      "potassium": 0.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/4 cups (39 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 39,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Trix",
      "productName": "Trix",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/4 cups (39 g)",
        "servingGrams": 39,
        "calories": 160,
        "protein": 2,
        "carbs": 33,
        "fat": 2,
        "sugar": 12,
        "sodium": 180,
        "fiber": 1,
        "potassium": 0,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Current U.S. retail package listing",
        "sourceTitle": "General Mills Trix Cereal",
        "sourceUrl": "https://www.heb.com/product-detail/general-mills-trix-cereal/32024",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-frosted-flakes-original",
    "name": "Kellogg's Frosted Flakes",
    "displayName": "Kellogg's Frosted Flakes",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Kellogg's Frosted Flakes",
    "aliases": [
      "Frosted Flakes",
      "Tony the Tiger cereal",
      "Kellogg Frosted Flakes"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 351.35,
      "protein": 5.41,
      "carbs": 89.19,
      "fat": 0.0,
      "sugar": 32.43,
      "sodium": 513.5,
      "fiber": 2.7,
      "potassium": 81.1,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (37 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 37,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Kellogg's Frosted Flakes",
      "productName": "Kellogg's Frosted Flakes",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (37 g)",
        "servingGrams": 37,
        "calories": 130,
        "protein": 2,
        "carbs": 33,
        "fat": 0,
        "sugar": 12,
        "sodium": 190,
        "fiber": 1,
        "potassium": 30,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Frosted Flakes Cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000196560",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-froot-loops-original",
    "name": "Kellogg's Froot Loops",
    "displayName": "Kellogg's Froot Loops",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Froot Loops",
    "aliases": [
      "Froot Loops",
      "Fruit Loops",
      "Toucan Sam cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 384.62,
      "protein": 5.13,
      "carbs": 87.18,
      "fat": 3.85,
      "sugar": 30.77,
      "sodium": 538.5,
      "fiber": 5.13,
      "potassium": 153.8,
      "saturatedFat": 1.28
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/3 cups (39 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 39,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Froot Loops",
      "productName": "Kellogg's Froot Loops",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/3 cups (39 g)",
        "servingGrams": 39,
        "calories": 150,
        "protein": 2,
        "carbs": 34,
        "fat": 1.5,
        "sugar": 12,
        "sodium": 210,
        "fiber": 2,
        "potassium": 60,
        "saturatedFat": 0.5,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Kellogg SmartLabel / WK Kellogg",
        "sourceTitle": "Kellogg's Froot Loops Breakfast Cereal",
        "sourceUrl": "https://smartlabel.kelloggs.com/Product/Index/00038000017919",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-rice-krispies-original",
    "name": "Kellogg's Rice Krispies",
    "displayName": "Kellogg's Rice Krispies",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Rice Krispies",
    "aliases": [
      "Rice Krispies",
      "rice crispy cereal",
      "rice krispie cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375.0,
      "protein": 7.5,
      "carbs": 90.0,
      "fat": 0.0,
      "sugar": 10.0,
      "sodium": 500.0,
      "fiber": 0.0,
      "potassium": 75.0,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/2 cups (40 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 40,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Rice Krispies",
      "productName": "Kellogg's Rice Krispies",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/2 cups (40 g)",
        "servingGrams": 40,
        "calories": 150,
        "protein": 3,
        "carbs": 36,
        "fat": 0,
        "sugar": 4,
        "sodium": 200,
        "fiber": 0,
        "potassium": 30,
        "saturatedFat": 0,
        "addedSugar": 4
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Rice Krispies cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000271045",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-corn-flakes-original",
    "name": "Kellogg's Corn Flakes",
    "displayName": "Kellogg's Corn Flakes",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Kellogg's Corn Flakes",
    "aliases": [
      "Corn Flakes",
      "Kellogg Corn Flakes",
      "cornflake cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.14,
      "protein": 7.14,
      "carbs": 85.71,
      "fat": 0.0,
      "sugar": 9.52,
      "sodium": 714.3,
      "fiber": 2.38,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/2 cups (42 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 42,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Kellogg's Corn Flakes",
      "productName": "Kellogg's Corn Flakes",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/2 cups (42 g)",
        "servingGrams": 42,
        "calories": 150,
        "protein": 3,
        "carbs": 36,
        "fat": 0,
        "sugar": 4,
        "sodium": 300,
        "fiber": 1,
        "saturatedFat": 0,
        "addedSugar": 4
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Corn Flakes cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000001208",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-raisin-bran-original",
    "name": "Kellogg's Raisin Bran",
    "displayName": "Kellogg's Raisin Bran",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Kellogg's Raisin Bran",
    "aliases": [
      "Raisin Bran",
      "Kellogg Raisin Bran"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 322.03,
      "protein": 8.47,
      "carbs": 79.66,
      "fat": 1.69,
      "sugar": 30.51,
      "sodium": 355.9,
      "fiber": 11.86,
      "potassium": 474.6,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (59 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 59,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Kellogg's Raisin Bran",
      "productName": "Kellogg's Raisin Bran",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (59 g)",
        "servingGrams": 59,
        "calories": 190,
        "protein": 5,
        "carbs": 47,
        "fat": 1,
        "sugar": 18,
        "sodium": 210,
        "fiber": 7,
        "potassium": 280,
        "saturatedFat": 0,
        "addedSugar": 9
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Raisin Bran Original cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000270840",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-kelloggs-special-k-original",
    "name": "Special K Original",
    "displayName": "Special K Original",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Special K",
    "aliases": [
      "Special K",
      "Special K Original cereal",
      "Kellogg Special K"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 384.62,
      "protein": 17.95,
      "carbs": 74.36,
      "fat": 1.28,
      "sugar": 12.82,
      "sodium": 692.3,
      "potassium": 25.6,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/4 cups (39 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 39,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Special K",
      "productName": "Special K Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/4 cups (39 g)",
        "servingGrams": 39,
        "calories": 150,
        "protein": 7,
        "carbs": 29,
        "fat": 0.5,
        "sugar": 5,
        "sodium": 270,
        "potassium": 10,
        "saturatedFat": 0,
        "addedSugar": 4
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Special K Original Cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000016219",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Manufacturer label reports dietary fiber as less than 1 g per serving. ARI does not convert that inequality into a fabricated exact per-100-g fiber number, so fiber is intentionally omitted from nutrition."
    }
  },
  {
    "id": "cereal-kelloggs-complete-bran",
    "name": "Kellogg's Complete Bran",
    "displayName": "Kellogg's Complete Bran",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Kellogg's Complete",
    "aliases": [
      "Complete Bran",
      "Kellogg Complete Bran",
      "bran cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "wk-kellogg-co"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324.32,
      "protein": 10.81,
      "carbs": 81.08,
      "fat": 2.7,
      "sugar": 18.92,
      "sodium": 702.7,
      "fiber": 16.22,
      "potassium": 513.5,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (37 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 37,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Kellogg's Complete",
      "productName": "Kellogg's Complete Bran",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (37 g)",
        "servingGrams": 37,
        "calories": 120,
        "protein": 4,
        "carbs": 30,
        "fat": 1,
        "sugar": 7,
        "sodium": 260,
        "fiber": 6,
        "potassium": 190,
        "saturatedFat": 0,
        "addedSugar": 6
      },
      "sourceProvenance": {
        "provider": "WK Kellogg SmartLabel",
        "sourceTitle": "Kellogg's Complete Bran Breakfast cereal",
        "sourceUrl": "https://smartlabel.wkkellogg.com/Product/Index?gtin=00038000293801",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-post-honey-bunches-oats-honey-roasted",
    "name": "Honey Bunches of Oats Honey Roasted",
    "displayName": "Honey Bunches of Oats Honey Roasted",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Honey Bunches of Oats",
    "aliases": [
      "Honey Bunches of Oats",
      "Honey Roasted Honey Bunches",
      "HBO honey roasted"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "post-consumer-brands"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 404.76,
      "protein": 7.14,
      "carbs": 78.57,
      "fat": 7.14,
      "sugar": 21.43,
      "sodium": 428.6,
      "fiber": 4.76,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (42 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 42,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Honey Bunches of Oats",
      "productName": "Honey Bunches of Oats Honey Roasted",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (42 g)",
        "servingGrams": 42,
        "calories": 170,
        "protein": 3,
        "carbs": 33,
        "fat": 3,
        "sugar": 9,
        "sodium": 180,
        "fiber": 2,
        "saturatedFat": 0,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Post FoodService Bulk Cereal â Honey Bunches of Oats Honey Roasted",
        "sourceUrl": "https://www.postconsumerbrands.com/wp-content/uploads/2024/09/2024-25_PostFoodService_BulkCereal.pdf",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-post-honey-bunches-oats-almonds",
    "name": "Honey Bunches of Oats with Almonds",
    "displayName": "Honey Bunches of Oats with Almonds",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Honey Bunches of Oats",
    "aliases": [
      "Honey Bunches of Oats Almonds",
      "HBO almonds",
      "Honey Bunches almonds"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "post-consumer-brands"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 404.76,
      "protein": 7.14,
      "carbs": 78.57,
      "fat": 7.14,
      "sugar": 21.43,
      "sodium": 428.6,
      "fiber": 4.76,
      "potassium": 214.3,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (42 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 42,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Honey Bunches of Oats",
      "productName": "Honey Bunches of Oats with Almonds",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (42 g)",
        "servingGrams": 42,
        "calories": 170,
        "protein": 3,
        "carbs": 33,
        "fat": 3,
        "sugar": 9,
        "sodium": 180,
        "fiber": 2,
        "potassium": 90,
        "saturatedFat": 0,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "provider": "Honey Bunches of Oats / Post Consumer Brands",
        "sourceTitle": "Honey Bunches of Oats with Almonds cereal",
        "sourceUrl": "https://www.honeybunchesofoats.com/product/honey-bunches-of-oats-with-almonds-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat",
        "almond"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-post-fruity-pebbles-original",
    "name": "Fruity PEBBLES",
    "displayName": "Fruity PEBBLES",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "PEBBLES",
    "aliases": [
      "Fruity Pebbles",
      "fruit pebbles cereal",
      "Pebbles fruity cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "post-consumer-brands"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 388.89,
      "protein": 2.78,
      "carbs": 86.11,
      "fat": 4.17,
      "sugar": 33.33,
      "sodium": 527.8,
      "fiber": 0.0,
      "potassium": 55.6,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (36 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 36,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "PEBBLES",
      "productName": "Fruity PEBBLES",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 1,
        "carbs": 31,
        "fat": 1.5,
        "sugar": 12,
        "sodium": 190,
        "fiber": 0,
        "potassium": 20,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "PEBBLES / Post Consumer Brands",
        "sourceTitle": "Fruity PEBBLES cereal",
        "sourceUrl": "https://www.pebblescereal.com/product/fruity-pebbles/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal-post-cocoa-pebbles-original",
    "name": "Cocoa PEBBLES",
    "displayName": "Cocoa PEBBLES",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "PEBBLES",
    "aliases": [
      "Cocoa Pebbles",
      "chocolate Pebbles cereal",
      "Pebbles cocoa cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "post-consumer-brands"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 388.89,
      "protein": 5.56,
      "carbs": 86.11,
      "fat": 4.17,
      "sugar": 33.33,
      "sodium": 611.1,
      "potassium": 166.7,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (36 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 36,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "PEBBLES",
      "productName": "Cocoa PEBBLES",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 2,
        "carbs": 31,
        "fat": 1.5,
        "sugar": 12,
        "sodium": 220,
        "potassium": 60,
        "saturatedFat": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands current product label",
        "sourceTitle": "Cocoa PEBBLES cereal",
        "sourceUrl": "https://www.smithsfoodanddrug.com/p/post-cocoa-pebbles-chocolate-cereal/0088491212951",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Current label reports dietary fiber as less than 1 g per serving. ARI intentionally omits an exact fiber value rather than converting '<1 g' into a fabricated number."
    }
  },
  {
    "id": "cereal-post-grape-nuts-original",
    "name": "Grape-Nuts Original",
    "displayName": "Grape-Nuts Original",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Grape-Nuts",
    "aliases": [
      "Grape Nuts",
      "Grape-Nuts",
      "Post Grape-Nuts"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "post-consumer-brands"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 344.83,
      "protein": 10.34,
      "carbs": 81.03,
      "fat": 1.72,
      "sugar": 8.62,
      "sodium": 482.8,
      "fiber": 12.07,
      "potassium": 448.3,
      "saturatedFat": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup (58 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 58,
        "isDefault": true
      },
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodCerealBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Grape-Nuts",
      "productName": "Grape-Nuts Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup (58 g)",
        "servingGrams": 58,
        "calories": 200,
        "protein": 6,
        "carbs": 47,
        "fat": 1,
        "sugar": 5,
        "sodium": 280,
        "fiber": 7,
        "potassium": 260,
        "saturatedFat": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Grape-Nuts / Post Consumer Brands",
        "sourceTitle": "Grape-Nuts Breakfast Cereal â The Original",
        "sourceUrl": "https://www.grapenuts.com/product/the-original/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sugar",
        "sodium",
        "fiber",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": false,
      "notes": "Nutrition is for cereal as packaged only. Milk is intentionally excluded and should be logged as a separate food. The canonical 100 g profile is mathematically scaled from the manufacturer or current package-label serving stored in metadata.labelNutrition."
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

  function grainControllerExpectsThisModule() {
    if (!global.AriFoodGrains) {
      return false;
    }

    if (
      typeof global.AriFoodGrains.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodGrains.isExpectedModule(MODULE_NAME);
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
      global.AriFoodGrains &&
      grainControllerExpectsThisModule() &&
      typeof global.AriFoodGrains.markModuleFailed === "function"
    ) {
      global.AriFoodGrains.markModuleFailed(
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

  // Remove prior records from this exact module during hot reload.
  if (
    typeof registry.getBySource === "function" &&
    typeof registry.remove === "function"
  ) {
    try {
      const existing =
        registry.getBySource(
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior module records.`,
        error
      );
    }
  }

  const registration =
    registry.registerMany(
      ARI_CEREAL_BRAND_FOODS,
      {
        source: MODULE_NAME
      }
    );

  const moduleResult = {
    registered: registration.registered || 0,
    replaced: registration.replaced || 0,
    rejected: registration.rejected || 0,
    duplicates: registration.duplicates || 0,

    metadata: {
      version: VERSION,
      verifiedAt: VERIFIED_AT,
      foodCount: ARI_CEREAL_BRAND_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),

      manufacturers: [
        "General Mills",
        "WK Kellogg Co",
        "Post Consumer Brands"
      ]
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} cereal-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodGrains &&
    grainControllerExpectsThisModule() &&
    typeof global.AriFoodGrains.markModuleLoaded === "function"
  ) {
    global.AriFoodGrains.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  } else if (global.AriFoodGrains) {
    console.warn(
      `[ARI Nutrition] ${MODULE_NAME} registered successfully, but the current AriFoodGrains controller does not yet list ${MODULE_NAME} as an expected module. Update AriFoodGrains.js to include it.`
    );
  }

  global.AriFoodCerealBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CEREAL_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_CEREAL_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_CEREAL_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getManufacturers() {
        return Array.from(
          new Set(
            ARI_CEREAL_BRAND_FOODS.map(
              food => food.metadata.manufacturer
            )
          )
        );
      },

      getByManufacturer(manufacturer) {
        const target =
          String(manufacturer || "")
            .trim()
            .toLowerCase();

        return ARI_CEREAL_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata.manufacturer || ""
              ).toLowerCase() === target
          )
          .map(clone);
      },

      getLabelNutrition(foodId) {
        const record =
          ARI_CEREAL_BRAND_FOODS.find(
            food =>
              food.id === String(foodId || "").trim()
          );

        return record
          ? clone(record.metadata.labelNutrition)
          : null;
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_CEREAL_BRAND_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRegistrationResult() {
        return clone(registration);
      },

      getIntegrationStatus() {
        return {
          grainControllerAvailable:
            Boolean(global.AriFoodGrains),

          expectedByCurrentGrainController:
            grainControllerExpectsThisModule(),

          registeredFoodCount:
            ARI_CEREAL_BRAND_FOODS.length
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-cereal-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_CEREAL_BRAND_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CEREAL_BRAND_FOODS.length} branded cereal records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
