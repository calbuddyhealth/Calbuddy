// ari/knowledge/ari-knowledge-router.js
// Ari Knowledge Router
// Purpose: Decide when Ari should retrieve outside/AI knowledge.
// V2.0.0 — Contract + Triage + Follow-up Aware

window.Ari = window.Ari || {};

window.AriKnowledgeRouter = {
  version: "2.0.0",

  async route(input = {}) {
    const summary = input.summary || input || {};
    const question = this.getQuestion(summary);

    const shouldUseKnowledge = this.shouldUseKnowledge(summary, question);

    if (!shouldUseKnowledge) {
      return this.noKnowledge("No outside knowledge needed.");
    }

    const client = window.AriOpenAIKnowledgeClient;

    if (!client?.ask) {
      return this.noKnowledge("Knowledge client unavailable.", true);
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
        this.getKnowledgeReason(summary, question)
    };
  },

  shouldUseKnowledge(summary = {}, question = "") {
    const intent = summary.responseIntent || "";
    const domainLead = summary.domainLead || "";
    const lower = String(question || "").toLowerCase();

    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};
    const map = summary.situationMap || {};

    const primary =
      contract.primary ||
      summary.situationContractPrimary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      "";

    const domains = map.domains || summary.domains || [];
    const needs = map.needs || summary.needs || [];
    const questions = map.questions || summary.questions || [];

    if (summary.resolvedUserQuestion || summary.threadQuestion?.resolvedUserQuestion) {
      return true;
    }

    if (
      [
        "teacher",
        "builder",
        "executive_decision",
        "medical_context",
        "ari_self",
        "writer"
      ].includes(primary)
    ) {
      return true;
    }

    if (intent === "teach_clearly") return true;
    if (intent === "explain") return true;
    if (intent === "answer_question") return true;
    if (intent === "implementation_help") return true;
    if (intent === "decision_support") return true;

    if (domainLead === "knowledge_teaching_domain") return true;
    if (domainLead === "builder_domain") return true;

    if (domains.includes("knowledge_domain")) return true;
    if (domains.includes("builder_domain")) return true;

    if (needs.includes("understanding")) return true;
    if (needs.includes("decision_support")) return true;
    if (needs.includes("action_or_build_help")) return true;
    if (needs.includes("writing_or_rewrite")) return true;
    if (needs.includes("calculation")) return true;

    if (questions.includes("knowledge_question")) return true;
    if (questions.includes("instruction_question")) return true;
    if (questions.includes("decision_question")) return true;

    return /\b(what is|what are|how does|how do|why does|why do|explain|teach|compare|difference between|should i|what should|recommend|best way|fix|debug|code|can you|help me|write|rewrite|summarize)\b/.test(lower);
  },

  getQuestion(summary = {}) {
    return (
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

    if (summary.resolvedUserQuestion || summary.threadQuestion?.resolvedUserQuestion) {
      return "Resolved/follow-up question benefits from AI context handling.";
    }

    if (primary) {
      return `Primary lane '${primary}' benefits from AI knowledge response.`;
    }

    if ((map.needs || []).length) {
      return `Detected needs require knowledge support: ${(map.needs || []).join(", ")}.`;
    }

    return "Question requires outside/AI knowledge.";
  },

  noKnowledge(reason = "No outside knowledge needed.", unavailable = false) {
    return {
      knowledgeRouterRan: true,
      knowledgeRouterVersion: this.version,
      knowledgeRouterSource: "ari-knowledge-router",

      shouldUseKnowledge: unavailable,

      knowledgeAnswer: null,
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