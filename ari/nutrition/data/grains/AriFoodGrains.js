// =====================================================
// ARI REBIRTH
// File: AriFoodGrains.js
// Version: 1.0.0
//
// Purpose:
//   Collection controller for ARI Nutrition grain
//   submodules.
//
// Architecture:
//   AriFoodRegistry
//        ↓
//   AriFoodGrains
//        ↓
//   ├── AriFoodRice
//   ├── AriFoodPasta
//   ├── AriFoodBread
//   ├── AriFoodOats
//   ├── AriFoodCereals
//   └── AriFoodOtherGrains
//
// Responsibilities:
//   - Define the expected grain-data modules.
//   - Track module loading state.
//   - Track registration counts and failures.
//   - Report collection readiness.
//   - Report AriFoodRegistry coverage by source.
//   - Expose collection diagnostics.
//   - Emit module/update/readiness events.
//
// Non-responsibilities:
//   - Does not contain grain food records.
//   - Does not search foods.
//   - Does not calculate nutrition.
//   - Does not manipulate the DOM.
//   - Does not persist meals.
// =====================================================

(function initializeAriFoodGrains(global) {
  "use strict";

  const VERSION = "1.0.0";
  const COLLECTION_ID = "grains";
  const COLLECTION_NAME = "AriFoodGrains";

  const EXPECTED_MODULES = Object.freeze([
    "AriFoodRice",
    "AriFoodPasta",
    "AriFoodBread",
    "AriFoodOats",
    "AriFoodCereals",
    "AriFoodOtherGrains"
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
        "ari:food-grains-ready",
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
      "ari:food-grains-module-update",
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

  function healthCheck() {
    const status =
      getStatus();

    const failedModules =
      getFailedModules();

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
        `${failedModules.length} grain module(s) failed.`
      );
    }

    if (
      status.complete &&
      !status.ready
    ) {
      issues.push(
        "The grain collection completed with one or more failures."
      );
    }

    if (
      status.ready &&
      registryCoverage.available &&
      registryCoverage.totalFoods === 0
    ) {
      issues.push(
        "All grain modules report loaded but no grain records are visible in AriFoodRegistry."
      );
    }

    return {
      ok:
        issues.length === 0,

      ready:
        status.ready,

      status,

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

      health:
        healthCheck()
    };
  }

  global.AriFoodGrains =
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

      getModule,
      getModules,

      getLoadedModules,
      getPendingModules,
      getFailedModules,

      getStatus,
      getTotals,

      isReady,

      getRegistryCoverage,

      healthCheck,
      getDiagnostics
    });

  dispatch(
    "ari:food-grains-initialized",
    {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName: COLLECTION_NAME,
      expectedModules: [
        ...EXPECTED_MODULES
      ],
      status: getStatus()
    }
  );

  console.info(
    `[ARI Nutrition] ${COLLECTION_NAME} v${VERSION} initialized with ${EXPECTED_MODULES.length} expected grain modules.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
