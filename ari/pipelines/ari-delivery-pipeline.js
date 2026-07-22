// ari/pipelines/ari-delivery-pipeline.js
// Ari Delivery Pipeline
//
// Purpose:
// Coordinate approved actions, governed persistence, delivery diagnostics,
// and the final immutable delivery handoff without allowing non-response
// subsystems to invalidate an already-authoritative user response.
//
// V3.0.0 — Response-First Delivery / Non-Blocking Persistence Diagnostics
//
// Canonical flow:
//
// Expression Pipeline
//      ↓
// Final Authoritative Response
//      ↓
// Delivery Input Governance
//      ↓
// Action Delivery
//      ↓
// Learning and Persistence
//      ↓
// Delivery Diagnostics
//      ↓
// Canonical Delivery Packet
//      ↓
// Runtime Delivery Adapter
//
// Responsibilities:
// - Read the final authoritative response.
// - Validate delivery contracts without reinterpreting meaning.
// - Coordinate approved actions.
// - Coordinate validated semantic persistence.
// - Coordinate approved memory persistence.
// - Record non-fatal action, learning, persistence, and diagnostics failures.
// - Preserve the immutable final response.
// - Produce one canonical delivery result and delivery packet.
// - Mark response delivery ready whenever an authorized response is available.
// - Keep delivery health and persistence completion separate from response readiness.
//
// Non-responsibilities:
// - Does not generate a response.
// - Does not replace a response with a generic failure message.
// - Does not run Response Realization.
// - Does not use Blueprint Writer.
// - Does not use AI Writer.
// - Does not select or arbitrate drafts.
// - Does not reinterpret evidence or semantic meaning.
// - Does not repair semantic frames.
// - Does not persist unvalidated semantic output.
// - Does not create memory from unvalidated semantics.
// - Does not alter the final response.
// - Does not alter routing.
// - Does not override safety.
// - Does not allow optional persistence failures to block response delivery.

window.Ari = window.Ari || {};

window.AriDeliveryPipeline = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-delivery-pipeline",
  architecture: "response-first-delivery-with-non-blocking-persistence",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activePipelineLayer:
        "delivery",

      deliveryStageErrors:
        this.toArray(
          summary.deliveryStageErrors
        ),

      deliveryStageWarnings:
        this.toArray(
          summary.deliveryStageWarnings
        )
    };

    const expressionPacket =
      this.readExpressionPacket(
        state
      ) ||
      this.buildFallbackExpressionPacket(
        state
      );

    state = {
      ...state,

      expressionPacket,

      deliveryPipelineSource:
        this.source,

      deliveryPipelineVersion:
        this.version
    };

    /* =================================================
       1. DELIVERY INPUT GOVERNANCE
    ================================================= */

    mark(
      "before deliveryInputGovernance"
    );

    state.deliveryInputGovernance =
      this.validateDeliveryInputs(
        state
      );

    state.deliveryInputGovernanceRan =
      true;

    state.deliveryInputGovernanceSource =
      "ari-delivery-input-governance";

    state.deliveryInputGovernanceVersion =
      this.version;

    mark(
      "after deliveryInputGovernance"
    );

    /* =================================================
       2. ACTION DELIVERY STAGE
    ================================================= */

    mark(
      "before actionDeliveryStage"
    );

    state =
      await this.runStage(
        window.AriActionDeliveryStage ||
        window.Ari
          ?.actionDeliveryStage,

        state,

        runtime,

        "actionDelivery",

        {
          fatal:
            false
        }
      );

    mark(
      "after actionDeliveryStage"
    );

    /* =================================================
       3. LEARNING AND PERSISTENCE STAGE
    ================================================= */

    mark(
      "before learningPersistenceStage"
    );

    state =
      await this.runStage(
        window.AriLearningPersistenceStage ||
        window.Ari
          ?.learningPersistenceStage,

        state,

        runtime,

        "learningPersistence",

        {
          fatal:
            false
        }
      );

    mark(
      "after learningPersistenceStage"
    );

    /* =================================================
       4. DELIVERY DIAGNOSTICS STAGE
    ================================================= */

    mark(
      "before deliveryDiagnosticsStage"
    );

    state =
      await this.runStage(
        window.AriDeliveryDiagnosticsStage ||
        window.Ari
          ?.deliveryDiagnosticsStage,

        state,

        runtime,

        "deliveryDiagnostics",

        {
          fatal:
            false
        }
      );

    mark(
      "after deliveryDiagnosticsStage"
    );

    /* =================================================
       5. DELIVERY DIAGNOSTICS SUMMARY
    ================================================= */

    state.deliveryPipelineDiagnostics =
      this.buildDeliveryDiagnostics(
        state
      );

    state.deliveryHealthy =
      state.deliveryPipelineDiagnostics
        .healthy ===
      true;

    state.deliveryDegraded =
      state.deliveryPipelineDiagnostics
        .degraded ===
      true;

    state.deliveryWarnings =
      state.deliveryPipelineDiagnostics
        .warnings;

    /* =================================================
       6. FINAL DELIVERY PACKET
    ================================================= */

    state.deliveryPacket =
      this.buildDeliveryPacket(
        state
      );

    state.deliveryResult =
      state.deliveryPacket
        .deliveryResult;

    state.deliveryPipelineRan =
      true;

    state.deliveryPipelineReady =
      state.deliveryPacket.ready ===
      true;

    state.deliveryPipelineUsable =
      state.deliveryPacket.usable ===
      true;

    state.deliveryPipelineComplete =
      state.deliveryPacket.complete ===
      true;

    state.deliveryPipelineSuccessful =
      state.deliveryPacket.success ===
      true;

    state.deliveryPipelineDegraded =
      state.deliveryPacket.degraded ===
      true;

    state.deliveryStatus =
      state.deliveryPacket
        .deliveryStatus;

    state.deliveryPipelineSource =
      this.source;

    state.deliveryPipelineVersion =
      this.version;

    state.activePipelineLayer =
      "complete";

    return state;
  },

  /* =====================================================
     STAGE RUNNER
  ===================================================== */

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown",
    options = {}
  ) {
    const fatal =
      options.fatal ===
      true;

    if (
      !stage ||
      typeof stage.run !==
        "function"
    ) {
      return this.appendStageIssue({
        summary,

        stageName,

        code:
          "stage_not_loaded",

        message:
          `The ${stageName} stage was not loaded.`,

        source:
          "not-loaded",

        fatal
      });
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
        Array.isArray(
          result
        )
      ) {
        return this.appendStageIssue({
          summary,

          stageName,

          code:
            "invalid_stage_result",

          message:
            `The ${stageName} stage returned an invalid result.`,

          source:
            "invalid-result",

          fatal
        });
      }

      return {
        ...summary,
        ...result,

        activePipelineLayer:
          "delivery",

        deliveryPipelineSource:
          this.source,

        deliveryPipelineVersion:
          this.version
      };
    } catch (error) {
      console.error(
        `Ari delivery stage error: ${stageName}`,
        error
      );

      return this.appendStageIssue({
        summary,

        stageName,

        code:
          error?.message ||
          String(
            error
          ),

        message:
          error?.message ||
          String(
            error
          ),

        source:
          "stage-error",

        fatal,

        error
      });
    }
  },

  appendStageIssue({
    summary = {},
    stageName = "unknown",
    code = "stage_error",
    message = "Stage error.",
    source = "stage-error",
    fatal = false,
    error = null
  } = {}) {
    const issue = {
      stage:
        stageName,

      error:
        code,

      code,

      message,

      source,

      fatal:
        fatal ===
        true,

      errorMessage:
        error?.message ||
        null
    };

    const output = {
      ...summary,

      [`${stageName}StageRan`]:
        false,

      [`${stageName}StageReady`]:
        false,

      [`${stageName}StageSource`]:
        source,

      [`${stageName}StageError`]:
        message,

      activePipelineLayer:
        "delivery",

      deliveryPipelineSource:
        this.source,

      deliveryPipelineVersion:
        this.version
    };

    if (fatal) {
      output.deliveryStageErrors = [
        ...this.toArray(
          summary.deliveryStageErrors
        ),

        issue
      ];
    } else {
      output.deliveryStageWarnings = [
        ...this.toArray(
          summary.deliveryStageWarnings
        ),

        issue
      ];
    }

    return output;
  },

  /* =====================================================
     DELIVERY INPUT GOVERNANCE
  ===================================================== */

  validateDeliveryInputs(
    summary = {}
  ) {
    const fatalErrors = [];
    const warnings = [];

    const finalResponse =
      this.extractFinalResponse(
        summary
      );

    const expressionPacket =
      this.readExpressionPacket(
        summary
      );

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      summary.deliberationPacket
        ?.reasoning
        ?.result ||
      null;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const semanticValidationAccepted =
      summary.semanticValidationAccepted ===
        true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted ===
        true;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      summary.deliberationPacket
        ?.responsePlanning
        ?.plan ||
      null;

    if (!finalResponse) {
      fatalErrors.push(
        "final_response_missing"
      );
    }

    if (!expressionPacket) {
      warnings.push(
        "expression_packet_missing_or_fallback_used"
      );
    }

    if (!evidencePacket) {
      warnings.push(
        "evidence_packet_missing"
      );
    }

    if (!reasoningResult) {
      warnings.push(
        "cognitive_reasoning_result_missing"
      );
    }

    if (
      responsePlan &&
      (
        !semanticValidationAccepted ||
        !validatedSemanticFrame
      )
    ) {
      warnings.push(
        "response_plan_without_validated_semantic_frame"
      );
    }

    if (
      this.toArray(
        summary.memoryCandidates
      ).length >
        0 &&
      !semanticValidationAccepted
    ) {
      warnings.push(
        "memory_candidates_suppressed_from_unvalidated_semantics"
      );
    }

    return {
      valid:
        fatalErrors.length ===
        0,

      ready:
        fatalErrors.length ===
          0 &&
        Boolean(
          finalResponse
        ),

      deliverable:
        Boolean(
          finalResponse
        ),

      source:
        "ari-delivery-input-governance",

      version:
        this.version,

      fatalErrors,

      errors:
        fatalErrors,

      warnings,

      contracts: {
        finalResponseAvailable:
          Boolean(
            finalResponse
          ),

        expressionPacketAvailable:
          Boolean(
            expressionPacket
          ),

        evidencePacketAvailable:
          Boolean(
            evidencePacket
          ),

        cognitiveReasoningResultAvailable:
          Boolean(
            reasoningResult
          ),

        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        responsePlanAvailable:
          Boolean(
            responsePlan
          )
      },

      authority: {
        canValidateDeliveryContracts:
          true,

        canInterpretMeaning:
          false,

        canRepairSemantics:
          false,

        canChangeFinalResponse:
          false
      }
    };
  },

  /* =====================================================
     DELIVERY DIAGNOSTICS
  ===================================================== */

  buildDeliveryDiagnostics(
    summary = {}
  ) {
    const governance =
      summary.deliveryInputGovernance ||
      {};

    const finalResponse =
      this.extractFinalResponse(
        summary
      );

    const governanceFatalErrors =
      this.toArray(
        governance.fatalErrors ||
        governance.errors
      ).map(
        error => ({
          stage:
            "delivery_input_governance",

          error,

          code:
            typeof error ===
              "string"
              ? error
              : error?.code ||
                "delivery_input_governance_error",

          fatal:
            true
        })
      );

    const stageFatalErrors =
      this.toArray(
        summary.deliveryStageErrors
      );

    const nonFatalStageIssues =
      this.toArray(
        summary.deliveryStageWarnings
      );

    const fatalErrors = [
      ...stageFatalErrors,
      ...governanceFatalErrors
    ];

    const warnings = [
      ...this.toArray(
        governance.warnings
      ),

      ...nonFatalStageIssues
    ];

    const responseDeliverable =
      Boolean(
        finalResponse
      ) &&
      fatalErrors.length ===
        0;

    const actionStageComplete =
      summary.actionDeliveryStageRan ===
      true;

    const persistenceStageComplete =
      summary.learningPersistenceStageRan ===
      true;

    const diagnosticsStageComplete =
      summary.deliveryDiagnosticsStageRan ===
      true;

    const persistenceComplete =
      persistenceStageComplete;

    const optionalStagesComplete =
      actionStageComplete &&
      persistenceStageComplete &&
      diagnosticsStageComplete;

    return {
      deliveryPipelineDiagnosticsRan:
        true,

      deliveryPipelineDiagnosticsVersion:
        this.version,

      responseDeliverable,

      healthy:
        fatalErrors.length ===
        0,

      degraded:
        warnings.length >
        0,

      complete:
        responseDeliverable,

      optionalStagesComplete,

      persistenceComplete,

      fatalErrors,

      errors:
        fatalErrors,

      warnings,

      stages: {
        inputGovernance:
          governance.valid ===
          true,

        actionDelivery:
          actionStageComplete,

        learningPersistence:
          persistenceStageComplete,

        deliveryDiagnostics:
          diagnosticsStageComplete
      },

      invariants: {
        finalResponseImmutable:
          true,

        responseDeliveryIndependentFromPersistence:
          true,

        validatedSemanticsRequiredForPersistence:
          true,

        approvedMemoryOnly:
          true,

        deliveryCannotInterpretMeaning:
          true
      }
    };
  },

  /* =====================================================
     DELIVERY PACKET
  ===================================================== */

  buildDeliveryPacket(
    summary = {}
  ) {
    const finalResponse =
      this.extractFinalResponse(
        summary
      );

    const delivered =
      Boolean(
        finalResponse
      );

    const diagnostics =
      summary.deliveryPipelineDiagnostics ||
      {};

    const fatalErrors =
      this.toArray(
        diagnostics.fatalErrors ||
        diagnostics.errors
      );

    const warnings =
      this.uniqueValues([
        ...this.toArray(
          diagnostics.warnings
        ),

        ...this.toArray(
          summary.deliveryWarnings
        )
      ]);

    const responseReady =
      delivered &&
      fatalErrors.length ===
        0;

    const diagnosticsHealthy =
      diagnostics.healthy !==
      false;

    const degraded =
      responseReady &&
      (
        diagnostics.degraded ===
          true ||
        warnings.length >
          0 ||
        diagnosticsHealthy ===
          false
      );

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      summary.deliberationPacket
        ?.reasoning
        ?.result ||
      null;

    const semanticValidation =
      summary.semanticFrameValidatorResult ||
      summary.semanticFrameValidation ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.result ||
      null;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const semanticValidationAccepted =
      summary.semanticValidationAccepted ===
        true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted ===
        true;

    const validatedSemanticRecord =
      semanticValidationAccepted &&
      validatedSemanticFrame
        ? {
            schema:
              "ari_validated_semantic_record",

            schemaVersion:
              this.schemaVersion,

            semanticFrame:
              validatedSemanticFrame,

            canonicalMeaning:
              summary.canonicalMeaning ||
              summary.deliberationPacket
                ?.semanticValidation
                ?.canonicalMeaning ||
              null,

            semanticSummary:
              summary.semanticSummary ||
              summary.deliberationPacket
                ?.semanticValidation
                ?.semanticSummary ||
              null,

            semanticSlots:
              summary.semanticSlots ||
              summary.deliberationPacket
                ?.semanticValidation
                ?.semanticSlots ||
              null,

            responseRequirements:
              summary
                .validatedResponseRequirements ||
              summary.deliberationPacket
                ?.semanticValidation
                ?.responseRequirements ||
              null,

            evidenceReferences:
              summary.evidenceReferences ||
              reasoningResult
                ?.evidenceReferences ||
              [],

            validation:
              semanticValidation,

            source:
              "validated_openai_semantic_output"
          }
        : null;

    const deliveryStatus =
      responseReady
        ? "delivered"
        : "failed";

    const deliveryResult = {
      schema:
        "ari_delivery_result",

      schemaVersion:
        this.schemaVersion,

      ready:
        responseReady,

      usable:
        responseReady,

      available:
        delivered,

      complete:
        responseReady,

      success:
        responseReady,

      ok:
        responseReady,

      authoritative:
        responseReady,

      degraded,

      status:
        deliveryStatus,

      deliveryStatus,

      replyAvailable:
        delivered,

      reply:
        finalResponse,

      text:
        finalResponse,

      responseText:
        finalResponse,

      finalResponse,

      emotion:
        summary.emotion ||
        summary.expressionPacket
          ?.result
          ?.emotion ||
        "idle",

      actions:
        summary.actionHandoff
          ?.executableActions ||
        [],

      developerIntent:
        summary.developerIntent ||
        null,

      warnings,

      errors:
        fatalErrors,

      source:
        this.source,

      version:
        this.version
    };

    return {
      schema:
        "ari_delivery_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        responseReady,

      usable:
        responseReady,

      complete:
        responseReady,

      success:
        responseReady,

      ok:
        responseReady,

      available:
        delivered,

      authoritative:
        responseReady,

      degraded,

      healthy:
        diagnosticsHealthy,

      persistenceComplete:
        diagnostics
          .persistenceComplete ===
        true,

      optionalStagesComplete:
        diagnostics
          .optionalStagesComplete ===
        true,

      status:
        deliveryStatus,

      deliveryStatus,

      replyAvailable:
        delivered,

      source:
        this.source,

      version:
        this.version,

      architecture:
        this.architecture,

      deliveryResult,

      contracts: {
        perceptionPacket:
          summary.perceptionPacket ||
          null,

        evidencePacket,

        executivePacket:
          summary.executivePacket ||
          null,

        deliberationPacket:
          summary.deliberationPacket ||
          null,

        cognitiveReasoningResult:
          reasoningResult,

        semanticValidation,

        validatedSemanticFrame,

        responsePlan:
          summary.responsePlan ||
          summary.responseStrategy ||
          summary.deliberationPacket
            ?.responsePlanning
            ?.plan ||
          null,

        expressionPacket:
          this.readExpressionPacket(
            summary
          )
      },

      stages: {
        inputGovernance:
          summary.deliveryInputGovernance ||
          null,

        actionDelivery:
          summary.actionDeliveryStagePacket ||
          null,

        learningPersistence:
          summary.learningPersistenceStagePacket ||
          null,

        diagnostics:
          summary.deliveryDiagnosticsStagePacket ||
          null
      },

      response: {
        text:
          finalResponse ||
          null,

        available:
          delivered,

        usable:
          responseReady,

        authorized:
          responseReady,

        source:
          summary.finalResponseSource ||
          summary.expressionPacket
            ?.result
            ?.source ||
          summary.finalCompositionHandoff
            ?.responseSource ||
          null,

        length:
          finalResponse.length,

        warnings:

          this.toArray(
            summary.finalResponseWarnings
          ),

        emotion:
          summary.emotion ||
          summary.expressionPacket
            ?.result
            ?.emotion ||
          null,

        immutable:
          true
      },

      actions: {
        plannerRan:
          summary.actionPlannerRan ===
          true,

        plan:
          summary.rebirthActionPlan ||
          null,

        actions:
          summary.plannedActions ||
          [],

        actionCount:
          this.toArray(
            summary.plannedActions
          ).length,

        requiresApproval:
          summary.actionHandoff
            ?.requiresApproval ===
          true,

        executable:
          summary.actionHandoff
            ?.executableActions ||
          [],

        blocked:
          summary.actionHandoff
            ?.blockedActions ||
          [],

        handoff:
          summary.actionHandoff ||
          null
      },

      learning: {
        validatedSemanticRecordAvailable:
          Boolean(
            validatedSemanticRecord
          ),

        validatedSemanticRecord,

        semanticValidationAccepted,

        semanticHistoryRan:
          summary
            .validatedSemanticHistoryRan ===
            true ||
          summary
            .conversationMeaningHistoryRan ===
            true,

        semanticHistory:
          summary.validatedSemanticHistory ||
          summary.conversationMeaningHistory ||
          [],

        meaningHistoryRan:
          summary
            .conversationMeaningHistoryRan ===
          true,

        latestMeaning:
          validatedSemanticRecord ||
          summary.latestConversationMeaning ||
          null,

        meaningHistory:
          summary.validatedSemanticHistory ||
          summary.conversationMeaningHistory ||
          [],

        memoryCandidateDetectionRan:
          summary.memoryCandidateRan ===
          true,

        memoryCandidates:
          semanticValidationAccepted
            ? summary.memoryCandidates ||
              []
            : [],

        memoryCandidatesSuppressed:
          !semanticValidationAccepted &&
          this.toArray(
            summary.memoryCandidates
          ).length >
            0,

        memorySaveRan:
          summary.memorySaveRan ===
          true,

        memorySaveApproved:
          summary.memorySaveApproved ===
            true ||
          summary.memorySaveResult
            ?.approved ===
            true,

        memorySaveResult:
          summary.memorySaveResult ||
          null
      },

      persistence: {
        complete:
          diagnostics
            .persistenceComplete ===
          true,

        degraded:
          diagnostics
            .persistenceComplete !==
          true,

        threadSaved:
          summary.threadSaveRan ===
          true,

        threadSaveSource:
          summary.threadSaveSource ||
          null,

        threadSaveError:
          summary.threadSaveError ||
          null,

        conversationHistorySaved:
          summary
            .conversationHistorySaveRan ===
          true,

        conversationHistorySource:
          summary
            .conversationHistorySaveSource ||
          null,

        conversationHistoryError:
          summary
            .conversationHistorySaveError ||
          null,

        validatedSemanticRecordSaved:
          summary
            .validatedSemanticRecordSaveRan ===
            true ||
          summary
            .conversationMeaningHistoryRan ===
            true,

        unvalidatedSemanticPersistenceAllowed:
          false,

        handoff:
          summary.learningPersistenceHandoff ||
          null
      },

      diagnostics: {
        pipeline:
          diagnostics,

        stage:
          summary.deliveryDiagnostics ||
          null,

        healthy:
          diagnosticsHealthy,

        degraded,

        fatalErrors,

        warnings,

        layerStatus:
          summary.deliveryDiagnostics
            ?.layerStatus ||
          {},

        review:
          summary.situationReview ||
          null,

        eventEmitted:
          summary.deliveryEventEmitted ===
          true,

        eventSource:
          summary.deliveryEventSource ||
          null,

        handoff:
          summary.deliveryDiagnosticsHandoff ||
          null
      },

      lifecycle: {
        perception:
          summary.perceptionPipelineRan ===
          true,

        evidence:
          Boolean(
            evidencePacket
          ),

        executiveRouting:
          summary
            .executiveRoutingPipelineRan ===
          true,

        deliberation:
          summary.deliberationPipelineRan ===
          true,

        semanticValidation:
          semanticValidationAccepted,

        expression:
          summary.expressionPipelineRan ===
          true,

        delivery:
          responseReady,

        complete:
          responseReady
      },

      quality: {
        inputGovernanceValid:
          summary.deliveryInputGovernance
            ?.valid ===
          true,

        responseReady,

        deliveryHealthy:
          diagnosticsHealthy,

        deliveryDegraded:
          degraded,

        optionalStagesComplete:
          diagnostics
            .optionalStagesComplete ===
          true,

        persistenceComplete:
          diagnostics
            .persistenceComplete ===
          true,

        fatalErrors,

        warnings,

        finalResponseAvailable:
          delivered,

        finalResponseUsable:
          responseReady,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        semanticValidationAccepted,

        unvalidatedSemanticsPersisted:
          false,

        actionsReviewed:
          summary.actionDeliveryStageRan ===
          true,

        persistenceReviewed:
          summary
            .learningPersistenceStageRan ===
          true,

        diagnosticsCompleted:
          summary
            .deliveryDiagnosticsStageRan ===
          true
      },

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     EXPRESSION PACKET
  ===================================================== */

  readExpressionPacket(
    summary = {}
  ) {
    const packet =
      summary.expressionPacket &&
      typeof summary.expressionPacket ===
        "object" &&
      !Array.isArray(
        summary.expressionPacket
      )
        ? summary.expressionPacket
        : summary.responseResult &&
          typeof summary.responseResult ===
            "object" &&
          !Array.isArray(
            summary.responseResult
          )
          ? summary.responseResult
          : null;

    return packet;
  },

  buildFallbackExpressionPacket(
    summary = {}
  ) {
    const finalResponse =
      this.extractFinalResponse(
        summary
      );

    return {
      schema:
        "ari_expression_packet_fallback",

      schemaVersion:
        this.schemaVersion,

      ready:
        Boolean(
          finalResponse
        ),

      usable:
        Boolean(
          finalResponse
        ),

      complete:
        Boolean(
          finalResponse
        ),

      source:
        "ari-delivery-pipeline-fallback",

      version:
        this.version,

      architecture:
        "authoritative-response-expression-fallback",

      result: {
        finalResponse:
          finalResponse ||
          null,

        responseText:
          finalResponse ||
          null,

        reply:
          finalResponse ||
          null,

        usable:
          Boolean(
            finalResponse
          ),

        authorized:
          Boolean(
            finalResponse
          ),

        source:
          summary.finalResponseSource ||
          summary
            .authoritativeDraftSource ||
          null,

        length:
          finalResponse.length,

        warnings:
          summary.finalResponseWarnings ||
          [],

        emotion:
          summary.emotion ||
          null
      },

      responseControl: {
        responsePlan:
          summary.responsePlan ||
          summary.responseStrategy ||
          null,

        validatedSemanticFrame:
          summary.validatedSemanticFrame ||
          null,

        semanticValidationAccepted:
          summary.semanticValidationAccepted ===
          true
      },

      authority: {
        canExecuteActions:
          false,

        canPersistState:
          false,

        canInterpretMeaning:
          false,

        canChangeFinalResponse:
          false,

        role:
          "authoritative_response_expression_fallback"
      }
    };
  },

  /* =====================================================
     FINAL RESPONSE
  ===================================================== */

  extractFinalResponse(
    summary = {}
  ) {
    return this.firstText(
      summary.finalResponse,

      summary.responseText,

      summary.reply,

      summary.finalCompositionHandoff
        ?.finalResponse,

      summary.finalCompositionHandoff
        ?.responseText,

      summary.finalCompositionHandoff
        ?.reply,

      summary.finalCompositionStagePacket
        ?.result
        ?.finalResponse,

      summary.expressionPacket
        ?.result
        ?.finalResponse,

      summary.expressionPacket
        ?.result
        ?.responseText,

      summary.expressionPacket
        ?.result
        ?.reply,

      summary.responseResult
        ?.result
        ?.finalResponse,

      summary.authoritativeDraft,

      summary.compositionInputText,

      summary.draftResponse
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canReadFinalResponse:
        true,

      canDeliverAuthoritativeResponse:
        true,

      canPlanPostResponseActions:
        true,

      canExecuteApprovedActions:
        true,

      canPersistConversationState:
        true,

      canPersistValidatedSemanticRecord:
        true,

      canPersistApprovedMemory:
        true,

      canReviewDeliveryHealth:
        true,

      canEmitDeliveryEvents:
        true,

      canSeparateDeliveryReadinessFromPersistenceHealth:
        true,

      canInterpretEvidence:
        false,

      canInterpretMeaning:
        false,

      canRepairSemanticFrame:
        false,

      canPersistUnvalidatedSemantics:
        false,

      canCreateMemoryFromUnvalidatedSemantics:
        false,

      canChangeFinalResponse:
        false,

      canCreateFailureResponse:
        false,

      canRunResponseRealization:
        false,

      canUseCandidateArbitration:
        false,

      canChangeOfficialRoute:
        false,

      canChangeSafetyDisposition:
        false,

      canBlockResponseForOptionalPersistenceFailure:
        false,

      role:
        "response_first_delivery_action_validated_persistence_and_diagnostics_handoff"
    };
  },

  validate() {
    const errors = [];
    const warnings = [];

    const required = {
      actionDeliveryStage:
        Boolean(
          window.AriActionDeliveryStage ||
          window.Ari
            ?.actionDeliveryStage
        ),

      learningPersistenceStage:
        Boolean(
          window
            .AriLearningPersistenceStage ||
          window.Ari
            ?.learningPersistenceStage
        ),

      deliveryDiagnosticsStage:
        Boolean(
          window
            .AriDeliveryDiagnosticsStage ||
          window.Ari
            ?.deliveryDiagnosticsStage
        )
    };

    Object.entries(
      required
    ).forEach(
      ([
        name,
        loaded
      ]) => {
        if (!loaded) {
          warnings.push(
            `${name}_not_loaded`
          );
        }
      }
    );

    const validationPacket =
      this.buildDeliveryPacket({
        finalResponse:
          "validation",

        expressionPacket: {
          result: {
            finalResponse:
              "validation"
          }
        },

        semanticValidationAccepted:
          true,

        validatedSemanticFrame: {
          frameId:
            "validation"
        },

        deliveryInputGovernance: {
          valid:
            true,

          fatalErrors:
            [],

          warnings:
            []
        },

        deliveryPipelineDiagnostics: {
          healthy:
            true,

          degraded:
            false,

          persistenceComplete:
            true,

          optionalStagesComplete:
            true,

          fatalErrors:
            [],

          warnings:
            []
        }
      });

    if (
      validationPacket.ready !==
        true ||
      validationPacket.deliveryResult
        ?.ready !==
        true ||
      validationPacket.deliveryResult
        ?.success !==
        true ||
      validationPacket.deliveryResult
        ?.ok !==
        true ||
      validationPacket.deliveryStatus !==
        "delivered"
    ) {
      errors.push(
        "canonical_delivery_contract_invalid"
      );
    }

    const authority =
      validationPacket.authority;

    [
      "canInterpretEvidence",
      "canInterpretMeaning",
      "canRepairSemanticFrame",
      "canPersistUnvalidatedSemantics",
      "canCreateMemoryFromUnvalidatedSemantics",
      "canChangeFinalResponse",
      "canCreateFailureResponse",
      "canRunResponseRealization",
      "canUseCandidateArbitration",
      "canChangeOfficialRoute",
      "canChangeSafetyDisposition",
      "canBlockResponseForOptionalPersistenceFailure"
    ].forEach(
      key => {
        if (
          authority[key] ===
          true
        ) {
          errors.push(
            `${key}_must_be_false`
          );
        }
      }
    );

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
        0,

      source:
        "ari-delivery-pipeline-validation",

      version:
        this.version,

      errors,

      warnings,

      required,

      checks: {
        responseFirstDelivery:
          true,

        optionalPersistenceNonBlocking:
          true,

        canonicalDeliveryContract:
          true,

        validatedSemanticPersistenceOnly:
          true,

        approvedMemoryOnly:
          true,

        finalResponseImmutable:
          true,

        noLocalSemanticAuthority:
          true,

        responseRealizationDetached:
          true,

        candidatePipelineDetached:
          true
      },

      authority
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  firstText(
    ...values
  ) {
    for (
      const value
      of values
    ) {
      const text =
        this.extractText(
          value
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  extractText(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined
    ) {
      return "";
    }

    if (
      typeof value ===
        "string"
    ) {
      return value.trim();
    }

    if (
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return String(
        value
      ).trim();
    }

    if (
      typeof value ===
        "object"
    ) {
      return this.extractText(
        value.text ||
        value.responseText ||
        value.finalResponse ||
        value.reply ||
        value.languageBody ||
        value.response ||
        value.content ||
        value.authoritativeDraft ||
        value.draftResponse ||
        ""
      );
    }

    return "";
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
            null
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return [];
    }

    return [
      value
    ];
  },

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen =
      new Set();

    this.toArray(
      values
    ).forEach(
      value => {
        const key =
          typeof value ===
            "string"
            ? value
            : JSON.stringify(
                value
              );

        if (
          !key ||
          seen.has(
            key
          )
        ) {
          return;
        }

        seen.add(
          key
        );

        output.push(
          value
        );
      }
    );

    return output;
  }
};

window.Ari.deliveryPipeline =
  window.AriDeliveryPipeline;

const ariDeliveryPipelineValidation =
  window.AriDeliveryPipeline
    ?.validate?.();

console.log(
  "ARI DELIVERY PIPELINE LOADED:",
  window.AriDeliveryPipeline
    ?.version,

  ariDeliveryPipelineValidation
    ?.ready ===
    true
    ? "READY"
    : "INVALID",

  ariDeliveryPipelineValidation
);
