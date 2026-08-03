// =====================================================
// ARI REBIRTH
// File: AriFoodDriedFruit.js
// Version: 1.0.0
//
// Purpose:
//   Plain dried-fruit reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Seedless raisins
//   - Golden raisins
//   - Medjool dates
//   - Deglet Noor dates
//   - Prunes / dried plums
//   - Dried figs
//   - Dried apricots
//   - Dried apples
//   - Zante currants
//
// Data policy:
//   - Generic-first plain dried fruit.
//   - USDA FoodData Central source-traceable references.
//   - Canonical basis: 100 g edible portion.
//   - Dried forms stay separate from raw fruit.
//   - Sweetened/coated/candied/fried products excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodDriedFruit(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodDriedFruit";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first plain dried-fruit reference module",
  "recordCount": 9,
  "driedFruit": [
    "seedless raisins",
    "golden seedless raisins",
    "Medjool dates",
    "Deglet Noor dates",
    "prunes / dried plums",
    "dried figs",
    "dried sulfured apricots",
    "dried sulfured apples",
    "Zante currants"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central SR Legacy for stable dried-fruit composition",
    "USDA common-measure weights for practical individual-fruit servings where available"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Keep dried fruit separate from the corresponding raw fruit because water loss materially concentrates nutrients.",
    "Keep Medjool and Deglet Noor dates separate.",
    "Keep standard seedless raisins, golden raisins, and Zante currants separate.",
    "Do not map yogurt-covered, chocolate-covered, candied, fried, syrup-coated, or sweetened dried fruit to these plain records.",
    "Do not treat sweetened dried cranberries as plain dried fruit; add them only from an exact branded/package or explicit USDA sweetened-food reference.",
    "Do not confuse Zante currants with fresh red, white, or black currant berries.",
    "Do not substitute the low-moisture 320-kcal dried-apricot profile for the standard 241-kcal sulfured dried-apricot record.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_DRIED_FRUIT_FOODS =
    [
  {
    "id": "fruit-raisins-seedless-dried",
    "name": "Raisins",
    "displayName": "Raisins â Seedless, Dried",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "raisins",
      "seedless raisins",
      "dark raisins",
      "regular raisins",
      "dried grapes"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "raisins-seedless"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 299,
      "protein": 3.07,
      "carbs": 79.18,
      "fat": 0.46,
      "fiber": 3.7,
      "sugar": 59.19,
      "sodium": 11,
      "potassium": 749,
      "saturatedFat": 0.058
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz raisins",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "quarter-cup",
        "label": "1/4 cup raisins",
        "amount": 0.25,
        "unit": "cup",
        "grams": 36,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "raisins-seedless",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 168165,
        "sourceDescription": "Raisins, seedless",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "ndbNumber": "09298"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Use as the default unbranded raisin record. Golden raisins and Zante currants are maintained separately."
    }
  },
  {
    "id": "fruit-raisins-golden-seedless-dried",
    "name": "Golden Raisins",
    "displayName": "Golden Raisins â Seedless, Dried",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "golden raisins",
      "gold raisins",
      "sultanas",
      "golden seedless raisins"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "golden-raisins"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 301,
      "protein": 3.28,
      "carbs": 80.02,
      "fat": 0.2,
      "fiber": 3.3,
      "sugar": 65.7,
      "sodium": 24,
      "potassium": 746,
      "saturatedFat": 0.065
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz golden raisins",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "golden-raisins",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 168164,
        "sourceDescription": "Raisins, golden, seedless",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Golden raisins are maintained separately from standard dark seedless raisins because the USDA profiles differ."
    }
  },
  {
    "id": "fruit-dates-medjool-dried",
    "name": "Medjool Dates",
    "displayName": "Medjool Dates â Dried",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "Medjool dates",
      "Medjool date",
      "dates Medjool",
      "large dates"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "medjool-dates"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 277,
      "protein": 1.81,
      "carbs": 74.97,
      "fat": 0.15,
      "fiber": 6.7,
      "sugar": 66.47,
      "sodium": 1,
      "potassium": 696
    },
    "servings": [
      {
        "id": "1-date",
        "label": "1 Medjool date",
        "amount": 1,
        "unit": "Medjool date",
        "grams": 24,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz Medjool dates",
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "medjool-dates",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 168191,
        "sourceDescription": "Dates, medjool",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Medjool dates are kept separate from Deglet Noor because both the per-fruit mass and USDA nutrient profile differ."
    }
  },
  {
    "id": "fruit-dates-deglet-noor-dried",
    "name": "Deglet Noor Dates",
    "displayName": "Deglet Noor Dates â Dried",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "Deglet Noor dates",
      "Deglet Noor date",
      "Deglet dates",
      "small dates"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "deglet-noor-dates"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 282,
      "protein": 2.45,
      "carbs": 75.03,
      "fat": 0.39,
      "fiber": 8.0,
      "sugar": 63.35,
      "sodium": 2,
      "potassium": 656,
      "saturatedFat": 0.032
    },
    "servings": [
      {
        "id": "1-date",
        "label": "1 Deglet Noor date",
        "amount": 1,
        "unit": "Deglet Noor date",
        "grams": 7.1,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz Deglet Noor dates",
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "deglet-noor-dates",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171726,
        "sourceDescription": "Dates, deglet noor",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": null
    }
  },
  {
    "id": "fruit-prunes-dried-plums-uncooked",
    "name": "Prunes",
    "displayName": "Prunes / Dried Plums â Uncooked",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "prunes",
      "prune",
      "dried plums",
      "dried plum"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "prunes"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 240,
      "protein": 2.18,
      "carbs": 63.88,
      "fat": 0.38,
      "fiber": 7.1,
      "sugar": 38.13,
      "sodium": 2,
      "potassium": 732,
      "saturatedFat": 0.088
    },
    "servings": [
      {
        "id": "1-prune",
        "label": "1 prune",
        "amount": 1,
        "unit": "prune",
        "grams": 9.5,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz prunes",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": false
      },
      {
        "id": "1-cup-pitted",
        "label": "1 cup pitted prunes",
        "amount": 1,
        "unit": "cup",
        "grams": 174,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "prunes",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 168162,
        "sourceDescription": "Plums, dried (prunes), uncooked",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": null
    }
  },
  {
    "id": "fruit-figs-dried-uncooked",
    "name": "Dried Figs",
    "displayName": "Figs â Dried, Uncooked",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "dried figs",
      "dried fig",
      "figs dried",
      "mission figs dried"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "dried-figs"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 249,
      "protein": 3.3,
      "carbs": 63.87,
      "fat": 0.93,
      "fiber": 9.8,
      "sugar": 47.92,
      "sodium": 10,
      "potassium": 680,
      "saturatedFat": 0.144
    },
    "servings": [
      {
        "id": "1-fig",
        "label": "1 dried fig",
        "amount": 1,
        "unit": "dried fig",
        "grams": 8.4,
        "isDefault": true
      },
      {
        "id": "1-oz",
        "label": "1 oz dried figs",
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "dried-figs",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 174665,
        "sourceDescription": "Figs, dried, uncooked",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Generic dried fig record. Specific Black Mission, Calimyrna, or branded fig products should be separate if their labels materially differ."
    }
  },
  {
    "id": "fruit-apricots-dried-sulfured-uncooked",
    "name": "Dried Apricots",
    "displayName": "Apricots â Dried, Sulfured, Uncooked",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "dried apricots",
      "dried apricot",
      "sulfured dried apricots",
      "apricots dried"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "dried-apricots"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 241,
      "protein": 3.39,
      "carbs": 62.64,
      "fat": 0.51,
      "fiber": 7.3,
      "sugar": 53.44,
      "sodium": 10,
      "potassium": 1162,
      "saturatedFat": 0.017
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz dried apricots",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
        "isDefault": true
      },
      {
        "id": "1-half",
        "label": "1 dried apricot half",
        "amount": 1,
        "unit": "dried apricot half",
        "grams": 3.5,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "dried-apricots",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 173941,
        "sourceDescription": "Apricots, dried, sulfured, uncooked",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "ndbNumber": "09032"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "This is the standard-moisture sulfured dried-apricot record, not the separate low-moisture/dehydrated 320-kcal USDA profile."
    }
  },
  {
    "id": "fruit-apples-dried-sulfured-uncooked",
    "name": "Dried Apples",
    "displayName": "Apples â Dried, Sulfured, Uncooked",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "dried apples",
      "dried apple",
      "apple rings",
      "dried apple rings"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "dried-apples"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 243,
      "protein": 0.93,
      "carbs": 65.89,
      "fat": 0.32,
      "fiber": 8.7,
      "sugar": 57.19,
      "sodium": 87,
      "potassium": 450,
      "saturatedFat": 0.052
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz dried apples",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "dried-apples",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171691,
        "sourceDescription": "Apples, dried, sulfured, uncooked",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Unsweetened sulfured dried apples. Sweetened apple chips, fried apple chips, cinnamon-sugar apple snacks, and branded products require separate records."
    }
  },
  {
    "id": "fruit-currants-zante-dried",
    "name": "Zante Currants",
    "displayName": "Zante Currants â Dried",
    "category": "fruit",
    "state": "dried",
    "preparation": "dried",
    "aliases": [
      "Zante currants",
      "dried currants",
      "Black Corinth raisins",
      "Corinth raisins",
      "currants dried"
    ],
    "tags": [
      "fruit",
      "dried-fruit",
      "dried",
      "zante-currants"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 290,
      "protein": 3.43,
      "carbs": 77.0,
      "fat": 0.22,
      "fiber": 4.4,
      "sugar": 62.3,
      "sodium": 43,
      "potassium": 777,
      "saturatedFat": 0.09
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz Zante currants",
        "amount": 1,
        "unit": "oz",
        "grams": 28.3495,
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
    "source": "AriFoodDriedFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "dried-fruit",
      "driedFruitType": "zante-currants",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "fdcId": 171724,
        "sourceDescription": "Currants, zante, dried",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "sodium",
        "potassium",
        "saturatedFat"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "addedSugarAssumed": false,
      "notes": "Zante currants are dried Black Corinth grapes and are a type of raisin. They are not the same food as fresh red, white, or black currant berries."
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
    if (!global.AriFoodFruit) {
      return false;
    }

    if (
      typeof global.AriFoodFruit.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodFruit.isExpectedModule(
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
      global.AriFoodFruit &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodFruit.markModuleFailed === "function"
    ) {
      global.AriFoodFruit.markModuleFailed(
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
      ARI_DRIED_FRUIT_FOODS,
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
        ARI_DRIED_FRUIT_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "raisins",
        "golden-raisins",
        "medjool-dates",
        "deglet-noor-dates",
        "prunes",
        "dried-figs",
        "dried-apricots",
        "dried-apples",
        "zante-currants"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} dried-fruit record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodFruit &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodFruit.markModuleLoaded === "function"
  ) {
    global.AriFoodFruit.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodDriedFruit =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_DRIED_FRUIT_FOODS.length;
      },

      getFoodIds() {
        return ARI_DRIED_FRUIT_FOODS.map(
          food => food.id
        );
      },

      getDriedFruitTypes() {
        return Array.from(
          new Set(
            ARI_DRIED_FRUIT_FOODS.map(
              food =>
                food.metadata.driedFruitType
            )
          )
        );
      },

      getByDriedFruitType(driedFruitType) {
        const normalized =
          String(driedFruitType || "")
            .trim()
            .toLowerCase();

        return ARI_DRIED_FRUIT_FOODS
          .filter(
            food =>
              String(
                food.metadata?.driedFruitType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getDates() {
        return ARI_DRIED_FRUIT_FOODS
          .filter(
            food =>
              [
                "medjool-dates",
                "deglet-noor-dates"
              ].includes(
                food.metadata?.driedFruitType
              )
          )
          .map(clone);
      },

      getRaisinFamily() {
        return ARI_DRIED_FRUIT_FOODS
          .filter(
            food =>
              [
                "raisins-seedless",
                "golden-raisins",
                "zante-currants"
              ].includes(
                food.metadata?.driedFruitType
              )
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
          ARI_DRIED_FRUIT_FOODS.find(
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
        "ari:food-dried-fruit-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_DRIED_FRUIT_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_DRIED_FRUIT_FOODS.length} plain dried-fruit records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
