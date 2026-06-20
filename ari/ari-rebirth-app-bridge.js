// ari/ari-rebirth-app-bridge.js
// Connects Ari Rebirth to the real CalBuddy app.
// Keeps Ari Lab separate.

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "1.0.0",

  async ask(message, options = {}) {
    if (!message || !String(message).trim()) {
      return {
        reply: "Say something first.",
        emotion: "idle"
      };
    }

    if (!window.Ari?.core) {
      return {
        reply: "Ari Rebirth is not loaded yet.",
        emotion: "concerned"
      };
    }

    const analysis = window.Ari.core.analyzeMessage(message, options);

    let summary = window.Ari.core.createSystemSummary(analysis);

    summary.userMessage = message;
    summary.message = message;
    summary.input = message;
    summary.normalizedMessage = String(message || "").toLowerCase().trim();

    if (
      window.AriRebirthPipeline &&
      typeof window.AriRebirthPipeline.run === "function"
    ) {
      summary = await window.AriRebirthPipeline.run(summary);
    }

    const reply =
      summary.finalResponse ||
      summary.situationContract?.clarity?.question ||
      summary.synthesisRecommendedQuestion ||
      summary.salienceQuestion ||
      summary.recommendedRecoveryQuestion ||
      "I heard you, but I need a cleaner response path.";

    const emotion =
  summary.riskLevel && summary.riskLevel !== "none"
    ? "concerned"
    : summary.situationContract?.primary === "medical_body" ||
      summary.situationContract?.primary === "medical_context"
      ? "concerned"
      : summary.situationContract?.primary === "builder"
        ? "thinking"
        : summary.situationContract?.primary === "teacher"
          ? "happy"
          : summary.situationContract?.primary === "emotion"
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