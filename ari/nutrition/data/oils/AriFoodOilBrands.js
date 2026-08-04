// =====================================================
// ARI REBIRTH
// File: AriFoodOilBrands.js
// Version: 1.0.0
//
// Purpose:
//   Optional branded packaged cooking-oil database for
//   ARI Nutrition's Oils pathway.
//
// Collection:
//   AriFoodOils
//
// V1 brands:
//   - Bertolli
//   - Kikkoman
//   - LouAna
//   - La Tourangelle
//   - Chosen Foods
//
// Coverage:
//   20 branded oil products.
//
// Included:
//   - Olive oils
//   - Avocado oils
//   - Sesame oils
//   - Coconut oils
//   - Grapeseed oil
//   - Walnut oil
//   - Peanut oil
//
// Excluded:
//   - Cooking sprays
//   - Butter / margarine
//   - Mayonnaise
//   - Salad dressings
//   - Sauces / condiments
//
// Canonical basis:
//   100 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodOils v1+
// =====================================================

(function initializeAriFoodOilBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodOilBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "optional branded cooking-oil layer for the ARI Oils pathway",
  "recordCount": 20,
  "brands": [
    "Bertolli",
    "Chosen Foods",
    "Kikkoman",
    "La Tourangelle",
    "LouAna"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Preserve manufacturer label nutrition when current product data publishes it.",
    "When a current official product page confirms identity but not a text nutrition panel, mark the pure-oil nutrition reference as modeled.",
    "Normalize the serving reference mathematically to 100 g.",
    "Do not treat cooking-spray zero-calorie label rounding as zero calories for bulk oil.",
    "Keep sprays outside V1 to avoid serving-size rounding ambiguity.",
    "Keep butter, margarine, mayonnaise, dressings, and sauces outside the Oils pathway.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_OIL_BRAND_FOODS = Object.freeze(
[
  {
    "id": "oils-brand-bertolli-extra-virgin-olive-oil-rich-taste",
    "name": "Extra Virgin Olive Oil Rich Taste",
    "displayName": "Bertolli Extra Virgin Olive Oil Rich Taste",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "extra-virgin",
    "aliases": [
      "Bertolli Extra Virgin Olive Oil Rich Taste",
      "Bertolli",
      "Extra Virgin Olive Oil Rich Taste",
      "Bertolli EVOO Rich Taste",
      "Bertolli Extra Virgin Olive Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "extra-virgin",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/extra-virgin-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-cooking-olive-oil",
    "name": "Cooking Olive Oil",
    "displayName": "Bertolli Cooking Olive Oil",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "refined-virgin-blend",
    "aliases": [
      "Bertolli Cooking Olive Oil",
      "Bertolli",
      "Cooking Olive Oil",
      "Bertolli Light Taste Olive Oil",
      "Bertolli Cooking Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "refined-virgin-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "refined-virgin-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/light-taste-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-organic-extra-virgin-olive-oil",
    "name": "Organic Extra Virgin Olive Oil Rich Taste",
    "displayName": "Bertolli Organic Extra Virgin Olive Oil Rich Taste",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "organic-extra-virgin",
    "aliases": [
      "Bertolli Organic Extra Virgin Olive Oil Rich Taste",
      "Bertolli",
      "Organic Extra Virgin Olive Oil Rich Taste",
      "Bertolli Organic EVOO",
      "Bertolli Organic Extra Virgin Olive Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "organic-extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "organic-extra-virgin",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/organic-extra-virgin-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-organic-olive-oil-light-taste",
    "name": "Organic Olive Oil Light Taste",
    "displayName": "Bertolli Organic Olive Oil Light Taste",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "organic-refined-extra-virgin-blend",
    "aliases": [
      "Bertolli Organic Olive Oil Light Taste",
      "Bertolli",
      "Organic Olive Oil Light Taste",
      "Bertolli Organic Light Olive Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "organic-refined-extra-virgin-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "organic-refined-extra-virgin-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/bertolli-organic-100-pure-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-ditalia-extra-virgin-olive-oil",
    "name": "D'Italia Extra Virgin Olive Oil",
    "displayName": "Bertolli D'Italia Extra Virgin Olive Oil",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "extra-virgin",
    "aliases": [
      "Bertolli D'Italia Extra Virgin Olive Oil",
      "Bertolli",
      "D'Italia Extra Virgin Olive Oil",
      "Bertolli D Italia EVOO",
      "Bertolli D'Italia EVOO"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "extra-virgin",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://oliveoil.bertolli.com/products/olive-oils/extra-virgin-olive-oils/ditalia-extra-virgin-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-extra-virgin-olive-oil-smooth-taste",
    "name": "Extra Virgin Olive Oil Smooth Taste",
    "displayName": "Bertolli Extra Virgin Olive Oil Smooth Taste",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "extra-virgin",
    "aliases": [
      "Bertolli Extra Virgin Olive Oil Smooth Taste",
      "Bertolli",
      "Extra Virgin Olive Oil Smooth Taste",
      "Bertolli Smooth EVOO",
      "Bertolli Smooth Olive Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "extra-virgin",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/bertolli-extra-virgin-olive-oil-smooth-taste/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-bertolli-extra-light-taste-olive-oil",
    "name": "Olive Oil Extra Light Taste",
    "displayName": "Bertolli Olive Oil Extra Light Taste",
    "brand": "Bertolli",
    "category": "oils",
    "state": "liquid",
    "preparation": "refined-virgin-blend",
    "aliases": [
      "Bertolli Olive Oil Extra Light Taste",
      "Bertolli",
      "Olive Oil Extra Light Taste",
      "Bertolli Extra Light Olive Oil",
      "Bertolli Light Olive Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "olive",
      "refined-virgin-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "olive",
      "oilStyle": "refined-virgin-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Bertolli",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://bertolli.com/oils-and-vinegars/extra-light-tasting-olive-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-kikkoman-sesame-oil",
    "name": "Sesame Oil",
    "displayName": "Kikkoman Sesame Oil",
    "brand": "Kikkoman",
    "category": "oils",
    "state": "liquid",
    "preparation": "toasted",
    "aliases": [
      "Kikkoman Sesame Oil",
      "Kikkoman",
      "Sesame Oil",
      "Kikkoman Toasted Sesame Oil",
      "Kikkoman Pure Sesame Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "sesame",
      "toasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sesame",
      "oilStyle": "toasted",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/sesame-oil-non-gmo/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-kikkoman-chili-sesame-oil",
    "name": "Chili Sesame Oil",
    "displayName": "Kikkoman Chili Sesame Oil",
    "brand": "Kikkoman",
    "category": "oils",
    "state": "liquid",
    "preparation": "chili-flavored",
    "aliases": [
      "Kikkoman Chili Sesame Oil",
      "Kikkoman",
      "Chili Sesame Oil",
      "Kikkoman Spicy Sesame Oil",
      "Kikkoman Chili Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "sesame",
      "chili-flavored"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sesame",
      "oilStyle": "chili-flavored",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer current product page with nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/chili-sesame-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-louana-coconut-oil",
    "name": "100% Pure Coconut Oil",
    "displayName": "LouAna 100% Pure Coconut Oil",
    "brand": "LouAna",
    "category": "oils",
    "state": "semi-solid-or-liquid",
    "preparation": "refined",
    "aliases": [
      "LouAna 100% Pure Coconut Oil",
      "LouAna",
      "100% Pure Coconut Oil",
      "LouAna Coconut Oil",
      "Louana Pure Coconut Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "coconut",
      "refined"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 92.857,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "coconut",
      "oilStyle": "refined",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 13,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "LouAna",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://louana.com/product/coconut-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-louana-organic-coconut-oil",
    "name": "100% Pure Organic Coconut Oil",
    "displayName": "LouAna 100% Pure Organic Coconut Oil",
    "brand": "LouAna",
    "category": "oils",
    "state": "semi-solid-or-liquid",
    "preparation": "organic-refined",
    "aliases": [
      "LouAna 100% Pure Organic Coconut Oil",
      "LouAna",
      "100% Pure Organic Coconut Oil",
      "LouAna Organic Coconut Oil",
      "Louana Organic Coconut"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "coconut",
      "organic-refined"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 92.857,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "coconut",
      "oilStyle": "organic-refined",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 13,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "LouAna",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://louana.com/product/100-percent-pure-organic-coconut-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-louana-liquid-coconut-oil",
    "name": "Liquid Coconut Oil",
    "displayName": "LouAna Liquid Coconut Oil",
    "brand": "LouAna",
    "category": "oils",
    "state": "semi-solid-or-liquid",
    "preparation": "fractionated-liquid",
    "aliases": [
      "LouAna Liquid Coconut Oil",
      "LouAna",
      "Liquid Coconut Oil",
      "LouAna Fractionated Coconut Oil",
      "Louana Liquid Coconut"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "coconut",
      "fractionated-liquid"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 100.0,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "coconut",
      "oilStyle": "fractionated-liquid",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 14,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "LouAna",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://louana.com/product/liquid-coconut-oil/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-grapeseed-oil",
    "name": "Grapeseed Oil",
    "displayName": "La Tourangelle Grapeseed Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "expeller-pressed",
    "aliases": [
      "La Tourangelle Grapeseed Oil",
      "La Tourangelle",
      "Grapeseed Oil",
      "La Tourangelle Grape Seed Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "grapeseed",
      "expeller-pressed"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 10.714,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "grapeseed",
      "oilStyle": "expeller-pressed",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 1.5,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/grapeseed-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-salads-saute-avocado-oil",
    "name": "Salads & SautÃ© Avocado Oil",
    "displayName": "La Tourangelle Salads & SautÃ© Avocado Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "virgin-refined-blend",
    "aliases": [
      "La Tourangelle Salads & SautÃ© Avocado Oil",
      "La Tourangelle",
      "Salads & SautÃ© Avocado Oil",
      "La Tourangelle Avocado Oil",
      "La Tourangelle Salads and Saute Avocado Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "avocado",
      "virgin-refined-blend"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "avocado",
      "oilStyle": "virgin-refined-blend",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/collections/avocado-oils/products/avocado-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-extra-virgin-avocado-oil",
    "name": "Extra Virgin Avocado Oil",
    "displayName": "La Tourangelle Extra Virgin Avocado Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "extra-virgin",
    "aliases": [
      "La Tourangelle Extra Virgin Avocado Oil",
      "La Tourangelle",
      "Extra Virgin Avocado Oil",
      "La Tourangelle Extra Virgin Avo Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "avocado",
      "extra-virgin"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "avocado",
      "oilStyle": "extra-virgin",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/extra-virgin-avocado-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-sear-sizzle-avocado-oil",
    "name": "Sear & Sizzle Avocado Oil",
    "displayName": "La Tourangelle Sear & Sizzle Avocado Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "high-heat",
    "aliases": [
      "La Tourangelle Sear & Sizzle Avocado Oil",
      "La Tourangelle",
      "Sear & Sizzle Avocado Oil",
      "La Tourangelle Sear and Sizzle Avocado Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "avocado",
      "high-heat"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "avocado",
      "oilStyle": "high-heat",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/sear-sizzle-avocado-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-toasted-sesame-oil",
    "name": "Toasted Sesame Oil",
    "displayName": "La Tourangelle Toasted Sesame Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "toasted",
    "aliases": [
      "La Tourangelle Toasted Sesame Oil",
      "La Tourangelle",
      "Toasted Sesame Oil",
      "La Tourangelle Sesame Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "sesame",
      "toasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "sesame",
      "oilStyle": "toasted",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/toasted-sesame-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-california-walnut-oil",
    "name": "California Walnut Oil, Slow-Roasted",
    "displayName": "La Tourangelle California Walnut Oil, Slow-Roasted",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "slow-roasted",
    "aliases": [
      "La Tourangelle California Walnut Oil, Slow-Roasted",
      "La Tourangelle",
      "California Walnut Oil, Slow-Roasted",
      "La Tourangelle Walnut Oil",
      "La Tourangelle Roasted Walnut Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "walnut",
      "slow-roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 10.714,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "walnut",
      "oilStyle": "slow-roasted",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 1.5,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/walnut-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-la-tourangelle-roasted-peanut-oil",
    "name": "Roasted Peanut Oil",
    "displayName": "La Tourangelle Roasted Peanut Oil",
    "brand": "La Tourangelle",
    "category": "oils",
    "state": "liquid",
    "preparation": "roasted",
    "aliases": [
      "La Tourangelle Roasted Peanut Oil",
      "La Tourangelle",
      "Roasted Peanut Oil",
      "La Tourangelle Peanut Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "peanut",
      "roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 17.857,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "peanut",
      "oilStyle": "roasted",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "medium-high",
      "labelNutrition": {
        "servingSize": "1 tbsp",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2.5,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": false,
        "modeled": true,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "La Tourangelle",
        "sourceType": "official manufacturer current product identity page",
        "sourceUrl": "https://latourangelle.com/products/roasted-peanut-oil",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
    }
  },
  {
    "id": "oils-brand-chosen-foods-100-percent-pure-avocado-oil",
    "name": "100% Pure Avocado Oil",
    "displayName": "Chosen Foods 100% Pure Avocado Oil",
    "brand": "Chosen Foods",
    "category": "oils",
    "state": "liquid",
    "preparation": "refined",
    "aliases": [
      "Chosen Foods 100% Pure Avocado Oil",
      "Chosen Foods",
      "100% Pure Avocado Oil",
      "Chosen Foods Avocado Oil",
      "Chosen Avocado Oil"
    ],
    "tags": [
      "oils",
      "branded",
      "packaged",
      "culinary-oil",
      "avocado",
      "refined"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 857.143,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 100.0,
      "saturatedFat": 14.286,
      "sodiumMg": 0.0
    },
    "servings": [
      {
        "id": "1-tbsp",
        "label": "1 tbsp (15 mL)",
        "amount": 1,
        "unit": "tbsp",
        "grams": 14,
        "isDefault": true
      },
      {
        "id": "1-tsp",
        "label": "1 tsp",
        "amount": 1,
        "unit": "tsp",
        "grams": 4.67,
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
    "source": "AriFoodOilBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "oils",
      "oilType": "avocado",
      "oilStyle": "refined",
      "brandSpecific": true,
      "packagedProduct": true,
      "pureOrOilDominantProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 mL)",
        "servingGrams": 14,
        "calories": 120,
        "protein": 0,
        "carbs": 0,
        "fat": 14,
        "saturatedFat": 2,
        "sodiumMg": 0
      },
      "nutritionMethod": {
        "manufacturerPublished": true,
        "modeled": false,
        "notes": "Manufacturer label nutrition retained when published in accessible current product data. Otherwise a standard pure-oil 1 tbsp reference is used and explicitly marked as modeled."
      },
      "sourceProvenance": {
        "provider": "Chosen Foods",
        "sourceType": "current retailer supplier label data",
        "sourceUrl": "https://www.costco.com/p/-/chosen-foods-100-pure-avocado-oil-2-l/100640848",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "The stored 1 tbsp reference was normalized mathematically to the ARI Oils canonical basis of 100 g. Label rounding can cause canonical calories to differ slightly from theoretical 9 kcal/g fat.",
      "notes": "Branded cooking-oil record. Cooking sprays, butter, margarine, mayonnaise, dressings, and sauces remain outside this module."
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
    if (!global.AriFoodOils) {
      return false;
    }

    if (
      typeof global.AriFoodOils.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodOils.isKnownModule(
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
      global.AriFoodOils &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodOils.markModuleFailed ===
        "function"
    ) {
      global.AriFoodOils.markModuleFailed(
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
    ARI_OIL_BRAND_FOODS,
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
        ARI_OIL_BRAND_FOODS.length,

      brandCount: new Set(
        ARI_OIL_BRAND_FOODS.map(
          food => food.brand
        )
      ).size,

      brands: Array.from(
        new Set(
          ARI_OIL_BRAND_FOODS.map(
            food => food.brand
          )
        )
      ),

      oilTypes: Array.from(
        new Set(
          ARI_OIL_BRAND_FOODS.map(
            food => food.metadata?.oilType
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
      `Registration rejected ${registration.rejected} oil-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodOils &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodOils.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodOils.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodOilBrands = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_OIL_BRAND_FOODS.length;
    },

    getFoodIds() {
      return ARI_OIL_BRAND_FOODS.map(
        food => food.id
      );
    },

    getBrands() {
      return Array.from(
        new Set(
          ARI_OIL_BRAND_FOODS.map(
            food => food.brand
          )
        )
      );
    },

    getOilTypes() {
      return Array.from(
        new Set(
          ARI_OIL_BRAND_FOODS.map(
            food => food.metadata?.oilType
          )
        )
      );
    },

    getByBrand(brand) {
      const normalized =
        normalizeText(brand);

      return ARI_OIL_BRAND_FOODS
        .filter(
          food =>
            normalizeText(food.brand) === normalized
        )
        .map(clone);
    },

    getByOilType(oilType) {
      const normalized =
        normalizeText(oilType);

      return ARI_OIL_BRAND_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.oilType
            ) === normalized
        )
        .map(clone);
    },

    getRecord(foodId) {
      const record =
        ARI_OIL_BRAND_FOODS.find(
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
        "ari:food-oil-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_OIL_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_OIL_BRAND_FOODS.length} branded oil records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
