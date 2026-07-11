// ari/pipelines/ari-deliberation-pipeline.js
// Ari Deliberation Pipeline
// Purpose: Resolve context, reasoning, safety, memory, and response strategy.
// V1.1.0 — Existing Deliberation Chain Migrated / Deep Safety Ready

window.Ari = window.Ari || {};

window.AriDeliberationPipeline = {
  version: "1.1.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback,

      preserveDeveloperEvidence =
        state => state,

      runDeveloperLayer =
        async state => state,

      applyContractBridge =
        state => state
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "deliberation"
    };

    const executivePacket =
      state.executivePacket ||
      this.buildFallbackExecutivePacket(state);

    state = {
      ...state,
      executivePacket
    };

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    // =================================================
    // 1. Conditional Continuity Retrieval
    // =================================================

    const shouldUseContinuity =
      runInstructions.continuity === true ||
      state.shouldUseContinuity === true ||
      state.laneSplit?.routing?.useThread === true ||
      state.laneSplit?.routing?.useMemory === true ||
      state.laneSplit?.routing?.useRelationship === true;

    state = {
      ...state,
      shouldUseContinuity
    };

    if (shouldUseContinuity) {
      mark("before continuityEntryPoint");

      const continuityResults =
        window.Ari?.continuityEntryPoint?.enter
          ? await window.Ari.continuityEntryPoint.enter({
              summary: state,
              executivePacket,
              routingContract:
                state.routingContract ||
                null,
              laneSplit:
                state.laneSplit ||
                null
            })
          : {
              engine: "ari-continuity-entry-point",
              source: "not-loaded",
              ran: false,
              reason:
                "continuity_entry_point_not_loaded",

              outputs: {
                thread: null,
                memory: null,
                relationship: null
              }
            };

      state = {
        ...state,

        continuityResults,

        continuityEntryPointRan:
          continuityResults.ran ??
          false,

        continuityEntryPointSource:
          continuityResults.source ||
          "not-loaded",

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

      // -----------------------------------------------
      // Continuity Packet
      // -----------------------------------------------

      mark("before continuityPacket");

      const continuityPacket =
        window.Ari?.continuityPacket?.build
          ? await window.Ari.continuityPacket.build({
              summary: state,

              executivePacket,

              routingContract:
                state.routingContract ||
                null,

              laneSplit:
                state.laneSplit ||
                null,

              continuityResults:
                state.continuityResults ||
                null
            })
          : {
              engine: "ari-continuity-packet",
              source: "not-loaded",
              ran: false,
              reason:
                "continuity_packet_not_loaded",

              usableFacts: [],
              unresolvedReferences: [],

              situationMapHandoff: {
                ready: false,
                shouldUseAsContext: false
              }
            };

      state = {
        ...state,

        continuityPacket,

        continuityPacketRan:
          continuityPacket.ran ??
          false,

        continuityPacketSource:
          continuityPacket.source ||
          "not-loaded",

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
          0,

        continuityUnresolvedReferences:
          continuityPacket.unresolvedReferences ||
          [],

        continuityUnresolvedReferenceCount:
          continuityPacket.unresolvedReferenceCount ??
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

        continuityResults: null,

        continuityPacket: {
          engine:
            "ari-continuity-packet",

          source:
            "skipped-by-executive-routing",

          ran: false,

          reason:
            "continuity_not_required",

          usableFacts: [],
          unresolvedReferences: []
        },

        continuityPacketRan: false,
        continuityPacketSource:
          "skipped-by-executive-routing",

        continuityUsableFacts: [],
        continuityUsableFactCount: 0,
        continuityUnresolvedReferences: [],
        continuityUnresolvedReferenceCount: 0
      };
    }

    // =================================================
    // 2. Prior Meaning Compatibility
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
    // 3. Thread Question Generator
    // =================================================

    mark("before threadQuestionGenerator");

    const threadQuestion =
      window.Ari?.threadQuestionGenerator?.generate
        ? await window.Ari.threadQuestionGenerator.generate({
            summary: state,

            perceptionPacket:
              state.perceptionPacket ||
              null,

            executivePacket,

            continuityPacket:
              state.continuityPacket ||
              null
          })
        : {
            threadQuestionGeneratorRan: false,
            source: "not-loaded",

            resolvedUserQuestion:
              state.userMessage ||
              state.message ||
              state.input ||
              "",

            currentTurnWasResolved: false
          };

    state = {
      ...state,
      threadQuestion,
      ...threadQuestion
    };

    mark("after threadQuestionGenerator");

    // =================================================
    // 4. Deep Safety Reasoning Placeholder
    // =================================================

    mark("before deepSafetyReasoning");

    const shouldRunDeepSafety =
      runInstructions.deepSafety === true ||
      state.routingApplicability?.deepSafety === true ||
      state.safetyContextGate
        ?.requiresDeeperSafetyReview === true;

    const deepSafetyResult =
      shouldRunDeepSafety &&
      window.AriDeepSafetyReasoningEngine
        ? await runEngine(
            window.AriDeepSafetyReasoningEngine,
            ["evaluate", "reason", "analyze"],
            {
              deepSafetyReasoningRan: false,
              source: "not-loaded",
              applicable: false,
              riskLevel: "unknown",
              safetyAuthority: "none"
            },
            state
          )
        : {
            deepSafetyReasoningRan: false,

            source:
              shouldRunDeepSafety
                ? "not-loaded"
                : "skipped-by-routing",

            applicable: false,

            riskLevel:
              state.safetyContextGate?.riskLevel ||
              "none",

            riskType:
              state.safetyContextGate?.riskType ||
              "none",

            safetyAuthority:
              state.safetyContextGate
                ?.shouldStopNormalResponse === true
                ? "early_gate_override"
                : "none",

            reason:
              shouldRunDeepSafety
                ? "deep_safety_engine_not_loaded"
                : "deep_safety_not_required"
          };

    state = {
      ...state,

      deepSafetyResult,

      deepSafetyReasoning:
        deepSafetyResult,

      deepSafetyReasoningRan:
        deepSafetyResult
          .deepSafetyReasoningRan === true
    };

    mark("after deepSafetyReasoning");

    // =================================================
    // 5. Situation Map
    // =================================================

    const shouldRunSituationMap =
      runInstructions.situationMap !== false &&
      state.shouldRunSituationMap !== false;

    mark("before situationMap");

    const situationMap =
      shouldRunSituationMap
        ? await runEngine(
            window.AriSituationMapEngine,
            ["build", "create"],
            {
              situationMapRan: false,
              source: "not-loaded",
              situations: [],
              domains: [],
              needs: [],
              risks: [],
              questions: [],
              laneCandidates: [],
              responseRequirements: [],
              responseConstraints: []
            },
            state
          )
        : {
            situationMapRan: false,
            source:
              "skipped-by-executive-routing",

            situations: [],
            domains: [],
            needs: [],
            risks: [],
            questions: [],
            laneCandidates: [],
            responseRequirements: [],
            responseConstraints: [],

            reason:
              "situation_map_not_required"
          };

    state = {
      ...state,
      situationMap,
      ...situationMap
    };

    mark("after situationMap");

    // =================================================
    // 6. Triage
    // =================================================

    const shouldRunTriage =
      runInstructions.triage !== false &&
      state.shouldRunTriage !== false;

    mark("before triageEngine");

    const triageOutput =
      shouldRunTriage
        ? await runEngine(
            window.AriTriageEngine,
            ["run", "triage"],
            {},
            state
          )
        : {
            ariTriage: {
              triageEngineRan: false,

              triageEngineSource:
                "skipped-by-executive-routing",

              primaryLane: null,
              supportLanes: [],
              deferredLanes: [],
              blockedLanes: [],
              responseConstraints: [],
              confidence: null,

              reason:
                "triage_not_required"
            }
          };

    const triageResult =
      triageOutput.ariTriage ||
      {
        triageEngineRan: false,
        triageEngineSource:
          "not-loaded",

        primaryLane: null,
        supportLanes: [],
        deferredLanes: [],
        blockedLanes: [],
        responseConstraints: [],
        confidence: null,

        reason:
          "Triage engine not loaded."
      };

    state = {
      ...state,

      ...triageOutput,

      triage:
        triageResult,

      ...triageResult,

      primaryLaneSuggestion:
        triageResult.primaryLane ||
        state.primaryLane ||
        null,

      supportLaneSuggestions:
        triageResult.supportLanes ||
        [],

      deferredLaneSuggestions:
        triageResult.deferredLanes ||
        [],

      blockedLanes:
        triageResult.blockedLanes ||
        [],

      responseConstraints:
        triageResult.responseConstraints ||
        state.responseConstraints ||
        []
    };

    mark("after triageEngine");

    // =================================================
    // 7. Multi-Lane Response Planner
    // =================================================

    mark("before multiLanePlanner");

    const multiLanePlan =
      await runEngine(
        window.AriMultiLaneResponsePlanner,
        ["plan"],
        {
          multiLanePlannerRan: false,
          source: "not-loaded",

          primaryLane:
            state.routingContract?.primaryLane ||
            state.triage?.primaryLane ||
            null,

          responseShape:
            state.routingContract?.responseShape ||
            state.triage?.responseShape ||
            null,

          responseOrder: [],
          composerDirective: {}
        },
        state
      );

    state = {
      ...state,

      multiLanePlan,

      responsePlan:
        multiLanePlan,

      multiLaneResponsePlan:
        multiLanePlan
    };

    mark("after multiLanePlanner");

    // =================================================
    // 8. Situation Contract
    // =================================================

    mark("before situationContract");

    const situationContractResult =
      await runEngine(
        window.AriSituationContract,
        ["create", "build"],
        {
          situationContractRan: false,
          source: "not-loaded",
          situationContract: null
        },
        state
      );

    state = {
      ...state,
      ...(situationContractResult || {})
    };

    mark("after situationContract");

    // =================================================
    // 9. Contract Bridge
    // =================================================

    mark("before contractBridge");

    state =
      applyContractBridge(state);

    mark("after contractBridge");

    // =================================================
    // 10. Cognitive Executive
    // =================================================

    mark("before cognitiveExecutive");

    const cognitiveExecutiveResult =
      await runEngine(
        window.AriCognitiveExecutive,
        ["plan"],
        {
          ariExecutiveRan: false,
          ariExecutiveVersion: null,

          cognitiveExecutive: {
            source: "not-loaded",
            authority: "none",
            activate: [],
            requires: {}
          }
        },
        state
      );

    state = {
      ...state,

      ...cognitiveExecutiveResult,

      cognitiveExecutive:
        cognitiveExecutiveResult.cognitiveExecutive ||
        state.cognitiveExecutive ||
        null
    };

    mark("after cognitiveExecutive");

    // =================================================
    // 11. Developer Layer
    // =================================================

    const shouldRunDeveloper =
      runInstructions.developer === true ||
      state.shouldRunDeveloperLayer === true;

    mark("before runDeveloperLayer");

    state =
      shouldRunDeveloper
        ? await runDeveloperLayer(state)
        : {
            ...state,

            developerLayerRan: false,

            developerLayerSource:
              "skipped-by-executive-routing",

            developerLayerSkipReason:
              "developer_path_not_required"
          };

    mark("after runDeveloperLayer");

    state =
      preserveDeveloperEvidence(state);

    state =
      applyContractBridge(state);

    const developerResponseLocked =
      Boolean(
        state.responseLocked === true ||
        state.developerResponseLocked === true ||
        state.developerHandoff
          ?.responseLocked === true ||
        state.developerHandoff
          ?.developerResponseLocked === true
      );

    if (
      !developerResponseLocked &&
      state.developerHandoff
    ) {
      state = {
        ...state,

        unlockedDeveloperHandoff:
          state.developerHandoff,

        developerIntent:
          state.developerIntent ||
          state.developerHandoff.developerIntent ||
          null,

        composerDeveloperPacket:
          state.developerHandoff
            .composerDeveloperPacket ||
          state.composerDeveloperPacket ||
          null,

        developerHandoff: null,
        developerResponse: null,
        finalResponse: null,

        responseLocked: false,
        developerResponseLocked: false
      };
    }

    state = {
      ...state,
      developerResponseLocked
    };

    // =================================================
    // 12. General Reasoning
    // =================================================

    const shouldRunHeavyReasoning =
      runInstructions.heavyReasoning !== false &&
      state.shouldRunHeavyReasoning !== false;

    mark("before AriReasoningEngine");

    const reasoningResult =
      shouldRunHeavyReasoning
        ? await runEngine(
            window.AriReasoningEngine,
            ["create", "reason"],
            {
              reasoningEngineRan: false,
              reasoningSource: "not-loaded",
              reasoning: {},
              reasoningAnswer: null,
              reasoningRecommendation: null
            },
            state
          )
        : {
            reasoningEngineRan: false,

            reasoningSource:
              "skipped-by-executive-routing",

            reasoning: {},

            reasoningAnswer: null,
            reasoningRecommendation: null,

            reason:
              "heavy_reasoning_not_required"
          };

    state = {
      ...state,

      ...reasoningResult,

      reasoning:
        reasoningResult.reasoning ||
        state.reasoning ||
        {},

      reasoningAnswer: null,
      reasoningRecommendation: null
    };

    mark("after AriReasoningEngine");

    // =================================================
    // 13. Memory Retrieval
    // =================================================

    mark("before memoryRetrieval");

    const shouldRetrieveMemory =
      runInstructions.memory === true ||
      state.shouldUseMemory === true ||
      state.laneSplit?.routing?.useMemory === true ||
      state.cognitiveExecutive?.requires
        ?.userMemory === true ||
      /\b(remember|do you remember|what did i say|what do you know about me|my preference|my goal|last time|previously|before)\b/i.test(
        String(
          state.userMessage ||
          state.message ||
          state.input ||
          ""
        )
      );

    const memoryRetrievalResult =
      shouldRetrieveMemory &&
      window.AriMemoryRetrievalEngine
        ? await runEngine(
            window.AriMemoryRetrievalEngine,
            ["retrieve", "search", "recall"],
            {
              memoryRetrievalRan: false,
              memoryRetrievalSource:
                "not-loaded",

              memoryAvailable: false,
              memories: [],
              usableMemories: []
            },
            state
          )
        : {
            memoryRetrievalRan: false,

            memoryRetrievalSource:
              shouldRetrieveMemory
                ? "not-loaded"
                : "skipped",

            memoryAvailable: false,
            memories: [],
            usableMemories: [],

            reason:
              shouldRetrieveMemory
                ? "memory_retrieval_engine_not_loaded"
                : "memory_not_needed_for_current_turn"
          };

    state = {
      ...state,

      memoryRetrieval:
        memoryRetrievalResult,

      memoryRetrievalRan:
        memoryRetrievalResult
          .memoryRetrievalRan === true,

      memoryRetrievalSource:
        memoryRetrievalResult
          .memoryRetrievalSource ||
        memoryRetrievalResult.source ||
        "unknown",

      memoryAvailable:
        memoryRetrievalResult
          .memoryAvailable === true ||
        Boolean(
          memoryRetrievalResult
            .usableMemories?.length
        ),

      memories:
        memoryRetrievalResult.memories ||
        memoryRetrievalResult
          .retrievedMemories ||
        memoryRetrievalResult.results ||
        [],

      usableMemories:
        memoryRetrievalResult
          .usableMemories ||
        memoryRetrievalResult
          .retrievedMemories ||
        memoryRetrievalResult.memories ||
        []
    };

    mark("after memoryRetrieval");

    // =================================================
    // 14. Memory Context Builder
    // =================================================

    mark("before memoryContextBuilder");

    const memoryContextEngine =
      window.AriMemoryContextBuilder ||
      window.Ari?.memoryContextBuilder;

    const memoryContextResult =
      state.memoryAvailable === true &&
      memoryContextEngine
        ? await runEngine(
            memoryContextEngine,
            ["build", "create"],
            {
              memoryContextBuilderRan: false,
              memoryContextSource:
                "not-loaded",

              memoryContext: null,
              memoryFacts: []
            },
            state
          )
        : {
            memoryContextBuilderRan: false,

            memoryContextSource:
              "skipped",

            memoryContext: null,
            memoryFacts: [],

            reason:
              state.memoryAvailable
                ? "memory_context_builder_not_loaded"
                : "no_usable_memories"
          };

    state = {
      ...state,

      memoryContext:
        memoryContextResult.memoryContext ||
        null,

      memoryContextResult,

      memoryContextBuilderRan:
        memoryContextResult
          .memoryContextBuilderRan === true,

      memoryFacts:
        memoryContextResult.memoryFacts ||
        memoryContextResult.usableFacts ||
        state.usableMemories ||
        []
    };

    mark("after memoryContextBuilder");

    // =================================================
    // 15. Language Understanding
    // =================================================

    mark("before languageUnderstanding");

    const languageUnderstandingResult =
      await runEngine(
        window.AriLanguageUnderstandingEngine ||
        window.Ari?.languageUnderstandingEngine,

        ["understand", "analyze"],

        {
          languageUnderstandingRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...languageUnderstandingResult,

      languageUnderstanding:
        languageUnderstandingResult
    };

    mark("after languageUnderstanding");

    // =================================================
    // 16. Semantic Understanding
    // =================================================

    mark("before semanticUnderstanding");

    const semanticUnderstandingResult =
      await runEngine(
        window.AriSemanticUnderstandingEngine ||
        window.Ari?.semanticUnderstandingEngine,

        ["understand", "analyze"],

        {
          semanticUnderstandingRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...semanticUnderstandingResult,

      semanticUnderstanding:
        semanticUnderstandingResult
    };

    mark("after semanticUnderstanding");

    // =================================================
    // 17. Event Understanding
    // =================================================

    mark("before eventUnderstanding");

    const eventUnderstandingResult =
      await runEngine(
        window.AriEventUnderstandingEngine ||
        window.Ari?.eventUnderstandingEngine,

        ["understand"],

        {
          eventUnderstandingRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...eventUnderstandingResult,

      eventUnderstanding:
        eventUnderstandingResult
    };

    mark("after eventUnderstanding");

    // =================================================
    // 18. Meaning Interpreter
    // =================================================

    mark("before meaningInterpreter");

    const meaningInterpretationResult =
      await runEngine(
        window.AriMeaningInterpreter ||
        window.Ari?.meaningInterpreter,

        ["interpret"],

        {
          meaningInterpreterRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...meaningInterpretationResult,

      meaningInterpretation:
        meaningInterpretationResult
    };

    mark("after meaningInterpreter");

    // =================================================
    // 19. Human State Builder
    // =================================================

    mark("before humanStateBuilder");

    const humanStateResult =
      await runEngine(
        window.AriHumanStateBuilder ||
        window.Ari?.humanStateBuilder,

        ["build"],

        {
          humanStateBuilderRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...humanStateResult,

      humanState:
        humanStateResult
    };

    mark("after humanStateBuilder");

    // =================================================
    // 20. Response Planner
    // =================================================

    mark("before responsePlanner");

    const responsePlannerResult =
      await runEngine(
        window.AriResponsePlanner ||
        window.Ari?.responsePlanner,

        ["plan"],

        {
          responsePlannerRan: false,
          usable: false,
          source: "not-loaded"
        },

        state
      );

    state = {
      ...state,
      ...responsePlannerResult,

      ariResponsePlan:
        responsePlannerResult,

      understandingResponsePlan:
        responsePlannerResult
    };

    mark("after responsePlanner");

    // =================================================
    // 21. Deliberation Packet
    // =================================================

    state.deliberationPacket =
      this.buildDeliberationPacket(state);

    // Keep the original shell name available too.
    state.deliberationContract =
      state.deliberationPacket;

    state.deliberationPipelineRan = true;

    state.deliberationPipelineSource =
      "ari-deliberation-pipeline";

    state.deliberationPipelineVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Deliberation Packet
  // ===================================================

  buildDeliberationPacket(summary = {}) {
    const responsePlan =
      summary.ariResponsePlan ||
      summary.understandingResponsePlan ||
      summary.multiLanePlan ||
      summary.responsePlan ||
      null;

    const safety =
      summary.deepSafetyResult ||
      summary.safetyContextGate ||
      null;

    const developer =
      summary.developerHandoff ||
      summary.unlockedDeveloperHandoff ||
      summary.developerUnderstanding ||
      null;

    return {
      ready: true,

      source:
        "ari-deliberation-pipeline",

      version:
        this.version,

      // -----------------------------------------------
      // Input contracts
      // -----------------------------------------------

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      routingContract:
        summary.routingContract ||
        null,

      // -----------------------------------------------
      // Resolved user request
      // -----------------------------------------------

      request: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.threadQuestion
            ?.resolvedUserQuestion ||
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

      // -----------------------------------------------
      // Context
      // -----------------------------------------------

      continuity: {
        required:
          summary.shouldUseContinuity === true,

        ran:
          summary.continuityPacketRan === true,

        results:
          summary.continuityResults ||
          null,

        packet:
          summary.continuityPacket ||
          null,

        usableFacts:
          summary.continuityUsableFacts ||
          [],

        unresolvedReferences:
          summary.continuityUnresolvedReferences ||
          []
      },

      memory: {
        required:
          summary.shouldUseMemory === true,

        retrievalRan:
          summary.memoryRetrievalRan === true,

        available:
          summary.memoryAvailable === true,

        retrieval:
          summary.memoryRetrieval ||
          null,

        context:
          summary.memoryContext ||
          null,

        facts:
          summary.memoryFacts ||
          summary.usableMemories ||
          []
      },

      // -----------------------------------------------
      // Safety
      // -----------------------------------------------

      safety: {
        earlyGate:
          summary.safetyContextGate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          null,

        applicable:
          safety?.applicable === true ||
          safety?.riskLevel !== "none",

        riskLevel:
          safety?.riskLevel ||
          "none",

        riskType:
          safety?.riskType ||
          "none",

        authority:
          safety?.safetyAuthority ||
          null,

        constraints:
          safety?.responseContract
            ?.requiredBehaviors ||
          []
      },

      // -----------------------------------------------
      // Situation and response lanes
      // -----------------------------------------------

      situation: {
        map:
          summary.situationMap ||
          null,

        triage:
          summary.triage ||
          null,

        multiLanePlan:
          summary.multiLanePlan ||
          null,

        contract:
          summary.situationContract ||
          null,

        contextLane:
          summary.contextLane ||
          summary.routingContract
            ?.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          summary.primaryLaneSuggestion ||
          summary.triage?.primaryLane ||
          null,

        supportLanes:
          summary.supportLaneSuggestions ||
          [],

        deferredLanes:
          summary.deferredLaneSuggestions ||
          [],

        blockedLanes:
          summary.blockedLanes ||
          []
      },

      // -----------------------------------------------
      // Reasoning
      // -----------------------------------------------

      reasoning: {
        ran:
          summary.reasoningEngineRan === true,

        source:
          summary.reasoningSource ||
          null,

        result:
          summary.reasoning ||
          {},

        cognitiveExecutive:
          summary.cognitiveExecutive ||
          null
      },

      // -----------------------------------------------
      // Developer deliberation
      // -----------------------------------------------

      developer: {
        applicable:
          summary.shouldRunDeveloperLayer === true,

        ran:
          summary.developerLayerRan === true,

        responseLocked:
          summary.developerResponseLocked === true,

        result:
          developer,

        composerPacket:
          summary.composerDeveloperPacket ||
          null
      },

      // -----------------------------------------------
      // Understanding layers
      // -----------------------------------------------

      understanding: {
        language:
          summary.languageUnderstanding ||
          null,

        semantic:
          summary.semanticUnderstanding ||
          null,

        event:
          summary.eventUnderstanding ||
          null,

        meaning:
          summary.meaningInterpretation ||
          null,

        humanState:
          summary.humanState ||
          null
      },

      // -----------------------------------------------
      // Response strategy
      // -----------------------------------------------

      responseStrategy: {
        plan:
          responsePlan,

        responseShape:
          summary.responseShape ||
          summary.routingContract
            ?.responseShape ||
          null,

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        required:
          summary.responseRequired ||
          [],

        avoid:
          summary.responseAvoid ||
          [],

        thesis:
          summary.primarySituationThesis ||
          null,

        narrative:
          summary.situationNarrative ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null
      },

      // -----------------------------------------------
      // Quality
      // -----------------------------------------------

      quality: {
        hasResolvedQuestion:
          Boolean(
            String(
              summary.resolvedUserQuestion ||
              summary.userMessage ||
              ""
            ).trim()
          ),

        hasRoutingContract:
          Boolean(summary.routingContract),

        hasResponsePlan:
          Boolean(responsePlan),

        hasSituationContract:
          Boolean(summary.situationContract),

        hasReasoning:
          Boolean(
            summary.reasoning &&
            Object.keys(summary.reasoning)
              .length
          ),

        hasUsableContext:
          Boolean(
            summary.continuityUsableFacts
              ?.length ||
            summary.memoryFacts?.length
          ),

        developerResponseLocked:
          summary.developerResponseLocked === true
      },

      // -----------------------------------------------
      // Authority boundary
      // -----------------------------------------------

      authority: {
        canRetrieveContext: true,
        canEvaluateSafetyContext: true,
        canPerformReasoning: true,
        canDefineResponseStrategy: true,

        canChooseFinalRoute: false,
        canChangeOfficialMode: false,
        canChangeOfficialIntent: false,

        canWriteFinalLanguage: false,
        canSelectFinalDraft: false,
        canPersistState: false,

        role:
          "context_reasoning_and_response_strategy"
      }
    };
  },

  // ===================================================
  // Executive Packet Fallback
  // ===================================================

  buildFallbackExecutivePacket(summary = {}) {
    return {
      ready: false,

      source:
        "ari-deliberation-pipeline-fallback",

      version:
        this.version,

      routingContract:
        summary.routingContract ||
        null,

      selectedRoute: {
        mode:
          summary.conversationMode ||
          "unknown",

        primaryIntent:
          summary.primaryIntent ||
          "unknown",

        domain:
          summary.conversationDomain ||
          "general",

        contextLane:
          summary.contextLane ||
          summary.lane ||
          "direct_current_turn",

        primaryLane:
          summary.primaryLane ||
          null,

        capabilities:
          summary.requiredCapabilities ||
          [],

        planner:
          summary.selectedPlanner ||
          null
      },

      runInstructions: {
        continuity:
          Boolean(
            summary.laneSplit?.routing
              ?.useThread ||
            summary.laneSplit?.routing
              ?.useMemory ||
            summary.laneSplit?.routing
              ?.useRelationship
          ),

        thread:
          summary.laneSplit?.routing
            ?.useThread === true,

        memory:
          summary.laneSplit?.routing
            ?.useMemory === true,

        relationship:
          summary.laneSplit?.routing
            ?.useRelationship === true,

        deepSafety: false,
        situationMap: true,
        triage: true,

        developer:
          summary.shouldRunDeveloperLayer === true,

        heavyReasoning: true,
        fastPath: false
      },

      authority: {
        canChooseRoute: false,
        canPerformReasoning: false,

        role:
          "compatibility_executive_fallback"
      }
    };
  }
};

console.log(
  "ARI DELIBERATION PIPELINE LOADED:",
  window.AriDeliberationPipeline?.version
);