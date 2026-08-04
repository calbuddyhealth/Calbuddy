// =====================================================
// ARI REBIRTH
// File: AriFoodFatsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic solid/semi-solid culinary-fat
//   fallback dataset for ARI Nutrition.
//
// Collection:
//   AriFoodFats
//
// Coverage:
//   10 generic fat records.
//
// Included:
//   - Salted butter
//   - Unsalted butter
//   - Whipped salted butter
//   - Ghee
//   - Clarified butter
//   - Regular margarine
//   - Light margarine
//   - Plant-based buttery spread
//   - Plant-based light spread
//   - Vegetable shortening
//
// Excluded:
//   - Cooking oils
//     -> AriFoodOils
//   - Mayonnaise
//     -> AriFoodCondiments
//   - Nut butters
//
// Canonical basis:
//   100 g.
//
// Default serving:
//   1 tbsp, with gram weight stored per record.
//
// Strategy:
//   Generic fallback only. Exact branded records from
//   AriFoodFatBrands should outrank these.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFats v1+
// =====================================================

(function initializeAriFoodFatsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodFatsCore";
  const VERIFIED_AT = "2026-08-04";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-04",
  "runtimeInternetRequired": false,
  "strategy": "generic solid and semi-solid culinary-fat core for the ARI Fats pathway",
  "recordCount": 10,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Preserve realistic household tablespoon gram weights per product type.",
    "Generic records are fallbacks; exact branded fat products should outrank them.",
    "Keep mayonnaise in AriFoodCondiments.",
    "Keep liquid cooking oils in AriFoodOils.",
    "Keep nut butters outside this pathway.",
    "Do not infer how much cooking fat was absorbed by another food.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_FAT_CORE_FOODS = Object.freeze(
[
  {
    "id": "fats-butter-salted",
    "name": "Butter, Salted",
    "displayName": "Salted Butter",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "salted",
    "aliases": [
      "Salted Butter",
      "Butter, Salted",
      "butter",
      "salted butter",
      "regular butter"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "butter",
      "salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.85,
      "carbs": 0.06,
      "fat": 81.11,
      "saturatedFat": 51.37,
      "sugar": 0.06,
      "sodiumMg": 643
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
          "calories": 100.4,
          "protein": 0.12,
          "carbs": 0.01,
          "fat": 11.36,
          "saturatedFat": 7.19,
          "sugar": 0.01,
          "sodiumMg": 90.0
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "salted",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-butter-unsalted",
    "name": "Butter, Unsalted",
    "displayName": "Unsalted Butter",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "unsalted",
    "aliases": [
      "Unsalted Butter",
      "Butter, Unsalted",
      "unsalted butter",
      "sweet cream butter"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "butter",
      "unsalted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.85,
      "carbs": 0.06,
      "fat": 81.11,
      "saturatedFat": 51.37,
      "sugar": 0.06,
      "sodiumMg": 11
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
          "calories": 100.4,
          "protein": 0.12,
          "carbs": 0.01,
          "fat": 11.36,
          "saturatedFat": 7.19,
          "sugar": 0.01,
          "sodiumMg": 1.5
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "unsalted",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-butter-whipped-salted",
    "name": "Butter, Whipped, Salted",
    "displayName": "Whipped Salted Butter",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "whipped-salted",
    "aliases": [
      "Whipped Salted Butter",
      "Butter, Whipped, Salted",
      "whipped butter",
      "whipped salted butter"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "butter",
      "whipped-salted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.85,
      "carbs": 0.06,
      "fat": 81.11,
      "saturatedFat": 51.37,
      "sugar": 0.06,
      "sodiumMg": 643
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 9,
        "isDefault": true,
        "nutrition": {
          "calories": 64.5,
          "protein": 0.08,
          "carbs": 0.01,
          "fat": 7.3,
          "saturatedFat": 4.62,
          "sugar": 0.01,
          "sodiumMg": 57.9
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 3.0,
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "butter",
      "fatStyle": "whipped-salted",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-ghee",
    "name": "Ghee",
    "displayName": "Ghee",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "clarified-butter",
    "aliases": [
      "Ghee",
      "ghee",
      "clarified butter"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "ghee",
      "clarified-butter"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 900,
      "protein": 0,
      "carbs": 0,
      "fat": 100,
      "saturatedFat": 62,
      "sugar": 0,
      "sodiumMg": 0
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
          "calories": 126.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 14.0,
          "saturatedFat": 8.68,
          "sugar": 0.0,
          "sodiumMg": 0.0
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "ghee",
      "fatStyle": "clarified-butter",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-clarified-butter",
    "name": "Clarified Butter",
    "displayName": "Clarified Butter",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "clarified",
    "aliases": [
      "Clarified Butter",
      "clarified butter",
      "butter oil"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "clarified-butter",
      "clarified"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 876,
      "protein": 0.28,
      "carbs": 0,
      "fat": 99.48,
      "saturatedFat": 61.9,
      "sugar": 0,
      "sodiumMg": 2
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
          "calories": 122.6,
          "protein": 0.04,
          "carbs": 0.0,
          "fat": 13.93,
          "saturatedFat": 8.67,
          "sugar": 0.0,
          "sodiumMg": 0.3
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "clarified-butter",
      "fatStyle": "clarified",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-margarine-regular",
    "name": "Margarine, Regular",
    "displayName": "Regular Margarine",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "regular",
    "aliases": [
      "Regular Margarine",
      "Margarine, Regular",
      "margarine",
      "regular margarine"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "margarine",
      "regular"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 717,
      "protein": 0.16,
      "carbs": 0.7,
      "fat": 80.71,
      "saturatedFat": 15.19,
      "sugar": 0,
      "sodiumMg": 751
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
          "calories": 100.4,
          "protein": 0.02,
          "carbs": 0.1,
          "fat": 11.3,
          "saturatedFat": 2.13,
          "sugar": 0.0,
          "sodiumMg": 105.1
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "margarine",
      "fatStyle": "regular",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-margarine-light",
    "name": "Margarine, Light",
    "displayName": "Light Margarine",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "light",
    "aliases": [
      "Light Margarine",
      "Margarine, Light",
      "light margarine",
      "reduced fat margarine"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "margarine",
      "light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 499,
      "protein": 0.4,
      "carbs": 1.5,
      "fat": 55,
      "saturatedFat": 10.5,
      "sugar": 0.3,
      "sodiumMg": 650
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
          "calories": 69.9,
          "protein": 0.06,
          "carbs": 0.21,
          "fat": 7.7,
          "saturatedFat": 1.47,
          "sugar": 0.04,
          "sodiumMg": 91.0
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "margarine",
      "fatStyle": "light",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-plant-based-buttery-spread",
    "name": "Plant-Based Buttery Spread",
    "displayName": "Plant-Based Buttery Spread",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "regular",
    "aliases": [
      "Plant-Based Buttery Spread",
      "plant butter",
      "vegan butter spread",
      "plant-based spread"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "plant-based-spread",
      "regular"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 650,
      "protein": 0,
      "carbs": 1,
      "fat": 72,
      "saturatedFat": 20,
      "sugar": 0,
      "sodiumMg": 600
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
          "calories": 91.0,
          "protein": 0.0,
          "carbs": 0.14,
          "fat": 10.08,
          "saturatedFat": 2.8,
          "sugar": 0.0,
          "sodiumMg": 84.0
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-spread",
      "fatStyle": "regular",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-plant-based-light-spread",
    "name": "Plant-Based Light Buttery Spread",
    "displayName": "Plant-Based Light Buttery Spread",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "light",
    "aliases": [
      "Plant-Based Light Buttery Spread",
      "light plant butter",
      "light vegan butter spread"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "plant-based-spread",
      "light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400,
      "protein": 0,
      "carbs": 1,
      "fat": 44,
      "saturatedFat": 12,
      "sugar": 0,
      "sodiumMg": 600
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
          "calories": 56.0,
          "protein": 0.0,
          "carbs": 0.14,
          "fat": 6.16,
          "saturatedFat": 1.68,
          "sugar": 0.0,
          "sodiumMg": 84.0
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "plant-based-spread",
      "fatStyle": "light",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
    }
  },
  {
    "id": "fats-vegetable-shortening",
    "name": "Vegetable Shortening",
    "displayName": "Vegetable Shortening",
    "brand": null,
    "category": "fats",
    "state": "solid-or-semi-solid",
    "preparation": "vegetable",
    "aliases": [
      "Vegetable Shortening",
      "shortening",
      "vegetable shortening"
    ],
    "tags": [
      "fats",
      "generic",
      "culinary-fat",
      "shortening",
      "vegetable"
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
      "saturatedFat": 25,
      "sugar": 0,
      "sodiumMg": 0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 13,
        "isDefault": true,
        "nutrition": {
          "calories": 114.9,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 13.0,
          "saturatedFat": 3.25,
          "sugar": 0.0,
          "sodiumMg": 0.0
        }
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.33,
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
    "source": "AriFoodFatsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "fats",
      "fatType": "shortening",
      "fatStyle": "vegetable",
      "genericFood": true,
      "brandSpecific": false,
      "culinaryFat": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic fat references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic culinary-fat fallback. Exact branded butter, margarine, plant-based spread, ghee, or shortening products should use AriFoodFatBrands when available. Mayonnaise remains in AriFoodCondiments and cooking oils remain in AriFoodOils."
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
    if (!global.AriFoodFats) {
      return false;
    }

    if (
      typeof global.AriFoodFats.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodFats.isKnownModule(
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
      global.AriFoodFats &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodFats.markModuleFailed ===
        "function"
    ) {
      global.AriFoodFats.markModuleFailed(
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

  const registration =
    registry.registerMany(
      ARI_FAT_CORE_FOODS,
      { source: MODULE_NAME }
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
        ARI_FAT_CORE_FOODS.length,

      fatTypes:
        Array.from(
          new Set(
            ARI_FAT_CORE_FOODS.map(
              food =>
                food.metadata?.fatType
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
      `Registration rejected ${registration.rejected} fat-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodFats &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodFats.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodFats.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodFatsCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_FAT_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_FAT_CORE_FOODS.map(
          food => food.id
        );
      },

      getFatTypes() {
        return Array.from(
          new Set(
            ARI_FAT_CORE_FOODS.map(
              food =>
                food.metadata?.fatType
            )
          )
        );
      },

      getByFatType(fatType) {
        const normalized =
          normalizeText(fatType);

        return ARI_FAT_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.fatType
              ) === normalized
          )
          .map(clone);
      },

      getByStyle(style) {
        const normalized =
          normalizeText(style);

        return ARI_FAT_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.fatStyle
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_FAT_CORE_FOODS.find(
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
        "ari:food-fats-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_FAT_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_FAT_CORE_FOODS.length} generic fat records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
