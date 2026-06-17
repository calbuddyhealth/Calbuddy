// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify the user's conversational intent universally.
// V1.1.0
//
// Rules:
// - Classifies conversation type only.
// - Does NOT decide final lane.
// - Does NOT override safety, triage, contract, or response shape.
// - Feeds Situation Map / Triage as advisory context.

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

    const target = this.detectConversationTarget(text, observations);
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

    this.detectQuestionType(text, observations, target, add);
    this.detectTaskType(text, observations, target, add);
    this.detectRelationalType(text, observations, target, add);
    this.detectSelfDisclosureType(text, observations, target, add);
    this.detectConcernType(text, observations, target, add);
    this.detectCreativeType(text, observations, target, add);
    this.detectMemoryType(text, observations, target, add);
    this.detectMetaConversationType(text, observations, target, add);
    this.detectCurrentEventsType(text, observations, target, add);

    const adjustedCandidates = this.applyConflictRules(candidates, target, text);

    adjustedCandidates.sort((a, b) => b.score - a.score);

    const primary =
      adjustedCandidates[0] || {
        type: "general_conversation",
        score: 50,
        reasons: ["No strong specific conversation type detected."]
      };

    return {
      universalConversationClassifierRan: true,
      universalConversationClassifierVersion: this.version,
      universalConversationClassifierSource:
        "ari-universal-conversation-classifier",

      conversationType: primary.type,
      conversationTypeScore: primary.score,
      conversationTypeConfidence: this.confidenceFromScore(primary.score),
      conversationTypeReasons: primary.reasons || [],

      conversationTarget: target,
      conversationCandidates: adjustedCandidates.slice(0, 10),

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

  detectConversationTarget(text = "", observations = []) {
    const target = {
      primary: "unknown",
      confidence: 0.4,
      evidence: [],
      isAssistantTarget: false,
      isUserTarget: false,
      isThirdPartyTarget: false,
      isObjectTarget: false,
      isBodyTarget: false,
      isProjectTarget: false
    };

    const set = (primary, confidence, evidence) => {
      if (confidence > target.confidence) {
        target.primary = primary;
        target.confidence = confidence;
      }

      if (evidence) target.evidence.push(evidence);
    };

    if (this.hasAny(text, [
      "you", "your", "yourself", "ari", "assistant", "chatgpt"
    ])) {
      target.isAssistantTarget = true;
      set("assistant", 0.76, "assistant-directed wording");
    }

    if (this.hasAny(text, [
      "i", "me", "my", "myself", "we", "us", "our"
    ])) {
      target.isUserTarget = true;
      set("user", 0.72, "first-person wording");
    }

    if (this.hasAny(text, [
      "he", "she", "they", "him", "her", "them",
      "my wife", "my husband", "my girlfriend", "my boyfriend",
      "my father", "my dad", "my mother", "my mom",
      "my child", "my kids", "my family", "my friend", "my boss"
    ])) {
      target.isThirdPartyTarget = true;
      set("third_party", 0.74, "third-party or relationship wording");
    }

    if (this.hasAny(text, [
      "code", "file", "html", "css", "javascript", "engine",
      "pipeline", "system", "app", "github", "supabase"
    ])) {
      target.isProjectTarget = true;
      target.isObjectTarget = true;
      set("project_or_system", 0.82, "project/system wording");
    }

    if (this.hasAny(text, [
      "pain", "fever", "bleeding", "pregnant", "vomiting",
      "diarrhea", "constipation", "poop", "breathing", "dizzy",
      "fainting", "swallow", "cough", "symptom"
    ])) {
      target.isBodyTarget = true;
      set("body_or_health", 0.82, "body/health wording");
    }

    return target;
  },

  detectQuestionType(text = "", observations = [], target = {}, add) {
    if (this.hasAny(text, ["what is", "define", "meaning of", "explain"])) {
      add("knowledge_question", 80, "User is asking for explanation or definition.");
    }

    if (this.hasAny(text, ["why", "how does", "how come"])) {
      add("explanation_question", 78, "User is asking why or how something works.");
    }

    if (this.hasAny(text, ["how do i", "how can i", "how to"])) {
      add("instruction_question", 82, "User is asking how to do something.");
    }

    if (this.hasAny(text, [
      "should i",
      "what should i",
      "which should i",
      "what do i do",
      "what should we",
      "should we"
    ])) {
      add("decision_question", 88, "User is asking for a decision or recommendation.");
    }

    if (
      this.hasAny(text, ["do you think", "what do you think", "your opinion"]) &&
      !this.isAriSelfTarget(text)
    ) {
      add("opinion_request", 75, "User is asking for perspective or opinion.");
    }
  },

  detectTaskType(text = "", observations = [], target = {}, add) {
    if (target.isProjectTarget || this.hasAny(text, [
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
      "update this file",
      "replace this file"
    ])) {
      add("builder_task", 90, "User is asking for code, debugging, or project-building help.");
    }

    if (this.hasAny(text, [
      "write",
      "rewrite",
      "draft",
      "make this sound",
      "summarize",
      "format",
      "email",
      "essay",
      "paper",
      "presentation",
      "speech"
    ])) {
      add("writing_task", 78, "User is asking for writing or rewriting help.");
    }

    if (this.hasAny(text, [
      "calculate",
      "how many",
      "convert",
      "what is the total",
      "percentage",
      "math"
    ])) {
      add("calculation_task", 72, "User may be asking for calculation or conversion.");
    }
  },

  detectRelationalType(text = "", observations = [], target = {}, add) {
    if (target.isThirdPartyTarget || this.hasAny(text, [
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
      "my family",
      "my kids",
      "my spouse",
      "my partner"
    ])) {
      add("relationship_or_family_context", 78, "User is discussing a close person or relationship.");
    }

    if (this.hasAny(text, [
      "what should i say",
      "how do i tell",
      "how should i respond",
      "text back",
      "apologize",
      "tell them",
      "talk to them"
    ])) {
      add("interpersonal_response_help", 82, "User wants help responding to another person.");
    }
  },

  detectSelfDisclosureType(text = "", observations = [], target = {}, add) {
    if (this.isAriSelfTarget(text)) {
      add(
        "ari_self_or_perspective_question",
        92,
        "User is asking about Ari's identity, stance, or perspective."
      );
    }

    if (this.hasAny(text, [
      "your political views",
      "your politics",
      "are you liberal",
      "are you conservative",
      "who do you support politically",
      "what party do you support",
      "your religion",
      "your faith",
      "your beliefs",
      "your moral view",
      "your ethics",
      "your opinion on god",
      "do you believe in god"
    ])) {
      add(
        "ari_self_or_perspective_question",
        92,
        "User is asking about Ari's values, beliefs, politics, religion, or worldview."
      );
    }
  },

  detectConcernType(text = "", observations = [], target = {}, add) {
    if (target.isBodyTarget || this.hasAny(text, [
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
      "constipation",
      "poop",
      "stroke",
      "seizure",
      "swallow",
      "cough"
    ])) {
      add("medical_or_body_concern", 88, "User is describing a body or medical concern.");
    }

    if (this.hasAny(text, [
      "overwhelmed",
      "stressed",
      "sad",
      "angry",
      "lonely",
      "anxious",
      "worried",
      "scared",
      "burned out",
      "burnt out",
      "hurt",
      "ashamed",
      "guilty"
    ])) {
      add("emotional_concern", 78, "User is expressing emotional distress or concern.");
    }

    if (this.hasAny(text, [
      "unsafe",
      "danger",
      "hurt myself",
      "kill myself",
      "suicide",
      "hurt someone",
      "abuse",
      "threat",
      "weapon"
    ])) {
      add("safety_concern", 95, "User may be describing safety risk.");
    }
  },

  detectCreativeType(text = "", observations = [], target = {}, add) {
    if (this.hasAny(text, [
      "brainstorm",
      "ideas",
      "imagine",
      "design",
      "create a concept",
      "what would it look like",
      "make an image",
      "generate an image",
      "mockup"
    ])) {
      add("creative_or_design_conversation", 74, "User is asking for ideation or design thinking.");
    }
  },

  detectMemoryType(text = "", observations = [], target = {}, add) {
    if (this.hasAny(text, [
      "remember",
      "don't forget",
      "dont forget",
      "save this",
      "store this",
      "from now on",
      "going forward",
      "note that"
    ])) {
      add("memory_request", 90, "User is asking Ari to remember something.");
    }
  },

  detectMetaConversationType(text = "", observations = [], target = {}, add) {
    if (this.hasAny(text, [
      "why did you answer",
      "why are you saying",
      "you misunderstood",
      "that's not what i meant",
      "you keep",
      "you are confused",
      "the problem is",
      "this should be universal",
      "big picture problem"
    ])) {
      add("meta_conversation_or_correction", 84, "User is correcting Ari or discussing the conversation/system behavior.");
    }
  },

  detectCurrentEventsType(text = "", observations = [], target = {}, add) {
    if (this.hasAny(text, [
      "latest",
      "current",
      "today",
      "news",
      "recent",
      "right now",
      "this year",
      "currently"
    ])) {
      add("current_information_request", 76, "User may need current or time-sensitive information.");
    }
  },

  applyConflictRules(candidates = [], target = {}, text = "") {
    return candidates.map(candidate => {
      const copy = {
        ...candidate,
        reasons: [...(candidate.reasons || [])]
      };

      if (
        copy.type === "ari_self_or_perspective_question" &&
        !this.isAriSelfTarget(text)
      ) {
        copy.score = Math.max(0, copy.score - 40);
        copy.reasons.push("Reduced: assistant self-target was not explicit.");
      }

      if (
        copy.type === "opinion_request" &&
        target.isThirdPartyTarget &&
        !this.isAriSelfTarget(text)
      ) {
        copy.score = Math.min(100, copy.score + 10);
        copy.reasons.push("Boosted: opinion is about a third party, not Ari.");
      }

      if (
        copy.type === "relationship_or_family_context" &&
        target.isThirdPartyTarget
      ) {
        copy.score = Math.min(100, copy.score + 10);
        copy.reasons.push("Boosted: third-party relationship target detected.");
      }

      return copy;
    }).filter(item => item.score > 0);
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
      "your political views",
      "your politics",
      "are you liberal",
      "are you conservative",
      "what party do you support",
      "your religion",
      "your faith",
      "your worldview",
      "your moral view",
      "your ethics"
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
      relationship_or_family_context: "support_relationship_context",
      interpersonal_response_help: "help_formulate_response",
      ari_self_or_perspective_question: "answer_as_ari_transparently",
      medical_or_body_concern: "body_safety_context",
      emotional_concern: "emotion_support_context",
      safety_concern: "safety_context",
      creative_or_design_conversation: "brainstorm_or_design",
      memory_request: "memory_action_context",
      meta_conversation_or_correction: "repair_understanding_or_explain_behavior",
      current_information_request: "retrieve_or_flag_current_information",
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
      meta_conversation_or_correction: "Acknowledge the correction and repair the model.",
      current_information_request: "Use current-source behavior if available.",
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