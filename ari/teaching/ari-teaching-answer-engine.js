// ari/teaching/ari-teaching-answer-engine.js
// Ari Teaching Answer Engine
// Purpose: Turn retrieved knowledge into a clear teaching answer.
// V1.0

window.AriTeachingAnswerEngine = {
  version: "1.0.0",

  async teach(input = {}) {
    const summary = input.summary || input || {};

    const shouldTeach =
      summary.responseIntent === "teach_clearly" ||
      summary.domainLead === "knowledge_teaching_domain" ||
      summary.shouldPreferTeaching === true;

    if (!shouldTeach) {
      return {
        teachingAnswerEngineRan: true,
        teachingAnswerEngineVersion: this.version,
        teachingAnswerEngineSource: "ari-teaching-answer-engine",
        teachingMode: "not_needed",
        teachingTopic: null,
        teachingAnswer: null,
        teachingConfidence: "none",
        teachingSource: null,
        teachingCitations: []
      };
    }

    const knowledgeResult =
      window.AriKnowledgeRouter &&
      typeof window.AriKnowledgeRouter.route === "function"
        ? await window.AriKnowledgeRouter.route(summary)
        : null;

    const knowledgeAnswer = knowledgeResult?.knowledgeAnswer || null;

    if (!knowledgeAnswer) {
      return {
        ...(knowledgeResult || {}),

        teachingAnswerEngineRan: true,
        teachingAnswerEngineVersion: this.version,
        teachingAnswerEngineSource: "ari-teaching-answer-engine",

        teachingMode: "knowledge_unavailable",
        teachingTopic: this.extractTopic(summary),
        teachingAnswer:
          "I can explain this clearly, but I need the teaching content to generate the full answer.",
        teachingConfidence: "none",
        teachingSource: "none",
        teachingCitations: []
      };
    }

    const teachingAnswer = this.shapeTeachingAnswer(knowledgeAnswer, summary);

    return {
      ...(knowledgeResult || {}),

      teachingAnswerEngineRan: true,
      teachingAnswerEngineVersion: this.version,
      teachingAnswerEngineSource: "ari-teaching-answer-engine",

      teachingMode: "teach_from_knowledge",
      teachingTopic: this.extractTopic(summary),
      teachingAnswer,
      teachingConfidence: knowledgeResult.knowledgeConfidence || "medium",
      teachingSource: knowledgeResult.knowledgeProvider || "knowledge-router",
      teachingCitations: knowledgeResult.knowledgeSources || [],

      // Let the mouth/truth engine see the actual answer.
      knowledgeAnswer: teachingAnswer,
      humanTruth: teachingAnswer,
      oneLineInsight: teachingAnswer
    };
  },

  shapeTeachingAnswer(answer = "", summary = {}) {
    const clean = String(answer || "").trim();

    if (!clean) return null;

    // Keep OpenAI answer intact for now.
    // Later we can add grade level, analogies, examples, math formatting, etc.
    return clean;
  },

  extractTopic(summary = {}) {
    const text =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    return String(text || "")
      .replace(/^(what is|what are|how does|how do|why does|explain|teach me about)\s+/i, "")
      .replace(/[?.!]+$/g, "")
      .trim();
  }
};