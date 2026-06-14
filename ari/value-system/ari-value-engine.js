// ari/value-system/ari-value-engine.js
// Ari Value Engine
// Purpose: Detect values driving decisions and conflicts.
// V1.1
// Fixes:
// - Adds Universal Domain Governor awareness.
// - Prevents value detection from hijacking direct teaching/building/body/safety requests.
// - Keeps value detection active for relationship, identity, meaning, wisdom, planning, and life-transition domains.

window.Ari = window.Ari || {};

window.Ari.valueEngine = {
  version: "1.1.0",

  containsAny(text, phrases = []) {
    return phrases.some((phrase) => text.includes(phrase));
  },

  analyze(observation = {}) {
    const text = String(observation.normalizedMessage || "").toLowerCase();

    const domainLead = observation.domainLead || null;
    const domainMode = observation.domainMode || null;
    const domainPermissions = observation.domainPermissions || {};

    const directTeachingActive =
      domainLead === "knowledge_teaching_domain" ||
      domainMode === "teach_clearly" ||
      domainPermissions.teaching === true && domainPermissions.wisdom !== true;

    const directBuildActive =
      domainLead === "creative_building_domain" ||
      domainMode === "build_or_debug";

    const safetyOrBodyActive =
      domainLead === "critical_safety_domain" ||
      domainLead === "medical_body_domain" ||
      domainLead === "sleep_recovery_domain" ||
      domainMode === "safety_override" ||
      domainMode === "medical_or_body_first" ||
      domainMode === "stabilize_body_first";

    const valuesAllowed =
      domainPermissions.wisdom === true ||
      domainPermissions.lifeChapter === true ||
      domainPermissions.identity === true ||
      domainPermissions.relationship === true ||
      domainPermissions.planning === true ||
      domainPermissions.meaningProjection === true;

    if (
      (directTeachingActive || directBuildActive || safetyOrBodyActive) &&
      !valuesAllowed
    ) {
      return {
        values: [],
        rankedValues: [],
        dominantValue: null,
        valueConflicts: [],
        valueEngineSuppressed: true,
        valueEngineSuppressionReason:
          "Direct teaching/building/safety/body domain is active, so value interpretation should not lead.",
        source: "ari-value-engine"
      };
    }

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
      legacy: 0,
      wisdom: 0,
      dignity: 0,
      truth: 0,
      peace: 0
    };

    const add = (value, points) => {
      if (!valueScores[value]) valueScores[value] = 0;
      valueScores[value] += points;
    };

    if (this.containsAny(text, ["daughter", "son", "child", "father", "mother", "wife", "husband", "family", "baby"])) {
      add("family", 25);
      add("love", 15);
    }

    if (this.containsAny(text, ["help people", "service", "nurse", "pmhnp", "military", "navy", "care for"])) {
      add("service", 20);
    }

    if (this.containsAny(text, ["pmhnp", "school", "education", "become", "grow", "improve", "learn"])) {
      add("growth", 20);
    }

    if (this.containsAny(text, ["purpose", "meaning", "important", "matters most", "calling", "help people someday"])) {
      add("purpose", 20);
    }

    if (this.containsAny(text, ["build", "building", "ari rebirth", "founder", "create", "project"])) {
      add("creation", 20);
    }

    if (this.containsAny(text, ["responsible", "provide", "provider", "protect", "duty"])) {
      add("responsibility", 20);
    }

    if (this.containsAny(text, ["promotion", "achievement", "success", "career", "advance"])) {
      add("achievement", 20);
    }

    if (this.containsAny(text, ["income", "money", "financial", "security", "stable income"])) {
      add("security", 15);
      add("wealth", 15);
    }

    if (this.containsAny(text, ["stability", "safe", "secure", "consistency"])) {
      add("stability", 15);
    }

    if (this.containsAny(text, ["freedom", "independence", "my own path"])) {
      add("freedom", 15);
    }

    if (this.containsAny(text, ["fitness", "exercise", "nutrition", "weight", "health"])) {
      add("health", 15);
    }

    if (this.containsAny(text, ["explore", "wonder", "curious", "what if"])) {
      add("curiosity", 15);
    }

    if (this.containsAny(text, ["legacy", "leave behind", "impact", "future generations", "help thousands"])) {
      add("legacy", 20);
    }

    if (this.containsAny(text, ["wise", "wisdom", "right thing", "wrong thing", "tradeoff", "what matters most", "priority", "prioritize"])) {
      add("wisdom", 20);
    }

    if (this.containsAny(text, ["truth", "honest", "honesty", "real", "reality"])) {
      add("truth", 15);
    }

    if (this.containsAny(text, ["peace", "calm", "less harm", "non harm", "non-harm"])) {
      add("peace", 15);
    }

    if (this.containsAny(text, ["respect", "dignity", "self respect", "self-respect", "worth"])) {
      add("dignity", 15);
    }

    const rankedValues = Object.entries(valueScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([value, score]) => ({ value, score }));

    const dominantValue = rankedValues[0]?.value || null;

    const valueConflicts = [];

    if (valueScores.family > 0 && valueScores.achievement > 0) {
      valueConflicts.push("family_vs_achievement");
    }

    if (valueScores.family > 0 && valueScores.creation > 0) {
      valueConflicts.push("family_vs_creation");
    }

    if (valueScores.service > 0 && valueScores.family > 0) {
      valueConflicts.push("service_vs_family");
    }

    if (valueScores.growth > 0 && valueScores.stability > 0) {
      valueConflicts.push("growth_vs_stability");
    }

    if (valueScores.purpose > 0 && valueScores.security > 0) {
      valueConflicts.push("purpose_vs_security");
    }

    if (valueScores.truth > 0 && valueScores.peace > 0) {
      valueConflicts.push("truth_vs_peace");
    }

    if (valueScores.freedom > 0 && valueScores.responsibility > 0) {
      valueConflicts.push("freedom_vs_responsibility");
    }

    if (valueScores.love > 0 && valueScores.security > 0) {
      valueConflicts.push("safety_vs_love");
    }

    return {
      values: rankedValues.map(v => v.value),
      rankedValues,
      dominantValue,
      valueConflicts,
      valueEngineSuppressed: false,
      source: "ari-value-engine"
    };
  }
};