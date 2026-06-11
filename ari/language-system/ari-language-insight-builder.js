// ari/language-system/ari-language-insight-builder.js
// Ari Language Insight Builder
// Purpose: Speak about patterns, hidden conflicts, hypotheses, and tradeoffs.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageInsightBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const insight = analysis.insight || {};
    const humanizers = this.humanizers();

    const pattern = insight.pattern?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const tradeoff = insight.tradeoff?.name;
    const hypothesis = insight.hypothesis;
    const counterHypothesis = insight.counterHypothesis;
    const oneLineInsight = insight.oneLineInsight;

    if (pattern && pattern !== "unclear") {
      lines.push(humanizers.pattern(pattern));
    }

    if (
      hiddenConflict &&
      hiddenConflict !== "unclear" &&
      hiddenConflict !== "none_detected"
    ) {
      lines.push(humanizers.conflict(hiddenConflict));
    }

    if (
      tradeoff &&
      tradeoff !== "unclear" &&
      tradeoff !== "none_detected"
    ) {
      lines.push(humanizers.tradeoff(tradeoff));
    }

    if (
      oneLineInsight &&
      oneLineInsight !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(oneLineInsight);
    }

    if (
      hypothesis?.explanation &&
      hypothesis.explanation !== oneLineInsight
    ) {
      lines.push(
        `I could be wrong, but ${this.lowercaseFirst(
          hypothesis.explanation
        )}`
      );
    }

    if (counterHypothesis?.explanation) {
      lines.push(
        `Another possibility is that ${this.lowercaseFirst(
          counterHypothesis.explanation
        )}`
      );
    }

    return this.unique(lines);
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      pattern: (name) =>
        `Ari may be noticing a pattern around ${String(name).replaceAll("_", " ")}.`,
      conflict: (name) =>
        `The deeper conflict may be ${String(name).replaceAll("_", " ")}.`,
      tradeoff: (name) =>
        `The tradeoff may be ${String(name).replaceAll("_", " ")}.`
    };
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
};