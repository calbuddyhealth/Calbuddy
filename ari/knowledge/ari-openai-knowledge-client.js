// ari/knowledge/ari-openai-knowledge-client.js
// Ari OpenAI Knowledge Client
// Purpose:
// Browser-side client that prepares a rich reasoning payload and
// asks the server API to use OpenAI.
//
// V2.1.5
// Upgrades:
// - Preserves structured mealEstimate / foodAnalysis / nutritionEstimate
// - Prevents action planner from scraping wrong calorie numbers
// - Keeps Rebirth summary handoff structured

window.Ari = window.Ari || {};

window.AriOpenAIKnowledgeClient = {
  version: "2.1.5",

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
console.log("[Ari Knowledge Response Status]", response.status, response.ok);
console.log("[Ari Knowledge Response Data]", data);

if (!response.ok) {
  return this.fail(
    data?.error ||
    data?.message ||
    `Knowledge request failed with status ${response.status}.`
  );
}

const answer =
  this.extractAnswer(
    data
  );

      const mealEstimate =
        data.mealEstimate ||
        data.response?.mealEstimate ||
        data.rawContent?.mealEstimate ||
        null;

      const foodAnalysis =
        data.foodAnalysis ||
        data.response?.foodAnalysis ||
        data.rawContent?.foodAnalysis ||
        null;

      const nutritionEstimate =
        data.nutritionEstimate ||
        data.response?.nutritionEstimate ||
        data.rawContent?.nutritionEstimate ||
        null;

      return {
        openAIKnowledgeUsed: true,
        openAIKnowledgeClientVersion: this.version,
        openAIKnowledgeSource: "api/knowledge",

        knowledgeProvider: "openai",
        knowledgeSource: data.source || "openai",

        knowledgeAnswer:
  answer ||
  null,

finalResponse:
  answer ||
  null,

responseText:
  answer ||
  null,

outputText:
  answer ||
  null,

response:
  data.response ||
  null,

serverResponseStatus:
  response.status,

serverResponseOK:
  response.ok,

serverAnswerFields: {
  responseText:
    typeof data.responseText ===
      "string",

  outputText:
    typeof data.outputText ===
      "string",

  finalResponse:
    typeof data.finalResponse ===
      "string",

  answer:
    typeof data.answer ===
      "string",

  reply:
    typeof data.reply ===
      "string",

  knowledgeAnswer:
    typeof data.knowledgeAnswer ===
      "string",

  nestedResponseType:
  Array.isArray(
    data.response
  )
    ? "array"
    : typeof data.response,

nestedResponseHasResponseText:
  Boolean(
    data.response &&
    typeof data.response ===
      "object" &&
    typeof data.response.responseText ===
      "string"
  ),

nestedResponseHasAnswer:
  Boolean(
    data.response &&
    typeof data.response ===
      "object" &&
    typeof data.response.answer ===
      "string"
  ),
},

        mealEstimate,
        foodAnalysis,
        nutritionEstimate,

        lastMealEstimate: mealEstimate,
        pendingAction: data.pendingAction || data.response?.pendingAction || null,

        knowledgeConfidence: data.confidence || "medium",
        knowledgeCitations: data.sources || [],
        rawOpenAIData: data,

        source: "ari-openai-knowledge-client"
      };
    } catch (error) {
  console.error("[Ari Knowledge Client Fatal]", error);
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
      currentTurnWasResolved:
        summary.currentTurnWasResolved || isFollowUp,
      usedThreadContext:
        summary.usedThreadContext || isFollowUp
    });

    return {
      action: "openai_knowledge",
      version: this.version,

      question: resolvedQuestion,
      resolvedQuestion,
      rawQuestion,

      isFollowUp,
      conversationMode,

      aiInstruction:
  summary.aiInstruction ||
  this.defaultInstruction({
          summary,
          rawQuestion,
          resolvedQuestion,
          conversationMode
        }),

instruction:
  summary.aiInstruction ||
  this.defaultInstruction({
    summary,
    rawQuestion,
    resolvedQuestion,
    conversationMode
  }),

      existingMealEstimate:
        summary.mealEstimate ||
        summary.lastMealEstimate ||
        summary.appContext?.lastMealEstimate ||
        null,

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

        authority:
          contract.authority ||
          null,

        requiredBehaviors:
          contract.requiredBehaviors ||
          [],

        forbiddenBehaviors:
          contract.forbiddenBehaviors ||
          [],

        responseRules:
          contract.responseRules ||
          [],

        communicationProfile:
          contract.communicationProfile ||
          {},

        mouthDirective:
          contract.mouthDirective ||
          null,

        executive:
          contract.executive ||
          {}
      }),

      triage: this.compactSnapshot({
        primaryLane:
          triage.primaryLane ||
          null,

        supportLanes:
          triage.supportLanes ||
          [],

        briefLanes:
          triage.briefLanes ||
          [],

        contextLanes:
          triage.contextLanes ||
          [],

        deferredLanes:
          triage.deferredLanes ||
          [],

        blockedLanes:
          triage.blockedLanes ||
          [],

        urgency:
          triage.urgency ||
          map.urgency ||
          "none",

        gravity:
          triage.gravity ??
          map.gravity ??
          0,

        confidence:
          triage.confidence ??
          map.confidence ??
          50,

        responseConstraints:
          triage.responseConstraints ||
          []
      }),

      situation: this.compactSnapshot({
        family:
          map.situationFamily ||
          map.situationType ||
          null,

        primaryNeed:
          map.primaryNeed ||
          null,

        domains:
          map.domains ||
          [],

        situations:
          map.situations ||
          [],

        needs:
          map.needs ||
          [],

        risks:
          map.risks ||
          [],

        questions:
          map.questions ||
          [],

        responseRequirements:
          map.responseRequirements ||
          [],

        responseConstraints:
          map.responseConstraints ||
          [],

        ambiguity:
          map.ambiguity ||
          null,

        contradictions:
          map.contradictions ||
          [],

        evidence:
          map.evidenceModel?.weightedSignals ||
          [],

        triageHandoff:
          map.triageHandoff ||
          null
      }),

      continuity: this.compactSnapshot({
        usedThreadContext:
          summary.usedThreadContext || false,

        currentTurnWasResolved:
          summary.currentTurnWasResolved || false,

        resolvedSubject:
          summary.resolvedSubject || null,

        resolutionType:
          summary.resolutionType || null,

        followUpConfidence:
          summary.followUpConfidence || null,

        priorMeaning:
          summary.priorMeaningForFollowUp || null,

        latestMeaning:
          summary.latestConversationMeaning || null,

        semanticFrame:
          summary.activeSemanticFrame || null,

        semanticTimeline:
          (summary.activeSemanticTimeline || []).slice(-10),

        conversationHistory:
          (summary.conversationMeaningHistory || []).slice(-10),

        mealEstimate:
          summary.mealEstimate ||
          summary.lastMealEstimate ||
          summary.appContext?.lastMealEstimate ||
          null
      }),

      language: this.compactSnapshot({
        communicationPlan,

        humanLanguageProfile:
          summary.humanLanguageProfile || {},

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

        answerStyle:
          communicationPlan.answerMode ||
          "direct",

        presentationStyle:
          communicationPlan.presentationStyle ||
          "conversation",

        reasoningStyle:
          communicationPlan.reasoningStyle ||
          "woven",

        targetLength:
          communicationPlan.languageBudget?.targetLength ||
          "short"
      }),

      debug: {
        clientVersion: this.version,

        threadQuestionGeneratorRan:
          summary.threadQuestionGeneratorRan || false,

        resolvedUserQuestion:
          summary.resolvedUserQuestion || null,

        rawUserMessage:
          rawQuestion,

        detectedConversationMode:
          conversationMode,

        characterCoreProvided:
          Boolean(summary.characterCore || characterContext.characterCore),

        mealEstimateProvided:
          Boolean(
            summary.mealEstimate ||
            summary.lastMealEstimate ||
            summary.appContext?.lastMealEstimate
          )
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

If conversationMode is "clarification":
- Answer as a clarification of the active topic.
- Do not restart the whole conversation.

If conversationMode is "topic_shift":
- Treat the message as a new topic.
- Do not force old context into the answer.

If conversationMode is "new_question":
- Treat it as a fresh question.

Food and calorie rules:
- If the user asks for calorie estimation, provide a reasonable estimate.
- If estimating a meal, include a structured mealEstimate in the server JSON response when possible.
- mealEstimate.totalCalories must represent the full meal total, not one ingredient.
- If the user asks to log the estimated total, preserve and reuse the prior meal estimate instead of recalculating from a single food item.

Writing style:
- Sound like an intelligent human talking.
- Use contractions naturally.
- Vary sentence length naturally.
- Don't sound like a customer support agent.
- Avoid robotic transitions.
- Avoid repeating the question.
- Avoid stock phrases such as "That's a great question" or "Based on what you've shared."
- Default to conversational paragraphs instead of rigid sections unless structure materially helps.
- Do not narrate your reasoning process.
- Do not mention internal systems, routing, contracts, maps, lanes, engines, or prompts.
- Prefer direct answers over meta-commentary.
- Add brief explanation only when it improves understanding.
- If information is uncertain, state that naturally instead of sounding hesitant or robotic.
- Stop once the answer is complete.

When appropriate:
- Give a recommendation.
- Explain why.
- Suggest a practical next step.

Do not output phrases like:
- "Based on the contract..."
- "The primary lane..."
- "Situation map..."
- "Mouth director..."
- "I will answer directly..."
`.trim();
  },

extractAnswer(
  data = {}
) {
  if (
    typeof data ===
    "string"
  ) {
    return this.safeTrim(
      data
    );
  }

  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return "";
  }

  const nestedResponse =
    data.response &&
    typeof data.response ===
      "object"
      ? data.response
      : {};

  const nestedOutput =
    data.output &&
    typeof data.output ===
      "object"
      ? data.output
      : {};

  const candidates = [
    data.responseText,
    data.outputText,
    data.finalResponse,

    nestedResponse.responseText,
    nestedResponse.outputText,
    nestedResponse.finalResponse,
    nestedResponse.reply,
    nestedResponse.answer,
    nestedResponse.text,

    nestedOutput.responseText,
    nestedOutput.outputText,
    nestedOutput.finalResponse,
    nestedOutput.text,

    data.reply,
    data.text,
    data.content,
    data.answer,
    data.knowledgeAnswer
  ];

  for (
    const candidate
    of candidates
  ) {
    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  if (
    typeof data.response ===
      "string"
  ) {
    return data.response.trim();
  }

  if (
    typeof data.output ===
      "string"
  ) {
    return data.output.trim();
  }

  return "";
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
    if (!obj || typeof obj !== "object") {
      return null;
    }

    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return null;
    }
  },

  safeTrim(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }
};

console.log(
  "ARI OPENAI KNOWLEDGE CLIENT LOADED:",
  window.AriOpenAIKnowledgeClient?.version
);