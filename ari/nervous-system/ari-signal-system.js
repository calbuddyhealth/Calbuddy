// ari/nervous-system/ari-signal-system.js
// Ari Signal System
// Purpose: Convert Ari's detected signals into weighted activation signals.
// V1.0

window.Ari = window.Ari || {};

window.Ari.signalSystem = {
  version: "1.0.0",

  analyze({
    lifeSignals = {},
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    executive = {},
    emotion = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    wisdom = {},
    wisdomResolution = {},
    regret = {},
    longTermConsequence = {},
    underlyingEmotion = {}
  } = {}) {
    const signals = [];

    this.addLifeSignals(signals, lifeSignals);
    this.addIdentitySignals(signals, identity, personModel);
    this.addConflictSignals(signals, conflicts, insight);
    this.addEmotionSignals(signals, emotion, underlyingEmotion);
    this.addBeliefSignals(signals, beliefModel);
    this.addWisdomSignals(signals, wisdom, wisdomResolution);
    this.addRegretSignals(signals, regret, longTermConsequence);
    this.addExecutiveSignals(signals, executive);

    const rankedSignals = this.rank(signals);
    const strongestSignal = rankedSignals[0] || null;

    return {
      signals,
      rankedSignals,
      strongestSignal,
      strongestSignalName: strongestSignal?.name || null,
      strongestSignalCategory: strongestSignal?.category || null,
      strongestSignalStrength: strongestSignal?.strength || 0,
      recommendedLanguageLead:
        this.recommendLanguageLead(strongestSignal, rankedSignals),
      recommendedOrgans:
        this.recommendOrgans(rankedSignals),
      source: "ari-signal-system"
    };
  },

  addSignal(signals = [], {
    name,
    category = "general",
    strength = 0,
    confidence = "low",
    activates = [],
    evidence = []
  } = {}) {
    if (!name) return;

    const existing = signals.find(
      (item) => item.name === name && item.category === category
    );

    if (existing) {
      existing.strength = Math.max(existing.strength, strength);
      existing.evidence = [...new Set([
        ...(existing.evidence || []),
        ...(evidence || [])
      ])];
      existing.activates = [...new Set([
        ...(existing.activates || []),
        ...(activates || [])
      ])];
      return;
    }

    signals.push({
      name,
      category,
      strength,
      confidence,
      activates,
      evidence
    });
  },

  addLifeSignals(signals = [], lifeSignals = {}) {
    const names = lifeSignals.signalNames || [];

    names.forEach((name) => {
      const strengthMap = {
        fatherhood_transition: 95,
        family_transition: 90,
        military_transition: 85,
        identity_transition: 85,
        creative_mission: 80,
        purpose_signal: 80,
        capacity_pressure: 78,
        achievement_pressure: 75,
        career_transition: 72,
        emotional_threat: 70
      };

      this.addSignal(signals, {
        name,
        category: "life",
        strength: strengthMap[name] || 60,
        confidence: "high",
        activates: [
          "identity",
          "personModel",
          "conflict",
          "belief",
          "wisdom",
          "memory",
          "language"
        ],
        evidence: [`life_signal:${name}`]
      });
    });
  },

  addIdentitySignals(signals = [], identity = {}, personModel = {}) {
    const dominant = identity.dominantIdentity?.name;
    const role = personModel.snapshot?.primaryRole;
    const chapter = personModel.lifeChapter?.name;

    if (dominant) {
      this.addSignal(signals, {
        name: dominant,
        category: "identity",
        strength: 78,
        confidence: identity.dominantIdentity?.confidence || "medium",
        activates: ["conflict", "belief", "wisdom", "language"],
        evidence: ["dominant_identity"]
      });
    }

    if (role && role !== "unknown") {
      this.addSignal(signals, {
        name: role,
        category: "role",
        strength: 76,
        confidence: "medium",
        activates: ["identity", "personModel", "language"],
        evidence: ["person_primary_role"]
      });
    }

    if (chapter && chapter !== "unclear") {
      this.addSignal(signals, {
        name: chapter,
        category: "life_chapter",
        strength: 88,
        confidence: personModel.lifeChapter?.confidence || "medium",
        activates: ["meaning", "wisdom", "memory", "language"],
        evidence: ["life_chapter"]
      });
    }
  },

  addConflictSignals(signals = [], conflicts = {}, insight = {}) {
    const conflict = conflicts.primaryConflict?.name;
    const hiddenConflict = insight.hiddenConflict?.name;
    const tradeoff = insight.tradeoff?.name;

    if (conflict) {
      this.addSignal(signals, {
        name: conflict,
        category: "conflict",
        strength: 82,
        confidence: "medium",
        activates: ["executive", "simulation", "wisdom", "language"],
        evidence: ["primary_conflict"]
      });
    }

    if (hiddenConflict && hiddenConflict !== "unclear") {
      this.addSignal(signals, {
        name: hiddenConflict,
        category: "hidden_conflict",
        strength: 86,
        confidence: insight.hiddenConflict?.confidence || "medium",
        activates: ["insight", "wisdom", "language"],
        evidence: ["hidden_conflict"]
      });
    }

    if (tradeoff && tradeoff !== "none_detected") {
      this.addSignal(signals, {
        name: tradeoff,
        category: "tradeoff",
        strength: 84,
        confidence: insight.tradeoff?.confidence || "medium",
        activates: ["executive", "wisdom", "language"],
        evidence: ["tradeoff"]
      });
    }
  },

  addEmotionSignals(signals = [], emotion = {}, underlyingEmotion = {}) {
    const primaryEmotion = emotion.primaryEmotion;
    const depth = underlyingEmotion.primaryUnderlyingEmotion?.name;

    if (primaryEmotion) {
      this.addSignal(signals, {
        name: primaryEmotion,
        category: "surface_emotion",
        strength: 60,
        confidence: "medium",
        activates: ["emotion", "language"],
        evidence: ["primary_emotion"]
      });
    }

    if (depth && depth !== "unclear") {
      this.addSignal(signals, {
        name: depth,
        category: "underlying_emotion",
        strength:
          underlyingEmotion.primaryUnderlyingEmotion?.confidence === "high"
            ? 92
            : 78,
        confidence:
          underlyingEmotion.primaryUnderlyingEmotion?.confidence || "medium",
        activates: ["emotion", "insight", "wisdom", "language"],
        evidence: ["underlying_emotion_depth"]
      });
    }
  },

  addBeliefSignals(signals = [], beliefModel = {}) {
    const belief = beliefModel.primaryBelief?.name;

    if (belief) {
      this.addSignal(signals, {
        name: belief,
        category: "belief",
        strength:
          beliefModel.primaryBelief?.confidence === "high"
            ? 88
            : 74,
        confidence: beliefModel.primaryBelief?.confidence || "medium",
        activates: ["insight", "wisdom", "language"],
        evidence: ["primary_belief"]
      });
    }
  },

  addWisdomSignals(signals = [], wisdom = {}, wisdomResolution = {}) {
    const tension = wisdom.wisdomTension?.name;
    const highestGood = wisdom.highestGood;
    const leadingGood = wisdomResolution.leadingGood;

    if (tension && tension !== "unclear") {
      this.addSignal(signals, {
        name: tension,
        category: "wisdom_tension",
        strength: wisdom.confidence === "high" ? 90 : 76,
        confidence: wisdom.confidence || "medium",
        activates: ["wisdom", "executive", "language"],
        evidence: ["wisdom_tension"]
      });
    }

    if (highestGood) {
      this.addSignal(signals, {
        name: highestGood,
        category: "highest_good",
        strength: wisdom.confidence === "high" ? 86 : 72,
        confidence: wisdom.confidence || "medium",
        activates: ["wisdom", "language"],
        evidence: ["highest_good"]
      });
    }

    if (leadingGood) {
      this.addSignal(signals, {
        name: leadingGood,
        category: "leading_good",
        strength:
          wisdomResolution.confidence === "high" ? 86 : 72,
        confidence: wisdomResolution.confidence || "medium",
        activates: ["executive", "language"],
        evidence: ["wisdom_resolution"]
      });
    }
  },

  addRegretSignals(signals = [], regret = {}, longTermConsequence = {}) {
    if (regret.regretType && regret.regretType !== "unclear_regret") {
      this.addSignal(signals, {
        name: regret.regretType,
        category: "regret",
        strength: regret.regretIntensity === "high" ? 88 : 70,
        confidence: regret.regretIntensity || "medium",
        activates: ["wisdom", "language"],
        evidence: ["regret_prediction"]
      });
    }

    if (
      longTermConsequence.path &&
      longTermConsequence.path !== "unclear_path"
    ) {
      this.addSignal(signals, {
        name: longTermConsequence.path,
        category: "long_term_consequence",
        strength:
          longTermConsequence.confidence === "high" ? 86 : 70,
        confidence: longTermConsequence.confidence || "medium",
        activates: ["wisdom", "language"],
        evidence: ["long_term_consequence"]
      });
    }
  },

  addExecutiveSignals(signals = [], executive = {}) {
    const priority = executive.primaryPriority?.name;
    const decision = executive.executiveDecision;

    if (priority) {
      this.addSignal(signals, {
        name: priority,
        category: "priority",
        strength: 80,
        confidence: "medium",
        activates: ["executive", "language"],
        evidence: ["executive_priority"]
      });
    }

    if (decision && decision !== "continue_observing") {
      this.addSignal(signals, {
        name: decision,
        category: "executive_decision",
        strength: 82,
        confidence: "medium",
        activates: ["executive", "language"],
        evidence: ["executive_decision"]
      });
    }
  },

  rank(signals = []) {
    return [...signals].sort((a, b) => {
      return (b.strength || 0) - (a.strength || 0);
    });
  },

  recommendLanguageLead(strongestSignal = null, rankedSignals = []) {
    if (!strongestSignal) return "recovery";

    const category = strongestSignal.category;

    if (category === "life") return "life_chapter";
    if (category === "underlying_emotion") return "emotion_depth";
    if (category === "wisdom_tension") return "wisdom";
    if (category === "regret") return "regret";
    if (category === "long_term_consequence") return "consequence";
    if (category === "conflict" || category === "hidden_conflict") return "conflict";
    if (category === "belief") return "belief";
    if (category === "priority" || category === "executive_decision") return "executive";

    return "insight";
  },

  recommendOrgans(rankedSignals = []) {
    const organs = new Set();

    rankedSignals.slice(0, 5).forEach((signal) => {
      (signal.activates || []).forEach((organ) => organs.add(organ));
    });

    return [...organs];
  }
};