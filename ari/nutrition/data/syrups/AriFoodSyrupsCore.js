// =====================================================
// ARI REBIRTH
// File: AriFoodSyrupsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic syrup and liquid-sweetener fallback
//   dataset for ARI Nutrition.
//
// Collection:
//   AriFoodSyrups
//
// Coverage:
//   14 generic syrup records.
//
// Included:
//   - Pure maple syrup
//   - Pancake syrup
//   - Honey
//   - Agave nectar
//   - Molasses
//   - Blackstrap molasses
//   - Light corn syrup
//   - Dark corn syrup
//   - Golden syrup
//   - Chocolate syrup
//   - Caramel syrup
//   - Date syrup
//   - Sugar-free pancake syrup
//   - Zero-calorie flavored syrup
//
// Strategy:
//   Generic fallback only. Exact branded products from
//   AriFoodSyrupBrands should outrank these.
//
// Canonical basis:
//   100 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSyrups v1+
// =====================================================

(function initializeAriFoodSyrupsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodSyrupsCore";
  const VERIFIED_AT = "2026-08-04";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-04",
  "runtimeInternetRequired": false,
  "strategy": "generic liquid-sweetener and syrup core for the ARI Syrups pathway",
  "recordCount": 14,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Preserve realistic tablespoon-based household servings.",
    "Generic records are fallbacks; exact branded syrup products should outrank them.",
    "Dry granulated sugars remain in AriFoodSeasonings.",
    "Savory sauces remain in AriFoodCondiments.",
    "Do not infer how much syrup the user poured.",
    "Sugar-free and zero-calorie syrups must remain separate from caloric syrups.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_SYRUP_CORE_FOODS = Object.freeze(
[
  {
    "id": "syrups-maple-pure",
    "name": "Maple Syrup, Pure",
    "displayName": "Pure Maple Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "pure",
    "aliases": [
      "Pure Maple Syrup",
      "Maple Syrup, Pure",
      "maple syrup",
      "pure maple syrup",
      "real maple syrup"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "maple-syrup",
      "pure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 260,
      "protein": 0.04,
      "carbs": 67.04,
      "fat": 0.06,
      "fiber": 0,
      "sugar": 60.46,
      "sodiumMg": 12
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 40,
        "isDefault": true,
        "nutrition": {
          "calories": 104.0,
          "protein": 0.02,
          "carbs": 26.82,
          "fat": 0.02,
          "fiber": 0.0,
          "sugar": 24.18,
          "sodiumMg": 4.8
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "maple-syrup",
      "syrupStyle": "pure",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-pancake-syrup",
    "name": "Pancake Syrup",
    "displayName": "Pancake Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "pancake",
    "aliases": [
      "Pancake Syrup",
      "pancake syrup",
      "breakfast syrup",
      "table syrup"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "breakfast-syrup",
      "pancake"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 253,
      "protein": 0,
      "carbs": 66.0,
      "fat": 0,
      "fiber": 0,
      "sugar": 62.0,
      "sodiumMg": 170
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 39,
        "isDefault": true,
        "nutrition": {
          "calories": 98.7,
          "protein": 0.0,
          "carbs": 25.74,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 24.18,
          "sodiumMg": 66.3
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "breakfast-syrup",
      "syrupStyle": "pancake",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-honey",
    "name": "Honey",
    "displayName": "Honey",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "pure",
    "aliases": [
      "Honey",
      "honey",
      "pure honey"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "honey",
      "pure"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 304,
      "protein": 0.3,
      "carbs": 82.4,
      "fat": 0,
      "fiber": 0.2,
      "sugar": 82.1,
      "sodiumMg": 4
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 21,
        "isDefault": true,
        "nutrition": {
          "calories": 63.8,
          "protein": 0.06,
          "carbs": 17.3,
          "fat": 0.0,
          "fiber": 0.04,
          "sugar": 17.24,
          "sodiumMg": 0.8
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "honey",
      "syrupStyle": "pure",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-agave-nectar",
    "name": "Agave Nectar",
    "displayName": "Agave Nectar",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "nectar",
    "aliases": [
      "Agave Nectar",
      "agave",
      "agave syrup",
      "agave nectar"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "agave",
      "nectar"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 310,
      "protein": 0.1,
      "carbs": 76.4,
      "fat": 0.5,
      "fiber": 0.2,
      "sugar": 68.0,
      "sodiumMg": 4
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 21,
        "isDefault": true,
        "nutrition": {
          "calories": 65.1,
          "protein": 0.02,
          "carbs": 16.04,
          "fat": 0.11,
          "fiber": 0.04,
          "sugar": 14.28,
          "sodiumMg": 0.8
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "agave",
      "syrupStyle": "nectar",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-molasses",
    "name": "Molasses",
    "displayName": "Molasses",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "regular",
    "aliases": [
      "Molasses",
      "molasses",
      "dark molasses"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "molasses",
      "regular"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 290,
      "protein": 0,
      "carbs": 74.7,
      "fat": 0.1,
      "fiber": 0,
      "sugar": 74.7,
      "sodiumMg": 37
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 58.0,
          "protein": 0.0,
          "carbs": 14.94,
          "fat": 0.02,
          "fiber": 0.0,
          "sugar": 14.94,
          "sodiumMg": 7.4
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "molasses",
      "syrupStyle": "regular",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-blackstrap-molasses",
    "name": "Blackstrap Molasses",
    "displayName": "Blackstrap Molasses",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "blackstrap",
    "aliases": [
      "Blackstrap Molasses",
      "blackstrap molasses",
      "black strap molasses"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "molasses",
      "blackstrap"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 240,
      "protein": 0,
      "carbs": 60.0,
      "fat": 0,
      "fiber": 0,
      "sugar": 55.0,
      "sodiumMg": 80
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 48.0,
          "protein": 0.0,
          "carbs": 12.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 11.0,
          "sodiumMg": 16.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "molasses",
      "syrupStyle": "blackstrap",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-corn-syrup-light",
    "name": "Corn Syrup, Light",
    "displayName": "Light Corn Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "light",
    "aliases": [
      "Light Corn Syrup",
      "Corn Syrup, Light",
      "corn syrup",
      "light corn syrup"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "corn-syrup",
      "light"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 286,
      "protein": 0,
      "carbs": 77.6,
      "fat": 0.2,
      "fiber": 0,
      "sugar": 76.9,
      "sodiumMg": 155
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 57.2,
          "protein": 0.0,
          "carbs": 15.52,
          "fat": 0.04,
          "fiber": 0.0,
          "sugar": 15.38,
          "sodiumMg": 31.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "corn-syrup",
      "syrupStyle": "light",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-corn-syrup-dark",
    "name": "Corn Syrup, Dark",
    "displayName": "Dark Corn Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "dark",
    "aliases": [
      "Dark Corn Syrup",
      "Corn Syrup, Dark",
      "dark corn syrup"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "corn-syrup",
      "dark"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 286,
      "protein": 0,
      "carbs": 77.6,
      "fat": 0.2,
      "fiber": 0,
      "sugar": 76.9,
      "sodiumMg": 155
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 57.2,
          "protein": 0.0,
          "carbs": 15.52,
          "fat": 0.04,
          "fiber": 0.0,
          "sugar": 15.38,
          "sodiumMg": 31.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "corn-syrup",
      "syrupStyle": "dark",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-golden-syrup",
    "name": "Golden Syrup",
    "displayName": "Golden Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "invert-sugar",
    "aliases": [
      "Golden Syrup",
      "golden syrup",
      "light treacle"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "golden-syrup",
      "invert-sugar"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 310,
      "protein": 0,
      "carbs": 80.0,
      "fat": 0,
      "fiber": 0,
      "sugar": 80.0,
      "sodiumMg": 40
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 62.0,
          "protein": 0.0,
          "carbs": 16.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 16.0,
          "sodiumMg": 8.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "golden-syrup",
      "syrupStyle": "invert-sugar",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-chocolate-syrup",
    "name": "Chocolate Syrup",
    "displayName": "Chocolate Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "chocolate",
    "aliases": [
      "Chocolate Syrup",
      "chocolate syrup",
      "chocolate topping"
    ],
    "tags": [
      "syrups",
      "generic",
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
      "calories": 279,
      "protein": 2.1,
      "carbs": 65.1,
      "fat": 1.1,
      "fiber": 2.6,
      "sugar": 49.7,
      "sodiumMg": 72
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 39,
        "isDefault": true,
        "nutrition": {
          "calories": 108.8,
          "protein": 0.82,
          "carbs": 25.39,
          "fat": 0.43,
          "fiber": 1.01,
          "sugar": 19.38,
          "sodiumMg": 28.1
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "chocolate",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-caramel-syrup",
    "name": "Caramel Syrup",
    "displayName": "Caramel Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "caramel",
    "aliases": [
      "Caramel Syrup",
      "caramel syrup",
      "caramel topping"
    ],
    "tags": [
      "syrups",
      "generic",
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
      "calories": 300,
      "protein": 0.5,
      "carbs": 72.0,
      "fat": 1.0,
      "fiber": 0,
      "sugar": 60.0,
      "sodiumMg": 180
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 40,
        "isDefault": true,
        "nutrition": {
          "calories": 120.0,
          "protein": 0.2,
          "carbs": 28.8,
          "fat": 0.4,
          "fiber": 0.0,
          "sugar": 24.0,
          "sodiumMg": 72.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "dessert-syrup",
      "syrupStyle": "caramel",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-date-syrup",
    "name": "Date Syrup",
    "displayName": "Date Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "date",
    "aliases": [
      "Date Syrup",
      "date syrup",
      "date nectar",
      "date molasses"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "date-syrup",
      "date"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 310,
      "protein": 1.0,
      "carbs": 76.0,
      "fat": 0,
      "fiber": 2.0,
      "sugar": 66.0,
      "sodiumMg": 20
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "1 tbsp",
        "grams": 20,
        "isDefault": true,
        "nutrition": {
          "calories": 62.0,
          "protein": 0.2,
          "carbs": 15.2,
          "fat": 0.0,
          "fiber": 0.4,
          "sugar": 13.2,
          "sodiumMg": 4.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "date-syrup",
      "syrupStyle": "date",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-sugar-free-pancake-syrup",
    "name": "Sugar-Free Pancake Syrup",
    "displayName": "Sugar-Free Pancake Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "breakfast",
    "aliases": [
      "Sugar-Free Pancake Syrup",
      "sugar free syrup",
      "sugar-free pancake syrup",
      "diet pancake syrup"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "sugar-free-syrup",
      "breakfast"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 50,
      "protein": 0,
      "carbs": 12.0,
      "fat": 0,
      "fiber": 4.0,
      "sugar": 0,
      "sodiumMg": 400
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 15.0,
          "protein": 0.0,
          "carbs": 3.6,
          "fat": 0.0,
          "fiber": 1.2,
          "sugar": 0.0,
          "sodiumMg": 120.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "sugar-free-syrup",
      "syrupStyle": "breakfast",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
    }
  },
  {
    "id": "syrups-zero-calorie-flavored",
    "name": "Zero-Calorie Flavored Syrup",
    "displayName": "Zero-Calorie Flavored Syrup",
    "brand": null,
    "category": "syrups",
    "state": "liquid",
    "preparation": "flavored",
    "aliases": [
      "Zero-Calorie Flavored Syrup",
      "zero calorie syrup",
      "sugar free flavored syrup",
      "coffee syrup sugar free"
    ],
    "tags": [
      "syrups",
      "generic",
      "liquid-sweetener",
      "zero-calorie-syrup",
      "flavored"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0,
      "sodiumMg": 30
    },
    "servings": [
      {
        "id": "default-household-serving",
        "label": "2 tbsp",
        "grams": 30,
        "isDefault": true,
        "nutrition": {
          "calories": 0.0,
          "protein": 0.0,
          "carbs": 0.0,
          "fat": 0.0,
          "fiber": 0.0,
          "sugar": 0.0,
          "sodiumMg": 9.0
        }
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
    "source": "AriFoodSyrupsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "syrups",
      "syrupType": "zero-calorie-syrup",
      "syrupStyle": "flavored",
      "genericFood": true,
      "brandSpecific": false,
      "liquidSweetener": true,
      "dataVerifiedAt": "2026-08-04",
      "confidence": "medium-high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / standard generic syrup and sweetener references",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-04"
      },
      "offlineReference": true,
      "notes": "Generic liquid-sweetener fallback. Exact branded products should use AriFoodSyrupBrands when available because calories, sugars, sweetener systems, sodium, and serving sizes can vary materially."
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
      ARI_SYRUP_CORE_FOODS,
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
        ARI_SYRUP_CORE_FOODS.length,

      syrupTypes:
        Array.from(
          new Set(
            ARI_SYRUP_CORE_FOODS.map(
              food =>
                food.metadata?.syrupType
            )
          )
        ),

      runtimeInternetRequired: false,
      genericCore: true,

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
      `Registration rejected ${registration.rejected} syrup-core record(s).`,
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

  global.AriFoodSyrupsCore =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_SYRUP_CORE_FOODS.length;
      },

      getFoodIds() {
        return ARI_SYRUP_CORE_FOODS.map(
          food => food.id
        );
      },

      getSyrupTypes() {
        return Array.from(
          new Set(
            ARI_SYRUP_CORE_FOODS.map(
              food =>
                food.metadata?.syrupType
            )
          )
        );
      },

      getBySyrupType(syrupType) {
        const normalized =
          normalizeText(syrupType);

        return ARI_SYRUP_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.syrupType
              ) === normalized
          )
          .map(clone);
      },

      getByStyle(style) {
        const normalized =
          normalizeText(style);

        return ARI_SYRUP_CORE_FOODS
          .filter(
            food =>
              normalizeText(
                food.metadata?.syrupStyle
              ) === normalized
          )
          .map(clone);
      },

      getRecord(foodId) {
        const record =
          ARI_SYRUP_CORE_FOODS.find(
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
        "ari:food-syrups-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_SYRUP_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_SYRUP_CORE_FOODS.length} generic syrup records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);