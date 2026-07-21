// ari/conversation/ari-conversation-relationship-rules.js
// Ari Conversation Relationship Rules
//
// Purpose:
// Execute the canonical conversation relationship rule set.
//
// V2.0.0 — Rule Registry Architecture
//
// Architectural Flow:
//
// Turn Packet
//        ↓
// Conversation Relationship Rules
//        ↓
// Registered Rule Set
//        ↓
// Relationship Result
//        ↓
// Conversation Relationship Engine
//
// Responsibilities:
// - Execute registered relationship rules.
// - Preserve deterministic evaluation.
// - Return the first authoritative match.
// - Produce canonical relationship results.
// - Preserve evaluation diagnostics.
//
// Non-responsibilities:
// - Does not interpret semantic meaning.
// - Does not retrieve memory.
// - Does not perform routing.
// - Does not answer users.
// - Does not execute downstream pipelines.

window.Ari = window.Ari || {};

window.AriConversationRelationshipRules = {
  version: "2.0.0",

  evaluate(input = {}) {

    const context =
      this.buildContext(input);

    const rules =
      this.getRules();

    const diagnostics = [];

    for (const rule of rules) {

      const result =
        rule.evaluate(context);

      diagnostics.push({
        id: rule.id,
        matched: Boolean(result)
      });

      if (result) {

        return {
          ...result,

          diagnostics,

          matchedRule:
            rule.id
        };

      }

    }

    return this.defaultResult(diagnostics);

  },

  buildContext(input = {}) {

    const text =
      String(
        input.text || ""
      ).trim();

    return {

      text,

      lower:
        text.toLowerCase(),

      previousTurn:
        Boolean(
          input.previousTurn
        ),

      perception:
        input.perception || {}

    };

  },

  getRules() {

    return [

      window.AriConversationRelationshipRule_FirstTurn,

      window.AriConversationRelationshipRule_Elliptical,

      window.AriConversationRelationshipRule_Correction,

      window.AriConversationRelationshipRule_Clarification,

      window.AriConversationRelationshipRule_Confirmation,

      window.AriConversationRelationshipRule_Negation,

      window.AriConversationRelationshipRule_Acknowledgement,

      window.AriConversationRelationshipRule_Default

    ].filter(Boolean);

  },

  defaultResult(
    diagnostics = []
  ) {

    return {

      relationship:
        window.AriConversationRelationshipTypes.UNKNOWN,

      confidence: 0,

      evidence: [],

      diagnostics,

      matchedRule: null

    };

  }

};

window.Ari.conversationRelationshipRules =
  window.AriConversationRelationshipRules;