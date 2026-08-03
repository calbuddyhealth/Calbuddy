// =====================================================
// ARI REBIRTH
// File: AriFoodCalculator.js
// Version: 1.0.0
//
// Purpose:
//   Serving and nutrition calculation engine for
//   ARI Nutrition.
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
// Responsibilities:
//   - Calculate nutrition for arbitrary serving amounts.
//   - Convert supported weight units to grams.
//   - Convert supported volume units to milliliters.
//   - Resolve custom serving definitions such as:
//       slice
//       breast
//       wing
//       thigh
//       egg
//       tortilla
//       patty
//   - Scale calories and nutrients from the food's
//     canonical nutrition basis.
//   - Support weight-based, volume-based, and unit-based
//     nutrition bases.
//   - Support quantities such as:
//       6 oz chicken
//       170 g chicken
//       0.5 lb steak
//       2 pizza slices
//       3 eggs
//       1.5 cups milk
//   - Expose conversion and diagnostics utilities.
//
// Non-responsibilities:
//   - Does not search for foods.
//   - Does not own food records.
//   - Does not register foods.
//   - Does not estimate unknown foods.
//   - Does not access Supabase.
//   - Does not save meals.
//   - Does not manipulate the DOM.
//
// Dependencies:
//   - AriFoodRegistry v2+
// =====================================================

(function initializeAriFoodCalculator(global) {
  "use strict";

  // =====================================================
  // VERSION
  // =====================================================

  const VERSION = "1.0.0";


  // =====================================================
  // INTERNAL STATE
  // =====================================================

  const state = {
    calculations: 0,
    successfulCalculations: 0,
    failedCalculations: 0,
    conversions: 0,
    lastFoodId: null,
    lastAmount: null,
    lastUnit: null,
    lastCalculationAt: null,
    lastError: null
  };


  // =====================================================
  // NUTRIENT DEFINITIONS
  // =====================================================

  const NUTRIENT_FIELDS = Object.freeze([
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
    "saturatedFat",
    "transFat",
    "cholesterol",
    "sodium",
    "potassium"
  ]);


  // =====================================================
  // HELPERS
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


  function roundTo(value, decimals = 1) {
    const number =
      safeNumber(value, 0);

    const places =
      Math.max(
        0,
        Math.min(
          8,
          Math.round(
            safeNumber(decimals, 1)
          )
        )
      );

    const factor =
      10 ** places;

    return (
      Math.round(
        (number + Number.EPSILON) *
        factor
      ) /
      factor
    );
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


  // =====================================================
  // REGISTRY ACCESS
  // =====================================================

  function getRegistry() {
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.getById !== "function"
    ) {
      return null;
    }

    return registry;
  }


  function isReady() {
    return getRegistry() !== null;
  }


  // =====================================================
  // UNIT HELPERS
  // =====================================================

  function normalizeUnit(unit) {
    const registry =
      getRegistry();

    if (
      registry &&
      typeof registry.normalizeUnit ===
        "function"
    ) {
      return registry.normalizeUnit(
        unit
      );
    }

    return cleanString(unit)
      .toLowerCase();
  }


  function getUnitDimension(unit) {
    const registry =
      getRegistry();

    if (
      registry &&
      typeof registry.getUnitDimension ===
        "function"
    ) {
      return registry.getUnitDimension(
        unit
      );
    }

    return null;
  }


  function weightToGrams(
    amount,
    unit
  ) {
    const registry =
      getRegistry();

    if (
      !registry ||
      typeof registry.convertWeightToGrams !==
        "function"
    ) {
      return null;
    }

    state.conversions += 1;

    return registry.convertWeightToGrams(
      amount,
      unit
    );
  }


  function volumeToMilliliters(
    amount,
    unit
  ) {
    const registry =
      getRegistry();

    if (
      !registry ||
      typeof registry.convertVolumeToMilliliters !==
        "function"
    ) {
      return null;
    }

    state.conversions += 1;

    return registry.convertVolumeToMilliliters(
      amount,
      unit
    );
  }


  // =====================================================
  // NUTRITION SCALING
  // =====================================================

  function scaleNutrition(
    nutrition,
    multiplier,
    options = {}
  ) {
    const result = {};

    const decimals =
      options.decimals !== undefined
        ? safeNumber(
            options.decimals,
            1
          )
        : 1;


    for (
      const field
      of NUTRIENT_FIELDS
    ) {
      const baseValue =
        safeNumber(
          nutrition?.[field],
          0
        );

      result[field] =
        roundTo(
          baseValue *
          multiplier,
          decimals
        );
    }


    return result;
  }


  // =====================================================
  // SERVING LOOKUP
  // =====================================================

  function findServing(
    food,
    unitOrServingId
  ) {
    if (
      !food ||
      !Array.isArray(food.servings)
    ) {
      return null;
    }


    const target =
      normalizeText(
        unitOrServingId
      );


    if (!target) {
      return null;
    }


    // -----------------------------------------------------
    // Exact serving ID
    // -----------------------------------------------------

    for (
      const serving
      of food.servings
    ) {
      if (
        normalizeText(
          serving.id
        ) === target
      ) {
        return clone(serving);
      }
    }


    // -----------------------------------------------------
    // Exact unit
    // -----------------------------------------------------

    for (
      const serving
      of food.servings
    ) {
      if (
        normalizeText(
          serving.unit
        ) === target
      ) {
        return clone(serving);
      }
    }


    // -----------------------------------------------------
    // Exact label
    // -----------------------------------------------------

    for (
      const serving
      of food.servings
    ) {
      if (
        normalizeText(
          serving.label
        ) === target
      ) {
        return clone(serving);
      }
    }


    return null;
  }


  function getDefaultServing(food) {
    if (
      !food ||
      !Array.isArray(food.servings)
    ) {
      return null;
    }


    const explicitDefault =
      food.servings.find(
        serving =>
          serving.isDefault === true
      );


    if (explicitDefault) {
      return clone(
        explicitDefault
      );
    }


    return (
      food.servings.length > 0
        ? clone(
            food.servings[0]
          )
        : null
    );
  }


  // =====================================================
  // BASIS HELPERS
  // =====================================================

  function getBasis(food) {
    if (
      !food ||
      !isPlainObject(
        food.nutritionBasis
      )
    ) {
      return null;
    }

    return food.nutritionBasis;
  }


  function basisMultiplierFromWeight(
    food,
    requestedGrams
  ) {
    const basis =
      getBasis(food);

    const grams =
      positiveNumber(
        requestedGrams
      );


    if (
      !basis ||
      grams === null
    ) {
      return null;
    }


    const basisGrams =
      positiveNumber(
        basis.grams
      );


    if (basisGrams === null) {
      return null;
    }


    return (
      grams /
      basisGrams
    );
  }


  function basisMultiplierFromVolume(
    food,
    requestedMilliliters
  ) {
    const basis =
      getBasis(food);

    const milliliters =
      positiveNumber(
        requestedMilliliters
      );


    if (
      !basis ||
      milliliters === null
    ) {
      return null;
    }


    const basisMl =
      positiveNumber(
        basis.milliliters
      );


    if (basisMl === null) {
      return null;
    }


    return (
      milliliters /
      basisMl
    );
  }


  function basisMultiplierFromUnit(
    food,
    requestedAmount,
    requestedUnit
  ) {
    const basis =
      getBasis(food);

    const amount =
      positiveNumber(
        requestedAmount
      );


    if (
      !basis ||
      amount === null
    ) {
      return null;
    }


    const basisAmount =
      positiveNumber(
        basis.amount,
        1
      );


    const basisUnit =
      normalizeText(
        basis.unit
      );


    const unit =
      normalizeText(
        requestedUnit
      );


    if (
      !basisUnit ||
      !unit ||
      basisUnit !== unit
    ) {
      return null;
    }


    return (
      amount /
      basisAmount
    );
  }


  // =====================================================
  // SERVING-TO-BASIS MULTIPLIER
  // =====================================================

  function multiplierFromServing(
    food,
    serving,
    quantity
  ) {
    const count =
      positiveNumber(
        quantity,
        1
      );


    if (
      !food ||
      !serving ||
      count === null
    ) {
      return null;
    }


    // -----------------------------------------------------
    // Weight-capable serving
    // -----------------------------------------------------

    const servingGrams =
      positiveNumber(
        serving.grams
      );


    if (servingGrams !== null) {
      const totalGrams =
        servingGrams *
        count;

      const multiplier =
        basisMultiplierFromWeight(
          food,
          totalGrams
        );

      if (multiplier !== null) {
        return {
          multiplier,

          resolvedBy:
            "serving-weight",

          grams:
            totalGrams,

          milliliters:
            null
        };
      }
    }


    // -----------------------------------------------------
    // Volume-capable serving
    // -----------------------------------------------------

    const servingMl =
      positiveNumber(
        serving.milliliters
      );


    if (servingMl !== null) {
      const totalMl =
        servingMl *
        count;

      const multiplier =
        basisMultiplierFromVolume(
          food,
          totalMl
        );

      if (multiplier !== null) {
        return {
          multiplier,

          resolvedBy:
            "serving-volume",

          grams:
            null,

          milliliters:
            totalMl
        };
      }
    }


    // -----------------------------------------------------
    // Unit basis
    // -----------------------------------------------------

    const unitMultiplier =
      basisMultiplierFromUnit(
        food,
        serving.amount *
          count,
        serving.unit
      );


    if (
      unitMultiplier !== null
    ) {
      return {
        multiplier:
          unitMultiplier,

        resolvedBy:
          "serving-unit",

        grams:
          null,

        milliliters:
          null
      };
    }


    return null;
  }


  // =====================================================
  // CORE CALCULATION
  // =====================================================

  /**
   * calculate(foodId, amount, unit, options)
   *
   * Examples:
   *
   * AriFoodCalculator.calculate(
   *   "chicken-breast-grilled-cooked",
   *   6,
   *   "oz"
   * );
   *
   * AriFoodCalculator.calculate(
   *   "broccoli-steamed",
   *   143,
   *   "g"
   * );
   *
   * AriFoodCalculator.calculate(
   *   "pepperoni-pizza",
   *   2,
   *   "slice"
   * );
   */

  function calculate(
    foodId,
    amount,
    unit,
    options = {}
  ) {
    state.calculations += 1;
    state.lastError = null;


    const registry =
      getRegistry();


    if (!registry) {
      return fail(
        "registry_unavailable",
        "AriFoodRegistry is not available."
      );
    }


    const food =
      registry.getById(foodId);


    if (!food) {
      return fail(
        "food_not_found",
        `Food "${foodId}" was not found.`
      );
    }


    const numericAmount =
      positiveNumber(amount);


    if (numericAmount === null) {
      return fail(
        "invalid_amount",
        "Amount must be greater than 0."
      );
    }


    const normalizedUnit =
      normalizeUnit(unit);


    if (!normalizedUnit) {
      return fail(
        "invalid_unit",
        "A unit is required."
      );
    }


    state.lastFoodId =
      food.id;

    state.lastAmount =
      numericAmount;

    state.lastUnit =
      normalizedUnit;

    state.lastCalculationAt =
      new Date().toISOString();


    const dimension =
      getUnitDimension(
        normalizedUnit
      );


    let multiplier = null;
    let resolvedBy = null;
    let grams = null;
    let milliliters = null;
    let serving = null;


    // -----------------------------------------------------
    // Weight input
    // -----------------------------------------------------

    if (
      dimension === "weight"
    ) {
      grams =
        weightToGrams(
          numericAmount,
          normalizedUnit
        );


      multiplier =
        basisMultiplierFromWeight(
          food,
          grams
        );


      if (multiplier !== null) {
        resolvedBy =
          "weight";
      }
    }


    // -----------------------------------------------------
    // Volume input
    // -----------------------------------------------------

    if (
      multiplier === null &&
      dimension === "volume"
    ) {
      milliliters =
        volumeToMilliliters(
          numericAmount,
          normalizedUnit
        );


      multiplier =
        basisMultiplierFromVolume(
          food,
          milliliters
        );


      if (multiplier !== null) {
        resolvedBy =
          "volume";
      }
    }


    // -----------------------------------------------------
    // Direct unit basis
    // -----------------------------------------------------

    if (multiplier === null) {
      multiplier =
        basisMultiplierFromUnit(
          food,
          numericAmount,
          normalizedUnit
        );


      if (multiplier !== null) {
        resolvedBy =
          "basis-unit";
      }
    }


    // -----------------------------------------------------
    // Custom serving
    // -----------------------------------------------------

    if (multiplier === null) {
      serving =
        findServing(
          food,
          normalizedUnit
        );


      if (serving) {
        const servingResolution =
          multiplierFromServing(
            food,
            serving,
            numericAmount
          );


        if (servingResolution) {
          multiplier =
            servingResolution.multiplier;

          resolvedBy =
            servingResolution.resolvedBy;

          grams =
            servingResolution.grams;

          milliliters =
            servingResolution.milliliters;
        }
      }
    }


    // -----------------------------------------------------
    // Unsupported conversion
    // -----------------------------------------------------

    if (multiplier === null) {
      return fail(
        "unsupported_conversion",
        `Cannot calculate "${numericAmount} ${normalizedUnit}" for "${food.displayName}".`,
        {
          foodId:
            food.id,

          requestedAmount:
            numericAmount,

          requestedUnit:
            normalizedUnit,

          nutritionBasis:
            clone(
              food.nutritionBasis
            ),

          supportedUnits:
            typeof registry.getSupportedUnits ===
            "function"
              ? registry.getSupportedUnits(
                  food.id
                )
              : []
        }
      );
    }


    const nutrition =
      scaleNutrition(
        food.nutrition,
        multiplier,
        options
      );


    const result = {
      ok: true,

      food: {
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
          food.preparation
      },

      requested: {
        amount:
          numericAmount,

        unit:
          normalizedUnit
      },

      resolved: {
        multiplier:
          roundTo(
            multiplier,
            6
          ),

        resolvedBy,

        grams:
          grams !== null
            ? roundTo(
                grams,
                2
              )
            : null,

        milliliters:
          milliliters !== null
            ? roundTo(
                milliliters,
                2
              )
            : null,

        serving:
          serving
            ? clone(serving)
            : null
      },

      basis: {
        nutritionBasis:
          clone(
            food.nutritionBasis
          ),

        nutrition:
          clone(
            food.nutrition
          )
      },

      nutrition,

      display:
        buildDisplaySummary(
          food,
          numericAmount,
          normalizedUnit,
          nutrition,
          grams,
          milliliters
        )
    };


    state.successfulCalculations += 1;


    return result;
  }


  // =====================================================
  // CALCULATE BY SERVING ID
  // =====================================================

  function calculateServing(
    foodId,
    servingId,
    quantity = 1,
    options = {}
  ) {
    state.calculations += 1;
    state.lastError = null;


    const registry =
      getRegistry();


    if (!registry) {
      return fail(
        "registry_unavailable",
        "AriFoodRegistry is not available."
      );
    }


    const food =
      registry.getById(foodId);


    if (!food) {
      return fail(
        "food_not_found",
        `Food "${foodId}" was not found.`
      );
    }


    const serving =
      findServing(
        food,
        servingId
      );


    if (!serving) {
      return fail(
        "serving_not_found",
        `Serving "${servingId}" was not found for "${food.displayName}".`
      );
    }


    const count =
      positiveNumber(quantity);


    if (count === null) {
      return fail(
        "invalid_quantity",
        "Serving quantity must be greater than 0."
      );
    }


    const resolution =
      multiplierFromServing(
        food,
        serving,
        count
      );


    if (!resolution) {
      return fail(
        "unsupported_serving",
        `Serving "${serving.label}" cannot be resolved against the nutrition basis.`
      );
    }


    const nutrition =
      scaleNutrition(
        food.nutrition,
        resolution.multiplier,
        options
      );


    state.lastFoodId =
      food.id;

    state.lastAmount =
      count;

    state.lastUnit =
      serving.unit;

    state.lastCalculationAt =
      new Date().toISOString();

    state.successfulCalculations += 1;


    return {
      ok: true,

      food: {
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
          food.preparation
      },

      requested: {
        quantity:
          count,

        servingId:
          serving.id,

        servingLabel:
          serving.label
      },

      resolved: {
        multiplier:
          roundTo(
            resolution.multiplier,
            6
          ),

        resolvedBy:
          resolution.resolvedBy,

        grams:
          resolution.grams !== null
            ? roundTo(
                resolution.grams,
                2
              )
            : null,

        milliliters:
          resolution.milliliters !== null
            ? roundTo(
                resolution.milliliters,
                2
              )
            : null,

        serving:
          clone(serving)
      },

      basis: {
        nutritionBasis:
          clone(
            food.nutritionBasis
          ),

        nutrition:
          clone(
            food.nutrition
          )
      },

      nutrition,

      display:
        buildDisplaySummary(
          food,
          count,
          serving.unit,
          nutrition,
          resolution.grams,
          resolution.milliliters
        )
    };
  }


  // =====================================================
  // DEFAULT SERVING CALCULATION
  // =====================================================

  function calculateDefaultServing(
    foodId,
    quantity = 1,
    options = {}
  ) {
    const registry =
      getRegistry();


    if (!registry) {
      return fail(
        "registry_unavailable",
        "AriFoodRegistry is not available."
      );
    }


    const food =
      registry.getById(foodId);


    if (!food) {
      return fail(
        "food_not_found",
        `Food "${foodId}" was not found.`
      );
    }


    const serving =
      getDefaultServing(food);


    if (!serving) {
      return fail(
        "default_serving_not_found",
        `"${food.displayName}" does not define a default serving.`
      );
    }


    return calculateServing(
      food.id,
      serving.id,
      quantity,
      options
    );
  }


  // =====================================================
  // CALCULATE DIRECTLY FROM GRAMS
  // =====================================================

  function calculateGrams(
    foodId,
    grams,
    options = {}
  ) {
    return calculate(
      foodId,
      grams,
      "g",
      options
    );
  }


  // =====================================================
  // CALCULATE DIRECTLY FROM OUNCES
  // =====================================================

  function calculateOunces(
    foodId,
    ounces,
    options = {}
  ) {
    return calculate(
      foodId,
      ounces,
      "oz",
      options
    );
  }


  // =====================================================
  // CALCULATE DIRECTLY FROM POUNDS
  // =====================================================

  function calculatePounds(
    foodId,
    pounds,
    options = {}
  ) {
    return calculate(
      foodId,
      pounds,
      "lb",
      options
    );
  }


  // =====================================================
  // CALCULATE DIRECTLY FROM MILLILITERS
  // =====================================================

  function calculateMilliliters(
    foodId,
    milliliters,
    options = {}
  ) {
    return calculate(
      foodId,
      milliliters,
      "ml",
      options
    );
  }


  // =====================================================
  // CALCULATE DIRECTLY FROM CUPS
  // =====================================================

  function calculateCups(
    foodId,
    cups,
    options = {}
  ) {
    return calculate(
      foodId,
      cups,
      "cup",
      options
    );
  }


  // =====================================================
  // CONVERSION BETWEEN WEIGHT UNITS
  // =====================================================

  function convertWeight(
    amount,
    fromUnit,
    toUnit
  ) {
    const grams =
      weightToGrams(
        amount,
        fromUnit
      );


    if (grams === null) {
      return {
        ok: false,
        value: null,
        error:
          "Invalid source weight unit."
      };
    }


    const target =
      normalizeUnit(toUnit);


    const targetGrams =
      weightToGrams(
        1,
        target
      );


    if (
      targetGrams === null ||
      targetGrams <= 0
    ) {
      return {
        ok: false,
        value: null,
        error:
          "Invalid target weight unit."
      };
    }


    return {
      ok: true,

      value:
        grams /
        targetGrams,

      from: {
        amount:
          Number(amount),

        unit:
          normalizeUnit(
            fromUnit
          )
      },

      to: {
        amount:
          grams /
          targetGrams,

        unit:
          target
      }
    };
  }


  // =====================================================
  // CONVERSION BETWEEN VOLUME UNITS
  // =====================================================

  function convertVolume(
    amount,
    fromUnit,
    toUnit
  ) {
    const milliliters =
      volumeToMilliliters(
        amount,
        fromUnit
      );


    if (
      milliliters === null
    ) {
      return {
        ok: false,
        value: null,
        error:
          "Invalid source volume unit."
      };
    }


    const target =
      normalizeUnit(toUnit);


    const targetMl =
      volumeToMilliliters(
        1,
        target
      );


    if (
      targetMl === null ||
      targetMl <= 0
    ) {
      return {
        ok: false,
        value: null,
        error:
          "Invalid target volume unit."
      };
    }


    return {
      ok: true,

      value:
        milliliters /
        targetMl,

      from: {
        amount:
          Number(amount),

        unit:
          normalizeUnit(
            fromUnit
          )
      },

      to: {
        amount:
          milliliters /
          targetMl,

        unit:
          target
      }
    };
  }


  // =====================================================
  // DISPLAY SUMMARY
  // =====================================================

  function buildDisplaySummary(
    food,
    amount,
    unit,
    nutrition,
    grams,
    milliliters
  ) {
    const display = {
      title:
        food.displayName,

      serving:
        `${amount} ${unit}`,

      calories:
        `${nutrition.calories} cal`,

      protein:
        `${nutrition.protein} g protein`,

      carbs:
        `${nutrition.carbs} g carbs`,

      fat:
        `${nutrition.fat} g fat`,

      gramEquivalent:
        grams !== null
          ? `${roundTo(
              grams,
              1
            )} g`
          : null,

      milliliterEquivalent:
        milliliters !== null
          ? `${roundTo(
              milliliters,
              1
            )} ml`
          : null
    };


    return display;
  }


  // =====================================================
  // FAILURE HELPER
  // =====================================================

  function fail(
    code,
    message,
    extra = {}
  ) {
    state.failedCalculations += 1;

    state.lastError = {
      code,
      message
    };


    return {
      ok: false,

      error: {
        code,
        message
      },

      ...extra
    };
  }


  // =====================================================
  // GET AVAILABLE SERVINGS
  // =====================================================

  function getAvailableServings(
    foodId
  ) {
    const registry =
      getRegistry();


    if (!registry) {
      return [];
    }


    const food =
      registry.getById(foodId);


    if (!food) {
      return [];
    }


    return Array.isArray(
      food.servings
    )
      ? clone(
          food.servings
        )
      : [];
  }


  // =====================================================
  // GET AVAILABLE UNITS
  // =====================================================

  function getAvailableUnits(
    foodId
  ) {
    const registry =
      getRegistry();


    if (
      !registry ||
      typeof registry.getSupportedUnits !==
        "function"
    ) {
      return [];
    }


    return registry.getSupportedUnits(
      foodId
    );
  }


  // =====================================================
  // CAN CALCULATE
  // =====================================================

  function canCalculate(
    foodId,
    unit
  ) {
    const registry =
      getRegistry();


    if (!registry) {
      return false;
    }


    const food =
      registry.getById(foodId);


    if (!food) {
      return false;
    }


    const normalizedUnit =
      normalizeUnit(unit);

    if (!normalizedUnit) {
      return false;
    }


    const dimension =
      getUnitDimension(
        normalizedUnit
      );


    if (
      dimension === "weight" &&
      food.measurement?.supportsWeight
    ) {
      return true;
    }


    if (
      dimension === "volume" &&
      food.measurement?.supportsVolume
    ) {
      return true;
    }


    if (
      normalizeText(
        food.nutritionBasis?.unit
      ) ===
      normalizeText(
        normalizedUnit
      )
    ) {
      return true;
    }


    return Boolean(
      findServing(
        food,
        normalizedUnit
      )
    );
  }


  // =====================================================
  // DIAGNOSTICS
  // =====================================================

  function getDiagnostics() {
    const registry =
      getRegistry();


    return {
      engine:
        "AriFoodCalculator",

      version:
        VERSION,

      ready:
        registry !== null,

      registryVersion:
        registry?.VERSION ||
        null,

      supportedNutrients:
        [...NUTRIENT_FIELDS],

      activity: {
        ...state
      }
    };
  }


  // =====================================================
  // HEALTH CHECK
  // =====================================================

  function healthCheck() {
    const registry =
      getRegistry();


    if (!registry) {
      return {
        ok: false,

        issues: [
          {
            code:
              "registry_unavailable",

            message:
              "AriFoodRegistry is not available."
          }
        ]
      };
    }


    const issues = [];


    const requiredMethods = [
      "getById",
      "getSupportedUnits",
      "normalizeUnit",
      "getUnitDimension",
      "convertWeightToGrams",
      "convertVolumeToMilliliters"
    ];


    for (
      const method
      of requiredMethods
    ) {
      if (
        typeof registry[method] !==
        "function"
      ) {
        issues.push({
          code:
            `missing_${method}`,

          message:
            `AriFoodRegistry.${method}() is required.`
        });
      }
    }


    return {
      ok:
        issues.length === 0,

      registryVersion:
        registry.VERSION ||
        null,

      issues
    };
  }


  // =====================================================
  // PUBLIC API
  // =====================================================

  const AriFoodCalculator =
    Object.freeze({
      VERSION,

      // Primary calculation
      calculate,

      // Convenience calculation
      calculateServing,
      calculateDefaultServing,
      calculateGrams,
      calculateOunces,
      calculatePounds,
      calculateMilliliters,
      calculateCups,

      // Conversions
      convertWeight,
      convertVolume,
      weightToGrams,
      volumeToMilliliters,

      // Food capability helpers
      getAvailableServings,
      getAvailableUnits,
      canCalculate,

      // Nutrition utility
      scaleNutrition,

      // Diagnostics
      getDiagnostics,
      healthCheck,
      isReady
    });


  // =====================================================
  // GLOBAL EXPORT
  // =====================================================

  global.AriFoodCalculator =
    AriFoodCalculator;


  // =====================================================
  // READY EVENT
  // =====================================================

  try {
    global.dispatchEvent(
      new CustomEvent(
        "ari:food-calculator-ready",
        {
          detail: {
            version:
              VERSION
          }
        }
      )
    );
  } catch (error) {
    // Non-browser environments may not
    // support CustomEvent.
  }


  // =====================================================
  // INITIALIZATION
  // =====================================================

  console.info(
    `[ARI Nutrition] AriFoodCalculator v${VERSION} ready.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
