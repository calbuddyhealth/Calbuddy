// ari/profile/ari-preference-runtime.js
// Ari Preference Runtime
//
// Purpose:
// Load, cache, refresh, and expose the authenticated user's canonical
// preference packet for the current runtime session. This module coordinates
// the Preference Store and Preference Resolver but owns neither persistence
// nor preference resolution.
//
// V1.1.0 — Shared Initialization / Canonical Guidance Access

window.Ari = window.Ari || {};

window.AriPreferenceRuntime = {
  version: "1.1.0",
  source: "ari-preference-runtime",

  _refreshPromise: null,

  _cache: {
    loaded: false,
    loading: false,
    record: null,
    resolvedPacket: null,
    loadedAt: null,
    error: null
  },

  /* =====================================================
     INITIALIZATION
  ===================================================== */

  async initialize() {
    if (this._cache.loaded) {
      return this.getPacket();
    }

    return this.refresh();
  },

  async ensureReady() {
    return this.initialize();
  },

  async refresh() {
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise =
      this.performRefresh();

    try {
      return await this._refreshPromise;
    } finally {
      this._refreshPromise = null;
    }
  },

  async performRefresh() {
    this._cache.loading = true;
    this._cache.error = null;

    try {
      const store =
        this.requireStore();

      const resolver =
        this.requireResolver();

      const storeResult =
        await store.read();

      const record =
        this.objectOrEmpty(
          storeResult?.record
        );

      const packet =
        resolver.resolve({
          preferenceStoreRecord:
            record,

          preferenceStagePacket: {
            storeRecord:
              record
          }
        });

      if (
        packet?.ok !== true ||
        packet?.ready !== true
      ) {
        throw new Error(
          "AriPreferenceResolver returned an incomplete preference packet."
        );
      }

      this._cache.record =
        this.clone(record);

      this._cache.resolvedPacket =
        this.clone(packet);

      this._cache.loaded = true;
      this._cache.loadedAt =
        Date.now();

      return this.getPacket();

    } catch (error) {
      const fallback =
        this.resolveFallback(error);

      this._cache.record = {};
      this._cache.resolvedPacket =
        this.clone(fallback);

      this._cache.loaded = true;
      this._cache.loadedAt =
        Date.now();

      this._cache.error = {
        code:
          "preference_runtime_refresh_failed",

        message:
          error instanceof Error
            ? error.message
            : String(
                error ||
                "Unknown preference runtime error"
              )
      };

      return this.getPacket();

    } finally {
      this._cache.loading = false;
    }
  },

  resolveFallback(originalError) {
    try {
      const resolver =
        this.requireResolver();

      return resolver.resolve({});
    } catch (fallbackError) {
      return {
        ok: false,
        success: false,
        complete: false,
        ready: false,

        source:
          this.source,

        version:
          this.version,

        activePreset:
          "default",

        resolvedPreferences:
          {},

        modelInstructions:
          [],

        instructionText:
          "",

        error: {
          code:
            "preference_runtime_fallback_failed",

          message:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(
                  fallbackError ||
                  originalError ||
                  "Preference fallback failed"
                )
        }
      };
    }
  },

  /* =====================================================
     CACHE CONTROL
  ===================================================== */

  invalidate() {
    this._refreshPromise = null;

    this._cache = {
      loaded: false,
      loading: false,
      record: null,
      resolvedPacket: null,
      loadedAt: null,
      error: null
    };
  },

  async afterPreferenceSave() {
    this.invalidate();
    return this.refresh();
  },

  /* =====================================================
     PUBLIC READ ACCESS
  ===================================================== */

  getPacket() {
    return this.clone(
      this._cache.resolvedPacket
    );
  },

  getRecord() {
    return this.clone(
      this._cache.record || {}
    );
  },

  getResolvedPreferences() {
    return this.clone(
      this._cache.resolvedPacket
        ?.resolvedPreferences ||
      {}
    );
  },

  getInstructionText() {
    return String(
      this._cache.resolvedPacket
        ?.instructionText ||
      ""
    );
  },

  getModelInstructions() {
    return this.clone(
      this._cache.resolvedPacket
        ?.modelInstructions ||
      []
    );
  },

  getOpenAIGuidance() {
    const packet =
      this._cache.resolvedPacket;

    return {
      ready:
        this.isReady(),

      source:
        packet?.source ||
        this.source,

      activePreset:
        packet?.activePreset ||
        "default",

      resolvedPreferences:
        this.clone(
          packet?.resolvedPreferences ||
          {}
        ),

      modelInstructions:
        this.clone(
          packet?.modelInstructions ||
          []
        ),

      instructionText:
        String(
          packet?.instructionText ||
          ""
        ),

      authorityLevel:
        "advisory_response_preference"
    };
  },

  getDiagnostics() {
    return {
      source:
        this.source,

      version:
        this.version,

      loaded:
        this._cache.loaded,

      loading:
        this._cache.loading,

      loadedAt:
        this._cache.loadedAt,

      hasRecord:
        this.hasKeys(
          this._cache.record
        ),

      hasResolvedPacket:
        Boolean(
          this._cache.resolvedPacket
        ),

      instructionTextAvailable:
        Boolean(
          this.getInstructionText()
        ),

      error:
        this.clone(
          this._cache.error
        )
    };
  },

  isReady() {
    return Boolean(
      this._cache.loaded &&
      this._cache.resolvedPacket
    );
  },

  /* =====================================================
     DEPENDENCIES
  ===================================================== */

  requireStore() {
    const store =
      window.AriUserPreferenceStore ||
      window.Ari
        ?.userPreferenceStore;

    if (!store) {
      throw new Error(
        "AriUserPreferenceStore not loaded."
      );
    }

    return store;
  },

  requireResolver() {
    const resolver =
      window.AriPreferenceResolver ||
      window.Ari
        ?.preferenceResolver;

    if (!resolver) {
      throw new Error(
        "AriPreferenceResolver not loaded."
      );
    }

    return resolver;
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const store =
      window.AriUserPreferenceStore ||
      window.Ari
        ?.userPreferenceStore;

    const resolver =
      window.AriPreferenceResolver ||
      window.Ari
        ?.preferenceResolver;

    const storeReady =
      typeof store?.read ===
        "function";

    const resolverReady =
      typeof resolver?.resolve ===
        "function";

    const structurallyValid =
      typeof this.initialize ===
        "function" &&
      typeof this.refresh ===
        "function" &&
      typeof this.getPacket ===
        "function" &&
      typeof this.getInstructionText ===
        "function" &&
      typeof this.getOpenAIGuidance ===
        "function";

    return {
      valid:
        structurallyValid &&
        storeReady &&
        resolverReady,

      ready:
        structurallyValid &&
        storeReady &&
        resolverReady,

      source:
        this.source,

      version:
        this.version,

      storeReady,
      resolverReady,

      cacheLoaded:
        this._cache.loaded,

      runtimeReady:
        this.isReady()
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  objectOrEmpty(value) {
    return this.isPlainObject(value)
      ? value
      : {};
  },

  hasKeys(value) {
    return (
      this.isPlainObject(value) &&
      Object.keys(value).length > 0
    );
  },

  clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch {
      return value;
    }
  }
};

window.Ari.preferenceRuntime =
  window.AriPreferenceRuntime;

console.log(
  "ARI PREFERENCE RUNTIME LOADED:",
  window.AriPreferenceRuntime
    ?.version,
  window.AriPreferenceRuntime
    ?.validate?.()
);