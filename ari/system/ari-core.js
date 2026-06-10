// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Connect Loader, Observer, Value, Identity, Conflict, Attention, Router, Emotion, and Memory.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "1.2.0",

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

    const values = window.Ari.valueEngine
      ? window.Ari.valueEngine.analyze(observation)
      : {
          values: [],
          rankedValues: [],
          dominantValue: null,
          valueConflicts: [],
          source: "value-engine-unavailable"
        };

    const identity = window.Ari.identityEngine
      ? window.Ari.identityEngine.analyze(observation, values)
      : {
          identities: [],
          identityHierarchy: {},
          identityConflicts: [],
          dominantIdentity: null,
          dominantTheme: "identity-unavailable",
          source: "identity-engine-unavailable"
        };

    const conflicts = window.Ari.conflictEngine
      ? window.Ari.conflictEngine.analyze({
          observation,
          values,
          identity
        })
      : {
          conflicts: [],
          primaryConflict: null,
          conflictIntensity: "none",
          competingFor: [],
          likelyCost: "Conflict engine unavailable.",
          needsExecutiveFunction: false,
          source: "conflict-engine-unavailable"
        };

    const attention = window.Ari.attentionSystem
      ? window.Ari.attentionSystem.prioritize({
          ...observation,
          values,
          identity,
          conflicts
        })
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
          values,
          identity,
          conflicts,
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

    supportSet.delete(route.primaryOrgan);

    if (attention.emotionalSupportNeeded && route.primaryOrgan !== "companion") {
      supportSet.add("companion");
    }

    if (attention.memoryAttentionNeeded && route.primaryOrgan !== "memory") {
      supportSet.add("memory");
    }

    if (conflicts.needsExecutiveFunction && route.primaryOrgan !== "planner") {
      supportSet.add("planner");
    }

    if (attention.focusType === "milestone" && route.primaryOrgan !== "storykeeper") {
      supportSet.add("storykeeper");
    }

    route.supportingOrgans = [...supportSet].filter(
      (organ) => organ !== route.primaryOrgan
    );

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
          values,
          identity,
          conflicts,
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
      values,
      identity,
      conflicts,
      attention,
      route,
      emotion,
      memory,
      analyzedAt: new Date().toISOString()
    };
  },

  createSystemSummary(analysis = {}) {
    const observation = analysis.observation || {};
    const values = analysis.values || {};
    const identity = analysis.identity || {};
    const conflicts = analysis.conflicts || {};
    const attention = analysis.attention || {};
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const memory = analysis.memory || {};

    return {
      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,

      dominantValue: values.dominantValue || null,
      dominantIdentity: identity.dominantIdentity?.name || null,
      dominantTheme: identity.dominantTheme || null,

      primaryConflict: conflicts.primaryConflict?.name || null,
      conflictIntensity: conflicts.conflictIntensity || "none",
      competingFor: conflicts.competingFor || [],
      needsExecutiveFunction: Boolean(conflicts.needsExecutiveFunction),

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
      valueSource: values.source || "unknown",
      identitySource: identity.source || "unknown",
      conflictSource: conflicts.source || "unknown",
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