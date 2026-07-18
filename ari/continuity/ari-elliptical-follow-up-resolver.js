// ari/continuity/ari-elliptical-follow-up-resolver.js
// Ari Elliptical Follow-Up Resolver
//
// Purpose:
// Detect context-dependent follow-up turns, prepare a bounded continuity
// packet, ask the configured model layer to resolve the omitted meaning,
// validate the model result, and publish a canonical continuity result.
//
// V3.2.0 — Structural Context Dependency / Deterministic Governance
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
  version: "3.2.0",
  schemaVersion: "3.2.0",

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
  const priorContextAvailable =
    recentTurns.length > 0;

  const features =
    this.extractContextDependencyFeatures({
      currentTurn,
      summary
    });

  if (!priorContextAvailable) {
    return {
      detected: false,
      priorContextAvailable: false,
      ...features,
      score: 0,
      signals: [],
      confidence: 0,
      reason:
        "No recent conversation context was available.",
      authority:
        "context_dependency_detection_only"
    };
  }

  let score = 0;

  const weightedFeatures = [
    [
      "explicitDiscourseReference",
      4
    ],
    [
      "pronominalReference",
      2
    ],
    [
      "temporalSequenceReference",
      3
    ],
    [
      "leadingConnector",
      1
    ],
    [
      "elaborationRequest",
      4
    ],
    [
      "continuationCommand",
      4
    ],
    [
      "shortInterrogative",
      1
    ],
    [
      "structurallyIncompleteQuestion",
      3
    ],
    [
      "bareReactionFollowUp",
      3
    ],
    [
      "bareSequenceFollowUp",
      4
    ],
    [
      "clarificationFollowUp",
      4
    ],
    [
      "causalChallengeFollowUp",
      4
    ],
    [
      "upstreamContinuity",
      5
    ]
  ];

  weightedFeatures.forEach(
    ([
      feature,
      weight
    ]) => {
      if (
        features[feature] ===
        true
      ) {
        score += weight;
      }
    }
  );

  if (
    features.appearsStandalone
  ) {
    score -= 4;
  }

  const detected =
    score >= 3;

  const signalMap = {
    explicitDiscourseReference:
      "explicit_discourse_reference",

    pronominalReference:
      "pronominal_reference",

    temporalSequenceReference:
      "temporal_sequence_reference",

    leadingConnector:
      "leading_discourse_connector",

    elaborationRequest:
      "elaboration_request",

    continuationCommand:
      "continuation_command",

    shortInterrogative:
      "short_interrogative",

    structurallyIncompleteQuestion:
      "structurally_incomplete_question",

    bareInterrogativeFollowUp:
      "bare_interrogative_follow_up",

    bareReactionFollowUp:
      "bare_reaction_follow_up",

    bareSequenceFollowUp:
      "bare_sequence_follow_up",

    clarificationFollowUp:
      "clarification_follow_up",

    causalChallengeFollowUp:
      "causal_challenge_follow_up",

    likelyConnectorTypoFollowUp:
      "likely_connector_typo_follow_up",

    upstreamContinuity:
      "upstream_continuity_evidence"
  };

  const signals =
    Object.entries(
      signalMap
    )
      .filter(
        ([
          feature
        ]) =>
          features[feature] ===
          true
      )
      .map(
        ([
          ,
          signal
        ]) =>
          signal
      );

  signals.push(
    "recent_context_available"
  );

  return {
    detected,
    priorContextAvailable,
    ...features,
    score,
    signals,

    confidence:
      detected
        ? this.normalizeConfidence(
            Math.min(
              0.98,
              0.5 +
              Math.max(
                0,
                score
              ) *
              0.07
            )
          )
        : this.normalizeConfidence(
            Math.max(
              0,
              0.45 +
              score *
              0.05
            )
          ),

    reason:
      detected
        ? "The turn contains structural evidence that omitted meaning must be recovered from recent conversation."
        : "The turn appears sufficiently self-contained for downstream semantic analysis.",

    authority:
      "context_dependency_detection_only"
  };
},

extractContextDependencyFeatures({
  currentTurn = {},
  summary = {}
} = {}) {
  const text =
    currentTurn.normalizedText ||
    "";

  const wordCount =
    Number(
      currentTurn.wordCount ||
      0
    );

  const explicitDiscourseReference =
    /\b(?:that one|this one|the other one|what you said|your answer|your response|the previous answer|the earlier answer|that|this|those|these|there)\b/i
      .test(text);

  const pronominalReference =
    /\b(?:it|they|them|he|him|she|her|one|ones)\b/i
      .test(text);

  const temporalSequenceReference =
    /\b(?:then|next|after that|before that|afterward|afterwards|subsequently|earlier|later)\b/i
      .test(text);

  const leadingConnector =
    /^(?:so|and|but|then|well|okay|ok|also|anyway|still|instead|otherwise)\b/i
      .test(text);

  const elaborationRequest =
    (
      /\b(?:elaborate|expand|explain)\b/i
        .test(text) &&
      (
        explicitDiscourseReference ||
        wordCount <= 8
      )
    ) ||
    /\b(?:tell me more|say more|go deeper|go into more detail)\b/i
      .test(text);

  const continuationCommand =
    /^(?:(?:so|and|okay|ok|well)\s+)?(?:continue|go on|keep going|and then|then what|what next|now what|what else)$/i
      .test(text);

  const interrogative =
    /\b(?:why|how|what|who|where|when|which)\b/i
      .test(text);

  const shortInterrogative =
    interrogative &&
    wordCount > 0 &&
    wordCount <= 8;

  const connectorLedInterrogative =
    /^(?:so|and|but|then|well)\s+(?:why|how|what|who|where|when|which)\b/i
      .test(text);

  /*
   * A very short interrogative generally supplies an operation but
   * omits its proposition, event, entity, place, time, or explanation.
   */
  const bareInterrogativeFollowUp =
    shortInterrogative &&
    wordCount <= 3;

  /*
   * Conversational reactions whose interpretation depends on the
   * immediately preceding assertion or event.
   */
  const bareReactionFollowUp =
    /^(?:huh|really|seriously|seriously though|for real|for reals|is that so|no way)$/i
      .test(text);

  /*
   * Sequence expressions whose event argument is omitted.
   */
  const bareSequenceFollowUp =
    /^(?:then|and then|so then|next|after that|what next|then what|now what|what happened next)$/i
      .test(text);

  /*
   * Requests for clarification of the preceding wording, assertion,
   * explanation, or intended meaning.
   */
  const clarificationFollowUp =
    /^(?:what do you mean|what does that mean|what did you mean|meaning|meaning what|how so|in what way|can you clarify|clarify what|explain that)$/i
      .test(text);

  /*
   * Challenges asking for the reason behind the immediately preceding
   * proposition.
   */
  const causalChallengeFollowUp =
    /^(?:because|because why|why is that|but why|so why|and why|why though|but how|how come)$/i
      .test(text);

  /*
   * Narrow typo handling. This does not globally redefine "buy" as
   * "but"; it only recognizes a tiny context-dependent challenge form.
   */
  const likelyConnectorTypoFollowUp =
    /^(?:buy why|buy how)$/i
      .test(text);

  const structurallyIncompleteQuestion =
    (
      shortInterrogative &&
      (
        explicitDiscourseReference ||
        pronominalReference ||
        temporalSequenceReference ||
        connectorLedInterrogative ||
        bareInterrogativeFollowUp
      )
    ) ||
    bareReactionFollowUp ||
    bareSequenceFollowUp ||
    clarificationFollowUp ||
    causalChallengeFollowUp ||
    likelyConnectorTypoFollowUp;

  const upstreamContinuity =
    summary.shouldUseContinuity ===
      true ||
    summary.isFollowUp ===
      true ||
    summary.conversationMode
      ?.isFollowUp ===
      true ||
    summary.semanticFrame
      ?.continuity
      ?.requiresPriorContext ===
      true ||
    summary.semanticSummary
      ?.continuity
      ?.requiresPriorContext ===
      true ||
    summary.laneSplit
      ?.routing
      ?.useThread ===
      true;

  const appearsStandalone =
    wordCount >= 9 &&
    !explicitDiscourseReference &&
    !pronominalReference &&
    !temporalSequenceReference &&
    !leadingConnector &&
    !elaborationRequest &&
    !continuationCommand &&
    !bareReactionFollowUp &&
    !bareSequenceFollowUp &&
    !clarificationFollowUp &&
    !causalChallengeFollowUp &&
    !likelyConnectorTypoFollowUp;

  return {
    explicitDiscourseReference,

    explicitReference:
      explicitDiscourseReference,

    pronominalReference,
    temporalSequenceReference,
    leadingConnector,
    elaborationRequest,

    elaborationFollowUp:
      elaborationRequest,

    continuationCommand,
    interrogative,
    shortInterrogative,
    connectorLedInterrogative,
    bareInterrogativeFollowUp,
    bareReactionFollowUp,
    bareSequenceFollowUp,
    clarificationFollowUp,
    causalChallengeFollowUp,
    likelyConnectorTypoFollowUp,
    structurallyIncompleteQuestion,
    upstreamContinuity,
    appearsStandalone,

    bareFollowUp:
      continuationCommand ||
      bareInterrogativeFollowUp ||
      bareReactionFollowUp ||
      bareSequenceFollowUp ||
      clarificationFollowUp ||
      causalChallengeFollowUp ||
      likelyConnectorTypoFollowUp
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

      resolved:
        false,

      ambiguous:
        false,

      disposition:
        "resolution_failed",

      resolvedText:
        currentTurn.originalText,

      referent:
        null,

      sourceTurnIds:
        [],

      followUpFamily:
        null,

      confidence:
        0,

      requiresClarification:
        false,

      warnings: [
        "model_response_missing_or_invalid"
      ],

      reason:
        "The model did not return a usable structured resolution."
    };
  }

  const resolvedFieldValid =
    typeof parsed.resolved ===
    "boolean";

  const ambiguousFieldValid =
    typeof parsed.ambiguous ===
    "boolean";

  const resolved =
    resolvedFieldValid &&
    parsed.resolved === true;

  const ambiguous =
    ambiguousFieldValid &&
    parsed.ambiguous === true;

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

  const textChanged =
    Boolean(
      resolvedText
    ) &&
    this.normalize(
      resolvedText
    ) !==
      this.normalize(
        currentTurn.originalText
      );

  if (
    !resolvedFieldValid
  ) {
    warnings.push(
      "resolved_field_missing_or_invalid"
    );
  }

  if (
    !ambiguousFieldValid
  ) {
    warnings.push(
      "ambiguous_field_missing_or_invalid"
    );
  }

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
    resolved &&
    resolvedText &&
    !textChanged
  ) {
    warnings.push(
      "resolved_text_unchanged"
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
    resolvedFieldValid &&
    ambiguousFieldValid &&
    resolved &&
    !ambiguous &&
    Boolean(
      resolvedText
    ) &&
    textChanged &&
    !unsupportedSource &&
    resolvedText.length <=
      this.config
        .maxResolvedCharacters &&
    confidence >=
      this.config
        .minimumAcceptedConfidence;

  let disposition =
    "resolution_failed";

  if (
    accepted
  ) {
    disposition =
      "resolved";
  } else if (
    resolvedFieldValid &&
    ambiguousFieldValid &&
    ambiguous
  ) {
    disposition =
      "clarification_required";
  } else if (
    resolvedFieldValid &&
    ambiguousFieldValid &&
    resolved === false &&
    ambiguous === false
  ) {
    disposition =
      "not_resolved";
  }

  const requiresClarification =
    disposition ===
    "clarification_required";

  return {
    accepted,

    resolved,

    ambiguous,

    disposition,

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

    requiresClarification,

    warnings,

    reason:
      accepted
        ? this.clean(
            parsed.reason ||
            "The omitted meaning was resolved using supplied recent conversation."
          )
        : disposition ===
            "clarification_required"
          ? "More than one materially plausible interpretation remained."
          : disposition ===
              "not_resolved"
            ? this.clean(
                parsed.reason ||
                "The model did not identify a supported elliptical resolution."
              )
            : warnings.length
              ? warnings.join(
                  ", "
                )
              : "The proposed resolution was not accepted."
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
  validation.disposition ||
  (
    resolved
      ? "resolved"
      : validation
          .requiresClarification === true
        ? "clarification_required"
        : "unresolved"
  ),
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

disposition:

    validation.disposition ||

    "resolution_failed",

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
    : validation.disposition ===
        "clarification_required"
      ? "ambiguous"
      : validation.disposition ||
        "unresolved",
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
  resolution.status ||
  (
    resolved
      ? "resolved"
      : detected
        ? resolution.requiresClarification === true
          ? "clarification_required"
          : "unresolved"
        : "not_required"
  );
  return {
    continuityResolverRan:
      true,

    continuityResolverVersion:
      this.version,

disposition:
  resolution.status ||
  null,

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
