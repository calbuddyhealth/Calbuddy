// ari/context/ari-reference-packet.js
// Ari Reference Packet
//
// Purpose:
// Define the canonical Reference Packet produced by the
// Reference Resolution Engine.
//
// V1.0.0 — Canonical Reference Contract
//
// Architectural Flow:
//
// Turn Packet
//        ↓
// Turn Classification Packet
//        ↓
// Reference Resolution Engine
//        ↓
// Reference Packet
//        ↓
// Context Selection Engine
//
// Responsibilities:
// - Define the canonical Reference Packet schema.
// - Normalize resolved references.
// - Validate packet completeness.
// - Preserve packet immutability.
// - Preserve reference authority.
//
// Non-responsibilities:
// - Does not resolve references.
// - Does not retrieve memory.
// - Does not classify conversations.
// - Does not perform routing.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriReferencePacket = {

  version: "1.0.0",

  schema: "ari_reference_packet",

  schemaVersion: "1.0.0",

  create(input = {}) {

    const packet = {

      schema:
        this.schema,

      schemaVersion:
        this.schemaVersion,

      references:
        Object.freeze(
          this.normalizeArray(
            input.references
          )
        ),

      primaryReference:
        input.primaryReference ||
        null,

      unresolvedReferences:
        Object.freeze(
          this.normalizeArray(
            input.unresolvedReferences
          )
        ),

      confidence:
        this.normalizeConfidence(
          input.confidence
        ),

      evidence:
        Object.freeze(
          this.normalizeArray(
            input.evidence
          )
        ),

      diagnostics:
        Object.freeze(
          this.normalizeArray(
            input.diagnostics
          )
        ),

      authority:
        Object.freeze({

          owner:
            "ari-reference-resolution-engine",

          canonical: true,

          createdBy:
            "AriReferencePacket"

        })

    };

    const validation =
      this.validate(packet);

    packet.validation =
      Object.freeze(validation);

    return Object.freeze(packet);

  },

  validate(packet = {}) {

    const errors = [];
    const warnings = [];

    if (!packet.schema) {

      errors.push(
        "missing_schema"
      );

    }

    if (!packet.schemaVersion) {

      errors.push(
        "missing_schema_version"
      );

    }

    if (
      !Array.isArray(
        packet.references
      )
    ) {

      errors.push(
        "invalid_references"
      );

    }

    if (
      !Array.isArray(
        packet.unresolvedReferences
      )
    ) {

      errors.push(
        "invalid_unresolved_references"
      );

    }

    if (
      typeof packet.confidence !==
      "number"
    ) {

      errors.push(
        "invalid_confidence"
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

  normalizeConfidence(value) {

    const confidence =
      Number(value);

    if (
      Number.isNaN(confidence)
    ) {

      return 0;

    }

    return Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  },

  normalizeArray(value) {

    if (
      !Array.isArray(value)
    ) {

      return [];

    }

    return [...value];

  }

};

window.Ari.referencePacket =
  window.AriReferencePacket;