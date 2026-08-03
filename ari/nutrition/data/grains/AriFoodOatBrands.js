// =====================================================
// ARI REBIRTH
// File: AriFoodOatBrands.js
// Version: 1.0.0
//
// Purpose:
//   Offline branded oat and oatmeal reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Architecture:
//   This file lives directly in:
//     ari/nutrition/data/grains/
//
//   There is NO separate branded-grains directory.
//
// Coverage:
//   20 recognizable branded oat products:
//   - 8 Quaker products
//   - 12 Bob's Red Mill products
//
// Core nutrition policy:
//   - Manufacturer/package serving is the default.
//   - Canonical nutrition is mathematically derived
//     per 100 g for AriFoodCalculator scaling.
//   - Exact label serving nutrition is preserved in
//     metadata.labelNutrition.
//   - Milk is NEVER automatically included.
//   - Water is not treated as a separate calorie source.
//   - Toppings/add-ins remain separate foods.
//
// Important:
//   Product formulations can change.
//   Snapshot verified: 2026-08-03.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodOatBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodOatBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "selectionBasis": "Twenty highly recognizable U.S. oat and oatmeal products, weighted toward Quaker as the dominant mainstream oat brand and supplemented by major Bob's Red Mill oat products. This is a practical starter set, not a claim of a mathematically exact national sales ranking.",
  "primaryHierarchy": [
    "Direct manufacturer nutrition/product page",
    "Current U.S. retailer transcription of the package Nutrition Facts panel when the manufacturer page does not expose complete nutrition text",
    "Manufacturer product catalog/page used to verify current product identity"
  ],
  "rules": [
    "Store the exact labeled as-packaged serving in metadata.labelNutrition.",
    "Derive canonical nutrition per 100 g mathematically from the labeled gram serving.",
    "Do not create with-milk or with-water variants.",
    "Water used for preparation contributes no calories and is not stored as part of the dry product.",
    "Milk used for preparation is a separate food and must be logged separately.",
    "Fruit, nuts, syrup, sugar, protein powder, peanut butter, and other toppings are separate foods unless already ingredients in the branded product.",
    "Do not assume all Quaker oat packages are certified gluten-free; only specially marked gluten-free products should receive glutenFreeLabel=true.",
    "Preserve milk allergen metadata for Quaker Fruit & Cream products because dairy ingredients are already present in the dry packet.",
    "Product formulations and serving sizes can change; a newer package/manufacturer label supersedes this offline snapshot.",
    "No runtime internet connection is required after authoring."
  ]
}
  );

  const ARI_OAT_BRAND_FOODS =
    [
  {
    "id": "oat-brand-quaker-old-fashioned",
    "name": "Quaker Old Fashioned Oats",
    "displayName": "Quaker Old Fashioned Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Oats",
      "Quaker Old Fashioned",
      "Quaker rolled oats",
      "Old Fashioned Quaker Oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375.0,
      "protein": 12.5,
      "carbs": 67.5,
      "fat": 7.5,
      "fiber": 10.0,
      "sugar": 2.5,
      "sodium": 0.0,
      "saturatedFat": 1.25,
      "potassium": 375.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup dry (40 g)",
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Old Fashioned Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup dry (40 g)",
        "servingGrams": 40,
        "calories": 150,
        "protein": 5,
        "carbs": 27,
        "fat": 3,
        "fiber": 4,
        "sugar": 1,
        "sodium": 0,
        "saturatedFat": 0.5,
        "potassium": 150,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Oats Old Fashioned Oats - 42oz",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331320",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/",
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Current package label for Quaker Old Fashioned Oats. Quaker notes that only specially marked packages should be treated as gluten-free."
    }
  },
  {
    "id": "oat-brand-quaker-quick-1-minute",
    "name": "Quaker Quick 1-Minute Oats",
    "displayName": "Quaker Quick 1-Minute Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Quick Oats",
      "Quaker 1 Minute Oats",
      "Quaker quick cooking oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375.0,
      "protein": 12.5,
      "carbs": 67.5,
      "fat": 7.5,
      "fiber": 10.0,
      "sugar": 2.5,
      "sodium": 0.0,
      "saturatedFat": 1.25,
      "potassium": 375.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup dry (40 g)",
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Quick 1-Minute Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup dry (40 g)",
        "servingGrams": 40,
        "calories": 150,
        "protein": 5,
        "carbs": 27,
        "fat": 3,
        "fiber": 4,
        "sugar": 1,
        "sodium": 0,
        "saturatedFat": 0.5,
        "potassium": 150,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Whole Grain Quick 1-Minute Oats - 42oz",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331304",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products",
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Current package label for Quaker Quick 1-Minute Oats. Preparation water is not included in product calories."
    }
  },
  {
    "id": "oat-brand-quaker-instant-original",
    "name": "Quaker Instant Oatmeal Original",
    "displayName": "Quaker Instant Oatmeal Original",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Instant Original",
      "Quaker plain instant oatmeal",
      "Quaker original oatmeal packet"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.14,
      "protein": 14.29,
      "carbs": 67.86,
      "fat": 7.14,
      "fiber": 10.71,
      "sugar": 0.0,
      "sodium": 267.9,
      "saturatedFat": 1.79,
      "potassium": 357.1
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (28 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 28,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Original",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (28 g)",
        "servingGrams": 28,
        "calories": 100,
        "protein": 4,
        "carbs": 19,
        "fat": 2,
        "fiber": 3,
        "sugar": 0,
        "sodium": 75,
        "saturatedFat": 0.5,
        "potassium": 100,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Instant Oatmeal Original",
        "labelSourceUrl": "https://www.target.com/p/-/A-89438113",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal",
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-quaker-instant-maple-brown-sugar",
    "name": "Quaker Instant Oatmeal Maple & Brown Sugar",
    "displayName": "Quaker Instant Oatmeal Maple & Brown Sugar",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Maple Brown Sugar",
      "Quaker maple oatmeal",
      "Quaker brown sugar oatmeal"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 372.09,
      "protein": 9.3,
      "carbs": 76.74,
      "fat": 4.65,
      "fiber": 6.98,
      "sugar": 27.91,
      "sodium": 511.6,
      "saturatedFat": 1.16,
      "potassium": 348.8
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (43 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 43,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Maple & Brown Sugar",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (43 g)",
        "servingGrams": 43,
        "calories": 160,
        "protein": 4,
        "carbs": 33,
        "fat": 2,
        "fiber": 3,
        "sugar": 12,
        "sodium": 220,
        "saturatedFat": 0.5,
        "potassium": 150,
        "addedSugar": 12
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Instant Maple and Brown Sugar Flavored Oatmeal",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331293",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal",
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-quaker-instant-apples-cinnamon",
    "name": "Quaker Instant Oatmeal Apples & Cinnamon",
    "displayName": "Quaker Instant Oatmeal Apples & Cinnamon",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Apple Cinnamon",
      "Quaker Apples Cinnamon",
      "Quaker apple oatmeal"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 372.09,
      "protein": 9.3,
      "carbs": 76.74,
      "fat": 4.65,
      "fiber": 9.3,
      "sugar": 25.58,
      "sodium": 372.1,
      "saturatedFat": 1.16,
      "potassium": 325.6
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (43 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 43,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Apples & Cinnamon",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (43 g)",
        "servingGrams": 43,
        "calories": 160,
        "protein": 4,
        "carbs": 33,
        "fat": 2,
        "fiber": 4,
        "sugar": 11,
        "sodium": 160,
        "saturatedFat": 0.5,
        "potassium": 140,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Instant Oatmeal Apple Cinnamon",
        "labelSourceUrl": "https://www.target.com/p/-/A-86434939",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal",
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": null,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-quaker-instant-strawberries-cream",
    "name": "Quaker Instant Oatmeal Strawberries & Cream",
    "displayName": "Quaker Instant Oatmeal Strawberries & Cream",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Strawberries and Cream",
      "Quaker strawberry oatmeal",
      "Quaker fruit and cream strawberry"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 366.67,
      "protein": 10.0,
      "carbs": 76.67,
      "fat": 6.67,
      "fiber": 6.67,
      "sugar": 26.67,
      "sodium": 500.0,
      "saturatedFat": 1.67,
      "potassium": 300.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (30 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 30,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Strawberries & Cream",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (30 g)",
        "servingGrams": 30,
        "calories": 110,
        "protein": 3,
        "carbs": 23,
        "fat": 2,
        "fiber": 2,
        "sugar": 8,
        "sodium": 150,
        "saturatedFat": 0.5,
        "potassium": 90,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Fruit & Cream Instant Oatmeal Variety",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331295",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal",
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
      "preparedWaterIncluded": false,
      "allergens": [
        "milk"
      ],
      "glutenFreeLabel": null,
      "notes": "The dry packet contains dairy ingredients. Milk added during preparation is still not included. Nutrition is for the Strawberries & Cream packet itself."
    }
  },
  {
    "id": "oat-brand-quaker-instant-peaches-cream",
    "name": "Quaker Instant Oatmeal Peaches & Cream",
    "displayName": "Quaker Instant Oatmeal Peaches & Cream",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Peaches and Cream",
      "Quaker peach oatmeal",
      "Quaker fruit and cream peaches"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 366.67,
      "protein": 10.0,
      "carbs": 76.67,
      "fat": 6.67,
      "fiber": 6.67,
      "sugar": 30.0,
      "sodium": 533.3,
      "saturatedFat": 1.67
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (30 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 30,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Peaches & Cream",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (30 g)",
        "servingGrams": 30,
        "calories": 110,
        "protein": 3,
        "carbs": 23,
        "fat": 2,
        "fiber": 2,
        "sugar": 9,
        "sodium": 160,
        "saturatedFat": 0.5,
        "addedSugar": 8
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Fruit & Cream Instant Oatmeal Variety",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331295",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal/peaches-and-cream",
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
      "preparedWaterIncluded": false,
      "allergens": [
        "milk"
      ],
      "glutenFreeLabel": null,
      "notes": "The dry packet contains dried cream and nonfat dry milk. Additional milk used for preparation is not included."
    }
  },
  {
    "id": "oat-brand-quaker-instant-bananas-cream",
    "name": "Quaker Instant Oatmeal Bananas & Cream",
    "displayName": "Quaker Instant Oatmeal Bananas & Cream",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Quaker",
    "aliases": [
      "Quaker Bananas and Cream",
      "Quaker banana oatmeal",
      "Quaker fruit and cream banana"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "quaker-oats"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 366.67,
      "protein": 10.0,
      "carbs": 73.33,
      "fat": 5.0,
      "fiber": 6.67,
      "sugar": 26.67,
      "sodium": 500.0,
      "saturatedFat": 1.67,
      "potassium": 333.3
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (30 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 30,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Quaker Oats",
      "brand": "Quaker",
      "productName": "Quaker Instant Oatmeal Bananas & Cream",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (30 g)",
        "servingGrams": 30,
        "calories": 110,
        "protein": 3,
        "carbs": 22,
        "fat": 1.5,
        "fiber": 2,
        "sugar": 8,
        "sodium": 150,
        "saturatedFat": 0.5,
        "potassium": 100,
        "addedSugar": 7
      },
      "sourceProvenance": {
        "labelSourceProvider": "Target current U.S. package-label transcription",
        "labelSourceTitle": "Quaker Fruit & Cream Instant Oatmeal Variety",
        "labelSourceUrl": "https://www.target.com/p/-/A-13331295",
        "sourceTier": "current-retail-label",
        "manufacturerSourceUrl": "https://www.quakeroats.com/products/hot-cereals/instant-oatmeal",
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
      "preparedWaterIncluded": false,
      "allergens": [
        "milk"
      ],
      "glutenFreeLabel": null,
      "notes": "The dry packet contains dairy ingredients. Additional milk used for preparation is not included."
    }
  },
  {
    "id": "oat-brand-bobs-quick-cooking-rolled",
    "name": "Bob's Red Mill Quick Cooking Rolled Oats",
    "displayName": "Bob's Red Mill Quick Cooking Rolled Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs quick oats",
      "Bob's Red Mill quick oats",
      "Bob's quick cooking oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
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
      "protein": 13.33,
      "carbs": 71.11,
      "fat": 6.67,
      "fiber": 8.89,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 2.22,
      "potassium": 331.1
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup (45 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 45,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Quick Cooking Rolled Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup (45 g)",
        "servingGrams": 45,
        "calories": 180,
        "protein": 6,
        "carbs": 32,
        "fat": 3,
        "fiber": 4,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 1,
        "potassium": 149,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Quick Cooking Rolled Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/quick-cooking-rolled-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-organic-old-fashioned",
    "name": "Bob's Red Mill Organic Old Fashioned Rolled Oats",
    "displayName": "Bob's Red Mill Organic Old Fashioned Rolled Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs old fashioned oats",
      "Bob's organic rolled oats",
      "Bob's Red Mill rolled oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
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
      "protein": 10.42,
      "carbs": 68.75,
      "fat": 8.33,
      "fiber": 8.33,
      "sugar": 2.08,
      "sodium": 0.0,
      "saturatedFat": 2.08,
      "potassium": 333.3
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup (48 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 48,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Organic Old Fashioned Rolled Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup (48 g)",
        "servingGrams": 48,
        "calories": 180,
        "protein": 5,
        "carbs": 33,
        "fat": 4,
        "fiber": 4,
        "sugar": 1,
        "sodium": 0,
        "saturatedFat": 1,
        "potassium": 160,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Organic Old Fashioned Rolled Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/organic-regular-rolled-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-gluten-free-old-fashioned",
    "name": "Bob's Red Mill Gluten Free Old Fashioned Rolled Oats",
    "displayName": "Bob's Red Mill Gluten Free Old Fashioned Rolled Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs gluten free rolled oats",
      "Bob's GF old fashioned oats",
      "Bob's gluten free oatmeal"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 395.83,
      "protein": 12.5,
      "carbs": 68.75,
      "fat": 8.33,
      "fiber": 10.42,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 2.08,
      "potassium": 358.3
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup (48 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 48,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Gluten Free Old Fashioned Rolled Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup (48 g)",
        "servingGrams": 48,
        "calories": 190,
        "protein": 6,
        "carbs": 33,
        "fat": 4,
        "fiber": 5,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 1,
        "potassium": 172,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Gluten Free Old Fashioned Rolled Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/gluten-free-rolled-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-steel-cut",
    "name": "Bob's Red Mill Steel Cut Oats",
    "displayName": "Bob's Red Mill Steel Cut Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs steel cut oats",
      "Bob's Irish oats",
      "Bob's pinhead oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 386.36,
      "protein": 11.36,
      "carbs": 70.45,
      "fat": 6.82,
      "fiber": 11.36,
      "sugar": 2.27,
      "sodium": 0.0,
      "saturatedFat": 2.27,
      "potassium": 368.2
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/4 cup (44 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 44,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Steel Cut Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/4 cup (44 g)",
        "servingGrams": 44,
        "calories": 170,
        "protein": 5,
        "carbs": 31,
        "fat": 3,
        "fiber": 5,
        "sugar": 1,
        "sodium": 0,
        "saturatedFat": 1,
        "potassium": 162,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Steel Cut Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/steel-cut-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-gluten-free-steel-cut",
    "name": "Bob's Red Mill Gluten Free Steel Cut Oats",
    "displayName": "Bob's Red Mill Gluten Free Steel Cut Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs gluten free steel cut oats",
      "Bob's GF steel cut",
      "gluten free Irish oats Bob's"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 363.64,
      "protein": 11.36,
      "carbs": 70.45,
      "fat": 4.55,
      "fiber": 9.09,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 0.0,
      "potassium": 379.5
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/4 cup (44 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 44,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Gluten Free Steel Cut Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/4 cup (44 g)",
        "servingGrams": 44,
        "calories": 160,
        "protein": 5,
        "carbs": 31,
        "fat": 2,
        "fiber": 4,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 0,
        "potassium": 167,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Gluten Free Steel Cut Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/gluten-free-steel-cut-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-organic-extra-thick",
    "name": "Bob's Red Mill Organic Extra Thick Rolled Oats",
    "displayName": "Bob's Red Mill Organic Extra Thick Rolled Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs extra thick oats",
      "Bob's thick rolled oats",
      "organic extra thick oats"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380.0,
      "protein": 12.0,
      "carbs": 68.0,
      "fat": 8.0,
      "fiber": 8.0,
      "sugar": 2.0,
      "sodium": 0.0,
      "saturatedFat": 2.0,
      "potassium": 364.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/2 cup (50 g)",
        "amount": 1,
        "unit": "serving",
        "grams": 50,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Organic Extra Thick Rolled Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/2 cup (50 g)",
        "servingGrams": 50,
        "calories": 190,
        "protein": 6,
        "carbs": 34,
        "fat": 4,
        "fiber": 4,
        "sugar": 1,
        "sodium": 0,
        "saturatedFat": 1,
        "potassium": 182,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Organic Extra Thick Rolled Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/organic-thick-rolled-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-classic-instant-packet",
    "name": "Bob's Red Mill Classic Instant Oatmeal",
    "displayName": "Bob's Red Mill Classic Instant Oatmeal",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs instant oatmeal",
      "Bob's classic instant oatmeal",
      "Bob's oatmeal packet"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 11.11,
      "carbs": 68.89,
      "fat": 6.67,
      "fiber": 8.89,
      "sugar": 0.0,
      "sodium": 222.2,
      "saturatedFat": 2.22,
      "potassium": 362.2
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (45 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 45,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Classic Instant Oatmeal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (45 g)",
        "servingGrams": 45,
        "calories": 180,
        "protein": 5,
        "carbs": 31,
        "fat": 3,
        "fiber": 4,
        "sugar": 0,
        "sodium": 100,
        "saturatedFat": 1,
        "potassium": 163,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Classic Instant Oatmeal Packets",
        "labelSourceUrl": "https://www.bobsredmill.com/product/classic-instant-oatmeal-packets",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-maple-brown-sugar-instant",
    "name": "Bob's Red Mill Maple Brown Sugar Instant Oatmeal",
    "displayName": "Bob's Red Mill Maple Brown Sugar Instant Oatmeal",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs maple brown sugar oatmeal",
      "Bob's maple oatmeal",
      "Bob's instant maple brown sugar"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 377.78,
      "protein": 11.11,
      "carbs": 73.33,
      "fat": 6.67,
      "fiber": 8.89,
      "sugar": 15.56,
      "sodium": 211.1,
      "saturatedFat": 2.22,
      "potassium": 326.7
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (45 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 45,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Maple Brown Sugar Instant Oatmeal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (45 g)",
        "servingGrams": 45,
        "calories": 170,
        "protein": 5,
        "carbs": 33,
        "fat": 3,
        "fiber": 4,
        "sugar": 7,
        "sodium": 95,
        "saturatedFat": 1,
        "potassium": 147,
        "addedSugar": 7
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Maple Brown Sugar Instant Oatmeal Packets",
        "labelSourceUrl": "https://www.bobsredmill.com/product/maple-brown-sugar-instant-oatmeal-packets",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-apple-cinnamon-instant",
    "name": "Bob's Red Mill Apple & Cinnamon Instant Oatmeal",
    "displayName": "Bob's Red Mill Apple & Cinnamon Instant Oatmeal",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs apple cinnamon oatmeal",
      "Bob's apple oatmeal",
      "Bob's instant apple cinnamon"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 8.89,
      "carbs": 75.56,
      "fat": 6.67,
      "fiber": 8.89,
      "sugar": 20.0,
      "sodium": 166.7,
      "saturatedFat": 2.22,
      "potassium": 317.8
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 packet (45 g)",
        "amount": 1,
        "unit": "packet",
        "grams": 45,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Apple & Cinnamon Instant Oatmeal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 packet (45 g)",
        "servingGrams": 45,
        "calories": 180,
        "protein": 4,
        "carbs": 34,
        "fat": 3,
        "fiber": 4,
        "sugar": 9,
        "sodium": 75,
        "saturatedFat": 1,
        "potassium": 143,
        "addedSugar": 9
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Apple & Cinnamon Instant Oatmeal Packets",
        "labelSourceUrl": "https://www.bobsredmill.com/product/apple-cinnamon-instant-oatmeal-packets",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-scottish-oatmeal",
    "name": "Bob's Red Mill Scottish Oatmeal",
    "displayName": "Bob's Red Mill Scottish Oatmeal",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs Scottish oats",
      "Bob's Scottish oatmeal",
      "stone ground oats Bob's"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 388.89,
      "protein": 11.11,
      "carbs": 72.22,
      "fat": 5.56,
      "fiber": 8.33,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 0.0,
      "potassium": 361.1
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/4 cup (36 g)",
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Scottish Oatmeal",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/4 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 4,
        "carbs": 26,
        "fat": 2,
        "fiber": 3,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 0,
        "potassium": 130,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Scottish Oatmeal",
        "labelSourceUrl": "https://www.bobsredmill.com/product/scottish-oatmeal",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-quick-steel-cut",
    "name": "Bob's Red Mill Quick Cooking Steel Cut Oats",
    "displayName": "Bob's Red Mill Quick Cooking Steel Cut Oats",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs quick steel cut oats",
      "Bob's quick cooking steel cut",
      "quick Irish oats Bob's"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 388.89,
      "protein": 11.11,
      "carbs": 72.22,
      "fat": 8.33,
      "fiber": 11.11,
      "sugar": 0.0,
      "sodium": 0.0,
      "saturatedFat": 0.0,
      "potassium": 350.0
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1/4 cup (36 g)",
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Quick Cooking Steel Cut Oats",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1/4 cup (36 g)",
        "servingGrams": 36,
        "calories": 140,
        "protein": 4,
        "carbs": 26,
        "fat": 3,
        "fiber": 4,
        "sugar": 0,
        "sodium": 0,
        "saturatedFat": 0,
        "potassium": 126,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Quick Cooking Steel Cut Oats",
        "labelSourceUrl": "https://www.bobsredmill.com/product/quick-cooking-steel-cut-oats",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": false,
      "notes": "Nutrition represents the branded oat product as packaged. Water or milk used to prepare oatmeal is not included in the stored product nutrition. Milk, fruit, nuts, syrup, sugar, protein powder, and other toppings should be logged separately. The canonical 100 g values are derived from the exact labeled serving stored in metadata.labelNutrition."
    }
  },
  {
    "id": "oat-brand-bobs-classic-oatmeal-cup",
    "name": "Bob's Red Mill Classic Oatmeal Cup",
    "displayName": "Bob's Red Mill Classic Oatmeal Cup",
    "category": "grain",
    "state": "as-packaged",
    "preparation": "oat-product",
    "brand": "Bob's Red Mill",
    "aliases": [
      "Bobs oatmeal cup",
      "Bob's classic oatmeal cup",
      "Bob's gluten free oatmeal cup"
    ],
    "tags": [
      "grain",
      "oats",
      "branded-oats",
      "bobs-red-mill"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 411.76,
      "protein": 13.73,
      "carbs": 64.71,
      "fat": 9.8,
      "fiber": 13.73,
      "sugar": 1.96,
      "sodium": 313.7,
      "saturatedFat": 1.96,
      "potassium": 415.7
    },
    "servings": [
      {
        "id": "manufacturer-serving",
        "label": "1 container (51 g)",
        "amount": 1,
        "unit": "container",
        "grams": 51,
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
    "source": "AriFoodOatBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oats",
      "manufacturer": "Bob's Red Mill",
      "brand": "Bob's Red Mill",
      "productName": "Bob's Red Mill Classic Oatmeal Cup",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g, mathematically derived from current labeled serving",
      "calculationMethod": "scaled_from_label_serving",
      "labelNutrition": {
        "servingLabel": "1 container (51 g)",
        "servingGrams": 51,
        "calories": 210,
        "protein": 7,
        "carbs": 33,
        "fat": 5,
        "fiber": 7,
        "sugar": 1,
        "sodium": 160,
        "saturatedFat": 1,
        "potassium": 212,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "labelSourceProvider": "Bob's Red Mill",
        "labelSourceTitle": "Classic Oatmeal Cup",
        "labelSourceUrl": "https://www.bobsredmill.com/product/gluten-free-classic-oatmeal-cup",
        "sourceTier": "manufacturer",
        "manufacturerSourceUrl": null,
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
      "preparedWaterIncluded": false,
      "allergens": [],
      "glutenFreeLabel": true,
      "notes": "The packaged cup contains oats, chia seed, flaxseed, and sea salt. Water added to prepare the cup contributes no calories and is not included in the product nutrient profile."
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

  // Clear stale records from this exact module on hot reload.
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior module records.`,
        error
      );
    }
  }

  const registration =
    registry.registerMany(
      ARI_OAT_BRAND_FOODS,
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
      foodCount: ARI_OAT_BRAND_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(
        SOURCE_POLICY
      ),

      manufacturers: [
        "Quaker Oats",
        "Bob's Red Mill"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} oat-brand record(s).`,
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
      `[ARI Nutrition] ${MODULE_NAME} registered successfully, but the current AriFoodGrains controller does not yet list ${MODULE_NAME} as an expected module. Update AriFoodGrains.js to include it.`
    );
  }

  global.AriFoodOatBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_OAT_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_OAT_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_OAT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getManufacturers() {
        return Array.from(
          new Set(
            ARI_OAT_BRAND_FOODS.map(
              food =>
                food.metadata.manufacturer
            )
          )
        );
      },

      getByBrand(brandName) {
        const target =
          String(brandName || "")
            .trim()
            .toLowerCase();

        return ARI_OAT_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === target
          )
          .map(clone);
      },

      getByManufacturer(manufacturer) {
        const target =
          String(manufacturer || "")
            .trim()
            .toLowerCase();

        return ARI_OAT_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata.manufacturer || ""
              ).toLowerCase() === target
          )
          .map(clone);
      },

      getGlutenFreeLabeledRecords() {
        return ARI_OAT_BRAND_FOODS
          .filter(
            food =>
              food.metadata?.glutenFreeLabel === true
          )
          .map(clone);
      },

      getMilkAllergenRecords() {
        return ARI_OAT_BRAND_FOODS
          .filter(
            food =>
              Array.isArray(
                food.metadata?.allergens
              ) &&
              food.metadata.allergens.includes(
                "milk"
              )
          )
          .map(clone);
      },

      getLabelNutrition(foodId) {
        const record =
          ARI_OAT_BRAND_FOODS.find(
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
          ARI_OAT_BRAND_FOODS.find(
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
            ARI_OAT_BRAND_FOODS.length
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-oat-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_OAT_BRAND_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OAT_BRAND_FOODS.length} branded oat records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
