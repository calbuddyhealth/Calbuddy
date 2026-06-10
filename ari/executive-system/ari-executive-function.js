// ari/executive-system/ari-executive-function.js
// Ari Executive Function
// Purpose: Decide what deserves priority based on observation, values, identity, conflict, and emotion.
// V1.0

window.Ari = window.Ari || {};

window.Ari.executiveFunction = {
  version: "1.0.0",

  decide({ observation = {}, values = {}, identity = {}, conflicts = {}, emotion = {} } = {}) {
    const priorities = [];

    const addPriority = (name, score, reason) => {
      const existing = priorities.find((item) => item.name === name);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        return;
      }

      priorities.push({
        name,
        score,
        reasons: [reason]
      });
    };

    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const dominantValue = values.dominantValue;
    const dominantIdentity = identity.dominantIdentity?.name;
    const conflictIntensity = conflicts.conflictIntensity;

    if (life.fatherhood || dominantIdentity === "father") {
      addPriority("family", 40, "Fatherhood or child-related transition is active.");
    }

    if (life.engagement || life.marriage) {
      addPriority("relationship", 25, "Marriage, wedding, or spouse transition is active.");
    }

    if (life.militaryTransition) {
      addPriority("military-transition", 25, "Military transition requires stability and planning.");
    }

    if (life.careerTransition || values.values?.includes("growth")) {
      addPriority("career-development", 20, "Career or education growth is active.");
    }

    if (values.values?.includes("creation")) {
      addPriority("creation", 15, "Creative mission or Ari Rebirth is active.");
    }

    if (values.values?.includes("service")) {
      addPriority("service", 15, "Service/helping value is active.");
    }

    if (patterns.burnoutRisk || conflictIntensity === "critical") {
      addPriority("capacity-protection", 35, "Burnout risk or critical conflict detected.");
    }

    if (patterns.futureRegretRisk) {
      addPriority("regret-protection", 25, "Future regret risk detected.");
    }

    if (dominantValue === "family") {
      addPriority("family", 20, "Family is the dominant value.");
    }

    priorities.sort((a, b) => b.score - a.score);

    const primaryPriority = priorities[0] || null;
    const secondaryPriorities = priorities.slice(1, 4);

    const thingsToDelay = this.getThingsToDelay({
      priorities,
      values,
      identity,
      conflicts,
      observation
    });

    return {
      primaryPriority,
      secondaryPriorities,
      thingsToDelay,
      executiveDecision: this.getExecutiveDecision(primaryPriority),
      recommendedFocus: this.getRecommendedFocus(primaryPriority, thingsToDelay),
      reasoning: this.getReasoning({
        primaryPriority,
        priorities,
        conflicts,
        identity,
        values
      }),
      source: "ari-executive-function"
    };
  },

  getThingsToDelay({ priorities = [], values = {}, identity = {}, conflicts = {}, observation = {} } = {}) {
    const delay = [];
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};

    if (
      values.values?.includes("creation") &&
      life.fatherhood &&
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      delay.push({
        name: "creation",
        reason: "Ari Rebirth should become maintenance mode during extreme family/life transition load."
      });
    }

    if (
      values.values?.includes("growth") &&
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      delay.push({
        name: "career-acceleration",
        reason: "Career growth should continue, but not at full acceleration during extreme transition load."
      });
    }

    if (patterns.burnoutRisk) {
      delay.push({
        name: "nonessential-expansion",
        reason: "Avoid expanding optional goals while burnout risk is active."
      });
    }

    return delay;
  },

  getExecutiveDecision(primaryPriority = null) {
    if (!primaryPriority) {
      return "continue_observing";
    }

    const decisions = {
      family: "protect_family_first",
      relationship: "protect_relationship_stability",
      "military-transition": "stabilize_transition",
      "career-development": "continue_growth_with_limits",
      creation: "build_slowly_without_overextending",
      service: "serve_without_self-erasure",
      "capacity-protection": "reduce_load_immediately",
      "regret-protection": "protect_irreplaceable_moments"
    };

    return decisions[primaryPriority.name] || "prioritize_with_caution";
  },

  getRecommendedFocus(primaryPriority = null, thingsToDelay = []) {
    if (!primaryPriority) {
      return "Gather more context before making a decision.";
    }

    if (primaryPriority.name === "family") {
      return "Make family the primary focus for this season. Keep other identities alive, but do not let them compete equally.";
    }

    if (primaryPriority.name === "capacity-protection") {
      return "Reduce load before adding ambition. Protect energy, sleep, relationships, and follow-through.";
    }

    if (primaryPriority.name === "regret-protection") {
      return "Prioritize choices that protect irreplaceable time and reduce future regret.";
    }

    return `Prioritize ${primaryPriority.name} while delaying: ${thingsToDelay
      .map((item) => item.name)
      .join(", ") || "nothing major"}.`;
  },

  getReasoning({ primaryPriority = null, priorities = [], conflicts = {}, identity = {}, values = {} } = {}) {
    if (!primaryPriority) {
      return "No clear executive priority emerged.";
    }

    return `Ari identified ${primaryPriority.name} as the leading priority because it scored highest against current values, identities, and conflicts. Dominant value: ${
      values.dominantValue || "unknown"
    }. Dominant identity: ${
      identity.dominantIdentity?.name || "unknown"
    }. Conflict intensity: ${
      conflicts.conflictIntensity || "unknown"
    }.`;
  }
};
