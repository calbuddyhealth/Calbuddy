// ari/confidence-system/ari-confidence-calibration.js
// Ari Confidence Calibration
// Purpose: Calibrate Ari's overall confidence after hypothesis, evidence, counter-hypothesis, and uncertainty.
// V1.1

window.Ari = window.Ari || {};

window.Ari.confidenceCalibration = {
  version: "1.1.0",

  calibrate({
    hypothesis = null,
    counterHypothesis = null,
    evidenceEvaluation = null,
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

    const supportingCount =
      evidenceEvaluation?.supportingEvidence?.length ||
      evidence.length ||
      hypothesis.evidence?.length ||
      0;

    const contradictingCount =
      evidenceEvaluation?.contradictingEvidence?.length ||
      (counterHypothesis ? 1 : 0);

    const missingCount =
      evidenceEvaluation?.missingEvidence?.length || 0;

    let score = this.baseScore(hypothesis.confidence);

    score += this.supportingEvidenceScore(supportingCount);
    score -= this.contradictingEvidencePenalty(contradictingCount);
    score -= this.missingEvidencePenalty(missingCount);
    score += this.questionTypeBoost(questionType);

    if (evidenceEvaluation?.evidenceStrength === "high") score += 10;
    if (evidenceEvaluation?.evidenceStrength === "medium") score += 5;
    if (evidenceEvaluation?.evidenceStrength === "none") score -= 10;

    score = Math.max(0, Math.min(100, score));

    const confidence = this.scoreToConfidence(score);

    return {
      confidence,
      confidenceScore: score,
      reason: this.createReason({
        hypothesis,
        counterHypothesis,
        evidenceEvaluation,
        questionType,
        supportingCount,
        contradictingCount,
        missingCount,
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

  supportingEvidenceScore(count = 0) {
    if (count >= 5) return 20;
    if (count >= 3) return 14;
    if (count >= 1) return 7;
    return 0;
  },

  contradictingEvidencePenalty(count = 0) {
    if (count >= 3) return 20;
    if (count >= 2) return 14;
    if (count >= 1) return 8;
    return 0;
  },

  missingEvidencePenalty(count = 0) {
    if (count >= 5) return 15;
    if (count >= 3) return 10;
    if (count >= 1) return 5;
    return 0;
  },

  questionTypeBoost(questionType = "understanding") {
    if (questionType === "insight") return 8;
    if (questionType === "meaning") return 6;
    if (questionType === "emotional") return 4;
    return 0;
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
    evidenceEvaluation = null,
    questionType = "",
    supportingCount = 0,
    contradictingCount = 0,
    missingCount = 0,
    score = 0,
    confidence = "low"
  } = {}) {
    const parts = [];

    parts.push(`Base hypothesis confidence is ${hypothesis.confidence || "unknown"}.`);
    parts.push(`${supportingCount} supporting evidence signal(s) were considered.`);
    parts.push(`${contradictingCount} contradicting evidence signal(s) were considered.`);
    parts.push(`${missingCount} missing evidence area(s) were considered.`);

    if (counterHypothesis) {
      parts.push(`Counter-hypothesis considered: ${counterHypothesis.name}.`);
    }

    if (evidenceEvaluation?.evidenceStrength) {
      parts.push(`Evidence strength is ${evidenceEvaluation.evidenceStrength}.`);
    }

    if (questionType === "insight" || questionType === "meaning") {
      parts.push(`${questionType} questions allow Ari to speak in hypotheses.`);
    }

    parts.push(`Final calibrated confidence is ${confidence} with score ${score}.`);

    return parts.join(" ");
  }
};