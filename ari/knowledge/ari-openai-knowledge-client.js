// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// Purpose: Browser-side client that asks the server API for outside knowledge.
// V1.0

window.AriOpenAIKnowledgeClient = {
  version: "1.0.0", 

  async ask(input = {}) {
    const summary = input.summary || input || {};

    const question =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    if (!question || !String(question).trim()) {
      return this.fail("No question provided.");
    }

    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  action: "openai_knowledge",
  question,
  summary: {
    topic: summary.teachingTopic || null,
    domainLead: summary.domainLead || null,
    responseIntent: summary.responseIntent || null,
    primaryHumanNeed: summary.primaryHumanNeed || null
  }
})
});

      const data = await response.json();

      if (!response.ok) {
        return this.fail(data.error || "OpenAI knowledge request failed.");
      }

      return {
        openAIKnowledgeUsed: true,
        openAIKnowledgeSource: "api/knowledge",
        knowledgeProvider: "openai",
        knowledgeSource: data.source || "openai",
        knowledgeAnswer: data.answer || null,
        knowledgeConfidence: data.confidence || "medium",
        knowledgeCitations: data.sources || [],
        knowledgeError: null,
        source: "ari-openai-knowledge-client"
      };
    } catch (error) {
      return this.fail(error.message || "OpenAI knowledge client failed.");
    }
  },

  fail(message = "Knowledge request failed.") {
    return {
      openAIKnowledgeUsed: false,
      openAIKnowledgeSource: "api/knowledge",
      knowledgeProvider: "openai",
      knowledgeSource: null,
      knowledgeAnswer: null,
      knowledgeConfidence: "none",
      knowledgeCitations: [],
      knowledgeError: message,
      source: "ari-openai-knowledge-client"
    };
  }
};