// ari/storage/ari-thread-store.js
// Ari Thread Store
// Purpose: Persist conversation thread state.
// V1.0.1 — Returns raw thread state directly

window.Ari = window.Ari || {};

window.AriThreadStore = {
  version: "1.0.1",

  async load(summary = {}) {
    try {
      const cached =
        window.Ari.threadState ||
        JSON.parse(sessionStorage.getItem("ari_thread_state") || "null") ||
        {};

      return cached;
    } catch (error) {
      console.warn("Unable to load thread state:", error);
      return {};
    }
  },

  async save(threadState = {}) {
    const cleanThreadState = {
      ...threadState,
      lastUpdatedAt: threadState.lastUpdatedAt || new Date().toISOString()
    };

    window.Ari.threadState = cleanThreadState;

    try {
      sessionStorage.setItem(
        "ari_thread_state",
        JSON.stringify(cleanThreadState)
      );
    } catch (error) {
      console.warn("Unable to cache thread state:", error);
    }

    return {
      success: true,
      version: this.version
    };
  },

  async clear() {
    window.Ari.threadState = {};

    try {
      sessionStorage.removeItem("ari_thread_state");
    } catch (error) {
      console.warn("Unable to clear thread state:", error);
    }

    return {
      success: true,
      version: this.version
    };
  }
};

console.log(
  "ARI THREAD STORE LOADED:",
  window.AriThreadStore?.version
);