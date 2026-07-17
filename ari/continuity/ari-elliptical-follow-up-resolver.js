// ari/continuity/ari-elliptical-follow-up-resolver.js
// Ari Elliptical Follow-Up Resolver
//
// Purpose:
// Resolve context-dependent follow-up turns whose complete meaning depends
// on an immediately available conversational anchor.
//
// V2.0.0 — Structural Deixis Detection / Opinion Follow-Up Resolution
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
// - Detect omitted subjects, objects, propositions, events, options,
//   quantities, reasons, methods, sources, consequences, and opinions.
// - Detect demonstrative references such as "that", "this", "it",
//   "that one", "the other one", and "what you said".
// - Preserve the original current-turn text exactly.
// - Select the closest compatible recent-thread anchor.
// - Inherit only the minimum context needed to complete the turn.
// - Produce a resolved current-turn question for downstream reasoning.
// - Surface ambiguity instead of inventing an anchor.
// - Publish compatibility fields consumed by the continuity pipeline.
//
// Non-responsibilities:
// - Does not decide whether the continuity stage executes.
// - Does not replace the Semantic Frame Builder.
// - Does not replace the Entity & Reference Resolver.
// - Does not select the conversation function or executive lane.
// - Does not answer the user.
// - Does not change safety severity.
// - Does not retrieve long-term memory.
// - Does not persist thread state.

window.Ari = window.Ari || {};

window.AriEllipticalFollowUpResolver = {
  version: "2.0.0",
  schemaVersion: "2.0.0",

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
        continuityContext,
        currentTurn
      });

    const detection =
      this.detectEllipticalFollowUp({
        currentTurn,
        recentExchange,
        continuityContext,
        semanticContext
      });

    if (
      detection.detected !==
      true
    ) {
      const result =
        this.buildNotDetectedResult({
          currentTurn,
          recentExchange,
          detection,
          semanticContext,
          continuityContext
        });

      this.publishResult(
        result
      );

      return this.buildReturnPayload(
        result
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
        recentExchange,
        semanticContext,
        continuityContext,
        familyResolution
      });

    const rankedAnchors =
      this.rankAnchorCandidates({
        candidates:
          anchorCandidates,

        currentTurn,
        familyResolution,
        recentExchange
      });

    const anchorDecision =
      this.selectAnchor({
        rankedAnchors,
        currentTurn,
        familyResolution
      });

    const inheritedContext =
      this.buildInheritedContext({
        anchorDecision,
        familyResolution,
        recentExchange
      });

    const resolvedTurn =
      this.buildResolvedTurn({
        currentTurn,
        familyResolution,
        anchorDecision,
        inheritedContext,
        recentExchange
      });

    const quality =
      this.buildQuality({
        detection,
        familyResolution,
        anchorDecision,
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
     CURRENT TURN
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
        summary.currentTurnId ||
        semanticContext.turnId ||
        threadContext.currentTurn
          ?.turnId ||
        threadContext.currentTurn
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

      punctuationOnly:
        Boolean(
          originalText
        ) &&
        !/[a-z0-9]/i.test(
          originalText
        ),

      endsWithQuestionMark:
        /\?$/.test(
          originalText
        ),

      beginsWithQuestionWord:
        /^(?:why|how|what|who|where|when|which)\b/
          .test(
            normalizedText
          ),

      demonstratives:
        this.detectDemonstratives(
          normalizedText
        ),

      omittedObjectPressure:
        this.detectOmittedObjectPressure(
          normalizedText
        ),

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

      summary
        .contextAssembler
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
      summary.canonicalMeaning
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
      window.Ari
        ?.semanticStructure ||
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
    continuityContext = {},
    currentTurn = {}
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
            currentTurn
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

    const previousAssistantText =
      this.clean(
        previousAssistantTurn
          ?.text ||
        continuityContext
          .previousAnswerSummary ||
        ""
      );

    const previousUserText =
      this.clean(
        previousUserTurn
          ?.text ||
        ""
      );

    return {
      available:
        Boolean(
          previousAssistantText ||
          previousUserText
        ),

      previousUserTurn:
        previousUserTurn ||
        null,

      previousAssistantTurn:
        previousAssistantTurn ||
        null,

      previousUserText,

      previousAssistantText,

      recentTurns:
        priorTurns,

      priorPairAvailable:
        Boolean(
          previousUserText &&
          previousAssistantText
        ),

      previousAnswerContainsClaim:
        this.looksLikeClaim(
          previousAssistantText
        ),

      previousAnswerContainsChoice:
        this.looksLikeChoice(
          previousAssistantText
        ),

      previousAnswerContainsQuantity:
        this.looksLikeQuantity(
          previousAssistantText
        ),

      previousAnswerContainsRecommendation:
        this.looksLikeRecommendation(
          previousAssistantText
        ),

      previousQuestionContainsOptions:
        this.looksLikeOptionQuestion(
          previousUserText
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
        .semanticSummary
        ?.continuity
        ?.recentMessages,

      summary
        .semanticFrame
        ?.continuity
        ?.recentMessages,

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
              normalized?.text
            ) {
              collected.push(
                normalized
              );
            }
          }
        );
      }
    );

    [
      threadContext
        .immediatePreviousUserTurn,

      threadContext
        .immediatePreviousAssistantTurn
    ]
      .map(
        turn =>
          this.normalizeTurn(
            turn
          )
      )
      .filter(Boolean)
      .forEach(
        turn =>
          collected.push(
            turn
          )
      );

    return this
      .dedupeTurns(
        collected
      )
      .slice(-16);
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

      if (!text) {
        return null;
      }

      return {
        id:
          this.createStableId(
            "turn",
            text
          ),

        role:
          null,

        text,

        createdAt:
          null,

        entities: [],
        events: [],
        claims: [],
        quantities: [],
        options: [],

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
    currentTurn = {}
  } = {}) {
    if (
      currentTurn.turnId &&
      turn.id &&
      String(
        currentTurn.turnId
      ) ===
        String(
          turn.id
        )
    ) {
      return true;
    }

    const currentText =
      this.normalize(
        currentTurn.originalText
      );

    const turnText =
      this.normalize(
        turn.text
      );

    return Boolean(
      currentText &&
      turnText &&
      currentText ===
        turnText
    );
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
        this.asArray(
          turns
        ).length -
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
          turn ===
            assistantTurn ||
          (
            turn.id &&
            assistantTurn.id &&
            turn.id ===
              assistantTurn.id
          )
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
          turns[index]
            ?.role
        ) ===
        "user"
      ) {
        return turns[index];
      }
    }

    return null;
  },

  /* =====================================================
     STRUCTURAL DETECTION
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

    const demonstrativeReference =
      this.detectDemonstratives(
        currentTurn.normalizedText
      );

    const omittedObjectPressure =
      this.detectOmittedObjectPressure(
        currentTurn.normalizedText
      );

    const placeholderSemanticTarget =
      this.semanticTargetIsPlaceholder({
        semanticContext,
        currentTurn
      });

    const missingSemanticSlot =
      semanticContext
        .unresolvedSlots
        .length >
        0 ||
      this.semanticTargetMissing(
        semanticContext
      ) ||
      placeholderSemanticTarget;

    const shortTurn =
      currentTurn.wordCount >
        0 &&
      currentTurn.wordCount <=
        12;

    const veryShortTurn =
      currentTurn.wordCount >
        0 &&
      currentTurn.wordCount <=
        4;

    const continuityEvidence =
      continuityContext
        .requiresPriorContext ||
      continuityContext
        .isContinuation ||
      continuityContext
        .referencesPriorContext ||
      continuityContext
        .contextDependency >=
        0.5 ||
      continuityContext
        .followUpPressure >=
        0.5;

    const priorContextAvailable =
      recentExchange.available ===
        true;

    const explicitPattern =
      Boolean(
        patternMatch
      );

    const genericQuestionWord =
      /^(?:why|how|what|who|where|when|which|really|and|then|so)\b/
        .test(
          currentTurn.normalizedText
        );

    const structuralDependency =
      demonstrativeReference.present ===
        true ||
      omittedObjectPressure ===
        true ||
      missingSemanticSlot ===
        true;

    const likelyEllipsis =
      priorContextAvailable &&
      (
        explicitPattern ||
        (
          shortTurn &&
          structuralDependency
        ) ||
        (
          veryShortTurn &&
          genericQuestionWord
        )
      );

    const fullySpecified =
      this.looksFullySpecified({
        text:
          currentTurn.normalizedText,

        demonstrativeReference,

        placeholderSemanticTarget
      });

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

    if (
      demonstrativeReference
        .present
    ) {
      signals.push(
        "unresolved_demonstrative_reference"
      );
    }

    if (
      omittedObjectPressure
    ) {
      signals.push(
        "predicate_requires_missing_object"
      );
    }

    if (
      placeholderSemanticTarget
    ) {
      signals.push(
        "semantic_target_is_unresolved_placeholder"
      );
    }

    if (
      missingSemanticSlot
    ) {
      signals.push(
        "missing_semantic_slot"
      );
    }

    if (
      continuityEvidence
    ) {
      signals.push(
        "upstream_continuity_evidence"
      );
    }

    if (
      priorContextAvailable
    ) {
      signals.push(
        "prior_exchange_available"
      );
    }

    if (
      fullySpecified
    ) {
      signals.push(
        "current_turn_appears_fully_specified"
      );
    }

    let confidence = 0;

    if (detected) {
      confidence =
        0.48;

      if (
        explicitPattern
      ) {
        confidence +=
          0.2;
      }

      if (
        demonstrativeReference
          .present
      ) {
        confidence +=
          0.14;
      }

      if (
        omittedObjectPressure
      ) {
        confidence +=
          0.08;
      }

      if (
        placeholderSemanticTarget
      ) {
        confidence +=
          0.06;
      }

      if (
        continuityEvidence
      ) {
        confidence +=
          0.04;
      }
    }

    return {
      detected,

      patternMatch,

      shortTurn,

      veryShortTurn,

      demonstrativeReference,

      omittedObjectPressure,

      placeholderSemanticTarget,

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
          ? "The current turn requires a recent conversational referent to complete its meaning."
          : fullySpecified
            ? "The current turn appears semantically complete without inherited context."
            : !priorContextAvailable
              ? "No usable recent exchange was available for elliptical resolution."
              : "The current turn did not contain sufficient structural evidence of ellipsis.",

      authority:
        "elliptical_follow_up_detection_only"
    };
  },

  detectDemonstratives(
    normalizedText = ""
  ) {
    const text =
      this.normalize(
        normalizedText
      );

    const matches = [];

    const patterns = [
      {
        surface:
          "that",

        pattern:
          /\bthat\b/
      },

      {
        surface:
          "this",

        pattern:
          /\bthis\b/
      },

      {
        surface:
          "it",

        pattern:
          /\bit\b/
      },

      {
        surface:
          "that one",

        pattern:
          /\bthat one\b/
      },

      {
        surface:
          "this one",

        pattern:
          /\bthis one\b/
      },

      {
        surface:
          "the other one",

        pattern:
          /\bthe other one\b/
      },

      {
        surface:
          "what you said",

        pattern:
          /\bwhat you said\b/
      },

      {
        surface:
          "your answer",

        pattern:
          /\byour (?:answer|response|point|opinion|recommendation)\b/
      },

      {
        surface:
          "the previous answer",

        pattern:
          /\bthe previous (?:answer|response|message|point)\b/
      }
    ];

    patterns.forEach(
      item => {
        if (
          item.pattern.test(
            text
          )
        ) {
          matches.push(
            item.surface
          );
        }
      }
    );

    return {
      present:
        matches.length >
        0,

      surfaces:
        [
          ...new Set(
            matches
          )
        ],

      primarySurface:
        matches[0] ||
        null
    };
  },

  detectOmittedObjectPressure(
    normalizedText = ""
  ) {
    const text =
      this.normalize(
        normalizedText
      );

    if (!text) {
      return false;
    }

    const patterns = [
      /^(?:what do you think|what do you think about|what do you think of)$/,
      /^(?:how do you feel|how do you feel about)$/,
      /^(?:do you agree|would you agree|you agree)$/,
      /^(?:is that true|is this true|is it true)$/,
      /^(?:why is that|why is this|why is it)$/,
      /^(?:how is that|how is this|how is it)$/,
      /^(?:what does that mean|what does this mean|what does it mean)$/,
      /^(?:what about that|what about this|what about it)$/,
      /^(?:really|seriously|are you sure)$/,
      /^(?:why|how|what|who|where|when|which)$/
    ];

    return patterns.some(
      pattern =>
        pattern.test(
          text
        )
    );
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
          "opinion_about_prior_referent",

        operation:
          "request_opinion",

        pattern:
          /^(?:so\s+)?what\s+do\s+you\s+think(?:\s+(?:about|of))?\s+(?:that|this|it|what\s+you\s+said|your\s+(?:answer|response|point|opinion))$/
      },

      {
        family:
          "opinion_about_prior_referent",

        operation:
          "request_opinion",

        pattern:
          /^(?:so\s+)?what\s+are\s+your\s+thoughts(?:\s+(?:about|on))?\s+(?:that|this|it)$/
      },

      {
        family:
          "emotional_opinion_about_prior_referent",

        operation:
          "request_emotional_opinion",

        pattern:
          /^(?:so\s+)?how\s+do\s+you\s+feel(?:\s+about)?\s+(?:that|this|it)$/
      },

      {
        family:
          "agreement_about_prior_referent",

        operation:
          "request_agreement",

        pattern:
          /^(?:so\s+)?(?:do|would)\s+you\s+agree(?:\s+with)?\s+(?:that|this|it)$/
      },

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
          "causal_explanation",

        operation:
          "request_reason",

        pattern:
          /^why\s+(?:is|was|would|does|did)\s+(?:that|this|it)(?:\s+so)?$/
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
          "method_or_mechanism",

        operation:
          "request_method_or_explanation",

        pattern:
          /^how\s+(?:does|did|would|can|could|is|was)\s+(?:that|this|it)(?:\s+work|\s+happen)?$/
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
          "confirmation",

        operation:
          "request_confirmation",

        pattern:
          /^(?:is|was)\s+(?:that|this|it)\s+(?:true|correct|right)$/
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
          "clarification",

        operation:
          "request_clarification",

        pattern:
          /^what\s+does\s+(?:that|this|it)\s+mean$/
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
          /^(?:so\s+what|why\s+does\s+(?:that|this|it)\s+matter)$/
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
          /^(?:tell\s+me\s+more\s+about|explain|elaborate\s+on)\s+(?:that|this|it)$/
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

    return (
      !targetValue &&
      !objectValue
    );
  },

  semanticTargetIsPlaceholder({
    semanticContext = {},
    currentTurn = {}
  } = {}) {
    const values = [
      this.extractSemanticValue(
        semanticContext.target
      ),

      this.extractSemanticValue(
        semanticContext.targetObject
      ),

      this.extractSemanticValue(
        semanticContext.referent
      )
    ]
      .map(
        value =>
          this.normalize(
            value
          )
      )
      .filter(Boolean);

    if (
      !values.length
    ) {
      return false;
    }

    const currentText =
      currentTurn.normalizedText ||
      "";

    return values.some(
      value =>
        this.isPlaceholderTarget(
          value,
          currentText
        )
    );
  },

  isPlaceholderTarget(
    value = "",
    currentText = ""
  ) {
    const text =
      this.normalize(
        value
      );

    const placeholders = [
      "that",
      "this",
      "it",
      "that one",
      "this one",
      "the other one",
      "think about that",
      "think about this",
      "think about it",
      "what do you think about that",
      "what do you think about this",
      "what do you think about it",
      "feel about that",
      "feel about this",
      "feel about it",
      "information request",
      "previous answer",
      "prior statement",
      "the thing",
      "the topic"
    ];

    if (
      placeholders.includes(
        text
      )
    ) {
      return true;
    }

    if (
      /^(?:think|feel|agree|say|mean)\s+(?:about|with)?\s*(?:that|this|it)$/
        .test(
          text
        )
    ) {
      return true;
    }

    if (
      currentText &&
      text ===
        currentText
    ) {
      return true;
    }

    return false;
  },

  looksFullySpecified({
    text = "",
    demonstrativeReference = {},
    placeholderSemanticTarget = false
  } = {}) {
    const normalizedText =
      this.normalize(
        text
      );

    if (!normalizedText) {
      return false;
    }

    if (
      demonstrativeReference
        .present ||
      placeholderSemanticTarget
    ) {
      return false;
    }

    const words =
      normalizedText
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length <=
      4
    ) {
      return false;
    }

    const explicitNamedObject =
      /\b(?:bible|verse|money|prozac|fluoxetine|big bang theory|car|job|file|code|engine|pipeline|person|place|price|problem|answer|reason|choice|option|plan|idea|symptom|medicine|event|team|game|movie|book|relationship|recommendation)\b/
        .test(
          normalizedText
        );

    const unresolvedPronounEnding =
      /\b(?:that|this|it|one|them|those|these)$/
        .test(
          normalizedText
        );

    if (
      unresolvedPronounEnding
    ) {
      return false;
    }

    return (
      words.length >=
        6 &&
      explicitNamedObject
    );
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
          0.97
      };
    }

    const text =
      currentTurn.normalizedText;

    let family =
      "general_elaboration";

    let operation =
      "request_elaboration";

    if (
      /what\s+do\s+you\s+think|your\s+thoughts/
        .test(
          text
        )
    ) {
      family =
        "opinion_about_prior_referent";

      operation =
        "request_opinion";
    } else if (
      /how\s+do\s+you\s+feel/
        .test(
          text
        )
    ) {
      family =
        "emotional_opinion_about_prior_referent";

      operation =
        "request_emotional_opinion";
    } else if (
      /(?:do|would)\s+you\s+agree/
        .test(
          text
        )
    ) {
      family =
        "agreement_about_prior_referent";

      operation =
        "request_agreement";
    } else if (
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
        .includes(
          "person"
        )
    ) {
      family =
        "person_identification";

      operation =
        "request_person";
    }

    if (
      semanticContext
        .unresolvedSlots
        .includes(
          "location"
        )
    ) {
      family =
        "location_identification";

      operation =
        "request_location";
    }

    if (
      semanticContext
        .unresolvedSlots
        .includes(
          "time"
        )
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
        "structural_family_inference",

      confidence:
        0.8
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
          normalized?.text
        ) {
          candidates.push(
            normalized
          );
        }
      };

    if (
      recentExchange
        .previousAssistantText
    ) {
      add({
        type:
          "previous_assistant_proposition",

        semanticType:
          "proposition",

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
          100,

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

    this.asArray(
      recentExchange
        .previousAssistantTurn
        ?.claims
    ).forEach(
      claim => {
        add({
          type:
            "previous_assistant_claim",

          semanticType:
            "claim",

          text:
            this.extractNodeText(
              claim
            ),

          role:
            "assistant",

          sourceTurnId:
            recentExchange
              .previousAssistantTurn
              ?.id,

          turnDistance:
            1,

          priority:
            104,

          raw:
            claim
        });
      }
    );

    this.asArray(
      recentExchange
        .previousAssistantTurn
        ?.events
    ).forEach(
      event => {
        add({
          type:
            "previous_assistant_event",

          semanticType:
            "event",

          text:
            this.extractNodeText(
              event
            ),

          role:
            "assistant",

          sourceTurnId:
            recentExchange
              .previousAssistantTurn
              ?.id,

          turnDistance:
            1,

          priority:
            96,

          raw:
            event
        });
      }
    );

    this.asArray(
      recentExchange
        .previousAssistantTurn
        ?.quantities
    ).forEach(
      quantity => {
        add({
          type:
            "previous_assistant_quantity",

          semanticType:
            "quantity",

          text:
            this.extractNodeText(
              quantity
            ),

          role:
            "assistant",

          sourceTurnId:
            recentExchange
              .previousAssistantTurn
              ?.id,

          turnDistance:
            1,

          priority:
            98,

          raw:
            quantity
        });
      }
    );

    if (
      recentExchange
        .previousUserText
    ) {
      add({
        type:
          "previous_user_request",

        semanticType:
          "request",

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
          72,

        metadata: {
          containsOptions:
            recentExchange
              .previousQuestionContainsOptions
        }
      });
    }

    this.asArray(
      recentExchange
        .previousUserTurn
        ?.options
    ).forEach(
      option => {
        add({
          type:
            "previous_user_option",

          semanticType:
            "option",

          text:
            this.extractNodeText(
              option
            ),

          role:
            "user",

          sourceTurnId:
            recentExchange
              .previousUserTurn
              ?.id,

          turnDistance:
            2,

          priority:
            92,

          raw:
            option
        });
      }
    );

    const semanticTarget =
      this.extractSemanticValue(
        semanticContext.target
      );

    if (
      semanticTarget &&
      !this.isPlaceholderTarget(
        semanticTarget
      )
    ) {
      add({
        type:
          "current_semantic_target",

        semanticType:
          semanticContext.target
            ?.type ||
          "concept",

        text:
          semanticTarget,

        role:
          "current_turn",

        turnDistance:
          0,

        priority:
          55,

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
        semanticTarget &&
      !this.isPlaceholderTarget(
        semanticObject
      )
    ) {
      add({
        type:
          "current_semantic_object",

        semanticType:
          semanticContext
            .targetObject
            ?.type ||
          "concept",

        text:
          semanticObject,

        role:
          "current_turn",

        turnDistance:
          0,

        priority:
          54,

        raw:
          semanticContext
            .targetObject
      });
    }

    const continuityAnchor =
      this.extractSemanticValue(
        continuityContext.anchor
      );

    if (
      continuityAnchor &&
      !this.isPlaceholderTarget(
        continuityAnchor
      )
    ) {
      add({
        type:
          "continuity_anchor",

        semanticType:
          "continuity_anchor",

        text:
          continuityAnchor,

        role:
          "continuity",

        turnDistance:
          1,

        priority:
          continuityContext
            .anchorResolved
            ? 102
            : 68,

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

      thinPenalty:
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

    if (
      distance === 0
    ) {
      return 4;
    }

    if (
      distance === 1
    ) {
      return 22;
    }

    if (
      distance === 2
    ) {
      return 11;
    }

    return Math.max(
      -10,
      7 -
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

    const assistantPreferred = [
      "opinion_about_prior_referent",
      "emotional_opinion_about_prior_referent",
      "agreement_about_prior_referent",
      "causal_explanation",
      "negative_causal_explanation",
      "confirmation",
      "evidence",
      "source",
      "significance",
      "clarification",
      "method_or_mechanism",
      "continuation",
      "demonstrative_follow_up",
      "general_elaboration"
    ];

    if (
      assistantPreferred.includes(
        family
      ) &&
      candidate.role ===
        "assistant"
    ) {
      return 26;
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
        candidate.semanticType ===
        "option"
      ) {
        return 22;
      }

      if (
        candidate.role ===
        "user"
      ) {
        return 12;
      }
    }

    return 3;
  },

  scoreAnchorSemanticCompatibility({
    candidate = {},
    familyResolution = {}
  } = {}) {
    const family =
      familyResolution.family;

    const type =
      candidate.semanticType;

    const acceptedTypes = {
      opinion_about_prior_referent: [
        "proposition",
        "claim",
        "event",
        "concept"
      ],

      emotional_opinion_about_prior_referent: [
        "proposition",
        "claim",
        "event",
        "concept"
      ],

      agreement_about_prior_referent: [
        "proposition",
        "claim"
      ],

      causal_explanation: [
        "proposition",
        "claim",
        "event",
        "concept"
      ],

      negative_causal_explanation: [
        "proposition",
        "claim",
        "event",
        "option"
      ],

      method_or_mechanism: [
        "event",
        "claim",
        "proposition",
        "concept"
      ],

      confirmation: [
        "claim",
        "proposition",
        "event"
      ],

      clarification: [
        "claim",
        "proposition",
        "concept"
      ],

      evidence: [
        "claim",
        "proposition",
        "recommendation"
      ],

      source: [
        "claim",
        "proposition"
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
        "request"
      ],

      consequence_or_next_step: [
        "event",
        "claim",
        "plan",
        "proposition"
      ],

      continuation: [
        "proposition",
        "claim",
        "event"
      ],

      demonstrative_follow_up: [
        "proposition",
        "claim",
        "event",
        "concept"
      ],

      general_elaboration: [
        "proposition",
        "claim",
        "event",
        "concept"
      ]
    };

    const accepted =
      acceptedTypes[
        family
      ] ||
      [];

    if (
      accepted.includes(
        type
      )
    ) {
      return 28;
    }

    if (
      candidate.type ===
      "previous_assistant_proposition"
    ) {
      return 18;
    }

    if (
      candidate.type ===
      "previous_user_request"
    ) {
      return 7;
    }

    return 1;
  },

  scoreAnchorLexicalCompatibility({
    candidate = {},
    currentTurn = {}
  } = {}) {
    const currentText =
      currentTurn.normalizedText;

    let score = 0;

    if (
      currentTurn
        .demonstratives
        ?.present &&
      candidate.role ===
        "assistant"
    ) {
      score += 14;
    }

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
      /\b(?:that|this)\s+one\b/
        .test(
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
          candidate.text
        )
      )
    ) {
      score += 22;
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
      [
        "opinion_about_prior_referent",
        "emotional_opinion_about_prior_referent",
        "agreement_about_prior_referent"
      ].includes(
        familyResolution.family
      ) &&
      candidate.role ===
        "assistant"
    ) {
      score += 24;
    }

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

    if (
      words <= 1
    ) {
      return -20;
    }

    if (
      words <= 3
    ) {
      return -7;
    }

    if (
      this.isPlaceholderTarget(
        candidate.normalizedText
      )
    ) {
      return -50;
    }

    return 0;
  },

  /* =====================================================
     ANCHOR SELECTION
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
          "No usable recent conversational anchor was available.",

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
      score <
      threshold
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
          `The strongest anchor score ${score} did not meet the threshold ${threshold}.`,

        competingAnchors:
          rankedAnchors
            .slice(
              0,
              3
            )
      };
    }

    if (
      second &&
      margin <
        requiredMargin &&
      !this.sameUnderlyingTurn(
        best,
        second
      )
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
          `The leading anchors were too close. Required margin: ${requiredMargin}; observed margin: ${margin}.`,

        competingAnchors:
          rankedAnchors
            .slice(
              0,
              3
            )
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
          .slice(
            1,
            4
          )
    };
  },

  sameUnderlyingTurn(
    first = {},
    second = {}
  ) {
    return Boolean(
      first.sourceTurnId &&
      second.sourceTurnId &&
      first.sourceTurnId ===
        second.sourceTurnId
    );
  },

  anchorThreshold({
    currentTurn = {},
    familyResolution = {}
  } = {}) {
    if (
      [
        "opinion_about_prior_referent",
        "emotional_opinion_about_prior_referent",
        "agreement_about_prior_referent"
      ].includes(
        familyResolution.family
      )
    ) {
      return 90;
    }

    if (
      currentTurn.wordCount <=
      1
    ) {
      return 94;
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
        0.42,
        Number(
          score ||
          0
        ) /
          300
      ) +
      Math.min(
        0.14,
        Number(
          margin ||
          0
        ) /
          100
      );

    return Number(
      Math.max(
        0,
        Math.min(
          0.98,
          value
        )
      ).toFixed(
        3
      )
    );
  },

  /* =====================================================
     INHERITED CONTEXT
  ===================================================== */

  buildInheritedContext({
    anchorDecision = {},
    familyResolution = {},
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

    const anchorText =
      this.clean(
        selected.text
      );

    const family =
      familyResolution.family;

    const extractedChoice =
      this.extractChoiceFromText(
        anchorText
      );

    const extractedQuantity =
      this.extractQuantityFromText(
        anchorText
      );

    const propositionFamilies = [
      "opinion_about_prior_referent",
      "emotional_opinion_about_prior_referent",
      "agreement_about_prior_referent",
      "causal_explanation",
      "negative_causal_explanation",
      "confirmation",
      "clarification",
      "evidence",
      "source",
      "significance",
      "continuation",
      "demonstrative_follow_up",
      "general_elaboration"
    ];

    return {
      inherited:
        true,

      subject:
        this.extractSubjectFromQuestion(
          recentExchange
            .previousUserText
        ) ||
        null,

      target:
        extractedChoice ||
        anchorText,

      object:
        extractedChoice ||
        anchorText,

      proposition:
        propositionFamilies.includes(
          family
        )
          ? anchorText
          : null,

      event:
        [
          "method_or_mechanism",
          "consequence_or_next_step"
        ].includes(
          family
        )
          ? anchorText
          : null,

      option:
        [
          "selection",
          "selection_reference",
          "alternative_or_comparison"
        ].includes(
          family
        )
          ? extractedChoice ||
            anchorText
          : null,

      quantity:
        [
          "quantity_or_degree",
          "severity",
          "probability"
        ].includes(
          family
        )
          ? extractedQuantity
          : null,

      sourceTurnId:
        selected.sourceTurnId,

      sourceRole:
        selected.role,

      anchorType:
        selected.type,

      anchorText,

      minimumNecessaryContextOnly:
        true,

      reason:
        "Inherited only the recent-thread content required to complete the current request.",

      authority:
        "elliptical_slot_inheritance_only"
    };
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

        text:
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
      Boolean(
        resolvedText
      ) &&
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

      referenceType:
        "elliptical_or_deictic_reference",

      referenceSurface:
        currentTurn
          .demonstratives
          ?.primarySurface ||
        null,

      referenceResolved:
        true,

      resolvedReferenceValue:
        inheritedContext.anchorText ||
        inheritedContext.target ||
        null,

      resolvedReferenceSourceTurnId:
        inheritedContext.sourceTurnId ||
        null,

      requiresClarification:
        !resolvedText,

      resolutionReason:
        resolvedText
          ? "The omitted referent was reconstructed from the selected recent-thread anchor."
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
    const family =
      familyResolution.family;

    const fullAnchor =
      this.clean(
        inheritedContext
          .anchorText ||
        inheritedContext
          .proposition ||
        inheritedContext.target ||
        anchor.text ||
        ""
      );

    const conciseAnchor =
      this.buildConciseAnchorDescription({
        target:
          fullAnchor,

        previousQuestion:
          recentExchange
            .previousUserText,

        previousAnswer:
          recentExchange
            .previousAssistantText,

        family
      });

    switch (family) {
      case "opinion_about_prior_referent":
        return conciseAnchor
          ? `What do you think about this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What do you think about the previous answer?";

      case "emotional_opinion_about_prior_referent":
        return conciseAnchor
          ? `How do you feel about this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "How do you feel about the previous answer?";

      case "agreement_about_prior_referent":
        return conciseAnchor
          ? `Do you agree with this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Do you agree with the previous answer?";

      case "causal_explanation":
        return conciseAnchor
          ? `Why is this prior statement true or appropriate: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Why did you give the previous answer?";

      case "negative_causal_explanation":
        return conciseAnchor
          ? `Why would the opposite of this prior statement be preferable: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Why not?";

      case "method_or_mechanism":
        return conciseAnchor
          ? `How does the subject described in this prior statement work or happen: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "How does the subject of the previous answer work?";

      case "confirmation":
        return conciseAnchor
          ? `Is this prior statement really correct: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Is the previous answer really correct?";

      case "clarification":
        return conciseAnchor
          ? `What do you mean by this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What do you mean by the previous answer?";

      case "person_identification":
        return conciseAnchor
          ? `Who is the person referred to in this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Who are you referring to in the previous answer?";

      case "location_identification":
        return conciseAnchor
          ? `Where does the subject of this prior statement occur or apply: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Where does the previous answer apply?";

      case "time_identification":
        return conciseAnchor
          ? `When does the subject of this prior statement occur or apply: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "When does the previous answer apply?";

      case "selection":
        return "Which option from the previous discussion is the better choice?";

      case "selection_reference":
        return conciseAnchor
          ? `Why or how does the referenced option relate to this prior discussion: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Why or how does that option relate to the previous discussion?";

      case "alternative_or_comparison":
        return this.renderAlternativeResolution({
          original:
            currentTurn.originalText,

          recentExchange,

          conciseTarget:
            conciseAnchor
        });

      case "quantity_or_degree":
        return conciseAnchor
          ? `What is the relevant amount or degree associated with this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What is the relevant amount or degree from the previous answer?";

      case "severity":
        return conciseAnchor
          ? `How serious is the situation described in this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "How serious is the situation described in the previous answer?";

      case "probability":
        return conciseAnchor
          ? `How likely is the outcome described in this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "How likely is the outcome described in the previous answer?";

      case "evidence":
        return conciseAnchor
          ? `What evidence supports this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What evidence supports the previous answer?";

      case "source":
        return conciseAnchor
          ? `What source supports this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What is the source for the previous answer?";

      case "significance":
        return conciseAnchor
          ? `Why does this prior statement matter: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Why does the previous answer matter?";

      case "consequence_or_next_step":
        return conciseAnchor
          ? `What happens next based on this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "What should happen next based on the previous answer?";

      case "continuation":
        return conciseAnchor
          ? `Continue explaining this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}.`
          : "Continue the previous explanation.";

      case "demonstrative_follow_up":
      case "general_elaboration":
      default:
        return conciseAnchor
          ? `Can you elaborate on this prior statement: ${this.quoteIfNeeded(
              conciseAnchor
            )}?`
          : "Can you elaborate on the previous answer?";
    }
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
      return "How does the alternative option compare with the option just discussed?";
    }

    return conciseTarget
      ? `What about an alternative to this prior statement: ${this.quoteIfNeeded(
          conciseTarget
        )}?`
      : "What about the alternative from the previous discussion?";
  },

  buildConciseAnchorDescription({
    target = "",
    previousAnswer = ""
  } = {}) {
    const cleanedTarget =
      this.clean(
        target ||
        previousAnswer
      );

    if (!cleanedTarget) {
      return "";
    }

    const sentences =
      this.splitSentences(
        cleanedTarget
      );

    const firstSentence =
      sentences[0] ||
      cleanedTarget;

    if (
      firstSentence.length <=
      240
    ) {
      return this.stripTerminalPunctuation(
        firstSentence
      );
    }

    return this.stripTerminalPunctuation(
      firstSentence.slice(
        0,
        237
      ) +
        "..."
    );
  },

  /* =====================================================
     QUALITY AND RESULTS
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
        ? 0.96
        : 0.15
    ];

    const confidence =
      confidenceParts.reduce(
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
          ).toFixed(
            3
          )
        ),

      warnings
    };
  },

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

      referenceType:
        resolvedTurn.referenceType ||
        (
          detection
            .demonstrativeReference
            ?.present
            ? "deictic_reference"
            : "elliptical_reference"
        ),

      referenceSurface:
        resolvedTurn.referenceSurface ||
        detection
          .demonstrativeReference
          ?.primarySurface ||
        null,

      referenceResolved:
        resolvedTurn.referenceResolved ===
          true,

      resolvedReferenceValue:
        resolvedTurn
          .resolvedReferenceValue ||
        null,

      resolvedReferenceSourceTurnId:
        resolvedTurn
          .resolvedReferenceSourceTurnId ||
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

        canResolveDemonstrativeReferences:
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

        canResolveDemonstrativeReferences:
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
     RETURN AND PUBLICATION
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
     EXTRACTION AND HEURISTICS
  ===================================================== */

  extractChoiceFromText(
    value = ""
  ) {
    const text =
      this.clean(
        value
      );

    const patterns = [
      /\b(?:i would|i'd|i will|i'll|my choice would be|i choose|i chose|i prefer|my favorite is)\s+(?:choose\s+)?([^.!?]+?)(?:\s+because|\s+since|[.!?]|$)/i,

      /\b(?:the better choice is|the best option is|the answer is|it is|it's)\s+([^.!?]+?)(?:\s+because|\s+since|[.!?]|$)/i
    ];

    for (
      const pattern
      of patterns
    ) {
      const match =
        text.match(
          pattern
        );

      if (
        match?.[1]
      ) {
        return this.clean(
          match[1]
        )
          .replace(
            /[.!?]+$/,
            ""
          )
          .trim();
      }
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

    return null;
  },

  extractQuantityFromText(
    value = ""
  ) {
    const match =
      this.clean(
        value
      ).match(
        /\b\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:percent|%|dollars?|hours?|days?|weeks?|months?|years?|miles?|feet|inches?|pounds?|lbs?|kg|kilograms?|degrees?))?\b/i
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
      return String(
        value
      );
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
      String(
        value
      )
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

  looksLikeClaim(
    value = ""
  ) {
    const text =
      this.normalize(
        value
      );

    return Boolean(
      text &&
      /\b(?:is|are|was|were|will|would|can|could|should|has|have|had|fits|means|causes|requires|includes|works|matters|states|emphasizes)\b/
        .test(
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

        const existing =
          seen.get(
            key
          );

        if (
          !existing ||
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
        none: 0,
        very_low: 0.2,
        low: 0.4,
        medium: 0.65,
        high: 0.85,
        very_high: 0.95
      };

      if (
        labels[
          normalized
        ] !==
        undefined
      ) {
        return labels[
          normalized
        ];
      }
    }

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
      number > 1
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
      .filter(
        Boolean
      );
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
      ).toFixed(
        3
      )
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
  window.AriEllipticalFollowUpResolver
    ?.version
);