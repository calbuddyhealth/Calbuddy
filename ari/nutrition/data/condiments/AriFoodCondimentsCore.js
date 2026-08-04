// =====================================================
// ARI REBIRTH
// File: AriFoodCondimentsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic condiment, sauce, and dressing
//   fallback dataset for ARI Nutrition.
//
// Collection:
//   AriFoodCondiments
//
// Coverage:
//   18 generic condiment records.
//
// Included:
//   - Ketchup
//   - Yellow mustard
//   - Dijon mustard
//   - Mayonnaise
//   - Barbecue sauce
//   - Hot sauce
//   - Soy sauce
//   - Teriyaki sauce
//   - Worcestershire sauce
//   - Steak sauce
//   - Salsa
//   - Sweet pickle relish
//   - Ranch dressing
//   - Caesar dressing
//   - Italian dressing
//   - Balsamic vinaigrette
//   - Honey mustard
//   - Buffalo sauce
//
// Canonical basis:
//   100 g.
//
// Strategy:
//   Generic fallback only. Exact branded matches from
//   AriFoodCondimentBrands should outrank these records.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodCondiments v1+
// =====================================================

(function initializeAriFoodCondimentsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCondimentsCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic condiment fallback core for the ARI Condiments pathway",
  "recordCount": 18,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "sourceHierarchy": [
    "USDA FoodData Central generic condiment/sauce/dressing references",
    "Frozen offline common-food reference values"
  ],
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Preserve a realistic common household serving for each condiment.",
    "Generic records are fallbacks; exact branded records should outrank them.",
    "Do not assume all ketchup, mayonnaise, ranch, barbecue sauce, or dressings share identical nutrition.",
    "Keep pure cooking oils in AriFoodOils rather than Condiments.",
    "Keep butter and margarine outside this pathway.",
    "Do not infer how much condiment was used on a meal.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CONDIMENT_CORE_FOODS = Object.freeze(
[
  {
    "id": "condiments-ketchup",
    "name": "Ketchup",
    "displayName": "Ketchup",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Ketchup",
      "tomato ketchup",
      "catsup"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 112,
      "protein": 1.74,
      "carbs": 26.68,
      "fat": 0.35,
      "fiber": 0.3,
      "sugar": 22.77,
      "sodiumMg": 907
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 17,
        "isDefault": true,
        "nutrition": {
          "calories": 19.0,
          "protein": 0.3,
          "carbs": 4.54,
          "fat": 0.06,
          "fiber": 0.05,
          "sugar": 3.87,
          "sodiumMg": 154.2
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-yellow-mustard",
    "name": "Yellow Mustard",
    "displayName": "Yellow Mustard",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Yellow Mustard",
      "mustard",
      "prepared mustard",
      "classic yellow mustard"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "mustard"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 60,
      "protein": 3.74,
      "carbs": 5.83,
      "fat": 3.34,
      "fiber": 4.0,
      "sugar": 0.92,
      "sodiumMg": 1104
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 5,
        "isDefault": true,
        "nutrition": {
          "calories": 3.0,
          "protein": 0.19,
          "carbs": 0.29,
          "fat": 0.17,
          "fiber": 0.2,
          "sugar": 0.05,
          "sodiumMg": 55.2
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mustard",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-dijon-mustard",
    "name": "Dijon Mustard",
    "displayName": "Dijon Mustard",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Dijon Mustard",
      "dijon",
      "dijon style mustard"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "mustard"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66,
      "protein": 4.37,
      "carbs": 5.89,
      "fat": 4.0,
      "fiber": 3.3,
      "sugar": 1.4,
      "sodiumMg": 1135
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 5,
        "isDefault": true,
        "nutrition": {
          "calories": 3.3,
          "protein": 0.22,
          "carbs": 0.29,
          "fat": 0.2,
          "fiber": 0.17,
          "sugar": 0.07,
          "sodiumMg": 56.8
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mustard",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-mayonnaise-regular",
    "name": "Mayonnaise, Regular",
    "displayName": "Regular Mayonnaise",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Regular Mayonnaise",
      "Mayonnaise, Regular",
      "mayonnaise",
      "mayo",
      "regular mayo"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "mayonnaise"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 680,
      "protein": 0.96,
      "carbs": 0.57,
      "fat": 74.85,
      "fiber": 0,
      "sugar": 0.57,
      "sodiumMg": 635
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true,
        "nutrition": {
          "calories": 95.2,
          "protein": 0.13,
          "carbs": 0.08,
          "fat": 10.48,
          "fiber": 0.0,
          "sugar": 0.08,
          "sodiumMg": 88.9
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mayonnaise",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-barbecue-sauce",
    "name": "Barbecue Sauce",
    "displayName": "Barbecue Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Barbecue Sauce",
      "bbq sauce",
      "barbeque sauce",
      "barbecue"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "barbecue-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 172,
      "protein": 0.82,
      "carbs": 40.77,
      "fat": 0.63,
      "fiber": 0.9,
      "sugar": 33.24,
      "sodiumMg": 1027
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 34,
        "isDefault": true,
        "nutrition": {
          "calories": 58.5,
          "protein": 0.28,
          "carbs": 13.86,
          "fat": 0.21,
          "fiber": 0.31,
          "sugar": 11.3,
          "sodiumMg": 349.2
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "barbecue-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-hot-sauce",
    "name": "Hot Sauce",
    "displayName": "Hot Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Hot Sauce",
      "pepper sauce",
      "red hot sauce",
      "chili pepper sauce"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "hot-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 11,
      "protein": 0.51,
      "carbs": 1.75,
      "fat": 0.37,
      "fiber": 0.4,
      "sugar": 0.57,
      "sodiumMg": 2643
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 5,
        "isDefault": true,
        "nutrition": {
          "calories": 0.6,
          "protein": 0.03,
          "carbs": 0.09,
          "fat": 0.02,
          "fiber": 0.02,
          "sugar": 0.03,
          "sodiumMg": 132.2
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "hot-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-soy-sauce",
    "name": "Soy Sauce",
    "displayName": "Soy Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Soy Sauce",
      "shoyu",
      "soy sauce regular"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "soy-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 53,
      "protein": 8.14,
      "carbs": 4.93,
      "fat": 0.57,
      "fiber": 0.8,
      "sugar": 0.4,
      "sodiumMg": 5493
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 16,
        "isDefault": true,
        "nutrition": {
          "calories": 8.5,
          "protein": 1.3,
          "carbs": 0.79,
          "fat": 0.09,
          "fiber": 0.13,
          "sugar": 0.06,
          "sodiumMg": 878.9
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "soy-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-teriyaki-sauce",
    "name": "Teriyaki Sauce",
    "displayName": "Teriyaki Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Teriyaki Sauce",
      "teriyaki",
      "teriyaki marinade"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "teriyaki-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 89,
      "protein": 5.93,
      "carbs": 15.56,
      "fat": 0.02,
      "fiber": 0.1,
      "sugar": 14.1,
      "sodiumMg": 3833
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 16,
        "isDefault": true,
        "nutrition": {
          "calories": 14.2,
          "protein": 0.95,
          "carbs": 2.49,
          "fat": 0.0,
          "fiber": 0.02,
          "sugar": 2.26,
          "sodiumMg": 613.3
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "teriyaki-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-worcestershire-sauce",
    "name": "Worcestershire Sauce",
    "displayName": "Worcestershire Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Worcestershire Sauce",
      "worcestershire",
      "worcester sauce"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "worcestershire-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 78,
      "protein": 0,
      "carbs": 19.46,
      "fat": 0,
      "fiber": 0,
      "sugar": 10.0,
      "sodiumMg": 980
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 17,
        "isDefault": true,
        "nutrition": {
          "calories": 13.3,
          "protein": 0.0,
          "carbs": 3.31,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 1.7,
          "sodiumMg": 166.6
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "worcestershire-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-steak-sauce",
    "name": "Steak Sauce",
    "displayName": "Steak Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Steak Sauce",
      "brown steak sauce",
      "table steak sauce"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "steak-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 95,
      "protein": 1.25,
      "carbs": 22.43,
      "fat": 0.22,
      "fiber": 0.6,
      "sugar": 17.0,
      "sodiumMg": 1250
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 17,
        "isDefault": true,
        "nutrition": {
          "calories": 16.2,
          "protein": 0.21,
          "carbs": 3.81,
          "fat": 0.04,
          "fiber": 0.1,
          "sugar": 2.89,
          "sodiumMg": 212.5
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "steak-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-salsa",
    "name": "Salsa",
    "displayName": "Salsa",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Salsa",
      "tomato salsa",
      "red salsa",
      "table salsa"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "salsa"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 36,
      "protein": 1.5,
      "carbs": 7.0,
      "fat": 0.2,
      "fiber": 1.4,
      "sugar": 3.9,
      "sodiumMg": 430
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 32,
        "isDefault": true,
        "nutrition": {
          "calories": 11.5,
          "protein": 0.48,
          "carbs": 2.24,
          "fat": 0.06,
          "fiber": 0.45,
          "sugar": 1.25,
          "sodiumMg": 137.6
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "salsa",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-sweet-pickle-relish",
    "name": "Sweet Pickle Relish",
    "displayName": "Sweet Pickle Relish",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Sweet Pickle Relish",
      "sweet relish",
      "pickle relish",
      "relish"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "relish"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 130,
      "protein": 0.37,
      "carbs": 35.06,
      "fat": 0.47,
      "fiber": 1.1,
      "sugar": 31.6,
      "sodiumMg": 811
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 15,
        "isDefault": true,
        "nutrition": {
          "calories": 19.5,
          "protein": 0.06,
          "carbs": 5.26,
          "fat": 0.07,
          "fiber": 0.17,
          "sugar": 4.74,
          "sodiumMg": 121.7
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "relish",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-ranch-dressing",
    "name": "Ranch Dressing",
    "displayName": "Ranch Dressing",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Ranch Dressing",
      "ranch",
      "ranch salad dressing"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "salad-dressing"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 430,
      "protein": 1.3,
      "carbs": 6.0,
      "fat": 44.0,
      "fiber": 0,
      "sugar": 4.0,
      "sodiumMg": 900
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 129.0,
          "protein": 0.39,
          "carbs": 1.8,
          "fat": 13.2,
          "fiber": 0.0,
          "sugar": 1.2,
          "sodiumMg": 270.0
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "salad-dressing",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-caesar-dressing",
    "name": "Caesar Dressing",
    "displayName": "Caesar Dressing",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Caesar Dressing",
      "caesar",
      "caesar salad dressing"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "salad-dressing"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 542,
      "protein": 2.2,
      "carbs": 3.3,
      "fat": 57.9,
      "fiber": 0.2,
      "sugar": 2.1,
      "sodiumMg": 1200
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 162.6,
          "protein": 0.66,
          "carbs": 0.99,
          "fat": 17.37,
          "fiber": 0.06,
          "sugar": 0.63,
          "sodiumMg": 360.0
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "salad-dressing",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-italian-dressing",
    "name": "Italian Dressing",
    "displayName": "Italian Dressing",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Italian Dressing",
      "italian salad dressing",
      "vinaigrette style italian dressing"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "salad-dressing"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 240,
      "protein": 0.4,
      "carbs": 12.1,
      "fat": 21.1,
      "fiber": 0.3,
      "sugar": 10.3,
      "sodiumMg": 1024
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 72.0,
          "protein": 0.12,
          "carbs": 3.63,
          "fat": 6.33,
          "fiber": 0.09,
          "sugar": 3.09,
          "sodiumMg": 307.2
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "salad-dressing",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-balsamic-vinaigrette",
    "name": "Balsamic Vinaigrette",
    "displayName": "Balsamic Vinaigrette",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Balsamic Vinaigrette",
      "balsamic dressing",
      "balsamic vinaigrette dressing"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "vinaigrette"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 300,
      "protein": 0.5,
      "carbs": 12.0,
      "fat": 28.0,
      "fiber": 0,
      "sugar": 10.0,
      "sodiumMg": 700
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 90.0,
          "protein": 0.15,
          "carbs": 3.6,
          "fat": 8.4,
          "fiber": 0.0,
          "sugar": 3.0,
          "sodiumMg": 210.0
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "vinaigrette",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-honey-mustard-dressing",
    "name": "Honey Mustard Dressing",
    "displayName": "Honey Mustard Dressing",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Honey Mustard Dressing",
      "honey mustard",
      "honey mustard sauce"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "honey-mustard"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 464,
      "protein": 1.1,
      "carbs": 22.8,
      "fat": 40.8,
      "fiber": 0.5,
      "sugar": 21.5,
      "sodiumMg": 680
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "amount": 2,
        "unit": "tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 139.2,
          "protein": 0.33,
          "carbs": 6.84,
          "fat": 12.24,
          "fiber": 0.15,
          "sugar": 6.45,
          "sodiumMg": 204.0
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "honey-mustard",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
    }
  },
  {
    "id": "condiments-buffalo-sauce",
    "name": "Buffalo Sauce",
    "displayName": "Buffalo Sauce",
    "brand": null,
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "ready-to-serve",
    "aliases": [
      "Buffalo Sauce",
      "buffalo wing sauce",
      "wing sauce",
      "buffalo hot sauce"
    ],
    "tags": [
      "condiments",
      "generic",
      "ready-to-serve",
      "buffalo-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 140,
      "protein": 0.5,
      "carbs": 2.0,
      "fat": 14.0,
      "fiber": 0.2,
      "sugar": 0.5,
      "sodiumMg": 1800
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 15,
        "isDefault": true,
        "nutrition": {
          "calories": 21.0,
          "protein": 0.08,
          "carbs": 0.3,
          "fat": 2.1,
          "fiber": 0.03,
          "sugar": 0.08,
          "sodiumMg": 270.0
        }
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
    "source": "AriFoodCondimentsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "buffalo-sauce",
      "genericFood": true,
      "brandSpecific": false,
      "readyToServe": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic condiment references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic condiment fallback. Branded recipes can differ materially in calories, sugar, sodium, fat, and serving size; prefer AriFoodCondimentBrands when an exact branded match exists."
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
    if (!global.AriFoodCondiments) {
      return false;
    }

    if (
      typeof global.AriFoodCondiments.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodCondiments.isKnownModule(
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
      global.AriFoodCondiments &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodCondiments.markModuleFailed ===
        "function"
    ) {
      global.AriFoodCondiments.markModuleFailed(
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
      ARI_CONDIMENT_CORE_FOODS,
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
        ARI_CONDIMENT_CORE_FOODS.length,

      condimentTypes:
        Array.from(
          new Set(
            ARI_CONDIMENT_CORE_FOODS.map(
              food =>
                food.metadata?.condimentType
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
      `Registration rejected ${registration.rejected} condiment-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodCondiments &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodCondiments.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodCondiments.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodCondimentsCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CONDIMENT_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_CONDIMENT_CORE_FOODS.map(
          food => food.id
        );
      },

      getCondimentTypes() {
        return Array.from(
          new Set(
            ARI_CONDIMENT_CORE_FOODS.map(
              food =>
                food.metadata?.condimentType
            )
          )
        );
      },

      getByCondimentType(
        condimentType
      ) {
        const normalized =
          normalizeText(condimentType);

        return ARI_CONDIMENT_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.condimentType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_CONDIMENT_CORE_FOODS.find(
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
        "ari:food-condiments-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_CONDIMENT_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CONDIMENT_CORE_FOODS.length} generic condiment records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
