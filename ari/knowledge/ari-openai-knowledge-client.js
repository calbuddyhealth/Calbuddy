// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// Purpose: Ask the secure backend for knowledge answers.
// V1.0

window.AriOpenAIKnowledgeClient = {
  version: "1.0.0",

  async ask(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);

    if (!question) {
      return this.fail("No question provided.");
    }

    try {
      const response = await fetch("/api/ari-knowledge-openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          summary
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return this.fail(data.error || "Knowledge request failed.");
      }

      return {
        knowledgeClientRan: true,
        knowledgeClientSource: "ari-openai-knowledge-client",
        knowledgeClientVersion: this.version,
        answer: data.answer || null,
        confidence: data.confidence || "medium",
        sources: data.sources || [],
        model: data.model || null,
        error: null
      };
    } catch (error) {
      return this.fail(error.message || "OpenAI knowledge client failed.");
    }
  },

  getQuestion(summary = {}) {
    return (
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  fail(reason = "Unknown knowledge client failure.") {
    return {
      knowledgeClientRan: true,
      knowledgeClientSource: "ari-openai-knowledge-client",
      knowledgeClientVersion: this.version,
      answer: null,
      confidence: "none",
      sources: [],
      model: null,
      error: reason
    };
  }
};