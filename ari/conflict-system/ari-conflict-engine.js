// ari/conflict-system/ari-conflict-engine.js
// Ari Conflict Engine
// Purpose: Identify what values, roles, and identities are competing.
// V1.1
// Fixes object-based conflict names causing .includes() crashes.

window.Ari = window.Ari || {};

window.Ari.conflictEngine = {
  version: "1.1.0",

  analyze({ observation = {}, values = {}, identity = {} } = {}) {
    const patterns = observation.humanPatterns || {};
    const observedConflicts = observation.valuesAndConflicts || {};
    const valueConflicts = values.valueConflicts || [];
    const identityConflicts = identity.identityConflicts || [];
    const coreConflicts = observedConflicts.coreConflicts || [];

    const conflicts = [];

    const normalizeName = (item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return String(item.name || item.id || "unknown_conflict");
      }
      return "unknown_conflict";
    };

    const addConflict = (name, intensity, category, reason) => {
      const normalizedName = normalizeName(name);

      const existing = conflicts.find(
        (item) => item.name === normalizedName
      );

      if (existing) {
        existing.score += intensity;
        existing.reasons.push(reason);
        return;
      }

      conflicts.push({
        name: normalizedName,
        score: intensity,
        category,
        reasons: [reason]
      });
    };

    coreConflicts.forEach((conflict) => {
      addConflict(
        conflict,
        25,
        "core",
        "Observer detected a hidden core conflict."
      );
    });

    valueConflicts.forEach((conflict) => {
      addConflict(
        conflict,
        20,
        "values",
        "Value Engine detected competing values."
      );
    });

    identityConflicts.forEach((conflict) => {
      addConflict(
        conflict,
        20,
        "identity",
        "Identity Engine detected competing identities."
      );
    });

    if (patterns.roleConflict) {
      addConflict(
        "role_conflict",
        15,
        "roles",
        "User appears to be carrying competing roles."
      );
    }

    if (patterns.competingPriorities) {
      addConflict(
        "competing_priorities",
        15,
        "priorities",
        "User is trying to compare or prioritize multiple important demands."
      );
    }

    if (patterns.opportunityCost) {
      addConflict(
        "opportunity_cost",
        15,
        "tradeoff",
        "User is facing a situation where choosing one path likely costs another."
      );
    }

    if (patterns.futureRegretRisk) {
      addConflict(
        "future_regret_risk",
        15,
        "future",
        "User is worried about future regret."
      );
    }

    if (patterns.burnoutRisk) {
      addConflict(
        "burnout_risk",
        15,
        "capacity",
        "User may be approaching or describing overload."
      );
    }

    conflicts.sort((a, b) => b.score - a.score);

    const primaryConflict = conflicts[0] || null;

    const competingFor = this.getCompetingResources(conflicts, patterns);
    const conflictIntensity = this.getIntensity(conflicts);

    const needsExecutiveFunction =
      conflictIntensity === "high" ||
      conflictIntensity === "critical";

    return {
      conflicts,
      primaryConflict,
      conflictIntensity,
      competingFor,
      likelyCost: this.getLikelyCost(primaryConflict, patterns),
      needsExecutiveFunction,
      source: "ari-conflict-engine"
    };
  },

  getIntensity(conflicts = []) {
    const totalScore = conflicts.reduce(
      (sum, item) => sum + item.score,
      0
    );

    if (totalScore >= 90) return "critical";
    if (totalScore >= 60) return "high";
    if (totalScore >= 30) return "moderate";
    if (totalScore > 0) return "low";

    return "none";
  },

  getCompetingResources(conflicts = [], patterns = {}) {
    const resources = new Set();

    if (patterns.competingPriorities || patterns.roleConflict) {
      resources.add("attention");
      resources.add("time");
      resources.add("energy");
    }

    if (patterns.opportunityCost) {
      resources.add("opportunity");
      resources.add("future options");
    }

    if (patterns.futureRegretRisk) {
      resources.add("future peace");
      resources.add("presence");
    }

    if (patterns.burnoutRisk) {
      resources.add("capacity");
      resources.add("recovery");
    }

    const conflictNames = conflicts.map(
      (item) => String(item?.name || "")
    );

    if (conflictNames.some((name) => name.includes("family"))) {
      resources.add("family presence");
    }

    if (conflictNames.some((name) => name.includes("achievement"))) {
      resources.add("achievement");
    }

    if (conflictNames.some((name) => name.includes("creation"))) {
      resources.add("creative purpose");
    }

    return [...resources];
  },

  getLikelyCost(primaryConflict = null, patterns = {}) {
    if (!primaryConflict) {
      return "No major conflict detected.";
    }

    switch (primaryConflict.name) {
      case "family_vs_creation":
        return "Over-prioritizing creation may cost family presence; over-prioritizing family may slow the creative mission.";

      case "family_vs_achievement":
        return "Over-prioritizing achievement may cost family presence; over-prioritizing family may slow career advancement.";

      case "provider_vs_present_parent":
        return "The person may confuse providing materially with being present relationally.";

      case "ambition_vs_presence":
        return "Ambition may create future opportunity, but presence may protect irreplaceable moments.";

      case "identity_vs_transition":
        return "Clinging to an old identity may make the next chapter harder to enter.";

      default:
        break;
    }

    if (patterns.burnoutRisk) {
      return "Trying to maximize all priorities at once may create burnout, guilt, or reduced performance across every role.";
    }

    return "Competing priorities may dilute focus and increase regret risk.";
  }
};