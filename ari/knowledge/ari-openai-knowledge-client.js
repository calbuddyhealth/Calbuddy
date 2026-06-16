// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// Purpose: Browser-side client that asks the server API to use OpenAI.
// V1.1.0

window.AriOpenAIKnowledgeClient = {
  version: "1.1.0",

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

          // NEW: lets composer pass the mission to OpenAI
          instruction: summary.aiInstruction || null,

          // NEW: gives OpenAI Ari's routing decision
          contract: summary.situationContract || null,
          communicationPlan: summary.communicationPlan || null,

          summary: {
            topic: summary.teachingTopic || null,
            domainLead: summary.domainLead || null,
            responseIntent: summary.responseIntent || null,
            primaryHumanNeed: summary.primaryHumanNeed || null,
            situationContractPrimary:
              summary.situationContractPrimary ||
              summary.situationContract?.primary ||
              null,
            responseShape:
              summary.responseShape ||
              summary.situationContract?.responseShape ||
              null
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
        knowledgeAnswer:
          data.answer ||
          data.finalResponse ||
          data.response ||
          data.text ||
          null,
        knowledgeConfidence: data.confidence || "medium",
        knowledgeCitations: data.sources || [],
        knowledgeError: null,
        rawOpenAIData: data,
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