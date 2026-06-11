// ari/wisdom-system/ari-regret-engine.js
// Ari Regret Engine
// Purpose: Estimate the likely future regret if the current pattern continues.
// V1.0

window.Ari = window.Ari || {};

window.Ari.regretEngine = {
  version: "1.0.0",

  evaluate({
    wisdom = {},
    wisdomResolution = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    executive = {}
  } = {}) {
    const regretType = this.detectRegretType({
      wisdom,
      wisdomResolution,
      insight,
      meaning,
      personModel,
      beliefModel,
      simulation,
      executive
    });

    const regretStatement = this.createRegretStatement(regretType);

    return {
      regretType,
      regretStatement,
      regretIntensity: this.estimateIntensity({
        regretType,
        insight,
        meaning,
        executive
      }),
      preventableAction: this.createPreventableAction(regretType),
      source: "ari-regret-engine"
    };
  },

  detectRegretType({
    wisdom = {},
    wisdomResolution = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    executive = {}
  } = {}) {
    const tension = wisdom.wisdomTension?.name;
    const leadingGood = wisdomResolution.leadingGood;
    const priority = executive.primaryPriority?.name;
    const pattern = insight.pattern?.name;
    const belief = beliefModel.primaryBelief?.name;
    const lifeChapter = personModel.lifeChapter?.name;
    const theme = meaning.theme;

    if (
      tension === "presence_vs_achievement" ||
      pattern === "achievement_before_presence" ||
      belief === "family_moments_are_irreplaceable"
    ) {
      return "missing_irreplaceable_presence";
    }

    if (
      priority === "capacity-protection" ||
      leadingGood === "capacity" ||
      theme === "identity_overload"
    ) {
      return "overextending_capacity";
    }

    if (
      tension === "family_vs_purpose" ||
      belief === "purpose_must_not_be_abandoned"
    ) {
      return "turning_purpose_against_love";
    }

    if (
      pattern === "responsibility_before_recovery" ||
      belief === "responsibility_comes_before_rest"
    ) {
      return "never_allowing_recovery";
    }

    if (
      tension === "growth_vs_stability" ||
      simulation.primarySimulation?.theme === "growth_vs_stability"
    ) {
      return "sacrificing_stability_for_speed";
    }

    if (
      lifeChapter?.includes("transition") ||
      theme === "general_understanding"
    ) {
      return "moving_without_understanding";
    }

    return "unclear_regret";
  },

  createRegretStatement(regretType = "") {
    const map = {
      missing_irreplaceable_presence:
        "The likely regret is missing irreplaceable moments while chasing milestones that could have waited.",

      overextending_capacity:
        "The likely regret is expanding responsibility faster than your capacity could honestly support.",

      turning_purpose_against_love:
        "The likely regret is treating purpose and love like enemies instead of learning how they can serve each other.",

      never_allowing_recovery:
        "The likely regret is becoming dependable for everyone while quietly abandoning your own recovery.",

      sacrificing_stability_for_speed:
        "The likely regret is confusing speed with growth and losing the stability that would have sustained you.",

      moving_without_understanding:
        "The likely regret is moving too quickly before understanding what this season was asking from you.",

      unclear_regret:
        "Ari does not have enough signal to name the likely regret cleanly yet."
    };

    return map[regretType] || map.unclear_regret;
  },

  estimateIntensity({
    regretType = "",
    insight = {},
    meaning = {},
    executive = {}
  } = {}) {
    if (regretType === "unclear_regret") return "low";

    if (
      executive.executiveDecision === "reduce_load_immediately" ||
      insight.calibratedConfidence === "high" ||
      meaning.confidence === "high"
    ) {
      return "high";
    }

    if (
      insight.calibratedConfidence === "medium" ||
      meaning.confidence === "medium"
    ) {
      return "medium";
    }

    return "low";
  },

  createPreventableAction(regretType = "") {
    const map = {
      missing_irreplaceable_presence:
        "Protect specific moments of presence before adding more achievement goals.",

      overextending_capacity:
        "Remove or delay one responsibility before accepting another.",

      turning_purpose_against_love:
        "Let purpose move at a sustainable pace so it strengthens love instead of competing with it.",

      never_allowing_recovery:
        "Schedule recovery as a responsibility, not a reward.",

      sacrificing_stability_for_speed:
        "Choose the growth path that preserves stability.",

      moving_without_understanding:
        "Pause long enough to name what this moment is really asking.",

      unclear_regret:
        "Gather more context before making a strong prediction."
    };

    return map[regretType] || map.unclear_regret;
  }
};