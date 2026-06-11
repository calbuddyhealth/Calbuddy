// ari/insight-system/ari-insight-engine.js
// Ari Insight Engine
// Purpose: Detect patterns, hidden conflicts, avoidance, tradeoffs, motives, hypotheses, counter-hypotheses, and one useful insight.
// V3.0: Integrates Insight Hypothesis Engine, Counter-Hypothesis Engine, and Confidence Calibration.

window.Ari = window.Ari || {};

window.Ari.insightEngine = {
  version: "3.0.0",

  generate({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    executive = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {},
    emotionalIntelligence = {},
    questionType = "understanding"
  } = {}) {
    const analysisContext = {
      observation,
      values,
      identity,
      conflicts,
      executive,
      meaning,
      personModel,
      beliefModel,
      simulation,
      emotionalIntelligence,
      questionType
    };

    const pattern = this.detectPattern({
      observation,
      values,
      identity,
      conflicts,
      meaning,
      personModel,
      beliefModel,
      simulation
    });

    const hiddenConflict = this.detectHiddenConflict({
      observation,
      values,
      identity,
      conflicts,
      meaning,
      personModel,
      beliefModel,
      emotionalIntelligence
    });

    const avoidance = this.detectAvoidance({
      observation,
      executive,
      conflicts,
      meaning,
      beliefModel,
      simulation
    });

    const tradeoff = this.detectTradeoff({
      values,
      conflicts,
      executive,
      meaning,
      personModel,
      beliefModel,
      simulation
    });

    const hiddenMotive = this.detectHiddenMotive({
      observation,
      values,
      identity,
      beliefModel,
      emotionalIntelligence,
      meaning
    });

    const hypothesisResult = window.Ari.insightHypothesisEngine
      ? window.Ari.insightHypothesisEngine.generate(observation, analysisContext)
      : {
          primaryHypothesis: null,
          hypotheses: []
        };

    const hypothesis = hypothesisResult.primaryHypothesis || null;
    const hypotheses = hypothesisResult.hypotheses || [];

    const counterResult = window.Ari.counterHypothesisEngine
      ? window.Ari.counterHypothesisEngine.generate({
          hypothesis,
          observation,
          analysis: analysisContext
        })
      : {
          primaryCounterHypothesis: null,
          counterHypotheses: []
        };

    const counterHypothesis = counterResult.primaryCounterHypothesis || null;
    const counterHypotheses = counterResult.counterHypotheses || [];

    const calibrated = window.Ari.confidenceCalibration
      ? window.Ari.confidenceCalibration.calibrate({
          hypothesis,
          counterHypothesis,
          evidence: hypothesis?.evidence || [],
          questionType,
          analysis: analysisContext
        })
      : {
          confidence: hypothesis?.confidence || "low",
          confidenceScore: null,
          reason: "Confidence calibration unavailable.",
          shouldSpeak: Boolean(hypothesis)
        };

    const oneLineInsight = this.generateOneLineInsight({
      pattern,
      hiddenConflict,
      avoidance,
      tradeoff,
      hiddenMotive,
      meaning,
      hypothesis,
      calibrated
    });

    return {
      pattern,
      hiddenConflict,
      avoidance,
      tradeoff,
      hiddenMotive,

      hypothesis,
      hypotheses,
      counterHypothesis,
      counterHypotheses,
      calibratedConfidence: calibrated.confidence,
      confidenceScore: calibrated.confidenceScore,
      confidenceReason: calibrated.reason,
      shouldSpeakHypothesis: calibrated.shouldSpeak,

      oneLineInsight,

      wisdom: {
        oneLine: oneLineInsight,
        explanation: this.generateExplanation({
          pattern,
          hiddenConflict,
          avoidance,
          tradeoff,
          hiddenMotive,
          meaning,
          hypothesis,
          counterHypothesis,
          calibrated
        })
      },

      source: "ari-insight-engine"
    };
  },

  makeSignal({
    name = "unclear",
    confidence = "low",
    evidence = [],
    description = ""
  } = {}) {
    if (window.Ari.confidenceSystem) {
      return {
        ...window.Ari.confidenceSystem.evaluateSignal({
          name,
          confidence,
          evidence,
          source: "ari-insight-engine"
        }),
        description
      };
    }

    return {
      name,
      confidence,
      evidence,
      description,
      certaintyLevel:
        confidence === "high"
          ? "strong_signal"
          : confidence === "medium"
          ? "reasonable_hypothesis"
          : "weak_signal",
      languagePrefix:
        confidence === "high"
          ? ""
          : confidence === "medium"
          ? "I could be wrong, but "
          : "This is only a weak signal, but "
    };
  },

  detectPattern({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    simulation = {}
  } = {}) {
    const text = observation.normalizedMessage || "";
    const patterns = observation.humanPatterns || {};
    const meaningTheme = meaning.theme || "";
    const primaryBelief = beliefModel.primaryBelief?.name || "";
    const primarySimulation = simulation.primarySimulation?.theme || "";

    if (
      primaryBelief === "achievement_creates_security" ||
      text.includes("achievement") ||
      text.includes("milestone") ||
      text.includes("after i") ||
      text.includes("once i finish")
    ) {
      return this.makeSignal({
        name: "achievement_before_peace",
        confidence: "medium",
        evidence: [
          "achievement or milestone language detected",
          "belief may connect achievement with security"
        ],
        description:
          "The user may be placing peace or permission to rest after the next achievement."
      });
    }

    if (
      meaningTheme === "family_transition" ||
      primarySimulation === "achievement_vs_presence" ||
      primarySimulation === "presence_vs_acceleration"
    ) {
      return this.makeSignal({
        name: "achievement_before_presence",
        confidence: "medium",
        evidence: [
          "family transition detected",
          "simulation suggests presence versus acceleration"
        ],
        description:
          "The user may be treating achievement as something that must be completed before presence can begin."
      });
    }

    if (
      identity.dominantTheme === "identity_overload" ||
      patterns.roleConflict ||
      personModel.recurringPattern?.name === "too_many_roles_competing"
    ) {
      return this.makeSignal({
        name: "too_many_primary_roles",
        confidence: "high",
        evidence: [
          "role conflict detected",
          "identity overload or competing roles detected"
        ],
        description:
          "Too many important identities appear to be competing for primary status."
      });
    }

    if (
      values.dominantValue === "responsibility" ||
      primaryBelief === "responsibility_comes_before_rest"
    ) {
      return this.makeSignal({
        name: "responsibility_before_recovery",
        confidence: "medium",
        evidence: [
          "responsibility value detected",
          "responsibility-before-rest belief detected"
        ],
        description:
          "The user may be putting responsibility ahead of recovery."
      });
    }

    return this.makeSignal({
      name: "unclear",
      confidence: "low",
      evidence: [],
      description: "No strong pattern detected."
    });
  },

  detectHiddenConflict({
    observation = {},
    values = {},
    identity = {},
    conflicts = {},
    meaning = {},
    personModel = {},
    beliefModel = {},
    emotionalIntelligence = {}
  } = {}) {
    const life = observation.lifeTransitions || {};
    const meaningTheme = meaning.theme || "";
    const primaryBelief = beliefModel.primaryBelief?.name || "";
    const underlyingEmotion = emotionalIntelligence.underlyingEmotion?.name || "";

    if (
      meaningTheme === "family_vs_purpose" ||
      underlyingEmotion === "fear_of_betraying_purpose" ||
      primaryBelief === "purpose_must_not_be_abandoned" ||
      primaryBelief === "delaying_purpose_feels_like_betrayal"
    ) {
      return this.makeSignal({
        name: "family_vs_purpose",
        confidence: "high",
        evidence: [
          "purpose-related belief or emotion detected",
          "family/purpose tension detected"
        ],
        description:
          "The user may fear that protecting family means betraying purpose."
      });
    }

    if (
      values.dominantValue === "family" &&
      (identity.dominantIdentity?.name === "father" || life.fatherhood)
    ) {
      return this.makeSignal({
        name: "provider_vs_presence",
        confidence: "medium",
        evidence: [
          "family value detected",
          "fatherhood or father identity detected"
        ],
        description:
          "The user may be navigating the difference between providing more and being present more."
      });
    }

    if (
      conflicts.primaryConflict?.name === "identity_vs_transition" ||
      personModel.lifeChapter?.name === "fatherhood_and_transition"
    ) {
      return this.makeSignal({
        name: "identity_vs_transition",
        confidence: "medium",
        evidence: [
          "identity transition detected",
          "major life chapter shift detected"
        ],
        description:
          "The user may be struggling to let one chapter end while another begins."
      });
    }

    if (primaryBelief === "slowing_down_means_falling_behind") {
      return this.makeSignal({
        name: "growth_vs_stability",
        confidence: "medium",
        evidence: [
          "belief that slowing down means falling behind detected"
        ],
        description:
          "The user may feel torn between growing quickly and staying stable."
      });
    }

    return this.makeSignal({
      name: "unclear",
      confidence: "low",
      evidence: [],
      description: "No strong hidden conflict detected."
    });
  },

  detectAvoidance({
    observation = {},
    executive = {},
    conflicts = {},
    meaning = {},
    beliefModel = {},
    simulation = {}
  } = {}) {
    const text = observation.normalizedMessage || "";
    const delay = executive.thingsToDelay || [];
    const primaryBelief = beliefModel.primaryBelief?.name || "";
    const primarySimulation = simulation.primarySimulation?.name || "";

    if (
      text.includes("what am i avoiding") ||
      text.includes("avoiding admitting") ||
      text.includes("what am i not seeing") ||
      text.includes("uncomfortable truth") ||
      text.includes("truth am i avoiding") ||
      text.includes("what am i pretending not to know")
    ) {
      return this.makeSignal({
        name: "known_answer_unwanted_cost",
        confidence: "medium",
        evidence: [
          "user directly asked about avoidance, truth, or uncomfortable insight"
        ],
        description:
          "The user may already sense the answer but may be struggling with the cost of accepting it."
      });
    }

    if (
      delay.length > 0 ||
      primarySimulation === "family_vs_career" ||
      primarySimulation === "acceleration_vs_presence"
    ) {
      return this.makeSignal({
        name: "resisting_delay",
        confidence: "medium",
        evidence: [
          "delay recommendation or tradeoff simulation detected"
        ],
        description:
          "The user may be resisting the fact that something meaningful must slow down."
      });
    }

    if (
      primaryBelief === "achievement_creates_security" ||
      primaryBelief === "slowing_down_means_falling_behind"
    ) {
      return this.makeSignal({
        name: "avoiding_uncertainty_without_achievement",
        confidence: "medium",
        evidence: [
          "belief connects achievement with safety or momentum"
        ],
        description:
          "The user may be avoiding the discomfort of uncertainty without achievement as protection."
      });
    }

    return this.makeSignal({
      name: "none_detected",
      confidence: "low",
      evidence: [],
      description: "No clear avoidance detected."
    });
  },

  detectTradeoff({
    values = {},
    executive = {},
    meaning = {},
    beliefModel = {},
    simulation = {}
  } = {}) {
    const valueConflicts = values.valueConflicts || [];
    const delay = executive.thingsToDelay || [];
    const primarySimulation = simulation.primarySimulation || {};
    const simTheme = primarySimulation.theme || "";

    if (
      simTheme === "presence_vs_acceleration" ||
      simTheme === "achievement_vs_presence"
    ) {
      return this.makeSignal({
        name: "presence_vs_acceleration",
        confidence: "high",
        evidence: [
          "simulation identified presence versus acceleration"
        ],
        description:
          "The user may need to choose between being more present and accelerating achievement."
      });
    }

    if (
      valueConflicts.includes("family_vs_creation") ||
      meaning.theme === "family_vs_purpose"
    ) {
      return this.makeSignal({
        name: "family_presence_vs_creation",
        confidence: "medium",
        evidence: [
          "family versus creation conflict detected"
        ],
        description:
          "Time invested in building may reduce time available for family presence."
      });
    }

    if (
      valueConflicts.includes("growth_vs_stability") ||
      beliefModel.primaryBelief?.name === "slowing_down_means_falling_behind"
    ) {
      return this.makeSignal({
        name: "growth_vs_stability",
        confidence: "medium",
        evidence: [
          "growth versus stability conflict or belief detected"
        ],
        description:
          "Aggressive growth may temporarily reduce stability."
      });
    }

    if (delay.length > 0) {
      return this.makeSignal({
        name: "chosen_sacrifice",
        confidence: "medium",
        evidence: [
          "executive system recommended delaying something"
        ],
        description:
          "Protecting one meaningful priority requires slowing another."
      });
    }

    return this.makeSignal({
      name: "none_detected",
      confidence: "low",
      evidence: [],
      description: "No major tradeoff detected."
    });
  },

  detectHiddenMotive({
    observation = {},
    values = {},
    identity = {},
    beliefModel = {},
    emotionalIntelligence = {}
  } = {}) {
    const text = observation.normalizedMessage || "";
    const primaryBelief = beliefModel.primaryBelief?.name || "";
    const underlyingEmotion = emotionalIntelligence.underlyingEmotion?.name || "";

    if (
      text.includes("protect myself") ||
      text.includes("using achievement") ||
      primaryBelief === "achievement_creates_security"
    ) {
      return this.makeSignal({
        name: "achievement_as_control",
        confidence: "medium",
        evidence: [
          "achievement language or belief detected"
        ],
        description:
          "The user may use achievement to make uncertainty feel controllable."
      });
    }

    if (
      underlyingEmotion === "fear_of_betraying_purpose" ||
      primaryBelief === "purpose_must_not_be_abandoned"
    ) {
      return this.makeSignal({
        name: "protecting_purpose",
        confidence: "medium",
        evidence: [
          "purpose-related fear or belief detected"
        ],
        description:
          "The user may be trying to protect a meaningful mission from being lost."
      });
    }

    if (
      values.dominantValue === "responsibility" ||
      identity.dominantIdentity?.name === "provider"
    ) {
      return this.makeSignal({
        name: "protecting_stability",
        confidence: "medium",
        evidence: [
          "responsibility or provider identity detected"
        ],
        description:
          "The user may be trying to protect stability for themselves or others."
      });
    }

    return this.makeSignal({
      name: "unclear",
      confidence: "low",
      evidence: [],
      description: "No strong hidden motive detected."
    });
  },

  generateOneLineInsight({
    pattern = {},
    hiddenConflict = {},
    avoidance = {},
    tradeoff = {},
    hiddenMotive = {},
    meaning = {},
    hypothesis = null,
    calibrated = {}
  } = {}) {
    if (hiddenMotive.name === "achievement_as_control") {
      return "You may be using achievement to make uncertainty feel controllable.";
    }

    if (pattern.name === "achievement_before_peace") {
      return "The pattern may be that peace keeps getting placed on the other side of the next achievement.";
    }

    if (pattern.name === "achievement_before_presence") {
      return "You may be treating achievement as something that must be completed before presence can begin.";
    }

    if (hiddenConflict.name === "family_vs_purpose") {
      return "Part of you may fear that slowing down for family means abandoning purpose.";
    }

    if (tradeoff.name === "presence_vs_acceleration") {
      return "The real tradeoff may be presence versus acceleration.";
    }

    if (pattern.name === "too_many_primary_roles") {
      return "The problem is not that you have too many goals. The problem is that every goal is trying to be first.";
    }

    if (avoidance.name === "known_answer_unwanted_cost") {
      return "You may not be avoiding the answer. You may be avoiding the cost of accepting it.";
    }

    if (hypothesis?.explanation && calibrated.shouldSpeak !== false) {
      return hypothesis.explanation;
    }

    if (meaning.humanTruth) {
      return meaning.humanTruth;
    }

    return "The next wise move is to choose what must lead, not what matters.";
  },

  generateExplanation({
    pattern = {},
    hiddenConflict = {},
    avoidance = {},
    tradeoff = {},
    hiddenMotive = {},
    hypothesis = null,
    counterHypothesis = null,
    calibrated = {}
  } = {}) {
    const evidence = [
      ...(pattern.evidence || []),
      ...(hiddenConflict.evidence || []),
      ...(avoidance.evidence || []),
      ...(tradeoff.evidence || []),
      ...(hiddenMotive.evidence || []),
      ...(hypothesis?.evidence || [])
    ];

    const uniqueEvidence = [...new Set(evidence)];

    if (uniqueEvidence.length === 0) {
      return "Ari does not have enough evidence yet to explain the insight clearly.";
    }

    let explanation = `This insight is based on: ${uniqueEvidence.join(", ")}.`;

    if (counterHypothesis?.explanation) {
      explanation += ` Counterpoint: ${counterHypothesis.explanation}`;
    }

    if (calibrated?.reason) {
      explanation += ` Confidence: ${calibrated.reason}`;
    }

    return explanation;
  }
};