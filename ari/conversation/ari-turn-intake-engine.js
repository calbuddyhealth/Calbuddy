// ari/conversation/ari-turn-intake-engine.js
// Ari Turn Intake Engine
//
// Purpose:
// Build the canonical Turn Packet from the Runtime Request.
//
// V1.2.0 — Canonical Turn Intake Authority
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
// - Detect previous-thread availability.
// - Preserve request metadata.
// - Delegate Turn Packet creation.
// - Attach the Turn Packet to the runtime.
// - Validate the produced packet.
//
// Non-responsibilities:
// - Does not define Turn Packet schema.
// - Does not normalize text.
// - Does not generate Turn IDs.
// - Does not interpret semantic meaning.
// - Does not classify conversation.
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not perform routing.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriTurnIntakeEngine = {
  version: "1.2.0",
  schemaVersion: "1.0.0",

  run(runtime = {}) {

    if (
      !window.AriTurnPacket ||
      typeof window.AriTurnPacket.create !== "function"
    ) {

      return {
        ...runtime,

        errors: [
          "ari_turn_packet_unavailable"
        ]
      };

    }

    const request =
  runtime.request &&
  typeof runtime.request ===
    "object" &&
  !Array.isArray(
    runtime.request
  )
    ? runtime.request
    : runtime;

    const turn =
      request.turn ||
      {};

    const conversation =
      request.conversation ||
      {};

    const thread =
      request.thread ||
      {};

    const metadata =
      request.metadata ||
      {};

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

        originalMessage:
          turn.originalMessage ??
          turn.message ??
          request.message ??
          "",

        previousTurnAvailable:
          Boolean(

            thread.previousTurn ||

            thread.lastTurn ||

            thread.history?.length

          ),

        metadata

      });

    return {

      ...runtime,

      turnPacket,

      diagnostics: {

        ...(runtime.diagnostics || {}),

        turnIntake: {

          complete: true,

          valid:
            turnPacket.validation.valid,

          turnId:
            turnPacket.turnId

        }

      }

    };

  },

  validate(runtime = {}) {

    if (
      !window.AriTurnPacket ||
      typeof window.AriTurnPacket.validate !== "function"
    ) {

      return {

        valid: false,

        errors: [
          "ari_turn_packet_unavailable"
        ],

        warnings: []

      };

    }

    return window.AriTurnPacket.validate(
      runtime.turnPacket
    );

  }

};

window.Ari.turnIntakeEngine =
  window.AriTurnIntakeEngine;