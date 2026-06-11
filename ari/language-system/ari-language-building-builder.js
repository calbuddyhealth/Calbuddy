// ari/language-system/ari-language-building-builder.js
// Ari Language Building Builder
// Purpose: Speak about projects, architecture, creation, and systems.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageBuildingBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const insight = analysis.insight || {};
    const executive = analysis.executive || {};
    const meaning = analysis.meaning || {};
    const consequence = analysis.longTermConsequence || {};

    if (
      meaning.humanTruth &&
      meaning.humanTruth !==
        "Ari needs more context before naming this cleanly."
    ) {
      lines.push(meaning.humanTruth);
    }

    if (
      insight.oneLineInsight &&
      insight.oneLineInsight !== meaning.humanTruth
    ) {
      lines.push(insight.oneLineInsight);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    if (executive.recommendedFocus) {
      lines.push(executive.recommendedFocus);
    }

    lines.push(
      "The bottleneck is usually smaller than it first appears."
    );

    lines.push(
      "Focus on the next clean improvement rather than redesigning the entire system."
    );

    const delays =
      executive.thingsToDelay || [];

    if (delays.length > 0) {
      lines.push(
        `Delay: ${delays
          .map((item) => item.name || item)
          .join(", ")}.`
      );
    }

    return this.unique(lines);
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  }
};