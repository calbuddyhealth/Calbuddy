// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
//
// Purpose:
// Build the canonical cognitive evidence packet,
// invoke OpenAI as ARI's authoritative reasoning engine,
// validate the structured result,
// and expose a safe compatibility contract.
//
// V9.1.0 — Structured Reasoning Transport / Evidence-Aware Validation
//
// Authority model:
//
// ARI:
// - gathers evidence
// - defines binding safety and execution constraints
// - validates model output
// - controls tools, persistence, and delivery
//
// OpenAI:
// - interprets user meaning
// - builds the semantic frame
// - analyzes the situation
// - proposes decisions and actions
// - defines response strategy
// - may draft provisional response language
//
// OpenAI may propose actions.
// OpenAI may not execute actions, persist state,
// claim tool success, or override safety.
//
// Responsibilities:
// - Build one canonical reasoning request.
// - Preserve current-turn and conversation context.
// - Preserve routing, safety, continuity, memory, and knowledge evidence.
// - Resolve an approved OpenAI reasoning invoker.
// - Invoke OpenAI exactly once per reasoning execution.
// - Validate and normalize structured cognitive output.
// - Reject unsafe or falsely executed action claims.
// - Return transparent invocation and validation diagnostics.
//
// Non-responsibilities:
// - Does not execute actions.
// - Does not call tools directly.
// - Does not persist memory or runtime state.
// - Does not authorize delivery.
// - Does not produce the final delivered response.
// - Does not replace the Response Realization Engine.
// - Does not expose private chain-of-thought.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "9.1.0",

  source: "ari-reasoning-engine",

  requestSchema:
    "ari_cognitive_reasoning_request",

  requestSchemaVersion:
    "1.0.0",

  resultSchema:
    "ari_cognitive_reasoning_result",

  resultSchemaVersion:
    "1.0.0",

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
      this.resolveModelInvoker(
        summary
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
      rawModelResult =
        await modelInvoker.invoke({
          task:
            "ari_cognitive_reasoning",

          request:
            reasoningRequest,

          responseSchema:
            this.getResponseSchema(),

          instructions:
            this.getReasoningInstructions()
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

    const cognitiveReasoningResult =
      this.validateAndNormalizeResult({
        rawResult:
          rawModelResult,

        request:
          reasoningRequest
      });

    return this.buildEngineResult({
      cognitiveReasoningResult,

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
            cognitiveReasoningResult
              .ready === true,

          source:
            modelInvoker.source,

          durationMs:
            Date.now() -
            invocationStartedAt,

          error:
            cognitiveReasoningResult
              .ready === true
              ? null
              : this.firstString(
                  cognitiveReasoningResult
                    .validation
                    ?.errors
                )
        })
    });
  },

  /* =====================================================
     REQUEST CONSTRUCTION
  ===================================================== */

  resolveReasoningRequest(summary = {}) {
    const suppliedRequest =
      summary.reasoningStageInput;

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
    return {
      schema:
        this.requestSchema,

      schemaVersion:
        this.requestSchemaVersion,

      request:
        this.buildUserRequest(
          summary
        ),

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

      outputContract:
        this.getResponseSchema()
    };
  },

  normalizeReasoningRequest(
    request = {},
    summary = {}
  ) {
    return {
      schema:
        request.schema ||
        this.requestSchema,

      schemaVersion:
        request.schemaVersion ||
        this.requestSchemaVersion,

      request: {
        ...this.buildUserRequest(
          summary
        ),

        ...this.objectOrEmpty(
          request.request
        )
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
        request.perception ??
        summary.perceptionPacket ??
        null,

      routing:
        request.routing ??
        summary.routingContract ??
        null,

      executive:
        request.executive ??
        summary.executivePacket ??
        null,

      continuity:
        request.continuity ??
        summary.continuityStagePacket ??
        null,

      safety:
        request.safety ??
        summary.safetyStagePacket ??
        null,

      situation:
        request.situation ??
        summary.situationStagePacket ??
        null,

      memory:
        request.memory ??
        summary.memoryStagePacket ??
        null,

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

        // These boundaries are always binding.
        safetyIsBinding:
          true,

        mayExecuteActions:
          false,

        mayPersistState:
          false,

        mayOverrideSafety:
          false,

        mayClaimToolSuccess:
          false,

        mayExposePrivateChainOfThought:
          false
      },

      outputContract:
        request.outputContract ||
        this.getResponseSchema()
    };
  },

  buildUserRequest(summary = {}) {
    const original =
      summary.turn?.originalText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const effective =
      summary.turn?.effectiveText ||
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
        summary.turn?.turnId ||
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
        summary.knowledgeConfidence ||
        routerResult
          .knowledgeConfidence ||
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
        null,

      primaryLane:
        summary.primaryLane ||
        summary.routingContract
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

      mayPlanResponse:
        true,

      mayDraftResponse:
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

  getReasoningInstructions() {
    return [
      "Use the complete evidence packet to interpret the user's current request.",

      "Treat safety, routing, response constraints, required behaviors, and forbidden behaviors as binding.",

      "Treat upstream semantic labels as evidence, not as unquestionable conclusions.",

      "Treat knowledge-router output as supporting evidence, not as final response language.",

      "Distinguish stored memory, stored system knowledge, live-verified evidence, developer evidence, and general model knowledge.",

      "Do not assume retrieved or model-generated knowledge is verified unless the evidence packet identifies it as verified.",

      "Resolve meaning by considering the current turn, recent conversation, continuity evidence, memory, knowledge evidence, situation, understanding signals, and developer evidence together.",

      "Do not provide private chain-of-thought or hidden reasoning. Return concise conclusions, evidence references, assumptions, uncertainties, and decision rationale only.",

      "Do not claim that an action, tool call, message, file change, or external operation has occurred.",

      "Any action must be returned only as a proposed action.",

      "Build one coherent interpretation, semantic frame, response strategy, and optional provisional draft response.",

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
      request.request?.effective;

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

  getResponseSchema() {
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
        "responseStrategy",
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

          expectedFields: [
            "operation",
            "target",
            "domain",
            "primaryLane",
            "requestedOutput",
            "constraints"
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

        responseStrategy: {
          type:
            "object",

          expectedFields: [
            "goal",
            "shape",
            "tone",
            "orderedPoints",
            "requiredBehaviors",
            "forbiddenBehaviors",
            "constraints"
          ]
        },

        draftResponse: {
          type:
            "string"
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

    const semanticFrame =
      this.objectOrEmpty(
        value.semanticFrame
      );

    const caseModel =
      this.objectOrEmpty(
        value.caseModel
      );

    const responseStrategy =
      this.objectOrEmpty(
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

    if (
      !this.isUsableResponseStrategy(
        responseStrategy
      )
    ) {
      validationErrors.push(
        "missing_response_strategy"
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
        responseStrategy
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
          interpretation
        ),

      reasoningDecision:
        this.normalizeReasoningDecision({
          reasoningDecision,
          proposedActions
        }),

      semanticFrame:
        this.normalizeSemanticFrame(
          semanticFrame
        ),

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

      responseStrategy:
        this.normalizeResponseStrategy(
          responseStrategy
        ),

      draftResponse:
        this.normalizeDraftResponse(
          value.draftResponse
        ),

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
          ? "semantic_interpretation_and_response_planning"
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

      rawResult.result,

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
      this.arrayOrEmpty(
        semanticFrame.constraints
      ).length
    );
  },

  isUsableResponseStrategy(
    responseStrategy = {}
  ) {
    if (
      !responseStrategy ||
      typeof responseStrategy !==
        "object" ||
      Array.isArray(
        responseStrategy
      )
    ) {
      return false;
    }

    return Boolean(
      this.nullableString(
        responseStrategy.goal
      ) ||
      this.nullableString(
        responseStrategy.shape
      ) ||
      this.nullableString(
        responseStrategy.tone
      ) ||
      this.arrayOrEmpty(
        responseStrategy
          .orderedPoints
      ).length ||
      this.arrayOrEmpty(
        responseStrategy
          .requiredBehaviors
      ).length ||
      this.arrayOrEmpty(
        responseStrategy
          .forbiddenBehaviors
      ).length ||
      this.arrayOrEmpty(
        responseStrategy.constraints
      ).length
    );
  },

  detectSafetyConflict({
    request = {},
    reasoningDecision = {},
    responseStrategy = {}
  } = {}) {
    const safety =
      request.safety ||
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
      responseStrategy.mode ===
        "safety_limited";

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
    interpretation = {}
  ) {
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
        this.nullableString(
          interpretation.operation
        ),

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
    return {
      ...semanticFrame,

      operation:
        this.nullableString(
          semanticFrame.operation
        ),

      target:
        semanticFrame.target ??
        null,

      domain:
        this.nullableString(
          semanticFrame.domain
        ),

      primaryLane:
        this.nullableString(
          semanticFrame.primaryLane
        ),

      requestedOutput:
        this.nullableString(
          semanticFrame
            .requestedOutput
        ),

      constraints:
        this.stringArray(
          semanticFrame.constraints
        )
    };
  },

  normalizeResponseStrategy(
    responseStrategy = {}
  ) {
    return {
      ...responseStrategy,

      goal:
        this.nullableString(
          responseStrategy.goal
        ),

      shape:
        this.nullableString(
          responseStrategy.shape
        ),

      tone:
        this.nullableString(
          responseStrategy.tone
        ),

      orderedPoints:
        this.arrayOrEmpty(
          responseStrategy
            .orderedPoints
        ),

      requiredBehaviors:
        this.stringArray(
          responseStrategy
            .requiredBehaviors
        ),

      forbiddenBehaviors:
        this.stringArray(
          responseStrategy
            .forbiddenBehaviors
        ),

      constraints:
        this.stringArray(
          responseStrategy.constraints
        )
    };
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

        // Model output can never mark an
        // action as already executed.
        executed:
          false,

        status:
          "proposed"
      }));
  },

  normalizeDraftResponse(value) {
    return typeof value ===
      "string"
      ? value.trim()
      : "";
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
    const ready =
      cognitiveReasoningResult
        .ready === true;

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

      // Compatibility contract for modules that
      // still consume summary.reasoning.
      reasoning: ready
        ? {
            interpretation:
              cognitiveReasoningResult
                .interpretation ||
              null,

            decision:
              cognitiveReasoningResult
                .reasoningDecision ||
              null,

            semanticFrame:
              cognitiveReasoningResult
                .semanticFrame ||
              null,

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

            responseStrategy:
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
                cognitiveReasoningResult
                  .responseStrategy
                  ?.requiredBehaviors
              ),

            forbiddenBehaviors:
              this.arrayOrEmpty(
                cognitiveReasoningResult
                  .responseStrategy
                  ?.forbiddenBehaviors
              ),

            constraints:
              this.arrayOrEmpty(
                cognitiveReasoningResult
                  .responseStrategy
                  ?.constraints
              ),

            confidence:
              cognitiveReasoningResult
                .confidence ??
              0
          }
        : null,

      // These stay null because Expression owns
      // final language realization and delivery.
      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningConfidence:
        cognitiveReasoningResult
          .confidence ??
        0,

      reasoningPrimary:
        cognitiveReasoningResult
          .semanticFrame
          ?.primaryLane ||
        request.responseControl
          ?.primaryLane ||
        request.routing
          ?.primaryLane ||
        null,

      authority:
        ready
          ? "openai_cognitive_reasoning"
          : "none"
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

      caseModel:
        null,

      options:
        [],

      tradeoffs:
        [],

      uncertainties:
        [],

      responseStrategy:
        null,

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
        this.objectOrEmpty(
          modelInvocation
        ),

      cognitiveReasoningResult,

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

    return {
      valid:
        typeof this.reason ===
          "function" &&
        typeof this.create ===
          "function" &&
        typeof this.resolveModelInvoker ===
          "function" &&
        typeof this.validateAndNormalizeResult ===
          "function",

      ready:
        typeof this.reason ===
          "function",

      modelInvokerAvailable:
        Boolean(
          resolvedClient
        ),

      modelInvokerSource:
        resolvedClient
          ?.source ||
        null,

      source:
        this.source,

      version:
        this.version,

      requestSchema:
        this.requestSchema,

      resultSchema:
        this.resultSchema
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