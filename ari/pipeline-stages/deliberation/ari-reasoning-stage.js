// ARI REBIRTH — OpenAI Authority Reasoning Stage
window.Ari = window.Ari || {};
window.AriReasoningStage = {
  version: "4.0.0-experimental",
  source: "ari-reasoning-stage-openai-authority",
  async run(summary = {}, runtime = {}) {
    const mark = runtime.mark || (() => {});
    mark("before OpenAI cognitive orchestrator");
    const orchestrator = window.AriOpenAICognitiveOrchestrator || window.Ari?.openAICognitiveOrchestrator;
    if (!orchestrator || typeof orchestrator.run !== "function") throw this.error("openai_cognitive_orchestrator_unavailable");
    const requestText = this.firstText([summary.requestText, summary.currentTurn?.effectiveText, summary.currentTurn?.originalText, summary.request?.effective, summary.request?.resolved, summary.request?.original, summary.userMessage, summary.message]);
    if (!requestText) throw this.error("reasoning_request_text_missing");
    const result = await orchestrator.run({
      requestText,
      request: this.object(summary.request),
      evidence: this.firstObject([summary.evidence, summary.evidencePacket, summary.perceptionPacket, summary.perception]),
      continuity: this.firstObject([summary.continuityResolution, summary.continuityStagePacket, summary.conversationState]),
      memory: this.firstObject([summary.memoryContext, summary.memoryHandoff, summary.memoryStagePacket]),
      preferenceContext: this.firstObject([summary.preferenceContext, summary.resolvedPreferenceContext, summary.communicationPreferences]),
      restrictions: {
        safetyDisposition: summary.safetyDisposition || null,
        restrictionDecision: summary.restrictionDecision || null,
        responseConstraints: this.array(summary.responseConstraints),
        requiredBehaviors: this.array(summary.responseRequired),
        forbiddenBehaviors: this.array(summary.responseAvoid),
        authorization: summary.authorization || null
      },
      applicationContext: this.firstObject([summary.applicationContext, summary.appContext, summary.capabilities]),
      developerContext: this.firstObject([summary.developerContext, summary.developerEvidence, summary.developerHandoff]),
      operationContract: this.firstObject([summary.operationContract, summary.actionContract])
    });
    const draft = this.firstText([result.authoritativeDraft, result.draftResponse, result.responseText]);
    if (!draft) throw this.error("openai_authoritative_draft_missing");
    mark("after OpenAI cognitive orchestrator");
    const semanticFrame = result.semanticFrame || result.interpretation || { primaryIntent: "openai_interpreted_request" };
    return {
      ...summary,
      activeDeliberationStage: "reasoning",
      reasoningStageRan: true,
      reasoningStageReady: true,
      reasoningReady: true,
      reasoningEngineRan: true,
      reasoningEngineReady: true,
      reasoningStageSource: this.source,
      reasoningStageVersion: this.version,
      cognitiveReasoningResult: result,
      reasoningResult: result,
      reasoningDecision: result.reasoningDecision || result.decision || null,
      interpretation: result.interpretation || null,
      semanticFrame,
      aiSemanticFrame: semanticFrame,
      responseStrategy: result.responseStrategy || null,
      responseRequirements: result.responseRequirements || null,
      evidenceReferences: Array.isArray(result.evidenceReferences) ? result.evidenceReferences : [],
      modelInvocation: result.modelInvocation || null,
      authoritativeDraft: draft,
      authoritativeDraftSource: "openai-cognitive-orchestrator",
      modelDraftResponse: draft,
      draftResponse: draft,
      reasoningFailure: null,
      reasoningValidation: { ready: true, valid: true, errors: [], warnings: [], authority: "openai" },
      reasoningStagePacket: {
        schema: "ari_reasoning_stage_packet",
        schemaVersion: "4.0.0-experimental",
        source: this.source,
        ready: true,
        interpretation: result.interpretation || null,
        semanticFrame,
        reasoningDecision: result.reasoningDecision || result.decision || null,
        responseStrategy: result.responseStrategy || null,
        authoritativeDraft: draft,
        authority: result.authority || { semanticSource: "openai", reasoningSource: "openai", responseStrategySource: "openai", draftSource: "openai" }
      }
    };
  },
  firstObject(values = []) { for (const value of values) if (value && typeof value === "object" && !Array.isArray(value)) return value; return {}; },
  firstText(values = []) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; },
  object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; },
  array(value) { return Array.isArray(value) ? value.filter(Boolean) : []; },
  error(code) { const error = new Error(code); error.name = "AriReasoningStageError"; error.code = code; error.source = this.source; return error; }
};
window.Ari.reasoningStage = window.AriReasoningStage;
window.AriOpenAIReasoningStage = window.AriReasoningStage;