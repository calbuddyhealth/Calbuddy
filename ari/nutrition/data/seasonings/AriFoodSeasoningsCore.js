// =====================================================
// ARI REBIRTH
// File: AriFoodSeasoningsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic salts, sugars, herbs, spices, and
//   dry-seasoning fallback dataset for ARI Nutrition.
//
// Collection:
//   AriFoodSeasonings
//
// Coverage:
//   20 generic seasoning records.
//
// Included:
//   - Table salt
//   - Kosher salt
//   - Sea salt
//   - Granulated sugar
//   - Light brown sugar
//   - Powdered sugar
//   - Black pepper
//   - Garlic powder
//   - Onion powder
//   - Paprika
//   - Chili powder
//   - Cayenne pepper
//   - Ground cumin
//   - Ground cinnamon
//   - Dried oregano
//   - Dried basil
//   - Dried parsley
//   - Dried thyme
//   - Ground turmeric
//   - Ground ginger
//
// Strategy:
//   Generic fallback only. Exact branded seasoning blends
//   from AriFoodSeasoningBrands should outrank these.
//
// Canonical basis:
//   100 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSeasonings v1+
// =====================================================

(function initializeAriFoodSeasoningsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSeasoningsCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic salts, sugars, herbs, and spices core for the ARI Seasonings pathway",
  "recordCount": 20,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Preserve a realistic household serving weight for each seasoning.",
    "Generic records are fallbacks; exact branded seasoning records should outrank them.",
    "Salt varieties have nearly identical sodium per gram even when household teaspoon weights differ.",
    "Do not infer how much seasoning a user added to a meal.",
    "Keep liquid sauces and condiments in AriFoodCondiments.",
    "Keep cooking oils in AriFoodOils.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SEASONING_CORE_FOODS = Object.freeze(
[
  {
    "id": "seasonings-table-salt",
    "name": "Table Salt",
    "displayName": "Table Salt",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "table-salt",
    "aliases": [
      "Table Salt",
      "salt",
      "table salt",
      "iodized salt"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "salt",
      "table-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0,
      "sodiumMg": 38758
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1/4 tsp",
        "grams": 1.5,
        "isDefault": true,
        "nutrition": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 0.0,
          "sodiumMg": 581.4
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt",
      "seasoningStyle": "table-salt",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-kosher-salt",
    "name": "Kosher Salt",
    "displayName": "Kosher Salt",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "kosher-salt",
    "aliases": [
      "Kosher Salt",
      "kosher salt",
      "coarse kosher salt"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "salt",
      "kosher-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0,
      "sodiumMg": 38758
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1/4 tsp",
        "grams": 1.2,
        "isDefault": true,
        "nutrition": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 0.0,
          "sodiumMg": 465.1
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt",
      "seasoningStyle": "kosher-salt",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-sea-salt",
    "name": "Sea Salt",
    "displayName": "Sea Salt",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "sea-salt",
    "aliases": [
      "Sea Salt",
      "sea salt",
      "fine sea salt"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "salt",
      "sea-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0,
      "sodiumMg": 38758
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1/4 tsp",
        "grams": 1.5,
        "isDefault": true,
        "nutrition": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 0.0,
          "sodiumMg": 581.4
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "salt",
      "seasoningStyle": "sea-salt",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-granulated-sugar",
    "name": "Granulated Sugar",
    "displayName": "Granulated White Sugar",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "granulated",
    "aliases": [
      "Granulated White Sugar",
      "Granulated Sugar",
      "sugar",
      "white sugar",
      "granulated sugar",
      "table sugar"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "sugar",
      "granulated"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 387,
      "protein": 0,
      "carbs": 100.0,
      "fat": 0,
      "fiber": 0,
      "sugar": 99.8,
      "sodiumMg": 1
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 4.0,
        "isDefault": true,
        "nutrition": {
          "calories": 15.5,
          "protein": 0.0,
          "carbs": 4.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 3.99,
          "sodiumMg": 0.0
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "sugar",
      "seasoningStyle": "granulated",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-light-brown-sugar",
    "name": "Light Brown Sugar",
    "displayName": "Light Brown Sugar",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "brown-sugar",
    "aliases": [
      "Light Brown Sugar",
      "brown sugar",
      "light brown sugar"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "sugar",
      "brown-sugar"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380,
      "protein": 0.12,
      "carbs": 98.09,
      "fat": 0,
      "fiber": 0,
      "sugar": 97.02,
      "sodiumMg": 28
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 4.6,
        "isDefault": true,
        "nutrition": {
          "calories": 17.5,
          "protein": 0.01,
          "carbs": 4.51,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 4.46,
          "sodiumMg": 1.3
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "sugar",
      "seasoningStyle": "brown-sugar",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-powdered-sugar",
    "name": "Powdered Sugar",
    "displayName": "Powdered Sugar",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "powdered-confectioners",
    "aliases": [
      "Powdered Sugar",
      "powdered sugar",
      "confectioners sugar",
      "icing sugar"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "sugar",
      "powdered-confectioners"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 389,
      "protein": 0,
      "carbs": 100.0,
      "fat": 0,
      "fiber": 0,
      "sugar": 97.8,
      "sodiumMg": 0
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.6,
        "isDefault": true,
        "nutrition": {
          "calories": 10.1,
          "protein": 0.0,
          "carbs": 2.6,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 2.54,
          "sodiumMg": 0.0
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "sugar",
      "seasoningStyle": "powdered-confectioners",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-black-pepper-ground",
    "name": "Black Pepper, Ground",
    "displayName": "Ground Black Pepper",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "ground-black-pepper",
    "aliases": [
      "Ground Black Pepper",
      "Black Pepper, Ground",
      "black pepper",
      "ground pepper",
      "pepper"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "ground-black-pepper"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 251,
      "protein": 10.39,
      "carbs": 63.95,
      "fat": 3.26,
      "fiber": 25.3,
      "sugar": 0.64,
      "sodiumMg": 20
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.3,
        "isDefault": true,
        "nutrition": {
          "calories": 5.8,
          "protein": 0.24,
          "carbs": 1.47,
          "fat": 0.07,
          "fiber": 0.58,
          "sugar": 0.01,
          "sodiumMg": 0.5
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "ground-black-pepper",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-garlic-powder",
    "name": "Garlic Powder",
    "displayName": "Garlic Powder",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "garlic-powder",
    "aliases": [
      "Garlic Powder",
      "garlic powder",
      "powdered garlic"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "garlic-powder"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 331,
      "protein": 16.55,
      "carbs": 72.73,
      "fat": 0.73,
      "fiber": 9.0,
      "sugar": 2.43,
      "sodiumMg": 60
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 3.1,
        "isDefault": true,
        "nutrition": {
          "calories": 10.3,
          "protein": 0.51,
          "carbs": 2.25,
          "fat": 0.02,
          "fiber": 0.28,
          "sugar": 0.08,
          "sodiumMg": 1.9
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "garlic-powder",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-onion-powder",
    "name": "Onion Powder",
    "displayName": "Onion Powder",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "onion-powder",
    "aliases": [
      "Onion Powder",
      "onion powder",
      "powdered onion"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "onion-powder"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 341,
      "protein": 10.41,
      "carbs": 79.12,
      "fat": 1.04,
      "fiber": 15.2,
      "sugar": 38.2,
      "sodiumMg": 73
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.4,
        "isDefault": true,
        "nutrition": {
          "calories": 8.2,
          "protein": 0.25,
          "carbs": 1.9,
          "fat": 0.02,
          "fiber": 0.36,
          "sugar": 0.92,
          "sodiumMg": 1.8
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "onion-powder",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-paprika",
    "name": "Paprika",
    "displayName": "Paprika",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "paprika",
    "aliases": [
      "Paprika",
      "paprika",
      "ground paprika"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "paprika"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 282,
      "protein": 14.14,
      "carbs": 53.99,
      "fat": 12.89,
      "fiber": 34.9,
      "sugar": 10.34,
      "sodiumMg": 68
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.3,
        "isDefault": true,
        "nutrition": {
          "calories": 6.5,
          "protein": 0.33,
          "carbs": 1.24,
          "fat": 0.3,
          "fiber": 0.8,
          "sugar": 0.24,
          "sodiumMg": 1.6
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "paprika",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-chili-powder",
    "name": "Chili Powder",
    "displayName": "Chili Powder",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "chili-powder",
    "aliases": [
      "Chili Powder",
      "chili powder",
      "chilli powder"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice-blend",
      "chili-powder"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 282,
      "protein": 13.46,
      "carbs": 49.7,
      "fat": 14.28,
      "fiber": 34.8,
      "sugar": 7.19,
      "sodiumMg": 2867
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.7,
        "isDefault": true,
        "nutrition": {
          "calories": 7.6,
          "protein": 0.36,
          "carbs": 1.34,
          "fat": 0.39,
          "fiber": 0.94,
          "sugar": 0.19,
          "sodiumMg": 77.4
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice-blend",
      "seasoningStyle": "chili-powder",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-cayenne-pepper",
    "name": "Cayenne Pepper",
    "displayName": "Ground Cayenne Pepper",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "cayenne",
    "aliases": [
      "Ground Cayenne Pepper",
      "Cayenne Pepper",
      "cayenne",
      "cayenne pepper",
      "ground red pepper"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "cayenne"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 318,
      "protein": 12.01,
      "carbs": 56.63,
      "fat": 17.27,
      "fiber": 27.2,
      "sugar": 10.34,
      "sodiumMg": 30
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 1.8,
        "isDefault": true,
        "nutrition": {
          "calories": 5.7,
          "protein": 0.22,
          "carbs": 1.02,
          "fat": 0.31,
          "fiber": 0.49,
          "sugar": 0.19,
          "sodiumMg": 0.5
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "cayenne",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-ground-cumin",
    "name": "Cumin, Ground",
    "displayName": "Ground Cumin",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "ground-cumin",
    "aliases": [
      "Ground Cumin",
      "Cumin, Ground",
      "cumin",
      "ground cumin",
      "cumin powder"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "ground-cumin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 375,
      "protein": 17.81,
      "carbs": 44.24,
      "fat": 22.27,
      "fiber": 10.5,
      "sugar": 2.25,
      "sodiumMg": 168
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.1,
        "isDefault": true,
        "nutrition": {
          "calories": 7.9,
          "protein": 0.37,
          "carbs": 0.93,
          "fat": 0.47,
          "fiber": 0.22,
          "sugar": 0.05,
          "sodiumMg": 3.5
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "ground-cumin",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-ground-cinnamon",
    "name": "Cinnamon, Ground",
    "displayName": "Ground Cinnamon",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "ground-cinnamon",
    "aliases": [
      "Ground Cinnamon",
      "Cinnamon, Ground",
      "cinnamon",
      "ground cinnamon",
      "cinnamon powder"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "ground-cinnamon"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 247,
      "protein": 3.99,
      "carbs": 80.59,
      "fat": 1.24,
      "fiber": 53.1,
      "sugar": 2.17,
      "sodiumMg": 10
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 2.6,
        "isDefault": true,
        "nutrition": {
          "calories": 6.4,
          "protein": 0.1,
          "carbs": 2.1,
          "fat": 0.03,
          "fiber": 1.38,
          "sugar": 0.06,
          "sodiumMg": 0.3
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "ground-cinnamon",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-oregano-dried",
    "name": "Oregano, Dried",
    "displayName": "Dried Oregano",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "dried-oregano",
    "aliases": [
      "Dried Oregano",
      "Oregano, Dried",
      "oregano",
      "dried oregano",
      "oregano leaves"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "herb",
      "dried-oregano"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 265,
      "protein": 9.0,
      "carbs": 68.92,
      "fat": 4.28,
      "fiber": 42.5,
      "sugar": 4.09,
      "sodiumMg": 25
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 1.0,
        "isDefault": true,
        "nutrition": {
          "calories": 2.7,
          "protein": 0.09,
          "carbs": 0.69,
          "fat": 0.04,
          "fiber": 0.43,
          "sugar": 0.04,
          "sodiumMg": 0.3
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "herb",
      "seasoningStyle": "dried-oregano",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-basil-dried",
    "name": "Basil, Dried",
    "displayName": "Dried Basil",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "dried-basil",
    "aliases": [
      "Dried Basil",
      "Basil, Dried",
      "basil",
      "dried basil",
      "basil leaves"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "herb",
      "dried-basil"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 233,
      "protein": 22.98,
      "carbs": 47.75,
      "fat": 4.07,
      "fiber": 37.7,
      "sugar": 1.71,
      "sodiumMg": 76
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 0.7,
        "isDefault": true,
        "nutrition": {
          "calories": 1.6,
          "protein": 0.16,
          "carbs": 0.33,
          "fat": 0.03,
          "fiber": 0.26,
          "sugar": 0.01,
          "sodiumMg": 0.5
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "herb",
      "seasoningStyle": "dried-basil",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-parsley-dried",
    "name": "Parsley, Dried",
    "displayName": "Dried Parsley",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "dried-parsley",
    "aliases": [
      "Dried Parsley",
      "Parsley, Dried",
      "parsley",
      "dried parsley",
      "parsley flakes"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "herb",
      "dried-parsley"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 292,
      "protein": 26.63,
      "carbs": 50.64,
      "fat": 5.48,
      "fiber": 26.7,
      "sugar": 7.27,
      "sodiumMg": 452
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 0.5,
        "isDefault": true,
        "nutrition": {
          "calories": 1.5,
          "protein": 0.13,
          "carbs": 0.25,
          "fat": 0.03,
          "fiber": 0.13,
          "sugar": 0.04,
          "sodiumMg": 2.3
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "herb",
      "seasoningStyle": "dried-parsley",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-thyme-dried",
    "name": "Thyme, Dried",
    "displayName": "Dried Thyme",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "dried-thyme",
    "aliases": [
      "Dried Thyme",
      "Thyme, Dried",
      "thyme",
      "dried thyme",
      "thyme leaves"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "herb",
      "dried-thyme"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 276,
      "protein": 9.11,
      "carbs": 63.94,
      "fat": 7.43,
      "fiber": 37.0,
      "sugar": 1.71,
      "sodiumMg": 55
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 1.0,
        "isDefault": true,
        "nutrition": {
          "calories": 2.8,
          "protein": 0.09,
          "carbs": 0.64,
          "fat": 0.07,
          "fiber": 0.37,
          "sugar": 0.02,
          "sodiumMg": 0.6
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "herb",
      "seasoningStyle": "dried-thyme",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-turmeric-ground",
    "name": "Turmeric, Ground",
    "displayName": "Ground Turmeric",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "ground-turmeric",
    "aliases": [
      "Ground Turmeric",
      "Turmeric, Ground",
      "turmeric",
      "ground turmeric",
      "turmeric powder"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "ground-turmeric"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 312,
      "protein": 9.68,
      "carbs": 67.14,
      "fat": 3.25,
      "fiber": 22.7,
      "sugar": 3.21,
      "sodiumMg": 27
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 3.0,
        "isDefault": true,
        "nutrition": {
          "calories": 9.4,
          "protein": 0.29,
          "carbs": 2.01,
          "fat": 0.1,
          "fiber": 0.68,
          "sugar": 0.1,
          "sodiumMg": 0.8
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "ground-turmeric",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
    }
  },
  {
    "id": "seasonings-ginger-ground",
    "name": "Ginger, Ground",
    "displayName": "Ground Ginger",
    "brand": null,
    "category": "seasonings",
    "state": "dry",
    "preparation": "ground-ginger",
    "aliases": [
      "Ground Ginger",
      "Ginger, Ground",
      "ground ginger",
      "ginger powder",
      "powdered ginger"
    ],
    "tags": [
      "seasonings",
      "generic",
      "dry-seasoning",
      "spice",
      "ground-ginger"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 335,
      "protein": 8.98,
      "carbs": 71.62,
      "fat": 4.24,
      "fiber": 14.1,
      "sugar": 3.39,
      "sodiumMg": 27
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tsp",
        "grams": 1.8,
        "isDefault": true,
        "nutrition": {
          "calories": 6.0,
          "protein": 0.16,
          "carbs": 1.29,
          "fat": 0.08,
          "fiber": 0.25,
          "sugar": 0.06,
          "sodiumMg": 0.5
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
    "source": "AriFoodSeasoningsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "seasonings",
      "seasoningType": "spice",
      "seasoningStyle": "ground-ginger",
      "genericFood": true,
      "brandSpecific": false,
      "drySeasoning": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic seasoning references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic dry seasoning fallback. Branded blends such as TajÃ­n, Lawry's, Old Bay, Tony Chachere's, McCormick blends, and Dash should use AriFoodSeasoningBrands when an exact match exists."
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
    if (!global.AriFoodSeasonings) {
      return false;
    }

    if (
      typeof global.AriFoodSeasonings.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodSeasonings.isKnownModule(
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
      global.AriFoodSeasonings &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodSeasonings.markModuleFailed ===
        "function"
    ) {
      global.AriFoodSeasonings.markModuleFailed(
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
      ARI_SEASONING_CORE_FOODS,
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
        ARI_SEASONING_CORE_FOODS.length,

      seasoningTypes:
        Array.from(
          new Set(
            ARI_SEASONING_CORE_FOODS.map(
              food =>
                food.metadata?.seasoningType
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
      `Registration rejected ${registration.rejected} seasoning-core record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSeasonings &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodSeasonings.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSeasonings.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodSeasoningsCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SEASONING_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_SEASONING_CORE_FOODS.map(
          food => food.id
        );
      },

      getSeasoningTypes() {
        return Array.from(
          new Set(
            ARI_SEASONING_CORE_FOODS.map(
              food =>
                food.metadata?.seasoningType
            )
          )
        );
      },

      getBySeasoningType(
        seasoningType
      ) {
        const normalized =
          normalizeText(seasoningType);

        return ARI_SEASONING_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.seasoningType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SEASONING_CORE_FOODS.find(
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
        "ari:food-seasonings-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SEASONING_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SEASONING_CORE_FOODS.length} generic seasoning records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
