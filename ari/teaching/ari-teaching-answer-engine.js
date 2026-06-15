// ari/teaching/ari-teaching-answer-engine.js
// Ari Teaching Answer Engine
// Purpose: Convert teaching requests into direct explanations.
// V2.0.0

window.AriTeachingAnswerEngine = {
  version: "2.0.0",

  async teach(input = {}) {
    const summary = input.summary || input || {};

    const contractPrimary =
      summary.contractPrimary ||
      summary.primary ||
      summary.situationContractPrimary ||
      summary.situationContract?.primary;

    const responseIntent =
      summary.responseIntent || "";

    const shouldTeach =
      responseIntent === "teach" ||
      responseIntent === "teach_clearly" ||
      contractPrimary === "teacher" ||
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

    const topic = this.extractTopic(summary);

    const knowledgeResult =
      window.AriKnowledgeRouter &&
      typeof window.AriKnowledgeRouter.route === "function"
        ? await window.AriKnowledgeRouter.route(summary)
        : null;

    const knowledgeAnswer =
      knowledgeResult?.knowledgeAnswer ||
      summary.knowledgeAnswer ||
      null;

    let finalAnswer = null;

    if (knowledgeAnswer) {
      finalAnswer = this.shapeTeachingAnswer(
        knowledgeAnswer,
        summary
      );
    } else {
      finalAnswer =
        this.buildFallbackTeachingAnswer(topic);
    }

    return {
      ...(knowledgeResult || {}),

      teachingAnswerEngineRan: true,
      teachingAnswerEngineVersion: this.version,
      teachingAnswerEngineSource: "ari-teaching-answer-engine",

      teachingMode: "teach_directly",
      teachingTopic: topic,
      teachingAnswer: finalAnswer,
      teachingConfidence:
        knowledgeResult?.knowledgeConfidence ||
        "medium",
      teachingSource:
        knowledgeResult?.knowledgeProvider ||
        "teaching-engine",
      teachingCitations:
        knowledgeResult?.knowledgeSources || [],

      knowledgeAnswer: finalAnswer,
      humanTruth: finalAnswer,
      oneLineInsight: finalAnswer,

      forceTeachingAnswer: true,
      suppressUncertaintyRecovery: true,
      suppressReflectionQuestions: true
    };
  },

  shapeTeachingAnswer(answer = "", summary = {}) {
    const clean = String(answer || "").trim();

    if (!clean) return null;

    return clean;
  },

  buildFallbackTeachingAnswer(topic = "") {
    if (!topic) {
      return "I need a topic before I can teach it.";
    }

    return `Here is a simple explanation of ${topic}.`;
  },

  extractTopic(summary = {}) {
    const text =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    return String(text || "")
      .replace(
        /^(what is|what are|how does|how do|why does|explain|teach me about)\s+/i,
        ""
      )
      .replace(/[?.!]+$/g, "")
      .trim();
  }
};