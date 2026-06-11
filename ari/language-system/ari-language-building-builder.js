// ari-language-building-builder.js
// Purpose: Speak about projects, architecture, creation, and systems.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageBuildingBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const insight = analysis.insight || {};
    const executive = analysis.executive || {};
    const meaning = analysis.meaning || {};

    if (meaning.humanTruth) {
      lines.push(meaning.humanTruth);
    }

    if (insight.oneLineInsight) {
      lines.push(insight.oneLineInsight);
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

    return lines.filter(Boolean);
  }
};