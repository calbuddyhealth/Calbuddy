// ari-language-emotion-builder.js
// Purpose: Speak about emotions, fears, needs, and what is being protected.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageEmotionBuilder = {
  version: "1.0.0",

  build(analysis = {}) {
    const lines = [];

    const emotionalIntelligence =
      analysis.emotionalIntelligence || {};

    const underlyingEmotion =
      analysis.underlyingEmotion || {};

    const recovery =
      analysis.emotionRecoveryQuestions || {};

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
        this.humanizeUnderlyingEmotion(depth)
      );
    }

    if (
      surfaceEmotion &&
      surfaceEmotion !== "curiosity"
    ) {
      lines.push(
        this.humanizeSurfaceEmotion(surfaceEmotion)
      );
    }

    if (hiddenFear) {
      lines.push(hiddenFear);
    }

    if (vulnerableTruth) {
      lines.push(vulnerableTruth);
    }

    if (rootNeed) {
      lines.push(
        this.humanizeRootNeed(rootNeed)
      );
    }

    if (protecting) {
      lines.push(
        this.humanizeProtecting(protecting)
      );
    }

    if (recovery.primaryQuestion) {
      lines.push(recovery.primaryQuestion);
    }

    return lines.filter(Boolean);
  },

  humanizeUnderlyingEmotion(name = "") {
    const map = {

      fear_of_losing_identity:
        "Underneath this, Ari may be detecting fear of losing identity.",

      fear_of_missing_irreplaceable_moments:
        "Underneath this, Ari may be detecting fear of missing moments that cannot be recovered.",

      fear_of_failing_family:
        "Underneath this, Ari may be detecting fear of failing the people who matter most.",

      fear_of_betraying_purpose:
        "Underneath this, Ari may be detecting fear of betraying purpose.",

      fear_of_collapse_if_capacity_is_ignored:
        "Underneath this, Ari may be detecting fear that everything becomes harder if capacity is ignored."
    };

    return (
      map[name] ||
      `Underneath this, Ari may be detecting ${name.replaceAll("_"," ")}.`
    );
  },

  humanizeSurfaceEmotion(name = "") {
    const map = {

      concern:
        "There is concern here, but it seems connected to something important.",

      stewardship:
        "You seem to be trying to protect something valuable.",

      guilt:
        "There is guilt here, but guilt does not automatically mean wrongdoing.",

      overwhelm:
        "This looks more like overload than weakness.",

      determination:
        "There is determination here, but determination may be carrying more than it should."
    };

    return (
      map[name] ||
      `The surface emotion appears to be ${name.replaceAll("_"," ")}.`
    );
  },

  humanizeRootNeed(name = "") {
    const map = {

      secure_family_presence:
        "The need underneath may be secure family presence.",

      recovery_and_capacity:
        "The need underneath may be recovery and capacity.",

      understanding:
        "The need underneath may be understanding.",

      stability:
        "The need underneath may be stability."
    };

    return (
      map[name] ||
      `The need underneath may be ${name.replaceAll("_"," ")}.`
    );
  },

  humanizeProtecting(name = "") {
    const map = {

      future_family:
        "What you may be protecting is your future family.",

      family:
        "What you may be protecting is family.",

      creative_purpose:
        "What you may be protecting is creative purpose.",

      future_self:
        "What you may be protecting is your future self.",

      meaning:
        "What you may be protecting is meaning."
    };

    return (
      map[name] ||
      `What you may be protecting is ${name.replaceAll("_"," ")}.`
    );
  }
};