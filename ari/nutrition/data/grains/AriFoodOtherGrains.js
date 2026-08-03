// =====================================================
// ARI REBIRTH
// File: AriFoodOtherGrains.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline reference data for
//   grain and pseudograin foods not owned by Rice,
//   Pasta, Bread, or Oats.
//
// Collection:
//   AriFoodGrains
//
// Coverage:
//   - Quinoa, dry + cooked
//   - Pearled barley, dry + cooked
//   - Bulgur, dry + cooked
//   - Couscous, dry + cooked
//   - Millet, dry + cooked
//   - Buckwheat / kasha, dry + cooked
//   - Amaranth, dry + cooked
//
// Important:
//   - Dry and cooked grain weights are never
//     interchangeable.
//   - Farro is intentionally excluded from v1 because
//     "farro" can refer to einkorn, emmer, or spelt.
//   - Pearl / Israeli couscous is not treated as
//     traditional couscous.
//   - Brands are excluded for a later branded layer.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodGrains v1+
// =====================================================

(function initializeAriFoodOtherGrains(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodOtherGrains";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "displayNamingRule": "User-facing names remain plain food names. The word 'generic' is not appended to display names.",
  "primaryHierarchy": [
    "USDA FoodData Central SR Legacy exact grain and pseudograin reference foods",
    "USDA Foundation Foods inventory/update log used to track newer buckwheat and millet analytical records",
    "Manufacturer label data reserved for later brand-specific products"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Never interchange dry and cooked grain nutrition.",
    "Keep quinoa, pearled barley, bulgur, couscous, millet, buckwheat, and amaranth as distinct foods.",
    "Treat quinoa, buckwheat, and amaranth as pseudograins in metadata while keeping them inside the grain collection for nutrition search usability.",
    "Do not map farro to a single generic record because the term can refer to einkorn, emmer, or spelt depending on the product.",
    "Do not map pearl/Israeli couscous to traditional semolina couscous; pearl couscous belongs with pasta-like products or its exact product record.",
    "Do not treat hulled barley as nutritionally identical to pearled barley.",
    "Do not include oil, butter, broth, salt, sauce, sweetener, fruit, or other recipe additions in plain cooked grain records.",
    "Brands and packaged grain blends will be handled later using manufacturer label data.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_OTHER_GRAIN_FOODS =
    [
  {
    "id": "grain-quinoa-uncooked",
    "name": "Quinoa",
    "displayName": "Quinoa â Uncooked",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "quinoa",
      "dry quinoa",
      "uncooked quinoa",
      "white quinoa",
      "red quinoa",
      "black quinoa"
    ],
    "tags": [
      "grain",
      "other-grain",
      "quinoa",
      "quinoa",
      "pseudograin",
      "dry"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 368,
      "protein": 14.12,
      "carbs": 64.16,
      "fat": 6.07,
      "fiber": 7.0,
      "sodium": 5,
      "potassium": 563,
      "saturatedFat": 0.706
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 85.0,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "quinoa",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Quinoa, uncooked",
        "release": "April 2018 (final)",
        "fdcId": 168874
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "USDA unbranded quinoa reference. Color varieties are searchable here only when a more specific product record is unavailable; branded quinoa blends should later use their package data."
    }
  },
  {
    "id": "grain-quinoa-cooked",
    "name": "Quinoa",
    "displayName": "Quinoa â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "quinoa",
      "cooked quinoa",
      "plain quinoa",
      "boiled quinoa"
    ],
    "tags": [
      "grain",
      "other-grain",
      "quinoa",
      "quinoa",
      "pseudograin",
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
      "calories": 120,
      "protein": 4.4,
      "carbs": 21.3,
      "fat": 1.92,
      "fiber": 2.8,
      "sodium": 7,
      "potassium": 172,
      "saturatedFat": 0.231
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 185,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 92.5,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "quinoa",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Quinoa, cooked",
        "release": "April 2018 (final)",
        "fdcId": 168917
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-barley-pearled-raw",
    "name": "Pearled Barley",
    "displayName": "Pearled Barley â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "barley",
      "pearled barley",
      "pearl barley",
      "dry barley",
      "uncooked barley"
    ],
    "tags": [
      "grain",
      "other-grain",
      "pearled-barley",
      "barley",
      "pearled",
      "dry"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 352,
      "protein": 9.91,
      "carbs": 77.72,
      "fat": 1.16,
      "fiber": 15.6,
      "sodium": 9,
      "potassium": 280,
      "saturatedFat": 0.244
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 100.0,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "pearled-barley",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Barley, pearled, raw",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy profile; exact FDC identifier intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Pearled barley contains gluten. Hulled barley is a distinct product and should not automatically reuse this profile when a stronger exact record is available."
    }
  },
  {
    "id": "grain-barley-pearled-cooked",
    "name": "Pearled Barley",
    "displayName": "Pearled Barley â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "barley",
      "pearled barley",
      "pearl barley",
      "cooked barley",
      "boiled barley"
    ],
    "tags": [
      "grain",
      "other-grain",
      "pearled-barley",
      "barley",
      "pearled",
      "cooked"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 123,
      "protein": 2.26,
      "carbs": 28.22,
      "fat": 0.44,
      "fiber": 3.8,
      "sodium": 3,
      "potassium": 93,
      "saturatedFat": 0.093
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 157,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 78.5,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "pearled-barley",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Barley, pearled, cooked",
        "release": "April 2018 (final)",
        "fdcId": 170285,
        "ndbNumber": "20006"
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-bulgur-dry",
    "name": "Bulgur",
    "displayName": "Bulgur â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "bulgur",
      "bulgur wheat",
      "cracked bulgur",
      "dry bulgur",
      "burghul",
      "burghul wheat"
    ],
    "tags": [
      "grain",
      "other-grain",
      "bulgur",
      "wheat",
      "bulgur",
      "parboiled",
      "dry"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 342,
      "protein": 12.29,
      "carbs": 75.87,
      "fat": 1.33,
      "fiber": 12.5,
      "sodium": 17,
      "potassium": 410,
      "saturatedFat": 0.232
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 70.0,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "bulgur",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bulgur, dry",
        "release": "April 2018 (final)",
        "fdcId": 170688
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
      "brandSpecific": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-bulgur-cooked",
    "name": "Bulgur",
    "displayName": "Bulgur â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "bulgur",
      "bulgur wheat",
      "cooked bulgur",
      "cooked bulgur wheat",
      "burghul cooked"
    ],
    "tags": [
      "grain",
      "other-grain",
      "bulgur",
      "wheat",
      "bulgur",
      "cooked"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 83,
      "protein": 3.08,
      "carbs": 18.58,
      "fat": 0.24,
      "fiber": 4.5,
      "sodium": 5,
      "potassium": 68,
      "saturatedFat": 0.035
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 182,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 91.0,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "bulgur",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Bulgur, cooked",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy profile cross-checked during authoring; exact FDC ID intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-couscous-dry",
    "name": "Couscous",
    "displayName": "Couscous â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "couscous",
      "dry couscous",
      "uncooked couscous",
      "semolina couscous"
    ],
    "tags": [
      "grain",
      "other-grain",
      "couscous",
      "wheat",
      "semolina",
      "couscous",
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
      "calories": 376,
      "protein": 12.76,
      "carbs": 77.43,
      "fat": 0.64,
      "fiber": 5.0,
      "sodium": 10,
      "potassium": 166,
      "saturatedFat": 0.117
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 86.5,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "couscous",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Couscous, dry",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy macro profile; exact FDC identifier intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Traditional couscous is a semolina wheat product and contains wheat/gluten. Pearl/Israeli couscous is a different pasta-like product and should not automatically reuse this record."
    }
  },
  {
    "id": "grain-couscous-cooked",
    "name": "Couscous",
    "displayName": "Couscous â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "couscous",
      "cooked couscous",
      "plain couscous",
      "semolina couscous cooked"
    ],
    "tags": [
      "grain",
      "other-grain",
      "couscous",
      "wheat",
      "semolina",
      "couscous",
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
      "calories": 112,
      "protein": 3.79,
      "carbs": 23.22,
      "fat": 0.16,
      "fiber": 1.4,
      "sodium": 5,
      "potassium": 58,
      "saturatedFat": 0.029
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 157,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 78.5,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "couscous",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Couscous, cooked",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy macro profile; exact FDC identifier intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [
        "wheat"
      ],
      "glutenFreeByNature": false,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-millet-raw",
    "name": "Millet",
    "displayName": "Millet â Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "millet",
      "dry millet",
      "uncooked millet",
      "whole grain millet"
    ],
    "tags": [
      "grain",
      "other-grain",
      "millet",
      "millet",
      "whole-grain",
      "dry"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 378,
      "protein": 11.02,
      "carbs": 72.85,
      "fat": 4.22,
      "fiber": 8.5,
      "sodium": 5,
      "potassium": 195,
      "saturatedFat": 0.723
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 100.0,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "millet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Millet, raw",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy macro profile. USDA also added Millet, whole grain as a Foundation Food in 2023 and corrected/expanded some micronutrient data in April 2026."
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-millet-cooked",
    "name": "Millet",
    "displayName": "Millet â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "millet",
      "cooked millet",
      "plain millet",
      "millet porridge water"
    ],
    "tags": [
      "grain",
      "other-grain",
      "millet",
      "millet",
      "cooked"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 119,
      "protein": 3.51,
      "carbs": 23.67,
      "fat": 1.0,
      "fiber": 1.3,
      "sodium": 2,
      "potassium": 62,
      "saturatedFat": 0.172
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 174,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 87.0,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "millet",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Millet, cooked",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy macro profile; exact FDC identifier intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": false,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-buckwheat-groats-roasted-dry",
    "name": "Buckwheat",
    "displayName": "Buckwheat Groats / Kasha â Roasted, Dry",
    "category": "grain",
    "state": "dry",
    "preparation": "roasted",
    "aliases": [
      "buckwheat",
      "buckwheat groats",
      "kasha",
      "roasted buckwheat",
      "dry kasha"
    ],
    "tags": [
      "grain",
      "other-grain",
      "buckwheat",
      "buckwheat",
      "kasha",
      "pseudograin",
      "roasted",
      "dry"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 346,
      "protein": 11.73,
      "carbs": 74.95,
      "fat": 2.71,
      "fiber": 10.3,
      "sodium": 11,
      "potassium": 320,
      "saturatedFat": 0.591
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 85.0,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "buckwheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Buckwheat groats, roasted, dry",
        "release": "April 2018 (final)",
        "fdcId": 170685,
        "ndbNumber": "20009"
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-buckwheat-groats-roasted-cooked",
    "name": "Buckwheat",
    "displayName": "Buckwheat Groats / Kasha â Roasted, Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "buckwheat",
      "buckwheat groats",
      "kasha",
      "cooked buckwheat",
      "cooked kasha"
    ],
    "tags": [
      "grain",
      "other-grain",
      "buckwheat",
      "buckwheat",
      "kasha",
      "pseudograin",
      "cooked"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 92,
      "protein": 3.38,
      "carbs": 19.94,
      "fat": 0.62,
      "fiber": 2.7,
      "sodium": 4,
      "potassium": 88,
      "saturatedFat": 0.134
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 168,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 84.0,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "buckwheat",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Buckwheat groats, roasted, cooked",
        "release": "April 2018 (final)",
        "fdcId": 170686,
        "ndbNumber": "20010"
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-amaranth-uncooked",
    "name": "Amaranth",
    "displayName": "Amaranth â Uncooked",
    "category": "grain",
    "state": "dry",
    "preparation": "dry",
    "aliases": [
      "amaranth",
      "amaranth grain",
      "dry amaranth",
      "uncooked amaranth"
    ],
    "tags": [
      "grain",
      "other-grain",
      "amaranth",
      "amaranth",
      "pseudograin",
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
      "calories": 371,
      "protein": 13.56,
      "carbs": 65.25,
      "fat": 7.02,
      "fiber": 6.7,
      "sodium": 4,
      "potassium": 508,
      "saturatedFat": 1.459
    },
    "servings": [
      {
        "id": "half-cup-dry",
        "label": "1/2 cup dry",
        "amount": 0.5,
        "unit": "cup",
        "grams": 96.5,
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
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "amaranth",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Amaranth grain, uncooked",
        "release": "April 2018 (final)",
        "sourceNote": "USDA SR Legacy profile cross-checked during authoring; exact FDC ID intentionally omitted rather than inferred."
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
    }
  },
  {
    "id": "grain-amaranth-cooked",
    "name": "Amaranth",
    "displayName": "Amaranth â Cooked",
    "category": "grain",
    "state": "cooked",
    "preparation": "cooked",
    "aliases": [
      "amaranth",
      "cooked amaranth",
      "amaranth porridge",
      "amaranth grain cooked"
    ],
    "tags": [
      "grain",
      "other-grain",
      "amaranth",
      "amaranth",
      "pseudograin",
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
      "calories": 102,
      "protein": 3.8,
      "carbs": 18.69,
      "fat": 1.58,
      "fiber": 2.1,
      "sodium": 6,
      "potassium": 135
    },
    "servings": [
      {
        "id": "cup-cooked",
        "label": "1 cup cooked",
        "amount": 1,
        "unit": "cup",
        "grams": 246,
        "isDefault": true
      },
      {
        "id": "half-cup-cooked",
        "label": "1/2 cup cooked",
        "amount": 0.5,
        "unit": "cup",
        "grams": 123.0,
        "isDefault": false
      },
      {
        "id": "100-g-cooked",
        "label": "100 g cooked",
        "amount": 100,
        "unit": "g",
        "grams": 100,
        "isDefault": false
      }
    ],
    "source": "AriFoodOtherGrains",
    "verified": true,
    "metadata": {
      "foodFamily": "other-grains",
      "grainType": "amaranth",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Amaranth grain, cooked",
        "release": "April 2018 (final)",
        "fdcId": 170683,
        "ndbNumber": "20002"
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
      "brandSpecific": false,
      "allergens": [],
      "glutenFreeByNature": true,
      "pseudograin": true,
      "notes": "Unbranded USDA reference profile. Dry and cooked weights are not interchangeable because hydration materially changes nutrient density per 100 g. Added oil, butter, salt, broth, sauce, sweetener, or other recipe ingredients are not included."
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

  // Clear stale records from this module during hot reload.
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
      ARI_OTHER_GRAIN_FOODS,
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
      foodCount: ARI_OTHER_GRAIN_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),

      groups: [
        "quinoa",
        "pearled-barley",
        "bulgur",
        "couscous",
        "millet",
        "buckwheat",
        "amaranth"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} other-grain record(s).`,
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

  global.AriFoodOtherGrains =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_OTHER_GRAIN_FOODS.length;
      },

      getFoodIds() {
        return ARI_OTHER_GRAIN_FOODS.map(
          food => food.id
        );
      },

      getGrainTypes() {
        return Array.from(
          new Set(
            ARI_OTHER_GRAIN_FOODS.map(
              food => food.metadata.grainType
            )
          )
        );
      },

      getDryRecords() {
        return ARI_OTHER_GRAIN_FOODS
          .filter(
            food =>
              food.state === "dry" ||
              food.state === "raw"
          )
          .map(clone);
      },

      getCookedRecords() {
        return ARI_OTHER_GRAIN_FOODS
          .filter(
            food =>
              food.state === "cooked"
          )
          .map(clone);
      },

      getPseudograinRecords() {
        return ARI_OTHER_GRAIN_FOODS
          .filter(
            food =>
              food.metadata?.pseudograin === true
          )
          .map(clone);
      },

      getGlutenFreeByNatureRecords() {
        return ARI_OTHER_GRAIN_FOODS
          .filter(
            food =>
              food.metadata?.glutenFreeByNature === true
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
          ARI_OTHER_GRAIN_FOODS.find(
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
        "ari:food-other-grains-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_OTHER_GRAIN_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OTHER_GRAIN_FOODS.length} source-traceable other-grain records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
