// =====================================================
// ARI REBIRTH
// File: AriFoodPasta.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline pasta reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodGrains
//
// Coverage:
//   - Standard wheat pasta, dry + cooked
//   - Whole-wheat pasta, dry + cooked
//   - Egg noodles, dry + cooked
//   - Spinach egg noodles, dry + cooked
//   - Fresh refrigerated pasta, cooked
//   - Fresh spinach pasta, cooked
//   - Gluten-free corn pasta, dry + cooked
//
// Critical rules:
//   - Dry and cooked pasta are never interchangeable.
//   - Pasta shape does not automatically justify a new
//     nutrition profile.
//   - Sauce, cheese, oil, butter, and meat are separate.
//   - Branded gluten-free pasta should use label data.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodPasta(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPasta";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact generic pasta and noodle records with confirmed identifiers",
    "USDA April 2026 FoodData Central update log used to track newly added Foundation dry spaghetti records",
    "USDA-derived current mirrors used only to cross-check exact FDC IDs and per-100-g nutrient values during authoring"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Never interchange dry pasta and cooked pasta nutrition.",
    "Keep standard wheat, whole-wheat, egg-noodle, spinach-noodle, fresh-pasta, and gluten-free corn pasta references distinct.",
    "Use shape names such as spaghetti, penne, rotini, farfalle, shells, macaroni, and lasagna as search aliases when no separate composition profile is justified.",
    "Do not create fake nutrition differences solely because pasta has a different shape.",
    "Do not include sauce, cheese, butter, oil, salt, meat, or restaurant preparation in plain pasta references.",
    "Do not substitute generic corn gluten-free pasta for branded or mixed-flour gluten-free products.",
    "Cup weights are not hard-coded because cooked pasta volume varies materially by shape, hydration, and packing.",
    "Egg-noodle records explicitly carry wheat and egg allergen metadata; standard wheat pasta carries wheat metadata.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_PASTA_FOODS =
    [
  {
    "id": "pasta-wheat-dry-unenriched",
    "name": "Pasta",
    "displayName": "Pasta â Dry, Unenriched",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "dry pasta",
      "uncooked pasta",
      "plain pasta dry",
      "spaghetti dry",
      "penne dry",
      "rotini dry",
      "farfalle dry",
      "bow tie pasta dry",
      "macaroni dry",
      "elbow pasta dry",
      "shell pasta dry",
      "lasagna noodles dry"
    ],
    "tags": [
      "grain",
      "pasta",
      "standard-wheat",
      "wheat",
      "semolina",
      "dry",
      "unenriched"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 371,
      "protein": 13.04,
      "carbs": 74.67,
      "fat": 1.51,
      "fiber": 3.2
    },
    "servings": [
      {
        "id": "2-oz-dry",
        "label": "2 oz dry",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      },
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "standard-wheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, dry, unenriched",
        "release": "April 2018 (final)",
        "fdcId": 168927,
        "sourceNote": "USDA added new Foundation dry enriched and whole-grain spaghetti records in April 2026. This module retains the fully identified SR Legacy generic dry-pasta reference for this record."
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
      "glutenFreeReference": false,
      "notes": "Generic pasta reference. Dry and cooked pasta are not interchangeable because boiling changes water content and therefore nutrition per 100 g. Sauce, cheese, butter, oil, salt, meat, and other additions are not included."
    }
  },
  {
    "id": "pasta-wheat-cooked-enriched-no-salt",
    "name": "Pasta",
    "displayName": "Pasta â Cooked, Enriched, No Added Salt",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "pasta",
      "cooked pasta",
      "plain pasta",
      "boiled pasta",
      "spaghetti cooked",
      "penne cooked",
      "rotini cooked",
      "farfalle cooked",
      "bow tie pasta cooked",
      "macaroni cooked",
      "elbow macaroni",
      "shell pasta cooked",
      "lasagna noodles cooked"
    ],
    "tags": [
      "grain",
      "pasta",
      "standard-wheat",
      "wheat",
      "semolina",
      "cooked",
      "enriched",
      "no-added-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 158,
      "protein": 5.8,
      "carbs": 30.86,
      "fat": 0.93,
      "fiber": 1.8,
      "sodium": 1,
      "potassium": 44,
      "saturatedFat": 0.18
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "standard-wheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, cooked, enriched, without added salt",
        "release": "April 2018 (final)",
        "fdcId": 169737,
        "ndbNumber": "20121"
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
      "glutenFreeReference": false,
      "notes": "Generic cooked enriched wheat pasta without added salt. Shape aliases are search conveniences when the user does not have a more specific product label. Sauce, oil, butter, cheese, and salt must be logged separately."
    }
  },
  {
    "id": "pasta-whole-wheat-dry",
    "name": "Whole-Wheat Pasta",
    "displayName": "Whole-Wheat Pasta â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "whole wheat pasta",
      "whole-wheat pasta",
      "whole grain pasta",
      "whole wheat spaghetti dry",
      "whole wheat penne dry"
    ],
    "tags": [
      "grain",
      "pasta",
      "whole-wheat",
      "wheat",
      "whole-wheat",
      "whole-grain",
      "dry"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 352,
      "protein": 13.87,
      "carbs": 73.37,
      "fat": 2.93,
      "fiber": 9.2,
      "sodium": 6,
      "potassium": 434,
      "saturatedFat": 0.428
    },
    "servings": [
      {
        "id": "2-oz-dry",
        "label": "2 oz dry",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      },
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "whole-wheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, whole-wheat, dry",
        "release": "April 2018 (final)",
        "fdcId": 169738
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
      "glutenFreeReference": false,
      "notes": "Generic pasta reference. Dry and cooked pasta are not interchangeable because boiling changes water content and therefore nutrition per 100 g. Sauce, cheese, butter, oil, salt, meat, and other additions are not included."
    }
  },
  {
    "id": "pasta-whole-wheat-cooked",
    "name": "Whole-Wheat Pasta",
    "displayName": "Whole-Wheat Pasta â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "whole wheat pasta",
      "whole-wheat pasta cooked",
      "whole grain pasta cooked",
      "whole wheat spaghetti",
      "whole wheat penne",
      "whole wheat noodles"
    ],
    "tags": [
      "grain",
      "pasta",
      "whole-wheat",
      "wheat",
      "whole-wheat",
      "whole-grain",
      "cooked"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 149,
      "protein": 5.99,
      "carbs": 30.07,
      "fat": 1.71,
      "fiber": 3.9,
      "sodium": 4,
      "potassium": 96,
      "saturatedFat": 0.243,
      "cholesterol": 0
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "whole-wheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, whole-wheat, cooked",
        "release": "April 2018 (final)",
        "fdcId": 168910
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat"
      ],
      "glutenFreeReference": false,
      "notes": "Generic pasta reference. Dry and cooked pasta are not interchangeable because boiling changes water content and therefore nutrition per 100 g. Sauce, cheese, butter, oil, salt, meat, and other additions are not included."
    }
  },
  {
    "id": "pasta-egg-noodles-dry-enriched",
    "name": "Egg Noodles",
    "displayName": "Egg Noodles â Dry, Enriched",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "egg noodles",
      "dry egg noodles",
      "egg pasta dry",
      "wide egg noodles dry"
    ],
    "tags": [
      "grain",
      "pasta",
      "egg-noodle",
      "wheat",
      "egg",
      "egg-noodle",
      "dry",
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
      "calories": 384,
      "protein": 14.2,
      "carbs": 71.3,
      "fat": 4.44,
      "fiber": 3.3,
      "sodium": 21,
      "saturatedFat": 1.18,
      "cholesterol": 84
    },
    "servings": [
      {
        "id": "2-oz-dry",
        "label": "2 oz dry",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      },
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "egg-noodle",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Noodles, egg, dry, enriched",
        "release": "April 2018 (final)",
        "fdcId": 169731,
        "ndbNumber": "20109"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "Generic pasta reference. Dry and cooked pasta are not interchangeable because boiling changes water content and therefore nutrition per 100 g. Sauce, cheese, butter, oil, salt, meat, and other additions are not included."
    }
  },
  {
    "id": "pasta-egg-noodles-cooked-no-salt",
    "name": "Egg Noodles",
    "displayName": "Egg Noodles â Cooked, No Added Salt",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "egg noodles",
      "cooked egg noodles",
      "plain egg noodles",
      "wide egg noodles",
      "egg pasta cooked"
    ],
    "tags": [
      "grain",
      "pasta",
      "egg-noodle",
      "wheat",
      "egg",
      "egg-noodle",
      "cooked",
      "no-added-salt"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 138,
      "protein": 4.54,
      "carbs": 25.16,
      "fat": 2.07,
      "fiber": 1.2,
      "sodium": 5,
      "potassium": 38,
      "saturatedFat": 0.42,
      "cholesterol": 29
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "egg-noodle",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Noodles, egg, unenriched, cooked, without added salt",
        "release": "April 2018 (final)",
        "fdcId": 168926
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "Plain cooked egg-noodle reference without added salt. Butter, oil, cream sauce, broth, or meat additions are not included."
    }
  },
  {
    "id": "pasta-spinach-egg-noodles-dry-enriched",
    "name": "Spinach Egg Noodles",
    "displayName": "Spinach Egg Noodles â Dry, Enriched",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "spinach egg noodles",
      "green egg noodles",
      "spinach noodles dry",
      "spinach pasta dry"
    ],
    "tags": [
      "grain",
      "pasta",
      "spinach-egg-noodle",
      "wheat",
      "egg",
      "spinach",
      "dry",
      "enriched"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 382,
      "protein": 14.6,
      "carbs": 70.3,
      "fat": 4.6
    },
    "servings": [
      {
        "id": "2-oz-dry",
        "label": "2 oz dry",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      },
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "spinach-egg-noodle",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Noodles, egg, spinach, enriched, dry",
        "release": "April 2018 (final)",
        "fdcId": 169733
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "USDA macro profile is stored without an asserted fiber value because the authoring source used for this record did not expose fiber clearly enough to verify it."
    }
  },
  {
    "id": "pasta-spinach-egg-noodles-cooked-enriched",
    "name": "Spinach Egg Noodles",
    "displayName": "Spinach Egg Noodles â Cooked, Enriched",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "spinach egg noodles",
      "cooked spinach egg noodles",
      "spinach noodles cooked",
      "green noodles"
    ],
    "tags": [
      "grain",
      "pasta",
      "spinach-egg-noodle",
      "wheat",
      "egg",
      "spinach",
      "cooked",
      "enriched"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 132,
      "protein": 5.0,
      "carbs": 24.3,
      "fat": 1.6
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "spinach-egg-noodle",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Noodles, egg, spinach, enriched, cooked",
        "release": "April 2018 (final)",
        "fdcId": 169734
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "USDA macro profile is stored without an asserted fiber value because the authoring source used for this record did not expose fiber clearly enough to verify it."
    }
  },
  {
    "id": "pasta-fresh-refrigerated-plain-cooked",
    "name": "Fresh Pasta",
    "displayName": "Fresh Refrigerated Pasta â Plain, Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "fresh pasta",
      "fresh cooked pasta",
      "refrigerated pasta",
      "fresh noodles",
      "fresh fettuccine",
      "fresh linguine"
    ],
    "tags": [
      "grain",
      "pasta",
      "fresh-pasta",
      "wheat",
      "fresh",
      "refrigerated",
      "cooked"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 131,
      "protein": 5.15,
      "carbs": 24.93,
      "fat": 1.05,
      "sodium": 6,
      "potassium": 24,
      "saturatedFat": 0.15,
      "cholesterol": 33
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "fresh-pasta",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, fresh-refrigerated, plain, cooked",
        "release": "April 2018 (final)",
        "fdcId": 169728
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "Fresh refrigerated pasta differs from dried pasta and should remain a separate record. USDA does not report dietary fiber for this exact record, so ARI leaves fiber unset."
    }
  },
  {
    "id": "pasta-fresh-refrigerated-spinach-cooked",
    "name": "Fresh Spinach Pasta",
    "displayName": "Fresh Refrigerated Spinach Pasta â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "fresh spinach pasta",
      "spinach pasta cooked",
      "fresh green pasta",
      "spinach fettuccine",
      "spinach linguine"
    ],
    "tags": [
      "grain",
      "pasta",
      "fresh-spinach-pasta",
      "wheat",
      "spinach",
      "fresh",
      "refrigerated",
      "cooked"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 130,
      "protein": 5.06,
      "carbs": 25.04,
      "fat": 0.94,
      "fiber": 1.4,
      "sodium": 6,
      "potassium": 37,
      "saturatedFat": 0.42,
      "cholesterol": 66
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "fresh-spinach-pasta",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, fresh-refrigerated, spinach, cooked",
        "release": "April 2018 (final)",
        "ndbNumber": "20096",
        "sourceNote": "USDA-derived SR Legacy profile; NDB identifier retained."
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "offlineReference": true,
      "allergens": [
        "wheat",
        "egg"
      ],
      "glutenFreeReference": false,
      "notes": "Generic pasta reference. Dry and cooked pasta are not interchangeable because boiling changes water content and therefore nutrition per 100 g. Sauce, cheese, butter, oil, salt, meat, and other additions are not included."
    }
  },
  {
    "id": "pasta-gluten-free-corn-dry",
    "name": "Corn Pasta",
    "displayName": "Gluten-Free Corn Pasta â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "corn pasta",
      "gluten free corn pasta",
      "gluten-free corn pasta",
      "corn spaghetti",
      "corn noodles dry"
    ],
    "tags": [
      "grain",
      "pasta",
      "corn-gluten-free",
      "corn",
      "gluten-free",
      "dry"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357,
      "protein": 7.46,
      "carbs": 79.26,
      "fat": 2.08,
      "fiber": 11.0,
      "sodium": 3,
      "potassium": 294
    },
    "servings": [
      {
        "id": "2-oz-dry",
        "label": "2 oz dry",
        "amount": 2,
        "unit": "oz",
        "grams": 56.699,
        "isDefault": true
      },
      {
        "id": "100-g-dry",
        "label": "100 g dry",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "corn-gluten-free",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, gluten-free, corn, dry",
        "release": "April 2018 (final)",
        "fdcId": 168899
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
      "allergens": [],
      "glutenFreeReference": true,
      "notes": "Generic corn-based gluten-free pasta reference. Branded gluten-free pasta often blends corn, rice, quinoa, potato, or other ingredients and should use package-label data when available."
    }
  },
  {
    "id": "pasta-gluten-free-corn-cooked",
    "name": "Corn Pasta",
    "displayName": "Gluten-Free Corn Pasta â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "corn pasta",
      "gluten free pasta",
      "gluten-free corn pasta cooked",
      "corn spaghetti cooked",
      "corn noodles cooked"
    ],
    "tags": [
      "grain",
      "pasta",
      "corn-gluten-free",
      "corn",
      "gluten-free",
      "cooked"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 126,
      "protein": 3.0,
      "carbs": 27.91,
      "fat": 0.73,
      "fiber": 4.8,
      "sodium": 0
    },
    "servings": [
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      },
      {
        "id": "3-oz-cooked",
        "label": "3 oz cooked",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
        "isDefault": false
      }
    ],
    "source": "AriFoodPasta",
    "verified": true,
    "metadata": {
      "foodFamily": "pasta",
      "pastaType": "corn-gluten-free",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Pasta, gluten-free, corn, cooked",
        "release": "April 2018 (final)",
        "ndbNumber": "20092",
        "sourceNote": "USDA-derived SR Legacy profile; NDB identifier retained."
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
      "allergens": [],
      "glutenFreeReference": true,
      "notes": "Generic cooked corn gluten-free pasta. Do not substitute this profile for mixed corn/rice, brown-rice, chickpea, lentil, or branded gluten-free pasta."
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
      ARI_PASTA_FOODS,
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
      foodCount: ARI_PASTA_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),

      groups: [
        "standard-wheat",
        "whole-wheat",
        "egg-noodle",
        "spinach-egg-noodle",
        "fresh-pasta",
        "fresh-spinach-pasta",
        "corn-gluten-free"
      ]
    }
  };

  if (registration.rejected > 0) {
    markFailed(
      `Registration rejected ${registration.rejected} pasta record(s).`,
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

  global.AriFoodPasta =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_PASTA_FOODS.length;
      },

      getFoodIds() {
        return ARI_PASTA_FOODS.map(
          food => food.id
        );
      },

      getPastaTypes() {
        return Array.from(
          new Set(
            ARI_PASTA_FOODS.map(
              food => food.metadata.pastaType
            )
          )
        );
      },

      getDryRecords() {
        return ARI_PASTA_FOODS
          .filter(
            food =>
              food.state === "raw" ||
              food.state === "dry"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_PASTA_FOODS
          .filter(
            food =>
              food.state === "cooked"
          )
          .map(clone);
      },

      getGlutenFreeRecords() {
        return ARI_PASTA_FOODS
          .filter(
            food =>
              food.metadata?.glutenFreeReference === true
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
          ARI_PASTA_FOODS.find(
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
        "ari:food-pasta-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_PASTA_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_PASTA_FOODS.length} source-traceable pasta reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
