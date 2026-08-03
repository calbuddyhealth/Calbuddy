// =====================================================
// ARI REBIRTH
// File: AriFoodCerealBrands2.js
// Version: 1.0.0
//
// Purpose:
//   Second branded cereal expansion pack for
//   ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Relationship:
//   AriFoodCerealBrands.js  = branded cereal pack 1
//   AriFoodCerealBrands2.js = branded cereal pack 2
//
// Coverage:
//   20 ADDITIONAL branded cereal products.
//   There are no intentional product duplicates from
//   AriFoodCerealBrands.js.
//
// Nutrition policy:
//   - Package/manufacturer serving is the default.
//   - Milk is NOT included.
//   - Canonical values are stored per 100 g.
//   - Exact label values are preserved separately.
//   - Manufacturer sources are preferred.
//   - Retail label transcriptions are fallback sources.
//
// Verified snapshot:
//   2026-08-03
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodCerealBrands2(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCerealBrands2";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "selectionBasis": "Second expansion pack of 20 highly recognizable U.S. cereal products. No product duplicates from AriFoodCerealBrands.js. This is a practical recognition/popularity set rather than a claim of an exact national sales ranking.",
  "primaryHierarchy": [
    "Direct manufacturer product/nutrition page",
    "Current U.S. retailer transcription of manufacturer package Nutrition Facts"
  ],
  "rules": [
    "Do not duplicate products already owned by AriFoodCerealBrands.js.",
    "Use the labeled cereal-only serving as the default serving.",
    "Do not include milk in stored cereal nutrition.",
    "Store the exact package-label serving in metadata.labelNutrition.",
    "Derive the canonical 100 g profile mathematically from the labeled serving.",
    "Preserve brand and manufacturer separately.",
    "Manufacturer nutrition pages outrank retailer label transcriptions.",
    "A newer product label supersedes this offline snapshot when the module is refreshed.",
    "No runtime internet connection is required after authoring."
  ]
}
  );

  const ARI_CEREAL_BRANDS_2 =
    [
  {
    "id": "cereal2-cocoa-puffs",
    "name": "Cocoa Puffs",
    "displayName": "Cocoa Puffs",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cocoa Puffs",
    "aliases": [
      "Cocoa Puffs cereal",
      "chocolate puffs cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 100,
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
      "fat": 5.56,
      "fiber": 5.56,
      "sugar": 33.33,
      "sodium": 361.1,
      "saturatedFat": 0.0,
      "potassium": 277.8
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Cocoa Puffs",
      "productName": "Cocoa Puffs",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 2,
        "carbs": 31,
        "fat": 2,
        "fiber": 2,
        "sugar": 12,
        "sodium": 130,
        "saturatedFat": 0,
        "potassium": 100,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Cocoa Puffs Giant Size Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-79502259",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-cookie-crisp",
    "name": "Cookie Crisp",
    "displayName": "Cookie Crisp",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cookie Crisp",
    "aliases": [
      "Cookie Crisp cereal",
      "chocolate chip cookie cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 95,
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
      "fiber": 5.56,
      "sugar": 33.33,
      "sodium": 527.8,
      "saturatedFat": 0.0,
      "potassium": 277.8
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Cookie Crisp",
      "productName": "Cookie Crisp",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 2,
        "carbs": 31,
        "fat": 1.5,
        "fiber": 2,
        "sugar": 12,
        "sodium": 190,
        "saturatedFat": 0,
        "potassium": 100,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Cookie Crisp Cereal Family Size",
        "sourceUrl": "https://www.target.com/p/-/A-81902376",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-golden-grahams",
    "name": "Golden Grahams",
    "displayName": "Golden Grahams",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Golden Grahams",
    "aliases": [
      "Golden Grahams cereal",
      "graham cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375.0,
      "protein": 5.0,
      "carbs": 85.0,
      "fat": 5.0,
      "fiber": 5.0,
      "sugar": 30.0,
      "sodium": 725.0,
      "saturatedFat": 0.0,
      "potassium": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (40 g)",
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Golden Grahams",
      "productName": "Golden Grahams",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (40 g)",
        "servingGrams": 40,
        "calories": 150,
        "protein": 2,
        "carbs": 34,
        "fat": 2,
        "fiber": 2,
        "sugar": 12,
        "sodium": 290,
        "saturatedFat": 0,
        "potassium": 0,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "General Mills Golden Grahams Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-81875685",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-fiber-one-original-bran",
    "name": "Fiber One Original Bran",
    "displayName": "Fiber One Original Bran",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Fiber One",
    "aliases": [
      "Fiber One cereal",
      "Fiber One bran",
      "Fiber 1 cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 225.0,
      "protein": 7.5,
      "carbs": 82.5,
      "fat": 2.5,
      "fiber": 45.0,
      "sugar": 2.5,
      "sodium": 350.0,
      "saturatedFat": 0.0,
      "potassium": 0.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "2/3 cup (40 g)",
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Fiber One",
      "productName": "Fiber One Original Bran",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "2/3 cup (40 g)",
        "servingGrams": 40,
        "calories": 90,
        "protein": 3,
        "carbs": 33,
        "fat": 1,
        "fiber": 18,
        "sugar": 1,
        "sodium": 140,
        "saturatedFat": 0,
        "potassium": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Fiber One Original Bran Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-78364794",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-wheaties-classic",
    "name": "Wheaties",
    "displayName": "Wheaties",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Wheaties",
    "aliases": [
      "Wheaties cereal",
      "Breakfast of Champions"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 361.11,
      "protein": 8.33,
      "carbs": 83.33,
      "fat": 1.39,
      "fiber": 11.11,
      "sugar": 13.89,
      "sodium": 666.7,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Wheaties",
      "productName": "Wheaties",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (36 g)",
        "servingGrams": 36,
        "calories": 130,
        "protein": 3,
        "carbs": 30,
        "fat": 0.5,
        "fiber": 4,
        "sugar": 5,
        "sodium": 240,
        "saturatedFat": 0,
        "addedSugar": 5
      },
      "sourceProvenance": {
        "provider": "Wheaties / General Mills",
        "sourceTitle": "Wheaties Nutrition",
        "sourceUrl": "https://wheaties.com/nutrition",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-motts-apple-cinnamon",
    "name": "Mott's Apple Cinnamon Cereal",
    "displayName": "Mott's Apple Cinnamon Cereal",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Mott's",
    "aliases": [
      "Motts cereal",
      "Mott's apple cereal",
      "apple cinnamon cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 84,
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
      "fiber": 5.13,
      "sugar": 23.08,
      "sodium": 487.2,
      "saturatedFat": 0.0,
      "potassium": 0.0
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "General Mills",
      "brand": "Mott's",
      "productName": "Mott's Apple Cinnamon Cereal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/4 cups (39 g)",
        "servingGrams": 39,
        "calories": 150,
        "protein": 2,
        "carbs": 34,
        "fat": 1.5,
        "fiber": 2,
        "sugar": 9,
        "sodium": 190,
        "saturatedFat": 0,
        "potassium": 0,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Mott's Apple Cinnamon Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-94887116",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Current label states the product may contain wheat ingredients. Milk shown in serving suggestions is not included in ARI nutrition."
    }
  },
  {
    "id": "cereal2-life-original",
    "name": "Life Original",
    "displayName": "Life Original",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Life",
    "aliases": [
      "Life cereal",
      "Quaker Life",
      "Original Life cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380.95,
      "protein": 9.52,
      "carbs": 78.57,
      "fat": 4.76,
      "fiber": 7.14,
      "sugar": 23.81,
      "sodium": 404.8,
      "saturatedFat": 0.0,
      "potassium": 261.9
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Quaker Oats",
      "brand": "Life",
      "productName": "Life Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (42 g)",
        "servingGrams": 42,
        "calories": 160,
        "protein": 4,
        "carbs": 33,
        "fat": 2,
        "fiber": 3,
        "sugar": 10,
        "sodium": 170,
        "saturatedFat": 0,
        "potassium": 110,
        "addedSugar": 10
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Quaker Life Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-94743168",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-quaker-oatmeal-squares-brown-sugar",
    "name": "Quaker Oatmeal Squares Brown Sugar",
    "displayName": "Quaker Oatmeal Squares Brown Sugar",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Quaker",
    "aliases": [
      "Oatmeal Squares",
      "Quaker Squares",
      "brown sugar oat squares"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.86,
      "protein": 10.71,
      "carbs": 78.57,
      "fat": 4.46,
      "fiber": 8.93,
      "sugar": 16.07,
      "sodium": 339.3,
      "saturatedFat": 0.89,
      "potassium": 339.3
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (56 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 56,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Oatmeal Squares Brown Sugar",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (56 g)",
        "servingGrams": 56,
        "calories": 220,
        "protein": 6,
        "carbs": 44,
        "fat": 2.5,
        "fiber": 5,
        "sugar": 9,
        "sodium": 190,
        "saturatedFat": 0.5,
        "potassium": 190,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Quaker Oatmeal Squares Brown Sugar Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-81576370",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-capn-crunch-original",
    "name": "Cap'n Crunch Original",
    "displayName": "Cap'n Crunch Original",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cap'n Crunch",
    "aliases": [
      "Captain Crunch",
      "Capn Crunch",
      "original Cap'n Crunch"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 394.74,
      "protein": 5.26,
      "carbs": 86.84,
      "fat": 5.26,
      "fiber": 2.63,
      "sugar": 42.11,
      "sodium": 763.2,
      "saturatedFat": 2.63,
      "potassium": 131.6
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "38 g",
        "amount": 1,
        "unit": "serving",
        "grams": 38,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Quaker Oats",
      "brand": "Cap'n Crunch",
      "productName": "Cap'n Crunch Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "38 g",
        "servingGrams": 38,
        "calories": 150,
        "protein": 2,
        "carbs": 33,
        "fat": 2,
        "fiber": 1,
        "sugar": 16,
        "sodium": 290,
        "saturatedFat": 1,
        "potassium": 50,
        "addedSugar": 16
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Cap'n Crunch Original Family Size Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-82439084",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-capn-crunch-crunch-berries",
    "name": "Cap'n Crunch Crunch Berries",
    "displayName": "Cap'n Crunch Crunch Berries",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cap'n Crunch",
    "aliases": [
      "Crunch Berries",
      "Captain Crunch Berries",
      "Capn Crunch Berries"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 5.0,
      "carbs": 85.0,
      "fat": 5.0,
      "fiber": 2.5,
      "sugar": 42.5,
      "sodium": 725.0,
      "saturatedFat": 2.5,
      "potassium": 150.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "40 g",
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Quaker Oats",
      "brand": "Cap'n Crunch",
      "productName": "Cap'n Crunch Crunch Berries",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "40 g",
        "servingGrams": 40,
        "calories": 160,
        "protein": 2,
        "carbs": 34,
        "fat": 2,
        "fiber": 1,
        "sugar": 17,
        "sodium": 290,
        "saturatedFat": 1,
        "potassium": 60,
        "addedSugar": 17
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Cap'n Crunch Crunch Berries Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-94270014",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-capn-crunch-peanut-butter",
    "name": "Cap'n Crunch Peanut Butter Crunch",
    "displayName": "Cap'n Crunch Peanut Butter Crunch",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Cap'n Crunch",
    "aliases": [
      "Peanut Butter Crunch",
      "Capn Crunch peanut butter",
      "Captain Crunch PB"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 425.0,
      "protein": 7.5,
      "carbs": 80.0,
      "fat": 8.75,
      "fiber": 2.5,
      "sugar": 32.5,
      "sodium": 750.0,
      "saturatedFat": 3.75,
      "potassium": 175.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (40 g)",
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Quaker Oats",
      "brand": "Cap'n Crunch",
      "productName": "Cap'n Crunch Peanut Butter Crunch",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (40 g)",
        "servingGrams": 40,
        "calories": 170,
        "protein": 3,
        "carbs": 32,
        "fat": 3.5,
        "fiber": 1,
        "sugar": 13,
        "sodium": 300,
        "saturatedFat": 1.5,
        "potassium": 70,
        "addedSugar": 13
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Cap'n Crunch Peanut Butter Crunch Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-85381186",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "peanut"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-apple-jacks",
    "name": "Kellogg's Apple Jacks",
    "displayName": "Kellogg's Apple Jacks",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Apple Jacks",
    "aliases": [
      "Apple Jacks cereal",
      "apple cinnamon cereal Kellogg's"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
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
      "fiber": 7.69,
      "sugar": 33.33,
      "sodium": 538.5,
      "saturatedFat": 1.28,
      "potassium": 128.2
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Apple Jacks",
      "productName": "Kellogg's Apple Jacks",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/3 cups (39 g)",
        "servingGrams": 39,
        "calories": 150,
        "protein": 2,
        "carbs": 34,
        "fat": 1.5,
        "fiber": 3,
        "sugar": 13,
        "sodium": 210,
        "saturatedFat": 0.5,
        "potassium": 50,
        "addedSugar": 13
      },
      "sourceProvenance": {
        "provider": "Kroger current U.S. package-label transcription",
        "sourceTitle": "Kellogg's Apple Jacks Cereal",
        "sourceUrl": "https://www.kroger.com/p/kellogg-sa-apple-jacks-cereal/0004119210037",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-corn-pops",
    "name": "Kellogg's Corn Pops",
    "displayName": "Kellogg's Corn Pops",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Corn Pops",
    "aliases": [
      "Corn Pops cereal",
      "Kellogg Corn Pops"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375.0,
      "protein": 5.0,
      "carbs": 90.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 37.5,
      "sodium": 400.0,
      "saturatedFat": 0.0,
      "potassium": 75.0
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Corn Pops",
      "productName": "Kellogg's Corn Pops",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/3 cups (40 g)",
        "servingGrams": 40,
        "calories": 150,
        "protein": 2,
        "carbs": 36,
        "fat": 0,
        "fiber": 0,
        "sugar": 15,
        "sodium": 160,
        "saturatedFat": 0,
        "potassium": 30,
        "addedSugar": 15
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Kellogg's Corn Pops Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-94967100",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-frosted-mini-wheats-original",
    "name": "Kellogg's Frosted Mini-Wheats Original",
    "displayName": "Kellogg's Frosted Mini-Wheats Original",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Frosted Mini-Wheats",
    "aliases": [
      "Mini Wheats",
      "Frosted Mini Wheats",
      "original Mini-Wheats"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 350.0,
      "protein": 8.33,
      "carbs": 85.0,
      "fat": 2.5,
      "fiber": 10.0,
      "sugar": 20.0,
      "sodium": 16.7,
      "saturatedFat": 0.0,
      "potassium": 266.7
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "25 biscuits (60 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 60,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Frosted Mini-Wheats",
      "productName": "Kellogg's Frosted Mini-Wheats Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "25 biscuits (60 g)",
        "servingGrams": 60,
        "calories": 210,
        "protein": 5,
        "carbs": 51,
        "fat": 1.5,
        "fiber": 6,
        "sugar": 12,
        "sodium": 10,
        "saturatedFat": 0,
        "potassium": 160,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Kellogg's Original Frosted Mini-Wheats Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-13361816",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-special-k-red-berries",
    "name": "Special K Red Berries",
    "displayName": "Special K Red Berries",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Special K",
    "aliases": [
      "Special K berries",
      "Special K strawberry cereal",
      "Red Berries cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 358.97,
      "protein": 7.69,
      "carbs": 87.18,
      "fat": 1.28,
      "fiber": 7.69,
      "sugar": 28.21,
      "sodium": 641.0,
      "saturatedFat": 0.0,
      "potassium": 205.1
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "WK Kellogg Co",
      "brand": "Special K",
      "productName": "Special K Red Berries",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (39 g)",
        "servingGrams": 39,
        "calories": 140,
        "protein": 3,
        "carbs": 34,
        "fat": 0.5,
        "fiber": 3,
        "sugar": 11,
        "sodium": 250,
        "saturatedFat": 0,
        "potassium": 80,
        "addedSugar": 10
      },
      "sourceProvenance": {
        "provider": "Target current U.S. package-label transcription",
        "sourceTitle": "Kellogg's Special K Red Berries Breakfast Cereal",
        "sourceUrl": "https://www.target.com/p/-/A-12918878",
        "sourceTier": "current-retail-label",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-post-honeycomb",
    "name": "Honey-Comb Cereal",
    "displayName": "Honey-Comb Cereal",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Honey-Comb",
    "aliases": [
      "Honeycomb cereal",
      "Post Honeycomb",
      "Honey Comb cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 5.0,
      "carbs": 87.5,
      "fat": 2.5,
      "fiber": 2.5,
      "sugar": 32.5,
      "sodium": 475.0,
      "saturatedFat": 0.0,
      "potassium": 125.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 3/4 cups (40 g)",
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Honey-Comb",
      "productName": "Honey-Comb Cereal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 3/4 cups (40 g)",
        "servingGrams": 40,
        "calories": 160,
        "protein": 2,
        "carbs": 35,
        "fat": 1,
        "fiber": 1,
        "sugar": 13,
        "sodium": 190,
        "saturatedFat": 0,
        "potassium": 50,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Honey-Comb Cereal",
        "sourceUrl": "https://www.postconsumerbrands.com/brands/honeycomb/products/honeycomb-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-post-golden-crisp",
    "name": "Golden Crisp",
    "displayName": "Golden Crisp",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Golden Crisp",
    "aliases": [
      "Post Golden Crisp",
      "Sugar Crisp",
      "Golden Crisp cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 394.74,
      "protein": 5.26,
      "carbs": 89.47,
      "fat": 1.32,
      "fiber": 0.0,
      "sugar": 55.26,
      "sodium": 223.7,
      "saturatedFat": 0.0,
      "potassium": 184.2
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 cup (38 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 38,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Golden Crisp",
      "productName": "Golden Crisp",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (38 g)",
        "servingGrams": 38,
        "calories": 150,
        "protein": 2,
        "carbs": 34,
        "fat": 0.5,
        "fiber": 0,
        "sugar": 21,
        "sodium": 85,
        "saturatedFat": 0,
        "potassium": 70,
        "addedSugar": 21
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Golden Crisp Cereal",
        "sourceUrl": "https://www.postconsumerbrands.com/brands/golden-crisp/products/golden-crisp-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-post-shredded-wheat-original-spoon-size",
    "name": "Post Shredded Wheat Original Spoon Size",
    "displayName": "Post Shredded Wheat Original Spoon Size",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Shredded Wheat",
    "aliases": [
      "Shredded Wheat",
      "Post Shredded Wheat",
      "Spoon Size Shredded Wheat"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 350.0,
      "protein": 11.67,
      "carbs": 81.67,
      "fat": 1.67,
      "fiber": 13.33,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 0.0,
      "potassium": 350.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 1/3 cups (60 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 60,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Shredded Wheat",
      "productName": "Post Shredded Wheat Original Spoon Size",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 1/3 cups (60 g)",
        "servingGrams": 60,
        "calories": 210,
        "protein": 7,
        "carbs": 49,
        "fat": 1,
        "fiber": 8,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 0,
        "potassium": 210,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Shredded Wheat Original Spoon Size Cereal",
        "sourceUrl": "https://www.postconsumerbrands.com/brands/shredded-wheat/products/shredded-wheat-original-spoon-size-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-post-great-grains-rdp",
    "name": "Great Grains Raisins, Dates & Pecans",
    "displayName": "Great Grains Raisins, Dates & Pecans",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Great Grains",
    "aliases": [
      "Great Grains RDP",
      "Raisins Dates Pecans cereal",
      "Great Grains pecan cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 370.37,
      "protein": 7.41,
      "carbs": 74.07,
      "fat": 7.41,
      "fiber": 7.41,
      "sugar": 24.07,
      "sodium": 259.3,
      "saturatedFat": 0.0,
      "potassium": 388.9
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "3/4 cup (54 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 54,
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Great Grains",
      "productName": "Great Grains Raisins, Dates & Pecans",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "3/4 cup (54 g)",
        "servingGrams": 54,
        "calories": 200,
        "protein": 4,
        "carbs": 40,
        "fat": 4,
        "fiber": 4,
        "sugar": 13,
        "sodium": 140,
        "saturatedFat": 0,
        "potassium": 210,
        "addedSugar": 4
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Great Grains Raisins, Dates & Pecans",
        "sourceUrl": "https://www.postconsumerbrands.com/brands/great-grains/products/great-grains-raisins-dates-pecans-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat",
        "pecan"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
    }
  },
  {
    "id": "cereal2-moms-best-honey-grahams",
    "name": "Mom's Best Honey Grahams",
    "displayName": "Mom's Best Honey Grahams",
    "category": "grain",
    "state": "ready-to-eat",
    "preparation": "as-packaged",
    "brand": "Mom's Best",
    "aliases": [
      "Moms Best Honey Grahams",
      "Honey Grahams cereal",
      "Mom's Best graham cereal"
    ],
    "tags": [
      "grain",
      "cereal",
      "branded-cereal",
      "cereal-brands-2"
    ],
    "popularity": 80,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 404.76,
      "protein": 4.76,
      "carbs": 76.19,
      "fat": 10.71,
      "fiber": 4.76,
      "sugar": 33.33,
      "sodium": 857.1,
      "saturatedFat": 0.0,
      "potassium": 261.9
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
    "source": "AriFoodCerealBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "cereal",
      "manufacturer": "Post Consumer Brands",
      "brand": "Mom's Best",
      "productName": "Mom's Best Honey Grahams",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, derived from labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 cup (42 g)",
        "servingGrams": 42,
        "calories": 170,
        "protein": 2,
        "carbs": 32,
        "fat": 4.5,
        "fiber": 2,
        "sugar": 14,
        "sodium": 360,
        "saturatedFat": 0,
        "potassium": 110,
        "addedSugar": 14
      },
      "sourceProvenance": {
        "provider": "Post Consumer Brands",
        "sourceTitle": "Mom's Best Honey Grahams Cereal",
        "sourceUrl": "https://www.postconsumerbrands.com/brands/moms-best-cereals/products/honey-grahams-cereal/",
        "sourceTier": "manufacturer",
        "verifiedAt": "2026-08-03"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "saturatedFat",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": true,
      "milkIncluded": false,
      "allergens": [
        "wheat",
        "soy"
      ],
      "glutenFreeLabel": null,
      "notes": "Nutrition is for cereal as packaged only. Milk is not included. The canonical 100 g profile is mathematically scaled from the current labeled serving preserved in metadata.labelNutrition."
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
        return global.AriFoodGrains.isExpectedModule(
          MODULE_NAME
        );
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  function reportFailure(
    message,
    metadata = {}
  ) {
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

  const registry =
    global.AriFoodRegistry;

  if (
    !registry ||
    typeof registry.registerMany !== "function"
  ) {
    reportFailure(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

  // Clear only records owned by this exact module.
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
            registry.remove(
              food.id
            );
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
      ARI_CEREAL_BRANDS_2,
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
        ARI_CEREAL_BRANDS_2.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      manufacturers: [
        "General Mills",
        "Quaker Oats",
        "WK Kellogg Co",
        "Post Consumer Brands"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} cereal-brand-2 record(s).`,
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
  } else if (
    global.AriFoodGrains
  ) {
    console.warn(
      `[ARI Nutrition] ${MODULE_NAME} registered successfully, but AriFoodGrains does not currently list it as an expected module.`
    );
  }

  global.AriFoodCerealBrands2 =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CEREAL_BRANDS_2.length;
      },

      getFoodIds() {
        return ARI_CEREAL_BRANDS_2.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_CEREAL_BRANDS_2.map(
              food => food.brand
            )
          )
        );
      },

      getManufacturers() {
        return Array.from(
          new Set(
            ARI_CEREAL_BRANDS_2.map(
              food =>
                food.metadata.manufacturer
            )
          )
        );
      },

      getByManufacturer(manufacturer) {
        const target =
          String(manufacturer || "")
            .trim()
            .toLowerCase();

        return ARI_CEREAL_BRANDS_2
          .filter(
            food =>
              String(
                food.metadata.manufacturer || ""
              ).toLowerCase() === target
          )
          .map(clone);
      },

      getByBrand(brandName) {
        const target =
          String(brandName || "")
            .trim()
            .toLowerCase();

        return ARI_CEREAL_BRANDS_2
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === target
          )
          .map(clone);
      },

      getLabelNutrition(foodId) {
        const record =
          ARI_CEREAL_BRANDS_2.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? clone(
              record.metadata.labelNutrition
            )
          : null;
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_CEREAL_BRANDS_2.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getSourcePolicy() {
        return clone(
          SOURCE_POLICY
        );
      },

      getRegistrationResult() {
        return clone(
          registration
        );
      },

      getIntegrationStatus() {
        return {
          grainControllerAvailable:
            Boolean(
              global.AriFoodGrains
            ),

          expectedByCurrentGrainController:
            grainControllerExpectsThisModule(),

          registeredFoodCount:
            ARI_CEREAL_BRANDS_2.length
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-cereal-brands-2-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_CEREAL_BRANDS_2.length,
            runtimeInternetRequired: false,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CEREAL_BRANDS_2.length} additional branded cereal records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
