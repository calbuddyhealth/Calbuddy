// ari/language-system/ari-language-decision-builder.js
// Ari Language Decision Builder
// Purpose: Speak when Ari is helping choose.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageDecisionBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const executive = analysis.executive || {};
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (
      resolution.leadingGood &&
      resolution.supportingGood
    ) {
      lines.push(
        `For this season, ${this.clean(
          resolution.leadingGood
        )} should lead and ${this.clean(
          resolution.supportingGood
        )} should support.`
      );
    }

    if (
      resolution.boundary &&
      resolution.boundary !==
        "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      lines.push(resolution.boundary);
    }

    if (resolution.integration) {
      lines.push(resolution.integration);
    }

    if (regret.regretStatement) {
      lines.push(regret.regretStatement);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    if (executive.recommendedFocus) {
      lines.push(executive.recommendedFocus);
    }

    const delayItems =
      executive.thingsToDelay || [];

    if (delayItems.length > 0) {
      lines.push(
        `Delay: ${delayItems
          .map((item) => item.name || item)
          .join(", ")}.`
      );
    }

    return this.unique(lines);
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  },

  clean(text = "") {
    return String(text || "").replaceAll("_", " ");
  }
};