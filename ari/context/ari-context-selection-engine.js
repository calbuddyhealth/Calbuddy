// ari/context/ari-context-selection-engine.js
// Ari Context Selection Engine
//
// Purpose:
// Select the execution context for the current turn and produce
// the canonical Context Packet.
//
// V1.0.0 — Canonical Context Selection Authority
//
// Architectural Flow:
//
// Turn Packet
//      ↓
// Turn Classification Packet
//      ↓
// Reference Packet
//      ↓
// Context Selection Engine
//      ↓
// Context Packet
//      ↓
// Executive Routing
//
// Responsibilities:
// - Read the Turn Packet.
// - Read the Turn Classification Packet.
// - Read the Reference Packet.
// - Select execution context.
// - Produce the canonical Context Packet.
// - Validate the produced packet.
//
// Non-responsibilities:
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not classify conversations.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriContextSelectionEngine = {

  version: "1.0.0",

  schemaVersion: "1.0.0",

  run(runtime = {}) {

    if (
      !window.AriContextPacket
    ) {

      return {

        ...runtime,

        errors: [
          "context_packet_unavailable"
        ]

      };

    }

    const turnPacket =
      runtime.turnPacket || {};

    const turnClassificationPacket =
      runtime.turnClassificationPacket || {};

    const referencePacket =
      runtime.referencePacket || {};

    const context =
      this.select({

        turnPacket,

        turnClassificationPacket,

        referencePacket,

        runtime

      });

    const contextPacket =
      window.AriContextPacket.create({

        selectedContext:
          context.selectedContext,

        conversationHistory:
          context.conversationHistory,

        activeEntities:
          context.activeEntities,

        retrievedMemory:
          context.retrievedMemory,

        confidence:
          context.confidence,

        evidence:
          context.evidence,

        diagnostics:
          context.diagnostics

      });

    return {

      ...runtime,

      contextPacket,

      diagnostics: {

        ...(runtime.diagnostics || {}),

        contextSelection: {

          complete: true,

          valid:
            contextPacket.validation.valid,

          confidence:
            contextPacket.confidence,

          activeEntities:
            contextPacket.activeEntities.length,

          retrievedMemory:
            contextPacket.retrievedMemory.length

        }

      }

    };

  },

  select(input = {}) {

    const turnPacket =
      input.turnPacket || {};

    const classificationPacket =
      input.turnClassificationPacket || {};

    const referencePacket =
      input.referencePacket || {};

    //
    // Placeholder implementation.
    //
    // Future versions will determine:
    //
    // - history budget
    // - memory budget
    // - active entities
    // - continuity requirements
    // - retrieval requirements
    //

    return {

      selectedContext: {

        relationship:
          classificationPacket.relationship ||

          null,

        primaryReference:
          referencePacket.primaryReference ||

          null

      },

      conversationHistory: [],

      activeEntities:
        referencePacket.references || [],

      retrievedMemory: [],

      confidence:
        referencePacket.confidence || 0,

      evidence: [],

      diagnostics: [

        {

          engine:
            "AriContextSelectionEngine",

          relationship:
            classificationPacket.relationship ||

            null,

          references:
            (
              referencePacket.references ||

              []
            ).length,

          messageLength:
            (
              turnPacket.normalizedMessage ||

              ""
            ).length

        }

      ]

    };

  },

  validate(runtime = {}) {

    if (

      !window.AriContextPacket ||

      typeof window.AriContextPacket.validate !==
      "function"

    ) {

      return {

        valid: false,

        errors: [
          "context_packet_validator_missing"
        ],

        warnings: []

      };

    }

    return window.AriContextPacket.validate(

      runtime.contextPacket

    );

  }

};

window.Ari.contextSelectionEngine =
  window.AriContextSelectionEngine;