// ari/continuity/ari-conversation-meaning-history.js
// V1.0.0

window.Ari = window.Ari || {};

window.Ari.conversationMeaningHistory = {
  version: "1.0.0",

  build(summary = {}) {
    const raw = summary.userMessage || summary.message || summary.input || "";
    const previous = summary.threadState?.conversationMeaningHistory || [];

    const entry = {
      turnId: `turn_${Date.now()}`,
      userText: raw,
      resolvedUserQuestion: summary.resolvedUserQuestion || raw,

      activeSubject:
        summary.resolvedPrimarySubject ||
        summary.activeSubject ||
        summary.threadState?.activeSubject ||
        null,

      activeIssue:
        summary.activeIssue ||
        summary.situationMap?.situations?.[0] ||
        summary.threadState?.activeIssue ||
        null,

      activeGoal:
        summary.activeGoal ||
        summary.threadState?.activeGoal ||
        null,

      situationFamily:
        summary.situationMap?.situationFamily ||
        summary.situationFamily ||
        null,

      primaryNeed:
        summary.primaryHumanNeed ||
        summary.situationMap?.primaryNeed ||
        null,

      primaryLane:
        summary.situationContract?.primary ||
        summary.triage?.primaryLane ||
        null,

      ariRecommendation:
        summary.reasoningRecommendation ||
        summary.reasoning?.recommendation?.summary ||
        this.extractRecommendation(summary.finalResponse),

      ariReason:
        summary.reasoningAnswer ||
        summary.situationContract?.reasons?.[0] ||
        null,

      finalResponse: summary.finalResponse || null,
      createdAt: new Date().toISOString()
    };

    const history = [...previous, entry]
      .filter(Boolean)
      .slice(-12);

    return {
      conversationMeaningHistoryRan: true,
      conversationMeaningHistoryVersion: this.version,
      conversationMeaningHistorySource: "ari-conversation-meaning-history",
      conversationMeaningHistory: history,
      latestConversationMeaning: entry
    };
  },

  getLastMeaning(summary = {}) {
    const history =
      summary.conversationMeaningHistory ||
      summary.threadState?.conversationMeaningHistory ||
      [];

    return history[history.length - 1] || null;
  },

  extractRecommendation(text = "") {
    const clean = String(text || "").trim();
    if (!clean) return null;

    const firstSentence = clean.split(/[.!?]/)[0];
    return firstSentence || clean.slice(0, 180);
  }
};

console.log(
  "ARI CONVERSATION MEANING HISTORY LOADED:",
  window.Ari.conversationMeaningHistory?.version
);