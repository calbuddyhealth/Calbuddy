// ari/pipelines/ari-delivery-pipeline.js
// Ari Delivery Pipeline
// Purpose: Coordinate post-response action planning, learning,
// persistence, diagnostics, and final delivery handoff.
// V1.0.0 — Three-Stage Delivery Orchestrator

window.Ari = window.Ari || {};

window.AriDeliveryPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "delivery"
    };

    const expressionPacket =
      state.expressionPacket ||
      state.responseResult ||
      this.buildFallbackExpressionPacket(state);

    state = {
      ...state,
      expressionPacket
    };

    // =================================================
    // 1. Action Delivery Stage
    // =================================================

    mark("before actionDeliveryStage");

    state =
      await this.runStage(
        window.AriActionDeliveryStage,
        state,
        runtime,
        "actionDelivery"
      );

    mark("after actionDeliveryStage");

    // =================================================
    // 2. Learning and Persistence Stage
    // =================================================

    mark("before learningPersistenceStage");

    state =
      await this.runStage(
        window.AriLearningPersistenceStage,
        state,
        runtime,
        "learningPersistence"
      );

    mark("after learningPersistenceStage");

    // =================================================
    // Mark Delivery Pipeline before diagnostics
    // =================================================
    //
    // The Diagnostics Stage checks whether the Delivery
    // layer ran. This preliminary status prevents it from
    // incorrectly reporting the active layer as missing.
    //
    // The final status is written again after diagnostics.

    state = {
      ...state,

      deliveryPipelineRan:
        true,

      deliveryPipelineSource:
        "ari-delivery-pipeline",

      deliveryPipelineVersion:
        this.version
    };

    // =================================================
    // 3. Delivery Diagnostics Stage
    // =================================================

    mark("before deliveryDiagnosticsStage");

    state =
      await this.runStage(
        window.AriDeliveryDiagnosticsStage,
        state,
        runtime,
        "deliveryDiagnostics"
      );

    mark("after deliveryDiagnosticsStage");

    // =================================================
    // Delivery Packet
    // =================================================

    state.deliveryPacket =
  this.buildDeliveryPacket(state);

state.deliveryResult =
  state.deliveryPacket.deliveryResult;

    state.deliveryPipelineRan =
      true;

    state.deliveryPipelineSource =
      "ari-delivery-pipeline";

    state.deliveryPipelineVersion =
      this.version;

    state.activePipelineLayer =
      "complete";

    return state;
  },

  // ===================================================
  // Stage runner
  // ===================================================

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (
      !stage ||
      typeof stage.run !== "function"
    ) {
      return {
        ...summary,

        [`${stageName}StageRan`]:
          false,

        [`${stageName}StageSource`]:
          "not-loaded",

        [`${stageName}StageError`]:
          `The ${stageName} stage was not loaded.`,

        deliveryStageErrors: [
          ...(
            Array.isArray(
              summary.deliveryStageErrors
            )
              ? summary.deliveryStageErrors
              : []
          ),

          {
            stage:
              stageName,

            error:
              "stage_not_loaded"
          }
        ]
      };
    }

    try {
      const result =
        await stage.run(
          summary,
          runtime
        );

      if (
  !result ||
  typeof result !== "object" ||
  Array.isArray(result)
) {
        return {
          ...summary,

          [`${stageName}StageRan`]:
            false,

          [`${stageName}StageSource`]:
            "invalid-result",

          [`${stageName}StageError`]:
            `The ${stageName} stage returned an invalid result.`,

          deliveryStageErrors: [
            ...(
              Array.isArray(
                summary.deliveryStageErrors
              )
                ? summary.deliveryStageErrors
                : []
            ),

            {
              stage:
                stageName,

              error:
                "invalid_stage_result"
            }
          ]
        };
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

      return {
        ...summary,

        [`${stageName}StageRan`]:
          false,

        [`${stageName}StageSource`]:
          "stage-error",

        [`${stageName}StageError`]:
          error?.message ||
          String(error),

        deliveryStageErrors: [
          ...(
            Array.isArray(
              summary.deliveryStageErrors
            )
              ? summary.deliveryStageErrors
              : []
          ),

          {
            stage:
              stageName,

            error:
              error?.message ||
              String(error)
          }
        ]
      };
    }
  },

  // ===================================================
  // Delivery Packet
  // ===================================================

  buildDeliveryPacket(summary = {}) {
    const finalResponse =
  String(
    summary.finalResponse ||
    summary.expressionPacket?.result?.finalResponse ||
    summary.expressionPacket?.result?.text ||
    summary.responseResult?.result?.finalResponse ||
    summary.realizationResponseText ||
    ""
  ).trim();

const deliveryResult = {
  schema: "ari_delivery_result",
  schemaVersion: this.version,

  ready: Boolean(finalResponse),
  available: Boolean(finalResponse),
  authoritative: true,

  reply: finalResponse,
  text: finalResponse,
  finalResponse: finalResponse,

  emotion:
    summary.emotion ||
    summary.expressionPacket?.result?.emotion ||
    "idle",

  actions:
    summary.actionHandoff?.executableActions ||
    [],

  developerIntent:
    summary.developerIntent ||
    null,

  source: "ari-delivery-pipeline",
  version: this.version
};

    const deliveryErrors =
  Array.isArray(summary.deliveryStageErrors)
    ? summary.deliveryStageErrors
    : [];

    return {
  ready:
    deliveryResult.ready,

  available:
    deliveryResult.available,

  authoritative:
    true,

  source:
    "ari-delivery-pipeline",

  version:
    this.version,

  deliveryResult,

  // -----------------------------------------------
  // Input contracts
  // -----------------------------------------------

  perceptionPacket:
    summary.perceptionPacket ||
    null,
      executivePacket:
        summary.executivePacket ||
        null,

      deliberationPacket:
        summary.deliberationPacket ||
        null,

      expressionPacket:
        summary.expressionPacket ||
        null,

      // -----------------------------------------------
      // Stage packets
      // -----------------------------------------------

      stages: {
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

      // -----------------------------------------------
      // Delivered response
      // -----------------------------------------------

      response: {
        text:
          finalResponse ||
          null,

        available:
          Boolean(finalResponse),

        usable:
          summary.finalResponseUsable !== false &&
          Boolean(finalResponse),

        source:
          summary.finalResponseSource ||
          null,

        length:
          finalResponse.length,

        warnings:
          summary.finalResponseWarnings ||
          [],

        emotion:
          summary.emotion ||
          summary.expressionPacket
            ?.result?.emotion ||
          null
      },

      // -----------------------------------------------
      // Actions
      // -----------------------------------------------

      actions: {
        plannerRan:
          summary.actionPlannerRan === true,

        plan:
          summary.rebirthActionPlan ||
          null,

        actions:
          summary.plannedActions ||
          [],

        actionCount:
          summary.plannedActions?.length ||
          0,

        requiresApproval:
          summary.actionHandoff
            ?.requiresApproval === true,

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

      // -----------------------------------------------
      // Learning
      // -----------------------------------------------

      learning: {
        meaningHistoryRan:
          summary
            .conversationMeaningHistoryRan === true,

        latestMeaning:
          summary.latestConversationMeaning ||
          null,

        meaningHistory:
          summary.conversationMeaningHistory ||
          [],

        memoryCandidateDetectionRan:
          summary.memoryCandidateRan === true,

        memoryCandidates:
          summary.memoryCandidates ||
          [],

        memorySaveRan:
          summary.memorySaveRan === true,

        memorySaveResult:
          summary.memorySaveResult ||
          null
      },

      // -----------------------------------------------
      // Persistence
      // -----------------------------------------------

      persistence: {
        threadSaved:
          summary.threadSaveRan === true,

        threadSaveSource:
          summary.threadSaveSource ||
          null,

        threadSaveError:
          summary.threadSaveError ||
          null,

        conversationHistorySaved:
          summary
            .conversationHistorySaveRan === true,

        conversationHistorySource:
          summary
            .conversationHistorySaveSource ||
          null,

        conversationHistoryError:
          summary
            .conversationHistorySaveError ||
          null,

        handoff:
          summary.learningPersistenceHandoff ||
          null
      },

      // -----------------------------------------------
      // Diagnostics
      // -----------------------------------------------

      diagnostics: {
        healthy:
          summary.deliveryDiagnostics
            ?.healthy === true,

        warnings:
          summary.deliveryDiagnostics
            ?.warnings ||
          [],

        layerStatus:
          summary.deliveryDiagnostics
            ?.layerStatus ||
          {},

        review:
          summary.situationReview ||
          null,

        eventEmitted:
          summary.deliveryEventEmitted === true,

        eventSource:
          summary.deliveryEventSource ||
          null,

        handoff:
          summary.deliveryDiagnosticsHandoff ||
          null
      },

      // -----------------------------------------------
      // Full lifecycle status
      // -----------------------------------------------

      lifecycle: {
        perception:
          summary.perceptionPipelineRan === true,

        executiveRouting:
          summary
            .executiveRoutingPipelineRan === true,

        deliberation:
          summary.deliberationPipelineRan === true,

        expression:
          summary.expressionPipelineRan === true,

        delivery:
          true,

        complete:
          summary.perceptionPipelineRan === true &&
          summary
            .executiveRoutingPipelineRan === true &&
          summary.deliberationPipelineRan === true &&
          summary.expressionPipelineRan === true &&
          Boolean(finalResponse)
      },

      // -----------------------------------------------
      // Quality
      // -----------------------------------------------

      quality: {
        allDeliveryStagesLoaded:
          deliveryErrors.length === 0,

        stageErrors:
          deliveryErrors,

        finalResponseAvailable:
          Boolean(finalResponse),

        finalResponseUsable:
          summary.finalResponseUsable !== false &&
          Boolean(finalResponse),

        actionsReviewed:
          summary.actionDeliveryStageRan === true,

        persistenceReviewed:
          summary
            .learningPersistenceStageRan === true,

        diagnosticsCompleted:
          summary
            .deliveryDiagnosticsStageRan === true
      },

      // -----------------------------------------------
      // Authority boundary
      // -----------------------------------------------

      authority: {
        canPlanPostResponseActions:
          true,

        canPersistConversationState:
          true,

        canPersistApprovedMemory:
          true,

        canReviewDeliveryHealth:
          true,

        canEmitDeliveryEvents:
          true,

        canChangeFinalResponse:
          false,

        canChangeOfficialRoute:
          false,

        canChangeSafetyDisposition:
          false,

        role:
          "delivery_action_learning_persistence_and_diagnostics_handoff"
      }
    };
  },

  // ===================================================
  // Expression fallback
  // ===================================================

  buildFallbackExpressionPacket(
    summary = {}
  ) {
    const finalResponse =
      String(
        summary.finalResponse ||
        summary.selectedDraft ||
        summary.aiWriterDraft ||
        summary.blueprintWriterDraft ||
        ""
      ).trim();

    return {
      ready:
        Boolean(finalResponse),

      source:
        "ari-delivery-pipeline-fallback",

      version:
        this.version,

      result: {
        finalResponse:
          finalResponse ||
          null,

        usable:
          Boolean(finalResponse),

        source:
          summary.finalResponseSource ||
          summary.selectedDraftSource ||
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

      arbitration: {
        selectedDraft:
          summary.selectedDraft ||
          null,

        selectedSource:
          summary.selectedDraftSource ||
          null
      },

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          summary.responseOrder ||
          [],

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          []
      },

      authority: {
        canExecuteActions:
          false,

        canPersistState:
          false,

        role:
          "compatibility_expression_fallback"
      }
    };
  }
};

console.log(
  "ARI DELIVERY PIPELINE LOADED:",
  window.AriDeliveryPipeline?.version
);