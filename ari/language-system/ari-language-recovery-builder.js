// ari/language-system/ari-language-recovery-builder.js
// Ari Language Recovery Builder
// Purpose: Speak intelligently when Ari lacks certainty.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageRecoveryBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const personModel = analysis.personModel || {};
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};

    // Observation

    if (
      personModel.lifeChapter?.name &&
      personModel.lifeChapter.name !== "unclear"
    ) {
      lines.push(
        `Something stands out about this chapter: ${personModel.lifeChapter.name.replaceAll("_", " ")}.`
      );
    }

    // Best understanding

    if (
      meaning.humanTruth &&
      meaning.humanTruth !==
        "Ari needs more context before naming this cleanly."
    ) {
      lines.push(meaning.humanTruth);
    }
    else if (
      insight.oneLineInsight &&
      insight.oneLineInsight !==
        "Ari needs more context before naming this cleanly."
    ) {
      lines.push(
        `I could be wrong, but ${this.lowercaseFirst(
          insight.oneLineInsight
        )}`
      );
    }
    else {
      lines.push(
        "I do not think Ari has enough evidence to be confident yet, but something important is present."
      );
    }

    // Recovery question

    const question =
      wisdomRecovery.primaryQuestion ||
      emotionRecovery.primaryQuestion;

    if (question) {
      lines.push(question);
    }

    return lines;
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
};