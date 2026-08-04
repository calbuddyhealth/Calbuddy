// =====================================================
// ARI REBIRTH
// File: AriFoodNutBrands.js
// Version: 1.0.0
//
// Purpose:
//   Optional branded packaged-nut database for
//   ARI Nutrition's Nuts pathway.
//
// Collection:
//   AriFoodNuts
//
// V1 brands:
//   - Blue Diamond
//   - PLANTERS
//
// Coverage:
//   20 branded packaged nut products.
//
// Includes:
//   - Salted nuts
//   - Lightly salted nuts
//   - Oil-roasted nuts
//   - Honey-roasted nuts
//   - Flavored nuts
//   - Mixed nuts
//
// Excludes:
//   - Generic raw/dry-roasted nuts
//     -> AriFoodNutsCore
//   - Nut butters
//   - Nut crackers
//   - Nut bars / trail bars
//
// Canonical basis:
//   100 g.
//
// Default serving:
//   1 oz / 28 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodNuts v1+
// =====================================================

(function initializeAriFoodNutBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodNutBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "optional brand-first packaged-nut layer for the ARI Nuts pathway",
  "recordCount": 20,
  "brands": [
    "Blue Diamond",
    "PLANTERS"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "defaultServing": {
    "label": "1 oz (28 g)",
    "amount": 1,
    "unit": "oz",
    "grams": 28
  },
  "rules": [
    "Branded packaged products do not replace AriFoodNutsCore generic fallbacks.",
    "Preserve manufacturer label nutrition at the package serving size.",
    "Normalize packaged nutrition mathematically to 100 g for registry consistency.",
    "Salted, flavored, honey-roasted, smokehouse, oil-roasted, and mixed-nut products belong here rather than in NutsCore.",
    "Nut butters remain outside this module.",
    "Nut-based crackers and bars remain outside this module.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_NUT_BRAND_FOODS = Object.freeze(
[
  {
    "id": "nuts-brand-blue-diamond-whole-natural-almonds",
    "name": "Whole Natural Almonds",
    "displayName": "Blue Diamond Whole Natural Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "natural",
    "aliases": [
      "Blue Diamond Whole Natural Almonds",
      "Blue Diamond",
      "Whole Natural Almonds",
      "Blue Diamond Natural Almonds",
      "Blue Diamond Whole Natural"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "natural",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 21.429,
      "carbs": 21.429,
      "fat": 50.0,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 6,
        "carbs": 6,
        "fat": 14,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/produce/new-whole-natural/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-lightly-salted-almonds",
    "name": "Lightly Salted Almonds",
    "displayName": "Blue Diamond Lightly Salted Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "roasted-lightly-salted",
    "aliases": [
      "Blue Diamond Lightly Salted Almonds",
      "Blue Diamond",
      "Lightly Salted Almonds",
      "Blue Diamond Lightly Salted"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "roasted-lightly-salted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 57.143,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 142.857
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 16,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 40
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/classic-flavors/lightly-salted/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-roasted-salted-almonds",
    "name": "Roasted Salted Almonds",
    "displayName": "Blue Diamond Roasted Salted Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "roasted-salted",
    "aliases": [
      "Blue Diamond Roasted Salted Almonds",
      "Blue Diamond",
      "Roasted Salted Almonds",
      "Blue Diamond Roasted Salted"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "roasted-salted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 57.143,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 303.571
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 16,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 85
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/classic-flavors/roasted-salted/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-oven-roasted-honey-almonds",
    "name": "Oven Roasted Honey Almonds",
    "displayName": "Blue Diamond Oven Roasted Honey Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "honey-roasted",
    "aliases": [
      "Blue Diamond Oven Roasted Honey Almonds",
      "Blue Diamond",
      "Oven Roasted Honey Almonds",
      "Blue Diamond Honey Almonds",
      "Blue Diamond Honey Roasted Almonds"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "honey-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 17.857,
      "carbs": 28.571,
      "fat": 46.429,
      "fiber": 10.714,
      "sugar": 14.286,
      "sodiumMg": 107.143
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 5,
        "carbs": 8,
        "fat": 13,
        "fiber": 3,
        "sugar": 4,
        "sodiumMg": 30
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/produce/new-oven-roasted-honey/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-salt-vinegar-almonds",
    "name": "Salt 'n Vinegar Almonds",
    "displayName": "Blue Diamond Salt 'n Vinegar Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "flavored-roasted",
    "aliases": [
      "Blue Diamond Salt 'n Vinegar Almonds",
      "Blue Diamond",
      "Salt 'n Vinegar Almonds",
      "Blue Diamond Salt and Vinegar Almonds",
      "Blue Diamond Vinegar Almonds"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "flavored-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 53.571,
      "fiber": 10.714,
      "sugar": 7.143,
      "sodiumMg": 642.857
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 15,
        "fiber": 3,
        "sugar": 2,
        "sodiumMg": 180
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/flavor-forward/salt-n-vinegar/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-wasabi-soy-almonds",
    "name": "Wasabi & Soy Sauce Almonds",
    "displayName": "Blue Diamond Wasabi & Soy Sauce Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "flavored-roasted",
    "aliases": [
      "Blue Diamond Wasabi & Soy Sauce Almonds",
      "Blue Diamond",
      "Wasabi & Soy Sauce Almonds",
      "Blue Diamond Wasabi Almonds",
      "Blue Diamond Wasabi Soy Almonds"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "flavored-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 53.571,
      "fiber": 10.714,
      "sugar": 7.143,
      "sodiumMg": 428.571
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 15,
        "fiber": 3,
        "sugar": 2,
        "sodiumMg": 120
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/flavor-forward/wasabi-and-soy-sauce/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-habanero-bbq-almonds",
    "name": "Habanero BBQ Almonds",
    "displayName": "Blue Diamond Habanero BBQ Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "flavored-roasted",
    "aliases": [
      "Blue Diamond Habanero BBQ Almonds",
      "Blue Diamond",
      "Habanero BBQ Almonds",
      "Blue Diamond Habanero Almonds",
      "Blue Diamond BBQ Almonds"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "flavored-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 53.571,
      "fiber": 10.714,
      "sugar": 7.143,
      "sodiumMg": 357.143
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 15,
        "fiber": 3,
        "sugar": 2,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/flavor-forward/habanero-bbq/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-smokehouse-almonds",
    "name": "Smokehouse Almonds",
    "displayName": "Blue Diamond Smokehouse Almonds",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "smokehouse-roasted",
    "aliases": [
      "Blue Diamond Smokehouse Almonds",
      "Blue Diamond",
      "Smokehouse Almonds",
      "Blue Diamond Smokehouse"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "almond",
      "smokehouse-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 17.857,
      "fat": 57.143,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 535.714
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 5,
        "fat": 16,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 150
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/flavor-forward/almond-smokehouse/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-roasted-sea-salt-nut-mix",
    "name": "Roasted Sea Salt Nut Mix",
    "displayName": "Blue Diamond Roasted Sea Salt Nut Mix",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "roasted-salted",
    "aliases": [
      "Blue Diamond Roasted Sea Salt Nut Mix",
      "Blue Diamond",
      "Roasted Sea Salt Nut Mix",
      "Blue Diamond Sea Salt Nut Mix",
      "Blue Diamond Almond Cashew Pistachio Mix"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "mixed-nuts",
      "roasted-salted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 17.857,
      "carbs": 21.429,
      "fat": 53.571,
      "fiber": 7.143,
      "sugar": 3.571,
      "sodiumMg": 285.714
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "mixed-nuts",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 5,
        "carbs": 6,
        "fat": 15,
        "fiber": 2,
        "sugar": 1,
        "sodiumMg": 80
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/nut-mix/roasted-sea-salt-mix/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-blue-diamond-honey-roasted-nut-mix",
    "name": "Honey Roasted Nut Mix",
    "displayName": "Blue Diamond Honey Roasted Nut Mix",
    "brand": "Blue Diamond",
    "category": "nuts",
    "state": "solid",
    "preparation": "honey-roasted",
    "aliases": [
      "Blue Diamond Honey Roasted Nut Mix",
      "Blue Diamond",
      "Honey Roasted Nut Mix",
      "Blue Diamond Honey Nut Mix",
      "Blue Diamond Honey Roasted Mixed Nuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "mixed-nuts",
      "honey-roasted",
      "blue-diamond"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 17.857,
      "carbs": 32.143,
      "fat": 46.429,
      "fiber": 7.143,
      "sugar": 17.857,
      "sodiumMg": 214.286
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "mixed-nuts",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 5,
        "carbs": 9,
        "fat": 13,
        "fiber": 2,
        "sugar": 5,
        "sodiumMg": 60
      },
      "sourceProvenance": {
        "provider": "Blue Diamond",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.bluediamond.com/brand/blue-diamond/snack-almonds/nut-mix/honey-roasted-mix/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-unsalted-dry-roasted-peanuts",
    "name": "Unsalted Dry Roasted Peanuts",
    "displayName": "PLANTERS Unsalted Dry Roasted Peanuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "dry-roasted-unsalted",
    "aliases": [
      "PLANTERS Unsalted Dry Roasted Peanuts",
      "PLANTERS",
      "Unsalted Dry Roasted Peanuts",
      "Planters Unsalted Peanuts",
      "Planters Unsalted Dry Roasted"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "peanut",
      "dry-roasted-unsalted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 28.571,
      "carbs": 17.857,
      "fat": 50.0,
      "fiber": 7.143,
      "sugar": 3.571,
      "sodiumMg": 17.857
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 8,
        "carbs": 5,
        "fat": 14,
        "fiber": 2,
        "sugar": 1,
        "sodiumMg": 5
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/unsalted-dry-roasted-peanuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-sweet-spicy-dry-roasted-peanuts",
    "name": "Sweet & Spicy Dry Roasted Peanuts",
    "displayName": "PLANTERS Sweet & Spicy Dry Roasted Peanuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "sweet-spicy-dry-roasted",
    "aliases": [
      "PLANTERS Sweet & Spicy Dry Roasted Peanuts",
      "PLANTERS",
      "Sweet & Spicy Dry Roasted Peanuts",
      "Planters Sweet and Spicy Peanuts",
      "Planters Sweet Spicy Peanuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "peanut",
      "sweet-spicy-dry-roasted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 25.0,
      "carbs": 21.429,
      "fat": 46.429,
      "fiber": 7.143,
      "sugar": 10.714,
      "sodiumMg": 714.286
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 7,
        "carbs": 6,
        "fat": 13,
        "fiber": 2,
        "sugar": 3,
        "sodiumMg": 200
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/sweet-spicy-dry-roasted-peanuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-unsalted-mixed-nuts",
    "name": "Unsalted Mixed Nuts",
    "displayName": "PLANTERS Unsalted Mixed Nuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "oil-roasted-unsalted",
    "aliases": [
      "PLANTERS Unsalted Mixed Nuts",
      "PLANTERS",
      "Unsalted Mixed Nuts",
      "Planters Unsalted Mixed Nuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "mixed-nuts",
      "oil-roasted-unsalted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 21.429,
      "fat": 53.571,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "mixed-nuts",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 6,
        "fat": 15,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/unsalted-mixed-nuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-honey-roasted-mixed-nuts",
    "name": "Honey Roasted Mixed Nuts",
    "displayName": "PLANTERS Honey Roasted Mixed Nuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "honey-roasted",
    "aliases": [
      "PLANTERS Honey Roasted Mixed Nuts",
      "PLANTERS",
      "Honey Roasted Mixed Nuts",
      "Planters Honey Mixed Nuts",
      "Planters Honey Roasted Mix"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "mixed-nuts",
      "honey-roasted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 17.857,
      "carbs": 32.143,
      "fat": 42.857,
      "fiber": 7.143,
      "sugar": 17.857,
      "sodiumMg": 410.714
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "mixed-nuts",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 5,
        "carbs": 9,
        "fat": 12,
        "fiber": 2,
        "sugar": 5,
        "sodiumMg": 115
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/honey-roasted-mixed-nuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-honey-roasted-peanuts",
    "name": "Honey Roasted Peanuts",
    "displayName": "PLANTERS Honey Roasted Peanuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "honey-roasted",
    "aliases": [
      "PLANTERS Honey Roasted Peanuts",
      "PLANTERS",
      "Honey Roasted Peanuts",
      "Planters Honey Peanuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "peanut",
      "honey-roasted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 25.0,
      "carbs": 25.0,
      "fat": 46.429,
      "fiber": 7.143,
      "sugar": 14.286,
      "sodiumMg": 303.571
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 7,
        "carbs": 7,
        "fat": 13,
        "fiber": 2,
        "sugar": 4,
        "sodiumMg": 85
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/honey-roasted-peanuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-salt-vinegar-cashews",
    "name": "Salt and Vinegar Cashews",
    "displayName": "PLANTERS Salt and Vinegar Cashews",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "flavored-oil-roasted",
    "aliases": [
      "PLANTERS Salt and Vinegar Cashews",
      "PLANTERS",
      "Salt and Vinegar Cashews",
      "Planters Salt & Vinegar Cashews",
      "Planters Vinegar Cashews"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "cashew",
      "flavored-oil-roasted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 14.286,
      "carbs": 32.143,
      "fat": 46.429,
      "fiber": 3.571,
      "sugar": 7.143,
      "sodiumMg": 964.286
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "cashew",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 4,
        "carbs": 9,
        "fat": 13,
        "fiber": 1,
        "sugar": 2,
        "sodiumMg": 270
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/salt-and-vinegar-cashews/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-salted-cashew-halves-pieces",
    "name": "Salted Cashew Halves & Pieces",
    "displayName": "PLANTERS Salted Cashew Halves & Pieces",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "oil-roasted-salted",
    "aliases": [
      "PLANTERS Salted Cashew Halves & Pieces",
      "PLANTERS",
      "Salted Cashew Halves & Pieces",
      "Planters Salted Cashews",
      "Planters Cashew Halves Pieces"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "cashew",
      "oil-roasted-salted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 571.429,
      "protein": 17.857,
      "carbs": 32.143,
      "fat": 46.429,
      "fiber": 3.571,
      "sugar": 7.143,
      "sodiumMg": 357.143
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "cashew",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 160,
        "protein": 5,
        "carbs": 9,
        "fat": 13,
        "fiber": 1,
        "sugar": 2,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/salted-cashew-halves-and-pieces/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-deluxe-salted-whole-cashews",
    "name": "Deluxe Salted Whole Cashews",
    "displayName": "PLANTERS Deluxe Salted Whole Cashews",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "oil-roasted-salted",
    "aliases": [
      "PLANTERS Deluxe Salted Whole Cashews",
      "PLANTERS",
      "Deluxe Salted Whole Cashews",
      "Planters Deluxe Cashews",
      "Planters Whole Cashews"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "cashew",
      "oil-roasted-salted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 17.857,
      "carbs": 32.143,
      "fat": 46.429,
      "fiber": 3.571,
      "sugar": 7.143,
      "sodiumMg": 357.143
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "cashew",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 5,
        "carbs": 9,
        "fat": 13,
        "fiber": 1,
        "sugar": 2,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/deluxe-salted-whole-cashews/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-salted-cocktail-peanuts",
    "name": "Salted Cocktail Peanuts",
    "displayName": "PLANTERS Salted Cocktail Peanuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "oil-roasted-salted",
    "aliases": [
      "PLANTERS Salted Cocktail Peanuts",
      "PLANTERS",
      "Salted Cocktail Peanuts",
      "Planters Cocktail Peanuts",
      "Planters Salted Peanuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "peanut",
      "oil-roasted-salted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 25.0,
      "carbs": 17.857,
      "fat": 50.0,
      "fiber": 7.143,
      "sugar": 3.571,
      "sodiumMg": 357.143
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 7,
        "carbs": 5,
        "fat": 14,
        "fiber": 2,
        "sugar": 1,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/salted-cocktail-peanuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  },
  {
    "id": "nuts-brand-planters-salted-mixed-nuts",
    "name": "Salted Mixed Nuts",
    "displayName": "PLANTERS Salted Mixed Nuts",
    "brand": "PLANTERS",
    "category": "nuts",
    "state": "solid",
    "preparation": "oil-roasted-salted",
    "aliases": [
      "PLANTERS Salted Mixed Nuts",
      "PLANTERS",
      "Salted Mixed Nuts",
      "Planters Mixed Nuts",
      "Planters Salted Mixed Nuts with Brazil Nuts"
    ],
    "tags": [
      "nuts",
      "branded",
      "packaged",
      "mixed-nuts",
      "oil-roasted-salted",
      "planters"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 607.143,
      "protein": 21.429,
      "carbs": 21.429,
      "fat": 53.571,
      "fiber": 10.714,
      "sugar": 3.571,
      "sodiumMg": 321.429
    },
    "servings": [
      {
        "id": "1-oz",
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
    "source": "AriFoodNutBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "mixed-nuts",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 oz (28 g)",
        "servingGrams": 28,
        "calories": 170,
        "protein": 6,
        "carbs": 6,
        "fat": 15,
        "fiber": 3,
        "sugar": 1,
        "sodiumMg": 90
      },
      "sourceProvenance": {
        "provider": "PLANTERS",
        "sourceType": "official manufacturer current product nutrition page",
        "sourceUrl": "https://www.planters.com/product/salted-mixed-nuts/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer 28 g serving nutrition was normalized mathematically to the ARI Nuts canonical basis of 100 g.",
      "notes": "Branded packaged nut product. Keep separate from AriFoodNutsCore generic raw/dry-roasted fallback records."
    }
  }
]
  );

  function clone(value) {
    try {
      return typeof structuredClone === "function"
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function controllerKnowsThisModule() {
    if (!global.AriFoodNuts) {
      return false;
    }

    if (
      typeof global.AriFoodNuts.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodNuts.isKnownModule(
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
      global.AriFoodNuts &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodNuts.markModuleFailed ===
        "function"
    ) {
      global.AriFoodNuts.markModuleFailed(
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
        `[ARI Nutrition] ${MODULE_NAME} could not clear prior records.`,
        error
      );
    }
  }

  const registration = registry.registerMany(
    ARI_NUT_BRAND_FOODS,
    { source: MODULE_NAME }
  );

  const moduleResult = {
    registered: registration.registered || 0,
    replaced: registration.replaced || 0,
    rejected: registration.rejected || 0,
    duplicates: registration.duplicates || 0,

    metadata: {
      version: VERSION,
      verifiedAt: VERIFIED_AT,

      foodCount:
        ARI_NUT_BRAND_FOODS.length,

      brandCount: new Set(
        ARI_NUT_BRAND_FOODS.map(
          food => food.brand
        )
      ).size,

      brands: Array.from(
        new Set(
          ARI_NUT_BRAND_FOODS.map(
            food => food.brand
          )
        )
      ),

      runtimeInternetRequired: false,
      brandSpecific: true,

      canonicalBasis: {
        type: "weight",
        amount: 100,
        unit: "g",
        grams: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} nut-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodNuts &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodNuts.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodNuts.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodNutBrands = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_NUT_BRAND_FOODS.length;
    },

    getFoodIds() {
      return ARI_NUT_BRAND_FOODS.map(
        food => food.id
      );
    },

    getBrands() {
      return Array.from(
        new Set(
          ARI_NUT_BRAND_FOODS.map(
            food => food.brand
          )
        )
      );
    },

    getNutTypes() {
      return Array.from(
        new Set(
          ARI_NUT_BRAND_FOODS.map(
            food => food.metadata?.nutType
          )
        )
      );
    },

    getByBrand(brand) {
      const normalized =
        normalizeText(brand);

      return ARI_NUT_BRAND_FOODS
        .filter(
          food =>
            normalizeText(food.brand) === normalized
        )
        .map(clone);
    },

    getByNutType(nutType) {
      const normalized =
        normalizeText(nutType);

      return ARI_NUT_BRAND_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.nutType
            ) === normalized
        )
        .map(clone);
    },

    getRecord(foodId) {
      const record =
        ARI_NUT_BRAND_FOODS.find(
          food =>
            food.id ===
            String(foodId || "").trim()
        );

      return record
        ? clone(record)
        : null;
    },

    getSourcePolicy() {
      return clone(SOURCE_POLICY);
    },

    getRegistrationResult() {
      return clone(registration);
    }
  });

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-nut-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_NUT_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_NUT_BRAND_FOODS.length} branded nut records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);