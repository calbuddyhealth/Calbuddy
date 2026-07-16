// rebirth/integration/rebirth-conversation-os-stage.js
// ARI Rebirth — Conversation Operating System Integration Stage
//
// Purpose:
// Connect the Conversation Operating System to the wider ARI Rebirth runtime
// while preserving all upstream authority boundaries.
//
// V1.0.0 — Canonical Rebirth / COS Integration Stage
//
// Canonical flow:
//
// Rebirth Runtime State
//      ↓
// Upstream Authority Packet Extraction
//      ↓
// Conversation Identity Resolution
//      ↓
// COS Controller Input Construction
//      ↓
// COS Controller Execution
//      ↓
// COS Result Validation
//      ↓
// Rebirth Runtime State Merge
//
// Upstream authorities preserved:
//
// - Semantic Frame Builder remains authoritative for semantic meaning.
// - Conversation Function Engine remains authoritative for conversational
//   purpose.
// - Safety Context remains authoritative for safety severity and governance.
// - COS remains authoritative only for structural conversation placement,
//   references, threads, pending interactions, artifacts, and delivery
//   sequences.
//
// Authority:
//
// This component is authoritative only for:
//
// - extracting approved upstream packets from Rebirth runtime state,
// - constructing the COS controller input,
// - invoking the COS controller,
// - preserving COS state across Rebirth turns,
// - merging COS outputs into Rebirth runtime state,
// - exposing COS diagnostics and failure information,
// - enforcing that COS does not replace upstream authority packets.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret raw language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotional state,
// - infer safety severity,
// - generate response content,
// - modify upstream authority conclusions,
// - treat COS placement as semantic truth,
// - allow COS to overwrite safety governance,
// - invent structural commands.
//
// Architectural rule:
//
// COS receives upstream authority outputs as evidence.
//
// COS may use them to support structural placement.
//
// COS may not replace, rewrite, or downgrade them.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.Integration
// window.Ari.Rebirth.Integration.conversationOSStage
//
// CommonJS:
//
// module.exports = rebirthConversationOSStage

(function initializeRebirthConversationOSStage(globalScope) {
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
  root.Ari.Rebirth.Integration =
    root.Ari.Rebirth.Integration || {};
  root.Ari.Rebirth.ConversationOS =
    root.Ari.Rebirth.ConversationOS || {};

  const Integration =
    root.Ari.Rebirth.Integration;

  const ConversationOS =
    root.Ari.Rebirth.ConversationOS;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "rebirth_runtime_integration";

  const COMPONENT_NAME =
    "rebirth-conversation-os-stage";

  const STAGE_NAME =
    "conversation_os";

  const RESULT_TYPE =
    "rebirth_conversation_os_stage_result";

  const COS_AUTHORITY =
    "conversation_operating_system";

  const UPSTREAM_AUTHORITIES = Object.freeze({
    semantic:
      "semantic_frame_builder",

    conversationFunction:
      "conversation_function_engine",

    safety:
      "safety_context",

    emotion:
      "emotional_context",

    constraints:
      "constraint_authority"
  });

  const COS_RUNTIME_STATE_KEYS = Object.freeze([
    "conversationOSState",
    "conversation_os_state",
    "cosState",
    "cos_state"
  ]);

  const COS_RESULT_STATE_KEYS = Object.freeze([
    "conversationOSResult",
    "conversation_os_result",
    "cosResult",
    "cos_result"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class RebirthConversationOSStageError extends Error {
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
        "Rebirth Conversation OS stage error"
      );

      this.name =
        "RebirthConversationOSStageError";

      this.code =
        code ||
        "REBIRTH_CONVERSATION_OS_STAGE_ERROR";

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
          RebirthConversationOSStageError
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

  function monotonicNow() {
    if (
      typeof performance !==
        "undefined" &&
      performance &&
      isFunction(
        performance.now
      )
    ) {
      return performance.now();
    }

    return Date.now();
  }

  function elapsedMilliseconds(
    startedAt
  ) {
    return Math.max(
      0,
      monotonicNow() -
      startedAt
    );
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
          "REBIRTH_CONVERSATION_OS_STAGE_ERROR",

        message:
          error.message ||
          "Unknown Rebirth Conversation OS stage error",

        recoverable:
          error.recoverable === true,

        details:
          error.details === undefined
            ? null
            : safeClone(
                error.details
              ),

        cause:
          error.cause instanceof Error
            ? {
                name:
                  error.cause.name,

                code:
                  firstNonEmptyString(
                    error.cause.code
                  ) || null,

                message:
                  error.cause.message
              }
            : safeClone(
                error.cause
              )
      };
    }

    return {
      name: "Error",

      code:
        "REBIRTH_CONVERSATION_OS_STAGE_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown Rebirth Conversation OS stage error",

      recoverable: false,

      details:
        safeClone(error),

      cause: null
    };
  }

  /* =====================================================
     CONTROLLER DISCOVERY
  ===================================================== */

  function resolveController(
    override = null
  ) {
    return (
      override ||
      ConversationOS.controller ||
      ConversationOS.cosController ||
      root.AriCosController ||
      null
    );
  }

  function resolveControllerCallable(
    controller
  ) {
    if (isFunction(controller)) {
      return controller.bind(
        controller
      );
    }

    if (controller) {
      for (
        const method of [
          "run",
          "execute",
          "process",
          "safeRun"
        ]
      ) {
        if (
          isFunction(
            controller[method]
          )
        ) {
          return controller[
            method
          ].bind(controller);
        }
      }
    }

    throw new RebirthConversationOSStageError(
      "REBIRTH_COS_CONTROLLER_MISSING",
      "Conversation Operating System controller is not installed or callable."
    );
  }

  /* =====================================================
     RUNTIME STATE READERS
  ===================================================== */

  function readFirstObject(
    source,
    paths = []
  ) {
    for (const path of paths) {
      const value =
        readPath(
          source,
          path
        );

      if (isObject(value)) {
        return value;
      }
    }

    return null;
  }

  function readFirstArray(
    source,
    paths = []
  ) {
    for (const path of paths) {
      const value =
        readPath(
          source,
          path
        );

      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  function readPath(
    source,
    path
  ) {
    const segments =
      Array.isArray(path)
        ? path
        : String(path).split(".");

    let current = source;

    for (
      const segment of segments
    ) {
      if (
        current === null ||
        current === undefined
      ) {
        return undefined;
      }

      current =
        current[segment];
    }

    return current;
  }

  function readCurrentTurn(
    state
  ) {
    return (
      readFirstObject(
        state,
        [
          "currentTurn",
          "current_turn",
          "registeredCurrentTurn",
          "registered_current_turn",
          "turnIntake.currentTurn",
          "turnIntake.current_turn",
          "turnContext.currentTurn",
          "turnContext.current_turn",
          "runtime.currentTurn",
          "runtime.current_turn"
        ]
      ) ||
      buildTurnFromRawInput(state)
    );
  }

  function buildTurnFromRawInput(
    state
  ) {
    const rawText =
      firstDefined(
        state.message,
        state.input,
        state.text,
        state.rawMessage,
        state.raw_message,
        state.userMessage,
        state.user_message
      );

    if (
      rawText === undefined ||
      rawText === null
    ) {
      return {};
    }

    return {
      turnId:
        firstNonEmptyString(
          state.turnId,
          state.turn_id,
          state.messageId,
          state.message_id
        ) || null,

      role:
        firstNonEmptyString(
          state.role
        ) || "user",

      text:
        String(rawText),

      timestamp:
        firstNonEmptyString(
          state.timestamp,
          state.createdAt,
          state.created_at
        ) || null
    };
  }

  function readConversationHistory(
    state
  ) {
    return readFirstArray(
      state,
      [
        "conversationHistory",
        "conversation_history",
        "history",
        "threadHistory",
        "thread_history",
        "runtime.history",
        "runtime.conversationHistory",
        "context.conversationHistory"
      ]
    );
  }

  function readExistingCosState(
    state
  ) {
    for (
      const key of
        COS_RUNTIME_STATE_KEYS
    ) {
      if (
        isObject(
          state[key]
        )
      ) {
        return state[key];
      }
    }

    return null;
  }

  function readConversationId(
    state,
    currentTurn
  ) {
    return firstNonEmptyString(
      state.conversationId,
      state.conversation_id,
      state.threadId,
      state.thread_id,
      state.runtime &&
        state.runtime
          .conversationId,
      state.context &&
        state.context
          .conversationId,
      currentTurn &&
        currentTurn
          .conversationId,
      currentTurn &&
        currentTurn
          .conversation_id,
      readExistingCosState(state) &&
        readExistingCosState(state)
          .conversationId
    );
  }

  /* =====================================================
     UPSTREAM AUTHORITY EXTRACTION
  ===================================================== */

  function readSemanticPacket(
    state
  ) {
    return readFirstObject(
      state,
      [
        "semanticPacket",
        "semantic_packet",
        "semanticFrame",
        "semantic_frame",
        "canonicalSemanticFrame",
        "canonical_semantic_frame",
        "semanticStructure",
        "semantic_structure",
        "perception.semanticPacket",
        "perception.semanticFrame",
        "perception.semanticStructure",
        "authorityPackets.semantic",
        "authority_packets.semantic"
      ]
    );
  }

  function readConversationFunction(
    state
  ) {
    return readFirstObject(
      state,
      [
        "conversationFunction",
        "conversation_function",
        "conversationFunctionResult",
        "conversation_function_result",
        "canonicalConversationFunction",
        "canonical_conversation_function",
        "perception.conversationFunction",
        "authorityPackets.conversationFunction",
        "authority_packets.conversation_function"
      ]
    );
  }

  function readSafetyContext(
    state
  ) {
    return readFirstObject(
      state,
      [
        "safetyContext",
        "safety_context",
        "safetyContextResult",
        "safety_context_result",
        "canonicalSafetyContext",
        "canonical_safety_context",
        "perception.safetyContext",
        "authorityPackets.safety",
        "authority_packets.safety"
      ]
    );
  }

  function readEmotionalContext(
    state
  ) {
    return readFirstObject(
      state,
      [
        "emotionalContext",
        "emotional_context",
        "emotionContext",
        "emotion_context",
        "canonicalEmotionalContext",
        "canonical_emotional_context",
        "perception.emotionalContext",
        "authorityPackets.emotion",
        "authority_packets.emotion"
      ]
    );
  }

  function readConstraintContext(
    state
  ) {
    return readFirstObject(
      state,
      [
        "constraints",
        "constraintContext",
        "constraint_context",
        "canonicalConstraints",
        "canonical_constraints",
        "perception.constraints",
        "authorityPackets.constraints",
        "authority_packets.constraints"
      ]
    );
  }

  function readPlacementEvidence(
    state
  ) {
    return readFirstObject(
      state,
      [
        "placementEvidence",
        "placement_evidence",
        "observerRoutingEvidence",
        "observer_routing_evidence",
        "continuityEvidence",
        "continuity_evidence",
        "structuralEvidence",
        "structural_evidence"
      ]
    ) || {};
  }

  function readReferenceCandidates(
    state
  ) {
    return readFirstArray(
      state,
      [
        "referenceCandidates",
        "reference_candidates",
        "upstreamReferenceCandidates",
        "upstream_reference_candidates",
        "structuralReferenceCandidates",
        "structural_reference_candidates",
        "turnContext.referenceCandidates",
        "turn_context.reference_candidates"
      ]
    );
  }

  /* =====================================================
     AUTHORITY PACKETS
  ===================================================== */

  function buildAuthorityPacket(
    state
  ) {
    const semanticPacket =
      readSemanticPacket(state);

    const conversationFunction =
      readConversationFunction(
        state
      );

    const safetyContext =
      readSafetyContext(state);

    const emotionalContext =
      readEmotionalContext(
        state
      );

    const constraintContext =
      readConstraintContext(
        state
      );

    return {
      semantic: {
        authority:
          UPSTREAM_AUTHORITIES
            .semantic,

        present:
          Boolean(
            semanticPacket
          ),

        packet:
          semanticPacket
            ? safeClone(
                semanticPacket
              )
            : null
      },

      conversationFunction: {
        authority:
          UPSTREAM_AUTHORITIES
            .conversationFunction,

        present:
          Boolean(
            conversationFunction
          ),

        packet:
          conversationFunction
            ? safeClone(
                conversationFunction
              )
            : null
      },

      safety: {
        authority:
          UPSTREAM_AUTHORITIES
            .safety,

        present:
          Boolean(
            safetyContext
          ),

        packet:
          safetyContext
            ? safeClone(
                safetyContext
              )
            : null
      },

      emotion: {
        authority:
          UPSTREAM_AUTHORITIES
            .emotion,

        present:
          Boolean(
            emotionalContext
          ),

        packet:
          emotionalContext
            ? safeClone(
                emotionalContext
              )
            : null
      },

      constraints: {
        authority:
          UPSTREAM_AUTHORITIES
            .constraints,

        present:
          Boolean(
            constraintContext
          ),

        packet:
          constraintContext
            ? safeClone(
                constraintContext
              )
            : null
      }
    };
  }

  /* =====================================================
     AUXILIARY COMMAND EXTRACTION
  ===================================================== */

  function readPendingInteractionCommand(
    state
  ) {
    return firstDefined(
      state.pendingInteractionCommand,
      state.pending_interaction_command,
      state.cosCommands &&
        state.cosCommands
          .pendingInteraction,
      state.cos_commands &&
        state.cos_commands
          .pending_interaction,
      null
    );
  }

  function readArtifactCommand(
    state
  ) {
    return firstDefined(
      state.artifactCommand,
      state.artifact_command,
      state.cosCommands &&
        state.cosCommands.artifact,
      state.cos_commands &&
        state.cos_commands.artifact,
      null
    );
  }

  function readDeliverySequenceCommand(
    state
  ) {
    return firstDefined(
      state.deliverySequenceCommand,
      state.delivery_sequence_command,
      state.cosCommands &&
        state.cosCommands
          .deliverySequence,
      state.cos_commands &&
        state.cos_commands
          .delivery_sequence,
      null
    );
  }

  /* =====================================================
     CONTROLLER INPUT
  ===================================================== */

  function buildControllerInput(
    runtimeState,
    options = {}
  ) {
    const currentTurn =
      readCurrentTurn(
        runtimeState
      );

    const authorityPacket =
      buildAuthorityPacket(
        runtimeState
      );

    const semanticPacket =
      authorityPacket.semantic.packet;

    const conversationFunction =
      authorityPacket
        .conversationFunction
        .packet;

    const safetyContext =
      authorityPacket.safety.packet;

    const emotionalContext =
      authorityPacket.emotion.packet;

    const constraintContext =
      authorityPacket
        .constraints
        .packet;

    const conversationId =
      readConversationId(
        runtimeState,
        currentTurn
      );

    return {
      conversationId,

      state:
        readExistingCosState(
          runtimeState
        ),

      currentTurn,

      history:
        readConversationHistory(
          runtimeState
        ),

      semanticPacket,

      conversationFunction,

      upstreamCandidates:
        readReferenceCandidates(
          runtimeState
        ),

      uiMetadata:
        readFirstObject(
          runtimeState,
          [
            "uiMetadata",
            "ui_metadata",
            "interfaceMetadata",
            "interface_metadata"
          ]
        ) || {},

      pendingInteractionCommand:
        readPendingInteractionCommand(
          runtimeState
        ),

      artifactCommand:
        readArtifactCommand(
          runtimeState
        ),

      deliverySequenceCommand:
        readDeliverySequenceCommand(
          runtimeState
        ),

      placementEvidence:
        readPlacementEvidence(
          runtimeState
        ),

      metadata: {
        sourceStage:
          STAGE_NAME,

        sourceComponent:
          COMPONENT_NAME,

        upstreamAuthorities:
          authorityPacket,

        safetyContext:
          safetyContext
            ? safeClone(
                safetyContext
              )
            : null,

        emotionalContext:
          emotionalContext
            ? safeClone(
                emotionalContext
              )
            : null,

        constraints:
          constraintContext
            ? safeClone(
                constraintContext
              )
            : null,

        runtimeMetadata:
          isObject(
            runtimeState.metadata
          )
            ? safeClone(
                runtimeState.metadata
              )
            : {}
      },

      options: {
        persistence:
          options.persistence !==
          false,

        loadState:
          options.loadState !==
          false,

        saveState:
          options.saveState !==
          false,

        migrateState:
          options.migrateState !==
          false,

        stateSourcePolicy:
          firstNonEmptyString(
            options.stateSourcePolicy,
            options.state_source_policy
          ) ||
          (
            readExistingCosState(
              runtimeState
            )
              ? "prefer_supplied"
              : "prefer_persisted"
          ),

        generateConversationId:
          options
            .generateConversationId !==
          false,

        storageAdapter:
          firstDefined(
            options.storageAdapter,
            options.adapter
          ),

        storageKeyPrefix:
          firstDefined(
            options.storageKeyPrefix,
            options.keyPrefix
          ),

        persistenceOptions:
          isObject(
            options.persistenceOptions
          )
            ? safeClone(
                options.persistenceOptions
              )
            : {},

        strictInstallation:
          options.strictInstallation !==
          false,

        strictRuntimeInstallation:
          options
            .strictRuntimeInstallation !==
          false,

        throwOnFailure: false,

        throwOnRuntimeFailure: false,

        includeRuntimeStageOutputs:
          options
            .includeRuntimeStageOutputs !==
          false,

        includeReferenceDiagnostics:
          options
            .includeReferenceDiagnostics !==
          false,

        freeze: false
      }
    };
  }

  /* =====================================================
     CONTROLLER RESULT VALIDATION
  ===================================================== */

  function validateControllerResult(
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
              "REBIRTH_COS_CONTROLLER_RESULT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      result.authority !==
      COS_AUTHORITY
    ) {
      errors.push({
        code:
          "REBIRTH_COS_CONTROLLER_AUTHORITY_INVALID",

        expected:
          COS_AUTHORITY,

        actual:
          result.authority
      });
    }

    if (
      !isNonEmptyString(
        result.conversationId
      )
    ) {
      errors.push({
        code:
          "REBIRTH_COS_CONVERSATION_ID_MISSING"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.state)
    ) {
      errors.push({
        code:
          "REBIRTH_COS_SUCCESS_STATE_MISSING"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.packet)
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_SUCCESS_PACKET_MISSING"
      });
    }

    if (
      result.state &&
      result.state.authority &&
      result.state.authority !==
        COS_AUTHORITY
    ) {
      errors.push({
        code:
          "REBIRTH_COS_STATE_AUTHORITY_INVALID",

        expected:
          COS_AUTHORITY,

        actual:
          result.state.authority
      });
    }

    if (
      result.referenceResolution &&
      result.referenceResolution
        .authority &&
      result.referenceResolution
        .authority !== COS_AUTHORITY
    ) {
      errors.push({
        code:
          "REBIRTH_COS_REFERENCE_AUTHORITY_INVALID",

        expected:
          COS_AUTHORITY,

        actual:
          result.referenceResolution
            .authority
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

  /* =====================================================
     AUTHORITY PRESERVATION
  ===================================================== */

  function validateAuthorityPreservation(
    beforeState,
    afterState,
    authorityPacket
  ) {
    const errors = [];
    const warnings = [];

    const semanticBefore =
      authorityPacket.semantic.packet;

    const semanticAfter =
      readSemanticPacket(
        afterState
      );

    const conversationFunctionBefore =
      authorityPacket
        .conversationFunction
        .packet;

    const conversationFunctionAfter =
      readConversationFunction(
        afterState
      );

    const safetyBefore =
      authorityPacket.safety.packet;

    const safetyAfter =
      readSafetyContext(
        afterState
      );

    if (
      semanticBefore &&
      semanticAfter &&
      !deepEquivalent(
        semanticBefore,
        semanticAfter
      )
    ) {
      errors.push({
        code:
          "REBIRTH_COS_SEMANTIC_AUTHORITY_OVERWRITE"
      });
    }

    if (
      conversationFunctionBefore &&
      conversationFunctionAfter &&
      !deepEquivalent(
        conversationFunctionBefore,
        conversationFunctionAfter
      )
    ) {
      errors.push({
        code:
          "REBIRTH_COS_CONVERSATION_FUNCTION_OVERWRITE"
      });
    }

    if (
      safetyBefore &&
      safetyAfter &&
      !deepEquivalent(
        safetyBefore,
        safetyAfter
      )
    ) {
      errors.push({
        code:
          "REBIRTH_COS_SAFETY_AUTHORITY_OVERWRITE"
      });
    }

    if (
      !semanticBefore &&
      semanticAfter
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_SEMANTIC_PACKET_APPEARED_AFTER_STAGE"
      });
    }

    if (
      !conversationFunctionBefore &&
      conversationFunctionAfter
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_CONVERSATION_FUNCTION_APPEARED_AFTER_STAGE"
      });
    }

    if (
      !safetyBefore &&
      safetyAfter
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_SAFETY_PACKET_APPEARED_AFTER_STAGE"
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function deepEquivalent(
    left,
    right
  ) {
    try {
      return (
        JSON.stringify(left) ===
        JSON.stringify(right)
      );
    } catch (error) {
      return left === right;
    }
  }

  /* =====================================================
     STATE MERGE
  ===================================================== */

  function mergeCosResultIntoRuntimeState(
    runtimeState,
    controllerResult,
    {
      authorityPacket,
      validation
    }
  ) {
    const next =
      safeClone(
        runtimeState
      );

    const cosState =
      controllerResult &&
      isObject(controllerResult.state)
        ? safeClone(
            controllerResult.state
          )
        : null;

    const cosPacket =
      controllerResult &&
      isObject(controllerResult.packet)
        ? safeClone(
            controllerResult.packet
          )
        : null;

    const placement =
      controllerResult &&
      isObject(
        controllerResult.placement
      )
        ? safeClone(
            controllerResult.placement
          )
        : null;

    const referenceResolution =
      controllerResult &&
      isObject(
        controllerResult
          .referenceResolution
      )
        ? safeClone(
            controllerResult
              .referenceResolution
          )
        : null;

    next.conversationOSState =
      cosState;

    next.conversation_os_state =
      cosState;

    next.cosState =
      cosState;

    next.conversationOSResult =
      safeClone(
        controllerResult
      );

    next.conversation_os_result =
      safeClone(
        controllerResult
      );

    next.cosResult =
      safeClone(
        controllerResult
      );

    next.conversationOSPacket =
      cosPacket;

    next.conversation_os_packet =
      cosPacket;

    next.cosPacket =
      cosPacket;

    next.conversationPlacement =
      placement;

    next.conversation_placement =
      placement;

    next.cosPlacement =
      placement;

    next.referenceResolution =
      referenceResolution;

    next.reference_resolution =
      referenceResolution;

    next.cosReferenceResolution =
      referenceResolution;

    next.activeConversationThreadId =
      firstNonEmptyString(
        cosState &&
          cosState.activeThreadId,
        placement &&
          placement.threadId,
        placement &&
          placement.thread_id
      ) || null;

    next.activeConversationTurnId =
      firstNonEmptyString(
        cosState &&
          cosState.activeTurnId,
        controllerResult &&
          controllerResult
            .currentTurnId
      ) || null;

    next.conversationContinuity = {
      authority:
        COS_AUTHORITY,

      conversationId:
        controllerResult
          .conversationId,

      activeThreadId:
        next.activeConversationThreadId,

      activeTurnId:
        next.activeConversationTurnId,

      placement,

      referenceResolution,

      pendingInteraction:
        cosState &&
        cosState
          .pendingInteractionState
          ? safeClone(
              cosState
                .pendingInteractionState
            )
          : null,

      artifactState:
        cosState &&
        cosState.artifactState
          ? safeClone(
              cosState.artifactState
            )
          : null,

      deliverySequenceState:
        cosState &&
        cosState
          .deliverySequenceState
          ? safeClone(
              cosState
                .deliverySequenceState
            )
          : null
    };

    next.conversation_continuity =
      safeClone(
        next.conversationContinuity
      );

    next.authorityPackets =
      isObject(next.authorityPackets)
        ? next.authorityPackets
        : {};

    next.authorityPackets
      .conversationOS = {
        authority:
          COS_AUTHORITY,

        result:
          safeClone(
            controllerResult
          ),

        packet:
          cosPacket,

        placement,

        referenceResolution
      };

    next.authorityPackets
      .conversation_os =
      next.authorityPackets
        .conversationOS;

    next.integrationDiagnostics =
      isObject(
        next.integrationDiagnostics
      )
        ? next.integrationDiagnostics
        : {};

    next.integrationDiagnostics[
      STAGE_NAME
    ] = {
      valid:
        validation.valid,

      errors:
        safeClone(
          validation.errors
        ),

      warnings:
        safeClone(
          validation.warnings
        ),

      authorityPacket:
        safeClone(
          authorityPacket
        ),

      completedAt:
        nowIso()
    };

    next.activeIntegrationStage =
      STAGE_NAME;

    next.updatedAt =
      nowIso();

    return next;
  }

  /* =====================================================
     PUBLIC EXECUTION
  ===================================================== */

  async function run(
    runtimeState = {},
    runtime = {}
  ) {
    const startedAt =
      monotonicNow();

    const state =
      isObject(runtimeState)
        ? safeClone(
            runtimeState
          )
        : {};

    const options =
      isObject(runtime)
        ? runtime
        : {};

    const mark =
      isFunction(options.mark)
        ? options.mark
        : () => {};

    const throwOnFailure =
      options.throwOnFailure ===
      true;

    const freeze =
      options.freeze === true;

    const authorityPacket =
      buildAuthorityPacket(
        state
      );

    let controllerInput;
    let controllerResult;
    let controllerValidation;
    let authorityValidation;
    let mergedState;

    try {
      mark(
        "beforeConversationOSStage"
      );

      controllerInput =
        buildControllerInput(
          state,
          options
        );

      const controller =
        resolveController(
          options.controller
        );

      const execute =
        resolveControllerCallable(
          controller
        );

      mark(
        "beforeConversationOSController"
      );

      controllerResult =
        await execute(
          controllerInput,
          {
            ...options,

            components:
              isObject(
                options.cosComponents
              )
                ? options.cosComponents
                : isObject(
                    options.components
                  )
                  ? options.components
                  : {},

            persistence:
              options.persistence !==
              false,

            loadState:
              options.loadState !==
              false,

            saveState:
              options.saveState !==
              false,

            migrateState:
              options.migrateState !==
              false,

            stateSourcePolicy:
              firstNonEmptyString(
                options
                  .stateSourcePolicy,
                options
                  .state_source_policy
              ) ||
              controllerInput.options
                .stateSourcePolicy,

            storageAdapter:
              firstDefined(
                options.storageAdapter,
                options.adapter
              ),

            storageKeyPrefix:
              firstDefined(
                options
                  .storageKeyPrefix,
                options.keyPrefix
              ),

            persistenceOptions:
              isObject(
                options
                  .persistenceOptions
              )
                ? options
                    .persistenceOptions
                : {},

            strictInstallation:
              options
                .strictInstallation !==
              false,

            strictRuntimeInstallation:
              options
                .strictRuntimeInstallation !==
              false,

            throwOnFailure: false,

            throwOnRuntimeFailure:
              false,

            includeRuntimeStageOutputs:
              options
                .includeRuntimeStageOutputs !==
              false,

            includeReferenceDiagnostics:
              options
                .includeReferenceDiagnostics !==
              false,

            freeze: false
          }
        );

      mark(
        "afterConversationOSController"
      );

      controllerValidation =
        validateControllerResult(
          controllerResult
        );

      if (
        !controllerValidation.valid
      ) {
        throw new RebirthConversationOSStageError(
          "REBIRTH_COS_CONTROLLER_RESULT_INVALID",
          "Conversation Operating System controller result failed integration validation.",
          {
            details:
              controllerValidation
          }
        );
      }

      mergedState =
        mergeCosResultIntoRuntimeState(
          state,
          controllerResult,
          {
            authorityPacket,
            validation:
              controllerValidation
          }
        );

      authorityValidation =
        validateAuthorityPreservation(
          state,
          mergedState,
          authorityPacket
        );

      if (
        !authorityValidation.valid
      ) {
        throw new RebirthConversationOSStageError(
          "REBIRTH_COS_AUTHORITY_BOUNDARY_VIOLATION",
          "Conversation Operating System integration altered an upstream authority packet.",
          {
            details:
              authorityValidation
          }
        );
      }

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].authorityValidation =
        safeClone(
          authorityValidation
        );

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].durationMs =
        elapsedMilliseconds(
          startedAt
        );

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].controllerOk =
        controllerResult.ok ===
        true;

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].stateLoaded =
        controllerResult
          .stateLoaded === true;

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].stateMigrated =
        controllerResult
          .stateMigrated === true;

      mergedState
        .integrationDiagnostics[
          STAGE_NAME
        ].stateSaved =
        controllerResult
          .stateSaved === true;

      mark(
        "afterConversationOSStage"
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

        stage:
          STAGE_NAME,

        resultType:
          RESULT_TYPE,

        ok:
          controllerResult.ok ===
          true,

        state:
          mergedState,

        controllerResult:
          safeClone(
            controllerResult
          ),

        conversationOSState:
          controllerResult.state
            ? safeClone(
                controllerResult.state
              )
            : null,

        conversationOSPacket:
          controllerResult.packet
            ? safeClone(
                controllerResult.packet
              )
            : null,

        placement:
          controllerResult.placement
            ? safeClone(
                controllerResult.placement
              )
            : null,

        referenceResolution:
          controllerResult
            .referenceResolution
            ? safeClone(
                controllerResult
                  .referenceResolution
              )
            : null,

        upstreamAuthorities:
          safeClone(
            authorityPacket
          ),

        validation: {
          controller:
            safeClone(
              controllerValidation
            ),

          authority:
            safeClone(
              authorityValidation
            )
        },

        durationMs:
          elapsedMilliseconds(
            startedAt
          ),

        completedAt:
          nowIso(),

        errors:
          Array.isArray(
            controllerResult.errors
          )
            ? safeClone(
                controllerResult.errors
              )
            : []
      };

      return freeze
        ? freezeClone(result)
        : result;
    } catch (error) {
      mark(
        "conversationOSStageFailed"
      );

      if (throwOnFailure) {
        throw error;
      }

      const normalizedError =
        safeError(error);

      const fallbackState =
        safeClone(state);

      fallbackState
        .integrationDiagnostics =
        isObject(
          fallbackState
            .integrationDiagnostics
        )
          ? fallbackState
              .integrationDiagnostics
          : {};

      fallbackState
        .integrationDiagnostics[
          STAGE_NAME
        ] = {
          valid: false,

          error:
            normalizedError,

          controllerInput:
            controllerInput
              ? safeClone(
                  controllerInput
                )
              : null,

          controllerResult:
            controllerResult
              ? safeClone(
                  controllerResult
                )
              : null,

          durationMs:
            elapsedMilliseconds(
              startedAt
            ),

          completedAt:
            nowIso()
        };

      fallbackState
        .activeIntegrationStage =
        STAGE_NAME;

      const failureResult = {
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        stage:
          STAGE_NAME,

        resultType:
          RESULT_TYPE,

        ok: false,

        state:
          fallbackState,

        controllerResult:
          controllerResult
            ? safeClone(
                controllerResult
              )
            : null,

        conversationOSState:
          controllerResult &&
          controllerResult.state
            ? safeClone(
                controllerResult.state
              )
            : readExistingCosState(
                state
              )
              ? safeClone(
                  readExistingCosState(
                    state
                  )
                )
              : null,

        conversationOSPacket:
          controllerResult &&
          controllerResult.packet
            ? safeClone(
                controllerResult.packet
              )
            : null,

        placement:
          controllerResult &&
          controllerResult.placement
            ? safeClone(
                controllerResult
                  .placement
              )
            : null,

        referenceResolution:
          controllerResult &&
          controllerResult
            .referenceResolution
            ? safeClone(
                controllerResult
                  .referenceResolution
              )
            : null,

        upstreamAuthorities:
          safeClone(
            authorityPacket
          ),

        validation: {
          controller:
            controllerValidation
              ? safeClone(
                  controllerValidation
                )
              : null,

          authority:
            authorityValidation
              ? safeClone(
                  authorityValidation
                )
              : null
        },

        durationMs:
          elapsedMilliseconds(
            startedAt
          ),

        completedAt:
          nowIso(),

        errors: [
          normalizedError
        ]
      };

      return freeze
        ? freezeClone(
            failureResult
          )
        : failureResult;
    }
  }

  /* =====================================================
     STATE-ONLY EXECUTION
  ===================================================== */

  async function apply(
    runtimeState = {},
    runtime = {}
  ) {
    const result =
      await run(
        runtimeState,
        runtime
      );

    return result.state;
  }

  async function execute(
    runtimeState = {},
    runtime = {}
  ) {
    return run(
      runtimeState,
      runtime
    );
  }

  async function process(
    runtimeState = {},
    runtime = {}
  ) {
    return run(
      runtimeState,
      runtime
    );
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    options = {}
  ) {
    const controller =
      resolveController(
        options.controller
      );

    const controllerAvailable =
      Boolean(controller);

    let controllerHealth = null;
    let controllerError = null;

    if (
      controller &&
      isFunction(
        controller.health
      )
    ) {
      try {
        controllerHealth =
          controller.health(
            isObject(
              options.components
            )
              ? options.components
              : {},
            options
          );
      } catch (error) {
        controllerError =
          safeError(error);
      }
    }

    const ready =
      controllerAvailable &&
      !controllerError &&
      (
        !controllerHealth ||
        controllerHealth.ok !== false
      );

    return {
      ok: ready,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      stage:
        STAGE_NAME,

      status:
        ready
          ? "ready"
          : "not_ready",

      controller: {
        available:
          controllerAvailable,

        version:
          controller &&
          firstNonEmptyString(
            controller.version,
            controller.VERSION
          ),

        authority:
          controller &&
          firstNonEmptyString(
            controller.authority,
            controller.AUTHORITY
          )
      },

      controllerHealth,

      errors:
        controllerError
          ? [controllerError]
          : [],

      checkedAt:
        nowIso()
    };
  }

  function assertReady(
    options = {}
  ) {
    const report =
      health(options);

    if (!report.ok) {
      throw new RebirthConversationOSStageError(
        "REBIRTH_COS_STAGE_NOT_READY",
        "Rebirth Conversation OS integration stage is not ready.",
        {
          details:
            report
        }
      );
    }

    return report;
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const rebirthConversationOSStage = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    stage:
      STAGE_NAME,

    resultType:
      RESULT_TYPE,

    cosAuthority:
      COS_AUTHORITY,

    upstreamAuthorities:
      UPSTREAM_AUTHORITIES,

    RebirthConversationOSStageError,

    run,

    execute,

    process,

    apply,

    health,

    assertReady,

    buildControllerInput,

    buildAuthorityPacket,

    validateControllerResult,

    validateAuthorityPreservation,

    mergeCosResultIntoRuntimeState,

    readCurrentTurn,

    readConversationHistory,

    readExistingCosState,

    readConversationId,

    readSemanticPacket,

    readConversationFunction,

    readSafetyContext,

    readEmotionalContext,

    readConstraintContext,

    readPlacementEvidence,

    readReferenceCandidates
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  Integration.conversationOSStage =
    rebirthConversationOSStage;

  Integration.cosStage =
    rebirthConversationOSStage;

  Integration.rebirthConversationOSStage =
    rebirthConversationOSStage;

  root.AriRebirthConversationOSStage =
    rebirthConversationOSStage;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      rebirthConversationOSStage;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);