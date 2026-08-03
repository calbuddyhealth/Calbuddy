// =====================================================
// ARI REBIRTH
// File: AriFoodPlantProteins.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline plant-protein reference
//   data for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Firm tofu
//   - Regular tofu
//   - Tempeh
//   - Mature soybeans
//   - Edamame
//   - Lentils
//   - Chickpeas / garbanzo beans
//   - Black beans
//   - Red kidney beans
//   - Pinto beans
//   - Navy beans
//   - Great Northern beans
//   - Split peas
//   - Mung beans
//
// Reliability:
//   - USDA FoodData Central generic references.
//   - Nutrition basis is 100 g edible portion.
//   - Cooked/no-salt legumes preferred.
//   - Branded meat substitutes are excluded.
//   - Generic seitan is excluded because hydration and
//     recipe formulation can radically alter per-100-g
//     nutrition.
//   - No runtime internet connection is required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+
// =====================================================

(function initializeAriFoodPlantProteins(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPlantProteins";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact generic soy, tofu, tempeh, legume, bean, lentil, and pea records",
    "Current USDA-derived nutrition mirrors used as cross-checks during authoring",
    "Branded plant-based meats intentionally excluded from this generic module because manufacturer formulations vary"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Provide practical half-cup or ounce serving equivalents while retaining the canonical weight basis.",
    "Keep tofu firmness/coagulant profiles separate because water and calcium-set differences materially affect nutrition.",
    "Keep cooked legumes separate from dry/raw legumes; users normally log the cooked edible food.",
    "Use no-salt cooked legume references whenever possible so user-added salt can be tracked separately.",
    "Do not treat hummus, refried beans, bean chili, dal, falafel, or other recipes as plain legumes.",
    "Do not include generic seitan in this production dataset because hydration and recipe formulation can dramatically change per-100-g nutrition.",
    "Do not include branded plant burgers, meat substitutes, protein powders, or packaged tofu products here; those belong in branded-food collections.",
    "Soy foods are marked with the soy allergen.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_PLANT_PROTEIN_FOODS =
    [
  {
    "id": "plant-tofu-firm-calcium-raw",
    "name": "Firm Tofu",
    "displayName": "Tofu â Firm, Calcium-Set",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tofu",
      "firm tofu",
      "calcium set tofu",
      "bean curd",
      "soy tofu"
    ],
    "tags": [
      "plant-protein",
      "tofu",
      "soy",
      "firm",
      "calcium-set"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 144,
      "protein": 17.27,
      "carbs": 2.78,
      "fat": 8.72,
      "fiber": 2.3,
      "sodium": 14,
      "potassium": 237,
      "saturatedFat": 1.261
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "tofu",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tofu, raw, firm, prepared with calcium sulfate",
        "release": "April 2018 (final)",
        "fdcId": 172475,
        "ndbNumber": "16427"
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
        "soy"
      ],
      "plantBased": true,
      "notes": "This is the USDA firm calcium-sulfate tofu reference. Tofu varies substantially by firmness, water content, and coagulant, so branded tofu should use its package label when available."
    }
  },
  {
    "id": "plant-tofu-regular-calcium-raw",
    "name": "Regular Tofu",
    "displayName": "Tofu â Regular, Calcium-Set",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "tofu",
      "regular tofu",
      "soft tofu",
      "calcium tofu",
      "bean curd"
    ],
    "tags": [
      "plant-protein",
      "tofu",
      "soy",
      "regular",
      "calcium-set"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 76,
      "protein": 8.08,
      "carbs": 1.87,
      "fat": 4.78,
      "fiber": 0.3,
      "sodium": 7,
      "potassium": 121,
      "saturatedFat": 0.691
    },
    "servings": [
      {
        "id": "3-oz",
        "label": "3 oz",
        "amount": 3,
        "unit": "oz",
        "grams": 85.0486,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "tofu",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tofu, raw, regular, prepared with calcium sulfate",
        "release": "April 2018 (final)",
        "fdcId": 172476,
        "ndbNumber": "16428"
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
        "soy"
      ],
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-tempeh-cooked",
    "name": "Tempeh",
    "displayName": "Tempeh â Cooked",
    "category": "protein",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "tempeh",
      "cooked tempeh",
      "soy tempeh",
      "fermented soy"
    ],
    "tags": [
      "plant-protein",
      "tempeh",
      "soy",
      "fermented"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 195,
      "protein": 19.91,
      "carbs": 7.62,
      "fat": 11.38,
      "fiber": 0
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 83,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "tempeh",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Tempeh, cooked",
        "release": "April 2018 (final)",
        "fdcId": 172467,
        "ndbNumber": "16115"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "offlineReference": true,
      "allergens": [
        "soy"
      ],
      "plantBased": true,
      "notes": "USDA generic cooked tempeh reference. Fiber is not reported in this legacy record, so ARI stores 0 only as a schema-compatible placeholder and does not treat fiber as analytically complete.",
      "fiberStatus": "not_reported_in_source"
    }
  },
  {
    "id": "plant-soybeans-mature-cooked-no-salt",
    "name": "Soybeans",
    "displayName": "Soybeans â Mature, Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "soybeans",
      "cooked soybeans",
      "boiled soybeans",
      "mature soybeans"
    ],
    "tags": [
      "plant-protein",
      "soybean",
      "soy",
      "mature",
      "boiled",
      "no-salt"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 172,
      "protein": 18.21,
      "carbs": 8.36,
      "fat": 8.97,
      "fiber": 6.0,
      "sodium": 1,
      "potassium": 515,
      "saturatedFat": 1.297
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 86,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "soybean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Soybeans, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "fdcId": 174271,
        "ndbNumber": "16109"
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
        "soy"
      ],
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-edamame-cooked-no-salt",
    "name": "Edamame",
    "displayName": "Edamame â Cooked, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "edamame",
      "green soybeans",
      "cooked edamame",
      "boiled edamame",
      "soybeans green"
    ],
    "tags": [
      "plant-protein",
      "edamame",
      "soy",
      "green-soybean",
      "boiled",
      "no-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 141,
      "protein": 12.35,
      "carbs": 11.05,
      "fat": 6.4,
      "fiber": 4.2,
      "sodium": 14,
      "potassium": 540
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 90,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "edamame",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Soybeans, green, cooked, boiled, drained, without salt",
        "release": "April 2018 (final)",
        "fdcId": 169283,
        "ndbNumber": "11451"
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
        "soy"
      ],
      "plantBased": true,
      "notes": "This reference is shelled cooked green soybeans/edamame, not pods. Restaurant edamame with salt should have added sodium logged separately."
    }
  },
  {
    "id": "plant-lentils-cooked-no-salt",
    "name": "Lentils",
    "displayName": "Lentils â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "lentils",
      "cooked lentils",
      "boiled lentils",
      "brown lentils",
      "green lentils"
    ],
    "tags": [
      "plant-protein",
      "lentil",
      "lentil",
      "boiled",
      "no-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 116,
      "protein": 9.02,
      "carbs": 20.13,
      "fat": 0.38,
      "fiber": 7.9,
      "sodium": 2,
      "potassium": 369,
      "saturatedFat": 0.053
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 99,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "lentil",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Lentils, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "fdcId": 172421,
        "ndbNumber": "16070"
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-chickpeas-cooked-no-salt",
    "name": "Chickpeas",
    "displayName": "Chickpeas / Garbanzo Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "chickpeas",
      "garbanzo beans",
      "garbanzos",
      "cooked chickpeas",
      "boiled chickpeas"
    ],
    "tags": [
      "plant-protein",
      "chickpea",
      "chickpea",
      "garbanzo",
      "boiled",
      "no-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 164,
      "protein": 8.86,
      "carbs": 27.42,
      "fat": 2.59,
      "fiber": 7.6,
      "sodium": 7,
      "potassium": 291,
      "saturatedFat": 0.269
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 82,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "chickpea",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16057",
        "sourceNote": "Exact USDA food description verified; FDC ID intentionally omitted rather than inferred."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-black-beans-cooked-no-salt",
    "name": "Black Beans",
    "displayName": "Black Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "black beans",
      "cooked black beans",
      "boiled black beans",
      "frijoles negros"
    ],
    "tags": [
      "plant-protein",
      "black-bean",
      "bean",
      "black-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 132,
      "protein": 8.86,
      "carbs": 23.71,
      "fat": 0.54,
      "fiber": 8.7,
      "sodium": 1,
      "potassium": 355,
      "saturatedFat": 0.139
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 86,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "black-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, black, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16015",
        "sourceNote": "USDA SR Legacy description and macro profile cross-checked during authoring."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-kidney-beans-red-cooked-no-salt",
    "name": "Red Kidney Beans",
    "displayName": "Red Kidney Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "kidney beans",
      "red kidney beans",
      "cooked kidney beans",
      "boiled kidney beans"
    ],
    "tags": [
      "plant-protein",
      "kidney-bean",
      "bean",
      "kidney-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 127,
      "protein": 8.67,
      "carbs": 22.8,
      "fat": 0.5,
      "fiber": 7.4,
      "sodium": 2,
      "potassium": 403,
      "saturatedFat": 0.072
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 88.5,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "kidney-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, kidney, red, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "fdcId": 175194,
        "ndbNumber": "16033"
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-pinto-beans-cooked-no-salt",
    "name": "Pinto Beans",
    "displayName": "Pinto Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "pinto beans",
      "cooked pinto beans",
      "boiled pinto beans",
      "frijoles pintos"
    ],
    "tags": [
      "plant-protein",
      "pinto-bean",
      "bean",
      "pinto-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 143,
      "protein": 9.01,
      "carbs": 26.22,
      "fat": 0.65,
      "fiber": 9.0,
      "sodium": 1,
      "potassium": 436,
      "saturatedFat": 0.109
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 85.5,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "pinto-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, pinto, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16043",
        "sourceNote": "USDA SR Legacy description and macro profile cross-checked during authoring."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-navy-beans-cooked-no-salt",
    "name": "Navy Beans",
    "displayName": "Navy Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "navy beans",
      "cooked navy beans",
      "boiled navy beans",
      "pea beans"
    ],
    "tags": [
      "plant-protein",
      "navy-bean",
      "bean",
      "navy-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 140,
      "protein": 8.23,
      "carbs": 26.0,
      "fat": 0.62,
      "fiber": 10.5,
      "sodium": 0,
      "potassium": 389,
      "saturatedFat": 0.098
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 91,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "navy-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, navy, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16039",
        "sourceNote": "USDA-derived profile cross-checked against current nutrition mirrors."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-great-northern-beans-cooked-no-salt",
    "name": "Great Northern Beans",
    "displayName": "Great Northern Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "great northern beans",
      "northern beans",
      "white beans",
      "cooked great northern beans"
    ],
    "tags": [
      "plant-protein",
      "great-northern-bean",
      "bean",
      "great-northern",
      "white-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 118,
      "protein": 8.33,
      "carbs": 21.09,
      "fat": 0.45,
      "fiber": 7.0,
      "sodium": 2,
      "potassium": 391
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 88,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "great-northern-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beans, great northern, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16026",
        "sourceNote": "USDA SR Legacy description and macro profile cross-checked during authoring."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-split-peas-cooked-no-salt",
    "name": "Split Peas",
    "displayName": "Split Peas â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "split peas",
      "cooked split peas",
      "boiled split peas",
      "green split peas",
      "yellow split peas"
    ],
    "tags": [
      "plant-protein",
      "split-pea",
      "pea",
      "split-pea",
      "boiled",
      "no-salt"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 118,
      "protein": 8.34,
      "carbs": 21.1,
      "fat": 0.39,
      "fiber": 8.3,
      "sodium": 2,
      "potassium": 362,
      "saturatedFat": 0.055
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 98,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "split-pea",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Peas, split, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16086",
        "sourceNote": "USDA-derived profile cross-checked against current hospital nutrition reference."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
    }
  },
  {
    "id": "plant-mung-beans-cooked-no-salt",
    "name": "Mung Beans",
    "displayName": "Mung Beans â Boiled, No Salt",
    "category": "protein",
    "state": "cooked",
    "preparation": "boiled",
    "aliases": [
      "mung beans",
      "cooked mung beans",
      "boiled mung beans",
      "green gram"
    ],
    "tags": [
      "plant-protein",
      "mung-bean",
      "bean",
      "mung-bean",
      "boiled",
      "no-salt"
    ],
    "popularity": 84,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 105,
      "protein": 7.02,
      "carbs": 19.15,
      "fat": 0.38,
      "fiber": 7.6,
      "sodium": 2,
      "potassium": 266,
      "saturatedFat": 0.115
    },
    "servings": [
      {
        "id": "half-cup",
        "label": "1/2 cup",
        "amount": 0.5,
        "unit": "cup",
        "grams": 101,
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
    "source": "AriFoodPlantProteins",
    "verified": true,
    "metadata": {
      "foodFamily": "mung-bean",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Mung beans, mature seeds, cooked, boiled, without salt",
        "release": "April 2018 (final)",
        "ndbNumber": "16081",
        "sourceNote": "USDA-derived profile cross-checked against current nutrition references."
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
      "plantBased": true,
      "notes": "Generic USDA reference value. Actual nutrition can vary by cultivar, hydration, cooking water, processing, coagulant, brand, added salt, sauce, oil, or recipe."
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
      global.AriFoodProteins &&
      typeof global.AriFoodProteins.markModuleFailed === "function"
    ) {
      global.AriFoodProteins.markModuleFailed(
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
    markFailed(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

  // Clear stale module records on hot reload.
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
      ARI_PLANT_PROTEIN_FOODS,
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
      foodCount: ARI_PLANT_PROTEIN_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "tofu",
        "tempeh",
        "soybeans",
        "lentils",
        "chickpeas",
        "beans",
        "peas"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} plant-protein record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodProteins &&
    typeof global.AriFoodProteins.markModuleLoaded === "function"
  ) {
    global.AriFoodProteins.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodPlantProteins =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_PLANT_PROTEIN_FOODS.length;
      },

      getFoodIds() {
        return ARI_PLANT_PROTEIN_FOODS.map(
          food => food.id
        );
      },

      getFamilies() {
        return Array.from(
          new Set(
            ARI_PLANT_PROTEIN_FOODS.map(
              food => food.metadata.foodFamily
            )
          )
        );
      },

      getSoyRecords() {
        return ARI_PLANT_PROTEIN_FOODS
          .filter(
            food =>
              Array.isArray(food.metadata?.allergens) &&
              food.metadata.allergens.includes("soy")
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
          ARI_PLANT_PROTEIN_FOODS.find(
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
        "ari:food-plant-proteins-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_PLANT_PROTEIN_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_PLANT_PROTEIN_FOODS.length} source-traceable plant-protein reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
