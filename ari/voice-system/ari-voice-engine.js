// ari/voice-system/ari-voice-engine.js
// Ari Voice Engine
// Purpose: Decide how Ari should sound before language is generated.
// V2.0
// Adds:
// - Situation Contract awareness.
// - Safety Context Gate awareness.
// - Voice can style, but cannot change the primary lane.
// - Keeps legacy questionType behavior as fallback.

window.Ari = window.Ari || {};

window.Ari.voiceEngine = {
  version: "2.0.0",

  chooseVoice({
    analysis = {},
    selfReflection = {}
  } = {}) {
    const summary = analysis.summary || analysis || {};

    const contractPrimary =
      summary.situationContractPrimary ||
      summary.situationContract?.primary ||
      null;

    const responseShape =
      summary.responseShape ||
      summary.situationContract?.responseShape ||
      null;

    const safetyRiskLevel =
      summary.safetyRiskLevel ||
      summary.safetyContextGate?.riskLevel ||
      "none";

    const primaryHumanNeed =
      summary.primaryHumanNeed ||
      null;

    const questionType = summary.questionType || "understanding";
    const meaning = summary.meaning || {};
    const insight = summary.insight || {};
    const emotionalIntelligence = summary.emotionalIntelligence || {};
    const executive = summary.executive || {};
    const route = summary.route || {};

    const stance =
      this.chooseContractStance(contractPrimary) ||
      selfReflection.stance?.name ||
      route.primaryOrgan ||
      this.chooseStance(questionType);

    const confidence = this.detectConfidence({
      meaning,
      insight,
      contractPrimary
    });

    return {
      voiceEngineRan: true,
      voiceEngineVersion: this.version,

      stance,
      contractPrimary,
      responseShape,
      safetyRiskLevel,
      primaryHumanNeed,

      openingStyle: this.chooseOpeningStyle({
        questionType,
        stance,
        contractPrimary,
        responseShape,
        safetyRiskLevel
      }),

      confidenceStyle: this.chooseConfidenceStyle(confidence),
      confidence,

      warmth: this.chooseWarmth({
        questionType,
        emotionalIntelligence,
        contractPrimary,
        primaryHumanNeed,
        safetyRiskLevel
      }),

      challenge: this.chooseChallenge({
        questionType,
        insight,
        executive,
        contractPrimary,
        safetyRiskLevel
      }),

      depth: this.chooseDepth({
        questionType,
        meaning,
        contractPrimary,
        responseShape,
        safetyRiskLevel
      }),

      structure: this.chooseStructure({
        questionType,
        stance,
        contractPrimary,
        responseShape
      }),

      rhythm: this.chooseRhythm({
        questionType,
        emotionalIntelligence,
        contractPrimary,
        safetyRiskLevel
      }),

      directness: this.chooseDirectness({
        contractPrimary,
        safetyRiskLevel,
        responseShape
      }),

      questionStyle: this.chooseQuestionStyle({
        contractPrimary,
        responseShape,
        safetyRiskLevel
      }),

      voiceRules: this.chooseVoiceRules({
        contractPrimary,
        responseShape,
        safetyRiskLevel
      }),

      source: "ari-voice-engine"
    };
  },

  chooseContractStance(primary = null) {
    const map = {
      safety: "guardian",
      risk_clarification: "calm_guardian",
      medical_body: "clinical_guardian",
      executive_decision: "steward",
      builder: "builder",
      teacher: "teacher",
      emotion: "companion",
      family: "family_steward",
      relationship: "companion",
      wisdom: "wise_steward",
      memory: "continuity_keeper",
      general_understanding: "steady_companion"
    };

    return map[primary] || null;
  },

  chooseStance(questionType = "understanding") {
    const map = {
      meaning: "storykeeper",
      insight: "observer",
      emotional: "companion",
      decision: "steward",
      planning: "steward",
      building: "builder",
      teaching: "teacher",
      understanding: "steady_companion"
    };

    return map[questionType] || "steady_companion";
  },

  detectConfidence({ meaning = {}, insight = {}, contractPrimary = null } = {}) {
    if (contractPrimary) return "high";

    const confidenceRank = {
      high: 3,
      medium: 2,
      low: 1,
      unknown: 0
    };

    const candidates = [
      meaning.confidence,
      insight.pattern?.confidence,
      insight.hiddenConflict?.confidence,
      insight.tradeoff?.confidence,
      insight.hiddenMotive?.confidence
    ].filter(Boolean);

    if (!candidates.length) return "low";

    return candidates.sort((a, b) => {
      return (confidenceRank[b] || 0) - (confidenceRank[a] || 0);
    })[0];
  },

  chooseConfidenceStyle(confidence = "low") {
    const map = {
      high: {
        name: "clear",
        prefix: ""
      },
      medium: {
        name: "humble",
        prefix: "I could be wrong, but "
      },
      low: {
        name: "tentative",
        prefix: "This is only a possibility, but "
      },
      unknown: {
        name: "uncertain",
        prefix: "I do not have enough to say this clearly, but "
      }
    };

    return map[confidence] || map.low;
  },

  chooseOpeningStyle({
    questionType = "",
    stance = "",
    contractPrimary = null,
    responseShape = "",
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "risk_clarification") return "risk_clarification";
    if (contractPrimary === "safety") return "safety_grounding";
    if (contractPrimary === "medical_body") return "body_first";
    if (contractPrimary === "builder") return "practical_focus";
    if (contractPrimary === "teacher") return "teaching_focus";
    if (contractPrimary === "executive_decision") return "priority_clarity";
    if (contractPrimary === "emotion") return "emotional_attunement";
    if (contractPrimary === "family") return "family_presence";
    if (responseShape === "multi_question_triage") return "triage_acknowledgment";

    if (safetyRiskLevel === "critical" || safetyRiskLevel === "high") {
      return "safety_grounding";
    }

    if (questionType === "meaning" || stance === "storykeeper") {
      return "chapter_observation";
    }

    if (questionType === "insight" || stance === "observer") {
      return "pattern_observation";
    }

    if (questionType === "emotional" || stance === "companion") {
      return "emotional_attunement";
    }

    if (questionType === "decision" || stance === "steward") {
      return "priority_clarity";
    }

    if (questionType === "building" || stance === "builder") {
      return "practical_focus";
    }

    return "steady_observation";
  },

  chooseWarmth({
    questionType = "",
    emotionalIntelligence = {},
    contractPrimary = null,
    primaryHumanNeed = null,
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "safety" || contractPrimary === "risk_clarification") return 80;
    if (contractPrimary === "medical_body") return 70;
    if (contractPrimary === "emotion") return 88;
    if (contractPrimary === "family" || primaryHumanNeed === "connection") return 82;
    if (contractPrimary === "builder") return 45;
    if (contractPrimary === "teacher") return 60;
    if (contractPrimary === "executive_decision") return 65;

    const underlying = emotionalIntelligence.underlyingEmotion?.name;
    const surface = emotionalIntelligence.surfaceEmotion?.name;

    if (
      questionType === "emotional" ||
      underlying === "fear_of_failing_family" ||
      underlying === "depleted_capacity" ||
      surface === "overwhelm"
    ) {
      return 85;
    }

    if (questionType === "meaning") return 75;
    if (questionType === "insight") return 70;
    if (questionType === "building") return 45;

    return 65;
  },

  chooseChallenge({
    questionType = "",
    insight = {},
    executive = {},
    contractPrimary = null,
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "safety" || contractPrimary === "risk_clarification") return 10;
    if (contractPrimary === "medical_body") return 20;
    if (contractPrimary === "emotion") return 25;
    if (contractPrimary === "family") return 45;
    if (contractPrimary === "builder") return 65;
    if (contractPrimary === "executive_decision") return 70;
    if (contractPrimary === "teacher") return 35;

    const avoidance = insight.avoidance?.name;
    const tradeoff = insight.tradeoff?.name;

    if (
      avoidance &&
      avoidance !== "none_detected" &&
      insight.avoidance?.confidence !== "low"
    ) {
      return 75;
    }

    if (
      tradeoff &&
      tradeoff !== "none_detected" &&
      insight.tradeoff?.confidence === "high"
    ) {
      return 70;
    }

    if (questionType === "decision") return 70;
    if (questionType === "meaning") return 55;
    if (questionType === "emotional") return 35;
    if (questionType === "building") return 65;

    return 50;
  },

  chooseDepth({
    questionType = "",
    meaning = {},
    contractPrimary = null,
    responseShape = "",
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "safety" || contractPrimary === "risk_clarification") return 15;
    if (contractPrimary === "medical_body") return 20;
    if (contractPrimary === "builder") return 25;
    if (contractPrimary === "teacher") return 55;
    if (contractPrimary === "executive_decision") return 60;
    if (contractPrimary === "emotion") return 65;
    if (contractPrimary === "family") return 70;
    if (responseShape === "multi_question_triage") return 45;

    if (questionType === "meaning") return 85;
    if (questionType === "insight") return 80;
    if (questionType === "emotional") return 65;
    if (questionType === "decision") return 60;
    if (questionType === "building") return 25;
    if (meaning.theme && meaning.theme !== "general_understanding") return 70;

    return 45;
  },

  chooseStructure({
    questionType = "",
    stance = "",
    contractPrimary = null,
    responseShape = ""
  } = {}) {
    if (contractPrimary === "risk_clarification") {
      return ["clarify_risk", "one_question"];
    }

    if (contractPrimary === "safety") {
      return ["safety_check", "grounding", "next_safe_step"];
    }

    if (contractPrimary === "medical_body") {
      return ["body_signal", "boundary", "next_step"];
    }

    if (responseShape === "multi_question_triage") {
      return ["primary", "support", "brief", "context", "deferred"];
    }

    if (contractPrimary === "executive_decision") {
      return ["reality", "priority", "tradeoff", "next_step"];
    }

    if (contractPrimary === "builder") {
      return ["bottleneck", "constraint", "next_change"];
    }

    if (contractPrimary === "teacher") {
      return ["answer", "explanation", "example"];
    }

    if (contractPrimary === "emotion") {
      return ["emotion", "need", "truth", "grounding"];
    }

    if (contractPrimary === "family") {
      return ["family_need", "tradeoff", "protected_next_step"];
    }

    if (questionType === "meaning" || stance === "storykeeper") {
      return ["observation", "chapter", "meaning", "reflection_question"];
    }

    if (questionType === "insight" || stance === "observer") {
      return ["observation", "pattern", "interpretation", "question"];
    }

    if (questionType === "emotional" || stance === "companion") {
      return ["emotion", "need", "protection", "grounding"];
    }

    if (questionType === "decision" || stance === "steward") {
      return ["reality", "priority", "tradeoff", "next_step"];
    }

    if (questionType === "building" || stance === "builder") {
      return ["bottleneck", "constraint", "next_change"];
    }

    return ["observation", "interpretation", "next_step"];
  },

  chooseRhythm({
    questionType = "",
    emotionalIntelligence = {},
    contractPrimary = null,
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "risk_clarification") return "one_clear_question";
    if (contractPrimary === "safety") return "short_calm_direct";
    if (contractPrimary === "medical_body") return "short_direct";
    if (contractPrimary === "builder") return "direct_practical";
    if (contractPrimary === "teacher") return "clear_stepwise";
    if (contractPrimary === "emotion") return "warm_short";
    if (contractPrimary === "executive_decision") return "structured_clear";

    const regulation = emotionalIntelligence.regulation?.strategy;

    if (regulation === "reduce_load") {
      return "very_short";
    }

    if (questionType === "meaning" || questionType === "insight") {
      return "reflective_short";
    }

    if (questionType === "building") {
      return "direct_practical";
    }

    return "short_clear";
  },

  chooseDirectness({
    contractPrimary = null,
    safetyRiskLevel = "none",
    responseShape = ""
  } = {}) {
    if (contractPrimary === "safety") return 95;
    if (contractPrimary === "risk_clarification") return 90;
    if (contractPrimary === "medical_body") return 90;
    if (contractPrimary === "builder") return 85;
    if (contractPrimary === "executive_decision") return 80;
    if (contractPrimary === "teacher") return 70;
    if (contractPrimary === "emotion") return 55;
    if (contractPrimary === "family") return 65;
    if (responseShape === "multi_question_triage") return 75;

    return 65;
  },

  chooseQuestionStyle({
    contractPrimary = null,
    responseShape = "",
    safetyRiskLevel = "none"
  } = {}) {
    if (contractPrimary === "risk_clarification") return "single_required_clarifying_question";
    if (contractPrimary === "safety") return "safety_check";
    if (contractPrimary === "medical_body") return "symptom_or_next_step_question";
    if (contractPrimary === "builder") return "implementation_question";
    if (contractPrimary === "teacher") return "understanding_check";
    if (contractPrimary === "emotion") return "gentle_reflection";
    if (contractPrimary === "executive_decision") return "priority_question";
    if (contractPrimary === "family") return "family_presence_question";
    if (responseShape === "multi_question_triage") return "priority_selection_question";

    return "light_followup";
  },

  chooseVoiceRules({
    contractPrimary = null,
    responseShape = "",
    safetyRiskLevel = "none"
  } = {}) {
    const rules = [
      "Voice may style the response but must not change the primary lane.",
      "Do not override the Situation Contract.",
      "Do not add deeper meaning if the contract blocks or defers it."
    ];

    if (contractPrimary === "risk_clarification") {
      rules.push("Ask one clear clarification question.");
      rules.push("Do not lecture.");
      rules.push("Do not assume emergency if context is unclear.");
    }

    if (contractPrimary === "safety") {
      rules.push("Lead with calm direct safety language.");
      rules.push("Avoid poetic or philosophical language.");
    }

    if (contractPrimary === "medical_body") {
      rules.push("Lead with body/medical next step.");
      rules.push("Avoid emotional interpretation before body stabilization.");
    }

    if (contractPrimary === "builder") {
      rules.push("Be practical and paste-ready when code is requested.");
      rules.push("Avoid therapy language unless explicitly needed.");
    }

    if (responseShape === "multi_question_triage") {
      rules.push("Acknowledge multiple lanes without treating them equally.");
      rules.push("Use primary/support/brief/context/deferred structure when useful.");
    }

    return rules;
  },

  getOpeningLine(voice = {}) {
    const openings = {
      risk_clarification:
        "I need to clarify the safety part before I answer the rest.",

      safety_grounding:
        "Safety comes first here.",

      body_first:
        "The body signal needs to come first.",

      triage_acknowledgment:
        "There are a few things happening at once here.",

      family_presence:
        "This is really about protecting your family without abandoning stability.",

      teaching_focus:
        "Let’s make this clear first.",

      chapter_observation:
        "Something feels different about this chapter.",

      pattern_observation:
        "Something stands out to me.",

      emotional_attunement:
        "That sounds heavier than it looks.",

      priority_clarity:
        "I think the priority is becoming clearer.",

      practical_focus:
        "The bottleneck is not the whole system.",

      steady_observation:
        "The thing I notice first is this."
    };

    return openings[voice.openingStyle] || openings.steady_observation;
  }
};