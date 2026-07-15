// ari/pipeline-stages/deliberation/ari-continuity-stage.js
// Ari Continuity Stage
//
// Purpose:
// Coordinate structured continuity retrieval, elliptical follow-up
// reconstruction, reference binding, and context assembly during deliberation.
//
// V2.1.0 — Elliptical Follow-Up Preservation / Resolved-Turn Handoff
//
// Architecture:
//
// Perception Packet
//      ↓
// Continuity Eligibility
//      ↓
// Continuity Entry Point
//      ├── Thread Understanding
//      ├── Elliptical Follow-Up Resolution
//      ├── Entity / Reference Resolution
//      ├── Memory Retrieval
//      ├── Relationship Context
//      └── Continuity Packet
//      ↓
// Context Assembler
//      ↓
// Continuity Stage Packet
//
// Critical rules:
//
// 1. The original user text remains permanently preserved.
// 2. Elliptical follow-up resolution may reconstruct omitted context.
// 3. The resolved turn is stored separately from the original turn.
// 4. Elliptical resolution may not change the requested operation.
// 5. Reference resolution may bind entities, claims, events, options,
//    quantities, or prior propositions.
// 6. The Continuity Packet is built only by the Continuity Entry Point.
// 7. The Context Assembler receives both original and resolved turns.
// 8. This stage cannot choose semantic meaning, conversation function,
//    safety severity, route, planner, or final response language.
// 9. The legacy Thread Question Generator remains non-authoritative.

window.Ari = window.Ari || {};

window.AriContinuityStage = {
  version:
    "2.1.0",

  schemaVersion:
    "1.1.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(
    summary = {},
    runtime = {}
  ) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activeDeliberationStage:
        "continuity"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const laneRouting =
      state.laneSplit?.routing ||
      state.routingDecision ||
      {};

    const continuityEligibility =
      this.buildContinuityEligibility({
        state,
        executivePacket,
        runInstructions,
        laneRouting
      });

    state = {
      ...state,

      shouldUseContinuity:
        continuityEligibility.eligible,

      continuityEligibility
    };

    // =================================================
    // 1. Continuity Entry Point
    // =================================================

    mark(
      "before continuityEntryPoint"
    );

    const continuityResults =
      await this.runContinuityEntryPoint({
        state,
        continuityEligibility
      });

    mark(
      "after continuityEntryPoint"
    );

    state =
      this.attachContinuityResults({
        state,
        continuityResults
      });

    // =================================================
    // 2. Read official Continuity Packet
    // =================================================

    /*
     * The Continuity Entry Point already builds the official
     * Continuity Packet.
     *
     * This stage consumes that packet and must not build a
     * second competing packet.
     */

    const continuityPacket =
      this.readContinuityPacket(
        continuityResults
      );

    state =
      this.attachContinuityPacket({
        state,
        continuityPacket
      });

    // =================================================
    // 3. Read all structured continuity outputs
    // =================================================

    const structuredOutputs =
      this.readStructuredOutputs({
        continuityResults,
        continuityPacket
      });

    state = {
      ...state,

      threadContext:
        structuredOutputs
          .threadContext,

      threadUnderstanding:
        structuredOutputs
          .threadUnderstanding,

      threadWorkingContext:
        structuredOutputs
          .threadWorkingContext,

      ellipticalFollowUpResolverResult:
        structuredOutputs
          .ellipticalOutput,

      ellipticalFollowUpResolution:
        structuredOutputs
          .ellipticalResolution,

      ellipticalFollowUpStatus:
        structuredOutputs
          .ellipticalStatus,

      ellipticalFollowUpDetected:
        structuredOutputs
          .ellipticalStatus
          .detected ===
        true,

      ellipticalFollowUpResolved:
        structuredOutputs
          .ellipticalStatus
          .resolved ===
        true,

      ellipticalRequiresClarification:
        structuredOutputs
          .ellipticalStatus
          .requiresClarification ===
        true,

      followUpFamily:
        structuredOutputs
          .ellipticalStatus
          .family ||
        state.followUpFamily ||
        null,

      followUpOperation:
        structuredOutputs
          .ellipticalStatus
          .operation ||
        state.followUpOperation ||
        null,

      inheritedSubject:
        structuredOutputs
          .ellipticalStatus
          .inheritedSubject ||
        null,

      inheritedTarget:
        structuredOutputs
          .ellipticalStatus
          .inheritedTarget ||
        null,

      inheritedObject:
        structuredOutputs
          .ellipticalStatus
          .inheritedObject ||
        null,

      inheritedProposition:
        structuredOutputs
          .ellipticalStatus
          .inheritedProposition ||
        null,

      inheritedEvent:
        structuredOutputs
          .ellipticalStatus
          .inheritedEvent ||
        null,

      inheritedOption:
        structuredOutputs
          .ellipticalStatus
          .inheritedOption ||
        null,

      inheritedQuantity:
        structuredOutputs
          .ellipticalStatus
          .inheritedQuantity ||
        null,

      referenceResolution:
        structuredOutputs
          .referenceResolution,

      entityReferenceState:
        structuredOutputs
          .entityReferenceState,

      resolvedReferences:
        structuredOutputs
          .resolvedReferences,

      unresolvedReferences:
        structuredOutputs
          .unresolvedReferences,

      memoryContinuityContext:
        structuredOutputs
          .memoryContext,

      relationshipContinuityContext:
        structuredOutputs
          .relationshipContext
    };

    // =================================================
    // 4. Resolve authoritative current-turn records
    // =================================================

    /*
     * The original message and the resolved interpretation are
     * deliberately stored as separate fields.
     *
     * Example:
     *
     * originalUserMessage:
     *   "Why"
     *
     * resolvedUserQuestion:
     *   "Why would you choose blue iris as your favorite flower?"
     */

    const currentTurn =
      this.buildCurrentTurnRecord({
        state,
        continuityResults,
        continuityPacket,
        structuredOutputs
      });

    state = {
      ...state,

      continuityCurrentTurn:
        currentTurn,

      originalUserMessage:
        currentTurn.originalText,

      resolvedUserQuestion:
        currentTurn.resolvedText,

      resolvedCurrentTurnText:
        currentTurn.resolvedText,

      resolvedCurrentTurn:
        currentTurn.resolvedCurrentTurn,

      currentTurnWasResolved:
        currentTurn
          .currentTurnWasResolved ===
        true,

      currentTurnTextRewritten:
        false,

      originalCurrentTurnPreserved:
        true
    };

    // =================================================
    // 5. Context Assembler
    // =================================================

    mark(
      "before contextAssembler"
    );

    const contextAssemblerResult =
      await this.runContextAssembler({
        state,
        structuredOutputs,
        continuityResults,
        continuityPacket,
        currentTurn
      });

    mark(
      "after contextAssembler"
    );

    state =
      this.attachContextAssemblerResult({
        state,
        contextAssemblerResult
      });

    // =================================================
    // 6. Continuity binding contract
    // =================================================

    state = {
      ...state,

      continuityReferenceBinding:
        this.buildReferenceBinding({
          state,
          currentTurn,
          structuredOutputs
        }),

      continuityEllipticalBinding:
        this.buildEllipticalBinding({
          state,
          currentTurn,
          structuredOutputs
        })
    };

    // =================================================
    // 7. Preserve semantic history as evidence only
    // =================================================

    state = {
      ...state,

      conversationMeaningHistory:
        this.arrayFrom(
          state
            .conversationMeaningHistory ||
          state.threadState
            ?.conversationMeaningHistory
        ),

      activeSemanticTimeline:
        this.arrayFrom(
          state.activeSemanticTimeline ||
          state.threadState
            ?.activeSemanticTimeline
        ),

      priorMeaningEvidence:
        this.readPriorMeaningEvidence(
          state
        )
    };

    // =================================================
    // 8. Legacy Thread Question diagnostic
    // =================================================

    /*
     * The legacy Thread Question Generator remains disabled.
     *
     * The diagnostic now reports the result produced by the
     * canonical Elliptical Follow-Up Resolver instead of falsely
     * reporting that all current-turn reconstruction is disabled.
     */

    state.threadQuestion =
      this.buildLegacyThreadQuestionDiagnostic({
        state,
        currentTurn,
        structuredOutputs
      });

    // =================================================
    // 9. Continuity Stage Packet
    // =================================================

    state.continuityStagePacket =
      this.buildContinuityStagePacket(
        state
      );

    state.continuityStageRan =
      true;

    state.continuityStageSource =
      "ari-continuity-stage";

    state.continuityStageVersion =
      this.version;

    return state;
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  buildContinuityEligibility({
    state = {},
    executivePacket = {},
    runInstructions = {},
    laneRouting = {}
  } = {}) {
    const useThread =
      runInstructions.thread ===
        true ||
      runInstructions.useThread ===
        true ||
      laneRouting.useThread ===
        true;

    const explicitEllipticalDisabled =
      runInstructions
        .ellipticalFollowUpResolution ===
        false ||
      runInstructions
        .useEllipticalFollowUpResolution ===
        false ||
      laneRouting
        .ellipticalFollowUpResolution ===
        false ||
      laneRouting
        .useEllipticalFollowUpResolution ===
        false ||
      laneRouting.elliptical ===
        false;

    const useEllipticalFollowUpResolution =
      explicitEllipticalDisabled
        ? false
        : (
            runInstructions
              .ellipticalFollowUpResolution ===
              true ||
            runInstructions
              .useEllipticalFollowUpResolution ===
              true ||
            laneRouting
              .ellipticalFollowUpResolution ===
              true ||
            laneRouting
              .useEllipticalFollowUpResolution ===
              true ||
            laneRouting.elliptical ===
              true ||
            useThread
          );

    const useMemory =
      runInstructions.memory ===
        true ||
      runInstructions.useMemory ===
        true ||
      laneRouting.useMemory ===
        true;

    const useRelationship =
      runInstructions.relationship ===
        true ||
      runInstructions
        .useRelationship ===
        true ||
      laneRouting
        .useRelationship ===
        true;

    const explicitReferenceDisabled =
      runInstructions
        .referenceResolution ===
        false ||
      runInstructions
        .useReferenceResolution ===
        false ||
      laneRouting
        .referenceResolution ===
        false ||
      laneRouting
        .useReferenceResolution ===
        false;

    const useReferenceResolution =
      explicitReferenceDisabled
        ? false
        : (
            runInstructions
              .referenceResolution ===
              true ||
            runInstructions
              .useReferenceResolution ===
              true ||
            laneRouting
              .useReferenceResolution ===
              true ||
            useThread
          );

    const eligible =
      runInstructions.continuity ===
        true ||
      state.shouldUseContinuity ===
        true ||
      useThread ||
      useEllipticalFollowUpResolution ||
      useReferenceResolution ||
      useMemory ||
      useRelationship;

    return {
      eligible,

      useThread,

      useEllipticalFollowUpResolution,

      useReferenceResolution,

      useMemory,

      useRelationship,

      source:
        executivePacket.ready
          ? "executive_packet"
          : state.routingContract
              ?.run
            ? "routing_contract"
            : "legacy_lane_splitter",

      reason:
        eligible
          ? "continuity_capability_requested"
          : "continuity_not_required",

      authority:
        "upstream_routing_preserved"
    };
  },

  /* =====================================================
     CONTINUITY ENTRY POINT
  ===================================================== */

  async runContinuityEntryPoint({
    state = {},
    continuityEligibility = {}
  } = {}) {
    const entryPoint =
      window.Ari
        ?.continuityEntryPoint ||
      null;

    if (
      !entryPoint ||
      typeof entryPoint.enter !==
        "function"
    ) {
      return this.emptyContinuityResults({
        state,
        continuityEligibility,

        reason:
          "continuity_entry_point_not_loaded",

        source:
          "not-loaded"
      });
    }

    try {
      const result =
        await entryPoint.enter({
          summary:
            state,

          executivePacket:
            state.executivePacket ||
            null,

          routingContract:
            state.routingContract ||
            null,

          laneSplit:
            this.buildEntryPointLaneSplit({
              state,
              continuityEligibility
            }),

          eligibility:
            continuityEligibility
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return this.emptyContinuityResults({
          state,
          continuityEligibility,

          reason:
            "continuity_entry_point_returned_invalid_result",

          source:
            "invalid-result"
        });
      }

      return result;
    } catch (error) {
      console.error(
        "Ari continuity entry point error:",
        error
      );

      return this.emptyContinuityResults({
        state,
        continuityEligibility,

        reason:
          error?.message ||
          String(error),

        source:
          "stage-error"
      });
    }
  },

  buildEntryPointLaneSplit({
    state = {},
    continuityEligibility = {}
  } = {}) {
    const existing =
      state.laneSplit ||
      {};

    const existingRouting =
      existing.routing ||
      {};

    return {
      ...existing,

      lane:
        existing.lane ||
        state.contextLane ||
        (
          continuityEligibility.eligible
            ? "continuity_follow_up"
            : "direct_current_turn"
        ),

      routing: {
        ...existingRouting,

        useThread:
          continuityEligibility
            .useThread,

        useEllipticalFollowUpResolution:
          continuityEligibility
            .useEllipticalFollowUpResolution,

        ellipticalFollowUpResolution:
          continuityEligibility
            .useEllipticalFollowUpResolution,

        useReferenceResolution:
          continuityEligibility
            .useReferenceResolution,

        useMemory:
          continuityEligibility
            .useMemory,

        useRelationship:
          continuityEligibility
            .useRelationship,

        goStraightToSituationMap:
          !continuityEligibility
            .eligible
      }
    };
  },

  attachContinuityResults({
    state = {},
    continuityResults = {}
  } = {}) {
    return {
      ...state,

      continuityResults,

      continuityEntryPointRan:
        continuityResults.ran ===
        true,

      continuityEntryPointSource:
        continuityResults.source ||
        "unknown",

      continuityEntryPointReason:
        continuityResults.reason ||
        null,

      continuityEntryPointUsed:
        continuityResults.used ||
        {},

      continuityEntryPointOutputs:
        continuityResults.outputs ||
        {},

      continuityEntryPointWarnings:
        this.arrayFrom(
          continuityResults.warnings
        ),

      continuityExecutionOrder:
        this.arrayFrom(
          continuityResults
            .executionOrder
        ),

      continuityEntryPointQuality:
        continuityResults.quality ||
        null,

      continuityEntryPointConfidence:
        continuityResults.confidence ??
        null,

      continuityEntryPointResolvedQuestion:
        continuityResults
          .resolvedUserQuestion ||
        null,

      continuityEntryPointCurrentTurnWasResolved:
        continuityResults
          .currentTurnWasResolved ===
        true,

      continuityEntryPointEllipticalStatus:
        continuityResults
          .ellipticalFollowUp ||
        null
    };
  },

  emptyContinuityResults({
    state = {},
    continuityEligibility = {},
    reason = "continuity_not_required",
    source = "ari-continuity-stage"
  } = {}) {
    const originalText =
      this.getOriginalText(
        state
      );

    return {
      schema:
        "ari_continuity_results",

      schemaVersion:
        this.schemaVersion,

      engine:
        "ari-continuity-entry-point",

      version:
        window.Ari
          ?.continuityEntryPoint
          ?.version ||
        null,

      source,

      ran:
        false,

      reason,

      lane:
        state.laneSplit?.lane ||
        state.contextLane ||
        "direct_current_turn",

      currentTurn: {
        originalText,

        text:
          originalText,

        resolvedText:
          originalText,

        currentTurnWasResolved:
          false,

        needsPriorContext:
          continuityEligibility
            .eligible ===
          true,

        preservedExactly:
          true
      },

      originalUserMessage:
        originalText,

      resolvedUserQuestion:
        originalText,

      resolvedCurrentTurn:
        null,

      currentTurnWasResolved:
        false,

      ellipticalFollowUp:
        this.emptyEllipticalStatus({
          reason
        }),

      routing: {
        useThread:
          continuityEligibility
            .useThread ===
          true,

        useEllipticalFollowUpResolution:
          continuityEligibility
            .useEllipticalFollowUpResolution ===
          true,

        useReferenceResolution:
          continuityEligibility
            .useReferenceResolution ===
          true,

        useMemory:
          continuityEligibility
            .useMemory ===
          true,

        useRelationship:
          continuityEligibility
            .useRelationship ===
          true,

        goStraightToSituationMap:
          continuityEligibility
            .eligible !==
          true
      },

      executionOrder: [],

      used: {
        thread:
          false,

        elliptical:
          false,

        reference:
          false,

        entity:
          false,

        memory:
          false,

        relationship:
          false,

        packet:
          false
      },

      outputs: {
        thread:
          null,

        elliptical:
          null,

        reference:
          null,

        entity:
          null,

        memory:
          null,

        relationship:
          null,

        packet:
          null
      },

      packet:
        null,

      continuityPacket:
        null,

      warnings:
        reason ===
        "continuity_not_required"
          ? []
          : [
              {
                type:
                  "continuity_entry_point_failure",

                error:
                  reason
              }
            ],

      quality: {
        ready:
          continuityEligibility
            .eligible !==
          true,

        healthy:
          continuityEligibility
            .eligible !==
          true,

        confidence:
          continuityEligibility
            .eligible
            ? 0
            : 1
      },

      confidence:
        continuityEligibility
          .eligible
          ? 0
          : 1
    };
  },

  /* =====================================================
     CONTINUITY PACKET
  ===================================================== */

  readContinuityPacket(
    continuityResults = {}
  ) {
    const candidates = [
      continuityResults
        .continuityPacket,

      continuityResults.packet,

      continuityResults
        .outputs
        ?.packet
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object"
      );

    if (found) {
      return found;
    }

    return {
      schema:
        "ari_continuity_packet",

      schemaVersion:
        "1.0.0",

      engine:
        "ari-continuity-packet",

      version:
        window.Ari
          ?.continuityPacket
          ?.version ||
        null,

      source:
        "ari-continuity-stage-fallback",

      ran:
        false,

      ready:
        false,

      reason:
        "continuity_packet_missing_from_entry_point",

      continuityType:
        continuityResults.lane ||
        "unknown",

      currentTurn:
        continuityResults.currentTurn ||
        {},

      originalUserMessage:
        continuityResults
          .originalUserMessage ||
        continuityResults
          .currentTurn
          ?.originalText ||
        null,

      resolvedUserQuestion:
        continuityResults
          .resolvedUserQuestion ||
        continuityResults
          .currentTurn
          ?.resolvedText ||
        null,

      currentTurnWasResolved:
        continuityResults
          .currentTurnWasResolved ===
        true,

      ellipticalFollowUp:
        continuityResults
          .ellipticalFollowUp ||
        null,

      activeThread: {},

      referencedContext: {},

      usableFacts: [],

      usableFactCount:
        0,

      unresolvedReferences: [],

      unresolvedReferenceCount:
        0,

      resolvedReferences: [],

      resolvedReferenceCount:
        0,

      warnings: [
        {
          type:
            "continuity_packet_missing",

          source:
            "ari-continuity-stage"
        }
      ],

      confidence:
        0,

      situationMapHandoff: {
        ready:
          false,

        shouldUseAsContext:
          false
      }
    };
  },

  attachContinuityPacket({
    state = {},
    continuityPacket = {}
  } = {}) {
    const usableFacts =
      this.arrayFrom(
        continuityPacket.usableFacts
      );

    const unresolvedReferences =
      this.arrayFrom(
        continuityPacket
          .unresolvedReferences
      );

    const resolvedReferences =
      this.arrayFrom(
        continuityPacket
          .resolvedReferences ||
        continuityPacket
          .referenceResolution
          ?.resolvedReferences
      );

    return {
      ...state,

      continuityPacket,

      continuityPacketRan:
        continuityPacket.ran ===
          true ||
        continuityPacket.ready ===
          true,

      continuityPacketReady:
        continuityPacket.ready ===
          true,

      continuityPacketSource:
        continuityPacket.source ||
        "unknown",

      continuityType:
        continuityPacket
          .continuityType ||
        null,

      continuityCurrentTurn:
        continuityPacket.currentTurn ||
        {},

      continuityPacketOriginalUserMessage:
        continuityPacket
          .originalUserMessage ||
        null,

      continuityPacketResolvedUserQuestion:
        continuityPacket
          .resolvedUserQuestion ||
        null,

      continuityPacketCurrentTurnWasResolved:
        continuityPacket
          .currentTurnWasResolved ===
        true,

      continuityPacketEllipticalFollowUp:
        continuityPacket
          .ellipticalFollowUp ||
        continuityPacket
          .ellipticalFollowUpResolution ||
        null,

      continuityActiveThread:
        continuityPacket.activeThread ||
        {},

      continuityReferencedContext:
        continuityPacket
          .referencedContext ||
        {},

      continuityUsableFacts:
        usableFacts,

      continuityUsableFactCount:
        continuityPacket
          .usableFactCount ??
        usableFacts.length,

      continuityUnresolvedReferences:
        unresolvedReferences,

      continuityUnresolvedReferenceCount:
        continuityPacket
          .unresolvedReferenceCount ??
        unresolvedReferences.length,

      continuityResolvedReferences:
        resolvedReferences,

      continuityResolvedReferenceCount:
        continuityPacket
          .resolvedReferenceCount ??
        resolvedReferences.length,

      continuityPacketConfidence:
        continuityPacket.confidence ??
        null,

      continuitySituationMapHandoff:
        continuityPacket
          .situationMapHandoff ||
        {}
    };
  },

  /* =====================================================
     STRUCTURED OUTPUT READING
  ===================================================== */

  readStructuredOutputs({
    continuityResults = {},
    continuityPacket = {}
  } = {}) {
    const outputs =
      continuityResults.outputs ||
      {};

    const threadContext =
      outputs.thread ||
      continuityPacket
        .threadContext ||
      continuityPacket
        .activeThread ||
      null;

    const threadUnderstanding =
      threadContext
        ?.threadUnderstanding ||
      threadContext
        ?.threadContext ||
      threadContext ||
      null;

    const threadWorkingContext =
      threadContext
        ?.workingContext ||
      threadUnderstanding
        ?.workingContext ||
      continuityPacket
        .activeThread
        ?.workingContext ||
      null;

    const ellipticalOutput =
      outputs.elliptical ||
      continuityResults
        .ellipticalFollowUpResolverResult ||
      continuityPacket
        .ellipticalFollowUpResolverResult ||
      null;

    const ellipticalResolution =
      ellipticalOutput
        ?.ellipticalFollowUpResolution ||
      continuityResults
        .ellipticalFollowUpResolution ||
      continuityPacket
        .ellipticalFollowUpResolution ||
      null;

    const ellipticalStatus =
      this.readEllipticalStatus({
        continuityResults,
        continuityPacket,
        ellipticalOutput,
        ellipticalResolution
      });

    const referenceResolution =
      outputs.reference ||
      outputs.entity ||
      continuityPacket
        .referenceResolution ||
      null;

    const entityReferenceState =
      referenceResolution
        ?.entityReferenceState ||
      referenceResolution
        ?.subjectGraphState ||
      referenceResolution ||
      null;

    const resolvedReferences =
      this.arrayFrom(
        referenceResolution
          ?.resolvedReferences ||
        referenceResolution
          ?.references ||
        entityReferenceState
          ?.resolvedReferences ||
        entityReferenceState
          ?.references ||
        continuityPacket
          .resolvedReferences
      );

    const unresolvedReferences =
      this.arrayFrom(
        referenceResolution
          ?.unresolvedReferences ||
        entityReferenceState
          ?.unresolvedReferences ||
        continuityPacket
          .unresolvedReferences
      );

    const memoryContext =
      outputs.memory ||
      continuityPacket
        .memoryContext ||
      null;

    const relationshipContext =
      outputs.relationship ||
      continuityPacket
        .relationshipContext ||
      null;

    return {
      threadContext,

      threadUnderstanding,

      threadWorkingContext,

      ellipticalOutput,

      ellipticalResolution,

      ellipticalStatus,

      referenceResolution,

      entityReferenceState,

      resolvedReferences,

      unresolvedReferences,

      memoryContext,

      relationshipContext
    };
  },

  readEllipticalStatus({
    continuityResults = {},
    continuityPacket = {},
    ellipticalOutput = null,
    ellipticalResolution = null
  } = {}) {
    const existing =
      continuityResults
        .ellipticalFollowUp ||
      continuityPacket
        .ellipticalFollowUp ||
      null;

    const resolvedCurrentTurn =
      ellipticalOutput
        ?.resolvedCurrentTurn ||
      ellipticalResolution
        ?.resolvedCurrentTurn ||
      continuityResults
        .resolvedCurrentTurn ||
      null;

    const detected =
      existing?.detected ===
        true ||
      ellipticalOutput
        ?.ellipticalFollowUpDetected ===
        true ||
      ellipticalResolution
        ?.detected ===
        true;

    const currentTurnWasResolved =
      existing
        ?.currentTurnWasResolved ===
        true ||
      continuityResults
        .currentTurnWasResolved ===
        true ||
      ellipticalOutput
        ?.currentTurnWasResolved ===
        true ||
      ellipticalResolution
        ?.currentTurnWasResolved ===
        true ||
      resolvedCurrentTurn
        ?.currentTurnWasResolved ===
        true;

    const resolvedText =
      this.clean(
        existing?.resolvedText ||
        continuityResults
          .resolvedUserQuestion ||
        ellipticalOutput
          ?.resolvedUserQuestion ||
        ellipticalOutput
          ?.resolvedCurrentTurnText ||
        ellipticalResolution
          ?.resolvedText ||
        resolvedCurrentTurn
          ?.resolvedText ||
        resolvedCurrentTurn
          ?.text ||
        ""
      );

    const originalText =
      this.clean(
        existing?.originalText ||
        continuityResults
          .originalUserMessage ||
        ellipticalOutput
          ?.originalUserMessage ||
        ellipticalResolution
          ?.originalText ||
        resolvedCurrentTurn
          ?.originalText ||
        continuityResults
          .currentTurn
          ?.originalText ||
        ""
      );

    const resolved =
      existing?.resolved ===
        true ||
      (
        currentTurnWasResolved &&
        Boolean(resolvedText) &&
        this.normalize(
          resolvedText
        ) !==
        this.normalize(
          originalText
        )
      );

    const requiresClarification =
      existing
        ?.requiresClarification ===
        true ||
      ellipticalOutput
        ?.requiresClarification ===
        true ||
      ellipticalResolution
        ?.requiresClarification ===
        true ||
      resolvedCurrentTurn
        ?.requiresClarification ===
        true;

    return {
      ran:
        existing?.ran ===
          true ||
        ellipticalOutput
          ?.ellipticalFollowUpResolverRan ===
          true ||
        Boolean(
          ellipticalOutput &&
          !ellipticalOutput.error
        ),

      detected,

      resolved,

      currentTurnWasResolved,

      requiresClarification,

      family:
        existing?.family ||
        ellipticalOutput
          ?.followUpFamily ||
        ellipticalResolution
          ?.followUpFamily ||
        resolvedCurrentTurn
          ?.followUpFamily ||
        null,

      operation:
        existing?.operation ||
        ellipticalOutput
          ?.followUpOperation ||
        ellipticalResolution
          ?.followUpOperation ||
        resolvedCurrentTurn
          ?.followUpOperation ||
        null,

      originalText,

      resolvedText:
        resolvedText ||
        originalText,

      resolvedCurrentTurn,

      inheritedSubject:
        existing
          ?.inheritedSubject ||
        ellipticalOutput
          ?.inheritedSubject ||
        ellipticalResolution
          ?.inheritedSubject ||
        resolvedCurrentTurn
          ?.inheritedSubject ||
        null,

      inheritedTarget:
        existing
          ?.inheritedTarget ||
        ellipticalOutput
          ?.inheritedTarget ||
        ellipticalResolution
          ?.inheritedTarget ||
        resolvedCurrentTurn
          ?.inheritedTarget ||
        null,

      inheritedObject:
        existing
          ?.inheritedObject ||
        ellipticalOutput
          ?.inheritedObject ||
        ellipticalResolution
          ?.inheritedObject ||
        resolvedCurrentTurn
          ?.inheritedObject ||
        null,

      inheritedProposition:
        existing
          ?.inheritedProposition ||
        ellipticalOutput
          ?.inheritedProposition ||
        ellipticalResolution
          ?.inheritedProposition ||
        resolvedCurrentTurn
          ?.inheritedProposition ||
        null,

      inheritedEvent:
        existing
          ?.inheritedEvent ||
        ellipticalOutput
          ?.inheritedEvent ||
        ellipticalResolution
          ?.inheritedEvent ||
        resolvedCurrentTurn
          ?.inheritedEvent ||
        null,

      inheritedOption:
        existing
          ?.inheritedOption ||
        ellipticalOutput
          ?.inheritedOption ||
        ellipticalResolution
          ?.inheritedOption ||
        resolvedCurrentTurn
          ?.inheritedOption ||
        null,

      inheritedQuantity:
        existing
          ?.inheritedQuantity ||
        ellipticalOutput
          ?.inheritedQuantity ||
        ellipticalResolution
          ?.inheritedQuantity ||
        resolvedCurrentTurn
          ?.inheritedQuantity ||
        null,

      anchor:
        existing?.anchor ||
        ellipticalOutput
          ?.ellipticalFollowUpAnchor ||
        ellipticalResolution
          ?.anchor ||
        null,

      quality:
        existing?.quality ||
        ellipticalOutput
          ?.ellipticalFollowUpQuality ||
        ellipticalResolution
          ?.quality ||
        null,

      confidence:
        this.normalizeConfidence(
          existing?.confidence ??
          ellipticalOutput
            ?.confidence ??
          ellipticalResolution
            ?.confidence ??
          0
        ),

      warnings:
        this.arrayFrom(
          existing?.warnings ||
          ellipticalOutput
            ?.warnings ||
          ellipticalResolution
            ?.warnings
        ),

      authority:
        "elliptical_follow_up_status_summary_only"
    };
  },

  emptyEllipticalStatus({
    reason = "not_run"
  } = {}) {
    return {
      ran:
        false,

      detected:
        false,

      resolved:
        false,

      currentTurnWasResolved:
        false,

      requiresClarification:
        false,

      family:
        null,

      operation:
        null,

      originalText:
        null,

      resolvedText:
        null,

      resolvedCurrentTurn:
        null,

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

      anchor:
        null,

      quality:
        null,

      confidence:
        0,

      warnings:
        [],

      reason,

      authority:
        "elliptical_follow_up_status_summary_only"
    };
  },

  /* =====================================================
     CURRENT TURN RECORD
  ===================================================== */

  buildCurrentTurnRecord({
    state = {},
    continuityResults = {},
    continuityPacket = {},
    structuredOutputs = {}
  } = {}) {
    const ellipticalStatus =
      structuredOutputs
        .ellipticalStatus ||
      this.emptyEllipticalStatus();

    const originalText =
      this.clean(
        continuityResults
          .originalUserMessage ||
        ellipticalStatus
          .originalText ||
        continuityResults
          .currentTurn
          ?.originalText ||
        continuityPacket
          .originalUserMessage ||
        this.getOriginalText(
          state
        )
      );

    const candidateResolvedText =
      this.clean(
        continuityResults
          .resolvedUserQuestion ||
        ellipticalStatus
          .resolvedText ||
        continuityPacket
          .resolvedUserQuestion ||
        continuityResults
          .resolvedCurrentTurn
          ?.resolvedText ||
        structuredOutputs
          .ellipticalResolution
          ?.resolvedText ||
        originalText
      );

    const currentTurnWasResolved =
      continuityResults
        .currentTurnWasResolved ===
        true ||
      ellipticalStatus
        .currentTurnWasResolved ===
        true ||
      (
        Boolean(
          candidateResolvedText
        ) &&
        this.normalize(
          candidateResolvedText
        ) !==
        this.normalize(
          originalText
        )
      );

    const resolvedText =
      currentTurnWasResolved
        ? candidateResolvedText
        : originalText;

    const packetCurrentTurn =
      continuityPacket.currentTurn ||
      {};

    const perceptionCurrentTurn =
      state.perceptionPacket
        ?.currentTurn ||
      state.perceptionPacket
        ?.request ||
      state.currentTurnMeaning ||
      null;

    const resolvedCurrentTurn =
      structuredOutputs
        .ellipticalStatus
        ?.resolvedCurrentTurn ||
      continuityResults
        .resolvedCurrentTurn ||
      structuredOutputs
        .ellipticalOutput
        ?.resolvedCurrentTurn ||
      structuredOutputs
        .ellipticalResolution
        ?.resolvedCurrentTurn ||
      {
        originalText,

        text:
          resolvedText,

        resolvedText,

        currentTurnWasResolved,

        resolved:
          currentTurnWasResolved,

        requiresClarification:
          ellipticalStatus
            .requiresClarification ===
          true
      };

    return {
      schema:
        "ari_current_turn_continuity",

      schemaVersion:
        this.schemaVersion,

      originalText,

      text:
        originalText,

      resolvedText,

      normalizedText:
        this.readNormalizedText(
          state
        ),

      resolvedNormalizedText:
        this.normalize(
          resolvedText
        ),

      textPreserved:
        true,

      originalTextPreserved:
        true,

      textWasRewritten:
        false,

      currentTurnWasResolved,

      resolvedCurrentTurn,

      ellipticalFollowUpDetected:
        ellipticalStatus.detected ===
        true,

      ellipticalFollowUpResolved:
        ellipticalStatus.resolved ===
        true,

      ellipticalRequiresClarification:
        ellipticalStatus
          .requiresClarification ===
        true,

      followUpFamily:
        ellipticalStatus.family,

      followUpOperation:
        ellipticalStatus.operation,

      inheritedSubject:
        ellipticalStatus
          .inheritedSubject,

      inheritedTarget:
        ellipticalStatus
          .inheritedTarget,

      inheritedObject:
        ellipticalStatus
          .inheritedObject,

      inheritedProposition:
        ellipticalStatus
          .inheritedProposition,

      inheritedEvent:
        ellipticalStatus
          .inheritedEvent,

      inheritedOption:
        ellipticalStatus
          .inheritedOption,

      inheritedQuantity:
        ellipticalStatus
          .inheritedQuantity,

      needsPriorContext:
        packetCurrentTurn
          .needsPriorContext ===
          true ||
        state
          .continuityEligibility
          ?.eligible ===
          true,

      perceptionCurrentTurn,

      referenceCount:
        structuredOutputs
          .resolvedReferences
          .length,

      unresolvedReferenceCount:
        structuredOutputs
          .unresolvedReferences
          .length,

      lane:
        packetCurrentTurn.lane ||
        state.laneSplit?.lane ||
        state.contextLane ||
        null,

      authority:
        "original_and_resolved_current_turn_record"
    };
  },

  /* =====================================================
     CONTEXT ASSEMBLER
  ===================================================== */

  async runContextAssembler({
    state = {},
    structuredOutputs = {},
    continuityResults = {},
    continuityPacket = {},
    currentTurn = {}
  } = {}) {
    const assembler =
      window.Ari
        ?.contextAssembler ||
      window.AriContextAssembler ||
      null;

    if (
      !assembler ||
      typeof assembler.assemble !==
        "function"
    ) {
      return this.emptyAssemblerResult({
        reason:
          "context_assembler_not_loaded"
      });
    }

    const ellipticalStatus =
      structuredOutputs
        .ellipticalStatus ||
      this.emptyEllipticalStatus();

    const assemblerSummary = {
      ...state,

      continuityResults,

      continuityPacket,

      originalUserMessage:
        currentTurn.originalText,

      resolvedUserQuestion:
        currentTurn.resolvedText,

      resolvedCurrentTurnText:
        currentTurn.resolvedText,

      resolvedCurrentTurn:
        currentTurn.resolvedCurrentTurn,

      currentTurnWasResolved:
        currentTurn
          .currentTurnWasResolved ===
        true,

      ellipticalFollowUpResolverResult:
        structuredOutputs
          .ellipticalOutput,

      ellipticalFollowUpResolution:
        structuredOutputs
          .ellipticalResolution,

      ellipticalFollowUpStatus:
        ellipticalStatus,

      ellipticalFollowUpDetected:
        ellipticalStatus.detected ===
        true,

      ellipticalFollowUpResolved:
        ellipticalStatus.resolved ===
        true,

      ellipticalRequiresClarification:
        ellipticalStatus
          .requiresClarification ===
        true,

      followUpFamily:
        ellipticalStatus.family,

      followUpOperation:
        ellipticalStatus.operation,

      inheritedSubject:
        ellipticalStatus
          .inheritedSubject,

      inheritedTarget:
        ellipticalStatus
          .inheritedTarget,

      inheritedObject:
        ellipticalStatus
          .inheritedObject,

      inheritedProposition:
        ellipticalStatus
          .inheritedProposition,

      inheritedEvent:
        ellipticalStatus
          .inheritedEvent,

      inheritedOption:
        ellipticalStatus
          .inheritedOption,

      inheritedQuantity:
        ellipticalStatus
          .inheritedQuantity,

      threadContext:
        structuredOutputs
          .threadContext,

      threadUnderstanding:
        structuredOutputs
          .threadUnderstanding,

      threadWorkingContext:
        structuredOutputs
          .threadWorkingContext,

      referenceResolution:
        structuredOutputs
          .referenceResolution,

      entityReference:
        structuredOutputs
          .referenceResolution,

      entityReferenceState:
        structuredOutputs
          .entityReferenceState,

      resolvedReferences:
        structuredOutputs
          .resolvedReferences,

      unresolvedReferences:
        structuredOutputs
          .unresolvedReferences,

      memoryContext:
        structuredOutputs
          .memoryContext ||
        state.memoryContext ||
        {},

      relationshipProfile:
        structuredOutputs
          .relationshipContext ||
        state.relationshipProfile ||
        {}
    };

    try {
      const result =
        await assembler.assemble({
          summary:
            assemblerSummary,

          continuityResults,

          continuityPacket,

          currentTurn,

          originalUserMessage:
            currentTurn.originalText,

          resolvedUserQuestion:
            currentTurn.resolvedText,

          resolvedCurrentTurn:
            currentTurn.resolvedCurrentTurn,

          ellipticalFollowUpResolution:
            structuredOutputs
              .ellipticalResolution,

          threadContext:
            structuredOutputs
              .threadContext,

          referenceResolution:
            structuredOutputs
              .referenceResolution
        });

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return this.emptyAssemblerResult({
          reason:
            "context_assembler_returned_invalid_result"
        });
      }

      return result;
    } catch (error) {
      console.error(
        "Ari context assembler error:",
        error
      );

      return this.emptyAssemblerResult({
        reason:
          error?.message ||
          String(error)
      });
    }
  },

  emptyAssemblerResult({
    reason =
      "context_assembler_unavailable"
  } = {}) {
    return {
      contextAssemblerRan:
        false,

      contextAssemblerVersion:
        window.AriContextAssembler
          ?.version ||
        null,

      contextAssemblerSource:
        "ari-continuity-stage-fallback",

      assembledContext:
        null,

      advisoryContext:
        null,

      continuityContext: {
        ready:
          false,

        shouldUseAsContext:
          false,

        source:
          "ari-continuity-stage-fallback"
      },

      semanticFrame:
        null,

      activeSemanticFrame:
        null,

      activeSituation:
        null,

      keyFacts: [],

      activeThreadFacts: [],

      activeEntities: [],

      activeProblems: [],

      activeGoals: [],

      activeConstraints: [],

      activeAttempts: [],

      domainSignals: [],

      intentSignals: [],

      contextConflicts: [],

      warning: {
        type:
          "context_assembler_failure",

        reason
      },

      authority:
        "advisory_context_only"
    };
  },

  attachContextAssemblerResult({
    state = {},
    contextAssemblerResult = {}
  } = {}) {
    const assembledContext =
      contextAssemblerResult
        .assembledContext ||
      contextAssemblerResult
        .advisoryContext ||
      null;

    return {
      ...state,

      contextAssemblerResult,

      contextAssemblerRan:
        contextAssemblerResult
          .contextAssemblerRan ===
        true,

      contextAssemblerSource:
        contextAssemblerResult
          .contextAssemblerSource ||
        "unknown",

      contextAssemblerVersion:
        contextAssemblerResult
          .contextAssemblerVersion ||
        null,

      assembledContext,

      advisoryContext:
        contextAssemblerResult
          .advisoryContext ||
        assembledContext,

      continuityContext:
        contextAssemblerResult
          .continuityContext ||
        null,

      activeDialogueState:
        contextAssemblerResult
          .activeDialogueState ||
        assembledContext
          ?.activeDialogueState ||
        state.activeDialogueState ||
        null,

      characterContext:
        contextAssemblerResult
          .characterContext ||
        assembledContext
          ?.characterContext ||
        state.characterContext ||
        null,

      characterIdentity:
        contextAssemblerResult
          .characterIdentity ||
        assembledContext
          ?.characterIdentity ||
        state.characterIdentity ||
        null,

      continuitySemanticFrame:
        contextAssemblerResult
          .semanticFrame ||
        assembledContext
          ?.semanticFrame ||
        null,

      continuityActiveSemanticFrame:
        contextAssemblerResult
          .activeSemanticFrame ||
        assembledContext
          ?.activeSemanticFrame ||
        null,

      continuityActiveSituation:
        contextAssemblerResult
          .activeSituation ||
        assembledContext
          ?.activeSituation ||
        null,

      continuityKeyFacts:
        this.arrayFrom(
          contextAssemblerResult
            .keyFacts ||
          assembledContext
            ?.keyFacts
        ),

      continuityAdvisoryFacts:
        this.arrayFrom(
          contextAssemblerResult
            .advisoryFacts ||
          assembledContext
            ?.advisoryFacts
        ),

      activeThreadFacts:
        this.arrayFrom(
          contextAssemblerResult
            .activeThreadFacts ||
          assembledContext
            ?.activeThreadFacts ||
          state.activeThreadFacts
        ),

      continuityActiveEntities:
        this.arrayFrom(
          contextAssemblerResult
            .activeEntities ||
          assembledContext
            ?.activeEntities
        ),

      continuityActiveProblems:
        this.arrayFrom(
          contextAssemblerResult
            .activeProblems ||
          assembledContext
            ?.activeProblems
        ),

      continuityActiveGoals:
        this.arrayFrom(
          contextAssemblerResult
            .activeGoals ||
          assembledContext
            ?.activeGoals
        ),

      continuityActiveConstraints:
        this.arrayFrom(
          contextAssemblerResult
            .activeConstraints ||
          assembledContext
            ?.activeConstraints
        ),

      continuityActiveAttempts:
        this.arrayFrom(
          contextAssemblerResult
            .activeAttempts ||
          assembledContext
            ?.activeAttempts
        ),

      continuityDomainSignals:
        this.arrayFrom(
          contextAssemblerResult
            .domainSignals ||
          assembledContext
            ?.domainSignals
        ),

      continuityIntentSignals:
        this.arrayFrom(
          contextAssemblerResult
            .intentSignals ||
          assembledContext
            ?.intentSignals
        ),

      continuityContextConflicts:
        this.arrayFrom(
          contextAssemblerResult
            .contextConflicts ||
          assembledContext
            ?.conflicts
        )
    };
  },

  /* =====================================================
     ELLIPTICAL BINDING
  ===================================================== */

  buildEllipticalBinding({
    state = {},
    currentTurn = {},
    structuredOutputs = {}
  } = {}) {
    const status =
      structuredOutputs
        .ellipticalStatus ||
      this.emptyEllipticalStatus();

    return {
      schema:
        "ari_elliptical_follow_up_binding",

      schemaVersion:
        "1.0.0",

      ran:
        status.ran ===
        true,

      detected:
        status.detected ===
        true,

      resolved:
        status.resolved ===
        true,

      ready:
        status.detected !==
          true ||
        status.resolved ===
          true ||
        status
          .requiresClarification ===
          true,

      originalText:
        currentTurn.originalText,

      resolvedText:
        currentTurn.resolvedText,

      originalTextPreserved:
        true,

      currentTurnWasResolved:
        currentTurn
          .currentTurnWasResolved ===
        true,

      requiresClarification:
        status
          .requiresClarification ===
        true,

      family:
        status.family,

      operation:
        status.operation,

      inheritedContext: {
        subject:
          status.inheritedSubject,

        target:
          status.inheritedTarget,

        object:
          status.inheritedObject,

        proposition:
          status
            .inheritedProposition,

        event:
          status.inheritedEvent,

        option:
          status.inheritedOption,

        quantity:
          status
            .inheritedQuantity
      },

      anchor:
        status.anchor,

      confidence:
        status.confidence,

      warnings:
        status.warnings,

      operationPreserved:
        true,

      requestedOutputPreserved:
        true,

      originalMessageOverwritten:
        false,

      rules: [
        "The original user message remains authoritative and unchanged.",
        "The resolved turn is an additional interpretation for downstream reasoning.",
        "Elliptical resolution may restore omitted context from the recent thread.",
        "Elliptical resolution may not change the requested operation.",
        "Elliptical resolution may not choose the final semantic frame.",
        "Ambiguous elliptical turns must remain unresolved or request clarification."
      ],

      raw:
        structuredOutputs
          .ellipticalResolution ||
        structuredOutputs
          .ellipticalOutput ||
        null,

      authority:
        "elliptical_follow_up_binding_only"
    };
  },

  /* =====================================================
     REFERENCE BINDING
  ===================================================== */

  buildReferenceBinding({
    state = {},
    currentTurn = {},
    structuredOutputs = {}
  } = {}) {
    const operationSignals =
      this.readOperationSignals(
        state
      );

    const requestedOutputSignals =
      this.readRequestedOutputSignals(
        state
      );

    return {
      schema:
        "ari_reference_binding",

      schemaVersion:
        "1.1.0",

      ready:
        structuredOutputs
          .resolvedReferences
          .length >
          0 ||
        structuredOutputs
          .unresolvedReferences
          .length ===
          0,

      originalText:
        currentTurn.originalText,

      resolvedText:
        currentTurn.resolvedText,

      originalTextPreserved:
        true,

      currentTurnWasResolved:
        currentTurn
          .currentTurnWasResolved ===
        true,

      operationSignals,

      requestedOutputSignals,

      resolvedReferences:
        structuredOutputs
          .resolvedReferences,

      unresolvedReferences:
        structuredOutputs
          .unresolvedReferences,

      threadContextAvailable:
        Boolean(
          structuredOutputs
            .threadContext
        ),

      ellipticalFollowUpAvailable:
        structuredOutputs
          .ellipticalStatus
          .ran ===
        true,

      ellipticalFollowUpDetected:
        structuredOutputs
          .ellipticalStatus
          .detected ===
        true,

      ellipticalFollowUpResolved:
        structuredOutputs
          .ellipticalStatus
          .resolved ===
        true,

      operationPreserved:
        true,

      requestedOutputPreserved:
        true,

      operationWasReinterpreted:
        false,

      originalTextWasRewritten:
        false,

      bindingRules: [
        "Reference resolution may bind entities, objects, events, claims, quantities, options, or prior propositions.",
        "Reference resolution may consume a separately resolved elliptical turn.",
        "Reference resolution may not change the requested operation.",
        "Reference resolution may not change the requested output.",
        "Reference resolution may not replace the original user text.",
        "Reference resolution may not select the final semantic frame."
      ],

      authority:
        "structured_reference_binding_only"
    };
  },

  readOperationSignals(
    state = {}
  ) {
    const candidates = [
      state.perceptionPacket
        ?.currentTurnMeaning
        ?.operationSignals,

      state.perceptionPacket
        ?.operationSignals,

      state.perceptionPacket
        ?.request
        ?.operationSignals,

      state.perceptionPacket
        ?.semanticSummary
        ?.operation,

      state.semanticSummary
        ?.operation,

      state.currentTurnMeaning
        ?.operationSignals
    ];

    const values = [];

    candidates.forEach(
      candidate => {
        if (
          Array.isArray(
            candidate
          )
        ) {
          values.push(
            ...candidate
          );

          return;
        }

        if (
          candidate !==
            null &&
          candidate !==
            undefined &&
          candidate !==
            ""
        ) {
          values.push(
            candidate
          );
        }
      }
    );

    return this.dedupeValues(
      values
    );
  },

  readRequestedOutputSignals(
    state = {}
  ) {
    const candidates = [
      state.perceptionPacket
        ?.currentTurnMeaning
        ?.requestedOutputSignals,

      state.perceptionPacket
        ?.requestedOutputSignals,

      state.perceptionPacket
        ?.request
        ?.requestedOutputSignals,

      state.perceptionPacket
        ?.semanticSummary
        ?.requestedOutput,

      state.semanticSummary
        ?.requestedOutput,

      state.currentTurnMeaning
        ?.requestedOutputSignals
    ];

    const values = [];

    candidates.forEach(
      candidate => {
        if (
          Array.isArray(
            candidate
          )
        ) {
          values.push(
            ...candidate
          );

          return;
        }

        if (
          candidate !==
            null &&
          candidate !==
            undefined &&
          candidate !==
            ""
        ) {
          values.push(
            candidate
          );
        }
      }
    );

    return this.dedupeValues(
      values
    );
  },

  readNormalizedText(
    state = {}
  ) {
    return String(
      state.perceptionPacket
        ?.normalizedText ||
      state.normalizedMessage ||
      state.normalizedText ||
      this.getOriginalText(
        state
      )
    ).trim();
  },

  /* =====================================================
     SEMANTIC HISTORY EVIDENCE
  ===================================================== */

  readPriorMeaningEvidence(
    state = {}
  ) {
    const history =
      this.arrayFrom(
        state
          .conversationMeaningHistory ||
        state.threadState
          ?.conversationMeaningHistory
      );

    const latest =
      state.latestConversationMeaning ||
      state.threadState
        ?.latestConversationMeaning ||
      history[
        history.length -
        1
      ] ||
      null;

    if (!latest) {
      return null;
    }

    return {
      latest,

      available:
        true,

      mayBeUsedByThreadResolution:
        state.continuityEligibility
          ?.useThread ===
        true,

      mayBeUsedByEllipticalResolution:
        state.continuityEligibility
          ?.useEllipticalFollowUpResolution ===
        true,

      automaticallyInherited:
        false,

      authority:
        "historical_evidence_only"
    };
  },

  /* =====================================================
     LEGACY THREAD QUESTION DIAGNOSTIC
  ===================================================== */

  buildLegacyThreadQuestionDiagnostic({
    state = {},
    currentTurn = {},
    structuredOutputs = {}
  } = {}) {
    const status =
      structuredOutputs
        .ellipticalStatus ||
      this.emptyEllipticalStatus();

    return {
      threadQuestionGeneratorRan:
        false,

      threadQuestionGeneratorVersion:
        window.Ari
          ?.threadQuestionGenerator
          ?.version ||
        null,

      source:
        "ari-continuity-stage",

      rawUserMessage:
        currentTurn.originalText,

      resolvedUserQuestion:
        currentTurn.resolvedText,

      currentTurnWasResolved:
        currentTurn
          .currentTurnWasResolved ===
        true,

      usedThreadContext:
        status.detected ===
          true ||
        state.continuityEligibility
          ?.useThread ===
          true,

      operation:
        status.operation ||
        "none",

      resolutionType:
        status.detected ===
          true
          ? "canonical_elliptical_follow_up_resolution"
          : "structured_reference_binding_only",

      confidence:
        status.detected ===
          true
          ? status.confidence
          : 1,

      reason:
        status.detected ===
          true
          ? (
              status.resolved ===
                true
                ? "The legacy question generator was bypassed. The canonical Elliptical Follow-Up Resolver reconstructed the omitted context."
                : "The legacy question generator was bypassed. The canonical Elliptical Follow-Up Resolver detected the follow-up but did not force an unsafe reconstruction."
            )
          : "The legacy question generator is disabled. No elliptical reconstruction was required.",

      resolvedCurrentTurn: {
        rawText:
          currentTurn.originalText,

        originalText:
          currentTurn.originalText,

        text:
          currentTurn.resolvedText,

        resolvedText:
          currentTurn.resolvedText,

        usedThreadContext:
          status.detected ===
          true,

        operation:
          status.operation ||
          "none",

        family:
          status.family ||
          null,

        currentTurnWasResolved:
          currentTurn
            .currentTurnWasResolved ===
          true,

        requiresClarification:
          status
            .requiresClarification ===
          true,

        confidence:
          status.detected ===
            true
            ? status.confidence
            : 1
      },

      authoritativeResolver: {
        name:
          "ari-elliptical-follow-up-resolver",

        ran:
          status.ran ===
          true,

        detected:
          status.detected ===
          true,

        resolved:
          status.resolved ===
          true,

        result:
          structuredOutputs
            .ellipticalResolution ||
          null
      },

      authority: {
        canChooseLane:
          false,

        canAnswerUser:
          false,

        canOverrideSafety:
          false,

        canSetContract:
          false,

        canInterpretIntent:
          false,

        canRewriteCurrentQuestion:
          false,

        canReportCanonicalEllipticalResolution:
          true,

        role:
          "legacy_diagnostic_only"
      }
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildContinuityStagePacket(
    summary = {}
  ) {
    const originalText =
      this.clean(
        summary.originalUserMessage ||
        this.getOriginalText(
          summary
        )
      );

    const resolvedText =
      this.clean(
        summary.resolvedUserQuestion ||
        summary.resolvedCurrentTurnText ||
        originalText
      );

    const currentTurnWasResolved =
      summary.currentTurnWasResolved ===
        true ||
      (
        Boolean(resolvedText) &&
        this.normalize(
          resolvedText
        ) !==
        this.normalize(
          originalText
        )
      );

    const resolvedReferences =
      this.arrayFrom(
        summary.resolvedReferences ||
        summary
          .continuityResolvedReferences ||
        summary.referenceResolution
          ?.resolvedReferences
      );

    const unresolvedReferences =
      this.arrayFrom(
        summary.unresolvedReferences ||
        summary
          .continuityUnresolvedReferences ||
        summary.referenceResolution
          ?.unresolvedReferences
      );

    const packetReady =
      summary.continuityPacketReady ===
        true ||
      summary.continuityPacket
        ?.ready ===
        true;

    const assemblerReady =
      summary.contextAssemblerRan ===
        true ||
      Boolean(
        summary.assembledContext
      );

    const continuityRequired =
      summary
        .continuityEligibility
        ?.eligible ===
      true;

    const ellipticalStatus =
      summary
        .ellipticalFollowUpStatus ||
      this.emptyEllipticalStatus();

    return {
      schema:
        "ari_continuity_stage_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        continuityRequired
          ? packetReady
          : true,

      source:
        "ari-continuity-stage",

      version:
        this.version,

      createdAt:
        new Date().toISOString(),

      eligibility:
        summary.continuityEligibility ||
        {
          eligible:
            false,

          useThread:
            false,

          useEllipticalFollowUpResolution:
            false,

          useReferenceResolution:
            false,

          useMemory:
            false,

          useRelationship:
            false
        },

      entryPoint: {
        ran:
          summary
            .continuityEntryPointRan ===
          true,

        source:
          summary
            .continuityEntryPointSource ||
          null,

        reason:
          summary
            .continuityEntryPointReason ||
          null,

        used:
          summary
            .continuityEntryPointUsed ||
          {},

        executionOrder:
          summary
            .continuityExecutionOrder ||
          [],

        outputs:
          summary
            .continuityEntryPointOutputs ||
          {},

        warnings:
          summary
            .continuityEntryPointWarnings ||
          [],

        quality:
          summary
            .continuityEntryPointQuality ||
          null,

        confidence:
          summary
            .continuityEntryPointConfidence ??
          null,

        raw:
          summary.continuityResults ||
          null
      },

      currentTurn: {
        originalText,

        text:
          originalText,

        resolvedText,

        normalizedText:
          summary
            .continuityCurrentTurn
            ?.normalizedText ||
          this.readNormalizedText(
            summary
          ),

        resolvedNormalizedText:
          this.normalize(
            resolvedText
          ),

        originalTextPreserved:
          true,

        textWasRewritten:
          false,

        currentTurnWasResolved,

        needsPriorContext:
          summary
            .continuityCurrentTurn
            ?.needsPriorContext ===
            true,

        lane:
          summary
            .continuityCurrentTurn
            ?.lane ||
          summary.contextLane ||
          null,

        perceptionMeaning:
          summary
            .continuityCurrentTurn
            ?.perceptionCurrentTurn ||
          summary.perceptionPacket
            ?.currentTurnMeaning ||
          null
      },

      ellipticalFollowUp: {
        ran:
          ellipticalStatus.ran ===
          true,

        detected:
          ellipticalStatus.detected ===
          true,

        resolved:
          ellipticalStatus.resolved ===
          true,

        currentTurnWasResolved,

        requiresClarification:
          ellipticalStatus
            .requiresClarification ===
          true,

        family:
          ellipticalStatus.family,

        operation:
          ellipticalStatus.operation,

        originalText,

        resolvedText,

        inheritedContext: {
          subject:
            ellipticalStatus
              .inheritedSubject,

          target:
            ellipticalStatus
              .inheritedTarget,

          object:
            ellipticalStatus
              .inheritedObject,

          proposition:
            ellipticalStatus
              .inheritedProposition,

          event:
            ellipticalStatus
              .inheritedEvent,

          option:
            ellipticalStatus
              .inheritedOption,

          quantity:
            ellipticalStatus
              .inheritedQuantity
        },

        anchor:
          ellipticalStatus.anchor,

        quality:
          ellipticalStatus.quality,

        confidence:
          ellipticalStatus.confidence,

        warnings:
          ellipticalStatus.warnings,

        binding:
          summary
            .continuityEllipticalBinding ||
          null,

        output:
          summary
            .ellipticalFollowUpResolverResult ||
          null,

        resolution:
          summary
            .ellipticalFollowUpResolution ||
          null
      },

      thread: {
        available:
          Boolean(
            summary.threadContext
          ),

        context:
          summary.threadContext ||
          null,

        understanding:
          summary.threadUnderstanding ||
          null,

        workingContext:
          summary
            .threadWorkingContext ||
          null
      },

      referenceResolution: {
        ran:
          summary
            .continuityEntryPointUsed
            ?.reference ===
            true ||
          summary
            .continuityEntryPointUsed
            ?.entity ===
            true,

        output:
          summary.referenceResolution ||
          null,

        entityState:
          summary.entityReferenceState ||
          null,

        binding:
          summary
            .continuityReferenceBinding ||
          null,

        resolvedReferences,

        resolvedReferenceCount:
          resolvedReferences.length,

        unresolvedReferences,

        unresolvedReferenceCount:
          unresolvedReferences.length,

        originalTextWasRewritten:
          false,

        resolvedTurnAvailable:
          currentTurnWasResolved,

        operationWasReinterpreted:
          false
      },

      memory: {
        used:
          summary
            .continuityEntryPointUsed
            ?.memory ===
          true,

        context:
          summary
            .memoryContinuityContext ||
          null
      },

      relationship: {
        used:
          summary
            .continuityEntryPointUsed
            ?.relationship ===
          true,

        context:
          summary
            .relationshipContinuityContext ||
          null
      },

      continuityPacket: {
        ran:
          summary
            .continuityPacketRan ===
          true,

        ready:
          packetReady,

        source:
          summary
            .continuityPacketSource ||
          null,

        type:
          summary.continuityType ||
          null,

        originalUserMessage:
          summary
            .continuityPacketOriginalUserMessage ||
          originalText,

        resolvedUserQuestion:
          summary
            .continuityPacketResolvedUserQuestion ||
          resolvedText,

        currentTurnWasResolved:
          summary
            .continuityPacketCurrentTurnWasResolved ===
            true ||
          currentTurnWasResolved,

        ellipticalFollowUp:
          summary
            .continuityPacketEllipticalFollowUp ||
          null,

        activeThread:
          summary
            .continuityActiveThread ||
          {},

        referencedContext:
          summary
            .continuityReferencedContext ||
          {},

        usableFacts:
          summary
            .continuityUsableFacts ||
          [],

        usableFactCount:
          summary
            .continuityUsableFactCount ??
          0,

        resolvedReferences:
          summary
            .continuityResolvedReferences ||
          resolvedReferences,

        resolvedReferenceCount:
          summary
            .continuityResolvedReferenceCount ??
          resolvedReferences.length,

        unresolvedReferences:
          summary
            .continuityUnresolvedReferences ||
          unresolvedReferences,

        unresolvedReferenceCount:
          summary
            .continuityUnresolvedReferenceCount ??
          unresolvedReferences.length,

        confidence:
          summary
            .continuityPacketConfidence ??
          null,

        situationMapHandoff:
          summary
            .continuitySituationMapHandoff ||
          {},

        raw:
          summary.continuityPacket ||
          null
      },

      contextAssembler: {
        ran:
          summary
            .contextAssemblerRan ===
          true,

        ready:
          assemblerReady,

        source:
          summary
            .contextAssemblerSource ||
          null,

        version:
          summary
            .contextAssemblerVersion ||
          null,

        receivedOriginalText:
          originalText,

        receivedResolvedText:
          resolvedText,

        receivedResolvedTurn:
          currentTurnWasResolved,

        assembledContext:
          summary.assembledContext ||
          null,

        advisoryContext:
          summary.advisoryContext ||
          null,

        continuityContext:
          summary.continuityContext ||
          null,

        activeDialogueState:
          summary.activeDialogueState ||
          null,

        characterIdentity:
          summary.characterIdentity ||
          null,

        activeSituation:
          summary
            .continuityActiveSituation ||
          null,

        keyFacts:
          summary
            .continuityKeyFacts ||
          [],

        advisoryFacts:
          summary
            .continuityAdvisoryFacts ||
          [],

        activeThreadFacts:
          summary.activeThreadFacts ||
          [],

        activeEntities:
          summary
            .continuityActiveEntities ||
          [],

        activeProblems:
          summary
            .continuityActiveProblems ||
          [],

        activeGoals:
          summary
            .continuityActiveGoals ||
          [],

        activeConstraints:
          summary
            .continuityActiveConstraints ||
          [],

        activeAttempts:
          summary
            .continuityActiveAttempts ||
          [],

        domainSignals:
          summary
            .continuityDomainSignals ||
          [],

        intentSignals:
          summary
            .continuityIntentSignals ||
          [],

        conflicts:
          summary
            .continuityContextConflicts ||
          []
      },

      semanticHistory: {
        priorMeaningEvidence:
          summary.priorMeaningEvidence ||
          null,

        meaningHistory:
          summary
            .conversationMeaningHistory ||
          [],

        activeTimeline:
          summary
            .activeSemanticTimeline ||
          [],

        automaticallyInherited:
          false
      },

      legacyCompatibility: {
        resolvedUserQuestion:
          resolvedText,

        currentTurnWasResolved,

        threadQuestion:
          summary.threadQuestion ||
          null,

        threadQuestionAuthoritative:
          false,

        canonicalResolver:
          "ari-elliptical-follow-up-resolver"
      },

      handoff: {
        nextStage:
          "safety",

        situationContextReady:
          Boolean(
            summary.continuityContext ||
            summary.assembledContext ||
            summary.continuityPacket
          ),

        ellipticalFollowUpReady:
          ellipticalStatus.detected !==
            true ||
          ellipticalStatus.resolved ===
            true ||
          ellipticalStatus
            .requiresClarification ===
            true,

        resolvedCurrentTurnAvailable:
          currentTurnWasResolved,

        resolvedUserQuestion:
          resolvedText,

        structuredReferenceBindingReady:
          Boolean(
            summary
              .continuityReferenceBinding
          ),

        currentTurnTextPreserved:
          true,

        currentTurnOperationPreserved:
          true,

        preferredResolvedTurnPath:
          "continuityStagePacket.currentTurn.resolvedText",

        preferredEllipticalPath:
          "continuityStagePacket.ellipticalFollowUp",

        preferredContextPath:
          "continuityStagePacket.contextAssembler.continuityContext",

        preferredReferencePath:
          "continuityStagePacket.referenceResolution.binding"
      },

      quality: {
        continuityRequired,

        entryPointAvailable:
          summary
            .continuityEntryPointSource !==
          "not-loaded",

        continuityPacketReady:
          packetReady,

        contextAssemblerReady:
          assemblerReady,

        hasThreadContext:
          Boolean(
            summary.threadContext
          ),

        ellipticalResolverRan:
          ellipticalStatus.ran ===
          true,

        ellipticalFollowUpDetected:
          ellipticalStatus.detected ===
          true,

        ellipticalFollowUpResolved:
          ellipticalStatus.resolved ===
          true,

        ellipticalRequiresClarification:
          ellipticalStatus
            .requiresClarification ===
          true,

        resolvedCurrentTurnAvailable:
          currentTurnWasResolved,

        hasResolvedReferences:
          resolvedReferences.length >
          0,

        unresolvedReferenceCount:
          unresolvedReferences.length,

        originalTextPreserved:
          summary
            .currentTurnTextRewritten !==
          true,

        duplicatePacketBuildPrevented:
          true,

        uncontrolledQuestionRewritePrevented:
          true,

        canonicalEllipticalResolutionPreserved:
          true
      },

      authority: {
        canRetrieveContinuity:
          true,

        canCoordinateThreadContext:
          true,

        canCoordinateEllipticalResolution:
          true,

        canCoordinateReferenceResolution:
          true,

        canAssembleContext:
          true,

        canPreserveOriginalTurn:
          true,

        canPreserveResolvedTurn:
          true,

        canResolveEllipticalFollowUps:
          false,

        canResolveReferences:
          false,

        canArbitrarilyRewriteCurrentQuestion:
          false,

        canInterpretRequestedOperation:
          false,

        canChangeRequestedOperation:
          false,

        canChangeRequestedOutput:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChooseFinalRoute:
          false,

        canDetermineSafetySeverity:
          false,

        canPerformGeneralReasoning:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "structured_continuity_orchestration_and_resolved_turn_handoff"
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  getOriginalText(
    summary = {}
  ) {
    return this.clean(
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );
  },

  dedupeValues(
    values = []
  ) {
    const seen =
      new Set();

    return this.arrayFrom(
      values
    ).filter(
      value => {
        const key =
          this.normalize(
            this.valueOf(
              value
            )
          );

        if (
          !key ||
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

  valueOf(
    value
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
      "string"
    ) {
      return value;
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
      return (
        value.operation ||
        value.requestedOutput ||
        value.claim ||
        value.value ||
        value.label ||
        value.text ||
        value.surface ||
        value.name ||
        value.evidence ||
        ""
      );
    }

    return String(
      value
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

  arrayFrom(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
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
        /\s+/g,
        " "
      )
      .trim();
  }
};

console.log(
  "ARI CONTINUITY STAGE LOADED:",
  window.AriContinuityStage?.version
);