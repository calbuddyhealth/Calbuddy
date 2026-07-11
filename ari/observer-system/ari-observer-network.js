// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Network
// Purpose: Detect and preserve raw linguistic and semantic evidence
// without choosing meaning, routing, safety severity, or response.
// V6.1.0 — Compact Declarative Detectors / Canonical Ledger Integration

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "6.1.0",

  /* =====================================================
     MAIN OBSERVATION ENTRY
  ===================================================== */

  observe(input = {}) {
    const summary = input.summary || input || {};

    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);
    const ledgerEngine = window.Ari?.observationLedger || null;
    const ledger = ledgerEngine?.create ? ledgerEngine.create() : [];

    const add = (type, value, evidence, confidence = 0.7, meta = {}) => {
      if (!type || value === undefined || value === null) return null;

      const observation = {
        type,
        value,
        category: meta.category || this.categoryForObservation(type),
        domain: meta.domain || "general",

        subject: meta.subject || null,
        target: meta.target || null,
        relation: meta.relation || null,
        operation: meta.operation || null,
        requestedOutput: meta.requestedOutput || null,

        confidence,
        evidence: this.createEvidenceRecords(rawText, evidence),
        evidenceClass: meta.evidenceClass || "direct_text",
        inferenceLevel: meta.inferenceLevel || "observed",

        polarity: meta.polarity || (meta.negated === true ? "negated" : "affirmed"),
        negated: meta.negated === true,

        temporalStatus: meta.temporalStatus || "current",
        tense: meta.tense || null,
        lifespan: meta.lifespan || "turn",

        source: meta.source || "ari-observer-network",
        sourceVersion: this.version,
        sourceStage: "perception",

        supports: meta.supports || [],
        contradicts: meta.contradicts || [],
        blocks: meta.blocks || [],
        tags: meta.tags || [],

        metadata: this.cleanMeta(meta)
      };

      if (ledgerEngine?.add) {
        const previousLength = ledger.length;
        ledgerEngine.add(ledger, observation);

        return ledger.length > previousLength
          ? ledger[ledger.length - 1]
          : ledger.find(item => item.dedupeKey === observation.dedupeKey) || null;
      }

      const fallback = {
        ...observation,
        signal: value,
        observationType: observation.evidenceClass
      };

      const exists = ledger.some(item =>
        item.type === fallback.type &&
        item.value === fallback.value &&
        JSON.stringify(item.evidence) === JSON.stringify(fallback.evidence)
      );

      if (!exists) ledger.push(fallback);

      return fallback;
    };

    this.observeLanguage(rawText, text, add);
    this.observeCommunication(text, add);
    this.observeSemantics(text, add);
    this.observeParticipants(text, add);
    this.observeStructure(text, add);
    this.observeDomains(text, add);

    const ledgerSummary = ledgerEngine?.summarize
      ? ledgerEngine.summarize(ledger)
      : this.buildFallbackLedgerSummary(ledger);

    const ranked = ledgerSummary.rankedObservations ||
      (ledgerEngine?.rank
        ? ledgerEngine.rank(ledger)
        : [...ledger].sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)));

    const result = {
      observerEvidenceRan: true,
      observerEvidenceVersion: this.version,
      observerEvidenceSource: "ari-observer-network",

      rawUserMessage: rawText,
      normalizedObservedText: text,

      observations: ledger,
      observationLedger: ledger,
      canonicalObservationLedger: ledger,
      observationLedgerSummary: ledgerSummary,

      observationCount: ledger.length,
      activeObservationCount: ledgerSummary.activeObservationCount ?? ledger.length,
      directEvidenceCount: ledgerSummary.directEvidenceCount ?? ledger.length,
      inferenceCount: ledgerSummary.inferenceCount ?? 0,
      contradictionCount: ledgerSummary.contradictionCount ?? 0,
      unresolvedObservationCount: ledgerSummary.unresolvedCount ?? 0,

      observedTypes: [...new Set(ledger.map(item => item.type).filter(Boolean))],
      observedValues: [...new Set(
        ledger
          .map(item => item.value)
          .filter(value => value !== null && value !== undefined)
      )],
      observedCategories: [...new Set(ledger.map(item => item.category).filter(Boolean))],
      observedDomains: [...new Set(ledger.map(item => item.domain).filter(Boolean))],

      rankedLedgerObservations: ranked,

      strongestObservation: ranked[0]?.value ?? ranked[0]?.signal ?? null,
      strongestObservationType: ranked[0]?.type || null,
      strongestObservationCategory: ranked[0]?.category || null,
      strongestObservationConfidence: ranked[0]?.confidence ?? 0,
      strongestObservationWeight: ranked[0]?.weight ?? 0,

      evidenceGroups: {
        byType: ledgerSummary.groupedByType || this.groupBy(ledger, "type"),
        byCategory: ledgerSummary.groupedByCategory || this.groupBy(ledger, "category"),
        byDomain: ledgerSummary.groupedByDomain || this.groupBy(ledger, "domain"),
        bySubject: ledgerEngine?.groupBySubject
          ? ledgerEngine.groupBySubject(ledger)
          : this.groupBy(ledger, "subject")
      },

      authority: {
        canObserveEvidence: true,
        canPreserveSemanticClues: true,
        canIdentifyParticipants: true,
        canIdentifyOperations: true,
        canIdentifyReferences: true,
        canIdentifyOutputExpectations: true,

        canChooseLane: false,
        canChooseMode: false,
        canChooseIntent: false,
        canSelectPrimaryMeaning: false,
        canBuildSemanticFrame: false,
        canDetermineSafetySeverity: false,
        canAnswerUser: false,
        canOverrideSafety: false,

        role: "canonical_raw_and_semantic_evidence_observation"
      },

      source: "ari-observer-network"
    };

    if (
      typeof window.dispatchEvent === "function" &&
      typeof CustomEvent === "function"
    ) {
      window.dispatchEvent(
        new CustomEvent("ari:observation", { detail: result })
      );
    }

    return result;
  },

  /* =====================================================
     OBSERVATION GROUPS
  ===================================================== */

  observeLanguage(rawText, text, add) {
    this.detectMessyLanguage(rawText, text, add);
    this.detectNegation(text, add);
    this.runPatternTable(text, add, this.patterns.certainty);
  },

  observeCommunication(text, add) {
    this.detectQuestionMarks(text, add);
    this.runPatternTable(text, add, this.patterns.questions);
    this.runPatternTable(text, add, this.patterns.speechActs);
    this.runPatternTable(text, add, this.patterns.styles);
    this.runPatternTable(text, add, this.patterns.answerExpectations);
    this.runPatternTable(text, add, this.patterns.questionShapes);
    this.detectMessageLength(text, add);
  },

  observeSemantics(text, add) {
    this.runPatternTable(text, add, this.patterns.operations);
    this.runPatternTable(text, add, this.patterns.references);

    this.detectSlots(text, add);
    this.detectMissingAnchors(text, add);
  },

  observeParticipants(text, add) {
    this.detectOwnership(text, add);
    this.runPatternTable(text, add, this.patterns.conversationTargets);
  },

  observeStructure(text, add) {
    this.runPatternTable(text, add, this.patterns.time);
    this.runTermTable(text, add, this.patterns.connectors);
    this.detectQuantities(text, add);
    this.runPatternTable(text, add, this.patterns.pressure);
  },

  observeDomains(text, add) {
    this.scanLexicon(text, add);
  },

  /* =====================================================
     DECLARATIVE PATTERN TABLES
  ===================================================== */

  patterns: {
    questions: [
      {
        type: "question_phrase",
        value: "decision_question",
        regex: /\b(should i|should we|what should)\b/,
        confidence: 0.86,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "question_phrase",
        value: "instruction_question",
        regex: /\b(how do|how can|how should)\b/,
        confidence: 0.86,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "question_phrase",
        value: "opinion_request",
        regex: /\b(do you think|what do you think|your opinion)\b/,
        confidence: 0.86,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "question_phrase",
        value: "self_disclosure_question",
        regex: /\b(do you believe|do you have|are you)\b/,
        confidence: 0.84,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "question_phrase",
        value: "knowledge_question",
        regex: /\b(what is|what are|who is|who was|when did|where is|why|how does)\b/,
        confidence: 0.88,
        meta: { category: "communication", domain: "knowledge" }
      },
      {
        type: "question_phrase",
        value: "permission_question",
        regex: /\b(can i|may i|is it okay|would it be okay)\b/,
        confidence: 0.86,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "question_phrase",
        value: "request_question",
        regex: /\b(can you|could you|would you)\b/,
        confidence: 0.86,
        meta: { category: "communication", domain: "conversation" }
      }
    ],

    speechActs: [
      {
        type: "speech_act",
        value: "greeting",
        regex: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/,
        confidence: 0.8,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "speech_act",
        value: "thanks",
        regex: /\b(thank you|thanks|appreciate it)\b/,
        confidence: 0.8,
        meta: { category: "communication", domain: "conversation" }
      },
      {
        type: "speech_act",
        value: "request",
        regex: /\b(can you|could you|please|send me|give me|show me|help me)\b/,
        confidence: 0.82,
        meta: {
          category: "communication",
          domain: "conversation",
          subject: "user",
          target: "assistant"
        }
      },
      {
        type: "speech_act",
        value: "clarification_request",
        regex: /\b(what do you mean|where exactly|is this right|is this useful|are you sure)\b/,
        confidence: 0.84,
        meta: {
          category: "communication",
          domain: "conversation",
          subject: "user",
          target: "assistant"
        }
      },
      {
        type: "speech_act",
        value: "feedback",
        regex: /\b(this worked|that worked|done|it worked|still broken|not working|confused)\b/,
        confidence: 0.82,
        meta: {
          category: "communication",
          domain: "conversation",
          subject: "user",
          target: "assistant"
        }
      },
      {
        type: "speech_act",
        value: "preference",
        regex: /\b(i like|i prefer|i want|i don't want|i hate|i love)\b/,
        confidence: 0.82,
        meta: {
          category: "communication",
          domain: "conversation",
          subject: "user"
        }
      },
      {
        type: "speech_act",
        value: "correction",
        regex: /\b(no,|not what i meant|that's wrong|that is wrong|i meant|instead)\b/,
        confidence: 0.86,
        meta: {
          category: "communication",
          domain: "conversation",
          subject: "user",
          target: "assistant"
        }
      }
    ],

    styles: [
      {
        type: "style_request",
        value: "concise",
        regex: /\b(quick|brief|short|simple|straight answer|just answer)\b/,
        confidence: 0.84,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "concise"
        }
      },
      {
        type: "style_request",
        value: "detailed",
        regex: /\b(deep|detailed|explain more|break it down|full code|entire code)\b/,
        confidence: 0.84,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "detailed"
        }
      },
      {
        type: "style_request",
        value: "blunt",
        regex: /\b(be honest|real answer|don't sugarcoat|do not sugarcoat|blunt)\b/,
        confidence: 0.84,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "blunt"
        }
      }
    ],

    answerExpectations: [
      {
        type: "answer_expectation",
        value: "direct_answer",
        regex: /\b(answer|tell me|what is|what are|who is|who was|when did|where is|why|is it|does it)\b/,
        confidence: 0.82,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "direct_answer"
        }
      },
      {
        type: "answer_expectation",
        value: "step_by_step",
        regex: /\b(step by step|how do i|how to|walk me through)\b/,
        confidence: 0.84,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "step_by_step"
        }
      },
      {
        type: "answer_expectation",
        value: "code_output",
        regex: /\b(send code|full code|entire code|replace file|copy paste|send the file)\b/,
        confidence: 0.88,
        meta: {
          category: "request",
          domain: "builder",
          requestedOutput: "code"
        }
      },
      {
        type: "answer_expectation",
        value: "opinion",
        regex: /\b(what do you think|your opinion|do you think)\b/,
        confidence: 0.82,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "opinion"
        }
      },
      {
        type: "answer_expectation",
        value: "recommendation",
        regex: /\b(what should i do|recommend|best option|should i)\b/,
        confidence: 0.84,
        meta: {
          category: "request",
          domain: "conversation",
          requestedOutput: "recommendation"
        }
      }
    ],

    operations: [
      {
        type: "operation_signal",
        value: "recommend",
        regex: /\b(recommend|suggest|what would you do)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "choose",
        regex: /\b(choose|pick|which one|best option)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "compare",
        regex: /\b(compare|difference|versus|vs|better|worse|which is)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "plan",
        regex: /\b(plan|strategy|roadmap|steps|schedule|routine|what should i do)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "explain",
        regex: /\b(why|how come|explain|teach|break down|what does|meaning of)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "repair",
        regex: /\b(fix|debug|repair|solve|not working|broken|error)\b/,
        confidence: 0.82
      },
      {
        type: "operation_signal",
        value: "create",
        regex: /\b(build|create|make|write|generate|design)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "modify",
        regex: /\b(update|rewrite|replace|edit|change|remove|add)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "request_permission",
        regex: /\b(can i|is it okay|would it be okay)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "decide",
        regex: /\b(should i|do i|help me decide)\b/,
        confidence: 0.8
      },
      {
        type: "operation_signal",
        value: "recall",
        regex: /\b(remember|what did we|last time|previously|what was)\b/,
        confidence: 0.82
      },
      {
        type: "operation_signal",
        value: "clarify",
        regex: /\b(what do you mean|where exactly|are you sure|is this right)\b/,
        confidence: 0.82
      },
      {
        type: "operation_signal",
        value: "verify",
        regex: /\b(check|verify|confirm|are you sure|is that correct)\b/,
        confidence: 0.82
      }
    ].map(item => ({
      ...item,
      meta: {
        category: "request",
        domain: "conversation",
        operation: item.value,
        subject: "user",
        target: "assistant"
      }
    })),

    references: [
      {
        type: "reference_signal",
        value: "deictic_reference",
        regex: /\b(it|this|that|these|those|they|them|same thing|one|ones)\b/
      },
      {
        type: "reference_signal",
        value: "option_reference",
        regex: /\b(which one|which option|the first one|the second one|the other one)\b/
      },
      {
        type: "reference_signal",
        value: "prior_context_reference",
        regex: /\b(before|earlier|previously|last time|again|based on that|given that)\b/
      },
      {
        type: "reference_signal",
        value: "personalized_reference",
        regex: /\b(for me|my situation|my case|in my case|for us)\b/
      }
    ].map(item => ({
      ...item,
      confidence: 0.82,
      meta: {
        category: "continuity",
        domain: "conversation",
        target: "unresolved_reference"
      }
    })),

    questionShapes: [
      {
        type: "question_shape",
        value: "bare_why",
        regex: /^why\??$/
      },
      {
        type: "question_shape",
        value: "bare_how",
        regex: /^how\??$/
      },
      {
        type: "question_shape",
        value: "short_follow_up",
        regex: /^(why|how|what about|what if|then what|really|and then)\b/
      },
      {
        type: "question_shape",
        value: "choice_question",
        regex: /\b(which|choose|pick|better|best|option)\b/
      },
      {
        type: "question_shape",
        value: "action_question",
        regex: /\b(what should i do|how do i|how can i|what do i do)\b/
      },
      {
        type: "question_shape",
        value: "explanation_question",
        regex: /\b(why|explain|what does|how come|how does)\b/
      },
      {
        type: "question_shape",
        value: "factual_question",
        regex: /\b(what is|what are|who is|who was|when did|where is)\b/
      },
      {
        type: "question_shape",
        value: "permission_question",
        regex: /\b(can i|should i|do i|is it okay)\b/
      }
    ].map(item => ({
      ...item,
      confidence: 0.8,
      meta: {
        category: "communication",
        domain: "conversation"
      }
    })),

    conversationTargets: [
      {
        type: "conversation_target",
        value: "assistant",
        regex: /\b(do you|are you|can you|would you|your opinion|your identity|yourself)\b/,
        confidence: 0.84,
        meta: {
          category: "participant",
          domain: "conversation",
          subject: "user",
          target: "assistant"
        }
      },
      {
        type: "conversation_target",
        value: "user",
        regex: /\b(i|me|my|myself)\b/,
        confidence: 0.74,
        meta: {
          category: "participant",
          domain: "conversation",
          subject: "user",
          target: "user"
        }
      },
      {
        type: "conversation_target",
        value: "general_people",
        regex: /\b(people|someone|humans|users)\b/,
        confidence: 0.72,
        meta: {
          category: "participant",
          domain: "conversation",
          target: "general_people"
        }
      }
    ],

    time: [
      {
        type: "time_reference",
        value: "past",
        regex: /\b(yesterday|last week|last month|two weeks ago|years ago|last year|before|previously)\b/,
        confidence: 0.82,
        meta: {
          category: "time",
          domain: "conversation",
          temporalStatus: "past",
          tense: "past"
        }
      },
      {
        type: "time_reference",
        value: "current",
        regex: /\b(now|right now|currently|today|tonight|this morning|this afternoon|still|already)\b/,
        confidence: 0.82,
        meta: {
          category: "time",
          domain: "conversation",
          temporalStatus: "current",
          tense: "present"
        }
      },
      {
        type: "time_reference",
        value: "future",
        regex: /\b(tomorrow|next week|next month|soon|in six weeks|in six months|for the next|eventually)\b/,
        confidence: 0.82,
        meta: {
          category: "time",
          domain: "conversation",
          temporalStatus: "future",
          tense: "future"
        }
      }
    ],

    certainty: [
      {
        type: "certainty_marker",
        value: "high",
        regex: /\b(definitely|certainly|absolutely|for sure|no doubt)\b/,
        confidence: 0.74,
        meta: {
          category: "epistemic",
          domain: "conversation",
          certaintyLevel: "high"
        }
      },
      {
        type: "certainty_marker",
        value: "low",
        regex: /\b(maybe|possibly|probably|not sure|unclear|i think|i guess)\b/,
        confidence: 0.74,
        meta: {
          category: "epistemic",
          domain: "conversation",
          certaintyLevel: "low"
        }
      }
    ],

    pressure: [
      {
        type: "pressure_or_constraint",
        value: "obligation",
        regex: /\b(have to|must|need to|supposed to|responsible for)\b/
      },
      {
        type: "pressure_or_constraint",
        value: "constraint",
        regex: /\b(can't|cant|cannot|only|realistically|no choice|limited)\b/
      },
      {
        type: "pressure_or_constraint",
        value: "desire",
        regex: /\b(want to|wish|hope|dream|prefer)\b/
      }
    ].map(item => ({
      ...item,
      confidence: 0.8,
      meta: {
        category: "goal_context",
        domain: "conversation",
        subject: "user"
      }
    })),

    connectors: [
      "but",
      "however",
      "although",
      "while",
      "at the same time",
      "versus",
      "vs",
      "on the other hand",
      "either",
      "or"
    ]
  },

  /* =====================================================
     DOMAIN LEXICON — CLUES ONLY
  ===================================================== */

  lexicon: {
    safety: {
      type: "safety_language",
      category: "safety",
      domain: "safety",
      confidence: 0.82,
      terms: [
        "emergency", "danger", "unsafe", "not safe", "can't stay safe",
        "cant stay safe", "kill myself", "hurt myself", "self harm",
        "suicide", "overdose", "poison", "hurt someone", "weapon",
        "abuse", "assault", "threat", "violence"
      ]
    },

    body: {
      type: "body_context",
      category: "medical",
      domain: "body",
      confidence: 0.76,
      terms: [
        "pregnant", "pregnancy", "doctor", "hospital", "medication",
        "diagnosis", "surgery", "therapy", "medical history", "stroke",
        "dementia", "cancer", "diabetes"
      ]
    },

    symptoms: {
      type: "body_symptom",
      category: "medical",
      domain: "body",
      confidence: 0.8,
      terms: [
        "pain", "hurt", "bleeding", "fever", "vomiting", "dizzy",
        "faint", "fainting", "passed out", "chest pain",
        "trouble breathing", "shortness of breath", "seizure",
        "weakness", "numbness", "contractions", "fluid leakage",
        "decreased fetal movement"
      ]
    },

    relationship: {
      type: "relationship_reference",
      category: "relationship",
      domain: "relationship",
      confidence: 0.75,
      terms: [
        "wife", "husband", "spouse", "partner", "fiance", "fiancée",
        "girlfriend", "boyfriend", "ex", "friend", "coworker",
        "boss", "neighbor", "teacher", "doctor"
      ]
    },

    family: {
      type: "family_reference",
      category: "relationship",
      domain: "family",
      confidence: 0.78,
      terms: [
        "family", "mom", "mother", "dad", "father", "parent", "parents",
        "child", "kid", "son", "daughter", "baby", "children",
        "brother", "sister", "grandma", "grandmother", "grandpa",
        "grandfather", "aunt", "uncle", "cousin", "in law",
        "guardian", "caregiver"
      ]
    },

    emotion: {
      type: "emotion_word",
      category: "emotion",
      domain: "emotion",
      confidence: 0.72,
      terms: [
        "tired", "exhausted", "overwhelmed", "stressed", "sad",
        "angry", "mad", "scared", "afraid", "guilty", "ashamed",
        "lonely", "frustrated", "confused", "worried", "anxious",
        "resentful", "hurt", "disappointed", "burned out", "burnt out"
      ]
    },

    work: {
      type: "work_reference",
      category: "life_context",
      domain: "career",
      confidence: 0.72,
      terms: [
        "job", "career", "work", "school", "college", "military",
        "navy", "army", "marine", "promotion", "boss", "coworker",
        "business", "company", "resume", "interview", "overtime",
        "shift", "graduate school"
      ]
    },

    money: {
      type: "money_reference",
      category: "life_context",
      domain: "financial",
      confidence: 0.74,
      terms: [
        "money", "financial", "budget", "debt", "rent", "mortgage",
        "salary", "pay", "bills", "afford", "expensive", "tight",
        "security", "income", "loan", "co-sign", "cosign", "save",
        "saving"
      ]
    },

    builder: {
      type: "building_reference",
      category: "domain",
      domain: "builder",
      confidence: 0.78,
      terms: [
        "build", "fix", "debug", "code", "github", "app", "project",
        "website", "feature", "error", "repo", "javascript", "html",
        "css", "file", "function", "replace", "update", "composer",
        "pipeline", "observer", "engine"
      ]
    },

    knowledge: {
      type: "knowledge_request_phrase",
      category: "request",
      domain: "knowledge",
      confidence: 0.76,
      terms: [
        "what is", "why", "explain", "teach", "understand",
        "difference", "meaning of", "how does", "define"
      ]
    },

    identity: {
      type: "identity_or_personhood_reference",
      category: "domain",
      domain: "identity",
      confidence: 0.78,
      terms: [
        "who are you", "do you believe", "do you think", "are you alive",
        "are you conscious", "identity", "personhood", "personality",
        "self", "yourself", "ai", "artificial intelligence"
      ]
    },

    memory: {
      type: "memory_request_phrase",
      category: "request",
      domain: "memory",
      confidence: 0.8,
      terms: [
        "remember", "don't forget", "from now on", "going forward",
        "save this", "store this", "note that"
      ]
    },

    wisdom: {
      type: "wisdom_reference",
      category: "meaning",
      domain: "wisdom",
      confidence: 0.72,
      terms: [
        "regret", "right thing", "meaning", "values", "principle",
        "long term", "future self", "sacrifice", "worth it",
        "what matters", "important"
      ]
    }
  },

  /* =====================================================
     SHARED DECLARATIVE RUNNERS
  ===================================================== */

  runPatternTable(text, add, patterns = []) {
    patterns.forEach(pattern => {
      const matches = pattern.all
        ? [...text.matchAll(this.toGlobalRegex(pattern.regex))]
        : [text.match(pattern.regex)].filter(Boolean);

      matches.forEach(match => {
        const evidence = match?.[0];
        if (!evidence) return;

        add(
          pattern.type,
          pattern.value,
          evidence,
          pattern.confidence ?? 0.75,
          {
            ...(pattern.meta || {}),
            ...(typeof pattern.makeMeta === "function"
              ? pattern.makeMeta(match, text)
              : {})
          }
        );
      });
    });
  },

  runTermTable(text, add, terms = []) {
    terms.forEach(term => {
      const match = this.findTerm(text, term);
      if (!match) return;

      add(
        "contrast_or_tradeoff_connector",
        term,
        match,
        0.82,
        {
          category: "discourse",
          domain: "conversation",
          relation: "contrast"
        }
      );
    });
  },

  scanLexicon(text, add) {
    Object.entries(this.lexicon).forEach(([group, config]) => {
      config.terms.forEach(term => {
        const match = this.findTerm(text, term);
        if (!match) return;

        add(
          config.type,
          term,
          match,
          config.confidence ?? 0.7,
          {
            category: config.category || "observation",
            domain: config.domain || "general",
            evidenceClass: "direct_text",
            inferenceLevel: "observed",
            lexiconGroup: group,
            clueOnly: true,
            semanticAuthority: false
          }
        );
      });
    });
  },

  /* =====================================================
     SPECIALIZED DETECTORS
  ===================================================== */

  detectQuestionMarks(text, add) {
    const count = (text.match(/\?/g) || []).length;

    if (count > 0) {
      add(
        "question_mark_count",
        count,
        "?",
        0.95,
        {
          category: "communication",
          domain: "conversation"
        }
      );
    }
  },

  detectMessageLength(text, add) {
    if (text.length < 40) {
      add(
        "message_length",
        "short",
        text || "short message",
        0.65,
        {
          category: "structure",
          domain: "conversation"
        }
      );
    } else if (text.length > 600) {
      add(
        "message_length",
        "long",
        "long message",
        0.65,
        {
          category: "structure",
          domain: "conversation"
        }
      );
    }
  },

  detectOwnership(text, add) {
    const self = text.match(/\b(i|me|my|myself)\b/);

    if (self) {
      add(
        "ownership_reference",
        "self",
        self[0],
        0.78,
        {
          category: "participant",
          domain: "conversation",
          subject: "user"
        }
      );
    }

    const closeOther = text.match(
      /\b(my wife|my husband|my partner|my girlfriend|my boyfriend|my fiancé|my fiance|my dad|my mom|my child|my baby|my son|my daughter|my brother|my sister)\b/
    );

    if (closeOther) {
      add(
        "ownership_reference",
        "close_other",
        closeOther[0],
        0.84,
        {
          category: "participant",
          domain: "relationship",
          subject: "user",
          target: this.relationshipTargetFromPhrase(closeOther[0]),
          relation: "related_to"
        }
      );
    }

    const unspecified = text.match(/\b(someone|somebody|a person|friend)\b/);

    if (unspecified) {
      add(
        "ownership_reference",
        "other_or_unspecified",
        unspecified[0],
        0.68,
        {
          category: "participant",
          domain: "conversation",
          target: "unspecified_person"
        }
      );
    }

    const assistant = text.match(/\b(you|your|yourself)\b/);

    if (assistant) {
      add(
        "ownership_reference",
        "assistant",
        assistant[0],
        0.72,
        {
          category: "participant",
          domain: "conversation",
          target: "assistant"
        }
      );
    }
  },

  detectSlots(text, add) {
    const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

    numbers.forEach(number => {
      add(
        "slot_signal",
        "quantity_or_measure",
        number,
        0.8,
        {
          category: "semantic_slot",
          domain: "conversation",
          slotCandidate: "quantity",
          slotValue: number
        }
      );
    });

    const slotPatterns = [
      {
        value: "goal_language",
        slot: "goal",
        regex: /\b(to|so i can|in order to|trying to|want to|need to)\b/,
        confidence: 0.8
      },
      {
        value: "problem_language",
        slot: "problem",
        regex: /\b(error|bug|broken|not working|issue|problem|wrong|failed|confused)\b/,
        confidence: 0.82
      },
      {
        value: "option_language",
        slot: "options",
        regex: /\b(either|or|versus|vs|between|option|choice)\b/,
        confidence: 0.78
      },
      {
        value: "criteria_language",
        slot: "criteria",
        regex: /\b(best|better|healthy|safe|cheap|cost|fast|easy|effective|reliable|important|worth it)\b/,
        confidence: 0.76
      },
      {
        value: "audience_language",
        slot: "audience",
        regex: /\b(for me|for us|my situation|my case|my dad|my wife|my girlfriend|my child|my baby)\b/,
        confidence: 0.8
      }
    ];

    slotPatterns.forEach(slot => {
      const match = text.match(slot.regex);
      if (!match) return;

      add(
        "slot_signal",
        slot.value,
        match[0],
        slot.confidence,
        {
          category: "semantic_slot",
          domain: "conversation",
          slotCandidate: slot.slot
        }
      );
    });

    if (/["“”']/.test(text)) {
      add(
        "slot_signal",
        "quoted_content",
        "quoted text",
        0.78,
        {
          category: "semantic_slot",
          domain: "conversation",
          slotCandidate: "object"
        }
      );
    }

    const objectCandidate = this.extractObjectCandidate(text);

    if (objectCandidate) {
      add(
        "slot_signal",
        "object_candidate",
        objectCandidate,
        0.72,
        {
          category: "semantic_slot",
          domain: "conversation",
          slotCandidate: "object",
          slotValue: objectCandidate,
          inferenceLevel: "inferred",
          evidenceClass: "system_inference"
        }
      );
    }
  },

  detectMissingAnchors(text, add) {
    const hasOperation =
      /\b(recommend|suggest|choose|pick|which|compare|explain|fix|debug|plan|should i|can i)\b/.test(text);

    const hasReference =
      /\b(it|this|that|they|them|same|one|which one|for me|my situation|based on that)\b/.test(text);

    const objectCandidate = this.extractObjectCandidate(text);

    const addInference = (value, evidence, confidence) => {
      add(
        "missing_anchor_signal",
        value,
        evidence,
        confidence,
        {
          category: "ambiguity",
          domain: "continuity",
          inferenceLevel: "inferred",
          evidenceClass: "strong_inference"
        }
      );
    };

    if (hasOperation && hasReference && !objectCandidate) {
      addInference(
        "operation_without_standalone_object",
        "operation + reference without clear object",
        0.84
      );
    }

    if (
      /^(why|how|what about|what if|then what|really)\b/.test(text) &&
      !objectCandidate
    ) {
      addInference(
        "short_follow_up_needs_prior_context",
        text,
        0.86
      );
    }

    const optionReference = text.match(
      /\b(which one|which option|the best one|the other one)\b/
    );

    if (optionReference) {
      addInference(
        "option_reference_needs_options",
        optionReference[0],
        0.86
      );
    }
  },

  detectQuantities(text, add) {
    const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

    numbers.forEach(number => {
      add(
        "quantity_reference",
        number,
        number,
        0.78,
        {
          category: "quantity",
          domain: "conversation"
        }
      );
    });

    const wordQuantity = text.match(
      /\b(one|two|three|several|many|few|only one|only two)\b/
    );

    if (wordQuantity) {
      add(
        "quantity_reference",
        wordQuantity[0],
        wordQuantity[0],
        0.72,
        {
          category: "quantity",
          domain: "conversation"
        }
      );
    }
  },

  detectNegation(text, add) {
    const matches = [
      ...text.matchAll(
        /\b(no|not|never|without|denies|denied|isn't|isnt|wasn't|wasnt|aren't|arent|don't|dont|doesn't|doesnt|didn't|didnt)\b/g
      )
    ];

    matches.forEach(match => {
      add(
        "negation_marker",
        match[0],
        match[0],
        0.8,
        {
          category: "linguistic",
          domain: "conversation",
          polarity: "negated",
          negated: true
        }
      );
    });
  },

  detectMessyLanguage(rawText, text, add) {
    const raw = String(rawText || "");

    if (!raw.trim()) return;

    const addLanguageSignal = (value, evidence, confidence, meta = {}) => {
      add(
        "messy_language_signal",
        value,
        evidence,
        confidence,
        {
          category: "language_quality",
          domain: "conversation",
          ...meta
        }
      );
    };

    if (raw !== raw.trim()) {
      addLanguageSignal("extra_spacing", "leading/trailing whitespace", 0.55);
    }

    if (/\s{2,}/.test(raw)) {
      addLanguageSignal("irregular_spacing", "multiple spaces", 0.6);
    }

    if (/[^\w\s'?.,!:%-]/.test(raw)) {
      addLanguageSignal("nonstandard_characters", "nonstandard characters", 0.55);
    }

    const forms = [
      ["what", /\bwut\b|\bwat\b/],
      ["should", /\bshud\b|\bshuld\b/],
      ["because", /\bcuz\b|\bcause\b|\bcos\b/],
      ["recommend", /\brecomend\b|\brecommendd\b|\brecc\b/],
      ["different", /\bdiffrent\b|\bdiffernt\b/],
      ["probably", /\bprobly\b|\bprolly\b/],
      ["going_to", /\bgonna\b/],
      ["want_to", /\bwanna\b/],
      ["do_not_know", /\bidk\b/]
    ];

    forms.forEach(([value, regex]) => {
      const match = raw.toLowerCase().match(regex);
      if (!match) return;

      addLanguageSignal(value, match[0], 0.72, {
        normalizedTo: value
      });
    });

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount > 0 && raw.length / Math.max(1, wordCount) < 3.2) {
      addLanguageSignal("very_short_tokens", raw, 0.55);
    }
  },

  /* =====================================================
     OBJECT EXTRACTION
  ===================================================== */

  extractObjectCandidate(text = "") {
    const cleaned = text
      .replace(
        /\b(what|when|where|why|how|can|could|should|would|do|does|did|is|are|am)\b/g,
        " "
      )
      .replace(/\b(i|me|my|you|your|we|us|our)\b/g, " ")
      .replace(
        /\b(recommend|suggest|choose|pick|prefer|best|better|ideal|plan|explain|fix|debug)\b/g,
        " "
      )
      .replace(
        /\b(it|this|that|they|them|one|same|thing|option|for|about)\b/g,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

    const tokens = cleaned
      .split(/\W+/)
      .map(token => token.trim())
      .filter(token => token.length >= 3);

    if (/\d/.test(text)) {
      return text.match(/.{0,30}\d.{0,30}/)?.[0]?.trim() || null;
    }

    return tokens.length
      ? tokens.slice(0, 8).join(" ")
      : null;
  },

  /* =====================================================
     LEDGER / EVIDENCE HELPERS
  ===================================================== */

  categoryForObservation(type = "") {
    return window.Ari?.observationLedger?.categoryFromType
      ? window.Ari.observationLedger.categoryFromType(type)
      : "observation";
  },

  createEvidenceRecords(rawText = "", evidence = "") {
    if (Array.isArray(evidence)) {
      return evidence.flatMap(item =>
        this.createEvidenceRecords(rawText, item)
      );
    }

    if (evidence && typeof evidence === "object") {
      return [evidence];
    }

    const evidenceText = String(evidence || "").trim();

    if (!evidenceText) return [];

    const raw = String(rawText || "");
    const start = raw.toLowerCase().indexOf(evidenceText.toLowerCase());

    return [{
      text: evidenceText,
      sourceField: "userMessage",
      start: start >= 0 ? start : null,
      end: start >= 0 ? start + evidenceText.length : null
    }];
  },

  cleanMeta(meta = {}) {
    const reserved = new Set([
      "category", "domain", "subject", "target", "relation",
      "operation", "requestedOutput", "evidenceClass",
      "inferenceLevel", "polarity", "negated", "temporalStatus",
      "tense", "lifespan", "source", "supports", "contradicts",
      "blocks", "tags"
    ]);

    return Object.fromEntries(
      Object.entries(meta)
        .filter(([key, value]) => !reserved.has(key) && value !== undefined)
    );
  },

  buildFallbackLedgerSummary(observations = []) {
    const ranked = [...observations].sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    );

    return {
      observationLedgerRan: false,
      observationLedgerVersion: null,
      observationCount: observations.length,
      activeObservationCount: observations.length,
      directEvidenceCount: observations.length,

      inferenceCount: observations.filter(
        item => item.inferenceLevel === "inferred"
      ).length,

      contradictionCount: 0,
      unresolvedCount: 0,

      rankedObservations: ranked,
      groupedByType: this.groupBy(observations, "type"),
      groupedByCategory: this.groupBy(observations, "category"),
      groupedByDomain: this.groupBy(observations, "domain")
    };
  },

  groupBy(observations = [], field = "type") {
    return observations.reduce((groups, observation) => {
      const key = observation?.[field] || "unknown";
      groups[key] = groups[key] || [];
      groups[key].push(observation);
      return groups;
    }, {});
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  relationshipTargetFromPhrase(phrase = "") {
    const mapping = {
      "my wife": "user_spouse",
      "my husband": "user_spouse",
      "my partner": "user_partner",
      "my girlfriend": "user_partner",
      "my boyfriend": "user_partner",
      "my fiancé": "user_partner",
      "my fiance": "user_partner",
      "my dad": "user_father",
      "my mom": "user_mother",
      "my child": "user_child",
      "my baby": "user_child",
      "my son": "user_son",
      "my daughter": "user_daughter",
      "my brother": "user_brother",
      "my sister": "user_sister"
    };

    return mapping[String(phrase || "").toLowerCase()] || "close_other";
  },

  findTerm(text = "", term = "") {
    const escaped = this.escapeRegex(term);
    const match = String(text || "").match(
      new RegExp(`(^|\\b)(${escaped})(?=\\b|$)`, "i")
    );

    return match?.[2] || null;
  },

  toGlobalRegex(regex) {
    const flags = regex.flags.includes("g")
      ? regex.flags
      : `${regex.flags}g`;

    return new RegExp(regex.source, flags);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  "ARI OBSERVER NETWORK LOADED:",
  window.Ari.observerNetwork?.version
);