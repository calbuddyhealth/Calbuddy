// rebirth/conversation-os/threads/cos-thread-state-manager.js
// ARI Rebirth — Conversation Operating System Thread State Manager
//
// Purpose:
// Apply an authoritative structural thread-state transition after the
// Conversation Operating System determines the current turn's placement.
//
// V1.0.0 — Canonical Thread Lifecycle and State Transition
//
// Canonical flow:
//
// Existing COS State
//      ↓
// Registered Current Turn
//      ↓
// Validated Conversation Placement
//      ↓
// Thread Lifecycle Resolution
//      ↓
// Turn-to-Thread Registration
//      ↓
// Active Thread Transition
//      ↓
// Interruption / Resume Stack Transition
//      ↓
// Canonical Next COS State
//
// Authority:
//
// This component is authoritative only for:
//
// - creating structural conversation-thread records,
// - updating thread lifecycle status,
// - registering turns within threads,
// - preserving parent and source-turn relationships,
// - tracking the active thread and active turn,
// - tracking interrupted threads,
// - resuming previously interrupted threads,
// - maintaining deterministic thread stacks,
// - incrementing COS state revision.
//
// Non-authority:
//
// This component must not:
//
// - interpret semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve natural-language references,
// - determine conversation placement,
// - change the placement type,
// - invent source-turn relationships,
// - rewrite the current turn,
// - plan or generate a response.
//
// Architectural rule:
//
// This component applies an already-authorized placement.
//
// It must not reinterpret or replace the placement engine's conclusion.
// If the supplied placement cannot be applied safely, it must fail or
// preserve the state without fabricating a transition.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.threadStateManager

(function initializeCosThreadStateManager(globalScope) {
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
    "cos-thread-state-manager";

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

  const THREAD_STATUSES = Object.freeze([
    "active",
    "paused",
    "interrupted",
    "resumed",
    "closed",
    "unknown"
  ]);

  const APPLIED_PLACEMENT_TYPES =
    Object.freeze(
      PLACEMENT_TYPES.filter(
        (type) =>
          type !== "unresolved_placement"
      )
    );

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosThreadStateManagerError extends Error {
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
        "COS thread-state manager error"
      );

      this.name =
        "CosThreadStateManagerError";

      this.code =
        code ||
        "COS_THREAD_STATE_MANAGER_ERROR";

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
          CosThreadStateManagerError
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

  function normalizeTimestamp(
    value,
    fallback = null
  ) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    if (isNonEmptyString(value)) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return fallback;
  }

  function nowIso() {
    return new Date().toISOString();
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

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeTransitionInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {};

    const state =
      isObject(source.state)
        ? safeClone(source.state)
        : {};

    const currentTurn =
      isObject(source.currentTurn)
        ? safeClone(source.currentTurn)
        : {};

    const placement =
      isObject(source.placement)
        ? safeClone(source.placement)
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

    return {
      state,
      currentTurn,
      placement,
      referenceResolution,
      historyIndex,

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

      requestId:
        firstNonEmptyString(
          source.requestId,
          source.request_id
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

  function readRole(turn) {
    return (
      firstNonEmptyString(
        turn.role,
        turn.speaker
      ) || "unknown"
    );
  }

  function readSequence(turn) {
    return normalizeInteger(
      firstDefined(
        turn.sequence,
        turn.turnSequence,
        turn.turn_sequence,
        turn.turnIndex,
        turn.turn_index,
        turn.index
      ),
      0
    );
  }

  function readTurnTimestamp(turn) {
    return normalizeTimestamp(
      firstDefined(
        turn.timestamp,
        turn.createdAt,
        turn.created_at,
        turn.time
      ),
      nowIso()
    );
  }

  function readPlacementType(placement) {
    const type =
      firstNonEmptyString(
        placement.type,
        placement.placementType,
        placement.placement_type
      );

    return PLACEMENT_TYPES.includes(type)
      ? type
      : null;
  }

  function readPlacementThreadId(
    placement
  ) {
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

  function readPlacementOriginThreadId(
    placement
  ) {
    return firstNonEmptyString(
      placement.originThreadId,
      placement.origin_thread_id
    );
  }

  /* =====================================================
     STATE NORMALIZATION
  ===================================================== */

  function normalizeState(
    rawState,
    conversationId
  ) {
    const source = isObject(rawState)
      ? safeClone(rawState)
      : {};

    const now = nowIso();

    return {
      ...source,

      schemaVersion:
        firstNonEmptyString(
          source.schemaVersion,
          source.schema_version
        ) || SCHEMA_VERSION,

      authority:
        firstNonEmptyString(
          source.authority
        ) || AUTHORITY,

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          conversationId
        ) || null,

      revision:
        Math.max(
          0,
          normalizeInteger(
            source.revision,
            0
          )
        ),

      activeThreadId:
        firstNonEmptyString(
          source.activeThreadId,
          source.active_thread_id
        ) || null,

      activeTurnId:
        firstNonEmptyString(
          source.activeTurnId,
          source.active_turn_id
        ) || null,

      threads:
        isObject(source.threads)
          ? source.threads
          : {},

      turns:
        isObject(source.turns)
          ? source.turns
          : {},

      threadStack:
        uniqueStrings(
          source.threadStack ||
          source.thread_stack ||
          []
        ),

      interruptionStack:
        Array.isArray(
          source.interruptionStack
        )
          ? source.interruptionStack
              .filter(isObject)
              .map((entry) =>
                safeClone(entry)
              )
          : [],

      lastPlacement:
        isObject(source.lastPlacement)
          ? source.lastPlacement
          : null,

      lastReferenceResolution:
        isObject(
          source.lastReferenceResolution
        )
          ? source
              .lastReferenceResolution
          : null,

      createdAt:
        normalizeTimestamp(
          source.createdAt,
          now
        ),

      updatedAt:
        now
    };
  }

  /* =====================================================
     STATE LOOKUPS
  ===================================================== */

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

  function readTurn(
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

  function threadContainsTurn(
    thread,
    turnId
  ) {
    return Boolean(
      isObject(thread) &&
      Array.isArray(thread.turnIds) &&
      thread.turnIds.includes(turnId)
    );
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateTransitionInput(
    input
  ) {
    const errors = [];
    const warnings = [];

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    const placementType =
      readPlacementType(
        input.placement
      );

    const threadId =
      readPlacementThreadId(
        input.placement
      );

    if (
      !isNonEmptyString(
        input.conversationId
      )
    ) {
      errors.push({
        code:
          "COS_THREAD_STATE_CONVERSATION_ID_MISSING"
      });
    }

    if (!currentTurnId) {
      errors.push({
        code:
          "COS_THREAD_STATE_CURRENT_TURN_ID_MISSING"
      });
    }

    if (!placementType) {
      errors.push({
        code:
          "COS_THREAD_STATE_PLACEMENT_TYPE_INVALID",

        placementType:
          firstDefined(
            input.placement.type,
            input.placement
              .placementType
          )
      });
    }

    if (
      placementType &&
      placementType !==
        "unresolved_placement" &&
      !threadId
    ) {
      errors.push({
        code:
          "COS_THREAD_STATE_THREAD_ID_REQUIRED",

        placementType
      });
    }

    if (
      placementType ===
        "unresolved_placement" &&
      threadId
    ) {
      warnings.push({
        code:
          "COS_THREAD_STATE_UNRESOLVED_THREAD_ID_IGNORED",

        threadId
      });
    }

    const parentTurnId =
      readPlacementParentTurnId(
        input.placement
      );

    if (
      parentTurnId &&
      parentTurnId === currentTurnId
    ) {
      errors.push({
        code:
          "COS_THREAD_STATE_SELF_PARENT",

        turnId:
          currentTurnId
      });
    }

    for (
      const sourceTurnId of
        readPlacementSourceTurnIds(
          input.placement
        )
    ) {
      if (
        sourceTurnId === currentTurnId
      ) {
        errors.push({
          code:
            "COS_THREAD_STATE_SELF_SOURCE",

          turnId:
            currentTurnId
        });
      }
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  /* =====================================================
     THREAD STATUS
  ===================================================== */

  function determineThreadStatus({
    placementType,
    existingStatus
  }) {
    switch (placementType) {
      case "new_thread":
      case "continue_thread":
      case "branch_from_turn":
      case "answer_to_turn":
      case "clarification_of_turn":
      case "correction_of_turn":
        return "active";

      case "resume_thread":
      case "return_from_interruption":
        return "resumed";

      case "interruption":
        return "active";

      case "unresolved_placement":
        return THREAD_STATUSES.includes(
          existingStatus
        )
          ? existingStatus
          : "unknown";

      default:
        return "unknown";
    }
  }

  function determinePreviousThreadStatus({
    previousActiveThreadId,
    newThreadId,
    placementType
  }) {
    if (
      !previousActiveThreadId ||
      previousActiveThreadId ===
        newThreadId
    ) {
      return null;
    }

    if (
      placementType ===
        "interruption"
    ) {
      return "interrupted";
    }

    if (
      placementType ===
        "new_thread" ||
      placementType ===
        "branch_from_turn"
    ) {
      return "paused";
    }

    if (
      placementType ===
        "resume_thread" ||
      placementType ===
        "return_from_interruption"
    ) {
      return "paused";
    }

    return null;
  }

  /* =====================================================
     THREAD RECORD CONSTRUCTION
  ===================================================== */

  function createOrUpdateThread({
    existingThread,
    threadId,
    placement,
    currentTurn,
    previousActiveThreadId
  }) {
    const existing =
      isObject(existingThread)
        ? safeClone(existingThread)
        : {};

    const currentTurnId =
      readCurrentTurnId(
        currentTurn
      );

    const placementType =
      readPlacementType(placement);

    const parentTurnId =
      readPlacementParentTurnId(
        placement
      );

    const sourceTurnIds =
      readPlacementSourceTurnIds(
        placement
      );

    const originThreadId =
      firstNonEmptyString(
        readPlacementOriginThreadId(
          placement
        ),
        existing.originThreadId,
        existing.origin_thread_id
      );

    const turnIds =
      uniqueStrings([
        ...asArray(existing.turnIds),
        currentTurnId
      ]);

    const status =
      determineThreadStatus({
        placementType,

        existingStatus:
          firstNonEmptyString(
            existing.status
          ) || "unknown"
      });

    const now = nowIso();

    return {
      ...existing,

      threadId,

      conversationId:
        firstNonEmptyString(
          existing.conversationId,
          currentTurn.conversationId
        ) || null,

      status,

      rootTurnId:
        firstNonEmptyString(
          existing.rootTurnId,
          existing.root_turn_id,
          placementType ===
            "new_thread"
            ? currentTurnId
            : null,
          parentTurnId,
          currentTurnId
        ),

      originThreadId:
        originThreadId || null,

      originTurnId:
        firstNonEmptyString(
          existing.originTurnId,
          existing.origin_turn_id,
          placementType ===
            "branch_from_turn" ||
          placementType ===
            "interruption"
            ? parentTurnId
            : null
        ) || null,

      previousThreadId:
        firstNonEmptyString(
          existing.previousThreadId,
          existing.previous_thread_id,
          previousActiveThreadId
        ) || null,

      turnIds,

      turnCount:
        turnIds.length,

      firstTurnId:
        firstNonEmptyString(
          existing.firstTurnId,
          existing.first_turn_id,
          turnIds[0]
        ) || currentTurnId,

      lastTurnId:
        currentTurnId,

      lastPlacementType:
        placementType,

      lastParentTurnId:
        parentTurnId || null,

      lastSourceTurnIds:
        sourceTurnIds,

      createdAt:
        normalizeTimestamp(
          existing.createdAt,
          now
        ),

      updatedAt:
        now
    };
  }

  function updatePreviousThread({
    state,
    previousActiveThreadId,
    newThreadId,
    placementType,
    currentTurnId
  }) {
    if (
      !previousActiveThreadId ||
      previousActiveThreadId ===
        newThreadId
    ) {
      return null;
    }

    const existing =
      readThread(
        state,
        previousActiveThreadId
      );

    if (!existing) {
      return null;
    }

    const nextStatus =
      determinePreviousThreadStatus({
        previousActiveThreadId,
        newThreadId,
        placementType
      });

    if (!nextStatus) {
      return null;
    }

    state.threads[
      previousActiveThreadId
    ] = {
      ...safeClone(existing),

      status:
        nextStatus,

      pausedByTurnId:
        nextStatus === "paused"
          ? currentTurnId
          : firstNonEmptyString(
              existing.pausedByTurnId
            ) || null,

      interruptedByTurnId:
        nextStatus === "interrupted"
          ? currentTurnId
          : firstNonEmptyString(
              existing.interruptedByTurnId
            ) || null,

      updatedAt:
        nowIso()
    };

    return {
      threadId:
        previousActiveThreadId,

      previousStatus:
        firstNonEmptyString(
          existing.status
        ) || "unknown",

      nextStatus
    };
  }

  /* =====================================================
     TURN RECORD CONSTRUCTION
  ===================================================== */

  function createTurnRecord({
    existingTurn,
    currentTurn,
    placement
  }) {
    const existing =
      isObject(existingTurn)
        ? safeClone(existingTurn)
        : {};

    const turnId =
      readCurrentTurnId(
        currentTurn
      );

    const threadId =
      readPlacementThreadId(
        placement
      );

    const parentTurnId =
      readPlacementParentTurnId(
        placement
      );

    const sourceTurnIds =
      readPlacementSourceTurnIds(
        placement
      );

    return {
      ...existing,

      turnId,

      conversationId:
        firstNonEmptyString(
          currentTurn.conversationId,
          existing.conversationId
        ) || null,

      threadId,

      role:
        readRole(currentTurn),

      sequence:
        readSequence(currentTurn),

      parentTurnId:
        parentTurnId || null,

      sourceTurnIds,

      placementType:
        readPlacementType(
          placement
        ),

      timestamp:
        readTurnTimestamp(
          currentTurn
        ),

      registeredAt:
        normalizeTimestamp(
          currentTurn.registeredAt,
          nowIso()
        ),

      stateAppliedAt:
        nowIso()
    };
  }

  /* =====================================================
     THREAD STACK
  ===================================================== */

  function moveThreadToStackTop(
    threadStack,
    threadId
  ) {
    const normalized =
      uniqueStrings(threadStack)
        .filter(
          (candidateThreadId) =>
            candidateThreadId !== threadId
        );

    if (threadId) {
      normalized.push(threadId);
    }

    return normalized;
  }

  function removeThreadFromStack(
    threadStack,
    threadId
  ) {
    return uniqueStrings(
      threadStack
    ).filter(
      (candidateThreadId) =>
        candidateThreadId !== threadId
    );
  }

  /* =====================================================
     INTERRUPTION STACK
  ===================================================== */

  function createInterruptionEntry({
    interruptedThreadId,
    interruptionThreadId,
    interruptionTurnId,
    interruptedTurnId
  }) {
    return {
      interruptedThreadId,
      interruptedTurnId:
        interruptedTurnId || null,

      interruptionThreadId,
      interruptionTurnId,

      createdAt:
        nowIso()
    };
  }

  function pushInterruption({
    state,
    previousActiveThreadId,
    newThreadId,
    currentTurnId,
    previousActiveTurnId
  }) {
    if (
      !previousActiveThreadId ||
      previousActiveThreadId ===
        newThreadId
    ) {
      return null;
    }

    const entry =
      createInterruptionEntry({
        interruptedThreadId:
          previousActiveThreadId,

        interruptionThreadId:
          newThreadId,

        interruptionTurnId:
          currentTurnId,

        interruptedTurnId:
          previousActiveTurnId
      });

    state.interruptionStack.push(
      entry
    );

    return entry;
  }

  function popMatchingInterruption({
    state,
    resumedThreadId
  }) {
    if (
      !Array.isArray(
        state.interruptionStack
      ) ||
      state.interruptionStack.length === 0
    ) {
      return null;
    }

    for (
      let index =
        state.interruptionStack.length - 1;
      index >= 0;
      index -= 1
    ) {
      const entry =
        state.interruptionStack[
          index
        ];

      if (!isObject(entry)) {
        continue;
      }

      const interruptedThreadId =
        firstNonEmptyString(
          entry.interruptedThreadId,
          entry.interrupted_thread_id
        );

      if (
        interruptedThreadId ===
        resumedThreadId
      ) {
        const [removed] =
          state.interruptionStack.splice(
            index,
            1
          );

        return removed;
      }
    }

    return null;
  }

  /* =====================================================
     UNRESOLVED TRANSITION
  ===================================================== */

  function applyUnresolvedTransition({
    state,
    placement,
    referenceResolution,
    currentTurn,
    input
  }) {
    const nextState =
      normalizeState(
        state,
        input.conversationId
      );

    nextState.lastPlacement =
      safeClone(placement);

    nextState.lastReferenceResolution =
      safeClone(
        referenceResolution
      );

    nextState.revision += 1;
    nextState.updatedAt = nowIso();

    return {
      state: nextState,

      transition: {
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        applied: false,

        reason:
          "unresolved_placement",

        placementType:
          "unresolved_placement",

        turnId:
          readCurrentTurnId(
            currentTurn
          ),

        threadId: null,

        previousActiveThreadId:
          state.activeThreadId || null,

        nextActiveThreadId:
          nextState.activeThreadId,

        previousActiveTurnId:
          state.activeTurnId || null,

        nextActiveTurnId:
          nextState.activeTurnId,

        revision:
          nextState.revision,

        transitionedAt:
          nowIso()
      }
    };
  }

  /* =====================================================
     APPLIED TRANSITION
  ===================================================== */

  function applyResolvedTransition({
    state,
    currentTurn,
    placement,
    referenceResolution,
    input
  }) {
    const nextState =
      normalizeState(
        state,
        input.conversationId
      );

    const currentTurnId =
      readCurrentTurnId(
        currentTurn
      );

    const threadId =
      readPlacementThreadId(
        placement
      );

    const placementType =
      readPlacementType(
        placement
      );

    const previousActiveThreadId =
      nextState.activeThreadId;

    const previousActiveTurnId =
      nextState.activeTurnId;

    const previousThreadUpdate =
      updatePreviousThread({
        state:
          nextState,

        previousActiveThreadId,

        newThreadId:
          threadId,

        placementType,

        currentTurnId
      });

    const existingThread =
      readThread(
        nextState,
        threadId
      );

    const nextThread =
      createOrUpdateThread({
        existingThread,

        threadId,

        placement,

        currentTurn,

        previousActiveThreadId
      });

    nextState.threads[
      threadId
    ] = nextThread;

    const existingTurn =
      readTurn(
        nextState,
        currentTurnId
      );

    if (
      existingTurn &&
      existingTurn.threadId &&
      existingTurn.threadId !==
        threadId
    ) {
      throw new CosThreadStateManagerError(
        "COS_THREAD_STATE_TURN_REBIND_FORBIDDEN",
        "A registered turn cannot be rebound to a different thread.",
        {
          details: {
            turnId:
              currentTurnId,

            existingThreadId:
              existingTurn.threadId,

            attemptedThreadId:
              threadId
          }
        }
      );
    }

    nextState.turns[
      currentTurnId
    ] = createTurnRecord({
      existingTurn,
      currentTurn,
      placement
    });

    let interruptionPushed = null;
    let interruptionPopped = null;

    if (
      placementType ===
        "interruption"
    ) {
      interruptionPushed =
        pushInterruption({
          state:
            nextState,

          previousActiveThreadId,

          newThreadId:
            threadId,

          currentTurnId,

          previousActiveTurnId
        });
    }

    if (
      placementType ===
        "resume_thread" ||
      placementType ===
        "return_from_interruption"
    ) {
      interruptionPopped =
        popMatchingInterruption({
          state:
            nextState,

          resumedThreadId:
            threadId
        });
    }

    nextState.activeThreadId =
      threadId;

    nextState.activeTurnId =
      currentTurnId;

    nextState.threadStack =
      moveThreadToStackTop(
        nextState.threadStack,
        threadId
      );

    if (
      previousActiveThreadId &&
      previousActiveThreadId !==
        threadId &&
      placementType ===
        "return_from_interruption"
    ) {
      nextState.threadStack =
        removeThreadFromStack(
          nextState.threadStack,
          previousActiveThreadId
        );

      nextState.threadStack =
        moveThreadToStackTop(
          nextState.threadStack,
          threadId
        );
    }

    nextState.lastPlacement =
      safeClone(placement);

    nextState.lastReferenceResolution =
      safeClone(
        referenceResolution
      );

    nextState.revision += 1;
    nextState.updatedAt = nowIso();

    return {
      state:
        nextState,

      transition: {
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        applied: true,

        placementType,

        turnId:
          currentTurnId,

        threadId,

        parentTurnId:
          readPlacementParentTurnId(
            placement
          ),

        sourceTurnIds:
          readPlacementSourceTurnIds(
            placement
          ),

        previousActiveThreadId:
          previousActiveThreadId ||
          null,

        nextActiveThreadId:
          threadId,

        previousActiveTurnId:
          previousActiveTurnId ||
          null,

        nextActiveTurnId:
          currentTurnId,

        previousThreadUpdate,

        interruptionPushed,

        interruptionPopped,

        threadCreated:
          !existingThread,

        turnCreated:
          !existingTurn,

        revision:
          nextState.revision,

        transitionedAt:
          nowIso()
      }
    };
  }

  /* =====================================================
     OUTPUT VALIDATION
  ===================================================== */

  function validateTransitionResult(
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
              "COS_THREAD_TRANSITION_RESULT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (!isObject(result.state)) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_STATE_MISSING"
      });
    }

    if (!isObject(result.transition)) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_METADATA_MISSING"
      });
    }

    if (
      isObject(result.transition) &&
      typeof result.transition.applied !==
        "boolean"
    ) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_APPLIED_INVALID"
      });
    }

    if (
      isObject(result.state) &&
      !isObject(result.state.threads)
    ) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_THREADS_INVALID"
      });
    }

    if (
      isObject(result.state) &&
      !isObject(result.state.turns)
    ) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_TURNS_INVALID"
      });
    }

    if (
      isObject(result.state) &&
      !Array.isArray(
        result.state.threadStack
      )
    ) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_STACK_INVALID"
      });
    }

    if (
      isObject(result.state) &&
      !Array.isArray(
        result.state.interruptionStack
      )
    ) {
      errors.push({
        code:
          "COS_THREAD_TRANSITION_INTERRUPTION_STACK_INVALID"
      });
    }

    if (
      isObject(result.transition) &&
      result.transition.applied ===
        true
    ) {
      if (
        !isNonEmptyString(
          result.transition.threadId
        )
      ) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_THREAD_ID_MISSING"
        });
      }

      if (
        !isNonEmptyString(
          result.transition.turnId
        )
      ) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_TURN_ID_MISSING"
        });
      }

      if (
        isObject(result.state) &&
        result.state.activeThreadId !==
          result.transition.threadId
      ) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_ACTIVE_THREAD_MISMATCH",

          activeThreadId:
            result.state.activeThreadId,

          transitionThreadId:
            result.transition.threadId
        });
      }

      if (
        isObject(result.state) &&
        result.state.activeTurnId !==
          result.transition.turnId
      ) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_ACTIVE_TURN_MISMATCH",

          activeTurnId:
            result.state.activeTurnId,

          transitionTurnId:
            result.transition.turnId
        });
      }

      const thread =
        result.state &&
        result.state.threads
          ? result.state.threads[
              result.transition.threadId
            ]
          : null;

      if (!isObject(thread)) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_THREAD_RECORD_MISSING"
        });
      } else if (
        !threadContainsTurn(
          thread,
          result.transition.turnId
        )
      ) {
        errors.push({
          code:
            "COS_THREAD_TRANSITION_TURN_NOT_IN_THREAD"
        });
      }
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  /* =====================================================
     PUBLIC TRANSITION
  ===================================================== */

  function transition(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeTransitionInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const validation =
      validateTransitionInput(
        input
      );

    if (!validation.valid) {
      throw new CosThreadStateManagerError(
        "COS_THREAD_STATE_INPUT_INVALID",
        "Thread-state transition input failed validation.",
        {
          details:
            validation
        }
      );
    }

    const placementType =
      readPlacementType(
        input.placement
      );

    const currentState =
      normalizeState(
        input.state,
        input.conversationId
      );

    let result;

    if (
      placementType ===
        "unresolved_placement"
    ) {
      result =
        applyUnresolvedTransition({
          state:
            currentState,

          placement:
            input.placement,

          referenceResolution:
            input.referenceResolution,

          currentTurn:
            input.currentTurn,

          input
        });
    } else {
      result =
        applyResolvedTransition({
          state:
            currentState,

          currentTurn:
            input.currentTurn,

          placement:
            input.placement,

          referenceResolution:
            input.referenceResolution,

          input
        });
    }

    result.transition.diagnostics = {
      valid: true,

      warningCount:
        validation.warnings.length,

      warnings:
        validation.warnings
    };

    const resultValidation =
      validateTransitionResult(
        result
      );

    if (!resultValidation.valid) {
      throw new CosThreadStateManagerError(
        "COS_THREAD_STATE_RESULT_INVALID",
        "Thread-state transition result failed validation.",
        {
          details:
            resultValidation
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

  const cosThreadStateManager = {
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

    appliedPlacementTypes:
      APPLIED_PLACEMENT_TYPES,

    threadStatuses:
      THREAD_STATUSES,

    CosThreadStateManagerError,

    transition,

    apply:
      transition,

    update:
      transition,

    updateState:
      transition,

    run:
      transition,

    validateInput:
      validateTransitionInput,

    validate:
      validateTransitionResult,

    normalizeInput:
      normalizeTransitionInput
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.threadStateManager =
    cosThreadStateManager;

  ConversationOS.cosThreadStateManager =
    cosThreadStateManager;

  root.AriCosThreadStateManager =
    cosThreadStateManager;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosThreadStateManager;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);