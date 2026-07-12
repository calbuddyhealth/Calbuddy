// ari/pipeline-stages/deliberation/ari-continuity-stage.js
// Ari Continuity Stage
//
// Purpose:
// Coordinate structured continuity retrieval and reference binding during
// deliberation without rewriting or reinterpreting the user's current turn.
//
// V2.0.0 — Structured Continuity / No Question Rewriting / Context Assembly
//
// Architecture:
//
// Perception Packet
//      ↓
// Continuity Eligibility
//      ↓
// Continuity Entry Point
//      ├── Thread Understanding
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
// 1. The original user text remains authoritative.
// 2. Continuity may resolve references, but may not reinterpret the
//    current requested operation.
// 3. The stage does not rewrite the current question.
// 4. The stage does not run the Thread Question Generator as an
//    authoritative semantic step.
// 5. The Continuity Packet is built by the Continuity Entry Point and
//    must not be built again here.
// 6. Context is assembled from structured outputs.
// 7. This stage cannot choose semantic meaning, conversation function,
//    safety severity, route, planner, or final response language.

window.Ari = window.Ari || {};

window.AriContinuityStage = {
  version: "2.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
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
     * The Continuity Entry Point already builds the packet.
     *
     * This stage must consume that packet rather than building
     * it again. Rebuilding it here would duplicate logic and
     * risk producing two conflicting continuity contracts.
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
    // 3. Read structured continuity outputs
    // =================================================

    const structuredOutputs =
      this.readStructuredOutputs({
        continuityResults,
        continuityPacket
      });

    state = {
      ...state,

      threadContext:
        structuredOutputs.threadContext,

      threadUnderstanding:
        structuredOutputs
          .threadUnderstanding,

      threadWorkingContext:
        structuredOutputs
          .threadWorkingContext,

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
    // 4. Context Assembler
    // =================================================

    mark(
      "before contextAssembler"
    );

    const contextAssemblerResult =
      await this.runContextAssembler({
        state,
        structuredOutputs,
        continuityResults,
        continuityPacket
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
    // 5. Preserve the original current turn
    // =================================================

    /*
     * The original text is never replaced with an expanded
     * "In the context of..." sentence.
     *
     * The structured references remain separate from text.
     */

    const currentTurn =
      this.buildCurrentTurnRecord({
        state,
        continuityPacket,
        structuredOutputs
      });

    state = {
      ...state,

      continuityCurrentTurn:
        currentTurn,

      originalUserMessage:
        currentTurn.originalText,

      /*
       * Compatibility:
       *
       * Some downstream files still read resolvedUserQuestion.
       * Keep it equal to the original text until those consumers
       * are migrated to structured semantic binding.
       */
      resolvedUserQuestion:
        currentTurn.originalText,

      currentTurnWasResolved:
        false,

      currentTurnTextRewritten:
        false,

      continuityReferenceBinding:
        this.buildReferenceBinding({
          state,
          currentTurn,
          structuredOutputs
        })
    };

    // =================================================
    // 6. Preserve semantic history as evidence only
    // =================================================

    /*
     * Meaning history is available to thread and reference
     * systems as evidence.
     *
     * This stage does not automatically declare the latest
     * meaning to be the active meaning of the new turn.
     */

    state = {
      ...state,

      conversationMeaningHistory:
        this.arrayFrom(
          state.conversationMeaningHistory ||
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
    // 7. Optional legacy diagnostic
    // =================================================

    /*
     * The Thread Question Generator is deliberately removed
     * from the authoritative pathway.
     *
     * We preserve an empty diagnostic contract so downstream
     * diagnostics do not crash while migration is underway.
     */

    state.threadQuestion = {
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
        currentTurn.originalText,

      currentTurnWasResolved:
        false,

      usedThreadContext:
        false,

      operation:
        "disabled_for_structured_continuity",

      resolutionType:
        "structured_reference_binding_only",

      confidence:
        1,

      reason:
        "Question rewriting is disabled. References are carried as structured bindings.",

      resolvedCurrentTurn: {
        rawText:
          currentTurn.originalText,

        resolvedText:
          currentTurn.originalText,

        usedThreadContext:
          false,

        operation:
          "none",

        confidence:
          1
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

        role:
          "legacy_diagnostic_only"
      }
    };

    // =================================================
    // 8. Continuity Stage Packet
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
      laneRouting.useThread ===
        true;

    const useMemory =
      runInstructions.memory ===
        true ||
      laneRouting.useMemory ===
        true;

    const useRelationship =
      runInstructions.relationship ===
        true ||
      laneRouting.useRelationship ===
        true;

    const useReferenceResolution =
      runInstructions
        .referenceResolution ===
        true ||
      laneRouting
        .useReferenceResolution ===
        true ||
      useThread;

    const eligible =
      runInstructions.continuity ===
        true ||
      state.shouldUseContinuity ===
        true ||
      useThread ||
      useReferenceResolution ||
      useMemory ||
      useRelationship;

    return {
      eligible,

      useThread,

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
        "1.0.0",

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
            .eligible === true,

        preservedExactly:
          true
      },

      routing: {
        useThread:
          continuityEligibility
            .useThread ===
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

      referenceResolution,

      entityReferenceState,

      resolvedReferences,

      unresolvedReferences,

      memoryContext,

      relationshipContext
    };
  },

  /* =====================================================
     CONTEXT ASSEMBLER
  ===================================================== */

  async runContextAssembler({
    state = {},
    structuredOutputs = {},
    continuityResults = {},
    continuityPacket = {}
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

    try {
      const result =
        await assembler.assemble({
          summary: {
            ...state,

            continuityResults,

            continuityPacket,

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
              state
                .relationshipProfile ||
              {}
          },

          continuityResults,

          continuityPacket,

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
     CURRENT TURN PRESERVATION
  ===================================================== */

  buildCurrentTurnRecord({
    state = {},
    continuityPacket = {},
    structuredOutputs = {}
  } = {}) {
    const originalText =
      this.getOriginalText(
        state
      );

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

    return {
      schema:
        "ari_current_turn_continuity",

      schemaVersion:
        "1.0.0",

      originalText,

      text:
        originalText,

      normalizedText:
        this.readNormalizedText(
          state
        ),

      textPreserved:
        true,

      textWasRewritten:
        false,

      currentTurnWasResolved:
        false,

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
        "original_current_turn_record"
    };
  },

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
        "1.0.0",

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

      originalTextPreserved:
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

      operationPreserved:
        true,

      requestedOutputPreserved:
        true,

      operationWasReinterpreted:
        false,

      textWasRewritten:
        false,

      bindingRules: [
        "Reference resolution may bind entities, objects, events, claims, quantities, or prior propositions.",
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
          Array.isArray(candidate)
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
          Array.isArray(candidate)
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
        state.conversationMeaningHistory ||
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

      automaticallyInherited:
        false,

      authority:
        "historical_evidence_only"
    };
  },

  /* =====================================================
     STAGE PACKET
  ===================================================== */

  buildContinuityStagePacket(
    summary = {}
  ) {
    const originalText =
      this.getOriginalText(
        summary
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

    return {
      schema:
        "ari_continuity_stage_packet",

      schemaVersion:
        "1.0.0",

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

        normalizedText:
          summary
            .continuityCurrentTurn
            ?.normalizedText ||
          this.readNormalizedText(
            summary
          ),

        textPreserved:
          true,

        textWasRewritten:
          false,

        currentTurnWasResolved:
          false,

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
          summary
            .referenceResolution ||
          null,

        entityState:
          summary
            .entityReferenceState ||
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

        textWasRewritten:
          false,

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
          originalText,

        currentTurnWasResolved:
          false,

        threadQuestion:
          summary.threadQuestion ||
          null,

        threadQuestionAuthoritative:
          false
      },

      handoff: {
        nextStage:
          "safety",

        situationContextReady:
          Boolean(
            summary
              .continuityContext ||
            summary
              .assembledContext ||
            summary
              .continuityPacket
          ),

        structuredReferenceBindingReady:
          Boolean(
            summary
              .continuityReferenceBinding
          ),

        currentTurnTextPreserved:
          true,

        currentTurnOperationPreserved:
          true,

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

        questionRewritePrevented:
          true
      },

      authority: {
        canRetrieveContinuity:
          true,

        canCoordinateThreadContext:
          true,

        canCoordinateReferenceResolution:
          true,

        canAssembleContext:
          true,

        canPreserveOriginalTurn:
          true,

        canResolveReferences:
          false,

        canRewriteCurrentQuestion:
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
          "structured_continuity_orchestration_and_context_handoff"
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  getOriginalText(
    summary = {}
  ) {
    return String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.originalUserMessage ||
      ""
    ).trim();
  },

  dedupeValues(
    values = []
  ) {
    const seen =
      new Set();

    return this.arrayFrom(values)
      .filter(value => {
        const key =
          this.normalize(
            this.valueOf(
              value
            )
          );

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

  valueOf(value) {
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
      return value;
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

    return String(value);
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

  normalize(value = "") {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONTINUITY STAGE LOADED:",
  window.AriContinuityStage?.version
);