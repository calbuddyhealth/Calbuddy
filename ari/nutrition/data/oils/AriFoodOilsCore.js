// =====================================================
// ARI REBIRTH
// File: AriFoodOilsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic culinary-oil nutrition dataset for
//   ARI Nutrition's Oils pathway.
//
// Collection:
//   AriFoodOils
//
// Coverage:
//   13 generic oil records.
//
// Included:
//   - Extra virgin olive oil
//   - Olive oil
//   - Avocado oil
//   - Canola oil
//   - Vegetable / soybean oil
//   - Corn oil
//   - Peanut oil
//   - Sesame oil
//   - Toasted sesame oil
//   - Coconut oil
//   - Grapeseed oil
//   - Sunflower oil
//   - Safflower oil
//
// Excluded by design:
//   - Butter
//   - Margarine
//   - Mayonnaise
//   - Salad dressings
//   - Sauces / condiments
//   - Flavored / infused oil products
//
// Canonical basis:
//   100 g.
//
// Default serving:
//   1 tbsp, with gram weight stored per record.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodOils v1+
// =====================================================

(function initializeAriFoodOilsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodOilsCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic pure-oil core for the ARI Oils pathway",
  "recordCount": 13,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "defaultServing": {
    "label": "1 tbsp",
    "note": "Exact gram weight varies slightly by oil and is stored per record."
  },
  "sourceHierarchy": [
    "USDA FoodData Central / standard generic oil references",
    "Frozen offline reference values"
  ],
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Expose 1 tbsp as the default household serving.",
    "Store the gram weight of one tablespoon per oil.",
    "Pure oils have zero protein and carbohydrate unless a product-specific record proves otherwise.",
    "Do not infer how much cooking oil is absorbed by another food.",
    "Keep butter, margarine, mayonnaise, salad dressing, and sauces outside the Oils pathway.",
    "Keep flavored or infused oils separate from generic pure oils.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_OIL_CORE_FOODS = Object.freeze(
[
  {
    "id": "oils-extra-virgin-olive-oil",
    "name": "Extra Virgin Olive Oil",
    "displayName": "Extra Virgin Olive Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "extra-virgin",
    "aliases": [
      "Extra Virgin Olive Oil",
      "evoo",
      "extra virgin olive oil",
      "olive oil extra virgin"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "olive",
      "extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13.5,
        "isDefault": true,
        "nutrition": {
          "calories": 119.3,
          "protein": 0,
          "carbs": 0,
          "fat": 13.5
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.5,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "extra-virgin",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-olive-oil",
    "name": "Olive Oil",
    "displayName": "Olive Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "refined-or-blended",
    "aliases": [
      "Olive Oil",
      "olive oil",
      "pure olive oil",
      "light olive oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "olive",
      "refined-or-blended"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13.5,
        "isDefault": true,
        "nutrition": {
          "calories": 119.3,
          "protein": 0,
          "carbs": 0,
          "fat": 13.5
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.5,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "refined-or-blended",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-avocado-oil",
    "name": "Avocado Oil",
    "displayName": "Avocado Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Avocado Oil",
      "avocado oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "avocado",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "avocado",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-canola-oil",
    "name": "Canola Oil",
    "displayName": "Canola Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Canola Oil",
      "canola oil",
      "rapeseed oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "canola",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "canola",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-vegetable-oil-soybean",
    "name": "Vegetable Oil, Soybean",
    "displayName": "Vegetable Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "vegetable-oil",
    "aliases": [
      "Vegetable Oil",
      "Vegetable Oil, Soybean",
      "vegetable oil",
      "soybean oil",
      "soy oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "soybean",
      "vegetable-oil"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "soybean",
      "oilStyle": "vegetable-oil",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-corn-oil",
    "name": "Corn Oil",
    "displayName": "Corn Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Corn Oil",
      "corn oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "corn",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "corn",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-peanut-oil",
    "name": "Peanut Oil",
    "displayName": "Peanut Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Peanut Oil",
      "peanut oil",
      "groundnut oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "peanut",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "peanut",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-sesame-oil",
    "name": "Sesame Oil",
    "displayName": "Sesame Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Sesame Oil",
      "sesame oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "sesame",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13.6,
        "isDefault": true,
        "nutrition": {
          "calories": 120.2,
          "protein": 0,
          "carbs": 0,
          "fat": 13.6
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.53,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sesame",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-toasted-sesame-oil",
    "name": "Toasted Sesame Oil",
    "displayName": "Toasted Sesame Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "toasted",
    "aliases": [
      "Toasted Sesame Oil",
      "toasted sesame oil",
      "dark sesame oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "sesame",
      "toasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13.6,
        "isDefault": true,
        "nutrition": {
          "calories": 120.2,
          "protein": 0,
          "carbs": 0,
          "fat": 13.6
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.53,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sesame",
      "oilStyle": "toasted",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-coconut-oil",
    "name": "Coconut Oil",
    "displayName": "Coconut Oil",
    "brand": null,
    "category": "oils",
    "state": "semi-solid-or-liquid",
    "preparation": "generic",
    "aliases": [
      "Coconut Oil",
      "coconut oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "coconut",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 892,
      "protein": 0,
      "carbs": 0,
      "fat": 99.1,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13.6,
        "isDefault": true,
        "nutrition": {
          "calories": 121.3,
          "protein": 0,
          "carbs": 0,
          "fat": 13.5
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.53,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "coconut",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-grapeseed-oil",
    "name": "Grapeseed Oil",
    "displayName": "Grapeseed Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Grapeseed Oil",
      "grapeseed oil",
      "grape seed oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "grapeseed",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "grapeseed",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-sunflower-oil",
    "name": "Sunflower Oil",
    "displayName": "Sunflower Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Sunflower Oil",
      "sunflower oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "sunflower",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sunflower",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
    }
  },
  {
    "id": "oils-safflower-oil",
    "name": "Safflower Oil",
    "displayName": "Safflower Oil",
    "brand": null,
    "category": "oils",
    "state": "liquid",
    "preparation": "generic",
    "aliases": [
      "Safflower Oil",
      "safflower oil"
    ],
    "tags": [
      "oils",
      "generic",
      "culinary-oil",
      "safflower",
      "generic"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 884,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "fiber": 0,
      "sugar": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 123.8,
          "protein": 0,
          "carbs": 0,
          "fat": 14.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
        "isDefault": false
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
    "source": "AriFoodOilsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "safflower",
      "oilStyle": "generic",
      "genericFood": true,
      "brandSpecific": false,
      "pureOil": true,
      "addedSugar": false,
      "addedSodium": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic oil references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic pure culinary oil. Do not infer oil absorption into cooked foods. Butter, margarine, mayonnaise, dressings, flavored oils, and branded oil blends belong in separate records."
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

  function controllerKnowsThisModule() {
    if (!global.AriFoodOils) {
      return false;
    }

    if (
      typeof global.AriFoodOils.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodOils.isKnownModule(
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
      global.AriFoodOils &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodOils.markModuleFailed ===
        "function"
    ) {
      global.AriFoodOils.markModuleFailed(
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
    ARI_OIL_CORE_FOODS,
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
        ARI_OIL_CORE_FOODS.length,

      oilTypes: Array.from(
        new Set(
          ARI_OIL_CORE_FOODS.map(
            food => food.metadata?.oilType
          )
        )
      ),

      runtimeInternetRequired: false,
      genericCore: true,

      canonicalBasis: {
        type: "weight",
        amount: 100,
        unit: "g",
        grams: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} oil-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodOils &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodOils.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodOils.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodOilsCore = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_OIL_CORE_FOODS.length;
    },

    getFoodIds() {
      return ARI_OIL_CORE_FOODS.map(
        food => food.id
      );
    },

    getOilTypes() {
      return Array.from(
        new Set(
          ARI_OIL_CORE_FOODS.map(
            food => food.metadata?.oilType
          )
        )
      );
    },

    getByOilType(oilType) {
      const normalized =
        normalizeText(oilType);

      return ARI_OIL_CORE_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.oilType
            ) === normalized
        )
        .map(clone);
    },

    getByStyle(style) {
      const normalized =
        normalizeText(style);

      return ARI_OIL_CORE_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.oilStyle
            ) === normalized
        )
        .map(clone);
    },

    getRecord(foodId) {
      const record =
        ARI_OIL_CORE_FOODS.find(
          food =>
            food.id ===
            String(foodId || "").trim()
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
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-oils-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_OIL_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OIL_CORE_FOODS.length} generic oil records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);