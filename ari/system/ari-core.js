// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Coordinate Ari's spine layers.
// V5.1: Adds Ari Rebirth summary pipeline support.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "5.1.0",

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
    let summary = window.Ari.coreSummary
      ? window.Ari.coreSummary.create(analysis)
      : {
          questionType: analysis.questionType || "unknown",
          oneLineInsight: analysis.insight?.oneLineInsight || null,
          source: "core-summary-unavailable"
        };

    // Safety fallback:
    // If coreSummary has not run Rebirth yet, run it here.
    if (
      window.AriRebirthPipeline &&
      typeof window.AriRebirthPipeline.run === "function" &&
      !summary.rebirthPipelineRan
    ) {
      summary = window.AriRebirthPipeline.run(summary);
    }

    return summary;
  },

  getResponse(analysis = {}, options = {}) {
    const summary = this.createSystemSummary(analysis);

    if (summary.finalResponse) {
      return summary.finalResponse;
    }

    if (summary.synthesisRecommendedQuestion) {
      return summary.synthesisRecommendedQuestion;
    }

    if (summary.salienceQuestion) {
      return summary.salienceQuestion;
    }

    if (
      window.Ari.languageSystem &&
      typeof window.Ari.languageSystem.generate === "function"
    ) {
      return window.Ari.languageSystem.generate(analysis, options);
    }

    return "Ari needs more context before responding.";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.core.init();
});