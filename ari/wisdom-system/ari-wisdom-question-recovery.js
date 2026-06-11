// ari/wisdom-system/ari-wisdom-question-recovery.js
// Ari Wisdom Question Recovery
// Purpose: When Ari lacks enough evidence or wisdom signal, generate the next wise question.
// V1.0

window.Ari = window.Ari || {};

window.Ari.wisdomQuestionRecovery = {
  version: "1.0.0",

  recover({
    insight = {},
    metaAwareness = {},
    wisdom = {},
    wisdomResolution = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {},
    executive = {}
  } = {}) {
    const needsRecovery = this.needsRecovery({
      insight,
      metaAwareness,
      wisdomResolution
    });

    if (!needsRecovery) {
      return {
        shouldRecover: false,
        recoveryReason: null,
        primaryQuestion: null,
        supportingQuestions: [],
        source: "ari-wisdom-question-recovery"
      };
    }

    const missing = metaAwareness.uncertaintyAreas || [];
    const knownUnknowns = metaAwareness.knownUnknowns || [];

    const primaryQuestion = this.choosePrimaryQuestion({
      missing,
      knownUnknowns,
      meaning,
      personModel,
      beliefModel,
      emotionalIntelligence,
      executive
    });

    return {
      shouldRecover: true,
      recoveryReason: this.createRecoveryReason({
        insight,
        metaAwareness,
        wisdomResolution
      }),
      primaryQuestion,
      supportingQuestions: this.chooseSupportingQuestions({
        missing,
        knownUnknowns,
        meaning,
        personModel,
        beliefModel,
        emotionalIntelligence,
        executive
      }),
      source: "ari-wisdom-question-recovery"
    };
  },

  needsRecovery({ insight = {}, metaAwareness = {}, wisdomResolution = {} } = {}) {
    if (!insight.hypothesis && metaAwareness.evidenceStrength === "none") {
      return true;
    }

    if (metaAwareness.confidenceLevel === "unknown") {
      return true;
    }

    if (metaAwareness.recommendation === "continue_observing") {
      return true;
    }

    if (
      wisdomResolution.resolvedStatement ===
      "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      return true;
    }

    return false;
  },

  createRecoveryReason({ insight = {}, metaAwareness = {}, wisdomResolution = {} } = {}) {
    if (!insight.hypothesis) {
      return "Ari does not have enough evidence to form a grounded hypothesis yet.";
    }

    if (metaAwareness.confidenceLevel === "unknown") {
      return "Ari's confidence is too low to speak strongly.";
    }

    if (metaAwareness.recommendation === "continue_observing") {
      return "Ari should continue observing before giving a firm interpretation.";
    }

    if (
      wisdomResolution.resolvedStatement ===
      "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      return "Ari sees a wisdom question, but not enough tension clarity to resolve it.";
    }

    return "Ari needs more context before naming this cleanly.";
  },

  choosePrimaryQuestion({
    missing = [],
    knownUnknowns = [],
    meaning = {},
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {},
    executive = {}
  } = {}) {
    if (missing.includes("underlying_emotion_unclear")) {
      return "What feeling is hardest to admit underneath this?";
    }

    if (missing.includes("primary_belief_unclear")) {
      return "What belief are you acting from, even if you have not said it out loud?";
    }

    if (missing.includes("life_chapter_unclear")) {
      return "What chapter of life does this feel connected to?";
    }

    if (missing.includes("hidden_conflict_unclear")) {
      return "What two good things feel like they are competing right now?";
    }

    if (knownUnknowns.includes("which identity is most active right now")) {
      return "Which part of you is speaking the loudest right now?";
    }

    if (executive.executiveDecision === "protect_irreplaceable_moments") {
      return "What are you afraid you will not be able to get back later?";
    }

    if (meaning.theme === "search_for_meaning") {
      return "What part of this feels meaningful, even if it is uncomfortable?";
    }

    return "What part of this feels most important but least understood?";
  },

  chooseSupportingQuestions({
    missing = [],
    knownUnknowns = [],
    meaning = {},
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {},
    executive = {}
  } = {}) {
    const questions = [];

    if (missing.includes("underlying_emotion_unclear")) {
      questions.push("Is this more fear, guilt, grief, pressure, hope, or responsibility?");
    }

    if (missing.includes("primary_belief_unclear")) {
      questions.push("What are you assuming would happen if you chose differently?");
    }

    if (missing.includes("future_consequence_unclear")) {
      questions.push("If this pattern continued for five years, what would it cost?");
    }

    if (missing.includes("hidden_conflict_unclear")) {
      questions.push("What would you lose if you chose one side over the other?");
    }

    if (personModel.snapshot?.primaryRole === "unknown") {
      questions.push("Are you answering this as a builder, provider, partner, future father, or something else?");
    }

    if (beliefModel.primaryBelief?.name) {
      questions.push("Is that belief protecting you, limiting you, or both?");
    }

    return questions.slice(0, 3);
  }
};