// ari/pipelines/ari-delivery-pipeline.js
// Ari Delivery Pipeline
// Purpose: Coordinate approved actions, governed learning, persistence,
// diagnostics, and the final immutable delivery handoff.
// V2.0.0 — Validated Semantic Persistence + Contract Protection

window.Ari = window.Ari || {};

window.AriDeliveryPipeline = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-delivery-pipeline",
  architecture: "validated-semantic-delivery-and-persistence",

  async run(summary = {}, runtime = {}) {
    const { mark = () => {} } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "delivery",
      deliveryStageErrors: Array.isArray(summary.deliveryStageErrors)
        ? [...summary.deliveryStageErrors]
        : []
    };

    const expressionPacket =
      state.expressionPacket ||
      state.responseResult ||
      this.buildFallbackExpressionPacket(state);

    state = { ...state, expressionPacket };

    /* =====================================================
       1. DELIVERY INPUT GOVERNANCE
    ===================================================== */

    mark("before deliveryInputGovernance");

    state.deliveryInputGovernance =
      this.validateDeliveryInputs(state);

    state.deliveryInputGovernanceRan = true;
    state.deliveryInputGovernanceSource = this.source;
    state.deliveryInputGovernanceVersion = this.version;

    mark("after deliveryInputGovernance");

    /* =====================================================
       2. ACTION DELIVERY STAGE
    ===================================================== */

    mark("before actionDeliveryStage");

    state = await this.runStage(
      window.AriActionDeliveryStage ||
        window.Ari?.actionDeliveryStage,
      state,
      runtime,
      "actionDelivery"
    );

    mark("after actionDeliveryStage");

    /* =====================================================
       3. LEARNING AND PERSISTENCE STAGE
       Semantic learning is allowed only from validator-
       accepted OpenAI output. Unvalidated semantic output
       must not enter history or memory.
    ===================================================== */

    mark("before learningPersistenceStage");

    state = await this.runStage(
      window.AriLearningPersistenceStage ||
        window.Ari?.learningPersistenceStage,
      state,
      runtime,
      "learningPersistence"
    );

    mark("after learningPersistenceStage");

    state = {
      ...state,
      deliveryPipelineRan: true,
      deliveryPipelineSource: this.source,
      deliveryPipelineVersion: this.version
    };

    /* =====================================================
       4. DELIVERY DIAGNOSTICS STAGE
    ===================================================== */

    mark("before deliveryDiagnosticsStage");

    state = await this.runStage(
      window.AriDeliveryDiagnosticsStage ||
        window.Ari?.deliveryDiagnosticsStage,
      state,
      runtime,
      "deliveryDiagnostics"
    );

    mark("after deliveryDiagnosticsStage");

    state.deliveryPipelineDiagnostics =
      this.buildDeliveryDiagnostics(state);

    state.deliveryHealthy =
      state.deliveryPipelineDiagnostics.healthy;

    state.deliveryWarnings =
      state.deliveryPipelineDiagnostics.warnings;

    /* =====================================================
       5. FINAL DELIVERY PACKET
    ===================================================== */

    state.deliveryPacket =
      this.buildDeliveryPacket(state);

    state.deliveryResult =
      state.deliveryPacket.deliveryResult;

    state.deliveryPipelineRan = true;
    state.deliveryPipelineReady =
      state.deliveryPacket.ready === true;
    state.deliveryPipelineSource = this.source;
    state.deliveryPipelineVersion = this.version;
    state.activePipelineLayer = "complete";

    return state;
  },

  /* =====================================================
     STAGE RUNNER
  ===================================================== */

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (!stage || typeof stage.run !== "function") {
      return this.appendStageError(
        summary,
        stageName,
        "stage_not_loaded",
        `The ${stageName} stage was not loaded.`,
        "not-loaded"
      );
    }

    try {
      const result = await stage.run(summary, runtime);

      if (
        !result ||
        typeof result !== "object" ||
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

      return {
        ...summary,
        ...result
      };
    } catch (error) {
      console.error(
        `Ari delivery stage error: ${stageName}`,
        error
      );

      return this.appendStageError(
        summary,
        stageName,
        error?.message || String(error),
        error?.message || String(error),
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
      [`${stageName}StageRan`]: false,
      [`${stageName}StageSource`]: source,
      [`${stageName}StageError`]: message,
      deliveryStageErrors: [
        ...this.toArray(summary.deliveryStageErrors),
        { stage: stageName, error: code, message }
      ]
    };
  },

  /* =====================================================
     DELIVERY INPUT GOVERNANCE
  ===================================================== */

  validateDeliveryInputs(summary = {}) {
    const errors = [];
    const warnings = [];

    const finalResponse =
      this.extractFinalResponse(summary);

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      summary.deliberationPacket?.reasoning?.result ||
      null;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const semanticValidationAccepted =
      summary.semanticValidationAccepted === true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted === true;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      summary.deliberationPacket
        ?.responsePlanning
        ?.plan ||
      null;

    if (!finalResponse) {
      errors.push("final_response_missing");
    }

    if (!summary.expressionPacket) {
      warnings.push(
        "expression_packet_missing_or_fallback_used"
      );
    }

    if (!evidencePacket) {
      warnings.push("evidence_packet_missing");
    }

    if (!reasoningResult) {
      warnings.push("cognitive_reasoning_result_missing");
    }

    if (
      responsePlan &&
      (!semanticValidationAccepted ||
        !validatedSemanticFrame)
    ) {
      errors.push(
        "response_plan_without_validated_semantic_frame"
      );
    }

    if (
      this.toArray(summary.memoryCandidates).length > 0 &&
      !semanticValidationAccepted
    ) {
      errors.push(
        "memory_candidates_from_unvalidated_semantics"
      );
    }

    return {
      valid: errors.length === 0,
      ready:
        errors.length === 0 &&
        Boolean(finalResponse),
      source: "ari-delivery-input-governance",
      version: this.version,
      errors,
      warnings,
      contracts: {
        finalResponseAvailable: Boolean(finalResponse),
        evidencePacketAvailable: Boolean(evidencePacket),
        cognitiveReasoningResultAvailable:
          Boolean(reasoningResult),
        semanticValidationAccepted,
        validatedSemanticFrameAvailable:
          Boolean(validatedSemanticFrame),
        responsePlanAvailable: Boolean(responsePlan),
        expressionPacketAvailable:
          Boolean(summary.expressionPacket)
      },
      authority: {
        canValidateDeliveryContracts: true,
        canInterpretMeaning: false,
        canRepairSemantics: false,
        canChangeFinalResponse: false
      }
    };
  },

  /* =====================================================
     DELIVERY DIAGNOSTICS
  ===================================================== */

  buildDeliveryDiagnostics(summary = {}) {
    const governance =
      summary.deliveryInputGovernance || {};

    const errors = [
      ...this.toArray(summary.deliveryStageErrors),
      ...this.toArray(governance.errors).map(error => ({
        stage: "delivery_input_governance",
        error
      }))
    ];

    const warnings = [
      ...this.toArray(governance.warnings)
    ];

    const finalResponse =
      this.extractFinalResponse(summary);

    return {
      deliveryPipelineDiagnosticsRan: true,
      deliveryPipelineDiagnosticsVersion:
        this.version,
      healthy: errors.length === 0,
      complete:
        errors.length === 0 &&
        Boolean(finalResponse) &&
        summary.learningPersistenceStageRan === true &&
        summary.deliveryDiagnosticsStageRan === true,
      errors,
      warnings,
      stages: {
        inputGovernance: governance.valid === true,
        actionDelivery:
          summary.actionDeliveryStageRan === true,
        learningPersistence:
          summary.learningPersistenceStageRan === true,
        deliveryDiagnostics:
          summary.deliveryDiagnosticsStageRan === true
      },
      invariants: {
        finalResponseImmutable: true,
        validatedSemanticsRequiredForPersistence: true,
        approvedMemoryOnly: true,
        deliveryCannotInterpretMeaning: true
      }
    };
  },

  /* =====================================================
     DELIVERY PACKET
  ===================================================== */

  buildDeliveryPacket(summary = {}) {
    const finalResponse =
      this.extractFinalResponse(summary);

    const deliveryErrors =
      this.toArray(summary.deliveryStageErrors);

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      summary.deliberationPacket?.reasoning?.result ||
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
      summary.semanticValidationAccepted === true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted === true;

    const validatedSemanticRecord =
      semanticValidationAccepted &&
      validatedSemanticFrame
        ? {
            schema: "ari_validated_semantic_record",
            schemaVersion: this.schemaVersion,
            semanticFrame: validatedSemanticFrame,
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
              summary.validatedResponseRequirements ||
              summary.deliberationPacket
                ?.semanticValidation
                ?.responseRequirements ||
              null,
            evidenceReferences:
              summary.evidenceReferences ||
              reasoningResult?.evidenceReferences ||
              [],
            validation: semanticValidation,
            source:
              "validated_openai_semantic_output"
          }
        : null;

    const deliveryResult = {
      schema: "ari_delivery_result",
      schemaVersion: this.schemaVersion,
      ready: Boolean(finalResponse),
      available: Boolean(finalResponse),
      authoritative: true,
      reply: finalResponse,
      text: finalResponse,
      finalResponse,
      emotion:
        summary.emotion ||
        summary.expressionPacket?.result?.emotion ||
        "idle",
      actions:
        summary.actionHandoff?.executableActions ||
        [],
      developerIntent:
        summary.developerIntent || null,
      source: this.source,
      version: this.version
    };

    return {
      schema: "ari_delivery_packet",
      schemaVersion: this.schemaVersion,
      ready:
        deliveryResult.ready &&
        summary.deliveryPipelineDiagnostics
          ?.healthy !== false,
      available: deliveryResult.available,
      authoritative: true,
      source: this.source,
      version: this.version,
      architecture: this.architecture,
      deliveryResult,

      contracts: {
        perceptionPacket:
          summary.perceptionPacket || null,
        evidencePacket,
        executivePacket:
          summary.executivePacket || null,
        deliberationPacket:
          summary.deliberationPacket || null,
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
          summary.expressionPacket || null
      },

      stages: {
        inputGovernance:
          summary.deliveryInputGovernance || null,
        actionDelivery:
          summary.actionDeliveryStagePacket || null,
        learningPersistence:
          summary.learningPersistenceStagePacket || null,
        diagnostics:
          summary.deliveryDiagnosticsStagePacket || null
      },

      response: {
        text: finalResponse || null,
        available: Boolean(finalResponse),
        usable:
          summary.finalResponseUsable !== false &&
          Boolean(finalResponse),
        source:
          summary.finalResponseSource ||
          summary.expressionPacket?.result?.source ||
          null,
        length: finalResponse.length,
        warnings:
          summary.finalResponseWarnings || [],
        emotion:
          summary.emotion ||
          summary.expressionPacket?.result?.emotion ||
          null,
        immutable: true
      },

      actions: {
        plannerRan:
          summary.actionPlannerRan === true,
        plan:
          summary.rebirthActionPlan || null,
        actions:
          summary.plannedActions || [],
        actionCount:
          this.toArray(summary.plannedActions).length,
        requiresApproval:
          summary.actionHandoff?.requiresApproval === true,
        executable:
          summary.actionHandoff?.executableActions || [],
        blocked:
          summary.actionHandoff?.blockedActions || [],
        handoff:
          summary.actionHandoff || null
      },

      learning: {
        validatedSemanticRecordAvailable:
          Boolean(validatedSemanticRecord),
        validatedSemanticRecord,
        semanticValidationAccepted,

        // Canonical V2 fields.
        semanticHistoryRan:
          summary.validatedSemanticHistoryRan === true ||
          summary.conversationMeaningHistoryRan === true,
        semanticHistory:
          summary.validatedSemanticHistory ||
          summary.conversationMeaningHistory ||
          [],

        // Read-only migration aliases for old persistence code.
        meaningHistoryRan:
          summary.conversationMeaningHistoryRan === true,
        latestMeaning:
          validatedSemanticRecord ||
          summary.latestConversationMeaning ||
          null,
        meaningHistory:
          summary.validatedSemanticHistory ||
          summary.conversationMeaningHistory ||
          [],

        memoryCandidateDetectionRan:
          summary.memoryCandidateRan === true,
        memoryCandidates:
          semanticValidationAccepted
            ? summary.memoryCandidates || []
            : [],
        memoryCandidatesSuppressed:
          !semanticValidationAccepted &&
          this.toArray(summary.memoryCandidates).length > 0,
        memorySaveRan:
          summary.memorySaveRan === true,
        memorySaveApproved:
          summary.memorySaveApproved === true ||
          summary.memorySaveResult?.approved === true,
        memorySaveResult:
          summary.memorySaveResult || null
      },

      persistence: {
        threadSaved:
          summary.threadSaveRan === true,
        threadSaveSource:
          summary.threadSaveSource || null,
        threadSaveError:
          summary.threadSaveError || null,
        conversationHistorySaved:
          summary.conversationHistorySaveRan === true,
        conversationHistorySource:
          summary.conversationHistorySaveSource || null,
        conversationHistoryError:
          summary.conversationHistorySaveError || null,
        validatedSemanticRecordSaved:
          summary.validatedSemanticRecordSaveRan === true ||
          summary.conversationMeaningHistoryRan === true,
        unvalidatedSemanticPersistenceAllowed: false,
        handoff:
          summary.learningPersistenceHandoff || null
      },

      diagnostics: {
        pipeline:
          summary.deliveryPipelineDiagnostics || null,
        stage:
          summary.deliveryDiagnostics || null,
        healthy:
          summary.deliveryPipelineDiagnostics
            ?.healthy === true,
        warnings: [
          ...this.toArray(
            summary.deliveryPipelineDiagnostics
              ?.warnings
          ),
          ...this.toArray(
            summary.deliveryDiagnostics?.warnings
          )
        ],
        layerStatus:
          summary.deliveryDiagnostics?.layerStatus || {},
        review:
          summary.situationReview || null,
        eventEmitted:
          summary.deliveryEventEmitted === true,
        eventSource:
          summary.deliveryEventSource || null,
        handoff:
          summary.deliveryDiagnosticsHandoff || null
      },

      lifecycle: {
        perception:
          summary.perceptionPipelineRan === true,
        evidence: Boolean(evidencePacket),
        executiveRouting:
          summary.executiveRoutingPipelineRan === true,
        deliberation:
          summary.deliberationPipelineRan === true,
        semanticValidation:
          semanticValidationAccepted,
        expression:
          summary.expressionPipelineRan === true,
        delivery: true,
        complete:
          summary.perceptionPipelineRan === true &&
          summary.executiveRoutingPipelineRan === true &&
          summary.deliberationPipelineRan === true &&
          semanticValidationAccepted &&
          summary.expressionPipelineRan === true &&
          Boolean(finalResponse)
      },

      quality: {
        inputGovernanceValid:
          summary.deliveryInputGovernance?.valid === true,
        allDeliveryStagesLoaded:
          deliveryErrors.length === 0,
        stageErrors: deliveryErrors,
        finalResponseAvailable:
          Boolean(finalResponse),
        finalResponseUsable:
          summary.finalResponseUsable !== false &&
          Boolean(finalResponse),
        validatedSemanticFrameAvailable:
          Boolean(validatedSemanticFrame),
        semanticValidationAccepted,
        unvalidatedSemanticsPersisted: false,
        actionsReviewed:
          summary.actionDeliveryStageRan === true,
        persistenceReviewed:
          summary.learningPersistenceStageRan === true,
        diagnosticsCompleted:
          summary.deliveryDiagnosticsStageRan === true
      },

      authority: {
        canPlanPostResponseActions: true,
        canExecuteApprovedActions: true,
        canPersistConversationState: true,
        canPersistValidatedSemanticRecord: true,
        canPersistApprovedMemory: true,
        canReviewDeliveryHealth: true,
        canEmitDeliveryEvents: true,
        canInterpretEvidence: false,
        canInterpretMeaning: false,
        canRepairSemanticFrame: false,
        canPersistUnvalidatedSemantics: false,
        canCreateMemoryFromUnvalidatedSemantics: false,
        canChangeFinalResponse: false,
        canChangeOfficialRoute: false,
        canChangeSafetyDisposition: false,
        role:
          "delivery_action_validated_learning_persistence_and_diagnostics_handoff"
      }
    };
  },

  /* =====================================================
     EXPRESSION FALLBACK
  ===================================================== */

  buildFallbackExpressionPacket(summary = {}) {
    const finalResponse =
      this.extractFinalResponse(summary);

    return {
      schema: "ari_expression_packet_fallback",
      schemaVersion: this.schemaVersion,
      ready: Boolean(finalResponse),
      source: "ari-delivery-pipeline-fallback",
      version: this.version,
      result: {
        finalResponse: finalResponse || null,
        usable: Boolean(finalResponse),
        source:
          summary.finalResponseSource ||
          summary.selectedDraftSource ||
          null,
        length: finalResponse.length,
        warnings:
          summary.finalResponseWarnings || [],
        emotion:
          summary.emotion || null
      },
      arbitration: {
        selectedDraft:
          summary.selectedDraft || null,
        selectedSource:
          summary.selectedDraftSource || null
      },
      responseControl: {
        responsePlan:
          summary.responsePlan ||
          summary.responseStrategy ||
          null,
        validatedSemanticFrame:
          summary.validatedSemanticFrame || null,
        semanticValidationAccepted:
          summary.semanticValidationAccepted === true
      },
      authority: {
        canExecuteActions: false,
        canPersistState: false,
        canInterpretMeaning: false,
        canChangeFinalResponse: false,
        role: "compatibility_expression_fallback"
      }
    };
  },

  extractFinalResponse(summary = {}) {
    return String(
      summary.finalResponse ||
      summary.expressionPacket?.result?.finalResponse ||
      summary.expressionPacket?.result?.text ||
      summary.responseResult?.result?.finalResponse ||
      summary.realizationResponseText ||
      summary.selectedDraft ||
      summary.aiWriterDraft ||
      summary.blueprintWriterDraft ||
      ""
    ).trim();
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item => item !== undefined && item !== null
      );
    }

    if (value === undefined || value === null) {
      return [];
    }

    return [value];
  },

  validate() {
    const errors = [];
    const warnings = [];

    const required = {
      actionDeliveryStage: Boolean(
        window.AriActionDeliveryStage ||
        window.Ari?.actionDeliveryStage
      ),
      learningPersistenceStage: Boolean(
        window.AriLearningPersistenceStage ||
        window.Ari?.learningPersistenceStage
      ),
      deliveryDiagnosticsStage: Boolean(
        window.AriDeliveryDiagnosticsStage ||
        window.Ari?.deliveryDiagnosticsStage
      )
    };

    Object.entries(required).forEach(
      ([name, loaded]) => {
        if (!loaded) {
          warnings.push(`${name}_not_loaded`);
        }
      }
    );

    const authority =
      this.buildDeliveryPacket({
        finalResponse: "validation",
        expressionPacket: {
          result: {
            finalResponse: "validation"
          }
        },
        semanticValidationAccepted: true,
        validatedSemanticFrame: {
          frameId: "validation"
        },
        deliveryInputGovernance: {
          valid: true
        },
        deliveryPipelineDiagnostics: {
          healthy: true
        }
      }).authority;

    [
      "canInterpretEvidence",
      "canInterpretMeaning",
      "canRepairSemanticFrame",
      "canPersistUnvalidatedSemantics",
      "canCreateMemoryFromUnvalidatedSemantics",
      "canChangeFinalResponse",
      "canChangeOfficialRoute",
      "canChangeSafetyDisposition"
    ].forEach(key => {
      if (authority[key] === true) {
        errors.push(`${key}_must_be_false`);
      }
    });

    return {
      valid: errors.length === 0,
      ready:
        errors.length === 0 &&
        warnings.length === 0,
      source: "ari-delivery-pipeline-validation",
      version: this.version,
      errors,
      warnings,
      required,
      checks: {
        validatedSemanticPersistenceOnly: true,
        approvedMemoryOnly: true,
        finalResponseImmutable: true,
        noLocalSemanticAuthority: true
      }
    };
  }
};

window.Ari.deliveryPipeline =
  window.AriDeliveryPipeline;

const ariDeliveryPipelineValidation =
  window.AriDeliveryPipeline?.validate?.();

console.log(
  "ARI DELIVERY PIPELINE LOADED:",
  window.AriDeliveryPipeline?.version,
  ariDeliveryPipelineValidation?.ready === true
    ? "READY"
    : ariDeliveryPipelineValidation?.valid === true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",
  ariDeliveryPipelineValidation
);
