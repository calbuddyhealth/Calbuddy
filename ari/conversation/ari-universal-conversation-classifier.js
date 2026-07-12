// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify the broad interaction family, intent family, and involved domains.
// V4.0.0 — Upstream Evidence Only / Explicit Request Dominance / Context Separated

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "4.0.0",

  classify(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);

    const observations =
      summary.canonicalObservationLedger ||
      summary.observationLedger ||
      summary.observations ||
      summary.observerEvidence?.observations ||
      [];

    const questionUnderstanding =
      summary.questionUnderstanding ||
      summary.questionUnderstandingResult ||
      {};

    const lifeSignals =
      summary.lifeSignalResult ||
      {};

    const safety =
      summary.safetyContextGate ||
      {};

    const signals = this.buildSignals({
      rawText,
      text,
      observations,
      questionUnderstanding,
      lifeSignals,
      safety
    });

    const candidates = this.rankCandidates(
      this.buildCandidates(signals),
      signals
    );

    const top =
      candidates[0] ||
      this.defaultCandidate();

    const domains =
      this.resolveDomains(signals);

    const contextualSignals =
      this.resolveContextualSignals(signals);

    const explicitRequestOverridesContext =
  signals.explicitRequestPresent &&
  signals.contextSignalsPresent &&
  signals.safetyStopRequested !== true &&
  top.interactionFamily !== "emotional_support";
    
    const confidence =
      this.normalizeConfidence(
        Math.min(
          Number(top.score || 0) / 100,
          0.94
        )
      );

    const result = {
      classifierRan: true,
      universalConversationClassifierRan: true,

      classifierVersion: this.version,
      universalConversationClassifierVersion: this.version,

      source: "ari-universal-conversation-classifier",
      universalConversationClassifierSource:
        "ari-universal-conversation-classifier",

      conversationType:
        top.type,

      conversationIntent:
        top.intent,

      interactionFamily:
        top.interactionFamily ||
        "general",

      intentFamily:
        top.intentFamily ||
        "general_response",

      primaryDomain:
        domains[0] ||
        "general_understanding",

      domains,

      contextualSignals,

explicitRequestPresent:
  signals.explicitRequestPresent,

requestEvidencePresent:
  signals.requestEvidencePresent,

requestEvidenceFromQuestionEngine:
  signals.requestEvidenceFromQuestionEngine,

explicitRequestType:
  signals.explicitRequestType,

explicitRequestedOperation:
  signals.explicitRequestedOperation,

explicitRequestedOutput:
  signals.explicitRequestedOutput,

explicitRequestOverridesContext,

      emotionalContextPresent:
        signals.emotionalContextPresent,

      emotionalSupportExplicitlyRequested:
        signals.emotionalSupportExplicitlyRequested,

      lifeContextPresent:
        signals.lifeContextPresent,

      safetySignalPresent:
        signals.safetySignalPresent,

      score:
        Math.round(confidence * 100),

      rawScore:
        Number(top.score || 0),

      confidence,
      confidenceLabel:
        this.confidenceLabel(confidence),

      evidence:
        top.evidence ||
        [],

      reasons:
        top.reasons ||
        [],

      candidates:
        candidates.slice(0, 8),

      conversationCandidates:
        candidates.slice(0, 8),

      classificationSignals:
        signals,

      semanticSignals:
        signals,

      responseHint:
        this.buildNonAuthoritativeHint(top, signals),

      conversationResponseHint:
        this.buildNonAuthoritativeHint(top, signals),

      requiresSemanticConfirmation: true,
      requiresConversationFunctionConfirmation: true,

      authority: {
        canClassifyBroadInteraction: true,
        canClassifyIntentFamily: true,
        canIdentifyDomains: true,
        canIdentifyContextualSignals: true,

        canBuildSemanticFrame: false,
        canChooseConversationFunction: false,
        canChoosePrimaryLane: false,
        canChooseMode: false,
        canChooseCapabilities: false,
        canDetermineFinalSafetySeverity: false,
        canDetermineResponseStyle: false,
        canAnswerUser: false,

        role:
          "broad_interaction_and_domain_classification_only"
      },

      cannotSet: [
        "semanticFrame",
        "primaryFrame",
        "primaryFunction",
        "supportFunctions",
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "mouthPattern",
        "responseShape",
        "shouldUseKnowledge",
        "bypassKnowledge"
      ]
    };

    return result;
  },

  /* =====================================================
     SIGNAL BUILDING
  ===================================================== */

  buildSignals({
    rawText = "",
    text = "",
    observations = [],
    questionUnderstanding = {},
    lifeSignals = {},
    safety = {}
  } = {}) {
    const primaryPurpose =
      this.normalize(
        questionUnderstanding.primaryPurpose ||
        questionUnderstanding.questionPurpose ||
        ""
      );

    const purposeCandidates =
      Array.isArray(questionUnderstanding.purposeCandidates)
        ? questionUnderstanding.purposeCandidates
        : [];

    const requestedOperations =
      this.normalizeList(
        questionUnderstanding.requestedOperations
      );

    const requestedOutputs =
      this.normalizeList(
        questionUnderstanding.requestedOutputs
      );

    const supportPurposes =
      this.normalizeList(
        questionUnderstanding.supportPurposes
      );

    const observedTypes =
      new Set(
        observations
          .map(item => this.normalize(item?.type))
          .filter(Boolean)
      );

    const observedValues =
      new Set(
        observations
          .map(item =>
            this.normalize(
              item?.value ??
              item?.signal
            )
          )
          .filter(Boolean)
      );

    const observedDomains =
      new Set(
        observations
          .map(item => this.normalize(item?.domain))
          .filter(Boolean)
      );

    const observedCategories =
      new Set(
        observations
          .map(item => this.normalize(item?.category))
          .filter(Boolean)
      );

    const hasQuestion =
      this.detectQuestion(
        text,
        observations
      );

    const wordCount =
      text.split(/\s+/).filter(Boolean).length;

    const explicitEmotionalSupportLanguage =
      this.hasAny(text, [
        "i need someone to listen",
        "i just need someone to listen",
        "listen to me",
        "can i vent",
        "let me vent",
        "i need to vent",
        "just need to vent",
        "be here with me",
        "stay with me",
        "i need support",
        "i need comfort",
        "help me feel better",
        "i need someone to talk to",
        "can we talk",
        "i just want to talk"
      ]);

    const emotionalContextPresent =
      this.hasObservationType(
        observations,
        "emotion_word"
      ) ||
      observedDomains.has("emotion") ||
      observedCategories.has("emotion") ||
      this.hasAny(text, [
        "sad",
        "upset",
        "hurt",
        "angry",
        "mad",
        "worried",
        "scared",
        "anxious",
        "stressed",
        "overwhelmed",
        "lonely",
        "depressed",
        "burned out",
        "burnt out",
        "exhausted",
        "tired",
        "frustrated",
        "confused"
      ]);

    const directEmotionDisclosure =
      /\b(i'?m|i am|i feel|i felt|i was|feeling|felt)\s+(really|very|pretty|so|super|extremely|kind of|kinda|a little|honestly|just)?\s*(sad|upset|hurt|angry|mad|worried|scared|anxious|stressed|overwhelmed|lonely|depressed|burned out|burnt out|exhausted|tired|frustrated|confused)\b/i.test(
        text
      );

    const explicitDecisionLanguage =
      this.hasAny(text, [
        "what should i do",
        "what should we do",
        "what should i focus on",
        "what should i focus on first",
        "which should i choose",
        "which one should i choose",
        "help me decide",
        "help us decide",
        "which option",
        "which one",
        "best option",
        "best move",
        "what is the best move",
        "what deserves my attention",
        "what comes first",
        "what should come first",
        "what should i prioritize",
        "what should we prioritize",
        "prioritize",
        "pros and cons",
        "compare these options",
        "recommend"
      ]);

    const explicitPlanningLanguage =
      this.hasAny(text, [
        "make a plan",
        "create a plan",
        "build a plan",
        "give me a plan",
        "roadmap",
        "next steps",
        "step by step",
        "how should i approach",
        "how do i approach",
        "how can i organize",
        "schedule",
        "routine"
      ]);

    const explicitImplementationLanguage =
      this.hasAny(text, [
        "send the code",
        "send code",
        "full code",
        "entire code",
        "replace this file",
        "update this file",
        "rewrite this file",
        "patch this file",
        "fix this code",
        "implement this",
        "build this",
        "create this file",
        "write the function"
      ]);

    const developerDiscussion =
      this.hasAny(text, [
        "ari",
        "engine",
        "pipeline",
        "classifier",
        "semantic frame",
        "frame builder",
        "conversation function",
        "observer",
        "routing",
        "javascript",
        "html",
        "css",
        "github",
        "supabase",
        "vercel",
        "repository",
        "repo",
        "code",
        "file"
      ]);

    const explicitExplanationLanguage =
  this.hasAny(text, [
    "why is",
    "why does",
    "why do",
    "why did",
    "how does",
    "how do",
    "how did",
    "how come",
    "explain",
    "explain why",
    "explain how",
    "teach me",
    "define",
    "what does this mean",
    "what is the meaning",
    "what is the difference",
    "difference between",
    "break this down"
  ]);

    const explicitFactualLanguage =
      hasQuestion &&
      (
        this.hasAny(text, [
          "who is",
          "what is",
          "where is",
          "when is",
          "how many",
          "how much",
          "which country",
          "which city"
        ]) ||
        primaryPurpose === "factual" ||
        primaryPurpose === "teaching" ||
        primaryPurpose === "understanding"
      );

    const explicitWritingLanguage =
  this.hasAny(text, [
    "write me",
    "write this",
    "rewrite",
    "draft",
    "make this sound",
    "help me respond",
    "how do i respond",
    "write an email",
    "draft an email",
    "write a text message",
    "draft a text message",
    "write a caption",
    "write an essay",
    "write a paragraph",
    "make an invitation",
    "create an invitation"
  ]);

    const explicitTranslationLanguage =
      this.hasAny(text, [
        "translate",
        "translation",
        "translate this",
        "what does this say in"
      ]);

    const explicitCalculationLanguage =
      this.hasAny(text, [
        "calculate",
        "what is the percentage",
        "what percent",
        "convert",
        "in dollars",
        "in pesos",
        "how much is",
        "how many miles",
        "how many feet"
      ]);

    const explicitMemoryLanguage =
      this.hasAny(text, [
        "remember this",
        "remember that",
        "don't forget",
        "dont forget",
        "save this",
        "store this",
        "note that",
        "from now on",
        "going forward",
        "forget this",
        "forget that"
      ]);

    const explicitRecallLanguage =
      this.hasAny(text, [
        "do you remember",
        "what did i say",
        "what did we say",
        "what do you remember",
        "what do you know about me",
        "last time",
        "previously"
      ]);

    const explicitIdentityLanguage =
      this.hasAny(text, [
        "who are you",
        "what are you",
        "what is your personality",
        "what do you believe",
        "what do you stand for",
        "what is your purpose",
        "what is your favorite",
        "what do you prefer"
      ]);

    const explicitOpinionLanguage =
      this.hasAny(text, [
        "what do you think",
        "what is your opinion",
        "your opinion",
        "do you agree",
        "would you say"
      ]);

    const explicitVerificationLanguage =
      this.hasAny(text, [
        "verify",
        "check this",
        "is this correct",
        "is this right",
        "are you sure",
        "double check",
        "review this code",
        "look this over"
      ]);

    const explicitCreationLanguage =
      this.hasAny(text, [
        "make me",
        "create",
        "design",
        "generate",
        "build me",
        "draw",
        "illustrate"
      ]);

    const requestEvidenceFromQuestionEngine =
  Boolean(
    primaryPurpose &&
    ![
      "understanding",
      "unknown",
      "general"
    ].includes(primaryPurpose)
  ) ||
  requestedOperations.length > 0 ||
  requestedOutputs.length > 0;

const explicitRequestType =
  this.resolveExplicitRequestType({
    primaryPurpose,
    requestedOperations,
    requestedOutputs,

    explicitDecisionLanguage,
    explicitPlanningLanguage,
    explicitImplementationLanguage,
    explicitExplanationLanguage,
    explicitFactualLanguage,
    explicitWritingLanguage,
    explicitTranslationLanguage,
    explicitCalculationLanguage,
    explicitMemoryLanguage,
    explicitRecallLanguage,
    explicitIdentityLanguage,
    explicitOpinionLanguage,
    explicitVerificationLanguage,
    explicitCreationLanguage,
    explicitEmotionalSupportLanguage
  });

const explicitRequestPresent =
  explicitRequestType !== null;

const requestEvidencePresent =
  explicitRequestPresent ||
  requestEvidenceFromQuestionEngine;

    const explicitRequestedOperation =
      requestedOperations[0] ||
      this.operationFromRequestType(
        explicitRequestType
      );

    const explicitRequestedOutput =
      requestedOutputs[0] ||
      this.outputFromRequestType(
        explicitRequestType
      );

    const lifeSignalItems =
      Array.isArray(lifeSignals.signals)
        ? lifeSignals.signals
        : [];

    const lifeSignalNames =
      new Set(
        [
          ...(lifeSignals.signalNames || []),
          ...lifeSignalItems.map(item =>
            item?.name
          )
        ]
          .map(value =>
            this.normalize(value)
          )
          .filter(Boolean)
      );

    const lifeDomains =
      new Set(
        [
          ...(lifeSignals.domains || []),
          ...lifeSignalItems.map(item =>
            item?.domain
          )
        ]
          .map(value =>
            this.normalize(value)
          )
          .filter(Boolean)
      );

    const lifePressures =
      new Set(
        [
          ...(lifeSignals.pressures || []),
          ...lifeSignalItems.map(item =>
            item?.pressure
          )
        ]
          .map(value =>
            this.normalize(value)
          )
          .filter(Boolean)
      );

    const safetySignalPresent =
  Boolean(
    safety.riskLevel &&
    safety.riskLevel !== "none"
  );

    const safetyStopRequested =
      safety.shouldStopNormalResponse === true;

    const contextSignalsPresent =
      emotionalContextPresent ||
      lifeSignalNames.size > 0 ||
      lifeDomains.size > 0 ||
      lifePressures.size > 0;

    return {
      rawText,
      normalizedText: text,

      hasQuestion,
      wordCount,
      shortMessage: wordCount <= 7,

      observations,
      observedTypes: [...observedTypes],
      observedValues: [...observedValues],
      observedDomains: [...observedDomains],
      observedCategories: [...observedCategories],

      questionUnderstanding: {
        available:
          questionUnderstanding.questionUnderstandingRan === true,

        primaryPurpose:
          primaryPurpose ||
          null,

        purposeCandidates,
        supportPurposes,
        requestedOperations,
        requestedOutputs,

        confidence:
          this.normalizeConfidence(
            questionUnderstanding.primaryPurposeConfidence ??
            questionUnderstanding.confidence ??
            0
          )
      },

      explicitRequestPresent,
requestEvidencePresent,
requestEvidenceFromQuestionEngine,

explicitRequestType,
explicitRequestedOperation,
explicitRequestedOutput,

      explicitDecisionLanguage,
      explicitPlanningLanguage,
      explicitImplementationLanguage,
      explicitExplanationLanguage,
      explicitFactualLanguage,
      explicitWritingLanguage,
      explicitTranslationLanguage,
      explicitCalculationLanguage,
      explicitMemoryLanguage,
      explicitRecallLanguage,
      explicitIdentityLanguage,
      explicitOpinionLanguage,
      explicitVerificationLanguage,
      explicitCreationLanguage,

      developerDiscussion,

      emotionalContextPresent,
      directEmotionDisclosure,
      emotionalSupportExplicitlyRequested:
        explicitEmotionalSupportLanguage,

      lifeContextPresent:
        lifeSignalNames.size > 0 ||
        lifeDomains.size > 0,

      lifeSignalNames:
        [...lifeSignalNames],

      lifeDomains:
        [...lifeDomains],

      lifePressures:
        [...lifePressures],

      contextSignalsPresent,

      safetySignalPresent,
      safetyStopRequested,

      evidencePriorityRule:
        "explicit_requested_operation_over_contextual_signal",

      authority:
        "classification_signal_input_only"
    };
  },

  /* =====================================================
     EXPLICIT REQUEST RESOLUTION
  ===================================================== */

  resolveExplicitRequestType(signals = {}) {
    const primaryPurpose =
      this.normalize(
        signals.primaryPurpose
      );

    const operations =
      this.normalizeList(
        signals.requestedOperations
      );

    const outputs =
      this.normalizeList(
        signals.requestedOutputs
      );

    const operationText =
      operations.join(" ");

    const outputText =
      outputs.join(" ");

    if (
      signals.explicitImplementationLanguage ||
      this.includesAnyNormalized(
        operationText,
        ["implement", "modify", "build", "repair", "debug", "write code"]
      )
    ) {
      return "implementation";
    }

    if (
      signals.explicitDecisionLanguage ||
      primaryPurpose === "decision" ||
      this.includesAnyNormalized(
        operationText,
        ["decide", "choose", "prioritize", "recommend", "evaluate options"]
      )
    ) {
      return "decision";
    }

    if (
      signals.explicitPlanningLanguage ||
      primaryPurpose === "planning" ||
      this.includesAnyNormalized(
        operationText,
        ["plan", "organize", "sequence"]
      )
    ) {
      return "planning";
    }

    if (
      signals.explicitWritingLanguage ||
      primaryPurpose === "writing" ||
      this.includesAnyNormalized(
        operationText,
        ["write", "rewrite", "draft"]
      )
    ) {
      return "writing";
    }

    if (
      signals.explicitTranslationLanguage ||
      primaryPurpose === "translation" ||
      this.includesAnyNormalized(
        operationText,
        ["translate"]
      )
    ) {
      return "translation";
    }

    if (
      signals.explicitCalculationLanguage ||
      primaryPurpose === "calculation" ||
      this.includesAnyNormalized(
        operationText,
        ["calculate", "convert"]
      )
    ) {
      return "calculation";
    }

    if (
      signals.explicitVerificationLanguage ||
      primaryPurpose === "verification" ||
      this.includesAnyNormalized(
        operationText,
        ["verify", "review", "check"]
      )
    ) {
      return "verification";
    }

    if (
      signals.explicitMemoryLanguage ||
      primaryPurpose === "memory" ||
      this.includesAnyNormalized(
        operationText,
        ["remember", "save memory", "forget"]
      )
    ) {
      return "memory_command";
    }

    if (
      signals.explicitRecallLanguage ||
      primaryPurpose === "recall" ||
      this.includesAnyNormalized(
        operationText,
        ["recall", "retrieve memory"]
      )
    ) {
      return "recall";
    }

    if (
      signals.explicitIdentityLanguage ||
      primaryPurpose === "identity"
    ) {
      return "identity";
    }

    if (
      signals.explicitOpinionLanguage ||
      primaryPurpose === "opinion"
    ) {
      return "opinion";
    }

    if (
      signals.explicitCreationLanguage ||
      primaryPurpose === "creation" ||
      this.includesAnyNormalized(
        operationText,
        ["create", "generate", "design"]
      )
    ) {
      return "creation";
    }

    if (
  signals.explicitEmotionalSupportLanguage
) {
  return "emotional_support";
}

    if (
      signals.explicitExplanationLanguage ||
      primaryPurpose === "teaching" ||
      primaryPurpose === "meaning" ||
      this.includesAnyNormalized(
        operationText,
        ["explain", "teach", "interpret"]
      )
    ) {
      return "explanation";
    }

    if (
      signals.explicitFactualLanguage ||
      primaryPurpose === "factual" ||
      this.includesAnyNormalized(
        outputText,
        ["fact", "direct answer", "information"]
      )
    ) {
      return "information";
    }

    return null;
  },

  operationFromRequestType(type = null) {
    const operations = {
      implementation: "implement_or_modify",
      decision: "decide_or_prioritize",
      planning: "create_plan",
      writing: "produce_or_revise_text",
      translation: "translate",
      calculation: "calculate_or_convert",
      verification: "verify_or_review",
      memory_command: "save_or_forget_memory",
      recall: "retrieve_prior_context",
      identity: "answer_identity_question",
      opinion: "provide_opinion",
      creation: "create_artifact",
      emotional_support: "provide_emotional_support",
      explanation: "explain_or_teach",
      information: "provide_information"
    };

    return operations[type] || null;
  },

  outputFromRequestType(type = null) {
    const outputs = {
      implementation: "implementation_or_code",
      decision: "recommendation_or_priority",
      planning: "plan_or_roadmap",
      writing: "written_text",
      translation: "translated_text",
      calculation: "calculated_result",
      verification: "verification_result",
      memory_command: "memory_action",
      recall: "recalled_context",
      identity: "identity_answer",
      opinion: "opinion",
      creation: "created_artifact",
      emotional_support: "supportive_response",
      explanation: "explanation",
      information: "direct_information"
    };

    return outputs[type] || null;
  },

  /* =====================================================
     CANDIDATE BUILDING
  ===================================================== */

  buildCandidates(signals = {}) {
    const candidates = [];
    const add = candidate =>
      this.addCandidate(
        candidates,
        candidate
      );

    const explicitType =
      signals.explicitRequestType;

    if (explicitType === "implementation") {
      add({
        type: "implementation_request",
        interactionFamily: "developer_task",
        intent: "implement_or_modify",
        intentFamily: "artifact_execution",
        score: 96,
        evidence: this.evidenceFor(signals, [
          "explicitImplementationLanguage",
          "explicitRequestedOperation",
          "explicitRequestedOutput"
        ]),
        reasons: [
          "The user explicitly requested implementation, code, repair, or modification."
        ]
      });
    }

    if (explicitType === "decision") {
      add({
        type: "decision_request",
        interactionFamily: "decision",
        intent: this.resolveDecisionIntent(signals),
        intentFamily: "recommendation",
        score: 95,
        evidence: this.evidenceFor(signals, [
          "explicitDecisionLanguage",
          "explicitRequestedOperation",
          "explicitRequestedOutput"
        ]),
        reasons: [
          "The user explicitly requested a choice, recommendation, or priority."
        ]
      });
    }

    if (explicitType === "planning") {
      add({
        type: "planning_request",
        interactionFamily: "planning",
        intent: "create_plan_or_roadmap",
        intentFamily: "planning",
        score: 94,
        evidence: this.evidenceFor(signals, [
          "explicitPlanningLanguage",
          "explicitRequestedOperation",
          "explicitRequestedOutput"
        ]),
        reasons: [
          "The user explicitly requested a plan, roadmap, sequence, or schedule."
        ]
      });
    }

    if (explicitType === "writing") {
      add({
        type: "writing_request",
        interactionFamily: "writing",
        intent: "produce_or_revise_text",
        intentFamily: "text_generation",
        score: 94,
        evidence: this.evidenceFor(signals, [
          "explicitWritingLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested writing or revision."
        ]
      });
    }

    if (explicitType === "translation") {
      add({
        type: "translation_request",
        interactionFamily: "translation",
        intent: "translate_text",
        intentFamily: "language_transformation",
        score: 95,
        evidence: this.evidenceFor(signals, [
          "explicitTranslationLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested translation."
        ]
      });
    }

    if (explicitType === "calculation") {
      add({
        type: "calculation_request",
        interactionFamily: "calculation",
        intent: "calculate_or_convert",
        intentFamily: "calculation",
        score: 96,
        evidence: this.evidenceFor(signals, [
          "explicitCalculationLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested a calculation or conversion."
        ]
      });
    }

    if (explicitType === "verification") {
      add({
        type: "verification_request",
        interactionFamily: "verification",
        intent: "verify_or_review",
        intentFamily: "verification",
        score: 94,
        evidence: this.evidenceFor(signals, [
          "explicitVerificationLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested verification, checking, or review."
        ]
      });
    }

    if (explicitType === "memory_command") {
      add({
        type: "memory_command",
        interactionFamily: "memory",
        intent: "save_or_forget_memory",
        intentFamily: "memory_action",
        score: 96,
        evidence: this.evidenceFor(signals, [
          "explicitMemoryLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested a memory action."
        ]
      });
    }

    if (explicitType === "recall") {
      add({
        type: "recall_request",
        interactionFamily: "continuity",
        intent: "retrieve_prior_context",
        intentFamily: "recall",
        score: 95,
        evidence: this.evidenceFor(signals, [
          "explicitRecallLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly asked for prior context or memory."
        ]
      });
    }

    if (explicitType === "identity") {
      add({
        type: "identity_question",
        interactionFamily: "identity",
        intent: "answer_identity_question",
        intentFamily: "identity",
        score: 92,
        evidence: this.evidenceFor(signals, [
          "explicitIdentityLanguage"
        ]),
        reasons: [
          "The user explicitly asked about identity, personality, purpose, or preference."
        ]
      });
    }

    if (explicitType === "opinion") {
      add({
        type: "opinion_request",
        interactionFamily: "opinion",
        intent: "provide_opinion",
        intentFamily: "judgment",
        score: 91,
        evidence: this.evidenceFor(signals, [
          "explicitOpinionLanguage"
        ]),
        reasons: [
          "The user explicitly requested an opinion or judgment."
        ]
      });
    }

    if (explicitType === "creation") {
      add({
        type: "creation_request",
        interactionFamily: "creation",
        intent: "create_artifact",
        intentFamily: "artifact_creation",
        score: 93,
        evidence: this.evidenceFor(signals, [
          "explicitCreationLanguage",
          "explicitRequestedOutput"
        ]),
        reasons: [
          "The user explicitly requested creation of an artifact or output."
        ]
      });
    }

    if (explicitType === "emotional_support") {
      add({
        type: "emotional_support_request",
        interactionFamily: "emotional_support",
        intent: "support_and_listen",
        intentFamily: "emotional_support",
        score: 96,
        evidence: this.evidenceFor(signals, [
          "emotionalSupportExplicitlyRequested",
          "directEmotionDisclosure"
        ]),
        reasons: [
          "The user explicitly requested listening, comfort, or emotional support."
        ]
      });
    }

    if (explicitType === "explanation") {
      add({
        type: "explanation_request",
        interactionFamily: "information",
        intent: "explain_or_teach",
        intentFamily: "explanation",
        score: 92,
        evidence: this.evidenceFor(signals, [
          "explicitExplanationLanguage",
          "explicitRequestedOperation"
        ]),
        reasons: [
          "The user explicitly requested an explanation, interpretation, or teaching."
        ]
      });
    }

    if (explicitType === "information") {
      add({
        type: "information_question",
        interactionFamily: "information",
        intent: "provide_information",
        intentFamily: "fact_retrieval",
        score: 91,
        evidence: this.evidenceFor(signals, [
          "explicitFactualLanguage",
          "hasQuestion"
        ]),
        reasons: [
          "The user explicitly requested factual information."
        ]
      });
    }

    if (
      signals.emotionalContextPresent &&
      !signals.emotionalSupportExplicitlyRequested
    ) {
      add({
        type: "emotional_context_present",
        interactionFamily: "context",
        intent: "preserve_emotional_context",
        intentFamily: "contextual_modifier",
        score: 58,
        contextualOnly: true,
        evidence: this.evidenceFor(signals, [
          "emotionalContextPresent",
          "directEmotionDisclosure"
        ]),
        reasons: [
          "Emotional language is present, but emotional support was not necessarily the primary request."
        ]
      });
    }

    if (
      signals.lifeContextPresent
    ) {
      add({
        type: "life_context_present",
        interactionFamily: "context",
        intent: "preserve_life_context",
        intentFamily: "contextual_modifier",
        score: 54,
        contextualOnly: true,
        evidence: [
          ...signals.lifeSignalNames,
          ...signals.lifeDomains,
          ...signals.lifePressures
        ],
        reasons: [
          "Life context, transitions, or pressure signals are present."
        ]
      });
    }

    if (
      signals.hasQuestion &&
      !signals.explicitRequestPresent
    ) {
      add({
        type: "general_question",
        interactionFamily: "information",
        intent: "answer_question",
        intentFamily: "general_question",
        score: 66,
        evidence: ["question_form"],
        reasons: [
          "The message is a question, but its specific requested operation remains broad."
        ]
      });
    }

    if (
      !signals.explicitRequestPresent &&
      signals.directEmotionDisclosure
    ) {
      add({
        type: "emotional_disclosure",
        interactionFamily: "emotional_support",
        intent: "respond_to_emotional_disclosure",
        intentFamily: "emotional_expression",
        score: 74,
        evidence: this.evidenceFor(signals, [
          "directEmotionDisclosure",
          "emotionalContextPresent"
        ]),
        reasons: [
          "The user disclosed an emotional state without another stronger explicit request."
        ]
      });
    }

    if (
      !signals.explicitRequestPresent &&
      !signals.hasQuestion &&
      !signals.directEmotionDisclosure
    ) {
      add(
        this.defaultCandidate()
      );
    }

    return candidates;
  },

  rankCandidates(candidates = [], signals = {}) {
    return candidates
      .map(candidate => {
        let score =
          Number(candidate.score || 0);

        const explicitPrimaryCandidate =
          signals.explicitRequestPresent &&
          !candidate.contextualOnly &&
          this.candidateMatchesExplicitRequest(
            candidate,
            signals.explicitRequestType
          );

        if (explicitPrimaryCandidate) {
          score += 8;
        }

        if (
          candidate.contextualOnly &&
          signals.explicitRequestPresent
        ) {
          score -= 18;
        }

        if (
          candidate.type === "emotional_support_request" &&
          !signals.emotionalSupportExplicitlyRequested &&
          signals.explicitRequestPresent
        ) {
          score -= 45;
        }

        if (
          candidate.type === "emotional_disclosure" &&
          signals.explicitRequestPresent
        ) {
          score -= 35;
        }

        if (
          signals.safetyStopRequested &&
          candidate.interactionFamily !== "safety"
        ) {
          score -= 5;
        }

        score =
          Math.max(
            0,
            Math.min(100, score)
          );

        return {
          ...candidate,
          score,
          confidence:
            this.normalizeConfidence(
              Math.min(score / 100, 0.94)
            ),
          confidenceLabel:
            this.confidenceLabel(
              Math.min(score / 100, 0.94)
            )
        };
      })
      .filter(candidate =>
        candidate.score > 0
      )
      .sort((a, b) => {
        if (
          b.score !== a.score
        ) {
          return b.score - a.score;
        }

        if (
          a.contextualOnly !==
          b.contextualOnly
        ) {
          return a.contextualOnly
            ? 1
            : -1;
        }

        return 0;
      });
  },

  candidateMatchesExplicitRequest(
    candidate = {},
    explicitType = null
  ) {
    const map = {
      implementation: [
        "implementation_request"
      ],
      decision: [
        "decision_request"
      ],
      planning: [
        "planning_request"
      ],
      writing: [
        "writing_request"
      ],
      translation: [
        "translation_request"
      ],
      calculation: [
        "calculation_request"
      ],
      verification: [
        "verification_request"
      ],
      memory_command: [
        "memory_command"
      ],
      recall: [
        "recall_request"
      ],
      identity: [
        "identity_question"
      ],
      opinion: [
        "opinion_request"
      ],
      creation: [
        "creation_request"
      ],
      emotional_support: [
        "emotional_support_request"
      ],
      explanation: [
        "explanation_request"
      ],
      information: [
        "information_question"
      ]
    };

    return Boolean(
      map[explicitType]?.includes(
        candidate.type
      )
    );
  },

  resolveDecisionIntent(signals = {}) {
    const operation =
      this.normalize(
        signals.explicitRequestedOperation
      );

    const text =
      signals.normalizedText ||
      "";

    if (
      operation.includes("prioritize") ||
      this.hasAny(text, [
        "focus on first",
        "what comes first",
        "prioritize",
        "what deserves my attention"
      ])
    ) {
      return "prioritization";
    }

    if (
      operation.includes("compare") ||
      this.hasAny(text, [
        "compare",
        "pros and cons",
        "versus",
        "vs"
      ])
    ) {
      return "compare_options";
    }

    if (
      operation.includes("recommend") ||
      this.hasAny(text, [
        "recommend",
        "best option",
        "best move"
      ])
    ) {
      return "recommend_option";
    }

    return "decision_guidance";
  },

  /* =====================================================
     DOMAIN AND CONTEXT RESOLUTION
  ===================================================== */

  resolveDomains(signals = {}) {
    const scored = new Map();

    const add = (
      domain,
      score,
      evidence = null
    ) => {
      const key =
        this.normalizeDomain(domain);

      if (!key) return;

      const current =
        scored.get(key) || {
          domain: key,
          score: 0,
          evidence: []
        };

      current.score +=
        Number(score || 0);

      if (evidence) {
        current.evidence.push(
          evidence
        );
      }

      scored.set(
        key,
        current
      );
    };

    signals.observedDomains.forEach(
      domain =>
        add(domain, 35, "observer")
    );

    signals.lifeDomains.forEach(
      domain =>
        add(domain, 30, "life_signal")
    );

    signals.lifeSignalNames.forEach(
      signal => {
        if (
          signal.includes("family") ||
          signal.includes("fatherhood") ||
          signal.includes("parenthood")
        ) {
          add("family", 35, signal);
        }

        if (
          signal.includes("military")
        ) {
          add("military", 35, signal);
        }

        if (
          signal.includes("career")
        ) {
          add("career", 30, signal);
        }

        if (
          signal.includes("creative") ||
          signal.includes("mission")
        ) {
          add("project", 28, signal);
        }

        if (
          signal.includes("capacity") ||
          signal.includes("achievement pressure")
        ) {
          add("capacity", 25, signal);
        }

        if (
          signal.includes("identity")
        ) {
          add("identity", 25, signal);
        }
      }
    );

    const text =
      signals.normalizedText ||
      "";

    if (
      signals.developerDiscussion ||
      this.hasAny(text, [
        "ari",
        "code",
        "file",
        "engine",
        "pipeline",
        "app",
        "github",
        "javascript",
        "html",
        "css"
      ])
    ) {
      add("project", 40, "developer_language");
      add("technology", 25, "developer_language");
    }

    if (
      this.hasAny(text, [
        "pain",
        "symptom",
        "pregnant",
        "pregnancy",
        "doctor",
        "hospital",
        "medication",
        "bleeding",
        "fever",
        "stroke",
        "seizure",
        "breathing"
      ]) ||
      this.hasObservationType(
        signals.observations,
        "body_symptom"
      )
    ) {
      add("medical", 42, "medical_language");
    }

    if (
      this.hasAny(text, [
        "wife",
        "husband",
        "spouse",
        "partner",
        "relationship",
        "girlfriend",
        "boyfriend"
      ])
    ) {
      add("relationship", 35, "relationship_language");
    }

    if (
      this.hasAny(text, [
        "baby",
        "child",
        "children",
        "daughter",
        "son",
        "mom",
        "mother",
        "dad",
        "father",
        "family"
      ])
    ) {
      add("family", 38, "family_language");
    }

    if (
      this.hasAny(text, [
        "money",
        "debt",
        "loan",
        "credit",
        "rent",
        "salary",
        "budget",
        "afford",
        "payment"
      ])
    ) {
      add("finance", 38, "financial_language");
    }

    if (
      this.hasAny(text, [
        "job",
        "career",
        "school",
        "college",
        "degree",
        "resume",
        "interview",
        "promotion"
      ])
    ) {
      add("career", 34, "career_language");
    }

    if (
      signals.emotionalContextPresent
    ) {
      add("emotion", 24, "emotional_context");
    }

    if (
      signals.lifePressures.some(
        value =>
          value.includes("capacity") ||
          value.includes("resource") ||
          value.includes("time")
      ) ||
      this.hasAny(text, [
        "exhausted",
        "overwhelmed",
        "no time",
        "running out of time",
        "capacity",
        "too much"
      ])
    ) {
      add("capacity", 32, "capacity_pressure");
    }

    if (
      signals.explicitWritingLanguage
    ) {
      add("writing", 42, "explicit_writing_request");
    }

    if (
      signals.explicitTranslationLanguage
    ) {
      add("language", 42, "explicit_translation_request");
    }

    if (
      signals.explicitCalculationLanguage
    ) {
      add("calculation", 42, "explicit_calculation_request");
    }

    if (
      signals.explicitMemoryLanguage ||
      signals.explicitRecallLanguage
    ) {
      add("memory", 42, "explicit_memory_request");
    }

    if (
      signals.explicitIdentityLanguage
    ) {
      add("identity", 42, "explicit_identity_request");
    }

    const ranked =
      [...scored.values()]
        .sort((a, b) =>
          b.score - a.score
        )
        .map(item =>
          item.domain
        );

    return ranked.length
      ? ranked
      : ["general_understanding"];
  },

  resolveContextualSignals(signals = {}) {
    const contextual = [];

    const add = value => {
      if (
        value &&
        !contextual.includes(value)
      ) {
        contextual.push(value);
      }
    };

    if (
      signals.emotionalContextPresent
    ) {
      add("emotional_context");
    }

    if (
      signals.directEmotionDisclosure
    ) {
      add("expressed_emotional_state");
    }

    if (
      signals.lifeContextPresent
    ) {
      add("life_context");
    }

    signals.lifeSignalNames.forEach(add);
    signals.lifePressures.forEach(add);

    if (
      signals.safetySignalPresent
    ) {
      add("possible_safety_context");
    }

    return contextual;
  },

  normalizeDomain(value = "") {
    const domain =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const map = {
      body: "medical",
      health: "medical",
      medical_body: "medical",
      medical_context: "medical",

      builder: "project",
      builder_or_system: "project",
      coding: "project",
      developer: "project",

      financial: "finance",
      money: "finance",

      relationships: "relationship",

      parenthood: "family",

      emotional: "emotion",

      resource_pressure: "capacity"
    };

    return map[domain] || domain;
  },

  /* =====================================================
     OUTPUT HELPERS
  ===================================================== */

  buildNonAuthoritativeHint(
    candidate = {},
    signals = {}
  ) {
    if (
      candidate.contextualOnly
    ) {
      return "Preserve this as context. Do not let it replace a stronger explicit request.";
    }

    if (
      signals.explicitRequestPresent
    ) {
      return `Preserve the explicit ${signals.explicitRequestType || "user"} request for downstream semantic confirmation.`;
    }

    return "Use this as a broad classification hint only.";
  },

  evidenceFor(
    signals = {},
    keys = []
  ) {
    const evidence = [];

    keys.forEach(key => {
      const value =
        signals[key];

      if (
        value === true
      ) {
        evidence.push(key);
      } else if (
        typeof value === "string" &&
        value
      ) {
        evidence.push(
          `${key}:${value}`
        );
      } else if (
        Array.isArray(value) &&
        value.length
      ) {
        evidence.push(
          ...value.map(item =>
            `${key}:${item}`
          )
        );
      }
    });

    return [
      ...new Set(evidence)
    ];
  },

  addCandidate(
    candidates = [],
    candidate = {}
  ) {
    if (
      !candidate.type
    ) {
      return;
    }

    const existing =
      candidates.find(item =>
        item.type === candidate.type
      );

    if (!existing) {
      candidates.push({
        contextualOnly: false,
        evidence: [],
        reasons: [],
        ...candidate
      });

      return;
    }

    existing.score =
      Math.max(
        Number(existing.score || 0),
        Number(candidate.score || 0)
      );

    existing.evidence = [
      ...new Set([
        ...(existing.evidence || []),
        ...(candidate.evidence || [])
      ])
    ];

    existing.reasons = [
      ...new Set([
        ...(existing.reasons || []),
        ...(candidate.reasons || [])
      ])
    ];
  },

  defaultCandidate() {
    return {
      type: "general_conversation",
      interactionFamily: "general",
      intent: "respond_normally",
      intentFamily: "general_response",
      score: 50,
      contextualOnly: false,
      evidence: [],
      reasons: [
        "No stronger explicit interaction family was detected."
      ]
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  detectQuestion(
    text = "",
    observations = []
  ) {
    return (
      text.includes("?") ||
      this.hasObservationType(
        observations,
        "question_mark_count"
      ) ||
      this.hasObservationType(
        observations,
        "question_phrase"
      ) ||
      this.hasObservationType(
        observations,
        "question_shape"
      ) ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/i.test(
        text
      )
    );
  },

  hasObservationType(
    observations = [],
    type = ""
  ) {
    const normalizedType =
      this.normalize(type);

    return observations.some(
      observation =>
        this.normalize(
          observation?.type
        ) === normalizedType
    );
  },

  normalizeList(value = []) {
    if (
      !Array.isArray(value)
    ) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return [];
      }

      return [
        this.normalize(value)
      ].filter(Boolean);
    }

    return value
      .map(item => {
        if (
          typeof item === "string"
        ) {
          return this.normalize(item);
        }

        return this.normalize(
          item?.operation ||
          item?.value ||
          item?.name ||
          item?.type ||
          ""
        );
      })
      .filter(Boolean);
  },

  includesAnyNormalized(
    text = "",
    terms = []
  ) {
    const normalizedText =
      this.normalize(text);

    return terms.some(
      term =>
        normalizedText.includes(
          this.normalize(term)
        )
    );
  },

  hasAny(
    text = "",
    terms = []
  ) {
    const normalizedText =
      this.normalize(text);

    return terms.some(term => {
      const normalizedTerm =
        this.normalize(term);

      if (
        !normalizedTerm
      ) {
        return false;
      }

      const escaped =
        normalizedTerm.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      if (
        normalizedTerm.includes(" ")
      ) {
        return normalizedText.includes(
          normalizedTerm
        );
      }

      return new RegExp(
        `\\b${escaped}\\b`,
        "i"
      ).test(normalizedText);
    });
  },

  normalizeConfidence(value = 0) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (
      number > 1
    ) {
      return Math.max(
        0,
        Math.min(1, number / 100)
      );
    }

    return Math.max(
      0,
      Math.min(1, number)
    );
  },

  confidenceLabel(value = 0) {
    const confidence =
      this.normalizeConfidence(value);

    if (
      confidence >= 0.88
    ) {
      return "high";
    }

    if (
      confidence >= 0.68
    ) {
      return "medium";
    }

    if (
      confidence >= 0.45
    ) {
      return "low";
    }

    return "very_low";
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.universalConversationClassifier =
  window.AriUniversalConversationClassifier;

console.log(
  "ARI UNIVERSAL CONVERSATION CLASSIFIER LOADED:",
  window.AriUniversalConversationClassifier?.version
);