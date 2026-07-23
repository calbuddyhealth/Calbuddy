// ari/profile/ari-preference-runtime.js
// Ari Preference Runtime
//
// Purpose:
// Load, cache, refresh, and expose the authenticated user's preference
// record for the current runtime session. This module coordinates the
// Preference Store and Preference Resolver but owns neither persistence
// nor preference resolution.
//
// V1.0.0 — Runtime Preference Cache

window.Ari = window.Ari || {};

window.AriPreferenceRuntime = {
  version: "1.0.0",
  source: "ari-preference-runtime",

  _cache: {
    loaded: false,
    loading: false,
    record: null,
    resolvedPacket: null,
    loadedAt: null
  },

  async initialize() {
    if (this._cache.loaded) return this.getPacket();
    return await this.refresh();
  },

  async refresh() {
    if (this._cache.loading) return this.getPacket();

    this._cache.loading = true;

    try {
      const store = this.requireStore();
      const resolver = this.requireResolver();

      const storeResult = await store.read();

      const packet = resolver.resolve({
        preferenceStoreRecord:
          storeResult?.record || {},
        preferenceStagePacket: {
          storeRecord:
            storeResult?.record || {}
        }
      });

      this._cache.record =
        storeResult?.record || {};

      this._cache.resolvedPacket =
        packet;

      this._cache.loaded = true;
      this._cache.loadedAt =
        Date.now();

      return packet;

    } catch (error) {

      const resolver =
        this.requireResolver();

      const fallback =
        resolver.resolve({});

      this._cache.record = {};
      this._cache.resolvedPacket =
        fallback;
      this._cache.loaded = true;

      return fallback;

    } finally {
      this._cache.loading = false;
    }
  },

  invalidate() {
    this._cache = {
      loaded: false,
      loading: false,
      record: null,
      resolvedPacket: null,
      loadedAt: null
    };
  },

  async afterPreferenceSave() {
    this.invalidate();
    return await this.refresh();
  },

  getPacket() {
    return this.clone(
      this._cache.resolvedPacket
    );
  },

  getResolvedPreferences() {
    return this.clone(
      this._cache.resolvedPacket
        ?.resolvedPreferences || {}
    );
  },

  getInstructionText() {
    return (
      this._cache.resolvedPacket
        ?.instructionText || ""
    );
  },

  getModelInstructions() {
    return this.clone(
      this._cache.resolvedPacket
        ?.modelInstructions || []
    );
  },

  isReady() {
    return this._cache.loaded;
  },

  requireStore() {
    const store =
      window.AriUserPreferenceStore ||
      window.Ari
        ?.userPreferenceStore;

    if (!store)
      throw new Error(
        "AriUserPreferenceStore not loaded."
      );

    return store;
  },

  requireResolver() {
    const resolver =
      window.AriPreferenceResolver ||
      window.Ari
        ?.preferenceResolver;

    if (!resolver)
      throw new Error(
        "AriPreferenceResolver not loaded."
      );

    return resolver;
  },

  clone(value) {
    if (value === undefined)
      return undefined;

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
  "ARI PREFERENCE RUNTIME LOADED",
  window.AriPreferenceRuntime.version
);
