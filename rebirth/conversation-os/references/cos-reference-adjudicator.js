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
        source.reference_candidates,
        source
      );

    return {
      candidateSet:
        isObject(candidateSet)
          ? candidateSet
          : {},

      currentTurn:
        isObject(source.currentTurn)
          ? source.currentTurn
          : {},

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          candidateSet &&
            candidateSet.conversationId,
          candidateSet &&
            candidateSet.conversation_id
        ) || null,

      options:
        isObject(source.options)
          ? safeClone(source.options)
          : {}
    };
  }

  /* =====================================================
     CANDIDATE NORMALIZATION
  ===================================================== */

  function normalizeCandidate(
    rawCandidate
  ) {
    if (!isObject(rawCandidate)) {
      return null;
    }

    const turnId =
      firstNonEmptyString(
        rawCandidate.turnId,
        rawCandidate.turn_id
      );

    if (!turnId) {
      return null;
    }

    const relationshipTypes =
      uniqueStrings(
        firstDefined(
          rawCandidate.relationshipTypes,
          rawCandidate.relationship_types,
          rawCandidate.relationshipType,
          rawCandidate.relationship_type,
          []
        )
      ).map(
        (relationshipType) =>
          RELATIONSHIP_TYPES.includes(
            relationshipType
          )
            ? relationshipType
            : "unknown"
      );

    const evidenceSources =
      uniqueStrings(
        firstDefined(
          rawCandidate.evidenceSources,
          rawCandidate.evidence_sources,
          rawCandidate.evidenceSource,
          rawCandidate.evidence_source,
          []
        )
      );

    const invalidReasons =
      uniqueStrings(
        firstDefined(
          rawCandidate.invalidReasons,
          rawCandidate.invalid_reasons,
          rawCandidate.invalidReason,
          rawCandidate.invalid_reason,
          []
        )
      );

    const threadIds =
      uniqueStrings(
        firstDefined(
          rawCandidate.threadIds,
          rawCandidate.thread_ids,
          rawCandidate.threadId,
          rawCandidate.thread_id,
          []
        )
      );

    return {
      ...safeClone(rawCandidate),

      turnId,

      precedence:
        Math.max(
          0,
          normalizeInteger(
            rawCandidate.precedence,
            1000
          )
        ),

      relationshipTypes:
        relationshipTypes.length > 0
          ? relationshipTypes
          : ["unknown"],

      evidenceSources,

      fields:
        uniqueStrings(
          firstDefined(
            rawCandidate.fields,
            rawCandidate.field,
            []
          )
        ),

      invalidReasons,

      threadIds,

      provisional:
        rawCandidate.provisional === true,

      valid:
        rawCandidate.valid === true
    };
  }

  function readAllCandidates(
    candidateSet
  ) {
    const candidates =
      Array.isArray(
        candidateSet.candidates
      )
        ? candidateSet.candidates
        : [];

    return candidates
      .map(normalizeCandidate)
      .filter(Boolean);
  }

  /* =====================================================
     CANDIDATE CLASSIFICATION
  ===================================================== */

  function isExplicitCandidate(
    candidate
  ) {
    return (
      candidate.valid === true &&
      candidate.provisional !== true
    );
  }

  function isProvisionalCandidate(
    candidate
  ) {
    return (
      candidate.valid === true &&
      candidate.provisional === true
    );
  }

  function hasRelationship(
    candidate,
    relationshipType
  ) {
    return (
      Array.isArray(
        candidate.relationshipTypes
      ) &&
      candidate.relationshipTypes.includes(
        relationshipType
      )
    );
  }

  function hasAnyRelationship(
    candidate,
    relationshipTypes
  ) {
    return relationshipTypes.some(
      (relationshipType) =>
        hasRelationship(
          candidate,
          relationshipType
        )
    );
  }

  function readPrimaryRelationship(
    candidate
  ) {
    for (
      const relationshipType of
        PRIMARY_RELATIONSHIP_PRIORITY
    ) {
      if (
        hasRelationship(
          candidate,
          relationshipType
        )
      ) {
        return relationshipType;
      }
    }

    return "unknown";
  }

  function isSingleTargetCandidate(
    candidate
  ) {
    return hasAnyRelationship(
      candidate,
      SINGLE_TARGET_RELATIONSHIPS
    );
  }

  function isMultiTargetCandidate(
    candidate
  ) {
    return hasAnyRelationship(
      candidate,
      MULTI_TARGET_RELATIONSHIPS
    );
  }

  function isSemanticallyExclusiveCandidate(
    candidate
  ) {
    return hasAnyRelationship(
      candidate,
      SEMANTICALLY_EXCLUSIVE_RELATIONSHIPS
    );
  }

  /* =====================================================
     PRECEDENCE GROUPING
  ===================================================== */

  function getStrongestPrecedence(
    candidates
  ) {
    if (
      !Array.isArray(candidates) ||
      candidates.length === 0
    ) {
      return null;
    }

    return Math.min(
      ...candidates.map(
        (candidate) =>
          candidate.precedence
      )
    );
  }

  function selectPrecedenceGroup(
    candidates,
    precedence
  ) {
    if (precedence === null) {
      return [];
    }

    return candidates.filter(
      (candidate) =>
        candidate.precedence ===
        precedence
    );
  }

  /* =====================================================
     COMPATIBILITY ANALYSIS
  ===================================================== */

  function readRelationshipSignature(
    candidate
  ) {
    return [...candidate.relationshipTypes]
      .sort()
      .join("|");
  }

  function haveSameThread(
    candidates
  ) {
    const threadIds =
      uniqueStrings(
        candidates.flatMap(
          (candidate) =>
            candidate.threadIds
        )
      );

    return threadIds.length <= 1;
  }

  function containsMultipleExclusiveTypes(
    candidates
  ) {
    const exclusiveTypes =
      uniqueStrings(
        candidates.flatMap(
          (candidate) =>
            candidate.relationshipTypes.filter(
              (relationshipType) =>
                SEMANTICALLY_EXCLUSIVE_RELATIONSHIPS.includes(
                  relationshipType
                )
            )
        )
      );

    return exclusiveTypes.length > 1;
  }

  function containsConflictingSingleTargets(
    candidates
  ) {
    const singleTargetCandidates =
      candidates.filter(
        isSingleTargetCandidate
      );

    const distinctTurnIds =
      uniqueStrings(
        singleTargetCandidates.map(
          (candidate) =>
            candidate.turnId
        )
      );

    return distinctTurnIds.length > 1;
  }

  function canResolveAsMultiTarget(
    candidates
  ) {
    if (candidates.length <= 1) {
      return false;
    }

    if (
      candidates.some(
        isSingleTargetCandidate
      )
    ) {
      return false;
    }

    if (
      candidates.some(
        (candidate) =>
          !isMultiTargetCandidate(
            candidate
          )
      )
    ) {
      return false;
    }

    return true;
  }

  function analyzeCompatibility(
    candidates
  ) {
    const distinctTurnIds =
      uniqueStrings(
        candidates.map(
          (candidate) =>
            candidate.turnId
        )
      );

    const relationshipSignatures =
      uniqueStrings(
        candidates.map(
          readRelationshipSignature
        )
      );

    const sameThread =
      haveSameThread(candidates);

    const multipleExclusiveTypes =
      containsMultipleExclusiveTypes(
        candidates
      );

    const conflictingSingleTargets =
      containsConflictingSingleTargets(
        candidates
      );

    const multiTargetCompatible =
      canResolveAsMultiTarget(
        candidates
      );

    return {
      candidateCount:
        candidates.length,

      distinctTurnIds,

      relationshipSignatures,

      sameThread,

      multipleExclusiveTypes,

      conflictingSingleTargets,

      multiTargetCompatible,

      compatible:
        candidates.length <= 1 ||
        (
          multiTargetCompatible &&
          !multipleExclusiveTypes
        )
    };
  }

  /* =====================================================
     PRIMARY TARGET SELECTION
  ===================================================== */

  function comparePrimaryCandidates(
    left,
    right
  ) {
    const leftRelationship =
      readPrimaryRelationship(left);

    const rightRelationship =
      readPrimaryRelationship(right);

    const leftIndex =
      PRIMARY_RELATIONSHIP_PRIORITY.indexOf(
        leftRelationship
      );

    const rightIndex =
      PRIMARY_RELATIONSHIP_PRIORITY.indexOf(
        rightRelationship
      );

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    if (
      left.provisional !==
      right.provisional
    ) {
      return left.provisional
        ? 1
        : -1;
    }

    return left.turnId.localeCompare(
      right.turnId
    );
  }

  function selectPrimaryCandidate(
    candidates
  ) {
    if (
      !Array.isArray(candidates) ||
      candidates.length === 0
    ) {
      return null;
    }

    return [...candidates]
      .sort(
        comparePrimaryCandidates
      )[0];
  }

  /* =====================================================
     ADJUDICATION DECISION
  ===================================================== */

  function createNoReferenceDecision() {
    return {
      status: "not_required",
      mode: "none",

      selectedCandidates: [],

      rejectedCandidates: [],

      ambiguousCandidates: [],

      primaryCandidate: null,

      reason:
        "no_valid_reference_candidates"
    };
  }

  function adjudicateExplicitCandidates(
    explicitCandidates
  ) {
    const strongestPrecedence =
      getStrongestPrecedence(
        explicitCandidates
      );

    const strongestGroup =
      selectPrecedenceGroup(
        explicitCandidates,
        strongestPrecedence
      );

    const lowerPriority =
      explicitCandidates.filter(
        (candidate) =>
          candidate.precedence !==
          strongestPrecedence
      );

    const compatibility =
      analyzeCompatibility(
        strongestGroup
      );

    if (
      strongestGroup.length === 1
    ) {
      return {
        status: "resolved",
        mode: "single_target",

        selectedCandidates:
          strongestGroup,

        rejectedCandidates:
          lowerPriority,

        ambiguousCandidates: [],

        primaryCandidate:
          strongestGroup[0],

        reason:
          "strongest_explicit_candidate"
      };
    }

    if (
      compatibility.multiTargetCompatible
    ) {
      return {
        status: "resolved",
        mode: "multi_target",

        selectedCandidates:
          strongestGroup,

        rejectedCandidates:
          lowerPriority,

        ambiguousCandidates: [],

        primaryCandidate:
          selectPrimaryCandidate(
            strongestGroup
          ),

        reason:
          "compatible_explicit_multi_target"
      };
    }

    return {
      status: "ambiguous",
      mode: "ambiguous",

      selectedCandidates: [],

      rejectedCandidates:
        lowerPriority,

      ambiguousCandidates:
        strongestGroup,

      primaryCandidate: null,

      reason:
        compatibility
          .conflictingSingleTargets
          ? "conflicting_explicit_single_targets"
          : "equally_authoritative_explicit_candidates"
    };
  }

  function adjudicateProvisionalCandidates(
    provisionalCandidates
  ) {
    const strongestPrecedence =
      getStrongestPrecedence(
        provisionalCandidates
      );

    const strongestGroup =
      selectPrecedenceGroup(
        provisionalCandidates,
        strongestPrecedence
      );

    const lowerPriority =
      provisionalCandidates.filter(
        (candidate) =>
          candidate.precedence !==
          strongestPrecedence
      );

    const compatibility =
      analyzeCompatibility(
        strongestGroup
      );

    if (
      strongestGroup.length === 1
    ) {
      return {
        status: "resolved",
        mode: "single_target",

        selectedCandidates:
          strongestGroup,

        rejectedCandidates:
          lowerPriority,

        ambiguousCandidates: [],

        primaryCandidate:
          strongestGroup[0],

        reason:
          "single_strongest_provisional_candidate"
      };
    }

    if (
      compatibility.multiTargetCompatible
    ) {
      return {
        status: "resolved",
        mode: "multi_target",

        selectedCandidates:
          strongestGroup,

        rejectedCandidates:
          lowerPriority,

        ambiguousCandidates: [],

        primaryCandidate:
          selectPrimaryCandidate(
            strongestGroup
          ),

        reason:
          "compatible_provisional_multi_target"
      };
    }

    return {
      status: "ambiguous",
      mode: "ambiguous",

      selectedCandidates: [],

      rejectedCandidates:
        lowerPriority,

      ambiguousCandidates:
        strongestGroup,

      primaryCandidate: null,

      reason:
        "equally_authoritative_provisional_candidates"
    };
  }

  function adjudicateCandidates(
    candidates
  ) {
    const validCandidates =
      candidates.filter(
        (candidate) =>
          candidate.valid === true
      );

    const invalidCandidates =
      candidates.filter(
        (candidate) =>
          candidate.valid !== true
      );

    if (validCandidates.length === 0) {
      if (invalidCandidates.length === 0) {
        return createNoReferenceDecision();
      }

      return {
        status: "unresolved",
        mode: "unresolved",

        selectedCandidates: [],

        rejectedCandidates: [],

        ambiguousCandidates: [],

        primaryCandidate: null,

        reason:
          "all_candidates_invalid"
      };
    }

    const explicitCandidates =
      validCandidates.filter(
        isExplicitCandidate
      );

    const provisionalCandidates =
      validCandidates.filter(
        isProvisionalCandidate
      );

    if (explicitCandidates.length > 0) {
      const decision =
        adjudicateExplicitCandidates(
          explicitCandidates
        );

      return {
        ...decision,

        rejectedCandidates: [
          ...decision.rejectedCandidates,
          ...provisionalCandidates
        ]
      };
    }

    return adjudicateProvisionalCandidates(
      provisionalCandidates
    );
  }

  /* =====================================================
     RESULT NORMALIZATION
  ===================================================== */

  function sanitizeCandidateForResult(
    candidate
  ) {
    if (!candidate) {
      return null;
    }

    return {
      turnId:
        candidate.turnId,

      precedence:
        candidate.precedence,

      relationshipTypes:
        [...candidate.relationshipTypes],

      evidenceSources:
        [...candidate.evidenceSources],

      fields:
        [...candidate.fields],

      threadIds:
        [...candidate.threadIds],

      provisional:
        candidate.provisional,

      valid:
        candidate.valid
    };
  }

  function determineParentTurnId(
    primaryCandidate
  ) {
    return primaryCandidate
      ? primaryCandidate.turnId
      : null;
  }

  function determineResolvedTurnIds(
    selectedCandidates
  ) {
    return uniqueStrings(
      selectedCandidates.map(
        (candidate) =>
          candidate.turnId
      )
    );
  }

  function determineRelationshipTypes(
    selectedCandidates
  ) {
    return uniqueStrings(
      selectedCandidates.flatMap(
        (candidate) =>
          candidate.relationshipTypes
      )
    );
  }

  function determineEvidenceSources(
    selectedCandidates
  ) {
    return uniqueStrings(
      selectedCandidates.flatMap(
        (candidate) =>
          candidate.evidenceSources
      )
    );
  }

  function determineThreadIds(
    selectedCandidates
  ) {
    return uniqueStrings(
      selectedCandidates.flatMap(
        (candidate) =>
          candidate.threadIds
      )
    );
  }

  /* =====================================================
     RESULT VALIDATION
  ===================================================== */

  function validateAdjudicationResult(
    result
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(result)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_REFERENCE_ADJUDICATION_RESULT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      result.adjudicationResultType !==
        ADJUDICATION_RESULT_TYPE
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_RESULT_TYPE_INVALID"
      });
    }

    if (
      !ADJUDICATION_STATUSES.includes(
        result.status
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_STATUS_INVALID",

        status:
          result.status
      });
    }

    if (
      !RESOLUTION_MODES.includes(
        result.resolutionMode
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_MODE_INVALID",

        resolutionMode:
          result.resolutionMode
      });
    }

    if (
      !Array.isArray(
        result.resolvedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_RESOLVED_IDS_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.selectedCandidates
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_SELECTED_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.ambiguousCandidates
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_AMBIGUOUS_INVALID"
      });
    }

    if (
      result.status === "resolved" &&
      result.resolvedTurnIds.length === 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_RESOLVED_WITHOUT_TARGETS"
      });
    }

    if (
      result.status === "not_required" &&
      result.resolvedTurnIds.length > 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_NOT_REQUIRED_WITH_TARGETS"
      });
    }

    if (
      result.status === "ambiguous" &&
      result.ambiguousCandidates.length < 2
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_AMBIGUOUS_COUNT_INVALID"
      });
    }

    if (
      result.parentTurnId &&
      !result.resolvedTurnIds.includes(
        result.parentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_PARENT_NOT_RESOLVED",

        parentTurnId:
          result.parentTurnId
      });
    }

    if (
      result.resolutionMode ===
        "single_target" &&
      result.resolvedTurnIds.length !== 1
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_SINGLE_TARGET_COUNT_INVALID"
      });
    }

    if (
      result.resolutionMode ===
        "multi_target" &&
      result.resolvedTurnIds.length < 2
    ) {
      errors.push({
        code:
          "COS_REFERENCE_ADJUDICATION_MULTI_TARGET_COUNT_INVALID"
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  /* =====================================================
     PUBLIC ADJUDICATION
  ===================================================== */

  function adjudicate(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeAdjudicatorInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const candidateSet =
      input.candidateSet;

    const currentTurnId =
      firstNonEmptyString(
        candidateSet.currentTurnId,
        candidateSet.current_turn_id,
        input.currentTurn.turnId,
        input.currentTurn.turn_id
      );

    if (!currentTurnId) {
      throw new CosReferenceAdjudicatorError(
        "COS_REFERENCE_ADJUDICATION_CURRENT_TURN_ID_MISSING",
        "Reference adjudication requires a current-turn ID."
      );
    }

    const candidates =
      readAllCandidates(
        candidateSet
      );

    const decision =
      adjudicateCandidates(
        candidates
      );

    const selectedCandidates =
      decision.selectedCandidates || [];

    const primaryCandidate =
      decision.primaryCandidate ||
      selectPrimaryCandidate(
        selectedCandidates
      );

    const resolvedTurnIds =
      determineResolvedTurnIds(
        selectedCandidates
      );

    const relationshipTypes =
      determineRelationshipTypes(
        selectedCandidates
      );

    const evidenceSources =
      determineEvidenceSources(
        selectedCandidates
      );

    const threadIds =
      determineThreadIds(
        selectedCandidates
      );

    const invalidCandidates =
      candidates.filter(
        (candidate) =>
          candidate.valid !== true
      );

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      adjudicationResultType:
        ADJUDICATION_RESULT_TYPE,

      conversationId:
        input.conversationId,

      currentTurnId,

      status:
        decision.status,

      resolutionMode:
        decision.mode,

      required:
        candidates.length > 0,

      resolved:
        decision.status ===
        "resolved",

      ambiguous:
        decision.status ===
        "ambiguous",

      unresolved:
        decision.status ===
          "unresolved" ||
        decision.status ===
          "ambiguous",

      primaryTurnId:
        primaryCandidate
          ? primaryCandidate.turnId
          : null,

      parentTurnId:
        determineParentTurnId(
          primaryCandidate
        ),

      resolvedTurnIds,

      relationshipTypes,

      evidenceSources,

      threadIds,

      selectedCandidates:
        selectedCandidates.map(
          sanitizeCandidateForResult
        ),

      rejectedCandidates:
        (
          decision.rejectedCandidates ||
          []
        ).map(
          sanitizeCandidateForResult
        ),

      ambiguousCandidates:
        (
          decision.ambiguousCandidates ||
          []
        ).map(
          sanitizeCandidateForResult
        ),

      invalidCandidates:
        invalidCandidates.map(
          sanitizeCandidateForResult
        ),

      decisionReason:
        decision.reason,

      candidateCount:
        candidates.length,

      selectedCandidateCount:
        selectedCandidates.length,

      rejectedCandidateCount:
        (
          decision.rejectedCandidates ||
          []
        ).length,

      ambiguousCandidateCount:
        (
          decision.ambiguousCandidates ||
          []
        ).length,

      invalidCandidateCount:
        invalidCandidates.length,

      adjudicatedAt:
        nowIso()
    };

    const validation =
      validateAdjudicationResult(
        result
      );

    if (!validation.valid) {
      throw new CosReferenceAdjudicatorError(
        "COS_REFERENCE_ADJUDICATION_RESULT_INVALID",
        "Reference adjudication result failed validation.",
        {
          details:
            validation
        }
      );
    }

    return freeze
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosReferenceAdjudicator = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    adjudicationResultType:
      ADJUDICATION_RESULT_TYPE,

    adjudicationStatuses:
      ADJUDICATION_STATUSES,

    resolutionModes:
      RESOLUTION_MODES,

    relationshipTypes:
      RELATIONSHIP_TYPES,

    primaryRelationshipPriority:
      PRIMARY_RELATIONSHIP_PRIORITY,

    singleTargetRelationships:
      SINGLE_TARGET_RELATIONSHIPS,

    multiTargetRelationships:
      MULTI_TARGET_RELATIONSHIPS,

    CosReferenceAdjudicatorError,

    adjudicate,

    resolve:
      adjudicate,

    decide:
      adjudicate,

    run:
      adjudicate,

    validate:
      validateAdjudicationResult,

    normalizeInput:
      normalizeAdjudicatorInput,

    analyzeCompatibility,

    selectPrimaryCandidate
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS
    .referenceAdjudicator =
    cosReferenceAdjudicator;

  ConversationOS
    .cosReferenceAdjudicator =
    cosReferenceAdjudicator;

  root.AriCosReferenceAdjudicator =
    cosReferenceAdjudicator;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosReferenceAdjudicator;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);