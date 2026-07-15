// rebirth/conversation-os/artifacts/cos-artifact-register.js
// ARI Rebirth — Conversation Operating System Artifact Register
//
// Purpose:
// Maintain deterministic structural records for conversational artifacts
// that remain active across turns.
//
// V1.0.0 — Canonical Conversational Artifact Lifecycle
//
// Canonical flow:
//
// Existing Artifact State
//      ↓
// Artifact Command
//      ↓
// Structural Validation
//      ↓
// Register / Update / Activate / Complete / Supersede / Cancel
//      ↓
// Active Artifact Selection
//      ↓
// Canonical Artifact State
//
// Supported artifact types:
//
// - javascript_file
// - stylesheet
// - html_file
// - json_file
// - sql_file
// - configuration_file
// - document
// - image
// - prompt
// - code_block
// - test_suite
// - runtime_packet
// - generic_artifact
//
// Authority:
//
// This component is authoritative only for:
//
// - registering conversational artifact records,
// - updating artifact metadata,
// - tracking the active artifact,
// - preserving artifact-to-turn relationships,
// - preserving file-path and delivery metadata,
// - tracking artifact lifecycle status,
// - recording artifact replacement and supersession,
// - supporting later structural references such as "send it" or
//   "use the other file."
//
// Non-authority:
//
// This component must not:
//
// - interpret raw language,
// - infer which artifact the user means,
// - classify intent,
// - classify conversation function,
// - infer semantic meaning,
// - infer emotion,
// - infer safety severity,
// - generate artifact content,
// - modify files,
// - determine delivery sequence,
// - choose a response.
//
// Architectural rule:
//
// The Artifact Register records artifacts explicitly declared by an
// upstream runtime stage, tool, or response-delivery component.
//
// It does not infer artifacts from arbitrary text.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.artifactRegister
//
// CommonJS:
//
// module.exports = cosArtifactRegister

(function initializeCosArtifactRegister(globalScope) {
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
    "cos-artifact-register";

  const ARTIFACT_STATE_TYPE =
    "conversation_artifact_state";

  const ARTIFACT_TYPES = Object.freeze([
    "javascript_file",
    "stylesheet",
    "html_file",
    "json_file",
    "sql_file",
    "configuration_file",
    "document",
    "image",
    "prompt",
    "code_block",
    "test_suite",
    "runtime_packet",
    "generic_artifact"
  ]);

  const ARTIFACT_STATUSES = Object.freeze([
    "registered",
    "active",
    "in_progress",
    "delivered",
    "completed",
    "paused",
    "superseded",
    "cancelled",
    "archived"
  ]);

  const COMMAND_TYPES = Object.freeze([
    "register",
    "update",
    "activate",
    "mark_in_progress",
    "mark_delivered",
    "complete",
    "pause",
    "supersede",
    "cancel",
    "archive",
    "clear_active",
    "noop"
  ]);

  const CLOSED_STATUSES = Object.freeze([
    "completed",
    "superseded",
    "cancelled",
    "archived"
  ]);

  const ACTIVE_ELIGIBLE_STATUSES = Object.freeze([
    "registered",
    "active",
    "in_progress",
    "delivered",
    "paused"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosArtifactRegisterError extends Error {
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
        "COS artifact register error"
      );

      this.name =
        "CosArtifactRegisterError";

      this.code =
        code ||
        "COS_ARTIFACT_REGISTER_ERROR";

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
          CosArtifactRegisterError
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
    prefix = "artifact"
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

  function normalizeRegisterInput(
    rawInput = {}
  ) {
    const source =
      isObject(rawInput)
        ? rawInput
        : {};

    const state =
      firstDefined(
        source.state,
        source.artifactState,
        source.artifact_state,
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

  function readArtifactId(source) {
    return firstNonEmptyString(
      source.artifactId,
      source.artifact_id,
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

  function normalizeArtifactType(
    value
  ) {
    return ARTIFACT_TYPES.includes(value)
      ? value
      : "generic_artifact";
  }

  function normalizeArtifactStatus(
    value
  ) {
    return ARTIFACT_STATUSES.includes(
      value
    )
      ? value
      : "registered";
  }

  function normalizeFilePath(value) {
    if (!isNonEmptyString(value)) {
      return null;
    }

    return value
      .trim()
      .replace(/\\/g, "/")
      .replace(/\/{2,}/g, "/");
  }

  /* =====================================================
     STATE NORMALIZATION
  ===================================================== */

  function normalizeArtifactState(
    rawState,
    conversationId
  ) {
    const source =
      isObject(rawState)
        ? safeClone(rawState)
        : {};

    const artifacts =
      isObject(source.artifacts)
        ? source.artifacts
        : {};

    const order =
      uniqueStrings(
        firstDefined(
          source.order,
          source.artifactOrder,
          source.artifact_order,
          Object.keys(artifacts)
        )
      );

    const byFilePath =
      isObject(source.byFilePath)
        ? source.byFilePath
        : isObject(source.by_file_path)
          ? source.by_file_path
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
        ARTIFACT_STATE_TYPE,

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

      artifacts,

      order,

      byFilePath,

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
     ARTIFACT LOOKUP
  ===================================================== */

  function readArtifact(
    state,
    artifactId
  ) {
    if (
      !isObject(state) ||
      !isObject(state.artifacts) ||
      !isNonEmptyString(artifactId)
    ) {
      return null;
    }

    const artifact =
      state.artifacts[
        artifactId
      ];

    return isObject(artifact)
      ? artifact
      : null;
  }

  function requireArtifact(
    state,
    artifactId
  ) {
    const artifact =
      readArtifact(
        state,
        artifactId
      );

    if (!artifact) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_NOT_FOUND",
        "Conversation artifact was not found.",
        {
          details: {
            artifactId
          }
        }
      );
    }

    return artifact;
  }

  /* =====================================================
     INDEX HELPERS
  ===================================================== */

  function addToIndex(
    index,
    key,
    artifactId
  ) {
    if (
      !isNonEmptyString(key) ||
      !isNonEmptyString(artifactId)
    ) {
      return;
    }

    const values =
      Array.isArray(index[key])
        ? index[key]
        : [];

    index[key] =
      uniqueStrings([
        ...values,
        artifactId
      ]);
  }

  function removeFromIndex(
    index,
    key,
    artifactId
  ) {
    if (
      !isNonEmptyString(key) ||
      !Array.isArray(index[key])
    ) {
      return;
    }

    const next =
      index[key].filter(
        (candidateArtifactId) =>
          candidateArtifactId !==
          artifactId
      );

    if (next.length > 0) {
      index[key] = next;
    } else {
      delete index[key];
    }
  }

  function indexArtifact(
    state,
    artifact
  ) {
    if (artifact.filePath) {
      addToIndex(
        state.byFilePath,
        artifact.filePath,
        artifact.artifactId
      );
    }

    if (artifact.sourceTurnId) {
      addToIndex(
        state.bySourceTurnId,
        artifact.sourceTurnId,
        artifact.artifactId
      );
    }

    for (
      const turnId of
        artifact.relatedTurnIds || []
    ) {
      addToIndex(
        state.bySourceTurnId,
        turnId,
        artifact.artifactId
      );
    }
  }

  function deindexArtifact(
    state,
    artifact
  ) {
    if (artifact.filePath) {
      removeFromIndex(
        state.byFilePath,
        artifact.filePath,
        artifact.artifactId
      );
    }

    if (artifact.sourceTurnId) {
      removeFromIndex(
        state.bySourceTurnId,
        artifact.sourceTurnId,
        artifact.artifactId
      );
    }

    for (
      const turnId of
        artifact.relatedTurnIds || []
    ) {
      removeFromIndex(
        state.bySourceTurnId,
        turnId,
        artifact.artifactId
      );
    }
  }

  /* =====================================================
     ARTIFACT CONSTRUCTION
  ===================================================== */

  function createArtifact(
    command,
    context
  ) {
    const timestamp =
      nowIso();

    const artifactId =
      readArtifactId(command) ||
      createId("artifact");

    const sourceTurnId =
      firstNonEmptyString(
        command.sourceTurnId,
        command.source_turn_id,
        command.createdByTurnId,
        command.created_by_turn_id,
        context.currentTurnId
      );

    const deliveryTurnIds =
      uniqueStrings(
        firstDefined(
          command.deliveryTurnIds,
          command.delivery_turn_ids,
          []
        )
      );

    const relatedTurnIds =
      uniqueStrings([
        ...asArray(
          firstDefined(
            command.relatedTurnIds,
            command.related_turn_ids,
            []
          )
        ),

        sourceTurnId,

        ...deliveryTurnIds
      ]);

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      artifactId,

      conversationId:
        context.conversationId,

      artifactType:
        normalizeArtifactType(
          firstNonEmptyString(
            command.artifactType,
            command.artifact_type,
            command.kind
          ) ||
          "generic_artifact"
        ),

      status:
        normalizeArtifactStatus(
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
        ) || artifactId,

      filePath:
        normalizeFilePath(
          firstNonEmptyString(
            command.filePath,
            command.file_path,
            command.path
          )
        ),

      mimeType:
        firstNonEmptyString(
          command.mimeType,
          command.mime_type
        ) || null,

      language:
        firstNonEmptyString(
          command.language,
          command.codeLanguage,
          command.code_language
        ) || null,

      sourceTurnId:
        sourceTurnId || null,

      lastTurnId:
        firstNonEmptyString(
          command.lastTurnId,
          command.last_turn_id,
          sourceTurnId
        ) || null,

      deliveryTurnIds,

      relatedTurnIds,

      sequenceId:
        firstNonEmptyString(
          command.sequenceId,
          command.sequence_id
        ) || null,

      pendingInteractionId:
        firstNonEmptyString(
          command.pendingInteractionId,
          command.pending_interaction_id
        ) || null,

      parentArtifactId:
        firstNonEmptyString(
          command.parentArtifactId,
          command.parent_artifact_id
        ) || null,

      previousArtifactId:
        firstNonEmptyString(
          command.previousArtifactId,
          command.previous_artifact_id
        ) || null,

      nextArtifactId:
        firstNonEmptyString(
          command.nextArtifactId,
          command.next_artifact_id
        ) || null,

      supersedesArtifactIds:
        uniqueStrings(
          firstDefined(
            command.supersedesArtifactIds,
            command.supersedes_artifact_ids,
            []
          )
        ),

      supersededByArtifactId:
        null,

      revision:
        Math.max(
          1,
          normalizeInteger(
            command.revision,
            1
          )
        ),

      contentHash:
        firstNonEmptyString(
          command.contentHash,
          command.content_hash
        ) || null,

      deliveryState:
        firstNonEmptyString(
          command.deliveryState,
          command.delivery_state
        ) || "registered",

      complete:
        command.complete === true,

      createdAt:
        timestamp,

      registeredAt:
        timestamp,

      activatedAt: null,
      startedAt: null,
      deliveredAt: null,
      completedAt: null,
      pausedAt: null,
      supersededAt: null,
      cancelledAt: null,
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
  }

  /* =====================================================
     ACTIVE ARTIFACT SELECTION
  ===================================================== */

  function findMostRecentEligibleArtifactId(
    state,
    excludedArtifactId = null
  ) {
    for (
      let index =
        state.order.length - 1;
      index >= 0;
      index -= 1
    ) {
      const artifactId =
        state.order[index];

      if (
        artifactId ===
        excludedArtifactId
      ) {
        continue;
      }

      const artifact =
        readArtifact(
          state,
          artifactId
        );

      if (
        artifact &&
        ACTIVE_ELIGIBLE_STATUSES.includes(
          artifact.status
        )
      ) {
        return artifactId;
      }
    }

    return null;
  }

  function setActiveArtifact(
    state,
    artifactId
  ) {
    const artifact =
      requireArtifact(
        state,
        artifactId
      );

    if (
      !ACTIVE_ELIGIBLE_STATUSES.includes(
        artifact.status
      )
    ) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_NOT_ACTIVE_ELIGIBLE",
        "Closed artifact cannot become active.",
        {
          details: {
            artifactId,
            status:
              artifact.status
          }
        }
      );
    }

    const previousActiveArtifactId =
      state.activeArtifactId;

    if (
      previousActiveArtifactId &&
      previousActiveArtifactId !==
        artifactId
    ) {
      const previous =
        readArtifact(
          state,
          previousActiveArtifactId
        );

      if (
        previous &&
        previous.status === "active"
      ) {
        state.artifacts[
          previousActiveArtifactId
        ] = {
          ...safeClone(previous),

          status:
            "paused",

          pausedAt:
            nowIso(),

          updatedAt:
            nowIso()
        };
      }
    }

    state.artifacts[
      artifactId
    ] = {
      ...safeClone(artifact),

      status:
        artifact.status === "registered" ||
        artifact.status === "paused"
          ? "active"
          : artifact.status,

      activatedAt:
        artifact.activatedAt ||
        nowIso(),

      updatedAt:
        nowIso()
    };

    state.activeArtifactId =
      artifactId;

    return {
      previousActiveArtifactId,
      nextActiveArtifactId:
        artifactId
    };
  }

  /* =====================================================
     REGISTER COMMAND
  ===================================================== */

  function applyRegister(
    state,
    command,
    context
  ) {
    const artifact =
      createArtifact(
        command,
        context
      );

    if (
      hasOwn(
        state.artifacts,
        artifact.artifactId
      )
    ) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_DUPLICATE_ID",
        "Conversation artifact ID already exists.",
        {
          details: {
            artifactId:
              artifact.artifactId
          }
        }
      );
    }

    state.artifacts[
      artifact.artifactId
    ] = artifact;

    state.order =
      uniqueStrings([
        ...state.order,
        artifact.artifactId
      ]);

    indexArtifact(
      state,
      artifact
    );

    const previousActiveArtifactId =
      state.activeArtifactId;

    const activate =
      command.activate !== false;

    if (activate) {
      setActiveArtifact(
        state,
        artifact.artifactId
      );
    }

    for (
      const supersededArtifactId of
        artifact.supersedesArtifactIds
    ) {
      const superseded =
        readArtifact(
          state,
          supersededArtifactId
        );

      if (!superseded) {
        continue;
      }

      state.artifacts[
        supersededArtifactId
      ] = {
        ...safeClone(superseded),

        status:
          "superseded",

        supersededByArtifactId:
          artifact.artifactId,

        supersededAt:
          nowIso(),

        updatedAt:
          nowIso()
      };
    }

    return {
      artifactId:
        artifact.artifactId,

      artifactCreated:
        true,

      previousActiveArtifactId,

      nextActiveArtifactId:
        state.activeArtifactId,

      artifact:
        safeClone(
          state.artifacts[
            artifact.artifactId
          ]
        )
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
    const artifactId =
      readArtifactId(command) ||
      state.activeArtifactId;

    const existing =
      requireArtifact(
        state,
        artifactId
      );

    if (
      CLOSED_STATUSES.includes(
        existing.status
      ) &&
      command.allowClosedUpdate !== true
    ) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_CLOSED_UPDATE_FORBIDDEN",
        "Closed artifact cannot be updated.",
        {
          details: {
            artifactId,
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

    deindexArtifact(
      state,
      existing
    );

    const appendedDeliveryTurnIds =
      uniqueStrings(
        firstDefined(
          patch.appendDeliveryTurnIds,
          patch.append_delivery_turn_ids,
          []
        )
      );

    const appendedRelatedTurnIds =
      uniqueStrings(
        firstDefined(
          patch.appendRelatedTurnIds,
          patch.append_related_turn_ids,
          []
        )
      );

    const updated = {
      ...safeClone(existing),

      artifactType:
        hasOwn(
          patch,
          "artifactType"
        ) ||
        hasOwn(
          patch,
          "artifact_type"
        )
          ? normalizeArtifactType(
              firstNonEmptyString(
                patch.artifactType,
                patch.artifact_type
              ) ||
              existing.artifactType
            )
          : existing.artifactType,

      name:
        firstNonEmptyString(
          patch.name,
          patch.title,
          patch.label,
          existing.name
        ) || artifactId,

      filePath:
        (
          hasOwn(
            patch,
            "filePath"
          ) ||
          hasOwn(
            patch,
            "file_path"
          ) ||
          hasOwn(
            patch,
            "path"
          )
        )
          ? normalizeFilePath(
              firstNonEmptyString(
                patch.filePath,
                patch.file_path,
                patch.path
              )
            )
          : existing.filePath,

      mimeType:
        (
          hasOwn(
            patch,
            "mimeType"
          ) ||
          hasOwn(
            patch,
            "mime_type"
          )
        )
          ? firstNonEmptyString(
              patch.mimeType,
              patch.mime_type
            )
          : existing.mimeType,

      language:
        (
          hasOwn(
            patch,
            "language"
          ) ||
          hasOwn(
            patch,
            "codeLanguage"
          ) ||
          hasOwn(
            patch,
            "code_language"
          )
        )
          ? firstNonEmptyString(
              patch.language,
              patch.codeLanguage,
              patch.code_language
            )
          : existing.language,

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

      deliveryTurnIds:
        (
          hasOwn(
            patch,
            "deliveryTurnIds"
          ) ||
          hasOwn(
            patch,
            "delivery_turn_ids"
          )
        )
          ? uniqueStrings(
              firstDefined(
                patch.deliveryTurnIds,
                patch.delivery_turn_ids,
                []
              )
            )
          : uniqueStrings([
              ...existing.deliveryTurnIds,
              ...appendedDeliveryTurnIds
            ]),

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
              ...appendedRelatedTurnIds,
              context.currentTurnId
            ]),

      sequenceId:
        (
          hasOwn(
            patch,
            "sequenceId"
          ) ||
          hasOwn(
            patch,
            "sequence_id"
          )
        )
          ? firstNonEmptyString(
              patch.sequenceId,
              patch.sequence_id
            )
          : existing.sequenceId,

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

      parentArtifactId:
        (
          hasOwn(
            patch,
            "parentArtifactId"
          ) ||
          hasOwn(
            patch,
            "parent_artifact_id"
          )
        )
          ? firstNonEmptyString(
              patch.parentArtifactId,
              patch.parent_artifact_id
            )
          : existing.parentArtifactId,

      previousArtifactId:
        (
          hasOwn(
            patch,
            "previousArtifactId"
          ) ||
          hasOwn(
            patch,
            "previous_artifact_id"
          )
        )
          ? firstNonEmptyString(
              patch.previousArtifactId,
              patch.previous_artifact_id
            )
          : existing.previousArtifactId,

      nextArtifactId:
        (
          hasOwn(
            patch,
            "nextArtifactId"
          ) ||
          hasOwn(
            patch,
            "next_artifact_id"
          )
        )
          ? firstNonEmptyString(
              patch.nextArtifactId,
              patch.next_artifact_id
            )
          : existing.nextArtifactId,

      contentHash:
        (
          hasOwn(
            patch,
            "contentHash"
          ) ||
          hasOwn(
            patch,
            "content_hash"
          )
        )
          ? firstNonEmptyString(
              patch.contentHash,
              patch.content_hash
            )
          : existing.contentHash,

      deliveryState:
        firstNonEmptyString(
          patch.deliveryState,
          patch.delivery_state,
          existing.deliveryState
        ) || "registered",

      complete:
        typeof patch.complete ===
          "boolean"
          ? patch.complete
          : existing.complete,

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
    };

    state.artifacts[
      artifactId
    ] = updated;

    indexArtifact(
      state,
      updated
    );

    if (command.activate === true) {
      setActiveArtifact(
        state,
        artifactId
      );
    }

    return {
      artifactId,

      artifactCreated:
        false,

      previousActiveArtifactId:
        state.activeArtifactId,

      nextActiveArtifactId:
        state.activeArtifactId,

      artifact:
        safeClone(
          state.artifacts[
            artifactId
          ]
        )
    };
  }

  /* =====================================================
     STATUS TRANSITIONS
  ===================================================== */

  function applyStatusTransition(
    state,
    command,
    status,
    timestampField,
    context
  ) {
    const artifactId =
      readArtifactId(command) ||
      state.activeArtifactId;

    const existing =
      requireArtifact(
        state,
        artifactId
      );

    if (
      CLOSED_STATUSES.includes(
        existing.status
      ) &&
      command.allowAlreadyClosed !== true
    ) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_ALREADY_CLOSED",
        "Conversation artifact is already closed.",
        {
          details: {
            artifactId,
            status:
              existing.status
          }
        }
      );
    }

    const timestamp =
      nowIso();

    const updated = {
      ...safeClone(existing),

      status,

      lastTurnId:
        firstNonEmptyString(
          command.lastTurnId,
          command.last_turn_id,
          context.currentTurnId,
          existing.lastTurnId
        ) || null,

      deliveryState:
        firstNonEmptyString(
          command.deliveryState,
          command.delivery_state
        ) ||
        status,

      complete:
        status === "completed"
          ? true
          : existing.complete,

      [timestampField]:
        timestamp,

      updatedAt:
        timestamp,

      metadata:
        isObject(command.metadata)
          ? {
              ...safeClone(
                existing.metadata
              ),

              ...safeClone(
                command.metadata
              )
            }
          : safeClone(
              existing.metadata
            )
    };

    if (
      context.currentTurnId &&
      !updated.relatedTurnIds.includes(
        context.currentTurnId
      )
    ) {
      updated.relatedTurnIds.push(
        context.currentTurnId
      );
    }

    if (
      (
        status === "delivered" ||
        status === "completed"
      ) &&
      context.currentTurnId &&
      !updated.deliveryTurnIds.includes(
        context.currentTurnId
      )
    ) {
      updated.deliveryTurnIds.push(
        context.currentTurnId
      );
    }

    state.artifacts[
      artifactId
    ] = updated;

    if (
      CLOSED_STATUSES.includes(status) &&
      state.activeArtifactId ===
        artifactId
    ) {
      state.activeArtifactId =
        findMostRecentEligibleArtifactId(
          state,
          artifactId
        );
    }

    if (
      status === "active" ||
      status === "in_progress"
    ) {
      setActiveArtifact(
        state,
        artifactId
      );
    }

    return {
      artifactId,

      artifactCreated:
        false,

      previousActiveArtifactId:
        artifactId,

      nextActiveArtifactId:
        state.activeArtifactId,

      artifact:
        safeClone(
          state.artifacts[
            artifactId
          ]
        )
    };
  }

  /* =====================================================
     SUPERSEDE
  ===================================================== */

  function applySupersede(
    state,
    command,
    context
  ) {
    const artifactId =
      readArtifactId(command) ||
      state.activeArtifactId;

    const existing =
      requireArtifact(
        state,
        artifactId
      );

    const supersededByArtifactId =
      firstNonEmptyString(
        command.supersededByArtifactId,
        command.superseded_by_artifact_id,
        command.replacementArtifactId,
        command.replacement_artifact_id
      );

    const updated = {
      ...safeClone(existing),

      status:
        "superseded",

      supersededByArtifactId:
        supersededByArtifactId ||
        null,

      lastTurnId:
        firstNonEmptyString(
          context.currentTurnId,
          existing.lastTurnId
        ) || null,

      supersededAt:
        nowIso(),

      updatedAt:
        nowIso(),

      metadata:
        isObject(command.metadata)
          ? {
              ...safeClone(
                existing.metadata
              ),

              ...safeClone(
                command.metadata
              )
            }
          : safeClone(
              existing.metadata
            )
    };

    state.artifacts[
      artifactId
    ] = updated;

    if (
      supersededByArtifactId
    ) {
      const replacement =
        readArtifact(
          state,
          supersededByArtifactId
        );

      if (replacement) {
        state.artifacts[
          supersededByArtifactId
        ] = {
          ...safeClone(replacement),

          supersedesArtifactIds:
            uniqueStrings([
              ...replacement
                .supersedesArtifactIds,
              artifactId
            ]),

          previousArtifactId:
            replacement
              .previousArtifactId ||
            artifactId,

          updatedAt:
            nowIso()
        };
      }
    }

    if (
      state.activeArtifactId ===
      artifactId
    ) {
      if (
        supersededByArtifactId &&
        readArtifact(
          state,
          supersededByArtifactId
        )
      ) {
        setActiveArtifact(
          state,
          supersededByArtifactId
        );
      } else {
        state.activeArtifactId =
          findMostRecentEligibleArtifactId(
            state,
            artifactId
          );
      }
    }

    return {
      artifactId,

      artifactCreated:
        false,

      previousActiveArtifactId:
        artifactId,

      nextActiveArtifactId:
        state.activeArtifactId,

      artifact:
        safeClone(updated)
    };
  }

  /* =====================================================
     ACTIVATION / CLEAR
  ===================================================== */

  function applyActivate(
    state,
    command
  ) {
    const artifactId =
      readArtifactId(command);

    if (!artifactId) {
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_ID_REQUIRED",
        "Artifact activation requires an artifact ID."
      );
    }

    const transition =
      setActiveArtifact(
        state,
        artifactId
      );

    return {
      artifactId,

      artifactCreated:
        false,

      ...transition,

      artifact:
        safeClone(
          state.artifacts[
            artifactId
          ]
        )
    };
  }

  function applyClearActive(state) {
    const previousActiveArtifactId =
      state.activeArtifactId;

    state.activeArtifactId =
      null;

    return {
      artifactId: null,

      artifactCreated:
        false,

      previousActiveArtifactId,

      nextActiveArtifactId:
        null,

      artifact: null
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
      case "register":
        return applyRegister(
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

      case "mark_in_progress":
        return applyStatusTransition(
          state,
          command,
          "in_progress",
          "startedAt",
          context
        );

      case "mark_delivered":
        return applyStatusTransition(
          state,
          command,
          "delivered",
          "deliveredAt",
          context
        );

      case "complete":
        return applyStatusTransition(
          state,
          command,
          "completed",
          "completedAt",
          context
        );

      case "pause":
        return applyStatusTransition(
          state,
          command,
          "paused",
          "pausedAt",
          context
        );

      case "supersede":
        return applySupersede(
          state,
          command,
          context
        );

      case "cancel":
        return applyStatusTransition(
          state,
          command,
          "cancelled",
          "cancelledAt",
          context
        );

      case "archive":
        return applyStatusTransition(
          state,
          command,
          "archived",
          "archivedAt",
          context
        );

      case "clear_active":
        return applyClearActive(
          state
        );

      case "noop":
      default:
        return {
          artifactId: null,

          artifactCreated:
            false,

          previousActiveArtifactId:
            state.activeArtifactId,

          nextActiveArtifactId:
            state.activeArtifactId,

          artifact: null
        };
    }
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateArtifact(
    artifact
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(artifact)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_ARTIFACT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !isNonEmptyString(
        artifact.artifactId
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_ID_MISSING"
      });
    }

    if (
      !ARTIFACT_TYPES.includes(
        artifact.artifactType
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_TYPE_INVALID",

        artifactType:
          artifact.artifactType
      });
    }

    if (
      !ARTIFACT_STATUSES.includes(
        artifact.status
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_STATUS_INVALID",

        status:
          artifact.status
      });
    }

    if (
      !Array.isArray(
        artifact.deliveryTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_DELIVERY_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        artifact.relatedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_RELATED_TURNS_INVALID"
      });
    }

    if (
      !Array.isArray(
        artifact.supersedesArtifactIds
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SUPERSEDES_IDS_INVALID"
      });
    }

    if (
      artifact.parentArtifactId ===
        artifact.artifactId
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SELF_PARENT"
      });
    }

    if (
      artifact.previousArtifactId ===
        artifact.artifactId
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SELF_PREVIOUS"
      });
    }

    if (
      artifact.nextArtifactId ===
        artifact.artifactId
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SELF_NEXT"
      });
    }

    if (
      artifact.supersededByArtifactId ===
        artifact.artifactId
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SELF_SUPERSESSION"
      });
    }

    if (
      artifact.supersedesArtifactIds
        .includes(
          artifact.artifactId
        )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SELF_SUPERSEDES"
      });
    }

    if (
      artifact.status ===
        "completed" &&
      artifact.complete !== true
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_COMPLETION_FLAG_MISMATCH"
      });
    }

    if (
      artifact.status ===
        "superseded" &&
      !artifact.supersededAt
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_SUPERSEDED_TIMESTAMP_MISSING"
      });
    }

    if (
      artifact.status ===
        "active" &&
      artifact.complete === true
    ) {
      warnings.push({
        code:
          "COS_ARTIFACT_ACTIVE_BUT_COMPLETE"
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
              "COS_ARTIFACT_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      state.stateType !==
        ARTIFACT_STATE_TYPE
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_STATE_TYPE_INVALID"
      });
    }

    if (
      !isObject(state.artifacts)
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_MAP_INVALID"
      });
    }

    if (
      !Array.isArray(state.order)
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_ORDER_INVALID"
      });
    }

    if (
      !isObject(state.byFilePath)
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_FILE_INDEX_INVALID"
      });
    }

    if (
      !isObject(
        state.bySourceTurnId
      )
    ) {
      errors.push({
        code:
          "COS_ARTIFACT_TURN_INDEX_INVALID"
      });
    }

    if (
      state.activeArtifactId
    ) {
      const active =
        readArtifact(
          state,
          state.activeArtifactId
        );

      if (!active) {
        errors.push({
          code:
            "COS_ARTIFACT_ACTIVE_RECORD_MISSING",

          activeArtifactId:
            state.activeArtifactId
        });
      } else if (
        !ACTIVE_ELIGIBLE_STATUSES.includes(
          active.status
        )
      ) {
        errors.push({
          code:
            "COS_ARTIFACT_ACTIVE_RECORD_CLOSED",

          activeArtifactId:
            state.activeArtifactId,

          status:
            active.status
        });
      }
    }

    if (
      isObject(state.artifacts)
    ) {
      for (
        const [
          artifactId,
          artifact
        ] of Object.entries(
          state.artifacts
        )
      ) {
        const validation =
          validateArtifact(
            artifact
          );

        for (
          const error of
            validation.errors
        ) {
          errors.push({
            artifactId,
            ...error
          });
        }

        for (
          const warning of
            validation.warnings
        ) {
          warnings.push({
            artifactId,
            ...warning
          });
        }
      }
    }

    for (
      const artifactId of
        state.order || []
    ) {
      if (
        !hasOwn(
          state.artifacts,
          artifactId
        )
      ) {
        errors.push({
          code:
            "COS_ARTIFACT_ORDER_RECORD_MISSING",

          artifactId
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
      normalizeRegisterInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const state =
      normalizeArtifactState(
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

      artifactId:
        commandResult.artifactId,

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
      throw new CosArtifactRegisterError(
        "COS_ARTIFACT_STATE_INVALID",
        "Conversation artifact state failed validation.",
        {
          details:
            validation
        }
      );
    }

    const activeArtifact =
      state.activeArtifactId
        ? readArtifact(
            state,
            state.activeArtifactId
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

      artifactId:
        commandResult.artifactId,

      activeArtifactId:
        state.activeArtifactId,

      activeArtifact:
        activeArtifact
          ? safeClone(
              activeArtifact
            )
          : null,

      artifact:
        commandResult.artifact,

      artifactCreated:
        commandResult
          .artifactCreated,

      previousActiveArtifactId:
        commandResult
          .previousActiveArtifactId,

      nextActiveArtifactId:
        commandResult
          .nextActiveArtifactId,

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

  function getArtifact(
    state,
    artifactId
  ) {
    const normalizedState =
      normalizeArtifactState(
        state,
        state &&
          state.conversationId
      );

    const artifact =
      readArtifact(
        normalizedState,
        artifactId
      );

    return artifact
      ? freezeClone(artifact)
      : null;
  }

  function getActiveArtifact(
    state
  ) {
    const normalizedState =
      normalizeArtifactState(
        state,
        state &&
          state.conversationId
      );

    if (
      !normalizedState.activeArtifactId
    ) {
      return null;
    }

    const artifact =
      readArtifact(
        normalizedState,
        normalizedState.activeArtifactId
      );

    return artifact
      ? freezeClone(artifact)
      : null;
  }

  function getArtifactsByFilePath(
    state,
    filePath
  ) {
    const normalizedState =
      normalizeArtifactState(
        state,
        state &&
          state.conversationId
      );

    const normalizedPath =
      normalizeFilePath(filePath);

    if (!normalizedPath) {
      return [];
    }

    const artifactIds =
      Array.isArray(
        normalizedState.byFilePath[
          normalizedPath
        ]
      )
        ? normalizedState.byFilePath[
            normalizedPath
          ]
        : [];

    return artifactIds
      .map(
        (artifactId) =>
          readArtifact(
            normalizedState,
            artifactId
          )
      )
      .filter(Boolean)
      .map(
        (artifact) =>
          freezeClone(artifact)
      );
  }

  function getArtifactsByTurnId(
    state,
    turnId
  ) {
    const normalizedState =
      normalizeArtifactState(
        state,
        state &&
          state.conversationId
      );

    if (!isNonEmptyString(turnId)) {
      return [];
    }

    const artifactIds =
      Array.isArray(
        normalizedState.bySourceTurnId[
          turnId
        ]
      )
        ? normalizedState.bySourceTurnId[
            turnId
          ]
        : [];

    return artifactIds
      .map(
        (artifactId) =>
          readArtifact(
            normalizedState,
            artifactId
          )
      )
      .filter(Boolean)
      .map(
        (artifact) =>
          freezeClone(artifact)
      );
  }

  function getOpenArtifacts(state) {
    const normalizedState =
      normalizeArtifactState(
        state,
        state &&
          state.conversationId
      );

    return normalizedState.order
      .map(
        (artifactId) =>
          readArtifact(
            normalizedState,
            artifactId
          )
      )
      .filter(
        (artifact) =>
          artifact &&
          !CLOSED_STATUSES.includes(
            artifact.status
          )
      )
      .map(
        (artifact) =>
          freezeClone(artifact)
      );
  }

  function createEmptyState({
    conversationId = null
  } = {}) {
    return freezeClone(
      normalizeArtifactState(
        {},
        conversationId
      )
    );
  }

  /* =====================================================
     CONVENIENCE COMMANDS
  ===================================================== */

  function register(
    state,
    artifact,
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
          ...safeClone(artifact),

          type:
            "register"
        }
      },
      options
    );
  }

  function update(
    state,
    artifactId,
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
          type:
            "update",

          artifactId,

          patch
        }
      },
      options
    );
  }

  function activate(
    state,
    artifactId,
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
            "activate",

          artifactId
        }
      },
      options
    );
  }

  function complete(
    state,
    artifactId,
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

          artifactId
        }
      },
      options
    );
  }

  function markDelivered(
    state,
    artifactId,
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

          artifactId
        }
      },
      options
    );
  }

  function supersede(
    state,
    artifactId,
    replacementArtifactId,
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
            "supersede",

          artifactId,

          supersededByArtifactId:
            replacementArtifactId
        }
      },
      options
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosArtifactRegister = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    stateType:
      ARTIFACT_STATE_TYPE,

    artifactTypes:
      ARTIFACT_TYPES,

    artifactStatuses:
      ARTIFACT_STATUSES,

    commandTypes:
      COMMAND_TYPES,

    closedStatuses:
      CLOSED_STATUSES,

    activeEligibleStatuses:
      ACTIVE_ELIGIBLE_STATUSES,

    CosArtifactRegisterError,

    transition,

    apply:
      transition,

    run:
      transition,

    register,

    update,

    activate,

    complete,

    markDelivered,

    supersede,

    getArtifact,

    getActiveArtifact,

    getArtifactsByFilePath,

    getArtifactsByTurnId,

    getOpenArtifacts,

    createEmptyState,

    validateArtifact,

    validateState,

    normalizeInput:
      normalizeRegisterInput,

    normalizeState:
      normalizeArtifactState
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.artifactRegister =
    cosArtifactRegister;

  ConversationOS.cosArtifactRegister =
    cosArtifactRegister;

  root.AriCosArtifactRegister =
    cosArtifactRegister;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosArtifactRegister;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);