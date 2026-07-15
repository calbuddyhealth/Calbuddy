// rebirth/conversation-os/interactions/cos-pending-interaction-manager.js
// ARI Rebirth — Conversation Operating System Pending Interaction Manager
//
// Purpose:
// Maintain deterministic structural records for conversational interactions
// that remain open across turns.
//
// V1.0.0 — Canonical Pending Interaction Lifecycle
//
// Canonical flow:
//
// Existing Pending Interaction State
//      ↓
// Interaction Command
//      ↓
// Structural Validation
//      ↓
// Open / Update / Resolve / Cancel / Expire
//      ↓
// Active Interaction Selection
//      ↓
// Canonical Pending Interaction State
//
// Supported interaction types:
//
// - question
// - choice_request
// - confirmation_request
// - clarification_request
// - continuation_request
// - delivery_sequence
// - artifact_request
// - task_request
// - approval_request
// - unknown
//
// Authority:
//
// This component is authoritative only for:
//
// - opening pending interaction records,
// - updating pending interaction records,
// - resolving pending interactions,
// - cancelling pending interactions,
// - expiring pending interactions,
// - tracking the active pending interaction,
// - preserving source-turn and target-turn relationships,
// - preserving offered choices and expected response structures,
// - maintaining interaction lifecycle state.
//
// Non-authority:
//
// This component must not:
//
// - interpret raw user language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotional state,
// - infer safety severity,
// - decide that a user answered a question without upstream evidence,
// - decide which choice a user selected from raw language,
// - resolve natural-language references,
// - determine conversation placement,
// - generate a response.
//
// Architectural rule:
//
// The Pending Interaction Manager records conversational structures that an
// upstream authority or runtime stage has explicitly declared.
//
// It does not infer pending interactions from arbitrary text.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.pendingInteractionManager
//
// CommonJS:
//
// module.exports = cosPendingInteractionManager

(function initializeCosPendingInteractionManager(globalScope) {
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
    "cos-pending-interaction-manager";

  const INTERACTION_STATE_TYPE =
    "conversation_pending_interaction_state";

  const INTERACTION_TYPES = Object.freeze([
    "question",
    "choice_request",
    "confirmation_request",
    "clarification_request",
    "continuation_request",
    "delivery_sequence",
    "artifact_request",
    "task_request",
    "approval_request",
    "unknown"
  ]);

  const INTERACTION_STATUSES = Object.freeze([
    "open",
    "resolved",
    "cancelled",
    "expired",
    "superseded"
  ]);

  const COMMAND_TYPES = Object.freeze([
    "open",
    "update",
    "resolve",
    "cancel",
    "expire",
    "supersede",
    "activate",
    "clear_active",
    "noop"
  ]);

  const EXPECTED_RESPONSE_TYPES = Object.freeze([
    "free_text",
    "yes_no",
    "choice",
    "confirmation",
    "continuation",
    "artifact_selection",
    "turn_reference",
    "unknown"
  ]);

  const CLOSED_STATUSES = Object.freeze([
    "resolved",
    "cancelled",
    "expired",
    "superseded"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosPendingInteractionManagerError extends Error {
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
        "COS pending interaction manager error"
      );

      this.name =
        "CosPendingInteractionManagerError";

      this.code =
        code ||
        "COS_PENDING_INTERACTION_MANAGER_ERROR";

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
          CosPendingInteractionManagerError
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
    prefix = "interaction"
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
        source.pendingInteractionState,
        source.pending_interaction_state,
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
     STATE NORMALIZATION
  ===================================================== */

  function normalizeInteractionState(
    rawState,
    conversationId
  ) {
    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    const interactions =
      isObject(source.interactions)
        ? source.interactions
        : {};

    const order =
      uniqueStrings(
        firstDefined(
          source.order,
          source.interactionOrder,
          source.interaction_order,
          Object.keys(interactions)
        )
      );

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
        INTERACTION_STATE_TYPE,

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

      interactions,

      order,

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

  function readInteractionId(source) {
    return firstNonEmptyString(
      source.interactionId,
      source.interaction_id,
      source.id
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

  function normalizeInteractionType(
    value
  ) {
    return INTERACTION_TYPES.includes(
      value
    )
      ? value
      : "unknown";
  }

  function normalizeExpectedResponseType(
    value
  ) {
    return EXPECTED_RESPONSE_TYPES.includes(
      value
    )
      ? value
      : "unknown";
  }

  function normalizeStatus(value) {
    return INTERACTION_STATUSES.includes(
      value
    )
      ? value
      : "open";
  }

  /* =====================================================
     OPTION NORMALIZATION
  ===================================================== */

  function normalizeOption(
    rawOption,
    index
  ) {
    if (isNonEmptyString(rawOption)) {
      return {
        optionId:
          `option_${index + 1}`,

        label:
          rawOption.trim(),

        value:
          rawOption.trim(),

        turnId: null,

        metadata: {}
      };
    }

    if (!isObject(rawOption)) {
      return null;
    }

    const optionId =
      firstNonEmptyString(
        rawOption.optionId,
        rawOption.option_id,
        rawOption.id,
        rawOption.value
      ) ||
      `option_${index + 1}`;

    const label =
      firstNonEmptyString(
        rawOption.label,
        rawOption.title,
        rawOption.name,
        rawOption.text,
        rawOption.value
      ) || optionId;

    return {
      optionId,

      label,

      value:
        firstDefined(
          rawOption.value,
          optionId
        ),

      turnId:
        firstNonEmptyString(
          rawOption.turnId,
          rawOption.turn_id
        ) || null,

      metadata:
        isObject(rawOption.metadata)
          ? safeClone(
              rawOption.metadata
            )
          : {}
    };
  }

  function normalizeOptions(values) {
    return asArray(values)
      .map(normalizeOption)
      .filter(Boolean);
  }

  /* =====================================================
     INTERACTION CONSTRUCTION
  ===================================================== */

  function createInteraction(
    command,
    context
  ) {
    const now =
      nowIso();

    const interactionId =
      readInteractionId(command) ||
      createId("interaction");

    const type =
      normalizeInteractionType(
        firstNonEmptyString(
          command.interactionType,
          command.interaction_type,
          command.pendingType,
          command.pending_type,
          command.typeValue
        ) ||
        "unknown"
      );

    const sourceTurnId =
      firstNonEmptyString(
        command.sourceTurnId,
        command.source_turn_id,
        command.promptTurnId,
        command.prompt_turn_id,
        command.questionTurnId,
        command.question_turn_id,
        command.assistantTurnId,
        command.assistant_turn_id,
        context.currentTurnId
      );

    const targetTurnIds =
      uniqueStrings(
        firstDefined(
          command.targetTurnIds,
          command.target_turn_ids,
          command.sourceTurnIds,
          command.source_turn_ids,
          []
        )
      );

    const options =
      normalizeOptions(
        firstDefined(
          command.options,
          command.choices,
          []
        )
      );

    const optionTurnIds =
      uniqueStrings([
        ...asArray(
          firstDefined(
            command.optionTurnIds,
            command.option_turn_ids,
            []
          )
        ),

        ...options
          .map(
            (option) =>
              option.turnId
          )
          .filter(Boolean)
      ]);

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      interactionId,

      conversationId:
        context.conversationId,

      type,

      status: "open",

      sourceTurnId:
        sourceTurnId || null,

      targetTurnIds,

      expectedResponseType:
        normalizeExpectedResponseType(
          firstNonEmptyString(
            command.expectedResponseType,
            command.expected_response_type
          ) ||
          "unknown"
        ),

      options,

      optionTurnIds,

      selectedOptionId: null,

      selectedOptionIds: [],

      responseTurnId: null,

      resolutionTurnIds: [],

      continuationToken:
        firstNonEmptyString(
          command.continuationToken,
          command.continuation_token
        ) || null,

      sequenceId:
        firstNonEmptyString(
          command.sequenceId,
          command.sequence_id
        ) || null,

      artifactId:
        firstNonEmptyString(
          command.artifactId,
          command.artifact_id
        ) || null,

      expiresAt:
        normalizeTimestamp(
          firstDefined(
            command.expiresAt,
            command.expires_at
          ),
          null
        ),

      createdAt: now,
      openedAt: now,
      updatedAt: now,

      resolvedAt: null,
      cancelledAt: null,
      expiredAt: null,
      supersededAt: null,

      supersededByInteractionId:
        null,

      resolution: null,

      metadata:
        isObject(command.metadata)
          ? safeClone(
              command.metadata
            )
          : {}
    };
  }

  /* =====================================================
     INTERACTION LOOKUP
  ===================================================== */

  function readInteraction(
    state,
    interactionId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.interactions) ||
      !isNonEmptyString(interactionId)
    ) {
      return null;
    }

    const interaction =
      state.interactions[
        interactionId
      ];

    return isObject(interaction)
      ? interaction
      : null;
  }

  function requireInteraction(
    state,
    interactionId
  ) {
    const interaction =
      readInteraction(
        state,
        interactionId
      );

    if (!interaction) {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_NOT_FOUND",
        "Pending interaction was not found.",
        {
          details: {
            interactionId
          }
        }
      );
    }

    return interaction;
  }

  /* =====================================================
     OPEN COMMAND
  ===================================================== */

  function applyOpen(
    state,
    command,
    context
  ) {
    const interaction =
      createInteraction(
        command,
        context
      );

    if (
      hasOwn(
        state.interactions,
        interaction.interactionId
      )
    ) {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_DUPLICATE_ID",
        "Pending interaction ID already exists.",
        {
          details: {
            interactionId:
              interaction.interactionId
          }
        }
      );
    }

    const supersedeActive =
      command.supersedeActive !== false &&
      command.supersede_active !== false;

    const previousActiveInteractionId =
      state.activeInteractionId;

    if (
      supersedeActive &&
      previousActiveInteractionId
    ) {
      const previous =
        readInteraction(
          state,
          previousActiveInteractionId
        );

      if (
        previous &&
        previous.status === "open"
      ) {
        state.interactions[
          previousActiveInteractionId
        ] = {
          ...safeClone(previous),

          status:
            "superseded",

          supersededAt:
            nowIso(),

          supersededByInteractionId:
            interaction.interactionId,

          updatedAt:
            nowIso()
        };
      }
    }

    state.interactions[
      interaction.interactionId
    ] = interaction;

    state.order =
      uniqueStrings([
        ...state.order,
        interaction.interactionId
      ]);

    const activate =
      command.activate !== false;

    if (activate) {
      state.activeInteractionId =
        interaction.interactionId;
    }

    return {
      interactionId:
        interaction.interactionId,

      previousActiveInteractionId,

      nextActiveInteractionId:
        state.activeInteractionId,

      interactionCreated: true,

      interaction:
        safeClone(interaction)
    };
  }

  /* =====================================================
     UPDATE COMMAND
  ===================================================== */

  function applyUpdate(
    state,
    command
  ) {
    const interactionId =
      readInteractionId(command) ||
      state.activeInteractionId;

    const existing =
      requireInteraction(
        state,
        interactionId
      );

    if (
      CLOSED_STATUSES.includes(
        existing.status
      ) &&
      command.allowClosedUpdate !== true
    ) {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_CLOSED_UPDATE_FORBIDDEN",
        "Closed pending interaction cannot be updated.",
        {
          details: {
            interactionId,
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

    const updated = {
      ...safeClone(existing),

      type:
        hasOwn(
          patch,
          "interactionType"
        ) ||
        hasOwn(
          patch,
          "interaction_type"
        )
          ? normalizeInteractionType(
              firstNonEmptyString(
                patch.interactionType,
                patch.interaction_type
              ) ||
              existing.type
            )
          : existing.type,

      sourceTurnId:
        firstNonEmptyString(
          patch.sourceTurnId,
          patch.source_turn_id,
          existing.sourceTurnId
        ) || null,

      targetTurnIds:
        hasOwn(
          patch,
          "targetTurnIds"
        ) ||
        hasOwn(
          patch,
          "target_turn_ids"
        )
          ? uniqueStrings(
              firstDefined(
                patch.targetTurnIds,
                patch.target_turn_ids,
                []
              )
            )
          : [...existing.targetTurnIds],

      expectedResponseType:
        hasOwn(
          patch,
          "expectedResponseType"
        ) ||
        hasOwn(
          patch,
          "expected_response_type"
        )
          ? normalizeExpectedResponseType(
              firstNonEmptyString(
                patch.expectedResponseType,
                patch.expected_response_type
              ) || "unknown"
            )
          : existing.expectedResponseType,

      options:
        hasOwn(
          patch,
          "options"
        ) ||
        hasOwn(
          patch,
          "choices"
        )
          ? normalizeOptions(
              firstDefined(
                patch.options,
                patch.choices,
                []
              )
            )
          : safeClone(
              existing.options
            ),

      optionTurnIds:
        hasOwn(
          patch,
          "optionTurnIds"
        ) ||
        hasOwn(
          patch,
          "option_turn_ids"
        )
          ? uniqueStrings(
              firstDefined(
                patch.optionTurnIds,
                patch.option_turn_ids,
                []
              )
            )
          : [
              ...existing.optionTurnIds
            ],

      continuationToken:
        hasOwn(
          patch,
          "continuationToken"
        ) ||
        hasOwn(
          patch,
          "continuation_token"
        )
          ? firstNonEmptyString(
              patch.continuationToken,
              patch.continuation_token
            )
          : existing.continuationToken,

      sequenceId:
        hasOwn(
          patch,
          "sequenceId"
        ) ||
        hasOwn(
          patch,
          "sequence_id"
        )
          ? firstNonEmptyString(
              patch.sequenceId,
              patch.sequence_id
            )
          : existing.sequenceId,

      artifactId:
        hasOwn(
          patch,
          "artifactId"
        ) ||
        hasOwn(
          patch,
          "artifact_id"
        )
          ? firstNonEmptyString(
              patch.artifactId,
              patch.artifact_id
            )
          : existing.artifactId,

      expiresAt:
        hasOwn(
          patch,
          "expiresAt"
        ) ||
        hasOwn(
          patch,
          "expires_at"
        )
          ? normalizeTimestamp(
              firstDefined(
                patch.expiresAt,
                patch.expires_at
              ),
              null
            )
          : existing.expiresAt,

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
    };

    state.interactions[
      interactionId
    ] = updated;

    if (command.activate === true) {
      state.activeInteractionId =
        interactionId;
    }

    return {
      interactionId,

      previousActiveInteractionId:
        state.activeInteractionId,

      nextActiveInteractionId:
        state.activeInteractionId,

      interactionCreated: false,

      interaction:
        safeClone(updated)
    };
  }

  /* =====================================================
     RESOLUTION
  ===================================================== */

  function applyResolve(
    state,
    command,
    context
  ) {
    const interactionId =
      readInteractionId(command) ||
      state.activeInteractionId;

    const existing =
      requireInteraction(
        state,
        interactionId
      );

    if (
      existing.status !== "open"
    ) {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_NOT_OPEN",
        "Only an open pending interaction can be resolved.",
        {
          details: {
            interactionId,
            status:
              existing.status
          }
        }
      );
    }

    const responseTurnId =
      firstNonEmptyString(
        command.responseTurnId,
        command.response_turn_id,
        context.currentTurnId
      );

    const selectedOptionIds =
      uniqueStrings(
        firstDefined(
          command.selectedOptionIds,
          command.selected_option_ids,
          command.selectedOptionId,
          command.selected_option_id,
          []
        )
      );

    const resolutionTurnIds =
      uniqueStrings([
        ...asArray(
          firstDefined(
            command.resolutionTurnIds,
            command.resolution_turn_ids,
            []
          )
        ),

        responseTurnId
      ]);

    const resolution = {
      type:
        firstNonEmptyString(
          command.resolutionType,
          command.resolution_type
        ) || "completed",

      responseTurnId:
        responseTurnId || null,

      selectedOptionIds,

      value:
        firstDefined(
          command.value,
          command.resolutionValue,
          command.resolution_value,
          null
        ),

      metadata:
        isObject(command.metadata)
          ? safeClone(
              command.metadata
            )
          : {}
    };

    const updated = {
      ...safeClone(existing),

      status:
        "resolved",

      responseTurnId:
        responseTurnId || null,

      selectedOptionId:
        selectedOptionIds.length === 1
          ? selectedOptionIds[0]
          : null,

      selectedOptionIds,

      resolutionTurnIds,

      resolution,

      resolvedAt:
        nowIso(),

      updatedAt:
        nowIso()
    };

    state.interactions[
      interactionId
    ] = updated;

    if (
      state.activeInteractionId ===
      interactionId
    ) {
      state.activeInteractionId =
        findMostRecentOpenInteractionId(
          state,
          interactionId
        );
    }

    return {
      interactionId,

      previousActiveInteractionId:
        interactionId,

      nextActiveInteractionId:
        state.activeInteractionId,

      interactionCreated: false,

      interaction:
        safeClone(updated)
    };
  }

  /* =====================================================
     CLOSING COMMANDS
  ===================================================== */

  function applyCloseStatus(
    state,
    command,
    status
  ) {
    const interactionId =
      readInteractionId(command) ||
      state.activeInteractionId;

    const existing =
      requireInteraction(
        state,
        interactionId
      );

    if (
      existing.status !== "open" &&
      command.allowAlreadyClosed !== true
    ) {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_ALREADY_CLOSED",
        "Pending interaction is already closed.",
        {
          details: {
            interactionId,
            status:
              existing.status
          }
        }
      );
    }

    const timestampField =
      status === "cancelled"
        ? "cancelledAt"
        : status === "expired"
          ? "expiredAt"
          : status === "superseded"
            ? "supersededAt"
            : "updatedAt";

    const updated = {
      ...safeClone(existing),

      status,

      [timestampField]:
        nowIso(),

      updatedAt:
        nowIso(),

      resolution:
        isObject(command.resolution)
          ? safeClone(
              command.resolution
            )
          : {
              type: status,

              reason:
                firstNonEmptyString(
                  command.reason,
                  command.code
                ) || null,

              metadata:
                isObject(command.metadata)
                  ? safeClone(
                      command.metadata
                    )
                  : {}
            }
    };

    if (status === "superseded") {
      updated
        .supersededByInteractionId =
        firstNonEmptyString(
          command.supersededByInteractionId,
          command.superseded_by_interaction_id
        ) || null;
    }

    state.interactions[
      interactionId
    ] = updated;

    if (
      state.activeInteractionId ===
      interactionId
    ) {
      state.activeInteractionId =
        findMostRecentOpenInteractionId(
          state,
          interactionId
        );
    }

    return {
      interactionId,

      previousActiveInteractionId:
        interactionId,

      nextActiveInteractionId:
        state.activeInteractionId,

      interactionCreated: false,

      interaction:
        safeClone(updated)
    };
  }

  /* =====================================================
     ACTIVATION
  ===================================================== */

  function applyActivate(
    state,
    command
  ) {
    const interactionId =
      readInteractionId(command);

    const interaction =
      requireInteraction(
        state,
        interactionId
      );

    if (interaction.status !== "open") {
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_CLOSED_ACTIVATION_FORBIDDEN",
        "Only an open interaction can become active.",
        {
          details: {
            interactionId,
            status:
              interaction.status
          }
        }
      );
    }

    const previousActiveInteractionId =
      state.activeInteractionId;

    state.activeInteractionId =
      interactionId;

    return {
      interactionId,

      previousActiveInteractionId,

      nextActiveInteractionId:
        interactionId,

      interactionCreated: false,

      interaction:
        safeClone(interaction)
    };
  }

  function applyClearActive(state) {
    const previousActiveInteractionId =
      state.activeInteractionId;

    state.activeInteractionId = null;

    return {
      interactionId: null,

      previousActiveInteractionId,

      nextActiveInteractionId:
        null,

      interactionCreated: false,

      interaction: null
    };
  }

  /* =====================================================
     OPEN INTERACTION SELECTION
  ===================================================== */

  function findMostRecentOpenInteractionId(
    state,
    excludedInteractionId = null
  ) {
    for (
      let index =
        state.order.length - 1;
      index >= 0;
      index -= 1
    ) {
      const interactionId =
        state.order[index];

      if (
        interactionId ===
        excludedInteractionId
      ) {
        continue;
      }

      const interaction =
        readInteraction(
          state,
          interactionId
        );

      if (
        interaction &&
        interaction.status === "open"
      ) {
        return interactionId;
      }
    }

    return null;
  }

  /* =====================================================
     EXPIRATION SWEEP
  ===================================================== */

  function expireElapsedInteractions(
    state,
    timestamp = nowIso()
  ) {
    const currentTime =
      new Date(timestamp).getTime();

    if (
      !Number.isFinite(
        currentTime
      )
    ) {
      return [];
    }

    const expiredInteractionIds = [];

    for (
      const interactionId of
        state.order
    ) {
      const interaction =
        readInteraction(
          state,
          interactionId
        );

      if (
        !interaction ||
        interaction.status !== "open" ||
        !interaction.expiresAt
      ) {
        continue;
      }

      const expirationTime =
        new Date(
          interaction.expiresAt
        ).getTime();

      if (
        !Number.isFinite(
          expirationTime
        ) ||
        expirationTime > currentTime
      ) {
        continue;
      }

      state.interactions[
        interactionId
      ] = {
        ...safeClone(interaction),

        status:
          "expired",

        expiredAt:
          timestamp,

        updatedAt:
          timestamp,

        resolution: {
          type:
            "expired",

          reason:
            "expiration_time_reached",

          metadata: {}
        }
      };

      expiredInteractionIds.push(
        interactionId
      );
    }

    if (
      state.activeInteractionId &&
      expiredInteractionIds.includes(
        state.activeInteractionId
      )
    ) {
      state.activeInteractionId =
        findMostRecentOpenInteractionId(
          state
        );
    }

    return expiredInteractionIds;
  }

  /* =====================================================
     STATE VALIDATION
  ===================================================== */

  function validateInteraction(
    interaction
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(interaction)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PENDING_INTERACTION_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        interaction.interactionId
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_ID_MISSING"
      });
    }

    if (
      !INTERACTION_TYPES.includes(
        interaction.type
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_TYPE_INVALID",

        type:
          interaction.type
      });
    }

    if (
      !INTERACTION_STATUSES.includes(
        interaction.status
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_STATUS_INVALID",

        status:
          interaction.status
      });
    }

    if (
      !EXPECTED_RESPONSE_TYPES.includes(
        interaction.expectedResponseType
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_RESPONSE_TYPE_INVALID",

        expectedResponseType:
          interaction.expectedResponseType
      });
    }

    if (
      !Array.isArray(
        interaction.targetTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_TARGETS_INVALID"
      });
    }

    if (
      !Array.isArray(
        interaction.options
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_OPTIONS_INVALID"
      });
    }

    if (
      !Array.isArray(
        interaction.optionTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_OPTION_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        interaction.selectedOptionIds
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_SELECTED_OPTIONS_INVALID"
      });
    }

    if (
      !Array.isArray(
        interaction.resolutionTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_RESOLUTION_TURNS_INVALID"
      });
    }

    if (
      interaction.status === "resolved" &&
      !interaction.resolvedAt
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_RESOLUTION_TIMESTAMP_MISSING"
      });
    }

    if (
      interaction.status === "open" &&
      interaction.resolvedAt
    ) {
      warnings.push({
        code:
          "COS_PENDING_INTERACTION_OPEN_WITH_RESOLUTION_TIMESTAMP"
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
              "COS_PENDING_INTERACTION_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      state.stateType !==
        INTERACTION_STATE_TYPE
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_STATE_TYPE_INVALID"
      });
    }

    if (
      !isObject(
        state.interactions
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(
        state.order
      )
    ) {
      errors.push({
        code:
          "COS_PENDING_INTERACTION_ORDER_INVALID"
      });
    }

    if (
      state.activeInteractionId
    ) {
      const active =
        readInteraction(
          state,
          state.activeInteractionId
        );

      if (!active) {
        errors.push({
          code:
            "COS_PENDING_INTERACTION_ACTIVE_RECORD_MISSING",

          activeInteractionId:
            state.activeInteractionId
        });
      } else if (
        active.status !== "open"
      ) {
        errors.push({
          code:
            "COS_PENDING_INTERACTION_ACTIVE_RECORD_CLOSED",

          activeInteractionId:
            state.activeInteractionId,

          status:
            active.status
        });
      }
    }

    if (
      isObject(
        state.interactions
      )
    ) {
      for (
        const [
          interactionId,
          interaction
        ] of Object.entries(
          state.interactions
        )
      ) {
        const validation =
          validateInteraction(
            interaction
          );

        for (
          const error of
            validation.errors
        ) {
          errors.push({
            interactionId,
            ...error
          });
        }

        for (
          const warning of
            validation.warnings
        ) {
          warnings.push({
            interactionId,
            ...warning
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
     COMMAND EXECUTION
  ===================================================== */

  function applyCommand(
    state,
    command,
    context
  ) {
    const commandType =
      readCommandType(command);

    switch (commandType) {
      case "open":
        return applyOpen(
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

      case "resolve":
        return applyResolve(
          state,
          command,
          context
        );

      case "cancel":
        return applyCloseStatus(
          state,
          command,
          "cancelled"
        );

      case "expire":
        return applyCloseStatus(
          state,
          command,
          "expired"
        );

      case "supersede":
        return applyCloseStatus(
          state,
          command,
          "superseded"
        );

      case "activate":
        return applyActivate(
          state,
          command
        );

      case "clear_active":
        return applyClearActive(
          state
        );

      case "noop":
      default:
        return {
          interactionId: null,

          previousActiveInteractionId:
            state.activeInteractionId,

          nextActiveInteractionId:
            state.activeInteractionId,

          interactionCreated: false,

          interaction: null
        };
    }
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

    const runExpirationSweep =
      firstDefined(
        options.runExpirationSweep,
        input.options
          .runExpirationSweep
      ) !== false;

    const state =
      normalizeInteractionState(
        input.state,
        input.conversationId
      );

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    const expiredInteractionIds =
      runExpirationSweep
        ? expireElapsedInteractions(
            state
          )
        : [];

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

      interactionId:
        commandResult
          .interactionId,

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
      throw new CosPendingInteractionManagerError(
        "COS_PENDING_INTERACTION_STATE_INVALID",
        "Pending interaction state failed validation.",
        {
          details:
            validation
        }
      );
    }

    const activeInteraction =
      state.activeInteractionId
        ? readInteraction(
            state,
            state.activeInteractionId
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

      interactionId:
        commandResult
          .interactionId,

      activeInteractionId:
        state.activeInteractionId,

      activeInteraction:
        activeInteraction
          ? safeClone(
              activeInteraction
            )
          : null,

      interaction:
        commandResult.interaction,

      previousActiveInteractionId:
        commandResult
          .previousActiveInteractionId,

      nextActiveInteractionId:
        commandResult
          .nextActiveInteractionId,

      interactionCreated:
        commandResult
          .interactionCreated,

      expiredInteractionIds,

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

  function getInteraction(
    state,
    interactionId
  ) {
    const normalizedState =
      normalizeInteractionState(
        state,
        state &&
          state.conversationId
      );

    const interaction =
      readInteraction(
        normalizedState,
        interactionId
      );

    return interaction
      ? freezeClone(interaction)
      : null;
  }

  function getActiveInteraction(
    state
  ) {
    const normalizedState =
      normalizeInteractionState(
        state,
        state &&
          state.conversationId
      );

    if (
      !normalizedState
        .activeInteractionId
    ) {
      return null;
    }

    const interaction =
      readInteraction(
        normalizedState,
        normalizedState
          .activeInteractionId
      );

    return interaction
      ? freezeClone(interaction)
      : null;
  }

  function getOpenInteractions(
    state
  ) {
    const normalizedState =
      normalizeInteractionState(
        state,
        state &&
          state.conversationId
      );

    return normalizedState.order
      .map(
        (interactionId) =>
          readInteraction(
            normalizedState,
            interactionId
          )
      )
      .filter(
        (interaction) =>
          interaction &&
          interaction.status === "open"
      )
      .map(
        (interaction) =>
          freezeClone(interaction)
      );
  }

  function hasOpenInteraction(
    state
  ) {
    return (
      getOpenInteractions(state)
        .length > 0
    );
  }

  function createEmptyState({
    conversationId = null
  } = {}) {
    return freezeClone(
      normalizeInteractionState(
        {},
        conversationId
      )
    );
  }

  /* =====================================================
     CONVENIENCE COMMANDS
  ===================================================== */

  function open(
    state,
    interaction,
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
          ...safeClone(interaction),

          type: "open"
        }
      },
      options
    );
  }

  function update(
    state,
    interactionId,
    patch,
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
          type: "update",

          interactionId,

          patch
        }
      },
      options
    );
  }

  function resolve(
    state,
    interactionId,
    resolution = {},
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
          ...safeClone(
            resolution
          ),

          type: "resolve",

          interactionId
        }
      },
      options
    );
  }

  function cancel(
    state,
    interactionId,
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

          type: "cancel",

          interactionId
        }
      },
      options
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosPendingInteractionManager = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    stateType:
      INTERACTION_STATE_TYPE,

    interactionTypes:
      INTERACTION_TYPES,

    interactionStatuses:
      INTERACTION_STATUSES,

    commandTypes:
      COMMAND_TYPES,

    expectedResponseTypes:
      EXPECTED_RESPONSE_TYPES,

    closedStatuses:
      CLOSED_STATUSES,

    CosPendingInteractionManagerError,

    transition,

    apply:
      transition,

    run:
      transition,

    open,

    update,

    resolve,

    cancel,

    getInteraction,

    getActiveInteraction,

    getOpenInteractions,

    hasOpenInteraction,

    createEmptyState,

    validateInteraction,

    validateState,

    normalizeInput:
      normalizeManagerInput,

    normalizeState:
      normalizeInteractionState,

    expireElapsedInteractions
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS
    .pendingInteractionManager =
    cosPendingInteractionManager;

  ConversationOS
    .cosPendingInteractionManager =
    cosPendingInteractionManager;

  root.AriCosPendingInteractionManager =
    cosPendingInteractionManager;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosPendingInteractionManager;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);