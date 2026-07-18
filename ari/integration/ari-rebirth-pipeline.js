// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
//
// Purpose:
// Execute Ari's canonical five-layer runtime exactly once and produce one
// authoritative Delivery result for the application boundary.
//
// V7.3.0 — Evidence / Cognitive Validation Contract Migration
//
// Architectural flow:
//
// Canonical Runtime Request
//      ↓
// Current-Turn Output Reset
//      ↓
// Conversation Operating State — Begin Turn
//      ↓
// Layer 1 — Perception
//   Observer Network
//   Deterministic Evidence Builder
//      ↓
// Layer 2 — Executive Routing
//      ↓
// Layer 3 — Deliberation
//   OpenAI Cognitive Reasoning
//   Semantic Frame Validation
//   Response Planning
//      ↓
// Layer 4 — Expression
//      ↓
// Layer 5 — Delivery
//      ↓
// Authoritative Delivery Result
//      ↓
// Conversation Operating State — Complete Turn
//      ↓
// Ari Rebirth App Bridge
//
// Responsibilities:
// - Normalize and preserve one canonical current-turn envelope.
// - Remove generated output inherited from any prior turn.
// - Preserve valid conversation, memory, application, and external evidence.
// - Begin and complete the canonical turn through Conversation Operating State.
// - Execute each of the five runtime layers exactly once and in order.
// - Stop downstream processing when a required runtime boundary fails.
// - Preserve structured lifecycle diagnostics and timing.
// - Normalize authoritative Delivery output for the application boundary.
//
// Non-responsibilities:
// - Does not directly load or normalize persisted thread state.
// - Does not directly build thread context or reference candidates.
// - Does not classify the conversation or reinterpret semantic meaning.
// - Does not choose Conversation Function, primary routing, or safety severity.
// - Does not create or modify the authoritative Response Plan.
// - Does not execute Expression stages independently.
// - Does not compose, select, or rewrite final response language.
// - Does not substitute arbitrary intermediate output for Delivery authority.
// - Does not execute application writes or directly access Supabase.
// - Does not retrieve or store long-term memory.
// - Does not replace Delivery authority.

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "7.3.0",
  schemaVersion: "7.3.0",
  source: "ari-rebirth-pipeline",
  authorityLevel:
    "canonical_five_layer_openai_cognitive_contract_authority",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(systemSummary = {}) {
    const normalizedInput =
      this.clearPriorTurnOutputs(
        this.normalizeInput(systemSummary)
      );

    const debugTiming =
      normalizedInput.debugTiming === true ||
      normalizedInput.appContext?.debugTiming === true;

    const timingStart = performance.now();
    const timing = [];

    let summary = {
      ...normalizedInput,

      debugTiming,

      activeRuntimeLayer:
        "initialization",

      pipelineTiming:
        timing,

      pipelineTimingStart:
        timingStart,

      pipelineLifecycleErrors:
        this.toArray(
          normalizedInput.pipelineLifecycleErrors
        ),

      pipelineLifecycleWarnings:
        this.toArray(
          normalizedInput.pipelineLifecycleWarnings
        ),

      pipelineLayerResults:
        {},

      pipelineExecutionOrder:
        [],

      pipelineStopped:
        false,

      pipelineStopReason:
        null,

      pipelineStopLayer:
        null,

      conversationOperatingStateRan:
        false,

      conversationOperatingStateReady:
        false,

      conversationOperatingStateCompleted:
        false,

      deliveryResult:
        null
    };

    const mark =
      label => {
        if (!debugTiming) {
          return;
        }

        timing.push({
          label,

          ms:
            Math.round(
              performance.now() -
              timingStart
            )
        });

        summary.pipelineTiming =
          timing;
      };

    const finishTiming =
      () => {
        if (!debugTiming) {
          return;
        }

        mark(
          "AriRebirthPipeline.run complete"
        );

        console.table(timing);

        console.log(
          "[AriRebirthPipeline Timing] Total:",
          `${Math.round(
            performance.now() -
            timingStart
          )}ms`
        );
      };

    const runEngine =
      async (
        engine,
        methods = [],
        fallback = {},
        inputState = summary
      ) =>
        this.runEngine({
          engine,
          methods,
          fallback,
          inputState
        });

    mark(
      "normalizeInput complete"
    );

    /* =================================================
       1. BEGIN CANONICAL TURN
    ================================================= */

    mark(
      "before conversationOperatingState.beginTurn"
    );

    summary =
      await this.beginConversationTurn(
        summary
      );

    mark(
      "after conversationOperatingState.beginTurn"
    );

    if (
      summary.conversationOperatingStateReady !==
      true
    ) {
      summary = {
        ...summary,

        pipelineStopped:
          true,

        pipelineStopReason:
          "conversation_operating_state_not_ready",

        pipelineStopLayer:
          "initialization"
      };
    }

    /* =================================================
       2. PRESERVE CURRENT-TURN EVIDENCE
    ================================================= */

    summary =
      this.preserveExternalEvidence(
        summary
      );

    summary =
      this.preserveMealEstimate(
        summary
      );

    /* =================================================
       3. CHILD RUNTIME CONTRACT
    ================================================= */

    const layerRuntime = {
      mark,

      runEngine,

      preserveExternalEvidence:
        state =>
          this.preserveExternalEvidence(
            state
          ),

      preserveMealEstimate:
        state =>
          this.preserveMealEstimate(
            state
          ),

      runDeveloperLayer:
        state =>
          this.runDeveloperLayer(
            state
          ),

      applyContractBridge:
        state =>
          this.applyContractBridge(
            state
          ),

      beginConversationTurn:
        state =>
          this.beginConversationTurn(
            state
          ),

      completeConversationTurn:
        state =>
          this.completeConversationTurn(
            state
          ),

      buildCanonicalDeliveryResult:
        state =>
          this.buildCanonicalDeliveryResult(
            state
          )
    };

    const layers =
      this.getLayerDefinitions();

    /* =================================================
       4. FIVE-LAYER LIFECYCLE
    ================================================= */

    for (const layer of layers) {
      if (
        summary.pipelineStopped ===
        true
      ) {
        summary =
          this.recordSkippedLayer({
            summary,
            layer,

            reason:
              summary.pipelineStopReason ||
              "pipeline_stopped"
          });

        continue;
      }

      mark(
        `before ${layer.label}`
      );

      summary = {
        ...summary,

        activeRuntimeLayer:
          layer.name,

        pipelineExecutionOrder: [
          ...summary.pipelineExecutionOrder,
          layer.name
        ]
      };

      summary =
        await this.runPipelineLayer({
          layer,
          summary,

          runtime:
            layerRuntime
        });

      mark(
        `after ${layer.label}`
      );

      const stopDecision =
        this.resolvePipelineStopDecision({
          layer,
          summary
        });

      if (
        stopDecision.stop ===
        true
      ) {
        summary = {
          ...summary,

          pipelineStopped:
            true,

          pipelineStopReason:
            stopDecision.reason,

          pipelineStopLayer:
            layer.name
        };
      }
    }

    /* =================================================
       5. COGNITIVE CONTRACT INVARIANTS
    ================================================= */

    const cognitiveRuntimeValidation =
      this.validateCognitiveRuntimeState(
        summary
      );

    summary = {
      ...summary,

      cognitiveRuntimeValidation,

      pipelineLifecycleErrors:
        cognitiveRuntimeValidation.enforced === true &&
        cognitiveRuntimeValidation.valid !== true
          ? this.mergeLifecycleErrors(
              summary.pipelineLifecycleErrors,

              cognitiveRuntimeValidation.errors
                .map(
                  message =>
                    this.buildLayerError({
                      layer:
                        "cognitiveRuntime",

                      type:
                        message,

                      message,

                      fatal:
                        true
                    })
                )
            )
          : summary.pipelineLifecycleErrors,

      pipelineLifecycleWarnings:
        this.mergeLifecycleErrors(
          summary.pipelineLifecycleWarnings,

          cognitiveRuntimeValidation.warnings
            .map(
              message =>
                this.buildLayerError({
                  layer:
                    "cognitiveRuntime",

                  type:
                    message,

                  message,

                  fatal:
                    false
                })
            )
        )
    };

    /* =================================================
       6. PIPELINE LIFECYCLE RECORD
    ================================================= */

    summary =
      this.buildPipelineLifecycle(
        summary
      );

    /* =================================================
       7. AUTHORITATIVE DELIVERY NORMALIZATION
    ================================================= */

    mark(
      "before canonicalDeliveryResult"
    );

    const deliveryResult =
      this.buildCanonicalDeliveryResult(
        summary
      );

    summary = {
      ...summary,

      deliveryResult,

      deliveryComplete:
        deliveryResult.available ===
        true,

      pipelineOutputReady:
        deliveryResult.available ===
        true
    };

    /*
     * Temporary compatibility projection.
     * Remove after the App Bridge and all downstream readers
     * are confirmed to consume deliveryResult.reply directly.
     */
    if (
      deliveryResult.available === true &&
      deliveryResult.reply
    ) {
      summary.finalResponse =
        deliveryResult.reply;
    }

    mark(
      "after canonicalDeliveryResult"
    );

    /* =================================================
       8. COMPLETE CANONICAL TURN
    ================================================= */

    mark(
      "before conversationOperatingState.completeTurn"
    );

    summary =
      await this.completeConversationTurn(
        summary
      );

    mark(
      "after conversationOperatingState.completeTurn"
    );

    /* =================================================
       9. FINAL RUNTIME METADATA
    ================================================= */

    summary = {
      ...summary,

      activeRuntimeLayer:
        "complete",

      rebirthPipelineRan:
        true,

      rebirthPipelineReady:
        summary.pipelineLifecycleComplete ===
          true &&
        summary.deliveryResult?.available ===
          true &&
        summary.conversationOperatingStateCompleted ===
          true,

      rebirthPipelineSource:
        this.source,

      rebirthPipelineVersion:
        this.version,

      rebirthPipelineSchemaVersion:
        this.schemaVersion,

      pipelineArchitecture:
        "canonical-five-layer-openai-cognitive-authority-with-evidence-and-semantic-validation",

      pipelineAuthority:
        this.getAuthorityBoundaries()
    };

    this.debugLog(summary);

    finishTiming();

    summary.pipelineTiming =
      timing;

    summary.pipelineTimingStart =
      timingStart;

    return summary;
  },

  /* =====================================================
     CURRENT-TURN OUTPUT ISOLATION
  ===================================================== */

  clearPriorTurnOutputs(
    summary = {}
  ) {
    return {
      ...summary,

      activeRuntimeLayer:
        null,

      activePipelineLayer:
        null,

      activeExpressionStage:
        null,

      activeDeliveryStage:
        null,

      pipelineStopped:
        false,

      pipelineStopReason:
        null,

      pipelineStopLayer:
        null,

      pipelineExecutionOrder:
        [],

      pipelineLayerResults:
        {},

      pipelineLifecycle:
        null,

      pipelineLifecycleComplete:
        false,

      pipelineLayers:
        null,

      pipelineLayerReadiness:
        null,

      cognitiveRuntimeValidation:
        null,

      evidenceBuilderResult:
        null,

      evidenceBuilderRan:
        false,

      evidenceBuilderReady:
        false,

      evidenceBuilderSource:
        null,

      evidenceBuilderVersion:
        null,

      evidenceBuilderValidation:
        null,

      evidencePacket:
        null,

      observations:
        [],

      extractedFacts:
        null,

      explicitSignals:
        null,

      continuityEvidence:
        null,

      contextEvidence:
        null,

      artifactEvidence:
        null,

      evidenceSourceIndex:
        null,

      evidenceQuality:
        null,

      cognitiveReasoningResult:
        null,

      cognitiveReasoningReady:
        false,

      cognitiveReasoningSource:
        null,

      cognitiveReasoningVersion:
        null,

      semanticFrame:
        null,

      responseStrategy:
        null,

      modelDraftResponse:
        null,

      semanticValidationStagePacket:
        null,

      semanticValidationStageRan:
        false,

      semanticValidationStageReady:
        false,

      semanticValidationStageSource:
        null,

      semanticValidationStageVersion:
        null,

      semanticFrameValidatorResult:
        null,

      semanticFrameValidatorRan:
        false,

      semanticFrameValidatorReady:
        false,

      semanticFrameValidatorSource:
        null,

      semanticFrameValidatorVersion:
        null,

      validatedSemanticFrame:
        null,

      rejectedSemanticFrame:
        null,

      semanticFrameValidation:
        null,

      semanticFrameProvenance:
        null,

      semanticCompatibility:
        null,

      responsePlan:
        null,

      responsePlanReady:
        false,

      responsePlanningStagePacket:
        null,

      responsePlanningStageRan:
        false,

      responsePlanningStageReady:
        false,

      perceptionPacket:
        null,

      executivePacket:
        null,

      deliberationPacket:
        null,

      expressionPacket:
        null,

      deliveryPacket:
        null,

      deliveryPipelinePacket:
        null,

      responseResult:
        null,

      finalResponse:
        null,

      finalResponseUsable:
        false,

      finalResponseAuthorized:
        false,

      finalResponseDegraded:
        false,

      finalResponseFailureReason:
        null,

      finalResponseLength:
        0,

      finalResponseWarnings:
        [],

      finalResponseValidation:
        null,

      realizationPacket:
        null,

      realizationResponseText:
        "",

      realizationSuggestedEmoji:
        "",

      realizationEmojiPlacement:
        "none",

      realizationEmojiPurpose:
        null,

      realizationResponseStrategy:
        null,

      realizationComposerInstructions:
        null,

      realizationFulfillment:
        null,

      realizationGrounding:
        null,

      realizationValidation:
        null,

      realizationReady:
        false,

      realizationUsable:
        false,

      realizationComplete:
        false,

      realizationMode:
        null,

      responseRealizationResult:
        null,

      responseRealizationHandoff:
        null,

      responseRealizationStagePacket:
        null,

      responseRealizationStageRan:
        false,

      responseRealizationStageSource:
        null,

      responseRealizationStageVersion:
        null,

      languageComposer:
        null,

      languageComposerRan:
        false,

      languageComposerInvoked:
        false,

      languageComposerProducedResponse:
        false,

      languageComposerUsable:
        false,

      languageComposerAuthorized:
        false,

      languageComposerDegraded:
        false,

      languageComposerSource:
        null,

      languageComposerReason:
        null,

      languageComposerError:
        null,

      compositionEligibility:
        null,

      finalCompositionHandoff:
        null,

      finalCompositionStagePacket:
        null,

      finalCompositionStageRan:
        false,

      finalCompositionStageSource:
        null,

      finalCompositionStageVersion:
        null,

      deliveryResult:
        null,

      deliveryStageResult:
        null,

      deliveryComplete:
        false,

      pipelineOutputReady:
        false,

      deliveredResponse:
        null,

      deliveryStatus:
        null,

      deliveryEmotion:
        null,

      deliveryDiagnostics:
        null,

      deliveredActions:
        [],

      approvedActions:
        [],

      actionDelivery:
        null,

      finalPersistenceRan:
        false,

      finalPersistenceSource:
        null,

      finalPersistenceReason:
        null,

      conversationOperatingStateCompleted:
        false,

      conversationOperatingStateCompletionReason:
        null,

      conversationOperatingStateCompletionSource:
        null,

      conversationOperatingStateCompletionVersion:
        null,

      conversationOperatingStateCompleteResult:
        null,

      rebirthPipelineReady:
        false
    };
  },

  /* =====================================================
     CONVERSATION OPERATING STATE
  ===================================================== */

  getConversationOperatingState() {
    return (
      window.AriConversationOperatingState ||
      window.Ari?.conversationOperatingState ||
      null
    );
  },

  async beginConversationTurn(
    summary = {}
  ) {
    const operatingState =
      this.getConversationOperatingState();

    if (
      !operatingState ||
      typeof operatingState.beginTurn !==
        "function"
    ) {
      const error =
        this.buildLayerError({
          layer:
            "conversationOperatingState",

          type:
            "conversation_operating_state_not_available",

          message:
            "Conversation Operating State was not available before Perception.",

          fatal:
            true
        });

      return {
        ...summary,

        conversationOperatingStateRan:
          false,

        conversationOperatingStateReady:
          false,

        conversationOperatingStateSource:
          "not-loaded",

        conversationOperatingStateError:
          error.message,

        pipelineLifecycleErrors:
          this.appendUniqueError(
            summary.pipelineLifecycleErrors,
            error
          )
      };
    }

    try {
      const result =
        await operatingState.beginTurn(
          summary
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        throw new Error(
          "conversation_operating_state_begin_turn_returned_invalid_result"
        );
      }

      const ready =
        result.conversationOperatingStateReady !==
          false &&
        result.ready !==
          false;

      return {
        ...summary,
        ...result,

        conversationOperatingStateRan:
          true,

        conversationOperatingStateReady:
          ready,

        conversationOperatingStateSource:
          result.conversationOperatingStateSource ||
          result.source ||
          operatingState.source ||
          "ari-conversation-operating-state",

        conversationOperatingStateVersion:
          result.conversationOperatingStateVersion ||
          result.version ||
          operatingState.version ||
          null,

        conversationOperatingStateBeginResult:
          result
      };
    } catch (error) {
      const lifecycleError =
        this.buildLayerError({
          layer:
            "conversationOperatingState",

          type:
            "conversation_operating_state_begin_turn_failed",

          message:
            error?.message ||
            String(error),

          fatal:
            true
        });

      return {
        ...summary,

        conversationOperatingStateRan:
          false,

        conversationOperatingStateReady:
          false,

        conversationOperatingStateSource:
          operatingState.source ||
          "ari-conversation-operating-state",

        conversationOperatingStateError:
          lifecycleError.message,

        pipelineLifecycleErrors:
          this.appendUniqueError(
            summary.pipelineLifecycleErrors,
            lifecycleError
          )
      };
    }
  },

  async completeConversationTurn(
    summary = {}
  ) {
    const delivery =
      summary.deliveryResult ||
      {};

    if (
      delivery.available !== true ||
      !delivery.reply
    ) {
      return {
        ...summary,

        conversationOperatingStateCompleted:
          false,

        conversationOperatingStateCompletionReason:
          "authoritative_delivery_unavailable",

        finalPersistenceRan:
          false,

        finalPersistenceReason:
          "authoritative_delivery_unavailable"
      };
    }

    if (
      summary.conversationOperatingStateCompleted ===
      true
    ) {
      return summary;
    }

    const operatingState =
      this.getConversationOperatingState();

    if (
      !operatingState ||
      typeof operatingState.completeTurn !==
        "function"
    ) {
      return {
        ...summary,

        conversationOperatingStateCompleted:
          false,

        conversationOperatingStateCompletionReason:
          "conversation_operating_state_not_available",

        finalPersistenceRan:
          false,

        finalPersistenceReason:
          "conversation_operating_state_not_available"
      };
    }

    try {
      const result =
        await operatingState.completeTurn(
          summary
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        throw new Error(
          "conversation_operating_state_complete_turn_returned_invalid_result"
        );
      }

      return {
        ...summary,
        ...result,

        conversationOperatingStateCompleted:
          result.conversationOperatingStateCompleted !==
          false,

        conversationOperatingStateCompletionSource:
          result.conversationOperatingStateSource ||
          result.source ||
          operatingState.source ||
          "ari-conversation-operating-state",

        conversationOperatingStateCompletionVersion:
          result.conversationOperatingStateVersion ||
          result.version ||
          operatingState.version ||
          null,

        conversationOperatingStateCompleteResult:
          result,

        finalPersistenceRan:
          true,

        finalPersistenceSource:
          "ari-conversation-operating-state"
      };
    } catch (error) {
      const lifecycleError =
        this.buildLayerError({
          layer:
            "conversationOperatingState",

          type:
            "conversation_operating_state_complete_turn_failed",

          message:
            error?.message ||
            String(error),

          fatal:
            false
        });

      return {
        ...summary,

        conversationOperatingStateCompleted:
          false,

        conversationOperatingStateCompletionReason:
          "conversation_operating_state_complete_turn_failed",

        conversationOperatingStateCompletionError:
          lifecycleError.message,

        finalPersistenceRan:
          false,

        finalPersistenceReason:
          lifecycleError.type,

        pipelineLifecycleWarnings:
          this.appendUniqueError(
            summary.pipelineLifecycleWarnings,
            lifecycleError
          )
      };
    }
  },

  /* =====================================================
     LAYER DEFINITIONS
  ===================================================== */

  getLayerDefinitions() {
    return [
      {
        name:
          "perception",

        label:
          "perceptionPipeline",

        ranKey:
          "perceptionPipelineRan",

        sourceKey:
          "perceptionPipelineSource",

        errorKey:
          "perceptionPipelineError",

        packetKey:
          "perceptionPacket",

        required:
          true,

        pipeline:
          window.AriPerceptionPipeline
      },

      {
        name:
          "executiveRouting",

        label:
          "executiveRoutingPipeline",

        ranKey:
          "executiveRoutingPipelineRan",

        sourceKey:
          "executiveRoutingPipelineSource",

        errorKey:
          "executiveRoutingPipelineError",

        packetKey:
          "executivePacket",

        required:
          true,

        pipeline:
          window.AriExecutiveRoutingPipeline
      },

      {
        name:
          "deliberation",

        label:
          "deliberationPipeline",

        ranKey:
          "deliberationPipelineRan",

        sourceKey:
          "deliberationPipelineSource",

        errorKey:
          "deliberationPipelineError",

        packetKey:
          "deliberationPacket",

        required:
          true,

        pipeline:
          window.AriDeliberationPipeline
      },

      {
        name:
          "expression",

        label:
          "expressionPipeline",

        ranKey:
          "expressionPipelineRan",

        sourceKey:
          "expressionPipelineSource",

        errorKey:
          "expressionPipelineError",

        packetKey:
          "expressionPacket",

        required:
          true,

        pipeline:
          window.AriExpressionPipeline
      },

      {
        name:
          "delivery",

        label:
          "deliveryPipeline",

        ranKey:
          "deliveryPipelineRan",

        sourceKey:
          "deliveryPipelineSource",

        errorKey:
          "deliveryPipelineError",

        packetKey:
          "deliveryPacket",

        required:
          true,

        pipeline:
          window.AriDeliveryPipeline
      }
    ];
  },

  /* =====================================================
     PIPELINE LAYER EXECUTION
  ===================================================== */

  async runPipelineLayer({
    layer = {},
    summary = {},
    runtime = {}
  } = {}) {
    const name =
      layer.name ||
      "unknown";

    const pipeline =
      layer.pipeline ||
      null;

    const startedAt =
      performance.now();

    if (
      !pipeline ||
      typeof pipeline.run !==
        "function"
    ) {
      const error =
        this.buildLayerError({
          layer:
            name,

          type:
            "pipeline_not_loaded",

          message:
            `The ${name} pipeline was not loaded.`,

          fatal:
            layer.required ===
            true
        });

      return {
        ...summary,

        [layer.ranKey]:
          false,

        [layer.sourceKey]:
          "not-loaded",

        [layer.errorKey]:
          error.message,

        pipelineLayerResults: {
          ...summary.pipelineLayerResults,

          [name]: {
            ran:
              false,

            ready:
              false,

            source:
              "not-loaded",

            required:
              layer.required ===
              true,

            durationMs:
              Math.round(
                performance.now() -
                startedAt
              ),

            error
          }
        },

        pipelineLifecycleErrors:
          this.appendUniqueError(
            summary.pipelineLifecycleErrors,
            error
          )
      };
    }

    try {
      const result =
        await pipeline.run(
          summary,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        const error =
          this.buildLayerError({
            layer:
              name,

            type:
              "invalid_pipeline_result",

            message:
              `The ${name} pipeline returned an invalid result.`,

            fatal:
              layer.required ===
              true
          });

        return {
          ...summary,

          [layer.ranKey]:
            false,

          [layer.sourceKey]:
            "invalid-result",

          [layer.errorKey]:
            error.message,

          pipelineLayerResults: {
            ...summary.pipelineLayerResults,

            [name]: {
              ran:
                false,

              ready:
                false,

              source:
                "invalid-result",

              required:
                layer.required ===
                true,

              durationMs:
                Math.round(
                  performance.now() -
                  startedAt
              ),

              error
            }
          },

          pipelineLifecycleErrors:
            this.appendUniqueError(
              summary.pipelineLifecycleErrors,
              error
            )
        };
      }

      const ran =
        result[layer.ranKey] ===
        true;

      const source =
        result[layer.sourceKey] ||
        pipeline.source ||
        layer.label ||
        name;

      const ready =
        this.resolveLayerReadiness({
          layer,
          result,
          ran
        });

      const layerResult = {
        ran,
        ready,
        source,

        version:
          result[
            `${name}PipelineVersion`
          ] ||
          pipeline.version ||
          null,

        required:
          layer.required ===
          true,

        packetAvailable:
          Boolean(
            result[layer.packetKey]
          ),

        durationMs:
          Math.round(
            performance.now() -
            startedAt
          ),

        error:
          result[layer.errorKey] ||
          null
      };

      let nextState = {
        ...summary,
        ...result,

        pipelineLifecycleErrors:
          this.mergeLifecycleErrors(
            summary.pipelineLifecycleErrors,
            result.pipelineLifecycleErrors
          ),

        pipelineLifecycleWarnings:
          this.mergeLifecycleErrors(
            summary.pipelineLifecycleWarnings,
            result.pipelineLifecycleWarnings
          ),

        pipelineExecutionOrder:
          summary.pipelineExecutionOrder,

        pipelineLayerResults: {
          ...summary.pipelineLayerResults,
          ...result.pipelineLayerResults,

          [name]:
            layerResult
        }
      };

      if (
        layer.required === true &&
        (
          ran !== true ||
          ready !== true
        )
      ) {
        const error =
          this.buildLayerError({
            layer:
              name,

            type:
              ran !== true
                ? "required_pipeline_did_not_run"
                : "required_pipeline_not_ready",

            message:
              ran !== true
                ? `The required ${name} pipeline did not report successful execution.`
                : `The required ${name} pipeline ran but did not produce a ready result.`,

            fatal:
              true
          });

        nextState = {
          ...nextState,

          pipelineLifecycleErrors:
            this.appendUniqueError(
              nextState.pipelineLifecycleErrors,
              error
            ),

          pipelineLayerResults: {
            ...nextState.pipelineLayerResults,

            [name]: {
              ...layerResult,

              error:
                layerResult.error ||
                error
            }
          }
        };
      }

      return nextState;
    } catch (error) {
      const lifecycleError =
        this.buildLayerError({
          layer:
            name,

          type:
            "pipeline_execution_failed",

          message:
            error?.message ||
            String(error),

          fatal:
            layer.required ===
            true
        });

      return {
        ...summary,

        [layer.ranKey]:
          false,

        [layer.sourceKey]:
          "pipeline-error",

        [layer.errorKey]:
          lifecycleError.message,

        pipelineLayerResults: {
          ...summary.pipelineLayerResults,

          [name]: {
            ran:
              false,

            ready:
              false,

            source:
              "pipeline-error",

            required:
              layer.required ===
              true,

            durationMs:
              Math.round(
                performance.now() -
                startedAt
              ),

            error:
              lifecycleError
          }
        },

        pipelineLifecycleErrors:
          this.appendUniqueError(
            summary.pipelineLifecycleErrors,
            lifecycleError
          )
      };
    }
  },

  resolveLayerReadiness({
    layer = {},
    result = {},
    ran = false
  } = {}) {
    const name =
      layer.name ||
      "";

    const explicitReadyKeys = [
      `${name}PipelineReady`,
      `${name}Ready`,
      `${layer.label}Ready`,
      "pipelineReady"
    ];

    for (const key of explicitReadyKeys) {
      if (result[key] === true) {
        return true;
      }

      if (result[key] === false) {
        return false;
      }
    }

    const packet =
      result[layer.packetKey];

    if (
      packet &&
      typeof packet ===
        "object"
    ) {
      if (packet.ready === true) {
        return true;
      }

      if (
        packet.ready === false &&
        packet.required === true
      ) {
        return false;
      }
    }

    return ran === true;
  },

  resolvePipelineStopDecision({
    layer = {},
    summary = {}
  } = {}) {
    const result =
      summary.pipelineLayerResults
        ?.[layer.name] ||
      {};

    if (
      layer.required === true &&
      result.ran !== true
    ) {
      return {
        stop:
          true,

        reason:
          `required_${layer.name}_pipeline_did_not_run`
      };
    }

    if (
      layer.required === true &&
      result.ready !== true
    ) {
      return {
        stop:
          true,

        reason:
          `required_${layer.name}_pipeline_not_ready`
      };
    }

    return {
      stop:
        false,

      reason:
        null
    };
  },

  recordSkippedLayer({
    summary = {},
    layer = {},
    reason = "pipeline_stopped"
  } = {}) {
    return {
      ...summary,

      [layer.ranKey]:
        false,

      [layer.sourceKey]:
        "skipped",

      [layer.errorKey]:
        reason,

      pipelineLayerResults: {
        ...summary.pipelineLayerResults,

        [layer.name]: {
          ran:
            false,

          ready:
            false,

          skipped:
            true,

          source:
            "skipped",

          required:
            layer.required ===
            true,

          reason
        }
      }
    };
  },

  async runEngine({
    engine = null,
    methods = [],
    fallback = {},
    inputState = {}
  } = {}) {
    if (!engine) {
      return fallback;
    }

    for (
      const method
      of this.toArray(methods)
    ) {
      if (
        typeof engine[method] !==
        "function"
      ) {
        continue;
      }

      try {
        const result =
          await engine[method](
            inputState
          );

        return (
          result &&
          typeof result ===
            "object"
            ? result
            : fallback
        );
      } catch (error) {
        return {
          ...(
            fallback &&
            typeof fallback ===
              "object"
              ? fallback
              : {}
          ),

          error:
            error?.message ||
            String(error),

          failedMethod:
            method,

          engineVersion:
            engine?.version ||
            null
        };
      }
    }

    return fallback;
  },

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  normalizeInput(
    systemSummary = {}
  ) {
    const source =
      systemSummary &&
      typeof systemSummary ===
        "object" &&
      !Array.isArray(systemSummary)
        ? systemSummary
        : {};

    const suppliedTurn =
      source.turn &&
      typeof source.turn ===
        "object"
        ? source.turn
        : {};

    const originalText =
      this.cleanText(
        suppliedTurn.originalText ||
        source.originalUserMessage ||
        source.userMessage ||
        source.message ||
        source.input ||
        ""
      );

    const currentText =
      this.cleanText(
        suppliedTurn.currentText ||
        suppliedTurn.effectiveText ||
        source.currentTurnText ||
        originalText
      );

    const normalizedText =
      this.normalizeText(
        suppliedTurn.normalizedText ||
        source.normalizedMessage ||
        currentText
      );

    const turnId =
      suppliedTurn.turnId ||
      source.currentTurnId ||
      source.turnId ||
      this.createTurnId();

    const createdAt =
      suppliedTurn.createdAt ||
      source.createdAt ||
      new Date().toISOString();

    const turn = {
      schema:
        "ari_runtime_turn",

      schemaVersion:
        suppliedTurn.schemaVersion ||
        this.schemaVersion,

      turnId,

      originalText,

      currentText:
        currentText ||
        originalText,

      effectiveText:
        this.cleanText(
          suppliedTurn.effectiveText ||
          currentText ||
          originalText
        ),

      semanticInputText:
        this.cleanText(
          suppliedTurn.semanticInputText ||
          currentText ||
          originalText
        ),

      normalizedText,

      source:
        suppliedTurn.source ||
        source.appContext?.source ||
        source.source ||
        "unknown",

      createdAt,

      textWasRewritten:
        suppliedTurn.textWasRewritten ===
        true,

      originalTextPreserved:
        suppliedTurn.originalTextPreserved !==
        false,

      currentTurnWasResolved:
        suppliedTurn.currentTurnWasResolved ===
          true ||
        source.currentTurnWasResolved ===
          true,

      ellipticalFollowUpResolved:
        suppliedTurn.ellipticalFollowUpResolved ===
          true ||
        source.ellipticalFollowUpResolved ===
          true,

      resolutionSource:
        suppliedTurn.resolutionSource ||
        source.resolutionSource ||
        "none",

      authority:
        "canonical_current_turn_input"
    };

    return {
      ...source,

      schema:
        source.schema ||
        "ari_rebirth_runtime_request",

      schemaVersion:
        source.schemaVersion ||
        this.schemaVersion,

      turn,

      currentTurnId:
        turnId,

      turnId,

      originalUserMessage:
        originalText,

      userMessage:
        originalText,

      message:
        originalText,

      input:
        originalText,

      currentTurnText:
        turn.currentText,

      semanticInputText:
        turn.semanticInputText,

      normalizedMessage:
        normalizedText,

      resolvedUserQuestion:
        turn.currentTurnWasResolved
          ? this.cleanText(
              source.resolvedUserQuestion ||
              turn.effectiveText
            )
          : null,

      resolvedCurrentTurn:
        turn.currentTurnWasResolved
          ? (
              source.resolvedCurrentTurn ||
              {
                originalText,

                resolvedText:
                  turn.effectiveText,

                turnId
              }
            )
          : null,

      currentTurnWasResolved:
        turn.currentTurnWasResolved,

      ellipticalFollowUpResolved:
        turn.ellipticalFollowUpResolved,

      resolutionSource:
        turn.resolutionSource,

      runtimeRequestAccepted:
        Boolean(originalText),

      runtimeRequestSource:
        this.source
    };
  },

  createTurnId() {
    const random =
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : [
            Date.now().toString(36),
            Math.random()
              .toString(36)
              .slice(2, 10)
          ].join("_");

    return `ari_turn_${random}`;
  },

  /* =====================================================
     EXTERNAL EVIDENCE
  ===================================================== */

  preserveExternalEvidence(
    summary = {}
  ) {
    const appContext =
      summary.appContext ||
      {};

    const externalEvidence =
      appContext.externalEvidence ||
      {};

    const githubFileContext =
      summary.githubFileContext ||
      appContext.githubFileContext ||
      externalEvidence.githubFileContext ||
      null;

    const suppliedGithubEvidence =
      summary.githubEvidence ||
      appContext.githubEvidence ||
      externalEvidence.githubEvidence ||
      githubFileContext ||
      null;

    const developerInvestigation =
      summary.developerInvestigation ||
      appContext.developerInvestigation ||
      externalEvidence.developerInvestigation ||
      null;

    const githubEvidence =
      this.normalizeGithubEvidence(
        suppliedGithubEvidence
      );

    return {
      ...summary,

      githubFileContext,
      githubEvidence,
      developerInvestigation,

      githubEvidenceAvailable:
        githubEvidence.available ===
        true,

      externalEvidence: {
        githubFileContext,
        githubEvidence,
        developerInvestigation,

        authority:
          "externally_supplied_evidence_only"
      },

      appContext: {
        ...appContext,

        externalEvidence: {
          ...externalEvidence,
          githubFileContext,
          githubEvidence,
          developerInvestigation
        }
      }
    };
  },

  normalizeGithubEvidence(
    value = null
  ) {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return {
        available:
          false,

        filePath:
          null,

        content:
          "",

        contentLength:
          0,

        contentPreview:
          "",

        source:
          "none",

        authority:
          "external_code_evidence_only"
      };
    }

    const content =
      String(
        value.content ||
        ""
      );

    return {
      ...value,

      available:
        Boolean(
          content.trim()
        ),

      filePath:
        value.filePath ||
        value.path ||
        value.name ||
        null,

      content,

      contentLength:
        content.length,

      contentPreview:
        content.slice(0, 5000),

      source:
        value.source ||
        "app_supplied_github_evidence",

      authority:
        "external_code_evidence_only"
    };
  },

  preserveMealEstimate(
    summary = {}
  ) {
    const text =
      String(
        summary.turn?.originalText ||
        summary.userMessage ||
        ""
      );

    const wantsMealLog =
      /\b(log|add|save|track)\b/i
        .test(text);

    const newMealEstimate =
      summary.mealEstimate ||
      summary.aiData?.mealEstimate ||
      summary.structuredOutput?.mealEstimate ||
      summary.rawOpenAIData?.mealEstimate ||
      summary.response?.mealEstimate ||
      null;

    const priorMealEstimate =
      wantsMealLog
        ? (
            summary.lastMealEstimate ||
            summary.appContext?.lastMealEstimate ||
            summary.threadState?.lastMealEstimate ||
            null
          )
        : null;

    const mealEstimate =
      newMealEstimate ||
      priorMealEstimate;

    if (!mealEstimate) {
      return summary;
    }

    return {
      ...summary,

      mealEstimate,

      lastMealEstimate:
        mealEstimate,

      appContext: {
        ...(summary.appContext || {}),

        lastMealEstimate:
          mealEstimate,

        mealEstimate
      }
    };
  },

  /* =====================================================
     PIPELINE LIFECYCLE
  ===================================================== */

  buildPipelineLifecycle(
    summary = {}
  ) {
    const layerResults =
      summary.pipelineLayerResults ||
      {};

    const layers = {
      perception:
        this.normalizeLifecycleLayer(
          layerResults.perception,
          summary.perceptionPipelineRan
        ),

      executiveRouting:
        this.normalizeLifecycleLayer(
          layerResults.executiveRouting,
          summary.executiveRoutingPipelineRan
        ),

      deliberation:
        this.normalizeLifecycleLayer(
          layerResults.deliberation,
          summary.deliberationPipelineRan
        ),

      expression:
        this.normalizeLifecycleLayer(
          layerResults.expression,
          summary.expressionPipelineRan
        ),

      delivery:
        this.normalizeLifecycleLayer(
          layerResults.delivery,
          summary.deliveryPipelineRan
        )
    };

    const allRan =
      Object.values(layers)
        .every(
          layer =>
            layer.ran === true
        );

    const allReady =
      Object.values(layers)
        .every(
          layer =>
            layer.ready === true
        );

    const complete =
      allRan &&
      allReady &&
      summary.pipelineStopped !==
        true;

    return {
      ...summary,

      rebirthPipelineRan:
        true,

      rebirthPipelineSource:
        this.source,

      rebirthPipelineVersion:
        this.version,

      pipelineArchitecture:
        "canonical-five-layer-openai-cognitive-authority-with-evidence-and-semantic-validation",

      pipelineLayers:
        Object.fromEntries(
          Object.entries(layers)
            .map(
              ([key, value]) => [
                key,
                value.ran === true
              ]
            )
        ),

      pipelineLayerReadiness:
        Object.fromEntries(
          Object.entries(layers)
            .map(
              ([key, value]) => [
                key,
                value.ready === true
              ]
            )
        ),

      pipelineLifecycle: {
        schema:
          "ari_pipeline_lifecycle",

        schemaVersion:
          this.schemaVersion,

        architecture:
          "canonical-five-layer-openai-cognitive-authority-with-evidence-and-semantic-validation",

        conversationOperatingState: {
          began:
            summary.conversationOperatingStateRan ===
            true,

          ready:
            summary.conversationOperatingStateReady ===
            true,

          source:
            summary.conversationOperatingStateSource ||
            null,

          version:
            summary.conversationOperatingStateVersion ||
            null
        },

        executionOrder:
          summary.pipelineExecutionOrder ||
          [],

        layers,

        allLayersRan:
          allRan,

        allLayersReady:
          allReady,

        stopped:
          summary.pipelineStopped ===
          true,

        stopLayer:
          summary.pipelineStopLayer ||
          null,

        stopReason:
          summary.pipelineStopReason ||
          null,

        errors:
          this.toArray(
            summary.pipelineLifecycleErrors
          ),

        warnings:
          this.toArray(
            summary.pipelineLifecycleWarnings
          ),

        complete,

        authority:
          "five_layer_lifecycle_record"
      },

      pipelineLifecycleComplete:
        complete
    };
  },

  normalizeLifecycleLayer(
    value = {},
    reportedRan = false
  ) {
    const source =
      value &&
      typeof value ===
        "object"
        ? value
        : {};

    return {
      ran:
        source.ran === true ||
        reportedRan === true,

      ready:
        source.ready === true ||
        (
          reportedRan === true &&
          source.ready !== false
        ),

      skipped:
        source.skipped === true,

      required:
        source.required !== false,

      source:
        source.source ||
        null,

      version:
        source.version ||
        null,

      packetAvailable:
        source.packetAvailable ===
        true,

      durationMs:
        source.durationMs ??
        null,

      reason:
        source.reason ||
        null,

      error:
        source.error ||
        null
    };
  },

  /* =====================================================
     CANONICAL DELIVERY RESULT
  ===================================================== */

  buildCanonicalDeliveryResult(
    summary = {}
  ) {
    const deliverySources =
      this.getDeliveryResultSources(
        summary
      );

    const authoritativeSource =
      deliverySources.find(
        source =>
          this.extractDeliveryReply(
            source.value
          )
      ) ||
      null;

    if (authoritativeSource) {
      return this.normalizeDeliveryResult({
        sourceRecord:
          authoritativeSource,

        summary
      });
    }

    return {
      schema:
        "ari_delivery_result",

      schemaVersion:
        this.schemaVersion,

      available:
        false,

      ready:
        false,

      authoritative:
        false,

      compatibilityFallback:
        false,

      status:
        "delivery_unavailable",

      reply:
        "",

      emotion:
        "idle",

      actions:
        [],

      developerIntent:
        null,

      source:
        this.source,

      version:
        this.version,

      error:
        summary.pipelineStopped === true
          ? summary.pipelineStopReason
          : "authoritative_delivery_result_missing",

      diagnostics: {
        deliveryPipelineRan:
          summary.deliveryPipelineRan ===
          true,

        finalCompositionStageRan:
          summary.finalCompositionStageRan ===
          true,

        realizationStageRan:
          summary.responseRealizationStageRan ===
          true,

        realizationReady:
          summary.realizationReady ===
          true,

        realizationUsable:
          summary.realizationUsable ===
          true,

        finalResponseUsable:
          summary.finalResponseUsable ===
          true,

        pipelineLifecycleComplete:
          summary.pipelineLifecycleComplete ===
          true,

        pipelineStopped:
          summary.pipelineStopped ===
          true,

        pipelineStopLayer:
          summary.pipelineStopLayer ||
          null,

        pipelineStopReason:
          summary.pipelineStopReason ||
          null,

        examinedSources:
          deliverySources.map(
            source => ({
              key:
                source.key,

              replyAvailable:
                Boolean(
                  this.extractDeliveryReply(
                    source.value
                  )
                )
            })
          )
      },

      authority:
        "no_authoritative_delivery_available"
    };
  },

  getDeliveryResultSources(
    summary = {}
  ) {
    return [
      {
        key:
          "deliveryPacket.deliveryResult",

        value:
          summary.deliveryPacket
            ?.deliveryResult
      },

      {
        key:
          "deliveryPipelinePacket.deliveryResult",

        value:
          summary.deliveryPipelinePacket
            ?.deliveryResult
      },

      {
        key:
          "deliveryStageResult",

        value:
          summary.deliveryStageResult
      }
    ].filter(
      source =>
        source.value &&
        typeof source.value ===
          "object" &&
        !Array.isArray(
          source.value
        )
    );
  },

  normalizeDeliveryResult({
    sourceRecord = {},
    summary = {}
  } = {}) {
    const raw =
      sourceRecord.value ||
      {};

    const reply =
      this.extractDeliveryReply(
        raw
      );

    const ready =
      Boolean(reply) &&
      raw.ready !== false &&
      raw.available !== false;

    return {
      schema:
        "ari_delivery_result",

      schemaVersion:
        raw.schemaVersion ||
        this.schemaVersion,

      available:
        ready,

      ready,

      authoritative:
        true,

      compatibilityFallback:
        false,

      status:
        raw.status ||
        raw.deliveryStatus ||
        (
          ready
            ? "delivered"
            : "delivery_unavailable"
        ),

      reply,

      emotion:
        this.resolveDeliveredEmotion(
          raw.emotion ||
          raw.uiEmotion ||
          raw.presentation?.emotion ||
          raw.ui?.emotion ||
          "idle"
        ),

      actions:
        this.normalizeDeliveredActions(
          raw.approvedActions ||
          raw.deliveredActions ||
          raw.actions ||
          raw.actionDelivery?.approvedActions ||
          raw.actionDelivery?.actions ||
          []
        ),

      developerIntent:
        raw.developerIntent ||
        raw.deliveryDeveloperIntent ||
        null,

      source:
        raw.source ||
        sourceRecord.key ||
        "ari-delivery-pipeline",

      sourcePath:
        sourceRecord.key ||
        null,

      version:
        raw.version ||
        summary.deliveryPipelineVersion ||
        null,

      error:
        raw.error ||
        null,

      diagnostics:
        raw.diagnostics ||
        raw.deliveryDiagnostics ||
        null,

      raw,

      authority:
        "authoritative_delivery_pipeline_output"
    };
  },

  extractDeliveryReply(
    delivery = null
  ) {
    if (!delivery) {
      return "";
    }

    if (
      typeof delivery ===
      "string"
    ) {
      return this.cleanText(delivery);
    }

    if (
      typeof delivery !==
        "object"
    ) {
      return "";
    }

    const candidates = [
      delivery.reply,
      delivery.text,
      delivery.finalResponse,
      delivery.userFacingResponse,
      delivery.deliveredResponse,
      delivery.response
    ];

    for (const candidate of candidates) {
      const text =
        this.extractResponseText(
          candidate
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  extractResponseText(
    candidate = null
  ) {
    if (
      candidate === null ||
      candidate === undefined
    ) {
      return "";
    }

    if (
      typeof candidate ===
      "string"
    ) {
      return this.cleanText(
        candidate
      );
    }

    if (
      typeof candidate ===
        "number" ||
      typeof candidate ===
        "boolean"
    ) {
      return String(candidate)
        .trim();
    }

    if (
      typeof candidate !==
        "object"
    ) {
      return "";
    }

    const nested =
      candidate.text ??
      candidate.reply ??
      candidate.finalResponse ??
      candidate.userFacingResponse ??
      candidate.deliveredResponse ??
      candidate.response ??
      candidate.content ??
      candidate.message ??
      "";

    if (nested === candidate) {
      return "";
    }

    return this.extractResponseText(
      nested
    );
  },

  resolveDeliveredEmotion(
    value = "idle"
  ) {
    const emotion =
      this.normalizeIdentifier(value);

    const allowed = [
      "idle",
      "thinking",
      "happy",
      "celebrate",
      "sad",
      "concerned",
      "mad",
      "shy",
      "coach",
      "wow",
      "laugh",
      "listening",
      "logging",
      "success"
    ];

    return allowed.includes(emotion)
      ? emotion
      : "idle";
  },

  normalizeDeliveredActions(
    actions = []
  ) {
    return this.toArray(actions)
      .filter(
        action =>
          action &&
          typeof action ===
            "object"
      )
      .map(
        action => ({
          ...action,

          requiresApproval:
            true,

          directWriteAllowed:
            false
        })
      );
  },

  /* =====================================================
     DEVELOPER RUNTIME COORDINATION
  ===================================================== */

  async runDeveloperLayer(
    summary = {}
  ) {
    const ownerMode =
      summary.ownerMode === true ||
      summary.appContext?.ownerMode === true ||
      summary.userContext?.ownerMode === true;

    if (!ownerMode) {
      return summary;
    }

    const routingAuthorized =
      summary.routingContract
        ?.run
        ?.developer ===
        true ||
      summary.routingContract?.mode ===
        "developer" ||
      summary.shouldRunDeveloperLayer ===
        true;

    const conversationAuthorized =
      summary.conversationFunction
        ?.developerArtifactRequest ===
        true ||
      summary.developerArtifactRequest ===
        true ||
      summary.primaryFunction ===
        "developer_artifact_request" ||
      summary.primaryFunction ===
        "build_or_debug_request";

    if (
      !routingAuthorized &&
      !conversationAuthorized
    ) {
      return summary;
    }

    const chain = [
      [
        "developerUnderstanding",
        window.AriRebirthDeveloperUnderstandingEngine,
        ["understand"]
      ],

      [
        "projectKnowledgeGraph",
        window.AriRebirthProjectKnowledgeGraphEngine,
        ["build"]
      ],

      [
        "capabilityRegistry",
        window.AriRebirthCapabilityRegistryEngine,
        ["inspect"]
      ],

      [
        "architecture",
        window.AriRebirthArchitectureEngine,
        ["design"]
      ],

      [
        "uiLayoutPlanner",
        window.AriRebirthUILayoutPlannerEngine,
        ["plan"]
      ],

      [
        "bugDiagnosis",
        window.AriRebirthBugDiagnosisEngine,
        ["diagnose"]
      ],

      [
        "executionPlanner",
        window.AriRebirthExecutionPlannerEngine,
        ["plan"]
      ],

      [
        "codeEvidence",
        window.AriRebirthCodeEvidenceEngine,
        ["build"]
      ],

      [
        "codeUnderstanding",
        window.AriRebirthCodeUnderstandingEngine,
        ["understand"]
      ],

      [
        "patchDecision",
        window.AriRebirthPatchDecisionEngine,
        ["decide"]
      ],

      [
        "patchValidation",
        window.AriRebirthPatchValidationEngine,
        ["validate"]
      ],

      [
        "developerHandoff",
        window.AriRebirthDeveloperHandoffEngine,
        [
          "handoff",
          "create",
          "build"
        ]
      ]
    ];

    let state = {
      ...summary
    };

    for (
      const [
        key,
        engine,
        methods
      ]
      of chain
    ) {
      if (!engine) {
        continue;
      }

      const result =
        await this.runEngine({
          engine,
          methods,

          fallback:
            null,

          inputState:
            state
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        continue;
      }

      state = {
        ...state,

        [key]:
          result,

        [
          `rebirth${key
            .charAt(0)
            .toUpperCase()}${key.slice(1)}`
        ]:
          result,

        ...result
      };
    }

    return {
      ...state,

      developerLayerRan:
        true,

      developerLayerSource:
        this.source,

      developerLayerVersion:
        this.version
    };
  },

  /* =====================================================
     RUNTIME CONTRACT PROJECTION
  ===================================================== */

  applyContractBridge(
    summary = {}
  ) {
    const contract =
      summary.situationContract ||
      {};

    const map =
      summary.situationMap ||
      {};

    const triage =
      summary.triage ||
      summary.ariTriage ||
      {};

    const routing =
      summary.routingContract ||
      {};

    const routingAuthoritative =
      routing.authority
        ?.authoritative ===
      true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
      true;

    const primary =
      safetyOverride
        ? (
            summary.safetyRequiredPlanner ||
            contract.primary ||
            triage.primaryLane ||
            "immediate_safety_response"
          )
        : routingAuthoritative &&
            routing.primaryLane
          ? routing.primaryLane
          : (
              contract.primary ||
              triage.primaryLane ||
              summary.situationContractPrimary ||
              summary.primaryLane ||
              "general_understanding"
            );

    return {
      ...summary,

      contractBridgeRan:
        true,

      contractBridgeSource:
        this.source,

      situationContract:
        contract,

      contextLane:
        routing.contextLane ||
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      primaryLane:
        primary,

      triagePrimaryLane:
        triage.primaryLane ||
        null,

      situationContractPrimary:
        primary,

      responseShape:
        (
          routingAuthoritative &&
          !safetyOverride
            ? routing.responseShape
            : null
        ) ||
        contract.responseShape ||
        triage.responseShape ||
        summary.responseShape ||
        null,

      responseRules:
        this.mergeUnique(
          contract.responseRules,
          triage.responseConstraints,
          summary.responseRules
        ),

      responseConstraints:
        this.mergeUnique(
          contract.responseRules,
          triage.responseConstraints,
          summary.responseConstraints
        ),

      primarySituationThesis:
        contract.situationThesis?.thesis ||
        map.primarySituationThesis ||
        summary.primarySituationThesis ||
        null,

      situationNarrative:
        contract.situationThesis?.narrative ||
        map.situationNarrative ||
        summary.situationNarrative ||
        null,

      thesisRecommendedUse:
        contract.situationThesis?.recommendedUse ||
        map.thesisRecommendedUse ||
        summary.thesisRecommendedUse ||
        "do_not_use_as_authority",

      situationContractSupport:
        this.toArray(
          contract.support
        ),

      situationContractBrief:
        this.toArray(
          contract.brief
        ),

      situationContractContext:
        this.toArray(
          contract.context
        ),

      situationContractDeferred:
        this.toArray(
          contract.deferred
        ),

      situationContractBlocked:
        this.toArray(
          contract.blocked
        )
    };
  },

  /* =====================================================
     ERRORS
  ===================================================== */

  buildLayerError({
    layer = "unknown",
    type = "pipeline_error",
    message = "",
    fatal = false
  } = {}) {
    return {
      layer,
      type,

      error:
        type,

      message,

      fatal:
        fatal === true,

      source:
        this.source,

      createdAt:
        new Date().toISOString()
    };
  },

  appendUniqueError(
    existing = [],
    error = null
  ) {
    if (!error) {
      return this.toArray(existing);
    }

    return this.mergeLifecycleErrors(
      existing,
      [error]
    );
  },

  mergeLifecycleErrors(
    ...values
  ) {
    const output = [];
    const seen = new Set();

    values
      .flatMap(
        value =>
          this.toArray(value)
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this.normalizeText(value)
              : [
                  value?.layer || "",
                  value?.type ||
                    value?.error ||
                    "",
                  value?.message || ""
                ]
                  .map(
                    item =>
                      this.normalizeText(item)
                  )
                  .join("|");

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          output.push(value);
        }
      );

    return output;
  },

  /* =====================================================
     COGNITIVE CONTRACT INVARIANTS
  ===================================================== */

  validateCognitiveRuntimeState(
    summary = {}
  ) {
    const errors = [];
    const warnings = [];

    const evidenceAvailable =
      Boolean(
        summary.evidencePacket ||
        summary.perceptionPacket
          ?.evidencePacket
      );

    const cognitiveResultAvailable =
      Boolean(
        summary.cognitiveReasoningResult ||
        summary.deliberationPacket
          ?.cognitiveReasoningResult
      );

    const semanticValidationAccepted =
      summary.semanticFrameValidation
        ?.accepted ===
        true ||
      summary.deliberationPacket
        ?.semanticFrameValidation
        ?.accepted ===
        true;

    const validatedFrameAvailable =
      Boolean(
        summary.validatedSemanticFrame ||
        summary.deliberationPacket
          ?.validatedSemanticFrame
      );

    const responsePlanAvailable =
      Boolean(
        summary.responsePlan ||
        summary.deliberationPacket
          ?.responsePlan
      );

    const cognitiveContractsObserved =
      evidenceAvailable ||
      cognitiveResultAvailable ||
      summary.evidenceBuilderRan ===
        true ||
      summary.semanticValidationStageRan ===
        true ||
      summary.semanticFrameValidatorRan ===
        true;

    const explicitlyEnforced =
      summary.enforceCognitiveContracts ===
        true ||
      summary.appContext
        ?.enforceCognitiveContracts ===
        true;

    const enforced =
      explicitlyEnforced ||
      cognitiveContractsObserved;

    if (
      enforced &&
      summary.perceptionPipelineRan ===
        true &&
      !evidenceAvailable
    ) {
      errors.push(
        "perception_ran_without_evidence_packet"
      );
    }

    if (
      enforced &&
      summary.deliberationPipelineRan ===
        true &&
      !cognitiveResultAvailable
    ) {
      errors.push(
        "deliberation_ran_without_cognitive_reasoning_result"
      );
    }

    if (
      enforced &&
      responsePlanAvailable &&
      (
        !semanticValidationAccepted ||
        !validatedFrameAvailable
      )
    ) {
      errors.push(
        "response_plan_created_without_accepted_validated_semantic_frame"
      );
    }

    if (
      summary.semanticFrame &&
      !cognitiveResultAvailable
    ) {
      warnings.push(
        "semantic_frame_present_without_cognitive_reasoning_result"
      );
    }

    if (!enforced) {
      warnings.push(
        "cognitive_contracts_not_yet_observed"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      ready:
        enforced &&
        errors.length ===
          0 &&
        evidenceAvailable &&
        cognitiveResultAvailable &&
        semanticValidationAccepted &&
        validatedFrameAvailable,

      enforced,

      migrationPending:
        !enforced,

      errors,
      warnings,

      checks: {
        evidenceAvailable,
        cognitiveResultAvailable,
        semanticValidationAccepted,
        validatedFrameAvailable,
        responsePlanAvailable,
        cognitiveContractsObserved,
        explicitlyEnforced
      },

      authority:
        "cross_layer_runtime_invariant_validation_only"
    };
  },

  /* =====================================================
     DEBUGGING
  ===================================================== */

  debugLog(
    summary = {}
  ) {
    console.log(
      "===== ARI REBIRTH PIPELINE =====",
      this.version
    );

    console.log(
      "===== CANONICAL TURN =====",
      summary.turn
    );

    console.log(
      "===== CONVERSATION OPERATING STATE =====",
      {
        began:
          summary.conversationOperatingStateRan ===
          true,

        ready:
          summary.conversationOperatingStateReady ===
          true,

        completed:
          summary.conversationOperatingStateCompleted ===
          true,

        source:
          summary.conversationOperatingStateSource ||
          summary.conversationOperatingStateCompletionSource ||
          null,

        error:
          summary.conversationOperatingStateError ||
          summary.conversationOperatingStateCompletionError ||
          null
      }
    );

    console.log(
      "===== PIPELINE LIFECYCLE =====",
      summary.pipelineLifecycle
    );

    console.log(
      "===== PIPELINE LAYER RESULTS =====",
      summary.pipelineLayerResults
    );

    console.log(
      "===== PERCEPTION PACKET =====",
      summary.perceptionPacket ||
      null
    );

    console.log(
      "===== EVIDENCE BUILDER =====",
      {
        ran:
          summary.evidenceBuilderRan ===
          true,

        ready:
          summary.evidenceBuilderReady ===
          true,

        source:
          summary.evidenceBuilderSource ||
          null,

        version:
          summary.evidenceBuilderVersion ||
          null,

        validation:
          summary.evidenceBuilderValidation ||
          null
      }
    );

    console.log(
      "===== EVIDENCE PACKET =====",
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null
    );

    console.log(
      "===== EXECUTIVE PACKET =====",
      summary.executivePacket ||
      null
    );

    console.log(
      "===== DELIBERATION PACKET =====",
      summary.deliberationPacket ||
      null
    );

    console.log(
      "===== COGNITIVE REASONING RESULT =====",
      summary.cognitiveReasoningResult ||
      summary.deliberationPacket
        ?.cognitiveReasoningResult ||
      null
    );

    console.log(
      "===== VALIDATED SEMANTIC FRAME =====",
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.validatedSemanticFrame ||
      null
    );

    console.log(
      "===== SEMANTIC FRAME VALIDATION =====",
      summary.semanticFrameValidation ||
      summary.deliberationPacket
        ?.semanticFrameValidation ||
      null
    );

    console.log(
      "===== COGNITIVE RUNTIME INVARIANTS =====",
      summary.cognitiveRuntimeValidation ||
      null
    );

    console.log(
      "===== RESPONSE REALIZATION =====",
      {
        stageRan:
          summary.responseRealizationStageRan ===
          true,

        ready:
          summary.realizationReady ===
          true,

        usable:
          summary.realizationUsable ===
          true,

        complete:
          summary.realizationComplete ===
          true,

        mode:
          summary.realizationMode ||
          null,

        source:
          summary.responseRealizationSource ||
          summary.realizationPacket?.source ||
          null,

        responseText:
          summary.realizationResponseText ||
          summary.realizationPacket?.responseText ||
          null,

        suggestedEmoji:
          summary.realizationSuggestedEmoji ||
          summary.realizationPacket?.suggestedEmoji ||
          null
      }
    );

    console.log(
      "===== EXPRESSION PACKET =====",
      summary.expressionPacket ||
      null
    );

    console.log(
      "===== FINAL COMPOSITION =====",
      {
        stageRan:
          summary.finalCompositionStageRan ===
          true,

        realizationReady:
          summary.realizationReady ===
          true,

        realizationUsable:
          summary.realizationUsable ===
          true,

        finalResponseUsable:
          summary.finalResponseUsable ===
          true,

        finalResponseAuthorized:
          summary.finalResponseAuthorized ===
          true,

        source:
          summary.finalResponseSource ||
          summary.finalCompositionStageSource ||
          null,

        failureReason:
          summary.finalResponseFailureReason ||
          null
      }
    );

    console.log(
      "===== DELIVERY PACKET =====",
      summary.deliveryPacket ||
      null
    );

    console.log(
      "===== CANONICAL DELIVERY RESULT =====",
      summary.deliveryResult ||
      null
    );

    console.log(
      "===== PIPELINE ERRORS =====",
      {
        lifecycle:
          summary.pipelineLifecycleErrors ||
          [],

        warnings:
          summary.pipelineLifecycleWarnings ||
          []
      }
    );

    console.log(
      "===== FINAL PERSISTENCE =====",
      {
        ran:
          summary.finalPersistenceRan ===
          true,

        source:
          summary.finalPersistenceSource ||
          null,

        reason:
          summary.finalPersistenceReason ||
          null
      }
    );
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canNormalizeRuntimeRequest:
        true,

      canClearPriorTurnOutputs:
        true,

      canPreserveCanonicalCurrentTurn:
        true,

      canBeginConversationOperatingState:
        true,

      canCompleteConversationOperatingState:
        true,

      canPreserveExternalEvidence:
        true,

      canCoordinateDeveloperRuntime:
        true,

      canProjectRuntimeContracts:
        true,

      canExecutePerceptionLayer:
        true,

      canExecuteExecutiveRoutingLayer:
        true,

      canExecuteDeliberationLayer:
        true,

      canExecuteExpressionLayer:
        true,

      canExecuteDeliveryLayer:
        true,

      canEnforceLayerOrder:
        true,

      canRecordLifecycleFailures:
        true,

      canNormalizeAuthoritativeDelivery:
        true,

      canPreserveEvidencePacket:
        true,

      canPreserveCognitiveReasoningResult:
        true,

      canPreserveValidatedSemanticFrame:
        true,

      canRequireSemanticValidationBeforePlanning:
        true,

      canBuildEvidencePacketDirectly:
        false,

      canInvokeEvidenceBuilderDirectly:
        false,

      canInvokeCognitiveReasoningDirectly:
        false,

      canConstructSemanticFrameDirectly:
        false,

      canInvokeSemanticFrameValidatorDirectly:
        false,

      canValidateSemanticFrameDirectly:
        false,

      canRepairRejectedSemanticFrame:
        false,

      canSelectSemanticOperation:
        false,

      canGenerateResponseStrategy:
        false,

      canSaveApplicationConversationHistory:
        false,

      canLoadPersistedThreadContextDirectly:
        false,

      canNormalizeStoredTurnsDirectly:
        false,

      canBuildThreadContextDirectly:
        false,

      canBuildReferenceCandidatesDirectly:
        false,

      canPersistThreadStateDirectly:
        false,

      canClassifyConversation:
        false,

      canInterpretSemanticMeaning:
        false,

      canChooseConversationFunction:
        false,

      canChoosePrimaryRoute:
        false,

      canDetermineSafetySeverity:
        false,

      canCreateResponsePlan:
        false,

      canModifyResponsePlan:
        false,

      canExecuteExpressionStagesDirectly:
        false,

      canGenerateResponseRealizationDirectly:
        false,

      canComposeFinalResponse:
        false,

      canSelectFinalResponse:
        false,

      canRewriteFinalResponse:
        false,

      canInferFinalResponseFromIntermediateFields:
        false,

      canUseIntermediateOutputAsDeliveryFallback:
        false,

      canOverrideDeliveryResult:
        false,

      canExecuteApplicationWrites:
        false,

      canAccessSupabaseDirectly:
        false,

      canRetrieveLongTermUserMemory:
        false,

      canStoreLongTermUserMemory:
        false,

      role:
        "canonical_five_layer_runtime_with_openai_cognitive_authority_and_cos_delegation"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canBuildEvidencePacketDirectly",
      "canInvokeEvidenceBuilderDirectly",
      "canInvokeCognitiveReasoningDirectly",
      "canConstructSemanticFrameDirectly",
      "canInvokeSemanticFrameValidatorDirectly",
      "canValidateSemanticFrameDirectly",
      "canRepairRejectedSemanticFrame",
      "canSelectSemanticOperation",
      "canGenerateResponseStrategy",
      "canSaveApplicationConversationHistory",
      "canLoadPersistedThreadContextDirectly",
      "canNormalizeStoredTurnsDirectly",
      "canBuildThreadContextDirectly",
      "canBuildReferenceCandidatesDirectly",
      "canPersistThreadStateDirectly",
      "canClassifyConversation",
      "canInterpretSemanticMeaning",
      "canChooseConversationFunction",
      "canChoosePrimaryRoute",
      "canDetermineSafetySeverity",
      "canCreateResponsePlan",
      "canModifyResponsePlan",
      "canExecuteExpressionStagesDirectly",
      "canGenerateResponseRealizationDirectly",
      "canComposeFinalResponse",
      "canSelectFinalResponse",
      "canRewriteFinalResponse",
      "canInferFinalResponseFromIntermediateFields",
      "canUseIntermediateOutputAsDeliveryFallback",
      "canOverrideDeliveryResult",
      "canExecuteApplicationWrites",
      "canAccessSupabaseDirectly",
      "canRetrieveLongTermUserMemory",
      "canStoreLongTermUserMemory"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] === true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const requiredComponents = [
      [
        "AriConversationOperatingState",

        this.getConversationOperatingState(),

        component =>
          typeof component?.beginTurn ===
            "function" &&
          typeof component?.completeTurn ===
            "function"
      ],

      [
        "AriOperationRegistry",

        (
          window.AriOperationRegistry ||
          window.Ari?.operationRegistry ||
          null
        ),

        component =>
          typeof component?.normalizeOperation ===
            "function" &&
          typeof component?.getOperation ===
            "function" &&
          typeof component?.hasOperation ===
            "function"
      ],

      [
        "AriEvidenceBuilder",

        (
          window.AriEvidenceBuilder ||
          window.Ari?.evidenceBuilder ||
          null
        ),

        component =>
          typeof component?.build ===
            "function" &&
          typeof component?.validateEvidencePacket ===
            "function"
      ],

      [
        "AriSemanticFrameValidator",

        (
          window.AriSemanticFrameValidator ||
          window.Ari?.semanticFrameValidator ||
          null
        ),

        component =>
          typeof component?.validate ===
            "function" &&
          typeof component?.buildCompatibilityProjection ===
            "function"
      ],

      [
        "AriPerceptionPipeline",

        window.AriPerceptionPipeline,

        component =>
          typeof component?.run ===
          "function"
      ],

      [
        "AriExecutiveRoutingPipeline",

        window.AriExecutiveRoutingPipeline,

        component =>
          typeof component?.run ===
          "function"
      ],

      [
        "AriDeliberationPipeline",

        window.AriDeliberationPipeline,

        component =>
          typeof component?.run ===
          "function"
      ],

      [
        "AriExpressionPipeline",

        window.AriExpressionPipeline,

        component =>
          typeof component?.run ===
          "function"
      ],

      [
        "AriDeliveryPipeline",

        window.AriDeliveryPipeline,

        component =>
          typeof component?.run ===
          "function"
      ]
    ];

    const warnings =
      requiredComponents
        .filter(
          ([
            _name,
            component,
            validator
          ]) =>
            !component ||
            validator(component) !==
              true
        )
        .map(
          ([name]) =>
            `${name}_not_loaded`
        );

    return {
      valid:
        errors.length === 0,

      ready:
        errors.length === 0 &&
        warnings.length === 0,

      source:
        "ari-rebirth-pipeline-validation",

      version:
        this.version,

      errors,

      warnings:
        this.uniqueValues(warnings),

      checks: {
        canonicalTurnPreserved:
          true,

        priorTurnOutputsCleared:
          authority.canClearPriorTurnOutputs ===
          true,

        conversationOperatingStateDelegation:
          authority.canBeginConversationOperatingState ===
            true &&
          authority.canCompleteConversationOperatingState ===
            true,

        operationRegistryDelegated:
          authority.canSelectSemanticOperation ===
          false,

        evidenceBuildingDelegated:
          authority.canBuildEvidencePacketDirectly ===
            false &&
          authority.canInvokeEvidenceBuilderDirectly ===
            false,

        cognitiveReasoningDelegated:
          authority.canInvokeCognitiveReasoningDirectly ===
          false,

        semanticFrameConstructionDelegated:
          authority.canConstructSemanticFrameDirectly ===
          false,

        semanticValidationDelegated:
          authority.canInvokeSemanticFrameValidatorDirectly ===
            false &&
          authority.canValidateSemanticFrameDirectly ===
            false,

        rejectedFrameRepairDisabled:
          authority.canRepairRejectedSemanticFrame ===
          false,

        responseStrategyGenerationDisabled:
          authority.canGenerateResponseStrategy ===
          false,

        semanticValidationRequiredBeforePlanning:
          authority.canRequireSemanticValidationBeforePlanning ===
          true,

        directThreadLoadingDisabled:
          authority.canLoadPersistedThreadContextDirectly ===
          false,

        directThreadNormalizationDisabled:
          authority.canNormalizeStoredTurnsDirectly ===
          false,

        directReferenceCandidateBuildingDisabled:
          authority.canBuildReferenceCandidatesDirectly ===
          false,

        directThreadPersistenceDisabled:
          authority.canPersistThreadStateDirectly ===
          false,

        fiveLayerOrderEnforced:
          authority.canEnforceLayerOrder ===
          true,

        layerExecutionSinglePass:
          true,

        expressionInternalsRemainDelegated:
          authority.canExecuteExpressionStagesDirectly ===
          false,

        directResponseRealizationDisabled:
          authority.canGenerateResponseRealizationDirectly ===
          false,

        responseCompositionDisabled:
          authority.canComposeFinalResponse ===
          false,

        responseSelectionDisabled:
          authority.canSelectFinalResponse ===
          false,

        responseRewritingDisabled:
          authority.canRewriteFinalResponse ===
          false,

        dedicatedDeliveryResultRequired:
          true,

        intermediateDeliveryFallbackDisabled:
          authority.canUseIntermediateOutputAsDeliveryFallback ===
          false,

        deliveryOverrideDisabled:
          authority.canOverrideDeliveryResult ===
          false,

        applicationHistoryWriteDisabled:
          authority.canSaveApplicationConversationHistory ===
          false,

        directApplicationWritesDisabled:
          authority.canExecuteApplicationWrites ===
          false,

        directSupabaseAccessDisabled:
          authority.canAccessSupabaseDirectly ===
          false
      }
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  toArray(
    value
  ) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
          item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen = new Set();

    values
      .flatMap(
        value =>
          this.toArray(value)
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this.normalizeText(value)
              : this.normalizeText(
                  value?.id ||
                  value?.name ||
                  value?.type ||
                  value?.value ||
                  value?.claim ||
                  this.safeJSONStringify(value)
                );

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          output.push(value);
        }
      );

    return output;
  },

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen = new Set();

    this.toArray(values)
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? value
              : this.safeJSONStringify(
                  value
                );

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          output.push(value);
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen = new WeakSet();

    try {
      return JSON.stringify(
        value,

        (
          _key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(nestedValue)
            ) {
              return "[Circular]";
            }

            seen.add(nestedValue);
          }

          return nestedValue;
        }
      );
    } catch {
      return "";
    }
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  normalizeText(
    value = ""
  ) {
    return this.cleanText(value)
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  }
};

window.Ari.rebirthPipeline =
  window.AriRebirthPipeline;

const ariRebirthPipelineValidation =
  window.AriRebirthPipeline
    ?.validate?.();

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline
    ?.version,

  ariRebirthPipelineValidation
    ?.ready ===
    true
    ? "READY"
    : ariRebirthPipelineValidation
        ?.valid ===
        true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariRebirthPipelineValidation
);
