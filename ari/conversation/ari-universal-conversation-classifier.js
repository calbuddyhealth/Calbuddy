// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Early broad conversation tagging only.
// V3.3.1 — Weak Classifier / Semantic Confirmation Required / Emotional Distress Protected

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "3.3.1",

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
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const conversationFunction =
      summary.conversationFunction ||
      summary.conversationFunctionResult ||
      summary.appContext?.conversationFunction ||
      {};

    const thread =
      summary.threadUnderstanding ||
      summary.continuityContext ||
      summary.continuityPacket?.activeThread?.workingContext ||
      summary.continuityPacket?.activeThread ||
      {};

    const semanticFrame =
      summary.semanticFrame ||
      summary.activeSemanticFrame ||
      summary.currentSemanticFrame ||
      thread.semanticFrame ||
      thread.activeSemanticFrame ||
      thread.semanticState?.semanticFrame ||
      null;

    const signals = this.buildSignals({
      text,
      rawText,
      observations,
      conversationFunction,
      semanticFrame,
      thread
    });

    const candidates = this.buildCandidates(signals);
    const ranked = this.rank(candidates, signals);

    const top = ranked[0] || {
      type: "general_conversation",
      intent: "respond_normally",
      score: 50,
      confidence: "low",
      responseHint: "Respond normally.",
      reasons: ["No strong broad conversation tag detected."]
    };

    return {
      classifierRan: true,
      universalConversationClassifierRan: true,
      classifierVersion: this.version,
      source: "ari-universal-conversation-classifier",

      conversationType: top.type,
      conversationIntent: top.intent,
      score: Math.min(top.score, 72),
      rawScore: top.score,
      confidence: this.confidenceLabel(Math.min(top.score, 72)),
      responseHint: top.responseHint || "Respond normally.",
      reasons: top.reasons || [],

      semanticSignals: signals,
      candidates: ranked.slice(0, 7),

      authority: "weak_classification_only",
      requiresSemanticConfirmation: true,
      confidenceCap: 72,

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation",
        "mouthPattern",
        "shouldUseKnowledge",
        "bypassKnowledge"
      ]
    };
  },

  buildSignals({
    text = "",
    rawText = "",
    observations = [],
    conversationFunction = {},
    semanticFrame = null,
    thread = {}
  } = {}) {
    const functionSignals = conversationFunction.signalProfile || {};

    const functionPrimary = this.normalize(
      conversationFunction.primaryFunction ||
      conversationFunction.dominantUserMove ||
      ""
    );

    const functionMetaDeveloper =
      conversationFunction.metaDeveloperQuestion === true ||
      functionSignals.metaDeveloperQuestion === true;

    const functionDeveloperArtifact =
      conversationFunction.developerArtifactRequest === true ||
      functionSignals.developerArtifactRequest === true;

    const functionExpectsCode =
      conversationFunction.expectsCodeOrArtifact === true ||
      functionSignals.expectsCodeOrArtifact === true;

    const frame =
      semanticFrame?.currentTurnFrame ||
      semanticFrame?.primaryFrame ||
      semanticFrame?.currentTurnMeaning ||
      semanticFrame ||
      {};

    const semanticDomain = this.normalize(frame.domain || semanticFrame?.domain || "");
    const semanticIntent = this.normalize(frame.intent || semanticFrame?.intent || "");
    const semanticMeaning = this.normalize(
      frame.frameType ||
      frame.primaryMeaning ||
      frame.meaning ||
      semanticFrame?.meaning ||
      ""
    );

    const hasQuestion = this.hasQuestion(text, observations, thread);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const isShort = wordCount <= 6;

    const emotionalWords = this.hasAny(text, [
      "sad",
      "upset",
      "hurt",
      "mad",
      "angry",
      "worried",
      "scared",
      "anxious",
      "stressed",
      "overwhelmed",
      "lonely",
      "depressed",
      "down",
      "burned out",
      "exhausted",
      "tired",
      "hate feeling this way"
    ]) || this.hasType(observations, "emotion_word");

    const directEmotionDisclosure =
      /\b(i'?m|i am|i feel|i felt|feeling|felt|i got|i became|i was)\s+(really|very|pretty|so|kinda|kind of|super|extremely|a little|sort of|honestly|just)?\s*(sad|upset|hurt|mad|angry|worried|scared|anxious|stressed|overwhelmed|lonely|depressed|down|burned out|exhausted|tired)\b/i.test(text);

    const emotionalSupportRequest =
      emotionalWords &&
      (
        directEmotionDisclosure ||
        this.hasAny(text, [
          "long day",
          "bad day",
          "rough day",
          "hard day",
          "heavy day",
          "need to talk",
          "talk to someone",
          "someone to talk",
          "need someone",
          "feel better",
          "hate feeling this way",
          "don't know what to do",
          "dont know what to do",
          "i don't know what to do",
          "i dont know what to do",
          "can i vent",
          "just need to vent",
          "listen to me",
          "be here with me"
        ])
      );

    const distressActionUncertainty =
      emotionalWords &&
      this.hasAny(text, [
        "don't know what to do",
        "dont know what to do",
        "i don't know what to do",
        "i dont know what to do",
        "what do i do"
      ]);

    const actionAsk =
      !emotionalSupportRequest &&
      this.hasAny(text, [
        "what should i do",
        "what should we do",
        "should i",
        "should we",
        "best move",
        "next step",
        "recommend",
        "which option",
        "which one",
        "pros and cons",
        "compare"
      ]);

    const decisionStructure =
      !emotionalSupportRequest &&
      (
        actionAsk ||
        this.hasAny(text, ["either", "option", "choose between", "compare"]) ||
        this.hasType(observations, "contrast_or_tradeoff_connector")
      );

    const metaDeveloperQuestion =
      functionMetaDeveloper ||
      (
        hasQuestion &&
        this.hasAny(text, [
          "should ari",
          "should it",
          "does it",
          "will it",
          "would it",
          "can it",
          "trigger",
          "detect",
          "classify",
          "identify",
          "semantic",
          "keyword",
          "keyterm",
          "routing",
          "conversation function",
          "file context",
          "developer request",
          "treat this",
          "outdated",
          "brittle",
          "regex",
          "pattern",
          "signal"
        ]) &&
        this.hasAny(text, [
          "ari",
          "classifier",
          "classification",
          "semantic",
          "routing",
          "code",
          "file",
          "pipeline",
          "function",
          "engine",
          "keyword",
          "keyterm"
        ])
      );

    const builderOrSystem =
      functionDeveloperArtifact ||
      functionExpectsCode ||
      this.hasAny(text, [
        "code",
        "file",
        "bug",
        "debug",
        "fix this",
        "not working",
        "function",
        "engine",
        "pipeline",
        "github",
        "vercel",
        "supabase",
        "javascript",
        "html",
        "css",
        "api",
        "repo",
        "repository"
      ]);

    const explicitCodeRequest =
      !metaDeveloperQuestion &&
      (
        functionDeveloperArtifact ||
        functionExpectsCode ||
        this.hasAny(text, [
          "send code",
          "full code",
          "replace this file",
          "update this file",
          "patch this file",
          "rewrite this file",
          "implement this",
          "fix the code"
        ])
      );

    const languageOrInterpretation =
      this.hasAny(text, [
        "translate",
        "translation",
        "interpret this",
        "what does this mean",
        "what does this say",
        "meaning",
        "bible verse",
        "scripture",
        "quote"
      ]);

    const writingTask =
      this.hasAny(text, [
        "rewrite",
        "write",
        "draft",
        "make this sound",
        "email",
        "text message",
        "caption",
        "essay",
        "paper",
        "paragraph"
      ]);

    const calculationTask =
      this.hasAny(text, [
        "calculate",
        "convert",
        "percent",
        "how much",
        "how many",
        "in dollars",
        "in pesos"
      ]);

    const medicalOrBody =
      this.hasAny(text, [
        "pain",
        "fever",
        "bleeding",
        "pregnant",
        "chest",
        "breathing",
        "faint",
        "vomit",
        "diarrhea",
        "swallow",
        "symptom",
        "stroke",
        "seizure"
      ]) || this.hasType(observations, "body_symptom");

    const relationshipOrFamily =
      this.hasAny(text, [
        "wife",
        "husband",
        "spouse",
        "partner",
        "girlfriend",
        "boyfriend",
        "family",
        "kids",
        "children",
        "father",
        "mother",
        "mom",
        "dad",
        "married"
      ]) ||
      this.hasType(observations, "relationship_reference") ||
      this.hasType(observations, "family_reference");

    const financial =
      this.hasAny(text, [
        "money",
        "debt",
        "pay",
        "salary",
        "budget",
        "lease",
        "loan",
        "credit",
        "rent"
      ]);

    const petOrAnimal =
      this.hasAny(text, [
        "cat",
        "dog",
        "pet",
        "kitten",
        "puppy",
        "vet",
        "flower safe",
        "toxic to cats"
      ]);

    const asksAriPreference =
  /\b(what is|what's|whats|what are)\s+your\s+(favorite|favourite|preference|opinion)\b/i.test(text) ||
  /\bwhat\s+do\s+you\s+(like|prefer|love|hate|dislike)\b/i.test(text);

const explicitMemoryRequest =
  this.hasAny(text, [
    "remember",
    "forget",
    "save this",
    "store this",
    "note that",
    "from now on"
  ]);

const identityQuestion =
  this.hasAny(text, [
    "who are you",
    "what are you",
    "your personality"
  ]);

const memoryOrIdentity =
  explicitMemoryRequest ||
  identityQuestion ||
  asksAriPreference;

    const referenceDependency =
      isShort &&
      this.hasAny(text, ["it", "that", "this", "they", "them", "her", "him"]);

    let broadDomain = "general_understanding";

    if (semanticDomain.includes("emotion")) broadDomain = "emotion";
    else if (metaDeveloperQuestion) broadDomain = "general_understanding";
    else if (builderOrSystem) broadDomain = "builder_or_system";
    else if (medicalOrBody) broadDomain = "medical_or_body";
    else if (relationshipOrFamily) broadDomain = "relationship_or_family";
    else if (financial) broadDomain = "financial";
    else if (petOrAnimal) broadDomain = "animal_health_or_pet";
    else if (writingTask) broadDomain = "writing";
    else if (calculationTask) broadDomain = "calculation";
    else if (memoryOrIdentity) broadDomain = "memory_or_identity";
    else if (emotionalWords) broadDomain = "emotion";

    let broadNeed = "general_response";

    if (emotionalSupportRequest) broadNeed = "emotional_attunement";
    else if (metaDeveloperQuestion) broadNeed = "understanding";
    else if (explicitCodeRequest) broadNeed = "implementation_help";
    else if (writingTask) broadNeed = "produce_or_revise_text";
    else if (calculationTask) broadNeed = "calculate";
    else if (languageOrInterpretation) broadNeed = "understanding";
    else if (actionAsk || decisionStructure) broadNeed = "decision_or_action_guidance";
    else if (hasQuestion) broadNeed = "understanding";
    else if (memoryOrIdentity) broadNeed = "memory_or_identity";
    else if (emotionalWords) broadNeed = "emotional_attunement";

    return {
      rawText,
      normalizedText: text,

      hasQuestion,
      wordCount,
      isShort,

      broadDomain,
      broadNeed,

      emotionalWords,
      directEmotionDisclosure,
      emotionalSupportRequest,
      distressActionUncertainty,

      actionAsk,
      decisionStructure,

      metaDeveloperQuestion,
      builderOrSystem,
      explicitCodeRequest,
      languageOrInterpretation,
      writingTask,
      calculationTask,
      medicalOrBody,
      relationshipOrFamily,
      financial,
      petOrAnimal,
      memoryOrIdentity,
      asksAriPreference,
explicitMemoryRequest,
identityQuestion,
      referenceDependency,

      conversationFunction: {
        available: Boolean(conversationFunction && Object.keys(conversationFunction).length),
        primaryFunction: functionPrimary || null,
        developerArtifactRequest: functionDeveloperArtifact,
        expectsCodeOrArtifact: functionExpectsCode,
        metaDeveloperQuestion
      },

      semanticFrame: {
        available: Boolean(semanticFrame),
        meaning: semanticMeaning || null,
        domain: semanticDomain || null,
        intent: semanticIntent || null,
        confidence: frame.confidence || semanticFrame?.confidence || null
      },

      authority: "weak_semantic_signal_handoff_only"
    };
  },

  buildCandidates(signals = {}) {
    const candidates = [];

    const add = item => this.add(candidates, item);

    if (signals.emotionalSupportRequest) {
      add({
        type: "emotional_support_request",
        intent: "comfort_and_grounding",
        score: 96,
        responseHint:
          "Lead with warmth and presence. Do not treat emotional helplessness as a decision question.",
        reasons: [
          "Emotional distress is present.",
          "User appears to need support, grounding, or someone to talk to."
        ]
      });
    }

    if (signals.metaDeveloperQuestion) {
      add({
        type: "meta_developer_routing_question",
        intent: "explain_developer_routing_behavior",
        score: 94,
        responseHint:
          "Answer the routing/classification question directly. Do not trigger code patch behavior.",
        reasons: ["User is asking about Ari/system classification behavior."]
      });
    }

    if (signals.explicitCodeRequest) {
      add({
        type: "builder_task",
        intent: "implementation_help",
        score: 92,
        responseHint: "Help with code or system implementation.",
        reasons: ["User is asking for code or system implementation help."]
      });
    }

    if (signals.writingTask) {
      add({
        type: "writing_task",
        intent: "produce_or_revise_text",
        score: 88,
        responseHint: "Write or revise the requested text.",
        reasons: ["User is asking for writing or rewriting help."]
      });
    }

    if (signals.calculationTask) {
      add({
        type: "calculation_task",
        intent: "calculate",
        score: 86,
        responseHint: "Calculate directly.",
        reasons: ["User is asking for calculation or conversion."]
      });
    }

    if (signals.languageOrInterpretation) {
      add({
        type: "language_or_interpretation_request",
        intent: "explain_or_translate",
        score: 84,
        responseHint: "Translate, interpret, or explain the text directly.",
        reasons: ["User is asking for meaning, interpretation, or translation."]
      });
    }

    if (signals.decisionStructure || signals.actionAsk) {
      add({
        type: "decision_or_action_question",
        intent: "decision_or_action_guidance",
        score: 82,
        responseHint: "Give practical guidance or a recommended next step.",
        reasons: ["User appears to be asking what action to take or weighing options."]
      });
    }

    if (signals.medicalOrBody) {
      add({
        type: "medical_or_body_concern",
        intent: "health_context_support",
        score: 84,
        responseHint: "Handle health/body context carefully.",
        reasons: ["Health or body concern detected."]
      });
    }

    if (signals.relationshipOrFamily) {
      add({
        type: "relationship_or_family_context",
        intent: "relationship_context_support",
        score: signals.emotionalWords ? 84 : 78,
        responseHint: "Support the relationship/family context.",
        reasons: ["Relationship or family context detected."]
      });
    }

    if (signals.petOrAnimal) {
      add({
        type: "animal_health_or_pet_context",
        intent: "pet_health_support",
        score: 76,
        responseHint: "Treat as pet/animal context when animal evidence is strong.",
        reasons: ["Animal or pet context detected."]
      });
    }

    if (signals.financial) {
      add({
        type: "financial_or_resource_context",
        intent: "financial_resource_guidance",
        score: 76,
        responseHint: "Support financial/resource reasoning.",
        reasons: ["Financial or resource context detected."]
      });
    }

    if (signals.memoryOrIdentity) {
  add({
    type: signals.asksAriPreference
      ? "ari_identity_preference_question"
      : "memory_or_identity_request",
    intent: signals.asksAriPreference
      ? "answer_ari_identity_preference"
      : "memory_or_identity",
    score: signals.asksAriPreference ? 78 : 82,
        responseHint: "Handle memory or identity request directly.",
        reasons: ["Memory, preference, or identity language detected."]
      });
    }

    if (
      signals.hasQuestion &&
      !signals.emotionalSupportRequest &&
      !signals.explicitCodeRequest &&
      !signals.writingTask &&
      !signals.calculationTask
    ) {
      add({
        type: "question_or_follow_up",
        intent: "answer_question",
        score: 65,
        responseHint: "Answer the question directly.",
        reasons: ["User is asking a question."]
      });
    }

    if (signals.emotionalWords && !signals.emotionalSupportRequest) {
      add({
        type: "emotional_signal_present",
        intent: "brief_attunement_then_answer",
        score: 64,
        responseHint:
          "Acknowledge the emotion briefly, then continue with the main task.",
        reasons: ["Emotion language is present as context."]
      });
    }

    if (!candidates.length) {
      add({
        type: "general_conversation",
        intent: "respond_normally",
        score: 50,
        responseHint: "Respond normally.",
        reasons: ["No strong broad conversation tag detected."]
      });
    }

    return candidates;
  },

  rank(candidates = [], signals = {}) {
    return candidates
      .map(candidate => {
        let score = Number(candidate.score || 0);

        if (signals.emotionalSupportRequest) {
          if (candidate.type === "emotional_support_request") score += 20;

          if (
            [
              "decision_or_action_question",
              "question_or_follow_up",
              "explanation_or_information_question"
            ].includes(candidate.type)
          ) {
            score -= 65;
          }

          if (
            [
              "medical_or_body_concern",
              "relationship_or_family_context"
            ].includes(candidate.type)
          ) {
            score -= 10;
          }
        }

        if (signals.distressActionUncertainty && candidate.type === "decision_or_action_question") {
          score -= 75;
        }

        if (signals.metaDeveloperQuestion) {
          if (
            [
              "meta_developer_routing_question",
              "question_or_follow_up"
            ].includes(candidate.type)
          ) {
            score += 12;
          }

          if (
            [
              "builder_task",
              "medical_or_body_concern",
              "animal_health_or_pet_context"
            ].includes(candidate.type)
          ) {
            score -= 60;
          }
        }

        if (signals.explicitCodeRequest && candidate.type === "builder_task") {
          score += 10;
        }

        if (signals.referenceDependency && candidate.type === "question_or_follow_up") {
          score += 8;
        }

        score = Math.max(0, Math.min(100, score));

        return {
          ...candidate,
          score,
          confidence: this.confidenceLabel(Math.min(score, 72))
        };
      })
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score);
  },

  hasQuestion(text, observations = [], thread = {}) {
    return (
      text.includes("?") ||
      this.hasType(observations, "question_mark_count") ||
      this.hasType(observations, "question_phrase") ||
      Boolean(thread.impliedQuestion?.type) ||
      /^(what|why|how|when|where|who|is|are|do|does|can|should|would|could)\b/i.test(text)
    );
  },

  add(candidates, item) {
    if (!item?.type) return;

    const existing = candidates.find(candidate => candidate.type === item.type);

    if (existing) {
      existing.score = Math.min(100, existing.score + Math.round(Number(item.score || 0) * 0.25));
      existing.reasons = [
        ...new Set([
          ...(existing.reasons || []),
          ...(item.reasons || [])
        ])
      ];

      if (!existing.responseHint && item.responseHint) {
        existing.responseHint = item.responseHint;
      }

      return;
    }

    candidates.push({
      ...item,
      confidence: this.confidenceLabel(Math.min(item.score || 0, 72))
    });
  },

  confidenceLabel(score = 0) {
    if (score >= 68) return "medium";
    if (score >= 45) return "low";
    return "very_low";
  },

  hasType(observations = [], type = "") {
    return observations.some(observation => observation.type === type);
  },

  hasAny(text = "", terms = []) {
    const normalizedText = this.normalize(text);

    return terms.some(term => {
      const normalizedTerm = this.normalize(term);
      if (!normalizedTerm) return false;

      const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (!normalizedTerm.includes(" ")) {
        return new RegExp(`\\b${escaped}\\b`, "i").test(normalizedText);
      }

      return normalizedText.includes(normalizedTerm);
    });
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI UNIVERSAL CONVERSATION CLASSIFIER LOADED:",
  window.AriUniversalConversationClassifier?.version
);