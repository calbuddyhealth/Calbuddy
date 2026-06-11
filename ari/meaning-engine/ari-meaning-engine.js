// ari/meaning-engine/ari-meaning-engine.js
// Ari Meaning Engine
// Purpose: Combine values, identity, conflict, insight, emotion, and emotional intelligence into one meaning summary.
// V1.1: Adds confidence-based inference instead of defaulting too quickly to general understanding.

window.Ari = window.Ari || {};

window.Ari.meaningEngine = {
  version: "1.1.0",

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
    const protecting = emotionalIntelligence.protecting?.name || null;
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
      protecting,
      pattern,
      hiddenConflict,
      tradeoff
    });

    const meaning = this.createMeaningStatement({ theme });
    const humanTruth = this.createHumanTruth({
      theme,
      executive,
      insight,
      emotionalIntelligence
    });

    return {
      theme: theme.name,
      confidence: theme.confidence,
      reason: theme.reason,
      meaning,
      humanTruth,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      underlyingEmotion,
      rootNeed,
      protecting,
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
    rootNeed = "",
    protecting = "",
    pattern = "",
    hiddenConflict = "",
    tradeoff = ""
  } = {}) {
    const life = observation.lifeTransitions || {};
    const humanPatterns = observation.humanPatterns || {};

    if (questionType === "meaning") {
      if (
        dominantValue === "family" &&
        (rootNeed === "secure_family_presence" || protecting === "family")
      ) {
        return {
          name: "family_transition",
          confidence: "medium",
          reason:
            "Meaning question detected while family is the dominant value and family presence is being protected."
        };
      }

      if (life.fatherhood || dominantIdentity === "father") {
        return {
          name: "fatherhood_transition",
          confidence: "medium",
          reason:
            "Meaning question detected during a fatherhood or family-role transition."
        };
      }

      return {
        name: "life_season",
        confidence: "medium",
        reason:
          "User is asking about the meaning of a life season or chapter."
      };
    }

    if (
      pattern === "too_many_primary_roles" ||
      hiddenConflict === "identity_overload" ||
      humanPatterns.roleConflict
    ) {
      return {
        name: "identity_overload",
        confidence: "high",
        reason:
          "Multiple identities or roles are competing to become primary."
      };
    }

    if (
      hiddenConflict === "family_vs_purpose" ||
      underlyingEmotion === "fear_of_betraying_purpose"
    ) {
      return {
        name: "family_vs_purpose",
        confidence: "high",
        reason:
          "Family protection and purpose protection are both active."
      };
    }

    if (
      primaryConflict === "provider_vs_present_parent" ||
      hiddenConflict === "provider_vs_presence"
    ) {
      return {
        name: "presence_vs_provision",
        confidence: "high",
        reason:
          "The system detected tension between providing and being present."
      };
    }

    if (
      life.fatherhood &&
      underlyingEmotion === "fear_of_failing_family"
    ) {
      return {
        name: "fatherhood_responsibility",
        confidence: "high",
        reason:
          "Fatherhood is active and the underlying emotion is fear of failing family."
      };
    }

    if (
      tradeoff === "chosen_sacrifice" ||
      humanPatterns.opportunityCost
    ) {
      return {
        name: "necessary_sacrifice",
        confidence: "medium",
        reason:
          "A meaningful tradeoff or opportunity cost is present."
      };
    }

    if (
      dominantValue === "family" &&
      (rootNeed === "secure_family_presence" || protecting === "family")
    ) {
      return {
        name: "family_transition",
        confidence: "medium",
        reason:
          "Family is central even though the broader theme is not fully proven."
      };
    }

    if (
      dominantValue === "responsibility" &&
      dominantIdentity === "provider"
    ) {
      return {
        name: "responsibility_burden",
        confidence: "medium",
        reason:
          "Responsibility and provider identity are both active."
      };
    }

    if (questionType === "insight") {
      return {
        name: "search_for_meaning",
        confidence: "medium",
        reason:
          "User is asking for insight or interpretation."
      };
    }

    if (questionType === "emotional") {
      return {
        name: "emotional_processing",
        confidence: "medium",
        reason:
          "User is asking about emotional experience."
      };
    }

    return {
      name: "general_understanding",
      confidence: "low",
      reason:
        "Not enough strong signals to infer a more specific meaning theme."
    };
  },

  createMeaningStatement({ theme = {} } = {}) {
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

      family_transition:
        "This season is about shifting from achievement-centered success toward relationship-centered success.",

      fatherhood_transition:
        "This season is about becoming someone who can be present, steady, and depended on.",

      responsibility_burden:
        "This situation is about carrying responsibility without letting responsibility consume the person carrying it.",

      life_season:
        "This situation is less about solving a problem and more about understanding what this chapter of life is trying to develop in you.",

      search_for_meaning:
        "This situation is asking for meaning, not just advice.",

      emotional_processing:
        "This situation is about understanding the feeling underneath the question.",

      general_understanding:
        "This situation needs more context before Ari can name the meaning clearly."
    };

    return statements[theme.name] || statements.general_understanding;
  },

  createHumanTruth({
    theme = {},
    executive = {},
    insight = {},
    emotionalIntelligence = {}
  } = {}) {
    if (
      insight.oneLineInsight &&
      theme.confidence === "high"
    ) {
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

      family_transition:
        "The next chapter is not asking you to accomplish more. It is asking you to be more present.",

      fatherhood_transition:
        "Fatherhood is not asking you to become perfect. It is asking you to become steady.",

      responsibility_burden:
        "Responsibility is good, but it becomes dangerous when you never let yourself set it down.",

      life_season:
        "Life chapters often ask us to become someone new before they reveal why the change was necessary.",

      search_for_meaning:
        "The question is not only what to do. The question is what this moment is trying to reveal.",

      emotional_processing:
        "The feeling is not noise. It is information.",

      general_understanding:
        "Ari needs more context before naming this cleanly."
    };

    return truths[theme.name] || truths.general_understanding;
  }
};