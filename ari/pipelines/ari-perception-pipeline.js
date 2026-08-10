// =====================================================
// ARI REBIRTH
// Experimental OpenAI-Authority Perception Pipeline
// Version 3.0.0-experimental
// Purpose: preserve the turn and collect useful deterministic evidence.
// Local perception does NOT interpret meaning and optional helpers cannot veto.
// =====================================================
window.Ari = window.Ari || {};
window.AriPerceptionPipeline = {
  version: "3.0.0-experimental",
  schemaVersion: "3.0.0-experimental",
  source: "ari-perception-pipeline-openai-authority",
  async run(summary = {}, runtime = {}) {
    const mark = runtime.mark || (() => {});
    const runEngine = runtime.runEngine || (async (_engine, _methods, fallback) => fallback);
    const originalText = this.firstText([summary.currentTurn?.originalText, summary.turn?.originalText, summary.originalUserMessage, summary.userMessage, summary.message, summary.input]);
    if (!originalText) throw this.error("missing_user_message");
    let state = {
      ...summary,
      activePipelineLayer: "perception",
      originalUserMessage: originalText,
      effectiveUserMessage: originalText,
      currentTurn: { ...(this.object(summary.currentTurn)), originalText, effectiveText: originalText, normalizedText: this.normalize(originalText), wasResolved: false, resolutionSource: null },
      perceptionStageErrors: [],
      perceptionWarnings: []
    };

    // Safety is useful deterministic evidence, but inability to classify is not a perception failure.
    mark("before safetyContextGate");
    state.safetyContextGate = await runEngine(window.AriSafetyContextGate || window.Ari?.safetyContextGate, ["evaluate"], { safetyContextGateRan: false, riskLevel: "none", risks: [], shouldStopNormalResponse: false }, state);
    state.safetyContextEvidence = state.safetyContextGate;
    mark("after safetyContextGate");

    // Continuity can improve the prompt. OpenAI remains capable of interpreting the raw turn if this helper cannot resolve it.
    mark("before continuityResolution");
    const continuity = await runEngine(window.AriEllipticalFollowUpResolver || window.Ari?.ellipticalFollowUpResolver, ["resolve", "analyze"], { continuityResolverRan: false, status: "not_evaluated", originalText, resolvedText: null, currentTurnWasResolved: false, requiresClarification: false, evidence: [], warnings: ["continuity_helper_unavailable"] }, state);
    const resolvedText = this.firstText([continuity?.resolvedUserQuestion, continuity?.resolvedCurrentTurnText, continuity?.resolvedText, continuity?.resolvedCurrentTurn?.resolvedText]);
    const confirmed = Boolean(resolvedText && (continuity?.currentTurnWasResolved === true || continuity?.referenceResolved === true || continuity?.resolvedCurrentTurn?.resolved === true));
    const effectiveText = confirmed ? resolvedText : originalText;
    state = {
      ...state,
      continuityResolution: continuity,
      authoritativeContinuity: continuity,
      continuity,
      effectiveUserMessage: effectiveText,
      resolvedUserQuestion: confirmed ? effectiveText : null,
      currentTurnWasResolved: confirmed,
      currentTurn: { ...state.currentTurn, effectiveText, normalizedText: this.normalize(effectiveText), wasResolved: confirmed, resolutionSource: confirmed ? (continuity?.source || continuity?.continuityResolverSource || "continuity_helper") : null }
    };
    mark("after continuityResolution");

    // Reference resolution is advisory. A missing canonical semantic structure must never block OpenAI.
    mark("before referenceResolution");
    const referenceResolution = await runEngine(window.AriEntityReferenceResolver || window.Ari?.entityReferenceResolver, ["resolve"], { referenceResolverRan: false, referenceResolverReady: false, referencePacket: null, referenceDecisions: [], errors: [], warnings: ["reference_helper_unavailable"] }, this.effectiveState(state));
    state.referenceResolution = referenceResolution;
    state.referencePacket = referenceResolution?.referencePacket || referenceResolution?.packet || null;
    state.referenceDecisions = referenceResolution?.referenceDecisions || referenceResolution?.resolutions || [];
    state.referenceResolverRan = referenceResolution?.referenceResolverRan === true || referenceResolution?.resolverRan === true;
    state.referenceResolverReady = referenceResolution?.referenceResolverReady === true || Boolean(state.referencePacket);
    mark("after referenceResolution");

    // Observer evidence is optional enrichment.
    mark("before observerEvidence");
    const observer = await runEngine(window.AriObserverNetwork || window.Ari?.observerNetwork, ["observe"], { observerEvidenceRan: false, observations: [], observationLedger: [], canonicalObservationLedger: [], warnings: ["observer_network_unavailable"] }, this.effectiveState(state));
    state.observerEvidence = observer;
    state.observer = observer;
    state.observations = this.array(observer?.canonicalObservationLedger || observer?.observationLedger || observer?.observations);
    state.observationLedger = state.observations;
    state.canonicalObservationLedger = state.observations;
    state.observationCount = state.observations.length;
    mark("after observerEvidence");

    // Evidence builder is preferred, but raw turn evidence is a valid fallback.
    mark("before evidenceBuilder");
    const builder = window.AriEvidenceBuilder || window.Ari?.evidenceBuilder;
    const built = await runEngine(builder, ["build", "create"], { evidenceBuilderRan: false, evidenceBuilderReady: false, evidencePacket: null, warnings: ["evidence_builder_unavailable"] }, this.effectiveState(state));
    const fallbackPacket = {
      schema: "ari_evidence_packet",
      schemaVersion: "3.0.0-experimental",
      source: "perception-raw-turn-fallback",
      ready: true,
      currentTurn: state.currentTurn,
      originalText,
      effectiveText,
      observations: state.observations,
      continuityEvidence: continuity || null,
      safetyEvidence: state.safetyContextGate || null,
      referenceEvidence: state.referencePacket || null,
      quality: { usable: true, rawTurnPreserved: true, degraded: !built?.evidencePacket }
    };
    const evidencePacket = built?.evidencePacket || fallbackPacket;
    state = {
      ...state,
      evidenceBuilderResult: built,
      evidenceBuilderRan: built?.evidenceBuilderRan === true || Boolean(built?.evidencePacket),
      evidenceBuilderReady: built?.evidenceBuilderReady === true || Boolean(built?.evidencePacket),
      evidencePacket,
      evidenceQuality: evidencePacket?.quality || null
    };
    mark("after evidenceBuilder");

    const warnings = [];
    if (!state.referenceResolverReady) warnings.push("reference_resolution_advisory_unavailable");
    if (observer?.observerEvidenceRan !== true) warnings.push("observer_evidence_advisory_unavailable");
    if (!built?.evidencePacket) warnings.push("using_raw_turn_evidence_fallback");
    if (continuity?.continuityResolverRan !== true) warnings.push("continuity_resolution_advisory_unavailable");

    state.perceptionDiagnostics = {
      perceptionDiagnosticsRan: true,
      perceptionDiagnosticsVersion: this.version,
      healthy: true,
      complete: true,
      ready: true,
      errors: [],
      warnings,
      authority: { role: "deterministic_evidence_provider", canInterpretMeaning: false, canChooseIntent: false, canPlanResponse: false, canAnswerUser: false, semanticAuthority: "openai" },
      stages: { safety: state.safetyContextGate?.safetyContextGateRan === true, continuity: continuity?.continuityResolverRan === true, referenceResolution: state.referenceResolverRan, observer: observer?.observerEvidenceRan === true, evidenceBuilder: state.evidenceBuilderRan, rawTurnFallbackAvailable: true }
    };

    state.perceptionPacket = {
      schema: "ari_perception_packet",
      schemaVersion: this.schemaVersion,
      source: this.source,
      ready: true,
      complete: true,
      healthy: true,
      currentTurn: state.currentTurn,
      originalUserMessage: originalText,
      effectiveUserMessage: effectiveText,
      continuityResolution: continuity || null,
      referencePacket: state.referencePacket,
      observations: state.observations,
      evidencePacket,
      diagnostics: state.perceptionDiagnostics,
      authority: { semanticInterpretation: "openai", localRole: "evidence_only" }
    };
    return {
      ...state,
      perceptionHealthy: true,
      perceptionPipelineRan: true,
      perceptionPipelineReady: true,
      perceptionPipelineComplete: true,
      perceptionPipelineSource: this.source,
      perceptionPipelineVersion: this.version,
      perceptionWarnings: warnings,
      perceptionStageErrors: [],
      activePipelineLayer: "perception_complete"
    };
  },
  effectiveState(state = {}) {
    const text = this.firstText([state.currentTurn?.effectiveText, state.effectiveUserMessage, state.originalUserMessage]);
    return { ...state, userMessage: text, message: text, input: text, normalizedMessage: this.normalize(text) };
  },
  normalize(value) { return String(value || "").replace(/\s+/g, " ").trim().toLowerCase(); },
  firstText(values = []) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; },
  object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; },
  array(value) { return Array.isArray(value) ? value.filter(Boolean) : []; },
  error(code) { const error = new Error(code); error.name = "AriPerceptionPipelineError"; error.code = code; error.source = this.source; return error; }
};
window.Ari.perceptionPipeline = window.AriPerceptionPipeline;