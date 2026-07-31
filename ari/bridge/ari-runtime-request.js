// ari/bridge/ari-runtime-request.js
// Ari Runtime Request
//
// Purpose:
// Build the canonical Ari Rebirth runtime request consumed by the existing
// five-layer pipeline while preserving all current compatibility aliases.
//
// V1.0.1 — Current Pipeline Compatibility / Canonical Turn Authority
//
// Architectural flow:
//
// Ari Rebirth App Bridge
//      ↓
// Ari Runtime Request
//      ↓
// Canonical Runtime Request Envelope
//      ↓
// Ari Rebirth Pipeline
//
// Responsibilities:
// - Validate and normalize the current user message.
// - Create one canonical current-turn object.
// - Preserve the original current-turn text.
// - Build the application context supplied by CalBuddy.
// - Preserve externally supplied GitHub and developer evidence.
// - Preserve conversation history supplied by the application.
// - Preserve the compatibility aliases currently consumed downstream.
// - Create the runtime execution policy.
// - Return a validated request envelope.
//
// Non-responsibilities:
// - Does not load runtime scripts.
// - Does not execute AriRebirthPipeline.
// - Does not classify the conversation.
// - Does not interpret semantic meaning.
// - Does not resolve continuity.
// - Does not rewrite or resolve the current turn.
// - Does not determine developer relevance.
// - Does not determine safety severity.
// - Does not create a response plan.
// - Does not create a Composer Packet.
// - Does not generate a response.
// - Does not read Delivery output.
// - Does not persist state.
// - Does not access Supabase.

window.Ari = window.Ari || {};

window.AriRuntimeRequest = {
  version: "1.0.1",
  schemaVersion: "2.0.0",
  source: "ari-runtime-request",
  authorityLevel: "canonical_runtime_request_construction",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build({
    message = "",
    options = {}
  } = {}) {
    const normalizedOptions =
      this.normalizeOptions(
        options
      );

    const currentMessage =
      this.cleanText(
        message
      );

    const now =
      new Date();

    const turnId =
      this.resolveTurnId(
        normalizedOptions.turnId
      );

    const source =
      this.resolveRequestSource(
        normalizedOptions
      );

    const normalizedText =
      this.normalizeText(
        currentMessage
      );

    const externalEvidence =
      this.buildExternalEvidence({
        options:
          normalizedOptions
      });

    const appContext =
      this.buildAppContext({
        options:
          normalizedOptions,

        source,

        externalEvidence
      });

    const turn =
      this.buildCanonicalTurn({
        turnId,

        message:
          currentMessage,

        normalizedText,

        source,

        createdAt:
          now.toISOString()
      });

    const request =
      this.buildCompatibleRuntimeEnvelope({
        turn,

        appContext,

        externalEvidence,

        options:
          normalizedOptions,

        createdAt:
          now.toISOString()
      });

    const validation =
      this.validateRequest(
        request
      );

    return {
      ...request,

      runtimeRequestValidation:
        validation,

      runtimeRequestReady:
        validation.valid ===
        true,

      runtimeRequestSource:
        this.source,

      runtimeRequestVersion:
        this.version,

      runtimeRequestSchemaVersion:
        this.schemaVersion
    };
  },

  /* =====================================================
     CANONICAL TURN
  ===================================================== */

  buildCanonicalTurn({
    turnId = null,
    message = "",
    normalizedText = "",
    source = "calbuddy-health",
    createdAt = null
  } = {}) {
    const originalText =
      this.cleanText(
        message
      );

    const currentText =
      originalText;

    return {
      schema:
        "ari_runtime_turn",

      schemaVersion:
        this.schemaVersion,

      turnId,

      originalText,

      currentText,

      effectiveText:
        currentText,

      semanticInputText:
        currentText,

      normalizedText:
        normalizedText ||
        this.normalizeText(
          currentText
        ),

      source,

      createdAt:
        createdAt ||
        new Date()
          .toISOString(),

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
    };
  },

  /* =====================================================
     RUNTIME ENVELOPE
  ===================================================== */

  buildCompatibleRuntimeEnvelope({
    turn = {},
    appContext = {},
    externalEvidence = {},
    options = {},
    createdAt = null
  } = {}) {
    const originalText =
      this.cleanText(
        turn.originalText
      );

    const normalizedText =
      this.normalizeText(
        turn.normalizedText ||
        originalText
      );

    const githubFileContext =
      externalEvidence
        .githubFileContext ||
      null;

    const githubEvidence =
      externalEvidence
        .githubEvidence ||
      null;

    const developerInvestigation =
      externalEvidence
        .developerInvestigation ||
      null;

    return {
      schema:
        "ari_rebirth_runtime_request",

      schemaVersion:
        this.schemaVersion,

      source:
        this.source,

      requestSource:
        turn.source ||
        appContext.source ||
        "calbuddy-health",

      bridgeVersion:
        options.bridgeVersion ||
        window
          .AriRebirthAppBridge
          ?.version ||
        null,

      createdAt:
        createdAt ||
        new Date()
          .toISOString(),

      debugTiming:
        options.debugTiming ===
        true,

      turn,

      /*
       * Compatibility aliases
       * -------------------------------------------------
       * These fields intentionally mirror the canonical
       * current turn while the existing five-layer runtime
       * completes migration to `request.turn`.
       *
       * They must never be populated using previous-turn text.
       */

      currentTurnId:
        turn.turnId ||
        null,

      turnId:
        turn.turnId ||
        null,

      userMessage:
        originalText,

      originalUserMessage:
        originalText,

      message:
        originalText,

      input:
        originalText,

      currentTurnText:
        turn.currentText ||
        originalText,

      semanticInputText:
        turn.semanticInputText ||
        originalText,

      normalizedMessage:
        normalizedText,

      /*
       * Continuity has not resolved the current turn yet.
       * These values remain empty at the application boundary.
       */

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
       * Externally supplied evidence remains evidence only.
       * This request builder does not determine whether it
       * should influence the response.
       */

      githubFileContext,

      githubEvidence,

      developerInvestigation,

      externalEvidence,

      appContext,

      runtimePolicy:
        this.buildRuntimePolicy({
          options
        }),

      authority: {
        canDefineCurrentTurn:
          true,

        canPreserveApplicationContext:
          true,

        canPreserveExternalEvidence:
          true,

        canExposeCompatibilityAliases:
          true,

        canRunPipeline:
          false,

        canResolveContinuity:
          false,

        canClassifyConversation:
          false,

        canInterpretMeaning:
          false,

        canChooseRoute:
          false,

        canDetermineSafety:
          false,

        canCreateResponsePlan:
          false,

        canCreateComposerPacket:
          false,

        canGenerateResponse:
          false,

        canReadDelivery:
          false,

        canPersistState:
          false,

        role:
          "canonical_runtime_request_construction"
      }
    };
  },

  /* =====================================================
     APPLICATION CONTEXT
  ===================================================== */

  buildAppContext({
  options = {},
  source = "calbuddy-health",
  externalEvidence = {}
} = {}) {
  const suppliedAppContext =
    this.normalizeOptionalObject(
      options.appContext
    ) || {};

  const history =
      this.normalizeHistory(
        options.history
      );

    return {
  /*
   * Preserve application-provided context while allowing
   * the canonical fields below to remain authoritative.
   */
  ...suppliedAppContext,

  schema:
    "ari_app_context",

      schemaVersion:
        this.schemaVersion,

      source,

      appMode:
        "rebirth-only",

      page:
  this.cleanText(
    suppliedAppContext.page ||
    options.page
  ) ||
  "unknown",

domain:
  this.normalizeIdentifier(
    suppliedAppContext.domain ||
    options.domain
  ) ||
  "general",

operation:
  this.normalizeIdentifier(
    suppliedAppContext.operation ||
    options.operation
  ) ||
  null,

requestedResult:
  this.normalizeIdentifier(
    suppliedAppContext.requestedResult ||
    options.requestedResult
  ) ||
  null,

selectedMealType:
  this.cleanText(
    suppliedAppContext.selectedMealType ||
    options.selectedMealType
  ) ||
  null,

doNotLog:
  suppliedAppContext.doNotLog ===
    true ||
  options.doNotLog ===
    true,

readOnly:
  suppliedAppContext.readOnly ===
    true ||
  suppliedAppContext.doNotLog ===
    true ||
  options.readOnly ===
    true ||
  options.doNotLog ===
    true,

      debugTiming:
        options.debugTiming ===
        true,

      ownerMode:
        options.ownerMode ===
        true,

      userContext:
        this.normalizeOptionalObject(
          options.userContext
        ),

      coachMemorySummary:
        this.cleanText(
          options
            .coachMemorySummary
        ),

      goals:
        this.normalizeOptionalValue(
          options.goals
        ),

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
        this.normalizeOptionalValue(
          options.user
        ),

      ariPermissions:
        this.normalizeOptionalObject(
          options.ariPermissions
        ) ||
        {},

      history,

      externalEvidence: {
        ...externalEvidence,

        source:
          externalEvidence
            .evidenceSource ||
          "none"
      },

      permissions:
        this.buildApplicationPermissions(
          options
        ),

      authority:
        "application_context_only"
    };
  },

  buildApplicationPermissions(
    options = {}
  ) {
    return {
      allowDirectWrites:
        false,

      requireApprovalForActions:
        true,

      allowToolExecution:
        false,

      allowMemoryPersistence:
        options
          .allowMemoryPersistence ===
        true,

      authority:
        "application_permission_boundary"
    };
  },

  /* =====================================================
     EXTERNAL EVIDENCE
  ===================================================== */

  buildExternalEvidence({
    options = {}
  } = {}) {
    const githubFileContext =
      this.normalizeEvidenceObject(
        options.githubFileContext
      );

    const suppliedGithubEvidence =
      this.normalizeEvidenceObject(
        options.githubEvidence
      );

    const githubEvidence =
      suppliedGithubEvidence ||
      githubFileContext ||
      null;

    const developerInvestigation =
      this.normalizeEvidenceObject(
        options
          .developerInvestigation
      );

    const evidenceSource =
      githubEvidence
        ? "app_supplied_github_evidence"
        : developerInvestigation
          ? "app_supplied_developer_investigation"
          : "none";

    return {
      githubFileContext,

      githubEvidence,

      developerInvestigation,

      evidenceSource,

      authority:
        "externally_supplied_evidence_only"
    };
  },

  normalizeEvidenceObject(
    value = null
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
      return null;
    }

    return {
      ...value
    };
  },

  /* =====================================================
     RUNTIME POLICY
  ===================================================== */

  buildRuntimePolicy({
    options = {}
  } = {}) {
    return {
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

      allowCompatibilityRequestAliases:
        true,

      includeRuntimeSummary:
        options.includeSummary !==
        false,

      authority:
        "runtime_entry_policy"
    };
  },

  /* =====================================================
     HISTORY
  ===================================================== */

  normalizeHistory(
    history = []
  ) {
    return this.toArray(
      history
    )
      .map(
        item =>
          this.normalizeHistoryItem(
            item
          )
      )
      .filter(Boolean)
      .slice(
        -20
      );
  },

  normalizeHistoryItem(
    item = null
  ) {
    if (
      item ===
        null ||
      item ===
        undefined
    ) {
      return null;
    }

    if (
      typeof item ===
      "string"
    ) {
      const content =
        this.cleanText(
          item
        );

      return content
        ? {
            role:
              "unknown",

            content
          }
        : null;
    }

    if (
      typeof item !==
        "object" ||
      Array.isArray(
        item
      )
    ) {
      return null;
    }

    const role =
      this.cleanText(
        item.role ||
        item.author ||
        item.sender ||
        ""
      ) ||
      "unknown";

    const content =
      this.extractHistoryContent(
        item
      );

    if (!content) {
      return null;
    }

    return {
      ...item,

      role,

      content
    };
  },

  extractHistoryContent(
    item = {}
  ) {
    const candidates = [
      item.content,
      item.text,
      item.message,
      item.reply,
      item.body
    ];

    for (
      const candidate
      of candidates
    ) {
      const content =
        this.cleanText(
          candidate
        );

      if (content) {
        return content;
      }
    }

    return "";
  },

  /* =====================================================
     REQUEST VALIDATION
  ===================================================== */

  validateRequest(
    request = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !request ||
      typeof request !==
        "object" ||
      Array.isArray(
        request
      )
    ) {
      return {
        valid:
          false,

        ready:
          false,

        errors: [
          "runtime_request_invalid"
        ],

        warnings: [],

        source:
          "ari-runtime-request-validation",

        version:
          this.version
      };
    }

    const turn =
      request.turn;

    if (
      !turn ||
      typeof turn !==
        "object" ||
      Array.isArray(
        turn
      )
    ) {
      errors.push(
        "canonical_turn_missing"
      );
    }

    const turnId =
      this.cleanText(
        turn?.turnId
      );

    const originalText =
      this.cleanText(
        turn?.originalText
      );

    const currentText =
      this.cleanText(
        turn?.currentText
      );

    if (!turnId) {
      errors.push(
        "turn_id_missing"
      );
    }

    if (!originalText) {
      errors.push(
        "original_turn_text_missing"
      );
    }

    if (!currentText) {
      errors.push(
        "current_turn_text_missing"
      );
    }

    if (
      originalText &&
      currentText &&
      originalText !==
        currentText &&
      turn?.textWasRewritten !==
        true
    ) {
      warnings.push(
        "turn_text_changed_without_rewrite_marker"
      );
    }

    if (
      turn
        ?.originalTextPreserved ===
      false
    ) {
      errors.push(
        "original_turn_not_preserved"
      );
    }

    if (
      request.runtimePolicy
        ?.runMasterPipelineOnce !==
      true
    ) {
      errors.push(
        "single_pipeline_execution_policy_missing"
      );
    }

    if (
      request.runtimePolicy
        ?.requireAuthoritativeDelivery !==
      true
    ) {
      warnings.push(
        "authoritative_delivery_not_required"
      );
    }

    if (
      request.runtimePolicy
        ?.bridgeMayComposeResponse ===
      true
    ) {
      errors.push(
        "bridge_response_composition_must_be_disabled"
      );
    }

    if (
      request.runtimePolicy
        ?.bridgeMaySelectDraft ===
      true
    ) {
      errors.push(
        "bridge_draft_selection_must_be_disabled"
      );
    }

    const aliasChecks = {
      currentTurnId:
        request.currentTurnId,

      turnId:
        request.turnId,

      userMessage:
        request.userMessage,

      originalUserMessage:
        request.originalUserMessage,

      message:
        request.message,

      input:
        request.input,

      currentTurnText:
        request.currentTurnText,

      semanticInputText:
        request.semanticInputText
    };

    if (
      turnId &&
      (
        aliasChecks
          .currentTurnId !==
          turnId ||
        aliasChecks.turnId !==
          turnId
      )
    ) {
      warnings.push(
        "turn_id_alias_mismatch"
      );
    }

    if (
      originalText &&
      [
        aliasChecks
          .userMessage,
        aliasChecks
          .originalUserMessage,
        aliasChecks.message,
        aliasChecks.input
      ].some(
        value =>
          this.cleanText(
            value
          ) !==
          originalText
      )
    ) {
      warnings.push(
        "current_turn_text_alias_mismatch"
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
        canonicalTurnAvailable:
          Boolean(
            turn &&
            typeof turn ===
              "object"
          ),

        turnIdAvailable:
          Boolean(
            turnId
          ),

        originalTextAvailable:
          Boolean(
            originalText
          ),

        currentTextAvailable:
          Boolean(
            currentText
          ),

        originalTextPreserved:
          turn
            ?.originalTextPreserved !==
          false,

        textNotRewrittenAtBoundary:
          turn
            ?.textWasRewritten !==
          true,

        continuityResolutionDeferred:
          request
            .currentTurnWasResolved !==
          true,

        pipelineSinglePassRequired:
          request.runtimePolicy
            ?.runMasterPipelineOnce ===
          true,

        authoritativeDeliveryRequired:
          request.runtimePolicy
            ?.requireAuthoritativeDelivery ===
          true,

        bridgeCompositionDisabled:
          request.runtimePolicy
            ?.bridgeMayComposeResponse ===
          false,

        bridgeSelectionDisabled:
          request.runtimePolicy
            ?.bridgeMaySelectDraft ===
          false
      },

      source:
        "ari-runtime-request-validation",

      version:
        this.version
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
      return {};
    }

    return {
      ...options
    };
  },

  resolveRequestSource(
    options = {}
  ) {
    return (
      this.cleanText(
        options.source
      ) ||
      "calbuddy-health"
    );
  },

  /* =====================================================
     TURN ID
  ===================================================== */

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

    const generated =
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : [
            Date.now()
              .toString(
                36
              ),

            Math.random()
              .toString(
                36
              )
              .slice(
                2,
                10
              )
          ].join(
            "_"
          );

    return `ari_turn_${generated}`;
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canBuildCanonicalTurn:
        true,

      canBuildRuntimeRequest:
        true,

      canPreserveOriginalCurrentTurn:
        true,

      canAttachApplicationContext:
        true,

      canAttachExternalEvidence:
        true,

      canExposeCompatibilityAliases:
        true,

      canValidateRuntimeRequest:
        true,

      canCreateTurnId:
        true,

      canLoadScripts:
        false,

      canExecuteMasterPipeline:
        false,

      canResolveContinuity:
        false,

      canRewriteCurrentTurn:
        false,

      canClassifyConversation:
        false,

      canInterpretSemanticMeaning:
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

      canSelectResponse:
        false,

      canComposeResponse:
        false,

      canReadDelivery:
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
        "canonical_runtime_request_construction"
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
      "developerIntent",
      "resolvedUserQuestion",
      "resolvedCurrentTurn",
      "currentTurnWasResolved",
      "ellipticalFollowUpResolved",
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
      "canLoadScripts",
      "canExecuteMasterPipeline",
      "canResolveContinuity",
      "canRewriteCurrentTurn",
      "canClassifyConversation",
      "canInterpretSemanticMeaning",
      "canDetermineDeveloperIntent",
      "canDetermineSafetySeverity",
      "canChooseResponsePlan",
      "canCreateComposerPacket",
      "canCreateResponseCandidate",
      "canSelectResponse",
      "canComposeResponse",
      "canReadDelivery",
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
        "ari-runtime-request-validation",

      version:
        this.version,

      errors,

      warnings: [],

      checks: {
        canonicalTurnAuthority:
          authority
            .canBuildCanonicalTurn ===
          true,

        originalTurnPreservation:
          authority
            .canPreserveOriginalCurrentTurn ===
          true,

        compatibilityAliasesAvailable:
          authority
            .canExposeCompatibilityAliases ===
          true,

        continuityResolutionDisabled:
          authority
            .canResolveContinuity ===
          false,

        responseCompositionDisabled:
          authority
            .canComposeResponse ===
          false,

        deliveryReadingDisabled:
          authority
            .canReadDelivery ===
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

  normalizeOptionalObject(
    value = null
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
      return null;
    }

    return {
      ...value
    };
  },

  normalizeOptionalValue(
    value = null
  ) {
    if (
      value ===
        undefined
    ) {
      return null;
    }

    return value;
  },

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

window.Ari.runtimeRequest =
  window.AriRuntimeRequest;

console.log(
  "ARI RUNTIME REQUEST LOADED:",
  window.AriRuntimeRequest
    ?.version,
  window.AriRuntimeRequest
    ?.validate?.()
    .valid ===
    true
    ? "READY"
    : "INVALID"
);