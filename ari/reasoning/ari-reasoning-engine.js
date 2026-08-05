// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
//
// Purpose:
// Build the canonical cognitive reasoning request, invoke OpenAI exactly once,
// validate the structured cognitive result, and preserve one authoritative
// user-facing draft for downstream semantic validation, response planning,
// final composition, and delivery.
//
// V10.4.0 — V3 Preference Runtime Integration
//
// Architectural flow:
//
// Canonical Evidence + Current Turn + Communication Preferences
//      ↓
// Registry-Bound Canonical Reasoning Request
//      ↓
// Ari Reasoning Context Engine
//      ↓
// Lean Cognitive Context Packet
//      ↓
// One OpenAI Reasoning Invocation
//      ↓
// Semantic Frame + Response Requirements + Authoritative Draft
//      ↓
// Validation Against the Canonical Reasoning Request
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
// - Resolve and invoke the Ari Reasoning Context Engine.
// - Preserve the complete canonical request inside Ari.
// - Send only the lean cognitive packet to the OpenAI client.
// - Preserve context-selection and prompt-size diagnostics.
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
// - Does not send the complete canonical reasoning request to OpenAI.
// - Does not independently select or trim model context.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "10.4.0",
  source: "ari-reasoning-engine",

  requestSchema:
    "ari_cognitive_reasoning_request",

  requestSchemaVersion:
    "2.2.0",

  resultSchema:
    "ari_cognitive_reasoning_result",

  resultSchemaVersion:
    "2.0.1",

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

  /*
   * The canonical reasoning request remains the complete,
   * authoritative internal request owned by Ari.
   */
  let reasoningRequest =
  this.resolveReasoningRequest(
    summary
  );

/*
 * Hydrate the canonical reasoning request with the
 * authenticated user's resolved communication guidance
 * before validation and before context selection.
 *
 * Preference failure is non-fatal because preferences
 * control expression, not reasoning availability.
 */
const preferenceStage =
  await this.resolvePreferenceGuidanceForRequest({
    summary,
    reasoningRequest
  });

reasoningRequest =
  this.attachResolvedPreferenceGuidance({
    reasoningRequest,
    preferenceStage
  });

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

      contextSelection:
        this.buildContextSelectionDiagnostic({
          available:
            false,

          attempted:
            false,

          succeeded:
            false,

          error:
            "Reasoning request validation failed before context selection."
        }),

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

  /*
   * Resolve the context engine before resolving the model
   * client. The model must never receive the complete
   * canonical request directly.
   */
  const contextEngine =
    this.resolveContextEngine();

  if (!contextEngine) {
    return this.buildFailureResult({
      reason:
        "reasoning_context_engine_not_available",

      errors: [
        "AriReasoningContextEngine was not loaded or did not expose a supported build method."
      ],

      request:
        reasoningRequest,

      engineRan:
        false,

      contextSelection:
        this.buildContextSelectionDiagnostic({
          available:
            false,

          attempted:
            false,

          succeeded:
            false,

          source:
            null,

          error:
            "No supported reasoning context engine was available."
        }),

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
            "Model invocation was not attempted because context selection was unavailable."
        })
    });
  }

  const contextStartedAt =
    Date.now();

  let contextResult;

  try {
    contextResult =
      contextEngine.build({
        reasoningRequest
      });
  } catch (error) {
    return this.buildFailureResult({
      reason:
        "reasoning_context_build_failed",

      errors: [
        error?.message ||
        "The reasoning context engine failed while building the cognitive packet."
      ],

      request:
        reasoningRequest,

      engineRan:
        false,

      contextSelection:
        this.buildContextSelectionDiagnostic({
          available:
            true,

          attempted:
            true,

          succeeded:
            false,

          source:
            contextEngine.source,

          durationMs:
            Date.now() -
            contextStartedAt,

          error:
            error?.message ||
            "The reasoning context engine failed."
        }),

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
            "Model invocation was not attempted because context selection failed."
        })
    });
  }

  const contextValidation =
    this.validateContextResult(
      contextResult
    );

  const contextSelection =
    this.buildContextSelectionDiagnostic({
      available:
        true,

      attempted:
        true,

      succeeded:
        contextValidation.valid ===
        true,

      source:
        contextEngine.source,

      durationMs:
        Date.now() -
        contextStartedAt,

      error:
        contextValidation.valid ===
        true
          ? null
          : this.firstString(
              contextValidation.errors
            ) ||
            "The cognitive context packet was invalid.",

      diagnostics:
        contextResult
          ?.diagnostics ||
        null
    });

  if (
    contextValidation.valid !==
    true
  ) {
    return this.buildFailureResult({
      reason:
        "invalid_cognitive_context_packet",

      errors:
        contextValidation.errors,

      request:
        reasoningRequest,

      engineRan:
        false,

      contextSelection,

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
            "Model invocation was not attempted because the cognitive packet was invalid."
        })
    });
  }

  const cognitivePacket =
    contextResult.cognitivePacket;

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

      contextSelection,

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

  console.log(
    "ARI REASONING ENGINE CONTEXT HANDOFF",
    {
      requestSchemaVersion:
        reasoningRequest.schemaVersion ||
        null,

      cognitivePacketSchema:
        cognitivePacket.schema ||
        null,

      cognitivePacketSchemaVersion:
        cognitivePacket.schemaVersion ||
        null,

      contextMode:
        cognitivePacket.mode ||
        null,

      sourceApproximateTokens:
        contextResult
          .diagnostics
          ?.sourceApproximateTokens ??
        null,

      packetApproximateTokens:
        contextResult
          .diagnostics
          ?.packetApproximateTokens ??
        contextResult
          .diagnostics
          ?.approximateTokens ??
        null,

      reductionPercentage:
        contextResult
          .diagnostics
          ?.reductionPercentage ??
        null,

      includedContext:
        contextResult
          .diagnostics
          ?.included ||
        {},

      preferenceContextAvailable:
  this.hasKeys(
    reasoningRequest
      .preferenceContext
  ),

preferenceInstructionTextPresent:
  Boolean(
    this.firstNonEmptyString([
      reasoningRequest
        .preferenceContext
        ?.instructionText,

      reasoningRequest
        .preferenceContext
        ?.modelInstructionText,

      reasoningRequest
        .preferenceContext
        ?.preferenceInstructionText
    ])
  ),

resolvedPreferencesPresent:
  this.hasKeys(
    reasoningRequest
      .preferenceContext
      ?.resolvedPreferences
  ),

selectedStyleMustBeObservable:
  reasoningRequest
    .preferenceContext
    ?.selectedStyleMustBeObservable ===
  true,

preferenceExecutionMode:
  reasoningRequest
    .preferenceContext
    ?.executionMode ||
  null,

preferenceRuntimeSource:
  reasoningRequest
    .preferenceContext
    ?.runtimeSource ||
  null,

preferenceStage:
  preferenceStage,

      preferenceContextReady:
        reasoningRequest
          .preferenceContext
          ?.ready ===
        true,

      userPreferenceKeys:
        Object.keys(
          reasoningRequest
            .userPreferences ||
          {}
        ),

      responseStyleKeys:
        Object.keys(
          reasoningRequest
            .responseStyle ||
          {}
        ),

      currentTurnOverrideKeys:
  Object.keys(
    reasoningRequest
      .preferenceContext
      ?.currentTurnOverrides ||

    reasoningRequest
      .preferenceContext
      ?.currentTurnOverride ||

    {}
  ),

      userPreferencesSource:
        reasoningRequest
          .styleContext
          ?.userPreferencesSource ||
        null,

      responseStyleSource:
        reasoningRequest
          .styleContext
          ?.responseStyleSource ||
        null,

      contextEngineSource:
        contextEngine.source ||
        null,

      invokerSource:
        modelInvoker.source ||
        null
    }
  );

  const invocationStartedAt =
    Date.now();

  let rawModelResult;

  try {
    /*
     * Only the cognitive packet crosses the OpenAI client
     * boundary.
     *
     * Do not add:
     *
     * request: reasoningRequest
     * canonicalReasoningRequest: reasoningRequest
     * ...reasoningRequest
     *
     * Those would restore the oversized payload.
     */
    rawModelResult =
      await modelInvoker.invoke({
        action:
          reasoningRequest.action ||
          "openai_reasoning",

        task:
          "ari_cognitive_reasoning",

        cognitivePacket,

        /*
         * These contracts are exposed separately so the
         * transport client can configure structured output
         * without rebuilding context.
         *
         * The client must not serialize these twice into the
         * provider prompt.
         */
        operationContract:
          cognitivePacket
            .operationContract ||
          reasoningRequest
            .operationContract ||
          this.getOperationContract(),

        responseSchema:
          cognitivePacket
            .outputContract ||
          reasoningRequest
            .outputContract ||
          this.getResponseSchema(
            reasoningRequest
              .operationContract
          ),

        instructions:
          this.arrayOrEmpty(
            cognitivePacket.instructions
          ).length
            ? cognitivePacket.instructions
            : this.getReasoningInstructions(
                reasoningRequest
                  .operationContract
              )
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

      contextSelection,

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

  /*
   * Model output is still validated against the complete
   * canonical request—not the trimmed cognitive packet.
   */
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

    contextSelection,

    contextDiagnostics:
      contextResult.diagnostics ||
      null,

    modelInvocation
  };

  return this.buildEngineResult({
    cognitiveReasoningResult,

    request:
      reasoningRequest,

    engineRan:
      true,

    contextSelection,

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

const suppliedPreferenceContext =
  this.objectOrEmpty(
    summary.preferenceContext ||
    summary.reasoningStageInput
      ?.preferenceContext
  );

const currentTurnOverride =
  this.objectOrEmpty(
    suppliedPreferenceContext
      .currentTurnOverride ||
    summary.currentTurnOverride ||
    summary.styleOverride
  );

const preferenceContext = {
  ...suppliedPreferenceContext,

  available:
    suppliedPreferenceContext
      .available === true ||
    this.hasKeys(
      styleContext.userPreferences
    ) ||
    this.hasKeys(
      styleContext.responseStyle
    ) ||
    this.hasKeys(
      currentTurnOverride
    ),

  ready:
    suppliedPreferenceContext
      .ready === true ||
    summary.preferenceResolverReady ===
      true,

  resolverRan:
    suppliedPreferenceContext
      .resolverRan === true ||
    summary.preferenceResolverRan ===
      true,

  resolverSource:
    suppliedPreferenceContext
      .resolverSource ||
    summary.preferenceResolverSource ||
    null,

  resolverVersion:
    suppliedPreferenceContext
      .resolverVersion ||
    summary.preferenceResolverVersion ||
    null,

  userPreferences:
    styleContext.userPreferences,

  responseStyle:
    styleContext.responseStyle,

  currentTurnOverride
};

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

preferenceContext,

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

instructions:
  this.getReasoningInstructions(
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

const preferenceContext =
  this.objectOrEmpty(
    request.preferenceContext ||
    summary.preferenceContext ||
    summary.reasoningStageInput
      ?.preferenceContext
  );

const preferenceUserPreferences =
  this.objectOrEmpty(
    preferenceContext.userPreferences
  );

const preferenceResponseStyle =
  this.objectOrEmpty(
    preferenceContext.responseStyle
  );

const preferenceCurrentTurnOverride =
  this.objectOrEmpty(
    preferenceContext.currentTurnOverride
  );

    const styleContext =
      this.resolveStyleContext({
        ...summary,

        memoryStagePacket,

        userPreferences:
  this.hasKeys(
    request.userPreferences
  )
    ? request.userPreferences
    : this.hasKeys(
        preferenceUserPreferences
      )
      ? preferenceUserPreferences
      : summary.userPreferences,

communicationPreferences:
  request.communicationPreferences ??
  summary.communicationPreferences,

stylePreferences:
  request.stylePreferences ??
  summary.stylePreferences,

responseStyle:
  this.hasKeys(
    request.responseStyle
  )
    ? request.responseStyle
    : this.hasKeys(
        preferenceCurrentTurnOverride
      )
      ? preferenceCurrentTurnOverride
      : this.hasKeys(
          preferenceResponseStyle
        )
        ? preferenceResponseStyle
        : summary.responseStyle,

styleOverride:
  this.hasKeys(
    request.styleOverride
  )
    ? request.styleOverride
    : this.hasKeys(
        preferenceCurrentTurnOverride
      )
      ? preferenceCurrentTurnOverride
      : summary.styleOverride,

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
    styleContext.userPreferences,

  responseStyle:
    styleContext.responseStyle
},

preferenceContext: {
  ...preferenceContext,

  available:
    preferenceContext.available ===
      true ||
    this.hasKeys(
      styleContext.userPreferences
    ) ||
    this.hasKeys(
      styleContext.responseStyle
    ) ||
    this.hasKeys(
      preferenceCurrentTurnOverride
    ),

  ready:
    preferenceContext.ready ===
      true,

  resolverRan:
    preferenceContext.resolverRan ===
      true,

  resolverSource:
    preferenceContext.resolverSource ||
    null,

  resolverVersion:
    preferenceContext.resolverVersion ||
    null,

  userPreferences:
    styleContext.userPreferences,

  responseStyle:
    styleContext.responseStyle,

  currentTurnOverride:
    preferenceCurrentTurnOverride
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
   V3 PREFERENCE RUNTIME INTEGRATION
===================================================== */

/*
 * Preference ownership:
 *
 * AriUserPreferenceStore
 *   → persistence
 *
 * AriPreferenceResolver
 *   → resolution
 *
 * AriPreferenceRuntime
 *   → runtime access
 *
 * AriReasoningEngine
 *   → obtains finished guidance
 *
 * AriReasoningContextEngine
 *   → packages guidance
 *
 * AriOpenAIReasoningClient
 *   → transports guidance
 *
 * This Reasoning Engine MUST NOT:
 * - read Supabase directly
 * - resolve preference values itself
 * - rewrite model-ready preference instructions
 * - weaken behavioral instructions into permissions
 */

resolvePreferenceRuntime() {
  return (
    window.AriPreferenceRuntime ||
    window.Ari
      ?.preferenceRuntime ||
    null
  );
},

hasUsablePreferenceGuidance(
  guidance = {}
) {
  if (
    !this.isPlainObject(
      guidance
    )
  ) {
    return false;
  }

  return Boolean(
    this.hasKeys(
      guidance.resolvedPreferences
    ) ||

    this.firstNonEmptyString([
      guidance.instructionText,
      guidance.modelInstructionText,
      guidance.preferenceInstructionText
    ]) ||

    this.arrayOrEmpty(
      guidance.modelInstructions
    ).length > 0
  );
},

isBehavioralPreferenceGuidance(
  guidance = {}
) {
  if (
    !this.hasUsablePreferenceGuidance(
      guidance
    )
  ) {
    return false;
  }

  return Boolean(
    guidance
      .executeSelectedCommunicationStyle ===
      true ||

    guidance
      .selectedStyleMustBeObservable ===
      true ||

    guidance.executionMode ===
      "behavioral" ||

    this.firstNonEmptyString([
      guidance.instructionText,
      guidance.modelInstructionText,
      guidance.preferenceInstructionText
    ])
  );
},

buildPreferenceRuntimeRequest({
  summary = {},
  reasoningRequest = {}
} = {}) {
  const existingPreferenceContext =
    this.objectOrEmpty(
      reasoningRequest
        .preferenceContext
    );

  const conversationResolution =
    this.resolveFirstObject([
      [
        "preferenceContext.conversationOverrides",

        existingPreferenceContext
          .conversationOverrides
      ],

      [
        "reasoningRequest.conversationPreferenceOverrides",

        reasoningRequest
          .conversationPreferenceOverrides
      ],

      [
        "reasoningRequest.conversation.preferenceOverrides",

        reasoningRequest
          .conversation
          ?.preferenceOverrides
      ],

      [
        "summary.conversationPreferenceOverrides",

        summary
          .conversationPreferenceOverrides
      ]
    ]);

  const currentTurnResolution =
    this.resolveFirstObject([
      [
        "preferenceContext.currentTurnOverrides",

        existingPreferenceContext
          .currentTurnOverrides
      ],

      [
        "preferenceContext.currentTurnOverride",

        existingPreferenceContext
          .currentTurnOverride
      ],

      [
        "reasoningRequest.currentTurnPreferenceOverrides",

        reasoningRequest
          .currentTurnPreferenceOverrides
      ],

      [
        "reasoningRequest.responseControl.preferenceOverrides",

        reasoningRequest
          .responseControl
          ?.preferenceOverrides
      ],

      [
        "summary.currentTurnPreferenceOverrides",

        summary
          .currentTurnPreferenceOverrides
      ]
    ]);

  return {
    request: {
      original:
        reasoningRequest
          .request
          ?.original ||
        reasoningRequest
          .originalUserMessage ||
        null,

      effective:
        reasoningRequest
          .request
          ?.effective ||
        reasoningRequest
          .resolvedUserQuestion ||
        null,

      turnId:
        reasoningRequest.turnId ||
        null
    },

    conversationOverrides:
      this.objectOrEmpty(
        conversationResolution.value
      ),

    currentTurnOverrides:
      this.objectOrEmpty(
        currentTurnResolution.value
      )
  };
},

async resolvePreferenceGuidanceForRequest({
  summary = {},
  reasoningRequest = {}
} = {}) {
  const runtime =
    this.resolvePreferenceRuntime();

  const suppliedGuidance =
    this.objectOrEmpty(
      reasoningRequest
        .preferenceContext ||
      summary.preferenceContext
    );

  const startedAt =
    Date.now();

  if (!runtime) {
    return {
      available:
        false,

      attempted:
        false,

      succeeded:
        false,

      runtimeSource:
        null,

      runtimeVersion:
        null,

      method:
        null,

      requestAware:
        false,

      guidance:
        suppliedGuidance,

      guidanceAttached:
        this.hasUsablePreferenceGuidance(
          suppliedGuidance
        ),

      suppliedFallbackUsed:
        this.hasUsablePreferenceGuidance(
          suppliedGuidance
        ),

      error:
        "AriPreferenceRuntime is not loaded.",

      durationMs:
        Date.now() -
        startedAt
    };
  }

  try {
    let guidance = {};
    let method = null;
    let requestAware = false;

    /*
     * Preferred future V3 API.
     *
     * When the runtime exposes this method it can resolve
     * persistent + conversation + current-turn layers for
     * this exact reasoning request.
     */
    if (
      typeof runtime
        .getOpenAIGuidanceForRequest ===
      "function"
    ) {
      method =
        "getOpenAIGuidanceForRequest";

      requestAware =
        true;

      guidance =
        await runtime
          .getOpenAIGuidanceForRequest(
            this.buildPreferenceRuntimeRequest({
              summary,
              reasoningRequest
            })
          );
    } else {
      /*
       * Current runtime compatibility path.
       *
       * V1.1.0 currently exposes:
       *
       * ensureReady()
       * getOpenAIGuidance()
       */
      if (
        typeof runtime.ensureReady ===
        "function"
      ) {
        await runtime.ensureReady();
      } else if (
        typeof runtime.initialize ===
        "function"
      ) {
        await runtime.initialize();
      } else if (
        typeof runtime.refresh ===
        "function"
      ) {
        await runtime.refresh();
      }

      if (
        typeof runtime
          .getOpenAIGuidance ===
        "function"
      ) {
        method =
          "getOpenAIGuidance";

        guidance =
          runtime
            .getOpenAIGuidance();
      } else if (
        typeof runtime.getPacket ===
        "function"
      ) {
        method =
          "getPacket";

        guidance =
          runtime.getPacket();
      }
    }

    const normalizedGuidance =
      this.objectOrEmpty(
        guidance
      );

    const runtimeGuidanceUsable =
      this.hasUsablePreferenceGuidance(
        normalizedGuidance
      );

    const suppliedGuidanceUsable =
      this.hasUsablePreferenceGuidance(
        suppliedGuidance
      );

    const selectedGuidance =
      runtimeGuidanceUsable
        ? normalizedGuidance
        : suppliedGuidanceUsable
          ? suppliedGuidance
          : {};

    return {
      available:
        true,

      attempted:
        true,

      succeeded:
        runtimeGuidanceUsable,

      runtimeSource:
        runtime.source ||
        "ari-preference-runtime",

      runtimeVersion:
        runtime.version ||
        null,

      method,

      requestAware,

      guidance:
        selectedGuidance,

      guidanceAttached:
        this.hasUsablePreferenceGuidance(
          selectedGuidance
        ),

      runtimeGuidanceUsed:
        runtimeGuidanceUsable,

      suppliedFallbackUsed:
        !runtimeGuidanceUsable &&
        suppliedGuidanceUsable,

      instructionTextPresent:
        Boolean(
          this.firstNonEmptyString([
            selectedGuidance
              .instructionText,

            selectedGuidance
              .modelInstructionText,

            selectedGuidance
              .preferenceInstructionText
          ])
        ),

      resolvedPreferencesPresent:
        this.hasKeys(
          selectedGuidance
            .resolvedPreferences
        ),

      behavioral:
        this.isBehavioralPreferenceGuidance(
          selectedGuidance
        ),

      diagnostics:
        typeof runtime
          .getDiagnostics ===
          "function"
            ? runtime.getDiagnostics()
            : null,

      error:
        runtimeGuidanceUsable
          ? null
          : "Preference runtime did not provide usable OpenAI guidance.",

      durationMs:
        Date.now() -
        startedAt
    };
  } catch (error) {
    return {
      available:
        true,

      attempted:
        true,

      succeeded:
        false,

      runtimeSource:
        runtime.source ||
        "ari-preference-runtime",

      runtimeVersion:
        runtime.version ||
        null,

      method:
        null,

      requestAware:
        false,

      guidance:
        suppliedGuidance,

      guidanceAttached:
        this.hasUsablePreferenceGuidance(
          suppliedGuidance
        ),

      runtimeGuidanceUsed:
        false,

      suppliedFallbackUsed:
        this.hasUsablePreferenceGuidance(
          suppliedGuidance
        ),

      behavioral:
        this.isBehavioralPreferenceGuidance(
          suppliedGuidance
        ),

      error:
        error instanceof Error
          ? error.message
          : String(
              error ||
              "Preference runtime resolution failed."
            ),

      durationMs:
        Date.now() -
        startedAt
    };
  }
},

attachResolvedPreferenceGuidance({
  reasoningRequest = {},
  preferenceStage = {}
} = {}) {
  const existingContext =
    this.objectOrEmpty(
      reasoningRequest
        .preferenceContext
    );

  const resolvedGuidance =
    this.objectOrEmpty(
      preferenceStage.guidance
    );

  if (
    !this.hasUsablePreferenceGuidance(
      resolvedGuidance
    )
  ) {
    return reasoningRequest;
  }

  /*
   * Runtime guidance is already resolved.
   *
   * Do NOT reconstruct resolvedPreferences.
   * Do NOT rebuild instructionText.
   * Do NOT translate values.
   */
  const preferenceContext = {
    ...existingContext,
    ...resolvedGuidance,

    available:
      true,

    runtimeSource:
      resolvedGuidance
        .runtimeSource ||
      preferenceStage
        .runtimeSource ||
      resolvedGuidance
        .source ||
      existingContext
        .runtimeSource ||
      null
  };

  const behavioral =
    this.isBehavioralPreferenceGuidance(
      preferenceContext
    );

  return {
    ...reasoningRequest,

    preferenceContext,

    authority: {
      ...this.objectOrEmpty(
        reasoningRequest.authority
      ),

      communicationPreferencesPresent:
        true,

      communicationPreferencesAreBindingWithinStyleScope:
        behavioral,

      communicationPreferencesAreBindingWithinSafety:
        behavioral,

      communicationPreferencesAreAdvisory:
        behavioral
          ? false
          : reasoningRequest
              .authority
              ?.communicationPreferencesAreAdvisory,

      selectedCommunicationBehaviorShouldBeExecuted:
        behavioral
          ? true
          : undefined,

      selectedStyleMustBeObservable:
        behavioral
          ? (
              preferenceContext
                .selectedStyleMustBeObservable ===
              true
            )
          : undefined,

      preserveCommunicationInstructionStrength:
        behavioral
          ? (
              preferenceContext
                .preserveInstructionStrength !==
              false
            )
          : undefined,

      mayRewriteCommunicationBehaviorAsPermission:
        behavioral
          ? false
          : undefined
    }
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
   REASONING CONTEXT SELECTION
===================================================== */

resolveContextEngine() {
  const candidates = [
    {
      source:
        "AriReasoningContextEngine.build",

      target:
        window
          .AriReasoningContextEngine,

      fn:
        window
          .AriReasoningContextEngine
          ?.build
    },

    {
      source:
        "AriReasoningContextEngine.create",

      target:
        window
          .AriReasoningContextEngine,

      fn:
        window
          .AriReasoningContextEngine
          ?.create
    },

    {
      source:
        "Ari.reasoningContextEngine.build",

      target:
        window.Ari
          ?.reasoningContextEngine,

      fn:
        window.Ari
          ?.reasoningContextEngine
          ?.build
    },

    {
      source:
        "Ari.reasoningContextEngine.create",

      target:
        window.Ari
          ?.reasoningContextEngine,

      fn:
        window.Ari
          ?.reasoningContextEngine
          ?.create
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

    build:
      payload =>
        selected.fn.call(
          selected.target,
          payload
        )
  };
},

validateContextResult(
  contextResult = {}
) {
  const errors = [];
  const warnings = [];

  if (
    !this.isPlainObject(
      contextResult
    )
  ) {
    return {
      valid:
        false,

      errors: [
        "reasoning_context_result_must_be_an_object"
      ],

      warnings
    };
  }

  if (
    contextResult.ready !==
      true
  ) {
    errors.push(
      contextResult.error ||
      "reasoning_context_result_not_ready"
    );
  }

  if (
    contextResult.success !==
      true
  ) {
    errors.push(
      "reasoning_context_result_not_successful"
    );
  }

  const cognitivePacket =
    contextResult
      .cognitivePacket;

  if (
    !this.isPlainObject(
      cognitivePacket
    )
  ) {
    errors.push(
      "cognitive_packet_missing"
    );

    return {
      valid:
        false,

      errors:
        this.cleanStringList(
          errors
        ),

      warnings
    };
  }

  if (
    cognitivePacket.schema !==
    "ari_cognitive_context_packet"
  ) {
    errors.push(
      "invalid_cognitive_packet_schema"
    );
  }

  const effectiveRequest =
    this.firstNonEmptyString([
      cognitivePacket
        .request
        ?.effective,

      cognitivePacket
        .request
        ?.original
    ]);

  if (!effectiveRequest) {
    errors.push(
      "cognitive_packet_effective_request_missing"
    );
  }

  if (
    cognitivePacket.authority
      ?.safetyIsBinding !==
    true
  ) {
    errors.push(
      "cognitive_packet_safety_authority_missing"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayExecuteActions ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_authorize_action_execution"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayPersistState ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_authorize_persistence"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayOverrideSafety ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_override_safety"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayClaimToolSuccess ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_claim_tool_success"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayAuthorizeDelivery ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_authorize_delivery"
    );
  }

  if (
    cognitivePacket.authority
      ?.mayExposePrivateChainOfThought ===
    true
  ) {
    errors.push(
      "cognitive_packet_may_not_expose_private_chain_of_thought"
    );
  }

  if (
    !this.hasKeys(
      cognitivePacket
        .outputContract
    )
  ) {
    errors.push(
      "cognitive_packet_output_contract_missing"
    );
  }

  if (
    !this.hasKeys(
      cognitivePacket
        .operationContract
    )
  ) {
    errors.push(
      "cognitive_packet_operation_contract_missing"
    );
  }

  if (
    !this.arrayOrEmpty(
      cognitivePacket.instructions
    ).length
  ) {
    warnings.push(
      "cognitive_packet_instructions_missing"
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors:
      this.cleanStringList(
        errors
      ),

    warnings:
      this.cleanStringList(
        warnings
      )
  };
},

buildContextSelectionDiagnostic({
  available = false,
  attempted = false,
  succeeded = false,
  source = null,
  durationMs = null,
  error = null,
  diagnostics = null
} = {}) {
  const suppliedDiagnostics =
    this.objectOrEmpty(
      diagnostics
    );

  return {
    contextEngineAvailable:
      available ===
      true,

    contextEngineSource:
      source ||
      null,

    attempted:
      attempted ===
      true,

    succeeded:
      succeeded ===
      true,

    durationMs:
      Number.isFinite(
        Number(durationMs)
      )
        ? Number(durationMs)
        : null,

    mode:
      suppliedDiagnostics.mode ||
      null,

    sourceCharacters:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .sourceCharacters
        )
      )
        ? Number(
            suppliedDiagnostics
              .sourceCharacters
          )
        : null,

    sourceApproximateTokens:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .sourceApproximateTokens
        )
      )
        ? Number(
            suppliedDiagnostics
              .sourceApproximateTokens
          )
        : null,

    packetCharacters:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .packetCharacters ??
          suppliedDiagnostics
            .characters
        )
      )
        ? Number(
            suppliedDiagnostics
              .packetCharacters ??
            suppliedDiagnostics
              .characters
          )
        : null,

    packetApproximateTokens:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .packetApproximateTokens ??
          suppliedDiagnostics
            .approximateTokens
        )
      )
        ? Number(
            suppliedDiagnostics
              .packetApproximateTokens ??
            suppliedDiagnostics
              .approximateTokens
          )
        : null,

    reductionCharacters:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .reductionCharacters
        )
      )
        ? Number(
            suppliedDiagnostics
              .reductionCharacters
          )
        : null,

    reductionPercentage:
      Number.isFinite(
        Number(
          suppliedDiagnostics
            .reductionPercentage
        )
      )
        ? Number(
            suppliedDiagnostics
              .reductionPercentage
          )
        : null,

    requirements:
      this.objectOrEmpty(
        suppliedDiagnostics
          .requirements
      ),

    limits:
      this.objectOrEmpty(
        suppliedDiagnostics
          .limits
      ),

    included:
      this.objectOrEmpty(
        suppliedDiagnostics
          .included
      ),

    error:
      error ||
      null
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

      "When cognitivePacket.preferenceContext is present, use its resolvedPreferences, modelInstructions, instructionText, execution flags, and provenance as Ari's resolved communication guidance.",

"Treat resolved communication preferences as active behavioral instructions within communication and presentation scope, not merely as permission.",

"Do not weaken an active communication instruction into optional wording such as 'may', 'allowed', 'permitted', 'when it fits', or similar language unless the supplied preference instruction itself is explicitly optional.",

"When preferenceContext.selectedStyleMustBeObservable is true, the selected communication style must be clearly noticeable in the user-facing draft.",

"When preferenceContext.executeSelectedCommunicationStyle is true, actively execute the selected style instead of falling back to a neutral assistant voice.",

"When preferenceContext.preserveInstructionStrength is true, preserve the behavioral strength of the supplied preference instructions.",

"When preferenceContext.doNotRewriteBehaviorAsPermission is true, do not reinterpret an active behavioral instruction as mere permission.",

"Use the precedence and provenance already resolved inside preferenceContext. Do not independently re-resolve communication preferences.",

"Communication preferences control expression and presentation only. They do not alter factual conclusions, evidence standards, tool authority, or binding deterministic safety requirements.",

"Profanity, humor, teasing, bluntness, casual language, or irreverent wording are not safety violations merely because they are strong or informal.",

"Do not claim communication preferences were saved or persisted unless an authorized persistence layer explicitly reports that operation as completed.",

"Record the communication style actually used in responseRequirements.styleApplied when practical.",

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

if (
  !this.hasKeys(
    request.preferenceContext
  )
) {
  warnings.push(
    "preference_context_not_supplied"
  );
} else {
  if (
    !this.hasUsablePreferenceGuidance(
      request.preferenceContext
    )
  ) {
    warnings.push(
      "preference_context_has_no_usable_guidance"
    );
  }

  if (
    this.isBehavioralPreferenceGuidance(
      request.preferenceContext
    ) &&
    !this.firstNonEmptyString([
      request.preferenceContext
        .instructionText,

      request.preferenceContext
        .modelInstructionText,

      request.preferenceContext
        .preferenceInstructionText
    ])
  ) {
    warnings.push(
      "behavioral_preference_context_missing_instruction_text"
    );
  }
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
    };
  },

  normalizeResponseRequirements(
    requirements = {},
    request = {}
  ) {
    const suppliedStyleApplied =
      this.objectOrEmpty(
        requirements.styleApplied
      );

    const effectiveStyle =
      this.objectOrEmpty(
        request.responseStyle
      );

    const persistentPreferences =
      this.objectOrEmpty(
        request.userPreferences
      );

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

      styleApplied: {
        source:
          this.nullableString(
            suppliedStyleApplied.source ||
            effectiveStyle.source
          ),

        tone:
          this.nullableString(
            suppliedStyleApplied.tone ||
            requirements.tone ||
            effectiveStyle.tone ||
            persistentPreferences.tone
          ),

        directness:
          this.nullableString(
            suppliedStyleApplied.directness ||
            effectiveStyle.directness ||
            persistentPreferences.directness
          ),

        warmth:
          this.nullableString(
            suppliedStyleApplied.warmth ||
            effectiveStyle.warmth ||
            persistentPreferences.warmth
          ),

        humor:
          this.nullableString(
            suppliedStyleApplied.humor ||
            effectiveStyle.humor ||
            persistentPreferences.humor
          ),

        formality:
          this.nullableString(
            suppliedStyleApplied.formality ||
            effectiveStyle.formality ||
            persistentPreferences.formality
          ),

        verbosity:
          this.nullableString(
            suppliedStyleApplied.verbosity ||
            effectiveStyle.verbosity ||
            persistentPreferences.verbosity
          ),

        profanityLevel:
          this.nullableString(
            suppliedStyleApplied.profanityLevel ||
            effectiveStyle.profanityLevel ||
            effectiveStyle.profanity
              ?.level ||
            persistentPreferences.profanityLevel ||
            persistentPreferences.profanity
              ?.level
          )
      },

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
      this.objectOrEmpty(value);

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

      usedUserPreferences:
        metadata.usedUserPreferences ===
        true ||
        this.hasKeys(
          request.userPreferences
        ),

      usedResponseStyle:
        metadata.usedResponseStyle ===
        true ||
        this.hasKeys(
          request.responseStyle
        ),

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
  contextSelection = {},
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

    const authoritativeDraft =
      this.firstNonEmptyString([
        cognitiveReasoningResult
          .authoritativeDraft,

        cognitiveReasoningResult
          .draftResponse
      ]);

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
      Boolean(
        authoritativeDraft
      ) &&
      modelInvocation
        ?.succeeded === true;

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

contextSelection:
  this.objectOrEmpty(
    contextSelection
  ),

contextDiagnostics:
  cognitiveReasoningResult
    .contextDiagnostics ||
  null,

      cognitiveReasoningResult,

      reasoningResult:
        cognitiveReasoningResult,

      semanticFrame,

      responseRequirements,

      responseStrategy:
        responseRequirements,

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
          this.objectOrEmpty(
            responseRequirements
              ?.styleApplied
          )
      },

      userPreferences:
        this.objectOrEmpty(
          request.userPreferences
        ),

      responseStyle:
        this.objectOrEmpty(
          request.responseStyle
        ),

      styleApplied:
        this.objectOrEmpty(
          responseRequirements
            ?.styleApplied
        ),

      authoritativeDraft,

      draftResponse:
        authoritativeDraft,

      modelDraftResponse:
        authoritativeDraft,

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
                responseRequirements,

              styleApplied:
                responseRequirements
                  ?.styleApplied ||
                null,

              authoritativeDraft,

              draftResponse:
                authoritativeDraft,

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
          ? "openai_authoritative_cognitive_response"
          : "none",

      reason:
        ready
          ? null
          : this.firstString(
              cognitiveReasoningResult
                .validation
                ?.errors
            ) ||
            (
              !authoritativeDraft
                ? "authoritative_draft_missing"
                : "reasoning_result_not_ready"
            )
    };
  },

  buildFailureResult({
  reason =
    "reasoning_failed",

  errors = [],

  request = {},

  engineRan = false,

  contextSelection = {},

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

const normalizedContextSelection =
  this.objectOrEmpty(
    contextSelection
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
          {}
      },

      authoritativeDraft:
        "",

      draftResponse:
        "",

      executionMetadata:
        null,

      evidenceReferences:
        [],

contextSelection:
  normalizedContextSelection,

contextDiagnostics:
  null,

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

contextSelection:
  normalizedContextSelection,

contextDiagnostics:
  null,

      modelInvocation:
        normalizedModelInvocation,

      cognitiveReasoningResult,

      reasoningResult:
        cognitiveReasoningResult,

      semanticFrame:
        null,

      responseRequirements:
        null,

      responseStrategy:
        null,

      userPreferences:
        this.objectOrEmpty(
          request.userPreferences
        ),

      responseStyle:
        this.objectOrEmpty(
          request.responseStyle
        ),

      styleApplied:
        {},

      authoritativeDraft:
        "",

      draftResponse:
        "",

      modelDraftResponse:
        "",

      executionMetadata:
        null,

      evidenceReferences:
        [],

      reasoning:
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

const resolvedContextEngine =
  this.resolveContextEngine();

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

  typeof this.resolveStyleContext ===
    "function" &&

  typeof this.normalizeCommunicationPreferences ===
    "function" &&

  // V3 preference runtime integration
  typeof this.resolvePreferenceRuntime ===
    "function" &&

  typeof this.hasUsablePreferenceGuidance ===
    "function" &&

  typeof this.isBehavioralPreferenceGuidance ===
    "function" &&

  typeof this.buildPreferenceRuntimeRequest ===
    "function" &&

  typeof this.resolvePreferenceGuidanceForRequest ===
    "function" &&

  typeof this.attachResolvedPreferenceGuidance ===
    "function" &&

  typeof this.resolveModelInvoker ===
    "function" &&

  typeof this.validateAndNormalizeResult ===
    "function" &&

  typeof this.resolveContextEngine ===
    "function" &&

  typeof this.validateContextResult ===
    "function" &&

  typeof this.buildContextSelectionDiagnostic ===
    "function" &&

  typeof this.normalizeSemanticFrame ===
    "function";

const preferenceRuntime =
  this.resolvePreferenceRuntime();

    return {
      valid:
        structurallyValid,

preferenceRuntimeAvailable:
  Boolean(
    preferenceRuntime
  ),

preferenceRuntimeSource:
  preferenceRuntime
    ?.source ||
  null,

preferenceRuntimeVersion:
  preferenceRuntime
    ?.version ||
  null,

preferenceRuntimeIntegrationSupported:
  true,

requestAwarePreferenceRuntimeSupported:
  typeof preferenceRuntime
    ?.getOpenAIGuidanceForRequest ===
  "function",

legacyPreferenceRuntimeFallbackSupported:
  typeof preferenceRuntime
    ?.getOpenAIGuidance ===
  "function",

preferenceResolutionPerformedByReasoningEngine:
  false,

preferencePersistencePerformedByReasoningEngine:
  false,

preferenceInstructionRewritingPerformed:
  false,

      ready:
  structurallyValid &&
  Boolean(
    resolvedContextEngine
  ) &&
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

contextEngineAvailable:
  Boolean(
    resolvedContextEngine
  ),

contextEngineSource:
  resolvedContextEngine
    ?.source ||
  null,

contextSelectionSupported:
  true,

canonicalRequestRetainedLocally:
  true,

fullCanonicalRequestSentToModel:
  false,

      allowedOperationCount:
        allowedOperations.length,

      styleContextSupported:
        true,

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

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  },

  hasKeys(value) {
    return (
      this.isPlainObject(
        value
      ) &&
      Object.keys(
        value
      ).length > 0
    );
  },

  objectOrEmpty(value) {
    return this.isPlainObject(
      value
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

  firstDefinedBoolean(
    values = []
  ) {
    for (
      const value of values
    ) {
      if (
        typeof value ===
        "boolean"
      ) {
        return value;
      }
    }

    return undefined;
  },

  removeUndefinedValues(value) {
    if (Array.isArray(value)) {
      return value
        .map(item =>
          this.removeUndefinedValues(
            item
          )
        )
        .filter(
          item =>
            item !==
            undefined
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
      const [key, currentValue]
      of Object.entries(
        value
      )
    ) {
      if (
        currentValue ===
        undefined
      ) {
        continue;
      }

      const normalized =
        this.removeUndefinedValues(
          currentValue
        );

      if (
        this.isPlainObject(
          normalized
        ) &&
        !Object.keys(
          normalized
        ).length
      ) {
        continue;
      }

      output[key] =
        normalized;
    }

    return output;
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
