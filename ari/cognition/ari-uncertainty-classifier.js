// ari/cognition/ari-uncertainty-classifier.js
// Ari Rebirth - Uncertainty Classification Engine
// Purpose: Prevent Ari from treating guesses as facts.
// V1.0

window.AriUncertaintyClassifier = {
  classify(input = {}) {
    const userText = input.userText || "";
    const observerSignals = input.observerSignals || {};
    const memorySignals = input.memorySignals || {};
    const emotionSignals = input.emotionSignals || {};

    const text = userText.toLowerCase().trim();

    let uncertaintyScore = 0;
    const reasons = [];

    function add(points, reason) {
      uncertaintyScore += points;
      reasons.push(reason);
    }

    // 1. Low context
    if (text.length < 40) {
      add(15, "low_context");
    }

    // 2. Decision request
    if (
      text.includes("should i") ||
      text.includes("what should i do") ||
      text.includes("do you think i should") ||
      text.includes("is it a bad idea")
    ) {
      add(25, "decision_request");
    }

    // 3. Absolute language
    if (
      text.includes("always") ||
      text.includes("never") ||
      text.includes("everyone") ||
      text.includes("nobody") ||
      text.includes("nothing")
    ) {
      add(20, "absolute_language");
    }

    // 4. Emotional intensity
    if (
      text.includes("i can't") ||
      text.includes("i hate") ||
      text.includes("i'm done") ||
      text.includes("i give up") ||
      emotionSignals.intensity === "high"
    ) {
      add(20, "high_emotion");
    }

    // 5. Multiple meanings detected by Observer
    if (
      Array.isArray(observerSignals.possibleMeanings) &&
      observerSignals.possibleMeanings.length > 1
    ) {
      add(25, "multiple_possible_meanings");
    }

    // 6. Memory conflict
    if (memorySignals.conflict === true) {
      add(30, "memory_conflict");
    }

    // Cap score
    uncertaintyScore = Math.min(100, uncertaintyScore);

    let uncertaintyLevel = "low";

    if (uncertaintyScore >= 60) {
      uncertaintyLevel = "high";
    } else if (uncertaintyScore >= 30) {
      uncertaintyLevel = "medium";
    }

    return {
      system: "UCE",
      version: "1.0",
      uncertaintyScore,
      uncertaintyLevel,
      reasons,

      needsClarifyingQuestion: uncertaintyLevel === "high",
      shouldUseCautiousLanguage: uncertaintyLevel !== "low",
      allowStrongAdvice: uncertaintyLevel === "low",

      languageConfidence:
        uncertaintyLevel === "high"
          ? "soft"
          : uncertaintyLevel === "medium"
          ? "measured"
          : "direct"
    };
  }
};