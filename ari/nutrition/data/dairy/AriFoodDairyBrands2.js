// =====================================================
// ARI REBIRTH
// File: AriFoodDairyBrands2.js
// Version: 1.0.0
//
// Purpose:
//   Second brand-first dairy expansion for ARI Nutrition.
//
// Collection:
//   AriFoodDairy
//
// Coverage:
//   CACIQUE
//   - Queso Fresco
//   - Ranchero Queso Fresco
//   - Cotija
//   - Oaxaca
//   - Panela
//   - Queso Quesadilla
//   - Shredded Queso Quesadilla
//   - Mexican Style Four Cheese Blend
//   - Grated Cotija
//   - Crema Mexicana
//   - Crema Mexicana Agria
//
//   DAISY
//   - 4% Cottage Cheese
//   - 2% Cottage Cheese
//   - Sour Cream
//   - Light Sour Cream
//
//   KERRYGOLD
//   - Salted Butter
//   - Unsalted Butter
//
// Data policy:
//   - Brand/package label first.
//   - Exact serving preserved in metadata.labelNutrition.
//   - Canonical nutrition normalized to 100 g.
//   - Distinct formulations remain distinct.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodDairyBrands2(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodDairyBrands2";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "Second brand-first dairy expansion covering Mexican cheeses and cremas, cottage cheese, sour cream, and butter.",
  "brands": [
    "Cacique",
    "Daisy",
    "Kerrygold"
  ],
  "recordCount": 17,
  "categories": [
    "butter",
    "cheese",
    "cottage-cheese",
    "cream",
    "sour-cream"
  ],
  "sourceHierarchy": [
    "Official manufacturer product pages when full package nutrition is published",
    "Current retailer package-label captures for exact branded nutrition panels",
    "Manufacturer page cross-check for product identity, formulation, and ingredients"
  ],
  "rules": [
    "Preserve exact package serving values in metadata.labelNutrition.",
    "Normalize package-label nutrition mathematically to 100 g.",
    "Do not merge block cheese and shredded cheese when anti-caking ingredients or label nutrition differ.",
    "Keep Cacique Queso Fresco, Ranchero Queso Fresco, Cotija, Oaxaca, Panela, Queso Quesadilla, and crema products distinct.",
    "Keep Daisy 4% and 2% cottage cheese distinct.",
    "Keep Daisy classic and light sour cream distinct.",
    "Keep salted and unsalted Kerrygold butter distinct.",
    "For volume-only labels, any nominal gram equivalence must be explicitly documented rather than treated as exact measured density.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_DAIRY_BRANDS_2_FOODS =
    [
  {
    "id": "dairy-brand-cacique-queso-fresco",
    "name": "Queso Fresco",
    "displayName": "Cacique Queso Fresco",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique queso fresco",
      "Cacique fresh cheese",
      "queso fresco Cacique"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "queso-fresco",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 285.71,
      "protein": 21.429,
      "carbs": 0.0,
      "fat": 21.429,
      "fiber": 0.0,
      "saturatedFat": 14.286,
      "sodium": 714.286,
      "cholesterol": 71.429,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 100.0,
      "calcium": 417.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "queso-fresco",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 80,
        "protein": 6,
        "carbs": 0,
        "fat": 6,
        "fiber": 0,
        "saturatedFat": 4,
        "sodium": 200,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 28,
        "calcium": 117
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-47761771",
        "manufacturerUrl": "https://www.caciquefoods.com/products/queso-fresco/"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, and enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-ranchero-queso-fresco",
    "name": "Ranchero Queso Fresco",
    "displayName": "Cacique Ranchero Queso Fresco",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique Ranchero queso fresco",
      "Ranchero fresh cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "ranchero-queso-fresco",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 285.71,
      "protein": 21.429,
      "carbs": 0.0,
      "fat": 21.429,
      "fiber": 0.0,
      "saturatedFat": 14.286,
      "sodium": 714.286,
      "cholesterol": 71.429,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 100.0,
      "calcium": 417.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "ranchero-queso-fresco",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 80,
        "protein": 6,
        "carbs": 0,
        "fat": 6,
        "fiber": 0,
        "saturatedFat": 4,
        "sodium": 200,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 28,
        "calcium": 117
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-15013923",
        "manufacturerUrl": "https://www.caciquefoods.com/products/ranchero-queso-fresco/"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, and enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-cotija",
    "name": "Cotija",
    "displayName": "Cacique Cotija",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique cotija",
      "Cacique cotija cheese",
      "cotija Cacique"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "cotija",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 321.43,
      "protein": 21.429,
      "carbs": 0.0,
      "fat": 25.0,
      "fiber": 0.0,
      "saturatedFat": 17.857,
      "sodium": 1750.0,
      "cholesterol": 89.286,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "cotija",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 90,
        "protein": 6,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 5,
        "sodium": 490,
        "cholesterol": 25,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-14937642",
        "manufacturerUrl": "https://www.caciquefoods.com/products/cotija/"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, and enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-oaxaca",
    "name": "Oaxaca Cheese",
    "displayName": "Cacique Oaxaca Cheese",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique Oaxaca",
      "Cacique Oaxaca cheese",
      "quesillo Cacique"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "oaxaca",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 285.71,
      "protein": 25.0,
      "carbs": 0.0,
      "fat": 21.429,
      "fiber": 0.0,
      "saturatedFat": 16.071,
      "sodium": 678.571,
      "cholesterol": 89.286,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 92.857,
      "calcium": 689.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "oaxaca",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 80,
        "protein": 7,
        "carbs": 0,
        "fat": 6,
        "fiber": 0,
        "saturatedFat": 4.5,
        "sodium": 190,
        "cholesterol": 25,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 26,
        "calcium": 193
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-oaxaca/0007456200115",
        "manufacturerUrl": "https://www.caciquefoods.com/products/oaxaca/"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, and enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-panela",
    "name": "Panela Cheese",
    "displayName": "Cacique Panela Cheese",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique Panela",
      "Cacique panela cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "panela",
      "cacique"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 285.71,
      "protein": 21.429,
      "carbs": 0.0,
      "fat": 21.429,
      "fiber": 0.0,
      "saturatedFat": 14.286,
      "sodium": 750.0,
      "cholesterol": 71.429,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "calcium": 417.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "panela",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 80,
        "protein": 6,
        "carbs": 0,
        "fat": 6,
        "fiber": 0,
        "saturatedFat": 4,
        "sodium": 210,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0,
        "calcium": 117
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.wholefoodsmarket.com/grocery/product/cacique-cacique-panela-10-oz-b00ik839hu",
        "manufacturerUrl": "https://www.caciquefoods.com/products/panela/"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, and enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-queso-quesadilla",
    "name": "Queso Quesadilla",
    "displayName": "Cacique Queso Quesadilla",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique queso quesadilla",
      "Cacique quesadilla cheese",
      "Mexican melting cheese Cacique"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "queso-quesadilla",
      "cacique"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 321.43,
      "protein": 21.429,
      "carbs": 3.571,
      "fat": 25.0,
      "fiber": 0.0,
      "saturatedFat": 16.071,
      "sodium": 571.429,
      "cholesterol": 89.286,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 85.714,
      "calcium": 657.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "queso-quesadilla",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 90,
        "protein": 6,
        "carbs": 1,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 4.5,
        "sodium": 160,
        "cholesterol": 25,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 24,
        "calcium": 184
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-queso-quesadilla/0007456200120"
      },
      "ingredients": "Cultured pasteurized Grade A milk and skim milk, sea salt, enzymes and beta-carotene (for color).",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-queso-quesadilla-shredded",
    "name": "Queso Quesadilla Shredded Cheese",
    "displayName": "Cacique Queso Quesadilla Shredded Cheese",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique shredded queso quesadilla",
      "Cacique shredded quesadilla cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "queso-quesadilla-shredded",
      "cacique"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.14,
      "protein": 21.429,
      "carbs": 3.571,
      "fat": 28.571,
      "fiber": 0.0,
      "saturatedFat": 17.857,
      "sodium": 642.857,
      "cholesterol": 89.286,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 71.429,
      "calcium": 642.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 cup (28 g)",
        "amount": 1,
        "unit": "cup",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "queso-quesadilla-shredded",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/4 cup (28 g)",
        "servingGrams": 28,
        "calories": 100,
        "protein": 6,
        "carbs": 1,
        "fat": 8,
        "fiber": 0,
        "saturatedFat": 5,
        "sodium": 180,
        "cholesterol": 25,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 20,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-queso-quesadilla-shredded-cheese/0007456250002"
      },
      "ingredients": "Pasteurized milk, cheese culture, salt, enzymes, potato starch and powdered cellulose (added to prevent caking), natamycin.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-mexican-four-cheese-shredded",
    "name": "Mexican Style Four Cheese Blend Shredded Cheese",
    "displayName": "Cacique Mexican Style Four Cheese Blend Shredded Cheese",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique four cheese",
      "Cacique Mexican four cheese blend",
      "Cacique shredded Mexican cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "mexican-four-cheese-shredded",
      "cacique"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.14,
      "protein": 25.0,
      "carbs": 3.571,
      "fat": 25.0,
      "fiber": 0.0,
      "saturatedFat": 14.286,
      "sodium": 678.571,
      "cholesterol": 71.429,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 71.429,
      "calcium": 678.571
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 cup (28 g)",
        "amount": 1,
        "unit": "cup",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "mexican-four-cheese-shredded",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/4 cup (28 g)",
        "servingGrams": 28,
        "calories": 100,
        "protein": 7,
        "carbs": 1,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 4,
        "sodium": 190,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 20,
        "calcium": 190
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-mexican-style-four-cheese-blend-shredded-cheese/0007456250001",
        "manufacturerUrl": "https://www.caciquefoods.com/products/mexican-style-four-cheese-shredded-cheese/"
      },
      "ingredients": "Queso Quesadilla cheese, Oaxaca cheese, Asadero cheese, Menonita cheese, potato starch, powdered cellulose, natamycin.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-cotija-grated",
    "name": "Queso Cotija Grated Cheese",
    "displayName": "Cacique Queso Cotija Grated Cheese",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique grated cotija",
      "Cacique cotija grated",
      "Cacique cotija topping"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "cotija-grated",
      "cacique"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 300.0,
      "protein": 20.0,
      "carbs": 0.0,
      "fat": 30.0,
      "fiber": 0.0,
      "saturatedFat": 20.0,
      "sodium": 1700.0,
      "cholesterol": 100.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 80.0,
      "calcium": 580.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tsp (5 g)",
        "amount": 1,
        "unit": "tsp",
        "grams": 5,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "cotija-grated",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "2 tsp (5 g)",
        "servingGrams": 5,
        "calories": 15,
        "protein": 1,
        "carbs": 0,
        "fat": 1.5,
        "fiber": 0,
        "saturatedFat": 1,
        "sodium": 85,
        "cholesterol": 5,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 4,
        "calcium": 29
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-queso-cotija-grated-cheese/0007456250004",
        "manufacturerUrl": "https://www.caciquefoods.com/products/shredded-queso-cotija-3/"
      },
      "ingredients": "Cotija cheese (cultured pasteurized Grade A milk and skim milk, sea salt, enzymes), cellulose powder (to prevent caking).",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-cacique-crema-mexicana-table-cream",
    "name": "Crema Mexicana Table Cream",
    "displayName": "Cacique Crema Mexicana Table Cream",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique crema",
      "Cacique Mexican crema",
      "Cacique table cream",
      "crema mexicana Cacique"
    ],
    "tags": [
      "dairy",
      "branded",
      "cream",
      "crema-mexicana-table-cream",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 166.67,
      "protein": 0.0,
      "carbs": 6.667,
      "fat": 16.667,
      "fiber": 0.0,
      "saturatedFat": 10.0,
      "sodium": 33.333,
      "cholesterol": 66.667,
      "sugar": 6.667,
      "addedSugar": 0.0,
      "potassium": 153.333,
      "calcium": 86.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 Tbsp (15 g nominal)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 15,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cream",
      "productLine": "crema-mexicana-table-cream",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 Tbsp (15 g nominal)",
        "servingGrams": 15,
        "calories": 25,
        "protein": 0,
        "carbs": 1,
        "fat": 2.5,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 5,
        "cholesterol": 10,
        "sugar": 1,
        "addedSugar": 0,
        "potassium": 23,
        "calcium": 13
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer manufacturer-supplied package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kroger.com/p/cacique-crema-mexicana-table-cream/0007456200202"
      },
      "ingredients": "Pasteurized Grade A cream and milk, guar gum, carrageenan, potassium sorbate.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": "Package label reports a 15 mL serving rather than a gram mass. ARI uses a nominal 15 g serving for offline weight normalization."
    }
  },
  {
    "id": "dairy-brand-cacique-crema-mexicana-agria",
    "name": "Crema Mexicana Agria Sour Cream",
    "displayName": "Cacique Crema Mexicana Agria Sour Cream",
    "brand": "Cacique",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Cacique crema agria",
      "Cacique sour cream",
      "Cacique Mexican sour cream"
    ],
    "tags": [
      "dairy",
      "branded",
      "cream",
      "crema-mexicana-agria",
      "cacique"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 200.0,
      "protein": 3.333,
      "carbs": 3.333,
      "fat": 20.0,
      "fiber": 0.0,
      "saturatedFat": 11.667,
      "sodium": 283.333,
      "cholesterol": 66.667,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "potassium": 170.0,
      "calcium": 83.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 Tbsp (30 g)",
        "amount": 1,
        "unit": "tbsp",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cream",
      "productLine": "crema-mexicana-agria",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "2 Tbsp (30 g)",
        "servingGrams": 30,
        "calories": 60,
        "protein": 1,
        "carbs": 1,
        "fat": 6,
        "fiber": 0,
        "saturatedFat": 3.5,
        "sodium": 85,
        "cholesterol": 20,
        "sugar": 1,
        "addedSugar": 0,
        "potassium": 51,
        "calcium": 25
      },
      "sourceProvenance": {
        "provider": "Cacique",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-94419115"
      },
      "ingredients": "Cultured pasteurized Grade A cream, milk and whey protein concentrate, sea salt, carrageenan, natural flavor, potassium sorbate, xanthan gum and annatto.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-daisy-cottage-cheese-4-percent",
    "name": "4% Classic Cottage Cheese",
    "displayName": "Daisy 4% Classic Cottage Cheese",
    "brand": "Daisy",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Daisy cottage cheese",
      "Daisy 4% cottage cheese",
      "Daisy classic cottage cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "cottage-cheese-4-percent",
      "daisy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 97.35,
      "protein": 11.504,
      "carbs": 4.425,
      "fat": 4.425,
      "fiber": 0.0,
      "saturatedFat": 2.655,
      "sodium": 327.434,
      "cholesterol": 17.699,
      "sugar": 3.54,
      "addedSugar": 0.0,
      "potassium": 115.044,
      "calcium": 88.496
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (113 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 113,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "cottage-cheese-4-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (113 g)",
        "servingGrams": 113,
        "calories": 110,
        "protein": 13,
        "carbs": 5,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3,
        "sodium": 370,
        "cholesterol": 20,
        "sugar": 4,
        "addedSugar": 0,
        "potassium": 130,
        "calcium": 100
      },
      "sourceProvenance": {
        "provider": "Daisy",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-94707165",
        "manufacturerUrl": "https://www.daisybrand.com/cottage-cheese/"
      },
      "ingredients": "Cultured skim milk, cream, salt.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-daisy-cottage-cheese-2-percent",
    "name": "2% Low Fat Cottage Cheese",
    "displayName": "Daisy 2% Low Fat Cottage Cheese",
    "brand": "Daisy",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Daisy 2% cottage cheese",
      "Daisy low fat cottage cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "cottage-cheese-2-percent",
      "daisy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 79.65,
      "protein": 11.504,
      "carbs": 4.425,
      "fat": 2.212,
      "fiber": 0.0,
      "saturatedFat": 1.327,
      "sodium": 309.735,
      "sugar": 3.54,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (113 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 113,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "cottage-cheese-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (113 g)",
        "servingGrams": 113,
        "calories": 90,
        "protein": 13,
        "carbs": 5,
        "fat": 2.5,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 350,
        "sugar": 4,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Daisy",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://origin-d8.wholefoodsmarket.com/grocery/product/daisy-brand-daisy-2-cottage-cheese-24oz-24-oz-b00yghfb0m",
        "manufacturerUrl": "https://www.daisybrand.com/cottage-cheese/"
      },
      "ingredients": "Cultured skim milk, cream, salt.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-daisy-sour-cream",
    "name": "Pure & Natural Sour Cream",
    "displayName": "Daisy Pure & Natural Sour Cream",
    "brand": "Daisy",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Daisy sour cream",
      "Daisy regular sour cream",
      "Daisy classic sour cream"
    ],
    "tags": [
      "dairy",
      "branded",
      "sour-cream",
      "sour-cream-classic",
      "daisy"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 200.0,
      "protein": 3.333,
      "carbs": 3.333,
      "fat": 16.667,
      "fiber": 0.0,
      "saturatedFat": 11.667,
      "sodium": 50.0,
      "cholesterol": 66.667,
      "sugar": 3.333,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 Tbsp (30 g)",
        "amount": 1,
        "unit": "tbsp",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "sour-cream",
      "productLine": "sour-cream-classic",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "2 Tbsp (30 g)",
        "servingGrams": 30,
        "calories": 60,
        "protein": 1,
        "carbs": 1,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3.5,
        "sodium": 15,
        "cholesterol": 20,
        "sugar": 1,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Daisy",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-13451688",
        "manufacturerUrl": "https://www.daisybrand.com/sour-cream/"
      },
      "ingredients": "Cultured cream.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-daisy-light-sour-cream",
    "name": "Light Sour Cream",
    "displayName": "Daisy Light Sour Cream",
    "brand": "Daisy",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Daisy light sour cream",
      "Daisy reduced fat sour cream"
    ],
    "tags": [
      "dairy",
      "branded",
      "sour-cream",
      "sour-cream-light",
      "daisy"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 116.67,
      "protein": 6.667,
      "carbs": 3.333,
      "fat": 8.333,
      "fiber": 0.0,
      "saturatedFat": 5.0,
      "sodium": 50.0,
      "cholesterol": 33.333,
      "sugar": 3.333,
      "addedSugar": 0.0,
      "potassium": 166.667,
      "calcium": 133.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 Tbsp (30 g)",
        "amount": 1,
        "unit": "tbsp",
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "sour-cream",
      "productLine": "sour-cream-light",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "2 Tbsp (30 g)",
        "servingGrams": 30,
        "calories": 35,
        "protein": 2,
        "carbs": 1,
        "fat": 2.5,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 15,
        "cholesterol": 10,
        "sugar": 1,
        "addedSugar": 0,
        "potassium": 50,
        "calcium": 40
      },
      "sourceProvenance": {
        "provider": "Daisy",
        "sourceType": "current retailer package-label capture",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.target.com/p/-/A-53319595",
        "manufacturerUrl": "https://www.daisybrand.com/sour-cream/"
      },
      "ingredients": "Cultured cream, skim milk, vitamin A palmitate.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-kerrygold-salted-butter",
    "name": "Salted Butter",
    "displayName": "Kerrygold Salted Butter",
    "brand": "Kerrygold",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kerrygold butter",
      "Kerrygold salted butter",
      "Irish salted butter"
    ],
    "tags": [
      "dairy",
      "branded",
      "butter",
      "salted-irish-butter",
      "kerrygold"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.29,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "fiber": 0.0,
      "saturatedFat": 57.143,
      "sodium": 714.286,
      "cholesterol": 214.286,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 Tbsp (14 g)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "butter",
      "productLine": "salted-irish-butter",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 Tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "fiber": 0,
        "saturatedFat": 8,
        "sodium": 100,
        "cholesterol": 30,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kerrygoldusa.com/products/salted-butter/",
        "manufacturerUrl": "https://www.kerrygoldusa.com/products/salted-butter/"
      },
      "ingredients": "Pasteurized cream, salt.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-kerrygold-unsalted-butter",
    "name": "Unsalted Butter",
    "displayName": "Kerrygold Unsalted Butter",
    "brand": "Kerrygold",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kerrygold unsalted",
      "Kerrygold unsalted butter",
      "Irish unsalted butter"
    ],
    "tags": [
      "dairy",
      "branded",
      "butter",
      "unsalted-irish-butter",
      "kerrygold"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.29,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 85.714,
      "fiber": 0.0,
      "saturatedFat": 57.143,
      "sodium": 0.0,
      "cholesterol": 214.286,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 Tbsp (14 g)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
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
    "source": "AriFoodDairyBrands2",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "butter",
      "productLine": "unsalted-irish-butter",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 Tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 12,
        "fiber": 0,
        "saturatedFat": 8,
        "sodium": 0,
        "cholesterol": 30,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Kerrygold",
        "sourceType": "official manufacturer product page",
        "verifiedAt": "2026-08-03",
        "labelUrl": "https://www.kerrygoldusa.com/products/unsalted-butter/",
        "manufacturerUrl": "https://www.kerrygoldusa.com/products/unsalted-butter/"
      },
      "ingredients": "Pasteurized cream, skimmed milk, cultures.",
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
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
    if (!global.AriFoodDairy) {
      return false;
    }

    if (
      typeof global.AriFoodDairy.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodDairy.isExpectedModule(
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
      global.AriFoodDairy &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodDairy.markModuleFailed === "function"
    ) {
      global.AriFoodDairy.markModuleFailed(
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

  // Clear stale records owned by this exact module on hot reload.
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
      ARI_DAIRY_BRANDS_2_FOODS,
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
        ARI_DAIRY_BRANDS_2_FOODS.length,

      brandCount:
        new Set(
          ARI_DAIRY_BRANDS_2_FOODS.map(
            food => food.brand
          )
        ).size,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "mexican-cheese",
        "mexican-crema",
        "cottage-cheese",
        "sour-cream",
        "butter"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} dairy-brand-2 record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodDairy &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodDairy.markModuleLoaded === "function"
  ) {
    global.AriFoodDairy.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodDairyBrands2 =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_DAIRY_BRANDS_2_FOODS.length;
      },

      getFoodIds() {
        return ARI_DAIRY_BRANDS_2_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_DAIRY_BRANDS_2_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getDairyTypes() {
        return Array.from(
          new Set(
            ARI_DAIRY_BRANDS_2_FOODS.map(
              food =>
                food.metadata.dairyType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_DAIRY_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getByDairyType(dairyType) {
        const normalized =
          String(dairyType || "")
            .trim()
            .toLowerCase();

        return ARI_DAIRY_BRANDS_2_FOODS
          .filter(
            food =>
              String(
                food.metadata?.dairyType || ""
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
          ARI_DAIRY_BRANDS_2_FOODS.find(
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
        "ari:food-dairy-brands-2-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_DAIRY_BRANDS_2_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_DAIRY_BRANDS_2_FOODS.length} branded dairy records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
