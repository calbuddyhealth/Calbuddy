// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
//
// Purpose:
// Execute Ari's canonical five-layer runtime exactly once and produce one
// authoritative Delivery result for the application boundary.
//
// V7.7.0 — Runtime Completion Authority / Persistence Isolation
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
//   Semantic Frame Normalization
//   Advisory Semantic Validation Audit
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
  version: "7.7.0",
  schemaVersion: "7.7.0",
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

conversationOperatingStateUsable:
  false,

conversationOperatingStateDegraded:
  false,

conversationOperatingStateMode:
  "unavailable",

conversationOperatingStateCompleted:
  false,

conversationOperatingStatePersisted:
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
  summary.conversationOperatingStateUsable !==
  true
) {
  summary = {
    ...summary,

    pipelineStopped:
      true,

    pipelineStopReason:
      summary.conversationOperatingStateError ||
      "conversation_operating_state_unusable",

    pipelineStopLayer:
      "initialization"
  };
} else if (
  summary.conversationOperatingStateDegraded ===
  true
) {
  summary = {
    ...summary,

    pipelineLifecycleWarnings:
      this.appendUniqueError(
        summary.pipelineLifecycleWarnings,

        this.buildLayerError({
          layer:
            "conversationOperatingState",

          type:
            "conversation_operating_state_degraded",

          message:
            summary.conversationOperatingStateError ||
            "Conversation Operating State continued using a degraded current-turn projection.",

          fatal:
            false
        })
      )
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

  deliberationDebug:
  true,

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

        continue;
      }

      /*
       * The authoritative conversation relationship and
       * reference-resolution engines run after Perception
       * and before Executive Routing.
       */
      if (
        layer.name ===
        "perception"
      ) {
        mark(
          "before conversation context authorities"
        );

        summary =
          await this.runConversationContextAuthorities(
            summary
          );

        mark(
          "after conversation context authorities"
        );

        if (
          summary.conversationContextAuthoritiesReady !==
          true
        ) {
          summary = {
            ...summary,

            pipelineStopped:
              true,

            pipelineStopReason:
              summary
                .conversationContextAuthoritiesError ||
              "conversation_context_authorities_not_ready",

            pipelineStopLayer:
              "conversationContext"
          };
        }
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

const authoritativeDeliveryReady =
  deliveryResult.available === true &&
  deliveryResult.ready === true &&
  deliveryResult.authoritative === true &&
  Boolean(deliveryResult.reply);

const runtimeExecutionReady =
  summary.pipelineLifecycleComplete === true &&
  authoritativeDeliveryReady === true &&
  summary.pipelineStopped !== true;

summary = {
  ...summary,

  deliveryResult,

  deliveryComplete:
    authoritativeDeliveryReady,

  pipelineOutputReady:
    authoritativeDeliveryReady,

  authoritativeDeliveryReady,

  runtimeExecutionReady,

  runtimeExecutionComplete:
    runtimeExecutionReady,

  runtimeExecutionStatus:
    runtimeExecutionReady
      ? "delivered"
      : (
          summary.pipelineStopped === true
            ? "runtime_stopped"
            : "delivery_unavailable"
        ),

  /*
   * This value must be established before Conversation
   * Operating State and Conversation Meaning History inspect
   * the completed runtime.
   *
   * Persistence must not determine whether the five-layer
   * runtime successfully produced an authoritative reply.
   */
  rebirthPipelineReady:
    runtimeExecutionReady
};

/*
 * Temporary compatibility projection.
 * Remove after the App Bridge and all downstream readers
 * consume deliveryResult.reply directly.
 */
if (
  authoritativeDeliveryReady &&
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

const finalRuntimeExecutionReady =
  summary.runtimeExecutionReady === true ||
  (
    summary.pipelineLifecycleComplete === true &&
    summary.deliveryResult?.available === true &&
    summary.deliveryResult?.ready === true &&
    summary.deliveryResult?.authoritative === true &&
    Boolean(
      summary.deliveryResult?.reply
    ) &&
    summary.pipelineStopped !== true
  );

const turnCompletionReady =
  summary.conversationOperatingStateCompleted ===
  true;

const turnPersistenceReady =
  summary.conversationOperatingStatePersisted ===
  true;

const runtimeTurnFinalized =
  finalRuntimeExecutionReady &&
  turnCompletionReady;

const runtimeOutcome =
  finalRuntimeExecutionReady
    ? (
        turnPersistenceReady
          ? "delivered_and_persisted"
          : turnCompletionReady
            ? "delivered_without_persistence"
            : "delivered_turn_completion_incomplete"
      )
    : (
        summary.pipelineStopped === true
          ? "runtime_failed"
          : "delivery_unavailable"
      );

summary = {
  ...summary,

  activeRuntimeLayer:
    "complete",

  rebirthPipelineRan:
    true,

  /*
   * Runtime readiness belongs to the five-layer execution
   * and authoritative Delivery boundary. Persistence does
   * not determine whether the response was successfully
   * generated and delivered.
   */
  rebirthPipelineReady:
    finalRuntimeExecutionReady,

  runtimeExecutionReady:
    finalRuntimeExecutionReady,

  runtimeExecutionComplete:
    finalRuntimeExecutionReady,

  authoritativeDeliveryReady:
    summary.deliveryResult?.available ===
      true &&
    summary.deliveryResult?.ready ===
      true &&
    summary.deliveryResult?.authoritative ===
      true &&
    Boolean(
      summary.deliveryResult?.reply
    ),

    turnCompletionReady,

  turnPersistenceReady,

  runtimeTurnFinalized,

  runtimeOutcome,

  ok:
    finalRuntimeExecutionReady,

  success:
    finalRuntimeExecutionReady,

  complete:
    finalRuntimeExecutionReady,

  ready:
    finalRuntimeExecutionReady,

  status:
    runtimeOutcome,

  deliveryStatus:
    summary.deliveryResult?.status ||
    (
      finalRuntimeExecutionReady
        ? "delivered"
        : "delivery_unavailable"
    ),

  rebirthPipelineSource:
    this.source,

  rebirthPipelineVersion:
    this.version,

  rebirthPipelineSchemaVersion:
    this.schemaVersion,

  pipelineArchitecture:
    "canonical-five-layer-openai-cognitive-authority-with-evidence-and-advisory-semantic-validation",

  pipelineAuthority:
    this.getAuthorityBoundaries()
};

this.debugLog(
  summary
);

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

      turnClassificationPacket:
        null,

      conversationRelationship:
        null,

      conversationRelationshipConfidence:
        0,

      conversationRelationshipEngineRan:
        false,

      conversationRelationshipEngineReady:
        false,

      conversationRelationshipEngineSource:
        null,

      conversationRelationshipEngineVersion:
        null,

      referencePacket:
        null,

      referenceResolution:
        null,

      resolvedReferences:
        [],

      unresolvedReferences:
        [],

      activeReference:
        null,

      resolvedSemanticStructure:
        null,

      conversationContext:
        null,

      compactConversationContext:
        null,

      referenceResolutionEngineRan:
        false,

      referenceResolutionEngineReady:
        false,

      referenceResolutionEngineSource:
        null,

      referenceResolutionEngineVersion:
        null,

      conversationContextAttachmentRan:
        false,

      conversationContextAttachmentReady:
        false,

      conversationContextAttachmentError:
        null,

      conversationContextAuthoritiesRan:
        false,

      conversationContextAuthoritiesReady:
        false,

      conversationContextAuthoritiesError:
        null,

deliberationDebugTrace:
  null,

deliberationDiagnostics:
  null,

deliberationHealthy:
  false,

deliberationWarnings:
  [],

deliberationStageErrors:
  [],

deliberationPipelineRan:
  false,

deliberationPipelineReady:
  false,

deliberationPipelineError:
  null,

deliberationPipelineSource:
  null,

deliberationPipelineVersion:
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

      conversationOperatingStateRan:
        false,

      conversationOperatingStateReady:
        false,

      conversationOperatingStateUsable:
        false,

      conversationOperatingStateDegraded:
        false,

      conversationOperatingStateMode:
        "unavailable",

      conversationOperatingStateSource:
        null,

      conversationOperatingStateVersion:
        null,

      conversationOperatingStateError:
        null,

      conversationOperatingStateErrors:
        [],

      conversationOperatingStateWarnings:
        [],

      conversationOperatingStateBeginResult:
        null,

      conversationOperatingStateCompleted:
        false,

      conversationOperatingStatePersisted:
        false,

      conversationOperatingStateCompletionReason:
        null,

      conversationOperatingStateCompletionSource:
        null,

      conversationOperatingStateCompletionVersion:
        null,

      conversationOperatingStateCompletionError:
        null,

      conversationOperatingStateCompleteResult:
        null,
runtimeExecutionReady:
  false,

runtimeExecutionComplete:
  false,

runtimeExecutionStatus:
  null,

authoritativeDeliveryReady:
  false,

turnCompletionReady:
  false,

turnPersistenceReady:
  false,

runtimeTurnFinalized:
  false,

runtimeOutcome:
  null,

ok:
  false,

success:
  false,

complete:
  false,

ready:
  false,

status:
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

      conversationOperatingStateUsable:
        false,

      conversationOperatingStateDegraded:
        false,

      conversationOperatingStateMode:
        "unavailable",

      conversationOperatingStateSource:
        "not-loaded",

      conversationOperatingStateError:
        error.message,

      conversationOperatingStateErrors: [
        error.message
      ],

      conversationOperatingStateWarnings:
        [],

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
      result
        .conversationOperatingStateReady ===
      true;

    const usable =
      result
        .conversationOperatingStateUsable ===
        true ||
      Boolean(
        result
          .conversationOperatingState
          ?.currentTurn
          ?.effectiveText ||
        result
          .conversationOperatingState
          ?.currentTurn
          ?.originalText ||
        result.currentTurn
          ?.effectiveText ||
        result.currentTurn
          ?.originalText ||
        result.effectiveUserMessage ||
        result.userMessage
      );

    const degraded =
      result
        .conversationOperatingStateDegraded ===
        true ||
      result
        .conversationOperatingState
        ?.degraded ===
        true;

    return {
      ...summary,
      ...result,

      conversationOperatingStateRan:
        true,

      conversationOperatingStateReady:
        ready,

      conversationOperatingStateUsable:
        usable,

      conversationOperatingStateDegraded:
        degraded,

      conversationOperatingStateMode:
        result
          .conversationOperatingStateMode ||
        (
          degraded
            ? "degraded_current_turn"
            : ready
              ? "authoritative"
              : "unavailable"
        ),

      conversationOperatingStateSource:
        result
          .conversationOperatingStateSource ||
        result.source ||
        operatingState.source ||
        "ari-conversation-operating-state",

      conversationOperatingStateVersion:
        result
          .conversationOperatingStateVersion ||
        result.version ||
        operatingState.version ||
        null,

      conversationOperatingStateError:
        result
          .conversationOperatingStateError ||
        null,

      conversationOperatingStateErrors:
        this.toArray(
          result
            .conversationOperatingStateErrors
        ),

      conversationOperatingStateWarnings:
        this.toArray(
          result
            .conversationOperatingStateWarnings
        ),

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

      conversationOperatingStateUsable:
        false,

      conversationOperatingStateDegraded:
        false,

      conversationOperatingStateMode:
        "execution_failed",

      conversationOperatingStateSource:
        operatingState.source ||
        "ari-conversation-operating-state",

      conversationOperatingStateVersion:
        operatingState.version ||
        null,

      conversationOperatingStateError:
        lifecycleError.message,

      conversationOperatingStateErrors: [
        lifecycleError.message
      ],

      conversationOperatingStateWarnings:
        [],

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

  const runtimeExecutionReady =
    summary.runtimeExecutionReady ===
      true ||
    (
      summary.pipelineLifecycleComplete ===
        true &&
      delivery.available ===
        true &&
      delivery.ready ===
        true &&
      delivery.authoritative ===
        true &&
      Boolean(delivery.reply) &&
      summary.pipelineStopped !==
        true
    );

  if (
  delivery.available !== true ||
  !delivery.reply
) {
  return {
    ...summary,

    runtimeExecutionReady,

    runtimeExecutionComplete:
      runtimeExecutionReady,

    rebirthPipelineReady:
      runtimeExecutionReady,

    authoritativeDeliveryReady:
      false,

    conversationOperatingStateCompleted:
      false,

    conversationOperatingStateCompletionReason:
      "authoritative_delivery_unavailable",

    finalPersistenceRan:
      false,

    finalPersistenceReason:
      "authoritative_delivery_unavailable",

    turnPersistenceReady:
      false
  };
}

if (
  summary.conversationOperatingStateCompleted ===
  true
) {
  const persisted =
    summary.conversationOperatingStatePersisted ===
      true ||
    summary.threadStatePersisted ===
      true ||
    summary.threadPersistenceResult?.saved ===
      true ||
    summary.persistenceResult?.saved ===
      true;

  return {
    ...summary,

    runtimeExecutionReady,

    runtimeExecutionComplete:
      runtimeExecutionReady,

    rebirthPipelineReady:
      runtimeExecutionReady,

    turnCompletionReady:
      true,

    turnPersistenceReady:
      persisted,

    conversationOperatingStatePersisted:
      persisted
  };
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
        "conversation_operating_state_not_available",

      turnPersistenceReady:
        false,

      /*
       * Preserve runtime authority even when persistence
       * infrastructure is unavailable.
       */
      runtimeExecutionReady,

      rebirthPipelineReady:
        runtimeExecutionReady
    };
  }

  try {
    /*
     * Explicitly provide the completed runtime state to
     * Conversation Operating State.
     */
    const completionInput = {
      ...summary,

      runtimeExecutionReady,

      runtimeExecutionComplete:
        runtimeExecutionReady,

      authoritativeDeliveryReady:
        delivery.available ===
          true &&
        delivery.ready ===
          true &&
        delivery.authoritative ===
          true &&
        Boolean(delivery.reply),

      rebirthPipelineReady:
        runtimeExecutionReady
    };

    const result =
      await operatingState.completeTurn(
        completionInput
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

    const completed =
  result
    .conversationOperatingStateCompleted ===
  true;

const persisted =
  result
    .conversationOperatingStatePersisted ===
  true ||
  result.threadStatePersisted ===
  true ||
  result.threadPersistenceResult
    ?.saved ===
  true ||
  result.persistenceResult
    ?.saved ===
  true;

    /*
     * Only project fields owned by Conversation Operating
     * State. Do not spread the entire result into the master
     * runtime summary.
     */
    const persistenceProjection = {
      threadState:
        result.threadState ??
        summary.threadState,

      conversationState:
        result.conversationState ??
        summary.conversationState,

      conversationContext:
        result.conversationContext ??
        summary.conversationContext,

      compactConversationContext:
        result.compactConversationContext ??
        summary.compactConversationContext,

      conversationHistory:
        result.conversationHistory ??
        summary.conversationHistory,

      conversationHistoryResult:
        result.conversationHistoryResult ??
        summary.conversationHistoryResult,

      conversationMeaningHistory:
        result.conversationMeaningHistory ??
        summary.conversationMeaningHistory,

      conversationMeaningHistoryResult:
        result.conversationMeaningHistoryResult ??
        summary.conversationMeaningHistoryResult,

      conversationMeaningHistoryReady:
        result.conversationMeaningHistoryReady ??
        summary.conversationMeaningHistoryReady,

      conversationMeaningHistoryPersisted:
        result.conversationMeaningHistoryPersisted ??
        summary.conversationMeaningHistoryPersisted,

      conversationMeaningHistoryError:
        result.conversationMeaningHistoryError ??
        summary.conversationMeaningHistoryError,

      threadPersistenceResult:
        result.threadPersistenceResult ??
        summary.threadPersistenceResult,

      persistenceResult:
        result.persistenceResult ??
        summary.persistenceResult,

      persistedTurn:
        result.persistedTurn ??
        summary.persistedTurn,

      persistedTurnId:
        result.persistedTurnId ??
        summary.persistedTurnId,

      latestCompletedTurn:
        result.latestCompletedTurn ??
        summary.latestCompletedTurn
    };

    return {
      ...summary,
      ...persistenceProjection,

      /*
       * Master runtime authority remains preserved.
       */
      deliveryResult:
        summary.deliveryResult,

      finalResponse:
        summary.finalResponse,

      pipelineLifecycle:
        summary.pipelineLifecycle,

      pipelineLifecycleComplete:
        summary.pipelineLifecycleComplete,

      pipelineStopped:
        summary.pipelineStopped,

      pipelineStopReason:
        summary.pipelineStopReason,

      pipelineStopLayer:
        summary.pipelineStopLayer,

      runtimeExecutionReady,

      runtimeExecutionComplete:
        runtimeExecutionReady,

      rebirthPipelineReady:
        runtimeExecutionReady,

            conversationOperatingStateCompleted:
        completed,

      conversationOperatingStatePersisted:
        persisted,

      conversationOperatingStateCompletionReason:
        result.conversationOperatingStateCompletionReason ||
        (
          completed
            ? (
                persisted
                  ? "completed_and_persisted"
                  : "completed_without_persistence"
              )
            : "conversation_operating_state_reported_incomplete"
        ),

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
        result.finalPersistenceRan ===
          true ||
        result.persistenceRan ===
          true ||
        result.threadSaveRan ===
          true,

      finalPersistenceSource:
        result.finalPersistenceSource ||
        result.persistenceSource ||
        result.conversationOperatingStateSource ||
        operatingState.source ||
        "ari-conversation-operating-state",

      finalPersistenceReason:
        persisted
          ? null
          : (
              result.finalPersistenceReason ||
              result
                .conversationOperatingStateCompletionError ||
              result
                .conversationOperatingStateCompletionReason ||
              "persistence_not_completed"
            ),

      turnCompletionReady:
        completed,

      turnPersistenceReady:
        persisted
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

  runtimeExecutionReady,

  runtimeExecutionComplete:
    runtimeExecutionReady,

  rebirthPipelineReady:
    runtimeExecutionReady,

  conversationOperatingStateCompleted:
    false,

  conversationOperatingStatePersisted:
    false,

  conversationOperatingStateCompletionReason:
    "conversation_operating_state_complete_turn_failed",

  conversationOperatingStateCompletionError:
    lifecycleError.message,

  finalPersistenceRan:
    false,

  finalPersistenceReason:
    lifecycleError.type,

  turnCompletionReady:
    false,

  turnPersistenceReady:
    false,

  pipelineLifecycleWarnings:
    this.appendUniqueError(
      summary.pipelineLifecycleWarnings,
      lifecycleError
    )
};
}

},
  /* =====================================================
     CONVERSATION CONTEXT AUTHORITIES
  ===================================================== */

  getConversationRelationshipEngine() {
    return (
      window.AriConversationRelationshipEngine ||
      window.Ari?.conversationRelationshipEngine ||
      null
    );
  },

  getReferenceResolutionEngine() {
    return (
      window.AriEntityReferenceResolver ||
      window.AriReferenceResolutionEngine ||
      window.Ari?.entityReferenceResolver ||
      window.Ari?.referenceResolutionEngine ||
      null
    );
  },

    async runConversationContextAuthorities(
    summary = {}
  ) {
    const relationshipEngine =
      this.getConversationRelationshipEngine();

    if (!relationshipEngine) {
      return {
        ...summary,

        conversationRelationshipEngineRan:
          false,

        conversationRelationshipEngineReady:
          false,

        conversationContextAuthoritiesRan:
          false,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          "conversation_relationship_engine_not_loaded"
      };
    }

    /*
     * Compatibility projection:
     * The canonical runtime stores the current turn as `turn`.
     * The Conversation Relationship Engine currently reads
     * `turnPacket`.
     */
        const canonicalTurn =
      summary.turn &&
      typeof summary.turn ===
        "object"
        ? summary.turn
        : {};

    const existingTurnPacket =
      summary.turnPacket &&
      typeof summary.turnPacket ===
        "object"
        ? summary.turnPacket
        : {};

    const relationshipInputState = {
      ...summary,

      turnPacket: {
        ...canonicalTurn,
        ...existingTurnPacket,

        turnId:
          existingTurnPacket.turnId ||
          canonicalTurn.turnId ||
          summary.currentTurnId ||
          summary.turnId ||
          null,

        normalizedMessage:
          existingTurnPacket.normalizedMessage ||
          existingTurnPacket.normalizedText ||
          canonicalTurn.normalizedMessage ||
          canonicalTurn.normalizedText ||
          summary.normalizedMessage ||
          "",

        originalMessage:
          existingTurnPacket.originalMessage ||
          existingTurnPacket.originalText ||
          canonicalTurn.originalMessage ||
          canonicalTurn.originalText ||
          summary.originalUserMessage ||
          summary.userMessage ||
          "",

        currentMessage:
          existingTurnPacket.currentMessage ||
          existingTurnPacket.currentText ||
          canonicalTurn.currentMessage ||
          canonicalTurn.currentText ||
          summary.currentTurnText ||
          summary.userMessage ||
          "",

        effectiveMessage:
          existingTurnPacket.effectiveMessage ||
          existingTurnPacket.effectiveText ||
          canonicalTurn.effectiveMessage ||
          canonicalTurn.effectiveText ||
          summary.semanticInputText ||
          summary.currentTurnText ||
          summary.userMessage ||
          "",

        previousTurnAvailable:
          existingTurnPacket.previousTurnAvailable ===
            true ||
          canonicalTurn.previousTurnAvailable ===
            true ||
          summary.previousTurnAvailable ===
            true ||
          summary.threadContext
            ?.previousTurnAvailable ===
            true ||
          Boolean(
            summary.threadContext
              ?.previousTurn
          )
      }
    };

    const relationshipResult =
      await this.runEngine({
        engine:
          relationshipEngine,

        methods: [
          "run",
          "classify",
          "build"
        ],

        fallback: {
          conversationRelationshipEngineRan:
            false,

          conversationRelationshipEngineReady:
            false
        },

        inputState:
          relationshipInputState
      });

    let state = {
      ...summary,
      ...relationshipResult
    };

    const relationshipInvocationDiagnostic =
      relationshipResult
        .engineInvocationDiagnostic ||
      null;

    const relationshipInvocationSucceeded =
      relationshipInvocationDiagnostic
        ?.succeeded ===
      true;

    const relationshipStageDiagnostic =
      relationshipResult
        .diagnostics
        ?.conversationRelationship ||
      null;

        const relationshipErrors =
      this.toArray(
        relationshipResult.errors
      ).filter(
        error => {
          const value =
            typeof error ===
              "string"
              ? error
              : (
                  error?.type ||
                  error?.error ||
                  error?.message ||
                  ""
                );

          return (
            value.startsWith(
              "conversation_relationship_"
            ) ||
            value.startsWith(
              "turn_classification_packet_"
            )
          );
        }
      );

        const relationshipExecutionFailed =
      relationshipStageDiagnostic
        ?.complete ===
        false ||
      relationshipErrors.length >
        0;

    const turnClassificationPacket =
      relationshipResult
        .turnClassificationPacket ||
      relationshipResult.packet ||
      null;

    if (
      !relationshipInvocationSucceeded ||
            relationshipExecutionFailed ||
      !turnClassificationPacket
    ) {
      const relationshipFailureReason =
        relationshipInvocationSucceeded !==
        true
          ? (
              relationshipInvocationDiagnostic
                ?.failureType ||
              "conversation_relationship_engine_failed"
            )
          : (
              relationshipStageDiagnostic
                ?.error ||
              relationshipErrors[0] ||
              (
                !turnClassificationPacket
                  ? "turn_classification_packet_missing"
                  : "conversation_relationship_engine_not_ready"
              )
            );

      return {
        ...state,

        conversationRelationshipEngineRan:
          relationshipInvocationDiagnostic
            ?.attempted ===
          true,

        conversationRelationshipEngineReady:
          false,

        conversationRelationshipEngineSource:
          relationshipEngine.source ||
          "ari-conversation-relationship-engine",

        conversationRelationshipEngineVersion:
          relationshipEngine.version ||
          null,

        conversationRelationshipEngineError:
          relationshipFailureReason,

        conversationRelationshipEngineDiagnostic:
          {
            invocation:
              relationshipInvocationDiagnostic,

            stage:
              relationshipStageDiagnostic,

            errors:
              relationshipErrors
          },

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          relationshipFailureReason
      };
    }

    state = {
      ...state,

      turnClassificationPacket,

      conversationRelationship:
        turnClassificationPacket.relationship ||
        null,

      conversationRelationshipConfidence:
        Number(
          turnClassificationPacket.confidence ||
          0
        ),

      conversationRelationshipEngineRan:
        true,

      conversationRelationshipEngineReady:
        turnClassificationPacket
          ?.validation
          ?.valid !==
        false,

      conversationRelationshipEngineSource:
        relationshipEngine.source ||
        "ari-conversation-relationship-engine",

      conversationRelationshipEngineVersion:
        relationshipEngine.version ||
        null,

      conversationRelationshipEngineError:
        null,

      conversationRelationshipEngineDiagnostic:
        {
          invocation:
            relationshipInvocationDiagnostic,

          stage:
            relationshipStageDiagnostic,

          validation:
            turnClassificationPacket
              ?.validation ||
            null
        }
    };

    if (
      state
        .conversationRelationshipEngineReady !==
      true
    ) {
      const packetValidationError =
        turnClassificationPacket
          ?.validation
          ?.errors?.[0] ||
        "turn_classification_packet_invalid";

      return {
        ...state,

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          packetValidationError
      };
    }

    const referenceEngine =
      this.getReferenceResolutionEngine();

    if (!referenceEngine) {
      return {
        ...state,

        referenceResolutionEngineRan:
          false,

        referenceResolutionEngineReady:
          false,

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          "reference_resolution_engine_not_loaded"
      };
    }

    const referenceResult =
      await this.runEngine({
        engine:
          referenceEngine,

        methods: [
          "run",
          "resolve",
          "build"
        ],

        fallback: {
          referenceResolutionEngineRan:
            false,

          referenceResolutionEngineReady:
            false
        },

        inputState:
          state
      });

    state = {
      ...state,
      ...referenceResult
    };

    const referenceInvocationDiagnostic =
      referenceResult
        .engineInvocationDiagnostic ||
      null;

    const referenceInvocationSucceeded =
      referenceInvocationDiagnostic
        ?.succeeded ===
      true;

    const referenceErrors =
      this.toArray(
        referenceResult.errors
      );

    const referencePacket =
      referenceResult.referencePacket ||
      referenceResult.packet ||
      null;

    if (
      !referenceInvocationSucceeded ||
      referenceErrors.length >
        0 ||
      !referencePacket
    ) {
      const referenceFailureReason =
        referenceInvocationSucceeded !==
        true
          ? (
              referenceInvocationDiagnostic
                ?.failureType ||
              "reference_resolution_engine_failed"
            )
          : (
              referenceErrors[0] ||
              "reference_packet_missing"
            );

      return {
        ...state,

        referenceResolutionEngineRan:
          referenceInvocationDiagnostic
            ?.attempted ===
          true,

        referenceResolutionEngineReady:
          false,

        referenceResolutionEngineError:
          referenceFailureReason,

        referenceResolutionEngineDiagnostic:
          {
            invocation:
              referenceInvocationDiagnostic,

            errors:
              referenceErrors
          },

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          referenceFailureReason
      };
    }

    state = {
      ...state,

      referencePacket,

      referenceResolution:
        state.referenceResolution ||
        referenceResult
          .referenceResolution ||
        referenceResult.result ||
        null,

      resolvedSemanticStructure:
        state.resolvedSemanticStructure ||
        referenceResult
          .resolvedSemanticStructure ||
        state.currentSemanticStructure ||
        null,

      referenceResolutionEngineRan:
        true,

      referenceResolutionEngineReady:
        referencePacket
          ?.validation
          ?.valid !==
        false,

      referenceResolutionEngineSource:
        referenceEngine.source ||
        "ari-reference-resolution-engine",

      referenceResolutionEngineVersion:
        referenceEngine.version ||
        null,

      referenceResolutionEngineError:
        null,

      referenceResolutionEngineDiagnostic:
        {
          invocation:
            referenceInvocationDiagnostic,

          validation:
            referencePacket
              ?.validation ||
            null
        }
    };

    if (
      state.referenceResolutionEngineReady !==
      true
    ) {
      const referenceValidationError =
        referencePacket
          ?.validation
          ?.errors?.[0] ||
        "reference_packet_invalid";

      return {
        ...state,

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          referenceValidationError
      };
    }

    const operatingState =
      this.getConversationOperatingState();

    if (
      !operatingState ||
      typeof operatingState
        .attachConversationContext !==
        "function"
    ) {
      return {
        ...state,

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          "conversation_context_attachment_not_available"
      };
    }

    let attached;

    try {
      attached =
        await operatingState
          .attachConversationContext(
            state
          );
    } catch (error) {
      return {
        ...state,

        conversationContextAttachmentRan:
          true,

        conversationContextAttachmentReady:
          false,

        conversationContextAttachmentError:
          error?.message ||
          String(error),

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          "conversation_context_attachment_threw"
      };
    }

    if (
      !attached ||
      typeof attached !==
        "object" ||
      Array.isArray(attached) ||
      attached
        .conversationContextAttachmentReady !==
        true
    ) {
      return {
        ...state,

        ...(
          attached &&
          typeof attached ===
            "object" &&
          !Array.isArray(attached)
            ? attached
            : {}
        ),

        conversationContextAuthoritiesRan:
          true,

        conversationContextAuthoritiesReady:
          false,

        conversationContextAuthoritiesError:
          attached
            ?.conversationContextAttachmentError ||
          "conversation_context_attachment_failed"
      };
    }

    return {
      ...state,
      ...attached,

      conversationContextAuthoritiesRan:
        true,

      conversationContextAuthoritiesReady:
        true,

      conversationContextAuthoritiesSource:
        this.source,

      conversationContextAuthoritiesVersion:
        this.version,

      conversationContextAuthoritiesError:
        null
    };
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

      const debugTrace =
  name === "deliberation"
    ? (
        result.deliberationDebugTrace ||
        result.deliberationPacket
          ?.debug
          ?.trace ||
        null
      )
    : null;

const failureBoundary =
  debugTrace
    ?.failureBoundary ||
  null;

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
    null,

  debugTraceAvailable:
    Boolean(
      debugTrace
    ),

  failureBoundary,

  firstFailedStage:
    debugTrace
      ?.firstFailedStage ||
    null,

  debugTrace,

  deliberationDiagnostics:
    name === "deliberation"
      ? (
          result
            .deliberationDiagnostics ||
          null
        )
      : null
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
        const failureBoundary =
  name === "deliberation"
    ? (
        result
          .deliberationDebugTrace
          ?.failureBoundary ||
        result
          .deliberationPacket
          ?.debug
          ?.trace
          ?.failureBoundary ||
        null
      )
    : null;

const firstFailedStage =
  name === "deliberation"
    ? (
        result
          .deliberationDebugTrace
          ?.firstFailedStage ||
        result
          .deliberationPacket
          ?.debug
          ?.trace
          ?.firstFailedStage ||
        null
      )
    : null;

const error =
  this.buildLayerError({
    layer:
      name,

    type:
      ran !== true
        ? "required_pipeline_did_not_run"
        : (
            failureBoundary ||
            "required_pipeline_not_ready"
          ),

    message:
      ran !== true
        ? `The required ${name} pipeline did not report successful execution.`
        : failureBoundary
          ? `The required ${name} pipeline failed at ${failureBoundary}.`
          : `The required ${name} pipeline ran but did not produce a ready result.`,

    fatal:
      true,

    details: {
      failureBoundary,
      firstFailedStage
    }
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
  summary.pipelineLayerResults?.[layer.name] ||
  {};

  if (
    layer.required === true &&
    result.ran !== true
  ) {
    return {
      stop:
        true,

      reason:
        `required_${layer.name}_pipeline_did_not_run`,

      layer:
        layer.name,

      failureBoundary:
        null
    };
  }

  if (
    layer.required === true &&
    result.ready !== true
  ) {
    const failureBoundary =
      layer.name ===
        "deliberation"
        ? (
            result.failureBoundary ||
            result.debugTrace
              ?.failureBoundary ||
            summary
              .deliberationDebugTrace
              ?.failureBoundary ||
            null
          )
        : null;

    return {
      stop:
        true,

      reason:
        failureBoundary ||
        `required_${layer.name}_pipeline_not_ready`,

      layer:
        layer.name,

      failureBoundary
    };
  }

  return {
    stop:
      false,

    reason:
      null,

    layer:
      null,

    failureBoundary:
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

          reason,
          
          failureBoundary:
  summary.pipelineLayerResults
    ?.deliberation
    ?.failureBoundary ||
  null,

stoppedByLayer:
  summary.pipelineStopLayer ||
  null
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
  const diagnostic = {
    engineAvailable:
      Boolean(engine),

    engineVersion:
      engine?.version ||
      null,

    requestedMethods:
      this.toArray(methods),

    selectedMethod:
      null,

    attempted:
      false,

    succeeded:
      false,

    failureType:
      null,

    error:
      null
  };

  if (!engine) {
    return {
      ...(
        fallback &&
        typeof fallback ===
          "object"
          ? fallback
          : {}
      ),

      engineInvocationDiagnostic: {
        ...diagnostic,

        failureType:
          "engine_not_loaded"
      }
    };
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

    diagnostic.selectedMethod =
      method;

    diagnostic.attempted =
      true;

    try {
      const result =
        await engine[method](
          inputState
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        return {
          ...(
            fallback &&
            typeof fallback ===
              "object"
              ? fallback
              : {}
          ),

          engineInvocationDiagnostic: {
            ...diagnostic,

            failureType:
              "invalid_engine_result",

            returnedType:
              Array.isArray(result)
                ? "array"
                : typeof result,

            returnedValue:
              result ??
              null
          }
        };
      }

      return {
        ...result,

        engineInvocationDiagnostic: {
          ...diagnostic,

          succeeded:
            true
        }
      };
    } catch (error) {
      console.error(
        "ARI ENGINE INVOCATION FAILED:",
        {
          engineVersion:
            engine?.version ||
            null,

          method,

          message:
            error?.message ||
            String(error),

          stack:
            error?.stack ||
            null
        }
      );

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
          null,

        engineInvocationDiagnostic: {
          ...diagnostic,

          failureType:
            "engine_method_threw",

          error: {
            name:
              error?.name ||
              "Error",

            message:
              error?.message ||
              String(error),

            stack:
              error?.stack ||
              null
          }
        }
      };
    }
  }

  return {
    ...(
      fallback &&
      typeof fallback ===
        "object"
        ? fallback
        : {}
    ),

    engineInvocationDiagnostic: {
      ...diagnostic,

      failureType:
        "compatible_engine_method_not_found",

      availableMethods:
        Object.keys(engine)
          .filter(
            key =>
              typeof engine[key] ===
              "function"
          )
    }
  };
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
"canonical-five-layer-openai-cognitive-authority-with-evidence-and-advisory-semantic-validation",

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
"canonical-five-layer-openai-cognitive-authority-with-evidence-and-advisory-semantic-validation",

        conversationOperatingState: {
  began:
    summary.conversationOperatingStateRan ===
    true,

  ready:
    summary.conversationOperatingStateReady ===
    true,

  usable:
    summary.conversationOperatingStateUsable ===
    true,

  degraded:
    summary.conversationOperatingStateDegraded ===
    true,

  mode:
    summary.conversationOperatingStateMode ||
    null,

  source:
    summary.conversationOperatingStateSource ||
    null,

  version:
    summary.conversationOperatingStateVersion ||
    null,

  error:
    summary.conversationOperatingStateError ||
    null,

  errors:
    this.toArray(
      summary.conversationOperatingStateErrors
    ),

  warnings:
    this.toArray(
      summary.conversationOperatingStateWarnings
    )
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
  fatal = false,
  details = null
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

    details:
      details &&
      typeof details ===
        "object"
        ? details
        : null,

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

  const cognitiveReasoningResult =
    this.readObject(
      summary.cognitiveReasoningResult
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.reasoning
        ?.result
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.stages
        ?.reasoning
        ?.cognitiveReasoningResult
    ) ||
    null;

  const cognitiveResultAvailable =
    Boolean(
      cognitiveReasoningResult
    );

  /*
   * Semantic-validation acceptance is audit metadata.
   * It is not downstream execution authority.
   */
  const semanticValidationAccepted =
    summary.semanticValidationAccepted ===
      true ||
    summary.semanticFrameValidation
      ?.accepted ===
      true ||
    summary.semanticFrameValidatorResult
      ?.accepted ===
      true ||
    summary.semanticValidationStagePacket
      ?.accepted ===
      true ||
    summary.deliberationPacket
      ?.semanticValidation
      ?.accepted ===
      true ||
    summary.deliberationPacket
      ?.semanticValidation
      ?.result
      ?.accepted ===
      true;

  /*
   * Prefer an accepted normalized frame when one exists.
   * Otherwise preserve the usable OpenAI-generated frame.
   */
  const usableSemanticFrame =
    this.readObject(
      summary.validatedSemanticFrame
    ) ||
    this.readObject(
      summary.semanticFrame
    ) ||
    this.readObject(
      cognitiveReasoningResult
        ?.semanticFrame
    ) ||
    this.readObject(
      cognitiveReasoningResult
        ?.semanticStructure
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.semanticValidation
        ?.semanticFrame
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.reasoning
        ?.semanticFrame
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.reasoning
        ?.result
        ?.semanticFrame
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.stages
        ?.reasoning
        ?.semanticFrame
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.stages
        ?.semanticValidation
        ?.validatedSemanticFrame
    ) ||
    null;

  const usableSemanticFrameAvailable =
    Boolean(
      usableSemanticFrame
    );

  const validatedFrameAvailable =
    Boolean(
      this.readObject(
        summary.validatedSemanticFrame
      ) ||
      this.readObject(
        summary.deliberationPacket
          ?.semanticValidation
          ?.validatedSemanticFrame
      ) ||
      this.readObject(
        summary.deliberationPacket
          ?.stages
          ?.semanticValidation
          ?.validatedSemanticFrame
      )
    );

  const responsePlan =
    this.readObject(
      summary.responsePlan
    ) ||
    this.readObject(
      summary.responsePlanningStagePacket
        ?.responsePlan
    ) ||
    this.readObject(
      summary.responsePlanningStagePacket
        ?.plan
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.responsePlan
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.responsePlanning
        ?.responsePlan
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.responsePlanning
        ?.plan
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.stages
        ?.responsePlanning
        ?.responsePlan
    ) ||
    this.readObject(
      summary.deliberationPacket
        ?.stages
        ?.responsePlanning
        ?.plan
    ) ||
    null;

  const responsePlanAvailable =
    Boolean(
      responsePlan
    );

  const cognitiveContractsObserved =
    evidenceAvailable ||
    cognitiveResultAvailable ||
    usableSemanticFrameAvailable ||
    summary.evidenceBuilderRan ===
      true ||
    summary.reasoningStageRan ===
      true ||
    summary.semanticValidationStageRan ===
      true ||
    summary.semanticFrameValidatorRan ===
      true ||
    summary.responsePlanningStageRan ===
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

  /*
   * Planning may proceed only from a usable AI semantic
   * frame. Validator acceptance is not required.
   */
  if (
    enforced &&
    responsePlanAvailable &&
    !usableSemanticFrameAvailable
  ) {
    errors.push(
      "response_plan_created_without_usable_ai_semantic_frame"
    );
  }

  /*
   * Preserve validator rejection as an advisory warning
   * when a usable AI semantic frame exists.
   */
  if (
    enforced &&
    responsePlanAvailable &&
    usableSemanticFrameAvailable &&
    !semanticValidationAccepted
  ) {
    warnings.push(
      "semantic_validation_not_accepted_but_usable_ai_frame_preserved"
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

  const valid =
    errors.length ===
    0;

  const ready =
    enforced &&
    valid &&
    evidenceAvailable &&
    cognitiveResultAvailable &&
    usableSemanticFrameAvailable;

  return {
    valid,
    ready,
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
      usableSemanticFrameAvailable,
      responsePlanAvailable,
      cognitiveContractsObserved,
      explicitlyEnforced
    },

    semanticFrameAuthority: {
      source:
        validatedFrameAvailable
          ? "accepted_validated_semantic_frame"
          : usableSemanticFrameAvailable
            ? "authoritative_openai_semantic_frame"
            : "none",

      validatorAccepted:
        semanticValidationAccepted,

      advisoryValidationUsed:
        usableSemanticFrameAvailable &&
        !semanticValidationAccepted
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

    usable:
      summary.conversationOperatingStateUsable ===
      true,

    degraded:
      summary.conversationOperatingStateDegraded ===
      true,

    mode:
      summary.conversationOperatingStateMode ||
      null,

    completed:
      summary.conversationOperatingStateCompleted ===
      true,

    persisted:
      summary.conversationOperatingStatePersisted ===
      true,

    source:
      summary.conversationOperatingStateSource ||
      summary
        .conversationOperatingStateCompletionSource ||
      null,

    error:
      summary.conversationOperatingStateError ||
      summary
        .conversationOperatingStateCompletionError ||
      null,

    warnings:
      summary.conversationOperatingStateWarnings ||
      []
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
  "===== DELIBERATION DEBUG TRACE =====",
  summary.deliberationDebugTrace ||
  summary.deliberationPacket
    ?.debug
    ?.trace ||
  summary.pipelineLayerResults
    ?.deliberation
    ?.debugTrace ||
  null
);

console.log(
  "===== DELIBERATION FAILURE BOUNDARY =====",
  {
    failureBoundary:
      summary.deliberationDebugTrace
        ?.failureBoundary ||
      summary.pipelineLayerResults
        ?.deliberation
        ?.failureBoundary ||
      null,

    firstFailedStage:
      summary.deliberationDebugTrace
        ?.firstFailedStage ||
      summary.pipelineLayerResults
        ?.deliberation
        ?.firstFailedStage ||
      null,

    durationMs:
      summary.deliberationDebugTrace
        ?.durationMs ||
      summary.pipelineLayerResults
        ?.deliberation
        ?.durationMs ||
      null
  }
);

console.log(
  "===== REASONING STAGE DEBUG =====",
  {
    ran:
      summary.reasoningStageRan ===
      true,

    ready:
      summary.reasoningReady ===
      true,

    stageReady:
      summary.reasoningStageReady ===
      true,

    source:
      summary.reasoningStageSource ||
      null,

    error:
      summary.reasoningStageError ||
      null,

    reason:
      summary.reasoningStageReason ||
      null,

    resultAvailable:
      Boolean(
        summary
          .cognitiveReasoningResult
      ),

    semanticFrameAvailable:
      Boolean(
        summary.semanticFrame
      ),

    modelInvocation:
      summary.modelInvocation ||
      null,

    engineInvocationDiagnostic:
      summary
        .engineInvocationDiagnostic ||
      summary
        .reasoningStagePacket
        ?.engineInvocationDiagnostic ||
      summary
        .cognitiveReasoningResult
        ?.engineInvocationDiagnostic ||
      null
  }
);

    console.log(
  "===== COGNITIVE REASONING RESULT =====",
  summary.cognitiveReasoningResult ||
  summary.deliberationPacket
    ?.reasoning
    ?.result ||
  summary.deliberationPacket
    ?.stages
    ?.reasoning
    ?.cognitiveReasoningResult ||
  null
);
    console.log(
  "===== VALIDATED SEMANTIC FRAME =====",
  summary.validatedSemanticFrame ||
  summary.deliberationPacket
    ?.semanticValidation
    ?.validatedSemanticFrame ||
  null
);

    console.log(
  "===== SEMANTIC FRAME VALIDATION =====",
  summary.semanticFrameValidation ||
  summary.deliberationPacket
    ?.semanticValidation
    ?.result ||
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

      canCompleteConversationOperatingState:
        true,

      canEvaluateConversationOperatingStateUsability:
        true,

      canContinueWithDegradedConversationOperatingState:
        true,

      canTreatConversationOperatingStateReadinessAsRuntimeGate:
        false,

      canTreatPersistenceAsRuntimeDeliveryAuthority:
        false,

      canPreserveExternalEvidence:
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

canPreserveUsableAISemanticFrame:
  true,

canRequireUsableAISemanticFrameBeforePlanning:
  true,

canRequireValidatorAcceptanceBeforePlanning:
  false,

canTreatSemanticValidationAsAdvisory:
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
"canonical_five_layer_runtime_with_openai_semantic_authority_advisory_validation_and_cos_delegation"
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
          typeof component
            ?.attachConversationContext ===
            "function" &&
          typeof component?.completeTurn ===
            "function"
      ],

      [
        "AriTurnClassificationPacket",

        (
          window.AriTurnClassificationPacket ||
          window.Ari?.turnClassificationPacket ||
          null
        ),

        component =>
          typeof component?.validate ===
            "function"
      ],

      [
        "AriConversationRelationshipEngine",

        this.getConversationRelationshipEngine(),

        component =>
          typeof component?.run ===
            "function" ||
          typeof component?.classify ===
            "function" ||
          typeof component?.build ===
            "function"
      ],

      [
        "AriReferencePacket",

        (
          window.AriReferencePacket ||
          window.Ari?.referencePacket ||
          null
        ),

        component =>
          typeof component?.validate ===
            "function"
      ],

      [
        "AriEntityReferenceResolver",

        this.getReferenceResolutionEngine(),

        component =>
          typeof component?.run ===
            "function" ||
          typeof component?.resolve ===
            "function" ||
          typeof component?.build ===
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

const optionalComponents = [
  [
    "AriSemanticFrameValidator",

    (
      window.AriSemanticFrameValidator ||
      window.Ari?.semanticFrameValidator ||
      null
    ),

    component =>
      typeof component?.validate === "function"
  ]
];

    const missingRequiredComponents =
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

const unavailableOptionalComponents =
  optionalComponents
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
        `${name}_optional_not_loaded`
    );

const warnings =
  unavailableOptionalComponents;
    return {
  valid:
    errors.length === 0,

  ready:
    errors.length === 0 &&
    missingRequiredComponents.length ===
      0,

  source:
    "ari-rebirth-pipeline-validation",

  version:
    this.version,

  errors:
    this.uniqueValues([
      ...errors,
      ...missingRequiredComponents
    ]),

  warnings:
    this.uniqueValues(
      warnings
    ),

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

        usableAISemanticFrameRequiredBeforePlanning:
  authority
    .canRequireUsableAISemanticFrameBeforePlanning ===
  true,

validatorAcceptanceNotRequiredBeforePlanning:
  authority
    .canRequireValidatorAcceptanceBeforePlanning ===
  false,

semanticValidationIsAdvisory:
  authority
    .canTreatSemanticValidationAsAdvisory ===
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

readObject(
  value = null
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value;
},

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
