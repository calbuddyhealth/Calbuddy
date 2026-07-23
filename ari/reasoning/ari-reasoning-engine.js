// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
//
// Purpose:
// Build the canonical cognitive reasoning request, invoke OpenAI exactly once,
// validate the structured cognitive result, and preserve one authoritative
// user-facing draft for downstream semantic validation, response planning,
// final composition, and delivery.
//
// V10.1.0 — Canonical Communication Style Handoff
//
// Architectural flow:
//
// Canonical Evidence + Current Turn + Communication Preferences
//      ↓
// Registry-Bound Cognitive Request
//      ↓
// One OpenAI Reasoning Invocation
//      ↓
// Semantic Frame + Response Requirements + Authoritative Draft
//      ↓
// Validation and Normalization
//      ↓
// Canonical Cognitive Reasoning Result
//
// Authority model:
//
// ARI:
// - gathers evidence
// - defines binding safety, routing, execution, and response constraints
// - resolves supplied persistent and current-turn communication-style packets
// - validates model output
// - controls tools, persistence, final composition, and delivery
//
// OpenAI:
// - interprets user meaning
// - builds the semantic frame
// - analyzes evidence
// - applies supplied communication preferences
// - proposes decisions and actions
// - defines response requirements
// - produces the authoritative user-facing draft
//
// OpenAI may propose actions.
// OpenAI may not execute actions, persist state, claim tool success,
// override safety, authorize delivery, or expose private chain-of-thought.
//
// Responsibilities:
// - Build one canonical reasoning request.
// - Preserve current-turn and conversation context.
// - Preserve routing, safety, continuity, memory, knowledge,
//   evidence, and developer context.
// - Preserve persistent user communication preferences.
// - Preserve explicit current-turn response-style overrides.
// - Resolve an approved OpenAI reasoning invoker.
// - Invoke OpenAI exactly once per reasoning execution.
// - Validate and normalize structured cognitive output.
// - Require and preserve one authoritative user-facing draft.
// - Preserve the style OpenAI reports applying.
// - Reject unsafe or falsely executed action claims.
// - Return transparent invocation and validation diagnostics.
//
// Non-responsibilities:
// - Does not infer personality or profanity preferences from ordinary text.
// - Does not independently persist communication preferences.
// - Does not execute actions.
// - Does not call tools directly.
// - Does not persist memory or runtime state.
// - Does not authorize delivery.
// - Does not independently rewrite the model's authoritative draft.
// - Does not replace Response Planning.
// - Does not replace Final Composition.
// - Does not expose private chain-of-thought.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "10.1.0",
  source: "ari-reasoning-engine",

  requestSchema:
    "ari_cognitive_reasoning_request",

  requestSchemaVersion:
    "2.0.0",

  resultSchema:
    "ari_cognitive_reasoning_result",

  resultSchemaVersion:
    "2.0.0",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  async create(input = {}) {
    return this.reason(input);
  },

  async reason(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const reasoningRequest =
      this.resolveReasoningRequest(
        summary
      );

    const requestValidation =
      this.validateReasoningRequest(
        reasoningRequest
      );

    if (
      requestValidation.valid !==
      true
    ) {
      return this.buildFailureResult({
        reason:
          "invalid_reasoning_request",

        errors:
          requestValidation.errors,

        request:
          reasoningRequest,

        engineRan:
          false,

        modelInvocation:
          this.buildModelInvocationDiagnostic({
            available:
              false,

            attempted:
              false,

            succeeded:
              false,

            source:
              null,

            error:
              "Reasoning request validation failed before model invocation."
          })
      });
    }

    const modelInvoker =
      this.resolveModelInvoker({
        ...summary,

        openAIReasoningInvoker:
          reasoningRequest
            .openAIReasoningInvoker ||
          summary
            .openAIReasoningInvoker ||
          null
      });

    if (!modelInvoker) {
      return this.buildFailureResult({
        reason:
          "openai_reasoning_invoker_not_available",

        errors: [
          "No supported OpenAI reasoning client or injected invoker was found."
        ],

        request:
          reasoningRequest,

        engineRan:
          false,

        modelInvocation:
          this.buildModelInvocationDiagnostic({
            available:
              false,

            attempted:
              false,

            succeeded:
              false,

            source:
              null,

            error:
              "No supported OpenAI reasoning invoker was available."
          })
      });
    }

    const invocationStartedAt =
      Date.now();

    let rawModelResult;

    try {
      const operationContract =
        this.getOperationContract();

      rawModelResult =
        await modelInvoker.invoke({
          ...reasoningRequest,

          action:
            reasoningRequest.action ||
            "openai_reasoning",

          task:
            "ari_cognitive_reasoning",

          operationContract,

          responseSchema:
            this.getResponseSchema(
              operationContract
            ),

          instructions:
            this.getReasoningInstructions(
              operationContract
            ),

          /*
           * These are repeated at the top level because the
           * OpenAI client accepts the canonical engine packet
           * and transports these fields explicitly.
           */
          userPreferences:
            this.objectOrEmpty(
              reasoningRequest
                .userPreferences
            ),

          responseStyle:
            this.objectOrEmpty(
              reasoningRequest
                .responseStyle
            ),

          request:
            reasoningRequest
        });
    } catch (error) {
      return this.buildFailureResult({
        reason:
          "openai_reasoning_invocation_failed",

        errors: [
          error?.message ||
          "The OpenAI reasoning invocation failed."
        ],

        request:
          reasoningRequest,

        engineRan:
          true,

        modelInvocation:
          this.buildModelInvocationDiagnostic({
            available:
              true,

            attempted:
              true,

            succeeded:
              false,

            source:
              modelInvoker.source,

            durationMs:
              Date.now() -
              invocationStartedAt,

            error:
              error?.message ||
              "The OpenAI reasoning invocation failed."
          })
      });
    }

    const invocationDurationMs =
      Date.now() -
      invocationStartedAt;

    const normalizedResult =
      this.validateAndNormalizeResult({
        rawResult:
          rawModelResult,

        request:
          reasoningRequest
      });

    const modelInvocation =
      this.buildModelInvocationDiagnostic({
        available:
          true,

        attempted:
          true,

        succeeded:
          true,

        source:
          modelInvoker.source,

        durationMs:
          invocationDurationMs,

        error:
          null
      });

    const cognitiveReasoningResult = {
      ...normalizedResult,
      modelInvocation
    };

    return this.buildEngineResult({
      cognitiveReasoningResult,

      request:
        reasoningRequest,

      engineRan:
        true,

      modelInvocation
    });
  },

  /* =====================================================
     REQUEST CONSTRUCTION
  ===================================================== */

  resolveReasoningRequest(summary = {}) {
    const suppliedRequest =
      summary.reasoningStageInput ||
      summary.cognitiveReasoningRequest ||
      summary.requestPacket ||
      null;

    if (
      suppliedRequest &&
      typeof suppliedRequest ===
        "object" &&
      !Array.isArray(
        suppliedRequest
      )
    ) {
      return this.normalizeReasoningRequest(
        suppliedRequest,
        summary
      );
    }

    return this.buildReasoningRequest(
      summary
    );
  },

  buildReasoningRequest(summary = {}) {
    const request =
      this.buildUserRequest(
        summary
      );

    const styleContext =
      this.resolveStyleContext(
        summary
      );

    const currentTurn = {
      originalText:
        request.original,

      effectiveText:
        request.effective,

      turnId:
        request.turnId,

      responseStyle:
        styleContext
          .responseStyle
    };

    const operationContract =
      this.getOperationContract();

    return {
      schema:
        this.requestSchema,

      schemaVersion:
        this.requestSchemaVersion,

      action:
        "openai_reasoning",

      currentTurn,

      originalUserMessage:
        request.original,

      effectiveUserMessage:
        request.effective,

      resolvedUserQuestion:
        request.effective,

      currentTurnWasResolved:
        request.currentTurnWasResolved,

      turnId:
        request.turnId,

      evidencePacket:
        summary.evidencePacket ||
        summary.perceptionPacket
          ?.evidencePacket ||
        null,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      routingContract:
        summary.routingContract ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      continuityStagePacket:
        summary.continuityStagePacket ||
        null,

      safetyStagePacket:
        summary.safetyStagePacket ||
        null,

      situationStagePacket:
        summary.situationStagePacket ||
        null,

      memoryStagePacket:
        summary.memoryStagePacket ||
        null,

      request,

      conversation: {
        ...this.buildConversationContext(
          summary
        ),

        userPreferences:
          styleContext
            .userPreferences,

        responseStyle:
          styleContext
            .responseStyle
      },

      perception:
        summary.perceptionPacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      executive:
        summary.executivePacket ||
        null,

      continuity:
        summary.continuityStagePacket ||
        null,

      safety:
        summary.safetyStagePacket ||
        null,

      situation:
        summary.situationStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      userPreferences:
        styleContext
          .userPreferences,

      responseStyle:
        styleContext
          .responseStyle,

      styleContext:
        styleContext
          .diagnostics,

      knowledge:
        this.buildKnowledgeEvidence(
          summary
        ),

      understanding:
        summary.understandingStagePacket ||
        null,

      developerEvidence:
        this.buildDeveloperEvidence(
          summary
        ),

      responseControl: {
        ...this.buildResponseControl(
          summary
        ),

        userPreferences:
          styleContext
            .userPreferences,

        responseStyle:
          styleContext
            .responseStyle
      },

      capabilities:
        this.buildCapabilityContext(
          summary
        ),

      authority:
        this.buildAuthorityContract(),

      operationContract,

      outputContract:
        this.getResponseSchema(
          operationContract
        ),

      openAIReasoningInvoker:
        summary.openAIReasoningInvoker ||
        null
    };
  },

  normalizeReasoningRequest(
    request = {},
    summary = {}
  ) {
    const normalizedUserRequest = {
      ...this.buildUserRequest(
        summary
      ),

      ...this.objectOrEmpty(
        request.request
      )
    };

    const original =
      this.firstNonEmptyString([
        request.currentTurn
          ?.originalText,

        request.originalUserMessage,

        normalizedUserRequest.original
      ]);

    const effective =
      this.firstNonEmptyString([
        request.currentTurn
          ?.effectiveText,

        request.effectiveUserMessage,

        request.resolvedUserQuestion,

        normalizedUserRequest.effective,

        original
      ]);

    const turnId =
      request.currentTurn
        ?.turnId ||
      request.turnId ||
      normalizedUserRequest.turnId ||
      null;

    const routingContract =
      request.routingContract ??
      request.routing ??
      summary.routingContract ??
      null;

    const executivePacket =
      request.executivePacket ??
      request.executive ??
      summary.executivePacket ??
      null;

    const continuityStagePacket =
      request.continuityStagePacket ??
      request.continuity ??
      summary.continuityStagePacket ??
      null;

    const safetyStagePacket =
      request.safetyStagePacket ??
      request.safety ??
      summary.safetyStagePacket ??
      null;

    const situationStagePacket =
      request.situationStagePacket ??
      request.situation ??
      summary.situationStagePacket ??
      null;

    const memoryStagePacket =
      request.memoryStagePacket ??
      request.memory ??
      summary.memoryStagePacket ??
      null;

    const perceptionPacket =
      request.perceptionPacket ??
      request.perception ??
      summary.perceptionPacket ??
      null;

    const operationContract =
      request.operationContract ||
      this.getOperationContract();

    const styleContext =
      this.resolveStyleContext({
        ...summary,

        memoryStagePacket,

        userPreferences:
          request.userPreferences ??
          summary.userPreferences,

        communicationPreferences:
          request.communicationPreferences ??
          summary.communicationPreferences,

        stylePreferences:
          request.stylePreferences ??
          summary.stylePreferences,

        responseStyle:
          request.responseStyle ??
          summary.responseStyle,

        styleOverride:
          request.styleOverride ??
          summary.styleOverride,

        responseControl: {
          ...this.objectOrEmpty(
            summary.responseControl
          ),

          ...this.objectOrEmpty(
            request.responseControl
          )
        },

        currentTurn: {
          ...this.objectOrEmpty(
            summary.currentTurn
          ),

          ...this.objectOrEmpty(
            request.currentTurn
          )
        }
      });

    return {
      schema:
        request.schema ||
        this.requestSchema,

      schemaVersion:
        this.requestSchemaVersion,

      action:
        request.action ||
        "openai_reasoning",

      currentTurn: {
        originalText:
          original,

        effectiveText:
          effective,

        turnId,

        responseStyle:
          styleContext
            .responseStyle
      },

      originalUserMessage:
        original,

      effectiveUserMessage:
        effective,

      resolvedUserQuestion:
        effective,

      currentTurnWasResolved:
        request.currentTurnWasResolved ===
          true ||
        normalizedUserRequest
          .currentTurnWasResolved ===
          true,

      turnId,

      evidencePacket:
        request.evidencePacket ??
        perceptionPacket
          ?.evidencePacket ??
        summary.evidencePacket ??
        summary.perceptionPacket
          ?.evidencePacket ??
        null,

      perceptionPacket,

      routingContract,

      executivePacket,

      continuityStagePacket,

      safetyStagePacket,

      situationStagePacket,

      memoryStagePacket,

      request: {
        ...normalizedUserRequest,

        original,

        effective,

        resolved:
          effective,

        turnId
      },

      conversation: {
        ...this.buildConversationContext(
          summary
        ),

        ...this.objectOrEmpty(
          request.conversation
        ),

        userPreferences:
          styleContext
            .userPreferences,

        responseStyle:
          styleContext
            .responseStyle
      },

      perception:
        perceptionPacket,

      routing:
        routingContract,

      executive:
        executivePacket,

      continuity:
        continuityStagePacket,

      safety:
        safetyStagePacket,

      situation:
        situationStagePacket,

      memory:
        memoryStagePacket,

      userPreferences:
        styleContext
          .userPreferences,

      responseStyle:
        styleContext
          .responseStyle,

      styleContext:
        styleContext
          .diagnostics,

      knowledge: {
        ...this.buildKnowledgeEvidence(
          summary
        ),

        ...this.objectOrEmpty(
          request.knowledge
        )
      },

      understanding:
        request.understanding ??
        summary.understandingStagePacket ??
        null,

      developerEvidence: {
        ...this.buildDeveloperEvidence(
          summary
        ),

        ...this.objectOrEmpty(
          request.developerEvidence
        )
      },

      responseControl: {
        ...this.buildResponseControl(
          summary
        ),

        ...this.objectOrEmpty(
          request.responseControl
        ),

        userPreferences:
          styleContext
            .userPreferences,

        responseStyle:
          styleContext
            .responseStyle
      },

      capabilities: {
        ...this.buildCapabilityContext(
          summary
        ),

        ...this.objectOrEmpty(
          request.capabilities
        )
      },

      authority: {
        ...this.buildAuthorityContract(),

        ...this.objectOrEmpty(
          request.authority
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
      },

      operationContract,

      outputContract:
        this.getResponseSchema(
          operationContract
        ),

      openAIReasoningInvoker:
        request.openAIReasoningInvoker ||
        summary.openAIReasoningInvoker ||
        null
    };
  },

  buildUserRequest(summary = {}) {
    const original =
      summary.currentTurn
        ?.originalText ||
      summary.turn
        ?.originalText ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const effective =
      summary.currentTurn
        ?.effectiveText ||
      summary.turn
        ?.effectiveText ||
      summary.effectiveUserMessage ||
      summary.resolvedUserQuestion ||
      summary.threadQuestion
        ?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn
        ?.resolvedText ||
      original;

    return {
      original:
        String(
          original ||
          ""
        ).trim(),

      effective:
        String(
          effective ||
          ""
        ).trim(),

      turnId:
        summary.currentTurn
          ?.turnId ||
        summary.turn
          ?.turnId ||
        summary.turnId ||
        null,

      currentTurnWasResolved:
        summary.currentTurnWasResolved ===
        true,

      language:
        summary.language ||
        summary.detectedLanguage ||
        null
    };
  },

  buildConversationContext(summary = {}) {
    return {
      recentTurns:
        this.arrayOrEmpty(
          summary.conversationContext
            ?.recentTurns ||
          summary.recentTurns
        ),

      activeThreads:
        this.arrayOrEmpty(
          summary.activeThreads
        ),

      currentTopic:
        summary.currentTopic ||
        summary.conversationContext
          ?.currentTopic ||
        null,

      userContext:
        summary.userContext ||
        null,

      operatingState:
        summary.conversationOperatingState ||
        null
    };
  },

  /* =====================================================
     COMMUNICATION STYLE CONTEXT
  ===================================================== */

  resolveStyleContext(summary = {}) {
    const memory =
      this.objectOrEmpty(
        summary.memoryStagePacket ||
        summary.memory ||
        summary.memoryContext
      );

    const userPreferenceResolution =
      this.resolveFirstObject([
        [
          "summary.userPreferences",
          summary.userPreferences
        ],
        [
          "summary.communicationPreferences",
          summary.communicationPreferences
        ],
        [
          "summary.stylePreferences",
          summary.stylePreferences
        ],
        [
          "summary.conversation.userPreferences",
          summary.conversation
            ?.userPreferences
        ],
        [
          "summary.responseControl.userPreferences",
          summary.responseControl
            ?.userPreferences
        ],
        [
          "memory.userPreferences",
          memory.userPreferences
        ],
        [
          "memory.communicationPreferences",
          memory.communicationPreferences
        ],
        [
          "memory.stylePreferences",
          memory.stylePreferences
        ],
        [
          "memory.preferences.style",
          memory.preferences
            ?.style
        ],
        [
          "memory.preferences.communication",
          memory.preferences
            ?.communication
        ],
        [
          "memory.profile.communicationPreferences",
          memory.profile
            ?.communicationPreferences
        ]
      ]);

    const responseStyleResolution =
      this.resolveFirstObject([
        [
          "summary.responseStyle",
          summary.responseStyle
        ],
        [
          "summary.styleOverride",
          summary.styleOverride
        ],
        [
          "summary.currentTurn.responseStyle",
          summary.currentTurn
            ?.responseStyle
        ],
        [
          "summary.currentTurn.styleOverride",
          summary.currentTurn
            ?.styleOverride
        ],
        [
          "summary.responseControl.responseStyle",
          summary.responseControl
            ?.responseStyle
        ],
        [
          "summary.responseControl.styleOverride",
          summary.responseControl
            ?.styleOverride
        ],
        [
          "summary.responseControl.styleOverrides",
          summary.responseControl
            ?.styleOverrides
        ],
        [
          "summary.conversation.responseStyle",
          summary.conversation
            ?.responseStyle
        ],
        [
          "memory.currentTurnStyle",
          memory.currentTurnStyle
        ]
      ]);

    const userPreferences =
      this.normalizeCommunicationPreferences(
        userPreferenceResolution.value
      );

    const responseStyle =
      this.normalizeCommunicationPreferences({
        ...responseStyleResolution.value,

        source:
          responseStyleResolution.source
            ? "current_turn_override"
            : userPreferenceResolution.source
              ? "persistent_user_preference"
              : "default"
      });

    return {
      userPreferences,
      responseStyle,

      diagnostics: {
        source:
          this.source,

        version:
          this.version,

        interpretationPerformed:
          false,

        persistencePerformed:
          false,

        userPreferencesSource:
          userPreferenceResolution.source,

        responseStyleSource:
          responseStyleResolution.source,

        userPreferencesPresent:
          this.hasKeys(
            userPreferences
          ),

        responseStylePresent:
          this.hasKeys(
            responseStyle
          ),

        effectiveStyleSource:
          responseStyle.source ||
          (
            userPreferenceResolution.source
              ? "persistent_user_preference"
              : "default"
          )
      }
    };
  },

  resolveFirstObject(
    candidates = []
  ) {
    for (
      const candidate
      of this.arrayOrEmpty(
        candidates
      )
    ) {
      if (
        !Array.isArray(
          candidate
        ) ||
        candidate.length < 2
      ) {
        continue;
      }

      const [source, value] =
        candidate;

      if (
        this.hasKeys(
          value
        )
      ) {
        return {
          source,
          value
        };
      }
    }

    return {
      source: null,
      value: {}
    };
  },

  normalizeCommunicationPreferences(
    value = {}
  ) {
    if (
      !this.isPlainObject(
        value
      )
    ) {
      return {};
    }

    const profanity =
      this.objectOrEmpty(
        value.profanity
      );

    const profanityAllowed =
      this.firstDefinedBoolean([
        value.profanityAllowed,
        value.allowProfanity,
        profanity.allowed
      ]);

    const profanityLevel =
      this.firstNonEmptyString([
        value.profanityLevel,
        value.swearingLevel,
        profanity.level,
        profanity.intensity
      ]) ||
      null;

    return this.removeUndefinedValues({
      ...value,

      tone:
        this.firstNonEmptyString([
          value.tone,
          value.preferredTone
        ]) ||
        null,

      directness:
        this.firstNonEmptyString([
          value.directness,
          value.preferredDirectness
        ]) ||
        null,

      warmth:
        this.firstNonEmptyString([
          value.warmth,
          value.preferredWarmth
        ]) ||
        null,

      humor:
        this.firstNonEmptyString([
          value.humor,
          value.humorStyle
        ]) ||
        null,

      formality:
        this.firstNonEmptyString([
          value.formality,
          value.formalityLevel
        ]) ||
        null,

      verbosity:
        this.firstNonEmptyString([
          value.verbosity,
          value.responseLength
        ]) ||
        null,

      personality:
        this.firstNonEmptyString([
          value.personality,
          value.personalityStyle,
          value.energy
        ]) ||
        null,

      profanity: {
        ...profanity,

        allowed:
          profanityAllowed,

        level:
          profanityLevel,

        useNaturally:
          this.firstDefinedBoolean([
            profanity.useNaturally,
            value.useProfanityNaturally
          ])
      },

      profanityAllowed,
      profanityLevel
    });
  },

  /* =====================================================
     EVIDENCE AND CONTROL PACKETS
  ===================================================== */

  buildKnowledgeEvidence(summary = {}) {
    const routerPacket =
      summary.knowledgeRouterPacket ||
      summary.knowledgeStagePacket ||
      null;

    const routerResult =
      this.objectOrEmpty(
        routerPacket
      );

    return {
      routerRan:
        summary.knowledgeRouterRan ===
          true ||
        routerResult
          .knowledgeRouterRan ===
          true,

      shouldUseKnowledge:
        summary.shouldUseKnowledge ===
          true ||
        routerResult
          .shouldUseKnowledge ===
          true,

      routerPacket:
        routerPacket ||
        null,

      plan:
        summary.knowledgeRetrievalPlan ||
        routerResult
          .knowledgeRetrievalPlan ||
        null,

      evidence:
        summary.knowledgeEvidence ||
        summary
          .knowledgeRetrievalEvidence ||
        routerResult
          .knowledgeEvidence ||
        routerResult
          .knowledgeRetrievalEvidence ||
        null,

      results:
        this.arrayOrEmpty(
          summary
            .knowledgeRetrievalResults ||
          routerResult
            .knowledgeRetrievalResults
        ),

      answer:
        summary.knowledgeAnswer ||
        routerResult
          .knowledgeAnswer ||
        null,

      provider:
        summary.knowledgeProvider ||
        routerResult
          .knowledgeProvider ||
        null,

      confidence:
        summary.knowledgeConfidence ??
        routerResult
          .knowledgeConfidence ??
        null,

      sources:
        this.arrayOrEmpty(
          summary.knowledgeSources ||
          routerResult
            .knowledgeSources
        ),

      nodes:
        this.arrayOrEmpty(
          summary.knowledgeNodes ||
          routerResult
            .knowledgeNodes
        ),

      searchedCores:
        this.arrayOrEmpty(
          summary.searchedCores ||
          routerResult
            .searchedCores
        ),

      primaryCore:
        summary.primaryCore ||
        routerResult.primaryCore ||
        null,

      secondaryCores:
        this.arrayOrEmpty(
          summary.secondaryCores ||
          routerResult
            .secondaryCores
        ),

      error:
        summary.knowledgeError ||
        routerResult
          .knowledgeError ||
        null,

      authority: {
        mayInformReasoning:
          true,

        mayInformResponsePlanning:
          true,

        mayInformAuthoritativeDraft:
          true,

        mayAuthorizeDelivery:
          false
      }
    };
  },

  buildDeveloperEvidence(summary = {}) {
    return {
      github:
        summary.githubEvidence ||
        null,

      fileContext:
        summary.githubFileContext ||
        null,

      investigation:
        summary.developerInvestigation ||
        null,

      developerIntent:
        summary.developerIntent ||
        null,

      handoff:
        summary.developerHandoff ||
        summary.unlockedDeveloperHandoff ||
        null,

      composerPacket:
        summary.composerDeveloperPacket ||
        null
    };
  },

  buildResponseControl(summary = {}) {
    return {
      contextLane:
        summary.contextLane ||
        summary.routingContract
          ?.contextLane ||
        summary.routingContract
          ?.selectedRoute
          ?.contextLane ||
        null,

      primaryLane:
        summary.primaryLane ||
        summary.routingContract
          ?.primaryLane ||
        summary.routingContract
          ?.selectedRoute
          ?.primaryLane ||
        null,

      responseShape:
        summary.responseShape ||
        summary.routingContract
          ?.responseShape ||
        null,

      rules:
        this.arrayOrEmpty(
          summary.responseRules
        ),

      constraints:
        this.arrayOrEmpty(
          summary.responseConstraints
        ),

      requiredBehaviors:
        this.arrayOrEmpty(
          summary.responseRequired
        ),

      forbiddenBehaviors:
        this.arrayOrEmpty(
          summary.responseAvoid
        ),

      blocked:
        this.arrayOrEmpty(
          summary.blocked
        )
    };
  },

  buildCapabilityContext(summary = {}) {
    return {
      available:
        this.arrayOrEmpty(
          summary.availableCapabilities
        ),

      required:
        this.arrayOrEmpty(
          summary.requiredCapabilities
        ),

      tools:
        summary.toolAvailability ||
        summary.availableTools ||
        null,

      toolAvailability:
        summary.toolAvailability ||
        summary.availableTools ||
        null
    };
  },

  buildAuthorityContract() {
    return {
      safetyIsBinding:
        true,

      routingIsBinding:
        true,

      responseConstraintsAreBinding:
        true,

      upstreamSemanticSignalsAreAdvisory:
        true,

      knowledgeEvidenceIsAdvisory:
        true,

      communicationPreferencesAreAdvisory:
        true,

      currentTurnStyleOverridesPersistentPreferences:
        true,

      mayInterpretMeaning:
        true,

      mayResolveAmbiguity:
        true,

      mayBuildSemanticFrame:
        true,

      mayAnalyzeEvidence:
        true,

      mayCompareOptions:
        true,

      mayRecommendStrategy:
        true,

      mayDefineResponseRequirements:
        true,

      mayApplyCommunicationStyle:
        true,

      mayPlanResponse:
        true,

      mayDraftResponse:
        true,

      mustProduceDraftResponse:
        true,

      draftResponseIsAuthoritative:
        true,

      mayProposeActions:
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
     OPERATION CONTRACT
  ===================================================== */

  getOperationRegistry() {
    return (
      window.AriOperationRegistry ||
      window.Ari
        ?.operationRegistry ||
      null
    );
  },

  getOperationContract() {
    const registry =
      this.getOperationRegistry();

    if (
      !registry ||
      typeof registry
        .getPromptContract !==
        "function"
    ) {
      return {
        schema:
          "ari.operation_prompt_contract",

        schemaVersion:
          "1.0.0",

        registryAvailable:
          false,

        allowedOperations:
          [],

        operationDefinitions:
          {},

        rules: [
          "Use a stable cognitive operation name.",
          "Do not place the domain or target inside the operation name."
        ],

        source:
          "ari-reasoning-engine-fallback-operation-contract"
      };
    }

    return {
      ...registry.getPromptContract(),

      registryAvailable:
        true
    };
  },

  normalizeOperation(value = "") {
    const registry =
      this.getOperationRegistry();

    if (
      registry &&
      typeof registry
        .normalizeOperation ===
        "function"
    ) {
      return registry
        .normalizeOperation(
          value
        );
    }

    return this.nullableString(
      value
    );
  },

  resolveOperationDefinition(value = "") {
    const registry =
      this.getOperationRegistry();

    const canonicalOperation =
      this.normalizeOperation(
        value
      );

    const definition =
      canonicalOperation &&
      registry &&
      typeof registry
        .getOperation ===
        "function"
        ? registry.getOperation(
            canonicalOperation
          )
        : null;

    return {
      rawOperation:
        this.nullableString(
          value
        ),

      canonicalOperation,

      definition,

      recognized:
        Boolean(
          canonicalOperation &&
          definition
        )
    };
  },

  /* =====================================================
     MODEL INVOCATION
  ===================================================== */

  resolveModelInvoker(summary = {}) {
    const candidates = [
      {
        source:
          "summary.openAIReasoningInvoker",
        fn:
          summary.openAIReasoningInvoker,
        context:
          null
      },
      {
        source:
          "summary.modelInvoker",
        fn:
          summary.modelInvoker,
        context:
          null
      },
      {
        source:
          "AriOpenAIReasoningClient.invoke",
        fn:
          window
            .AriOpenAIReasoningClient
            ?.invoke,
        context:
          window
            .AriOpenAIReasoningClient ||
          null
      },
      {
        source:
          "AriOpenAIReasoningClient.reason",
        fn:
          window
            .AriOpenAIReasoningClient
            ?.reason,
        context:
          window
            .AriOpenAIReasoningClient ||
          null
      },
      {
        source:
          "Ari.openAIReasoningClient.invoke",
        fn:
          window.Ari
            ?.openAIReasoningClient
            ?.invoke,
        context:
          window.Ari
            ?.openAIReasoningClient ||
          null
      },
      {
        source:
          "Ari.openAIReasoningClient.reason",
        fn:
          window.Ari
            ?.openAIReasoningClient
            ?.reason,
        context:
          window.Ari
            ?.openAIReasoningClient ||
          null
      },
      {
        source:
          "AriOpenAIClient.generateStructured",
        fn:
          window
            .AriOpenAIClient
            ?.generateStructured,
        context:
          window
            .AriOpenAIClient ||
          null
      },
      {
        source:
          "AriOpenAIClient.reason",
        fn:
          window
            .AriOpenAIClient
            ?.reason,
        context:
          window
            .AriOpenAIClient ||
          null
      },
      {
        source:
          "AriOpenAIClient.createResponse",
        fn:
          window
            .AriOpenAIClient
            ?.createResponse,
        context:
          window
            .AriOpenAIClient ||
          null
      }
    ];

    const selected =
      candidates.find(
        candidate =>
          typeof candidate.fn ===
          "function"
      ) ||
      null;

    if (!selected) {
      return null;
    }

    return {
      source:
        selected.source,

      invoke:
        payload =>
          selected.fn.call(
            selected.context,
            payload
          )
    };
  },

  buildModelInvocationDiagnostic({
    available = false,
    attempted = false,
    succeeded = false,
    source = null,
    durationMs = null,
    error = null
  } = {}) {
    return {
      invokerAvailable:
        available === true,

      invokerSource:
        source ||
        null,

      attempted:
        attempted === true,

      succeeded:
        succeeded === true,

      durationMs:
        Number.isFinite(
          Number(
            durationMs
          )
        )
          ? Number(
              durationMs
            )
          : null,

      error:
        error ||
        null
    };
  },

  getReasoningInstructions(
    operationContract = null
  ) {
    const contract =
      operationContract ||
      this.getOperationContract();

    const allowedOperations =
      this.arrayOrEmpty(
        contract
          ?.allowedOperations
      );

    const allowedOperationText =
      allowedOperations.length
        ? allowedOperations.join(", ")
        : "Use only an operation explicitly provided by the operation contract.";

    return [
      "Use the complete evidence packet to interpret the user's current request.",

      "Treat safety, routing, response constraints, required behaviors, and forbidden behaviors as binding.",

      "Treat upstream semantic labels as evidence, not as unquestionable conclusions.",

      "Treat knowledge-router output as supporting evidence, not as prewritten final language.",

      "Distinguish stored memory, stored system knowledge, live-verified evidence, developer evidence, and general model knowledge.",

      "Do not assume retrieved or model-generated knowledge is verified unless the evidence packet identifies it as verified.",

      "Resolve meaning by considering the current turn, recent conversation, continuity evidence, memory, knowledge evidence, situation, understanding signals, and developer evidence together.",

      "Apply supplied userPreferences and responseStyle when they do not conflict with safety or explicit response constraints.",

      "Current-turn responseStyle overrides persistent userPreferences.",

      "Communication style controls tone, directness, warmth, humor, formality, verbosity, personality, and ordinary profanity.",

      "Do not treat a request for ordinary profanity, bluntness, humor, teasing, or casual language as a safety violation by itself.",

      "Do not produce a generic respectful-language refusal merely because ordinary profanity was requested or allowed.",

      "Use permitted profanity naturally and proportionately. Do not force profanity into every response.",

      "Do not use style preferences to justify slurs, threats, hateful degradation, abusive harassment, or unsafe content.",

      "Do not claim communication preferences were saved or persisted.",

      "Record the style actually used in responseRequirements.styleApplied when practical.",

      "The semanticFrame.operation field is a closed canonical vocabulary.",

      `semanticFrame.operation must be exactly one of: ${allowedOperationText}`,

      "Do not invent operation names.",

      "Do not include the subject, target, domain, medical condition, file name, or artifact name inside semanticFrame.operation.",

      "Place the domain in semanticFrame.domain.",

      "Place the subject or concept in semanticFrame.object, semanticFrame.target, or another appropriate semantic slot.",

      "Populate semanticFrame.requestType, semanticFrame.frameType, semanticFrame.interactionFamily, semanticFrame.intentFamily, semanticFrame.requestedOutput, semanticFrame.domain, semanticFrame.ambiguity, and semanticFrame.execution.",

      "For a definition or conceptual explanation request such as 'What is heart failure?', use explain_or_teach.",

      "For a direct factual value such as 'What is a normal ejection fraction?', use provide_information.",

      "For a meaning question such as 'What does ejection fraction mean?', use interpret_meaning.",

      "Do not provide private chain-of-thought or hidden reasoning. Return concise conclusions, evidence references, assumptions, uncertainties, and decision rationale only.",

      "Do not claim that an action, tool call, message, file change, or external operation has occurred.",

      "Any action must be returned only as a proposed action.",

      "Build one coherent interpretation, semantic frame, response requirements, and complete authoritative user-facing draft.",

      "The draftResponse field is required.",

      "draftResponse must directly answer the user's current request.",

      "draftResponse must be complete, natural, user-facing language.",

      "draftResponse must follow all safety, evidence, routing, tone, style, and response constraints.",

      "draftResponse must not mention internal pipeline stages, schemas, hidden reasoning, or implementation details unless the user is explicitly asking about them.",

      "Response requirements should define the goal, shape, tone, required moves, prohibited moves, required behaviors, forbidden behaviors, constraints, clarification requirements, action requirements, and style applied.",

      "Use an empty array or empty object only for optional collection fields when no value applies.",

      "Return only data conforming to the supplied response schema."
    ];
  },

  /* =====================================================
     REQUEST VALIDATION
  ===================================================== */

  validateReasoningRequest(request = {}) {
    const errors = [];
    const warnings = [];

    if (
      !request ||
      typeof request !==
        "object" ||
      Array.isArray(request)
    ) {
      return {
        valid:
          false,

        errors: [
          "reasoning_request_must_be_an_object"
        ],

        warnings
      };
    }

    if (
      request.schema !==
      this.requestSchema
    ) {
      errors.push(
        "invalid_reasoning_request_schema"
      );
    }

    const effectiveText =
      request.request?.effective ||
      request.resolvedUserQuestion ||
      request.currentTurn
        ?.effectiveText;

    if (
      typeof effectiveText !==
        "string" ||
      !effectiveText.trim()
    ) {
      errors.push(
        "missing_effective_user_request"
      );
    }

    if (
      request.authority
        ?.safetyIsBinding !==
        true
    ) {
      errors.push(
        "safety_authority_must_be_binding"
      );
    }

    if (
      request.authority
        ?.mayDraftResponse !==
        true
    ) {
      errors.push(
        "authoritative_draft_permission_required"
      );
    }

    if (
      request.authority
        ?.mustProduceDraftResponse !==
        true
    ) {
      errors.push(
        "authoritative_draft_requirement_missing"
      );
    }

    if (
      request.authority
        ?.mayExecuteActions ===
        true
    ) {
      errors.push(
        "model_may_not_execute_actions"
      );
    }

    if (
      request.authority
        ?.mayPersistState ===
        true
    ) {
      errors.push(
        "model_may_not_persist_state"
      );
    }

    if (
      request.authority
        ?.mayOverrideSafety ===
        true
    ) {
      errors.push(
        "model_may_not_override_safety"
      );
    }

    if (
      request.authority
        ?.mayClaimToolSuccess ===
        true
    ) {
      errors.push(
        "model_may_not_claim_tool_success"
      );
    }

    if (
      request.authority
        ?.mayExposePrivateChainOfThought ===
        true
    ) {
      errors.push(
        "model_may_not_expose_private_chain_of_thought"
      );
    }

    if (
      !this.isPlainObject(
        request.userPreferences
      )
    ) {
      errors.push(
        "user_preferences_must_be_an_object"
      );
    }

    if (
      !this.isPlainObject(
        request.responseStyle
      )
    ) {
      errors.push(
        "response_style_must_be_an_object"
      );
    }

    if (
      !this.hasKeys(
        request.userPreferences
      )
    ) {
      warnings.push(
        "user_preferences_not_supplied"
      );
    }

    if (
      !this.hasKeys(
        request.responseStyle
      )
    ) {
      warnings.push(
        "response_style_not_supplied"
      );
    }

    const operationRegistry =
      this.getOperationRegistry();

    const operationContract =
      this.getOperationContract();

    if (
      !operationRegistry ||
      typeof operationRegistry
        .normalizeOperation !==
        "function" ||
      typeof operationRegistry
        .getOperation !==
        "function" ||
      operationContract
        ?.registryAvailable !==
        true ||
      !this.arrayOrEmpty(
        operationContract
          ?.allowedOperations
      ).length
    ) {
      errors.push(
        "operation_registry_not_ready"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors,
      warnings
    };
  },

  /* =====================================================
     RESPONSE CONTRACT
  ===================================================== */

  getResponseSchema(
    operationContract = null
  ) {
    const contract =
      operationContract ||
      this.getOperationContract();

    const allowedOperations =
      this.arrayOrEmpty(
        contract
          ?.allowedOperations
      );

    return {
      schema:
        this.resultSchema,

      schemaVersion:
        this.resultSchemaVersion,

      required: [
        "ready",
        "interpretation",
        "reasoningDecision",
        "semanticFrame",
        "responseRequirements",
        "draftResponse",
        "grounding",
        "confidence"
      ],

      properties: {
        ready: {
          type:
            "boolean"
        },

        interpretation: {
          type:
            "object"
        },

        reasoningDecision: {
          type:
            "object"
        },

        semanticFrame: {
          type:
            "object",

          required: [
            "operation",
            "requestType",
            "frameType",
            "interactionFamily",
            "intentFamily",
            "requestedOutput",
            "domain",
            "ambiguity",
            "execution"
          ],

          properties: {
            operation: {
              type:
                "string",

              ...(allowedOperations.length
                ? {
                    enum:
                      allowedOperations
                  }
                : {})
            },

            requestType: {
              type:
                "string"
            },

            frameType: {
              type:
                "string"
            },

            interactionFamily: {
              type:
                "string"
            },

            intentFamily: {
              type:
                "string"
            },

            requestedOutput: {
              type:
                "string"
            },

            domain: {
              type: [
                "string",
                "object"
              ]
            },

            ambiguity: {
              type:
                "object"
            },

            execution: {
              type:
                "object"
            }
          }
        },

        responseRequirements: {
          type:
            "object",

          properties: {
            styleApplied: {
              type:
                "object",

              properties: {
                source: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                tone: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                directness: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                warmth: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                humor: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                formality: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                verbosity: {
                  type: [
                    "string",
                    "null"
                  ]
                },

                profanityLevel: {
                  type: [
                    "string",
                    "null"
                  ]
                }
              }
            }
          }
        },

        draftResponse: {
          type:
            "string",

          minLength:
            1
        },

        caseModel: {
          type:
            "object"
        },

        options: {
          type:
            "array"
        },

        tradeoffs: {
          type:
            "array"
        },

        uncertainties: {
          type:
            "array"
        },

        evidenceReferences: {
          type:
            "array"
        },

        executionMetadata: {
          type:
            "object"
        },

        grounding: {
          type:
            "object"
        },

        confidence: {
          type:
            "number",

          minimum:
            0,

          maximum:
            1
        }
      },

      constraints: {
        actionsAreProposalsOnly:
          true,

        neverOverrideSafety:
          true,

        neverClaimExecution:
          true,

        neverPersistState:
          true,

        neverAuthorizeDelivery:
          true,

        neverReturnPrivateChainOfThought:
          true,

        authoritativeDraftRequired:
          true,

        communicationStyleMayBeApplied:
          true,

        currentTurnStyleOverridesPersistentPreferences:
          true
      }
    };
  },

  /* =====================================================
     RESULT VALIDATION AND NORMALIZATION
  ===================================================== */

  validateAndNormalizeResult({
    rawResult = {},
    request = {}
  } = {}) {
    const value =
      this.extractModelValue(
        rawResult
      );

    const validationErrors = [];

    const interpretation =
      this.objectOrEmpty(
        value.interpretation
      );

    const reasoningDecision =
      this.objectOrEmpty(
        value.reasoningDecision ||
        value.decision
      );

    const rawSemanticFrame =
      this.objectOrEmpty(
        value.semanticFrame
      );

    const semanticFrame =
      this.normalizeSemanticFrame(
        rawSemanticFrame
      );

    const caseModel =
      this.objectOrEmpty(
        value.caseModel
      );

    const responseRequirements =
      this.objectOrEmpty(
        value.responseRequirements ||
        value.responseStrategy
      );

    const grounding =
      this.objectOrEmpty(
        value.grounding
      );

    const draftResponse =
      this.firstNonEmptyString([
        value.authoritativeDraft,
        value.draftResponse,
        value.responseText,
        value.finalResponse,
        value.answer,
        value.reply
      ]);

    if (
      !Object.keys(
        interpretation
      ).length
    ) {
      validationErrors.push(
        "missing_interpretation"
      );
    }

    if (
      !Object.keys(
        reasoningDecision
      ).length
    ) {
      validationErrors.push(
        "missing_reasoning_decision"
      );
    }

    if (
      !this.isUsableSemanticFrame(
        semanticFrame
      )
    ) {
      validationErrors.push(
        "missing_semantic_frame"
      );
    }

    const operationResolution =
      this.resolveOperationDefinition(
        semanticFrame.operation
      );

    if (!operationResolution.recognized) {
      validationErrors.push(
        "semantic_operation_not_registered"
      );
    }

    if (
      !this.isUsableResponseRequirements(
        responseRequirements
      )
    ) {
      validationErrors.push(
        "missing_response_requirements"
      );
    }

    if (!draftResponse) {
      validationErrors.push(
        "authoritative_draft_missing"
      );
    }

    const proposedActions =
      this.normalizeProposedActions(
        reasoningDecision
          .proposedActions ||
        value.proposedActions
      );

    const safetyConflict =
      this.detectSafetyConflict({
        request,
        reasoningDecision,
        responseRequirements
      });

    if (safetyConflict) {
      validationErrors.push(
        safetyConflict
      );
    }

    const executionConflict =
      this.detectExecutionConflict({
        reasoningDecision,
        proposedActions,
        value
      });

    if (executionConflict) {
      validationErrors.push(
        executionConflict
      );
    }

    const confidence =
      this.normalizeConfidence(
        value.confidence
      );

    const ready =
      value.ready !== false &&
      validationErrors.length ===
        0;

    const normalizedResponseRequirements =
      this.normalizeResponseRequirements(
        responseRequirements,
        request
      );

    return {
      schema:
        this.resultSchema,

      schemaVersion:
        this.resultSchemaVersion,

      ready,

      authoritative:
        ready,

      interpretation:
        this.normalizeInterpretation(
          interpretation,
          semanticFrame.operation
        ),

      reasoningDecision:
        this.normalizeReasoningDecision({
          reasoningDecision,
          proposedActions
        }),

      semanticFrame,

      caseModel,

      options:
        this.normalizeOptions(
          value.options
        ),

      tradeoffs:
        this.normalizeTradeoffs(
          value.tradeoffs
        ),

      uncertainties:
        this.normalizeUncertainties(
          value.uncertainties ||
          value.unknowns
        ),

      responseRequirements:
        normalizedResponseRequirements,

      responseStrategy:
        normalizedResponseRequirements,

      draftResponse,

      authoritativeDraft:
        draftResponse,

      executionMetadata:
        this.normalizeExecutionMetadata({
          value:
            value.executionMetadata,

          request,

          confidence
        }),

      evidenceReferences:
        this.normalizeEvidenceReferences(
          value.evidenceReferences ||
          grounding.evidenceUsed
        ),

      grounding:
        this.normalizeGrounding(
          grounding
        ),

      confidence,

      styleContext: {
        userPreferences:
          this.objectOrEmpty(
            request.userPreferences
          ),

        responseStyle:
          this.objectOrEmpty(
            request.responseStyle
          ),

        styleApplied:
          normalizedResponseRequirements
            .styleApplied
      },

      validation: {
        passed:
          validationErrors.length ===
          0,

        errors:
          this.cleanStringList(
            validationErrors
          )
      },

      source:
        value.source ||
        rawResult?.source ||
        "openai-cognitive-reasoning",

      authority:
        ready
          ? "authoritative_cognitive_reasoning_and_draft"
          : "none"
    };
  },

  extractModelValue(rawResult = {}) {
    if (
      typeof rawResult ===
        "string"
    ) {
      return this.parseStructuredValue(
        rawResult
      );
    }

    if (
      !rawResult ||
      typeof rawResult !==
        "object" ||
      Array.isArray(rawResult)
    ) {
      return {};
    }

    const candidates = [
      rawResult
        .cognitiveReasoningResult,

      rawResult
        .reasoningResult,

      rawResult.result
        ?.cognitiveReasoningResult,

      rawResult.result
        ?.reasoningResult,

      rawResult.result,

      rawResult.output
        ?.cognitiveReasoningResult,

      rawResult.output
        ?.reasoningResult,

      rawResult.output,

      rawResult
        .structuredOutput,

      rawResult.parsed,

      rawResult.response,

      rawResult.data,

      rawResult.rawContent,

      rawResult.output_text,

      rawResult.outputText,

      rawResult.responseText,

      rawResult.content,

      rawResult.text
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(candidate)
      ) {
        return candidate;
      }

      if (
        typeof candidate ===
          "string"
      ) {
        const parsed =
          this.parseStructuredValue(
            candidate
          );

        if (
          Object.keys(parsed).length
        ) {
          return parsed;
        }
      }
    }

    return this.objectOrEmpty(
      rawResult
    );
  },

  parseStructuredValue(value = "") {
    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {
      return {};
    }

    const clean =
      value
        .trim()
        .replace(
          /^```(?:json)?\s*/i,
          ""
        )
        .replace(
          /\s*```$/,
          ""
        )
        .trim();

    try {
      return this.objectOrEmpty(
        JSON.parse(clean)
      );
    } catch {
      return {};
    }
  },

  isUsableSemanticFrame(
    semanticFrame = {}
  ) {
    if (
      !semanticFrame ||
      typeof semanticFrame !==
        "object" ||
      Array.isArray(
        semanticFrame
      )
    ) {
      return false;
    }

    return Boolean(
      this.nullableString(
        semanticFrame.operation
      ) ||
      semanticFrame.target != null ||
      this.nullableString(
        semanticFrame.domain
      ) ||
      this.nullableString(
        semanticFrame.primaryLane
      ) ||
      this.nullableString(
        semanticFrame.requestedOutput
      ) ||
      this.nullableString(
        semanticFrame.semanticSummary
      ) ||
      this.nullableString(
        semanticFrame.primaryIntent
      ) ||
      this.nullableString(
        semanticFrame.userGoal
      ) ||
      this.nullableString(
        semanticFrame.currentTurnMeaning
      ) ||
      this.arrayOrEmpty(
        semanticFrame.constraints
      ).length
    );
  },

  isUsableResponseRequirements(
    requirements = {}
  ) {
    if (
      !requirements ||
      typeof requirements !==
        "object" ||
      Array.isArray(
        requirements
      )
    ) {
      return false;
    }

    return Boolean(
      this.nullableString(
        requirements.goal ||
        requirements.responseGoal
      ) ||
      this.nullableString(
        requirements.shape
      ) ||
      this.nullableString(
        requirements.tone
      ) ||
      this.arrayOrEmpty(
        requirements.requiredMoves ||
        requirements.orderedPoints
      ).length ||
      this.arrayOrEmpty(
        requirements.prohibitedMoves
      ).length ||
      this.arrayOrEmpty(
        requirements.requiredBehaviors
      ).length ||
      this.arrayOrEmpty(
        requirements.forbiddenBehaviors
      ).length ||
      this.arrayOrEmpty(
        requirements.constraints
      ).length ||
      requirements
        .clarificationRequired ===
        true ||
      requirements
        .actionRequired ===
        true
    );
  },

  detectSafetyConflict({
    request = {},
    reasoningDecision = {},
    responseRequirements = {}
  } = {}) {
    const safety =
      request.safety ||
      request.safetyStagePacket ||
      {};

    const shouldStop =
      safety.shouldStopNormalResponse ===
        true ||
      safety
        .safetyShouldStopNormalResponse ===
        true ||
      safety.disposition
        ?.shouldStopNormalResponse ===
        true;

    if (!shouldStop) {
      return null;
    }

    const safetyLimited =
      reasoningDecision.reasoningMode ===
        "safety_limited" ||
      responseRequirements.mode ===
        "safety_limited" ||
      this.arrayOrEmpty(
        responseRequirements
          .safetyRequirements
      ).length > 0;

    if (
      reasoningDecision.answerDirectly ===
        true &&
      !safetyLimited
    ) {
      return "safety_contract_conflict";
    }

    return null;
  },

  detectExecutionConflict({
    reasoningDecision = {},
    proposedActions = [],
    value = {}
  } = {}) {
    const rawActions =
      this.arrayOrEmpty(
        reasoningDecision
          .proposedActions ||
        value.proposedActions
      );

    const claimedExecution =
      rawActions.some(
        action =>
          action &&
          typeof action ===
            "object" &&
          (
            action.executed ===
              true ||
            action.completed ===
              true ||
            action.status ===
              "completed" ||
            action.status ===
              "executed" ||
            action.status ===
              "success"
          )
      );

    if (claimedExecution) {
      return "model_claimed_action_execution";
    }

    const normalizedConflict =
      proposedActions.some(
        action =>
          action.executed ===
            true ||
          action.status ===
            "completed" ||
          action.status ===
            "executed"
      );

    return normalizedConflict
      ? "model_claimed_action_execution"
      : null;
  },

  normalizeInterpretation(
    interpretation = {},
    semanticOperation = null
  ) {
    const canonicalOperation =
      this.normalizeOperation(
        semanticOperation ||
        interpretation.operation
      );

    return {
      conversationFunction:
        this.nullableString(
          interpretation
            .conversationFunction
        ),

      userGoal:
        this.nullableString(
          interpretation.userGoal
        ),

      operation:
        canonicalOperation,

      meaning:
        this.nullableString(
          interpretation.meaning ||
          interpretation
            .primaryMeaning
        ),

      subjects:
        this.stringArray(
          interpretation.subjects
        ),

      contextUsed:
        interpretation.contextUsed ===
        true,

      clarificationRequired:
        interpretation
          .clarificationRequired ===
        true,

      clarificationQuestion:
        this.nullableString(
          interpretation
            .clarificationQuestion
        ),

      ambiguity:
        this.stringArray(
          interpretation.ambiguity
        )
    };
  },

  normalizeReasoningDecision({
    reasoningDecision = {},
    proposedActions = []
  } = {}) {
    return {
      answerDirectly:
        reasoningDecision
          .answerDirectly !==
        false,

      reasoningMode:
        this.nullableString(
          reasoningDecision
            .reasoningMode
        ) ||
        "analysis",

      toolsNeeded:
        this.stringArray(
          reasoningDecision
            .toolsNeeded
        ),

      proposedActions,

      decisionRationale:
        this.nullableString(
          reasoningDecision
            .decisionRationale
        ),

      shouldAskClarifyingQuestion:
        reasoningDecision
          .shouldAskClarifyingQuestion ===
        true
    };
  },

  normalizeSemanticFrame(
    semanticFrame = {}
  ) {
    const operationResolution =
      this.resolveOperationDefinition(
        semanticFrame.operation
      );

    const canonicalOperation =
      operationResolution
        .canonicalOperation;

    const definition =
      operationResolution
        .definition ||
      {};

    const modelExecution =
      this.objectOrEmpty(
        semanticFrame.execution
      );

    return {
      ...semanticFrame,

      operation:
        canonicalOperation ||
        this.nullableString(
          semanticFrame.operation
        ),

      requestType:
        this.nullableString(
          semanticFrame.requestType ||
          definition.requestType
        ),

      frameType:
        this.nullableString(
          semanticFrame.frameType ||
          definition.frameType
        ),

      interactionFamily:
        this.nullableString(
          semanticFrame
            .interactionFamily ||
          definition
            .interactionFamily
        ),

      intentFamily:
        this.nullableString(
          semanticFrame
            .intentFamily ||
          definition.intentFamily
        ),

      requestedOutput:
        this.nullableString(
          semanticFrame
            .requestedOutput ||
          definition
            .defaultRequestedOutput
        ),

      domain:
        semanticFrame.domain ??
        definition.defaultDomain ??
        null,

      target:
        semanticFrame.target ??
        null,

      object:
        semanticFrame.object ??
        null,

      subject:
        semanticFrame.subject ??
        null,

      primaryLane:
        this.nullableString(
          semanticFrame.primaryLane
        ),

      constraints:
        this.arrayOrEmpty(
          semanticFrame.constraints
        ),

      continuity:
        this.objectOrDefault(
          semanticFrame.continuity,
          {
            requiresPriorContext:
              false,

            referencePresent:
              false,

            referenceResolved:
              false,

            missingAnchor:
              false
          }
        ),

      ambiguity:
        this.objectOrDefault(
          semanticFrame.ambiguity,
          {
            present:
              false,

            requiresClarification:
              false,

            reason:
              null,

            unresolvedSlots:
              [],

            competingInterpretations:
              [],

            clarificationQuestion:
              null
          }
        ),

      execution: {
        ...modelExecution,

        executionRequested:
          modelExecution
            .executionRequested ===
          true,

        executionKind:
          this.nullableString(
            modelExecution
              .executionKind
          ) ||
          definition.executionKind ||
          null,

        executionAllowed:
          false,

        analysisOnly:
          true,

        prohibitedOperations:
          this.stringArray(
            modelExecution
              .prohibitedOperations
          ),

        deferredOperations:
          this.stringArray(
            modelExecution
              .deferredOperations
          )
      },

      operationResolution: {
        rawOperation:
          operationResolution
            .rawOperation,

        canonicalOperation:
          operationResolution
            .canonicalOperation,

        recognized:
          operationResolution
            .recognized,

        normalizedByRegistry:
          Boolean(
            operationResolution
              .recognized &&
            operationResolution
              .rawOperation !==
              operationResolution
                .canonicalOperation
          ),

        registryVersion:
          this.getOperationRegistry()
            ?.version ||
          null
      }