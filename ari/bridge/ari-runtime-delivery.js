// ari/bridge/ari-runtime-delivery.js
// Ari Runtime Delivery
//
// Purpose:
// Read the authoritative Delivery output produced by the Ari Rebirth runtime
// and adapt it into the stable application response contract expected by
// CalBuddy Health, Ari Lab, and the Ari Rebirth App Bridge.
//
// V1.0.0 — Authoritative Delivery Reading / App Response Adaptation
//
// Architectural flow:
//
// Ari Rebirth Pipeline
//      ↓
// Delivery Pipeline
//      ↓
// Authoritative Delivery Result
//      ↓
// Ari Runtime Delivery
//      ↓
// Stable App Response Contract
//
// Responsibilities:
// - Locate the authoritative Delivery result in the completed runtime state.
// - Reject incomplete or non-authoritative runtime output.
// - Extract the final user-facing reply.
// - Extract the final emotion selected by the runtime.
// - Extract approved application actions.
// - Extract developer intent without independently inferring it.
// - Preserve runtime diagnostics and summary data.
// - Normalize runtime errors into a stable application error contract.
// - Adapt the result into the response shape currently expected by the app.
// - Preserve compatibility fields during the bridge migration.
//
// Non-responsibilities:
// - Does not load scripts.
// - Does not build runtime requests.
// - Does not execute AriRebirthPipeline.
// - Does not classify the conversation.
// - Does not interpret semantic meaning.
// - Does not resolve continuity.
// - Does not determine safety severity.
// - Does not determine developer relevance.
// - Does not generate response language.
// - Does not select a draft.
// - Does not create fallback factual answers.
// - Does not invent actions.
// - Does not execute actions.
// - Does not retrieve or store memory.
// - Does not persist runtime state.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriRuntimeDelivery = {
  version: "1.0.0",
  schemaVersion: "2.0.0",
  source: "ari-runtime-delivery",
  authorityLevel:
    "authoritative_delivery_reading_and_application_adaptation",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  read(runtimeOutput = null, options = {}) {
    const normalizedOptions =
      this.normalizeOptions(
        options
      );

    const runtimeState =
      this.resolveRuntimeState(
        runtimeOutput
      );

    const deliveryCandidate =
      this.resolveDeliveryCandidate(
        runtimeState
      );

    const deliveryResult =
      this.normalizeDeliveryResult({
        runtimeState,
        deliveryCandidate,
        options:
          normalizedOptions
      });

    const validation =
      this.validateDeliveryResult(
        deliveryResult
      );

    return {
      ...deliveryResult,

      runtimeDeliveryValidation:
        validation,

      runtimeDeliveryReady:
        validation.valid ===
        true,

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
      this.normalizeOptions(
        options
      );

    const delivery =
      this.isNormalizedDeliveryResult(
        input
      )
        ? input
        : this.read(
            input,
            normalizedOptions
          );

    const validation =
      delivery
        ?.runtimeDeliveryValidation ||
      this.validateDeliveryResult(
        delivery
      );

    if (
      validation.valid !==
      true
    ) {
      return this.buildFailureResponse({
        delivery,
        validation,
        options:
          normalizedOptions
      });
    }

    const reply =
      this.resolveReply(
        delivery
      );

    const emotion =
      this.resolveEmotion(
        delivery
      );

    const actions =
      this.resolveActions(
        delivery
      );

    const developerIntent =
      this.resolveDeveloperIntent(
        delivery
      );

    const summary =
      this.resolveSummary({
        delivery,
        options:
          normalizedOptions
      });

    const response = {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply,

      emotion,

      actions,

      developerIntent,

      summary,

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
        new Date()
          .toISOString(),

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
          "completed_runtime_state",

        adaptation:
          this.source
      }
    };

    return this.attachCompatibilityFields({
      response,
      delivery,
      options:
        normalizedOptions
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

  resolveRuntimeState(
    runtimeOutput = null
  ) {
    if (
      !runtimeOutput ||
      typeof runtimeOutput !==
        "object" ||
      Array.isArray(
        runtimeOutput
      )
    ) {
      return {};
    }

    const candidates = [
      runtimeOutput.runtimeState,
      runtimeOutput.state,
      runtimeOutput.summary,
      runtimeOutput.result,
      runtimeOutput.output,
      runtimeOutput
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(
          candidate
        )
      ) {
        if (
          this.looksLikeRuntimeState(
            candidate
          )
        ) {
          return candidate;
        }
      }
    }

    return runtimeOutput;
  },

  looksLikeRuntimeState(
    value = {}
  ) {
    return Boolean(
      value.deliveryResult ||
      value.delivery ||
      value.finalResponse ||
      value.finalComposition ||
      value.lifecycle ||
      value.turn ||
      value.currentTurnId ||
      value.completed ===
        true ||
      value.complete ===
        true
    );
  },

  /* =====================================================
     DELIVERY CANDIDATE RESOLUTION
  ===================================================== */

  resolveDeliveryCandidate(
    runtimeState = {}
  ) {
    const candidates = [
      runtimeState.deliveryResult,
      runtimeState.authoritativeDelivery,
      runtimeState.delivery,
      runtimeState.deliveryPacket,
      runtimeState.output
        ?.deliveryResult,
      runtimeState.result
        ?.deliveryResult,
      runtimeState.summary
        ?.deliveryResult
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(
          candidate
        )
      ) {
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
      deliveryCandidate &&
      typeof deliveryCandidate ===
        "object" &&
      !Array.isArray(
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
          runtimeState
            .deliverySource ||
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
        null,

      completedAt:
        candidate.completedAt ||
        runtimeState.completedAt ||
        null,

      rawDeliveryResult:
        candidate,

      runtimeState,

      evidence: {
        deliveryCandidateAvailable:
          Boolean(
            deliveryCandidate
          ),

        replyAvailable:
          Boolean(
            reply
          ),

        emotionAvailable:
          Boolean(
            emotion
          ),

        actionsAvailable:
          actions.length >
          0,

        developerIntentAvailable:
          Boolean(
            developerIntent
          ),

        runtimeErrorAvailable:
          Boolean(
            runtimeError
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
          "authoritative_delivery_reading"
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
      deliveryCandidate.response,
      deliveryCandidate.message,
      deliveryCandidate.content,
      deliveryCandidate.finalResponse,
      deliveryCandidate.outputText,
      deliveryCandidate.userFacingText,

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

      runtimeState.composerResult
        ?.reply,
      runtimeState.composerResult
        ?.text,

      runtimeState.expressionResult
        ?.reply,
      runtimeState.expressionResult
        ?.text
    ];

    for (
      const value
      of candidateValues
    ) {
      const text =
        this.extractTextValue(
          value
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  extractTextValue(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string" ||
      typeof value ===
      "number"
    ) {
      return this.cleanText(
        value
      );
    }

    if (
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
      return "";
    }

    const nestedCandidates = [
      value.reply,
      value.text,
      value.content,
      value.message,
      value.response,
      value.output,
      value.final
    ];

    for (
      const candidate
      of nestedCandidates
    ) {
      const text =
        this.cleanText(
          candidate
        );

      if (text) {
        return text;
      }
    }

    return "";
  },

  resolveReply(
    delivery = {}
  ) {
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

      deliveryCandidate.payload
        ?.emotion,
      deliveryCandidate.payload
        ?.finalEmotion,

      runtimeState.finalEmotion,
      runtimeState.deliveryEmotion,
      runtimeState.selectedEmotion,
      runtimeState.emotion,

      runtimeState.finalComposition
        ?.emotion,
      runtimeState.expressionResult
        ?.emotion,
      runtimeState.characterResult
        ?.emotion
    ];

    for (
      const candidate
      of candidates
    ) {
      const emotion =
        this.normalizeEmotion(
          candidate
        );

      if (emotion) {
        return emotion;
      }
    }

    return "neutral";
  },

  normalizeEmotion(
    value = null
  ) {
    if (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    ) {
      value =
        value.name ||
        value.emotion ||
        value.label ||
        value.type ||
        "";
    }

    const normalized =
      this.normalizeIdentifier(
        value
      );

    if (!normalized) {
      return "";
    }

    const aliases = {
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
        "thinking",

      idle_open:
        "neutral",

      idle:
        "neutral"
    };

    return (
      aliases[
        normalized
      ] ||
      normalized
    );
  },

  resolveEmotion(
    delivery = {}
  ) {
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
    const candidateCollections = [
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

      runtimeState.actionGovernance
        ?.approvedActions,
      runtimeState.finalComposition
        ?.actions
    ];

    for (
      const collection
      of candidateCollections
    ) {
      const normalized =
        this.normalizeActions(
          collection
        );

      if (
        normalized.length >
        0
      ) {
        return normalized;
      }
    }

    return [];
  },

  normalizeActions(
    value = []
  ) {
    return this.toArray(
      value
    )
      .map(
        (
          action,
          index
        ) =>
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
      action ===
        null ||
      action ===
        undefined
    ) {
      return null;
    }

    if (
      typeof action ===
      "string"
    ) {
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

    if (
      typeof action !==
        "object" ||
      Array.isArray(
        action
      )
    ) {
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
      action.approved !==
        false &&
      action.rejected !==
        true &&
      action.blocked !==
        true;

    if (!approved) {
      return null;
    }

    return {
      ...action,

      id:
        this.cleanText(
          action.id
        ) ||
        `ari_action_${index + 1}`,

      type,

      approved:
        true,

      requiresApproval:
        action
          .requiresApproval ===
        true,

      source:
        action.source ||
        "delivery_pipeline"
    };
  },

  resolveActions(
    delivery = {}
  ) {
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

      deliveryCandidate
        .payload
        ?.developerIntent,

      runtimeState
        .developerIntent,

      runtimeState
        .resolvedDeveloperIntent,

      runtimeState
        .developerRouting
        ?.developerIntent,

      runtimeState
        .developerInvestigation
        ?.intent,

      runtimeState
        .executivePacket
        ?.developerIntent,

      runtimeState
        .routingDecision
        ?.developerIntent
    ];

    for (
      const candidate
      of candidates
    ) {
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
      value ===
        null ||
      value ===
        undefined ||
      value ===
        false
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      const type =
        this.normalizeIdentifier(
          value
        );

      return type
        ? {
            type,

            active:
              true,

            source:
              "runtime"
          }
        : null;
    }

    if (
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
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
      value.active !==
        false &&
      value.relevant !==
        false &&
      value.detected !==
        false;

    if (
      !type &&
      !active
    ) {
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

      runtimeState.deliveryResult
        ?.error
    ];

    for (
      const candidate
      of candidates
    ) {
      const normalized =
        this.normalizeError(
          candidate
        );

      if (normalized) {
        return normalized;
      }
    }

    return null;
  },

  normalizeError(
    value = null
  ) {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        false ||
      value ===
        ""
    ) {
      return null;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      const first =
        value
          .map(
            item =>
              this.normalizeError(
                item
              )
          )
          .find(Boolean);

      return first ||
        null;
    }

    if (
      typeof value ===
      "string"
    ) {
      const message =
        this.cleanText(
          value
        );

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

    if (
      value instanceof
      Error
    ) {
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

    if (
      typeof value !==
        "object"
    ) {
      return {
        code:
          "runtime_error",

        message:
          this.cleanText(
            value
          ) ||
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
      deliveryCandidate.complete ===
        true ||
      deliveryCandidate.completed ===
        true ||
      deliveryCandidate.delivered ===
        true
    ) {
      return true;
    }

    if (
      runtimeState.complete ===
        true ||
      runtimeState.completed ===
        true ||
      runtimeState.lifecycle
        ?.complete ===
        true ||
      runtimeState.lifecycle
        ?.completed ===
        true
    ) {
      return true;
    }

    return Boolean(
      reply &&
      deliveryCandidate
    );
  },

  resolveAuthoritativeStatus({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    if (
      deliveryCandidate.authoritative ===
        false ||
      deliveryCandidate.isAuthoritative ===
        false
    ) {
      return false;
    }

    if (
      deliveryCandidate.authoritative ===
        true ||
      deliveryCandidate.isAuthoritative ===
        true ||
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
      ).length >
        0
    ) {
      return true;
    }

    return Boolean(
      runtimeState.deliveryResult &&
      deliveryCandidate
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
        deliveryCandidate
          .deliveryStatus ||
        deliveryCandidate
          .status ||
        runtimeState
          .deliveryStatus ||
        ""
      );

    if (runtimeError) {
      return "failed";
    }

    if (
      explicitStatus ===
        "delivered" ||
      explicitStatus ===
        "complete" ||
      explicitStatus ===
        "completed" ||
      explicitStatus ===
        "success"
    ) {
      return "delivered";
    }

    if (
      explicitStatus ===
        "failed" ||
      explicitStatus ===
        "error"
    ) {
      return "failed";
    }

    if (!authoritative) {
      return "non_authoritative";
    }

    if (
      !complete ||
      !reply
    ) {
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
        deliveryCandidate
          .currentTurnId ||
        runtimeState
          .currentTurnId ||
        runtimeState.turnId ||
        runtimeState.turn
          ?.turnId ||
        ""
      ) ||
      null
    );
  },

  /* =====================================================
     SUMMARY
  ===================================================== */

  buildRuntimeSummary({
    runtimeState = {},
    deliveryCandidate = {},
    options = {}
  } = {}) {
    if (
      options.includeSummary ===
      false
    ) {
      return null;
    }

    const suppliedSummary =
      deliveryCandidate.summary ||
      runtimeState.runtimeSummary ||
      runtimeState.pipelineSummary ||
      null;

    if (
      suppliedSummary &&
      typeof suppliedSummary ===
        "object" &&
      !Array.isArray(
        suppliedSummary
      )
    ) {
      return suppliedSummary;
    }

    return {
      request: {
        userMessage:
          this.cleanText(
            runtimeState
              .userMessage ||
            runtimeState
              .turn
              ?.originalText ||
            ""
          ) ||
          null,

        resolvedUserQuestion:
          this.cleanText(
            runtimeState
              .resolvedUserQuestion ||
            ""
          ) ||
          null,

        turnId:
          this.extractTurnId({
            runtimeState,
            deliveryCandidate
          })
      },

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
        })
    };
  },

  normalizeLifecycle(
    runtimeState = {}
  ) {
    const lifecycle =
      runtimeState.lifecycle &&
      typeof runtimeState.lifecycle ===
        "object"
        ? runtimeState.lifecycle
        : {};

    return {
      architecture:
        lifecycle.architecture ||
        runtimeState
          .runtimeArchitecture ||
        "canonical-five-layer",

      complete:
        lifecycle.complete ===
          true ||
        runtimeState.complete ===
          true ||
        runtimeState.completed ===
          true,

      layers:
        lifecycle.layers ||
        runtimeState.layerResults ||
        {},

      lifecycleErrors:
        this.toArray(
          lifecycle
            .lifecycleErrors ||
          lifecycle.errors ||
          runtimeState
            .lifecycleErrors
        )
    };
  },

  normalizePerceptionSummary(
    runtimeState = {}
  ) {
    return {
      ran:
        runtimeState
          .perceptionResult !=
        null ||
        runtimeState
          .perceptionCompleted ===
        true,

      observationCount:
        this.toArray(
          runtimeState
            .perceptionLedger
            ?.observations ||
          runtimeState
            .observations
        ).length,

      primaryFunction:
        runtimeState
          .conversationFunction
          ?.primary ||
        runtimeState
          .conversationFunction ||
        null,

      conversationType:
        runtimeState
          .conversationType ||
        null,

      conversationIntent:
        runtimeState
          .conversationIntent ||
        null,

      semanticSummary:
        runtimeState
          .semanticFrame
          ?.summary ||
        runtimeState
          .semanticSummary ||
        null
    };
  },

  normalizeRoutingSummary(
    runtimeState = {}
  ) {
    return {
      mode:
        runtimeState
          .routingDecision
          ?.mode ||
        runtimeState
          .routingMode ||
        null,

      primaryIntent:
        runtimeState
          .routingDecision
          ?.primaryIntent ||
        runtimeState
          .primaryIntent ||
        null,

      domain:
        runtimeState
          .routingDecision
          ?.domain ||
        runtimeState.domain ||
        null,

      contextLane:
        runtimeState
          .routingDecision
          ?.contextLane ||
        runtimeState
          .contextLane ||
        null,

      primaryLane:
        runtimeState
          .routingDecision
          ?.primaryLane ||
        runtimeState
          .primaryLane ||
        null,

      planner:
        runtimeState
          .routingDecision
          ?.planner ||
        runtimeState
          .planner ||
        null
    };
  },

  normalizeDeliberationSummary(
    runtimeState = {}
  ) {
    return {
      ran:
        runtimeState
          .deliberationResult !=
        null ||
        runtimeState
          .deliberationCompleted ===
        true,

      responseGoal:
        runtimeState
          .canonicalResponsePlan
          ?.responseGoal ||
        runtimeState
          .responseGoal ||
        null,

      responseShape:
        runtimeState
          .canonicalResponsePlan
          ?.responseShape ||
        runtimeState
          .responseShape ||
        null,

      responseMoveCount:
        this.toArray(
          runtimeState
            .canonicalResponsePlan
            ?.responseMoves ||
          runtimeState
            .responseMoves
        ).length,

      safetyDisposition:
        runtimeState
          .safetyDisposition ||
        runtimeState
          .safetyContext
          ?.disposition ||
        null
    };
  },

  normalizeExpressionSummary(
    runtimeState = {}
  ) {
    return {
      ran:
        runtimeState
          .expressionResult !=
        null ||
        runtimeState
          .expressionCompleted ===
        true,

      selectedDraftAvailable:
        Boolean(
          runtimeState
            .selectedDraft
        ),

      finalCompositionAvailable:
        Boolean(
          runtimeState
            .finalComposition
        ),

      finalResponseAvailable:
        Boolean(
          runtimeState
            .finalResponse
        )
    };
  },

  normalizeDeliverySummary({
    runtimeState = {},
    deliveryCandidate = {}
  } = {}) {
    return {
      ran:
        Boolean(
          runtimeState
            .deliveryResult ||
          deliveryCandidate
        ),

      authoritative:
        this.resolveAuthoritativeStatus({
          runtimeState,
          deliveryCandidate
        }),

      complete:
        this.resolveCompletionStatus({
          runtimeState,
          deliveryCandidate,
          reply:
            this.extractReply({
              runtimeState,
              deliveryCandidate
            })
        }),

      status:
        deliveryCandidate
          .deliveryStatus ||
        runtimeState
          .deliveryStatus ||
        null
    };
  },

  resolveSummary({
    delivery = {},
    options = {}
  } = {}) {
    if (
      options.includeSummary ===
      false
    ) {
      return null;
    }

    return (
      delivery.summary ||
      null
    );
  },

  /* =====================================================
     DELIVERY VALIDATION
  ===================================================== */

  validateDeliveryResult(
    delivery = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !delivery ||
      typeof delivery !==
        "object" ||
      Array.isArray(
        delivery
      )
    ) {
      return {
        valid:
          false,

        ready:
          false,

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
      delivery.authoritative !==
      true
    ) {
      errors.push(
        "delivery_result_not_authoritative"
      );
    }

    if (
      delivery.complete !==
      true
    ) {
      errors.push(
        "delivery_result_incomplete"
      );
    }

    if (
      delivery.error
    ) {
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

    if (
      !delivery.turnId
    ) {
      warnings.push(
        "delivery_turn_id_missing"
      );
    }

    if (
      !delivery.emotion
    ) {
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
        errors.length ===
        0,

      ready:
        errors.length ===
        0,

      errors:
        this.uniqueValues(
          errors
        ),

      warnings:
        this.uniqueValues(
          warnings
        ),

      checks: {
        deliveryResultAvailable:
          Boolean(
            delivery
          ),

        replyAvailable:
          Boolean(
            reply
          ),

        authoritative:
          delivery.authoritative ===
          true,

        complete:
          delivery.complete ===
          true,

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
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      ) &&
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
        runtimeError
          ?.message
      ) ||
      this.resolveFailureMessage({
        delivery,
        validation
      });

    const errorCode =
      runtimeError
        ?.code ||
      validation
        ?.errors
        ?.[0] ||
      "runtime_delivery_failed";

    const response = {
      schema:
        "ari_app_bridge_response",

      schemaVersion:
        this.schemaVersion,

      reply:
        options
          .includeFailureReply ===
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
          : delivery.summary ||
            null,

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
          runtimeError
            ?.source ||
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
        new Date()
          .toISOString(),

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
          "completed_runtime_state_if_available",

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
      emotion !==
      "neutral"
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
    return {
      runtimeDeliveryReady:
        validation.valid ===
        true,

      runtimeDeliverySource:
        this.source,

      runtimeDeliveryVersion:
        this.version,

      authoritative:
        delivery.authoritative ===
        true,

      complete:
        delivery.complete ===
        true,

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
      options
        .includeCompatibilityFields ===
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
          response.ok ===
          true,

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

  normalizeOptions(
    options = {}
  ) {
    if (
      !options ||
      typeof options !==
        "object" ||
      Array.isArray(
        options
      )
    ) {
      return {
        includeSummary:
          true,

        includeCompatibilityFields:
          true,

        includeFailureReply:
          true
      };
    }

    return {
      includeSummary:
        options.includeSummary !==
        false,

      includeCompatibilityFields:
        options
          .includeCompatibilityFields !==
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
        "authoritative_delivery_reading_and_application_adaptation"
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
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-runtime-delivery-validation",

      version:
        this.version,

      errors,

      warnings: [],

      checks: {
        deliveryReadingEnabled:
          authority
            .canReadAuthoritativeDelivery ===
          true,

        deliveryValidationEnabled:
          authority
            .canValidateDeliveryResult ===
          true,

        applicationAdaptationEnabled:
          authority
            .canAdaptApplicationResponse ===
          true,

        responseGenerationDisabled:
          authority
            .canGenerateReply ===
          false,

        emotionInferenceDisabled:
          authority
            .canInferEmotion ===
          false,

        actionInventionDisabled:
          authority
            .canInventActions ===
          false,

        actionExecutionDisabled:
          authority
            .canExecuteActions ===
          false,

        persistenceDisabled:
          authority
            .canPersistState ===
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

  uniqueValues(
    values = []
  ) {
    const output = [];
    const seen =
      new Set();

    this.toArray(
      values
    ).forEach(
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
          seen.has(
            key
          )
        ) {
          return;
        }

        seen.add(
          key
        );

        output.push(
          value
        );
      }
    );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

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
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (_error) {
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

window.Ari.runtimeDelivery =
  window.AriRuntimeDelivery;

console.log(
  "ARI RUNTIME DELIVERY LOADED:",
  window.AriRuntimeDelivery
    ?.version,
  window.AriRuntimeDelivery
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);