// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
//
// Purpose:
// Coordinate Character guidance, language guidance, primary OpenAI response
// realization, and final composition.
//
// V2.0.0 — Direct Realization Architecture / No Candidate Pipeline
//
// Architectural flow:
//
// Deliberation Pipeline
//      ↓
// Character Stage
//      ↓
// Language Guidance Stage
//      ↓
// Response Realization Stage
//      ↓
// Final Composition Stage
//      ↓
// Delivery Pipeline
//
// Responsibilities:
// - Preserve the canonical Deliberation Packet.
// - Run Character guidance.
// - Run language guidance.
// - Run primary OpenAI response realization.
// - Run final composition.
// - Preserve each stage packet.
// - Build the canonical Expression Packet.
// - Expose the final response to Delivery.
//
// Non-responsibilities:
// - Does not run Draft Generation.
// - Does not run Blueprint Writer.
// - Does not run AI Writer.
// - Does not generate candidate arrays.
// - Does not arbitrate response candidates.
// - Does not select a preferred draft.
// - Does not reinterpret semantic meaning.
// - Does not change routing.
// - Does not override safety.
// - Does not execute actions.
// - Does not retrieve or persist memory.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "2.0.0",
  schemaVersion: "2.0.0",
  source: "ari-expression-pipeline",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,

      activePipelineLayer:
        "expression",

      activeExpressionStage:
        null
    };

    /* =================================================
       0. DELIBERATION PACKET
    ================================================= */

    const deliberationPacket =
      state.deliberationPacket ||
      this.buildFallbackDeliberationPacket(
        state
      );

    state = {
      ...state,

      deliberationPacket,

      expressionArchitecture:
        "direct-response-realization",

      legacyDraftGenerationEnabled:
        false,

      legacyDraftArbitrationEnabled:
        false,

      legacyBlueprintWriterEnabled:
        false,

      legacyAIWriterEnabled:
        false,

      legacyCandidateArbiterEnabled:
        false
    };

    /* =================================================
       1. CHARACTER STAGE
    ================================================= */

    mark(
      "before characterStage"
    );

    state =
      await this.runStage(
        window.AriCharacterStage,
        state,
        runtime,
        "character"
      );

    mark(
      "after characterStage"
    );

    /* =================================================
       2. LANGUAGE GUIDANCE STAGE
    ================================================= */

    mark(
      "before languageGuidanceStage"
    );

    state =
      await this.runStage(
        window.AriLanguageGuidanceStage,
        state,
        runtime,
        "languageGuidance"
      );

    mark(
      "after languageGuidanceStage"
    );

    /* =================================================
       3. RESPONSE REALIZATION STAGE
    ================================================= */

    mark(
      "before responseRealizationStage"
    );

    state =
      await this.runStage(
        window.AriResponseRealizationStage,
        state,
        runtime,
        "responseRealization"
      );

    mark(
      "after responseRealizationStage"
    );

    /* =================================================
       4. FINAL COMPOSITION STAGE
    ================================================= */

    mark(
      "before finalCompositionStage"
    );

    state =
      await this.runStage(
        window.AriFinalCompositionStage,
        state,
        runtime,
        "finalComposition"
      );

    mark(
      "after finalCompositionStage"
    );

    /* =================================================
       5. EXPRESSION PACKET
    ================================================= */

    state.expressionPacket =
      this.buildExpressionPacket(
        state
      );

    state.responseResult =
      state.expressionPacket;

    state.expressionPipelineRan =
      true;

    state.expressionPipelineSource =
      this.source;

    state.expressionPipelineVersion =
      this.version;

    state.activeExpressionStage =
      null;

    return state;
  },

  /* =====================================================
     STAGE RUNNER
  ===================================================== */

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (
      !stage ||
      typeof stage.run !==
        "function"
    ) {
      return this.recordStageFailure({
        summary,

        stageName,

        source:
          "not-loaded",

        error:
          "stage_not_loaded",

        message:
          `The ${stageName} stage was not loaded.`
      });
    }

    try {
      const result =
        await stage.run(
          summary,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        return this.recordStageFailure({
          summary,

          stageName,

          source:
            "invalid-result",

          error:
            "invalid_stage_result",

          message:
            `The ${stageName} stage returned an invalid result.`
        });
      }

      return {
  ...summary,
  ...result
};
    } catch (error) {
      console.error(
        `Ari expression stage error: ${stageName}`,
        error
      );

      return this.recordStageFailure({
        summary,

        stageName,

        source:
          "stage-error",

        error:
          error?.message ||
          String(error),

        message:
          error?.message ||
          String(error)
      });
    }
  },

  recordStageFailure({
    summary = {},
    stageName = "unknown",
    source = "stage-error",
    error = "stage_error",
    message = ""
  } = {}) {
    const existingErrors =
      this.toArray(
        summary.expressionStageErrors
      );

    const failure = {
      stage:
        stageName,

      error,

      message:
        message ||
        error,

      source,

      timestamp:
        Date.now()
    };

    return {
      ...summary,

      [`${stageName}StageRan`]:
        false,

      [`${stageName}StageSource`]:
        source,

      [`${stageName}StageError`]:
        message ||
        error,

      expressionStageErrors: [
        ...existingErrors,
        failure
      ]
    };
  },

  /* =====================================================
     EXPRESSION PACKET
  ===================================================== */

  buildExpressionPacket(
    summary = {}
  ) {
    const finalResponse =
      this.extractText(
        summary.finalResponse
      );

    const finalResponseUsable =
      summary
        .finalResponseUsable ===
        true &&
      Boolean(
        finalResponse
      );

    const realizationPacket =
      summary.realizationPacket ||
      null;

    const realizationResponse =
      this.extractText(
        summary
          .realizationResponseText ||
        realizationPacket
          ?.responseText ||
        ""
      );

    const stageErrors =
      this.toArray(
        summary.expressionStageErrors
      );

    return {
      schema:
        "ari_expression_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        finalResponseUsable,

      complete:
        true,

      healthy:
        finalResponseUsable &&
        stageErrors.length ===
          0,

      architecture:
        "direct-response-realization",

      source:
        this.source,

      version:
        this.version,

      /* -----------------------------------------------
         INPUT CONTRACTS
      ----------------------------------------------- */

      input: {
        perceptionPacket:
          summary.perceptionPacket ||
          null,

        executivePacket:
          summary.executivePacket ||
          null,

        deliberationPacket:
          summary.deliberationPacket ||
          null
      },

      /* -----------------------------------------------
         STAGE PACKETS
      ----------------------------------------------- */

      stages: {
        character:
          summary.characterStagePacket ||
          null,

        languageGuidance:
          summary
            .languageGuidanceStagePacket ||
          null,

        responseRealization:
          summary
            .responseRealizationStagePacket ||
          null,

        finalComposition:
          summary
            .finalCompositionStagePacket ||
          null
      },

      /* -----------------------------------------------
         CHARACTER GUIDANCE
      ----------------------------------------------- */

      character: {
        ran:
          summary.characterStageRan ===
          true,

        handoff:
          summary.characterHandoff ||
          null,

        enabled:
          summary.characterHandoff
            ?.enabled ===
          true,

        relevant:
          summary.characterHandoff
            ?.relevant ===
          true,

        emotion:
          summary.emotion ||
          summary.characterHandoff
            ?.emotion ||
          null,

        tone:
          summary.characterHandoff
            ?.tone ||
          null,

        source:
          summary.characterStageSource ||
          null
      },

      /* -----------------------------------------------
         LANGUAGE GUIDANCE
      ----------------------------------------------- */

      languageGuidance: {
        ran:
          summary
            .languageGuidanceStageRan ===
          true,

        handoff:
          summary
            .languageGuidanceHandoff ||
          null,

        lexicalGrounding:
          summary.lexicalGrounding ||
          null,

        humanLanguageProfile:
          summary
            .humanLanguageProfile ||
          null,

        expressionPlan:
          summary.expressionPlan ||
          null,

        communicationPlan:
          summary.communicationPlan ||
          null,

        mouthDirective:
          summary.mouthDirective ||
          null,

        source:
          summary
            .languageGuidanceStageSource ||
          null
      },

      /* -----------------------------------------------
         RESPONSE REALIZATION
      ----------------------------------------------- */

      realization: {
        stageRan:
          summary
            .responseRealizationStageRan ===
          true,

        engineRan:
          summary
            .responseRealizationRan ===
          true,

        ready:
          summary.realizationReady ===
          true,

        usable:
          summary.realizationUsable ===
          true,

        complete:
          summary.realizationComplete ===
          true,

        mode:
          summary.realizationMode ||
          realizationPacket?.mode ||
          null,

        responseText:
          realizationResponse ||
          null,

        suggestedEmoji:
          summary
            .realizationSuggestedEmoji ||
          realizationPacket
            ?.suggestedEmoji ||
          "",

        emojiPlacement:
          summary
            .realizationEmojiPlacement ||
          realizationPacket
            ?.emojiPlacement ||
          "none",

        emojiPurpose:
          summary
            .realizationEmojiPurpose ||
          realizationPacket
            ?.emojiPurpose ||
          null,

        responseStrategy:
          summary
            .realizationResponseStrategy ||
          realizationPacket
            ?.responseStrategy ||
          null,

        composerInstructions:
          summary
            .realizationComposerInstructions ||
          realizationPacket
            ?.composerInstructions ||
          null,

        fulfillment:
          summary
            .realizationFulfillment ||
          realizationPacket
            ?.fulfillment ||
          null,

        grounding:
          summary
            .realizationGrounding ||
          realizationPacket
            ?.grounding ||
          null,

        validation:
          summary
            .realizationValidation ||
          realizationPacket
            ?.validation ||
          null,

        diagnostics:
          summary
            .realizationDiagnostics ||
          realizationPacket
            ?.diagnostics ||
          null,

        handoff:
          summary
            .responseRealizationHandoff ||
          null,

        packet:
          realizationPacket,

        source:
          summary
            .responseRealizationSource ||
          realizationPacket?.source ||
          null,

        reason:
          summary
            .responseRealizationReason ||
          realizationPacket?.reason ||
          null,

        error:
          summary
            .responseRealizationError ||
          null
      },

      /* -----------------------------------------------
         FINAL RESPONSE
      ----------------------------------------------- */

      result: {
        finalResponse:
          finalResponse ||
          null,

        usable:
          finalResponseUsable,

        degraded:
          summary
            .finalResponseDegraded ===
          true,

        source:
          summary
            .finalResponseSource ||
          null,

        failureReason:
          summary
            .finalResponseFailureReason ||
          null,

        length:
          summary
            .finalResponseLength ||
          finalResponse.length,

        warnings:
          this.toArray(
            summary
              .finalResponseWarnings
          ),

        emotion:
          summary.emotion ||
          summary.characterHandoff
            ?.emotion ||
          null,

        handoff:
          summary
            .finalCompositionHandoff ||
          null
      },

      /* -----------------------------------------------
         RESPONSE CONTROL
      ----------------------------------------------- */

      responseControl: {
        goal:
          summary.responseGoal ||
          summary
            .canonicalResponsePlan
            ?.responseGoal ||
          summary.responsePlan
            ?.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          summary
            .canonicalResponsePlan
            ?.responseShape ||
          summary.responsePlan
            ?.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          summary
            .canonicalResponsePlan
            ?.responsePosture ||
          summary.responsePlan
            ?.responsePosture ||
          null,

        order:
          this.toArray(
            summary.responseOrder ||
            summary.responseMoves ||
            summary
              .canonicalResponsePlan
              ?.responseMoves ||
            summary.responsePlan
              ?.responseMoves
          ),

        rules:
          this.toArray(
            summary.responseRules
          ),

        constraints:
          this.toArray(
            summary
              .responseConstraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired ||
            summary.requiredBehaviors
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid ||
            summary.forbiddenBehaviors
          ),

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      /* -----------------------------------------------
         CONTINUITY
      ----------------------------------------------- */

      continuity: {
        available:
          Boolean(
            summary.continuityHandoff ||
            summary.continuityResult ||
            summary.semanticSummary
              ?.continuity
          ),

        handoff:
          summary.continuityHandoff ||
          summary.continuityResult ||
          null,

        semantic:
          summary.semanticSummary
            ?.continuity ||
          null,

        isContinuation:
          summary.semanticSummary
            ?.continuity
            ?.isContinuation ===
            true ||
          summary.continuityHandoff
            ?.isContinuation ===
            true ||
          summary.mode
            ?.isFollowUp ===
            true,

        requiresPriorContext:
          summary.semanticSummary
            ?.continuity
            ?.requiresPriorContext ===
            true ||
          summary.continuityHandoff
            ?.requiresPriorContext ===
            true ||
          summary.mode
            ?.mustReusePriorContext ===
            true,

        recentTurnsUsed:
          realizationPacket
            ?.continuity
            ?.used ===
          true,

        recentTurnCount:
          realizationPacket
            ?.continuity
            ?.recentTurnCount ||
          0
      },

      /* -----------------------------------------------
         SAFETY
      ----------------------------------------------- */

      safety: {
        earlyGate:
          summary.safetyContextGate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          null,

        disposition:
          summary.safetyDisposition ||
          null,

        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse ===
            true ||
          summary.safetyDisposition
            ?.shouldStopNormalResponse ===
            true ||
          summary.deepSafetyResult
            ?.shouldStopNormalResponse ===
            true,

        realizationGoverned:
          Boolean(
            realizationPacket
          )
      },

      /* -----------------------------------------------
         QUALITY
      ----------------------------------------------- */

      quality: {
        allStagesLoaded:
          !stageErrors.some(
            error =>
              error?.error ===
              "stage_not_loaded"
          ),

        stageErrorCount:
          stageErrors.length,

        stageErrors,

        characterStageRan:
          summary.characterStageRan ===
          true,

        languageGuidanceStageRan:
          summary
            .languageGuidanceStageRan ===
          true,

        responseRealizationStageRan:
          summary
            .responseRealizationStageRan ===
          true,

        responseRealizationEngineRan:
          summary
            .responseRealizationRan ===
          true,

        realizationReady:
          summary.realizationReady ===
          true,

        realizationUsable:
          summary.realizationUsable ===
          true,

        realizationComplete:
          summary.realizationComplete ===
          true,

        realizationResponseAvailable:
          Boolean(
            realizationResponse
          ),

        realizationParseSucceeded:
          realizationPacket
            ?.diagnostics
            ?.parseSucceeded ===
          true,

        finalCompositionStageRan:
          summary
            .finalCompositionStageRan ===
          true,

        finalResponseAvailable:
          Boolean(
            finalResponse
          ),

        finalResponseUsable,

        developerResponseLocked:
          summary
            .developerResponseLocked ===
          true,

        responseLocked:
          summary.responseLocked ===
          true
      },

      /* -----------------------------------------------
         LEGACY PATH STATUS
      ----------------------------------------------- */

      legacy: {
        draftGenerationEnabled:
          false,

        draftArbitrationEnabled:
          false,

        blueprintWriterEnabled:
          false,

        aiWriterEnabled:
          false,

        candidateArbiterEnabled:
          false,

        composerBridgeRequired:
          false,

        candidateDraftsUsed:
          false,

        selectedDraftUsed:
          false
      },

      /* -----------------------------------------------
         AUTHORITY
      ----------------------------------------------- */

      authority:
        this.getAuthorityBoundaries()
    };
  },

  /* =====================================================
     DELIBERATION FALLBACK
  ===================================================== */

  buildFallbackDeliberationPacket(
    summary = {}
  ) {
    const original =
      this.extractText(
        summary.originalUserMessage ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const resolved =
      this.extractText(
        summary.resolvedUserQuestion ||
        summary.resolvedQuestion ||
        original
      );

    return {
      schema:
        "ari_deliberation_packet_fallback",

      schemaVersion:
        this.schemaVersion,

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
        original,

        resolved:
          resolved ||
          original
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

        posture:
          summary.responsePosture ||
          null,

        order:
          this.toArray(
            summary.responseOrder ||
            summary.responseMoves
          ),

        rules:
          this.toArray(
            summary.responseRules
          ),

        constraints:
          this.toArray(
            summary
              .responseConstraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired ||
            summary.requiredBehaviors
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid ||
            summary.forbiddenBehaviors
          )
      },

      continuity:
        summary.continuityHandoff ||
        summary.continuityResult ||
        summary.semanticSummary
          ?.continuity ||
        null,

      reasoning:
        summary.reasoningStagePacket ||
        summary.reasoningPacket ||
        null,

      safety:
        summary.safetyDisposition ||
        summary.deepSafetyResult ||
        summary.safetyContextGate ||
        null,

      authority: {
        canSupplyCompatibilityInput:
          true,

        canWriteFinalLanguage:
          false,

        canChangeSemanticMeaning:
          false,

        canChangeRouting:
          false,

        canOverrideSafety:
          false,

        role:
          "compatibility_deliberation_fallback"
      }
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getAuthorityBoundaries() {
    return {
      canCoordinateCharacterStage:
        true,

      canCoordinateLanguageGuidanceStage:
        true,

      canCoordinateResponseRealizationStage:
        true,

      canCoordinateFinalCompositionStage:
        true,

      canBuildExpressionPacket:
        true,

      canExposeFinalResponse:
        true,

      canRunDraftGenerationStage:
        false,

      canRunDraftArbitrationStage:
        false,

      canRunBlueprintWriter:
        false,

      canRunAIWriter:
        false,

      canGenerateCandidateDrafts:
        false,

      canArbitrateCandidates:
        false,

      canSelectPreferredDraft:
        false,

      canRequireComposerBridge:
        false,

      canReinterpretMeaning:
        false,

      canChangeOfficialRoute:
        false,

      canChangeResponsePlan:
        false,

      canChangeSafetyDisposition:
        false,

      canExecuteActions:
        false,

      canRetrieveMemory:
        false,

      canPersistMemory:
        false,

      canPersistState:
        false,

      role:
        "direct_response_realization_expression_orchestration"
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  extractText(
    value = null
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
      return this.cleanText(
        value
      );
    }

    if (
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return String(
        value
      ).trim();
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.extractText(
        value.text ||
        value.responseText ||
        value.finalResponse ||
        value.languageBody ||
        value.response ||
        value.reply ||
        value.content ||
        value.draft ||
        ""
      );
    }

    return "";
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            null &&
          item !==
            undefined &&
          item !==
            ""
      );
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

  cleanText(
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
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  }
};

window.Ari.expressionPipeline =
  window.AriExpressionPipeline;

console.log(
  "ARI EXPRESSION PIPELINE LOADED:",
  window.AriExpressionPipeline
    ?.version
);