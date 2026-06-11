// ari/confidence-system/ari-confidence-calibration.js
// Ari Confidence Calibration
// Purpose: Adjust confidence based on evidence strength, competing explanations, and question type.
// V1.0

window.Ari = window.Ari || {};

window.Ari.confidenceCalibration = {
  version: "1.0.0",

  calibrate({
    hypothesis = null,
    counterHypothesis = null,
    evidence = [],
    questionType = "understanding",
    analysis = {}
  } = {}) {
    if (!hypothesis) {
      return {
        confidence: "unknown",
        confidenceScore: 0,
        reason: "No hypothesis available to calibrate.",
        shouldSpeak: false,
        source: "ari-confidence-calibration"
      };
    }

    let score = this.baseScore(hypothesis.confidence);
    score += this.evidenceScore(evidence.length || hypothesis.evidence?.length || 0);
    score += this.questionTypeBoost(questionType);
    score -= this.counterPenalty(counterHypothesis);

    const confidence = this.scoreToConfidence(score);

    return {
      confidence,
      confidenceScore: score,
      reason: this.createReason({
        hypothesis,
        counterHypothesis,
        evidence,
        questionType,
        score,
        confidence
      }),
      shouldSpeak: confidence !== "unknown",
      source: "ari-confidence-calibration"
    };
  },

  baseScore(confidence = "low") {
    const map = {
      high: 70,
      medium: 50,
      low: 30,
      unknown: 10
    };

    return map[confidence] || 20;
  },

  evidenceScore(count = 0) {
    if (count >= 4) return 20;
    if (count >= 2) return 12;
    if (count >= 1) return 6;
    return 0;
  },

  questionTypeBoost(questionType = "understanding") {
    if (questionType === "insight") return 10;
    if (questionType === "meaning") return 8;
    if (questionType === "emotional") return 5;
    return 0;
  },

  counterPenalty(counterHypothesis = null) {
    if (!counterHypothesis) return 0;

    const map = {
      high: 20,
      medium: 12,
      low: 6,
      unknown: 0
    };

    return map[counterHypothesis.confidence] || 4;
  },

  scoreToConfidence(score = 0) {
    if (score >= 75) return "high";
    if (score >= 45) return "medium";
    if (score >= 20) return "low";
    return "unknown";
  },

  createReason({
    hypothesis = {},
    counterHypothesis = null,
    evidence = [],
    questionType = "",
    score = 0,
    confidence = "low"
  } = {}) {
    const parts = [];

    parts.push(`Base hypothesis confidence is ${hypothesis.confidence || "unknown"}.`);

    const evidenceCount = evidence.length || hypothesis.evidence?.length || 0;
    parts.push(`${evidenceCount} evidence signal(s) were considered.`);

    if (questionType === "insight" || questionType === "meaning") {
      parts.push(`${questionType} questions allow reasonable hypotheses.`);
    }

    if (counterHypothesis) {
      parts.push("A counter-hypothesis reduced confidence slightly.");
    }

    parts.push(`Final calibrated confidence is ${confidence} with score ${score}.`);

    return parts.join(" ");
  }
};