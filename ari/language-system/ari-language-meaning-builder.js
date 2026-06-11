// ari/language-system/ari-language-meaning-builder.js
// Ari Language Meaning Builder
// Purpose: Speak about life chapters, meaning, beliefs, and human truths.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageMeaningBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const simulation = analysis.simulation || {};
    const insight = analysis.insight || {};

    const lifeChapter = personModel.lifeChapter?.name;
    const humanTruth = meaning.humanTruth;
    const primaryBelief = beliefModel.primaryBelief?.name;
    const simulationTheme =
      simulation.primarySimulation?.theme ||
      simulation.simulationTheme;

    // Life chapter first

    if (lifeChapter && lifeChapter !== "unclear") {
      lines.push(
        this.humanizeLifeChapter(lifeChapter)
      );
    }

    // Human truth

    if (
      humanTruth &&
      humanTruth !==
        "Ari needs more context before naming this cleanly."
    ) {
      lines.push(humanTruth);
    }

    // Insight

    if (
      insight.oneLineInsight &&
      insight.oneLineInsight !== humanTruth
    ) {
      lines.push(insight.oneLineInsight);
    }

    // Belief

    if (primaryBelief) {
      lines.push(
        this.humanizeBelief(primaryBelief)
      );
    }

    // Simulation

    if (simulationTheme) {
      lines.push(
        this.humanizeSimulation(simulationTheme)
      );
    }

    return lines.filter(Boolean);
  },

  humanizeLifeChapter(name = "") {
    const map = {
      fatherhood_and_transition:
        "This chapter is about becoming a father while entering a new season of life.",

      entering_fatherhood:
        "This chapter appears to be about becoming someone your child can depend on.",

      career_and_identity_transition:
        "This chapter appears to be about letting one identity evolve while another begins to form.",

      family_transition:
        "This chapter may be pulling you from achievement-centered success toward relationship-centered success.",

      fatherhood_transition:
        "This chapter may be asking for steadiness more than perfection.",

      builder_development:
        "This chapter appears to be about building something meaningful without losing yourself in the process."
    };

    return (
      map[name] ||
      `This chapter appears to be about ${name.replaceAll("_", " ")}.`
    );
  },

  humanizeBelief(name = "") {
    const map = {
      achievement_creates_security:
        "Ari may be detecting a belief that achievement creates safety.",

      family_moments_are_irreplaceable:
        "Ari is detecting a strong belief that family moments cannot simply be recovered later.",

      purpose_must_not_be_abandoned:
        "Ari may be detecting a belief that purpose must be protected from being abandoned.",

      slowing_down_means_falling_behind:
        "Ari may be detecting a belief that slowing down means falling behind."
    };

    return (
      map[name] ||
      `Ari may be detecting a belief around ${name.replaceAll("_", " ")}.`
    );
  },

  humanizeSimulation(name = "") {
    const map = {
      presence_vs_acceleration:
        "The underlying tension may be presence versus acceleration.",

      achievement_vs_presence:
        "The underlying tension may be achievement versus presence.",

      capacity_protection:
        "The situation may be asking you to protect capacity before adding responsibility."
    };

    return (
      map[name] ||
      `The likely tension may be ${name.replaceAll("_", " ")}.`
    );
  }
};