// ari/continuity/ari-conversation-continuity-engine.js
// Ari Conversation Continuity Engine
// Purpose: Preserve active thread context without controlling routing.
// V2.0.0 — Universal Continuity / Advisory Only

window.Ari = window.Ari || {};

window.AriConversationContinuityEngine = {
  version: "2.0.0", 

  async analyze(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = this.normalize(rawText);

    const storedThread =
      window.AriThreadStore?.load
        ? await window.AriThreadStore.load(summary)
        : {};

    const prior =
      summary.conversationState ||
      summary.threadState ||
      storedThread.threadState ||
      window.Ari.conversationState ||
      {};

    const previousMessages = this.cleanLastMessages(prior.lastMessages || []);
    const followUp = this.detectFollowUp(text, rawText, prior, previousMessages);
    const topic = this.detectTopic(text, summary, prior, previousMessages);
    const intent = this.detectIntent(text, topic, followUp);
    const unresolvedItems = this.detectUnresolvedItems(text, topic, prior);
    const nextStep = this.detectNextStep(text, intent, topic, prior);

    const lastMessages = this.appendMessage(previousMessages, {
      role: "user",
      text: rawText,
      createdAt: new Date().toISOString()
    });

    const continuityState = {
      conversationContinuityEngineRan: true,
      conversationContinuityEngineVersion: this.version,
      conversationContinuityEngineSource: "ari-conversation-continuity-engine",

      continuityEngineRan: true,
      continuityEngineVersion: this.version,
      continuityEngineSource: "ari-conversation-continuity-engine",

      threadId: prior.threadId || null,

      currentTopic: topic,
      previousTopic: prior.currentTopic || null,

      lastMessages,

      followUpDetected: followUp.detected,
      followUpType: followUp.type,
      followUpConfidence: followUp.confidence,

      lastUserIntent: intent,
      previousAnswerSummary: prior.previousAnswerSummary || prior.lastFinalResponse || null,

      unresolvedItems,
      nextStep,

      shouldReusePriorContext: this.shouldReusePriorContext({
        text,
        topic,
        prior,
        followUp,
        lastMessages
      }),

      continuitySummary: this.buildContinuitySummary({
        topic,
        intent,
        followUp,
        lastMessages,
        unresolvedItems,
        nextStep
      }),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation",
        "recommendation"
      ]
    };

    window.Ari.conversationState = {
      ...prior,
      ...continuityState
    };

    if (window.AriThreadStore?.save) {
      await window.AriThreadStore.save(window.Ari.conversationState);
    }

    return {
      continuityState,
      conversationContinuity: continuityState,
      threadState: continuityState,

      conversationContinuityEngineRan: true,
      conversationContinuityEngineVersion: this.version,
      conversationContinuityEngineSource: "ari-conversation-continuity-engine",

      continuityEngineRan: true,
      continuityEngineVersion: this.version,
      continuityEngineSource: "ari-conversation-continuity-engine",

      currentTopic: continuityState.currentTopic,
      previousTopic: continuityState.previousTopic,

      followUpDetected: continuityState.followUpDetected,
      followUpType: continuityState.followUpType,
      followUpConfidence: continuityState.followUpConfidence,

      shouldReusePriorContext: continuityState.shouldReusePriorContext,

      lastMessages: continuityState.lastMessages,
      unresolvedItems: continuityState.unresolvedItems,
      nextStep: continuityState.nextStep,
      continuitySummary: continuityState.continuitySummary,

      authority: "advisory_context_only"
    };
  },
    detectFollowUp(text = "", rawText = "", prior = {}, previousMessages = []) {
    if (!text) {
      return { detected: false, type: "none", confidence: 0 };
    }

    if (this.hasExplicitReset(text)) {
      return { detected: false, type: "topic_reset", confidence: 0.9 };
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasPriorContext =
      Boolean(prior.currentTopic) ||
      previousMessages.length > 0 ||
      Boolean(prior.continuitySummary);

    const directPatterns = [
      ["continuation", ["next", "go on", "continue", "keep going", "done", "what next"]],
      ["clarification", ["what do you mean", "explain that", "why", "how so"]],
      ["correction", ["no", "not that", "i meant", "actually", "change that"]],
      ["implementation", ["send code", "give me the code", "where do i place", "full code"]],
      ["comparison", ["what about", "compare", "difference", "versus", "vs"]]
    ];

    for (const [type, terms] of directPatterns) {
      if (terms.some(term => text.includes(term))) {
        return { detected: true, type, confidence: 0.86 };
      }
    }

    if (
      hasPriorContext &&
      this.hasAny(text, [
        "what should i do",
        "what kind of plan",
        "what plan",
        "what do you recommend",
        "what would you do",
        "what is the next step",
        "next step",
        "should i",
        "do you think i should",
        "how should i handle",
        "how do i move forward"
      ])
    ) {
      return {
        detected: true,
        type: "contextual_action_or_plan_request",
        confidence: 0.86
      };
    }

    if (
      hasPriorContext &&
      this.hasAny(text, [
        "it",
        "this",
        "that",
        "they",
        "them",
        "he",
        "she",
        "those",
        "same thing"
      ]) &&
      wordCount <= 18
    ) {
      return {
        detected: true,
        type: "pronoun_or_reference_follow_up",
        confidence: 0.82
      };
    }

    if (hasPriorContext && wordCount <= 8) {
      return {
        detected: true,
        type: "short_contextual_reply",
        confidence: 0.7
      };
    }

    if (
      hasPriorContext &&
      wordCount <= 14 &&
      text.includes("?")
    ) {
      return {
        detected: true,
        type: "short_contextual_question",
        confidence: 0.72
      };
    }

    return { detected: false, type: "none", confidence: 0.2 };
  },

  detectTopic(text = "", summary = {}, prior = {}, previousMessages = []) {
    if (this.hasExplicitReset(text)) {
      return this.topicFromCurrentText(text) || "general_thread";
    }

    const currentTopic = this.topicFromCurrentText(text);

    if (currentTopic && currentTopic !== "general_thread") {
      return currentTopic;
    }

    const priorTopic = prior.currentTopic || summary.currentTopic || null;

    if (
      priorTopic &&
      this.looksContextual(text, previousMessages)
    ) {
      return priorTopic;
    }

    return priorTopic || "general_thread";
  },

  topicFromCurrentText(text = "") {
    if (this.hasAny(text, ["car", "vehicle", "auto loan", "credit", "lease", "finance", "dealership", "down payment", "apr"])) {
      return "car_buying_financial_planning";
    }

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

    if (this.hasAny(text, ["composer", "language", "response wording", "mouth"])) {
      return "ari_language_composition";
    }

    if (this.hasAny(text, ["observer", "signals", "evidence"])) {
      return "ari_observer_system";
    }

    return "general_thread";
  },
    detectIntent(text = "", topic = "general_thread", followUp = {}) {
    if (this.hasAny(text, ["send code", "full code", "create file"])) {
      return "build_code";
    }

    if (this.hasAny(text, ["where do i place", "where exactly", "update html", "pipeline"])) {
      return "integration_help";
    }

    if (this.hasAny(text, ["what do you think", "will it work", "is it worth"])) {
      return "architecture_evaluation";
    }

    if (this.hasAny(text, ["what plan", "what kind of plan", "what should i do", "what do you recommend", "next step"])) {
      return "plan_or_next_step_request";
    }

    if (this.hasAny(text, ["what is", "explain", "how does", "why"])) {
      return "understanding_request";
    }

    if (followUp.detected) {
      return "continue_active_context";
    }

    return "continue_conversation";
  },

  detectUnresolvedItems(text = "", topic = "", prior = {}) {
    const items = Array.isArray(prior.unresolvedItems)
      ? [...prior.unresolvedItems]
      : [];

    if (topic === "car_buying_financial_planning") {
      this.addUnique(items, "Preserve the user's car-buying plan context.");
    }

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

  detectNextStep(text = "", intent = "", topic = "", prior = {}) {
    if (intent === "build_code") return "Create or update the requested Ari engine file.";
    if (intent === "integration_help") return "Show exact placement in the relevant file.";
    if (intent === "plan_or_next_step_request" && topic === "car_buying_financial_planning") {
      return "Use the prior car-buying context to recommend a practical purchase plan.";
    }
    if (intent === "plan_or_next_step_request") {
      return "Use available context to recommend a practical plan.";
    }
    if (prior.nextStep) return prior.nextStep;
    return "Continue the active thread without inventing missing context.";
  },

  shouldReusePriorContext({ text = "", topic = "", prior = {}, followUp = {}, lastMessages = [] } = {}) {
    if (this.hasExplicitReset(text)) return false;
    if (followUp.detected) return true;
    if (prior.currentTopic && topic === prior.currentTopic && text.split(/\s+/).length < 20) return true;
    if (lastMessages.length > 1 && this.looksContextual(text, lastMessages)) return true;
    return false;
  },

  looksContextual(text = "", previousMessages = []) {
    if (!text) return false;

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount <= 8) return true;

    if (
      wordCount <= 18 &&
      this.hasAny(text, [
        "it",
        "this",
        "that",
        "they",
        "them",
        "he",
        "she",
        "what should",
        "what plan",
        "next step",
        "do you think"
      ])
    ) {
      return true;
    }

    return false;
  },
    buildContinuitySummary({ topic, intent, followUp, lastMessages, unresolvedItems, nextStep }) {
    return {
      topic,
      intent,
      followUpType: followUp.type,
      followUpConfidence: followUp.confidence,
      recentUserMessages: lastMessages
        .filter(m => m.role === "user" && m.text)
        .map(m => m.text)
        .slice(-4),
      unresolvedItems,
      nextStep
    };
  },

  cleanLastMessages(messages = []) {
    return (messages || [])
      .filter(message => message && String(message.text || "").trim())
      .map(message => ({
        role: message.role || "user",
        text: String(message.text || "").trim(),
        createdAt: message.createdAt || null
      }))
      .slice(-8);
  },

  appendMessage(messages = [], message = {}) {
    const text = String(message.text || "").trim();
    if (!text) return messages.slice(-8);

    return [
      ...messages,
      {
        role: message.role || "user",
        text,
        createdAt: message.createdAt || new Date().toISOString()
      }
    ].slice(-8);
  },

  hasExplicitReset(text = "") {
    return this.hasAny(text, [
      "new topic",
      "separate question",
      "different question",
      "forget that",
      "start over",
      "unrelated"
    ]);
  },

  addUnique(list = [], value = "") {
    if (!value || list.includes(value)) return;
    list.push(value);
  },

  hasAny(text = "", terms = []) {
    return terms.some(term =>
      String(text || "").includes(String(term).toLowerCase())
    );
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