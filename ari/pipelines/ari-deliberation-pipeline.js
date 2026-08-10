// ARI REBIRTH — Experimental OpenAI-Authority Deliberation Pipeline
window.Ari = window.Ari || {};
window.AriDeliberationPipeline = {
  version: "3.0.0-experimental",
  source: "ari-deliberation-pipeline-openai-authority",
  architecture: "context-then-one-openai-cognitive-pass",

  async run(summary = {}, runtime = {}) {
    const mark = runtime.mark || (() => {});
    let state = { ...summary, activePipelineLayer: "deliberation", deliberationStageErrors: [] };

    state = await this.runOptionalStage(window.AriContinuityStage || window.Ari?.continuityStage, state, runtime, "continuity", mark);
    state = await this.runOptionalStage(window.AriSafetyDeliberationStage || window.Ari?.safetyDeliberationStage, state, runtime, "safety", mark);
    state = await this.runOptionalStage(window.AriMemoryStage || window.Ari?.memoryStage, state, runtime, "memory", mark);

    const reasoningStage = window.AriReasoningStage || window.AriOpenAIReasoningStage || window.Ari?.reasoningStage;
    if (!reasoningStage || typeof reasoningStage.run !== "function") throw this.error("reasoning_stage_unavailable");

    mark("before reasoningStage");
    state = await reasoningStage.run(state, runtime);
    mark("after reasoningStage");

    const draft = this.text(state.authoritativeDraft || state.draftResponse || state.cognitiveReasoningResult?.authoritativeDraft);
    if (!draft) throw this.error("authoritative_openai_draft_missing");

    // No semantic-validator veto and no second conversational planner.
    // OpenAI's interpretation/strategy/draft remain authoritative.
    state = {
      ...state,
      authoritativeDraft: draft,
      draftResponse: draft,
      modelDraftResponse: draft,
      validatedSemanticFrame: state.semanticFrame || state.aiSemanticFrame || state.cognitiveReasoningResult?.semanticFrame || null,
      semanticValidationStageRan: false,
      semanticValidationAdvisory: true,
      semanticValidationBypassed: true,
      semanticValidationExecutionAllowed: true,
      responsePlanningStageRan: false,
      responsePlanningStageSource: "openai-response-strategy-authority",
      responsePlan: state.responseStrategy || state.cognitiveReasoningResult?.responseStrategy || { source: "openai", useAuthoritativeDraft: true },
      deliberationRan: true,
      deliberationReady: true,
      deliberationHealthy: true,
      deliberationStage: "complete",
      activeDeliberationStage: "complete",
      deliberationSource: this.source,
      deliberationVersion: this.version,
      deliberationDiagnostics: {
        architecture: this.architecture,
        ready: true,
        authoritativeDraftAvailable: true,
        semanticValidatorOnCriticalPath: false,
        externalResponsePlannerOnCriticalPath: false,
        openAISemanticAuthority: true,
        openAIResponseStrategyAuthority: true
      }
    };
    return state;
  },

  async runOptionalStage(stage, state, runtime, name, mark) {
    if (!stage || typeof stage.run !== "function") return { ...state, [`${name}StageSkipped`]: true };
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
          ...(Array.isArray(state.deliberationStageErrors) ? state.deliberationStageErrors : []),
          { stage: name, error: error?.message || String(error), advisory: true }
        ]
      };
    }
  },

  text(value) { return typeof value === "string" ? value.trim() : ""; },
  error(code) { const error = new Error(code); error.name = "AriDeliberationPipelineError"; error.code = code; error.source = this.source; return error; }
};
window.Ari.deliberationPipeline = window.AriDeliberationPipeline;