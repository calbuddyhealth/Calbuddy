// ari/conversation/ari-conversation-relationship-rules.js
// Ari Conversation Relationship Rules
//
// Purpose:
// Execute the canonical conversation relationship rule set.
//
// V3.0.0 — Registry-Driven Rule Evaluator
//
// Architectural Flow:
//
// Turn Packet
//        ↓
// Conversation Relationship Rules
//        ↓
// Conversation Rule Registry
//        ↓
// Registered Rules
//        ↓
// Relationship Result
//        ↓
// Conversation Relationship Engine
//
// Responsibilities:
// - Execute registered relationship rules.
// - Preserve deterministic evaluation order.
// - Return the highest-priority authoritative match.
// - Produce canonical relationship results.
// - Preserve evaluation diagnostics.
//
// Non-responsibilities:
// - Does not own the rule registry.
// - Does not interpret semantic meaning.
// - Does not retrieve memory.
// - Does not perform routing.
// - Does not answer users.
// - Does not execute downstream pipelines.

window.Ari = window.Ari || {};

window.AriConversationRelationshipRules = {

  version: "3.0.0",

  evaluate(input = {}) {

    const context =
      this.buildContext(input);

    const registry =
      window.AriConversationRuleRegistry;

    if (
      !registry ||
      typeof registry.getRules !== "function"
    ) {

      return this.errorResult(
        "conversation_rule_registry_missing"
      );

    }

    const rules =
      registry.getRules();

    const diagnostics = [];

    for (const rule of rules) {

      const started =
        performance.now();

      let result = null;

      try {

        result =
          rule.evaluate(context);

      }

      catch (error) {

        diagnostics.push({

          id:
            rule.id,

          priority:
            rule.priority,

          matched: false,

          confidence: 0,

          elapsedMs:
            performance.now() - started,

          error:
            error?.message ||
            "rule_execution_failed"

        });

        continue;

      }

      diagnostics.push({

        id:
          rule.id,

        priority:
          rule.priority,

        matched:
          Boolean(result?.matched),

        confidence:
          result?.confidence ?? 0,

        elapsedMs:
          performance.now() - started

      });

      if (
        result?.matched === true
      ) {

        return {

          relationship:
            result.relationship,

          confidence:
            result.confidence ?? 1,

          evidence:
            result.evidence || [],

          matchedRule:
            rule.id,

          diagnostics

        };

      }

    }

    if (
      typeof registry.defaultResult ===
      "function"
    ) {

      return registry.defaultResult(
        diagnostics
      );

    }

    return this.errorResult(
      "registry_default_result_missing",
      diagnostics
    );

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

  errorResult(
    code,
    diagnostics = []
  ) {

    return {

      relationship:
        window.AriConversationRelationshipTypes.UNKNOWN,

      confidence: 0,

      evidence: [],

      matchedRule: null,

      diagnostics,

      error: code

    };

  }

};

window.Ari.conversationRelationshipRules =
  window.AriConversationRelationshipRules;