// =====================================================
// ARI REBIRTH
// File: AriFoodVegetables.js
// Version: 1.0.0
//
// Purpose:
//   Collection controller for ARI Nutrition vegetable
//   submodules.
//
// Architecture:
//   AriFoodRegistry
//        ↓
//   AriFoodVegetables
//        ↓
//   ├── AriFoodLeafyVegetables
//   ├── AriFoodCruciferousVegetables
//   ├── AriFoodRootVegetables
//   ├── AriFoodStarchyVegetables
//   └── AriFoodOtherVegetables
//
// Responsibilities:
//   - Define the expected vegetable-data modules.
//   - Track module loading state.
//   - Track registration counts and failures.
//   - Report collection readiness.
//   - Report AriFoodRegistry coverage by source.
//   - Expose collection diagnostics.
//   - Emit module/update/readiness events.
//
// Non-responsibilities:
//   - Does not contain vegetable food records.
//   - Does not search foods.
//   - Does not calculate nutrition.
//   - Does not manipulate the DOM.
//   - Does not persist meals.
// =====================================================

(function initializeAriFoodVegetables(global) {
  "use strict";

  const VERSION = "1.0.0";
  const COLLECTION_ID = "vegetables";
  const COLLECTION_NAME = "AriFoodVegetables";

  const EXPECTED_MODULES = Object.freeze([
    "AriFoodLeafyVegetables",
    "AriFoodCruciferousVegetables",
    "AriFoodRootVegetables",
    "AriFoodStarchyVegetables",
    "AriFoodOtherVegetables"
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
        "ari:food-vegetables-ready",
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
      "ari:food-vegetables-module-update",
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
      "ari:food-vegetables-reset",
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
        `${failedModules.length} vegetable module(s) failed.`
      );
    }

    if (
      status.complete &&
      !status.ready
    ) {
      issues.push(
        "The vegetable collection completed with one or more failures."
      );
    }

    if (
      status.ready &&
      registryCoverage.available &&
      registryCoverage.totalFoods === 0
    ) {
      issues.push(
        "All vegetable modules report loaded but no vegetable records are visible in AriFoodRegistry."
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
          `${emptyLoadedModules.length} loaded vegetable module(s) have zero visible registry records.`
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

      expectedModules:
        [...EXPECTED_MODULES],

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

  global.AriFoodVegetables =
    Object.freeze({
      VERSION,

      COLLECTION_ID,
      COLLECTION_NAME,

      getExpectedModules() {
        return [
          ...EXPECTED_MODULES
        ];
      },

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
    "ari:food-vegetables-initialized",
    {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName: COLLECTION_NAME,

      expectedModules: [
        ...EXPECTED_MODULES
      ],

      status:
        getStatus()
    }
  );

  console.info(
    `[ARI Nutrition] ${COLLECTION_NAME} v${VERSION} initialized with ${EXPECTED_MODULES.length} expected vegetable modules.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);