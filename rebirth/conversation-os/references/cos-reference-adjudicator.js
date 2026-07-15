// rebirth/conversation-os/references/cos-reference-adjudicator.js
// ARI Rebirth — Conversation Operating System Reference Adjudicator
//
// Purpose:
// Adjudicate a canonical reference-candidate set and determine whether the
// Conversation Operating System has sufficient structural evidence to bind
// the current turn to one or more prior turns.
//
// V1.0.0 — Canonical Structural Reference Adjudication
//
// Canonical flow:
//
// Reference Candidate Set
//      ↓
// Candidate Shape Validation
//      ↓
// Invalid Candidate Exclusion
//      ↓
// Explicit Evidence Separation
//      ↓
// Precedence Grouping
//      ↓
// Relationship Compatibility Analysis
//      ↓
// Tie and Conflict Detection
//      ↓
// Structural Resolution Decision
//      ↓
// Canonical Reference Adjudication Result
//
// Authority:
//
// This component is authoritative only for:
//
// - adjudicating already-constructed structural candidates,
// - enforcing deterministic precedence,
// - preferring explicit evidence over provisional evidence,
// - identifying compatible multi-target references,
// - identifying conflicting candidates,
// - identifying unresolved ties,
// - selecting authoritative structural target turn IDs,
// - preserving ambiguity when evidence is insufficient.
//
// Non-authority:
//
// This component must not:
//
// - interpret raw user language,
// - independently classify intent,
// - independently classify conversation function,
// - infer semantic meaning,
// - infer emotion,
// - infer safety severity,
// - invent reference candidates,
// - choose a response strategy,
// - generate a response,
// - convert weak evidence into false certainty,
// - use arbitrary probability scores as conversational truth.
//
// Architectural rule:
//
// The adjudicator may select only from candidates supplied by the canonical
// reference candidate builder.
//
// Candidate precedence represents structural reliability, not semantic truth.
//
// A lower numeric precedence value means stronger structural evidence.
//
// Explicit evidence may override provisional evidence.
//
// Candidates with equal authority that point to incompatible targets remain
// ambiguous unless a deterministic compatibility rule permits multi-target
// resolution.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.referenceAdjudicator
//
// CommonJS:
//
// module.exports = cosReferenceAdjudicator

(function initializeCosReferenceAdjudicator(globalScope) {
  "use strict";

  const root =
    globalScope ||
    (
      typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
          ? window
          : {}
    );

  root.Ari = root.Ari || {};
  root.Ari.Rebirth = root.Ari.Rebirth || {};
  root.Ari.Rebirth.ConversationOS =
    root.Ari.Rebirth.ConversationOS || {};

  const ConversationOS =
    root.Ari.Rebirth.ConversationOS;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-reference-adjudicator";

  const ADJUDICATION_RESULT_TYPE =
    "conversation_reference_adjudication_result";

  const ADJUDICATION_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "ambiguous",
    "unresolved"
  ]);

  const RESOLUTION_MODES = Object.freeze([
    "none",
    "single_target",
    "multi_target",
    "partial",
    "ambiguous",
    "unresolved"
  ]);

  const RELATIONSHIP_TYPES = Object.freeze([
    "parent",
    "reply",
    "source",
    "reference",
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target",
    "pending_interaction",
    "pending_question",
    "pending_choice",
    "active_artifact",
    "delivery_sequence",
    "active_thread_turn",
    "interrupted_thread_turn",
    "upstream_structural_candidate",
    "unknown"
  ]);

  const PRIMARY_RELATIONSHIP_PRIORITY = Object.freeze([
    "parent",
    "reply",
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target",
    "pending_question",
    "pending_choice",
    "pending_interaction",
    "delivery_sequence",
    "active_artifact",
    "source",
    "reference",
    "upstream_structural_candidate",
    "interrupted_thread_turn",
    "active_thread_turn",
    "unknown"
  ]);

  const SINGLE_TARGET_RELATIONSHIPS = Object.freeze([
    "parent",
    "reply",
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target",
    "pending_question",
    "pending_choice",
    "pending_interaction",
    "delivery_sequence",
    "active_artifact",
    "active_thread_turn",
    "interrupted_thread_turn"
  ]);

  const MULTI_TARGET_RELATIONSHIPS = Object.freeze([
    "source",
    "reference",
    "upstream_structural_candidate"
  ]);

  const SEMANTICALLY_EXCLUSIVE_RELATIONSHIPS = Object.freeze([
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosReferenceAdjudicatorError extends Error {
    constructor(
      code,
      message,
      {
        details = null,
        cause = null,
        recoverable = false
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS reference adjudicator error"
      );

      this.name =
        "CosReferenceAdjudicatorError";

      this.code =
        code ||
        "COS_REFERENCE_ADJUDICATOR_ERROR";

      this.details = details;
      this.cause = cause;

      this.recoverable =
        recoverable === true;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          CosReferenceAdjudicatorError
        );
      }
    }
  }

  /* =====================================================
     BASIC UTILITIES
  ===================================================== */

  function isObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function isString(value) {
    return typeof value === "string";
  }

  function isNonEmptyString(value) {
    return (
      isString(value) &&
      value.trim().length > 0
    );
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  function firstNonEmptyString(...values) {
    for (const value of values) {
      if (isNonEmptyString(value)) {
        return value.trim();
      }
    }

    return null;
  }

  function asArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    return [value];
  }

  function normalizeInteger(
    value,
    fallback = 0
  ) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.trunc(numeric);
  }

  function uniqueStrings(values = []) {
    const output = [];
    const seen = new Set();

    for (const value of asArray(values)) {
      if (!isNonEmptyString(value)) {
        continue;
      }

      const normalized =
        value.trim();

      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      output.push(normalized);
    }

    return output;
  }

  function safeClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Continue to JSON fallback.
      }
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }

  function deepFreeze(
    value,
    seen = new WeakSet()
  ) {
    if (
      value === null ||
      typeof value !== "object"
    ) {
      return value;
    }

    if (seen.has(value)) {
      return value;
    }

    seen.add(value);

    for (
      const key of Reflect.ownKeys(value)
    ) {
      const child =
        value[key];

      if (
        child !== null &&
        typeof child === "object"
      ) {
        deepFreeze(
          child,
          seen
        );
      }
    }

    return Object.freeze(value);
  }

  function freezeClone(value) {
    return deepFreeze(
      safeClone(value)
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeAdjudicatorInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {
          candidateSet: rawInput
        };

    const candidateSet =
      firstDefined(
        source.candidateSet,
        source.candidate_set,
        source.referenceCandidates,
        source.reference