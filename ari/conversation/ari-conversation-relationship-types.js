// ari/conversation/ari-conversation-relationship-types.js
// Ari Conversation Relationship Types
//
// Purpose:
// Define the canonical conversation relationship types used
// throughout the Ari runtime.
//
// V1.2.0 — Canonical Conversation Relationship Registry
//
// Architectural Flow:
//
// Conversation Relationship Engine
//          ↓
// Relationship Types
//          ↓
// Relationship Rules
//          ↓
// Turn Classification Packet
//
// Responsibilities:
// - Define the canonical relationship enumeration.
// - Provide validation utilities.
// - Provide registry helpers.
// - Preserve canonical relationship definitions.
//
// Non-responsibilities:
// - Does not classify conversations.
// - Does not execute rules.
// - Does not interpret semantic meaning.
// - Does not retrieve memory.
// - Does not perform routing.
// - Does not answer users.

window.Ari = window.Ari || {};

const RELATIONSHIP_TYPES = Object.freeze({

  /* ============================================
     Conversation Start
  ============================================ */

  FIRST_TURN:
    "FIRST_TURN",

  /* ============================================
     Continuation
  ============================================ */

  FOLLOW_UP:
    "FOLLOW_UP",

  ELLIPTICAL_FOLLOW_UP:
    "ELLIPTICAL_FOLLOW_UP",

  THREAD_RESUME:
    "THREAD_RESUME",

  TASK_CONTINUATION:
    "TASK_CONTINUATION",

  /* ============================================
     Conversation Management
  ============================================ */

  CLARIFICATION:
    "CLARIFICATION",

  CORRECTION:
    "CORRECTION",

  CONFIRMATION:
    "CONFIRMATION",

  NEGATION:
    "NEGATION",

  ACKNOWLEDGEMENT:
    "ACKNOWLEDGEMENT",

  CONTEXT_UPDATE:
    "CONTEXT_UPDATE",

  /* ============================================
     Topic Management
  ============================================ */

  TOPIC_SHIFT:
    "TOPIC_SHIFT",

  INTERRUPTION:
    "INTERRUPTION",

  META_CONVERSATION:
    "META_CONVERSATION",

  /* ============================================
     Standalone Turn
  ============================================ */

  DIRECT_REQUEST:
    "DIRECT_REQUEST",

  /* ============================================
     Response Turns
  ============================================ */

  ANSWER:
    "ANSWER",

  /* ============================================
     Fallback
  ============================================ */

  UNKNOWN:
    "UNKNOWN"

});

window.AriConversationRelationshipTypes = {

  version: "1.2.0",

  schemaVersion: "1.0.0",

  types: RELATIONSHIP_TYPES,

  values() {

    return Object.freeze(
      Object.values(this.types)
    );

  },

  list() {

    return [...this.values()];

  },

  count() {

    return this.values().length;

  },

  has(type) {

    return this.values().includes(type);

  },

  isValid(type) {

    return this.has(type);

  }

};

Object.assign(
  window.AriConversationRelationshipTypes,
  RELATIONSHIP_TYPES
);

Object.freeze(
  window.AriConversationRelationshipTypes
);

window.Ari.conversationRelationshipTypes =
  window.AriConversationRelationshipTypes;