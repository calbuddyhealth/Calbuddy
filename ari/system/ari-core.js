// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Coordinate Ari's spine layers.
// V5.0: Refactored into core spine architecture.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "5.0.0",

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
    let state = window.Ari.corePerception
      ? window.Ari.corePerception.run(message, context)
      : {
          message,
          context,
          questionType: "understanding",
          source: "core-perception-unavailable"
        };

    state = window.Ari.coreCognition
      ? window.Ari.coreCognition.run(state)
      : state;

    state = window.Ari.coreReflection
      ? window.Ari.coreReflection.run(state)
      : state;

    state = window.Ari.coreExpression
      ? window.Ari.coreExpression.run(state)
      : state;

    state = window.Ari.coreContinuity
      ? window.Ari.coreContinuity.run(state)
      : state;

    return {
      ...state,
      analyzedAt: new Date().toISOString()
    };
  },

  createSystemSummary(analysis = {}) {
    if (window.Ari.coreSummary) {
      return window.Ari.coreSummary.create(analysis);
    }

    return {
      questionType: analysis.questionType || "unknown",
      oneLineInsight: analysis.insight?.oneLineInsight || null,
      source: "core-summary-unavailable"
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.core.init();
});