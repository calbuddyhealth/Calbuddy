// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Connect Loader, Authority, Router, Emotion Engine, and Memory Engine.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "1.0.0",

  async init() {
    if (window.Ari.loader && !window.Ari.loader.isLoaded()) {
      try {
        await window.Ari.loader.loadArchitecture();
      } catch (error) {
        console.warn("Ari architecture load skipped:", error.message);
      }
    }

    window.dispatchEvent(
      new CustomEvent("ari:coreReady", {
        detail: {
          version: this.version,
          loadedAt: new Date().toISOString()
        }
      })
    );

    console.log("Ari core ready.", this.version);
  },

  analyzeMessage(message = "", context = {}) {
    const route = window.Ari.router
      ? window.Ari.router.route(message, context)
      : {
          primaryOrgan: "companion",
          supportingOrgans: [],
          guardianRequired: false,
          confidence: "low",
          reason: "Router unavailable."
        };

    const emotion = window.Ari.emotionEngine
      ? window.Ari.emotionEngine.selectEmotion(message, route)
      : {
          primaryEmotion: "curiosity",
          secondaryEmotions: [],
          balance: { brain: 70, heart: 20, soul: 10 }
        };

    const memory = window.Ari.memoryEngine
      ? window.Ari.memoryEngine.classify(message, context)
      : {
          shouldRemember: false,
          memoryType: "temporary",
          importance: "temporary"
        };

    return {
      message,
      context,
      route,
      emotion,
      memory,
      analyzedAt: new Date().toISOString()
    };
  },

  createSystemSummary(analysis = {}) {
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const memory = analysis.memory || {};

    return {
      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],
      guardianRequired: Boolean(route.guardianRequired),
      primaryEmotion: emotion.primaryEmotion || "curiosity",
      secondaryEmotions: emotion.secondaryEmotions || [],
      balance: emotion.balance || { brain: 70, heart: 20, soul: 10 },
      memoryCandidate: memory.shouldRemember ? memory : null,
      authorityHierarchy: window.Ari.authority
        ? window.Ari.authority.hierarchy
        : []
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.core.init();
});