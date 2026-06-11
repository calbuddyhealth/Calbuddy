// ari/wisdom-system/ari-wisdom-conflict-resolver.js
// Ari Wisdom Conflict Resolver
// Purpose: Help Ari resolve "good vs good" tensions without oversimplifying.
// V1.0

window.Ari = window.Ari || {};

window.Ari.wisdomConflictResolver = {
  version: "1.0.0",

  resolve({
    wisdom = {},
    executive = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    metaAwareness = {}
  } = {}) {
    const tension = wisdom.wisdomTension || this.detectFallbackTension({
      insight,
      meaning,
      simulation
    });

    const resolutionMode = this.chooseResolutionMode({
      tension,
      executive,
      metaAwareness
    });

    const leadingGood = this.chooseLeadingGood({
      tension,
      wisdom,
      executive,
      personModel,
      beliefModel
    });

    const supportingGood = this.chooseSupportingGood({
      tension,
      leadingGood
    });

    const boundary = this.createBoundary({
      tension,
      leadingGood,
      supportingGood,
      executive
    });

    const integration = this.createIntegration({
      tension,
      leadingGood,
      supportingGood
    });

    return {
      tension,
      resolutionMode,
      leadingGood,
      supportingGood,
      boundary,
      integration,
      resolvedStatement: this.createResolvedStatement({
        tension,
        resolutionMode,
        leadingGood,
        supportingGood,
        boundary,
        integration
      }),
      confidence: this.estimateConfidence({
        wisdom,
        metaAwareness,
        leadingGood
      }),
      source: "ari-wisdom-conflict-resolver"
    };
  },

  detectFallbackTension({ insight = {}, meaning = {}, simulation = {} } = {}) {
    const tradeoff = insight.tradeoff?.name || simulation.primarySimulation?.theme;
    const hiddenConflict = insight.hiddenConflict?.name;
    const theme = meaning.theme;

    if (
      tradeoff === "presence_vs_acceleration" ||
      tradeoff === "achievement_vs_presence"
    ) {
      return {
        name: "presence_vs_achievement",
        sideA: "presence",
        sideB: "achievement"
      };
    }

    if (
      hiddenConflict === "family_vs_purpose" ||
      theme === "family_vs_purpose"
    ) {
      return {
        name: "family_vs_purpose",
        sideA: "family",
        sideB: "purpose"
      };
    }

    if (
      hiddenConflict === "growth_vs_stability" ||
      tradeoff === "growth_vs_stability"
    ) {
      return {
        name: "growth_vs_stability",
        sideA: "growth",
        sideB: "stability"
      };
    }

    if (theme === "identity_overload") {
      return {
        name: "many_goods_competing",
        sideA: "many meaningful roles",
        sideB: "one primary season"
      };
    }

    return {
      name: "unclear",
      sideA: null,
      sideB: null
    };
  },

  chooseResolutionMode({ tension = {}, executive = {}, metaAwareness = {} } = {}) {
    if (metaAwareness.confidenceLevel === "low") {
      return "hold_humbly";
    }

    if (executive.primaryPriority?.name === "capacity-protection") {
      return "protect_capacity_first";
    }

    if (
      tension.name === "presence_vs_achievement" ||
      tension.name === "family_vs_purpose"
    ) {
      return "seasonal_priority";
    }

    if (tension.name === "growth_vs_stability") {
      return "pace_growth";
    }

    if (tension.name === "many_goods_competing") {
      return "choose_one_lead";
    }

    return "continue_observing";
  },

  chooseLeadingGood({
    tension = {},
    wisdom = {},
    executive = {},
    personModel = {},
    beliefModel = {}
  } = {}) {
    const highestGood = wisdom.highestGood;
    const priority = executive.primaryPriority?.name;
    const need = personModel.snapshot?.mainNeed;
    const belief = beliefModel.primaryBelief?.name;

    if (priority === "capacity-protection") return "capacity";
    if (priority === "family") return "family";

    if (
      highestGood === "protect_family" ||
      need === "secure_family_presence"
    ) {
      return "family";
    }

    if (highestGood === "protect_presence") {
      return "presence";
    }

    if (highestGood === "protect_capacity") {
      return "capacity";
    }

    if (highestGood === "protect_purpose_without_worshiping_speed") {
      return "sustainable_purpose";
    }

    if (belief === "purpose_must_not_be_abandoned") {
      return "purpose";
    }

    if (tension.sideA) return tension.sideA;

    return "clarity";
  },

  chooseSupportingGood({ tension = {}, leadingGood = "" } = {}) {
    const sides = [tension.sideA, tension.sideB].filter(Boolean);
    const supporting = sides.find((side) => side !== leadingGood);

    if (supporting) return supporting;

    if (leadingGood === "family") return "purpose";
    if (leadingGood === "presence") return "achievement";
    if (leadingGood === "capacity") return "ambition";
    if (leadingGood === "sustainable_purpose") return "family";

    return "the other meaningful priority";
  },

  createBoundary({ tension = {}, leadingGood = "", supportingGood = "", executive = {} } = {}) {
    if (leadingGood === "capacity") {
      return "Do not add more responsibility until capacity is protected.";
    }

    if (leadingGood === "family" || leadingGood === "presence") {
      return "Do not let achievement consume the moments that cannot be recovered later.";
    }

    if (leadingGood === "sustainable_purpose") {
      return "Do not abandon purpose, but do not demand that it move at full speed in every season.";
    }

    if (tension.name === "growth_vs_stability") {
      return "Growth should not outrun the stability required to sustain it.";
    }

    return "Do not allow every meaningful priority to compete equally at the same time.";
  },

  createIntegration({ tension = {}, leadingGood = "", supportingGood = "" } = {}) {
    if (leadingGood === "family" && supportingGood === "purpose") {
      return "Let purpose serve family instead of competing against it.";
    }

    if (leadingGood === "presence" && supportingGood === "achievement") {
      return "Let achievement support presence instead of replacing it.";
    }

    if (leadingGood === "capacity" && supportingGood === "ambition") {
      return "Let ambition move at the speed your capacity can honestly support.";
    }

    if (leadingGood === "sustainable_purpose") {
      return "Keep purpose alive through rhythm, not pressure.";
    }

    if (tension.name === "many_goods_competing") {
      return "Keep all meaningful roles alive, but let only one lead this season.";
    }

    return "The goal is not to destroy one good for another. The goal is to put them in the right order.";
  },

  createResolvedStatement({
    tension = {},
    resolutionMode = "",
    leadingGood = "",
    supportingGood = "",
    boundary = "",
    integration = ""
  } = {}) {
    if (!tension.name || tension.name === "unclear") {
      return "Ari does not have enough wisdom signal to resolve the tension yet.";
    }

    return [
      `This looks like a ${tension.sideA} versus ${tension.sideB} tension.`,
      `For this season, ${leadingGood} should lead and ${supportingGood} should support.`,
      boundary,
      integration
    ].join(" ");
  },

  estimateConfidence({ wisdom = {}, metaAwareness = {}, leadingGood = "" } = {}) {
    if (metaAwareness.confidenceLevel === "high" && leadingGood) {
      return "high";
    }

    if (
      metaAwareness.confidenceLevel === "medium" ||
      wisdom.confidence === "medium"
    ) {
      return "medium";
    }

    return "low";
  }
};