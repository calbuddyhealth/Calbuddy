// ari/context/ari-context-packet.js
// Ari Context Packet
//
// Purpose:
// Define the canonical Context Packet produced by the
// Context Selection Engine.
//
// V1.0.0 — Canonical Context Contract
//
// Architectural Flow:
//
// Turn Packet
//        ↓
// Turn Classification Packet
//        ↓
// Reference Packet
//        ↓
// Context Selection Engine
//        ↓
// Context Packet
//        ↓
// Executive Routing
//
// Responsibilities:
// - Define the canonical Context Packet schema.
// - Normalize selected context.
// - Validate packet completeness.
// - Preserve packet immutability.
// - Preserve context authority.
//
// Non-responsibilities:
// - Does not retrieve memory.
// - Does not select context.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriContextPacket = {

  version: "1.0.0",

  schema: "ari_context_packet",

  schemaVersion: "1.0.0",

  create(input = {}) {

    const packet = {

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      selectedContext:
        Object.freeze(
          this.normalizeObject(
            input.selectedContext
          )
        ),

      conversationHistory:
        Object.freeze(
          this.normalizeArray(
            input.conversationHistory
          )
        ),

      activeEntities:
        Object.freeze(
          this.normalizeArray(
            input.activeEntities
          )
        ),

      retrievedMemory:
        Object.freeze(
          this.normalizeArray(
            input.retrievedMemory
          )
        ),

      confidence:
        this.normalizeConfidence(
          input.confidence
        ),

      evidence:
        Object.freeze(
          this.normalizeArray(
            input.evidence
          )
        ),

      diagnostics:
        Object.freeze(
          this.normalizeArray(
            input.diagnostics
          )
        ),

      authority:
        Object.freeze({

          owner:
            "ari-context-selection-engine",

          canonical: true,

          createdBy:
            "AriContextPacket"

        })

    };

    const validation =
      this.validate(packet);

    packet.validation =
      Object.freeze(validation);

    return Object.freeze(packet);

  },

  validate(packet = {}) {

    const errors = [];
    const warnings = [];

    if (!packet.schema) {

      errors.push(
        "missing_schema"
      );

    }

    if (!packet.schemaVersion) {

      errors.push(
        "missing_schema_version"
      );

    }

    if (
      typeof packet.selectedContext !==
      "object"
    ) {

      errors.push(
        "invalid_selected_context"
      );

    }

    if (
      !Array.isArray(
        packet.conversationHistory
      )
    ) {

      errors.push(
        "invalid_conversation_history"
      );

    }

    if (
      !Array.isArray(
        packet.activeEntities
      )
    ) {

      errors.push(
        "invalid_active_entities"
      );

    }

    if (
      !Array.isArray(
        packet.retrievedMemory
      )
    ) {

      errors.push(
        "invalid_retrieved_memory"
      );

    }

    if (
      typeof packet.confidence !==
      "number"
    ) {

      errors.push(
        "invalid_confidence"
      );

    }

    return {

      valid:
        errors.length === 0,

      errors:
        Object.freeze(errors),

      warnings:
        Object.freeze(warnings)

    };

  },

  normalizeConfidence(value) {

    const confidence =
      Number(value);

    if (
      Number.isNaN(confidence)
    ) {

      return 0;

    }

    return Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  },

  normalizeArray(value) {

    if (
      !Array.isArray(value)
    ) {

      return [];

    }

    return [...value];

  },

  normalizeObject(value) {

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {

      return {};

    }

    return {
      ...value
    };

  }

};

window.Ari.contextPacket =
  window.AriContextPacket;