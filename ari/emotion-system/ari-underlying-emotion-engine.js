// ari/emotion-system/ari-underlying-emotion-engine.js
// Ari Underlying Emotion Engine
// Purpose: Detect the deeper emotional source beneath surface emotion, need, belief, chapter, identity, and pattern.
// V2.0

window.Ari = window.Ari || {};

window.Ari.underlyingEmotionEngine = {
  version: "2.0.0",

  analyze({
    observation = {},
    emotion = {},
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    wisdom = {},
    lifeChapter = {},
    identityPriority = {},
    organism = {}
  } = {}) {
    const candidates = [];
    const text = String(
      observation.normalizedMessage ||
      observation.message ||
      observation.rawMessage ||
      ""
    ).toLowerCase();

    this.addBodyAlarmCandidates({ candidates, text, organism, emotionalIntelligence });
    this.addConnectionCandidates({ candidates, text, emotionalIntelligence, lifeChapter });
    this.addWorthShameCandidates({ candidates, text, emotionalIntelligence, beliefModel });
    this.addGriefCandidates({ candidates, text, lifeChapter });
    this.addMeaningLossCandidates({ candidates, text, lifeChapter, wisdom, meaning });
    this.addUncertaintyCandidates({ candidates, text, lifeChapter, insight });
    this.addRecoveryCandidates({ candidates, text, lifeChapter });
    this.addIdentityThreatCandidates({ candidates, text, insight, personModel, beliefModel, wisdom, identityPriority });
    this.addResponsibilityCandidates({ candidates, text, emotionalIntelligence, insight, personModel, beliefModel, lifeChapter, identityPriority });
    this.addFamilyPresenceCandidates({ candidates, text, emotionalIntelligence, insight, meaning, personModel, simulation, wisdom, lifeChapter });
    this.addPurposeCandidates({ candidates, text, insight, beliefModel, personModel, wisdom, lifeChapter });
    this.addCapacityCandidates({ candidates, text, emotionalIntelligence, insight, meaning, wisdom, lifeChapter });

    const primary = this.choosePrimary(candidates);

    return {
      primaryUnderlyingEmotion: primary,
      candidates,
      emotionalSource: primary?.emotionalSource || null,
      protectiveStrategy: primary?.protectiveStrategy || null,
      hiddenFear: primary?.hiddenFear || null,
      vulnerableTruth: primary?.vulnerableTruth || null,
      confidence: primary?.confidence || "low",
      underlyingEmotionEngineVersion: this.version,
      source: "ari-underlying-emotion-engine"
    };
  },

  has(text = "", phrases = []) {
    return phrases.some(phrase => text.includes(phrase));
  },

  addCandidate(candidates = [], candidate = {}) {
    if (!candidate.name) return;

    const existing = candidates.find(item => item.name === candidate.name);

    if (existing) {
      existing.evidence = Array.from(
        new Set([...(existing.evidence || []), ...(candidate.evidence || [])])
      );

      if (this.confidenceScore(candidate.confidence) > this.confidenceScore(existing.confidence)) {
        existing.confidence = candidate.confidence;
      }

      return;
    }

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

  addBodyAlarmCandidates({ candidates = [], text = "", organism = {}, emotionalIntelligence = {} } = {}) {
    if (
      organism.organismNeedsStabilization ||
      emotionalIntelligence.rootNeed?.name === "body_stabilization" ||
      this.has(text, [
        "chest pain",
        "can't breathe",
        "cant breathe",
        "dizzy",
        "fainted",
        "passed out",
        "severe pain",
        "worst pain",
        "dehydrated",
        "haven't eaten",
        "havent eaten",
        "can't sleep",
        "no sleep"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "body_alarm_needing_stabilization",
        confidence: "high",
        emotionalSource: "body_signal",
        protectiveStrategy: "stabilize_body_before_interpretation",
        hiddenFear:
          "Something in the body may be asking for immediate stability before deeper meaning is explored.",
        vulnerableTruth:
          "The body may need care before the mind can make sense of the situation.",
        evidence: ["body or organism stabilization signal detected"]
      });
    }
  },

  addConnectionCandidates({ candidates = [], text = "", emotionalIntelligence = {}, lifeChapter = {} } = {}) {
    const chapter = lifeChapter.primaryLifeChapter;
    const rootNeed = emotionalIntelligence.rootNeed?.name;

    if (
      chapter === "relationship_rupture_chapter" ||
      rootNeed === "connection" ||
      this.has(text, [
        "alone",
        "lonely",
        "abandoned",
        "left me",
        "rejected",
        "ignored",
        "unloved",
        "nobody cares",
        "no one cares"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_being_unwanted",
        confidence: "high",
        emotionalSource: "connection_threat",
        protectiveStrategy: "seek_reassurance_or_withdraw",
        hiddenFear:
          "If I am not chosen or seen, maybe I do not matter as much as I hoped.",
        vulnerableTruth:
          "Feeling alone does not prove you are unwanted.",
        evidence: ["loneliness, rejection, abandonment, or relationship rupture detected"]
      });
    }
  },

  addWorthShameCandidates({ candidates = [], text = "", emotionalIntelligence = {}, beliefModel = {} } = {}) {
    const belief = beliefModel.primaryBelief?.name;

    if (
      emotionalIntelligence.rootNeed?.name === "worth" ||
      belief === "failure_means_i_am_not_enough" ||
      this.has(text, [
        "ashamed",
        "embarrassed",
        "humiliated",
        "worthless",
        "not good enough",
        "i failed",
        "failure",
        "useless",
        "stupid",
        "incompetent"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_not_being_enough",
        confidence: "high",
        emotionalSource: "worth_threat",
        protectiveStrategy: "hide_failure_or_overperform",
        hiddenFear:
          "If I fail or fall short, it may mean something painful about my worth.",
        vulnerableTruth:
          "A poor outcome can reveal pain or limits without defining your worth.",
        evidence: ["worth, shame, humiliation, or not-enough language detected"]
      });
    }
  },

  addGriefCandidates({ candidates = [], text = "", lifeChapter = {} } = {}) {
    if (
      lifeChapter.primaryLifeChapter === "grief_loss_chapter" ||
      this.has(text, [
        "grief",
        "died",
        "death",
        "gone",
        "miss them",
        "lost someone",
        "passed away"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "love_with_nowhere_to_go",
        confidence: "high",
        emotionalSource: "grief",
        protectiveStrategy: "hold_on_to_connection",
        hiddenFear:
          "If I move forward, I may feel like I am leaving the love behind.",
        vulnerableTruth:
          "Grief is often love trying to keep a bond alive after the form has changed.",
        evidence: ["grief, death, loss, or missing someone detected"]
      });
    }
  },

  addMeaningLossCandidates({ candidates = [], text = "", lifeChapter = {}, wisdom = {}, meaning = {} } = {}) {
    if (
      lifeChapter.primaryLifeChapter === "meaning_crisis_chapter" ||
      meaning.theme === "meaning_loss" ||
      wisdom.highestGood === "restore_meaning" ||
      this.has(text, [
        "what's the point",
        "whats the point",
        "nothing matters",
        "meaningless",
        "empty",
        "why bother",
        "lost purpose"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "loss_of_meaning",
        confidence: "high",
        emotionalSource: "meaning_disconnection",
        protectiveStrategy: "disengage_or_question_everything",
        hiddenFear:
          "If this no longer feels meaningful, I may not know why I am still trying.",
        vulnerableTruth:
          "Meaning can disappear from view without being permanently gone.",
        evidence: ["meaning crisis or existential language detected"]
      });
    }
  },

  addUncertaintyCandidates({ candidates = [], text = "", lifeChapter = {}, insight = {} } = {}) {
    if (
      lifeChapter.primaryLifeChapter === "uncertainty_transition_chapter" ||
      insight.uncertaintyType === "missing_information" ||
      this.has(text, [
        "don't know",
        "dont know",
        "unsure",
        "uncertain",
        "confused",
        "can't decide",
        "cant decide",
        "stuck between",
        "which path",
        "which option",
        "what if i choose wrong"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "fear_of_wrong_direction",
        confidence: "medium",
        emotionalSource: "uncertainty_threat",
        protectiveStrategy: "delay_decision_or_seek_certainty",
        hiddenFear:
          "If I choose wrong, I may lose something important or become responsible for the damage.",
        vulnerableTruth:
          "You may need enough clarity to move, not perfect certainty.",
        evidence: ["uncertainty, confusion, or decision paralysis detected"]
      });
    }
  },

  addRecoveryCandidates({ candidates = [], text = "", lifeChapter = {} } = {}) {
    if (
      lifeChapter.primaryLifeChapter === "recovery_rebuilding_chapter" ||
      this.has(text, [
        "starting over",
        "rebuild",
        "rebuilding",
        "fresh start",
        "second chance",
        "trying again",
        "getting my life together",
        "come back"
      ])
    ) {
      this.addCandidate(candidates, {
        name: "fear_rebuilding_will_not_work",
        confidence: "medium",
        emotionalSource: "recovery_uncertainty",
        protectiveStrategy: "hesitate_before_trying_again",
        hiddenFear:
          "If I try again and it still does not work, I may feel like I have no proof I can come back.",
        vulnerableTruth:
          "Rebuilding is allowed to be slow and uneven.",
        evidence: ["recovery, rebuilding, restart, or second-chance language detected"]
      });
    }
  },

  addIdentityThreatCandidates({
    candidates = [],
    text = "",
    insight = {},
    personModel = {},
    beliefModel = {},
    wisdom = {},
    identityPriority = {}
  } = {}) {
    const role = personModel.snapshot?.primaryRole;
    const belief = beliefModel.primaryBelief?.name;
    const pattern = insight.pattern?.name;
    const leadIdentity = identityPriority.leadIdentity;

    if (
      role === "builder" ||
      leadIdentity === "builder" ||
      belief === "purpose_must_not_be_abandoned" ||
      pattern === "achievement_before_presence" ||
      this.has(text, ["who am i", "losing myself", "not myself", "identity"])
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
          "builder role, identity threat, or purpose-protection belief detected"
        ]
      });
    }
  },

  addResponsibilityCandidates({
    candidates = [],
    text = "",
    emotionalIntelligence = {},
    insight = {},
    personModel = {},
    beliefModel = {},
    lifeChapter = {},
    identityPriority = {}
  } = {}) {
    const role = personModel.snapshot?.primaryRole;
    const belief = beliefModel.primaryBelief?.name;
    const pattern = insight.pattern?.name;
    const protecting = emotionalIntelligence.protecting?.name;
    const leadIdentity = identityPriority.leadIdentity;

    if (
      role === "provider" ||
      leadIdentity === "steward" ||
      lifeChapter.primaryLifeChapter === "stewardship_chapter" ||
      protecting === "responsibility" ||
      belief === "responsibility_comes_before_rest" ||
      pattern === "responsibility_before_recovery" ||
      this.has(text, ["responsibility", "depend on me", "provide", "protect", "take care of"])
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
          "responsibility, stewardship, provider role, or responsibility-before-recovery pattern detected"
        ]
      });
    }

    if (protecting === "family") {
      this.addCandidate(candidates, {
        name: "fear_of_failing_family",
        confidence: "medium",
        emotionalSource: "family_security_threat",
        protectiveStrategy: "over_function_for_family",
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
    text = "",
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    personModel = {},
    simulation = {},
    wisdom = {},
    lifeChapter = {}
  } = {}) {
    const need = emotionalIntelligence.rootNeed?.name;
    const tradeoff = insight.tradeoff?.name;
    const personLifeChapter = personModel.lifeChapter?.name;
    const simTheme = simulation.primarySimulation?.theme;
    const highestGood = wisdom.highestGood;
    const chapter = lifeChapter.primaryLifeChapter;

    if (
      need === "secure_family_presence" ||
      tradeoff === "presence_vs_acceleration" ||
      simTheme === "presence_vs_acceleration" ||
      personLifeChapter === "family_transition" ||
      chapter === "family_parenthood_chapter" ||
      highestGood === "protect_family" ||
      this.has(text, ["family", "baby", "pregnant", "daughter", "son", "parent"])
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
          "family presence need, parenthood chapter, or presence versus acceleration tradeoff detected"
        ]
      });
    }
  },

  addPurposeCandidates({
    candidates = [],
    text = "",
    insight = {},
    beliefModel = {},
    personModel = {},
    wisdom = {},
    lifeChapter = {}
  } = {}) {
    const hiddenConflict = insight.hiddenConflict?.name;
    const hiddenMotive = insight.hiddenMotive?.name;
    const belief = beliefModel.primaryBelief?.name;
    const longTermPriority = wisdom.longTermPriority;
    const chapter = lifeChapter.primaryLifeChapter;

    if (
      hiddenConflict === "family_vs_purpose" ||
      hiddenMotive === "protecting_purpose" ||
      belief === "purpose_must_not_be_abandoned" ||
      longTermPriority === "sustainable_purpose" ||
      chapter === "purpose_mission_chapter" ||
      this.has(text, ["purpose", "mission", "calling", "build", "create"])
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
          "purpose threat, mission chapter, or purpose-protection motive detected"
        ]
      });
    }
  },

  addCapacityCandidates({
    candidates = [],
    text = "",
    emotionalIntelligence = {},
    insight = {},
    meaning = {},
    wisdom = {},
    lifeChapter = {}
  } = {}) {
    const rootNeed = emotionalIntelligence.rootNeed?.name;
    const theme = meaning.theme;
    const pattern = insight.pattern?.name;
    const highestGood = wisdom.highestGood;
    const chapter = lifeChapter.primaryLifeChapter;

    if (
      rootNeed === "recovery_and_capacity" ||
      theme === "identity_overload" ||
      pattern === "too_many_primary_roles" ||
      highestGood === "protect_capacity" ||
      chapter === "capacity_burnout_chapter" ||
      this.has(text, ["burned out", "exhausted", "overwhelmed", "too much", "can't keep up"])
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
          "capacity need, burnout chapter, identity overload, or too-many-primary-roles pattern detected"
        ]
      });
    }
  },

  confidenceScore(confidence = "low") {
    const score = {
      high: 3,
      medium: 2,
      low: 1
    };

    return score[confidence] || 0;
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

    return [...candidates].sort((a, b) => {
      return this.confidenceScore(b.confidence) - this.confidenceScore(a.confidence);
    })[0];
  }
};