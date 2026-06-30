// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Decide when Ari should retrieve outside/AI knowledge.
// V2.1.0 — Rebirth Composer / AI Writer Fallback Fix

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "2.1.0",

  async route(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);

    const shouldUseKnowledge = this.shouldUseKnowledge(summary, question);

    if (!shouldUseKnowledge) {
      return this.noKnowledge("No outside/AI knowledge needed.");
    }

    const client = window.AriOpenAIKnowledgeClient;

    if (!client || typeof client.ask !== "function") {
      return this.noKnowledge("Knowledge client unavailable.", true);
    }

    const result = await client.ask({ summary });

    const answer =
      result?.finalResponse ||
      result?.knowledgeAnswer ||
      result?.answer ||
      result?.reply ||
      result?.text ||
      null;

    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: true,

      knowledgeAnswer: answer,
      finalResponse: answer,

      knowledgeConfidence:
        result?.knowledgeConfidence ||
        result?.confidence ||
        "medium",

      knowledgeSources:
        result?.knowledgeCitations ||
        result?.sources ||
        [],

      knowledgeProvider:
        result?.knowledgeProvider ||
        "openai",

      knowledgeError:
        result?.knowledgeError ||
        null,

      openAIKnowledgeUsed:
        result?.openAIKnowledgeUsed === true,

      openAIKnowledgeSource:
        result?.openAIKnowledgeSource ||
        "api/knowledge",

      mealEstimate:
        result?.mealEstimate ||
        null,

      foodAnalysis:
        result?.foodAnalysis ||
        null,

      nutritionEstimate:
        result?.nutritionEstimate ||
        null,

      pendingAction:
        result?.pendingAction ||
        null,

      rawKnowledgeResult: result || null,

      knowledgeReason:
        this.getKnowledgeReason(summary, question)
    };
  },

  shouldUseKnowledge(summary = {}, question = "") {
    const lower = String(question || "").toLowerCase();

    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};
    const map = summary.situationMap || {};
    const responseIntent = summary.responseIntent || "";

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      "";

    const domains = map.domains || summary.domains || [];
    const needs = map.needs || summary.needs || [];
    const questions = map.questions || summary.questions || [];

    if (!lower.trim()) return false;

    // Direct conversation questions should use AI writer/knowledge.
    if (summary.resolvedUserQuestion || summary.threadQuestion?.resolvedUserQuestion) {
      return true;
    }

    if (summary.semanticExpectsDirectAnswer === true) return true;
    if (summary.directAnswerNeeded === true) return true;

    if (
      [
        "teacher",
        "builder",
        "executive_decision",
        "medical_context",
        "ari_self",
        "writer",
        "companion"
      ].includes(primary)
    ) {
      return true;
    }

    if (
      [
        "teach_clearly",
        "explain",
        "answer_question",
        "implementation_help",
        "decision_support",
        "write",
        "rewrite",
        "summarize"
      ].includes(responseIntent)
    ) {
      return true;
    }

    if (domains.includes("knowledge_domain")) return true;
    if (domains.includes("builder_domain")) return true;
    if (domains.includes("writing_domain")) return true;

    if (needs.includes("understanding")) return true;
    if (needs.includes("decision_support")) return true;
    if (needs.includes("action_or_build_help")) return true;
    if (needs.includes("writing_or_rewrite")) return true;
    if (needs.includes("calculation")) return true;
    if (needs.includes("conversation")) return true;

    if (questions.includes("knowledge_question")) return true;
    if (questions.includes("instruction_question")) return true;
    if (questions.includes("decision_question")) return true;

    return /\b(what|who|when|where|why|how|explain|teach|compare|difference|should|recommend|best|fix|debug|code|help|write|rewrite|summarize|favorite|color)\b/.test(lower);
  },

  getQuestion(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  getKnowledgeReason(summary = {}, question = "") {
    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};
    const map = summary.situationMap || {};

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      null;

    if (summary.directAnswerNeeded === true) {
      return "Direct answer needed; AI knowledge client should generate natural response.";
    }

    if (summary.semanticExpectsDirectAnswer === true) {
      return "Semantic frame expects a direct answer.";
    }

    if (summary.resolvedUserQuestion || summary.threadQuestion?.resolvedUserQuestion) {
      return "Resolved question should be answered by AI knowledge client.";
    }

    if (primary) {
      return `Primary lane '${primary}' benefits from AI response generation.`;
    }

    if ((map.needs || []).length) {
      return `Detected needs require AI support: ${(map.needs || []).join(", ")}.`;
    }

    return "Question benefits from AI response generation.";
  },

  noKnowledge(reason = "No outside/AI knowledge needed.", unavailable = false) {
    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: false,

      knowledgeAnswer: null,
      finalResponse: null,
      knowledgeConfidence: "none",
      knowledgeSources: [],
      knowledgeProvider: unavailable ? "openai" : null,
      knowledgeError: unavailable ? reason : null,
      openAIKnowledgeUsed: false,
      openAIKnowledgeSource: null,
      knowledgeReason: reason
    };
  }
};

console.log(
  "ARI KNOWLEDGE ROUTER LOADED:",
  window.AriKnowledgeRouter?.version
);