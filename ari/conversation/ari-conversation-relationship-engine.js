// ari/conversation/ari-conversation-relationship-engine.js
// Ari Conversation Relationship Engine
//
// Purpose:
// Determine how the current user turn relates to the surrounding
// conversation and produce the canonical Turn Classification Packet.
//
// V1.1.0 — Canonical Conversation Relationship Authority
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
// - Produce the canonical Turn Classification Packet.
// - Validate the produced packet.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not determine user intent.
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer the user.
// - Does not modify previous packets.

window.Ari = window.Ari || {};

window.AriConversationRelationshipEngine = {
  version: "1.1.0",
  schemaVersion: "1.0.0",

  run(runtime = {}) {

    const turnPacket =
      runtime.turnPacket || {};

    const perceptionPacket =
      runtime.perceptionPacket || {};

    const relationshipResult =
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
          relationshipResult.relationship,

        confidence:
          relationshipResult.confidence,

        evidence:
          relationshipResult.evidence,

        matchedRule:
          relationshipResult.matchedRule,

        diagnostics:
          relationshipResult.diagnostics,

        previousTurnAvailable:
          turnPacket.previousTurnAvailable

      });

    return {

      ...runtime,

      turnClassificationPacket

    };

  },

  validate(runtime = {}) {

    if (
      !runtime.turnClassificationPacket
    ) {

      return {

        valid: false,

        errors: [
          "missing_turn_classification_packet"
        ]

      };

    }

    return window.AriTurnClassificationPacket.validate(
      runtime.turnClassificationPacket
    );

  }

};

window.Ari.conversationRelationshipEngine =
  window.AriConversationRelationshipEngine;