// rebirth/conversation-os/core/cos-runtime.js
// ARI Rebirth — Conversation Operating System Runtime
//
// Purpose:
// Execute the complete deterministic Conversation Operating System pipeline
// for one registered conversation turn.
//
// V2.0.0 — Expanded Canonical COS Runtime Integration
//
// Canonical execution flow:
//
// Runtime Input
//      ↓
// Contract Validation
//      ↓
// State Normalization
//      ↓
// History Index Construction
//      ↓
// Current-Turn Registration
//      ↓
// Pending Interaction Transition
//      ↓
// Artifact Transition
//      ↓
// Delivery Sequence Transition
//      ↓
// Reference Candidate Construction
//      ↓
// Reference Adjudication
//      ↓
// Canonical Reference Resolution
//      ↓
// Placement Determination
//      ↓
// Thread-State Transition
//      ↓
// Placement Validation
//      ↓
// Packet Construction
//      ↓
// Final State Validation
//      ↓
// Canonical COS Runtime Result
//
// Authority:
//
// This component is authoritative only for:
//
// - executing COS components in canonical order,
// - carrying canonical state between COS stages,
// - preserving stage outputs,
// - enforcing required stage availability,
// - validating stage boundaries,
// - collecting deterministic diagnostics,
// - returning the final COS packet and state.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret raw user language,
// - independently infer semantic meaning,
// - independently classify intent,
// - independently classify conversation function,
// - independently infer emotion,
// - independently infer safety severity,
// - independently resolve references,
// - independently determine placement,
// - independently generate thread relationships,
// - independently generate responses.
//
// Architectural rule:
//
// The runtime orchestrates authorities.
// It does not replace them.
//
// Each stage may only make decisions within its declared authority.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.runtime
//
// CommonJS:
//
// module.exports = cosRuntime

(function initializeCosRuntime(globalScope) {
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
    "cos-runtime";

  const RUNTIME_RESULT_TYPE =
    "conversation_operating_system_runtime_result";

  const STAGE_NAMES = Object.freeze([
    "contract_validation",
    "state_normalization",
    "history_indexing",
    "turn_registration",
    "pending_interaction_transition",
    "artifact_transition",
    "delivery_sequence_transition",
    "reference_candidate_construction",
    "reference_adjudication",
    "reference_resolution",
    "placement",
    "thread_state_transition",
    "placement_validation",
    "packet_construction",
    "final_state_validation"
  ]);

  const REQUIRED_COMPONENTS = Object.freeze([
    "contract",
    "state",
    "historyIndex",
    "turnRegister",
    "pendingInteractionManager",
    "artifactRegister",
    "deliverySequenceManager",
    "referenceCandidateBuilder",
    "referenceAdjudicator",
    "referenceResolver",
    "placementEngine",
    "threadStateManager",
    "placementValidator",
    "packetBuilder"
  ]);

  const AUXILIARY_COMMAND_NAMES = Object.freeze({
    pendingInteraction:
      "pendingInteractionCommand",

    artifact:
      "artifactCommand",

    deliverySequence:
      "deliverySequenceCommand"
  });

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosRuntimeError extends Error {
    constructor(
      code,
      message,
      {
        stage = null,
        details = null,
        cause = null,
        recoverable = false
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS runtime error"
      );

      this.name =
        "CosRuntimeError";

      this.code =
        code ||
        "COS_RUNTIME_ERROR";

      this.stage =
        stage || null;

      this.details =
        details;

      this.cause =
        cause;

      this.recoverable =
        recoverable === true;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          CosRuntimeError
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
          "COS_RUNTIME_ERROR",

        message:
          error.message ||
          "Unknown COS runtime error",

        stage:
          firstNonEmptyString(
            error.stage
          ) || null,

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
        "COS_RUNTIME_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown COS runtime error",

      stage: null,

      recoverable: false,

      details:
        safeClone(error),

      cause: null
    };
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveFromNamespace(
    aliases = []
  ) {
    const namespaces = [
      ConversationOS,
      ConversationOS.core,
      ConversationOS.indexing,
      ConversationOS.turns,
      ConversationOS.interactions,
      ConversationOS.artifacts,
      ConversationOS.sequences,
      ConversationOS.references,
      ConversationOS.placement,
      ConversationOS.threads,
      ConversationOS.validation,
      ConversationOS.packets,
      ConversationOS.components,
      root.Ari.Rebirth,
      root.Ari,
      root
    ].filter(Boolean);

    for (
      const namespace of
        namespaces
    ) {
      for (
        const alias of aliases
      ) {
        if (namespace[alias]) {
          return namespace[alias];
        }
      }
    }

    return null;
  }

  function resolveComponents(
    overrides = {}
  ) {
    return {
      contract:
        overrides.contract ||
        resolveFromNamespace([
          "contract",
          "cosContract",
          "AriCosContract"
        ]),

      state:
        overrides.state ||
        resolveFromNamespace([
          "state",
          "cosState",
          "AriCosState"
        ]),

      historyIndex:
        overrides.historyIndex ||
        resolveFromNamespace([
          "historyIndex",
          "historyIndexer",
          "cosHistoryIndex",
          "AriCosHistoryIndex"
        ]),

      turnRegister:
        overrides.turnRegister ||
        resolveFromNamespace([
          "turnRegister",
          "currentTurnRegister",
          "cosTurnRegister",
          "AriCosTurnRegister"
        ]),

      pendingInteractionManager:
        overrides
          .pendingInteractionManager ||
        resolveFromNamespace([
          "pendingInteractionManager",
          "cosPendingInteractionManager",
          "AriCosPendingInteractionManager"
        ]),

      artifactRegister:
        overrides.artifactRegister ||
        resolveFromNamespace([
          "artifactRegister",
          "cosArtifactRegister",
          "AriCosArtifactRegister"
        ]),

      deliverySequenceManager:
        overrides
          .deliverySequenceManager ||
        resolveFromNamespace([
          "deliverySequenceManager",
          "cosDeliverySequenceManager",
          "AriCosDeliverySequenceManager"
        ]),

      referenceCandidateBuilder:
        overrides
          .referenceCandidateBuilder ||
        resolveFromNamespace([
          "referenceCandidateBuilder",
          "cosReferenceCandidateBuilder",
          "AriCosReferenceCandidateBuilder"
        ]),

      referenceAdjudicator:
        overrides
          .referenceAdjudicator ||
        resolveFromNamespace([
          "referenceAdjudicator",
          "cosReferenceAdjudicator",
          "AriCosReferenceAdjudicator"
        ]),

      referenceResolver:
        overrides.referenceResolver ||
        resolveFromNamespace([
          "referenceResolver",
          "cosReferenceResolver",
          "AriCosReferenceResolver"
        ]),

      placementEngine:
        overrides.placementEngine ||
        resolveFromNamespace([
          "placementEngine",
          "conversationPlacementEngine",
          "cosPlacementEngine",
          "AriCosPlacementEngine"
        ]),

      threadStateManager:
        overrides.threadStateManager ||
        resolveFromNamespace([
          "threadStateManager",
          "cosThreadStateManager",
          "AriCosThreadStateManager"
        ]),

      placementValidator:
        overrides.placementValidator ||
        resolveFromNamespace([
          "placementValidator",
          "cosPlacementValidator",
          "AriCosPlacementValidator"
        ]),

      packetBuilder:
        overrides.packetBuilder ||
        resolveFromNamespace([
          "packetBuilder",
          "cosPacketBuilder",
          "AriCosPacketBuilder"
        ])
    };
  }

  function assertComponents(
    components
  ) {
    const missing = [];

    for (
      const componentName of
        REQUIRED_COMPONENTS
    ) {
      if (
        !components[
          componentName
        ]
      ) {
        missing.push(
          componentName
        );
      }
    }

    if (missing.length > 0) {
      throw new CosRuntimeError(
        "COS_RUNTIME_COMPONENTS_MISSING",
        "Required Conversation Operating System components are missing.",
        {
          stage:
            "component_resolution",

          details: {
            missing
          }
        }
      );
    }

    return true;
  }

  function resolveCallable(
    component,
    methodNames,
    componentName
  ) {
    if (isFunction(component)) {
      return component.bind(
        component
      );
    }

    if (component) {
      for (
        const methodName of
          methodNames
      ) {
        if (
          isFunction(
            component[
              methodName
            ]
          )
        ) {
          return component[
            methodName
          ].bind(component);
        }
      }
    }

    throw new CosRuntimeError(
      "COS_RUNTIME_COMPONENT_NOT_CALLABLE",
      `COS component is not callable: ${componentName}`,
      {
        stage:
          "component_resolution",

        details: {
          componentName,
          methodNames
        }
      }
    );
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeRuntimeInput(
    rawInput = {}
  ) {
    const source =
      isObject(rawInput)
        ? rawInput
        : {
            currentTurn:
              rawInput
          };

    const runtimeOptions =
      isObject(source.options)
        ? safeClone(
            source.options
          )
        : {};

    const state =
      firstDefined(
        source.state,
        source.cosState,
        source.cos_state,
        {}
      );

    const history =
      firstDefined(
        source.history,
        source.conversationHistory,
        source.conversation_history,
        []
      );

    const currentTurn =
      firstDefined(
        source.currentTurn,
        source.current_turn,
        source.turn,
        source.message,
        {}
      );

    return {
      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state &&
            state.conversationId,
          state &&
            state.conversation_id
        ) || null,

      state:
        isObject(state)
          ? safeClone(state)
          : {},

      history:
        Array.isArray(history)
          ? safeClone(history)
          : [],

      currentTurn:
        isObject(currentTurn)
          ? safeClone(currentTurn)
          : {
              text:
                currentTurn === null ||
                currentTurn === undefined
                  ? ""
                  : String(
                      currentTurn
                    )
            },

      semanticPacket:
        isObject(
          source.semanticPacket
        )
          ? safeClone(
              source.semanticPacket
            )
          : isObject(
              source.semantic_packet
            )
            ? safeClone(
                source.semantic_packet
              )
            : null,

      conversationFunction:
        isObject(
          source.conversationFunction
        )
          ? safeClone(
              source.conversationFunction
            )
          : isObject(
              source.conversation_function
            )
            ? safeClone(
                source.conversation_function
              )
            : null,

      upstreamCandidates:
        Array.isArray(
          source.upstreamCandidates
        )
          ? safeClone(
              source.upstreamCandidates
            )
          : Array.isArray(
              source.upstream_candidates
            )
            ? safeClone(
                source.upstream_candidates
              )
            : Array.isArray(
                source.referenceCandidates
              )
              ? safeClone(
                  source.referenceCandidates
                )
              : [],

      uiMetadata:
        isObject(source.uiMetadata)
          ? safeClone(
              source.uiMetadata
            )
          : isObject(
              source.ui_metadata
            )
            ? safeClone(
                source.ui_metadata
              )
            : {},

      pendingInteractionCommand:
        normalizeOptionalCommand(
          firstDefined(
            source
              .pendingInteractionCommand,
            source
              .pending_interaction_command,
            source.commands &&
              source.commands
                .pendingInteraction,
            source.commands &&
              source.commands
                .pending_interaction,
            null
          )
        ),

      artifactCommand:
        normalizeOptionalCommand(
          firstDefined(
            source.artifactCommand,
            source.artifact_command,
            source.commands &&
              source.commands.artifact,
            null
          )
        ),

      deliverySequenceCommand:
        normalizeOptionalCommand(
          firstDefined(
            source
              .deliverySequenceCommand,
            source
              .delivery_sequence_command,
            source.commands &&
              source.commands
                .deliverySequence,
            source.commands &&
              source.commands
                .delivery_sequence,
            null
          )
        ),

      placementEvidence:
        isObject(
          source.placementEvidence
        )
          ? safeClone(
              source.placementEvidence
            )
          : isObject(
              source.placement_evidence
            )
            ? safeClone(
                source.placement_evidence
              )
            : {},

      metadata:
        isObject(source.metadata)
          ? safeClone(
              source.metadata
            )
          : {},

      options:
        runtimeOptions
    };
  }

  function normalizeOptionalCommand(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === false
    ) {
      return null;
    }

    if (isNonEmptyString(value)) {
      return {
        type:
          value.trim()
      };
    }

    return isObject(value)
      ? safeClone(value)
      : null;
  }

  function readCurrentTurnId(
    turn
  ) {
    return firstNonEmptyString(
      turn &&
        turn.turnId,
      turn &&
        turn.turn_id,
      turn &&
        turn.id,
      turn &&
        turn.messageId,
      turn &&
        turn.message_id
    );
  }

  /* =====================================================
     DIAGNOSTIC RECORDER
  ===================================================== */

  function createDiagnostics() {
    return {
      stages: [],
      warnings: [],
      errors: [],
      startedAt:
        nowIso(),
      completedAt: null,
      durationMs: 0
    };
  }

  function recordStage(
    diagnostics,
    {
      stage,
      startedAt,
      status = "completed",
      output = null,
      warnings = [],
      metadata = {}
    }
  ) {
    diagnostics.stages.push({
      stage,

      status,

      durationMs:
        elapsedMilliseconds(
          startedAt
        ),

      warningCount:
        Array.isArray(warnings)
          ? warnings.length
          : 0,

      warnings:
        Array.isArray(warnings)
          ? safeClone(warnings)
          : [],

      outputSummary:
        summarizeStageOutput(
          stage,
          output
        ),

      metadata:
        isObject(metadata)
          ? safeClone(metadata)
          : {}
    });

    if (
      Array.isArray(warnings) &&
      warnings.length > 0
    ) {
      diagnostics.warnings.push(
        ...warnings.map(
          (warning) => ({
            stage,
            ...safeClone(warning)
          })
        )
      );
    }
  }

  function summarizeStageOutput(
    stage,
    output
  ) {
    if (!isObject(output)) {
      return output === null ||
        output === undefined
        ? null
        : {
            type:
              typeof output
          };
    }

    switch (stage) {
      case "state_normalization":
        return {
          conversationId:
            output.conversationId ||
            null,

          revision:
            output.revision,

          turnCount:
            output.turns
              ? Object.keys(
                  output.turns
                ).length
              : 0,

          threadCount:
            output.threads
              ? Object.keys(
                  output.threads
                ).length
              : 0
        };

      case "history_indexing":
        return {
          count:
            output.count || 0,

          threadCount:
            output.byThreadId
              ? Object.keys(
                  output.byThreadId
                ).length
              : 0,

          warningCount:
            output.diagnostics &&
            output.diagnostics
              .warningCount
              ? output.diagnostics
                  .warningCount
              : 0
        };

      case "turn_registration":
        return {
          turnId:
            firstNonEmptyString(
              output.turnId,
              output.currentTurnId,
              output.turn &&
                output.turn.turnId
            ),

          role:
            firstNonEmptyString(
              output.role,
              output.turn &&
                output.turn.role
            )
        };

      case "reference_candidate_construction":
        return {
          candidateCount:
            output.candidateCount ||
            0,

          validCandidateCount:
            output
              .validCandidateCount ||
            0,

          invalidCandidateCount:
            output
              .invalidCandidateCount ||
            0
        };

      case "reference_adjudication":
        return {
          status:
            output.status || null,

          resolutionMode:
            output.resolutionMode ||
            null,

          selectedCandidateCount:
            output
              .selectedCandidateCount ||
            0
        };

      case "reference_resolution":
        return {
          status:
            output.status || null,

          resolvedTurnIds:
            Array.isArray(
              output.resolvedTurnIds
            )
              ? output.resolvedTurnIds
              : [],

          primaryTurnId:
            output.primaryTurnId ||
            null
        };

      case "placement":
        return {
          placementType:
            firstNonEmptyString(
              output.placementType,
              output.type
            ),

          threadId:
            output.threadId ||
            null,

          parentTurnId:
            output.parentTurnId ||
            null
        };

      case "thread_state_transition":
        return {
          activeThreadId:
            output.state &&
            output.state.activeThreadId
              ? output.state
                  .activeThreadId
              : output.activeThreadId ||
                null,

          activeTurnId:
            output.state &&
            output.state.activeTurnId
              ? output.state
                  .activeTurnId
              : output.activeTurnId ||
                null
        };

      case "packet_construction":
        return {
          packetType:
            firstNonEmptyString(
              output.packetType,
              output.type
            ),

          currentTurnId:
            output.currentTurnId ||
            null,

          threadId:
            output.threadId ||
            null
        };

      default:
        return {
          component:
            output.component ||
            null,

          status:
            output.status ||
            null
        };
    }
  }

  /* =====================================================
     GENERIC STAGE EXECUTION
  ===================================================== */

  async function executeStage(
    diagnostics,
    stage,
    operation
  ) {
    const startedAt =
      monotonicNow();

    try {
      const output =
        await operation();

      const warnings =
        extractWarnings(
          output
        );

      recordStage(
        diagnostics,
        {
          stage,
          startedAt,
          status:
            "completed",
          output,
          warnings
        }
      );

      return output;
    } catch (error) {
      const wrapped =
        error instanceof
        CosRuntimeError
          ? error
          : new CosRuntimeError(
              "COS_RUNTIME_STAGE_FAILED",
              `COS runtime stage failed: ${stage}`,
              {
                stage,
                cause: error,
                details: {
                  originalError:
                    safeError(error)
                }
              }
            );

      diagnostics.errors.push(
        safeError(wrapped)
      );

      recordStage(
        diagnostics,
        {
          stage,
          startedAt,
          status:
            "failed",
          output: null,
          warnings: [],
          metadata: {
            error:
              safeError(wrapped)
          }
        }
      );

      throw wrapped;
    }
  }

  function extractWarnings(
    output
  ) {
    if (!isObject(output)) {
      return [];
    }

    if (
      Array.isArray(
        output.warnings
      )
    ) {
      return output.warnings;
    }

    if (
      output.diagnostics &&
      Array.isArray(
        output.diagnostics.warnings
      )
    ) {
      return output.diagnostics
        .warnings;
    }

    if (
      output.validation &&
      Array.isArray(
        output.validation.warnings
      )
    ) {
      return output.validation
        .warnings;
    }

    return [];
  }

  /* =====================================================
     CONTRACT VALIDATION
  ===================================================== */

  async function validateContract(
    component,
    input,
    options
  ) {
    const validate =
      resolveCallable(
        component,
        [
          "validateInput",
          "validate",
          "assertInput",
          "assert",
          "run"
        ],
        "cos-contract"
      );

    const result =
      await validate(
        input,
        {
          ...options,
          freeze: false
        }
      );

    if (result === false) {
      throw new CosRuntimeError(
        "COS_RUNTIME_CONTRACT_REJECTED",
        "COS runtime input failed contract validation.",
        {
          stage:
            "contract_validation"
        }
      );
    }

    if (
      isObject(result) &&
      result.valid === false
    ) {
      throw new CosRuntimeError(
        "COS_RUNTIME_CONTRACT_INVALID",
        "COS runtime input failed contract validation.",
        {
          stage:
            "contract_validation",

          details:
            result
        }
      );
    }

    return isObject(result)
      ? result
      : {
          valid: true
        };
  }

  /* =====================================================
     STATE NORMALIZATION
  ===================================================== */

  async function normalizeState(
    component,
    input
  ) {
    const normalize =
      resolveCallable(
        component,
        [
          "normalize",
          "normalizeState",
          "create",
          "initialize",
          "createInitialState"
        ],
        "cos-state"
      );

    const hasSuppliedState =
      isObject(input.state) &&
      Object.keys(
        input.state
      ).length > 0;

    const result =
      hasSuppliedState
        ? await normalize(
            input.state,
            {
              conversationId:
                input.conversationId,

              freeze: false
            }
          )
        : await normalize(
            {
              conversationId:
                input.conversationId
            },
            {
              conversationId:
                input.conversationId,

              freeze: false
            }
          );

    if (!isObject(result)) {
      throw new CosRuntimeError(
        "COS_RUNTIME_STATE_NORMALIZATION_INVALID",
        "COS state component returned an invalid state.",
        {
          stage:
            "state_normalization"
        }
      );
    }

    return safeClone(result);
  }

  /* =====================================================
     HISTORY INDEX
  ===================================================== */

  async function buildHistoryIndex(
    component,
    {
      input,
      state,
      options
    }
  ) {
    const build =
      resolveCallable(
        component,
        [
          "build",
          "index",
          "create",
          "createIndex",
          "run"
        ],
        "cos-history-index"
      );

    const history =
      mergeHistoryWithState(
        input.history,
        state
      );

    return await build(
      {
        conversationId:
          input.conversationId,

        history,

        state,

        strict:
          firstDefined(
            options.strictHistory,
            input.options
              .strictHistory
          ) !== false,

        freeze: false
      },
      {
        strict:
          firstDefined(
            options.strictHistory,
            input.options
              .strictHistory
          ) !== false,

        freeze: false
      }
    );
  }

  function mergeHistoryWithState(
    history,
    state
  ) {
    const supplied =
      Array.isArray(history)
        ? safeClone(history)
        : [];

    const seen = new Set();

    for (const turn of supplied) {
      const turnId =
        readCurrentTurnId(turn);

      if (turnId) {
        seen.add(turnId);
      }
    }

    if (
      state &&
      isObject(state.turns)
    ) {
      const stateTurns =
        Object.values(
          state.turns
        )
          .filter(isObject)
          .sort(
            (left, right) => {
              const leftSequence =
                normalizeInteger(
                  left.sequence,
                  0
                );

              const rightSequence =
                normalizeInteger(
                  right.sequence,
                  0
                );

              if (
                leftSequence !==
                rightSequence
              ) {
                return (
                  leftSequence -
                  rightSequence
                );
              }

              return String(
                left.turnId || ""
              ).localeCompare(
                String(
                  right.turnId || ""
                )
              );
            }
          );

      for (
        const stateTurn of
          stateTurns
      ) {
        const turnId =
          readCurrentTurnId(
            stateTurn
          );

        if (
          turnId &&
          !seen.has(turnId)
        ) {
          supplied.push(
            safeClone(stateTurn)
          );

          seen.add(turnId);
        }
      }
    }

    return supplied;
  }

  /* =====================================================
     TURN REGISTRATION
  ===================================================== */

  async function registerCurrentTurn(
    component,
    {
      input,
      state,
      historyIndex,
      options
    }
  ) {
    const register =
      resolveCallable(
        component,
        [
          "register",
          "registerTurn",
          "create",
          "run"
        ],
        "cos-turn-register"
      );

    const result =
      await register(
        {
          conversationId:
            input.conversationId,

          currentTurn:
            input.currentTurn,

          turn:
            input.currentTurn,

          history:
            input.history,

          historyIndex,

          state,

          metadata:
            input.metadata,

          semanticPacket:
            input.semanticPacket,

          conversationFunction:
            input.conversationFunction
        },
        {
          ...options,
          freeze: false
        }
      );

    return normalizeTurnRegistrationResult(
      result,
      state
    );
  }

  function normalizeTurnRegistrationResult(
    result,
    priorState
  ) {
    if (!isObject(result)) {
      throw new CosRuntimeError(
        "COS_RUNTIME_TURN_REGISTRATION_INVALID",
        "Turn register returned an invalid result.",
        {
          stage:
            "turn_registration"
        }
      );
    }

    const registeredTurn =
      isObject(result.turn)
        ? result.turn
        : isObject(
            result.currentTurn
          )
          ? result.currentTurn
          : (
              readCurrentTurnId(result)
                ? result
                : null
            );

    if (!registeredTurn) {
      throw new CosRuntimeError(
        "COS_RUNTIME_REGISTERED_TURN_MISSING",
        "Turn register did not return a registered current turn.",
        {
          stage:
            "turn_registration",

          details:
            result
        }
      );
    }

    const currentTurnId =
      readCurrentTurnId(
        registeredTurn
      );

    if (!currentTurnId) {
      throw new CosRuntimeError(
        "COS_RUNTIME_REGISTERED_TURN_ID_MISSING",
        "Registered current turn is missing its canonical turn ID.",
        {
          stage:
            "turn_registration"
        }
      );
    }

    let nextState =
      isObject(result.state)
        ? safeClone(result.state)
        : safeClone(priorState);

    if (!isObject(nextState.turns)) {
      nextState.turns = {};
    }

    nextState.turns[
      currentTurnId
    ] = safeClone(
      registeredTurn
    );

    nextState.activeTurnId =
      currentTurnId;

    return {
      ...safeClone(result),

      turn:
        safeClone(
          registeredTurn
        ),

      currentTurn:
        safeClone(
          registeredTurn
        ),

      currentTurnId,

      state:
        nextState
    };
  }

  /* =====================================================
     AUXILIARY TRANSITIONS
  ===================================================== */

  async function transitionPendingInteraction(
    component,
    {
      command,
      state,
      currentTurn,
      conversationId,
      options
    }
  ) {
    if (!command) {
      return {
        applied: false,

        state:
          safeClone(
            state
              .pendingInteractionState
          ),

        activeInteraction:
          readActivePendingInteraction(
            state
              .pendingInteractionState
          ),

        commandType:
          "noop"
      };
    }

    const transition =
      resolveCallable(
        component,
        [
          "transition",
          "apply",
          "run"
        ],
        "cos-pending-interaction-manager"
      );

    return await transition(
      {
        conversationId,

        state:
          state
            .pendingInteractionState,

        currentTurn,

        command
      },
      {
        ...options,
        freeze: false
      }
    );
  }

  async function transitionArtifact(
    component,
    {
      command,
      state,
      currentTurn,
      conversationId,
      options
    }
  ) {
    if (!command) {
      return {
        applied: false,

        state:
          safeClone(
            state.artifactState
          ),

        activeArtifact:
          readActiveArtifact(
            state.artifactState
          ),

        commandType:
          "noop"
      };
    }

    const transition =
      resolveCallable(
        component,
        [
          "transition",
          "apply",
          "run"
        ],
        "cos-artifact-register"
      );

    return await transition(
      {
        conversationId,

        state:
          state.artifactState,

        currentTurn,

        command
      },
      {
        ...options,
        freeze: false
      }
    );
  }

  async function transitionDeliverySequence(
    component,
    {
      command,
      state,
      currentTurn,
      conversationId,
      options
    }
  ) {
    if (!command) {
      return {
        applied: false,

        state:
          safeClone(
            state
              .deliverySequenceState
          ),

        activeSequence:
          readActiveDeliverySequence(
            state
              .deliverySequenceState
          ),

        commandType:
          "noop"
      };
    }

    const transition =
      resolveCallable(
        component,
        [
          "transition",
          "apply",
          "run"
        ],
        "cos-delivery-sequence-manager"
      );

    return await transition(
      {
        conversationId,

        state:
          state
            .deliverySequenceState,

        currentTurn,

        command
      },
      {
        ...options,
        freeze: false
      }
    );
  }

  function applyAuxiliaryStateResult(
    state,
    property,
    transitionResult
  ) {
    const next =
      safeClone(state);

    if (
      transitionResult &&
      isObject(
        transitionResult.state
      )
    ) {
      next[property] =
        safeClone(
          transitionResult.state
        );
    }

    return next;
  }

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
        pendingState
          .activeInteractionId,
        pendingState
          .active_interaction_id
      );

    if (!activeId) {
      return null;
    }

    const value =
      pendingState.interactions[
        activeId
      ];

    return isObject(value)
      ? value
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
        artifactState
          .activeArtifactId,
        artifactState
          .active_artifact_id
      );

    if (!activeId) {
      return null;
    }

    const value =
      artifactState.artifacts[
        activeId
      ];

    return isObject(value)
      ? value
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
        sequenceState
          .activeSequenceId,
        sequenceState
          .active_sequence_id
      );

    if (!activeId) {
      return null;
    }

    const value =
      sequenceState.sequences[
        activeId
      ];

    return isObject(value)
      ? value
      : null;
  }

  /* =====================================================
     REFERENCE CANDIDATE CONSTRUCTION
  ===================================================== */

  async function buildReferenceCandidates(
    component,
    context
  ) {
    const build =
      resolveCallable(
        component,
        [
          "build",
          "buildCandidates",
          "create",
          "run"
        ],
        "cos-reference-candidate-builder"
      );

    return await build(
      {
        conversationId:
          context.conversationId,

        currentTurn:
          context.currentTurn,

        history:
          context.history,

        historyIndex:
          context.historyIndex,

        state:
          context.state,

        pendingInteraction:
          context.activePendingInteraction,

        activeArtifact:
          context.activeArtifact,

        deliverySequence:
          context.activeDeliverySequence,

        upstreamCandidates:
          context.upstreamCandidates,

        uiMetadata:
          context.uiMetadata,

        options: {
          includeActiveThread:
            context.options
              .includeActiveThread !==
            false,

          includeHistoryLandmark:
            context.options
              .includeHistoryLandmark ===
            true,

          freeze: false
        }
      },
      {
        freeze: false
      }
    );
  }

  /* =====================================================
     REFERENCE ADJUDICATION
  ===================================================== */

  async function adjudicateReferences(
    component,
    context
  ) {
    const adjudicate =
      resolveCallable(
        component,
        [
          "adjudicate",
          "resolve",
          "decide",
          "run"
        ],
        "cos-reference-adjudicator"
      );

    return await adjudicate(
      {
        conversationId:
          context.conversationId,

        currentTurn:
          context.currentTurn,

        candidateSet:
          context.candidateSet
      },
      {
        freeze: false
      }
    );
  }

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  async function resolveReferences(
    component,
    context
  ) {
    const resolve =
      resolveCallable(
        component,
        [
          "resolve",
          "run",
          "execute",
          "process"
        ],
        "cos-reference-resolver"
      );

    return await resolve(
      {
        conversationId:
          context.conversationId,

        currentTurn:
          context.currentTurn,

        history:
          context.history,

        historyIndex:
          context.historyIndex,

        state:
          context.state,

        pendingInteractionState:
          context.state
            .pendingInteractionState,

        artifactState:
          context.state.artifactState,

        deliverySequenceState:
          context.state
            .deliverySequenceState,

        pendingInteraction:
          context.activePendingInteraction,

        activeArtifact:
          context.activeArtifact,

        deliverySequence:
          context.activeDeliverySequence,

        upstreamCandidates:
          context.upstreamCandidates,

        uiMetadata:
          context.uiMetadata,

        candidateSet:
          context.candidateSet,

        adjudication:
          context.adjudication,

        options: {
          includeDiagnostics:
            context.options
              .includeReferenceDiagnostics !==
            false,

          freeze: false
        }
      },
      {
        includeDiagnostics:
          context.options
            .includeReferenceDiagnostics !==
          false,

        freeze: false
      }
    );
  }

  /* =====================================================
     PLACEMENT
  ===================================================== */

  async function determinePlacement(
    component,
    context
  ) {
    const place =
      resolveCallable(
        component,
        [
          "place",
          "determine",
          "determinePlacement",
          "resolve",
          "run"
        ],
        "cos-placement-engine"
      );

    return await place(
      {
        conversationId:
          context.conversationId,

        currentTurn:
          context.currentTurn,

        state:
          context.state,

        history:
          context.history,

        historyIndex:
          context.historyIndex,

        referenceResolution:
          context.referenceResolution,

        semanticPacket:
          context.semanticPacket,

        conversationFunction:
          context.conversationFunction,

        placementEvidence:
          context.placementEvidence,

        pendingInteraction:
          context.activePendingInteraction,

        activeArtifact:
          context.activeArtifact,

        deliverySequence:
          context.activeDeliverySequence
      },
      {
        ...context.options,
        freeze: false
      }
    );
  }

  /* =====================================================
     THREAD STATE TRANSITION
  ===================================================== */

  async function transitionThreadState(
    component,
    context
  ) {
    const transition =
      resolveCallable(
        component,
        [
          "transition",
          "apply",
          "applyPlacement",
          "update",
          "run"
        ],
        "cos-thread-state-manager"
      );

    const result =
      await transition(
        {
          conversationId:
            context.conversationId,

          state:
            context.state,

          currentTurn:
            context.currentTurn,

          placement:
            context.placement,

          referenceResolution:
            context.referenceResolution,

          historyIndex:
            context.historyIndex
        },
        {
          ...context.options,
          freeze: false
        }
      );

    return normalizeThreadTransitionResult(
      result,
      context
    );
  }

  function normalizeThreadTransitionResult(
    result,
    context
  ) {
    if (!isObject(result)) {
      throw new CosRuntimeError(
        "COS_RUNTIME_THREAD_TRANSITION_INVALID",
        "Thread state manager returned an invalid result.",
        {
          stage:
            "thread_state_transition"
        }
      );
    }

    const nextState =
      isObject(result.state)
        ? safeClone(result.state)
        : safeClone(context.state);

    const turnId =
      readCurrentTurnId(
        context.currentTurn
      );

    if (!isObject(nextState.turns)) {
      nextState.turns = {};
    }

    if (
      turnId &&
      !nextState.turns[turnId]
    ) {
      nextState.turns[turnId] =
        safeClone(
          context.currentTurn
        );
    }

    if (turnId) {
      nextState.activeTurnId =
        turnId;
    }

    nextState.lastPlacement =
      safeClone(
        context.placement
      );

    nextState
      .lastReferenceResolution =
      safeClone(
        context.referenceResolution
      );

    nextState
      .pendingInteractionState =
      safeClone(
        context.state
          .pendingInteractionState
      );

    nextState.artifactState =
      safeClone(
        context.state.artifactState
      );

    nextState
      .deliverySequenceState =
      safeClone(
        context.state
          .deliverySequenceState
      );

    return {
      ...safeClone(result),

      state:
        nextState
    };
  }

  /* =====================================================
     PLACEMENT VALIDATION
  ===================================================== */

  async function validatePlacement(
    component,
    context
  ) {
    const validate =
      resolveCallable(
        component,
        [
          "validatePlacement",
          "validate",
          "run",
          "assert"
        ],
        "cos-placement-validator"
      );

    const validation =
      await validate(
        {
          conversationId:
            context.conversationId,

          state:
            context.state,

          currentTurn:
            context.currentTurn,

          historyIndex:
            context.historyIndex,

          referenceResolution:
            context.referenceResolution,

          placement:
            context.placement,

          threadTransition:
            context.threadTransition
        },
        {
          ...context.options,
          freeze: false
        }
      );

    if (validation === false) {
      throw new CosRuntimeError(
        "COS_RUNTIME_PLACEMENT_REJECTED",
        "Placement validator rejected the COS placement.",
        {
          stage:
            "placement_validation"
        }
      );
    }

    if (
      isObject(validation) &&
      validation.valid === false
    ) {
      throw new CosRuntimeError(
        "COS_RUNTIME_PLACEMENT_INVALID",
        "COS placement failed validation.",
        {
          stage:
            "placement_validation",

          details:
            validation
        }
      );
    }

    return isObject(validation)
      ? validation
      : {
          valid: true,
          errors: [],
          warnings: []
        };
  }

  /* =====================================================
     PACKET CONSTRUCTION
  ===================================================== */

  async function buildPacket(
    component,
    context
  ) {
    const build =
      resolveCallable(
        component,
        [
          "build",
          "create",
          "createPacket",
          "run"
        ],
        "cos-packet-builder"
      );

    const packet =
      await build(
        {
          conversationId:
            context.conversationId,

          state:
            context.state,

          previousState:
            context.previousState,

          currentTurn:
            context.currentTurn,

          historyIndex:
            context.historyIndex,

          candidateSet:
            context.candidateSet,

          referenceAdjudication:
            context.adjudication,

          referenceResolution:
            context.referenceResolution,

          placement:
            context.placement,

          threadTransition:
            context.threadTransition,

          placementValidation:
            context.placementValidation,

          pendingInteraction:
            context.activePendingInteraction,

          activeArtifact:
            context.activeArtifact,

          deliverySequence:
            context.activeDeliverySequence,

          auxiliaryTransitions:
            context.auxiliaryTransitions,

          semanticPacket:
            context.semanticPacket,

          conversationFunction:
            context.conversationFunction,

          metadata:
            context.metadata
        },
        {
          ...context.options,
          freeze: false
        }
      );

    if (!isObject(packet)) {
      throw new CosRuntimeError(
        "COS_RUNTIME_PACKET_INVALID",
        "Packet builder returned an invalid packet.",
        {
          stage:
            "packet_construction"
        }
      );
    }

    return packet;
  }

  /* =====================================================
     FINAL STATE VALIDATION
  ===================================================== */

  async function validateFinalState(
    component,
    state
  ) {
    const validate =
      resolveCallable(
        component,
        [
          "validateState",
          "validate",
          "assertValid",
          "assertState"
        ],
        "cos-state"
      );

    const result =
      await validate(state);

    if (result === false) {
      throw new CosRuntimeError(
        "COS_RUNTIME_FINAL_STATE_REJECTED",
        "Final COS state failed validation.",
        {
          stage:
            "final_state_validation"
        }
      );
    }

    if (
      isObject(result) &&
      result.valid === false
    ) {
      throw new CosRuntimeError(
        "COS_RUNTIME_FINAL_STATE_INVALID",
        "Final COS state failed validation.",
        {
          stage:
            "final_state_validation",

          details:
            result
        }
      );
    }

    return isObject(result)
      ? result
      : {
          valid: true,
          errors: [],
          warnings: []
        };
  }

  /* =====================================================
     STATE FINALIZATION
  ===================================================== */

  function finalizeState(
    state,
    {
      currentTurn,
      placement,
      referenceResolution
    }
  ) {
    const next =
      safeClone(state);

    const turnId =
      readCurrentTurnId(
        currentTurn
      );

    next.schemaVersion =
      SCHEMA_VERSION;

    next.authority =
      AUTHORITY;

    next.component =
      "cos-state";

    next.stateType =
      next.stateType ||
      "conversation_operating_system_state";

    next.revision =
      Math.max(
        0,
        normalizeInteger(
          next.revision,
          0
        )
      ) + 1;

    if (turnId) {
      next.activeTurnId =
        turnId;

      if (!isObject(next.turns)) {
        next.turns = {};
      }

      next.turns[turnId] = {
        ...safeClone(
          next.turns[turnId] || {}
        ),

        ...safeClone(
          currentTurn
        ),

        turnId
      };
    }

    next.lastPlacement =
      safeClone(placement);

    next
      .lastReferenceResolution =
      safeClone(
        referenceResolution
      );

    next.updatedAt =
      nowIso();

    return next;
  }

  /* =====================================================
     MAIN EXECUTION
  ===================================================== */

  async function run(
    rawInput = {},
    options = {}
  ) {
    const runtimeStartedAt =
      monotonicNow();

    const diagnostics =
      createDiagnostics();

    const input =
      normalizeRuntimeInput(
        rawInput
      );

    const mergedOptions = {
      ...input.options,
      ...(
        isObject(options)
          ? options
          : {}
      )
    };

    const freeze =
      mergedOptions.freeze !== false;

    const throwOnFailure =
      mergedOptions.throwOnFailure ===
      true;

    const includeStageOutputs =
      mergedOptions
        .includeStageOutputs !==
      false;

    let components;

    try {
      components =
        resolveComponents(
          isObject(
            mergedOptions.components
          )
            ? mergedOptions.components
            : {}
        );

      assertComponents(
        components
      );
    } catch (error) {
      return handleRuntimeFailure({
        error,
        input,
        diagnostics,
        runtimeStartedAt,
        throwOnFailure,
        freeze
      });
    }

    let contractValidation;
    let initialState;
    let historyIndex;
    let turnRegistration;
    let state;
    let pendingInteractionTransition;
    let artifactTransition;
    let deliverySequenceTransition;
    let candidateSet;
    let adjudication;
    let referenceResolution;
    let placement;
    let threadTransition;
    let placementValidation;
    let packet;
    let finalStateValidation;

    try {
      contractValidation =
        await executeStage(
          diagnostics,
          "contract_validation",
          () =>
            validateContract(
              components.contract,
              input,
              mergedOptions
            )
        );

      initialState =
        await executeStage(
          diagnostics,
          "state_normalization",
          () =>
            normalizeState(
              components.state,
              input
            )
        );

      state =
        safeClone(initialState);

      historyIndex =
        await executeStage(
          diagnostics,
          "history_indexing",
          () =>
            buildHistoryIndex(
              components.historyIndex,
              {
                input,
                state,
                options:
                  mergedOptions
              }
            )
        );

      turnRegistration =
        await executeStage(
          diagnostics,
          "turn_registration",
          () =>
            registerCurrentTurn(
              components.turnRegister,
              {
                input,
                state,
                historyIndex,
                options:
                  mergedOptions
              }
            )
        );

      state =
        safeClone(
          turnRegistration.state
        );

      const currentTurn =
        safeClone(
          turnRegistration.turn
        );

      pendingInteractionTransition =
        await executeStage(
          diagnostics,
          "pending_interaction_transition",
          () =>
            transitionPendingInteraction(
              components
                .pendingInteractionManager,
              {
                command:
                  input
                    .pendingInteractionCommand,

                state,

                currentTurn,

                conversationId:
                  input.conversationId,

                options:
                  mergedOptions
              }
            )
        );

      state =
        applyAuxiliaryStateResult(
          state,
          "pendingInteractionState",
          pendingInteractionTransition
        );

      artifactTransition =
        await executeStage(
          diagnostics,
          "artifact_transition",
          () =>
            transitionArtifact(
              components.artifactRegister,
              {
                command:
                  input.artifactCommand,

                state,

                currentTurn,

                conversationId:
                  input.conversationId,

                options:
                  mergedOptions
              }
            )
        );

      state =
        applyAuxiliaryStateResult(
          state,
          "artifactState",
          artifactTransition
        );

      deliverySequenceTransition =
        await executeStage(
          diagnostics,
          "delivery_sequence_transition",
          () =>
            transitionDeliverySequence(
              components
                .deliverySequenceManager,
              {
                command:
                  input
                    .deliverySequenceCommand,

                state,

                currentTurn,

                conversationId:
                  input.conversationId,

                options:
                  mergedOptions
              }
            )
        );

      state =
        applyAuxiliaryStateResult(
          state,
          "deliverySequenceState",
          deliverySequenceTransition
        );

      const activePendingInteraction =
        pendingInteractionTransition &&
        pendingInteractionTransition
          .activeInteraction
          ? safeClone(
              pendingInteractionTransition
                .activeInteraction
            )
          : readActivePendingInteraction(
              state
                .pendingInteractionState
            );

      const activeArtifact =
        artifactTransition &&
        artifactTransition
          .activeArtifact
          ? safeClone(
              artifactTransition
                .activeArtifact
            )
          : readActiveArtifact(
              state.artifactState
            );

      const activeDeliverySequence =
        deliverySequenceTransition &&
        deliverySequenceTransition
          .activeSequence
          ? safeClone(
              deliverySequenceTransition
                .activeSequence
            )
          : readActiveDeliverySequence(
              state
                .deliverySequenceState
            );

      const referenceContext = {
        conversationId:
          input.conversationId,

        currentTurn,

        state,

        history:
          mergeHistoryWithState(
            input.history,
            state
          ),

        historyIndex,

        activePendingInteraction,

        activeArtifact,

        activeDeliverySequence,

        upstreamCandidates:
          input.upstreamCandidates,

        uiMetadata:
          input.uiMetadata,

        options:
          mergedOptions
      };

      candidateSet =
        await executeStage(
          diagnostics,
          "reference_candidate_construction",
          () =>
            buildReferenceCandidates(
              components
                .referenceCandidateBuilder,
              referenceContext
            )
        );

      adjudication =
        await executeStage(
          diagnostics,
          "reference_adjudication",
          () =>
            adjudicateReferences(
              components
                .referenceAdjudicator,
              {
                ...referenceContext,
                candidateSet
              }
            )
        );

      referenceResolution =
        await executeStage(
          diagnostics,
          "reference_resolution",
          () =>
            resolveReferences(
              components
                .referenceResolver,
              {
                ...referenceContext,
                candidateSet,
                adjudication
              }
            )
        );

      placement =
        await executeStage(
          diagnostics,
          "placement",
          () =>
            determinePlacement(
              components
                .placementEngine,
              {
                conversationId:
                  input.conversationId,

                currentTurn,

                state,

                history:
                  referenceContext.history,

                historyIndex,

                referenceResolution,

                semanticPacket:
                  input.semanticPacket,

                conversationFunction:
                  input
                    .conversationFunction,

                placementEvidence:
                  input
                    .placementEvidence,

                activePendingInteraction,

                activeArtifact,

                activeDeliverySequence,

                options:
                  mergedOptions
              }
            )
        );

      threadTransition =
        await executeStage(
          diagnostics,
          "thread_state_transition",
          () =>
            transitionThreadState(
              components
                .threadStateManager,
              {
                conversationId:
                  input.conversationId,

                state,

                currentTurn,

                placement,

                referenceResolution,

                historyIndex,

                options:
                  mergedOptions
              }
            )
        );

      state =
        finalizeState(
          threadTransition.state,
          {
            currentTurn,
            placement,
            referenceResolution
          }
        );

      placementValidation =
        await executeStage(
          diagnostics,
          "placement_validation",
          () =>
            validatePlacement(
              components
                .placementValidator,
              {
                conversationId:
                  input.conversationId,

                state,

                currentTurn,

                historyIndex,

                referenceResolution,

                placement,

                threadTransition,

                options:
                  mergedOptions
              }
            )
        );

      packet =
        await executeStage(
          diagnostics,
          "packet_construction",
          () =>
            buildPacket(
              components.packetBuilder,
              {
                conversationId:
                  input.conversationId,

                state,

                previousState:
                  initialState,

                currentTurn,

                historyIndex,

                candidateSet,

                adjudication,

                referenceResolution,

                placement,

                threadTransition,

                placementValidation,

                activePendingInteraction:
                  readActivePendingInteraction(
                    state
                      .pendingInteractionState
                  ),

                activeArtifact:
                  readActiveArtifact(
                    state.artifactState
                  ),

                activeDeliverySequence:
                  readActiveDeliverySequence(
                    state
                      .deliverySequenceState
                  ),

                auxiliaryTransitions: {
                  pendingInteraction:
                    pendingInteractionTransition,

                  artifact:
                    artifactTransition,

                  deliverySequence:
                    deliverySequenceTransition
                },

                semanticPacket:
                  input.semanticPacket,

                conversationFunction:
                  input
                    .conversationFunction,

                metadata:
                  input.metadata,

                options:
                  mergedOptions
              }
            )
        );

      finalStateValidation =
        await executeStage(
          diagnostics,
          "final_state_validation",
          () =>
            validateFinalState(
              components.state,
              state
            )
        );

      diagnostics.completedAt =
        nowIso();

      diagnostics.durationMs =
        elapsedMilliseconds(
          runtimeStartedAt
        );

      const result = {
        ok: true,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        runtimeResultType:
          RUNTIME_RESULT_TYPE,

        conversationId:
          firstNonEmptyString(
            input.conversationId,
            state.conversationId
          ) || null,

        currentTurnId:
          readCurrentTurnId(
            currentTurn
          ),

        packet:
          safeClone(packet),

        state:
          safeClone(state),

        currentTurn:
          safeClone(currentTurn),

        placement:
          safeClone(placement),

        referenceResolution:
          safeClone(
            referenceResolution
          ),

        candidateSet:
          includeStageOutputs
            ? safeClone(
                candidateSet
              )
            : null,

        referenceAdjudication:
          includeStageOutputs
            ? safeClone(
                adjudication
              )
            : null,

        historyIndex:
          includeStageOutputs
            ? safeClone(
                historyIndex
              )
            : null,

        turnRegistration:
          includeStageOutputs
            ? safeClone(
                turnRegistration
              )
            : null,

        auxiliaryTransitions:
          includeStageOutputs
            ? {
                pendingInteraction:
                  safeClone(
                    pendingInteractionTransition
                  ),

                artifact:
                  safeClone(
                    artifactTransition
                  ),

                deliverySequence:
                  safeClone(
                    deliverySequenceTransition
                  )
              }
            : null,

        threadTransition:
          includeStageOutputs
            ? safeClone(
                threadTransition
              )
            : null,

        placementValidation:
          safeClone(
            placementValidation
          ),

        finalStateValidation:
          safeClone(
            finalStateValidation
          ),

        contractValidation:
          includeStageOutputs
            ? safeClone(
                contractValidation
              )
            : null,

        diagnostics:
          safeClone(
            diagnostics
          ),

        startedAt:
          diagnostics.startedAt,

        completedAt:
          diagnostics.completedAt,

        durationMs:
          diagnostics.durationMs,

        errors: []
      };

      return freeze
        ? freezeClone(result)
        : result;
    } catch (error) {
      return handleRuntimeFailure({
        error,
        input,
        diagnostics,
        runtimeStartedAt,
        throwOnFailure,
        freeze,
        partial: {
          contractValidation,
          initialState,
          historyIndex,
          turnRegistration,
          state,
          pendingInteractionTransition,
          artifactTransition,
          deliverySequenceTransition,
          candidateSet,
          adjudication,
          referenceResolution,
          placement,
          threadTransition,
          placementValidation,
          packet,
          finalStateValidation
        }
      });
    }
  }

  /* =====================================================
     FAILURE RESULT
  ===================================================== */

  function handleRuntimeFailure({
    error,
    input,
    diagnostics,
    runtimeStartedAt,
    throwOnFailure,
    freeze,
    partial = {}
  }) {
    diagnostics.completedAt =
      nowIso();

    diagnostics.durationMs =
      elapsedMilliseconds(
        runtimeStartedAt
      );

    const normalizedError =
      safeError(error);

    if (
      !diagnostics.errors.some(
        (candidate) =>
          candidate.code ===
            normalizedError.code &&
          candidate.message ===
            normalizedError.message
      )
    ) {
      diagnostics.errors.push(
        normalizedError
      );
    }

    if (throwOnFailure) {
      throw error;
    }

    const fallbackState =
      isObject(partial.state)
        ? safeClone(partial.state)
        : isObject(input.state)
          ? safeClone(input.state)
          : null;

    const result = {
      ok: false,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      runtimeResultType:
        RUNTIME_RESULT_TYPE,

      conversationId:
        firstNonEmptyString(
          input.conversationId,
          fallbackState &&
            fallbackState
              .conversationId
        ) || null,

      currentTurnId:
        readCurrentTurnId(
          partial.turnRegistration &&
          partial.turnRegistration.turn
            ? partial.turnRegistration
                .turn
            : input.currentTurn
        ),

      packet:
        partial.packet
          ? safeClone(
              partial.packet
            )
          : null,

      state:
        fallbackState,

      currentTurn:
        partial.turnRegistration &&
        partial.turnRegistration.turn
          ? safeClone(
              partial.turnRegistration
                .turn
            )
          : safeClone(
              input.currentTurn
            ),

      placement:
        partial.placement
          ? safeClone(
              partial.placement
            )
          : null,

      referenceResolution:
        partial.referenceResolution
          ? safeClone(
              partial
                .referenceResolution
            )
          : null,

      candidateSet:
        partial.candidateSet
          ? safeClone(
              partial.candidateSet
            )
          : null,

      referenceAdjudication:
        partial.adjudication
          ? safeClone(
              partial.adjudication
            )
          : null,

      historyIndex:
        partial.historyIndex
          ? safeClone(
              partial.historyIndex
            )
          : null,

      turnRegistration:
        partial.turnRegistration
          ? safeClone(
              partial.turnRegistration
            )
          : null,

      auxiliaryTransitions: {
        pendingInteraction:
          partial
            .pendingInteractionTransition
            ? safeClone(
                partial
                  .pendingInteractionTransition
              )
            : null,

        artifact:
          partial.artifactTransition
            ? safeClone(
                partial
                  .artifactTransition
              )
            : null,

        deliverySequence:
          partial
            .deliverySequenceTransition
            ? safeClone(
                partial
                  .deliverySequenceTransition
              )
            : null
      },

      threadTransition:
        partial.threadTransition
          ? safeClone(
              partial.threadTransition
            )
          : null,

      placementValidation:
        partial.placementValidation
          ? safeClone(
              partial
                .placementValidation
            )
          : null,

      finalStateValidation:
        partial.finalStateValidation
          ? safeClone(
              partial
                .finalStateValidation
            )
          : null,

      contractValidation:
        partial.contractValidation
          ? safeClone(
              partial
                .contractValidation
            )
          : null,

      diagnostics:
        safeClone(
          diagnostics
        ),

      startedAt:
        diagnostics.startedAt,

      completedAt:
        diagnostics.completedAt,

      durationMs:
        diagnostics.durationMs,

      errors: [
        normalizedError
      ]
    };

    return freeze
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     SAFE EXECUTION
  ===================================================== */

  async function safeRun(
    input = {},
    options = {}
  ) {
    return run(
      input,
      {
        ...options,
        throwOnFailure: false
      }
    );
  }

  async function execute(
    input = {},
    options = {}
  ) {
    return run(
      input,
      options
    );
  }

  async function process(
    input = {},
    options = {}
  ) {
    return run(
      input,
      options
    );
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    overrides = {}
  ) {
    const components =
      resolveComponents(
        overrides
      );

    const installed = {};
    const missing = [];

    for (
      const componentName of
        REQUIRED_COMPONENTS
    ) {
      const component =
        components[
          componentName
        ];

      const available =
        Boolean(component);

      installed[
        componentName
      ] = {
        available,

        version:
          component &&
          firstNonEmptyString(
            component.version,
            component.VERSION
          ),

        authority:
          component &&
          firstNonEmptyString(
            component.authority,
            component.AUTHORITY
          )
      };

      if (!available) {
        missing.push(
          componentName
        );
      }
    }

    return {
      ok:
        missing.length === 0,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      status:
        missing.length === 0
          ? "ready"
          : "not_ready",

      installed,

      missing,

      checkedAt:
        nowIso()
    };
  }

  function assertReady(
    overrides = {}
  ) {
    const report =
      health(overrides);

    if (!report.ok) {
      throw new CosRuntimeError(
        "COS_RUNTIME_NOT_READY",
        "Conversation Operating System runtime is not ready.",
        {
          stage:
            "component_resolution",

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

  const cosRuntime = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    runtimeResultType:
      RUNTIME_RESULT_TYPE,

    stageNames:
      STAGE_NAMES,

    requiredComponents:
      REQUIRED_COMPONENTS,

    auxiliaryCommandNames:
      AUXILIARY_COMMAND_NAMES,

    CosRuntimeError,

    run,

    execute,

    process,

    safeRun,

    health,

    assertReady,

    normalizeInput:
      normalizeRuntimeInput,

    resolveComponents,

    assertComponents,

    mergeHistoryWithState,

    validateContract,

    normalizeState,

    buildHistoryIndex,

    registerCurrentTurn,

    transitionPendingInteraction,

    transitionArtifact,

    transitionDeliverySequence,

    buildReferenceCandidates,

    adjudicateReferences,

    resolveReferences,

    determinePlacement,

    transitionThreadState,

    validatePlacement,

    buildPacket,

    validateFinalState,

    finalizeState
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.runtime =
    cosRuntime;

  ConversationOS.cosRuntime =
    cosRuntime;

  root.AriCosRuntime =
    cosRuntime;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosRuntime;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);