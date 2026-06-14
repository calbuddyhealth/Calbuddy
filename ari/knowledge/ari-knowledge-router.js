// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Decide when Ari should retrieve outside knowledge.
// V1.0

window.AriKnowledgeRouter = {
  version: "1.0.0",

  async route(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);

    const shouldUseKnowledge = this.shouldUseKnowledge(summary, question);

    if (!shouldUseKnowledge) {
      return {
        knowledgeRouterRan: true,
        knowledgeRouterVersion: this.version,
        knowledgeRouterSource: "ari-knowledge-router",
        shouldUseKnowledge: false,
        knowledgeAnswer: null,
        knowledgeConfidence: "none",
        knowledgeSources: [],
        knowledgeReason: "No external knowledge needed."
      };
    }

    const client = window.AriOpenAIKnowledgeClient;

    if (!client?.ask) {
      return {
        knowledgeRouterRan: true,
        knowledgeRouterVersion: this.version,
        knowledgeRouterSource: "ari-knowledge-router",
        shouldUseKnowledge: true,
        knowledgeAnswer: null,
        knowledgeConfidence: "none",
        knowledgeSources: [],
        knowledgeReason: "Knowledge client unavailable."
      };
    }

    const result = await client.ask({ summary });

    return {
  knowledgeRouterRan: true,
  knowledgeRouterVersion: this.version,
  knowledgeRouterSource: "ari-knowledge-router",

  shouldUseKnowledge: true,

  knowledgeAnswer:
    result.knowledgeAnswer || null,

  knowledgeConfidence:
    result.knowledgeConfidence || "medium",

  knowledgeSources:
    result.knowledgeCitations || [],

  knowledgeProvider:
    result.knowledgeProvider || "openai",

  knowledgeError:
    result.knowledgeError || null,

  openAIKnowledgeUsed:
    result.openAIKnowledgeUsed || false,

  openAIKnowledgeSource:
    result.openAIKnowledgeSource || null,

  knowledgeReason:
    "Question requires outside knowledge."
};
  },

  shouldUseKnowledge(summary = {}, question = "") {
    const intent = summary.responseIntent || "";
    const domainLead = summary.domainLead || "";
    const lower = String(question || "").toLowerCase();

    if (intent === "teach_clearly") return true;
    if (domainLead === "knowledge_teaching_domain") return true;

    return /^(what is|what are|how does|how do|why does|explain|teach)\b/.test(lower);
  },

  getQuestion(summary = {}) {
    return (
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  }
};