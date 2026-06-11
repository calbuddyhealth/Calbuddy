// ari/person-model/ari-person-model.js
// Ari Person Model
// Purpose: Build a structured snapshot of who the user appears to be, what roles are active, and what life chapter they are in.
// V1.0

window.Ari = window.Ari || {};

window.Ari.personModel = {
  version: "1.0.0",

  build({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    insight = {},
    emotionalIntelligence = {},
    meaning = {}
  } = {}) {
    const roles = this.detectRoles({ observation, identity });
    const lifeChapter = this.detectLifeChapter({ observation, values, identity, meaning });
    const activePressures = this.detectActivePressures({ observation, conflicts, insight });
    const likelyNeeds = this.detectLikelyNeeds({ values, emotionalIntelligence, meaning });
    const recurringPattern = this.detectRecurringPattern({ insight, meaning, observation });

    return {
      roles,
      lifeChapter,
      activePressures,
      likelyNeeds,
      recurringPattern,
      snapshot: this.createSnapshot({
        roles,
        lifeChapter,
        activePressures,
        likelyNeeds,
        recurringPattern
      }),
      source: "ari-person-model"
    };
  },

  detectRoles({ observation = {}, identity = {} } = {}) {
    const detected = [];
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const identities = identity.identities || [];

    identities.forEach((item) => {
      if (item?.name) {
        detected.push({
          name: item.name,
          strength: item.strength || 50,
          source: "identity-engine"
        });
      }
    });

    if (life.fatherhood) {
      this.addOrBoostRole(detected, "father", 95, "life-transition");
    }

    if (life.engagement || life.marriage) {
      this.addOrBoostRole(detected, "partner", 85, "life-transition");
    }

    if (life.militaryTransition) {
      this.addOrBoostRole(detected, "military-transitioning", 80, "life-transition");
    }

    if (life.careerTransition) {
      this.addOrBoostRole(detected, "career-transitioning", 75, "life-transition");
    }

    if (patterns.roles?.includes("builder")) {
      this.addOrBoostRole(detected, "builder", 75, "observer");
    }

    detected.sort((a, b) => b.strength - a.strength);

    return detected.slice(0, 8);
  },

  addOrBoostRole(roles = [], name = "", strength = 50, source = "person-model") {
    const existing = roles.find((role) => role.name === name);

    if (existing) {
      existing.strength = Math.max(existing.strength, strength);
      existing.source = `${existing.source}+${source}`;
      return;
    }

    roles.push({ name, strength, source });
  },

  detectLifeChapter({ observation = {}, values = {}, identity = {}, meaning = {} } = {}) {
    const life = observation.lifeTransitions || {};
    const dominantValue = values.dominantValue || null;
    const dominantIdentity = identity.dominantIdentity?.name || null;
    const meaningTheme = meaning.theme || null;

    if (life.fatherhood && life.militaryTransition) {
      return {
        name: "fatherhood_and_transition",
        confidence: "high",
        description:
          "The user appears to be entering fatherhood while also transitioning out of a major service identity."
      };
    }

    if (life.fatherhood) {
      return {
        name: "entering_fatherhood",
        confidence: "high",
        description:
          "The user appears to be preparing for a fatherhood-centered life chapter."
      };
    }

    if (life.militaryTransition || life.careerTransition) {
      return {
        name: "career_and_identity_transition",
        confidence: "medium",
        description:
          "The user appears to be navigating a transition in work, identity, or role."
      };
    }

    if (meaningTheme === "family_transition" || dominantValue === "family") {
      return {
        name: "family_transition",
        confidence: "medium",
        description:
          "The user appears to be moving toward a more family-centered season."
      };
    }

    if (dominantIdentity) {
      return {
        name: `${dominantIdentity}_development`,
        confidence: "medium",
        description:
          `The user appears to be developing around the ${dominantIdentity} identity.`
      };
    }

    return {
      name: "unclear",
      confidence: "low",
      description:
        "Ari does not have enough information to identify the user's current life chapter."
    };
  },

  detectActivePressures({ observation = {}, conflicts = {}, insight = {} } = {}) {
    const pressures = [];
    const patterns = observation.humanPatterns || {};

    if (patterns.competingPriorities) {
      pressures.push({
        name: "competing_priorities",
        confidence: "high",
        description: "Multiple important priorities appear to be competing for attention."
      });
    }

    if (patterns.burnoutRisk) {
      pressures.push({
        name: "burnout_risk",
        confidence: "high",
        description: "The user may be carrying more than their current capacity can support."
      });
    }

    if (patterns.opportunityCost || insight.tradeoff?.name === "chosen_sacrifice") {
      pressures.push({
        name: "opportunity_cost",
        confidence: "medium",
        description: "Choosing one path may require slowing or sacrificing another."
      });
    }

    if (conflicts.primaryConflict?.name) {
      pressures.push({
        name: conflicts.primaryConflict.name,
        confidence: conflicts.primaryConflict.confidence || "medium",
        description: "A primary conflict is active."
      });
    }

    return pressures;
  },

  detectLikelyNeeds({ values = {}, emotionalIntelligence = {}, meaning = {} } = {}) {
    const needs = [];

    if (emotionalIntelligence.rootNeed?.name) {
      needs.push({
        name: emotionalIntelligence.rootNeed.name,
        confidence: "high",
        source: "emotional-intelligence"
      });
    }

    if (values.dominantValue === "family") {
      needs.push({
        name: "protect_family_presence",
        confidence: "medium",
        source: "values"
      });
    }

    if (meaning.theme === "family_transition") {
      needs.push({
        name: "shift_from_achievement_to_presence",
        confidence: "medium",
        source: "meaning"
      });
    }

    return needs;
  },

  detectRecurringPattern({ insight = {}, meaning = {}, observation = {} } = {}) {
    const patternName = insight.pattern?.name;

    if (patternName && patternName !== "unclear") {
      return {
        name: patternName,
        confidence: insight.pattern.confidence || "medium",
        source: "insight-engine"
      };
    }

    if (meaning.theme === "family_transition") {
      return {
        name: "achievement_to_presence_transition",
        confidence: "medium",
        source: "meaning-engine"
      };
    }

    if (observation.humanPatterns?.roleConflict) {
      return {
        name: "too_many_roles_competing",
        confidence: "medium",
        source: "observer"
      };
    }

    return {
      name: "unclear",
      confidence: "low",
      source: "person-model"
    };
  },

  createSnapshot({
    roles = [],
    lifeChapter = {},
    activePressures = [],
    likelyNeeds = [],
    recurringPattern = {}
  } = {}) {
    const primaryRole = roles[0]?.name || "unknown";

    return {
      summary:
        `The user appears to be in a ${lifeChapter.name || "unclear"} chapter, with ${primaryRole} as the strongest active role.`,
      primaryRole,
      lifeChapter: lifeChapter.name || "unclear",
      mainPressure: activePressures[0]?.name || null,
      mainNeed: likelyNeeds[0]?.name || null,
      recurringPattern: recurringPattern.name || null
    };
  }
};