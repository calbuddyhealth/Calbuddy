// ari/language-system/ari-language-router.js
// Ari Language Router
// Purpose: Decide what type of language should lead.
// Equivalent to Broca's Area.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageRouter = {
  version: "1.0.0",

  route(analysis = {}) {
    const signals = analysis.signals || {};
    const questionType = analysis.questionType || "understanding";

    const lead = signals.recommendedLanguageLead;

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

      default:
        return questionType;
    }
  }
};