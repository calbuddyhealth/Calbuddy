// ari/ari-rebirth-app-bridge.js
// Ari Rebirth App Bridge
//
// Purpose:
// Connect the production CalBuddy interface to the canonical Ari Rebirth
// runtime through one controlled request and delivery boundary.
//
// V2.4.2 — Explicit Runtime Availability Diagnostics
//
// Architectural flow:
//
// CalBuddy UI
//      ↓
// Ari Rebirth App Bridge
//      ↓
// Canonical Runtime Request
//      ↓
// Ari Rebirth Pipeline
//      ↓
// Authoritative Delivery Result
//      ↓
// Ari Runtime Delivery
//      ↓
// CalBuddy UI Response
//
// Responsibilities:
// - Load the Ari Rebirth runtime in deterministic dependency order.
// - Prevent duplicate or incomplete script loading.
// - Coordinate the public ask() entry point.
// - Delegate request construction to AriRuntimeRequest.
// - Delegate runtime validation to AriRuntimeReadiness.
// - Execute AriRebirthPipeline exactly once per request.
// - Delegate authoritative Delivery reading to AriRuntimeDelivery.
// - Delegate application-response adaptation to AriRuntimeDelivery.
// - Preserve the existing App Bridge public API.
// - Preserve application-facing failure-response aliases.
// - Preserve loader and boundary diagnostics.
// - Return controlled failures when runtime bootstrapping or execution fails.
//
// Non-responsibilities:
// - Does not construct canonical runtime requests internally.
// - Does not independently validate internal runtime components.
// - Does not inspect arbitrary runtime fields for an answer.
// - Does not execute individual runtime layers or stages.
// - Does not participate in perception, routing, or deliberation.
// - Does not interpret semantic meaning.
// - Does not determine conversation function.
// - Does not determine developer intent.
// - Does not determine safety severity.
// - Does not resolve continuity.
// - Does not create or modify the canonical Response Plan.
// - Does not participate in response realization.
// - Does not participate in final composition.
// - Does not select or rewrite successful runtime responses.
// - Does not infer the final emotion.
// - Does not discover actions from arbitrary runtime state.
// - Does not generate conversational fallback answers.
// - Does not retrieve or store memory.
// - Does not execute application writes.
// - Does not access Supabase directly.
// - Does not persist runtime state beyond non-blocking loader diagnostics.

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "2.4.2",
  schemaVersion: "2.4.2",
  source: "ari-rebirth-app-bridge",
  authorityLevel:
    "application_runtime_boundary_and_service_coordination",

  loaderDebug:
    false,

  /* =====================================================
     SCRIPT DEPENDENCIES
  ===================================================== */

  requiredScripts: [
    // ===================================================
    // FOUNDATION
    // ===================================================

    "ari/system/ari-loader.js",
    "ari/system/ari-authority.js",

    // Shared cognitive operation contracts.
    "ari/contracts/ari-operation-registry.js",

    // ===================================================
    // APPLICATION RUNTIME BOUNDARY SERVICES
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

    // Deterministic evidence aggregation. This replaces semantic frame
    // construction inside Perception.
    "ari/perception/ari-evidence-builder.js",

    "ari/conversation/ari-conversation-function-engine.js",
    "ari/conversation/ari-universal-conversation-classifier.js",
    "ari/observer-system/ari-observer-routing-evidence.js",
    "ari/routing/ari-lane-splitter-engine.js",

    // ===================================================
    // CONTINUITY FOUNDATION
    // ===================================================

    "ari/storage/ari-thread-store.js",
    "ari/storage/ari-memory-store.js",
        "ari/conversation/ari-turn-packet.js",
    "ari/conversation/ari-turn-classification-packet.js",
    "ari/conversation/ari-turn-intake-engine.js",
    "ari/continuity/ari-conversation-operating-state.js",
    "ari/conversation/ari-conversation-meaning-history.js",
    "ari/continuity/ari-conversation-continuity-engine.js",

        // ===================================================
    // CONTINUITY CAPABILITY ENGINES
    // ===================================================

    "ari/context/ari-thread-understanding-engine.js",
    "ari/continuity/ari-elliptical-follow-up-resolver.js",

    // Conversation relationship classification dependencies.
    "ari/conversation/ari-conversation-relationship-rules.js",
    "ari/conversation/ari-conversation-relationship-engine.js",

    "ari/context/ari-reference-packet.js",
    "ari/context/ari-entity-reference-resolver.js",

    "ari/memory/ari-memory-ranking-engine.js",
    "ari/memory/ari-memory-retrieval-engine.js",
    "ari/memory/ari-memory-context-builder.js",
    "ari/memory/ari-memory-candidate-engine.js",

    // Separate interpersonal relationship engine.
    "ari/relationship/ari-relationship-engine.js",

    "ari/context/ari-context-assembler.js",
    // ===================================================
    // CONTINUITY ORCHESTRATION
    // ===================================================

    "ari/continuity/ari-continuity-packet.js",
    "ari/continuity/ari-continuity-entry-point.js",

    // Diagnostic support.
    "ari/context/ari-thread-question-generator.js",

    // ===================================================
    // PERCEPTION RECONCILIATION / SITUATION EVIDENCE
    // ===================================================

    // Semantic frame construction no longer belongs here.
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
    // RESPONSE REALIZATION FOUNDATION
    // ===================================================

    "ari/realization/ari-response-realization-engine.js",
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
    "ari/reasoning/ari-openai-reasoning-client.js",
    "ari/reasoning/ari-reasoning-engine.js",

    // Post-reasoning structural and contract validation.
    "ari/meaning/ari-semantic-frame-validator.js",

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
    // LAYER 3 — DELIBERATION
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
    // LAYER 4 — EXPRESSION
    // ===================================================

    "ari/pipeline-stages/expression/ari-character-stage.js",
    "ari/pipeline-stages/expression/ari-language-guidance-stage.js",
    "ari/pipeline-stages/expression/ari-response-realization-stage.js",
    "ari/pipeline-stages/expression/ari-final-composition-stage.js",

    "ari/pipelines/ari-expression-pipeline.js",

    // ===================================================
    // LAYER 5 — DELIVERY
    // ===================================================

    "ari/pipeline-stages/delivery/ari-action-delivery-stage.js",
    "ari/pipeline-stages/delivery/ari-learning-persistence-stage.js",
    "ari/pipeline-stages/delivery/ari-delivery-diagnostics-stage.js",

    "ari/pipelines/ari-delivery-pipeline.js",

    // ===================================================
    // MASTER FIVE-LAYER RUNTIME
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
    const originalMessage =
      String(
        message ??
        ""
      );

    const timing =
      this.createTimingController(
        options.debugTiming ===
        true
      );

    timing.mark(
      "bridge_ask_started"
    );

    if (
      !originalMessage.trim()
    ) {
      timing.finish();

      return this.makeBridgeResponse({
        reply:
          "Say something first.",

        emotion:
          "idle",

        error: {
          code:
            "empty_current_turn",

          message:
            "A current-turn message is required.",

          source:
            this.source
        },

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
            originalMessage,

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

      const masterPipeline =
  window.AriRebirthPipeline ||
  window.Ari
    ?.rebirthPipeline ||
  null;

if (
  !masterPipeline ||
  typeof masterPipeline.run !==
    "function"
) {
  throw new Error(
    "ari_rebirth_pipeline_unavailable_at_execution"
  );
}

runtimeResult =
  await masterPipeline.run(
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
     REQUEST CONSTRUCTION DELEGATION
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
     REGISTERED COGNITIVE CONTRACT ACCESSORS
  ===================================================== */

  getOperationRegistry() {
    return (
      window.AriOperationRegistry ||
      window.Ari
        ?.operationRegistry ||
      null
    );
  },

  getEvidenceBuilder() {
    return (
      window.AriEvidenceBuilder ||
      window.Ari
        ?.evidenceBuilder ||
      null
    );
  },

  getSemanticFrameValidator() {
    return (
      window.AriSemanticFrameValidator ||
      window.Ari
        ?.semanticFrameValidator ||
      null
    );
  },

  getOpenAIReasoningClient() {
    return (
      window.AriOpenAIReasoningClient ||
      window.Ari
        ?.openAIReasoningClient ||
      null
    );
  },

  getReasoningEngine() {
    return (
      window.AriReasoningEngine ||
      window.Ari
        ?.reasoningEngine ||
      null
    );
  },

  getReasoningStage() {
    return (
      window.AriReasoningStage ||
      window.Ari
        ?.reasoningStage ||
      null
    );
  },

  getResponsePlanningStage() {
    return (
      window.AriResponsePlanningStage ||
      window.Ari
        ?.responsePlanningStage ||
      null
    );
  },

  getDeliberationPipeline() {
    return (
      window.AriDeliberationPipeline ||
      window.Ari
        ?.deliberationPipeline ||
      null
    );
  },
  /* =====================================================
     RUNTIME READINESS DELEGATION
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
     DELIVERY READING DELEGATION
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
     DELIVERY ADAPTATION DELEGATION
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

const runtimeAvailability =
  error?.runtimeAvailability ||
  null;

    const exposeInternalError =
      options.debug ===
        true ||
      options.exposeInternalErrors ===
        true;

    return this.makeBridgeResponse({
      reply:
        publicReply,

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

runtimeAvailability,

        internalErrorExposed:
          exposeInternalError,

        internalError:
          exposeInternalError
            ? normalizedError
            : null,

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
    const normalizedReply =
      this.cleanText(
        reply
      );

    const normalizedEmotion =
      this.normalizeBridgeEmotion(
        emotion
      );

    const normalizedActions =
      this.toArray(
        actions
      );

    const successful =
      deliveryStatus ===
      "delivered";

    return {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        normalizedReply,

      emotion:
        normalizedEmotion,

      actions:
        normalizedActions,

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
          ? "ari_rebirth_runtime_delivery"
          : "ari_rebirth_app_bridge_failure",

      bridgeVersion:
        this.version,

      diagnostics,

      authority: {
        reply:
          successful
            ? "authoritative_runtime_delivery"
            : "bridge_failure_boundary",

        emotion:
          successful
            ? "authoritative_runtime_delivery"
            : "bridge_failure_boundary",

        actions:
          successful
            ? "authoritative_runtime_delivery"
            : "none",

        adaptation:
          this.source
      },

      // Failure-boundary application aliases.
      text:
        normalizedReply,

      message:
        normalizedReply,

      response:
        normalizedReply,

      finalResponse:
        normalizedReply,

      finalEmotion:
        normalizedEmotion,

      approvedActions:
        normalizedActions,

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
            window.Ari
              ?.runtimeRequest
              ?.version ||
            null,

          readinessService:
            window
              .AriRuntimeReadiness
              ?.version ||
            window.Ari
              ?.runtimeReadiness
              ?.version ||
            null,

          deliveryService:
            window
              .AriRuntimeDelivery
              ?.version ||
            window.Ari
              ?.runtimeDelivery
              ?.version ||
            null,

          pipeline:
            window
              .AriRebirthPipeline
              ?.version ||
            window.Ari
              ?.rebirthPipeline
              ?.version ||
            null,

          operationRegistry:
            this.getOperationRegistry()
              ?.version ||
            null,

          evidenceBuilder:
            this.getEvidenceBuilder()
              ?.version ||
            null,

                    semanticFrameValidator:
            this.getSemanticFrameValidator()
              ?.version ||
            null,

          openAIReasoningClient:
            this.getOpenAIReasoningClient()
              ?.version ||
            null,

          reasoningEngine:
            this.getReasoningEngine()
              ?.version ||
            null,

          reasoningStage:
            this.getReasoningStage()
              ?.version ||
            null,

          responsePlanningStage:
            this.getResponsePlanningStage()
              ?.version ||
            null,

          deliberationPipeline:
            this.getDeliberationPipeline()
              ?.version ||
            null,

          reasoningInvokerAvailable:
            typeof this
              .getOpenAIReasoningClient()
              ?.reason ===
            "function",

          reasoningEngineAvailable:
            typeof this
              .getReasoningEngine()
              ?.reason ===
            "function",

          reasoningStageAvailable:
            typeof this
              .getReasoningStage()
              ?.run ===
            "function",

          responsePlanningStageAvailable:
            typeof this
              .getResponsePlanningStage()
              ?.run ===
            "function",

          deliberationPipelineAvailable:
            typeof this
              .getDeliberationPipeline()
              ?.run ===
            "function"
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
            const availability =
  this.getRuntimeAvailability();

this.loaded =
  result === true &&
  availability.ready ===
    true;

if (!this.loaded) {
  console.error(
    "[ARI RUNTIME AVAILABILITY FAILURE]",
    availability
  );

  const missing =
    availability.missing
      .join(",");

  const error =
    new Error(
      missing
        ? `ari_runtime_unavailable_after_script_loading:${missing}`
        : "ari_runtime_unavailable_after_script_loading"
    );

  error.code =
    "ari_runtime_unavailable_after_script_loading";

  error.runtimeAvailability =
    availability;

  throw error;
}

            this.setLoaderDiagnostic(
              "ariLoadingCompleted",
              "true"
            );

            this.removeLoaderDiagnostic(
              "ariLastLoadingScript"
            );

            this.removeLoaderDiagnostic(
              "ariLastLoadingIndex"
            );

            this.removeLoaderDiagnostic(
              "ariLastLoadError"
            );

            this.loadingPromise =
              null;

            return true;
          }
        )
        .catch(
          error => {
            this.loaded =
              false;

            this.loadingPromise =
              null;

            this.setLoaderDiagnostic(
              "ariLoadingCompleted",
              "false"
            );

            this.setLoaderDiagnostic(
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
    this.setLoaderDiagnostic(
      "ariLoadingCompleted",
      "false"
    );

    this.removeLoaderDiagnostic(
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

      this.setLoaderDiagnostic(
        "ariLastLoadingScript",
        src
      );

      this.setLoaderDiagnostic(
        "ariLastLoadingIndex",
        String(
          index
        )
      );

      if (
        this.loaderDebug ===
        true
      ) {
        console.log(
          `[ARI LOADER ${index + 1}/${this.requiredScripts.length}]`,
          src
        );
      }

      await this.loadScriptOnce(
        src
      );

      this.setLoaderDiagnostic(
        "ariLastLoadedScript",
        src
      );

      this.setLoaderDiagnostic(
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

            if (
              this.loaderDebug ===
              true
            ) {
              console.log(
                "[ARI LOADER SUCCESS]",
                cleanSource
              );
            }

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

            this.setLoaderDiagnostic(
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
      if (
        this.loaderDebug ===
        true
      ) {
        console.log(
          "[ARI LOADER ALREADY LOADED]",
          src
        );
      }

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
        "present";

      if (
        this.loaderDebug ===
        true
      ) {
        console.log(
          "[ARI LOADER STATIC SCRIPT PRESENT]",
          src
        );
      }

      return Promise.resolve(
        true
      );
    }

    if (
      this.loaderDebug ===
      true
    ) {
      console.log(
        "[ARI LOADER AWAITING EXISTING SCRIPT]",
        src
      );
    }

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
  const availability =
    this.getRuntimeAvailability();

  return availability.ready ===
    true;
},

getRuntimeAvailability() {
  const requestService =
    window.AriRuntimeRequest ||
    window.Ari
      ?.runtimeRequest ||
    null;

  const readinessService =
    window.AriRuntimeReadiness ||
    window.Ari
      ?.runtimeReadiness ||
    null;

  const deliveryService =
    window.AriRuntimeDelivery ||
    window.Ari
      ?.runtimeDelivery ||
    null;

  const openAIReasoningClient =
    this.getOpenAIReasoningClient();

  const reasoningEngine =
    this.getReasoningEngine();

  const reasoningStage =
    this.getReasoningStage();

  const responsePlanningStage =
    this.getResponsePlanningStage();

  const deliberationPipeline =
    this.getDeliberationPipeline();

  const masterPipeline =
    window.AriRebirthPipeline ||
    window.Ari
      ?.rebirthPipeline ||
    null;

  const checks = {
    runtimeRequestBuild:
      typeof requestService
        ?.build ===
      "function",

    runtimeReadinessCheck:
      typeof readinessService
        ?.check ===
      "function",

    runtimeDeliveryRead:
      typeof deliveryService
        ?.read ===
      "function",

    runtimeDeliveryAdapt:
      typeof deliveryService
        ?.adapt ===
      "function",

    openAIReasoningClientReason:
      typeof openAIReasoningClient
        ?.reason ===
      "function",

    reasoningEngineReason:
      typeof reasoningEngine
        ?.reason ===
      "function",

    reasoningStageRun:
      typeof reasoningStage
        ?.run ===
      "function",

    responsePlanningStageRun:
      typeof responsePlanningStage
        ?.run ===
      "function",

    deliberationPipelineRun:
      typeof deliberationPipeline
        ?.run ===
      "function",

    masterPipelineRun:
      typeof masterPipeline
        ?.run ===
      "function"
  };

  const missing =
    Object.entries(
      checks
    )
      .filter(
        ([
          _name,
          available
        ]) =>
          available !==
          true
      )
      .map(
        ([name]) =>
          name
      );

  return {
    ready:
      missing.length ===
      0,

    checks,

    missing,

    registrations: {
      runtimeRequest:
        requestService
          ? Object.keys(
              requestService
            )
          : [],

      runtimeReadiness:
        readinessService
          ? Object.keys(
              readinessService
            )
          : [],

      runtimeDelivery:
        deliveryService
          ? Object.keys(
              deliveryService
            )
          : [],

      openAIReasoningClient:
        openAIReasoningClient
          ? Object.keys(
              openAIReasoningClient
            )
          : [],

      reasoningEngine:
        reasoningEngine
          ? Object.keys(
              reasoningEngine
            )
          : [],

      reasoningStage:
        reasoningStage
          ? Object.keys(
              reasoningStage
            )
          : [],

      responsePlanningStage:
        responsePlanningStage
          ? Object.keys(
              responsePlanningStage
            )
          : [],

      deliberationPipeline:
        deliberationPipeline
          ? Object.keys(
              deliberationPipeline
            )
          : [],

      masterPipeline:
        masterPipeline
          ? Object.keys(
              masterPipeline
            )
          : []
    }
  };
},

  isMasterPipelineReady() {
    const pipeline =
      window.AriRebirthPipeline ||
      window.Ari
        ?.rebirthPipeline ||
      null;

    return Boolean(
      pipeline &&
      typeof pipeline.run ===
        "function"
    );
  },

  setLoaderDiagnostic(
    key = "",
    value = ""
  ) {
    try {
      sessionStorage.setItem(
        key,
        String(value)
      );
    } catch {
      // Loader diagnostics must never block runtime loading.
    }
  },

  removeLoaderDiagnostic(
    key = ""
  ) {
    try {
      sessionStorage.removeItem(
        key
      );
    } catch {
      // Loader diagnostics must never block runtime loading.
    }
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

      canReturnBoundaryFailures:
        true,

      canDelegateRequestConstruction:
        true,

      canDelegateRuntimeReadiness:
        true,

      canDelegateDeliveryReading:
        true,

      canDelegateDeliveryAdaptation:
        true,

      canBuildCanonicalRuntimeRequest:
        false,

      canInspectRuntimeComponentsDirectly:
        false,

      canReadDeliveryFieldsDirectly:
        false,

      canExecuteRuntimeLayers:
        false,

      canExecuteRuntimeStages:
        false,

      canParticipateInPerception:
        false,

      canParticipateInRouting:
        false,

      canParticipateInDeliberation:
        false,

      canParticipateInExpression:
        false,

      canParticipateInDelivery:
        false,

      canInterpretSemanticMeaning:
        false,

      canResolveContinuity:
        false,

      canDetermineConversationFunction:
        false,

      canDetermineDeveloperIntent:
        false,

      canDetermineSafetySeverity:
        false,

      canChooseResponsePlan:
        false,

      canExecuteResponseRealization:
        false,

      canExecuteFinalComposition:
        false,

      canInferEmotion:
        false,

      canDiscoverActionsFromRuntimeState:
        false,

      canSelectSuccessfulRuntimeResponse:
        false,

      canRewriteSuccessfulRuntimeResponse:
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
        "application_runtime_boundary_and_service_coordination"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canBuildCanonicalRuntimeRequest",
      "canInspectRuntimeComponentsDirectly",
      "canReadDeliveryFieldsDirectly",
      "canExecuteRuntimeLayers",
      "canExecuteRuntimeStages",
      "canParticipateInPerception",
      "canParticipateInRouting",
      "canParticipateInDeliberation",
      "canParticipateInExpression",
      "canParticipateInDelivery",
      "canInterpretSemanticMeaning",
      "canResolveContinuity",
      "canDetermineConversationFunction",
      "canDetermineDeveloperIntent",
      "canDetermineSafetySeverity",
      "canChooseResponsePlan",
      "canExecuteResponseRealization",
      "canExecuteFinalComposition",
      "canInferEmotion",
      "canDiscoverActionsFromRuntimeState",
      "canSelectSuccessfulRuntimeResponse",
      "canRewriteSuccessfulRuntimeResponse",
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

    const requestService =
      window.AriRuntimeRequest ||
      window.Ari
        ?.runtimeRequest ||
      null;

    const readinessService =
      window.AriRuntimeReadiness ||
      window.Ari
        ?.runtimeReadiness ||
      null;

    const deliveryService =
      window.AriRuntimeDelivery ||
      window.Ari
        ?.runtimeDelivery ||
      null;

    const pipeline =
      window.AriRebirthPipeline ||
      window.Ari
        ?.rebirthPipeline ||
      null;

    const operationRegistry =
      this.getOperationRegistry();

    const evidenceBuilder =
      this.getEvidenceBuilder();

    const semanticFrameValidator =
      this.getSemanticFrameValidator();

    const openAIReasoningClient =
      this.getOpenAIReasoningClient();

    const reasoningEngine =
      this.getReasoningEngine();

    const reasoningStage =
      this.getReasoningStage();

    const responsePlanningStage =
      this.getResponsePlanningStage();

    const deliberationPipeline =
      this.getDeliberationPipeline();

    if (
      !requestService ||
      typeof requestService.build !==
        "function"
    ) {
      warnings.push(
        "AriRuntimeRequest_not_ready"
      );
    }

    if (
      !readinessService ||
      typeof readinessService.check !==
        "function"
    ) {
      warnings.push(
        "AriRuntimeReadiness_not_ready"
      );
    }

    if (
      !deliveryService ||
      typeof deliveryService.read !==
        "function" ||
      typeof deliveryService.adapt !==
        "function"
    ) {
      warnings.push(
        "AriRuntimeDelivery_not_ready"
      );
    }

    if (
      !pipeline ||
      typeof pipeline.run !==
        "function"
    ) {
      warnings.push(
        "AriRebirthPipeline_not_ready"
      );
    }

    if (
      !operationRegistry ||
      typeof operationRegistry.getOperation !==
        "function"
    ) {
      warnings.push(
        "AriOperationRegistry_not_ready"
      );
    }

    if (
      !evidenceBuilder ||
      typeof evidenceBuilder.build !==
        "function"
    ) {
      warnings.push(
        "AriEvidenceBuilder_not_ready"
      );
    }

    if (
      !semanticFrameValidator ||
      typeof semanticFrameValidator.validate !==
        "function"
    ) {
      warnings.push(
        "AriSemanticFrameValidator_not_ready"
      );
    }

    if (
      !openAIReasoningClient ||
      typeof openAIReasoningClient.reason !==
        "function"
    ) {
      warnings.push(
        "AriOpenAIReasoningClient_not_ready"
      );
    }

    if (
      !reasoningEngine ||
      typeof reasoningEngine.reason !==
        "function"
    ) {
      warnings.push(
        "AriReasoningEngine_not_ready"
      );
    }

    if (
      !reasoningStage ||
      typeof reasoningStage.run !==
        "function"
    ) {
      warnings.push(
        "AriReasoningStage_not_ready"
      );
    }

    if (
      !responsePlanningStage ||
      typeof responsePlanningStage.run !==
        "function"
    ) {
      warnings.push(
        "AriResponsePlanningStage_not_ready"
      );
    }

    if (
      !deliberationPipeline ||
      typeof deliberationPipeline.run !==
        "function"
    ) {
      warnings.push(
        "AriDeliberationPipeline_not_ready"
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
        "ari-rebirth-app-bridge-validation",

      version:
        this.version,

      errors,

      warnings:
        this.toArray(
          warnings
        ),

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

        operationRegistryRegistered:
          Boolean(
            operationRegistry &&
            typeof operationRegistry.getOperation ===
              "function"
          ),

        evidenceBuilderRegistered:
          Boolean(
            evidenceBuilder &&
            typeof evidenceBuilder.build ===
              "function"
          ),

        semanticFrameValidatorRegistered:
          Boolean(
            semanticFrameValidator &&
            typeof semanticFrameValidator.validate ===
              "function"
          ),

        openAIReasoningClientRegistered:
          Boolean(
            openAIReasoningClient &&
            typeof openAIReasoningClient.reason ===
              "function"
          ),

        reasoningEngineRegistered:
          Boolean(
            reasoningEngine &&
            typeof reasoningEngine.reason ===
              "function"
          ),

        reasoningStageRegistered:
          Boolean(
            reasoningStage &&
            typeof reasoningStage.run ===
              "function"
          ),

        responsePlanningStageRegistered:
          Boolean(
            responsePlanningStage &&
            typeof responsePlanningStage.run ===
              "function"
          ),

        deliberationPipelineRegistered:
          Boolean(
            deliberationPipeline &&
            typeof deliberationPipeline.run ===
              "function"
          ),

        cognitiveReasoningChainRegistered:
          Boolean(
            openAIReasoningClient &&
            typeof openAIReasoningClient.reason ===
              "function" &&

            reasoningEngine &&
            typeof reasoningEngine.reason ===
              "function" &&

            reasoningStage &&
            typeof reasoningStage.run ===
              "function" &&

            responsePlanningStage &&
            typeof responsePlanningStage.run ===
              "function" &&

            deliberationPipeline &&
            typeof deliberationPipeline.run ===
              "function"
          ),

        directRequestConstructionDisabled:
          authority
            .canBuildCanonicalRuntimeRequest ===
          false,

        directRuntimeInspectionDisabled:
          authority
            .canInspectRuntimeComponentsDirectly ===
          false,

        directDeliveryScanningDisabled:
          authority
            .canReadDeliveryFieldsDirectly ===
          false,

        runtimeLayerExecutionDisabled:
          authority
            .canExecuteRuntimeLayers ===
          false,

        runtimeStageExecutionDisabled:
          authority
            .canExecuteRuntimeStages ===
          false,

        responseRealizationDisabled:
          authority
            .canExecuteResponseRealization ===
          false,

        finalCompositionDisabled:
          authority
            .canExecuteFinalComposition ===
          false,

        successfulResponseSelectionDisabled:
          authority
            .canSelectSuccessfulRuntimeResponse ===
          false,

        successfulResponseRewritingDisabled:
          authority
            .canRewriteSuccessfulRuntimeResponse ===
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

const ariRebirthAppBridgeValidation =
  window.AriRebirthAppBridge
    ?.validate?.();

console.log(
  "ARI REBIRTH APP BRIDGE LOADED:",
  window
    .AriRebirthAppBridge
    ?.version,

  ariRebirthAppBridgeValidation
    ?.ready ===
    true
    ? "READY"
    : ariRebirthAppBridgeValidation
        ?.valid ===
        true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariRebirthAppBridgeValidation
);
