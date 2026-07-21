// ari/conversation/ari-turn-classification-packet.js
// Ari Turn Classification Packet
//
// Purpose:
// Define the canonical packet produced by the Conversation
// Relationship Engine.
//
// V1.0.0 — Canonical Turn Classification Contract
//
// Architectural Flow:
//
// Turn Packet
//        ↓
// Conversation Relationship Engine
//        ↓
// Turn Classification Packet
//        ↓
// Executive Routing
//
// Responsibilities:
// - Define the canonical Turn Classification Packet.
// - Normalize classification results.
// - Validate packet completeness.
// - Preserve authority ownership.
//
// Non-responsibilities:
// - Does not classify conversations.
// - Does not execute rules.
// - Does not perform routing.
// - Does not retrieve memory.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriTurnClassificationPacket = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  create(input = {}) {

    const packet = {

      schema:
        "ari_turn_classification_packet",

      schemaVersion:
        this.schemaVersion,

      relationship:
        input.relationship ||
        window.AriConversationRelationshipTypes.UNKNOWN,

      confidence:
        this.normalizeConfidence(
          input.confidence
        ),

      evidence:
        this.normalizeArray(
          input.evidence
        ),

      matchedRule:
        input.matchedRule ||
        null,

      diagnostics:
        this.normalizeArray(
          input.diagnostics
        ),

      previousTurnAvailable:
        Boolean(
          input.previousTurnAvailable
        ),

      authority: {

        owner:
          "ari-conversation-relationship-engine",

        canonical: true

      }

    };

    packet.validation =
      this.validate(packet);

    return Object.freeze(packet);

  },

  validate(packet = {}) {

    const errors = [];
    const warnings = [];

    if (!packet.schema)
      errors.push(
        "missing_schema"
      );

    if (!packet.schemaVersion)
      errors.push(
        "missing_schema_version"
      );

    if (
      !window.AriConversationRelationshipTypes
        .isValid(packet.relationship)
    ) {

      errors.push(
        "invalid_relationship"
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

      errors,

      warnings

    };

  },

  normalizeConfidence(
    value
  ) {

    const confidence =
      Number(value);

    if (
      Number.isNaN(confidence)
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(1, confidence)
    );

  },

  normalizeArray(
    value
  ) {

    if (
      !Array.isArray(value)
    ) {
      return [];
    }

    return [...value];

  }

};

window.Ari.turnClassificationPacket =
  window.AriTurnClassificationPacket;