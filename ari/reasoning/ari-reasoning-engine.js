// ari/reasoning/ari-reasoning-engine.js
// Ari Reasoning Engine
// Purpose:
//   Build the canonical cognitive evidence packet,
//   invoke OpenAI as ARI's authoritative reasoning engine,
//   validate the structured result,
//   and expose a safe compatibility contract.
//
// V9.0.0 — OpenAI Cognitive Reasoning Adapter
//
// Authority model:
//
//   ARI:
//   - gathers evidence
//   - defines binding safety and execution constraints
//   - validates model output
//   - controls tools, persistence, and delivery
//
//   OpenAI:
//   - interprets user meaning
//   - builds the semantic frame
//   - analyzes the situation
//   - proposes decisions and actions
//   - defines response strategy
//   - drafts response language
//
//   OpenAI may propose actions.
//   OpenAI may not execute actions or override safety.

window.Ari = window.Ari || {};

window.AriReasoningEngine = {
  version: "9.0.0",

  requestSchema:
    "ari_cognitive_reasoning_request",

  requestSchemaVersion:
    "1.0.0",

  resultSchema:
    "ari_cognitive_reasoning_result",

  resultSchemaVersion:
    "1.0.0",

  // ===================================================
  // Public entry points
  // ===================================================

  async create(input = {}) {
    return this.reason(input);
  },

  async reason(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const reasoningRequest =
      this.resolveReasoningRequest(summary);

    const requestValidation =
      this.validateReasoningRequest(
        reasoningRequest
      );

    if (!requestValidation.valid) {
      return this.buildFailureResult({
        reason:
          "invalid_reasoning_request",

        errors:
          requestValidation.errors,

        request:
          reasoningRequest,

        engineRan:
          false
      });
    }

    const modelInvoker =
      this.resolveModelInvoker(summary);

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
          false
      });
    }

    let rawModelResult;

    try {
      rawModelResult =
        await modelInvoker({
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
          true
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
        true
    });
  },

  // ===================================================
  // Request construction
  // ===================================================

  resolveReasoningRequest(summary = {}) {
    const suppliedRequest =
      summary.reasoningStageInput;

    if (
      suppliedRequest &&
      typeof suppliedRequest === "object"
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
        this.buildUserRequest(summary),

      conversation:
        this.buildConversationContext(summary),

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

      understanding:
        summary.understandingStagePacket ||
        null,

      developerEvidence:
        this.buildDeveloperEvidence(summary),

      responseControl:
        this.buildResponseControl(summary),

      capabilities:
        this.buildCapabilityContext(summary),

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
        ...this.buildUserRequest(summary),
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
      original;

    return {
      original,

      effective,

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

      mayExposePrivateChainOfThought:
        false
    };
  },

  // ===================================================
  // Model invocation
  // ===================================================

  resolveModelInvoker(summary = {}) {
    if (
      typeof summary.openAIReasoningInvoker ===
      "function"
    ) {
      return summary.openAIReasoningInvoker;
    }

    if (
      typeof summary.modelInvoker ===
      "function"
    ) {
      return summary.modelInvoker;
    }

    if (
      typeof window.AriOpenAIReasoningClient
        ?.reason === "function"
    ) {
      return payload =>
        window.AriOpenAIReasoningClient
          .reason(payload);
    }

    if (
      typeof window.AriOpenAIClient
        ?.generateStructured === "function"
    ) {
      return payload =>
        window.AriOpenAIClient
          .generateStructured(payload);
    }

    if (
      typeof window.AriOpenAIClient
        ?.reason === "function"
    ) {
      return payload =>
        window.AriOpenAIClient
          .reason(payload);
    }

    if (
      typeof window.AriOpenAIClient
        ?.createResponse === "function"
    ) {
      return payload =>
        window.AriOpenAIClient
          .createResponse(payload);
    }

    return null;
  },

  getReasoningInstructions() {
    return [
      "Use the complete evidence packet to interpret the user's current request.",

      "Treat safety, routing, response constraints, required behaviors, and forbidden behaviors as binding.",

      "Treat upstream semantic labels as evidence, not as unquestionable conclusions.",

      "Resolve meaning by considering the current turn, recent conversation, continuity evidence, memory, situation, understanding signals, and external evidence together.",

      "Do not provide private chain-of-thought or hidden reasoning. Return concise conclusions, evidence references, assumptions, uncertainties, and decision rationale only.",

      "Do not claim that an action, tool call, message, file change, or external operation has occurred.",

      "Any action must be returned only as a proposed action.",

      "Build one coherent interpretation, semantic frame, response strategy, and optional draft response.",

      "Use an empty array or empty object when a field is not applicable.",

      "Return only data conforming to the supplied response schema."
    ];
  },

  // ===================================================
  // Request validation
  // ===================================================

  validateReasoningRequest(request = {}) {
    const errors = [];

    if (
      !request ||
      typeof request !== "object"
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
      typeof effectiveText !== "string" ||
      !effectiveText.trim()
    ) {
      errors.push(
        "missing_effective_user_request"
      );
    }

    if (
      request.authority
        ?.safetyIsBinding !== true
    ) {
      errors.push(
        "safety_authority_must_be_binding"
      );
    }

    if (
      request.authority
        ?.mayExecuteActions === true
    ) {
      errors.push(
        "model_may_not_execute_actions"
      );
    }

    if (
      request.authority
        ?.mayOverrideSafety === true
    ) {
      errors.push(
        "model_may_not_override_safety"
      );
    }

    return {
      valid:
        errors.length === 0,

      errors
    };
  },

  // ===================================================
  // Response contract
  // ===================================================

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

        neverReturnPrivateChainOfThought:
          true
      }
    };
  },

  // ===================================================
  // Result validation and normalization
  // ===================================================

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
      !Object.keys(
        semanticFrame
      ).length
    ) {
      validationErrors.push(
        "missing_semantic_frame"
      );
    }

    if (
      !Object.keys(
        responseStrategy
      ).length
    ) {
      validationErrors.push(
        "missing_response_strategy"
      );
    }

    const proposedActions =
      this.normalizeProposedActions(
        reasoningDecision.proposedActions ||
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
      proposedActions.some(
        action =>
          action.executed === true ||
          action.status === "completed" ||
          action.status === "executed"
      );

    if (executionConflict) {
      validationErrors.push(
        "model_claimed_action_execution"
      );
    }

    const confidence =
      this.normalizeConfidence(
        value.confidence
      );

    const ready =
      value.ready !== false &&
      validationErrors.length === 0;

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
          validationErrors.length === 0,

        errors:
          validationErrors
      },

      source:
        value.source ||
        rawResult.source ||
        "openai-cognitive-reasoning",

      authority:
        "semantic_interpretation_and_response_planning"
    };
  },

  extractModelValue(rawResult = {}) {
    if (
      rawResult.cognitiveReasoningResult &&
      typeof rawResult
        .cognitiveReasoningResult ===
        "object"
    ) {
      return rawResult
        .cognitiveReasoningResult;
    }

    if (
      rawResult.result &&
      typeof rawResult.result ===
        "object"
    ) {
      return rawResult.result;
    }

    if (
      rawResult.output &&
      typeof rawResult.output ===
        "object"
    ) {
      return rawResult.output;
    }

    return this.objectOrEmpty(
      rawResult
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
      safety.safetyShouldStopNormalResponse ===
        true ||
      safety.disposition
        ?.shouldStopNormalResponse === true;

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
          .clarificationRequired === true,

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
          .answerDirectly !== false,

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
        typeof option === "string"
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
        this.objectOrEmpty(option);

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
        typeof tradeoff === "string"
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
          value.material !== false,

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
      .filter(action =>
        action &&
        typeof action === "object" &&
        typeof action.type ===
          "string"
      )
      .map(action => ({
        type:
          action.type,

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
    return typeof value === "string"
      ? value
      : "";
  },

  normalizeConfidence(value) {
    if (
      value &&
      typeof value === "object"
    ) {
      return this.clampConfidence(
        value.score
      );
    }

    return this.clampConfidence(
      value
    );
  },

  // ===================================================
  // Engine response construction
  // ===================================================

  buildEngineResult({
    cognitiveReasoningResult = {},
    request = {},
    engineRan = false
  } = {}) {
    return {
      reasoningEngineRan:
        engineRan,

      reasoningEngineReady:
        cognitiveReasoningResult
          .ready === true,

      reasoningEngineVersion:
        this.version,

      reasoningSource:
        cognitiveReasoningResult
          .source ||
        "openai-cognitive-reasoning",

      cognitiveReasoningResult,

      // Compatibility contract for modules that
      // still consume summary.reasoning.
      reasoning: {
        interpretation:
          cognitiveReasoningResult
            .interpretation ||
          {},

        decision:
          cognitiveReasoningResult
            .reasoningDecision ||
          {},

        semanticFrame:
          cognitiveReasoningResult
            .semanticFrame ||
          {},

        caseModel:
          cognitiveReasoningResult
            .caseModel ||
          {},

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
          {},

        grounding:
          cognitiveReasoningResult
            .grounding ||
          {},

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
      },

      // These stay null because downstream
      // Expression owns final language delivery.
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
        "openai_cognitive_reasoning"
    };
  },

  buildFailureResult({
    reason =
      "reasoning_failed",

    errors = [],

    request = {},

    engineRan = false
  } = {}) {
    const cognitiveReasoningResult = {
      schema:
        this.resultSchema,

      schemaVersion:
        this.resultSchemaVersion,

      ready:
        false,

      authoritative:
        false,

      interpretation: {
        conversationFunction:
          null,

        userGoal:
          null,

        operation:
          null,

        meaning:
          null,

        subjects:
          [],

        contextUsed:
          false,

        clarificationRequired:
          false,

        clarificationQuestion:
          null,

        ambiguity:
          []
      },

      reasoningDecision: {
        answerDirectly:
          false,

        reasoningMode:
          "clarification",

        toolsNeeded:
          [],

        proposedActions:
          [],

        decisionRationale:
          null,

        shouldAskClarifyingQuestion:
          false
      },

      semanticFrame: {
        operation:
          null,

        target:
          null,

        domain:
          null,

        primaryLane:
          null,

        requestedOutput:
          null,

        constraints:
          []
      },

      caseModel:
        {},

      options:
        [],

      tradeoffs:
        [],

      uncertainties:
        [],

      responseStrategy: {
        goal:
          null,

        shape:
          null,

        tone:
          null,

        orderedPoints:
          [],

        requiredBehaviors:
          [],

        forbiddenBehaviors:
          [],

        constraints:
          []
      },

      draftResponse:
        "",

      grounding: {
        evidenceUsed:
          [],

        assumptions:
          [],

        unresolvedConflicts:
          []
      },

      confidence:
        0,

      validation: {
        passed:
          false,

        errors:
          this.cleanStringList([
            reason,
            ...errors
          ])
      },

      source:
        "ari-reasoning-engine-failure",

      authority:
        "none"
    };

    return {
      reasoningEngineRan:
        engineRan,

      reasoningEngineReady:
        false,

      reasoningEngineVersion:
        this.version,

      reasoningSource:
        "ari-reasoning-engine-failure",

      cognitiveReasoningResult,

      reasoning:
        {},

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningConfidence:
        0,

      reasoningPrimary:
        request.responseControl
          ?.primaryLane ||
        null,

      authority:
        "none",

      reason,

      errors:
        cognitiveReasoningResult
          .validation.errors
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  objectOrEmpty(value) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  },

  arrayOrEmpty(value) {
    return Array.isArray(value)
      ? value.filter(
          item =>
            item !== undefined &&
            item !== null
        )
      : [];
  },

  stringArray(value) {
    return [
      ...new Set(
        this.arrayOrEmpty(value)
          .map(item =>
            typeof item === "string"
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
        this.arrayOrEmpty(value)
          .map(item =>
            String(item || "")
              .trim()
          )
          .filter(Boolean)
      )
    ];
  },

  nullableString(value) {
    if (
      typeof value !== "string"
    ) {
      return null;
    }

    const clean =
      value.trim();

    return clean || null;
  },

  clampConfidence(value) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(1, number)
    );
  }
};

console.log(
  "ARI REASONING ENGINE LOADED:",
  window.AriReasoningEngine?.version
);