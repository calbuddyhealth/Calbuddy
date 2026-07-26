// ari/reasoning/ari-reasoning-context-engine.js
// Ari Reasoning Context Engine
//
// Purpose:
// Build one lean, canonical cognitive packet for OpenAI from the complete
// Ari reasoning request.
//
// V1.0.0 — Lean Cognitive Context Selection
//
// Responsibilities:
// - Accept the complete canonical reasoning request.
// - Preserve the effective current-turn request.
// - Select only model-relevant reasoning context.
// - Remove duplicated packet aliases and runtime-only metadata.
// - Preserve deterministic safety, resolved preferences, operation contracts,
//   and relevant conversation, memory, knowledge, and developer evidence.
// - Return one canonical cognitive packet with size diagnostics.
//
// Non-responsibilities:
// - Does not call OpenAI.
// - Does not build provider-specific prompts.
// - Does not interpret or change semantic meaning.
// - Does not merge or resolve communication preferences.
// - Does not validate model output.
// - Does not execute actions.
// - Does not persist state.
// - Does not authorize delivery.

window.Ari = window.Ari || {};

window.AriReasoningContextEngine = {
  version: "1.0.0",

  schemaVersion: "1.0.0",

  source:
    "ari-reasoning-context-engine",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const startedAt =
      this.now();

    const sourceRequest =
      this.readSourceRequest(
        input
      );

    const effectiveText =
      this.resolveEffectiveText(
        sourceRequest
      );

    const originalText =
      this.resolveOriginalText(
        sourceRequest
      );

    if (!effectiveText) {
      return this.buildFailure({
        startedAt,
        error:
          "effective_user_request_missing"
      });
    }

    const mode =
      this.resolveMode(
        sourceRequest
      );

    const cognitivePacket = {
      schema:
        "ari_cognitive_context_packet",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      mode,

      request:
        this.buildRequestContext({
          sourceRequest,
          effectiveText,
          originalText
        }),

      semanticContext:
        this.buildSemanticContext(
          sourceRequest
        ),

      routing:
        this.buildRoutingContext(
          sourceRequest
        ),

      safety:
        this.buildSafetyContext(
          sourceRequest
        ),

      continuity:
        this.buildContinuityContext(
          sourceRequest
        ),

      situation:
        this.buildSituationContext(
          sourceRequest
        ),

      memory:
        this.buildMemoryContext({
          sourceRequest,
          mode
        }),

      conversation:
        this.buildConversationContext({
          sourceRequest,
          mode
        }),

      evidence:
        this.buildEvidenceContext({
          sourceRequest,
          mode
        }),

      knowledge:
        this.buildKnowledgeContext({
          sourceRequest,
          mode
        }),

      developerEvidence:
        this.buildDeveloperContext({
          sourceRequest,
          mode
        }),

      preferences:
        this.buildPreferenceContext(
          sourceRequest
        ),

      responseControl:
        this.buildResponseControl(
          sourceRequest
        ),

      authority:
        this.buildAuthorityContext(
          sourceRequest
        ),

      outputContract:
        this.buildOutputContract(
          sourceRequest
        ),

      operationContract:
        this.buildOperationContract(
          sourceRequest
        ),

      instructions:
        this.buildInstructions(
          sourceRequest
        )
    };

    const compactPacket =
      this.removeEmptyValues(
        cognitivePacket
      );

    const serialized =
      this.safeStringify(
        compactPacket
      );

    const diagnostics = {
      source:
        this.source,

      version:
        this.version,

      mode,

      ready:
        true,

      durationMs:
        this.now() -
        startedAt,

      characters:
        serialized.length,

      approximateTokens:
        Math.ceil(
          serialized.length / 4
        ),

      included: {
        semanticContext:
          this.hasKeys(
            compactPacket
              .semanticContext
          ),

        routing:
          this.hasKeys(
            compactPacket.routing
          ),

        safety:
          this.hasKeys(
            compactPacket.safety
          ),

        continuity:
          this.hasKeys(
            compactPacket.continuity
          ),

        situation:
          this.hasKeys(
            compactPacket.situation
          ),

        memory:
          this.hasKeys(
            compactPacket.memory
          ),

        conversation:
          this.hasKeys(
            compactPacket.conversation
          ),

        evidence:
          this.hasKeys(
            compactPacket.evidence
          ),

        knowledge:
          this.hasKeys(
            compactPacket.knowledge
          ),

        developerEvidence:
          this.hasKeys(
            compactPacket
              .developerEvidence
          ),

        preferences:
          this.hasKeys(
            compactPacket.preferences
          ),

        responseControl:
          this.hasKeys(
            compactPacket
              .responseControl
          ),

        outputContract:
          this.hasKeys(
            compactPacket
              .outputContract
          ),

        operationContract:
          this.hasKeys(
            compactPacket
              .operationContract
          )
      }
    };

    return {
      ready: true,
      success: true,
      source:
        this.source,
      version:
        this.version,

      cognitivePacket:
        compactPacket,

      reasoningPacket:
        compactPacket,

      diagnostics
    };
  },

  create(input = {}) {
    return this.build(
      input
    );
  },

  /* =====================================================
     SOURCE REQUEST
  ===================================================== */

  readSourceRequest(
    input = {}
  ) {
    if (
      this.isPlainObject(
        input.request
      )
    ) {
      return input.request;
    }

    if (
      this.isPlainObject(
        input.reasoningRequest
      )
    ) {
      return input.reasoningRequest;
    }

    if (
      this.isPlainObject(
        input
      )
    ) {
      return input;
    }

    return {};
  },

  /* =====================================================
     MODE
  ===================================================== */

  resolveMode(
    request = {}
  ) {
    const explicitlyRequested =
      this.firstString([
        request.reasoningMode,
        request.responseControl
          ?.reasoningMode,
        request.routingContract
          ?.reasoningMode,
        request.executivePacket
          ?.reasoningMode
      ])
        .toLowerCase();

    if (
      [
        "fast",
        "standard",
        "deep",
        "developer"
      ].includes(
        explicitlyRequested
      )
    ) {
      return explicitlyRequested;
    }

    const lane =
      this.firstString([
        request.responseControl
          ?.contextLane,
        request.responseControl
          ?.primaryLane,
        request.routingContract
          ?.contextLane,
        request.routingContract
          ?.primaryLane,
        request.executivePacket
          ?.routingContract
          ?.contextLane,
        request.executivePacket
          ?.routingContract
          ?.primaryLane
      ])
        .toLowerCase();

    if (
      [
        "developer",
        "developer_task",
        "code",
        "project"
      ].includes(
        lane
      ) ||
      this.hasKeys(
        request.developerEvidence
      )
    ) {
      return "developer";
    }

    const safety =
      this.readSafety(
        request
      );

    if (
      safety.stop === true ||
      safety.blocked === true ||
      safety.escalationRequired ===
        true ||
      safety.crisis === true
    ) {
      return "deep";
    }

    const operation =
      this.firstString([
        request.routingContract
          ?.operation,
        request.routing
          ?.operation,
        request.semanticFrame
          ?.operation
      ])
        .toLowerCase();

    if (
      [
        "plan",
        "compare",
        "evaluate",
        "investigate",
        "analyze",
        "decision_support"
      ].some(
        value =>
          operation.includes(
            value
          )
      )
    ) {
      return "standard";
    }

    return "fast";
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  buildRequestContext({
    sourceRequest = {},
    effectiveText = "",
    originalText = ""
  } = {}) {
    return {
      original:
        originalText ||
        effectiveText,

      effective:
        effectiveText,

      turnId:
        this.firstString([
          sourceRequest.currentTurn
            ?.turnId,
          sourceRequest.turnId
        ]) ||
        null,

      language:
        this.firstString([
          sourceRequest.request
            ?.language,
          sourceRequest.currentTurn
            ?.language,
          sourceRequest.language
        ]) ||
        null,

      currentTurnWasResolved:
        sourceRequest
          .currentTurnWasResolved ===
        true ||
        (
          Boolean(originalText) &&
          Boolean(effectiveText) &&
          originalText !==
            effectiveText
        )
    };
  },

  resolveEffectiveText(
    request = {}
  ) {
    return this.firstString([
      request.request
        ?.effective,
      request.currentTurn
        ?.effectiveText,
      request.effectiveUserMessage,
      request.resolvedUserQuestion,
      request.resolvedQuestion,
      request.question,
      request.request
        ?.original,
      request.currentTurn
        ?.originalText,
      request.originalUserMessage,
      request.rawQuestion,
      request.userMessage,
      request.message,
      request.input
    ]);
  },

  resolveOriginalText(
    request = {}
  ) {
    return this.firstString([
      request.request
        ?.original,
      request.currentTurn
        ?.originalText,
      request.originalUserMessage,
      request.rawQuestion,
      request.userMessage,
      request.message,
      request.input,
      request.request
        ?.effective,
      request.currentTurn
        ?.effectiveText
    ]);
  },

  /* =====================================================
     SEMANTIC CONTEXT
  ===================================================== */

  buildSemanticContext(
    request = {}
  ) {
    const semanticFrame =
      this.firstObject([
        request.semanticFrame,
        request.semanticStructure,
        request.perceptionPacket
          ?.semanticFrame,
        request.perception
          ?.semanticFrame,
        request.understanding
          ?.semanticFrame
      ]);

    const understanding =
      this.firstObject([
        request.understanding,
        request.perceptionPacket
          ?.understanding,
        request.perception
          ?.understanding
      ]);

    return this.removeEmptyValues({
      semanticFrame:
        this.pickObjectFields(
          semanticFrame,
          [
            "operation",
            "requestType",
            "frameType",
            "interactionFamily",
            "intentFamily",
            "requestedOutput",
            "domain",
            "subject",
            "object",
            "target",
            "constraints",
            "continuity",
            "ambiguity",
            "execution"
          ]
        ),

      understanding:
        this.pickObjectFields(
          understanding,
          [
            "resolvedQuestion",
            "resolvedMeaning",
            "semanticSummary",
            "userGoal",
            "conversationFunction",
            "subjects",
            "ambiguity"
          ]
        )
    });
  },

  /* =====================================================
     ROUTING
  ===================================================== */

  buildRoutingContext(
    request = {}
  ) {
    const routing =
      this.firstObject([
        request.routingContract,
        request.routing,
        request.executivePacket
          ?.routingContract,
        request.executivePacket
          ?.routing
      ]);

    return this.pickObjectFields(
      routing,
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
        "requiresClarification"
      ]
    );
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  readSafety(
    request = {}
  ) {
    return this.firstObject([
      request.safety,
      request.safetyStagePacket,
      request.safetyDisposition,
      request.deterministicContext
        ?.safety
    ]);
  },

  buildSafetyContext(
    request = {}
  ) {
    const safety =
      this.readSafety(
        request
      );

    return this.pickObjectFields(
      safety,
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

  buildContinuityContext(
    request = {}
  ) {
    const continuity =
      this.firstObject([
        request.continuity,
        request.continuityStagePacket,
        request.continuityResolution,
        request.deterministicContext
          ?.continuity
      ]);

    return this.pickObjectFields(
      continuity,
      [
        "ready",
        "requiresPriorContext",
        "referencePresent",
        "referenceResolved",
        "missingAnchor",
        "resolvedReferences",
        "relevantPriorTurns",
        "continuitySummary",
        "threadSummary",
        "warnings"
      ]
    );
  },

  /* =====================================================
     SITUATION
  ===================================================== */

  buildSituationContext(
    request = {}
  ) {
    const situation =
      this.firstObject([
        request.situation,
        request.situationStagePacket,
        request.situationContract,
        request.situationMap,
        request.deterministicContext
          ?.situation
      ]);

    return this.pickObjectFields(
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

  buildMemoryContext({
    sourceRequest = {},
    mode = "fast"
  } = {}) {
    const memory =
      this.firstObject([
        sourceRequest.memory,
        sourceRequest.memoryStagePacket,
        sourceRequest.memoryContext,
        sourceRequest.memoryHandoff,
        sourceRequest
          .deterministicContext
          ?.memory
      ]);

    if (!this.hasKeys(memory)) {
      return {};
    }

    const base = {
      relevantItems:
        memory.relevantItems ||
        memory.relevantMemories ||
        memory.matches ||
        memory.items ||
        [],

      userContext:
        memory.userContext ||
        memory.profileSummary ||
        memory.userSummary ||
        null,

      threadContext:
        memory.threadContext ||
        memory.threadSummary ||
        null
    };

    if (
      mode === "standard" ||
      mode === "deep" ||
      mode === "developer"
    ) {
      base.episodicContext =
        memory.episodicContext ||
        memory.episodicMemory ||
        null;

      base.relationshipContext =
        memory.relationshipContext ||
        null;
    }

    return this.removeEmptyValues(
      base
    );
  },

  /* =====================================================
     CONVERSATION
  ===================================================== */

  buildConversationContext({
    sourceRequest = {},
    mode = "fast"
  } = {}) {
    const conversation =
      this.normalizeObject(
        sourceRequest.conversation
      );

    if (!this.hasKeys(conversation)) {
      return {};
    }

    const output = {
      conversationType:
        conversation
          .conversationType ||
        null,

      currentTopic:
        conversation.currentTopic ||
        conversation.topic ||
        null,

      recentTurns:
        this.limitArray(
          conversation.recentTurns ||
          conversation.turns ||
          conversation.messages,
          mode === "fast"
            ? 3
            : mode === "developer"
              ? 6
              : 5
        ),

      summary:
        conversation.summary ||
        conversation
          .conversationSummary ||
        null
    };

    return this.removeEmptyValues(
      output
    );
  },

  /* =====================================================
     EVIDENCE
  ===================================================== */

  buildEvidenceContext({
    sourceRequest = {},
    mode = "fast"
  } = {}) {
    const evidence =
      this.firstObject([
        sourceRequest.evidencePacket,
        sourceRequest.perceptionPacket
          ?.evidencePacket,
        sourceRequest.perception
          ?.evidencePacket
      ]);

    if (!this.hasKeys(evidence)) {
      return {};
    }

    return this.removeEmptyValues({
      facts:
        this.limitArray(
          evidence.facts ||
          evidence.observations ||
          evidence.claims,
          mode === "fast"
            ? 12
            : 30
        ),

      sources:
        this.limitArray(
          evidence.sources ||
          evidence.references,
          mode === "fast"
            ? 8
            : 20
        ),

      conflicts:
        this.limitArray(
          evidence.conflicts ||
          evidence.contradictions,
          10
        ),

      summary:
        evidence.summary ||
        evidence.evidenceSummary ||
        null
    });
  },

  /* =====================================================
     KNOWLEDGE
  ===================================================== */

  buildKnowledgeContext({
    sourceRequest = {},
    mode = "fast"
  } = {}) {
    const knowledge =
      this.normalizeObject(
        sourceRequest.knowledge
      );

    if (!this.hasKeys(knowledge)) {
      return {};
    }

    return this.removeEmptyValues({
      relevantKnowledge:
        this.limitArray(
          knowledge.relevantKnowledge ||
          knowledge.items ||
          knowledge.matches ||
          knowledge.results,
          mode === "fast"
            ? 10
            : 25
        ),

      summary:
        knowledge.summary ||
        knowledge.knowledgeSummary ||
        null,

      citations:
        this.limitArray(
          knowledge.citations ||
          knowledge.references,
          15
        )
    });
  },

  /* =====================================================
     DEVELOPER CONTEXT
  ===================================================== */

  buildDeveloperContext({
    sourceRequest = {},
    mode = "fast"
  } = {}) {
    if (
      mode !== "developer" &&
      !this.hasKeys(
        sourceRequest
          .developerEvidence
      )
    ) {
      return {};
    }

    const developerEvidence =
      this.normalizeObject(
        sourceRequest
          .developerEvidence
      );

    return this.removeEmptyValues({
      task:
        developerEvidence.task ||
        developerEvidence
          .requestedWork ||
        null,

      repository:
        developerEvidence.repository ||
        developerEvidence.repo ||
        null,

      branch:
        developerEvidence.branch ||
        null,

      filePath:
        developerEvidence.filePath ||
        developerEvidence.github
          ?.path ||
        developerEvidence.fileContext
          ?.path ||
        null,

      content:
        this.firstString([
          developerEvidence.github
            ?.content,
          developerEvidence.github
            ?.fileContent,
          developerEvidence
            .fileContext
            ?.content,
          developerEvidence
            .fileContext
            ?.fileContent,
          developerEvidence.content,
          developerEvidence.fileContent
        ]) ||
        null,

      relatedFiles:
        this.limitArray(
          developerEvidence
            .relatedFiles ||
          developerEvidence.files,
          12
        ),

      diagnostics:
        this.pickObjectFields(
          developerEvidence
            .diagnostics,
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

  buildPreferenceContext(
    request = {}
  ) {
    const preferenceContext =
      this.normalizeObject(
        request.preferenceContext
      );

    if (
      this.hasKeys(
        preferenceContext
      )
    ) {
      return this.removeEmptyValues({
        ready:
          preferenceContext.ready ===
          true,

        userPreferences:
          preferenceContext
            .userPreferences ||
          {},

        responseStyle:
          preferenceContext
            .responseStyle ||
          {},

        currentTurnOverride:
          preferenceContext
            .currentTurnOverride ||
          {},

        authority:
          preferenceContext.authority ||
          null,

        resolution:
          preferenceContext.resolution ||
          null
      });
    }

    return this.removeEmptyValues({
      userPreferences:
        this.firstObject([
          request.userPreferences,
          request
            .communicationPreferences,
          request.stylePreferences
        ]),

      responseStyle:
        this.firstObject([
          request.responseStyle,
          request.responseControl
            ?.responseStyle,
          request.currentTurn
            ?.responseStyle
        ]),

      currentTurnOverride:
        this.firstObject([
          request.styleOverride,
          request.currentTurn
            ?.styleOverride,
          request.responseControl
            ?.styleOverride
        ])
    });
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl(
    request = {}
  ) {
    const responseControl =
      this.normalizeObject(
        request.responseControl
      );

    return this.pickObjectFields(
      responseControl,
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

  buildAuthorityContext(
    request = {}
  ) {
    return {
      ...this.pickObjectFields(
        request.authority,
        [
          "safetyIsBinding",
          "communicationPreferencesAreBindingWithinSafety",
          "communicationPreferencesAreAdvisory",
          "mayPlanResponse",
          "mayDraftResponse",
          "mustProduceDraftResponse",
          "draftResponseIsAuthoritative",
          "mayExecuteActions",
          "mayPersistState",
          "mayOverrideSafety",
          "mayClaimToolSuccess",
          "mayAuthorizeDelivery",
          "mayExposePrivateChainOfThought"
        ]
      ),

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

  buildOutputContract(
    request = {}
  ) {
    return this.firstObject([
      request.outputContract,
      request.responseSchema
    ]);
  },

  buildOperationContract(
    request = {}
  ) {
    return this.normalizeObject(
      request.operationContract
    );
  },

  buildInstructions(
    request = {}
  ) {
    return this.uniqueStrings(
      Array.isArray(
        request.instructions
      )
        ? request.instructions
        : []
    );
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
      source:
        this.source,
      version:
        this.version,

      error,

      cognitivePacket: null,
      reasoningPacket: null,

      diagnostics: {
        source:
          this.source,
        version:
          this.version,
        ready:
          false,
        durationMs:
          this.now() -
          startedAt
      }
    };
  },

  /* =====================================================
     OBJECT HELPERS
  ===================================================== */

  firstObject(
    candidates = []
  ) {
    for (
      const candidate
      of candidates
    ) {
      if (
        this.isPlainObject(
          candidate
        ) &&
        Object.keys(
          candidate
        ).length
      ) {
        return candidate;
      }
    }

    return {};
  },

  firstString(
    candidates = []
  ) {
    for (
      const candidate
      of candidates
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

  pickObjectFields(
    value = {},
    fields = []
  ) {
    if (
      !this.isPlainObject(
        value
      )
    ) {
      return {};
    }

    const output = {};

    for (
      const field
      of fields
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
    if (
      !Array.isArray(
        value
      )
    ) {
      return [];
    }

    return value
      .filter(
        item =>
          item !==
            undefined &&
          item !==
            null
      )
      .slice(
        0,
        maximum
      );
  },

  removeEmptyValues(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value
        .map(
          item =>
            this.removeEmptyValues(
              item
            )
        )
        .filter(
          item =>
            item !==
              undefined &&
            item !==
              null &&
            item !==
              "" &&
            !(
              Array.isArray(
                item
              ) &&
              item.length === 0
            ) &&
            !(
              this.isPlainObject(
                item
              ) &&
              Object.keys(
                item
              ).length === 0
            )
        );
    }

    if (
      !this.isPlainObject(
        value
      )
    ) {
      return value;
    }

    const output = {};

    for (
      const [
        key,
        currentValue
      ]
      of Object.entries(
        value
      )
    ) {
      if (
        currentValue ===
          undefined ||
        currentValue ===
          null ||
        currentValue ===
          ""
      ) {
        continue;
      }

      const normalized =
        this.removeEmptyValues(
          currentValue
        );

      if (
        Array.isArray(
          normalized
        ) &&
        normalized.length === 0
      ) {
        continue;
      }

      if (
        this.isPlainObject(
          normalized
        ) &&
        Object.keys(
          normalized
        ).length === 0
      ) {
        continue;
      }

      output[key] =
        normalized;
    }

    return output;
  },

  uniqueStrings(
    values = []
  ) {
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

  normalizeObject(
    value
  ) {
    return this.isPlainObject(
      value
    )
      ? value
      : {};
  },

  hasKeys(
    value
  ) {
    return (
      this.isPlainObject(
        value
      ) &&
      Object.keys(
        value
      ).length > 0
    );
  },

  isPlainObject(
    value
  ) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  },

  safeStringify(
    value
  ) {
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
            currentValue &&
            typeof currentValue ===
              "object"
          ) {
            if (
              seen.has(
                currentValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              currentValue
            );
          }

          return currentValue;
        }
      );
    } catch {
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
    const valid =
      typeof this.build ===
        "function" &&
      typeof this.create ===
        "function" &&
      typeof this.resolveMode ===
        "function" &&
      typeof this.resolveEffectiveText ===
        "function" &&
      typeof this.buildRequestContext ===
        "function" &&
      typeof this.buildPreferenceContext ===
        "function" &&
      typeof this.buildOutputContract ===
        "function";

    return {
      valid,

      ready:
        valid,

      source:
        this.source,

      version:
        this.version,

      schemaVersion:
        this.schemaVersion
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
    ?.ready ===
    true
    ? "READY"
    : "NOT_READY",

  ariReasoningContextEngineValidation
);