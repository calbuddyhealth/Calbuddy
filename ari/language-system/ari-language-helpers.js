// ari/language-system/ari-language-helpers.js
// Ari Language Helpers
// Purpose: Shared language utilities for cleanup, confidence, dedupe, and formatting.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageHelpers = {
  version: "1.0.0",

  finalize(response = "") {
    return [...new Set(
      String(response || "")
        .replace(/\n{3,}/g, "\n\n")
        .split("\n\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )].join("\n\n");
  },

  cleanConcept(text = "") {
    return String(text || "").replaceAll("_", " ");
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  },

  highestConfidence(signals = []) {
    const rank = {
      high: 3,
      medium: 2,
      low: 1,
      unknown: 0
    };

    const best = signals
      .filter(Boolean)
      .sort((a, b) => (rank[b.confidence] || 0) - (rank[a.confidence] || 0))[0];

    return best?.confidence || "low";
  },

  getPrefixForConfidence(confidence = "low") {
    if (confidence === "high") return "";
    if (confidence === "medium") return "I could be wrong, but ";
    if (confidence === "low") return "This is only a possibility, but ";
    return "I do not have enough to say this clearly, but ";
  },

  hasWisdom(analysis = {}) {
    return Boolean(
      analysis.wisdom?.wisdomPrinciple ||
        analysis.wisdom?.wisdomStatement ||
        analysis.wisdomResolution?.resolvedStatement
    );
  },

  hasEmotionDepth(analysis = {}) {
    const depth = analysis.underlyingEmotion || {};

    return Boolean(
      depth.primaryUnderlyingEmotion?.name &&
        depth.primaryUnderlyingEmotion.name !== "unclear"
    );
  },

  shouldLeadWithWisdom(analysis = {}) {
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const insight = analysis.insight || {};
    const questionType = analysis.questionType || "";

    if (!this.hasWisdom(analysis)) return false;

    if (
      questionType === "decision" ||
      questionType === "planning" ||
      questionType === "meaning"
    ) {
      return true;
    }

    if (
      wisdom.confidence === "high" ||
      resolution.confidence === "high" ||
      insight.calibratedConfidence === "high"
    ) {
      return true;
    }

    return false;
  }
};