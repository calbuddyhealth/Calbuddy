// ari/conversation/ari-turn-intake-engine.js
// Ari Turn Intake Engine
//
// Purpose:
// Build the canonical Turn Packet from the Runtime Request.
//
// V1.1.0 — Canonical Turn Intake Delegation
//
// Architectural Flow:
//
// Runtime Request
//      ↓
// Turn Intake Engine
//      ↓
// Ari Turn Packet
//      ↓
// Canonical Turn Packet
//      ↓
// Perception Pipeline
//
// Responsibilities:
// - Read the canonical Runtime Request.
// - Extract current-turn information.
// - Preserve request metadata.
// - Detect previous-thread availability.
// - Delegate Turn Packet creation.
// - Attach the Turn Packet to the runtime envelope.
//
// Non-responsibilities:
// - Does not define the Turn Packet schema.
// - Does not generate Turn IDs.
// - Does not normalize text.
// - Does not validate Turn Packets.
// - Does not interpret semantic meaning.
// - Does not classify conversation.
// - Does not determine routing.
// - Does not resolve continuity.
// - Does not retrieve memory.
// - Does not answer users.
// - Does not execute downstream pipelines.

window.Ari = window.Ari || {};

window.AriTurnIntakeEngine = {
  version: "1.1.0",
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
      turn.originalMessage ??
      turn.message ??
      request.message ??
      "";

    const turnPacket =
      window.AriTurnPacket.create({
        turnId:
          turn.turnId,

        timestamp:
          turn.timestamp,

        source:
          turn.source,

        conversationId:
          conversation.conversationId,

        threadId:
          thread.threadId,

        originalMessage,

        previousTurnAvailable:
          Boolean(
            thread.previousTurn ||
            thread.lastTurn ||
            thread.history?.length
          ),

        metadata
      });

    return {
      ...runtimeRequest,

      turnPacket
    };
  },

  validate(runtimeResult = {}) {
    const turnPacket =
      runtimeResult?.turnPacket;

    if (
      !window.AriTurnPacket ||
      typeof window.AriTurnPacket.validate !== "function"
    ) {
      return {
        valid: false,
        errors: [
          "ari_turn_packet_unavailable"
        ]
      };
    }

    return window.AriTurnPacket.validate(
      turnPacket
    );
  }
};

window.Ari.turnIntakeEngine =
  window.AriTurnIntakeEngine;