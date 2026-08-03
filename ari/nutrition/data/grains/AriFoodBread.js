// =====================================================
// ARI REBIRTH
// File: AriFoodBread.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline bread and bread-like
//   grain reference data for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Coverage:
//   - White bread
//   - Whole-wheat bread
//   - Multigrain bread
//   - Sourdough bread
//   - Rye bread
//   - Oatmeal bread
//   - Pita bread
//   - Plain bagel
//   - English muffin
//   - Corn tortilla
//   - Flour tortilla
//
// Naming rule:
//   User-facing names stay clean. This module does NOT
//   append "generic" to display names.
//
// Brand policy:
//   Brands are intentionally excluded here.
//   Manufacturer-specific foods belong in a later
//   branded-food layer using label nutrition.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodBread(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBread";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "displayNamingRule": "User-facing names remain plain food names such as White Bread or Sourdough Bread. The word 'generic' is not shown in display names. Source metadata may retain USDA's exact descriptors.",
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy for fully identified unbranded bread and tortilla reference foods",
    "USDA April 2026 Foundation update log used to track newly added commercial white, whole-wheat, multigrain, corn-tortilla, and flour-tortilla Foundation foods",
    "Manufacturer nutrition labels reserved for later brand-specific modules"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Provide slice or piece weights only where a defensible USDA household measure is available.",
    "Prefer weight-based logging for bakery breads because slice thickness can vary substantially.",
    "Do not show the word 'generic' in user-facing food names.",
    "Do not mix brand names into this module.",
    "Branded breads, tortillas, bagels, and English muffins will use manufacturer label data in a separate branded layer.",
    "Do not treat white, whole-wheat, multigrain, sourdough, rye, oatmeal bread, pita, bagels, English muffins, corn tortillas, and flour tortillas as nutritionally interchangeable.",
    "Do not include butter, oil, spreads, fillings, cheese, meat, or sandwich toppings in base bread records.",
    "Large low-carb/high-fiber tortillas should not reuse ordinary flour-tortilla nutrition.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_BREAD_FOODS =
    [
  {
    "id": "bread-white",
    "name": "White Bread",
    "displayName": "White Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "white bread",
      "sandwich bread",
      "white sandwich bread",
      "toast bread"
    ],
    "tags": [
      "grain",
      "bread",
      "white-bread",
      "white",
      "sandwich-bread"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 266,
      "protein": 8.85,
      "carbs": 49.42,
      "fat": 3.33,
      "fiber": 2.7,
      "sodium": 490,
      "potassium": 126
    },
    "servings": [
      {
        "id": "slice",
        "label": "1 slice",
        "amount": 1,
        "unit": "slice",
        "grams": 28,
        "isDefault": true
      },
      {
        "id": "2-slices",
        "label": "2 slices",
        "amount": 2,
        "unit": "slice",
        "grams": 56,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "white-bread",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, white, commercially prepared (includes soft bread crumbs)",
        "release": "April 2018 (final)",
        "fdcId": 174924
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Unbranded reference profile. Actual nutrition can vary by recipe, hydration, slice thickness, flour blend, enrichment, seeds, sweeteners, oil, and bakery process. Use manufacturer label data later when a specific branded product is known."
    }
  },
  {
    "id": "bread-whole-wheat",
    "name": "Whole-Wheat Bread",
    "displayName": "Whole-Wheat Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "whole wheat bread",
      "whole-wheat bread",
      "wheat bread",
      "100 percent whole wheat bread"
    ],
    "tags": [
      "grain",
      "bread",
      "whole-wheat",
      "whole-wheat",
      "whole-grain"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 252,
      "protein": 12.45,
      "carbs": 42.71,
      "fat": 3.5,
      "fiber": 6.0,
      "sodium": 455,
      "potassium": 254
    },
    "servings": [
      {
        "id": "slice",
        "label": "1 slice",
        "amount": 1,
        "unit": "slice",
        "grams": 32,
        "isDefault": true
      },
      {
        "id": "2-slices",
        "label": "2 slices",
        "amount": 2,
        "unit": "slice",
        "grams": 64,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "whole-wheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, whole-wheat, commercially prepared",
        "release": "April 2018 (final)",
        "fdcId": 172688
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Unbranded reference profile. Actual nutrition can vary by recipe, hydration, slice thickness, flour blend, enrichment, seeds, sweeteners, oil, and bakery process. Use manufacturer label data later when a specific branded product is known."
    }
  },
  {
    "id": "bread-multigrain",
    "name": "Multigrain Bread",
    "displayName": "Multigrain Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "multigrain bread",
      "multi grain bread",
      "multi-grain bread",
      "whole grain multigrain bread"
    ],
    "tags": [
      "grain",
      "bread",
      "multigrain",
      "multigrain",
      "whole-grain"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 265,
      "protein": 13.4,
      "carbs": 43.3,
      "fat": 4.23,
      "fiber": 7.4,
      "sodium": 380,
      "potassium": 230,
      "saturatedFat": 0.872
    },
    "servings": [
      {
        "id": "slice",
        "label": "1 slice",
        "amount": 1,
        "unit": "slice",
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "multigrain",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, multi-grain (includes whole-grain)",
        "release": "April 2018 (final)",
        "fdcId": 168013,
        "ndbNumber": "18035"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Multigrain recipes vary widely in grain mix and seed content. This unbranded reference is useful when no package label is available; branded multigrain breads should override it later."
    }
  },
  {
    "id": "bread-sourdough",
    "name": "Sourdough Bread",
    "displayName": "Sourdough Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "sourdough",
      "sourdough bread",
      "french sourdough",
      "artisan sourdough"
    ],
    "tags": [
      "grain",
      "bread",
      "sourdough",
      "sourdough",
      "fermented",
      "artisan-style"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 272,
      "protein": 10.75,
      "carbs": 51.88,
      "fat": 2.42,
      "fiber": 2.2,
      "sodium": 602,
      "potassium": 117,
      "saturatedFat": 0.529
    },
    "servings": [
      {
        "id": "default-weight",
        "label": "28 g",
        "amount": 28.3495,
        "unit": "g",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "sourdough",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, french or vienna (includes sourdough)",
        "release": "April 2018 (final)",
        "fdcId": 172675,
        "ndbNumber": "18029"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "USDA's French/Vienna bread record includes sourdough. Bakery sourdough slice weights vary substantially, so weight-based logging is preferred unless a specific loaf label is available."
    }
  },
  {
    "id": "bread-rye",
    "name": "Rye Bread",
    "displayName": "Rye Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "rye bread",
      "rye",
      "dark rye bread",
      "light rye bread"
    ],
    "tags": [
      "grain",
      "bread",
      "rye",
      "rye"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 259,
      "protein": 8.5,
      "carbs": 48.3,
      "fat": 3.3,
      "fiber": 5.8,
      "sodium": 603
    },
    "servings": [
      {
        "id": "slice",
        "label": "1 slice",
        "amount": 1,
        "unit": "slice",
        "grams": 32,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "rye",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, rye",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy bread, rye profile; exact identifier intentionally omitted here rather than inferred."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "rye"
      ],
      "brandSpecific": false,
      "notes": "Many U.S. rye breads are wheat-rye blends rather than 100% rye. This profile should not be treated as identical to dense European 100% rye loaves or branded seeded rye breads."
    }
  },
  {
    "id": "bread-oatmeal",
    "name": "Oatmeal Bread",
    "displayName": "Oatmeal Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "oatmeal bread",
      "oat bread",
      "oat sandwich bread"
    ],
    "tags": [
      "grain",
      "bread",
      "oatmeal-bread",
      "oat",
      "oatmeal"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 269,
      "protein": 8.4,
      "carbs": 48.5,
      "fat": 4.4,
      "fiber": 4.0
    },
    "servings": [
      {
        "id": "default-weight",
        "label": "28 g",
        "amount": 28.3495,
        "unit": "g",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "oatmeal-bread",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, oatmeal",
        "release": "April 2018 (final)",
        "fdcId": 172678
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Oatmeal bread is commonly wheat-based with added oats; it is not assumed gluten-free. Branded oat breads can differ substantially in oat percentage, sugar, seeds, and added fat."
    }
  },
  {
    "id": "bread-pita-white-enriched",
    "name": "Pita Bread",
    "displayName": "Pita Bread",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "pita",
      "pita bread",
      "white pita",
      "pocket bread"
    ],
    "tags": [
      "grain",
      "bread",
      "pita",
      "pita",
      "flatbread",
      "white",
      "enriched"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 275,
      "protein": 9.1,
      "carbs": 55.7,
      "fat": 1.2,
      "fiber": 2.2,
      "sodium": 536,
      "potassium": 120
    },
    "servings": [
      {
        "id": "small-pita",
        "label": "1 small pita",
        "amount": 1,
        "unit": "pita",
        "grams": 28,
        "isDefault": true
      },
      {
        "id": "large-pita",
        "label": "1 large pita",
        "amount": 1,
        "unit": "large pita",
        "grams": 60,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "pita",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bread, pita, white, enriched",
        "release": "April 2018 (final)",
        "fdcId": 174915
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Unbranded reference profile. Actual nutrition can vary by recipe, hydration, slice thickness, flour blend, enrichment, seeds, sweeteners, oil, and bakery process. Use manufacturer label data later when a specific branded product is known."
    }
  },
  {
    "id": "bread-bagel-plain",
    "name": "Plain Bagel",
    "displayName": "Plain Bagel",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "bagel",
      "plain bagel",
      "white bagel"
    ],
    "tags": [
      "grain",
      "bread",
      "bagel",
      "bagel",
      "plain",
      "enriched"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 264,
      "protein": 10.6,
      "carbs": 52.4,
      "fat": 1.32,
      "fiber": 1.6,
      "sodium": 422,
      "saturatedFat": 0.36
    },
    "servings": [
      {
        "id": "bagel",
        "label": "1 bagel",
        "amount": 1,
        "unit": "bagel",
        "grams": 99,
        "isDefault": true
      },
      {
        "id": "small-bagel",
        "label": "1 small bagel",
        "amount": 1,
        "unit": "small bagel",
        "grams": 69,
        "isDefault": false
      },
      {
        "id": "mini-bagel",
        "label": "1 mini bagel",
        "amount": 1,
        "unit": "mini bagel",
        "grams": 26,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "bagel",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bagels, plain, enriched, with calcium propionate (includes onion, poppy, sesame)",
        "release": "April 2018 (final)",
        "fdcId": 174899,
        "ndbNumber": "18001"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Bagel size varies dramatically. USDA common measures range from mini to full-size bagels; piece logging uses the embedded reference weights, while bakery/branded labels should override when known."
    }
  },
  {
    "id": "bread-english-muffin-plain",
    "name": "English Muffin",
    "displayName": "English Muffin",
    "category": "grain",
    "state": "prepared",
    "preparation": "baked",
    "aliases": [
      "english muffin",
      "plain english muffin",
      "sourdough english muffin"
    ],
    "tags": [
      "grain",
      "bread",
      "english-muffin",
      "english-muffin",
      "plain",
      "enriched"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 235,
      "protein": 7.7,
      "carbs": 46.0,
      "fat": 1.8,
      "fiber": 2.7,
      "sodium": 464,
      "potassium": 131,
      "saturatedFat": 0.259
    },
    "servings": [
      {
        "id": "muffin",
        "label": "1 English muffin",
        "amount": 1,
        "unit": "muffin",
        "grams": 57,
        "isDefault": true
      },
      {
        "id": "half-muffin",
        "label": "1/2 English muffin",
        "amount": 0.5,
        "unit": "muffin",
        "grams": 28.5,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "english-muffin",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "English muffins, plain, enriched, without calcium propionate (includes sourdough)",
        "release": "April 2018 (final)",
        "fdcId": 175063
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Unbranded reference profile. Actual nutrition can vary by recipe, hydration, slice thickness, flour blend, enrichment, seeds, sweeteners, oil, and bakery process. Use manufacturer label data later when a specific branded product is known."
    }
  },
  {
    "id": "bread-tortilla-corn",
    "name": "Corn Tortilla",
    "displayName": "Corn Tortilla",
    "category": "grain",
    "state": "prepared",
    "preparation": "prepared",
    "aliases": [
      "corn tortilla",
      "corn tortillas",
      "maize tortilla",
      "tortilla de maiz"
    ],
    "tags": [
      "grain",
      "bread",
      "corn-tortilla",
      "tortilla",
      "corn",
      "flatbread"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 218,
      "protein": 5.7,
      "carbs": 44.6,
      "fat": 2.85,
      "fiber": 6.3,
      "sodium": 45,
      "potassium": 186,
      "saturatedFat": 0.453
    },
    "servings": [
      {
        "id": "tortilla",
        "label": "1 tortilla",
        "amount": 1,
        "unit": "tortilla",
        "grams": 26,
        "isDefault": true
      },
      {
        "id": "2-tortillas",
        "label": "2 tortillas",
        "amount": 2,
        "unit": "tortilla",
        "grams": 52,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "corn-tortilla",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tortillas, ready-to-bake or -fry, corn",
        "release": "April 2018 (final)",
        "fdcId": 175036,
        "ndbNumber": "18363"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "allergens": [],
      "brandSpecific": false,
      "notes": "Unbranded reference profile. Actual nutrition can vary by recipe, hydration, slice thickness, flour blend, enrichment, seeds, sweeteners, oil, and bakery process. Use manufacturer label data later when a specific branded product is known."
    }
  },
  {
    "id": "bread-tortilla-flour-shelf-stable",
    "name": "Flour Tortilla",
    "displayName": "Flour Tortilla",
    "category": "grain",
    "state": "prepared",
    "preparation": "prepared",
    "aliases": [
      "flour tortilla",
      "wheat tortilla",
      "soft taco tortilla",
      "burrito tortilla"
    ],
    "tags": [
      "grain",
      "bread",
      "flour-tortilla",
      "tortilla",
      "wheat",
      "flatbread",
      "shelf-stable"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 297,
      "protein": 8.0,
      "carbs": 49.3,
      "fat": 7.6,
      "fiber": 2.4,
      "sodium": 742
    },
    "servings": [
      {
        "id": "tortilla",
        "label": "1 tortilla",
        "amount": 1,
        "unit": "tortilla",
        "grams": 49,
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
    "source": "AriFoodBread",
    "verified": true,
    "metadata": {
      "foodFamily": "bread",
      "breadType": "flour-tortilla",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tortillas, ready-to-bake or -fry, flour, shelf stable",
        "release": "April 2018 (final)",
        "fdcId": 167535,
        "ndbNumber": "18970"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "brandSpecific": false,
      "notes": "Flour-tortilla size and formulation vary substantially. The USDA reference serving is about 49 g. Large burrito tortillas and branded high-fiber/low-carb tortillas should use their own product records later."
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

  function markFailed(message, metadata = {}) {
    console.error(
      `[ARI Nutrition] ${MODULE_NAME}: ${message}`
    );

    if (
      global.AriFoodGrains &&
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
    markFailed(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

  // Clear stale bread records on hot reload.
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
      ARI_BREAD_FOODS,
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
      foodCount: ARI_BREAD_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),

      groups: [
        "white-bread",
        "whole-wheat",
        "multigrain",
        "sourdough",
        "rye",
        "oatmeal-bread",
        "pita",
        "bagel",
        "english-muffin",
        "corn-tortilla",
        "flour-tortilla"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} bread record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodGrains &&
    typeof global.AriFoodGrains.markModuleLoaded === "function"
  ) {
    global.AriFoodGrains.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodBread =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_BREAD_FOODS.length;
      },

      getFoodIds() {
        return ARI_BREAD_FOODS.map(
          food => food.id
        );
      },

      getBreadTypes() {
        return Array.from(
          new Set(
            ARI_BREAD_FOODS.map(
              food => food.metadata.breadType
            )
          )
        );
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_BREAD_FOODS.find(
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
        "ari:food-bread-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_BREAD_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BREAD_FOODS.length} source-traceable bread reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
