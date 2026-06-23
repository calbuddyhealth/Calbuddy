// ari/ari-rebirth-app-bridge.js
// Connects Ari Rebirth to the real CalBuddy app.
// Keeps Ari Lab separate.
// Rebirth-only: no old Ari fallback.
// V1.1.1 — App Safe / Pipeline Guarded / Action Ready

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "1.1.1",

  async ask(message, options = {}) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) {
      return this.makeResponse({
        reply: "Say something first.",
        emotion: "idle"
      });
    }

    const readiness = this.checkReadiness();

    if (!readiness.ready) {
      return this.makeResponse({
        reply: readiness.message,
        emotion: "concerned",
        error: readiness.error
      });
    }

    try {
      const analysis = window.Ari.core.analyzeMessage(cleanMessage, options);

      let summary = window.Ari.core.createSystemSummary(analysis);

      summary = this.attachAppContext(summary, cleanMessage, options);

      summary = await window.AriRebirthPipeline.run(summary);

      const reply = this.extractReply(summary);
      const emotion = this.chooseEmotion(summary);
      const actions = this.extractActions(summary);

      return this.makeResponse({
        reply,
        emotion,
        actions,
        summary,
        analysis
      });
    } catch (error) {
      console.error("ARI REBIRTH APP BRIDGE ERROR:", error);

      return this.makeResponse({
        reply:
          "Ari Rebirth hit an internal error before finishing the response. The app is safe, but the response path needs fixing.",
        emotion: "concerned",
        error: String(error?.message || error)
      });
    }
  },

  checkReadiness() {
    if (!window.Ari?.core) {
      return {
        ready: false,
        message: "Ari Rebirth core is not loaded yet.",
        error: "missing_window_Ari_core"
      };
    }

    if (typeof window.Ari.core.analyzeMessage !== "function") {
      return {
        ready: false,
        message: "Ari Core is loaded, but analyzeMessage is missing.",
        error: "missing_analyzeMessage"
      };
    }

    if (typeof window.Ari.core.createSystemSummary !== "function") {
      return {
        ready: false,
        message: "Ari Core is loaded, but createSystemSummary is missing.",
        error: "missing_createSystemSummary"
      };
    }

    if (
      !window.AriRebirthPipeline ||
      typeof window.AriRebirthPipeline.run !== "function"
    ) {
      return {
        ready: false,
        message: "Ari Rebirth pipeline is not loaded yet.",
        error: "missing_AriRebirthPipeline_run"
      };
    }

    return {
      ready: true
    };
  },

  attachAppContext(summary = {}, cleanMessage = "", options = {}) {
    const normalizedMessage = cleanMessage.toLowerCase().trim();

    return {
      ...summary,

      userMessage: cleanMessage,
      message: cleanMessage,
      input: cleanMessage,
      normalizedMessage,

      appContext: {
  source: options.source || "calbuddy-health",
  appMode: "rebirth-only",
  page: options.page || "unknown",

  userContext: options.userContext || null,
  coachMemorySummary: options.coachMemorySummary || "",

  goals: options.goals || null,
  meals: Array.isArray(options.meals) ? options.meals : [],
  todayLog: Array.isArray(options.todayLog) ? options.todayLog : [],
  recentMeals: Array.isArray(options.recentMeals) ? options.recentMeals : [],
  favoriteFoods: Array.isArray(options.favoriteFoods) ? options.favoriteFoods : [],
  recentWeights: Array.isArray(options.recentWeights) ? options.recentWeights : [],

  user: options.user || null,
  ownerMode: options.ownerMode === true,
  ariPermissions: options.ariPermissions || {},

  history: Array.isArray(options.history) ? options.history.slice(-20) : [],

  permissions: {
    allowDirectWrites: false,
    requireApprovalForActions: true
  }
}
    };
  },

  extractReply(summary = {}) {
    return this.cleanReply(
      summary.finalResponse ||
        summary.compressedResponse ||
        summary.languageComposerOutput ||
        summary.response ||
        summary.answer ||
        summary.situationContract?.clarity?.question ||
        summary.synthesisRecommendedQuestion ||
        summary.salienceQuestion ||
        summary.recommendedRecoveryQuestion ||
        "I heard you, but I need a cleaner response path."
    );
  },

  cleanReply(reply) {
    const text = String(reply || "").trim();

    if (!text) {
      return "I heard you, but I need a cleaner response path.";
    }

    if (
      text === "Answer the primary lane directly." ||
      text === "Compose final response." ||
      text === "Return final answer."
    ) {
      return "I understand the question, but Ari’s final response writer did not complete the answer.";
    }

    return text;
  },

  chooseEmotion(summary = {}) {
    const primary =
      summary.situationContract?.primary ||
      summary.situationContractPrimary ||
      summary.triage?.primaryLane ||
      summary.triagePrimaryLane ||
      "none";

    const riskLevel =
      summary.safetyContextGate?.riskLevel ||
      summary.safetyRiskLevel ||
      summary.riskLevel ||
      "none";

    if (riskLevel && riskLevel !== "none") return "concerned";

    if (
      primary === "medical_body" ||
      primary === "medical_context" ||
      primary === "safety"
    ) {
      return "concerned";
    }

    if (
      primary === "builder" ||
      primary === "planning" ||
      primary === "coding" ||
      primary === "project_help"
    ) {
      return "thinking";
    }

    if (
      primary === "teacher" ||
      primary === "teaching" ||
      primary === "explanation"
    ) {
      return "happy";
    }

    if (
      primary === "emotion" ||
      primary === "connection" ||
      primary === "relationship"
    ) {
      return "listening";
    }

    return "happy";
  },

  extractActions(summary = {}) {
    const candidates =
      summary.proposedActions ||
      summary.actions ||
      summary.appActions ||
      [];

    if (!Array.isArray(candidates)) return [];

    return candidates.map(action => ({
      ...action,
      requiresApproval: true,
      directWriteAllowed: false
    }));
  },

  makeResponse({
    reply,
    emotion = "idle",
    actions = [],
    summary = null,
    analysis = null,
    error = null
  } = {}) {
    return {
      reply: this.cleanReply(reply),
      emotion,
      actions: Array.isArray(actions) ? actions : [],
      summary,
      analysis,
      error,
      source: "ari-rebirth-app-bridge",
      bridgeVersion: this.version
    };
  }
};

console.log(
  "ARI REBIRTH APP BRIDGE LOADED:",
  window.AriRebirthAppBridge.version
);