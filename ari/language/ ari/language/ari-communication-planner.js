// ari/language/ari-communication-planner.js
// Ari Communication Planner
// Purpose: Decide how Ari should sound like a human before final composition.
// V1.0.0

window.Ari = window.Ari || {};

window.AriCommunicationPlanner = {
  version: "1.0.0",

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
      "keep it concise",
      "short",
      "brief",
      "quick",
      "summarize"
    ]);

    const wantsSeparatedReasoning = this.hasAny(userText, [
      "what we know",
      "what you infer",
      "what could change",
      "why you rejected",
      "distinguish"
    ]);

    const plan = {
      communicationPlannerRan: true,
      communicationPlannerVersion: this.version,
      source: "ari-communication-planner",

      primary,

      answerMode: this.answerMode(primary, wantsSeparatedReasoning),
      humanFeel: this.humanFeel(primary, language),
      reasoningStyle: this.reasoningStyle(primary, wantsSeparatedReasoning),
      structureStyle: this.structureStyle(primary, wantsConcise, wantsSeparatedReasoning),
      emotionalTouch: this.emotionalTouch(primary, language),
      challengeLevel: this.challengeLevel(primary, language),
      endingStyle: this.endingStyle(primary),

      wantsConcise,
      wantsSeparatedReasoning,

      sectionPlan: this.sectionPlan({
        primary,
        wantsConcise,
        wantsSeparatedReasoning,
        reasoning
      }),

      sentenceRules: this.sentenceRules(primary, wantsConcise),

      avoid: [
        "template_dumping",
        "too_many_bullets",
        "fake_depth",
        "generic_questions",
        "overexplaining",
        "robotic_section_labels",
        "repeating_the_same_reason"
      ],

      mustDo: [
        "answer_first",
        "name_the_priority",
        "explain_without_padding",
        "sound_like_a_person",
        "preserve_user_requested_distinctions"
      ]
    };

    return {
      communicationPlan: plan,
      communicationPlannerRan: true,
      communicationPlannerVersion: this.version,
      communicationPlannerSource: "ari-communication-planner"
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
        : "direct_then_context";
    }
    if (primary === "emotion") return "attune_then_truth";
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
      return wantsSeparatedReasoning ? "separated_but_plain" : "woven";
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
    return "light_sections";
  },

  emotionalTouch(primary, language = {}) {
    if (primary === "safety" || primary === "risk_clarification") return "none";
    if (primary === "executive_decision") return "brief";
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
    if (primary === "executive_decision") return "next_step";
    if (primary === "emotion") return "grounding";
    return "clean_close";
  },

  sectionPlan({ primary, wantsConcise, wantsSeparatedReasoning, reasoning }) {
    if (primary === "executive_decision" && wantsSeparatedReasoning) {
      return [
        "recommendation",
        "known",
        "inferred",
        "could_change",
        "rejected_alternatives",
        "next_step"
      ];
    }

    if (primary === "executive_decision") {
      return [
        "recommendation",
        "reason",
        "tradeoff",
        "next_step"
      ];
    }

    if (primary === "builder") {
      return ["answer", "steps", "check"];
    }

    if (primary === "teacher") {
      return ["answer", "explanation", "example"];
    }

    return ["answer", "context", "next_step"];
  },

  sentenceRules(primary, wantsConcise) {
    return {
      maxAverageSentenceLength: wantsConcise ? 18 : 24,
      preferPlainWords: true,
      avoidStackedClauses: true,
      avoidRepeatingOpening: true,
      allowBullets: true,
      maxBulletsPerSection:
        primary === "executive_decision" ? 3 : 4,
      maxSections:
        primary === "executive_decision"
          ? wantsConcise ? 6 : 7
          : wantsConcise ? 3 : 5
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