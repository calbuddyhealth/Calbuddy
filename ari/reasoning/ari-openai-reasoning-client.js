// ARI REBIRTH — Lean OpenAI Reasoning Client
(() => {
  "use strict";
  window.Ari = window.Ari || {};
  const Client = {
    version: "3.0.0-experimental",
    source: "ari-openai-reasoning-client",
    endpoint: "/api/knowledge",
    async invoke(payload = {}) { return this.reason(payload); },
    async reason(payload = {}) {
      const packet = this.object(payload.cognitivePacket);
      const requestText = this.firstText([payload.requestText, packet.requestText, packet.request?.effective, packet.request?.resolved, packet.request?.original, packet.currentTurn?.effectiveText, packet.currentTurn?.originalText]);
      if (!requestText) throw this.error("openai_reasoning_request_text_missing");
      const body = {
        action: payload.action || "cognitive_orchestration",
        task: payload.task || "reason_and_compose",
        requestText,
        cognitivePacket: packet,
        responseSchema: payload.responseSchema || packet.outputContract || null,
        operationContract: payload.operationContract || packet.operationContract || null,
        instructions: Array.isArray(payload.instructions) ? payload.instructions : (Array.isArray(packet.instructions) ? packet.instructions : []),
        preferenceContext: packet.preferenceContext || null,
        restrictions: packet.restrictions || null,
        applicationContext: packet.applicationContext || null,
        developerContext: packet.developerContext || null
      };
      let response;
      try {
        response = await fetch(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } catch (cause) {
        const error = this.error("openai_reasoning_network_request_failed", cause?.message); error.cause = cause; throw error;
      }
      const raw = await response.text();
      let data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
      if (!response.ok || data.success === false) {
        const error = this.error(data.failureType || "openai_reasoning_server_failure", data.error || data.message || `OpenAI reasoning failed (${response.status}).`);
        error.status = response.status; error.serverResponse = data; throw error;
      }
      const result = this.object(data.cognitiveReasoningResult || data.result || data);
      const draft = this.firstText([result.authoritativeDraft, result.draftResponse, data.authoritativeDraft]);
      if (!draft) throw this.error("openai_authoritative_draft_missing");
      return { ...result, authoritativeDraft: draft, draftResponse: draft, ready: true, usable: true, source: result.source || "openai", model: result.model || data.model || null, timing: data.timing || result.timing || null, authority: result.authority || { semanticSource: "openai", reasoningSource: "openai", responseStrategySource: "openai", draftSource: "openai" } };
    },
    object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; },
    firstText(values = []) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; },
    error(code, message = "") { const error = new Error(message || code); error.name = "AriOpenAIReasoningClientError"; error.code = code; error.failureType = code; error.source = this.source; return error; }
  };
  window.AriOpenAIReasoningClient = Client;
  window.Ari.openAIReasoningClient = Client;
})();