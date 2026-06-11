// ari/language-system/ari-language-emotion-builder.js
// Ari Language Emotion Builder
// Purpose: Speak about emotions, fears, needs, and what is being protected.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languageEmotionBuilder = {
  version: "1.1.0",

  build(analysis = {}) {
    const lines = [];

    const emotionalIntelligence =
      analysis.emotionalIntelligence || {};

    const underlyingEmotion =
      analysis.underlyingEmotion || {};

    const recovery =
      analysis.emotionRecoveryQuestions || {};

    const humanizers = this.humanizers();

    const surfaceEmotion =
      emotionalIntelligence.surfaceEmotion?.name;

    const rootNeed =
      emotionalIntelligence.rootNeed?.name;

    const protecting =
      emotionalIntelligence.protecting?.name;

    const depth =
      underlyingEmotion.primaryUnderlyingEmotion?.name;

    const hiddenFear =
      underlyingEmotion.hiddenFear;

    const vulnerableTruth =
      underlyingEmotion.vulnerableTruth;

    if (depth && depth !== "unclear") {
      lines.push(
        humanizers.underlyingEmotion(depth)
      );
    }

    if (
      surfaceEmotion &&
      surfaceEmotion !== "curiosity" &&
      surfaceEmotion !== "unclear"
    ) {
      lines.push(
        humanizers.surfaceEmotion
          ? humanizers.surfaceEmotion(surfaceEmotion)
          : `The surface emotion appears to be ${String(surfaceEmotion).replaceAll("_", " ")}.`
      );
    }

    if (hiddenFear) {
      lines.push(hiddenFear);
    }

    if (vulnerableTruth) {
      lines.push(vulnerableTruth);
    }

    if (rootNeed && rootNeed !== "unclear") {
      lines.push(
        humanizers.rootNeed(rootNeed)
      );
    }

    if (protecting && protecting !== "unclear") {
      lines.push(
        humanizers.protecting(protecting)
      );
    }

    if (recovery.primaryQuestion) {
      lines.push(recovery.primaryQuestion);
    }

    return this.unique(lines);
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      underlyingEmotion: (name) =>
        `Underneath this, Ari may be detecting ${String(name).replaceAll("_", " ")}.`,
      surfaceEmotion: (name) =>
        `The surface emotion appears to be ${String(name).replaceAll("_", " ")}.`,
      rootNeed: (name) =>
        `The need underneath may be ${String(name).replaceAll("_", " ")}.`,
      protecting: (name) =>
        `What you may be protecting is ${String(name).replaceAll("_", " ")}.`
    };
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  }
};