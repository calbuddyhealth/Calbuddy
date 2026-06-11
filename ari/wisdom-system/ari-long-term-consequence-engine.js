// ari/wisdom-system/ari-long-term-consequence-engine.js
// Ari Long-Term Consequence Engine
// Purpose: Estimate what may happen if the current pattern continues over time.
// V1.0

window.Ari = window.Ari || {};

window.Ari.longTermConsequenceEngine = {
  version: "1.0.0",

  evaluate({
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    executive = {},
    wisdom = {},
    regret = {}
  } = {}) {
    const path = this.detectPath({
      insight,
      meaning,
      personModel,
      beliefModel,
      simulation,
      executive,
      wisdom,
      regret
    });

    return {
      path,
      fiveYearConsequence: this.createFiveYearConsequence(path),
      protectedFuture: this.createProtectedFuture(path),
      riskIfIgnored: this.createRiskIfIgnored(path),
      courseCorrection: this.createCourseCorrection(path),
      confidence: this.estimateConfidence({
        insight,
        meaning,
        wisdom,
        regret
      }),
      source: "ari-long-term-consequence-engine"
    };
  },

  detectPath({
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    executive = {},
    wisdom = {},
    regret = {}
  } = {}) {
    const pattern = insight.pattern?.name;
    const belief = beliefModel.primaryBelief?.name;
    const priority = executive.primaryPriority?.name;
    const tension = wisdom.wisdomTension?.name;
    const regretType = regret.regretType;
    const theme = meaning.theme;

    if (
      pattern === "achievement_before_presence" ||
      tension === "presence_vs_achievement" ||
      regretType === "missing_irreplaceable_presence"
    ) {
      return "presence_loss";
    }

    if (
      priority === "capacity-protection" ||
      theme === "identity_overload" ||
      regretType === "overextending_capacity"
    ) {
      return "capacity_depletion";
    }

    if (
      pattern === "responsibility_before_recovery" ||
      belief === "responsibility_comes_before_rest" ||
      regretType === "never_allowing_recovery"
    ) {
      return "recovery_debt";
    }

    if (
      tension === "family_vs_purpose" ||
      belief === "purpose_must_not_be_abandoned" ||
      regretType === "turning_purpose_against_love"
    ) {
      return "purpose_relationship_split";
    }

    if (
      tension === "growth_vs_stability" ||
      regretType === "sacrificing_stability_for_speed"
    ) {
      return "unstable_growth";
    }

    return "unclear_path";
  },

  createFiveYearConsequence(path = "") {
    const map = {
      presence_loss:
        "If this continues for five years, achievement may grow while presence becomes harder to recover.",

      capacity_depletion:
        "If this continues for five years, the user may become more capable on paper but more depleted in practice.",

      recovery_debt:
        "If this continues for five years, recovery may stop feeling allowed and exhaustion may become normal.",

      purpose_relationship_split:
        "If this continues for five years, purpose may grow but begin to feel separate from love, family, and peace.",

      unstable_growth:
        "If this continues for five years, growth may happen quickly but become difficult to sustain.",

      unclear_path:
        "Ari does not have enough signal to project the long-term consequence clearly."
    };

    return map[path] || map.unclear_path;
  },

  createProtectedFuture(path = "") {
    const map = {
      presence_loss:
        "A protected future would keep achievement meaningful by making sure presence is not sacrificed to reach it.",

      capacity_depletion:
        "A protected future would let ambition grow only at the pace capacity can sustain.",

      recovery_debt:
        "A protected future would treat recovery as part of responsibility, not as a reward after everything is done.",

      purpose_relationship_split:
        "A protected future would let purpose serve love instead of competing with it.",

      unstable_growth:
        "A protected future would choose growth with roots, not speed without stability.",

      unclear_path:
        "A protected future starts with naming the pattern more clearly before making a major commitment."
    };

    return map[path] || map.unclear_path;
  },

  createRiskIfIgnored(path = "") {
    const map = {
      presence_loss:
        "The risk is realizing too late that some moments were not waiting for you to become ready.",

      capacity_depletion:
        "The risk is mistaking endurance for health until capacity quietly collapses.",

      recovery_debt:
        "The risk is becoming proud of never needing rest while slowly losing access to peace.",

      purpose_relationship_split:
        "The risk is protecting purpose so aggressively that it stops nourishing the life it was supposed to serve.",

      unstable_growth:
        "The risk is building something impressive that becomes too unstable to carry.",

      unclear_path:
        "The risk is making decisions from urgency instead of understanding."
    };

    return map[path] || map.unclear_path;
  },

  createCourseCorrection(path = "") {
    const map = {
      presence_loss:
        "Choose one non-negotiable moment of presence and protect it before adding another goal.",

      capacity_depletion:
        "Remove, delay, or simplify one responsibility before expanding the mission.",

      recovery_debt:
        "Make recovery scheduled and protected, not optional and leftover.",

      purpose_relationship_split:
        "Define a smaller rhythm for purpose that does not compete with family presence.",

      unstable_growth:
        "Slow the timeline until the foundation can support the growth.",

      unclear_path:
        "Ask one better question before choosing the next action."
    };

    return map[path] || map.unclear_path;
  },

  estimateConfidence({
    insight = {},
    meaning = {},
    wisdom = {},
    regret = {}
  } = {}) {
    if (
      insight.calibratedConfidence === "high" ||
      wisdom.confidence === "high" ||
      regret.regretIntensity === "high"
    ) {
      return "high";
    }

    if (
      insight.calibratedConfidence === "medium" ||
      meaning.confidence === "medium" ||
      wisdom.confidence === "medium"
    ) {
      return "medium";
    }

    return "low";
  }
};