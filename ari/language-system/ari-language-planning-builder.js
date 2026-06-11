// ari/language-system/ari-language-planning-builder.js
// Ari Language Planning Builder
// Purpose: Turn decisions into actions.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languagePlanningBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const executive = analysis.executive || {};
    const consequence = analysis.longTermConsequence || {};
    const regret = analysis.regret || {};

    if (executive.recommendedFocus) {
      lines.push(executive.recommendedFocus);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    if (
      regret.preventableAction &&
      regret.preventableAction !== consequence.courseCorrection
    ) {
      lines.push(regret.preventableAction);
    }

    const delays = executive.thingsToDelay || [];

    if (delays.length) {
      lines.push(
        `Delay: ${delays
          .map((item) => item.name || item)
          .join(", ")}.`
      );
    }

    if (!lines.length) {
      lines.push(
        "Choose one next action instead of trying to solve everything at once."
      );
    }

    return this.unique(lines);
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  }
};