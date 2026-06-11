// ari/insight-system/ari-evidence-engine.js
// Ari Evidence Engine
// Purpose: Evaluate evidence supporting and weakening hypotheses.
// V1.0

window.Ari = window.Ari || {};

window.Ari.evidenceEngine = {
  version: "1.0.0",

  evaluate({
    hypothesis = null,
    counterHypothesis = null,
    insight = {},
    beliefModel = {},
    personModel = {},
    emotionalIntelligence = {},
    meaning = {}
  } = {}) {

    const supportingEvidence = [];
    const missingEvidence = [];
    const contradictingEvidence = [];

    //
    // No hypothesis
    //

    if (!hypothesis) {
      return {
        supportingEvidence: [],
        missingEvidence: [
          "No hypothesis available"
        ],
        contradictingEvidence: [],
        evidenceScore: 0,
        evidenceStrength: "none",
        source: "ari-evidence-engine"
      };
    }

    //
    // Hypothesis evidence
    //

    if (
      Array.isArray(hypothesis.evidence)
    ) {
      supportingEvidence.push(
        ...hypothesis.evidence
      );
    }

    //
    // Pattern evidence
    //

    if (
      insight.pattern?.name &&
      insight.pattern.name !== "unclear"
    ) {
      supportingEvidence.push(
        `pattern:${insight.pattern.name}`
      );
    } else {
      missingEvidence.push(
        "No pattern detected"
      );
    }

    //
    // Belief evidence
    //

    if (
      beliefModel.primaryBelief?.name
    ) {
      supportingEvidence.push(
        `belief:${beliefModel.primaryBelief.name}`
      );
    } else {
      missingEvidence.push(
        "No primary belief detected"
      );
    }

    //
    // Emotion evidence
    //

    if (
      emotionalIntelligence.underlyingEmotion?.name &&
      emotionalIntelligence.underlyingEmotion.name !== "unclear"
    ) {
      supportingEvidence.push(
        `emotion:${emotionalIntelligence.underlyingEmotion.name}`
      );
    } else {
      missingEvidence.push(
        "No underlying emotion detected"
      );
    }

    //
    // Life chapter evidence
    //

    if (
      personModel.lifeChapter?.name &&
      personModel.lifeChapter.name !== "unclear"
    ) {
      supportingEvidence.push(
        `life_chapter:${personModel.lifeChapter.name}`
      );
    } else {
      missingEvidence.push(
        "No life chapter detected"
      );
    }

    //
    // Meaning evidence
    //

    if (
      meaning.theme
    ) {
      supportingEvidence.push(
        `meaning:${meaning.theme}`
      );
    }

    //
    // Counter evidence
    //

    if (
      counterHypothesis
    ) {
      contradictingEvidence.push(
        counterHypothesis.name
      );
    }

    //
    // Score
    //

    const score =
      supportingEvidence.length -
      contradictingEvidence.length;

    let strength = "low";

    if (score >= 5) {
      strength = "high";
    } else if (score >= 3) {
      strength = "medium";
    }

    return {
      supportingEvidence,
      missingEvidence,
      contradictingEvidence,
      evidenceScore: score,
      evidenceStrength: strength,
      source: "ari-evidence-engine"
    };
  }
};