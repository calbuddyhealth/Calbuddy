// ari/ari-rebirth-app-bridge.js
// Ari Rebirth App Bridge
//
// Purpose:
// Connect the production CalBuddy interface to the canonical Ari Rebirth
// runtime through one controlled request and delivery boundary.
//
// V2.0.0 — Canonical Runtime Entry / Delivery-Only Output Adapter
//
// Architectural flow:
//
// CalBuddy UI
//      ↓
// Ari Rebirth App Bridge
//      ↓
// Canonical Turn Envelope
//      ↓
// Ari Rebirth Pipeline
//      ↓
// Delivery Pipeline
//      ↓
// Authoritative Delivery Result
//      ↓
// CalBuddy UI Response
//
// Responsibilities:
// - Load Ari Rebirth dependencies in deterministic order.
// - Prevent duplicate or incomplete script loading.
// - Validate the top-level five-layer runtime boundary.
// - Build one canonical current-turn request envelope.
// - Preserve app context and externally supplied evidence.
// - Execute AriRebirthPipeline exactly once per request.
// - Read only the authoritative delivery result.
// - Adapt the delivery result to the CalBuddy UI response shape.
// - Preserve diagnostics without exposing internal failures by default.
// - Enforce approval requirements on outbound app actions.
//
// Non-responsibilities:
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
// - Does not create file-evidence replies.
// - Does not infer the final emotion.
// - Does not discover actions from arbitrary runtime fields.
// - Does not select the final response.
// - Does not write fallback conversational answers.
// - Does not retrieve or store memory.
// - Does not execute application writes.
// - Does not access Supabase directly.
// - Does not persist runtime state beyond loader diagnostics.

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-rebirth-app-bridge",
  authorityLevel: "application_runtime_entry_and_delivery_adapter",

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
    "ari/language/ari-response-validator.js",
    "ari/language/ari-response-compressor.js",

    /*
     * Legacy language composers remain loaded temporarily
     * for compatibility inspection only.
     *
     * The App Bridge never reads their output directly.
     * They should be removed once the main pipeline confirms
     * that no active production stage depends on them.
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

      return this.makeResponse({
        reply:
          "Say something first.",

        emotion:
          "idle",

        deliveryStatus:
          "input_rejected",

        diagnostics: {
          reason:
            "empty_current_turn"
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

      return this.makeFailureResponse({
        publicReply:
          "Ari couldn’t finish loading the response system.",

        error,

        options,

        failureType:
          "runtime_load_failure"
      });
    }

    const readiness =
      this.checkReadiness();

    if (
      readiness.ready !==
      true
    ) {
      console.error(
        "ARI REBIRTH READINESS FAILURE:",
        readiness
      );

      timing.finish();

      return this.makeFailureResponse({
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
          readiness
      });
    }

    const requestEnvelope =
      this.buildRuntimeRequest({
        message:
          cleanMessage,

        options
      });

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

      return this.makeFailureResponse({
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
              .turnId
        }
      });
    }

    const delivery =
      this.readAuthoritativeDelivery(
        runtimeResult
      );

    if (
      delivery.available !==
      true
    ) {
      console.error(
        "ARI REBIRTH DELIVERY RESULT MISSING:",
        {
          delivery,
          runtimeResult
        }
      );

      timing.finish();

      return this.makeFailureResponse({
        publicReply:
          "Ari understood the request, but the final delivery step did not complete.",

        error:
          delivery.reason ||
          "authoritative_delivery_result_missing",

        options,

        failureType:
          "delivery_result_missing",

        summary:
          runtimeResult,

        diagnostics: {
          turnId:
            requestEnvelope
              .turn
              .turnId,

          delivery
        }
      });
    }

    timing.mark(
      "before_delivery_adaptation"
    );

    const response =
      this.adaptDeliveryToAppResponse({
        delivery,
        runtimeResult,
        requestEnvelope,
        options
      });

    timing.mark(
      "after_delivery_adaptation"
    );

    timing.finish();

    return response;
  },

  /* =====================================================
     CANONICAL RUNTIME REQUEST
  ===================================================== */

  buildRuntimeRequest({
    message = "",
    options = {}
  } = {}) {
    const cleanMessage =
      this.cleanText(
        message
      );

    const now =
      new Date();

    const turnId =
      this.resolveTurnId(
        options.turnId
      );

    const source =
      options.source ||
      "calbuddy-health";

    const githubFileContext =
      options.githubFileContext ||
      null;

    const githubEvidence =
      options.githubEvidence ||
      githubFileContext ||
      null;

    const developerInvestigation =
      options.developerInvestigation ||
      null;

    const history =
      this.toArray(
        options.history
      ).slice(
        -20
      );

    const normalizedText =
      this.normalizeText(
        cleanMessage
      );

    const appContext = {
      schema:
        "ari_app_context",

      schemaVersion:
        this.schemaVersion,

      source,

      appMode:
        "rebirth-only",

      page:
        options.page ||
        "unknown",

      debugTiming:
        options.debugTiming ===
        true,

      ownerMode:
        options.ownerMode ===
        true,

      userContext:
        options.userContext ||
        null,

      coachMemorySummary:
        options
          .coachMemorySummary ||
        "",

      goals:
        options.goals ||
        null,

      meals:
        this.toArray(
          options.meals
        ),

      todayLog:
        this.toArray(
          options.todayLog
        ),

      recentMeals:
        this.toArray(
          options.recentMeals
        ),

      favoriteFoods:
        this.toArray(
          options.favoriteFoods
        ),

      recentWeights:
        this.toArray(
          options.recentWeights
        ),

      user:
        options.user ||
        null,

      ariPermissions:
        options.ariPermissions ||
        {},

      history,

      externalEvidence: {
        githubFileContext,

        githubEvidence,

        developerInvestigation,

        source:
          githubEvidence
            ? "app_supplied_github_evidence"
            : developerInvestigation
              ? "app_supplied_developer_investigation"
              : "none"
      },

      permissions: {
        allowDirectWrites:
          false,

        requireApprovalForActions:
          true,

        allowToolExecution:
          false,

        allowMemoryPersistence:
          options
            .allowMemoryPersistence ===
          true
      },

      authority:
        "application_context_only"
    };

    return {
      schema:
        "ari_rebirth_runtime_request",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      bridgeVersion:
        this.version,

      createdAt:
        now.toISOString(),

      debugTiming:
        options.debugTiming ===
        true,

      turn: {
        schema:
          "ari_runtime_turn",

        schemaVersion:
          this.schemaVersion,

        turnId,

        originalText:
          cleanMessage,

        currentText:
          cleanMessage,

        effectiveText:
          cleanMessage,

        semanticInputText:
          cleanMessage,

        normalizedText,

        source,

        createdAt:
          now.toISOString(),

        textWasRewritten:
          false,

        originalTextPreserved:
          true,

        currentTurnWasResolved:
          false,

        ellipticalFollowUpResolved:
          false,

        resolutionSource:
          "none",

        authority:
          "canonical_current_turn_input"
      },

      /*
       * Compatibility aliases remain available while the
       * five-layer pipeline migrates fully to `turn`.
       *
       * These values all point to the current turn and must
       * never be populated from previous-turn state.
       */
      currentTurnId:
        turnId,

      turnId,

      userMessage:
        cleanMessage,

      originalUserMessage:
        cleanMessage,

      message:
        cleanMessage,

      input:
        cleanMessage,

      currentTurnText:
        cleanMessage,

      semanticInputText:
        cleanMessage,

      normalizedMessage:
        normalizedText,

      resolvedUserQuestion:
        null,

      resolvedCurrentTurn:
        null,

      currentTurnWasResolved:
        false,

      ellipticalFollowUpResolved:
        false,

      resolutionSource:
        "none",

      /*
       * Externally supplied evidence is passed into the
       * runtime but does not become an answer at the bridge.
       */
      githubFileContext,

      githubEvidence,

      developerInvestigation,

      appContext,

      runtimePolicy: {
        runMasterPipelineOnce:
          true,

        allowLegacyPipelineFallback:
          false,

        requireAuthoritativeDelivery:
          true,

        bridgeMaySelectDraft:
          false,

        bridgeMayComposeResponse:
          false,

        bridgeMayInferEmotion:
          false,

        bridgeMayInferActions:
          false,

        bridgeMayDetermineDeveloperIntent:
          false,

        bridgeMayCreateFileEvidenceReply:
          false,

        authority:
          "runtime_entry_policy"
      }
    };
  },

  resolveTurnId(
    suppliedTurnId = null
  ) {
    const supplied =
      this.cleanText(
        suppliedTurnId
      );

    if (supplied) {
      return supplied;
    }

    const random =
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : [
            Date.now()
              .toString(36),

            Math.random()
              .toString(36)
              .slice(
                2,
                10
              )
          ].join(
            "_"
          );

    return `ari_turn_${random}`;
  },

  /* =====================================================
     AUTHORITATIVE DELIVERY READING
  ===================================================== */

  readAuthoritativeDelivery(
    runtimeResult = {}
  ) {
    const result =
      runtimeResult &&
      typeof runtimeResult ===
        "object"
        ? runtimeResult
        : {};

    const deliveryResult =
      this.firstObject([
        result.deliveryResult,

        result.deliveryPipelineResult,

        result.deliveryStageResult,

        result.deliveryPacket,

        result.deliveryPipelinePacket
          ?.result,

        result.deliveryPipelinePacket
          ?.deliveryResult,

        result.deliveryPipelinePacket,

        result.deliveryDiagnosticsStagePacket
          ?.deliveryResult,

        result.finalDelivery
      ]);

    const deliveryText =
      this.extractDeliveryText(
        deliveryResult
      );

    if (deliveryText) {
      return {
        available:
          true,

        authoritative:
          true,

        source:
          deliveryResult.source ||
          result.deliveryPipelineSource ||
          "ari-delivery-pipeline",

        version:
          deliveryResult.version ||
          result.deliveryPipelineVersion ||
          null,

        status:
          deliveryResult.status ||
          deliveryResult.deliveryStatus ||
          "delivered",

        reply:
          deliveryText,

        emotion:
          this.readDeliveryEmotion(
            deliveryResult
          ),

        actions:
          this.readDeliveryActions(
            deliveryResult
          ),

        developerIntent:
          deliveryResult
            .developerIntent ||
          result.deliveryDeveloperIntent ||
          null,

        diagnostics:
          deliveryResult
            .diagnostics ||
          result.deliveryDiagnostics ||
          null,

        error:
          deliveryResult.error ||
          null,

        raw:
          deliveryResult,

        authority:
          "authoritative_delivery_result"
      };
    }

    /*
     * Transitional compatibility:
     *
     * Until the main pipeline emits a dedicated deliveryResult,
     * a top-level finalResponse may be accepted only when the
     * pipeline explicitly reports that final composition or
     * delivery completed.
     *
     * The bridge does not search selectedDraft, languageBody,
     * synthesis questions, recovery questions, or arbitrary
     * answer fields.
     */
    const deliveryCompleted =
      result.deliveryPipelineRan ===
        true ||
      result.deliveryStageRan ===
        true ||
      result.deliveryComplete ===
        true ||
      result.finalCompositionStageRan ===
        true ||
      result.finalCompositionComplete ===
        true;

    const compatibilityText =
      deliveryCompleted
        ? this.extractResponseText(
            result.finalResponse
          )
        : "";

    if (compatibilityText) {
      return {
        available:
          true,

        authoritative:
          false,

        compatibilityFallback:
          true,

        source:
          "top_level_final_response_compatibility",

        version:
          null,

        status:
          "delivered_with_compatibility_fallback",

        reply:
          compatibilityText,

        emotion:
          this.readDeliveryEmotion({
            emotion:
              result.deliveryEmotion ||
              result.finalEmotion ||
              result.emotion ||
              null
          }),

        actions:
          this.readDeliveryActions({
            actions:
              result.deliveredActions ||
              result.approvedActions ||
              []
          }),

        developerIntent:
          result.deliveryDeveloperIntent ||
          null,

        diagnostics: {
          warning:
            "dedicated_delivery_result_missing",

          deliveryCompleted
        },

        error:
          null,

        raw: {
          finalResponse:
            result.finalResponse
        },

        authority:
          "temporary_final_response_compatibility"
      };
    }

    return {
      available:
        false,

      authoritative:
        false,

      source:
        null,

      status:
        "missing",

      reply:
        "",

      emotion:
        "idle",

      actions:
        [],

      developerIntent:
        null,

      diagnostics:
        null,

      error:
        null,

      reason:
        deliveryCompleted
          ? "delivery_completed_without_user_facing_reply"
          : "delivery_pipeline_did_not_report_completion",

      authority:
        "no_delivery_result"
    };
  },

  firstObject(
    values = []
  ) {
    return (
      this.toArray(
        values
      ).find(
        value =>
          value &&
          typeof value ===
            "object" &&
          !Array.isArray(
            value
          )
      ) ||
      null
    );
  },

  extractDeliveryText(
    delivery = null
  ) {
    if (!delivery) {
      return "";
    }

    if (
      typeof delivery ===
      "string"
    ) {
      return this.cleanText(
        delivery
      );
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

    for (
      const candidate
      of candidates
    ) {
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
      candidate ===
        null ||
      candidate ===
        undefined
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
      return String(
        candidate
      ).trim();
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

    if (
      nested ===
      candidate
    ) {
      return "";
    }

    return this.extractResponseText(
      nested
    );
  },

  readDeliveryEmotion(
    delivery = {}
  ) {
    const value =
      this.normalizeIdentifier(
        delivery.emotion ||
        delivery.uiEmotion ||
        delivery.presentation
          ?.emotion ||
        delivery.ui
          ?.emotion ||
        ""
      );

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
      value
    )
      ? value
      : "idle";
  },

  readDeliveryActions(
    delivery = {}
  ) {
    const rawActions =
      delivery.approvedActions ||
      delivery.deliveredActions ||
      delivery.actions ||
      delivery.actionDelivery
        ?.approvedActions ||
      delivery.actionDelivery
        ?.actions ||
      [];

    return this.toArray(
      rawActions
    )
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
     APP RESPONSE ADAPTATION
  ===================================================== */

  adaptDeliveryToAppResponse({
    delivery = {},
    runtimeResult = {},
    requestEnvelope = {},
    options = {}
  } = {}) {
    const reply =
      this.cleanReply(
        delivery.reply
      );

    if (!reply) {
      return this.makeFailureResponse({
        publicReply:
          "Ari’s final response was empty.",

        error:
          "authoritative_delivery_reply_empty",

        options,

        failureType:
          "empty_delivery_reply",

        summary:
          runtimeResult,

        diagnostics: {
          delivery,

          turnId:
            requestEnvelope
              .turn
              ?.turnId ||
            null
        }
      });
    }

    return this.makeResponse({
      reply,

      emotion:
        delivery.emotion ||
        "idle",

      actions:
        delivery.actions,

      developerIntent:
        delivery.developerIntent ||
        null,

      summary:
        options.includeSummary ===
          false
          ? null
          : runtimeResult,

      analysis:
        null,

      error:
        delivery.error ||
        null,

      deliveryStatus:
        delivery.status ||
        "delivered",

      diagnostics: {
        bridge: {
          source:
            this.source,

          version:
            this.version,

          schemaVersion:
            this.schemaVersion
        },

        turn: {
          turnId:
            requestEnvelope
              .turn
              ?.turnId ||
            null,

          source:
            requestEnvelope
              .turn
              ?.source ||
            null
        },

        delivery: {
          available:
            delivery.available ===
            true,

          authoritative:
            delivery.authoritative ===
            true,

          compatibilityFallback:
            delivery
              .compatibilityFallback ===
            true,

          source:
            delivery.source ||
            null,

          version:
            delivery.version ||
            null,

          status:
            delivery.status ||
            null,

          diagnostics:
            delivery.diagnostics ||
            null
        }
      }
    });
  },

  makeFailureResponse({
    publicReply = "Ari hit an internal response error.",
    error = null,
    options = {},
    failureType = "internal_error",
    summary = null,
    diagnostics = null
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

    return this.makeResponse({
      reply,

      emotion:
        "concerned",

      actions:
        [],

      developerIntent:
        null,

      summary:
        options.includeSummary ===
          false
          ? null
          : summary,

      analysis:
        null,

      error:
        normalizedError,

      deliveryStatus:
        "failed",

      diagnostics: {
        failureType,

        detail:
          diagnostics,

        internalErrorExposed:
          exposeInternalError
      }
    });
  },

  makeResponse({
    reply = "",
    emotion = "idle",
    actions = [],
    developerIntent = null,
    summary = null,
    analysis = null,
    error = null,
    deliveryStatus = "delivered",
    diagnostics = null
  } = {}) {
    return {
      schema:
        "ari_rebirth_app_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        this.cleanReply(
          reply
        ),

      emotion:
        this.readDeliveryEmotion({
          emotion
        }),

      actions:
        this.toArray(
          actions
        ),

      developerIntent,

      summary,

      analysis,

      error,

      deliveryStatus,

      diagnostics,

      source:
        this.source,

      bridgeVersion:
        this.version,

      authority:
        "application_delivery_adapter"
    };
  },

  cleanReply(
    reply = ""
  ) {
    return this.cleanText(
      reply
    );
  },

  /* =====================================================
     RUNTIME READINESS
  ===================================================== */

  checkReadiness() {
    const required = {
      AriPerceptionPipeline:
        window.AriPerceptionPipeline,

      AriExecutiveRoutingPipeline:
        window
          .AriExecutiveRoutingPipeline,

      AriDeliberationPipeline:
        window.AriDeliberationPipeline,

      AriExpressionPipeline:
        window.AriExpressionPipeline,

      AriDeliveryPipeline:
        window.AriDeliveryPipeline,

      AriRebirthPipeline:
        window.AriRebirthPipeline
    };

    const missing =
      Object.entries(
        required
      )
        .filter(
          ([
            _name,
            component
          ]) =>
            !component ||
            typeof component.run !==
              "function"
        )
        .map(
          ([
            name
          ]) =>
            name
        );

    if (
      missing.length
    ) {
      return {
        ready:
          false,

        source:
          "ari-rebirth-app-bridge-readiness",

        reason:
          "required_runtime_boundaries_missing",

        missing,

        error:
          `missing_components:${missing.join(",")}`,

        message:
          `Ari Rebirth is missing required runtime boundaries: ${missing.join(", ")}.`,

        authority:
          "top_level_runtime_boundary_validation"
      };
    }

    const layerValidation =
      this.validateLayerContracts(
        required
      );

    return {
      ready:
        layerValidation.valid ===
        true,

      source:
        "ari-rebirth-app-bridge-readiness",

      checkedComponents:
        Object.keys(
          required
        ),

      layerValidation,

      reason:
        layerValidation.valid
          ? "top_level_runtime_ready"
          : "one_or_more_runtime_layers_invalid",

      error:
        layerValidation.valid
          ? null
          : "runtime_layer_validation_failed",

      authority:
        "top_level_runtime_boundary_validation"
    };
  },

  validateLayerContracts(
    required = {}
  ) {
    const results = [];

    Object.entries(
      required
    ).forEach(
      ([
        name,
        component
      ]) => {
        let validation =
          null;

        if (
          typeof component
            ?.validate ===
          "function"
        ) {
          try {
            validation =
              component
                .validate();
          } catch (error) {
            validation = {
              valid:
                false,

              errors: [
                error?.message ||
                String(
                  error
                )
              ]
            };
          }
        }

        results.push({
          name,

          callable:
            typeof component
              ?.run ===
            "function",

          validationAvailable:
            Boolean(
              validation
            ),

          validation,

          valid:
            typeof component
              ?.run ===
              "function" &&
            (
              !validation ||
              validation.valid !==
                false
            )
        });
      }
    );

    const invalid =
      results.filter(
        item =>
          item.valid !==
          true
      );

    return {
      valid:
        invalid.length ===
        0,

      results,

      invalidLayers:
        invalid.map(
          item =>
            item.name
        ),

      authority:
        "runtime_layer_contract_inspection"
    };
  },

  /* =====================================================
     SCRIPT LOADING
  ===================================================== */

  async ensureLoaded() {
    if (
      this.loaded ===
        true &&
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
              this.isMasterPipelineReady();

            if (
              !this.loaded
            ) {
              throw new Error(
                "ari_master_pipeline_unavailable_after_script_loading"
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

      /*
       * Yield periodically so mobile Safari can process
       * script evaluation and release temporary resources.
       */
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
    return [
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
    null;
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

    /*
     * Scripts included directly in HTML may not contain
     * Ari loader metadata. If document parsing has already
     * moved beyond loading, assume the synchronously included
     * script has completed evaluation.
     */
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

    return {
      enabled,
      entries,
      mark,
      finish
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canLoadRuntimeScripts:
        true,

      canValidateTopLevelRuntime:
        true,

      canBuildCanonicalTurnEnvelope:
        true,

      canAttachApplicationContext:
        true,

      canAttachExternalEvidence:
        true,

      canRunMasterPipeline:
        true,

      canReadAuthoritativeDelivery:
        true,

      canAdaptDeliveryForApplication:
        true,

      canRequireActionApproval:
        true,

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
        "application_runtime_entry_and_authoritative_delivery_adapter"
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
        masterPipelineOnly:
          true,

        canonicalTurnEnvelope:
          true,

        authoritativeDeliveryOnly:
          true,

        arbitraryReplyScanningRemoved:
          true,

        directFileEvidenceReplyRemoved:
          true,

        developerIntentInferenceRemoved:
          true,

        emotionInferenceRemoved:
          true,

        arbitraryActionDiscoveryRemoved:
          true,

        draftSelectionDisabled:
          authority
            .canSelectFinalResponse ===
          false,

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

  normalizeText(
    value = ""
  ) {
    return this.cleanText(
      value
    )
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