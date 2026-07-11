// ari/pipeline-stages/delivery/ari-delivery-diagnostics-stage.js
// Ari Delivery Diagnostics Stage
// Purpose: Review final delivery health, collect diagnostics,
// and emit the completed response event.
// V1.0.0 — Review Console / Delivery Status / UI Event Foundation

window.Ari = window.Ari || {};

window.AriDeliveryDiagnosticsStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback
    } = runtime;

    let state = {
      ...summary,
      activeDeliveryStage: "delivery_diagnostics"
    };

    const diagnosticsEligibility =
      this.resolveDiagnosticsEligibility(state);

    state = {
      ...state,

      diagnosticsEligibility,

      shouldRunSituationReview:
        diagnosticsEligibility.runSituationReview,

      shouldEmitDeliveryEvent:
        diagnosticsEligibility.emitDeliveryEvent
    };

    // =================================================
    // 1. Optional Situation Review Console
    // =================================================

    mark("before situationReviewConsole");

    const situationReview =
      diagnosticsEligibility.runSituationReview
        ? await runEngine(
            window.AriSituationReviewConsole,
            ["review"],

            {
              situationReviewConsoleRan:
                false,

              source:
                "not-loaded",

              warnings: [],

              issues: [],

              recommendations: [],

              reason:
                "situation_review_console_not_loaded"
            },

            {
              ...state,

              deliveryDiagnosticsInput:
                this.buildDeliveryDiagnosticsInput(
                  state
                )
            }
          )
        : {
            situationReviewConsoleRan:
              false,

            source:
              "skipped-by-diagnostics-eligibility",

            warnings: [],

            issues: [],

            recommendations: [],

            reason:
              "situation_review_not_required"
          };

    state = {
      ...state,

      situationReview,

      situationReviewConsoleRan:
        situationReview
          .situationReviewConsoleRan === true,

      situationReviewConsoleVersion:
        situationReview
          .situationReviewConsoleVersion ||
        null,

      situationReviewSource:
        situationReview.source ||
        "unknown"
    };

    mark("after situationReviewConsole");

    // =================================================
    // 2. Collect delivery diagnostics
    // =================================================

    const deliveryDiagnostics =
      this.buildDeliveryDiagnostics(state);

    state = {
      ...state,
      deliveryDiagnostics
    };

    // =================================================
    // 3. Emit final delivery event
    // =================================================

    mark("before deliveryEvent");

    const deliveryEventResult =
      diagnosticsEligibility.emitDeliveryEvent
        ? this.emitDeliveryEvent(state)
        : {
            emitted:
              false,

            source:
              "skipped-by-diagnostics-eligibility",

            reason:
              "delivery_event_not_required"
          };

    state = {
      ...state,

      deliveryEventResult,

      deliveryEventEmitted:
        deliveryEventResult.emitted === true,

      deliveryEventSource:
        deliveryEventResult.source ||
        "unknown"
    };

    mark("after deliveryEvent");

    // =================================================
    // 4. Delivery Diagnostics Handoff
    // =================================================

    state.deliveryDiagnosticsHandoff =
      this.buildDeliveryDiagnosticsHandoff(
        state
      );

    // =================================================
    // 5. Stage packet
    // =================================================

    state.deliveryDiagnosticsStagePacket =
      this.buildDeliveryDiagnosticsStagePacket(
        state
      );

    state.deliveryDiagnosticsStageRan =
      true;

    state.deliveryDiagnosticsStageSource =
      "ari-delivery-diagnostics-stage";

    state.deliveryDiagnosticsStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveDiagnosticsEligibility(
    summary = {}
  ) {
    const debugTiming =
      summary.debugTiming === true ||
      summary.appContext?.debugTiming === true;

    const hasFinalResponse =
      Boolean(
        String(
          summary.finalResponse ||
          ""
        ).trim()
      );

    return {
      runSituationReview:
        debugTiming &&
        Boolean(
          window.AriSituationReviewConsole
        ),

      emitDeliveryEvent:
        hasFinalResponse,

      debugTiming,
      hasFinalResponse,

      source:
        "ari-delivery-diagnostics-stage-eligibility",

      reason:
        !hasFinalResponse
          ? "final_response_missing"
          : debugTiming
            ? "debug_delivery_review_enabled"
            : "standard_delivery_diagnostics"
    };
  },

  // ===================================================
  // Diagnostics input
  // ===================================================

  buildDeliveryDiagnosticsInput(
    summary = {}
  ) {
    return {
      request: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          ""
      },

      routing:
        summary.routingContract ||
        null,

      deliberation:
        summary.deliberationPacket ||
        null,

      expression:
        summary.expressionPacket ||
        null,

      actions:
        summary.actionDeliveryStagePacket ||
        null,

      persistence:
        summary.learningPersistenceStagePacket ||
        null,

      finalResponse: {
        text:
          summary.finalResponse ||
          null,

        usable:
          summary.finalResponseUsable === true,

        source:
          summary.finalResponseSource ||
          null,

        warnings:
          summary.finalResponseWarnings ||
          []
      },

      timing:
        summary.pipelineTiming ||
        [],

      errors: {
        deliberation:
          summary.deliberationStageErrors ||
          [],

        expression:
          summary.expressionStageErrors ||
          [],

        delivery:
          summary.deliveryStageErrors ||
          []
      }
    };
  },

  // ===================================================
  // Delivery diagnostics
  // ===================================================

  buildDeliveryDiagnostics(
    summary = {}
  ) {
    const warnings = [];

    const finalResponse =
      String(
        summary.finalResponse ||
        ""
      ).trim();

    if (!finalResponse) {
      warnings.push(
        "final_response_missing"
      );
    }

    if (
      summary.finalResponseUsable === false
    ) {
      warnings.push(
        "final_response_marked_unusable"
      );
    }

    if (
      summary.deliberationStageErrors
        ?.length
    ) {
      warnings.push(
        "deliberation_stage_errors_present"
      );
    }

    if (
      summary.expressionStageErrors
        ?.length
    ) {
      warnings.push(
        "expression_stage_errors_present"
      );
    }

    if (
      summary.deliveryStageErrors
        ?.length
    ) {
      warnings.push(
        "delivery_stage_errors_present"
      );
    }

    if (
      summary.threadSaveRan !== true
    ) {
      warnings.push(
        "thread_state_not_saved"
      );
    }

    if (
      summary.conversationHistorySaveRan !== true
    ) {
      warnings.push(
        "conversation_history_not_saved"
      );
    }

    const layerStatus = {
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
        true
    };

    const allRequiredLayersRan =
      layerStatus.perception &&
      layerStatus.executiveRouting &&
      layerStatus.deliberation &&
      layerStatus.expression;

    if (!allRequiredLayersRan) {
      warnings.push(
        "one_or_more_pipeline_layers_did_not_run"
      );
    }

    return {
      ready:
        true,

      source:
        "ari-delivery-diagnostics-stage",

      finalResponse: {
        available:
          Boolean(finalResponse),

        usable:
          summary.finalResponseUsable === true,

        source:
          summary.finalResponseSource ||
          null,

        length:
          finalResponse.length,

        warnings:
          summary.finalResponseWarnings ||
          []
      },

      layerStatus,

      allRequiredLayersRan,

      persistence: {
        threadSaved:
          summary.threadSaveRan === true,

        conversationHistorySaved:
          summary
            .conversationHistorySaveRan === true,

        memorySaveRan:
          summary.memorySaveRan === true
      },

      actions: {
        plannerRan:
          summary.actionPlannerRan === true,

        actionCount:
          summary.plannedActions?.length ||
          0,

        requiresApproval:
          summary.actionHandoff
            ?.requiresApproval === true
      },

      review: {
        ran:
          summary
            .situationReviewConsoleRan === true,

        source:
          summary.situationReviewSource ||
          null,

        result:
          summary.situationReview ||
          null
      },

      stageErrors: {
        deliberation:
          summary.deliberationStageErrors ||
          [],

        expression:
          summary.expressionStageErrors ||
          [],

        delivery:
          summary.deliveryStageErrors ||
          []
      },

      warnings:
        [...new Set(warnings)],

      healthy:
        Boolean(finalResponse) &&
        warnings.every(
          warning =>
            ![
              "final_response_missing",
              "final_response_marked_unusable",
              "one_or_more_pipeline_layers_did_not_run"
            ].includes(warning)
        )
    };
  },

  // ===================================================
  // Delivery event
  // ===================================================

  emitDeliveryEvent(summary = {}) {
    if (
      typeof window.dispatchEvent !==
      "function"
    ) {
      return {
        emitted:
          false,

        source:
          "window-dispatch-unavailable",

        reason:
          "window_dispatch_event_not_available"
      };
    }

    try {
      window.dispatchEvent(
        new CustomEvent(
          "ari:response-delivered",
          {
            detail: {
              finalResponse:
                summary.finalResponse ||
                null,

              emotion:
                summary.emotion ||
                null,

              source:
                summary.finalResponseSource ||
                null,

              routing:
                summary.routingContract ||
                null,

              actions:
                summary.actionHandoff ||
                null,

              persistence:
                summary
                  .learningPersistenceHandoff ||
                null,

              diagnostics:
                summary.deliveryDiagnostics ||
                null,

              deliveredAt:
                new Date().toISOString()
            }
          }
        )
      );

      return {
        emitted:
          true,

        source:
          "window-custom-event",

        event:
          "ari:response-delivered"
      };
    } catch (error) {
      console.error(
        "Ari delivery event failed:",
        error
      );

      return {
        emitted:
          false,

        source:
          "stage-error",

        reason:
          error?.message ||
          String(error)
      };
    }
  },

  // ===================================================
  // Diagnostics handoff
  // ===================================================

  buildDeliveryDiagnosticsHandoff(
    summary = {}
  ) {
    return {
      ready:
        true,

      diagnostics:
        summary.deliveryDiagnostics ||
        null,

      review:
        summary.situationReview ||
        null,

      event: {
        emitted:
          summary.deliveryEventEmitted === true,

        source:
          summary.deliveryEventSource ||
          null,

        result:
          summary.deliveryEventResult ||
          null
      },

      authority: {
        canReviewDeliveryHealth:
          true,

        canEmitDeliveryEvent:
          true,

        canChangeFinalResponse:
          false,

        canChangeRouting:
          false,

        canPersistState:
          false,

        role:
          "delivery_review_diagnostics_and_ui_notification"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildDeliveryDiagnosticsStagePacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-delivery-diagnostics-stage",

      version:
        this.version,

      eligibility:
        summary.diagnosticsEligibility ||
        null,

      review: {
        ran:
          summary
            .situationReviewConsoleRan === true,

        source:
          summary.situationReviewSource ||
          null,

        value:
          summary.situationReview ||
          null
      },

      diagnostics:
        summary.deliveryDiagnostics ||
        null,

      event: {
        emitted:
          summary.deliveryEventEmitted === true,

        source:
          summary.deliveryEventSource ||
          null,

        result:
          summary.deliveryEventResult ||
          null
      },

      handoff:
        summary.deliveryDiagnosticsHandoff ||
        null,

      authority: {
        canReviewFinalDelivery:
          true,

        canEmitUIEvent:
          true,

        canChangeFinalResponse:
          false,

        canExecuteActions:
          false,

        canPersistState:
          false,

        role:
          "delivery_diagnostics_orchestration"
      }
    };
  }
};

console.log(
  "ARI DELIVERY DIAGNOSTICS STAGE LOADED:",
  window.AriDeliveryDiagnosticsStage?.version
);