// rebirth/conversation-os/references/cos-reference-resolver.js
// ARI Rebirth — Conversation Operating System Reference Resolver
//
// Purpose:
// Resolve explicit structural turn references for the Conversation
// Operating System without interpreting natural-language meaning.
//
// V1.0.0 — Canonical Structural Reference Resolution
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Explicit Reference Collection
//      ↓
// Reference Normalization
//      ↓
// History / State Verification
//      ↓
// Parent / Reply Reconciliation
//      ↓
// Resolution Status
//      ↓
// Structural Reference Resolution Result
//
// Authority:
//
// This component is authoritative only for:
//
// - reading explicit turn-reference metadata,
// - verifying referenced turn IDs,
// - preserving explicit parent-turn relationships,
// - preserving explicit reply-to relationships,
// - preserving explicit source-turn relationships,
// - identifying unknown structural turn references,
// - returning resolved and unresolved structural references.
//
// Non-authority:
//
// This component must not:
//
// - interpret natural-language references,
// - decide what words such as "it," "that," "why," or "this" mean,
// - classify semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotional state,
// - infer safety severity,
// - infer a source turn from recency alone,
// - guess a parent turn,
// - determine final conversation placement,
// - choose a thread based on language,
// - plan or generate a response.
//
// Architectural rule:
//
// The Reference Resolver resolves only references supported by explicit
// structural metadata and the canonical history/state indexes.
//
// An absent reference is not automatically an unresolved reference.
//
// A reference that cannot be verified remains unresolved.
// It must never be silently replaced by a guessed turn.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.referenceResolver

(function initializeCosReferenceResolver(globalScope) {
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
    "cos-reference-resolver";

  const RESOLUTION_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "unresolved"
  ]);

  const REFERENCE_TYPES = Object.freeze([
    "parent",
    "reply",
    "source",
    "reference",
    "branch_origin",
    "correction_target",
    "clarification_target",
    "answer_target",
    "interruption_origin",
    "resume_target",
    "unknown"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosReferenceResolverError extends Error {
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
        "COS reference resolver error"
      );

      this.name =
        "CosReferenceResolverError";

      this.code =
        code ||
        "COS_REFERENCE_RESOLVER_ERROR";

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
          CosReferenceResolverError
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

  function nowIso() {
    return new Date().toISOString();
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeResolverInput(
    rawInput = {}
  ) {
    const source = isObject(rawInput)
      ? rawInput
      : {
          currentTurn: rawInput
        };

    const currentTurn = isObject(
      firstDefined(
        source.currentTurn,
        source.current_turn,
        source.turn,
        null
      )
    )
      ? safeClone(
          firstDefined(
            source.currentTurn,
            source.current_turn,
            source.turn
          )
        )
      : {};

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

  function readCurrentTurnId(turn) {
    return firstNonEmptyString(
      turn.turnId,
      turn.turn_id,
      turn.id,
      turn.messageId,
      turn.message_id
    );
  }

  function readParentTurnId(turn) {
    return firstNonEmptyString(
      turn.parentTurnId,
      turn.parent_turn_id
    );
  }

  function readReplyToTurnId(turn) {
    return firstNonEmptyString(
      turn.replyToTurnId,
      turn.reply_to_turn_id
    );
  }

  function readSourceTurnIds(turn) {
    return uniqueStrings(
      firstDefined(
        turn.sourceTurnIds,
        turn.source_turn_ids,
        []
      )
    );
  }

  function readReferenceTurnIds(turn) {
    return uniqueStrings(
      firstDefined(
        turn.referenceTurnIds,
        turn.reference_turn_ids,
        turn.references,
        []
      )
    );
  }

  function readBranchOriginTurnId(turn) {
    return firstNonEmptyString(
      turn.branchOriginTurnId,
      turn.branch_origin_turn_id,
      turn.branchFromTurnId,
      turn.branch_from_turn_id
    );
  }

  function readCorrectionTargetTurnId(turn) {
    return firstNonEmptyString(
      turn.correctionTargetTurnId,
      turn.correction_target_turn_id,
      turn.correctsTurnId,
      turn.corrects_turn_id
    );
  }

  function readClarificationTargetTurnId(turn) {
    return firstNonEmptyString(
      turn.clarificationTargetTurnId,
      turn.clarification_target_turn_id,
      turn.clarifiesTurnId,
      turn.clarifies_turn_id
    );
  }

  function readAnswerTargetTurnId(turn) {
    return firstNonEmptyString(
      turn.answerTargetTurnId,
      turn.answer_target_turn_id,
      turn.answersTurnId,
      turn.answers_turn_id
    );
  }

  function readInterruptionOriginTurnId(turn) {
    return firstNonEmptyString(
      turn.interruptionOriginTurnId,
      turn.interruption_origin_turn_id,
      turn.interruptedTurnId,
      turn.interrupted_turn_id
    );
  }

  function readResumeTargetTurnId(turn) {
    return firstNonEmptyString(
      turn.resumeTargetTurnId,
      turn.resume_target_turn_id,
      turn.resumesTurnId,
      turn.resumes_turn_id
    );
  }

  /* =====================================================
     REFERENCE COLLECTION
  ===================================================== */

  function createReferenceCandidate({
    turnId,
    type,
    field,
    priority = 100
  }) {
    if (!isNonEmptyString(turnId)) {
      return null;
    }

    return {
      turnId: turnId.trim(),

      type:
        REFERENCE_TYPES.includes(type)
          ? type
          : "unknown",

      field:
        isNonEmptyString(field)
          ? field
          : null,

      priority:
        Number.isFinite(
          Number(priority)
        )
          ? Number(priority)
          : 100
    };
  }

  function collectExplicitReferenceCandidates(
    currentTurn
  ) {
    const candidates = [];

    const add = (
      turnId,
      type,
      field,
      priority
    ) => {
      const candidate =
        createReferenceCandidate({
          turnId,
          type,
          field,
          priority
        });

      if (candidate) {
        candidates.push(candidate);
      }
    };

    add(
      readParentTurnId(currentTurn),
      "parent",
      "parentTurnId",
      10
    );

    add(
      readReplyToTurnId(currentTurn),
      "reply",
      "replyToTurnId",
      20
    );

    add(
      readBranchOriginTurnId(currentTurn),
      "branch_origin",
      "branchOriginTurnId",
      30
    );

    add(
      readCorrectionTargetTurnId(
        currentTurn
      ),
      "correction_target",
      "correctionTargetTurnId",
      40
    );

    add(
      readClarificationTargetTurnId(
        currentTurn
      ),
      "clarification_target",
      "clarificationTargetTurnId",
      50
    );

    add(
      readAnswerTargetTurnId(currentTurn),
      "answer_target",
      "answerTargetTurnId",
      60
    );

    add(
      readInterruptionOriginTurnId(
        currentTurn
      ),
      "interruption_origin",
      "interruptionOriginTurnId",
      70
    );

    add(
      readResumeTargetTurnId(currentTurn),
      "resume_target",
      "resumeTargetTurnId",
      80
    );

    for (
      const turnId of
        readSourceTurnIds(currentTurn)
    ) {
      add(
        turnId,
        "source",
        "sourceTurnIds",
        90
      );
    }

    for (
      const turnId of
        readReferenceTurnIds(currentTurn)
    ) {
      add(
        turnId,
        "reference",
        "referenceTurnIds",
        100
      );
    }

    return candidates;
  }

  function deduplicateReferenceCandidates(
    candidates
  ) {
    const byTurnId = new Map();

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const existing =
        byTurnId.get(candidate.turnId);

      if (!existing) {
        byTurnId.set(
          candidate.turnId,
          {
            turnId:
              candidate.turnId,

            types: [
              candidate.type
            ],

            fields: candidate.field
              ? [candidate.field]
              : [],

            priority:
              candidate.priority
          }
        );

        continue;
      }

      if (
        !existing.types.includes(
          candidate.type
        )
      ) {
        existing.types.push(
          candidate.type
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

      existing.priority = Math.min(
        existing.priority,
        candidate.priority
      );
    }

    return Array.from(
      byTurnId.values()
    ).sort(
      (a, b) =>
        a.priority - b.priority
    );
  }

  /* =====================================================
     STRUCTURAL LOOKUPS
  ===================================================== */

  function readTurnFromIndex(
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

  function readTurnFromState(
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

  function readTurnFromHistory(
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

      const candidateTurnId =
        firstNonEmptyString(
          turn.turnId,
          turn.turn_id,
          turn.id,
          turn.messageId,
          turn.message_id
        );

      if (candidateTurnId === turnId) {
        return turn;
      }
    }

    return null;
  }

  function resolveStructuralTurn(
    {
      history,
      historyIndex,
      state
    },
    turnId
  ) {
    const indexedTurn =
      readTurnFromIndex(
        historyIndex,
        turnId
      );

    if (indexedTurn) {
      return {
        found: true,
        source: "history_index",
        turn: indexedTurn
      };
    }

    const stateTurn =
      readTurnFromState(
        state,
        turnId
      );

    if (stateTurn) {
      return {
        found: true,
        source: "state",
        turn: stateTurn
      };
    }

    const historyTurn =
      readTurnFromHistory(
        history,
        turnId
      );

    if (historyTurn) {
      return {
        found: true,
        source: "history",
        turn: historyTurn
      };
    }

    return {
      found: false,
      source: null,
      turn: null
    };
  }

  /* =====================================================
     REFERENCE VERIFICATION
  ===================================================== */

  function verifyCandidates(
    candidates,
    structuralSources,
    currentTurnId
  ) {
    const resolvedReferences = [];
    const unresolvedReferences = [];
    const warnings = [];

    for (const candidate of candidates) {
      if (
        candidate.turnId ===
        currentTurnId
      ) {
        unresolvedReferences.push({
          turnId:
            candidate.turnId,

          types:
            [...candidate.types],

          fields:
            [...candidate.fields],

          reason:
            "self_reference",

          code:
            "COS_REFERENCE_SELF_REFERENCE"
        });

        continue;
      }

      const lookup =
        resolveStructuralTurn(
          structuralSources,
          candidate.turnId
        );

      if (!lookup.found) {
        unresolvedReferences.push({
          turnId:
            candidate.turnId,

          types:
            [...candidate.types],

          fields:
            [...candidate.fields],

          reason:
            "unknown_turn_id",

          code:
            "COS_REFERENCE_UNKNOWN_TURN"
        });

        continue;
      }

      const resolved = {
        turnId:
          candidate.turnId,

        types:
          [...candidate.types],

        fields:
          [...candidate.fields],

        priority:
          candidate.priority,

        source:
          lookup.source,

        turn: safeClone(
          lookup.turn
        )
      };

      resolvedReferences.push(
        resolved
      );

      const indexedConversationId =
        firstNonEmptyString(
          lookup.turn.conversationId,
          lookup.turn.conversation_id
        );

      const currentConversationId =
        firstNonEmptyString(
          structuralSources
            .conversationId
        );

      if (
        indexedConversationId &&
        currentConversationId &&
        indexedConversationId !==
          currentConversationId
      ) {
        warnings.push({
          code:
            "COS_REFERENCE_CROSS_CONVERSATION",

          turnId:
            candidate.turnId,

          referencedConversationId:
            indexedConversationId,

          currentConversationId
        });
      }
    }

    return {
      resolvedReferences,
      unresolvedReferences,
      warnings
    };
  }

  /* =====================================================
     PRIMARY RELATIONSHIP SELECTION
  ===================================================== */

  function findResolvedReferenceByType(
    resolvedReferences,
    type
  ) {
    return (
      resolvedReferences.find(
        (reference) =>
          reference.types.includes(type)
      ) || null
    );
  }

  function determinePrimaryReference(
    resolvedReferences
  ) {
    if (
      resolvedReferences.length === 0
    ) {
      return null;
    }

    const typePriority = [
      "parent",
      "reply",
      "branch_origin",
      "correction_target",
      "clarification_target",
      "answer_target",
      "interruption_origin",
      "resume_target",
      "source",
      "reference"
    ];

    for (const type of typePriority) {
      const match =
        findResolvedReferenceByType(
          resolvedReferences,
          type
        );

      if (match) {
        return match;
      }
    }

    return resolvedReferences[0];
  }

  function determineParentTurnId(
    currentTurn,
    resolvedReferences
  ) {
    const explicitParentTurnId =
      readParentTurnId(currentTurn);

    if (
      explicitParentTurnId &&
      resolvedReferences.some(
        (reference) =>
          reference.turnId ===
          explicitParentTurnId
      )
    ) {
      return explicitParentTurnId;
    }

    const replyReference =
      findResolvedReferenceByType(
        resolvedReferences,
        "reply"
      );

    if (replyReference) {
      return replyReference.turnId;
    }

    const primaryReference =
      determinePrimaryReference(
        resolvedReferences
      );

    return primaryReference
      ? primaryReference.turnId
      : null;
  }

  /* =====================================================
     STATUS DETERMINATION
  ===================================================== */

  function determineResolutionStatus({
    candidateCount,
    resolvedCount,
    unresolvedCount
  }) {
    if (candidateCount === 0) {
      return "not_required";
    }

    if (
      resolvedCount > 0 &&
      unresolvedCount === 0
    ) {
      return "resolved";
    }

    if (
      resolvedCount > 0 &&
      unresolvedCount > 0
    ) {
      return "partially_resolved";
    }

    return "unresolved";
  }

  /* =====================================================
     RELATIONSHIP RECONCILIATION
  ===================================================== */

  function reconcileExplicitRelationships({
    currentTurn,
    resolvedReferences,
    unresolvedReferences
  }) {
    const warnings = [];

    const parentTurnId =
      readParentTurnId(currentTurn);

    const replyToTurnId =
      readReplyToTurnId(currentTurn);

    if (
      parentTurnId &&
      replyToTurnId &&
      parentTurnId !== replyToTurnId
    ) {
      warnings.push({
        code:
          "COS_REFERENCE_PARENT_REPLY_DIVERGENCE",

        parentTurnId,
        replyToTurnId,

        message:
          "Explicit parent and reply targets refer to different turns."
      });
    }

    const resolvedTurnIds =
      resolvedReferences.map(
        (reference) =>
          reference.turnId
      );

    const unresolvedTurnIds =
      unresolvedReferences.map(
        (reference) =>
          reference.turnId
      );

    return {
      resolvedTurnIds:
        uniqueStrings(
          resolvedTurnIds
        ),

      unresolvedTurnIds:
        uniqueStrings(
          unresolvedTurnIds
        ),

      warnings
    };
  }

  /* =====================================================
     RESULT VALIDATION
  ===================================================== */

  function validateResult(result) {
    const errors = [];
    const warnings = [];

    if (!isObject(result)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_REFERENCE_RESULT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      !RESOLUTION_STATUSES.includes(
        result.status
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_STATUS_INVALID",

        status:
          result.status
      });
    }

    if (
      !Array.isArray(
        result.resolvedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLVED_IDS_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.unresolvedReferences
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_UNRESOLVED_LIST_INVALID"
      });
    }

    if (
      result.status ===
        "not_required" &&
      (
        result.resolvedTurnIds.length > 0 ||
        result.unresolvedReferences.length > 0
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_NOT_REQUIRED_WITH_REFERENCES"
      });
    }

    if (
      result.status ===
        "resolved" &&
      result.unresolvedReferences.length > 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLVED_WITH_UNRESOLVED_ITEMS"
      });
    }

    if (
      result.status ===
        "unresolved" &&
      result.resolvedTurnIds.length > 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_UNRESOLVED_WITH_RESOLVED_IDS"
      });
    }

    if (
      result.parentTurnId &&
      !result.resolvedTurnIds.includes(
        result.parentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_PARENT_NOT_RESOLVED",

        parentTurnId:
          result.parentTurnId
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
     PUBLIC RESOLVE
  ===================================================== */

  function resolve(
    rawInput = {},
    options = {}
  ) {
    const input =
      normalizeResolverInput(
        rawInput
      );

    const freeze =
      firstDefined(
        options.freeze,
        input.options.freeze
      ) !== false;

    const currentTurn =
      input.currentTurn;

    const currentTurnId =
      readCurrentTurnId(
        currentTurn
      );

    if (!currentTurnId) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_CURRENT_TURN_ID_MISSING",
        "Reference resolution requires a registered current-turn ID."
      );
    }

    const rawCandidates =
      collectExplicitReferenceCandidates(
        currentTurn
      );

    const candidates =
      deduplicateReferenceCandidates(
        rawCandidates
      );

    const verification =
      verifyCandidates(
        candidates,
        {
          history:
            input.history,

          historyIndex:
            input.historyIndex,

          state:
            input.state,

          conversationId:
            input.conversationId
        },
        currentTurnId
      );

    const reconciliation =
      reconcileExplicitRelationships({
        currentTurn,

        resolvedReferences:
          verification
            .resolvedReferences,

        unresolvedReferences:
          verification
            .unresolvedReferences
      });

    const status =
      determineResolutionStatus({
        candidateCount:
          candidates.length,

        resolvedCount:
          verification
            .resolvedReferences
            .length,

        unresolvedCount:
          verification
            .unresolvedReferences
            .length
      });

    const primaryReference =
      determinePrimaryReference(
        verification
          .resolvedReferences
      );

    const parentTurnId =
      determineParentTurnId(
        currentTurn,
        verification
          .resolvedReferences
      );

    const warnings = [
      ...verification.warnings,
      ...reconciliation.warnings
    ];

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
        input.conversationId,

      currentTurnId,

      required:
        candidates.length > 0,

      status,

      parentTurnId,

      primaryTurnId:
        primaryReference
          ? primaryReference.turnId
          : null,

      resolvedTurnIds:
        reconciliation
          .resolvedTurnIds,

      unresolvedTurnIds:
        reconciliation
          .unresolvedTurnIds,

      resolvedReferences:
        verification
          .resolvedReferences
          .map((reference) => ({
            turnId:
              reference.turnId,

            types:
              [...reference.types],

            fields:
              [...reference.fields],

            source:
              reference.source
          })),

      unresolvedReferences:
        verification
          .unresolvedReferences
          .map((reference) => ({
            turnId:
              reference.turnId,

            types:
              [...reference.types],

            fields:
              [...reference.fields],

            reason:
              reference.reason,

            code:
              reference.code
          })),

      candidateCount:
        candidates.length,

      resolvedCount:
        verification
          .resolvedReferences
          .length,

      unresolvedCount:
        verification
          .unresolvedReferences
          .length,

      resolutionSource:
        candidates.length > 0
          ? "explicit_structural_metadata"
          : "no_structural_reference_required",

      resolvedAt:
        nowIso(),

      diagnostics: {
        valid: true,

        warningCount:
          warnings.length,

        warnings,

        candidates:
          candidates.map(
            (candidate) => ({
              turnId:
                candidate.turnId,

              types:
                [...candidate.types],

              fields:
                [...candidate.fields],

              priority:
                candidate.priority
            })
          )
      }
    };

    const validation =
      validateResult(result);

    if (!validation.valid) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_RESULT_VALIDATION_FAILED",
        "Structural reference resolution result failed validation.",
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

  const cosReferenceResolver = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    resolutionStatuses:
      RESOLUTION_STATUSES,

    referenceTypes:
      REFERENCE_TYPES,

    CosReferenceResolverError,

    resolve,

    resolveReferences:
      resolve,

    run:
      resolve,

    validate:
      validateResult,

    normalizeInput:
      normalizeResolverInput,

    collectExplicitReferenceCandidates,

    deduplicateReferenceCandidates
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.referenceResolver =
    cosReferenceResolver;

  ConversationOS.cosReferenceResolver =
    cosReferenceResolver;

  root.AriCosReferenceResolver =
    cosReferenceResolver;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosReferenceResolver;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);