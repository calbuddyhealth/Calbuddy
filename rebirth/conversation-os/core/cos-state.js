// rebirth/conversation-os/core/cos-state.js
// ARI Rebirth — Conversation Operating System State
//
// Purpose:
// Define, normalize, validate, clone, and expose the canonical persistent
// state structure owned by the Conversation Operating System.
//
// V2.0.0 — Expanded Canonical COS State
//
// Canonical state domains:
//
// - conversation identity
// - turn records
// - thread records
// - active thread and turn
// - thread stack
// - interruption stack
// - last placement
// - last reference resolution
// - pending interaction state
// - artifact state
// - delivery sequence state
// - revision and lifecycle metadata
//
// Authority:
//
// This component is authoritative only for:
//
// - defining canonical COS state shape,
// - creating empty COS state,
// - normalizing supplied COS state,
// - validating COS state,
// - preserving exact turn and thread records,
// - preserving auxiliary continuity state,
// - cloning and freezing COS state,
// - exposing safe state queries.
//
// Non-authority:
//
// This component must not:
//
// - interpret raw language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve references,
// - determine placement,
// - invent missing relationships,
// - generate responses.
//
// Architectural rule:
//
// State preserves structural truth produced by authoritative COS components.
//
// State normalization may create required empty containers.
// It may not guess missing conversational relationships.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.state
//
// CommonJS:
//
// module.exports = cosState

(function initializeCosState(globalScope) {
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

  const VERSION = "2.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-state";

  const STATE_TYPE =
    "conversation_operating_system_state";

  const THREAD_STATUSES = Object.freeze([
    "active",
    "inactive",
    "paused",
    "interrupted",
    "completed",
    "cancelled",
    "archived"
  ]);

  const TURN_ROLES = Object.freeze([
    "system",
    "developer",
    "user",
    "assistant",
    "tool",
    "function",
    "unknown"
  ]);

  const PLACEMENT_TYPES = Object.freeze([
    "new_thread",
    "continue_thread",
    "answer_to_turn",
    "clarification_of_turn",
    "correction_of_turn",
    "branch_from_turn",
    "interruption",
    "return_from_interruption",
    "resume_thread",
    "unresolved_placement"
  ]);

  const REFERENCE_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "ambiguous",
    "unresolved"
  ]);

  const REQUIRED_STATE_KEYS = Object.freeze([
    "schemaVersion",
    "authority",
    "component",
    "stateType",
    "conversationId",
    "revision",
    "activeThreadId",
    "activeTurnId",
    "threads",
    "turns",
    "threadStack",
    "interruptionStack",
    "lastPlacement",
    "lastReferenceResolution",
    "pendingInteractionState",
    "artifactState",
    "deliverySequenceState",
    "createdAt",
    "updatedAt"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosStateError extends Error {
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
        "COS state error"
      );

      this.name =
        "CosStateError";

      this.code =
        code ||
        "COS_STATE_ERROR";

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
          CosStateError
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
    const numeric =
      Number(value);

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
      const parsed =
        new Date(value);

      if (
        !Number.isNaN(
          parsed.getTime()
        )
      ) {
        return parsed.toISOString();
      }
    }

    if (isNonEmptyString(value)) {
      const parsed =
        new Date(value);

      if (
        !Number.isNaN(
          parsed.getTime()
        )
      ) {
        return parsed.toISOString();
      }
    }

    return fallback;
  }

  function uniqueStrings(values = []) {
    const output = [];
    const seen = new Set();

    for (
      const value of asArray(values)
    ) {
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

  function hasOwn(
    object,
    property
  ) {
    return Object.prototype
      .hasOwnProperty
      .call(
        object,
        property
      );
  }

  function createDictionary() {
    return Object.create(null);
  }

  /* =====================================================
     AUXILIARY COMPONENT DISCOVERY
  ===================================================== */

  function resolvePendingInteractionManager() {
    return (
      ConversationOS
        .pendingInteractionManager ||
      ConversationOS
        .cosPendingInteractionManager ||
      null
    );
  }

  function resolveArtifactRegister() {
    return (
      ConversationOS.artifactRegister ||
      ConversationOS.cosArtifactRegister ||
      null
    );
  }

  function resolveDeliverySequenceManager() {
    return (
      ConversationOS
        .deliverySequenceManager ||
      ConversationOS
        .cosDeliverySequenceManager ||
      null
    );
  }

  /* =====================================================
     EMPTY AUXILIARY STATES
  ===================================================== */

  function createEmptyPendingInteractionState(
    conversationId = null
  ) {
    const manager =
      resolvePendingInteractionManager();

    if (
      manager &&
      typeof manager.createEmptyState ===
        "function"
    ) {
      return safeClone(
        manager.createEmptyState({
          conversationId
        })
      );
    }

    const timestamp =
      nowIso();

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_pending_interaction_state",

      conversationId,

      revision: 0,

      activeInteractionId:
        null,

      interactions:
        createDictionary(),

      order: [],

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyArtifactState(
    conversationId = null
  ) {
    const register =
      resolveArtifactRegister();

    if (
      register &&
      typeof register.createEmptyState ===
        "function"
    ) {
      return safeClone(
        register.createEmptyState({
          conversationId
        })
      );
    }

    const timestamp =
      nowIso();

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_artifact_state",

      conversationId,

      revision: 0,

      activeArtifactId:
        null,

      artifacts:
        createDictionary(),

      order: [],

      byFilePath:
        createDictionary(),

      bySourceTurnId:
        createDictionary(),

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyDeliverySequenceState(
    conversationId = null
  ) {
    const manager =
      resolveDeliverySequenceManager();

    if (
      manager &&
      typeof manager.createEmptyState ===
        "function"
    ) {
      return safeClone(
        manager.createEmptyState({
          conversationId
        })
      );
    }

    const timestamp =
      nowIso();

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_delivery_sequence_state",

      conversationId,

      revision: 0,

      activeSequenceId:
        null,

      sequences:
        createDictionary(),

      order: [],

      byArtifactId:
        createDictionary(),

      bySourceTurnId:
        createDictionary(),

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  /* =====================================================
     TURN NORMALIZATION
  ===================================================== */

  function normalizeTurnRecord(
    rawTurn,
    fallbackTurnId = null
  ) {
    const source =
      isObject(rawTurn)
        ? safeClone(rawTurn)
        : {};

    const turnId =
      firstNonEmptyString(
        source.turnId,
        source.turn_id,
        source.id,
        source.messageId,
        source.message_id,
        fallbackTurnId
      );

    const role =
      firstNonEmptyString(
        source.role,
        source.speaker,
        source.authorRole,
        source.author_role
      ) || "unknown";

    const normalizedRole =
      TURN_ROLES.includes(role)
        ? role
        : "unknown";

    return {
      ...source,

      turnId:
        turnId || null,

      threadId:
        firstNonEmptyString(
          source.threadId,
          source.thread_id,
          source.conversationThreadId,
          source.conversation_thread_id
        ) || null,

      parentTurnId:
        firstNonEmptyString(
          source.parentTurnId,
          source.parent_turn_id
        ) || null,

      replyToTurnId:
        firstNonEmptyString(
          source.replyToTurnId,
          source.reply_to_turn_id
        ) || null,

      sourceTurnIds:
        uniqueStrings(
          firstDefined(
            source.sourceTurnIds,
            source.source_turn_ids,
            source.referenceTurnIds,
            source.reference_turn_ids,
            []
          )
        ),

      role:
        normalizedRole,

      sequence:
        normalizeInteger(
          firstDefined(
            source.sequence,
            source.turnSequence,
            source.turn_sequence,
            source.turnIndex,
            source.turn_index,
            source.index
          ),
          0
        ),

      timestamp:
        normalizeTimestamp(
          firstDefined(
            source.timestamp,
            source.createdAt,
            source.created_at,
            source.time
          ),
          null
        ),

      placementType:
        firstNonEmptyString(
          source.placementType,
          source.placement_type
        ) || null,

      registeredAt:
        normalizeTimestamp(
          firstDefined(
            source.registeredAt,
            source.registered_at
          ),
          null
        )
    };
  }

  function normalizeTurnMap(
    rawTurns
  ) {
    const output =
      createDictionary();

    if (Array.isArray(rawTurns)) {
      rawTurns.forEach(
        (turn, index) => {
          const normalized =
            normalizeTurnRecord(
              turn,
              `turn_${index}`
            );

          if (normalized.turnId) {
            output[
              normalized.turnId
            ] = normalized;
          }
        }
      );

      return output;
    }

    if (isObject(rawTurns)) {
      for (
        const [
          turnId,
          turn
        ] of Object.entries(
          rawTurns
        )
      ) {
        const normalized =
          normalizeTurnRecord(
            turn,
            turnId
          );

        if (normalized.turnId) {
          output[
            normalized.turnId
          ] = normalized;
        }
      }
    }

    return output;
  }

  /* =====================================================
     THREAD NORMALIZATION
  ===================================================== */

  function normalizeThreadStatus(
    value
  ) {
    return THREAD_STATUSES.includes(
      value
    )
      ? value
      : "inactive";
  }

  function normalizeThreadRecord(
    rawThread,
    fallbackThreadId = null
  ) {
    const source =
      isObject(rawThread)
        ? safeClone(rawThread)
        : {};

    const threadId =
      firstNonEmptyString(
        source.threadId,
        source.thread_id,
        source.id,
        fallbackThreadId
      );

    const turnIds =
      uniqueStrings(
        firstDefined(
          source.turnIds,
          source.turn_ids,
          source.turns,
          []
        )
      );

    return {
      ...source,

      threadId:
        threadId || null,

      status:
        normalizeThreadStatus(
          firstNonEmptyString(
            source.status
          ) ||
          "inactive"
        ),

      turnIds,

      firstTurnId:
        firstNonEmptyString(
          source.firstTurnId,
          source.first_turn_id,
          turnIds[0]
        ) || null,

      lastTurnId:
        firstNonEmptyString(
          source.lastTurnId,
          source.last_turn_id,
          turnIds.length > 0
            ? turnIds[
                turnIds.length - 1
              ]
            : null
        ) || null,

      parentThreadId:
        firstNonEmptyString(
          source.parentThreadId,
          source.parent_thread_id
        ) || null,

      originTurnId:
        firstNonEmptyString(
          source.originTurnId,
          source.origin_turn_id
        ) || null,

      branchOriginTurnId:
        firstNonEmptyString(
          source.branchOriginTurnId,
          source.branch_origin_turn_id
        ) || null,

      interruptedThreadId:
        firstNonEmptyString(
          source.interruptedThreadId,
          source.interrupted_thread_id
        ) || null,

      interruptionOriginTurnId:
        firstNonEmptyString(
          source.interruptionOriginTurnId,
          source.interruption_origin_turn_id
        ) || null,

      resumedFromThreadId:
        firstNonEmptyString(
          source.resumedFromThreadId,
          source.resumed_from_thread_id
        ) || null,

      createdAt:
        normalizeTimestamp(
          firstDefined(
            source.createdAt,
            source.created_at
          ),
          null
        ),

      updatedAt:
        normalizeTimestamp(
          firstDefined(
            source.updatedAt,
            source.updated_at
          ),
          null
        )
    };
  }

  function normalizeThreadMap(
    rawThreads
  ) {
    const output =
      createDictionary();

    if (Array.isArray(rawThreads)) {
      rawThreads.forEach(
        (thread, index) => {
          const normalized =
            normalizeThreadRecord(
              thread,
              `thread_${index}`
            );

          if (normalized.threadId) {
            output[
              normalized.threadId
            ] = normalized;
          }
        }
      );

      return output;
    }

    if (isObject(rawThreads)) {
      for (
        const [
          threadId,
          thread
        ] of Object.entries(
          rawThreads
        )
      ) {
        const normalized =
          normalizeThreadRecord(
            thread,
            threadId
          );

        if (normalized.threadId) {
          output[
            normalized.threadId
          ] = normalized;
        }
      }
    }

    return output;
  }

  /* =====================================================
     INTERRUPTION NORMALIZATION
  ===================================================== */

  function normalizeInterruptionRecord(
    rawEntry
  ) {
    const source =
      isObject(rawEntry)
        ? safeClone(rawEntry)
        : {};

    return {
      ...source,

      interruptionId:
        firstNonEmptyString(
          source.interruptionId,
          source.interruption_id,
          source.id
        ) || null,

      interruptedThreadId:
        firstNonEmptyString(
          source.interruptedThreadId,
          source.interrupted_thread_id
        ) || null,

      interruptionThreadId:
        firstNonEmptyString(
          source.interruptionThreadId,
          source.interruption_thread_id
        ) || null,

      interruptedTurnId:
        firstNonEmptyString(
          source.interruptedTurnId,
          source.interrupted_turn_id
        ) || null,

      interruptionTurnId:
        firstNonEmptyString(
          source.interruptionTurnId,
          source.interruption_turn_id
        ) || null,

      resumeTargetTurnId:
        firstNonEmptyString(
          source.resumeTargetTurnId,
          source.resume_target_turn_id
        ) || null,

      createdAt:
        normalizeTimestamp(
          firstDefined(
            source.createdAt,
            source.created_at
          ),
          null
        ),

      returnedAt:
        normalizeTimestamp(
          firstDefined(
            source.returnedAt,
            source.returned_at
          ),
          null
        )
    };
  }

  function normalizeInterruptionStack(
    rawStack
  ) {
    return asArray(rawStack)
      .filter(isObject)
      .map(
        normalizeInterruptionRecord
      );
  }

  /* =====================================================
     PLACEMENT NORMALIZATION
  ===================================================== */

  function normalizePlacement(
    rawPlacement
  ) {
    if (!isObject(rawPlacement)) {
      return null;
    }

    const type =
      firstNonEmptyString(
        rawPlacement.type,
        rawPlacement.placementType,
        rawPlacement.placement_type
      );

    return {
      ...safeClone(rawPlacement),

      type:
        PLACEMENT_TYPES.includes(type)
          ? type
          : type || null,

      threadId:
        firstNonEmptyString(
          rawPlacement.threadId,
          rawPlacement.thread_id
        ) || null,

      parentTurnId:
        firstNonEmptyString(
          rawPlacement.parentTurnId,
          rawPlacement.parent_turn_id
        ) || null,

      sourceTurnIds:
        uniqueStrings(
          firstDefined(
            rawPlacement.sourceTurnIds,
            rawPlacement.source_turn_ids,
            []
          )
        )
    };
  }

  function normalizeReferenceResolution(
    rawResolution
  ) {
    if (!isObject(rawResolution)) {
      return null;
    }

    const status =
      firstNonEmptyString(
        rawResolution.status
      );

    return {
      ...safeClone(rawResolution),

      status:
        REFERENCE_STATUSES.includes(
          status
        )
          ? status
          : status || null,

      resolvedTurnIds:
        uniqueStrings(
          firstDefined(
            rawResolution.resolvedTurnIds,
            rawResolution.resolved_turn_ids,
            []
          )
        ),

      unresolvedReferences:
        Array.isArray(
          rawResolution
            .unresolvedReferences
        )
          ? safeClone(
              rawResolution
                .unresolvedReferences
            )
          : Array.isArray(
              rawResolution
                .unresolved_references
            )
            ? safeClone(
                rawResolution
                  .unresolved_references
              )
            : []
    };
  }

  /* =====================================================
     AUXILIARY STATE NORMALIZATION
  ===================================================== */

  function normalizePendingInteractionState(
    rawState,
    conversationId
  ) {
    const manager =
      resolvePendingInteractionManager();

    if (
      manager &&
      typeof manager.normalizeState ===
        "function"
    ) {
      return safeClone(
        manager.normalizeState(
          rawState,
          conversationId
        )
      );
    }

    const empty =
      createEmptyPendingInteractionState(
        conversationId
      );

    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    return {
      ...empty,
      ...source,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_pending_interaction_state",

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

      activeInteractionId:
        firstNonEmptyString(
          source.activeInteractionId,
          source.active_interaction_id
        ) || null,

      interactions:
        isObject(source.interactions)
          ? source.interactions
          : createDictionary(),

      order:
        uniqueStrings(
          firstDefined(
            source.order,
            source.interactionOrder,
            source.interaction_order,
            Object.keys(
              source.interactions || {}
            )
          )
        ),

      updatedAt:
        normalizeTimestamp(
          source.updatedAt,
          nowIso()
        )
    };
  }

  function normalizeArtifactState(
    rawState,
    conversationId
  ) {
    const register =
      resolveArtifactRegister();

    if (
      register &&
      typeof register.normalizeState ===
        "function"
    ) {
      return safeClone(
        register.normalizeState(
          rawState,
          conversationId
        )
      );
    }

    const empty =
      createEmptyArtifactState(
        conversationId
      );

    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    return {
      ...empty,
      ...source,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_artifact_state",

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

      activeArtifactId:
        firstNonEmptyString(
          source.activeArtifactId,
          source.active_artifact_id
        ) || null,

      artifacts:
        isObject(source.artifacts)
          ? source.artifacts
          : createDictionary(),

      order:
        uniqueStrings(
          firstDefined(
            source.order,
            source.artifactOrder,
            source.artifact_order,
            Object.keys(
              source.artifacts || {}
            )
          )
        ),

      byFilePath:
        isObject(source.byFilePath)
          ? source.byFilePath
          : isObject(
              source.by_file_path
            )
            ? source.by_file_path
            : createDictionary(),

      bySourceTurnId:
        isObject(
          source.bySourceTurnId
        )
          ? source.bySourceTurnId
          : isObject(
              source.by_source_turn_id
            )
            ? source.by_source_turn_id
            : createDictionary(),

      updatedAt:
        normalizeTimestamp(
          source.updatedAt,
          nowIso()
        )
    };
  }

  function normalizeDeliverySequenceState(
    rawState,
    conversationId
  ) {
    const manager =
      resolveDeliverySequenceManager();

    if (
      manager &&
      typeof manager.normalizeState ===
        "function"
    ) {
      return safeClone(
        manager.normalizeState(
          rawState,
          conversationId
        )
      );
    }

    const empty =
      createEmptyDeliverySequenceState(
        conversationId
      );

    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    return {
      ...empty,
      ...source,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_delivery_sequence_state",

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

      activeSequenceId:
        firstNonEmptyString(
          source.activeSequenceId,
          source.active_sequence_id
        ) || null,

      sequences:
        isObject(source.sequences)
          ? source.sequences
          : createDictionary(),

      order:
        uniqueStrings(
          firstDefined(
            source.order,
            source.sequenceOrder,
            source.sequence_order,
            Object.keys(
              source.sequences || {}
            )
          )
        ),

      byArtifactId:
        isObject(source.byArtifactId)
          ? source.byArtifactId
          : isObject(
              source.by_artifact_id
            )
            ? source.by_artifact_id
            : createDictionary(),

      bySourceTurnId:
        isObject(
          source.bySourceTurnId
        )
          ? source.bySourceTurnId
          : isObject(
              source.by_source_turn_id
            )
            ? source.by_source_turn_id
            : createDictionary(),

      updatedAt:
        normalizeTimestamp(
          source.updatedAt,
          nowIso()
        )
    };
  }

  /* =====================================================
     CREATE EMPTY STATE
  ===================================================== */

  function create(
    input = {},
    options = {}
  ) {
    const source =
      isObject(input)
        ? input
        : {
            conversationId:
              input
          };

    const conversationId =
      firstNonEmptyString(
        source.conversationId,
        source.conversation_id,
        options.conversationId,
        options.conversation_id
      ) || null;

    const timestamp =
      nowIso();

    const state = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      stateType:
        STATE_TYPE,

      conversationId,

      revision: 0,

      activeThreadId: null,
      activeTurnId: null,

      threads:
        createDictionary(),

      turns:
        createDictionary(),

      threadStack: [],

      interruptionStack: [],

      lastPlacement: null,

      lastReferenceResolution:
        null,

      pendingInteractionState:
        createEmptyPendingInteractionState(
          conversationId
        ),

      artifactState:
        createEmptyArtifactState(
          conversationId
        ),

      deliverySequenceState:
        createEmptyDeliverySequenceState(
          conversationId
        ),

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };

    return options.freeze === false
      ? state
      : freezeClone(state);
  }

  /* =====================================================
     NORMALIZE STATE
  ===================================================== */

  function normalize(
    rawState = {},
    options = {}
  ) {
    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    const conversationId =
      firstNonEmptyString(
        source.conversationId,
        source.conversation_id,
        options.conversationId,
        options.conversation_id
      ) || null;

    const timestamp =
      nowIso();

    const normalized = {
      ...source,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      stateType:
        STATE_TYPE,

      conversationId,

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
        normalizeThreadMap(
          firstDefined(
            source.threads,
            source.threadMap,
            source.thread_map,
            {}
          )
        ),

      turns:
        normalizeTurnMap(
          firstDefined(
            source.turns,
            source.turnMap,
            source.turn_map,
            {}
          )
        ),

      threadStack:
        uniqueStrings(
          firstDefined(
            source.threadStack,
            source.thread_stack,
            []
          )
        ),

      interruptionStack:
        normalizeInterruptionStack(
          firstDefined(
            source.interruptionStack,
            source.interruption_stack,
            []
          )
        ),

      lastPlacement:
        normalizePlacement(
          firstDefined(
            source.lastPlacement,
            source.last_placement
          )
        ),

      lastReferenceResolution:
        normalizeReferenceResolution(
          firstDefined(
            source.lastReferenceResolution,
            source.last_reference_resolution
          )
        ),

      pendingInteractionState:
        normalizePendingInteractionState(
          firstDefined(
            source.pendingInteractionState,
            source.pending_interaction_state,
            source.pendingInteractions,
            source.pending_interactions,
            {}
          ),
          conversationId
        ),

      artifactState:
        normalizeArtifactState(
          firstDefined(
            source.artifactState,
            source.artifact_state,
            source.artifactsState,
            source.artifacts_state,
            {}
          ),
          conversationId
        ),

      deliverySequenceState:
        normalizeDeliverySequenceState(
          firstDefined(
            source.deliverySequenceState,
            source.delivery_sequence_state,
            source.sequenceState,
            source.sequence_state,
            {}
          ),
          conversationId
        ),

      createdAt:
        normalizeTimestamp(
          firstDefined(
            source.createdAt,
            source.created_at
          ),
          timestamp
        ),

      updatedAt:
        normalizeTimestamp(
          firstDefined(
            source.updatedAt,
            source.updated_at
          ),
          timestamp
        )
    };

    if (
      normalized.activeThreadId &&
      !normalized.threadStack.includes(
        normalized.activeThreadId
      )
    ) {
      normalized.threadStack.push(
        normalized.activeThreadId
      );
    }

    return options.freeze === false
      ? normalized
      : freezeClone(normalized);
  }

  /* =====================================================
     COPY / REVISION
  ===================================================== */

  function clone(
    state,
    options = {}
  ) {
    const normalized =
      normalize(
        state,
        {
          ...options,
          freeze: false
        }
      );

    return options.freeze === false
      ? normalized
      : freezeClone(normalized);
  }

  function incrementRevision(
    state,
    options = {}
  ) {
    const next =
      normalize(
        state,
        {
          freeze: false
        }
      );

    next.revision += 1;
    next.updatedAt = nowIso();

    return options.freeze === false
      ? next
      : freezeClone(next);
  }

  function withPatch(
    state,
    patch = {},
    options = {}
  ) {
    const source =
      normalize(
        state,
        {
          freeze: false
        }
      );

    const next =
      normalize(
        {
          ...source,

          ...(
            isObject(patch)
              ? safeClone(patch)
              : {}
          ),

          revision:
            options.incrementRevision ===
            false
              ? source.revision
              : source.revision + 1,

          updatedAt:
            nowIso()
        },
        {
          freeze: false
        }
      );

    return options.freeze === false
      ? next
      : freezeClone(next);
  }

  /* =====================================================
     VALIDATION — TURN
  ===================================================== */

  function validateTurn(
    turn,
    state = null
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(turn)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_TURN_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        turn.turnId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_ID_MISSING"
      });
    }

    if (
      !TURN_ROLES.includes(
        turn.role
      )
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_ROLE_INVALID",

        turnId:
          turn.turnId,

        role:
          turn.role
      });
    }

    if (
      !Number.isInteger(
        turn.sequence
      )
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_SEQUENCE_INVALID",

        turnId:
          turn.turnId,

        sequence:
          turn.sequence
      });
    }

    if (
      !Array.isArray(
        turn.sourceTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_SOURCE_IDS_INVALID",

        turnId:
          turn.turnId
      });
    }

    if (
      turn.parentTurnId ===
      turn.turnId
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_SELF_PARENT",

        turnId:
          turn.turnId
      });
    }

    if (
      turn.replyToTurnId ===
      turn.turnId
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_SELF_REPLY",

        turnId:
          turn.turnId
      });
    }

    if (
      Array.isArray(
        turn.sourceTurnIds
      ) &&
      turn.sourceTurnIds.includes(
        turn.turnId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_TURN_SELF_SOURCE",

        turnId:
          turn.turnId
      });
    }

    if (
      state &&
      turn.threadId &&
      !hasOwn(
        state.threads,
        turn.threadId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_TURN_THREAD_UNRESOLVED",

        turnId:
          turn.turnId,

        threadId:
          turn.threadId
      });
    }

    if (
      state &&
      turn.parentTurnId &&
      !hasOwn(
        state.turns,
        turn.parentTurnId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_TURN_PARENT_UNRESOLVED",

        turnId:
          turn.turnId,

        parentTurnId:
          turn.parentTurnId
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
     VALIDATION — THREAD
  ===================================================== */

  function validateThread(
    thread,
    state = null
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(thread)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_THREAD_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        thread.threadId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_ID_MISSING"
      });
    }

    if (
      !THREAD_STATUSES.includes(
        thread.status
      )
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_STATUS_INVALID",

        threadId:
          thread.threadId,

        status:
          thread.status
      });
    }

    if (
      !Array.isArray(
        thread.turnIds
      )
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_TURN_IDS_INVALID",

        threadId:
          thread.threadId
      });
    }

    if (
      thread.parentThreadId ===
      thread.threadId
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_SELF_PARENT",

        threadId:
          thread.threadId
      });
    }

    if (
      thread.interruptedThreadId ===
      thread.threadId
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_SELF_INTERRUPTION",

        threadId:
          thread.threadId
      });
    }

    if (
      Array.isArray(thread.turnIds) &&
      thread.turnIds.length > 0
    ) {
      if (
        thread.firstTurnId !==
        thread.turnIds[0]
      ) {
        warnings.push({
          code:
            "COS_STATE_THREAD_FIRST_TURN_MISMATCH",

          threadId:
            thread.threadId,

          firstTurnId:
            thread.firstTurnId,

          expected:
            thread.turnIds[0]
        });
      }

      if (
        thread.lastTurnId !==
        thread.turnIds[
          thread.turnIds.length - 1
        ]
      ) {
        warnings.push({
          code:
            "COS_STATE_THREAD_LAST_TURN_MISMATCH",

          threadId:
            thread.threadId,

          lastTurnId:
            thread.lastTurnId,

          expected:
            thread.turnIds[
              thread.turnIds.length - 1
            ]
        });
      }
    }

    if (
      state &&
      Array.isArray(thread.turnIds)
    ) {
      for (
        const turnId of
          thread.turnIds
      ) {
        if (
          !hasOwn(
            state.turns,
            turnId
          )
        ) {
          warnings.push({
            code:
              "COS_STATE_THREAD_TURN_UNRESOLVED",

            threadId:
              thread.threadId,

            turnId
          });
        }
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
     VALIDATION — INTERRUPTION
  ===================================================== */

  function validateInterruption(
    entry,
    index = -1
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(entry)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_INTERRUPTION_NOT_OBJECT",

            index
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        entry.interruptedThreadId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_INTERRUPTED_THREAD_ID_MISSING",

        index
      });
    }

    if (
      !isNonEmptyString(
        entry.interruptionThreadId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_INTERRUPTION_THREAD_ID_MISSING",

        index
      });
    }

    if (
      entry.interruptedThreadId &&
      entry.interruptionThreadId &&
      entry.interruptedThreadId ===
        entry.interruptionThreadId
    ) {
      errors.push({
        code:
          "COS_STATE_INTERRUPTION_THREAD_COLLISION",

        index,

        threadId:
          entry.interruptedThreadId
      });
    }

    if (
      !entry.interruptedTurnId
    ) {
      warnings.push({
        code:
          "COS_STATE_INTERRUPTED_TURN_ID_MISSING",

        index
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
     AUXILIARY VALIDATION
  ===================================================== */

  function validateAuxiliaryState(
    component,
    state,
    fallbackValidator
  ) {
    if (
      component &&
      typeof component.validateState ===
        "function"
    ) {
      return component.validateState(
        state
      );
    }

    if (
      component &&
      typeof component.validate ===
        "function"
    ) {
      return component.validate(
        state
      );
    }

    return fallbackValidator(state);
  }

  function fallbackValidatePendingInteractionState(
    state
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(state)) {
      errors.push({
        code:
          "COS_STATE_PENDING_INTERACTION_STATE_INVALID"
      });

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      !isObject(
        state.interactions
      )
    ) {
      errors.push({
        code:
          "COS_STATE_PENDING_INTERACTION_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.order
      )
    ) {
      errors.push({
        code:
          "COS_STATE_PENDING_INTERACTION_ORDER_INVALID"
      });
    }

    if (
      state.activeInteractionId &&
      (
        !isObject(state.interactions) ||
        !hasOwn(
          state.interactions,
          state.activeInteractionId
        )
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ACTIVE_INTERACTION_MISSING",

        activeInteractionId:
          state.activeInteractionId
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function fallbackValidateArtifactState(
    state
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(state)) {
      errors.push({
        code:
          "COS_STATE_ARTIFACT_STATE_INVALID"
      });

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      !isObject(state.artifacts)
    ) {
      errors.push({
        code:
          "COS_STATE_ARTIFACT_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.order
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ARTIFACT_ORDER_INVALID"
      });
    }

    if (
      state.activeArtifactId &&
      (
        !isObject(state.artifacts) ||
        !hasOwn(
          state.artifacts,
          state.activeArtifactId
        )
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ACTIVE_ARTIFACT_MISSING",

        activeArtifactId:
          state.activeArtifactId
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function fallbackValidateDeliverySequenceState(
    state
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(state)) {
      errors.push({
        code:
          "COS_STATE_DELIVERY_SEQUENCE_STATE_INVALID"
      });

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      !isObject(state.sequences)
    ) {
      errors.push({
        code:
          "COS_STATE_DELIVERY_SEQUENCE_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.order
      )
    ) {
      errors.push({
        code:
          "COS_STATE_DELIVERY_SEQUENCE_ORDER_INVALID"
      });
    }

    if (
      state.activeSequenceId &&
      (
        !isObject(state.sequences) ||
        !hasOwn(
          state.sequences,
          state.activeSequenceId
        )
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ACTIVE_DELIVERY_SEQUENCE_MISSING",

        activeSequenceId:
          state.activeSequenceId
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
     FULL STATE VALIDATION
  ===================================================== */

  function validateState(
    rawState
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(rawState)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    const state =
      normalize(
        rawState,
        {
          freeze: false
        }
      );

    for (
      const requiredKey of
        REQUIRED_STATE_KEYS
    ) {
      if (
        !hasOwn(
          state,
          requiredKey
        )
      ) {
        errors.push({
          code:
            "COS_STATE_REQUIRED_KEY_MISSING",

          key:
            requiredKey
        });
      }
    }

    if (
      state.schemaVersion !==
      SCHEMA_VERSION
    ) {
      errors.push({
        code:
          "COS_STATE_SCHEMA_VERSION_INVALID",

        expected:
          SCHEMA_VERSION,

        actual:
          state.schemaVersion
      });
    }

    if (
      state.authority !==
      AUTHORITY
    ) {
      errors.push({
        code:
          "COS_STATE_AUTHORITY_INVALID",

        expected:
          AUTHORITY,

        actual:
          state.authority
      });
    }

    if (
      state.stateType !==
      STATE_TYPE
    ) {
      errors.push({
        code:
          "COS_STATE_TYPE_INVALID",

        expected:
          STATE_TYPE,

        actual:
          state.stateType
      });
    }

    if (
      !Number.isInteger(
        state.revision
      ) ||
      state.revision < 0
    ) {
      errors.push({
        code:
          "COS_STATE_REVISION_INVALID",

        revision:
          state.revision
      });
    }

    if (!isObject(state.threads)) {
      errors.push({
        code:
          "COS_STATE_THREADS_INVALID"
      });
    }

    if (!isObject(state.turns)) {
      errors.push({
        code:
          "COS_STATE_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.threadStack
      )
    ) {
      errors.push({
        code:
          "COS_STATE_THREAD_STACK_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.interruptionStack
      )
    ) {
      errors.push({
        code:
          "COS_STATE_INTERRUPTION_STACK_INVALID"
      });
    }

    if (
      state.activeThreadId &&
      !hasOwn(
        state.threads,
        state.activeThreadId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ACTIVE_THREAD_MISSING",

        activeThreadId:
          state.activeThreadId
      });
    }

    if (
      state.activeTurnId &&
      !hasOwn(
        state.turns,
        state.activeTurnId
      )
    ) {
      errors.push({
        code:
          "COS_STATE_ACTIVE_TURN_MISSING",

        activeTurnId:
          state.activeTurnId
      });
    }

    if (
      state.activeThreadId &&
      !state.threadStack.includes(
        state.activeThreadId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_ACTIVE_THREAD_NOT_IN_STACK",

        activeThreadId:
          state.activeThreadId
      });
    }

    if (
      isObject(state.turns)
    ) {
      for (
        const [
          turnId,
          turn
        ] of Object.entries(
          state.turns
        )
      ) {
        const validation =
          validateTurn(
            turn,
            state
          );

        for (
          const error of
            validation.errors
        ) {
          errors.push({
            turnId,
            ...error
          });
        }

        for (
          const warning of
            validation.warnings
        ) {
          warnings.push({
            turnId,
            ...warning
          });
        }
      }
    }

    if (
      isObject(state.threads)
    ) {
      for (
        const [
          threadId,
          thread
        ] of Object.entries(
          state.threads
        )
      ) {
        const validation =
          validateThread(
            thread,
            state
          );

        for (
          const error of
            validation.errors
        ) {
          errors.push({
            threadId,
            ...error
          });
        }

        for (
          const warning of
            validation.warnings
        ) {
          warnings.push({
            threadId,
            ...warning
          });
        }
      }
    }

    state.interruptionStack.forEach(
      (entry, index) => {
        const validation =
          validateInterruption(
            entry,
            index
          );

        errors.push(
          ...validation.errors
        );

        warnings.push(
          ...validation.warnings
        );
      }
    );

    const pendingValidation =
      validateAuxiliaryState(
        resolvePendingInteractionManager(),
        state.pendingInteractionState,
        fallbackValidatePendingInteractionState
      );

    for (
      const error of
        pendingValidation.errors || []
    ) {
      errors.push({
        domain:
          "pendingInteractionState",

        ...error
      });
    }

    for (
      const warning of
        pendingValidation.warnings || []
    ) {
      warnings.push({
        domain:
          "pendingInteractionState",

        ...warning
      });
    }

    const artifactValidation =
      validateAuxiliaryState(
        resolveArtifactRegister(),
        state.artifactState,
        fallbackValidateArtifactState
      );

    for (
      const error of
        artifactValidation.errors || []
    ) {
      errors.push({
        domain:
          "artifactState",

        ...error
      });
    }

    for (
      const warning of
        artifactValidation.warnings || []
    ) {
      warnings.push({
        domain:
          "artifactState",

        ...warning
      });
    }

    const sequenceValidation =
      validateAuxiliaryState(
        resolveDeliverySequenceManager(),
        state.deliverySequenceState,
        fallbackValidateDeliverySequenceState
      );

    for (
      const error of
        sequenceValidation.errors || []
    ) {
      errors.push({
        domain:
          "deliverySequenceState",

        ...error
      });
    }

    for (
      const warning of
        sequenceValidation.warnings || []
    ) {
      warnings.push({
        domain:
          "deliverySequenceState",

        ...warning
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings,

      errorCount:
        errors.length,

      warningCount:
        warnings.length
    };
  }

  function assertValid(
    state
  ) {
    const validation =
      validateState(state);

    if (!validation.valid) {
      throw new CosStateError(
        "COS_STATE_VALIDATION_FAILED",
        "Conversation Operating System state failed validation.",
        {
          details:
            validation
        }
      );
    }

    return validation;
  }

  /* =====================================================
     QUERY API
  ===================================================== */

  function getTurn(
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
      ? freezeClone(turn)
      : null;
  }

  function hasTurn(
    state,
    turnId
  ) {
    return Boolean(
      getTurn(
        state,
        turnId
      )
    );
  }

  function getThread(
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
      ? freezeClone(thread)
      : null;
  }

  function hasThread(
    state,
    threadId
  ) {
    return Boolean(
      getThread(
        state,
        threadId
      )
    );
  }

  function getActiveTurn(state) {
    if (
      !isObject(state) ||
      !state.activeTurnId
    ) {
      return null;
    }

    return getTurn(
      state,
      state.activeTurnId
    );
  }

  function getActiveThread(state) {
    if (
      !isObject(state) ||
      !state.activeThreadId
    ) {
      return null;
    }

    return getThread(
      state,
      state.activeThreadId
    );
  }

  function getActivePendingInteraction(
    state
  ) {
    const pendingState =
      state &&
      state.pendingInteractionState;

    if (
      !isObject(pendingState) ||
      !pendingState.activeInteractionId ||
      !isObject(
        pendingState.interactions
      )
    ) {
      return null;
    }

    const interaction =
      pendingState.interactions[
        pendingState
          .activeInteractionId
      ];

    return isObject(interaction)
      ? freezeClone(interaction)
      : null;
  }

  function getActiveArtifact(state) {
    const artifactState =
      state &&
      state.artifactState;

    if (
      !isObject(artifactState) ||
      !artifactState.activeArtifactId ||
      !isObject(
        artifactState.artifacts
      )
    ) {
      return null;
    }

    const artifact =
      artifactState.artifacts[
        artifactState
          .activeArtifactId
      ];

    return isObject(artifact)
      ? freezeClone(artifact)
      : null;
  }

  function getActiveDeliverySequence(
    state
  ) {
    const sequenceState =
      state &&
      state.deliverySequenceState;

    if (
      !isObject(sequenceState) ||
      !sequenceState.activeSequenceId ||
      !isObject(
        sequenceState.sequences
      )
    ) {
      return null;
    }

    const sequence =
      sequenceState.sequences[
        sequenceState
          .activeSequenceId
      ];

    return isObject(sequence)
      ? freezeClone(sequence)
      : null;
  }

  function getTopInterruption(state) {
    if (
      !isObject(state) ||
      !Array.isArray(
        state.interruptionStack
      ) ||
      state.interruptionStack
        .length === 0
    ) {
      return null;
    }

    return freezeClone(
      state.interruptionStack[
        state.interruptionStack
          .length - 1
      ]
    );
  }

  /* =====================================================
     AUXILIARY STATE REPLACEMENT
  ===================================================== */

  function withPendingInteractionState(
    state,
    pendingInteractionState,
    options = {}
  ) {
    return withPatch(
      state,
      {
        pendingInteractionState:
          normalizePendingInteractionState(
            pendingInteractionState,
            state &&
              state.conversationId
          )
      },
      options
    );
  }

  function withArtifactState(
    state,
    artifactState,
    options = {}
  ) {
    return withPatch(
      state,
      {
        artifactState:
          normalizeArtifactState(
            artifactState,
            state &&
              state.conversationId
          )
      },
      options
    );
  }

  function withDeliverySequenceState(
    state,
    deliverySequenceState,
    options = {}
  ) {
    return withPatch(
      state,
      {
        deliverySequenceState:
          normalizeDeliverySequenceState(
            deliverySequenceState,
            state &&
              state.conversationId
          )
      },
      options
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosState = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    stateType:
      STATE_TYPE,

    threadStatuses:
      THREAD_STATUSES,

    turnRoles:
      TURN_ROLES,

    placementTypes:
      PLACEMENT_TYPES,

    referenceStatuses:
      REFERENCE_STATUSES,

    requiredStateKeys:
      REQUIRED_STATE_KEYS,

    CosStateError,

    create,

    initialize:
      create,

    createInitialState:
      create,

    createEmptyState:
      create,

    normalize,

    normalizeState:
      normalize,

    clone,

    cloneState:
      clone,

    incrementRevision,

    withPatch,

    withPendingInteractionState,

    withArtifactState,

    withDeliverySequenceState,

    validate:
      validateState,

    validateState,

    validateTurn,

    validateThread,

    validateInterruption,

    assertValid,

    assertState:
      assertValid,

    getTurn,

    hasTurn,

    getThread,

    hasThread,

    getActiveTurn,

    getActiveThread,

    getActivePendingInteraction,

    getActiveArtifact,

    getActiveDeliverySequence,

    getTopInterruption,

    createEmptyPendingInteractionState,

    createEmptyArtifactState,

    createEmptyDeliverySequenceState,

    normalizePendingInteractionState,

    normalizeArtifactState,

    normalizeDeliverySequenceState
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.state =
    cosState;

  ConversationOS.cosState =
    cosState;

  root.AriCosState =
    cosState;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosState;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);