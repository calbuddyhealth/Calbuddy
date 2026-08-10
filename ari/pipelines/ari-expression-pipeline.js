// ARI REBIRTH — Experimental Response-First Expression Pipeline
window.Ari = window.Ari || {};
window.AriExpressionPipeline = {
  version: "6.0.0-experimental",
  source: "ari-expression-pipeline-openai-authority",
  architecture: "authoritative-openai-draft-first",
  async run(summary = {}, runtime = {}) {
    const mark = runtime.mark || (() => {});
    const draft = this.firstText([summary.authoritativeDraft, summary.modelDraftResponse, summary.draftResponse, summary.cognitiveReasoningResult?.authoritativeDraft]);
    if (!draft) throw this.error("authoritative_draft_missing");
    let state = {
      ...summary,
      activePipelineLayer: "expression",
      authoritativeDraft: draft,
      selectedDraft: draft,
      compositionInputText: draft,
      draftResponse: draft,
      responseText: draft,
      finalResponse: draft,
      reply: draft,
      finalResponseUsable: true,
      finalResponseSource: summary.authoritativeDraftSource || "openai-authoritative-draft",
      expressionWarnings: Array.isArray(summary.expressionWarnings) ? summary.expressionWarnings : []
    };
    const composer = window.AriFinalCompositionStage || window.Ari?.finalCompositionStage;
    if (composer && typeof composer.run === "function") {
      try {
        mark("before finalCompositionStage");
        const result = await composer.run(state, runtime);
        mark("after finalCompositionStage");
        if (result && typeof result === "object") {
          const composed = this.firstText([result.finalResponse, result.composedResponse, result.responseText, result.reply]);
          state = { ...state, ...result, authoritativeDraft: draft, selectedDraft: draft, draftResponse: draft, finalResponse: composed || draft, responseText: composed || draft, reply: composed || draft, finalResponseUsable: true, finalCompositionFallbackUsed: !composed };
        }
      } catch (error) {
        state.expressionWarnings.push({ stage: "finalComposition", warning: "optional_stage_failed", message: error?.message || String(error) });
      }
    }
    const finalResponse = this.firstText([state.finalResponse, state.responseText, draft]) || draft;
    state = { ...state, finalResponse, responseText: finalResponse, reply: finalResponse, expressionHealthy: true, expressionReady: true, expressionComplete: true, expressionPipelineRan: true, expressionPipelineReady: true, expressionPipelineSource: this.source, expressionPipelineVersion: this.version };
    state.expressionPacket = {
      schema: "ari_expression_packet",
      schemaVersion: "6.0.0-experimental",
      ready: true,
      complete: true,
      healthy: true,
      architecture: this.architecture,
      source: this.source,
      result: { finalResponse, responseText: finalResponse, reply: finalResponse, usable: true, source: state.finalResponseSource || "openai-authoritative-draft", authoritativeDraft: draft },
      diagnostics: { authoritativeDraftAvailable: true, finalResponseAvailable: true, finalCompositionOptional: true, semanticValidatorRequired: false, responsePlanRequired: false, additionalGenerationPassUsed: false }
    };
    state.activePipelineLayer = "expression_complete";
    return state;
  },
  firstText(values = []) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; },
  error(code) { const error = new Error(code); error.name = "AriExpressionPipelineError"; error.code = code; error.source = this.source; return error; }
};
window.Ari.expressionPipeline = window.AriExpressionPipeline;