// =====================================================
// ARI REBIRTH
// File: AriFoodCondimentBrands.js
// Version: 1.0.0
//
// Purpose:
//   Required branded condiment, sauce, and spread database
//   for ARI Nutrition's Condiments pathway.
//
// Collection:
//   AriFoodCondiments
//
// V1 brands:
//   - Heinz
//   - Hellmann's
//   - French's
//   - Sweet Baby Ray's
//   - Kikkoman
//   - A.1.
//
// Coverage:
//   20 branded condiment products.
//
// Included:
//   - Ketchup
//   - Mayonnaise
//   - Mustard
//   - Barbecue sauce
//   - Teriyaki / Asian sauces
//   - Steak sauce
//
// Canonical basis:
//   100 g.
//
// Strategy:
//   Exact branded matches should outrank generic records
//   from AriFoodCondimentsCore.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodCondiments v1+
// =====================================================

(function initializeAriFoodCondimentBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodCondimentBrands";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "required branded condiment layer for the ARI Condiments pathway",
  "recordCount": 20,
  "brands": [
    "A.1.",
    "French's",
    "Heinz",
    "Hellmann's",
    "Kikkoman",
    "Sweet Baby Ray's"
  ],
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Exact branded condiment records outrank AriFoodCondimentsCore generic fallbacks.",
    "Preserve each product's label serving weight.",
    "Normalize label nutrition mathematically to 100 g for registry consistency.",
    "Do not assume products in the same condiment category have interchangeable calories, sodium, sugar, or fat.",
    "Values shown as '<1 g' on a label may be represented conservatively as 0.5 g or 0.9 g in metadata notes for mathematical normalization.",
    "Keep pure cooking oils in AriFoodOils rather than Condiments.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_CONDIMENT_BRAND_FOODS = Object.freeze(
[
  {
    "id": "condiments-brand-heinz-tomato-ketchup",
    "name": "Tomato Ketchup",
    "displayName": "Heinz Tomato Ketchup",
    "brand": "Heinz",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Heinz Tomato Ketchup",
      "Heinz",
      "Tomato Ketchup",
      "Heinz Ketchup"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 29.412,
      "fat": 0.0,
      "sugar": 23.529,
      "sodiumMg": 1058.824
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 4,
        "sodiumMg": 180
      },
      "sourceProvenance": {
        "provider": "Heinz",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.heinz.com/products/00013000004664-tomato-ketchup%2C1713757890",
        "nutritionUrl": "https://www.heinz.com/products/00013000004664-tomato-ketchup%2C1713757890",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-heinz-simply-tomato-ketchup",
    "name": "Simply Tomato Ketchup",
    "displayName": "Heinz Simply Tomato Ketchup",
    "brand": "Heinz",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Heinz Simply Tomato Ketchup",
      "Heinz",
      "Simply Tomato Ketchup",
      "Simply Heinz Ketchup",
      "Heinz Simply Ketchup"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 23.529,
      "fat": 0.0,
      "sugar": 23.529,
      "sodiumMg": 1000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 20,
        "protein": 0,
        "carbs": 4,
        "fat": 0,
        "sugar": 4,
        "sodiumMg": 170
      },
      "sourceProvenance": {
        "provider": "Heinz",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.heinz.com/products/00013000004640",
        "nutritionUrl": "https://www.heinz.com/products/00013000004640",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-heinz-no-sugar-added-ketchup",
    "name": "Tomato Ketchup with No Sugar Added",
    "displayName": "Heinz No Sugar Added Tomato Ketchup",
    "brand": "Heinz",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Heinz No Sugar Added Tomato Ketchup",
      "Heinz",
      "Tomato Ketchup with No Sugar Added",
      "Heinz No Sugar Ketchup",
      "Heinz Sugar Free Ketchup"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 62.5,
      "protein": 0.0,
      "carbs": 6.25,
      "fat": 0.0,
      "sugar": 6.25,
      "sodiumMg": 1187.5
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (16 g)",
        "grams": 16,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (16 g)",
        "servingGrams": 16,
        "calories": 10,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 1,
        "sodiumMg": 190
      },
      "sourceProvenance": {
        "provider": "Heinz",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.heinz.com/products/00013000007993-tomato-ketchup-with-no-sugar-added/%26quot",
        "nutritionUrl": "https://www.heinz.com/products/00013000007993-tomato-ketchup-with-no-sugar-added/%26quot",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 16 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-heinz-no-salt-added-ketchup",
    "name": "Tomato Ketchup with No Salt Added",
    "displayName": "Heinz No Salt Added Tomato Ketchup",
    "brand": "Heinz",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Heinz No Salt Added Tomato Ketchup",
      "Heinz",
      "Tomato Ketchup with No Salt Added",
      "Heinz No Salt Ketchup",
      "Heinz Low Sodium Ketchup"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 29.412,
      "fat": 0.0,
      "sugar": 29.412,
      "sodiumMg": 29.412
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 5,
        "sodiumMg": 5
      },
      "sourceProvenance": {
        "provider": "Heinz",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.heinz.com/products/00013000008976-tomato-ketchup-with-no-salt-added",
        "nutritionUrl": "https://www.heinz.com/products/00013000008976-tomato-ketchup-with-no-salt-added",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-heinz-organic-tomato-ketchup",
    "name": "Organic Tomato Ketchup",
    "displayName": "Heinz Organic Tomato Ketchup",
    "brand": "Heinz",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Heinz Organic Tomato Ketchup",
      "Heinz",
      "Organic Tomato Ketchup",
      "Heinz Organic Ketchup"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "ketchup"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 29.412,
      "fat": 0.0,
      "sugar": 23.529,
      "sodiumMg": 1117.647
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "ketchup",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 4,
        "sodiumMg": 190
      },
      "sourceProvenance": {
        "provider": "Heinz",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.heinz.com/products/00013000000352-heinz-organic-tomato-ketchup-44-oz-bottle",
        "nutritionUrl": "https://www.heinz.com/products/00013000000352-heinz-organic-tomato-ketchup-44-oz-bottle",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-hellmanns-real-mayonnaise",
    "name": "Real Mayonnaise",
    "displayName": "Hellmann's Real Mayonnaise",
    "brand": "Hellmann's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Hellmann's Real Mayonnaise",
      "Hellmann's",
      "Real Mayonnaise",
      "Hellmanns Real Mayo",
      "Hellmann's Mayo",
      "Hellmanns Mayonnaise"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "mayonnaise"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 692.308,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 76.923,
      "sugar": 0.0,
      "sodiumMg": 692.308
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (13 g)",
        "grams": 13,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mayonnaise",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (13 g)",
        "servingGrams": 13,
        "calories": 90,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "sugar": 0,
        "sodiumMg": 90
      },
      "sourceProvenance": {
        "provider": "Hellmann's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.hellmanns.com/us/en/p/real-mayonnaise.html/00048001213487",
        "nutritionUrl": "https://www.hellmanns.com/us/en/p/real-mayonnaise.html/00048001213487",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 13 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-hellmanns-light-mayonnaise",
    "name": "Light Mayonnaise",
    "displayName": "Hellmann's Light Mayonnaise",
    "brand": "Hellmann's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Hellmann's Light Mayonnaise",
      "Hellmann's",
      "Light Mayonnaise",
      "Hellmanns Light Mayo",
      "Hellmann's Light Mayo"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "mayonnaise"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 233.333,
      "protein": 0.0,
      "carbs": 6.667,
      "fat": 23.333,
      "sugar": null,
      "sodiumMg": 733.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (15 g)",
        "grams": 15,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mayonnaise",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (15 g)",
        "servingGrams": 15,
        "calories": 35,
        "protein": 0,
        "carbs": 1,
        "fat": 3.5,
        "sugar": null,
        "sodiumMg": 110
      },
      "sourceProvenance": {
        "provider": "Hellmann's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.hellmanns.com/us/en/p/light-mayonnaise.html/00048001213586",
        "nutritionUrl": "https://www.hellmanns.com/us/en/p/light-mayonnaise.html/00048001213586",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 15 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-hellmanns-organic-mayonnaise",
    "name": "Organic Mayonnaise",
    "displayName": "Hellmann's Organic Mayonnaise",
    "brand": "Hellmann's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Hellmann's Organic Mayonnaise",
      "Hellmann's",
      "Organic Mayonnaise",
      "Hellmanns Organic Mayo",
      "Hellmann's Organic Mayo"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "mayonnaise"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 714.286,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 78.571,
      "sugar": 0.0,
      "sodiumMg": 678.571
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (14 g)",
        "grams": 14,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mayonnaise",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (14 g)",
        "servingGrams": 14,
        "calories": 100,
        "protein": 0,
        "carbs": 0,
        "fat": 11,
        "sugar": 0,
        "sodiumMg": 95
      },
      "sourceProvenance": {
        "provider": "Hellmann's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.hellmanns.com/us/en/p/organic-mayonnaise.html/00048001572713.html/00048001572713/organic-mayonnaise.html",
        "nutritionUrl": "https://www.hellmanns.com/us/en/p/organic-mayonnaise.html/00048001572713.html/00048001572713/organic-mayonnaise.html",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 14 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-frenchs-stone-ground-dijon-mustard",
    "name": "Stone Ground Dijon Mustard",
    "displayName": "French's Stone Ground Dijon Mustard",
    "brand": "French's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "French's Stone Ground Dijon Mustard",
      "French's",
      "Stone Ground Dijon Mustard",
      "Frenchs Stone Ground Dijon",
      "French's Dijon Mustard"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "mustard"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 100.0,
      "protein": 0.0,
      "carbs": 0.0,
      "fat": 0.0,
      "sugar": 0.0,
      "sodiumMg": 2000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tsp (5 g)",
        "grams": 5,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mustard",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tsp (5 g)",
        "servingGrams": 5,
        "calories": 5,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "sugar": 0,
        "sodiumMg": 100
      },
      "sourceProvenance": {
        "provider": "French's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/collections/frenchs-mustards/products/frenchs-r-stone-ground-dijon-mustard-12-oz",
        "nutritionUrl": "https://www.mccormick.com/collections/frenchs-mustards/products/frenchs-r-stone-ground-dijon-mustard-12-oz",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 5 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-frenchs-honey-dijon-mustard",
    "name": "Honey Dijon Mustard",
    "displayName": "French's Honey Dijon Mustard",
    "brand": "French's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "French's Honey Dijon Mustard",
      "French's",
      "Honey Dijon Mustard",
      "Frenchs Honey Dijon",
      "French's Honey Mustard"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "mustard"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 200.0,
      "protein": 0.0,
      "carbs": 20.0,
      "fat": 0.0,
      "sugar": 18.0,
      "sodiumMg": 1000.0
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tsp (5 g)",
        "grams": 5,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "mustard",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tsp (5 g)",
        "servingGrams": 5,
        "calories": 10,
        "protein": 0,
        "carbs": 1,
        "fat": 0,
        "sugar": 0.9,
        "sodiumMg": 50
      },
      "sourceProvenance": {
        "provider": "French's",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.mccormick.com/frenchs/products/mustard/honey-dijon-mustard",
        "nutritionUrl": "https://www.mccormick.com/frenchs/products/mustard/honey-dijon-mustard",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 5 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Official label reports less than 1 g total sugar; stored as 0.9 g to preserve the '<1 g' label meaning without representing it as zero."
    }
  },
  {
    "id": "condiments-brand-sweet-baby-rays-original-bbq",
    "name": "Original Barbecue Sauce",
    "displayName": "Sweet Baby Ray's Original Barbecue Sauce",
    "brand": "Sweet Baby Ray's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Sweet Baby Ray's Original Barbecue Sauce",
      "Sweet Baby Ray's",
      "Original Barbecue Sauce",
      "Sweet Baby Rays Original BBQ",
      "SBR Original BBQ"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "barbecue-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 189.189,
      "protein": 0.0,
      "carbs": 48.649,
      "fat": 0.0,
      "sugar": 45.946,
      "sodiumMg": 783.784
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (37 g)",
        "grams": 37,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "barbecue-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (37 g)",
        "servingGrams": 37,
        "calories": 70,
        "protein": 0,
        "carbs": 18,
        "fat": 0,
        "sugar": 17,
        "sodiumMg": 290
      },
      "sourceProvenance": {
        "provider": "Sweet Baby Ray's",
        "sourceType": "official manufacturer product identity + current retailer package nutrition",
        "sourceUrl": "https://www.sweetbabyrays.com/sauces/barbecue-sauces/original-barbecue-sauce",
        "nutritionUrl": "https://www.heb.com/product-detail/sweet-baby-ray-s-original-barbecue-sauce/708856",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 37 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-sweet-baby-rays-honey-bbq",
    "name": "Honey Barbecue Sauce",
    "displayName": "Sweet Baby Ray's Honey Barbecue Sauce",
    "brand": "Sweet Baby Ray's",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Sweet Baby Ray's Honey Barbecue Sauce",
      "Sweet Baby Ray's",
      "Honey Barbecue Sauce",
      "Sweet Baby Rays Honey BBQ",
      "SBR Honey BBQ"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "barbecue-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 189.189,
      "protein": 0.0,
      "carbs": 45.946,
      "fat": 0.0,
      "sugar": 40.541,
      "sodiumMg": 810.811
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (37 g)",
        "grams": 37,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "barbecue-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (37 g)",
        "servingGrams": 37,
        "calories": 70,
        "protein": 0,
        "carbs": 17,
        "fat": 0,
        "sugar": 15,
        "sodiumMg": 300
      },
      "sourceProvenance": {
        "provider": "Sweet Baby Ray's",
        "sourceType": "official manufacturer product identity + current packaged-food nutrition reference",
        "sourceUrl": "https://www.sweetbabyrays.com/sauces/barbecue-sauces/honey-barbecue-sauce",
        "nutritionUrl": "https://tools.myfooddata.com/nutrition-facts/1860511/wt1/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 37 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-kikkoman-teriyaki-bbq-original",
    "name": "Teriyaki BBQ Sauce Original",
    "displayName": "Kikkoman Teriyaki BBQ Sauce Original",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Teriyaki BBQ Sauce Original",
      "Kikkoman",
      "Teriyaki BBQ Sauce Original",
      "Kikkoman Teriyaki BBQ",
      "Kikkoman Original Teriyaki BBQ Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "teriyaki-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 166.667,
      "protein": 2.778,
      "carbs": 33.333,
      "fat": 0.0,
      "sugar": 27.778,
      "sodiumMg": 2555.556
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (18 g)",
        "grams": 18,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "teriyaki-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (18 g)",
        "servingGrams": 18,
        "calories": 30,
        "protein": 0.5,
        "carbs": 6,
        "fat": 0,
        "sugar": 5,
        "sodiumMg": 460
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/teriyaki-bbq-sauce-original/",
        "nutritionUrl": "https://kikkomanusa.com/products/teriyaki-bbq-sauce-original/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 18 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Protein is labeled '<1 g'; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "condiments-brand-kikkoman-korean-bbq",
    "name": "Teriyaki BBQ Sauce Korean BBQ",
    "displayName": "Kikkoman Teriyaki BBQ Sauce Korean BBQ",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Teriyaki BBQ Sauce Korean BBQ",
      "Kikkoman",
      "Teriyaki BBQ Sauce Korean BBQ",
      "Kikkoman Korean BBQ Sauce",
      "Kikkoman Korean Teriyaki BBQ"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "teriyaki-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 184.211,
      "protein": 2.632,
      "carbs": 42.105,
      "fat": 0.0,
      "sugar": 42.105,
      "sodiumMg": 2473.684
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (19 g)",
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "teriyaki-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (19 g)",
        "servingGrams": 19,
        "calories": 35,
        "protein": 0.5,
        "carbs": 8,
        "fat": 0,
        "sugar": 8,
        "sodiumMg": 470
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/teriyaki-bbq-sacue-korean-bbq/",
        "nutritionUrl": "https://kikkomanusa.com/products/teriyaki-bbq-sacue-korean-bbq/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 19 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Protein is labeled '<1 g'; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "condiments-brand-kikkoman-teriyaki-bbq-glaze",
    "name": "Teriyaki BBQ & Glaze Sauce",
    "displayName": "Kikkoman Teriyaki BBQ & Glaze Sauce",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Teriyaki BBQ & Glaze Sauce",
      "Kikkoman",
      "Teriyaki BBQ & Glaze Sauce",
      "Kikkoman Teriyaki Glaze",
      "Kikkoman BBQ Glaze"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "teriyaki-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 138.889,
      "protein": 2.778,
      "carbs": 27.778,
      "fat": 0.0,
      "sugar": 22.222,
      "sodiumMg": 1777.778
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (18 g)",
        "grams": 18,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "teriyaki-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (18 g)",
        "servingGrams": 18,
        "calories": 25,
        "protein": 0.5,
        "carbs": 5,
        "fat": 0,
        "sugar": 4,
        "sodiumMg": 320
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/teriyaki-bbq-glaze-sauce/",
        "nutritionUrl": "https://kikkomanusa.com/products/teriyaki-bbq-glaze-sauce/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 18 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Protein is labeled '<1 g'; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "condiments-brand-kikkoman-katsu-sauce",
    "name": "Katsu Sauce",
    "displayName": "Kikkoman Katsu Sauce",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Katsu Sauce",
      "Kikkoman",
      "Katsu Sauce",
      "Kikkoman Tonkatsu Sauce",
      "Kikkoman Japanese Cutlet Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "katsu-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 111.111,
      "protein": 0.0,
      "carbs": 27.778,
      "fat": 0.0,
      "sugar": 27.778,
      "sodiumMg": 1833.333
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (18 g)",
        "grams": 18,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "katsu-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (18 g)",
        "servingGrams": 18,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 5,
        "sodiumMg": 330
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/katsu-sauce/",
        "nutritionUrl": "https://kikkomanusa.com/products/katsu-sauce/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 18 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-kikkoman-stir-fry-sauce",
    "name": "Stir-Fry Sauce",
    "displayName": "Kikkoman Stir-Fry Sauce",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Stir-Fry Sauce",
      "Kikkoman",
      "Stir-Fry Sauce",
      "Kikkoman Stir Fry Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "stir-fry-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 111.111,
      "protein": 2.778,
      "carbs": 22.222,
      "fat": 0.0,
      "sugar": 16.667,
      "sodiumMg": 2722.222
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (18 g)",
        "grams": 18,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "stir-fry-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (18 g)",
        "servingGrams": 18,
        "calories": 20,
        "protein": 0.5,
        "carbs": 4,
        "fat": 0,
        "sugar": 3,
        "sodiumMg": 490
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/products/stir-fry-sauce/",
        "nutritionUrl": "https://kikkomanusa.com/products/stir-fry-sauce/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 18 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Protein is labeled '<1 g'; stored as 0.5 g for normalization."
    }
  },
  {
    "id": "condiments-brand-kikkoman-sweet-sour-sauce",
    "name": "Sweet & Sour Sauce",
    "displayName": "Kikkoman Sweet & Sour Sauce",
    "brand": "Kikkoman",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "Kikkoman Sweet & Sour Sauce",
      "Kikkoman",
      "Sweet & Sour Sauce",
      "Kikkoman Sweet and Sour Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "sweet-and-sour-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 26.471,
      "fat": 0.0,
      "sugar": 23.529,
      "sodiumMg": 529.412
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "2 tbsp (34 g)",
        "grams": 34,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "sweet-and-sour-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "2 tbsp (34 g)",
        "servingGrams": 34,
        "calories": 40,
        "protein": 0,
        "carbs": 9,
        "fat": 0,
        "sugar": 8,
        "sodiumMg": 180
      },
      "sourceProvenance": {
        "provider": "Kikkoman",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://kikkomanusa.com/foodservice/products/sweet-sour-sauce/",
        "nutritionUrl": "https://kikkomanusa.com/foodservice/products/sweet-sour-sauce/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 34 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-a1-original-steak-sauce",
    "name": "Original Steak Sauce",
    "displayName": "A.1. Original Steak Sauce",
    "brand": "A.1.",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "A.1. Original Steak Sauce",
      "A.1.",
      "Original Steak Sauce",
      "A1 Original Sauce",
      "A1 Steak Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "steak-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 88.235,
      "protein": 0.0,
      "carbs": 17.647,
      "fat": 0.0,
      "sugar": 11.765,
      "sodiumMg": 1705.882
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "steak-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 15,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "sugar": 2,
        "sodiumMg": 290
      },
      "sourceProvenance": {
        "provider": "A.1.",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.kraftheinz.com/a1/products/00054400000047-original-steak-sauce",
        "nutritionUrl": "https://www.kraftheinz.com/a1/products/00054400000047-original-steak-sauce",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
    }
  },
  {
    "id": "condiments-brand-a1-bold-spicy-tabasco",
    "name": "Bold & Spicy Sauce with Tabasco",
    "displayName": "A.1. Bold & Spicy Sauce with Tabasco",
    "brand": "A.1.",
    "category": "condiments",
    "state": "sauce-or-dressing",
    "preparation": "packaged-ready-to-serve",
    "aliases": [
      "A.1. Bold & Spicy Sauce with Tabasco",
      "A.1.",
      "Bold & Spicy Sauce with Tabasco",
      "A1 Bold and Spicy",
      "A1 Spicy Steak Sauce"
    ],
    "tags": [
      "condiments",
      "branded",
      "packaged",
      "ready-to-serve",
      "steak-sauce"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 117.647,
      "protein": 0.0,
      "carbs": 29.412,
      "fat": 0.0,
      "sugar": 17.647,
      "sodiumMg": 1529.412
    },
    "servings": [
      {
        "id": "label-serving",
        "label": "1 tbsp (17 g)",
        "grams": 17,
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
    "source": "AriFoodCondimentBrands",
    "verified": true,
    "metadata": {
      "foodFamily": "condiments",
      "condimentType": "steak-sauce",
      "brandSpecific": true,
      "packagedProduct": true,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "labelNutrition": {
        "servingSize": "1 tbsp (17 g)",
        "servingGrams": 17,
        "calories": 20,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "sugar": 3,
        "sodiumMg": 260
      },
      "sourceProvenance": {
        "provider": "A.1.",
        "sourceType": "official manufacturer product nutrition",
        "sourceUrl": "https://www.kraftheinz.com/a1/products/00054400012774-bold-spicy-sauce-with-tabasco",
        "nutritionUrl": "https://www.kraftheinz.com/a1/products/00054400012774-bold-spicy-sauce-with-tabasco",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "normalizationMethod": "Label nutrition for 17 g was normalized mathematically to the ARI Condiments canonical basis of 100 g.",
      "notes": "Exact branded condiment record. Prefer this over AriFoodCondimentsCore when the user's product matches this brand/product."
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
    if (!global.AriFoodCondiments) {
      return false;
    }

    if (
      typeof global.AriFoodCondiments.isKnownModule ===
      "function"
    ) {
      try {
        return global.AriFoodCondiments.isKnownModule(
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
      global.AriFoodCondiments &&
      controllerKnowsThisModule() &&
      typeof global.AriFoodCondiments.markModuleFailed ===
        "function"
    ) {
      global.AriFoodCondiments.markModuleFailed(
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
      ARI_CONDIMENT_BRAND_FOODS,
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
        ARI_CONDIMENT_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_CONDIMENT_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_CONDIMENT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      condimentTypes:
        Array.from(
          new Set(
            ARI_CONDIMENT_BRAND_FOODS.map(
              food =>
                food.metadata?.condimentType
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
      `Registration rejected ${registration.rejected} condiment-brand record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodCondiments &&
    controllerKnowsThisModule() &&
    typeof global.AriFoodCondiments.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodCondiments.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodCondimentBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_CONDIMENT_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_CONDIMENT_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_CONDIMENT_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getCondimentTypes() {
        return Array.from(
          new Set(
            ARI_CONDIMENT_BRAND_FOODS.map(
              food =>
                food.metadata?.condimentType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          normalizeText(brand);

        return ARI_CONDIMENT_BRAND_FOODS
          .filter(
            food =>
              normalizeText(food.brand) ===
              normalized
          )
          .map(clone);
      },

      getByCondimentType(
        condimentType
      ) {
        const normalized =
          normalizeText(condimentType);

        return ARI_CONDIMENT_BRAND_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.condimentType
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_CONDIMENT_BRAND_FOODS.find(
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
        "ari:food-condiment-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_CONDIMENT_BRAND_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_CONDIMENT_BRAND_FOODS.length} branded condiment records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
