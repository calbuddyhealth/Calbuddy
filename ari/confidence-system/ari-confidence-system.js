// ari/confidence-system/ari-confidence-system.js
// Ari Confidence System
// Purpose: Help Ari distinguish certainty, hypothesis, weak signal, and unknown.
// V1.1: Adds evidence-aware signal scoring without replacing confidence calibration.

window.Ari = window.Ari || {};

window.Ari.confidenceSystem = {
  version: "1.1.0",

  evaluateSignal({
    name = "unknown",
    confidence = "low",
    evidence = [],
    source = "unknown",
    description = ""
  } = {}) {
    const evidenceCount = Array.isArray(evidence) ? evidence.length : 0;
    const adjustedConfidence = this.adjustConfidenceByEvidence(
      confidence,
      evidenceCount
    );

    return {
      name,
      confidence: adjustedConfidence,
      originalConfidence: confidence,
      evidence,
      evidenceCount,
      description,
      source,
      certaintyLevel: this.toCertaintyLevel(adjustedConfidence),
      languagePrefix: this.toLanguagePrefix(adjustedConfidence),
      confidenceScore: this.toScore(adjustedConfidence, evidenceCount)
    };
  },

  adjustConfidenceByEvidence(confidence = "low", evidenceCount = 0) {
    if (confidence === "unknown") return "unknown";

    if (confidence === "low" && evidenceCount >= 3) {
      return "medium";
    }

    if (confidence === "medium" && evidenceCount >= 5) {
      return "high";
    }

    if (confidence === "high" && evidenceCount === 0) {
      return "medium";
    }

    return confidence;
  },

  toScore(confidence = "low", evidenceCount = 0) {
    const base = {
      high: 75,
      medium: 50,
      low: 25,
      unknown: 0
    };

    return Math.min(100, (base[confidence] || 0) + evidenceCount * 5);
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
      low: "This is only a possibility, but ",
      unknown: "I do not have enough to say this clearly, but "
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

    const sorted = [...signals].sort((a, b) => {
      const aScore =
        a.confidenceScore ??
        this.toScore(a.confidence, a.evidence?.length || 0);

      const bScore =
        b.confidenceScore ??
        this.toScore(b.confidence, b.evidence?.length || 0);

      return bScore - aScore;
    });

    return this.evaluateSignal(sorted[0]);
  },

  summarize(signal = {}) {
    return {
      name: signal.name || "unknown",
      confidence: signal.confidence || "unknown",
      certaintyLevel:
        signal.certaintyLevel ||
        this.toCertaintyLevel(signal.confidence || "unknown"),
      evidenceCount:
        signal.evidenceCount ||
        signal.evidence?.length ||
        0,
      languagePrefix:
        signal.languagePrefix ||
        this.toLanguagePrefix(signal.confidence || "unknown")
    };
  }
};