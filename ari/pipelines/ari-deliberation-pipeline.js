// ari/pipelines/ari-deliberation-pipeline.js
// Ari Deliberation Pipeline
//
// Purpose:
// Coordinate deterministic context preparation, OpenAI reasoning,
// semantic validation, and response planning.
//
// V2.0.0 — OpenAI Cognitive Authority + Semantic Validation
//
// Canonical order:
// 1. Continuity
// 2. Safety
// 3. Situation
// 4. Memory
// 5. OpenAI Reasoning
// 6. Semantic Validation
// 7. Response Planning
//
// Authority model:
// - Deterministic stages prepare evidence and constraints.
// - OpenAI Reasoning is the sole semantic authority.
// - AriSemanticFrameValidator validates but never invents meaning.
// - Response Planning may consume only validated AI output.
// - This pipeline orchestrates stages but does not itself interpret meaning.

window.Ari = window.Ari || {};

window.AriDeliberationPipeline = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-deliberation-pipeline",
  architecture:
    "openai-semantic-authority-with-deterministic-validation",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activePipelineLayer:
        "deliberation",

      deliberationStageErrors:
        Array.isArray(
          summary.deliberationStageErrors
        )
          ? [
              ...summary.deliberationStageErrors
            ]
          : []
    };

    const executivePacket =
      state.executivePacket ||
      this.buildFallbackExecutivePacket(
        state
      );

    state = {
      ...state,
      executivePacket
    };

    /* =====================================================
       1. CONTINUITY STAGE
       Retrieves and preserves continuity context.

       It may resolve references and gather prior-turn facts.
       It must not infer current-turn semantic meaning.
    ===================================================== */

    mark("before continuityStage");

    state =
      await this.runStage(
        window.AriContinuityStage ||
        window.Ari?.continuityStage,
        state,
        runtime,
        "continuity"
      );

    mark("after continuityStage");

    /* =====================================================
       2. SAFETY STAGE
       Establishes deterministic response-governance
       requirements before OpenAI reasoning.
    ===================================================== */

    mark("before safetyStage");

    state =
      await this.runStage(
        window.AriSafetyDeliberationStage ||
        window.Ari?.safetyDeliberationStage,
        state,
        runtime,
        "safety"
      );

    mark("after safetyStage");

    /* =====================================================
       3. SITUATION STAGE
       Models situational facts, lanes, stakes, and
       constraints without selecting semantic intent.
    ===================================================== */

    mark("before situationStage");

    state =
      await this.runStage(
        window.AriSituationStage ||
        window.Ari?.situationStage,
        state,
        runtime,
        "situation"
      );

    mark("after situationStage");

    /* =====================================================
       4. MEMORY STAGE
       Retrieves controlled memory context when allowed by
       routing and continuity requirements.
    ===================================================== */

    mark("before memoryStage");

    state =
      await this.runStage(
        window.AriMemoryStage ||
        window.Ari?.memoryStage,
        state,
        runtime,
        "memory"
      );

    mark("after memoryStage");

    /* =====================================================
       5. OPENAI REASONING STAGE
       Sole semantic authority.

       Required input:
       - evidencePacket
       - executivePacket / routing contract
       - continuity context
       - safety constraints
       - situation facts
       - memory facts

       Expected output:
       - cognitiveReasoningResult
       - semanticFrame
       - responseRequirements
       - executionMetadata
       - evidenceReferences
    ===================================================== */

    mark("before reasoningStage");

    state =
      await this.runStage(
        window.AriReasoningStage ||
        window.AriOpenAIReasoningStage ||
        window.Ari?.reasoningStage ||
        window.Ari?.openAIReasoningStage,
        state,
        runtime,
        "reasoning"
      );

    state =
      this.normalizeReasoningOutputs(
        state
      );

    mark("after reasoningStage");

    /* =====================================================
       6. SEMANTIC VALIDATION STAGE
       Validates AI-produced meaning.

       It may reject invalid output.
       It may generate compatibility projections strictly
       from validated AI output.
       It must never repair or invent meaning.
    ===================================================== */

    mark("before semanticValidationStage");

    state =
      await this.runSemanticValidationStage(
        state,
        runtime
      );

    mark("after semanticValidationStage");

    /* =====================================================
       7. RESPONSE PLANNING STAGE
       May run only after semantic validation accepts the
       AI-produced semantic frame.
    ===================================================== */

    mark("before responsePlanningStage");

    if (
      this.isSemanticValidationAccepted(
        state
      )
    ) {
      state =
        await this.runStage(
          window.AriResponsePlanningStage ||
          window.Ari?.responsePlanningStage,
          state,
          runtime,
          "response_planning"
        );
    } else {
      state = {
        ...state,

        responsePlanningStageRan:
          false,

        responsePlanningStageSource:
          "blocked-by-semantic-validation",

        responsePlanningStageError:
          "Response planning was blocked because semantic validation did not accept the AI semantic frame.",

        responsePlan:
          null,

        responseStrategy:
          null,

        deliberationStageErrors: [
          ...this.toArray(
            state.deliberationStageErrors
          ),

          {
            stage:
              "response_planning",

            error:
              "semantic_validation_not_accepted"
          }
        ]
      };
    }

    mark("after responsePlanningStage");

    /* =====================================================
       8. DELIBERATION DIAGNOSTICS
    ===================================================== */

    const deliberationDiagnostics =
      this.buildDeliberationDiagnostics(
        state
      );

    state = {
      ...state,

      deliberationDiagnostics,

      deliberationHealthy:
        deliberationDiagnostics.healthy,

      deliberationWarnings:
        deliberationDiagnostics.warnings
    };

    /* =====================================================
       9. FINAL DELIBERATION PACKET
    ===================================================== */

    state.deliberationPacket =
      this.buildDeliberationPacket(
        state
      );

    // Temporary compatibility alias.
    state.deliberationContract =
      state.deliberationPacket;

    state.deliberationPipelineRan =
      true;

    state.deliberationPipelineReady =
      state.deliberationPacket
        ?.ready === true;

    state.deliberationPipelineSource =
      this.source;

    state.deliberationPipelineVersion =
      this.version;

    return state;
  },

  /* =====================================================
     GENERIC STAGE RUNNER
  ===================================================== */

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (
      !stage ||
      typeof stage.run !==
        "function"
    ) {
      return this.appendStageError(
        summary,
        stageName,
        "stage_not_loaded",
        `The ${stageName} stage was not loaded.`,
        "not-loaded"
      );
    }

    try {
      const result =
        await stage.run(
          summary,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        return this.appendStageError(
          summary,
          stageName,
          "invalid_stage_result",
          `The ${stageName} stage returned an invalid result.`,
          "invalid-result"
        );
      }

      // The pipeline owns accumulated state. A stage may
      // return either a full state or only fields it produced.
      return {
        ...summary,
        ...result
      };
    } catch (error) {
      console.error(
        `Ari deliberation stage error: ${stageName}`,
        error
      );

      return this.appendStageError(
        summary,
        stageName,
        error?.message ||
          String(error),
        error?.message ||
          String(error),
        "stage-error"
      );
    }
  },

  appendStageError(
    summary = {},
    stageName = "unknown",
    code = "stage_error",
    message = "Stage error.",
    source = "stage-error"
  ) {
    return {
      ...summary,

      [`${stageName}StageRan`]:
        false,

      [`${stageName}StageSource`]:
        source,

      [`${stageName}StageError`]:
        message,

      deliberationStageErrors: [
        ...this.toArray(
          summary.deliberationStageErrors
        ),

        {
          stage:
            stageName,

          error:
            code,

          message
        }
      ]
    };
  },

  /* =====================================================
     REASONING NORMALIZATION
  ===================================================== */

  normalizeReasoningOutputs(
    summary = {}
  ) {
    const reasoningPacket =
      summary.cognitiveReasoningResult ||
      summary.reasoningResult ||
      summary.reasoningStagePacket ||
      summary.openAIReasoningResult ||
      null;

    const semanticFrame =
      reasoningPacket
        ?.semanticFrame ||
      summary.semanticFrame ||
      null;

    const responseRequirements =
      reasoningPacket
        ?.responseRequirements ||
      summary.responseRequirements ||
      null;

    const executionMetadata =
      reasoningPacket
        ?.executionMetadata ||
      summary.executionMetadata ||
      null;

    const evidenceReferences =
      reasoningPacket
        ?.evidenceReferences ||
      summary.evidenceReferences ||
      [];

    return {
      ...summary,

      cognitiveReasoningResult:
        reasoningPacket,

      reasoningResult:
        reasoningPacket,

      semanticFrame,

      aiSemanticFrame:
        semanticFrame,

      responseRequirements,

      executionMetadata,

      evidenceReferences,

      reasoningPacketAvailable:
        Boolean(
          reasoningPacket
        ),

      semanticFrameAvailable:
        Boolean(
          semanticFrame
        )
    };
  },

  /* =====================================================
     SEMANTIC VALIDATION
  ===================================================== */

  async runSemanticValidationStage(
    summary = {},
    runtime = {}
  ) {
    const stage =
      window.AriSemanticValidationStage ||
      window.Ari?.semanticValidationStage ||
      null;

    if (
      stage &&
      typeof stage.run ===
        "function"
    ) {
      const result =
        await this.runStage(
          stage,
          summary,
          runtime,
          "semantic_validation"
        );

      return this.normalizeSemanticValidationOutputs(
        result
      );
    }

    const validator =
      window.AriSemanticFrameValidator ||
      window.Ari?.semanticFrameValidator ||
      null;

    if (
      !validator ||
      (
        typeof validator.validate !==
          "function" &&
        typeof validator.run !==
          "function"
      )
    ) {
      return this.appendStageError(
        summary,
        "semantic_validation",
        "semantic_frame_validator_not_loaded",
        "AriSemanticFrameValidator was not loaded.",
        "not-loaded"
      );
    }

    try {
      const validationInput = {
        semanticFrame:
          summary.semanticFrame ||
          summary
            .cognitiveReasoningResult
            ?.semanticFrame ||
          null,

        cognitiveReasoningResult:
          summary
            .cognitiveReasoningResult ||
          null,

        evidencePacket:
          summary.evidencePacket ||
          summary.perceptionPacket
            ?.evidencePacket ||
          null,

        operationRegistry:
          window.AriOperationRegistry ||
          window.Ari?.operationRegistry ||
          null,

        continuity:
          summary.continuityStagePacket ||
          summary.continuityResolution ||
          null,

        executionMetadata:
          summary.executionMetadata ||
          null,

        responseRequirements:
          summary.responseRequirements ||
          null
      };

      const validateMethod =
        typeof validator.validate ===
          "function"
          ? validator.validate
          : validator.run;

      const result =
        await validateMethod.call(
          validator,
          validationInput,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        return this.appendStageError(
          summary,
          "semantic_validation",
          "invalid_validator_result",
          "AriSemanticFrameValidator returned an invalid result.",
          "invalid-result"
        );
      }

      return this.normalizeSemanticValidationOutputs({
        ...summary,

        semanticValidationStageRan:
          true,

        semanticValidationStageSource:
          result.source ||
          "ari-semantic-frame-validator",

        semanticValidationStagePacket:
          result,

        semanticFrameValidatorResult:
          result
      });
    } catch (error) {
      console.error(
        "Ari semantic validation error:",
        error
      );

      return this.appendStageError(
        summary,
        "semantic_validation",
        error?.message ||
          String(error),
        error?.message ||
          String(error),
        "stage-error"
      );
    }
  },

  normalizeSemanticValidationOutputs(
    summary = {}
  ) {
    const validation =
      summary
        .semanticFrameValidatorResult ||
      summary
        .semanticValidationStagePacket ||
      summary
        .semanticFrameValidation ||
      null;

    const accepted =
      validation
        ?.accepted === true ||
      validation
        ?.valid === true ||
      validation
        ?.status ===
        "accepted";

    const validatedSemanticFrame =
      accepted
        ? (
            validation
              ?.validatedSemanticFrame ||
            validation
              ?.semanticFrame ||
            summary.semanticFrame ||
            null
          )
        : null;

    const compatibility =
      validation
        ?.compatibility ||
      validation
        ?.compatibilityProjections ||
      validation
        ?.projections ||
      null;

    return {
      ...summary,

      semanticFrameValidatorResult:
        validation,

      semanticFrameValidation:
        validation,

      semanticValidationAccepted:
        accepted,

      semanticValidationRejected:
        !accepted,

      validatedSemanticFrame,

      rejectedSemanticFrame:
        accepted
          ? null
          : (
              validation
                ?.rejectedSemanticFrame ||
              summary.semanticFrame ||
              null
            ),

      semanticCompatibility:
        compatibility,

      canonicalMeaning:
        compatibility
          ?.canonicalMeaning ||
        null,

      primaryFrame:
        compatibility
          ?.primaryFrame ||
        validatedSemanticFrame ||
        null,

      semanticSummary:
        compatibility
          ?.semanticSummary ||
        validatedSemanticFrame
          ?.semanticSummary ||
        null,

      semanticSlots:
        compatibility
          ?.semanticSlots ||
        validatedSemanticFrame
          ?.slots ||
        null,

      validatedResponseRequirements:
        compatibility
          ?.responseRequirements ||
        validation
          ?.responseRequirements ||
        summary.responseRequirements ||
        null
    };
  },

  isSemanticValidationAccepted(
    summary = {}
  ) {
    return (
      summary
        .semanticValidationAccepted ===
        true &&
      Boolean(
        summary.validatedSemanticFrame
      )
    );
  },

  /* =====================================================
     DELIBERATION DIAGNOSTICS
  ===================================================== */

  buildDeliberationDiagnostics(
    summary = {}
  ) {
    const errors = [
      ...this.toArray(
        summary.deliberationStageErrors
      )
    ];

    const warnings = [];

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null;

    const reasoningAvailable =
      Boolean(
        summary.cognitiveReasoningResult
      );

    const semanticFrameAvailable =
      Boolean(
        summary.semanticFrame
      );

    const validationAccepted =
      this.isSemanticValidationAccepted(
        summary
      );

    const responsePlanAvailable =
      Boolean(
        summary.responsePlan ||
        summary.responseStrategy ||
        summary
          .responsePlanningStagePacket
      );

    if (!evidencePacket) {
      errors.push({
        stage:
          "deliberation",

        error:
          "evidence_packet_missing"
      });
    }

    if (!reasoningAvailable) {
      errors.push({
        stage:
          "reasoning",

        error:
          "cognitive_reasoning_result_missing"
      });
    }

    if (!semanticFrameAvailable) {
      errors.push({
        stage:
          "reasoning",

        error:
          "semantic_frame_missing"
      });
    }

    if (!validationAccepted) {
      errors.push({
        stage:
          "semantic_validation",

        error:
          "semantic_validation_not_accepted"
      });
    }

    if (
      responsePlanAvailable &&
      !validationAccepted
    ) {
      errors.push({
        stage:
          "response_planning",

        error:
          "response_plan_exists_without_validated_semantic_frame"
      });
    }

    if (
      !summary.executivePacket
    ) {
      warnings.push(
        "executive_packet_missing_or_fallback_used"
      );
    }

    return {
      deliberationDiagnosticsRan:
        true,

      deliberationDiagnosticsVersion:
        this.version,

      healthy:
        errors.length ===
        0,

      complete:
        errors.length ===
          0 &&
        responsePlanAvailable,

      errors,
      warnings,

      stages: {
        continuity:
          summary.continuityStageRan ===
          true,

        safety:
          summary.safetyStageRan ===
          true,

        situation:
          summary.situationStageRan ===
          true,

        memory:
          summary.memoryStageRan ===
          true,

        reasoning:
          reasoningAvailable,

        semanticValidation:
          validationAccepted,

        responsePlanning:
          summary
            .responsePlanningStageRan ===
          true
      },

      contracts: {
        evidencePacketAvailable:
          Boolean(
            evidencePacket
          ),

        reasoningResultAvailable:
          reasoningAvailable,

        semanticFrameAvailable,

        validatedSemanticFrameAvailable:
          Boolean(
            summary
              .validatedSemanticFrame
          ),

        responseRequirementsAvailable:
          Boolean(
            summary
              .validatedResponseRequirements ||
            summary
              .responseRequirements
          ),

        responsePlanAvailable
      },

      invariants: {
        openAIIsSoleSemanticAuthority:
          true,

        semanticFrameValidatedBeforePlanning:
          validationAccepted,

        responsePlanningBlockedOnValidationFailure:
          !responsePlanAvailable ||
          validationAccepted,

        localUnderstandingStageRemoved:
          true
      }
    };
  },

  /* =====================================================
     DELIBERATION PACKET
  ===================================================== */

  buildDeliberationPacket(
    summary = {}
  ) {
    const diagnostics =
      summary.deliberationDiagnostics ||
      null;

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      null;

    const validation =
      summary
        .semanticFrameValidatorResult ||
      summary
        .semanticFrameValidation ||
      null;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      null;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      summary
        .responsePlanningStagePacket ||
      null;

    return {
      schema:
        "ari_deliberation_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        diagnostics
          ?.complete === true,

      source:
        this.source,

      version:
        this.version,

      architecture:
        this.architecture,

      /* -----------------------------------------------
         Input contracts
      ----------------------------------------------- */

      inputs: {
        perceptionPacket:
          summary.perceptionPacket ||
          null,

        evidencePacket,

        executivePacket:
          summary.executivePacket ||
          null,

        routingContract:
          summary.routingContract ||
          summary.executivePacket
            ?.routingContract ||
          null
      },

      /* -----------------------------------------------
         Deterministic context stages
      ----------------------------------------------- */

      stages: {
        continuity:
          summary
            .continuityStagePacket ||
          null,

        safety:
          summary
            .safetyStagePacket ||
          null,

        situation:
          summary
            .situationStagePacket ||
          null,

        memory:
          summary
            .memoryStagePacket ||
          null,

        reasoning:
          summary
            .reasoningStagePacket ||
          reasoningResult,

        semanticValidation:
          summary
            .semanticValidationStagePacket ||
          validation,

        responsePlanning:
          summary
            .responsePlanningStagePacket ||
          null
      },

      /* -----------------------------------------------
         Current request
      ----------------------------------------------- */

      request: {
        original:
          summary.currentTurn
            ?.originalText ||
          summary.originalUserMessage ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        effective:
          summary.currentTurn
            ?.effectiveText ||
          summary.effectiveUserMessage ||
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        currentTurnWasResolved:
          summary
            .currentTurnWasResolved ===
          true
      },

      /* -----------------------------------------------
         Context and governance
      ----------------------------------------------- */

      context: {
        continuity:
          summary
            .continuityStagePacket ||
          summary.continuityResolution ||
          null,

        safety:
          summary.safetyDisposition ||
          summary
            .safetyStagePacket ||
          null,

        situation:
          summary.situationContract ||
          summary.situationMap ||
          null,

        memory:
          summary.memoryHandoff ||
          summary.memoryContext ||
          null
      },

      /* -----------------------------------------------
         OpenAI cognitive authority
      ----------------------------------------------- */

      reasoning: {
        available:
          Boolean(
            reasoningResult
          ),

        source:
          reasoningResult
            ?.source ||
          summary.reasoningStageSource ||
          null,

        model:
          reasoningResult
            ?.model ||
          reasoningResult
            ?.modelId ||
          null,

        result:
          reasoningResult,

        semanticFrame:
          summary.semanticFrame ||
          reasoningResult
            ?.semanticFrame ||
          null,

        responseRequirements:
          summary.responseRequirements ||
          reasoningResult
            ?.responseRequirements ||
          null,

        executionMetadata:
          summary.executionMetadata ||
          reasoningResult
            ?.executionMetadata ||
          null,

        evidenceReferences:
          summary.evidenceReferences ||
          reasoningResult
            ?.evidenceReferences ||
          []
      },

      /* -----------------------------------------------
         Semantic validation
      ----------------------------------------------- */

      semanticValidation: {
        available:
          Boolean(
            validation
          ),

        accepted:
          summary
            .semanticValidationAccepted ===
          true,

        rejected:
          summary
            .semanticValidationRejected ===
          true,

        result:
          validation,

        validatedSemanticFrame,

        rejectedSemanticFrame:
          summary.rejectedSemanticFrame ||
          null,

        compatibility:
          summary.semanticCompatibility ||
          null,

        canonicalMeaning:
          summary.canonicalMeaning ||
          null,

        primaryFrame:
          summary.primaryFrame ||
          validatedSemanticFrame ||
          null,

        semanticSummary:
          summary.semanticSummary ||
          null,

        semanticSlots:
          summary.semanticSlots ||
          null,

        responseRequirements:
          summary
            .validatedResponseRequirements ||
          null
      },

      /* -----------------------------------------------
         Response planning
      ----------------------------------------------- */

      responsePlanning: {
        allowed:
          this.isSemanticValidationAccepted(
            summary
          ),

        ran:
          summary
            .responsePlanningStageRan ===
          true,

        plan:
          responsePlan,

        strategy:
          summary.responseStrategy ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      /* -----------------------------------------------
         Quality
      ----------------------------------------------- */

      diagnostics,

      quality: {
        allRequiredStagesHealthy:
          diagnostics
            ?.healthy === true,

        stageErrors:
          diagnostics
            ?.errors ||
          [],

        warnings:
          diagnostics
            ?.warnings ||
          [],

        hasEvidencePacket:
          Boolean(
            evidencePacket
          ),

        hasCognitiveReasoningResult:
          Boolean(
            reasoningResult
          ),

        hasSemanticFrame:
          Boolean(
            summary.semanticFrame ||
            reasoningResult
              ?.semanticFrame
          ),

        hasValidatedSemanticFrame:
          Boolean(
            validatedSemanticFrame
          ),

        semanticValidationAccepted:
          summary
            .semanticValidationAccepted ===
          true,

        hasResponsePlan:
          Boolean(
            responsePlan
          )
      },

      /* -----------------------------------------------
         Authority boundary
      ----------------------------------------------- */

      authority: {
        canCoordinateDeterministicContext:
          true,

        canRunOpenAIReasoningStage:
          true,

        canRunSemanticValidation:
          true,

        canRunResponsePlanning:
          true,

        canPreserveEvidencePacket:
          true,

        canPreserveCognitiveReasoningResult:
          true,

        canPreserveValidatedSemanticFrame:
          true,

        canInterpretMeaningLocally:
          false,

        canConstructSemanticFrameLocally:
          false,

        canRepairSemanticFrame:
          false,

        canInventIntent:
          false,

        canInventUserGoal:
          false,

        canSelectOperationLocally:
          false,

        canBypassSemanticValidation:
          false,

        canPlanFromUnvalidatedMeaning:
          false,

        canChooseFinalRoute:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "deliberation_orchestration_openai_reasoning_validation_and_planning_handoff"
      }
    };
  },

  /* =====================================================
     EXECUTIVE FALLBACK
  ===================================================== */

  buildFallbackExecutivePacket(
    summary = {}
  ) {
    return {
      ready:
        false,

      source:
        "ari-deliberation-pipeline-fallback",

      version:
        this.version,

      routingContract:
        summary.routingContract ||
        null,

      selectedRoute: {
        mode:
          summary.conversationMode ||
          "unknown",

        primaryIntent:
          "unresolved",

        domain:
          summary.conversationDomain ||
          "general",

        contextLane:
          summary.contextLane ||
          summary.lane ||
          "direct_current_turn",

        primaryLane:
          summary.primaryLane ||
          null,

        capabilities:
          summary.requiredCapabilities ||
          [],

        planner:
          summary.selectedPlanner ||
          null
      },

      runInstructions: {
        continuity:
          true,

        thread:
          summary.laneSplit
            ?.routing
            ?.useThread ===
          true,

        memory:
          summary.laneSplit
            ?.routing
            ?.useMemory ===
          true,

        relationship:
          summary.laneSplit
            ?.routing
            ?.useRelationship ===
          true,

        deepSafety:
          true,

        situationMap:
          true,

        memoryRetrieval:
          true,

        openAIReasoning:
          true,

        semanticValidation:
          true,

        responsePlanning:
          true
      },

      authority: {
        canChooseRoute:
          false,

        canChooseSemanticIntent:
          false,

        canPerformSemanticReasoning:
          false,

        canConstructSemanticFrame:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "compatibility_executive_fallback"
      }
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const required = {
      operationRegistry:
        Boolean(
          window.AriOperationRegistry ||
          window.Ari?.operationRegistry
        ),

      semanticFrameValidator:
        Boolean(
          window.AriSemanticFrameValidator ||
          window.Ari?.semanticFrameValidator
        ),

      reasoningStage:
        Boolean(
          window.AriReasoningStage ||
          window.AriOpenAIReasoningStage ||
          window.Ari?.reasoningStage ||
          window.Ari?.openAIReasoningStage
        ),

      responsePlanningStage:
        Boolean(
          window.AriResponsePlanningStage ||
          window.Ari?.responsePlanningStage
        )
    };

    const errors = [];

    if (
      !required.semanticFrameValidator
    ) {
      errors.push(
        "semantic_frame_validator_not_loaded"
      );
    }

    const warnings = [];

    if (
      !required.operationRegistry
    ) {
      warnings.push(
        "operation_registry_not_loaded"
      );
    }

    if (
      !required.reasoningStage
    ) {
      warnings.push(
        "reasoning_stage_not_loaded"
      );
    }

    if (
      !required.responsePlanningStage
    ) {
      warnings.push(
        "response_planning_stage_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
          0 &&
        warnings.length ===
          0,

      source:
        "ari-deliberation-pipeline-validation",

      version:
        this.version,

      errors,
      warnings,

      required,

      checks: {
        localUnderstandingStageRemoved:
          true,

        openAIReasoningIsSemanticAuthority:
          true,

        validatorCannotInventMeaning:
          true,

        responsePlanningRequiresValidatedFrame:
          true
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  toArray(
    value
  ) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null
      );
    }

    if (
      value === undefined ||
      value === null
    ) {
      return [];
    }

    return [value];
  }
};

window.Ari.deliberationPipeline =
  window.AriDeliberationPipeline;

const ariDeliberationPipelineValidation =
  window.AriDeliberationPipeline
    ?.validate?.();

console.log(
  "ARI DELIBERATION PIPELINE LOADED:",
  window.AriDeliberationPipeline
    ?.version,

  ariDeliberationPipelineValidation
    ?.ready ===
    true
    ? "READY"
    : ariDeliberationPipelineValidation
        ?.valid ===
        true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariDeliberationPipelineValidation
);
