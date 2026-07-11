// ari/pipeline-stages/deliberation/ari-continuity-stage.js
// Ari Continuity Stage
// Purpose: Resolve prior-thread, memory, and relationship context only when routing requires it.
// V1.0.0 — Deliberation Stage Foundation

window.Ari = window.Ari || {};

window.AriContinuityStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,
      activeDeliberationStage: "continuity"
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

    const shouldUseContinuity =
      runInstructions.continuity === true ||
      state.shouldUseContinuity === true ||
      laneRouting.useThread === true ||
      laneRouting.useMemory === true ||
      laneRouting.useRelationship === true;

    state = {
      ...state,

      shouldUseContinuity,

      continuityEligibility: {
        eligible:
          shouldUseContinuity,

        useThread:
          runInstructions.thread === true ||
          laneRouting.useThread === true,

        useMemory:
          runInstructions.memory === true ||
          laneRouting.useMemory === true,

        useRelationship:
          runInstructions.relationship === true ||
          laneRouting.useRelationship === true,

        source:
          executivePacket.ready
            ? "executive_packet"
            : "legacy_lane_splitter"
      }
    };

    // =================================================
    // 1. Continuity Entry Point
    // =================================================

    if (shouldUseContinuity) {
      mark("before continuityEntryPoint");

      const continuityResults =
        window.Ari?.continuityEntryPoint?.enter
          ? await window.Ari.continuityEntryPoint.enter({
              summary: state,

              executivePacket:
                state.executivePacket ||
                null,

              routingContract:
                state.routingContract ||
                null,

              laneSplit:
                state.laneSplit ||
                null,

              eligibility:
                state.continuityEligibility
            })
          : {
              engine:
                "ari-continuity-entry-point",

              source:
                "not-loaded",

              ran:
                false,

              reason:
                "continuity_entry_point_not_loaded",

              used: {
                thread: false,
                memory: false,
                relationship: false
              },

              outputs: {
                thread: null,
                memory: null,
                relationship: null
              },

              warnings: []
            };

      state = {
        ...state,

        continuityResults,

        continuityEntryPointRan:
          continuityResults.ran === true,

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
          continuityResults.warnings ||
          []
      };

      mark("after continuityEntryPoint");

      // ===============================================
      // 2. Continuity Packet
      // ===============================================

      mark("before continuityPacket");

      const continuityPacket =
        window.Ari?.continuityPacket?.build
          ? await window.Ari.continuityPacket.build({
              summary: state,

              executivePacket:
                state.executivePacket ||
                null,

              routingContract:
                state.routingContract ||
                null,

              laneSplit:
                state.laneSplit ||
                null,

              continuityResults:
                state.continuityResults ||
                null,

              eligibility:
                state.continuityEligibility
            })
          : {
              engine:
                "ari-continuity-packet",

              source:
                "not-loaded",

              ran:
                false,

              reason:
                "continuity_packet_not_loaded",

              continuityType:
                null,

              currentTurn: {},

              activeThread: {},

              referencedContext: {},

              usableFacts: [],

              usableFactCount:
                0,

              unresolvedReferences: [],

              unresolvedReferenceCount:
                0,

              confidence:
                null,

              situationMapHandoff: {
                ready:
                  false,

                shouldUseAsContext:
                  false
              }
            };

      state = {
        ...state,

        continuityPacket,

        continuityPacketRan:
          continuityPacket.ran === true,

        continuityPacketSource:
          continuityPacket.source ||
          "unknown",

        continuityType:
          continuityPacket.continuityType ||
          null,

        continuityCurrentTurn:
          continuityPacket.currentTurn ||
          {},

        continuityActiveThread:
          continuityPacket.activeThread ||
          {},

        continuityReferencedContext:
          continuityPacket.referencedContext ||
          {},

        continuityUsableFacts:
          continuityPacket.usableFacts ||
          [],

        continuityUsableFactCount:
          continuityPacket.usableFactCount ??
          continuityPacket.usableFacts?.length ??
          0,

        continuityUnresolvedReferences:
          continuityPacket.unresolvedReferences ||
          [],

        continuityUnresolvedReferenceCount:
          continuityPacket.unresolvedReferenceCount ??
          continuityPacket.unresolvedReferences?.length ??
          0,

        continuityPacketConfidence:
          continuityPacket.confidence ||
          null,

        continuitySituationMapHandoff:
          continuityPacket.situationMapHandoff ||
          {}
      };

      mark("after continuityPacket");
    } else {
      state = {
        ...state,

        continuityResults: {
          engine:
            "ari-continuity-entry-point",

          source:
            "skipped-by-executive-routing",

          ran:
            false,

          reason:
            "continuity_not_required",

          used: {
            thread: false,
            memory: false,
            relationship: false
          },

          outputs: {
            thread: null,
            memory: null,
            relationship: null
          },

          warnings: []
        },

        continuityEntryPointRan:
          false,

        continuityEntryPointSource:
          "skipped-by-executive-routing",

        continuityEntryPointReason:
          "continuity_not_required",

        continuityEntryPointUsed: {
          thread: false,
          memory: false,
          relationship: false
        },

        continuityEntryPointOutputs: {
          thread: null,
          memory: null,
          relationship: null
        },

        continuityEntryPointWarnings: [],

        continuityPacket: {
          engine:
            "ari-continuity-packet",

          source:
            "skipped-by-executive-routing",

          ran:
            false,

          reason:
            "continuity_not_required",

          continuityType:
            null,

          currentTurn: {},

          activeThread: {},

          referencedContext: {},

          usableFacts: [],

          usableFactCount:
            0,

          unresolvedReferences: [],

          unresolvedReferenceCount:
            0,

          confidence:
            null,

          situationMapHandoff: {
            ready:
              false,

            shouldUseAsContext:
              false
          }
        },

        continuityPacketRan:
          false,

        continuityPacketSource:
          "skipped-by-executive-routing",

        continuityType:
          null,

        continuityCurrentTurn: {},

        continuityActiveThread: {},

        continuityReferencedContext: {},

        continuityUsableFacts: [],

        continuityUsableFactCount:
          0,

        continuityUnresolvedReferences: [],

        continuityUnresolvedReferenceCount:
          0,

        continuityPacketConfidence:
          null,

        continuitySituationMapHandoff: {
          ready:
            false,

          shouldUseAsContext:
            false
        }
      };
    }

    // =================================================
    // 3. Preserve prior semantic meaning
    // =================================================

    state = {
      ...state,

      priorMeaningForFollowUp:
        state.latestConversationMeaning ||
        state.threadState?.latestConversationMeaning ||
        null,

      conversationMeaningHistory:
        state.conversationMeaningHistory ||
        state.threadState?.conversationMeaningHistory ||
        [],

      activeSemanticTimeline:
        state.activeSemanticTimeline ||
        state.threadState?.activeSemanticTimeline ||
        []
    };

    // =================================================
    // 4. Resolve the current user question
    // =================================================

    mark("before threadQuestionGenerator");

    const threadQuestion =
      window.Ari?.threadQuestionGenerator?.generate
        ? await window.Ari.threadQuestionGenerator.generate({
            summary: state,

            perceptionPacket:
              state.perceptionPacket ||
              null,

            executivePacket:
              state.executivePacket ||
              null,

            routingContract:
              state.routingContract ||
              null,

            continuityPacket:
              state.continuityPacket ||
              null
          })
        : {
            threadQuestionGeneratorRan:
              false,

            source:
              "not-loaded",

            resolvedUserQuestion:
              state.userMessage ||
              state.message ||
              state.input ||
              "",

            currentTurnWasResolved:
              false,

            resolutionReason:
              "thread_question_generator_not_loaded"
          };

    state = {
      ...state,

      threadQuestion,

      ...threadQuestion,

      resolvedUserQuestion:
        threadQuestion.resolvedUserQuestion ||
        state.resolvedUserQuestion ||
        state.userMessage ||
        state.message ||
        state.input ||
        ""
    };

    mark("after threadQuestionGenerator");

    // =================================================
    // 5. Continuity Stage Packet
    // =================================================

    state.continuityStagePacket =
      this.buildContinuityStagePacket(state);

    state.continuityStageRan =
      true;

    state.continuityStageSource =
      "ari-continuity-stage";

    state.continuityStageVersion =
      this.version;

    return state;
  },

  buildContinuityStagePacket(summary = {}) {
    return {
      ready:
        true,

      source:
        "ari-continuity-stage",

      version:
        this.version,

      eligibility:
        summary.continuityEligibility ||
        {
          eligible: false,
          useThread: false,
          useMemory: false,
          useRelationship: false
        },

      entryPoint: {
        ran:
          summary.continuityEntryPointRan === true,

        source:
          summary.continuityEntryPointSource ||
          null,

        reason:
          summary.continuityEntryPointReason ||
          null,

        used:
          summary.continuityEntryPointUsed ||
          {},

        outputs:
          summary.continuityEntryPointOutputs ||
          {},

        warnings:
          summary.continuityEntryPointWarnings ||
          []
      },

      continuity: {
        ran:
          summary.continuityPacketRan === true,

        source:
          summary.continuityPacketSource ||
          null,

        type:
          summary.continuityType ||
          null,

        currentTurn:
          summary.continuityCurrentTurn ||
          {},

        activeThread:
          summary.continuityActiveThread ||
          {},

        referencedContext:
          summary.continuityReferencedContext ||
          {},

        usableFacts:
          summary.continuityUsableFacts ||
          [],

        usableFactCount:
          summary.continuityUsableFactCount ??
          0,

        unresolvedReferences:
          summary.continuityUnresolvedReferences ||
          [],

        unresolvedReferenceCount:
          summary.continuityUnresolvedReferenceCount ??
          0,

        confidence:
          summary.continuityPacketConfidence ||
          null,

        situationMapHandoff:
          summary.continuitySituationMapHandoff ||
          {},

        raw:
          summary.continuityPacket ||
          null
      },

      resolvedRequest: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        currentTurnWasResolved:
          summary.currentTurnWasResolved === true,

        threadQuestion:
          summary.threadQuestion ||
          null
      },

      semanticHistory: {
        priorMeaning:
          summary.priorMeaningForFollowUp ||
          null,

        meaningHistory:
          summary.conversationMeaningHistory ||
          [],

        activeTimeline:
          summary.activeSemanticTimeline ||
          []
      },

      authority: {
        canRetrieveContinuity:
          true,

        canResolveReferences:
          true,

        canRewriteCurrentQuestion:
          true,

        canChooseFinalRoute:
          false,

        canDetermineSafetySeverity:
          false,

        canPerformGeneralReasoning:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "continuity_retrieval_and_reference_resolution"
      }
    };
  }
};

console.log(
  "ARI CONTINUITY STAGE LOADED:",
  window.AriContinuityStage?.version
);