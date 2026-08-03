// =====================================================
// ARI REBIRTH
// File: AriFoodPeppers.js
// Version: 1.0.0
//
// Purpose:
//   Dedicated offline pepper reference data for
//   ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Green bell pepper
//   - Red bell pepper
//   - Yellow bell pepper
//   - Orange bell pepper
//   - Jalapeño
//   - Poblano
//   - Serrano
//   - Banana / Hungarian wax pepper
//   - Generic green hot chile pepper
//   - Generic red hot chile pepper
//
// Architecture note:
//   Green and red bell pepper currently exist in the
//   older AriFoodOtherVegetables.js file. Remove those
//   records from that module before loading both modules
//   together.
//
// Reliability:
//   - USDA Foundation Foods for current specific peppers.
//   - USDA SR Legacy for generic hot-chile references.
//   - Canonical basis: 100 g edible portion.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables controller
// =====================================================

(function initializeAriFoodPeppers(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodPeppers";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "categoryBoundary": {
    "ownedByThisModule": [
      "green bell pepper",
      "red bell pepper",
      "yellow bell pepper",
      "orange bell pepper",
      "jalapeno",
      "poblano",
      "serrano",
      "banana / Hungarian wax pepper",
      "generic green hot chile",
      "generic red hot chile"
    ],
    "mustBeRemovedFromOtherVegetables": [
      "vegetable-bell-pepper-green-raw",
      "vegetable-bell-pepper-red-raw"
    ]
  },
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current bell-pepper and specific hot-pepper analytical records",
    "USDA FoodData Central SR Legacy for stable generic hot-chile references"
  ],
  "rules": [
    "Store canonical nutrition per 100 g edible portion.",
    "Keep specific pepper cultivars separate when USDA provides specific analytical records.",
    "Do not invent habanero, cayenne, Anaheim, Hatch, Thai chile, or other cultivar-specific nutrition from a generic hot-chile record.",
    "Do not treat pickled peppers as equivalent to raw peppers.",
    "Do not include oil, cheese, breading, stuffing, salt, sauce, or pickling liquid.",
    "Use food-specific Atwater energy when USDA Foundation data supports it.",
    "The December 2025 jalapeno, poblano, serrano, and banana/Hungarian wax Foundation records are seeded edible-portion references.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_PEPPER_FOODS =
    [
  {
    "id": "vegetable-bell-pepper-green-raw",
    "name": "Green Bell Pepper",
    "displayName": "Green Bell Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green bell pepper",
      "green pepper",
      "bell pepper green",
      "raw green pepper",
      "green capsicum"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "bell-pepper",
      "green",
      "sweet",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 20,
      "protein": 0.71,
      "carbs": 4.78,
      "fat": 0.11,
      "fiber": 0.94,
      "sodium": 0,
      "potassium": 163
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "bell-pepper",
      "color": "green",
      "heatClass": "sweet",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, bell, green, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2258588
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-bell-pepper-red-raw",
    "name": "Red Bell Pepper",
    "displayName": "Red Bell Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red bell pepper",
      "red pepper",
      "bell pepper red",
      "raw red pepper",
      "red capsicum"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "bell-pepper",
      "red",
      "sweet",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 31,
      "protein": 0.9,
      "carbs": 6.65,
      "fat": 0.13,
      "fiber": 1.2,
      "sodium": 0,
      "potassium": 212.7
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "bell-pepper",
      "color": "red",
      "heatClass": "sweet",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, bell, red, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2258590
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-bell-pepper-yellow-raw",
    "name": "Yellow Bell Pepper",
    "displayName": "Yellow Bell Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "yellow bell pepper",
      "yellow pepper",
      "bell pepper yellow",
      "raw yellow pepper",
      "yellow capsicum"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "bell-pepper",
      "yellow",
      "sweet",
      "raw"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 26.6,
      "protein": 0.819,
      "carbs": 6.6,
      "fat": 0.121,
      "fiber": 1.07,
      "sodium": 0,
      "potassium": 197
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "bell-pepper",
      "color": "yellow",
      "heatClass": "sweet",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, bell, yellow, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2258589
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-bell-pepper-orange-raw",
    "name": "Orange Bell Pepper",
    "displayName": "Orange Bell Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "orange bell pepper",
      "orange pepper",
      "bell pepper orange",
      "raw orange pepper",
      "orange capsicum"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "bell-pepper",
      "orange",
      "sweet",
      "raw"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 27.4,
      "protein": 0.882,
      "carbs": 6.7,
      "fat": 0.156,
      "fiber": 0.967,
      "sodium": 0,
      "potassium": 201
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "bell-pepper",
      "color": "orange",
      "heatClass": "sweet",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, bell, orange, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2258591,
        "sourceNote": "Energy uses USDA's food-specific Atwater value of approximately 27.4 kcal per 100 g rather than the higher general-factor estimate."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-pepper-jalapeno-seeded-raw",
    "name": "Jalapeño Pepper",
    "displayName": "Jalapeño Pepper — Seeded, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "seeded-raw",
    "aliases": [
      "jalapeno",
      "jalapeño",
      "jalapeno pepper",
      "jalapeño pepper",
      "raw jalapeno",
      "raw jalapeño"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "jalapeno",
      "green",
      "medium-hot",
      "raw"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 24.1,
      "protein": 0.621,
      "carbs": 5.08,
      "fat": 0.149,
      "fiber": 1.72,
      "sodium": 0,
      "potassium": 167
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "jalapeno",
      "color": "green",
      "heatClass": "medium-hot",
      "seededReference": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, jalapeno, seeded, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2747661,
        "sourceNote": "Added to USDA Foundation Foods in December 2025. Energy uses the USDA Atwater general-factor value."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-pepper-poblano-seeded-raw",
    "name": "Poblano Pepper",
    "displayName": "Poblano Pepper — Seeded, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "seeded-raw",
    "aliases": [
      "poblano",
      "poblano pepper",
      "raw poblano",
      "fresh poblano"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "poblano",
      "green",
      "mild-hot",
      "raw"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 28.0,
      "protein": 1.43,
      "carbs": 5.14,
      "fat": 0.191,
      "fiber": 2.07,
      "sodium": 0,
      "potassium": 192
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "poblano",
      "color": "green",
      "heatClass": "mild-hot",
      "seededReference": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, poblano, seeded, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2747662,
        "sourceNote": "Added to USDA Foundation Foods in December 2025."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-pepper-serrano-seeded-raw",
    "name": "Serrano Pepper",
    "displayName": "Serrano Pepper — Seeded, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "seeded-raw",
    "aliases": [
      "serrano",
      "serrano pepper",
      "raw serrano",
      "fresh serrano"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "serrano",
      "green",
      "hot",
      "raw"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 29.2,
      "protein": 0.856,
      "carbs": 6.14,
      "fat": 0.141,
      "fiber": 2.52,
      "sodium": 0,
      "potassium": 224
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "serrano",
      "color": "green",
      "heatClass": "hot",
      "seededReference": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, serrano, seeded, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2747663,
        "sourceNote": "Added to USDA Foundation Foods in December 2025."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-pepper-banana-hungarian-wax-seeded-raw",
    "name": "Banana Pepper",
    "displayName": "Banana / Hungarian Wax Pepper — Seeded, Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "seeded-raw",
    "aliases": [
      "banana pepper",
      "banana peppers",
      "Hungarian wax pepper",
      "Hungarian wax peppers",
      "yellow wax pepper",
      "raw banana pepper"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "banana-hungarian-wax",
      "yellow-green",
      "mild",
      "raw"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 23.9,
      "protein": 0.723,
      "carbs": 4.97,
      "fat": 0.131,
      "fiber": 1.79,
      "sodium": 0,
      "potassium": 177
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "banana-hungarian-wax",
      "color": "yellow-green",
      "heatClass": "mild",
      "seededReference": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Peppers, banana or Hungarian wax, seeded, raw",
        "verifiedAt": "2026-08-03",
        "release": "Current through April 2026",
        "fdcId": 2747660,
        "sourceNote": "Added to USDA Foundation Foods in December 2025. USDA combines banana and Hungarian wax peppers in this analytical reference."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-hot-chili-pepper-green-raw",
    "name": "Green Hot Chile Pepper",
    "displayName": "Green Hot Chile Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "green chili pepper",
      "green chile pepper",
      "hot green pepper",
      "green hot chili",
      "green hot chile"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "hot-chili-green",
      "green",
      "hot",
      "raw"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 40,
      "protein": 2.0,
      "carbs": 9.46,
      "fat": 0.2,
      "fiber": 1.5,
      "sodium": 7,
      "potassium": 340
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "hot-chili-green",
      "color": "green",
      "heatClass": "hot",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Peppers, hot chili, green, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "sourceNote": "Generic hot green-chile reference. Specific cultivars such as jalapeño, poblano, and serrano should use their dedicated records when known."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
    }
  },
  {
    "id": "vegetable-hot-chili-pepper-red-raw",
    "name": "Red Hot Chile Pepper",
    "displayName": "Red Hot Chile Pepper — Raw",
    "category": "vegetable",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "red chili pepper",
      "red chile pepper",
      "hot red pepper",
      "red hot chili",
      "red hot chile"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "hot-chili-red",
      "red",
      "hot",
      "raw"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 40,
      "protein": 1.87,
      "carbs": 8.81,
      "fat": 0.44,
      "fiber": 1.5,
      "sodium": 9,
      "potassium": 322
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
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
    "source": "AriFoodPeppers",
    "verified": true,
    "metadata": {
      "foodFamily": "pepper",
      "pepperType": "hot-chili-red",
      "color": "red",
      "heatClass": "hot",
      "seededReference": null,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Peppers, hot chili, red, raw",
        "verifiedAt": "2026-08-03",
        "release": "April 2018 (final)",
        "sourceNote": "Generic raw red hot-chile reference. This record is not treated as an exact habanero, cayenne, Thai chile, or other specific cultivar."
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
      "culinaryClassification": "vegetable",
      "botanicalNote": "Botanically a fruit; stored in ARI's vegetable collection because this database follows culinary food logging.",
      "notes": "Plain raw pepper reference. Added oil, cheese, breading, sauce, salt, stuffing, pickling liquid, or other recipe ingredients are not included."
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
    if (!global.AriFoodVegetables) {
      return false;
    }

    if (
      typeof global.AriFoodVegetables.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodVegetables.isExpectedModule(
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
      global.AriFoodVegetables &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodVegetables.markModuleFailed === "function"
    ) {
      global.AriFoodVegetables.markModuleFailed(
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
      ARI_PEPPER_FOODS,
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
        ARI_PEPPER_FOODS.length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY),

      groups: [
        "bell-peppers",
        "jalapeno",
        "poblano",
        "serrano",
        "banana-hungarian-wax",
        "generic-hot-chiles"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} pepper record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodVegetables &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodVegetables.markModuleLoaded === "function"
  ) {
    global.AriFoodVegetables.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  } else if (
    global.AriFoodVegetables
  ) {
    console.warn(
      `[ARI Nutrition] ${MODULE_NAME} registered successfully, but the current AriFoodVegetables controller does not yet list ${MODULE_NAME} as an expected module.`
    );
  }

  global.AriFoodPeppers =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_PEPPER_FOODS.length;
      },

      getFoodIds() {
        return ARI_PEPPER_FOODS.map(
          food => food.id
        );
      },

      getPepperTypes() {
        return Array.from(
          new Set(
            ARI_PEPPER_FOODS.map(
              food =>
                food.metadata.pepperType
            )
          )
        );
      },

      getSweetPeppers() {
        return ARI_PEPPER_FOODS
          .filter(
            food =>
              food.metadata.heatClass === "sweet"
          )
          .map(clone);
      },

      getHotPeppers() {
        return ARI_PEPPER_FOODS
          .filter(
            food =>
              food.metadata.heatClass !== "sweet"
          )
          .map(clone);
      },

      getSourcePolicy() {
        return clone(
          SOURCE_POLICY
        );
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_PEPPER_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getRegistrationResult() {
        return clone(
          registration
        );
      },

      getIntegrationStatus() {
        return {
          vegetableControllerAvailable:
            Boolean(
              global.AriFoodVegetables
            ),

          expectedByCurrentVegetableController:
            controllerExpectsThisModule(),

          recordsThatMustMoveFromOtherVegetables: [
            "vegetable-bell-pepper-green-raw",
            "vegetable-bell-pepper-red-raw"
          ]
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-peppers-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_PEPPER_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_PEPPER_FOODS.length} source-traceable pepper records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
