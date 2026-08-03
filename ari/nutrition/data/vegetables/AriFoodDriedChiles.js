// =====================================================
// ARI REBIRTH
// File: AriFoodDriedChiles.js
// Version: 1.0.0
//
// Purpose:
//   Offline dried Mexican chile reference data for
//   ARI Nutrition.
//
// Collection:
//   AriFoodVegetables
//
// Coverage:
//   - Ancho
//   - Guajillo
//   - Pasilla / Chile Negro
//   - Chile de Árbol
//   - Chipotle
//   - Morita
//   - Cascabel
//   - Puya
//   - California / Anaheim
//   - New Mexico
//   - Mulato
//
// Data-quality rule:
//   USDA provides an exact dried-ancho nutrient profile
//   and a strong generic "hot chile, sun-dried" profile.
//   ARI does NOT pretend every named dried chile has an
//   independently measured USDA macro profile.
//
//   Records using the generic profile are explicitly:
//     verified: false
//     varietySpecificNutritionVerified: false
//     nutritionSpecificity:
//       "generic-usda-sun-dried-hot-chile-proxy"
//
//   This preserves search/calculation coverage without
//   creating fake precision.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodVegetables controller
// =====================================================

(function initializeAriFoodDriedChiles(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodDriedChiles";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "exactNutritionRecords": [
    "vegetable-dried-chile-ancho"
  ],
  "proxyNutritionRecords": [
    "vegetable-dried-chile-guajillo",
    "vegetable-dried-chile-pasilla",
    "vegetable-dried-chile-de-arbol",
    "vegetable-dried-chile-chipotle",
    "vegetable-dried-chile-morita",
    "vegetable-dried-chile-cascabel",
    "vegetable-dried-chile-puya",
    "vegetable-dried-chile-california",
    "vegetable-dried-chile-new-mexico",
    "vegetable-dried-chile-mulato"
  ],
  "primaryHierarchy": [
    "USDA FoodData Central / SR Legacy exact variety profile when available",
    "USDA Peppers, hot chile, sun-dried (FDC 168570 / NDB 11962) as an explicitly labeled generic proxy",
    "Current retailer/manufacturer product pages for variety identity confirmation only"
  ],
  "rules": [
    "Never present generic dried-hot-chile proxy nutrition as variety-specific laboratory data.",
    "Exact variety records set varietySpecificNutritionVerified=true.",
    "Proxy records set verified=false and needsVarietySpecificNutritionRefresh=true.",
    "Do not merge pasilla with ancho; pasilla/chile negro is dried chilaca, while ancho is a different dried chile identity.",
    "Do not merge chipotle or morita with plain dried red chile because smoke treatment is part of their culinary identity.",
    "Do not include adobo sauce, oil, salt, seasoning blends, or chile powder mixtures.",
    "Use dry-weight nutrition; rehydrated chile weight must not be calculated as though it were still dry.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_DRIED_CHILE_FOODS =
    [
  {
    "id": "vegetable-dried-chile-ancho",
    "name": "Ancho Chile",
    "displayName": "Ancho Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "ancho",
      "ancho chile",
      "ancho chili",
      "dried ancho",
      "chile ancho",
      "dried poblano"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "ancho",
      "mild"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 281,
      "protein": 11.86,
      "carbs": 51.42,
      "fat": 8.2,
      "fiber": 21.6,
      "sodium": 43,
      "potassium": 2411,
      "saturatedFat": 0.82
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": true,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "ancho",
      "heatClass": "mild",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "variety-specific-usda",
      "varietySpecificNutritionVerified": true,
      "needsVarietySpecificNutritionRefresh": false,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "sourceDescription": "Peppers, ancho, dried",
        "referenceBasis": "100 g edible dried chile",
        "verifiedAt": "2026-08-03"
      },
      "identityProvenance": {
        "identityNote": "Ancho is a dried poblano-type chile. USDA provides an exact dried-ancho nutrient profile.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, ancho, dried"
          }
        ]
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
      "proxyNutrients": [],
      "offlineReference": true,
      "brandSpecific": false,
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-guajillo",
    "name": "Guajillo Chile",
    "displayName": "Guajillo Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "guajillo",
      "guajillo chile",
      "guajillo chili",
      "dried guajillo",
      "chile guajillo"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "guajillo",
      "mild-medium"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "guajillo",
      "heatClass": "mild-medium",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Guajillo is sold as a distinct dried chile and is the dried form of a Mirasol-type chile. Current retail labels confirm products containing only dried guajillo chile, but a robust variety-specific USDA macro profile was not used here.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Kroger Mercado",
            "description": "Guajillo Dried Chile — ingredient: dried guajillo chile"
          },
          {
            "provider": "El Guapo / McCormick",
            "description": "Whole Guajillo Chili Pods"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-pasilla",
    "name": "Pasilla Chile",
    "displayName": "Pasilla / Chile Negro — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "pasilla",
      "pasilla chile",
      "pasilla chili",
      "chile negro",
      "negro chile",
      "dried chilaca",
      "dried pasilla"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "pasilla",
      "mild-medium"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "pasilla",
      "heatClass": "mild-medium",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Pasilla (chile negro) is the dried form of the chilaca chile. It is not the same as ancho, although U.S. retail labeling sometimes confuses the names.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "H-E-B",
            "description": "Fresh Dried Pasilla Peppers — dried form of Chilaca"
          },
          {
            "provider": "Kroger Mercado",
            "description": "Pasilla Dried Chile — ingredient: dried pasilla chile"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-de-arbol",
    "name": "Chile de Árbol",
    "displayName": "Chile de Árbol — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "chile de arbol",
      "chile de árbol",
      "arbol chile",
      "árbol chile",
      "dried arbol",
      "dried chile de arbol"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "chile-de-arbol",
      "hot"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "chile-de-arbol",
      "heatClass": "hot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Chile de Árbol is a distinct small, bright-red dried chile. Retail products confirm single-ingredient dried Chile de Árbol, but the module uses USDA's generic sun-dried hot-chile nutrient profile until a strong variety-specific analytical source is available.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "El Guapo / McCormick",
            "description": "Whole Arbol Chili Pods — ingredient: chile pods"
          },
          {
            "provider": "Don Enrique",
            "description": "Dried Chile De Arbol"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-chipotle",
    "name": "Chipotle Chile",
    "displayName": "Chipotle Chile — Dried/Smoked",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "chipotle",
      "chipotle chile",
      "dried chipotle",
      "smoked jalapeno",
      "smoked jalapeño",
      "chipotle pepper"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "chipotle",
      "medium-hot"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "chipotle",
      "heatClass": "medium-hot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Chipotle is a dried, smoked jalapeño-style chile. Nutrition remains a generic dried-hot-chile proxy in this offline version.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Terra Dolce",
            "description": "Organic Chipotle Dried Chile Peppers — ingredient: organic chipotle chiles"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-morita",
    "name": "Morita Chile",
    "displayName": "Morita Chile — Dried/Smoked",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "morita",
      "morita chile",
      "chile morita",
      "dried morita",
      "smoked morita"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "morita",
      "medium-hot"
    ],
    "popularity": 92,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "morita",
      "heatClass": "medium-hot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Morita is a small smoked dried chile commonly grouped with chipotle-type dried jalapeños. No variety-specific USDA macro profile is asserted here.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Serious Eats",
            "description": "Guide to Mexican dried chiles — Morita listed as a distinct dried chile"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-cascabel",
    "name": "Cascabel Chile",
    "displayName": "Cascabel Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "cascabel",
      "cascabel chile",
      "chile cascabel",
      "dried cascabel",
      "rattle chile"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "cascabel",
      "mild-medium"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "cascabel",
      "heatClass": "mild-medium",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Cascabel is a distinct dried Mexican chile. Its variety identity is preserved while nutrition uses the generic USDA dried-hot-chile proxy.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Serious Eats",
            "description": "Guide to Mexican dried chiles — Cascabel listed as a distinct dried chile"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-puya",
    "name": "Puya Chile",
    "displayName": "Puya Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "puya",
      "puya chile",
      "chile puya",
      "dried puya"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "puya",
      "hot"
    ],
    "popularity": 87,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "puya",
      "heatClass": "hot",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Puya is a distinct dried Mexican chile. Nutrition uses the generic USDA sun-dried hot-chile profile pending a strong variety-specific source.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Serious Eats",
            "description": "Guide to Mexican dried chiles — Puya listed as a distinct dried chile"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-california",
    "name": "California Chile",
    "displayName": "California / Anaheim Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "California chile",
      "California chili",
      "dried Anaheim",
      "Anaheim chile dried",
      "California chile pod"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "california-anaheim",
      "mild"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "california-anaheim",
      "heatClass": "mild",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "California/Anaheim-style dried chile is kept as its own culinary identity. The nutrient profile is the generic USDA dried-hot-chile proxy.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Serious Eats",
            "description": "Guide to Mexican dried chiles — California chile listed as a distinct dried chile"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-new-mexico",
    "name": "New Mexico Chile",
    "displayName": "New Mexico Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "New Mexico chile",
      "New Mexican chile",
      "New Mexico red chile",
      "dried New Mexico chile",
      "New Mexico chile pod"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "new-mexico",
      "mild-medium"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "new-mexico",
      "heatClass": "mild-medium",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "New Mexico dried chile is maintained separately for search and recipe logging. Nutrition uses the USDA generic dried-hot-chile proxy rather than inventing cultivar-specific macros.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Los Chileros",
            "description": "Organic New Mexico Red Chile listed as a distinct dried chile product"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
    }
  },
  {
    "id": "vegetable-dried-chile-mulato",
    "name": "Mulato Chile",
    "displayName": "Mulato Chile — Dried",
    "category": "vegetable",
    "state": "dried",
    "preparation": "dried-whole",
    "aliases": [
      "mulato",
      "mulato chile",
      "chile mulato",
      "dried mulato"
    ],
    "tags": [
      "vegetable",
      "pepper",
      "dried-chile",
      "mexican-chile",
      "mulato",
      "mild"
    ],
    "popularity": 86,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 324,
      "protein": 10.58,
      "carbs": 69.86,
      "fat": 5.81,
      "fiber": 28.7,
      "sugar": 41.06,
      "sodium": 91,
      "potassium": 1870,
      "saturatedFat": 0.813
    },
    "servings": [
      {
        "id": "1-g",
        "label": "1 g",
        "amount": 1,
        "unit": "g",
        "grams": 1,
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
    "source": "AriFoodDriedChiles",
    "verified": false,
    "metadata": {
      "foodFamily": "dried-chile",
      "chileType": "mulato",
      "heatClass": "mild",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium",
      "referenceBasis": "100 g edible dried chile",
      "nutritionSpecificity": "generic-usda-sun-dried-hot-chile-proxy",
      "varietySpecificNutritionVerified": false,
      "needsVarietySpecificNutritionRefresh": true,
      "nutritionSourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central / SR Legacy",
        "fdcId": 168570,
        "ndbNumber": "11962",
        "sourceDescription": "Peppers, hot chile, sun-dried",
        "referenceBasis": "100 g edible dried hot chile",
        "verifiedAt": "2026-08-03",
        "proxyWarning": "This is a generic USDA sun-dried hot-chile nutrient profile, not a variety-specific laboratory analysis for this named chile."
      },
      "identityProvenance": {
        "identityNote": "Mulato is maintained as a distinct dried Mexican chile. Available branded data confirms the product identity, but ARI does not claim a variety-specific USDA macro profile.",
        "sources": [
          {
            "provider": "USDA FoodData Central / SR Legacy",
            "description": "Peppers, hot chile, sun-dried",
            "fdcId": 168570,
            "ndbNumber": "11962"
          },
          {
            "provider": "Los Chileros",
            "description": "Chile Mulato listed as a distinct dried chile product"
          }
        ]
      },
      "verifiedNutrients": [],
      "proxyNutrients": [
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
      "culinaryClassification": "vegetable",
      "notes": "Whole dried chile reference. Stems are not intended as edible food. Seeds may be removed depending on preparation. Toasting or rehydrating changes water content but does not automatically justify replacing this dry-weight reference. Prepared sauces, oils, adobos, powders with salt, and seasoning blends are separate foods."
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
      const existing = registry.getBySource(
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
      ARI_DRIED_CHILE_FOODS,
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
        ARI_DRIED_CHILE_FOODS.length,

      exactNutritionCount:
        ARI_DRIED_CHILE_FOODS.filter(
          food =>
            food.metadata.varietySpecificNutritionVerified === true
        ).length,

      proxyNutritionCount:
        ARI_DRIED_CHILE_FOODS.filter(
          food =>
            food.metadata.varietySpecificNutritionVerified !== true
        ).length,

      runtimeInternetRequired:
        false,

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (
    registration.rejected > 0
  ) {
    reportFailure(
      `Registration rejected ${registration.rejected} dried-chile record(s).`,
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

  global.AriFoodDriedChiles =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_DRIED_CHILE_FOODS.length;
      },

      getFoodIds() {
        return ARI_DRIED_CHILE_FOODS.map(
          food => food.id
        );
      },

      getChileTypes() {
        return ARI_DRIED_CHILE_FOODS.map(
          food => food.metadata.chileType
        );
      },

      getExactNutritionRecords() {
        return ARI_DRIED_CHILE_FOODS
          .filter(
            food =>
              food.metadata.varietySpecificNutritionVerified === true
          )
          .map(clone);
      },

      getProxyNutritionRecords() {
        return ARI_DRIED_CHILE_FOODS
          .filter(
            food =>
              food.metadata.varietySpecificNutritionVerified !== true
          )
          .map(clone);
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id = String(foodId || "").trim();

        const record =
          ARI_DRIED_CHILE_FOODS.find(
            food => food.id === id
          );

        return record
          ? clone(record)
          : null;
      },

      getRegistrationResult() {
        return clone(registration);
      },

      getIntegrationStatus() {
        return {
          vegetableControllerAvailable:
            Boolean(global.AriFoodVegetables),

          expectedByCurrentVegetableController:
            controllerExpectsThisModule(),

          exactNutritionRecords:
            moduleResult.metadata.exactNutritionCount,

          proxyNutritionRecords:
            moduleResult.metadata.proxyNutritionCount
        };
      }
    });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-dried-chiles-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_DRIED_CHILE_FOODS.length,
            exactNutritionCount:
              moduleResult.metadata.exactNutritionCount,
            proxyNutritionCount:
              moduleResult.metadata.proxyNutritionCount,
            runtimeInternetRequired: false,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_DRIED_CHILE_FOODS.length} dried chile records (${moduleResult.metadata.exactNutritionCount} exact nutrition, ${moduleResult.metadata.proxyNutritionCount} explicit USDA proxy references).`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
