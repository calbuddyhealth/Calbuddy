// ari/pipelines/ari-expression-pipeline.js
// Ari Expression Pipeline
//
// Purpose:
// Convert the authoritative OpenAI draft from Deliberation into the
// canonical final response without changing semantic meaning.
//
// V5.0.0 — Authoritative Draft Expression / Deterministic Composition
//
// Canonical flow:
// Deliberation → authoritative draft → optional style guidance →
// optional deterministic composition → Expression Packet → Delivery.
//
// Authority model:
// - OpenAI Cognitive Reasoning owns meaning and draft language.
// - Semantic validation is advisory.
// - Character and language stages provide optional metadata only.
// - Final Composition may normalize presentation only.
// - If composition produces no usable text, preserve the OpenAI draft.
// - Expression performs no OpenAI generation pass.

window.Ari = window.Ari || {};

window.AriExpressionPipeline = {
  version: "5.0.0",
  schemaVersion: "5.0.0",
  source: "ari-expression-pipeline",
  architecture: "authoritative-draft-deterministic-expression",

  async run(summary = {}, runtime = {}) {
    const { mark = () => {} } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "expression",
      activeExpressionStage: null,
      expressionStageErrors: this.toArray(summary.expressionStageErrors),
      expressionWarnings: this.toArray(summary.expressionWarnings),
      expressionFailureBoundary: summary.expressionFailureBoundary || null,
      firstFailedExpressionStage: summary.firstFailedExpressionStage || null,
      responseRealizationEnabled: false,
      legacyDraftGenerationEnabled: false,
      legacyCandidatePipelineEnabled: false
    };

    state = {
      ...state,
      deliberationPacket:
        this.readObject(state.deliberationPacket) ||
        this.buildFallbackDeliberationPacket(state),
      expressionArchitecture: this.architecture
    };

    mark("before expressionInputNormalization");
    state = this.normalizeExpressionInputs(state);
    mark("after expressionInputNormalization");

    mark("before expressionInputGovernance");
    const expressionInputGovernance = this.validateExpressionInputs(state);
    state = {
      ...state,
      expressionInputGovernance,
      expressionInputGovernanceRan: true,
      expressionInputGovernanceSource: this.source,
      expressionInputGovernanceVersion: this.version
    };
    mark("after expressionInputGovernance");

    if (expressionInputGovernance.ready !== true) {
      state = this.recordStageFailure({
        summary: state,
        stageName: "expression_input_governance",
        source: "expression-governance",
        error: "expression_inputs_not_ready",
        message:
          "Expression requires a deliberation packet, usable semantic frame, response plan, and authoritative draft."
      });

      return this.finishPipeline(state);
    }

    state = await this.runOptionalStage({
      summary: state,
      runtime,
      mark,
      stageName: "character",
      markName: "characterStage",
      stage: window.AriCharacterStage || window.Ari?.characterStage
    });

    state = await this.runOptionalStage({
      summary: state,
      runtime,
      mark,
      stageName: "languageGuidance",
      markName: "languageGuidanceStage",
      stage:
        window.AriLanguageGuidanceStage ||
        window.Ari?.languageGuidanceStage
    });

    state = await this.runOptionalStage({
      summary: state,
      runtime,
      mark,
      stageName: "finalComposition",
      markName: "finalCompositionStage",
      stage:
        window.AriFinalCompositionStage ||
        window.Ari?.finalCompositionStage
    });

    state = this.normalizeFinalCompositionOutputs(state);

    const expressionDiagnostics = this.buildExpressionDiagnostics(state);

    state = {
      ...state,
      expressionDiagnostics,
      expressionHealthy: expressionDiagnostics.healthy,
      expressionWarnings: expressionDiagnostics.warnings
    };

    return this.finishPipeline(state);
  },

  normalizeExpressionInputs(summary = {}) {
    const deliberationPacket = this.readObject(summary.deliberationPacket);
    const usableSemanticFrame = this.resolveUsableSemanticFrame(summary);
    const responsePlan = this.resolveResponsePlan(summary);
    const authoritativeDraft = this.resolveAuthoritativeDraft(summary);

    const validatedResponseRequirements =
      this.readObject(summary.validatedResponseRequirements) ||
      this.readObject(summary.responseRequirements) ||
      this.readObject(
        deliberationPacket?.semanticValidation?.responseRequirements
      ) ||
      this.readObject(deliberationPacket?.reasoning?.responseRequirements) ||
      null;

    return {
      ...summary,
      usableSemanticFrame,
      validatedSemanticFrame:
        summary.validatedSemanticFrame || usableSemanticFrame,
      responsePlan,
      authoritativeDraft,
      selectedDraft: authoritativeDraft,
      draftResponse: authoritativeDraft,
      responseText: authoritativeDraft,
      compositionInputText: authoritativeDraft,
      authoritativeDraftAvailable: Boolean(authoritativeDraft),
      authoritativeDraftSource:
        this.resolveAuthoritativeDraftSource(summary),
      validatedResponseRequirements,
      semanticValidationAdvisory: true,
      expressionInputNormalized: true
    };
  },

  validateExpressionInputs(summary = {}) {
    const errors = [];
    const warnings = [];
    const deliberationPacket = this.readObject(summary.deliberationPacket);
    const usableSemanticFrame = this.resolveUsableSemanticFrame(summary);
    const responsePlan = this.resolveResponsePlan(summary);
    const authoritativeDraft = this.resolveAuthoritativeDraft(summary);

    const semanticValidationAccepted =
      summary.semanticValidationAccepted === true ||
      deliberationPacket?.semanticValidation?.accepted === true;

    if (!deliberationPacket) errors.push("deliberation_packet_missing");
    if (!usableSemanticFrame) errors.push("usable_semantic_frame_missing");
    if (!responsePlan) errors.push("response_plan_missing");
    if (!authoritativeDraft) errors.push("authoritative_draft_missing");

    if (!semanticValidationAccepted) {
      warnings.push("semantic_validation_not_accepted_advisory");
    }

    if (!summary.validatedResponseRequirements &&
        !summary.responseRequirements &&
        !deliberationPacket?.semanticValidation?.responseRequirements &&
        !deliberationPacket?.reasoning?.responseRequirements) {
      warnings.push("response_requirements_missing");
    }

    return {
      valid: errors.length === 0,
      ready: errors.length === 0,
      source: "ari-expression-input-governance",
      version: this.version,
      errors,
      warnings,
      contracts: {
        deliberationPacketAvailable: Boolean(deliberationPacket),
        usableSemanticFrameAvailable: Boolean(usableSemanticFrame),
        responsePlanAvailable: Boolean(responsePlan),
        authoritativeDraftAvailable: Boolean(authoritativeDraft),
        authoritativeDraftSource:
          this.resolveAuthoritativeDraftSource(summary),
        semanticValidationAccepted,
        semanticValidationAdvisory: true
      }
    };
  },

  async runOptionalStage({
    summary = {},
    runtime = {},
    mark = () => {},
    stageName = "unknown",
    markName = "unknownStage",
    stage = null
  } = {}) {
    mark(`before ${markName}`);

    if (!stage || typeof stage.run !== "function") {
      mark(`after ${markName}`);
      return {
        ...summary,
        [`${stageName}StageRan`]: false,
        [`${stageName}StageReady`]: null,
        [`${stageName}StageSource`]: "optional-stage-not-loaded",
        expressionWarnings: [
          ...this.toArray(summary.expressionWarnings),
          `${stageName}_stage_not_loaded_optional`
        ]
      };
    }

    try {
      const protectedAuthority = this.captureProtectedAuthority(summary);
      const result = await stage.run(
        { ...summary, activeExpressionStage: stageName },
        runtime
      );

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        mark(`after ${markName}`);
        return {
          ...summary,
          [`${stageName}StageRan`]: false,
          [`${stageName}StageReady`]: false,
          [`${stageName}StageSource`]: "optional-stage-invalid-result",
          expressionWarnings: [
            ...this.toArray(summary.expressionWarnings),
            `${stageName}_stage_invalid_result_optional`
          ]
        };
      }

      mark(`after ${markName}`);

      return {
        ...summary,
        ...result,
        ...protectedAuthority,
        activeExpressionStage: stageName,
        [`${stageName}StageRan`]:
          result[`${stageName}StageRan`] !== false
      };
    } catch (error) {
      console.error(
        `Ari optional expression stage error: ${stageName}`,
        error
      );

      mark(`after ${markName}`);

      return {
        ...summary,
        [`${stageName}StageRan`]: false,
        [`${stageName}StageReady`]: false,
        [`${stageName}StageSource`]: "optional-stage-error",
        [`${stageName}StageError`]: error?.message || String(error),
        expressionWarnings: [
          ...this.toArray(summary.expressionWarnings),
          {
            stage: stageName,
            warning: "optional_stage_failed",
            message: error?.message || String(error)
          }
        ]
      };
    }
  },

  captureProtectedAuthority(summary = {}) {
    return {
      deliberationPacket: summary.deliberationPacket || null,
      usableSemanticFrame: summary.usableSemanticFrame || null,
      validatedSemanticFrame: summary.validatedSemanticFrame || null,
      validatedResponseRequirements:
        summary.validatedResponseRequirements || null,
      responsePlan: summary.responsePlan || null,
      authoritativeDraft: summary.authoritativeDraft || "",
      selectedDraft: summary.selectedDraft || summary.authoritativeDraft || "",
      authoritativeDraftSource: summary.authoritativeDraftSource || null,
      compositionInputText: summary.compositionInputText || "",
      draftResponse: summary.draftResponse || "",
      responseText: summary.responseText || ""
    };
  },

  normalizeFinalCompositionOutputs(summary = {}) {
    const stagePacket = this.readObject(summary.finalCompositionStagePacket);
    const handoff =
      this.readObject(summary.finalCompositionHandoff) ||
      this.readObject(stagePacket?.handoff) ||
      null;

    const composedText = this.firstText(
      summary.finalResponse,
      summary.composedResponse,
      summary.compositionText,
      handoff?.finalResponse,
      handoff?.responseText,
      handoff?.text,
      handoff?.reply,
      stagePacket?.finalResponse,
      stagePacket?.responseText,
      stagePacket?.text,
      stagePacket?.reply,
      stagePacket?.result?.finalResponse,
      stagePacket?.result?.responseText,
      stagePacket?.result?.text
    );

    const authoritativeDraft = this.resolveAuthoritativeDraft(summary);
    const finalResponse = composedText || authoritativeDraft;

    return {
      ...summary,
      finalResponse,
      responseText: finalResponse,
      reply: finalResponse,
      finalCompositionAvailable: Boolean(composedText),
      finalCompositionReady: Boolean(composedText),
      finalResponseAvailable: Boolean(finalResponse),
      finalResponseUsable: Boolean(finalResponse),
      finalResponseSource: composedText
        ? this.resolveFinalResponseSource(summary) || "final-composition"
        : authoritativeDraft
          ? "authoritative-draft-fallback"
          : null,
      finalResponseLength: finalResponse.length,
      finalResponseDegraded: !composedText && Boolean(authoritativeDraft),
      finalCompositionFallbackUsed:
        !composedText && Boolean(authoritativeDraft)
    };
  },

  buildExpressionDiagnostics(summary = {}) {
    const errors = this.toArray(summary.expressionStageErrors);
    const warnings = [
      ...this.toArray(summary.expressionWarnings),
      ...this.toArray(summary.expressionInputGovernance?.warnings)
    ];

    const usableSemanticFrame = this.resolveUsableSemanticFrame(summary);
    const responsePlan = this.resolveResponsePlan(summary);
    const authoritativeDraft = this.resolveAuthoritativeDraft(summary);
    const finalResponse = this.resolveFinalResponse(summary);

    if (!usableSemanticFrame) {
      errors.push({ stage: "expression", error: "usable_semantic_frame_missing" });
    }
    if (!responsePlan) {
      errors.push({ stage: "expression", error: "response_plan_missing" });
    }
    if (!authoritativeDraft) {
      errors.push({ stage: "expression", error: "authoritative_draft_missing" });
    }
    if (!finalResponse) {
      errors.push({ stage: "expression", error: "final_response_missing" });
    }

    const uniqueErrors = this.dedupeErrors(errors);
    const complete =
      uniqueErrors.length === 0 &&
      Boolean(usableSemanticFrame) &&
      Boolean(responsePlan) &&
      Boolean(authoritativeDraft) &&
      Boolean(finalResponse);

    return {
      expressionDiagnosticsRan: true,
      expressionDiagnosticsVersion: this.version,
      healthy: uniqueErrors.length === 0,
      complete,
      ready: complete,
      errors: uniqueErrors,
      warnings,
      failureBoundary: summary.expressionFailureBoundary || null,
      firstFailedStage: summary.firstFailedExpressionStage || null,
      contracts: {
        usableSemanticFrameAvailable: Boolean(usableSemanticFrame),
        responsePlanAvailable: Boolean(responsePlan),
        authoritativeDraftAvailable: Boolean(authoritativeDraft),
        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(summary),
        finalCompositionAvailable:
          summary.finalCompositionAvailable === true,
        finalResponseAvailable: Boolean(finalResponse),
        finalResponseSource: summary.finalResponseSource || null
      },
      invariants: {
        openAIDraftPreserved: Boolean(authoritativeDraft),
        semanticValidationIsAdvisory: true,
        responsePlanRequired: true,
        finalCompositionOptional: true,
        authoritativeDraftFallbackAllowed: true,
        expressionCannotChangeMeaning: true,
        additionalGenerationPassUsed: false
      }
    };
  },

  buildExpressionPacket(summary = {}) {
    const diagnostics =
      summary.expressionDiagnostics ||
      this.buildExpressionDiagnostics(summary);

    const usableSemanticFrame = this.resolveUsableSemanticFrame(summary);
    const responsePlan = this.resolveResponsePlan(summary);
    const authoritativeDraft = this.resolveAuthoritativeDraft(summary);
    const finalResponse = this.resolveFinalResponse(summary);

    const ready =
      diagnostics.complete === true &&
      Boolean(usableSemanticFrame) &&
      Boolean(responsePlan) &&
      Boolean(authoritativeDraft) &&
      Boolean(finalResponse);

    return {
      schema: "ari_expression_packet",
      schemaVersion: this.schemaVersion,
      ready,
      complete: diagnostics.complete === true,
      healthy: diagnostics.healthy === true,
      architecture: this.architecture,
      source: this.source,
      version: this.version,
      input: {
        deliberationPacket: summary.deliberationPacket || null,
        usableSemanticFrame,
        validatedSemanticFrame:
          summary.validatedSemanticFrame || usableSemanticFrame,
        validatedResponseRequirements:
          summary.validatedResponseRequirements || null,
        responsePlan,
        authoritativeDraft,
        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(summary)
      },
      stages: {
        inputGovernance: summary.expressionInputGovernance || null,
        character: summary.characterStagePacket || null,
        languageGuidance: summary.languageGuidanceStagePacket || null,
        finalComposition: summary.finalCompositionStagePacket || null
      },
      result: {
        finalResponse,
        responseText: finalResponse,
        reply: finalResponse,
        usable: Boolean(finalResponse),
        source:
          summary.finalResponseSource || "authoritative-draft-fallback",
        length: finalResponse.length,
        authoritativeDraft,
        authoritativeDraftSource:
          summary.authoritativeDraftSource ||
          this.resolveAuthoritativeDraftSource(summary),
        finalCompositionAvailable:
          summary.finalCompositionAvailable === true,
        finalCompositionFallbackUsed:
          summary.finalCompositionFallbackUsed === true,
        degraded: summary.finalResponseDegraded === true,
        emotion:
          summary.emotion || summary.characterHandoff?.emotion || null
      },
      responseControl: {
        responsePlan,
        goal:
          summary.responseGoal ||
          responsePlan?.responseGoal ||
          responsePlan?.goal ||
          null,
        shape:
          summary.responseShape || responsePlan?.responseShape || null,
        posture:
          summary.responsePosture || responsePlan?.responsePosture || null,
        order: this.toArray(
          summary.responseOrder ||
          summary.responseMoves ||
          responsePlan?.responseMoves
        ),
        rules: this.toArray(
          summary.responseRules || responsePlan?.responseRules
        ),
        constraints: this.toArray(
          summary.responseConstraints || responsePlan?.responseConstraints
        )
      },
      diagnostics,
      quality: {
        inputGovernanceReady:
          summary.expressionInputGovernance?.ready === true,
        usableSemanticFrameAvailable: Boolean(usableSemanticFrame),
        responsePlanAvailable: Boolean(responsePlan),
        authoritativeDraftAvailable: Boolean(authoritativeDraft),
        finalResponseAvailable: Boolean(finalResponse),
        finalResponseUsable: Boolean(finalResponse),
        finalCompositionAvailable:
          summary.finalCompositionAvailable === true,
        finalCompositionFallbackUsed:
          summary.finalCompositionFallbackUsed === true,
        semanticValidationAdvisory: true,
        additionalGenerationPassUsed: false
      },
      detached: {
        responseRealizationEnabled: false,
        draftGenerationEnabled: false,
        candidatePipelineEnabled: false
      },
      authority: this.getAuthorityBoundaries()
    };
  },

  finishPipeline(summary = {}) {
    const expressionDiagnostics =
      summary.expressionDiagnostics ||
      this.buildExpressionDiagnostics(summary);

    const state = {
      ...summary,
      expressionDiagnostics,
      expressionHealthy: expressionDiagnostics.healthy,
      expressionWarnings: expressionDiagnostics.warnings
    };

    const expressionPacket = this.buildExpressionPacket(state);
    const finalResponse = expressionPacket?.result?.finalResponse || "";

    return {
      ...state,
      expressionPacket,
      responseResult: expressionPacket,
      finalResponse,
      responseText: finalResponse,
      reply: finalResponse,
      expressionPipelineRan: true,
      expressionPipelineReady: expressionPacket.ready === true,
      expressionPipelineSource: this.source,
      expressionPipelineVersion: this.version,
      activeExpressionStage: null
    };
  },

  recordStageFailure({
    summary = {},
    stageName = "unknown",
    source = "stage-error",
    error = "stage_error",
    message = ""
  } = {}) {
    const failure = {
      stage: stageName,
      error,
      message: message || error,
      source,
      timestamp: Date.now()
    };

    return {
      ...summary,
      activeExpressionStage: stageName,
      expressionFailureBoundary:
        summary.expressionFailureBoundary || stageName,
      firstFailedExpressionStage:
        summary.firstFailedExpressionStage || stageName,
      expressionStageErrors: [
        ...this.toArray(summary.expressionStageErrors),
        failure
      ]
    };
  },

  resolveUsableSemanticFrame(summary = {}) {
    const packet = this.readObject(summary.deliberationPacket);

    return (
      this.readObject(summary.validatedSemanticFrame) ||
      this.readObject(summary.semanticFrame) ||
      this.readObject(summary.cognitiveReasoningResult?.semanticFrame) ||
      this.readObject(packet?.semanticValidation?.validatedSemanticFrame) ||
      this.readObject(packet?.semanticValidation?.primaryFrame) ||
      this.readObject(packet?.reasoning?.semanticFrame) ||
      null
    );
  },

  resolveResponsePlan(summary = {}) {
    const packet = this.readObject(summary.deliberationPacket);

    return (
      this.readObject(summary.responsePlan) ||
      this.readObject(summary.responseStrategy) ||
      this.readObject(packet?.responsePlanning?.plan) ||
      null
    );
  },

  resolveAuthoritativeDraft(summary = {}) {
    const packet = this.readObject(summary.deliberationPacket);

    return this.firstText(
      summary.authoritativeDraft,
      summary.selectedDraft,
      summary.draftResponse,
      summary.responseText,
      summary.cognitiveReasoningResult?.authoritativeDraft,
      summary.cognitiveReasoningResult?.draftResponse,
      summary.cognitiveReasoningResult?.responseText,
      summary.cognitiveReasoningResult?.finalResponse,
      summary.cognitiveReasoningResult?.answer,
      summary.cognitiveReasoningResult?.reply,
      packet?.authoritativeDraft,
      packet?.selectedDraft,
      packet?.draftResponse,
      packet?.responseText,
      packet?.reasoning?.authoritativeDraft,
      packet?.reasoning?.draftResponse,
      packet?.reasoning?.responseText,
      packet?.reasoning?.result?.authoritativeDraft,
      packet?.reasoning?.result?.draftResponse,
      packet?.reasoning?.result?.responseText,
      packet?.responsePlanning?.plan?.draftResponse
    );
  },

  resolveAuthoritativeDraftSource(summary = {}) {
    const packet = this.readObject(summary.deliberationPacket);
    const candidates = [
      ["authoritativeDraft", summary.authoritativeDraft],
      ["selectedDraft", summary.selectedDraft],
      ["draftResponse", summary.draftResponse],
      [
        "cognitiveReasoningResult.authoritativeDraft",
        summary.cognitiveReasoningResult?.authoritativeDraft
      ],
      [
        "cognitiveReasoningResult.draftResponse",
        summary.cognitiveReasoningResult?.draftResponse
      ],
      ["deliberationPacket.authoritativeDraft", packet?.authoritativeDraft],
      ["deliberationPacket.selectedDraft", packet?.selectedDraft],
      [
        "deliberationPacket.reasoning.authoritativeDraft",
        packet?.reasoning?.authoritativeDraft
      ],
      [
        "deliberationPacket.reasoning.draftResponse",
        packet?.reasoning?.draftResponse
      ]
    ];

    for (const [source, candidate] of candidates) {
      if (this.extractText(candidate)) return source;
    }

    return null;
  },

  resolveFinalResponse(summary = {}) {
    return this.firstText(
      summary.finalResponse,
      summary.reply,
      summary.responseText,
      summary.finalCompositionHandoff?.finalResponse,
      summary.finalCompositionHandoff?.responseText,
      summary.finalCompositionStagePacket?.finalResponse,
      summary.finalCompositionStagePacket?.responseText,
      summary.finalCompositionStagePacket?.result?.finalResponse,
      summary.finalCompositionStagePacket?.result?.responseText,
      summary.authoritativeDraft
    );
  },

  resolveFinalResponseSource(summary = {}) {
    const candidates = [
      ["finalResponse", summary.finalResponse],
      [
        "finalCompositionHandoff.finalResponse",
        summary.finalCompositionHandoff?.finalResponse
      ],
      [
        "finalCompositionHandoff.responseText",
        summary.finalCompositionHandoff?.responseText
      ],
      [
        "finalCompositionStagePacket.finalResponse",
        summary.finalCompositionStagePacket?.finalResponse
      ],
      [
        "finalCompositionStagePacket.responseText",
        summary.finalCompositionStagePacket?.responseText
      ]
    ];

    for (const [source, candidate] of candidates) {
      if (this.extractText(candidate)) return source;
    }

    return null;
  },

  buildFallbackDeliberationPacket(summary = {}) {
    return {
      schema: "ari_deliberation_packet_fallback",
      schemaVersion: this.schemaVersion,
      ready: false,
      source: "ari-expression-pipeline-fallback",
      version: this.version,
      semanticValidation: {
        accepted: summary.semanticValidationAccepted === true,
        validatedSemanticFrame:
          summary.validatedSemanticFrame || summary.semanticFrame || null,
        responseRequirements:
          summary.validatedResponseRequirements ||
          summary.responseRequirements ||
          null
      },
      responsePlanning: {
        plan: summary.responsePlan || summary.responseStrategy || null
      },
      reasoning: {
        result: summary.cognitiveReasoningResult || null,
        semanticFrame:
          summary.semanticFrame ||
          summary.cognitiveReasoningResult?.semanticFrame ||
          null,
        authoritativeDraft:
          summary.authoritativeDraft || summary.draftResponse || null
      },
      authoritativeDraft:
        summary.authoritativeDraft || summary.draftResponse || null
    };
  },

  getAuthorityBoundaries() {
    return {
      canCoordinateCharacterStage: true,
      canCoordinateLanguageGuidanceStage: true,
      canCoordinateFinalCompositionStage: true,
      canBuildExpressionPacket: true,
      canExposeFinalResponse: true,
      canResolveAuthoritativeDraft: true,
      canUseAuthoritativeDraftFallback: true,
      canGenerateResponseLanguage: false,
      canCallOpenAIForResponseGeneration: false,
      canRunResponseRealization: false,
      canRunDraftGeneration: false,
      canRunCandidateArbitration: false,
      canInterpretEvidence: false,
      canReinterpretMeaning: false,
      canRepairSemanticFrame: false,
      canChangeSemanticFrame: false,
      canChangeResponsePlan: false,
      canChangeAuthoritativeDraft: false,
      canChangeSafetyDisposition: false,
      canExecuteActions: false,
      canRetrieveMemory: false,
      canPersistMemory: false,
      canPersistState: false,
      role: "authoritative_draft_expression_orchestration"
    };
  },

  validate() {
    const errors = [];
    const warnings = [];
    const optional = {
      characterStage: Boolean(
        window.AriCharacterStage || window.Ari?.characterStage
      ),
      languageGuidanceStage: Boolean(
        window.AriLanguageGuidanceStage ||
        window.Ari?.languageGuidanceStage
      ),
      finalCompositionStage: Boolean(
        window.AriFinalCompositionStage ||
        window.Ari?.finalCompositionStage
      )
    };

    Object.entries(optional).forEach(([name, loaded]) => {
      if (!loaded) warnings.push(`${name}_not_loaded_optional`);
    });

    const authority = this.getAuthorityBoundaries();
    const forbiddenTrue = [
      "canGenerateResponseLanguage",
      "canCallOpenAIForResponseGeneration",
      "canRunResponseRealization",
      "canRunDraftGeneration",
      "canRunCandidateArbitration",
      "canInterpretEvidence",
      "canReinterpretMeaning",
      "canRepairSemanticFrame",
      "canChangeSemanticFrame",
      "canChangeResponsePlan",
      "canChangeAuthoritativeDraft",
      "canChangeSafetyDisposition",
      "canExecuteActions",
      "canRetrieveMemory",
      "canPersistMemory",
      "canPersistState"
    ];

    forbiddenTrue
      .filter(key => authority[key] === true)
      .forEach(key => errors.push(`${key}_must_be_false`));

    return {
      valid: errors.length === 0,
      ready: errors.length === 0,
      source: "ari-expression-pipeline-validation",
      version: this.version,
      errors,
      warnings,
      optional,
      checks: {
        usableSemanticFrameRequired: true,
        responsePlanRequired: true,
        authoritativeDraftRequired: true,
        semanticValidationIsAdvisory: true,
        styleStagesAreOptional: true,
        finalCompositionIsOptional: true,
        authoritativeDraftFallbackEnabled: true,
        responseRealizationDetached: true,
        additionalGenerationPassDisabled: true,
        legacyCandidatePipelineDisabled: true
      }
    };
  },

  readObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  },

  firstText(...values) {
    for (const value of values) {
      const text = this.extractText(value);
      if (text) return text;
    }
    return "";
  },

  extractText(value = null) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return this.cleanText(value);
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value).trim();
    }
    if (typeof value === "object") {
      return this.extractText(
        value.text ||
        value.responseText ||
        value.finalResponse ||
        value.languageBody ||
        value.response ||
        value.reply ||
        value.content ||
        value.authoritativeDraft ||
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
        item => item !== null && item !== undefined && item !== ""
      );
    }
    if (value === null || value === undefined || value === "") return [];
    return [value];
  },

  dedupeErrors(value = []) {
    const output = [];
    const seen = new Set();

    for (const item of this.toArray(value)) {
      const normalized =
        typeof item === "string"
          ? { stage: "expression", error: item }
          : item;

      if (!normalized || typeof normalized !== "object") continue;

      const key = [
        normalized.stage || "unknown",
        normalized.error || "unknown",
        normalized.message || ""
      ].join("::");

      if (seen.has(key)) continue;
      seen.add(key);
      output.push(normalized);
    }

    return output;
  },

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
};

window.Ari.expressionPipeline =
  window.AriExpressionPipeline;

const ariExpressionPipelineValidation =
  window.AriExpressionPipeline?.validate?.();

console.log(
  "ARI EXPRESSION PIPELINE LOADED:",
  window.AriExpressionPipeline?.version,
  ariExpressionPipelineValidation?.ready === true
    ? "READY"
    : ariExpressionPipelineValidation?.valid === true
      ? "READY_WITH_OPTIONAL_WARNINGS"
      : "INVALID",
  ariExpressionPipelineValidation
);
