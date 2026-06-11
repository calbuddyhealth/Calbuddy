// ari/confidence-system/ari-confidence-system.js
// Ari Confidence System
// Purpose: Help Ari distinguish certainty, hypothesis, weak signal, and unknown.
// V1.0

window.Ari = window.Ari || {};

window.Ari.confidenceSystem = {
  version: "1.0.0",

  evaluateSignal({
    name = "unknown",
    confidence = "low",
    evidence = [],
    source = "unknown"
  } = {}) {
    return {
      name,
      confidence,
      evidence,
      source,
      certaintyLevel: this.toCertaintyLevel(confidence),
      languagePrefix: this.toLanguagePrefix(confidence)
    };
  },

  toCertaintyLevel(confidence = "low") {
    const map = {
      high: "strong_signal",
      medium: "reasonable_hypothesis",
      low: "weak_signal",
      unknown: "unknown"
    };

    return map[confidence] || "weak_signal";
  },

  toLanguagePrefix(confidence = "low") {
    const map = {
      high: "",
      medium: "I could be wrong, but ",
      low: "This is only a weak signal, but ",
      unknown: "I do not have enough to say clearly, but "
    };

    return map[confidence] || "I could be wrong, but ";
  },

  chooseBest(signals = []) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return this.evaluateSignal({
        name: "unknown",
        confidence: "unknown",
        evidence: [],
        source: "ari-confidence-system"
      });
    }

    const score = {
      high: 3,
      medium: 2,
      low: 1,
      unknown: 0
    };

    const sorted = [...signals].sort((a, b) => {
      return (score[b.confidence] || 0) - (score[a.confidence] || 0);
    });

    return this.evaluateSignal(sorted[0]);
  }
};