// ari/language-system/ari-language-recovery-builder.js
// Ari Language Recovery Builder
// Purpose: Speak intelligently when Ari lacks certainty.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageRecoveryBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const personModel = analysis.personModel || {};
    const wisdomRecovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const humanizers = this.humanizers();

    const lifeChapter = personModel.lifeChapter?.name;
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const protecting = emotionalIntelligence.protecting?.name;

    if (lifeChapter && lifeChapter !== "unclear") {
      lines.push(humanizers.lifeChapter(lifeChapter));
    }

    if (
      meaning.humanTruth &&
      meaning.humanTruth !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(meaning.humanTruth);
    } else if (
      insight.oneLineInsight &&
      insight.oneLineInsight !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(
        `I could be wrong, but ${this.lowercaseFirst(
          insight.oneLineInsight
        )}`
      );
    } else {
      lines.push(
        "I do not have enough evidence to be confident yet, but something important is present."
      );
    }

    if (rootNeed && rootNeed !== "unclear") {
      lines.push(humanizers.rootNeed(rootNeed));
    }

    if (protecting && protecting !== "unclear") {
      lines.push(humanizers.protecting(protecting));
    }

    const question =
      wisdomRecovery.primaryQuestion ||
      emotionRecovery.primaryQuestion ||
      "What part of this feels most important but least understood?";

    if (question) {
      lines.push(question);
    }

    return this.unique(lines);
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      lifeChapter: (name) =>
        `This chapter appears to be about ${String(name).replaceAll("_", " ")}.`,
      rootNeed: (name) =>
        `The need underneath may be ${String(name).replaceAll("_", " ")}.`,
      protecting: (name) =>
        `What you are protecting may be ${String(name).replaceAll("_", " ")}.`
    };
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  },

  lowercaseFirst(text = "") {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
};