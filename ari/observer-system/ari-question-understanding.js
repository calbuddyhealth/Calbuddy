// ari/observer-system/ari-question-understanding.js
// Ari Question Understanding
// Purpose: Observe candidate response operations, outputs, request forms,
// restrictions, and contextual modifiers without choosing canonical intent.
// V3.0.0 — Explicit Request Evidence / Topic-Action Separation / Reference-Aware Advisory Candidates

window.Ari = window.Ari || {};

window.Ari.questionUnderstanding = {
  version: "3.0.0",

  /* =====================================================
     MAIN ANALYSIS
  ===================================================== */

  analyze(input = {}) {
    const summary = typeof input === "string" ? { userMessage: input } : input.summary || input || {};
    const rawText = summary.userMessage || summary.message || summary.input || "";
    const text = this.normalize(rawText);
    const observations = this.readObservations(summary);
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
      role = "purpose_candidate",
      explicit = false,
      authorized = null,
      metadata = {}
    } = {}) => {
      if (!value || evidence === undefined || evidence === null || evidence === "") return null;

      const normalizedValue = this.normalizeToken(value);
      const evidenceItems = Array.isArray(evidence) ? evidence.filter(Boolean) : [evidence].filter(Boolean);

      const existing = signals.find(signal =>
        signal.type === type &&
        signal.value === normalizedValue &&
        signal.role === role &&
        signal.operation === operation &&
        signal.requestedOutput === requestedOutput
      );

      if (existing) {
        existing.confidence = Math.max(existing.confidence, this.normalizeConfidence(confidence));
        existing.evidence = [...new Set([...(existing.evidence || []), ...evidenceItems])];
        existing.matchCount = Number(existing.matchCount || 1) + evidenceItems.length;
        existing.explicit = existing.explicit === true || explicit === true;
        existing.authorized = existing.authorized === false || authorized === false ? false : existing.authorized === true || authorized === true ? true : null;
        existing.metadata = { ...(existing.metadata || {}), ...metadata };
        return existing;
      }

      const signal = {
        type,
        value: normalizedValue,
        category,
        domain,
        operation,
        requestedOutput,
        confidence: this.normalizeConfidence(confidence),
        inferenceLevel,
        evidenceClass,
        role,
        explicit: explicit === true,
        authorized,
        evidence: evidenceItems,
        matchCount: Math.max(1, evidenceItems.length),
        source: "ari-question-understanding",
        sourceVersion: this.version,
        metadata
      };

      signals.push(signal);
      return signal;
    };

    const actionPolicy = this.detectActionPolicy(text, add);
    const referenceContext = this.readReferenceContext({ text, observations, summary, add });

    this.detectExplicitRequests(text, actionPolicy, add);
    this.detectQuestionForm(text, referenceContext, add);
    this.detectResponsePreferences(text, add);
    this.detectContextualTopics(text, observations, add);
    this.detectEmotionalContext(text, add);
    this.detectCompositeRelationships(signals, add);

    const rankedSignals = this.rankSignals(signals, actionPolicy);
    const purposeCandidates = rankedSignals.filter(signal => signal.role === "purpose_candidate");
    const contextualSignals = rankedSignals.filter(signal => signal.role === "context_modifier");
    const relationshipSignals = rankedSignals.filter(signal => signal.role === "purpose_relationship");
    const formSignals = rankedSignals.filter(signal => signal.role === "request_form");
    const preferenceSignals = rankedSignals.filter(signal => signal.role === "response_preference");
    const restrictionSignals = rankedSignals.filter(signal => signal.role === "restriction");

    const primarySignal = purposeCandidates[0] || this.defaultSignal();
    const secondarySignals = purposeCandidates.slice(1);
    const requestedOperations = this.collectRequestedOperations(purposeCandidates, actionPolicy);
    const requestedOutputs = this.collectRequestedOutputs(purposeCandidates, actionPolicy);
    const observationsOut = rankedSignals.map(signal => this.toLedgerObservation(signal, rawText));

    return {
      questionUnderstandingRan: true,
      questionUnderstandingVersion: this.version,
      questionUnderstandingSource: "ari-question-understanding",

      rawText,
      normalizedText: text,

      primaryPurpose: primarySignal.value,
      primaryPurposeConfidence: primarySignal.confidence,
      primaryPurposeScore: primarySignal.score,
      primaryPurposeAdvisoryOnly: true,

      supportPurposes: secondarySignals.map(signal => signal.value),
      purposeCandidates,
      allPurposeCandidates: purposeCandidates,

      contextualSignals,
      relationshipSignals,
      requestFormSignals: formSignals,
      responsePreferenceSignals: preferenceSignals,
      restrictionSignals,

      requestedOperations,
      requestedOutputs,

      explicitRequestPresent: purposeCandidates.some(signal => signal.explicit === true),
      explicitAuthorizedOperationPresent: purposeCandidates.some(signal => signal.explicit === true && signal.authorized !== false && Boolean(signal.operation)),

      actionPolicy,
      referenceContext,

      observations: observationsOut,
      observationCount: observationsOut.length,

      multiPurpose: purposeCandidates.length > 1,
      competingPurposes: this.findCompetingPurposes(purposeCandidates),

      responseHints: this.buildResponseHints({
        purposeCandidates,
        contextualSignals,
        preferenceSignals,
        actionPolicy,
        referenceContext
      }),

      authority: {
        canObserveQuestionPurpose: true,
        canObserveCandidateOperations: true,
        canObserveRequestedOutputs: true,
        canObserveRestrictions: true,
        canSeparateTopicFromAction: true,
        canRankPurposeCandidates: true,

        canAuthorizeUnstatedAction: false,
        canChooseFinalIntent: false,
        canChooseCanonicalMeaning: false,
        canChooseLane: false,
        canBuildSemanticFrame: false,
        canResolveReferences: false,
        canDetermineSafetySeverity: false,
        canAnswerUser: false,

        role: "question_operation_and_output_evidence_only"
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
     UPSTREAM OBSERVATION READING
  ===================================================== */

  readObservations(summary = {}) {
    const candidates = [
      summary.canonicalObservationLedger,
      summary.observationLedger,
      summary.observations,
      summary.observerEvidence?.observations,
      summary.observer?.observations
    ];

    const found = candidates.find(candidate => Array.isArray(candidate));
    return found || [];
  },

  observationsByType(observations = [], type = "") {
    const normalizedType = this.normalizeToken(type);
    return observations.filter(observation => this.normalizeToken(observation?.type) === normalizedType);
  },

  hasObservation(observations = [], predicate = () => false) {
    return observations.some(observation => {
      try {
        return predicate(observation);
      } catch (_error) {
        return false;
      }
    });
  },

  /* =====================================================
     ACTION AUTHORIZATION / RESTRICTIONS
  ===================================================== */

  detectActionPolicy(text = "", add = () => {}) {
    const executionProhibition = this.detectExecutionProhibition(text);
    const analysisOnly = executionProhibition.present || /\b(analysis only|discussion only|just discuss|just explain|only explain|only evaluate)\b/.test(text);
    const deferredExecution = executionProhibition.present && /\b(yet|for now|right now|later|not until|after we|before we)\b/.test(text);

    const prohibitedOperations = executionProhibition.present
      ? [
          "build_or_modify",
          "implement",
          "modify",
          "create_code",
          "write_code",
          "rewrite_code",
          "patch_code",
          "replace_file",
          "edit_file",
          "apply_changes"
        ]
      : [];

    if (executionProhibition.present) {
      add({
        type: "action_restriction",
        value: "artifact_execution_prohibited",
        evidence: executionProhibition.evidence,
        confidence: executionProhibition.confidence,
        category: "constraint",
        domain: "builder",
        role: "restriction",
        explicit: true,
        authorized: false,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          prohibitedOperations,
          deferredExecution
        }
      });
    }

    if (analysisOnly) {
      add({
        type: "action_restriction",
        value: "analysis_only",
        evidence: executionProhibition.evidence || "analysis only",
        confidence: executionProhibition.present ? 0.96 : 0.88,
        category: "constraint",
        domain: "conversation",
        role: "restriction",
        explicit: true,
        authorized: false,
        metadata: {
          executionAllowed: false
        }
      });
    }

    return {
      executionAllowed: !executionProhibition.present,
      analysisOnly,
      deferredExecution,
      explicitExecutionProhibition: executionProhibition.present,
      prohibitionEvidence: executionProhibition.evidence,
      prohibitedOperations,
      authority: "explicit_user_action_authorization_evidence_only"
    };
  },

  detectExecutionProhibition(text = "") {
    const patterns = [
      /\b(?:do not|don't|dont)\s+(?:write|rewrite|modify|change|edit|patch|implement|code|generate|create|replace|remove|delete|add|wire|update|send)\b/,
      /\b(?:do not|don't|dont)\s+(?:make|apply)\s+(?:any\s+)?changes?\b/,
      /\b(?:no code|without code|analysis only|discussion only)\b/,
      /\b(?:not asking you to|i am not asking you to|i'm not asking you to|im not asking you to)\s+(?:write|rewrite|modify|change|edit|patch|implement|code|generate|create|replace|remove|delete|add|wire|update|send)\b/,
      /\b(?:i do not want|i don't want|i dont want)\s+(?:you\s+to\s+)?(?:write|rewrite|modify|change|edit|patch|implement|code|generate|create|replace|remove|delete|add|wire|update|send)\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[0]) {
        return {
          present: true,
          evidence: match[0],
          confidence: 0.97
        };
      }
    }

    return {
      present: false,
      evidence: null,
      confidence: 0
    };
  },

  /* =====================================================
     EXPLICIT REQUEST DETECTION
  ===================================================== */

  detectExplicitRequests(text = "", actionPolicy = {}, add = () => {}) {
    this.runRequestTable(text, actionPolicy, add, this.requestPatterns);
  },

  requestPatterns: [
    {
      purpose: "implementation",
      operation: "build_or_modify",
      requestedOutput: "artifact_or_code",
      confidence: 0.93,
      domain: "builder",
      patterns: [
        /\b(?:send|give me|write|rewrite|generate|create|build|implement|patch|replace|update|modify|edit|fix)\s+(?:the\s+|this\s+|that\s+|my\s+)?(?:entire\s+|full\s+|whole\s+)?(?:code|file|script|function|engine|component|implementation)\b/,
        /\b(?:send me|give me)\s+(?:the\s+)?(?:entire|full|updated|replacement)\s+(?:file|code|script)\b/,
        /\b(?:make|apply)\s+(?:the\s+|these\s+)?changes?\b/,
        /\b(?:wire|connect)\s+(?:this|it|the engine|the file|the component)\b/
      ],
      executionOperation: true
    },

    {
      purpose: "verification",
      operation: "verify_or_review",
      requestedOutput: "verification_result",
      confidence: 0.91,
      domain: "conversation",
      patterns: [
        /\b(?:verify|double check|confirm|review|inspect|look over|look through|check)\s+(?:this|that|it|the code|the file|the engine|the pipeline)\b/,
        /\b(?:is this|is that|does this|does that)\s+(?:correct|right|valid|working|supposed to)\b/,
        /\b(?:are you sure|does this look right)\b/
      ]
    },

    {
      purpose: "decision",
      operation: "decide_or_recommend",
      requestedOutput: "recommendation",
      confidence: 0.91,
      domain: "decision",
      patterns: [
        /\b(?:what should i do|what should we do|help me decide|which should i choose|which one should i choose)\b/,
        /\b(?:what do you recommend|what would you recommend|recommend which|recommend one)\b/,
        /\b(?:what should i focus on|what should we focus on|what should come first|which comes first|what deserves my attention)\b/,
        /\b(?:which option|which one is better|what is the best option|what is the best move)\b/
      ]
    },

    {
      purpose: "comparison",
      operation: "compare",
      requestedOutput: "comparison",
      confidence: 0.89,
      domain: "decision",
      patterns: [
        /\b(?:compare|difference between|differences between|versus|vs\.?|pros and cons|advantages and disadvantages)\b/,
        /\b(?:which is better|how are they different|what makes them different)\b/
      ]
    },

    {
      purpose: "planning",
      operation: "plan",
      requestedOutput: "action_plan",
      confidence: 0.89,
      domain: "planning",
      patterns: [
        /\b(?:make|create|build|give me)\s+(?:a\s+)?(?:plan|roadmap|schedule|routine)\b/,
        /\b(?:what are the next steps|what should the next steps be|walk me through the steps)\b/,
        /\b(?:how should i approach|how should we approach|how can i organize|how can we organize)\b/
      ]
    },

    {
      purpose: "instruction",
      operation: "instruct",
      requestedOutput: "instructions",
      confidence: 0.88,
      domain: "conversation",
      patterns: [
        /\b(?:how do i|how can i|how should i|show me how to|walk me through how to|what steps do i take)\b/,
        /\bhow to\b/
      ]
    },

    {
      purpose: "teaching",
      operation: "explain",
      requestedOutput: "explanation",
      confidence: 0.89,
      domain: "knowledge",
      patterns: [
        /\b(?:explain|teach me|help me understand|break this down|break it down)\b/,
        /\b(?:why does|why do|why did|how does|how do|how did|how come)\b/,
        /\b(?:what does this mean|what does that mean|what is the difference)\b/
      ]
    },

    {
      purpose: "factual",
      operation: "retrieve_fact",
      requestedOutput: "direct_answer",
      confidence: 0.9,
      domain: "knowledge",
      patterns: [
        /\b(?:what is|what are|who is|who was|when did|when is|where is|where was|how many|how much)\b/
      ]
    },

    {
      purpose: "clarification",
      operation: "clarify",
      requestedOutput: "clarification",
      confidence: 0.9,
      domain: "conversation",
      patterns: [
        /\b(?:what do you mean|what are you saying|can you clarify|where exactly|i don't understand|i dont understand)\b/,
        /\b(?:explain what you mean|clarify what you mean)\b/
      ]
    },

    {
      purpose: "recall",
      operation: "recall",
      requestedOutput: "remembered_context",
      confidence: 0.92,
      domain: "memory",
      patterns: [
        /\b(?:do you remember|what did i say|what did we say|what did we decide|what do you remember|what do you know about me)\b/,
        /\b(?:last time we|previously we|remember when)\b/
      ]
    },

    {
      purpose: "creation",
      operation: "create",
      requestedOutput: "generated_content",
      confidence: 0.9,
      domain: "creation",
      patterns: [
        /\b(?:write me|draft me|make me|create me|design me|generate me)\b/,
        /\b(?:write|draft|compose|create|design|generate)\s+(?:an?|the|this|that|my)\s+(?:email|message|reply|caption|invitation|essay|paragraph|story|image|graphic|document|presentation)\b/
      ],
      executionOperation: true
    },

    {
      purpose: "opinion",
      operation: "give_opinion",
      requestedOutput: "opinion",
      confidence: 0.87,
      domain: "conversation",
      patterns: [
        /\b(?:what do you think|what is your opinion|your opinion|do you agree|how do you feel about)\b/
      ]
    },

    {
      purpose: "meaning",
      operation: "interpret_meaning",
      requestedOutput: "meaning",
      confidence: 0.9,
      domain: "meaning",
      patterns: [
        /\b(?:what is this really about|what does this mean for me|what is the lesson|what am i supposed to learn)\b/,
        /\b(?:what is life trying to teach me|what is this season teaching me|what does this chapter mean)\b/,
        /\b(?:what is the deeper meaning|what is underneath all of this)\b/
      ]
    },

    {
      purpose: "insight",
      operation: "surface_pattern_or_blind_spot",
      requestedOutput: "insight",
      confidence: 0.9,
      domain: "meaning",
      patterns: [
        /\b(?:what pattern do you see|what am i avoiding|what am i not seeing|what is my blind spot)\b/,
        /\b(?:what is really going on|what am i sacrificing|what tradeoff am i making|what is this costing me)\b/,
        /\b(?:what am i refusing to see|what am i not ready to admit|what am i pretending not to know)\b/
      ]
    },

    {
      purpose: "emotional_support",
      operation: "provide_emotional_support",
      requestedOutput: "supportive_response",
      confidence: 0.93,
      domain: "emotion",
      patterns: [
        /\b(?:i need someone to listen|i just need someone to listen|listen to me|can i vent|let me vent|i need to vent)\b/,
        /\b(?:be here with me|stay with me|i need support|i need comfort|help me feel better)\b/,
        /\b(?:i need someone to talk to|can we talk|i just want to talk)\b/
      ]
    }
  ],

  runRequestTable(text = "", actionPolicy = {}, add = () => {}, patterns = []) {
    patterns.forEach(config => {
      const matches = [];

      (config.patterns || []).forEach(pattern => {
        const match = text.match(pattern);
        if (match?.[0]) matches.push(match[0]);
      });

      if (!matches.length) return;

      const blockedByPolicy = config.executionOperation === true && actionPolicy.executionAllowed === false;

      add({
        type: "question_purpose",
        value: config.purpose,
        evidence: matches,
        confidence: blockedByPolicy ? Math.min(config.confidence, 0.72) : config.confidence,
        category: "request",
        domain: config.domain || "conversation",
        operation: config.operation,
        requestedOutput: config.requestedOutput,
        role: "purpose_candidate",
        explicit: true,
        authorized: !blockedByPolicy,
        inferenceLevel: "observed",
        evidenceClass: "direct_text",
        metadata: {
          detectionMethod: "explicit_request_pattern",
          executionOperation: config.executionOperation === true,
          blockedByActionPolicy: blockedByPolicy
        }
      });
    });
  },

  /* =====================================================
     REFERENCE / FOLLOW-UP CONTEXT
  ===================================================== */

  readReferenceContext({ text = "", observations = [], summary = {}, add = () => {} } = {}) {
    const referenceObservations = observations.filter(observation =>
      ["reference_signal", "reference_expression", "missing_anchor_signal"].includes(this.normalizeToken(observation?.type)) ||
      this.normalizeToken(observation?.category) === "continuity"
    );

    const unresolvedReferenceObservations = referenceObservations.filter(observation =>
      this.normalizeToken(observation?.type) === "missing_anchor_signal" ||
      observation?.metadata?.resolutionStatus === "unresolved" ||
      observation?.metadata?.requiresPriorContext === true
    );

    const resolvedReferenceObservations = referenceObservations.filter(observation =>
      observation?.metadata?.resolutionStatus === "resolved" ||
      observation?.metadata?.resolved === true
    );

    const explicitPriorContextLanguage = /\b(?:earlier|previously|last time|before|again|based on that|given that|the one you mentioned|what you said)\b/.test(text);
    const bareFollowUp = /^(?:why|how|how so|what about|what if|then what|really|and then)\??$/.test(text);
    const threadAvailable = Boolean(
      summary.threadStateLoaded ||
      summary.threadState ||
      summary.threadUnderstanding ||
      (Array.isArray(summary.recentMessages) && summary.recentMessages.length)
    );

    const requiresPriorContext = unresolvedReferenceObservations.length > 0 || explicitPriorContextLanguage || bareFollowUp;
    const referencePresent = referenceObservations.length > 0 || explicitPriorContextLanguage || bareFollowUp;

    if (explicitPriorContextLanguage) {
      add({
        type: "continuity_request_evidence",
        value: "explicit_prior_context_reference",
        evidence: text.match(/\b(?:earlier|previously|last time|before|again|based on that|given that|the one you mentioned|what you said)\b/)?.[0] || "prior context reference",
        confidence: 0.88,
        category: "continuity",
        domain: "continuity",
        operation: "resolve_from_prior_context",
        requestedOutput: "follow_up_answer",
        role: "request_form",
        explicit: true,
        authorized: true,
        metadata: {
          requiresPriorContext: true
        }
      });
    }

    if (bareFollowUp) {
      add({
        type: "continuity_request_evidence",
        value: "bare_follow_up",
        evidence: text,
        confidence: 0.9,
        category: "continuity",
        domain: "continuity",
        operation: "resolve_from_prior_context",
        requestedOutput: "follow_up_answer",
        role: "request_form",
        explicit: true,
        authorized: true,
        metadata: {
          requiresPriorContext: true
        }
      });
    }

    return {
      referencePresent,
      referenceCount: referenceObservations.length,
      unresolvedReferenceCount: unresolvedReferenceObservations.length,
      resolvedReferenceCount: resolvedReferenceObservations.length,
      explicitPriorContextLanguage,
      bareFollowUp,
      requiresPriorContext,
      threadAvailable,
      shouldUsePriorContext: requiresPriorContext && threadAvailable,
      shouldClarifyReference: unresolvedReferenceObservations.length > 0 && !threadAvailable,
      authority: "reference_context_evidence_only"
    };
  },

  /* =====================================================
     QUESTION FORM
  ===================================================== */

  detectQuestionForm(text = "", referenceContext = {}, add = () => {}) {
    if (!text) return;

    if (text.includes("?")) {
      add({
        type: "question_form",
        value: "explicit_question",
        evidence: "?",
        confidence: 0.96,
        category: "communication",
        domain: "conversation",
        role: "request_form",
        explicit: true
      });
    }

    const opening = text.match(/^(why|how|what|who|where|when|which|can|could|should|would|do|does|did|is|are|am|will|was|were|has|have|had)\b/);

    if (opening) {
      add({
        type: "question_form",
        value: "interrogative_opening",
        evidence: opening[0],
        confidence: 0.9,
        category: "communication",
        domain: "conversation",
        role: "request_form",
        explicit: true
      });
    }

    if (referenceContext.bareFollowUp) {
      add({
        type: "question_form",
        value: "context_dependent_follow_up",
        evidence: text,
        confidence: 0.91,
        category: "continuity",
        domain: "continuity",
        operation: "resolve_from_prior_context",
        requestedOutput: "follow_up_answer",
        role: "request_form",
        explicit: true,
        authorized: true,
        metadata: {
          referenceDependent: true
        }
      });
    }
  },

  /* =====================================================
     RESPONSE PREFERENCES
  ===================================================== */

  detectResponsePreferences(text = "", add = () => {}) {
    const preferences = [
      {
        value: "concise",
        requestedOutput: "concise",
        confidence: 0.9,
        pattern: /\b(?:just answer|straight answer|quick answer|briefly|keep it short|short answer|be concise)\b/
      },
      {
        value: "detailed",
        requestedOutput: "detailed",
        confidence: 0.9,
        pattern: /\b(?:explain fully|detailed answer|go deep|break it down|step by step|full explanation)\b/
      },
      {
        value: "blunt",
        requestedOutput: "blunt",
        confidence: 0.9,
        pattern: /\b(?:be honest|be blunt|don't sugarcoat|do not sugarcoat|tell me the truth|real answer)\b/
      }
    ];

    preferences.forEach(preference => {
      const match = text.match(preference.pattern);
      if (!match) return;

      add({
        type: "response_preference",
        value: preference.value,
        evidence: match[0],
        confidence: preference.confidence,
        category: "request",
        domain: "conversation",
        requestedOutput: preference.requestedOutput,
        role: "response_preference",
        explicit: true,
        authorized: true
      });
    });
  },

  /* =====================================================
     CONTEXTUAL TOPIC DETECTION
  ===================================================== */

  detectContextualTopics(text = "", observations = [], add = () => {}) {
    const topics = [
      {
        value: "builder_topic",
        domain: "builder",
        pattern: /\b(?:code|javascript|html|css|api|github|repo|repository|pipeline|engine|function|file|script|bug|observer|classifier|semantic frame|frame builder|architecture)\b/
      },
      {
        value: "medical_topic",
        domain: "medical",
        pattern: /\b(?:pain|symptom|pregnant|pregnancy|doctor|hospital|medication|diagnosis|surgery|bleeding|fever|stroke|seizure|breathing)\b/
      },
      {
        value: "relationship_topic",
        domain: "relationship",
        pattern: /\b(?:wife|husband|spouse|partner|girlfriend|boyfriend|relationship|marriage|friend|coworker)\b/
      },
      {
        value: "financial_topic",
        domain: "finance",
        pattern: /\b(?:money|debt|loan|credit|rent|salary|budget|afford|payment|bills)\b/
      },
      {
        value: "career_topic",
        domain: "career",
        pattern: /\b(?:job|career|school|college|degree|resume|interview|promotion|military|navy|marine)\b/
      }
    ];

    topics.forEach(topic => {
      const match = text.match(topic.pattern);
      if (!match) return;

      add({
        type: "question_context",
        value: topic.value,
        evidence: match[0],
        confidence: 0.74,
        category: "domain",
        domain: topic.domain,
        role: "context_modifier",
        explicit: true,
        authorized: null,
        metadata: {
          topicOnly: true,
          doesNotAuthorizeAction: true
        }
      });
    });

    const observedDomains = [...new Set(
      observations
        .map(observation => this.normalizeToken(observation?.domain))
        .filter(domain => domain && !["general", "conversation"].includes(domain))
    )];

    observedDomains.forEach(domain => {
      add({
        type: "question_context",
        value: `${domain}_observed_context`,
        evidence: `observer_domain:${domain}`,
        confidence: 0.68,
        category: "domain",
        domain,
        role: "context_modifier",
        explicit: false,
        authorized: null,
        inferenceLevel: "inferred",
        evidenceClass: "system_observation",
        metadata: {
          topicOnly: true,
          derivedFromObserver: true,
          doesNotAuthorizeAction: true
        }
      });
    });
  },

  /* =====================================================
     EMOTIONAL CONTEXT
  ===================================================== */

  detectEmotionalContext(text = "", add = () => {}) {
    const directDisclosure = text.match(
      /\b(?:i am|i'm|im|i feel|i'm feeling|im feeling|i felt|i was feeling)\s+(?:really|very|so|pretty|extremely|kind of|kinda|a little|just)?\s*(sad|upset|hurt|angry|mad|worried|scared|afraid|anxious|stressed|overwhelmed|lonely|depressed|burned out|burnt out|exhausted|tired|frustrated|confused)\b/
    );

    const emotionWord = text.match(
      /\b(?:sad|upset|hurt|angry|mad|worried|scared|afraid|anxious|stressed|overwhelmed|lonely|depressed|burned out|burnt out|exhausted|tired|frustrated|confused|guilty|ashamed)\b/
    );

    if (directDisclosure || emotionWord) {
      add({
        type: "emotional_context_signal",
        value: directDisclosure ? "direct_emotional_disclosure" : "emotion_language_present",
        evidence: directDisclosure?.[0] || emotionWord?.[0],
        confidence: directDisclosure ? 0.86 : 0.72,
        category: "emotion",
        domain: "emotion",
        role: "context_modifier",
        explicit: true,
        authorized: null,
        metadata: {
          emotionalSupportRequested: false,
          shouldNotReplacePrimaryRequest: true
        }
      });
    }
  },

  /* =====================================================
     COMPOSITE RELATIONSHIPS
  ===================================================== */

  detectCompositeRelationships(signals = [], add = () => {}) {
    const purposeValues = new Set(
      signals
        .filter(signal => signal.role === "purpose_candidate")
        .map(signal => signal.value)
    );

    const contextValues = new Set(
      signals
        .filter(signal => signal.role === "context_modifier")
        .map(signal => signal.value)
    );

    const addRelationship = ({
      value,
      evidence,
      confidence,
      operation,
      requestedOutput,
      domain = "conversation"
    }) => {
      add({
        type: "question_purpose_relationship",
        value,
        evidence,
        confidence,
        category: "relationship",
        domain,
        operation,
        requestedOutput,
        role: "purpose_relationship",
        explicit: false,
        authorized: null,
        inferenceLevel: "inferred",
        evidenceClass: "system_inference",
        metadata: {
          cannotBecomePrimaryPurpose: true,
          cannotAuthorizeAction: true
        }
      });
    };

    if (purposeValues.has("decision") && purposeValues.has("comparison")) {
      addRelationship({
        value: "comparison_supports_decision",
        evidence: "decision + comparison candidates",
        confidence: 0.82,
        operation: "compare_and_recommend",
        requestedOutput: "decision_support",
        domain: "decision"
      });
    }

    if (purposeValues.has("factual") && purposeValues.has("teaching")) {
      addRelationship({
        value: "fact_with_explanation",
        evidence: "factual + teaching candidates",
        confidence: 0.8,
        operation: "retrieve_and_explain",
        requestedOutput: "direct_answer_with_explanation",
        domain: "knowledge"
      });
    }

    if (purposeValues.has("verification") && contextValues.has("builder_topic")) {
      addRelationship({
        value: "artifact_topic_requires_validation",
        evidence: "verification request + builder topic",
        confidence: 0.84,
        operation: "validate_artifact",
        requestedOutput: "validation_result",
        domain: "builder"
      });
    }

    if (purposeValues.has("planning") && contextValues.has("builder_topic")) {
      addRelationship({
        value: "builder_topic_requires_plan",
        evidence: "planning request + builder topic",
        confidence: 0.8,
        operation: "plan_builder_work",
        requestedOutput: "implementation_plan",
        domain: "builder"
      });
    }

    if (
      purposeValues.has("decision") &&
      signals.some(signal => signal.type === "emotional_context_signal")
    ) {
      addRelationship({
        value: "emotion_context_modifies_decision",
        evidence: "decision request + emotional context",
        confidence: 0.76,
        operation: "support_decision_with_emotional_context",
        requestedOutput: "grounded_recommendation",
        domain: "emotion"
      });
    }
  },

  /* =====================================================
     RANKING
  ===================================================== */

  rolePriority: {
    purpose_candidate: 100,
    restriction: 95,
    request_form: 70,
    response_preference: 65,
    purpose_relationship: 45,
    context_modifier: 30
  },

  purposeSpecificity: {
    implementation: 0.98,
    verification: 0.95,
    recall: 0.95,
    decision: 0.93,
    comparison: 0.9,
    planning: 0.9,
    instruction: 0.89,
    creation: 0.9,
    clarification: 0.9,
    factual: 0.87,
    teaching: 0.86,
    meaning: 0.88,
    insight: 0.88,
    emotional_support: 0.92,
    opinion: 0.82,
    understanding: 0.5
  },

  rankSignals(signals = [], actionPolicy = {}) {
    return signals
      .map(signal => {
        const roleBase = this.rolePriority[signal.role] || 40;
        const specificity = this.purposeSpecificity[signal.value] ?? 0.65;
        const explicitBonus = signal.explicit === true ? 12 : 0;
        const evidenceBonus = Math.min(8, Math.max(0, Number(signal.matchCount || 1) - 1) * 2);
        const inferredPenalty = signal.inferenceLevel === "inferred" ? 7 : 0;
        const contextPenalty = signal.role === "context_modifier" ? 18 : 0;
        const relationshipPenalty = signal.role === "purpose_relationship" ? 20 : 0;
        const unauthorizedPenalty = signal.authorized === false ? 25 : 0;

        let score = Math.round(
          roleBase * 0.35 +
          signal.confidence * 100 * 0.35 +
          specificity * 100 * 0.18 +
          explicitBonus +
          evidenceBonus -
          inferredPenalty -
          contextPenalty -
          relationshipPenalty -
          unauthorizedPenalty
        );

        if (
          actionPolicy.executionAllowed === false &&
          ["implementation", "creation"].includes(signal.value) &&
          signal.role === "purpose_candidate"
        ) {
          score -= 18;
        }

        score = Math.max(0, Math.min(100, score));

        return {
          ...signal,
          score,
          scoreBreakdown: {
            roleBase,
            confidence: signal.confidence,
            specificity,
            explicitBonus,
            evidenceBonus,
            inferredPenalty,
            contextPenalty,
            relationshipPenalty,
            unauthorizedPenalty
          }
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.role !== b.role) return (this.rolePriority[b.role] || 0) - (this.rolePriority[a.role] || 0);
        return b.confidence - a.confidence;
      });
  },

  collectRequestedOperations(purposeCandidates = [], actionPolicy = {}) {
    return [
      ...new Set(
        purposeCandidates
          .filter(signal => signal.operation)
          .filter(signal => signal.authorized !== false)
          .filter(signal => !this.operationBlocked(signal.operation, actionPolicy.prohibitedOperations))
          .map(signal => signal.operation)
      )
    ];
  },

  collectRequestedOutputs(purposeCandidates = [], actionPolicy = {}) {
    return [
      ...new Set(
        purposeCandidates
          .filter(signal => signal.requestedOutput)
          .filter(signal => signal.authorized !== false)
          .map(signal => signal.requestedOutput)
      )
    ];
  },

  operationBlocked(operation = "", prohibitedOperations = []) {
    const normalizedOperation = this.normalizeToken(operation);

    return (prohibitedOperations || []).some(prohibited => {
      const normalizedProhibited = this.normalizeToken(prohibited);

      return (
        normalizedOperation === normalizedProhibited ||
        normalizedOperation.includes(normalizedProhibited) ||
        normalizedProhibited.includes(normalizedOperation) ||
        (
          /build|modify|implement|write|create|patch|edit|replace/.test(normalizedOperation) &&
          /build|modify|implement|write|create|patch|edit|replace/.test(normalizedProhibited)
        )
      );
    });
  },

  findCompetingPurposes(signals = []) {
    const top = signals.slice(0, 5);

    return top
      .flatMap((signal, index) =>
        top.slice(index + 1).map(other => ({
          first: signal.value,
          second: other.value,
          scoreDifference: Math.abs(signal.score - other.score),
          closeCompetition: Math.abs(signal.score - other.score) <= 7,
          bothExplicit: signal.explicit === true && other.explicit === true
        }))
      )
      .filter(pair => pair.closeCompetition);
  },

  /* =====================================================
     RESPONSE HINTS
  ===================================================== */

  buildResponseHints({
    purposeCandidates = [],
    contextualSignals = [],
    preferenceSignals = [],
    actionPolicy = {},
    referenceContext = {}
  } = {}) {
    const values = new Set(purposeCandidates.map(signal => signal.value));
    const preferences = new Set(preferenceSignals.map(signal => signal.value));
    const contexts = new Set(contextualSignals.map(signal => signal.value));

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
        values.has("planning") ||
        values.has("instruction"),

      provideRecommendation:
        values.has("decision"),

      compareOptions:
        values.has("comparison"),

      provideArtifact:
        actionPolicy.executionAllowed === true &&
        (
          values.has("implementation") ||
          values.has("creation")
        ),

      doNotProvideArtifact:
        actionPolicy.executionAllowed === false,

      analysisOnly:
        actionPolicy.analysisOnly === true,

      useEmotionalAttunement:
        contextualSignals.some(signal => signal.type === "emotional_context_signal") ||
        values.has("emotional_support"),

      emotionalSupportPrimary:
        values.has("emotional_support"),

      usePriorContext:
        referenceContext.shouldUsePriorContext === true ||
        values.has("recall"),

      clarifyReference:
        referenceContext.shouldClarifyReference === true,

      concise:
        preferences.has("concise"),

      detailed:
        preferences.has("detailed"),

      blunt:
        preferences.has("blunt"),

      builderTopicPresent:
        contexts.has("builder_topic"),

      builderTopicDoesNotAuthorizeCode:
        contexts.has("builder_topic") &&
        !values.has("implementation") &&
        !values.has("creation"),

      advisoryOnly: true
    };
  },

  /* =====================================================
     LEDGER HANDOFF
  ===================================================== */

  toLedgerObservation(signal = {}, rawText = "") {
    const evidenceRecords = (signal.evidence || []).map(item => this.createEvidenceRecord(rawText, item));

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

      evidence: evidenceRecords,

      source: "ari-question-understanding",
      sourceVersion: this.version,
      sourceStage: "perception",

      metadata: {
        role: signal.role,
        explicit: signal.explicit === true,
        authorized: signal.authorized,
        score: signal.score ?? null,
        matchCount: signal.matchCount || 1,
        advisoryOnly: true,
        ...(signal.metadata || {})
      }
    };
  },

  createEvidenceRecord(rawText = "", evidence = "") {
    const evidenceText = String(evidence || "").trim();
    const raw = String(rawText || "");
    const start = evidenceText ? raw.toLowerCase().indexOf(evidenceText.toLowerCase()) : -1;

    return {
      text: evidenceText,
      sourceField: "userMessage",
      start: start >= 0 ? start : null,
      end: start >= 0 ? start + evidenceText.length : null
    };
  },

  /* =====================================================
     DEFAULT
  ===================================================== */

  defaultSignal() {
    return {
      type: "question_purpose",
      value: "understanding",
      category: "request",
      domain: "conversation",
      operation: null,
      requestedOutput: null,
      confidence: 0.35,
      evidenceClass: "hypothesis",
      inferenceLevel: "hypothesized",
      role: "purpose_candidate",
      explicit: false,
      authorized: null,
      evidence: [],
      matchCount: 0,
      score: 35,
      metadata: {
        fallback: true,
        noExplicitOperationObserved: true
      }
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  normalizeConfidence(value = 0.5) {
    const number = Number(value);

    if (!Number.isFinite(number)) return 0.5;
    if (number > 1) return Math.max(0, Math.min(1, number / 100));

    return Math.max(0, Math.min(1, number));
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
      .replace(/[^\w\s'?.,!:%/.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI QUESTION UNDERSTANDING LOADED:",
  window.Ari.questionUnderstanding?.version
);