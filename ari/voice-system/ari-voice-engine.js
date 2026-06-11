// ari/voice-system/ari-voice-engine.js
// Ari Voice Engine
// Purpose: Decide how Ari should sound before language is generated.
// V1.0

window.Ari = window.Ari || {};

window.Ari.voiceEngine = {
  version: "1.0.0",

  chooseVoice({
    analysis = {},
    selfReflection = {}
  } = {}) {
    const questionType = analysis.questionType || "understanding";
    const meaning = analysis.meaning || {};
    const insight = analysis.insight || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const executive = analysis.executive || {};
    const route = analysis.route || {};

    const stance =
      selfReflection.stance?.name ||
      route.primaryOrgan ||
      this.chooseStance(questionType);

    const confidence = this.detectConfidence({
      meaning,
      insight
    });

    return {
      stance,
      openingStyle: this.chooseOpeningStyle({ questionType, stance }),
      confidenceStyle: this.chooseConfidenceStyle(confidence),
      confidence,
      warmth: this.chooseWarmth({ questionType, emotionalIntelligence }),
      challenge: this.chooseChallenge({ questionType, insight, executive }),
      depth: this.chooseDepth({ questionType, meaning }),
      structure: this.chooseStructure({ questionType, stance }),
      rhythm: this.chooseRhythm({ questionType, emotionalIntelligence }),
      source: "ari-voice-engine"
    };
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

  detectConfidence({ meaning = {}, insight = {} } = {}) {
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

  chooseOpeningStyle({ questionType = "", stance = "" } = {}) {
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

  chooseWarmth({ questionType = "", emotionalIntelligence = {} } = {}) {
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

  chooseChallenge({ questionType = "", insight = {}, executive = {} } = {}) {
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

  chooseDepth({ questionType = "", meaning = {} } = {}) {
    if (questionType === "meaning") return 85;
    if (questionType === "insight") return 80;
    if (questionType === "emotional") return 65;
    if (questionType === "decision") return 60;
    if (questionType === "building") return 25;
    if (meaning.theme && meaning.theme !== "general_understanding") return 70;

    return 45;
  },

  chooseStructure({ questionType = "", stance = "" } = {}) {
    if (questionType === "meaning" || stance === "storykeeper") {
      return [
        "observation",
        "chapter",
        "meaning",
        "reflection_question"
      ];
    }

    if (questionType === "insight" || stance === "observer") {
      return [
        "observation",
        "pattern",
        "interpretation",
        "question"
      ];
    }

    if (questionType === "emotional" || stance === "companion") {
      return [
        "emotion",
        "need",
        "protection",
        "grounding"
      ];
    }

    if (questionType === "decision" || stance === "steward") {
      return [
        "reality",
        "priority",
        "tradeoff",
        "next_step"
      ];
    }

    if (questionType === "building" || stance === "builder") {
      return [
        "bottleneck",
        "constraint",
        "next_change"
      ];
    }

    return [
      "observation",
      "interpretation",
      "next_step"
    ];
  },

  chooseRhythm({ questionType = "", emotionalIntelligence = {} } = {}) {
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

  getOpeningLine(voice = {}) {
    const openings = {
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