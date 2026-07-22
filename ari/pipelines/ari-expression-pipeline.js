// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
//
// Purpose:
// Coordinate non-semantic character guidance, language guidance,
// deterministic final composition, and canonical expression handoff.
//
// V4.0.0 — Direct Draft Composition / No Realization Authority
//
// Canonical flow:
//
// Deliberation Pipeline
//      ↓
// Validated Semantic Frame
//      ↓
// Approved Response Plan + Authoritative Draft
//      ↓
// Character Stage
//      ↓
// Language Guidance Stage
//      ↓
// Final Composition Stage
//      ↓
// Delivery Pipeline
//
// Authority model:
// - OpenAI Cognitive Reasoning owns semantic meaning and user-facing draft language.
// - AriSemanticFrameValidator approves or rejects semantic meaning.
// - Response Planning governs the response contract and preserves the draft.
// - Character and language guidance may provide style metadata only.
// - Final Composition may deterministically normalize presentation only.
// - Expression may not generate, reinterpret, repair, or replace semantic meaning.
// - Expression performs no OpenAI response-generation pass.

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "4.0.0",
  schemaVersion: "4.0.0",
  source: "ari-expression-pipeline",
  architecture: "validated-semantic-direct-draft-composition",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async run(summary = {}, runtime = {}) {
    const { mark = () => {} } = runtime;

    let state = {
      ...summary,

      activePipelineLayer: "expression",
      activeExpressionStage: null,

      expressionStageErrors: Array.isArray(
        summary.expressionStageErrors
      )
        ? [...summary.expressionStageErrors]
        : [],

      expressionFailureBoundary:
        summary.expressionFailureBoundary || null,

      firstFailedExpressionStage:
        summary.firstFailedExpressionStage || null,

      legacyDraftGenerationEnabled: false,
      legacyDraftArbitrationEnabled: false,
      legacyBlueprintWriterEnabled: false,
      legacyAIWriterEnabled: false,
      legacyCandidateArbiterEnabled: false,
      responseRealizationEnabled: false
    };

    /* =================================================
       0. DELIBERATION CONTRACT
    ================================================= */

    const deliberationPacket =
      state.deliberationPacket ||
      this.buildFallbackDeliberationPacket(state);

    state = {
      ...state,
      deliberationPacket,
      expressionArchitecture: this.architecture
    };

    /* =================================================
       1. EXPRESSION INPUT GOVERNANCE
    ================================================= */

    mark("before expressionInputGovernance");

    const expressionInputGovernance =
      this.validateExpressionInputs(state);

    state = {
      ...state,

      expressionInputGovernance,
      expressionInputGovernanceRan: true,
      expressionInputGovernanceSource: this.source,
      expressionInputGovernanceVersion: this.version
    };

    mark("after expressionInputGovernance");

    if (expressionInputGovernance.ready !== true) {
      return this.finishBlockedPipeline({
        summary: this.recordStageFailure({
          summary: state,
          stageName: "expressionInputGovernance",
          source: "expression-governance",
          error: "expression_inputs_not_ready",
          message:
            "Expression was blocked because validated semantic meaning, an approved response plan, or an authoritative draft was unavailable."
        })
      });
    }

    /* =================================================
       2. CANONICAL AUTHORITATIVE DRAFT
    ================================================= */

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(state);

    state = {
      ...state,

      authoritativeDraft,
      authoritativeDraftAvailable:
        Boolean(authoritativeDraft),

      authoritativeDraftSource:
        this.resolveAuthoritativeDraftSource(state),

      // Canonical aliases supplied to Final Composition.
      compositionInputText:
        authoritativeDraft,

      draftResponse:
        authoritativeDraft
    };

    /* =================================================
       3. CHARACTER STAGE
       Non-semantic style metadata only.
    ================================================= */

    mark("before characterStage");

    state = await this.runStage(
      window.AriCharacterStage ||
        window.Ari?.characterStage,
      state,
      runtime,
      "character"
    );

    mark("after characterStage");

    if (this.hasStageFailed(state, "character")) {
      return this.finishBlockedPipeline({
        summary: state
      });
    }

    /* =================================================
       4. LANGUAGE GUIDANCE STAGE
       Non-semantic lexical and presentation metadata only.
    ================================================= */

    mark("before languageGuidanceStage");

    state = await this.runStage(
      window.AriLanguageGuidanceStage ||
        window.Ari?.languageGuidanceStage,
      state,
      runtime,
      "languageGuidance"
    );

    mark("after languageGuidanceStage");

    if (this.hasStageFailed(state, "languageGuidance")) {
      return this.finishBlockedPipeline({
        summary: state
      });
    }

    /* =================================================
       5. FINAL COMPOSITION STAGE
       Deterministic presentation normalization only.
    ================================================= */

    mark("before finalCompositionStage");

    state = await this.runStage(
      window.AriFinalCompositionStage ||
        window.Ari?.finalCompositionStage,
      state,
      runtime,
      "finalComposition"
    );

    mark("after finalCompositionStage");

    if (this.hasStageFailed(state, "finalComposition")) {
      return this.finishBlockedPipeline({
        summary: state
      });
    }

    /* =================================================
       6. EXPRESSION DIAGNOSTICS
    ================================================= */

    const expressionDiagnostics =
      this.buildExpressionDiagnostics(state);

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

    return this.finishPipeline(state);
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
    if (!stage || typeof stage.run !== "function") {
      return this.recordStageFailure({
        summary,
        stageName,
        source: "not-loaded",
        error: "stage_not_loaded",
        message:
          `The ${stageName} stage was not loaded.`
      });
    }

    try {
      const protectedAuthority =
        this.captureProtectedAuthority(summary);

      const result = await stage.run(
        {
          ...summary,
          activeExpressionStage: stageName
        },
        runtime
      );

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
      ) {
        return this.recordStageFailure({
          summary,
          stageName,
          source: "invalid-result",
          error: "invalid_stage_result",
          message:
            `The ${stageName} stage returned an invalid result.`
        });
      }

      const merged = {
        ...summary,
        ...result,
        activeExpressionStage: stageName
      };

      return {
        ...merged,
        ...protectedAuthority
      };
    } catch (error) {
      console.error(
        `Ari expression stage error: ${stageName}`,
        error
      );

      return this.recordStageFailure({
        summary,
        stageName,
        source: "stage-error",
        error:
          error?.message ||
          String(error),
        message:
          error?.message ||
          String(error)
      });
    }
  },

  captureProtectedAuthority(summary = {}) {
    return {
      deliberationPacket:
        summary.deliberationPacket || null,

      semanticValidationAccepted:
        summary.semanticValidationAccepted === true,

      validatedSemanticFrame:
        summary.validatedSemanticFrame || null,

      validatedResponseRequirements:
        summary.validatedResponseRequirements || null,

      responsePlan:
        summary.responsePlan || null,

      authoritativeDraft:
        summary.authoritativeDraft || "",

      authoritativeDraftSource:
        summary.authoritativeDraftSource || null,

      compositionInputText:
        summary.compositionInputText || "",

      draftResponse:
        summary.draftResponse || ""
    };
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
      stage: stageName,
      error,
      message:
        message ||
        error,
      source,
      timestamp: Date.now()
    };

    return {
      ...summary,

      activeExpressionStage:
        stageName,

      [`${stageName}StageRan`]:
        false,

      [`${stageName}StageSource`]:
        source,

      [`${stageName}StageError`]:
        message ||
        error,

      expressionFailureBoundary:
        summary.expressionFailureBoundary ||
        stageName,

      firstFailedExpressionStage:
        summary.firstFailedExpressionStage ||
        stageName,

      expressionStageErrors: [
        ...existingErrors,
        failure
      ]
    };
  },

  hasStageFailed(
    summary = {},
    stageName = ""
  ) {
    return this.toArray(
      summary.expressionStageErrors
    ).some(
      failure =>
        failure?.stage ===
        stageName
    );
  },

  /* =====================================================
     INPUT GOVERNANCE
  ===================================================== */

  validateExpressionInputs(summary = {}) {
    const errors = [];
    const warnings = [];

    const deliberationPacket =
      summary.deliberationPacket ||
      null;

    const semanticValidationAccepted =
      summary.semanticValidationAccepted === true ||
      deliberationPacket
        ?.semanticValidation
        ?.accepted === true;

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
      summary.validatedResponseRequirements ||
      deliberationPacket
        ?.semanticValidation
        ?.responseRequirements ||
      null;

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(summary);

    if (!deliberationPacket) {
      errors.push(
        "deliberation_packet_missing"
      );
    }

    if (!semanticValidationAccepted) {
      errors.push(
        "semantic_validation_not_accepted"
      );
    }

    if (!validatedSemanticFrame) {
      errors.push(
        "validated_semantic_frame_missing"
      );
    }

    if (!responsePlan) {
      errors.push(
        "response_plan_missing"
      );
    }

    if (!authoritativeDraft) {
      errors.push(
        "authoritative_draft_missing"
      );
    }

    if (!validatedResponseRequirements) {
      warnings.push(
        "validated_response_requirements_missing"
      );
    }

    return {
      valid: errors.length === 0,
      ready: errors.length === 0,

      source:
        "ari-expression-input-governance",

      version:
        this.version,

      errors,
      warnings,

      contracts: {
        deliberationPacketAvailable:
          Boolean(deliberationPacket),

        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(validatedSemanticFrame),

        responsePlanAvailable:
          Boolean(responsePlan),

        authoritativeDraftAvailable:
          Boolean(authoritativeDraft),

        authoritativeDraftSource:
          this.resolveAuthoritativeDraftSource(
            summary
          ),

        validatedResponseRequirementsAvailable:
          Boolean(
            validatedResponseRequirements
          )
      },

      authority: {
        canValidateExpressionInputs: true,
        canInterpretMeaning: false,
        canRepairSemantics: false,
        canCreateResponsePlan: false,
        canGenerateResponseLanguage: false
      }
    };
  },

  /* =====================================================
     AUTHORITATIVE DRAFT RESOLUTION
  ===================================================== */

  resolveAuthoritativeDraft(summary = {}) {
    const deliberationPacket =
      summary.deliberationPacket ||
      null;

    const candidates = [
      summary.authoritativeDraft,

      summary.responsePlan
        ?.draftResponse,

      summary.responsePlanningHandoff
        ?.draftResponse,

      deliberationPacket
        ?.responsePlanning
        ?.plan
        ?.draftResponse,

      deliberationPacket
        ?.responsePlanning
        ?.handoff
        ?.draftResponse,

      summary.cognitiveReasoningResult
        ?.draftResponse,

      summary.cognitiveResult
        ?.draftResponse,

      deliberationPacket
        ?.cognitiveReasoning
        ?.result
        ?.draftResponse,

      summary.draftResponse
    ];

    for (const candidate of candidates) {
      const text =
        this.extractText(candidate);

      if (text) {
        return text;
      }
    }

    return "";
  },

  resolveAuthoritativeDraftSource(
    summary = {}
  ) {
    const deliberationPacket =
      summary.deliberationPacket ||
      null;

    const candidates = [
      [
        "authoritativeDraft",
        summary.authoritativeDraft
      ],

      [
        "responsePlan.draftResponse",
        summary.responsePlan
          ?.draftResponse
      ],

      [
        "responsePlanningHandoff.draftResponse",
        summary.responsePlanningHandoff
          ?.draftResponse
      ],

      [
        "deliberationPacket.responsePlanning.plan.draftResponse",
        deliberationPacket
          ?.responsePlanning
          ?.plan
          ?.draftResponse
      ],

      [
        "deliberationPacket.responsePlanning.handoff.draftResponse",
        deliberationPacket
          ?.responsePlanning
          ?.handoff
          ?.draftResponse
      ],

      [
        "cognitiveReasoningResult.draftResponse",
        summary.cognitiveReasoningResult
          ?.draftResponse
      ],

      [
        "cognitiveResult.draftResponse",
        summary.cognitiveResult
          ?.draftResponse
      ],

      [
        "deliberationPacket.cognitiveReasoning.result.draftResponse",
        deliberationPacket
          ?.cognitiveReasoning
          ?.result
          ?.draftResponse
      ],

      [
        "draftResponse",
        summary.draftResponse
      ]
    ];

    for (const [source, candidate] of candidates) {
      if (this.extractText(candidate)) {
        return source;
      }
    }

    return null;
  },

  /* =====================================================
     EXPRESSION DIAGNOSTICS
  ===================================================== */

  buildExpressionDiagnostics(summary = {}) {
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
      this.resolveFinalResponse(summary);

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(summary);

    const semanticValidationAccepted =
      summary.semanticValidationAccepted === true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted === true;

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

    if (!semanticValidationAccepted) {
      errors.push({
        stage: "expression",
        error:
          "semantic_validation_not_accepted"
      });
    }

    if (!validatedSemanticFrame) {
      errors.push({
        stage: "expression",
        error:
          "validated_semantic_frame_missing"
      });
    }

    if (!responsePlan) {
      errors.push({
        stage: "expression",
        error:
          "response_plan_missing"
      });
    }

    if (!authoritativeDraft) {
      errors.push({
        stage: "expression",
        error:
          "authoritative_draft_missing"
      });
    }

    if (!finalResponse) {
      errors.push({
        stage: "finalComposition",
        error:
          "final_response_missing"
      });
    }

    const characterRequired =
      Boolean(
        window.AriCharacterStage ||
        window.Ari?.characterStage
      );

    const languageGuidanceRequired =
      Boolean(
        window.AriLanguageGuidanceStage ||
        window.Ari?.languageGuidanceStage
      );

    return {
      expressionDiagnosticsRan: true,
      expressionDiagnosticsVersion:
        this.version,

      healthy:
        errors.length === 0,

      complete:
        errors.length === 0 &&
        Boolean(finalResponse),

      errors,
      warnings,

      failureBoundary:
        summary.expressionFailureBoundary ||
        null,

      firstFailedStage:
        summary.firstFailedExpressionStage ||
        null,

      stages: {
        inputGovernance:
          summary
            .expressionInputGovernance
            ?.valid === true,

        character:
          characterRequired
            ? summary.characterStageRan === true
            : null,

        languageGuidance:
          languageGuidanceRequired
            ? summary
                .languageGuidanceStageRan === true
            : null,

        finalComposition:
          summary
            .finalCompositionStageRan === true
      },

      contracts: {
        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(
            validatedSemanticFrame
          ),

        responsePlanAvailable:
          Boolean(responsePlan),

        authoritativeDraftAvailable:
          Boolean(authoritativeDraft),

        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(
            summary
          ),

        finalResponseAvailable:
          Boolean(finalResponse)
      },

      invariants: {
        draftComesFromDeliberation:
          Boolean(authoritativeDraft),

        approvedPlanPreserved:
          Boolean(responsePlan),

        styleStagesCannotChangeMeaning:
          true,

        finalCompositionCannotChangeMeaning:
          true,

        responseRealizationDisabled:
          true,

        additionalOpenAIGenerationPass:
          false
      }
    };
  },

  /* =====================================================
     EXPRESSION PACKET
  ===================================================== */

  buildExpressionPacket(summary = {}) {
    const finalResponse =
      this.resolveFinalResponse(summary);

    const authoritativeDraft =
      this.resolveAuthoritativeDraft(summary);

    const finalResponseUsable =
      summary.finalResponseUsable !== false &&
      Boolean(finalResponse);

    const stageErrors =
      this.toArray(
        summary.expressionStageErrors
      );

    const semanticValidationAccepted =
      summary.semanticValidationAccepted === true ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.accepted === true;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      summary.deliberationPacket
        ?.semanticValidation
        ?.validatedSemanticFrame ||
      null;

    const validatedResponseRequirements =
      summary.validatedResponseRequirements ||
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
      schema: "ari_expression_packet",
      schemaVersion: this.schemaVersion,

      ready:
        finalResponseUsable &&
        semanticValidationAccepted &&
        Boolean(validatedSemanticFrame) &&
        Boolean(responsePlan) &&
        Boolean(authoritativeDraft),

      complete:
        expressionDiagnostics?.complete ===
        true,

      healthy:
        expressionDiagnostics?.healthy ===
        true,

      architecture: this.architecture,
      source: this.source,
      version: this.version,

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
        responsePlan,

        authoritativeDraft:
          authoritativeDraft ||
          null,

        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(
            summary
          )
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
            ?.enabled === true,

        relevant:
          summary.characterHandoff
            ?.relevant === true,

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
         FINAL RESPONSE
      ----------------------------------------------- */

      result: {
        finalResponse:
          finalResponse ||
          null,

        authoritativeDraft:
          authoritativeDraft ||
          null,

        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(
            summary
          ),

        usable:
          finalResponseUsable,

        degraded:
          summary
            .finalResponseDegraded === true,

        source:
          summary.finalResponseSource ||
          "final-composition",

        failureReason:
          summary
            .finalResponseFailureReason ||
          null,

        length:
          summary.finalResponseLength ||
          finalResponse.length,

        warnings:
          this.toArray(
            summary.finalResponseWarnings
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
          Boolean(validatedSemanticFrame),

        derivedFromApprovedPlan:
          Boolean(responsePlan),

        derivedFromAuthoritativeDraft:
          Boolean(authoritativeDraft)
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
            summary.responseConstraints ||
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
            validatedSemanticFrame
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
          Boolean(
            summary.continuityHandoff ||
            summary.continuityResult
          ),

        recentTurnCount:
          this.toArray(
            summary.continuityHandoff
              ?.recentTurns ||
            summary.continuityResult
              ?.recentTurns
          ).length
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

        compositionGoverned:
          semanticValidationAccepted &&
          Boolean(
            validatedResponseRequirements
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
            ?.valid === true,

        semanticValidationAccepted,

        validatedSemanticFrameAvailable:
          Boolean(validatedSemanticFrame),

        responsePlanAvailable:
          Boolean(responsePlan),

        authoritativeDraftAvailable:
          Boolean(authoritativeDraft),

        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(
            summary
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

        failureBoundary:
          summary.expressionFailureBoundary ||
          null,

        firstFailedStage:
          summary.firstFailedExpressionStage ||
          null,

        characterStageRan:
          summary.characterStageRan === true,

        languageGuidanceStageRan:
          summary
            .languageGuidanceStageRan === true,

        finalCompositionStageRan:
          summary
            .finalCompositionStageRan === true,

        finalResponseAvailable:
          Boolean(finalResponse),

        finalResponseUsable,

        responseRealizationEnabled:
          false,

        additionalGenerationPassUsed:
          false
      },

      /* -----------------------------------------------
         DETACHED / LEGACY STATUS
      ----------------------------------------------- */

      detached: {
        responseRealizationEnabled:
          false,

        responseRealizationStageUsed:
          false,

        responseRealizationEngineUsed:
          false
      },

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
     PIPELINE FINALIZATION
  ===================================================== */

  finishPipeline(summary = {}) {
    const expressionDiagnostics =
      summary.expressionDiagnostics ||
      this.buildExpressionDiagnostics(
        summary
      );

    const state = {
      ...summary,

      expressionDiagnostics,

      expressionHealthy:
        expressionDiagnostics.healthy,

      expressionWarnings:
        expressionDiagnostics.warnings
    };

    const expressionPacket =
      this.buildExpressionPacket(state);

    return {
      ...state,

      expressionPacket,
      responseResult:
        expressionPacket,

      expressionPipelineRan:
        true,

      expressionPipelineReady:
        expressionPacket.ready === true,

      expressionPipelineSource:
        this.source,

      expressionPipelineVersion:
        this.version,

      activeExpressionStage:
        null
    };
  },

  finishBlockedPipeline({
    summary = {}
  } = {}) {
    return this.finishPipeline({
      ...summary,
      expressionHealthy: false
    });
  },

  resolveFinalResponse(summary = {}) {
    return this.extractText(
      summary.finalResponse ||
      summary
        .finalCompositionHandoff
        ?.finalResponse ||
      summary
        .finalCompositionStagePacket
        ?.finalResponse ||
      ""
    );
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
          summary.semanticValidationAccepted ===
          true,

        validatedSemanticFrame:
          summary.validatedSemanticFrame ||
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
          null,

        handoff:
          summary.responsePlanningHandoff ||
          null
      },

      cognitiveReasoning: {
        result:
          summary.cognitiveReasoningResult ||
          summary.cognitiveResult ||
          null
      },

      authority: {
        canSupplyCompatibilityInput: true,
        canInterpretMeaning: false,
        canWriteFinalLanguage: false,
        canChangeSemanticMeaning: false,
        canCreateResponsePlan: false,
        canChangeRouting: false,
        canOverrideSafety: false,
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
      canCoordinateCharacterStage: true,
      canCoordinateLanguageGuidanceStage: true,
      canCoordinateFinalCompositionStage: true,
      canBuildExpressionPacket: true,
      canExposeFinalResponse: true,
      canResolveAuthoritativeDraft: true,
      canApplyStyleGuidance: true,
      canApplyPresentationGuidance: true,

      canCoordinateResponseRealizationStage:
        false,

      canGenerateResponseLanguage:
        false,

      canCallOpenAIForResponseGeneration:
        false,

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

      canChangeAuthoritativeDraft:
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
        "validated_semantic_direct_draft_composition_orchestration"
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

      finalCompositionStage:
        Boolean(
          window.AriFinalCompositionStage ||
          window.Ari
            ?.finalCompositionStage
        )
    };

    Object.entries(required)
      .forEach(
        ([name, loaded]) => {
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
      "canCoordinateResponseRealizationStage",
      "canGenerateResponseLanguage",
      "canCallOpenAIForResponseGeneration",
      "canInterpretEvidence",
      "canReinterpretMeaning",
      "canRepairSemanticFrame",
      "canChangeSemanticFrame",
      "canChangeValidatedOperation",
      "canChangeResponseRequirements",
      "canChangeOfficialRoute",
      "canChangeResponsePlan",
      "canChangeAuthoritativeDraft",
      "canChangeSafetyDisposition",
      "canExecuteActions",
      "canRetrieveMemory",
      "canPersistMemory",
      "canPersistState"
    ];

    forbiddenTrue
      .filter(
        key =>
          authority[key] === true
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
        errors.length === 0,

      ready:
        errors.length === 0 &&
        warnings.length === 0,

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

        authoritativeDraftRequired:
          true,

        styleStagesAreNonSemantic:
          true,

        finalCompositionIsNonSemantic:
          true,

        responseRealizationDetached:
          true,

        additionalGenerationPassDisabled:
          true,

        legacyCandidatePipelineDisabled:
          true
      }
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  extractText(value = null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (typeof value === "string") {
      return this.cleanText(value);
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value).trim();
    }

    if (
      typeof value === "object"
    ) {
      return this.extractText(
        value.text ||
        value.responseText ||
        value.finalResponse ||
        value.languageBody ||
        value.response ||
        value.reply ||
        value.content ||
        value.draftResponse ||
        value.draft ||
        ""
      );
    }

    return "";
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== null &&
          item !== undefined &&
          item !== ""
      );
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

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
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
    ?.ready === true
    ? "READY"
    : ariExpressionPipelineValidation
        ?.valid === true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariExpressionPipelineValidation
);
