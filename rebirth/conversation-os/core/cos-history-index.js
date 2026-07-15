// rebirth/conversation-os/indexing/cos-history-index.js
// ARI Rebirth — Conversation Operating System History Index
//
// Purpose:
// Build a deterministic structural index of conversation turns for the
// Conversation Operating System.
//
// V1.0.0 — Canonical Structural History Index
//
// Canonical flow:
//
// Conversation History
//      ↓
// Turn Normalization
//      ↓
// Identity Validation
//      ↓
// Sequence Ordering
//      ↓
// Turn Lookup Index
//      ↓
// Role Index
//      ↓
// Thread Index
//      ↓
// Parent / Child Relationship Index
//      ↓
// Reply Relationship Index
//      ↓
// Structural History Index
//
// Authority:
//
// This component is authoritative only for:
//
// - indexing supplied conversation turns,
// - preserving exact turn identities,
// - preserving exact structural metadata,
// - ordering turns deterministically,
// - building turn lookup maps,
// - building thread membership maps,
// - building parent-child structural relationships,
// - exposing previous and next turn relationships,
// - reporting structural inconsistencies.
//
// Non-authority:
//
// This component must not:
//
// - interpret semantic meaning,
// - infer user intent,
// - infer conversation function,
// - infer emotional state,
// - infer safety severity,
// - resolve natural-language references,
// - determine where a new turn belongs,
// - guess missing thread membership,
// - invent parent relationships,
// - select a response,
// - generate a response.
//
// Architectural rule:
//
// The History Index records only relationships supported by supplied
// structural metadata.
//
// It may derive ordering from sequence numbers or source-array position.
// It may not derive conversational meaning from turn text.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.historyIndex

(function initializeCosHistoryIndex(globalScope) {
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
    "cos-history-index";

  const DEFAULT_ROLE = "unknown";

  const KNOWN_ROLES = Object.freeze([
    "system",
    "developer",
    "user",
    "assistant",
    "tool",
    "function",
    "unknown"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosHistoryIndexError extends Error {
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
        "COS history index error"
      );

      this.name = "CosHistoryIndexError";
      this.code =
        code || "COS_HISTORY_INDEX_ERROR";
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
          CosHistoryIndexError
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

  function createDictionary() {
    return Object.create(null);
  }

  function addToDictionaryArray(
    dictionary,
    key,
    value
  ) {
    if (!isNonEmptyString(key)) {
      return;
    }

    if (!Array.isArray(dictionary[key])) {
      dictionary[key] = [];
    }

    if (
      !dictionary[key].includes(value)
    ) {
      dictionary[key].push(value);
    }
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
     TURN NORMALIZATION
  ===================================================== */

  function normalizeTurn(
    rawTurn,
    sourceIndex
  ) {
    const source = isObject(rawTurn)
      ? safeClone(rawTurn)
      : {
          text:
            rawTurn === null ||
            rawTurn === undefined
              ? ""
              : String(rawTurn)
        };

    const turnId = firstNonEmptyString(
      source.turnId,
      source.turn_id,
      source.id,
      source.messageId,
      source.message_id
    );

    const role =
      firstNonEmptyString(
        source.role,
        source.speaker,
        source.authorRole,
        source.author_role
      ) || DEFAULT_ROLE;

    const text = firstDefined(
      source.text,
      source.content,
      source.message,
      source.rawText,
      source.raw_text,
      ""
    );

    const suppliedSequence =
      firstDefined(
        source.sequence,
        source.turnSequence,
        source.turn_sequence,
        source.turnIndex,
        source.turn_index,
        source.index
      );

    const sequence = Number.isFinite(
      Number(suppliedSequence)
    )
      ? normalizeInteger(
          suppliedSequence,
          sourceIndex
        )
      : sourceIndex;

    const timestamp = normalizeTimestamp(
      firstDefined(
        source.timestamp,
        source.createdAt,
        source.created_at,
        source.time
      ),
      null
    );

    const threadId =
      firstNonEmptyString(
        source.threadId,
        source.thread_id,
        source.conversationThreadId,
        source.conversation_thread_id
      );

    const parentTurnId =
      firstNonEmptyString(
        source.parentTurnId,
        source.parent_turn_id,
        source.replyToTurnId,
        source.reply_to_turn_id
      );

    const replyToTurnId =
      firstNonEmptyString(
        source.replyToTurnId,
        source.reply_to_turn_id
      );

    const sourceTurnIds =
      uniqueStrings(
        firstDefined(
          source.sourceTurnIds,
          source.source_turn_ids,
          source.referenceTurnIds,
          source.reference_turn_ids,
          []
        )
      );

    if (
      parentTurnId &&
      !sourceTurnIds.includes(parentTurnId)
    ) {
      sourceTurnIds.unshift(parentTurnId);
    }

    return {
      ...source,

      turnId,

      role,

      text:
        text === null ||
        text === undefined
          ? ""
          : String(text),

      sequence,

      timestamp,

      threadId: threadId || null,

      parentTurnId:
        parentTurnId || null,

      replyToTurnId:
        replyToTurnId || null,

      sourceTurnIds,

      sourceIndex
    };
  }

  function normalizeHistory(history) {
    if (!Array.isArray(history)) {
      throw new CosHistoryIndexError(
        "COS_HISTORY_NOT_ARRAY",
        "Conversation history must be an array.",
        {
          details: {
            receivedType:
              history === null
                ? "null"
                : typeof history
          }
        }
      );
    }

    return history.map(
      (turn, sourceIndex) =>
        normalizeTurn(
          turn,
          sourceIndex
        )
    );
  }

  /* =====================================================
     STATE LOOKUP
  ===================================================== */

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

    const value =
      state.turns[turnId];

    return isObject(value)
      ? value
      : null;
  }

  function enrichTurnFromState(
    turn,
    state
  ) {
    const stateTurn =
      readStateTurn(
        state,
        turn.turnId
      );

    if (!stateTurn) {
      return turn;
    }

    return {
      ...turn,

      threadId:
        firstNonEmptyString(
          turn.threadId,
          stateTurn.threadId,
          stateTurn.thread_id
        ) || null,

      parentTurnId:
        firstNonEmptyString(
          turn.parentTurnId,
          stateTurn.parentTurnId,
          stateTurn.parent_turn_id
        ) || null,

      replyToTurnId:
        firstNonEmptyString(
          turn.replyToTurnId,
          stateTurn.replyToTurnId,
          stateTurn.reply_to_turn_id
        ) || null,

      sourceTurnIds:
        uniqueStrings([
          ...turn.sourceTurnIds,

          ...asArray(
            firstDefined(
              stateTurn.sourceTurnIds,
              stateTurn.source_turn_ids,
              []
            )
          )
        ])
    };
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateTurnIdentities(
    turns,
    {
      strict = true
    } = {}
  ) {
    const errors = [];
    const warnings = [];
    const seenTurnIds = new Map();

    for (const turn of turns) {
      if (!isNonEmptyString(turn.turnId)) {
        const issue = {
          code:
            "COS_HISTORY_TURN_ID_MISSING",

          sourceIndex:
            turn.sourceIndex,

          sequence:
            turn.sequence
        };

        if (strict) {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }

        continue;
      }

      if (seenTurnIds.has(turn.turnId)) {
        errors.push({
          code:
            "COS_HISTORY_DUPLICATE_TURN_ID",

          turnId:
            turn.turnId,

          firstSourceIndex:
            seenTurnIds.get(turn.turnId),

          duplicateSourceIndex:
            turn.sourceIndex
        });

        continue;
      }

      seenTurnIds.set(
        turn.turnId,
        turn.sourceIndex
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  function assignFallbackTurnIds(
    turns
  ) {
    return turns.map((turn) => {
      if (isNonEmptyString(turn.turnId)) {
        return turn;
      }

      return {
        ...turn,

        turnId:
          `history_turn_${turn.sourceIndex}`
      };
    });
  }

  /* =====================================================
     ORDERING
  ===================================================== */

  function compareTurns(a, b) {
    if (a.sequence !== b.sequence) {
      return a.sequence - b.sequence;
    }

    if (
      a.timestamp &&
      b.timestamp &&
      a.timestamp !== b.timestamp
    ) {
      const aTime =
        new Date(a.timestamp).getTime();

      const bTime =
        new Date(b.timestamp).getTime();

      if (
        Number.isFinite(aTime) &&
        Number.isFinite(bTime) &&
        aTime !== bTime
      ) {
        return aTime - bTime;
      }
    }

    return (
      a.sourceIndex -
      b.sourceIndex
    );
  }

  function orderTurns(turns) {
    return [...turns].sort(compareTurns);
  }

  function detectSequenceIssues(
    orderedTurns
  ) {
    const warnings = [];

    for (
      let index = 1;
      index < orderedTurns.length;
      index += 1
    ) {
      const previous =
        orderedTurns[index - 1];

      const current =
        orderedTurns[index];

      if (
        previous.sequence ===
        current.sequence
      ) {
        warnings.push({
          code:
            "COS_HISTORY_DUPLICATE_SEQUENCE",

          sequence:
            current.sequence,

          turnIds: [
            previous.turnId,
            current.turnId
          ]
        });
      }

      if (
        current.sequence <
        previous.sequence
      ) {
        warnings.push({
          code:
            "COS_HISTORY_SEQUENCE_REGRESSION",

          previousTurnId:
            previous.turnId,

          previousSequence:
            previous.sequence,

          currentTurnId:
            current.turnId,

          currentSequence:
            current.sequence
        });
      }
    }

    return warnings;
  }

  /* =====================================================
     INDEX CONSTRUCTION
  ===================================================== */

  function buildTurnLookup(
    orderedTurns
  ) {
    const byTurnId =
      createDictionary();

    for (const turn of orderedTurns) {
      byTurnId[turn.turnId] = turn;
    }

    return byTurnId;
  }

  function buildRoleIndex(
    orderedTurns
  ) {
    const byRole =
      createDictionary();

    for (const turn of orderedTurns) {
      addToDictionaryArray(
        byRole,
        turn.role,
        turn.turnId
      );
    }

    return byRole;
  }

  function buildThreadIndex(
    orderedTurns
  ) {
    const byThreadId =
      createDictionary();

    const unthreadedTurnIds = [];

    for (const turn of orderedTurns) {
      if (!turn.threadId) {
        unthreadedTurnIds.push(
          turn.turnId
        );

        continue;
      }

      addToDictionaryArray(
        byThreadId,
        turn.threadId,
        turn.turnId
      );
    }

    return {
      byThreadId,
      unthreadedTurnIds
    };
  }

  function buildRelationshipIndex(
    orderedTurns,
    byTurnId
  ) {
    const parentByTurnId =
      createDictionary();

    const childrenByTurnId =
      createDictionary();

    const replyTargetByTurnId =
      createDictionary();

    const repliesByTurnId =
      createDictionary();

    const sourceTurnIdsByTurnId =
      createDictionary();

    const referencedByTurnId =
      createDictionary();

    const previousTurnIdByTurnId =
      createDictionary();

    const nextTurnIdByTurnId =
      createDictionary();

    const relationshipWarnings = [];

    for (
      let index = 0;
      index < orderedTurns.length;
      index += 1
    ) {
      const turn =
        orderedTurns[index];

      const previous =
        index > 0
          ? orderedTurns[index - 1]
          : null;

      const next =
        index <
        orderedTurns.length - 1
          ? orderedTurns[index + 1]
          : null;

      previousTurnIdByTurnId[
        turn.turnId
      ] = previous
        ? previous.turnId
        : null;

      nextTurnIdByTurnId[
        turn.turnId
      ] = next
        ? next.turnId
        : null;

      if (turn.parentTurnId) {
        parentByTurnId[
          turn.turnId
        ] = turn.parentTurnId;

        addToDictionaryArray(
          childrenByTurnId,
          turn.parentTurnId,
          turn.turnId
        );

        if (
          !hasOwn(
            byTurnId,
            turn.parentTurnId
          )
        ) {
          relationshipWarnings.push({
            code:
              "COS_HISTORY_UNKNOWN_PARENT_TURN",

            turnId:
              turn.turnId,

            parentTurnId:
              turn.parentTurnId
          });
        }
      }

      if (turn.replyToTurnId) {
        replyTargetByTurnId[
          turn.turnId
        ] = turn.replyToTurnId;

        addToDictionaryArray(
          repliesByTurnId,
          turn.replyToTurnId,
          turn.turnId
        );

        if (
          !hasOwn(
            byTurnId,
            turn.replyToTurnId
          )
        ) {
          relationshipWarnings.push({
            code:
              "COS_HISTORY_UNKNOWN_REPLY_TARGET",

            turnId:
              turn.turnId,

            replyToTurnId:
              turn.replyToTurnId
          });
        }
      }

      sourceTurnIdsByTurnId[
        turn.turnId
      ] = [...turn.sourceTurnIds];

      for (
        const sourceTurnId of
          turn.sourceTurnIds
      ) {
        addToDictionaryArray(
          referencedByTurnId,
          sourceTurnId,
          turn.turnId
        );

        if (
          !hasOwn(
            byTurnId,
            sourceTurnId
          )
        ) {
          relationshipWarnings.push({
            code:
              "COS_HISTORY_UNKNOWN_SOURCE_TURN",

            turnId:
              turn.turnId,

            sourceTurnId
          });
        }
      }
    }

    return {
      parentByTurnId,
      childrenByTurnId,
      replyTargetByTurnId,
      repliesByTurnId,
      sourceTurnIdsByTurnId,
      referencedByTurnId,
      previousTurnIdByTurnId,
      nextTurnIdByTurnId,
      warnings:
        relationshipWarnings
    };
  }

  function buildSequenceIndex(
    orderedTurns
  ) {
    const bySequence =
      createDictionary();

    for (const turn of orderedTurns) {
      const key =
        String(turn.sequence);

      addToDictionaryArray(
        bySequence,
        key,
        turn.turnId
      );
    }

    return bySequence;
  }

  function buildPositionIndex(
    orderedTurns
  ) {
    const positionByTurnId =
      createDictionary();

    const turnIdByPosition = [];

    for (
      let position = 0;
      position < orderedTurns.length;
      position += 1
    ) {
      const turn =
        orderedTurns[position];

      positionByTurnId[
        turn.turnId
      ] = position;

      turnIdByPosition[
        position
      ] = turn.turnId;
    }

    return {
      positionByTurnId,
      turnIdByPosition
    };
  }

  function buildThreadSummaries(
    byThreadId,
    byTurnId
  ) {
    const threadSummaries =
      createDictionary();

    for (
      const threadId of
        Object.keys(byThreadId)
    ) {
      const turnIds =
        byThreadId[threadId];

      const firstTurnId =
        turnIds.length > 0
          ? turnIds[0]
          : null;

      const lastTurnId =
        turnIds.length > 0
          ? turnIds[
              turnIds.length - 1
            ]
          : null;

      const roles =
        uniqueStrings(
          turnIds.map(
            (turnId) =>
              byTurnId[turnId] &&
              byTurnId[turnId].role
          )
        );

      threadSummaries[
        threadId
      ] = {
        threadId,

        turnIds:
          [...turnIds],

        turnCount:
          turnIds.length,

        firstTurnId,

        lastTurnId,

        firstSequence:
          firstTurnId &&
          byTurnId[firstTurnId]
            ? byTurnId[
                firstTurnId
              ].sequence
            : null,

        lastSequence:
          lastTurnId &&
          byTurnId[lastTurnId]
            ? byTurnId[
                lastTurnId
              ].sequence
            : null,

        roles
      };
    }

    return threadSummaries;
  }

  /* =====================================================
     DERIVED LANDMARKS
  ===================================================== */

  function readLastTurnIdForRole(
    byRole,
    role
  ) {
    const turnIds =
      byRole[role];

    if (
      !Array.isArray(turnIds) ||
      turnIds.length === 0
    ) {
      return null;
    }

    return turnIds[
      turnIds.length - 1
    ];
  }

  function readFirstTurnIdForRole(
    byRole,
    role
  ) {
    const turnIds =
      byRole[role];

    if (
      !Array.isArray(turnIds) ||
      turnIds.length === 0
    ) {
      return null;
    }

    return turnIds[0];
  }

  function buildLandmarks(
    orderedTurnIds,
    byRole
  ) {
    return {
      firstTurnId:
        orderedTurnIds.length > 0
          ? orderedTurnIds[0]
          : null,

      lastTurnId:
        orderedTurnIds.length > 0
          ? orderedTurnIds[
              orderedTurnIds.length - 1
            ]
          : null,

      firstUserTurnId:
        readFirstTurnIdForRole(
          byRole,
          "user"
        ),

      lastUserTurnId:
        readLastTurnIdForRole(
          byRole,
          "user"
        ),

      firstAssistantTurnId:
        readFirstTurnIdForRole(
          byRole,
          "assistant"
        ),

      lastAssistantTurnId:
        readLastTurnIdForRole(
          byRole,
          "assistant"
        ),

      firstSystemTurnId:
        readFirstTurnIdForRole(
          byRole,
          "system"
        ),

      lastSystemTurnId:
        readLastTurnIdForRole(
          byRole,
          "system"
        )
    };
  }

  /* =====================================================
     INDEX VALIDATION
  ===================================================== */

  function validateIndex(index) {
    const errors = [];
    const warnings = [];

    if (!isObject(index)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_HISTORY_INDEX_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !Array.isArray(
        index.orderedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_HISTORY_ORDERED_IDS_MISSING"
      });
    }

    if (!isObject(index.byTurnId)) {
      errors.push({
        code:
          "COS_HISTORY_TURN_LOOKUP_MISSING"
      });
    }

    if (!isObject(index.byRole)) {
      errors.push({
        code:
          "COS_HISTORY_ROLE_INDEX_MISSING"
      });
    }

    if (!isObject(index.byThreadId)) {
      errors.push({
        code:
          "COS_HISTORY_THREAD_INDEX_MISSING"
      });
    }

    if (
      Array.isArray(
        index.orderedTurnIds
      ) &&
      isObject(index.byTurnId)
    ) {
      for (
        const turnId of
          index.orderedTurnIds
      ) {
        if (
          !hasOwn(
            index.byTurnId,
            turnId
          )
        ) {
          errors.push({
            code:
              "COS_HISTORY_ORDERED_TURN_NOT_INDEXED",

            turnId
          });
        }
      }

      if (
        index.count !==
        index.orderedTurnIds.length
      ) {
        errors.push({
          code:
            "COS_HISTORY_COUNT_MISMATCH",

          count:
            index.count,

          orderedCount:
            index.orderedTurnIds.length
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /* =====================================================
     PUBLIC BUILD
  ===================================================== */

  function build(
    input = {},
    options = {}
  ) {
    const source = isObject(input)
      ? input
      : {
          history: input
        };

    const history =
      firstDefined(
        source.history,
        source.turns,
        source.conversationHistory,
        source.conversation_history,
        []
      );

    const state =
      isObject(source.state)
        ? source.state
        : {};

    const strict =
      firstDefined(
        options.strict,
        source.strict
      ) !== false;

    const freeze =
      firstDefined(
        options.freeze,
        source.freeze
      ) !== false;

    let turns =
      normalizeHistory(history);

    turns = turns.map(
      (turn) =>
        enrichTurnFromState(
          turn,
          state
        )
    );

    const identityValidation =
      validateTurnIdentities(
        turns,
        {
          strict
        }
      );

    if (!identityValidation.valid) {
      throw new CosHistoryIndexError(
        "COS_HISTORY_IDENTITY_VALIDATION_FAILED",
        "Conversation history contains invalid turn identities.",
        {
          details:
            identityValidation
        }
      );
    }

    if (!strict) {
      turns =
        assignFallbackTurnIds(turns);
    }

    const orderedTurns =
      orderTurns(turns);

    const byTurnId =
      buildTurnLookup(
        orderedTurns
      );

    const byRole =
      buildRoleIndex(
        orderedTurns
      );

    const {
      byThreadId,
      unthreadedTurnIds
    } = buildThreadIndex(
      orderedTurns
    );

    const relationships =
      buildRelationshipIndex(
        orderedTurns,
        byTurnId
      );

    const bySequence =
      buildSequenceIndex(
        orderedTurns
      );

    const {
      positionByTurnId,
      turnIdByPosition
    } = buildPositionIndex(
      orderedTurns
    );

    const threadSummaries =
      buildThreadSummaries(
        byThreadId,
        byTurnId
      );

    const orderedTurnIds =
      orderedTurns.map(
        (turn) => turn.turnId
      );

    const landmarks =
      buildLandmarks(
        orderedTurnIds,
        byRole
      );

    const warnings = [
      ...identityValidation.warnings,
      ...detectSequenceIssues(
        orderedTurns
      ),
      ...relationships.warnings
    ];

    const index = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state.conversationId,
          state.conversation_id
        ) || null,

      count:
        orderedTurns.length,

      orderedTurnIds,

      turnIdByPosition,

      positionByTurnId,

      byTurnId,

      bySequence,

      byRole,

      byThreadId,

      threadSummaries,

      unthreadedTurnIds,

      parentByTurnId:
        relationships.parentByTurnId,

      childrenByTurnId:
        relationships.childrenByTurnId,

      replyTargetByTurnId:
        relationships.replyTargetByTurnId,

      repliesByTurnId:
        relationships.repliesByTurnId,

      sourceTurnIdsByTurnId:
        relationships.sourceTurnIdsByTurnId,

      referencedByTurnId:
        relationships.referencedByTurnId,

      previousTurnIdByTurnId:
        relationships.previousTurnIdByTurnId,

      nextTurnIdByTurnId:
        relationships.nextTurnIdByTurnId,

      firstTurnId:
        landmarks.firstTurnId,

      lastTurnId:
        landmarks.lastTurnId,

      firstUserTurnId:
        landmarks.firstUserTurnId,

      lastUserTurnId:
        landmarks.lastUserTurnId,

      firstAssistantTurnId:
        landmarks.firstAssistantTurnId,

      lastAssistantTurnId:
        landmarks.lastAssistantTurnId,

      firstSystemTurnId:
        landmarks.firstSystemTurnId,

      lastSystemTurnId:
        landmarks.lastSystemTurnId,

      diagnostics: {
        valid: true,

        warnings,

        errorCount: 0,

        warningCount:
          warnings.length
      }
    };

    const validation =
      validateIndex(index);

    if (!validation.valid) {
      throw new CosHistoryIndexError(
        "COS_HISTORY_INDEX_VALIDATION_FAILED",
        "Constructed history index failed validation.",
        {
          details: validation
        }
      );
    }

    return freeze
      ? freezeClone(index)
      : index;
  }

  /* =====================================================
     LOOKUP API
  ===================================================== */

  function getTurn(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(index.byTurnId) ||
      !isNonEmptyString(turnId)
    ) {
      return null;
    }

    return (
      index.byTurnId[turnId] ||
      null
    );
  }

  function hasTurn(
    index,
    turnId
  ) {
    return Boolean(
      getTurn(index, turnId)
    );
  }

  function getTurns(
    index,
    turnIds = []
  ) {
    return uniqueStrings(
      turnIds
    )
      .map(
        (turnId) =>
          getTurn(index, turnId)
      )
      .filter(Boolean);
  }

  function getPreviousTurn(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.previousTurnIdByTurnId
      )
    ) {
      return null;
    }

    const previousTurnId =
      index.previousTurnIdByTurnId[
        turnId
      ];

    return previousTurnId
      ? getTurn(
          index,
          previousTurnId
        )
      : null;
  }

  function getNextTurn(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.nextTurnIdByTurnId
      )
    ) {
      return null;
    }

    const nextTurnId =
      index.nextTurnIdByTurnId[
        turnId
      ];

    return nextTurnId
      ? getTurn(
          index,
          nextTurnId
        )
      : null;
  }

  function getParentTurn(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.parentByTurnId
      )
    ) {
      return null;
    }

    const parentTurnId =
      index.parentByTurnId[
        turnId
      ];

    return parentTurnId
      ? getTurn(
          index,
          parentTurnId
        )
      : null;
  }

  function getChildTurns(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.childrenByTurnId
      )
    ) {
      return [];
    }

    return getTurns(
      index,
      index.childrenByTurnId[
        turnId
      ] || []
    );
  }

  function getReplyTarget(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.replyTargetByTurnId
      )
    ) {
      return null;
    }

    const targetTurnId =
      index.replyTargetByTurnId[
        turnId
      ];

    return targetTurnId
      ? getTurn(
          index,
          targetTurnId
        )
      : null;
  }

  function getReplies(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.repliesByTurnId
      )
    ) {
      return [];
    }

    return getTurns(
      index,
      index.repliesByTurnId[
        turnId
      ] || []
    );
  }

  function getSourceTurns(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.sourceTurnIdsByTurnId
      )
    ) {
      return [];
    }

    return getTurns(
      index,
      index.sourceTurnIdsByTurnId[
        turnId
      ] || []
    );
  }

  function getReferencingTurns(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.referencedByTurnId
      )
    ) {
      return [];
    }

    return getTurns(
      index,
      index.referencedByTurnId[
        turnId
      ] || []
    );
  }

  function getTurnsByRole(
    index,
    role
  ) {
    if (
      !isObject(index) ||
      !isObject(index.byRole) ||
      !isNonEmptyString(role)
    ) {
      return [];
    }

    return getTurns(
      index,
      index.byRole[role] || []
    );
  }

  function getTurnsByThread(
    index,
    threadId
  ) {
    if (
      !isObject(index) ||
      !isObject(index.byThreadId) ||
      !isNonEmptyString(threadId)
    ) {
      return [];
    }

    return getTurns(
      index,
      index.byThreadId[
        threadId
      ] || []
    );
  }

  function getTurnAtPosition(
    index,
    position
  ) {
    if (
      !isObject(index) ||
      !Array.isArray(
        index.turnIdByPosition
      )
    ) {
      return null;
    }

    const normalizedPosition =
      normalizeInteger(
        position,
        -1
      );

    if (
      normalizedPosition < 0 ||
      normalizedPosition >=
        index.turnIdByPosition.length
    ) {
      return null;
    }

    const turnId =
      index.turnIdByPosition[
        normalizedPosition
      ];

    return getTurn(index, turnId);
  }

  function getPosition(
    index,
    turnId
  ) {
    if (
      !isObject(index) ||
      !isObject(
        index.positionByTurnId
      ) ||
      !isNonEmptyString(turnId)
    ) {
      return -1;
    }

    const value =
      index.positionByTurnId[
        turnId
      ];

    return Number.isFinite(
      Number(value)
    )
      ? Number(value)
      : -1;
  }

  function getLastTurn(
    index
  ) {
    return index &&
      index.lastTurnId
      ? getTurn(
          index,
          index.lastTurnId
        )
      : null;
  }

  function getLastUserTurn(
    index
  ) {
    return index &&
      index.lastUserTurnId
      ? getTurn(
          index,
          index.lastUserTurnId
        )
      : null;
  }

  function getLastAssistantTurn(
    index
  ) {
    return index &&
      index.lastAssistantTurnId
      ? getTurn(
          index,
          index.lastAssistantTurnId
        )
      : null;
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosHistoryIndex = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    knownRoles:
      KNOWN_ROLES,

    CosHistoryIndexError,

    build,

    index:
      build,

    create:
      build,

    createIndex:
      build,

    run:
      build,

    validate:
      validateIndex,

    getTurn,

    hasTurn,

    getTurns,

    getPreviousTurn,

    getNextTurn,

    getParentTurn,

    getChildTurns,

    getReplyTarget,

    getReplies,

    getSourceTurns,

    getReferencingTurns,

    getTurnsByRole,

    getTurnsByThread,

    getTurnAtPosition,

    getPosition,

    getLastTurn,

    getLastUserTurn,

    getLastAssistantTurn
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.historyIndex =
    cosHistoryIndex;

  ConversationOS.historyIndexer =
    cosHistoryIndex;

  ConversationOS.cosHistoryIndex =
    cosHistoryIndex;

  root.AriCosHistoryIndex =
    cosHistoryIndex;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosHistoryIndex;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);