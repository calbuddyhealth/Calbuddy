// ari/executive-system/ari-executive-function.js
// Ari Executive Function
// Purpose: Decide what deserves priority based on observation, life signals, values, identity, conflict, and emotion.
// V1.2: Family-first correction. Regret-protection supports family instead of stealing lead.

window.Ari = window.Ari || {};

window.Ari.executiveFunction = {
  version: "1.2.0",

  decide({
    observation = {},
    lifeSignals = {},
    values = {},
    identity = {},
    conflicts = {},
    emotion = {}
  } = {}) {
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
    const valueList = values.values || [];

    const dominantIdentity = identity.dominantIdentity?.name;
    const conflictIntensity = conflicts.conflictIntensity;
    const primaryConflict = conflicts.primaryConflict?.name || "";
    const conflictNames = (conflicts.conflicts || []).map((item) => item.name);

    const signalNames = lifeSignals.signalNames || [];
    const primaryLifeSignal = lifeSignals.primarySignal?.name || null;

    const familyConflictActive =
      primaryConflict === "family_vs_creation" ||
      primaryConflict === "provider_vs_present_parent" ||
      conflictNames.includes("family_vs_creation") ||
      conflictNames.includes("family_vs_achievement") ||
      conflictNames.includes("provider_vs_present_parent");

    const familySignalActive =
      life.fatherhood ||
      life.pregnancy ||
      life.familyTransition ||
      primaryLifeSignal === "family_transition" ||
      signalNames.includes("family_transition") ||
      dominantValue === "family" ||
      valueList.includes("family");

    const regretSignalActive =
      patterns.futureRegretRisk ||
      primaryConflict === "presence_vs_achievement" ||
      conflictNames.includes("presence_vs_achievement") ||
      conflictNames.includes("family_vs_achievement");

    if (familySignalActive) {
      addPriority(
        "family",
        60,
        "Family or major family transition is active and should organize the executive priority."
      );
    }

    if (familyConflictActive) {
      addPriority(
        "family",
        40,
        "Family is competing with creation, achievement, or provision, so family should lead this season."
      );
    }

    if (life.fatherhood || dominantIdentity === "father") {
      addPriority("family", 40, "Fatherhood or child-related transition is active.");
    }

    if (life.pregnancy) {
      addPriority("family", 35, "Pregnancy or incoming child transition is active.");
    }

    if (life.engagement || life.marriage) {
      addPriority("relationship", 25, "Marriage, wedding, or spouse transition is active.");
    }

    if (life.militaryTransition) {
      addPriority("military-transition", 25, "Military transition requires stability and planning.");
    }

    if (life.careerTransition || valueList.includes("growth")) {
      addPriority("career-development", 20, "Career or education growth is active.");
    }

    if (valueList.includes("creation")) {
      addPriority("creation", 15, "Creative mission or Ari Rebirth is active.");
    }

    if (valueList.includes("service")) {
      addPriority("service", 15, "Service/helping value is active.");
    }

    if (patterns.burnoutRisk || conflictIntensity === "critical") {
      addPriority("capacity-protection", 35, "Burnout risk or critical conflict detected.");
    }

    // Important correction:
    // Future regret supports family when family is already active.
    // It should not steal the executive lead from family.
    if (regretSignalActive && familySignalActive) {
      addPriority(
        "family",
        30,
        "Future regret risk points toward protecting irreplaceable family presence."
      );
    } else if (regretSignalActive) {
      addPriority("regret-protection", 25, "Future regret risk detected.");
    }

    if (dominantValue === "family") {
      addPriority("family", 25, "Family is the dominant value.");
    }

    priorities.sort((a, b) => b.score - a.score);

    const primaryPriority = priorities[0] || null;
    const secondaryPriorities = priorities.slice(1, 4);

    const thingsToDelay = this.getThingsToDelay({
      primaryPriority,
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

  getThingsToDelay({
    primaryPriority = null,
    priorities = [],
    values = {},
    identity = {},
    conflicts = {},
    observation = {}
  } = {}) {
    const delay = [];
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const primaryConflict = conflicts.primaryConflict?.name || "";
    const conflictNames = (conflicts.conflicts || []).map((item) => item.name);

    const addDelay = (name, reason) => {
      if (!delay.some((item) => item.name === name)) {
        delay.push({ name, reason });
      }
    };

    if (
      primaryPriority?.name === "family" &&
      (
        primaryConflict === "provider_vs_present_parent" ||
        primaryConflict === "family_vs_creation" ||
        conflictNames.includes("provider_vs_present_parent") ||
        conflictNames.includes("family_vs_achievement") ||
        conflictNames.includes("family_vs_creation") ||
        patterns.opportunityCost
      )
    ) {
      addDelay(
        "career-or-creation-acceleration",
        "Protect family presence during a major life transition instead of maximizing career, creation, or achievement."
      );
    }

    if (
      primaryPriority?.name === "family" &&
      (identity.dominantIdentity?.name === "father" || life.fatherhood || life.pregnancy)
    ) {
      addDelay(
        "nonessential-expansion",
        "Avoid adding major new commitments during this family transition season."
      );
    }

    if (
      values.values?.includes("creation") &&
      (life.fatherhood || life.pregnancy) &&
      (
        patterns.lifeTransitionLoad?.level === "extreme" ||
        conflictNames.includes("family_vs_creation")
      )
    ) {
      addDelay(
        "creation-scaling",
        "Keep Ari Rebirth alive, but avoid large-scale expansion during a family transition season."
      );
    }

    if (
      values.values?.includes("growth") &&
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      addDelay(
        "career-acceleration",
        "Career growth should continue, but not at full acceleration during extreme transition load."
      );
    }

    if (patterns.burnoutRisk) {
      addDelay(
        "nonessential-expansion",
        "Avoid expanding optional goals while burnout risk is active."
      );
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

    return `Prioritize ${primaryPriority.name} while delaying: ${
      thingsToDelay.map((item) => item.name).join(", ") || "nothing major"
    }.`;
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