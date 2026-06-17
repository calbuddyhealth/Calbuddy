// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify conversation type from observer evidence.
// V1.0.0
// Rule: classify only. Do not answer, prioritize, or override safety.

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "1.0.0",

  classify(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const candidates = [];

    const add = (type, score, reason, meta = {}) => {
      if (!type || !score) return;

      const existing = candidates.find(c => c.type === type);

      if (existing) {
        existing.score += score;
        if (reason && !existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }
        return;
      }

      candidates.push({
        type,
        score,
        reasons: reason ? [reason] : [],
        ...meta
      });
    };

    this.classifyFromObserver(observations, add);
    this.classifyFromText(text, add);

    candidates.sort((a, b) => b.score - a.score);

    const primary = candidates[0] || {
      type: "general_conversation",
      score: 40,
      reasons: ["No stronger universal conversation type detected."]
    };

    const confidence = this.toConfidence(primary.score);

    return {
      universalConversationClassifierRan: true,
      universalConversationClassifierVersion: this.version,
      universalConversationClassifierSource:
        "ari-universal-conversation-classifier",

      conversationType: primary.type,
      conversationTypeConfidence: confidence,
      conversationTypeScore: primary.score,
      conversationTypeReasons: primary.reasons || [],

      conversationCandidates: candidates.slice(0, 8),

      suggestedLane: this.toSuggestedLane(primary.type),
      suggestedSpecialistMode: this.toSpecialistMode(primary.type),

      source: "ari-universal-conversation-classifier"
    };
  },

  classifyFromObserver(observations = [], add) {
    observations.forEach(obs => {
      const type = obs.type;
      const domain = obs.domain;
      const questionType = obs.questionType;
      const value = obs.value;

      if (domain === "safety" || type === "safety_language") {
        add("safety_or_crisis", 100, "Safety language observed.");
      }

      if (domain === "body" || type === "body_symptom") {
        add("medical_or_body_concern", 90, "Body or symptom evidence observed.");
      }

      if (domain === "builder" || type === "building_reference") {
        add("build_or_debug_request", 80, "Build, code, app, or debug evidence observed.");
      }

      if (domain === "financial" || type === "money_reference") {
        add("financial_or_resource_decision", 60, "Money or resource evidence observed.");
      }

      if (domain === "emotion" || type === "emotion_word") {
        add("emotional_support", 65, "Emotion word observed.");
      }

      if (domain === "relationship" || domain === "family") {
        add("relationship_or_family", 60, "Relationship or family evidence observed.");
      }

      if (domain === "knowledge" || type === "knowledge_request_phrase") {
        add("knowledge_or_explanation", 55, "Knowledge request evidence observed.");
      }

      if (domain === "memory" || type === "memory_request_phrase") {
        add("memory_request", 80, "Memory request evidence observed.");
      }

      if (domain === "wisdom" || type === "wisdom_reference") {
        add("wisdom_or_values_question", 55, "Wisdom or values evidence observed.");
      }

      if (type === "question_phrase" && questionType === "decision_question") {
        add("decision_support", 70, "Decision question phrase observed.");
      }

      if (type === "question_phrase" && questionType === "instruction_question") {
        add("how_to_instruction", 65, "How-to question phrase observed.");
      }

      if (type === "question_phrase" && questionType === "opinion_request") {
        add("opinion_or_perspective", 55, "Opinion request observed.");
      }

      if (type === "contrast_or_tradeoff_connector") {
        add("decision_support", 35, "Tradeoff connector observed.");
      }

      if (type === "pressure_or_constraint" && value === "obligation") {
        add("decision_support", 35, "Obligation pressure observed.");
      }

      if (type === "pressure_or_constraint" && value === "desire") {
        add("decision_support", 25, "Desire pressure observed.");
      }
    });
  },

  classifyFromText(text = "", add) {
    if (!text) return;

    if (this.hasAny(text, [
      "do you believe in god",
      "are you conscious",
      "do you have feelings",
      "do you have an identity",
      "are you alive",
      "are you real",
      "who are you",
      "what are you"
    ])) {
      add("assistant_identity_question", 95, "User asked about Ari or AI identity.");
    }

    if (this.hasAny(text, [
      "what do you think",
      "what is your opinion",
      "be honest",
      "tell me the truth"
    ])) {
      add("opinion_or_perspective", 60, "User asked for perspective.");
    }

    if (this.hasAny(text, [
      "can you fix",
      "send code",
      "full code",
      "where do i add",
      "what file",
      "debug this",
      "not working",
      "error"
    ])) {
      add("build_or_debug_request", 85, "User asked for code or debugging help.");
    }

    if (this.hasAny(text, [
      "what should i do",
      "should i",
      "should we",
      "which one",
      "best option",
      "what would you do"
    ])) {
      add("decision_support", 80, "User asked for a decision recommendation.");
    }

    if (this.hasAny(text, [
      "explain",
      "what is",
      "why does",
      "how does",
      "teach me",
      "define"
    ])) {
      add("knowledge_or_explanation", 65, "User asked for explanation.");
    }

    if (this.hasAny(text, [
      "i feel",
      "i'm tired",
      "im tired",
      "i am tired",
      "i'm overwhelmed",
      "im overwhelmed",
      "i give up",
      "i'm sad",
      "im sad"
    ])) {
      add("emotional_support", 70, "User expressed emotional state.");
    }

    if (this.hasAny(text, [
      "remember",
      "save this",
      "store this",
      "going forward",
      "from now on",
      "don't forget"
    ])) {
      add("memory_request", 90, "User asked Ari to remember something.");
    }

    if (this.hasAny(text, [
      "my wife",
      "my husband",
      "my fiance",
      "my fiancée",
      "my baby",
      "my child",
      "my dad",
      "my mom",
      "my family"
    ])) {
      add("relationship_or_family", 65, "User referenced close relationship.");
    }

    if (this.hasAny(text, [
      "pain",
      "bleeding",
      "pregnant",
      "fever",
      "vomiting",
      "diarrhea",
      "chest pain",
      "trouble breathing"
    ])) {
      add("medical_or_body_concern", 85, "User mentioned body or medical concern.");
    }
  },

  toSuggestedLane(type = "") {
    const map = {
      safety_or_crisis: "safety",
      medical_or_body_concern: "medical_body",
      build_or_debug_request: "builder",
      financial_or_resource_decision: "executive_decision",
      decision_support: "executive_decision",
      emotional_support: "emotion",
      relationship_or_family: "relationship",
      knowledge_or_explanation: "teacher",
      how_to_instruction: "teacher",
      opinion_or_perspective: "general_understanding",
      assistant_identity_question: "assistant_identity",
      wisdom_or_values_question: "wisdom",
      memory_request: "memory",
      general_conversation: "general_understanding"
    };

    return map[type] || "general_understanding";
  },

  toSpecialistMode(type = "") {
    const map = {
      safety_or_crisis: "protect_safety",
      medical_or_body_concern: "medical_caution",
      build_or_debug_request: "developer",
      financial_or_resource_decision: "planner",
      decision_support: "decision_advisor",
      emotional_support: "companion",
      relationship_or_family: "relationship_support",
      knowledge_or_explanation: "teacher",
      how_to_instruction: "teacher",
      opinion_or_perspective: "perspective",
      assistant_identity_question: "ari_identity",
      wisdom_or_values_question: "wisdom",
      memory_request: "memory",
      general_conversation: "conversation"
    };

    return map[type] || "conversation";
  },

  toConfidence(score = 0) {
    if (score >= 90) return "very_high";
    if (score >= 75) return "high";
    if (score >= 55) return "medium";
    if (score >= 35) return "low";
    return "very_low";
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => text.includes(phrase));
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI UNIVERSAL CONVERSATION CLASSIFIER LOADED:",
  window.AriUniversalConversationClassifier?.version
);