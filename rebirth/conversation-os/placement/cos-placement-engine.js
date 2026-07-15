// rebirth/conversation-os/placement/cos-placement-engine.js
// ARI Rebirth — Conversation Operating System Placement Engine
//
// Purpose:
// Determine the structural placement of the registered current turn within
// the Conversation Operating System.
//
// V1.0.0 — Canonical Deterministic Conversation Placement
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Explicit Placement Metadata
//      ↓
// Structural Reference Resolution
//      ↓
// Existing Thread State
//      ↓
// Parent / Source Thread Binding
//      ↓
// Placement-Type Validation
//      ↓
// Canonical Conversation Placement
//
// Authority:
//
// This component is authoritative only for:
//
// - assigning a structural placement type,
// - binding the current turn to an existing or new thread,
// - preserving explicit placement metadata,
// - binding placement to resolved source turns,
// - assigning the structural parent turn,
// - identifying placement that cannot be resolved safely.
//
// Non-authority:
//
// This component must not:
//
// - interpret semantic meaning,
// - infer intent from user language,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - perform natural-language reference resolution,
// - choose a source turn from textual similarity,
// - guess whether a message is a correction, clarification, or answer,
// - reinterpret raw text,
// - plan a response,
// - generate a response.
//
// Architectural rule:
//
// Placement decisions must come from explicit structural metadata,
// verified references, and canonical thread state.
//
// When structural evidence is insufficient, the result must be
// `unresolved_placement`. The engine must never fabricate continuity.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.placementEngine

(function initializeCosPlacementEngine(globalScope) {
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
    "cos-placement-engine";

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

  const EXPLICIT_TYPE_FIELD_MAP = Object.freeze({
    placementType: "placementType",
    placement_type: "placement_type",
    conversationPlacementType:
      "conversationPlacementType",
    conversation_placement_type:
      "conversation_placement_type"
  });

  const RELATIONSHIP_TO_PLACEMENT = Object.freeze({
    answer_target: "answer_to_turn",
    clarification_target:
      "clarification_of_turn",
    correction_target:
      "correction_of_turn",
    branch_origin:
      "branch_from_turn",
    interruption_origin:
      "interruption",
    resume_target:
      "resume_thread"
  });

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosPlacementEngineError extends Error {
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
        "COS placement engine error"
      );

      this.name =
        "CosPlacementEngineError";

      this.code =
        code ||
        "COS_PLACEMENT_ENGINE_ERROR";

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
          CosPlacementEngineError
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

  function createId(prefix = "thread") {
    const timestamp =
      Date.now().toString(36);

    let randomPart = "";

    if (
      typeof crypto !== "undefined" &&
      crypto &&
      typeof crypto.getRandomValues ===
        "function"
    ) {
      const values =
        new Uint32Array(2);

      crypto.getRandomValues(values);

      randomPart =
        values[0].toString(36) +
        values[1].toString(36);
    } else {
      randomPart =
        Math.random()
          .toString(36)
          .slice(2, 12);
    }

    return `${prefix}_${timestamp}_${randomPart}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizePlacementInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {
          currentTurn: rawInput
        };

    const currentTurn = isObject(
      firstDefined(
        source.currentTurn,
        source.current_turn,
        source.turn,
        null
      )
    )
      ? safeClone(
          firstDefined(
            source.currentTurn,
            source.current_turn,
            source.turn
          )
        )
      : {};

    const referenceResolution =
      isObject(
        source.referenceResolution
      )
        ? safeClone(
            source.referenceResolution
          )
        : {};

    const historyIndex =
      isObject(source.historyIndex)
        ? source.historyIndex
        : {};

    const state =
      isObject(source.state)
        ? source.state
        : {};

    return {
      currentTurn,
      referenceResolution,
      historyIndex,
      state,

      history:
        Array.isArray(source.history)
          ? source.history
          : [],

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state.conversationId,
          state.conversation_id
        ) || null,

      metadata:
        isObject(source.metadata)
          ? safeClone(source.metadata)
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

  function readCurrentTurnId(turn) {
    return firstNonEmptyString(
      turn.turnId,
      turn.turn_id,
      turn.id,
      turn.messageId,
      turn.message_id
    );
  }

  function readExplicitPlacementType(turn) {
    for (
      const field of Object.keys(
        EXPLICIT_TYPE_FIELD_MAP
      )
    ) {
      const value = turn[field];

      if (isNonEmptyString(value)) {
        return value.trim();
      }
    }

    return null;
  }

  function readExplicitThreadId(turn) {
    return firstNonEmptyString(
      turn.threadId,
      turn.thread_id,
      turn.conversationThreadId,
      turn.conversation_thread_id
    );
  }

  function readExplicitParentTurnId(turn) {
    return firstNonEmptyString(
      turn.parentTurnId,
      turn.parent_turn_id,
      turn.replyToTurnId,
      turn.reply_to_turn_id
    );
  }

  function readExplicitSourceTurnIds(turn) {
    return uniqueStrings(
      firstDefined(
        turn.sourceTurnIds,
        turn.source_turn_ids,
        turn.referenceTurnIds,
        turn.reference_turn_ids,
        []
      )
    );
  }

  function readReferenceStatus(
    referenceResolution
  ) {
    const status =
      firstNonEmptyString(
        referenceResolution.status,
        referenceResolution
          .resolutionStatus,
        referenceResolution
          .resolution_status
      );

    return REFERENCE_STATUSES.includes(
      status
    )
      ? status
      : "not_required";
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
        referenceResolution
          .sourceTurnIds,
        referenceResolution
          .source_turn_ids,
        []
      )
    );
  }

  function readResolvedParentTurnId(
    referenceResolution
  ) {
    return firstNonEmptyString(
      referenceResolution.parentTurnId,
      referenceResolution.parent_turn_id,
      referenceResolution.primaryTurnId,
      referenceResolution.primary_turn_id
    );
  }

  /* =====================================================
     HISTORY / STATE LOOKUPS
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

  function readThread(
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

  function deriveThreadIdFromTurn(
    turnId,
    historyIndex,
    state
  ) {
    if (!isNonEmptyString(turnId)) {
      return null;
    }

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

  function threadExists(
    state,
    threadId
  ) {
    return Boolean(
      readThread(state, threadId)
    );
  }

  function turnExists(
    turnId,
    historyIndex,
    state
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

  /* =====================================================
     STRUCTURAL RELATIONSHIP INSPECTION
  ===================================================== */

  function findResolvedReferenceByType(
    referenceResolution,
    type
  ) {
    const references =
      Array.isArray(
        referenceResolution
          .resolvedReferences
      )
        ? referenceResolution
            .resolvedReferences
        : [];

    return (
      references.find(
        (reference) =>
          isObject(reference) &&
          Array.isArray(
            reference.types
          ) &&
          reference.types.includes(type)
      ) || null
    );
  }

  function inferPlacementFromResolvedTypes(
    referenceResolution
  ) {
    for (
      const [
        relationshipType,
        placementType
      ] of Object.entries(
        RELATIONSHIP_TO_PLACEMENT
      )
    ) {
      if (
        findResolvedReferenceByType(
          referenceResolution,
          relationshipType
        )
      ) {
        return {
          type: placementType,
          source:
            `resolved_reference_type:${relationshipType}`
        };
      }
    }

    return null;
  }

  /* =====================================================
     PLACEMENT EVIDENCE
  ===================================================== */

  function collectPlacementEvidence(input) {
    const currentTurn =
      input.currentTurn;

    const referenceResolution =
      input.referenceResolution;

    const explicitPlacementType =
      readExplicitPlacementType(
        currentTurn
      );

    const explicitThreadId =
      readExplicitThreadId(
        currentTurn
      );

    const explicitParentTurnId =
      readExplicitParentTurnId(
        currentTurn
      );

    const explicitSourceTurnIds =
      readExplicitSourceTurnIds(
        currentTurn
      );

    const referenceStatus =
      readReferenceStatus(
        referenceResolution
      );

    const resolvedTurnIds =
      readResolvedTurnIds(
        referenceResolution
      );

    const resolvedParentTurnId =
      readResolvedParentTurnId(
        referenceResolution
      );

    const placementFromReferenceType =
      inferPlacementFromResolvedTypes(
        referenceResolution
      );

    return {
      explicitPlacementType,
      explicitThreadId,
      explicitParentTurnId,
      explicitSourceTurnIds,

      referenceStatus,
      resolvedTurnIds,
      resolvedParentTurnId,

      placementFromReferenceType,

      activeThreadId:
        firstNonEmptyString(
          input.state.activeThreadId,
          input.state.active_thread_id
        ),

      activeTurnId:
        firstNonEmptyString(
          input.state.activeTurnId,
          input.state.active_turn_id
        ),

      interruptionStack:
        Array.isArray(
          input.state.interruptionStack
        )
          ? input.state
              .interruptionStack
          : []
    };
  }

  /* =====================================================
     PARENT AND SOURCE RECONCILIATION
  ===================================================== */

  function determineSourceTurnIds(
    evidence,
    historyIndex,
    state
  ) {
    const candidateIds =
      uniqueStrings([
        ...evidence.explicitSourceTurnIds,
        ...evidence.resolvedTurnIds
      ]);

    return candidateIds.filter(
      (turnId) =>
        turnExists(
          turnId,
          historyIndex,
          state
        )
    );
  }

  function determineParentTurnId(
    evidence,
    sourceTurnIds,
    historyIndex,
    state
  ) {
    const candidates =
      uniqueStrings([
        evidence.explicitParentTurnId,
        evidence.resolvedParentTurnId,
        ...sourceTurnIds
      ]);

    for (const turnId of candidates) {
      if (
        turnExists(
          turnId,
          historyIndex,
          state
        )
      ) {
        return turnId;
      }
    }

    return null;
  }

  /* =====================================================
     THREAD BINDING
  ===================================================== */

  function determineThreadId({
    placementType,
    evidence,
    parentTurnId,
    sourceTurnIds,
    historyIndex,
    state
  }) {
    if (evidence.explicitThreadId) {
      return {
        threadId:
          evidence.explicitThreadId,

        source:
          "explicit_thread_id",

        generated:
          false
      };
    }

    if (parentTurnId) {
      const parentThreadId =
        deriveThreadIdFromTurn(
          parentTurnId,
          historyIndex,
          state
        );

      if (parentThreadId) {
        if (
          placementType ===
            "branch_from_turn" ||
          placementType ===
            "interruption"
        ) {
          return {
            threadId:
              createId("thread"),

            source:
              "new_thread_from_parent",

            generated:
              true,

            originThreadId:
              parentThreadId
          };
        }

        return {
          threadId:
            parentThreadId,

          source:
            "parent_turn_thread",

          generated:
            false
        };
      }
    }

    for (const sourceTurnId of sourceTurnIds) {
      const sourceThreadId =
        deriveThreadIdFromTurn(
          sourceTurnId,
          historyIndex,
          state
        );

      if (sourceThreadId) {
        if (
          placementType ===
            "branch_from_turn" ||
          placementType ===
            "interruption"
        ) {
          return {
            threadId:
              createId("thread"),

            source:
              "new_thread_from_source",

            generated:
              true,

            originThreadId:
              sourceThreadId
          };
        }

        return {
          threadId:
            sourceThreadId,

          source:
            "source_turn_thread",

          generated:
            false
        };
      }
    }

    if (
      placementType ===
        "continue_thread" ||
      placementType ===
        "answer_to_turn" ||
      placementType ===
        "clarification_of_turn" ||
      placementType ===
        "correction_of_turn"
    ) {
      if (evidence.activeThreadId) {
        return {
          threadId:
            evidence.activeThreadId,

          source:
            "active_thread",

          generated:
            false
        };
      }
    }

    if (
      placementType ===
        "resume_thread" ||
      placementType ===
        "return_from_interruption"
    ) {
      const resumedThreadId =
        readInterruptedThreadId(
          evidence.interruptionStack
        );

      if (resumedThreadId) {
        return {
          threadId:
            resumedThreadId,

          source:
            "interruption_stack",

          generated:
            false
        };
      }

      if (evidence.activeThreadId) {
        return {
          threadId:
            evidence.activeThreadId,

          source:
            "active_thread",

          generated:
            false
        };
      }
    }

    if (
      placementType ===
        "new_thread" ||
      placementType ===
        "branch_from_turn" ||
      placementType ===
        "interruption"
    ) {
      return {
        threadId:
          createId("thread"),

        source:
          "generated_thread_id",

        generated:
          true
      };
    }

    return {
      threadId: null,
      source: null,
      generated: false
    };
  }

  function readInterruptedThreadId(
    interruptionStack
  ) {
    if (
      !Array.isArray(
        interruptionStack
      ) ||
      interruptionStack.length === 0
    ) {
      return null;
    }

    const lastEntry =
      interruptionStack[
        interruptionStack.length - 1
      ];

    if (!isObject(lastEntry)) {
      return null;
    }

    return firstNonEmptyString(
      lastEntry.interruptedThreadId,
      lastEntry.interrupted_thread_id,
      lastEntry.returnThreadId,
      lastEntry.return_thread_id
    );
  }

  /* =====================================================
     PLACEMENT-TYPE DETERMINATION
  ===================================================== */

  function determinePlacementType({
    input,
    evidence,
    parentTurnId,
    sourceTurnIds
  }) {
    const historyCount =
      Number.isFinite(
        Number(input.historyIndex.count)
      )
        ? Number(input.historyIndex.count)
        : input.history.length;

    if (
      evidence.explicitPlacementType
    ) {
      if (
        PLACEMENT_TYPES.includes(
          evidence.explicitPlacementType
        )
      ) {
        return {
          type:
            evidence.explicitPlacementType,

          source:
            "explicit_placement_type"
        };
      }

      return {
        type:
          "unresolved_placement",

        source:
          "invalid_explicit_placement_type",

        issue: {
          code:
            "COS_PLACEMENT_UNKNOWN_EXPLICIT_TYPE",

          value:
            evidence.explicitPlacementType
        }
      };
    }

    if (
      evidence.referenceStatus ===
        "unresolved" ||
      evidence.referenceStatus ===
        "partially_resolved"
    ) {
      return {
        type:
          "unresolved_placement",

        source:
          "unresolved_reference_status"
      };
    }

    if (
      evidence.placementFromReferenceType
    ) {
      return evidence
        .placementFromReferenceType;
    }

    if (
      historyCount === 0 &&
      !evidence.activeThreadId &&
      sourceTurnIds.length === 0 &&
      !parentTurnId
    ) {
      return {
        type: "new_thread",
        source: "empty_conversation"
      };
    }

    if (
      parentTurnId ||
      sourceTurnIds.length > 0
    ) {
      return {
        type: "continue_thread",
        source: "resolved_turn_relationship"
      };
    }

    if (evidence.activeThreadId) {
      return {
        type: "continue_thread",
        source: "active_thread"
      };
    }

    return {
      type: "unresolved_placement",
      source: "insufficient_structural_evidence"
    };
  }

  /* =====================================================
     PLACEMENT NORMALIZATION
  ===================================================== */

  function normalizePlacement({
    currentTurnId,
    placementTypeResult,
    threadBinding,
    parentTurnId,
    sourceTurnIds,
    evidence,
    input
  }) {
    let type =
      placementTypeResult.type;

    let threadId =
      threadBinding.threadId;

    let normalizedParentTurnId =
      parentTurnId;

    const warnings = [];

    if (
      type === "new_thread" &&
      normalizedParentTurnId
    ) {
      type = "branch_from_turn";

      warnings.push({
        code:
          "COS_PLACEMENT_NEW_THREAD_WITH_PARENT_NORMALIZED",

        message:
          "A new-thread placement with a parent was normalized to branch_from_turn."
      });
    }

    if (
      type === "branch_from_turn" &&
      !normalizedParentTurnId
    ) {
      type = "unresolved_placement";
      threadId = null;

      warnings.push({
        code:
          "COS_PLACEMENT_BRANCH_PARENT_MISSING"
      });
    }

    if (
      (
        type === "answer_to_turn" ||
        type ===
          "clarification_of_turn" ||
        type ===
          "correction_of_turn"
      ) &&
      !normalizedParentTurnId
    ) {
      type = "unresolved_placement";
      threadId = null;

      warnings.push({
        code:
          "COS_PLACEMENT_TARGET_REQUIRED",

        originalPlacementType:
          placementTypeResult.type
      });
    }

    if (
      type === "continue_thread" &&
      !threadId
    ) {
      type = "unresolved_placement";

      warnings.push({
        code:
          "COS_PLACEMENT_CONTINUATION_THREAD_MISSING"
      });
    }

    if (
      type === "new_thread" &&
      !threadId
    ) {
      threadId = createId("thread");
    }

    if (
      type === "unresolved_placement"
    ) {
      threadId = null;
    }

    if (
      normalizedParentTurnId ===
      currentTurnId
    ) {
      normalizedParentTurnId = null;
      type = "unresolved_placement";
      threadId = null;

      warnings.push({
        code:
          "COS_PLACEMENT_SELF_PARENT"
      });
    }

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      conversationId:
        input.conversationId,

      currentTurnId,

      type,

      threadId,

      parentTurnId:
        normalizedParentTurnId,

      sourceTurnIds:
        uniqueStrings(
          sourceTurnIds
        ),

      originThreadId:
        firstNonEmptyString(
          threadBinding.originThreadId
        ) || null,

      placementSource:
        placementTypeResult.source,

      threadBindingSource:
        threadBinding.source,

      generatedThreadId:
        threadBinding.generated === true,

      provisional:
        type ===
        "unresolved_placement",

      placedAt:
        nowIso(),

      diagnostics: {
        valid: true,

        warningCount:
          warnings.length,

        warnings,

        evidence: {
          explicitPlacementType:
            evidence.explicitPlacementType,

          explicitThreadId:
            evidence.explicitThreadId,

          explicitParentTurnId:
            evidence.explicitParentTurnId,

          referenceStatus:
            evidence.referenceStatus,

          activeThreadId:
            evidence.activeThreadId,

          activeTurnId:
            evidence.activeTurnId
        }
      }
    };
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validatePlacement(
    placement,
    context = {}
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(placement)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PLACEMENT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !PLACEMENT_TYPES.includes(
        placement.type
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_TYPE_INVALID",

        type:
          placement.type
      });
    }

    if (
      !isNonEmptyString(
        placement.currentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_CURRENT_TURN_ID_MISSING"
      });
    }

    if (
      placement.type !==
        "unresolved_placement" &&
      !isNonEmptyString(
        placement.threadId
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_THREAD_ID_MISSING",

        type:
          placement.type
      });
    }

    if (
      placement.type ===
        "unresolved_placement" &&
      placement.threadId !== null
    ) {
      warnings.push({
        code:
          "COS_PLACEMENT_UNRESOLVED_WITH_THREAD_ID"
      });
    }

    if (
      !Array.isArray(
        placement.sourceTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_SOURCE_TURNS_INVALID"
      });
    }

    if (
      (
        placement.type ===
          "branch_from_turn" ||
        placement.type ===
          "answer_to_turn" ||
        placement.type ===
          "clarification_of_turn" ||
        placement.type ===
          "correction_of_turn"
      ) &&
      !isNonEmptyString(
        placement.parentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_PARENT_REQUIRED",

        type:
          placement.type
      });
    }

    if (
      placement.type ===
        "new_thread" &&
      placement.parentTurnId
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_NEW_THREAD_PARENT_FORBIDDEN"
      });
    }

    if (
      placement.parentTurnId &&
      placement.parentTurnId ===
        placement.currentTurnId
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_SELF_PARENT"
      });
    }

    for (
      const sourceTurnId of
        placement.sourceTurnIds || []
    ) {
      if (
        sourceTurnId ===
        placement.currentTurnId
      ) {
        errors.push({
          code:
            "COS_PLACEMENT_SELF_SOURCE",

          sourceTurnId
        });
      }
    }

    if (
      context.historyIndex &&
      placement.parentTurnId &&
      !turnExists(
        placement.parentTurnId,
        context.historyIndex,
        context.state || {}
      )
    ) {
      errors.push({
        code:
          "COS_PLACEMENT_UNKNOWN_PARENT",

        parentTurnId:
          placement.parentTurnId
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
     PUBLIC PLACE
  ===================================================== */

  function place(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizePlacementInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    if (!currentTurnId) {
      throw new CosPlacementEngineError(
        "COS_PLACEMENT_CURRENT_TURN_ID_MISSING",
        "Conversation placement requires a registered current-turn ID."
      );
    }

    const evidence =
      collectPlacementEvidence(input);

    const sourceTurnIds =
      determineSourceTurnIds(
        evidence,
        input.historyIndex,
        input.state
      );

    const parentTurnId =
      determineParentTurnId(
        evidence,
        sourceTurnIds,
        input.historyIndex,
        input.state
      );

    const placementTypeResult =
      determinePlacementType({
        input,
        evidence,
        parentTurnId,
        sourceTurnIds
      });

    const threadBinding =
      determineThreadId({
        placementType:
          placementTypeResult.type,

        evidence,
        parentTurnId,
        sourceTurnIds,

        historyIndex:
          input.historyIndex,

        state:
          input.state
      });

    const placement =
      normalizePlacement({
        currentTurnId,

        placementTypeResult,

        threadBinding,

        parentTurnId,

        sourceTurnIds,

        evidence,

        input
      });

    const validation =
      validatePlacement(
        placement,
        {
          historyIndex:
            input.historyIndex,

          state:
            input.state
        }
      );

    if (!validation.valid) {
      throw new CosPlacementEngineError(
        "COS_PLACEMENT_VALIDATION_FAILED",
        "Conversation placement failed structural validation.",
        {
          details:
            validation
        }
      );
    }

    if (
      validation.warnings.length > 0
    ) {
      placement.diagnostics.warnings.push(
        ...validation.warnings
      );

      placement.diagnostics.warningCount =
        placement.diagnostics
          .warnings.length;
    }

    return freeze
      ? freezeClone(placement)
      : placement;
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosPlacementEngine = {
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

    CosPlacementEngineError,

    place,

    determinePlacement:
      place,

    resolvePlacement:
      place,

    run:
      place,

    validate:
      validatePlacement,

    validatePlacement,

    normalizeInput:
      normalizePlacementInput,

    collectPlacementEvidence
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.placementEngine =
    cosPlacementEngine;

  ConversationOS
    .conversationPlacementEngine =
    cosPlacementEngine;

  ConversationOS.cosPlacementEngine =
    cosPlacementEngine;

  root.AriCosPlacementEngine =
    cosPlacementEngine;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosPlacementEngine;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);