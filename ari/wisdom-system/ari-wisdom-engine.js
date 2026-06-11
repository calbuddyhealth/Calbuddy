// ari/wisdom-system/ari-wisdom-engine.js
// Ari Wisdom Engine
// Purpose: Convert Ari's reasoning into long-term guidance.
// V1.0: Uses wisdom archetypes inspired by Socrates, Marcus Aurelius, Viktor Frankl, Jesus, and Buddha.

window.Ari = window.Ari || {};

window.Ari.wisdomEngine = {
  version: "1.0.0",

  synthesize({
    executive = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    metaAwareness = {}
  } = {}) {
    const wisdomTension = this.detectWisdomTension({
      executive,
      insight,
      meaning,
      simulation
    });

    const highestGood = this.detectHighestGood({
      executive,
      meaning,
      personModel,
      beliefModel,
      simulation
    });

    const longTermPriority = this.detectLongTermPriority({
      highestGood,
      meaning,
      personModel,
      simulation
    });

    const likelyRegret = this.detectLikelyRegret({
      wisdomTension,
      highestGood,
      simulation,
      personModel
    });

    const wisdomPrinciple = this.chooseWisdomPrinciple({
      wisdomTension,
      highestGood,
      longTermPriority,
      insight,
      meaning,
      metaAwareness
    });

    const archetype = this.chooseArchetype({
      wisdomTension,
      highestGood,
      longTermPriority,
      insight,
      metaAwareness
    });

    return {
      wisdomPrinciple,
      wisdomTension,
      highestGood,
      longTermPriority,
      likelyRegret,
      archetype,
      wisdomStatement: this.createWisdomStatement({
        wisdomPrinciple,
        wisdomTension,
        highestGood,
        longTermPriority,
        likelyRegret,
        archetype
      }),
      confidence: this.estimateWisdomConfidence({
        wisdomPrinciple,
        highestGood,
        metaAwareness
      }),
      source: "ari-wisdom-engine"
    };
  },

  detectWisdomTension({ executive = {}, insight = {}, meaning = {}, simulation = {} } = {}) {
    const tradeoff = insight.tradeoff?.name || simulation.primarySimulation?.theme;
    const conflict = insight.hiddenConflict?.name;
    const meaningTheme = meaning.theme;

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
      conflict === "family_vs_purpose" ||
      meaningTheme === "family_vs_purpose"
    ) {
      return {
        name: "family_vs_purpose",
        sideA: "family",
        sideB: "purpose"
      };
    }

    if (
      conflict === "growth_vs_stability" ||
      tradeoff === "growth_vs_stability"
    ) {
      return {
        name: "growth_vs_stability",
        sideA: "growth",
        sideB: "stability"
      };
    }

    if (executive.primaryPriority?.name === "capacity-protection") {
      return {
        name: "capacity_vs_ambition",
        sideA: "capacity",
        sideB: "ambition"
      };
    }

    if (meaningTheme === "identity_overload") {
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

  detectHighestGood({ executive = {}, meaning = {}, personModel = {}, beliefModel = {}, simulation = {} } = {}) {
    const priority = executive.primaryPriority?.name;
    const need = personModel.snapshot?.mainNeed;
    const belief = beliefModel.primaryBelief?.name;
    const simulationTheme = simulation.primarySimulation?.theme;
    const meaningTheme = meaning.theme;

    if (
      priority === "family" ||
      need === "secure_family_presence" ||
      meaningTheme === "family_transition"
    ) {
      return "protect_family";
    }

    if (
      priority === "capacity-protection" ||
      meaningTheme === "identity_overload"
    ) {
      return "protect_capacity";
    }

    if (
      simulationTheme === "presence_vs_acceleration" ||
      belief === "family_moments_are_irreplaceable"
    ) {
      return "protect_presence";
    }

    if (
      belief === "purpose_must_not_be_abandoned" ||
      belief === "delaying_purpose_feels_like_betrayal"
    ) {
      return "protect_purpose_without_worshiping_speed";
    }

    return "protect_clarity";
  },

  detectLongTermPriority({ highestGood = "", meaning = {}, personModel = {}, simulation = {} } = {}) {
    if (
      highestGood === "protect_family" ||
      highestGood === "protect_presence"
    ) {
      return "presence";
    }

    if (highestGood === "protect_capacity") {
      return "capacity";
    }

    if (highestGood === "protect_purpose_without_worshiping_speed") {
      return "sustainable_purpose";
    }

    if (personModel.lifeChapter?.name?.includes("transition")) {
      return "stability_during_transition";
    }

    if (simulation.primarySimulation?.theme === "growth_vs_stability") {
      return "stability";
    }

    return "understanding";
  },

  detectLikelyRegret({ wisdomTension = {}, highestGood = "", simulation = {}, personModel = {} } = {}) {
    if (
      wisdomTension.name === "presence_vs_achievement" ||
      highestGood === "protect_presence"
    ) {
      return "Missing irreplaceable moments while chasing replaceable milestones.";
    }

    if (highestGood === "protect_family") {
      return "Being physically present but emotionally unavailable during a family season.";
    }

    if (highestGood === "protect_capacity") {
      return "Expanding responsibility faster than capacity could support.";
    }

    if (wisdomTension.name === "family_vs_purpose") {
      return "Treating purpose and family like enemies instead of learning how they can serve each other.";
    }

    if (wisdomTension.name === "growth_vs_stability") {
      return "Confusing speed with growth and sacrificing stability too early.";
    }

    return "Moving too quickly before understanding what this moment is really asking.";
  },

  chooseWisdomPrinciple({
    wisdomTension = {},
    highestGood = "",
    longTermPriority = "",
    insight = {},
    meaning = {},
    metaAwareness = {}
  } = {}) {
    if (
      wisdomTension.name === "presence_vs_achievement" ||
      highestGood === "protect_presence"
    ) {
      return "Protect what cannot be replaced before chasing what can return.";
    }

    if (highestGood === "protect_capacity") {
      return "Protect capacity before expanding responsibility.";
    }

    if (wisdomTension.name === "family_vs_purpose") {
      return "Purpose should deepen love, not compete with it.";
    }

    if (wisdomTension.name === "growth_vs_stability") {
      return "Growth that destroys stability is not wisdom; it is acceleration without roots.";
    }

    if (metaAwareness.confidenceLevel === "low") {
      return "When evidence is thin, humility is wiser than certainty.";
    }

    if (meaning.theme === "search_for_meaning") {
      return "Not every question needs an immediate answer; some need honest attention.";
    }

    return "Not everything important can be first. Wisdom chooses what leads.";
  },

  chooseArchetype({
    wisdomTension = {},
    highestGood = "",
    longTermPriority = "",
    insight = {},
    metaAwareness = {}
  } = {}) {
    if (metaAwareness.confidenceLevel === "low") {
      return {
        name: "socratic_humility",
        inspiration: "Socrates",
        lesson: "Know what you do not know before claiming what you know."
      };
    }

    if (highestGood === "protect_capacity") {
      return {
        name: "stoic_priority",
        inspiration: "Marcus Aurelius",
        lesson: "Focus on what deserves your attention and release what does not."
      };
    }

    if (
      highestGood === "protect_family" ||
      highestGood === "protect_presence"
    ) {
      return {
        name: "relational_love",
        inspiration: "Jesus",
        lesson: "Love and presence matter more than status or accumulation."
      };
    }

    if (longTermPriority === "sustainable_purpose") {
      return {
        name: "meaning_through_suffering",
        inspiration: "Viktor Frankl",
        lesson: "Purpose can survive hardship when it is anchored in meaning."
      };
    }

    if (wisdomTension.name === "growth_vs_stability") {
      return {
        name: "non_attachment",
        inspiration: "Buddha",
        lesson: "Suffering often grows when we cling too tightly to one outcome."
      };
    }

    return {
      name: "integrated_wisdom",
      inspiration: "combined",
      lesson: "Humility, meaning, love, discipline, and non-attachment must work together."
    };
  },

  estimateWisdomConfidence({ wisdomPrinciple = "", highestGood = "", metaAwareness = {} } = {}) {
    if (metaAwareness.confidenceLevel === "high") return "high";
    if (metaAwareness.confidenceLevel === "medium") return "medium";
    if (wisdomPrinciple && highestGood) return "medium";
    return "low";
  },

  createWisdomStatement({
    wisdomPrinciple = "",
    wisdomTension = {},
    highestGood = "",
    longTermPriority = "",
    likelyRegret = "",
    archetype = {}
  } = {}) {
    const lines = [];

    if (wisdomPrinciple) {
      lines.push(wisdomPrinciple);
    }

    if (
      wisdomTension.name &&
      wisdomTension.name !== "unclear" &&
      wisdomTension.sideA &&
      wisdomTension.sideB
    ) {
      lines.push(
        `The tension is ${wisdomTension.sideA} versus ${wisdomTension.sideB}.`
      );
    }

    if (longTermPriority) {
      lines.push(
        `The long-term priority appears to be ${longTermPriority.replaceAll("_", " ")}.`
      );
    }

    if (likelyRegret) {
      lines.push(`The likely regret to avoid is: ${likelyRegret}`);
    }

    if (archetype?.lesson) {
      lines.push(`Wisdom lens: ${archetype.lesson}`);
    }

    return lines.join(" ");
  }
};