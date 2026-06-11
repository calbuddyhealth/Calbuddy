// ari/self-system/ari-self-reflection.js
// Ari Self Reflection
// Purpose: Decide how Ari should approach a situation based on
// Ari's identity, values, and constitution.
// V1.0

window.Ari = window.Ari || {};

window.Ari.selfReflection = {
  version: "1.0.0",

  reflect(analysis = {}) {
    const self =
      window.Ari.selfModel?.getSelf() || {};

    const values =
      window.Ari.selfValues?.getValues() || [];

    const constitution =
      window.Ari.constitution?.getHierarchy() || [];

    const questionType =
      analysis.questionType || "understanding";

    const meaning =
      analysis.meaning || {};

    const executive =
      analysis.executive || {};

    const emotionalIntelligence =
      analysis.emotionalIntelligence || {};

    const dominantValue =
      analysis.values?.dominantValue || null;

    const dominantIdentity =
      analysis.identity?.dominantIdentity?.name || null;

    const stance =
      window.Ari.selfModel?.chooseStance({
        questionType,
        meaning,
        executive,
        emotionalIntelligence
      }) || {
        name: "steady_companion"
      };

    const leadPrinciple =
      this.selectLeadPrinciple({
        questionType,
        dominantValue,
        dominantIdentity,
        executive,
        emotionalIntelligence
      });

    const leadValue =
      this.selectLeadValue({
        dominantValue,
        executive,
        emotionalIntelligence
      });

    const approach =
      this.buildApproach(
        stance.name,
        leadPrinciple,
        leadValue
      );

    return {
      stance,

      leadPrinciple,

      leadValue,

      approach,

      selfIdentity:
        self.essence?.identity || null,

      relationship:
        self.essence?.relationship || null,

      confidence:
        this.calculateConfidence({
          stance,
          leadPrinciple,
          leadValue
        }),

      source: "ari-self-reflection"
    };
  },

  selectLeadPrinciple({
    questionType,
    dominantValue,
    executive,
    emotionalIntelligence
  }) {
    if (
      emotionalIntelligence.rootNeed?.name ===
      "secure_family_presence"
    ) {
      return "protect_relationships";
    }

    if (
      executive.executiveDecision ===
      "protect_family_first"
    ) {
      return "protect_relationships";
    }

    if (questionType === "meaning") {
      return "wisdom_over_urgency";
    }

    if (questionType === "insight") {
      return "understanding_before_judgment";
    }

    if (questionType === "decision") {
      return "protect_future_self";
    }

    return "truth_before_convenience";
  },

  selectLeadValue({
    dominantValue,
    executive,
    emotionalIntelligence
  }) {
    if (
      emotionalIntelligence.rootNeed?.name ===
      "secure_family_presence"
    ) {
      return "presence";
    }

    if (
      executive.executiveDecision ===
      "protect_family_first"
    ) {
      return "presence";
    }

    if (dominantValue) {
      return dominantValue;
    }

    return "understanding";
  },

  buildApproach(
    stance,
    leadPrinciple,
    leadValue
  ) {
    const approaches = {
      observer:
        "Observe before interpreting. Name patterns carefully.",

      storykeeper:
        "Understand the chapter before explaining the lesson.",

      companion:
        "Stay close to the emotional experience before offering direction.",

      steward:
        "Protect what matters most before optimizing outcomes.",

      builder:
        "Focus on the next clean improvement, not the entire system.",

      steady_companion:
        "Seek understanding before action."
    };

    return {
      stanceApproach:
        approaches[stance] ||
        approaches.steady_companion,

      leadPrinciple,

      leadValue
    };
  },

  calculateConfidence({
    stance,
    leadPrinciple,
    leadValue
  }) {
    if (
      stance &&
      leadPrinciple &&
      leadValue
    ) {
      return "high";
    }

    return "medium";
  }
};