// =====================================================
// ARI REBIRTH
// File: AriFoodBeef.js
// Version: 1.0.0
//
// Purpose:
//   Production-oriented offline beef reference data
//   for ARI Nutrition.
//
// Collection:
//   AriFoodProteins
//
// Coverage:
//   - Ground beef 80/20, 85/15, 90/10, 93/7, 95/5
//   - Raw and cooked ground-beef references
//   - Ribeye
//   - Top sirloin
//   - Top round
//   - Flank steak
//   - Inside skirt
//   - Tenderloin / filet
//   - New York strip / top loin
//   - Chuck roast / chuck eye / pot roast
//   - Brisket flat
//
// Source policy:
//   - USDA Foundation Foods first for current analytic
//     raw generic cuts when available.
//   - USDA SR Legacy for exact cooked preparations and
//     classic lean-percentage references.
//   - Nutrition stored per 100 g edible portion.
//   - No live internet is required at runtime.
//   - No fabricated cooking-method conversions.
//   - Added oil, butter, sauces, marinades, breading,
//     cheese, buns, etc. are NOT included unless the
//     source description explicitly includes them.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodProteins v1+ (recommended for tracking)
// =====================================================

(function initializeAriFoodBeef(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodBeef";
  const VERIFIED_AT = "2026-08-03";

  const SOURCE_POLICY = Object.freeze(
    {
  "version": "1.0.0",
  "verifiedAt": "2026-08-03",
  "runtimeInternetRequired": false,
  "primaryHierarchy": [
    "USDA FoodData Central Foundation Foods for current analytically sampled generic raw beef where available",
    "USDA FoodData Central SR Legacy for exact cooked preparations and lean-percentage references"
  ],
  "rules": [
    "Store nutrition per 100 g edible portion.",
    "Keep raw and cooked foods as separate records.",
    "Keep ground-beef lean percentages as separate records.",
    "Use exact source-supported cooking methods rather than inventing generic grilled/baked/fried conversions.",
    "Do not use restaurant, branded, seasoned, marinated, sauced, or butter/oil-added beef as a generic reference.",
    "Use Atwater specific energy for current Foundation records when the source publishes both general and specific energy; retain alternate general energy in provenance.",
    "Every production record includes an auditable USDA description and an FDC/NDB identifier when confidently resolved.",
    "Only nutrients listed in metadata.verifiedNutrients should be treated as verified."
  ]
}
  );

  const ARI_BEEF_FOODS =
    [
  {
    "id": "ground-beef-80-20-raw",
    "name": "Ground Beef 80/20",
    "displayName": "Ground Beef 80/20 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground beef",
      "80 20 ground beef",
      "80% lean beef",
      "hamburger meat 80 20"
    ],
    "tags": [
      "beef",
      "ground",
      "80-20"
    ],
    "popularity": 100,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 254,
      "protein": 17.17,
      "carbs": 0,
      "fat": 20.0,
      "sodium": 66,
      "potassium": 270
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 80% lean meat / 20% fat, raw",
        "fdcId": 174036,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-85-15-raw",
    "name": "Ground Beef 85/15",
    "displayName": "Ground Beef 85/15 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground beef",
      "85 15 ground beef",
      "85% lean beef",
      "hamburger meat 85 15"
    ],
    "tags": [
      "beef",
      "ground",
      "85-15"
    ],
    "popularity": 97,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 215,
      "protein": 18.59,
      "carbs": 0,
      "fat": 15.0,
      "sodium": 66,
      "potassium": 295,
      "saturatedFat": 5.715,
      "cholesterol": 68
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 85% lean meat / 15% fat, raw",
        "fdcId": 171796,
        "ndbNumber": "23567",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-90-10-raw",
    "name": "Ground Beef 90/10",
    "displayName": "Ground Beef 90/10 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground beef",
      "90 10 ground beef",
      "90% lean beef",
      "lean ground beef"
    ],
    "tags": [
      "beef",
      "ground",
      "90-10"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 176,
      "protein": 20.0,
      "carbs": 0,
      "fat": 10.0,
      "sodium": 66,
      "potassium": 321
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 90% lean meat / 10% fat, raw",
        "fdcId": 174030,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-93-7-raw",
    "name": "Ground Beef 93/7",
    "displayName": "Ground Beef 93/7 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground beef",
      "93 7 ground beef",
      "93% lean beef",
      "lean ground beef 93"
    ],
    "tags": [
      "beef",
      "ground",
      "93-7"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 152,
      "protein": 20.85,
      "carbs": 0,
      "fat": 7.0,
      "sodium": 66,
      "potassium": 336
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 93% lean meat / 7% fat, raw",
        "fdcId": 173110,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-95-5-raw",
    "name": "Ground Beef 95/5",
    "displayName": "Ground Beef 95/5 â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ground beef",
      "95 5 ground beef",
      "95% lean beef",
      "extra lean ground beef"
    ],
    "tags": [
      "beef",
      "ground",
      "95-5",
      "extra-lean"
    ],
    "popularity": 95,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 137,
      "protein": 21.41,
      "carbs": 0,
      "fat": 5.0,
      "sodium": 66,
      "potassium": 346
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 95% lean meat / 5% fat, raw",
        "fdcId": 171790,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-80-20-pan-broiled",
    "name": "Ground Beef 80/20",
    "displayName": "Ground Beef 80/20 â Pan-Broiled",
    "category": "protein",
    "state": "cooked",
    "preparation": "pan broiled",
    "aliases": [
      "cooked ground beef",
      "80 20 cooked ground beef",
      "hamburger patty 80 20",
      "pan fried ground beef 80 20"
    ],
    "tags": [
      "beef",
      "ground",
      "80-20",
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
      "calories": 246,
      "protein": 24.04,
      "carbs": 0,
      "fat": 15.94,
      "saturatedFat": 6.051,
      "cholesterol": 86
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 80% lean meat / 20% fat, patty, cooked, pan-broiled",
        "ndbNumber": "23574",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Use this for plain pan-cooked 80/20 beef where rendered fat is allowed to drain. Added oil, cheese, bun, or sauce must be logged separately."
    }
  },
  {
    "id": "ground-beef-85-15-broiled",
    "name": "Ground Beef 85/15",
    "displayName": "Ground Beef 85/15 â Broiled",
    "category": "protein",
    "state": "cooked",
    "preparation": "broiled",
    "aliases": [
      "cooked ground beef",
      "85 15 cooked ground beef",
      "hamburger patty 85 15",
      "broiled burger patty"
    ],
    "tags": [
      "beef",
      "ground",
      "85-15",
      "cooked"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 250,
      "protein": 25.93,
      "carbs": 0,
      "fat": 15.41,
      "sodium": 72,
      "potassium": 318,
      "saturatedFat": 5.9,
      "cholesterol": 88
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled",
        "fdcId": 174032,
        "ndbNumber": "23568",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-90-10-broiled",
    "name": "Ground Beef 90/10",
    "displayName": "Ground Beef 90/10 â Broiled",
    "category": "protein",
    "state": "cooked",
    "preparation": "broiled",
    "aliases": [
      "cooked ground beef",
      "90 10 cooked ground beef",
      "hamburger patty 90 10",
      "broiled lean burger"
    ],
    "tags": [
      "beef",
      "ground",
      "90-10",
      "cooked"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 217,
      "protein": 26.11,
      "carbs": 0,
      "fat": 11.75,
      "sodium": 68,
      "potassium": 333
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 90% lean meat / 10% fat, patty, cooked, broiled",
        "fdcId": 174031,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "ground-beef-95-5-broiled",
    "name": "Ground Beef 95/5",
    "displayName": "Ground Beef 95/5 â Broiled",
    "category": "protein",
    "state": "cooked",
    "preparation": "broiled",
    "aliases": [
      "cooked ground beef",
      "95 5 cooked ground beef",
      "extra lean burger patty",
      "broiled extra lean ground beef"
    ],
    "tags": [
      "beef",
      "ground",
      "95-5",
      "extra-lean",
      "cooked"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 174,
      "protein": 26.29,
      "carbs": 0,
      "fat": 6.8,
      "saturatedFat": 2.98,
      "cholesterol": 88
    },
    "servings": [
      {
        "id": "4-oz-patty",
        "label": "1 Ã 4 oz patty",
        "amount": 1,
        "unit": "patty",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, ground, 95% lean meat / 5% fat, patty, cooked, broiled",
        "fdcId": 171791,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-ribeye-boneless-choice-raw",
    "name": "Ribeye Steak",
    "displayName": "Ribeye Steak â Boneless, Choice, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "ribeye",
      "rib eye",
      "ribeye steak",
      "boneless ribeye",
      "choice ribeye"
    ],
    "tags": [
      "beef",
      "ribeye",
      "steak",
      "choice",
      "boneless"
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
      "protein": 18.7,
      "carbs": 0,
      "fat": 20.0,
      "sodium": 43,
      "potassium": 288,
      "saturatedFat": 8.0,
      "cholesterol": 63,
      "transFat": 0.97
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Beef, ribeye, steak, boneless, choice, raw",
        "fdcId": 2646172,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 254
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol",
        "transFat"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-chuck-roast-boneless-choice-raw",
    "name": "Chuck Roast",
    "displayName": "Chuck Roast â Boneless, Choice, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "chuck roast",
      "beef chuck roast",
      "boneless chuck roast",
      "pot roast raw"
    ],
    "tags": [
      "beef",
      "chuck",
      "roast",
      "choice",
      "boneless"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 237,
      "protein": 18.4,
      "carbs": 0,
      "fat": 17.8,
      "sodium": 48.4,
      "potassium": 281.1,
      "saturatedFat": 6.3,
      "cholesterol": 66.8,
      "transFat": 0.67
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Beef, chuck, roast, boneless, choice, raw",
        "fdcId": 2646174,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 232
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol",
        "transFat"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-flank-steak-boneless-choice-raw",
    "name": "Flank Steak",
    "displayName": "Flank Steak â Boneless, Choice, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "flank steak",
      "beef flank",
      "boneless flank steak",
      "choice flank steak"
    ],
    "tags": [
      "beef",
      "flank",
      "steak",
      "choice",
      "boneless"
    ],
    "popularity": 93,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 171,
      "protein": 20.13,
      "carbs": 0,
      "fat": 9.4,
      "sodium": 51.3,
      "potassium": 331.8,
      "cholesterol": 57.7
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Beef, flank, steak, boneless, choice, raw",
        "fdcId": 2646175,
        "release": "April 2026",
        "energyMethod": "Atwater specific"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-top-round-boneless-choice-raw",
    "name": "Top Round",
    "displayName": "Top Round â Boneless, Choice, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "top round",
      "top round steak",
      "beef top round",
      "boneless top round"
    ],
    "tags": [
      "beef",
      "round",
      "top-round",
      "choice",
      "boneless"
    ],
    "popularity": 90,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 146,
      "protein": 21.5,
      "carbs": 0.85,
      "fat": 5.7,
      "sodium": 46,
      "potassium": 352,
      "saturatedFat": 1.7,
      "cholesterol": 59,
      "transFat": 0.23
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Beef, round, top round, boneless, choice, raw",
        "fdcId": 2646173,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 141
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol",
        "transFat"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-top-sirloin-steak-raw",
    "name": "Top Sirloin Steak",
    "displayName": "Top Sirloin Steak â Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "top sirloin",
      "sirloin steak",
      "top sirloin steak",
      "beef sirloin"
    ],
    "tags": [
      "beef",
      "sirloin",
      "top-sirloin",
      "steak"
    ],
    "popularity": 98,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 146,
      "protein": 22.0,
      "carbs": 0.22,
      "fat": 5.7,
      "sodium": 43,
      "potassium": 349,
      "cholesterol": 60
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "Foundation Foods",
        "sourceDescription": "Beef, top sirloin steak, raw",
        "fdcId": 2727574,
        "release": "April 2026",
        "energyMethod": "Atwater specific",
        "alternateEnergyKcalPer100g": 140
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-inside-skirt-choice-raw",
    "name": "Inside Skirt Steak",
    "displayName": "Inside Skirt Steak â Choice, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "skirt steak",
      "inside skirt",
      "inside skirt steak",
      "carne asada steak"
    ],
    "tags": [
      "beef",
      "skirt",
      "inside-skirt",
      "steak",
      "choice"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 195,
      "protein": 20.1,
      "carbs": 0,
      "fat": 12.8,
      "sodium": 65
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, plate steak, boneless, inside skirt, separable lean and fat, trimmed to 0\" fat, choice, raw",
        "fdcId": 172159,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-tenderloin-steak-select-raw",
    "name": "Beef Tenderloin",
    "displayName": "Beef Tenderloin Steak â Select, Raw",
    "category": "protein",
    "state": "raw",
    "preparation": "raw",
    "aliases": [
      "beef tenderloin",
      "tenderloin steak",
      "filet mignon raw",
      "filet steak"
    ],
    "tags": [
      "beef",
      "tenderloin",
      "filet",
      "steak",
      "select"
    ],
    "popularity": 96,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 142,
      "protein": 21.9,
      "carbs": 0,
      "fat": 6.0
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, loin, tenderloin steak, boneless, separable lean and fat, trimmed to 0\" fat, select, raw",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-flank-steak-choice-broiled-lean",
    "name": "Flank Steak",
    "displayName": "Flank Steak â Choice, Broiled, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "broiled",
    "aliases": [
      "cooked flank steak",
      "broiled flank steak",
      "grilled flank steak lean",
      "flank steak cooked"
    ],
    "tags": [
      "beef",
      "flank",
      "steak",
      "choice",
      "lean-only"
    ],
    "popularity": 94,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 194,
      "protein": 27.82,
      "carbs": 0,
      "fat": 8.32,
      "sodium": 56,
      "potassium": 338,
      "saturatedFat": 3.452,
      "cholesterol": 80
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, flank, steak, separable lean only, trimmed to 0\" fat, choice, cooked, broiled",
        "fdcId": 168611,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Use for plain dry-heat flank steak with visible external fat trimmed. Added marinades, oil, butter, or sauce must be logged separately."
    }
  },
  {
    "id": "beef-top-round-choice-grilled-lean",
    "name": "Top Round Steak",
    "displayName": "Top Round Steak â Choice, Grilled, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "cooked top round",
      "grilled top round steak",
      "lean top round steak",
      "top round cooked"
    ],
    "tags": [
      "beef",
      "round",
      "top-round",
      "steak",
      "choice",
      "lean-only"
    ],
    "popularity": 88,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 166,
      "protein": 30.24,
      "carbs": 0,
      "fat": 4.11,
      "sodium": 78,
      "potassium": 429,
      "saturatedFat": 1.562,
      "cholesterol": 85,
      "transFat": 0.18
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, round, top round steak, boneless, separable lean only, trimmed to 0\" fat, choice, cooked, grilled",
        "fdcId": 169471,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol",
        "transFat"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-chuck-eye-steak-choice-grilled",
    "name": "Chuck Eye Steak",
    "displayName": "Chuck Eye Steak â Choice, Grilled",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "chuck eye steak",
      "grilled chuck eye",
      "poor mans ribeye",
      "chuck steak grilled"
    ],
    "tags": [
      "beef",
      "chuck",
      "chuck-eye",
      "steak",
      "choice"
    ],
    "popularity": 83,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 283,
      "protein": 24.95,
      "carbs": 0,
      "fat": 20.35,
      "sodium": 71,
      "potassium": 333
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, chuck eye steak, boneless, separable lean and fat, trimmed to 0\" fat, choice, cooked, grilled",
        "fdcId": 171229,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-top-loin-strip-choice-grilled",
    "name": "New York Strip Steak",
    "displayName": "New York Strip Steak â Choice, Grilled",
    "category": "protein",
    "state": "cooked",
    "preparation": "grilled",
    "aliases": [
      "new york strip",
      "ny strip",
      "strip steak",
      "top loin steak",
      "grilled strip steak"
    ],
    "tags": [
      "beef",
      "strip",
      "ny-strip",
      "top-loin",
      "steak",
      "choice"
    ],
    "popularity": 99,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 275,
      "protein": 25.69,
      "carbs": 0,
      "fat": 19.19,
      "sodium": 54,
      "potassium": 259
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, loin, top loin steak, boneless, lip-on, separable lean and fat, trimmed to 1/8\" fat, choice, cooked, grilled",
        "fdcId": 174712,
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-brisket-flat-select-braised-lean",
    "name": "Beef Brisket",
    "displayName": "Beef Brisket Flat â Select, Braised, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "braised",
    "aliases": [
      "beef brisket",
      "brisket flat",
      "braised brisket",
      "lean brisket"
    ],
    "tags": [
      "beef",
      "brisket",
      "flat",
      "select",
      "lean-only"
    ],
    "popularity": 91,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 189,
      "protein": 33.2,
      "carbs": 0,
      "fat": 5.21,
      "sodium": 55,
      "potassium": 273,
      "saturatedFat": 1.97,
      "cholesterol": 98
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, brisket, flat half, separable lean only, trimmed to 1/8\" fat, select, cooked, braised",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
    }
  },
  {
    "id": "beef-chuck-arm-pot-roast-choice-braised-lean",
    "name": "Chuck Arm Pot Roast",
    "displayName": "Chuck Arm Pot Roast â Choice, Braised, Lean Only",
    "category": "protein",
    "state": "cooked",
    "preparation": "braised",
    "aliases": [
      "pot roast",
      "chuck pot roast",
      "braised chuck roast",
      "chuck arm roast"
    ],
    "tags": [
      "beef",
      "chuck",
      "pot-roast",
      "choice",
      "lean-only"
    ],
    "popularity": 89,
    "nutritionBasis": {
      "type": "weight",
      "amount": 100,
      "unit": "g",
      "grams": 100
    },
    "nutrition": {
      "calories": 180.2,
      "protein": 28.36,
      "carbs": 0,
      "fat": 6.52,
      "sodium": 45.9,
      "potassium": 222.7,
      "saturatedFat": 2.47,
      "cholesterol": 64.6
    },
    "servings": [
      {
        "id": "4-oz",
        "label": "4 oz",
        "amount": 4,
        "unit": "oz",
        "grams": 113.398,
        "isDefault": true
      }
    ],
    "source": "AriFoodBeef",
    "verified": true,
    "metadata": {
      "foodFamily": "beef",
      "dataVerifiedAt": "2026-08-03",
      "confidence": "high",
      "referenceBasis": "100 g edible portion",
      "sourceProvenance": {
        "provider": "USDA Agricultural Research Service",
        "database": "FoodData Central",
        "dataset": "SR Legacy",
        "sourceDescription": "Beef, chuck, arm pot roast, separable lean only, trimmed to 0\" fat, choice, cooked, braised",
        "release": "April 2018 (final)"
      },
      "verifiedNutrients": [
        "calories",
        "protein",
        "carbs",
        "fat",
        "sodium",
        "potassium",
        "saturatedFat",
        "cholesterol"
      ],
      "nutrientCoverage": "Macros are production-verified. Additional nutrients are verified only when explicitly listed in verifiedNutrients.",
      "offlineReference": true,
      "notes": "Generic reference beef value. Actual nutrition varies with grade, trim, marbling, cooking loss, retained fat, added oil, seasoning, and product formulation."
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
      global.AriFoodProteins &&
      typeof global.AriFoodProteins.markModuleFailed === "function"
    ) {
      global.AriFoodProteins.markModuleFailed(
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
    markFailed(
      "AriFoodRegistry.registerMany() is unavailable."
    );
    return;
  }

  // Clear prior AriFoodBeef records on hot reload so a
  // stale older module cannot coexist with this dataset.
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
      ARI_BEEF_FOODS,
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
      foodCount: ARI_BEEF_FOODS.length,
      runtimeInternetRequired: false,
      sourcePolicy: clone(SOURCE_POLICY),
      groups: [
        "ground-beef",
        "steaks",
        "roasts",
        "brisket"
      ]
    }
  };

  if (
    registration.rejected > 0
  ) {
    markFailed(
      `Registration rejected ${registration.rejected} beef record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodProteins &&
    typeof global.AriFoodProteins.markModuleLoaded === "function"
  ) {
    global.AriFoodProteins.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodBeef =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_BEEF_FOODS.length;
      },

      getFoodIds() {
        return ARI_BEEF_FOODS.map(
          food => food.id
        );
      },

      getSourcePolicy() {
        return clone(SOURCE_POLICY);
      },

      getRecord(foodId) {
        const id =
          String(foodId || "").trim();

        const record =
          ARI_BEEF_FOODS.find(
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
        "ari:food-beef-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount: ARI_BEEF_FOODS.length,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_BEEF_FOODS.length} verified-source beef reference records for offline use.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
