// ari/value-system/ari-value-engine.js
// Ari Value Engine
// Purpose: Detect values driving decisions and conflicts.
// V1.0

window.Ari = window.Ari || {};

window.Ari.valueEngine = {
  version: "1.0.0",

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  analyze(observation = {}) {
    const text = observation.normalizedMessage || "";

    const valueScores = {
      family: 0,
      service: 0,
      growth: 0,
      purpose: 0,
      responsibility: 0,
      creation: 0,
      achievement: 0,
      security: 0,
      stability: 0,
      freedom: 0,
      wealth: 0,
      belonging: 0,
      love: 0,
      health: 0,
      curiosity: 0,
      legacy: 0
    };

    const add = (value, points) => {
      valueScores[value] += points;
    };

    // FAMILY

    if (
      this.containsAny(text, [
        "daughter",
        "son",
        "child",
        "father",
        "mother",
        "wife",
        "husband",
        "family",
        "baby"
      ])
    ) {
      add("family", 25);
      add("love", 15);
    }

    // SERVICE

    if (
      this.containsAny(text, [
        "help people",
        "service",
        "nurse",
        "pmhnp",
        "military",
        "navy",
        "care for"
      ])
    ) {
      add("service", 20);
    }

    // GROWTH

    if (
      this.containsAny(text, [
        "pmhnp",
        "school",
        "education",
        "become",
        "grow",
        "improve",
        "learn"
      ])
    ) {
      add("growth", 20);
    }

    // PURPOSE

    if (
      this.containsAny(text, [
        "purpose",
        "meaning",
        "important",
        "matters most",
        "calling",
        "help people someday"
      ])
    ) {
      add("purpose", 20);
    }

    // CREATION

    if (
      this.containsAny(text, [
        "build",
        "building",
        "ari rebirth",
        "founder",
        "create",
        "project"
      ])
    ) {
      add("creation", 20);
    }

    // RESPONSIBILITY

    if (
      this.containsAny(text, [
        "responsible",
        "provide",
        "provider",
        "protect",
        "duty"
      ])
    ) {
      add("responsibility", 20);
    }

    // ACHIEVEMENT

    if (
      this.containsAny(text, [
        "promotion",
        "achievement",
        "success",
        "career",
        "advance"
      ])
    ) {
      add("achievement", 20);
    }

    // SECURITY

    if (
      this.containsAny(text, [
        "income",
        "money",
        "financial",
        "security",
        "stable income"
      ])
    ) {
      add("security", 15);
      add("wealth", 15);
    }

    // STABILITY

    if (
      this.containsAny(text, [
        "stability",
        "safe",
        "secure",
        "consistency"
      ])
    ) {
      add("stability", 15);
    }

    // FREEDOM

    if (
      this.containsAny(text, [
        "freedom",
        "independence",
        "my own path"
      ])
    ) {
      add("freedom", 15);
    }

    // HEALTH

    if (
      this.containsAny(text, [
        "fitness",
        "exercise",
        "nutrition",
        "weight",
        "health"
      ])
    ) {
      add("health", 15);
    }

    // CURIOSITY

    if (
      this.containsAny(text, [
        "explore",
        "wonder",
        "curious",
        "what if"
      ])
    ) {
      add("curiosity", 15);
    }

    // LEGACY

    if (
      this.containsAny(text, [
        "legacy",
        "leave behind",
        "impact",
        "future generations",
        "help thousands"
      ])
    ) {
      add("legacy", 20);
    }

    const rankedValues = Object.entries(valueScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([value, score]) => ({
        value,
        score
      }));

    const dominantValue = rankedValues[0]?.value || null;

    const valueConflicts = [];

    if (
      valueScores.family > 0 &&
      valueScores.achievement > 0
    ) {
      valueConflicts.push("family_vs_achievement");
    }

    if (
      valueScores.family > 0 &&
      valueScores.creation > 0
    ) {
      valueConflicts.push("family_vs_creation");
    }

    if (
      valueScores.service > 0 &&
      valueScores.family > 0
    ) {
      valueConflicts.push("service_vs_family");
    }

    if (
      valueScores.growth > 0 &&
      valueScores.stability > 0
    ) {
      valueConflicts.push("growth_vs_stability");
    }

    if (
      valueScores.purpose > 0 &&
      valueScores.security > 0
    ) {
      valueConflicts.push("purpose_vs_security");
    }

    return {
      values: rankedValues.map(v => v.value),
      rankedValues,
      dominantValue,
      valueConflicts,
      source: "ari-value-engine"
    };
  }
};