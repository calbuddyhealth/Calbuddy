// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify the user's conversational intent universally.
// V1.1.0

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "1.1.0",

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
        existing.score = Math.min(100, existing.score + score);
        if (reason) existing.reasons.push(reason);
        return;
      }

      candidates.push({
        type,
        score: Math.min(score, 100),
        reasons: reason ? [reason] : [],
        ...meta
      });
    };

    this.detectSafetyAndBody(text, observations, add);
    this.detectAriSelfDisclosure(text, observations, add);
    this.detectWorkplaceConflict(text, observations, add);
    this.detectTaskType(text, observations, add);
    this.detectQuestionType(text, observations, add);
    this.detectRelationalType(text, observations, add);
    this.detectConcernType(text, observations, add);
    this.detectCreativeType(text, observations, add);
    this.detectMemoryType(text, observations, add);

    this.applyUniversalCorrections(text, observations, candidates);

    candidates.sort((a, b) => b.score - a.score);

    const primary =
      candidates[0] || {
        type: "general_conversation",
        score: 50,
        reasons: ["No strong specific conversation type detected."]
      };

    return {
      universalConversationClassifierRan: true,
      universalConversationClassifierVersion: this.version,
      universalConversationClassifierSource: "ari-universal-conversation-classifier",

      conversationType: primary.type,
      conversationTypeScore: primary.score,
      conversationTypeConfidence: this.confidenceFromScore(primary.score),
      conversationTypeReasons: primary.reasons || [],

      conversationCandidates: candidates.slice(0, 8),

      conversationIntent: this.intentForType(primary.type),
      conversationResponseHint: this.responseHintForType(primary.type),

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
  },

  detectSafetyAndBody(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "unsafe", "danger", "hurt myself", "kill myself", "suicide",
        "hurt someone", "abuse", "threat"
      ])
    ) {
      add("safety_concern", 98, "User may be describing safety risk.");
    }

    if (
      this.hasAny(text, [
        "pain", "bleeding", "fever", "pregnant", "chest pain",
        "trouble breathing", "fainting", "dizzy", "vomiting",
        "diarrhea", "stroke", "seizure"
      ])
    ) {
      add("medical_or_body_concern", 90, "User is describing a body or medical concern.");
    }
  },

  detectAriSelfDisclosure(text = "", observations = [], add) {
    if (this.isAriSelfTarget(text)) {
      add(
        "ari_self_or_perspective_question",
        94,
        "User is asking about Ari's identity, stance, values, beliefs, or perspective."
      );
    }
  },

  detectWorkplaceConflict(text = "", observations = [], add) {
    const hasWorkplacePeople = this.hasAny(text, [
      "coworker", "co worker", "coworkers", "team", "boss", "manager",
      "supervisor", "leadership", "employee", "staff", "colleague"
    ]);

    const hasWorkplaceIssue = this.hasAny(text, [
      "report", "reporting", "cutting corners", "corner cutting",
      "rushing", "deny", "denies", "denying", "ethics", "unsafe practice",
      "policy", "violation", "quality", "mistake", "cover up",
      "retaliation", "whistleblow", "complaint", "chain of command"
    ]);

    const hasWorkSetting = this.hasAny(text, [
      "work", "job", "shift", "unit", "clinic", "hospital", "command",
      "workplace", "office", "leadership"
    ]);

    if ((hasWorkplacePeople && hasWorkplaceIssue) || (hasWorkSetting && hasWorkplaceIssue)) {
      add(
        "workplace_conflict_or_ethics",
        94,
        "User is asking about a workplace conflict, reporting concern, ethics issue, or team-pressure problem."
      );
    }
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

    if (
      this.hasAny(text, ["do you think", "what do you think", "your opinion"]) &&
      !this.isAriSelfTarget(text)
    ) {
      add("opinion_request", 75, "User is asking for perspective or opinion.");
    }
  },

  detectTaskType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "code", "javascript", "html", "css", "github", "supabase",
        "vercel", "function", "error", "debug", "fix this",
        "send code", "update this file"
      ])
    ) {
      add("builder_task", 90, "User is asking for code, debugging, or project-building help.");
    }

    if (
      this.hasAny(text, [
        "write", "rewrite", "draft", "make this sound", "summarize",
        "format", "email", "essay", "paper"
      ])
    ) {
      add("writing_task", 78, "User is asking for writing or rewriting help.");
    }

    if (
      this.hasAny(text, [
        "calculate", "how many", "convert", "what is the total", "percentage"
      ])
    ) {
      add("calculation_task", 72, "User may be asking for calculation or conversion.");
    }
  },

  detectRelationalType(text = "", observations = [], add) {
    if (this.isWorkplaceContext(text)) return;

    if (
      this.hasAny(text, [
        "my wife", "my husband", "my spouse", "my fiancé", "my fiance",
        "my girlfriend", "my boyfriend", "my dad", "my mom",
        "my father", "my mother", "my friend", "my family",
        "my child", "my kids", "my son", "my daughter"
      ])
    ) {
      add("relationship_or_family_context", 78, "User is discussing a close personal relationship.");
    }

    if (
      this.hasAny(text, [
        "what should i say", "how do i tell", "how should i respond",
        "text back", "apologize"
      ])
    ) {
      add("interpersonal_response_help", 82, "User wants help responding to another person.");
    }
  },

  detectConcernType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "overwhelmed", "stressed", "sad", "angry", "lonely",
        "anxious", "worried", "scared", "burned out", "burnt out"
      ])
    ) {
      add("emotional_concern", 78, "User is expressing emotional distress or concern.");
    }
  },

  detectCreativeType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "brainstorm", "ideas", "imagine", "design",
        "create a concept", "what would it look like"
      ])
    ) {
      add("creative_or_design_conversation", 74, "User is asking for ideation or design thinking.");
    }
  },

  detectMemoryType(text = "", observations = [], add) {
    if (
      this.hasAny(text, [
        "remember", "don't forget", "dont forget", "save this",
        "store this", "from now on", "going forward", "note that"
      ])
    ) {
      add("memory_request", 90, "User is asking Ari to remember something.");
    }
  },

  applyUniversalCorrections(text = "", observations = [], candidates = []) {
    const workplace = candidates.find(c => c.type === "workplace_conflict_or_ethics");
    const relationship = candidates.find(c => c.type === "relationship_or_family_context");

    if (workplace && relationship) {
      relationship.score = Math.max(0, relationship.score - 45);
      relationship.reasons.push("Reduced: workplace conflict should not be treated as family/relationship context.");
    }

    const ariSelf = candidates.find(c => c.type === "ari_self_or_perspective_question");
    const opinion = candidates.find(c => c.type === "opinion_request");

    if (ariSelf && opinion) {
      opinion.score = Math.max(0, opinion.score - 35);
      opinion.reasons.push("Reduced: Ari-self question is more specific than general opinion request.");
    }
  },

  isWorkplaceContext(text = "") {
    return this.hasAny(text, [
      "coworker", "co worker", "coworkers", "boss", "manager",
      "supervisor", "leadership", "employee", "staff", "team",
      "workplace", "at work", "job", "shift", "unit", "reporting",
      "cutting corners"
    ]);
  },

  isAriSelfTarget(text = "") {
    return this.hasAny(text, [
      "who are you",
      "what are you",
      "what kind of ai are you",
      "are you an ai",
      "are you real",
      "are you conscious",
      "are you alive",
      "do you have feelings",
      "do you have emotions",
      "do you have beliefs",
      "do you believe",
      "what do you believe",
      "what are your beliefs",
      "do you believe in god",
      "your philosophy",
      "your values",
      "what do you value",
      "what is your purpose",
      "what is your role",
      "what do you think about yourself",
      "do you think you are",
      "do you think you're",
      "do you think you have",
      "do you think you can feel",
      "what are your political views",
      "are you liberal",
      "are you conservative",
      "are you religious",
      "what side are you on"
    ]);
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
      workplace_conflict_or_ethics: "workplace_ethics_decision_support",
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
      workplace_conflict_or_ethics:
        "Treat as workplace ethics/conflict. Separate safety, evidence, direct conversation, documentation, and escalation path.",
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