// ari/storage/ari-thread-store.js
// Ari Thread Store
// Purpose: Persist short-term conversation thread state only.
// V1.1.0 — Session Thread State / Memory-Separated

window.Ari = window.Ari || {};

window.AriThreadStore = {
  version: "1.1.0",
  storageKey: "ari_thread_state",

  async load(summary = {}) {
    try {
      const cached =
        window.Ari.threadState ||
        this.loadSessionThreadState() ||
        {};

      return {
        ...cached,
        threadStoreRan: true,
        threadStoreVersion: this.version,
        threadStoreSource: "session_thread_state"
      };
    } catch (error) {
      console.warn("Unable to load thread state:", error);
      return {
        threadStoreRan: false,
        threadStoreVersion: this.version,
        threadStoreSource: "load_failed",
        threadStateLoadError: error?.message || String(error)
      };
    }
  },

  async save(threadState = {}) {
    const cleanThreadState = this.cleanThreadState(threadState);

    window.Ari.threadState = cleanThreadState;

    try {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify(cleanThreadState)
      );
    } catch (error) {
      console.warn("Unable to cache thread state:", error);
    }

    return {
      success: true,
      version: this.version,
      source: "session_thread_state"
    };
  },

  async clear() {
    window.Ari.threadState = {};

    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn("Unable to clear thread state:", error);
    }

    return {
      success: true,
      version: this.version
    };
  },

  loadSessionThreadState() {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("Unable to parse thread state:", error);
      return {};
    }
  },

  cleanThreadState(threadState = {}) {
    return {
      currentTopic: threadState.currentTopic || null,
      lastMessages: Array.isArray(threadState.lastMessages)
        ? threadState.lastMessages.slice(-8)
        : [],

      continuitySummary: threadState.continuitySummary || null,
      activeSubject: threadState.activeSubject || null,
      activeIssue: threadState.activeIssue || null,
      activeGoal: threadState.activeGoal || null,

      conversationMeaningHistory: Array.isArray(threadState.conversationMeaningHistory)
        ? threadState.conversationMeaningHistory.slice(-12)
        : [],

      latestConversationMeaning:
        threadState.latestConversationMeaning || null,

      activeSemanticTimeline: Array.isArray(threadState.activeSemanticTimeline)
        ? threadState.activeSemanticTimeline.slice(-12)
        : [],

      activeSemanticFrame:
        threadState.activeSemanticFrame || null,

      conversationMeaningFocus:
        threadState.conversationMeaningFocus || null,

      conversationMeaningOpenLoops: Array.isArray(threadState.conversationMeaningOpenLoops)
        ? threadState.conversationMeaningOpenLoops
        : [],

      activeConstraints: Array.isArray(threadState.activeConstraints)
        ? threadState.activeConstraints
        : [],

      unresolvedItems: Array.isArray(threadState.unresolvedItems)
        ? threadState.unresolvedItems
        : [],

      previousAnswerSummary:
        threadState.previousAnswerSummary || null,

      lastFinalResponse:
        threadState.lastFinalResponse || null,

      lastMealEstimate:
        threadState.lastMealEstimate || null,

      lastUpdatedAt: new Date().toISOString()
    };
  }
};

console.log(
  "ARI THREAD STORE LOADED:",
  window.AriThreadStore?.version
);