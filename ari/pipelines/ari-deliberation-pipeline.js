// ARI REBIRTH — Experimental OpenAI-Authority Deliberation Pipeline
window.Ari = window.Ari || {};
window.AriDeliberationPipeline = {
  version: "3.1.0-experimental",
  source: "ari-deliberation-pipeline-openai-authority",
  architecture: "context-then-one-openai-cognitive-pass",

  async run(summary = {}, runtime = {}) {
    const mark = runtime.mark || (() => {});
    let state = {
      ...summary,
      activePipelineLayer: "deliberation",
      activeDeliberationStage: "context",
      deliberationStageErrors: Array.isArray(summary.deliberationStageErrors)
        ? summary.deliberationStageErrors
        : [],
      deliberationPipelineRan: false,
      deliberationPipelineReady: false,
      deliberationPipelineError: null,
      deliberationPipelineSource: this.source,
      deliberationPipelineVersion: this.version
    };

    state = await this.runOptionalStage(
      window.AriContinuityStage || window.Ari?.continuityStage,
      state,
      runtime,
      "continuity",
      mark
    );

    state = await this.runOptionalStage(
      window.AriSafetyDeliberationStage || window.Ari?.safetyDeliberationStage,
      state,
      runtime,
      "safety",
      mark
    );

    state = await this.runOptionalStage(
      window.AriMemoryStage || window.Ari?.memoryStage,
      state,
      runtime,
      "memory",
      mark
    );

    const reasoningStage =
      window.AriReasoningStage ||
      window.AriOpenAIReasoningStage ||
      window.Ari?.reasoningStage;

    if (!reasoningStage || typeof reasoningStage.run !== "function") {
      throw this.error("reasoning_stage_unavailable");
    }

    mark("before reasoningStage");
    state = await reasoningStage.run(state, runtime);
    mark("after reasoningStage");

    const cognitiveResult =
      state.cognitiveReasoningResult ||
      state.reasoningResult ||
      {};

    const draft = this.text(
      state.authoritativeDraft ||
      state.draftResponse ||
      cognitiveResult.authoritativeDraft ||
      cognitiveResult.draftResponse
    );

    if (!draft) {
      throw this.error("authoritative_openai_draft_missing");
    }

    const semanticFrame =
      state.semanticFrame ||
      state.aiSemanticFrame ||
      cognitiveResult.semanticFrame ||
      cognitiveResult.interpretation ||
      { primaryIntent: "openai_interpreted_request" };

    const responsePlan =
      state.responseStrategy ||
      cognitiveResult.responseStrategy ||
      { source: "openai", mode: "direct", useAuthoritativeDraft: true };

    const deliberationPacket = {
      schema: "ari_deliberation_packet",
      schemaVersion: "3.1.0-experimental",
      source: this.source,
      version: this.version,
      ready: true,
      complete: true,
      healthy: true,
      architecture: this.architecture,
      semanticFrame,
      responsePlan,
      authoritativeDraft: draft,
      cognitiveReasoningResult: cognitiveResult,
      authority: {
        semanticSource: "openai",
        reasoningSource: "openai",
        responseStrategySource: "openai",
        draftSource: "openai",
        semanticValidatorOnCriticalPath: false,
        externalResponsePlannerOnCriticalPath: false
      },
      diagnostics: {
        authoritativeDraftAvailable: true,
        cognitiveResultAvailable: Boolean(cognitiveResult && typeof cognitiveResult === "object"),
        optionalContextStageErrors: Array.isArray(state.deliberationStageErrors)
          ? state.deliberationStageErrors
          : []
      }
    };

    // IMPORTANT: AriRebirthPipeline's five-layer executor determines whether a
    // layer actually ran from `deliberationPipelineRan`, not `deliberationRan`.
    // The previous experimental implementation successfully obtained an OpenAI
    // answer but only set the generic aliases, causing the master runtime to
    // discard the valid result as `required_deliberation_pipeline_did_not_run`.
    return {
      ...state,

      cognitiveReasoningResult: cognitiveResult,
      cognitiveReasoningReady: true,
      cognitiveReasoningSource:
        cognitiveResult.source ||
        "openai",
      cognitiveReasoningVersion:
        cognitiveResult.version ||
        null,

      authoritativeDraft: draft,
      authoritativeDraftSource:
        state.authoritativeDraftSource ||
        "openai-cognitive-orchestrator",
      draftResponse: draft,
      modelDraftResponse: draft,

      semanticFrame,
      aiSemanticFrame: semanticFrame,
      validatedSemanticFrame: semanticFrame,

      // Semantic validation remains advisory only in the experimental path.
      semanticValidationStageRan: false,
      semanticValidationStageReady: false,
      semanticValidationAdvisory: true,
      semanticValidationBypassed: true,
      semanticValidationExecutionAllowed: true,

      // OpenAI owns response strategy. Preserve a compatibility responsePlan so
      // old downstream readers do not mistake the absence of a local planner
      // for an absent response strategy.
      responsePlanningStageRan: false,
      responsePlanningStageReady: false,
      responsePlanningStageSource: "openai-response-strategy-authority",
      responsePlan,
      responsePlanReady: true,

      deliberationRan: true,
      deliberationReady: true,
      deliberationHealthy: true,
      deliberationStage: "complete",
      activeDeliberationStage: "complete",
      deliberationSource: this.source,
      deliberationVersion: this.version,

      // Canonical five-layer contract consumed by ari-rebirth-pipeline.js.
      deliberationPipelineRan: true,
      deliberationPipelineReady: true,
      deliberationPipelineError: null,
      deliberationPipelineSource: this.source,
      deliberationPipelineVersion: this.version,
      deliberationPacket,

      deliberationDiagnostics: {
        architecture: this.architecture,
        ready: true,
        complete: true,
        authoritativeDraftAvailable: true,
        cognitiveResultAvailable: true,
        semanticValidatorOnCriticalPath: false,
        externalResponsePlannerOnCriticalPath: false,
        openAISemanticAuthority: true,
        openAIResponseStrategyAuthority: true,
        fiveLayerContractReported: true
      }
    };
  },

  async runOptionalStage(stage, state, runtime, name, mark) {
    if (!stage || typeof stage.run !== "function") {
      return {
        ...state,
        [`${name}StageSkipped`]: true
      };
    }

    try {
      mark(`before ${name}Stage`);
      const next = await stage.run(state, runtime);
      mark(`after ${name}Stage`);
      return next && typeof next === "object" ? next : state;
    } catch (error) {
      // Context enrichment must not kill an otherwise answerable turn.
      return {
        ...state,
        [`${name}StageError`]: error?.message || String(error),
        deliberationStageErrors: [
          ...(Array.isArray(state.deliberationStageErrors)
            ? state.deliberationStageErrors
            : []),
          {
            stage: name,
            error: error?.message || String(error),
            advisory: true
          }
        ]
      };
    }
  },

  text(value) {
    return typeof value === "string" ? value.trim() : "";
  },

  error(code) {
    const error = new Error(code);
    error.name = "AriDeliberationPipelineError";
    error.code = code;
    error.source = this.source;
    return error;
  }
};
window.Ari.deliberationPipeline = window.AriDeliberationPipeline;