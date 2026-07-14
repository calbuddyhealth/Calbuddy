// ari/continuity/ari-elliptical-follow-up-resolver.js
// Ari Elliptical Follow-Up Resolver
//
// Purpose:
// Resolve short, context-dependent follow-up turns whose semantic meaning
// omits a subject, object, proposition, event, option, quantity, reason,
// method, source, consequence, or other anchor supplied by the recent thread.
//
// V1.0.0 — Canonical Elliptical Follow-Up Resolution
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
// - Detect context-dependent elliptical follow-ups.
// - Preserve the user's original current-turn text exactly.
// - Read recent thread context without changing upstream routing authority.
// - Identify the semantic family of the follow-up.
// - Identify the most appropriate prior conversational anchor.
// - Inherit only the minimum context needed to complete the current turn.
// - Produce a resolved current-turn question for downstream reasoning.
// - Report ambiguity when more than one anchor remains plausible.
// - Avoid forcing a resolution when evidence is insufficient.
// - Return structured diagnostics and compatibility aliases.
//
// Examples:
// - "Why?" → resolve against the previous answer or proposition.
// - "How?" → request method, mechanism, or explanation.
// - "Really?" → request confirmation of the prior claim.
// - "What about the other one?" → resolve the comparison alternative.
// - "Then what?" → request the next event, consequence, or step.
// - "Based on what?" → request evidence or source.
// - "Who?" → request the missing person or actor.
// - "Where?" → request the missing location.
// - "When?" → request the missing time.
// - "How much?" → request quantity, degree, price, or magnitude.
//
// Non-responsibilities:
// - Does not choose whether continuity should run.
// - Does not reinterpret fully specified standalone questions.
// - Does not choose the canonical semantic frame.
// - Does not choose the conversation function.
// - Does not choose the executive lane.
// - Does not answer the user.
// - Does not modify safety severity.
// - Does not retrieve long-term memory.
// - Does not persist state.
// - Does not replace entity-reference resolution.
// - Does not overwrite the original user message.

window.Ari = window.Ari || {};

window.AriEllipticalFollowUpResolver = {
  version:
    "1.0.0",

  schemaVersion:
    "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  resolve(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const threadContext =
      this.readThreadContext(
        summary
      );

    const continuityContext =
      this.readContinuityContext(
        summary
      );

    const semanticContext =
      this.readSemanticContext(
        summary
      );

    const currentTurn =
      this.readCurrentTurn({
        summary,
        threadContext,
        semanticContext
      });

    const recentExchange =
      this.readRecentExchange({
        summary,
        threadContext,
        continuityContext
      });

    const detection =
      this.detectEllipticalFollowUp({
        currentTurn,
        recentExchange,
        continuityContext,
        semanticContext,
        summary
      });

    if (
      detection.detected !==
      true
    ) {
      const unresolvedResult =
        this.buildNotDetectedResult({
          currentTurn,
          recentExchange,
          detection,
          semanticContext,
          continuityContext
        });

      this.publishResult(
        unresolvedResult
      );

      return this.buildReturnPayload(
        unresolvedResult
      );
    }

    const familyResolution =
      this.resolveFollowUpFamily({
        currentTurn,
        detection,
        semanticContext,
        recentExchange
      });

    const anchorCandidates =
      this.buildAnchorCandidates({
        currentTurn,
        familyResolution,
        recentExchange,
        semanticContext,
        continuityContext,
        summary
      });

    const rankedAnchors =
      this.rankAnchorCandidates({
        candidates:
          anchorCandidates,

        currentTurn,
        familyResolution,
        semanticContext,
        recentExchange
      });

    const anchorDecision =
      this.selectAnchor({
        rankedAnchors,
        currentTurn,
        familyResolution,
        semanticContext,
        recentExchange
      });

    const inheritedContext =
      this.buildInheritedContext({
        anchorDecision,
        familyResolution,
        currentTurn,
        semanticContext,
        recentExchange
      });

    const resolvedTurn =
      this.buildResolvedTurn({
        currentTurn,
        familyResolution,
        anchorDecision,
        inheritedContext,
        recentExchange,
        semanticContext
      });

    const quality =
      this.buildQuality({
        currentTurn,
        detection,
        familyResolution,
        anchorDecision,
        inheritedContext,
        resolvedTurn,
        recentExchange
      });

    const result =
      this.buildCanonicalResult({
        currentTurn,
        recentExchange,
        detection,
        familyResolution,
        anchorCandidates,
        rankedAnchors,
        anchorDecision,
        inheritedContext,
        resolvedTurn,
        semanticContext,
        continuityContext,
        quality
      });

    this.publishResult(
      result
    );

    return this.buildReturnPayload(
      result
    );
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readCurrentTurn({
    summary = {},
    threadContext = {},
    semanticContext = {}
  } = {}) {
    const originalText =
      this.clean(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        threadContext.currentTurn
          ?.originalText ||
        threadContext.currentTurn
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
        semanticContext.turnId ||
        threadContext.currentTurn
          ?.turnId ||
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

      punctuationOnly:
        Boolean(originalText) &&
        !/[a-z0-9]/i.test(
          originalText
        ),

      endsWithQuestionMark:
        /\?$/.test(
          originalText
        ),

      beginsWithQuestionWord:
        /^(?:why|how|what|who|where|when|which)\b/i
          .test(
            normalizedText
          ),

      authority:
        "current_turn_record_only"
    };
  },

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
        ?.thread,

      summary
        .continuityResults
        ?.outputs
        ?.thread
        ?.threadContext,

      summary
        .continuityPacket
        ?.threadContext,

      summary
        .contextAssembler
        ?.threadContext,

      window.Ari.threadContext,

      window.Ari
        .threadUnderstanding
        ?.threadContext
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object"
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
          found.recentTurns
        ),

      referenceCandidates:
        this.asArray(
          found.referenceCandidates
        ),

      continuitySignals:
        found.continuitySignals ||
        {},

      workingContext:
        found.workingContext ||
        null,

      source:
        found.source ||
        "thread_context_fallback"
    };
  },

  readContinuityContext(
    summary = {}
  ) {
    const semanticContinuity =
      summary.semanticFrame
        ?.continuity ||
      summary.semanticSummary
        ?.continuity ||
      summary
        .perceptionReconciliation
        ?.semanticSummary
        ?.continuity ||
      summary
        .canonicalMeaning
        ?.continuity ||
      summary
        .semanticFrameBuilder
        ?.canonicalMeaning
        ?.continuity ||
      {};

    const laneRouting =
      summary.laneSplit
        ?.routing ||
      summary.routingDecision ||
      summary.routingContract ||
      {};

    return {
      requiresPriorContext:
        semanticContinuity
          .requiresPriorContext ===
          true ||
        summary
          .shouldUseContinuity ===
          true ||
        laneRouting.useThread ===
          true,

      isContinuation:
        semanticContinuity
          .isContinuation ===
          true ||
        summary.isFollowUp ===
          true ||
        summary.conversationMode
          ?.isFollowUp ===
          true,

      referencesPriorContext:
        semanticContinuity
          .referencesPriorContext ===
          true,

      priorContextAvailable:
        semanticContinuity
          .priorContextAvailable !==
          false,

      previousAnswerSummary:
        semanticContinuity
          .previousAnswerSummary ||
        summary.previousAnswerSummary ||
        null,

      anchor:
        semanticContinuity.anchor ||
        null,

      anchorResolved:
        semanticContinuity
          .anchorResolved ===
          true,

      missingAnchor:
        semanticContinuity
          .missingAnchor ===
          true,

      contextDependency:
        this.normalizeConfidence(
          semanticContinuity
            .contextDependency ??
          summary.contextDependency ??
          0
        ),

      followUpPressure:
        this.normalizeConfidence(
          semanticContinuity
            .followUpPressure ??
          summary.followUpPressure ??
          0
        ),

      routeUsesThread:
        laneRouting.useThread ===
          true,

      routeUsesReferenceResolution:
        laneRouting
          .useReferenceResolution ===
          true,

      source:
        "preserved_continuity_context",

      authority:
        "continuity_evidence_only"
    };
  },

  readSemanticContext(
    summary = {}
  ) {
    const canonicalMeaning =
      summary.canonicalMeaning ||
      summary.semanticSummary
        ?.canonicalMeaning ||
      summary.semanticFrame
        ?.canonicalMeaning ||
      summary
        .semanticFrameBuilder
        ?.canonicalMeaning ||
      summary
        .perceptionReconciliation
        ?.semanticSummary
        ?.canonicalMeaning ||
      {};

    const semanticSummary =
      summary.semanticSummary ||
      summary.semanticFrame ||
      summary
        .perceptionReconciliation
        ?.semanticSummary ||
      {};

    const semanticStructure =
      summary.semanticStructure ||
      summary.currentSemanticStructure ||
      summary
        .threadUnderstanding
        ?.semanticStructure ||
      window.Ari.semanticStructure ||
      {};

    const ambiguity =
      canonicalMeaning.ambiguity ||
      semanticSummary.ambiguity ||
      {};

    const slotCompleteness =
      canonicalMeaning
        .slotCompleteness ||
      semanticSummary
        .framePriority
        ?.slotCompleteness ||
      {};

    const target =
      canonicalMeaning.target ||
      semanticSummary.target ||
      null;

    const targetObject =
      canonicalMeaning
        .targetObject ||
      canonicalMeaning.object ||
      semanticSummary
        .targetObject ||
      null;

    return {
      turnId:
        canonicalMeaning.turnId ||
        semanticStructure.turnId ||
        summary.turnId ||
        null,

      speechAct:
        canonicalMeaning.speechAct ||
        semanticSummary.speechAct ||
        null,

      interactionFamily:
        canonicalMeaning
          .interactionFamily ||
        semanticSummary
          .interactionFamily ||
        null,

      intentFamily:
        canonicalMeaning.intentFamily ||
        semanticSummary.intentFamily ||
        null,

      requestedOperation:
        canonicalMeaning
          .requestedOperation ||
        semanticSummary.operation ||
        semanticSummary.intent ||
        null,

      requestedOutput:
        canonicalMeaning
          .requestedOutput ||
        semanticSummary
          .requestedOutput ||
        null,

      subject:
        canonicalMeaning.subject ||
        semanticSummary.subject ||
        null,

      target,

      targetObject,

      object:
        targetObject,

      referent:
        canonicalMeaning.referent ||
        semanticSummary.referent ||
        null,

      options:
        this.asArray(
          canonicalMeaning.options ||
          semanticSummary.options
        ),

      criteria:
        this.asArray(
          canonicalMeaning.criteria ||
          semanticSummary.criteria
        ),

      unresolvedSlots:
        this.asArray(
          ambiguity.unresolvedSlots ||
          slotCompleteness.missing
        ),

      ambiguityPresent:
        ambiguity.present ===
          true ||
        ambiguity.ambiguous ===
          true,

      requiresClarification:
        ambiguity
          .requiresClarification ===
          true,

      slotCompletenessScore:
        this.normalizeConfidence(
          slotCompleteness.score ??
          1
        ),

      references:
        this.asArray(
          semanticStructure.references
        ),

      entities:
        this.asArray(
          semanticStructure.entities
        ),

      events:
        this.asArray(
          semanticStructure.events
        ),

      claims:
        this.asArray(
          semanticStructure.claims
        ),

      quantities:
        this.asArray(
          semanticStructure.quantities
        ),

      optionsFromStructure:
        this.asArray(
          semanticStructure.options
        ),

      source:
        "preserved_semantic_context",

      authority:
        "semantic_context_read_only"
    };
  },

  /* =====================================================
     RECENT EXCHANGE
  ===================================================== */

  readRecentExchange({
    summary = {},
    threadContext = {},
    continuityContext = {}
  } = {}) {
    const recentTurns =
      this.collectRecentTurns({
        summary,
        threadContext
      });

    const priorTurns =
      recentTurns.filter(
        turn =>
          !this.isCurrentTurn({
            turn,
            summary,
            threadContext
          })
      );

    const previousAssistantTurn =
      this.findLastTurnByRole(
        priorTurns,
        "assistant"
      ) ||
      this.normalizeTurn(
        threadContext
          .immediatePreviousAssistantTurn
      );

    const previousUserTurn =
      this.findPreviousUserTurnBeforeAssistant({
        turns:
          priorTurns,

        assistantTurn:
          previousAssistantTurn
      }) ||
      this.findLastTurnByRole(
        priorTurns,
        "user"
      ) ||
      this.normalizeTurn(
        threadContext
          .immediatePreviousUserTurn
      );

    const previousAnswerSummary =
      this.clean(
        continuityContext
          .previousAnswerSummary ||
        previousAssistantTurn
          ?.text ||
        ""
      );

    const previousQuestion =
      this.clean(
        previousUserTurn?.text ||
        ""
      );

    const priorPairAvailable =
      Boolean(
        previousQuestion ||
        previousAnswerSummary
      );

    return {
      available:
        priorPairAvailable,

      previousUserTurn:
        previousUserTurn ||
        null,

      previousAssistantTurn:
        previousAssistantTurn ||
        null,

      previousUserText:
        previousQuestion,

      previousAssistantText:
        previousAnswerSummary,

      recentTurns:
        priorTurns,

      priorPairAvailable,

      previousAnswerContainsClaim:
        this.looksLikeClaim(
          previousAnswerSummary
        ),

      previousAnswerContainsChoice:
        this.looksLikeChoice(
          previousAnswerSummary
        ),

      previousAnswerContainsQuantity:
        this.looksLikeQuantity(
          previousAnswerSummary
        ),

      previousAnswerContainsRecommendation:
        this.looksLikeRecommendation(
          previousAnswerSummary
        ),

      previousQuestionContainsOptions:
        this.looksLikeOptionQuestion(
          previousQuestion
        ),

      authority:
        "recent_exchange_record_only"
    };
  },

  collectRecentTurns({
    summary = {},
    threadContext = {}
  } = {}) {
    const sources = [
      threadContext.recentTurns,

      summary.recentMessages,

      summary.threadMessages,

      summary.conversationHistory,

      summary
        .continuityPacket
        ?.recentTurns,

      summary
        .threadState
        ?.recentMessages
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
              normalized &&
              normalized.text
            ) {
              collected.push(
                normalized
              );
            }
          }
        );
      }
    );

    const immediateTurns = [
      this.normalizeTurn(
        threadContext
          .immediatePreviousUserTurn
      ),

      this.normalizeTurn(
        threadContext
          .immediatePreviousAssistantTurn
      )
    ].filter(Boolean);

    collected.push(
      ...immediateTurns
    );

    return this.dedupeTurns(
      collected
    ).slice(-12);
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
      return {
        id:
          this.createStableId(
            "turn",
            turn
          ),

        role:
          null,

        text:
          this.clean(turn),

        createdAt:
          null,

        raw:
          turn
      };
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
            turn.createdAt
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

      entities:
        this.asArray(
          turn.entities
        ),

      events:
        this.asArray(
          turn.events
        ),

      claims:
        this.asArray(
          turn.claims
        ),

      quantities:
        this.asArray(
          turn.quantities
        ),

      options:
        this.asArray(
          turn.options
        ),

      semanticSummary:
        turn.semanticSummary ||
        null,

      raw:
        turn
    };
  },

  isCurrentTurn({
    turn = {},
    summary = {},
    threadContext = {}
  } = {}) {
    const currentText =
      this.normalize(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        threadContext.currentTurn
          ?.text ||
        ""
      );

    const turnText =
      this.normalize(
        turn.text
      );

    if (
      !currentText ||
      !turnText
    ) {
      return false;
    }

    if (
      currentText !==
      turnText
    ) {
      return false;
    }

    const currentTurnId =
      summary.turnId ||
      threadContext.currentTurn
        ?.turnId ||
      null;

    if (
      currentTurnId &&
      turn.id
    ) {
      return (
        String(turn.id) ===
        String(currentTurnId)
      );
    }

    return true;
  },

  findLastTurnByRole(
    turns = [],
    role = ""
  ) {
    const normalizedRole =
      this.normalizeRole(
        role
      );

    for (
      let index =
        this.asArray(turns).length -
        1;

      index >= 0;

      index -= 1
    ) {
      const turn =
        turns[index];

      if (
        this.normalizeRole(
          turn?.role
        ) ===
        normalizedRole
      ) {
        return turn;
      }
    }

    return null;
  },

  findPreviousUserTurnBeforeAssistant({
    turns = [],
    assistantTurn = null
  } = {}) {
    if (!assistantTurn) {
      return null;
    }

    const assistantIndex =
      turns.findIndex(
        turn =>
          turn.id ===
          assistantTurn.id
      );

    if (
      assistantIndex <= 0
    ) {
      return null;
    }

    for (
      let index =
        assistantIndex - 1;

      index >= 0;

      index -= 1
    ) {
      if (
        this.normalizeRole(
          turns[index]?.role
        ) ===
        "user"
      ) {
        return turns[index];
      }
    }

    return null;
  },

  /* =====================================================
     DETECTION
  ===================================================== */

  detectEllipticalFollowUp({
    currentTurn = {},
    recentExchange = {},
    continuityContext = {},
    semanticContext = {}
  } = {}) {
    const patternMatch =
      this.matchEllipticalPattern(
        currentTurn.normalizedText
      );

    const shortTurn =
      currentTurn.wordCount > 0 &&
      currentTurn.wordCount <= 8;

    const veryShortTurn =
      currentTurn.wordCount > 0 &&
      currentTurn.wordCount <= 3;

    const missingSemanticSlot =
      semanticContext
        .unresolvedSlots
        .length > 0 ||
      this.semanticTargetMissing(
        semanticContext
      );

    const continuityEvidence =
      continuityContext
        .requiresPriorContext ||
      continuityContext
        .isContinuation ||
      continuityContext
        .referencesPriorContext ||
      continuityContext
        .contextDependency >=
        0.55 ||
      continuityContext
        .followUpPressure >=
        0.55;

    const priorContextAvailable =
      recentExchange.available ===
        true ||
      continuityContext
        .priorContextAvailable ===
        true;

    const explicitPattern =
      Boolean(
        patternMatch
      );

    const genericShortQuestion =
      veryShortTurn &&
      /^(?:why|how|what|who|where|when|which|really|and|then|so)\b/
        .test(
          currentTurn.normalizedText
        );

    const likelyEllipsis =
      priorContextAvailable &&
      shortTurn &&
      (
        explicitPattern ||
        genericShortQuestion ||
        missingSemanticSlot
      ) &&
      (
        continuityEvidence ||
        explicitPattern
      );

    const fullySpecified =
      this.looksFullySpecified(
        currentTurn.normalizedText
      );

    const detected =
      likelyEllipsis &&
      !fullySpecified;

    const signals = [];

    if (shortTurn) {
      signals.push(
        "short_current_turn"
      );
    }

    if (veryShortTurn) {
      signals.push(
        "very_short_current_turn"
      );
    }

    if (explicitPattern) {
      signals.push(
        "elliptical_surface_pattern"
      );
    }

    if (missingSemanticSlot) {
      signals.push(
        "missing_semantic_slot"
      );
    }

    if (continuityEvidence) {
      signals.push(
        "continuity_dependency"
      );
    }

    if (priorContextAvailable) {
      signals.push(
        "prior_exchange_available"
      );
    }

    if (fullySpecified) {
      signals.push(
        "current_turn_appears_fully_specified"
      );
    }

    let confidence = 0;

    if (detected) {
      confidence =
        0.42;

      if (explicitPattern) {
        confidence +=
          0.22;
      }

      if (veryShortTurn) {
        confidence +=
          0.1;
      }

      if (missingSemanticSlot) {
        confidence +=
          0.1;
      }

      if (continuityEvidence) {
        confidence +=
          0.1;
      }

      if (
        recentExchange
          .priorPairAvailable
      ) {
        confidence +=
          0.05;
      }
    }

    return {
      detected,

      patternMatch,

      shortTurn,

      veryShortTurn,

      missingSemanticSlot,

      continuityEvidence,

      priorContextAvailable,

      fullySpecified,

      signals,

      confidence:
        this.normalizeConfidence(
          confidence
        ),

      reason:
        detected
          ? "The current turn is a short context-dependent follow-up with omitted semantic content."
          : fullySpecified
            ? "The current turn appears semantically complete without inherited context."
            : !priorContextAvailable
              ? "No usable prior exchange was available for elliptical resolution."
              : "The available signals were insufficient to classify the current turn as elliptical.",

      authority:
        "elliptical_follow_up_detection_only"
    };
  },

  matchEllipticalPattern(
    normalizedText = ""
  ) {
    const text =
      this.normalize(
        normalizedText
      );

    if (!text) {
      return null;
    }

    const patterns = [
      {
        family:
          "causal_explanation",

        operation:
          "request_reason",

        pattern:
          /^(?:but\s+)?why(?:\s+though)?$/
      },

      {
        family:
          "negative_causal_explanation",

        operation:
          "request_reason_for_rejection",

        pattern:
          /^why\s+not$/
      },

      {
        family:
          "method_or_mechanism",

        operation:
          "request_method_or_explanation",

        pattern:
          /^(?:but\s+)?how(?:\s+so)?$/
      },

      {
        family:
          "confirmation",

        operation:
          "request_confirmation",

        pattern:
          /^(?:wait\s+)?(?:really|seriously|for\s+real|are\s+you\s+sure)$/
      },

      {
        family:
          "clarification",

        operation:
          "request_clarification",

        pattern:
          /^(?:what\s+do\s+you\s+mean|meaning|huh|what)$/
      },

      {
        family:
          "person_identification",

        operation:
          "request_person",

        pattern:
          /^who(?:\s+exactly)?$/
      },

      {
        family:
          "location_identification",

        operation:
          "request_location",

        pattern:
          /^where(?:\s+exactly)?$/
      },

      {
        family:
          "time_identification",

        operation:
          "request_time",

        pattern:
          /^when(?:\s+exactly)?$/
      },

      {
        family:
          "selection",

        operation:
          "request_selection",

        pattern:
          /^which(?:\s+one)?$/
      },

      {
        family:
          "quantity_or_degree",

        operation:
          "request_quantity_or_degree",

        pattern:
          /^how\s+(?:much|many|big|small|long|far|often|old)$/
      },

      {
        family:
          "severity",

        operation:
          "request_severity",

        pattern:
          /^how\s+(?:bad|serious|severe)$/
      },

      {
        family:
          "probability",

        operation:
          "request_probability",

        pattern:
          /^how\s+likely$/
      },

      {
        family:
          "evidence",

        operation:
          "request_evidence",

        pattern:
          /^(?:based\s+on\s+what|what\s+is\s+that\s+based\s+on|what\s+evidence)$/
      },

      {
        family:
          "source",

        operation:
          "request_source",

        pattern:
          /^(?:says\s+who|according\s+to\s+who|source)$/
      },

      {
        family:
          "significance",

        operation:
          "request_significance",

        pattern:
          /^(?:so\s+what|why\s+does\s+that\s+matter)$/
      },

      {
        family:
          "consequence_or_next_step",

        operation:
          "request_consequence_or_next_step",

        pattern:
          /^(?:then\s+what|what\s+next|now\s+what|and\s+then)$/
      },

      {
        family:
          "continuation",

        operation:
          "request_continuation",

        pattern:
          /^(?:and|go\s+on|continue|what\s+else)$/
      },

      {
        family:
          "alternative_or_comparison",

        operation:
          "request_alternative_or_comparison",

        pattern:
          /^what\s+about(?:\s+that|\s+this|\s+it|\s+the\s+other\s+one|\s+the\s+second\s+one|\s+the\s+first\s+one)?$/
      },

      {
        family:
          "selection_reference",

        operation:
          "request_referenced_option",

        pattern:
          /^(?:why|how)\s+(?:that|this)\s+one$/
      },

      {
        family:
          "demonstrative_follow_up",

        operation:
          "request_about_prior_referent",

        pattern:
          /^(?:what|why|how)\s+about\s+(?:that|this|it)$/
      }
    ];

    const match =
      patterns.find(
        item =>
          item.pattern.test(
            text
          )
      );

    if (!match) {
      return null;
    }

    return {
      family:
        match.family,

      operation:
        match.operation,

      matchedText:
        text,

      source:
        "surface_pattern"
    };
  },

  looksFullySpecified(
    normalizedText = ""
  ) {
    const text =
      this.normalize(
        normalizedText
      );

    if (!text) {
      return false;
    }

    const words =
      text
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length <= 3
    ) {
      return false;
    }

    const hasExplicitObject =
      /\b(?:why|how|what|who|where|when|which)\b.+\b(?:is|are|was|were|do|does|did|can|could|should|would|will|has|have|had|the|this|that|my|your|his|her|their|our)\b/
        .test(
          text
        );

    const hasContentNoun =
      /\b(?:color|flower|car|job|file|code|engine|pipeline|person|place|time|price|cost|problem|answer|reason|choice|option|plan|idea|symptom|medicine|event|team|game|movie|book)\b/
        .test(
          text
        );

    return (
      words.length >= 7 &&
      hasExplicitObject
    ) ||
    (
      words.length >= 5 &&
      hasContentNoun
    );
  },

  semanticTargetMissing(
    semanticContext = {}
  ) {
    const targetValue =
      this.extractSemanticValue(
        semanticContext.target
      );

    const objectValue =
      this.extractSemanticValue(
        semanticContext.targetObject
      );

    return !targetValue &&
      !objectValue;
  },

  /* =====================================================
     FOLLOW-UP FAMILY
  ===================================================== */

  resolveFollowUpFamily({
    currentTurn = {},
    detection = {},
    semanticContext = {},
    recentExchange = {}
  } = {}) {
    if (
      detection.patternMatch
    ) {
      return {
        family:
          detection
            .patternMatch
            .family,

        operation:
          detection
            .patternMatch
            .operation,

        source:
          detection
            .patternMatch
            .source,

        confidence:
          0.96
      };
    }

    const text =
      currentTurn.normalizedText;

    let family =
      "general_elaboration";

    let operation =
      "request_elaboration";

    if (
      /^why\b/.test(
        text
      )
    ) {
      family =
        "causal_explanation";

      operation =
        "request_reason";
    } else if (
      /^how\b/.test(
        text
      )
    ) {
      family =
        "method_or_mechanism";

      operation =
        "request_method_or_explanation";
    } else if (
      /^who\b/.test(
        text
      )
    ) {
      family =
        "person_identification";

      operation =
        "request_person";
    } else if (
      /^where\b/.test(
        text
      )
    ) {
      family =
        "location_identification";

      operation =
        "request_location";
    } else if (
      /^when\b/.test(
        text
      )
    ) {
      family =
        "time_identification";

      operation =
        "request_time";
    } else if (
      /^which\b/.test(
        text
      )
    ) {
      family =
        "selection";

      operation =
        "request_selection";
    } else if (
      /^(?:really|seriously)\b/
        .test(
          text
        )
    ) {
      family =
        "confirmation";

      operation =
        "request_confirmation";
    } else if (
      /^then\b/.test(
        text
      )
    ) {
      family =
        "consequence_or_next_step";

      operation =
        "request_consequence_or_next_step";
    } else if (
      /^and\b/.test(
        text
      )
    ) {
      family =
        "continuation";

      operation =
        "request_continuation";
    } else if (
      /^what\b/.test(
        text
      )
    ) {
      family =
        recentExchange
          .previousQuestionContainsOptions
          ? "alternative_or_comparison"
          : "general_elaboration";

      operation =
        recentExchange
          .previousQuestionContainsOptions
          ? "request_alternative_or_comparison"
          : "request_elaboration";
    }

    if (
      semanticContext
        .unresolvedSlots
        .includes("person")
    ) {
      family =
        "person_identification";

      operation =
        "request_person";
    }

    if (
      semanticContext
        .unresolvedSlots
        .includes("location")
    ) {
      family =
        "location_identification";

      operation =
        "request_location";
    }

    if (
      semanticContext
        .unresolvedSlots
        .includes("time")
    ) {
      family =
        "time_identification";

      operation =
        "request_time";
    }

    return {
      family,

      operation,

      source:
        "semantic_family_inference",

      confidence:
        0.78
    };
  },

  /* =====================================================
     ANCHOR CANDIDATES
  ===================================================== */

  buildAnchorCandidates({
    recentExchange = {},
    semanticContext = {},
    continuityContext = {}
  } = {}) {
    const candidates = [];

    const add =
      candidate => {
        const normalized =
          this.normalizeAnchorCandidate(
            candidate
          );

        if (
          !normalized ||
          !normalized.text
        ) {
          return;
        }

        candidates.push(
          normalized
        );
      };

    if (
      recentExchange
        .previousAssistantText
    ) {
      add({
        type:
          "previous_assistant_proposition",

        text:
          recentExchange
            .previousAssistantText,

        role:
          "assistant",

        sourceTurnId:
          recentExchange
            .previousAssistantTurn
            ?.id,

        turnDistance:
          1,

        priority:
          92,

        metadata: {
          containsClaim:
            recentExchange
              .previousAnswerContainsClaim,

          containsChoice:
            recentExchange
              .previousAnswerContainsChoice,

          containsQuantity:
            recentExchange
              .previousAnswerContainsQuantity,

          containsRecommendation:
            recentExchange
              .previousAnswerContainsRecommendation
        }
      });
    }

    if (
      recentExchange
        .previousUserText
    ) {
      add({
        type:
          "previous_user_request",

        text:
          recentExchange
            .previousUserText,

        role:
          "user",

        sourceTurnId:
          recentExchange
            .previousUserTurn
            ?.id,

        turnDistance:
          recentExchange
            .previousAssistantText
            ? 2
            : 1,

        priority:
          75,

        metadata: {
          containsOptions:
            recentExchange
              .previousQuestionContainsOptions
        }
      });
    }

    const previousAssistantTurn =
      recentExchange
        .previousAssistantTurn ||
      {};

    this.asArray(
      previousAssistantTurn.claims
    ).forEach(
      claim => {
        add({
          type:
            "previous_assistant_claim",

          text:
            this.extractNodeText(
              claim
            ),

          semanticType:
            "claim",

          role:
            "assistant",

          sourceTurnId:
            previousAssistantTurn.id,

          turnDistance:
            1,

          priority:
            96,

          raw:
            claim
        });
      }
    );

    this.asArray(
      previousAssistantTurn.events
    ).forEach(
      event => {
        add({
          type:
            "previous_assistant_event",

          text:
            this.extractNodeText(
              event
            ),

          semanticType:
            "event",

          role:
            "assistant",

          sourceTurnId:
            previousAssistantTurn.id,

          turnDistance:
            1,

          priority:
            88,

          raw:
            event
        });
      }
    );

    this.asArray(
      previousAssistantTurn.quantities
    ).forEach(
      quantity => {
        add({
          type:
            "previous_assistant_quantity",

          text:
            this.extractNodeText(
              quantity
            ),

          semanticType:
            "quantity",

          role:
            "assistant",

          sourceTurnId:
            previousAssistantTurn.id,

          turnDistance:
            1,

          priority:
            90,

          raw:
            quantity
        });
      }
    );

    this.asArray(
      recentExchange
        .previousUserTurn
        ?.options
    ).forEach(
      option => {
        add({
          type:
            "previous_user_option",

          text:
            this.extractNodeText(
              option
            ),

          semanticType:
            "option",

          role:
            "user",

          sourceTurnId:
            recentExchange
              .previousUserTurn
              ?.id,

          turnDistance:
            2,

          priority:
            84,

          raw:
            option
        });
      }
    );

    const semanticTarget =
      this.extractSemanticValue(
        semanticContext.target
      );

    if (semanticTarget) {
      add({
        type:
          "current_semantic_target",

        text:
          semanticTarget,

        semanticType:
          semanticContext.target
            ?.type ||
          "concept",

        role:
          "current_turn",

        turnDistance:
          0,

        priority:
          60,

        raw:
          semanticContext.target
      });
    }

    const semanticObject =
      this.extractSemanticValue(
        semanticContext.targetObject
      );

    if (
      semanticObject &&
      semanticObject !==
      semanticTarget
    ) {
      add({
        type:
          "current_semantic_object",

        text:
          semanticObject,

        semanticType:
          semanticContext
            .targetObject
            ?.type ||
          "concept",

        role:
          "current_turn",

        turnDistance:
          0,

        priority:
          58,

        raw:
          semanticContext
            .targetObject
      });
    }

    if (
      continuityContext.anchor
    ) {
      add({
        type:
          "continuity_anchor",

        text:
          this.extractSemanticValue(
            continuityContext.anchor
          ) ||
          continuityContext.anchor,

        role:
          "continuity",

        turnDistance:
          1,

        priority:
          continuityContext
            .anchorResolved
            ? 94
            : 70,

        metadata: {
          anchorResolved:
            continuityContext
              .anchorResolved
        },

        raw:
          continuityContext.anchor
      });
    }

    return this.dedupeAnchorCandidates(
      candidates
    );
  },

  normalizeAnchorCandidate(
    candidate = {}
  ) {
    const text =
      this.clean(
        candidate.text ||
        candidate.value ||
        candidate.label ||
        ""
      );

    if (!text) {
      return null;
    }

    return {
      id:
        candidate.id ||
        this.createStableId(
          "ellipsis_anchor",
          [
            candidate.type,
            candidate.sourceTurnId,
            text
          ].join("|")
        ),

      type:
        candidate.type ||
        "unknown_anchor",

      semanticType:
        this.normalizeIdentifier(
          candidate.semanticType ||
          this.inferAnchorSemanticType(
            text
          )
        ),

      text,

      normalizedText:
        this.normalize(
          text
        ),

      role:
        candidate.role ||
        null,

      sourceTurnId:
        candidate.sourceTurnId ||
        null,

      turnDistance:
        Number.isFinite(
          Number(
            candidate.turnDistance
          )
        )
          ? Number(
              candidate.turnDistance
            )
          : 1,

      priority:
        Number.isFinite(
          Number(
            candidate.priority
          )
        )
          ? Number(
              candidate.priority
            )
          : 50,

      metadata:
        candidate.metadata ||
        {},

      raw:
        candidate.raw ||
        candidate
    };
  },

  rankAnchorCandidates({
    candidates = [],
    currentTurn = {},
    familyResolution = {},
    recentExchange = {}
  } = {}) {
    return this.asArray(
      candidates
    )
      .map(
        candidate => {
          const breakdown =
            this.scoreAnchorCandidate({
              candidate,
              currentTurn,
              familyResolution,
              recentExchange
            });

          const score =
            Object.values(
              breakdown
            ).reduce(
              (
                total,
                value
              ) =>
                total +
                Number(
                  value ||
                  0
                ),
              0
            );

          return {
            ...candidate,

            score:
              this.roundScore(
                score
              ),

            scoreBreakdown:
              breakdown
          };
        }
      )
      .sort(
        (
          first,
          second
        ) =>
          second.score -
          first.score
      );
  },

  scoreAnchorCandidate({
    candidate = {},
    currentTurn = {},
    familyResolution = {},
    recentExchange = {}
  } = {}) {
    return {
      basePriority:
        Number(
          candidate.priority ||
          0
        ),

      recency:
        this.scoreAnchorRecency(
          candidate
        ),

      roleCompatibility:
        this.scoreAnchorRoleCompatibility({
          candidate,
          familyResolution
        }),

      semanticCompatibility:
        this.scoreAnchorSemanticCompatibility({
          candidate,
          familyResolution
        }),

      lexicalCompatibility:
        this.scoreAnchorLexicalCompatibility({
          candidate,
          currentTurn
        }),

      exchangeCompatibility:
        this.scoreExchangeCompatibility({
          candidate,
          familyResolution,
          recentExchange
        }),

      duplicateOrThinPenalty:
        this.scoreThinAnchorPenalty(
          candidate
        )
    };
  },

  scoreAnchorRecency(
    candidate = {}
  ) {
    const distance =
      Number(
        candidate.turnDistance ||
        0
      );

    if (distance === 0) {
      return 6;
    }

    if (distance === 1) {
      return 18;
    }

    if (distance === 2) {
      return 12;
    }

    return Math.max(
      -10,
      8 -
      distance *
      3
    );
  },

  scoreAnchorRoleCompatibility({
    candidate = {},
    familyResolution = {}
  } = {}) {
    const family =
      familyResolution.family;

    if (
      [
        "causal_explanation",
        "negative_causal_explanation",
        "confirmation",
        "evidence",
        "source",
        "significance",
        "clarification",
        "method_or_mechanism"
      ].includes(
        family
      )
    ) {
      if (
        candidate.role ===
        "assistant"
      ) {
        return 20;
      }
    }

    if (
      [
        "selection",
        "alternative_or_comparison",
        "selection_reference"
      ].includes(
        family
      )
    ) {
      if (
        candidate.role ===
        "user"
      ) {
        return 12;
      }

      if (
        candidate.semanticType ===
        "option"
      ) {
        return 18;
      }
    }

    if (
      family ===
      "continuation" &&
      candidate.role ===
        "assistant"
    ) {
      return 16;
    }

    return 4;
  },

  scoreAnchorSemanticCompatibility({
    candidate = {},
    familyResolution = {}
  } = {}) {
    const family =
      familyResolution.family;

    const type =
      candidate.semanticType;

    const map = {
      causal_explanation: [
        "claim",
        "event",
        "concept",
        "previous_assistant_proposition"
      ],

      negative_causal_explanation: [
        "claim",
        "event",
        "option",
        "concept"
      ],

      method_or_mechanism: [
        "event",
        "claim",
        "process",
        "concept"
      ],

      confirmation: [
        "claim",
        "previous_assistant_proposition",
        "event"
      ],

      evidence: [
        "claim",
        "previous_assistant_proposition",
        "recommendation"
      ],

      source: [
        "claim",
        "previous_assistant_proposition"
      ],

      quantity_or_degree: [
        "quantity",
        "attribute",
        "claim"
      ],

      severity: [
        "claim",
        "event",
        "attribute"
      ],

      probability: [
        "claim",
        "event",
        "prediction"
      ],

      selection: [
        "option"
      ],

      alternative_or_comparison: [
        "option",
        "claim",
        "previous_user_request"
      ],

      consequence_or_next_step: [
        "event",
        "claim",
        "plan",
        "previous_assistant_proposition"
      ],

      continuation: [
        "previous_assistant_proposition",
        "claim",
        "event"
      ]
    };

    const accepted =
      map[family] ||
      [];

    if (
      accepted.includes(type) ||
      accepted.includes(
        candidate.type
      )
    ) {
      return 24;
    }

    if (
      candidate.type ===
      "previous_assistant_proposition"
    ) {
      return 12;
    }

    if (
      candidate.type ===
      "previous_user_request"
    ) {
      return 8;
    }

    return 2;
  },

  scoreAnchorLexicalCompatibility({
    candidate = {},
    currentTurn = {}
  } = {}) {
    const currentText =
      currentTurn.normalizedText;

    const anchorText =
      candidate.normalizedText;

    let score = 0;

    if (
      /\bother\s+one\b/.test(
        currentText
      ) &&
      (
        candidate.semanticType ===
        "option" ||
        candidate.metadata
          ?.containsOptions ===
          true
      )
    ) {
      score += 24;
    }

    if (
      /\bthat\s+one\b/.test(
        currentText
      ) &&
      candidate.semanticType ===
        "option"
    ) {
      score += 18;
    }

    if (
      /\bhow\s+much\b/.test(
        currentText
      ) &&
      (
        candidate.semanticType ===
        "quantity" ||
        this.looksLikeQuantity(
          anchorText
        )
      )
    ) {
      score += 22;
    }

    if (
      /\bwho\b/.test(
        currentText
      ) &&
      /\b(?:he|she|they|person|man|woman|doctor|friend|brother|wife|husband|user|assistant)\b/
        .test(
          anchorText
        )
    ) {
      score += 12;
    }

    return score;
  },

  scoreExchangeCompatibility({
    candidate = {},
    familyResolution = {},
    recentExchange = {}
  } = {}) {
    let score = 0;

    if (
      familyResolution.family ===
        "causal_explanation" &&
      recentExchange
        .previousAnswerContainsChoice &&
      candidate.role ===
        "assistant"
    ) {
      score += 16;
    }

    if (
      familyResolution.family ===
        "confirmation" &&
      recentExchange
        .previousAnswerContainsClaim &&
      candidate.role ===
        "assistant"
    ) {
      score += 18;
    }

    if (
      familyResolution.family ===
        "alternative_or_comparison" &&
      recentExchange
        .previousQuestionContainsOptions
    ) {
      score += 18;
    }

    if (
      familyResolution.family ===
        "quantity_or_degree" &&
      recentExchange
        .previousAnswerContainsQuantity
    ) {
      score += 16;
    }

    if (
      familyResolution.family ===
        "consequence_or_next_step" &&
      recentExchange
        .previousAnswerContainsRecommendation
    ) {
      score += 14;
    }

    return score;
  },

  scoreThinAnchorPenalty(
    candidate = {}
  ) {
    const words =
      candidate.normalizedText
        .split(/\s+/)
        .filter(Boolean)
        .length;

    if (words <= 1) {
      return -20;
    }

    if (words <= 3) {
      return -8;
    }

    if (
      candidate.normalizedText ===
      "information request"
    ) {
      return -30;
    }

    return 0;
  },

  /* =====================================================
     ANCHOR DECISION
  ===================================================== */

  selectAnchor({
    rankedAnchors = [],
    currentTurn = {},
    familyResolution = {}
  } = {}) {
    const best =
      rankedAnchors[0] ||
      null;

    const second =
      rankedAnchors[1] ||
      null;

    if (!best) {
      return {
        status:
          "unresolved",

        selected:
          null,

        confidence:
          0,

        score:
          0,

        margin:
          0,

        requiresClarification:
          true,

        reason:
          "No usable prior conversational anchor was available.",

        competingAnchors:
          []
      };
    }

    const score =
      Number(
        best.score ||
        0
      );

    const secondScore =
      Number(
        second?.score ||
        0
      );

    const margin =
      score -
      secondScore;

    const threshold =
      this.anchorThreshold({
        currentTurn,
        familyResolution
      });

    const requiredMargin =
      this.anchorMarginRequirement({
        familyResolution
      });

    if (
      score < threshold
    ) {
      return {
        status:
          "unresolved",

        selected:
          null,

        confidence:
          this.anchorScoreToConfidence(
            score,
            margin
          ),

        score,

        margin,

        requiresClarification:
          true,

        reason:
          `The strongest anchor score ${score} did not meet the required threshold ${threshold}.`,

        competingAnchors:
          rankedAnchors
            .slice(0, 3)
      };
    }

    if (
      second &&
      margin <
      requiredMargin
    ) {
      return {
        status:
          "ambiguous",

        selected:
          null,

        confidence:
          this.anchorScoreToConfidence(
            score,
            margin
          ),

        score,

        margin,

        requiresClarification:
          true,

        reason:
          `The strongest anchors were too close. Required margin: ${requiredMargin}; observed margin: ${margin}.`,

        competingAnchors:
          rankedAnchors
            .slice(0, 3)
      };
    }

    return {
      status:
        "resolved",

      selected:
        best,

      confidence:
        this.anchorScoreToConfidence(
          score,
          margin
        ),

      score,

      margin,

      requiresClarification:
        false,

      reason:
        `The follow-up was anchored to the ${best.type} from the recent conversation.`,

      competingAnchors:
        rankedAnchors
          .slice(1, 4)
    };
  },

  anchorThreshold({
    currentTurn = {},
    familyResolution = {}
  } = {}) {
    if (
      currentTurn.wordCount <= 1
    ) {
      return 95;
    }

    if (
      [
        "alternative_or_comparison",
        "selection",
        "selection_reference"
      ].includes(
        familyResolution.family
      )
    ) {
      return 88;
    }

    return 82;
  },

  anchorMarginRequirement({
    familyResolution = {}
  } = {}) {
    if (
      [
        "selection",
        "alternative_or_comparison",
        "selection_reference"
      ].includes(
        familyResolution.family
      )
    ) {
      return 10;
    }

    if (
      [
        "person_identification",
        "location_identification",
        "time_identification"
      ].includes(
        familyResolution.family
      )
    ) {
      return 12;
    }

    return 7;
  },

  anchorScoreToConfidence(
    score = 0,
    margin = 0
  ) {
    const value =
      0.42 +
      Math.min(
        0.4,
        Number(score || 0) /
        300
      ) +
      Math.min(
        0.14,
        Number(margin || 0) /
        100
      );

    return Number(
      Math.max(
        0,
        Math.min(
          0.98,
          value
        )
      ).toFixed(3)
    );
  },

  /* =====================================================
     INHERITED CONTEXT
  ===================================================== */

  buildInheritedContext({
    anchorDecision = {},
    familyResolution = {},
    currentTurn = {},
    recentExchange = {}
  } = {}) {
    const selected =
      anchorDecision.selected;

    if (!selected) {
      return {
        inherited:
          false,

        subject:
          null,

        target:
          null,

        object:
          null,

        proposition:
          null,

        event:
          null,

        option:
          null,

        quantity:
          null,

        sourceTurnId:
          null,

        sourceRole:
          null,

        reason:
          "No anchor was selected."
      };
    }

    const extraction =
      this.extractAnchorMeaning({
        anchor:
          selected,

        familyResolution,
        currentTurn,
        recentExchange
      });

    return {
      inherited:
        true,

      subject:
        extraction.subject,

      target:
        extraction.target,

      object:
        extraction.object,

      proposition:
        extraction.proposition,

      event:
        extraction.event,

      option:
        extraction.option,

      quantity:
        extraction.quantity,

      sourceTurnId:
        selected.sourceTurnId,

      sourceRole:
        selected.role,

      anchorType:
        selected.type,

      anchorText:
        selected.text,

      minimumNecessaryContextOnly:
        true,

      reason:
        "Inherited only the context required to complete the elliptical follow-up.",

      authority:
        "elliptical_slot_inheritance_only"
    };
  },

  extractAnchorMeaning({
    anchor = {},
    familyResolution = {},
    recentExchange = {}
  } = {}) {
    const text =
      this.clean(
        anchor.text
      );

    const family =
      familyResolution.family;

    const extractedChoice =
      this.extractChoiceFromText(
        text
      );

    const extractedQuantity =
      this.extractQuantityFromText(
        text
      );

    const extractedSubject =
      this.extractSubjectFromQuestion(
        recentExchange
          .previousUserText
      );

    const base = {
      subject:
        extractedSubject ||
        (
          anchor.role ===
          "assistant"
            ? "assistant"
            : null
        ),

      target:
        null,

      object:
        null,

      proposition:
        text ||
        null,

      event:
        null,

      option:
        null,

      quantity:
        null
    };

    if (
      [
        "causal_explanation",
        "negative_causal_explanation",
        "confirmation",
        "clarification",
        "evidence",
        "source",
        "significance"
      ].includes(
        family
      )
    ) {
      base.target =
        extractedChoice ||
        text;

      base.object =
        extractedChoice ||
        text;

      base.proposition =
        text;
    }

    if (
      family ===
      "method_or_mechanism"
    ) {
      base.event =
        text;

      base.target =
        text;
    }

    if (
      [
        "selection",
        "selection_reference",
        "alternative_or_comparison"
      ].includes(
        family
      )
    ) {
      base.option =
        extractedChoice ||
        text;

      base.target =
        extractedChoice ||
        text;
    }

    if (
      [
        "quantity_or_degree",
        "severity",
        "probability"
      ].includes(
        family
      )
    ) {
      base.quantity =
        extractedQuantity;

      base.target =
        text;
    }

    if (
      family ===
      "consequence_or_next_step"
    ) {
      base.event =
        text;

      base.target =
        text;
    }

    if (
      family ===
      "continuation"
    ) {
      base.proposition =
        text;

      base.target =
        text;
    }

    if (
      family ===
      "person_identification"
    ) {
      base.target =
        "person associated with the prior statement";
    }

    if (
      family ===
      "location_identification"
    ) {
      base.target =
        "location associated with the prior statement";
    }

    if (
      family ===
      "time_identification"
    ) {
      base.target =
        "time associated with the prior statement";
    }

    return base;
  },

  /* =====================================================
     RESOLVED TURN
  ===================================================== */

  buildResolvedTurn({
    currentTurn = {},
    familyResolution = {},
    anchorDecision = {},
    inheritedContext = {},
    recentExchange = {}
  } = {}) {
    if (
      anchorDecision.status !==
      "resolved" ||
      !anchorDecision.selected
    ) {
      return {
        resolved:
          false,

        originalText:
          currentTurn.originalText,

        resolvedText:
          currentTurn.originalText,

        currentTurnWasResolved:
          false,

        requiresClarification:
          true,

        resolutionReason:
          anchorDecision.reason,

        authority:
          "resolved_turn_record_only"
      };
    }

    const resolvedText =
      this.renderResolvedText({
        currentTurn,
        familyResolution,
        inheritedContext,
        recentExchange,
        anchor:
          anchorDecision.selected
      });

    const changed =
      this.normalize(
        resolvedText
      ) !==
      this.normalize(
        currentTurn.originalText
      );

    return {
      resolved:
        Boolean(
          resolvedText
        ),

      originalText:
        currentTurn.originalText,

      text:
        resolvedText ||
        currentTurn.originalText,

      resolvedText:
        resolvedText ||
        currentTurn.originalText,

      currentTurnWasResolved:
        changed,

      followUpFamily:
        familyResolution.family,

      followUpOperation:
        familyResolution.operation,

      inheritedSubject:
        inheritedContext.subject,

      inheritedTarget:
        inheritedContext.target,

      inheritedObject:
        inheritedContext.object,

      inheritedProposition:
        inheritedContext.proposition,

      inheritedEvent:
        inheritedContext.event,

      inheritedOption:
        inheritedContext.option,

      inheritedQuantity:
        inheritedContext.quantity,

      sourceTurnId:
        inheritedContext.sourceTurnId,

      sourceRole:
        inheritedContext.sourceRole,

      requiresClarification:
        !resolvedText,

      resolutionReason:
        resolvedText
          ? "The omitted semantic content was reconstructed from the selected recent-thread anchor."
          : "A safe natural-language reconstruction could not be produced.",

      originalPreserved:
        true,

      authority:
        "resolved_current_turn_only"
    };
  },

  renderResolvedText({
    currentTurn = {},
    familyResolution = {},
    inheritedContext = {},
    recentExchange = {},
    anchor = {}
  } = {}) {
    const original =
      currentTurn.originalText;

    const family =
      familyResolution.family;

    const target =
      this.clean(
        inheritedContext.target ||
        inheritedContext.object ||
        inheritedContext.option ||
        inheritedContext.event ||
        inheritedContext.proposition ||
        anchor.text ||
        ""
      );

    const conciseTarget =
      this.buildConciseAnchorDescription({
        target,
        previousQuestion:
          recentExchange
            .previousUserText,

        previousAnswer:
          recentExchange
            .previousAssistantText,

        family
      });

    switch (family) {
      case "causal_explanation":
        return this.renderWhyResolution({
          conciseTarget,
          previousQuestion:
            recentExchange
              .previousUserText,

          previousAnswer:
            recentExchange
              .previousAssistantText
        });

      case "negative_causal_explanation":
        return conciseTarget
          ? `Why would ${conciseTarget} not be the preferred choice?`
          : `Why not?`;

      case "method_or_mechanism":
        return conciseTarget
          ? `How does ${conciseTarget} work or happen?`
          : `How does the previous answer work?`;

      case "confirmation":
        return conciseTarget
          ? `Is it really true that ${this.lowercaseFirst(
              conciseTarget
            )}?`
          : `Is the previous answer really correct?`;

      case "clarification":
        return conciseTarget
          ? `What do you mean by ${this.quoteIfNeeded(
              conciseTarget
            )}?`
          : `What do you mean by your previous answer?`;

      case "person_identification":
        return conciseTarget
          ? `Who is the person connected to ${this.quoteIfNeeded(
              conciseTarget
            )}?`
          : `Who are you referring to in the previous answer?`;

      case "location_identification":
        return conciseTarget
          ? `Where does ${conciseTarget} take place or apply?`
          : `Where does the previous answer apply?`;

      case "time_identification":
        return conciseTarget
          ? `When does ${conciseTarget} happen or apply?`
          : `When does the previous answer apply?`;

      case "selection":
        return `Which option from the previous discussion is the better choice?`;

      case "selection_reference":
        return conciseTarget
          ? `${this.capitalizeFirst(
              original
            )} because of ${conciseTarget}?`
          : `${this.capitalizeFirst(
              original
            )}?`;

      case "alternative_or_comparison":
        return this.renderAlternativeResolution({
          original,
          recentExchange,
          conciseTarget
        });

      case "quantity_or_degree":
        return conciseTarget
          ? `What is the amount, degree, or magnitude associated with ${conciseTarget}?`
          : `What is the relevant amount or degree from the previous answer?`;

      case "severity":
        return conciseTarget
          ? `How serious or severe is ${conciseTarget}?`
          : `How serious is the situation described in the previous answer?`;

      case "probability":
        return conciseTarget
          ? `How likely is ${conciseTarget}?`
          : `How likely is the outcome described in the previous answer?`;

      case "evidence":
        return conciseTarget
          ? `What evidence supports the claim that ${this.lowercaseFirst(
              conciseTarget
            )}?`
          : `What evidence supports the previous answer?`;

      case "source":
        return conciseTarget
          ? `What source supports the claim that ${this.lowercaseFirst(
              conciseTarget
            )}?`
          : `What is the source for the previous answer?`;

      case "significance":
        return conciseTarget
          ? `Why does ${conciseTarget} matter?`
          : `Why does the previous answer matter?`;

      case "consequence_or_next_step":
        return conciseTarget
          ? `What happens next after ${conciseTarget}?`
          : `What should happen next based on the previous answer?`;

      case "continuation":
        return conciseTarget
          ? `Continue explaining ${conciseTarget}.`
          : `Continue the previous explanation.`;

      case "demonstrative_follow_up":
        return conciseTarget
          ? `${this.capitalizeFirst(
              original
            )} in relation to ${conciseTarget}?`
          : `${this.capitalizeFirst(
              original
            )}?`;

      case "general_elaboration":
      default:
        return conciseTarget
          ? `Can you elaborate on ${conciseTarget}?`
          : `Can you elaborate on the previous answer?`;
    }
  },

  renderWhyResolution({
    conciseTarget = "",
    previousQuestion = "",
    previousAnswer = ""
  } = {}) {
    const choice =
      this.extractChoiceFromText(
        previousAnswer
      );

    const preferenceSubject =
      this.extractPreferenceSubject(
        previousQuestion
      );

    if (
      choice &&
      preferenceSubject
    ) {
      return `Why would you choose ${choice} as your ${preferenceSubject}?`;
    }

    if (choice) {
      return `Why would you choose ${choice}?`;
    }

    if (
      conciseTarget &&
      this.looksLikeCompleteClaim(
        conciseTarget
      )
    ) {
      return `Why is it true that ${this.lowercaseFirst(
        conciseTarget
      )}?`;
    }

    if (conciseTarget) {
      return `Why did you say ${this.quoteIfNeeded(
        conciseTarget
      )}?`;
    }

    return "Why did you give the previous answer?";
  },

  renderAlternativeResolution({
    original = "",
    recentExchange = {},
    conciseTarget = ""
  } = {}) {
    const normalized =
      this.normalize(
        original
      );

    if (
      /\bother\s+one\b/.test(
        normalized
      )
    ) {
      return "What about the other option from the previous discussion?";
    }

    if (
      /\bsecond\s+one\b/.test(
        normalized
      )
    ) {
      return "What about the second option from the previous discussion?";
    }

    if (
      /\bfirst\s+one\b/.test(
        normalized
      )
    ) {
      return "What about the first option from the previous discussion?";
    }

    if (
      recentExchange
        .previousQuestionContainsOptions
    ) {
      return "How does the alternative option compare with the one just discussed?";
    }

    return conciseTarget
      ? `What about the alternative to ${conciseTarget}?`
      : "What about the alternative from the previous discussion?";
  },

  buildConciseAnchorDescription({
    target = "",
    previousQuestion = "",
    previousAnswer = "",
    family = ""
  } = {}) {
    const cleanedTarget =
      this.clean(
        target
      );

    const choice =
      this.extractChoiceFromText(
        previousAnswer
      );

    if (
      [
        "causal_explanation",
        "confirmation",
        "clarification",
        "evidence",
        "source",
        "significance"
      ].includes(
        family
      ) &&
      choice
    ) {
      return choice;
    }

    if (
      cleanedTarget.length <=
      180
    ) {
      return this.stripTerminalPunctuation(
        cleanedTarget
      );
    }

    const firstSentence =
      this.splitSentences(
        cleanedTarget
      )[0] ||
      cleanedTarget;

    if (
      firstSentence.length <=
      180
    ) {
      return this.stripTerminalPunctuation(
        firstSentence
      );
    }

    const preferenceSubject =
      this.extractPreferenceSubject(
        previousQuestion
      );

    if (
      choice &&
      preferenceSubject
    ) {
      return `${choice} as your ${preferenceSubject}`;
    }

    return this.stripTerminalPunctuation(
      firstSentence.slice(
        0,
        177
      ) + "..."
    );
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality({
    detection = {},
    familyResolution = {},
    anchorDecision = {},
    resolvedTurn = {},
    recentExchange = {}
  } = {}) {
    const warnings = [];

    if (
      recentExchange.available !==
      true
    ) {
      warnings.push(
        "prior_exchange_unavailable"
      );
    }

    if (
      detection.detected !==
      true
    ) {
      warnings.push(
        "elliptical_follow_up_not_detected"
      );
    }

    if (
      anchorDecision.status ===
      "ambiguous"
    ) {
      warnings.push(
        "multiple_plausible_anchors"
      );
    }

    if (
      anchorDecision.status ===
      "unresolved"
    ) {
      warnings.push(
        "no_safe_anchor_resolution"
      );
    }

    if (
      resolvedTurn.resolved !==
      true
    ) {
      warnings.push(
        "resolved_turn_unavailable"
      );
    }

    const confidenceParts = [
      detection.confidence,
      familyResolution.confidence,
      anchorDecision.confidence,
      resolvedTurn.resolved
        ? 0.95
        : 0.2
    ];

    const confidence =
      confidenceParts.reduce(
        (
          total,
          value
        ) =>
          total +
          Number(value || 0),
        0
      ) /
      confidenceParts.length;

    return {
      ready:
        detection.detected ===
          true &&
        anchorDecision.status ===
          "resolved" &&
        resolvedTurn.resolved ===
          true,

      healthy:
        warnings.length ===
          0,

      detected:
        detection.detected ===
          true,

      anchorResolved:
        anchorDecision.status ===
          "resolved",

      turnResolved:
        resolvedTurn.resolved ===
          true,

      requiresClarification:
        resolvedTurn
          .requiresClarification ===
          true ||
        anchorDecision
          .requiresClarification ===
          true,

      confidence:
        Number(
          this.normalizeConfidence(
            confidence
          ).toFixed(3)
        ),

      warnings
    };
  },

  /* =====================================================
     CANONICAL RESULT
  ===================================================== */

  buildCanonicalResult({
    currentTurn = {},
    recentExchange = {},
    detection = {},
    familyResolution = {},
    anchorCandidates = [],
    rankedAnchors = [],
    anchorDecision = {},
    inheritedContext = {},
    resolvedTurn = {},
    semanticContext = {},
    continuityContext = {},
    quality = {}
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

      ran:
        true,

      detected:
        detection.detected ===
          true,

      originalText:
        currentTurn.originalText,

      resolvedText:
        resolvedTurn.resolvedText ||
        currentTurn.originalText,

      currentTurnWasResolved:
        resolvedTurn
          .currentTurnWasResolved ===
          true,

      followUpFamily:
        familyResolution.family,

      followUpOperation:
        familyResolution.operation,

      currentTurn,

      recentExchange: {
        available:
          recentExchange.available,

        previousUserTurn:
          recentExchange
            .previousUserTurn,

        previousAssistantTurn:
          recentExchange
            .previousAssistantTurn,

        previousUserText:
          recentExchange
            .previousUserText,

        previousAssistantText:
          recentExchange
            .previousAssistantText
      },

      detection,

      familyResolution,

      anchor: {
        status:
          anchorDecision.status,

        selected:
          anchorDecision.selected,

        confidence:
          anchorDecision.confidence,

        score:
          anchorDecision.score,

        margin:
          anchorDecision.margin,

        reason:
          anchorDecision.reason,

        competingAnchors:
          anchorDecision
            .competingAnchors
      },

      anchorCandidates,

      rankedAnchors,

      inheritedContext,

      inheritedSubject:
        inheritedContext.subject,

      inheritedTarget:
        inheritedContext.target,

      inheritedObject:
        inheritedContext.object,

      inheritedProposition:
        inheritedContext.proposition,

      inheritedEvent:
        inheritedContext.event,

      inheritedOption:
        inheritedContext.option,

      inheritedQuantity:
        inheritedContext.quantity,

      resolvedCurrentTurn:
        resolvedTurn,

      requiresClarification:
        quality
          .requiresClarification ===
          true,

      semanticContext: {
        requestedOperation:
          semanticContext
            .requestedOperation,

        requestedOutput:
          semanticContext
            .requestedOutput,

        unresolvedSlots:
          semanticContext
            .unresolvedSlots,

        ambiguityPresent:
          semanticContext
            .ambiguityPresent,

        originalTarget:
          semanticContext.target,

        originalObject:
          semanticContext
            .targetObject
      },

      continuityContext,

      quality,

      confidence:
        quality.confidence,

      warnings:
        quality.warnings,

      originalTurnPreserved:
        true,

      authority: {
        canDetectEllipticalFollowUp:
          true,

        canResolveOmittedSemanticSlots:
          true,

        canSelectRecentThreadAnchor:
          true,

        canConstructResolvedCurrentTurn:
          true,

        canPreserveOriginalCurrentTurn:
          true,

        canLeaveAmbiguousFollowUpUnresolved:
          true,

        canChooseWhetherContinuityRuns:
          false,

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
          "canonical_elliptical_follow_up_resolution_only"
      }
    };
  },

  buildNotDetectedResult({
    currentTurn = {},
    recentExchange = {},
    detection = {},
    semanticContext = {},
    continuityContext = {}
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

      ran:
        true,

      detected:
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

      currentTurn,

      recentExchange: {
        available:
          recentExchange.available,

        previousUserTurn:
          recentExchange
            .previousUserTurn,

        previousAssistantTurn:
          recentExchange
            .previousAssistantTurn,

        previousUserText:
          recentExchange
            .previousUserText,

        previousAssistantText:
          recentExchange
            .previousAssistantText
      },

      detection,

      familyResolution:
        null,

      anchor: {
        status:
          "not_required",

        selected:
          null,

        confidence:
          1,

        score:
          0,

        margin:
          0,

        reason:
          "Elliptical follow-up resolution was not required.",

        competingAnchors:
          []
      },

      anchorCandidates:
        [],

      rankedAnchors:
        [],

      inheritedContext: {
        inherited:
          false,

        subject:
          null,

        target:
          null,

        object:
          null,

        proposition:
          null,

        event:
          null,

        option:
          null,

        quantity:
          null
      },

      inheritedSubject:
        null,

      inheritedTarget:
        null,

      inheritedObject:
        null,

      inheritedProposition:
        null,

      inheritedEvent:
        null,

      inheritedOption:
        null,

      inheritedQuantity:
        null,

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

        authority:
          "resolved_turn_record_only"
      },

      requiresClarification:
        false,

      semanticContext: {
        requestedOperation:
          semanticContext
            .requestedOperation,

        requestedOutput:
          semanticContext
            .requestedOutput,

        unresolvedSlots:
          semanticContext
            .unresolvedSlots,

        ambiguityPresent:
          semanticContext
            .ambiguityPresent,

        originalTarget:
          semanticContext.target,

        originalObject:
          semanticContext
            .targetObject
      },

      continuityContext,

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
        canDetectEllipticalFollowUp:
          true,

        canResolveOmittedSemanticSlots:
          true,

        canSelectRecentThreadAnchor:
          true,

        canConstructResolvedCurrentTurn:
          true,

        canPreserveOriginalCurrentTurn:
          true,

        canLeaveAmbiguousFollowUpUnresolved:
          true,

        canChooseWhetherContinuityRuns:
          false,

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
          "canonical_elliptical_follow_up_resolution_only"
      }
    };
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

  buildReturnPayload(
    resolution = {}
  ) {
    const resolvedCurrentTurn =
      resolution
        .resolvedCurrentTurn ||
      {};

    return {
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

      resolvedCurrentTurn,

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

      followUpFamily:
        resolution.followUpFamily ||
        null,

      followUpOperation:
        resolution.followUpOperation ||
        null,

      inheritedSubject:
        resolution.inheritedSubject ||
        null,

      inheritedTarget:
        resolution.inheritedTarget ||
        null,

      inheritedObject:
        resolution.inheritedObject ||
        null,

      inheritedProposition:
        resolution
          .inheritedProposition ||
        null,

      inheritedEvent:
        resolution.inheritedEvent ||
        null,

      inheritedOption:
        resolution.inheritedOption ||
        null,

      inheritedQuantity:
        resolution
          .inheritedQuantity ||
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
     TEXT AND MEANING EXTRACTION
  ===================================================== */

  extractChoiceFromText(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    if (!text) {
      return null;
    }

    const patterns = [
      /\b(?:i would|i'd|i will|i'll|i would probably|my choice would be|i choose|i chose|i prefer|my favorite is)\s+(?:choose\s+)?([^.!?]+?)(?:\s+because|\s+since|\s+as\s+my|[.!?]|$)/i,

      /\b(?:the better choice is|the best option is|the answer is|it is|it's)\s+([^.!?]+?)(?:\s+because|\s+since|[.!?]|$)/i
    ];

    for (
      const pattern of patterns
    ) {
      const match =
        text.match(
          pattern
        );

      if (
        match?.[1]
      ) {
        return this.cleanChoice(
          match[1]
        );
      }
    }

    return null;
  },

  cleanChoice(
    value = ""
  ) {
    return this.clean(
      value
    )
      .replace(
        /^(?:the|a|an)\s+/i,
        match =>
          match.toLowerCase()
      )
      .replace(
        /\s+(?:as|because|since)\s+.*$/i,
        ""
      )
      .replace(
        /[.!?]+$/,
        ""
      )
      .trim();
  },

  extractPreferenceSubject(
    question = ""
  ) {
    const text =
      this.normalize(
        question
      );

    if (!text) {
      return null;
    }

    const match =
      text.match(
        /\b(?:your|the)\s+favorite\s+([a-z0-9_-]+(?:\s+[a-z0-9_-]+){0,3})/
      );

    if (
      match?.[1]
    ) {
      return match[1]
        .replace(
          /\b(?:is|are|was|were|do|does|did)\b.*$/,
          ""
        )
        .trim();
    }

    if (
      /\bwhich\s+(?:one|option|choice)\b/
        .test(
          text
        )
    ) {
      return "preferred option";
    }

    return null;
  },

  extractSubjectFromQuestion(
    question = ""
  ) {
    const text =
      this.clean(
        question
      );

    if (!text) {
      return null;
    }

    const favoriteMatch =
      text.match(
        /\byour\s+favorite\s+([^?]+?)(?:\?|$)/i
      );

    if (
      favoriteMatch?.[1]
    ) {
      return `assistant preference about ${this.clean(
        favoriteMatch[1]
      )}`;
    }

    const subjectMatch =
      text.match(
        /^(?:why|how|what|who|where|when|which|is|are|do|does|did|can|could|should|would|will)\s+(?:is|are|was|were|do|does|did|can|could|should|would|will)?\s*(.+?)(?:\?|$)/i
      );

    if (
      subjectMatch?.[1]
    ) {
      return this.clean(
        subjectMatch[1]
      );
    }

    return null;
  },

  extractQuantityFromText(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    const match =
      text.match(
        /\b(?:\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:percent|%|dollars?|hours?|days?|weeks?|months?|years?|miles?|feet|inches?|pounds?|lbs?|kg|kilograms?|degrees?))?)\b/i
      );

    return match?.[0] ||
      null;
  },

  extractSemanticValue(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return this.clean(
        value
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.clean(
        value.value ||
        value.name ||
        value.label ||
        value.surface ||
        value.text ||
        value.claim ||
        value.proposition ||
        value.target ||
        ""
      );
    }

    return this.clean(
      String(value)
    );
  },

  extractNodeText(
    node = {}
  ) {
    return this.clean(
      node.text ||
      node.value ||
      node.label ||
      node.surface ||
      node.name ||
      node.claim ||
      node.proposition ||
      node.event ||
      node.description ||
      ""
    );
  },

  inferAnchorSemanticType(
    text = ""
  ) {
    if (
      this.looksLikeQuantity(
        text
      )
    ) {
      return "quantity";
    }

    if (
      this.looksLikeChoice(
        text
      )
    ) {
      return "option";
    }

    if (
      this.looksLikeClaim(
        text
      )
    ) {
      return "claim";
    }

    return "concept";
  },

  /* =====================================================
     HEURISTICS
  ===================================================== */

  looksLikeClaim(
    value = ""
  ) {
    const text =
      this.normalize(
        value
      );

    return Boolean(
      text &&
      /\b(?:is|are|was|were|will|would|can|could|should|has|have|had|fits|means|causes|requires|includes|works|matters)\b/
        .test(
          text
        )
    );
  },

  looksLikeCompleteClaim(
    value = ""
  ) {
    const text =
      this.normalize(
        value
      );

    const wordCount =
      text
        .split(/\s+/)
        .filter(Boolean)
        .length;

    return (
      wordCount >= 4 &&
      this.looksLikeClaim(
        text
      )
    );
  },

  looksLikeChoice(
    value = ""
  ) {
    return /\b(?:choose|choice|prefer|favorite|best option|better option|i'd|i would|my pick|my choice)\b/i
      .test(
        String(
          value ||
          ""
        )
      );
  },

  looksLikeQuantity(
    value = ""
  ) {
    return /\b\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:%|percent|dollars?|hours?|days?|weeks?|months?|years?|miles?|feet|inches?|pounds?|lbs?|kg|degrees?))?\b/i
      .test(
        String(
          value ||
          ""
        )
      );
  },

  looksLikeRecommendation(
    value = ""
  ) {
    return /\b(?:should|recommend|best option|better choice|next step|i'd suggest|i would suggest|you can|you could|start with)\b/i
      .test(
        String(
          value ||
          ""
        )
      );
  },

  looksLikeOptionQuestion(
    value = ""
  ) {
    return /\b(?:which|option|choice|between|versus|vs|or the|first one|second one|other one)\b/i
      .test(
        String(
          value ||
          ""
        )
      );
  },

  /* =====================================================
     DEDUPLICATION
  ===================================================== */

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
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  },

  dedupeAnchorCandidates(
    candidates = []
  ) {
    const seen =
      new Map();

    this.asArray(
      candidates
    ).forEach(
      candidate => {
        const key =
          [
            candidate.type,
            candidate.sourceTurnId ||
            "none",
            candidate.normalizedText
          ].join("|");

        if (
          !seen.has(key)
        ) {
          seen.set(
            key,
            candidate
          );

          return;
        }

        const existing =
          seen.get(key);

        if (
          candidate.priority >
          existing.priority
        ) {
          seen.set(
            key,
            candidate
          );
        }
      }
    );

    return [
      ...seen.values()
    ];
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

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
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
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
    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value
          .toLowerCase()
          .trim();

      const labels = {
        none:
          0,

        very_low:
          0.2,

        low:
          0.4,

        medium:
          0.65,

        high:
          0.85,

        very_high:
          0.95
      };

      if (
        labels[normalized] !==
        undefined
      ) {
        return labels[normalized];
      }
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
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

  splitSentences(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    if (!text) {
      return [];
    }

    return text
      .split(
        /(?<=[.!?])\s+/
      )
      .map(
        sentence =>
          sentence.trim()
      )
      .filter(Boolean);
  },

  stripTerminalPunctuation(
    value = ""
  ) {
    return this.clean(
      value
    ).replace(
      /[.!?]+$/,
      ""
    );
  },

  lowercaseFirst(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    if (!text) {
      return "";
    }

    return (
      text.charAt(0)
        .toLowerCase() +
      text.slice(1)
    );
  },

  capitalizeFirst(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    if (!text) {
      return "";
    }

    return (
      text.charAt(0)
        .toUpperCase() +
      text.slice(1)
    );
  },

  quoteIfNeeded(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    if (!text) {
      return "";
    }

    if (
      /^["'].*["']$/.test(
        text
      )
    ) {
      return text;
    }

    return `"${text}"`;
  },

  roundScore(
    value = 0
  ) {
    return Number(
      Number(
        value ||
        0
      ).toFixed(3)
    );
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
          item !== null &&
          item !== undefined &&
          item !== ""
      );
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
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
  window.AriEllipticalFollowUpResolver?.version
);