// ari/wisdom-system/ari-wisdom-library.js
// Ari Wisdom Library
// Purpose: Store reusable wisdom principles.
// V1.0

window.Ari = window.Ari || {};

window.Ari.wisdomLibrary = {
  version: "1.0.0",

  principles: [
    {
      id: "presence_before_regret",
      category: "relationships",
      statement:
        "Protect what cannot be replaced before chasing what can return.",
      archetype: "Jesus"
    },

    {
      id: "purpose_survives_delay",
      category: "purpose",
      statement:
        "Purpose is not destroyed by slowing down. It is destroyed by abandoning meaning.",
      archetype: "Frankl"
    },

    {
      id: "control_and_acceptance",
      category: "stoicism",
      statement:
        "Focus energy on what can be influenced. Accept what cannot.",
      archetype: "Epictetus"
    },

    {
      id: "capacity_precedes_growth",
      category: "development",
      statement:
        "Sustainable growth begins with protected capacity.",
      archetype: "Aurelius"
    },

    {
      id: "rest_is_part_of_responsibility",
      category: "recovery",
      statement:
        "Recovery is not the opposite of responsibility. It is part of it.",
      archetype: "Integrated"
    },

    {
      id: "identity_must_evolve",
      category: "identity",
      statement:
        "A healthy identity adapts when life changes chapters.",
      archetype: "Jung"
    },

    {
      id: "love_over_status",
      category: "relationships",
      statement:
        "Love and presence outlast status and achievement.",
      archetype: "Jesus"
    },

    {
      id: "meaning_over_comfort",
      category: "purpose",
      statement:
        "A meaningful burden is easier to carry than a meaningless comfort.",
      archetype: "Frankl"
    }
  ],

  findRelevant({
    theme,
    tension,
    belief,
    role
  } = {}) {

    const matches = [];

    const add = (id) => {
      const item = this.principles.find(p => p.id === id);
      if (item) matches.push(item);
    };

    if (
      tension === "presence_vs_achievement" ||
      tension === "family_vs_purpose"
    ) {
      add("presence_before_regret");
      add("love_over_status");
    }

    if (
      belief === "purpose_must_not_be_abandoned"
    ) {
      add("purpose_survives_delay");
    }

    if (
      theme === "identity_overload"
    ) {
      add("capacity_precedes_growth");
    }

    if (
      role === "provider"
    ) {
      add("rest_is_part_of_responsibility");
    }

    if (
      theme === "career_transition" ||
      theme === "family_transition"
    ) {
      add("identity_must_evolve");
    }

    return matches;
  }
};