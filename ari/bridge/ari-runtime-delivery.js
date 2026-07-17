// ari/bridge/ari-runtime-delivery.js
// Ari Runtime Delivery
//
// Purpose:
// Read the authoritative Delivery output produced by the Ari Rebirth runtime
// and adapt it into the stable application response contract expected by
// CalBuddy Health, Ari Lab, and the Ari Rebirth App Bridge.
//
// V2.0.0 — Canonical Five-Layer Runtime State / Rebirth-Native Diagnostics
//
// Responsibilities:
// - Resolve the canonical completed runtime state.
// - Locate and validate the authoritative Delivery result.
// - Extract reply, emotion, approved actions, and developer intent.
// - Preserve the complete runtime state for diagnostics.
// - Build fresh diagnostics from canonical Rebirth flags and packets.
// - Avoid accepting stale compact summaries as runtime truth.
// - Adapt Delivery into the stable application response contract.
// - Preserve migration compatibility fields.
//
// Non-responsibilities:
// - Does not execute the runtime.
// - Does not classify, deliberate, compose, or generate language.
// - Does not infer emotion, actions, developer intent, or safety.
// - Does not retrieve, store, or persist memory.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriRuntimeDelivery = {
  version: "2.0.0",
  schemaVersion: "3.0.0",
  source: "ari-runtime-delivery",
  authorityLevel:
    "canonical_runtime_delivery_reading_and_application_adaptation",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  read(runtimeOutput = null, options = {}) {
    const normalizedOptions =
      this.normalizeOptions(options);

    const runtimeState =
      this.resolveRuntimeState(runtimeOutput);

    const deliveryCandidate =
      this.resolveDeliveryCandidate(runtimeState);

    const deliveryResult =
      this.normalizeDeliveryResult({
        runtimeState,
        deliveryCandidate,
        options: normalizedOptions
      });

    const validation =
      this.validateDeliveryResult(deliveryResult);

    return {
      ...deliveryResult,

      runtimeDeliveryValidation:
        validation,

      runtimeDeliveryReady:
        validation.valid === true,

      runtimeDeliverySource:
        this.source,

      runtimeDeliveryVersion:
        this.version,

      runtimeDeliverySchemaVersion:
        this.schemaVersion
    };
  },

  adapt(input = null, options = {}) {
    const normalizedOptions =
      this.normalizeOptions(options);

    const delivery =
      this.isNormalizedDeliveryResult(input)
        ? input
        : this.read(
            input,
            normalizedOptions
          );

    const validation =
      delivery?.runtimeDeliveryValidation ||
      this.validateDeliveryResult(delivery);

    if (validation.valid !== true) {
      return this.buildFailureResponse({
        delivery,
        validation,
        options: normalizedOptions
      });
    }

    const response = {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        this.resolveReply(delivery),

      emotion:
        this.resolveEmotion(delivery),

      actions:
        this.resolveActions(delivery),

      developerIntent:
        this.resolveDeveloperIntent(
          delivery
        ),

      summary:
        this.resolveSummary({
          delivery,
          options: normalizedOptions
        }),

      error:
        null,

      ok:
        true,

      success:
        true,

      complete:
        true,

      deliveryStatus:
        delivery.deliveryStatus ||
        "delivered",

      source:
        delivery.source ||
        "ari-delivery-pipeline",

      responseSource:
        "authoritative_runtime_delivery",

      runtimeDeliverySource:
        this.source,

      runtimeDeliveryVersion:
        this.version,

      turnId:
        delivery.turnId ||
        null,

      currentTurnId:
        delivery.turnId ||
        null,

      createdAt:
        delivery.createdAt ||
        new Date().toISOString(),

      completedAt:
        delivery.completedAt ||
        null,

      diagnostics:
        this.buildAppDiagnostics({
          delivery,
          validation
        }),

      authority: {
        reply:
          "delivery_pipeline",

        emotion:
          "delivery_pipeline",

        actions:
          "delivery_pipeline",

        developerIntent:
          "upstream_runtime_preserved_by_delivery",

        summary:
          "canonical_completed_runtime_state",

        adaptation:
          this.source
      }
    };

    return this.attachCompatibilityFields({
      response,
      delivery,
      options: normalizedOptions
    });
  },

  readAndAdapt(
    runtimeOutput = null,
    options = {}
  ) {
    return this.adapt(
      this.read(
        runtimeOutput,
        options
      ),
      options
    );
  },

  /* =====================================================
     RUNTIME STATE RESOLUTION
  ===================================================== */

  resolveRuntimeState(runtimeOutput = null) {
    if (!this.isPlainObject(runtimeOutput)) {
      return {};
    }

    const candidates = [
      runtimeOutput.runtimeState,
      runtimeOutput.canonicalRuntimeState,
      runtimeOutput.pipelineState,
      runtimeOutput.state,
      runtimeOutput.result,
      runtimeOutput.output,
      runtimeOutput
    ];

    for (const candidate of candidates) {
      if (
        this.looksLikeRuntimeState(
          candidate
        )
      ) {
        return candidate;
      }
    }

    /*
     * Keep the original object only as a compatibility fallback.
     * buildRuntimeSummary() will still refuse to trust a compact
     * supplied summary as canonical runtime evidence.
     */
    return runtimeOutput;
  },

  looksLikeRuntimeState(value = {}) {
    if (!this.isPlainObject(value)) {
      return false;
    }

    const hasRequestEvidence =
      Boolean(
        value.runtimeRequest ||
        value.requestEnvelope ||
        value.request ||
        value.turn ||
        value.currentTurn ||
        value.userMessage ||
        value.originalUserMessage ||
        value.resolvedUserQuestion ||
        value.currentTurnId ||
        value.turnId
      );

    const hasCanonicalPackets =
      Boolean(
        value.perceptionPacket ||
        value.executivePacket ||
        value.executiveRoutingPacket ||
        value.deliberationPacket ||
        value.expressionPacket ||
        value.deliveryPacket ||
        value.deliveryResult
      );

    const hasPipelineFlags =
      Boolean(
        value.perceptionPipelineRan === true ||
        value.executiveRoutingPipelineRan === true ||
        value.deliberationPipelineRan === true ||
        value.expressionPipelineRan === true ||
        value.deliveryPipelineRan === true
      );

    const hasLifecycleEvidence =
      Boolean(
        value.lifecycle ||
        value.pipelineLifecycle ||
        value.pipelineTiming ||
        value.timing ||
        value.pipelineLayerResults ||
        value.layerResults ||
        value.pipelineLifecycleErrors ||
        value.lifecycleErrors ||
        value.runtimeArchitecture
      );

    const hasResponseEvidence =
      Boolean(
        value.finalResponse ||
        value.finalReply ||
        value.finalComposition ||
        value.expressionResult
      );

    return Boolean(
      hasRequestEvidence ||
      hasCanonicalPackets ||
      hasPipelineFlags ||
      hasLifecycleEvidence ||
      hasResponseEvidence
    );
  },

  /* =====================================================
     DELIVERY CANDIDATE RESOLUTION
  ===================================================== */

  resolveDeliveryCandidate(
    runtimeState = {}
  ) {
    if (!this.isPlainObject(runtimeState)) {
      return null;
    }

    const candidates = [
      runtimeState.deliveryPacket,
      runtimeState.deliveryResult,
      runtimeState.authoritativeDelivery,
      runtimeState.deliveryPipelineResult,
      runtimeState.delivery,

      runtimeState.pipelineResult
        ?.deliveryPacket,

      runtimeState.pipelineResult
        ?.deliveryResult,

      runtimeState.result
        ?.deliveryPacket,

      runtimeState.result
        ?.deliveryResult,

      runtimeState.output
        ?.deliveryPacket,

      runtimeState.output
        ?.deliveryResult
    ];

    for (const candidate of candidates) {
      if (this.isPlainObject(candidate)) {
        return candidate;
      }
    }

    return null;
  },

  /* =====================================================
     DELIVERY NORMALIZATION
  ===================================================== */

  normalizeDeliveryResult({
    runtimeState = {},
    deliveryCandidate = null,
    options = {}
  } = {}) {
    const candidate =
      this.isPlainObject(
        deliveryCandidate
      )
        ? deliveryCandidate
        : {};

    const reply =
      this.extractReply({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const emotion =
      this.extractEmotion({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const actions =
      this.extractActions({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const developerIntent =
      this.extractDeveloperIntent({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const runtimeError =
      this.extractRuntimeError({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const complete =
      this.resolveCompletionStatus({
        runtimeState,
        deliveryCandidate:
          candidate,
        reply
      });

    const authoritative =
      this.resolveAuthoritativeStatus({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const deliveryStatus =
      this.resolveDeliveryStatus({
        runtimeState,
        deliveryCandidate:
          candidate,
        complete,
        authoritative,
        runtimeError,
        reply
      });

    const turnId =
      this.extractTurnId({
        runtimeState,
        deliveryCandidate:
          candidate
      });

    const summary =
      this.buildRuntimeSummary({
        runtimeState,
        deliveryCandidate:
          candidate,
        options
      });

    return {
      schema:
        "ari_runtime_delivery_result",

      schemaVersion:
        this.schemaVersion,

      source:
        this.cleanText(
          candidate.source ||
          candidate.deliverySource ||
          candidate.deliveryPipelineSource ||
          runtimeState.deliveryPipelineSource ||
          runtimeState.deliverySource ||
          "ari-delivery-pipeline"
        ) ||
        "ari-delivery-pipeline",

      reply,
      emotion,
      actions,
      developerIntent,
      summary,

      error:
        runtimeError,

      complete,
      authoritative,
      deliveryStatus,

      delivered:
        deliveryStatus ===
        "delivered",

      turnId,

      createdAt:
        candidate.createdAt ||
        runtimeState.createdAt ||
        runtimeState.startedAt ||
        null,

      completedAt:
        candidate.completedAt ||
        runtimeState.completedAt ||
        runtimeState.finishedAt ||
        null,

      rawDeliveryResult:
        candidate,

      /*
       * The complete runtime state remains attached to the normalized
       * Delivery result. adapt() may therefore receive the normalized
       * result without losing lifecycle, timing, or packet evidence.
       */
      runtimeState,

      evidence: {
        runtimeStateAvailable:
          Object.keys(
            runtimeState
          ).length > 0,

        deliveryCandidateAvailable:
          Boolean(
            deliveryCandidate
          ),

        replyAvailable:
          Boolean(reply),

        emotionAvailable:
          Boolean(emotion),

        actionsAvailable:
          actions.length > 0,

        developerIntentAvailable:
          Boolean(
            developerIntent
          ),

        runtimeErrorAvailable:
          Boolean(
            runtimeError
          ),

        perceptionPipelineRan:
          this.didPipelineRun(
            runtimeState,
            "perception"
          ),

        executiveRoutingPipelineRan:
          this.didPipelineRun(
            runtimeState,
            "routing"
          ),

        deliberationPipelineRan:
          this.didPipelineRun(
            runtimeState,
            "deliberation"
          ),

        expressionPipelineRan:
          this.didPipelineRun(
            runtimeState,
            "expression"
          ),

        deliveryPipelineRan:
          this.didPipelineRun(
            runtimeState,
            "delivery"
          ),

        authoritative,
        complete
      },

      authority: {
        canReadDelivery:
          true,

        canNormalizeDelivery:
          true,

        canAdaptApplicationResponse:
          true,

        canPreserveCanonicalRuntimeState:
          true,

        canGenerateReply:
          false,

        canInferEmotion:
          false,

        canInventActions:
          false,

        canDetermineDeveloperIntent:
          false,

        canExecuteActions:
          false,

        canPersistState:
          false,

        role:
          "canonical_authoritative_delivery_reading"
      }
    };
  },

  /* =====================================================
     REPLY EXTRACTION
  ===================================================== */

  extractReply({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const candidateValues = [
      deliveryCandidate.reply,
      deliveryCandidate.text,
      deliveryCandidate.finalResponse,
      deliveryCandidate.response,
      deliveryCandidate.message,
      deliveryCandidate.content,
      deliveryCandidate.outputText,
      deliveryCandidate.userFacingText,

      deliveryCandidate.response
        ?.text,

      deliveryCandidate.response
        ?.reply,

      deliveryCandidate.result
        ?.reply,

      deliveryCandidate.result
        ?.text,

      deliveryCandidate.payload
        ?.reply,

      deliveryCandidate.payload
        ?.text,

      deliveryCandidate.payload
        ?.response,

      runtimeState.finalResponse,
      runtimeState.finalReply,
      runtimeState.responseText,
      runtimeState.userFacingResponse,

      runtimeState.finalComposition
        ?.reply,

      runtimeState.finalComposition
        ?.text,

      runtimeState.finalComposition
        ?.response,

      runtimeState.expressionPacket
        ?.finalResponse,

      runtimeState.expressionPacket
        ?.reply,

      runtimeState.expressionPacket
        ?.text,

      runtimeState.expressionPacket
        ?.result
        ?.finalResponse,

      runtimeState.expressionPacket
        ?.result
        ?.reply,

      runtimeState.expressionPacket
        ?.result
        ?.text,

      runtimeState.expressionResult
        ?.reply,

      runtimeState.expressionResult
        ?.text,

      runtimeState.composerResult
        ?.reply,

      runtimeState.composerResult
        ?.text
    ];

    for (const value of candidateValues) {
      const text =
        this.extractTextValue(value);

      if (text) {
        return text;
      }
    }

    return "";
  },

  extractTextValue(value = null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return this.cleanText(value);
    }

    if (!this.isPlainObject(value)) {
      return "";
    }

    const nestedCandidates = [
      value.reply,
      value.text,
      value.content,
      value.message,
      value.response,
      value.output,
      value.final,
      value.finalResponse,
      value.userFacingText
    ];

    for (
      const candidate
      of nestedCandidates
    ) {
      if (candidate === value) {
        continue;
      }

      const text =
        this.extractTextValue(
          candidate
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  resolveReply(delivery = {}) {
    return this.cleanText(
      delivery.reply
    );
  },

  /* =====================================================
     EMOTION EXTRACTION
  ===================================================== */

  extractEmotion({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const candidates = [
      deliveryCandidate.emotion,
      deliveryCandidate.finalEmotion,
      deliveryCandidate.displayEmotion,
      deliveryCandidate.mood,
      deliveryCandidate.expression,

      deliveryCandidate.response
        ?.emotion,

      deliveryCandidate.result
        ?.emotion,

      deliveryCandidate.payload
        ?.emotion,

      deliveryCandidate.payload
        ?.finalEmotion,

      runtimeState.finalEmotion,
      runtimeState.deliveryEmotion,
      runtimeState.selectedEmotion,
      runtimeState.emotion,

      runtimeState.deliveryPacket
        ?.emotion,

      runtimeState.deliveryPacket
        ?.response
        ?.emotion,

      runtimeState.expressionPacket
        ?.emotion,

      runtimeState.expressionPacket
        ?.result
        ?.emotion,

      runtimeState.finalComposition
        ?.emotion,

      runtimeState.expressionResult
        ?.emotion,

      runtimeState.characterResult
        ?.emotion
    ];

    for (const candidate of candidates) {
      const emotion =
        this.normalizeEmotion(candidate);

      if (emotion) {
        return emotion;
      }
    }

    return "neutral";
  },

  normalizeEmotion(value = null) {
    if (this.isPlainObject(value)) {
      value =
        value.name ||
        value.emotion ||
        value.label ||
        value.type ||
        "";
    }

    const normalized =
      this.normalizeIdentifier(value);

    if (!normalized) {
      return "";
    }

    const aliases = {
      idle:
        "neutral",

      idle_open:
        "neutral",

      neutral_idle:
        "neutral",

      concern:
        "concerned",

      concern_emotion:
        "concerned",

      happiness:
        "happy",

      joy:
        "happy",

      celebration:
        "celebrate",

      celebratory:
        "celebrate",

      sadness:
        "sad",

      anger:
        "mad",

      angry:
        "mad",

      coaching:
        "coach",

      surprise:
        "wow",

      surprised:
        "wow",

      laughter:
        "laugh",

      listening_mode:
        "listening",

      log:
        "logging",

      logged:
        "logging",

      successful:
        "success",

      thinking_mode:
        "thinking"
    };

    return (
      aliases[normalized] ||
      normalized
    );
  },

  resolveEmotion(delivery = {}) {
    return (
      this.normalizeEmotion(
        delivery.emotion
      ) ||
      "neutral"
    );
  },

  /* =====================================================
     ACTION EXTRACTION
  ===================================================== */

  extractActions({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const collections = [
      deliveryCandidate.actions,
      deliveryCandidate.approvedActions,
      deliveryCandidate.applicationActions,
      deliveryCandidate.actionPlan,

      deliveryCandidate.payload
        ?.actions,

      deliveryCandidate.payload
        ?.approvedActions,

      runtimeState.approvedActions,
      runtimeState.deliveryActions,
      runtimeState.applicationActions,
      runtimeState.actions,

      runtimeState.deliveryPacket
        ?.actions,

      runtimeState.deliveryPacket
        ?.approvedActions,

      runtimeState.actionGovernance
        ?.approvedActions,

      runtimeState.finalComposition
        ?.actions
    ];

    for (const collection of collections) {
      const normalized =
        this.normalizeActions(
          collection
        );

      if (normalized.length > 0) {
        return normalized;
      }
    }

    return [];
  },

  normalizeActions(value = []) {
    return this.toArray(value)
      .map(
        (action, index) =>
          this.normalizeAction(
            action,
            index
          )
      )
      .filter(Boolean);
  },

  normalizeAction(
    action = null,
    index = 0
  ) {
    if (
      action === null ||
      action === undefined
    ) {
      return null;
    }

    if (typeof action === "string") {
      const type =
        this.normalizeIdentifier(
          action
        );

      return type
        ? {
            id:
              `ari_action_${index + 1}`,

            type,

            approved:
              true,

            requiresApproval:
              false,

            source:
              "delivery_pipeline"
          }
        : null;
    }

    if (!this.isPlainObject(action)) {
      return null;
    }

    const type =
      this.normalizeIdentifier(
        action.type ||
        action.action ||
        action.name ||
        action.intent ||
        ""
      );

    if (!type) {
      return null;
    }

    const approved =
      action.approved !== false &&
      action.rejected !== true &&
      action.blocked !== true;

    if (!approved) {
      return null;
    }

    return {
      ...action,

      id:
        this.cleanText(action.id) ||
        `ari_action_${index + 1}`,

      type,

      approved:
        true,

      requiresApproval:
        action.requiresApproval ===
        true,

      source:
        action.source ||
        "delivery_pipeline"
    };
  },

  resolveActions(delivery = {}) {
    return this.normalizeActions(
      delivery.actions
    );
  },

  /* =====================================================
     DEVELOPER INTENT EXTRACTION
  ===================================================== */

  extractDeveloperIntent({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const candidates = [
      deliveryCandidate
        .developerIntent,

      deliveryCandidate
        .developerDisposition,

      deliveryCandidate.payload
        ?.developerIntent,

      runtimeState.developerIntent,

      runtimeState
        .resolvedDeveloperIntent,

      runtimeState.developerRouting
        ?.developerIntent,

      runtimeState.developerInvestigation
        ?.intent,

      runtimeState.executivePacket
        ?.developerIntent,

      runtimeState.executiveRoutingPacket
        ?.developerIntent,

      runtimeState.routingDecision
        ?.developerIntent
    ];

    for (const candidate of candidates) {
      const normalized =
        this.normalizeDeveloperIntent(
          candidate
        );

      if (normalized) {
        return normalized;
      }
    }

    return null;
  },

  normalizeDeveloperIntent(
    value = null
  ) {
    if (
      value === null ||
      value === undefined ||
      value === false
    ) {
      return null;
    }

    if (typeof value === "string") {
      const type =
        this.normalizeIdentifier(
          value
        );

      return type
        ? {
            type,
            active: true,
            source: "runtime"
          }
        : null;
    }

    if (!this.isPlainObject(value)) {
      return null;
    }

    const type =
      this.normalizeIdentifier(
        value.type ||
        value.intent ||
        value.name ||
        value.mode ||
        ""
      );

    const active =
      value.active !== false &&
      value.relevant !== false &&
      value.detected !== false;

    if (!type && !active) {
      return null;
    }

    return {
      ...value,

      type:
        type ||
        "developer_context",

      active,

      source:
        value.source ||
        "runtime"
    };
  },

  resolveDeveloperIntent(
    delivery = {}
  ) {
    return this.normalizeDeveloperIntent(
      delivery.developerIntent
    );
  },

  /* =====================================================
     ERROR EXTRACTION
  ===================================================== */

  extractRuntimeError({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const candidates = [
      deliveryCandidate.error,
      deliveryCandidate.failure,
      deliveryCandidate.deliveryError,

      deliveryCandidate.payload
        ?.error,

      runtimeState.error,
      runtimeState.runtimeError,
      runtimeState.pipelineError,
      runtimeState.deliveryError,

      runtimeState.lifecycle
        ?.error,

      runtimeState.lifecycle
        ?.lifecycleErrors,

      runtimeState.pipelineLifecycle
        ?.errors,

      runtimeState.pipelineLifecycleErrors,

      runtimeState.deliveryResult
        ?.error
    ];

    for (const candidate of candidates) {
      const normalized =
        this.normalizeError(candidate);

      if (normalized) {
        return normalized;
      }
    }

    return null;
  },

  normalizeError(value = null) {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === ""
    ) {
      return null;
    }

    if (Array.isArray(value)) {
      return (
        value
          .map(item =>
            this.normalizeError(item)
          )
          .find(Boolean) ||
        null
      );
    }

    if (typeof value === "string") {
      const message =
        this.cleanText(value);

      return message
        ? {
            code:
              "runtime_error",

            message,

            source:
              "runtime"
          }
        : null;
    }

    if (value instanceof Error) {
      return {
        code:
          this.normalizeIdentifier(
            value.name
          ) ||
          "runtime_error",

        message:
          this.cleanText(
            value.message
          ) ||
          "Runtime execution failed.",

        stack:
          value.stack ||
          null,

        source:
          "runtime"
      };
    }

    if (!this.isPlainObject(value)) {
      return {
        code:
          "runtime_error",

        message:
          this.cleanText(value) ||
          "Runtime execution failed.",

        source:
          "runtime"
      };
    }

    const message =
      this.cleanText(
        value.message ||
        value.error ||
        value.reason ||
        value.description ||
        ""
      );

    if (!message) {
      return null;
    }

    return {
      ...value,

      code:
        this.normalizeIdentifier(
          value.code ||
          value.type ||
          value.name ||
          "runtime_error"
        ) ||
        "runtime_error",

      message,

      source:
        value.source ||
        "runtime"
    };
  },

  /* =====================================================
     COMPLETION AND AUTHORITY
  ===================================================== */

  resolveCompletionStatus({
    runtimeState = {},
    deliveryCandidate = {},
    reply = ""
  } = {}) {
    if (
      deliveryCandidate.complete === true ||
      deliveryCandidate.completed === true ||
      deliveryCandidate.delivered === true
    ) {
      return true;
    }

    if (
      runtimeState.complete === true ||
      runtimeState.completed === true ||
      runtimeState.pipelineComplete === true ||
      runtimeState.runtimeComplete === true ||
      runtimeState.lifecycle
        ?.complete === true ||
      runtimeState.lifecycle
        ?.completed === true ||
      runtimeState.pipelineLifecycle
        ?.complete === true ||
      runtimeState.pipelineLifecycle
        ?.completed === true
    ) {
      return true;
    }

    return Boolean(
      reply &&
      Object.keys(
        deliveryCandidate
      ).length > 0 &&
      this.didPipelineRun(
        runtimeState,
        "delivery"
      )
    );
  },

  resolveAuthoritativeStatus({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    if (
      deliveryCandidate.authoritative === false ||
      deliveryCandidate.isAuthoritative === false
    ) {
      return false;
    }

    if (
      deliveryCandidate.authoritative === true ||
      deliveryCandidate.isAuthoritative === true ||
      deliveryCandidate.authority ===
        "delivery_pipeline" ||
      deliveryCandidate.authority
        ?.reply ===
        "delivery_pipeline"
    ) {
      return true;
    }

    if (
      runtimeState.runtimePolicy
        ?.requireAuthoritativeDelivery ===
        true &&
      Object.keys(
        deliveryCandidate
      ).length > 0
    ) {
      return true;
    }

    return Boolean(
      (
        runtimeState.deliveryPacket ||
        runtimeState.deliveryResult ||
        runtimeState.authoritativeDelivery
      ) &&
      Object.keys(
        deliveryCandidate
      ).length > 0
    );
  },

  resolveDeliveryStatus({
    complete = false,
    authoritative = false,
    runtimeError = null,
    reply = "",
    deliveryCandidate = {},
    runtimeState = {}
  } = {}) {
    const explicitStatus =
      this.normalizeIdentifier(
        deliveryCandidate.deliveryStatus ||
        deliveryCandidate.status ||
        runtimeState.deliveryStatus ||
        ""
      );

    if (runtimeError) {
      return "failed";
    }

    if (
      [
        "delivered",
        "complete",
        "completed",
        "success"
      ].includes(explicitStatus)
    ) {
      return "delivered";
    }

    if (
      [
        "failed",
        "error"
      ].includes(explicitStatus)
    ) {
      return "failed";
    }

    if (!authoritative) {
      return "non_authoritative";
    }

    if (!complete || !reply) {
      return "incomplete";
    }

    return "delivered";
  },

  /* =====================================================
     TURN ID
  ===================================================== */

  extractTurnId({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    return (
      this.cleanText(
        deliveryCandidate.turnId ||
        deliveryCandidate.currentTurnId ||
        runtimeState.currentTurnId ||
        runtimeState.turnId ||
        runtimeState.turn?.turnId ||
        runtimeState.currentTurn
          ?.turnId ||
        runtimeState.runtimeRequest
          ?.turnId ||
        runtimeState.requestEnvelope
          ?.turnId ||
        ""
      ) ||
      null
    );
  },

  /* =====================================================
     CANONICAL RUNTIME SUMMARY
  ===================================================== */

  buildRuntimeSummary({
    runtimeState = {},
    deliveryCandidate = {},
    options = {}
  } = {}) {
    if (options.includeSummary === false) {
      return null;
    }

    /*
     * Always rebuild this summary from the complete runtime state.
     *
     * Do not return deliveryCandidate.summary, runtimeSummary, or
     * pipelineSummary directly. Those values may be compact, stale,
     * or may have been produced before all five layers completed.
     */
    return {
      request:
        this.normalizeRequestSummary(
          runtimeState,
          deliveryCandidate
        ),

      lifecycle:
        this.normalizeLifecycle(
          runtimeState
        ),

      perception:
        this.normalizePerceptionSummary(
          runtimeState
        ),

      routing:
        this.normalizeRoutingSummary(
          runtimeState
        ),

      deliberation:
        this.normalizeDeliberationSummary(
          runtimeState
        ),

      expression:
        this.normalizeExpressionSummary(
          runtimeState
        ),

      delivery:
        this.normalizeDeliverySummary({
          runtimeState,
          deliveryCandidate
        }),

      timing:
        this.normalizeTimingSummary(
          runtimeState
        )
    };
  },

  normalizeRequestSummary(
    runtimeState = {},
    deliveryCandidate = {}
  ) {
    const userMessage =
      this.cleanText(
        runtimeState.userMessage ||
        runtimeState.originalUserMessage ||
        runtimeState.currentTurn
          ?.originalText ||
        runtimeState.currentTurn
          ?.text ||
        runtimeState.turn
          ?.originalText ||
        runtimeState.turn
          ?.text ||
        runtimeState.runtimeRequest
          ?.userMessage ||
        runtimeState.runtimeRequest
          ?.message ||
        runtimeState.requestEnvelope
          ?.userMessage ||
        runtimeState.requestEnvelope
          ?.message ||
        runtimeState.request
          ?.userMessage ||
        runtimeState.request
          ?.message ||
        ""
      );

    const resolvedUserQuestion =
      this.cleanText(
        runtimeState.resolvedUserQuestion ||
        runtimeState.resolvedCurrentTurn
          ?.question ||
        runtimeState.semanticFrame
          ?.resolvedUserQuestion ||
        runtimeState.perceptionPacket
          ?.resolvedUserQuestion ||
        runtimeState.perceptionPacket
          ?.semanticFrame
          ?.resolvedUserQuestion ||
        ""
      );

    return {
      userMessage:
        userMessage ||
        null,

      resolvedUserQuestion:
        resolvedUserQuestion ||
        null,

      turnId:
        this.extractTurnId({
          runtimeState,
          deliveryCandidate
        })
    };
  },

  normalizeLifecycle(
    runtimeState = {}
  ) {
    const lifecycle =
      this.firstPlainObject([
        runtimeState.pipelineLifecycle,
        runtimeState.lifecycle
      ]);

    const layers =
      this.firstPlainObject([
        lifecycle.layers,
        runtimeState.pipelineLayerResults,
        runtimeState.layerResults
      ]);

    const lifecycleErrors =
      this.uniqueValues([
        ...this.toArray(
          lifecycle.lifecycleErrors
        ),
        ...this.toArray(
          lifecycle.errors
        ),
        ...this.toArray(
          runtimeState.pipelineLifecycleErrors
        ),
        ...this.toArray(
          runtimeState.lifecycleErrors
        )
      ]);

    const layerStatus = {
      perception:
        this.didPipelineRun(
          runtimeState,
          "perception"
        ),

      routing:
        this.didPipelineRun(
          runtimeState,
          "routing"
        ),

      deliberation:
        this.didPipelineRun(
          runtimeState,
          "deliberation"
        ),

      expression:
        this.didPipelineRun(
          runtimeState,
          "expression"
        ),

      delivery:
        this.didPipelineRun(
          runtimeState,
          "delivery"
        )
    };

    const allLayersRan =
      Object.values(
        layerStatus
      ).every(Boolean);

    return {
      architecture:
        lifecycle.architecture ||
        runtimeState.runtimeArchitecture ||
        "canonical-five-layer",

      complete:
        lifecycle.complete === true ||
        lifecycle.completed === true ||
        runtimeState.pipelineComplete === true ||
        runtimeState.runtimeComplete === true ||
        runtimeState.complete === true ||
        runtimeState.completed === true ||
        allLayersRan,

      layers:
        Object.keys(layers).length > 0
          ? layers
          : layerStatus,

      layerStatus,

      lifecycleErrors
    };
  },

  normalizePerceptionSummary(
    runtimeState = {}
  ) {
    const packet =
      this.firstPlainObject([
        runtimeState.perceptionPacket,
        runtimeState.perceptionResult
      ]);

    const ledger =
      this.firstPlainObject([
        packet.perceptionLedger,
        packet.ledger,
        runtimeState.perceptionLedger
      ]);

    const semanticFrame =
      this.firstPlainObject([
        packet.semanticFrame,
        runtimeState.semanticFrame
      ]);

    const conversationFunction =
      packet.conversationFunction ||
      runtimeState.conversationFunction ||
      null;

    return {
      ran:
        this.didPipelineRun(
          runtimeState,
          "perception"
        ),

      observationCount:
        this.toArray(
          ledger.observations ||
          packet.observations ||
          runtimeState.observations
        ).length,

      primaryFunction:
        this.extractPrimaryValue(
          conversationFunction
        ),

      conversationType:
        packet.conversationType ||
        runtimeState.conversationType ||
        null,

      conversationIntent:
        packet.conversationIntent ||
        runtimeState.conversationIntent ||
        null,

      semanticSummary:
        semanticFrame.summary ||
        packet.semanticSummary ||
        runtimeState.semanticSummary ||
        null
    };
  },

  normalizeRoutingSummary(
    runtimeState = {}
  ) {
    const packet =
      this.firstPlainObject([
        runtimeState.executivePacket,
        runtimeState.executiveRoutingPacket,
        runtimeState.routingDecision
      ]);

    const routing =
      this.firstPlainObject([
        packet.routingDecision,
        packet.routing,
        runtimeState.routingDecision,
        packet
      ]);

    return {
      ran:
        this.didPipelineRun(
          runtimeState,
          "routing"
        ),

      mode:
        routing.mode ||
        packet.mode ||
        runtimeState.routingMode ||
        null,

      primaryIntent:
        routing.primaryIntent ||
        packet.primaryIntent ||
        runtimeState.primaryIntent ||
        null,

      domain:
        routing.domain ||
        packet.domain ||
        runtimeState.domain ||
        null,

      contextLane:
        routing.contextLane ||
        packet.contextLane ||
        runtimeState.contextLane ||
        null,

      primaryLane:
        routing.primaryLane ||
        packet.primaryLane ||
        runtimeState.primaryLane ||
        null,

      planner:
        routing.planner ||
        packet.planner ||
        runtimeState.planner ||
        null
    };
  },

  normalizeDeliberationSummary(
    runtimeState = {}
  ) {
    const packet =
      this.firstPlainObject([
        runtimeState.deliberationPacket,
        runtimeState.deliberationResult
      ]);

    const plan =
      this.firstPlainObject([
        packet.canonicalResponsePlan,
        packet.responsePlan,
        runtimeState.canonicalResponsePlan
      ]);

    const safetyContext =
      this.firstPlainObject([
        packet.safetyContext,
        runtimeState.safetyContext
      ]);

    return {
      ran:
        this.didPipelineRun(
          runtimeState,
          "deliberation"
        ),

      responseGoal:
        plan.responseGoal ||
        packet.responseGoal ||
        runtimeState.responseGoal ||
        null,

      responseShape:
        plan.responseShape ||
        packet.responseShape ||
        runtimeState.responseShape ||
        null,

      responseMoveCount:
        this.toArray(
          plan.responseMoves ||
          packet.responseMoves ||
          runtimeState.responseMoves
        ).length,

      safetyDisposition:
        packet.safetyDisposition ||
        runtimeState.safetyDisposition ||
        safetyContext.disposition ||
        null
    };
  },

  normalizeExpressionSummary(
    runtimeState = {}
  ) {
    const packet =
      this.firstPlainObject([
        runtimeState.expressionPacket,
        runtimeState.expressionResult
      ]);

    const selectedDraft =
      packet.selectedDraft ||
      runtimeState.selectedDraft ||
      null;

    const finalComposition =
      packet.finalComposition ||
      runtimeState.finalComposition ||
      null;

    const finalResponse =
      packet.finalResponse ||
      runtimeState.finalResponse ||
      null;

    return {
      ran:
        this.didPipelineRun(
          runtimeState,
          "expression"
        ),

      selectedDraftAvailable:
        Boolean(selectedDraft),

      finalCompositionAvailable:
        Boolean(finalComposition),

      finalResponseAvailable:
        Boolean(
          this.extractTextValue(
            finalResponse
          ) ||
          this.extractTextValue(
            finalComposition
          )
        )
    };
  },

  normalizeDeliverySummary({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    const reply =
      this.extractReply({
        runtimeState,
        deliveryCandidate
      });

    const authoritative =
      this.resolveAuthoritativeStatus({
        runtimeState,
        deliveryCandidate
      });

    const complete =
      this.resolveCompletionStatus({
        runtimeState,
        deliveryCandidate,
        reply
      });

    return {
      ran:
        this.didPipelineRun(
          runtimeState,
          "delivery"
        ),

      authoritative,
      complete,

      status:
        deliveryCandidate.deliveryStatus ||
        deliveryCandidate.status ||
        runtimeState.deliveryStatus ||
        (
          authoritative &&
          complete &&
          reply
            ? "delivered"
            : null
        ),

      replyAvailable:
        Boolean(reply),

      emotion:
        this.extractEmotion({
          runtimeState,
          deliveryCandidate
        }),

      actionCount:
        this.extractActions({
          runtimeState,
          deliveryCandidate
        }).length
    };
  },

  normalizeTimingSummary(
    runtimeState = {}
  ) {
    const rawTiming =
      this.firstPlainObject([
        runtimeState.pipelineTiming,
        runtimeState.timing,
        runtimeState.pipelineTimings,
        runtimeState.runtimeTiming,
        runtimeState.diagnostics
          ?.pipelineTiming
      ]);

    if (Object.keys(rawTiming).length > 0) {
      return rawTiming;
    }

    const marks =
      this.toArray(
        runtimeState.timingMarks ||
        runtimeState.pipelineMarks ||
        runtimeState.diagnostics
          ?.timingMarks
      );

    return marks.length > 0
      ? {
          marks
        }
      : null;
  },

  resolveSummary({
    delivery = {},
    options = {}
  } = {}) {
    if (options.includeSummary === false) {
      return null;
    }

    /*
     * Prefer the freshly built summary. If a normalized result somehow
     * arrived without one, rebuild it from the attached runtime state.
     */
    if (
      this.isPlainObject(
        delivery.summary
      )
    ) {
      return delivery.summary;
    }

    return this.buildRuntimeSummary({
      runtimeState:
        this.isPlainObject(
          delivery.runtimeState
        )
          ? delivery.runtimeState
          : {},

      deliveryCandidate:
        this.isPlainObject(
          delivery.rawDeliveryResult
        )
          ? delivery.rawDeliveryResult
          : {},

      options
    });
  },

  didPipelineRun(
    runtimeState = {},
    layer = ""
  ) {
    const names = {
      perception: [
        "perceptionPipelineRan",
        "perceptionCompleted"
      ],

      routing: [
        "executiveRoutingPipelineRan",
        "routingPipelineRan",
        "executiveRoutingCompleted"
      ],

      deliberation: [
        "deliberationPipelineRan",
        "deliberationCompleted"
      ],

      expression: [
        "expressionPipelineRan",
        "expressionCompleted"
      ],

      delivery: [
        "deliveryPipelineRan",
        "deliveryCompleted"
      ]
    };

    const packetNames = {
      perception: [
        "perceptionPacket",
        "perceptionResult"
      ],

      routing: [
        "executivePacket",
        "executiveRoutingPacket",
        "routingDecision"
      ],

      deliberation: [
        "deliberationPacket",
        "deliberationResult",
        "canonicalResponsePlan"
      ],

      expression: [
        "expressionPacket",
        "expressionResult",
        "finalComposition",
        "finalResponse"
      ],

      delivery: [
        "deliveryPacket",
        "deliveryResult",
        "authoritativeDelivery"
      ]
    };

    for (const name of names[layer] || []) {
      if (runtimeState[name] === true) {
        return true;
      }
    }

    for (
      const name
      of packetNames[layer] || []
    ) {
      if (
        runtimeState[name] !==
          undefined &&
        runtimeState[name] !==
          null
      ) {
        return true;
      }
    }

    const lifecycle =
      this.firstPlainObject([
        runtimeState.pipelineLifecycle,
        runtimeState.lifecycle
      ]);

    const lifecycleLayer =
      lifecycle.layers
        ?.[layer];

    if (
      lifecycleLayer === true ||
      lifecycleLayer?.ran === true ||
      lifecycleLayer?.complete === true ||
      lifecycleLayer?.completed === true
    ) {
      return true;
    }

    return false;
  },

  /* =====================================================
     DELIVERY VALIDATION
  ===================================================== */

  validateDeliveryResult(
    delivery = {}
  ) {
    const errors = [];
    const warnings = [];

    if (!this.isPlainObject(delivery)) {
      return {
        valid: false,
        ready: false,

        errors: [
          "delivery_result_invalid"
        ],

        warnings: [],

        source:
          "ari-runtime-delivery-validation",

        version:
          this.version
      };
    }

    const reply =
      this.cleanText(
        delivery.reply
      );

    if (!reply) {
      errors.push(
        "authoritative_reply_missing"
      );
    }

    if (
      delivery.authoritative !== true
    ) {
      errors.push(
        "delivery_result_not_authoritative"
      );
    }

    if (delivery.complete !== true) {
      errors.push(
        "delivery_result_incomplete"
      );
    }

    if (delivery.error) {
      errors.push(
        delivery.error.code ||
        "runtime_delivery_error"
      );
    }

    if (
      delivery.deliveryStatus !==
      "delivered"
    ) {
      errors.push(
        `delivery_status_${delivery.deliveryStatus || "unknown"}`
      );
    }

    if (!delivery.turnId) {
      warnings.push(
        "delivery_turn_id_missing"
      );
    }

    if (!delivery.emotion) {
      warnings.push(
        "delivery_emotion_missing"
      );
    }

    if (
      !Array.isArray(
        delivery.actions
      )
    ) {
      warnings.push(
        "delivery_actions_not_array"
      );
    }

    return {
      valid:
        errors.length === 0,

      ready:
        errors.length === 0,

      errors:
        this.uniqueValues(errors),

      warnings:
        this.uniqueValues(warnings),

      checks: {
        deliveryResultAvailable:
          true,

        replyAvailable:
          Boolean(reply),

        authoritative:
          delivery.authoritative ===
          true,

        complete:
          delivery.complete === true,

        delivered:
          delivery.deliveryStatus ===
          "delivered",

        runtimeErrorAbsent:
          !delivery.error,

        emotionAvailable:
          Boolean(
            delivery.emotion
          ),

        actionsNormalized:
          Array.isArray(
            delivery.actions
          ),

        runtimeStatePreserved:
          this.isPlainObject(
            delivery.runtimeState
          )
      },

      source:
        "ari-runtime-delivery-validation",

      version:
        this.version
    };
  },

  isNormalizedDeliveryResult(
    value = null
  ) {
    return Boolean(
      this.isPlainObject(value) &&
      value.schema ===
        "ari_runtime_delivery_result"
    );
  },

  /* =====================================================
     FAILURE RESPONSE
  ===================================================== */

  buildFailureResponse({
    delivery = {},
    validation = {},
    options = {}
  } = {}) {
    const runtimeError =
      delivery.error ||
      null;

    const message =
      this.cleanText(
        runtimeError?.message
      ) ||
      this.resolveFailureMessage({
        delivery,
        validation
      });

    const errorCode =
      runtimeError?.code ||
      validation?.errors?.[0] ||
      "runtime_delivery_failed";

    const response = {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        options.includeFailureReply ===
        false
          ? ""
          : message,

      emotion:
        this.resolveFailureEmotion(
          delivery
        ),

      actions: [],

      developerIntent:
        this.resolveDeveloperIntent(
          delivery
        ),

      summary:
        options.includeSummary ===
        false
          ? null
          : this.resolveSummary({
              delivery,
              options
            }),

      error: {
        code:
          this.normalizeIdentifier(
            errorCode
          ) ||
          "runtime_delivery_failed",

        message,

        errors:
          this.toArray(
            validation.errors
          ),

        warnings:
          this.toArray(
            validation.warnings
          ),

        source:
          runtimeError?.source ||
          this.source
      },

      ok:
        false,

      success:
        false,

      complete:
        false,

      deliveryStatus:
        delivery.deliveryStatus ||
        "failed",

      source:
        this.source,

      responseSource:
        "runtime_delivery_failure",

      runtimeDeliverySource:
        this.source,

      runtimeDeliveryVersion:
        this.version,

      turnId:
        delivery.turnId ||
        null,

      currentTurnId:
        delivery.turnId ||
        null,

      createdAt:
        delivery.createdAt ||
        new Date().toISOString(),

      completedAt:
        delivery.completedAt ||
        null,

      diagnostics:
        this.buildAppDiagnostics({
          delivery,
          validation
        }),

      authority: {
        reply:
          "runtime_delivery_failure_adapter",

        emotion:
          "runtime_delivery_failure_adapter",

        actions:
          "none",

        developerIntent:
          "upstream_runtime_preserved_if_available",

        summary:
          "canonical_runtime_state_if_available",

        adaptation:
          this.source
      }
    };

    return this.attachCompatibilityFields({
      response,
      delivery,
      options
    });
  },

  resolveFailureMessage({
    delivery = {},
    validation = {}
  } = {}) {
    const errors =
      this.toArray(
        validation.errors
      );

    if (
      errors.includes(
        "authoritative_reply_missing"
      )
    ) {
      return "Ari completed the runtime without producing an authoritative response.";
    }

    if (
      errors.includes(
        "delivery_result_not_authoritative"
      )
    ) {
      return "Ari produced a response, but Delivery did not authorize it.";
    }

    if (
      errors.includes(
        "delivery_result_incomplete"
      )
    ) {
      return "Ari's response pipeline did not complete.";
    }

    if (
      delivery.deliveryStatus ===
      "non_authoritative"
    ) {
      return "Ari's Delivery layer did not return an authoritative result.";
    }

    return "Ari could not complete the response.";
  },

  resolveFailureEmotion(
    delivery = {}
  ) {
    const emotion =
      this.normalizeEmotion(
        delivery.emotion
      );

    if (
      emotion &&
      emotion !== "neutral"
    ) {
      return emotion;
    }

    return "concerned";
  },

  /* =====================================================
     APP DIAGNOSTICS
  ===================================================== */

  buildAppDiagnostics({
    delivery = {},
    validation = {}
  } = {}) {
    const runtimeState =
      this.isPlainObject(
        delivery.runtimeState
      )
        ? delivery.runtimeState
        : {};

    return {
      runtimeDeliveryReady:
        validation.valid === true,

      runtimeDeliverySource:
        this.source,

      runtimeDeliveryVersion:
        this.version,

      authoritative:
        delivery.authoritative === true,

      complete:
        delivery.complete === true,

      deliveryStatus:
        delivery.deliveryStatus ||
        "unknown",

      replyAvailable:
        Boolean(
          this.cleanText(
            delivery.reply
          )
        ),

      emotion:
        delivery.emotion ||
        null,

      actionCount:
        this.toArray(
          delivery.actions
        ).length,

      developerIntentAvailable:
        Boolean(
          delivery.developerIntent
        ),

      runtimeStatePreserved:
        Object.keys(
          runtimeState
        ).length > 0,

      pipelineFlags: {
        perception:
          this.didPipelineRun(
            runtimeState,
            "perception"
          ),

        routing:
          this.didPipelineRun(
            runtimeState,
            "routing"
          ),

        deliberation:
          this.didPipelineRun(
            runtimeState,
            "deliberation"
          ),

        expression:
          this.didPipelineRun(
            runtimeState,
            "expression"
          ),

        delivery:
          this.didPipelineRun(
            runtimeState,
            "delivery"
          )
      },

      timingAvailable:
        Boolean(
          this.normalizeTimingSummary(
            runtimeState
          )
        ),

      errors:
        this.toArray(
          validation.errors
        ),

      warnings:
        this.toArray(
          validation.warnings
        )
    };
  },

  /* =====================================================
     COMPATIBILITY RESPONSE FIELDS
  ===================================================== */

  attachCompatibilityFields({
    response = {},
    delivery = {},
    options = {}
  } = {}) {
    if (
      options.includeCompatibilityFields ===
      false
    ) {
      return response;
    }

    return {
      ...response,

      text:
        response.reply,

      message:
        response.reply,

      response:
        response.reply,

      finalResponse:
        response.reply,

      finalEmotion:
        response.emotion,

      approvedActions:
        response.actions,

      runtimeSummary:
        response.summary,

      pipelineTiming:
        response.summary?.timing ||
        null,

      deliveryResult: {
        reply:
          response.reply,

        emotion:
          response.emotion,

        actions:
          response.actions,

        developerIntent:
          response.developerIntent,

        complete:
          response.complete,

        authoritative:
          response.ok === true,

        status:
          response.deliveryStatus,

        turnId:
          response.turnId,

        source:
          delivery.source ||
          response.source
      }
    };
  },

  /* =====================================================
     OPTIONS
  ===================================================== */

  normalizeOptions(options = {}) {
    if (!this.isPlainObject(options)) {
      return {
        includeSummary: true,
        includeCompatibilityFields: true,
        includeFailureReply: true
      };
    }

    return {
      includeSummary:
        options.includeSummary !== false,

      includeCompatibilityFields:
        options.includeCompatibilityFields !==
        false,

      includeFailureReply:
        options.includeFailureReply !==
        false,

      ...options
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canLocateDeliveryResult:
        true,

      canReadAuthoritativeDelivery:
        true,

      canNormalizeDeliveryResult:
        true,

      canValidateDeliveryResult:
        true,

      canAdaptApplicationResponse:
        true,

      canNormalizeRuntimeError:
        true,

      canPreserveRuntimeSummary:
        true,

      canPreserveCanonicalRuntimeState:
        true,

      canExposeCompatibilityFields:
        true,

      canLoadScripts:
        false,

      canBuildRuntimeRequest:
        false,

      canExecuteMasterPipeline:
        false,

      canResolveContinuity:
        false,

      canClassifyConversation:
        false,

      canInterpretMeaning:
        false,

      canDetermineSafetySeverity:
        false,

      canDetermineDeveloperIntent:
        false,

      canGenerateReply:
        false,

      canSelectDraft:
        false,

      canComposeResponse:
        false,

      canInferEmotion:
        false,

      canInventActions:
        false,

      canExecuteActions:
        false,

      canRetrieveMemory:
        false,

      canStoreMemory:
        false,

      canAccessSupabase:
        false,

      canPersistState:
        false,

      role:
        "canonical_runtime_delivery_reading_and_application_adaptation"
    };
  },

  cannotSet() {
    return [
      "conversationFunction",
      "semanticMeaning",
      "routingDecision",
      "primaryLane",
      "riskLevel",
      "safetyDisposition",
      "resolvedUserQuestion",
      "resolvedCurrentTurn",
      "canonicalResponsePlan",
      "responseGoal",
      "responseShape",
      "responseMoves",
      "composerPacket",
      "candidateDrafts",
      "selectedDraft",
      "memorySaveDecision",
      "toolExecutionDecision"
    ];
  },

  validate() {
    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canLoadScripts",
      "canBuildRuntimeRequest",
      "canExecuteMasterPipeline",
      "canResolveContinuity",
      "canClassifyConversation",
      "canInterpretMeaning",
      "canDetermineSafetySeverity",
      "canDetermineDeveloperIntent",
      "canGenerateReply",
      "canSelectDraft",
      "canComposeResponse",
      "canInferEmotion",
      "canInventActions",
      "canExecuteActions",
      "canRetrieveMemory",
      "canStoreMemory",
      "canAccessSupabase",
      "canPersistState"
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

    return {
      valid:
        errors.length === 0,

      source:
        "ari-runtime-delivery-validation",

      version:
        this.version,

      errors,
      warnings: [],

      checks: {
        deliveryReadingEnabled:
          authority.canReadAuthoritativeDelivery ===
          true,

        deliveryValidationEnabled:
          authority.canValidateDeliveryResult ===
          true,

        applicationAdaptationEnabled:
          authority.canAdaptApplicationResponse ===
          true,

        canonicalRuntimePreservationEnabled:
          authority.canPreserveCanonicalRuntimeState ===
          true,

        responseGenerationDisabled:
          authority.canGenerateReply ===
          false,

        emotionInferenceDisabled:
          authority.canInferEmotion ===
          false,

        actionInventionDisabled:
          authority.canInventActions ===
          false,

        actionExecutionDisabled:
          authority.canExecuteActions ===
          false,

        persistenceDisabled:
          authority.canPersistState ===
          false
      }
    };
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  isPlainObject(value = null) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  firstPlainObject(
    candidates = []
  ) {
    for (
      const candidate
      of this.toArray(candidates)
    ) {
      if (this.isPlainObject(candidate)) {
        return candidate;
      }
    }

    return {};
  },

  extractPrimaryValue(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return this.cleanText(value) ||
        null;
    }

    if (!this.isPlainObject(value)) {
      return null;
    }

    return (
      this.cleanText(
        value.primary ||
        value.primaryFunction ||
        value.function ||
        value.type ||
        value.name ||
        ""
      ) ||
      null
    );
  },

  toArray(value) {
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

  uniqueValues(values = []) {
    const output = [];
    const seen = new Set();

    this.toArray(values).forEach(
      value => {
        const key =
          typeof value === "string"
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

  safeJSONStringify(value = null) {
    const seen = new WeakSet();

    try {
      return JSON.stringify(
        value,
        (_key, nestedValue) => {
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
    } catch (_error) {
      return "";
    }
  },

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  normalizeIdentifier(value = "") {
    return String(value || "")
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

window.Ari.runtimeDelivery =
  window.AriRuntimeDelivery;

console.log(
  "ARI RUNTIME DELIVERY LOADED:",
  window.AriRuntimeDelivery?.version,
  window.AriRuntimeDelivery
    ?.validate?.()
    .valid === true
    ? "READY"
    : "INVALID"
);
