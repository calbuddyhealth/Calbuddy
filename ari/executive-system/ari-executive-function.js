// ari/executive-system/ari-executive-function.js
// Ari Executive Function
// Purpose: Decide what deserves priority based on observation, values, identity, conflict, emotion, and life signals.
// V1.2 Rebirth Compatible
// Fixes:
// - Adds lifeSignals input.
// - Adds life-signal-aware priority scoring.
// - Adds stronger family/presence/purpose/capacity logic.
// - Normalizes priority scores to prevent runaway inflation.
// - Adds clearer delay logic.

window.Ari = window.Ari || {};

window.Ari.executiveFunction = {
  version: "1.2.0",

  decide({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    emotion = {},
    lifeSignals = {}
  } = {}) {
    const priorities = [];

    const addPriority = (name, score, reason) => {
      if (!name) return;

      const existing = priorities.find((item) => item.name === name);

      if (existing) {
        existing.score += score;

        if (!existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }

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

    const dominantValue = values.dominantValue || null;
    const valueList = Array.isArray(values.values) ? values.values : [];

    const dominantIdentity = identity.dominantIdentity?.name || null;
    const identityConflicts = Array.isArray(identity.identityConflicts)
      ? identity.identityConflicts
      : [];

    const conflictIntensity = conflicts.conflictIntensity || "none";
    const primaryConflict = conflicts.primaryConflict?.name || null;
    const conflictNames = Array.isArray(conflicts.conflicts)
      ? conflicts.conflicts.map((item) => item.name)
      : [];

    const primaryEmotion = emotion.primaryEmotion || null;

    const lifeSignalNames = Array.isArray(lifeSignals.signalNames)
      ? lifeSignals.signalNames
      : [];

    const primaryLifeSignal = lifeSignals.primarySignal?.name || null;

    const activeSignals = [
      ...lifeSignalNames,
      primaryLifeSignal,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      ...conflictNames,
      ...identityConflicts.map((item) => item.name)
    ]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());

    const hasSignal = (...needles) => {
      return activeSignals.some((signal) =>
        needles.some((needle) => signal.includes(needle))
      );
    };

    // FAMILY / PRESENCE
    if (
      life.fatherhood ||
      life.pregnancy ||
      hasSignal("fatherhood", "family_transition", "expectant", "protect_family")
    ) {
      addPriority(
        "family",
        48,
        "Fatherhood, pregnancy, or family transition is active."
      );
    }

    if (
      dominantValue === "family" ||
      valueList.includes("family")
    ) {
      addPriority("family", 28, "Family is an active or dominant value.");
    }

    if (
      hasSignal("presence_vs_achievement", "presence_loss", "missing_irreplaceable_presence") ||
      patterns.futureRegretRisk
    ) {
      addPriority(
        "regret-protection",
        36,
        "Presence, irreplaceable time, or future regret risk is active."
      );
    }

    // RELATIONSHIP
    if (life.engagement || life.marriage || hasSignal("marriage_transition")) {
      addPriority(
        "relationship",
        28,
        "Marriage, wedding, spouse, or relationship transition is active."
      );
    }

    // MILITARY / CAREER TRANSITION
    if (life.militaryTransition || hasSignal("military-transition")) {
      addPriority(
        "military-transition",
        28,
        "Military transition requires stability and planning."
      );
    }

    if (
      life.careerTransition ||
      valueList.includes("growth") ||
      hasSignal("career_transition")
    ) {
      addPriority(
        "career-development",
        22,
        "Career, education, or growth path is active."
      );
    }

    // PURPOSE / CREATION
    if (
      valueList.includes("creation") ||
      dominantValue === "creation" ||
      hasSignal("creative_mission", "purpose_signal", "builder_development")
    ) {
      addPriority(
        "creation",
        30,
        "Creative mission, purpose, or Ari Rebirth building signal is active."
      );
    }

    if (
      hasSignal("family_vs_purpose", "fear_of_betraying_purpose", "purpose_relationship_split")
    ) {
      addPriority(
        "sustainable-purpose",
        34,
        "Purpose is active, but it must be protected sustainably."
      );
    }

    // SERVICE
    if (valueList.includes("service") || dominantValue === "service") {
      addPriority("service", 18, "Service or helping value is active.");
    }

    // CAPACITY / BURNOUT
    if (
      patterns.burnoutRisk ||
      conflictIntensity === "critical" ||
      conflictIntensity === "high" ||
      hasSignal("capacity_pressure")
    ) {
      addPriority(
        "capacity-protection",
        42,
        "Burnout risk, high conflict, or capacity pressure detected."
      );
    }

    // RESPONSIBILITY / STEWARDSHIP
    if (
      primaryEmotion === "stewardship" ||
      primaryEmotion === "responsibility" ||
      valueList.includes("responsibility") ||
      dominantValue === "responsibility"
    ) {
      addPriority(
        "stewardship",
        26,
        "Responsibility or stewardship is active."
      );
    }

    // If no clear priorities, continue observing.
    if (priorities.length === 0) {
      return {
        primaryPriority: null,
        secondaryPriorities: [],
        thingsToDelay: [],
        executiveDecision: "continue_observing",
        recommendedFocus: "Gather more context before making a decision.",
        reasoning: "No clear executive priority emerged.",
        priorityScoreNormalization: {
          maxScore: 100,
          source: "ari-executive-function-normalization"
        },
        source: "ari-executive-function"
      };
    }

    priorities.forEach((item) => {
      item.rawScore = item.score;
      item.score = Math.min(item.score, 100);
    });

    priorities.sort((a, b) => b.score - a.score);

    const primaryPriority = priorities[0] || null;
    const secondaryPriorities = priorities.slice(1, 4);

    const thingsToDelay = this.getThingsToDelay({
      primaryPriority,
      priorities,
      values,
      identity,
      conflicts,
      observation,
      lifeSignals,
      emotion
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
      priorityScoreNormalization: {
        maxScore: 100,
        source: "ari-executive-function-normalization"
      },
      source: "ari-executive-function"
    };
  },

  getThingsToDelay({
    primaryPriority = null,
    priorities = [],
    values = {},
    identity = {},
    conflicts = {},
    observation = {},
    lifeSignals = {},
    emotion = {}
  } = {}) {
    const delay = [];

    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};

    const valueList = Array.isArray(values.values) ? values.values : [];

    const primaryConflict = conflicts.primaryConflict?.name || "";
    const conflictNames = Array.isArray(conflicts.conflicts)
      ? conflicts.conflicts.map((item) => item.name)
      : [];

    const lifeSignalNames = Array.isArray(lifeSignals.signalNames)
      ? lifeSignals.signalNames
      : [];

    const primaryLifeSignal = lifeSignals.primarySignal?.name || null;

    const activeSignals = [
      primaryConflict,
      primaryLifeSignal,
      ...lifeSignalNames,
      ...conflictNames
    ]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase());

    const hasSignal = (...needles) => {
      return activeSignals.some((signal) =>
        needles.some((needle) => signal.includes(needle))
      );
    };

    const addDelay = (name, reason) => {
      if (!delay.some((item) => item.name === name)) {
        delay.push({ name, reason });
      }
    };

    if (
      primaryPriority?.name === "family" ||
      primaryPriority?.name === "regret-protection"
    ) {
      if (
        primaryConflict === "provider_vs_present_parent" ||
        conflictNames.includes("provider_vs_present_parent") ||
        conflictNames.includes("family_vs_achievement") ||
        hasSignal("presence_vs_achievement", "presence_loss") ||
        patterns.opportunityCost
      ) {
        addDelay(
          "career-acceleration",
          "Protect family presence during a major life transition instead of maximizing career growth."
        );
      }

      if (
        valueList.includes("creation") ||
        hasSignal("creative_mission", "purpose_signal", "builder_development")
      ) {
        addDelay(
          "creation-scaling",
          "Keep purpose alive, but avoid scaling it so hard that it competes with family presence."
        );
      }

      addDelay(
        "nonessential-expansion",
        "Avoid adding major optional commitments while family or presence is the leading priority."
      );
    }

    if (
      primaryPriority?.name === "sustainable-purpose" ||
      primaryPriority?.name === "creation"
    ) {
      if (
        life.fatherhood ||
        life.pregnancy ||
        hasSignal("family_transition", "family_vs_purpose")
      ) {
        addDelay(
          "all-or-nothing-building",
          "Build in a smaller rhythm so purpose survives without competing with family."
        );
      }
    }

    if (
      primaryPriority?.name === "capacity-protection" ||
      patterns.burnoutRisk ||
      hasSignal("capacity_pressure")
    ) {
      addDelay(
        "nonessential-expansion",
        "Avoid expanding optional goals while capacity pressure or burnout risk is active."
      );

      addDelay(
        "high-intensity-ambition",
        "Reduce intensity before adding more ambition."
      );
    }

    if (
      valueList.includes("growth") &&
      patterns.lifeTransitionLoad?.level === "extreme"
    ) {
      addDelay(
        "career-acceleration",
        "Career growth can continue, but not at full acceleration during extreme transition load."
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
      "sustainable-purpose": "protect_purpose_with_sustainable_rhythm",
      service: "serve_without_self_erasure",
      stewardship: "steward_responsibility_without_overcontrol",
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

    if (primaryPriority.name === "regret-protection") {
      return "Prioritize choices that protect irreplaceable time, presence, and future peace.";
    }

    if (primaryPriority.name === "capacity-protection") {
      return "Reduce load before adding ambition. Protect energy, sleep, relationships, and follow-through.";
    }

    if (primaryPriority.name === "sustainable-purpose") {
      return "Keep purpose alive through a smaller, sustainable rhythm instead of all-or-nothing intensity.";
    }

    if (primaryPriority.name === "creation") {
      return "Prioritize building, but keep the scope small enough that it does not consume the rest of life.";
    }

    return `Prioritize ${primaryPriority.name} while delaying: ${
      thingsToDelay.map((item) => item.name).join(", ") || "nothing major"
    }.`;
  },

  getReasoning({
    primaryPriority = null,
    priorities = [],
    conflicts = {},
    identity = {},
    values = {}
  } = {}) {
    if (!primaryPriority) {
      return "No clear executive priority emerged.";
    }

    return `Ari identified ${primaryPriority.name} as the leading priority because it scored highest against current values, identities, conflicts, and life signals. Dominant value: ${
      values.dominantValue || "unknown"
    }. Dominant identity: ${
      identity.dominantIdentity?.name || "unknown"
    }. Conflict intensity: ${
      conflicts.conflictIntensity || "unknown"
    }.`;
  }
};