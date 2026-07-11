// ari/observer-system/ari-question-understanding.js
// Ari Question Understanding
// Purpose: Observe what kind of response operation the user appears to request.
// Does not choose the final intent, lane, semantic frame, or answer.
// V2.0.0 — Multi-Signal Question Purpose Observer / Ledger Compatible

window.Ari = window.Ari || {};

window.Ari.questionUnderstanding = {
  version: "2.0.0",

  /* =====================================================
     MAIN ANALYSIS
  ===================================================== */

  analyze(input = {}) {
    const summary =
      typeof input === "string"
        ? { userMessage: input }
        : input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = this.normalize(rawText);
    const signals = [];

    const add = ({
      type = "question_purpose",
      value,
      evidence,
      confidence = 0.7,
      category = "request",
      domain = "conversation",
      operation = null,
      requestedOutput = null,
      inferenceLevel = "observed",
      evidenceClass = "direct_text",
      metadata = {}
    } = {}) => {
      if (!value || !evidence) return;

      const normalizedValue = this.normalizeToken(value);

      const existing = signals.find(signal =>
        signal.type === type &&
        signal.value === normalizedValue
      );

      if (existing) {
        existing.confidence = Math.max(existing.confidence, confidence);
        existing.evidence = [
          ...new Set([
            ...(existing.evidence || []),
            evidence
          ])
        ];
        existing.matchCount = Number(existing.matchCount || 1) + 1;
        return;
      }

      signals.push({
        type,
        value: normalizedValue,
        category,
        domain,
        operation,
        requestedOutput,
        confidence,
        inferenceLevel,
        evidenceClass,
        evidence: [evidence],
        matchCount: 1,
        source: "ari-question-understanding",
        sourceVersion: this.version,
        metadata
      });
    };

    this.runPatternGroups(text, add);
    this.detectCompositeIntent(text, signals, add);
    this.detectQuestionForm(text, add);
    this.detectDirectness(text, add);

    const rankedSignals = this.rankSignals(signals);
    const primarySignal = rankedSignals[0] || this.defaultSignal();
    const secondarySignals = rankedSignals.slice(1);

    const observations = rankedSignals.map(signal =>
      this.toLedgerObservation(signal, rawText)
    );

    return {
      questionUnderstandingRan: true,
      questionUnderstandingVersion: this.version,
      questionUnderstandingSource: "ari-question-understanding",

      rawText,
      normalizedText: text,

      primaryPurpose: primarySignal.value,
      primaryPurposeConfidence: primarySignal.confidence,
      primaryPurposeScore: primarySignal.score,

      supportPurposes: secondarySignals.map(signal => signal.value),
      purposeCandidates: rankedSignals,

      requestedOperations: [
        ...new Set(
          rankedSignals
            .map(signal => signal.operation)
            .filter(Boolean)
        )
      ],

      requestedOutputs: [
        ...new Set(
          rankedSignals
            .map(signal => signal.requestedOutput)
            .filter(Boolean)
        )
      ],

      observations,
      observationCount: observations.length,

      multiPurpose: rankedSignals.length > 1,
      competingPurposes: this.findCompetingPurposes(rankedSignals),

      responseHints: this.buildResponseHints(rankedSignals),

      authority: {
        canObserveQuestionPurpose: true,
        canRankPurposeCandidates: true,

        canChooseFinalIntent: false,
        canChooseLane: false,
        canBuildSemanticFrame: false,
        canDetermineSafetySeverity: false,
        canAnswerUser: false,

        role: "question_purpose_evidence_only"
      }
    };
  },

  /* =====================================================
     BACKWARD COMPATIBILITY
  ===================================================== */

  classify(message = "") {
    return this.analyze(message).primaryPurpose || "understanding";
  },

  observe(input = {}) {
    return this.analyze(input);
  },

  /* =====================================================
     DECLARATIVE PURPOSE PATTERNS
  ===================================================== */

  purposeGroups: {
    meaning: {
      confidence: 0.9,
      operation: "interpret_meaning",
      requestedOutput: "meaning",
      phrases: [
        "season of my life",
        "what is this really about",
        "what does this mean",
        "what is the lesson",
        "what am i supposed to learn",
        "what is life trying to teach me",
        "what does this reveal",
        "what is underneath all of this",
        "what is the deeper meaning",
        "why is this happening now",
        "what is this season teaching me",
        "what does this chapter mean",
        "what is this chapter about",
        "what is this season about",
        "what is this trying to teach me"
      ]
    },

    insight: {
      confidence: 0.9,
      operation: "surface_pattern_or_blind_spot",
      requestedOutput: "insight",
      phrases: [
        "what pattern",
        "what pattern do you see",
        "what am i avoiding",
        "what am i not seeing",
        "what am i likely not seeing",
        "central struggle",
        "hidden conflict",
        "blind spot",
        "tell me something about me",
        "why might i be doing that",
        "what is really going on",
        "what am i sacrificing",
        "what am i likely sacrificing",
        "what tradeoff",
        "what trade-off",
        "what am i giving up",
        "what is this costing me",
        "what cost am i ignoring",
        "without realizing it",
        "what am i protecting",
        "what does this say about me",
        "why do i keep",
        "running from",
        "uncomfortable truth",
        "most uncomfortable truth",
        "truth am i avoiding",
        "what am i refusing to see",
        "what am i not ready to admit",
        "what am i scared to admit",
        "what am i pretending not to know"
      ]
    },

    decision: {
      confidence: 0.88,
      operation: "decide",
      requestedOutput: "recommendation",
      phrases: [
        "what should i do",
        "which should i choose",
        "help me decide",
        "what should i focus",
        "what deserves my attention",
        "which identity should become primary",
        "what should i delay",
        "prioritize",
        "which option",
        "which one is better"
      ]
    },

    planning: {
      confidence: 0.86,
      operation: "plan",
      requestedOutput: "action_plan",
      phrases: [
        "make a plan",
        "create a plan",
        "roadmap",
        "next step",
        "next steps",
        "how do i",
        "how should i",
        "how can i",
        "schedule",
        "walk me through",
        "step by step"
      ]
    },

    emotional: {
      confidence: 0.82,
      operation: "support_or_understand_emotion",
      requestedOutput: "emotional_support",
      phrases: [
        "i feel",
        "i'm feeling",
        "why am i feeling",
        "guilty",
        "scared",
        "terrified",
        "sad",
        "lonely",
        "overwhelmed",
        "anxious",
        "burned out",
        "burnt out",
        "exhausted",
        "frustrated",
        "worried"
      ]
    },

    teaching: {
      confidence: 0.84,
      operation: "explain",
      requestedOutput: "explanation",
      phrases: [
        "explain",
        "teach me",
        "what does",
        "how does",
        "why does",
        "break it down",
        "help me understand",
        "what is the difference"
      ]
    },

    factual: {
      confidence: 0.86,
      operation: "retrieve_fact",
      requestedOutput: "direct_answer",
      patterns: [
        /\bwhat is\b/,
        /\bwhat are\b/,
        /\bwho is\b/,
        /\bwho was\b/,
        /\bwhen did\b/,
        /\bwhen is\b/,
        /\bwhere is\b/,
        /\bwhere was\b/,
        /\bhow many\b/,
        /\bhow much\b/
      ]
    },

    building: {
      confidence: 0.86,
      operation: "build_or_modify",
      requestedOutput: "artifact_or_code",
      phrases: [
        "build",
        "code",
        "debug",
        "github",
        "javascript",
        "html",
        "css",
        "api",
        "pipeline",
        "engine",
        "function",
        "file",
        "script",
        "bug",
        "update the code"
      ]
    },

    verification: {
      confidence: 0.88,
      operation: "verify",
      requestedOutput: "verification",
      phrases: [
        "verify",
        "are you sure",
        "is that correct",
        "check this",
        "double check",
        "confirm this",
        "does this look right"
      ]
    },

    recall: {
      confidence: 0.88,
      operation: "recall",
      requestedOutput: "remembered_context",
      phrases: [
        "do you remember",
        "what did i say",
        "what did we decide",
        "last time",
        "previously",
        "what do you know about me",
        "remember when"
      ]
    },

    creation: {
      confidence: 0.86,
      operation: "create",
      requestedOutput: "generated_content",
      phrases: [
        "write me",
        "make me",
        "create me",
        "draft",
        "compose",
        "generate",
        "design",
        "come up with"
      ]
    },

    comparison: {
      confidence: 0.84,
      operation: "compare",
      requestedOutput: "comparison",
      phrases: [
        "compare",
        "difference between",
        "versus",
        "which is better",
        "pros and cons",
        "advantages and disadvantages"
      ]
    },

    clarification: {
      confidence: 0.86,
      operation: "clarify",
      requestedOutput: "clarification",
      phrases: [
        "what do you mean",
        "where exactly",
        "can you clarify",
        "explain that",
        "what are you saying",
        "i don't understand",
        "i dont understand"
      ]
    },

    instruction: {
      confidence: 0.84,
      operation: "instruct",
      requestedOutput: "instructions",
      patterns: [
        /\bhow to\b/,
        /\bshow me how\b/,
        /\bwalk me through\b/,
        /\bwhat steps\b/
      ]
    },

    opinion: {
      confidence: 0.8,
      operation: "give_opinion",
      requestedOutput: "opinion",
      phrases: [
        "what do you think",
        "your opinion",
        "what would you do",
        "how do you feel about"
      ]
    }
  },

  /* =====================================================
     PATTERN EXECUTION
  ===================================================== */

  runPatternGroups(text, add) {
    Object.entries(this.purposeGroups).forEach(([purpose, config]) => {
      const matches = [];

      (config.phrases || []).forEach(phrase => {
        if (text.includes(phrase)) matches.push(phrase);
      });

      (config.patterns || []).forEach(regex => {
        const match = text.match(regex);
        if (match?.[0]) matches.push(match[0]);
      });

      matches.forEach(evidence => {
        add({
          value: purpose,
          evidence,
          confidence: config.confidence,
          operation: config.operation,
          requestedOutput: config.requestedOutput,
          metadata: {
            detectionMethod: "purpose_pattern",
            matchedPurpose: purpose
          }
        });
      });
    });

    const insightScore = this.scoreInsightIntent(text);

    if (insightScore >= 4) {
      add({
        value: "insight",
        evidence: `insight_score:${insightScore}`,
        confidence: Math.min(0.94, 0.6 + insightScore * 0.04),
        operation: "surface_pattern_or_blind_spot",
        requestedOutput: "insight",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference",
        metadata: {
          detectionMethod: "composite_insight_score",
          insightScore
        }
      });
    }
  },

  /* =====================================================
     COMPOSITE PURPOSE DETECTION
  ===================================================== */

  detectCompositeIntent(text, signals, add) {
    const has = purpose =>
      signals.some(signal => signal.value === purpose);

    if (has("emotional") && has("decision")) {
      add({
        type: "question_purpose_relationship",
        value: "emotion_influences_decision",
        evidence: "emotional + decision signals",
        confidence: 0.78,
        category: "relationship",
        operation: "support_decision_under_emotion",
        requestedOutput: "grounded_recommendation",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference"
      });
    }

    if (has("building") && has("planning")) {
      add({
        type: "question_purpose_relationship",
        value: "build_requires_plan",
        evidence: "building + planning signals",
        confidence: 0.82,
        category: "relationship",
        domain: "builder",
        operation: "plan_implementation",
        requestedOutput: "implementation_plan",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference"
      });
    }

    if (has("building") && has("verification")) {
      add({
        type: "question_purpose_relationship",
        value: "artifact_requires_validation",
        evidence: "building + verification signals",
        confidence: 0.84,
        category: "relationship",
        domain: "builder",
        operation: "validate_artifact",
        requestedOutput: "validation_result",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference"
      });
    }

    if (has("factual") && has("teaching")) {
      add({
        type: "question_purpose_relationship",
        value: "fact_with_explanation",
        evidence: "factual + teaching signals",
        confidence: 0.8,
        category: "relationship",
        operation: "retrieve_and_explain",
        requestedOutput: "direct_answer_with_explanation",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference"
      });
    }

    if (has("decision") && has("comparison")) {
      add({
        type: "question_purpose_relationship",
        value: "comparison_supports_decision",
        evidence: "decision + comparison signals",
        confidence: 0.82,
        category: "relationship",
        operation: "compare_and_recommend",
        requestedOutput: "decision_support",
        inferenceLevel: "inferred",
        evidenceClass: "system_inference"
      });
    }
  },

  /* =====================================================
     QUESTION FORM AND DIRECTNESS
  ===================================================== */

  detectQuestionForm(text, add) {
    if (!text) return;

    if (text.endsWith("?")) {
      add({
        type: "question_form",
        value: "explicit_question",
        evidence: "?",
        confidence: 0.95,
        category: "communication"
      });
    }

    if (/^(why|how|what|who|where|when|which|can|could|should|would|do|does|did|is|are)\b/.test(text)) {
      add({
        type: "question_form",
        value: "interrogative_opening",
        evidence: text.split(/\s+/)[0],
        confidence: 0.88,
        category: "communication"
      });
    }

    if (/^(why|how|what about|what if|then what|really)\??$/.test(text)) {
      add({
        type: "question_form",
        value: "context_dependent_follow_up",
        evidence: text,
        confidence: 0.88,
        category: "continuity",
        domain: "continuity",
        operation: "resolve_from_prior_context",
        requestedOutput: "follow_up_answer"
      });
    }
  },

  detectDirectness(text, add) {
    const concise = text.match(
      /\b(just answer|straight answer|quick answer|briefly|keep it short|short answer)\b/
    );

    if (concise) {
      add({
        type: "response_preference",
        value: "concise",
        evidence: concise[0],
        confidence: 0.88,
        requestedOutput: "concise"
      });
    }

    const detailed = text.match(
      /\b(explain fully|detailed answer|go deep|break it down|step by step)\b/
    );

    if (detailed) {
      add({
        type: "response_preference",
        value: "detailed",
        evidence: detailed[0],
        confidence: 0.88,
        requestedOutput: "detailed"
      });
    }

    const blunt = text.match(
      /\b(be honest|be blunt|don't sugarcoat|do not sugarcoat|tell me the truth)\b/
    );

    if (blunt) {
      add({
        type: "response_preference",
        value: "blunt",
        evidence: blunt[0],
        confidence: 0.88,
        requestedOutput: "blunt"
      });
    }
  },

  /* =====================================================
     RANKING
  ===================================================== */

  priority: {
    verification: 98,
    recall: 96,
    decision: 94,
    building: 92,
    creation: 91,
    planning: 90,
    clarification: 89,
    comparison: 88,
    factual: 87,
    instruction: 86,
    teaching: 85,
    meaning: 84,
    insight: 83,
    emotional: 82,
    opinion: 78,
    understanding: 50
  },

  rankSignals(signals = []) {
    return signals
      .map(signal => {
        const priority = this.priority[signal.value] || 70;
        const corroboration = Math.min(8, Math.max(0, signal.matchCount - 1) * 2);
        const score = Math.round(
          priority * 0.55 +
          signal.confidence * 100 * 0.4 +
          corroboration
        );

        return {
          ...signal,
          priority,
          score
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.confidence - a.confidence;
      });
  },

  findCompetingPurposes(signals = []) {
    const top = signals.slice(0, 4);

    return top
      .flatMap((signal, index) =>
        top.slice(index + 1).map(other => ({
          first: signal.value,
          second: other.value,
          scoreDifference: Math.abs(signal.score - other.score),
          closeCompetition: Math.abs(signal.score - other.score) <= 6
        }))
      )
      .filter(pair => pair.closeCompetition);
  },

  buildResponseHints(signals = []) {
    const values = new Set(signals.map(signal => signal.value));

    return {
      answerDirectly:
        values.has("factual") ||
        values.has("verification") ||
        values.has("clarification"),

      explain:
        values.has("teaching") ||
        values.has("meaning") ||
        values.has("insight"),

      providePlan:
        values.has("planning"),

      provideRecommendation:
        values.has("decision"),

      provideArtifact:
        values.has("building") ||
        values.has("creation"),

      useEmotionalAttunement:
        values.has("emotional"),

      usePriorContext:
        values.has("recall") ||
        values.has("context_dependent_follow_up"),

      compareOptions:
        values.has("comparison")
    };
  },

  /* =====================================================
     LEDGER HANDOFF
  ===================================================== */

  toLedgerObservation(signal = {}, rawText = "") {
    const evidenceText = signal.evidence?.[0] || "";
    const start = evidenceText
      ? rawText.toLowerCase().indexOf(String(evidenceText).toLowerCase())
      : -1;

    return {
      type: signal.type,
      value: signal.value,
      signal: signal.value,

      category: signal.category || "request",
      domain: signal.domain || "conversation",

      subject: "user",
      target: "assistant",

      operation: signal.operation || null,
      requestedOutput: signal.requestedOutput || null,

      confidence: signal.confidence,
      evidenceClass: signal.evidenceClass,
      inferenceLevel: signal.inferenceLevel,

      evidence: (signal.evidence || []).map(item => ({
        text: item,
        sourceField: "userMessage",
        start: start >= 0 ? start : null,
        end: start >= 0 ? start + String(item).length : null
      })),

      source: "ari-question-understanding",
      sourceVersion: this.version,
      sourceStage: "perception",

      metadata: {
        score: signal.score || null,
        priority: signal.priority || null,
        matchCount: signal.matchCount || 1,
        ...(signal.metadata || {})
      }
    };
  },

  /* =====================================================
     INSIGHT SCORING
  ===================================================== */

  scoreInsightIntent(text = "") {
    const weights = {
      truth: 2,
      uncomfortable: 2,
      avoid: 3,
      avoiding: 3,
      "blind spot": 3,
      pattern: 2,
      hidden: 2,
      sacrifice: 2,
      sacrificing: 2,
      tradeoff: 2,
      "trade-off": 2,
      "not seeing": 2,
      "refusing to see": 3,
      "not ready to admit": 3,
      "pretending not to know": 3,
      "costing me": 2,
      "really going on": 2
    };

    return Object.entries(weights).reduce((score, [phrase, weight]) => {
      return text.includes(phrase) ? score + weight : score;
    }, 0);
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  defaultSignal() {
    return {
      type: "question_purpose",
      value: "understanding",
      category: "request",
      domain: "conversation",
      operation: "understand_or_respond",
      requestedOutput: "appropriate_response",
      confidence: 0.5,
      evidenceClass: "hypothesis",
      inferenceLevel: "hypothesized",
      evidence: [],
      matchCount: 0,
      priority: 50,
      score: 48
    };
  },

  containsAny(text = "", phrases = []) {
    return phrases.some(phrase => text.includes(phrase));
  },

  normalizeToken(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^\w]/g, "")
      .replace(/_+/g, "_");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI QUESTION UNDERSTANDING LOADED:",
  window.Ari.questionUnderstanding?.version
);