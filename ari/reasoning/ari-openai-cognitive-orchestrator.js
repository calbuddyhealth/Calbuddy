// =====================================================
// ARI REBIRTH
// File: ari/reasoning/ari-openai-cognitive-orchestrator.js
// Version: 1.1.0
// Purpose:
//   OpenAI-first cognitive orchestration for Ari Rebirth.
//
// Design:
//   OpenAI receives only the current user request and owns semantic
//   interpretation, reasoning, response strategy, and the authoritative
//   conversational draft. Private continuity, memory, preferences,
//   application state, and developer evidence remain local.
//
//   Local code remains authoritative only for:
//     - binding safety/application restrictions
//     - authentication/authorization
//     - deterministic data and application state
//     - action execution
//     - persistence
//     - transport and contract validation
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const Orchestrator = {
    version: "1.1.0",
    source: "ari-openai-cognitive-orchestrator",

    async run(input = {}) {
      const packet = this.buildPacket(input);
      const client = window.AriOpenAIReasoningClient || window.Ari?.openAIReasoningClient;

      if (!client || typeof client.reason !== "function") {
        throw this.error("openai_reasoning_client_unavailable");
      }

      const result = await client.reason({
        action: "cognitive_orchestration",
        task: "reason_and_compose",
        cognitivePacket: packet,
        responseSchema: packet.outputContract,
        operationContract: packet.operationContract,
        instructions: packet.instructions
      });

      return this.normalizeResult(result, packet);
    },

    buildPacket(input = {}) {
      const request = this.object(input.request);
      return {
        schema: "ari_openai_cognitive_packet",
        schemaVersion: "1.1.0",
        source: this.source,
        requestText: this.text(input.requestText || request.userMessage || request.message || request.text),
        disclosurePolicy: "current_request_only",
        authority: {
          semanticInterpretation: "openai",
          reasoning: "openai",
          responseStrategy: "openai",
          conversationalDraft: "openai",
          safetyRestrictions: "application_binding",
          authorization: "application_binding",
          actionExecution: "application_binding",
          persistence: "application_binding"
        },
        instructions: [
          "Interpret the user's current request rather than relying on keyword rules.",
          "Reason directly about the user's actual goal and answer it without unnecessary conversational scaffolding.",
          "When an application action is useful, propose it structurally; do not claim it executed.",
          "Produce the best user-facing draft you can in the same cognitive pass.",
          "Do not expose private chain-of-thought. Return concise structured rationale/decision fields only."
        ],
        operationContract: this.object(input.operationContract),
        outputContract: {
          schema: "ari_cognitive_reasoning_result",
          schemaVersion: "3.0.0",
          required: [
            "interpretation",
            "reasoningDecision",
            "responseStrategy",
            "authoritativeDraft"
          ],
          fields: {
            interpretation: "structured semantic interpretation",
            semanticFrame: "optional structured semantic frame",
            reasoningDecision: "concise decision and proposed application actions",
            responseStrategy: "model-selected response strategy",
            authoritativeDraft: "final conversational draft before deterministic delivery checks",
            grounding: "evidence used for factual/personal claims",
            confidence: "calibrated confidence metadata"
          }
        }
      };
    },

    normalizeResult(result = {}, packet = {}) {
      const value = this.object(result);
      const draft = this.text(value.authoritativeDraft || value.draftResponse || value.responseText);

      if (!draft) {
        throw this.error("openai_authoritative_draft_missing");
      }

      return {
        ...value,
        ready: true,
        usable: true,
        source: value.source || "openai-cognitive-orchestration",
        authoritativeDraft: draft,
        draftResponse: draft,
        authority: {
          semanticSource: "openai",
          reasoningSource: "openai",
          responseStrategySource: "openai",
          draftSource: "openai",
          restrictionsRemainBinding: true,
          actionsRequireApplicationExecution: true
        },
        transportMetadata: {
          ...(this.object(value.transportMetadata)),
          orchestratorVersion: this.version,
          packetSchema: packet.schema || null,
          packetSchemaVersion: packet.schemaVersion || null
        }
      };
    },

    object(value) {
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    },

    text(value) {
      return typeof value === "string" ? value.trim() : "";
    },

    error(code) {
      const error = new Error(code);
      error.name = "AriOpenAICognitiveOrchestratorError";
      error.code = code;
      error.source = this.source;
      return error;
    }
  };

  window.AriOpenAICognitiveOrchestrator = Orchestrator;
  window.Ari.openAICognitiveOrchestrator = Orchestrator;
})();
