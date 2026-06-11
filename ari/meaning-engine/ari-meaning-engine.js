// ari/meaning-engine/ari-meaning-engine.js
// Ari Meaning Engine
// Purpose: Combine values, identity, conflict, insight, emotion, and emotional intelligence into one meaning summary.
// V1.0

window.Ari = window.Ari || {};

window.Ari.meaningEngine = {
  version: "1.0.0",

  synthesize({
    observation = {},
    questionType = "understanding",
    values = {},
    identity = {},
    conflicts = {},
    executive = {},
    insight = {},
    emotion = {},
    emotionalIntelligence = {}
  } = {}) {
    const dominantValue = values.dominantValue || null;
    const dominantIdentity = identity.dominantIdentity?.name || null;
    const primaryConflict = conflicts.primaryConflict?.name || null;
    const primaryEmotion = emotion.primaryEmotion || null;
    const underlyingEmotion = emotionalIntelligence.underlyingEmotion?.name || null;
    const rootNeed = emotionalIntelligence.rootNeed?.name || null;
    const pattern = insight.pattern?.name || null;
    const hiddenConflict = insight.hiddenConflict?.name || null;
    const tradeoff = insight.tradeoff?.name || null;

    const theme = this.detectTheme({
      observation,
      questionType,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      underlyingEmotion,
      rootNeed,
      pattern,
      hiddenConflict,
      tradeoff
    });

    const meaning = this.createMeaningStatement({
      theme,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      underlyingEmotion,
      rootNeed,
      pattern,
      hiddenConflict,
      tradeoff,
      insight
    });

    const humanTruth = this.createHumanTruth({
      theme,
      meaning,
      executive,
      insight,
      emotionalIntelligence
    });

    return {
      theme,
      meaning,
      humanTruth,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      underlyingEmotion,
      rootNeed,
      pattern,
      hiddenConflict,
      tradeoff,
      source: "ari-meaning-engine"
    };
  },

  detectTheme({
    observation = {},
    questionType = "",
    dominantValue = "",
    dominantIdentity = "",
    primaryConflict = "",
    underlyingEmotion = "",
    pattern = "",
    hiddenConflict = "",
    tradeoff = ""
  } = {}) {
    const life = observation.lifeTransitions || {};
    const humanPatterns = observation.humanPatterns || {};

    if (
      pattern === "too_many_primary_roles" ||
      hiddenConflict === "identity_overload" ||
      humanPatterns.roleConflict
    ) {
      return "identity_overload";
    }

    if (
      hiddenConflict === "family_vs_purpose" ||
      underlyingEmotion === "fear_of_betraying_purpose"
    ) {
      return "family_vs_purpose";
    }

    if (
      primaryConflict === "provider_vs_present_parent" ||
      hiddenConflict === "provider_vs_presence"
    ) {
      return "presence_vs_provision";
    }

    if (
      life.fatherhood &&
      underlyingEmotion === "fear_of_failing_family"
    ) {
      return "fatherhood_responsibility";
    }

    if (
      tradeoff === "chosen_sacrifice" ||
      humanPatterns.opportunityCost
    ) {
      return "necessary_sacrifice";
    }

    if (questionType === "insight") {
      return "search_for_meaning";
    }

    if (questionType === "emotional") {
      return "emotional_processing";
    }

    return "general_understanding";
  },

  createMeaningStatement({
    theme = "",
    dominantValue = "",
    dominantIdentity = "",
    primaryConflict = "",
    underlyingEmotion = "",
    rootNeed = "",
    pattern = "",
    hiddenConflict = "",
    tradeoff = "",
    insight = {}
  } = {}) {
    const statements = {
      identity_overload:
        "This situation is about too many meaningful identities competing to lead at the same time.",

      family_vs_purpose:
        "This situation is about protecting family without feeling like purpose is being abandoned.",

      presence_vs_provision:
        "This situation is about the difference between providing more and being present more.",

      fatherhood_responsibility:
        "This situation is about the weight of becoming someone another person can depend on.",

      necessary_sacrifice:
        "This situation is about accepting that protecting one meaningful thing requires slowing another.",

      search_for_meaning:
        "This situation is asking for meaning, not just advice.",

      emotional_processing:
        "This situation is about understanding the feeling underneath the question.",

      general_understanding:
        "This situation needs more context before Ari can name the meaning clearly."
    };

    return statements[theme] || statements.general_understanding;
  },

  createHumanTruth({
    theme = "",
    meaning = "",
    executive = {},
    insight = {},
    emotionalIntelligence = {}
  } = {}) {
    if (insight.oneLineInsight) {
      return insight.oneLineInsight;
    }

    const truths = {
      identity_overload:
        "The problem is not that everything matters. The problem is that everything is trying to matter first.",

      family_vs_purpose:
        "Protecting family does not kill purpose. It forces purpose to become disciplined.",

      presence_vs_provision:
        "More provision is not always the same as more presence.",

      fatherhood_responsibility:
        "The heaviness is not proof you are unready. It is proof you understand the weight of the role.",

      necessary_sacrifice:
        "Every serious yes requires a serious no.",

      search_for_meaning:
        "The question is not only what to do. The question is what this moment is trying to reveal.",

      emotional_processing:
        "The feeling is not noise. It is information."
    };

    return truths[theme] || meaning;
  }
};