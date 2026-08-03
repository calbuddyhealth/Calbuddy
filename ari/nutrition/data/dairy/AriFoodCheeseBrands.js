// =====================================================
// ARI REBIRTH
// File: AriFoodCheeseBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first packaged cheese database for ARI Nutrition.
//
// Collection:
//   AriFoodDairy
//
// Brands in V1:
//   - Tillamook
//   - Sargento
//   - Kraft Singles
//   - Kraft Deli Deluxe
//   - Philadelphia
//   - Babybel
//   - The Laughing Cow
//
// Coverage:
//   - Natural cheddar, white cheddar, mozzarella,
//     pepper jack, provolone, and string cheese
//   - Processed American / cheddar-style slices
//   - Cream cheese block + spread
//   - Snack cheese portions
//   - Spreadable cheese wedges
//
// Data policy:
//   - Official manufacturer label/page first.
//   - Exact package serving retained in metadata.
//   - Canonical nutrition normalized to 100 g.
//   - Natural and processed cheese remain distinct.
//   - No runtime internet connection required.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodDairy v1+
// =====================================================

(function initializeAriFoodCheeseBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCheeseBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "brand-first packaged cheese module",
  "brands": [
    "Babybel",
    "Kraft Deli Deluxe",
    "Kraft Singles",
    "Philadelphia",
    "Sargento",
    "The Laughing Cow",
    "Tillamook"
  ],
  "recordCount": 22,
  "cheeseClasses": [
    "cream-cheese",
    "cream-cheese-spread",
    "natural-cheese",
    "processed-cheese",
    "processed-cheese-product",
    "processed-spreadable-cheese"
  ],
  "sourceHierarchy": [
    "Official manufacturer product and nutrition pages"
  ],
  "rules": [
    "Preserve exact manufacturer serving mass and label values in metadata.labelNutrition.",
    "Normalize package-label nutrition mathematically to 100 g for ARI calculations.",
    "Keep natural cheese, processed cheese products, cream cheese, and spreadable cheese distinct.",
    "Do not treat Kraft Singles as generic cheddar or generic American cheese when the branded product is identified.",
    "Do not treat Philadelphia tub spread as identical to Philadelphia block cream cheese.",
    "Do not merge thin slices, regular slices, cracker cuts, snack portions, sticks, or wedges unless their exact label profile is identical and the architecture intentionally aliases them.",
    "Do not substitute AriFoodDairyCore when a matching branded cheese record exists.",
    "Mexican cheeses and additional Italian cheese brands can be added in AriFoodDairyBrands2 / AriFoodDairyBrands3 once complete label panels are verified.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CHEESE_BRAND_FOODS =
    [
  {
    "id": "dairy-brand-tillamook-medium-cheddar-slices",
    "name": "Medium Cheddar Slices",
    "displayName": "Tillamook Medium Cheddar Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook medium cheddar",
      "Tillamook cheddar slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cheddar",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 440.0,
      "protein": 24.0,
      "carbs": 4.0,
      "fat": 36.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 24.0,
      "sodium": 720.0,
      "cholesterol": 100.0,
      "potassium": 80.0,
      "calcium": 640.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (25 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 25,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cheddar",
      "cheeseClass": "natural-cheese",
      "productLine": "medium-cheddar-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (25 g)",
        "servingGrams": 25,
        "calories": 110,
        "protein": 6,
        "carbs": 1,
        "fat": 9,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 6,
        "sodium": 180,
        "cholesterol": 25,
        "potassium": 20,
        "calcium": 160
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/medium-cheddar-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Milk, Salt, Enzymes, Annatto (color).",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-tillamook-sharp-cheddar-slices",
    "name": "Sharp Cheddar Slices",
    "displayName": "Tillamook Sharp Cheddar Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook sharp cheddar",
      "Tillamook sharp cheddar slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cheddar",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 321.43,
      "protein": 17.857,
      "carbs": 3.571,
      "fat": 25.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 16.071,
      "sodium": 535.714,
      "cholesterol": 89.286,
      "potassium": 71.429,
      "calcium": 464.286
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (28 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 28,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cheddar",
      "cheeseClass": "natural-cheese",
      "productLine": "sharp-cheddar-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (28 g)",
        "servingGrams": 28,
        "calories": 90,
        "protein": 5,
        "carbs": 1,
        "fat": 7,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4.5,
        "sodium": 150,
        "cholesterol": 25,
        "potassium": 20,
        "calcium": 130
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/sharp-cheddar-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Milk, Salt, Enzymes, Annatto (color).",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-tillamook-extra-sharp-white-cheddar-slices",
    "name": "Extra Sharp White Cheddar Slices",
    "displayName": "Tillamook Extra Sharp White Cheddar Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook extra sharp white cheddar",
      "Tillamook white cheddar slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "white-cheddar",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 428.57,
      "protein": 21.429,
      "carbs": 3.571,
      "fat": 35.714,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 21.429,
      "sodium": 714.286,
      "cholesterol": 107.143,
      "potassium": 107.143,
      "calcium": 642.857
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (28 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 28,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "white-cheddar",
      "cheeseClass": "natural-cheese",
      "productLine": "extra-sharp-white-cheddar-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (28 g)",
        "servingGrams": 28,
        "calories": 120,
        "protein": 6,
        "carbs": 1,
        "fat": 10,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 6,
        "sodium": 200,
        "cholesterol": 30,
        "potassium": 30,
        "calcium": 180
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/extra-sharp-white-cheddar-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Milk, Salt, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-tillamook-pepper-jack-slices",
    "name": "Pepper Jack Slices",
    "displayName": "Tillamook Pepper Jack Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook pepper jack",
      "Tillamook pepper jack slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "pepper-jack",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 392.86,
      "protein": 21.429,
      "carbs": 3.571,
      "fat": 32.143,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 21.429,
      "sodium": 750.0,
      "cholesterol": 107.143,
      "potassium": 71.429,
      "calcium": 607.143
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (28 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 28,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "pepper-jack",
      "cheeseClass": "natural-cheese",
      "productLine": "pepper-jack-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (28 g)",
        "servingGrams": 28,
        "calories": 110,
        "protein": 6,
        "carbs": 1,
        "fat": 9,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 6,
        "sodium": 210,
        "cholesterol": 30,
        "potassium": 20,
        "calcium": 170
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/pepper-jack-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Cultured Pasteurized Milk, Jalapeno Peppers, Salt, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-tillamook-whole-milk-mozzarella-slices",
    "name": "Whole Milk Mozzarella Slices",
    "displayName": "Tillamook Whole Milk Mozzarella Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook mozzarella",
      "Tillamook mozzarella slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "mozzarella",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 320.0,
      "protein": 20.0,
      "carbs": 4.0,
      "fat": 24.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 16.0,
      "sodium": 720.0,
      "cholesterol": 80.0,
      "potassium": 80.0,
      "calcium": 560.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (25 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 25,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "mozzarella",
      "cheeseClass": "natural-cheese",
      "productLine": "whole-milk-mozzarella-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (25 g)",
        "servingGrams": 25,
        "calories": 80,
        "protein": 5,
        "carbs": 1,
        "fat": 6,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4,
        "sodium": 180,
        "cholesterol": 20,
        "potassium": 20,
        "calcium": 140
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/whole-milk-mozzarella-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Salt, Cheese Cultures, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-tillamook-hot-habanero-pepper-jack-slices",
    "name": "Hot Habanero Jack & Pepper Jack Slices",
    "displayName": "Tillamook Hot Habanero Jack & Pepper Jack Slices",
    "brand": "Tillamook",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Tillamook habanero jack",
      "Tillamook hot pepper jack"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "pepper-jack",
      "natural-cheese",
      "tillamook"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380.95,
      "protein": 19.048,
      "carbs": 4.762,
      "fat": 33.333,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 21.429,
      "sodium": 761.905,
      "cholesterol": 95.238,
      "potassium": 95.238,
      "calcium": 619.048
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (21 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 21,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "pepper-jack",
      "cheeseClass": "natural-cheese",
      "productLine": "hot-habanero-pepper-jack-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (21 g)",
        "servingGrams": 21,
        "calories": 80,
        "protein": 4,
        "carbs": 1,
        "fat": 7,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4.5,
        "sodium": 160,
        "cholesterol": 20,
        "potassium": 20,
        "calcium": 130
      },
      "sourceProvenance": {
        "provider": "Tillamook",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.tillamook.com/products/cheese/hot-habanero-jack-and-pepper-jack-sliced",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Hot Habanero Jack (Cultured Pasteurized Milk, Habanero Peppers, Jalapeno Peppers, Salt, Enzymes), Pepper Jack (Cultured Pasteurized Milk, Jalapeno Peppers, Salt, Enzymes).",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-sharp-cheddar-slices",
    "name": "Sharp Cheddar Natural Cheese Slices",
    "displayName": "Sargento Sharp Cheddar Natural Cheese Slices",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento sharp cheddar",
      "Sargento cheddar slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cheddar",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 400.0,
      "protein": 25.0,
      "carbs": 0.0,
      "fat": 35.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 20.0,
      "sodium": 650.0,
      "cholesterol": 100.0,
      "potassium": 75.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (20 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 20,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cheddar",
      "cheeseClass": "natural-cheese",
      "productLine": "sharp-cheddar-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (20 g)",
        "servingGrams": 20,
        "calories": 80,
        "protein": 5,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4,
        "sodium": 130,
        "cholesterol": 20,
        "potassium": 15
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-sharp-natural-cheddar-cheese",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Cheese Culture, Salt, Enzymes, Annatto (Vegetable Color).",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-mild-cheddar-slices",
    "name": "Mild Cheddar Natural Cheese Slices",
    "displayName": "Sargento Mild Cheddar Natural Cheese Slices",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento mild cheddar",
      "Sargento mild cheddar slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cheddar",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380.95,
      "protein": 23.81,
      "carbs": 0.0,
      "fat": 33.333,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 21.429,
      "sodium": 666.667,
      "cholesterol": 95.238,
      "potassium": 95.238
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (21 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 21,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cheddar",
      "cheeseClass": "natural-cheese",
      "productLine": "mild-cheddar-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (21 g)",
        "servingGrams": 21,
        "calories": 80,
        "protein": 5,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4.5,
        "sodium": 140,
        "cholesterol": 20,
        "potassium": 20
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-mild-natural-cheddar-cheese",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-mozzarella-slices",
    "name": "Mozzarella Natural Cheese Slices",
    "displayName": "Sargento Mozzarella Natural Cheese Slices",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento mozzarella",
      "Sargento mozzarella slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "mozzarella",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 285.71,
      "protein": 23.81,
      "carbs": 4.762,
      "fat": 19.048,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 11.905,
      "sodium": 666.667,
      "cholesterol": 47.619,
      "potassium": 190.476
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (21 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 21,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "mozzarella",
      "cheeseClass": "natural-cheese",
      "productLine": "mozzarella-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (21 g)",
        "servingGrams": 21,
        "calories": 60,
        "protein": 5,
        "carbs": 1,
        "fat": 4,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 2.5,
        "sodium": 140,
        "cholesterol": 10,
        "potassium": 40
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-mozzarella-natural-cheese",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Cheese Culture, Salt, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-pepper-jack-slices",
    "name": "Pepper Jack Natural Cheese Slices",
    "displayName": "Sargento Pepper Jack Natural Cheese Slices",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento pepper jack",
      "Sargento pepper jack slices"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "pepper-jack",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 380.95,
      "protein": 23.81,
      "carbs": 0.0,
      "fat": 33.333,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 19.048,
      "sodium": 666.667,
      "cholesterol": 95.238,
      "potassium": 95.238
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (21 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 21,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "pepper-jack",
      "cheeseClass": "natural-cheese",
      "productLine": "pepper-jack-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (21 g)",
        "servingGrams": 21,
        "calories": 80,
        "protein": 5,
        "carbs": 0,
        "fat": 7,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 4,
        "sodium": 140,
        "cholesterol": 20,
        "potassium": 20
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-pepper-jack-natural-cheese-10-slices",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Jalapeno Peppers, Cheese Culture, Salt, Habanero Peppers, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-provolone-smoke-slices",
    "name": "Provolone with Natural Smoke Flavor Slices",
    "displayName": "Sargento Provolone with Natural Smoke Flavor Slices",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento provolone",
      "Sargento smoked provolone"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "provolone",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 368.42,
      "protein": 26.316,
      "carbs": 0.0,
      "fat": 26.316,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 15.789,
      "sodium": 710.526,
      "cholesterol": 78.947,
      "potassium": 131.579
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (19 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "provolone",
      "cheeseClass": "natural-cheese",
      "productLine": "provolone-smoke-sliced",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (19 g)",
        "servingGrams": 19,
        "calories": 70,
        "protein": 5,
        "carbs": 0,
        "fat": 5,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 135,
        "cholesterol": 15,
        "potassium": 25
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/sliced-cheese/sargento-sliced-provolone-natural-cheese-with-natural-smoke-flavor",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Cheese Culture, Salt, Enzymes, Natural Smoke Flavor.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-sargento-mozzarella-string-cheese",
    "name": "Low Moisture Part-Skim Mozzarella String Cheese",
    "displayName": "Sargento Low Moisture Part-Skim Mozzarella String Cheese",
    "brand": "Sargento",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Sargento string cheese",
      "Sargento mozzarella stick",
      "Sargento cheese stick"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "mozzarella",
      "natural-cheese",
      "sargento"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 321.43,
      "protein": 25.0,
      "carbs": 3.571,
      "fat": 21.429,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 10.714,
      "sodium": 678.571,
      "cholesterol": 53.571,
      "potassium": 196.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 piece (28 g)",
        "amount": 1,
        "unit": "piece",
        "grams": 28,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "mozzarella",
      "cheeseClass": "natural-cheese",
      "productLine": "mozzarella-string-cheese",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 piece (28 g)",
        "servingGrams": 28,
        "calories": 90,
        "protein": 7,
        "carbs": 1,
        "fat": 6,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 3,
        "sodium": 190,
        "cholesterol": 15,
        "potassium": 55
      },
      "sourceProvenance": {
        "provider": "Sargento",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.sargento.com/our-cheese/snack-cheese/sargento-low-moisture-part-skim-mozzarella-natural-cheese-string-cheese-snacks",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk, Cheese Culture, Salt, Enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-kraft-singles-american",
    "name": "American Cheese Slices",
    "displayName": "Kraft Singles American Cheese Slices",
    "brand": "Kraft Singles",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kraft Singles",
      "Kraft American cheese",
      "Kraft American slice"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "american",
      "processed-cheese-product",
      "kraft-singles"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 238.1,
      "protein": 19.048,
      "carbs": 9.524,
      "fat": 16.667,
      "fiber": 0.0,
      "sugar": 9.524,
      "addedSugar": 0.0,
      "saturatedFat": 9.524,
      "sodium": 1095.238,
      "cholesterol": 71.429,
      "potassium": 285.714,
      "calcium": 1571.429
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (21 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 21,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "american",
      "cheeseClass": "processed-cheese-product",
      "productLine": "american-singles",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (21 g)",
        "servingGrams": 21,
        "calories": 50,
        "protein": 4,
        "carbs": 2,
        "fat": 3.5,
        "fiber": 0,
        "sugar": 2,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 230,
        "cholesterol": 15,
        "potassium": 60,
        "calcium": 330
      },
      "sourceProvenance": {
        "provider": "Kraft Singles",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/kraft-singles/products/00021000604647-american-cheese-slices",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-kraft-singles-white-american",
    "name": "White American Cheese Slices",
    "displayName": "Kraft Singles White American Cheese Slices",
    "brand": "Kraft Singles",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kraft White American",
      "Kraft white singles"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "american",
      "processed-cheese-product",
      "kraft-singles"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 263.16,
      "protein": 15.789,
      "carbs": 10.526,
      "fat": 15.789,
      "fiber": 0.0,
      "sugar": 5.263,
      "addedSugar": 0.0,
      "saturatedFat": 10.526,
      "sodium": 1105.263,
      "cholesterol": 78.947,
      "potassium": 315.789,
      "calcium": 1526.316
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (19 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "american",
      "cheeseClass": "processed-cheese-product",
      "productLine": "white-american-singles",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (19 g)",
        "servingGrams": 19,
        "calories": 50,
        "protein": 3,
        "carbs": 2,
        "fat": 3,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 210,
        "cholesterol": 15,
        "potassium": 60,
        "calcium": 290
      },
      "sourceProvenance": {
        "provider": "Kraft Singles",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/kraft-singles/products/00021000615827-white-american-cheese-slices",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-kraft-singles-sharp-cheddar",
    "name": "Sharp Cheddar Cheese Slices",
    "displayName": "Kraft Singles Sharp Cheddar Cheese Slices",
    "brand": "Kraft Singles",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kraft sharp cheddar singles",
      "Kraft sharp cheddar slice"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cheddar",
      "processed-cheese-product",
      "kraft-singles"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 315.79,
      "protein": 15.789,
      "carbs": 10.526,
      "fat": 18.421,
      "fiber": 0.0,
      "sugar": 5.263,
      "addedSugar": 0.0,
      "saturatedFat": 10.526,
      "sodium": 1157.895,
      "cholesterol": 78.947,
      "potassium": 210.526,
      "calcium": 1473.684
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (19 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cheddar",
      "cheeseClass": "processed-cheese-product",
      "productLine": "sharp-cheddar-singles",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (19 g)",
        "servingGrams": 19,
        "calories": 60,
        "protein": 3,
        "carbs": 2,
        "fat": 3.5,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 220,
        "cholesterol": 15,
        "potassium": 40,
        "calcium": 280
      },
      "sourceProvenance": {
        "provider": "Kraft Singles",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/kraft-singles/products/00021000083381-singles-sharp-cheddar-cheese-slices",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-kraft-deli-deluxe-american",
    "name": "American Cheese Slices",
    "displayName": "Kraft Deli Deluxe American Cheese Slices",
    "brand": "Kraft Deli Deluxe",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Kraft Deli Deluxe",
      "Kraft Deli Deluxe American"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "american",
      "processed-cheese",
      "kraft-deli-deluxe"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 368.42,
      "protein": 15.789,
      "carbs": 5.263,
      "fat": 31.579,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 18.421,
      "sodium": 1578.947,
      "cholesterol": 105.263,
      "potassium": 105.263,
      "calcium": 1473.684
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 slice (19 g)",
        "amount": 1,
        "unit": "slice",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "american",
      "cheeseClass": "processed-cheese",
      "productLine": "deli-deluxe-american",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 slice (19 g)",
        "servingGrams": 19,
        "calories": 70,
        "protein": 3,
        "carbs": 1,
        "fat": 6,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 3.5,
        "sodium": 300,
        "cholesterol": 20,
        "potassium": 20,
        "calcium": 280
      },
      "sourceProvenance": {
        "provider": "Kraft Deli Deluxe",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/kraft-deli-deluxe/products/00021000602513-deli-deluxe-american-cheese-slices",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-philadelphia-original-cream-cheese-block",
    "name": "Original Cream Cheese",
    "displayName": "Philadelphia Original Cream Cheese",
    "brand": "Philadelphia",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Philadelphia cream cheese",
      "Philly cream cheese",
      "Philadelphia original block"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cream-cheese",
      "cream-cheese",
      "philadelphia"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 357.14,
      "protein": 7.143,
      "carbs": 3.571,
      "fat": 35.714,
      "fiber": 0.0,
      "sugar": 3.571,
      "addedSugar": 0.0,
      "saturatedFat": 21.429,
      "sodium": 392.857,
      "cholesterol": 107.143,
      "potassium": 0.0,
      "calcium": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 oz (28 g)",
        "amount": 1,
        "unit": "oz",
        "grams": 28,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cream-cheese",
      "cheeseClass": "cream-cheese",
      "productLine": "original-block",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 100,
        "protein": 2,
        "carbs": 1,
        "fat": 10,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 6,
        "sodium": 110,
        "cholesterol": 30,
        "potassium": 0,
        "calcium": 0
      },
      "sourceProvenance": {
        "provider": "Philadelphia",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/philadelphia/products/00021000040247-original-cream-cheese",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk and Cream, Salt, Carob Bean Gum, Cheese Culture.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-philadelphia-original-cream-cheese-spread",
    "name": "Original Cream Cheese Spread",
    "displayName": "Philadelphia Original Cream Cheese Spread",
    "brand": "Philadelphia",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Philadelphia cream cheese spread",
      "Philly cream cheese tub",
      "Philadelphia original spread"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "cream-cheese",
      "cream-cheese-spread",
      "philadelphia"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 258.06,
      "protein": 6.452,
      "carbs": 6.452,
      "fat": 22.581,
      "fiber": 0.0,
      "sugar": 3.226,
      "addedSugar": 0.0,
      "saturatedFat": 14.516,
      "sodium": 403.226,
      "cholesterol": 64.516,
      "calcium": 96.774
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 Tbsp (31 g)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 31,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "cream-cheese",
      "cheeseClass": "cream-cheese-spread",
      "productLine": "original-spread",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "2 Tbsp (31 g)",
        "servingGrams": 31,
        "calories": 80,
        "protein": 2,
        "carbs": 2,
        "fat": 7,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 4.5,
        "sodium": 125,
        "cholesterol": 20,
        "calcium": 30
      },
      "sourceProvenance": {
        "provider": "Philadelphia",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.kraftheinz.com/philadelphia/products/00021000000142-original-cream-cheese-spread",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized Milk and Cream, Salt, Guar Gum, Natamycin, Cheese Culture.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-babybel-original",
    "name": "Original Cheese",
    "displayName": "Babybel Original Cheese",
    "brand": "Babybel",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Babybel Original",
      "Mini Babybel",
      "Babybel red"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "snack-cheese",
      "natural-cheese",
      "babybel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 350.0,
      "protein": 20.0,
      "carbs": 0.0,
      "fat": 25.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 17.5,
      "sodium": 750.0,
      "cholesterol": 75.0,
      "potassium": 50.0,
      "calcium": 700.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 piece (20 g)",
        "amount": 1,
        "unit": "piece",
        "grams": 20,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "snack-cheese",
      "cheeseClass": "natural-cheese",
      "productLine": "original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 piece (20 g)",
        "servingGrams": 20,
        "calories": 70,
        "protein": 4,
        "carbs": 0,
        "fat": 5,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 3.5,
        "sodium": 150,
        "cholesterol": 15,
        "potassium": 10,
        "calcium": 140
      },
      "sourceProvenance": {
        "provider": "Babybel",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://babybel.com/product/babybel-original-cheese/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized cultured milk, salt, microbial enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-babybel-reduced-fat",
    "name": "Reduced Fat Cheese",
    "displayName": "Babybel Reduced Fat Cheese",
    "brand": "Babybel",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Babybel Light",
      "Babybel reduced fat",
      "Mini Babybel light"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "snack-cheese",
      "natural-cheese",
      "babybel"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 25.0,
      "carbs": 0.0,
      "fat": 15.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "addedSugar": 0.0,
      "saturatedFat": 10.0,
      "sodium": 750.0,
      "cholesterol": 50.0,
      "potassium": 50.0,
      "calcium": 700.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 piece (20 g)",
        "amount": 1,
        "unit": "piece",
        "grams": 20,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "snack-cheese",
      "cheeseClass": "natural-cheese",
      "productLine": "reduced-fat",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 piece (20 g)",
        "servingGrams": 20,
        "calories": 50,
        "protein": 5,
        "carbs": 0,
        "fat": 3,
        "fiber": 0,
        "sugar": 0,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 150,
        "cholesterol": 10,
        "potassium": 10,
        "calcium": 140
      },
      "sourceProvenance": {
        "provider": "Babybel",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://babybel.com/product/babybel-light-cheese/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": "Pasteurized cultured part-skim milk, salt, microbial enzymes.",
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-laughing-cow-creamy-original",
    "name": "Creamy Original Spreadable Cheese Wedge",
    "displayName": "The Laughing Cow Creamy Original Spreadable Cheese Wedge",
    "brand": "The Laughing Cow",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Laughing Cow Original",
      "Laughing Cow wedge",
      "Laughing Cow creamy original"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "spreadable-cheese",
      "processed-spreadable-cheese",
      "the-laughing-cow"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 236.84,
      "protein": 10.526,
      "carbs": 5.263,
      "fat": 18.421,
      "fiber": 0.0,
      "sugar": 5.263,
      "addedSugar": 0.0,
      "saturatedFat": 10.526,
      "sodium": 842.105,
      "cholesterol": 52.632,
      "potassium": 157.895,
      "calcium": 684.211
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 wedge (19 g)",
        "amount": 1,
        "unit": "wedge",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "spreadable-cheese",
      "cheeseClass": "processed-spreadable-cheese",
      "productLine": "creamy-original",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 wedge (19 g)",
        "servingGrams": 19,
        "calories": 45,
        "protein": 2,
        "carbs": 1,
        "fat": 3.5,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 2,
        "sodium": 160,
        "cholesterol": 10,
        "potassium": 30,
        "calcium": 130
      },
      "sourceProvenance": {
        "provider": "The Laughing Cow",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.thelaughingcow.com/product/creamy-original-wedges/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
    }
  },
  {
    "id": "dairy-brand-laughing-cow-creamy-light",
    "name": "Creamy Light Spreadable Cheese Wedge",
    "displayName": "The Laughing Cow Creamy Light Spreadable Cheese Wedge",
    "brand": "The Laughing Cow",
    "category": "dairy",
    "state": "ready-to-eat",
    "preparation": "packaged",
    "aliases": [
      "Laughing Cow Light",
      "Laughing Cow light wedge",
      "Laughing Cow creamy light"
    ],
    "tags": [
      "dairy",
      "cheese",
      "branded",
      "spreadable-cheese",
      "processed-spreadable-cheese",
      "the-laughing-cow"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 131.58,
      "protein": 10.526,
      "carbs": 5.263,
      "fat": 7.895,
      "fiber": 0.0,
      "sugar": 5.263,
      "addedSugar": 0.0,
      "saturatedFat": 5.263,
      "sodium": 842.105,
      "cholesterol": 26.316,
      "potassium": 157.895,
      "calcium": 736.842
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 wedge (19 g)",
        "amount": 1,
        "unit": "wedge",
        "grams": 19,
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
    "source": "AriFoodCheeseBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "dairy",
      "dairyType": "cheese",
      "cheeseStyle": "spreadable-cheese",
      "cheeseClass": "processed-spreadable-cheese",
      "productLine": "creamy-light",
      "brandSpecific": true,
      "labelVerified": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g normalized from manufacturer package label",
      "labelNutrition": {
        "servingSize": "1 wedge (19 g)",
        "servingGrams": 19,
        "calories": 25,
        "protein": 2,
        "carbs": 1,
        "fat": 1.5,
        "fiber": 0,
        "sugar": 1,
        "addedSugar": 0,
        "saturatedFat": 1,
        "sodium": 160,
        "cholesterol": 5,
        "potassium": 30,
        "calcium": 140
      },
      "sourceProvenance": {
        "provider": "The Laughing Cow",
        "sourceType": "official manufacturer product page",
        "sourceUrl": "https://www.thelaughingcow.com/product/creamy-light-wedges/",
        "verifiedAt": "2026-08-03"
      },
      "ingredients": null,
      "offlineReference": true,
      "normalizationMethod": "Exact manufacturer package-label nutrition divided by label serving mass and normalized mathematically to ARI's canonical 100 g basis."
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
    if (!global.AriFoodDairy) {
      return false;
    }

    if (
      typeof global.AriFoodDairy.isExpectedModule === "function"
    ) {
      try {
        return global.AriFoodDairy.isExpectedModule(
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
      global.AriFoodDairy &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodDairy.markModuleFailed === "function"
    ) {
      global.AriFoodDairy.markModuleFailed(
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
      ARI_CHEESE_BRAND_FOODS,
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
        ARI_CHEESE_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_CHEESE_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

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
      `Registration rejected ${registration.rejected} cheese-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodDairy &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodDairy.markModuleLoaded === "function"
  ) {
    global.AriFoodDairy.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodCheeseBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CHEESE_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_CHEESE_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_CHEESE_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getCheeseClasses() {
        return Array.from(
          new Set(
            ARI_CHEESE_BRAND_FOODS.map(
              food =>
                food.metadata.cheeseClass
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_CHEESE_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getByCheeseClass(cheeseClass) {
        const normalized =
          String(cheeseClass || "")
            .trim()
            .toLowerCase();

        return ARI_CHEESE_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.cheeseClass || ""
              ).toLowerCase() === normalized
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
          ARI_CHEESE_BRAND_FOODS.find(
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
        "ari:food-cheese-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_CHEESE_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CHEESE_BRAND_FOODS.length} manufacturer-label cheese records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);