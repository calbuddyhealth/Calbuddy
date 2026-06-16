// ari/language/ari-communication-planner.js
// Ari Communication Planner
// Purpose: Decide how Ari should speak before final composition.
// V1.2.0 — Language Budget + Stop Discipline

window.Ari = window.Ari || {};

window.AriCommunicationPlanner = {
  version: "1.2.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const contract = summary.situationContract || {};
    const language = summary.humanLanguageProfile || {};
    const reasoning = summary.reasoning || {};

    const primary =
      summary.situationContractPrimary ||
      contract.primary ||
      summary.triagePrimaryLane ||
      "general_understanding";

    const userText = this.getText(summary);

    const wantsConcise = this.hasAny(userText, [
      "keep it concise", "concise", "short", "brief", "quick",
      "summarize", "simple", "straight to the point"
    ]);

    const wantsDepth = this.hasAny(userText, [
      "deep", "detailed", "full", "thorough", "explain everything",
      "break it down", "step by step", "why exactly"
    ]);

    const wantsSeparatedReasoning = this.hasAny(userText, [
      "what we know", "what you infer", "what i'm inferring",
      "what could change", "why you rejected", "distinguish", "separate"
    ]);

    const budget = this.languageBudget({
      primary,
      wantsConcise,
      wantsDepth,
      wantsSeparatedReasoning,
      reasoning
    });

    const structureStyle =
      this.structureStyle(primary, wantsConcise, wantsSeparatedReasoning);

    const presentationStyle =
      this.presentationStyle(primary, wantsConcise, wantsSeparatedReasoning, budget);

    const useHeadings =
      this.useHeadings(primary, wantsSeparatedReasoning, budget);

    const plan = {
      communicationPlannerRan: true,
      communicationPlannerVersion: this.version,
      source: "ari-communication-planner",

      primary,

      answerMode: this.answerMode(primary, wantsSeparatedReasoning),
      humanFeel: this.humanFeel(primary, language),
      reasoningStyle: this.reasoningStyle(primary, wantsSeparatedReasoning),
      structureStyle,
      presentationStyle,
      useHeadings,

      emotionalTouch: this.emotionalTouch(primary, language, budget),
      challengeLevel: this.challengeLevel(primary, language),
      endingStyle: this.endingStyle(primary),

      wantsConcise,
      wantsDepth,
      wantsSeparatedReasoning,

      languageBudget: budget,

      sectionPlan: this.sectionPlan({
        primary,
        wantsConcise,
        wantsDepth,
        wantsSeparatedReasoning,
        reasoning
      }),

      sentenceRules: this.sentenceRules(primary, wantsConcise, wantsDepth, budget),

      informationBudget: this.informationBudget(primary, budget),

      stopRules: {
        stopWhenAnswered: true,
        stopAfterNextStep: primary !== "teacher" || !wantsDepth,
        oneQuestionMax: true,
        noSecondSummary: true,
        noGenericCloser: true,
        noExtraWisdomAfterAction: true
      },

      avoid: [
        "template_dumping",
        "too_many_bullets",
        "fake_depth",
        "generic_questions",
        "overexplaining",
        "robotic_section_labels",
        "repeating_the_same_reason",
        "abstract_tradeoff_labels",
        "restating_the_recommendation",
        "emotional_padding_when_validation_none"
      ],

      mustDo: [
        "answer_first",
        "use_user_concrete_terms",
        "one_idea_per_sentence",
        "one_reason_per_recommendation",
        "explain_without_padding",
        "sound_like_a_person",
        "stop_when_answered",
        "preserve_user_requested_distinctions"
      ]
    };

    return {
      communicationPlan: plan,
      communicationPlannerRan: true,
      communicationPlannerVersion: this.version,
      communicationPlannerSource: "ari-communication-planner",

      communicationPresentationStyle: presentationStyle,
      communicationUseHeadings: useHeadings,
      communicationStructureStyle: structureStyle,
      communicationLanguageBudget: budget
    };
  },

  languageBudget({ primary, wantsConcise, wantsDepth, wantsSeparatedReasoning }) {
    if (primary === "risk_clarification") {
      return { targetLength: "tiny", maxSentences: 1, maxWords: 25, maxSections: 1 };
    }

    if (wantsDepth || wantsSeparatedReasoning) {
      return { targetLength: "medium", maxSentences: 10, maxWords: 220, maxSections: 6 };
    }

    if (wantsConcise) {
      return { targetLength: "tiny", maxSentences: 3, maxWords: 70, maxSections: 2 };
    }

    if (primary === "executive_decision") {
      return { targetLength: "short", maxSentences: 4, maxWords: 95, maxSections: 3 };
    }

    if (primary === "builder") {
      return { targetLength: "short", maxSentences: 6, maxWords: 130, maxSections: 4 };
    }

    if (primary === "teacher") {
      return { targetLength: "short", maxSentences: 6, maxWords: 140, maxSections: 3 };
    }

    if (primary === "emotion") {
      return { targetLength: "short", maxSentences: 3, maxWords: 75, maxSections: 2 };
    }

    if (primary === "safety" || primary === "medical_body") {
      return { targetLength: "short", maxSentences: 5, maxWords: 110, maxSections: 3 };
    }

    return { targetLength: "short", maxSentences: 4, maxWords: 90, maxSections: 3 };
  },

  informationBudget(primary, budget = {}) {
    if (primary === "executive_decision") {
      return {
        recommendation: 1,
        supportingReason: 1,
        tradeoff: 0,
        nextAction: 1,
        caveat: 0,
        emotionalValidation: 0
      };
    }

    if (primary === "teacher") {
      return {
        definition: 1,
        explanation: 2,
        example: 1,
        summary: 0
      };
    }

    if (primary === "builder") {
      return {
        diagnosis: 1,
        fix: 1,
        steps: 3,
        check: 1
      };
    }

    if (primary === "emotion") {
      return {
        validation: 1,
        grounding: 1,
        question: 1
      };
    }

    return {
      answer: 1,
      context: 1,
      nextAction: 1
    };
  },

  answerMode(primary, wantsSeparatedReasoning) {
    if (primary === "safety") return "urgent_action_first";
    if (primary === "risk_clarification") return "one_question_only";
    if (primary === "builder") return "steps_first";
    if (primary === "teacher") return "clear_explanation";

    if (primary === "executive_decision") {
      return wantsSeparatedReasoning
        ? "recommendation_then_evidence"
        : "recommendation_reason_next_step";
    }

    if (primary === "emotion") return "attune_then_ground";

    return "direct_then_context";
  },

  humanFeel(primary, language = {}) {
    if (primary === "executive_decision") return "warm_blunt";
    if (primary === "emotion") return "steady_warm";
    if (primary === "builder") return "focused_practical";
    if (primary === "teacher") return "clear_patient";
    if (primary === "safety" || primary === "medical_body") return "calm_direct";

    return language.tone || "natural_direct";
  },

  reasoningStyle(primary, wantsSeparatedReasoning) {
    if (primary === "executive_decision") {
      return wantsSeparatedReasoning ? "separated_but_plain" : "compressed";
    }

    if (primary === "teacher") return "stepwise";
    if (primary === "builder") return "procedural";

    return "woven";
  },

  structureStyle(primary, wantsConcise, wantsSeparatedReasoning) {
    if (wantsConcise && wantsSeparatedReasoning) return "tight_labeled_sections";
    if (wantsConcise) return "tight_paragraphs";
    if (wantsSeparatedReasoning) return "light_labeled_sections";
    if (primary === "builder") return "steps";
    if (primary === "safety" || primary === "medical_body") return "direct_action";
    if (primary === "executive_decision") return "recommendation_reason_action";
    return "light_sections";
  },

  presentationStyle(primary, wantsConcise, wantsSeparatedReasoning, budget = {}) {
    if (primary === "risk_clarification") return "single_question";
    if (wantsSeparatedReasoning) return "structured";
    if (primary === "builder") return "structured";
    if (primary === "safety" || primary === "medical_body") return "structured";
    if (primary === "executive_decision") return "mixed";
    if (wantsConcise || budget.targetLength === "tiny") return "mixed";
    return "conversation";
  },

  useHeadings(primary, wantsSeparatedReasoning, budget = {}) {
    if (primary === "risk_clarification") return false;
    if (wantsSeparatedReasoning) return true;
    if (primary === "builder") return true;
    if (primary === "safety" || primary === "medical_body") return true;
    if (budget.targetLength === "tiny" || budget.targetLength === "short") return false;
    return false;
  },

  emotionalTouch(primary, language = {}, budget = {}) {
    if (primary === "safety" || primary === "risk_clarification") return "none";
    if (primary === "executive_decision") return "none";
    if (primary === "emotion") return "primary";

    return language.validationLevel === "none" ? "none" : "brief";
  },

  challengeLevel(primary, language = {}) {
    if (primary === "executive_decision") return "protective";
    if (primary === "builder") return "direct";
    if (primary === "emotion") return "gentle";

    return language.challenge > 50 ? "firm" : "light";
  },

  endingStyle(primary) {
    if (primary === "risk_clarification") return "question";
    if (primary === "builder") return "next_action";
    if (primary === "executive_decision") return "next_step_then_stop";
    if (primary === "emotion") return "grounding";

    return "clean_close";
  },

  sectionPlan({ primary, wantsConcise, wantsDepth, wantsSeparatedReasoning }) {
    if (primary === "risk_clarification") return ["question"];

    if (primary === "executive_decision" && wantsSeparatedReasoning) {
      return ["recommendation", "known", "inferred", "could_change", "next_step"];
    }

    if (primary === "executive_decision") {
      return ["recommendation", "reason", "next_step"];
    }

    if (primary === "builder") {
      return wantsDepth
        ? ["diagnosis", "fix", "steps", "check"]
        : ["fix", "steps", "check"];
    }

    if (primary === "teacher") {
      return wantsDepth
        ? ["answer", "explanation", "example", "summary"]
        : ["answer", "explanation", "example"];
    }

    if (primary === "emotion") {
      return ["validation", "grounding", "question"];
    }

    return ["answer", "context", "next_step"];
  },

  sentenceRules(primary, wantsConcise, wantsDepth, budget = {}) {
    return {
      maxAverageSentenceLength: wantsConcise ? 16 : 20,
      maxWordsPerSentence: wantsConcise ? 18 : 24,
      maxSentences: budget.maxSentences || 4,
      maxWords: budget.maxWords || 90,

      preferPlainWords: true,
      preferConcreteUserTerms: true,
      avoidStackedClauses: true,
      avoidRepeatingOpening: true,
      avoidDoubleExplanations: true,
      avoidAbstractTradeoffLabels: true,
      avoidGenericWisdom: true,
      noRepeatedJustifications: true,
      noMetaCommentary: true,

      allowBullets: true,
      maxBulletsPerSection:
        primary === "executive_decision" ? 3 : 4,
      maxSections: budget.maxSections || 3
    };
  },

  getText(summary = {}) {
    return String(
      summary.normalizedMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();
  },

  hasAny(text = "", terms = []) {
    return terms.some(term =>
      text.includes(String(term).toLowerCase())
    );
  }
};