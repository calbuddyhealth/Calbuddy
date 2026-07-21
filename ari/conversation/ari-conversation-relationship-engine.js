// ari/conversation/ari-conversation-relationship-engine.js
// Ari Conversation Relationship Engine
//
// Purpose:
// Determine how the current turn relates to the surrounding
// conversation and produce the canonical Turn Classification Packet.
//
// V1.2.0 — Canonical Conversation Relationship Authority
//
// Architectural Flow:
//
// Turn Packet
//      ↓
// Perception Packet
//      ↓
// Conversation Relationship Rules
//      ↓
// Turn Classification Packet
//      ↓
// Executive Routing
//
// Responsibilities:
// - Read the Turn Packet.
// - Read Perception evidence.
// - Execute deterministic relationship rules.
// - Build the Turn Classification Packet.
// - Attach the packet to the runtime.
// - Validate the produced packet.
//
// Non-responsibilities:
// - Does not classify rules itself.
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriConversationRelationshipEngine = {

  version: "1.2.0",
  schemaVersion: "1.0.0",

  run(runtime = {}) {

    if (
      !window.AriConversationRelationshipRules ||
      !window.AriTurnClassificationPacket
    ) {

      return {
        ...runtime,
        errors: [
          "conversation_relationship_dependencies_missing"
        ]
      };

    }

    const turnPacket =
      runtime.turnPacket || {};

    const perceptionPacket =
      runtime.perceptionPacket || {};

    const relationship =
      window.AriConversationRelationshipRules.evaluate({

        text:
          turnPacket.normalizedMessage ||
          turnPacket.originalMessage,

        previousTurn:
          turnPacket.previousTurnAvailable,

        perception:
          perceptionPacket

      });

    const turnClassificationPacket =
      window.AriTurnClassificationPacket.create({

        relationship:
          relationship.relationship,

        confidence:
          relationship.confidence,

        evidence:
          relationship.evidence,

        matchedRule:
          relationship.matchedRule,

        diagnostics:
          relationship.diagnostics,

        previousTurnAvailable:
          turnPacket.previousTurnAvailable

      });

    return {

      ...runtime,

      turnClassificationPacket,

      diagnostics: {

        ...(runtime.diagnostics || {}),

        conversationRelationship: {

          complete: true,

          valid:
            turnClassificationPacket.validation.valid,

          relationship:
            turnClassificationPacket.relationship

        }

      }

    };

  },

  validate(runtime = {}) {

    if (
      !window.AriTurnClassificationPacket ||
      typeof window.AriTurnClassificationPacket.validate !== "function"
    ) {

      return {

        valid: false,

        errors: [
          "turn_classification_packet_unavailable"
        ],

        warnings: []

      };

    }

    return window.AriTurnClassificationPacket.validate(
      runtime.turnClassificationPacket
    );

  }

};

window.Ari.conversationRelationshipEngine =
  window.AriConversationRelationshipEngine;