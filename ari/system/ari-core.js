// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Connect Loader, Observer Network, Attention System, Authority, Router, Emotion Engine, and Memory Engine.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "1.1.0",

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
    const observation = window.Ari.observerNetwork
      ? window.Ari.observerNetwork.observe(message, context)
      : {
          intent: "unknown",
          emotion: {},
          memory: {},
          goals: {},
          risk: {},
          source: "observer-unavailable"
        };

    const attention = window.Ari.attentionSystem
      ? window.Ari.attentionSystem.prioritize(observation)
      : {
          focusType: "unknown",
          shouldRouteTo: null,
          emotionalSupportNeeded: false,
          memoryAttentionNeeded: false,
          guardianAttentionNeeded: false,
          source: "attention-unavailable"
        };

    const route = window.Ari.router
      ? window.Ari.router.route(message, {
          ...context,
          observation,
          attention
        })
      : {
          primaryOrgan: attention.shouldRouteTo || "companion",
          supportingOrgans: [],
          guardianRequired: Boolean(attention.guardianAttentionNeeded),
          confidence: "low",
          reason: "Router unavailable."
        };

    if (
      attention.shouldRouteTo &&
      route.primaryOrgan !== attention.shouldRouteTo
    ) {
      route.originalPrimaryOrgan = route.primaryOrgan;
      route.primaryOrgan = attention.shouldRouteTo;
      route.reason = `Attention override: ${attention.focusReason}`;
      route.confidence = "medium";
    }

    const supportSet = new Set(route.supportingOrgans || []);

    if (attention.emotionalSupportNeeded && route.primaryOrgan !== "companion") {
      supportSet.add("companion");
    }

    if (attention.memoryAttentionNeeded && route.primaryOrgan !== "memory") {
      supportSet.add("memory");
    }

    if (attention.focusType === "milestone" && route.primaryOrgan !== "storykeeper") {
      supportSet.add("storykeeper");
    }

    route.supportingOrgans = [...supportSet];

    const emotion = window.Ari.emotionEngine
      ? window.Ari.emotionEngine.selectEmotion(message, route)
      : {
          primaryEmotion: "curiosity",
          secondaryEmotions: [],
          balance: { brain: 70, heart: 20, soul: 10 }
        };

    const memory = window.Ari.memoryEngine
      ? window.Ari.memoryEngine.classify(message, {
          ...context,
          observation,
          attention,
          route,
          emotion
        })
      : {
          shouldRemember: false,
          memoryType: "temporary",
          importance: "temporary"
        };

    return {
      message,
      context,
      observation,
      attention,
      route,
      emotion,
      memory,
      analyzedAt: new Date().toISOString()
    };
  },

  createSystemSummary(analysis = {}) {
    const observation = analysis.observation || {};
    const attention = analysis.attention || {};
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const memory = analysis.memory || {};

    return {
      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,
      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],
      guardianRequired: Boolean(
        route.guardianRequired || attention.guardianAttentionNeeded
      ),
      primaryEmotion: emotion.primaryEmotion || "curiosity",
      secondaryEmotions: emotion.secondaryEmotions || [],
      balance: emotion.balance || { brain: 70, heart: 20, soul: 10 },
      memoryCandidate: memory.shouldRemember ? memory : null,
      observationSource: observation.source || "unknown",
      attentionSource: attention.source || "unknown",
      authorityHierarchy: window.Ari.authority
        ? window.Ari.authority.hierarchy
        : []
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.core.init();
});