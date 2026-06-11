// ari/nervous-system/ari-life-signal-weighting.js
// Ari Life Signal Weighting
// Purpose: Rank life signals by human importance, not just detection strength.
// V1.0

window.Ari = window.Ari || {};

window.Ari.lifeSignalWeighting = {
  version: "1.0.0",

  weight({
    lifeSignals = {},
    identity = {},
    conflicts = {},
    insight = {},
    wisdom = {},
    regret = {},
    underlyingEmotion = {}
  } = {}) {
    const signalNames = lifeSignals.signalNames || [];
    const weightedSignals = signalNames.map((name) => {
      return this.weightSignal({
        name,
        identity,
        conflicts,
        insight,
        wisdom,
        regret,
        underlyingEmotion
      });
    });

    const rankedLifeSignals = this.rank(weightedSignals);
    const primaryWeightedLifeSignal = rankedLifeSignals[0] || null;

    return {
      weightedSignals,
      rankedLifeSignals,
      primaryWeightedLifeSignal,
      primaryWeightedLifeSignalName:
        primaryWeightedLifeSignal?.name || null,
      primaryWeightedLifeSignalWeight:
        primaryWeightedLifeSignal?.weight || 0,
      lifePriorityClass:
        this.getLifePriorityClass(primaryWeightedLifeSignal),
      source: "ari-life-signal-weighting"
    };
  },

  weightSignal({
    name = "",
    identity = {},
    conflicts = {},
    insight = {},
    wisdom = {},
    regret = {},
    underlyingEmotion = {}
  } = {}) {
    let weight = this.baseWeight(name);
    const reasons = [`base:${weight}`];

    const dominantIdentity = identity.dominantIdentity?.name;
    const conflictName = conflicts.primaryConflict?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const wisdomTension = wisdom.wisdomTension?.name;
    const regretType = regret.regretType;
    const underlying = underlyingEmotion.primaryUnderlyingEmotion?.name;

    // Identity alignment bonus
    if (
      name === "fatherhood_transition" &&
      dominantIdentity === "father"
    ) {
      weight += 10;
      reasons.push("identity_alignment:father");
    }

    if (
      name === "creative_mission" &&
      dominantIdentity === "builder"
    ) {
      weight += 6;
      reasons.push("identity_alignment:builder");
    }

    if (
      name === "military_transition" &&
      dominantIdentity === "service_member"
    ) {
      weight += 6;
      reasons.push("identity_alignment:service_member");
    }

    // Conflict relevance bonus
    if (
      ["family_transition", "fatherhood_transition"].includes(name) &&
      [
        "provider_vs_presence",
        "family_vs_purpose",
        "identity_vs_transition"
      ].includes(hiddenConflict || conflictName)
    ) {
      weight += 12;
      reasons.push("conflict_relevance:family_or_fatherhood");
    }

    if (
      ["creative_mission", "purpose_signal"].includes(name) &&
      ["family_vs_purpose", "purpose_abandonment_fear"].includes(
        hiddenConflict || conflictName
      )
    ) {
      weight += 8;
      reasons.push("conflict_relevance:purpose");
    }

    // Wisdom tension bonus
    if (
      ["family_transition", "fatherhood_transition"].includes(name) &&
      ["presence_vs_achievement", "family_vs_purpose"].includes(wisdomTension)
    ) {
      weight += 14;
      reasons.push("wisdom_tension_relevance:family");
    }

    if (
      ["creative_mission", "purpose_signal"].includes(name) &&
      wisdomTension === "family_vs_purpose"
    ) {
      weight += 8;
      reasons.push("wisdom_tension_relevance:purpose");
    }

    // Regret relevance bonus
    if (
      ["family_transition", "fatherhood_transition"].includes(name) &&
      regretType === "missing_irreplaceable_presence"
    ) {
      weight += 15;
      reasons.push("regret_relevance:irreplaceable_presence");
    }

    if (
      ["creative_mission", "purpose_signal"].includes(name) &&
      regretType === "turning_purpose_against_love"
    ) {
      weight += 10;
      reasons.push("regret_relevance:purpose_against_love");
    }

    // Underlying emotion bonus
    if (
      ["creative_mission", "purpose_signal"].includes(name) &&
      underlying === "fear_of_betraying_purpose"
    ) {
      weight += 10;
      reasons.push("emotion_relevance:purpose_threat");
    }

    if (
      ["family_transition", "fatherhood_transition"].includes(name) &&
      underlying === "fear_of_missing_irreplaceable_moments"
    ) {
      weight += 12;
      reasons.push("emotion_relevance:irreplaceable_moments");
    }

    // Major life transition stacking bonus
    if (
      name === "fatherhood_transition" &&
      (lifeSignalsHasFamilyCompanion(name) || true)
    ) {
      // intentionally small universal fatherhood boost
      weight += 5;
      reasons.push("major_life_transition_boost");
    }

    return {
      name,
      weight,
      baseWeight: this.baseWeight(name),
      reasons
    };
  },

  baseWeight(name = "") {
    const map = {
      fatherhood_transition: 100,
      family_transition: 96,
      marriage_transition: 94,
      pregnancy_transition: 94,
      grief_or_loss: 100,
      health_crisis: 100,
      safety_risk: 100,

      military_transition: 88,
      identity_transition: 86,
      career_transition: 78,

      purpose_signal: 74,
      creative_mission: 70,
      capacity_pressure: 82,
      achievement_pressure: 68,
      emotional_threat: 76
    };

    return map[name] || 50;
  },

  rank(weightedSignals = []) {
    return [...weightedSignals].sort((a, b) => {
      return (b.weight || 0) - (a.weight || 0);
    });
  },

  getLifePriorityClass(signal = null) {
    if (!signal) return "none";

    if (signal.weight >= 100) return "major_life_priority";
    if (signal.weight >= 85) return "high_life_priority";
    if (signal.weight >= 70) return "medium_life_priority";

    return "low_life_priority";
  }
};

// Small helper kept outside the object to avoid accidental this-binding issues.
function lifeSignalsHasFamilyCompanion() {
  return true;
}