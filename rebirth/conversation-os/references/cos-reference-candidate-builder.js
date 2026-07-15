// rebirth/conversation-os/references/cos-reference-candidate-builder.js
// ARI Rebirth — Conversation Operating System Reference Candidate Builder
//
// Purpose:
// Build deterministic structural reference candidates for the current turn
// before authoritative reference adjudication and resolution.
//
// V1.0.0 — Canonical Structural Reference Candidate Construction
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Explicit Turn Metadata
//      ↓
// UI Reply Metadata
//      ↓
// Pending Interaction State
//      ↓
// Active Artifact State
//      ↓
// Delivery Sequence State
//      ↓
// Interruption / Resume State
//      ↓
// Upstream Structural Evidence
//      ↓
// Candidate Normalization
//      ↓
// Candidate Deduplication
//      ↓
// Canonical Reference Candidate Set
//
// Authority:
//
// This component is authoritative only for:
//
// - collecting structural reference evidence,
// - normalizing candidate turn IDs,
// - preserving candidate origin,
// - preserving candidate relationship type,
// - preserving evidence provenance,
// - assigning deterministic precedence classes,
// - rejecting malformed candidate records,
// - producing a candidate set for later adjudication.
//
// Non-authority:
//
// This component must not:
//
// - declare the final referenced turn,
// - interpret semantic meaning,
// - independently classify intent,
// - independently classify conversation function,
// - infer emotion,
// - infer safety severity,
// - choose response strategy,
// - generate a response,
// - convert uncertain evidence into authoritative placement,
// - use arbitrary numeric scores as conversational truth.
//
// Architectural rule:
//
// This component builds candidates.
// It does not resolve them.
//
// Candidate precedence expresses structural reliability, not semantic truth.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.referenceCandidateBuilder
//
// CommonJS:
//
// module.exports = cosReferenceCandidateBuilder

(function initializeCosReferenceCandidateBuilder(globalScope) {
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
    "cos-reference-candidate-builder";

  const CANDIDATE_SET_TYPE =
    "conversation_reference_candidate_set";

  const RELATIONSHIP_TYPES = Object.freeze([
    "parent",
    "reply",
    "source",
    "reference",
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target",
    "pending_interaction",
    "pending_question",
    "pending_choice",
    "active_artifact",
    "delivery_sequence",
    "active_thread_turn",
    "interrupted_thread_turn",
    "upstream_structural_candidate",
    "unknown"
  ]);

  const EVIDENCE_SOURCES = Object.freeze([
    "explicit_turn_metadata",
    "ui_reply_metadata",
    "pending_interaction_state",
    "active_artifact_state",
    "delivery_sequence_state",
    "interruption_state",
    "active_thread_state",
    "upstream_structural_evidence",
    "history_landmark",
    "unknown"
  ]);

  const PRECEDENCE_CLASSES = Object.freeze({
    EXPLICIT_PARENT: 10,
    UI_REPLY_TARGET: 20,
    EXPLICIT_RELATIONSHIP: 30,
    PENDING_INTERACTION: 40,
    DELIVERY_SEQUENCE: 50,
    ACTIVE_ARTIFACT: 60,
    INTERRUPTION_STATE: 70,
    UPSTREAM_STRUCTURAL: 80,
    ACTIVE_THREAD: 90,
    HISTORY_LANDMARK: 100
  });

  const EXPLICIT_SINGLE_REFERENCE_FIELDS = Object.freeze([
    {
      fields: [
        "parentTurnId",
        "parent_turn_id"
      ],
      relationshipType: "parent",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_PARENT
    },

    {
      fields: [
        "replyToTurnId",
        "reply_to_turn_id"
      ],
      relationshipType: "reply",
      precedence:
        PRECEDENCE_CLASSES.UI_REPLY_TARGET
    },

    {
      fields: [
        "answerTargetTurnId",
        "answer_target_turn_id",
        "answersTurnId",
        "answers_turn_id"
      ],
      relationshipType: "answer_target",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "clarificationTargetTurnId",
        "clarification_target_turn_id",
        "clarifiesTurnId",
        "clarifies_turn_id"
      ],
      relationshipType:
        "clarification_target",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "correctionTargetTurnId",
        "correction_target_turn_id",
        "correctsTurnId",
        "corrects_turn_id"
      ],
      relationshipType:
        "correction_target",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "branchOriginTurnId",
        "branch_origin_turn_id",
        "branchFromTurnId",
        "branch_from_turn_id"
      ],
      relationshipType:
        "branch_origin",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "interruptionOriginTurnId",
        "interruption_origin_turn_id",
        "interruptedTurnId",
        "interrupted_turn_id"
      ],
      relationshipType:
        "interruption_origin",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "resumeTargetTurnId",
        "resume_target_turn_id",
        "resumesTurnId",
        "resumes_turn_id"
      ],
      relationshipType:
        "resume_target",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    }
  ]);

  const EXPLICIT_MULTI_REFERENCE_FIELDS = Object.freeze([
    {
      fields: [
        "sourceTurnIds",
        "source_turn_ids"
      ],
      relationshipType: "source",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    },

    {
      fields: [
        "referenceTurnIds",
        "reference_turn_ids"
      ],
      relationshipType: "reference",
      precedence:
        PRECEDENCE_CLASSES.EXPLICIT_RELATIONSHIP
    }
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosReferenceCandidateBuilderError extends Error {
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
        "COS reference candidate builder error"
      );

      this.name =
        "CosReferenceCandidateBuilderError";

      this.code =
        code ||
        "COS_REFERENCE_CANDIDATE_BUILDER_ERROR";

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
          CosReferenceCandidateBuilderError
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

  function normalizeBoolean(
    value,
    fallback = false
  ) {
    return typeof value === "boolean"
      ? value
      : fallback;
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
    return Object.prototype.hasOwnProperty.call(
      object,
      property
    );
  }

  function readFirstField(
    source,
    fields = []
  ) {
    if (!isObject(source)) {
      return undefined;
    }

    for (const field of fields) {
      if (
        hasOwn(source, field) &&
        source[field] !== undefined
      ) {
        return source[field];
      }
    }

    return undefined;
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeBuilderInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {
          currentTurn: rawInput
        };

    const currentTurn =
      firstDefined(
        source.currentTurn,
        source.current_turn,
        source.turn,
        {}
      );

    return {
      currentTurn:
        isObject(currentTurn)
          ? safeClone(currentTurn)
          : {},

      history:
        Array.isArray(source.history)
          ? source.history
          : [],

      historyIndex:
        isObject(source.historyIndex)
          ? source.historyIndex
          : {},

      state:
        isObject(source.state)
          ? source.state
          : {},

      pendingInteraction:
        isObject(
          source.pendingInteraction
        )
          ? source.pendingInteraction
          : isObject(
              source.pending_interaction
            )
            ? source.pending_interaction
            : null,

      activeArtifact:
        isObject(source.activeArtifact)
          ? source.activeArtifact
          : isObject(
              source.active_artifact
            )
            ? source.active_artifact
            : null,

      deliverySequence:
        isObject(
          source.deliverySequence
        )
          ? source.deliverySequence
          : isObject(
              source.delivery_sequence
            )
            ? source.delivery_sequence
            : null,

      upstreamCandidates:
        Array.isArray(
          source.upstreamCandidates
        )
          ? source.upstreamCandidates
          : Array.isArray(
              source.upstream_candidates
            )
            ? source.upstream_candidates
            : [],

      uiMetadata:
        isObject(source.uiMetadata)
          ? source.uiMetadata
          : isObject(source.ui_metadata)
            ? source.ui_metadata
            : {},

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          source.state &&
            source.state.conversationId,
          source.state &&
            source.state.conversation_id
        ) || null,

      options:
        isObject(source.options)
          ? safeClone(source.options)
          : {}
    };
  }

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  function readCurrentTurnId(
    currentTurn
  ) {
    return firstNonEmptyString(
      currentTurn.turnId,
      currentTurn.turn_id,
      currentTurn.id,
      currentTurn.messageId,
      currentTurn.message_id
    );
  }

  /* =====================================================
     STRUCTURAL LOOKUPS
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

  function readHistoryTurn(
    history,
    turnId
  ) {
    if (
      !Array.isArray(history) ||
      !isNonEmptyString(turnId)
    ) {
      return null;
    }

    for (const turn of history) {
      if (!isObject(turn)) {
        continue;
      }

      const candidateId =
        firstNonEmptyString(
          turn.turnId,
          turn.turn_id,
          turn.id,
          turn.messageId,
          turn.message_id
        );

      if (candidateId === turnId) {
        return turn;
      }
    }

    return null;
  }

  function locateTurn(
    input,
    turnId
  ) {
    const indexed =
      readIndexedTurn(
        input.historyIndex,
        turnId
      );

    if (indexed) {
      return {
        exists: true,
        source: "history_index",
        turn: indexed
      };
    }

    const stateTurn =
      readStateTurn(
        input.state,
        turnId
      );

    if (stateTurn) {
      return {
        exists: true,
        source: "state",
        turn: stateTurn
      };
    }

    const historyTurn =
      readHistoryTurn(
        input.history,
        turnId
      );

    if (historyTurn) {
      return {
        exists: true,
        source: "history",
        turn: historyTurn
      };
    }

    return {
      exists: false,
      source: null,
      turn: null
    };
  }

  function readTurnThreadId(
    turn
  ) {
    if (!isObject(turn)) {
      return null;
    }

    return firstNonEmptyString(
      turn.threadId,
      turn.thread_id
    );
  }

  /* =====================================================
     CANDIDATE CREATION
  ===================================================== */

  function normalizeRelationshipType(
    value
  ) {
    return RELATIONSHIP_TYPES.includes(
      value
    )
      ? value
      : "unknown";
  }

  function normalizeEvidenceSource(
    value
  ) {
    return EVIDENCE_SOURCES.includes(
      value
    )
      ? value
      : "unknown";
  }

  function createCandidate({
    turnId,
    relationshipType,
    evidenceSource,
    precedence,
    field = null,
    evidence = null,
    provisional = false,
    metadata = {}
  }) {
    if (!isNonEmptyString(turnId)) {
      return null;
    }

    return {
      turnId:
        turnId.trim(),

      relationshipType:
        normalizeRelationshipType(
          relationshipType
        ),

      evidenceSource:
        normalizeEvidenceSource(
          evidenceSource
        ),

      precedence:
        Math.max(
          0,
          normalizeInteger(
            precedence,
            PRECEDENCE_CLASSES
              .HISTORY_LANDMARK
          )
        ),

      field:
        isNonEmptyString(field)
          ? field
          : null,

      evidence:
        evidence === undefined
          ? null
          : safeClone(evidence),

      provisional:
        provisional === true,

      metadata:
        isObject(metadata)
          ? safeClone(metadata)
          : {}
    };
  }

  function addCandidate(
    collection,
    candidate
  ) {
    if (candidate) {
      collection.push(candidate);
    }
  }

  /* =====================================================
     EXPLICIT TURN METADATA
  ===================================================== */

  function collectExplicitCandidates(
    input
  ) {
    const candidates = [];
    const currentTurn =
      input.currentTurn;

    for (
      const definition of
        EXPLICIT_SINGLE_REFERENCE_FIELDS
    ) {
      const rawValue =
        readFirstField(
          currentTurn,
          definition.fields
        );

      const turnId =
        firstNonEmptyString(
          rawValue
        );

      addCandidate(
        candidates,
        createCandidate({
          turnId,

          relationshipType:
            definition.relationshipType,

          evidenceSource:
            definition.relationshipType ===
              "reply"
              ? "ui_reply_metadata"
              : "explicit_turn_metadata",

          precedence:
            definition.precedence,

          field:
            definition.fields.find(
              (field) =>
                hasOwn(
                  currentTurn,
                  field
                )
            ) || null,

          evidence: {
            explicit: true
          }
        })
      );
    }

    for (
      const definition of
        EXPLICIT_MULTI_REFERENCE_FIELDS
    ) {
      const rawValue =
        readFirstField(
          currentTurn,
          definition.fields
        );

      const turnIds =
        uniqueStrings(rawValue);

      for (const turnId of turnIds) {
        addCandidate(
          candidates,
          createCandidate({
            turnId,

            relationshipType:
              definition.relationshipType,

            evidenceSource:
              "explicit_turn_metadata",

            precedence:
              definition.precedence,

            field:
              definition.fields.find(
                (field) =>
                  hasOwn(
                    currentTurn,
                    field
                  )
              ) || null,

            evidence: {
              explicit: true
            }
          })
        );
      }
    }

    return candidates;
  }

  /* =====================================================
     UI REPLY METADATA
  ===================================================== */

  function collectUiCandidates(
    input
  ) {
    const candidates = [];
    const ui =
      input.uiMetadata;

    const replyTargetId =
      firstNonEmptyString(
        ui.replyToTurnId,
        ui.reply_to_turn_id,
        ui.selectedTurnId,
        ui.selected_turn_id,
        ui.quotedTurnId,
        ui.quoted_turn_id
      );

    addCandidate(
      candidates,
      createCandidate({
        turnId:
          replyTargetId,

        relationshipType:
          "reply",

        evidenceSource:
          "ui_reply_metadata",

        precedence:
          PRECEDENCE_CLASSES
            .UI_REPLY_TARGET,

        field:
          replyTargetId
            ? "uiMetadata"
            : null,

        evidence: {
          suppliedByInterface: true
        }
      })
    );

    return candidates;
  }

  /* =====================================================
     PENDING INTERACTION
  ===================================================== */

  function readPendingStatus(
    pendingInteraction
  ) {
    return firstNonEmptyString(
      pendingInteraction &&
        pendingInteraction.status,
      pendingInteraction &&
        pendingInteraction.state
    );
  }

  function collectPendingInteractionCandidates(
    input
  ) {
    const pending =
      input.pendingInteraction;

    if (!isObject(pending)) {
      return [];
    }

    const status =
      readPendingStatus(pending);

    if (
      status &&
      [
        "closed",
        "resolved",
        "cancelled",
        "expired"
      ].includes(status)
    ) {
      return [];
    }

    const candidates = [];

    const sourceTurnId =
      firstNonEmptyString(
        pending.sourceTurnId,
        pending.source_turn_id,
        pending.promptTurnId,
        pending.prompt_turn_id,
        pending.questionTurnId,
        pending.question_turn_id,
        pending.assistantTurnId,
        pending.assistant_turn_id
      );

    const interactionType =
      firstNonEmptyString(
        pending.type,
        pending.interactionType,
        pending.interaction_type
      );

    let relationshipType =
      "pending_interaction";

    if (
      interactionType ===
        "question" ||
      interactionType ===
        "question_request"
    ) {
      relationshipType =
        "pending_question";
    }

    if (
      interactionType ===
        "choice" ||
      interactionType ===
        "choice_request"
    ) {
      relationshipType =
        "pending_choice";
    }

    addCandidate(
      candidates,
      createCandidate({
        turnId:
          sourceTurnId,

        relationshipType,

        evidenceSource:
          "pending_interaction_state",

        precedence:
          PRECEDENCE_CLASSES
            .PENDING_INTERACTION,

        field:
          "pendingInteraction.sourceTurnId",

        provisional: true,

        evidence: {
          interactionType:
            interactionType || null,

          status:
            status || "open"
        },

        metadata: {
          interactionId:
            firstNonEmptyString(
              pending.interactionId,
              pending.interaction_id,
              pending.id
            ) || null
        }
      })
    );

    const optionTurnIds =
      uniqueStrings(
        firstDefined(
          pending.optionTurnIds,
          pending.option_turn_ids,
          []
        )
      );

    for (
      const optionTurnId of
        optionTurnIds
    ) {
      addCandidate(
        candidates,
        createCandidate({
          turnId:
            optionTurnId,

          relationshipType:
            "pending_choice",

          evidenceSource:
            "pending_interaction_state",

          precedence:
            PRECEDENCE_CLASSES
              .PENDING_INTERACTION,

          field:
            "pendingInteraction.optionTurnIds",

          provisional: true,

          evidence: {
            interactionType:
              interactionType || "choice"
          }
        })
      );
    }

    return candidates;
  }

  /* =====================================================
     ACTIVE ARTIFACT
  ===================================================== */

  function collectActiveArtifactCandidates(
    input
  ) {
    const artifact =
      input.activeArtifact;

    if (!isObject(artifact)) {
      return [];
    }

    const status =
      firstNonEmptyString(
        artifact.status,
        artifact.deliveryState,
        artifact.delivery_state
      );

    if (
      status &&
      [
        "closed",
        "superseded",
        "cancelled",
        "expired"
      ].includes(status)
    ) {
      return [];
    }

    const sourceTurnId =
      firstNonEmptyString(
        artifact.sourceTurnId,
        artifact.source_turn_id,
        artifact.lastTurnId,
        artifact.last_turn_id,
        artifact.deliveryTurnId,
        artifact.delivery_turn_id
      );

    const candidate =
      createCandidate({
        turnId:
          sourceTurnId,

        relationshipType:
          "active_artifact",

        evidenceSource:
          "active_artifact_state",

        precedence:
          PRECEDENCE_CLASSES
            .ACTIVE_ARTIFACT,

        field:
          "activeArtifact.sourceTurnId",

        provisional: true,

        evidence: {
          artifactType:
            firstNonEmptyString(
              artifact.artifactType,
              artifact.artifact_type,
              artifact.type
            ) || null,

          filePath:
            firstNonEmptyString(
              artifact.filePath,
              artifact.file_path
            ) || null,

          status:
            status || null
        },

        metadata: {
          artifactId:
            firstNonEmptyString(
              artifact.artifactId,
              artifact.artifact_id,
              artifact.id
            ) || null
        }
      });

    return candidate
      ? [candidate]
      : [];
  }

  /* =====================================================
     DELIVERY SEQUENCE
  ===================================================== */

  function collectDeliverySequenceCandidates(
    input
  ) {
    const sequence =
      input.deliverySequence;

    if (!isObject(sequence)) {
      return [];
    }

    const status =
      firstNonEmptyString(
        sequence.status,
        sequence.state
      );

    if (
      status &&
      [
        "completed",
        "closed",
        "cancelled",
        "expired"
      ].includes(status)
    ) {
      return [];
    }

    const sourceTurnId =
      firstNonEmptyString(
        sequence.lastDeliveredTurnId,
        sequence.last_delivered_turn_id,
        sequence.sourceTurnId,
        sequence.source_turn_id,
        sequence.lastTurnId,
        sequence.last_turn_id
      );

    const candidate =
      createCandidate({
        turnId:
          sourceTurnId,

        relationshipType:
          "delivery_sequence",

        evidenceSource:
          "delivery_sequence_state",

        precedence:
          PRECEDENCE_CLASSES
            .DELIVERY_SEQUENCE,

        field:
          "deliverySequence.lastDeliveredTurnId",

        provisional: true,

        evidence: {
          status:
            status || "active",

          lastDeliveredPart:
            firstDefined(
              sequence.lastDeliveredPart,
              sequence.last_delivered_part,
              null
            ),

          nextPart:
            firstDefined(
              sequence.nextPart,
              sequence.next_part,
              null
            ),

          totalParts:
            firstDefined(
              sequence.totalParts,
              sequence.total_parts,
              null
            )
        },

        metadata: {
          sequenceId:
            firstNonEmptyString(
              sequence.sequenceId,
              sequence.sequence_id,
              sequence.id
            ) || null
        }
      });

    return candidate
      ? [candidate]
      : [];
  }

  /* =====================================================
     INTERRUPTION STATE
  ===================================================== */

  function collectInterruptionCandidates(
    input
  ) {
    const state =
      input.state;

    const interruptionStack =
      Array.isArray(
        state.interruptionStack
      )
        ? state.interruptionStack
        : [];

    if (
      interruptionStack.length === 0
    ) {
      return [];
    }

    const top =
      interruptionStack[
        interruptionStack.length - 1
      ];

    if (!isObject(top)) {
      return [];
    }

    const candidates = [];

    const interruptedTurnId =
      firstNonEmptyString(
        top.interruptedTurnId,
        top.interrupted_turn_id
      );

    addCandidate(
      candidates,
      createCandidate({
        turnId:
          interruptedTurnId,

        relationshipType:
          "interrupted_thread_turn",

        evidenceSource:
          "interruption_state",

        precedence:
          PRECEDENCE_CLASSES
            .INTERRUPTION_STATE,

        field:
          "state.interruptionStack",

        provisional: true,

        evidence: {
          interruptedThreadId:
            firstNonEmptyString(
              top.interruptedThreadId,
              top.interrupted_thread_id
            ) || null,

          interruptionThreadId:
            firstNonEmptyString(
              top.interruptionThreadId,
              top.interruption_thread_id
            ) || null
        }
      })
    );

    return candidates;
  }

  /* =====================================================
     UPSTREAM STRUCTURAL EVIDENCE
  ===================================================== */

  function collectUpstreamCandidates(
    input
  ) {
    const candidates = [];

    for (
      const rawCandidate of
        input.upstreamCandidates
    ) {
      if (!isObject(rawCandidate)) {
        continue;
      }

      const turnId =
        firstNonEmptyString(
          rawCandidate.turnId,
          rawCandidate.turn_id,
          rawCandidate.targetTurnId,
          rawCandidate.target_turn_id
        );

      addCandidate(
        candidates,
        createCandidate({
          turnId,

          relationshipType:
            firstNonEmptyString(
              rawCandidate.relationshipType,
              rawCandidate.relationship_type,
              rawCandidate.type
            ) ||
            "upstream_structural_candidate",

          evidenceSource:
            "upstream_structural_evidence",

          precedence:
            firstDefined(
              rawCandidate.precedence,
              PRECEDENCE_CLASSES
                .UPSTREAM_STRUCTURAL
            ),

          field:
            firstNonEmptyString(
              rawCandidate.field
            ) || null,

          provisional:
            normalizeBoolean(
              rawCandidate.provisional,
              true
            ),

          evidence:
            firstDefined(
              rawCandidate.evidence,
              rawCandidate
            ),

          metadata:
            isObject(
              rawCandidate.metadata
            )
              ? rawCandidate.metadata
              : {}
        })
      );
    }

    return candidates;
  }

  /* =====================================================
     ACTIVE THREAD LANDMARK
  ===================================================== */

  function collectActiveThreadCandidates(
    input
  ) {
    const activeTurnId =
      firstNonEmptyString(
        input.state.activeTurnId,
        input.state.active_turn_id
      );

    if (!activeTurnId) {
      return [];
    }

    const candidate =
      createCandidate({
        turnId:
          activeTurnId,

        relationshipType:
          "active_thread_turn",

        evidenceSource:
          "active_thread_state",

        precedence:
          PRECEDENCE_CLASSES
            .ACTIVE_THREAD,

        field:
          "state.activeTurnId",

        provisional: true,

        evidence: {
          activeThreadId:
            firstNonEmptyString(
              input.state.activeThreadId,
              input.state.active_thread_id
            ) || null
        }
      });

    return candidate
      ? [candidate]
      : [];
  }

  function collectHistoryLandmarkCandidates(
    input
  ) {
    const lastTurnId =
      firstNonEmptyString(
        input.historyIndex.lastTurnId,
        input.historyIndex
          .lastAssistantTurnId
      );

    if (!lastTurnId) {
      return [];
    }

    const candidate =
      createCandidate({
        turnId:
          lastTurnId,

        relationshipType:
          "reference",

        evidenceSource:
          "history_landmark",

        precedence:
          PRECEDENCE_CLASSES
            .HISTORY_LANDMARK,

        field:
          "historyIndex.lastTurnId",

        provisional: true,

        evidence: {
          landmark:
            "last_turn"
        }
      });

    return candidate
      ? [candidate]
      : [];
  }

  /* =====================================================
     CANDIDATE VERIFICATION
  ===================================================== */

  function verifyCandidate(
    input,
    candidate,
    currentTurnId
  ) {
    if (
      candidate.turnId ===
      currentTurnId
    ) {
      return {
        ...candidate,

        valid: false,

        invalidReason:
          "self_reference",

        locatedBy: null,

        threadId: null
      };
    }

    const lookup =
      locateTurn(
        input,
        candidate.turnId
      );

    return {
      ...candidate,

      valid:
        lookup.exists,

      invalidReason:
        lookup.exists
          ? null
          : "unknown_turn_id",

      locatedBy:
        lookup.source,

      threadId:
        lookup.exists
          ? readTurnThreadId(
              lookup.turn
            )
          : null
    };
  }

  /* =====================================================
     DEDUPLICATION
  ===================================================== */

  function deduplicateCandidates(
    candidates
  ) {
    const byTurnId = new Map();

    for (const candidate of candidates) {
      if (
        !candidate ||
        !isNonEmptyString(
          candidate.turnId
        )
      ) {
        continue;
      }

      const existing =
        byTurnId.get(
          candidate.turnId
        );

      if (!existing) {
        byTurnId.set(
          candidate.turnId,
          {
            turnId:
              candidate.turnId,

            precedence:
              candidate.precedence,

            relationshipTypes: [
              candidate.relationshipType
            ],

            evidenceSources: [
              candidate.evidenceSource
            ],

            fields:
              candidate.field
                ? [candidate.field]
                : [],

            evidence: [
              safeClone(
                candidate.evidence
              )
            ],

            provisional:
              candidate.provisional,

            valid:
              candidate.valid,

            invalidReasons:
              candidate.invalidReason
                ? [
                    candidate.invalidReason
                  ]
                : [],

            locatedBy:
              candidate.locatedBy
                ? [
                    candidate.locatedBy
                  ]
                : [],

            threadIds:
              candidate.threadId
                ? [
                    candidate.threadId
                  ]
                : [],

            metadata: [
              safeClone(
                candidate.metadata
              )
            ]
          }
        );

        continue;
      }

      existing.precedence =
        Math.min(
          existing.precedence,
          candidate.precedence
        );

      if (
        !existing
          .relationshipTypes
          .includes(
            candidate.relationshipType
          )
      ) {
        existing
          .relationshipTypes
          .push(
            candidate.relationshipType
          );
      }

      if (
        !existing
          .evidenceSources
          .includes(
            candidate.evidenceSource
          )
      ) {
        existing
          .evidenceSources
          .push(
            candidate.evidenceSource
          );
      }

      if (
        candidate.field &&
        !existing.fields.includes(
          candidate.field
        )
      ) {
        existing.fields.push(
          candidate.field
        );
      }

      if (
        candidate.invalidReason &&
        !existing
          .invalidReasons
          .includes(
            candidate.invalidReason
          )
      ) {
        existing
          .invalidReasons
          .push(
            candidate.invalidReason
          );
      }

      if (
        candidate.locatedBy &&
        !existing.locatedBy.includes(
          candidate.locatedBy
        )
      ) {
        existing.locatedBy.push(
          candidate.locatedBy
        );
      }

      if (
        candidate.threadId &&
        !existing.threadIds.includes(
          candidate.threadId
        )
      ) {
        existing.threadIds.push(
          candidate.threadId
        );
      }

      existing.evidence.push(
        safeClone(
          candidate.evidence
        )
      );

      existing.metadata.push(
        safeClone(
          candidate.metadata
        )
      );

      existing.provisional =
        existing.provisional &&
        candidate.provisional;

      existing.valid =
        existing.valid ||
        candidate.valid;
    }

    return Array.from(
      byTurnId.values()
    ).sort((left, right) => {
      if (
        left.precedence !==
        right.precedence
      ) {
        return (
          left.precedence -
          right.precedence
        );
      }

      return left.turnId.localeCompare(
        right.turnId
      );
    });
  }

  /* =====================================================
     RESULT VALIDATION
  ===================================================== */

  function validateCandidateSet(
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
              "COS_REFERENCE_CANDIDATE_SET_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      result.candidateSetType !==
        CANDIDATE_SET_TYPE
    ) {
      errors.push({
        code:
          "COS_REFERENCE_CANDIDATE_SET_TYPE_INVALID"
      });
    }

    if (
      !isNonEmptyString(
        result.currentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_CANDIDATE_CURRENT_TURN_ID_MISSING"
      });
    }

    if (
      !Array.isArray(
        result.candidates
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_CANDIDATES_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.validCandidates
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_VALID_CANDIDATES_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.invalidCandidates
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_INVALID_CANDIDATES_INVALID"
      });
    }

    for (
      const candidate of
        result.candidates || []
    ) {
      if (!isObject(candidate)) {
        errors.push({
          code:
            "COS_REFERENCE_CANDIDATE_NOT_OBJECT"
        });

        continue;
      }

      if (
        !isNonEmptyString(
          candidate.turnId
        )
      ) {
        errors.push({
          code:
            "COS_REFERENCE_CANDIDATE_TURN_ID_MISSING"
        });
      }

      if (
        !Number.isInteger(
          candidate.precedence
        )
      ) {
        errors.push({
          code:
            "COS_REFERENCE_CANDIDATE_PRECEDENCE_INVALID",

          turnId:
            candidate.turnId
        });
      }

      if (
        !Array.isArray(
          candidate.relationshipTypes
        )
      ) {
        errors.push({
          code:
            "COS_REFERENCE_CANDIDATE_RELATIONSHIPS_INVALID",

          turnId:
            candidate.turnId
        });
      }

      if (
        !Array.isArray(
          candidate.evidenceSources
        )
      ) {
        errors.push({
          code:
            "COS_REFERENCE_CANDIDATE_EVIDENCE_SOURCES_INVALID",

          turnId:
            candidate.turnId
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
     PUBLIC BUILD
  ===================================================== */

  function build(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeBuilderInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const includeActiveThread =
      firstDefined(
        options.includeActiveThread,
        input.options
          .includeActiveThread
      ) !== false;

    const includeHistoryLandmark =
      firstDefined(
        options.includeHistoryLandmark,
        input.options
          .includeHistoryLandmark
      ) === true;

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    if (!currentTurnId) {
      throw new CosReferenceCandidateBuilderError(
        "COS_REFERENCE_CANDIDATE_CURRENT_TURN_ID_MISSING",
        "Reference candidate construction requires a registered current-turn ID."
      );
    }

    const rawCandidates = [
      ...collectExplicitCandidates(
        input
      ),

      ...collectUiCandidates(
        input
      ),

      ...collectPendingInteractionCandidates(
        input
      ),

      ...collectDeliverySequenceCandidates(
        input
      ),

      ...collectActiveArtifactCandidates(
        input
      ),

      ...collectInterruptionCandidates(
        input
      ),

      ...collectUpstreamCandidates(
        input
      ),

      ...(
        includeActiveThread
          ? collectActiveThreadCandidates(
              input
            )
          : []
      ),

      ...(
        includeHistoryLandmark
          ? collectHistoryLandmarkCandidates(
              input
            )
          : []
      )
    ];

    const verifiedCandidates =
      rawCandidates.map(
        (candidate) =>
          verifyCandidate(
            input,
            candidate,
            currentTurnId
          )
      );

    const candidates =
      deduplicateCandidates(
        verifiedCandidates
      );

    const validCandidates =
      candidates.filter(
        (candidate) =>
          candidate.valid === true
      );

    const invalidCandidates =
      candidates.filter(
        (candidate) =>
          candidate.valid !== true
      );

    const explicitCandidates =
      validCandidates.filter(
        (candidate) =>
          candidate.provisional !== true
      );

    const provisionalCandidates =
      validCandidates.filter(
        (candidate) =>
          candidate.provisional === true
      );

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      candidateSetType:
        CANDIDATE_SET_TYPE,

      conversationId:
        input.conversationId,

      currentTurnId,

      hasCandidates:
        candidates.length > 0,

      hasValidCandidates:
        validCandidates.length > 0,

      requiresAdjudication:
        validCandidates.length > 1,

      candidateCount:
        candidates.length,

      validCandidateCount:
        validCandidates.length,

      invalidCandidateCount:
        invalidCandidates.length,

      explicitCandidateCount:
        explicitCandidates.length,

      provisionalCandidateCount:
        provisionalCandidates.length,

      candidates,

      validCandidates,

      invalidCandidates,

      explicitCandidates,

      provisionalCandidates,

      builtAt:
        nowIso()
    };

    const validation =
      validateCandidateSet(
        result
      );

    if (!validation.valid) {
      throw new CosReferenceCandidateBuilderError(
        "COS_REFERENCE_CANDIDATE_SET_INVALID",
        "Constructed reference candidate set failed validation.",
        {
          details:
            validation
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

  const cosReferenceCandidateBuilder = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    candidateSetType:
      CANDIDATE_SET_TYPE,

    relationshipTypes:
      RELATIONSHIP_TYPES,

    evidenceSources:
      EVIDENCE_SOURCES,

    precedenceClasses:
      PRECEDENCE_CLASSES,

    CosReferenceCandidateBuilderError,

    build,

    buildCandidates:
      build,

    create:
      build,

    run:
      build,

    validate:
      validateCandidateSet,

    normalizeInput:
      normalizeBuilderInput,

    collectExplicitCandidates,

    collectUiCandidates,

    collectPendingInteractionCandidates,

    collectActiveArtifactCandidates,

    collectDeliverySequenceCandidates,

    collectInterruptionCandidates,

    collectUpstreamCandidates,

    collectActiveThreadCandidates,

    collectHistoryLandmarkCandidates,

    deduplicateCandidates
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS
    .referenceCandidateBuilder =
    cosReferenceCandidateBuilder;

  ConversationOS
    .cosReferenceCandidateBuilder =
    cosReferenceCandidateBuilder;

  root.AriCosReferenceCandidateBuilder =
    cosReferenceCandidateBuilder;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosReferenceCandidateBuilder;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);