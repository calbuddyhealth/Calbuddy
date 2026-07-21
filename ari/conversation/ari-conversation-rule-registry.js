// ari/conversation/ari-conversation-rule-registry.js
// Ari Conversation Rule Registry
//
// Purpose:
// Own and expose the canonical Conversation Relationship Rule registry.
//
// V1.0.0 — Canonical Conversation Rule Registry
//
// Architectural Flow:
//
// Rule Files
//      ↓
// Conversation Rule Registry
//      ↓
// Relationship Rules Evaluator
//      ↓
// Relationship Result
//
// Responsibilities:
// - Register conversation relationship rules.
// - Preserve deterministic evaluation order.
// - Validate registered rules.
// - Expose canonical rule access.
// - Provide the default relationship result.
//
// Non-responsibilities:
// - Does not execute rules.
// - Does not classify conversations.
// - Does not retrieve memory.
// - Does not perform routing.
// - Does not answer users.

window.Ari = window.Ari || {};

window.AriConversationRuleRegistry = {

  version: "1.0.0",
  schemaVersion: "1.0.0",

  rules: [],

  /* =====================================================
     Registration
  ===================================================== */

  register(rule) {

    if (!this.validateRule(rule)) {
      return false;
    }

    if (this.has(rule.id)) {
      return false;
    }

    this.rules.push(rule);

    this.rules.sort(
      (a, b) =>
        (a.priority ?? 1000) -
        (b.priority ?? 1000)
    );

    return true;

  },

  unregister(id) {

    const index =
      this.rules.findIndex(
        rule => rule.id === id
      );

    if (index < 0) {
      return false;
    }

    this.rules.splice(index, 1);

    return true;

  },

  clear() {

    this.rules.length = 0;

  },

  /* =====================================================
     Accessors
  ===================================================== */

  getRules() {

    return Object.freeze(
      [...this.rules]
    );

  },

  has(id) {

    return this.rules.some(
      rule => rule.id === id
    );

  },

  count() {

    return this.rules.length;

  },

  list() {

    return this.getRules();

  },

  /* =====================================================
     Validation
  ===================================================== */

  validate() {

    const errors = [];

    for (const rule of this.rules) {

      if (!this.validateRule(rule)) {

        errors.push(
          rule?.id ??
          "unknown_rule"
        );

      }

    }

    return Object.freeze({

      valid:
        errors.length === 0,

      errors:
        Object.freeze(errors),

      warnings:
        Object.freeze([])

    });

  },

  validateRule(rule) {

    if (!rule) {
      return false;
    }

    if (
      typeof rule.id !== "string"
    ) {
      return false;
    }

    if (
      typeof rule.evaluate !==
      "function"
    ) {
      return false;
    }

    if (
      typeof rule.priority !==
      "number"
    ) {
      return false;
    }

    if (
      typeof rule.version !==
      "string"
    ) {
      return false;
    }

    return true;

  },

  /* =====================================================
     Default Result
  ===================================================== */

  defaultResult(
    diagnostics = []
  ) {

    return {

      matched: false,

      relationship:
        window.AriConversationRelationshipTypes.UNKNOWN,

      confidence: 0,

      evidence: [],

      matchedRule: null,

      diagnostics

    };

  }

};

window.Ari.conversationRuleRegistry =
  window.AriConversationRuleRegistry;