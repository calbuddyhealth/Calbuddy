// =====================================================
// ARI REBIRTH
// File: AriFoodProteins.js
// Version: 1.0.0
//
// Purpose:
//   Collection controller for ARI Nutrition protein
//   food-data modules.
//
// Architecture:
//
//   AriFoodRegistry
//          ↑
//          │
//   AriFoodProteins
//          ↑
//          │
//   ├── AriFoodPoultry.js
//   ├── AriFoodBeef.js
//   ├── AriFoodPork.js
//   ├── AriFoodSeafood.js
//   ├── AriFoodEggs.js
//   ├── AriFoodLamb.js
//   ├── AriFoodGameMeats.js
//   └── AriFoodPlantProteins.js
//
// Responsibilities:
//   - Define the canonical protein data-module collection.
//   - Track which protein modules have loaded.
//   - Track module registration results.
//   - Track module failures.
//   - Expose protein collection readiness.
//   - Expose diagnostics for protein food coverage.
//   - Report food counts registered by each protein module.
//   - Dispatch readiness/update events.
//
// Non-responsibilities:
//   - Does not contain actual protein food records.
//   - Does not register poultry/beef/pork/etc. food data.
//   - Does not search foods.
//   - Does not calculate serving nutrition.
//   - Does not access Supabase.
//   - Does not manipulate the DOM.
//
// Integration contract for child modules:
//
//   After a child module registers its foods:
//
//   AriFoodProteins.markModuleLoaded(
//     "AriFoodPoultry",
//     {
//       registered: 42,
//       rejected: 0,
//       duplicates: 0
//     }
//   );
//
//   If loading fails:
//
//   AriFoodProteins.markModuleFailed(
//     "AriFoodPoultry",
//     "Reason for failure"
//   );
//
// =====================================================

(function initializeAriFoodProteins(global) {
  "use strict";


  // =====================================================
  // VERSION
  // =====================================================

  const VERSION = "1.0.0";


  // =====================================================
  // COLLECTION IDENTITY
  // =====================================================

  const COLLECTION_ID = "proteins";
  const COLLECTION_NAME = "ARI Food Proteins";


  // =====================================================
  // EXPECTED MODULES
  // =====================================================

  const EXPECTED_MODULES = Object.freeze([
    "AriFoodPoultry",
    "AriFoodBeef",
    "AriFoodPork",
    "AriFoodSeafood",
    "AriFoodEggs",
    "AriFoodLamb",
    "AriFoodGameMeats",
    "AriFoodPlantProteins"
  ]);


  // =====================================================
  // INTERNAL STATE
  // =====================================================

  const moduleState = new Map();

  let initializedAt =
    new Date().toISOString();

  let lastUpdatedAt =
    initializedAt;

  let readyEventDispatched =
    false;


  // Seed all expected modules.
  for (const moduleName of EXPECTED_MODULES) {
    moduleState.set(
      moduleName,
      {
        name: moduleName,
        status: "pending",
        loaded: false,
        failed: false,

        registered: 0,
        replaced: 0,
        rejected: 0,
        duplicates: 0,

        error: null,

        loadedAt: null,
        updatedAt: initializedAt,

        metadata: {}
      }
    );
  }


  // =====================================================
  // HELPERS
  // =====================================================

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


  function nonNegativeInteger(
    value,
    fallback = 0
  ) {
    return Math.max(
      0,
      Math.round(
        safeNumber(
          value,
          fallback
        )
      )
    );
  }


  function clone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Fall back to JSON clone.
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


  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }


  function getRegistry() {
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.getBySource !== "function"
    ) {
      return null;
    }

    return registry;
  }


  function isExpectedModule(moduleName) {
    return EXPECTED_MODULES.includes(
      cleanString(moduleName)
    );
  }


  function touch() {
    lastUpdatedAt =
      new Date().toISOString();
  }


  // =====================================================
  // EVENTS
  // =====================================================

  function dispatchEventSafe(
    eventName,
    detail
  ) {
    try {
      global.dispatchEvent(
        new CustomEvent(
          eventName,
          {
            detail:
              clone(detail)
          }
        )
      );
    } catch (error) {
      // Non-browser environments may not
      // support CustomEvent.
    }
  }


  function dispatchModuleUpdate(
    moduleName
  ) {
    const record =
      moduleState.get(moduleName);

    if (!record) {
      return;
    }

    dispatchEventSafe(
      "ari:food-proteins-module-update",
      {
        collection:
          COLLECTION_ID,

        module:
          clone(record),

        status:
          getStatus()
      }
    );
  }


  function maybeDispatchReady() {
    const status =
      getStatus();

    if (
      status.ready &&
      !readyEventDispatched
    ) {
      readyEventDispatched = true;

      dispatchEventSafe(
        "ari:food-proteins-ready",
        {
          version:
            VERSION,

          collection:
            COLLECTION_ID,

          status
        }
      );
    }

    if (!status.ready) {
      readyEventDispatched = false;
    }
  }


  // =====================================================
  // MODULE STATE MANAGEMENT
  // =====================================================

  function markModuleLoaded(
    moduleName,
    result = {}
  ) {
    const name =
      cleanString(moduleName);

    if (!name) {
      return {
        ok: false,
        error:
          "moduleName is required."
      };
    }


    if (
      !moduleState.has(name)
    ) {
      moduleState.set(
        name,
        {
          name,
          status: "pending",
          loaded: false,
          failed: false,

          registered: 0,
          replaced: 0,
          rejected: 0,
          duplicates: 0,

          error: null,

          loadedAt: null,
          updatedAt:
            new Date().toISOString(),

          metadata: {
            dynamicallyAdded:
              true
          }
        }
      );
    }


    const current =
      moduleState.get(name);

    const now =
      new Date().toISOString();


    current.status =
      "loaded";

    current.loaded =
      true;

    current.failed =
      false;

    current.registered =
      nonNegativeInteger(
        result.registered,
        current.registered
      );

    current.replaced =
      nonNegativeInteger(
        result.replaced,
        current.replaced
      );

    current.rejected =
      nonNegativeInteger(
        result.rejected,
        current.rejected
      );

    current.duplicates =
      nonNegativeInteger(
        result.duplicates,
        current.duplicates
      );

    current.error =
      null;

    current.loadedAt =
      current.loadedAt || now;

    current.updatedAt =
      now;

    current.metadata = {
      ...current.metadata,

      ...(isPlainObject(
        result.metadata
      )
        ? clone(
            result.metadata
          )
        : {})
    };


    moduleState.set(
      name,
      current
    );

    touch();

    dispatchModuleUpdate(name);
    maybeDispatchReady();


    return {
      ok: true,
      module:
        clone(current),

      status:
        getStatus()
    };
  }


  function markModuleFailed(
    moduleName,
    error,
    metadata = {}
  ) {
    const name =
      cleanString(moduleName);

    if (!name) {
      return {
        ok: false,
        error:
          "moduleName is required."
      };
    }


    if (
      !moduleState.has(name)
    ) {
      moduleState.set(
        name,
        {
          name,
          status: "pending",
          loaded: false,
          failed: false,

          registered: 0,
          replaced: 0,
          rejected: 0,
          duplicates: 0,

          error: null,

          loadedAt: null,
          updatedAt:
            new Date().toISOString(),

          metadata: {
            dynamicallyAdded:
              true
          }
        }
      );
    }


    const current =
      moduleState.get(name);

    const now =
      new Date().toISOString();


    current.status =
      "failed";

    current.loaded =
      false;

    current.failed =
      true;

    current.error =
      cleanString(error) ||
      "Unknown module failure.";

    current.updatedAt =
      now;

    current.metadata = {
      ...current.metadata,

      ...(isPlainObject(metadata)
        ? clone(metadata)
        : {})
    };


    moduleState.set(
      name,
      current
    );

    touch();

    dispatchModuleUpdate(name);
    maybeDispatchReady();


    return {
      ok: true,
      module:
        clone(current),

      status:
        getStatus()
    };
  }


  function resetModule(
    moduleName
  ) {
    const name =
      cleanString(moduleName);

    if (
      !name ||
      !moduleState.has(name)
    ) {
      return false;
    }


    const existing =
      moduleState.get(name);

    moduleState.set(
      name,
      {
        name,

        status: "pending",
        loaded: false,
        failed: false,

        registered: 0,
        replaced: 0,
        rejected: 0,
        duplicates: 0,

        error: null,

        loadedAt: null,
        updatedAt:
          new Date().toISOString(),

        metadata:
          clone(
            existing.metadata || {}
          )
      }
    );


    touch();

    dispatchModuleUpdate(name);
    maybeDispatchReady();

    return true;
  }


  // =====================================================
  // MODULE LOOKUPS
  // =====================================================

  function getModule(
    moduleName
  ) {
    const name =
      cleanString(moduleName);

    const record =
      moduleState.get(name);

    return record
      ? clone(record)
      : null;
  }


  function getModules() {
    return Array.from(
      moduleState.values()
    ).map(clone);
  }


  function getExpectedModules() {
    return [
      ...EXPECTED_MODULES
    ];
  }


  function getLoadedModules() {
    return Array.from(
      moduleState.values()
    )
      .filter(
        module =>
          module.loaded === true
      )
      .map(clone);
  }


  function getPendingModules() {
    return Array.from(
      moduleState.values()
    )
      .filter(
        module =>
          module.status ===
          "pending"
      )
      .map(clone);
  }


  function getFailedModules() {
    return Array.from(
      moduleState.values()
    )
      .filter(
        module =>
          module.failed === true
      )
      .map(clone);
  }


  // =====================================================
  // REGISTRY COVERAGE
  // =====================================================

  function getRegistryCountForModule(
    moduleName
  ) {
    const registry =
      getRegistry();

    if (!registry) {
      return null;
    }


    try {
      const foods =
        registry.getBySource(
          moduleName,
          {
            includeDisabled: true
          }
        );

      return Array.isArray(foods)
        ? foods.length
        : 0;
    } catch (error) {
      return null;
    }
  }


  function getRegistryCoverage() {
    const registry =
      getRegistry();

    const modules = {};


    for (
      const moduleName
      of moduleState.keys()
    ) {
      modules[moduleName] = {
        registeredFoods:
          registry
            ? getRegistryCountForModule(
                moduleName
              )
            : null
      };
    }


    let totalFoods = null;


    if (
      registry &&
      typeof registry.count === "function"
    ) {
      try {
        totalFoods =
          registry.count({
            includeDisabled: true
          });
      } catch (error) {
        totalFoods = null;
      }
    }


    return {
      registryAvailable:
        Boolean(registry),

      registryVersion:
        registry?.VERSION ||
        null,

      totalRegistryFoods:
        totalFoods,

      modules
    };
  }


  // =====================================================
  // COLLECTION STATUS
  // =====================================================

  function getStatus() {
    const expectedCount =
      EXPECTED_MODULES.length;

    let expectedLoaded = 0;
    let expectedFailed = 0;
    let expectedPending = 0;


    for (
      const moduleName
      of EXPECTED_MODULES
    ) {
      const record =
        moduleState.get(moduleName);

      if (!record) {
        expectedPending += 1;
        continue;
      }

      if (record.loaded) {
        expectedLoaded += 1;
        continue;
      }

      if (record.failed) {
        expectedFailed += 1;
        continue;
      }

      expectedPending += 1;
    }


    const ready =
      expectedCount > 0 &&
      expectedLoaded ===
        expectedCount &&
      expectedFailed === 0;


    return {
      collection:
        COLLECTION_ID,

      name:
        COLLECTION_NAME,

      version:
        VERSION,

      ready,

      expectedModules:
        expectedCount,

      loadedModules:
        expectedLoaded,

      failedModules:
        expectedFailed,

      pendingModules:
        expectedPending,

      progress:
        expectedCount > 0
          ? Math.round(
              (
                expectedLoaded /
                expectedCount
              ) *
              100
            )
          : 100
    };
  }


  function isReady() {
    return getStatus().ready;
  }


  // =====================================================
  // TOTAL MODULE RESULTS
  // =====================================================

  function getTotals() {
    let registered = 0;
    let replaced = 0;
    let rejected = 0;
    let duplicates = 0;


    for (
      const module
      of moduleState.values()
    ) {
      registered +=
        nonNegativeInteger(
          module.registered
        );

      replaced +=
        nonNegativeInteger(
          module.replaced
        );

      rejected +=
        nonNegativeInteger(
          module.rejected
        );

      duplicates +=
        nonNegativeInteger(
          module.duplicates
        );
    }


    return {
      registered,
      replaced,
      rejected,
      duplicates
    };
  }


  // =====================================================
  // HEALTH CHECK
  // =====================================================

  function healthCheck() {
    const issues = [];

    const registry =
      getRegistry();


    if (!registry) {
      issues.push({
        code:
          "registry_unavailable",

        message:
          "AriFoodRegistry is not available."
      });
    }


    for (
      const module
      of getFailedModules()
    ) {
      issues.push({
        code:
          "module_failed",

        module:
          module.name,

        message:
          module.error ||
          "Protein data module failed."
      });
    }


    return {
      ok:
        issues.length === 0,

      collection:
        COLLECTION_ID,

      ready:
        isReady(),

      status:
        getStatus(),

      issues
    };
  }


  // =====================================================
  // DIAGNOSTICS
  // =====================================================

  function getDiagnostics() {
    return {
      collection:
        "AriFoodProteins",

      collectionId:
        COLLECTION_ID,

      collectionName:
        COLLECTION_NAME,

      version:
        VERSION,

      initializedAt,

      lastUpdatedAt,

      status:
        getStatus(),

      totals:
        getTotals(),

      modules:
        getModules(),

      registryCoverage:
        getRegistryCoverage()
    };
  }


  // =====================================================
  // PUBLIC API
  // =====================================================

  const AriFoodProteins =
    Object.freeze({
      VERSION,

      COLLECTION_ID,
      COLLECTION_NAME,

      // Collection contract
      getExpectedModules,
      isExpectedModule,

      // Module lifecycle
      markModuleLoaded,
      markModuleFailed,
      resetModule,

      // Module lookup
      getModule,
      getModules,
      getLoadedModules,
      getPendingModules,
      getFailedModules,

      // Status
      getStatus,
      getTotals,
      isReady,

      // Registry visibility
      getRegistryCoverage,

      // Diagnostics
      healthCheck,
      getDiagnostics
    });


  // =====================================================
  // GLOBAL EXPORT
  // =====================================================

  global.AriFoodProteins =
    AriFoodProteins;


  // =====================================================
  // INITIAL READY EVENT
  // =====================================================

  dispatchEventSafe(
    "ari:food-proteins-initialized",
    {
      version:
        VERSION,

      collection:
        COLLECTION_ID,

      expectedModules:
        getExpectedModules(),

      status:
        getStatus()
    }
  );


  // =====================================================
  // INITIALIZATION LOG
  // =====================================================

  console.info(
    `[ARI Nutrition] AriFoodProteins v${VERSION} initialized.`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
