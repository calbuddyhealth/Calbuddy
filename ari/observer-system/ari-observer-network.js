// ari/observer-system/ari-observer-network.js
// Ari Observer Evidence Network
// Purpose: Detect and preserve raw linguistic, referential, participant,
// structural, contextual, and semantic evidence without choosing meaning,
// routing, safety severity, conversation function, or response.
// V7.0.0 — Canonical Observation / Typed References / Local Grounding / No Premature Interpretation

window.Ari = window.Ari || {};

window.Ari.observerNetwork = {
  version: "7.0.0",

  /* =====================================================
     MAIN OBSERVATION ENTRY
  ===================================================== */

  observe(input = {}) {
    const summary = input.summary || input || {};
    const rawText = summary.userMessage || summary.message || summary.input || summary.normalizedMessage || "";
    const text = this.normalize(rawText);
    const ledgerEngine = window.Ari?.observationLedger || null;
    const ledger = ledgerEngine?.create ? ledgerEngine.create() : [];
    const localContext = this.buildLocalContext(text);

    const add = (type, value, evidence, confidence = 0.7, meta = {}) => {
      if (!type || value === undefined || value === null) return null;

      const observation = {
        type,
        value,
        category: meta.category || this.categoryForObservation(type),
        domain: meta.domain || "general",
        subject: meta.subject ?? null,
        target: meta.target ?? null,
        relation: meta.relation ?? null,
        operation: meta.operation ?? null,
        requestedOutput: meta.requestedOutput ?? null,
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
        const before = ledger.length;
        ledgerEngine.add(ledger, observation);
        if (ledger.length > before) return ledger[ledger.length - 1];

        const evidenceKey = this.evidenceKey(observation.evidence);
        return ledger.find(item =>
          item.type === observation.type &&
          item.value === observation.value &&
          this.evidenceKey(item.evidence) === evidenceKey
        ) || null;
      }

      const fallback = { ...observation, signal: value, observationType: observation.evidenceClass };
      const exists = ledger.some(item =>
        item.type === fallback.type &&
        item.value === fallback.value &&
        this.evidenceKey(item.evidence) === this.evidenceKey(fallback.evidence)
      );

      if (!exists) ledger.push(fallback);
      return fallback;
    };

    this.observeLanguage(rawText, text, add);
    this.observeCommunication(text, add);
    this.observeParticipants(text, add, localContext);
    this.observeSemantics(text, add, localContext);
    this.observeStructure(text, add);
    this.observeDomains(text, add, localContext);

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
      observedValues: [...new Set(ledger.map(item => item.value).filter(value => value !== null && value !== undefined))],
      observedCategories: [...new Set(ledger.map(item => item.category).filter(Boolean))],
      observedDomains: [...new Set(ledger.map(item => item.domain).filter(Boolean))],
      rankedLedgerObservations: ranked,
      strongestObservation: ranked[0]?.value ?? ranked[0]?.signal ?? null,
      strongestObservationType: ranked[0]?.type || null,
      strongestObservationCategory: ranked[0]?.category || null,
      strongestObservationConfidence: ranked[0]?.confidence ?? 0,
      strongestObservationWeight: ranked[0]?.weight ?? 0,
      localObservationContext: localContext,

      evidenceGroups: {
        byType: ledgerSummary.groupedByType || this.groupBy(ledger, "type"),
        byCategory: ledgerSummary.groupedByCategory || this.groupBy(ledger, "category"),
        byDomain: ledgerSummary.groupedByDomain || this.groupBy(ledger, "domain"),
        bySubject: ledgerEngine?.groupBySubject ? ledgerEngine.groupBySubject(ledger) : this.groupBy(ledger, "subject")
      },

      authority: {
        canObserveEvidence: true,
        canPreserveSemanticClues: true,
        canIdentifyParticipants: true,
        canIdentifyOperations: true,
        canIdentifyReferences: true,
        canDescribeReferenceGrounding: true,
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

    if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("ari:observation", { detail: result }));
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

  observeParticipants(text, add, localContext = {}) {
    this.detectOwnership(text, add);
    this.detectParticipantMentions(text, add);
    this.detectPronouns(text, add, localContext);
    this.runPatternTable(text, add, this.patterns.conversationTargets);
  },

  observeSemantics(text, add, localContext = {}) {
    this.runPatternTable(text, add, this.patterns.operations);
    this.detectReferences(text, add, localContext);
    this.detectSlots(text, add, localContext);
    this.detectMissingAnchors(text, add, localContext);
  },

  observeStructure(text, add) {
    this.runPatternTable(text, add, this.patterns.time);
    this.runTermTable(text, add, this.patterns.connectors);
    this.detectQuantities(text, add);
    this.runPatternTable(text, add, this.patterns.pressure);
  },

  observeDomains(text, add, localContext = {}) {
    this.scanLexicon(text, add, localContext);
  },

  /* =====================================================
     LOCAL TURN CONTEXT
  ===================================================== */

  buildLocalContext(text = "") {
    const tokens = this.tokenize(text);
    const nounCandidates = this.extractLocalNounCandidates(text);
    const participantMentions = this.extractParticipantMentions(text);
    const referenceMentions = this.extractReferenceMentions(text);
    const explicitSubjects = this.detectExplicitSubjectCandidates(text);
    const clauses = this.splitClauses(text);

    return {
      text,
      tokens,
      wordCount: tokens.length,
      clauses,
      nounCandidates,
      participantMentions,
      referenceMentions,
      explicitSubjects,
      hasQuestionForm: text.endsWith("?") || /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(text),
      hasGeneralPeopleSubject: /\b(people|humans|someone|somebody|a person|users|children|adults|men|women)\b/.test(text),
      hasSelfSubject: /\b(i|i'm|i am|me|myself)\b/.test(text),
      hasAssistantAddress: /\b(you|your|yourself)\b/.test(text),
      hasLocalNounCandidate: nounCandidates.length > 0
    };
  },

  splitClauses(text = "") {
    return String(text || "")
      .split(/[,;:.!?]|\b(?:but|however|although|because|while|when|if|then)\b/)
      .map(item => item.trim())
      .filter(Boolean);
  },

  tokenize(text = "") {
    return String(text || "")
      .toLowerCase()
      .match(/[a-z0-9']+/g) || [];
  },

  detectExplicitSubjectCandidates(text = "") {
    const subjects = [];

    const patterns = [
      { value: "user", regex: /\b(i|i'm|i am|me|myself)\b/, confidence: 0.92 },
      { value: "assistant", regex: /\b(you|yourself)\b/, confidence: 0.84 },
      { value: "general_people", regex: /\b(people|humans|users|someone|somebody|a person)\b/, confidence: 0.9 },
      { value: "close_other", regex: /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter|my brother|my sister)\b/, confidence: 0.92 }
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (match) subjects.push({ value: pattern.value, surface: match[0], confidence: pattern.confidence });
    });

    return subjects;
  },

  extractParticipantMentions(text = "") {
    const patterns = [
      { participantType: "general_people", regex: /\b(people|humans|users|someone|somebody|a person|individuals)\b/g },
      { participantType: "group", regex: /\b(children|adults|men|women|patients|employees|students|parents|families)\b/g },
      { participantType: "close_other", regex: /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter|my brother|my sister)\b/g },
      { participantType: "named_role", regex: /\b(a doctor|the doctor|a nurse|the nurse|my boss|a coworker|my friend|a friend)\b/g }
    ];

    const results = [];

    patterns.forEach(pattern => {
      for (const match of text.matchAll(pattern.regex)) {
        results.push({
          surface: match[0],
          participantType: pattern.participantType,
          start: match.index ?? null,
          end: Number.isFinite(match.index) ? match.index + match[0].length : null
        });
      }
    });

    return results;
  },

  extractReferenceMentions(text = "") {
    const references = [];
    const pattern = /\b(it|its|this|that|these|those|they|them|their|he|him|his|she|her|hers|one|ones|same thing|same one|other one|the first one|the second one|which one|which option|before|earlier|previously|last time|again|based on that|given that)\b/g;

    for (const match of text.matchAll(pattern)) {
      references.push({
        surface: match[0],
        referenceKind: this.classifyReferenceKind(match[0]),
        start: match.index ?? null,
        end: Number.isFinite(match.index) ? match.index + match[0].length : null
      });
    }

    return references;
  },

  extractLocalNounCandidates(text = "") {
    const stopwords = new Set([
      "what", "when", "where", "why", "how", "who", "which", "can", "could", "should", "would", "will",
      "do", "does", "did", "is", "are", "am", "was", "were", "be", "been", "being", "have", "has", "had",
      "i", "me", "my", "mine", "myself", "you", "your", "yours", "yourself", "we", "us", "our", "ours",
      "he", "him", "his", "she", "her", "hers", "they", "them", "their", "theirs", "it", "its",
      "this", "that", "these", "those", "a", "an", "the", "to", "of", "for", "with", "from", "about",
      "on", "in", "at", "by", "and", "or", "but", "if", "then", "than", "as", "when", "while",
      "not", "no", "yes", "just", "really", "very", "some", "any", "all", "one", "ones", "same"
    ]);

    const operationWords = new Set([
      "answer", "tell", "explain", "recommend", "suggest", "choose", "pick", "compare", "plan", "fix",
      "debug", "repair", "create", "make", "write", "generate", "design", "update", "rewrite", "replace",
      "edit", "change", "remove", "add", "remember", "recall", "verify", "confirm", "clarify"
    ]);

    const tokens = this.tokenize(text);
    const candidates = tokens.filter(token =>
      token.length >= 3 &&
      !stopwords.has(token) &&
      !operationWords.has(token) &&
      !/^\d+$/.test(token)
    );

    return [...new Set(candidates)];
  },

  /* =====================================================
     DECLARATIVE PATTERN TABLES
  ===================================================== */

  patterns: {
    questions: [
      { type: "question_phrase", value: "decision_question", regex: /\b(should i|should we|what should)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation" } },
      { type: "question_phrase", value: "instruction_question", regex: /\b(how do|how can|how should)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation" } },
      { type: "question_phrase", value: "opinion_request", regex: /\b(do you think|what do you think|your opinion)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation" } },
      { type: "question_phrase", value: "assistant_state_question", regex: /\b(do you believe|do you have|are you)\b/, confidence: 0.84, meta: { category: "communication", domain: "conversation" } },
      { type: "question_phrase", value: "knowledge_question", regex: /\b(what is|what are|who is|who was|when did|when is|where is|where was|why does|why do|how does)\b/, confidence: 0.88, meta: { category: "communication", domain: "knowledge" } },
      { type: "question_phrase", value: "permission_question", regex: /\b(can i|may i|is it okay|would it be okay)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation" } },
      { type: "question_phrase", value: "request_question", regex: /\b(can you|could you|would you)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation" } }
    ],

    speechActs: [
      { type: "speech_act", value: "greeting", regex: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/, confidence: 0.8, meta: { category: "communication", domain: "conversation" } },
      { type: "speech_act", value: "thanks", regex: /\b(thank you|thanks|appreciate it)\b/, confidence: 0.8, meta: { category: "communication", domain: "conversation" } },
      { type: "speech_act", value: "request", regex: /\b(can you|could you|please|send me|give me|show me|help me)\b/, confidence: 0.82, meta: { category: "communication", domain: "conversation", subject: "user", target: "assistant" } },
      { type: "speech_act", value: "clarification_request", regex: /\b(what do you mean|where exactly|is this right|is this useful|are you sure)\b/, confidence: 0.84, meta: { category: "communication", domain: "conversation", subject: "user", target: "assistant" } },
      { type: "speech_act", value: "feedback", regex: /\b(this worked|that worked|done|it worked|still broken|not working|confused)\b/, confidence: 0.82, meta: { category: "communication", domain: "conversation", subject: "user", target: "assistant" } },
      { type: "speech_act", value: "preference", regex: /\b(i like|i prefer|i want|i don't want|i dont want|i hate|i love)\b/, confidence: 0.82, meta: { category: "communication", domain: "conversation", subject: "user" } },
      { type: "speech_act", value: "correction", regex: /\b(no,|not what i meant|that's wrong|that is wrong|i meant|instead)\b/, confidence: 0.86, meta: { category: "communication", domain: "conversation", subject: "user", target: "assistant" } }
    ],

    styles: [
      { type: "style_request", value: "concise", regex: /\b(quick|brief|short|simple|straight answer|just answer)\b/, confidence: 0.84, meta: { category: "request", domain: "conversation", requestedOutput: "concise" } },
      { type: "style_request", value: "detailed", regex: /\b(deep|detailed|explain more|break it down|full code|entire code)\b/, confidence: 0.84, meta: { category: "request", domain: "conversation", requestedOutput: "detailed" } },
      { type: "style_request", value: "blunt", regex: /\b(be honest|real answer|don't sugarcoat|do not sugarcoat|blunt)\b/, confidence: 0.84, meta: { category: "request", domain: "conversation", requestedOutput: "blunt" } }
    ],

    answerExpectations: [
      { type: "answer_expectation", value: "direct_answer", regex: /\b(answer|tell me|what is|what are|who is|who was|when did|where is|why|is it|does it)\b/, confidence: 0.82, meta: { category: "request", domain: "conversation", requestedOutput: "direct_answer" } },
      { type: "answer_expectation", value: "step_by_step", regex: /\b(step by step|how do i|how to|walk me through)\b/, confidence: 0.84, meta: { category: "request", domain: "conversation", requestedOutput: "step_by_step" } },
      { type: "answer_expectation", value: "code_output", regex: /\b(send code|full code|entire code|replace file|copy paste|send the file)\b/, confidence: 0.88, meta: { category: "request", domain: "builder", requestedOutput: "code" } },
      { type: "answer_expectation", value: "opinion", regex: /\b(what do you think|your opinion|do you think)\b/, confidence: 0.82, meta: { category: "request", domain: "conversation", requestedOutput: "opinion" } },
      { type: "answer_expectation", value: "recommendation", regex: /\b(what should i do|recommend|best option|should i)\b/, confidence: 0.84, meta: { category: "request", domain: "conversation", requestedOutput: "recommendation" } }
    ],

    operations: [
      { type: "operation_signal", value: "recommend", regex: /\b(recommend|suggest|what would you do)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "choose", regex: /\b(choose|pick|which one|best option)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "compare", regex: /\b(compare|difference|versus|vs|better|worse|which is)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "plan", regex: /\b(plan|strategy|roadmap|steps|schedule|routine|what should i do)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "explain", regex: /\b(why|how come|explain|teach|break down|what does|meaning of)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "repair", regex: /\b(fix|debug|repair|solve|not working|broken|error)\b/, confidence: 0.82 },
      { type: "operation_signal", value: "create", regex: /\b(build|create|make|write|generate|design)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "modify", regex: /\b(update|rewrite|replace|edit|change|remove|add)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "request_permission", regex: /\b(can i|is it okay|would it be okay)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "decide", regex: /\b(should i|do i|help me decide)\b/, confidence: 0.8 },
      { type: "operation_signal", value: "recall", regex: /\b(remember|what did we|last time|previously|what was)\b/, confidence: 0.82 },
      { type: "operation_signal", value: "clarify", regex: /\b(what do you mean|where exactly|are you sure|is this right)\b/, confidence: 0.82 },
      { type: "operation_signal", value: "verify", regex: /\b(check|verify|confirm|are you sure|is that correct)\b/, confidence: 0.82 }
    ].map(item => ({ ...item, meta: { category: "request", domain: "conversation", operation: item.value, subject: "user", target: "assistant" } })),

    questionShapes: [
      { type: "question_shape", value: "bare_why", regex: /^why\??$/ },
      { type: "question_shape", value: "bare_how", regex: /^how\??$/ },
      { type: "question_shape", value: "short_follow_up", regex: /^(why|how|what about|what if|then what|really|and then)\??$/ },
      { type: "question_shape", value: "choice_question", regex: /\b(which|choose|pick|better|best|option)\b/ },
      { type: "question_shape", value: "action_question", regex: /\b(what should i do|how do i|how can i|what do i do)\b/ },
      { type: "question_shape", value: "explanation_question", regex: /\b(why|explain|what does|how come|how does)\b/ },
      { type: "question_shape", value: "factual_question", regex: /\b(what is|what are|who is|who was|when did|where is)\b/ },
      { type: "question_shape", value: "permission_question", regex: /\b(can i|should i|do i|is it okay)\b/ }
    ].map(item => ({ ...item, confidence: 0.8, meta: { category: "communication", domain: "conversation" } })),

    conversationTargets: [
      { type: "conversation_target", value: "assistant", regex: /\b(do you|are you|can you|would you|your opinion|your identity|yourself)\b/, confidence: 0.84, meta: { category: "participant", domain: "conversation", subject: "user", target: "assistant" } },
      { type: "conversation_target", value: "user", regex: /\b(i|me|my|myself)\b/, confidence: 0.74, meta: { category: "participant", domain: "conversation", subject: "user", target: "user" } },
      { type: "conversation_target", value: "general_people", regex: /\b(people|someone|somebody|humans|users|a person)\b/, confidence: 0.82, meta: { category: "participant", domain: "conversation", subject: "general_people", target: "general_people" } }
    ],

    time: [
      { type: "time_reference", value: "past", regex: /\b(yesterday|last week|last month|two weeks ago|years ago|last year|previously)\b/, confidence: 0.82, meta: { category: "time", domain: "conversation", temporalStatus: "past", tense: "past" } },
      { type: "time_reference", value: "current", regex: /\b(now|right now|currently|today|tonight|this morning|this afternoon|still|already)\b/, confidence: 0.82, meta: { category: "time", domain: "conversation", temporalStatus: "current", tense: "present" } },
      { type: "time_reference", value: "future", regex: /\b(tomorrow|next week|next month|soon|in six weeks|in six months|for the next|eventually)\b/, confidence: 0.82, meta: { category: "time", domain: "conversation", temporalStatus: "future", tense: "future" } }
    ],

    certainty: [
      { type: "certainty_marker", value: "high", regex: /\b(definitely|certainly|absolutely|for sure|no doubt)\b/, confidence: 0.74, meta: { category: "epistemic", domain: "conversation", certaintyLevel: "high" } },
      { type: "certainty_marker", value: "low", regex: /\b(maybe|possibly|probably|not sure|unclear|i think|i guess)\b/, confidence: 0.74, meta: { category: "epistemic", domain: "conversation", certaintyLevel: "low" } }
    ],

    pressure: [
      { type: "pressure_or_constraint", value: "obligation", regex: /\b(have to|must|need to|supposed to|responsible for)\b/ },
      { type: "pressure_or_constraint", value: "constraint", regex: /\b(can't|cant|cannot|only|realistically|no choice|limited)\b/ },
      { type: "pressure_or_constraint", value: "desire", regex: /\b(want to|wish|hope|dream|prefer)\b/ }
    ].map(item => ({ ...item, confidence: 0.8, meta: { category: "goal_context", domain: "conversation", subject: "user" } })),

    connectors: ["but", "however", "although", "while", "at the same time", "versus", "vs", "on the other hand", "either", "or"]
  },

  /* =====================================================
     TYPED REFERENCE DETECTION
  ===================================================== */

  referencePatterns: [
    { value: "personal_pronoun", referenceKind: "personal_pronoun", regex: /\b(he|him|his|she|her|hers|they|them|their|theirs)\b/g },
    { value: "neutral_pronoun", referenceKind: "neutral_pronoun", regex: /\b(it|its)\b/g },
    { value: "demonstrative_reference", referenceKind: "demonstrative", regex: /\b(this|that|these|those)\b/g },
    { value: "selection_reference", referenceKind: "selection", regex: /\b(which one|which option|the first one|the second one|the other one|same one|other one)\b/g },
    { value: "generic_substitution", referenceKind: "substitution", regex: /\b(one|ones|same thing)\b/g },
    { value: "prior_turn_reference", referenceKind: "prior_turn", regex: /\b(earlier|previously|last time|again|based on that|given that)\b/g },
    { value: "personalized_context_reference", referenceKind: "personalization", regex: /\b(for me|my situation|my case|in my case|for us)\b/g }
  ],

  detectReferences(text, add, localContext = {}) {
    this.referencePatterns.forEach(pattern => {
      for (const match of text.matchAll(pattern.regex)) {
        const surface = match[0];
        const grounding = this.assessReferenceGrounding({
          text,
          surface,
          start: match.index ?? 0,
          referenceKind: pattern.referenceKind,
          localContext
        });

        add("reference_signal", pattern.value, surface, grounding.confidence, {
          category: "continuity",
          domain: "conversation",
          target: grounding.target,
          referenceKind: pattern.referenceKind,
          referenceSurface: surface,
          locallyGrounded: grounding.locallyGrounded,
          localAntecedent: grounding.localAntecedent,
          requiresResolution: grounding.requiresResolution,
          requiresPriorContext: grounding.requiresPriorContext,
          referenceRole: grounding.referenceRole,
          groundingReason: grounding.reason,
          clueOnly: true,
          semanticAuthority: false
        });
      }
    });
  },

  classifyReferenceKind(surface = "") {
    const value = this.normalize(surface);

    if (/^(he|him|his|she|her|hers|they|them|their|theirs)$/.test(value)) return "personal_pronoun";
    if (/^(it|its)$/.test(value)) return "neutral_pronoun";
    if (/^(this|that|these|those)$/.test(value)) return "demonstrative";
    if (/^(which one|which option|the first one|the second one|the other one|same one|other one)$/.test(value)) return "selection";
    if (/^(one|ones|same thing)$/.test(value)) return "substitution";
    if (/^(earlier|previously|last time|again|based on that|given that)$/.test(value)) return "prior_turn";
    if (/^(for me|my situation|my case|in my case|for us)$/.test(value)) return "personalization";

    return "unknown";
  },

  assessReferenceGrounding({ text = "", surface = "", start = 0, referenceKind = "unknown", localContext = {} } = {}) {
    const priorText = text.slice(0, Math.max(0, start)).trim();
    const followingText = text.slice(start + surface.length).trim();
    const priorNouns = this.extractLocalNounCandidates(priorText);
    const localAntecedent = priorNouns.at(-1) || null;
    const genericSubject = localContext.hasGeneralPeopleSubject === true;
    const demonstrativeDeterminer = /^(this|that|these|those)\s+[a-z0-9]/.test(text.slice(start));
    const selectionNeedsOptions = referenceKind === "selection";
    const explicitlyPriorTurn = referenceKind === "prior_turn";
    const personalizationOnly = referenceKind === "personalization";
    const pronounCanReferToGenericSubject =
      ["personal_pronoun", "neutral_pronoun"].includes(referenceKind) &&
      genericSubject &&
      /\b(people|humans|users|someone|somebody|a person|children|adults|men|women)\b/.test(priorText);

    if (personalizationOnly) {
      return {
        locallyGrounded: true,
        localAntecedent: "user_context",
        requiresResolution: false,
        requiresPriorContext: false,
        target: "user_context",
        referenceRole: "personalization",
        confidence: 0.82,
        reason: "Personalization language modifies the request but does not itself require a prior-turn anchor."
      };
    }

    if (demonstrativeDeterminer) {
      const noun = this.extractLocalNounCandidates(text.slice(start, start + 80))[0] || null;
      return {
        locallyGrounded: true,
        localAntecedent: noun,
        requiresResolution: false,
        requiresPriorContext: false,
        target: noun || "local_phrase",
        referenceRole: "determiner",
        confidence: 0.84,
        reason: "The demonstrative directly modifies a noun in the current turn."
      };
    }

    if (pronounCanReferToGenericSubject) {
      return {
        locallyGrounded: true,
        localAntecedent: "general_people",
        requiresResolution: false,
        requiresPriorContext: false,
        target: "general_people",
        referenceRole: "local_coreference",
        confidence: 0.84,
        reason: "The pronoun has a compatible participant antecedent inside the current turn."
      };
    }

    if (localAntecedent && !selectionNeedsOptions && !explicitlyPriorTurn) {
      return {
        locallyGrounded: true,
        localAntecedent,
        requiresResolution: false,
        requiresPriorContext: false,
        target: localAntecedent,
        referenceRole: "local_coreference_candidate",
        confidence: 0.74,
        reason: "A plausible antecedent appears earlier in the same turn."
      };
    }

    if (explicitlyPriorTurn) {
      return {
        locallyGrounded: false,
        localAntecedent: null,
        requiresResolution: true,
        requiresPriorContext: true,
        target: "prior_context",
        referenceRole: "explicit_prior_turn_reference",
        confidence: 0.88,
        reason: "The wording explicitly points to earlier conversational context."
      };
    }

    if (selectionNeedsOptions) {
      const localOptions = this.detectLocalOptions(text);
      const grounded = localOptions.length >= 2;

      return {
        locallyGrounded: grounded,
        localAntecedent: grounded ? "local_options" : null,
        requiresResolution: !grounded,
        requiresPriorContext: !grounded,
        target: grounded ? "local_options" : "unresolved_selection",
        referenceRole: "selection_reference",
        confidence: grounded ? 0.84 : 0.8,
        reason: grounded
          ? "The current turn contains multiple local options."
          : "The selection phrase does not have enough local options in the current turn."
      };
    }

    const bareReference = !localAntecedent && followingText.split(/\s+/).filter(Boolean).length <= 6;

    return {
      locallyGrounded: false,
      localAntecedent: null,
      requiresResolution: bareReference,
      requiresPriorContext: bareReference,
      target: bareReference ? "unresolved_reference" : "reference_candidate",
      referenceRole: bareReference ? "possibly_context_dependent" : "descriptive_reference",
      confidence: bareReference ? 0.7 : 0.62,
      reason: bareReference
        ? "No compatible local antecedent was found and the reference carries substantial meaning."
        : "The reference was observed, but current-turn content may still provide enough independent meaning."
    };
  },

  detectLocalOptions(text = "") {
    const results = [];
    const versus = text.match(/(.+?)\s+(?:versus|vs\.?)\s+(.+?)(?:\?|$)/i);
    const eitherOr = text.match(/\beither\s+(.+?)\s+or\s+(.+?)(?:\?|$)/i);

    if (versus) results.push(versus[1].trim(), versus[2].trim());
    if (eitherOr) results.push(eitherOr[1].trim(), eitherOr[2].trim());

    return results.filter(Boolean);
  },

  /* =====================================================
     DOMAIN LEXICON — CLUES ONLY
  ===================================================== */

  lexicon: {
    safety: {
      type: "safety_language", category: "safety", domain: "safety", confidence: 0.82,
      terms: ["emergency", "danger", "unsafe", "not safe", "can't stay safe", "cant stay safe", "kill myself", "hurt myself", "self harm", "suicide", "overdose", "poison", "hurt someone", "weapon", "abuse", "assault", "threat", "violence"]
    },

    body: {
      type: "body_context", category: "medical", domain: "body", confidence: 0.76,
      terms: ["pregnant", "pregnancy", "doctor", "hospital", "medication", "diagnosis", "surgery", "therapy", "medical history", "stroke", "dementia", "cancer", "diabetes"]
    },

    symptoms: {
      type: "body_symptom", category: "medical", domain: "body", confidence: 0.8,
      terms: ["pain", "hurt", "bleeding", "fever", "vomiting", "dizzy", "faint", "fainting", "passed out", "chest pain", "trouble breathing", "shortness of breath", "seizure", "weakness", "numbness", "contractions", "fluid leakage", "decreased fetal movement"]
    },

    relationship: {
      type: "relationship_reference", category: "relationship", domain: "relationship", confidence: 0.75,
      terms: ["wife", "husband", "spouse", "partner", "fiance", "fiancée", "girlfriend", "boyfriend", "ex", "friend", "coworker", "boss", "neighbor", "teacher", "doctor"]
    },

    family: {
      type: "family_reference", category: "relationship", domain: "family", confidence: 0.78,
      terms: ["family", "mom", "mother", "dad", "father", "parent", "parents", "child", "kid", "son", "daughter", "baby", "children", "brother", "sister", "grandma", "grandmother", "grandpa", "grandfather", "aunt", "uncle", "cousin", "in law", "guardian", "caregiver"]
    },

    emotion: {
      type: "emotion_word", category: "emotion", domain: "emotion", confidence: 0.72,
      terms: ["tired", "exhausted", "overwhelmed", "stressed", "sad", "angry", "mad", "scared", "afraid", "guilty", "ashamed", "lonely", "frustrated", "confused", "worried", "anxious", "resentful", "hurt", "disappointed", "burned out", "burnt out"]
    },

    work: {
      type: "work_reference", category: "life_context", domain: "career", confidence: 0.72,
      terms: ["job", "career", "work", "school", "college", "military", "navy", "army", "marine", "promotion", "boss", "coworker", "business", "company", "resume", "interview", "overtime", "shift", "graduate school"]
    },

    money: {
      type: "money_reference", category: "life_context", domain: "financial", confidence: 0.74,
      terms: ["money", "financial", "budget", "debt", "rent", "mortgage", "salary", "pay", "bills", "afford", "expensive", "tight", "security", "income", "loan", "co-sign", "cosign", "save", "saving"]
    },

    builder: {
      type: "building_reference", category: "domain", domain: "builder", confidence: 0.78,
      terms: ["build", "fix", "debug", "code", "github", "app", "project", "website", "feature", "error", "repo", "javascript", "html", "css", "file", "function", "replace", "update", "composer", "pipeline", "observer", "engine"]
    },

    knowledge: {
      type: "knowledge_request_phrase", category: "request", domain: "knowledge", confidence: 0.76,
      terms: ["what is", "why", "explain", "teach", "understand", "difference", "meaning of", "how does", "define"]
    },

    identity: {
      type: "identity_or_personhood_reference", category: "domain", domain: "identity", confidence: 0.78,
      terms: ["who are you", "do you believe", "are you alive", "are you conscious", "identity", "personhood", "personality", "yourself", "artificial intelligence"]
    },

    memory: {
      type: "memory_request_phrase", category: "request", domain: "memory", confidence: 0.8,
      terms: ["remember", "don't forget", "from now on", "going forward", "save this", "store this", "note that"]
    },

    wisdom: {
      type: "wisdom_reference", category: "meaning", domain: "wisdom", confidence: 0.72,
      terms: ["regret", "right thing", "meaning", "values", "principle", "long term", "future self", "sacrifice", "worth it", "what matters", "important"]
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

        add(pattern.type, pattern.value, evidence, pattern.confidence ?? 0.75, {
          ...(pattern.meta || {}),
          ...(typeof pattern.makeMeta === "function" ? pattern.makeMeta(match, text) : {})
        });
      });
    });
  },

  runTermTable(text, add, terms = []) {
    terms.forEach(term => {
      const match = this.findTerm(text, term);
      if (!match) return;

      add("contrast_or_tradeoff_connector", term, match, 0.82, {
        category: "discourse",
        domain: "conversation",
        relation: "contrast",
        clueOnly: true,
        semanticAuthority: false
      });
    });
  },

  scanLexicon(text, add, localContext = {}) {
    Object.entries(this.lexicon).forEach(([group, config]) => {
      config.terms.forEach(term => {
        const matches = this.findAllTerms(text, term);

        matches.forEach(match => {
          const contextualMeta = this.buildLexiconContext({
            group,
            config,
            term,
            match,
            text,
            localContext
          });

          add(config.type, term, match.surface, contextualMeta.confidence, {
            category: config.category || "observation",
            domain: config.domain || "general",
            subject: contextualMeta.subject,
            target: contextualMeta.target,
            relation: contextualMeta.relation,
            evidenceClass: "direct_text",
            inferenceLevel: "observed",
            lexiconGroup: group,
            clueOnly: true,
            semanticAuthority: false,
            mentionRole: contextualMeta.mentionRole,
            experiencer: contextualMeta.experiencer,
            contextualScope: contextualMeta.contextualScope,
            locallyGrounded: contextualMeta.locallyGrounded
          });
        });
      });
    });
  },

  buildLexiconContext({ group = "", config = {}, term = "", match = {}, text = "", localContext = {} } = {}) {
    const nearby = this.getNearbyText(text, match.start, match.end, 55);
    const explicitSelfEmotion = group === "emotion" && /\b(i am|i'm|i feel|i felt|i was|feeling)\b/.test(nearby.before);
    const generalPeopleEmotion = group === "emotion" && (
      /\b(people|humans|users|someone|somebody|a person|children|adults|men|women)\b/.test(nearby.before) ||
      /\bwhen\s+(they|people|someone|somebody)\s+(are|feel|become|get)\b/.test(nearby.combined)
    );

    const closeOtherEmotion = group === "emotion" && /\b(my wife|my husband|my spouse|my partner|my dad|my mom|my child|my baby|my son|my daughter|my brother|my sister)\b/.test(nearby.before);
    const hypotheticalEmotion = group === "emotion" && /\b(if|when|what happens when|what do people do when)\b/.test(nearby.combined);
    const quotedOrDiscussed = group === "emotion" && !explicitSelfEmotion && !generalPeopleEmotion && !closeOtherEmotion;

    if (group === "emotion") {
      if (explicitSelfEmotion) {
        return {
          subject: "user",
          target: "user",
          relation: "experiences",
          experiencer: "user",
          mentionRole: "self_emotional_state",
          contextualScope: "current_user_state",
          locallyGrounded: true,
          confidence: Math.max(config.confidence || 0.72, 0.86)
        };
      }

      if (generalPeopleEmotion) {
        return {
          subject: "general_people",
          target: term,
          relation: "described_state",
          experiencer: "general_people",
          mentionRole: hypotheticalEmotion ? "general_or_hypothetical_emotional_state" : "general_people_emotional_state",
          contextualScope: "described_subject",
          locallyGrounded: true,
          confidence: 0.82
        };
      }

      if (closeOtherEmotion) {
        return {
          subject: "close_other",
          target: term,
          relation: "described_state",
          experiencer: "close_other",
          mentionRole: "close_other_emotional_state",
          contextualScope: "described_subject",
          locallyGrounded: true,
          confidence: 0.8
        };
      }

      return {
        subject: null,
        target: term,
        relation: "emotion_mentioned",
        experiencer: null,
        mentionRole: quotedOrDiscussed ? "emotion_mention_without_resolved_experiencer" : "emotion_mention",
        contextualScope: "undetermined",
        locallyGrounded: false,
        confidence: Math.min(config.confidence || 0.72, 0.68)
      };
    }

    const subject = this.resolveNearbySubject(nearby.combined, localContext);

    return {
      subject,
      target: null,
      relation: "mentioned",
      experiencer: null,
      mentionRole: "domain_term_mention",
      contextualScope: subject ? "described_subject" : "undetermined",
      locallyGrounded: Boolean(subject),
      confidence: config.confidence ?? 0.7
    };
  },

  resolveNearbySubject(text = "", localContext = {}) {
    if (/\b(i|i'm|i am|me|myself)\b/.test(text)) return "user";
    if (/\b(my wife|my husband|my spouse|my partner|my dad|my mom|my child|my baby|my son|my daughter|my brother|my sister)\b/.test(text)) return "close_other";
    if (/\b(people|humans|users|someone|somebody|a person|children|adults|men|women)\b/.test(text)) return "general_people";
    if (/\b(you|yourself)\b/.test(text)) return "assistant";

    return localContext.explicitSubjects?.[0]?.value || null;
  },

  getNearbyText(text = "", start = 0, end = 0, radius = 50) {
    const safeStart = Math.max(0, Number(start || 0));
    const safeEnd = Math.max(safeStart, Number(end || safeStart));

    return {
      before: text.slice(Math.max(0, safeStart - radius), safeStart),
      surface: text.slice(safeStart, safeEnd),
      after: text.slice(safeEnd, safeEnd + radius),
      combined: text.slice(Math.max(0, safeStart - radius), safeEnd + radius)
    };
  },

  /* =====================================================
     SPECIALIZED DETECTORS
  ===================================================== */

  detectQuestionMarks(text, add) {
    const count = (text.match(/\?/g) || []).length;
    if (count > 0) add("question_mark_count", count, "?", 0.95, { category: "communication", domain: "conversation" });
  },

  detectMessageLength(text, add) {
    if (text.length < 40) {
      add("message_length", "short", text || "short message", 0.65, {
        category: "structure",
        domain: "conversation",
        structuralOnly: true,
        cannotEstablishContinuity: true
      });
    } else if (text.length > 600) {
      add("message_length", "long", "long message", 0.65, {
        category: "structure",
        domain: "conversation",
        structuralOnly: true
      });
    }
  },

  detectParticipantMentions(text, add) {
    this.extractParticipantMentions(text).forEach(item => {
      add("participant_mention", item.participantType, item.surface, 0.84, {
        category: "participant",
        domain: item.participantType === "close_other" ? "relationship" : "conversation",
        subject: item.participantType,
        target: item.participantType,
        participantType: item.participantType,
        mentionRole: "explicit_participant_mention",
        locallyGrounded: true,
        clueOnly: true,
        semanticAuthority: false
      });
    });
  },

  detectPronouns(text, add, localContext = {}) {
    const pattern = /\b(i|me|my|myself|you|your|yourself|we|us|our|ourselves|he|him|his|she|her|hers|they|them|their|theirs|it|its)\b/g;

    for (const match of text.matchAll(pattern)) {
      const surface = match[0];
      const pronounClass = this.pronounClass(surface);
      const grounding = this.assessPronounGrounding({
        text,
        surface,
        start: match.index ?? 0,
        pronounClass,
        localContext
      });

      add("pronoun_mention", pronounClass, surface, grounding.confidence, {
        category: "participant",
        domain: "conversation",
        subject: grounding.subject,
        target: grounding.target,
        pronounSurface: surface,
        pronounClass,
        locallyGrounded: grounding.locallyGrounded,
        localAntecedent: grounding.localAntecedent,
        requiresResolution: grounding.requiresResolution,
        requiresPriorContext: grounding.requiresPriorContext,
        mentionRole: grounding.mentionRole,
        groundingReason: grounding.reason,
        clueOnly: true,
        semanticAuthority: false
      });
    }
  },

  pronounClass(surface = "") {
    const value = this.normalize(surface);

    if (/^(i|me|my|myself)$/.test(value)) return "first_person_singular";
    if (/^(we|us|our|ourselves)$/.test(value)) return "first_person_plural";
    if (/^(you|your|yourself)$/.test(value)) return "second_person";
    if (/^(he|him|his|she|her|hers)$/.test(value)) return "third_person_singular";
    if (/^(they|them|their|theirs)$/.test(value)) return "third_person_plural_or_neutral";
    if (/^(it|its)$/.test(value)) return "third_person_neutral";

    return "unknown";
  },

  assessPronounGrounding({ text = "", surface = "", start = 0, pronounClass = "", localContext = {} } = {}) {
    if (pronounClass === "first_person_singular") {
      return {
        subject: "user",
        target: "user",
        locallyGrounded: true,
        localAntecedent: "user",
        requiresResolution: false,
        requiresPriorContext: false,
        mentionRole: "speaker_reference",
        confidence: 0.95,
        reason: "First-person singular pronouns directly identify the speaker."
      };
    }

    if (pronounClass === "first_person_plural") {
      return {
        subject: "user_inclusive_group",
        target: "user_inclusive_group",
        locallyGrounded: true,
        localAntecedent: "user_inclusive_group",
        requiresResolution: false,
        requiresPriorContext: false,
        mentionRole: "speaker_group_reference",
        confidence: 0.84,
        reason: "First-person plural identifies a group that includes the speaker."
      };
    }

    if (pronounClass === "second_person") {
      return {
        subject: "assistant",
        target: "assistant",
        locallyGrounded: true,
        localAntecedent: "assistant",
        requiresResolution: false,
        requiresPriorContext: false,
        mentionRole: "addressee_reference",
        confidence: 0.92,
        reason: "Second-person pronouns directly identify the addressee."
      };
    }

    const priorText = text.slice(0, Math.max(0, start));
    const participant = this.findCompatibleLocalParticipant(priorText, pronounClass);

    if (participant) {
      return {
        subject: participant,
        target: participant,
        locallyGrounded: true,
        localAntecedent: participant,
        requiresResolution: false,
        requiresPriorContext: false,
        mentionRole: "local_coreference",
        confidence: 0.84,
        reason: "A compatible participant antecedent appears earlier in the current turn."
      };
    }

    const currentTurnStillMeaningful = localContext.nounCandidates?.length > 1 || localContext.wordCount > 8;

    return {
      subject: null,
      target: "reference_candidate",
      locallyGrounded: false,
      localAntecedent: null,
      requiresResolution: !currentTurnStillMeaningful,
      requiresPriorContext: !currentTurnStillMeaningful,
      mentionRole: currentTurnStillMeaningful ? "unresolved_pronoun_nonblocking" : "unresolved_pronoun_potentially_blocking",
      confidence: currentTurnStillMeaningful ? 0.62 : 0.72,
      reason: currentTurnStillMeaningful
        ? "No local antecedent was found, but the turn contains independent semantic content."
        : "No local antecedent or substantial independent semantic content was found."
    };
  },

  findCompatibleLocalParticipant(priorText = "", pronounClass = "") {
    const patterns = pronounClass === "third_person_plural_or_neutral"
      ? [
          ["general_people", /\b(people|humans|users|children|adults|men|women|parents|families)\b/],
          ["group", /\b(they|a group|the team|the family|the patients|the employees)\b/]
        ]
      : pronounClass === "third_person_singular"
        ? [
            ["close_other", /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my son|my daughter|my brother|my sister)\b/],
            ["person", /\b(someone|somebody|a person|the person|a doctor|the doctor|a nurse|the nurse|my friend|a friend)\b/]
          ]
        : [
            ["entity", /\b(the app|the file|the code|the car|the engine|the system|the object|the question|the answer)\b/]
          ];

    for (const [value, regex] of patterns) {
      if (regex.test(priorText)) return value;
    }

    return null;
  },

  detectOwnership(text, add) {
    const self = text.match(/\b(i|me|my|myself)\b/);

    if (self) {
      add("ownership_reference", "self", self[0], 0.78, {
        category: "participant",
        domain: "conversation",
        subject: "user",
        target: "user",
        ownershipRole: "self",
        locallyGrounded: true
      });
    }

    const closeOther = text.match(/\b(my wife|my husband|my spouse|my partner|my girlfriend|my boyfriend|my fiancé|my fiance|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter|my brother|my sister)\b/);

    if (closeOther) {
      add("ownership_reference", "close_other", closeOther[0], 0.84, {
        category: "participant",
        domain: "relationship",
        subject: "user",
        target: this.relationshipTargetFromPhrase(closeOther[0]),
        relation: "related_to",
        ownershipRole: "close_other",
        locallyGrounded: true
      });
    }

    const unspecified = text.match(/\b(someone|somebody|a person|friend)\b/);

    if (unspecified) {
      add("ownership_reference", "other_or_unspecified", unspecified[0], 0.68, {
        category: "participant",
        domain: "conversation",
        subject: "unspecified_person",
        target: "unspecified_person",
        ownershipRole: "unspecified_other",
        locallyGrounded: true
      });
    }

    const assistant = text.match(/\b(you|your|yourself)\b/);

    if (assistant) {
      add("ownership_reference", "assistant", assistant[0], 0.72, {
        category: "participant",
        domain: "conversation",
        subject: "assistant",
        target: "assistant",
        ownershipRole: "assistant",
        locallyGrounded: true
      });
    }
  },

  detectSlots(text, add, localContext = {}) {
    const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

    numbers.forEach(number => {
      add("slot_signal", "quantity_or_measure", number, 0.8, {
        category: "semantic_slot",
        domain: "conversation",
        slotCandidate: "quantity",
        slotValue: number,
        slotStatus: "observed_candidate",
        semanticAuthority: false
      });
    });

    const slotPatterns = [
      { value: "goal_language", slot: "goal", regex: /\b(so i can|in order to|trying to|want to|need to)\b/, confidence: 0.8 },
      { value: "problem_language", slot: "problem", regex: /\b(error|bug|broken|not working|issue|problem|wrong|failed|confused)\b/, confidence: 0.82 },
      { value: "option_language", slot: "options", regex: /\b(either|versus|vs|between|option|choice)\b/, confidence: 0.78 },
      { value: "criteria_language", slot: "criteria", regex: /\b(best|better|healthy|safe|cheap|cost|fast|easy|effective|reliable|important|worth it)\b/, confidence: 0.76 },
      { value: "audience_language", slot: "audience", regex: /\b(for me|for us|my situation|my case|my dad|my wife|my girlfriend|my child|my baby)\b/, confidence: 0.8 }
    ];

    slotPatterns.forEach(slot => {
      const match = text.match(slot.regex);
      if (!match) return;

      add("slot_signal", slot.value, match[0], slot.confidence, {
        category: "semantic_slot",
        domain: "conversation",
        slotCandidate: slot.slot,
        slotStatus: "observed_candidate",
        semanticAuthority: false
      });
    });

    const quoted = this.extractQuotedContent(text);

    if (quoted) {
      add("slot_signal", "quoted_content", quoted, 0.9, {
        category: "semantic_slot",
        domain: "conversation",
        slotCandidate: "object",
        slotValue: quoted,
        slotStatus: "explicit",
        semanticAuthority: false
      });
    }

    const objectCandidate = this.extractObjectCandidate(text, localContext);

    if (objectCandidate?.value) {
      add("slot_signal", "object_candidate", objectCandidate.evidence, objectCandidate.confidence, {
        category: "semantic_slot",
        domain: "conversation",
        slotCandidate: "object",
        slotValue: objectCandidate.value,
        objectKind: objectCandidate.objectKind,
        locallyGrounded: objectCandidate.locallyGrounded,
        slotStatus: objectCandidate.explicit ? "explicit_candidate" : "inferred_candidate",
        inferenceLevel: objectCandidate.explicit ? "observed" : "inferred",
        evidenceClass: objectCandidate.explicit ? "direct_text" : "system_inference",
        semanticAuthority: false
      });
    }
  },

  detectMissingAnchors(text, add, localContext = {}) {
    const operationPresent = this.hasOperationLanguage(text);
    const unresolvedReferences = this.extractReferenceMentions(text)
      .map(reference => ({
        ...reference,
        grounding: this.assessReferenceGrounding({
          text,
          surface: reference.surface,
          start: reference.start ?? 0,
          referenceKind: reference.referenceKind,
          localContext
        })
      }))
      .filter(reference => reference.grounding.requiresResolution === true);

    const bareFollowUp = /^(why|how|what about|what if|then what|really|and then)\??$/.test(text);
    const localObject = this.extractObjectCandidate(text, localContext);
    const substantiveLocalMeaning = Boolean(
      localObject?.value ||
      localContext.hasGeneralPeopleSubject ||
      localContext.nounCandidates?.length >= 2 ||
      localContext.wordCount >= 8
    );

    const addInference = (value, evidence, confidence, meta = {}) => {
      add("missing_anchor_signal", value, evidence, confidence, {
        category: "ambiguity",
        domain: "continuity",
        inferenceLevel: "inferred",
        evidenceClass: "strong_inference",
        requiresPriorContext: true,
        blockingPotential: true,
        semanticAuthority: false,
        ...meta
      });
    };

    if (bareFollowUp && !substantiveLocalMeaning) {
      addInference("bare_follow_up_without_local_anchor", text, 0.9, {
        reason: "The complete turn is a bare follow-up form without independent local content."
      });
    }

    if (operationPresent && unresolvedReferences.length > 0 && !substantiveLocalMeaning) {
      addInference("operation_with_unresolved_required_reference", unresolvedReferences.map(item => item.surface), 0.86, {
        unresolvedReferences: unresolvedReferences.map(item => item.surface),
        reason: "An operation depends on a reference that has no local antecedent or independent object."
      });
    }

    const unresolvedSelection = unresolvedReferences.find(item => item.referenceKind === "selection");

    if (unresolvedSelection && this.detectLocalOptions(text).length < 2) {
      addInference("selection_reference_without_local_options", unresolvedSelection.surface, 0.88, {
        referenceKind: "selection",
        reason: "A selection request is present without enough options in the current turn."
      });
    }
  },

  hasOperationLanguage(text = "") {
    return /\b(recommend|suggest|choose|pick|which|compare|explain|fix|debug|plan|should i|can i|update|change|modify|verify|check|review|tell me|answer)\b/.test(text);
  },

  extractObjectCandidate(text = "", localContext = {}) {
    const explicitPatterns = [
      { objectKind: "general_subject_state", regex: /\bwhat do\s+(people|humans|users|someone|somebody|a person)\s+do\s+when\s+(they|people|someone|somebody)\s+(?:are|feel|become|get)\s+(.+?)(?:\?|$)/i, value: match => `${match[1]} when ${match[3]}` },
      { objectKind: "definition_subject", regex: /\b(?:what is|what are|define)\s+(.+?)(?:\?|$)/i, value: match => match[1] },
      { objectKind: "explanation_subject", regex: /\b(?:why does|why do|how does|how do|explain)\s+(.+?)(?:\?|$)/i, value: match => match[1] },
      { objectKind: "artifact_target", regex: /\b[\w/-]+\.(?:js|html|css|json|md|sql|ts|tsx|jsx)\b/i, value: match => match[0] },
      { objectKind: "system_component", regex: /\b(observer network|observer routing evidence|observation ledger|semantic frame builder|universal conversation classifier|question understanding|life signal extractor|perception pipeline|conversation function|reconciliation engine|blueprint writer|ai writer|language composer)\b/i, value: match => match[1] }
    ];

    for (const pattern of explicitPatterns) {
      const match = text.match(pattern.regex);
      if (!match) continue;

      const value = this.cleanCandidate(pattern.value(match));
      if (!value) continue;

      return {
        value,
        evidence: match[0],
        objectKind: pattern.objectKind,
        confidence: 0.88,
        explicit: true,
        locallyGrounded: true
      };
    }

    const nounCandidates = localContext.nounCandidates || this.extractLocalNounCandidates(text);

    if (!nounCandidates.length) return null;

    const value = nounCandidates.slice(0, 10).join(" ");

    return {
      value,
      evidence: value,
      objectKind: "local_content_candidate",
      confidence: nounCandidates.length >= 2 ? 0.68 : 0.56,
      explicit: false,
      locallyGrounded: true
    };
  },

  cleanCandidate(value = "") {
    return String(value || "")
      .replace(/\b(?:please|for me|for us)\b/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/[?!.]+$/g, "")
      .trim();
  },

  extractQuotedContent(text = "") {
    const match = String(text || "").match(/["“](.+?)["”]/);
    return match?.[1]?.trim() || null;
  },

  detectQuantities(text, add) {
    const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

    numbers.forEach(number => {
      add("quantity_reference", number, number, 0.78, {
        category: "quantity",
        domain: "conversation",
        quantityKind: number.includes("%") ? "percentage" : "number"
      });
    });

    const wordQuantity = text.match(/\b(one|two|three|several|many|few|only one|only two)\b/);

    if (wordQuantity) {
      add("quantity_reference", wordQuantity[0], wordQuantity[0], 0.72, {
        category: "quantity",
        domain: "conversation",
        quantityKind: "word_quantity"
      });
    }
  },

  detectNegation(text, add) {
    const matches = [...text.matchAll(/\b(no|not|never|without|denies|denied|isn't|isnt|wasn't|wasnt|aren't|arent|don't|dont|doesn't|doesnt|didn't|didnt|can't|cant|cannot|won't|wont|wouldn't|wouldnt|shouldn't|shouldnt)\b/g)];

    matches.forEach(match => {
      add("negation_marker", match[0], match[0], 0.8, {
        category: "linguistic",
        domain: "conversation",
        polarity: "negated",
        negated: true,
        negationScopeUnresolved: true
      });
    });
  },

  detectMessyLanguage(rawText, text, add) {
    const raw = String(rawText || "");
    if (!raw.trim()) return;

    const addLanguageSignal = (value, evidence, confidence, meta = {}) => {
      add("messy_language_signal", value, evidence, confidence, {
        category: "language_quality",
        domain: "conversation",
        normalizationClueOnly: true,
        semanticAuthority: false,
        ...meta
      });
    };

    if (raw !== raw.trim()) addLanguageSignal("extra_spacing", "leading/trailing whitespace", 0.55);
    if (/\s{2,}/.test(raw)) addLanguageSignal("irregular_spacing", "multiple spaces", 0.6);
    if (/[^\w\s'?.,!:%-]/.test(raw)) addLanguageSignal("nonstandard_characters", "nonstandard characters", 0.55);

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
      if (match) addLanguageSignal(value, match[0], 0.72, { normalizedTo: value });
    });

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > 0 && raw.length / Math.max(1, wordCount) < 3.2) {
      addLanguageSignal("very_short_tokens", raw, 0.55);
    }
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
    if (Array.isArray(evidence)) return evidence.flatMap(item => this.createEvidenceRecords(rawText, item));
    if (evidence && typeof evidence === "object") return [evidence];

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

  evidenceKey(evidence = []) {
    return this.asArray(evidence)
      .map(item => typeof item === "string"
        ? item
        : [item?.text || "", item?.start ?? "", item?.end ?? ""].join(":"))
      .join("|");
  },

  cleanMeta(meta = {}) {
    const reserved = new Set([
      "category", "domain", "subject", "target", "relation", "operation", "requestedOutput",
      "evidenceClass", "inferenceLevel", "polarity", "negated", "temporalStatus", "tense",
      "lifespan", "source", "supports", "contradicts", "blocks", "tags"
    ]);

    return Object.fromEntries(
      Object.entries(meta).filter(([key, value]) => !reserved.has(key) && value !== undefined)
    );
  },

  buildFallbackLedgerSummary(observations = []) {
    const ranked = [...observations].sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));

    return {
      observationLedgerRan: false,
      observationLedgerVersion: null,
      observationCount: observations.length,
      activeObservationCount: observations.length,
      directEvidenceCount: observations.filter(item => item.inferenceLevel === "observed").length,
      inferenceCount: observations.filter(item => item.inferenceLevel === "inferred").length,
      contradictionCount: 0,
      unresolvedCount: observations.filter(item => item.metadata?.requiresResolution === true).length,
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
      "my spouse": "user_spouse",
      "my partner": "user_partner",
      "my girlfriend": "user_partner",
      "my boyfriend": "user_partner",
      "my fiancé": "user_partner",
      "my fiance": "user_partner",
      "my dad": "user_father",
      "my father": "user_father",
      "my mom": "user_mother",
      "my mother": "user_mother",
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
    const match = String(text || "").match(new RegExp(`(^|\\b)(${escaped})(?=\\b|$)`, "i"));
    return match?.[2] || null;
  },

  findAllTerms(text = "", term = "") {
    const escaped = this.escapeRegex(term);
    const regex = new RegExp(`(^|\\b)(${escaped})(?=\\b|$)`, "gi");
    const results = [];

    for (const match of String(text || "").matchAll(regex)) {
      const surface = match[2];
      const prefixLength = match[1]?.length || 0;
      const start = Number(match.index || 0) + prefixLength;

      results.push({
        surface,
        start,
        end: start + surface.length
      });
    }

    return results;
  },

  toGlobalRegex(regex) {
    const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
    return new RegExp(regex.source, flags);
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  asArray(value = []) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
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

console.log("ARI OBSERVER NETWORK LOADED:", window.Ari.observerNetwork?.version);