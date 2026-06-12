// ari/language/ari-emotional-naming-engine.js
// Ari Emotional Naming Engine
// Purpose: Convert emotional + human-need analysis into human language.
// V1.2
// Fixes:
// - Adds Human Needs Network support.
// - Handles restore_dignity / worth language.
// - Handles emotional_connection / connection language.
// - Respects Mouth Director permissions.
// - Keeps name() and generate() compatibility.

window.AriEmotionalNamingEngine = {
  name(summary = {}) {
    const emotionalName = this.generate(summary);

    if (!emotionalName) return null;

    return {
      emotionalName,
      source: "ari-emotional-naming-engine"
    };
  },

  generate(summary = {}) {
    const director = summary.mouthDirector || {};

    const allowEmotion =
      summary.mouthAllows?.emotion !== false &&
      director.allowEmotion !== false &&
      summary.allowEmotion !== false;

    if (!allowEmotion) return null;

    const mode =
      summary.synthesisMode ||
      summary.salienceMode ||
      summary.needResponseMode ||
      null;

    const primaryHumanNeed = summary.primaryHumanNeed || null;

    const emotion =
      summary.emotionalClassification ||
      summary.primaryEmotion ||
      null;

    const underlying =
      summary.underlyingEmotion ||
      summary.underlyingEmotionDepth ||
      null;

    // -------------------------
    // HUMAN NEED: WORTH / DIGNITY
    // -------------------------
    if (
      mode === "restore_dignity" ||
      primaryHumanNeed === "worth"
    ) {
      return "That kind of thing can hit your sense of worth, even when your worth has not actually changed.";
    }

    // -------------------------
    // HUMAN NEED: CONNECTION
    // -------------------------
    if (
      mode === "emotional_connection" ||
      primaryHumanNeed === "connection"
    ) {
      return "That sounds lonely, like part of you is looking for connection instead of another explanation.";
    }

    // -------------------------
    // HUMAN NEED: SECURITY / BODY
    // -------------------------
    if (
      primaryHumanNeed === "security" ||
      primaryHumanNeed === "body"
    ) {
      return "Your system may be asking for safety and stability before anything else.";
    }

    // -------------------------
    // EXISTING EMOTION MAP
    // -------------------------
    if (emotion === "stewardship") {
      return "This feels less like fear and more like responsibility for something you deeply care about.";
    }

    if (underlying === "fear_of_missing_irreplaceable_moments") {
      return "Part of you seems afraid that life is moving faster than your ability to be present for it.";
    }

    if (underlying === "fear_of_failing_family") {
      return "This does not sound like fear of failure. It sounds like fear of letting down the people you love.";
    }

    if (emotion === "concern") {
      return "Something important feels at risk, and your attention keeps returning to it.";
    }

    if (emotion === "wonder") {
      return "Part of you seems to sense there may be something deeper here that has not fully revealed itself yet.";
    }

    if (emotion === "grief") {
      return "The pain may not only be about what was lost. It may also be about what will never be the same.";
    }

    if (emotion === "shame") {
      return "Part of you may be treating a mistake as evidence about who you are.";
    }

    return null;
  }
};