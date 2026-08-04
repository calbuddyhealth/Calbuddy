// =====================================================
// ARI REBIRTH
// File: AriFoodNutsCore.js
// Version: 1.0.0
//
// Purpose:
//   Required generic whole-nut nutrition dataset for
//   ARI Nutrition's Nuts pathway.
//
// Collection:
//   AriFoodNuts
//
// Coverage:
//   14 generic unsalted nut records.
//
// Included:
//   - Almonds: raw + dry roasted
//   - Cashews: raw + dry roasted
//   - Walnuts
//   - Pecans
//   - Pistachios: raw + dry roasted
//   - Peanuts: raw + dry roasted
//   - Macadamia nuts
//   - Brazil nuts
//   - Hazelnuts
//   - Pine nuts
//
// Excluded by design:
//   - Salted nuts
//   - Oil-roasted variants
//   - Honey-roasted / candied nuts
//   - Chocolate-coated nuts
//   - Flavored / seasoned nuts
//   - Nut butters
//
// Canonical basis:
//   100 g.
//
// Default serving:
//   1 oz / 28.35 g.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodNuts v1+
// =====================================================

(function initializeAriFoodNutsCore(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodNutsCore";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
{
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "strategy": "generic whole-nut core for the ARI Nuts pathway",
  "recordCount": 14,
  "canonicalBasis": {
    "type": "weight",
    "amount": 100,
    "unit": "g",
    "grams": 100
  },
  "defaultServing": {
    "label": "1 oz",
    "amount": 1,
    "unit": "oz",
    "grams": 28.35
  },
  "sourceHierarchy": [
    "USDA FoodData Central / Standard Reference generic food data",
    "Frozen offline reference values"
  ],
  "rules": [
    "Use 100 g as the canonical nutrition basis.",
    "Expose 1 oz / 28.35 g as the default household serving.",
    "Keep raw and dry-roasted variants separate when both are represented.",
    "Core records are unsalted and unflavored.",
    "Do not infer salt, oil, sugar, chocolate, coatings, or seasoning.",
    "Do not merge nut butters into whole-nut records.",
    "Peanuts are intentionally included as a culinary/nutrition nut despite being botanical legumes.",
    "No runtime internet connection is required."
  ]
}
  );

  const ARI_NUT_CORE_FOODS = Object.freeze(
[
  {
    "id": "nuts-almonds-raw",
    "name": "Almonds, Raw",
    "displayName": "Raw Almonds",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Almonds",
      "Almonds, Raw",
      "almonds",
      "raw almonds",
      "almond"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "almond",
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
      "calories": 579,
      "protein": 21.15,
      "carbs": 21.55,
      "fat": 49.93,
      "fiber": 12.5,
      "sugar": 4.35
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-almonds-dry-roasted-unsalted",
    "name": "Almonds, Dry Roasted, Unsalted",
    "displayName": "Dry Roasted Unsalted Almonds",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "dry-roasted",
    "aliases": [
      "Dry Roasted Unsalted Almonds",
      "Almonds, Dry Roasted, Unsalted",
      "dry roasted almonds",
      "roasted almonds",
      "unsalted roasted almonds"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "almond",
      "dry-roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 598,
      "protein": 20.96,
      "carbs": 21.01,
      "fat": 52.54,
      "fiber": 10.9,
      "sugar": 4.86
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "almond",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-cashews-raw",
    "name": "Cashews, Raw",
    "displayName": "Raw Cashews",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Cashews",
      "Cashews, Raw",
      "cashews",
      "raw cashews",
      "cashew"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "cashew",
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
      "calories": 553,
      "protein": 18.22,
      "carbs": 30.19,
      "fat": 43.85,
      "fiber": 3.3,
      "sugar": 5.91
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "cashew",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-cashews-dry-roasted-unsalted",
    "name": "Cashews, Dry Roasted, Unsalted",
    "displayName": "Dry Roasted Unsalted Cashews",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "dry-roasted",
    "aliases": [
      "Dry Roasted Unsalted Cashews",
      "Cashews, Dry Roasted, Unsalted",
      "dry roasted cashews",
      "roasted cashews",
      "unsalted roasted cashews"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "cashew",
      "dry-roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 574,
      "protein": 15.31,
      "carbs": 32.69,
      "fat": 46.35,
      "fiber": 3.0,
      "sugar": 5.01
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "cashew",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-walnuts-english-raw",
    "name": "Walnuts, English, Raw",
    "displayName": "Raw Walnuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Walnuts",
      "Walnuts, English, Raw",
      "walnuts",
      "raw walnuts",
      "english walnuts",
      "walnut"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "walnut",
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
      "calories": 654,
      "protein": 15.23,
      "carbs": 13.71,
      "fat": 65.21,
      "fiber": 6.7,
      "sugar": 2.61
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "walnut",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-pecans-raw",
    "name": "Pecans, Raw",
    "displayName": "Raw Pecans",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Pecans",
      "Pecans, Raw",
      "pecans",
      "raw pecans",
      "pecan"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "pecan",
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
      "calories": 691,
      "protein": 9.17,
      "carbs": 13.86,
      "fat": 71.97,
      "fiber": 9.6,
      "sugar": 3.97
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "pecan",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-pistachios-raw",
    "name": "Pistachios, Raw",
    "displayName": "Raw Pistachios",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Pistachios",
      "Pistachios, Raw",
      "pistachios",
      "raw pistachios",
      "pistachio"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "pistachio",
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
      "calories": 560,
      "protein": 20.16,
      "carbs": 27.17,
      "fat": 45.32,
      "fiber": 10.6,
      "sugar": 7.66
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "pistachio",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-pistachios-dry-roasted-unsalted",
    "name": "Pistachios, Dry Roasted, Unsalted",
    "displayName": "Dry Roasted Unsalted Pistachios",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "dry-roasted",
    "aliases": [
      "Dry Roasted Unsalted Pistachios",
      "Pistachios, Dry Roasted, Unsalted",
      "dry roasted pistachios",
      "roasted pistachios",
      "unsalted pistachios"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "pistachio",
      "dry-roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 572,
      "protein": 21.05,
      "carbs": 28.28,
      "fat": 45.82,
      "fiber": 10.3,
      "sugar": 7.74
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "pistachio",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-peanuts-raw",
    "name": "Peanuts, Raw",
    "displayName": "Raw Peanuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Peanuts",
      "Peanuts, Raw",
      "peanuts",
      "raw peanuts",
      "peanut"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "peanut",
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
      "calories": 567,
      "protein": 25.8,
      "carbs": 16.13,
      "fat": 49.24,
      "fiber": 8.5,
      "sugar": 4.72
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "culinaryNut": true,
      "botanicalLegume": true,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-peanuts-dry-roasted-unsalted",
    "name": "Peanuts, Dry Roasted, Unsalted",
    "displayName": "Dry Roasted Unsalted Peanuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "dry-roasted",
    "aliases": [
      "Dry Roasted Unsalted Peanuts",
      "Peanuts, Dry Roasted, Unsalted",
      "dry roasted peanuts",
      "roasted peanuts",
      "unsalted roasted peanuts"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "peanut",
      "dry-roasted"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 587,
      "protein": 24.35,
      "carbs": 21.26,
      "fat": 49.66,
      "fiber": 8.4,
      "sugar": 4.9
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "peanut",
      "culinaryNut": true,
      "botanicalLegume": true,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-macadamia-raw",
    "name": "Macadamia Nuts, Raw",
    "displayName": "Raw Macadamia Nuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Macadamia Nuts",
      "Macadamia Nuts, Raw",
      "macadamia nuts",
      "raw macadamias",
      "macadamias",
      "macadamia"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "macadamia",
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
      "calories": 718,
      "protein": 7.91,
      "carbs": 13.82,
      "fat": 75.77,
      "fiber": 8.6,
      "sugar": 4.57
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "macadamia",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-brazil-nuts-raw",
    "name": "Brazil Nuts, Raw",
    "displayName": "Raw Brazil Nuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Brazil Nuts",
      "Brazil Nuts, Raw",
      "brazil nuts",
      "raw brazil nuts",
      "brazil nut"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "brazil-nut",
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
      "calories": 659,
      "protein": 14.32,
      "carbs": 11.74,
      "fat": 67.1,
      "fiber": 7.5,
      "sugar": 2.33
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "brazil-nut",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-hazelnuts-raw",
    "name": "Hazelnuts, Raw",
    "displayName": "Raw Hazelnuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Hazelnuts",
      "Hazelnuts, Raw",
      "hazelnuts",
      "raw hazelnuts",
      "filberts",
      "hazelnut"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "hazelnut",
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
      "calories": 628,
      "protein": 14.95,
      "carbs": 16.7,
      "fat": 60.75,
      "fiber": 9.7,
      "sugar": 4.34
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "hazelnut",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
    }
  },
  {
    "id": "nuts-pine-nuts-raw",
    "name": "Pine Nuts, Raw",
    "displayName": "Raw Pine Nuts",
    "brand": null,
    "category": "nuts",
    "state": "solid",
    "preparation": "raw",
    "aliases": [
      "Raw Pine Nuts",
      "Pine Nuts, Raw",
      "pine nuts",
      "raw pine nuts",
      "pignoli",
      "pine nut"
    ],
    "tags": [
      "nuts",
      "generic",
      "whole-food",
      "unsalted",
      "pine-nut",
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
      "calories": 673,
      "protein": 13.69,
      "carbs": 13.08,
      "fat": 68.37,
      "fiber": 3.7,
      "sugar": 3.59
    },
    "servings": [
      {
        "id": "1-oz",
        "label": "1 oz",
        "amount": 1,
        "unit": "oz",
        "grams": 28.35,
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
    "source": "AriFoodNutsCore",
    "verified": true,
    "metadata": {
      "foodFamily": "nuts",
      "nutType": "pine-nut",
      "culinaryNut": true,
      "botanicalLegume": false,
      "genericFood": true,
      "brandSpecific": false,
      "salted": false,
      "flavored": false,
      "coated": false,
      "nutButter": false,
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "sourceProvenance": {
        "provider": "USDA FoodData Central / Standard Reference",
        "sourceType": "frozen generic reference nutrition",
        "sourceUrl": "https://fdc.nal.usda.gov/",
        "verifiedAt": "2026-08-03"
      },
      "offlineReference": true,
      "notes": "Generic unsalted nut reference. Salted, oil-roasted, honey-roasted, candied, flavored, coated, and nut-butter products must remain separate records."
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
    ARI_NUT_CORE_FOODS,
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
        ARI_NUT_CORE_FOODS.length,

      nutTypes: Array.from(
        new Set(
          ARI_NUT_CORE_FOODS.map(
            food => food.metadata?.nutType
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

      defaultServing: {
        label: "1 oz",
        grams: 28.35
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} nut-core record(s).`,
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

  global.AriFoodNutsCore = Object.freeze({
    VERSION,
    MODULE_NAME,
    VERIFIED_AT,

    count() {
      return ARI_NUT_CORE_FOODS.length;
    },

    getFoodIds() {
      return ARI_NUT_CORE_FOODS.map(
        food => food.id
      );
    },

    getNutTypes() {
      return Array.from(
        new Set(
          ARI_NUT_CORE_FOODS.map(
            food => food.metadata?.nutType
          )
        )
      );
    },

    getByNutType(nutType) {
      const normalized =
        normalizeText(nutType);

      return ARI_NUT_CORE_FOODS
        .filter(
          food =>
            normalizeText(
              food.metadata?.nutType
            ) === normalized
        )
        .map(clone);
    },

    getByPreparation(preparation) {
      const normalized =
        normalizeText(preparation);

      return ARI_NUT_CORE_FOODS
        .filter(
          food =>
            normalizeText(
              food.preparation
            ) === normalized
        )
        .map(clone);
    },

    getRecord(foodId) {
      const record =
        ARI_NUT_CORE_FOODS.find(
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
        "ari:food-nuts-core-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_NUT_CORE_FOODS.length,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_NUT_CORE_FOODS.length} generic nut records.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
