// rebirth/conversation-os/validation/cos-placement-validator.js
// ARI Rebirth — Conversation Operating System Placement Validator
//
// Purpose:
// Validate the structural integrity of a Conversation Operating System
// placement before the authoritative placement packet is built.
//
// V1.0.0 — Canonical Placement Integrity Validation
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Structural Reference Resolution
//      ↓
// Conversation Placement
//      ↓
// Thread-State Transition
//      ↓
// Identity Validation
//      ↓
// Reference Consistency Validation
//      ↓
// Thread Binding Validation
//      ↓
// Placement-Type Invariant Validation
//      ↓
// State Transition Validation
//      ↓
// Canonical Validation Result
//
// Authority:
//
// This component is authoritative only for:
//
// - validating placement structure,
// - validating turn identity consistency,
// - validating parent and source-turn existence,
// - validating reference-resolution consistency,
// - validating placement-type invariants,
// - validating thread binding,
// - validating the applied state transition,
// - rejecting structurally contradictory placement results.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret the current turn,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve natural-language references,
// - choose a placement type,
// - choose a thread,
// - modify state,
// - repair placement by guessing,
// - plan or generate a response.
//
// Architectural rule:
//
// The Placement Validator verifies an already-determined placement.
//
// It may report errors and warnings.
// It may not silently rewrite the authoritative placement.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.placementValidator

(function initializeCosPlacementValidator(globalScope) {
  "use strict";

  const root =
    globalScope ||
    (typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
        ? window
        : {});

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
    "cos-placement-validator";

  const PLACEMENT_TYPES = Object.freeze([
    "new_thread",
    "continue_thread",
    "resume_thread",
    "branch_from_turn",
    "answer_to_turn",
    "clarification_of_turn",
    "correction_of_turn",
    "interruption",
    "return_from_interruption",
    "unresolved_placement"
  ]);

  const REFERENCE_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "unresolved"
  ]);

  const TARGET_REQUIRED_PLACEMENTS =
    Object.freeze([
      "branch_from_turn",
      "answer_to_turn",
      "clarification_of_turn",
      "correction_of_turn"
    ]);

  const NEW_THREAD_PLACEMENTS =
    Object.freeze([
      "new_thread",
      "branch_from_turn",
      "interruption"
    ]);

  const EXISTING_THREAD_PLACEMENTS =
    Object.freeze([
      "continue_thread",
      "resume_thread",
      "answer_to_turn",
      "clarification_of_turn",
      "correction_of_turn",
      "return_from_interruption"
    ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosPlacementValidatorError extends Error {
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
        "COS placement validator error"
      );

      this.name =
        "CosPlacementValidatorError";

      this.code =
        code ||
        "COS_PLACEMENT_VALIDATOR_ERROR";

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
          CosPlacementValidatorError
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

  function uniqueStrings(values = []) {
    const output = [];
    const seen = new Set();

    for (const value of asArray(values)) {
      if (!isNonEmptyString(value)) {
        continue;
      }

      const normalized = value.trim();

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
      const child = value[key];

      if (
        child !== null &&
        typeof child === "object"
      ) {
        deepFreeze(child, seen);
      }
    }

    return Object.freeze(value);
  }

  function freezeClone(value) {
    return deepFreeze(safeClone(value));
  }

  function hasOwn(
    object,
    property
  ) {
    return Object.prototype.hasOwnProperty.call(
      object,
      property
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function pushIssue(
    collection,
    code,
    details = {}
  ) {
    collection.push({
      code,
      ...safeClone(details)
    });
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeValidationInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {};

    return {
      state:
        isObject(source.state)
          ? source.state
          : {},

      historyIndex:
        isObject(source.historyIndex)
          ? source.historyIndex
          : {},

      currentTurn:
        isObject(source.currentTurn)
          ? source.currentTurn
          : {},

      referenceResolution:
        isObject(
          source.referenceResolution
        )
          ? source.referenceResolution
          : {},

      placement:
        isObject(source.placement)
          ? source.placement
          : {},

      transition:
        isObject(source.transition)
          ? source.transition
          : {},

      options:
        isObject(source.options)
          ? safeClone(source.options)
          : {}
    };
  }

  /* =====================================================
     FIELD READERS
  ===================================================== */

  function readTurnId(turn) {
    return firstNonEmptyString(
      turn.turnId,
      turn.turn_id,
      turn.id,
      turn.messageId,
      turn.message_id
    );
  }

  function readPlacementType(placement) {
    return firstNonEmptyString(
      placement.type,
      placement.placementType,
      placement.placement_type
    );
  }

  function readPlacementThreadId(placement) {
    return firstNonEmptyString(
      placement.threadId,
      placement.thread_id
    );
  }

  function readPlacementParentTurnId(
    placement
  ) {
    return firstNonEmptyString(
      placement.parentTurnId,
      placement.parent_turn_id
    );
  }

  function readPlacementSourceTurnIds(
    placement
  ) {
    return uniqueStrings(
      firstDefined(
        placement.sourceTurnIds,
        placement.source_turn_ids,
        []
      )
    );
  }

  function readReferenceStatus(
    referenceResolution
  ) {
    return firstNonEmptyString(
      referenceResolution.status,
      referenceResolution
        .resolutionStatus,
      referenceResolution
        .resolution_status
    );
  }

  function readResolvedTurnIds(
    referenceResolution
  ) {
    return uniqueStrings(
      firstDefined(
        referenceResolution
          .resolvedTurnIds,
        referenceResolution
          .resolved_turn_ids,
        []
      )
    );
  }

  function readUnresolvedReferences(
    referenceResolution
  ) {
    return asArray(
      firstDefined(
        referenceResolution
          .unresolvedReferences,
        referenceResolution
          .unresolved_references,
        []
      )
    );
  }

  function readReferenceParentTurnId(
    referenceResolution
  ) {
    return firstNonEmptyString(
      referenceResolution.parentTurnId,
      referenceResolution.parent_turn_id,
      referenceResolution.primaryTurnId,
      referenceResolution.primary_turn_id
    );
  }

  function readTransitionApplied(transition) {
    return typeof transition.applied ===
      "boolean"
      ? transition.applied
      : null;
  }

  function readTransitionThreadId(
    transition
  ) {
    return firstNonEmptyString(
      transition.threadId,
      transition.thread_id
    );
  }

  function readTransitionTurnId(
    transition
  ) {
    return firstNonEmptyString(
      transition.turnId,
      transition.turn_id
    );
  }

  function readTransitionPlacementType(
    transition
  ) {
    return firstNonEmptyString(
      transition.placementType,
      transition.placement_type
    );
  }

  /* =====================================================
     LOOKUPS
  ===================================================== */

  function readIndexedTurn(
    historyIndex,
    turnId
  ) {
    if (
      !isObject(historyIndex) ||
      !isObject(historyIndex.byTurnId) ||
      !isNonEmptyString(turnId)
    ) {
      return null;
    }

    const turn =
      historyIndex.byTurnId[turnId];

    return isObject(turn)
      ? turn
      : null;
  }

  function readStateTurn(
    state,
    turnId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.turns) ||
      !isNonEmptyString(turnId)
    ) {
      return null;
    }

    const turn =
      state.turns[turnId];

    return isObject(turn)
      ? turn
      : null;
  }

  function readStateThread(
    state,
    threadId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.threads) ||
      !isNonEmptyString(threadId)
    ) {
      return null;
    }

    const thread =
      state.threads[threadId];

    return isObject(thread)
      ? thread
      : null;
  }

  function turnExists(
    historyIndex,
    state,
    turnId
  ) {
    return Boolean(
      readIndexedTurn(
        historyIndex,
        turnId
      ) ||
      readStateTurn(
        state,
        turnId
      )
    );
  }

  function deriveTurnThreadId(
    historyIndex,
    state,
    turnId
  ) {
    const indexedTurn =
      readIndexedTurn(
        historyIndex,
        turnId
      );

    const stateTurn =
      readStateTurn(
        state,
        turnId
      );

    return firstNonEmptyString(
      indexedTurn &&
        indexedTurn.threadId,

      indexedTurn &&
        indexedTurn.thread_id,

      stateTurn &&
        stateTurn.threadId,

      stateTurn &&
        stateTurn.thread_id
    );
  }

  /* =====================================================
     BASE SHAPE VALIDATION
  ===================================================== */

  function validateBaseShapes(
    input,
    errors
  ) {
    if (!isObject(input.currentTurn)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_CURRENT_TURN_INVALID"
      );
    }

    if (
      !isObject(
        input.referenceResolution
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_REFERENCE_RESULT_INVALID"
      );
    }

    if (!isObject(input.placement)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PLACEMENT_INVALID"
      );
    }

    if (!isObject(input.state)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_STATE_INVALID"
      );
    }

    if (!isObject(input.transition)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_INVALID"
      );
    }
  }

  /* =====================================================
     IDENTITY VALIDATION
  ===================================================== */

  function validateIdentityConsistency(
    input,
    errors
  ) {
    const currentTurnId =
      readTurnId(input.currentTurn);

    const placementCurrentTurnId =
      firstNonEmptyString(
        input.placement.currentTurnId,
        input.placement.current_turn_id
      );

    const transitionTurnId =
      readTransitionTurnId(
        input.transition
      );

    if (!currentTurnId) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_CURRENT_TURN_ID_MISSING"
      );

      return;
    }

    if (
      placementCurrentTurnId &&
      placementCurrentTurnId !==
        currentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PLACEMENT_TURN_MISMATCH",
        {
          currentTurnId,
          placementCurrentTurnId
        }
      );
    }

    if (
      transitionTurnId &&
      transitionTurnId !== currentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_TURN_MISMATCH",
        {
          currentTurnId,
          transitionTurnId
        }
      );
    }
  }

  /* =====================================================
     PLACEMENT TYPE VALIDATION
  ===================================================== */

  function validatePlacementType(
    input,
    errors,
    warnings
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    if (
      !PLACEMENT_TYPES.includes(
        placementType
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TYPE_INVALID",
        {
          placementType
        }
      );

      return;
    }

    const transitionPlacementType =
      readTransitionPlacementType(
        input.transition
      );

    if (
      transitionPlacementType &&
      transitionPlacementType !==
        placementType
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_TYPE_MISMATCH",
        {
          placementType,
          transitionPlacementType
        }
      );
    }

    if (
      placementType ===
        "unresolved_placement" &&
      readTransitionApplied(
        input.transition
      ) === true
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_UNRESOLVED_TRANSITION_APPLIED"
      );
    }

    if (
      placementType !==
        "unresolved_placement" &&
      readTransitionApplied(
        input.transition
      ) === false
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_RESOLVED_TRANSITION_NOT_APPLIED",
        {
          placementType
        }
      );
    }

    if (
      readTransitionApplied(
        input.transition
      ) === null
    ) {
      pushIssue(
        warnings,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_APPLIED_UNDECLARED"
      );
    }
  }

  /* =====================================================
     REFERENCE STATUS VALIDATION
  ===================================================== */

  function validateReferenceStatus(
    input,
    errors
  ) {
    const status =
      readReferenceStatus(
        input.referenceResolution
      );

    const resolvedTurnIds =
      readResolvedTurnIds(
        input.referenceResolution
      );

    const unresolvedReferences =
      readUnresolvedReferences(
        input.referenceResolution
      );

    if (
      !REFERENCE_STATUSES.includes(
        status
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_REFERENCE_STATUS_INVALID",
        {
          status
        }
      );

      return;
    }

    if (
      status === "not_required" &&
      (
        resolvedTurnIds.length > 0 ||
        unresolvedReferences.length > 0
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_NOT_REQUIRED_REFERENCE_CONTRADICTION"
      );
    }

    if (
      status === "resolved" &&
      unresolvedReferences.length > 0
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_RESOLVED_REFERENCE_HAS_UNRESOLVED_ITEMS"
      );
    }

    if (
      status === "unresolved" &&
      resolvedTurnIds.length > 0
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_UNRESOLVED_REFERENCE_HAS_RESOLVED_IDS"
      );
    }

    if (
      status === "partially_resolved" &&
      (
        resolvedTurnIds.length === 0 ||
        unresolvedReferences.length === 0
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PARTIAL_REFERENCE_COUNTS_INVALID"
      );
    }
  }

  /* =====================================================
     REFERENCE AND PLACEMENT CONSISTENCY
  ===================================================== */

  function validateReferencePlacementConsistency(
    input,
    errors,
    warnings
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    const referenceStatus =
      readReferenceStatus(
        input.referenceResolution
      );

    const resolvedTurnIds =
      readResolvedTurnIds(
        input.referenceResolution
      );

    const placementSourceTurnIds =
      readPlacementSourceTurnIds(
        input.placement
      );

    const placementParentTurnId =
      readPlacementParentTurnId(
        input.placement
      );

    const referenceParentTurnId =
      readReferenceParentTurnId(
        input.referenceResolution
      );

    if (
      (
        referenceStatus ===
          "unresolved" ||
        referenceStatus ===
          "partially_resolved"
      ) &&
      placementType !==
        "unresolved_placement"
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_UNRESOLVED_REFERENCE_REQUIRES_UNRESOLVED_PLACEMENT",
        {
          referenceStatus,
          placementType
        }
      );
    }

    for (
      const sourceTurnId of
        placementSourceTurnIds
    ) {
      if (
        !resolvedTurnIds.includes(
          sourceTurnId
        )
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_SOURCE_NOT_REFERENCE_RESOLVED",
          {
            sourceTurnId
          }
        );
      }
    }

    if (
      placementParentTurnId &&
      resolvedTurnIds.length > 0 &&
      !resolvedTurnIds.includes(
        placementParentTurnId
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PARENT_NOT_REFERENCE_RESOLVED",
        {
          placementParentTurnId
        }
      );
    }

    if (
      referenceParentTurnId &&
      placementParentTurnId &&
      referenceParentTurnId !==
        placementParentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_REFERENCE_PARENT_MISMATCH",
        {
          referenceParentTurnId,
          placementParentTurnId
        }
      );
    }

    if (
      referenceStatus ===
        "not_required" &&
      placementSourceTurnIds.length > 0
    ) {
      pushIssue(
        warnings,
        "COS_PLACEMENT_VALIDATOR_PLACEMENT_HAS_SOURCES_WITHOUT_REFERENCE_REQUIREMENT"
      );
    }
  }

  /* =====================================================
     TURN EXISTENCE VALIDATION
  ===================================================== */

  function validateReferencedTurnExistence(
    input,
    errors
  ) {
    const currentTurnId =
      readTurnId(input.currentTurn);

    const parentTurnId =
      readPlacementParentTurnId(
        input.placement
      );

    const sourceTurnIds =
      readPlacementSourceTurnIds(
        input.placement
      );

    if (
      parentTurnId &&
      parentTurnId === currentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_SELF_PARENT",
        {
          currentTurnId
        }
      );
    }

    if (
      parentTurnId &&
      !turnExists(
        input.historyIndex,
        input.state,
        parentTurnId
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PARENT_UNKNOWN",
        {
          parentTurnId
        }
      );
    }

    for (const sourceTurnId of sourceTurnIds) {
      if (
        sourceTurnId === currentTurnId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_SELF_SOURCE",
          {
            sourceTurnId
          }
        );

        continue;
      }

      if (
        !turnExists(
          input.historyIndex,
          input.state,
          sourceTurnId
        )
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_SOURCE_UNKNOWN",
          {
            sourceTurnId
          }
        );
      }
    }
  }

  /* =====================================================
     PLACEMENT INVARIANTS
  ===================================================== */

  function validatePlacementInvariants(
    input,
    errors,
    warnings
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    const threadId =
      readPlacementThreadId(
        input.placement
      );

    const parentTurnId =
      readPlacementParentTurnId(
        input.placement
      );

    const originThreadId =
      firstNonEmptyString(
        input.placement.originThreadId,
        input.placement.origin_thread_id
      );

    if (
      placementType !==
        "unresolved_placement" &&
      !threadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_THREAD_REQUIRED",
        {
          placementType
        }
      );
    }

    if (
      placementType ===
        "unresolved_placement" &&
      threadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_UNRESOLVED_THREAD_FORBIDDEN",
        {
          threadId
        }
      );
    }

    if (
      TARGET_REQUIRED_PLACEMENTS.includes(
        placementType
      ) &&
      !parentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_PARENT_REQUIRED",
        {
          placementType
        }
      );
    }

    if (
      placementType ===
        "new_thread" &&
      parentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_NEW_THREAD_PARENT_FORBIDDEN",
        {
          parentTurnId
        }
      );
    }

    if (
      placementType ===
        "branch_from_turn" &&
      originThreadId &&
      originThreadId === threadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_BRANCH_THREAD_NOT_DISTINCT",
        {
          threadId,
          originThreadId
        }
      );
    }

    if (
      placementType ===
        "interruption" &&
      originThreadId &&
      originThreadId === threadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_INTERRUPTION_THREAD_NOT_DISTINCT",
        {
          threadId,
          originThreadId
        }
      );
    }

    if (
      NEW_THREAD_PLACEMENTS.includes(
        placementType
      ) &&
      input.placement.generatedThreadId !==
        true &&
      readStateThread(
        input.state,
        threadId
      )
    ) {
      pushIssue(
        warnings,
        "COS_PLACEMENT_VALIDATOR_NEW_THREAD_ID_ALREADY_EXISTS",
        {
          placementType,
          threadId
        }
      );
    }
  }

  /* =====================================================
     THREAD BINDING VALIDATION
  ===================================================== */

  function validateThreadBinding(
    input,
    errors,
    warnings
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    const threadId =
      readPlacementThreadId(
        input.placement
      );

    const parentTurnId =
      readPlacementParentTurnId(
        input.placement
      );

    if (
      !threadId ||
      placementType ===
        "unresolved_placement"
    ) {
      return;
    }

    const stateThread =
      readStateThread(
        input.state,
        threadId
      );

    if (
      EXISTING_THREAD_PLACEMENTS.includes(
        placementType
      ) &&
      !stateThread
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_EXISTING_THREAD_MISSING",
        {
          placementType,
          threadId
        }
      );
    }

    if (
      parentTurnId &&
      ![
        "branch_from_turn",
        "interruption"
      ].includes(placementType)
    ) {
      const parentThreadId =
        deriveTurnThreadId(
          input.historyIndex,
          input.state,
          parentTurnId
        );

      if (
        parentThreadId &&
        parentThreadId !== threadId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_PARENT_THREAD_MISMATCH",
          {
            placementType,
            parentTurnId,
            parentThreadId,
            placementThreadId:
              threadId
          }
        );
      }
    }

    if (
      (
        placementType ===
          "branch_from_turn" ||
        placementType ===
          "interruption"
      ) &&
      parentTurnId
    ) {
      const parentThreadId =
        deriveTurnThreadId(
          input.historyIndex,
          input.state,
          parentTurnId
        );

      if (
        parentThreadId &&
        parentThreadId === threadId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_DERIVED_THREAD_MUST_DIFFER_FROM_PARENT",
          {
            placementType,
            parentThreadId,
            threadId
          }
        );
      }

      if (
        parentThreadId &&
        input.placement.originThreadId &&
        input.placement.originThreadId !==
          parentThreadId
      ) {
        pushIssue(
          warnings,
          "COS_PLACEMENT_VALIDATOR_ORIGIN_THREAD_MISMATCH",
          {
            parentThreadId,
            originThreadId:
              input.placement
                .originThreadId
          }
        );
      }
    }
  }

  /* =====================================================
     TRANSITION VALIDATION
  ===================================================== */

  function validateTransitionConsistency(
    input,
    errors
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    const placementThreadId =
      readPlacementThreadId(
        input.placement
      );

    const currentTurnId =
      readTurnId(input.currentTurn);

    const transitionApplied =
      readTransitionApplied(
        input.transition
      );

    const transitionThreadId =
      readTransitionThreadId(
        input.transition
      );

    if (
      placementType ===
        "unresolved_placement"
    ) {
      if (transitionApplied !== false) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_UNRESOLVED_TRANSITION_FLAG_INVALID",
          {
            transitionApplied
          }
        );
      }

      if (
        input.state.activeTurnId ===
          currentTurnId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_UNRESOLVED_TURN_BECAME_ACTIVE",
          {
            currentTurnId
          }
        );
      }

      return;
    }

    if (transitionApplied !== true) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_NOT_APPLIED",
        {
          placementType,
          transitionApplied
        }
      );
    }

    if (
      transitionThreadId &&
      transitionThreadId !==
        placementThreadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_TRANSITION_THREAD_MISMATCH",
        {
          placementThreadId,
          transitionThreadId
        }
      );
    }

    if (
      input.state.activeThreadId !==
        placementThreadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_ACTIVE_THREAD_MISMATCH",
        {
          placementThreadId,
          activeThreadId:
            input.state.activeThreadId
        }
      );
    }

    if (
      input.state.activeTurnId !==
        currentTurnId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_ACTIVE_TURN_MISMATCH",
        {
          currentTurnId,
          activeTurnId:
            input.state.activeTurnId
        }
      );
    }

    const thread =
      readStateThread(
        input.state,
        placementThreadId
      );

    if (!thread) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_APPLIED_THREAD_RECORD_MISSING",
        {
          placementThreadId
        }
      );
    } else {
      const threadTurnIds =
        uniqueStrings(
          thread.turnIds || []
        );

      if (
        !threadTurnIds.includes(
          currentTurnId
        )
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_CURRENT_TURN_NOT_IN_THREAD",
          {
            currentTurnId,
            placementThreadId
          }
        );
      }

      if (
        firstNonEmptyString(
          thread.lastTurnId,
          thread.last_turn_id
        ) !== currentTurnId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_THREAD_LAST_TURN_MISMATCH",
          {
            currentTurnId,
            threadLastTurnId:
              firstNonEmptyString(
                thread.lastTurnId,
                thread.last_turn_id
              )
          }
        );
      }
    }

    const stateTurn =
      readStateTurn(
        input.state,
        currentTurnId
      );

    if (!stateTurn) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_STATE_TURN_RECORD_MISSING",
        {
          currentTurnId
        }
      );
    } else if (
      firstNonEmptyString(
        stateTurn.threadId,
        stateTurn.thread_id
      ) !== placementThreadId
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_STATE_TURN_THREAD_MISMATCH",
        {
          currentTurnId,
          placementThreadId,
          stateTurnThreadId:
            firstNonEmptyString(
              stateTurn.threadId,
              stateTurn.thread_id
            )
        }
      );
    }
  }

  /* =====================================================
     INTERRUPTION VALIDATION
  ===================================================== */

  function validateInterruptionState(
    input,
    errors,
    warnings
  ) {
    const placementType =
      readPlacementType(
        input.placement
      );

    const interruptionStack =
      Array.isArray(
        input.state.interruptionStack
      )
        ? input.state.interruptionStack
        : [];

    if (
      placementType ===
        "interruption"
    ) {
      const pushed =
        input.transition
          .interruptionPushed;

      if (!isObject(pushed)) {
        pushIssue(
          warnings,
          "COS_PLACEMENT_VALIDATOR_INTERRUPTION_STACK_ENTRY_NOT_REPORTED"
        );

        return;
      }

      const interruptionThreadId =
        firstNonEmptyString(
          pushed.interruptionThreadId,
          pushed.interruption_thread_id
        );

      if (
        interruptionThreadId !==
        readPlacementThreadId(
          input.placement
        )
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_INTERRUPTION_ENTRY_THREAD_MISMATCH",
          {
            interruptionThreadId,
            placementThreadId:
              readPlacementThreadId(
                input.placement
              )
          }
        );
      }
    }

    if (
      placementType ===
        "return_from_interruption" ||
      placementType ===
        "resume_thread"
    ) {
      const popped =
        input.transition
          .interruptionPopped;

      if (
        placementType ===
          "return_from_interruption" &&
        !isObject(popped)
      ) {
        pushIssue(
          warnings,
          "COS_PLACEMENT_VALIDATOR_RETURN_WITHOUT_POPPED_INTERRUPTION"
        );
      }

      if (
        isObject(popped)
      ) {
        const interruptedThreadId =
          firstNonEmptyString(
            popped.interruptedThreadId,
            popped.interrupted_thread_id
          );

        if (
          interruptedThreadId !==
          readPlacementThreadId(
            input.placement
          )
        ) {
          pushIssue(
            errors,
            "COS_PLACEMENT_VALIDATOR_RESUMED_THREAD_MISMATCH",
            {
              interruptedThreadId,
              resumedThreadId:
                readPlacementThreadId(
                  input.placement
                )
            }
          );
        }
      }
    }

    for (
      const entry of interruptionStack
    ) {
      if (!isObject(entry)) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_INTERRUPTION_STACK_ENTRY_INVALID"
        );

        continue;
      }

      const interruptedThreadId =
        firstNonEmptyString(
          entry.interruptedThreadId,
          entry.interrupted_thread_id
        );

      const interruptionThreadId =
        firstNonEmptyString(
          entry.interruptionThreadId,
          entry.interruption_thread_id
        );

      if (
        !interruptedThreadId ||
        !interruptionThreadId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_INTERRUPTION_STACK_IDS_MISSING"
        );
      }

      if (
        interruptedThreadId &&
        interruptionThreadId &&
        interruptedThreadId ===
          interruptionThreadId
      ) {
        pushIssue(
          errors,
          "COS_PLACEMENT_VALIDATOR_INTERRUPTION_STACK_SELF_THREAD"
        );
      }
    }
  }

  /* =====================================================
     STATE STRUCTURE VALIDATION
  ===================================================== */

  function validateStateStructure(
    input,
    errors,
    warnings
  ) {
    const state = input.state;

    if (!isObject(state.threads)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_STATE_THREADS_INVALID"
      );
    }

    if (!isObject(state.turns)) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_STATE_TURNS_INVALID"
      );
    }

    if (
      !Array.isArray(
        state.threadStack
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_THREAD_STACK_INVALID"
      );
    } else {
      const normalized =
        uniqueStrings(
          state.threadStack
        );

      if (
        normalized.length !==
        state.threadStack.length
      ) {
        pushIssue(
          warnings,
          "COS_PLACEMENT_VALIDATOR_THREAD_STACK_DUPLICATES"
        );
      }

      if (
        state.activeThreadId &&
        normalized[
          normalized.length - 1
        ] !== state.activeThreadId
      ) {
        pushIssue(
          warnings,
          "COS_PLACEMENT_VALIDATOR_ACTIVE_THREAD_NOT_STACK_TOP",
          {
            activeThreadId:
              state.activeThreadId
          }
        );
      }
    }

    if (
      !Array.isArray(
        state.interruptionStack
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_INTERRUPTION_STACK_INVALID"
      );
    }

    if (
      state.activeThreadId &&
      !hasOwn(
        state.threads || {},
        state.activeThreadId
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_ACTIVE_THREAD_RECORD_MISSING",
        {
          activeThreadId:
            state.activeThreadId
        }
      );
    }

    if (
      state.activeTurnId &&
      !hasOwn(
        state.turns || {},
        state.activeTurnId
      )
    ) {
      pushIssue(
        errors,
        "COS_PLACEMENT_VALIDATOR_ACTIVE_TURN_RECORD_MISSING",
        {
          activeTurnId:
            state.activeTurnId
        }
      );
    }
  }

  /* =====================================================
     PUBLIC VALIDATION
  ===================================================== */

  function validate(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeValidationInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const throwOnInvalid =
      firstDefined(
        options.throwOnInvalid,
        input.options.throwOnInvalid
      ) === true;

    const errors = [];
    const warnings = [];

    validateBaseShapes(
      input,
      errors
    );

    if (errors.length === 0) {
      validateIdentityConsistency(
        input,
        errors
      );

      validatePlacementType(
        input,
        errors,
        warnings
      );

      validateReferenceStatus(
        input,
        errors
      );

      validateReferencePlacementConsistency(
        input,
        errors,
        warnings
      );

      validateReferencedTurnExistence(
        input,
        errors
      );

      validatePlacementInvariants(
        input,
        errors,
        warnings
      );

      validateThreadBinding(
        input,
        errors,
        warnings
      );

      validateTransitionConsistency(
        input,
        errors
      );

      validateInterruptionState(
        input,
        errors,
        warnings
      );

      validateStateStructure(
        input,
        errors,
        warnings
      );
    }

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      valid:
        errors.length === 0,

      errors,

      warnings,

      errorCount:
        errors.length,

      warningCount:
        warnings.length,

      currentTurnId:
        readTurnId(
          input.currentTurn
        ),

      placementType:
        readPlacementType(
          input.placement
        ),

      threadId:
        readPlacementThreadId(
          input.placement
        ),

      validatedAt:
        nowIso()
    };

    if (
      !result.valid &&
      throwOnInvalid
    ) {
      throw new CosPlacementValidatorError(
        "COS_PLACEMENT_VALIDATION_FAILED",
        "Conversation placement failed structural validation.",
        {
          details:
            result
        }
      );
    }

    return freeze
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     ASSERTION API
  ===================================================== */

  function assert(
    rawInput = {},
    options = {}
  ) {
    const result = validate(
      rawInput,
      {
        ...options,
        freeze: false
      }
    );

    if (!result.valid) {
      throw new CosPlacementValidatorError(
        "COS_PLACEMENT_VALIDATION_FAILED",
        "Conversation placement failed structural validation.",
        {
          details:
            result
        }
      );
    }

    return options.freeze === false
      ? result
      : freezeClone(result);
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosPlacementValidator = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    placementTypes:
      PLACEMENT_TYPES,

    referenceStatuses:
      REFERENCE_STATUSES,

    targetRequiredPlacements:
      TARGET_REQUIRED_PLACEMENTS,

    CosPlacementValidatorError,

    validate,

    validatePlacement:
      validate,

    assert,

    run:
      validate,

    normalizeInput:
      normalizeValidationInput
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.placementValidator =
    cosPlacementValidator;

  ConversationOS.cosPlacementValidator =
    cosPlacementValidator;

  root.AriCosPlacementValidator =
    cosPlacementValidator;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosPlacementValidator;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);