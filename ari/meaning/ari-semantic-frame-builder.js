// ari/meaning/ari-semantic-frame-builder.js
// Ari Semantic Frame Builder
// Purpose: Convert user language + assembled context into structured conceptual meaning.
// V1.1.0 — Descriptive Semantics / Continuity Signals / Directness Signals / Advisory Only

window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "1.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const originalText = this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const observer = summary.observerEvidence || summary.observer || {};
    const thread = summary.threadUnderstanding || {};
    const continuityState = summary.continuityState || summary.conversationContinuity || {};
    const assembled = summary.assembledContext || summary.contextAssembler || summary || {};
    const memory = summary.memoryContext || {};
    const relationship = summary.relationshipProfile || {};

    const normalized = this.normalizeText(originalText);

    const continuity = this.buildContinuitySignal(normalized, thread, continuityState, assembled);
    const responseCharacteristics = this.buildResponseCharacteristics(normalized, continuity);
    const emotionalOverlay = this.buildEmotionalOverlay(normalized, observer);
    const ambiguity = this.buildAmbiguitySignal(normalized, continuity, thread);

    const frames = [];

    this.detectInformationSeeking(frames, normalized);
    this.detectCollaborativeBuild(frames, normalized, thread, assembled);
    this.detectDebugging(frames, normalized);
    this.detectDecisionSupport(frames, normalized);
    this.detectMedicalConcern(frames, normalized);
    this.detectRelationshipMeaning(frames, normalized, relationship);
    this.detectIdentityRole(frames, normalized, memory);
    this.detectReflection(frames, normalized);
    this.detectComparison(frames, normalized);
    this.detectPlanning(frames, normalized);
    this.detectStatusCheck(frames, normalized);
    this.detectInstructionOrCommand(frames, normalized);
    this.detectImperfectLanguage(frames, normalized);

    if (continuity.isContinuation) {
      this.pushFrame(frames, {
        frameType: "continuation",
        domain: "conversation_flow",
        intent: "continue_prior_context",
        conversationStyle: "follow_up",
        confidence: continuity.confidence,
        evidence: continuity.evidence
      });
    }

    const rankedFrames = this.rankFrames(frames);
    const primaryFrame = rankedFrames[0] || this.defaultFrame(normalized);

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

      primaryFrame,
      secondaryFrames: rankedFrames.slice(1, 5),
      allFrames: rankedFrames,

      continuity,
      responseCharacteristics,
      emotionalOverlay,
      ambiguity,

      semanticSummary: this.buildSemanticSummary({
        primaryFrame,
        frames: rankedFrames,
        normalized,
        continuity,
        responseCharacteristics,
        emotionalOverlay,
        ambiguity
      })
    };
  },

  normalizeText(text) {
    const original = this.clean(text);
    let normalized = original.toLowerCase();

    const replacements = {
      "wtf": "what the fuck",
      "idk": "i do not know",
      "imo": "in my opinion",
      "rn": "right now",
      "u": "you",
      "ur": "your",
      "pls": "please",
      "plz": "please",
      "thx": "thanks",
      "finna": "about to",
      "gonna": "going to",
      "wanna": "want to",
      "kinda": "kind of",
      "sorta": "sort of",
      "bruh": "bro",
      "no cap": "truth",
      "cap": "lie",
      "cooked": "broken or in trouble",
      "cooking": "making progress",
      "trippin": "acting wrong",
      "tripping": "acting wrong",
      "lowkey": "somewhat",
      "highkey": "strongly",
      "fr": "for real",
      "ngl": "not going to lie",
      "y": "why",
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
      "langauge": "language",
      "comunicate": "communicate"
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

  buildContinuitySignal(n, thread, continuityState, assembled) {
    const text = n.text;

    const continuationHits = this.findHits(text, [
      "next",
      "again",
      "continue",
      "do that",
      "send code",
      "send me the code",
      "make the update",
      "huge update",
      "big update",
      "same thing",
      "like before",
      "where were we",
      "we talked",
      "update it",
      "let's make this happen",
      "lets make this happen"
    ]);

    const priorReferenceHits = this.findHits(text, [
      "this",
      "that",
      "it",
      "they",
      "them",
      "the current",
      "the old",
      "the new",
      "the previous",
      "that one",
      "this one"
    ]);

    const activeThread =
      !!thread?.activeThread ||
      !!thread?.workingContext ||
      !!continuityState?.activeThread ||
      !!assembled?.thread;

    const isContinuation =
      continuationHits.length > 0 ||
      (activeThread && n.isShortTurn) ||
      (activeThread && priorReferenceHits.length > 0);

    const evidence = [];

    if (continuationHits.length) evidence.push(...continuationHits);
    if (priorReferenceHits.length && activeThread) evidence.push("prior-reference language with active thread");
    if (activeThread) evidence.push("active thread context present");

    return {
      isContinuation,
      referencesPriorContext: isContinuation && activeThread,
      referencesPriorArtifact: this.findHits(text, [
        "code",
        "file",
        "builder",
        "engine",
        "module",
        "lane splitter",
        "composer",
        "observer"
      ]).length > 0,
      referencesPriorQuestion: this.findHits(text, [
        "what i asked",
        "my question",
        "what we said",
        "what you said"
      ]).length > 0,
      confidence: isContinuation
        ? this.cap(68 + continuationHits.length * 8 + (activeThread ? 12 : 0))
        : 25,
      evidence
    };
  },

  buildResponseCharacteristics(n, continuity) {
    const text = n.text;

    const directQuestion =
      n.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/i.test(text);

    const buildHits = this.findHits(text, [
      "build",
      "make",
      "create",
      "implement",
      "send code",
      "update",
      "rewrite"
    ]);

    const explainHits = this.findHits(text, [
      "explain",
      "summary",
      "tell me",
      "how does",
      "why does",
      "what does it mean"
    ]);

    const reflectionHits = this.findHits(text, [
      "why do i",
      "what am i",
      "who am i",
      "i feel",
      "i keep",
      "what kind of"
    ]);

    return {
      expectsDirectAnswer: directQuestion && buildHits.length === 0,
      expectsExplanation: explainHits.length > 0,
      expectsCollaboration: buildHits.length > 0 || this.findHits(text, ["let's", "lets"]).length > 0,
      expectsReflection: reflectionHits.length > 0,
      expectsCodeOrArtifact: this.findHits(text, ["code", "file", "script", "module"]).length > 0,
      expectsFollowUpContext: continuity.isContinuation,
      likelyWantsMinimalAnswer: n.isShortTurn && continuity.isContinuation,
      confidence: this.cap(
        55 +
        (directQuestion ? 12 : 0) +
        (buildHits.length ? 14 : 0) +
        (explainHits.length ? 10 : 0) +
        (continuity.isContinuation ? 10 : 0)
      )
    };
  },

  buildEmotionalOverlay(n, observer) {
    const text = n.text;

    const frustrationHits = this.findHits(text, [
      "what the fuck",
      "annoying",
      "frustrated",
      "confused",
      "give up",
      "this is bad",
      "again",
      "come on",
      "are you serious"
    ]);

    const excitementHits = this.findHits(text, [
      "let's go",
      "lets go",
      "hell yes",
      "huge update",
      "big update",
      "make this happen"
    ]);

    const concernHits = this.findHits(text, [
      "worried",
      "scared",
      "concerned",
      "pain",
      "symptom",
      "emergency"
    ]);

    let tone = "neutral";
    let intensity = "low";
    const evidence = [];

    if (frustrationHits.length || n.hasProfanity) {
      tone = "frustrated";
      intensity = n.hasProfanity ? "high" : "medium";
      evidence.push(...frustrationHits, n.hasProfanity ? "profanity emphasis" : null);
    } else if (excitementHits.length || n.hasExclamation) {
      tone = "excited";
      intensity = n.hasExclamation ? "high" : "medium";
      evidence.push(...excitementHits, n.hasExclamation ? "exclamation emphasis" : null);
    } else if (concernHits.length) {
      tone = "concerned";
      intensity = "medium";
      evidence.push(...concernHits);
    }

    return {
      tone,
      intensity,
      semanticMeaningSeparated: true,
      evidence: evidence.filter(Boolean)
    };
  },

  buildAmbiguitySignal(n, continuity, thread) {
    const pronounHits = this.findHits(n.text, [
      "it",
      "this",
      "that",
      "they",
      "them",
      "that one",
      "this one"
    ]);

    const present =
      n.isVeryShortTurn && !continuity.isContinuation ||
      (pronounHits.length > 0 && !continuity.referencesPriorContext);

    return {
      present,
      reason: present
        ? "Short or pronoun-heavy message may require prior context."
        : "No major ambiguity detected.",
      confidence: present ? 70 : 35,
      evidence: pronounHits
    };
  },

  detectInformationSeeking(frames, n) {
    const text = n.text;

    const startsQuestion =
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/i.test(text);

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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
      "broken",
      "not working",
      "does not work",
      "doesn't work",
      "can't",
      "cannot",
      "issue",
      "problem",
      "bug",
      "fix",
      "causing",
      "why does",
      "wrong",
      "failing",
      "regression"
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
    const hits = this.findHits(n.text, [
      "should i",
      "which one",
      "what should",
      "best",
      "better",
      "choose",
      "decide",
      "option",
      "recommend",
      "worth it"
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
    const hits = this.findHits(n.text, [
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
      "er",
      "emergency",
      "fever",
      "chest pain",
      "shortness of breath"
    ]);

    if (!hits.length) return;

    const urgentHits = this.findHits(n.text, [
      "chest pain",
      "shortness of breath",
      "emergency",
      "er",
      "can't swallow",
      "cannot swallow"
    ]);

    this.pushFrame(frames, {
      frameType: "medical_or_body_concern",
      domain: "health",
      intent: "understand_or_manage_body_symptom",
      conversationStyle: "safety_sensitive_information",
      urgency: urgentHits.length ? "possible_urgent" : "routine_or_unknown",
      confidence: urgentHits.length ? 94 : this.scoreFromHits(84, hits, 3),
      evidence: hits
    });
  },

  detectRelationshipMeaning(frames, n) {
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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
    const hits = this.findHits(n.text, [
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

  pushFrame(frames, frame) {
    frames.push({
      ...frame,
      confidence: this.cap(frame.confidence),
      advisoryOnly: true
    });
  },

  rankFrames(frames) {
    const merged = {};

    frames.forEach(frame => {
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

  buildSemanticSummary({
    primaryFrame,
    frames,
    normalized,
    continuity,
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
        isContinuation: continuity.isContinuation,
        referencesPriorContext: continuity.referencesPriorContext,
        referencesPriorArtifact: continuity.referencesPriorArtifact,
        confidence: continuity.confidence
      },

      responseCharacteristics,
      emotionalOverlay,
      ambiguity,

      competingMeanings: frames.slice(1, 4).map(f => f.frameType),

      languageNotes: {
        slangResolved: normalized.detectedSlang.length > 0,
        typosResolved: normalized.detectedTypos.length > 0,
        profanityAsSignal: normalized.hasProfanity,
        shortTurn: normalized.isShortTurn
      }
    };
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

  findHits(text, patterns) {
    const lower = String(text || "").toLowerCase();
    return patterns.filter(pattern => lower.includes(pattern.toLowerCase()));
  },

  scoreFromHits(base, hits, perHit = 4) {
    return this.cap(base + Math.min(hits.length * perHit, 20));
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