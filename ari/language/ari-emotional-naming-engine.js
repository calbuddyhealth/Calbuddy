// ari/language/ari-emotional-naming-engine.js
// Ari Emotional Naming Engine
// Purpose: Convert emotional analysis into human language.
// V1.0

window.AriEmotionalNamingEngine = {

  generate(summary = {}) {

    const emotion =
      summary.emotionalClassification ||
      summary.primaryEmotion ||
      null;

    const underlying =
      summary.underlyingEmotion ||
      null;

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