// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose:
// Decide where factual knowledge should come from.
// V1.0

window.AriKnowledgeRouter = {
  version: "1.0.0",

  async answer(summary = {}) {
    const question =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const responseIntent = summary.responseIntent || null;

    // Teaching questions
    if (responseIntent === "teach_clearly") {
      return this.routeTeaching(question, summary);
    }

    return null;
  },

  async routeTeaching(question, summary = {}) {
    // Future order:
    //
    // 1. Ari Knowledge Vault
    // 2. User Documents
    // 3. Live Search
    // 4. OpenAI Fallback
    //
    // For V1 we only use OpenAI.

    if (window.AriTeachingAnswerEngine) {
      return await window.AriTeachingAnswerEngine.answer(
        question,
        summary
      );
    }

    return null;
  }
};