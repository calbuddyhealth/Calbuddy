// ari/language-system/ari-language-router.js
// Ari Language Router
// Purpose: Decide which language builder should lead.
// Equivalent to Broca's Area.
// V2.0

window.Ari = window.Ari || {};

window.Ari.languageRouter = {
  version: "2.0.0",

  route(analysis = {}) {
    const signals = analysis.signals || {};
    const questionType = analysis.questionType || "understanding";

    const lead =
      signals.recommendedLanguageLead ||
      questionType;

    switch (lead) {
      case "life_chapter":
        return "meaning";

      case "emotion_depth":
        return "emotion";

      case "wisdom":
        return "decision";

      case "conflict":
        return "insight";

      case "meaning":
        return "meaning";

      case "recovery":
        return "recovery";

      case "planning":
        return "planning";

      case "building":
        return "building";

      case "decision":
        return "decision";

      case "emotional":
        return "emotion";

      case "insight":
        return "insight";

      default:
        return questionType;
    }
  },

  getBuilder(type = "") {
    switch (type) {
      case "insight":
        return window.Ari.languageInsightBuilder;

      case "meaning":
        return window.Ari.languageMeaningBuilder;

      case "emotion":
        return window.Ari.languageEmotionBuilder;

      case "decision":
        return window.Ari.languageDecisionBuilder;

      case "planning":
        return window.Ari.languagePlanningBuilder;

      case "building":
        return window.Ari.languageBuildingBuilder;

      case "recovery":
        return window.Ari.languageRecoveryBuilder;

      default:
        return null;
    }
  }
};