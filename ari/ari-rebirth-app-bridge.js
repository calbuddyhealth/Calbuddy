// ari/ari-rebirth-app-bridge.js
// Ari Rebirth App Bridge
//
// Purpose:
// Connect the production CalBuddy interface to the canonical Ari Rebirth
// runtime through one controlled request and delivery boundary.
//
// V2.1.0 — Delegated Runtime Services / Compatibility-Preserving Migration
//
// Architectural flow:
//
// CalBuddy UI
//      ↓
// Ari Rebirth App Bridge
//      ↓
// Ari Runtime Request
//      ↓
// Ari Rebirth Pipeline
//      ↓
// Delivery Pipeline
//      ↓
// Ari Runtime Delivery
//      ↓
// CalBuddy UI Response
//
// Responsibilities:
// - Load Ari Rebirth dependencies in deterministic order.
// - Prevent duplicate or incomplete script loading.
// - Coordinate the public ask() runtime entry point.
// - Delegate request construction to AriRuntimeRequest.
// - Delegate runtime validation to AriRuntimeReadiness.
// - Execute AriRebirthPipeline exactly once per request.
// - Delegate authoritative Delivery reading to AriRuntimeDelivery.
// - Delegate app-response adaptation to AriRuntimeDelivery.
// - Preserve the existing App Bridge public API.
// - Preserve compatibility wrappers during migration.
// - Preserve loader diagnostics.
// - Return controlled failures when runtime bootstrapping fails.
//
// Non-responsibilities:
// - Does not construct runtime requests internally.
// - Does not independently validate runtime components.
// - Does not scan arbitrary runtime fields for an answer.
// - Does not classify the conversation.
// - Does not interpret semantic meaning.
// - Does not determine developer intent.
// - Does not determine safety severity.
// - Does not run continuity directly.
// - Does not select a response plan.
// - Does not create a Composer Packet.
// - Does not create response candidates.
// - Does not choose between Blueprint Writer and AI Writer.
// - Does not arbitrate drafts.
// - Does not infer the final emotion.
// - Does not discover actions from arbitrary runtime fields.
// - Does not generate conversational fallback answers.
// - Does not retrieve or store memory.
// - Does not execute application writes.
// - Does not access Supabase directly.
// - Does not persist runtime state beyond loader diagnostics.

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "2.1.0",
  schemaVersion: "2.0.0",
  source: "ari-rebirth-app-bridge",
  authorityLevel:
    "application_runtime_entry_and_service_coordination",

  /* =====================================================
     SCRIPT DEPENDENCIES
  ===================================================== */

  requiredScripts: [
    // ===================================================
    // FOUNDATION
    // ===================================================

    "ari/system/ari-loader.js",
    "ari/system/ari-authority.js",

    // ===================================================
    // APP BRIDGE RUNTIME SERVICES
    //
    // These must load before runtime readiness is checked.
    // The App Bridge remains the bootstrap loader.
    // ===================================================

    "ari/bridge/ari-runtime-request.js",
    "ari/bridge/ari-runtime-readiness.js",
    "ari/bridge/ari-runtime-delivery.js",

    // ===================================================
    // ACTION / INTENT
    // ===================================================

    "ari/actions/ari-rebirth-action-planner.js",
    "ari/intent/ari-action-intent-classifier.js",
    "ari/intent/ari-action-contract.js",

    // ===================================================
    // DEVELOPER AUTHORITIES
    // ===================================================

    "ari/developer/ari-rebirth-developer-understanding-engine.js",
    "ari/developer/ari-rebirth-ui-layout-planner-engine.js",
    "ari/developer/ari-rebirth-project-knowledge-graph-engine.js",
    "ari/developer/ari-rebirth-capability-registry-engine.js",
    "ari/developer/ari-rebirth-architecture-engine.js",
    "ari/developer/ari-rebirth-bug-diagnosis-engine.js",
    "ari/developer/ari-rebirth-execution-planner-engine.js",
    "ari/developer/ari-rebirth-code-evidence-engine.js",
    "ari/developer/ari-rebirth-code-understanding-engine.js",
    "ari/developer/ari-rebirth-dependency-map-engine.js",
    "ari/developer/ari-rebirth-self-improvement-engine.js",
    "ari/developer/ari-rebirth-patch-decision-engine.js",
    "ari/developer/ari-rebirth-patch-validation-engine.js",
    "ari/developer/ari-rebirth-regression-test-engine.js",
    "ari/developer/ari-rebirth-learning-engine.js",
    "ari/developer/ari-rebirth-developer-handoff-engine.js",

    // ===================================================
    // EARLY PERCEPTION / ROUTING AUTHORITIES
    // ===================================================

    "ari/safety/ari-safety-context-gate.js",
    "ari/observer-system/ari-observer-network.js",
    "ari/conversation/ari-conversation-function-engine.js",
    "ari/conversation/ari-universal-conversation-classifier.js",
    "ari/observer-system/ari-observer-routing-evidence.js",
    "ari/routing/ari-lane-splitter-engine.js",

    // ===================================================
    // CONTINUITY FOUNDATION
    // ===================================================

    "ari/storage/ari-thread-store.js",
    "ari/storage/ari-memory-store.js",
    "ari/continuity/ari-conversation-operating-state.js",
    "ari/conversation/ari-conversation-meaning-history.js",
    "ari/continuity/ari-conversation-continuity-engine.js",

    // ===================================================
    // CONTINUITY CAPABILITY ENGINES
    // ===================================================

    "ari/context/ari-thread-understanding-engine.js",
    "ari/continuity/ari-elliptical-follow-up-resolver.js",
    "ari/context/ari-entity-reference-resolver.js",

    "ari/memory/ari-memory-ranking-engine.js",
    "ari/memory/ari-memory-retrieval-engine.js",
    "ari/memory/ari-memory-context-builder.js",
    "ari/memory/ari-memory-candidate-engine.js",

    "ari/relationship/ari-relationship-engine.js",
    "ari/context/ari-context-assembler.js",

    // ===================================================
    // CONTINUITY ORCHESTRATION
    // ===================================================

    "ari/continuity/ari-continuity-packet.js",
    "ari/continuity/ari-continuity-entry-point.js",

    // Diagnostic compatibility only.
    "ari/context/ari-thread-question-generator.js",

    // ===================================================
    // MEANING / RECONCILIATION
    // ===================================================

    "ari/meaning/ari-semantic-frame-builder.js",
    "ari/perception/ari-perception-reconciliation-engine.js",
    "ari/meaning/ari-situation-map-engine.js",

    // ===================================================
    // GOVERNANCE
    // ===================================================

    "ari/governance/ari-triage-engine.js",
    "ari/governance/ari-multi-lane-response-planner.js",
    "ari/governance/ari-situation-contract.js",

    // ===================================================
    // LANGUAGE FOUNDATION
    // ===================================================

    "ari/language/ari-lexical-grounding-engine.js",
    "ari/language/ari-human-language-engine.js",
    "ari/language/ari-mouth-director.js",

    // ===================================================
    // CHARACTER AUTHORITIES
    // ===================================================

    "ari/character/ari-constitution.js",
    "ari/character/ari-character-core.js",
    "ari/character/ari-character-instincts.js",
    "ari/character/ari-character-taste-profile.js",
    "ari/character/ari-character-preferences.js",
    "ari/character/ari-character-preference-resolver.js",
    "ari/character/ari-worldview.js",
    "ari/character/ari-relationship-style.js",

    // ===================================================
    // CHARACTER SUBSYSTEM
    // ===================================================

    "ari/character/ari-character-context-engine.js",
    "ari/character/ari-character-reasoning-engine.js",
    "ari/character/ari-character-expression-engine.js",

    // ===================================================
    // RESPONSE EXPRESSION AUTHORITIES
    // ===================================================

    "ari/language/ari-composer-bridge.js",
    "ari/language/ari-blueprint-writer.js",
    "ari/language/ari-ai-writer.js",
    "ari/language/ari-response-candidate-arbiter.js",

    /*
     * These composers remain active during the compatibility
     * phase. They will be revisited only after the App Bridge
     * migration passes its regression tests.
     */
    "ari/language/ari-language-composer-v9.js",
    "ari/language/ari-language-composer.js",

    // ===================================================
    // OBSERVER / ATTENTION
    // ===================================================

    "ari/observer-system/ari-observer-hierarchy-engine.js",
    "ari/observer-system/ari-observation-ledger.js",
    "ari/observer-system/ari-question-understanding.js",
    "ari/observer-system/ari-life-signal-extractor.js",

    "ari/attention-system/ari-attention-system.js",
    "ari/brain/ari-router.js",

    // ===================================================
    // VALUES / IDENTITY / CONFLICT
    // ===================================================

    "ari/value-system/ari-value-engine.js",
    "ari/identity-system/ari-identity-engine.js",
    "ari/conflict-system/ari-conflict-engine.js",

    // ===================================================
    // CONFIDENCE / EXECUTIVE
    // ===================================================

    "ari/confidence-system/ari-confidence-system.js",
    "ari/confidence-system/ari-confidence-calibration.js",
    "ari/executive-system/ari-executive-function.js",

    // ===================================================
    // EMOTION / ORGANISM / NEED
    // ===================================================

    "ari/heart/ari-emotion-engine.js",
    "ari/emotion-system/ari-emotional-intelligence.js",
    "ari/emotion-system/ari-underlying-emotion-engine.js",
    "ari/emotion-system/ari-emotion-recovery-questions.js",
    "ari/emotion-system/ari-emotion-integrator.js",

    "ari/organism-system/ari-organism-function-engine.js",
    "ari/needs/ari-need-engine.js",

    // ===================================================
    // SYNTHESIS / SPECIALIZED REASONING
    // ===================================================

    "ari/integration/ari-salience-governor.js",
    "ari/integration/ari-synthesis-engine.js",

    "ari/uncertainty/ari-uncertainty-classification-engine.js",
    "ari/identity/ari-identity-priority-engine.js",
    "ari/identity/ari-identity-conflict-resolver.js",
    "ari/values/ari-value-integration-engine.js",
    "ari/emotion/ari-stewardship-fear-differentiator.js",
    "ari/meaning/ari-life-chapter-engine.js",
    "ari/teaching/ari-teaching-answer-engine.js",
    "ari/governance/ari-situation-review-console.js",

    // ===================================================
    // KNOWLEDGE / COGNITION
    // ===================================================

    "ari/knowledge/ari-openai-knowledge-client.js",
    "ari/knowledge/ari-supabase-knowledge-client.js",
    "ari/reasoning/ari-reasoning-engine.js",
    "ari/cognition/ari-cognitive-executive.js",
    "ari/knowledge/ari-knowledge-router.js",
    "ari/knowledge/ari-knowledge-meaning-interpreter.js",

    // ===================================================
    // EVENT ONTOLOGY
    // ===================================================

    "ari/ontology/events/ari-event-ontology-life-transitions.js",
    "ari/ontology/events/ari-event-ontology-relationships.js",
    "ari/ontology/events/ari-event-ontology-family-parenthood.js",
    "ari/ontology/events/ari-event-ontology-social-life.js",
    "ari/ontology/events/ari-event-ontology-education.js",
    "ari/ontology/events/ari-event-ontology-career-military.js",
    "ari/ontology/events/ari-event-ontology-health.js",
    "ari/ontology/events/ari-event-ontology-mental-health.js",
    "ari/ontology/events/ari-event-ontology-finance-legal.js",
    "ari/ontology/events/ari-event-ontology-crisis-achievement-lifestyle-tech.js",
    "ari/ontology/events/ari-event-ontology-index.js",

    // ===================================================
    // MEANING ONTOLOGY
    // ===================================================

    "ari/ontology/meaning/ari-meaning-ontology.js",
    "ari/ontology/meaning/ari-meaning-modifiers.js",
    "ari/ontology/meaning/ari-meaning-impacts.js",

    // ===================================================
    // UNDERSTANDING CHAIN
    // ===================================================

    "ari/understanding/ari-language-understanding-engine.js",
    "ari/understanding/ari-semantic-understanding-engine.js",
    "ari/understanding/ari-event-understanding-engine.js",
    "ari/understanding/ari-meaning-interpreter.js",
    "ari/understanding/ari-human-state-builder.js",
    "ari/understanding/ari-response-planner.js",

    // ===================================================
    // LAYER 1 — PERCEPTION
    // ===================================================

    "ari/pipelines/ari-perception-pipeline.js",

    // ===================================================
    // LAYER 2 — EXECUTIVE ROUTING
    // ===================================================

    "ari/pipelines/ari-executive-routing-pipeline.js",

    // ===================================================
    // LAYER 3 — DELIBERATION STAGES
    // ===================================================

    "ari/pipeline-stages/deliberation/ari-continuity-stage.js",
    "ari/pipeline-stages/deliberation/ari-safety-stage.js",
    "ari/pipeline-stages/deliberation/ari-situation-stage.js",
    "ari/pipeline-stages/deliberation/ari-reasoning-stage.js",
    "ari/pipeline-stages/deliberation/ari-memory-stage.js",
    "ari/pipeline-stages/deliberation/ari-understanding-stage.js",
    "ari/pipeline-stages/deliberation/ari-response-planning-stage.js",

    "ari/pipelines/ari-deliberation-pipeline.js",

    // ===================================================
    // LAYER 4 — EXPRESSION STAGES
    // ===================================================

    "ari/pipeline-stages/expression/ari-character-stage.js",
    "ari/pipeline-stages/expression/ari-language-guidance-stage.js",
    "ari/pipeline-stages/expression/ari-draft-generation-stage.js",
    "ari/pipeline-stages/expression/ari-draft-arbitration-stage.js",
    "ari/pipeline-stages/expression/ari-final-composition-stage.js",

    "ari/pipelines/ari-expression-pipeline.js",

    // ===================================================
    // LAYER 5 — DELIVERY STAGES
    // ===================================================

    "ari/pipeline-stages/delivery/ari-action-delivery-stage.js",
    "ari/pipeline-stages/delivery/ari-learning-persistence-stage.js",
    "ari/pipeline-stages/delivery/ari-delivery-diagnostics-stage.js",

    "ari/pipelines/ari-delivery-pipeline.js",

    // ===================================================
    // MASTER FIVE-LAYER PIPELINE
    // MUST LOAD LAST
    // ===================================================

    "ari/integration/ari-rebirth-pipeline.js"
  ],

  loaded: false,
  loadingPromise: null,

  /* =====================================================
     PUBLIC ASK ENTRY
  ===================================================== */

  async ask(message, options = {}) {
    const cleanMessage =
      this.cleanText(
        message
      );

    const timing =
      this.createTimingController(
        options.debugTiming ===
        true
      );

    timing.mark(
      "bridge_ask_started"
    );

    if (!cleanMessage) {
      timing.finish();

      return this.makeBridgeResponse({
        reply:
          "Say something first.",

        emotion:
          "idle",

        deliveryStatus:
          "input_rejected",

        diagnostics: {
          reason:
            "empty_current_turn",

          timing:
            timing.getEntries()
        }
      });
    }

    try {
      timing.mark(
        "before_runtime_load"
      );

      await this.ensureLoaded();

      timing.mark(
        "after_runtime_load"
      );
    } catch (error) {
      console.error(
        "ARI REBIRTH SCRIPT LOAD ERROR:",
        error
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari couldn’t finish loading the response system.",

        error,

        options,

        failureType:
          "runtime_load_failure",

        timing:
          timing.getEntries()
      });
    }

    const readiness =
      this.checkReadiness({
        requireRuntimeDelivery:
          true
      });

    if (
      readiness.ready !==
      true
    ) {
      console.error(
        "ARI REBIRTH READINESS FAILURE:",
        readiness
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari’s response system is not fully ready.",

        error:
          readiness.error ||
          readiness.reason ||
          "runtime_not_ready",

        options,

        failureType:
          "runtime_readiness_failure",

        diagnostics:
          readiness,

        timing:
          timing.getEntries()
      });
    }

    let requestEnvelope;

    try {
      timing.mark(
        "before_request_build"
      );

      requestEnvelope =
        this.buildRuntimeRequest({
          message:
            cleanMessage,

          options: {
            ...options,

            bridgeVersion:
              this.version
          }
        });

      timing.mark(
        "after_request_build"
      );
    } catch (error) {
      console.error(
        "ARI RUNTIME REQUEST BUILD ERROR:",
        error
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari couldn’t prepare the current request.",

        error,

        options,

        failureType:
          "runtime_request_build_failure",

        timing:
          timing.getEntries()
      });
    }

    const requestValidation =
      requestEnvelope
        ?.runtimeRequestValidation ||
      null;

    if (
      requestEnvelope
        ?.runtimeRequestReady !==
        true ||
      requestValidation
        ?.valid !==
        true
    ) {
      console.error(
        "ARI RUNTIME REQUEST INVALID:",
        requestValidation
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari couldn’t prepare a valid runtime request.",

        error:
          requestValidation
            ?.errors
            ?.[0] ||
          "runtime_request_invalid",

        options,

        failureType:
          "runtime_request_validation_failure",

        diagnostics: {
          requestValidation,

          turnId:
            requestEnvelope
              ?.turn
              ?.turnId ||
            null
        },

        timing:
          timing.getEntries()
      });
    }

    let runtimeResult;

    try {
      timing.mark(
        "before_master_pipeline"
      );

      runtimeResult =
        await window
          .AriRebirthPipeline
          .run(
            requestEnvelope
          );

      timing.mark(
        "after_master_pipeline"
      );
    } catch (error) {
      console.error(
        "ARI REBIRTH PIPELINE ERROR:",
        error
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari hit an internal response error.",

        error,

        options,

        failureType:
          "master_pipeline_failure",

        diagnostics: {
          turnId:
            requestEnvelope
              .turn
              ?.turnId ||
            null
        },

        timing:
          timing.getEntries()
      });
    }

    let normalizedDelivery;

    try {
      timing.mark(
        "before_delivery_read"
      );

      normalizedDelivery =
        this.readAuthoritativeDelivery(
          runtimeResult,
          {
            includeSummary:
              options.includeSummary !==
              false
          }
        );

      timing.mark(
        "after_delivery_read"
      );
    } catch (error) {
      console.error(
        "ARI RUNTIME DELIVERY READ ERROR:",
        error
      );

      timing.finish();

      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari understood the request, but the final delivery step could not be read.",

        error,

        options,

        failureType:
          "runtime_delivery_read_failure",

        summary:
          runtimeResult,

        diagnostics: {
          turnId:
            requestEnvelope
              .turn
              ?.turnId ||
            null
        },

        timing:
          timing.getEntries()
      });
    }

    timing.mark(
      "before_delivery_adaptation"
    );

    const response =
      this.adaptDeliveryToAppResponse({
        delivery:
          normalizedDelivery,

        runtimeResult,

        requestEnvelope,

        options
      });

    timing.mark(
      "after_delivery_adaptation"
    );

    timing.finish();

    return this.attachBridgeDiagnostics({
      response,

      requestEnvelope,

      readiness,

      timing:
        timing.getEntries()
    });
  },

  /* =====================================================
     DELEGATED REQUEST CONSTRUCTION
  ===================================================== */

  buildRuntimeRequest({
    message = "",
    options = {}
  } = {}) {
    const service =
      window.AriRuntimeRequest ||
      window.Ari
        ?.runtimeRequest ||
      null;

    if (
      !service ||
      typeof service.build !==
        "function"
    ) {
      throw new Error(
        "ari_runtime_request_service_unavailable"
      );
    }

    return service.build({
      message,
      options
    });
  },

  /* =====================================================
     DELEGATED READINESS
  ===================================================== */

  checkReadiness(
    options = {}
  ) {
    const service =
      window.AriRuntimeReadiness ||
      window.Ari
        ?.runtimeReadiness ||
      null;

    if (
      !service ||
      typeof service.check !==
        "function"
    ) {
      return {
        ready:
          false,

        source:
          "ari-rebirth-app-bridge-readiness",

        reason:
          "runtime_readiness_service_unavailable",

        error:
          "AriRuntimeReadiness_not_loaded",

        missing: [
          "AriRuntimeReadiness"
        ],

        authority:
          "bridge_service_availability_check"
      };
    }

    try {
      return service.check({
        requireRuntimeDelivery:
          options
            .requireRuntimeDelivery !==
          false,

        ...options
      });
    } catch (error) {
      return {
        ready:
          false,

        source:
          "ari-rebirth-app-bridge-readiness",

        reason:
          "runtime_readiness_service_failed",

        error:
          error?.message ||
          String(
            error
          ),

        errors: [
          error?.message ||
          String(
            error
          )
        ],

        authority:
          "bridge_service_availability_check"
      };
    }
  },

  /* =====================================================
     DELEGATED DELIVERY READING
  ===================================================== */

  readAuthoritativeDelivery(
    runtimeResult = {},
    options = {}
  ) {
    const service =
      window.AriRuntimeDelivery ||
      window.Ari
        ?.runtimeDelivery ||
      null;

    if (
      !service ||
      typeof service.read !==
        "function"
    ) {
      throw new Error(
        "ari_runtime_delivery_service_unavailable"
      );
    }

    return service.read(
      runtimeResult,
      options
    );
  },

  /* =====================================================
     DELEGATED DELIVERY ADAPTATION
  ===================================================== */

  adaptDeliveryToAppResponse({
    delivery = {},
    runtimeResult = {},
    requestEnvelope = {},
    options = {}
  } = {}) {
    const service =
      window.AriRuntimeDelivery ||
      window.Ari
        ?.runtimeDelivery ||
      null;

    if (
      !service ||
      typeof service.adapt !==
        "function"
    ) {
      return this.makeBridgeFailureResponse({
        publicReply:
          "Ari’s final response adapter is unavailable.",

        error:
          "ari_runtime_delivery_adapter_unavailable",

        options,

        failureType:
          "runtime_delivery_adapter_missing",

        summary:
          runtimeResult,

        diagnostics: {
          turnId:
            requestEnvelope
              ?.turn
              ?.turnId ||
            null
        }
      });
    }

    return service.adapt(
      delivery,
      {
        includeSummary:
          options.includeSummary !==
          false,

        includeCompatibilityFields:
          options
            .includeCompatibilityFields !==
          false,

        includeFailureReply:
          options.includeFailureReply !==
          false
      }
    );
  },

  /* =====================================================
     BRIDGE-LEVEL FAILURE RESPONSES
  ===================================================== */

  makeBridgeFailureResponse({
    publicReply = "Ari hit an internal response error.",
    error = null,
    options = {},
    failureType = "internal_error",
    summary = null,
    diagnostics = null,
    timing = []
  } = {}) {
    const normalizedError =
      error?.message ||
      (
        error
          ? String(
              error
            )
          : null
      );

    const exposeInternalError =
      options.debugTiming ===
        true ||
      options.debug ===
        true ||
      options.exposeInternalErrors ===
        true;

    const reply =
      exposeInternalError &&
      normalizedError
        ? `${publicReply} ${normalizedError}`
        : publicReply;

    return this.makeBridgeResponse({
      reply,

      emotion:
        "concerned",

      actions: [],

      developerIntent:
        null,

      summary:
        options.includeSummary ===
          false
          ? null
          : summary,

      error: {
        code:
          this.normalizeIdentifier(
            failureType
          ) ||
          "internal_error",

        message:
          normalizedError ||
          publicReply,

        source:
          this.source
      },

      deliveryStatus:
        "failed",

      diagnostics: {
        failureType,

        detail:
          diagnostics,

        internalErrorExposed:
          exposeInternalError,

        timing
      }
    });
  },

  makeBridgeResponse({
    reply = "",
    emotion = "idle",
    actions = [],
    developerIntent = null,
    summary = null,
    error = null,
    deliveryStatus = "delivered",
    diagnostics = null
  } = {}) {
    const successful =
      deliveryStatus ===
      "delivered";

    return {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        this.cleanText(
          reply
        ),

      emotion:
        this.normalizeBridgeEmotion(
          emotion
        ),

      actions:
        this.toArray(
          actions
        ),

      developerIntent,

      summary,

      error,

      ok:
        successful,

      success:
        successful,

      complete:
        successful,

      deliveryStatus,

      source:
        this.source,

      responseSource:
        successful
          ? "ari_rebirth_app_bridge"
          : "ari_rebirth_app_bridge_failure",

      bridgeVersion:
        this.version,

      diagnostics,

      authority: {
        reply:
          successful
            ? "bridge_input_boundary"
            : "bridge_failure_boundary",

        emotion:
          successful
            ? "bridge_input_boundary"
            : "bridge_failure_boundary",

        actions:
          "none_or_upstream_preserved",

        adaptation:
          this.source
      },

      // Compatibility response aliases.
      text:
        this.cleanText(
          reply
        ),

      message:
        this.cleanText(
          reply
        ),

      response:
        this.cleanText(
          reply
        ),

      finalResponse:
        this.cleanText(
          reply
        ),

      finalEmotion:
        this.normalizeBridgeEmotion(
          emotion
        ),

      approvedActions:
        this.toArray(
          actions
        ),

      runtimeSummary:
        summary
    };
  },

  attachBridgeDiagnostics({
    response = {},
    requestEnvelope = {},
    readiness = {},
    timing = []
  } = {}) {
    if (
      !response ||
      typeof response !==
        "object" ||
      Array.isArray(
        response
      )
    ) {
      return response;
    }

    const existingDiagnostics =
      response.diagnostics &&
      typeof response.diagnostics ===
        "object" &&
      !Array.isArray(
        response.diagnostics
      )
        ? response.diagnostics
        : {};

    return {
      ...response,

      diagnostics: {
        ...existingDiagnostics,

        bridge: {
          source:
            this.source,

          version:
            this.version,

          schemaVersion:
            this.schemaVersion,

          requestService:
            window
              .AriRuntimeRequest
              ?.version ||
            null,

          readinessService:
            window
              .AriRuntimeReadiness
              ?.version ||
            null,

          deliveryService:
            window
              .AriRuntimeDelivery
              ?.version ||
            null
        },

        turn: {
          turnId:
            requestEnvelope
              ?.turn
              ?.turnId ||
            null,

          source:
            requestEnvelope
              ?.turn
              ?.source ||
            null,

          originalTextPreserved:
            requestEnvelope
              ?.turn
              ?.originalTextPreserved ===
            true
        },

        readiness: {
          ready:
            readiness.ready ===
            true,

          reason:
            readiness.reason ||
            null,

          errors:
            this.toArray(
              readiness.errors
            ),

          warnings:
            this.toArray(
              readiness.warnings
            )
        },

        timing
      }
    };
  },

  normalizeBridgeEmotion(
    value = ""
  ) {
    const normalized =
      this.normalizeIdentifier(
        value
      );

    const aliases = {
      neutral:
        "idle",

      concern:
        "concerned",

      anger:
        "mad",

      angry:
        "mad",

      joy:
        "happy",

      celebration:
        "celebrate",

      sadness:
        "sad",

      coaching:
        "coach",

      surprise:
        "wow",

      laughter:
        "laugh"
    };

    const resolved =
      aliases[
        normalized
      ] ||
      normalized;

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

    return allowed.includes(
      resolved
    )
      ? resolved
      : "idle";
  },

  /* =====================================================
     SCRIPT LOADING
  ===================================================== */

  async ensureLoaded() {
    if (
      this.loaded ===
        true &&
      this.areRequiredServicesReady() &&
      this.isMasterPipelineReady()
    ) {
      return true;
    }

    if (
      this.loadingPromise
    ) {
      return this.loadingPromise;
    }

    this.loadingPromise =
      this.loadRequiredScripts()
        .then(
          result => {
            this.loaded =
              result ===
                true &&
              this.areRequiredServicesReady() &&
              this.isMasterPipelineReady();

            if (
              !this.loaded
            ) {
              throw new Error(
                "ari_runtime_unavailable_after_script_loading"
              );
            }

            sessionStorage
              .setItem(
                "ariLoadingCompleted",
                "true"
              );

            sessionStorage
              .removeItem(
                "ariLastLoadingScript"
              );

            sessionStorage
              .removeItem(
                "ariLastLoadingIndex"
              );

            sessionStorage
              .removeItem(
                "ariLastLoadError"
              );

            return true;
          }
        )
        .catch(
          error => {
            this.loaded =
              false;

            this.loadingPromise =
              null;

            sessionStorage
              .setItem(
                "ariLoadingCompleted",
                "false"
              );

            sessionStorage
              .setItem(
                "ariLastLoadError",
                error?.message ||
                String(
                  error
                )
              );

            throw error;
          }
        );

    return this.loadingPromise;
  },

  async loadRequiredScripts() {
    sessionStorage
      .setItem(
        "ariLoadingCompleted",
        "false"
      );

    sessionStorage
      .removeItem(
        "ariLastLoadError"
      );

    for (
      let index = 0;
      index <
      this.requiredScripts.length;
      index += 1
    ) {
      const src =
        this.requiredScripts[
          index
        ];

      sessionStorage
        .setItem(
          "ariLastLoadingScript",
          src
        );

      sessionStorage
        .setItem(
          "ariLastLoadingIndex",
          String(
            index
          )
        );

      console.log(
        `[ARI LOADER ${index + 1}/${this.requiredScripts.length}]`,
        src
      );

      await this.loadScriptOnce(
        src
      );

      sessionStorage
        .setItem(
          "ariLastLoadedScript",
          src
        );

      sessionStorage
        .setItem(
          "ariLastLoadedIndex",
          String(
            index
          )
        );

      if (
        (
          index +
          1
        ) %
          10 ===
        0
      ) {
        await this.yieldToBrowser();
      }
    }

    return true;
  },

  loadScriptOnce(
    src = ""
  ) {
    const cleanSource =
      this.cleanText(
        src
      );

    if (!cleanSource) {
      return Promise.reject(
        new Error(
          "ari_script_source_missing"
        )
      );
    }

    const existing =
      this.findExistingScript(
        cleanSource
      );

    if (existing) {
      return this.awaitExistingScript({
        script:
          existing,

        src:
          cleanSource
      });
    }

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const script =
          document.createElement(
            "script"
          );

        script.src =
          cleanSource;

        script.async =
          false;

        script.defer =
          false;

        script.dataset
          .ariDynamicScript =
          "true";

        script.dataset
          .ariSource =
          cleanSource;

        script.dataset
          .ariLoadState =
          "loading";

        const cleanup =
          () => {
            script.onload =
              null;

            script.onerror =
              null;
          };

        script.onload =
          () => {
            script.dataset
              .ariLoadState =
              "loaded";

            cleanup();

            console.log(
              "[ARI LOADER SUCCESS]",
              cleanSource
            );

            resolve(
              true
            );
          };

        script.onerror =
          () => {
            script.dataset
              .ariLoadState =
              "failed";

            const error =
              new Error(
                `Failed to load Ari script: ${cleanSource}`
              );

            sessionStorage
              .setItem(
                "ariLastLoadError",
                error.message
              );

            console.error(
              "[ARI LOADER FAILURE]",
              cleanSource
            );

            cleanup();

            script.remove();

            reject(
              error
            );
          };

        document.head
          .appendChild(
            script
          );
      }
    );
  },

  findExistingScript(
    src = ""
  ) {
    return (
      [
        ...document.scripts
      ].find(
        script => {
          const attribute =
            script.getAttribute(
              "src"
            ) ||
            "";

          const absolute =
            script.src ||
            "";

          return (
            attribute ===
              src ||
            absolute.endsWith(
              src
            ) ||
            script.dataset
              ?.ariSource ===
              src
          );
        }
      ) ||
      null
    );
  },

  awaitExistingScript({
    script = null,
    src = ""
  } = {}) {
    if (!script) {
      return Promise.reject(
        new Error(
          `Existing Ari script reference missing: ${src}`
        )
      );
    }

    const state =
      script.dataset
        ?.ariLoadState ||
      "";

    if (
      state ===
      "loaded"
    ) {
      console.log(
        "[ARI LOADER ALREADY LOADED]",
        src
      );

      return Promise.resolve(
        true
      );
    }

    if (
      state ===
      "failed"
    ) {
      script.remove();

      return this.loadScriptOnce(
        src
      );
    }

    const directlyIncluded =
      script.dataset
        ?.ariDynamicScript !==
      "true";

    if (
      directlyIncluded &&
      document.readyState !==
        "loading"
    ) {
      script.dataset
        .ariLoadState =
        "loaded";

      console.log(
        "[ARI LOADER STATIC SCRIPT PRESENT]",
        src
      );

      return Promise.resolve(
        true
      );
    }

    console.log(
      "[ARI LOADER AWAITING EXISTING SCRIPT]",
      src
    );

    return new Promise(
      (
        resolve,
        reject
      ) => {
        let settled =
          false;

        const handleLoad =
          () => {
            if (settled) {
              return;
            }

            settled =
              true;

            script.dataset
              .ariLoadState =
              "loaded";

            cleanup();

            resolve(
              true
            );
          };

        const handleError =
          () => {
            if (settled) {
              return;
            }

            settled =
              true;

            script.dataset
              .ariLoadState =
              "failed";

            cleanup();

            reject(
              new Error(
                `Failed while waiting for Ari script: ${src}`
              )
            );
          };

        const timeout =
          window.setTimeout(
            () => {
              if (settled) {
                return;
              }

              settled =
                true;

              cleanup();

              reject(
                new Error(
                  `Timed out waiting for Ari script: ${src}`
                )
              );
            },
            30000
          );

        const cleanup =
          () => {
            window.clearTimeout(
              timeout
            );

            script.removeEventListener(
              "load",
              handleLoad
            );

            script.removeEventListener(
              "error",
              handleError
            );
          };

        script.addEventListener(
          "load",
          handleLoad,
          {
            once:
              true
          }
        );

        script.addEventListener(
          "error",
          handleError,
          {
            once:
              true
          }
        );
      }
    );
  },

  areRequiredServicesReady() {
    return Boolean(
      window
        .AriRuntimeRequest &&
      typeof window
        .AriRuntimeRequest
        .build ===
        "function" &&

      window
        .AriRuntimeReadiness &&
      typeof window
        .AriRuntimeReadiness
        .check ===
        "function" &&

      window
        .AriRuntimeDelivery &&
      typeof window
        .AriRuntimeDelivery
        .read ===
        "function" &&
      typeof window
        .AriRuntimeDelivery
        .adapt ===
        "function"
    );
  },

  isMasterPipelineReady() {
    return Boolean(
      window
        .AriRebirthPipeline &&
      typeof window
        .AriRebirthPipeline
        .run ===
        "function"
    );
  },

  yieldToBrowser() {
    return new Promise(
      resolve => {
        window.setTimeout(
          resolve,
          0
        );
      }
    );
  },

  /* =====================================================
     TIMING
  ===================================================== */

  createTimingController(
    enabled = false
  ) {
    const start =
      performance.now();

    const entries =
      [];

    const mark =
      label => {
        if (!enabled) {
          return;
        }

        entries.push({
          label,

          ms:
            Math.round(
              performance.now() -
              start
            )
        });
      };

    const finish =
      () => {
        if (!enabled) {
          return;
        }

        mark(
          "bridge_ask_complete"
        );

        console.table(
          entries
        );

        console.log(
          "[AriRebirthAppBridge Timing] Total:",
          `${Math.round(
            performance.now() -
            start
          )}ms`
        );
      };

    const getEntries =
      () =>
        entries.map(
          entry => ({
            ...entry
          })
        );

    return {
      enabled,
      entries,
      mark,
      finish,
      getEntries
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canLoadRuntimeScripts:
        true,

      canCoordinateRuntimeServices:
        true,

      canValidateServiceAvailability:
        true,

      canRunMasterPipeline:
        true,

      canReturnBridgeFailures:
        true,

      canDelegateRequestConstruction:
        true,

      canDelegateRuntimeReadiness:
        true,

      canDelegateDeliveryReading:
        true,

      canDelegateDeliveryAdaptation:
        true,

      canBuildCanonicalTurnEnvelope:
        false,

      canInspectRuntimeComponentsDirectly:
        false,

      canReadDeliveryFieldsDirectly:
        false,

      canClassifyConversation:
        false,

      canInterpretSemanticMeaning:
        false,

      canResolveContinuity:
        false,

      canDetermineDeveloperIntent:
        false,

      canDetermineSafetySeverity:
        false,

      canChooseResponsePlan:
        false,

      canCreateComposerPacket:
        false,

      canCreateResponseCandidate:
        false,

      canChooseBlueprintWriter:
        false,

      canChooseAIWriter:
        false,

      canArbitrateDrafts:
        false,

      canCreateFileEvidenceReply:
        false,

      canInferEmotion:
        false,

      canDiscoverActionsFromSummary:
        false,

      canSelectFinalResponse:
        false,

      canWriteConversationalFallback:
        false,

      canExecuteApplicationWrite:
        false,

      canRetrieveMemory:
        false,

      canStoreMemory:
        false,

      canAccessSupabase:
        false,

      canPersistRuntimeState:
        false,

      role:
        "application_runtime_entry_and_service_coordination"
    };
  },

  cannotSet() {
    return [
      "conversationFunction",
      "semanticMeaning",
      "primaryLane",
      "routingDecision",
      "riskLevel",
      "safetyDisposition",
      "developerIntent",
      "resolvedUserQuestion",
      "canonicalResponsePlan",
      "responseGoal",
      "responseShape",
      "responseMoves",
      "composerPacket",
      "candidateDrafts",
      "selectedDraft",
      "finalResponse",
      "deliveryResult",
      "finalEmotion",
      "approvedActions",
      "memorySaveDecision",
      "toolExecutionDecision"
    ];
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canBuildCanonicalTurnEnvelope",
      "canInspectRuntimeComponentsDirectly",
      "canReadDeliveryFieldsDirectly",
      "canClassifyConversation",
      "canInterpretSemanticMeaning",
      "canResolveContinuity",
      "canDetermineDeveloperIntent",
      "canDetermineSafetySeverity",
      "canChooseResponsePlan",
      "canCreateComposerPacket",
      "canCreateResponseCandidate",
      "canChooseBlueprintWriter",
      "canChooseAIWriter",
      "canArbitrateDrafts",
      "canCreateFileEvidenceReply",
      "canInferEmotion",
      "canDiscoverActionsFromSummary",
      "canSelectFinalResponse",
      "canWriteConversationalFallback",
      "canExecuteApplicationWrite",
      "canRetrieveMemory",
      "canStoreMemory",
      "canAccessSupabase",
      "canPersistRuntimeState"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const warnings =
      [];

    if (
      window
        .AriRuntimeRequest &&
      typeof window
        .AriRuntimeRequest
        .build !==
        "function"
    ) {
      warnings.push(
        "AriRuntimeRequest_build_missing"
      );
    }

    if (
      window
        .AriRuntimeReadiness &&
      typeof window
        .AriRuntimeReadiness
        .check !==
        "function"
    ) {
      warnings.push(
        "AriRuntimeReadiness_check_missing"
      );
    }

    if (
      window
        .AriRuntimeDelivery &&
      (
        typeof window
          .AriRuntimeDelivery
          .read !==
          "function" ||
        typeof window
          .AriRuntimeDelivery
          .adapt !==
          "function"
      )
    ) {
      warnings.push(
        "AriRuntimeDelivery_contract_incomplete"
      );
    }

    if (
      !window
        .AriRebirthPipeline
    ) {
      warnings.push(
        "AriRebirthPipeline_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-rebirth-app-bridge-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        publicAskPreserved:
          typeof this.ask ===
          "function",

        runtimeLoadingRetained:
          typeof this.ensureLoaded ===
          "function",

        requestConstructionDelegated:
          authority
            .canDelegateRequestConstruction ===
          true,

        runtimeReadinessDelegated:
          authority
            .canDelegateRuntimeReadiness ===
          true,

        deliveryReadingDelegated:
          authority
            .canDelegateDeliveryReading ===
          true,

        deliveryAdaptationDelegated:
          authority
            .canDelegateDeliveryAdaptation ===
          true,

        directRequestConstructionRemoved:
          authority
            .canBuildCanonicalTurnEnvelope ===
          false,

        directRuntimeInspectionRemoved:
          authority
            .canInspectRuntimeComponentsDirectly ===
          false,

        directDeliveryScanningRemoved:
          authority
            .canReadDeliveryFieldsDirectly ===
          false,

        masterPipelineSingleEntry:
          true,

        directWritesDisabled:
          authority
            .canExecuteApplicationWrite ===
          false,

        supabaseDisabled:
          authority
            .canAccessSupabase ===
          false
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

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
            null &&
          item !==
            ""
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [
      value
    ];
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

window.Ari.appBridge =
  window.AriRebirthAppBridge;

console.log(
  "ARI REBIRTH APP BRIDGE LOADED:",
  window
    .AriRebirthAppBridge
    ?.version,
  window
    .AriRebirthAppBridge
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);