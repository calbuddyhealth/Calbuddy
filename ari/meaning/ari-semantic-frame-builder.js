// ari/meaning/ari-semantic-frame-builder.js
// Ari Semantic Frame Builder
// Purpose: Convert current user language into structured conceptual meaning.
// V2.0.0 — Universal Meaning Model / Current Turn First / Context Second

window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "2.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const originalText = this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const normalized = this.normalizeText(originalText);
    const inheritedContext = this.readInheritedContext(summary);

    const currentTurnFrame = this.buildCurrentTurnFrameV2(normalized, summary);
    const continuityFrame = this.buildContinuityFrame(normalized, inheritedContext, currentTurnFrame);
    const functionFrame = this.buildFunctionFrame(summary.conversationFunction);

    const allFrames = this.rankFrames([
      currentTurnFrame,
      functionFrame,
      ...(continuityFrame.isContinuation ? [continuityFrame] : [])
    ]);

    const primaryFrame = this.selectPrimaryFrame(allFrames, normalized, continuityFrame);
    const responseCharacteristics = this.buildResponseCharacteristics(
      normalized,
      primaryFrame,
      continuityFrame
    );

    const emotionalOverlay = this.buildEmotionalOverlay(normalized);
    const ambiguity = this.buildAmbiguitySignal(
      normalized,
      primaryFrame,
      continuityFrame
    );

    return {
      semanticFrameBuilderRan: true,
      semanticFrameBuilderVersion: this.version,
      semanticFrameSource: "ari-semantic-frame-builder",

      advisoryOnly: true,
      routingAuthority: false,
      composerAuthority: false,
      finalAnswerAuthority: false,

      originalText,
      normalizedText: normalized.text,
      normalization: normalized,

      currentTurnFrame,
      continuityFrame,
      inheritedContext,

      primaryFrame,
      secondaryFrames: allFrames
        .filter(f => f && f.frameType !== primaryFrame.frameType)
        .slice(0, 6),
      allFrames,

      continuity: {
        isContinuation: continuityFrame.isContinuation,
        referencesPriorContext: continuityFrame.referencesPriorContext,
        referencesPriorArtifact: continuityFrame.referencesPriorArtifact,
        referencesPriorQuestion: continuityFrame.referencesPriorQuestion,
        confidence: continuityFrame.confidence,
        evidence: continuityFrame.evidence
      },

      responseCharacteristics,
      emotionalOverlay,
      ambiguity,

      handoff: this.buildHandoff({
        normalized,
        primaryFrame,
        continuityFrame,
        inheritedContext,
        responseCharacteristics,
        ambiguity
      }),

      semanticSummary: this.buildSemanticSummary({
        primaryFrame,
        allFrames,
        normalized,
        continuityFrame,
        responseCharacteristics,
        emotionalOverlay,
        ambiguity
      })
    };
  },

  buildCurrentTurnFrameV2(n, summary = {}) {
    const features = this.extractUniversalFeatures(n, summary);
    const frames = this.generateFramesFromFeatures(features, n);

    const ranked = this.rankFrames(frames);
    return ranked[0] || this.defaultFrame(n);
  },

  extractUniversalFeatures(n, summary = {}) {
    const text = n.text;
    const words = text.split(/\s+/).filter(Boolean);

    const question =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const asksOpinion =
      /\b(what do you think|be honest|honestly|your take|your opinion|am i|should i|would you)\b/.test(text);

    const asksAction =
      /\b(fix|build|update|replace|send|show|give|make|write|create|implement|review|look at|where do i add)\b/.test(text);

    const asksExplanation =
      /\b(explain|why|how does|how do|what does|tell me about|help me understand)\b/.test(text);

    const asksDecision =
      /\b(should i|which|choose|worth it|better|best|recommend|what would you do|what do you think)\b/.test(text);

    const hasProblem =
      /\b(problem|issue|bug|broken|wrong|not working|doesn't work|failed|bottleneck|stuck|confused|hard|trouble)\b/.test(text);

    const bodyRisk =
      /\b(pain|bleeding|pregnant|pregnancy|fever|cough|swallow|symptom|doctor|labs|vitals|chest|breathing|diarrhea|faint|seizure)\b/.test(text);

    const resourcePressure =
      /\b(money|debt|rent|budget|pay|cost|expensive|tight|afford|few thousand|loan|job|time|deadline)\b/.test(text);

    const relationshipStake =
      /\b(wife|husband|fiance|fiancé|girlfriend|boyfriend|father|mother|dad|mom|baby|child|family|relationship|marriage)\b/.test(text);

    const buildContext =
      /\b(app|code|file|engine|module|pipeline|github|vercel|supabase|composer|observer|frame builder|triage|contract|ari|rebirth)\b/.test(text);

    const identityStake =
      /\b(father|mother|nurse|marine|officer|student|provider|career|identity|who am i|separating)\b/.test(text);

    const emotionExpression =
      n.hasExclamation ||
      n.hasProfanity ||
      /\b(happy|excited|proud|angry|mad|sad|ashamed|scared|overwhelmed|frustrated|relieved|celebrate|deserve)\b/.test(text);

    const currentTurnCompleteness =
      words.length >= 10 ? "complete" :
      words.length >= 4 ? "partial" :
      "fragment";

    return {
      text,
      wordCount: words.length,

      question,
      asksOpinion,
      asksAction,
      asksExplanation,
      asksDecision,

      hasProblem,
      bodyRisk,
      resourcePressure,
      relationshipStake,
      buildContext,
      identityStake,
      emotionExpression,

      currentTurnCompleteness,

      conversationFunction: summary.conversationFunction || {},
      observations: summary.observations || summary.observationLedger || []
    };
  },

  generateFramesFromFeatures(f, n) {
    const frames = [];

    if (f.asksDecision) {
      this.pushFrame(frames, {
        frameType: "decision_support",
        domain: "choice_or_priority",
        intent: "evaluate_options",
        conversationStyle: "recommendation_request",
        confidence: this.cap(76 + (f.resourcePressure ? 8 : 0) + (f.relationshipStake ? 8 : 0)),
        evidence: ["choice pressure", "judgment request"]
      });
    }

    if (f.asksAction && f.buildContext) {
      this.pushFrame(frames, {
        frameType: "collaborative_software_build",
        domain: "ari_architecture",
        intent: "create_or_modify_system_component",
        conversationStyle: "co_creation",
        confidence: this.cap(82 + (f.hasProblem ? 8 : 0)),
        evidence: ["action request", "system/build context"]
      });
    }

    if (f.hasProblem && f.buildContext) {
      this.pushFrame(frames, {
        frameType: "debugging_or_root_cause",
        domain: "system_behavior",
        intent: "diagnose_failure_or_mismatch",
        conversationStyle: "diagnostic",
        confidence: 84,
        evidence: ["problem signal", "system/build context"]
      });
    }

    if (f.bodyRisk) {
      this.pushFrame(frames, {
        frameType: "medical_or_body_context",
        domain: "health",
        intent: "include_body_context_without_hijacking",
        conversationStyle: "safety_sensitive_context",
        confidence: f.asksDecision || f.resourcePressure ? 64 : 82,
        evidence: ["body/medical context"]
      });
    }

    if (f.resourcePressure) {
      this.pushFrame(frames, {
        frameType: "resource_pressure",
        domain: "money_time_energy",
        intent: "protect_limited_resources",
        conversationStyle: "practical_constraint",
        confidence: 78,
        evidence: ["resource constraint"]
      });
    }

    if (f.relationshipStake) {
      this.pushFrame(frames, {
        frameType: "relationship_or_family_context",
        domain: "relationships",
        intent: "protect_connection_or_dependents",
        conversationStyle: "relational_context",
        confidence: 76,
        evidence: ["relationship stake"]
      });
    }

    if (f.identityStake) {
      this.pushFrame(frames, {
        frameType: "identity_or_role",
        domain: "self_concept",
        intent: "understand_role_or_direction",
        conversationStyle: "identity_context",
        confidence: 72,
        evidence: ["identity or role stake"]
      });
    }

    if (f.emotionExpression) {
      this.pushFrame(frames, {
        frameType: "emotional_expression",
        domain: "emotion",
        intent: "respond_to_expressed_state",
        conversationStyle: "expressive",
        confidence: 70,
        evidence: ["emotional expression"]
      });
    }

    if (f.asksExplanation && !f.asksAction) {
      this.pushFrame(frames, {
        frameType: "information_seeking",
        domain: "general_understanding",
        intent: "obtain_answer_or_clarification",
        conversationStyle: "question",
        confidence: 80,
        evidence: ["explanation request"]
      });
    }

    if (f.question && !frames.length) {
      this.pushFrame(frames, {
        frameType: "information_seeking",
        domain: "general_understanding",
        intent: "obtain_answer_or_clarification",
        conversationStyle: "question",
        confidence: 76,
        evidence: ["question"]
      });
    }

    if (!frames.length && f.currentTurnCompleteness === "complete") {
      this.pushFrame(frames, {
        frameType: "general_current_turn",
        domain: "general",
        intent: "respond_to_current_statement",
        conversationStyle: "normal",
        confidence: 62,
        evidence: ["complete current turn"]
      });
    }

    return frames;
  },

  selectPrimaryFrame(frames = [], n = {}, continuityFrame = {}) {
    const cleanFrames = frames.filter(Boolean);
    if (!cleanFrames.length) return this.defaultFrame(n);

    const top = cleanFrames[0];

    const medicalOnlyHijack =
      top.frameType === "medical_or_body_context" &&
      cleanFrames.some(f =>
        ["decision_support", "collaborative_software_build", "debugging_or_root_cause"].includes(f.frameType)
      );

    if (medicalOnlyHijack) {
      return cleanFrames.find(f =>
        ["decision_support", "collaborative_software_build", "debugging_or_root_cause"].includes(f.frameType)
      ) || top;
    }

    return top;
  },

  buildFunctionFrame(conversationFunction = {}) {
    const primaryFunction =
      conversationFunction.primaryFunction ||
      conversationFunction.function ||
      null;

    if (!primaryFunction || primaryFunction === "unknown") return null;

    const map = {
      emotional_disclosure: {
        frameType: "emotional_disclosure",
        domain: "emotion",
        intent: "receive_and_respond_to_emotion",
        conversationStyle: "emotional_presence",
        confidence: 88
      },

      direct_question: {
        frameType: "information_seeking",
        domain: "general_understanding",
        intent: "obtain_answer_or_clarification",
        conversationStyle: "question",
        confidence: 78
      },

      correction_or_clarification: {
        frameType: "correction_or_clarification",
        domain: "conversation_flow",
        intent: "correct_prior_interpretation",
        conversationStyle: "clarification",
        confidence: 86
      },

      build_or_debug: {
        frameType: "collaborative_software_build",
        domain: "ari_architecture",
        intent: "create_or_modify_system_component",
        conversationStyle: "co_creation",
        confidence: 84
      }
    };

    const selected = map[primaryFunction];
    if (!selected) return null;

    return {
      ...selected,
      evidence: [`conversation_function:${primaryFunction}`],
      advisoryOnly: true,
      source: "conversation_function_engine"
    };
  },

  buildContinuityFrame(n, inherited = {}, currentTurnFrame = {}) {
    const text = n.text;

    const hasThread = inherited.threadAvailable;
    const completeCurrentTurn = n.wordCount >= 10;

    const continuationHits = this.findWordHits(text, [
      "next",
      "again",
      "continue",
      "same",
      "previous"
    ]);

    const phraseHits = this.findPhraseHits(text, [
      "do that",
      "send me the code",
      "make the update",
      "update it",
      "like before",
      "where were we",
      "what else",
      "what about it",
      "what about him",
      "what about her"
    ]);

    const pronounHits = this.findWordHits(text, [
      "it",
      "this",
      "that",
      "they",
      "them",
      "him",
      "her",
      "those",
      "these"
    ]);

    const currentTurnHasOwnMeaning =
      completeCurrentTurn &&
      currentTurnFrame &&
      currentTurnFrame.confidence >= 70;

    const isContinuation =
      hasThread &&
      !currentTurnHasOwnMeaning &&
      (
        n.isShortTurn ||
        continuationHits.length > 0 ||
        phraseHits.length > 0 ||
        pronounHits.length > 0
      );

    const evidence = [...continuationHits, ...phraseHits];

    if (hasThread && pronounHits.length && !currentTurnHasOwnMeaning) {
      evidence.push("reference language with active thread");
    }

    if (hasThread && isContinuation) {
      evidence.push("active thread context available");
    }

    return {
      frameType: "continuation",
      domain: "conversation_flow",
      intent: "continue_prior_context",
      conversationStyle: "follow_up",
      isContinuation,
      referencesPriorContext: isContinuation,
      referencesPriorArtifact: this.findWordHits(text, [
        "code",
        "file",
        "engine",
        "module",
        "pipeline",
        "composer",
        "observer"
      ]).length > 0,
      referencesPriorQuestion: this.findPhraseHits(text, [
        "what i asked",
        "my question",
        "what we said",
        "what you said"
      ]).length > 0,
      confidence: isContinuation ? this.cap(65 + evidence.length * 6) : 25,
      evidence,
      advisoryOnly: true
    };
  },

  readInheritedContext(summary = {}) {
    const threadState = summary.threadState || {};
    const recentMessages = summary.recentMessages || threadState.lastMessages || [];

    return {
      threadAvailable: Boolean(
        summary.threadStateLoaded ||
        recentMessages.length ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.continuitySummary
      ),

      currentTopic: this.stringifyTopic(
        summary.activeTopic ||
        threadState.currentTopic ||
        null
      ),

      activeSubject: this.stringifyTopic(
        summary.resolvedPrimarySubject ||
        threadState.activeSubject ||
        null
      ),

      previousAnswerSummary:
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse ||
        summary.previousAnswerSummary ||
        null,

      recentMessages: Array.isArray(recentMessages)
        ? recentMessages.slice(-6)
        : [],

      authority: "context_only_not_current_meaning"
    };
  },

  buildResponseCharacteristics(n, primaryFrame, continuityFrame) {
    const text = n.text;

    const directQuestion =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text);

    const collaborationFrames = [
      "collaborative_software_build",
      "debugging_or_root_cause"
    ];

    return {
      expectsDirectAnswer: directQuestion,
      expectsExplanation:
        /\b(explain|tell me|how does|why does|what does it mean)\b/.test(text),
      expectsCollaboration: collaborationFrames.includes(primaryFrame.frameType),
      expectsReflection: primaryFrame.frameType === "emotional_disclosure",
      expectsCodeOrArtifact:
        this.findWordHits(text, ["code", "file", "script", "module"]).length > 0,
      expectsFollowUpContext: continuityFrame.isContinuation,
      likelyWantsMinimalAnswer: n.isShortTurn || /\bbriefly|quick|short answer\b/.test(text),
      confidence: this.cap(
        55 +
        (directQuestion ? 14 : 0) +
        (collaborationFrames.includes(primaryFrame.frameType) ? 18 : 0) +
        (continuityFrame.isContinuation ? 10 : 0)
      )
    };
  },

  buildAmbiguitySignal(n, primaryFrame, continuityFrame) {
    const pronounHits = this.findWordHits(n.text, [
      "it",
      "this",
      "that",
      "they",
      "them",
      "him",
      "her"
    ]);

    const currentTurnComplete = n.wordCount >= 10 && primaryFrame.confidence >= 65;

    const present =
      !currentTurnComplete &&
      (
        (n.isVeryShortTurn && !continuityFrame.isContinuation) ||
        (pronounHits.length > 0 && !continuityFrame.referencesPriorContext)
      );

    return {
      present,
      reason: present
        ? "Current turn lacks enough standalone meaning."
        : "No major ambiguity detected.",
      confidence: present ? 72 : 35,
      evidence: pronounHits
    };
  },

  buildHandoff({
    normalized,
    primaryFrame,
    continuityFrame,
    inheritedContext,
    responseCharacteristics,
    ambiguity
  }) {
    return {
      currentQuestion: normalized.original,
      currentMeaning: primaryFrame.frameType,
      domain: primaryFrame.domain,
      intent: primaryFrame.intent,

      requiresPriorContext: continuityFrame.isContinuation,
      inheritedSubject: continuityFrame.isContinuation
        ? inheritedContext.activeSubject || inheritedContext.currentTopic
        : null,

      priorContextAvailable: inheritedContext.threadAvailable,
      previousAnswerSummary: continuityFrame.isContinuation
        ? inheritedContext.previousAnswerSummary
        : null,

      responseMode: responseCharacteristics.expectsCodeOrArtifact
        ? "code_or_artifact"
        : responseCharacteristics.expectsCollaboration
          ? "collaborative_action"
          : responseCharacteristics.expectsDirectAnswer
            ? "direct_answer"
            : "normal_response",

      ambiguityPresent: ambiguity.present,

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,
        role: "semantic_description_handoff_only"
      }
    };
  },

  normalizeText(text) {
    const original = this.clean(text);
    let normalized = original.toLowerCase();

    const replacements = {
      "wtf": "what the fuck",
      "idk": "i do not know",
      "rn": "right now",
      "u": "you",
      "ur": "your",
      "pls": "please",
      "plz": "please",
      "gonna": "going to",
      "wanna": "want to",
      "kinda": "kind of",
      "bc": "because",
      "cuz": "because"
    };

    const detectedSlang = [];

    Object.keys(replacements)
      .sort((a, b) => b.length - a.length)
      .forEach(key => {
        const pattern = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, "gi");
        if (pattern.test(normalized)) {
          detectedSlang.push({ from: key, to: replacements[key] });
          normalized = normalized.replace(pattern, replacements[key]);
        }
      });

    normalized = normalized
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    return {
      original,
      text: normalized,
      wordCount,
      detectedSlang,
      detectedTypos: [],
      hasQuestionMark: original.includes("?"),
      hasExclamation: original.includes("!"),
      hasProfanity: /\b(fuck|fucking|fucken|shit|wtf|damn|bullshit)\b/i.test(original),
      isShortTurn: wordCount <= 5,
      isVeryShortTurn: wordCount <= 2
    };
  },

  buildEmotionalOverlay(n) {
    let tone = "neutral";
    let intensity = "low";
    const evidence = [];

    if (/\b(happy|excited|proud|relieved|celebrate|deserve)\b/.test(n.text)) {
      tone = "positive_activation";
      intensity = n.hasExclamation || n.hasProfanity ? "high" : "medium";
      evidence.push("positive expressive language");
    }

    if (/\b(frustrated|angry|mad|annoying|confused|give up|come on|are you serious)\b/.test(n.text)) {
      tone = "frustrated";
      intensity = n.hasProfanity ? "high" : "medium";
      evidence.push("frustration language");
    }

    if (n.hasProfanity && tone === "neutral") {
      tone = "intense_expression";
      intensity = "high";
      evidence.push("profanity emphasis");
    }

    return {
      tone,
      intensity,
      semanticMeaningSeparated: true,
      evidence
    };
  },

  buildSemanticSummary({
    primaryFrame,
    allFrames,
    normalized,
    continuityFrame,
    responseCharacteristics,
    emotionalOverlay,
    ambiguity
  }) {
    return {
      primaryMeaning: primaryFrame.frameType,
      domain: primaryFrame.domain,
      intent: primaryFrame.intent,
      conversationStyle: primaryFrame.conversationStyle,
      confidence:
        primaryFrame.confidence >= 85 ? "high" :
        primaryFrame.confidence >= 65 ? "medium" :
        "low",

      continuity: {
        isContinuation: continuityFrame.isContinuation,
        referencesPriorContext: continuityFrame.referencesPriorContext,
        referencesPriorArtifact: continuityFrame.referencesPriorArtifact,
        confidence: continuityFrame.confidence
      },

      responseCharacteristics,
      emotionalOverlay,
      ambiguity,

      competingMeanings: allFrames
        .filter(f => f && f.frameType !== primaryFrame.frameType)
        .slice(0, 5)
        .map(f => f.frameType),

      languageNotes: {
        slangResolved: normalized.detectedSlang.length > 0,
        typosResolved: normalized.detectedTypos.length > 0,
        profanityAsSignal: normalized.hasProfanity,
        shortTurn: normalized.isShortTurn
      }
    };
  },

  pushFrame(frames, frame) {
    frames.push({
      ...frame,
      confidence: this.cap(frame.confidence),
      advisoryOnly: true
    });
  },

  rankFrames(frames = []) {
    const merged = {};

    frames.filter(Boolean).forEach(frame => {
      const key = frame.frameType;

      if (!merged[key]) {
        merged[key] = { ...frame, evidence: [...(frame.evidence || [])] };
        return;
      }

      merged[key].confidence = this.cap(
        Math.max(merged[key].confidence, frame.confidence) + 4
      );

      merged[key].evidence = Array.from(
        new Set([...(merged[key].evidence || []), ...(frame.evidence || [])])
      );
    });

    return Object.values(merged).sort((a, b) => b.confidence - a.confidence);
  },

  defaultFrame(n) {
    return {
      frameType: "general_conversation",
      domain: "general",
      intent: "ordinary_conversation",
      conversationStyle: "open",
      confidence: n.text ? 40 : 10,
      evidence: [],
      advisoryOnly: true
    };
  },

  findPhraseHits(text, patterns = []) {
    const lower = String(text || "").toLowerCase();
    return patterns.filter(pattern => lower.includes(pattern.toLowerCase()));
  },

  findWordHits(text, words = []) {
    const lower = String(text || "").toLowerCase();
    return words.filter(word => {
      const pattern = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, "i");
      return pattern.test(lower);
    });
  },

  stringifyTopic(topic) {
    if (!topic) return null;
    if (typeof topic === "string") return topic;

    return (
      topic.surface ||
      topic.label ||
      topic.value ||
      topic.claim ||
      topic.evidence ||
      null
    );
  },

  clean(value) {
    return String(value || "").trim();
  },

  cap(score) {
    return Math.max(0, Math.min(100, Number(score) || 0));
  },

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};

console.log(
  "ARI SEMANTIC FRAME BUILDER LOADED:",
  window.AriSemanticFrameBuilder?.version
);