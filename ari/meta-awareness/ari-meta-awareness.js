// ari/meta-awareness/ari-meta-awareness.js
// Ari Meta Awareness
// Purpose: Help Ari observe her own reasoning, confidence, alternatives, and unknowns.
// V1.0

window.Ari = window.Ari || {};

window.Ari.metaAwareness = {
  version: "1.0.0",

  reflect({
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    emotionalIntelligence = {},
    questionType = "understanding"
  } = {}) {
    const primaryConclusion = this.getPrimaryConclusion({
      insight,
      meaning,
      beliefModel,
      simulation
    });

    const confidence = this.estimateConfidence({
      insight,
      meaning,
      beliefModel,
      simulation
    });

    const alternativeExplanation = this.getAlternativeExplanation({
      insight,
      simulation
    });

    const uncertaintyAreas = this.getUncertaintyAreas({
      insight,
      personModel,
      beliefModel,
      simulation,
      emotionalIntelligence
    });

    const knownUnknowns = this.getKnownUnknowns({
      questionType,
      personModel,
      beliefModel,
      emotionalIntelligence
    });

    return {
      primaryConclusion,
      confidenceLevel: confidence.level,
      confidenceScore: confidence.score,
      confidenceReason: confidence.reason,
      alternativeExplanation,
      uncertaintyAreas,
      knownUnknowns,
      recommendation: this.getRecommendation(confidence.level, uncertaintyAreas),
      source: "ari-meta-awareness"
    };
  },

  getPrimaryConclusion({ insight = {}, meaning = {}, beliefModel = {}, simulation = {} } = {}) {
    if (insight.oneLineInsight) return insight.oneLineInsight;
    if (meaning.humanTruth) return meaning.humanTruth;
    if (beliefModel.primaryBelief?.description) {
      return beliefModel.primaryBelief.description;
    }
    if (simulation.primarySimulation?.theme) {
      return `The main tradeoff appears to be ${simulation.primarySimulation.theme.replaceAll("_", " ")}.`;
    }

    return "Ari does not have a clear primary conclusion yet.";
  },

  estimateConfidence({ insight = {}, meaning = {}, beliefModel = {}, simulation = {} } = {}) {
    let score = 0;
    const reasons = [];

    if (insight.calibratedConfidence === "high") {
      score += 35;
      reasons.push("Insight calibration is high.");
    } else if (insight.calibratedConfidence === "medium") {
      score += 25;
      reasons.push("Insight calibration is medium.");
    } else if (insight.calibratedConfidence === "low") {
      score += 12;
      reasons.push("Insight calibration is low.");
    }

    if (insight.pattern?.name && insight.pattern.name !== "unclear") {
      score += 15;
      reasons.push("A specific pattern was detected.");
    }

    if (insight.tradeoff?.name && insight.tradeoff.name !== "none_detected") {
      score += 15;
      reasons.push("A specific tradeoff was detected.");
    }

    if (meaning.confidence === "high") {
      score += 15;
      reasons.push("Meaning confidence is high.");
    } else if (meaning.confidence === "medium") {
      score += 10;
      reasons.push("Meaning confidence is medium.");
    }

    if (beliefModel.primaryBelief) {
      score += 10;
      reasons.push("A primary belief was detected.");
    }

    if (simulation.primarySimulation) {
      score += 10;
      reasons.push("A primary simulation was detected.");
    }

    const level =
      score >= 70
        ? "high"
        : score >= 40
        ? "medium"
        : score >= 15
        ? "low"
        : "unknown";

    return {
      score,
      level,
      reason: reasons.length
        ? reasons.join(" ")
        : "Ari has limited evidence for this conclusion."
    };
  },

  getAlternativeExplanation({ insight = {}, simulation = {} } = {}) {
    if (insight.counterHypothesis?.explanation) {
      return insight.counterHypothesis.explanation;
    }

    if (simulation.primarySimulation?.pathA && simulation.primarySimulation?.pathB) {
      return "Another explanation is that the user is not avoiding anything; they may be weighing two real paths with real costs.";
    }

    if (insight.hypothesis?.explanation) {
      return "Another explanation is that Ari may be overfitting to a familiar pattern and needs more context.";
    }

    return "No strong alternative explanation has been generated yet.";
  },

  getUncertaintyAreas({
    insight = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    emotionalIntelligence = {}
  } = {}) {
    const areas = [];

    if (!insight.pattern || insight.pattern.name === "unclear") {
      areas.push("pattern_unclear");
    }

    if (!insight.hiddenConflict || insight.hiddenConflict.name === "unclear") {
      areas.push("hidden_conflict_unclear");
    }

    if (!beliefModel.primaryBelief) {
      areas.push("primary_belief_unclear");
    }

    if (!simulation.primarySimulation) {
      areas.push("future_consequence_unclear");
    }

    if (!personModel.lifeChapter || personModel.lifeChapter.name === "unclear") {
      areas.push("life_chapter_unclear");
    }

    if (
      !emotionalIntelligence.underlyingEmotion ||
      emotionalIntelligence.underlyingEmotion?.name === "unclear"
    ) {
      areas.push("underlying_emotion_unclear");
    }

    return areas;
  },

  getKnownUnknowns({
    questionType = "understanding",
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {}
  } = {}) {
    const unknowns = [];

    if (questionType === "insight") {
      unknowns.push("whether the user is asking for discovery, confirmation, or challenge");
    }

    if (!personModel.snapshot?.primaryRole || personModel.snapshot.primaryRole === "unknown") {
      unknowns.push("which identity is most active right now");
    }

    if (!beliefModel.primaryBelief) {
      unknowns.push("which belief is driving the situation");
    }

    if (!emotionalIntelligence.rootNeed?.name) {
      unknowns.push("what need is underneath the question");
    }

    return unknowns;
  },

  getRecommendation(confidenceLevel = "unknown", uncertaintyAreas = []) {
    if (confidenceLevel === "high") {
      return "speak_clearly";
    }

    if (confidenceLevel === "medium") {
      return "speak_as_hypothesis";
    }

    if (confidenceLevel === "low" && uncertaintyAreas.length <= 2) {
      return "offer_possibility";
    }

    return "continue_observing";
  }
};