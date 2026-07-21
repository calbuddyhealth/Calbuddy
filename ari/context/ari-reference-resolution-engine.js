// ari/context/ari-reference-resolution-engine.js
// Ari Reference Resolution Engine
//
// Purpose:
// Resolve conversational references from the current turn and produce
// the canonical Reference Packet.
//
// V1.0.0 — Canonical Reference Resolution Authority
//
// Architectural Flow:
//
// Turn Packet
//      ↓
// Turn Classification Packet
//      ↓
// Reference Resolution Engine
//      ↓
// Reference Packet
//      ↓
// Context Selection Engine
//
// Responsibilities:
// - Read the Turn Packet.
// - Read the Turn Classification Packet.
// - Read Perception evidence.
// - Resolve conversational references.
// - Produce the canonical Reference Packet.
// - Validate the produced packet.
//
// Non-responsibilities:
// - Does not retrieve memory.
// - Does not select execution context.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriReferenceResolutionEngine = {

  version: "1.0.0",

  schemaVersion: "1.0.0",

  run(runtime = {}) {

    if (
      !window.AriReferencePacket
    ) {

      return {

        ...runtime,

        errors: [
          "reference_packet_unavailable"
        ]

      };

    }

    const turnPacket =
      runtime.turnPacket || {};

    const classificationPacket =
      runtime.turnClassificationPacket || {};

    const perceptionPacket =
      runtime.perceptionPacket || {};

    const resolution =
      this.resolve({

        turnPacket,

        classificationPacket,

        perceptionPacket

      });

    const referencePacket =
      window.AriReferencePacket.create({

        references:
          resolution.references,

        primaryReference:
          resolution.primaryReference,

        unresolvedReferences:
          resolution.unresolvedReferences,

        confidence:
          resolution.confidence,

        evidence:
          resolution.evidence,

        diagnostics:
          resolution.diagnostics

      });

    return {

      ...runtime,

      referencePacket,

      diagnostics: {

        ...(runtime.diagnostics || {}),

        referenceResolution: {

          complete: true,

          valid:
            referencePacket.validation.valid,

          references:
            referencePacket.references.length,

          unresolved:
            referencePacket.unresolvedReferences.length

        }

      }

    };

  },

  resolve(input = {}) {

    const turnPacket =
      input.turnPacket || {};

    const classificationPacket =
      input.classificationPacket || {};

    const perceptionPacket =
      input.perceptionPacket || {};

    const references = [];

    const unresolvedReferences = [];

    const evidence = [];

    const diagnostics = [];

    //
    // Placeholder implementation.
    //
    // Future versions will delegate to:
    //
    // - Pronoun Resolver
    // - Ellipsis Resolver
    // - Entity Resolver
    // - Thread Reference Resolver
    // - Memory Reference Resolver
    //

    return {

      references,

      primaryReference:
        references[0] || null,

      unresolvedReferences,

      confidence:
        references.length > 0
          ? 1
          : 0,

      evidence,

      diagnostics: [

        ...diagnostics,

        {

          engine:
            "AriReferenceResolutionEngine",

          relationship:
            classificationPacket.relationship,

          messageLength:
            (
              turnPacket.normalizedMessage ||
              ""
            ).length,

          perceptionAvailable:
            Object.keys(
              perceptionPacket
            ).length > 0

        }

      ]

    };

  },

  validate(runtime = {}) {

    if (
      !window.AriReferencePacket ||
      typeof window.AriReferencePacket.validate !==
      "function"
    ) {

      return {

        valid: false,

        errors: [
          "reference_packet_validator_missing"
        ],

        warnings: []

      };

    }

    return window.AriReferencePacket.validate(

      runtime.referencePacket

    );

  }

};

window.Ari.referenceResolutionEngine =
  window.AriReferenceResolutionEngine;