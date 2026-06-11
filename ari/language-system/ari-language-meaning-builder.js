// ari/language-system/ari-language-meaning-builder.js
// Ari Language Meaning Builder
// Purpose: Speak about life chapters, meaning, beliefs, and human truths.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageMeaningBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const simulation = analysis.simulation || {};
    const insight = analysis.insight || {};
    const humanizers = this.humanizers();

    const lifeChapter = personModel.lifeChapter?.name;
    const humanTruth = meaning.humanTruth;
    const primaryBelief = beliefModel.primaryBelief?.name;
    const simulationTheme =
      simulation.primarySimulation?.theme ||
      simulation.simulationTheme;

    if (lifeChapter && lifeChapter !== "unclear") {
      lines.push(humanizers.lifeChapter(lifeChapter));
    }

    if (
      humanTruth &&
      humanTruth !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(humanTruth);
    }

    if (
      insight.oneLineInsight &&
      insight.oneLineInsight !== humanTruth &&
      insight.oneLineInsight !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(insight.oneLineInsight);
    }

    if (primaryBelief && primaryBelief !== "unclear") {
      lines.push(humanizers.belief(primaryBelief));
    }

    if (simulationTheme && simulationTheme !== "unclear") {
      lines.push(humanizers.simulation
        ? humanizers.simulation(simulationTheme)
        : `The likely tension may be ${String(simulationTheme).replaceAll("_", " ")}.`
      );
    }

    return this.unique(lines);
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      lifeChapter: (name) =>
        `This chapter appears to be about ${String(name).replaceAll("_", " ")}.`,
      belief: (name) =>
        `Ari may be detecting this belief: ${String(name).replaceAll("_", " ")}.`,
      simulation: (name) =>
        `The likely tension may be ${String(name).replaceAll("_", " ")}.`
    };
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  }
};