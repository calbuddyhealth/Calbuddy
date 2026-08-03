// =====================================================
// ARI REBIRTH
// File: AriFoodPoultry.js
// Version: 1.0.0
//
// Purpose:
//   Canonical poultry food-data module for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Registers:
//   - Chicken
//   - Turkey
//   - Duck
//   - Cornish hen
//   - Quail
//   - Goose
//
// Data model:
//   - Nutrition is expressed per 100 g edible portion.
//   - Distinct raw/cooked/preparation/skin states receive
//     distinct canonical food records.
//   - Common piece-based servings include gram equivalents
//     so AriFoodCalculator can calculate pieces as well as
//     arbitrary grams, ounces, or pounds.
//
// Important:
//   These are generic curated reference averages rather
//   than branded-food values. Actual nutrition can vary
//   with cut size, retained skin/fat, cooking loss,
//   breading, oil absorption, recipes, and manufacturer.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+ (recommended for module tracking)
//
// Non-responsibilities:
//   - Does not search foods.
//   - Does not calculate nutrition.
//   - Does not manipulate the DOM.
//   - Does not save meals.
// =====================================================

(function initializeAriFoodPoultry(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPoultry";

  function failModule(message, metadata = {}) {
    console.error(`[ARI Nutrition] ${MODULE_NAME}: ${message}`);

    if (
      global.AriFoodProteins &&
      typeof global.AriFoodProteins.markModuleFailed === "function"
    ) {
      global.AriFoodProteins.markModuleFailed(
        MODULE_NAME,
        message,
        metadata
      );
    }
  }

  if (
    !global.AriFoodRegistry ||
    typeof global.AriFoodRegistry.registerMany !== "function"
  ) {
    failModule(
      "AriFoodRegistry.registerMany() is unavailable.",
      { version: VERSION }
    );
    return;
  }

  const ARI_POULTRY_FOODS = [
  {
    "id": "chicken-breast-raw-skinless",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Raw, Skinless",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chicken",
      "chicken breast",
      "raw chicken breast",
      "skinless chicken breast"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 120,
      "protein": 22.5,
      "carbs": 0,
      "fat": 2.6
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-breast-baked-skinless",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Baked, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "chicken",
      "chicken breast",
      "baked chicken",
      "baked chicken breast",
      "skinless baked chicken"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-breast-grilled-skinless",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Grilled, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "chicken",
      "chicken breast",
      "grilled chicken",
      "grilled chicken breast",
      "skinless grilled chicken"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-breast-roasted-skinless",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Roasted, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "chicken",
      "chicken breast",
      "roasted chicken breast",
      "skinless roasted chicken"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-breast-fried-breaded",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Breaded & Fried",
    "category": "protein",
    "state": "cooked",
    "preparation": "breaded fried",
    "aliases": [
      "fried chicken breast",
      "breaded chicken breast",
      "breaded fried chicken",
      "fried chicken"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "breaded",
      "fried"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 222,
      "protein": 31,
      "carbs": 8.5,
      "fat": 8.1
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-breast-roasted-skin-on",
    "name": "Chicken Breast",
    "displayName": "Chicken Breast â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "chicken breast with skin",
      "roasted chicken breast skin on",
      "skin on chicken breast"
    ],
    "tags": [
      "poultry",
      "chicken",
      "breast",
      "skin-on"
    ],
    "popularity": 76,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 197,
      "protein": 30,
      "carbs": 0,
      "fat": 7.8
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-tenderloin-raw",
    "name": "Chicken Tenderloin",
    "displayName": "Chicken Tenderloin â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chicken tender",
      "chicken tenderloin",
      "raw chicken tender"
    ],
    "tags": [
      "poultry",
      "chicken",
      "tenderloin",
      "skinless",
      "lean"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 120,
      "protein": 22.5,
      "carbs": 0,
      "fat": 2.6
    },
    "servings": [
      {
        "id": "tenderloin",
        "label": "1 chicken tenderloin",
        "amount": 1,
        "unit": "tenderloin",
        "grams": 45,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-tenderloin-grilled",
    "name": "Chicken Tenderloin",
    "displayName": "Chicken Tenderloin â Grilled",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "chicken tender",
      "grilled chicken tender",
      "grilled chicken tenderloin"
    ],
    "tags": [
      "poultry",
      "chicken",
      "tenderloin",
      "skinless",
      "lean"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    },
    "servings": [
      {
        "id": "tenderloin",
        "label": "1 chicken tenderloin",
        "amount": 1,
        "unit": "tenderloin",
        "grams": 45,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-thigh-raw-skinless",
    "name": "Chicken Thigh",
    "displayName": "Chicken Thigh â Raw, Skinless",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chicken",
      "chicken thigh",
      "raw chicken thigh",
      "skinless chicken thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "thigh",
      "skinless"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 144,
      "protein": 19.7,
      "carbs": 0,
      "fat": 7.2
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-thigh-baked-skinless",
    "name": "Chicken Thigh",
    "displayName": "Chicken Thigh â Baked, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "chicken",
      "chicken thigh",
      "baked chicken thigh",
      "skinless baked chicken thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "thigh",
      "skinless"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 209,
      "protein": 26,
      "carbs": 0,
      "fat": 10.9
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-thigh-grilled-skinless",
    "name": "Chicken Thigh",
    "displayName": "Chicken Thigh â Grilled, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "chicken",
      "chicken thigh",
      "grilled chicken thigh",
      "skinless grilled chicken thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "thigh",
      "skinless"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 209,
      "protein": 26,
      "carbs": 0,
      "fat": 10.9
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-thigh-baked-skin-on",
    "name": "Chicken Thigh",
    "displayName": "Chicken Thigh â Baked, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "chicken thigh with skin",
      "baked chicken thigh skin on",
      "skin on chicken thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "thigh",
      "skin-on"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 229,
      "protein": 25,
      "carbs": 0,
      "fat": 15.5
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-thigh-fried-skin-on",
    "name": "Chicken Thigh",
    "displayName": "Chicken Thigh â Fried, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "fried",
    "aliases": [
      "fried chicken thigh",
      "chicken thigh fried",
      "fried thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "thigh",
      "skin-on",
      "fried"
    ],
    "popularity": 82,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 277,
      "protein": 24,
      "carbs": 2,
      "fat": 19
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-wing-raw-skin-on",
    "name": "Chicken Wing",
    "displayName": "Chicken Wing â Raw, Skin-On",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chicken wing",
      "raw chicken wing",
      "wing"
    ],
    "tags": [
      "poultry",
      "chicken",
      "wing",
      "skin-on"
    ],
    "popularity": 78,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 191,
      "protein": 17.5,
      "carbs": 0,
      "fat": 13.8
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 medium wing",
        "amount": 1,
        "unit": "wing",
        "grams": 34,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-wing-baked-skin-on",
    "name": "Chicken Wing",
    "displayName": "Chicken Wing â Baked, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "chicken wing",
      "baked chicken wing",
      "baked wings",
      "plain baked wings"
    ],
    "tags": [
      "poultry",
      "chicken",
      "wing",
      "skin-on"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 266,
      "protein": 24,
      "carbs": 0,
      "fat": 18
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 medium wing",
        "amount": 1,
        "unit": "wing",
        "grams": 34,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-wing-air-fried-skin-on",
    "name": "Chicken Wing",
    "displayName": "Chicken Wing â Air Fried, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "air fried",
    "aliases": [
      "air fried chicken wing",
      "air fryer wings",
      "air fried wings"
    ],
    "tags": [
      "poultry",
      "chicken",
      "wing",
      "skin-on",
      "air-fried"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 254,
      "protein": 24,
      "carbs": 0,
      "fat": 17
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 medium wing",
        "amount": 1,
        "unit": "wing",
        "grams": 34,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-wing-fried-skin-on",
    "name": "Chicken Wing",
    "displayName": "Chicken Wing â Fried, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "fried",
    "aliases": [
      "fried chicken wing",
      "fried wings",
      "plain fried wings"
    ],
    "tags": [
      "poultry",
      "chicken",
      "wing",
      "skin-on",
      "fried"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 291,
      "protein": 26,
      "carbs": 0,
      "fat": 21
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 medium wing",
        "amount": 1,
        "unit": "wing",
        "grams": 34,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-wing-breaded-fried",
    "name": "Chicken Wing",
    "displayName": "Chicken Wing â Breaded & Fried",
    "category": "protein",
    "state": "cooked",
    "preparation": "breaded fried",
    "aliases": [
      "breaded chicken wing",
      "breaded fried wings",
      "fried breaded wings"
    ],
    "tags": [
      "poultry",
      "chicken",
      "wing",
      "breaded",
      "fried"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 321,
      "protein": 24,
      "carbs": 14,
      "fat": 18
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 medium wing",
        "amount": 1,
        "unit": "wing",
        "grams": 34,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-drumstick-raw-skin-on",
    "name": "Chicken Drumstick",
    "displayName": "Chicken Drumstick â Raw, Skin-On",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chicken drumstick",
      "raw drumstick",
      "chicken leg"
    ],
    "tags": [
      "poultry",
      "chicken",
      "drumstick",
      "skin-on"
    ],
    "popularity": 81,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 161,
      "protein": 18,
      "carbs": 0,
      "fat": 9.2
    },
    "servings": [
      {
        "id": "drumstick",
        "label": "1 medium drumstick",
        "amount": 1,
        "unit": "drumstick",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-drumstick-baked-skin-on",
    "name": "Chicken Drumstick",
    "displayName": "Chicken Drumstick â Baked, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "baked chicken drumstick",
      "baked drumstick",
      "baked chicken leg"
    ],
    "tags": [
      "poultry",
      "chicken",
      "drumstick",
      "skin-on"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 216,
      "protein": 27,
      "carbs": 0,
      "fat": 11.2
    },
    "servings": [
      {
        "id": "drumstick",
        "label": "1 medium drumstick",
        "amount": 1,
        "unit": "drumstick",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-drumstick-baked-skinless",
    "name": "Chicken Drumstick",
    "displayName": "Chicken Drumstick â Baked, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "baked",
    "aliases": [
      "skinless baked drumstick",
      "baked skinless chicken leg",
      "skinless chicken drumstick"
    ],
    "tags": [
      "poultry",
      "chicken",
      "drumstick",
      "skinless"
    ],
    "popularity": 83,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 175,
      "protein": 28,
      "carbs": 0,
      "fat": 6
    },
    "servings": [
      {
        "id": "drumstick",
        "label": "1 medium drumstick",
        "amount": 1,
        "unit": "drumstick",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-drumstick-fried-skin-on",
    "name": "Chicken Drumstick",
    "displayName": "Chicken Drumstick â Fried, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "fried",
    "aliases": [
      "fried chicken drumstick",
      "fried drumstick",
      "fried chicken leg"
    ],
    "tags": [
      "poultry",
      "chicken",
      "drumstick",
      "skin-on",
      "fried"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 268,
      "protein": 24,
      "carbs": 4,
      "fat": 18
    },
    "servings": [
      {
        "id": "drumstick",
        "label": "1 medium drumstick",
        "amount": 1,
        "unit": "drumstick",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-leg-quarter-roasted-skin-on",
    "name": "Chicken Leg Quarter",
    "displayName": "Chicken Leg Quarter â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "chicken leg quarter",
      "roasted leg quarter",
      "chicken quarter"
    ],
    "tags": [
      "poultry",
      "chicken",
      "leg-quarter",
      "skin-on"
    ],
    "popularity": 78,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 227,
      "protein": 25,
      "carbs": 0,
      "fat": 14
    },
    "servings": [
      {
        "id": "leg-quarter",
        "label": "1 leg quarter",
        "amount": 1,
        "unit": "leg quarter",
        "grams": 240,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-whole-roasted-meat-only",
    "name": "Whole Chicken",
    "displayName": "Whole Chicken â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roasted chicken",
      "whole roasted chicken meat",
      "roast chicken meat only"
    ],
    "tags": [
      "poultry",
      "chicken",
      "whole",
      "meat-only"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 190,
      "protein": 28.9,
      "carbs": 0,
      "fat": 7.4
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "chicken-whole-roasted-meat-skin",
    "name": "Whole Chicken",
    "displayName": "Whole Chicken â Roasted, Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roasted chicken with skin",
      "whole roasted chicken",
      "roast chicken skin on"
    ],
    "tags": [
      "poultry",
      "chicken",
      "whole",
      "skin-on"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 239,
      "protein": 27.3,
      "carbs": 0,
      "fat": 13.6
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-chicken-raw",
    "name": "Ground Chicken",
    "displayName": "Ground Chicken â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground chicken",
      "raw ground chicken",
      "minced chicken"
    ],
    "tags": [
      "poultry",
      "chicken",
      "ground"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 17.4,
      "carbs": 0,
      "fat": 8.1
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-chicken-cooked",
    "name": "Ground Chicken",
    "displayName": "Ground Chicken â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground chicken",
      "cooked ground chicken",
      "minced chicken cooked"
    ],
    "tags": [
      "poultry",
      "chicken",
      "ground"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 189,
      "protein": 23,
      "carbs": 0,
      "fat": 10.9
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "rotisserie-chicken-breast-skinless",
    "name": "Rotisserie Chicken Breast",
    "displayName": "Rotisserie Chicken Breast â Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "rotisserie",
    "aliases": [
      "rotisserie chicken",
      "rotisserie breast",
      "skinless rotisserie chicken breast"
    ],
    "tags": [
      "poultry",
      "chicken",
      "rotisserie",
      "breast",
      "skinless"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 157,
      "protein": 30,
      "carbs": 0,
      "fat": 3.5
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 medium breast",
        "amount": 1,
        "unit": "breast",
        "grams": 172,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "rotisserie-chicken-thigh-skin-on",
    "name": "Rotisserie Chicken Thigh",
    "displayName": "Rotisserie Chicken Thigh â Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "rotisserie",
    "aliases": [
      "rotisserie chicken thigh",
      "rotisserie thigh",
      "skin on rotisserie thigh"
    ],
    "tags": [
      "poultry",
      "chicken",
      "rotisserie",
      "thigh",
      "skin-on"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 220,
      "protein": 24,
      "carbs": 0,
      "fat": 13.5
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 medium thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 95,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "rotisserie-chicken-mixed-meat-skin",
    "name": "Rotisserie Chicken",
    "displayName": "Rotisserie Chicken â Mixed Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "rotisserie",
    "aliases": [
      "rotisserie chicken",
      "mixed rotisserie chicken",
      "rotisserie chicken meat and skin"
    ],
    "tags": [
      "poultry",
      "chicken",
      "rotisserie",
      "mixed",
      "skin-on"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 190,
      "protein": 27,
      "carbs": 0,
      "fat": 9
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "chicken",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-breast-raw-skinless",
    "name": "Turkey Breast",
    "displayName": "Turkey Breast â Raw, Skinless",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "turkey",
      "turkey breast",
      "raw turkey breast",
      "skinless turkey breast"
    ],
    "tags": [
      "poultry",
      "turkey",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 114,
      "protein": 23.7,
      "carbs": 0,
      "fat": 1.2
    },
    "servings": [
      {
        "id": "breast-slice",
        "label": "1 3 oz breast serving",
        "amount": 1,
        "unit": "breast serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-breast-roasted-skinless",
    "name": "Turkey Breast",
    "displayName": "Turkey Breast â Roasted, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "turkey breast",
      "roasted turkey",
      "roasted turkey breast",
      "skinless roasted turkey breast"
    ],
    "tags": [
      "poultry",
      "turkey",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 135,
      "protein": 29,
      "carbs": 0,
      "fat": 1.8
    },
    "servings": [
      {
        "id": "breast-slice",
        "label": "1 3 oz breast serving",
        "amount": 1,
        "unit": "breast serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-breast-grilled-skinless",
    "name": "Turkey Breast",
    "displayName": "Turkey Breast â Grilled, Skinless",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "grilled turkey",
      "grilled turkey breast",
      "skinless grilled turkey breast"
    ],
    "tags": [
      "poultry",
      "turkey",
      "breast",
      "skinless",
      "lean"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 135,
      "protein": 29,
      "carbs": 0,
      "fat": 1.8
    },
    "servings": [
      {
        "id": "breast-slice",
        "label": "1 3 oz breast serving",
        "amount": 1,
        "unit": "breast serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-thigh-roasted-meat-only",
    "name": "Turkey Thigh",
    "displayName": "Turkey Thigh â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "turkey thigh",
      "roasted turkey thigh",
      "turkey thigh meat"
    ],
    "tags": [
      "poultry",
      "turkey",
      "thigh",
      "meat-only"
    ],
    "popularity": 80,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 159,
      "protein": 28,
      "carbs": 0,
      "fat": 4.9
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 turkey thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 150,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-thigh-roasted-skin-on",
    "name": "Turkey Thigh",
    "displayName": "Turkey Thigh â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "turkey thigh with skin",
      "roasted turkey thigh skin on"
    ],
    "tags": [
      "poultry",
      "turkey",
      "thigh",
      "skin-on"
    ],
    "popularity": 76,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 183,
      "protein": 27,
      "carbs": 0,
      "fat": 8.7
    },
    "servings": [
      {
        "id": "thigh",
        "label": "1 turkey thigh",
        "amount": 1,
        "unit": "thigh",
        "grams": 150,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-drumstick-roasted-meat-only",
    "name": "Turkey Drumstick",
    "displayName": "Turkey Drumstick â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "turkey drumstick",
      "roasted turkey leg",
      "turkey leg meat"
    ],
    "tags": [
      "poultry",
      "turkey",
      "drumstick",
      "meat-only"
    ],
    "popularity": 78,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 159,
      "protein": 29,
      "carbs": 0,
      "fat": 4.4
    },
    "servings": [
      {
        "id": "drumstick",
        "label": "1 turkey drumstick",
        "amount": 1,
        "unit": "drumstick",
        "grams": 200,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-wing-roasted-skin-on",
    "name": "Turkey Wing",
    "displayName": "Turkey Wing â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "turkey wing",
      "roasted turkey wing",
      "turkey wing with skin"
    ],
    "tags": [
      "poultry",
      "turkey",
      "wing",
      "skin-on"
    ],
    "popularity": 72,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 229,
      "protein": 27,
      "carbs": 0,
      "fat": 12
    },
    "servings": [
      {
        "id": "wing",
        "label": "1 turkey wing",
        "amount": 1,
        "unit": "wing",
        "grams": 150,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-85-15-raw",
    "name": "Ground Turkey 85/15",
    "displayName": "Ground Turkey 85/15 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground turkey",
      "85 15 ground turkey",
      "ground turkey 85% lean"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "85-15"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 203,
      "protein": 17,
      "carbs": 0,
      "fat": 15
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-85-15-cooked",
    "name": "Ground Turkey 85/15",
    "displayName": "Ground Turkey 85/15 â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground turkey",
      "cooked 85 15 turkey",
      "85% lean turkey cooked"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "85-15"
    ],
    "popularity": 80,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 258,
      "protein": 24,
      "carbs": 0,
      "fat": 18.5
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-93-7-raw",
    "name": "Ground Turkey 93/7",
    "displayName": "Ground Turkey 93/7 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground turkey",
      "93 7 ground turkey",
      "ground turkey 93% lean"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "93-7"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 172,
      "protein": 21,
      "carbs": 0,
      "fat": 8
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-93-7-cooked",
    "name": "Ground Turkey 93/7",
    "displayName": "Ground Turkey 93/7 â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground turkey",
      "cooked 93 7 turkey",
      "93% lean turkey cooked"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "93-7"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 203,
      "protein": 27,
      "carbs": 0,
      "fat": 10
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-99-lean-raw",
    "name": "Ground Turkey 99% Lean",
    "displayName": "Ground Turkey 99% Lean â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground turkey",
      "99 lean ground turkey",
      "extra lean turkey"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "99-lean",
      "extra-lean"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 120,
      "protein": 26,
      "carbs": 0,
      "fat": 1
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "ground-turkey-99-lean-cooked",
    "name": "Ground Turkey 99% Lean",
    "displayName": "Ground Turkey 99% Lean â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "ground turkey",
      "99 lean cooked turkey",
      "extra lean ground turkey cooked"
    ],
    "tags": [
      "poultry",
      "turkey",
      "ground",
      "99-lean",
      "extra-lean"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 151,
      "protein": 29,
      "carbs": 0,
      "fat": 3
    },
    "servings": [
      {
        "id": "patty",
        "label": "1 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.4,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-whole-roasted-meat-only",
    "name": "Whole Turkey",
    "displayName": "Whole Turkey â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roasted turkey",
      "whole turkey meat",
      "turkey meat only"
    ],
    "tags": [
      "poultry",
      "turkey",
      "whole",
      "meat-only"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 159,
      "protein": 29,
      "carbs": 0,
      "fat": 4
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "turkey-whole-roasted-meat-skin",
    "name": "Whole Turkey",
    "displayName": "Whole Turkey â Roasted, Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roasted turkey with skin",
      "whole roasted turkey",
      "turkey meat and skin"
    ],
    "tags": [
      "poultry",
      "turkey",
      "whole",
      "skin-on"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 189,
      "protein": 28,
      "carbs": 0,
      "fat": 8
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "turkey",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "duck-breast-raw-meat-only",
    "name": "Duck Breast",
    "displayName": "Duck Breast â Raw, Meat Only",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "duck",
      "duck breast",
      "raw duck breast",
      "skinless duck breast"
    ],
    "tags": [
      "poultry",
      "duck",
      "breast",
      "meat-only"
    ],
    "popularity": 64,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 123,
      "protein": 19.8,
      "carbs": 0,
      "fat": 4.3
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 duck breast",
        "amount": 1,
        "unit": "breast",
        "grams": 140,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "duck",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "duck-breast-roasted-meat-only",
    "name": "Duck Breast",
    "displayName": "Duck Breast â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "duck breast",
      "roasted duck breast",
      "skinless roasted duck breast"
    ],
    "tags": [
      "poultry",
      "duck",
      "breast",
      "meat-only"
    ],
    "popularity": 69,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 201,
      "protein": 23.5,
      "carbs": 0,
      "fat": 11
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 duck breast",
        "amount": 1,
        "unit": "breast",
        "grams": 140,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "duck",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "duck-breast-roasted-skin-on",
    "name": "Duck Breast",
    "displayName": "Duck Breast â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "duck breast with skin",
      "roasted duck breast skin on",
      "crispy duck breast"
    ],
    "tags": [
      "poultry",
      "duck",
      "breast",
      "skin-on"
    ],
    "popularity": 72,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 337,
      "protein": 19,
      "carbs": 0,
      "fat": 28
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 duck breast",
        "amount": 1,
        "unit": "breast",
        "grams": 140,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "duck",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "duck-leg-roasted-skin-on",
    "name": "Duck Leg",
    "displayName": "Duck Leg â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "duck leg",
      "roasted duck leg",
      "duck leg with skin"
    ],
    "tags": [
      "poultry",
      "duck",
      "leg",
      "skin-on"
    ],
    "popularity": 65,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 337,
      "protein": 19,
      "carbs": 0,
      "fat": 28
    },
    "servings": [
      {
        "id": "leg",
        "label": "1 duck leg",
        "amount": 1,
        "unit": "leg",
        "grams": 150,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "duck",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "duck-whole-roasted-meat-skin",
    "name": "Whole Duck",
    "displayName": "Whole Duck â Roasted, Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roast duck",
      "whole roasted duck",
      "duck meat and skin"
    ],
    "tags": [
      "poultry",
      "duck",
      "whole",
      "skin-on"
    ],
    "popularity": 68,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 337,
      "protein": 19,
      "carbs": 0,
      "fat": 28
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "duck",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "cornish-hen-whole-roasted-meat-skin",
    "name": "Cornish Hen",
    "displayName": "Cornish Hen â Roasted, Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "cornish hen",
      "roasted cornish hen",
      "game hen"
    ],
    "tags": [
      "poultry",
      "cornish-hen",
      "whole",
      "skin-on"
    ],
    "popularity": 55,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 259,
      "protein": 23,
      "carbs": 0,
      "fat": 18
    },
    "servings": [
      {
        "id": "half-hen",
        "label": "1/2 Cornish hen",
        "amount": 1,
        "unit": "half hen",
        "grams": 170,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "cornish-hen",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "cornish-hen-breast-roasted-meat-only",
    "name": "Cornish Hen Breast",
    "displayName": "Cornish Hen Breast â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "cornish hen breast",
      "roasted cornish hen breast",
      "game hen breast"
    ],
    "tags": [
      "poultry",
      "cornish-hen",
      "breast",
      "meat-only"
    ],
    "popularity": 48,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 134,
      "protein": 26,
      "carbs": 0,
      "fat": 3.5
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 Cornish hen breast",
        "amount": 1,
        "unit": "breast",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "cornish-hen",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "cornish-hen-leg-thigh-roasted-skin-on",
    "name": "Cornish Hen Leg/Thigh",
    "displayName": "Cornish Hen Leg/Thigh â Roasted, Skin-On",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "cornish hen leg",
      "cornish hen thigh",
      "game hen leg thigh"
    ],
    "tags": [
      "poultry",
      "cornish-hen",
      "leg",
      "thigh",
      "skin-on"
    ],
    "popularity": 44,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 228,
      "protein": 24,
      "carbs": 0,
      "fat": 14
    },
    "servings": [
      {
        "id": "leg-thigh",
        "label": "1 Cornish hen leg/thigh",
        "amount": 1,
        "unit": "leg thigh",
        "grams": 75,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "cornish-hen",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "quail-whole-raw",
    "name": "Quail",
    "displayName": "Quail â Whole, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "quail",
      "whole quail",
      "raw quail"
    ],
    "tags": [
      "poultry",
      "quail",
      "whole"
    ],
    "popularity": 40,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 134,
      "protein": 21.8,
      "carbs": 0,
      "fat": 4.5
    },
    "servings": [
      {
        "id": "quail",
        "label": "1 quail",
        "amount": 1,
        "unit": "quail",
        "grams": 92,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "quail",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "quail-whole-roasted",
    "name": "Quail",
    "displayName": "Quail â Whole, Roasted",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "quail",
      "roasted quail",
      "cooked quail"
    ],
    "tags": [
      "poultry",
      "quail",
      "whole"
    ],
    "popularity": 43,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 227,
      "protein": 25,
      "carbs": 0,
      "fat": 14
    },
    "servings": [
      {
        "id": "quail",
        "label": "1 quail",
        "amount": 1,
        "unit": "quail",
        "grams": 92,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "quail",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "goose-breast-raw-meat-only",
    "name": "Goose Breast",
    "displayName": "Goose Breast â Raw, Meat Only",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "goose",
      "goose breast",
      "raw goose breast",
      "skinless goose breast"
    ],
    "tags": [
      "poultry",
      "goose",
      "breast",
      "meat-only"
    ],
    "popularity": 38,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 161,
      "protein": 22.8,
      "carbs": 0,
      "fat": 7.1
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 goose breast serving",
        "amount": 1,
        "unit": "breast serving",
        "grams": 140,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "goose",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "goose-breast-roasted-meat-only",
    "name": "Goose Breast",
    "displayName": "Goose Breast â Roasted, Meat Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "goose breast",
      "roasted goose breast",
      "skinless roasted goose breast"
    ],
    "tags": [
      "poultry",
      "goose",
      "breast",
      "meat-only"
    ],
    "popularity": 41,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 238,
      "protein": 28,
      "carbs": 0,
      "fat": 13
    },
    "servings": [
      {
        "id": "breast",
        "label": "1 goose breast serving",
        "amount": 1,
        "unit": "breast serving",
        "grams": 140,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "goose",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  },
  {
    "id": "goose-whole-roasted-meat-skin",
    "name": "Whole Goose",
    "displayName": "Whole Goose â Roasted, Meat & Skin",
    "category": "protein",
    "state": "cooked",
    "preparation": "roasted",
    "aliases": [
      "roast goose",
      "whole roasted goose",
      "goose meat and skin"
    ],
    "tags": [
      "poultry",
      "goose",
      "whole",
      "skin-on"
    ],
    "popularity": 42,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 305,
      "protein": 25,
      "carbs": 0,
      "fat": 22
    },
    "servings": [
      {
        "id": "serving",
        "label": "1 3 oz serving",
        "amount": 1,
        "unit": "serving",
        "grams": 85,
        "isDefault": true
      }
    ],
    "source": "AriFoodPoultry",
    "verified": false,
    "metadata": {
      "foodFamily": "goose",
      "nutritionReference": "USDA FoodData Central / generic food-composition reference",
      "referenceBasis": "per 100 g edible portion",
      "referenceStatus": "curated_generic_average",
      "accuracyNote": "Generic reference average. Actual nutrition varies by cut, retained skin/fat, product, cooking method, breading, oil absorption, and moisture loss."
    }
  }
];

  const registration =
    global.AriFoodRegistry.registerMany(
      ARI_POULTRY_FOODS,
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
      foodCount: ARI_POULTRY_FOODS.length,
      families: [
        "chicken",
        "turkey",
        "duck",
        "cornish-hen",
        "quail",
        "goose"
      ],
      nutritionBasis: "per 100 g edible portion",
      sourceType: "curated_generic_reference"
    }
  };

  if (
    global.AriFoodProteins &&
    typeof global.AriFoodProteins.markModuleLoaded === "function"
  ) {
    global.AriFoodProteins.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodPoultry =
    Object.freeze({
      VERSION,
      MODULE_NAME,

      count() {
        return ARI_POULTRY_FOODS.length;
      },

      getFoodIds() {
        return ARI_POULTRY_FOODS.map(
          food => food.id
        );
      },

      getFamilies() {
        return [
          "chicken",
          "turkey",
          "duck",
          "cornish-hen",
          "quail",
          "goose"
        ];
      },

      getRegistrationResult() {
        return {
          ...registration
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-poultry-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            foodCount: ARI_POULTRY_FOODS.length,
            registration: moduleResult
          }
        }
      )
    );
  } catch (error) {
    // Non-browser environments may not support CustomEvent.
  }

  console.info(
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded with ${ARI_POULTRY_FOODS.length} poultry records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
