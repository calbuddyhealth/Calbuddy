// =====================================================
// ARI REBIRTH
// File: AriFoodBeverageCore.js
// Version: 1.0.0
//
// Purpose:
//   Small generic fallback beverage layer for ARI Nutrition.
//
// Collection:
//   AriFoodBeverages
//
// Coverage:
//   - Plain bottled water
//   - Club soda
//   - Brewed black coffee
//   - Espresso
//   - Brewed decaf coffee
//   - Unsweetened black tea
//   - Unsweetened green tea
//   - Unsweetened herbal tea
//   - Unsweetened chamomile tea
//   - 100% unsweetened orange juice
//   - 100% unsweetened apple juice
//
// Architecture:
//   Beverages are brand-first.
//
//   These records exist only as generic fallbacks.
//   Exact branded/manufacturer records should win whenever
//   ARI has a matching packaged beverage.
//
// Canonical basis:
//   100 mL for fluid beverages.
//
// Source conversion:
//   USDA source values are generally published per 100 g.
//   This module preserves those original values and converts
//   them to 100 mL using a documented density/common-measure
//   relationship.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodBeverages v1+
// =====================================================

(function initializeAriFoodBeverageCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBeverageCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "small generic fallback layer for a brand-first beverage collection",
  "recordCount": 11,
  "records": [
    "plain bottled water",
    "plain club soda",
    "brewed black coffee",
    "plain espresso",
    "brewed decaf coffee",
    "unsweetened black tea",
    "unsweetened green tea",
    "unsweetened herbal tea",
    "unsweetened chamomile tea",
    "100% unsweetened orange juice",
    "100% unsweetened apple juice"
  ],
  "canonicalBasis": {
    "type": "volume",
    "amount": 100,
    "unit": "mL",
    "milliliters": 100
  },
  "sourceHierarchy": [
    "USDA FoodData Central stable generic beverage references",
    "USDA common-measure gram-per-volume relationships for density normalization",
    "Exact manufacturer labels should override these fallback records for packaged branded products"
  ],
  "rules": [
    "Canonical beverage nutrition basis is 100 mL.",
    "Preserve original USDA per-100-g values in metadata.sourceNutritionPer100g.",
    "Document density or gram-per-volume assumptions explicitly.",
    "Do not silently assume every beverage has density exactly equal to water.",
    "Branded packaged beverages override generic fallback records.",
    "Do not map milk/cream/sugar coffee drinks to plain brewed coffee.",
    "Do not map sweetened tea to unsweetened tea.",
    "Do not map juice cocktails or juice drinks to 100% juice.",
    "Do not map tonic water to club soda.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BEVERAGE_CORE_FOODS =
    [
  {
    "id": "beverage-core-water-bottled",
    "name": "Water",
    "displayName": "Water â Bottled, Plain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "water",
      "plain water",
      "bottled water",
      "still water"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "water",
      "fallback"
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
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 0.0,
      "potassium": 0.0,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "16-9-fl-oz",
        "label": "16.9 fl oz",
        "amount": 16.9,
        "unit": "fl oz",
        "milliliters": 499.792,
        "grams": 499.792,
        "isDefault": false
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "water",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 0,
        "potassium": 0,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 174158,
        "sourceDescription": "Water, bottled, generic",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-standard 1.000 g/mL",
        "approximate": false
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": "Fallback for plain unflavored water only. Mineral, electrolyte, alkaline, flavored, and branded waters should resolve to exact branded records when available."
    }
  },
  {
    "id": "beverage-core-club-soda",
    "name": "Club Soda",
    "displayName": "Club Soda â Plain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "carbonated",
    "aliases": [
      "club soda",
      "soda water",
      "carbonated water with minerals"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "club-soda",
      "fallback"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 100.0
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 21.0,
      "potassium": 2.0,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "12-fl-oz",
        "label": "12 fl oz",
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
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "club-soda",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 21,
        "potassium": 2,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 174842,
        "sourceDescription": "Beverages, carbonated, club soda",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like fallback 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": "Club soda contains added mineral salts and is not interchangeable with every plain sparkling-water brand. Exact branded sparkling/mineral water should override it."
    }
  },
  {
    "id": "beverage-core-coffee-brewed-black",
    "name": "Coffee",
    "displayName": "Coffee â Brewed, Black",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "coffee",
      "black coffee",
      "brewed coffee",
      "plain coffee",
      "drip coffee"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "coffee",
      "fallback"
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
      "calories": 1.0,
      "protein": 0.12,
      "carbs": 0.0,
      "fat": 0.02,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 2.0,
      "potassium": 49.0,
      "caffeine": 40.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup brewed coffee",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "8-fl-oz",
        "label": "8 fl oz",
        "amount": 8,
        "unit": "fl oz",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": false
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "coffee",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 1,
        "protein": 0.12,
        "carbs": 0,
        "fat": 0.02,
        "fiber": 0,
        "sugar": 0,
        "sodium": 2,
        "potassium": 49,
        "caffeine": 40
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171890,
        "sourceDescription": "Beverages, coffee, brewed, prepared with tap water",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like brewed beverage approximation 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": "Plain brewed coffee only. Milk, cream, sugar, syrups, cold-foam, and branded ready-to-drink coffee products must be logged separately."
    }
  },
  {
    "id": "beverage-core-espresso",
    "name": "Espresso",
    "displayName": "Espresso â Plain",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "espresso",
      "espresso shot",
      "shot of espresso",
      "plain espresso"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "espresso",
      "fallback"
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
      "calories": 9.0,
      "protein": 0.12,
      "carbs": 1.67,
      "fat": 0.18,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 14.0,
      "potassium": 115.0,
      "caffeine": 212.0
    },
    "servings": [
      {
        "id": "1-shot",
        "label": "1 espresso shot (1 fl oz)",
        "amount": 1,
        "unit": "shot",
        "milliliters": 29.574,
        "grams": 29.574,
        "isDefault": true
      },
      {
        "id": "double-shot",
        "label": "2 espresso shots (2 fl oz)",
        "amount": 2,
        "unit": "shot",
        "milliliters": 59.147,
        "grams": 59.147,
        "isDefault": false
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "espresso",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 9,
        "protein": 0.12,
        "carbs": 1.67,
        "fat": 0.18,
        "fiber": 0,
        "sugar": 0,
        "sodium": 14,
        "potassium": 115,
        "caffeine": 212
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171891,
        "sourceDescription": "Beverages, coffee, brewed, espresso, restaurant-prepared",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like espresso approximation 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": null
    }
  },
  {
    "id": "beverage-core-coffee-brewed-decaf",
    "name": "Decaf Coffee",
    "displayName": "Coffee â Brewed, Decaffeinated",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "decaf coffee",
      "decaffeinated coffee",
      "black decaf coffee",
      "brewed decaf"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "decaf-coffee",
      "fallback"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 100.0
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.1,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "caffeine": 1.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup decaf coffee",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "decaf-coffee",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 0,
        "protein": 0.1,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "caffeine": 1
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171889,
        "sourceDescription": "Beverages, coffee, brewed, prepared with tap water, decaffeinated",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like brewed beverage approximation 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "caffeine"
      ],
      "offlineReference": true,
      "notes": null
    }
  },
  {
    "id": "beverage-core-tea-black-brewed-unsweetened",
    "name": "Black Tea",
    "displayName": "Black Tea â Brewed, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "black tea",
      "brewed black tea",
      "plain black tea",
      "unsweetened black tea",
      "hot tea"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "black-tea",
      "fallback"
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
      "calories": 1.0,
      "protein": 0.0,
      "carbs": 0.3,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 3.0,
      "potassium": 37.0,
      "caffeine": 20.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup black tea",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "black-tea",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 1,
        "protein": 0,
        "carbs": 0.3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 3,
        "potassium": 37,
        "caffeine": 20
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173227,
        "sourceDescription": "Beverages, tea, black, brewed, prepared with tap water",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "USDA brewed-tea common measure approximately 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": null
    }
  },
  {
    "id": "beverage-core-tea-green-brewed-unsweetened",
    "name": "Green Tea",
    "displayName": "Green Tea â Brewed, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "green tea",
      "brewed green tea",
      "plain green tea",
      "unsweetened green tea"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "green-tea",
      "fallback"
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
      "calories": 1.0,
      "protein": 0.22,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "caffeine": 12.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup green tea",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "green-tea",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 1,
        "protein": 0.22,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "caffeine": 12
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171917,
        "sourceDescription": "Beverages, tea, green, brewed, regular",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like brewed beverage approximation 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "caffeine"
      ],
      "offlineReference": true,
      "notes": null
    }
  },
  {
    "id": "beverage-core-tea-herbal-brewed-unsweetened",
    "name": "Herbal Tea",
    "displayName": "Herbal Tea â Brewed, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "herbal tea",
      "herb tea",
      "caffeine free tea",
      "caffeine-free tea",
      "unsweetened herbal tea"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "herbal-tea",
      "fallback"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 100.0
    },
    "nutrition": {
      "calories": 1.0,
      "protein": 0.0,
      "carbs": 0.2,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup herbal tea",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "herbal-tea",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 1,
        "protein": 0,
        "carbs": 0.2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173232,
        "sourceDescription": "Beverages, tea, herb, other than chamomile, brewed",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "water-like brewed beverage approximation 1.000 g/mL",
        "approximate": true
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "caffeine"
      ],
      "offlineReference": true,
      "notes": "Generic non-chamomile herbal-tea fallback. Specific herbal blends and branded bottled teas should use their own records."
    }
  },
  {
    "id": "beverage-core-tea-chamomile-brewed-unsweetened",
    "name": "Chamomile Tea",
    "displayName": "Chamomile Tea â Brewed, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "brewed",
    "aliases": [
      "chamomile tea",
      "camomile tea",
      "brewed chamomile",
      "unsweetened chamomile tea"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "chamomile-tea",
      "fallback"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 100.0
    },
    "nutrition": {
      "calories": 1.0,
      "protein": 0.0,
      "carbs": 0.2,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodium": 1.0,
      "potassium": 9.0,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "1-cup",
        "label": "1 cup chamomile tea",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 236.588,
        "isDefault": true
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 100.0,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "chamomile-tea",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 1,
        "protein": 0,
        "carbs": 0.2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 1,
        "potassium": 9,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 174156,
        "sourceDescription": "Beverages, tea, herb, brewed, chamomile",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.0,
        "basis": "USDA 1 fl oz = 29.6 g; effectively water-like",
        "approximate": false
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
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
      "notes": null
    }
  },
  {
    "id": "beverage-core-orange-juice-100-percent-unsweetened",
    "name": "Orange Juice",
    "displayName": "Orange Juice â 100%, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "orange juice",
      "100% orange juice",
      "unsweetened orange juice",
      "plain orange juice",
      "OJ"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "orange-juice",
      "fallback"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 105.162
    },
    "nutrition": {
      "calories": 49.43,
      "protein": 0.715,
      "carbs": 11.578,
      "fat": 0.158,
      "fiber": 0.315,
      "sugar": 9.212,
      "saturatedFat": 0.019,
      "sodium": 4.206,
      "potassium": 193.497,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "8-fl-oz",
        "label": "8 fl oz orange juice",
        "amount": 8,
        "unit": "fl oz",
        "milliliters": 236.588,
        "grams": 248.8,
        "isDefault": true
      },
      {
        "id": "1-cup",
        "label": "1 cup orange juice",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 248.8,
        "isDefault": false
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 105.162,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "orange-juice",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 47,
        "protein": 0.68,
        "carbs": 11.01,
        "fat": 0.15,
        "fiber": 0.3,
        "sugar": 8.76,
        "saturatedFat": 0.018,
        "sodium": 4,
        "potassium": 184,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 169099,
        "sourceDescription": "Orange juice, canned, unsweetened",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.051616,
        "basis": "USDA common measure: 1 fl oz = 31.1 g; density 1.051616 g/mL",
        "approximate": false
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "caffeine"
      ],
      "offlineReference": true,
      "notes": "Fallback for unbranded 100% unsweetened orange juice. Fortified, pulp-specific, from-concentrate, fresh-squeezed, and branded products should use more exact records."
    }
  },
  {
    "id": "beverage-core-apple-juice-100-percent-unsweetened",
    "name": "Apple Juice",
    "displayName": "Apple Juice â 100%, Unsweetened",
    "category": "beverage",
    "state": "ready-to-drink",
    "preparation": "packaged",
    "aliases": [
      "apple juice",
      "100% apple juice",
      "unsweetened apple juice",
      "plain apple juice"
    ],
    "tags": [
      "beverage",
      "beverage-core",
      "apple-juice",
      "fallback"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100,
      "grams": 104.823
    },
    "nutrition": {
      "calories": 48.22,
      "protein": 0.105,
      "carbs": 11.845,
      "fat": 0.136,
      "fiber": 0.21,
      "sugar": 10.084,
      "saturatedFat": 0.023,
      "sodium": 4.193,
      "potassium": 105.872,
      "caffeine": 0.0
    },
    "servings": [
      {
        "id": "8-fl-oz",
        "label": "8 fl oz apple juice",
        "amount": 8,
        "unit": "fl oz",
        "milliliters": 236.588,
        "grams": 248.0,
        "isDefault": true
      },
      {
        "id": "1-cup",
        "label": "1 cup apple juice",
        "amount": 1,
        "unit": "cup",
        "milliliters": 236.588,
        "grams": 248.0,
        "isDefault": false
      },
      {
        "id": "100-ml",
        "label": "100 mL",
        "amount": 100,
        "unit": "mL",
        "milliliters": 100.0,
        "grams": 104.823,
        "isDefault": false
      }
    ],
    "source": "AriFoodBeverageCore",
    "verified": true,
    "metadata": {
      "foodFamily": "beverage",
      "beverageType": "apple-juice",
      "fallbackRecord": true,
      "brandSpecific": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 mL",
      "sourceNutritionPer100g": {
        "calories": 46,
        "protein": 0.1,
        "carbs": 11.3,
        "fat": 0.13,
        "fiber": 0.2,
        "sugar": 9.62,
        "saturatedFat": 0.022,
        "sodium": 4,
        "potassium": 101,
        "caffeine": 0
      },
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173933,
        "sourceDescription": "Apple juice, canned or bottled, unsweetened, without added ascorbic acid",
        "verifiedAt": "2026-08-03",
        "sourceReferenceBasis": "100 g"
      },
      "density": {
        "gramsPerMilliliter": 1.048235,
        "basis": "USDA common measure: 1 fl oz = 31.0 g; density 1.048235 g/mL",
        "approximate": false
      },
      "normalizationMethod": "USDA nutrient values are published per 100 g. ARI converts them to its beverage-standard 100 mL basis using the documented density or USDA common-measure gram-per-volume relationship.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium",
        "caffeine"
      ],
      "offlineReference": true,
      "notes": "Fallback for unbranded 100% unsweetened apple juice. Fortified, filtered specialty, cider, juice drink, juice cocktail, and branded products should use separate records."
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
      ARI_BEVERAGE_CORE_FOODS,
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
        ARI_BEVERAGE_CORE_FOODS.length,

      runtimeInternetRequired:
        false,

      brandFirst:
        true,

      fallbackOnly:
        true,

      canonicalBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "water",
        "club-soda",
        "coffee",
        "espresso",
        "decaf-coffee",
        "black-tea",
        "green-tea",
        "herbal-tea",
        "chamomile-tea",
        "orange-juice",
        "apple-juice"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} beverage-core record(s).`,
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

  global.AriFoodBeverageCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_BEVERAGE_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_BEVERAGE_CORE_FOODS.map(
          food => food.id
        );
      },

      getBeverageTypes() {
        return Array.from(
          new Set(
            ARI_BEVERAGE_CORE_FOODS.map(
              food =>
                food.metadata.beverageType
            )
          )
        );
      },

      getByBeverageType(beverageType) {
        const normalized =
          String(beverageType || "")
            .trim()
            .toLowerCase();

        return ARI_BEVERAGE_CORE_FOODS
          .filter(
            food =>
              String(
                food.metadata?.beverageType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getCaffeinated() {
        return ARI_BEVERAGE_CORE_FOODS
          .filter(
            food =>
              Number(
                food.nutrition?.caffeine || 0
              ) > 0
          )
          .map(clone);
      },

      getFallbackRecords() {
        return ARI_BEVERAGE_CORE_FOODS
          .map(clone);
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_BEVERAGE_CORE_FOODS.find(
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
        "ari:food-beverage-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_BEVERAGE_CORE_FOODS.length,

            brandFirst:
              true,

            fallbackOnly:
              true,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BEVERAGE_CORE_FOODS.length} generic beverage fallback records using the 100 mL canonical basis.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
