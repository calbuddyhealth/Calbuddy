// ari/language-system/ari-language-reflection-questions.js
// Ari Reflection Question Engine
// Purpose: Select the best question when Ari needs deeper signal.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageReflectionQuestions = {
  version: "1.0.0",

  generate(analysis = {}) {
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};

    const insight = analysis.insight || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
    const meaning = analysis.meaning || {};

    const tradeoff = insight.tradeoff?.name;
    const pattern = insight.pattern?.name;

    if (
      wisdomRecovery.shouldRecover &&
      wisdomRecovery.primaryQuestion
    ) {
      return wisdomRecovery.primaryQuestion;
    }

    if (emotionRecovery.primaryQuestion) {
      return emotionRecovery.primaryQuestion;
    }

    if (wisdomResolution.leadingGood === "capacity") {
      return (
        "What would need to come off your plate " +
        "for capacity to actually lead?"
      );
    }

    if (
      wisdomResolution.leadingGood === "family" ||
      wisdomResolution.leadingGood === "presence"
    ) {
      return (
        "What would change if presence " +
        "did not have to be earned first?"
      );
    }

    if (
      wisdom.highestGood ===
      "protect_purpose_without_worshiping_speed"
    ) {
      return (
        "What would it look like to protect purpose " +
        "without forcing it to move at full speed?"
      );
    }

    if (
      pattern === "achievement_before_presence" ||
      tradeoff === "presence_vs_acceleration"
    ) {
      return (
        "What would change if presence " +
        "did not have to be earned first?"
      );
    }

    if (meaning.theme === "family_transition") {
      return (
        "What would it look like to measure this season " +
        "by presence instead of progress?"
      );
    }

    if (tradeoff === "growth_vs_stability") {
      return (
        "What would growth look like if stability " +
        "had to be protected too?"
      );
    }

    if (
      insight.hypothesis?.name ===
      "achievement_before_arrival"
    ) {
      return (
        "What would it feel like to stop moving " +
        "the finish line for peace?"
      );
    }

    return "What part of this feels most true?";
  }
};