// =====================================================
// ARI REBIRTH
// File: AriFoodTropicalFruit.js
// Version: 1.0.0
//
// Purpose:
//   Raw tropical-fruit reference module for ARI Nutrition.
//
// Collection:
//   AriFoodFruit
//
// Coverage:
//   - Mango — Tommy Atkins
//   - Pineapple
//   - Papaya
//   - Coconut meat
//   - Passion fruit
//   - Dragon fruit / pitaya
//   - Lychee / litchi
//   - Longan
//   - Starfruit / carambola
//   - Jackfruit
//   - Durian
//
// Data policy:
//   - Generic-first raw/minimally processed fruit.
//   - USDA Foundation preferred where intentionally selected.
//   - USDA SR Legacy / FNDDS used for stable references.
//   - Canonical basis: 100 g edible portion.
//   - Food-specific Atwater energy preferred when available.
//   - Processed/sweetened/canned forms excluded.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodFruit v1+
// =====================================================

(function initializeAriFoodTropicalFruit(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodTropicalFruit";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic-first raw tropical-fruit reference module",
  "recordCount": 11,
  "tropicalFruit": [
    "Tommy Atkins mango",
    "pineapple",
    "papaya",
    "raw coconut meat",
    "purple passion fruit",
    "dragon fruit / pitaya",
    "lychee / litchi",
    "longan",
    "starfruit / carambola",
    "jackfruit",
    "durian"
  ],
  "sourceHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytical commodity profiles",
    "USDA FoodData Central SR Legacy for stable generic raw tropical-fruit references",
    "USDA FNDDS when a useful tropical-fruit reference is not available in Foundation/SR Legacy",
    "USDA common-measure weights for practical piece and cup conversions"
  ],
  "rules": [
    "Canonical nutrition basis is 100 g edible portion.",
    "Prefer food-specific Atwater energy for current Foundation records when both specific and general energy are published.",
    "Preserve alternate general-factor energy in source provenance.",
    "Do not merge cultivar-specific mango profiles when USDA publishes materially distinct Foundation records.",
    "Keep coconut meat separate from coconut water, coconut milk, coconut cream, dried coconut, and sweetened coconut.",
    "Keep ripe raw jackfruit separate from canned young green jackfruit.",
    "Keep raw fruit separate from canned syrup-packed, sweetened, dried, juiced, pureed-with-sugar, or frozen sweetened forms.",
    "Omit nutrients that are not confidently present in the selected source rather than inserting zero or inferred values.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_TROPICAL_FRUIT_FOODS =
    [
  {
    "id": "fruit-mango-tommy-atkins-peeled-raw",
    "name": "Mango",
    "displayName": "Mango — Tommy Atkins, Peeled, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "mango",
      "Tommy Atkins mango",
      "raw mango",
      "fresh mango",
      "peeled mango",
      "mango pieces"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "mango"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 61.6,
      "protein": 0.562,
      "carbs": 15.3,
      "fat": 0.572,
      "fiber": 1.75,
      "sugar": 10.7,
      "sodium": 0,
      "potassium": 165
    },
    "servings": [
      {
        "id": "1-cup-pieces",
        "label": "1 cup mango pieces",
        "amount": 1,
        "unit": "cup",
        "grams": 165,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "mango",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Mango, Tommy Atkins, peeled, raw",
        "fdcId": 2710833,
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "energySelection": {
          "selected": {
            "method": "Atwater Specific Factors",
            "kcalPer100g": 61.6
          },
          "alternate": {
            "method": "Atwater General Factors",
            "kcalPer100g": 68.5
          },
          "policy": "ARI prefers the USDA food-specific Atwater energy value when both food-specific and general-factor values are published."
        }
      },
      "householdServingSource": "1 cup = 165 g is the USDA legacy generic-mango common-measure weight used only as a convenience conversion for this current Foundation profile.",
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
      "notes": "Tommy Atkins is used as the V1 default supermarket mango profile because USDA now publishes a current cultivar-specific Foundation Food record. Ataulfo should be added separately later rather than merged into this record."
    }
  },
  {
    "id": "fruit-pineapple-raw",
    "name": "Pineapple",
    "displayName": "Pineapple — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "pineapple",
      "raw pineapple",
      "fresh pineapple",
      "pineapple chunks",
      "pineapple pieces"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "pineapple"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 54.0,
      "protein": 0.461,
      "carbs": 14.1,
      "fat": 0.211,
      "fiber": 0.935,
      "sugar": 11.4,
      "sodium": 0,
      "potassium": 137
    },
    "servings": [
      {
        "id": "1-cup-chunks",
        "label": "1 cup pineapple chunks",
        "amount": 1,
        "unit": "cup",
        "grams": 165,
        "isDefault": true
      },
      {
        "id": "1-slice-thick",
        "label": "1 thick pineapple slice",
        "amount": 1,
        "unit": "slice",
        "grams": 84,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "pineapple",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Pineapple, raw",
        "fdcId": 2346398,
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "energySelection": {
          "selected": {
            "method": "Atwater Specific Factors",
            "kcalPer100g": 54.0
          },
          "alternate": {
            "method": "Atwater General Factors",
            "kcalPer100g": 60.1
          },
          "policy": "ARI prefers the USDA food-specific Atwater energy value when both food-specific and general-factor values are published."
        }
      },
      "householdServingSource": "Cup and slice gram weights come from the USDA legacy raw-pineapple common-measure reference and are used as practical conversions.",
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
      "notes": "ARI uses the current USDA Foundation food-specific Atwater energy (54.0 kcal/100 g) and preserves the 60.1 kcal general-factor value in provenance."
    }
  },
  {
    "id": "fruit-papaya-raw",
    "name": "Papaya",
    "displayName": "Papaya — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "papaya",
      "raw papaya",
      "fresh papaya",
      "ripe papaya",
      "papaya pieces"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "papaya"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 43,
      "protein": 0.47,
      "carbs": 10.82,
      "fat": 0.26,
      "fiber": 1.7,
      "sugar": 7.82,
      "saturatedFat": 0.081,
      "sodium": 8,
      "potassium": 182
    },
    "servings": [
      {
        "id": "1-cup-pieces",
        "label": "1 cup papaya pieces",
        "amount": 1,
        "unit": "cup",
        "grams": 145,
        "isDefault": true
      },
      {
        "id": "1-small-fruit",
        "label": "1 small papaya",
        "amount": 1,
        "unit": "small papaya",
        "grams": 157,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "papaya",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Papayas, raw",
        "fdcId": 169926,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09226",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-coconut-meat-raw",
    "name": "Coconut",
    "displayName": "Coconut Meat — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "coconut",
      "coconut meat",
      "raw coconut",
      "fresh coconut",
      "coconut flesh",
      "shredded fresh coconut"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "coconut"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 354,
      "protein": 3.33,
      "carbs": 15.23,
      "fat": 33.49,
      "fiber": 9.0,
      "sugar": 6.23,
      "saturatedFat": 29.698,
      "sodium": 20,
      "potassium": 356
    },
    "servings": [
      {
        "id": "1-cup-shredded",
        "label": "1 cup shredded coconut meat",
        "amount": 1,
        "unit": "cup",
        "grams": 80,
        "isDefault": true
      },
      {
        "id": "1-piece",
        "label": "1 piece coconut meat",
        "amount": 1,
        "unit": "piece",
        "grams": 45,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "coconut",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Nuts, coconut meat, raw",
        "fdcId": 170169,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "12104",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "This record is raw coconut flesh only. Coconut water, coconut milk, coconut cream, dried coconut, and sweetened coconut are separate food forms."
    }
  },
  {
    "id": "fruit-passion-fruit-purple-raw",
    "name": "Passion Fruit",
    "displayName": "Passion Fruit — Purple, Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "passion fruit",
      "passionfruit",
      "purple passion fruit",
      "maracuya",
      "maracuyá",
      "granadilla"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "passion-fruit"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 97,
      "protein": 2.2,
      "carbs": 23.38,
      "fat": 0.7,
      "fiber": 10.4,
      "sugar": 11.2,
      "saturatedFat": 0.059,
      "sodium": 28,
      "potassium": 348
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 passion fruit",
        "amount": 1,
        "unit": "passion fruit",
        "grams": 18,
        "isDefault": true
      },
      {
        "id": "1-cup",
        "label": "1 cup passion fruit pulp and seeds",
        "amount": 1,
        "unit": "cup",
        "grams": 236,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "passion-fruit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Passion-fruit, (granadilla), purple, raw",
        "fdcId": 169108,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09231",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Values refer to edible pulp and seeds. Passion-fruit juice, puree with added sugar, syrups, and concentrates should not resolve to this record."
    }
  },
  {
    "id": "fruit-dragon-fruit-raw",
    "name": "Dragon Fruit",
    "displayName": "Dragon Fruit / Pitaya — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "dragon fruit",
      "dragonfruit",
      "pitaya",
      "pitahaya",
      "strawberry pear"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "dragon-fruit"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 57,
      "protein": 0.36,
      "carbs": 15.2,
      "fat": 0.14,
      "fiber": 3.1,
      "sugar": 9.8,
      "saturatedFat": 0.02,
      "sodium": 1,
      "potassium": 116
    },
    "servings": [
      {
        "id": "1-cup-cubed",
        "label": "1 cup cubed dragon fruit",
        "amount": 1,
        "unit": "cup",
        "grams": 227,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "dragon-fruit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "FNDDS",
        "sourceDescription": "Dragon fruit",
        "fdcId": 2344729,
        "verifiedAt": "2026-08-03",
        "release": "FNDDS 2021-2023 / October 2024 release"
      },
      "householdServingSource": "1 cup cubed = 227 g is retained as the practical USDA-derived serving used with this FNDDS profile.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "This is the broad USDA/FNDDS dragon-fruit profile. White-, red-, and yellow-fleshed varieties should only be separated when ARI has reliable variety-specific composition data."
    }
  },
  {
    "id": "fruit-lychee-raw",
    "name": "Lychee",
    "displayName": "Lychee / Litchi — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "lychee",
      "litchi",
      "litchis",
      "fresh lychee",
      "raw lychee"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "lychee"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 66,
      "protein": 0.83,
      "carbs": 16.53,
      "fat": 0.44,
      "fiber": 1.3,
      "sugar": 15.23,
      "saturatedFat": 0.099,
      "sodium": 1,
      "potassium": 171
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 lychee",
        "amount": 1,
        "unit": "lychee",
        "grams": 9.6,
        "isDefault": true
      },
      {
        "id": "1-cup",
        "label": "1 cup lychee",
        "amount": 1,
        "unit": "cup",
        "grams": 190,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "lychee",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Litchis, raw",
        "fdcId": 169086,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09164",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-longan-raw",
    "name": "Longan",
    "displayName": "Longan — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "longan",
      "longans",
      "dragon eye fruit",
      "fresh longan",
      "raw longan"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "longan"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 60,
      "protein": 1.31,
      "carbs": 15.14,
      "fat": 0.1,
      "fiber": 1.1,
      "sodium": 0,
      "potassium": 266
    },
    "servings": [
      {
        "id": "1-fruit",
        "label": "1 longan",
        "amount": 1,
        "unit": "longan",
        "grams": 3,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "longan",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Longans, raw",
        "fdcId": 169089,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09172",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
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
      "brandSpecific": false,
      "notes": "Total sugar and saturated-fat values are intentionally omitted because they are not confidently present in the selected USDA reference profile."
    }
  },
  {
    "id": "fruit-starfruit-carambola-raw",
    "name": "Starfruit",
    "displayName": "Starfruit / Carambola — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "starfruit",
      "star fruit",
      "carambola",
      "raw starfruit",
      "fresh starfruit"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "starfruit"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 31,
      "protein": 1.04,
      "carbs": 6.73,
      "fat": 0.33,
      "fiber": 2.8,
      "sugar": 3.98,
      "saturatedFat": 0.019,
      "sodium": 2,
      "potassium": 133
    },
    "servings": [
      {
        "id": "1-medium",
        "label": "1 medium starfruit",
        "amount": 1,
        "unit": "medium starfruit",
        "grams": 91,
        "isDefault": true
      },
      {
        "id": "1-cup-cubed",
        "label": "1 cup cubed starfruit",
        "amount": 1,
        "unit": "cup",
        "grams": 132,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "starfruit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Carambola, (starfruit), raw",
        "fdcId": 171715,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09060",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": null
    }
  },
  {
    "id": "fruit-jackfruit-raw",
    "name": "Jackfruit",
    "displayName": "Jackfruit — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "jackfruit",
      "raw jackfruit",
      "fresh jackfruit",
      "ripe jackfruit",
      "jackfruit flesh"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "jackfruit"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 95,
      "protein": 1.72,
      "carbs": 23.25,
      "fat": 0.64,
      "fiber": 1.5,
      "sugar": 19.08,
      "saturatedFat": 0.195,
      "sodium": 2,
      "potassium": 448
    },
    "servings": [
      {
        "id": "1-cup-sliced",
        "label": "1 cup sliced jackfruit",
        "amount": 1,
        "unit": "cup",
        "grams": 165,
        "isDefault": true
      },
      {
        "id": "1-cup-pieces",
        "label": "1 cup 1-inch jackfruit pieces",
        "amount": 1,
        "unit": "cup",
        "grams": 151,
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
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "jackfruit",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Jackfruit, raw",
        "fdcId": 174687,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09144",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "saturatedFat",
        "sodium",
        "potassium"
      ],
      "offlineReference": true,
      "brandSpecific": false,
      "notes": "Raw ripe jackfruit is distinct from canned young green jackfruit, which is commonly used as a savory meat substitute and must have its own record."
    }
  },
  {
    "id": "fruit-durian-raw",
    "name": "Durian",
    "displayName": "Durian — Raw",
    "category": "fruit",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "durian",
      "raw durian",
      "fresh durian",
      "durian flesh"
    ],
    "tags": [
      "fruit",
      "tropical-fruit",
      "raw",
      "durian"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 147,
      "protein": 1.47,
      "carbs": 27.09,
      "fat": 5.33,
      "fiber": 3.8,
      "sodium": 2,
      "potassium": 436
    },
    "servings": [
      {
        "id": "100-g",
        "label": "100 g",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": true
      }
    ],
    "source": "AriFoodTropicalFruit",
    "verified": true,
    "metadata": {
      "foodFamily": "fruit",
      "fruitGroup": "tropical",
      "tropicalType": "durian",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Durian, raw or frozen",
        "fdcId": 168192,
        "verifiedAt": "2026-08-03",
        "ndbNumber": "09425",
        "release": "April 2018 (final)"
      },
      "householdServingSource": "USDA FoodData Central common-measure reference where available.",
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
      "brandSpecific": false,
      "notes": "USDA groups raw and frozen unsweetened durian in this reference. Total sugar and saturated-fat values are omitted when not confidently reported by the selected record."
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

  // Clear stale records owned by this exact module on hot reload.
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
      ARI_TROPICAL_FRUIT_FOODS,
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
        ARI_TROPICAL_FRUIT_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "mango",
        "pineapple",
        "papaya",
        "coconut",
        "passion-fruit",
        "dragon-fruit",
        "lychee",
        "longan",
        "starfruit",
        "jackfruit",
        "durian"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} tropical-fruit record(s).`,
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

  global.AriFoodTropicalFruit =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_TROPICAL_FRUIT_FOODS.length;
      },

      getFoodIds() {
        return ARI_TROPICAL_FRUIT_FOODS.map(
          food => food.id
        );
      },

      getTropicalTypes() {
        return Array.from(
          new Set(
            ARI_TROPICAL_FRUIT_FOODS.map(
              food =>
                food.metadata.tropicalType
            )
          )
        );
      },

      getByTropicalType(tropicalType) {
        const normalized =
          String(tropicalType || "")
            .trim()
            .toLowerCase();

        return ARI_TROPICAL_FRUIT_FOODS
          .filter(
            food =>
              String(
                food.metadata?.tropicalType || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getFoundationRecords() {
        return ARI_TROPICAL_FRUIT_FOODS
          .filter(
            food =>
              food.metadata?.sourceProvenance?.dataset ===
              "Foundation Foods"
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
          ARI_TROPICAL_FRUIT_FOODS.find(
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
        "ari:food-tropical-fruit-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_TROPICAL_FRUIT_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_TROPICAL_FRUIT_FOODS.length} raw tropical-fruit records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
