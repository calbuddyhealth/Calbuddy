// ari/evidence-system/ari-evidence-engine.js
// Ari Evidence Engine
// Purpose: Evaluate what supports, weakens, or is missing from Ari's hypothesis.
// V1.0

window.Ari = window.Ari || {};

window.Ari.evidenceEngine = {
  version: "1.0.0",

  evaluate({
    hypothesis = null,
    counterHypothesis = null,
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    emotionalIntelligence = {},
    observation = {}
  } = {}) {
    const supportingEvidence = [];
    const contradictingEvidence = [];
    const missingEvidence = [];

    if (!hypothesis) {
      return {
        supportingEvidence,
        contradictingEvidence,
        missingEvidence: ["No hypothesis available."],
        evidenceScore: 0,
        evidenceStrength: "none",
        evidenceSummary: "Ari cannot evaluate evidence because no hypothesis was generated.",
        source: "ari-evidence-engine"
      };
    }

    this.collectHypothesisEvidence(hypothesis, supportingEvidence);
    this.collectInsightEvidence(insight, supportingEvidence, missingEvidence);
    this.collectMeaningEvidence(meaning, supportingEvidence, missingEvidence);
    this.collectPersonEvidence(personModel, supportingEvidence, missingEvidence);
    this.collectBeliefEvidence(beliefModel, supportingEvidence, missingEvidence);
    this.collectSimulationEvidence(simulation, supportingEvidence, missingEvidence);
    this.collectEmotionEvidence(emotionalIntelligence, supportingEvidence, missingEvidence);
    this.collectObservationEvidence(observation, hypothesis, supportingEvidence);

    if (counterHypothesis) {
      contradictingEvidence.push(
        `Counter-hypothesis exists: ${counterHypothesis.name}.`
      );
    }

    const evidenceScore = this.scoreEvidence({
      supportingEvidence,
      contradictingEvidence,
      missingEvidence
    });

    const evidenceStrength = this.toEvidenceStrength(evidenceScore);

    return {
      supportingEvidence: [...new Set(supportingEvidence)],
      contradictingEvidence: [...new Set(contradictingEvidence)],
      missingEvidence: [...new Set(missingEvidence)],
      evidenceScore,
      evidenceStrength,
      evidenceSummary: this.summarizeEvidence({
        supportingEvidence,
        contradictingEvidence,
        missingEvidence,
        evidenceStrength
      }),
      source: "ari-evidence-engine"
    };
  },

  collectHypothesisEvidence(hypothesis = {}, supportingEvidence = []) {
    if (Array.isArray(hypothesis.evidence)) {
      hypothesis.evidence.forEach((item) => {
        supportingEvidence.push(`Hypothesis evidence: ${item}.`);
      });
    }

    if (hypothesis.confidence) {
      supportingEvidence.push(
        `Hypothesis confidence is ${hypothesis.confidence}.`
      );
    }
  },

  collectInsightEvidence(insight = {}, supportingEvidence = [], missingEvidence = []) {
    if (insight.avoidance?.name && insight.avoidance.name !== "none_detected") {
      supportingEvidence.push(`Avoidance signal detected: ${insight.avoidance.name}.`);
    } else {
      missingEvidence.push("No strong avoidance signal detected.");
    }

    if (insight.pattern?.name && insight.pattern.name !== "unclear") {
      supportingEvidence.push(`Pattern detected: ${insight.pattern.name}.`);
    } else {
      missingEvidence.push("No clear pattern detected.");
    }

    if (insight.hiddenConflict?.name && insight.hiddenConflict.name !== "unclear") {
      supportingEvidence.push(`Hidden conflict detected: ${insight.hiddenConflict.name}.`);
    } else {
      missingEvidence.push("No hidden conflict detected.");
    }

    if (insight.tradeoff?.name && insight.tradeoff.name !== "none_detected") {
      supportingEvidence.push(`Tradeoff detected: ${insight.tradeoff.name}.`);
    } else {
      missingEvidence.push("No major tradeoff detected.");
    }

    if (insight.hiddenMotive?.name && insight.hiddenMotive.name !== "unclear") {
      supportingEvidence.push(`Hidden motive detected: ${insight.hiddenMotive.name}.`);
    } else {
      missingEvidence.push("No hidden motive detected.");
    }
  },

  collectMeaningEvidence(meaning = {}, supportingEvidence = [], missingEvidence = []) {
    if (meaning.theme) {
      supportingEvidence.push(`Meaning theme detected: ${meaning.theme}.`);
    } else {
      missingEvidence.push("No meaning theme detected.");
    }

    if (meaning.confidence) {
      supportingEvidence.push(`Meaning confidence is ${meaning.confidence}.`);
    }

    if (meaning.humanTruth) {
      supportingEvidence.push("Meaning engine produced a human truth.");
    }
  },

  collectPersonEvidence(personModel = {}, supportingEvidence = [], missingEvidence = []) {
    if (personModel.lifeChapter?.name && personModel.lifeChapter.name !== "unclear") {
      supportingEvidence.push(`Life chapter detected: ${personModel.lifeChapter.name}.`);
    } else {
      missingEvidence.push("No clear life chapter detected.");
    }

    if (personModel.snapshot?.primaryRole && personModel.snapshot.primaryRole !== "unknown") {
      supportingEvidence.push(`Primary role detected: ${personModel.snapshot.primaryRole}.`);
    } else {
      missingEvidence.push("No clear primary role detected.");
    }

    if (personModel.snapshot?.mainNeed) {
      supportingEvidence.push(`Main need detected: ${personModel.snapshot.mainNeed}.`);
    }
  },

  collectBeliefEvidence(beliefModel = {}, supportingEvidence = [], missingEvidence = []) {
    if (beliefModel.primaryBelief?.name) {
      supportingEvidence.push(`Primary belief detected: ${beliefModel.primaryBelief.name}.`);
    } else {
      missingEvidence.push("No primary belief detected.");
    }

    if (beliefModel.beliefSummary) {
      supportingEvidence.push("Belief engine produced a belief summary.");
    }
  },

  collectSimulationEvidence(simulation = {}, supportingEvidence = [], missingEvidence = []) {
    if (simulation.primarySimulation?.name) {
      supportingEvidence.push(`Primary simulation detected: ${simulation.primarySimulation.name}.`);
    } else {
      missingEvidence.push("No primary simulation detected.");
    }

    if (simulation.primarySimulation?.theme) {
      supportingEvidence.push(`Simulation theme detected: ${simulation.primarySimulation.theme}.`);
    }
  },

  collectEmotionEvidence(
    emotionalIntelligence = {},
    supportingEvidence = [],
    missingEvidence = []
  ) {
    if (
      emotionalIntelligence.underlyingEmotion?.name &&
      emotionalIntelligence.underlyingEmotion.name !== "unclear"
    ) {
      supportingEvidence.push(
        `Underlying emotion detected: ${emotionalIntelligence.underlyingEmotion.name}.`
      );
    } else {
      missingEvidence.push("No clear underlying emotion detected.");
    }

    if (emotionalIntelligence.rootNeed?.name) {
      supportingEvidence.push(`Root need detected: ${emotionalIntelligence.rootNeed.name}.`);
    } else {
      missingEvidence.push("No clear root need detected.");
    }
  },

  collectObservationEvidence(observation = {}, hypothesis = {}, supportingEvidence = []) {
    const text = observation.normalizedMessage || "";

    if (
      hypothesis.name === "unwanted_cost" &&
      (text.includes("truth") || text.includes("avoid") || text.includes("uncomfortable"))
    ) {
      supportingEvidence.push(
        "User language directly references truth, avoidance, or discomfort."
      );
    }

    if (
      hypothesis.name === "achievement_before_arrival" &&
      (text.includes("achievement") || text.includes("goal") || text.includes("success"))
    ) {
      supportingEvidence.push(
        "User language references achievement, goals, or success."
      );
    }

    if (
      hypothesis.name === "responsibility_before_rest" &&
      (text.includes("responsibility") || text.includes("family") || text.includes("provider"))
    ) {
      supportingEvidence.push(
        "User language references responsibility, family, or provider role."
      );
    }
  },

  scoreEvidence({
    supportingEvidence = [],
    contradictingEvidence = [],
    missingEvidence = []
  } = {}) {
    const supportScore = supportingEvidence.length * 4;
    const contradictionPenalty = contradictingEvidence.length * 5;
    const missingPenalty = missingEvidence.length * 2;

    return Math.max(0, supportScore - contradictionPenalty - missingPenalty);
  },

  toEvidenceStrength(score = 0) {
    if (score >= 30) return "high";
    if (score >= 15) return "medium";
    if (score >= 5) return "low";
    return "none";
  },

  summarizeEvidence({
    supportingEvidence = [],
    contradictingEvidence = [],
    missingEvidence = [],
    evidenceStrength = "none"
  } = {}) {
    return `Evidence strength is ${evidenceStrength}. Ari found ${supportingEvidence.length} supporting signal(s), ${contradictingEvidence.length} contradicting signal(s), and ${missingEvidence.length} missing evidence area(s).`;
  }
};