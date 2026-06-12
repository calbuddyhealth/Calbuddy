// ari/language/ari-emotional-naming-engine.js
// Ari Emotional Naming Engine
// Purpose: Convert emotional + human-need analysis into human language.
// V2.0
// Upgrade:
// - Template-driven + mode-driven.
// - Returns metadata: tone, intensity, patternUsed.
// - Supports dignity, connection, safety, uncertainty, stewardship, grief, shame.
// - Respects Mouth Director permissions.

window.AriEmotionalNamingEngine = {
  name(summary = {}) {
    const result = this.generateDetailed(summary);

    if (!result?.emotionalName) return null;

    return result;
  },

  generate(summary = {}) {
    return this.generateDetailed(summary)?.emotionalName || null;
  },

  generateDetailed(summary = {}) {
    if (!this.allowsEmotion(summary)) return null;

    const context = this.readContext(summary);
    const pattern = this.choosePattern(context);

    if (!pattern) return null;

    const emotionalName = this.chooseLine(pattern, context);

    if (!emotionalName) return null;

    return {
      emotionalName,
      emotionTone: pattern.tone,
      intensity: pattern.intensity,
      patternUsed: pattern.name,
      avoid: pattern.avoid,
      source: "ari-emotional-naming-engine"
    };
  },

  allowsEmotion(summary = {}) {
    const director = summary.mouthDirector || {};

    return (
      summary.mouthAllows?.emotion !== false &&
      director.allowEmotion !== false &&
      summary.allowEmotion !== false
    );
  },

  readContext(summary = {}) {
    return {
      mode:
        summary.synthesisMode ||
        summary.salienceMode ||
        summary.needResponseMode ||
        null,

      responseIntent: summary.responseIntent || null,

      primaryHumanNeed: summary.primaryHumanNeed || null,
      primaryHumanNeedScore: Number(summary.primaryHumanNeedScore || 0),

      emotion:
        summary.emotionalClassification ||
        summary.primaryEmotion ||
        null,

      underlying:
        summary.underlyingEmotion ||
        summary.underlyingEmotionDepth ||
        null,

      chapter: summary.primaryLifeChapter || null,
      wisdomTension: summary.wisdomTension || null,
      confidence:
        summary.calibratedConfidence ||
        summary.metaConfidence ||
        "unknown"
    };
  },

  choosePattern(context = {}) {
    const {
      mode,
      responseIntent,
      primaryHumanNeed,
      primaryHumanNeedScore,
      emotion,
      underlying,
      chapter,
      wisdomTension,
      confidence
    } = context;

    if (
      mode === "restore_dignity" ||
      responseIntent === "protect_dignity" ||
      primaryHumanNeed === "worth"
    ) {
      return this.pattern(
        "restore_dignity_worth",
        "protective",
        primaryHumanNeedScore >= 85 ? "medium" : "low",
        ["do_not_overexplain", "do_not_make_user_prove_pain", "avoid_therapy_jargon"]
      );
    }

    if (
      mode === "emotional_connection" ||
      responseIntent === "offer_connection" ||
      primaryHumanNeed === "connection"
    ) {
      return this.pattern(
        "emotional_connection",
        "warm",
        "medium",
        ["avoid_fixing_too_fast", "avoid_lecturing"]
      );
    }

    if (
      mode === "safety_override" ||
      responseIntent === "protect_safety" ||
      primaryHumanNeed === "security" ||
      primaryHumanNeed === "body"
    ) {
      return this.pattern(
        "safety_body_security",
        "steady",
        "high",
        ["avoid_analysis_first", "avoid_abstract_meaning"]
      );
    }

    if (
      mode === "continue_observing" ||
      confidence === "unknown" ||
      confidence === "low"
    ) {
      return this.pattern(
        "uncertainty_observing",
        "careful",
        "low",
        ["avoid_certainty", "avoid_big_interpretation"]
      );
    }

    if (
      chapter === "fatherhood_transition" &&
      underlying === "fear_of_missing_irreplaceable_moments"
    ) {
      return this.pattern(
        "fatherhood_presence_fear",
        "tender",
        "medium",
        ["avoid_guilt", "avoid_pressure"]
      );
    }

    if (
      chapter === "fatherhood_transition" ||
      wisdomTension === "presence_vs_achievement"
    ) {
      return this.pattern(
        "presence_vs_achievement_emotion",
        "grounded",
        "medium",
        ["avoid_shaming_ambition"]
      );
    }

    if (emotion === "stewardship") {
      return this.pattern(
        "stewardship",
        "respectful",
        "medium",
        ["avoid_calling_it_fear_too_fast"]
      );
    }

    if (underlying === "fear_of_failing_family") {
      return this.pattern(
        "fear_of_failing_family",
        "protective",
        "medium",
        ["avoid_shame", "avoid_catastrophizing"]
      );
    }

    if (emotion === "grief") {
      return this.pattern(
        "grief",
        "tender",
        "medium",
        ["avoid_fixing_grief"]
      );
    }

    if (emotion === "shame") {
      return this.pattern(
        "shame_identity_separation",
        "gentle",
        "medium",
        ["avoid_confirming_identity_wound"]
      );
    }

    if (emotion === "concern") {
      return this.pattern(
        "concern",
        "steady",
        "low",
        ["avoid_alarm"]
      );
    }

    if (emotion === "wonder") {
      return this.pattern(
        "wonder",
        "curious",
        "low",
        ["avoid_overclaiming"]
      );
    }

    return null;
  },

  chooseLine(pattern = {}, context = {}) {
    const lines = {
      restore_dignity_worth: [
        "That hurts because respect is tied to dignity, not ego.",
        "That kind of thing can hit your dignity, even when your worth has not actually changed.",
        "Feeling disrespected can sting because it touches the part of you that wants to be seen as valuable."
      ],

      emotional_connection: [
        "That sounds lonely, like part of you is looking for connection instead of another explanation.",
        "The ache here may be less about answers and more about wanting to feel close to someone.",
        "That sounds like the kind of loneliness that wants presence, not a lecture."
      ],

      safety_body_security: [
        "Your system may be asking for safety and stability before anything else.",
        "Before this needs meaning, it may need steadiness.",
        "This sounds like a moment where safety has to come before interpretation."
      ],

      uncertainty_observing: [
        "Something is active here, but it may be too early to name it with confidence.",
        "There is something worth listening to here, but Ari should not overname it yet.",
        "This may need one cleaner detail before Ari puts a label on it."
      ],

      fatherhood_presence_fear: [
        "Part of you seems afraid that life is moving faster than your ability to be present for it.",
        "This sounds tender because it touches moments you know you will not get back.",
        "The fear may be about missing something irreplaceable, not about being weak."
      ],

      presence_vs_achievement_emotion: [
        "This sounds like the pressure of wanting to build something meaningful without losing what matters most.",
        "Part of you wants to provide, and part of you does not want presence to become the cost.",
        "This carries the weight of trying to be ambitious and present at the same time."
      ],

      stewardship: [
        "This feels less like fear and more like responsibility for something you deeply care about.",
        "That sounds like stewardship: the pressure of caring enough to want to handle it well.",
        "This may be the weight of responsibility, not just anxiety."
      ],

      fear_of_failing_family: [
        "This does not sound like fear of failure. It sounds like fear of letting down the people you love.",
        "The fear underneath this may be about failing someone who matters to you.",
        "This seems to touch the part of you that wants to protect your family from disappointment."
      ],

      grief: [
        "The pain may not only be about what was lost. It may also be about what will never be the same.",
        "That sounds like grief touching both the past and the future.",
        "Something in this may be asking to be mourned, not solved."
      ],

      shame_identity_separation: [
        "Part of you may be treating a mistake as evidence about who you are.",
        "That sounds like shame trying to turn one moment into an identity.",
        "This may be painful because it is attacking your sense of self, not just your behavior."
      ],

      concern: [
        "Something important feels at risk, and your attention keeps returning to it.",
        "Your concern seems to be circling something that matters.",
        "Something in you is tracking a possible cost."
      ],

      wonder: [
        "Part of you seems to sense there may be something deeper here that has not fully revealed itself yet.",
        "There is a curious part of you trying to understand what this moment means.",
        "Something about this seems to be inviting a deeper question."
      ]
    };

    const options = lines[pattern.name] || [];
    return options[0] || null;
  },

  pattern(name, tone, intensity, avoid = []) {
    return {
      name,
      tone,
      intensity,
      avoid
    };
  }
};