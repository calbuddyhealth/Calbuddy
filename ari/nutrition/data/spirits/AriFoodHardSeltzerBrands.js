// =====================================================
// ARI REBIRTH
// File: AriFoodHardSeltzerBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first hard-seltzer database for ARI Nutrition's
//   Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// V1 coverage:
//   - White Claw
//   - Truly
//   - High Noon
//   - NÜTRL
//   - Vizzy
//   - Topo Chico
//
// Records:
//   20 mainstream branded hard-seltzer / vodka-seltzer
//   products.
//
// Canonical basis:
//   100 mL.
//
// Default serving:
//   12 fl oz / 355 mL can.
//
// Alcohol tracking:
//   Product ABV, pure alcohol grams per can, and U.S.
//   standard drinks per can.
//
// Strategy:
//   BRAND FIRST. Generic alcohol records are fallback only.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1+
//
// Controller note:
//   AriFoodSpirits must include "AriFoodHardSeltzerBrands"
//   in EXPECTED_MODULES and BRAND_MODULES if controller
//   readiness/coverage tracking is desired.
// =====================================================

(function initializeAriFoodHardSeltzerBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodHardSeltzerBrands";
  const VERIFIED_AT = "2026-08-03";

  const DEFAULT_CAN_ML = 355;
  const ETHANOL_DENSITY_G_PER_ML = 0.789;
  const STANDARD_DRINK_G = 14;

  const SOURCE_POLICY = Object.freeze(
{
    "version": "1.0.0",
    "verifiedAt": "2026-08-03",
    "runtimeInternetRequired": false,
    "strategy": "brand-first hard-seltzer and spirits-based seltzer module for the ARI Spirits pathway",
    "recordCount": 20,
    "brands": [
      "High Noon",
      "NÜTRL",
      "Topo Chico",
      "Truly",
      "Vizzy",
      "White Claw"
    ],
    "canonicalBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "defaultServing": {
      "label": "1 can",
      "amount": 12,
      "unit": "fl oz",
      "milliliters": 355
    },
    "standardDrink": {
      "country": "United States",
      "gramsPureAlcohol": 14,
      "provider": "NIAAA"
    },
    "sourceHierarchy": [
      "Official current U.S. manufacturer product or nutrition page",
      "Official SmartLabel / manufacturer-controlled label data",
      "Current retailer package-label capture when manufacturer site omits a nutrient value",
      "Current brand nutrition database cross-check for label-only values"
    ],
    "rules": [
      "Hard-seltzer branded records outrank AriFoodSpiritsCore generic alcohol fallbacks.",
      "Preserve exact product ABV instead of assuming all hard seltzers are 5% ABV.",
      "Canonical nutrition is normalized mathematically to 100 mL.",
      "Default serving is one 12 fl oz / 355 mL can.",
      "Pure alcohol grams use serving mL × ABV fraction × 0.789 g/mL ethanol.",
      "U.S. standard drinks use 14 g pure alcohol per standard drink.",
      "Keep fermented-base hard seltzers and vodka-based seltzers identifiable through metadata.alcoholBase.",
      "Do not merge high-ABV lines such as White Claw Surge or Truly Unruly into standard 4.5–5% records.",
      "Do not merge canned cocktails, hard teas, lemonade cocktails, or malt beverages into this file when they belong to a dedicated Spirits brand module.",
      "No runtime internet connection is required."
    ]
  }
  );

  const PRODUCT_SPECS = Object.freeze(
[
    {
      "id": "spirits-hard-seltzer-white-claw-black-cherry",
      "name": "Black Cherry",
      "displayName": "White Claw Hard Seltzer Black Cherry",
      "brand": "White Claw",
      "flavor": "black-cherry",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "White Claw Black Cherry",
        "Black Cherry White Claw",
        "White Claw cherry"
      ],
      "url": "https://shop.whiteclaw.com/products/white-claw_black_cherry_12pk_12oz_can_5_0_abv",
      "sourceType": "official manufacturer shop / product page"
    },
    {
      "id": "spirits-hard-seltzer-white-claw-mango",
      "name": "Mango",
      "displayName": "White Claw Hard Seltzer Mango",
      "brand": "White Claw",
      "flavor": "mango",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "White Claw Mango",
        "Mango White Claw"
      ],
      "url": "https://www.whiteclaw.com/products/",
      "sourceType": "official manufacturer product lineup"
    },
    {
      "id": "spirits-hard-seltzer-white-claw-natural-lime",
      "name": "Natural Lime",
      "displayName": "White Claw Hard Seltzer Natural Lime",
      "brand": "White Claw",
      "flavor": "natural-lime",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "White Claw Lime",
        "White Claw Natural Lime",
        "Lime White Claw"
      ],
      "url": "https://www.whiteclaw.com/products/",
      "sourceType": "official manufacturer product lineup"
    },
    {
      "id": "spirits-hard-seltzer-white-claw-ruby-grapefruit",
      "name": "Ruby Grapefruit",
      "displayName": "White Claw Hard Seltzer Ruby Grapefruit",
      "brand": "White Claw",
      "flavor": "ruby-grapefruit",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "White Claw Grapefruit",
        "White Claw Ruby Grapefruit",
        "Grapefruit White Claw"
      ],
      "url": "https://www.whiteclaw.com/products/",
      "sourceType": "official manufacturer product lineup"
    },
    {
      "id": "spirits-hard-seltzer-truly-wild-berry",
      "name": "Wild Berry",
      "displayName": "Truly Hard Seltzer Wild Berry",
      "brand": "Truly",
      "flavor": "wild-berry",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-cane-sugar",
      "aliases": [
        "Truly Wild Berry",
        "Wild Berry Truly"
      ],
      "url": "https://www.trulyhardseltzer.com/nutrition",
      "sourceType": "official manufacturer nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-truly-lemon",
      "name": "Lemon",
      "displayName": "Truly Hard Seltzer Lemon",
      "brand": "Truly",
      "flavor": "lemon",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-cane-sugar",
      "aliases": [
        "Truly Lemon",
        "Lemon Truly"
      ],
      "url": "https://www.trulyhardseltzer.com/flavors/lemon",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-truly-original-lemonade",
      "name": "Original Lemonade",
      "displayName": "Truly Hard Seltzer Original Lemonade",
      "brand": "Truly",
      "flavor": "original-lemonade",
      "abv": 5.0,
      "calories": 100,
      "carbs": 3.0,
      "sugar": 1.0,
      "base": "fermented-cane-sugar",
      "aliases": [
        "Truly Original Lemonade",
        "Truly Lemonade",
        "Original Lemonade Truly"
      ],
      "url": "https://www.trulyhardseltzer.com/flavors/original-lemonade",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-truly-watermelon-lemonade",
      "name": "Watermelon Lemonade",
      "displayName": "Truly Hard Seltzer Watermelon Lemonade",
      "brand": "Truly",
      "flavor": "watermelon-lemonade",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-cane-sugar",
      "aliases": [
        "Truly Watermelon Lemonade",
        "Watermelon Lemonade Truly"
      ],
      "url": "https://www.trulyhardseltzer.com/flavors/watermelon-lemonade",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-high-noon-pineapple",
      "name": "Pineapple Vodka Seltzer",
      "displayName": "High Noon Pineapple Vodka Seltzer",
      "brand": "High Noon",
      "flavor": "pineapple",
      "abv": 4.5,
      "calories": 100,
      "carbs": 3.0,
      "sugar": 3.0,
      "base": "vodka",
      "aliases": [
        "High Noon Pineapple",
        "Pineapple High Noon",
        "High Noon Pineapple Vodka Soda"
      ],
      "url": "https://www.highnoonspirits.com/vodkaSeltzer-flavors.html",
      "sourceType": "official manufacturer product lineup; current package-label cross-check"
    },
    {
      "id": "spirits-hard-seltzer-high-noon-watermelon",
      "name": "Watermelon Vodka Seltzer",
      "displayName": "High Noon Watermelon Vodka Seltzer",
      "brand": "High Noon",
      "flavor": "watermelon",
      "abv": 4.5,
      "calories": 100,
      "carbs": 3.0,
      "sugar": 3.0,
      "base": "vodka",
      "aliases": [
        "High Noon Watermelon",
        "Watermelon High Noon",
        "High Noon Watermelon Vodka Soda"
      ],
      "url": "https://www.highnoonspirits.com/vodkaSeltzer-flavors.html",
      "sourceType": "official manufacturer product lineup; current package-label cross-check"
    },
    {
      "id": "spirits-hard-seltzer-high-noon-black-cherry",
      "name": "Black Cherry Vodka Seltzer",
      "displayName": "High Noon Black Cherry Vodka Seltzer",
      "brand": "High Noon",
      "flavor": "black-cherry",
      "abv": 4.5,
      "calories": 100,
      "carbs": 3.0,
      "sugar": 3.0,
      "base": "vodka",
      "aliases": [
        "High Noon Black Cherry",
        "Black Cherry High Noon",
        "High Noon Cherry"
      ],
      "url": "https://www.highnoonspirits.com/vodkaSeltzer-flavors.html",
      "sourceType": "official manufacturer product lineup; current package-label cross-check"
    },
    {
      "id": "spirits-hard-seltzer-high-noon-grapefruit",
      "name": "Grapefruit Vodka Seltzer",
      "displayName": "High Noon Grapefruit Vodka Seltzer",
      "brand": "High Noon",
      "flavor": "grapefruit",
      "abv": 4.5,
      "calories": 100,
      "carbs": 3.0,
      "sugar": 3.0,
      "base": "vodka",
      "aliases": [
        "High Noon Grapefruit",
        "Grapefruit High Noon"
      ],
      "url": "https://www.highnoonspirits.com/vodkaSeltzer-flavors.html",
      "sourceType": "official manufacturer product lineup; current package-label cross-check"
    },
    {
      "id": "spirits-hard-seltzer-nutrl-pineapple",
      "name": "Pineapple Vodka Seltzer",
      "displayName": "NÜTRL Pineapple Vodka Seltzer",
      "brand": "NÜTRL",
      "flavor": "pineapple",
      "abv": 4.5,
      "calories": 100,
      "carbs": 4.4,
      "sugar": 0.0,
      "base": "vodka",
      "aliases": [
        "NUTRL Pineapple",
        "NÜTRL Pineapple",
        "Nutrl Pineapple Vodka Seltzer"
      ],
      "url": "https://www.nutrlusa.com/",
      "sourceType": "official manufacturer product lineup; current nutrition database cross-check"
    },
    {
      "id": "spirits-hard-seltzer-nutrl-watermelon",
      "name": "Watermelon Vodka Seltzer",
      "displayName": "NÜTRL Watermelon Vodka Seltzer",
      "brand": "NÜTRL",
      "flavor": "watermelon",
      "abv": 4.5,
      "calories": 100,
      "carbs": 3.8,
      "sugar": 0.0,
      "base": "vodka",
      "aliases": [
        "NUTRL Watermelon",
        "NÜTRL Watermelon",
        "Nutrl Watermelon Vodka Seltzer"
      ],
      "url": "https://www.nutrlusa.com/",
      "sourceType": "official manufacturer product lineup; current retailer nutrition panel"
    },
    {
      "id": "spirits-hard-seltzer-nutrl-black-cherry",
      "name": "Black Cherry Vodka Seltzer",
      "displayName": "NÜTRL Black Cherry Vodka Seltzer",
      "brand": "NÜTRL",
      "flavor": "black-cherry",
      "abv": 4.5,
      "calories": 100,
      "carbs": 5.1,
      "sugar": 0.0,
      "base": "vodka",
      "aliases": [
        "NUTRL Black Cherry",
        "NÜTRL Black Cherry",
        "Nutrl Black Cherry Vodka Seltzer"
      ],
      "url": "https://www.nutrlusa.com/",
      "sourceType": "official manufacturer product lineup; current retailer nutrition cross-check"
    },
    {
      "id": "spirits-hard-seltzer-nutrl-strawberry",
      "name": "Strawberry Vodka Seltzer",
      "displayName": "NÜTRL Strawberry Vodka Seltzer",
      "brand": "NÜTRL",
      "flavor": "strawberry",
      "abv": 4.5,
      "calories": 100,
      "carbs": 4.0,
      "sugar": 0.0,
      "base": "vodka",
      "aliases": [
        "NUTRL Strawberry",
        "NÜTRL Strawberry",
        "Nutrl Strawberry Vodka Seltzer"
      ],
      "url": "https://www.nutrlusa.com/",
      "sourceType": "official manufacturer product lineup; current retailer nutrition panel"
    },
    {
      "id": "spirits-hard-seltzer-vizzy-pineapple-mango",
      "name": "Pineapple Mango",
      "displayName": "Vizzy Hard Seltzer Pineapple Mango",
      "brand": "Vizzy",
      "flavor": "pineapple-mango",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "Vizzy Pineapple Mango",
        "Pineapple Mango Vizzy"
      ],
      "url": "https://www.vizzyhardseltzer.com/",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-vizzy-blueberry-pomegranate",
      "name": "Blueberry Pomegranate",
      "displayName": "Vizzy Hard Seltzer Blueberry Pomegranate",
      "brand": "Vizzy",
      "flavor": "blueberry-pomegranate",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "Vizzy Blueberry Pomegranate",
        "Blueberry Pomegranate Vizzy"
      ],
      "url": "https://www.vizzyhardseltzer.com/",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-vizzy-strawberry-kiwi",
      "name": "Strawberry Kiwi",
      "displayName": "Vizzy Hard Seltzer Strawberry Kiwi",
      "brand": "Vizzy",
      "flavor": "strawberry-kiwi",
      "abv": 5.0,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 1.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "Vizzy Strawberry Kiwi",
        "Strawberry Kiwi Vizzy"
      ],
      "url": "https://www.vizzyhardseltzer.com/",
      "sourceType": "official manufacturer product / nutrition page"
    },
    {
      "id": "spirits-hard-seltzer-topo-chico-ranch-water",
      "name": "Ranch Water",
      "displayName": "Topo Chico Ranch Water Hard Seltzer",
      "brand": "Topo Chico",
      "flavor": "ranch-water-lime",
      "abv": 4.7,
      "calories": 100,
      "carbs": 2.0,
      "sugar": 0.0,
      "base": "fermented-alcohol-base",
      "aliases": [
        "Topo Chico Ranch Water",
        "Topo Chico Hard Seltzer Ranch Water",
        "Ranch Water Topo Chico"
      ],
      "url": "https://smartlabel.topochicohardseltzerusa.com/hard-seltzer/ranch-water",
      "sourceType": "official SmartLabel / manufacturer nutrition page"
    }
  ]
  );

  function round(value, digits = 3) {
    const factor = 10 ** digits;
    return Math.round(
      (Number(value) + Number.EPSILON) * factor
    ) / factor;
  }

  function clone(value) {
    try {
      return typeof structuredClone === "function"
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizePer100mL(spec) {
    const factor = 100 / DEFAULT_CAN_ML;

    return {
      calories: round(spec.calories * factor, 3),
      protein: 0,
      carbs: round(spec.carbs * factor, 3),
      fat: 0,
      sugar: round(spec.sugar * factor, 3)
    };
  }

  function buildAlcohol(abvPercent) {
    const abv = Number(abvPercent);

    const alcoholGramsPerServing =
      DEFAULT_CAN_ML *
      (abv / 100) *
      ETHANOL_DENSITY_G_PER_ML;

    return {
      abvPercent: round(abv, 2),
      alcoholGramsPerServing:
        round(alcoholGramsPerServing, 2),
      standardDrinksPerServing:
        round(
          alcoholGramsPerServing /
          STANDARD_DRINK_G,
          2
        ),
      standardDrinkDefinition:
        "United States: 14 g pure alcohol",
      standardDrinkBasisGrams:
        STANDARD_DRINK_G,
      servingMilliliters:
        DEFAULT_CAN_ML,
      calculationMethod:
        "355 mL × ABV fraction × 0.789 g/mL ethanol"
    };
  }

  function createRecord(spec) {
    const alcohol = buildAlcohol(spec.abv);

    return {
      id: spec.id,
      name: spec.name,
      displayName: spec.displayName,
      brand: spec.brand,

      category: "spirits",
      state: "ready-to-drink",
      preparation: "packaged",

      aliases: Array.from(
        new Set([
          spec.displayName,
          spec.brand,
          spec.name,
          ...(Array.isArray(spec.aliases)
            ? spec.aliases
            : [])
        ])
      ),

      tags: [
        "spirits",
        "alcohol",
        "hard-seltzer",
        "seltzer",
        "ready-to-drink",
        "branded",
        slug(spec.brand),
        slug(spec.flavor),
        slug(spec.base)
      ],

      popularity: 100,

      nutritionBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },

      nutrition:
        normalizePer100mL(spec),

      servings: [
        {
          id: "12-fl-oz-can",
          label: "1 can (12 fl oz)",
          amount: 12,
          unit: "fl oz",
          milliliters: DEFAULT_CAN_ML,
          isDefault: true
        },
        {
          id: "100-ml",
          label: "100 mL",
          amount: 100,
          unit: "mL",
          milliliters: 100,
          isDefault: false
        }
      ],

      source: MODULE_NAME,
      verified: true,

      metadata: {
        foodFamily: "spirits",
        spiritType: "hard-seltzer",
        hardSeltzerStyle:
          spec.base === "vodka"
            ? "spirits-based-seltzer"
            : "fermented-base-hard-seltzer",

        flavor: spec.flavor,
        alcoholBase: spec.base,

        brandSpecific: true,
        abvVerified: true,
        nutritionLabelVerified: true,

        dataVerifiedAt: VERIFIED_AT,
        confidence: "high",

        labelNutrition: {
          servingSize: "1 can (12 fl oz / 355 mL)",
          servingMilliliters: DEFAULT_CAN_ML,
          calories: spec.calories,
          protein: 0,
          carbs: spec.carbs,
          fat: 0,
          sugar: spec.sugar
        },

        alcohol,

        sourceProvenance: {
          provider: spec.brand,
          sourceType: spec.sourceType,
          sourceUrl: spec.url,
          verifiedAt: VERIFIED_AT
        },

        offlineReference: true,

        normalizationMethod:
          "Current per-can product nutrition was normalized mathematically from 355 mL to the ARI Spirits canonical basis of 100 mL.",

        notes:
          "This record represents the standard-strength branded product named here. Higher-ABV, cocktail, tea, lemonade, and other materially different lines must remain separate records."
      }
    };
  }

  const ARI_HARD_SELTZER_BRAND_FOODS =
    PRODUCT_SPECS.map(createRecord);

  function controllerExpectsThisModule() {
    if (!global.AriFoodSpirits) {
      return false;
    }

    if (
      typeof global.AriFoodSpirits.isExpectedModule ===
      "function"
    ) {
      try {
        return global.AriFoodSpirits.isExpectedModule(
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
      global.AriFoodSpirits &&
      controllerExpectsThisModule() &&
      typeof global.AriFoodSpirits.markModuleFailed ===
        "function"
    ) {
      global.AriFoodSpirits.markModuleFailed(
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
      ARI_HARD_SELTZER_BRAND_FOODS,
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
        ARI_HARD_SELTZER_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_HARD_SELTZER_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      brands:
        Array.from(
          new Set(
            ARI_HARD_SELTZER_BRAND_FOODS.map(
              food => food.brand
            )
          )
        ),

      runtimeInternetRequired: false,
      brandFirst: true,
      alcoholTracked: true,

      standardDrinkBasisGrams:
        STANDARD_DRINK_G,

      canonicalBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },

      sourcePolicy:
        clone(SOURCE_POLICY)
    }
  };

  if (registration.rejected > 0) {
    reportFailure(
      `Registration rejected ${registration.rejected} hard-seltzer record(s).`,
      moduleResult.metadata
    );
  } else if (
    global.AriFoodSpirits &&
    controllerExpectsThisModule() &&
    typeof global.AriFoodSpirits.markModuleLoaded ===
      "function"
  ) {
    global.AriFoodSpirits.markModuleLoaded(
      MODULE_NAME,
      moduleResult
    );
  }

  global.AriFoodHardSeltzerBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_HARD_SELTZER_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_HARD_SELTZER_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_HARD_SELTZER_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_HARD_SELTZER_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() === normalized
          )
          .map(clone);
      },

      getByFlavor(flavor) {
        const normalized =
          slug(flavor);

        return ARI_HARD_SELTZER_BRAND_FOODS
          .filter(
            food =>
              slug(
                food.metadata?.flavor
              ) === normalized
          )
          .map(clone);
      },

      getByAlcoholBase(alcoholBase) {
        const normalized =
          slug(alcoholBase);

        return ARI_HARD_SELTZER_BRAND_FOODS
          .filter(
            food =>
              slug(
                food.metadata?.alcoholBase
              ) === normalized
          )
          .map(clone);
      },

      getAlcoholMetrics(foodId) {
        const record =
          ARI_HARD_SELTZER_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? clone(record.metadata?.alcohol)
          : null;
      },

      getStandardDrinks(foodId) {
        const record =
          ARI_HARD_SELTZER_BRAND_FOODS.find(
            food =>
              food.id ===
              String(foodId || "").trim()
          );

        return record
          ? Number(
              record.metadata
                ?.alcohol
                ?.standardDrinksPerServing
            )
          : null;
      },

      getRecord(foodId) {
        const record =
          ARI_HARD_SELTZER_BRAND_FOODS.find(
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
        "ari:food-hard-seltzer-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,
            foodCount:
              ARI_HARD_SELTZER_BRAND_FOODS.length,
            brandCount:
              moduleResult.metadata.brandCount,
            alcoholTracked: true,
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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_HARD_SELTZER_BRAND_FOODS.length} branded hard-seltzer records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
