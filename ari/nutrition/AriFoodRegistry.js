// =====================================================
// ARI REBIRTH
// File: AriFoodRegistry.js
// Version: 2.0.1
//
// Purpose:
//   Canonical food knowledge registry for ARI Nutrition.
//
// Architectural flow:
//
//   ARI Food Data Modules
//          ↓
//   AriFoodRegistry
//          ↓
//   AriFoodSearch
//          ↓
//   AriFoodCalculator
//          ↓
//   Nutrition Manual Entry
//
// Core design:
//
//   Food nutrition is stored against ONE canonical
//   nutrition basis.
//
//   Examples:
//
//   Chicken:
//     165 calories per 100 g
//
//   Egg:
//     72 calories per 1 large egg
//
//   Milk:
//     149 calories per 1 cup
//
//   AriFoodCalculator uses the basis plus gram / volume /
//   unit equivalents to calculate arbitrary servings.
//
// V2.0.1:
//   - Accept nutrition.sodiumMg as an alias for sodium.
//   - Accept nutrition.potassiumMg as an alias for potassium.
//   - Accept nutrition.cholesterolMg as an alias for cholesterol.
//   - Preserve convenience servings that define grams or
//     milliliters but omit an explicit unit.
//   - Missing serving units with a valid gram/mL equivalent
//     normalize to the custom unit "serving".
//   - Keeps compatibility with existing v2.0 food modules.
//
// Responsibilities:
//   - Register canonical food records.
//   - Validate food records before registration.
//   - Normalize food records.
//   - Store nutrition basis information.
//   - Store gram equivalents when available.
//   - Store volume equivalents when available.
//   - Distinguish raw/cooked/prepared food states.
//   - Distinguish preparation methods.
//   - Support common serving definitions.
//   - Support weight, volume, and unit-based foods.
//   - Prevent duplicate IDs.
//   - Maintain lookup indexes.
//   - Expose calculator-ready food records.
//   - Expose search-ready food documents.
//   - Expose registry diagnostics.
//
// Non-responsibilities:
//   - Does not perform food autocomplete ranking.
//   - Does not calculate arbitrary serving nutrition.
//   - Does not estimate unknown foods.
//   - Does not save meals.
//   - Does not access Supabase.
//   - Does not manipulate the Nutrition UI.
// =====================================================

(function initializeAriFoodRegistry(global) {
  "use strict";

  // =====================================================
  // VERSION
  // =====================================================

  const VERSION = "2.0.1";
  const SCHEMA_VERSION = "2.0";


  // =====================================================
  // DEFAULTS
  // =====================================================

  const DEFAULT_CATEGORY = "other";
  const DEFAULT_SOURCE = "ari-food-data";

  const REQUIRED_MACROS = [
    "calories",
    "protein",
    "carbs",
    "fat"
  ];


  // =====================================================
  // UNIT DEFINITIONS
  // =====================================================

  const WEIGHT_UNITS = Object.freeze({
    g: {
      dimension: "weight",
      grams: 1
    },

    kg: {
      dimension: "weight",
      grams: 1000
    },

    oz: {
      dimension: "weight",
      grams: 28.349523125
    },

    lb: {
      dimension: "weight",
      grams: 453.59237
    }
  });


  const VOLUME_UNITS = Object.freeze({
    ml: {
      dimension: "volume",
      milliliters: 1
    },

    l: {
      dimension: "volume",
      milliliters: 1000
    },

    tsp: {
      dimension: "volume",
      milliliters: 4.92892159375
    },

    tbsp: {
      dimension: "volume",
      milliliters: 14.78676478125
    },

    "fl-oz": {
      dimension: "volume",
      milliliters: 29.5735295625
    },

    cup: {
      dimension: "volume",
      milliliters: 236.5882365
    },

    pint: {
      dimension: "volume",
      milliliters: 473.176473
    },

    quart: {
      dimension: "volume",
      milliliters: 946.352946
    },

    gallon: {
      dimension: "volume",
      milliliters: 3785.411784
    }
  });


  const UNIT_ALIASES = Object.freeze({
    // Weight
    gram: "g",
    grams: "g",
    gm: "g",
    gms: "g",

    kilogram: "kg",
    kilograms: "kg",
    kilo: "kg",
    kilos: "kg",

    ounce: "oz",
    ounces: "oz",

    pound: "lb",
    pounds: "lb",
    lbs: "lb",

    // Volume
    milliliter: "ml",
    milliliters: "ml",
    millilitre: "ml",
    millilitres: "ml",

    liter: "l",
    liters: "l",
    litre: "l",
    litres: "l",

    teaspoon: "tsp",
    teaspoons: "tsp",

    tablespoon: "tbsp",
    tablespoons: "tbsp",

    "fluid-ounce": "fl-oz",
    "fluid-ounces": "fl-oz",
    "fluid ounce": "fl-oz",
    "fluid ounces": "fl-oz",
    floz: "fl-oz",

    cups: "cup",

    pints: "pint",
    quarts: "quart",
    gallons: "gallon",

    // Generic convenience serving
    servings: "serving"
  });


  // =====================================================
  // INTERNAL STORAGE
  // =====================================================

  const foods = new Map();
  const categoryIndex = new Map();
  const nameIndex = new Map();
  const aliasIndex = new Map();
  const preparationIndex = new Map();
  const stateIndex = new Map();
  const sourceIndex = new Map();
  const brandIndex = new Map();

  const stats = {
    registered: 0,
    replaced: 0,
    rejected: 0,
    duplicates: 0,
    removed: 0,
    batches: 0,
    lastRegistrationAt: null
  };


  // =====================================================
  // GENERAL HELPERS
  // =====================================================

  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function cleanString(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function safeNumber(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }

  function positiveNumber(value, fallback = null) {
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number <= 0
    ) {
      return fallback;
    }

    return number;
  }

  function nonNegativeNumber(value, fallback = 0) {
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      return fallback;
    }

    return number;
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return undefined;
  }

  function normalizeText(value) {
    return cleanString(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeKey(value) {
    return normalizeText(value)
      .replace(/\s+/g, "-");
  }

  function uniqueStrings(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    const seen = new Set();
    const output = [];

    for (const value of values) {
      const cleaned = cleanString(value);

      if (!cleaned) {
        continue;
      }

      const normalized = normalizeText(cleaned);

      if (
        !normalized ||
        seen.has(normalized)
      ) {
        continue;
      }

      seen.add(normalized);
      output.push(cleaned);
    }

    return output;
  }

  function clone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Fall back to JSON cloning.
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }

  function normalizeUnit(unit) {
    const cleaned = cleanString(unit)
      .toLowerCase()
      .replace(/\./g, "")
      .trim();

    if (!cleaned) {
      return "";
    }

    if (UNIT_ALIASES[cleaned]) {
      return UNIT_ALIASES[cleaned];
    }

    return cleaned;
  }

  function getUnitDimension(unit) {
    const normalized =
      normalizeUnit(unit);

    if (WEIGHT_UNITS[normalized]) {
      return "weight";
    }

    if (VOLUME_UNITS[normalized]) {
      return "volume";
    }

    if (normalized) {
      return "unit";
    }

    return null;
  }

  function convertWeightToGrams(
    amount,
    unit
  ) {
    const normalized =
      normalizeUnit(unit);

    const definition =
      WEIGHT_UNITS[normalized];

    const numericAmount =
      positiveNumber(amount);

    if (
      !definition ||
      numericAmount === null
    ) {
      return null;
    }

    return (
      numericAmount *
      definition.grams
    );
  }

  function convertVolumeToMilliliters(
    amount,
    unit
  ) {
    const normalized =
      normalizeUnit(unit);

    const definition =
      VOLUME_UNITS[normalized];

    const numericAmount =
      positiveNumber(amount);

    if (
      !definition ||
      numericAmount === null
    ) {
      return null;
    }

    return (
      numericAmount *
      definition.milliliters
    );
  }


  // =====================================================
  // INDEX HELPERS
  // =====================================================

  function addToIndex(
    index,
    key,
    foodId
  ) {
    const normalized =
      normalizeText(key);

    if (!normalized) {
      return;
    }

    if (!index.has(normalized)) {
      index.set(
        normalized,
        new Set()
      );
    }

    index
      .get(normalized)
      .add(foodId);
  }

  function removeFromIndex(
    index,
    key,
    foodId
  ) {
    const normalized =
      normalizeText(key);

    if (
      !normalized ||
      !index.has(normalized)
    ) {
      return;
    }

    const ids =
      index.get(normalized);

    ids.delete(foodId);

    if (ids.size === 0) {
      index.delete(normalized);
    }
  }

  function foodsFromIdSet(
    idSet,
    options = {}
  ) {
    if (!(idSet instanceof Set)) {
      return [];
    }

    const includeDisabled =
      options.includeDisabled === true;

    const results = [];

    for (const foodId of idSet) {
      const food = foods.get(foodId);

      if (!food) {
        continue;
      }

      if (
        !includeDisabled &&
        !food.enabled
      ) {
        continue;
      }

      results.push(clone(food));
    }

    return results;
  }


  // =====================================================
  // NUTRITION NORMALIZATION
  // =====================================================

  function normalizeNutrition(
    rawNutrition
  ) {
    const nutrition =
      isPlainObject(rawNutrition)
        ? rawNutrition
        : {};

    /*
     * V2.0.1 compatibility:
     *
     * Older/core records may use:
     *   sodium
     *   potassium
     *   cholesterol
     *
     * Newer data modules may use explicit unit names:
     *   sodiumMg
     *   potassiumMg
     *   cholesterolMg
     *
     * The canonical Registry representation remains:
     *   sodium
     *   potassium
     *   cholesterol
     *
     * These values represent milligrams.
     */

    const sodium =
      firstDefined(
        nutrition.sodium,
        nutrition.sodiumMg
      );

    const potassium =
      firstDefined(
        nutrition.potassium,
        nutrition.potassiumMg
      );

    const cholesterol =
      firstDefined(
        nutrition.cholesterol,
        nutrition.cholesterolMg
      );

    return {
      calories:
        nonNegativeNumber(
          nutrition.calories
        ),

      protein:
        nonNegativeNumber(
          nutrition.protein
        ),

      carbs:
        nonNegativeNumber(
          nutrition.carbs
        ),

      fat:
        nonNegativeNumber(
          nutrition.fat
        ),

      fiber:
        nonNegativeNumber(
          nutrition.fiber
        ),

      sugar:
        nonNegativeNumber(
          nutrition.sugar
        ),

      saturatedFat:
        nonNegativeNumber(
          nutrition.saturatedFat
        ),

      transFat:
        nonNegativeNumber(
          nutrition.transFat
        ),

      cholesterol:
        nonNegativeNumber(
          cholesterol
        ),

      sodium:
        nonNegativeNumber(
          sodium
        ),

      potassium:
        nonNegativeNumber(
          potassium
        )
    };
  }


  // =====================================================
  // NUTRITION BASIS
  // =====================================================

  function normalizeNutritionBasis(
    rawBasis
  ) {
    if (!isPlainObject(rawBasis)) {
      return null;
    }

    let type =
      normalizeKey(rawBasis.type);

    const amount =
      positiveNumber(
        rawBasis.amount,
        1
      );

    const unit =
      normalizeUnit(rawBasis.unit);

    if (!type && unit) {
      type = getUnitDimension(unit);
    }

    if (
      type !== "weight" &&
      type !== "volume" &&
      type !== "unit"
    ) {
      return null;
    }

    let grams =
      positiveNumber(
        rawBasis.grams
      );

    let milliliters =
      positiveNumber(
        rawBasis.milliliters
      );

    if (
      type === "weight" &&
      grams === null
    ) {
      grams =
        convertWeightToGrams(
          amount,
          unit
        );
    }

    if (
      type === "volume" &&
      milliliters === null
    ) {
      milliliters =
        convertVolumeToMilliliters(
          amount,
          unit
        );
    }

    return {
      type,
      amount,
      unit:
        unit ||
        (
          type === "weight"
            ? "g"
            : type === "volume"
              ? "ml"
              : "serving"
        ),

      grams,
      milliliters
    };
  }


  // =====================================================
  // SERVING NORMALIZATION
  // =====================================================

  function normalizeServing(
    rawServing,
    index = 0
  ) {
    if (!isPlainObject(rawServing)) {
      return null;
    }

    const amount =
      positiveNumber(
        rawServing.amount,
        1
      );

    /*
     * Read gram/mL equivalents before deciding whether
     * the serving is valid. This allows data modules to
     * define:
     *
     * {
     *   label: "About 11 chips (28 g)",
     *   grams: 28,
     *   isDefault: true
     * }
     *
     * without also having to provide unit: "serving".
     */

    let grams =
      positiveNumber(
        rawServing.grams
      );

    let milliliters =
      positiveNumber(
        rawServing.milliliters
      );

    let unit =
      normalizeUnit(
        rawServing.unit
      );

    /*
     * V2.0.1 compatibility:
     *
     * If the record has a real gram or mL equivalent but
     * omitted its custom unit, preserve it as one generic
     * "serving" rather than discarding the serving.
     */

    if (
      !unit &&
      (
        grams !== null ||
        milliliters !== null
      )
    ) {
      unit = "serving";
    }

    if (!unit) {
      return null;
    }

    const dimension =
      getUnitDimension(unit);

    if (
      grams === null &&
      dimension === "weight"
    ) {
      grams =
        convertWeightToGrams(
          amount,
          unit
        );
    }

    if (
      milliliters === null &&
      dimension === "volume"
    ) {
      milliliters =
        convertVolumeToMilliliters(
          amount,
          unit
        );
    }

    const label =
      cleanString(rawServing.label) ||
      `${amount} ${unit}`;

    const id =
      normalizeKey(
        rawServing.id ||
        label ||
        `serving-${index + 1}`
      );

    return {
      id,
      label,
      amount,
      unit,
      dimension,
      grams,
      milliliters,

      isDefault:
        rawServing.isDefault === true
    };
  }

  function normalizeServings(
    rawServings
  ) {
    if (!Array.isArray(rawServings)) {
      return [];
    }

    const output = [];
    const seenIds = new Set();

    for (
      let index = 0;
      index < rawServings.length;
      index += 1
    ) {
      const normalized =
        normalizeServing(
          rawServings[index],
          index
        );

      if (!normalized) {
        continue;
      }

      if (
        seenIds.has(normalized.id)
      ) {
        continue;
      }

      seenIds.add(normalized.id);
      output.push(normalized);
    }

    return output;
  }


  // =====================================================
  // MEASUREMENT CAPABILITIES
  // =====================================================

  function buildMeasurementCapabilities(
    nutritionBasis,
    servings
  ) {
    let supportsWeight =
      nutritionBasis?.grams !== null &&
      nutritionBasis?.grams !== undefined;

    let supportsVolume =
      nutritionBasis?.milliliters !== null &&
      nutritionBasis?.milliliters !== undefined;

    const customUnits =
      new Set();

    for (const serving of servings) {
      if (serving.grams !== null) {
        supportsWeight = true;
      }

      if (
        serving.milliliters !== null
      ) {
        supportsVolume = true;
      }

      if (
        serving.dimension === "unit"
      ) {
        customUnits.add(
          serving.unit
        );
      }
    }

    const supportedWeightUnits =
      supportsWeight
        ? ["g", "kg", "oz", "lb"]
        : [];

    const supportedVolumeUnits =
      supportsVolume
        ? [
            "ml",
            "l",
            "tsp",
            "tbsp",
            "fl-oz",
            "cup",
            "pint",
            "quart",
            "gallon"
          ]
        : [];

    return {
      supportsWeight,
      supportsVolume,

      supportsCustomUnits:
        customUnits.size > 0,

      weightUnits:
        supportedWeightUnits,

      volumeUnits:
        supportedVolumeUnits,

      customUnits:
        Array.from(customUnits)
    };
  }


  // =====================================================
  // VALIDATION
  // =====================================================

  function validateFood(rawFood) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(rawFood)) {
      return {
        valid: false,
        errors: [
          "Food record must be an object."
        ],
        warnings: []
      };
    }

    if (!cleanString(rawFood.id)) {
      errors.push(
        "Food record requires an id."
      );
    }

    if (!cleanString(rawFood.name)) {
      errors.push(
        "Food record requires a name."
      );
    }

    if (
      !isPlainObject(
        rawFood.nutritionBasis
      )
    ) {
      errors.push(
        "Food record requires nutritionBasis."
      );
    } else {
      const basis =
        normalizeNutritionBasis(
          rawFood.nutritionBasis
        );

      if (!basis) {
        errors.push(
          "nutritionBasis is invalid."
        );
      } else {
        if (
          basis.type === "weight" &&
          basis.grams === null
        ) {
          errors.push(
            "Weight-based nutritionBasis must resolve to a gram quantity."
          );
        }

        if (
          basis.type === "volume" &&
          basis.milliliters === null
        ) {
          errors.push(
            "Volume-based nutritionBasis must resolve to a milliliter quantity."
          );
        }

        if (
          basis.type === "unit" &&
          !basis.unit
        ) {
          errors.push(
            "Unit-based nutritionBasis requires a unit."
          );
        }
      }
    }

    if (
      !isPlainObject(
        rawFood.nutrition
      )
    ) {
      errors.push(
        "Food record requires nutrition."
      );
    } else {
      for (
        const field
        of REQUIRED_MACROS
      ) {
        const value =
          rawFood.nutrition[field];

        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          errors.push(
            `nutrition.${field} is required.`
          );

          continue;
        }

        const number =
          Number(value);

        if (
          !Number.isFinite(number) ||
          number < 0
        ) {
          errors.push(
            `nutrition.${field} must be a non-negative number.`
          );
        }
      }
    }

    if (
      rawFood.aliases !== undefined &&
      !Array.isArray(
        rawFood.aliases
      )
    ) {
      errors.push(
        "aliases must be an array."
      );
    }

    if (
      rawFood.tags !== undefined &&
      !Array.isArray(
        rawFood.tags
      )
    ) {
      errors.push(
        "tags must be an array."
      );
    }

    if (
      rawFood.servings !== undefined &&
      !Array.isArray(
        rawFood.servings
      )
    ) {
      errors.push(
        "servings must be an array."
      );
    }

    if (
      rawFood.state !== undefined &&
      typeof rawFood.state !== "string"
    ) {
      errors.push(
        "state must be a string."
      );
    }

    if (
      rawFood.preparation !== undefined &&
      typeof rawFood.preparation !== "string"
    ) {
      errors.push(
        "preparation must be a string."
      );
    }

    if (!cleanString(rawFood.state)) {
      warnings.push(
        "Food state is not specified."
      );
    }

    if (
      !cleanString(
        rawFood.preparation
      )
    ) {
      warnings.push(
        "Preparation method is not specified."
      );
    }

    if (
      Array.isArray(
        rawFood.servings
      ) &&
      rawFood.servings.length === 0
    ) {
      warnings.push(
        "Food has no convenience servings."
      );
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }


  // =====================================================
  // FOOD NORMALIZATION
  // =====================================================

  function normalizeFood(
    rawFood,
    options = {}
  ) {
    const id =
      normalizeKey(rawFood.id);

    const name =
      cleanString(rawFood.name);

    const category =
      normalizeKey(
        rawFood.category
      ) ||
      DEFAULT_CATEGORY;

    const state =
      normalizeKey(
        rawFood.state
      ) ||
      null;

    const preparation =
      normalizeKey(
        rawFood.preparation
      ) ||
      null;

    const readablePreparation =
      cleanString(
        rawFood.preparation
      );

    const displayName =
      cleanString(
        rawFood.displayName
      ) ||
      (
        readablePreparation
          ? `${name} — ${readablePreparation}`
          : name
      );

    const nutritionBasis =
      normalizeNutritionBasis(
        rawFood.nutritionBasis
      );

    const servings =
      normalizeServings(
        rawFood.servings
      );

    const aliases =
      uniqueStrings([
        ...(Array.isArray(
          rawFood.aliases
        )
          ? rawFood.aliases
          : []),

        name,

        displayName,

        readablePreparation
          ? `${name} ${readablePreparation}`
          : "",

        readablePreparation
          ? `${readablePreparation} ${name}`
          : "",

        state
          ? `${name} ${state}`
          : ""
      ]);

    const tags =
      uniqueStrings(
        Array.isArray(rawFood.tags)
          ? rawFood.tags
          : []
      );

    const source =
      cleanString(
        options.source ||
        rawFood.source
      ) ||
      DEFAULT_SOURCE;

    const brand =
      cleanString(rawFood.brand) ||
      null;

    const restaurant =
      cleanString(
        rawFood.restaurant
      ) ||
      null;

    const popularity = Math.max(
      0,
      Math.min(
        100,
        safeNumber(
          rawFood.popularity,
          0
        )
      )
    );

    const measurement =
      buildMeasurementCapabilities(
        nutritionBasis,
        servings
      );

    const now =
      new Date().toISOString();

    return {
      id,
      name,
      displayName,

      category,
      state,
      preparation,

      aliases,
      tags,
      popularity,

      nutritionBasis,

      nutrition:
        normalizeNutrition(
          rawFood.nutrition
        ),

      servings,
      measurement,

      brand,
      restaurant,

      description:
        cleanString(
          rawFood.description
        ) ||
        null,

      source,

      verified:
        rawFood.verified === true,

      enabled:
        rawFood.enabled !== false,

      metadata:
        isPlainObject(
          rawFood.metadata
        )
          ? clone(
              rawFood.metadata
            )
          : {},

      registry: {
        schemaVersion:
          SCHEMA_VERSION,

        registryVersion:
          VERSION,

        registeredAt:
          now
      }
    };
  }


  // =====================================================
  // INDEX MANAGEMENT
  // =====================================================

  function indexFood(food) {
    const foodId = food.id;

    addToIndex(
      categoryIndex,
      food.category,
      foodId
    );

    addToIndex(
      nameIndex,
      food.name,
      foodId
    );

    addToIndex(
      nameIndex,
      food.displayName,
      foodId
    );

    for (
      const alias
      of food.aliases
    ) {
      addToIndex(
        aliasIndex,
        alias,
        foodId
      );
    }

    if (food.preparation) {
      addToIndex(
        preparationIndex,
        food.preparation,
        foodId
      );
    }

    if (food.state) {
      addToIndex(
        stateIndex,
        food.state,
        foodId
      );
    }

    addToIndex(
      sourceIndex,
      food.source,
      foodId
    );

    if (food.brand) {
      addToIndex(
        brandIndex,
        food.brand,
        foodId
      );
    }

    if (food.restaurant) {
      addToIndex(
        brandIndex,
        food.restaurant,
        foodId
      );
    }
  }

  function unindexFood(food) {
    const foodId = food.id;

    removeFromIndex(
      categoryIndex,
      food.category,
      foodId
    );

    removeFromIndex(
      nameIndex,
      food.name,
      foodId
    );

    removeFromIndex(
      nameIndex,
      food.displayName,
      foodId
    );

    for (
      const alias
      of food.aliases
    ) {
      removeFromIndex(
        aliasIndex,
        alias,
        foodId
      );
    }

    if (food.preparation) {
      removeFromIndex(
        preparationIndex,
        food.preparation,
        foodId
      );
    }

    if (food.state) {
      removeFromIndex(
        stateIndex,
        food.state,
        foodId
      );
    }

    removeFromIndex(
      sourceIndex,
      food.source,
      foodId
    );

    if (food.brand) {
      removeFromIndex(
        brandIndex,
        food.brand,
        foodId
      );
    }

    if (food.restaurant) {
      removeFromIndex(
        brandIndex,
        food.restaurant,
        foodId
      );
    }
  }


  // =====================================================
  // REGISTRATION
  // =====================================================

  function register(
    rawFood,
    options = {}
  ) {
    const validation =
      validateFood(rawFood);

    if (!validation.valid) {
      stats.rejected += 1;

      console.error(
        "[AriFoodRegistry] Food rejected:",
        rawFood,
        validation.errors
      );

      return {
        ok: false,
        registered: false,
        replaced: false,
        reason:
          "validation_failed",
        errors:
          validation.errors,
        warnings:
          validation.warnings,
        food: null
      };
    }

    const food =
      normalizeFood(
        rawFood,
        options
      );

    const existing =
      foods.get(food.id);

    if (existing) {
      stats.duplicates += 1;

      if (
        options.replace !== true
      ) {
        return {
          ok: false,
          registered: false,
          replaced: false,
          reason:
            "duplicate_id",
          errors: [
            `Food ID "${food.id}" is already registered.`
          ],
          warnings:
            validation.warnings,
          food:
            clone(existing)
        };
      }

      unindexFood(existing);

      foods.set(
        food.id,
        food
      );

      indexFood(food);

      stats.replaced += 1;

      stats.lastRegistrationAt =
        new Date().toISOString();

      return {
        ok: true,
        registered: true,
        replaced: true,
        errors: [],
        warnings:
          validation.warnings,
        food:
          clone(food)
      };
    }

    foods.set(
      food.id,
      food
    );

    indexFood(food);

    stats.registered += 1;

    stats.lastRegistrationAt =
      new Date().toISOString();

    return {
      ok: true,
      registered: true,
      replaced: false,
      errors: [],
      warnings:
        validation.warnings,
      food:
        clone(food)
    };
  }


  // =====================================================
  // BATCH REGISTRATION
  // =====================================================

  function registerMany(
    rawFoods,
    options = {}
  ) {
    if (!Array.isArray(rawFoods)) {
      return {
        ok: false,
        total: 0,
        registered: 0,
        replaced: 0,
        rejected: 0,
        duplicates: 0,
        results: [],
        error:
          "registerMany requires an array."
      };
    }

    stats.batches += 1;

    const results = [];

    let registeredCount = 0;
    let replacedCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;

    for (const rawFood of rawFoods) {
      const result =
        register(
          rawFood,
          options
        );

      results.push(result);

      if (
        result.registered &&
        result.replaced
      ) {
        replacedCount += 1;
        continue;
      }

      if (result.registered) {
        registeredCount += 1;
        continue;
      }

      if (
        result.reason ===
        "duplicate_id"
      ) {
        duplicateCount += 1;
        continue;
      }

      rejectedCount += 1;
    }

    return {
      ok:
        rejectedCount === 0 &&
        duplicateCount === 0,

      total:
        rawFoods.length,

      registered:
        registeredCount,

      replaced:
        replacedCount,

      rejected:
        rejectedCount,

      duplicates:
        duplicateCount,

      results
    };
  }


  // =====================================================
  // REMOVE
  // =====================================================

  function remove(foodId) {
    const id =
      normalizeKey(foodId);

    if (!id) {
      return false;
    }

    const food =
      foods.get(id);

    if (!food) {
      return false;
    }

    unindexFood(food);

    foods.delete(id);

    stats.removed += 1;

    return true;
  }


  // =====================================================
  // BASIC LOOKUPS
  // =====================================================

  function has(foodId) {
    return foods.has(
      normalizeKey(foodId)
    );
  }

  function getById(foodId) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    return food
      ? clone(food)
      : null;
  }

  function getAll(options = {}) {
    const includeDisabled =
      options.includeDisabled === true;

    const results = [];

    for (
      const food
      of foods.values()
    ) {
      if (
        !includeDisabled &&
        !food.enabled
      ) {
        continue;
      }

      results.push(
        clone(food)
      );
    }

    return results;
  }

  function count(options = {}) {
    if (
      options.includeDisabled === true
    ) {
      return foods.size;
    }

    let enabled = 0;

    for (
      const food
      of foods.values()
    ) {
      if (food.enabled) {
        enabled += 1;
      }
    }

    return enabled;
  }


  // =====================================================
  // INDEXED LOOKUPS
  // =====================================================

  function getByCategory(
    category,
    options = {}
  ) {
    return foodsFromIdSet(
      categoryIndex.get(
        normalizeText(category)
      ),
      options
    );
  }

  function getByName(
    name,
    options = {}
  ) {
    return foodsFromIdSet(
      nameIndex.get(
        normalizeText(name)
      ),
      options
    );
  }

  function getByAlias(
    alias,
    options = {}
  ) {
    return foodsFromIdSet(
      aliasIndex.get(
        normalizeText(alias)
      ),
      options
    );
  }

  function getByPreparation(
    preparation,
    options = {}
  ) {
    return foodsFromIdSet(
      preparationIndex.get(
        normalizeText(preparation)
      ),
      options
    );
  }

  function getByState(
    state,
    options = {}
  ) {
    return foodsFromIdSet(
      stateIndex.get(
        normalizeText(state)
      ),
      options
    );
  }

  function getBySource(
    source,
    options = {}
  ) {
    return foodsFromIdSet(
      sourceIndex.get(
        normalizeText(source)
      ),
      options
    );
  }

  function getByBrand(
    brand,
    options = {}
  ) {
    return foodsFromIdSet(
      brandIndex.get(
        normalizeText(brand)
      ),
      options
    );
  }


  // =====================================================
  // INDEX VALUES
  // =====================================================

  function getCategories() {
    return Array.from(
      categoryIndex.keys()
    ).sort();
  }

  function getPreparations() {
    return Array.from(
      preparationIndex.keys()
    ).sort();
  }

  function getStates() {
    return Array.from(
      stateIndex.keys()
    ).sort();
  }

  function getSources() {
    return Array.from(
      sourceIndex.keys()
    ).sort();
  }


  // =====================================================
  // CALCULATOR SUPPORT
  // =====================================================

  function getNutritionBasis(
    foodId
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return null;
    }

    return clone(
      food.nutritionBasis
    );
  }

  function getNutrition(
    foodId
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return null;
    }

    return clone(
      food.nutrition
    );
  }

  function getServings(
    foodId
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return [];
    }

    return clone(
      food.servings
    );
  }

  function getMeasurementCapabilities(
    foodId
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return null;
    }

    return clone(
      food.measurement
    );
  }

  function getSupportedUnits(
    foodId
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return [];
    }

    const units =
      new Set();

    for (
      const unit
      of food.measurement.weightUnits
    ) {
      units.add(unit);
    }

    for (
      const unit
      of food.measurement.volumeUnits
    ) {
      units.add(unit);
    }

    for (
      const unit
      of food.measurement.customUnits
    ) {
      units.add(unit);
    }

    return Array.from(units);
  }


  // =====================================================
  // SEARCH ENGINE SUPPORT
  // =====================================================

  function getSearchDocuments() {
    const documents = [];

    for (
      const food
      of foods.values()
    ) {
      if (!food.enabled) {
        continue;
      }

      const searchParts = [
        food.name,
        food.displayName,
        food.category,
        food.state || "",
        food.preparation || "",
        food.brand || "",
        food.restaurant || "",
        ...food.aliases,
        ...food.tags
      ];

      documents.push({
        id:
          food.id,

        name:
          food.name,

        displayName:
          food.displayName,

        category:
          food.category,

        state:
          food.state,

        preparation:
          food.preparation,

        aliases:
          [...food.aliases],

        tags:
          [...food.tags],

        brand:
          food.brand,

        restaurant:
          food.restaurant,

        popularity:
          food.popularity,

        measurement:
          clone(
            food.measurement
          ),

        searchableText:
          normalizeText(
            searchParts.join(" ")
          )
      });
    }

    return documents;
  }

  function resolveIds(foodIds) {
    if (!Array.isArray(foodIds)) {
      return [];
    }

    const results = [];

    for (const foodId of foodIds) {
      const food =
        foods.get(
          normalizeKey(foodId)
        );

      if (
        food &&
        food.enabled
      ) {
        results.push(
          clone(food)
        );
      }
    }

    return results;
  }


  // =====================================================
  // POPULARITY
  // =====================================================

  function setPopularity(
    foodId,
    popularity
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return false;
    }

    food.popularity =
      Math.max(
        0,
        Math.min(
          100,
          safeNumber(
            popularity,
            0
          )
        )
      );

    return true;
  }


  // =====================================================
  // ENABLE / DISABLE
  // =====================================================

  function setEnabled(
    foodId,
    enabled
  ) {
    const food =
      foods.get(
        normalizeKey(foodId)
      );

    if (!food) {
      return false;
    }

    food.enabled =
      enabled === true;

    return true;
  }


  // =====================================================
  // CLEAR REGISTRY
  // =====================================================

  function clear(options = {}) {
    if (
      options.confirm !== true
    ) {
      console.warn(
        "[AriFoodRegistry] clear() requires { confirm: true }."
      );

      return false;
    }

    foods.clear();

    categoryIndex.clear();
    nameIndex.clear();
    aliasIndex.clear();
    preparationIndex.clear();
    stateIndex.clear();
    sourceIndex.clear();
    brandIndex.clear();

    stats.registered = 0;
    stats.replaced = 0;
    stats.rejected = 0;
    stats.duplicates = 0;
    stats.removed = 0;
    stats.batches = 0;
    stats.lastRegistrationAt = null;

    return true;
  }


  // =====================================================
  // HEALTH CHECK
  // =====================================================

  function healthCheck() {
    const issues = [];

    for (
      const [foodId, food]
      of foods.entries()
    ) {
      if (!food.id) {
        issues.push({
          foodId,
          issue:
            "missing_id"
        });
      }

      if (!food.name) {
        issues.push({
          foodId,
          issue:
            "missing_name"
        });
      }

      if (
        !food.nutritionBasis
      ) {
        issues.push({
          foodId,
          issue:
            "missing_nutrition_basis"
        });
      }

      if (!food.nutrition) {
        issues.push({
          foodId,
          issue:
            "missing_nutrition"
        });
      }

      if (
        food.nutritionBasis?.type ===
          "weight" &&
        !food.nutritionBasis?.grams
      ) {
        issues.push({
          foodId,
          issue:
            "weight_basis_without_grams"
        });
      }

      if (
        food.nutritionBasis?.type ===
          "volume" &&
        !food.nutritionBasis
          ?.milliliters
      ) {
        issues.push({
          foodId,
          issue:
            "volume_basis_without_milliliters"
        });
      }
    }

    return {
      ok:
        issues.length === 0,

      checked:
        foods.size,

      issueCount:
        issues.length,

      issues
    };
  }


  // =====================================================
  // DIAGNOSTICS
  // =====================================================

  function getDiagnostics() {
    let enabled = 0;
    let disabled = 0;

    let weightCapable = 0;
    let volumeCapable = 0;
    let customUnitCapable = 0;

    for (
      const food
      of foods.values()
    ) {
      if (food.enabled) {
        enabled += 1;
      } else {
        disabled += 1;
      }

      if (
        food.measurement
          .supportsWeight
      ) {
        weightCapable += 1;
      }

      if (
        food.measurement
          .supportsVolume
      ) {
        volumeCapable += 1;
      }

      if (
        food.measurement
          .supportsCustomUnits
      ) {
        customUnitCapable += 1;
      }
    }

    const categoryCounts = {};

    for (
      const [key, ids]
      of categoryIndex.entries()
    ) {
      categoryCounts[key] =
        ids.size;
    }

    const stateCounts = {};

    for (
      const [key, ids]
      of stateIndex.entries()
    ) {
      stateCounts[key] =
        ids.size;
    }

    return {
      registry:
        "AriFoodRegistry",

      version:
        VERSION,

      schemaVersion:
        SCHEMA_VERSION,

      ready:
        true,

      foods: {
        total:
          foods.size,

        enabled,

        disabled
      },

      measurement: {
        weightCapable,
        volumeCapable,
        customUnitCapable
      },

      indexes: {
        categories:
          categoryIndex.size,

        names:
          nameIndex.size,

        aliases:
          aliasIndex.size,

        preparations:
          preparationIndex.size,

        states:
          stateIndex.size,

        sources:
          sourceIndex.size,

        brands:
          brandIndex.size
      },

      categoryCounts,
      stateCounts,

      activity: {
        ...stats
      }
    };
  }


  // =====================================================
  // PUBLIC API
  // =====================================================

  const AriFoodRegistry =
    Object.freeze({
      VERSION,
      SCHEMA_VERSION,

      register,
      registerMany,
      remove,

      has,
      getById,
      getAll,
      count,

      getByCategory,
      getByName,
      getByAlias,
      getByPreparation,
      getByState,
      getBySource,
      getByBrand,

      getCategories,
      getPreparations,
      getStates,
      getSources,

      getNutritionBasis,
      getNutrition,
      getServings,
      getMeasurementCapabilities,
      getSupportedUnits,

      getSearchDocuments,
      resolveIds,

      setPopularity,
      setEnabled,

      validateFood,

      normalizeUnit,
      getUnitDimension,
      convertWeightToGrams,
      convertVolumeToMilliliters,

      getDiagnostics,
      healthCheck,

      clear
    });


  // =====================================================
  // GLOBAL EXPORT
  // =====================================================

  global.AriFoodRegistry =
    AriFoodRegistry;


  // =====================================================
  // READY EVENT
  // =====================================================

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-registry-ready",
        {
          detail: {
            version:
              VERSION,

            schemaVersion:
              SCHEMA_VERSION
          }
        }
      )
    );
  } catch (error) {
    // Non-browser environments may not support CustomEvent.
  }


  // =====================================================
  // INITIALIZATION
  // =====================================================

  console.info(
    `[ARI Nutrition] AriFoodRegistry v${VERSION} ready.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
