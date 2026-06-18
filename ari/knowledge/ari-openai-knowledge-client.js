// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// Purpose: Browser-side client that asks the server API to use OpenAI.
// V1.2.0 — Resolved Question + Context Handoff Upgrade

window.Ari = window.Ari || {};

window.AriOpenAIKnowledgeClient = {
  version: "1.2.0",

  async ask(input = {}) {
    const summary = input.summary || input || {};

    const rawQuestion =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const resolvedQuestion =
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const question = resolvedQuestion;

    if (!question || !String(question).trim()) {
      return this.fail("No question provided.");
    }

    const payload = this.buildPayload({
      summary,
      rawQuestion,
      resolvedQuestion,
      question
    });

    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return this.fail(data.error || "OpenAI knowledge request failed.");
      }

      return {
        openAIKnowledgeUsed: true,
        openAIKnowledgeClientVersion: this.version,
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

  buildPayload({ summary = {}, rawQuestion = "", resolvedQuestion = "", question = "" }) {
    const situationMap = summary.situationMap || {};

    return {
      action: "openai_knowledge",

      question,
      rawQuestion,
      resolvedQuestion,

      instruction:
        summary.aiInstruction ||
        this.defaultInstruction({ question, rawQuestion, resolvedQuestion }),

      contract: summary.situationContract || null,
      communicationPlan: summary.communicationPlan || null,

      continuity: {
        usedThreadContext: summary.usedThreadContext || false,
        currentTurnWasResolved: summary.currentTurnWasResolved || false,
        resolvedSubject: summary.resolvedSubject || null,
        resolutionType: summary.resolutionType || null,
        priorMeaningForFollowUp: summary.priorMeaningForFollowUp || null,
        latestConversationMeaning: summary.latestConversationMeaning || null,
        conversationMeaningHistory: summary.conversationMeaningHistory || [],
        activeSemanticTimeline: summary.activeSemanticTimeline || [],
        activeSemanticFrame: summary.activeSemanticFrame || null,
        continuityPacket: {
          continuityType: summary.continuityType || null,
          usableFacts: summary.continuityUsableFacts || [],
          unresolvedReferences: summary.continuityUnresolvedReferences || []
        }
      },

      situation: {
        domains: summary.domains || situationMap.domains || [],
        situations: summary.situations || situationMap.situations || [],
        needs: summary.needs || situationMap.needs || [],
        risks: summary.risks || situationMap.risks || [],
        questions: summary.questions || situationMap.questions || [],
        responseRequirements:
          summary.responseRequirements ||
          situationMap.responseRequirements ||
          [],
        responseConstraints:
          summary.responseConstraints ||
          situationMap.responseConstraints ||
          [],
        situationFamily:
          summary.situationFamily ||
          situationMap.situationFamily ||
          null,
        primaryNeed:
          summary.primaryNeed ||
          situationMap.primaryNeed ||
          null
      },

      routing: {
        lane: summary.lane || summary.laneSplit?.lane || null,
        primary:
          summary.situationContractPrimary ||
          summary.situationContract?.primary ||
          summary.triage?.primaryLane ||
          null,
        support:
          summary.situationContractSupport ||
          summary.situationContract?.support ||
          [],
        deferred:
          summary.situationContractDeferred ||
          summary.situationContract?.deferred ||
          [],
        blocked:
          summary.situationContractBlocked ||
          summary.situationContract?.blocked ||
          []
      },

      language: {
        responseShape:
          summary.responseShape ||
          summary.situationContract?.responseShape ||
          null,
        humanLanguageProfile: summary.humanLanguageProfile || {},
        mouthDirective:
          summary.situationContract?.mouthDirective ||
          summary.mouthDirector ||
          null
      },

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
      },

      debug: {
        clientVersion: this.version,
        threadQuestionGeneratorRan: summary.threadQuestionGeneratorRan || false,
        currentTurnWasResolved: summary.currentTurnWasResolved || false,
        resolvedUserQuestion: summary.resolvedUserQuestion || null,
        rawUserMessage: rawQuestion || null
      }
    };
  },

  defaultInstruction({ question = "", rawQuestion = "", resolvedQuestion = "" }) {
    return `
You are Ari.

Answer the resolved user question directly.

RAW USER MESSAGE:
${rawQuestion}

RESOLVED QUESTION TO ANSWER:
${resolvedQuestion || question}

Rules:
- If the resolved question contains context, use it.
- Do not ask for context that is already present in the resolved question.
- Do not mention internal routing, pipeline, maps, contracts, or engines.
- Give a useful answer, not a generic clarification.
- Be clear, practical, and concise.
`.trim();
  },

  fail(message = "Knowledge request failed.") {
    return {
      openAIKnowledgeUsed: false,
      openAIKnowledgeClientVersion: this.version,
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

console.log(
  "ARI OPENAI KNOWLEDGE CLIENT LOADED:",
  window.AriOpenAIKnowledgeClient?.version
);