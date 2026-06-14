// ari/teaching/ari-teaching-answer-engine.js
// Ari Teaching Answer Engine
// Purpose: Turn retrieved knowledge into a clear human explanation.
// V1.0

window.AriTeachingAnswerEngine = {
  version: "1.0.0",

  async teach(input = {}) {
    const summary = input.summary || input || {};

    const router = window.AriKnowledgeRouter;

    if (!router?.route) {
      return this.fail("Knowledge router unavailable.");
    }

    const knowledge = await router.route({ summary });

    if (!knowledge.shouldUseKnowledge) {
      return {
        teachingAnswerEngineRan: true,
        teachingAnswerEngineVersion: this.version,
        teachingAnswerEngineSource: "ari-teaching-answer-engine",
        teachingAnswer: null,
        teachingConfidence: "none",
        teachingReason:
          knowledge.knowledgeReason || "No teaching answer required."
      };
    }

    if (!knowledge.knowledgeAnswer) {
      return this.fail(
        knowledge.knowledgeError ||
        "Knowledge answer unavailable."
      );
    }

    return {
      teachingAnswerEngineRan: true,
      teachingAnswerEngineVersion: this.version,
      teachingAnswerEngineSource: "ari-teaching-answer-engine",

      teachingAnswer: knowledge.knowledgeAnswer,

      teachingConfidence:
        knowledge.knowledgeConfidence || "medium",

      teachingSources:
        knowledge.knowledgeSources || [],

      teachingModel:
        knowledge.knowledgeModel || null,

      teachingReason:
        "Teaching answer generated from knowledge system."
    };
  },

  fail(reason = "Teaching engine failed.") {
    return {
      teachingAnswerEngineRan: true,
      teachingAnswerEngineVersion: this.version,
      teachingAnswerEngineSource: "ari-teaching-answer-engine",

      teachingAnswer: null,
      teachingConfidence: "none",
      teachingSources: [],
      teachingModel: null,
      teachingReason: reason
    };
  }
};