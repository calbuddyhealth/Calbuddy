// ari/continuity/ari-conversation-continuity-engine.js
// Ari Conversation Continuity Engine
// Purpose: Preserve current thread context without controlling routing.
// V1.0.0 — Advisory Thread State

window.Ari = window.Ari || {};

window.AriConversationContinuityEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const prior =
      summary.conversationState ||
      summary.threadState ||
      window.Ari.conversationState ||
      {};

    const followUp = this.detectFollowUp(text);
    const topic = this.detectTopic(text, summary, prior);
    const intent = this.detectIntent(text);
    const unresolvedItems = this.detectUnresolvedItems(text, prior);
    const nextStep = this.detectNextStep(text, intent, prior);

    const continuityState = {
      continuityEngineRan: true,
      continuityEngineVersion: this.version,
      continuityEngineSource: "ari-conversation-continuity-engine",

      threadId: prior.threadId || null,
      currentTopic: topic,
      previousTopic: prior.currentTopic || null,

      followUpDetected: followUp.detected,
      followUpType: followUp.type,
      followUpConfidence: followUp.confidence,

      lastUserIntent: intent,
      previousAnswerSummary: prior.previousAnswerSummary || null,

      unresolvedItems,
      nextStep,

      shouldReusePriorContext:
        followUp.detected ||
        Boolean(prior.currentTopic && text.length < 80),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation"
      ]
    };

    window.Ari.conversationState = {
      ...prior,
      ...continuityState
    };

    return {
      continuityState,
      conversationContinuity: continuityState,
      threadState: continuityState,

      continuityEngineRan: true,
      continuityEngineVersion: this.version,
      continuityEngineSource: "ari-conversation-continuity-engine",

      currentTopic: continuityState.currentTopic,
      followUpDetected: continuityState.followUpDetected,
      followUpType: continuityState.followUpType,
      shouldReusePriorContext: continuityState.shouldReusePriorContext,
      unresolvedItems: continuityState.unresolvedItems,
      nextStep: continuityState.nextStep
    };
  },

  detectFollowUp(text = "") {
    if (!text) {
      return { detected: false, type: "none", confidence: 0 };
    }

    const patterns = [
      ["continuation", ["next", "go on", "continue", "keep going", "done", "what next"]],
      ["clarification", ["what do you mean", "explain that", "why", "how so"]],
      ["correction", ["no", "not that", "i meant", "actually", "change that"]],
      ["implementation", ["send code", "give me the code", "where do i place", "full code"]],
      ["comparison", ["what about", "compare", "difference", "versus", "vs"]]
    ];

    for (const [type, terms] of patterns) {
      if (terms.some(term => text.includes(term))) {
        return { detected: true, type, confidence: 0.82 };
      }
    }

    if (text.split(/\s+/).length <= 6) {
      return { detected: true, type: "short_contextual_reply", confidence: 0.62 };
    }

    return { detected: false, type: "none", confidence: 0.2 };
  },

  detectTopic(text = "", summary = {}, prior = {}) {
    if (this.hasAny(text, ["memory", "remember", "supabase", "stored"])) {
      return "memory_architecture";
    }

    if (this.hasAny(text, ["relationship", "trust", "user profile", "preferences"])) {
      return "relationship_modeling";
    }

    if (this.hasAny(text, ["continuity", "thread", "follow up", "conversation"])) {
      return "conversation_continuity";
    }

    if (this.hasAny(text, ["pipeline", "core summary", "ari lab", "html"])) {
      return "ari_rebirth_pipeline_integration";
    }

    if (this.hasAny(text, ["character", "identity", "belief", "ari self"])) {
      return "ari_character_context";
    }

    if (this.hasAny(text, ["reasoning", "case model", "decision"])) {
      return "ari_reasoning_engine";
    }

    return prior.currentTopic || summary.currentTopic || "general_thread";
  },

  detectIntent(text = "") {
    if (this.hasAny(text, ["send code", "full code", "create file"])) {
      return "build_code";
    }

    if (this.hasAny(text, ["where do i place", "where exactly", "update html", "pipeline"])) {
      return "integration_help";
    }

    if (this.hasAny(text, ["what do you think", "will it work", "is it worth"])) {
      return "architecture_evaluation";
    }

    if (this.hasAny(text, ["what is", "explain", "how does"])) {
      return "understanding_request";
    }

    return "continue_conversation";
  },

  detectUnresolvedItems(text = "", prior = {}) {
    const items = Array.isArray(prior.unresolvedItems)
      ? [...prior.unresolvedItems]
      : [];

    if (this.hasAny(text, ["memory", "relationship", "continuity"])) {
      this.addUnique(items, "Design and integrate continuity, memory, and relationship systems.");
    }

    if (this.hasAny(text, ["html", "ari lab"])) {
      this.addUnique(items, "Update Ari Lab HTML script tags and debug output.");
    }

    if (this.hasAny(text, ["core summary"])) {
      this.addUnique(items, "Add continuity, memory, and relationship fields to core summary.");
    }

    if (this.hasAny(text, ["pipeline"])) {
      this.addUnique(items, "Insert advisory context engines into Ari Rebirth pipeline.");
    }

    return items.slice(-8);
  },

  detectNextStep(text = "", intent = "", prior = {}) {
    if (intent === "build_code") return "Create or update the requested Ari engine file.";
    if (intent === "integration_help") return "Show exact placement in the relevant file.";
    if (prior.nextStep) return prior.nextStep;
    return "Continue building Ari Rebirth in safe modular order.";
  },

  addUnique(list = [], value = "") {
    if (!value || list.includes(value)) return;
    list.push(value);
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(String(term).toLowerCase()));
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONVERSATION CONTINUITY ENGINE LOADED:",
  window.AriConversationContinuityEngine?.version
);