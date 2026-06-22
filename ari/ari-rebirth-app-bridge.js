// ari/ari-rebirth-app-bridge.js
// Connects Ari Rebirth to the real CalBuddy app.
// Keeps Ari Lab separate.
// Rebirth-only: no old Ari fallback.

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "1.0.1",

  async ask(message, options = {}) {
    if (!message || !String(message).trim()) {
      return {
        reply: "Say something first.",
        emotion: "idle",
        source: "ari-rebirth-app-bridge"
      };
    }

    if (!window.Ari?.core) {
      return {
        reply: "Ari Rebirth core is not loaded yet.",
        emotion: "concerned",
        source: "ari-rebirth-app-bridge"
      };
    }

    if (
      typeof window.Ari.core.analyzeMessage !== "function" ||
      typeof window.Ari.core.createSystemSummary !== "function"
    ) {
      return {
        reply: "Ari Core is loaded, but its required functions are missing.",
        emotion: "concerned",
        source: "ari-rebirth-app-bridge"
      };
    }

    if (
      !window.AriRebirthPipeline ||
      typeof window.AriRebirthPipeline.run !== "function"
    ) {
      return {
        reply: "Ari Rebirth pipeline is not loaded yet.",
        emotion: "concerned",
        source: "ari-rebirth-app-bridge"
      };
    }

    const cleanMessage = String(message || "").trim();

    const analysis = window.Ari.core.analyzeMessage(cleanMessage, options);

    let summary = window.Ari.core.createSystemSummary(analysis);

    summary.userMessage = cleanMessage;
    summary.message = cleanMessage;
    summary.input = cleanMessage;
    summary.normalizedMessage = cleanMessage.toLowerCase().trim();

    summary.appContext = {
      source: options.source || "unknown",
      appMode: options.appMode || "rebirth-only",
      goals: options.goals || null,
      meals: options.meals || [],
      todayLog: options.todayLog || [],
      user: options.user || null
    };

    summary = await window.AriRebirthPipeline.run(summary);

    const reply =
      summary.finalResponse ||
      summary.compressedResponse ||
      summary.situationContract?.clarity?.question ||
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "I heard you, but I need a cleaner response path.";

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

    const emotion =
      riskLevel && riskLevel !== "none"
        ? "concerned"
        : primary === "medical_body" || primary === "medical_context"
          ? "concerned"
          : primary === "builder" || primary === "planning" || primary === "coding"
            ? "thinking"
            : primary === "teacher" || primary === "teaching"
              ? "happy"
              : primary === "emotion" || primary === "connection"
                ? "listening"
                : "happy";

    return {
      reply,
      emotion,
      summary,
      analysis,
      source: "ari-rebirth-app-bridge"
    };
  }
};

console.log(
  "ARI REBIRTH APP BRIDGE LOADED:",
  window.AriRebirthAppBridge.version
);