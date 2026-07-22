// ari/integration/ari-master-orchestrator.js
// Ari Master Orchestrator
//
// Purpose:
// Coordinate Ari's canonical runtime from one normalized current-turn
// request through one authoritative Delivery Result.
//
// V8.0.0 — Canonical Runtime Orchestration
//
// Architectural flow:
//
// Canonical Runtime Request
//      ↓
// Current-Turn Output Reset
//      ↓
// Conversation Operating State — Begin Turn
//      ↓
// Perception
//      ↓
// Executive Routing
//      ↓
// Deliberation
//      ↓
// Expression
//      ↓
// Delivery
//      ↓
// Canonical Delivery Result
//      ↓
// Conversation Operating State — Complete Turn
//      ↓
// Application Boundary
//
// Responsibilities:
// - Normalize one canonical current-turn request.
// - Clear generated output inherited from a prior turn.
// - Begin and complete the canonical conversation turn.
// - Execute each required runtime layer exactly once and in order.
// - Stop downstream execution when a required boundary fails.
// - Record runtime timing, lifecycle, warnings, and failures.
// - Return one canonical authoritative Delivery Result.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not classify conversation function.
// - Does not resolve references directly.
// - Does not retrieve memory directly.
// - Does not choose routing decisions.
// - Does not perform cognitive reasoning.
// - Does not validate deliberation internals.
// - Does not create or modify response plans.
// - Does not execute Expression stages independently.
// - Does not compose or rewrite response language.
// - Does not substitute intermediate output for Delivery authority.
// - Does not execute application writes.
// - Does not access Supabase directly.
// - Does not coordinate developer tooling.
// - Does not own feature-specific evidence preservation.

window.Ari = window.Ari || {};

window.AriMasterOrchestrator = {
  version: "8.0.0",
  schemaVersion: "8.0.0",
  source: "ari-master-orchestrator",
  authorityLevel: "canonical_runtime_orchestration_authority",

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

      activeRuntimeLayer: "initialization",

      pipelineTiming: timing,
      pipelineTimingStart: timingStart,

      pipelineLifecycleErrors:
        this.toArray(
          normalizedInput.pipelineLifecycleErrors
        ),

      pipelineLifecycleWarnings:
        this.toArray(
          normalizedInput.pipelineLifecycleWarnings
        ),

      pipelineLayerResults: {},
      pipelineExecutionOrder: [],

      pipelineStopped: false,
      pipelineStopReason: null,
      pipelineStopLayer: null,

      conversationOperatingStateRan: false,
      conversationOperatingStateReady: false,
      conversationOperatingStateCompleted: false,

      deliveryResult: null
    };

    const mark = label => {
      if (!debugTiming) {
        return;
      }

      timing.push({
        label,

        ms: Math.round(
          performance.now() -
          timingStart
        )
      });

      summary.pipelineTiming = timing;
    };

    const finishTiming = () => {
      if (!debugTiming) {
        return;
      }

      mark(
        "AriMasterOrchestrator.run complete"
      );

      console.table(timing);

      console.log(
        "[AriMasterOrchestrator Timing] Total:",
        `${Math.round(
          performance.now() -
          timingStart
        )}ms`
      );
    };

    const runEngine = async (
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

    const runtime = {
      mark,
      runEngine,

      buildCanonicalDeliveryResult:
        state =>
          this.buildCanonicalDeliveryResult(
            state
          )
    };

    mark("normalizeInput complete");

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

        pipelineStopped: true,

        pipelineStopReason:
          "conversation_operating_state_not_ready",

        pipelineStopLayer:
          "initialization"
      };
    }

    /* =================================================
       2. EXECUTE REQUIRED RUNTIME LAYERS
    ================================================= */

    const layers =
      this.getLayerDefinitions();

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
          runtime
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

          pipelineStopped: true,

          pipelineStopReason:
            stopDecision.reason,

          pipelineStopLayer:
            stopDecision.layer ||
            layer.name
        };

        continue;
      }

      /*
       * Temporary migration boundary:
       *
       * Conversation context authorities still run here until
       * Executive Routing owns relationship classification,
       * reference resolution, and context attachment.
       *
       * Delete this block after that migration is complete.
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
          summary
            .conversationContextAuthoritiesReady !==
          true
        ) {
          summary = {
            ...summary,

            pipelineStopped: true,

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
       3. BUILD PIPELINE LIFECYCLE
    ================================================= */

    summary =
      this.buildPipelineLifecycle(
        summary
      );

    /* =================================================
       4. NORMALIZE AUTHORITATIVE DELIVERY
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
     *
     * Remove after the App Bridge consumes:
     *
     * summary.deliveryResult.reply
     *
     * directly.
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
       5. COMPLETE CANONICAL TURN
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
       6. FINAL RUNTIME METADATA
    ================================================= */

    summary = {
      ...summary,

      activeRuntimeLayer: "complete",

      masterOrchestratorRan: true,

      masterOrchestratorReady:
        summary.pipelineLifecycleComplete ===
          true &&
        summary.deliveryResult?.available ===
          true &&
        summary.conversationOperatingStateCompleted ===
          true,

      masterOrchestratorSource:
        this.source,

      masterOrchestratorVersion:
        this.version,

      masterOrchestratorSchemaVersion:
        this.schemaVersion,

      pipelineArchitecture:
        "canonical-runtime-orchestration",

      pipelineAuthority:
        this.getAuthorityBoundaries(),

      /*
       * Temporary legacy projections.
       *
       * These preserve compatibility with readers that still
       * expect AriRebirthPipeline metadata.
       */
      rebirthPipelineRan: true,

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
        this.schemaVersion
    };

    if (debugTiming) {
      this.debugLog(summary);
    }

    finishTiming();

    summary.pipelineTiming = timing;
    summary.pipelineTimingStart = timingStart;

    return summary;
  },