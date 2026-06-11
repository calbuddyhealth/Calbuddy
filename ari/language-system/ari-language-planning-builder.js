// ari-language-planning-builder.js
// Purpose: Turn decisions into actions.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languagePlanningBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const executive = analysis.executive || {};
    const consequence =
      analysis.longTermConsequence || {};

    if (executive.recommendedFocus) {
      lines.push(executive.recommendedFocus);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    const delays =
      executive.thingsToDelay || [];

    if (delays.length) {
      lines.push(
        `Delay: ${delays
          .map((d) => d.name || d)
          .join(", ")}`
      );
    }

    if (!lines.length) {
      lines.push(
        "Choose one next action instead of trying to solve everything at once."
      );
    }

    return lines;
  }
};