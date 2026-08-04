// =====================================================
// ARI REBIRTH
// File: AriFoodLiquorBrands.js
// Version: 1.0.0
//
// Purpose:
//   Brand-first distilled-liquor database for ARI
//   Nutrition's Spirits pathway.
//
// Collection:
//   AriFoodSpirits
//
// Coverage:
//   20 mainstream branded liquor products spanning:
//   - Vodka
//   - Tequila
//   - Rum
//   - Gin
//   - Bourbon / American whiskey
//   - Canadian whisky
//   - Irish whiskey
//   - Scotch whisky
//   - Cognac
//
// Canonical basis:
//   100 mL.
//
// Default serving:
//   1.5 fl oz / 44.36 mL.
//
// Alcohol tracking:
//   Verified product ABV, pure alcohol grams per serving,
//   proof, and U.S. standard drinks per serving.
//
// Nutrition policy:
//   Manufacturer nutrition when published.
//   Otherwise calories are explicitly modeled from verified
//   ABV using ethanol density and 7 kcal/g alcohol.
//
// Strategy:
//   BRAND FIRST. Generic distilled spirits are fallback only.
//
// Dependencies:
//   - AriFoodRegistry v2+
//   - AriFoodSpirits v1+
// =====================================================

(function initializeAriFoodLiquorBrands(global) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "AriFoodLiquorBrands";
  const VERIFIED_AT = "2026-08-03";

  const ETHANOL_DENSITY_G_PER_ML = 0.789;
  const ETHANOL_KCAL_PER_G = 7.0;
  const STANDARD_DRINK_G = 14.0;
  const DEFAULT_SERVING_ML = 44.36;

  const SOURCE_POLICY = Object.freeze(
{
    "version": "1.0.0",
    "verifiedAt": "2026-08-03",
    "runtimeInternetRequired": false,
    "strategy": "brand-first distilled-liquor module for the Spirits pathway",
    "recordCount": 20,
    "brands": [
      "Absolut",
      "BACARDÃ",
      "Bombay Sapphire",
      "Bulleit",
      "Captain Morgan",
      "Casamigos",
      "Chivas Regal",
      "Crown Royal",
      "Don Julio",
      "GREY GOOSE",
      "Hennessy",
      "Jack Daniel's",
      "Jameson",
      "Jim Beam",
      "Johnnie Walker",
      "Jose Cuervo",
      "Maker's Mark",
      "PATRÃN",
      "Tanqueray",
      "Tito's"
    ],
    "liquorTypes": [
      "bourbon",
      "cognac",
      "gin",
      "rum",
      "tequila",
      "vodka",
      "whiskey",
      "whisky"
    ],
    "canonicalBasis": {
      "type": "volume",
      "amount": 100,
      "unit": "mL",
      "milliliters": 100
    },
    "defaultServing": {
      "label": "1.5 fl oz shot",
      "amount": 1.5,
      "unit": "fl oz",
      "milliliters": 44.36
    },
    "standardDrink": {
      "country": "United States",
      "gramsPureAlcohol": 14,
      "provider": "NIAAA"
    },
    "nutritionModel": {
      "ethanolDensityGramsPerMilliliter": 0.789,
      "ethanolCaloriesPerGram": 7.0,
      "method": "When an exact manufacturer nutrition panel is unavailable, ARI models calories from verified ABV and serving volume. This is explicitly marked as modeled nutrition rather than manufacturer-published nutrition."
    },
    "sourceHierarchy": [
      "Official current U.S. manufacturer/distillery product page",
      "Official manufacturer legal product statement for ABV/proof",
      "Official manufacturer nutrition information when published",
      "NIAAA for the U.S. 14 g standard-drink definition"
    ],
    "rules": [
      "Exact branded liquor records outrank AriFoodSpiritsCore.",
      "Use the product's verified ABV; do not assume every liquor is 40% ABV.",
      "Default liquor serving is 1.5 fl oz (44.36 mL).",
      "Pure alcohol grams are calculated from serving mL Ã ABV fraction Ã 0.789 g/mL ethanol.",
      "U.S. standard drinks are pure alcohol grams divided by 14 g.",
      "When a current manufacturer publishes exact calories/macros, preserve them in metadata.manufacturerNutrition.",
      "When a full nutrition panel is not published, do not falsely label modeled calories as manufacturer nutrition.",
      "Modeled calories use ethanol grams Ã 7 kcal/g and are explicitly identified as estimates.",
      "Flavored spirits, liqueurs, cream liqueurs, premixed cocktails, and products with meaningful added carbohydrate should use product-specific nutrition rather than this plain-distilled-spirit model.",
      "No runtime internet connection is required."
    ]
  }
  );

  const PRODUCT_SPECS = Object.freeze(
[
    {
      "id": "spirits-liquor-titos-handmade-vodka",
      "name": "Handmade Vodka",
      "displayName": "Tito's Handmade Vodka",
      "brand": "Tito's",
      "liquorType": "vodka",
      "style": "unflavored-vodka",
      "abv": 40.0,
      "aliases": [
        "Tito's",
        "Titos",
        "Tito's Vodka",
        "Titos Vodka"
      ],
      "provider": "Tito's Handmade Vodka",
      "url": "https://www.titosvodka.com/",
      "sourceType": "official manufacturer site / legal product statement"
    },
    {
      "id": "spirits-liquor-absolut-vodka-original",
      "name": "Vodka Original",
      "displayName": "Absolut Vodka Original",
      "brand": "Absolut",
      "liquorType": "vodka",
      "style": "unflavored-vodka",
      "abv": 40.0,
      "aliases": [
        "Absolut",
        "Absolut Vodka",
        "Absolut Original"
      ],
      "provider": "Absolut",
      "url": "https://www.absolut.com/en-us/products/absolut-vodka/",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-grey-goose-vodka",
      "name": "Vodka",
      "displayName": "GREY GOOSE Vodka",
      "brand": "GREY GOOSE",
      "liquorType": "vodka",
      "style": "unflavored-vodka",
      "abv": 40.0,
      "aliases": [
        "Grey Goose",
        "Grey Goose Vodka",
        "GREY GOOSE"
      ],
      "provider": "GREY GOOSE",
      "url": "https://www.greygoose.com/products/grey-goose-vodka.html",
      "sourceType": "official manufacturer product and nutrition page",
      "publishedServingCalories": 98,
      "publishedServingMilliliters": 44
    },
    {
      "id": "spirits-liquor-patron-silver",
      "name": "Silver",
      "displayName": "PATRÃN Silver",
      "brand": "PATRÃN",
      "liquorType": "tequila",
      "style": "blanco-silver-tequila",
      "abv": 40.0,
      "aliases": [
        "Patron Silver",
        "PatrÃ³n Silver",
        "Patron tequila",
        "PatrÃ³n tequila"
      ],
      "provider": "PATRÃN",
      "url": "https://www.patrontequila.com/products/patron-silver.html",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-don-julio-blanco",
      "name": "Blanco",
      "displayName": "Don Julio Blanco Tequila",
      "brand": "Don Julio",
      "liquorType": "tequila",
      "style": "blanco-silver-tequila",
      "abv": 40.0,
      "aliases": [
        "Don Julio Blanco",
        "Don Julio Silver",
        "Don Julio tequila"
      ],
      "provider": "Don Julio",
      "url": "https://www.donjulio.com/es-us/nuestros-tequilas/don-julio-blanco-tequila",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-casamigos-blanco",
      "name": "Blanco",
      "displayName": "Casamigos Blanco Tequila",
      "brand": "Casamigos",
      "liquorType": "tequila",
      "style": "blanco-silver-tequila",
      "abv": 40.0,
      "aliases": [
        "Casamigos Blanco",
        "Casamigos tequila"
      ],
      "provider": "Casamigos",
      "url": "https://www.casamigos.com/en-us/our-tequilas/blanco",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-jose-cuervo-especial-silver",
      "name": "Especial Silver",
      "displayName": "Jose Cuervo Especial Silver",
      "brand": "Jose Cuervo",
      "liquorType": "tequila",
      "style": "silver-tequila",
      "abv": 40.0,
      "aliases": [
        "Cuervo Silver",
        "Jose Cuervo Silver",
        "Jose Cuervo Especial",
        "Cuervo Especial Silver"
      ],
      "provider": "Jose Cuervo",
      "url": "https://cuervo.com/products/especial-silver/",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-bacardi-superior",
      "name": "Superior",
      "displayName": "BACARDÃ Superior White Rum",
      "brand": "BACARDÃ",
      "liquorType": "rum",
      "style": "white-rum",
      "abv": 40.0,
      "aliases": [
        "Bacardi Superior",
        "Bacardi White Rum",
        "BACARDÃ Superior",
        "Bacardi rum"
      ],
      "provider": "BACARDÃ",
      "url": "https://shop.bacardi.com/collections/all-products/products/bacardi-superior",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-captain-morgan-white-rum",
      "name": "White Rum",
      "displayName": "Captain Morgan White Rum",
      "brand": "Captain Morgan",
      "liquorType": "rum",
      "style": "white-rum",
      "abv": 40.0,
      "aliases": [
        "Captain Morgan White",
        "Captain Morgan White Rum",
        "Captain Morgan rum"
      ],
      "provider": "Captain Morgan",
      "url": "https://www.captainmorgan.com/en-us/products/captain-morgan-white-rum",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-tanqueray-london-dry-gin",
      "name": "London Dry Gin",
      "displayName": "Tanqueray London Dry Gin",
      "brand": "Tanqueray",
      "liquorType": "gin",
      "style": "london-dry-gin",
      "abv": 47.3,
      "aliases": [
        "Tanqueray",
        "Tanqueray Gin",
        "Tanqueray London Dry"
      ],
      "provider": "Tanqueray",
      "url": "https://www.tanqueray.com/en-us/tanqueray-london-dry-gin",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-bombay-sapphire-gin",
      "name": "Sapphire Gin",
      "displayName": "Bombay Sapphire Gin",
      "brand": "Bombay Sapphire",
      "liquorType": "gin",
      "style": "london-dry-gin",
      "abv": 47.0,
      "aliases": [
        "Bombay Sapphire",
        "Bombay Gin",
        "Bombay Sapphire Gin"
      ],
      "provider": "Bombay Sapphire",
      "url": "https://www.bombaysapphire.com/us/en/",
      "sourceType": "official manufacturer U.S. site / legal product statement"
    },
    {
      "id": "spirits-liquor-jack-daniels-old-no-7",
      "name": "Old No. 7",
      "displayName": "Jack Daniel's Old No. 7 Tennessee Whiskey",
      "brand": "Jack Daniel's",
      "liquorType": "whiskey",
      "style": "tennessee-whiskey",
      "abv": 40.0,
      "aliases": [
        "Jack Daniels",
        "Jack Daniel's",
        "Jack Daniel's Old No 7",
        "Jack whiskey"
      ],
      "provider": "Jack Daniel's",
      "url": "https://www.jackdaniels.com/",
      "sourceType": "official manufacturer site / legal product statement"
    },
    {
      "id": "spirits-liquor-jim-beam-original",
      "name": "Original",
      "displayName": "Jim Beam Kentucky Straight Bourbon Whiskey",
      "brand": "Jim Beam",
      "liquorType": "bourbon",
      "style": "kentucky-straight-bourbon",
      "abv": 40.0,
      "aliases": [
        "Jim Beam",
        "Jim Beam Original",
        "Jim Beam bourbon"
      ],
      "provider": "Jim Beam",
      "url": "https://www.jimbeam.com/en-us/bourbons/jim-beam",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-makers-mark",
      "name": "Kentucky Straight Bourbon",
      "displayName": "Maker's Mark Kentucky Straight Bourbon Whisky",
      "brand": "Maker's Mark",
      "liquorType": "bourbon",
      "style": "kentucky-straight-bourbon",
      "abv": 45.0,
      "aliases": [
        "Maker's Mark",
        "Makers Mark",
        "Maker's Mark bourbon"
      ],
      "provider": "Maker's Mark",
      "url": "https://www.makersmark.com/en-us/bourbons",
      "sourceType": "official manufacturer product collection / legal product statement"
    },
    {
      "id": "spirits-liquor-bulleit-bourbon",
      "name": "Bourbon",
      "displayName": "Bulleit Bourbon",
      "brand": "Bulleit",
      "liquorType": "bourbon",
      "style": "kentucky-straight-bourbon",
      "abv": 45.0,
      "aliases": [
        "Bulleit",
        "Bulleit Bourbon",
        "Bulleit whiskey"
      ],
      "provider": "Bulleit",
      "url": "https://www.bulleit.com/whiskeys/bulleit-bourbon",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-crown-royal-deluxe",
      "name": "Fine De Luxe",
      "displayName": "Crown Royal Fine De Luxe Canadian Whisky",
      "brand": "Crown Royal",
      "liquorType": "whisky",
      "style": "canadian-blended-whisky",
      "abv": 40.0,
      "aliases": [
        "Crown Royal",
        "Crown Royal Deluxe",
        "Crown Royal whisky"
      ],
      "provider": "Crown Royal",
      "url": "https://www.crownroyal.com/canadian-whisky/crown-royal-deluxe",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-jameson-original",
      "name": "Original",
      "displayName": "Jameson Original Irish Whiskey",
      "brand": "Jameson",
      "liquorType": "whiskey",
      "style": "irish-whiskey",
      "abv": 40.0,
      "aliases": [
        "Jameson",
        "Jameson Original",
        "Jameson Irish Whiskey"
      ],
      "provider": "Jameson",
      "url": "https://www.jamesonwhiskey.com/en-us/our-whiskey/",
      "sourceType": "official manufacturer site; Original identity/ABV cross-check"
    },
    {
      "id": "spirits-liquor-johnnie-walker-black-label",
      "name": "Black Label",
      "displayName": "Johnnie Walker Black Label",
      "brand": "Johnnie Walker",
      "liquorType": "whisky",
      "style": "blended-scotch-whisky",
      "abv": 40.0,
      "aliases": [
        "Johnnie Walker Black",
        "Johnnie Walker Black Label",
        "JW Black"
      ],
      "provider": "Johnnie Walker",
      "url": "https://www.johnniewalker.com/en-us/our-whisky/core-range/johnnie-walker-black-label",
      "sourceType": "official manufacturer product page"
    },
    {
      "id": "spirits-liquor-chivas-regal-12",
      "name": "12 Year",
      "displayName": "Chivas Regal 12",
      "brand": "Chivas Regal",
      "liquorType": "whisky",
      "style": "blended-scotch-whisky",
      "abv": 40.0,
      "aliases": [
        "Chivas",
        "Chivas Regal",
        "Chivas 12",
        "Chivas Regal 12"
      ],
      "provider": "Chivas Regal",
      "url": "https://www.chivas.com/en-us/collection/chivas-12/",
      "sourceType": "official manufacturer product and nutrition page"
    },
    {
      "id": "spirits-liquor-hennessy-vs",
      "name": "Very Special",
      "displayName": "Hennessy V.S",
      "brand": "Hennessy",
      "liquorType": "cognac",
      "style": "cognac-vs",
      "abv": 40.0,
      "aliases": [
        "Hennessy",
        "Hennessy VS",
        "Henny",
        "Hennessy Very Special"
      ],
      "provider": "Hennessy",
      "url": "https://www.hennessy.com/en-int/collection/hennessy-very-special",
      "sourceType": "official manufacturer product page"
    }
  ]
  );

  function round(value, digits = 3) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  function buildAlcoholMetrics(abvPercent) {
    const abv = Number(abvPercent);
    const alcoholGramsPer100mL =
      100 * (abv / 100) * ETHANOL_DENSITY_G_PER_ML;

    const alcoholGramsPerServing =
      DEFAULT_SERVING_ML *
      (abv / 100) *
      ETHANOL_DENSITY_G_PER_ML;

    return {
      abvPercent: round(abv, 2),
      proofApprox: round(abv * 2, 1),
      alcoholGramsPerServing:
        round(alcoholGramsPerServing, 2),
      standardDrinksPerServing:
        round(alcoholGramsPerServing / STANDARD_DRINK_G, 2),
      standardDrinkDefinition:
        "United States: 14 g pure alcohol",
      standardDrinkBasisGrams:
        STANDARD_DRINK_G,
      ethanolDensityGramsPerMilliliter:
        ETHANOL_DENSITY_G_PER_ML,
      calculationMethod:
        "serving mL Ã ABV fraction Ã 0.789 g/mL ethanol"
    };
  }

  function buildNutrition(spec) {
    const abv = Number(spec.abv);
    const alcoholPer100mL =
      100 * (abv / 100) * ETHANOL_DENSITY_G_PER_ML;

    const modeledCaloriesPer100mL =
      alcoholPer100mL * ETHANOL_KCAL_PER_G;

    return {
      calories: round(modeledCaloriesPer100mL, 2),
      protein: 0,
      carbs: 0,
      fat: 0,
      alcohol: round(alcoholPer100mL, 3)
    };
  }

  function buildManufacturerNutrition(spec) {
    if (
      !Number.isFinite(Number(spec.publishedServingCalories))
    ) {
      return null;
    }

    return {
      servingSize:
        `1.5 fl oz (${Number(spec.publishedServingMilliliters) || DEFAULT_SERVING_ML} mL)`,
      servingMilliliters:
        Number(spec.publishedServingMilliliters) ||
        DEFAULT_SERVING_ML,
      calories:
        Number(spec.publishedServingCalories),
      carbs: 0,
      fat: 0,
      protein: 0,
      source:
        spec.provider
    };
  }

  function createLiquorRecord(spec) {
    const alcohol =
      buildAlcoholMetrics(spec.abv);

    const manufacturerNutrition =
      buildManufacturerNutrition(spec);

    const modeledServingCalories =
      round(
        alcohol.alcoholGramsPerServing *
        ETHANOL_KCAL_PER_G,
        1
      );

    return {
      id: spec.id,
      name: spec.name,
      displayName: spec.displayName,
      brand: spec.brand,

      category: "spirits",
      state: "ready-to-drink",
      preparation: "packaged-or-poured",

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
        "liquor",
        "distilled-spirit",
        "branded",
        slug(spec.liquorType),
        slug(spec.style),
        slug(spec.brand)
      ],

      popularity: 100,

      nutritionBasis: {
        type: "volume",
        amount: 100,
        unit: "mL",
        milliliters: 100
      },

      nutrition:
        buildNutrition(spec),

      servings: [
        {
          id: "1-5-fl-oz",
          label: "1.5 fl oz shot",
          amount: 1.5,
          unit: "fl oz",
          milliliters: DEFAULT_SERVING_ML,
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
        spiritType: "liquor",
        liquorType: spec.liquorType,
        liquorStyle: spec.style,

        brandSpecific: true,
        abvVerified: true,
        fullNutritionLabelVerified:
          Boolean(manufacturerNutrition),

        dataVerifiedAt: VERIFIED_AT,

        confidence:
          manufacturerNutrition
            ? "high"
            : "medium-high",

        referenceBasis:
          manufacturerNutrition
            ? "100 mL modeled from verified ABV; manufacturer serving nutrition retained separately"
            : "100 mL modeled from verified ABV for a plain distilled-spirit product",

        nutritionMethod: {
          type:
            manufacturerNutrition
              ? "abv-model-with-manufacturer-cross-check"
              : "abv-model",
          modeled: true,
          caloriesPerServing:
            modeledServingCalories,
          ethanolCaloriesPerGram:
            ETHANOL_KCAL_PER_G,
          notes:
            "Modeled calories are not presented as a manufacturer Nutrition Facts panel unless manufacturerNutrition is populated."
        },

        manufacturerNutrition,

        alcohol,

        sourceProvenance: {
          provider: spec.provider,
          sourceType: spec.sourceType,
          sourceUrl: spec.url,
          verifiedAt: VERIFIED_AT
        },

        offlineReference: true,

        normalizationMethod:
          "Product identity and ABV are frozen from the cited manufacturer source. Pure alcohol grams use volume Ã ABV Ã 0.789 g/mL. Modeled energy uses pure alcohol grams Ã 7 kcal/g and is normalized to 100 mL.",

        notes:
          "For flavored, sweetened, cream-based, or liqueur products, use a product-specific record with verified carbohydrate/sugar/calorie data rather than this plain-distilled-spirit model."
      }
    };
  }

  const ARI_LIQUOR_BRAND_FOODS =
    PRODUCT_SPECS.map(createLiquorRecord);

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
      ARI_LIQUOR_BRAND_FOODS,
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
        ARI_LIQUOR_BRAND_FOODS.length,

      brandCount:
        new Set(
          ARI_LIQUOR_BRAND_FOODS.map(
            food => food.brand
          )
        ).size,

      liquorTypes:
        Array.from(
          new Set(
            ARI_LIQUOR_BRAND_FOODS.map(
              food =>
                food.metadata?.liquorType
            )
          )
        ),

      runtimeInternetRequired: false,
      brandFirst: true,
      alcoholTracked: true,
      modeledNutrition:
        true,

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
      `Registration rejected ${registration.rejected} liquor-brand record(s).`,
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

  global.AriFoodLiquorBrands =
    Object.freeze({
      VERSION,
      MODULE_NAME,
      VERIFIED_AT,

      count() {
        return ARI_LIQUOR_BRAND_FOODS.length;
      },

      getFoodIds() {
        return ARI_LIQUOR_BRAND_FOODS.map(
          food => food.id
        );
      },

      getBrands() {
        return Array.from(
          new Set(
            ARI_LIQUOR_BRAND_FOODS.map(
              food => food.brand
            )
          )
        );
      },

      getLiquorTypes() {
        return Array.from(
          new Set(
            ARI_LIQUOR_BRAND_FOODS.map(
              food =>
                food.metadata?.liquorType
            )
          )
        );
      },

      getByBrand(brand) {
        const normalized =
          String(brand || "")
            .trim()
            .toLowerCase();

        return ARI_LIQUOR_BRAND_FOODS
          .filter(
            food =>
              String(
                food.brand || ""
              ).toLowerCase() ===
              normalized
          )
          .map(clone);
      },

      getByType(liquorType) {
        const normalized =
          String(liquorType || "")
            .trim()
            .toLowerCase();

        return ARI_LIQUOR_BRAND_FOODS
          .filter(
            food =>
              String(
                food.metadata?.liquorType ||
                ""
              ).toLowerCase() ===
              normalized
          )
          .map(clone);
      },

      getByAbvRange(
        minAbv = 0,
        maxAbv = Infinity
      ) {
        const min = Number(minAbv);
        const max = Number(maxAbv);

        return ARI_LIQUOR_BRAND_FOODS
          .filter(
            food => {
              const abv =
                Number(
                  food.metadata
                    ?.alcohol
                    ?.abvPercent
                );

              return (
                Number.isFinite(abv) &&
                abv >= min &&
                abv <= max
              );
            }
          )
          .map(clone);
      },

      getStandardDrinks(foodId) {
        const record =
          ARI_LIQUOR_BRAND_FOODS.find(
            food =>
              food.id ===
              String(
                foodId || ""
              ).trim()
          );

        return record
          ? Number(
              record.metadata
                ?.alcohol
                ?.standardDrinksPerServing
            )
          : null;
      },

      getAlcoholMetrics(foodId) {
        const record =
          ARI_LIQUOR_BRAND_FOODS.find(
            food =>
              food.id ===
              String(
                foodId || ""
              ).trim()
          );

        return record
          ? clone(
              record.metadata?.alcohol
            )
          : null;
      },

      getRecord(foodId) {
        const record =
          ARI_LIQUOR_BRAND_FOODS.find(
            food =>
              food.id ===
              String(
                foodId || ""
              ).trim()
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
        "ari:food-liquor-brands-ready",
        {
          detail: {
            version: VERSION,
            module: MODULE_NAME,
            verifiedAt: VERIFIED_AT,

            foodCount:
              ARI_LIQUOR_BRAND_FOODS.length,

            brandCount:
              moduleResult.metadata.brandCount,

            alcoholTracked:
              true,

            modeledNutrition:
              true,

            standardDrinkBasisGrams:
              STANDARD_DRINK_G,

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
    `[ARI Nutrition] ${MODULE_NAME} v${VERSION} loaded ${ARI_LIQUOR_BRAND_FOODS.length} branded liquor records across ${moduleResult.metadata.brandCount} brands.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
