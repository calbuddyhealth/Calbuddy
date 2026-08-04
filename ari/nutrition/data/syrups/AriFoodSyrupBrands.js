// =====================================================
// ARI REBIRTH
// File: AriFoodSyrupBrands.js
// Version: 1.0.0
//
// Purpose:
//   Required branded syrup and liquid-sweetener database
//   for ARI Nutrition's Syrups pathway.
//
// Collection:
//   AriFoodSyrups
//
// V1 brands:
//   - Pearl Milling Company
//   - HERSHEY'S
//   - Smucker's
//   - Torani
//   - Maple Grove Farms
//
// Coverage:
//   20 branded syrup products.
//
// Includes:
//   - Pancake / breakfast syrups
//   - Chocolate syrup
//   - Caramel syrup / topping
//   - Maple syrup
//   - Flavored coffee syrup
//   - Sugar-free syrup
//
// Canonical basis:
//   100 g.
//
// Important:
//   Some liquid labels publish volume but not gram weight.
//   In those cases this module preserves the exact label
//   serving and explicitly marks the gram conversion used
//   for canonical normalization as estimated.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSyrups v1+
// =====================================================

(function initializeAriFoodSyrupBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSyrupBrands";
  const VERIFIED_AT = "2026-08-04";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-04",
  "runtimeInternetRequired": false,
  "strategy": "required branded syrup and liquid-sweetener layer for the ARI Syrups pathway",
  "recordCount": 20,
  "brands": [
    "HERSHEY'S",
    "Maple Grove Farms",
    "Pearl Milling Company",
    "Smucker's",
    "Torani"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Exact branded syrup records outrank AriFoodSyrupsCore generic fallbacks.",
    "Preserve the manufacturer label serving exactly.",
    "When the manufacturer publishes grams, use that gram weight directly.",
    "When the manufacturer publishes only tablespoons or milliliters, any gram conversion used for 100 g normalization must be explicitly marked estimated.",
    "Prefer metadata.labelNutrition for exact branded serving calculations.",
    "Keep dry granulated sugar in AriFoodSeasonings.",
    "Keep savory sauces in AriFoodCondiments.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SYRUP_BRAND_FOODS = Object.freeze(
[
  {
    "id": "syrups-brand-pearl-milling-original",
    "name": "Original Syrup",
    "displayName": "Pearl Milling Company Original Syrup",
    "brand": "Pearl Milling Company",
    "category": "syrups",
    "state": "liquid",
    "preparation": "original",
    "aliases": [
      "Pearl Milling Company Original Syrup",
      "Pearl Milling Company",
      "Original Syrup",
      "Pearl Milling Original",
      "Aunt Jemima syrup equivalent"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "breakfast-syrup",
      "original"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 256.41,
      "protein": 0.0,
      "carbs": 64.103,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 38.462,
      "sodiumMg": 76.923
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 39,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "original",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 39,
        "servingGramsEstimated": true,
        "calories": 100,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "fiber": 0,
        "sugar": 15,
        "sodiumMg": 30
      },
      "sourceProvenance": {
        "provider": "Pearl Milling Company",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.pearlmillingcompany.com/products/syrups/original",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 39 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL, not grams. 39 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-pearl-milling-lite",
    "name": "Lite Syrup",
    "displayName": "Pearl Milling Company Lite Syrup",
    "brand": "Pearl Milling Company",
    "category": "syrups",
    "state": "liquid",
    "preparation": "lite",
    "aliases": [
      "Pearl Milling Company Lite Syrup",
      "Pearl Milling Company",
      "Lite Syrup",
      "Pearl Milling Lite",
      "Pearl Milling Reduced Calorie Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "breakfast-syrup",
      "lite"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 128.205,
      "protein": 0.0,
      "carbs": 30.769,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 30.769,
      "sodiumMg": 153.846
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 39,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "lite",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 39,
        "servingGramsEstimated": true,
        "calories": 50,
        "protein": 0,
        "carbs": 12,
        "fat": 0,
        "fiber": 0,
        "sugar": 12,
        "sodiumMg": 60
      },
      "sourceProvenance": {
        "provider": "Pearl Milling Company",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.pearlmillingcompany.com/products/syrups/lite",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 39 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL, not grams. 39 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-pearl-milling-butter-rich",
    "name": "Butter Rich Syrup",
    "displayName": "Pearl Milling Company Butter Rich Syrup",
    "brand": "Pearl Milling Company",
    "category": "syrups",
    "state": "liquid",
    "preparation": "butter-rich",
    "aliases": [
      "Pearl Milling Company Butter Rich Syrup",
      "Pearl Milling Company",
      "Butter Rich Syrup",
      "Pearl Milling Butter Rich"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "breakfast-syrup",
      "butter-rich"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 256.41,
      "protein": 0.0,
      "carbs": 66.667,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 35.897,
      "sodiumMg": 166.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 39,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "butter-rich",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 39,
        "servingGramsEstimated": true,
        "calories": 100,
        "protein": 0,
        "carbs": 26,
        "fat": 0,
        "fiber": 0,
        "sugar": 14,
        "sodiumMg": 65
      },
      "sourceProvenance": {
        "provider": "Pearl Milling Company",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.pearlmillingcompany.com/products/syrups/butter_rich",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 39 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL, not grams. 39 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-pearl-milling-butter-lite",
    "name": "Butter Lite Syrup",
    "displayName": "Pearl Milling Company Butter Lite Syrup",
    "brand": "Pearl Milling Company",
    "category": "syrups",
    "state": "liquid",
    "preparation": "butter-lite",
    "aliases": [
      "Pearl Milling Company Butter Lite Syrup",
      "Pearl Milling Company",
      "Butter Lite Syrup",
      "Pearl Milling Butter Lite"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "breakfast-syrup",
      "butter-lite"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 128.205,
      "protein": 0.0,
      "carbs": 30.769,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 30.769,
      "sodiumMg": 153.846
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 39,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "butter-lite",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 39,
        "servingGramsEstimated": true,
        "calories": 50,
        "protein": 0,
        "carbs": 12,
        "fat": 0,
        "fiber": 0,
        "sugar": 12,
        "sodiumMg": 60
      },
      "sourceProvenance": {
        "provider": "Pearl Milling Company",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.pearlmillingcompany.com/products/syrups/butter_lite",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 39 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL, not grams. 39 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-pearl-milling-country-rich",
    "name": "Country Rich Syrup",
    "displayName": "Pearl Milling Company Country Rich Syrup",
    "brand": "Pearl Milling Company",
    "category": "syrups",
    "state": "liquid",
    "preparation": "country-rich",
    "aliases": [
      "Pearl Milling Company Country Rich Syrup",
      "Pearl Milling Company",
      "Country Rich Syrup",
      "Pearl Milling Country Rich"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "breakfast-syrup",
      "country-rich"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 256.41,
      "protein": 0.0,
      "carbs": 64.103,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 35.897,
      "sodiumMg": 89.744
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 39,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "country-rich",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 39,
        "servingGramsEstimated": true,
        "calories": 100,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "fiber": 0,
        "sugar": 14,
        "sodiumMg": 35
      },
      "sourceProvenance": {
        "provider": "Pearl Milling Company",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.pearlmillingcompany.com/products/syrups/country_rich",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 39 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL, not grams. 39 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-hersheys-chocolate",
    "name": "Chocolate Syrup",
    "displayName": "HERSHEY'S Chocolate Syrup",
    "brand": "HERSHEY'S",
    "category": "syrups",
    "state": "liquid",
    "preparation": "chocolate",
    "aliases": [
      "HERSHEY'S Chocolate Syrup",
      "HERSHEY'S",
      "Chocolate Syrup",
      "Hershey Chocolate Syrup",
      "Hershey's Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "chocolate"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 236.842,
      "protein": 0.0,
      "carbs": 63.158,
      "fat": 0.0,
      "fiber": 5.263,
      "sugar": 52.632,
      "sodiumMg": 26.316
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp",
        "grams": 19,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "chocolate",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 19,
        "servingGramsEstimated": true,
        "calories": 45,
        "protein": 0,
        "carbs": 12,
        "fat": 0,
        "fiber": 1,
        "sugar": 10,
        "sodiumMg": 5
      },
      "sourceProvenance": {
        "provider": "HERSHEY'S",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.hersheyland.com/products/hersheys-chocolate-syrup-120-oz-jug.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 19 g was used only for 100 g normalization.",
      "notes": "Current product page lists 1 tbsp without gram weight. 19 g is used as an estimated mass for normalization."
    }
  },
  {
    "id": "syrups-brand-hersheys-special-dark",
    "name": "Special Dark Mildly Sweet Chocolate Syrup",
    "displayName": "HERSHEY'S SPECIAL DARK Mildly Sweet Chocolate Syrup",
    "brand": "HERSHEY'S",
    "category": "syrups",
    "state": "liquid",
    "preparation": "dark-chocolate",
    "aliases": [
      "HERSHEY'S SPECIAL DARK Mildly Sweet Chocolate Syrup",
      "HERSHEY'S",
      "Special Dark Mildly Sweet Chocolate Syrup",
      "Hershey Special Dark Syrup",
      "Hershey's Dark Chocolate Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "dark-chocolate"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 236.842,
      "protein": 0.0,
      "carbs": 63.158,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 52.632,
      "sodiumMg": 78.947
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (19 g)",
        "grams": 19,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "dark-chocolate",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (19 g)",
        "servingGrams": 19,
        "servingGramsEstimated": false,
        "calories": 45,
        "protein": 0,
        "carbs": 12,
        "fat": 0,
        "fiber": 0,
        "sugar": 10,
        "sodiumMg": 15
      },
      "sourceProvenance": {
        "provider": "HERSHEY'S",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.hersheyland.com/products/hersheys-special-dark-mildly-sweet-chocolate-syrup-22-oz-bottle.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 19 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-hersheys-caramel",
    "name": "Caramel Syrup",
    "displayName": "HERSHEY'S Caramel Syrup",
    "brand": "HERSHEY'S",
    "category": "syrups",
    "state": "liquid",
    "preparation": "caramel",
    "aliases": [
      "HERSHEY'S Caramel Syrup",
      "HERSHEY'S",
      "Caramel Syrup",
      "Hershey Caramel Syrup",
      "Hershey's Caramel"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "caramel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 263.158,
      "protein": 0.0,
      "carbs": 68.421,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 52.632,
      "sodiumMg": 315.789
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (19 g)",
        "grams": 19,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "caramel",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (19 g)",
        "servingGrams": 19,
        "servingGramsEstimated": false,
        "calories": 50,
        "protein": 0,
        "carbs": 13,
        "fat": 0,
        "fiber": 0,
        "sugar": 10,
        "sodiumMg": 60
      },
      "sourceProvenance": {
        "provider": "HERSHEY'S",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.hersheyland.com/products/hersheys-caramel-syrup-22-oz-bottle.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 19 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-hersheys-zero-sugar-chocolate",
    "name": "Zero Sugar Chocolate Syrup",
    "displayName": "HERSHEY'S Zero Sugar Chocolate Syrup",
    "brand": "HERSHEY'S",
    "category": "syrups",
    "state": "liquid",
    "preparation": "zero-sugar-chocolate",
    "aliases": [
      "HERSHEY'S Zero Sugar Chocolate Syrup",
      "HERSHEY'S",
      "Zero Sugar Chocolate Syrup",
      "Hershey Sugar Free Chocolate Syrup",
      "Hershey Zero Sugar Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "sugar-free-syrup",
      "zero-sugar-chocolate"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33.333,
      "protein": 0.0,
      "carbs": 13.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodiumMg": 200.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (15 g)",
        "grams": 15,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "zero-sugar-chocolate",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 g)",
        "servingGrams": 15,
        "servingGramsEstimated": false,
        "calories": 5,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodiumMg": 30
      },
      "sourceProvenance": {
        "provider": "HERSHEY'S",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.hersheyland.com/products/hersheys-sugar-free-chocolate-syrup-17-5-oz-bottle.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 15 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-smuckers-drizzle-chocolate",
    "name": "Drizzle Chocolate Flavored Syrup",
    "displayName": "Smucker's Drizzle Chocolate Flavored Syrup",
    "brand": "Smucker's",
    "category": "syrups",
    "state": "liquid",
    "preparation": "chocolate",
    "aliases": [
      "Smucker's Drizzle Chocolate Flavored Syrup",
      "Smucker's",
      "Drizzle Chocolate Flavored Syrup",
      "Smuckers Chocolate Syrup",
      "Smucker's Chocolate Drizzle"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "chocolate"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 275.0,
      "protein": 2.5,
      "carbs": 65.0,
      "fat": 0.0,
      "fiber": 2.5,
      "sugar": 50.0,
      "sodiumMg": 50.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (40 g)",
        "grams": 40,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "chocolate",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (40 g)",
        "servingGrams": 40,
        "servingGramsEstimated": false,
        "calories": 110,
        "protein": 1,
        "carbs": 26,
        "fat": 0,
        "fiber": 1,
        "sugar": 20,
        "sodiumMg": 20
      },
      "sourceProvenance": {
        "provider": "Smucker's",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.smuckers.com/ice-cream-toppings/flavored-syrup/drizzle-chocolate",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 40 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-smuckers-drizzle-caramel",
    "name": "Drizzle Caramel Flavored Syrup",
    "displayName": "Smucker's Drizzle Caramel Flavored Syrup",
    "brand": "Smucker's",
    "category": "syrups",
    "state": "liquid",
    "preparation": "caramel",
    "aliases": [
      "Smucker's Drizzle Caramel Flavored Syrup",
      "Smucker's",
      "Drizzle Caramel Flavored Syrup",
      "Smuckers Caramel Syrup",
      "Smucker's Caramel Drizzle"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "caramel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250.0,
      "protein": 0.0,
      "carbs": 65.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 47.5,
      "sodiumMg": 250.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (40 g)",
        "grams": 40,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "caramel",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (40 g)",
        "servingGrams": 40,
        "servingGramsEstimated": false,
        "calories": 100,
        "protein": 0,
        "carbs": 26,
        "fat": 0,
        "fiber": 0,
        "sugar": 19,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "Smucker's",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.smuckers.com/ice-cream-toppings/flavored-syrup/drizzle-caramel",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 40 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-smuckers-sugar-free-caramel",
    "name": "Drizzle Sugar Free Caramel Flavored Syrup",
    "displayName": "Smucker's Drizzle Sugar Free Caramel Flavored Syrup",
    "brand": "Smucker's",
    "category": "syrups",
    "state": "liquid",
    "preparation": "sugar-free-caramel",
    "aliases": [
      "Smucker's Drizzle Sugar Free Caramel Flavored Syrup",
      "Smucker's",
      "Drizzle Sugar Free Caramel Flavored Syrup",
      "Smuckers Sugar Free Caramel",
      "Smucker's Sugar Free Caramel Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "sugar-free-syrup",
      "sugar-free-caramel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 236.842,
      "protein": 0.0,
      "carbs": 65.789,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodiumMg": 171.053
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (38 g)",
        "grams": 38,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "sugar-free-caramel",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (38 g)",
        "servingGrams": 38,
        "servingGramsEstimated": false,
        "calories": 90,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodiumMg": 65
      },
      "sourceProvenance": {
        "provider": "Smucker's",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.smuckers.com/ice-cream-toppings/flavored-syrup/drizzle-sugar-free-caramel",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 38 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-smuckers-caramel-spoonable",
    "name": "Caramel Flavored Spoonable Topping",
    "displayName": "Smucker's Caramel Flavored Spoonable Topping",
    "brand": "Smucker's",
    "category": "syrups",
    "state": "liquid",
    "preparation": "thick-caramel",
    "aliases": [
      "Smucker's Caramel Flavored Spoonable Topping",
      "Smucker's",
      "Caramel Flavored Spoonable Topping",
      "Smuckers Caramel Topping",
      "Smucker's Thick Caramel"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "dessert-syrup",
      "thick-caramel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 292.683,
      "protein": 0.0,
      "carbs": 73.171,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 53.659,
      "sodiumMg": 256.098
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (41 g)",
        "grams": 41,
        "gramsEstimated": false,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "thick-caramel",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (41 g)",
        "servingGrams": 41,
        "servingGramsEstimated": false,
        "calories": 120,
        "protein": 0,
        "carbs": 30,
        "fat": 0,
        "fiber": 0,
        "sugar": 22,
        "sodiumMg": 105
      },
      "sourceProvenance": {
        "provider": "Smucker's",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.smuckers.com/ice-cream-toppings/spoonable/caramel",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition for 41 g was normalized mathematically to the ARI Syrups canonical basis of 100 g.",
      "notes": "Exact branded syrup record. Prefer this over AriFoodSyrupsCore when the user's brand/product matches."
    }
  },
  {
    "id": "syrups-brand-torani-vanilla-bean",
    "name": "Vanilla Bean Syrup",
    "displayName": "Torani Vanilla Bean Syrup",
    "brand": "Torani",
    "category": "syrups",
    "state": "liquid",
    "preparation": "vanilla",
    "aliases": [
      "Torani Vanilla Bean Syrup",
      "Torani",
      "Vanilla Bean Syrup",
      "Torani Vanilla",
      "Torani Vanilla Bean"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "flavored-syrup",
      "vanilla"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 300.0,
      "protein": 0.0,
      "carbs": 76.667,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 76.667,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp",
        "grams": 30,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "flavored-syrup",
      "syrupStyle": "vanilla",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp",
        "servingGrams": 30,
        "servingGramsEstimated": true,
        "calories": 90,
        "protein": 0,
        "carbs": 23,
        "fat": 0,
        "fiber": 0,
        "sugar": 23,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Torani",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.torani.com/vanilla-bean-syrup.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 30 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 2 tbsp without gram weight. 30 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-torani-hazelnut",
    "name": "Hazelnut Syrup",
    "displayName": "Torani Hazelnut Syrup",
    "brand": "Torani",
    "category": "syrups",
    "state": "liquid",
    "preparation": "hazelnut",
    "aliases": [
      "Torani Hazelnut Syrup",
      "Torani",
      "Hazelnut Syrup",
      "Torani Hazelnut"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "flavored-syrup",
      "hazelnut"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 266.667,
      "protein": 0.0,
      "carbs": 63.333,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 63.333,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp",
        "grams": 30,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "flavored-syrup",
      "syrupStyle": "hazelnut",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp",
        "servingGrams": 30,
        "servingGramsEstimated": true,
        "calories": 80,
        "protein": 0,
        "carbs": 19,
        "fat": 0,
        "fiber": 0,
        "sugar": 19,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Torani",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.torani.com/products/hazelnut-syrup.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 30 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 2 tbsp without gram weight. 30 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-torani-sugar-free-vanilla",
    "name": "Sugar Free Vanilla Syrup",
    "displayName": "Torani Sugar Free Vanilla Syrup",
    "brand": "Torani",
    "category": "syrups",
    "state": "liquid",
    "preparation": "vanilla",
    "aliases": [
      "Torani Sugar Free Vanilla Syrup",
      "Torani",
      "Sugar Free Vanilla Syrup",
      "Torani SF Vanilla",
      "Torani Zero Calorie Vanilla"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "sugar-free-syrup",
      "vanilla"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodiumMg": 16.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp",
        "grams": 30,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "vanilla",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp",
        "servingGrams": 30,
        "servingGramsEstimated": true,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodiumMg": 5
      },
      "sourceProvenance": {
        "provider": "Torani",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.torani.com/sugar-free-vanilla-syrup.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 30 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 2 tbsp without gram weight. 30 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-torani-sugar-free-caramel",
    "name": "Sugar Free Caramel Syrup",
    "displayName": "Torani Sugar Free Caramel Syrup",
    "brand": "Torani",
    "category": "syrups",
    "state": "liquid",
    "preparation": "caramel",
    "aliases": [
      "Torani Sugar Free Caramel Syrup",
      "Torani",
      "Sugar Free Caramel Syrup",
      "Torani SF Caramel",
      "Torani Zero Calorie Caramel"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "sugar-free-syrup",
      "caramel"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0.0,
      "protein": 0.0,
      "carbs": 2.433,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodiumMg": 16.667
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp",
        "grams": 30,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "caramel",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp",
        "servingGrams": 30,
        "servingGramsEstimated": true,
        "calories": 0,
        "protein": 0,
        "carbs": 0.73,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodiumMg": 5
      },
      "sourceProvenance": {
        "provider": "Torani",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://www.torani.com/sugar-free-caramel-syrup.html",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 30 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 2 tbsp without gram weight. 30 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-maple-grove-organic-pure-maple",
    "name": "Organic 100% Pure Maple Syrup",
    "displayName": "Maple Grove Farms Organic 100% Pure Maple Syrup",
    "brand": "Maple Grove Farms",
    "category": "syrups",
    "state": "liquid",
    "preparation": "organic-pure",
    "aliases": [
      "Maple Grove Farms Organic 100% Pure Maple Syrup",
      "Maple Grove Farms",
      "Organic 100% Pure Maple Syrup",
      "Maple Grove Pure Maple",
      "Maple Grove Organic Maple Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "maple-syrup",
      "organic-pure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 262.5,
      "protein": 0.0,
      "carbs": 66.25,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 66.25,
      "sodiumMg": 12.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1/4 cup (60 mL)",
        "grams": 80,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "maple-syrup",
      "syrupStyle": "organic-pure",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1/4 cup (60 mL)",
        "servingGrams": 80,
        "servingGramsEstimated": true,
        "calories": 210,
        "protein": 0,
        "carbs": 53,
        "fat": 0,
        "fiber": 0,
        "sugar": 53,
        "sodiumMg": 10
      },
      "sourceProvenance": {
        "provider": "Maple Grove Farms",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://maplegrove.com/product/organic-pure-maple-syrup-grade-a-amber-color/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 80 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 60 mL without gram weight. 80 g is an estimated serving mass based on typical maple-syrup density."
    }
  },
  {
    "id": "syrups-brand-maple-grove-sugar-free-butter",
    "name": "Sugar Free Syrup Butter Flavor",
    "displayName": "Maple Grove Farms Sugar Free Syrup Butter Flavor",
    "brand": "Maple Grove Farms",
    "category": "syrups",
    "state": "liquid",
    "preparation": "butter-flavor",
    "aliases": [
      "Maple Grove Farms Sugar Free Syrup Butter Flavor",
      "Maple Grove Farms",
      "Sugar Free Syrup Butter Flavor",
      "Maple Grove Sugar Free Syrup",
      "Maple Grove Butter Sugar Free"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "sugar-free-syrup",
      "butter-flavor"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 33.333,
      "protein": 0.0,
      "carbs": 10.0,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 0.0,
      "sodiumMg": 183.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 30,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "butter-flavor",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 30,
        "servingGramsEstimated": true,
        "calories": 10,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodiumMg": 55
      },
      "sourceProvenance": {
        "provider": "Maple Grove Farms",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://maplegrove.com/product/sugar-free-syrup-butter-flavor/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 30 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL without gram weight. 30 g is an estimated serving mass for normalization."
    }
  },
  {
    "id": "syrups-brand-maple-grove-hot-maple",
    "name": "HOT Maple Syrup",
    "displayName": "Maple Grove Farms HOT Maple Syrup",
    "brand": "Maple Grove Farms",
    "category": "syrups",
    "state": "liquid",
    "preparation": "chili-maple",
    "aliases": [
      "Maple Grove Farms HOT Maple Syrup",
      "Maple Grove Farms",
      "HOT Maple Syrup",
      "Maple Grove Hot Maple",
      "Spicy Maple Syrup"
    ],
    "tags": [
      "syrups",
      "branded",
      "packaged",
      "liquid-sweetener",
      "maple-syrup",
      "chili-maple"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 275.0,
      "protein": 0.0,
      "carbs": 67.5,
      "fat": 0.0,
      "fiber": 0.0,
      "sugar": 60.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (30 mL)",
        "grams": 40,
        "gramsEstimated": true,
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
    "source": "AriFoodSyrupBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "maple-syrup",
      "syrupStyle": "chili-maple",
      "brandSpecific": true,
      "packagedProduct": true,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "2 tbsp (30 mL)",
        "servingGrams": 40,
        "servingGramsEstimated": true,
        "calories": 110,
        "protein": 0,
        "carbs": 27,
        "fat": 0,
        "fiber": 0,
        "sugar": 24,
        "sodiumMg": 0
      },
      "sourceProvenance": {
        "provider": "Maple Grove Farms",
        "sourceType": "official manufacturer current product nutrition",
        "sourceUrl": "https://maplegrove.com/product/maple-grove-farms-hot-maple-syrup/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "normalizationMethod": "Manufacturer label nutrition was preserved exactly; because the label supplied volume rather than grams, an explicitly marked estimated serving mass of 40 g was used only for 100 g normalization.",
      "notes": "Manufacturer publishes 30 mL without gram weight. 40 g is an estimated serving mass based on maple-syrup density."
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
    if (!global.AriFoodSyrups) {
      return false;
    }

    if (
      typeof global.AriFoodSyrups.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodSyrups.isKnownModule(
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
      global.AriFoodSyrups &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodSyrups.markModuleFailed ===
        "function"
    ) {
      global.AriFoodSyrups.markModuleFailed(
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

  const registration =
    registry.registerMany(
      ARI_SYRUP_BRAND_FOODS,
      { source: MODULE_NAME }
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
        ARI_SYRUP_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_SYRUP_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_SYRUP_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      syrupTypes:
        Array.from(
          new Set(
            ARI_SYRUP_BRAND_FOODS.map(
              food =>
                food.metadata?.syrupType
            )
          )
        ),

      estimatedGramServingCount:
        ARI_SYRUP_BRAND_FOODS.filter(
          food =>
            food.metadata?.labelNutrition
              ?.servingGramsEstimated === true
        ).length,

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
      `Registration rejected ${registration.rejected} syrup-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSyrups &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodSyrups.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSyrups.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodSyrupBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SYRUP_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_SYRUP_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_SYRUP_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getSyrupTypes() {
        return Array.from(
          new Set(
            ARI_SYRUP_BRAND_FOODS.map(
              food =>
                food.metadata?.syrupType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_SYRUP_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) ===
              normalized
          )
          .map(clone);
      },

      getBySyrupType(syrupType) {
        const normalized =
          normalizeText(syrupType);

        return ARI_SYRUP_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.syrupType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SYRUP_BRAND_FOODS.find(
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
        "ari:food-syrup-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SYRUP_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SYRUP_BRAND_FOODS.length} branded syrup records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
