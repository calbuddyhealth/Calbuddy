// =====================================================
// ARI REBIRTH
// File: AriFoodDairyBrands3.js
// Version: 1.0.0
//
// Purpose:
//   Third brand-first dairy expansion for ARI Nutrition.
//
// Collection:
//   AriFoodDairy
//
// Brands in V1:
//   - Galbani
//   - BelGioioso
//   - Good Culture
//
// Coverage:
//   GALBANI
//   - Whole Milk Ricotta
//   - Part Skim Ricotta
//   - Fresh Mozzarella Log
//
//   BELGIOIOSO
//   - Fresh Mozzarella Slices
//   - Fresh Mozzarella Pearls
//   - Fresh Mozzarella Snack Packs
//   - Burrata
//   - Parmesan Wedge
//   - Shredded Parmesan
//   - Mascarpone
//
//   GOOD CULTURE
//   - Simply 4% Cottage Cheese
//   - Simply 2% Cottage Cheese
//   - Organic 4% Cottage Cheese
//   - Organic 2% Cottage Cheese
//   - Lactose-Free 2% Cottage Cheese
//
// Data policy:
//   - Brand/package label first.
//   - Exact serving preserved in metadata.labelNutrition.
//   - Canonical nutrition normalized to 100 g.
//   - No invented micronutrients from %DV-only labels.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodDairyBrands3(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodDairyBrands3";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "Third brand-first dairy expansion covering Italian-style cheeses, ricotta, mascarpone, burrata, and premium cottage cheese.",
  "brands": [
    "BelGioioso",
    "Galbani",
    "Good Culture"
  ],
  "recordCount": 15,
  "categories": [
    "cheese",
    "cottage-cheese",
    "mascarpone",
    "ricotta"
  ],
  "sourceHierarchy": [
    "Official manufacturer product pages with current nutrition panels",
    "Current retailer package-label captures when exact manufacturer nutrition is not exposed in crawlable text",
    "Manufacturer page cross-check for product identity when available"
  ],
  "rules": [
    "Preserve exact package-label serving mass and nutrition in metadata.labelNutrition.",
    "Normalize package-label nutrition mathematically to 100 g.",
    "Do not invent micronutrient quantities from percentage Daily Value when an exact label amount is unavailable.",
    "Keep Galbani whole-milk and part-skim ricotta distinct.",
    "Keep fresh mozzarella formats distinct when package/use format matters to logging.",
    "Keep BelGioioso burrata, mascarpone, fresh mozzarella, and Parmesan products distinct.",
    "Keep Good Culture 4%, 2%, organic, and lactose-free cottage cheese products distinct.",
    "Do not substitute AriFoodDairyCore when a matching branded product exists.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_DAIRY_BRANDS_3_FOODS =
    [
  {
    "id": "dairy-brand-galbani-whole-milk-ricotta",
    "name": "Whole Milk Ricotta",
    "displayName": "Galbani Whole Milk Ricotta",
    "brand": "Galbani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Galbani whole milk ricotta",
      "Galbani ricotta whole milk",
      "Galbani ricotta"
    ],
    "tags": [
      "dairy",
      "branded",
      "ricotta",
      "whole-milk-ricotta",
      "galbani"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 161.29,
      "protein": 6.452,
      "carbs": 6.452,
      "fat": 11.29,
      "fiber": 0.0,
      "saturatedFat": 8.065,
      "sodium": 104.839,
      "cholesterol": 56.452,
      "sugar": 4.839,
      "addedSugar": 0.0,
      "potassium": 295.161,
      "calcium": 254.839
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 cup (62 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 62,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "ricotta",
      "productLine": "whole-milk-ricotta",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/4 cup (62 g)",
        "servingGrams": 62,
        "calories": 100,
        "protein": 4,
        "carbs": 4,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 5,
        "sodium": 65,
        "cholesterol": 35,
        "sugar": 3,
        "addedSugar": 0,
        "potassium": 183,
        "calcium": 158
      },
      "sourceProvenance": {
        "provider": "Target / Galbani",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-14938762",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://galbanicheese.com/our-cheeses/dairy-aisle-cheeses-ricotta/"
      },
      "ingredients": "Whey, milk, vinegar, xanthan gum, locust bean gum, guar gum (stabilizers).",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-galbani-part-skim-ricotta",
    "name": "Part Skim Ricotta",
    "displayName": "Galbani Part Skim Ricotta",
    "brand": "Galbani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Galbani part skim ricotta",
      "Galbani low fat ricotta",
      "Galbani ricotta part skim"
    ],
    "tags": [
      "dairy",
      "branded",
      "ricotta",
      "part-skim-ricotta",
      "galbani"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 129.03,
      "protein": 6.452,
      "carbs": 9.677,
      "fat": 6.452,
      "fiber": 0.0,
      "saturatedFat": 4.032,
      "sodium": 96.774,
      "cholesterol": 40.323,
      "sugar": 6.452,
      "addedSugar": 0.0,
      "potassium": 274.194,
      "calcium": 288.71
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 cup (62 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 62,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "ricotta",
      "productLine": "part-skim-ricotta",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/4 cup (62 g)",
        "servingGrams": 62,
        "calories": 80,
        "protein": 4,
        "carbs": 6,
        "fat": 4,
        "fiber": 0,
        "saturatedFat": 2.5,
        "sodium": 60,
        "cholesterol": 25,
        "sugar": 4,
        "addedSugar": 0,
        "potassium": 170,
        "calcium": 179
      },
      "sourceProvenance": {
        "provider": "Target / Galbani",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-15423796",
        "verifiedAt": "2026-08-03",
        "manufacturerUrl": "https://galbanicheese.com/our-cheeses/dairy-aisle-cheeses-ricotta/part-skim-ricotta"
      },
      "ingredients": "Whey, milk, vinegar, xanthan gum, locust bean gum, guar gum (stabilizers).",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-galbani-fresh-mozzarella-log",
    "name": "Fresh Mozzarella Log",
    "displayName": "Galbani Fresh Mozzarella Log",
    "brand": "Galbani",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Galbani fresh mozzarella",
      "Galbani mozzarella log",
      "Galbani fresh mozzarella log"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "fresh-mozzarella-log",
      "galbani"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 17.857,
      "carbs": 3.571,
      "fat": 17.857,
      "fiber": 0.0,
      "saturatedFat": 10.714,
      "sodium": 357.143,
      "cholesterol": 53.571,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 60.714,
      "calcium": 353.571
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "fresh-mozzarella-log",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 70,
        "protein": 5,
        "carbs": 1,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3,
        "sodium": 100,
        "cholesterol": 15,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 17,
        "calcium": 99
      },
      "sourceProvenance": {
        "provider": "Kroger / Galbani",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.kroger.com/p/galbani-fresh-mozzarella-log/0073882406426",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk, salt, vinegar, citric acid, enzymes.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-fresh-mozzarella-sliced",
    "name": "Fresh Mozzarella Sliced Cheese",
    "displayName": "BelGioioso Fresh Mozzarella Sliced Cheese",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso fresh mozzarella",
      "BelGioioso sliced mozzarella",
      "BelGioioso mozzarella slices"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "fresh-mozzarella-sliced",
      "belgioioso"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 17.857,
      "carbs": 3.571,
      "fat": 17.857,
      "fiber": 0.0,
      "saturatedFat": 12.5,
      "sodium": 303.571,
      "cholesterol": 53.571,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "fresh-mozzarella-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 70,
        "protein": 5,
        "carbs": 1,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3.5,
        "sodium": 85,
        "cholesterol": 15,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-14929640",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk, vinegar, enzymes, salt.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-fresh-mozzarella-pearls",
    "name": "Fresh Mozzarella Pearls",
    "displayName": "BelGioioso Fresh Mozzarella Pearls",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso mozzarella pearls",
      "BelGioioso pearl mozzarella",
      "fresh mozzarella pearls"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "fresh-mozzarella-pearls",
      "belgioioso"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 17.857,
      "carbs": 3.571,
      "fat": 17.857,
      "fiber": 0.0,
      "saturatedFat": 12.5,
      "sodium": 303.571,
      "cholesterol": 53.571,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "fresh-mozzarella-pearls",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 70,
        "protein": 5,
        "carbs": 1,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3.5,
        "sodium": 85,
        "cholesterol": 15,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-14933668",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk, vinegar, enzymes, salt.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-fresh-mozzarella-snacking",
    "name": "Fresh Mozzarella Snacking Cheese",
    "displayName": "BelGioioso Fresh Mozzarella Snacking Cheese",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso mozzarella snack",
      "BelGioioso mozzarella snack pack",
      "BelGioioso fresh mozzarella snacking cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "fresh-mozzarella-snacking",
      "belgioioso"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 17.857,
      "carbs": 3.571,
      "fat": 17.857,
      "fiber": 0.0,
      "saturatedFat": 12.5,
      "sodium": 303.571,
      "cholesterol": 53.571,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 snack pack (28 g)",
        "amount": 1,
        "unit": "serving",
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "fresh-mozzarella-snacking",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 snack pack (28 g)",
        "servingGrams": 28,
        "calories": 70,
        "protein": 5,
        "carbs": 1,
        "fat": 5,
        "fiber": 0,
        "saturatedFat": 3.5,
        "sodium": 85,
        "cholesterol": 15,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-47992973",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk, vinegar, enzymes, salt.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": true,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-burrata",
    "name": "Burrata",
    "displayName": "BelGioioso Burrata",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso burrata",
      "burrata cheese BelGioioso",
      "BelGioioso burrata cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "burrata",
      "belgioioso"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 17.857,
      "carbs": 0.0,
      "fat": 25.0,
      "fiber": 0.0,
      "saturatedFat": 14.286,
      "sodium": 303.571,
      "cholesterol": 71.429,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "burrata",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 70,
        "protein": 5,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 4,
        "sodium": 85,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-84992816",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk, cream, vinegar, enzymes, salt.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-parmesan-wedge",
    "name": "Parmesan Cheese Wedge",
    "displayName": "BelGioioso Parmesan Cheese Wedge",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso parmesan",
      "BelGioioso parmesan wedge",
      "BelGioioso aged parmesan"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "parmesan-wedge",
      "belgioioso"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.86,
      "protein": 32.143,
      "carbs": 3.571,
      "fat": 25.0,
      "fiber": 0.0,
      "saturatedFat": 17.857,
      "sodium": 892.857,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "parmesan-wedge",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 9,
        "carbs": 1,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 5,
        "sodium": 250,
        "cholesterol": 25,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-86023078",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured milk, salt, enzymes.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-shredded-parmesan",
    "name": "Shredded Parmesan Cheese",
    "displayName": "BelGioioso Shredded Parmesan Cheese",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso shredded parmesan",
      "BelGioioso parmesan shredded"
    ],
    "tags": [
      "dairy",
      "branded",
      "cheese",
      "shredded-parmesan",
      "belgioioso"
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
      "protein": 40.0,
      "carbs": 0.0,
      "fat": 20.0,
      "fiber": 0.0,
      "saturatedFat": 20.0,
      "sodium": 900.0,
      "cholesterol": 100.0,
      "sugar": 0.0,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 Tbsp (5 g)",
        "amount": 1,
        "unit": "tbsp",
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "productLine": "shredded-parmesan",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 Tbsp (5 g)",
        "servingGrams": 5,
        "calories": 20,
        "protein": 2,
        "carbs": 0,
        "fat": 1,
        "fiber": 0,
        "saturatedFat": 1,
        "sodium": 45,
        "cholesterol": 5,
        "sugar": 0,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-50802708",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Parmesan cheese.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-belgioioso-mascarpone",
    "name": "Mascarpone Italian Sweet Cream Cheese",
    "displayName": "BelGioioso Mascarpone Italian Sweet Cream Cheese",
    "brand": "BelGioioso",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "BelGioioso mascarpone",
      "BelGioioso sweet cream cheese",
      "mascarpone BelGioioso"
    ],
    "tags": [
      "dairy",
      "branded",
      "mascarpone",
      "mascarpone",
      "belgioioso"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 428.57,
      "protein": 7.143,
      "carbs": 0.0,
      "fat": 50.0,
      "fiber": 0.0,
      "saturatedFat": 35.714,
      "sodium": 35.714,
      "cholesterol": 142.857,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "potassium": 0.0,
      "calcium": 185.714
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "mascarpone",
      "productLine": "mascarpone",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1 Tbsp (14 g)",
        "servingGrams": 14,
        "calories": 60,
        "protein": 1,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "saturatedFat": 5,
        "sodium": 5,
        "cholesterol": 20,
        "sugar": 0,
        "addedSugar": 0,
        "potassium": 0,
        "calcium": 26
      },
      "sourceProvenance": {
        "provider": "Target / BelGioioso",
        "sourceType": "current retailer package-label capture",
        "sourceUrl": "https://www.target.com/p/-/A-14929069",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized milk and cream, citric acid.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-good-culture-simply-cottage-cheese-4-percent",
    "name": "Simply 4% Whole Milk Classic Cottage Cheese",
    "displayName": "Good Culture Simply 4% Whole Milk Classic Cottage Cheese",
    "brand": "Good Culture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Good Culture 4% cottage cheese",
      "Good Culture whole milk cottage cheese",
      "Good Culture cottage cheese 4 percent"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "simply-4-percent",
      "good-culture"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 90.91,
      "protein": 12.727,
      "carbs": 1.818,
      "fat": 4.091,
      "fiber": 0.0,
      "saturatedFat": 2.727,
      "sodium": 345.455,
      "cholesterol": 13.636,
      "sugar": 1.818,
      "addedSugar": 0.0,
      "potassium": 63.636,
      "calcium": 63.636
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (110 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 110,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "simply-4-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (110 g)",
        "servingGrams": 110,
        "calories": 100,
        "protein": 14,
        "carbs": 2,
        "fat": 4.5,
        "fiber": 0,
        "saturatedFat": 3,
        "sodium": 380,
        "cholesterol": 15,
        "sugar": 2,
        "addedSugar": 0,
        "potassium": 70,
        "calcium": 70
      },
      "sourceProvenance": {
        "provider": "Good Culture",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://goodculture.com/product/simply-cottage-cheese-16-oz-whole-milk-classic/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Skim milk, whole milk, cream, sea salt, live and active cultures.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-good-culture-simply-cottage-cheese-2-percent",
    "name": "Simply 2% Low-Fat Classic Cottage Cheese",
    "displayName": "Good Culture Simply 2% Low-Fat Classic Cottage Cheese",
    "brand": "Good Culture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Good Culture 2% cottage cheese",
      "Good Culture low fat cottage cheese",
      "Good Culture cottage cheese 2 percent"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "simply-2-percent",
      "good-culture"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81.82,
      "protein": 12.727,
      "carbs": 3.636,
      "fat": 1.818,
      "fiber": 0.0,
      "saturatedFat": 1.364,
      "sodium": 345.455,
      "cholesterol": 9.091,
      "sugar": 3.636,
      "addedSugar": 0.0,
      "potassium": 118.182,
      "calcium": 100.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (110 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 110,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "simply-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (110 g)",
        "servingGrams": 110,
        "calories": 90,
        "protein": 14,
        "carbs": 4,
        "fat": 2,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 380,
        "cholesterol": 10,
        "sugar": 4,
        "addedSugar": 0,
        "potassium": 130,
        "calcium": 110
      },
      "sourceProvenance": {
        "provider": "Good Culture",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://goodculture.com/product/simply-cottage-cheese-16-oz-lowfat-classic/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Skim milk, whole milk, cream, sea salt, live and active cultures.",
      "lactoseFree": false,
      "organic": false,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-good-culture-organic-cottage-cheese-4-percent",
    "name": "Organic 4% Whole Milk Classic Cottage Cheese",
    "displayName": "Good Culture Organic 4% Whole Milk Classic Cottage Cheese",
    "brand": "Good Culture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Good Culture organic 4% cottage cheese",
      "Good Culture organic whole milk cottage cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "organic-4-percent",
      "good-culture"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 90.91,
      "protein": 12.727,
      "carbs": 1.818,
      "fat": 4.091,
      "fiber": 0.0,
      "saturatedFat": 2.727,
      "sodium": 345.455,
      "cholesterol": 13.636,
      "sugar": 1.818,
      "addedSugar": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (110 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 110,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "organic-4-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (110 g)",
        "servingGrams": 110,
        "calories": 100,
        "protein": 14,
        "carbs": 2,
        "fat": 4.5,
        "fiber": 0,
        "saturatedFat": 3,
        "sodium": 380,
        "cholesterol": 15,
        "sugar": 2,
        "addedSugar": 0
      },
      "sourceProvenance": {
        "provider": "Good Culture",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://goodculture.com/product/organic-cottage-cheese-16-oz-whole-milk-classic/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Organic skim milk, organic whole milk, organic cream, sea salt, live and active cultures.",
      "lactoseFree": false,
      "organic": true,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-good-culture-organic-cottage-cheese-2-percent",
    "name": "Organic 2% Low-Fat Classic Cottage Cheese",
    "displayName": "Good Culture Organic 2% Low-Fat Classic Cottage Cheese",
    "brand": "Good Culture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Good Culture organic 2% cottage cheese",
      "Good Culture organic low fat cottage cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "organic-2-percent",
      "good-culture"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81.82,
      "protein": 12.727,
      "carbs": 3.636,
      "fat": 1.818,
      "fiber": 0.0,
      "saturatedFat": 1.364,
      "sodium": 345.455,
      "cholesterol": 9.091,
      "sugar": 3.636,
      "addedSugar": 0.0,
      "potassium": 118.182,
      "calcium": 100.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (110 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 110,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "organic-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (110 g)",
        "servingGrams": 110,
        "calories": 90,
        "protein": 14,
        "carbs": 4,
        "fat": 2,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 380,
        "cholesterol": 10,
        "sugar": 4,
        "addedSugar": 0,
        "potassium": 130,
        "calcium": 110
      },
      "sourceProvenance": {
        "provider": "Good Culture",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://goodculture.com/product/organic-cottage-cheese-16-oz-low-fat-classic/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Organic skim milk, organic whole milk, organic cream, sea salt, live and active cultures.",
      "lactoseFree": false,
      "organic": true,
      "singleServe": false,
      "offlineReference": true,
      "normalizationMethod": "Exact package-label nutrition divided by the label serving mass and normalized mathematically to ARI's canonical 100 g basis.",
      "notes": null
    }
  },
  {
    "id": "dairy-brand-good-culture-lactose-free-cottage-cheese-2-percent",
    "name": "Simply Lactose-Free 2% Cottage Cheese",
    "displayName": "Good Culture Simply Lactose-Free 2% Cottage Cheese",
    "brand": "Good Culture",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Good Culture lactose free cottage cheese",
      "Good Culture lactose-free 2% cottage cheese",
      "Good Culture zero lactose cottage cheese"
    ],
    "tags": [
      "dairy",
      "branded",
      "cottage-cheese",
      "lactose-free-2-percent",
      "good-culture"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 81.82,
      "protein": 12.727,
      "carbs": 3.636,
      "fat": 1.818,
      "fiber": 0.0,
      "saturatedFat": 1.364,
      "sodium": 345.455,
      "cholesterol": 9.091,
      "sugar": 3.636,
      "addedSugar": 0.0,
      "potassium": 118.182,
      "calcium": 100.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/2 cup (110 g)",
        "amount": 1,
        "unit": "cup",
        "grams": 110,
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
    "source": "AriFoodDairyBrands3",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cottage-cheese",
      "productLine": "lactose-free-2-percent",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from package label",
      "labelNutrition": {
        "servingSize": "1/2 cup (110 g)",
        "servingGrams": 110,
        "calories": 90,
        "protein": 14,
        "carbs": 4,
        "fat": 2,
        "fiber": 0,
        "saturatedFat": 1.5,
        "sodium": 380,
        "cholesterol": 10,
        "sugar": 4,
        "addedSugar": 0,
        "potassium": 130,
        "calcium": 110
      },
      "sourceProvenance": {
        "provider": "Good Culture",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://goodculture.com/product/simply-cottage-cheese-15-oz-lactose-free/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Skim milk, whole milk, cream, sea salt, lactase enzyme, live and active cultures.",
      "lactoseFree": true,
      "organic": false,
      "singleServe": false,
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
      ARI_DAIRY_BRANDS_3_FOODS,
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
        ARI_DAIRY_BRANDS_3_FOODS.length,

      brandCount:
        new Set(
          ARI_DAIRY_BRANDS_3_FOODS.map(
            food => food.brand
          )
        ).size,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "ricotta",
        "fresh-mozzarella",
        "burrata",
        "parmesan",
        "mascarpone",
        "cottage-cheese"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} dairy-brand-3 record(s).`,
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

  global.AriFoodDairyBrands3 =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_DAIRY_BRANDS_3_FOODS.length;
      },

      getFoodIds() {
        return ARI_DAIRY_BRANDS_3_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_DAIRY_BRANDS_3_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getDairyTypes() {
        return Array.from(
          new Set(
            ARI_DAIRY_BRANDS_3_FOODS.map(
              food => food.metadata.dairyType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_DAIRY_BRANDS_3_FOODS
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

        return ARI_DAIRY_BRANDS_3_FOODS
          .filter(
            food =>
              String(
                food.metadata?.dairyType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getLactoseFree() {
        return ARI_DAIRY_BRANDS_3_FOODS
          .filter(
            food =>
              food.metadata?.lactoseFree === true
          )
          .map(clone);
      },

      getOrganic() {
        return ARI_DAIRY_BRANDS_3_FOODS
          .filter(
            food =>
              food.metadata?.organic === true
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
          ARI_DAIRY_BRANDS_3_FOODS.find(
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
        "ari:food-dairy-brands-3-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_DAIRY_BRANDS_3_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_DAIRY_BRANDS_3_FOODS.length} branded dairy records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
