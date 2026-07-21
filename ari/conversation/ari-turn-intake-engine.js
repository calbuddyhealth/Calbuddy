// ari/conversation/ari-turn-intake-engine.js
// Ari Turn Intake Engine
//
// Purpose:
// Create the canonical Turn Packet from the Runtime Request.
//
// V1.0.0 — Canonical Turn Authority
//
// Architectural Flow:
//
// Runtime Request
//      ↓
// Turn Intake Engine
//      ↓
// Canonical Turn Packet
//      ↓
// Perception Pipeline
//
// Responsibilities:
// - Create the canonical Turn Packet.
// - Preserve the original user message.
// - Preserve normalized user text.
// - Generate the Turn ID if missing.
// - Generate timestamp if missing.
// - Preserve conversation identifiers.
// - Preserve thread identifiers.
// - Preserve request metadata.
// - Detect whether previous thread context exists.
// - Validate required turn fields.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not classify conversation.
// - Does not determine follow-ups.
// - Does not determine routing.
// - Does not retrieve memory.
// - Does not resolve continuity.
// - Does not answer the user.
// - Does not modify semantic meaning.
// - Does not execute any pipeline.

window.Ari = window.Ari || {};

window.AriTurnIntakeEngine = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  run(runtimeRequest = {}) {
    const request =
      runtimeRequest?.request ||
      runtimeRequest;

    const turn =
      request?.turn ||
      {};

    const conversation =
      request?.conversation ||
      {};

    const thread =
      request?.thread ||
      {};

    const metadata =
      request?.metadata ||
      {};

    const originalMessage =
      this.cleanText(
        turn.originalMessage ??
        turn.message ??
        request.message ??
        ""
      );

    const normalizedMessage =
      this.normalizeMessage(
        originalMessage
      );

    const turnPacket = {
      schema: "ari_turn_packet",
      schemaVersion: this.schemaVersion,

      turnId:
        turn.turnId ||
        this.generateTurnId(),

      timestamp:
        turn.timestamp ||
        new Date().toISOString(),

      source:
        turn.source ||
        "user",

      conversationId:
        conversation.conversationId ||
        null,

      threadId:
        thread.threadId ||
        null,

      originalMessage,

      normalizedMessage,

      previousTurnAvailable:
        Boolean(
          thread.previousTurn ||
          thread.lastTurn ||
          thread.history?.length
        ),

      metadata: {
        ...metadata
      },

      authority: {
        owner:
          "ari-turn-intake-engine",

        canonical:
          true
      }
    };

    return {
      ...runtimeRequest,
      turnPacket
    };
  },

  generateTurnId() {
    return (
      "turn_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  },

  normalizeMessage(text = "") {
    return this.cleanText(text)
      .replace(/\s+/g, " ")
      .trim();
  },

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  validate(turnPacket = {}) {
    const errors = [];

    if (!turnPacket.turnId)
      errors.push("missing_turn_id");

    if (!turnPacket.timestamp)
      errors.push("missing_timestamp");

    if (!turnPacket.originalMessage)
      errors.push("missing_original_message");

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

window.Ari.turnIntakeEngine =
  window.AriTurnIntakeEngine;