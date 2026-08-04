// =====================================================
// ARI REBIRTH
// File: AriFoodSpirits.js
// Version: 1.1.0
//
// Purpose:
//   Collection controller for ARI Nutrition's alcoholic
//   drink pathway.
//
// Pathway:
//   ari/nutrition/data/spirits/
//
// Umbrella definition:
//   "Spirits" is ARI's internal top-level category for
//   alcoholic drinks. It intentionally includes:
//   - Beer
//   - Wine
//   - Distilled liquor / spirits
//   - Hard seltzer
//   - Canned / premixed cocktails
//   - Malt alcoholic beverages
//   - Cocktails / mixed drinks
//
// Important taxonomy note:
//   In conventional terminology, "spirits" usually means
//   distilled alcohol only. ARI deliberately uses Spirits
//   as the broader application category for all alcoholic
//   drinks.
//
// Architecture:
//   BRAND FIRST.
//
//   AriFoodSpiritsCore is the only generic fallback module.
//   Runtime alcohol coverage should primarily come from
//   branded product modules because that is how users most
//   often encounter alcoholic drinks.
//
// Responsibilities:
//   - Track expected Spirits child modules.
//   - Record module load/failure state.
//   - Aggregate registration counts.
//   - Expose readiness, coverage, health, and diagnostics.
//   - Keep alcoholic-drink data isolated from beverages.
//   - Define the collection-level alcohol metadata contract.
//
// Non-responsibilities:
//   - Does not contain individual food records.
//   - Does not infer ABV or alcohol grams.
//   - Does not calculate standard drinks itself.
//   - Does not fetch runtime internet data.
//
// Canonical basis:
//   100 mL for fluid alcoholic beverages.
//
// Suggested serving conventions in child records:
//   - Beer: 12 fl oz / 355 mL
//   - Wine: 5 fl oz / 148 mL
//   - Liquor: 1.5 fl oz / 44 mL
//   - Hard seltzer: 12 fl oz / 355 mL
//   - Malt beverage: exact package/container serving
//   - Canned cocktail: exact package/container serving
//   - Cocktail: exact recipe/container serving
//
// Alcohol metadata contract for child records:
//   metadata.alcohol = {
//     abvPercent,
//     alcoholGramsPerServing,
//     standardDrinksPerServing,
//     standardDrinkDefinition
//   }
//
// Dependencies:
//   - AriFoodRegistry v2+
// =====================================================

(function initializeAriFoodSpirits(global) {
  "use strict";

  const VERSION = "1.1.0";
  const COLLECTION_ID = "spirits";
  const COLLECTION_NAME = "AriFoodSpirits";

  // =====================================================
  // EXPECTED MODULES
  //
  // Brand-first architecture:
  //   - One generic fallback module.
  //   - Branded modules provide primary runtime coverage.
  //
  // Do not add AriFoodBeer, AriFoodWine, AriFoodLiquor,
  // or AriFoodCocktails generic modules. Their fallback
  // role is owned by AriFoodSpiritsCore.
  // =====================================================

  const EXPECTED_MODULES = Object.freeze([
    "AriFoodSpiritsCore",
    "AriFoodBeerBrands",
    "AriFoodWineBrands",
    "AriFoodLiquorBrands",
    "AriFoodHardSeltzerBrands",
    "AriFoodCannedCocktailBrands",
    "AriFoodMaltBeverageBrands",
    "AriFoodCocktailBrands"
  ]);

  const GENERIC_MODULES = Object.freeze([
    "AriFoodSpiritsCore"
  ]);

  const BRAND_MODULES = Object.freeze([
    "AriFoodBeerBrands",
    "AriFoodWineBrands",
    "AriFoodLiquorBrands",
    "AriFoodHardSeltzerBrands",
    "AriFoodCannedCocktailBrands",
    "AriFoodMaltBeverageBrands",
    "AriFoodCocktailBrands"
  ]);

  const CANONICAL_BASIS = Object.freeze({
    type: "volume",
    amount: 100,
    unit: "mL",
    milliliters: 100
  });

  const ALCOHOL_METADATA_CONTRACT = Object.freeze({
    abvPercent: "number|null",
    alcoholGramsPerServing: "number|null",
    standardDrinksPerServing: "number|null",
    standardDrinkDefinition: "string|null"
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

    for (const moduleName of EXPECTED_MODULES) {
      moduleState.set(
        moduleName,
        createModuleState(moduleName)
      );
    }
  }

  initializeModuleState();

  function isExpectedModule(moduleName) {
    return moduleState.has(
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
    const normalized =
      String(moduleName || "").trim();

    const state =
      moduleState.get(normalized);

    return state
      ? clone(state)
      : null;
  }

  function getModules() {
    return Array.from(
      moduleState.values()
    ).map(clone);
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
      expectedModules: EXPECTED_MODULES.length,
      loadedModules: 0,
      pendingModules: 0,
      failedModules: 0,
      registered: 0,
      replaced: 0,
      rejected: 0,
      duplicates: 0
    };

    for (const state of moduleState.values()) {
      if (state.status === "loaded") {
        totals.loadedModules += 1;
      } else if (state.status === "failed") {
        totals.failedModules += 1;
      } else {
        totals.pendingModules += 1;
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
      totals.loadedModules ===
        totals.expectedModules &&
      totals.failedModules === 0
    );
  }

  function getStatus() {
    const totals = getTotals();

    if (totals.failedModules > 0) {
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
      "ari:food-spirits-ready",
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

    if (!isExpectedModule(normalized)) {
      console.warn(
        `[ARI Nutrition] ${COLLECTION_NAME} ignored unexpected module: ${normalized}`
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
      "ari:food-spirits-module-update",
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

    if (!isExpectedModule(normalized)) {
      console.warn(
        `[ARI Nutrition] ${COLLECTION_NAME} ignored failure from unexpected module: ${normalized}`
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

    readyEventEmitted = false;

    emitEvent(
      "ari:food-spirits-module-update",
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

    if (!isExpectedModule(normalized)) {
      return false;
    }

    moduleState.set(
      normalized,
      createModuleState(normalized)
    );

    readyEventEmitted = false;

    emitEvent(
      "ari:food-spirits-reset",
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
      "ari:food-spirits-reset",
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

    for (
      const moduleName of
      EXPECTED_MODULES
    ) {
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

    for (
      const state of
      moduleState.values()
    ) {
      if (
        state.status === "failed"
      ) {
        issues.push({
          code: "module_failed",
          severity: "error",
          module: state.moduleName,
          message:
            state.error ||
            "Module failed."
        });
      }
    }

    const coverage =
      getRegistryCoverage();

    if (
      totals.loadedModules ===
        totals.expectedModules &&
      totals.registered === 0
    ) {
      issues.push({
        code:
          "all_loaded_zero_records",
        severity: "warning",
        message:
          "All Spirits modules report loaded but registration total is zero."
      });
    }

    if (coverage) {
      for (
        const state of
        moduleState.values()
      ) {
        if (
          state.status === "loaded" &&
          coverage[state.moduleName] ===
            0 &&
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
        strategy: "brand-first",
        genericFallbackModule:
          "AriFoodSpiritsCore",
        genericChildModulesRequired:
          false
      },

      taxonomy: {
        umbrellaMeaning:
          "ARI top-level category for alcoholic drinks",

        conventionalTerminologyNote:
          "Outside ARI, spirits usually means distilled alcohol only.",

        separateFromAriFoodBeverages:
          true
      },

      canonicalBasis:
        clone(CANONICAL_BASIS),

      alcoholMetadataContract:
        clone(
          ALCOHOL_METADATA_CONTRACT
        ),

      expectedModules:
        [...EXPECTED_MODULES],

      genericModules:
        [...GENERIC_MODULES],

      brandModules:
        [...BRAND_MODULES],

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

  global.AriFoodSpirits =
    Object.freeze({
      VERSION,
      COLLECTION_ID,
      COLLECTION_NAME,

      EXPECTED_MODULES:
        [...EXPECTED_MODULES],

      GENERIC_MODULES:
        [...GENERIC_MODULES],

      BRAND_MODULES:
        [...BRAND_MODULES],

      CANONICAL_BASIS:
        clone(CANONICAL_BASIS),

      ALCOHOL_METADATA_CONTRACT:
        clone(
          ALCOHOL_METADATA_CONTRACT
        ),

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

      getGenericModuleNames() {
        return [
          ...GENERIC_MODULES
        ];
      },

      getBrandModuleNames() {
        return [
          ...BRAND_MODULES
        ];
      },

      healthCheck,
      getDiagnostics
    });

  emitEvent(
    "ari:food-spirits-initialized",
    {
      version: VERSION,
      collectionId: COLLECTION_ID,
      collectionName:
        COLLECTION_NAME,

      expectedModules:
        [...EXPECTED_MODULES],

      genericModules:
        [...GENERIC_MODULES],

      brandModules:
        [...BRAND_MODULES],

      canonicalBasis:
        clone(CANONICAL_BASIS),

      architecture: {
        strategy: "brand-first",
        genericFallbackModule:
          "AriFoodSpiritsCore"
      },

      separateFromAriFoodBeverages:
        true
    }
  );

  console.info(
    `[ARI Nutrition] ${COLLECTION_NAME} v${VERSION} initialized with ${EXPECTED_MODULES.length} expected modules (${BRAND_MODULES.length} branded + ${GENERIC_MODULES.length} generic fallback).`
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
);
