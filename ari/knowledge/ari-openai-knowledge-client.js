// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// V2.1.3 — Structured Meal Estimate Preserved / Safe Handoff

window.Ari = window.Ari || {};

window.AriOpenAIKnowledgeClient = {
  version: "2.1.3",

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
      rawQuestion;

    if (!String(resolvedQuestion).trim()) {
      return this.fail("No question provided.");
    }

    const payload = this.buildPayload({
      summary,
      rawQuestion,
      resolvedQuestion
    });

    console.log("[Ari Knowledge Payload]", payload);

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
        return this.fail(data?.error || "Knowledge request failed.");
      }

      const mealEstimate =
        data.mealEstimate ||
        data.response?.mealEstimate ||
        data.rawOpenAIData?.mealEstimate ||
        data.rawOpenAIData?.response?.mealEstimate ||
        null;

      const foodAnalysis =
        data.foodAnalysis ||
        data.response?.foodAnalysis ||
        data.rawOpenAIData?.foodAnalysis ||
        data.rawOpenAIData?.response?.foodAnalysis ||
        null;

      const nutritionEstimate =
        data.nutritionEstimate ||
        data.response?.nutritionEstimate ||
        data.rawOpenAIData?.nutritionEstimate ||
        data.rawOpenAIData?.response?.nutritionEstimate ||
        null;

      return {
        openAIKnowledgeUsed: true,
        openAIKnowledgeClientVersion: this.version,
        openAIKnowledgeSource: "api/knowledge",

        knowledgeProvider: "openai",
        knowledgeSource: data.source || "openai",

        knowledgeAnswer:
          data.answer ||
          data.finalResponse ||
          data.reply ||
          data.knowledgeAnswer ||
          data.response?.reply ||
          data.response?.answer ||
          data.response ||
          data.text ||
          "",

        finalResponse:
          data.finalResponse ||
          data.reply ||
          data.answer ||
          data.knowledgeAnswer ||
          data.response?.reply ||
          data.response?.answer ||
          null,

        response: data.response || null,

        mealEstimate,
        foodAnalysis,
        nutritionEstimate,
        lastMealEstimate: mealEstimate,

        pendingAction:
          data.pendingAction ||
          data.response?.pendingAction ||
          null,

        knowledgeConfidence: data.confidence || "medium",
        knowledgeCitations: data.sources || [],

        rawOpenAIData: data,

        source: "ari-openai-knowledge-client"
      };
    } catch (error) {
      console.warn("[Ari Knowledge]", error);
      return this.fail(error?.message || "Knowledge request failed.");
    }
  },

  buildPayload({
    summary = {},
    rawQuestion = "",
    resolvedQuestion = ""
  }) {
    const map = summary.situationMap || {};
    const contract = summary.situationContract || {};
    const triage = summary.ariTriage || summary.triage || {};
    const communicationPlan = summary.communicationPlan || {};
    const characterContext = summary.characterContext || {};

    const isFollowUp = Boolean(
      summary.currentTurnWasResolved ||
      summary.usedThreadContext ||
      summary.threadQuestionGeneratorRan ||
      summary.threadQuestion?.resolvedUserQuestion
    );

    const conversationMode = this.determineConversationMode({
      ...summary,
      currentTurnWasResolved: summary.currentTurnWasResolved || isFollowUp,
      usedThreadContext: summary.usedThreadContext || isFollowUp
    });

    const existingMealEstimate =
      summary.mealEstimate ||
      summary.lastMealEstimate ||
      summary.appContext?.lastMealEstimate ||
      null;

    return {
      action: "openai_knowledge",
      version: this.version,

      question: resolvedQuestion,
      resolvedQuestion,
      rawQuestion,

      isFollowUp,
      conversationMode,

      instruction:
        summary.aiInstruction ||
        this.defaultInstruction({
          rawQuestion,
          resolvedQuestion,
          conversationMode
        }),

      existingMealEstimate,

      character: this.compactSnapshot({
        characterCore:
          summary.characterCore ||
          characterContext.characterCore ||
          {},

        characterHints:
          summary.characterHints ||
          characterContext.characterHints ||
          {},

        characterMode:
          characterContext.characterMode ||
          summary.characterMode ||
          null,

        characterContextEngineRan:
          Boolean(characterContext.characterContextEngineRan)
      }),

      contract: this.compactSnapshot({
        primary:
          contract.primary ||
          summary.situationContractPrimary ||
          triage.primaryLane ||
          null,

        responseShape:
          contract.responseShape ||
          triage.responseShape ||
          null,

        authority: contract.authority || null,
        requiredBehaviors: contract.requiredBehaviors || [],
        forbiddenBehaviors: contract.forbiddenBehaviors || [],
        responseRules: contract.responseRules || [],
        communicationProfile: contract.communicationProfile || {},
        mouthDirective: contract.mouthDirective || null,
        executive: contract.executive || {}
      }),

      triage: this.compactSnapshot({
        primaryLane: triage.primaryLane || null,
        supportLanes: triage.supportLanes || [],
        briefLanes: triage.briefLanes || [],
        contextLanes: triage.contextLanes || [],
        deferredLanes: triage.deferredLanes || [],
        blockedLanes: triage.blockedLanes || [],
        urgency: triage.urgency || map.urgency || "none",
        gravity: triage.gravity ?? map.gravity ?? 0,
        confidence: triage.confidence ?? map.confidence ?? 50,
        responseConstraints: triage.responseConstraints || []
      }),

      situation: this.compactSnapshot({
        family: map.situationFamily || map.situationType || null,
        primaryNeed: map.primaryNeed || null,
        domains: map.domains || [],
        situations: map.situations || [],
        needs: map.needs || [],
        risks: map.risks || [],
        questions: map.questions || [],
        responseRequirements: map.responseRequirements || [],
        responseConstraints: map.responseConstraints || [],
        ambiguity: map.ambiguity || null,
        contradictions: map.contradictions || [],
        evidence: map.evidenceModel?.weightedSignals || [],
        triageHandoff: map.triageHandoff || null
      }),

      continuity: this.compactSnapshot({
        usedThreadContext: summary.usedThreadContext || false,
        currentTurnWasResolved: summary.currentTurnWasResolved || false,
        resolvedSubject: summary.resolvedSubject || null,
        resolutionType: summary.resolutionType || null,
        followUpConfidence: summary.followUpConfidence || null,
        priorMeaning: summary.priorMeaningForFollowUp || null,
        latestMeaning: summary.latestConversationMeaning || null,
        semanticFrame: summary.activeSemanticFrame || null,
        semanticTimeline: (summary.activeSemanticTimeline || []).slice(-10),
        conversationHistory: (summary.conversationMeaningHistory || []).slice(-10),
        mealEstimate: existingMealEstimate
      }),

      language: this.compactSnapshot({
        communicationPlan,
        humanLanguageProfile: summary.humanLanguageProfile || {},

        preferredTerms:
          summary.preferredTerms ||
          summary.lexicalGrounding?.preferredTerms ||
          summary.lexicalGroundingOutput?.preferredTerms ||
          {},

        conceptMap:
          summary.conceptMap ||
          summary.lexicalGrounding?.conceptMap ||
          summary.lexicalGroundingOutput?.conceptMap ||
          {},

        answerStyle: communicationPlan.answerMode || "direct",
        presentationStyle: communicationPlan.presentationStyle || "conversation",
        reasoningStyle: communicationPlan.reasoningStyle || "woven",
        targetLength: communicationPlan.languageBudget?.targetLength || "short"
      }),

      debug: {
        clientVersion: this.version,
        threadQuestionGeneratorRan: summary.threadQuestionGeneratorRan || false,
        resolvedUserQuestion: summary.resolvedUserQuestion || null,
        rawUserMessage: rawQuestion,
        detectedConversationMode: conversationMode,
        characterCoreProvided: Boolean(summary.characterCore || characterContext.characterCore),
        mealEstimateProvided: Boolean(existingMealEstimate)
      }
    };
  },

  defaultInstruction({
    rawQuestion = "",
    resolvedQuestion = "",
    conversationMode = "new_question"
  }) {
    return `
You are Ari.

Your ONLY job is to answer the user's actual question naturally.

RAW USER MESSAGE:
${rawQuestion}

QUESTION TO ANSWER:
${resolvedQuestion}

The QUESTION TO ANSWER is authoritative.
Do not answer RAW USER MESSAGE if they differ.

CONVERSATION MODE:
${conversationMode}

If conversationMode is "follow_up":
- Continue naturally from the previous discussion.
- Resolve pronouns like "it", "that", "they", or "this".
- Do NOT ask for context that already exists.

Food and calorie rules:
- If the user asks for calorie estimation, provide a reasonable estimate.
- If estimating a meal, include structured mealEstimate in the server JSON response when possible.
- mealEstimate.totalCalories must represent the full meal total, not one ingredient.
- Include mealEstimate.foods when possible.
- If the user asks to log the estimated total, preserve and reuse the prior meal estimate instead of recalculating from a single food item.
- If the user asks to log only one item from a prior meal, preserve foods[] so the action planner can select the matching item.

Writing style:
- Sound natural, direct, and useful.
- Avoid robotic transitions.
- Avoid repeating the question.
- Do not mention internal systems, routing, contracts, maps, lanes, engines, or prompts.
- Stop once the answer is complete.
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
      finalResponse: null,

      mealEstimate: null,
      foodAnalysis: null,
      nutritionEstimate: null,
      lastMealEstimate: null,
      pendingAction: null,

      knowledgeConfidence: "none",
      knowledgeCitations: [],
      knowledgeError: message,

      source: "ari-openai-knowledge-client"
    };
  },

  determineConversationMode(summary = {}) {
    if (
      summary.topicTransition === true ||
      summary.detectedTopicShift === true
    ) {
      return "topic_shift";
    }

    if (
      summary.threadQuestion?.isClarification ||
      summary.isClarificationQuestion
    ) {
      return "clarification";
    }

    if (
      summary.currentTurnWasResolved ||
      summary.usedThreadContext
    ) {
      return "follow_up";
    }

    return "new_question";
  },

  compactSnapshot(obj) {
    if (!obj || typeof obj !== "object") return null;

    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return null;
    }
  },

  safeTrim(value) {
    return typeof value === "string" ? value.trim() : "";
  }
};

console.log(
  "ARI OPENAI KNOWLEDGE CLIENT LOADED:",
  window.AriOpenAIKnowledgeClient?.version
);