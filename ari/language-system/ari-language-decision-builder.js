// ari-language-decision-builder.js
// Purpose: Speak when Ari is helping choose.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageDecisionBuilder = {
  version: "1.0.0",

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

    if (resolution.boundary) {
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

    return lines.filter(Boolean);
  },

  clean(text = "") {
    return text.replaceAll("_", " ");
  }
};