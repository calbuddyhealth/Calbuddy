// rebirth/conversation-os/packets/cos-packet-builder.js
// ARI Rebirth — Conversation Operating System Packet Builder
//
// Purpose:
// Build the lean authoritative Conversation Operating System placement packet
// consumed by downstream Rebirth authorities.
//
// V1.0.0 — Canonical Authoritative Conversation Placement Packet
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Validated Conversation Placement
//      ↓
// Structural Reference Resolution
//      ↓
// Canonical Field Selection
//      ↓
// Authority Boundary Enforcement
//      ↓
// Packet Validation
//      ↓
// Immutable Authoritative Conversation Placement Packet
//
// Authority:
//
// This component is authoritative only for:
//
// - selecting canonical COS output fields,
// - preserving exact current-turn identity and text,
// - preserving final placement structure,
// - preserving resolved source-turn relationships,
// - preserving unresolved structural references,
// - producing the authoritative placement packet,
// - excluding non-authoritative diagnostics and internal reasoning.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - alter placement,
// - resolve missing references,
// - repair invalid state,
// - expose internal scores,
// - expose ranking candidates,
// - expose hidden reasoning,
// - plan or generate a response.
//
// Architectural rule:
//
// The packet must remain lean.
//
// It contains only the structural information downstream authorities need to
// understand where the current turn belongs in the conversation.
//
// Runtime diagnostics, timing, state, candidate rankings, confidence scores,
// implementation notes, and component traces do not belong in this packet.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.packetBuilder

(function initializeCosPacketBuilder(globalScope) {
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
    "cos-packet-builder";

  const PACKET_TYPE =
    "authoritative_conversation_placement_packet";

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

  const ALLOWED_TOP_LEVEL_KEYS =
    Object.freeze([
      "schemaVersion",
      "packetType",
      "authority",
      "conversationId",
      "requestId",
      "currentTurn",
      "placement",
      "referenceResolution"
    ]);

  const ALLOWED_CURRENT_TURN_KEYS =
    Object.freeze([
      "turnId",
      "role",
      "text",
      "sequence",
      "timestamp"
    ]);

  const ALLOWED_PLACEMENT_KEYS =
    Object.freeze([
      "type",
      "threadId",
      "parentTurnId",
      "sourceTurnIds"
    ]);

  const ALLOWED_REFERENCE_KEYS =
    Object.freeze([
      "status",
      "resolvedTurnIds",
      "unresolvedReferences"
    ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosPacketBuilderError extends Error {
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
        "COS packet builder error"
      );

      this.name =
        "CosPacketBuilderError";

      this.code =
        code ||
        "COS_PACKET_BUILDER_ERROR";

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
          CosPacketBuilderError
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
      const parsed =
        new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    if (isNonEmptyString(value)) {
      const parsed =
        new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return fallback;
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

  function hasOnlyAllowedKeys(
    object,
    allowedKeys
  ) {
    if (!isObject(object)) {
      return false;
    }

    return Object.keys(object).every(
      (key) =>
        allowedKeys.includes(key)
    );
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeBuildInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
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

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          source.state &&
            source.state.conversationId,
          source.state &&
            source.state.conversation_id
        ) || null,

      requestId:
        firstNonEmptyString(
          source.requestId,
          source.request_id
        ) || null,

      currentTurn:
        isObject(source.currentTurn)
          ? source.currentTurn
          : {},

      placement:
        isObject(source.placement)
          ? source.placement
          : {},

      referenceResolution:
        isObject(
          source.referenceResolution
        )
          ? source.referenceResolution
          : {},

      state:
        isObject(source.state)
          ? source.state
          : {},

      validation:
        isObject(source.validation)
          ? source.validation
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

  function readTurnRole(turn) {
    return (
      firstNonEmptyString(
        turn.role,
        turn.speaker,
        turn.authorRole,
        turn.author_role
      ) || "unknown"
    );
  }

  function readTurnText(turn) {
    const value =
      firstDefined(
        turn.text,
        turn.content,
        turn.message,
        turn.rawText,
        turn.raw_text,
        ""
      );

    return value === null ||
      value === undefined
      ? ""
      : String(value);
  }

  function readTurnSequence(turn) {
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
      null
    );
  }

  function readPlacementType(placement) {
    return firstNonEmptyString(
      placement.type,
      placement.placementType,
      placement.placement_type
    );
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

  /* =====================================================
     UNRESOLVED REFERENCE SANITIZATION
  ===================================================== */

  function sanitizeUnresolvedReference(
    value
  ) {
    if (isNonEmptyString(value)) {
      return {
        turnId: value.trim(),
        reason: "unresolved"
      };
    }

    if (!isObject(value)) {
      return {
        turnId: null,
        reason: "unresolved"
      };
    }

    return {
      turnId:
        firstNonEmptyString(
          value.turnId,
          value.turn_id,
          value.referenceTurnId,
          value.reference_turn_id
        ) || null,

      reason:
        firstNonEmptyString(
          value.reason,
          value.code
        ) || "unresolved"
    };
  }

  function sanitizeUnresolvedReferences(
    values
  ) {
    const output = [];
    const seen = new Set();

    for (const value of asArray(values)) {
      const sanitized =
        sanitizeUnresolvedReference(
          value
        );

      const key =
        `${sanitized.turnId || ""}:${sanitized.reason}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      output.push(sanitized);
    }

    return output;
  }

  /* =====================================================
     CANONICAL SECTION BUILDERS
  ===================================================== */

  function buildCurrentTurnSection(
    currentTurn
  ) {
    return {
      turnId:
        readTurnId(currentTurn),

      role:
        readTurnRole(currentTurn),

      text:
        readTurnText(currentTurn),

      sequence:
        readTurnSequence(currentTurn),

      timestamp:
        readTurnTimestamp(currentTurn)
    };
  }

  function buildPlacementSection(
    placement
  ) {
    return {
      type:
        readPlacementType(placement),

      threadId:
        readPlacementThreadId(
          placement
        ) || null,

      parentTurnId:
        readPlacementParentTurnId(
          placement
        ) || null,

      sourceTurnIds:
        readPlacementSourceTurnIds(
          placement
        )
    };
  }

  function buildReferenceSection(
    referenceResolution
  ) {
    return {
      status:
        readReferenceStatus(
          referenceResolution
        ),

      resolvedTurnIds:
        readResolvedTurnIds(
          referenceResolution
        ),

      unresolvedReferences:
        sanitizeUnresolvedReferences(
          readUnresolvedReferences(
            referenceResolution
          )
        )
    };
  }

  /* =====================================================
     BUILD INPUT VALIDATION
  ===================================================== */

  function validateBuildInput(input) {
    const errors = [];
    const warnings = [];

    if (
      input.authority !== AUTHORITY
    ) {
      errors.push({
        code:
          "COS_PACKET_INPUT_AUTHORITY_INVALID",

        authority:
          input.authority
      });
    }

    if (
      !isNonEmptyString(
        input.conversationId
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_CONVERSATION_ID_MISSING"
      });
    }

    if (
      !isObject(input.currentTurn)
    ) {
      errors.push({
        code:
          "COS_PACKET_CURRENT_TURN_INVALID"
      });
    }

    if (
      !isObject(input.placement)
    ) {
      errors.push({
        code:
          "COS_PACKET_PLACEMENT_INVALID"
      });
    }

    if (
      !isObject(
        input.referenceResolution
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_REFERENCE_RESOLUTION_INVALID"
      });
    }

    if (
      isObject(input.validation) &&
      input.validation.valid === false
    ) {
      errors.push({
        code:
          "COS_PACKET_PLACEMENT_NOT_VALIDATED",

        validationErrors:
          safeClone(
            input.validation.errors ||
            []
          )
      });
    }

    if (
      isObject(input.validation) &&
      input.validation.valid ===
        undefined
    ) {
      warnings.push({
        code:
          "COS_PACKET_VALIDATION_STATUS_UNDECLARED"
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
     PACKET VALIDATION
  ===================================================== */

  function validatePacket(packet) {
    const errors = [];
    const warnings = [];

    if (!isObject(packet)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PACKET_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !hasOnlyAllowedKeys(
        packet,
        ALLOWED_TOP_LEVEL_KEYS
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_TOP_LEVEL_FIELD_VIOLATION",

        keys:
          Object.keys(packet)
      });
    }

    if (
      packet.schemaVersion !==
        SCHEMA_VERSION
    ) {
      errors.push({
        code:
          "COS_PACKET_SCHEMA_VERSION_INVALID",

        schemaVersion:
          packet.schemaVersion
      });
    }

    if (
      packet.packetType !==
        PACKET_TYPE
    ) {
      errors.push({
        code:
          "COS_PACKET_TYPE_INVALID",

        packetType:
          packet.packetType
      });
    }

    if (
      packet.authority !== AUTHORITY
    ) {
      errors.push({
        code:
          "COS_PACKET_AUTHORITY_INVALID",

        authority:
          packet.authority
      });
    }

    if (
      !isNonEmptyString(
        packet.conversationId
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_CONVERSATION_ID_INVALID"
      });
    }

    if (
      !isObject(packet.currentTurn)
    ) {
      errors.push({
        code:
          "COS_PACKET_CURRENT_TURN_MISSING"
      });
    } else {
      if (
        !hasOnlyAllowedKeys(
          packet.currentTurn,
          ALLOWED_CURRENT_TURN_KEYS
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_CURRENT_TURN_FIELD_VIOLATION",

          keys:
            Object.keys(
              packet.currentTurn
            )
        });
      }

      if (
        !isNonEmptyString(
          packet.currentTurn.turnId
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_CURRENT_TURN_ID_INVALID"
        });
      }

      if (
        !isNonEmptyString(
          packet.currentTurn.role
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_CURRENT_TURN_ROLE_INVALID"
        });
      }

      if (
        !isString(
          packet.currentTurn.text
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_CURRENT_TURN_TEXT_INVALID"
        });
      }

      if (
        !Number.isInteger(
          packet.currentTurn.sequence
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_CURRENT_TURN_SEQUENCE_INVALID",

          sequence:
            packet.currentTurn.sequence
        });
      }
    }

    if (
      !isObject(packet.placement)
    ) {
      errors.push({
        code:
          "COS_PACKET_PLACEMENT_MISSING"
      });
    } else {
      if (
        !hasOnlyAllowedKeys(
          packet.placement,
          ALLOWED_PLACEMENT_KEYS
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_PLACEMENT_FIELD_VIOLATION",

          keys:
            Object.keys(
              packet.placement
            )
        });
      }

      if (
        !PLACEMENT_TYPES.includes(
          packet.placement.type
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_PLACEMENT_TYPE_INVALID",

          type:
            packet.placement.type
        });
      }

      if (
        packet.placement.type !==
          "unresolved_placement" &&
        !isNonEmptyString(
          packet.placement.threadId
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_PLACEMENT_THREAD_ID_REQUIRED"
        });
      }

      if (
        packet.placement.type ===
          "unresolved_placement" &&
        packet.placement.threadId !==
          null
      ) {
        errors.push({
          code:
            "COS_PACKET_UNRESOLVED_THREAD_ID_FORBIDDEN"
        });
      }

      if (
        !Array.isArray(
          packet.placement
            .sourceTurnIds
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_SOURCE_TURN_IDS_INVALID"
        });
      }

      if (
        packet.placement
          .parentTurnId ===
        packet.currentTurn.turnId
      ) {
        errors.push({
          code:
            "COS_PACKET_SELF_PARENT"
        });
      }

      for (
        const sourceTurnId of
          packet.placement
            .sourceTurnIds || []
      ) {
        if (
          sourceTurnId ===
          packet.currentTurn.turnId
        ) {
          errors.push({
            code:
              "COS_PACKET_SELF_SOURCE",

            sourceTurnId
          });
        }
      }
    }

    if (
      !isObject(
        packet.referenceResolution
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_REFERENCE_RESOLUTION_MISSING"
      });
    } else {
      if (
        !hasOnlyAllowedKeys(
          packet.referenceResolution,
          ALLOWED_REFERENCE_KEYS
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_REFERENCE_FIELD_VIOLATION",

          keys:
            Object.keys(
              packet.referenceResolution
            )
        });
      }

      if (
        !REFERENCE_STATUSES.includes(
          packet.referenceResolution
            .status
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_REFERENCE_STATUS_INVALID",

          status:
            packet.referenceResolution
              .status
        });
      }

      if (
        !Array.isArray(
          packet.referenceResolution
            .resolvedTurnIds
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_RESOLVED_TURN_IDS_INVALID"
        });
      }

      if (
        !Array.isArray(
          packet.referenceResolution
            .unresolvedReferences
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_UNRESOLVED_REFERENCES_INVALID"
        });
      }

      if (
        packet.referenceResolution
          .status ===
          "not_required" &&
        (
          packet.referenceResolution
            .resolvedTurnIds.length >
            0 ||
          packet.referenceResolution
            .unresolvedReferences
            .length > 0
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_NOT_REQUIRED_REFERENCE_CONTRADICTION"
        });
      }

      if (
        packet.referenceResolution
          .status === "resolved" &&
        packet.referenceResolution
          .unresolvedReferences
          .length > 0
      ) {
        errors.push({
          code:
            "COS_PACKET_RESOLVED_WITH_UNRESOLVED_REFERENCES"
        });
      }

      if (
        packet.referenceResolution
          .status ===
          "unresolved" &&
        packet.referenceResolution
          .resolvedTurnIds.length > 0
      ) {
        errors.push({
          code:
            "COS_PACKET_UNRESOLVED_WITH_RESOLVED_TURNS"
        });
      }
    }

    const placementSourceTurnIds =
      packet.placement &&
      Array.isArray(
        packet.placement.sourceTurnIds
      )
        ? packet.placement.sourceTurnIds
        : [];

    const resolvedTurnIds =
      packet.referenceResolution &&
      Array.isArray(
        packet.referenceResolution
          .resolvedTurnIds
      )
        ? packet.referenceResolution
            .resolvedTurnIds
        : [];

    for (
      const sourceTurnId of
        placementSourceTurnIds
    ) {
      if (
        !resolvedTurnIds.includes(
          sourceTurnId
        )
      ) {
        errors.push({
          code:
            "COS_PACKET_PLACEMENT_SOURCE_NOT_RESOLVED",

          sourceTurnId
        });
      }
    }

    if (
      packet.placement &&
      packet.placement.parentTurnId &&
      resolvedTurnIds.length > 0 &&
      !resolvedTurnIds.includes(
        packet.placement.parentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_PACKET_PARENT_NOT_RESOLVED",

        parentTurnId:
          packet.placement.parentTurnId
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
     AUTHORITY BOUNDARY ENFORCEMENT
  ===================================================== */

  function enforceLeanPacket(packet) {
    return {
      schemaVersion:
        packet.schemaVersion,

      packetType:
        packet.packetType,

      authority:
        packet.authority,

      conversationId:
        packet.conversationId,

      requestId:
        packet.requestId,

      currentTurn: {
        turnId:
          packet.currentTurn.turnId,

        role:
          packet.currentTurn.role,

        text:
          packet.currentTurn.text,

        sequence:
          packet.currentTurn.sequence,

        timestamp:
          packet.currentTurn.timestamp
      },

      placement: {
        type:
          packet.placement.type,

        threadId:
          packet.placement.threadId,

        parentTurnId:
          packet.placement.parentTurnId,

        sourceTurnIds:
          [
            ...packet.placement
              .sourceTurnIds
          ]
      },

      referenceResolution: {
        status:
          packet.referenceResolution
            .status,

        resolvedTurnIds:
          [
            ...packet.referenceResolution
              .resolvedTurnIds
          ],

        unresolvedReferences:
          packet.referenceResolution
            .unresolvedReferences
            .map(
              (reference) => ({
                turnId:
                  reference.turnId,

                reason:
                  reference.reason
              })
            )
      }
    };
  }

  /* =====================================================
     PUBLIC BUILD
  ===================================================== */

  function build(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeBuildInput(rawInput);

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const inputValidation =
      validateBuildInput(input);

    if (!inputValidation.valid) {
      throw new CosPacketBuilderError(
        "COS_PACKET_BUILD_INPUT_INVALID",
        "COS packet build input failed validation.",
        {
          details:
            inputValidation
        }
      );
    }

    const packet = {
      schemaVersion:
        SCHEMA_VERSION,

      packetType:
        PACKET_TYPE,

      authority:
        AUTHORITY,

      conversationId:
        input.conversationId,

      requestId:
        input.requestId,

      currentTurn:
        buildCurrentTurnSection(
          input.currentTurn
        ),

      placement:
        buildPlacementSection(
          input.placement
        ),

      referenceResolution:
        buildReferenceSection(
          input.referenceResolution
        )
    };

    const leanPacket =
      enforceLeanPacket(packet);

    const packetValidation =
      validatePacket(leanPacket);

    if (!packetValidation.valid) {
      throw new CosPacketBuilderError(
        "COS_PACKET_VALIDATION_FAILED",
        "Authoritative conversation placement packet failed validation.",
        {
          details:
            packetValidation
        }
      );
    }

    return freeze
      ? freezeClone(leanPacket)
      : leanPacket;
  }

  /* =====================================================
     ASSERTION API
  ===================================================== */

  function assertPacket(packet) {
    const validation =
      validatePacket(packet);

    if (!validation.valid) {
      throw new CosPacketBuilderError(
        "COS_PACKET_VALIDATION_FAILED",
        "Authoritative conversation placement packet failed validation.",
        {
          details:
            validation
        }
      );
    }

    return validation;
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosPacketBuilder = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    packetType:
      PACKET_TYPE,

    placementTypes:
      PLACEMENT_TYPES,

    referenceStatuses:
      REFERENCE_STATUSES,

    CosPacketBuilderError,

    build,

    buildPacket:
      build,

    create:
      build,

    run:
      build,

    validate:
      validatePacket,

    validatePacket,

    assertPacket,

    normalizeInput:
      normalizeBuildInput,

    enforceLeanPacket
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.packetBuilder =
    cosPacketBuilder;

  ConversationOS.cosPacketBuilder =
    cosPacketBuilder;

  root.AriCosPacketBuilder =
    cosPacketBuilder;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosPacketBuilder;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);