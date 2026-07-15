// rebirth/conversation-os/migrations/cos-state-migrator.js
// ARI Rebirth — Conversation Operating System State Migrator
//
// Purpose:
// Upgrade persisted Conversation Operating System state between supported
// schema versions without reinterpreting conversational meaning.
//
// V1.0.0 — Canonical COS State Migration Framework
//
// Canonical flow:
//
// Stored COS State
//      ↓
// Source Schema Detection
//      ↓
// Migration Path Resolution
//      ↓
// Ordered Migration Steps
//      ↓
// Structural Normalization
//      ↓
// Post-Migration Validation
//      ↓
// Canonical Current COS State
//
// Authority:
//
// This component is authoritative only for:
//
// - detecting stored COS schema versions,
// - resolving supported migration paths,
// - applying registered structural migrations,
// - normalizing legacy field names,
// - creating structurally required empty containers,
// - preserving existing turn and thread identities,
// - preserving existing placement relationships,
// - preserving stored auxiliary COS state,
// - reporting migration history and warnings.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret conversation text,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - invent missing turn relationships,
// - invent missing thread membership,
// - invent references,
// - change authoritative placement meaning,
// - discard unknown fields without an explicit migration rule,
// - generate responses.
//
// Architectural rule:
//
// Migration changes storage structure, not conversational truth.
//
// When legacy state is incomplete, the migrator may create safe empty
// containers or preserve unresolved values. It must not guess missing
// relationships.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.stateMigrator
//
// CommonJS:
//
// module.exports = cosStateMigrator

(function initializeCosStateMigrator(globalScope) {
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
  const CURRENT_SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-state-migrator";

  const MIGRATION_RESULT_TYPE =
    "conversation_os_state_migration_result";

  const LEGACY_VERSION =
    "0.0.0";

  const SUPPORTED_SCHEMA_VERSIONS =
    Object.freeze([
      LEGACY_VERSION,
      CURRENT_SCHEMA_VERSION
    ]);

  const REQUIRED_STATE_KEYS =
    Object.freeze([
      "schemaVersion",
      "authority",
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

  class CosStateMigratorError extends Error {
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
        "COS state migrator error"
      );

      this.name =
        "CosStateMigratorError";

      this.code =
        code ||
        "COS_STATE_MIGRATOR_ERROR";

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
          CosStateMigratorError
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

  /* =====================================================
     SEMANTIC VERSION HELPERS
  ===================================================== */

  function parseVersion(value) {
    const normalized =
      firstNonEmptyString(value);

    if (!normalized) {
      return {
        major: 0,
        minor: 0,
        patch: 0,
        normalized:
          LEGACY_VERSION
      };
    }

    const match =
      normalized.match(
        /^(\d+)\.(\d+)\.(\d+)$/
      );

    if (!match) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_VERSION_INVALID",
        "COS state schema version must use major.minor.patch format.",
        {
          details: {
            version:
              normalized
          }
        }
      );
    }

    return {
      major:
        Number(match[1]),

      minor:
        Number(match[2]),

      patch:
        Number(match[3]),

      normalized:
        `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`
    };
  }

  function compareVersions(
    left,
    right
  ) {
    const leftVersion =
      parseVersion(left);

    const rightVersion =
      parseVersion(right);

    if (
      leftVersion.major !==
      rightVersion.major
    ) {
      return (
        leftVersion.major -
        rightVersion.major
      );
    }

    if (
      leftVersion.minor !==
      rightVersion.minor
    ) {
      return (
        leftVersion.minor -
        rightVersion.minor
      );
    }

    return (
      leftVersion.patch -
      rightVersion.patch
    );
  }

  function isVersionGreater(
    left,
    right
  ) {
    return (
      compareVersions(
        left,
        right
      ) > 0
    );
  }

  /* =====================================================
     VERSION DETECTION
  ===================================================== */

  function detectSchemaVersion(
    state
  ) {
    if (!isObject(state)) {
      return LEGACY_VERSION;
    }

    return (
      firstNonEmptyString(
        state.schemaVersion,
        state.schema_version,
        state.version
      ) ||
      LEGACY_VERSION
    );
  }

  /* =====================================================
     EMPTY AUXILIARY STATES
  ===================================================== */

  function createEmptyPendingInteractionState(
    conversationId
  ) {
    const timestamp =
      nowIso();

    return {
      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_pending_interaction_state",

      conversationId:
        conversationId || null,

      revision: 0,

      activeInteractionId:
        null,

      interactions: {},

      order: [],

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyArtifactState(
    conversationId
  ) {
    const timestamp =
      nowIso();

    return {
      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_artifact_state",

      conversationId:
        conversationId || null,

      revision: 0,

      activeArtifactId: null,

      artifacts: {},

      order: [],

      byFilePath: {},

      bySourceTurnId: {},

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  function createEmptyDeliverySequenceState(
    conversationId
  ) {
    const timestamp =
      nowIso();

    return {
      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      stateType:
        "conversation_delivery_sequence_state",

      conversationId:
        conversationId || null,

      revision: 0,

      activeSequenceId: null,

      sequences: {},

      order: [],

      byArtifactId: {},

      bySourceTurnId: {},

      lastCommand: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  /* =====================================================
     LEGACY FIELD NORMALIZATION
  ===================================================== */

  function normalizeLegacyTurn(
    rawTurn,
    fallbackTurnId = null
  ) {
    const turn =
      isObject(rawTurn)
        ? safeClone(rawTurn)
        : {};

    const turnId =
      firstNonEmptyString(
        turn.turnId,
        turn.turn_id,
        turn.id,
        turn.messageId,
        turn.message_id,
        fallbackTurnId
      );

    return {
      ...turn,

      turnId:
        turnId || null,

      threadId:
        firstNonEmptyString(
          turn.threadId,
          turn.thread_id,
          turn.conversationThreadId,
          turn.conversation_thread_id
        ) || null,

      parentTurnId:
        firstNonEmptyString(
          turn.parentTurnId,
          turn.parent_turn_id,
          turn.replyToTurnId,
          turn.reply_to_turn_id
        ) || null,

      sourceTurnIds:
        uniqueStrings(
          firstDefined(
            turn.sourceTurnIds,
            turn.source_turn_ids,
            turn.referenceTurnIds,
            turn.reference_turn_ids,
            []
          )
        ),

      role:
        firstNonEmptyString(
          turn.role,
          turn.speaker,
          turn.authorRole,
          turn.author_role
        ) || "unknown",

      sequence:
        normalizeInteger(
          firstDefined(
            turn.sequence,
            turn.turnSequence,
            turn.turn_sequence,
            turn.turnIndex,
            turn.turn_index,
            turn.index
          ),
          0
        ),

      timestamp:
        normalizeTimestamp(
          firstDefined(
            turn.timestamp,
            turn.createdAt,
            turn.created_at,
            turn.time
          ),
          null
        )
    };
  }

  function normalizeLegacyTurns(
    rawTurns
  ) {
    const output = {};

    if (Array.isArray(rawTurns)) {
      rawTurns.forEach(
        (rawTurn, index) => {
          const normalized =
            normalizeLegacyTurn(
              rawTurn,
              `legacy_turn_${index}`
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
          key,
          rawTurn
        ] of Object.entries(rawTurns)
      ) {
        const normalized =
          normalizeLegacyTurn(
            rawTurn,
            key
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

  function normalizeLegacyThread(
    rawThread,
    fallbackThreadId = null
  ) {
    const thread =
      isObject(rawThread)
        ? safeClone(rawThread)
        : {};

    const threadId =
      firstNonEmptyString(
        thread.threadId,
        thread.thread_id,
        thread.id,
        fallbackThreadId
      );

    return {
      ...thread,

      threadId:
        threadId || null,

      status:
        firstNonEmptyString(
          thread.status
        ) || "inactive",

      turnIds:
        uniqueStrings(
          firstDefined(
            thread.turnIds,
            thread.turn_ids,
            thread.turns,
            []
          )
        ),

      firstTurnId:
        firstNonEmptyString(
          thread.firstTurnId,
          thread.first_turn_id
        ) || null,

      lastTurnId:
        firstNonEmptyString(
          thread.lastTurnId,
          thread.last_turn_id
        ) || null,

      parentThreadId:
        firstNonEmptyString(
          thread.parentThreadId,
          thread.parent_thread_id
        ) || null,

      originTurnId:
        firstNonEmptyString(
          thread.originTurnId,
          thread.origin_turn_id
        ) || null,

      createdAt:
        normalizeTimestamp(
          firstDefined(
            thread.createdAt,
            thread.created_at
          ),
          null
        ),

      updatedAt:
        normalizeTimestamp(
          firstDefined(
            thread.updatedAt,
            thread.updated_at
          ),
          null
        )
    };
  }

  function normalizeLegacyThreads(
    rawThreads
  ) {
    const output = {};

    if (Array.isArray(rawThreads)) {
      rawThreads.forEach(
        (rawThread, index) => {
          const normalized =
            normalizeLegacyThread(
              rawThread,
              `legacy_thread_${index}`
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
          key,
          rawThread
        ] of Object.entries(
          rawThreads
        )
      ) {
        const normalized =
          normalizeLegacyThread(
            rawThread,
            key
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

  function normalizeInterruptionStack(
    value
  ) {
    return asArray(value)
      .filter(isObject)
      .map(
        (entry) => ({
          ...safeClone(entry),

          interruptedThreadId:
            firstNonEmptyString(
              entry.interruptedThreadId,
              entry.interrupted_thread_id
            ) || null,

          interruptionThreadId:
            firstNonEmptyString(
              entry.interruptionThreadId,
              entry.interruption_thread_id
            ) || null,

          interruptedTurnId:
            firstNonEmptyString(
              entry.interruptedTurnId,
              entry.interrupted_turn_id
            ) || null,

          interruptionTurnId:
            firstNonEmptyString(
              entry.interruptionTurnId,
              entry.interruption_turn_id
            ) || null
        })
      );
  }

  /* =====================================================
     AUXILIARY STATE NORMALIZATION
  ===================================================== */

  function normalizePendingInteractionState(
    value,
    conversationId
  ) {
    const source =
      isObject(value)
        ? safeClone(value)
        : createEmptyPendingInteractionState(
            conversationId
          );

    return {
      ...createEmptyPendingInteractionState(
        conversationId
      ),

      ...source,

      schemaVersion:
        CURRENT_SCHEMA_VERSION,

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

      activeInteractionId:
        firstNonEmptyString(
          source.activeInteractionId,
          source.active_interaction_id
        ) || null,

      interactions:
        isObject(
          source.interactions
        )
          ? source.interactions
          : {},

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
        )
    };
  }

  function normalizeArtifactState(
    value,
    conversationId
  ) {
    const source =
      isObject(value)
        ? safeClone(value)
        : createEmptyArtifactState(
            conversationId
          );

    return {
      ...createEmptyArtifactState(
        conversationId
      ),

      ...source,

      schemaVersion:
        CURRENT_SCHEMA_VERSION,

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

      activeArtifactId:
        firstNonEmptyString(
          source.activeArtifactId,
          source.active_artifact_id
        ) || null,

      artifacts:
        isObject(source.artifacts)
          ? source.artifacts
          : {},

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
            : {},

      bySourceTurnId:
        isObject(
          source.bySourceTurnId
        )
          ? source.bySourceTurnId
          : isObject(
              source.by_source_turn_id
            )
            ? source.by_source_turn_id
            : {}
    };
  }

  function normalizeDeliverySequenceState(
    value,
    conversationId
  ) {
    const source =
      isObject(value)
        ? safeClone(value)
        : createEmptyDeliverySequenceState(
            conversationId
          );

    return {
      ...createEmptyDeliverySequenceState(
        conversationId
      ),

      ...source,

      schemaVersion:
        CURRENT_SCHEMA_VERSION,

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

      activeSequenceId:
        firstNonEmptyString(
          source.activeSequenceId,
          source.active_sequence_id
        ) || null,

      sequences:
        isObject(source.sequences)
          ? source.sequences
          : {},

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
            : {},

      bySourceTurnId:
        isObject(
          source.bySourceTurnId
        )
          ? source.bySourceTurnId
          : isObject(
              source.by_source_turn_id
            )
            ? source.by_source_turn_id
            : {}
    };
  }

  /* =====================================================
     LEGACY → 1.0.0 MIGRATION
  ===================================================== */

  function migrateLegacyToV1(
    state,
    context = {}
  ) {
    const source =
      isObject(state)
        ? safeClone(state)
        : {};

    const timestamp =
      nowIso();

    const conversationId =
      firstNonEmptyString(
        source.conversationId,
        source.conversation_id,
        context.conversationId
      ) || null;

    const turns =
      normalizeLegacyTurns(
        firstDefined(
          source.turns,
          source.turnMap,
          source.turn_map,
          source.history,
          {}
        )
      );

    const threads =
      normalizeLegacyThreads(
        firstDefined(
          source.threads,
          source.threadMap,
          source.thread_map,
          {}
        )
      );

    const warnings = [];

    const activeThreadId =
      firstNonEmptyString(
        source.activeThreadId,
        source.active_thread_id,
        source.currentThreadId,
        source.current_thread_id
      ) || null;

    const activeTurnId =
      firstNonEmptyString(
        source.activeTurnId,
        source.active_turn_id,
        source.currentTurnId,
        source.current_turn_id,
        source.lastTurnId,
        source.last_turn_id
      ) || null;

    if (
      activeThreadId &&
      !hasOwn(
        threads,
        activeThreadId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_MIGRATOR_ACTIVE_THREAD_RECORD_MISSING",

        activeThreadId
      });
    }

    if (
      activeTurnId &&
      !hasOwn(
        turns,
        activeTurnId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_MIGRATOR_ACTIVE_TURN_RECORD_MISSING",

        activeTurnId
      });
    }

    const pendingInteractionSource =
      firstDefined(
        source.pendingInteractionState,
        source.pending_interaction_state,
        source.pendingInteractions,
        source.pending_interactions,
        null
      );

    const artifactSource =
      firstDefined(
        source.artifactState,
        source.artifact_state,
        source.artifactsState,
        source.artifacts_state,
        null
      );

    const deliverySequenceSource =
      firstDefined(
        source.deliverySequenceState,
        source.delivery_sequence_state,
        source.sequenceState,
        source.sequence_state,
        null
      );

    const migratedState = {
      ...source,

      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      conversationId,

      revision:
        Math.max(
          0,
          normalizeInteger(
            firstDefined(
              source.revision,
              source.stateRevision,
              source.state_revision
            ),
            0
          )
        ),

      activeThreadId,

      activeTurnId,

      threads,

      turns,

      threadStack:
        uniqueStrings(
          firstDefined(
            source.threadStack,
            source.thread_stack,
            activeThreadId
              ? [activeThreadId]
              : []
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
        isObject(
          firstDefined(
            source.lastPlacement,
            source.last_placement
          )
        )
          ? safeClone(
              firstDefined(
                source.lastPlacement,
                source.last_placement
              )
            )
          : null,

      lastReferenceResolution:
        isObject(
          firstDefined(
            source.lastReferenceResolution,
            source.last_reference_resolution
          )
        )
          ? safeClone(
              firstDefined(
                source.lastReferenceResolution,
                source.last_reference_resolution
              )
            )
          : null,

      pendingInteractionState:
        normalizePendingInteractionState(
          pendingInteractionSource,
          conversationId
        ),

      artifactState:
        normalizeArtifactState(
          artifactSource,
          conversationId
        ),

      deliverySequenceState:
        normalizeDeliverySequenceState(
          deliverySequenceSource,
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
        timestamp
    };

    return {
      state:
        migratedState,

      warnings,

      notes: [
        {
          code:
            "COS_STATE_MIGRATOR_LEGACY_TO_V1",

          message:
            "Legacy COS state normalized to schema version 1.0.0."
        }
      ]
    };
  }

  /* =====================================================
     1.0.0 NORMALIZATION
  ===================================================== */

  function normalizeV1State(
    state,
    context = {}
  ) {
    const source =
      isObject(state)
        ? safeClone(state)
        : {};

    const conversationId =
      firstNonEmptyString(
        source.conversationId,
        source.conversation_id,
        context.conversationId
      ) || null;

    return {
      ...source,

      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

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
        normalizeLegacyThreads(
          source.threads
        ),

      turns:
        normalizeLegacyTurns(
          source.turns
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
        isObject(
          source.lastPlacement
        )
          ? safeClone(
              source.lastPlacement
            )
          : null,

      lastReferenceResolution:
        isObject(
          source.lastReferenceResolution
        )
          ? safeClone(
              source.lastReferenceResolution
            )
          : null,

      pendingInteractionState:
        normalizePendingInteractionState(
          firstDefined(
            source.pendingInteractionState,
            source.pending_interaction_state
          ),
          conversationId
        ),

      artifactState:
        normalizeArtifactState(
          firstDefined(
            source.artifactState,
            source.artifact_state
          ),
          conversationId
        ),

      deliverySequenceState:
        normalizeDeliverySequenceState(
          firstDefined(
            source.deliverySequenceState,
            source.delivery_sequence_state
          ),
          conversationId
        ),

      createdAt:
        normalizeTimestamp(
          firstDefined(
            source.createdAt,
            source.created_at
          ),
          nowIso()
        ),

      updatedAt:
        nowIso()
    };
  }

  /* =====================================================
     MIGRATION REGISTRY
  ===================================================== */

  const migrationRegistry =
    new Map();

  function createMigrationKey(
    fromVersion,
    toVersion
  ) {
    return `${fromVersion}->${toVersion}`;
  }

  function registerMigration({
    fromVersion,
    toVersion,
    migrate,
    description = null
  }) {
    const normalizedFrom =
      parseVersion(
        fromVersion
      ).normalized;

    const normalizedTo =
      parseVersion(
        toVersion
      ).normalized;

    if (
      typeof migrate !== "function"
    ) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_FUNCTION_REQUIRED",
        "Migration registration requires a migrate function."
      );
    }

    if (
      compareVersions(
        normalizedFrom,
        normalizedTo
      ) >= 0
    ) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_DIRECTION_INVALID",
        "Migration target version must be greater than source version.",
        {
          details: {
            fromVersion:
              normalizedFrom,

            toVersion:
              normalizedTo
          }
        }
      );
    }

    const key =
      createMigrationKey(
        normalizedFrom,
        normalizedTo
      );

    migrationRegistry.set(
      key,
      {
        fromVersion:
          normalizedFrom,

        toVersion:
          normalizedTo,

        migrate,

        description:
          description || null
      }
    );

    return key;
  }

  registerMigration({
    fromVersion:
      LEGACY_VERSION,

    toVersion:
      CURRENT_SCHEMA_VERSION,

    migrate:
      migrateLegacyToV1,

    description:
      "Normalize legacy unversioned COS state to schema version 1.0.0."
  });

  /* =====================================================
     PATH RESOLUTION
  ===================================================== */

  function listRegisteredMigrations() {
    return Array.from(
      migrationRegistry.values()
    )
      .map(
        (migration) => ({
          fromVersion:
            migration.fromVersion,

          toVersion:
            migration.toVersion,

          description:
            migration.description
        })
      )
      .sort(
        (left, right) =>
          compareVersions(
            left.fromVersion,
            right.fromVersion
          )
      );
  }

  function resolveMigrationPath(
    fromVersion,
    toVersion
  ) {
    const sourceVersion =
      parseVersion(
        fromVersion
      ).normalized;

    const targetVersion =
      parseVersion(
        toVersion
      ).normalized;

    if (
      sourceVersion ===
      targetVersion
    ) {
      return [];
    }

    if (
      compareVersions(
        sourceVersion,
        targetVersion
      ) > 0
    ) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_DOWNGRADE_UNSUPPORTED",
        "COS state downgrades are not supported.",
        {
          details: {
            fromVersion:
              sourceVersion,

            toVersion:
              targetVersion
          }
        }
      );
    }

    const queue = [
      {
        version:
          sourceVersion,

        path: []
      }
    ];

    const visited =
      new Set([
        sourceVersion
      ]);

    while (queue.length > 0) {
      const current =
        queue.shift();

      const outgoing =
        Array.from(
          migrationRegistry.values()
        )
          .filter(
            (migration) =>
              migration.fromVersion ===
                current.version &&
              compareVersions(
                migration.toVersion,
                targetVersion
              ) <= 0
          )
          .sort(
            (left, right) =>
              compareVersions(
                left.toVersion,
                right.toVersion
              )
          );

      for (
        const migration of outgoing
      ) {
        const nextPath = [
          ...current.path,
          migration
        ];

        if (
          migration.toVersion ===
          targetVersion
        ) {
          return nextPath;
        }

        if (
          !visited.has(
            migration.toVersion
          )
        ) {
          visited.add(
            migration.toVersion
          );

          queue.push({
            version:
              migration.toVersion,

            path:
              nextPath
          });
        }
      }
    }

    throw new CosStateMigratorError(
      "COS_STATE_MIGRATOR_PATH_NOT_FOUND",
      "No supported migration path exists for the requested COS state versions.",
      {
        details: {
          fromVersion:
            sourceVersion,

          toVersion:
            targetVersion,

          registeredMigrations:
            listRegisteredMigrations()
        }
      }
    );
  }

  /* =====================================================
     STATE VALIDATION
  ===================================================== */

  function validateMigratedState(
    state
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(state)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_STATE_MIGRATOR_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      state.schemaVersion !==
      CURRENT_SCHEMA_VERSION
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_SCHEMA_VERSION_INVALID",

        schemaVersion:
          state.schemaVersion
      });
    }

    if (
      state.authority !==
      AUTHORITY
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_AUTHORITY_INVALID",

        authority:
          state.authority
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
          "COS_STATE_MIGRATOR_REVISION_INVALID",

        revision:
          state.revision
      });
    }

    if (!isObject(state.threads)) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_THREADS_INVALID"
      });
    }

    if (!isObject(state.turns)) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.threadStack
      )
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_THREAD_STACK_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.interruptionStack
      )
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_INTERRUPTION_STACK_INVALID"
      });
    }

    if (
      !isObject(
        state.pendingInteractionState
      )
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_PENDING_INTERACTION_STATE_INVALID"
      });
    }

    if (
      !isObject(
        state.artifactState
      )
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_ARTIFACT_STATE_INVALID"
      });
    }

    if (
      !isObject(
        state.deliverySequenceState
      )
    ) {
      errors.push({
        code:
          "COS_STATE_MIGRATOR_DELIVERY_SEQUENCE_STATE_INVALID"
      });
    }

    if (
      state.activeThreadId &&
      !hasOwn(
        state.threads,
        state.activeThreadId
      )
    ) {
      warnings.push({
        code:
          "COS_STATE_MIGRATOR_ACTIVE_THREAD_UNRESOLVED",

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
      warnings.push({
        code:
          "COS_STATE_MIGRATOR_ACTIVE_TURN_UNRESOLVED",

        activeTurnId:
          state.activeTurnId
      });
    }

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
            "COS_STATE_MIGRATOR_REQUIRED_KEY_MISSING",

          key:
            requiredKey
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
     EXTERNAL VALIDATOR
  ===================================================== */

  async function runExternalValidation(
    state,
    validator
  ) {
    if (!validator) {
      return {
        valid: true,
        skipped: true,
        errors: [],
        warnings: []
      };
    }

    const validate =
      typeof validator ===
        "function"
        ? validator
        : typeof validator
            .validateState ===
            "function"
          ? validator
              .validateState
              .bind(validator)
          : typeof validator.validate ===
              "function"
            ? validator
                .validate
                .bind(validator)
            : null;

    if (!validate) {
      return {
        valid: true,
        skipped: true,
        errors: [],
        warnings: []
      };
    }

    const result =
      await validate(state);

    if (result === true) {
      return {
        valid: true,
        skipped: false,
        errors: [],
        warnings: []
      };
    }

    if (result === false) {
      return {
        valid: false,
        skipped: false,

        errors: [
          {
            code:
              "COS_STATE_MIGRATOR_EXTERNAL_VALIDATION_REJECTED"
          }
        ],

        warnings: []
      };
    }

    if (isObject(result)) {
      return {
        valid:
          result.valid !== false,

        skipped: false,

        errors:
          Array.isArray(
            result.errors
          )
            ? result.errors
            : [],

        warnings:
          Array.isArray(
            result.warnings
          )
            ? result.warnings
            : []
      };
    }

    return {
      valid:
        Boolean(result),

      skipped: false,

      errors: [],

      warnings: []
    };
  }

  /* =====================================================
     PUBLIC MIGRATION
  ===================================================== */

  async function migrate(
    rawInput = {},
    options = {}
  ) {
    const input =
      isObject(rawInput) &&
      hasOwn(rawInput, "state")
        ? rawInput
        : {
            state:
              rawInput
          };

    const originalState =
      isObject(input.state)
        ? safeClone(input.state)
        : {};

    const conversationId =
      firstNonEmptyString(
        input.conversationId,
        input.conversation_id,
        originalState.conversationId,
        originalState.conversation_id
      ) || null;

    const fromVersion =
      firstNonEmptyString(
        input.fromVersion,
        input.from_version
      ) ||
      detectSchemaVersion(
        originalState
      );

    const toVersion =
      firstNonEmptyString(
        input.toVersion,
        input.to_version,
        options.toVersion,
        options.to_version
      ) ||
      CURRENT_SCHEMA_VERSION;

    const normalizedFrom =
      parseVersion(
        fromVersion
      ).normalized;

    const normalizedTo =
      parseVersion(
        toVersion
      ).normalized;

    if (
      isVersionGreater(
        normalizedFrom,
        CURRENT_SCHEMA_VERSION
      ) &&
      options.allowFutureVersion !==
        true
    ) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_FUTURE_SCHEMA_UNSUPPORTED",
        "Stored COS state uses a newer schema version than this runtime supports.",
        {
          details: {
            storedVersion:
              normalizedFrom,

            currentVersion:
              CURRENT_SCHEMA_VERSION
          }
        }
      );
    }

    if (
      normalizedTo !==
      CURRENT_SCHEMA_VERSION &&
      options.allowNonCurrentTarget !==
        true
    ) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_TARGET_VERSION_UNSUPPORTED",
        "COS state migration target must be the current schema version.",
        {
          details: {
            requestedTarget:
              normalizedTo,

            currentVersion:
              CURRENT_SCHEMA_VERSION
          }
        }
      );
    }

    const startedAt =
      nowIso();

    const path =
      resolveMigrationPath(
        normalizedFrom,
        normalizedTo
      );

    let workingState =
      safeClone(
        originalState
      );

    const steps = [];
    const warnings = [];
    const notes = [];

    for (
      const migration of path
    ) {
      const stepStartedAt =
        nowIso();

      const result =
        await migration.migrate(
          workingState,
          {
            conversationId,

            fromVersion:
              migration.fromVersion,

            toVersion:
              migration.toVersion
          }
        );

      const nextState =
        isObject(result) &&
        isObject(result.state)
          ? result.state
          : result;

      if (!isObject(nextState)) {
        throw new CosStateMigratorError(
          "COS_STATE_MIGRATOR_STEP_RESULT_INVALID",
          "A COS state migration step returned an invalid state.",
          {
            details: {
              fromVersion:
                migration.fromVersion,

              toVersion:
                migration.toVersion,

              result:
                safeClone(result)
            }
          }
        );
      }

      workingState =
        safeClone(nextState);

      workingState.schemaVersion =
        migration.toVersion;

      if (
        isObject(result) &&
        Array.isArray(result.warnings)
      ) {
        warnings.push(
          ...safeClone(
            result.warnings
          )
        );
      }

      if (
        isObject(result) &&
        Array.isArray(result.notes)
      ) {
        notes.push(
          ...safeClone(
            result.notes
          )
        );
      }

      steps.push({
        fromVersion:
          migration.fromVersion,

        toVersion:
          migration.toVersion,

        description:
          migration.description,

        startedAt:
          stepStartedAt,

        completedAt:
          nowIso()
      });
    }

    if (
      normalizedTo ===
      CURRENT_SCHEMA_VERSION
    ) {
      workingState =
        normalizeV1State(
          workingState,
          {
            conversationId
          }
        );
    }

    const internalValidation =
      validateMigratedState(
        workingState
      );

    if (!internalValidation.valid) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_INTERNAL_VALIDATION_FAILED",
        "Migrated COS state failed structural validation.",
        {
          details:
            internalValidation
        }
      );
    }

    warnings.push(
      ...internalValidation.warnings
    );

    const externalValidator =
      firstDefined(
        options.validator,
        input.validator,
        ConversationOS.state,
        ConversationOS.cosState,
        null
      );

    const externalValidation =
      options.validate === false
        ? {
            valid: true,
            skipped: true,
            errors: [],
            warnings: []
          }
        : await runExternalValidation(
            workingState,
            externalValidator
          );

    if (!externalValidation.valid) {
      throw new CosStateMigratorError(
        "COS_STATE_MIGRATOR_EXTERNAL_VALIDATION_FAILED",
        "Migrated COS state failed the installed COS state validator.",
        {
          details:
            externalValidation
        }
      );
    }

    warnings.push(
      ...externalValidation.warnings
    );

    const migrated =
      normalizedFrom !==
        normalizedTo ||
      JSON.stringify(
        originalState
      ) !==
        JSON.stringify(
          workingState
        );

    const result = {
      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      migrationResultType:
        MIGRATION_RESULT_TYPE,

      conversationId,

      migrated,

      fromVersion:
        normalizedFrom,

      toVersion:
        normalizedTo,

      stepCount:
        steps.length,

      steps,

      warnings,

      warningCount:
        warnings.length,

      notes,

      noteCount:
        notes.length,

      validation: {
        internal:
          internalValidation,

        external:
          externalValidation
      },

      state:
        options.freezeState === false
          ? safeClone(
              workingState
            )
          : freezeClone(
              workingState
            ),

      startedAt,

      completedAt:
        nowIso()
    };

    return options.freeze === false
      ? result
      : freezeClone(result);
  }

  /* =====================================================
     NORMALIZE CURRENT STATE
  ===================================================== */

  async function normalize(
    state,
    options = {}
  ) {
    return migrate(
      {
        state,

        fromVersion:
          detectSchemaVersion(
            state
          ),

        toVersion:
          CURRENT_SCHEMA_VERSION,

        conversationId:
          state &&
          firstNonEmptyString(
            state.conversationId,
            state.conversation_id
          )
      },
      options
    );
  }

  /* =====================================================
     CAN MIGRATE
  ===================================================== */

  function canMigrate(
    fromVersion,
    toVersion =
      CURRENT_SCHEMA_VERSION
  ) {
    try {
      resolveMigrationPath(
        fromVersion,
        toVersion
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /* =====================================================
     MIGRATION PREVIEW
  ===================================================== */

  function preview(
    state,
    options = {}
  ) {
    const fromVersion =
      firstNonEmptyString(
        options.fromVersion,
        options.from_version
      ) ||
      detectSchemaVersion(state);

    const toVersion =
      firstNonEmptyString(
        options.toVersion,
        options.to_version
      ) ||
      CURRENT_SCHEMA_VERSION;

    const path =
      resolveMigrationPath(
        fromVersion,
        toVersion
      );

    return freezeClone({
      schemaVersion:
        CURRENT_SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      fromVersion:
        parseVersion(
          fromVersion
        ).normalized,

      toVersion:
        parseVersion(
          toVersion
        ).normalized,

      migrationRequired:
        path.length > 0,

      stepCount:
        path.length,

      steps:
        path.map(
          (migration) => ({
            fromVersion:
              migration.fromVersion,

            toVersion:
              migration.toVersion,

            description:
              migration.description
          })
        )
    });
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosStateMigrator = {
    version:
      VERSION,

    schemaVersion:
      CURRENT_SCHEMA_VERSION,

    currentSchemaVersion:
      CURRENT_SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    migrationResultType:
      MIGRATION_RESULT_TYPE,

    legacyVersion:
      LEGACY_VERSION,

    supportedSchemaVersions:
      SUPPORTED_SCHEMA_VERSIONS,

    requiredStateKeys:
      REQUIRED_STATE_KEYS,

    CosStateMigratorError,

    migrate,

    upgrade:
      migrate,

    run:
      migrate,

    normalize,

    preview,

    canMigrate,

    detectSchemaVersion,

    parseVersion,

    compareVersions,

    resolveMigrationPath,

    registerMigration,

    listRegisteredMigrations,

    validateMigratedState,

    normalizeV1State,

    migrateLegacyToV1
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.stateMigrator =
    cosStateMigrator;

  ConversationOS.cosStateMigrator =
    cosStateMigrator;

  root.AriCosStateMigrator =
    cosStateMigrator;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosStateMigrator;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);