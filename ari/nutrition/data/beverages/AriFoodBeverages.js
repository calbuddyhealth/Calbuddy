// =====================================================
// ARI REBIRTH
// File: AriFoodBeverages.js
// Version: 1.0.0
//
// Purpose:
//   Collection controller for ARI Nutrition beverage
//   submodules.
//
// Architecture:
//   AriFoodRegistry
//        ↓
//   AriFoodBeverages
//        ↓
//   ├── AriFoodBeverageCore
//   ├── AriFoodSodaBrands
//   ├── AriFoodEnergyDrinkBrands
//   ├── AriFoodSportsDrinkBrands
//   ├── AriFoodJuiceBrands
//   ├── AriFoodCoffeeTeaBrands
//   ├── AriFoodWaterBrands
//   ├── AriFoodBeverageBrands2
//   └── AriFoodBeverageBrands3
//
// Strategy:
//   Beverages are overwhelmingly brand-first.
//
//   Generic fallback should remain intentionally small
//   and limited to drinks commonly prepared/logged without
//   a brand, such as:
//   - plain water
//   - brewed black coffee
//   - espresso
//   - decaf coffee
//   - unsweetened black tea
//   - unsweetened green tea
//   - unsweetened herbal tea
//
//   Packaged beverages should prefer exact manufacturer
//   nutrition labels whenever a matching product exists.
//
// Beverage canonical basis:
//   - 100 mL for fluid beverages.
//   - Exact package serving remains preserved in metadata.
//   - Volume normalization should not assume 1 mL = 1 g.
//
// Responsibilities:
//   - Define expected beverage-data modules.
//   - Track module loading state.
//   - Track registration counts and failures.
//   - Report collection readiness.
//   - Report AriFoodRegistry coverage by source.
//   - Expose collection diagnostics.
//   - Emit module/update/readiness/reset events.
//
// Non-responsibilities:
//   - Does not contain beverage records.
//   - Does not search foods.
//   - Does not calculate nutrition.
//   - Does not manipulate the DOM.
//   - Does not persist meals.
//   - Does not perform runtime internet lookups.
//
// Load order:
//   1. AriFoodRegistry.js
//   2. AriFoodBeverages.js
//   3. AriFoodBeverageCore.js
//   4. AriFoodSodaBrands.js
//   5. AriFoodEnergyDrinkBrands.js
//   6. AriFoodSportsDrinkBrands.js
//   7. AriFoodJuiceBrands.js
//   8. AriFoodCoffeeTeaBrands.js
//   9. AriFoodWaterBrands.js
//  10. AriFoodBeverageBrands2.js
//  11. AriFoodBeverageBrands3.js
// =====================================================

(function initializeAriFoodBeverages(global) {
  "use strict";

  const VERSION = "1.0.0";
  const COLLECTION_ID = "beverages";
  const COLLECTION_NAME = "AriFoodBeverages";

  const EXPECTED_MODULES = Object.freeze([
    "AriFoodBeverageCore",
    "AriFoodSodaBrands",
    "AriFoodEnergyDrinkBrands",
    "AriFoodSportsDrinkBrands",
    "AriFoodJuiceBrands",
    "AriFoodCoffeeTeaBrands",
    "AriFoodWaterBrands",
    "AriFoodBeverageBrands2",
    "AriFoodBeverageBrands3"
  ]);

  const moduleState = new Map();

  let readyEventEmitted = false;

  function createInitialModuleState(moduleName) {
    return {
      name: moduleName,

      status: "pending",

      registered: 0,
      replaced: 0,
      rejected: 0,
      duplicates: 0,

      error: null,

      loadedAt: null,
      failedAt: null,
      updatedAt: Date.now(),

      metadata: {}
    };
  }

  for (const moduleName of EXPECTED_MODULES) {
    moduleState.set(
      moduleName,
      createInitialModuleState(moduleName)
    );
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

  function normalizeCount(value) {
    const number = Number(value);

    return Number.isFinite(number) && number >= 0
      ? number
      : 0;
  }

  function normalizeModuleName(moduleName) {
    return String(moduleName || "").trim();
  }

  function isExpectedModule(moduleName) {
    return EXPECTED_MODULES.includes(
      normalizeModuleName(moduleName)
    );
  }

  function requireExpectedModule(moduleName) {
    const normalized =
      normalizeModuleName(moduleName);

    if (!isExpectedModule(normalized)) {
      throw new Error(
        `[ARI Nutrition] ${COLLECTION_NAME}: unknown module "${normalized}".`
      );
    }

    return normalized;
  }

  function dispatch(name, detail) {
    try {
      global.dispatchEvent(
        new CustomEvent(
          name,
          {
            detail: clone(detail)
          }
        )
      );
    } catch (error) {
      // Non-browser environments may not support CustomEvent.
    }
  }

  function getModule(moduleName) {
    const normalized =
      normalizeModuleName(moduleName);

    const state =
      moduleState.get(normalized);

    return state
      ? clone(state)
      : null;
  }

  function getModules() {
    return EXPECTED_MODULES.map(
      moduleName =>
        getModule(moduleName)
    );
  }

  function getLoadedModules() {
    return getModules().filter(
      module =>
        module.status === "loaded"
    );
  }

  function getPendingModules() {
    return getModules().filter(
      module =>
        module.status === "pending"
    );
  }

  function getFailedModules() {
    return getModules().filter(
      module =>
        module.status === "failed"
    );
  }

  function getTotals() {
    const modules =
      getModules();

    return modules.reduce(
      (totals, module) => {
        totals.registered +=
          normalizeCount(
            module.registered
          );

        totals.replaced +=
          normalizeCount(
            module.replaced
          );

        totals.rejected +=
          normalizeCount(
            module.rejected
          );

        totals.duplicates +=
          normalizeCount(
            module.duplicates
          );

        return totals;
      },
      {
        registered: 0,
        replaced: 0,
        rejected: 0,
        duplicates: 0
      }
    );
  }

  function getStatus() {
    const expected =
      EXPECTED_MODULES.length;

    const loaded =
      getLoadedModules().length;

    const pending =
      getPendingModules().length;

    const failed =
      getFailedModules().length;

    const complete =
      pending === 0;

    const ready =
      complete &&
      failed === 0 &&
      loaded === expected;

    const progress =
      expected > 0
        ? Math.round(
            (loaded / expected) * 100
          )
        : 100;

    return {
      collectionId: COLLECTION_ID,
      collectionName: COLLECTION_NAME,

      expected,
      loaded,
      pending,
      failed,

      complete,
      ready,
      progress
    };
  }

  function isReady() {
    return getStatus().ready;
  }

  function maybeEmitReady() {
    if (
      isReady() &&
      !readyEventEmitted
    ) {
      readyEventEmitted = true;

      dispatch(
        "ari:food-beverages-ready",
        {
          version: VERSION,
          collectionId: COLLECTION_ID,
          collectionName: COLLECTION_NAME,
          status: getStatus(),
          totals: getTotals()
        }
      );
    }

    if (!isReady()) {
      readyEventEmitted = false;
    }
  }

  function emitModuleUpdate(moduleName) {
    dispatch(
      "ari:food-beverages-module-update",
      {
        version: VERSION,
        collectionId: COLLECTION_ID,
        collectionName: COLLECTION_NAME,
        module: getModule(moduleName),
        status: getStatus(),
        totals: getTotals()
      }
    );

    maybeEmitReady();
  }

  function markModuleLoaded(
    moduleName,
    result = {}
  ) {
    const normalized =
      requireExpectedModule(
        moduleName
      );

    const state =
      moduleState.get(normalized);

    state.status =
      "loaded";

    state.registered =
      normalizeCount(
        result.registered
      );

    state.replaced =
      normalizeCount(
        result.replaced
      );

    state.rejected =
      normalizeCount(
        result.rejected
      );

    state.duplicates =
      normalizeCount(
        result.duplicates
      );

    state.error =
      null;

    state.loadedAt =
      Date.now();

    state.failedAt =
      null;

    state.updatedAt =
      Date.now();

    state.metadata =
      result.metadata &&
      typeof result.metadata === "object"
        ? clone(
            result.metadata
          )
        : {};

    emitModuleUpdate(
      normalized
    );

    return getModule(
      normalized
    );
  }

  function markModuleFailed(
    moduleName,
    error,
    metadata = {}
  ) {
    const normalized =
      requireExpectedModule(
        moduleName
      );

    const state =
      moduleState.get(normalized);

    state.status =
      "failed";

    state.registered =
      0;

    state.replaced =
      0;

    state.rejected =
      0;

    state.duplicates =
      0;

    state.error =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack || null
          }
        : {
            name: "Error",
            message:
              String(
                error ||
                "Unknown module failure."
              ),
            stack: null
          };

    state.failedAt =
      Date.now();

    state.loadedAt =
      null;

    state.updatedAt =
      Date.now();

    state.metadata =
      metadata &&
      typeof metadata === "object"
        ? clone(metadata)
        : {};

    emitModuleUpdate(
      normalized
    );

    return getModule(
      normalized
    );
  }

  function resetModule(
    moduleName
  ) {
    const normalized =
      requireExpectedModule(
        moduleName
      );

    moduleState.set(
      normalized,
      createInitialModuleState(
        normalized
      )
    );

    emitModuleUpdate(
      normalized
    );

    return getModule(
      normalized
    );
  }

  function resetAllModules() {
    for (const moduleName of EXPECTED_MODULES) {
      moduleState.set(
        moduleName,
        createInitialModuleState(
          moduleName
        )
      );
    }

    readyEventEmitted = false;

    dispatch(
      "ari:food-beverages-reset",
      {
        version: VERSION,
        collectionId: COLLECTION_ID,
        collectionName: COLLECTION_NAME,
        status: getStatus()
      }
    );

    return getStatus();
  }

  function getRegistryCoverage() {
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.getBySource !== "function"
    ) {
      return {
        available: false,

        totalFoods: null,

        modules:
          EXPECTED_MODULES.map(
            moduleName => ({
              module: moduleName,
              count: null
            })
          )
      };
    }

    const modules =
      EXPECTED_MODULES.map(
        moduleName => {
          let count = 0;

          try {
            const records =
              registry.getBySource(
                moduleName,
                {
                  includeDisabled: true
                }
              );

            count =
              Array.isArray(records)
                ? records.length
                : 0;
          } catch (error) {
            count = 0;
          }

          return {
            module:
              moduleName,

            count
          };
        }
      );

    return {
      available: true,

      totalFoods:
        modules.reduce(
          (sum, entry) =>
            sum + entry.count,
          0
        ),

      modules
    };
  }

  function getRegistryCoverageMap() {
    const coverage =
      getRegistryCoverage();

    if (!coverage.available) {
      return null;
    }

    return Object.fromEntries(
      coverage.modules.map(
        entry => [
          entry.module,
          entry.count
        ]
      )
    );
  }

  function getBrandModuleNames() {
    return EXPECTED_MODULES.filter(
      moduleName =>
        moduleName !== "AriFoodBeverageCore"
    );
  }

  function getCoreModuleName() {
    return "AriFoodBeverageCore";
  }

  function healthCheck() {
    const status =
      getStatus();

    const failedModules =
      getFailedModules();

    const pendingModules =
      getPendingModules();

    const registryCoverage =
      getRegistryCoverage();

    const issues = [];

    if (!global.AriFoodRegistry) {
      issues.push(
        "AriFoodRegistry is unavailable."
      );
    }

    if (failedModules.length > 0) {
      issues.push(
        `${failedModules.length} beverage module(s) failed.`
      );
    }

    if (
      status.complete &&
      !status.ready
    ) {
      issues.push(
        "The beverage collection completed with one or more failures."
      );
    }

    if (
      status.ready &&
      registryCoverage.available &&
      registryCoverage.totalFoods === 0
    ) {
      issues.push(
        "All beverage modules report loaded but no beverage records are visible in AriFoodRegistry."
      );
    }

    if (
      status.ready &&
      registryCoverage.available
    ) {
      const emptyLoadedModules =
        registryCoverage.modules.filter(
          entry => {
            const module =
              moduleState.get(
                entry.module
              );

            return (
              module?.status === "loaded" &&
              entry.count === 0
            );
          }
        );

      if (emptyLoadedModules.length > 0) {
        issues.push(
          `${emptyLoadedModules.length} loaded beverage module(s) have zero visible registry records.`
        );
      }
    }

    return {
      ok:
        issues.length === 0,

      ready:
        status.ready,

      status,

      pendingModules:
        pendingModules.map(
          module => module.name
        ),

      failedModules:
        failedModules.map(
          module => module.name
        ),

      registryCoverage,

      brandFirst: true,

      canonicalBasis: {
        fluidBeverages: {
          type: "volume",
          amount: 100,
          unit: "mL",
          milliliters: 100
        }
      },

      issues
    };
  }

  function getDiagnostics() {
    return {
      version: VERSION,

      collectionId:
        COLLECTION_ID,

      collectionName:
        COLLECTION_NAME,

      strategy:
        "brand-first",

      canonicalBasis: {
        fluidBeverages: {
          type: "volume",
          amount: 100,
          unit: "mL",
          milliliters: 100
        }
      },

      expectedModules:
        [...EXPECTED_MODULES],

      coreModule:
        getCoreModuleName(),

      brandModules:
        getBrandModuleNames(),

      status:
        getStatus(),

      totals:
        getTotals(),

      modules:
        getModules(),

      registryCoverage:
        getRegistryCoverage(),

      registryCoverageMap:
        getRegistryCoverageMap(),

      health:
        healthCheck()
    };
  }

  global.AriFoodBeverages =
    Object.freeze({
      VERSION,

      COLLECTION_ID,
      COLLECTION_NAME,

      getExpectedModules() {
        return [
          ...EXPECTED_MODULES
        ];
      },

      getCoreModuleName,
      getBrandModuleNames,

      isExpectedModule,

      markModuleLoaded,
      markModuleFailed,

      resetModule,
      resetAllModules,

      getModule,
      getModules,

      getLoadedModules,
      getPendingModules,
      getFailedModules,

      getStatus,
      getTotals,

      isReady,

      getRegistryCoverage,
      getRegistryCoverageMap,

      healthCheck,
      getDiagnostics
    });

  dispatch(
    "ari:food-beverages-initialized",
    {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName: COLLECTION_NAME,

      strategy: "brand-first",

      canonicalBasis: {
        fluidBeverages: {
          type: "volume",
          amount: 100,
          unit: "mL",
          milliliters: 100
        }
      },

      expectedModules: [
        ...EXPECTED_MODULES
      ],

      status:
        getStatus()
    }
  );

  console.info(
    `[ARI Nutrition] ${COLLECTION_NAME} v${VERSION} initialized with ${EXPECTED_MODULES.length} expected beverage modules using a brand-first architecture.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
