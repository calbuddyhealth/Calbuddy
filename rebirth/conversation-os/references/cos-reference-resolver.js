// rebirth/conversation-os/references/cos-reference-resolver.js
// ARI Rebirth — Conversation Operating System Reference Resolver
//
// Purpose:
// Produce the canonical structural reference-resolution result for the
// current turn by integrating explicit metadata, candidate construction,
// candidate adjudication, and structural target validation.
//
// V2.0.0 — Integrated Candidate and Adjudication Reference Resolution
//
// Canonical flow:
//
// Registered Current Turn
//      ↓
// Conversation History Index
//      ↓
// Pending Interaction / Artifact / Sequence State
//      ↓
// Reference Candidate Builder
//      ↓
// Reference Adjudicator
//      ↓
// Structural Target Validation
//      ↓
// Canonical Reference Resolution
//
// Authority:
//
// This component is authoritative only for:
//
// - invoking the canonical reference candidate builder,
// - invoking the canonical reference adjudicator,
// - validating selected turn IDs against supplied structural history,
// - exposing resolved turn IDs,
// - exposing unresolved structural references,
// - exposing ambiguity without inventing certainty,
// - identifying the primary structural parent candidate,
// - mapping adjudicated relationship types into canonical reference fields,
// - producing the reference-resolution result consumed by placement.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret raw user language,
// - independently classify intent,
// - independently classify conversation function,
// - independently infer semantic meaning,
// - infer emotion,
// - infer safety severity,
// - invent reference candidates,
// - invent missing turn IDs,
// - choose conversation placement,
// - mutate thread state,
// - generate a response.
//
// Architectural rule:
//
// The resolver resolves only structural candidates supplied by the canonical
// candidate builder.
//
// The adjudicator determines whether candidate evidence is sufficient.
//
// The resolver verifies and packages that decision for downstream placement.
//
// Natural-language evidence must arrive as upstream structural candidates or
// explicit metadata. This component does not maintain phrase lists.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.referenceResolver
//
// CommonJS:
//
// module.exports = cosReferenceResolver

(function initializeCosReferenceResolver(globalScope) {
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
    "cos-reference-resolver";

  const RESOLUTION_TYPE =
    "conversation_reference_resolution";

  const RESOLUTION_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "ambiguous",
    "unresolved"
  ]);

  const RESOLUTION_MODES = Object.freeze([
    "none",
    "single_target",
    "multi_target",
    "partial",
    "ambiguous",
    "unresolved"
  ]);

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

  const PARENT_RELATIONSHIP_PRIORITY = Object.freeze([
    "parent",
    "reply",
    "answer_target",
    "clarification_target",
    "correction_target",
    "branch_origin",
    "interruption_origin",
    "resume_target",
    "pending_question",
    "pending_choice",
    "pending_interaction",
    "delivery_sequence",
    "active_artifact",
    "upstream_structural_candidate",
    "reference",
    "source",
    "interrupted_thread_turn",
    "active_thread_turn",
    "unknown"
  ]);

  const EXPLICIT_REFERENCE_FIELDS = Object.freeze([
    "parentTurnId",
    "parent_turn_id",
    "replyToTurnId",
    "reply_to_turn_id",
    "answerTargetTurnId",
    "answer_target_turn_id",
    "answersTurnId",
    "answers_turn_id",
    "clarificationTargetTurnId",
    "clarification_target_turn_id",
    "clarifiesTurnId",
    "clarifies_turn_id",
    "correctionTargetTurnId",
    "correction_target_turn_id",
    "correctsTurnId",
    "corrects_turn_id",
    "branchOriginTurnId",
    "branch_origin_turn_id",
    "branchFromTurnId",
    "branch_from_turn_id",
    "interruptionOriginTurnId",
    "interruption_origin_turn_id",
    "interruptedTurnId",
    "interrupted_turn_id",
    "resumeTargetTurnId",
    "resume_target_turn_id",
    "resumesTurnId",
    "resumes_turn_id",
    "sourceTurnIds",
    "source_turn_ids",
    "referenceTurnIds",
    "reference_turn_ids"
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

  function isFunction(value) {
    return typeof value === "function";
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

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name || "Error",

        code:
          firstNonEmptyString(
            error.code
          ) ||
          "COS_REFERENCE_RESOLVER_ERROR",

        message:
          error.message ||
          "Unknown reference resolver error",

        recoverable:
          error.recoverable === true,

        details:
          error.details === undefined
            ? null
            : safeClone(
                error.details
              )
      };
    }

    return {
      name: "Error",

      code:
        "COS_REFERENCE_RESOLVER_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown reference resolver error",

      recoverable: false,

      details:
        safeClone(error)
    };
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveCandidateBuilder(
    override = null
  ) {
    return (
      override ||
      ConversationOS
        .referenceCandidateBuilder ||
      ConversationOS
        .cosReferenceCandidateBuilder ||
      root.AriCosReferenceCandidateBuilder ||
      null
    );
  }

  function resolveAdjudicator(
    override = null
  ) {
    return (
      override ||
      ConversationOS
        .referenceAdjudicator ||
      ConversationOS
        .cosReferenceAdjudicator ||
      root.AriCosReferenceAdjudicator ||
      null
    );
  }

  function resolveBuildCallable(
    builder
  ) {
    if (isFunction(builder)) {
      return builder.bind(builder);
    }

    if (builder) {
      for (
        const method of [
          "build",
          "buildCandidates",
          "create",
          "run"
        ]
      ) {
        if (
          isFunction(
            builder[method]
          )
        ) {
          return builder[
            method
          ].bind(builder);
        }
      }
    }

    throw new CosReferenceResolverError(
      "COS_REFERENCE_CANDIDATE_BUILDER_MISSING",
      "Reference candidate builder is not installed or callable."
    );
  }

  function resolveAdjudicateCallable(
    adjudicator
  ) {
    if (isFunction(adjudicator)) {
      return adjudicator.bind(
        adjudicator
      );
    }

    if (adjudicator) {
      for (
        const method of [
          "adjudicate",
          "resolve",
          "decide",
          "run"
        ]
      ) {
        if (
          isFunction(
            adjudicator[method]
          )
        ) {
          return adjudicator[
            method
          ].bind(adjudicator);
        }
      }
    }

    throw new CosReferenceResolverError(
      "COS_REFERENCE_ADJUDICATOR_MISSING",
      "Reference adjudicator is not installed or callable."
    );
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeResolverInput(
    rawInput = {}
  ) {
    const source =
      isObject(rawInput)
        ? rawInput
        : {
            currentTurn:
              rawInput
          };

    const state =
      isObject(source.state)
        ? source.state
        : {};

    const pendingInteractionState =
      firstDefined(
        source.pendingInteractionState,
        source.pending_interaction_state,
        state.pendingInteractionState,
        state.pending_interaction_state,
        {}
      );

    const artifactState =
      firstDefined(
        source.artifactState,
        source.artifact_state,
        state.artifactState,
        state.artifact_state,
        {}
      );

    const deliverySequenceState =
      firstDefined(
        source.deliverySequenceState,
        source.delivery_sequence_state,
        state.deliverySequenceState,
        state.delivery_sequence_state,
        {}
      );

    return {
      currentTurn:
        isObject(source.currentTurn)
          ? safeClone(
              source.currentTurn
            )
          : isObject(source.current_turn)
            ? safeClone(
                source.current_turn
              )
            : isObject(source.turn)
              ? safeClone(source.turn)
              : {},

      history:
        Array.isArray(source.history)
          ? source.history
          : Array.isArray(
              source.conversationHistory
            )
            ? source.conversationHistory
            : Array.isArray(
                source.conversation_history
              )
              ? source.conversation_history
              : [],

      historyIndex:
        isObject(source.historyIndex)
          ? source.historyIndex
          : isObject(
              source.history_index
            )
            ? source.history_index
            : {},

      state,

      pendingInteractionState:
        isObject(
          pendingInteractionState
        )
          ? pendingInteractionState
          : {},

      artifactState:
        isObject(artifactState)
          ? artifactState
          : {},

      deliverySequenceState:
        isObject(
          deliverySequenceState
        )
          ? deliverySequenceState
          : {},

      pendingInteraction:
        isObject(
          source.pendingInteraction
        )
          ? source.pendingInteraction
          : readActivePendingInteraction(
              pendingInteractionState
            ),

      activeArtifact:
        isObject(source.activeArtifact)
          ? source.activeArtifact
          : readActiveArtifact(
              artifactState
            ),

      deliverySequence:
        isObject(
          source.deliverySequence
        )
          ? source.deliverySequence
          : readActiveDeliverySequence(
              deliverySequenceState
            ),

      upstreamCandidates:
        Array.isArray(
          source.upstreamCandidates
        )
          ? source.upstreamCandidates
          : Array.isArray(
              source.upstream_candidates
            )
            ? source.upstream_candidates
            : Array.isArray(
                source.referenceCandidates
              )
              ? source.referenceCandidates
              : Array.isArray(
                  source.reference_candidates
                )
                ? source.reference_candidates
                : [],

      uiMetadata:
        isObject(source.uiMetadata)
          ? source.uiMetadata
          : isObject(
              source.ui_metadata
            )
            ? source.ui_metadata
            : {},

      candidateSet:
        isObject(source.candidateSet)
          ? source.candidateSet
          : isObject(
              source.candidate_set
            )
            ? source.candidate_set
            : null,

      adjudication:
        isObject(source.adjudication)
          ? source.adjudication
          : isObject(
              source.referenceAdjudication
            )
            ? source.referenceAdjudication
            : isObject(
                source.reference_adjudication
              )
              ? source.reference_adjudication
              : null,

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state.conversationId,
          state.conversation_id
        ) || null,

      options:
        isObject(source.options)
          ? safeClone(
              source.options
            )
          : {}
    };
  }

  /* =====================================================
     ACTIVE AUXILIARY RECORDS
  ===================================================== */

  function readActivePendingInteraction(
    pendingState
  ) {
    if (
      !isObject(pendingState) ||
      !isObject(
        pendingState.interactions
      )
    ) {
      return null;
    }

    const activeId =
      firstNonEmptyString(
        pendingState.activeInteractionId,
        pendingState.active_interaction_id
      );

    if (!activeId) {
      return null;
    }

    const interaction =
      pendingState.interactions[
        activeId
      ];

    return isObject(interaction)
      ? interaction
      : null;
  }

  function readActiveArtifact(
    artifactState
  ) {
    if (
      !isObject(artifactState) ||
      !isObject(
        artifactState.artifacts
      )
    ) {
      return null;
    }

    const activeId =
      firstNonEmptyString(
        artifactState.activeArtifactId,
        artifactState.active_artifact_id
      );

    if (!activeId) {
      return null;
    }

    const artifact =
      artifactState.artifacts[
        activeId
      ];

    return isObject(artifact)
      ? artifact
      : null;
  }

  function readActiveDeliverySequence(
    sequenceState
  ) {
    if (
      !isObject(sequenceState) ||
      !isObject(
        sequenceState.sequences
      )
    ) {
      return null;
    }

    const activeId =
      firstNonEmptyString(
        sequenceState.activeSequenceId,
        sequenceState.active_sequence_id
      );

    if (!activeId) {
      return null;
    }

    const sequence =
      sequenceState.sequences[
        activeId
      ];

    return isObject(sequence)
      ? sequence
      : null;
  }

  /* =====================================================
     CURRENT TURN ID
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
     TURN LOOKUPS
  ===================================================== */

  function readIndexedTurn(
    historyIndex,
    turnId
  ) {
    if (
      !isObject(historyIndex) ||
      !isObject(
        historyIndex.byTurnId
      ) ||
      !isNonEmptyString(turnId)
    ) {
      return null;
    }

    const turn =
      historyIndex.byTurnId[
        turnId
      ];

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

      const candidateTurnId =
        firstNonEmptyString(
          turn.turnId,
          turn.turn_id,
          turn.id,
          turn.messageId,
          turn.message_id
        );

      if (
        candidateTurnId === turnId
      ) {
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
        source:
          "history_index",
        turn:
          indexed
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
        turn:
          stateTurn
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
        turn:
          historyTurn
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
     REFERENCE REQUIREMENT
  ===================================================== */

  function currentTurnHasExplicitReference(
    currentTurn
  ) {
    if (!isObject(currentTurn)) {
      return false;
    }

    return EXPLICIT_REFERENCE_FIELDS.some(
      (field) => {
        if (
          !hasOwn(
            currentTurn,
            field
          )
        ) {
          return false;
        }

        const value =
          currentTurn[field];

        if (Array.isArray(value)) {
          return (
            uniqueStrings(value)
              .length > 0
          );
        }

        return isNonEmptyString(value);
      }
    );
  }

  function determineReferenceRequired(
    input,
    candidateSet,
    adjudication
  ) {
    if (
      currentTurnHasExplicitReference(
        input.currentTurn
      )
    ) {
      return true;
    }

    if (
      candidateSet &&
      candidateSet.explicitCandidateCount >
        0
    ) {
      return true;
    }

    if (
      adjudication &&
      adjudication.required === true
    ) {
      return true;
    }

    if (
      Array.isArray(
        input.upstreamCandidates
      ) &&
      input.upstreamCandidates
        .length > 0
    ) {
      return true;
    }

    return false;
  }

  /* =====================================================
     CANDIDATE CONSTRUCTION
  ===================================================== */

  function buildCandidateSet(
    input,
    options
  ) {
    if (input.candidateSet) {
      return input.candidateSet;
    }

    const builder =
      resolveCandidateBuilder(
        options
          .referenceCandidateBuilder
      );

    const build =
      resolveBuildCallable(
        builder
      );

    return build(
      {
        conversationId:
          input.conversationId,

        currentTurn:
          input.currentTurn,

        history:
          input.history,

        historyIndex:
          input.historyIndex,

        state:
          input.state,

        pendingInteraction:
          input.pendingInteraction,

        activeArtifact:
          input.activeArtifact,

        deliverySequence:
          input.deliverySequence,

        upstreamCandidates:
          input.upstreamCandidates,

        uiMetadata:
          input.uiMetadata,

        options: {
          includeActiveThread:
            firstDefined(
              options.includeActiveThread,
              input.options
                .includeActiveThread
            ) !== false,

          includeHistoryLandmark:
            firstDefined(
              options
                .includeHistoryLandmark,
              input.options
                .includeHistoryLandmark
            ) === true,

          freeze: false
        }
      },
      {
        freeze: false
      }
    );
  }

  /* =====================================================
     ADJUDICATION
  ===================================================== */

  function adjudicateCandidateSet(
    input,
    candidateSet,
    options
  ) {
    if (input.adjudication) {
      return input.adjudication;
    }

    const adjudicator =
      resolveAdjudicator(
        options.referenceAdjudicator
      );

    const adjudicate =
      resolveAdjudicateCallable(
        adjudicator
      );

    return adjudicate(
      {
        conversationId:
          input.conversationId,

        currentTurn:
          input.currentTurn,

        candidateSet
      },
      {
        freeze: false
      }
    );
  }

  /* =====================================================
     RELATIONSHIP HELPERS
  ===================================================== */

  function readCandidateRelationships(
    candidate
  ) {
    return uniqueStrings(
      firstDefined(
        candidate &&
          candidate.relationshipTypes,
        candidate &&
          candidate.relationship_types,
        candidate &&
          candidate.relationshipType,
        candidate &&
          candidate.relationship_type,
        []
      )
    ).map(
      (relationship) =>
        RELATIONSHIP_TYPES.includes(
          relationship
        )
          ? relationship
          : "unknown"
    );
  }

  function readPrimaryRelationship(
    candidate
  ) {
    const relationships =
      readCandidateRelationships(
        candidate
      );

    for (
      const relationship of
        PARENT_RELATIONSHIP_PRIORITY
    ) {
      if (
        relationships.includes(
          relationship
        )
      ) {
        return relationship;
      }
    }

    return "unknown";
  }

  function findSelectedCandidate(
    adjudication,
    turnId
  ) {
    if (
      !adjudication ||
      !Array.isArray(
        adjudication.selectedCandidates
      )
    ) {
      return null;
    }

    return (
      adjudication
        .selectedCandidates
        .find(
          (candidate) =>
            candidate &&
            candidate.turnId ===
              turnId
        ) ||
      null
    );
  }

  /* =====================================================
     SELECTED TARGET VERIFICATION
  ===================================================== */

  function verifySelectedTargets(
    input,
    adjudication
  ) {
    const requestedTurnIds =
      uniqueStrings(
        firstDefined(
          adjudication.resolvedTurnIds,
          adjudication.resolved_turn_ids,
          []
        )
      );

    const verifiedTargets = [];
    const missingTargets = [];

    for (
      const turnId of
        requestedTurnIds
    ) {
      const lookup =
        locateTurn(
          input,
          turnId
        );

      const selectedCandidate =
        findSelectedCandidate(
          adjudication,
          turnId
        );

      if (!lookup.exists) {
        missingTargets.push({
          turnId,

          reason:
            "turn_not_found",

          candidate:
            selectedCandidate
              ? safeClone(
                  selectedCandidate
                )
              : null
        });

        continue;
      }

      verifiedTargets.push({
        turnId,

        threadId:
          readTurnThreadId(
            lookup.turn
          ),

        locatedBy:
          lookup.source,

        primaryRelationship:
          readPrimaryRelationship(
            selectedCandidate
          ),

        relationshipTypes:
          readCandidateRelationships(
            selectedCandidate
          ),

        candidate:
          selectedCandidate
            ? safeClone(
                selectedCandidate
              )
            : null
      });
    }

    return {
      requestedTurnIds,

      verifiedTargets,

      verifiedTurnIds:
        verifiedTargets.map(
          (target) =>
            target.turnId
        ),

      missingTargets
    };
  }

  /* =====================================================
     PRIMARY TARGET
  ===================================================== */

  function compareVerifiedTargets(
    left,
    right
  ) {
    const leftIndex =
      PARENT_RELATIONSHIP_PRIORITY
        .indexOf(
          left.primaryRelationship
        );

    const rightIndex =
      PARENT_RELATIONSHIP_PRIORITY
        .indexOf(
          right.primaryRelationship
        );

    const safeLeftIndex =
      leftIndex < 0
        ? Number.MAX_SAFE_INTEGER
        : leftIndex;

    const safeRightIndex =
      rightIndex < 0
        ? Number.MAX_SAFE_INTEGER
        : rightIndex;

    if (
      safeLeftIndex !==
      safeRightIndex
    ) {
      return (
        safeLeftIndex -
        safeRightIndex
      );
    }

    const leftCandidate =
      left.candidate || {};

    const rightCandidate =
      right.candidate || {};

    const leftPrecedence =
      normalizeInteger(
        leftCandidate.precedence,
        1000
      );

    const rightPrecedence =
      normalizeInteger(
        rightCandidate.precedence,
        1000
      );

    if (
      leftPrecedence !==
      rightPrecedence
    ) {
      return (
        leftPrecedence -
        rightPrecedence
      );
    }

    return left.turnId.localeCompare(
      right.turnId
    );
  }

  function selectPrimaryTarget(
    verification,
    adjudication
  ) {
    const primaryTurnId =
      firstNonEmptyString(
        adjudication.primaryTurnId,
        adjudication.primary_turn_id,
        adjudication.parentTurnId,
        adjudication.parent_turn_id
      );

    if (primaryTurnId) {
      const matched =
        verification
          .verifiedTargets
          .find(
            (target) =>
              target.turnId ===
                primaryTurnId
          );

      if (matched) {
        return matched;
      }
    }

    if (
      verification
        .verifiedTargets
        .length === 0
    ) {
      return null;
    }

    return [
      ...verification
        .verifiedTargets
    ].sort(
      compareVerifiedTargets
    )[0];
  }

  /* =====================================================
     CANONICAL RELATIONSHIP FIELDS
  ===================================================== */

  function determineRelationshipFields(
    verifiedTargets
  ) {
    const fields = {
      parentTurnId: null,
      replyToTurnId: null,
      answerTargetTurnId: null,
      clarificationTargetTurnId:
        null,
      correctionTargetTurnId:
        null,
      branchOriginTurnId: null,
      interruptionOriginTurnId:
        null,
      resumeTargetTurnId: null,
      sourceTurnIds: [],
      referenceTurnIds: []
    };

    for (
      const target of
        verifiedTargets
    ) {
      const relationships =
        target.relationshipTypes;

      if (
        relationships.includes(
          "parent"
        ) &&
        !fields.parentTurnId
      ) {
        fields.parentTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "reply"
        ) &&
        !fields.replyToTurnId
      ) {
        fields.replyToTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "answer_target"
        ) &&
        !fields.answerTargetTurnId
      ) {
        fields.answerTargetTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "clarification_target"
        ) &&
        !fields
          .clarificationTargetTurnId
      ) {
        fields
          .clarificationTargetTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "correction_target"
        ) &&
        !fields
          .correctionTargetTurnId
      ) {
        fields
          .correctionTargetTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "branch_origin"
        ) &&
        !fields.branchOriginTurnId
      ) {
        fields.branchOriginTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "interruption_origin"
        ) &&
        !fields
          .interruptionOriginTurnId
      ) {
        fields
          .interruptionOriginTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "resume_target"
        ) &&
        !fields.resumeTargetTurnId
      ) {
        fields.resumeTargetTurnId =
          target.turnId;
      }

      if (
        relationships.includes(
          "source"
        )
      ) {
        fields.sourceTurnIds.push(
          target.turnId
        );
      }

      if (
        relationships.includes(
          "reference"
        ) ||
        relationships.includes(
          "upstream_structural_candidate"
        ) ||
        relationships.includes(
          "pending_interaction"
        ) ||
        relationships.includes(
          "pending_question"
        ) ||
        relationships.includes(
          "pending_choice"
        ) ||
        relationships.includes(
          "active_artifact"
        ) ||
        relationships.includes(
          "delivery_sequence"
        ) ||
        relationships.includes(
          "active_thread_turn"
        ) ||
        relationships.includes(
          "interrupted_thread_turn"
        )
      ) {
        fields.referenceTurnIds.push(
          target.turnId
        );
      }
    }

    fields.sourceTurnIds =
      uniqueStrings(
        fields.sourceTurnIds
      );

    fields.referenceTurnIds =
      uniqueStrings(
        fields.referenceTurnIds
      );

    return fields;
  }

  /* =====================================================
     STATUS DETERMINATION
  ===================================================== */

  function determineFinalStatus({
    required,
    adjudication,
    verification
  }) {
    const adjudicationStatus =
      firstNonEmptyString(
        adjudication.status
      ) || "unresolved";

    if (!required) {
      return "not_required";
    }

    if (
      adjudicationStatus ===
      "ambiguous"
    ) {
      return "ambiguous";
    }

    if (
      adjudicationStatus ===
      "unresolved"
    ) {
      return "unresolved";
    }

    if (
      verification
        .verifiedTurnIds
        .length === 0
    ) {
      return "unresolved";
    }

    if (
      verification
        .missingTargets
        .length > 0
    ) {
      return "partially_resolved";
    }

    if (
      adjudicationStatus ===
      "partially_resolved"
    ) {
      return "partially_resolved";
    }

    return "resolved";
  }

  function determineResolutionMode({
    finalStatus,
    verification,
    adjudication
  }) {
    if (
      finalStatus ===
      "not_required"
    ) {
      return "none";
    }

    if (
      finalStatus ===
      "ambiguous"
    ) {
      return "ambiguous";
    }

    if (
      finalStatus ===
      "unresolved"
    ) {
      return "unresolved";
    }

    if (
      finalStatus ===
      "partially_resolved"
    ) {
      return "partial";
    }

    if (
      verification
        .verifiedTurnIds
        .length > 1
    ) {
      return "multi_target";
    }

    return (
      RESOLUTION_MODES.includes(
        adjudication.resolutionMode
      )
        ? adjudication.resolutionMode
        : "single_target"
    );
  }

  /* =====================================================
     UNRESOLVED REFERENCES
  ===================================================== */

  function buildUnresolvedReferences({
    finalStatus,
    verification,
    adjudication,
    candidateSet
  }) {
    const unresolved = [];

    for (
      const missing of
        verification.missingTargets
    ) {
      unresolved.push({
        type:
          "missing_turn",

        turnId:
          missing.turnId,

        reason:
          missing.reason,

        candidate:
          missing.candidate
      });
    }

    if (
      candidateSet &&
      Array.isArray(
        candidateSet.invalidCandidates
      )
    ) {
      for (
        const candidate of
          candidateSet.invalidCandidates
      ) {
        unresolved.push({
          type:
            "invalid_candidate",

          turnId:
            candidate.turnId || null,

          reason:
            Array.isArray(
              candidate.invalidReasons
            )
              ? candidate
                  .invalidReasons
                  .join(",")
              : "invalid_candidate",

          candidate:
            safeClone(candidate)
        });
      }
    }

    if (
      finalStatus === "ambiguous" &&
      adjudication &&
      Array.isArray(
        adjudication
          .ambiguousCandidates
      )
    ) {
      for (
        const candidate of
          adjudication
            .ambiguousCandidates
      ) {
        unresolved.push({
          type:
            "ambiguous_candidate",

          turnId:
            candidate.turnId || null,

          reason:
            adjudication
              .decisionReason ||
            "ambiguous_reference",

          candidate:
            safeClone(candidate)
        });
      }
    }

    if (
      finalStatus === "unresolved" &&
      unresolved.length === 0
    ) {
      unresolved.push({
        type:
          "unresolved_reference",

        turnId: null,

        reason:
          adjudication &&
          adjudication.decisionReason
            ? adjudication
                .decisionReason
            : "no_resolvable_target",

        candidate: null
      });
    }

    return unresolved;
  }

  /* =====================================================
     THREAD DERIVATION
  ===================================================== */

  function determineResolvedThreadIds(
    verifiedTargets
  ) {
    return uniqueStrings(
      verifiedTargets.map(
        (target) =>
          target.threadId
      )
    );
  }

  function determinePrimaryThreadId(
    primaryTarget,
    threadIds
  ) {
    if (
      primaryTarget &&
      primaryTarget.threadId
    ) {
      return primaryTarget.threadId;
    }

    return threadIds.length === 1
      ? threadIds[0]
      : null;
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateResolution(
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
              "COS_REFERENCE_RESOLUTION_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      result.resolutionType !==
      RESOLUTION_TYPE
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLUTION_TYPE_INVALID",

        resolutionType:
          result.resolutionType
      });
    }

    if (
      !isNonEmptyString(
        result.currentTurnId
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLUTION_CURRENT_TURN_ID_MISSING"
      });
    }

    if (
      !RESOLUTION_STATUSES.includes(
        result.status
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLUTION_STATUS_INVALID",

        status:
          result.status
      });
    }

    if (
      !RESOLUTION_MODES.includes(
        result.resolutionMode
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLUTION_MODE_INVALID",

        resolutionMode:
          result.resolutionMode
      });
    }

    if (
      !Array.isArray(
        result.resolvedTurnIds
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLUTION_IDS_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.unresolvedReferences
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_UNRESOLVED_REFERENCES_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.resolvedThreadIds
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLVED_THREAD_IDS_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.relationshipTypes
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RELATIONSHIP_TYPES_INVALID"
      });
    }

    if (
      !Array.isArray(
        result.evidenceSources
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_EVIDENCE_SOURCES_INVALID"
      });
    }

    if (
      result.status === "resolved" &&
      result.resolvedTurnIds.length === 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_RESOLVED_WITHOUT_TARGETS"
      });
    }

    if (
      result.status ===
        "not_required" &&
      result.resolvedTurnIds.length > 0
    ) {
      errors.push({
        code:
          "COS_REFERENCE_NOT_REQUIRED_WITH_TARGETS"
      });
    }

    if (
      result.status ===
        "ambiguous" &&
      result.unresolvedReferences
        .length < 2
    ) {
      warnings.push({
        code:
          "COS_REFERENCE_AMBIGUITY_WITH_FEW_CANDIDATES"
      });
    }

    if (
      result.primaryTurnId &&
      !result.resolvedTurnIds.includes(
        result.primaryTurnId
      )
    ) {
      errors.push({
        code:
          "COS_REFERENCE_PRIMARY_NOT_RESOLVED",

        primaryTurnId:
          result.primaryTurnId
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

    if (
      result.resolutionMode ===
        "single_target" &&
      result.resolvedTurnIds.length !==
        1
    ) {
      errors.push({
        code:
          "COS_REFERENCE_SINGLE_TARGET_COUNT_INVALID"
      });
    }

    if (
      result.resolutionMode ===
        "multi_target" &&
      result.resolvedTurnIds.length < 2
    ) {
      errors.push({
        code:
          "COS_REFERENCE_MULTI_TARGET_COUNT_INVALID"
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
    result
  ) {
    const validation =
      validateResolution(
        result
      );

    if (!validation.valid) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_RESOLUTION_VALIDATION_FAILED",
        "Canonical reference resolution failed validation.",
        {
          details:
            validation
        }
      );
    }

    return validation;
  }

  /* =====================================================
     PUBLIC RESOLUTION
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

    const includeDiagnostics =
      firstDefined(
        options.includeDiagnostics,
        input.options
          .includeDiagnostics
      ) !== false;

    const currentTurnId =
      readCurrentTurnId(
        input.currentTurn
      );

    if (!currentTurnId) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_CURRENT_TURN_ID_MISSING",
        "Reference resolution requires a registered current-turn ID."
      );
    }

    let candidateSet;
    let adjudication;

    try {
      candidateSet =
        buildCandidateSet(
          input,
          options
        );

      adjudication =
        adjudicateCandidateSet(
          input,
          candidateSet,
          options
        );
    } catch (error) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_PIPELINE_FAILED",
        "Reference candidate construction or adjudication failed.",
        {
          cause: error,

          details: {
            currentTurnId,

            error:
              safeError(error)
          }
        }
      );
    }

    const required =
      determineReferenceRequired(
        input,
        candidateSet,
        adjudication
      );

    const verification =
      verifySelectedTargets(
        input,
        adjudication
      );

    const primaryTarget =
      selectPrimaryTarget(
        verification,
        adjudication
      );

    const finalStatus =
      determineFinalStatus({
        required,
        adjudication,
        verification
      });

    const resolutionMode =
      determineResolutionMode({
        finalStatus,
        verification,
        adjudication
      });

    const relationshipFields =
      determineRelationshipFields(
        verification
          .verifiedTargets
      );

    const relationshipTypes =
      uniqueStrings(
        verification
          .verifiedTargets
          .flatMap(
            (target) =>
              target.relationshipTypes
          )
      );

    const evidenceSources =
      uniqueStrings(
        firstDefined(
          adjudication.evidenceSources,
          adjudication.evidence_sources,
          []
        )
      );

    const resolvedThreadIds =
      determineResolvedThreadIds(
        verification
          .verifiedTargets
      );

    const primaryThreadId =
      determinePrimaryThreadId(
        primaryTarget,
        resolvedThreadIds
      );

    const unresolvedReferences =
      buildUnresolvedReferences({
        finalStatus,
        verification,
        adjudication,
        candidateSet
      });

    const resolvedTurnIds =
      finalStatus ===
        "not_required"
        ? []
        : verification
            .verifiedTurnIds;

    const primaryTurnId =
      finalStatus === "resolved" ||
      finalStatus ===
        "partially_resolved"
        ? (
            primaryTarget
              ? primaryTarget.turnId
              : null
          )
        : null;

    const parentTurnId =
      primaryTurnId;

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      resolutionType:
        RESOLUTION_TYPE,

      conversationId:
        input.conversationId,

      currentTurnId,

      required,

      status:
        finalStatus,

      resolutionMode,

      resolved:
        finalStatus ===
          "resolved",

      partiallyResolved:
        finalStatus ===
          "partially_resolved",

      ambiguous:
        finalStatus ===
          "ambiguous",

      unresolved:
        finalStatus ===
          "unresolved" ||
        finalStatus ===
          "ambiguous",

      primaryTurnId,

      parentTurnId,

      primaryThreadId,

      resolvedTurnIds,

      resolvedThreadIds,

      relationshipTypes,

      evidenceSources,

      replyToTurnId:
        relationshipFields
          .replyToTurnId,

      answerTargetTurnId:
        relationshipFields
          .answerTargetTurnId,

      clarificationTargetTurnId:
        relationshipFields
          .clarificationTargetTurnId,

      correctionTargetTurnId:
        relationshipFields
          .correctionTargetTurnId,

      branchOriginTurnId:
        relationshipFields
          .branchOriginTurnId,

      interruptionOriginTurnId:
        relationshipFields
          .interruptionOriginTurnId,

      resumeTargetTurnId:
        relationshipFields
          .resumeTargetTurnId,

      sourceTurnIds:
        uniqueStrings([
          ...relationshipFields
            .sourceTurnIds,

          ...(
            finalStatus ===
              "resolved" ||
            finalStatus ===
              "partially_resolved"
              ? resolvedTurnIds
              : []
          )
        ]),

      referenceTurnIds:
        uniqueStrings([
          ...relationshipFields
            .referenceTurnIds,

          ...resolvedTurnIds
        ]),

      unresolvedReferences,

      decisionReason:
        firstNonEmptyString(
          adjudication.decisionReason,
          adjudication.decision_reason
        ) ||
        (
          finalStatus ===
          "not_required"
            ? "reference_not_required"
            : null
        ),

      candidateCount:
        normalizeInteger(
          candidateSet.candidateCount,
          Array.isArray(
            candidateSet.candidates
          )
            ? candidateSet
                .candidates.length
            : 0
        ),

      selectedCandidateCount:
        normalizeInteger(
          adjudication
            .selectedCandidateCount,
          verification
            .verifiedTargets.length
        ),

      invalidCandidateCount:
        normalizeInteger(
          candidateSet
            .invalidCandidateCount,
          Array.isArray(
            candidateSet
              .invalidCandidates
          )
            ? candidateSet
                .invalidCandidates
                .length
            : 0
        ),

      ambiguousCandidateCount:
        normalizeInteger(
          adjudication
            .ambiguousCandidateCount,
          Array.isArray(
            adjudication
              .ambiguousCandidates
          )
            ? adjudication
                .ambiguousCandidates
                .length
            : 0
        ),

      candidateSet:
        includeDiagnostics
          ? safeClone(
              candidateSet
            )
          : null,

      adjudication:
        includeDiagnostics
          ? safeClone(
              adjudication
            )
          : null,

      verifiedTargets:
        includeDiagnostics
          ? safeClone(
              verification
                .verifiedTargets
            )
          : [],

      diagnostics:
        includeDiagnostics
          ? {
              valid: true,

              required,

              requestedTurnIds:
                verification
                  .requestedTurnIds,

              verifiedTurnIds:
                verification
                  .verifiedTurnIds,

              missingTargets:
                safeClone(
                  verification
                    .missingTargets
                ),

              candidateBuilder:
                firstNonEmptyString(
                  candidateSet
                    .component
                ) || null,

              adjudicator:
                firstNonEmptyString(
                  adjudication
                    .component
                ) || null
            }
          : null,

      resolvedAt:
        nowIso()
    };

    const validation =
      validateResolution(
        result
      );

    if (!validation.valid) {
      throw new CosReferenceResolverError(
        "COS_REFERENCE_RESOLUTION_INVALID",
        "Constructed reference resolution failed validation.",
        {
          details:
            validation
        }
      );
    }

    if (
      result.diagnostics
    ) {
      result.diagnostics
        .warningCount =
        validation.warnings.length;

      result.diagnostics.warnings =
        validation.warnings;
    }

    return freeze
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     COMPATIBILITY RESULT
  ===================================================== */

  function resolveLegacyShape(
    rawInput = {},
    options = {}
  ) {
    const result =
      resolve(
        rawInput,
        {
          ...options,
          freeze: false
        }
      );

    const legacyResult = {
      schemaVersion:
        result.schemaVersion,

      authority:
        result.authority,

      component:
        result.component,

      version:
        result.version,

      currentTurnId:
        result.currentTurnId,

      status:
        result.status,

      required:
        result.required,

      resolvedTurnIds:
        [...result.resolvedTurnIds],

      unresolvedReferences:
        safeClone(
          result.unresolvedReferences
        ),

      parentTurnId:
        result.parentTurnId,

      primaryTurnId:
        result.primaryTurnId,

      threadId:
        result.primaryThreadId,

      sourceTurnIds:
        [...result.sourceTurnIds],

      referenceTurnIds:
        [...result.referenceTurnIds],

      replyToTurnId:
        result.replyToTurnId,

      answerTargetTurnId:
        result.answerTargetTurnId,

      clarificationTargetTurnId:
        result
          .clarificationTargetTurnId,

      correctionTargetTurnId:
        result
          .correctionTargetTurnId,

      branchOriginTurnId:
        result.branchOriginTurnId,

      interruptionOriginTurnId:
        result
          .interruptionOriginTurnId,

      resumeTargetTurnId:
        result.resumeTargetTurnId,

      relationshipTypes:
        [...result.relationshipTypes],

      evidenceSources:
        [...result.evidenceSources],

      decisionReason:
        result.decisionReason,

      diagnostics:
        safeClone(
          result.diagnostics
        )
    };

    return options.freeze === false
      ? legacyResult
      : freezeClone(
          legacyResult
        );
  }

  /* =====================================================
     SAFE RESOLUTION
  ===================================================== */

  function safeResolve(
    rawInput = {},
    options = {}
  ) {
    try {
      return resolve(
        rawInput,
        options
      );
    } catch (error) {
      const input =
        normalizeResolverInput(
          rawInput
        );

      const currentTurnId =
        readCurrentTurnId(
          input.currentTurn
        );

      return freezeClone({
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        resolutionType:
          RESOLUTION_TYPE,

        conversationId:
          input.conversationId,

        currentTurnId:
          currentTurnId || null,

        required: true,

        status:
          "unresolved",

        resolutionMode:
          "unresolved",

        resolved: false,

        partiallyResolved: false,

        ambiguous: false,

        unresolved: true,

        primaryTurnId: null,

        parentTurnId: null,

        primaryThreadId: null,

        resolvedTurnIds: [],

        resolvedThreadIds: [],

        relationshipTypes: [],

        evidenceSources: [],

        replyToTurnId: null,

        answerTargetTurnId: null,

        clarificationTargetTurnId:
          null,

        correctionTargetTurnId:
          null,

        branchOriginTurnId: null,

        interruptionOriginTurnId:
          null,

        resumeTargetTurnId: null,

        sourceTurnIds: [],

        referenceTurnIds: [],

        unresolvedReferences: [
          {
            type:
              "resolver_failure",

            turnId: null,

            reason:
              firstNonEmptyString(
                error.code
              ) ||
              "reference_resolution_failed",

            candidate: null
          }
        ],

        decisionReason:
          "reference_resolution_failed",

        candidateCount: 0,

        selectedCandidateCount: 0,

        invalidCandidateCount: 0,

        ambiguousCandidateCount: 0,

        candidateSet: null,

        adjudication: null,

        verifiedTargets: [],

        diagnostics: {
          valid: false,

          required: true,

          requestedTurnIds: [],

          verifiedTurnIds: [],

          missingTargets: [],

          error:
            safeError(error)
        },

        resolvedAt:
          nowIso()
      });
    }
  }

  /* =====================================================
     QUERY HELPERS
  ===================================================== */

  function hasResolvedReference(
    result
  ) {
    return Boolean(
      isObject(result) &&
      (
        result.status ===
          "resolved" ||
        result.status ===
          "partially_resolved"
      ) &&
      Array.isArray(
        result.resolvedTurnIds
      ) &&
      result.resolvedTurnIds
        .length > 0
    );
  }

  function getPrimaryTurnId(
    result
  ) {
    return isObject(result)
      ? firstNonEmptyString(
          result.primaryTurnId,
          result.primary_turn_id,
          result.parentTurnId,
          result.parent_turn_id
        )
      : null;
  }

  function getResolvedTurnIds(
    result
  ) {
    return isObject(result)
      ? uniqueStrings(
          firstDefined(
            result.resolvedTurnIds,
            result.resolved_turn_ids,
            []
          )
        )
      : [];
  }

  function requiresClarification(
    result
  ) {
    return Boolean(
      isObject(result) &&
      (
        result.status ===
          "ambiguous" ||
        result.status ===
          "unresolved"
      ) &&
      result.required === true
    );
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

    resolutionType:
      RESOLUTION_TYPE,

    resolutionStatuses:
      RESOLUTION_STATUSES,

    resolutionModes:
      RESOLUTION_MODES,

    relationshipTypes:
      RELATIONSHIP_TYPES,

    parentRelationshipPriority:
      PARENT_RELATIONSHIP_PRIORITY,

    CosReferenceResolverError,

    resolve,

    run:
      resolve,

    execute:
      resolve,

    process:
      resolve,

    resolveLegacyShape,

    safeResolve,

    validate:
      validateResolution,

    validateResolution,

    assertValid,

    normalizeInput:
      normalizeResolverInput,

    buildCandidateSet,

    adjudicateCandidateSet,

    verifySelectedTargets,

    selectPrimaryTarget,

    determineRelationshipFields,

    hasResolvedReference,

    getPrimaryTurnId,

    getResolvedTurnIds,

    requiresClarification
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