// ari/emotion-system/ari-underlying-emotion-engine.js
// Ari Underlying Emotion Engine
// Purpose: Detect the deeper emotional source beneath surface emotion, need, belief, and pattern.
// V1.0

window.Ari = window.Ari || {};

window.Ari.underlyingEmotionEngine = {
  version: "1.0.0",

  analyze({
    observation = {},
    emotion = {},
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    wisdom = {}
  } = {}) {
    const candidates = [];

    this.addIdentityThreatCandidates({
      candidates,
      observation,
      insight,
      personModel,
      beliefModel,
      wisdom
    });

    this.addResponsibilityCandidates({
      candidates,
      emotionalIntelligence,
      insight,
      personModel,
      beliefModel
    });

    this.addFamilyPresenceCandidates({
      candidates,
      emotionalIntelligence,
      insight,
      meaning,
      personModel,
      simulation,
      wisdom
    });

    this.addPurposeCandidates({
      candidates,
      insight,
      beliefModel,
      personModel,
      wisdom
    });

    this.addCapacityCandidates({
      candidates,
      emotionalIntelligence,
      insight,
      meaning,
      wisdom
    });

    const primary = this.choosePrimary(candidates);

    return {
      primaryUnderlyingEmotion: primary,
      candidates,
      emotionalSource: primary?.emotionalSource || null,
      protectiveStrategy: primary?.protectiveStrategy || null,
      hiddenFear: primary?.hiddenFear || null,
      vulnerableTruth: primary?.vulnerableTruth || null,
      confidence: primary?.confidence || "low",
      source: "ari-underlying-emotion-engine"
    };
  },

  addCandidate(candidates = [], candidate = {}) {
    if (!candidate.name) return;

    candidates.push({
      name: candidate.name,
      confidence: candidate.confidence || "low",
      emotionalSource: candidate.emotionalSource || null,
      protectiveStrategy: candidate.protectiveStrategy || null,
      hiddenFear: candidate.hiddenFear || null,
      vulnerableTruth: candidate.vulnerableTruth || null,
      evidence: candidate.evidence || []
    });
  },

  addIdentityThreatCandidates({
    candidates = [],
    insight = {},
    personModel = {},
    beliefModel = {},
    wisdom = {}
  } = {}) {
    const role = personModel.snapshot?.primaryRole;
    const belief = beliefModel.primaryBelief?.name;
    const pattern = insight.pattern?.name;

    if (
      role === "builder" ||
      belief === "purpose_must_not_be_abandoned" ||
      pattern === "achievement_before_presence"
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_losing_identity",
        confidence: "medium",
        emotionalSource: "identity_threat",
        protectiveStrategy: "keep_building_or_achieving",
        hiddenFear:
          "If I slow down, I may lose the part of me that feels purposeful.",
        vulnerableTruth:
          "Purpose may need to change rhythm without disappearing.",
        evidence: [
          "builder role or purpose-protection belief detected",
          "achievement or purpose pattern detected"
        ]
      });
    }
  },

  addResponsibilityCandidates({
    candidates = [],
    emotionalIntelligence = {},
    insight = {},
    personModel = {},
    beliefModel = {}
  } = {}) {
    const role = personModel.snapshot?.primaryRole;
    const belief = beliefModel.primaryBelief?.name;
    const pattern = insight.pattern?.name;
    const protecting = emotionalIntelligence.protecting?.name;

    if (
      role === "provider" ||
      belief === "responsibility_comes_before_rest" ||
      pattern === "responsibility_before_recovery"
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_being_irresponsible",
        confidence: "medium",
        emotionalSource: "responsibility_threat",
        protectiveStrategy: "carry_more_than_capacity_allows",
        hiddenFear:
          "If I rest or set something down, I may be failing the people who depend on me.",
        vulnerableTruth:
          "Rest may be part of responsibility, not a betrayal of it.",
        evidence: [
          "provider role or responsibility belief detected",
          "responsibility-before-recovery pattern detected"
        ]
      });
    }

    if (protecting === "family") {
      this.addCandidate(candidates, {
        name: "fear_of_failing_family",
        confidence: "medium",
        emotionalSource: "family_security_threat",
        protectiveStrategy: "over-function_for_family",
        hiddenFear:
          "If I do not stay strong, the people I love may not be protected.",
        vulnerableTruth:
          "Being present and regulated may protect family more than carrying everything alone.",
        evidence: ["family protection detected"]
      });
    }
  },

  addFamilyPresenceCandidates({
    candidates = [],
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    simulation = {},
    wisdom = {}
  } = {}) {
    const need = emotionalIntelligence.rootNeed?.name;
    const tradeoff = insight.tradeoff?.name;
    const lifeChapter = personModel.lifeChapter?.name;
    const simTheme = simulation.primarySimulation?.theme;
    const highestGood = wisdom.highestGood;

    if (
      need === "secure_family_presence" ||
      tradeoff === "presence_vs_acceleration" ||
      simTheme === "presence_vs_acceleration" ||
      lifeChapter === "family_transition" ||
      highestGood === "protect_family"
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_missing_irreplaceable_moments",
        confidence: "high",
        emotionalSource: "time_sensitivity",
        protectiveStrategy: "question_acceleration",
        hiddenFear:
          "If I keep accelerating, I may miss moments I cannot get back.",
        vulnerableTruth:
          "Presence may matter before everything feels finished.",
        evidence: [
          "family presence need detected",
          "presence versus acceleration tradeoff detected",
          "family transition or protect-family wisdom detected"
        ]
      });
    }
  },

  addPurposeCandidates({
    candidates = [],
    insight = {},
    beliefModel = {},
    personModel = {},
    wisdom = {}
  } = {}) {
    const hiddenConflict = insight.hiddenConflict?.name;
    const hiddenMotive = insight.hiddenMotive?.name;
    const belief = beliefModel.primaryBelief?.name;
    const longTermPriority = wisdom.longTermPriority;

    if (
      hiddenConflict === "family_vs_purpose" ||
      hiddenMotive === "protecting_purpose" ||
      belief === "purpose_must_not_be_abandoned" ||
      longTermPriority === "sustainable_purpose"
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_betraying_purpose",
        confidence: "high",
        emotionalSource: "purpose_threat",
        protectiveStrategy: "resist_slowing_down",
        hiddenFear:
          "If I slow down, I may be betraying the future I feel called to build.",
        vulnerableTruth:
          "Purpose can survive a slower season if it stays connected to meaning.",
        evidence: [
          "family versus purpose conflict detected",
          "purpose-protection motive or belief detected"
        ]
      });
    }
  },

  addCapacityCandidates({
    candidates = [],
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    wisdom = {}
  } = {}) {
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const theme = meaning.theme;
    const pattern = insight.pattern?.name;
    const highestGood = wisdom.highestGood;

    if (
      rootNeed === "recovery_and_capacity" ||
      theme === "identity_overload" ||
      pattern === "too_many_primary_roles" ||
      highestGood === "protect_capacity"
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_collapse_if_capacity_is_ignored",
        confidence: "medium",
        emotionalSource: "capacity_threat",
        protectiveStrategy: "reduce_load_or_seek_control",
        hiddenFear:
          "If I keep adding more, I may not be able to carry what already matters.",
        vulnerableTruth:
          "Protecting capacity may be the most responsible move.",
        evidence: [
          "capacity need or identity overload detected",
          "too-many-primary-roles pattern detected"
        ]
      });
    }
  },

  choosePrimary(candidates = []) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return {
        name: "unclear",
        confidence: "low",
        emotionalSource: null,
        protectiveStrategy: null,
        hiddenFear: null,
        vulnerableTruth: null,
        evidence: []
      };
    }

    const score = {
      high: 3,
      medium: 2,
      low: 1
    };

    return [...candidates].sort((a, b) => {
      return (score[b.confidence] || 0) - (score[a.confidence] || 0);
    })[0];
  }
};