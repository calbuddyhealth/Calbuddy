// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
//
// Purpose:
//   Select the context-access lane required for the current turn.
//
// Responsibilities:
//   - Read the canonical Conversation Intent Packet.
//   - Decide whether the current turn can stand alone.
//   - Decide whether thread, memory, correction, or relationship
//     context must be loaded.
//   - Report missing required context.
//   - Preserve routing evidence for diagnostics.
//   - Provide one normalized executive-routing handoff.
//
// Non-responsibilities:
//   - Does not reinterpret raw user language.
//   - Does not classify semantic intent.
//   - Does not classify medical, emotional, developer, or knowledge domains.
//   - Does not determine response priority.
//   - Does not perform triage.
//   - Does not select a planner.
//   - Does not determine safety severity.
//   - Does not compose or answer the user.
//
// V3.0.1 — Structured Reference Continuity Guard

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "3.0.1",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  split(input = {}) {
    const summary =
      this.unwrapSummary(input);

    const packetSource =
      this.readConversationIntentPacket(
        summary,
        input
      );

    const packet =
      packetSource.packet;

    const availableContext =
      this.readAvailableContext(summary);

    const routingContext =
      packetSource.available
        ? this.buildCanonicalRoutingContext({
            packet,
            availableContext
          })
        : this.buildLegacyRoutingContext({
            summary,
            input,
            availableContext
          });

    const scores =
      this.scoreLanes(
        routingContext
      );

    const ranked =
      this.rankScores(scores);

    const lane =
      this.chooseLane({
        ranked,
        context:
          routingContext
      });

    const routing =
      this.buildRoutingInstructions({
        lane,
        context:
          routingContext
      });

    const confidence =
      this.calculateConfidence({
        lane,
        ranked,
        context:
          routingContext,
        packetSource
      });

    const explanation =
      this.explain({
        lane,
        context:
          routingContext
      });

    const handoff =
      this.buildHandoff({
        lane,
        routing,
        routingContext,
        confidence,
        explanation,
        packetSource
      });

    return {
      laneSplitterRan:
        true,

      laneSplitterVersion:
        this.version,

      laneSplitterSource:
        "ari-lane-splitter-engine",

      engine:
        "ari-lane-splitter-engine",

      version:
        this.version,

      source:
        "ari-lane-splitter-engine",

      lane,

      contextLane:
        lane,

      routing,

      scores,

      ranked,

      confidence:
        confidence.label,

      confidenceScore:
        confidence.score,

      confidenceNormalized:
        confidence.normalized,

      confidenceBreakdown:
        confidence.breakdown,

      explanation,

      conversationIntentPacketAvailable:
        packetSource.available,

      canonicalPacketUsed:
        packetSource.available,

      canonicalPacketSource:
        packetSource.source,

      canonicalPacketVersion:
        packetSource.version,

      legacyFallbackUsed:
        packetSource.available !== true,

      lexicalFallbackUsed:
        false,

      rawTextInterpretationUsed:
        false,

      routingContext,

      evidenceUsed: {
        conversationIntentPacket:
          packetSource.available
            ? packet
            : null,

        continuity:
          routingContext.continuity,

        ambiguity:
          routingContext.ambiguity,

        governance:
          routingContext.governance,

        readiness:
          routingContext.readiness,

        semanticIntent:
          routingContext.semanticIntent,

        conversationPurpose:
          routingContext
            .conversationPurpose,

        availableContext
      },

      handoff,

      authority: {
        canReadCanonicalIntentPacket:
          true,

        canChooseContextLane:
          true,

        canChooseContextSources:
          true,

        canReportMissingContext:
          true,

        canInterpretRawLanguage:
          false,

        canReclassifySemanticIntent:
          false,

        canReclassifyConversationFunction:
          false,

        canChooseMedicalLane:
          false,

        canChooseEmotionalLane:
          false,

        canChooseDeveloperLane:
          false,

        canChooseKnowledgeLane:
          false,

        canPerformTriage:
          false,

        canChoosePlanner:
          false,

        canDetermineSafetySeverity:
          false,

        canComposeResponse:
          false,

        canAnswerUser:
          false,

        role:
          "context_source_route_selection_only"
      }
    };
  },

  /* =====================================================
     CANONICAL PACKET READING
  ===================================================== */

  readConversationIntentPacket(
    summary = {},
    input = {}
  ) {
    const candidates = [
      input.conversationIntentPacket,

      input.unifiedIntentPacket,

      input.reconciledIntentPacket,

      input.perceptionPacket
        ?.conversationIntentPacket,

      input.perceptionPacket
        ?.unifiedIntentPacket,

      summary.conversationIntentPacket,

      summary.unifiedIntentPacket,

      summary.reconciledIntentPacket,

      summary.perceptionPacket
        ?.conversationIntentPacket,

      summary.perceptionPacket
        ?.unifiedIntentPacket,

      summary.perceptionReconciliation
        ?.conversationIntentPacket,

      summary.perceptionReconciliation
        ?.unifiedIntentPacket,

      summary.perceptionReconciliationResult
        ?.conversationIntentPacket,

      summary.perceptionReconciliationResult
        ?.unifiedIntentPacket
    ];

    const packet =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate) &&
        (
          candidate.packetType ===
            "conversation_intent_packet" ||
          candidate.semanticIntent ||
          candidate.conversationPurpose ||
          candidate.readiness
        )
      ) ||
      null;

    if (!packet) {
      return {
        available:
          false,

        packet:
          null,

        source:
          "legacy_structured_fallback",

        version:
          null
      };
    }

    return {
      available:
        true,

      packet,

      source:
        packet.source ||
        "conversation_intent_packet",

      version:
        packet.version ||
        null
    };
  },

  /* =====================================================
     AVAILABLE CONTEXT
  ===================================================== */

  readAvailableContext(
    summary = {}
  ) {
    const threadState =
      summary.threadState ||
      {};

    const recentMessages =
      this.firstNonEmptyArray(
        summary.recentMessages,
        threadState.lastMessages
      );

    const threadAvailable =
      Boolean(
        summary.threadStateLoaded ===
          true ||
        recentMessages.length > 0 ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.continuitySummary ||
        threadState.previousAnswerSummary ||
        summary.workingContext
      );

    const memoryAvailable =
      Boolean(
        summary.memoryRetrievalRan ===
          true ||
        summary.memoryContext ||
        summary.retrievedMemories
          ?.length ||
        summary.memoryResults
          ?.length
      );

    const relationshipContextAvailable =
      Boolean(
        summary.relationshipContext ||
        summary.relationshipState ||
        summary.relationshipMemory ||
        summary.relationshipContinuity
      );

    return {
      threadAvailable,

      memoryAvailable,

      relationshipContextAvailable,

      recentMessageCount:
        recentMessages.length,

      activeSubjectAvailable:
        Boolean(
          threadState.activeSubject ||
          summary.resolvedPrimarySubject
        ),

      currentTopicAvailable:
        Boolean(
          threadState.currentTopic ||
          summary.activeTopic
        ),

      previousAnswerAvailable:
        Boolean(
          threadState.previousAnswerSummary ||
          threadState.lastFinalResponse ||
          summary.previousAnswerSummary
        ),

      threadStateLoaded:
        summary.threadStateLoaded ===
        true,

      authority:
        "context_availability_report_only"
    };
  },

  /* =====================================================
     CANONICAL ROUTING CONTEXT
  ===================================================== */

  buildCanonicalRoutingContext({
    packet = {},
    availableContext = {}
  } = {}) {
    const semanticIntent =
      packet.semanticIntent ||
      {};

    const conversationPurpose =
      packet.conversationPurpose ||
      {};

    const supportingPurposes =
      Array.isArray(
        packet.supportingPurposes
      )
        ? packet.supportingPurposes
        : [];

    const continuity =
      packet.continuity ||
      {};

    const ambiguity =
      packet.ambiguity ||
      {};

    const governance =
      packet.governance ||
      {};

    const readiness =
      packet.readiness ||
      {};

    const responseRequirements =
      packet.responseRequirements ||
      {};

    const operation =
      this.normalizeIdentifier(
        semanticIntent
          .requestedOperation
      );

    const purpose =
      this.normalizeIdentifier(
        conversationPurpose.name
      );

    const supportingNames =
      supportingPurposes
        .map(item =>
          this.normalizeIdentifier(
            item?.name
          )
        )
        .filter(Boolean);

    /*
     * Structured continuity guard.
     *
     * The lane splitter still does not inspect or reinterpret raw text.
     * It only honors structured reference evidence already supplied by
     * the canonical Conversation Intent Packet.
     */

    const referencePresent =
      continuity.referencePresent ===
        true;

    const referenceResolved =
      continuity.referenceResolved ===
        true;

    const unresolvedReference =
      referencePresent &&
      !referenceResolved;

    const missingAnchor =
      ambiguity.missingAnchor ===
        true ||
      continuity.missingAnchor ===
        true;

    const requiresPriorContext =
      continuity.requiresPriorContext ===
        true ||
      responseRequirements
        .priorContextRequired ===
        true ||
      unresolvedReference;

    const packetPriorContextAvailable =
      continuity.priorContextAvailable ===
        true;

    const priorContextAvailable =
      packetPriorContextAvailable ||
      availableContext.threadAvailable ===
        true;

    const missingPriorContext =
      requiresPriorContext &&
      !priorContextAvailable;

    const isContinuation =
      continuity.isContinuation ===
        true;

    const referencesPriorArtifact =
      continuity.referencesPriorArtifact ===
        true;

    const referencesPriorQuestion =
      continuity.referencesPriorQuestion ===
        true;

    const clarificationRequired =
      ambiguity.requiresClarification ===
        true ||
      readiness.clarificationRequired ===
        true;

    const recallRequested =
      this.matchesAnyIdentifier(
        [
          operation,
          purpose,
          ...supportingNames
        ],
        [
          "retrieve_prior_context",
          "recall",
          "memory_recall",
          "recall_request",
          "retrieve_memory",
          "remember_previous"
        ]
      );

    const correctionRequested =
      this.matchesAnyIdentifier(
        [
          operation,
          purpose,
          ...supportingNames
        ],
        [
          "correct",
          "correction",
          "revise",
          "revision",
          "repair_previous_answer",
          "correct_previous_answer",
          "modify_previous_response"
        ]
      );

    const relationshipContinuityRequested =
      this.matchesAnyIdentifier(
        [
          operation,
          purpose,
          ...supportingNames
        ],
        [
          "relationship_continuity",
          "relational_follow_up",
          "relationship_follow_up",
          "continue_relationship_context"
        ]
      );

    const currentTurnMeaningAvailable =
      semanticIntent.available ===
        true ||
      Boolean(
        semanticIntent
          .requestedOperation ||
        semanticIntent.userGoal ||
        conversationPurpose.name
      );

    const packetUsable =
      readiness.packetUsable !==
        false &&
      currentTurnMeaningAvailable;

    const directCurrentTurnEligible =
      packetUsable &&
      !requiresPriorContext &&
      !isContinuation &&
      !unresolvedReference &&
      !missingAnchor &&
      !recallRequested &&
      !correctionRequested &&
      !relationshipContinuityRequested;

    return {
      source:
        "conversation_intent_packet",

      canonical:
        true,

      packetUsable,

      semanticIntent,

      conversationPurpose,

      supportingPurposes,

      continuity,

      ambiguity,

      governance,

      readiness,

      responseRequirements,

      availableContext,

      operation:
        operation ||
        null,

      purpose:
        purpose ||
        null,

      supportingPurposeNames:
        supportingNames,

      currentTurnMeaningAvailable,

      referencePresent,

      referenceResolved,

      unresolvedReference,

      requiresPriorContext,

      priorContextAvailable,

      missingPriorContext,

      isContinuation,

      referencesPriorArtifact,

      referencesPriorQuestion,

      clarificationRequired,

      missingAnchor,

      recallRequested,

      correctionRequested,

      relationshipContinuityRequested,

      directCurrentTurnEligible,

      responseOrder:
        governance.responseOrder ||
        "normal",

      routingBlocked:
        readiness.packetUsable ===
          false,

      rawTextUsed:
        false,

      lexicalInferenceUsed:
        false,

      authority:
        "canonical_packet_context_routing"
    };
  },

  /* =====================================================
     LEGACY STRUCTURED FALLBACK
  ===================================================== */

  buildLegacyRoutingContext({
    summary = {},
    input = {},
    availableContext = {}
  } = {}) {
    const semanticFrame =
      this.firstNonEmptyObject(
        input.semanticFrame,
        summary.semanticFrameOutput,
        summary.semanticFrameResult,
        summary.semanticFrameBuilderResult,
        summary.semanticFrame
      );

    const canonicalMeaning =
      this.firstNonEmptyObject(
        semanticFrame.canonicalMeaning,
        summary.canonicalMeaning
      );

    const continuity =
      this.firstNonEmptyObject(
        semanticFrame.continuity,
        canonicalMeaning.continuity,
        summary.semanticContinuity
      );

    const ambiguity =
      this.firstNonEmptyObject(
        semanticFrame.ambiguity,
        canonicalMeaning.ambiguity,
        summary.semanticAmbiguity
      );

    const responseRequirements =
      this.firstNonEmptyObject(
        semanticFrame.responseRequirements,
        semanticFrame.responseCharacteristics,
        canonicalMeaning
          .responseRequirements,
        summary
          .semanticResponseCharacteristics
      );

    const conversationFunction =
      this.firstNonEmptyObject(
        summary.conversationFunctionResult,
        summary.conversationFunction
      );

    const operation =
      this.normalizeIdentifier(
        canonicalMeaning
          .requestedOperation ||
        semanticFrame.primaryFrame
          ?.operation ||
        semanticFrame.normalizedFrame
          ?.operation
      );

    const purpose =
      this.normalizeIdentifier(
        conversationFunction
          .primaryFunction
      );

    const referencePresent =
      continuity.referencePresent ===
        true;

    const referenceResolved =
      continuity.referenceResolved ===
        true;

    const unresolvedReference =
      referencePresent &&
      !referenceResolved;

    const missingAnchor =
      ambiguity.missingAnchor ===
        true ||
      continuity.missingAnchor ===
        true;

    const requiresPriorContext =
      continuity.requiresPriorContext ===
        true ||
      responseRequirements
        .priorContextRequired ===
        true ||
      unresolvedReference;

    const priorContextAvailable =
      continuity.priorContextAvailable ===
        true ||
      continuity.threadAvailable ===
        true ||
      availableContext.threadAvailable ===
        true;

    const missingPriorContext =
      requiresPriorContext &&
      !priorContextAvailable;

    const isContinuation =
      continuity.isContinuation ===
        true;

    const recallRequested =
      this.matchesAnyIdentifier(
        [operation, purpose],
        [
          "retrieve_prior_context",
          "recall",
          "memory_recall",
          "recall_request"
        ]
      );

    const correctionRequested =
      this.matchesAnyIdentifier(
        [operation, purpose],
        [
          "correct",
          "correction",
          "revise",
          "revision"
        ]
      );

    const relationshipContinuityRequested =
      this.matchesAnyIdentifier(
        [operation, purpose],
        [
          "relationship_continuity",
          "relationship_follow_up"
        ]
      );

    const currentTurnMeaningAvailable =
      Boolean(
        operation ||
        purpose ||
        semanticFrame.primaryFrame
          ?.frameType ||
        semanticFrame.semanticSummary
          ?.primaryMeaning
      );

    return {
      source:
        "legacy_structured_fallback",

      canonical:
        false,

      packetUsable:
        currentTurnMeaningAvailable,

      semanticIntent: {
        available:
          Boolean(operation),

        requestedOperation:
          operation ||
          null
      },

      conversationPurpose: {
        available:
          Boolean(purpose),

        name:
          purpose ||
          null
      },

      supportingPurposes:
        [],

      continuity,

      ambiguity,

      governance: {
        responseOrder:
          "normal"
      },

      readiness: {
        packetUsable:
          currentTurnMeaningAvailable
      },

      responseRequirements,

      availableContext,

      operation:
        operation ||
        null,

      purpose:
        purpose ||
        null,

      supportingPurposeNames:
        [],

      currentTurnMeaningAvailable,

      referencePresent,

      referenceResolved,

      unresolvedReference,

      requiresPriorContext,

      priorContextAvailable,

      missingPriorContext,

      isContinuation,

      referencesPriorArtifact:
        continuity.referencesPriorArtifact ===
        true,

      referencesPriorQuestion:
        continuity.referencesPriorQuestion ===
        true,

      clarificationRequired:
        ambiguity.requiresClarification ===
        true,

      missingAnchor,

      recallRequested,

      correctionRequested,

      relationshipContinuityRequested,

      directCurrentTurnEligible:
        currentTurnMeaningAvailable &&
        !requiresPriorContext &&
        !isContinuation &&
        !unresolvedReference &&
        !missingAnchor &&
        !recallRequested &&
        !correctionRequested &&
        !relationshipContinuityRequested,

      responseOrder:
        "normal",

      routingBlocked:
        !currentTurnMeaningAvailable,

      rawTextUsed:
        false,

      lexicalInferenceUsed:
        false,

      legacyFallbackReason:
        "No canonical Conversation Intent Packet was available. Structured semantic outputs were used without reading raw user language.",

      authority:
        "temporary_structured_legacy_fallback"
    };
  },

  /* =====================================================
     CONTEXT-LANE SCORING
  ===================================================== */

  scoreLanes(
    context = {}
  ) {
    let direct = 20;
    let continuity = 0;
    let recall = 0;
    let correction = 0;
    let relationship = 0;
    let missingContext = 0;

    if (
      context.currentTurnMeaningAvailable
    ) {
      direct += 35;
    }

    if (
      context.directCurrentTurnEligible
    ) {
      direct += 35;
    }

    if (
      context.requiresPriorContext
    ) {
      continuity += 45;
      direct -= 30;
    }

    if (
      context.isContinuation
    ) {
      continuity += 40;
      direct -= 25;
    }

    if (
      context.unresolvedReference
    ) {
      continuity += 35;
      direct -= 35;
    }

    if (
      context.referencesPriorArtifact
    ) {
      continuity += 20;
    }

    if (
      context.referencesPriorQuestion
    ) {
      continuity += 20;
    }

    if (
      context.priorContextAvailable &&
      context.requiresPriorContext
    ) {
      continuity += 15;
    }

    if (
      context.missingPriorContext
    ) {
      missingContext += 100;
      continuity -= 20;
      direct -= 40;
    }

    if (
      context.missingAnchor &&
      context.requiresPriorContext
    ) {
      missingContext += 20;
    }

    if (
      context.recallRequested
    ) {
      recall += 100;
      direct -= 30;
    }

    if (
      context.correctionRequested
    ) {
      correction += 100;
      direct -= 30;
    }

    if (
      context
        .relationshipContinuityRequested
    ) {
      relationship += 100;
      direct -= 30;
    }

    if (
      context.routingBlocked
    ) {
      direct -= 30;
    }

    return {
      direct_current_turn:
        this.cap(direct),

      continuity_follow_up:
        this.cap(continuity),

      recall_or_memory_request:
        this.cap(recall),

      correction_or_revision:
        this.cap(correction),

      relationship_continuity:
        this.cap(relationship),

      missing_context:
        this.cap(missingContext)
    };
  },

  /* =====================================================
     FINAL LANE SELECTION
  ===================================================== */

  chooseLane({
    ranked = [],
    context = {}
  } = {}) {
    if (
      context.missingPriorContext
    ) {
      return "missing_context";
    }

    if (
      context.correctionRequested
    ) {
      return "correction_or_revision";
    }

    if (
      context.recallRequested
    ) {
      return "recall_or_memory_request";
    }

    if (
      context
        .relationshipContinuityRequested
    ) {
      return "relationship_continuity";
    }

    if (
      context.requiresPriorContext ||
      context.isContinuation ||
      context.unresolvedReference
    ) {
      return "continuity_follow_up";
    }

    if (
      context.directCurrentTurnEligible
    ) {
      return "direct_current_turn";
    }

    return (
      ranked[0]?.lane ||
      "direct_current_turn"
    );
  },

  /* =====================================================
     ROUTING INSTRUCTIONS
  ===================================================== */

  buildRoutingInstructions({
    lane = "direct_current_turn",
    context = {}
  } = {}) {
    const useThread =
      this.shouldUseThread(lane);

    const useMemory =
      this.shouldUseMemory(lane);

    const useRelationship =
      this.shouldUseRelationship(
        lane
      );

    return {
      useCurrentTurn:
        true,

      useThread,

      useMemory,

      useRelationship,

      contextRecoveryRequired:
        lane === "missing_context",

      correctionContextRequired:
        lane ===
        "correction_or_revision",

      goStraightToSituationMap:
        lane ===
        "direct_current_turn",

      mayProceedToSituationMap:
        lane !== "missing_context",

      mayProceedToNormalPlanning:
        lane !== "missing_context" &&
        context.routingBlocked !== true,

      shouldAskForMissingContext:
        lane === "missing_context",

      shouldNotReuseUnrelatedThread:
        lane ===
        "direct_current_turn",

      canonicalIntentMustBePreserved:
        true
    };
  },

  shouldUseThread(
    lane = ""
  ) {
    return [
      "continuity_follow_up",
      "correction_or_revision",
      "relationship_continuity"
    ].includes(lane);
  },

  shouldUseMemory(
    lane = ""
  ) {
    return [
      "recall_or_memory_request",
      "relationship_continuity"
    ].includes(lane);
  },

  shouldUseRelationship(
    lane = ""
  ) {
    return (
      lane ===
      "relationship_continuity"
    );
  },

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  calculateConfidence({
    lane = "",
    ranked = [],
    context = {},
    packetSource = {}
  } = {}) {
    const top =
      ranked.find(item =>
        item.lane === lane
      )?.score ||
      ranked[0]?.score ||
      0;

    const second =
      ranked
        .filter(item =>
          item.lane !== lane
        )[0]?.score ||
      0;

    const gap =
      Math.max(
        0,
        top - second
      );

    const canonicalPacketBonus =
      packetSource.available
        ? 0.15
        : 0;

    const explicitRouteBonus =
      (
        context.missingPriorContext ||
        context.correctionRequested ||
        context.recallRequested ||
        context
          .relationshipContinuityRequested ||
        context.requiresPriorContext ||
        context.unresolvedReference ||
        context.directCurrentTurnEligible
      )
        ? 0.2
        : 0;

    const missingMeaningPenalty =
      context
        .currentTurnMeaningAvailable
        ? 0
        : 0.25;

    const legacyPenalty =
      packetSource.available
        ? 0
        : 0.15;

    const gapScore =
      this.normalizeConfidence(
        gap / 100
      );

    const normalized =
      this.normalizeConfidence(
        0.45 +
        gapScore * 0.25 +
        canonicalPacketBonus +
        explicitRouteBonus -
        missingMeaningPenalty -
        legacyPenalty
      );

    return {
      normalized,

      score:
        Math.round(
          normalized * 100
        ),

      label:
        this.confidenceLabel(
          normalized
        ),

      breakdown: {
        selectedLaneScore:
          top,

        secondLaneScore:
          second,

        scoreGap:
          gap,

        gapScore,

        canonicalPacketBonus,

        explicitRouteBonus,

        missingMeaningPenalty,

        legacyPenalty
      }
    };
  },

  confidenceLabel(
    value = 0
  ) {
    const normalized =
      this.normalizeConfidence(
        value
      );

    if (normalized >= 0.88) {
      return "high";
    }

    if (normalized >= 0.68) {
      return "medium";
    }

    if (normalized >= 0.45) {
      return "low";
    }

    return "very_low";
  },

  /* =====================================================
     EXPLANATION
  ===================================================== */

  explain({
    lane = "",
    context = {}
  } = {}) {
    if (
      lane === "missing_context"
    ) {
      return "The canonical intent packet requires prior context, but that context is not available.";
    }

    if (
      lane ===
      "correction_or_revision"
    ) {
      return "The canonical intent packet identifies a correction or revision of prior material.";
    }

    if (
      lane ===
      "recall_or_memory_request"
    ) {
      return "The canonical intent packet identifies an explicit recall or memory-context request.";
    }

    if (
      lane ===
      "relationship_continuity"
    ) {
      return "The canonical intent packet identifies a relationship-continuity request requiring relationship context.";
    }

    if (
      lane ===
      "continuity_follow_up"
    ) {
      if (
        context.unresolvedReference
      ) {
        return "The canonical intent packet reports a current-turn reference that is not yet resolved, so prior thread context is required.";
      }

      return "The canonical intent packet states that the current request requires prior thread context.";
    }

    if (
      lane ===
      "direct_current_turn"
    ) {
      return "The canonical intent packet contains sufficient self-contained current-turn meaning and does not require prior context.";
    }

    return "No stronger context dependency was established, so the highest-ranked context lane was selected.";
  },

  /* =====================================================
     EXECUTIVE ROUTING HANDOFF
  ===================================================== */

  buildHandoff({
    lane = "",
    routing = {},
    routingContext = {},
    confidence = {},
    explanation = "",
    packetSource = {}
  } = {}) {
    return {
      ready:
        lane !==
        "missing_context" &&
        routingContext.routingBlocked !==
          true,

      lane,

      contextLane:
        lane,

      routing,

      explanation,

      canonicalPacketUsed:
        packetSource.available,

      legacyFallbackUsed:
        !packetSource.available,

      semanticIntent:
        routingContext.semanticIntent,

      conversationPurpose:
        routingContext
          .conversationPurpose,

      continuity:
        routingContext.continuity,

      ambiguity:
        routingContext.ambiguity,

      governance:
        routingContext.governance,

      readiness:
        routingContext.readiness,

      contextRequirements: {
        currentTurn:
          true,

        thread:
          routing.useThread ===
          true,

        memory:
          routing.useMemory ===
          true,

        relationship:
          routing.useRelationship ===
          true,

        missingContext:
          routing
            .contextRecoveryRequired ===
          true,

        unresolvedReference:
          routingContext
            .unresolvedReference ===
          true
      },

      confidence,

      authority: {
        canChooseContextLane:
          true,

        canChooseTriagePriority:
          false,

        canChooseResponseDomain:
          false,

        canChoosePlanner:
          false,

        canDetermineSafetySeverity:
          false,

        canComposeResponse:
          false,

        canAnswerUser:
          false,

        role:
          "lane_splitter_to_executive_routing_handoff"
      }
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  unwrapSummary(
    input = {}
  ) {
    if (
      input &&
      typeof input === "object" &&
      !Array.isArray(input) &&
      input.summary &&
      typeof input.summary ===
        "object" &&
      !Array.isArray(input.summary)
    ) {
      return input.summary;
    }

    return (
      input &&
      typeof input === "object" &&
      !Array.isArray(input)
    )
      ? input
      : {};
  },

  firstNonEmptyObject(
    ...values
  ) {
    return (
      values.find(value =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0
      ) ||
      {}
    );
  },

  firstNonEmptyArray(
    ...values
  ) {
    return (
      values.find(value =>
        Array.isArray(value) &&
        value.length > 0
      ) ||
      []
    );
  },

  matchesAnyIdentifier(
    values = [],
    candidates = []
  ) {
    const normalizedValues =
      values
        .map(value =>
          this.normalizeIdentifier(
            value
          )
        )
        .filter(Boolean);

    const normalizedCandidates =
      candidates
        .map(value =>
          this.normalizeIdentifier(
            value
          )
        )
        .filter(Boolean);

    return normalizedValues.some(
      value =>
        normalizedCandidates.some(
          candidate =>
            value === candidate ||
            value.includes(candidate) ||
            candidate.includes(value)
        )
    );
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value || ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeConfidence(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
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

  rankScores(
    scores = {}
  ) {
    return Object.entries(scores)
      .map(
        ([lane, score]) => ({
          lane,
          score
        })
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      );
  },

  cap(
    value = 0
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(value) ||
          0
        )
      )
    );
  }
};

console.log(
  "ARI LANE SPLITTER ENGINE LOADED:",
  window.Ari.laneSplitterEngine?.version
);
