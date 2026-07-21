// ari/conversation/ari-turn-classification-packet.js
// Ari Turn Classification Packet
//
// Purpose:
// Define the canonical packet produced by the Conversation
// Relationship Engine.
//
// V1.2.0 — Defensive Relationship Registry Handling
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
// - Preserve packet immutability.
// - Preserve authority ownership.
// - Safely handle an unavailable relationship-type registry.
//
// Non-responsibilities:
// - Does not classify conversations.
// - Does not execute rules.
// - Does not perform routing.
// - Does not retrieve memory.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriTurnClassificationPacket = {

  version: "1.2.0",
  schema: "ari_turn_classification_packet",
  schemaVersion: "1.0.0",

  create(input = {}) {

    const relationshipTypes =
      this.getRelationshipTypes();

    const packet = {

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      relationship:
        input.relationship ||
        relationshipTypes?.UNKNOWN ||
        "unknown",

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

      matchedRule:
        input.matchedRule ||
        null,

      diagnostics:
        Object.freeze(
          this.normalizeArray(
            input.diagnostics
          )
        ),

      previousTurnAvailable:
        Boolean(
          input.previousTurnAvailable
        ),

      authority:
        Object.freeze({

          owner:
            "ari-conversation-relationship-engine",

          canonical: true,

          createdBy:
            "AriTurnClassificationPacket"

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

    const relationshipTypes =
      this.getRelationshipTypes();

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

    if (!packet.relationship) {

      errors.push(
        "missing_relationship"
      );

    }

    if (!relationshipTypes) {

      warnings.push(
        "relationship_registry_unavailable"
      );

    }

    else if (
      typeof relationshipTypes.isValid !==
      "function"
    ) {

      warnings.push(
        "relationship_registry_validator_unavailable"
      );

    }

    else if (
      !relationshipTypes.isValid(
        packet.relationship
      )
    ) {

      errors.push(
        "invalid_relationship"
      );

    }

    if (
      typeof packet.confidence !==
      "number" ||
      !Number.isFinite(
        packet.confidence
      )
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

  getRelationshipTypes() {

    return (
      window.AriConversationRelationshipTypes ||
      window.Ari?.conversationRelationshipTypes ||
      null
    );

  },

  normalizeConfidence(value) {

    const confidence =
      Number(value);

    if (
      !Number.isFinite(
        confidence
      )
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

  }

};

window.Ari.turnClassificationPacket =
  window.AriTurnClassificationPacket;