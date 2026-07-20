// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
//
// Purpose:
// Build the canonical cognitive evidence packet,
// invoke OpenAI as ARI's authoritative reasoning engine,
// validate the structured result,
// and expose a safe compatibility contract.
//
// V9.3.0 — Registry-Bound Semantic Operations
//
// Authority model:
//
// ARI:
// - gathers evidence
// - defines binding safety and execution constraints
// - validates model output
// - controls tools, persistence, realization, and delivery
//
// OpenAI:
// - interprets user meaning
// - builds the semantic frame
// - analyzes the situation
// - proposes decisions and actions
// - defines semantic response requirements
// - does not draft final response language
//
// OpenAI may propose actions.
// OpenAI may not execute actions, persist state,
// claim tool success, override safety,
// or authorize final delivery.
//
// Responsibilities:
// - Build one canonical reasoning request.
// - Preserve current-turn and conversation context.
// - Preserve routing, safety, continuity, memory, knowledge,
//   evidence, and developer context.
// - Resolve an approved OpenAI reasoning invoker.
// - Invoke OpenAI exactly once per reasoning execution.
// - Validate and normalize structured cognitive output.
// - Reject unsafe or falsely executed action claims.
// - Return semantic response requirements for downstream planning.
// - Return transparent invocation and validation diagnostics.
//
// Non-responsibilities:
// - Does not execute actions.
// - Does not call tools directly.
// - Does not persist memory or runtime state.
// - Does not authorize delivery.
// - Does not produce final delivered language.
// - Does not replace the Response Planning Stage.
// - Does not replace the Response Realization Engine.
// - Does not expose private chain-of-thought.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "9.3.0",

  source: "ari-reasoning-engine",

  requestSchema:
    "ari_cognitive_reasoning_request",

  requestSchemaVersion:
    "1.1.3",

  resultSchema:
    "ari_cognitive_reasoning_result",

  resultSchemaVersion:
    "1.1.3",

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

console.log(
  "ARI REASONING ENGINE REQUEST DIAGNOSTIC:",
  {
    requestSchema:
      reasoningRequest?.schema ||
      null,

    requestSchemaVersion:
      reasoningRequest?.schemaVersion ||
      null,

    effectiveText:
      reasoningRequest
        ?.request
        ?.effective ||
      reasoningRequest
        ?.resolvedUserQuestion ||
      reasoningRequest
        ?.currentTurn
        ?.effectiveText ||
      null,

    authority:
      reasoningRequest?.authority ||
      null,

    requestValidation
  }
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

console.log(
  "ARI REASONING ENGINE INVOKER DIAGNOSTIC:",
  {
    available:
      Boolean(
        modelInvoker
      ),

    source:
      modelInvoker?.source ||
      null,

    injectedInvokerType:
      typeof summary
        .openAIReasoningInvoker,

    requestInvokerType:
      typeof reasoningRequest
        ?.openAIReasoningInvoker,

    globalClientAvailable:
      Boolean(
        window.AriOpenAIReasoningClient
      ),

    globalClientVersion:
      window.AriOpenAIReasoningClient
        ?.version ||
      null,

    globalClientMethods: {
      invoke:
        typeof window
          .AriOpenAIReasoningClient
          ?.invoke ===
        "function",

      reason:
        typeof window
          .AriOpenAIReasoningClient
          ?.reason ===
        "function",

      run:
        typeof window
          .AriOpenAIReasoningClient
          ?.run ===
        "function",

      create:
        typeof window
          .AriOpenAIReasoningClient
          ?.create ===
        "function",

      request:
        typeof window
          .AriOpenAIReasoningClient
          ?.request ===
        "function"
    }
  }
);

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
           * Compatibility alias for older clients
           * that still expect payload.request.
           */
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
          normalizedResult.ready ===
          true,

        source:
          modelInvoker.source,

        durationMs:
          Date.now() -
          invocationStartedAt,

        error:
          normalizedResult.ready ===
            true
            ? null
            : this.firstString(
                normalizedResult
                  .validation
                  ?.errors
              )
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

    const currentTurn = {
      originalText:
        request.original,

      effectiveText:
        request.effective,

      turnId:
        request.turnId
    };

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

      conversation:
        this.buildConversationContext(
          summary
        ),

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

      responseControl:
        this.buildResponseControl(
          summary
        ),

      capabilities:
        this.buildCapabilityContext(
          summary
        ),

      authority:
  this.buildAuthorityContract(),

operationContract:
  this.getOperationContract(),

outputContract:
  this.getResponseSchema(
    this.getOperationContract()
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

    return {
      schema:
        request.schema ||
        this.requestSchema,

      schemaVersion:
        request.schemaVersion ||
        this.requestSchemaVersion,

      action:
        request.action ||
        "openai_reasoning",

      currentTurn: {
        originalText:
          original,

        effectiveText:
          effective,

        turnId
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
        )
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
        )
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
          false,

        mayDraftResponse:
          false,

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

      operationContract:
  request.operationContract ||
  this.getOperationContract(),

outputContract:
  request.outputContract ||
  this.getResponseSchema(
    request.operationContract ||
    this.getOperationContract()
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

        mayWriteFinalResponse:
          false,

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

      mayPlanResponse:
        false,

      mayDraftResponse:
        false,

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

  normalizeOperation(
    value = ""
  ) {
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

  resolveOperationDefinition(
    value = ""
  ) {
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

      "Treat knowledge-router output as supporting evidence, not as final response language.",

      "Distinguish stored memory, stored system knowledge, live-verified evidence, developer evidence, and general model knowledge.",

      "Do not assume retrieved or model-generated knowledge is verified unless the evidence packet identifies it as verified.",

      "Resolve meaning by considering the current turn, recent conversation, continuity evidence, memory, knowledge evidence, situation, understanding signals, and developer evidence together.",

      "The semanticFrame.operation field is a closed canonical vocabulary.",

      `semanticFrame.operation must be exactly one of: ${allowedOperationText}`,

      "Do not invent operation names.",

      "Do not emit natural-language synonyms such as define, describe, answer_question, diagnose_issue, summarize, or medical_explanation when a canonical operation is available.",

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

      "Build one coherent interpretation, semantic frame, and set of semantic response requirements.",

      "Response requirements should define the goal, shape, tone, required moves, prohibited moves, required behaviors, forbidden behaviors, constraints, clarification requirements, and action requirements.",

      "Do not write the final response and do not return a provisional response draft.",

      "Use an empty array or empty object only for optional collection fields when no value applies.",

      "Return only data conforming to the supplied response schema."
    ];
  },

  /* =====================================================
     REQUEST VALIDATION
  ===================================================== */

  validateReasoningRequest(request = {}) {
    const errors = [];

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
        ]
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

      errors
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
            "object",

          expectedFields: [
            "conversationFunction",
            "userGoal",
            "operation",
            "meaning",
            "subjects",
            "clarificationRequired",
            "clarificationQuestion"
          ]
        },

        reasoningDecision: {
          type:
            "object",

          expectedFields: [
            "answerDirectly",
            "reasoningMode",
            "toolsNeeded",
            "proposedActions",
            "decisionRationale"
          ]
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

  expectedFields: [
    "operation",
    "requestType",
    "frameType",
    "interactionFamily",
    "intentFamily",
    "requestedOutput",
    "domain",
    "participants",
    "subject",
    "object",
    "target",
    "artifactTarget",
    "referent",
    "options",
    "criteria",
    "timeframe",
    "audience",
    "location",
    "contextModifiers",
    "constraints",
    "stakes",
    "continuity",
    "ambiguity",
    "execution",
    "secondaryRequests",
    "confidence",
    "evidenceRefs",
    "grounding",
    "authority"
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

          expectedFields: [
            "goal",
            "shape",
            "tone",
            "requiredMoves",
            "prohibitedMoves",
            "requiredBehaviors",
            "forbiddenBehaviors",
            "constraints",
            "safetyRequirements",
            "continuityRequirements",
            "toneRequirements",
            "clarificationRequired",
            "clarificationQuestion",
            "actionRequired"
          ]
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
            "object",

          expectedFields: [
            "confidence",
            "reasoningMode",
            "usedCurrentTurn",
            "usedPriorContext",
            "usedEvidence",
            "evidenceCount"
          ]
        },

        grounding: {
          type:
            "object",

          expectedFields: [
            "evidenceUsed",
            "assumptions",
            "unresolvedConflicts"
          ]
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

        neverWriteFinalResponse:
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
        responseRequirements
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

      /*
       * Compatibility alias for modules that have
       * not yet migrated from responseStrategy.
       */
      responseStrategy:
        normalizedResponseRequirements,

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

      draftResponse:
        "",

      grounding:
        this.normalizeGrounding(
          grounding
        ),

      confidence,

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
          ? "semantic_interpretation_and_response_requirements"
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

    for (
      const candidate
      of candidates
    ) {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(
          candidate
        )
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
          Object.keys(
            parsed
          ).length
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
        JSON.parse(
          clean
        )
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
    };
  },

  normalizeResponseRequirements(
    requirements = {}
  ) {
    return {
      goal:
  this.nullableString(
    requirements.goal ||
    requirements.responseGoal
  ),

      shape:
        this.nullableString(
          requirements.shape
        ) ||
        "single_lane",

      tone:
        this.nullableString(
          requirements.tone
        ),

      requiredMoves:
        this.arrayOrEmpty(
          requirements.requiredMoves ||
          requirements.orderedPoints
        ),

      prohibitedMoves:
        this.stringArray(
          requirements.prohibitedMoves
        ),

      requiredBehaviors:
        this.stringArray(
          requirements.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.stringArray(
          requirements.forbiddenBehaviors
        ),

      constraints:
        this.stringArray(
          requirements.constraints
        ),

      safetyRequirements:
        this.stringArray(
          requirements.safetyRequirements
        ),

      continuityRequirements:
        this.stringArray(
          requirements
            .continuityRequirements
        ),

      toneRequirements:
        this.stringArray(
          requirements.toneRequirements
        ),

      clarificationRequired:
        requirements
          .clarificationRequired ===
        true,

      clarificationQuestion:
        this.nullableString(
          requirements
            .clarificationQuestion
        ),

      actionRequired:
        requirements.actionRequired ===
        true
    };
  },

  normalizeExecutionMetadata({
    value = {},
    request = {},
    confidence = 0
  } = {}) {
    const metadata =
      this.objectOrEmpty(
        value
      );

    const evidenceReferences =
      this.arrayOrEmpty(
        request.evidencePacket
          ?.evidenceReferences ||
        request.evidencePacket
          ?.evidence ||
        request.evidencePacket
          ?.items
      );

    return {
      confidence:
        this.normalizeConfidence(
          metadata.confidence ??
          confidence
        ),

      reasoningMode:
        this.nullableString(
          metadata.reasoningMode
        ),

      usedCurrentTurn:
        metadata.usedCurrentTurn !==
        false,

      usedPriorContext:
        metadata.usedPriorContext ===
        true ||
        this.arrayOrEmpty(
          request.conversation
            ?.recentTurns
        ).length > 0,

      usedEvidence:
        metadata.usedEvidence ===
        true ||
        evidenceReferences.length > 0,

      evidenceCount:
        Number.isFinite(
          Number(
            metadata.evidenceCount
          )
        )
          ? Number(
              metadata.evidenceCount
            )
          : evidenceReferences.length
    };
  },

  normalizeEvidenceReferences(
    references
  ) {
    return this.arrayOrEmpty(
      references
    ).filter(
      reference =>
        reference !==
          undefined &&
      reference !==
        null
    );
  },

  normalizeGrounding(
    grounding = {}
  ) {
    return {
      evidenceUsed:
        this.arrayOrEmpty(
          grounding.evidenceUsed
        ),

      assumptions:
        this.arrayOrEmpty(
          grounding.assumptions
        ),

      unresolvedConflicts:
        this.arrayOrEmpty(
          grounding
            .unresolvedConflicts
        )
    };
  },

  normalizeOptions(options) {
    return this.arrayOrEmpty(
      options
    ).map(option => {
      if (
        typeof option ===
        "string"
      ) {
        return {
          label:
            option,

          benefits:
            [],

          risks:
            [],

          reversibility:
            null
        };
      }

      const value =
        this.objectOrEmpty(
          option
        );

      return {
        ...value,

        label:
          this.nullableString(
            value.label ||
            value.option ||
            value.name
          ),

        benefits:
          this.stringArray(
            value.benefits
          ),

        risks:
          this.stringArray(
            value.risks
          ),

        reversibility:
          this.nullableString(
            value.reversibility
          )
      };
    });
  },

  normalizeTradeoffs(tradeoffs) {
    return this.arrayOrEmpty(
      tradeoffs
    ).map(tradeoff => {
      if (
        typeof tradeoff ===
        "string"
      ) {
        return {
          description:
            tradeoff,

          sideA:
            null,

          sideB:
            null
        };
      }

      const value =
        this.objectOrEmpty(
          tradeoff
        );

      return {
        ...value,

        description:
          this.nullableString(
            value.description
          ),

        sideA:
          this.nullableString(
            value.sideA
          ),

        sideB:
          this.nullableString(
            value.sideB
          )
      };
    });
  },

  normalizeUncertainties(
    uncertainties
  ) {
    return this.arrayOrEmpty(
      uncertainties
    ).map(uncertainty => {
      if (
        typeof uncertainty ===
        "string"
      ) {
        return {
          description:
            uncertainty,

          material:
            true,

          resolution:
            null
        };
      }

      const value =
        this.objectOrEmpty(
          uncertainty
        );

      return {
        ...value,

        description:
          this.nullableString(
            value.description ||
            value.unknown
          ),

        material:
          value.material !==
          false,

        resolution:
          this.nullableString(
            value.resolution
          )
      };
    });
  },

  normalizeProposedActions(actions) {
    return this.arrayOrEmpty(
      actions
    )
      .filter(
        action =>
          action &&
          typeof action ===
            "object" &&
          !Array.isArray(
            action
          ) &&
          typeof action.type ===
            "string" &&
          action.type.trim()
      )
      .map(action => ({
        type:
          action.type.trim(),

        arguments:
          this.objectOrEmpty(
            action.arguments
          ),

        rationale:
          this.nullableString(
            action.rationale
          ),

        requiresApproval:
          action.requiresApproval !==
          false,

        executed:
          false,

        status:
          "proposed"
      }));
  },

  normalizeConfidence(value) {
    if (
      value &&
      typeof value ===
        "object"
    ) {
      return this.clampConfidence(
        value.score
      );
    }

    return this.clampConfidence(
      value
    );
  },

  /* =====================================================
     ENGINE RESPONSE CONSTRUCTION
  ===================================================== */

  buildEngineResult({
    cognitiveReasoningResult = {},
    request = {},
    engineRan = false,
    modelInvocation = {}
  } = {}) {
    const semanticFrame =
      cognitiveReasoningResult
        .semanticFrame ||
      null;

    const responseRequirements =
      cognitiveReasoningResult
        .responseRequirements ||
      null;

    const executionMetadata =
      cognitiveReasoningResult
        .executionMetadata ||
      null;

    const evidenceReferences =
      this.arrayOrEmpty(
        cognitiveReasoningResult
          .evidenceReferences
      );

    const ready =
      cognitiveReasoningResult
        .ready === true &&
      Boolean(
        semanticFrame
      ) &&
      Boolean(
        responseRequirements
      ) &&
      modelInvocation
        ?.succeeded !== false;

    return {
      reasoningEngineRan:
        engineRan === true,

      reasoningEngineReady:
        ready,

      reasoningEngineVersion:
        this.version,

      reasoningEngineSource:
        this.source,

      reasoningSource:
        cognitiveReasoningResult
          .source ||
        "openai-cognitive-reasoning",

      modelInvocation:
        this.objectOrEmpty(
          modelInvocation
        ),

      cognitiveReasoningResult,

      reasoningResult:
        cognitiveReasoningResult,

      semanticFrame,

      responseRequirements,

      executionMetadata,

      evidenceReferences,

      reasoning:
        ready
          ? {
              interpretation:
                cognitiveReasoningResult
                  .interpretation ||
                null,

              decision:
                cognitiveReasoningResult
                  .reasoningDecision ||
                null,

              semanticFrame,

              caseModel:
                cognitiveReasoningResult
                  .caseModel ||
                null,

              options:
                cognitiveReasoningResult
                  .options ||
                [],

              tradeoffs:
                cognitiveReasoningResult
                  .tradeoffs ||
                [],

              uncertainties:
                cognitiveReasoningResult
                  .uncertainties ||
                [],

              responseRequirements,

              responseStrategy:
                responseRequirements ||
                cognitiveReasoningResult
                  .responseStrategy ||
                null,

              grounding:
                cognitiveReasoningResult
                  .grounding ||
                null,

              capabilities:
                this.arrayOrEmpty(
                  request.capabilities
                    ?.required
                ),

              requiredCapabilities:
                this.arrayOrEmpty(
                  request.capabilities
                    ?.required
                ),

              requiredBehaviors:
                this.arrayOrEmpty(
                  responseRequirements
                    ?.requiredBehaviors
                ),

              forbiddenBehaviors:
                this.arrayOrEmpty(
                  responseRequirements
                    ?.forbiddenBehaviors
                ),

              constraints:
                this.arrayOrEmpty(
                  responseRequirements
                    ?.constraints
                ),

              confidence:
                cognitiveReasoningResult
                  .confidence ??
                0
            }
          : null,

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningConfidence:
        cognitiveReasoningResult
          .confidence ??
        0,

      reasoningPrimary:
        semanticFrame
          ?.primaryLane ||
        request.responseControl
          ?.primaryLane ||
        request.routing
          ?.primaryLane ||
        null,

      authority:
        ready
          ? "openai_cognitive_reasoning"
          : "none",

      reason:
        ready
          ? null
          : this.firstString(
              cognitiveReasoningResult
                .validation
                ?.errors
            ) ||
            "reasoning_result_not_ready"
    };
  },

  buildFailureResult({
    reason =
      "reasoning_failed",

    errors = [],

    request = {},

    engineRan = false,

    modelInvocation = {}
  } = {}) {
    const validationErrors =
      this.cleanStringList([
        reason,
        ...errors
      ]);

    const normalizedModelInvocation =
      this.objectOrEmpty(
        modelInvocation
      );

    const cognitiveReasoningResult = {
      schema:
        this.resultSchema,

      schemaVersion:
        this.resultSchemaVersion,

      ready:
        false,

      authoritative:
        false,

      interpretation:
        null,

      reasoningDecision:
        null,

      semanticFrame:
        null,

      responseRequirements:
        null,

      responseStrategy:
        null,

      executionMetadata:
        null,

      evidenceReferences:
        [],

      modelInvocation:
        normalizedModelInvocation,

      caseModel:
        null,

      options:
        [],

      tradeoffs:
        [],

      uncertainties:
        [],

      draftResponse:
        "",

      grounding:
        null,

      confidence:
        0,

      validation: {
        passed:
          false,

        errors:
          validationErrors
      },

      source:
        "ari-reasoning-engine-failure",

      authority:
        "none"
    };

    return {
      reasoningEngineRan:
        engineRan === true,

      reasoningEngineReady:
        false,

      reasoningEngineVersion:
        this.version,

      reasoningEngineSource:
        this.source,

      reasoningSource:
        "ari-reasoning-engine-failure",

      modelInvocation:
        normalizedModelInvocation,

      cognitiveReasoningResult,

      reasoningResult:
        cognitiveReasoningResult,

      semanticFrame:
        null,

      responseRequirements:
        null,

      executionMetadata:
        null,

      evidenceReferences:
        [],

      reasoning:
        null,

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningConfidence:
        0,

      reasoningPrimary:
        request.responseControl
          ?.primaryLane ||
        request.routing
          ?.primaryLane ||
        null,

      authority:
        "none",

      reason,

      errors:
        validationErrors
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
  const resolvedClient =
    this.resolveModelInvoker(
      {}
    );

  const operationRegistry =
    this.getOperationRegistry();

  const operationContract =
    this.getOperationContract();

  const allowedOperations =
    this.arrayOrEmpty(
      operationContract
        ?.allowedOperations
    );

  const operationRegistryReady =
    Boolean(
      operationRegistry &&
      typeof operationRegistry
        .normalizeOperation ===
        "function" &&
      typeof operationRegistry
        .getOperation ===
        "function" &&
      operationContract
        ?.registryAvailable ===
        true &&
      allowedOperations.length > 0
    );

  const structurallyValid =
    typeof this.reason ===
      "function" &&
    typeof this.create ===
      "function" &&
    typeof this.resolveModelInvoker ===
      "function" &&
    typeof this.validateAndNormalizeResult ===
      "function" &&
    typeof this.normalizeSemanticFrame ===
      "function";

  return {
    valid:
      structurallyValid,

    ready:
      structurallyValid &&
      Boolean(
        resolvedClient
      ) &&
      operationRegistryReady,

    modelInvokerAvailable:
      Boolean(
        resolvedClient
      ),

    modelInvokerSource:
      resolvedClient
        ?.source ||
      null,

    operationRegistryAvailable:
      Boolean(
        operationRegistry
      ),

    operationRegistryReady,

    operationRegistryVersion:
      operationRegistry
        ?.version ||
      null,

    operationContractAvailable:
      operationContract
        ?.registryAvailable ===
      true,

    allowedOperationCount:
      allowedOperations.length,

    source:
      this.source,

    version:
      this.version,

    requestSchema:
      this.requestSchema,

    requestSchemaVersion:
      this.requestSchemaVersion,

    resultSchema:
      this.resultSchema,

    resultSchemaVersion:
      this.resultSchemaVersion
  };
},

  /* =====================================================
     UTILITIES
  ===================================================== */

  objectOrEmpty(value) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  },

  objectOrDefault(
    value,
    defaults = {}
  ) {
    return {
      ...this.objectOrEmpty(
        defaults
      ),

      ...this.objectOrEmpty(
        value
      )
    };
  },

  arrayOrEmpty(value) {
    return Array.isArray(value)
      ? value.filter(
          item =>
            item !==
              undefined &&
            item !==
              null
        )
      : [];
  },

  stringArray(value) {
    return [
      ...new Set(
        this.arrayOrEmpty(
          value
        )
          .map(item =>
            typeof item ===
              "string"
              ? item.trim()
              : ""
          )
          .filter(Boolean)
      )
    ];
  },

  cleanStringList(value) {
    return [
      ...new Set(
        this.arrayOrEmpty(
          value
        )
          .map(item =>
            String(
              item ||
              ""
            ).trim()
          )
          .filter(Boolean)
      )
    ];
  },

  firstString(value) {
    if (
      typeof value ===
        "string"
    ) {
      return value.trim();
    }

    for (
      const item
      of this.arrayOrEmpty(
        value
      )
    ) {
      if (
        typeof item ===
          "string" &&
        item.trim()
      ) {
        return item.trim();
      }
    }

    return "";
  },

  firstNonEmptyString(
    values = []
  ) {
    for (
      const value of values
    ) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  },

  nullableString(value) {
    if (
      typeof value !==
      "string"
    ) {
      return null;
    }

    const clean =
      value.trim();

    return clean ||
      null;
  },

  clampConfidence(value) {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  }
};

window.Ari.reasoningEngine =
  window.AriReasoningEngine;

console.log(
  "ARI REASONING ENGINE LOADED:",
  window.AriReasoningEngine
    ?.version,

  window.AriReasoningEngine
    ?.validate?.()
);
