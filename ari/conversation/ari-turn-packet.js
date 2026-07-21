// ari/conversation/ari-turn-packet.js
// Ari Turn Packet
//
// Purpose:
// Define the canonical Turn Packet used throughout the Ari runtime.
//
// V1.1.0 — Canonical Turn Contract
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
// - Build immutable Turn Packets.
// - Normalize user input.
// - Validate packet completeness.
// - Preserve canonical turn authority.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not classify conversations.
// - Does not perform routing.
// - Does not retrieve memory.
// - Does not execute continuity.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriTurnPacket = {
  version: "1.1.0",
  schema: "ari_turn_packet",
  schemaVersion: "1.0.0",

  create(input = {}) {

    const packet = {

      schema: this.schema,
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

      metadata:
        Object.freeze({
          ...(input.metadata || {})
        }),

      authority: Object.freeze({

        owner:
          "ari-turn-packet",

        canonical: true,

        createdBy:
          "AriTurnPacket"

      }),

      diagnostics: {

        created:
          new Date().toISOString(),

        validationPassed: false

      }

    };

    const validation =
      this.validate(packet);

    packet.validation =
      Object.freeze(validation);

    packet.diagnostics.validationPassed =
      validation.valid;

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

    if (!packet.turnId)
      errors.push(
        "missing_turn_id"
      );

    if (!packet.timestamp)
      errors.push(
        "missing_timestamp"
      );

    if (
      !packet.originalMessage
    ) {
      warnings.push(
        "empty_original_message"
      );
    }

    if (
      !packet.normalizedMessage
    ) {
      warnings.push(
        "empty_normalized_message"
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