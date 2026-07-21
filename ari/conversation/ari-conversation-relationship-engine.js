// ari/conversation/ari-conversation-relationship-engine.js
// Ari Conversation Relationship Engine
//
// Purpose:
// Determine how the current turn relates to the surrounding
// conversation and produce the canonical Turn Classification Packet.
//
// V1.3.0 — Stage-Safe Relationship Execution Diagnostics
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
// - Build the Turn Classification Packet.
// - Attach the packet to the runtime.
// - Validate the produced packet.
// - Preserve stage-specific execution diagnostics.
//
// Non-responsibilities:
// - Does not classify rules itself.
// - Does not retrieve memory.
// - Does not resolve references.
// - Does not perform routing.
// - Does not deliberate.
// - Does not answer users.
// - Does not suppress execution failures.
window.Ari = window.Ari || {};
window.AriConversationRelationshipEngine = {
  version: "1.3.0",
  schemaVersion: "1.0.0",
  run(runtime = {}) {
    if (
      !window.AriConversationRelationshipRules ||
      typeof window.AriConversationRelationshipRules.evaluate !==
        "function"
    ) {
      return {
        ...runtime,
        errors: [
          ...(runtime.errors || []),
          "conversation_relationship_rules_unavailable"
        ],
        diagnostics: {
          ...(runtime.diagnostics || {}),
          conversationRelationship: {
            complete: false,
            valid: false,
            stage: "dependency_check",
            error:
              "conversation_relationship_rules_unavailable"
          }
        }
      };
    }
    if (
      !window.AriTurnClassificationPacket ||
      typeof window.AriTurnClassificationPacket.create !==
        "function"
    ) {
      return {
        ...runtime,
        errors: [
          ...(runtime.errors || []),
          "turn_classification_packet_factory_unavailable"
        ],
        diagnostics: {
          ...(runtime.diagnostics || {}),
          conversationRelationship: {
            complete: false,
            valid: false,
            stage: "dependency_check",
            error:
              "turn_classification_packet_factory_unavailable"
          }
        }
      };
    }
    const turnPacket =
      runtime.turnPacket || {};
    const perceptionPacket =
      runtime.perceptionPacket || {};
    let relationship;
    try {
      relationship =
        window.AriConversationRelationshipRules.evaluate({
          text:
            turnPacket.normalizedMessage ||
            turnPacket.originalMessage ||
            "",
          previousTurn:
            Boolean(
              turnPacket.previousTurnAvailable
            ),
          perception:
            perceptionPacket
        });
    }
    catch (error) {
      return {
        ...runtime,
        errors: [
          ...(runtime.errors || []),
          "conversation_relationship_rules_threw"
        ],
        diagnostics: {
          ...(runtime.diagnostics || {}),
          conversationRelationship: {
            complete: false,
            valid: false,
            stage: "rule_evaluation",
            error:
              error?.message ||
              String(error),
            stack:
              error?.stack ||
              null
          }
        }
      };
    }
    if (
      !relationship ||
      typeof relationship !==
        "object"
    ) {
      return {
        ...runtime,
        errors: [
          ...(runtime.errors || []),
          "conversation_relationship_result_invalid"
        ],
        diagnostics: {
          ...(runtime.diagnostics || {}),
          conversationRelationship: {
            complete: false,
            valid: false,
            stage: "rule_result_validation",
            error:
              "conversation_relationship_result_invalid",
            receivedType:
              typeof relationship
          }
        }
      };
    }
    let turnClassificationPacket;
    try {
      turnClassificationPacket =
        window.AriTurnClassificationPacket.create({
          relationship:
            relationship.relationship,
          confidence:
            relationship.confidence,
          evidence:
            relationship.evidence,
          matchedRule:
            relationship.matchedRule,
          diagnostics:
            relationship.diagnostics,
          previousTurnAvailable:
            Boolean(
              turnPacket.previousTurnAvailable
            )
        });
    }
    catch (error) {
      return {
        ...runtime,
        errors: [
          ...(runtime.errors || []),
          "turn_classification_packet_creation_threw"
        ],
        diagnostics: {
          ...(runtime.diagnostics || {}),
          conversationRelationship: {
            complete: false,
            valid: false,
            stage: "packet_creation",
            error:
              error?.message ||
              String(error),
            stack:
              error?.stack ||
              null,
            relationshipResult:
              relationship
          }
        }
      };
    }
    return {
      ...runtime,
      turnClassificationPacket,
      diagnostics: {
        ...(runtime.diagnostics || {}),
        conversationRelationship: {
          complete: true,
          valid:
            Boolean(
              turnClassificationPacket?.validation?.valid
            ),
          relationship:
            turnClassificationPacket?.relationship ||
            null,
          warnings:
            turnClassificationPacket?.validation?.warnings ||
            []
        }
      }
    };
  },
  validate(runtime = {}) {
    if (
      !window.AriTurnClassificationPacket ||
      typeof window.AriTurnClassificationPacket.validate !==
        "function"
    ) {
      return {
        valid: false,
        errors: [
          "turn_classification_packet_unavailable"
        ],
        warnings: []
      };
    }
    if (
      !runtime.turnClassificationPacket
    ) {
      return {
        valid: false,
        errors: [
          "turn_classification_packet_missing"
        ],
        warnings: []
      };
    }
    try {
      return window.AriTurnClassificationPacket.validate(
        runtime.turnClassificationPacket
      );
    }
    catch (error) {
      return {
        valid: false,
        errors: [
          "turn_classification_packet_validation_threw"
        ],
        warnings: [],
        diagnostics: {
          error:
            error?.message ||
            String(error),
          stack:
            error?.stack ||
            null
        }
      };
    }
  }
};
window.Ari.conversationRelationshipEngine =
  window.AriConversationRelationshipEngine;