// ari/conversation/ari-turn-packet.js
// Ari Turn Packet
//
// Purpose:
// Define and validate the canonical Turn Packet used throughout the Ari
// runtime.
//
// V1.0.0 — Canonical Turn Contract
//
// Architectural Flow:
//
// Runtime Request
//      ↓
// Turn Intake Engine
//      ↓
// Turn Packet
//      ↓
// Perception Pipeline
//
// Responsibilities:
// - Define the canonical Turn Packet schema.
// - Build normalized Turn Packets.
// - Validate packet completeness.
// - Preserve packet immutability after creation.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not classify conversation.
// - Does not determine routing.
// - Does not retrieve memory.
// - Does not resolve continuity.
// - Does not answer users.
// - Does not modify runtime state.

window.Ari = window.Ari || {};

window.AriTurnPacket = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  create(input = {}) {
    const packet = {
      schema: "ari_turn_packet",
      schemaVersion: this.schemaVersion,

      turnId:
        input.turnId ||
        this.generateTurnId(),

      timestamp:
        input.timestamp ||
        new Date().toISOString(),

      source:
        input.source ||
        "user",

      conversationId:
        input.conversationId ||
        null,

      threadId:
        input.threadId ||
        null,

      originalMessage:
        this.cleanText(
          input.originalMessage
        ),

      normalizedMessage:
        this.normalizeMessage(
          input.normalizedMessage ??
          input.originalMessage
        ),

      previousTurnAvailable:
        Boolean(
          input.previousTurnAvailable
        ),

      metadata: {
        ...(input.metadata || {})
      },

      authority: {
        owner:
          "ari-turn-packet",

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

    if (!packet.turnId)
      errors.push(
        "missing_turn_id"
      );

    if (!packet.timestamp)
      errors.push(
        "missing_timestamp"
      );

    if (!packet.originalMessage)
      errors.push(
        "missing_original_message"
      );

    if (!packet.normalizedMessage)
      warnings.push(
        "missing_normalized_message"
      );

    if (!packet.schema)
      errors.push(
        "missing_schema"
      );

    if (!packet.schemaVersion)
      errors.push(
        "missing_schema_version"
      );

    return {
      valid:
        errors.length === 0,

      errors,

      warnings
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
  }
};

window.Ari.turnPacket =
  window.AriTurnPacket;