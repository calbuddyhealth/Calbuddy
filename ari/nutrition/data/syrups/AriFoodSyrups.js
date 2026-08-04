// =====================================================
// ARI REBIRTH
// File: AriFoodSyrups.js
// Version: 1.0.0
//
// Purpose:
//   Collection controller for ARI Nutrition's syrup and
//   liquid-sweetener pathway.
//
// Pathway:
//   ari/nutrition/data/syrups/
//
// Scope:
//   Includes:
//   - Pure maple syrup
//   - Pancake / breakfast syrup
//   - Chocolate syrup
//   - Caramel syrup
//   - Corn syrup
//   - Golden syrup
//   - Molasses
//   - Agave nectar
//   - Honey
//   - Date syrup
//   - Sugar-free syrup
//   - Zero-calorie flavored syrup
//
// Architecture:
//   HYBRID.
//
//   AriFoodSyrupsCore is the required generic fallback
//   dataset.
//
//   AriFoodSyrupBrands is also required because branded
//   syrups vary substantially in calories, sugar,
//   sweetener system, serving size, and formulation.
//
// Responsibilities:
//   - Track required Syrups child modules.
//   - Record module load/failure state.
//   - Aggregate registration counts.
//   - Expose readiness, coverage, health, and diagnostics.
//   - Keep liquid sweeteners isolated from seasonings,
//     condiments, beverages, and desserts.
//
// Non-responsibilities:
//   - Does not contain individual syrup records.
//   - Does not infer how much syrup a user poured.
//   - Does not merge dry granulated sugar into this path.
//   - Does not fetch runtime internet data.
//
// Canonical basis:
//   100 g.
//
// Serving guidance for child records:
//   - Preserve common household serving sizes such as
//     1 tbsp, 2 tbsp, 1/4 cup, or manufacturer label size.
//   - Normalize all records to 100 g.
//
// Taxonomy:
//   - Dry sugars remain in AriFoodSeasonings.
//   - Liquid sweeteners belong here.
//   - Sauces that are primarily savory remain in
//     AriFoodCondiments.
//
// Dependencies:
//   - AriFoodRegistry v2+
// =====================================================

(function initializeAriFoodSyrups(global) {
  "use strict";

  const VERSION = "1.0.0";
  const COLLECTION_ID = "syrups";
  const COLLECTION_NAME = "AriFoodSyrups";

  const REQUIRED_MODULES = Object.freeze([
    "AriFoodSyrupsCore",
    "AriFoodSyrupBrands"
  ]);

  const OPTIONAL_MODULES = Object.freeze([]);

  const KNOWN_MODULES = Object.freeze([
    ...REQUIRED_MODULES,
    ...OPTIONAL_MODULES
  ]);

  const CANONICAL_BASIS = Object.freeze({
    type: "weight",
    amount: 100,
    unit: "g",
    grams: 100
  });

  const moduleState = new Map();
  let initializedAt = new Date().toISOString();
  let readyEventEmitted = false;

  function nowIso() {
    return new Date().toISOString();
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

  function emitEvent(name, detail) {
    try {
      global.dispatchEvent(
        new CustomEvent(name, {
          detail: clone(detail)
        })
      );
    } catch (error) {
      // Non-browser environments may not support CustomEvent.
    }
  }

  function createModuleState(moduleName) {
    return {
      moduleName,
      required: REQUIRED_MODULES.includes(moduleName),
      status: "pending",
      registered: 0,
      replaced: 0,
      rejected: 0,
      duplicates: 0,
      loadedAt: null,
      failedAt: null,
      error: null,
      metadata: null
    };
  }

  function initializeModuleState() {
    moduleState.clear();

    for (const moduleName of KNOWN_MODULES) {
      moduleState.set(
        moduleName,
        createModuleState(moduleName)
      );
    }
  }

  initializeModuleState();

  function isKnownModule(moduleName) {
    return moduleState.has(
      String(moduleName || "").trim()
    );
  }

  function isRequiredModule(moduleName) {
    return REQUIRED_MODULES.includes(
      String(moduleName || "").trim()
    );
  }

  function isOptionalModule(moduleName) {
    return OPTIONAL_MODULES.includes(
      String(moduleName || "").trim()
    );
  }

  function normalizeModuleResult(result = {}) {
    return {
      registered: Number(result.registered) || 0,
      replaced: Number(result.replaced) || 0,
      rejected: Number(result.rejected) || 0,
      duplicates: Number(result.duplicates) || 0,
      metadata: result.metadata
        ? clone(result.metadata)
        : null
    };
  }

  function getModule(moduleName) {
    const state = moduleState.get(
      String(moduleName || "").trim()
    );

    return state ? clone(state) : null;
  }

  function getModules() {
    return Array.from(
      moduleState.values()
    ).map(clone);
  }

  function getRequiredModules() {
    return REQUIRED_MODULES
      .map(getModule)
      .filter(Boolean);
  }

  function getOptionalModules() {
    return OPTIONAL_MODULES
      .map(getModule)
      .filter(Boolean);
  }

  function getLoadedModules() {
    return getModules().filter(
      module => module.status === "loaded"
    );
  }

  function getPendingModules() {
    return getModules().filter(
      module => module.status === "pending"
    );
  }

  function getFailedModules() {
    return getModules().filter(
      module => module.status === "failed"
    );
  }

  function getTotals() {
    const totals = {
      knownModules: KNOWN_MODULES.length,
      requiredModules: REQUIRED_MODULES.length,
      optionalModules: OPTIONAL_MODULES.length,

      loadedModules: 0,
      pendingModules: 0,
      failedModules: 0,

      loadedRequiredModules: 0,
      pendingRequiredModules: 0,
      failedRequiredModules: 0,

      registered: 0,
      replaced: 0,
      rejected: 0,
      duplicates: 0
    };

    for (const state of moduleState.values()) {
      if (state.status === "loaded") {
        totals.loadedModules += 1;

        if (state.required) {
          totals.loadedRequiredModules += 1;
        }
      } else if (state.status === "failed") {
        totals.failedModules += 1;

        if (state.required) {
          totals.failedRequiredModules += 1;
        }
      } else {
        totals.pendingModules += 1;

        if (state.required) {
          totals.pendingRequiredModules += 1;
        }
      }

      totals.registered +=
        Number(state.registered) || 0;

      totals.replaced +=
        Number(state.replaced) || 0;

      totals.rejected +=
        Number(state.rejected) || 0;

      totals.duplicates +=
        Number(state.duplicates) || 0;
    }

    return totals;
  }

  function isReady() {
    const totals = getTotals();

    return (
      totals.loadedRequiredModules ===
        totals.requiredModules &&
      totals.failedRequiredModules === 0
    );
  }

  function getStatus() {
    const totals = getTotals();

    if (totals.failedRequiredModules > 0) {
      return "degraded";
    }

    if (isReady()) {
      return "ready";
    }

    if (totals.loadedModules > 0) {
      return "loading";
    }

    return "pending";
  }

  function maybeEmitReady() {
    if (
      readyEventEmitted ||
      !isReady()
    ) {
      return;
    }

    readyEventEmitted = true;

    emitEvent(
      "ari:food-syrups-ready",
      {
        version: VERSION,
        collectionId: COLLECTION_ID,
        collectionName: COLLECTION_NAME,
        totals: getTotals(),
        modules: getModules()
      }
    );
  }

  function markModuleLoaded(
    moduleName,
    result = {}
  ) {
    const normalized =
      String(moduleName || "").trim();

    if (!isKnownModule(normalized)) {
      console.warn(
        `[ARI Nutrition] ${COLLECTION_NAME} ignored unknown module: ${normalized}`
      );
      return false;
    }

    const normalizedResult =
      normalizeModuleResult(result);

    const current =
      moduleState.get(normalized);

    const next = {
      ...current,
      status: "loaded",
      registered:
        normalizedResult.registered,
      replaced:
        normalizedResult.replaced,
      rejected:
        normalizedResult.rejected,
      duplicates:
        normalizedResult.duplicates,
      metadata:
        normalizedResult.metadata,
      loadedAt: nowIso(),
      failedAt: null,
      error: null
    };

    moduleState.set(
      normalized,
      next
    );

    emitEvent(
      "ari:food-syrups-module-update",
      {
        action: "loaded",
        module: clone(next),
        totals: getTotals(),
        status: getStatus()
      }
    );

    maybeEmitReady();
    return true;
  }

  function markModuleFailed(
    moduleName,
    error,
    metadata = null
  ) {
    const normalized =
      String(moduleName || "").trim();

    if (!isKnownModule(normalized)) {
      console.warn(
        `[ARI Nutrition] ${COLLECTION_NAME} ignored failure from unknown module: ${normalized}`
      );
      return false;
    }

    const current =
      moduleState.get(normalized);

    const message =
      error instanceof Error
        ? error.message
        : String(
            error ||
            "Unknown module failure"
          );

    const next = {
      ...current,
      status: "failed",
      failedAt: nowIso(),
      loadedAt: null,
      error: message,
      metadata: metadata
        ? clone(metadata)
        : current.metadata
    };

    moduleState.set(
      normalized,
      next
    );

    if (current.required) {
      readyEventEmitted = false;
    }

    emitEvent(
      "ari:food-syrups-module-update",
      {
        action: "failed",
        module: clone(next),
        totals: getTotals(),
        status: getStatus()
      }
    );

    return true;
  }

  function resetModule(moduleName) {
    const normalized =
      String(moduleName || "").trim();

    if (!isKnownModule(normalized)) {
      return false;
    }

    moduleState.set(
      normalized,
      createModuleState(normalized)
    );

    if (isRequiredModule(normalized)) {
      readyEventEmitted = false;
    }

    emitEvent(
      "ari:food-syrups-reset",
      {
        scope: "module",
        moduleName: normalized,
        totals: getTotals()
      }
    );

    return true;
  }

  function resetAllModules() {
    initializeModuleState();
    initializedAt = nowIso();
    readyEventEmitted = false;

    emitEvent(
      "ari:food-syrups-reset",
      {
        scope: "collection",
        totals: getTotals()
      }
    );

    return true;
  }

  function getRegistryCoverage() {
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.getBySource !==
        "function"
    ) {
      return null;
    }

    const coverage = {};

    for (const moduleName of KNOWN_MODULES) {
      try {
        const records =
          registry.getBySource(
            moduleName,
            {
              includeDisabled: true
            }
          );

        coverage[moduleName] =
          Array.isArray(records)
            ? records.length
            : 0;
      } catch (error) {
        coverage[moduleName] = null;
      }
    }

    return coverage;
  }

  function getRegistryCoverageMap() {
    const coverage =
      getRegistryCoverage();

    return coverage
      ? new Map(
          Object.entries(coverage)
        )
      : null;
  }

  function healthCheck() {
    const issues = [];
    const totals = getTotals();
    const registry =
      global.AriFoodRegistry;

    if (
      !registry ||
      typeof registry.registerMany !==
        "function"
    ) {
      issues.push({
        code: "registry_unavailable",
        severity: "error",
        message:
          "AriFoodRegistry is unavailable."
      });
    }

    for (const state of moduleState.values()) {
      if (
        state.status === "failed" &&
        state.required
      ) {
        issues.push({
          code: "required_module_failed",
          severity: "error",
          module: state.moduleName,
          message:
            state.error ||
            "Required Syrups module failed."
        });
      } else if (
        state.status === "failed" &&
        !state.required
      ) {
        issues.push({
          code: "optional_module_failed",
          severity: "warning",
          module: state.moduleName,
          message:
            state.error ||
            "Optional Syrups module failed."
        });
      }
    }

    const coverage =
      getRegistryCoverage();

    if (
      isReady() &&
      totals.registered === 0
    ) {
      issues.push({
        code: "ready_zero_records",
        severity: "warning",
        message:
          "Required Syrups modules report ready but registration total is zero."
      });
    }

    if (coverage) {
      for (const state of moduleState.values()) {
        if (
          state.status === "loaded" &&
          coverage[state.moduleName] === 0 &&
          Number(state.registered) > 0
        ) {
          issues.push({
            code:
              "loaded_module_not_visible_in_registry",
            severity: "warning",
            module: state.moduleName,
            message:
              "Module reported registrations but no records are visible by source in the registry."
          });
        }
      }
    }

    return {
      ok: !issues.some(
        issue =>
          issue.severity === "error"
      ),
      status: getStatus(),
      ready: isReady(),
      totals,
      issues,
      registryCoverage: coverage
    };
  }

  function getDiagnostics() {
    return {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName: COLLECTION_NAME,
      initializedAt,
      status: getStatus(),
      ready: isReady(),

      architecture: {
        strategy: "hybrid",
        requiredCoreModule:
          "AriFoodSyrupsCore",
        requiredBrandModule:
          "AriFoodSyrupBrands",
        brandedModuleRequired: true
      },

      taxonomy: {
        mapleSyrupIncluded: true,
        pancakeSyrupIncluded: true,
        chocolateSyrupIncluded: true,
        caramelSyrupIncluded: true,
        cornSyrupIncluded: true,
        molassesIncluded: true,
        agaveIncluded: true,
        honeyIncluded: true,
        dateSyrupIncluded: true,
        sugarFreeSyrupIncluded: true,

        drySugarIncluded: false,
        savoryCondimentsIncluded: false,
        beveragesIncluded: false
      },

      canonicalBasis:
        clone(CANONICAL_BASIS),

      requiredModules:
        [...REQUIRED_MODULES],

      optionalModules:
        [...OPTIONAL_MODULES],

      knownModules:
        [...KNOWN_MODULES],

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

  global.AriFoodSyrups =
    Object.freeze({
      VERSION,
      COLLECTION_ID,
      COLLECTION_NAME,

      REQUIRED_MODULES:
        [...REQUIRED_MODULES],

      OPTIONAL_MODULES:
        [...OPTIONAL_MODULES],

      KNOWN_MODULES:
        [...KNOWN_MODULES],

      CANONICAL_BASIS:
        clone(CANONICAL_BASIS),

      isKnownModule,
      isRequiredModule,
      isOptionalModule,

      markModuleLoaded,
      markModuleFailed,

      resetModule,
      resetAllModules,

      getModule,
      getModules,
      getRequiredModules,
      getOptionalModules,
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

  emitEvent(
    "ari:food-syrups-initialized",
    {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName:
        COLLECTION_NAME,

      requiredModules:
        [...REQUIRED_MODULES],

      optionalModules:
        [...OPTIONAL_MODULES],

      canonicalBasis:
        clone(CANONICAL_BASIS),

      architecture: {
        strategy: "hybrid",
        brandedModuleRequired: true
      }
    }
  );

  console.info(
    `[ARI Nutrition] ${COLLECTION_NAME} v${VERSION} initialized with ${REQUIRED_MODULES.length} required module(s).`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
