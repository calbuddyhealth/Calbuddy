// ari/continuity/ari-continuity-packet.js
// Ari Continuity Packet
//
// Purpose:
// Build the official structured continuity handoff from thread context,
// reference resolution, memory context, relationship context, and the
// continuity-routing decision.
//
// V2.1.0 — Resolved Follow-Up Preservation / Canonical Turn Handoff
//
// Architectural responsibilities:
// - Preserve the original current turn.
// - Preserve structured thread state.
// - Preserve structured reference-resolution decisions.
// - Preserve whether prior context should be used.
// - Preserve continuity facts without flattening semantic nodes.
// - Hand structured continuity context to the Context Assembler.
//
// Non-responsibilities:
// - Does not interpret the user's requested operation.
// - Does not choose semantic meaning.
// - Does not rewrite the user's current question.
// - Does not choose a semantic frame.
// - Does not choose conversation function.
// - Does not choose routing or planning.
// - Does not determine safety severity.
// - Does not answer the user.

window.Ari = window.Ari || {};

window.Ari.continuityPacket = {
  version: "2.1.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const continuityResults =
      input.continuityResults ||
      summary.continuityResults ||
      {};

    const laneSplit =
      input.laneSplit ||
      summary.laneSplit ||
      {};

    const outputs =
      continuityResults.outputs ||
      {};

    const threadSource =
      outputs.thread ||
      summary.threadContext ||
      summary.threadUnderstanding ||
      summary.threadWorkingContext ||
      null;

    const referenceSource =
      outputs.reference ||
      outputs.entity ||
      summary.referenceResolution ||
      summary.entityReferenceState ||
      summary.subjectGraphState ||
      null;

    const memorySource =
      outputs.memory ||
      summary.memoryContext ||
      null;

    const relationshipSource =
      outputs.relationship ||
      summary.relationshipProfile ||
      null;

    const currentTurn =
      this.buildCurrentTurn({
        summary,
        continuityResults,
        laneSplit
      });

    const continuityDecision =
      this.buildContinuityDecision({
        summary,
        continuityResults,
        laneSplit,
        currentTurn
      });

    const threadContext =
  this.buildThreadContext({
    summary,
    threadSource,
    currentTurn,
    continuityDecision
  });

    const referenceResolution =
      this.buildReferenceResolution({
        summary,
        referenceSource,
        threadContext
      });

    const memoryContext =
      this.buildMemoryContext(
        memorySource
      );

    const relationshipContext =
      this.buildRelationshipContext(
        relationshipSource
      );

    const activeContext =
      this.buildActiveContext({
        threadContext,
        referenceResolution,
        continuityDecision
      });

    const usableFacts =
      this.buildUsableFacts({
        threadContext,
        referenceResolution,
        memoryContext,
        relationshipContext
      });

    const unresolvedReferences =
      this.buildUnresolvedReferences({
        threadContext,
        referenceResolution
      });

    const sourceTrace =
      this.buildSourceTrace({
        continuityResults,
        laneSplit,
        threadSource,
        referenceSource,
        memorySource,
        relationshipSource
      });

    const warnings =
      this.buildWarnings({
        continuityResults,
        continuityDecision,
        threadContext,
        referenceResolution
      });

    const quality =
      this.buildQuality({
        continuityResults,
        continuityDecision,
        threadContext,
        referenceResolution,
        usableFacts,
        unresolvedReferences,
        warnings
      });

    const packet = {
      schema:
        "ari_continuity_packet",

      schemaVersion:
        this.schemaVersion,

      engine:
        "ari-continuity-packet",

      version:
        this.version,

      source:
        "ari-continuity-packet",

      createdAt:
        new Date().toISOString(),

      ran:
        continuityResults.ran ===
          true ||
        threadContext.ran ===
          true,

      ready:
        quality.ready,

      reason:
        continuityResults.reason ||
        continuityDecision.reason ||
        null,

      continuityType:
  continuityDecision.type,

currentTurn,

resolvedCurrentTurn:
  currentTurn,

resolvedUserQuestion:
  currentTurn.resolvedText ||
  currentTurn.originalText,

currentTurnWasResolved:
  currentTurn.currentTurnWasResolved ===
  true,

ellipticalFollowUpResolved:
  currentTurn.ellipticalFollowUpResolved ===
  true,

continuityDecision,

threadContext,

      activeThread:
        threadContext,

      referenceResolution,

      activeContext,

      memoryContext,

      relationshipContext,

      referencedContext: {
        threadUsed:
          continuityDecision
            .useThread,

        referenceResolutionUsed:
          referenceResolution.ran,

        memoryUsed:
          continuityDecision
            .useMemory,

        relationshipUsed:
          continuityDecision
            .useRelationship
      },

      usableFacts,

      usableFactCount:
        usableFacts.length,

      unresolvedReferences,

      unresolvedReferenceCount:
        unresolvedReferences.length,

      warnings,

      sourceTrace,

      quality,

      confidence:
        quality.confidence,

      contextAssemblerHandoff: {
        ready:
          quality.ready,

        shouldUseAsContext:
          continuityDecision
            .shouldUsePriorContext,

        preferredPlacement:
          "continuityPacket",

        threadContextPath:
          "continuityPacket.threadContext",

        referenceResolutionPath:
          "continuityPacket.referenceResolution",

        continuityDecisionPath:
          "continuityPacket.continuityDecision",

        activeContextPath:
          "continuityPacket.activeContext"
      },

      situationMapHandoff: {
        ready:
          quality.ready,

        shouldUseAsContext:
          continuityDecision
            .shouldUsePriorContext,

        preferredPlacement:
          "continuityContext",

        authority:
          "context_only"
      },

      authority: {
        canPackageContinuity:
          true,

        canPreserveThreadContext:
          true,

        canPreserveReferenceResolution:
          true,

        canReportPriorContextPolicy:
          true,

        canInterpretCurrentMeaning:
          false,

        canInterpretRequestedOperation:
          false,

        canResolveNewReferences:
          false,

        canRewriteCurrentTurn:
          false,

        canChooseLane:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChoosePlanner:
          false,

        canAnswerUser:
          false,

        canOverrideSafety:
          false,

        canSetPriority:
          false,

        role:
          "structured_continuity_context_handoff_only"
      }
    };

    const frozenPacket =
      this.deepFreeze(packet);

    window.Ari.continuityPacketState =
      frozenPacket;

    return frozenPacket;
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  buildCurrentTurn({
    summary = {},
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    const originalText =
      this.clean(
        continuityResults
          .currentTurn
          ?.text ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
      );

    const ellipticalOutput =
  continuityResults.outputs
    ?.elliptical ||
  {};
  
const ellipticalResolution =
  ellipticalOutput
    .ellipticalFollowUpResolution ||
  continuityResults
    .ellipticalFollowUpResolution ||
  continuityResults
    .ellipticalFollowUp ||
  {};

const resolvedCurrentTurn =
  continuityResults
    .resolvedCurrentTurn ||
  ellipticalOutput
    .resolvedCurrentTurn ||
  ellipticalResolution
    .resolvedCurrentTurn ||
  summary.resolvedCurrentTurn ||
  {};

const externallyResolvedText =
  this.clean(
    continuityResults
      .resolvedUserQuestion ||
    resolvedCurrentTurn
      ?.resolvedText ||
    ellipticalOutput
      .resolvedUserQuestion ||
    ellipticalOutput
      .resolvedCurrentTurnText ||
    ellipticalResolution
      .resolvedText ||
    summary.resolvedUserQuestion ||
    summary.resolvedCurrentTurn
      ?.resolvedText ||
    originalText
  );

    const ellipticalFollowUpResolved =
  summary.ellipticalFollowUpResolved ===
    true ||
  continuityResults
    .ellipticalFollowUp
    ?.resolved ===
    true ||
  ellipticalOutput
    .resolved ===
    true ||
  ellipticalResolution
    .resolved ===
    true;

const currentTurnWasResolved =
  summary.currentTurnWasResolved ===
    true ||
  continuityResults
    .currentTurnWasResolved ===
    true ||
  ellipticalFollowUpResolved ||
  (
    Boolean(
      externallyResolvedText
    ) &&
    this.normalize(
      externallyResolvedText
    ) !==
    this.normalize(
      originalText
    )
  );

    const lane =
      continuityResults
        .currentTurn
        ?.lane ||
      laneSplit.lane ||
      summary.contextLane ||
      null;

    return {
  originalText,

  resolvedText:
    externallyResolvedText ||
    originalText,

  currentTurnWasResolved,

  ellipticalFollowUpResolved,

  lane,
      needsPriorContext:
        continuityResults
          .currentTurn
          ?.needsPriorContext ??
        this.readNeedsPriorContext({
          summary,
          continuityResults,
          laneSplit
        }),

      preservedExactly:
        !currentTurnWasResolved,

      authority:
        "current_turn_record_only"
    };
  },

  readNeedsPriorContext({
    summary = {},
    continuityResults = {},
    laneSplit = {}
  } = {}) {
    const routing =
      laneSplit.routing ||
      continuityResults.routing ||
      {};

    if (
      summary.shouldUseContinuity ===
      true
    ) {
      return true;
    }

    if (
      routing.useThread ||
      routing.useMemory ||
      routing.useRelationship
    ) {
      return true;
    }

    if (
      continuityResults.lane &&
      continuityResults.lane !==
        "direct_current_turn"
    ) {
      return true;
    }

    if (
      laneSplit.lane &&
      laneSplit.lane !==
        "direct_current_turn"
    ) {
      return true;
    }

    return false;
  },

  /* =====================================================
     CONTINUITY DECISION
  ===================================================== */

  buildContinuityDecision({
    summary = {},
    continuityResults = {},
    laneSplit = {},
    currentTurn = {}
  } = {}) {
    const routing =
      continuityResults.routing ||
      laneSplit.routing ||
      {};

    const useThread =
      routing.useThread ===
        true ||
      continuityResults.used
        ?.thread ===
        true;

    const useMemory =
      routing.useMemory ===
        true ||
      continuityResults.used
        ?.memory ===
        true;

    const useRelationship =
      routing.useRelationship ===
        true ||
      continuityResults.used
        ?.relationship ===
        true;

    const followUpDetected =
      summary.followUpDetected ===
        true ||
      summary.continuityState
        ?.followUpDetected ===
        true ||
      summary.conversationContinuity
        ?.followUpDetected ===
        true ||
      currentTurn.needsPriorContext ===
        true;

    const shouldUsePriorContext =
      currentTurn.needsPriorContext ===
        true ||
      useThread ||
      useMemory ||
      useRelationship ||
      summary.shouldReusePriorContext ===
        true ||
      summary.continuityState
        ?.shouldReusePriorContext ===
        true;

    const type =
      continuityResults.lane ||
      laneSplit.lane ||
      summary.contextLane ||
      (
        shouldUsePriorContext
          ? "continuity_follow_up"
          : "direct_current_turn"
      );

    return {
      type,

      lane:
        type,

      shouldUsePriorContext,

      followUpDetected,

      followUpType:
        summary.followUpType ||
        summary.continuityState
          ?.followUpType ||
        summary.conversationContinuity
          ?.followUpType ||
        (
          shouldUsePriorContext
            ? "context_required"
            : "none"
        ),

      useThread,

      useMemory,

      useRelationship,

      goStraightToSituationMap:
        routing
          .goStraightToSituationMap ===
          true ||
        !shouldUsePriorContext,

      directCurrentTurn:
        !shouldUsePriorContext,

      reason:
        continuityResults.reason ||
        (
          shouldUsePriorContext
            ? "Prior conversational context was requested by routing."
            : "The current turn can be handled without inherited context."
        ),

      confidence:
        this.normalizeConfidence(
          continuityResults
            .confidence ??
          laneSplit.confidence ??
          (
            shouldUsePriorContext
              ? 0.75
              : 0.9
          )
        ),

      authority:
        "continuity_policy_preservation_only"
    };
  },

  /* =====================================================
     THREAD CONTEXT
  ===================================================== */

  buildThreadContext({
    summary = {},
    threadSource = null,
    currentTurn = {},
    continuityDecision = {}
  } = {}) {
    const root =
      this.unwrapThreadSource(
        threadSource
      );

    const priorThread =
      summary.threadState ||
      {};

    const activeTopic =
      this.firstMeaningful([
        root.activeTopic,
        root.currentTopic,
        root.mainTopic,
        root.activeSituation
          ?.label,
        priorThread.currentTopic,
        summary.activeTopic
      ]);

    const activeSubject =
      this.firstNode([
        root.activeSubject,
        root.threadActiveSubject,
        root.resolvedMeaning
          ?.resolvedSubject,
        root.semanticState
          ?.activeSubject,
        priorThread.activeSubject,
        summary.activeSubject
      ]);

    const activeObject =
      this.firstNode([
        root.activeObject,
        root.threadActiveObject,
        root.resolvedMeaning
          ?.resolvedObject,
        root.semanticState
          ?.activeObject,
        priorThread.activeObject,
        summary.activeObject
      ]);

    const activeIssue =
      this.firstNode([
        root.activeIssue,
        root.threadActiveIssue,
        root.activeProblem,
        root.resolvedMeaning
          ?.resolvedIssue,
        priorThread.activeIssue,
        summary.activeIssue
      ]);

    const activeGoal =
      this.firstNode([
        root.activeGoal,
        root.threadActiveGoal,
        root.resolvedMeaning
          ?.resolvedGoal,
        priorThread.activeGoal,
        summary.activeGoal
      ]);

    const activeQuestion =
      this.firstMeaningful([
        root.activeQuestion,
        root.currentQuestion,
        root.semanticState
          ?.activeQuestion,
        root.activeDialogueState
          ?.currentQuestion,
        priorThread.activeQuestion
      ]);

    const previousAnswer =
      this.firstMeaningful([
        root.previousAnswer,
        root.lastResolvedAnswer,
        root.previousAnswerSummary,
        root.semanticState
          ?.lastResolvedAnswer,
        priorThread.previousAnswerSummary,
        priorThread.lastFinalResponse,
        summary.previousAnswerSummary
      ]);

    const activeEntities =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeEntities
        ),

        ...this.arrayFrom(
          root.entities
        ),

        ...this.arrayFrom(
          root.resolvedMeaning
            ?.resolvedEntities
        ),

        ...this.arrayFrom(
          priorThread.activeEntities
        )
      ]);

    const activeClaims =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeClaims
        ),

        ...this.arrayFrom(
          root.claims
        ),

        ...this.arrayFrom(
          root.keyFacts
        ),

        ...this.arrayFrom(
          root.resolvedMeaning
            ?.keyFacts
        ),

        ...this.arrayFrom(
          priorThread.activeClaims
        )
      ]);

    const activeEvents =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeEvents
        ),

        ...this.arrayFrom(
          root.events
        ),

        ...this.arrayFrom(
          priorThread.activeEvents
        )
      ]);

    const activeQuantities =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeQuantities
        ),

        ...this.arrayFrom(
          root.quantities
        ),

        ...this.arrayFrom(
          priorThread.activeQuantities
        )
      ]);

    const activeRelations =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeRelations
        ),

        ...this.arrayFrom(
          root.relations
        ),

        ...this.arrayFrom(
          priorThread.activeRelations
        )
      ]);

    const activeConstraints =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.activeConstraints
        ),

        ...this.arrayFrom(
          root.hardConstraints
        ),

        ...this.arrayFrom(
          priorThread.activeConstraints
        )
      ]);

    const unresolvedItems =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.unresolvedItems
        ),

        ...this.arrayFrom(
          root.openQuestions
        ),

        ...this.arrayFrom(
          priorThread.unresolvedItems
        )
      ]);

    const openLoops =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.openLoops
        ),

        ...this.arrayFrom(
          root.activeDialogueState
            ?.openLoops
        ),

        ...this.arrayFrom(
          root.activeDialogueState
            ?.unresolvedTensions
        ),

        ...this.arrayFrom(
          priorThread.openLoops
        )
      ]);

    const recentTurns =
      this.normalizeRecentTurns([
        ...this.arrayFrom(
          root.recentTurns
        ),

        ...this.arrayFrom(
          root.recentMessages
        ),

        ...this.arrayFrom(
          root.timeline
        ),

        ...this.arrayFrom(
          priorThread.lastMessages
        )
      ]);

    const topicHistory =
      this.dedupeNodes([
        ...this.arrayFrom(
          root.topicHistory
        ),

        ...this.arrayFrom(
          priorThread.topicHistory
        )
      ]);

    const threadAvailable =
      Boolean(
        threadSource ||
        activeTopic ||
        activeSubject ||
        activeObject ||
        activeIssue ||
        activeQuestion ||
        recentTurns.length
      );

    return {
      schema:
        "ari_thread_context",

      schemaVersion:
        this.schemaVersion,

      version:
        root.version ||
        root
          .threadContextVersion ||
        root
          .threadUnderstandingVersion ||
        null,

      source:
        root.source ||
        root
          .threadContextSource ||
        root
          .threadUnderstandingSource ||
        "ari-continuity-packet",

      ran:
        threadAvailable,

      threadAvailable,

      activeTopic:
        this.extractLabel(
          activeTopic
        ),

      activeSubject,

      activeObject,

      activeIssue,

      activeGoal,

      activeEntities,

      activeClaims,

      activeEvents,

      activeQuantities,

      activeRelations,

      activeConstraints,

      activeQuestion,

      previousAnswer,

      unresolvedItems,

      openLoops,

      recentTurns,

      topicHistory,

      topicTransition:
        root.topicTransition ||
        root.threadTopicTransition ||
        null,

      staleContextSuppressed:
        root.staleContextSuppressed ===
          true ||
        root.topicTransition
          ?.switched ===
          true,

      currentTurn: {
  originalText:
    currentTurn.originalText,

  resolvedText:
    currentTurn.resolvedText,

  currentTurnWasResolved:
    currentTurn.currentTurnWasResolved ===
    true,

  needsPriorContext:
    currentTurn.needsPriorContext,

  authority:
    currentTurn.authority ||
    "current_turn_record_only"
},

      shouldReusePriorContext:
        continuityDecision
          .shouldUsePriorContext,

      workingContext:
        root.workingContext ||
        (
          threadSource
            ?.workingContext
        ) ||
        null,

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          root.activeDialogueState
            ?.confidence ??
          (
            threadAvailable
              ? 0.75
              : 0
          )
        ),

      authority: {
        canPreserveThreadState:
          true,

        canDescribeActiveContext:
          true,

        canInterpretCurrentOperation:
          false,

        canResolveReferences:
          false,

        canChooseMeaning:
          false,

        role:
          "structured_thread_state_only"
      }
    };
  },

  unwrapThreadSource(
    threadSource = null
  ) {
    if (
      !threadSource ||
      typeof threadSource !==
        "object"
    ) {
      return {};
    }

    return (
      threadSource.threadContext ||
      threadSource
        .threadUnderstanding ||
      threadSource.workingContext ||
      threadSource
    );
  },

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  buildReferenceResolution({
    summary = {},
    referenceSource = null,
    threadContext = {}
  } = {}) {
    const root =
      this.unwrapReferenceSource(
        referenceSource
      );

    const decisions =
      this.arrayFrom(
        root.decisions ||
        root.referenceDecisions
      );

    const legacyReferences =
      this.arrayFrom(
        root.resolvedReferences ||
        root.references
      );

    const normalizedDecisions =
      decisions.length
        ? decisions.map(
            decision =>
              this.normalizeReferenceDecision(
                decision
              )
          )
        : legacyReferences.map(
            reference =>
              this.normalizeReferenceDecision(
                reference
              )
          );

    const resolvedReferences =
      normalizedDecisions.filter(
        decision =>
          decision.status ===
          "resolved"
      );

    const unresolvedReferences =
      this.dedupeNodes([
        ...normalizedDecisions.filter(
          decision =>
            decision.status !==
            "resolved"
        ),

        ...this.arrayFrom(
          root.unresolvedReferences
        ),

        ...this.arrayFrom(
          summary
            .continuityUnresolvedReferences
        )
      ]);

    const ran =
      Boolean(
        referenceSource ||
        normalizedDecisions.length ||
        root.activeEntity ||
        root.activeSubject
      );

    return {
      schema:
        "ari_reference_resolution",

      schemaVersion:
        this.schemaVersion,

      version:
        root.version ||
        root
          .referenceResolutionVersion ||
        root
          .entityReferenceResolverVersion ||
        null,

      source:
        root.source ||
        root
          .referenceResolutionSource ||
        root
          .entityReferenceResolverSource ||
        "ari-continuity-packet",

      ran,

      decisions:
        normalizedDecisions,

      resolvedReferences,

      unresolvedReferences,

      activeEntity:
        root.activeEntity ||
        root.activeSubject ||
        threadContext
          .activeSubject ||
        null,

      activeSubject:
        root.activeSubject ||
        threadContext
          .activeSubject ||
        null,

      activeObject:
        root.activeObject ||
        threadContext
          .activeObject ||
        null,

      activeIssue:
        root.activeIssue ||
        root.activeProblem ||
        threadContext
          .activeIssue ||
        null,

      entities:
        this.dedupeNodes([
          ...this.arrayFrom(
            root.entities
          ),

          ...this.arrayFrom(
            root.activeEntities
          )
        ]),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          (
            resolvedReferences.length
              ? 0.85
              : ran
                ? 0.6
                : 0
          )
        ),

      authority: {
        canPreserveReferenceDecisions:
          true,

        canResolveNewReferences:
          false,

        canRewriteCurrentTurn:
          false,

        canChooseMeaning:
          false,

        role:
          "reference_resolution_handoff_only"
      }
    };
  },

  unwrapReferenceSource(
    source = null
  ) {
    if (
      !source ||
      typeof source !==
        "object"
    ) {
      return {};
    }

    return (
      source.referenceResolution ||
      source.entityReferenceState ||
      source.subjectGraphState ||
      source
    );
  },

  normalizeReferenceDecision(
    decision = {}
  ) {
    const reference =
      decision.reference ||
      decision.surface ||
      decision.text ||
      decision.pronoun ||
      null;

    const resolvedTarget =
      decision.resolvedTarget ||
      decision.resolvedTo ||
      decision.target ||
      null;

    const status =
      decision.status ||
      (
        resolvedTarget
          ? "resolved"
          : "unresolved"
      );

    return {
      id:
        decision.id ||
        decision.referenceId ||
        null,

      reference,

      referenceType:
        decision.referenceType ||
        decision.type ||
        null,

      resolvedTarget,

      resolvedTo:
        resolvedTarget,

      targetId:
        decision.targetId ||
        resolvedTarget?.id ||
        resolvedTarget
          ?.entityRef ||
        resolvedTarget
          ?.semanticRef ||
        null,

      status,

      candidates:
        this.arrayFrom(
          decision.candidates
        ),

      reason:
        decision.reason ||
        null,

      evidenceRefs:
        this.arrayFrom(
          decision.evidenceRefs
        ),

      confidence:
        this.normalizeConfidence(
          decision.confidence ??
          (
            resolvedTarget
              ? 0.8
              : 0.3
          )
        ),

      source:
        decision.source ||
        "reference_resolution"
    };
  },

  /* =====================================================
     ACTIVE CONTEXT
  ===================================================== */

  buildActiveContext({
    threadContext = {},
    referenceResolution = {},
    continuityDecision = {}
  } = {}) {
    return {
      activeTopic:
        threadContext.activeTopic ||
        null,

      activeSubject:
        referenceResolution
          .activeSubject ||
        threadContext.activeSubject ||
        null,

      activeObject:
        referenceResolution
          .activeObject ||
        threadContext.activeObject ||
        null,

      activeIssue:
        referenceResolution
          .activeIssue ||
        threadContext.activeIssue ||
        null,

      activeGoal:
        threadContext.activeGoal ||
        null,

      activeQuestion:
        threadContext
          .activeQuestion ||
        null,

      previousAnswer:
        threadContext
          .previousAnswer ||
        null,

      activeEntities:
        this.dedupeNodes([
          ...this.arrayFrom(
            threadContext
              .activeEntities
          ),

          ...this.arrayFrom(
            referenceResolution
              .entities
          )
        ]),

      activeClaims:
        this.arrayFrom(
          threadContext.activeClaims
        ),

      activeEvents:
        this.arrayFrom(
          threadContext.activeEvents
        ),

      activeQuantities:
        this.arrayFrom(
          threadContext
            .activeQuantities
        ),

      activeRelations:
        this.arrayFrom(
          threadContext
            .activeRelations
        ),

      activeConstraints:
        this.arrayFrom(
          threadContext
            .activeConstraints
        ),

      unresolvedItems:
        this.arrayFrom(
          threadContext
            .unresolvedItems
        ),

      openLoops:
        this.arrayFrom(
          threadContext.openLoops
        ),

      recentTurns:
        this.arrayFrom(
          threadContext.recentTurns
        ),

      topicHistory:
        this.arrayFrom(
          threadContext.topicHistory
        ),

      resolvedReferences:
        this.arrayFrom(
          referenceResolution
            .resolvedReferences
        ),

      unresolvedReferences:
        this.arrayFrom(
          referenceResolution
            .unresolvedReferences
        ),

      shouldUsePriorContext:
        continuityDecision
          .shouldUsePriorContext,

      staleContextSuppressed:
        threadContext
          .staleContextSuppressed ===
          true,

      confidence:
        Math.max(
          this.normalizeConfidence(
            threadContext.confidence
          ),

          this.normalizeConfidence(
            referenceResolution
              .confidence
          ),

          this.normalizeConfidence(
            continuityDecision
              .confidence
          )
        )
    };
  },

  /* =====================================================
     MEMORY CONTEXT
  ===================================================== */

  buildMemoryContext(
    memorySource = null
  ) {
    if (
      !memorySource ||
      typeof memorySource !==
        "object"
    ) {
      return {
        available:
          false,

        relevantMemories: [],

        activeThreadFacts: [],

        userPreferences: {},

        projectContext: {},

        priorDecisions: [],

        conflicts: [],

        confidence:
          0,

        source:
          "not_available"
      };
    }

    const root =
      memorySource.memoryContext ||
      memorySource;

    return {
      available:
        root.available !==
        false,

      relevantMemories:
        this.arrayFrom(
          root.relevantMemories ||
          root.memoryFacts ||
          root.items ||
          root.facts
        ).slice(
          0,
          12
        ),

      activeThreadFacts:
        this.arrayFrom(
          root.activeThreadFacts
        ).slice(
          0,
          12
        ),

      userPreferences:
        root.userPreferences ||
        {},

      projectContext:
        root.projectContext ||
        {},

      priorDecisions:
        this.arrayFrom(
          root.priorDecisions
        ).slice(
          0,
          12
        ),

      conflicts:
        this.arrayFrom(
          root.conflicts
        ).slice(
          0,
          8
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          0
        ),

      source:
        root.source ||
        "memory_context",

      version:
        root.version ||
        null
    };
  },

  /* =====================================================
     RELATIONSHIP CONTEXT
  ===================================================== */

  buildRelationshipContext(
    relationshipSource = null
  ) {
    if (
      !relationshipSource ||
      typeof relationshipSource !==
        "object"
    ) {
      return {
        available:
          false,

        communicationStyle:
          null,

        stablePreferences: {},

        activeProjects: [],

        relationshipFacts: [],

        confidence:
          0,

        source:
          "not_available"
      };
    }

    const root =
      relationshipSource
        .relationshipContext ||
      relationshipSource
        .relationshipProfile ||
      relationshipSource;

    return {
      available:
        root.available !==
        false,

      communicationStyle:
        root.communicationStyle ||
        null,

      depth:
        root.depth ||
        null,

      collaborationMode:
        root.collaborationMode ||
        null,

      challengeTolerance:
        root.challengeTolerance ||
        null,

      preferredFormat:
        root.preferredFormat ||
        null,

      stablePreferences:
        root.stablePreferences ||
        {},

      activeProjects:
        this.arrayFrom(
          root.activeProjects
        ),

      relationshipFacts:
        this.arrayFrom(
          root.relationshipFacts ||
          root.facts ||
          root.context
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          0
        ),

      source:
        root.source ||
        "relationship_context",

      version:
        root.version ||
        null
    };
  },

  /* =====================================================
     USABLE FACTS
  ===================================================== */

  buildUsableFacts({
    threadContext = {},
    referenceResolution = {},
    memoryContext = {},
    relationshipContext = {}
  } = {}) {
    const facts = [];

    const addFact = (
      source,
      type,
      value,
      confidence = null,
      raw = null
    ) => {
      const claim =
        this.extractLabel(value);

      if (!claim) {
        return;
      }

      facts.push({
        source,

        type,

        claim,

        value,

        confidence:
          this.normalizeConfidence(
            confidence ??
            value?.confidence ??
            0.7
          ),

        raw:
          raw ||
          value,

        usableByContextAssembler:
          true,

        usableBySituationMap:
          true
      });
    };

    if (threadContext.activeTopic) {
      addFact(
        "thread",
        "active_topic",
        threadContext.activeTopic,
        threadContext.confidence
      );
    }

    if (threadContext.activeSubject) {
      addFact(
        "thread",
        "active_subject",
        threadContext.activeSubject,
        threadContext.confidence
      );
    }

    if (threadContext.activeObject) {
      addFact(
        "thread",
        "active_object",
        threadContext.activeObject,
        threadContext.confidence
      );
    }

    if (threadContext.activeIssue) {
      addFact(
        "thread",
        "active_issue",
        threadContext.activeIssue,
        threadContext.confidence
      );
    }

    if (threadContext.activeGoal) {
      addFact(
        "thread",
        "active_goal",
        threadContext.activeGoal,
        threadContext.confidence
      );
    }

    if (threadContext.activeQuestion) {
      addFact(
        "thread",
        "active_question",
        threadContext.activeQuestion,
        threadContext.confidence
      );
    }

    if (threadContext.previousAnswer) {
      addFact(
        "thread",
        "previous_answer",
        threadContext.previousAnswer,
        threadContext.confidence
      );
    }

    threadContext
      .activeClaims
      .forEach(claim => {
        addFact(
          "thread",
          "active_claim",
          claim,
          claim?.confidence
        );
      });

    threadContext
      .activeEvents
      .forEach(event => {
        addFact(
          "thread",
          "active_event",
          event,
          event?.confidence
        );
      });

    threadContext
      .activeQuantities
      .forEach(quantity => {
        addFact(
          "thread",
          "active_quantity",
          quantity,
          quantity?.confidence
        );
      });

    threadContext
      .activeRelations
      .forEach(relation => {
        addFact(
          "thread",
          "active_relation",
          relation,
          relation?.confidence
        );
      });

    referenceResolution
      .resolvedReferences
      .forEach(decision => {
        const target =
          decision.resolvedTarget ||
          decision.resolvedTo;

        const claim =
          `${decision.reference || "reference"} -> ${this.extractLabel(target) || "resolved target"}`;

        addFact(
          "reference_resolution",
          "resolved_reference",
          claim,
          decision.confidence,
          decision
        );
      });

    memoryContext
      .relevantMemories
      .forEach(memory => {
        addFact(
          "memory",
          memory.type ||
          "memory",
          memory,
          memory.confidence
        );
      });

    memoryContext
      .activeThreadFacts
      .forEach(fact => {
        addFact(
          "memory",
          fact.type ||
          "active_thread_fact",
          fact,
          fact.confidence
        );
      });

    relationshipContext
      .relationshipFacts
      .forEach(fact => {
        addFact(
          "relationship",
          fact.type ||
          "relationship_fact",
          fact,
          fact.confidence
        );
      });

    return this.dedupeFacts(
      facts
    );
  },

  /* =====================================================
     UNRESOLVED REFERENCES
  ===================================================== */

  buildUnresolvedReferences({
    threadContext = {},
    referenceResolution = {}
  } = {}) {
    const unresolved = [];

    referenceResolution
      .unresolvedReferences
      .forEach((reference, index) => {
        unresolved.push({
          source:
            "reference_resolution",

          index,

          reference,

          confidence:
            this.normalizeConfidence(
              reference.confidence ??
              0.3
            )
        });
      });

    threadContext
      .unresolvedItems
      .forEach((item, index) => {
        const type =
          item?.type ||
          item?.kind ||
          "";

        if (
          !String(type)
            .toLowerCase()
            .includes("reference")
        ) {
          return;
        }

        unresolved.push({
          source:
            "thread_context",

          index,

          reference:
            item,

          confidence:
            this.normalizeConfidence(
              item?.confidence ??
              0.4
            )
        });
      });

    return this.dedupeUnresolved(
      unresolved
    );
  },

  /* =====================================================
     WARNINGS
  ===================================================== */

  buildWarnings({
    continuityResults = {},
    continuityDecision = {},
    threadContext = {},
    referenceResolution = {}
  } = {}) {
    const warnings = [
      ...this.arrayFrom(
        continuityResults.warnings
      )
    ];

    if (
      continuityDecision
        .shouldUsePriorContext &&
      !threadContext.threadAvailable
    ) {
      warnings.push({
        type:
          "prior_context_required_but_thread_missing",

        message:
          "Routing requested prior context, but no structured thread context was available."
      });
    }

    if (
      threadContext
        .activeQuestion &&
      threadContext
        .activeQuestion ===
        threadContext
          .currentTurn
          ?.originalText &&
      continuityDecision
        .shouldUsePriorContext
    ) {
      warnings.push({
        type:
          "current_turn_used_as_only_anchor",

        message:
          "The current turn appears to be the only available thread anchor."
      });
    }

    if (
      referenceResolution
        .unresolvedReferences
        .length >
      0
    ) {
      warnings.push({
        type:
          "unresolved_references_present",

        count:
          referenceResolution
            .unresolvedReferences
            .length,

        message:
          "One or more references remain unresolved."
      });
    }

    return warnings;
  },

  /* =====================================================
     SOURCE TRACE
  ===================================================== */

  buildSourceTrace({
    continuityResults = {},
    laneSplit = {},
    threadSource = null,
    referenceSource = null,
    memorySource = null,
    relationshipSource = null
  } = {}) {
    return {
      continuityEntryPoint: {
        ran:
          continuityResults.ran ===
          true,

        version:
          continuityResults.version ||
          null,

        source:
          continuityResults.source ||
          null,

        reason:
          continuityResults.reason ||
          null
      },

      laneSplitter: {
        lane:
          laneSplit.lane ||
          continuityResults.lane ||
          null,

        confidence:
          this.normalizeConfidence(
            laneSplit.confidence ??
            0
          ),

        source:
          laneSplit.source ||
          null
      },

      engines: {
        thread:
          this.engineTrace(
            threadSource
          ),

        referenceResolution:
          this.engineTrace(
            referenceSource
          ),

        memory:
          this.engineTrace(
            memorySource
          ),

        relationship:
          this.engineTrace(
            relationshipSource
          )
      }
    };
  },

  engineTrace(output = null) {
    if (
      !output ||
      typeof output !==
        "object"
    ) {
      return {
        available:
          false,

        ran:
          false,

        source:
          null,

        version:
          null,

        error:
          null
      };
    }

    return {
      available:
        true,

      ran:
        output.ran !==
          false &&
        !output.error,

      source:
        output.source ||
        output.engine ||
        output
          .threadUnderstandingSource ||
        output
          .entityReferenceResolverSource ||
        null,

      version:
        output.version ||
        output
          .threadUnderstandingVersion ||
        output
          .entityReferenceResolverVersion ||
        null,

      error:
        output.error ||
        null
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality({
    continuityResults = {},
    continuityDecision = {},
    threadContext = {},
    referenceResolution = {},
    usableFacts = [],
    unresolvedReferences = [],
    warnings = []
  } = {}) {
    let score = 0;

    if (
      continuityResults.ran ===
      true
    ) {
      score += 0.18;
    }

    if (
      continuityDecision
    ) {
      score += 0.12;
    }

    if (
      threadContext.threadAvailable
    ) {
      score += 0.2;
    }

    if (
      threadContext.activeTopic
    ) {
      score += 0.08;
    }

    if (
      threadContext.activeSubject ||
      threadContext.activeObject ||
      threadContext.activeIssue
    ) {
      score += 0.1;
    }

    if (
      threadContext.recentTurns
        .length >
      0
    ) {
      score += 0.08;
    }

    if (
      referenceResolution.ran
    ) {
      score += 0.08;
    }

    if (
      usableFacts.length >
      0
    ) {
      score += 0.08;
    }

    if (
      unresolvedReferences.length ===
      0
    ) {
      score += 0.05;
    }

    if (
      warnings.length ===
      0
    ) {
      score += 0.03;
    }

    score =
      this.normalizeConfidence(
        score
      );

    const ready =
      continuityDecision
        .shouldUsePriorContext
        ? threadContext
            .threadAvailable
        : true;

    return {
      ready,

      healthy:
        ready &&
        !warnings.some(
          warning =>
            warning.type ===
            "prior_context_required_but_thread_missing"
        ),

      score,

      confidence:
        score,

      threadAvailable:
        threadContext
          .threadAvailable,

      referenceResolutionAvailable:
        referenceResolution.ran,

      usableFactCount:
        usableFacts.length,

      unresolvedReferenceCount:
        unresolvedReferences.length,

      warningCount:
        warnings.length
    };
  },

  /* =====================================================
     RECENT TURN NORMALIZATION
  ===================================================== */

  normalizeRecentTurns(
    turns = []
  ) {
    const normalized = [];

    this.arrayFrom(turns)
      .forEach((turn, index) => {
        if (
          turn === null ||
          turn === undefined
        ) {
          return;
        }

        if (
          typeof turn ===
          "string"
        ) {
          const text =
            this.clean(turn);

          if (!text) {
            return;
          }

          normalized.push({
            id:
              null,

            role:
              "unknown",

            text,

            createdAt:
              null,

            index
          });

          return;
        }

        const text =
          this.clean(
            turn.text ||
            turn.claim ||
            turn.value ||
            turn.message ||
            ""
          );

        if (!text) {
          return;
        }

        normalized.push({
          id:
            turn.id ||
            turn.messageId ||
            null,

          role:
            turn.role ||
            "unknown",

          text,

          createdAt:
            turn.createdAt ||
            turn.timestamp ||
            turn.updatedAt ||
            null,

          topic:
            turn.topic ||
            turn.situationFrame ||
            null,

          index
        });
      });

    const seen =
      new Set();

    return normalized
      .filter(turn => {
        const key =
          `${turn.role}:${turn.text}`
            .toLowerCase();

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      })
      .slice(-12);
  },

  /* =====================================================
     DEDUPLICATION
  ===================================================== */

  dedupeNodes(nodes = []) {
    const seen =
      new Set();

    return this.arrayFrom(nodes)
      .filter(node => {
        if (
          node === null ||
          node === undefined
        ) {
          return false;
        }

        const key =
          [
            node?.id ||
            node?.entityRef ||
            node?.semanticRef ||
            "",

            node?.type ||
            node?.kind ||
            "",

            this.extractLabel(node)
          ]
            .map(value =>
              this.normalize(value)
            )
            .join("|");

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      });
  },

  dedupeFacts(facts = []) {
    const seen =
      new Set();

    return facts.filter(fact => {
      const key =
        [
          fact.source,
          fact.type,
          fact.claim
        ]
          .map(value =>
            this.normalize(value)
          )
          .join("|");

      if (
        !fact.claim ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
  },

  dedupeUnresolved(
    unresolved = []
  ) {
    const seen =
      new Set();

    return unresolved.filter(
      item => {
        const key =
          [
            item.source,
            this.extractLabel(
              item.reference
            )
          ]
            .map(value =>
              this.normalize(value)
            )
            .join("|");

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  },

  /* =====================================================
     IMMUTABILITY
  ===================================================== */

  deepFreeze(
    value,
    seen = new WeakSet()
  ) {
    if (
      value === null ||
      typeof value !==
        "object"
    ) {
      return value;
    }

    if (seen.has(value)) {
      return value;
    }

    seen.add(value);

    Reflect
      .ownKeys(value)
      .forEach(key => {
        const child =
          value[key];

        if (
          child &&
          typeof child ===
            "object"
        ) {
          this.deepFreeze(
            child,
            seen
          );
        }
      });

    return Object.freeze(value);
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  firstMeaningful(
    values = []
  ) {
    return this.arrayFrom(values)
      .find(value => {
        if (!value) {
          return false;
        }

        if (
          typeof value ===
          "string"
        ) {
          return Boolean(
            this.clean(value)
          );
        }

        return (
          typeof value ===
          "object"
        );
      }) ||
      null;
  },

  firstNode(values = []) {
    return this.firstMeaningful(
      values
    );
  },

  extractLabel(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return (
        this.clean(value) ||
        null
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
      const label =
        value.surface ||
        value.label ||
        value.name ||
        value.claim ||
        value.value ||
        value.text ||
        value.evidence ||
        value.description ||
        value.predicate ||
        value.action ||
        value.entityRef ||
        value.semanticRef ||
        null;

      if (
        label &&
        typeof label ===
        "string"
      ) {
        return (
          this.clean(label) ||
          null
        );
      }

      if (
        label !== null &&
        label !== undefined
      ) {
        return String(label);
      }
    }

    return null;
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

  arrayFrom(value) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  clean(value = "") {
    return String(
      value ||
      ""
    )
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.clean(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONTINUITY PACKET LOADED:",
  window.Ari.continuityPacket?.version
);