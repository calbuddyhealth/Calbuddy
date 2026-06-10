// ari/identity-system/ari-identity-engine.js
// Ari Identity Engine
// Purpose: Understand roles, identity hierarchy, and identity conflict.
// V1.0: Converts observer signals into identity-level meaning.

window.Ari = window.Ari || {};

window.Ari.identityEngine = {
  version: "1.0.0",

  analyze(observation = {}) {
    const life = observation.lifeTransitions || {};
    const patterns = observation.humanPatterns || {};
    const valuesData = observation.valuesAndConflicts || {};
    const roles = patterns.roles || [];
    const values = valuesData.values || [];
    const coreConflicts = valuesData.coreConflicts || [];

    const identities = [];

    const addIdentity = (name, strength, reason) => {
      const existing = identities.find((item) => item.name === name);

      if (existing) {
        existing.strength += strength;
        existing.reasons.push(reason);
        return;
      }

      identities.push({
        name,
        strength,
        reasons: [reason]
      });
    };

    if (life.fatherhood || roles.includes("father")) {
      addIdentity("father", 95, "Fatherhood or child-related transition detected.");
    }

    if (life.motherhood || roles.includes("mother")) {
      addIdentity("mother", 95, "Motherhood or child-related transition detected.");
    }

    if (life.marriage || roles.includes("spouse")) {
      addIdentity("spouse", 85, "Marriage or spouse role detected.");
    }

    if (life.engagement || roles.includes("fiance")) {
      addIdentity("future-spouse", 80, "Engagement or wedding transition detected.");
    }

    if (roles.includes("provider") || values.includes("responsibility")) {
      addIdentity("provider", 85, "Provider or responsibility value detected.");
    }

    if (life.careerTransition || values.includes("growth")) {
      addIdentity("career-builder", 75, "Career growth or transition detected.");
    }

    if (roles.includes("student") || values.includes("growth")) {
      addIdentity("learner", 70, "Student, PMHNP, or growth path detected.");
    }

    if (roles.includes("builder") || values.includes("creation")) {
      addIdentity("builder", 75, "Creation, Ari Rebirth, or founder role detected.");
    }

    if (life.militaryTransition || values.includes("service")) {
      addIdentity("veteran", 70, "Military service or transition detected.");
    }

    if (values.includes("service")) {
      addIdentity("helper", 65, "Service/helping value detected.");
    }

    identities.sort((a, b) => b.strength - a.strength);

    const identityConflicts = [];

    if (
      identities.some((i) => i.name === "father") &&
      identities.some((i) => i.name === "builder")
    ) {
      identityConflicts.push("father_vs_builder");
    }

    if (
      identities.some((i) => i.name === "father") &&
      identities.some((i) => i.name === "provider")
    ) {
      identityConflicts.push("provider_vs_present_parent");
    }

    if (
      identities.some((i) => i.name === "veteran") &&
      identities.some((i) => i.name === "career-builder")
    ) {
      identityConflicts.push("veteran_vs_new_career");
    }

    if (
      identities.some((i) => i.name === "learner") &&
      identities.some((i) => i.name === "builder")
    ) {
      identityConflicts.push("learner_vs_builder");
    }

    const dominantIdentity = identities[0] || null;

    const identityHierarchy = {
      primary: identities[0]?.name || null,
      secondary: identities[1]?.name || null,
      tertiary: identities[2]?.name || null,
      supporting: identities.slice(3).map((item) => item.name)
    };

    const dominantTheme = this.getDominantTheme({
      identities,
      patterns,
      coreConflicts,
      identityConflicts
    });

    return {
      identities,
      identityHierarchy,
      identityConflicts,
      dominantIdentity,
      dominantTheme,
      coreQuestion: this.getCoreQuestion(dominantTheme),
      primaryRisk: this.getPrimaryRisk(dominantTheme),
      source: "ari-identity-engine"
    };
  },

  getDominantTheme({ identities = [], patterns = {}, coreConflicts = [], identityConflicts = [] }) {
    if (
      patterns.lifeTransitionLoad?.level === "extreme" &&
      identityConflicts.length >= 2
    ) {
      return "identity_overload";
    }

    if (coreConflicts.includes("identity_vs_transition")) {
      return "identity_transition";
    }

    if (coreConflicts.includes("ambition_vs_presence")) {
      return "ambition_vs_presence";
    }

    if (identityConflicts.includes("provider_vs_present_parent")) {
      return "provider_presence_conflict";
    }

    if (patterns.roleConflict) {
      return "role_conflict";
    }

    if (identities.length > 0) {
      return "identity_mapping";
    }

    return "identity_unclear";
  },

  getCoreQuestion(theme = "") {
    const questions = {
      identity_overload:
        "Which identity needs to become primary during this season of life?",
      identity_transition:
        "Who is this person becoming after leaving an old identity behind?",
      ambition_vs_presence:
        "How should ambition be balanced against presence with loved ones?",
      provider_presence_conflict:
        "Does providing more require sacrificing presence, and is that tradeoff worth it?",
      role_conflict:
        "Which role has the strongest claim on attention right now?",
      identity_mapping:
        "Which identity is most active in this situation?",
      identity_unclear:
        "What identity signal is missing or unclear?"
    };

    return questions[theme] || questions.identity_unclear;
  },

  getPrimaryRisk(theme = "") {
    const risks = {
      identity_overload:
        "Trying to fully maintain every identity at once may create burnout or fractured focus.",
      identity_transition:
        "Clinging to an old identity may make the next chapter harder to enter.",
      ambition_vs_presence:
        "Pursuing achievement may unintentionally cost irreplaceable presence.",
      provider_presence_conflict:
        "The person may confuse providing materially with being present relationally.",
      role_conflict:
        "Competing roles may dilute attention and increase guilt.",
      identity_mapping:
        "Identity signals are present but not yet prioritized.",
      identity_unclear:
        "Ari lacks enough identity context to infer the deeper conflict."
    };

    return risks[theme] || risks.identity_unclear;
  }
};