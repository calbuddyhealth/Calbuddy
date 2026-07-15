// rebirth/conversation-os/turns/cos-turn-register.js
// ARI Rebirth — Conversation Operating System Turn Register
//
// Purpose:
// Register the exact current turn into the Conversation Operating System
// without interpreting its semantic meaning.
//
// V1.0.0 — Canonical Current-Turn Registration
//
// Canonical flow:
//
// Current Turn Input
//      ↓
// Structural Normalization
//      ↓
// Identity Validation
//      ↓
// Sequence Assignment
//      ↓
// Conversation Binding
//      ↓
// Explicit Relationship Preservation
//      ↓
// Duplicate Detection
//      ↓
// Immutable Registered Turn
//
// Authority:
//
// This component is authoritative only for:
//
// - preserving the exact current-turn text,
// - assigning or validating a turn identity,
// - preserving the supplied role,
// - assigning structural sequence,
// - binding the turn to a conversation,
// - preserving explicit parent-turn metadata,
// - preserving explicit reply metadata,
// - preserving explicit source-turn metadata,
// - recording structural registration metadata.
//
// Non-authority:
//
// This component must not:
//
// - interpret semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotional state,
// - infer safety severity,
// - resolve natural-language references,
// - determine conversation placement,
// - choose a thread from linguistic meaning,
// - infer a parent turn from the wording,
// - alter the user's raw text,
// - plan or generate a response.
//
// Architectural rule:
//
// The Turn Register records the current turn exactly as supplied.
//
// It may assign missing structural identifiers.
// It may validate explicit structural relationships.
// It may not invent conversational meaning.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.turnRegister

(function initializeCosTurnRegister(globalScope) {
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
    "cos-turn-register";

  const DEFAULT_ROLE = "user";

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

  class CosTurnRegisterError extends Error {
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
        "COS turn register error"
      );

      this.name = "CosTurnRegisterError";
      this.code =
        code || "COS_TURN_REGISTER_ERROR";
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
          CosTurnRegisterError
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

  function nowIso() {
    return new Date().toISOString();
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

  function createId(prefix = "turn") {
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

  function normalizeRegistrationInput(
    input = {}
  ) {
    const source = isObject(input)
      ? input
      : {
          currentTurn: input
        };

    const rawCurrentTurn =
      firstDefined(
        source.currentTurn,
        source.current_turn,
        source.turn,
        source.message,
        source.input,
        null
      );

    const currentTurn = isObject(
      rawCurrentTurn
    )
      ? safeClone(rawCurrentTurn)
      : {
          text:
            rawCurrentTurn === null ||
            rawCurrentTurn === undefined
              ? ""
              : String(rawCurrentTurn)
        };

    const history =
      Array.isArray(source.history)
        ? source.history
        : [];

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
      history,
      historyIndex,
      state,

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
     STRUCTURAL FIELD READERS
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

  function readRole(turn) {
    return (
      firstNonEmptyString(
        turn.role,
        turn.speaker,
        turn.authorRole,
        turn.author_role
      ) || DEFAULT_ROLE
    );
  }

  function readText(turn) {
    const text = firstDefined(
      turn.text,
      turn.content,
      turn.message,
      turn.rawText,
      turn.raw_text,
      ""
    );

    return text === null ||
      text === undefined
      ? ""
      : String(text);
  }

  function readSequence(turn) {
    return firstDefined(
      turn.sequence,
      turn.turnSequence,
      turn.turn_sequence,
      turn.turnIndex,
      turn.turn_index,
      turn.index
    );
  }

  function readTimestamp(turn) {
    return firstDefined(
      turn.timestamp,
      turn.createdAt,
      turn.created_at,
      turn.time
    );
  }

  function readThreadId(turn) {
    return firstNonEmptyString(
      turn.threadId,
      turn.thread_id,
      turn.conversationThreadId,
      turn.conversation_thread_id
    );
  }

  function readParentTurnId(turn) {
    return firstNonEmptyString(
      turn.parentTurnId,
      turn.parent_turn_id,
      turn.replyToTurnId,
      turn.reply_to_turn_id
    );
  }

  function readReplyToTurnId(turn) {
    return firstNonEmptyString(
      turn.replyToTurnId,
      turn.reply_to_turn_id
    );
  }

  function readSourceTurnIds(turn) {
    const sourceTurnIds =
      uniqueStrings(
        firstDefined(
          turn.sourceTurnIds,
          turn.source_turn_ids,
          turn.referenceTurnIds,
          turn.reference_turn_ids,
          []
        )
      );

    const parentTurnId =
      readParentTurnId(turn);

    if (
      parentTurnId &&
      !sourceTurnIds.includes(parentTurnId)
    ) {
      sourceTurnIds.unshift(parentTurnId);
    }

    return sourceTurnIds;
  }

  /* =====================================================
     HISTORY AND STATE LOOKUPS
  ===================================================== */

  function historyContainsTurnId(
    history,
    turnId
  ) {
    if (!isNonEmptyString(turnId)) {
      return false;
    }

    for (const rawTurn of history) {
      if (!isObject(rawTurn)) {
        continue;
      }

      if (readTurnId(rawTurn) === turnId) {
        return true;
      }
    }

    return false;
  }

  function indexContainsTurnId(
    historyIndex,
    turnId
  ) {
    if (
      !isObject(historyIndex) ||
      !isObject(historyIndex.byTurnId) ||
      !isNonEmptyString(turnId)
    ) {
      return false;
    }

    return hasOwn(
      historyIndex.byTurnId,
      turnId
    );
  }

  function stateContainsTurnId(
    state,
    turnId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.turns) ||
      !isNonEmptyString(turnId)
    ) {
      return false;
    }

    return hasOwn(
      state.turns,
      turnId
    );
  }

  function structuralTurnExists(
    turnId,
    {
      history,
      historyIndex,
      state
    }
  ) {
    return (
      historyContainsTurnId(
        history,
        turnId
      ) ||
      indexContainsTurnId(
        historyIndex,
        turnId
      ) ||
      stateContainsTurnId(
        state,
        turnId
      )
    );
  }

  function getIndexedTurnCount(
    history,
    historyIndex
  ) {
    if (
      isObject(historyIndex) &&
      Number.isFinite(
        Number(historyIndex.count)
      )
    ) {
      return Math.max(
        0,
        normalizeInteger(
          historyIndex.count,
          0
        )
      );
    }

    if (
      isObject(historyIndex) &&
      Array.isArray(
        historyIndex.orderedTurnIds
      )
    ) {
      return historyIndex
        .orderedTurnIds.length;
    }

    return Array.isArray(history)
      ? history.length
      : 0;
  }

  function getHighestKnownSequence(
    history,
    historyIndex,
    state
  ) {
    let highest = -1;

    if (
      isObject(historyIndex) &&
      isObject(historyIndex.byTurnId)
    ) {
      for (
        const turn of Object.values(
          historyIndex.byTurnId
        )
      ) {
        if (!isObject(turn)) {
          continue;
        }

        const sequence =
          Number(
            readSequence(turn)
          );

        if (
          Number.isFinite(sequence) &&
          sequence > highest
        ) {
          highest =
            Math.trunc(sequence);
        }
      }
    } else {
      for (const turn of history) {
        if (!isObject(turn)) {
          continue;
        }

        const sequence =
          Number(
            readSequence(turn)
          );

        if (
          Number.isFinite(sequence) &&
          sequence > highest
        ) {
          highest =
            Math.trunc(sequence);
        }
      }
    }

    if (
      isObject(state) &&
      isObject(state.turns)
    ) {
      for (
        const turn of Object.values(
          state.turns
        )
      ) {
        if (!isObject(turn)) {
          continue;
        }

        const sequence =
          Number(
            readSequence(turn)
          );

        if (
          Number.isFinite(sequence) &&
          sequence > highest
        ) {
          highest =
            Math.trunc(sequence);
        }
      }
    }

    return highest;
  }

  /* =====================================================
     SEQUENCE ASSIGNMENT
  ===================================================== */

  function determineSequence({
    currentTurn,
    history,
    historyIndex,
    state
  }) {
    const suppliedSequence =
      readSequence(currentTurn);

    if (
      Number.isFinite(
        Number(suppliedSequence)
      )
    ) {
      return normalizeInteger(
        suppliedSequence,
        0
      );
    }

    const highestKnownSequence =
      getHighestKnownSequence(
        history,
        historyIndex,
        state
      );

    if (highestKnownSequence >= 0) {
      return highestKnownSequence + 1;
    }

    return getIndexedTurnCount(
      history,
      historyIndex
    );
  }

  /* =====================================================
     TURN-ID ASSIGNMENT
  ===================================================== */

  function determineTurnId({
    currentTurn,
    history,
    historyIndex,
    state,
    allowGeneratedTurnId = true
  }) {
    const suppliedTurnId =
      readTurnId(currentTurn);

    if (suppliedTurnId) {
      return {
        turnId: suppliedTurnId,
        generated: false
      };
    }

    if (!allowGeneratedTurnId) {
      throw new CosTurnRegisterError(
        "COS_CURRENT_TURN_ID_MISSING",
        "Current turn does not contain a turn ID.",
        {
          details: {
            allowGeneratedTurnId
          }
        }
      );
    }

    let turnId = createId("turn");

    while (
      structuralTurnExists(
        turnId,
        {
          history,
          historyIndex,
          state
        }
      )
    ) {
      turnId = createId("turn");
    }

    return {
      turnId,
      generated: true
    };
  }

  /* =====================================================
     STRUCTURAL VALIDATION
  ===================================================== */

  function validateRegistrationCandidate(
    candidate,
    context = {}
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(candidate)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_REGISTERED_TURN_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        candidate.turnId
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_ID_MISSING"
      });
    }

    if (!isString(candidate.text)) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_TEXT_INVALID"
      });
    }

    if (
      !isNonEmptyString(
        candidate.role
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_ROLE_MISSING"
      });
    }

    if (
      !KNOWN_ROLES.includes(
        candidate.role
      )
    ) {
      warnings.push({
        code:
          "COS_REGISTERED_TURN_UNKNOWN_ROLE",

        role:
          candidate.role
      });
    }

    if (
      !Number.isInteger(
        candidate.sequence
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_SEQUENCE_INVALID",

        sequence:
          candidate.sequence
      });
    }

    if (
      !isNonEmptyString(
        candidate.conversationId
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_CONVERSATION_ID_MISSING"
      });
    }

    if (
      !Array.isArray(
        candidate.sourceTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_SOURCE_IDS_INVALID"
      });
    }

    if (
      candidate.parentTurnId &&
      candidate.parentTurnId ===
        candidate.turnId
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_SELF_PARENT",

        turnId:
          candidate.turnId
      });
    }

    if (
      candidate.replyToTurnId &&
      candidate.replyToTurnId ===
        candidate.turnId
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_SELF_REPLY",

        turnId:
          candidate.turnId
      });
    }

    for (
      const sourceTurnId of
        candidate.sourceTurnIds || []
    ) {
      if (
        sourceTurnId ===
        candidate.turnId
      ) {
        errors.push({
          code:
            "COS_REGISTERED_TURN_SELF_SOURCE",

          turnId:
            candidate.turnId
        });
      }
    }

    if (
      context.checkDuplicate !== false &&
      isNonEmptyString(
        candidate.turnId
      ) &&
      structuralTurnExists(
        candidate.turnId,
        {
          history:
            context.history || [],

          historyIndex:
            context.historyIndex || {},

          state:
            context.state || {}
        }
      )
    ) {
      errors.push({
        code:
          "COS_REGISTERED_TURN_DUPLICATE_ID",

        turnId:
          candidate.turnId
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function validateExplicitRelationships(
    candidate,
    {
      history,
      historyIndex,
      state,
      requireKnownRelationships = false
    }
  ) {
    const errors = [];
    const warnings = [];

    const relationshipIds =
      uniqueStrings([
        candidate.parentTurnId,
        candidate.replyToTurnId,
        ...candidate.sourceTurnIds
      ]);

    for (
      const relationshipTurnId of
        relationshipIds
    ) {
      const exists =
        structuralTurnExists(
          relationshipTurnId,
          {
            history,
            historyIndex,
            state
          }
        );

      if (exists) {
        continue;
      }

      const issue = {
        code:
          "COS_REGISTERED_TURN_UNKNOWN_RELATIONSHIP",

        turnId:
          candidate.turnId,

        relationshipTurnId
      };

      if (requireKnownRelationships) {
        errors.push(issue);
      } else {
        warnings.push(issue);
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
     CANONICAL TURN CONSTRUCTION
  ===================================================== */

  function buildRegisteredTurn({
    input,
    turnId,
    turnIdGenerated,
    sequence
  }) {
    const currentTurn =
      input.currentTurn;

    const role =
      readRole(currentTurn);

    const text =
      readText(currentTurn);

    const timestamp =
      normalizeTimestamp(
        readTimestamp(currentTurn),
        nowIso()
      );

    const threadId =
      readThreadId(currentTurn);

    const parentTurnId =
      readParentTurnId(currentTurn);

    const replyToTurnId =
      readReplyToTurnId(currentTurn);

    const sourceTurnIds =
      readSourceTurnIds(currentTurn);

    const registrationMetadata =
      isObject(
        currentTurn.registrationMetadata
      )
        ? safeClone(
            currentTurn.registrationMetadata
          )
        : {};

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      componentVersion:
        VERSION,

      turnId,

      role,

      text,

      sequence,

      timestamp,

      conversationId:
        input.conversationId,

      threadId:
        threadId || null,

      parentTurnId:
        parentTurnId || null,

      replyToTurnId:
        replyToTurnId || null,

      sourceTurnIds,

      requestId:
        input.requestId,

      registeredAt:
        nowIso(),

      registration: {
        turnIdGenerated:
          turnIdGenerated === true,

        sequenceAssigned:
          !Number.isFinite(
            Number(
              readSequence(
                currentTurn
              )
            )
          ),

        conversationBound:
          true,

        explicitThreadPreserved:
          Boolean(threadId),

        explicitParentPreserved:
          Boolean(parentTurnId),

        explicitReplyPreserved:
          Boolean(replyToTurnId),

        explicitSourceTurnsPreserved:
          sourceTurnIds.length > 0,

        metadata:
          registrationMetadata
      }
    };
  }

  /* =====================================================
     PUBLIC REGISTER
  ===================================================== */

  function register(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeRegistrationInput(
        rawInput
      );

    const strict =
      firstDefined(
        options.strict,
        input.options.strict
      ) !== false;

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const allowGeneratedTurnId =
      firstDefined(
        options.allowGeneratedTurnId,
        input.options
          .allowGeneratedTurnId
      ) !== false;

    const requireKnownRelationships =
      firstDefined(
        options.requireKnownRelationships,
        input.options
          .requireKnownRelationships
      ) === true;

    if (
      !isNonEmptyString(
        input.conversationId
      )
    ) {
      throw new CosTurnRegisterError(
        "COS_CONVERSATION_ID_MISSING",
        "Turn registration requires a conversation ID."
      );
    }

    const {
      turnId,
      generated:
        turnIdGenerated
    } = determineTurnId({
      currentTurn:
        input.currentTurn,

      history:
        input.history,

      historyIndex:
        input.historyIndex,

      state:
        input.state,

      allowGeneratedTurnId
    });

    const sequence =
      determineSequence({
        currentTurn:
          input.currentTurn,

        history:
          input.history,

        historyIndex:
          input.historyIndex,

        state:
          input.state
      });

    const candidate =
      buildRegisteredTurn({
        input,
        turnId,
        turnIdGenerated,
        sequence
      });

    const candidateValidation =
      validateRegistrationCandidate(
        candidate,
        {
          history:
            input.history,

          historyIndex:
            input.historyIndex,

          state:
            input.state,

          checkDuplicate:
            true
        }
      );

    if (!candidateValidation.valid) {
      throw new CosTurnRegisterError(
        "COS_TURN_REGISTRATION_VALIDATION_FAILED",
        "Current turn failed structural registration validation.",
        {
          details:
            candidateValidation
        }
      );
    }

    const relationshipValidation =
      validateExplicitRelationships(
        candidate,
        {
          history:
            input.history,

          historyIndex:
            input.historyIndex,

          state:
            input.state,

          requireKnownRelationships
        }
      );

    if (
      !relationshipValidation.valid
    ) {
      throw new CosTurnRegisterError(
        "COS_TURN_RELATIONSHIP_VALIDATION_FAILED",
        "Current turn contains invalid explicit structural relationships.",
        {
          details:
            relationshipValidation
        }
      );
    }

    const warnings = [
      ...candidateValidation.warnings,
      ...relationshipValidation.warnings
    ];

    const registeredTurn = {
      ...candidate,

      diagnostics: {
        valid: true,

        strict,

        warningCount:
          warnings.length,

        warnings
      }
    };

    return freeze
      ? freezeClone(
          registeredTurn
        )
      : registeredTurn;
  }

  /* =====================================================
     PUBLIC VALIDATION
  ===================================================== */

  function validate(
    turn,
    context = {}
  ) {
    return validateRegistrationCandidate(
      turn,
      context
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosTurnRegister = {
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

    CosTurnRegisterError,

    register,

    registerTurn:
      register,

    create:
      register,

    run:
      register,

    validate,

    normalizeInput:
      normalizeRegistrationInput
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.turnRegister =
    cosTurnRegister;

  ConversationOS.currentTurnRegister =
    cosTurnRegister;

  ConversationOS.cosTurnRegister =
    cosTurnRegister;

  root.AriCosTurnRegister =
    cosTurnRegister;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosTurnRegister;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);