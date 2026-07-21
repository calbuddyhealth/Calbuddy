// ari/conversation/ari-conversation-relationship-engine.js
// Ari Conversation Relationship Engine
//
// Purpose:
// Determine how the current user turn relates to the surrounding
// conversation using deterministic conversational evidence.
//
// V1.0.0 — Canonical Conversation Relationship Authority
//
// Architectural Flow:
//
// Turn Packet
//      ↓
// Perception Evidence
//      ↓
// Conversation Relationship Engine
//      ↓
// Turn Classification Packet
//      ↓
// Executive Routing
//
// Responsibilities:
// - Determine conversation relationship.
// - Detect first-turn conversations.
// - Detect follow-up turns.
// - Detect elliptical follow-ups.
// - Detect topic shifts.
// - Detect clarifications.
// - Detect corrections.
// - Detect thread resumes.
// - Produce the canonical Turn Classification Packet.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not determine user intent.
// - Does not answer the user.
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not execute routing.
// - Does not execute continuity.
// - Does not deliberate.
// - Does not modify Turn Packets.

window.Ari = window.Ari || {};

window.AriConversationRelationshipEngine = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  run(runtime = {}) {

    const turnPacket =
      runtime.turnPacket || {};

    const perception =
      runtime.perceptionPacket || {};

    const previousTurn =
      turnPacket.previousTurnAvailable === true;

    const text =
      (
        turnPacket.normalizedMessage ||
        turnPacket.originalMessage ||
        ""
      ).trim();

    const relationship =
      window.AriRelationshipRules.evaluate({
        text,
        previousTurn,
        perception
      });

    const classification =
      window.AriTurnClassificationPacket.create({
        relationship,
        evidence:
          relationship.evidence || [],
        confidence:
          relationship.confidence,
        previousTurnAvailable:
          previousTurn
      });

    return {
      ...runtime,
      turnClassificationPacket:
        classification
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

    return {
      valid: true,
      errors: []
    };
  }
};

window.Ari.conversationRelationshipEngine =
  window.AriConversationRelationshipEngine;