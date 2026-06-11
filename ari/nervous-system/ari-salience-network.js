// ari/nervous-system/ari-salience-network.js
// Ari Salience Network
// Purpose: Decide what matters most right now by combining life priority, signal strength, emotion, wisdom, regret, and consequence.
// V1.0

window.Ari = window.Ari || {};

window.Ari.salienceNetwork = {
  version: "1.0.0",

  evaluate({
    lifeSignalWeighting = {},
    signals = {},
    lifeSignals = {},
    identity = {},
    conflicts = {},
    insight = {},
    emotionalIntelligence = {},
    underlyingEmotion = {},
    wisdom = {},
    wisdomResolution = {},
    regret = {},
    longTermConsequence = {},
    executive = {}
  } = {}) {
    const candidates = [];

    this.addLifePriorityCandidates(candidates, lifeSignalWeighting);
    this.addNervousSignalCandidates(candidates, signals);
    this.addIdentityCandidates(candidates, identity);
    this.addConflictCandidates(candidates, conflicts, insight);
    this.addEmotionCandidates(candidates, emotionalIntelligence, underlyingEmotion);
    this.addWisdomCandidates(candidates, wisdom, wisdomResolution);
    this.addRegretCandidates(candidates, regret, longTermConsequence);
    this.addExecutiveCandidates(candidates, executive);

    const rankedSalience = this.rank(candidates);
    const primary = rankedSalience[0] || null;

    return {
      candidates,
      rankedSalience,
      primarySalience: primary,
      primarySalienceName: primary?.name || null,
      primarySalienceCategory: primary?.category || null,
      primarySalienceStrength: primary?.strength || 0,
      primarySalienceReason: primary?.reason || null,
      recommendedLead: this.recommendLead(primary),
      recommendedMode: this.recommendMode(primary, rankedSalience),
      shouldOverrideLanguage: this.shouldOverrideLanguage(primary),
      source: "ari-salience-network"
    };
  },

  addCandidate(candidates = [], {
    name,
    category = "general",
    strength = 0,
    reason = "",
    evidence = []
  } = {}) {
    if (!name) return;

    const existing = candidates.find(
      (item) => item.name === name && item.category === category
    );

    if (existing) {
      existing.strength = Math.max(existing.strength, strength);
      existing.evidence = [...new Set([
        ...(existing.evidence || []),
        ...(evidence || [])
      ])];
      if (reason && !existing.reason.includes(reason)) {
        existing.reason = `${existing.reason} ${reason}`.trim();
      }
      return;
    }

    candidates.push({
      name,
      category,
      strength,
      reason,
      evidence
    });
  },

  addLifePriorityCandidates(candidates = [], lifeSignalWeighting = {}) {
    const primary = lifeSignalWeighting.primaryWeightedLifeSignal;

    if (!primary) return;

    this.addCandidate(candidates, {
      name: primary.name,
      category: "life_priority",
      strength: primary.weight,
      reason: `Life signal '${primary.name}' has weighted priority ${primary.weight}.`,
      evidence: primary.reasons || []
    });
  },

  addNervousSignalCandidates(candidates = [], signals = {}) {
    const strongest = signals.strongestSignal;

    if (!strongest) return;

    this.addCandidate(candidates, {
      name: strongest.name,
      category: `signal:${strongest.category}`,
      strength: strongest.strength,
      reason: `Strongest nervous signal is '${strongest.name}'.`,
      evidence: strongest.evidence || []
    });
  },

  addIdentityCandidates(candidates = [], identity = {}) {
    const dominant = identity.dominantIdentity?.name;

    if (!dominant) return;

    this.addCandidate(candidates, {
      name: dominant,
      category: "identity",
      strength:
        identity.dominantIdentity?.confidence === "high" ? 82 : 72,
      reason: `Dominant identity detected: ${dominant}.`,
      evidence: ["dominant_identity"]
    });
  },

  addConflictCandidates(candidates = [], conflicts = {}, insight = {}) {
    const conflict = conflicts.primaryConflict?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const tradeoff = insight.tradeoff?.name;

    if (conflict) {
      this.addCandidate(candidates, {
        name: conflict,
        category: "conflict",
        strength:
          conflicts.conflictIntensity === "critical"
            ? 92
            : conflicts.conflictIntensity === "high"
            ? 86
            : 76,
        reason: `Primary conflict detected: ${conflict}.`,
        evidence: ["primary_conflict"]
      });
    }

    if (hiddenConflict && hiddenConflict !== "unclear") {
      this.addCandidate(candidates, {
        name: hiddenConflict,
        category: "hidden_conflict",
        strength:
          insight.hiddenConflict?.confidence === "high" ? 88 : 78,
        reason: `Hidden conflict detected: ${hiddenConflict}.`,
        evidence: insight.hiddenConflict?.evidence || ["hidden_conflict"]
      });
    }

    if (tradeoff && tradeoff !== "none_detected") {
      this.addCandidate(candidates, {
        name: tradeoff,
        category: "tradeoff",
        strength: insight.tradeoff?.confidence === "high" ? 86 : 76,
        reason: `Tradeoff detected: ${tradeoff}.`,
        evidence: insight.tradeoff?.evidence || ["tradeoff"]
      });
    }
  },

  addEmotionCandidates(
    candidates = [],
    emotionalIntelligence = {},
    underlyingEmotion = {}
  ) {
    const depth = underlyingEmotion.primaryUnderlyingEmotion?.name;
    const depthConfidence =
      underlyingEmotion.primaryUnderlyingEmotion?.confidence;

    if (depth && depth !== "unclear") {
      this.addCandidate(candidates, {
        name: depth,
        category: "underlying_emotion",
        strength: depthConfidence === "high" ? 90 : 78,
        reason: `Underlying emotion detected: ${depth}.`,
        evidence: underlyingEmotion.primaryUnderlyingEmotion?.evidence || [
          "underlying_emotion"
        ]
      });
    }

    const rootNeed = emotionalIntelligence.rootNeed?.name;
    if (rootNeed) {
      this.addCandidate(candidates, {
        name: rootNeed,
        category: "root_need",
        strength: 74,
        reason: `Root need detected: ${rootNeed}.`,
        evidence: ["root_need"]
      });
    }
  },

  addWisdomCandidates(candidates = [], wisdom = {}, wisdomResolution = {}) {
    const tension = wisdom.wisdomTension?.name;
    const highestGood = wisdom.highestGood;
    const leadingGood = wisdomResolution.leadingGood;

    if (tension && tension !== "unclear") {
      this.addCandidate(candidates, {
        name: tension,
        category: "wisdom_tension",
        strength: wisdom.confidence === "high" ? 88 : 76,
        reason: `Wisdom tension detected: ${tension}.`,
        evidence: ["wisdom_tension"]
      });
    }

    if (highestGood) {
      this.addCandidate(candidates, {
        name: highestGood,
        category: "highest_good",
        strength: wisdom.confidence === "high" ? 86 : 74,
        reason: `Highest good detected: ${highestGood}.`,
        evidence: ["highest_good"]
      });
    }

    if (leadingGood) {
      this.addCandidate(candidates, {
        name: leadingGood,
        category: "leading_good",
        strength: wisdomResolution.confidence === "high" ? 84 : 72,
        reason: `Wisdom resolution says '${leadingGood}' should lead.`,
        evidence: ["wisdom_resolution"]
      });
    }
  },

  addRegretCandidates(candidates = [], regret = {}, longTermConsequence = {}) {
    if (regret.regretType && regret.regretType !== "unclear_regret") {
      this.addCandidate(candidates, {
        name: regret.regretType,
        category: "regret",
        strength: regret.regretIntensity === "high" ? 88 : 72,
        reason: `Regret risk detected: ${regret.regretType}.`,
        evidence: ["regret"]
      });
    }

    if (
      longTermConsequence.path &&
      longTermConsequence.path !== "unclear_path"
    ) {
      this.addCandidate(candidates, {
        name: longTermConsequence.path,
        category: "long_term_consequence",
        strength:
          longTermConsequence.confidence === "high" ? 86 : 72,
        reason: `Long-term consequence path detected: ${longTermConsequence.path}.`,
        evidence: ["long_term_consequence"]
      });
    }
  },

  addExecutiveCandidates(candidates = [], executive = {}) {
    const priority = executive.primaryPriority?.name;
    const decision = executive.executiveDecision;

    if (priority) {
      this.addCandidate(candidates, {
        name: priority,
        category: "executive_priority",
        strength: 76,
        reason: `Executive priority detected: ${priority}.`,
        evidence: ["executive_priority"]
      });
    }

    if (decision && decision !== "continue_observing") {
      this.addCandidate(candidates, {
        name: decision,
        category: "executive_decision",
        strength: 78,
        reason: `Executive decision detected: ${decision}.`,
        evidence: ["executive_decision"]
      });
    }
  },

  rank(candidates = []) {
    return [...candidates].sort((a, b) => {
      return (b.strength || 0) - (a.strength || 0);
    });
  },

  recommendLead(primary = null) {
    if (!primary) return "recovery";

    if (primary.category === "life_priority") return "life_chapter";
    if (primary.category === "underlying_emotion") return "emotion_depth";
    if (primary.category === "wisdom_tension") return "wisdom";
    if (primary.category === "highest_good") return "wisdom";
    if (primary.category === "leading_good") return "executive_wisdom";
    if (primary.category === "regret") return "regret";
    if (primary.category === "long_term_consequence") return "consequence";
    if (primary.category === "conflict") return "conflict";
    if (primary.category === "hidden_conflict") return "insight";
    if (primary.category === "tradeoff") return "tradeoff";
    if (primary.category === "identity") return "identity";
    if (primary.category === "root_need") return "emotional_need";

    if (primary.category?.startsWith("signal:")) {
      const signalCategory = primary.category.replace("signal:", "");

      if (signalCategory === "life") return "life_chapter";
      if (signalCategory === "underlying_emotion") return "emotion_depth";
      if (signalCategory === "wisdom_tension") return "wisdom";
      if (signalCategory === "regret") return "regret";
      if (signalCategory === "long_term_consequence") return "consequence";
      if (signalCategory === "belief") return "belief";
      if (signalCategory === "conflict") return "conflict";
    }

    return "insight";
  },

  recommendMode(primary = null, rankedSalience = []) {
    if (!primary) return "ask";

    if (primary.strength >= 100) return "protect_major_life_priority";
    if (primary.strength >= 90) return "speak_clearly";
    if (primary.strength >= 75) return "speak_as_hypothesis";

    return "ask_or_reflect";
  },

  shouldOverrideLanguage(primary = null) {
    if (!primary) return false;

    return primary.strength >= 90;
  }
};