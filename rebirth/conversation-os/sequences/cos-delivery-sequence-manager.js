// rebirth/conversation-os/sequences/cos-delivery-sequence-manager.js
// ARI Rebirth — Conversation Operating System Delivery Sequence Manager
//
// Purpose:
// Maintain deterministic structural state for multi-turn deliveries such as
// numbered code parts, ordered files, staged instructions, and resumable
// artifact sequences.
//
// V1.0.0 — Canonical Delivery Sequence Lifecycle
//
// Canonical flow:
//
// Existing Delivery Sequence State
//      ↓
// Sequence Command
//      ↓
// Structural Validation
//      ↓
// Create / Start / Deliver / Advance / Pause / Resume / Complete / Cancel
//      ↓
// Active Sequence Selection
//      ↓
// Canonical Delivery Sequence State
//
// Supported sequence types:
//
// - multipart_code
// - file_series
// - ordered_artifacts
// - numbered_response
// - staged_instruction
// - checklist_progression
// - migration_sequence
// - test_sequence
// - generic_sequence
//
// Authority:
//
// This component is authoritative only for:
//
// - registering delivery sequences,
// - tracking the active delivery sequence,
// - preserving ordered sequence items,
// - tracking delivered and remaining items,
// - tracking current and next sequence positions,
// - recording the turn that delivered each item,
// - pausing and resuming sequences,
// - completing or cancelling sequences,
// - preserving sequence-to-artifact relationships,
// - preserving sequence-to-turn relationships,
// - exposing deterministic continuation state.
//
// Non-authority:
//
// This component must not:
//
// - interpret raw user language,
// - independently decide that "Next" means advance,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - generate sequence content,
// - generate artifact content,
// - resolve natural-language references,
// - choose response wording,
// - modify external files.
//
// Architectural rule:
//
// An upstream conversation or semantic authority may determine that the user
// requested continuation.
//
// Once continuation is authorized, this manager determines the exact next
// structural item.
//
// It never advances a sequence merely because text resembles "Next."
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.deliverySequenceManager
//
// CommonJS:
//
// module.exports = cosDeliverySequenceManager

(function initializeCosDeliverySequenceManager(globalScope) {
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
    "cos-delivery-sequence-manager";

  const SEQUENCE_STATE_TYPE =
    "conversation_delivery_sequence_state";

  const SEQUENCE_TYPES = Object.freeze([
    "multipart_code",
    "file_series",
    "ordered_artifacts",
    "numbered_response",
    "staged_instruction",
    "checklist_progression",
    "migration_sequence",
    "test_sequence",
    "generic_sequence"
  ]);

  const SEQUENCE_STATUSES = Object.freeze([
    "registered",
    "active",
    "paused",
    "completed",
    "cancelled",
    "superseded",
    "archived"
  ]);

  const ITEM_STATUSES = Object.freeze([
    "pending",
    "ready",
    "delivering",
    "delivered",
    "skipped",
    "cancelled"
  ]);

  const COMMAND_TYPES = Object.freeze([
    "create",
    "update",
    "activate",
    "start",
    "prepare_next",
    "mark_delivering",
    "mark_delivered",
    "advance",
    "skip",
    "pause",
    "resume",
    "complete",
    "cancel",
    "supersede",
    "archive",
    "append_items",
    "replace_items",
    "clear_active",
    "noop"
  ]);

  const CLOSED_SEQUENCE_STATUSES = Object.freeze([
    "completed",
    "cancelled",
    "superseded",
    "archived"
  ]);

  const ACTIVE_ELIGIBLE_STATUSES = Object.freeze([
    "registered",
    "active",
    "paused"
  ]);

  const TERMINAL_ITEM_STATUSES = Object.freeze([
    "delivered",
    "skipped",
    "cancelled"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosDeliverySequenceManagerError extends Error {
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
        "COS delivery sequence manager error"
      );

      this.name =
        "CosDeliverySequenceManagerError";

      this.code =
        code ||
        "COS_DELIVERY_SEQUENCE_MANAGER_ERROR";

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
          CosDeliverySequenceManagerError
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

  function createId(
    prefix = "sequence"
  ) {
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

  function clampInteger(
    value,
    minimum,
    maximum
  ) {
    return Math.min(
      maximum,
      Math.max(
        minimum,
        normalizeInteger(
          value,
          minimum
        )
      )
    );
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeManagerInput(
    rawInput = {}
  ) {
    const source =
      isObject(rawInput)
        ? rawInput
        : {};

    const state =
      firstDefined(
        source.state,
        source.deliverySequenceState,
        source.delivery_sequence_state,
        {}
      );

    const command =
      firstDefined(
        source.command,
        source.operation,
        source.action,
        {}
      );

    return {
      state:
        isObject(state)
          ? safeClone(state)
          : {},

      command:
        isObject(command)
          ? safeClone(command)
          : {
              type:
                isNonEmptyString(command)
                  ? command
                  : "noop"
            },

      currentTurn:
        isObject(source.currentTurn)
          ? safeClone(source.currentTurn)
          : {},

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state &&
            state.conversationId,
          state &&
            state.conversation_id
        ) || null,

      options:
        isObject(source.options)
          ? safeClone(source.options)
          : {}
    };
  }

  /* =====================================================
     FIELD READERS
  ===================================================== */

  function readCommandType(command) {
    const type =
      firstNonEmptyString(
        command.type,
        command.commandType,
        command.command_type,
        command.action,
        command.operation
      );

    return COMMAND_TYPES.includes(type)
      ? type
      : "noop";
  }

  function readSequenceId(source) {
    return firstNonEmptyString(
      source.sequenceId,
      source.sequence_id,
      source.id
    );
  }

  function readItemId(source) {
    return firstNonEmptyString(
      source.itemId,
      source.item_id,
      source.sequenceItemId,
      source.sequence_item_id
    );
  }

  function readCurrentTurnId(turn) {
    return firstNonEmptyString(
      turn.turnId,
      turn.turn_id,
      turn.id,
      turn.messageId,
      turn.message_id
    );
  }

  function normalizeSequenceType(
    value
  ) {
    return SEQUENCE_TYPES.includes(value)
      ? value
      : "generic_sequence";
  }

  function normalizeSequenceStatus(
    value
  ) {
    return SEQUENCE_STATUSES.includes(
      value
    )
      ? value
      : "registered";
  }

  function normalizeItemStatus(
    value
  ) {
    return ITEM_STATUSES.includes(value)
      ? value
      : "pending";
  }

  /* =====================================================
     ITEM NORMALIZATION
  ===================================================== */

  function normalizeSequenceItem(
    rawItem,
    index,
    sequenceId
  ) {
    if (isNonEmptyString(rawItem)) {
      return {
        itemId:
          `${sequenceId}_item_${index + 1}`,

        position:
          index + 1,

        label:
          rawItem.trim(),

        status:
          "pending",

        artifactId: null,
        filePath: null,

        sourceTurnId: null,
        preparedTurnId: null,
        deliveryTurnId: null,

        deliveryAttemptTurnIds: [],

        createdAt:
          nowIso(),

        readyAt: null,
        deliveringAt: null,
        deliveredAt: null,
        skippedAt: null,
        cancelledAt: null,

        metadata: {}
      };
    }

    if (!isObject(rawItem)) {
      return null;
    }

    const itemId =
      firstNonEmptyString(
        rawItem.itemId,
        rawItem.item_id,
        rawItem.id
      ) ||
      `${sequenceId}_item_${index + 1}`;

    return {
      itemId,

      position:
        Math.max(
          1,
          normalizeInteger(
            firstDefined(
              rawItem.position,
              rawItem.part,
              rawItem.partNumber,
              rawItem.part_number,
              index + 1
            ),
            index + 1
          )
        ),

      label:
        firstNonEmptyString(
          rawItem.label,
          rawItem.title,
          rawItem.name,
          rawItem.filePath,
          rawItem.file_path
        ) || itemId,

      status:
        normalizeItemStatus(
          firstNonEmptyString(
            rawItem.status
          ) ||
          "pending"
        ),

      artifactId:
        firstNonEmptyString(
          rawItem.artifactId,
          rawItem.artifact_id
        ) || null,

      filePath:
        firstNonEmptyString(
          rawItem.filePath,
          rawItem.file_path,
          rawItem.path
        ) || null,

      sourceTurnId:
        firstNonEmptyString(
          rawItem.sourceTurnId,
          rawItem.source_turn_id
        ) || null,

      preparedTurnId:
        firstNonEmptyString(
          rawItem.preparedTurnId,
          rawItem.prepared_turn_id
        ) || null,

      deliveryTurnId:
        firstNonEmptyString(
          rawItem.deliveryTurnId,
          rawItem.delivery_turn_id
        ) || null,

      deliveryAttemptTurnIds:
        uniqueStrings(
          firstDefined(
            rawItem.deliveryAttemptTurnIds,
            rawItem.delivery_attempt_turn_ids,
            []
          )
        ),

      createdAt:
        normalizeTimestamp(
          rawItem.createdAt,
          nowIso()
        ),

      readyAt:
        normalizeTimestamp(
          rawItem.readyAt,
          null
        ),

      deliveringAt:
        normalizeTimestamp(
          rawItem.deliveringAt,
          null
        ),

      deliveredAt:
        normalizeTimestamp(
          rawItem.deliveredAt,
          null
        ),

      skippedAt:
        normalizeTimestamp(
          rawItem.skippedAt,
          null
        ),

      cancelledAt:
        normalizeTimestamp(
          rawItem.cancelledAt,
          null
        ),

      metadata:
        isObject(rawItem.metadata)
          ? safeClone(
              rawItem.metadata
            )
          : {}
    };
  }

  function normalizeSequenceItems(
    values,
    sequenceId
  ) {
    const items =
      asArray(values)
        .map(
          (item, index) =>
            normalizeSequenceItem(
              item,
              index,
              sequenceId
            )
        )
        .filter(Boolean);

    const seenIds = new Set();

    for (const item of items) {
      if (seenIds.has(item.itemId)) {
        throw new CosDeliverySequenceManagerError(
          "COS_DELIVERY_SEQUENCE_DUPLICATE_ITEM_ID",
          "Delivery sequence contains duplicate item IDs.",
          {
            details: {
              sequenceId,
              itemId:
                item.itemId
            }
          }
        );
      }

      seenIds.add(item.itemId);
    }

    return items
      .sort(
        (left, right) =>
          left.position -
          right.position
      )
      .map(
        (item, index) => ({
          ...item,
          position:
            index + 1
        })
      );
  }

  /* =====================================================
     STATE NORMALIZATION
  ===================================================== */

  function normalizeSequenceState(
    rawState,
    conversationId
  ) {
    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    const sequences =
      isObject(source.sequences)
        ? source.sequences
        : {};

    const order =
      uniqueStrings(
        firstDefined(
          source.order,
          source.sequenceOrder,
          source.sequence_order,
          Object.keys(sequences)
        )
      );

    const byArtifactId =
      isObject(source.byArtifactId)
        ? source.byArtifactId
        : isObject(source.by_artifact_id)
          ? source.by_artifact_id
          : {};

    const bySourceTurnId =
      isObject(source.bySourceTurnId)
        ? source.bySourceTurnId
        : isObject(
            source.by_source_turn_id
          )
          ? source.by_source_turn_id
          : {};

    return {
      schemaVersion:
        firstNonEmptyString(
          source.schemaVersion,
          source.schema_version
        ) || SCHEMA_VERSION,

      authority:
        firstNonEmptyString(
          source.authority
        ) || AUTHORITY,

      stateType:
        SEQUENCE_STATE_TYPE,

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

      sequences,

      order,

      byArtifactId,

      bySourceTurnId,

      lastCommand:
        isObject(source.lastCommand)
          ? source.lastCommand
          : null,

      createdAt:
        normalizeTimestamp(
          source.createdAt,
          nowIso()
        ),

      updatedAt:
        nowIso()
    };
  }

  /* =====================================================
     LOOKUP
  ===================================================== */

  function readSequence(
    state,
    sequenceId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.sequences) ||
      !isNonEmptyString(sequenceId)
    ) {
      return null;
    }

    const sequence =
      state.sequences[
        sequenceId
      ];

    return isObject(sequence)
      ? sequence
      : null;
  }

  function requireSequence(
    state,
    sequenceId
  ) {
    const sequence =
      readSequence(
        state,
        sequenceId
      );

    if (!sequence) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NOT_FOUND",
        "Delivery sequence was not found.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    return sequence;
  }

  function readItem(
    sequence,
    itemId
  ) {
    if (
      !isObject(sequence) ||
      !Array.isArray(sequence.items) ||
      !isNonEmptyString(itemId)
    ) {
      return null;
    }

    return (
      sequence.items.find(
        (item) =>
          item.itemId === itemId
      ) || null
    );
  }

  function findItemIndex(
    sequence,
    itemId
  ) {
    if (
      !isObject(sequence) ||
      !Array.isArray(sequence.items) ||
      !isNonEmptyString(itemId)
    ) {
      return -1;
    }

    return sequence.items.findIndex(
      (item) =>
        item.itemId === itemId
    );
  }

  /* =====================================================
     INDEXING
  ===================================================== */

  function addToIndex(
    index,
    key,
    sequenceId
  ) {
    if (
      !isNonEmptyString(key) ||
      !isNonEmptyString(sequenceId)
    ) {
      return;
    }

    const existing =
      Array.isArray(index[key])
        ? index[key]
        : [];

    index[key] =
      uniqueStrings([
        ...existing,
        sequenceId
      ]);
  }

  function removeFromIndex(
    index,
    key,
    sequenceId
  ) {
    if (
      !isNonEmptyString(key) ||
      !Array.isArray(index[key])
    ) {
      return;
    }

    const next =
      index[key].filter(
        (candidateSequenceId) =>
          candidateSequenceId !==
          sequenceId
      );

    if (next.length > 0) {
      index[key] = next;
    } else {
      delete index[key];
    }
  }

  function indexSequence(
    state,
    sequence
  ) {
    if (sequence.sourceTurnId) {
      addToIndex(
        state.bySourceTurnId,
        sequence.sourceTurnId,
        sequence.sequenceId
      );
    }

    for (
      const sourceTurnId of
        sequence.relatedTurnIds || []
    ) {
      addToIndex(
        state.bySourceTurnId,
        sourceTurnId,
        sequence.sequenceId
      );
    }

    for (
      const artifactId of
        sequence.artifactIds || []
    ) {
      addToIndex(
        state.byArtifactId,
        artifactId,
        sequence.sequenceId
      );
    }

    for (
      const item of
        sequence.items || []
    ) {
      if (item.artifactId) {
        addToIndex(
          state.byArtifactId,
          item.artifactId,
          sequence.sequenceId
        );
      }

      if (item.sourceTurnId) {
        addToIndex(
          state.bySourceTurnId,
          item.sourceTurnId,
          sequence.sequenceId
        );
      }

      if (item.deliveryTurnId) {
        addToIndex(
          state.bySourceTurnId,
          item.deliveryTurnId,
          sequence.sequenceId
        );
      }
    }
  }

  function deindexSequence(
    state,
    sequence
  ) {
    if (sequence.sourceTurnId) {
      removeFromIndex(
        state.bySourceTurnId,
        sequence.sourceTurnId,
        sequence.sequenceId
      );
    }

    for (
      const sourceTurnId of
        sequence.relatedTurnIds || []
    ) {
      removeFromIndex(
        state.bySourceTurnId,
        sourceTurnId,
        sequence.sequenceId
      );
    }

    for (
      const artifactId of
        sequence.artifactIds || []
    ) {
      removeFromIndex(
        state.byArtifactId,
        artifactId,
        sequence.sequenceId
      );
    }

    for (
      const item of
        sequence.items || []
    ) {
      if (item.artifactId) {
        removeFromIndex(
          state.byArtifactId,
          item.artifactId,
          sequence.sequenceId
        );
      }

      if (item.sourceTurnId) {
        removeFromIndex(
          state.bySourceTurnId,
          item.sourceTurnId,
          sequence.sequenceId
        );
      }

      if (item.deliveryTurnId) {
        removeFromIndex(
          state.bySourceTurnId,
          item.deliveryTurnId,
          sequence.sequenceId
        );
      }
    }
  }

  /* =====================================================
     SEQUENCE DERIVATION
  ===================================================== */

  function deriveSequenceMetrics(
    sequence
  ) {
    const items =
      Array.isArray(sequence.items)
        ? sequence.items
        : [];

    const deliveredItems =
      items.filter(
        (item) =>
          item.status === "delivered"
      );

    const skippedItems =
      items.filter(
        (item) =>
          item.status === "skipped"
      );

    const cancelledItems =
      items.filter(
        (item) =>
          item.status === "cancelled"
      );

    const terminalItems =
      items.filter(
        (item) =>
          TERMINAL_ITEM_STATUSES.includes(
            item.status
          )
      );

    const remainingItems =
      items.filter(
        (item) =>
          !TERMINAL_ITEM_STATUSES.includes(
            item.status
          )
      );

    const deliveringItem =
      items.find(
        (item) =>
          item.status === "delivering"
      ) || null;

    const readyItem =
      items.find(
        (item) =>
          item.status === "ready"
      ) || null;

    const nextPendingItem =
      items.find(
        (item) =>
          item.status === "pending"
      ) || null;

    const nextItem =
      deliveringItem ||
      readyItem ||
      nextPendingItem ||
      null;

    const lastDeliveredItem =
      [...deliveredItems]
        .sort(
          (left, right) =>
            right.position -
            left.position
        )[0] || null;

    const complete =
      items.length > 0 &&
      terminalItems.length ===
        items.length;

    return {
      totalItems:
        items.length,

      deliveredCount:
        deliveredItems.length,

      skippedCount:
        skippedItems.length,

      cancelledItemCount:
        cancelledItems.length,

      completedItemCount:
        terminalItems.length,

      remainingCount:
        remainingItems.length,

      currentItemId:
        deliveringItem
          ? deliveringItem.itemId
          : readyItem
            ? readyItem.itemId
            : null,

      currentPosition:
        deliveringItem
          ? deliveringItem.position
          : readyItem
            ? readyItem.position
            : null,

      nextItemId:
        nextItem
          ? nextItem.itemId
          : null,

      nextPosition:
        nextItem
          ? nextItem.position
          : null,

      lastDeliveredItemId:
        lastDeliveredItem
          ? lastDeliveredItem.itemId
          : null,

      lastDeliveredPart:
        lastDeliveredItem
          ? lastDeliveredItem.position
          : 0,

      nextPart:
        nextItem
          ? nextItem.position
          : null,

      totalParts:
        items.length,

      complete
    };
  }

  function applyDerivedMetrics(
    sequence
  ) {
    return {
      ...sequence,
      ...deriveSequenceMetrics(
        sequence
      )
    };
  }

  /* =====================================================
     SEQUENCE CONSTRUCTION
  ===================================================== */

  function createSequence(
    command,
    context
  ) {
    const timestamp =
      nowIso();

    const sequenceId =
      readSequenceId(command) ||
      createId("sequence");

    const items =
      normalizeSequenceItems(
        firstDefined(
          command.items,
          command.parts,
          command.entries,
          []
        ),
        sequenceId
      );

    const sourceTurnId =
      firstNonEmptyString(
        command.sourceTurnId,
        command.source_turn_id,
        command.createdByTurnId,
        command.created_by_turn_id,
        context.currentTurnId
      );

    const artifactIds =
      uniqueStrings([
        ...asArray(
          firstDefined(
            command.artifactIds,
            command.artifact_ids,
            []
          )
        ),

        ...items
          .map(
            (item) =>
              item.artifactId
          )
          .filter(Boolean)
      ]);

    const sequence = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      sequenceId,

      conversationId:
        context.conversationId,

      sequenceType:
        normalizeSequenceType(
          firstNonEmptyString(
            command.sequenceType,
            command.sequence_type,
            command.kind
          ) ||
          "generic_sequence"
        ),

      status:
        normalizeSequenceStatus(
          firstNonEmptyString(
            command.status
          ) ||
          "registered"
        ),

      name:
        firstNonEmptyString(
          command.name,
          command.title,
          command.label
        ) || sequenceId,

      description:
        firstNonEmptyString(
          command.description
        ) || null,

      sourceTurnId:
        sourceTurnId || null,

      lastTurnId:
        firstNonEmptyString(
          command.lastTurnId,
          command.last_turn_id,
          sourceTurnId
        ) || null,

      relatedTurnIds:
        uniqueStrings([
          ...asArray(
            firstDefined(
              command.relatedTurnIds,
              command.related_turn_ids,
              []
            )
          ),

          sourceTurnId
        ]),

      artifactIds,

      pendingInteractionId:
        firstNonEmptyString(
          command.pendingInteractionId,
          command.pending_interaction_id
        ) || null,

      parentSequenceId:
        firstNonEmptyString(
          command.parentSequenceId,
          command.parent_sequence_id
        ) || null,

      previousSequenceId:
        firstNonEmptyString(
          command.previousSequenceId,
          command.previous_sequence_id
        ) || null,

      nextSequenceId:
        firstNonEmptyString(
          command.nextSequenceId,
          command.next_sequence_id
        ) || null,

      supersedesSequenceIds:
        uniqueStrings(
          firstDefined(
            command.supersedesSequenceIds,
            command.supersedes_sequence_ids,
            []
          )
        ),

      supersededBySequenceId:
        null,

      items,

      revision:
        Math.max(
          1,
          normalizeInteger(
            command.revision,
            1
          )
        ),

      continuationToken:
        firstNonEmptyString(
          command.continuationToken,
          command.continuation_token
        ) ||
        createId("continuation"),

      createdAt:
        timestamp,

      registeredAt:
        timestamp,

      activatedAt: null,
      startedAt: null,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      cancelledAt: null,
      supersededAt: null,
      archivedAt: null,

      updatedAt:
        timestamp,

      metadata:
        isObject(command.metadata)
          ? safeClone(
              command.metadata
            )
          : {}
    };

    return applyDerivedMetrics(
      sequence
    );
  }

  /* =====================================================
     ACTIVE SEQUENCE
  ===================================================== */

  function findMostRecentEligibleSequenceId(
    state,
    excludedSequenceId = null
  ) {
    for (
      let index =
        state.order.length - 1;
      index >= 0;
      index -= 1
    ) {
      const sequenceId =
        state.order[index];

      if (
        sequenceId ===
        excludedSequenceId
      ) {
        continue;
      }

      const sequence =
        readSequence(
          state,
          sequenceId
        );

      if (
        sequence &&
        ACTIVE_ELIGIBLE_STATUSES.includes(
          sequence.status
        )
      ) {
        return sequenceId;
      }
    }

    return null;
  }

  function setActiveSequence(
    state,
    sequenceId
  ) {
    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      !ACTIVE_ELIGIBLE_STATUSES.includes(
        sequence.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NOT_ACTIVE_ELIGIBLE",
        "Closed delivery sequence cannot become active.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const previousActiveSequenceId =
      state.activeSequenceId;

    if (
      previousActiveSequenceId &&
      previousActiveSequenceId !==
        sequenceId
    ) {
      const previous =
        readSequence(
          state,
          previousActiveSequenceId
        );

      if (
        previous &&
        previous.status === "active"
      ) {
        state.sequences[
          previousActiveSequenceId
        ] = applyDerivedMetrics({
          ...safeClone(previous),

          status:
            "paused",

          pausedAt:
            nowIso(),

          updatedAt:
            nowIso()
        });
      }
    }

    state.sequences[
      sequenceId
    ] = applyDerivedMetrics({
      ...safeClone(sequence),

      status:
        sequence.status === "registered" ||
        sequence.status === "paused"
          ? "active"
          : sequence.status,

      activatedAt:
        sequence.activatedAt ||
        nowIso(),

      updatedAt:
        nowIso()
    });

    state.activeSequenceId =
      sequenceId;

    return {
      previousActiveSequenceId,
      nextActiveSequenceId:
        sequenceId
    };
  }

  /* =====================================================
     ITEM SELECTION
  ===================================================== */

  function selectNextActionableItem(
    sequence
  ) {
    if (!Array.isArray(sequence.items)) {
      return null;
    }

    return (
      sequence.items.find(
        (item) =>
          item.status === "delivering"
      ) ||
      sequence.items.find(
        (item) =>
          item.status === "ready"
      ) ||
      sequence.items.find(
        (item) =>
          item.status === "pending"
      ) ||
      null
    );
  }

  function selectCurrentItem(
    sequence
  ) {
    if (!Array.isArray(sequence.items)) {
      return null;
    }

    return (
      sequence.items.find(
        (item) =>
          item.status === "delivering"
      ) ||
      sequence.items.find(
        (item) =>
          item.status === "ready"
      ) ||
      null
    );
  }

  function resolveCommandItem(
    sequence,
    command,
    {
      allowNext = true
    } = {}
  ) {
    const itemId =
      readItemId(command);

    if (itemId) {
      const item =
        readItem(
          sequence,
          itemId
        );

      if (!item) {
        throw new CosDeliverySequenceManagerError(
          "COS_DELIVERY_SEQUENCE_ITEM_NOT_FOUND",
          "Delivery sequence item was not found.",
          {
            details: {
              sequenceId:
                sequence.sequenceId,

              itemId
            }
          }
        );
      }

      return item;
    }

    if (allowNext) {
      return selectNextActionableItem(
        sequence
      );
    }

    return selectCurrentItem(
      sequence
    );
  }

  /* =====================================================
     CREATE COMMAND
  ===================================================== */

  function applyCreate(
    state,
    command,
    context
  ) {
    const sequence =
      createSequence(
        command,
        context
      );

    if (
      hasOwn(
        state.sequences,
        sequence.sequenceId
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_DUPLICATE_ID",
        "Delivery sequence ID already exists.",
        {
          details: {
            sequenceId:
              sequence.sequenceId
          }
        }
      );
    }

    state.sequences[
      sequence.sequenceId
    ] = sequence;

    state.order =
      uniqueStrings([
        ...state.order,
        sequence.sequenceId
      ]);

    indexSequence(
      state,
      sequence
    );

    const previousActiveSequenceId =
      state.activeSequenceId;

    if (command.activate !== false) {
      setActiveSequence(
        state,
        sequence.sequenceId
      );
    }

    for (
      const supersededSequenceId of
        sequence.supersedesSequenceIds
    ) {
      const superseded =
        readSequence(
          state,
          supersededSequenceId
        );

      if (!superseded) {
        continue;
      }

      state.sequences[
        supersededSequenceId
      ] = applyDerivedMetrics({
        ...safeClone(superseded),

        status:
          "superseded",

        supersededBySequenceId:
          sequence.sequenceId,

        supersededAt:
          nowIso(),

        updatedAt:
          nowIso()
      });
    }

    return {
      sequenceId:
        sequence.sequenceId,

      itemId: null,

      sequenceCreated:
        true,

      previousActiveSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(
          state.sequences[
            sequence.sequenceId
          ]
        ),

      item: null
    };
  }

  /* =====================================================
     UPDATE COMMAND
  ===================================================== */

  function applyUpdate(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const existing =
      requireSequence(
        state,
        sequenceId
      );

    if (
      CLOSED_SEQUENCE_STATUSES.includes(
        existing.status
      ) &&
      command.allowClosedUpdate !== true
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_CLOSED_UPDATE_FORBIDDEN",
        "Closed delivery sequence cannot be updated.",
        {
          details: {
            sequenceId,
            status:
              existing.status
          }
        }
      );
    }

    const patch =
      isObject(command.patch)
        ? command.patch
        : command;

    deindexSequence(
      state,
      existing
    );

    const updated = applyDerivedMetrics({
      ...safeClone(existing),

      sequenceType:
        (
          hasOwn(
            patch,
            "sequenceType"
          ) ||
          hasOwn(
            patch,
            "sequence_type"
          )
        )
          ? normalizeSequenceType(
              firstNonEmptyString(
                patch.sequenceType,
                patch.sequence_type
              ) ||
              existing.sequenceType
            )
          : existing.sequenceType,

      name:
        firstNonEmptyString(
          patch.name,
          patch.title,
          patch.label,
          existing.name
        ) || sequenceId,

      description:
        (
          hasOwn(
            patch,
            "description"
          )
        )
          ? firstNonEmptyString(
              patch.description
            )
          : existing.description,

      sourceTurnId:
        firstNonEmptyString(
          patch.sourceTurnId,
          patch.source_turn_id,
          existing.sourceTurnId
        ) || null,

      lastTurnId:
        firstNonEmptyString(
          patch.lastTurnId,
          patch.last_turn_id,
          context.currentTurnId,
          existing.lastTurnId
        ) || null,

      relatedTurnIds:
        (
          hasOwn(
            patch,
            "relatedTurnIds"
          ) ||
          hasOwn(
            patch,
            "related_turn_ids"
          )
        )
          ? uniqueStrings(
              firstDefined(
                patch.relatedTurnIds,
                patch.related_turn_ids,
                []
              )
            )
          : uniqueStrings([
              ...existing.relatedTurnIds,

              ...asArray(
                firstDefined(
                  patch.appendRelatedTurnIds,
                  patch.append_related_turn_ids,
                  []
                )
              ),

              context.currentTurnId
            ]),

      artifactIds:
        (
          hasOwn(
            patch,
            "artifactIds"
          ) ||
          hasOwn(
            patch,
            "artifact_ids"
          )
        )
          ? uniqueStrings(
              firstDefined(
                patch.artifactIds,
                patch.artifact_ids,
                []
              )
            )
          : uniqueStrings([
              ...existing.artifactIds,

              ...asArray(
                firstDefined(
                  patch.appendArtifactIds,
                  patch.append_artifact_ids,
                  []
                )
              )
            ]),

      pendingInteractionId:
        (
          hasOwn(
            patch,
            "pendingInteractionId"
          ) ||
          hasOwn(
            patch,
            "pending_interaction_id"
          )
        )
          ? firstNonEmptyString(
              patch.pendingInteractionId,
              patch.pending_interaction_id
            )
          : existing.pendingInteractionId,

      continuationToken:
        (
          hasOwn(
            patch,
            "continuationToken"
          ) ||
          hasOwn(
            patch,
            "continuation_token"
          )
        )
          ? firstNonEmptyString(
              patch.continuationToken,
              patch.continuation_token
            )
          : existing.continuationToken,

      revision:
        Math.max(
          existing.revision + 1,
          normalizeInteger(
            patch.revision,
            existing.revision + 1
          )
        ),

      metadata:
        isObject(patch.metadata)
          ? {
              ...safeClone(
                existing.metadata
              ),

              ...safeClone(
                patch.metadata
              )
            }
          : safeClone(
              existing.metadata
            ),

      updatedAt:
        nowIso()
    });

    state.sequences[
      sequenceId
    ] = updated;

    indexSequence(
      state,
      updated
    );

    if (command.activate === true) {
      setActiveSequence(
        state,
        sequenceId
      );
    }

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(
          state.sequences[
            sequenceId
          ]
        ),

      item: null
    };
  }

  /* =====================================================
     START / ACTIVATE
  ===================================================== */

  function applyActivate(
    state,
    command
  ) {
    const sequenceId =
      readSequenceId(command);

    if (!sequenceId) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ID_REQUIRED",
        "Delivery sequence activation requires a sequence ID."
      );
    }

    const transition =
      setActiveSequence(
        state,
        sequenceId
      );

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      ...transition,

      sequence:
        safeClone(
          state.sequences[
            sequenceId
          ]
        ),

      item: null
    };
  }

  function applyStart(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      CLOSED_SEQUENCE_STATUSES.includes(
        sequence.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_START_CLOSED_FORBIDDEN",
        "Closed delivery sequence cannot be started.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const activeTransition =
      setActiveSequence(
        state,
        sequenceId
      );

    const activeSequence =
      state.sequences[
        sequenceId
      ];

    const nextItem =
      selectNextActionableItem(
        activeSequence
      );

    let updatedItems =
      safeClone(
        activeSequence.items
      );

    if (
      nextItem &&
      nextItem.status === "pending"
    ) {
      updatedItems =
        updatedItems.map(
          (item) =>
            item.itemId ===
            nextItem.itemId
              ? {
                  ...item,

                  status:
                    "ready",

                  readyAt:
                    nowIso()
                }
              : item
        );
    }

    const updated =
      applyDerivedMetrics({
        ...safeClone(
          activeSequence
        ),

        status:
          "active",

        startedAt:
          activeSequence.startedAt ||
          nowIso(),

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            activeSequence.lastTurnId
          ) || null,

        items:
          updatedItems,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        updated.currentItemId ||
        updated.nextItemId,

      sequenceCreated:
        false,

      ...activeTransition,

      sequence:
        safeClone(updated),

      item:
        updated.currentItemId
          ? safeClone(
              readItem(
                updated,
                updated.currentItemId
              )
            )
          : updated.nextItemId
            ? safeClone(
                readItem(
                  updated,
                  updated.nextItemId
                )
              )
            : null
    };
  }

  /* =====================================================
     PREPARE NEXT
  ===================================================== */

  function applyPrepareNext(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "active"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NOT_ACTIVE",
        "Only an active sequence can prepare its next item.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const item =
      resolveCommandItem(
        sequence,
        command
      );

    if (!item) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NO_REMAINING_ITEM",
        "Delivery sequence has no remaining item to prepare.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    if (
      TERMINAL_ITEM_STATUSES.includes(
        item.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ITEM_ALREADY_TERMINAL",
        "Terminal delivery item cannot be prepared.",
        {
          details: {
            sequenceId,
            itemId:
              item.itemId,
            status:
              item.status
          }
        }
      );
    }

    const updatedItems =
      sequence.items.map(
        (candidate) => {
          if (
            candidate.itemId ===
            item.itemId
          ) {
            return {
              ...safeClone(candidate),

              status:
                "ready",

              preparedTurnId:
                firstNonEmptyString(
                  command.preparedTurnId,
                  command.prepared_turn_id,
                  context.currentTurnId
                ) || null,

              readyAt:
                candidate.readyAt ||
                nowIso(),

              metadata:
                isObject(command.metadata)
                  ? {
                      ...safeClone(
                        candidate.metadata
                      ),

                      ...safeClone(
                        command.metadata
                      )
                    }
                  : safeClone(
                      candidate.metadata
                    )
            };
          }

          if (
            candidate.status === "ready"
          ) {
            return {
              ...safeClone(candidate),
              status: "pending"
            };
          }

          return safeClone(candidate);
        }
      );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          updatedItems,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        item.itemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        safeClone(
          readItem(
            updated,
            item.itemId
          )
        )
    };
  }

  /* =====================================================
     MARK DELIVERING
  ===================================================== */

  function applyMarkDelivering(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "active"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NOT_ACTIVE",
        "Only an active sequence can deliver an item.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const item =
      resolveCommandItem(
        sequence,
        command
      );

    if (!item) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NO_ITEM_TO_DELIVER",
        "Delivery sequence has no item available for delivery.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    if (
      TERMINAL_ITEM_STATUSES.includes(
        item.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_TERMINAL_ITEM_DELIVERY_FORBIDDEN",
        "Terminal delivery item cannot re-enter delivery.",
        {
          details: {
            sequenceId,
            itemId:
              item.itemId,
            status:
              item.status
          }
        }
      );
    }

    const deliveryAttemptTurnId =
      firstNonEmptyString(
        command.deliveryAttemptTurnId,
        command.delivery_attempt_turn_id,
        context.currentTurnId
      );

    const updatedItems =
      sequence.items.map(
        (candidate) => {
          if (
            candidate.itemId ===
            item.itemId
          ) {
            return {
              ...safeClone(candidate),

              status:
                "delivering",

              deliveringAt:
                candidate.deliveringAt ||
                nowIso(),

              deliveryAttemptTurnIds:
                uniqueStrings([
                  ...candidate
                    .deliveryAttemptTurnIds,

                  deliveryAttemptTurnId
                ]),

              metadata:
                isObject(command.metadata)
                  ? {
                      ...safeClone(
                        candidate.metadata
                      ),

                      ...safeClone(
                        command.metadata
                      )
                    }
                  : safeClone(
                      candidate.metadata
                    )
            };
          }

          if (
            candidate.status ===
            "delivering"
          ) {
            return {
              ...safeClone(candidate),
              status: "ready"
            };
          }

          return safeClone(candidate);
        }
      );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          updatedItems,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        item.itemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        safeClone(
          readItem(
            updated,
            item.itemId
          )
        )
    };
  }

  /* =====================================================
     MARK DELIVERED
  ===================================================== */

  function applyMarkDelivered(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "active"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NOT_ACTIVE",
        "Only an active sequence can mark delivery.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const item =
      resolveCommandItem(
        sequence,
        command,
        {
          allowNext: false
        }
      ) ||
      resolveCommandItem(
        sequence,
        command
      );

    if (!item) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NO_ITEM_TO_COMPLETE",
        "Delivery sequence has no current item to mark delivered.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    if (
      item.status === "delivered"
    ) {
      if (
        command.allowAlreadyDelivered ===
        true
      ) {
        return {
          sequenceId,

          itemId:
            item.itemId,

          sequenceCreated:
            false,

          previousActiveSequenceId:
            state.activeSequenceId,

          nextActiveSequenceId:
            state.activeSequenceId,

          sequence:
            safeClone(sequence),

          item:
            safeClone(item)
        };
      }

      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ITEM_ALREADY_DELIVERED",
        "Delivery sequence item is already delivered.",
        {
          details: {
            sequenceId,
            itemId:
              item.itemId
          }
        }
      );
    }

    if (
      item.status === "skipped" ||
      item.status === "cancelled"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_TERMINAL_ITEM_COMPLETION_FORBIDDEN",
        "Skipped or cancelled item cannot be marked delivered.",
        {
          details: {
            sequenceId,
            itemId:
              item.itemId,
            status:
              item.status
          }
        }
      );
    }

    const deliveryTurnId =
      firstNonEmptyString(
        command.deliveryTurnId,
        command.delivery_turn_id,
        context.currentTurnId
      );

    const updatedItems =
      sequence.items.map(
        (candidate) =>
          candidate.itemId ===
          item.itemId
            ? {
                ...safeClone(candidate),

                status:
                  "delivered",

                deliveryTurnId:
                  deliveryTurnId ||
                  candidate.deliveryTurnId,

                deliveryAttemptTurnIds:
                  uniqueStrings([
                    ...candidate
                      .deliveryAttemptTurnIds,

                    deliveryTurnId
                  ]),

                deliveredAt:
                  nowIso(),

                metadata:
                  isObject(command.metadata)
                    ? {
                        ...safeClone(
                          candidate.metadata
                        ),

                        ...safeClone(
                          command.metadata
                        )
                      }
                    : safeClone(
                        candidate.metadata
                      )
              }
            : safeClone(candidate)
      );

    let updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          updatedItems,

        lastTurnId:
          firstNonEmptyString(
            deliveryTurnId,
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        relatedTurnIds:
          uniqueStrings([
            ...sequence.relatedTurnIds,
            deliveryTurnId,
            context.currentTurnId
          ]),

        updatedAt:
          nowIso()
      });

    if (
      command.prepareFollowing !== false &&
      !updated.complete
    ) {
      const nextPending =
        updated.items.find(
          (candidate) =>
            candidate.status ===
            "pending"
        );

      if (nextPending) {
        updated = applyDerivedMetrics({
          ...updated,

          items:
            updated.items.map(
              (candidate) =>
                candidate.itemId ===
                nextPending.itemId
                  ? {
                      ...candidate,

                      status:
                        "ready",

                      readyAt:
                        nowIso()
                    }
                  : candidate
            )
        });
      }
    }

    if (
      updated.complete &&
      command.autoComplete !== false
    ) {
      updated = applyDerivedMetrics({
        ...updated,

        status:
          "completed",

        completedAt:
          nowIso(),

        updatedAt:
          nowIso()
      });

      if (
        state.activeSequenceId ===
        sequenceId
      ) {
        state.activeSequenceId =
          findMostRecentEligibleSequenceId(
            state,
            sequenceId
          );
      }
    }

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        item.itemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        sequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        safeClone(
          readItem(
            updated,
            item.itemId
          )
        )
    };
  }

  /* =====================================================
     ADVANCE
  ===================================================== */

  function applyAdvance(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "active"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ADVANCE_REQUIRES_ACTIVE",
        "Only an active delivery sequence can advance.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    if (sequence.complete) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ALREADY_COMPLETE",
        "Completed delivery sequence cannot advance.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    const currentItem =
      selectCurrentItem(
        sequence
      );

    if (
      currentItem &&
      currentItem.status ===
        "delivering" &&
      command.allowUndeliveredAdvance !==
        true
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_CURRENT_ITEM_NOT_FINISHED",
        "Current delivery item must be completed before advancing.",
        {
          details: {
            sequenceId,
            itemId:
              currentItem.itemId,
            status:
              currentItem.status
          }
        }
      );
    }

    const nextItem =
      sequence.items.find(
        (item) =>
          item.status === "pending"
      ) ||
      sequence.items.find(
        (item) =>
          item.status === "ready"
      );

    if (!nextItem) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NO_NEXT_ITEM",
        "Delivery sequence has no remaining next item.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    const updatedItems =
      sequence.items.map(
        (item) => {
          if (
            item.itemId ===
            nextItem.itemId
          ) {
            return {
              ...safeClone(item),

              status:
                "ready",

              preparedTurnId:
                firstNonEmptyString(
                  command.preparedTurnId,
                  command.prepared_turn_id,
                  context.currentTurnId,
                  item.preparedTurnId
                ) || null,

              readyAt:
                item.readyAt ||
                nowIso()
            };
          }

          if (
            item.status === "ready"
          ) {
            return {
              ...safeClone(item),
              status: "pending"
            };
          }

          return safeClone(item);
        }
      );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          updatedItems,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        nextItem.itemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        safeClone(
          readItem(
            updated,
            nextItem.itemId
          )
        )
    };
  }

  /* =====================================================
     SKIP
  ===================================================== */

  function applySkip(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    const item =
      resolveCommandItem(
        sequence,
        command
      );

    if (!item) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_NO_ITEM_TO_SKIP",
        "Delivery sequence has no item to skip.",
        {
          details: {
            sequenceId
          }
        }
      );
    }

    if (
      TERMINAL_ITEM_STATUSES.includes(
        item.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ITEM_ALREADY_TERMINAL",
        "Terminal item cannot be skipped.",
        {
          details: {
            sequenceId,
            itemId:
              item.itemId,
            status:
              item.status
          }
        }
      );
    }

    const updatedItems =
      sequence.items.map(
        (candidate) =>
          candidate.itemId ===
          item.itemId
            ? {
                ...safeClone(candidate),

                status:
                  "skipped",

                skippedAt:
                  nowIso(),

                metadata: {
                  ...safeClone(
                    candidate.metadata
                  ),

                  skipReason:
                    firstNonEmptyString(
                      command.reason,
                      command.code
                    ) || null,

                  ...(
                    isObject(command.metadata)
                      ? safeClone(
                          command.metadata
                        )
                      : {}
                  )
                }
              }
            : safeClone(candidate)
      );

    let updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          updatedItems,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        updatedAt:
          nowIso()
      });

    if (
      !updated.complete &&
      command.prepareFollowing !== false
    ) {
      const nextPending =
        updated.items.find(
          (candidate) =>
            candidate.status ===
            "pending"
        );

      if (nextPending) {
        updated = applyDerivedMetrics({
          ...updated,

          items:
            updated.items.map(
              (candidate) =>
                candidate.itemId ===
                nextPending.itemId
                  ? {
                      ...candidate,

                      status:
                        "ready",

                      readyAt:
                        nowIso()
                    }
                  : candidate
            )
        });
      }
    }

    if (
      updated.complete &&
      command.autoComplete !== false
    ) {
      updated = applyDerivedMetrics({
        ...updated,

        status:
          "completed",

        completedAt:
          nowIso(),

        updatedAt:
          nowIso()
      });

      if (
        state.activeSequenceId ===
        sequenceId
      ) {
        state.activeSequenceId =
          findMostRecentEligibleSequenceId(
            state,
            sequenceId
          );
      }
    }

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        item.itemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        sequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        safeClone(
          readItem(
            updated,
            item.itemId
          )
        )
    };
  }

  /* =====================================================
     PAUSE / RESUME
  ===================================================== */

  function applyPause(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "active"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_PAUSE_REQUIRES_ACTIVE",
        "Only an active delivery sequence can be paused.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        status:
          "paused",

        pausedAt:
          nowIso(),

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    if (
      state.activeSequenceId ===
      sequenceId
    ) {
      state.activeSequenceId =
        findMostRecentEligibleSequenceId(
          state,
          sequenceId
        );
    }

    return {
      sequenceId,

      itemId:
        updated.currentItemId ||
        updated.nextItemId,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        sequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item:
        updated.currentItemId
          ? safeClone(
              readItem(
                updated,
                updated.currentItemId
              )
            )
          : null
    };
  }

  function applyResume(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      sequence.status !== "paused" &&
      sequence.status !== "registered"
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_RESUME_STATUS_INVALID",
        "Only a paused or registered sequence can be resumed.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const activeTransition =
      setActiveSequence(
        state,
        sequenceId
      );

    let updated =
      state.sequences[
        sequenceId
      ];

    const nextItem =
      selectNextActionableItem(
        updated
      );

    if (
      nextItem &&
      nextItem.status === "pending"
    ) {
      updated = applyDerivedMetrics({
        ...safeClone(updated),

        items:
          updated.items.map(
            (item) =>
              item.itemId ===
              nextItem.itemId
                ? {
                    ...item,

                    status:
                      "ready",

                    readyAt:
                      nowIso()
                  }
                : item
          )
      });
    }

    updated = applyDerivedMetrics({
      ...safeClone(updated),

      status:
        "active",

      resumedAt:
        nowIso(),

      startedAt:
        updated.startedAt ||
        nowIso(),

      lastTurnId:
        firstNonEmptyString(
          context.currentTurnId,
          updated.lastTurnId
        ) || null,

      updatedAt:
        nowIso()
    });

    state.sequences[
      sequenceId
    ] = updated;

    return {
      sequenceId,

      itemId:
        updated.currentItemId ||
        updated.nextItemId,

      sequenceCreated:
        false,

      ...activeTransition,

      sequence:
        safeClone(updated),

      item:
        updated.currentItemId
          ? safeClone(
              readItem(
                updated,
                updated.currentItemId
              )
            )
          : updated.nextItemId
            ? safeClone(
                readItem(
                  updated,
                  updated.nextItemId
                )
              )
            : null
    };
  }

  /* =====================================================
     COMPLETE / CLOSE
  ===================================================== */

  function applyComplete(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    const remainingItems =
      sequence.items.filter(
        (item) =>
          !TERMINAL_ITEM_STATUSES.includes(
            item.status
          )
      );

    if (
      remainingItems.length > 0 &&
      command.force !== true
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_INCOMPLETE_ITEMS_REMAIN",
        "Delivery sequence cannot complete while unfinished items remain.",
        {
          details: {
            sequenceId,

            remainingItemIds:
              remainingItems.map(
                (item) =>
                  item.itemId
              )
          }
        }
      );
    }

    const items =
      command.force === true
        ? sequence.items.map(
            (item) =>
              TERMINAL_ITEM_STATUSES.includes(
                item.status
              )
                ? safeClone(item)
                : {
                    ...safeClone(item),

                    status:
                      "cancelled",

                    cancelledAt:
                      nowIso(),

                    metadata: {
                      ...safeClone(
                        item.metadata
                      ),

                      completionForced:
                        true
                    }
                  }
          )
        : safeClone(
            sequence.items
          );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        status:
          "completed",

        items,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        completedAt:
          nowIso(),

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    if (
      state.activeSequenceId ===
      sequenceId
    ) {
      state.activeSequenceId =
        findMostRecentEligibleSequenceId(
          state,
          sequenceId
        );
    }

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        sequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item: null
    };
  }

  function applyCloseStatus(
    state,
    command,
    context,
    status,
    timestampField
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      CLOSED_SEQUENCE_STATUSES.includes(
        sequence.status
      ) &&
      command.allowAlreadyClosed !== true
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_ALREADY_CLOSED",
        "Delivery sequence is already closed.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const cancelRemainingItems =
      status === "cancelled" ||
      status === "superseded";

    const items =
      cancelRemainingItems
        ? sequence.items.map(
            (item) =>
              TERMINAL_ITEM_STATUSES.includes(
                item.status
              )
                ? safeClone(item)
                : {
                    ...safeClone(item),

                    status:
                      "cancelled",

                    cancelledAt:
                      nowIso(),

                    metadata: {
                      ...safeClone(
                        item.metadata
                      ),

                      closureReason:
                        firstNonEmptyString(
                          command.reason,
                          command.code,
                          status
                        )
                    }
                  }
          )
        : safeClone(
            sequence.items
          );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        status,

        items,

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        [timestampField]:
          nowIso(),

        supersededBySequenceId:
          status === "superseded"
            ? firstNonEmptyString(
                command.supersededBySequenceId,
                command.superseded_by_sequence_id,
                command.replacementSequenceId,
                command.replacement_sequence_id
              )
            : sequence
                .supersededBySequenceId,

        metadata: {
          ...safeClone(
            sequence.metadata
          ),

          ...(
            isObject(command.metadata)
              ? safeClone(
                  command.metadata
                )
              : {}
          ),

          closureReason:
            firstNonEmptyString(
              command.reason,
              command.code
            ) || null
        },

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    if (
      state.activeSequenceId ===
      sequenceId
    ) {
      state.activeSequenceId =
        findMostRecentEligibleSequenceId(
          state,
          sequenceId
        );
    }

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        sequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item: null
    };
  }

  /* =====================================================
     APPEND / REPLACE ITEMS
  ===================================================== */

  function applyAppendItems(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      CLOSED_SEQUENCE_STATUSES.includes(
        sequence.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_APPEND_CLOSED_FORBIDDEN",
        "Items cannot be appended to a closed sequence.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    const newItems =
      normalizeSequenceItems(
        firstDefined(
          command.items,
          command.parts,
          command.entries,
          []
        ),
        sequenceId
      );

    if (newItems.length === 0) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_APPEND_ITEMS_EMPTY",
        "No sequence items were supplied for append."
      );
    }

    const existingIds =
      new Set(
        sequence.items.map(
          (item) =>
            item.itemId
        )
      );

    for (const item of newItems) {
      if (existingIds.has(item.itemId)) {
        throw new CosDeliverySequenceManagerError(
          "COS_DELIVERY_SEQUENCE_DUPLICATE_ITEM_ID",
          "Appended item ID already exists.",
          {
            details: {
              sequenceId,
              itemId:
                item.itemId
            }
          }
        );
      }
    }

    deindexSequence(
      state,
      sequence
    );

    const combinedItems =
      [
        ...safeClone(
          sequence.items
        ),

        ...newItems.map(
          (item, index) => ({
            ...item,

            position:
              sequence.items.length +
              index +
              1
          })
        )
      ];

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items:
          combinedItems,

        artifactIds:
          uniqueStrings([
            ...sequence.artifactIds,

            ...newItems
              .map(
                (item) =>
                  item.artifactId
              )
              .filter(Boolean)
          ]),

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        revision:
          sequence.revision + 1,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    indexSequence(
      state,
      updated
    );

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item: null
    };
  }

  function applyReplaceItems(
    state,
    command,
    context
  ) {
    const sequenceId =
      readSequenceId(command) ||
      state.activeSequenceId;

    const sequence =
      requireSequence(
        state,
        sequenceId
      );

    if (
      CLOSED_SEQUENCE_STATUSES.includes(
        sequence.status
      )
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_REPLACE_CLOSED_FORBIDDEN",
        "Items cannot be replaced on a closed sequence.",
        {
          details: {
            sequenceId,
            status:
              sequence.status
          }
        }
      );
    }

    if (
      sequence.deliveredCount > 0 &&
      command.allowDeliveredReplacement !==
        true
    ) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_DELIVERED_ITEMS_REPLACEMENT_FORBIDDEN",
        "Sequence items cannot be replaced after delivery has begun.",
        {
          details: {
            sequenceId,
            deliveredCount:
              sequence.deliveredCount
          }
        }
      );
    }

    const items =
      normalizeSequenceItems(
        firstDefined(
          command.items,
          command.parts,
          command.entries,
          []
        ),
        sequenceId
      );

    deindexSequence(
      state,
      sequence
    );

    const updated =
      applyDerivedMetrics({
        ...safeClone(sequence),

        items,

        artifactIds:
          uniqueStrings([
            ...asArray(
              firstDefined(
                command.artifactIds,
                command.artifact_ids,
                []
              )
            ),

            ...items
              .map(
                (item) =>
                  item.artifactId
              )
              .filter(Boolean)
          ]),

        lastTurnId:
          firstNonEmptyString(
            context.currentTurnId,
            sequence.lastTurnId
          ) || null,

        revision:
          sequence.revision + 1,

        updatedAt:
          nowIso()
      });

    state.sequences[
      sequenceId
    ] = updated;

    indexSequence(
      state,
      updated
    );

    return {
      sequenceId,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId:
        state.activeSequenceId,

      nextActiveSequenceId:
        state.activeSequenceId,

      sequence:
        safeClone(updated),

      item: null
    };
  }

  /* =====================================================
     CLEAR ACTIVE
  ===================================================== */

  function applyClearActive(state) {
    const previousActiveSequenceId =
      state.activeSequenceId;

    state.activeSequenceId =
      null;

    return {
      sequenceId: null,

      itemId: null,

      sequenceCreated:
        false,

      previousActiveSequenceId,

      nextActiveSequenceId:
        null,

      sequence: null,

      item: null
    };
  }

  /* =====================================================
     COMMAND DISPATCH
  ===================================================== */

  function applyCommand(
    state,
    command,
    context
  ) {
    const commandType =
      readCommandType(command);

    switch (commandType) {
      case "create":
        return applyCreate(
          state,
          command,
          context
        );

      case "update":
        return applyUpdate(
          state,
          command,
          context
        );

      case "activate":
        return applyActivate(
          state,
          command
        );

      case "start":
        return applyStart(
          state,
          command,
          context
        );

      case "prepare_next":
        return applyPrepareNext(
          state,
          command,
          context
        );

      case "mark_delivering":
        return applyMarkDelivering(
          state,
          command,
          context
        );

      case "mark_delivered":
        return applyMarkDelivered(
          state,
          command,
          context
        );

      case "advance":
        return applyAdvance(
          state,
          command,
          context
        );

      case "skip":
        return applySkip(
          state,
          command,
          context
        );

      case "pause":
        return applyPause(
          state,
          command,
          context
        );

      case "resume":
        return applyResume(
          state,
          command,
          context
        );

      case "complete":
        return applyComplete(
          state,
          command,
          context
        );

      case "cancel":
        return applyCloseStatus(
          state,
          command,
          context,
          "cancelled",
          "cancelledAt"
        );

      case "supersede":
        return applyCloseStatus(
          state,
          command,
          context,
          "superseded",
          "supersededAt"
        );

      case "archive":
        return applyCloseStatus(
          state,
          command,
          context,
          "archived",
          "archivedAt"
        );

      case "append_items":
        return applyAppendItems(
          state,
          command,
          context
        );

      case "replace_items":
        return applyReplaceItems(
          state,
          command,
          context
        );

      case "clear_active":
        return applyClearActive(
          state
        );

      case "noop":
      default:
        return {
          sequenceId: null,

          itemId: null,

          sequenceCreated:
            false,

          previousActiveSequenceId:
            state.activeSequenceId,

          nextActiveSequenceId:
            state.activeSequenceId,

          sequence: null,

          item: null
        };
    }
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateItem(
    item,
    sequence
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(item)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_DELIVERY_SEQUENCE_ITEM_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        item.itemId
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_ID_MISSING"
      });
    }

    if (
      !Number.isInteger(
        item.position
      ) ||
      item.position < 1
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_POSITION_INVALID",

        position:
          item.position
      });
    }

    if (
      !ITEM_STATUSES.includes(
        item.status
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_STATUS_INVALID",

        status:
          item.status
      });
    }

    if (
      !Array.isArray(
        item.deliveryAttemptTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_ATTEMPTS_INVALID"
      });
    }

    if (
      item.status === "delivered" &&
      !item.deliveredAt
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_DELIVERED_TIMESTAMP_MISSING"
      });
    }

    if (
      item.status === "delivered" &&
      !item.deliveryTurnId
    ) {
      warnings.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_DELIVERY_TURN_MISSING"
      });
    }

    if (
      item.status === "ready" &&
      !item.readyAt
    ) {
      warnings.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_READY_TIMESTAMP_MISSING"
      });
    }

    if (
      item.status === "delivering" &&
      !item.deliveringAt
    ) {
      warnings.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_DELIVERING_TIMESTAMP_MISSING"
      });
    }

    if (
      item.status === "skipped" &&
      !item.skippedAt
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_SKIPPED_TIMESTAMP_MISSING"
      });
    }

    if (
      item.status === "cancelled" &&
      !item.cancelledAt
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_CANCELLED_TIMESTAMP_MISSING"
      });
    }

    if (
      sequence &&
      item.position >
        sequence.items.length
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEM_POSITION_OUT_OF_RANGE",

        itemId:
          item.itemId,

        position:
          item.position,

        totalItems:
          sequence.items.length
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function validateSequence(
    sequence
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(sequence)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_DELIVERY_SEQUENCE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        sequence.sequenceId
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ID_MISSING"
      });
    }

    if (
      !SEQUENCE_TYPES.includes(
        sequence.sequenceType
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_TYPE_INVALID",

        sequenceType:
          sequence.sequenceType
      });
    }

    if (
      !SEQUENCE_STATUSES.includes(
        sequence.status
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_STATUS_INVALID",

        status:
          sequence.status
      });
    }

    if (
      !Array.isArray(
        sequence.items
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ITEMS_INVALID"
      });

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (
      !Array.isArray(
        sequence.relatedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_RELATED_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        sequence.artifactIds
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ARTIFACT_IDS_INVALID"
      });
    }

    if (
      !Array.isArray(
        sequence.supersedesSequenceIds
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SUPERSEDES_IDS_INVALID"
      });
    }

    const seenItemIds =
      new Set();

    let deliveringCount = 0;
    let readyCount = 0;

    for (
      let index = 0;
      index <
      sequence.items.length;
      index += 1
    ) {
      const item =
        sequence.items[index];

      const itemValidation =
        validateItem(
          item,
          sequence
        );

      for (
        const error of
          itemValidation.errors
      ) {
        errors.push({
          itemId:
            item &&
            item.itemId,
          ...error
        });
      }

      for (
        const warning of
          itemValidation.warnings
      ) {
        warnings.push({
          itemId:
            item &&
            item.itemId,
          ...warning
        });
      }

      if (
        item &&
        seenItemIds.has(
          item.itemId
        )
      ) {
        errors.push({
          code:
            "COS_DELIVERY_SEQUENCE_DUPLICATE_ITEM_ID",

          itemId:
            item.itemId
        });
      }

      if (item) {
        seenItemIds.add(
          item.itemId
        );

        if (
          item.position !==
          index + 1
        ) {
          errors.push({
            code:
              "COS_DELIVERY_SEQUENCE_ITEM_POSITION_GAP",

            itemId:
              item.itemId,

            expectedPosition:
              index + 1,

            actualPosition:
              item.position
          });
        }

        if (
          item.status ===
          "delivering"
        ) {
          deliveringCount += 1;
        }

        if (
          item.status === "ready"
        ) {
          readyCount += 1;
        }
      }
    }

    if (deliveringCount > 1) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_MULTIPLE_DELIVERING_ITEMS",

        deliveringCount
      });
    }

    if (readyCount > 1) {
      warnings.push({
        code:
          "COS_DELIVERY_SEQUENCE_MULTIPLE_READY_ITEMS",

        readyCount
      });
    }

    const metrics =
      deriveSequenceMetrics(
        sequence
      );

    const metricFields = [
      "totalItems",
      "deliveredCount",
      "skippedCount",
      "cancelledItemCount",
      "completedItemCount",
      "remainingCount",
      "currentItemId",
      "currentPosition",
      "nextItemId",
      "nextPosition",
      "lastDeliveredItemId",
      "lastDeliveredPart",
      "nextPart",
      "totalParts",
      "complete"
    ];

    for (
      const metricField of
        metricFields
    ) {
      if (
        sequence[metricField] !==
        metrics[metricField]
      ) {
        errors.push({
          code:
            "COS_DELIVERY_SEQUENCE_DERIVED_METRIC_MISMATCH",

          field:
            metricField,

          expected:
            metrics[metricField],

          actual:
            sequence[
              metricField
            ]
        });
      }
    }

    if (
      sequence.status ===
        "completed" &&
      sequence.complete !== true
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_COMPLETED_WITH_REMAINING_ITEMS"
      });
    }

    if (
      sequence.status ===
        "active" &&
      sequence.complete === true
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ACTIVE_BUT_COMPLETE"
      });
    }

    if (
      sequence.parentSequenceId ===
      sequence.sequenceId
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SELF_PARENT"
      });
    }

    if (
      sequence.previousSequenceId ===
      sequence.sequenceId
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SELF_PREVIOUS"
      });
    }

    if (
      sequence.nextSequenceId ===
      sequence.sequenceId
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SELF_NEXT"
      });
    }

    if (
      sequence.supersededBySequenceId ===
      sequence.sequenceId
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SELF_SUPERSESSION"
      });
    }

    if (
      sequence.supersedesSequenceIds
        .includes(
          sequence.sequenceId
        )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_SELF_SUPERSEDES"
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function validateState(state) {
    const errors = [];
    const warnings = [];

    if (!isObject(state)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_DELIVERY_SEQUENCE_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      state.stateType !==
        SEQUENCE_STATE_TYPE
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_STATE_TYPE_INVALID"
      });
    }

    if (
      !isObject(state.sequences)
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(state.order)
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ORDER_INVALID"
      });
    }

    if (
      !isObject(state.byArtifactId)
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_ARTIFACT_INDEX_INVALID"
      });
    }

    if (
      !isObject(
        state.bySourceTurnId
      )
    ) {
      errors.push({
        code:
          "COS_DELIVERY_SEQUENCE_TURN_INDEX_INVALID"
      });
    }

    if (
      state.activeSequenceId
    ) {
      const active =
        readSequence(
          state,
          state.activeSequenceId
        );

      if (!active) {
        errors.push({
          code:
            "COS_DELIVERY_SEQUENCE_ACTIVE_RECORD_MISSING",

          activeSequenceId:
            state.activeSequenceId
        });
      } else if (
        active.status !== "active"
      ) {
        errors.push({
          code:
            "COS_DELIVERY_SEQUENCE_ACTIVE_STATUS_INVALID",

          activeSequenceId:
            state.activeSequenceId,

          status:
            active.status
        });
      }
    }

    if (
      isObject(state.sequences)
    ) {
      for (
        const [
          sequenceId,
          sequence
        ] of Object.entries(
          state.sequences
        )
      ) {
        const validation =
          validateSequence(
            sequence
          );

        for (
          const error of
            validation.errors
        ) {
          errors.push({
            sequenceId,
            ...error
          });
        }

        for (
          const warning of
            validation.warnings
        ) {
          warnings.push({
            sequenceId,
            ...warning
          });
        }
      }
    }

    for (
      const sequenceId of
        state.order || []
    ) {
      if (
        !hasOwn(
          state.sequences,
          sequenceId
        )
      ) {
        errors.push({
          code:
            "COS_DELIVERY_SEQUENCE_ORDER_RECORD_MISSING",

          sequenceId
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
      normalizeManagerInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const state =
      normalizeSequenceState(
        input.state,
        input.conversationId
      );

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    const commandType =
      readCommandType(
        input.command
      );

    const commandResult =
      applyCommand(
        state,
        input.command,
        {
          conversationId:
            input.conversationId,

          currentTurnId
        }
      );

    state.lastCommand = {
      type:
        commandType,

      sequenceId:
        commandResult.sequenceId,

      itemId:
        commandResult.itemId,

      currentTurnId:
        currentTurnId || null,

      executedAt:
        nowIso()
    };

    state.revision += 1;
    state.updatedAt = nowIso();

    const validation =
      validateState(state);

    if (!validation.valid) {
      throw new CosDeliverySequenceManagerError(
        "COS_DELIVERY_SEQUENCE_STATE_INVALID",
        "Delivery sequence state failed validation.",
        {
          details:
            validation
        }
      );
    }

    const activeSequence =
      state.activeSequenceId
        ? readSequence(
            state,
            state.activeSequenceId
          )
        : null;

    const activeItem =
      activeSequence
        ? (
            selectCurrentItem(
              activeSequence
            ) ||
            selectNextActionableItem(
              activeSequence
            )
          )
        : null;

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      conversationId:
        state.conversationId,

      commandType,

      applied:
        commandType !== "noop",

      sequenceId:
        commandResult.sequenceId,

      itemId:
        commandResult.itemId,

      activeSequenceId:
        state.activeSequenceId,

      activeSequence:
        activeSequence
          ? safeClone(
              activeSequence
            )
          : null,

      activeItem:
        activeItem
          ? safeClone(
              activeItem
            )
          : null,

      sequence:
        commandResult.sequence,

      item:
        commandResult.item,

      sequenceCreated:
        commandResult
          .sequenceCreated,

      previousActiveSequenceId:
        commandResult
          .previousActiveSequenceId,

      nextActiveSequenceId:
        commandResult
          .nextActiveSequenceId,

      state,

      diagnostics: {
        valid: true,

        warningCount:
          validation.warnings.length,

        warnings:
          validation.warnings
      },

      transitionedAt:
        nowIso()
    };

    return freeze
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     QUERY API
  ===================================================== */

  function getSequence(
    state,
    sequenceId
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    const sequence =
      readSequence(
        normalizedState,
        sequenceId
      );

    return sequence
      ? freezeClone(sequence)
      : null;
  }

  function getActiveSequence(
    state
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    if (
      !normalizedState.activeSequenceId
    ) {
      return null;
    }

    const sequence =
      readSequence(
        normalizedState,
        normalizedState
          .activeSequenceId
      );

    return sequence
      ? freezeClone(sequence)
      : null;
  }

  function getNextItem(
    state,
    sequenceId = null
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    const resolvedSequenceId =
      sequenceId ||
      normalizedState.activeSequenceId;

    if (!resolvedSequenceId) {
      return null;
    }

    const sequence =
      readSequence(
        normalizedState,
        resolvedSequenceId
      );

    if (!sequence) {
      return null;
    }

    const item =
      selectNextActionableItem(
        sequence
      );

    return item
      ? freezeClone(item)
      : null;
  }

  function getCurrentItem(
    state,
    sequenceId = null
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    const resolvedSequenceId =
      sequenceId ||
      normalizedState.activeSequenceId;

    if (!resolvedSequenceId) {
      return null;
    }

    const sequence =
      readSequence(
        normalizedState,
        resolvedSequenceId
      );

    if (!sequence) {
      return null;
    }

    const item =
      selectCurrentItem(
        sequence
      );

    return item
      ? freezeClone(item)
      : null;
  }

  function getSequencesByArtifactId(
    state,
    artifactId
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    if (!isNonEmptyString(artifactId)) {
      return [];
    }

    const sequenceIds =
      Array.isArray(
        normalizedState.byArtifactId[
          artifactId
        ]
      )
        ? normalizedState.byArtifactId[
            artifactId
          ]
        : [];

    return sequenceIds
      .map(
        (sequenceId) =>
          readSequence(
            normalizedState,
            sequenceId
          )
      )
      .filter(Boolean)
      .map(
        (sequence) =>
          freezeClone(sequence)
      );
  }

  function getSequencesByTurnId(
    state,
    turnId
  ) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    if (!isNonEmptyString(turnId)) {
      return [];
    }

    const sequenceIds =
      Array.isArray(
        normalizedState.bySourceTurnId[
          turnId
        ]
      )
        ? normalizedState.bySourceTurnId[
            turnId
          ]
        : [];

    return sequenceIds
      .map(
        (sequenceId) =>
          readSequence(
            normalizedState,
            sequenceId
          )
      )
      .filter(Boolean)
      .map(
        (sequence) =>
          freezeClone(sequence)
      );
  }

  function getOpenSequences(state) {
    const normalizedState =
      normalizeSequenceState(
        state,
        state &&
          state.conversationId
      );

    return normalizedState.order
      .map(
        (sequenceId) =>
          readSequence(
            normalizedState,
            sequenceId
          )
      )
      .filter(
        (sequence) =>
          sequence &&
          !CLOSED_SEQUENCE_STATUSES
            .includes(
              sequence.status
            )
      )
      .map(
        (sequence) =>
          freezeClone(sequence)
      );
  }

  function hasActiveSequence(state) {
    return Boolean(
      getActiveSequence(state)
    );
  }

  function canAdvance(
    state,
    sequenceId = null
  ) {
    const sequence =
      sequenceId
        ? getSequence(
            state,
            sequenceId
          )
        : getActiveSequence(state);

    return Boolean(
      sequence &&
      sequence.status === "active" &&
      sequence.complete !== true &&
      sequence.remainingCount > 0
    );
  }

  function createEmptyState({
    conversationId = null
  } = {}) {
    return freezeClone(
      normalizeSequenceState(
        {},
        conversationId
      )
    );
  }

  /* =====================================================
     CONVENIENCE COMMANDS
  ===================================================== */

  function create(
    state,
    sequence,
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(sequence),

          type:
            "create"
        }
      },
      options
    );
  }

  function start(
    state,
    sequenceId,
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          type:
            "start",

          sequenceId
        }
      },
      options
    );
  }

  function prepareNext(
    state,
    sequenceId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "prepare_next",

          sequenceId:
            sequenceId || undefined
        }
      },
      options
    );
  }

  function markDelivering(
    state,
    sequenceId = null,
    itemId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "mark_delivering",

          sequenceId:
            sequenceId || undefined,

          itemId:
            itemId || undefined
        }
      },
      options
    );
  }

  function markDelivered(
    state,
    sequenceId = null,
    itemId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "mark_delivered",

          sequenceId:
            sequenceId || undefined,

          itemId:
            itemId || undefined
        }
      },
      options
    );
  }

  function advance(
    state,
    sequenceId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "advance",

          sequenceId:
            sequenceId || undefined
        }
      },
      options
    );
  }

  function pause(
    state,
    sequenceId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "pause",

          sequenceId:
            sequenceId || undefined
        }
      },
      options
    );
  }

  function resume(
    state,
    sequenceId,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "resume",

          sequenceId
        }
      },
      options
    );
  }

  function complete(
    state,
    sequenceId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "complete",

          sequenceId:
            sequenceId || undefined
        }
      },
      options
    );
  }

  function cancel(
    state,
    sequenceId = null,
    details = {},
    options = {}
  ) {
    return transition(
      {
        state,

        conversationId:
          options.conversationId,

        currentTurn:
          options.currentTurn || {},

        command: {
          ...safeClone(details),

          type:
            "cancel",

          sequenceId:
            sequenceId || undefined
        }
      },
      options
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosDeliverySequenceManager = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    stateType:
      SEQUENCE_STATE_TYPE,

    sequenceTypes:
      SEQUENCE_TYPES,

    sequenceStatuses:
      SEQUENCE_STATUSES,

    itemStatuses:
      ITEM_STATUSES,

    commandTypes:
      COMMAND_TYPES,

    closedSequenceStatuses:
      CLOSED_SEQUENCE_STATUSES,

    terminalItemStatuses:
      TERMINAL_ITEM_STATUSES,

    CosDeliverySequenceManagerError,

    transition,

    apply:
      transition,

    run:
      transition,

    create,

    start,

    prepareNext,

    markDelivering,

    markDelivered,

    advance,

    pause,

    resume,

    complete,

    cancel,

    getSequence,

    getActiveSequence,

    getCurrentItem,

    getNextItem,

    getSequencesByArtifactId,

    getSequencesByTurnId,

    getOpenSequences,

    hasActiveSequence,

    canAdvance,

    createEmptyState,

    validateItem,

    validateSequence,

    validateState,

    normalizeInput:
      normalizeManagerInput,

    normalizeState:
      normalizeSequenceState,

    deriveSequenceMetrics,

    selectCurrentItem,

    selectNextActionableItem
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS
    .deliverySequenceManager =
    cosDeliverySequenceManager;

  ConversationOS
    .cosDeliverySequenceManager =
    cosDeliverySequenceManager;

  root.AriCosDeliverySequenceManager =
    cosDeliverySequenceManager;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosDeliverySequenceManager;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);