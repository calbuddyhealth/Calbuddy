// ari/meaning/ari-semantic-frame-builder.js
// Ari Semantic Frame Builder
// Purpose: Convert current user language into structured conceptual meaning.
// V1.2.0 — Current Turn First / Context Second / Advisory Only

window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "1.2.0",

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
    const currentTurnFrame = this.buildCurrentTurnFrame(normalized, summary);
    const continuityFrame = this.buildContinuityFrame(normalized, inheritedContext);
    const responseCharacteristics = this.buildResponseCharacteristics(
      normalized,
      currentTurnFrame,
      continuityFrame
    );
    const emotionalOverlay = this.buildEmotionalOverlay(normalized);
    const ambiguity = this.buildAmbiguitySignal(
      normalized,
      currentTurnFrame,
      continuityFrame
    );

    const allFrames = this.rankFrames([
      currentTurnFrame,
      ...(continuityFrame.isContinuation ? [continuityFrame] : [])
    ]);

    const primaryFrame = currentTurnFrame;

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
      secondaryFrames: allFrames.filter(f => f.frameType !== primaryFrame.frameType).slice(0, 5),
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

  buildCurrentTurnFrame(n, summary = {}) {
    const frames = [];

    this.detectMedicalConcern(frames, n);
    this.detectCollaborativeBuild(frames, n);
    this.detectDebugging(frames, n);
    this.detectDecisionSupport(frames, n);
    this.detectInstructionOrCommand(frames, n);
    this.detectPlanning(frames, n);
    this.detectComparison(frames, n);
    this.detectStatusCheck(frames, n);
    this.detectReflection(frames, n);
    this.detectRelationshipMeaning(frames, n);
    this.detectIdentityRole(frames, n);
    this.detectInformationSeeking(frames, n);
    this.detectImperfectLanguage(frames, n);

    const ranked = this.rankFrames(frames);
    return ranked[0] || this.defaultFrame(n);
  },

  buildContinuityFrame(n, inherited = {}) {
    const text = n.text;

    const continuationHits = this.findWordHits(text, [
      "next",
      "again",
      "continue",
      "same",
      "previous"
    ]);

    const phraseHits = this.findPhraseHits(text, [
      "do that",
      "send code",
      "send me the code",
      "make the update",
      "update it",
      "like before",
      "where were we",
      "what else",
      "other advice",
      "what about him",
      "what about it"
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

    const hasThread = inherited.threadAvailable;
    const isContinuation =
      (hasThread && n.isShortTurn) ||
      (hasThread && pronounHits.length > 0) ||
      (hasThread && continuationHits.length > 0) ||
      (hasThread && phraseHits.length > 0);

    const evidence = [
      ...continuationHits,
      ...phraseHits
    ];

    if (hasThread && pronounHits.length) {
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
        "builder",
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
      confidence: isContinuation
        ? this.cap(65 + evidence.length * 6)
        : 25,
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

    const buildLike = [
      "collaborative_software_build",
      "debugging_or_root_cause",
      "instruction_or_command"
    ].includes(primaryFrame.frameType);

    return {
      expectsDirectAnswer: directQuestion,
      expectsExplanation: this.findPhraseHits(text, [
        "explain",
        "tell me",
        "how does",
        "why does",
        "what does it mean"
      ]).length > 0,
      expectsCollaboration: buildLike,
      expectsReflection: primaryFrame.frameType === "self_reflection",
      expectsCodeOrArtifact:
        this.findWordHits(text, ["code", "file", "script", "module"]).length > 0,
      expectsFollowUpContext: continuityFrame.isContinuation,
      likelyWantsMinimalAnswer: n.isShortTurn || continuityFrame.isContinuation,
      confidence: this.cap(
        55 +
        (directQuestion ? 12 : 0) +
        (buildLike ? 18 : 0) +
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

    const present =
      (n.isVeryShortTurn && !continuityFrame.isContinuation) ||
      (pronounHits.length > 0 && !continuityFrame.referencesPriorContext);

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

    const typoFixes = {
      "semntic": "semantic",
      "sematic": "semantic",
      "rebirht": "rebirth",
      "rebith": "rebirth",
      "lan splitter": "lane splitter",
      "lane splitr": "lane splitter",
      "composor": "composer",
      "oberserver": "observer",
      "pritority": "priority",
      "priorirty": "priority",
      "situational map": "situation map",
      "langauge": "language"
    };

    const detectedSlang = [];
    const detectedTypos = [];

    Object.keys(replacements)
      .sort((a, b) => b.length - a.length)
      .forEach(key => {
        const pattern = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, "gi");
        if (pattern.test(normalized)) {
          detectedSlang.push({ from: key, to: replacements[key] });
          normalized = normalized.replace(pattern, replacements[key]);
        }
      });

    Object.keys(typoFixes).forEach(key => {
      const pattern = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, "gi");
      if (pattern.test(normalized)) {
        detectedTypos.push({ from: key, to: typoFixes[key] });
        normalized = normalized.replace(pattern, typoFixes[key]);
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
      detectedTypos,
      hasQuestionMark: original.includes("?"),
      hasExclamation: original.includes("!"),
      hasProfanity: /\b(fuck|fucking|shit|wtf|damn|bullshit)\b/i.test(original),
      isShortTurn: wordCount <= 5,
      isVeryShortTurn: wordCount <= 2
    };
  },

  detectInformationSeeking(frames, n) {
    const startsQuestion =
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(n.text);

    if (!n.hasQuestionMark && !startsQuestion) return;

    this.pushFrame(frames, {
      frameType: "information_seeking",
      domain: "general_understanding",
      intent: "obtain_answer_or_clarification",
      conversationStyle: "question",
      confidence: n.hasQuestionMark ? 80 : 70,
      evidence: n.hasQuestionMark ? ["question mark"] : ["question opening"]
    });
  },

  detectCollaborativeBuild(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "ari",
      "rebirth",
      "semantic frame builder",
      "frame builder",
      "lane splitter",
      "observer",
      "composer",
      "context assembler",
      "thread understanding",
      "situation map",
      "triage",
      "priority governor",
      "engine",
      "pipeline",
      "code",
      "module",
      "build",
      "update",
      "implement",
      "rewrite"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "collaborative_software_build",
      domain: "ari_architecture",
      intent: "create_or_modify_system_component",
      conversationStyle: "co_creation",
      confidence: this.scoreFromHits(74, hits, 4),
      evidence: hits
    });
  },

  detectDebugging(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "broken",
      "not working",
      "does not work",
      "doesn't work",
      "cannot",
      "issue",
      "problem",
      "bug",
      "fix",
      "causing",
      "why does",
      "wrong",
      "failing",
      "regression",
      "bottleneck"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "debugging_or_root_cause",
      domain: "system_behavior",
      intent: "diagnose_failure_or_mismatch",
      conversationStyle: "diagnostic",
      confidence: this.scoreFromHits(76, hits, 5),
      evidence: hits
    });
  },

  detectDecisionSupport(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "should i",
      "which one",
      "what should",
      "best",
      "better",
      "choose",
      "decide",
      "option",
      "recommend",
      "worth it",
      "critique",
      "score"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "decision_support",
      domain: "choice_or_priority",
      intent: "evaluate_options",
      conversationStyle: "recommendation_request",
      confidence: this.scoreFromHits(72, hits, 5),
      evidence: hits
    });
  },

  detectMedicalConcern(frames, n) {
    const hits = this.findWordHits(n.text, [
      "pain",
      "bleeding",
      "pregnant",
      "swallowing",
      "coughing",
      "diarrhea",
      "vitals",
      "labs",
      "symptom",
      "doctor",
      "fever"
    ]);

    const urgentHits = this.findPhraseHits(n.text, [
      "chest pain",
      "shortness of breath",
      "emergency",
      "can't swallow",
      "cannot swallow"
    ]);

    if (!hits.length && !urgentHits.length) return;

    this.pushFrame(frames, {
      frameType: "medical_or_body_concern",
      domain: "health",
      intent: "understand_or_manage_body_symptom",
      conversationStyle: "safety_sensitive_information",
      urgency: urgentHits.length ? "possible_urgent" : "routine_or_unknown",
      confidence: urgentHits.length ? 94 : this.scoreFromHits(84, hits, 3),
      evidence: [...hits, ...urgentHits]
    });
  },

  detectRelationshipMeaning(frames, n) {
    const hits = this.findWordHits(n.text, [
      "father",
      "dad",
      "mom",
      "mother",
      "fiance",
      "fiancé",
      "wife",
      "husband",
      "baby",
      "daughter",
      "son",
      "family",
      "relationship",
      "marriage"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "relationship_or_attachment",
      domain: "relationships",
      intent: "understand_or_protect_connection",
      conversationStyle: "relational_context",
      confidence: this.scoreFromHits(70, hits, 4),
      evidence: hits
    });
  },

  detectIdentityRole(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "who am i",
      "identity",
      "nurse",
      "marine",
      "officer",
      "father",
      "builder",
      "provider",
      "student",
      "career",
      "separating"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "identity_or_role",
      domain: "self_concept",
      intent: "understand_role_or_direction",
      conversationStyle: "identity_reflection",
      confidence: this.scoreFromHits(70, hits, 4),
      evidence: hits
    });
  },

  detectReflection(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "why do i",
      "why am i",
      "i feel",
      "i keep",
      "what kind of person",
      "what kind of father",
      "what does this say about me"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "self_reflection",
      domain: "inner_life",
      intent: "make_meaning_from_experience",
      conversationStyle: "reflective",
      confidence: this.scoreFromHits(74, hits, 5),
      evidence: hits
    });
  },

  detectComparison(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "compare",
      "versus",
      "vs",
      "difference between",
      "better than",
      "same as"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "comparison",
      domain: "analysis",
      intent: "understand_differences_or_ranking",
      conversationStyle: "compare_contrast",
      confidence: this.scoreFromHits(74, hits, 5),
      evidence: hits
    });
  },

  detectPlanning(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "roadmap",
      "plan",
      "next step",
      "sequence",
      "order",
      "start",
      "priority",
      "timeline"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "planning_or_roadmap",
      domain: "execution",
      intent: "organize_next_actions",
      conversationStyle: "planning",
      confidence: this.scoreFromHits(72, hits, 4),
      evidence: hits
    });
  },

  detectStatusCheck(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "where are we",
      "status",
      "what's next",
      "whats next",
      "what now",
      "where is this",
      "how far"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "status_check",
      domain: "progress_tracking",
      intent: "understand_current_state",
      conversationStyle: "orientation",
      confidence: this.scoreFromHits(76, hits, 5),
      evidence: hits
    });
  },

  detectInstructionOrCommand(frames, n) {
    const hits = this.findPhraseHits(n.text, [
      "send code",
      "send me",
      "make",
      "build",
      "update",
      "replace",
      "fix",
      "show me",
      "give me"
    ]);

    if (!hits.length) return;

    this.pushFrame(frames, {
      frameType: "instruction_or_command",
      domain: "task_execution",
      intent: "request_action_or_output",
      conversationStyle: "directive",
      confidence: this.scoreFromHits(73, hits, 4),
      evidence: hits
    });
  },

  detectImperfectLanguage(frames, n) {
    if (!n.detectedSlang.length && !n.detectedTypos.length) return;

    this.pushFrame(frames, {
      frameType: "imperfect_language_resolved",
      domain: "language_understanding",
      intent: "preserve_meaning_despite_slang_or_typos",
      conversationStyle: "normalization",
      confidence: 68,
      evidence: [
        ...n.detectedSlang.map(x => `${x.from}->${x.to}`),
        ...n.detectedTypos.map(x => `${x.from}->${x.to}`)
      ]
    });
  },

  buildEmotionalOverlay(n) {
    const frustrationHits = this.findPhraseHits(n.text, [
      "what the fuck",
      "annoying",
      "frustrated",
      "confused",
      "give up",
      "this is bad",
      "come on",
      "are you serious"
    ]);

    let tone = "neutral";
    let intensity = "low";
    const evidence = [];

    if (frustrationHits.length || n.hasProfanity) {
      tone = "frustrated";
      intensity = n.hasProfanity ? "high" : "medium";
      evidence.push(...frustrationHits);
      if (n.hasProfanity) evidence.push("profanity emphasis");
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
        .filter(f => f.frameType !== primaryFrame.frameType)
        .slice(0, 4)
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

  scoreFromHits(base, hits, perHit = 4) {
    return this.cap(base + Math.min(hits.length * perHit, 20));
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