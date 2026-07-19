// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
//
// Purpose:
// Coordinate character guidance, language guidance, primary OpenAI response
// realization, final composition, and canonical expression handoff.
//
// V3.0.0 — Validated Semantic Realization / Immutable Response Plan
//
// Canonical flow:
//
// Deliberation Pipeline
//      ↓
// Validated Semantic Frame
//      ↓
// Approved Response Plan
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
// Authority model:
// - OpenAI Reasoning owns semantic meaning.
// - AriSemanticFrameValidator approves or rejects semantic meaning.
// - Response Planning defines the response contract.
// - Expression realizes language from validated meaning and an approved plan.
// - Character and language guidance may shape style only.
// - Final Composition may normalize presentation only.
// - No Expression stage may reinterpret meaning, change operations,
//   weaken safety, or add unsupported claims.

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-expression-pipeline",
  architecture:
    "validated-semantic-direct-response-realization",

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
        null,

      expressionStageErrors:
        Array.isArray(
          summary.expressionStageErrors
        )
          ? [
              ...summary.expressionStageErrors
            ]
          : []
    };

    /* =================================================
       0. DELIBERATION CONTRACT
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
        this.architecture,

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
       1. EXPRESSION INPUT GOVERNANCE
    ================================================= */

    mark(
      "before expressionInputGovernance"
    );

    const expressionInputGovernance =
      this.validateExpressionInputs(
        state
      );

    state = {
      ...state,

      expressionInputGovernance,

      expressionInputGovernanceRan:
        true,

      expressionInputGovernanceSource:
        this.source,

      expressionInputGovernanceVersion:
        this.version
    };

    mark(
      "after expressionInputGovernance"
    );

    if (
      expressionInputGovernance
        .ready !==
      true
    ) {
      state =
        this.recordStageFailure({
          summary:
            state,

          stageName:
            "expressionInputGovernance",

          source:
            "expression-governance",

          error:
            "expression_inputs_not_ready",

          message:
            "Expression was blocked because validated semantic meaning and an approved response plan were not available."
        });

      state.expressionPacket =
        this.buildExpressionPacket(
          state
        );

      state.responseResult =
        state.expressionPacket;

      state.expressionPipelineRan =
        true;

      state.expressionPipelineReady =
        false;

      state.expressionPipelineSource =
        this.source;

      state.expressionPipelineVersion =
        this.version;

      state.activeExpressionStage =
        null;

      return state;
    }

    /* =================================================
       2. CHARACTER STAGE
       Style guidance only.
    ================================================= */

    mark(
      "before characterStage"
    );

    state =
      await this.runStage(
        window.AriCharacterStage ||
        window.Ari?.characterStage,
        state,
        runtime,
        "character"
      );

    mark(
      "after characterStage"
    );

    /* =================================================
       3. LANGUAGE GUIDANCE STAGE
       Lexical and presentation guidance only.
    ================================================= */

    mark(
      "before languageGuidanceStage"
    );

    state =
      await this.runStage(
        window.AriLanguageGuidanceStage ||
        window.Ari?.languageGuidanceStage,
        state,
        runtime,
        "languageGuidance"
      );

    mark(
      "after languageGuidanceStage"
    );

    /* =================================================
       4. RESPONSE REALIZATION STAGE
       Produces final-language content from:
       - validatedSemanticFrame
       - validatedResponseRequirements
       - approved response plan
       - safety and style constraints
    ================================================= */

    mark(
      "before responseRealizationStage"
    );

    state =
      await this.runStage(
        window.AriResponseRealizationStage ||
        window.Ari?.responseRealizationStage,
        state,
        runtime,
        "responseRealization"
      );

    mark(
      "after responseRealizationStage"
    );

    /* =================================================
       5. FINAL COMPOSITION STAGE
       Presentation normalization only.
    ================================================= */

    mark(
      "before finalCompositionStage"
    );

    state =
      await this.runStage(
        window.AriFinalCompositionStage ||
        window.Ari?.finalCompositionStage,
        state,
        runtime,
        "finalComposition"
      );

    mark(
      "after finalCompositionStage"
    );

    /* =================================================
       6. EXPRESSION DIAGNOSTICS
    ================================================= */

    const expressionDiagnostics =
      this.buildExpressionDiagnostics(
        state
      );

    state = {
      ...state,

      expressionDiagnostics,

      expressionHealthy:
        expressionDiagnostics.healthy,

      expressionWarnings:
        expressionDiagnostics.warnings
    };

    /* =================================================
       7. EXPRESSION PACKET
    ================================================= */

    state.expressionPacket =
      this.buildExpressionPacket(
        state
      );

    state.responseResult =
      state.expressionPacket;

    state.expressionPipelineRan =
      true;

    state.expressionPipelineReady =
      state.expressionPacket
        ?.ready ===
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
          "object" ||
        Array.isArray(result)
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
     INPUT GOVERNANCE
  ===================================================== */

  validateExpressionInputs(
    summary = {}
  ) {
    const errors = [];
    const warnings = [];

    const deliberationPacket =
      summary.deliberationPacket ||
      null;

    const semanticValidationAccepted =
      summary
        .semanticValidationAccepted ===
        true ||
      deliberationPacket
        ?.semanticValidation
        ?.accepted ===
        true;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      deliberationPacket
        ?.responsePlanning
        ?.plan ||
      null;

    const validatedResponseRequirements =
      summary
        .validatedResponseRequirements ||
      deliberationPacket
        ?.semanticValidation
        ?.responseRequirements ||
      null;

    if (
      !deliberationPacket
    ) {
      errors.push(
        "deliberation_packet_missing"
      );
    }

    if (
      !semanticValidationAccepted
    ) {
      errors.push(
        "semantic_validation_not_accepted"
      );
    }

    if (
      !validatedSemanticFrame
    ) {
      errors.push(
        "validated_semantic_frame_missing"
      );
    }

    if (
      !responsePlan
    ) {
      errors.push(
        "response_plan_missing"
      );
    }

    if (
      !validatedResponseRequirements
    ) {
      warnings.push(
        "validated_response_requirements_missing"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
        0,

      source:
        "ari-expression-input-governance",

      version:
        this.version,

      errors,
      warnings,

      contracts: {
        deliberationPacketAvailable:
          Boolean(
            deliberationPacket
          ),

        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        responsePlanAvailable:
          Boolean(
            responsePlan
          ),

        validatedResponseRequirementsAvailable:
          Boolean(
            validatedResponseRequirements
          )
      },

      authority: {
        canValidateExpressionInputs:
          true,

        canInterpretMeaning:
          false,

        canRepairSemantics:
          false,

        canCreateResponsePlan:
          false
      }
    };
  },

  /* =====================================================
     EXPRESSION DIAGNOSTICS
  ===================================================== */

  buildExpressionDiagnostics(
    summary = {}
  ) {
    const errors = [
      ...this.toArray(
        summary.expressionStageErrors
      )
    ];

    const warnings = [
      ...this.toArray(
        summary
          .expressionInputGovernance
          ?.warnings
      )
    ];

    const finalResponse =
      this.extractText(
        summary.finalResponse ||
        summary
          .finalCompositionHandoff
          ?.finalResponse ||
        summary
          .realizationResponseText ||
        summary
          .realizationPacket
          ?.responseText ||
        ""
      );

    const semanticValidationAccepted =
      summary
        .semanticValidationAccepted ===
        true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted ===
        true;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      summary.deliberationPacket
        ?.responsePlanning
        ?.plan ||
      null;

    if (
      !semanticValidationAccepted
    ) {
      errors.push({
        stage:
          "expression",

        error:
          "semantic_validation_not_accepted"
      });
    }

    if (
      !validatedSemanticFrame
    ) {
      errors.push({
        stage:
          "expression",

        error:
          "validated_semantic_frame_missing"
      });
    }

    if (
      !responsePlan
    ) {
      errors.push({
        stage:
          "expression",

        error:
          "response_plan_missing"
      });
    }

    if (
      !finalResponse
    ) {
      errors.push({
        stage:
          "final_composition",

        error:
          "final_response_missing"
      });
    }

    return {
      expressionDiagnosticsRan:
        true,

      expressionDiagnosticsVersion:
        this.version,

      healthy:
        errors.length ===
        0,

      complete:
        errors.length ===
          0 &&
        Boolean(
          finalResponse
        ),

      errors,
      warnings,

      stages: {
        inputGovernance:
          summary
            .expressionInputGovernance
            ?.valid ===
          true,

        character:
          summary.characterStageRan ===
          true,

        languageGuidance:
          summary
            .languageGuidanceStageRan ===
          true,

        responseRealization:
          summary
            .responseRealizationStageRan ===
          true,

        finalComposition:
          summary
            .finalCompositionStageRan ===
          true
      },

      contracts: {
        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        responsePlanAvailable:
          Boolean(
            responsePlan
          ),

        finalResponseAvailable:
          Boolean(
            finalResponse
          )
      },

      invariants: {
        realizationUsesValidatedMeaning:
          semanticValidationAccepted &&
          Boolean(
            validatedSemanticFrame
          ),

        realizationUsesApprovedPlan:
          Boolean(
            responsePlan
          ),

        styleStagesCannotChangeMeaning:
          true,

        finalCompositionCannotChangeMeaning:
          true
      }
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
        summary.finalResponse ||
        summary
          .finalCompositionHandoff
          ?.finalResponse ||
        summary
          .realizationResponseText ||
        summary
          .realizationPacket
          ?.responseText ||
        ""
      );

    const finalResponseUsable =
      summary
        .finalResponseUsable !==
        false &&
      Boolean(
        finalResponse
      );

    const realizationPacket =
      summary.realizationPacket ||
      summary
        .responseRealizationStagePacket ||
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

    const semanticValidationAccepted =
      summary
        .semanticValidationAccepted ===
        true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted ===
        true;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const validatedResponseRequirements =
      summary
        .validatedResponseRequirements ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.responseRequirements ||
      null;

    const responsePlan =
      summary.responsePlan ||
      summary.responseStrategy ||
      summary.deliberationPacket
        ?.responsePlanning
        ?.plan ||
      null;

    const expressionDiagnostics =
      summary.expressionDiagnostics ||
      null;

    return {
      schema:
        "ari_expression_packet",

      schemaVersion:
        this.schemaVersion,

      ready:
        finalResponseUsable &&
        semanticValidationAccepted &&
        Boolean(
          validatedSemanticFrame
        ) &&
        Boolean(
          responsePlan
        ),

      complete:
        expressionDiagnostics
          ?.complete ===
        true,

      healthy:
        expressionDiagnostics
          ?.healthy ===
        true,

      architecture:
        this.architecture,

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

        evidencePacket:
          summary.evidencePacket ||
          summary.perceptionPacket
            ?.evidencePacket ||
          null,

        executivePacket:
          summary.executivePacket ||
          null,

        deliberationPacket:
          summary.deliberationPacket ||
          null,

        validatedSemanticFrame,

        validatedResponseRequirements,

        responsePlan
      },

      /* -----------------------------------------------
         STAGE PACKETS
      ----------------------------------------------- */

      stages: {
        inputGovernance:
          summary
            .expressionInputGovernance ||
          null,

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
          null,

        authority:
          "style_guidance_only"
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
          null,

        authority:
          "language_and_presentation_guidance_only"
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
          realizationPacket
            ?.mode ||
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
          responsePlan,

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
          realizationPacket
            ?.source ||
          null,

        reason:
          summary
            .responseRealizationReason ||
          realizationPacket
            ?.reason ||
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
          null,

        derivedFromValidatedMeaning:
          semanticValidationAccepted &&
          Boolean(
            validatedSemanticFrame
          ),

        derivedFromApprovedPlan:
          Boolean(
            responsePlan
          )
      },

      /* -----------------------------------------------
         RESPONSE CONTROL
      ----------------------------------------------- */

      responseControl: {
        validatedSemanticFrame,

        validatedResponseRequirements,

        responsePlan,

        goal:
          summary.responseGoal ||
          responsePlan
            ?.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          responsePlan
            ?.responseShape ||
          null,

        posture:
          summary.responsePosture ||
          responsePlan
            ?.responsePosture ||
          null,

        order:
          this.toArray(
            summary.responseOrder ||
            summary.responseMoves ||
            responsePlan
              ?.responseMoves
          ),

        rules:
          this.toArray(
            summary.responseRules ||
            responsePlan
              ?.responseRules
          ),

        constraints:
          this.toArray(
            summary
              .responseConstraints ||
            responsePlan
              ?.responseConstraints
          ),

        requiredBehaviors:
          this.toArray(
            summary.responseRequired ||
            summary.requiredBehaviors ||
            validatedResponseRequirements
              ?.must
          ),

        forbiddenBehaviors:
          this.toArray(
            summary.responseAvoid ||
            summary.forbiddenBehaviors ||
            validatedResponseRequirements
              ?.mustNot
          ),

        communicationPlan:
          summary.communicationPlan ||
          responsePlan
            ?.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          responsePlan
            ?.composerDirective ||
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
            summary
              .validatedSemanticFrame
              ?.continuity
          ),

        handoff:
          summary.continuityHandoff ||
          summary.continuityResult ||
          null,

        validated:
          validatedSemanticFrame
            ?.continuity ||
          null,

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

      diagnostics:
        expressionDiagnostics,

      quality: {
        inputGovernanceValid:
          summary
            .expressionInputGovernance
            ?.valid ===
          true,

        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        responsePlanAvailable:
          Boolean(
            responsePlan
          ),

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

        finalCompositionStageRan:
          summary
            .finalCompositionStageRan ===
          true,

        finalResponseAvailable:
          Boolean(
            finalResponse
          ),

        finalResponseUsable
      },

      /* -----------------------------------------------
         LEGACY STATUS
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

    const effective =
      this.extractText(
        summary.effectiveUserMessage ||
        summary.resolvedUserQuestion ||
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

      request: {
        original,

        effective:
          effective ||
          original
      },

      semanticValidation: {
        accepted:
          summary
            .semanticValidationAccepted ===
          true,

        validatedSemanticFrame:
          summary
            .validatedSemanticFrame ||
          null,

        responseRequirements:
          summary
            .validatedResponseRequirements ||
          null
      },

      responsePlanning: {
        plan:
          summary.responsePlan ||
          summary.responseStrategy ||
          null
      },

      authority: {
        canSupplyCompatibilityInput:
          true,

        canInterpretMeaning:
          false,

        canWriteFinalLanguage:
          false,

        canChangeSemanticMeaning:
          false,

        canCreateResponsePlan:
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

      canRealizeLanguageFromValidatedMeaning:
        true,

      canApplyStyleGuidance:
        true,

      canApplyPresentationGuidance:
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

      canInterpretEvidence:
        false,

      canReinterpretMeaning:
        false,

      canRepairSemanticFrame:
        false,

      canChangeSemanticFrame:
        false,

      canChangeValidatedOperation:
        false,

      canChangeResponseRequirements:
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
        "validated_semantic_direct_response_realization_orchestration"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const errors = [];
    const warnings = [];

    const required = {
      characterStage:
        Boolean(
          window.AriCharacterStage ||
          window.Ari?.characterStage
        ),

      languageGuidanceStage:
        Boolean(
          window.AriLanguageGuidanceStage ||
          window.Ari
            ?.languageGuidanceStage
        ),

      responseRealizationStage:
        Boolean(
          window.AriResponseRealizationStage ||
          window.Ari
            ?.responseRealizationStage
        ),

      finalCompositionStage:
        Boolean(
          window.AriFinalCompositionStage ||
          window.Ari
            ?.finalCompositionStage
        )
    };

    Object.entries(
      required
    )
      .forEach(
        ([
          name,
          loaded
        ]) => {
          if (!loaded) {
            warnings.push(
              `${name}_not_loaded`
            );
          }
        }
      );

    const authority =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canInterpretEvidence",
      "canReinterpretMeaning",
      "canRepairSemanticFrame",
      "canChangeSemanticFrame",
      "canChangeValidatedOperation",
      "canChangeResponseRequirements",
      "canChangeOfficialRoute",
      "canChangeResponsePlan",
      "canChangeSafetyDisposition",
      "canExecuteActions",
      "canRetrieveMemory",
      "canPersistMemory",
      "canPersistState"
    ];

    forbiddenTrue
      .filter(
        key =>
          authority[key] ===
          true
      )
      .forEach(
        key => {
          errors.push(
            `${key}_must_be_false`
          );
        }
      );

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
          0 &&
        warnings.length ===
          0,

      source:
        "ari-expression-pipeline-validation",

      version:
        this.version,

      errors,
      warnings,

      required,

      checks: {
        validatedSemanticFrameRequired:
          true,

        approvedResponsePlanRequired:
          true,

        styleStagesAreNonSemantic:
          true,

        finalCompositionIsNonSemantic:
          true,

        legacyCandidatePipelineDisabled:
          true
      }
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

const ariExpressionPipelineValidation =
  window.AriExpressionPipeline
    ?.validate?.();

console.log(
  "ARI EXPRESSION PIPELINE LOADED:",
  window.AriExpressionPipeline
    ?.version,

  ariExpressionPipelineValidation
    ?.ready ===
    true
    ? "READY"
    : ariExpressionPipelineValidation
        ?.valid ===
        true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariExpressionPipelineValidation
);
