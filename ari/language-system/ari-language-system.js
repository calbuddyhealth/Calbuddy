// ari/language-system/ari-language-system.js
// Ari Language System
// Purpose: Coordinate language generation.
// V7.0 Language Spine

window.Ari = window.Ari || {};

window.Ari.languageSystem = {
  version: "7.0.0",

  generate(analysis = {}, options = {}) {
    try {
      const languagePlan =
        window.Ari.languagePrioritizer
          ? window.Ari.languagePrioritizer.prioritize(
              analysis,
              options
            )
          : null;

      if (window.Ari.languageBuilder) {
        return window.Ari.languageBuilder.build(
          analysis,
          languagePlan,
          options
        );
      }

      return "Ari language builder unavailable.";
    } catch (error) {
      console.error(
        "[ARI LANGUAGE SYSTEM]",
        error
      );

      return (
        "Something interrupted Ari's language system."
      );
    }
  }
};