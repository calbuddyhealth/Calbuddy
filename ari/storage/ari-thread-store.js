// ari/storage/ari-thread-store.js
// Ari Thread Store
// Purpose: Persist conversation thread state.
// V1.0.0

window.Ari = window.Ari || {};

window.AriThreadStore = {
  version: "1.0.0",

  async load(summary = {}) {
    // Placeholder implementation.
    // Later this will load from Supabase for logged-in users.

    const cached =
      window.Ari.threadState ||
      JSON.parse(sessionStorage.getItem("ari_thread_state") || "null") ||
      {};

    return {
      threadStoreRan: true,
      threadStoreVersion: this.version,
      threadState: cached
    };
  },

  async save(threadState = {}) {
    window.Ari.threadState = threadState;

    try {
      sessionStorage.setItem(
        "ari_thread_state",
        JSON.stringify(threadState)
      );
    } catch (e) {
      console.warn("Unable to cache thread state:", e);
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
    } catch (e) {}

    return { success: true };
  }
};

console.log(
  "ARI THREAD STORE LOADED:",
  window.AriThreadStore?.version
);