// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify the user's conversational intent universally.
// V1.0.0
//
// Rules:
// - Classifies conversation type only.
// - Does NOT decide final lane.
// - Does NOT override safety, triage, contract, or response shape.
// - Feeds Situation Map / Triage as advisory context.

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "1.0.0",

  classify(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);
    const observations =
      summary.observations ||
      summary.observerEvidence?.observations ||
      [];

    const candidates = [];

    const add = (type, score, reason, meta = {}) => {
      if (!type || !score) return;

      const existing = candidates.find(item => item.type === type);

      if (existing) {
        existing.score += score;
        existing.reasons.push(reason);
        existing.score = Math.min(existing.score, 100);
        return;
      }

      candidates.push({
        type,
        score: Math.min(score, 100),
        reasons: reason ? [reason] : [],
        ...meta
      });
    };

    this.detectQuestionType(text, observations, add);
    this.detectTaskType(text, observations, add);
    this.detectRelationalType(text, observations, add);
    this.detectSelfDisclosureType(text, observations, add);
    this.detectConcernType(text, observations, add);
    this.detectCreativeType(text, observations, add);
    this.detectMemoryType(text, observations, add);

    candidates.sort((a, b) => b.score - a.score);

    const primary =
      candidates[0] || {
        type: "general_conversation",
        score: 50,
        reasons: ["No strong specific conversation type detected."]
      };

    const result = {
      universalConversationClassifierRan: true,
      universalConversationClassifierVersion: this.version,
      universalConversationClassifierSource:
        "ari-universal-conversation-classifier",

      conversationType: primary.type,
      conversationTypeScore: primary.score,
      conversationTypeConfidence: this.confidenceFromScore(primary.score),
      conversationTypeReasons: primary.reasons || [],

      conversationCandidates: candidates.slice(0, 8),

      conversationIntent: this.intentForType(primary.type),
      conversationResponseHint: this.responseHintForType(primary.type),

      // Advisory only.
      conversationAuthority: "classification_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "responseShape",
        "blockedLanes",
        "deferredLanes",
        "finalResponse"
      ]
    };

    return result;
  },

  detectQuestionType(text = "", observations = [], add) {
    if (this.hasAny(text, ["what is", "define", "meaning of", "explain"])) {
      add("knowledge_question", 80, "User is asking for explanation or definition.");
    }

    if (this.hasAny(text, ["why", "how does", "how come"])) {
      add("explanation_question", 78, "User is asking why or how something works.");
    }

    if (this.hasAny(text, ["how do i", "how can i", "how to"])) {
      add("instruction_question", 82, "User is asking how to do something.");
    }

    if (this.hasAny(text, ["should i", "what should i", "which should i", "what do i do"])) {
      add("decision_question", 88, "User is asking for a decision or recommendation.");
    }

    if (this.hasAny(text, ["do you think", "what do you think", "your opinion"])) {
      add("opinion_request", 75, "User is asking for perspective or opinion.");
    }
  },

  detectTaskType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "code",
        "javascript",
        "html",
        "css",
        "github",
        "supabase",
        "vercel",
        "function",
        "error",
        "debug",
        "fix this",
        "send code",
        "update this file"
      ])
    ) {
      add("builder_task", 90, "User is asking for code, debugging, or project-building help.");
    }

    if (
      this.hasAny(text, [
        "write",
        "rewrite",
        "draft",
        "make this sound",
        "summarize",
        "format",
        "email",
        "essay",
        "paper"
      ])
    ) {
      add("writing_task", 78, "User is asking for writing or rewriting help.");
    }

    if (
      this.hasAny(text, [
        "calculate",
        "how many",
        "convert",
        "what is the total",
        "percentage"
      ])
    ) {
      add("calculation_task", 72, "User may be asking for calculation or conversion.");
    }
  },

  detectRelationalType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "my wife",
        "my husband",
        "my fiancé",
        "my fiance",
        "my girlfriend",
        "my boyfriend",
        "my dad",
        "my mom",
        "my father",
        "my mother",
        "my friend",
        "my family"
      ])
    ) {
      add("relationship_or_family_context", 78, "User is discussing a close person or relationship.");
    }

    if (
      this.hasAny(text, [
        "what should i say",
        "how do i tell",
        "how should i respond",
        "text back",
        "apologize"
      ])
    ) {
      add("interpersonal_response_help", 82, "User wants help responding to another person.");
    }
  },

  detectSelfDisclosureType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "who are you",
        "what are you",
        "do you believe",
        "do you think",
        "your philosophy",
        "your values",
        "what do you value",
        "are you conscious",
        "do you have feelings",
        "do you have beliefs",
        "do you believe in god"
      ])
    ) {
      add("ari_self_or_perspective_question", 92, "User is asking about Ari's identity, stance, or perspective.");
    }
  },

  detectConcernType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "pain",
        "bleeding",
        "fever",
        "pregnant",
        "chest pain",
        "trouble breathing",
        "fainting",
        "dizzy",
        "vomiting",
        "diarrhea",
        "stroke",
        "seizure"
      ])
    ) {
      add("medical_or_body_concern", 88, "User is describing a body or medical concern.");
    }

    if (
      this.hasAny(text, [
        "overwhelmed",
        "stressed",
        "sad",
        "angry",
        "lonely",
        "anxious",
        "worried",
        "scared",
        "burned out",
        "burnt out"
      ])
    ) {
      add("emotional_concern", 78, "User is expressing emotional distress or concern.");
    }

    if (
      this.hasAny(text, [
        "unsafe",
        "danger",
        "hurt myself",
        "kill myself",
        "suicide",
        "hurt someone",
        "abuse",
        "threat"
      ])
    ) {
      add("safety_concern", 95, "User may be describing safety risk.");
    }
  },

  detectCreativeType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "brainstorm",
        "ideas",
        "imagine",
        "design",
        "create a concept",
        "what would it look like"
      ])
    ) {
      add("creative_or_design_conversation", 74, "User is asking for ideation or design thinking.");
    }
  },

  detectMemoryType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "remember",
        "don't forget",
        "dont forget",
        "save this",
        "store this",
        "from now on",
        "going forward",
        "note that"
      ])
    ) {
      add("memory_request", 90, "User is asking Ari to remember something.");
    }
  },

  intentForType(type = "") {
    const map = {
      knowledge_question: "explain_or_define",
      explanation_question: "explain_causality",
      instruction_question: "give_steps",
      decision_question: "recommend_or_prioritize",
      opinion_request: "offer_perspective",
      builder_task: "build_debug_or_edit",
      writing_task: "write_or_revise",
      calculation_task: "calculate",
      relationship_or_family_context: "support_relationship_context",
      interpersonal_response_help: "help_formulate_response",
      ari_self_or_perspective_question: "answer_as_ari_transparently",
      medical_or_body_concern: "body_safety_context",
      emotional_concern: "emotion_support_context",
      safety_concern: "safety_context",
      creative_or_design_conversation: "brainstorm_or_design",
      memory_request: "memory_action_context",
      general_conversation: "respond_normally"
    };

    return map[type] || "respond_normally";
  },

  responseHintForType(type = "") {
    const map = {
      knowledge_question: "Teach clearly and directly.",
      explanation_question: "Explain the mechanism or reason.",
      instruction_question: "Give practical steps.",
      decision_question: "Name the priority and next step.",
      opinion_request: "Offer a clear perspective with humility.",
      builder_task: "Debug or build practically.",
      writing_task: "Produce the requested text.",
      calculation_task: "Calculate directly.",
      relationship_or_family_context: "Be grounded and relationally careful.",
      interpersonal_response_help: "Give usable wording.",
      ari_self_or_perspective_question: "Answer from Ari's transparent self-definition.",
      medical_or_body_concern: "Prioritize safety and appropriate escalation.",
      emotional_concern: "Validate briefly, then ground.",
      safety_concern: "Use safety-first response.",
      creative_or_design_conversation: "Generate useful options.",
      memory_request: "Route to memory behavior if available.",
      general_conversation: "Answer normally."
    };

    return map[type] || "Answer normally.";
  },

  confidenceFromScore(score = 0) {
    if (score >= 85) return "high";
    if (score >= 70) return "medium";
    return "low";
  },

  hasAny(text = "", phrases = []) {
    return phrases.some(phrase => this.hasTerm(text, phrase));
  },

  hasTerm(text = "", term = "") {
    const escaped = this.escapeRegex(term);
    const multiWord = String(term).includes(" ");

    if (multiWord) {
      return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
    }

    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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