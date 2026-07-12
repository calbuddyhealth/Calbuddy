// ari/pipelines/ari-deliberation-pipeline.js
// Ari Deliberation Pipeline
// Purpose: Coordinate continuity, safety, situation, memory,
// understanding, reasoning, and response planning stages.
// V1.1.0 — Accumulated State Protection + Corrected Deliberation Order

window.Ari = window.Ari || {};

window.AriDeliberationPipeline = {
  version: "1.1.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
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

    // =================================================
    // 1. Continuity Stage
    // Resolve current-turn dependence, prior-thread
    // context, references, and continuity requirements.
    // =================================================

    mark("before continuityStage");

    state =
      await this.runStage(
        window.AriContinuityStage,
        state,
        runtime,
        "continuity"
      );

    mark("after continuityStage");

    // =================================================
    // 2. Safety Stage
    // Establish response-governance requirements before
    // deeper interpretation or reasoning occurs.
    // =================================================

    mark("before safetyStage");

    state =
      await this.runStage(
        window.AriSafetyDeliberationStage,
        state,
        runtime,
        "safety"
      );

    mark("after safetyStage");

    // =================================================
    // 3. Situation Stage
    // Model the active situation, triage lane, and
    // multi-lane response requirements.
    // =================================================

    mark("before situationStage");

    state =
      await this.runStage(
        window.AriSituationStage,
        state,
        runtime,
        "situation"
      );

    mark("after situationStage");

    // =================================================
    // 4. Memory Stage
    // Retrieve durable context only when routing requires
    // it, then build a controlled memory handoff.
    // =================================================

    mark("before memoryStage");

    state =
      await this.runStage(
        window.AriMemoryStage,
        state,
        runtime,
        "memory"
      );

    mark("after memoryStage");

    // =================================================
    // 5. Understanding Stage
    // Build the final deliberative understanding using
    // current-turn, continuity, situation, and memory.
    // =================================================

    mark("before understandingStage");

    state =
      await this.runStage(
        window.AriUnderstandingStage,
        state,
        runtime,
        "understanding"
      );

    mark("after understandingStage");

    // =================================================
    // 6. Reasoning Stage
    // Reason only after the relevant continuity, safety,
    // situation, memory, and understanding outputs exist.
    // =================================================

    mark("before reasoningStage");

    state =
      await this.runStage(
        window.AriReasoningStage,
        state,
        runtime,
        "reasoning"
      );

    mark("after reasoningStage");

    // =================================================
    // 7. Response Planning Stage
    // Convert the completed deliberative state into a
    // controlled response strategy for expression.
    // =================================================

    mark("before responsePlanningStage");

    state =
      await this.runStage(
        window.AriResponsePlanningStage,
        state,
        runtime,
        "response_planning"
      );

    mark("after responsePlanningStage");

    // =================================================
    // Deliberation Packet
    // =================================================

    state.deliberationPacket =
      this.buildDeliberationPacket(state);

    // Temporary compatibility alias.
    state.deliberationContract =
      state.deliberationPacket;

    state.deliberationPipelineRan =
      true;

    state.deliberationPipelineSource =
      "ari-deliberation-pipeline";

    state.deliberationPipelineVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Stage runner
  // ===================================================

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (!stage || typeof stage.run !== "function") {
      return {
        ...summary,

        [`${stageName}StageRan`]:
          false,

        [`${stageName}StageSource`]:
          "not-loaded",

        [`${stageName}StageError`]:
          `The ${stageName} stage was not loaded.`,

        deliberationStageErrors: [
          ...(
            Array.isArray(
              summary.deliberationStageErrors
            )
              ? summary.deliberationStageErrors
              : []
          ),

          {
            stage:
              stageName,

            error:
              "stage_not_loaded"
          }
        ]
      };
    }

    try {
      const result =
        await stage.run(
          summary,
          runtime
        );

      if (!result || typeof result !== "object") {
        return {
          ...summary,

          [`${stageName}StageRan`]:
            false,

          [`${stageName}StageSource`]:
            "invalid-result",

          [`${stageName}StageError`]:
            `The ${stageName} stage returned an invalid result.`,

          deliberationStageErrors: [
            ...(
              Array.isArray(
                summary.deliberationStageErrors
              )
                ? summary.deliberationStageErrors
                : []
            ),

            {
              stage:
                stageName,

              error:
                "invalid_stage_result"
            }
          ]
        };
      }

      // The orchestrator owns accumulated deliberation state.
      // A stage may return either:
      // - the complete state, or
      // - only the fields it produced.
      //
      // Merging here prevents a partial stage result from
      // deleting outputs produced by earlier stages.
      return {
        ...summary,
        ...result
      };
    } catch (error) {
      console.error(
        `Ari deliberation stage error: ${stageName}`,
        error
      );

      return {
        ...summary,

        [`${stageName}StageRan`]:
          false,

        [`${stageName}StageSource`]:
          "stage-error",

        [`${stageName}StageError`]:
          error?.message ||
          String(error),

        deliberationStageErrors: [
          ...(
            Array.isArray(
              summary.deliberationStageErrors
            )
              ? summary.deliberationStageErrors
              : []
          ),

          {
            stage:
              stageName,

            error:
              error?.message ||
              String(error)
          }
        ]
      };
    }
  },

  // ===================================================
  // Deliberation Packet
  // ===================================================

  buildDeliberationPacket(summary = {}) {
    return {
      ready:
        true,

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
      // Stage packets
      // -----------------------------------------------

      stages: {
        continuity:
          summary.continuityStagePacket ||
          null,

        safety:
          summary.safetyStagePacket ||
          null,

        situation:
          summary.situationStagePacket ||
          null,

        memory:
          summary.memoryStagePacket ||
          null,

        understanding:
          summary.understandingStagePacket ||
          null,

        reasoning:
          summary.reasoningStagePacket ||
          null,

        responsePlanning:
          summary.responsePlanningStagePacket ||
          null
      },

      // -----------------------------------------------
      // Request
      // -----------------------------------------------

      request: {
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
          summary.currentTurnWasResolved === true
      },

      // -----------------------------------------------
      // Context
      // -----------------------------------------------

      context: {
        contextLane:
          summary.contextLane ||
          summary.routingContract
            ?.contextLane ||
          null,

        continuityRequired:
          summary.shouldUseContinuity === true,

        continuityFacts:
          summary.continuityUsableFacts ||
          [],

        memoryAvailable:
          summary.memoryAvailable === true,

        memoryFacts:
          summary.memoryFacts ||
          [],

        unresolvedReferences:
          summary.continuityUnresolvedReferences ||
          []
      },

      // -----------------------------------------------
      // Safety
      // -----------------------------------------------

      safety: {
        applicable:
          summary.safetyApplicable === true,

        riskLevel:
          summary.resolvedSafetyRiskLevel ||
          summary.safetyDisposition
            ?.riskLevel ||
          "none",

        riskType:
          summary.resolvedSafetyRiskType ||
          summary.safetyDisposition
            ?.riskType ||
          "none",

        authority:
          summary.resolvedSafetyAuthority ||
          summary.safetyDisposition
            ?.safetyAuthority ||
          "none",

        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse === true,

        requiresClarification:
          summary
            .safetyRequiresClarification === true,

        contract:
          summary.safetyResponseContract ||
          null
      },

      // -----------------------------------------------
      // Situation and lanes
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
          null,

        primaryLane:
          summary.primaryLane ||
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
      // Memory
      // -----------------------------------------------

      memory: {
        retrievalRan:
          summary.memoryRetrievalRan === true,

        contextBuilt:
          summary.memoryContextBuilderRan === true,

        available:
          summary.memoryAvailable === true,

        facts:
          summary.memoryFacts ||
          [],

        context:
          summary.memoryContext ||
          null,

        handoff:
          summary.memoryHandoff ||
          null
      },

      // -----------------------------------------------
      // Understanding
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
          null,

        handoff:
          summary.understandingHandoff ||
          null
      },

      // -----------------------------------------------
      // Reasoning
      // -----------------------------------------------

      reasoning: {
        cognitiveExecutive:
          summary.cognitiveExecutive ||
          null,

        general:
          summary.reasoning ||
          {},

        requirements:
          summary.reasoningRequirements ||
          null,

        developer: {
          applicable:
            summary
              .shouldRunDeveloperLayer === true,

          ran:
            summary.developerLayerRan === true,

          responseLocked:
            summary
              .developerResponseLocked === true,

          handoff:
            summary.developerHandoff ||
            summary.unlockedDeveloperHandoff ||
            null,

          composerPacket:
            summary.composerDeveloperPacket ||
            null
        }
      },

      // -----------------------------------------------
      // Final response strategy handoff
      // -----------------------------------------------

      responseStrategy:
        summary.responseStrategy ||
        null,

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          summary.responseOrder ||
          [],

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      // -----------------------------------------------
      // Quality
      // -----------------------------------------------

      quality: {
        allStagesLoaded:
          !(
            summary.deliberationStageErrors
              ?.length
          ),

        stageErrors:
          summary.deliberationStageErrors ||
          [],

        hasResolvedRequest:
          Boolean(
            String(
              summary.resolvedUserQuestion ||
              summary.userMessage ||
              ""
            ).trim()
          ),

        hasRoutingContract:
          Boolean(
            summary.routingContract
          ),

        hasSituationContract:
          Boolean(
            summary.situationContract
          ),

        hasResponseStrategy:
          Boolean(
            summary.responseStrategy
          ),

        developerResponseLocked:
          summary
            .developerResponseLocked === true
      },

      // -----------------------------------------------
      // Authority boundary
      // -----------------------------------------------

      authority: {
        canRetrieveContext:
          true,

        canAdjudicateSafety:
          true,

        canModelSituation:
          true,

        canPerformReasoning:
          true,

        canRetrieveMemory:
          true,

        canInterpretMeaning:
          true,

        canDefineResponseStrategy:
          true,

        canChooseFinalRoute:
          false,

        canChangeOfficialMode:
          false,

        canChangeOfficialIntent:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "deliberation_stage_orchestration_and_strategy_handoff"
      }
    };
  },

  // ===================================================
  // Executive fallback
  // ===================================================

  buildFallbackExecutivePacket(summary = {}) {
    return {
      ready:
        false,

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
            summary.laneSplit
              ?.routing?.useThread ||
            summary.laneSplit
              ?.routing?.useMemory ||
            summary.laneSplit
              ?.routing?.useRelationship
          ),

        thread:
          summary.laneSplit
            ?.routing?.useThread === true,

        memory:
          summary.laneSplit
            ?.routing?.useMemory === true,

        relationship:
          summary.laneSplit
            ?.routing?.useRelationship === true,

        deepSafety:
          false,

        situationMap:
          true,

        triage:
          true,

        developer:
          summary.shouldRunDeveloperLayer === true,

        heavyReasoning:
          true,

        fastPath:
          false
      },

      authority: {
        canChooseRoute:
          false,

        canChooseApplicability:
          false,

        canPerformReasoning:
          false,

        canWriteFinalLanguage:
          false,

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