// ari/continuity/ari-elliptical-follow-up-resolver.js
// Ari Elliptical Follow-Up Resolver
//
// Purpose:
// Detect context-dependent follow-up turns, prepare a bounded continuity
// packet, ask the configured model layer to resolve the omitted meaning,
// validate the model result, and publish a canonical continuity result.
//
// V3.0.1 — AI-Assisted Ellipsis Resolution / Deterministic Governance
//
// Execution position:
//
// Thread Understanding
//      ↓
// Elliptical Follow-Up Resolver
//      ↓
// Entity & Reference Resolver
//      ↓
// Continuity Packet
//
// Responsibilities:
// - Preserve the original current-turn text exactly.
// - Detect likely context dependence with lightweight structural signals.
// - Collect only the nearest useful conversation context.
// - Ask the configured Ari model layer to resolve the follow-up.
// - Require structured model output.
// - Reject unsupported, malformed, invented, or overconfident resolutions.
// - Publish compatibility fields consumed by the continuity pipeline.
//
// Non-responsibilities:
// - Does not answer the user.
// - Does not select the conversation function or executive lane.
// - Does not replace the Semantic Frame Builder.
// - Does not replace the Entity & Reference Resolver.
// - Does not change safety severity.
// - Does not retrieve long-term memory.
// - Does not persist thread state.
// - Does not independently invent a resolved meaning.

window.Ari = window.Ari || {};

window.AriEllipticalFollowUpResolver = {
  version: "3.0.1",
  schemaVersion: "3.0.1",

  config: {
    maxRecentTurns: 8,
    maxContextCharacters: 6000,
    maxResolvedCharacters: 1200,
    minimumAcceptedConfidence: 0.72
  },

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async resolve(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const runtime =
      input.runtime ||
      summary.runtime ||
      {};

    const currentTurn =
      this.readCurrentTurn(summary);

    const threadContext =
      this.readThreadContext(summary);

    const recentTurns =
      this.collectRecentTurns({
        summary,
        threadContext,
        currentTurn
      });

    const detection =
      this.detectContextDependency({
        currentTurn,
        recentTurns,
        summary
      });

    if (
      detection.detected !==
      true
    ) {
      const result =
        this.buildNotDetectedResult({
          currentTurn,
          recentTurns,
          detection
        });

      this.publishResult(result);

      return this.buildReturnPayload(
        result
      );
    }

    const resolutionPacket =
      this.buildResolutionPacket({
        currentTurn,
        recentTurns,
        detection,
        summary
      });

    let modelResponse = null;
    let modelError = null;

    try {
      modelResponse =
        await this.invokeModelResolver({
          packet:
            resolutionPacket,

          runtime,
          summary
        });
    } catch (error) {
      modelError =
        this.serializeError(
          error
        );
    }

    const parsed =
      this.parseModelResponse(
        modelResponse
      );

    const validation =
      this.validateModelResolution({
        parsed,
        packet:
          resolutionPacket,

        currentTurn,
        recentTurns
      });

    const result =
      this.buildCanonicalResult({
        currentTurn,
        recentTurns,
        detection,
        resolutionPacket,
        parsed,
        validation,
        modelError
      });

    this.publishResult(result);

    return this.buildReturnPayload(
      result
    );
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  readCurrentTurn(
    summary = {}
  ) {
    const originalText =
      this.clean(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        summary.threadContext
          ?.currentTurn
          ?.originalText ||
        summary.threadContext
          ?.currentTurn
          ?.text ||
        ""
      );

    const normalizedText =
      this.normalize(
        originalText
      );

    const tokens =
      normalizedText
        .split(/\s+/)
        .filter(Boolean);

    return {
      turnId:
        summary.turnId ||
        summary.currentTurnId ||
        summary.threadContext
          ?.currentTurn
          ?.turnId ||
        summary.threadContext
          ?.currentTurn
          ?.id ||
        this.createStableId(
          "turn",
          originalText
        ),

      originalText,

      text:
        originalText,

      normalizedText,

      tokens,

      wordCount:
        tokens.length,

      characterCount:
        originalText.length,

      authority:
        "current_turn_record_only"
    };
  },

  /* =====================================================
     THREAD CONTEXT
  ===================================================== */

  readThreadContext(
    summary = {}
  ) {
    const candidates = [
      summary.threadContext,
      summary
        .threadUnderstanding
        ?.threadContext,
      summary
        .threadUnderstandingResult
        ?.threadContext,
      summary
        .continuityResults
        ?.outputs
        ?.thread
        ?.threadContext,
      summary
        .continuityResults
        ?.outputs
        ?.thread,
      summary
        .continuityPacket
        ?.threadContext,
      summary.threadState,
      window.Ari
        ?.threadContext,
      window.Ari
        ?.threadUnderstanding
        ?.threadContext
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
          !Array.isArray(
            candidate
          )
      ) ||
      {};

    return {
      ...found,

      currentTurn:
        found.currentTurn ||
        null,

      immediatePreviousUserTurn:
        found
          .immediatePreviousUserTurn ||
        null,

      immediatePreviousAssistantTurn:
        found
          .immediatePreviousAssistantTurn ||
        null,

      recentTurns:
        this.asArray(
          found.recentTurns ||
          found.recentMessages ||
          found.messages
        ),

      source:
        found.source ||
        "thread_context_fallback"
    };
  },

  collectRecentTurns({
    summary = {},
    threadContext = {},
    currentTurn = {}
  } = {}) {
    const sources = [
  threadContext.recentTurns,
  summary.recentMessages,
  summary.messages,
  summary.threadMessages,
  summary.conversationHistory,
      summary
        .continuityPacket
        ?.recentTurns,
      summary
        .threadState
        ?.recentMessages,
      threadContext
        .immediatePreviousUserTurn,
      threadContext
        .immediatePreviousAssistantTurn
    ];

    const collected = [];

    sources.forEach(
      source => {
        this.asArray(
          source
        ).forEach(
          turn => {
            const normalized =
              this.normalizeTurn(
                turn
              );

            if (
              normalized?.text &&
              !this.isCurrentTurn({
                turn:
                  normalized,

                currentTurn
              })
            ) {
              collected.push(
                normalized
              );
            }
          }
        );
      }
    );

    const deduped =
      this.dedupeTurns(
        collected
      );

    return deduped.slice(
      -this.config.maxRecentTurns
    );
  },

  normalizeTurn(
    turn = null
  ) {
    if (!turn) {
      return null;
    }

    if (
      typeof turn ===
      "string"
    ) {
      const text =
        this.clean(
          turn
        );

      return text
        ? {
            id:
              this.createStableId(
                "turn",
                text
              ),

            role:
              null,

            text,

            createdAt:
              null
          }
        : null;
    }

    if (
      typeof turn !==
      "object"
    ) {
      return null;
    }

    const text =
      this.clean(
        turn.text ||
        turn.content ||
        turn.message ||
        turn.body ||
        turn.value ||
        ""
      );

    if (!text) {
      return null;
    }

    return {
      id:
        turn.id ||
        turn.turnId ||
        turn.messageId ||
        this.createStableId(
          "turn",
          [
            turn.role,
            text,
            turn.createdAt ||
              turn.timestamp
          ].join("|")
        ),

      role:
        this.normalizeRole(
          turn.role ||
          turn.speaker ||
          turn.author ||
          turn.type
        ),

      text,

      createdAt:
        turn.createdAt ||
        turn.created_at ||
        turn.timestamp ||
        null,

      raw:
        turn
    };
  },

  isCurrentTurn({
    turn = {},
    currentTurn = {}
  } = {}) {
    if (
      turn.id &&
      currentTurn.turnId &&
      String(
        turn.id
      ) ===
        String(
          currentTurn.turnId
        )
    ) {
      return true;
    }

    return Boolean(
      turn.text &&
      currentTurn.originalText &&
      this.normalize(
        turn.text
      ) ===
        this.normalize(
          currentTurn.originalText
        )
    );
  },

  dedupeTurns(
    turns = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      turns
    ).filter(
      turn => {
        const key =
          [
            turn.id ||
              "no_id",
            turn.role ||
              "no_role",
            this.normalize(
              turn.text
            )
          ].join("|");

        if (
          !turn.text ||
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
  },

  /* =====================================================
     LIGHTWEIGHT DETECTION
  ===================================================== */

  detectContextDependency({
  currentTurn = {},
  recentTurns = [],
  summary = {}
} = {}) {
  const text =
    currentTurn.normalizedText || "";

  const priorContextAvailable =
    recentTurns.length > 0;

  const explicitReference =
    /\b(?:that one|this one|the other one|what you said|your answer|your response|the previous answer|that|this|it|those|these|them)\b/i
      .test(text);

  const bareFollowUp =
    /^(?:why|why not|how|how so|what|who|where|when|which|which one|really|seriously|are you sure|then what|what next|now what|and then|continue|go on|what else|thoughts|your thoughts|what do you think|how do you feel|do you agree|what about it|what about that|what about this)$/i
      .test(text);

  const elaborationFollowUp =
    /\b(?:elaborate|expand)(?:\s+more)?(?:\s+on)?\s+(?:that|this|it)(?:\s+more|\s+further)?\b/i
      .test(text) ||
    /\b(?:tell me more|say more|go deeper|go into more detail)(?:\s+about|\s+on)?\s*(?:that|this|it)?\b/i
      .test(text) ||
    /\bexplain\s+(?:that|this|it)(?:\s+more|\s+further)?\b/i
      .test(text);

  const shortInterrogative =
    currentTurn.wordCount > 0 &&
    currentTurn.wordCount <= 8 &&
    /^(?:why|how|what|who|where|when|which)\b/i
      .test(text);

  const upstreamContinuity =
    summary.shouldUseContinuity === true ||
    summary.isFollowUp === true ||
    summary.conversationMode
      ?.isFollowUp === true ||
    summary.semanticFrame
      ?.continuity
      ?.requiresPriorContext === true ||
    summary.semanticSummary
      ?.continuity
      ?.requiresPriorContext === true ||
    summary.laneSplit
      ?.routing
      ?.useThread === true;

  const detected =
    priorContextAvailable &&
    (
      explicitReference ||
      elaborationFollowUp ||
      bareFollowUp ||
      upstreamContinuity ||
      (
        shortInterrogative &&
        currentTurn.wordCount <= 3
      )
    );

  const signals = [];

  if (explicitReference) {
    signals.push(
      "explicit_discourse_reference"
    );
  }

  if (elaborationFollowUp) {
    signals.push(
      "elaboration_follow_up"
    );
  }

  if (bareFollowUp) {
    signals.push(
      "bare_follow_up_construction"
    );
  }

  if (shortInterrogative) {
    signals.push(
      "short_interrogative"
    );
  }

  if (upstreamContinuity) {
    signals.push(
      "upstream_continuity_evidence"
    );
  }

  if (priorContextAvailable) {
    signals.push(
      "recent_context_available"
    );
  }

  let confidence = 0;

  if (detected) {
    confidence = 0.55;

    if (explicitReference) {
      confidence += 0.2;
    }

    if (elaborationFollowUp) {
      confidence += 0.15;
    }

    if (bareFollowUp) {
      confidence += 0.15;
    }

    if (upstreamContinuity) {
      confidence += 0.08;
    }
  }

  return {
    detected,

    priorContextAvailable,

    explicitReference,

    elaborationFollowUp,

    bareFollowUp,

    shortInterrogative,

    upstreamContinuity,

    signals,

    confidence:
      this.normalizeConfidence(
        confidence
      ),

    reason:
      detected
        ? "The turn appears to depend on immediately available conversation context."
        : !priorContextAvailable
          ? "No recent conversation context was available."
          : "The turn appears complete enough to continue without elliptical resolution.",

    authority:
      "context_dependency_detection_only"
  };
},

  /* =====================================================
     MODEL PACKET
  ===================================================== */

  buildResolutionPacket({
    currentTurn = {},
    recentTurns = [],
    detection = {},
    summary = {}
  } = {}) {
    const boundedTurns =
      this.boundContextTurns(
        recentTurns
      );

    return {
      schema:
        "ari_elliptical_follow_up_model_request",

      schemaVersion:
        this.schemaVersion,

      task:
        "Resolve the current follow-up turn into a complete standalone user request using only the supplied recent conversation.",

      currentTurn: {
        turnId:
          currentTurn.turnId,

        originalText:
          currentTurn.originalText
      },

      recentConversation:
        boundedTurns.map(
          turn => ({
            id:
              turn.id ||
              null,

            role:
              turn.role ||
              "unknown",

            text:
              turn.text
          })
        ),

      detectionSignals:
        detection.signals,

      upstreamHints: {
        requestedOperation:
          summary.canonicalMeaning
            ?.requestedOperation ||
          summary.semanticSummary
            ?.operation ||
          null,

        requestedOutput:
          summary.canonicalMeaning
            ?.requestedOutput ||
          summary.semanticSummary
            ?.requestedOutput ||
          null
      },

      rules: [
        "Do not answer the user.",
        "Do not add facts that are not present in the supplied conversation.",
        "Preserve the user's intended operation.",
        "Resolve only omitted or deictic meaning required for a standalone request.",
        "Prefer the closest compatible prior turn.",
        "If more than one materially different interpretation is plausible, mark the result ambiguous.",
        "If the turn is already complete, mark resolved false.",
        "Return JSON only."
      ],

      expectedOutput: {
        resolved:
          "boolean",

        ambiguous:
          "boolean",

        resolvedText:
          "string or null",

        referent:
          "string or null",

        sourceTurnIds:
          "array of supplied turn ids",

        followUpFamily:
          "short snake_case label or null",

        confidence:
          "number from 0 to 1",

        reason:
          "short explanation"
      },

      authority:
        "model_resolution_request_only"
    };
  },

  boundContextTurns(
    turns = []
  ) {
    const selected = [];
    let characters = 0;

    const reversed =
      [...this.asArray(
        turns
      )].reverse();

    for (
      const turn
      of reversed
    ) {
      const size =
        String(
          turn.text ||
          ""
        ).length;

      if (
        selected.length >
          0 &&
        characters +
          size >
          this.config
            .maxContextCharacters
      ) {
        break;
      }

      selected.push(
        turn
      );

      characters +=
        size;
    }

    return selected.reverse();
  },

  /* =====================================================
     MODEL INVOCATION
  ===================================================== */

  async invokeModelResolver({
    packet = {},
    runtime = {},
    summary = {}
  } = {}) {
    
    console.log(
  "ARI ELLIPSIS MODEL ADAPTER CHECK:",
  {
    directResolver:
      typeof runtime
        .resolveEllipticalFollowUp,

    runtimeOrchestrator:
      Boolean(
        runtime.modelOrchestrator
      ),

    summaryOrchestrator:
      Boolean(
        summary.modelOrchestrator
      ),

    globalOrchestrator:
      Boolean(
        window.Ari
          ?.modelOrchestrator ||
        window.AriModelOrchestrator
      ),

    runtimeOpenAIClient:
      Boolean(
        runtime.openAIClient
      ),

    globalOpenAIClient:
      Boolean(
        window.Ari
          ?.openAIClient ||
        window.AriOpenAIClient
      )
  }
);
    
    const directResolver =
      runtime
        .resolveEllipticalFollowUp ||
      summary
        .resolveEllipticalFollowUp;

    if (
      typeof directResolver ===
      "function"
    ) {
      return await directResolver(
        packet
      );
    }

    const orchestrators = [
      runtime
        .modelOrchestrator,
      summary
        .modelOrchestrator,
      window.Ari
        ?.modelOrchestrator,
      window
        .AriModelOrchestrator
    ].filter(Boolean);

    for (
      const orchestrator
      of orchestrators
    ) {
      if (
        typeof orchestrator
          .resolveStructured ===
          "function"
      ) {
        return await orchestrator
          .resolveStructured({
            capability:
              "elliptical_follow_up_resolution",

            packet
          });
      }

      if (
        typeof orchestrator
          .run ===
          "function"
      ) {
        return await orchestrator.run({
          capability:
            "elliptical_follow_up_resolution",

          responseFormat:
            "json",

          packet
        });
      }
    }

    const clients = [
      runtime.openAIClient,
      summary.openAIClient,
      window.Ari
        ?.openAIClient,
      window
        .AriOpenAIClient
    ].filter(Boolean);

    for (
      const client
      of clients
    ) {
      if (
        typeof client
          .completeJSON ===
          "function"
      ) {
        return await client
          .completeJSON({
            task:
              packet.task,

            input:
              packet
          });
      }

      if (
        typeof client
          .request ===
          "function"
      ) {
        return await client.request({
          capability:
            "elliptical_follow_up_resolution",

          responseFormat:
            "json",

          input:
            packet
        });
      }
    }

    throw new Error(
      "No AI resolver adapter was available. Provide runtime.resolveEllipticalFollowUp(packet), a modelOrchestrator, or an OpenAI client adapter."
    );
  },

  /* =====================================================
     MODEL RESPONSE PARSING
  ===================================================== */

  parseModelResponse(
    response
  ) {
    if (
      response === null ||
      response === undefined
    ) {
      return null;
    }

    if (
      typeof response ===
      "object"
    ) {
      const candidate =
        response.output ||
        response.result ||
        response.data ||
        response.parsed ||
        response;

      if (
        typeof candidate ===
        "object" &&
        candidate !==
          null
      ) {
        return candidate;
      }

      if (
        typeof candidate ===
        "string"
      ) {
        return this.parseJSONString(
          candidate
        );
      }
    }

    if (
      typeof response ===
      "string"
    ) {
      return this.parseJSONString(
        response
      );
    }

    return null;
  },

  parseJSONString(
    value = ""
  ) {
    const text =
      this.clean(
        value
      )
        .replace(
          /^```(?:json)?\s*/i,
          ""
        )
        .replace(
          /\s*```$/,
          ""
        );

    try {
      return JSON.parse(
        text
      );
    } catch {
      const match =
        text.match(
          /\{[\s\S]*\}/
        );

      if (!match) {
        return null;
      }

      try {
        return JSON.parse(
          match[0]
        );
      } catch {
        return null;
      }
    }
  },

  /* =====================================================
     DETERMINISTIC VALIDATION
  ===================================================== */

  validateModelResolution({
    parsed = null,
    packet = {},
    currentTurn = {},
    recentTurns = []
  } = {}) {
    const warnings = [];

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return {
        accepted:
          false,

        requiresClarification:
          true,

        confidence:
          0,

        warnings: [
          "model_response_missing_or_invalid"
        ],

        reason:
          "The model did not return a usable structured resolution."
      };
    }

    const resolved =
      parsed.resolved ===
      true;

    const ambiguous =
      parsed.ambiguous ===
      true;

    const resolvedText =
      this.clean(
        parsed.resolvedText ||
        parsed.resolvedQuestion ||
        ""
      );

    const referent =
      this.clean(
        parsed.referent ||
        ""
      );

    const sourceTurnIds =
      this.asArray(
        parsed.sourceTurnIds ||
        parsed.source_turn_ids
      ).map(String);

    const confidence =
      this.normalizeConfidence(
        parsed.confidence
      );

    const allowedTurnIds =
      new Set(
        recentTurns
          .map(
            turn =>
              turn.id
          )
          .filter(Boolean)
          .map(String)
      );

    const unsupportedSource =
      sourceTurnIds.some(
        id =>
          !allowedTurnIds.has(
            id
          )
      );

    if (
      unsupportedSource
    ) {
      warnings.push(
        "model_cited_unknown_source_turn"
      );
    }

    if (
      resolved &&
      !resolvedText
    ) {
      warnings.push(
        "resolved_text_missing"
      );
    }

    if (
      resolvedText.length >
      this.config
        .maxResolvedCharacters
    ) {
      warnings.push(
        "resolved_text_too_long"
      );
    }

    if (
      resolvedText &&
      this.normalize(
        resolvedText
      ) ===
        this.normalize(
          currentTurn.originalText
        )
    ) {
      warnings.push(
        "resolved_text_unchanged"
      );
    }

    if (
      confidence <
      this.config
        .minimumAcceptedConfidence
    ) {
      warnings.push(
        "model_confidence_below_threshold"
      );
    }

    if (
      ambiguous
    ) {
      warnings.push(
        "model_marked_resolution_ambiguous"
      );
    }

    const accepted =
      resolved &&
      !ambiguous &&
      Boolean(
        resolvedText
      ) &&
      !unsupportedSource &&
      resolvedText.length <=
        this.config
          .maxResolvedCharacters &&
      confidence >=
        this.config
          .minimumAcceptedConfidence;

    return {
      accepted,

      resolved,

      ambiguous,

      resolvedText:
        accepted
          ? resolvedText
          : currentTurn
              .originalText,

      referent:
        accepted
          ? referent ||
            null
          : null,

      sourceTurnIds:
        accepted
          ? sourceTurnIds
          : [],

      followUpFamily:
        accepted
          ? this.normalizeIdentifier(
              parsed.followUpFamily ||
              parsed.follow_up_family ||
              "context_dependent_follow_up"
            )
          : null,

      confidence,

      requiresClarification:
        !accepted,

      warnings,

      reason:
        accepted
          ? this.clean(
              parsed.reason ||
              "The model resolved the omitted meaning using supplied recent conversation only."
            )
          : ambiguous
            ? "The model found more than one materially plausible interpretation."
            : warnings.length
              ? warnings.join(
                  ", "
                )
              : "The model resolution was not accepted."
    };
  },

  /* =====================================================
     RESULT BUILDERS
  ===================================================== */

  buildCanonicalResult({
    currentTurn = {},
    recentTurns = [],
    detection = {},
    resolutionPacket = {},
    parsed = null,
    validation = {},
    modelError = null
  } = {}) {
    const resolved =
      validation.accepted ===
      true;

    const resolvedText =
      resolved
        ? validation
            .resolvedText
        : currentTurn
            .originalText;

    const selectedSources =
      recentTurns.filter(
        turn =>
          validation
            .sourceTurnIds
            ?.includes(
              String(
                turn.id
              )
            )
      );

    const result = {
      schema:
        "ari_elliptical_follow_up_resolution",

      schemaVersion:
        this.schemaVersion,

      engine:
        "ari-elliptical-follow-up-resolver",

      version:
        this.version,

      source:
        "ari-elliptical-follow-up-resolver",

continuityResolverRan:
  true,

continuityResolverVersion:
  this.version,

continuityResolverSource:
  "ari-elliptical-follow-up-resolver",

status:
  resolved
    ? "resolved"
    : validation
        .requiresClarification === true
      ? "clarification_required"
      : "unresolved",

      ran:
        true,

      detected:
        detection.detected ===
          true,

      isContinuation:
        detection.detected ===
          true,

      requiresPriorContext:
        detection.detected ===
          true,

      referencesPriorContext:
        detection.detected ===
          true,

      originalText:
        currentTurn.originalText,

      resolvedText,

      currentTurnWasResolved:
        resolved,

      followUpFamily:
        validation
          .followUpFamily ||
        null,

      followUpOperation:
        resolved
          ? "resolve_context_dependent_follow_up"
          : null,

      referenceType:
        resolved
          ? "model_resolved_discourse_reference"
          : detection
              .explicitReference
            ? "unresolved_deictic_reference"
            : "unresolved_elliptical_reference",

      referenceSurface:
        this.extractReferenceSurface(
          currentTurn.normalizedText
        ),

      referenceResolved:
        resolved,

      resolvedReferenceValue:
        validation.referent ||
        null,

      resolvedReferenceSourceTurnId:
        validation
          .sourceTurnIds
          ?.[0] ||
        null,

      currentTurn,

      recentTurns,

      detection,

      modelResolution: {
        attempted:
          true,

        adapterAvailable:
          !modelError,

        rawParsed:
          parsed,

        validation,

        error:
          modelError
      },

      anchor: {
        status:
          resolved
            ? "resolved"
            : validation.ambiguous
              ? "ambiguous"
              : "unresolved",

        selectedSources,

        sourceTurnIds:
          validation
            .sourceTurnIds ||
          [],

        confidence:
          validation.confidence ||
          0,

        reason:
          validation.reason
      },

      inheritedContext: {
        inherited:
          resolved,

        target:
          validation.referent ||
          null,

        object:
          validation.referent ||
          null,

        sourceTurnIds:
          validation
            .sourceTurnIds ||
          [],

        minimumNecessaryContextOnly:
          true,

        authority:
          "model_proposed_context_inheritance_validated_deterministically"
      },

      resolvedCurrentTurn: {
        resolved,

        originalText:
          currentTurn.originalText,

        text:
          resolvedText,

        resolvedText,

        currentTurnWasResolved:
          resolved,

        followUpFamily:
          validation
            .followUpFamily ||
          null,

        referenceType:
          resolved
            ? "model_resolved_discourse_reference"
            : null,

        referenceResolved:
          resolved,

        resolvedReferenceValue:
          validation.referent ||
          null,

        resolvedReferenceSourceTurnId:
          validation
            .sourceTurnIds
            ?.[0] ||
          null,

        requiresClarification:
          validation
            .requiresClarification ===
            true,

        resolutionReason:
          validation.reason,

        originalPreserved:
          true,

        authority:
          "resolved_current_turn_only"
      },

      requiresClarification:
        validation
          .requiresClarification ===
          true,

      quality: {
        ready:
          resolved,

        healthy:
          resolved &&
          !validation
            .warnings
            ?.length &&
          !modelError,

        detected:
          true,

        anchorResolved:
          resolved,

        turnResolved:
          resolved,

        requiresClarification:
          validation
            .requiresClarification ===
            true,

        confidence:
          validation.confidence ||
          0,

        warnings: [
          ...this.asArray(
            validation.warnings
          ),
          ...(
            modelError
              ? [
                  "model_resolution_error"
                ]
              : []
          )
        ]
      },

      confidence:
        validation.confidence ||
        0,

      warnings: [
        ...this.asArray(
          validation.warnings
        ),
        ...(
          modelError
            ? [
                "model_resolution_error"
              ]
            : []
        )
      ],

      originalTurnPreserved:
        true,

      resolutionPacketSummary: {
        recentTurnCount:
          resolutionPacket
            .recentConversation
            ?.length ||
          0,

        detectionSignals:
          resolutionPacket
            .detectionSignals ||
          []
      },

      authority: {
        canDetectContextDependency:
          true,

        canPrepareModelResolutionPacket:
          true,

        canRequestModelResolution:
          true,

        canValidateModelResolution:
          true,

        canConstructResolvedCurrentTurn:
          true,

        canPreserveOriginalCurrentTurn:
          true,

        canLeaveAmbiguousFollowUpUnresolved:
          true,

        canChooseConversationFunction:
          false,

        canChooseSemanticFrame:
          false,

        canChooseExecutiveLane:
          false,

        canChangeSafetySeverity:
          false,

        canRetrieveLongTermMemory:
          false,

        canAnswerUser:
          false,

        canPersistState:
          false,

        role:
          "ai_assisted_elliptical_follow_up_resolution_with_deterministic_governance"
      }
    };

    return result;
  },

  buildNotDetectedResult({
    currentTurn = {},
    recentTurns = [],
    detection = {}
  } = {}) {
    return {
      schema:
        "ari_elliptical_follow_up_resolution",

      schemaVersion:
        this.schemaVersion,

      engine:
        "ari-elliptical-follow-up-resolver",

      version:
        this.version,

      source:
        "ari-elliptical-follow-up-resolver",

continuityResolverRan:
  true,

continuityResolverVersion:
  this.version,

continuityResolverSource:
  "ari-elliptical-follow-up-resolver",

status:
  "not_required",

      ran:
        true,

      detected:
        false,

      isContinuation:
        false,

      requiresPriorContext:
        false,

      referencesPriorContext:
        false,

      originalText:
        currentTurn.originalText,

      resolvedText:
        currentTurn.originalText,

      currentTurnWasResolved:
        false,

      followUpFamily:
        null,

      followUpOperation:
        null,

      referenceType:
        null,

      referenceSurface:
        null,

      referenceResolved:
        false,

      resolvedReferenceValue:
        null,

      resolvedReferenceSourceTurnId:
        null,

      currentTurn,

      recentTurns,

      detection,

      modelResolution: {
        attempted:
          false,

        adapterAvailable:
          null,

        rawParsed:
          null,

        validation:
          null,

        error:
          null
      },

      anchor: {
        status:
          "not_required",

        selectedSources:
          [],

        sourceTurnIds:
          [],

        confidence:
          1,

        reason:
          "Elliptical follow-up resolution was not required."
      },

      inheritedContext: {
        inherited:
          false,

        target:
          null,

        object:
          null,

        sourceTurnIds:
          [],

        minimumNecessaryContextOnly:
          true
      },

      resolvedCurrentTurn: {
        resolved:
          false,

        originalText:
          currentTurn.originalText,

        text:
          currentTurn.originalText,

        resolvedText:
          currentTurn.originalText,

        currentTurnWasResolved:
          false,

        requiresClarification:
          false,

        resolutionReason:
          detection.reason,

        originalPreserved:
          true,

        authority:
          "resolved_current_turn_only"
      },

      requiresClarification:
        false,

      quality: {
        ready:
          true,

        healthy:
          true,

        detected:
          false,

        anchorResolved:
          false,

        turnResolved:
          false,

        requiresClarification:
          false,

        confidence:
          detection.confidence,

        warnings:
          []
      },

      confidence:
        detection.confidence,

      warnings:
        [],

      originalTurnPreserved:
        true,

      authority: {
        canDetectContextDependency:
          true,

        canPrepareModelResolutionPacket:
          true,

        canRequestModelResolution:
          true,

        canValidateModelResolution:
          true,

        canConstructResolvedCurrentTurn:
          true,

        canPreserveOriginalCurrentTurn:
          true,

        canLeaveAmbiguousFollowUpUnresolved:
          true,

        canChooseConversationFunction:
          false,

        canChooseSemanticFrame:
          false,

        canChooseExecutiveLane:
          false,

        canChangeSafetySeverity:
          false,

        canRetrieveLongTermMemory:
          false,

        canAnswerUser:
          false,

        canPersistState:
          false,

        role:
          "ai_assisted_elliptical_follow_up_resolution_with_deterministic_governance"
      }
    };
  },

  /* =====================================================
     RETURN AND PUBLICATION
  ===================================================== */

  buildReturnPayload(
  resolution = {}
) {
  const resolved =
    resolution.currentTurnWasResolved === true;

  const detected =
    resolution.detected === true;

  const status =
    resolved
      ? "resolved"
      : detected
        ? resolution.requiresClarification === true
          ? "clarification_required"
          : "unresolved"
        : "not_required";

  return {
    continuityResolverRan:
      true,

    continuityResolverVersion:
      this.version,

    continuityResolverSource:
      "ari-elliptical-follow-up-resolver",

    status,

    ellipticalFollowUpResolverRan:
      true,

    ellipticalFollowUpResolverVersion:
      this.version,

    ellipticalFollowUpResolverSource:
      "ari-elliptical-follow-up-resolver",

      ellipticalFollowUpDetected:
        resolution.detected ===
          true,

      ellipticalFollowUpResolution:
        resolution,

      resolvedCurrentTurn:
        resolution
          .resolvedCurrentTurn ||
        null,

      originalCurrentTurn: {
        text:
          resolution.originalText ||
          null,

        preserved:
          true
      },

      originalUserMessage:
        resolution.originalText ||
        null,

      resolvedUserQuestion:
        resolution.resolvedText ||
        resolution.originalText ||
        null,

      resolvedCurrentTurnText:
        resolution.resolvedText ||
        resolution.originalText ||
        null,

      currentTurnWasResolved:
        resolution
          .currentTurnWasResolved ===
          true,

      isContinuation:
        resolution.isContinuation ===
          true,

      requiresPriorContext:
        resolution
          .requiresPriorContext ===
          true,

      referencesPriorContext:
        resolution
          .referencesPriorContext ===
          true,

      referenceType:
        resolution.referenceType ||
        null,

      referenceSurface:
        resolution.referenceSurface ||
        null,

      referenceResolved:
        resolution
          .referenceResolved ===
          true,

      resolvedReferenceValue:
        resolution
          .resolvedReferenceValue ||
        null,

      resolvedReferenceSourceTurnId:
        resolution
          .resolvedReferenceSourceTurnId ||
        null,

      followUpFamily:
        resolution.followUpFamily ||
        null,

      followUpOperation:
        resolution.followUpOperation ||
        null,

      inheritedTarget:
        resolution
          .inheritedContext
          ?.target ||
        null,

      inheritedObject:
        resolution
          .inheritedContext
          ?.object ||
        null,

      ellipticalFollowUpAnchor:
        resolution.anchor ||
        null,

      ellipticalFollowUpQuality:
        resolution.quality ||
        null,

      requiresClarification:
        resolution
          .requiresClarification ===
          true,

      confidence:
        resolution.confidence ||
        0,

      warnings:
        resolution.warnings ||
        [],

      authority:
        "canonical_elliptical_follow_up_resolution_only"
    };
  },

  publishResult(
    result = {}
  ) {
    window.Ari
      .ellipticalFollowUpResolution =
      result;

    window.Ari
      .resolvedCurrentTurn =
      result.resolvedCurrentTurn ||
      null;

    window.Ari
      .ellipticalFollowUpResolverResult =
      result;
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  extractReferenceSurface(
    normalizedText = ""
  ) {
    const match =
      this.normalize(
        normalizedText
      ).match(
        /\b(?:that one|this one|the other one|what you said|your answer|your response|the previous answer|that|this|it|those|these|them)\b/
      );

    return match?.[0] ||
      null;
  },

  normalizeRole(
    value = ""
  ) {
    const role =
      this.normalize(
        value
      );

    if (
      [
        "assistant",
        "ari",
        "bot",
        "ai"
      ].includes(
        role
      )
    ) {
      return "assistant";
    }

    if (
      [
        "user",
        "human",
        "person"
      ].includes(
        role
      )
    ) {
      return "user";
    }

    return role ||
      null;
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
  },

  normalizeConfidence(
    value = 0
  ) {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    if (
      number >
      1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number /
            100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

  serializeError(
    error
  ) {
    return {
      name:
        error?.name ||
        "Error",

      message:
        error?.message ||
        String(
          error ||
          "Unknown model resolution error."
        )
    };
  },

  createStableId(
    prefix = "id",
    value = ""
  ) {
    return `${prefix}_${this.hashString(
      String(
        value ||
        ""
      )
    )}`;
  },

  hashString(
    value = ""
  ) {
    let hash =
      2166136261;

    const text =
      String(
        value ||
        ""
      );

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );

      hash +=
        (
          hash << 1
        ) +
        (
          hash << 4
        ) +
        (
          hash << 7
        ) +
        (
          hash << 8
        ) +
        (
          hash << 24
        );
    }

    return (
      hash >>>
      0
    ).toString(
      36
    );
  },

  asArray(
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
            null &&
          item !==
            undefined &&
          item !==
            ""
      );
    }

    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  clean(
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
        /\s+/g,
        " "
      )
      .trim();
  },

  normalize(
    value = ""
  ) {
    return this
      .clean(
        value
      )
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s'$%]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

window.Ari.ellipticalFollowUpResolver =
  window.AriEllipticalFollowUpResolver;

console.log(
  "ARI ELLIPTICAL FOLLOW-UP RESOLVER LOADED:",
  window.AriEllipticalFollowUpResolver
    ?.version
);
