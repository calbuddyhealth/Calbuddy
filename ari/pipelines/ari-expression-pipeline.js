// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
// Purpose: Coordinate character guidance, language guidance,
// draft generation, arbitration, and final composition.
// V1.0.0 — Five-Stage Expression Orchestrator

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "expression"
    };

    const deliberationPacket =
      state.deliberationPacket ||
      this.buildFallbackDeliberationPacket(state);

    state = {
      ...state,
      deliberationPacket
    };

    // =================================================
    // 1. Character Stage
    // =================================================

    mark("before characterStage");

    state =
      await this.runStage(
        window.AriCharacterStage,
        state,
        runtime,
        "character"
      );

    mark("after characterStage");

    // =================================================
    // 2. Language Guidance Stage
    // =================================================

    mark("before languageGuidanceStage");

    state =
      await this.runStage(
        window.AriLanguageGuidanceStage,
        state,
        runtime,
        "languageGuidance"
      );

    mark("after languageGuidanceStage");

    // =================================================
    // 3. Draft Generation Stage
    // =================================================

    mark("before draftGenerationStage");

    state =
      await this.runStage(
        window.AriDraftGenerationStage,
        state,
        runtime,
        "draftGeneration"
      );

    mark("after draftGenerationStage");

    // =================================================
    // 4. Draft Arbitration Stage
    // =================================================

    mark("before draftArbitrationStage");

    state =
      await this.runStage(
        window.AriDraftArbitrationStage,
        state,
        runtime,
        "draftArbitration"
      );

    mark("after draftArbitrationStage");

    // =================================================
    // 5. Final Composition Stage
    // =================================================

    mark("before finalCompositionStage");

    state =
      await this.runStage(
        window.AriFinalCompositionStage,
        state,
        runtime,
        "finalComposition"
      );

    mark("after finalCompositionStage");

    // =================================================
    // Expression Packet
    // =================================================

    state.expressionPacket =
      this.buildExpressionPacket(state);

    state.responseResult =
      state.expressionPacket;

    state.expressionPipelineRan =
      true;

    state.expressionPipelineSource =
      "ari-expression-pipeline";

    state.expressionPipelineVersion =
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

        expressionStageErrors: [
          ...(
            Array.isArray(
              summary.expressionStageErrors
            )
              ? summary.expressionStageErrors
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

          expressionStageErrors: [
            ...(
              Array.isArray(
                summary.expressionStageErrors
              )
                ? summary.expressionStageErrors
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

      return result;
    } catch (error) {
      console.error(
        `Ari expression stage error: ${stageName}`,
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

        expressionStageErrors: [
          ...(
            Array.isArray(
              summary.expressionStageErrors
            )
              ? summary.expressionStageErrors
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
  // Expression Packet
  // ===================================================

  buildExpressionPacket(summary = {}) {
    return {
      ready:
        summary.finalResponseUsable === true ||
        Boolean(
          String(
            summary.finalResponse ||
            ""
          ).trim()
        ),

      source:
        "ari-expression-pipeline",

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

      deliberationPacket:
        summary.deliberationPacket ||
        null,

      // -----------------------------------------------
      // Stage packets
      // -----------------------------------------------

      stages: {
        character:
          summary.characterStagePacket ||
          null,

        languageGuidance:
          summary.languageGuidanceStagePacket ||
          null,

        draftGeneration:
          summary.draftGenerationStagePacket ||
          null,

        draftArbitration:
          summary.draftArbitrationStagePacket ||
          null,

        finalComposition:
          summary.finalCompositionStagePacket ||
          null
      },

      // -----------------------------------------------
      // Character guidance
      // -----------------------------------------------

      character: {
        handoff:
          summary.characterHandoff ||
          null,

        enabled:
          summary.characterHandoff
            ?.enabled === true,

        relevant:
          summary.characterHandoff
            ?.relevant === true,

        draft:
          summary.characterHandoff
            ?.draft ||
          null
      },

      // -----------------------------------------------
      // Language guidance
      // -----------------------------------------------

      languageGuidance: {
        handoff:
          summary.languageGuidanceHandoff ||
          null,

        lexicalGrounding:
          summary.lexicalGrounding ||
          null,

        humanLanguageProfile:
          summary.humanLanguageProfile ||
          {},

        expressionPlan:
          summary.expressionPlan ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null,

        mouthDirective:
          summary.mouthDirective ||
          null
      },

      // -----------------------------------------------
      // Draft generation
      // -----------------------------------------------

      generation: {
        composerPacket:
          summary.composerPacket ||
          null,

        blueprintDraft:
          summary.blueprintWriterDraft ||
          null,

        characterDraft:
          summary.characterDraftCandidate ||
          null,

        candidates:
          summary.candidateDrafts ||
          []
      },

      // -----------------------------------------------
      // Arbitration
      // -----------------------------------------------

      arbitration: {
        precheck:
          summary.arbiterPrecheck ||
          null,

        aiWriter:
          summary.aiWriter ||
          null,

        selectedDraft:
          summary.selectedDraft ||
          null,

        selectedSource:
          summary.selectedDraftSource ||
          null,

        handoff:
          summary.arbitrationHandoff ||
          null
      },

      // -----------------------------------------------
      // Final response
      // -----------------------------------------------

      result: {
        finalResponse:
          summary.finalResponse ||
          null,

        usable:
          summary.finalResponseUsable === true,

        source:
          summary.finalResponseSource ||
          null,

        length:
          summary.finalResponseLength ||
          0,

        warnings:
          summary.finalResponseWarnings ||
          [],

        emotion:
          summary.emotion ||
          summary.characterHandoff
            ?.emotion ||
          null
      },

      // -----------------------------------------------
      // Response controls used
      // -----------------------------------------------

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
            summary.expressionStageErrors
              ?.length
          ),

        stageErrors:
          summary.expressionStageErrors ||
          [],

        composerPacketReady:
          summary.composerPacketReady === true,

        hasCandidateDrafts:
          Boolean(
            summary.candidateDrafts?.length
          ),

        hasSelectedDraft:
          Boolean(
            String(
              summary.selectedDraft ||
              ""
            ).trim()
          ),

        finalResponseUsable:
          summary.finalResponseUsable === true,

        developerResponseLocked:
          summary.developerResponseLocked === true
      },

      // -----------------------------------------------
      // Authority boundary
      // -----------------------------------------------

      authority: {
        canApplyCharacterGuidance:
          true,

        canApplyLanguageGuidance:
          true,

        canGenerateDraftCandidates:
          true,

        canRunAIWriter:
          true,

        canSelectPreferredDraft:
          true,

        canComposeFinalLanguage:
          true,

        canChangeOfficialRoute:
          false,

        canChangeSafetyDisposition:
          false,

        canExecuteActions:
          false,

        canPersistState:
          false,

        role:
          "expression_stage_orchestration_and_final_response_handoff"
      }
    };
  },

  // ===================================================
  // Deliberation fallback
  // ===================================================

  buildFallbackDeliberationPacket(
    summary = {}
  ) {
    return {
      ready:
        false,

      source:
        "ari-expression-pipeline-fallback",

      version:
        this.version,

      routingContract:
        summary.routingContract ||
        null,

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
          ""
      },

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
          []
      },

      authority: {
        canWriteFinalLanguage:
          false,

        role:
          "compatibility_deliberation_fallback"
      }
    };
  }
};

console.log(
  "ARI EXPRESSION PIPELINE LOADED:",
  window.AriExpressionPipeline?.version
);