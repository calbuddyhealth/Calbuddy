// ari/reasoning/ari-reasoning-context-engine.js
// Ari Reasoning Context Engine
//
// Purpose:
// Select, trim, and package the canonical Ari reasoning request into one
// lean cognitive context packet for the OpenAI reasoning invocation.
//
// V2.0.1 — Canonical Preference Context Alignment
//
// Architectural flow:
//
// Ari Reasoning Engine
//      ↓
// Complete Canonical Reasoning Request
//      ↓
// Ari Reasoning Context Engine
//      ↓
// Lean Cognitive Context Packet
//      ↓
// Ari OpenAI Reasoning Client
//
// Responsibilities:
// - Accept one complete canonical reasoning request.
// - Preserve the effective current-turn request.
// - Preserve binding safety, authority, operation, and output contracts.
// - Select context according to canonical routing and continuity signals.
// - Trim oversized conversation, memory, evidence, knowledge, and developer data.
// - Remove empty values and duplicated packet aliases.
// - Produce prompt-size and context-selection diagnostics.
// - Return one canonical cognitive packet.
//
// Non-responsibilities:
// - Does not build the canonical reasoning request.
// - Does not reconstruct semantic meaning.
// - Does not resolve references or conversation continuity.
// - Does not retrieve memory or knowledge.
// - Does not resolve communication preferences.
// - Does not call OpenAI.
// - Does not build provider-specific prompts.
// - Does not validate model output.
// - Does not execute actions.
// - Does not persist state.
// - Does not authorize delivery.

window.Ari = window.Ari || {};

window.AriReasoningContextEngine = {
  version: "2.1.0",

  schemaVersion: "2.1.0",

  source: "ari-reasoning-context-engine",

  packetSchema: "ari_cognitive_context_packet",

  supportedModes: [
    "fast",
    "standard",
    "deep",
    "developer"
  ],

  defaultLimits: {
    fast: {
      conversationTurns: 4,
      memoryItems: 8,
      evidenceItems: 12,
      evidenceSources: 8,
      knowledgeItems: 10,
      knowledgeCitations: 10,
      developerFiles: 6
    },

    standard: {
      conversationTurns: 7,
      memoryItems: 14,
      evidenceItems: 24,
      evidenceSources: 14,
      knowledgeItems: 18,
      knowledgeCitations: 16,
      developerFiles: 10
    },

    deep: {
      conversationTurns: 10,
      memoryItems: 20,
      evidenceItems: 36,
      evidenceSources: 20,
      knowledgeItems: 26,
      knowledgeCitations: 20,
      developerFiles: 12
    },

    developer: {
      conversationTurns: 8,
      memoryItems: 12,
      evidenceItems: 24,
      evidenceSources: 16,
      knowledgeItems: 20,
      knowledgeCitations: 16,
      developerFiles: 16
    }
  },

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const startedAt = this.now();

    try {
      const canonicalRequest =
        this.readCanonicalRequest(input);

      if (!this.hasKeys(canonicalRequest)) {
        return this.buildFailure({
          startedAt,
          error: "canonical_reasoning_request_missing"
        });
      }

      const currentTurn =
        this.selectCurrentTurn(canonicalRequest);

      if (!currentTurn.effective) {
        return this.buildFailure({
          startedAt,
          error: "effective_user_request_missing"
        });
      }

      const mode =
        this.resolveMode(canonicalRequest);

      const requirements =
        this.resolveContextRequirements({
          request: canonicalRequest,
          mode
        });

      const limits =
        this.resolveLimits({
          request: canonicalRequest,
          mode
        });

      const cognitivePacket =
        this.removeEmptyValues({
          schema: this.packetSchema,

          schemaVersion:
            this.schemaVersion,

          source:
            this.source,

          mode,

          request:
            currentTurn,

          semanticContext:
            this.selectSemanticContext(
              canonicalRequest
            ),

          routing:
            this.selectRoutingContext(
              canonicalRequest
            ),

          safety:
            this.selectSafetyContext(
              canonicalRequest
            ),

          continuity:
            requirements.continuity
              ? this.selectContinuityContext(
                  canonicalRequest,
                  limits
                )
              : {},

          situation:
            requirements.situation
              ? this.selectSituationContext(
                  canonicalRequest
                )
              : {},

          memory:
            requirements.memory
              ? this.selectMemoryContext(
                  canonicalRequest,
                  limits,
                  mode
                )
              : {},

          conversation:
            requirements.conversation
              ? this.selectConversationContext(
                  canonicalRequest,
                  limits
                )
              : {},

          evidence:
            requirements.evidence
              ? this.selectEvidenceContext(
                  canonicalRequest,
                  limits
                )
              : {},

          knowledge:
            requirements.knowledge
              ? this.selectKnowledgeContext(
                  canonicalRequest,
                  limits
                )
              : {},

          developerEvidence:
            requirements.developer
              ? this.selectDeveloperContext(
                  canonicalRequest,
                  limits
                )
              : {},

          preferenceContext:
  this.selectPreferenceContext(
    canonicalRequest
  ),

          responseControl:
            this.selectResponseControl(
              canonicalRequest
            ),

          authority:
            this.selectAuthorityContext(
              canonicalRequest
            ),

          outputContract:
            this.selectOutputContract(
              canonicalRequest
            ),

          operationContract:
            this.selectOperationContract(
              canonicalRequest
            ),

          instructions:
            this.selectInstructions(
              canonicalRequest
            )
        });

      const serialized =
        this.safeStringify(cognitivePacket);

      const diagnostics =
        this.buildDiagnostics({
          startedAt,
          request: canonicalRequest,
          packet: cognitivePacket,
          serialized,
          mode,
          requirements,
          limits
        });

      return {
        ready: true,

        success: true,

        complete: true,

        source:
          this.source,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        cognitivePacket,

        reasoningPacket:
          cognitivePacket,

        diagnostics
      };
    } catch (error) {
      console.error(
        "ARI REASONING CONTEXT ENGINE BUILD ERROR:",
        error
      );

      return this.buildFailure({
        startedAt,

        error:
          error?.message ||
          "reasoning_context_build_failed"
      });
    }
  },

  create(input = {}) {
    return this.build(input);
  },

  /* =====================================================
     CANONICAL REQUEST
  ===================================================== */

  readCanonicalRequest(input = {}) {
    if (
      this.isPlainObject(
        input.reasoningRequest
      )
    ) {
      return input.reasoningRequest;
    }

    if (
      this.isPlainObject(
        input.canonicalReasoningRequest
      )
    ) {
      return input.canonicalReasoningRequest;
    }

    if (
      this.isPlainObject(
        input.request
      )
    ) {
      return input.request;
    }

    if (
      this.isPlainObject(input)
    ) {
      return input;
    }

    return {};
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  selectCurrentTurn(request = {}) {
    const requestContext =
      this.firstObject([
        request.request,
        request.currentTurn
      ]);

    const effective =
      this.firstString([
        requestContext.effective,
        requestContext.effectiveText,
        request.effectiveUserMessage,
        request.resolvedUserQuestion,
        request.resolvedQuestion,
        request.question,
        requestContext.original,
        requestContext.originalText,
        request.originalUserMessage,
        request.rawQuestion,
        request.userMessage,
        request.message,
        request.input
      ]);

    const original =
      this.firstString([
        requestContext.original,
        requestContext.originalText,
        request.originalUserMessage,
        request.rawQuestion,
        request.userMessage,
        request.message,
        request.input,
        effective
      ]);

    return this.removeEmptyValues({
      original:
        original || effective,

      effective,

      turnId:
        this.firstString([
          requestContext.turnId,
          request.turnId,
          request.requestId
        ]),

      threadId:
        this.firstString([
          requestContext.threadId,
          request.threadId,
          request.conversationId
        ]),

      language:
        this.firstString([
          requestContext.language,
          request.language
        ]),

      currentTurnWasResolved:
        request.currentTurnWasResolved ===
          true ||
        requestContext
          .currentTurnWasResolved ===
          true ||
        (
          Boolean(original) &&
          Boolean(effective) &&
          original !== effective
        )
    });
  },

  /* =====================================================
     MODE
  ===================================================== */

  resolveMode(request = {}) {
    const explicitMode =
      this.firstString([
        request.reasoningMode,
        request.responseControl
          ?.reasoningMode,
        request.routing
          ?.reasoningMode,
        request.routingContract
          ?.reasoningMode,
        request.executivePacket
          ?.reasoningMode
      ]).toLowerCase();

    if (
      this.supportedModes.includes(
        explicitMode
      )
    ) {
      return explicitMode;
    }

    const routing =
      this.readRouting(request);

    const primaryLane =
      this.firstString([
        routing.primaryLane,
        routing.contextLane,
        routing.lane,
        request.responseControl
          ?.primaryLane,
        request.responseControl
          ?.contextLane
      ]).toLowerCase();

    const operation =
      this.firstString([
        routing.operation,
        request.semanticContext
          ?.operation,
        request.semanticFrame
          ?.operation,
        request.operationContract
          ?.operation
      ]).toLowerCase();

    const safety =
      this.readSafety(request);

    if (
      safety.stop === true ||
      safety.blocked === true ||
      safety.crisis === true ||
      safety.escalationRequired ===
        true ||
      [
        "critical",
        "severe",
        "high"
      ].includes(
        String(
          safety.riskLevel || ""
        ).toLowerCase()
      )
    ) {
      return "deep";
    }

    if (
      this.hasDeveloperContext(
        request
      ) ||
      [
        "developer",
        "developer_task",
        "code",
        "coding",
        "debug",
        "debugging",
        "project",
        "repository"
      ].some(
        value =>
          primaryLane.includes(value)
      )
    ) {
      return "developer";
    }

    if (
      [
        "analyze",
        "analysis",
        "evaluate",
        "compare",
        "plan",
        "planning",
        "investigate",
        "decision",
        "decision_support",
        "reason",
        "reasoning"
      ].some(
        value =>
          operation.includes(value)
      )
    ) {
      return "standard";
    }

    return "fast";
  },

  /* =====================================================
     CONTEXT REQUIREMENTS
  ===================================================== */

  resolveContextRequirements({
    request = {},
    mode = "fast"
  } = {}) {
    const routing =
      this.readRouting(request);

    const responseControl =
      this.normalizeObject(
        request.responseControl
      );

    const continuity =
      this.readContinuity(request);

    const operationContract =
      this.normalizeObject(
        request.operationContract
      );

    const explicit =
      this.firstObject([
        request.contextRequirements,
        responseControl
          .contextRequirements,
        routing.contextRequirements,
        operationContract
          .contextRequirements
      ]);

    const continuityRequired =
      explicit.continuity === true ||
      explicit.requiresContinuity ===
        true ||
      continuity.requiresPriorContext ===
        true ||
      continuity.referencePresent ===
        true ||
      continuity.referenceResolved ===
        true ||
      this.hasMeaningfulContinuity(
        continuity
      );

    const conversationRequired =
      explicit.conversation === true ||
      explicit.requiresConversation ===
        true ||
      continuityRequired ||
      responseControl
        .continuityRequired ===
        true ||
      responseControl
        .continuityRequirements !=
        null;

    const memoryRequired =
      explicit.memory === true ||
      explicit.requiresMemory === true ||
      routing.requiresMemory === true ||
      operationContract
        .requiresMemory === true ||
      continuityRequired ||
      this.hasMeaningfulMemory(
        request
      );

    const developerRequired =
      explicit.developer === true ||
      explicit.requiresDeveloperContext ===
        true ||
      mode === "developer" ||
      this.hasDeveloperContext(
        request
      );

    const evidenceRequired =
      explicit.evidence === true ||
      explicit.requiresEvidence ===
        true ||
      routing.requiresEvidence ===
        true ||
      operationContract
        .requiresEvidence === true ||
      this.hasMeaningfulEvidence(
        request
      );

    const knowledgeRequired =
      explicit.knowledge === true ||
      explicit.requiresKnowledge ===
        true ||
      routing.requiresKnowledge ===
        true ||
      operationContract
        .requiresKnowledge === true ||
      this.hasMeaningfulKnowledge(
        request
      );

    const situationRequired =
      explicit.situation === true ||
      explicit.requiresSituation ===
        true ||
      routing.requiresSituation ===
        true ||
      operationContract
        .requiresSituation === true ||
      mode === "standard" ||
      mode === "deep" ||
      this.hasMeaningfulSituation(
        request
      );

    return {
      continuity:
        continuityRequired,

      conversation:
        conversationRequired,

      memory:
        memoryRequired,

      situation:
        situationRequired,

      evidence:
        evidenceRequired,

      knowledge:
        knowledgeRequired,

      developer:
        developerRequired
    };
  },

  /* =====================================================
     LIMITS
  ===================================================== */

  resolveLimits({
    request = {},
    mode = "fast"
  } = {}) {
    const modeLimits =
      this.defaultLimits[mode] ||
      this.defaultLimits.fast;

    const suppliedLimits =
      this.firstObject([
        request.contextLimits,
        request.responseControl
          ?.contextLimits,
        request.operationContract
          ?.contextLimits
      ]);

    return {
      conversationTurns:
        this.resolvePositiveInteger(
          suppliedLimits
            .conversationTurns,
          modeLimits
            .conversationTurns
        ),

      memoryItems:
        this.resolvePositiveInteger(
          suppliedLimits.memoryItems,
          modeLimits.memoryItems
        ),

      evidenceItems:
        this.resolvePositiveInteger(
          suppliedLimits.evidenceItems,
          modeLimits.evidenceItems
        ),

      evidenceSources:
        this.resolvePositiveInteger(
          suppliedLimits
            .evidenceSources,
          modeLimits
            .evidenceSources
        ),

      knowledgeItems:
        this.resolvePositiveInteger(
          suppliedLimits.knowledgeItems,
          modeLimits.knowledgeItems
        ),

      knowledgeCitations:
        this.resolvePositiveInteger(
          suppliedLimits
            .knowledgeCitations,
          modeLimits
            .knowledgeCitations
        ),

      developerFiles:
        this.resolvePositiveInteger(
          suppliedLimits.developerFiles,
          modeLimits.developerFiles
        )
    };
  },

  /* =====================================================
     SEMANTIC CONTEXT
  ===================================================== */

  selectSemanticContext(request = {}) {
  /*
   * Merge semantic sources from least authoritative/rich to most
   * directly usable. Later values override earlier aliases, while
   * nested continuity and reference evidence are preserved.
   */
  const semanticStructure =
    this.normalizeObject(
      request.semanticStructure
    );

  const semanticFrame =
    this.normalizeObject(
      request.semanticFrame
    );

  const semanticContext =
    this.normalizeObject(
      request.semanticContext
    );

  const canonical = {
    ...semanticStructure,
    ...semanticFrame,
    ...semanticContext,

    participants:
      this.firstObject([
        semanticContext.participants,
        semanticFrame.participants,
        semanticStructure.participants
      ]),

    subject:
      semanticContext.subject ??
      semanticFrame.subject ??
      semanticStructure.subject ??
      null,

    subjects:
      this.firstNonEmptyArray([
        semanticContext.subjects,
        semanticFrame.subjects,
        semanticStructure.subjects
      ]),

    object:
      semanticContext.object ??
      semanticFrame.object ??
      semanticStructure.object ??
      null,

    target:
      semanticContext.target ??
      semanticFrame.target ??
      semanticStructure.target ??
      null,

    referent:
      this.firstObject([
        semanticContext.referent,
        semanticFrame.referent,
        semanticStructure.referent
      ]),

    continuity:
      this.mergeObjects([
        semanticStructure.continuity,
        semanticFrame.continuity,
        semanticContext.continuity,
        request.continuity,
        request.continuityContext,
        request.continuityResolution,
        request.deterministicContext
          ?.continuity
      ]),

    ambiguity:
      this.mergeObjects([
        semanticStructure.ambiguity,
        semanticFrame.ambiguity,
        semanticContext.ambiguity
      ]),

    references:
      this.firstNonEmptyArray([
        semanticContext.references,
        semanticFrame.references,
        semanticStructure.references,
        request.referenceResolution
          ?.decisions,
        request.referencePacket
          ?.references
      ]),

    resolvedReferences:
      this.firstNonEmptyArray([
        semanticContext.resolvedReferences,
        semanticFrame.resolvedReferences,
        semanticStructure.resolvedReferences,
        request.referenceResolution
          ?.resolvedReferences,
        request.referencePacket
          ?.resolvedReferences,
        request.continuity
          ?.resolvedReferences
      ]),

    unresolvedReferences:
      this.firstNonEmptyArray([
        semanticContext.unresolvedReferences,
        semanticFrame.unresolvedReferences,
        semanticStructure.unresolvedReferences,
        request.referenceResolution
          ?.unresolvedReferences,
        request.referencePacket
          ?.unresolvedReferences
      ]),

    inheritedNodes:
      this.firstNonEmptyArray([
        semanticContext.inheritedNodes,
        semanticFrame.inheritedNodes,
        semanticStructure.inheritedNodes,
        request.resolvedSemanticStructure
          ?.inheritedNodes
      ])
  };

  if (!this.hasKeys(canonical)) {
    return {};
  }

  return this.pickFields(
    canonical,
    [
      "schema",
      "schemaVersion",
      "frameId",
      "turnId",

      "operation",
      "requestType",
      "frameType",
      "interactionFamily",
      "intentFamily",
      "primaryIntent",
      "domain",
      "requestedOutput",

      "resolvedQuestion",
      "resolvedMeaning",
      "semanticSummary",
      "interpretation",
      "userGoal",
      "conversationFunction",

      "participants",
      "subject",
      "subjects",
      "object",
      "target",
      "referent",

      "entities",
      "events",
      "claims",
      "attributes",
      "quantities",
      "relations",

      "references",
      "resolvedReferences",
      "unresolvedReferences",
      "inheritedNodes",

      "options",
      "criteria",
      "constraints",
      "stakes",

      "continuity",
      "ambiguity",
      "execution",

      "confidence",
      "evidenceRefs",
      "grounding",
      "authority"
    ]
  );
},

  /* =====================================================
     ROUTING
  ===================================================== */

  readRouting(request = {}) {
    return this.firstObject([
      request.routing,
      request.routingContract,
      request.executivePacket
        ?.routing,
      request.executivePacket
        ?.routingContract
    ]);
  },

  selectRoutingContext(request = {}) {
    return this.pickFields(
      this.readRouting(request),
      [
        "mode",
        "operation",
        "primaryIntent",
        "domain",
        "contextLane",
        "primaryLane",
        "planner",
        "requiresReasoning",
        "requiresTools",
        "requiresClarification",
        "requiresMemory",
        "requiresKnowledge",
        "requiresEvidence",
        "requiresSituation"
      ]
    );
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  readSafety(request = {}) {
    return this.firstObject([
      request.safety,
      request.safetyContext,
      request.safetyDisposition,
      request.deterministicContext
        ?.safety
    ]);
  },

  selectSafetyContext(request = {}) {
    return this.pickFields(
      this.readSafety(request),
      [
        "ready",
        "safe",
        "blocked",
        "stop",
        "crisis",
        "riskLevel",
        "classification",
        "disposition",
        "requiredActions",
        "requiredBehaviors",
        "forbiddenBehaviors",
        "constraints",
        "warnings",
        "escalationRequired"
      ]
    );
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  readContinuity(request = {}) {
  const semanticContext =
    this.normalizeObject(
      request.semanticContext
    );

  const semanticFrame =
    this.normalizeObject(
      request.semanticFrame
    );

  const semanticStructure =
    this.normalizeObject(
      request.semanticStructure
    );

  const referenceResolution =
    this.normalizeObject(
      request.referenceResolution
    );

  const referencePacket =
    this.normalizeObject(
      request.referencePacket
    );

  const detectedReferences =
    referencePacket.referencesDetected === true ||
    Number(
      referencePacket.referenceCount || 0
    ) > 0 ||
    this.nonEmptyArray(
      referencePacket.references
    ) ||
    this.nonEmptyArray(
      referenceResolution.decisions
    );

  const detectedResolvedReferences =
    Number(
      referencePacket.resolvedCount || 0
    ) > 0 ||
    this.nonEmptyArray(
      referencePacket.resolvedReferences
    ) ||
    this.nonEmptyArray(
      referenceResolution.resolvedReferences
    );

  const derivedContinuity = {};

  /*
   * Only contribute positive derived evidence.
   * Never overwrite authoritative true values with synthetic false values.
   */
  if (detectedReferences) {
    derivedContinuity.referencePresent =
      true;
  }

  if (detectedResolvedReferences) {
    derivedContinuity.referenceResolved =
      true;
  }

  const resolvedReferences =
    this.firstNonEmptyArray([
      request.continuity
        ?.resolvedReferences,

      request.continuityContext
        ?.resolvedReferences,

      request.continuityResolution
        ?.resolvedReferences,

      referencePacket
        .resolvedReferences,

      referenceResolution
        .resolvedReferences
    ]);

  if (resolvedReferences.length > 0) {
    derivedContinuity.resolvedReferences =
      resolvedReferences;
  }

  const unresolvedReferences =
    this.firstNonEmptyArray([
      request.continuity
        ?.unresolvedReferences,

      request.continuityContext
        ?.unresolvedReferences,

      request.continuityResolution
        ?.unresolvedReferences,

      referencePacket
        .unresolvedReferences,

      referenceResolution
        .unresolvedReferences
    ]);

  if (unresolvedReferences.length > 0) {
    derivedContinuity.unresolvedReferences =
      unresolvedReferences;
  }

  const references =
    this.firstNonEmptyArray([
      request.continuity
        ?.references,

      request.continuityContext
        ?.references,

      request.continuityResolution
        ?.references,

      referencePacket.references,

      referenceResolution.decisions
    ]);

  if (references.length > 0) {
    derivedContinuity.references =
      references;
  }

  const merged =
    this.mergeObjects([
      semanticStructure.continuity,
      semanticFrame.continuity,
      semanticContext.continuity,

      request.deterministicContext
        ?.continuity,

      request.continuityResolution,
      request.continuityContext,
      request.continuity,

      derivedContinuity
    ]);

  return this.removeEmptyValues(
    merged
  );
},

  selectContinuityContext(
  request = {},
  limits = {}
) {
  const continuity =
    this.readContinuity(request);

  return this.removeEmptyValues({
    ...this.pickFields(
      continuity,
      [
        "ready",
        "requiresPriorContext",
        "isContinuation",

        "referencePresent",
        "referenceType",
        "referenceSurface",
        "referenceResolved",
        "resolvedReferenceValue",
        "resolutionSource",

        "missingAnchor",
        "unresolvedReference",

        "sourceTurnId",
        "continuitySummary",
        "threadSummary",

        "clarificationRequired",
        "clarificationQuestion",

        "warnings",
        "errors"
      ]
    ),

    references:
      this.limitArray(
        continuity.references,
        limits.conversationTurns
      ),

    resolvedReferences:
      this.limitArray(
        continuity.resolvedReferences,
        limits.conversationTurns
      ),

    unresolvedReferences:
      this.limitArray(
        continuity.unresolvedReferences,
        limits.conversationTurns
      ),

    relevantPriorTurns:
      this.limitRecentArray(
        continuity.relevantPriorTurns,
        limits.conversationTurns
      )
  });
},

  /* =====================================================
     SITUATION
  ===================================================== */

  selectSituationContext(request = {}) {
    const situation =
      this.firstObject([
        request.situation,
        request.situationContext,
        request.situationContract,
        request.situationMap,
        request.deterministicContext
          ?.situation
      ]);

    return this.pickFields(
      situation,
      [
        "summary",
        "situation",
        "currentState",
        "participants",
        "constraints",
        "goals",
        "risks",
        "urgency",
        "relevantFacts",
        "unknowns"
      ]
    );
  },

  /* =====================================================
     MEMORY
  ===================================================== */

  selectMemoryContext(
    request = {},
    limits = {},
    mode = "fast"
  ) {
    const memory =
      this.firstObject([
        request.memory,
        request.memoryContext,
        request.memoryHandoff,
        request.deterministicContext
          ?.memory
      ]);

    if (!this.hasKeys(memory)) {
      return {};
    }

    const selected =
      this.pickFields(
        memory,
        [
          "summary",
          "userContext",
          "profileSummary",
          "userSummary",
          "threadContext",
          "threadSummary"
        ]
      );

    selected.relevantItems =
      this.limitArray(
        this.firstArray([
          memory.relevantItems,
          memory.relevantMemories,
          memory.matches,
          memory.items
        ]),
        limits.memoryItems
      );

    if (
      mode !== "fast"
    ) {
      selected.episodicContext =
        memory.episodicContext ||
        memory.episodicMemory ||
        null;

      selected.relationshipContext =
        memory.relationshipContext ||
        null;
    }

    return this.removeEmptyValues(
      selected
    );
  },

  /* =====================================================
     CONVERSATION
  ===================================================== */

  selectConversationContext(
    request = {},
    limits = {}
  ) {
    const conversation =
      this.firstObject([
        request.conversation,
        request.conversationContext,
        request.threadContext
      ]);

    if (!this.hasKeys(conversation)) {
      return {};
    }

    return this.removeEmptyValues({
      ...this.pickFields(
        conversation,
        [
          "conversationType",
          "currentTopic",
          "topic",
          "summary",
          "conversationSummary",
          "threadSummary"
        ]
      ),

      recentTurns:
        this.limitRecentArray(
          this.firstArray([
            conversation.recentTurns,
            conversation.turns,
            conversation.messages
          ]),
          limits.conversationTurns
        )
    });
  },

  /* =====================================================
     EVIDENCE
  ===================================================== */

  selectEvidenceContext(
    request = {},
    limits = {}
  ) {
    const evidence =
      this.firstObject([
        request.evidence,
        request.evidencePacket,
        request.perceptionEvidence
      ]);

    if (!this.hasKeys(evidence)) {
      return {};
    }

    return this.removeEmptyValues({
      summary:
        evidence.summary ||
        evidence.evidenceSummary ||
        null,

      facts:
        this.limitArray(
          this.firstArray([
            evidence.facts,
            evidence.observations,
            evidence.claims
          ]),
          limits.evidenceItems
        ),

      sources:
        this.limitArray(
          this.firstArray([
            evidence.sources,
            evidence.references,
            evidence.citations
          ]),
          limits.evidenceSources
        ),

      conflicts:
        this.limitArray(
          this.firstArray([
            evidence.conflicts,
            evidence.contradictions
          ]),
          Math.min(
            limits.evidenceItems,
            12
          )
        )
    });
  },

  /* =====================================================
     KNOWLEDGE
  ===================================================== */

  selectKnowledgeContext(
    request = {},
    limits = {}
  ) {
    const knowledge =
      this.firstObject([
        request.knowledge,
        request.knowledgeContext,
        request.knowledgePacket
      ]);

    if (!this.hasKeys(knowledge)) {
      return {};
    }

    return this.removeEmptyValues({
      summary:
        knowledge.summary ||
        knowledge.knowledgeSummary ||
        null,

      relevantKnowledge:
        this.limitArray(
          this.firstArray([
            knowledge.relevantKnowledge,
            knowledge.items,
            knowledge.matches,
            knowledge.results
          ]),
          limits.knowledgeItems
        ),

      citations:
        this.limitArray(
          this.firstArray([
            knowledge.citations,
            knowledge.references,
            knowledge.sources
          ]),
          limits.knowledgeCitations
        )
    });
  },

  /* =====================================================
     DEVELOPER EVIDENCE
  ===================================================== */

  hasDeveloperContext(request = {}) {
    return this.hasKeys(
      this.firstObject([
        request.developerEvidence,
        request.developerContext,
        request.projectContext
      ])
    );
  },

  selectDeveloperContext(
    request = {},
    limits = {}
  ) {
    const developer =
      this.firstObject([
        request.developerEvidence,
        request.developerContext,
        request.projectContext
      ]);

    if (!this.hasKeys(developer)) {
      return {};
    }

    return this.removeEmptyValues({
      ...this.pickFields(
        developer,
        [
          "task",
          "requestedWork",
          "repository",
          "repo",
          "branch",
          "filePath",
          "path",
          "content",
          "fileContent",
          "language",
          "framework",
          "runtime",
          "architecture",
          "constraints"
        ]
      ),

      relatedFiles:
        this.limitArray(
          this.firstArray([
            developer.relatedFiles,
            developer.files
          ]),
          limits.developerFiles
        ),

      diagnostics:
        this.pickFields(
          developer.diagnostics,
          [
            "errors",
            "warnings",
            "failure",
            "failedStage"
          ]
        )
    });
  },

  /* =====================================================
     PREFERENCES
  ===================================================== */

  selectPreferenceContext(request = {}) {
    const preferences =
      this.firstObject([
        request.preferences,
        request.preferenceContext
      ]);

    if (this.hasKeys(preferences)) {
      return this.removeEmptyValues({
        ready:
          preferences.ready,

        userPreferences:
          preferences.userPreferences ||
          {},

        responseStyle:
          preferences.responseStyle ||
          {},

        currentTurnOverride:
          preferences.currentTurnOverride ||
          preferences.styleOverride ||
          {},

        authority:
          preferences.authority ||
          null,

        resolution:
          preferences.resolution ||
          null
      });
    }

    return this.removeEmptyValues({
      userPreferences:
        this.firstObject([
          request.userPreferences,
          request.communicationPreferences,
          request.stylePreferences
        ]),

      responseStyle:
        this.firstObject([
          request.responseStyle,
          request.responseControl
            ?.responseStyle
        ]),

      currentTurnOverride:
        this.firstObject([
          request.currentTurnOverride,
          request.styleOverride,
          request.responseControl
            ?.styleOverride
        ])
    });
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  selectResponseControl(request = {}) {
    return this.pickFields(
      request.responseControl,
      [
        "goal",
        "contextLane",
        "primaryLane",
        "responseMode",
        "reasoningMode",
        "requiredBehaviors",
        "forbiddenBehaviors",
        "requiredMoves",
        "prohibitedMoves",
        "constraints",
        "toneRequirements",
        "safetyRequirements",
        "continuityRequirements",
        "clarificationRequired",
        "clarificationQuestion"
      ]
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  selectAuthorityContext(request = {}) {
    const suppliedAuthority =
      this.pickFields(
        request.authority,
        [
          "communicationPreferencesAreBindingWithinSafety",
          "communicationPreferencesAreAdvisory",
          "mayPlanResponse",
          "mayDraftResponse",
          "mustProduceDraftResponse",
          "draftResponseIsAuthoritative"
        ]
      );

    return {
      ...suppliedAuthority,

      safetyIsBinding:
        true,

      mayPlanResponse:
        true,

      mayDraftResponse:
        true,

      mustProduceDraftResponse:
        true,

      draftResponseIsAuthoritative:
        true,

      mayExecuteActions:
        false,

      mayPersistState:
        false,

      mayOverrideSafety:
        false,

      mayClaimToolSuccess:
        false,

      mayAuthorizeDelivery:
        false,

      mayExposePrivateChainOfThought:
        false
    };
  },

  /* =====================================================
     CONTRACTS
  ===================================================== */

  selectOutputContract(request = {}) {
    return this.firstObject([
      request.outputContract,
      request.responseSchema
    ]);
  },

  selectOperationContract(request = {}) {
    return this.normalizeObject(
      request.operationContract
    );
  },

  selectInstructions(request = {}) {
    return this.uniqueStrings(
      this.firstArray([
        request.instructions,
        request.reasoningInstructions
      ])
    );
  },

  /* =====================================================
     REQUIREMENT DETECTION
  ===================================================== */

  hasMeaningfulContinuity(
  continuity = {}
) {
  return Boolean(
    continuity.requiresPriorContext ===
      true ||

    continuity.isContinuation ===
      true ||

    continuity.referencePresent ===
      true ||

    continuity.referenceResolved ===
      true ||

    continuity.missingAnchor ===
      true ||

    continuity.unresolvedReference ===
      true ||

    continuity.clarificationRequired ===
      true ||

    this.nonEmptyArray(
      continuity.references
    ) ||

    this.nonEmptyArray(
      continuity.resolvedReferences
    ) ||

    this.nonEmptyArray(
      continuity.unresolvedReferences
    ) ||

    this.nonEmptyArray(
      continuity.relevantPriorTurns
    ) ||

    this.nonEmptyString(
      continuity.referenceSurface
    ) ||

    this.nonEmptyString(
      continuity.continuitySummary
    ) ||

    this.nonEmptyString(
      continuity.threadSummary
    )
  );
},

  hasMeaningfulMemory(request = {}) {
    const memory =
      this.firstObject([
        request.memory,
        request.memoryContext,
        request.memoryHandoff,
        request.deterministicContext
          ?.memory
      ]);

    return Boolean(
      this.nonEmptyArray(
        memory.relevantItems
      ) ||
      this.nonEmptyArray(
        memory.relevantMemories
      ) ||
      this.nonEmptyArray(
        memory.matches
      ) ||
      this.nonEmptyArray(
        memory.items
      ) ||
      this.nonEmptyString(
        memory.summary
      ) ||
      this.hasKeys(
        memory.userContext
      ) ||
      this.hasKeys(
        memory.threadContext
      )
    );
  },

  hasMeaningfulEvidence(request = {}) {
    const evidence =
      this.firstObject([
        request.evidence,
        request.evidencePacket,
        request.perceptionEvidence
      ]);

    return Boolean(
      this.nonEmptyArray(
        evidence.facts
      ) ||
      this.nonEmptyArray(
        evidence.observations
      ) ||
      this.nonEmptyArray(
        evidence.claims
      ) ||
      this.nonEmptyString(
        evidence.summary
      )
    );
  },

  hasMeaningfulKnowledge(request = {}) {
    const knowledge =
      this.firstObject([
        request.knowledge,
        request.knowledgeContext,
        request.knowledgePacket
      ]);

    return Boolean(
      this.nonEmptyArray(
        knowledge.relevantKnowledge
      ) ||
      this.nonEmptyArray(
        knowledge.items
      ) ||
      this.nonEmptyArray(
        knowledge.matches
      ) ||
      this.nonEmptyArray(
        knowledge.results
      ) ||
      this.nonEmptyString(
        knowledge.summary
      )
    );
  },

  hasMeaningfulSituation(request = {}) {
    const situation =
      this.firstObject([
        request.situation,
        request.situationContext,
        request.situationContract,
        request.situationMap,
        request.deterministicContext
          ?.situation
      ]);

    return this.hasKeys(situation);
  },

  /* =====================================================
     DIAGNOSTICS
  ===================================================== */

  buildDiagnostics({
    startedAt = this.now(),
    request = {},
    packet = {},
    serialized = "",
    mode = "fast",
    requirements = {},
    limits = {}
  } = {}) {
    const sourceSerialized =
      this.safeStringify(request);

    const sourceCharacters =
      sourceSerialized.length;

    const packetCharacters =
      serialized.length;

    const reductionCharacters =
      Math.max(
        0,
        sourceCharacters -
          packetCharacters
      );

    const reductionPercentage =
      sourceCharacters > 0
        ? Math.round(
            (
              reductionCharacters /
              sourceCharacters
            ) *
              1000
          ) / 10
        : 0;

    return {
      source:
        this.source,

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      ready:
        true,

      mode,

      durationMs:
        Math.round(
          this.now() -
            startedAt
        ),

      sourceCharacters,

      sourceApproximateTokens:
        Math.ceil(
          sourceCharacters / 4
        ),

      packetCharacters,

      packetApproximateTokens:
        Math.ceil(
          packetCharacters / 4
        ),

      characters:
        packetCharacters,

      approximateTokens:
        Math.ceil(
          packetCharacters / 4
        ),

      reductionCharacters,

      reductionPercentage,

      requirements:
        { ...requirements },

      limits:
        { ...limits },

      included:
        this.buildIncludedMap(
          packet
        )
    };
  },

  buildIncludedMap(packet = {}) {
    return {
      request:
        this.hasKeys(
          packet.request
        ),

      semanticContext:
        this.hasKeys(
          packet.semanticContext
        ),

      routing:
        this.hasKeys(
          packet.routing
        ),

      safety:
        this.hasKeys(
          packet.safety
        ),

      continuity:
        this.hasKeys(
          packet.continuity
        ),

      situation:
        this.hasKeys(
          packet.situation
        ),

      memory:
        this.hasKeys(
          packet.memory
        ),

      conversation:
        this.hasKeys(
          packet.conversation
        ),

      evidence:
        this.hasKeys(
          packet.evidence
        ),

      knowledge:
        this.hasKeys(
          packet.knowledge
        ),

      developerEvidence:
        this.hasKeys(
          packet.developerEvidence
        ),

      preferenceContext:
  this.hasKeys(
    packet.preferenceContext
  ),

      responseControl:
        this.hasKeys(
          packet.responseControl
        ),

      authority:
        this.hasKeys(
          packet.authority
        ),

      outputContract:
        this.hasKeys(
          packet.outputContract
        ),

      operationContract:
        this.hasKeys(
          packet.operationContract
        ),

      instructions:
        Array.isArray(
          packet.instructions
        ) &&
        packet.instructions.length > 0
    };
  },

  /* =====================================================
     FAILURE
  ===================================================== */

  buildFailure({
    startedAt = this.now(),
    error =
      "reasoning_context_build_failed"
  } = {}) {
    return {
      ready: false,

      success: false,

      complete: false,

      source:
        this.source,

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      error,

      cognitivePacket:
        null,

      reasoningPacket:
        null,

      diagnostics: {
        source:
          this.source,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        ready:
          false,

        durationMs:
          Math.round(
            this.now() -
              startedAt
          ),

        error
      }
    };
  },

  /* =====================================================
     OBJECT HELPERS
  ===================================================== */

  firstObject(candidates = []) {
    for (
      const candidate of candidates
    ) {
      if (
        this.isPlainObject(
          candidate
        ) &&
        Object.keys(
          candidate
        ).length > 0
      ) {
        return candidate;
      }
    }

    return {};
  },

  firstArray(candidates = []) {
    for (
      const candidate of candidates
    ) {
      if (
        Array.isArray(candidate) &&
        candidate.length > 0
      ) {
        return candidate;
      }
    }

    return [];
  },

mergeObjects(candidates = []) {
  const output = {};

  for (const candidate of candidates) {
    if (!this.isPlainObject(candidate)) {
      continue;
    }

    for (
      const [
        key,
        value
      ] of Object.entries(candidate)
    ) {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        continue;
      }

      if (
        this.isPlainObject(value) &&
        this.isPlainObject(output[key])
      ) {
        output[key] = {
          ...output[key],
          ...value
        };

        continue;
      }

      if (
        Array.isArray(value) &&
        value.length === 0 &&
        Array.isArray(output[key]) &&
        output[key].length > 0
      ) {
        continue;
      }

      output[key] = value;
    }
  }

  return output;
},

firstNonEmptyArray(candidates = []) {
  for (const candidate of candidates) {
    if (
      Array.isArray(candidate) &&
      candidate.length > 0
    ) {
      return candidate;
    }
  }

  return [];
},

  firstString(candidates = []) {
    for (
      const candidate of candidates
    ) {
      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return "";
  },

  pickFields(
    value = {},
    fields = []
  ) {
    if (
      !this.isPlainObject(value)
    ) {
      return {};
    }

    const output = {};

    for (
      const field of fields
    ) {
      if (
        value[field] !==
          undefined &&
        value[field] !==
          null
      ) {
        output[field] =
          value[field];
      }
    }

    return this.removeEmptyValues(
      output
    );
  },

  limitArray(
    value,
    maximum = 10
  ) {
    if (!Array.isArray(value)) {
      return [];
    }

    const safeMaximum =
      this.resolvePositiveInteger(
        maximum,
        10
      );

    return value
      .filter(
        item =>
          item !== undefined &&
          item !== null
      )
      .slice(0, safeMaximum);
  },

  limitRecentArray(
    value,
    maximum = 10
  ) {
    if (!Array.isArray(value)) {
      return [];
    }

    const safeMaximum =
      this.resolvePositiveInteger(
        maximum,
        10
      );

    const normalized =
      value.filter(
        item =>
          item !== undefined &&
          item !== null
      );

    if (
      normalized.length <=
      safeMaximum
    ) {
      return normalized;
    }

    return normalized.slice(
      normalized.length -
        safeMaximum
    );
  },

  resolvePositiveInteger(
    value,
    fallback
  ) {
    const numeric =
      Number(value);

    if (
      Number.isInteger(numeric) &&
      numeric > 0
    ) {
      return numeric;
    }

    return fallback;
  },

  removeEmptyValues(value) {
    if (Array.isArray(value)) {
      return value
        .map(
          item =>
            this.removeEmptyValues(
              item
            )
        )
        .filter(
          item =>
            !this.isEmptyValue(
              item
            )
        );
    }

    if (
      !this.isPlainObject(value)
    ) {
      return value;
    }

    const output = {};

    for (
      const [
        key,
        currentValue
      ] of Object.entries(value)
    ) {
      if (
        this.isEmptyValue(
          currentValue
        )
      ) {
        continue;
      }

      const normalized =
        this.removeEmptyValues(
          currentValue
        );

      if (
        this.isEmptyValue(
          normalized
        )
      ) {
        continue;
      }

      output[key] =
        normalized;
    }

    return output;
  },

  isEmptyValue(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return true;
    }

    if (
      Array.isArray(value)
    ) {
      return value.length === 0;
    }

    if (
      this.isPlainObject(value)
    ) {
      return (
        Object.keys(value)
          .length === 0
      );
    }

    return false;
  },

  uniqueStrings(values = []) {
    if (!Array.isArray(values)) {
      return [];
    }

    return [
      ...new Set(
        values
          .filter(
            value =>
              typeof value ===
                "string"
          )
          .map(
            value =>
              value.trim()
          )
          .filter(Boolean)
      )
    ];
  },

  normalizeObject(value) {
    return this.isPlainObject(value)
      ? value
      : {};
  },

  hasKeys(value) {
    return Boolean(
      this.isPlainObject(value) &&
      Object.keys(value).length > 0
    );
  },

  nonEmptyArray(value) {
    return (
      Array.isArray(value) &&
      value.length > 0
    );
  },

  nonEmptyString(value) {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  },

  isPlainObject(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const prototype =
      Object.getPrototypeOf(value);

    return (
      prototype ===
        Object.prototype ||
      prototype === null
    );
  },

  safeStringify(value) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          currentValue
        ) => {
          if (
            typeof currentValue ===
              "bigint"
          ) {
            return currentValue
              .toString();
          }

          if (
            typeof currentValue ===
              "function"
          ) {
            return undefined;
          }

          if (
            currentValue &&
            typeof currentValue ===
              "object"
          ) {
            if (
              seen.has(currentValue)
            ) {
              return "[Circular]";
            }

            seen.add(currentValue);
          }

          return currentValue;
        }
      );
    } catch (error) {
      console.warn(
        "ARI REASONING CONTEXT ENGINE STRINGIFY WARNING:",
        error
      );

      return "{}";
    }
  },

  now() {
    return (
      typeof performance !==
        "undefined" &&
      typeof performance.now ===
        "function"
    )
      ? performance.now()
      : Date.now();
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const requiredMethods = [
      "build",
      "create",
      "readCanonicalRequest",
      "selectCurrentTurn",
      "resolveMode",
      "resolveContextRequirements",
      "resolveLimits",
      "selectSemanticContext",
      "selectRoutingContext",
      "selectSafetyContext",
      "selectContinuityContext",
      "selectSituationContext",
      "selectMemoryContext",
      "selectConversationContext",
      "selectEvidenceContext",
      "selectKnowledgeContext",
      "selectDeveloperContext",
      "selectPreferenceContext",
      "selectResponseControl",
      "selectAuthorityContext",
      "selectOutputContract",
      "selectOperationContract",
      "mergeObjects",
"firstNonEmptyArray",
      "buildDiagnostics"
    ];

    const missingMethods =
      requiredMethods.filter(
        method =>
          typeof this[method] !==
          "function"
      );

    const valid =
      missingMethods.length === 0 &&
      this.packetSchema ===
        "ari_cognitive_context_packet" &&
      Array.isArray(
        this.supportedModes
      ) &&
      this.supportedModes.length > 0;

    return {
      valid,

      ready:
        valid,

      source:
        this.source,

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      packetSchema:
        this.packetSchema,

      missingMethods
    };
  }
};

window.Ari.reasoningContextEngine =
  window.AriReasoningContextEngine;

const ariReasoningContextEngineValidation =
  window.AriReasoningContextEngine
    ?.validate?.();

console.log(
  "ARI REASONING CONTEXT ENGINE LOADED:",
  window.AriReasoningContextEngine
    ?.version,

  ariReasoningContextEngineValidation
    ?.ready === true
    ? "READY"
    : "NOT_READY",

  ariReasoningContextEngineValidation
);