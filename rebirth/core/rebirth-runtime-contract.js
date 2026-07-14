// rebirth/core/rebirth-runtime-contract.js
// Rebirth Runtime Contract
//
// Purpose:
// Define the canonical input, execution, authority, response, diagnostics,
// and result contract for the OpenAI-first Rebirth runtime.
//
// Architectural position:
//
// CalBuddy / Rebirth App Bridge
//              ↓
// Rebirth Runtime Contract
//              ↓
// Rebirth Runtime Controller
//              ↓
// Conversation Understanding
//              ↓
// Authority Resolution
//              ↓
// Model Orchestration
//              ↓
// Response Validation
//              ↓
// Final Ari Response
//
// Responsibilities:
// - Define the canonical runtime request structure.
// - Normalize external requests into a stable runtime input.
// - Preserve the exact current user turn.
// - Define execution modes and model-pass policy.
// - Define authority boundaries for safety, character, memory, tools,
//   knowledge, medical, nutrition, developer, and application actions.
// - Define the required response-result structure.
// - Validate runtime requests and runtime results.
// - Produce deterministic failure results when the contract is violated.
// - Provide compatibility helpers for the Rebirth App Bridge and Lab.
//
// Non-responsibilities:
// - Does not classify conversation meaning.
// - Does not call OpenAI.
// - Does not retrieve knowledge.
// - Does not retrieve or save memory.
// - Does not resolve safety severity.
// - Does not resolve Ari's character.
// - Does not execute tools or application actions.
// - Does not generate the final user-facing response.
// - Does not persist runtime state.
//
// V1.0.0 — Canonical OpenAI-First Runtime Boundary

window.Rebirth = window.Rebirth || {};

window.RebirthRuntimeContract = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "rebirth-runtime-contract",

  /* =====================================================
     CONTRACT CONSTANTS
  ===================================================== */

  constants: {
    architecture:
      "openai_first_authority_governed_runtime",

    runtimeName:
      "Rebirth",

    assistantIdentity:
      "Ari",

    requestSchema:
      "rebirth_runtime_request",

    resultSchema:
      "rebirth_runtime_result",

    traceSchema:
      "rebirth_runtime_trace",

    supportedExecutionModes: [
      "automatic",
      "fast",
      "balanced",
      "deep",
      "deterministic_only"
    ],

    supportedConversationModes: [
      "new_turn",
      "follow_up",
      "continuation",
      "correction",
      "retry",
      "system_initiated"
    ],

    supportedResponseModes: [
      "direct",
      "conversational",
      "structured",
      "artifact",
      "tool_result",
      "safety",
      "clarification",
      "acknowledgment"
    ],

    supportedAuthorityNames: [
      "safety",
      "character",
      "continuity",
      "memory",
      "knowledge",
      "medical",
      "nutrition",
      "developer",
      "tools",
      "application",
      "user_profile"
    ],

    supportedActionPolicies: [
      "none",
      "read_only",
      "approval_required",
      "direct_execution_allowed"
    ],

    supportedModelPasses: [
      "understanding",
      "answer",
      "repair"
    ],

    supportedResultStatuses: [
      "success",
      "degraded",
      "clarification_required",
      "blocked",
      "failed"
    ],

    supportedConfidenceLabels: [
      "very_low",
      "low",
      "medium",
      "high",
      "very_high"
    ]
  },

  /* =====================================================
     DEFAULT POLICY
  ===================================================== */

  defaultPolicy: {
    executionMode:
      "automatic",

    responseMode:
      "conversational",

    modelPassPolicy: {
      understandingPass:
        "auto",

      answerPass:
        "required",

      repairPass:
        "on_validation_failure",

      maximumModelCalls:
        2,

      allowThirdRepairCall:
        false,

      reuseUnderstandingOutput:
        true,

      allowSinglePassUnderstandingAndAnswer:
        true,

      preferSinglePassForSimpleTurns:
        true,

      preferDedicatedUnderstandingPassForComplexTurns:
        true
    },

    latencyPolicy: {
      targetMilliseconds:
        2500,

      softLimitMilliseconds:
        6000,

      hardLimitMilliseconds:
        20000,

      allowDegradedFallback:
        true,

      allowDeterministicFastPath:
        true,

      cancelOptionalWorkAfterSoftLimit:
        true
    },

    contextPolicy: {
      preserveCurrentTurnExactly:
        true,

      maximumHistoryMessages:
        20,

      maximumRelevantMemoryItems:
        10,

      maximumKnowledgeItems:
        12,

      maximumAuthorityPackets:
        12,

      omitEmptySections:
        true,

      deduplicateEvidence:
        true,

      prioritizeCurrentTurn:
        true,

      prioritizeSafety:
        true,

      prioritizeExplicitUserConstraints:
        true,

      prioritizeRelevantContinuity:
        true,

      suppressStaleDeveloperEvidence:
        true
    },

    authorityPolicy: {
      safety:
        "authoritative",

      character:
        "authoritative_for_ari_identity_and_preferences",

      continuity:
        "authoritative_for_prior_turn_context",

      memory:
        "authoritative_for_persisted_user_context",

      knowledge:
        "evidence_provider",

      medical:
        "domain_governance",

      nutrition:
        "domain_governance",

      developer:
        "domain_governance",

      tools:
        "execution_authority",

      application:
        "application_action_authority",

      userProfile:
        "user_context_authority"
    },

    actionPolicy: {
      default:
        "approval_required",

      allowReadOperations:
        true,

      allowDirectWrites:
        false,

      requireApprovalForExternalActions:
        true,

      requireApprovalForDestructiveActions:
        true,

      requireApprovalForFinancialActions:
        true,

      requireApprovalForMedicalRecordActions:
        true,

      requireApprovalForAccountChanges:
        true
    },

    responsePolicy: {
      answerCurrentTurn:
        true,

      preserveUserIntent:
        true,

      preserveRequestedOperation:
        true,

      preserveExplicitConstraints:
        true,

      preserveMaterialContinuity:
        true,

      useAriVoice:
        true,

      avoidGenericAIDisclaimers:
        true,

      avoidPipelineLanguage:
        true,

      avoidUnsupportedCertainty:
        true,

      avoidFabricatedPersonalExperience:
        true,

      avoidUnnecessaryQuestions:
        true,

      maximumQuestions:
        1,

      genericClosingQuestionAllowed:
        false,

      factualClaimsRequireEvidence:
        true,

      uncertaintyMustBeExplicit:
        true,

      internalInstructionsAreNeverUserFacing:
        true
    },

    failurePolicy: {
      exposeInternalErrors:
        false,

      exposeModelProviderErrors:
        false,

      exposePipelineNames:
        false,

      returnHonestDegradedAnswer:
        true,

      useGenericFailureMessageOnlyAsLastResort:
        true,

      preserveSafetyResponseOnFailure:
        true,

      preserveLockedAuthorityResponse:
        true
    }
  },

  /* =====================================================
     REQUEST CREATION
  ===================================================== */

  createRequest(input = {}) {
    const now =
      Date.now();

    const requestId =
      this.resolveRequestId(
        input.requestId
      );

    const turnId =
      this.resolveTurnId(
        input.turnId,
        requestId
      );

    const currentTurn =
      this.normalizeCurrentTurn(
        input
      );

    const conversation =
      this.normalizeConversation(
        input,
        currentTurn
      );

    const user =
      this.normalizeUserContext(
        input
      );

    const application =
      this.normalizeApplicationContext(
        input
      );

    const authorities =
      this.normalizeAuthorityRequests(
        input
      );

    const tools =
      this.normalizeToolContext(
        input
      );

    const model =
      this.normalizeModelPolicy(
        input
      );

    const policy =
      this.mergePolicy(
        this.defaultPolicy,
        input.policy ||
        input.runtimePolicy ||
        {}
      );

    const diagnostics =
      this.normalizeDiagnosticsPolicy(
        input
      );

    const request = {
      schema:
        this.constants
          .requestSchema,

      schemaVersion:
        this.schemaVersion,

      requestId,
      turnId,

      createdAt:
        now,

      architecture:
        this.constants
          .architecture,

      runtime:
        {
          name:
            this.constants
              .runtimeName,

          version:
            input.runtimeVersion ||
            null,

          executionMode:
            this.resolveEnum(
              input.executionMode ||
              policy.executionMode,
              this.constants
                .supportedExecutionModes,
              "automatic"
            ),

          source:
            input.source ||
            application.source ||
            "unknown"
        },

      currentTurn,

      conversation,

      user,

      application,

      authorities,

      tools,

      model,

      policy,

      diagnostics,

      metadata:
        this.cloneSerializable(
          input.metadata ||
          {}
        ),

      provenance: {
        currentTurnPreserved:
          true,

        originalInputAvailable:
          Boolean(
            currentTurn.originalText
          ),

        normalizedInputAvailable:
          Boolean(
            currentTurn.normalizedText
          ),

        createdBy:
          this.source
      },

      authority: {
        mayInterpretCurrentTurn:
          false,

        mayRewriteCurrentTurn:
          false,

        mayChooseResponseMeaning:
          false,

        mayExecuteTools:
          false,

        mayWriteFinalResponse:
          false,

        role:
          "canonical_runtime_request_definition"
      }
    };

    const validation =
      this.validateRequest(
        request
      );

    return {
      ...request,

      ready:
        validation.valid,

      validation
    };
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  normalizeCurrentTurn(input = {}) {
    const rawText =
      this.firstText(
        input.currentTurn?.originalText,
        input.currentTurn?.text,
        input.userMessage,
        input.message,
        input.input,
        input.question
      );

    const normalizedText =
      this.normalizeText(
        this.firstText(
          input.currentTurn
            ?.normalizedText,
          input.normalizedMessage,
          rawText
        )
      );

    return {
      originalText:
        rawText,

      text:
        rawText,

      normalizedText,

      language:
        input.currentTurn?.language ||
        input.language ||
        "auto",

      channel:
        input.currentTurn?.channel ||
        input.channel ||
        "text",

      submittedAt:
        this.toFiniteNumber(
          input.currentTurn
            ?.submittedAt,
          Date.now()
        ),

      attachments:
        this.normalizeAttachments(
          input.currentTurn
            ?.attachments ||
          input.attachments
        ),

      explicitConstraints:
        this.toArray(
          input.currentTurn
            ?.explicitConstraints ||
          input.explicitConstraints
        ),

      requestedOperations:
        this.toArray(
          input.currentTurn
            ?.requestedOperations ||
          input.requestedOperations
        ),

      prohibitedOperations:
        this.toArray(
          input.currentTurn
            ?.prohibitedOperations ||
          input.prohibitedOperations
        ),

      deferredOperations:
        this.toArray(
          input.currentTurn
            ?.deferredOperations ||
          input.deferredOperations
        ),

      responsePreferences:
        this.cloneSerializable(
          input.currentTurn
            ?.responsePreferences ||
          input.responsePreferences ||
          {}
        ),

      provenance: {
        source:
          input.currentTurn?.source ||
          input.source ||
          "user",

        originalTextPreserved:
          true,

        textWasRewritten:
          false
      }
    };
  },

  normalizeAttachments(
    attachments = []
  ) {
    return this.toArray(
      attachments
    )
      .map(
        (
          attachment,
          index
        ) => {
          if (
            typeof attachment ===
            "string"
          ) {
            return {
              id:
                `attachment_${index + 1}`,

              type:
                "unknown",

              name:
                attachment,

              url:
                null,

              localPath:
                null,

              mimeType:
                null,

              sizeBytes:
                null,

              metadata:
                {}
            };
          }

          if (
            !attachment ||
            typeof attachment !==
            "object"
          ) {
            return null;
          }

          return {
            id:
              attachment.id ||
              `attachment_${index + 1}`,

            type:
              attachment.type ||
              attachment.kind ||
              "unknown",

            name:
              attachment.name ||
              attachment.fileName ||
              attachment.filename ||
              null,

            url:
              attachment.url ||
              null,

            localPath:
              attachment.localPath ||
              attachment.path ||
              null,

            mimeType:
              attachment.mimeType ||
              attachment.contentType ||
              null,

            sizeBytes:
              this.toFiniteNumber(
                attachment.sizeBytes ||
                attachment.size,
                null
              ),

            metadata:
              this.cloneSerializable(
                attachment.metadata ||
                {}
              )
          };
        }
      )
      .filter(Boolean);
  },

  /* =====================================================
     CONVERSATION CONTEXT
  ===================================================== */

  normalizeConversation(
    input = {},
    currentTurn = {}
  ) {
    const source =
      input.conversation ||
      input.conversationContext ||
      {};

    const history =
      this.toArray(
        source.history ||
        input.history ||
        input.messages
      )
        .map(
          (
            message,
            index
          ) =>
            this.normalizeHistoryMessage(
              message,
              index
            )
        )
        .filter(Boolean);

    const requestedMode =
      source.mode ||
      input.conversationMode ||
      this.inferConversationMode(
        source,
        history
      );

    return {
      conversationId:
        source.conversationId ||
        input.conversationId ||
        null,

      threadId:
        source.threadId ||
        input.threadId ||
        null,

      mode:
        this.resolveEnum(
          requestedMode,
          this.constants
            .supportedConversationModes,
          history.length
            ? "follow_up"
            : "new_turn"
        ),

      history,

      historyCount:
        history.length,

      activeTopic:
        source.activeTopic ||
        input.activeTopic ||
        null,

      activeTask:
        source.activeTask ||
        input.activeTask ||
        null,

      activeArtifact:
        this.cloneSerializable(
          source.activeArtifact ||
          input.activeArtifact ||
          null
        ),

      priorTurnSummary:
        this.cleanText(
          source.priorTurnSummary ||
          input.priorTurnSummary ||
          ""
        ),

      continuityRequired:
        source.continuityRequired ===
          true ||
        input.continuityRequired ===
          true,

      allowPriorContext:
        source.allowPriorContext !==
          false,

      currentTurnReference: {
        text:
          currentTurn.originalText ||
          "",

        mustRemainPrimary:
          true
      }
    };
  },

  normalizeHistoryMessage(
    message = {},
    index = 0
  ) {
    if (
      typeof message ===
      "string"
    ) {
      return {
        id:
          `history_${index + 1}`,

        role:
          "user",

        text:
          this.cleanText(
            message
          ),

        createdAt:
          null,

        metadata:
          {}
      };
    }

    if (
      !message ||
      typeof message !==
      "object"
    ) {
      return null;
    }

    const text =
      this.firstText(
        message.text,
        message.content,
        message.message,
        message.reply,
        message.answer
      );

    if (!text) {
      return null;
    }

    return {
      id:
        message.id ||
        message.messageId ||
        `history_${index + 1}`,

      role:
        this.normalizeRole(
          message.role ||
          message.author ||
          "user"
        ),

      text,

      createdAt:
        this.toFiniteNumber(
          message.createdAt ||
          message.timestamp,
          null
        ),

      metadata:
        this.cloneSerializable(
          message.metadata ||
          {}
        )
    };
  },

  inferConversationMode(
    source = {},
    history = []
  ) {
    if (
      source.isCorrection ===
      true
    ) {
      return "correction";
    }

    if (
      source.isRetry === true
    ) {
      return "retry";
    }

    if (
      source.isContinuation ===
      true
    ) {
      return "continuation";
    }

    return history.length
      ? "follow_up"
      : "new_turn";
  },

  /* =====================================================
     USER CONTEXT
  ===================================================== */

  normalizeUserContext(
    input = {}
  ) {
    const source =
      input.user ||
      input.userContext ||
      input.appContext?.user ||
      {};

    return {
      id:
        source.id ||
        input.userId ||
        null,

      displayName:
        source.displayName ||
        source.name ||
        input.userDisplayName ||
        null,

      preferredName:
        source.preferredName ||
        input.preferredName ||
        null,

      locale:
        source.locale ||
        input.locale ||
        null,

      timezone:
        source.timezone ||
        input.timezone ||
        null,

      profile:
        this.cloneSerializable(
          source.profile ||
          input.userProfile ||
          null
        ),

      preferences:
        this.cloneSerializable(
          source.preferences ||
          input.userPreferences ||
          {}
        ),

      relationshipContext:
        this.cloneSerializable(
          source.relationshipContext ||
          input.relationshipContext ||
          null
        ),

      memorySummary:
        this.cleanText(
          source.memorySummary ||
          input.memorySummary ||
          input.coachMemorySummary ||
          ""
        ),

      authenticated:
        source.authenticated ===
          true ||
        input.authenticated ===
          true,

      ownerMode:
        source.ownerMode ===
          true ||
        input.ownerMode ===
          true,

      permissions:
        this.cloneSerializable(
          source.permissions ||
          input.userPermissions ||
          {}
        )
    };
  },

  /* =====================================================
     APPLICATION CONTEXT
  ===================================================== */

  normalizeApplicationContext(
    input = {}
  ) {
    const source =
      input.application ||
      input.appContext ||
      {};

    return {
      source:
        source.source ||
        input.source ||
        "calbuddy-health",

      appName:
        source.appName ||
        "CalBuddy Health",

      appMode:
        source.appMode ||
        "rebirth",

      page:
        source.page ||
        input.page ||
        "unknown",

      route:
        source.route ||
        input.route ||
        null,

      environment:
        source.environment ||
        input.environment ||
        "production",

      sessionId:
        source.sessionId ||
        input.sessionId ||
        null,

      appState:
        this.cloneSerializable(
          source.appState ||
          input.appState ||
          {}
        ),

      healthContext:
        this.cloneSerializable(
          source.healthContext ||
          input.healthContext ||
          {}
        ),

      nutritionContext:
        this.cloneSerializable(
          source.nutritionContext ||
          input.nutritionContext ||
          {}
        ),

      developerContext:
        this.cloneSerializable(
          source.developerContext ||
          input.developerContext ||
          {}
        ),

      fileContext:
        this.cloneSerializable(
          source.fileContext ||
          input.githubFileContext ||
          input.fileContext ||
          null
        ),

      featureFlags:
        this.cloneSerializable(
          source.featureFlags ||
          input.featureFlags ||
          {}
        )
    };
  },

  /* =====================================================
     AUTHORITY REQUESTS
  ===================================================== */

  normalizeAuthorityRequests(
    input = {}
  ) {
    const supplied =
      input.authorities ||
      input.authorityRequests ||
      {};

    const result = {};

    this.constants
      .supportedAuthorityNames
      .forEach(name => {
        const source =
          supplied[name] ||
          {};

        result[name] = {
          requested:
            source.requested ===
              true,

          required:
            source.required ===
              true,

          allowed:
            source.allowed !==
              false,

          mode:
            source.mode ||
            "automatic",

          query:
            source.query ||
            null,

          constraints:
            this.toArray(
              source.constraints
            ),

          context:
            this.cloneSerializable(
              source.context ||
              null
            ),

          priority:
            this.toFiniteNumber(
              source.priority,
              this.defaultAuthorityPriority(
                name
              )
            )
        };
      });

    return result;
  },

  defaultAuthorityPriority(
    name = ""
  ) {
    const priorities = {
      safety:
        100,

      medical:
        90,

      application:
        88,

      tools:
        86,

      developer:
        84,

      character:
        80,

      continuity:
        78,

      memory:
        76,

      user_profile:
        74,

      nutrition:
        72,

      knowledge:
        70
    };

    return priorities[name] ||
      50;
  },

  /* =====================================================
     TOOL CONTEXT
  ===================================================== */

  normalizeToolContext(
    input = {}
  ) {
    const source =
      input.tools ||
      input.toolContext ||
      {};

    const availableTools =
      this.toArray(
        source.availableTools ||
        input.availableTools
      )
        .map(tool => {
          if (
            typeof tool ===
            "string"
          ) {
            return {
              name:
                tool,

              description:
                null,

              actionPolicy:
                "approval_required",

              available:
                true
            };
          }

          if (
            !tool ||
            typeof tool !==
            "object"
          ) {
            return null;
          }

          return {
            name:
              tool.name ||
              tool.id ||
              null,

            description:
              tool.description ||
              null,

            actionPolicy:
              this.resolveEnum(
                tool.actionPolicy,
                this.constants
                  .supportedActionPolicies,
                "approval_required"
              ),

            available:
              tool.available !==
              false,

            schema:
              this.cloneSerializable(
                tool.schema ||
                null
              ),

            metadata:
              this.cloneSerializable(
                tool.metadata ||
                {}
              )
          };
        })
        .filter(
          tool =>
            tool?.name
        );

    return {
      available:
        source.available !==
          false,

      availableTools,

      actionPolicy:
        this.resolveEnum(
          source.actionPolicy ||
          input.actionPolicy,
          this.constants
            .supportedActionPolicies,
          "approval_required"
        ),

      executionAllowed:
        source.executionAllowed ===
          true,

      directExecutionAllowed:
        source.directExecutionAllowed ===
          true,

      requireApproval:
        source.requireApproval !==
          false,

      proposedActions:
        this.toArray(
          source.proposedActions ||
          input.proposedActions
        )
    };
  },

  /* =====================================================
     MODEL POLICY
  ===================================================== */

  normalizeModelPolicy(
    input = {}
  ) {
    const source =
      input.model ||
      input.modelPolicy ||
      {};

    return {
      provider:
        source.provider ||
        "openai",

      model:
        source.model ||
        null,

      fallbackModel:
        source.fallbackModel ||
        null,

      temperature:
        this.clampNumber(
          source.temperature,
          0,
          2,
          null
        ),

      maximumOutputTokens:
        this.toFiniteNumber(
          source.maximumOutputTokens ||
          source.maxOutputTokens,
          null
        ),

      reasoningEffort:
        source.reasoningEffort ||
        "automatic",

      streaming:
        source.streaming ===
          true,

      responseFormat:
        source.responseFormat ||
        "structured_json",

      timeoutMilliseconds:
        this.toFiniteNumber(
          source.timeoutMilliseconds,
          this.defaultPolicy
            .latencyPolicy
            .hardLimitMilliseconds
        ),

      metadata:
        this.cloneSerializable(
          source.metadata ||
          {}
        )
    };
  },

  /* =====================================================
     DIAGNOSTICS POLICY
  ===================================================== */

  normalizeDiagnosticsPolicy(
    input = {}
  ) {
    const source =
      input.diagnostics ||
      input.debug ||
      {};

    return {
      enabled:
        source.enabled ===
          true ||
        input.debugTiming ===
          true,

      includeTiming:
        source.includeTiming ===
          true ||
        input.debugTiming ===
          true,

      includeTrace:
        source.includeTrace ===
          true,

      includeModelUsage:
        source.includeModelUsage !==
          false,

      includeAuthorityUsage:
        source.includeAuthorityUsage !==
          false,

      includeValidation:
        source.includeValidation !==
          false,

      includeInternalPrompts:
        false,

      logToConsole:
        source.logToConsole ===
          true,

      benchmarkLabel:
        source.benchmarkLabel ||
        null
    };
  },

  /* =====================================================
     REQUEST VALIDATION
  ===================================================== */

  validateRequest(
    request = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !request ||
      typeof request !==
      "object"
    ) {
      errors.push(
        "request_not_object"
      );
    }

    if (
      request.schema !==
      this.constants
        .requestSchema
    ) {
      errors.push(
        "invalid_request_schema"
      );
    }

    if (
      !request.requestId
    ) {
      errors.push(
        "request_id_missing"
      );
    }

    if (
      !request.turnId
    ) {
      errors.push(
        "turn_id_missing"
      );
    }

    if (
      !this.cleanText(
        request.currentTurn
          ?.originalText
      )
    ) {
      errors.push(
        "current_turn_text_missing"
      );
    }

    if (
      request.currentTurn
        ?.provenance
        ?.originalTextPreserved !==
      true
    ) {
      errors.push(
        "current_turn_not_preserved"
      );
    }

    if (
      request.currentTurn
        ?.provenance
        ?.textWasRewritten ===
      true
    ) {
      errors.push(
        "current_turn_was_rewritten"
      );
    }

    if (
      !this.constants
        .supportedExecutionModes
        .includes(
          request.runtime
            ?.executionMode
        )
    ) {
      errors.push(
        "unsupported_execution_mode"
      );
    }

    if (
      !this.constants
        .supportedConversationModes
        .includes(
          request.conversation
            ?.mode
        )
    ) {
      errors.push(
        "unsupported_conversation_mode"
      );
    }

    const maximumCalls =
      Number(
        request.policy
          ?.modelPassPolicy
          ?.maximumModelCalls
      );

    if (
      !Number.isFinite(
        maximumCalls
      ) ||
      maximumCalls < 0 ||
      maximumCalls > 3
    ) {
      errors.push(
        "invalid_maximum_model_calls"
      );
    }

    if (
      request.tools
        ?.directExecutionAllowed ===
        true &&
      request.policy
        ?.actionPolicy
        ?.allowDirectWrites !==
        true
    ) {
      warnings.push(
        "direct_tool_execution_requested_but_runtime_writes_disabled"
      );
    }

    if (
      request.policy
        ?.responsePolicy
        ?.preserveUserIntent !==
      true
    ) {
      errors.push(
        "user_intent_preservation_disabled"
      );
    }

    if (
      request.policy
        ?.responsePolicy
        ?.answerCurrentTurn !==
      true
    ) {
      errors.push(
        "current_turn_answer_requirement_disabled"
      );
    }

    if (
      request.policy
        ?.contextPolicy
        ?.preserveCurrentTurnExactly !==
      true
    ) {
      errors.push(
        "current_turn_exact_preservation_disabled"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "rebirth-runtime-request-validation",

      contractVersion:
        this.version,

      schemaVersion:
        this.schemaVersion,

      errors,
      warnings,

      checks: {
        requestObject:
          Boolean(
            request &&
            typeof request ===
              "object"
          ),

        schemaValid:
          request.schema ===
          this.constants
            .requestSchema,

        requestIdAvailable:
          Boolean(
            request.requestId
          ),

        turnIdAvailable:
          Boolean(
            request.turnId
          ),

        currentTurnAvailable:
          Boolean(
            this.cleanText(
              request.currentTurn
                ?.originalText
            )
          ),

        currentTurnPreserved:
          request.currentTurn
            ?.provenance
            ?.originalTextPreserved ===
          true,

        userIntentPreserved:
          request.policy
            ?.responsePolicy
            ?.preserveUserIntent ===
          true,

        currentTurnRequired:
          request.policy
            ?.responsePolicy
            ?.answerCurrentTurn ===
          true
      }
    };
  },

  /* =====================================================
     RESULT CREATION
  ===================================================== */

  createResult(input = {}) {
    const status =
      this.resolveEnum(
        input.status,
        this.constants
          .supportedResultStatuses,
        input.response?.text ||
        input.finalResponse
          ? "success"
          : "failed"
      );

    const response =
      this.normalizeResponseResult(
        input
      );

    const result = {
      schema:
        this.constants
          .resultSchema,

      schemaVersion:
        this.schemaVersion,

      requestId:
        input.requestId ||
        null,

      turnId:
        input.turnId ||
        null,

      architecture:
        this.constants
          .architecture,

      status,

      ready:
        Boolean(
          response.text
        ),

      response,

      understanding:
        this.normalizeUnderstandingResult(
          input.understanding
        ),

      authorities:
        this.normalizeAuthorityResults(
          input.authorities
        ),

      toolExecution:
        this.normalizeToolExecutionResult(
          input.toolExecution ||
          input.actions
        ),

      model:
        this.normalizeModelResult(
          input.model ||
          input.modelUsage
        ),

      timing:
        this.normalizeTimingResult(
          input.timing
        ),

      trace:
        this.normalizeTraceResult(
          input.trace
        ),

      errors:
        this.normalizeErrors(
          input.errors
        ),

      warnings:
        this.normalizeWarnings(
          input.warnings
        ),

      metadata:
        this.cloneSerializable(
          input.metadata ||
          {}
        ),

      completedAt:
        Date.now(),

      authority: {
        finalResponseSelected:
          Boolean(
            response.text
          ),

        applicationActionsExecuted:
          false,

        persistenceCompleted:
          false,

        role:
          "canonical_runtime_result"
      }
    };

    const validation =
      this.validateResult(
        result
      );

    return {
      ...result,

      ready:
        result.ready &&
        validation.valid,

      validation
    };
  },

  normalizeResponseResult(
    input = {}
  ) {
    const source =
      input.response ||
      {};

    const text =
      this.firstText(
        source.text,
        source.reply,
        source.finalResponse,
        input.finalResponse,
        input.reply,
        input.answer
      );

    return {
      text,

      mode:
        this.resolveEnum(
          source.mode ||
          input.responseMode,
          this.constants
            .supportedResponseModes,
          "conversational"
        ),

      source:
        source.source ||
        input.responseSource ||
        null,

      usable:
        source.usable !==
          false &&
        Boolean(text),

      complete:
        source.complete !==
          false &&
        Boolean(text),

      degraded:
        source.degraded ===
          true,

      confidence:
        this.normalizeConfidence(
          source.confidence
        ),

      confidenceLabel:
        this.resolveConfidenceLabel(
          source.confidenceLabel,
          source.confidence
        ),

      emotion:
        source.emotion ||
        input.emotion ||
        "idle",

      requiresUserReply:
        source.requiresUserReply ===
          true,

      questionCount:
        this.countQuestions(
          text
        ),

      citations:
        this.toArray(
          source.citations
        ),

      evidenceRefs:
        this.toArray(
          source.evidenceRefs
        ),

      proposedActions:
        this.toArray(
          source.proposedActions ||
          input.proposedActions
        ),

      metadata:
        this.cloneSerializable(
          source.metadata ||
          {}
        )
    };
  },

  normalizeUnderstandingResult(
    understanding = {}
  ) {
    if (
      !understanding ||
      typeof understanding !==
      "object"
    ) {
      return null;
    }

    return {
      ready:
        understanding.ready ===
          true,

      conversationMove:
        understanding.conversationMove ||
        null,

      speechAct:
        understanding.speechAct ||
        null,

      intent:
        understanding.intent ||
        null,

      userGoal:
        understanding.userGoal ||
        null,

      requestedOperation:
        understanding.requestedOperation ||
        null,

      requestedOutput:
        understanding.requestedOutput ||
        null,

      subject:
        this.cloneSerializable(
          understanding.subject ||
          null
        ),

      target:
        this.cloneSerializable(
          understanding.target ||
          null
        ),

      entities:
        this.toArray(
          understanding.entities
        ),

      constraints:
        this.toArray(
          understanding.constraints
        ),

      continuity:
        this.cloneSerializable(
          understanding.continuity ||
          null
        ),

      ambiguity:
        this.cloneSerializable(
          understanding.ambiguity ||
          null
        ),

      domain:
        understanding.domain ||
        null,

      complexity:
        understanding.complexity ||
        null,

      riskIndicators:
        this.toArray(
          understanding.riskIndicators
        ),

      authorityNeeds:
        this.toArray(
          understanding.authorityNeeds
        ),

      toolNeeds:
        this.toArray(
          understanding.toolNeeds
        ),

      confidence:
        this.normalizeConfidence(
          understanding.confidence
        ),

      raw:
        this.cloneSerializable(
          understanding.raw ||
          null
        )
    };
  },

  normalizeAuthorityResults(
    authorities = {}
  ) {
    if (
      !authorities ||
      typeof authorities !==
      "object"
    ) {
      return {};
    }

    const result = {};

    this.constants
      .supportedAuthorityNames
      .forEach(name => {
        const value =
          authorities[name];

        if (
          value === undefined
        ) {
          return;
        }

        result[name] =
          this.cloneSerializable(
            value
          );
      });

    return result;
  },

  normalizeToolExecutionResult(
    toolExecution = {}
  ) {
    if (
      Array.isArray(
        toolExecution
      )
    ) {
      return {
        requested:
          toolExecution.length >
          0,

        executed:
          false,

        requiresApproval:
          toolExecution.length >
          0,

        actions:
          this.cloneSerializable(
            toolExecution
          ),

        results:
          []
      };
    }

    if (
      !toolExecution ||
      typeof toolExecution !==
      "object"
    ) {
      return {
        requested:
          false,

        executed:
          false,

        requiresApproval:
          false,

        actions:
          [],

        results:
          []
      };
    }

    return {
      requested:
        toolExecution.requested ===
          true,

      executed:
        toolExecution.executed ===
          true,

      requiresApproval:
        toolExecution.requiresApproval ===
          true,

      actions:
        this.toArray(
          toolExecution.actions
        ),

      results:
        this.toArray(
          toolExecution.results
        )
    };
  },

  normalizeModelResult(
    model = {}
  ) {
    if (
      !model ||
      typeof model !==
      "object"
    ) {
      return {
        provider:
          "openai",

        model:
          null,

        callCount:
          0,

        passes:
          [],

        usage:
          null
      };
    }

    return {
      provider:
        model.provider ||
        "openai",

      model:
        model.model ||
        null,

      fallbackModel:
        model.fallbackModel ||
        null,

      callCount:
        this.toFiniteNumber(
          model.callCount,
          this.toArray(
            model.passes
          ).length
        ),

      passes:
        this.toArray(
          model.passes
        ),

      usage:
        this.cloneSerializable(
          model.usage ||
          null
        ),

      finishReason:
        model.finishReason ||
        null
    };
  },

  normalizeTimingResult(
    timing = {}
  ) {
    if (
      !timing ||
      typeof timing !==
      "object"
    ) {
      return {
        totalMilliseconds:
          null,

        stages:
          []
      };
    }

    return {
      startedAt:
        this.toFiniteNumber(
          timing.startedAt,
          null
        ),

      completedAt:
        this.toFiniteNumber(
          timing.completedAt,
          null
        ),

      totalMilliseconds:
        this.toFiniteNumber(
          timing.totalMilliseconds,
          null
        ),

      stages:
        this.toArray(
          timing.stages
        )
    };
  },

  normalizeTraceResult(
    trace = {}
  ) {
    if (
      !trace ||
      typeof trace !==
      "object"
    ) {
      return null;
    }

    return {
      schema:
        this.constants
          .traceSchema,

      events:
        this.toArray(
          trace.events
        ),

      decisions:
        this.toArray(
          trace.decisions
        ),

      fallbacks:
        this.toArray(
          trace.fallbacks
        ),

      metadata:
        this.cloneSerializable(
          trace.metadata ||
          {}
        )
    };
  },

  /* =====================================================
     RESULT VALIDATION
  ===================================================== */

  validateResult(
    result = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !result ||
      typeof result !==
      "object"
    ) {
      errors.push(
        "result_not_object"
      );
    }

    if (
      result.schema !==
      this.constants
        .resultSchema
    ) {
      errors.push(
        "invalid_result_schema"
      );
    }

    if (
      !this.constants
        .supportedResultStatuses
        .includes(
          result.status
        )
    ) {
      errors.push(
        "unsupported_result_status"
      );
    }

    if (
      result.status ===
        "success" &&
      !result.response?.text
    ) {
      errors.push(
        "success_result_missing_response"
      );
    }

    if (
      result.response?.text &&
      result.response
        ?.usable !==
        true
    ) {
      warnings.push(
        "response_text_present_but_not_marked_usable"
      );
    }

    if (
      result.response
        ?.questionCount >
      1
    ) {
      warnings.push(
        "response_contains_multiple_questions"
      );
    }

    if (
      this.containsInternalLanguage(
        result.response?.text
      )
    ) {
      errors.push(
        "internal_runtime_language_exposed"
      );
    }

    if (
      this.containsGenericFailureResponse(
        result.response?.text
      ) &&
      result.status ===
        "success"
    ) {
      warnings.push(
        "generic_failure_response_marked_success"
      );
    }

    if (
      result.toolExecution
        ?.executed ===
        true
    ) {
      warnings.push(
        "runtime_result_claims_tool_execution_before_delivery_authority"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "rebirth-runtime-result-validation",

      contractVersion:
        this.version,

      errors,
      warnings,

      checks: {
        schemaValid:
          result.schema ===
          this.constants
            .resultSchema,

        statusValid:
          this.constants
            .supportedResultStatuses
            .includes(
              result.status
            ),

        responseAvailable:
          Boolean(
            result.response?.text
          ),

        responseUsable:
          result.response
            ?.usable ===
          true,

        internalLanguageSuppressed:
          !this.containsInternalLanguage(
            result.response?.text
          )
      }
    };
  },

  /* =====================================================
     FAILURE RESULT
  ===================================================== */

  createFailureResult({
    request = {},
    code = "runtime_failure",
    message = "",
    publicMessage = "",
    error = null,
    status = "failed",
    degradedResponse = ""
  } = {}) {
    const safePublicMessage =
      this.cleanText(
        degradedResponse ||
        publicMessage ||
        this.defaultFailureMessage(
          code
        )
      );

    return this.createResult({
      requestId:
        request.requestId ||
        null,

      turnId:
        request.turnId ||
        null,

      status,

      response: {
        text:
          safePublicMessage,

        mode:
          status ===
            "clarification_required"
            ? "clarification"
            : "conversational",

        source:
          "rebirth-runtime-contract-failure",

        usable:
          Boolean(
            safePublicMessage
          ),

        complete:
          false,

        degraded:
          true,

        confidence:
          0.2,

        emotion:
          "concerned"
      },

      errors: [
        {
          code,

          message:
            this.cleanText(
              message ||
              error?.message ||
              String(
                error ||
                code
              )
            ),

          public:
            false,

          source:
            this.source
        }
      ],

      metadata: {
        failureGeneratedBy:
          this.source
      }
    });
  },

  defaultFailureMessage(
    code = ""
  ) {
    const messages = {
      current_turn_missing:
        "I didn’t receive a message to respond to.",

      clarification_required:
        "I’m missing one important detail needed to answer accurately.",

      authority_unavailable:
        "I understand the question, but I’m missing the information needed to answer it reliably.",

      model_timeout:
        "That response took too long to complete. Please send it once more.",

      model_unavailable:
        "I couldn’t complete that response right now.",

      response_validation_failed:
        "I understood the request, but the response did not pass validation.",

      runtime_failure:
        "I couldn’t complete that response right now."
    };

    return (
      messages[code] ||
      messages.runtime_failure
    );
  },

  /* =====================================================
     POLICY MERGING
  ===================================================== */

  mergePolicy(
    base = {},
    patch = {}
  ) {
    return this.deepMerge(
      this.cloneSerializable(
        base
      ),
      this.cloneSerializable(
        patch
      )
    );
  },

  deepMerge(
    target = {},
    patch = {}
  ) {
    const output =
      this.isPlainObject(
        target
      )
        ? {
            ...target
          }
        : {};

    if (
      !this.isPlainObject(
        patch
      )
    ) {
      return output;
    }

    Object
      .entries(patch)
      .forEach(
        ([
          key,
          value
        ]) => {
          if (
            Array.isArray(value)
          ) {
            output[key] =
              this.cloneSerializable(
                value
              );

            return;
          }

          if (
            this.isPlainObject(
              value
            )
          ) {
            output[key] =
              this.deepMerge(
                this.isPlainObject(
                  output[key]
                )
                  ? output[key]
                  : {},
                value
              );

            return;
          }

          if (
            value !==
            undefined
          ) {
            output[key] =
              value;
          }
        }
      );

    return output;
  },

  /* =====================================================
     CONTENT CHECKS
  ===================================================== */

  containsInternalLanguage(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    const patterns = [
      "rebirth runtime contract",
      "runtime controller",
      "model orchestrator",
      "authority orchestrator",
      "response validator",
      "internal prompt",
      "system prompt",
      "pipeline stage",
      "candidate arbiter",
      "composer packet",
      "canonical response plan",
      "the model failed",
      "the ai writer failed"
    ];

    return patterns.some(
      pattern =>
        normalized.includes(
          pattern
        )
    );
  },

  containsGenericFailureResponse(
    text = ""
  ) {
    const normalized =
      this.normalizeText(
        text
      );

    const patterns = [
      "i know what you're asking, but i don't have a reliable answer ready",
      "i heard you, but i need a cleaner response path",
      "the final response writer did not complete the answer",
      "i understand the question, but i cannot generate the response",
      "try once more"
    ];

    return patterns.some(
      pattern =>
        normalized.includes(
          pattern
        )
    );
  },

  /* =====================================================
     ERROR NORMALIZATION
  ===================================================== */

  normalizeErrors(
    errors = []
  ) {
    return this.toArray(
      errors
    )
      .map(error => {
        if (
          typeof error ===
          "string"
        ) {
          return {
            code:
              this.normalizeIdentifier(
                error
              ) ||
              "runtime_error",

            message:
              error,

            public:
              false,

            source:
              null
          };
        }

        if (
          !error ||
          typeof error !==
          "object"
        ) {
          return null;
        }

        return {
          code:
            error.code ||
            "runtime_error",

          message:
            this.cleanText(
              error.message ||
              String(error)
            ),

          public:
            error.public ===
              true,

          source:
            error.source ||
            null,

          metadata:
            this.cloneSerializable(
              error.metadata ||
              {}
            )
        };
      })
      .filter(Boolean);
  },

  normalizeWarnings(
    warnings = []
  ) {
    return this.toArray(
      warnings
    )
      .map(warning => {
        if (
          typeof warning ===
          "string"
        ) {
          return {
            code:
              this.normalizeIdentifier(
                warning
              ) ||
              "runtime_warning",

            message:
              warning,

            source:
              null
          };
        }

        if (
          !warning ||
          typeof warning !==
          "object"
        ) {
          return null;
        }

        return {
          code:
            warning.code ||
            "runtime_warning",

          message:
            this.cleanText(
              warning.message ||
              String(warning)
            ),

          source:
            warning.source ||
            null,

          metadata:
            this.cloneSerializable(
              warning.metadata ||
              {}
            )
        };
      })
      .filter(Boolean);
  },

  /* =====================================================
     IDS
  ===================================================== */

  resolveRequestId(
    supplied = null
  ) {
    return supplied ||
      this.createId(
        "request"
      );
  },

  resolveTurnId(
    supplied = null,
    requestId = ""
  ) {
    return supplied ||
      `${requestId}_turn`;
  },

  createId(
    prefix = "rebirth"
  ) {
    const random =
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    return `${prefix}_${random}`;
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  firstText(
    ...values
  ) {
    for (
      const value
      of values
    ) {
      if (
        value ===
          undefined ||
        value ===
          null
      ) {
        continue;
      }

      const text =
        this.cleanText(
          value
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  normalizeText(
    value = ""
  ) {
    return this.cleanText(
      value
    )
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeRole(
    value = ""
  ) {
    const role =
      this.normalizeIdentifier(
        value
      );

    if (
      [
        "assistant",
        "ari",
        "bot"
      ].includes(role)
    ) {
      return "assistant";
    }

    if (
      [
        "system",
        "developer",
        "tool"
      ].includes(role)
    ) {
      return role;
    }

    return "user";
  },

  resolveEnum(
    value,
    allowed = [],
    fallback = null
  ) {
    return allowed.includes(
      value
    )
      ? value
      : fallback;
  },

  resolveConfidenceLabel(
    label = null,
    confidence = null
  ) {
    if (
      this.constants
        .supportedConfidenceLabels
        .includes(label)
    ) {
      return label;
    }

    const normalized =
      this.normalizeConfidence(
        confidence
      );

    if (
      normalized >=
      0.9
    ) {
      return "very_high";
    }

    if (
      normalized >=
      0.75
    ) {
      return "high";
    }

    if (
      normalized >=
      0.55
    ) {
      return "medium";
    }

    if (
      normalized >=
      0.3
    ) {
      return "low";
    }

    return "very_low";
  },

  normalizeConfidence(
    value = null
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return null;
    }

    if (
      number >
      1
    ) {
      return this.clampNumber(
        number / 100,
        0,
        1,
        0
      );
    }

    return this.clampNumber(
      number,
      0,
      1,
      0
    );
  },

  countQuestions(
    value = ""
  ) {
    return (
      String(
        value ||
        ""
      ).match(/\?/g) ||
      []
    ).length;
  },

  toFiniteNumber(
    value,
    fallback = null
  ) {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  clampNumber(
    value,
    minimum,
    maximum,
    fallback = null
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return fallback;
    }

    return Math.min(
      maximum,
      Math.max(
        minimum,
        number
      )
    );
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [
      value
    ];
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

  cloneSerializable(
    value
  ) {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return value ??
        null;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(
          value
        );
      } catch (_error) {
        // Fall through to safe JSON cloning.
      }
    }

    const seen =
      new WeakSet();

    try {
      return JSON.parse(
        JSON.stringify(
          value,
          (
            _key,
            nestedValue
          ) => {
            if (
              nestedValue &&
              typeof nestedValue ===
                "object"
            ) {
              if (
                seen.has(
                  nestedValue
                )
              ) {
                return "[Circular]";
              }

              seen.add(
                nestedValue
              );
            }

            if (
              typeof nestedValue ===
              "function"
            ) {
              return undefined;
            }

            return nestedValue;
          }
        )
      );
    } catch (_error) {
      return null;
    }
  },

  /* =====================================================
     AUTHORITY BOUNDARIES
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      contractAuthority:
        true,

      mayDefineRuntimeRequest:
        true,

      mayDefineRuntimeResult:
        true,

      mayNormalizeExternalInput:
        true,

      mayValidateRequest:
        true,

      mayValidateResult:
        true,

      mayDefineExecutionPolicy:
        true,

      mayDefineAuthorityBoundaries:
        true,

      mayDefineFailureResults:
        true,

      mayInterpretMeaning:
        false,

      mayClassifyConversation:
        false,

      mayResolveContinuity:
        false,

      mayRetrieveMemory:
        false,

      mayStoreMemory:
        false,

      mayRetrieveKnowledge:
        false,

      mayCallOpenAI:
        false,

      mayResolveSafety:
        false,

      mayResolveCharacter:
        false,

      mayExecuteTools:
        false,

      mayExecuteApplicationActions:
        false,

      mayWriteFinalResponse:
        false,

      mayPersistState:
        false,

      role:
        "runtime_boundary_and_schema_authority"
    };
  },

  /* =====================================================
     SELF VALIDATION
  ===================================================== */

  validate() {
    const errors = [];
    const warnings = [];

    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayCallOpenAI ===
      true
    ) {
      errors.push(
        "runtime_contract_may_not_call_openai"
      );
    }

    if (
      boundaries
        .mayInterpretMeaning ===
      true
    ) {
      errors.push(
        "runtime_contract_may_not_interpret_meaning"
      );
    }

    if (
      boundaries
        .mayResolveSafety ===
      true
    ) {
      errors.push(
        "runtime_contract_may_not_resolve_safety"
      );
    }

    if (
      boundaries
        .mayExecuteTools ===
      true
    ) {
      errors.push(
        "runtime_contract_may_not_execute_tools"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse ===
      true
    ) {
      errors.push(
        "runtime_contract_may_not_write_final_response"
      );
    }

    const missingAuthorityNames =
      [
        "safety",
        "character",
        "continuity",
        "memory",
        "knowledge",
        "medical",
        "nutrition",
        "developer",
        "tools",
        "application"
      ].filter(
        name =>
          !this.constants
            .supportedAuthorityNames
            .includes(name)
      );

    if (
      missingAuthorityNames.length
    ) {
      errors.push(
        `missing_authority_names:${missingAuthorityNames.join(",")}`
      );
    }

    if (
      this.defaultPolicy
        .modelPassPolicy
        .maximumModelCalls >
      3
    ) {
      errors.push(
        "default_model_call_limit_too_high"
      );
    }

    if (
      this.defaultPolicy
        .responsePolicy
        .answerCurrentTurn !==
      true
    ) {
      errors.push(
        "default_policy_must_answer_current_turn"
      );
    }

    if (
      this.defaultPolicy
        .contextPolicy
        .preserveCurrentTurnExactly !==
      true
    ) {
      errors.push(
        "default_policy_must_preserve_current_turn"
      );
    }

    if (
      this.defaultPolicy
        .actionPolicy
        .allowDirectWrites ===
      true
    ) {
      warnings.push(
        "default_direct_writes_enabled"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "rebirth-runtime-contract-validation",

      version:
        this.version,

      schemaVersion:
        this.schemaVersion,

      errors,
      warnings,

      checks: {
        openAICallingDisabled:
          boundaries
            .mayCallOpenAI ===
          false,

        semanticInterpretationDisabled:
          boundaries
            .mayInterpretMeaning ===
          false,

        safetyResolutionDisabled:
          boundaries
            .mayResolveSafety ===
          false,

        toolExecutionDisabled:
          boundaries
            .mayExecuteTools ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        currentTurnPreservationEnabled:
          this.defaultPolicy
            .contextPolicy
            .preserveCurrentTurnExactly ===
          true,

        currentTurnAnswerRequired:
          this.defaultPolicy
            .responsePolicy
            .answerCurrentTurn ===
          true,

        boundedModelCalls:
          this.defaultPolicy
            .modelPassPolicy
            .maximumModelCalls <=
          3
      }
    };
  },

  /* =====================================================
     COMPATIBILITY PACKET
  ===================================================== */

  getContract() {
    const validation =
      this.validate();

    return {
      runtimeContractReady:
        validation.valid ===
        true,

      runtimeContractVersion:
        this.version,

      runtimeContractSchemaVersion:
        this.schemaVersion,

      runtimeContractSource:
        this.source,

      architecture:
        this.constants
          .architecture,

      constants:
        this.cloneSerializable(
          this.constants
        ),

      defaultPolicy:
        this.cloneSerializable(
          this.defaultPolicy
        ),

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  initialize() {
    const contract =
      this.getContract();

    window.Rebirth.contract =
      contract;

    window.Rebirth.core =
      window.Rebirth.core ||
      {};

    window.Rebirth.core
      .runtimeContract = {
        source:
          this.source,

        version:
          this.version,

        schemaVersion:
          this.schemaVersion,

        ready:
          contract
            .runtimeContractReady ===
          true,

        createRequest:
          input =>
            this.createRequest(
              input
            ),

        createResult:
          input =>
            this.createResult(
              input
            ),

        createFailureResult:
          input =>
            this.createFailureResult(
              input
            ),

        validateRequest:
          request =>
            this.validateRequest(
              request
            ),

        validateResult:
          result =>
            this.validateResult(
              result
            ),

        validate:
          () =>
            this.validate()
      };

    return {
      runtimeContractInitialized:
        true,

      runtimeContractReady:
        contract
          .runtimeContractReady ===
        true,

      runtimeContractVersion:
        this.version,

      runtimeContractSource:
        this.source,

      validation:
        contract.validation
    };
  }
};

/* =====================================================
   INITIALIZATION
===================================================== */

window.RebirthRuntimeContractInitialization =
  window.RebirthRuntimeContract
    .initialize();

console.log(
  "REBIRTH RUNTIME CONTRACT LOADED:",
  window.RebirthRuntimeContract
    ?.version,
  window
    .RebirthRuntimeContractInitialization
    ?.runtimeContractReady ===
  true
    ? "READY"
    : "INVALID"
);