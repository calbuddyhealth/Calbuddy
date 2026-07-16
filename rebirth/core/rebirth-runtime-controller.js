// rebirth/core/rebirth-runtime-controller.js
// ARI Rebirth — Canonical Runtime Controller
//
// Purpose:
// Execute the top-level ARI Rebirth runtime for one conversation turn.
//
// V1.0.0 — Canonical Rebirth Runtime Orchestration Foundation
//
// Canonical execution flow:
//
// Runtime Input
//      ↓
// Runtime Contract Validation
//      ↓
// Runtime State Normalization
//      ↓
// Turn Intake
//      ↓
// Conversation Runtime
//      ↓
// Semantic Authority
//      ↓
// Conversation Function Authority
//      ↓
// Safety Authority
//      ↓
// Additional Authority Orchestration
//      ↓
// Conversation Operating System Integration
//      ↓
// Context Assembly
//      ↓
// Response Orchestration
//      ↓
// Model Orchestration
//      ↓
// Final Response Assembly
//      ↓
// Runtime Result Construction
//
// Current architectural status:
//
// This controller is designed to operate while the wider Rebirth runtime is
// still being built.
//
// It supports:
//
// 1. Strict mode
//
//    Every required production stage must be installed and callable.
//    Missing or failed required stages fail the runtime.
//
// 2. Development mode
//
//    Future or unavailable stages may be skipped.
//    Installed stages still execute.
//    Skipped stages are recorded explicitly.
//    A structured partial result is returned.
//
// Authority:
//
// This component is authoritative only for:
//
// - executing major Rebirth layers in canonical order,
// - discovering installed Rebirth components,
// - carrying runtime state between stages,
// - validating required stage availability,
// - enforcing declared stage dependencies,
// - preserving upstream authority packets,
// - collecting runtime diagnostics,
// - constructing the final top-level runtime result.
//
// Non-authority:
//
// This component must not:
//
// - reinterpret raw user language,
// - independently infer semantic meaning,
// - independently classify conversation function,
// - independently infer safety severity,
// - independently resolve structural references,
// - independently place conversation turns,
// - independently generate model responses,
// - overwrite an authority-owned packet,
// - silently fabricate missing stage results.
//
// Architectural rule:
//
// The Rebirth Runtime Controller orchestrates authorities.
//
// It does not become an authority merely because it executes them.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.Core
// window.Ari.Rebirth.Core.runtimeController
//
// CommonJS:
//
// module.exports = rebirthRuntimeController

(function initializeRebirthRuntimeController(globalScope) {
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
  root.Ari.Rebirth =
    root.Ari.Rebirth || {};

  root.Ari.Rebirth.Core =
    root.Ari.Rebirth.Core || {};

  root.Ari.Rebirth.Conversation =
    root.Ari.Rebirth.Conversation || {};

  root.Ari.Rebirth.Authority =
    root.Ari.Rebirth.Authority || {};

  root.Ari.Rebirth.Context =
    root.Ari.Rebirth.Context || {};

  root.Ari.Rebirth.Response =
    root.Ari.Rebirth.Response || {};

  root.Ari.Rebirth.Model =
    root.Ari.Rebirth.Model || {};

  root.Ari.Rebirth.Integration =
    root.Ari.Rebirth.Integration || {};

  root.Ari.Rebirth.ConversationOS =
    root.Ari.Rebirth.ConversationOS || {};

  const Rebirth =
    root.Ari.Rebirth;

  const Core =
    Rebirth.Core;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "rebirth_runtime_orchestration";

  const COMPONENT_NAME =
    "rebirth-runtime-controller";

  const RUNTIME_RESULT_TYPE =
    "ari_rebirth_runtime_result";

  const EXECUTION_MODES =
    Object.freeze([
      "strict",
      "development"
    ]);

  const DEFAULT_EXECUTION_MODE =
    "development";

  const STAGE_STATUS =
    Object.freeze({
      PENDING:
        "pending",

      RUNNING:
        "running",

      COMPLETED:
        "completed",

      SKIPPED:
        "skipped",

      FAILED:
        "failed",

      DEGRADED:
        "degraded"
    });

  const STAGE_IDS =
    Object.freeze({
      CONTRACT:
        "runtime_contract",

      STATE:
        "runtime_state",

      TURN_INTAKE:
        "turn_intake",

      CONVERSATION:
        "conversation_runtime",

      SEMANTIC:
        "semantic_authority",

      CONVERSATION_FUNCTION:
        "conversation_function_authority",

      SAFETY:
        "safety_authority",

      AUTHORITY_ORCHESTRATION:
        "authority_orchestration",

      CONVERSATION_OS:
        "conversation_os",

      CONTEXT:
        "context_assembly",

      RESPONSE:
        "response_orchestration",

      MODEL:
        "model_orchestration",

      FINAL_RESPONSE:
        "final_response_assembly",

      RESULT:
        "runtime_result"
    });

  const CANONICAL_STAGE_ORDER =
    Object.freeze([
      STAGE_IDS.CONTRACT,
      STAGE_IDS.STATE,
      STAGE_IDS.TURN_INTAKE,
      STAGE_IDS.CONVERSATION,
      STAGE_IDS.SEMANTIC,
      STAGE_IDS.CONVERSATION_FUNCTION,
      STAGE_IDS.SAFETY,
      STAGE_IDS.AUTHORITY_ORCHESTRATION,
      STAGE_IDS.CONVERSATION_OS,
      STAGE_IDS.CONTEXT,
      STAGE_IDS.RESPONSE,
      STAGE_IDS.MODEL,
      STAGE_IDS.FINAL_RESPONSE,
      STAGE_IDS.RESULT
    ]);

  const DEFAULT_REQUIRED_STAGES =
    Object.freeze([
      STAGE_IDS.CONTRACT,
      STAGE_IDS.STATE,
      STAGE_IDS.TURN_INTAKE,
      STAGE_IDS.CONVERSATION_OS,
      STAGE_IDS.RESULT
    ]);

  const PRODUCTION_REQUIRED_STAGES =
    Object.freeze([
      STAGE_IDS.CONTRACT,
      STAGE_IDS.STATE,
      STAGE_IDS.TURN_INTAKE,
      STAGE_IDS.CONVERSATION,
      STAGE_IDS.SEMANTIC,
      STAGE_IDS.CONVERSATION_FUNCTION,
      STAGE_IDS.SAFETY,
      STAGE_IDS.AUTHORITY_ORCHESTRATION,
      STAGE_IDS.CONVERSATION_OS,
      STAGE_IDS.CONTEXT,
      STAGE_IDS.RESPONSE,
      STAGE_IDS.MODEL,
      STAGE_IDS.FINAL_RESPONSE,
      STAGE_IDS.RESULT
    ]);

  const AUTHORITY_NAMES =
    Object.freeze({
      SEMANTIC:
        "semantic_frame_builder",

      CONVERSATION_FUNCTION:
        "conversation_function_engine",

      SAFETY:
        "safety_context",

      CONVERSATION_OS:
        "conversation_operating_system",

      RESPONSE:
        "response_orchestration",

      MODEL:
        "model_orchestration"
    });

  const AUTHORITY_STATE_KEYS =
    Object.freeze({
      semantic: [
        "semanticPacket",
        "semanticFrame",
        "canonicalSemanticFrame",
        "semanticStructure"
      ],

      conversationFunction: [
        "conversationFunction",
        "conversationFunctionResult",
        "canonicalConversationFunction"
      ],

      safety: [
        "safetyContext",
        "safetyContextResult",
        "canonicalSafetyContext"
      ]
    });

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class RebirthRuntimeControllerError extends Error {
    constructor(
      code,
      message,
      {
        stage = null,
        details = null,
        cause = null,
        recoverable = false,
        fatal = true
      } = {}
    ) {
      super(
        message ||
        code ||
        "Rebirth runtime controller error"
      );

      this.name =
        "RebirthRuntimeControllerError";

      this.code =
        code ||
        "REBIRTH_RUNTIME_CONTROLLER_ERROR";

      this.stage =
        stage || null;

      this.details =
        details;

      this.cause =
        cause;

      this.recoverable =
        recoverable === true;

      this.fatal =
        fatal !== false;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          RebirthRuntimeControllerError
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

  function readPath(
    source,
    path
  ) {
    const segments =
      Array.isArray(path)
        ? path
        : String(path).split(".");

    let current =
      source;

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

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name ||
          "Error",

        code:
          firstNonEmptyString(
            error.code
          ) ||
          "REBIRTH_RUNTIME_CONTROLLER_ERROR",

        message:
          error.message ||
          "Unknown Rebirth runtime error",

        stage:
          firstNonEmptyString(
            error.stage
          ) || null,

        recoverable:
          error.recoverable === true,

        fatal:
          error.fatal !== false,

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
      name:
        "Error",

      code:
        "REBIRTH_RUNTIME_CONTROLLER_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown Rebirth runtime error",

      stage:
        null,

      recoverable:
        false,

      fatal:
        true,

      details:
        safeClone(error),

      cause:
        null
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
     EXECUTION MODE
  ===================================================== */

  function normalizeExecutionMode(
    value
  ) {
    return EXECUTION_MODES.includes(
      value
    )
      ? value
      : DEFAULT_EXECUTION_MODE;
  }

  function isStrictMode(options) {
    return (
      normalizeExecutionMode(
        options.executionMode
      ) === "strict"
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
            message:
              rawInput
          };

    const options =
      isObject(source.options)
        ? safeClone(
            source.options
          )
        : {};

    const rawMessage =
      firstDefined(
        source.message,
        source.text,
        source.rawMessage,
        source.raw_message,
        source.userMessage,
        source.user_message,
        source.currentTurn &&
          source.currentTurn.text,
        source.current_turn &&
          source.current_turn.text,
        ""
      );

    return {
      requestId:
        firstNonEmptyString(
          source.requestId,
          source.request_id
        ) || null,

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          source.runtimeState &&
            source.runtimeState
              .conversationId,
          source.state &&
            source.state
              .conversationId
        ) || null,

      userId:
        firstNonEmptyString(
          source.userId,
          source.user_id
        ) || null,

      sessionId:
        firstNonEmptyString(
          source.sessionId,
          source.session_id
        ) || null,

      message:
        rawMessage === null ||
        rawMessage === undefined
          ? ""
          : String(rawMessage),

      currentTurn:
        isObject(source.currentTurn)
          ? safeClone(
              source.currentTurn
            )
          : isObject(
              source.current_turn
            )
            ? safeClone(
                source.current_turn
              )
            : null,

      history:
        Array.isArray(source.history)
          ? safeClone(
              source.history
            )
          : Array.isArray(
              source.conversationHistory
            )
            ? safeClone(
                source.conversationHistory
              )
            : Array.isArray(
                source.conversation_history
              )
              ? safeClone(
                  source.conversation_history
                )
              : [],

      runtimeState:
        isObject(source.runtimeState)
          ? safeClone(
              source.runtimeState
            )
          : isObject(
              source.runtime_state
            )
            ? safeClone(
                source.runtime_state
              )
            : isObject(source.state)
              ? safeClone(
                  source.state
                )
              : {},

      userContext:
        isObject(source.userContext)
          ? safeClone(
              source.userContext
            )
          : isObject(
              source.user_context
            )
            ? safeClone(
                source.user_context
              )
            : {},

      applicationContext:
        isObject(
          source.applicationContext
        )
          ? safeClone(
              source.applicationContext
            )
          : isObject(
              source.application_context
            )
            ? safeClone(
                source.application_context
              )
            : {},

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

      metadata:
        isObject(source.metadata)
          ? safeClone(
              source.metadata
            )
          : {},

      commands:
        isObject(source.commands)
          ? safeClone(
              source.commands
            )
          : {},

      options
    };
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveFromNamespaces(
    aliases = [],
    namespaces = []
  ) {
    for (
      const namespace of
        namespaces.filter(Boolean)
    ) {
      for (
        const alias of aliases
      ) {
        if (
          namespace &&
          namespace[alias]
        ) {
          return namespace[alias];
        }
      }
    }

    return null;
  }

  function resolveComponents(
    overrides = {}
  ) {
    const commonNamespaces = [
      Rebirth,
      Core,
      Rebirth.Conversation,
      Rebirth.Authority,
      Rebirth.Context,
      Rebirth.Response,
      Rebirth.Model,
      Rebirth.Integration,
      root.Ari,
      root
    ];

    return {
      runtimeContract:
        overrides.runtimeContract ||
        resolveFromNamespaces(
          [
            "runtimeContract",
            "rebirthRuntimeContract",
            "AriRebirthRuntimeContract"
          ],
          [
            Core,
            ...commonNamespaces
          ]
        ),

      runtimeState:
        overrides.runtimeState ||
        resolveFromNamespaces(
          [
            "runtimeState",
            "rebirthRuntimeState",
            "AriRebirthRuntimeState"
          ],
          [
            Core,
            ...commonNamespaces
          ]
        ),

      runtimeResult:
        overrides.runtimeResult ||
        resolveFromNamespaces(
          [
            "runtimeResult",
            "rebirthRuntimeResult",
            "AriRebirthRuntimeResult"
          ],
          [
            Core,
            ...commonNamespaces
          ]
        ),

      turnIntake:
        overrides.turnIntake ||
        resolveFromNamespaces(
          [
            "turnIntake",
            "rebirthTurnIntake",
            "AriRebirthTurnIntake"
          ],
          [
            Rebirth.Conversation,
            ...commonNamespaces
          ]
        ),

      conversationRuntime:
        overrides.conversationRuntime ||
        resolveFromNamespaces(
          [
            "conversationRuntime",
            "rebirthConversationRuntime",
            "AriRebirthConversationRuntime"
          ],
          [
            Rebirth.Conversation,
            ...commonNamespaces
          ]
        ),

      semanticAuthority:
        overrides.semanticAuthority ||
        resolveFromNamespaces(
          [
            "semanticAuthority",
            "semanticFrameBuilder",
            "rebirthSemanticFrameBuilder",
            "AriRebirthSemanticFrameBuilder",
            "AriSemanticFrameBuilder"
          ],
          commonNamespaces
        ),

      conversationFunctionAuthority:
        overrides
          .conversationFunctionAuthority ||
        resolveFromNamespaces(
          [
            "conversationFunctionAuthority",
            "conversationFunctionEngine",
            "rebirthConversationFunctionEngine",
            "AriRebirthConversationFunctionEngine",
            "AriConversationFunctionEngine"
          ],
          commonNamespaces
        ),

      safetyAuthority:
        overrides.safetyAuthority ||
        resolveFromNamespaces(
          [
            "safetyAuthority",
            "safetyContext",
            "safetyContextGate",
            "rebirthSafetyContext",
            "AriRebirthSafetyContext",
            "AriSafetyContextGate"
          ],
          commonNamespaces
        ),

      authorityOrchestrator:
        overrides.authorityOrchestrator ||
        resolveFromNamespaces(
          [
            "authorityOrchestrator",
            "rebirthAuthorityOrchestrator",
            "AriRebirthAuthorityOrchestrator"
          ],
          [
            Rebirth.Authority,
            ...commonNamespaces
          ]
        ),

      conversationOSStage:
        overrides.conversationOSStage ||
        resolveFromNamespaces(
          [
            "conversationOSStage",
            "cosStage",
            "rebirthConversationOSStage",
            "AriRebirthConversationOSStage"
          ],
          [
            Rebirth.Integration,
            ...commonNamespaces
          ]
        ),

      contextAssembler:
        overrides.contextAssembler ||
        resolveFromNamespaces(
          [
            "contextAssembler",
            "contextOrchestrator",
            "rebirthContextAssembler",
            "rebirthContextOrchestrator",
            "AriRebirthContextAssembler",
            "AriRebirthContextOrchestrator"
          ],
          [
            Rebirth.Context,
            ...commonNamespaces
          ]
        ),

      responseOrchestrator:
        overrides.responseOrchestrator ||
        resolveFromNamespaces(
          [
            "responseOrchestrator",
            "rebirthResponseOrchestrator",
            "AriRebirthResponseOrchestrator"
          ],
          [
            Rebirth.Response,
            ...commonNamespaces
          ]
        ),

      modelOrchestrator:
        overrides.modelOrchestrator ||
        resolveFromNamespaces(
          [
            "modelOrchestrator",
            "rebirthModelOrchestrator",
            "AriRebirthModelOrchestrator"
          ],
          [
            Rebirth.Model,
            ...commonNamespaces
          ]
        ),

      finalResponseAssembler:
        overrides
          .finalResponseAssembler ||
        resolveFromNamespaces(
          [
            "finalResponseAssembler",
            "responseResultAssembler",
            "rebirthFinalResponseAssembler",
            "AriRebirthFinalResponseAssembler"
          ],
          [
            Rebirth.Response,
            ...commonNamespaces
          ]
        )
    };
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

    throw new RebirthRuntimeControllerError(
      "REBIRTH_RUNTIME_COMPONENT_NOT_CALLABLE",
      `Rebirth component is not callable: ${componentName}`,
      {
        stage:
          componentName,

        details: {
          componentName,
          methodNames
        }
      }
    );
  }

  /* =====================================================
     STAGE DEFINITIONS
  ===================================================== */

  function createStageDefinitions(
    components
  ) {
    return {
      [STAGE_IDS.CONTRACT]: {
        id:
          STAGE_IDS.CONTRACT,

        componentKey:
          "runtimeContract",

        component:
          components.runtimeContract,

        requiredByDefault:
          true,

        authority:
          "runtime_contract",

        methods: [
          "validateInput",
          "validate",
          "assert",
          "run"
        ]
      },

      [STAGE_IDS.STATE]: {
        id:
          STAGE_IDS.STATE,

        componentKey:
          "runtimeState",

        component:
          components.runtimeState,

        requiredByDefault:
          true,

        authority:
          "runtime_state",

        methods: [
          "normalize",
          "normalizeState",
          "create",
          "initialize"
        ]
      },

      [STAGE_IDS.TURN_INTAKE]: {
        id:
          STAGE_IDS.TURN_INTAKE,

        componentKey:
          "turnIntake",

        component:
          components.turnIntake,

        requiredByDefault:
          true,

        authority:
          "turn_intake",

        methods: [
          "run",
          "intake",
          "normalize",
          "process"
        ]
      },

      [STAGE_IDS.CONVERSATION]: {
        id:
          STAGE_IDS.CONVERSATION,

        componentKey:
          "conversationRuntime",

        component:
          components.conversationRuntime,

        requiredByDefault:
          false,

        authority:
          "conversation_runtime",

        methods: [
          "run",
          "execute",
          "process",
          "resolve"
        ]
      },

      [STAGE_IDS.SEMANTIC]: {
        id:
          STAGE_IDS.SEMANTIC,

        componentKey:
          "semanticAuthority",

        component:
          components.semanticAuthority,

        requiredByDefault:
          false,

        authority:
          AUTHORITY_NAMES.SEMANTIC,

        methods: [
          "build",
          "run",
          "execute",
          "process",
          "resolve"
        ]
      },

      [STAGE_IDS.CONVERSATION_FUNCTION]: {
        id:
          STAGE_IDS.CONVERSATION_FUNCTION,

        componentKey:
          "conversationFunctionAuthority",

        component:
          components
            .conversationFunctionAuthority,

        requiredByDefault:
          false,

        authority:
          AUTHORITY_NAMES
            .CONVERSATION_FUNCTION,

        methods: [
          "classify",
          "run",
          "execute",
          "process",
          "resolve"
        ]
      },

      [STAGE_IDS.SAFETY]: {
        id:
          STAGE_IDS.SAFETY,

        componentKey:
          "safetyAuthority",

        component:
          components.safetyAuthority,

        requiredByDefault:
          false,

        authority:
          AUTHORITY_NAMES.SAFETY,

        methods: [
          "evaluate",
          "run",
          "execute",
          "process",
          "check"
        ]
      },

      [STAGE_IDS.AUTHORITY_ORCHESTRATION]: {
        id:
          STAGE_IDS.AUTHORITY_ORCHESTRATION,

        componentKey:
          "authorityOrchestrator",

        component:
          components.authorityOrchestrator,

        requiredByDefault:
          false,

        authority:
          "authority_orchestration",

        methods: [
          "run",
          "execute",
          "process",
          "orchestrate"
        ]
      },

      [STAGE_IDS.CONVERSATION_OS]: {
        id:
          STAGE_IDS.CONVERSATION_OS,

        componentKey:
          "conversationOSStage",

        component:
          components.conversationOSStage,

        requiredByDefault:
          true,

        authority:
          AUTHORITY_NAMES
            .CONVERSATION_OS,

        methods: [
          "run",
          "execute",
          "process",
          "apply"
        ]
      },

      [STAGE_IDS.CONTEXT]: {
        id:
          STAGE_IDS.CONTEXT,

        componentKey:
          "contextAssembler",

        component:
          components.contextAssembler,

        requiredByDefault:
          false,

        authority:
          "context_assembly",

        methods: [
          "assemble",
          "run",
          "execute",
          "process",
          "build"
        ]
      },

      [STAGE_IDS.RESPONSE]: {
        id:
          STAGE_IDS.RESPONSE,

        componentKey:
          "responseOrchestrator",

        component:
          components.responseOrchestrator,

        requiredByDefault:
          false,

        authority:
          AUTHORITY_NAMES.RESPONSE,

        methods: [
          "run",
          "execute",
          "process",
          "orchestrate",
          "plan"
        ]
      },

      [STAGE_IDS.MODEL]: {
        id:
          STAGE_IDS.MODEL,

        componentKey:
          "modelOrchestrator",

        component:
          components.modelOrchestrator,

        requiredByDefault:
          false,

        authority:
          AUTHORITY_NAMES.MODEL,

        methods: [
          "run",
          "execute",
          "process",
          "generate",
          "orchestrate"
        ]
      },

      [STAGE_IDS.FINAL_RESPONSE]: {
        id:
          STAGE_IDS.FINAL_RESPONSE,

        componentKey:
          "finalResponseAssembler",

        component:
          components.finalResponseAssembler,

        requiredByDefault:
          false,

        authority:
          "final_response_assembly",

        methods: [
          "assemble",
          "run",
          "execute",
          "process",
          "build"
        ]
      },

      [STAGE_IDS.RESULT]: {
        id:
          STAGE_IDS.RESULT,

        componentKey:
          "runtimeResult",

        component:
          components.runtimeResult,

        requiredByDefault:
          true,

        authority:
          "runtime_result",

        methods: [
          "create",
          "build",
          "run",
          "assemble"
        ]
      }
    };
  }

  function determineRequiredStages(
    options = {}
  ) {
    if (
      Array.isArray(
        options.requiredStages
      )
    ) {
      return uniqueStrings(
        options.requiredStages
      );
    }

    if (isStrictMode(options)) {
      return [
        ...PRODUCTION_REQUIRED_STAGES
      ];
    }

    return [
      ...DEFAULT_REQUIRED_STAGES
    ];
  }

  function isStageRequired(
    stageId,
    stageDefinition,
    requiredStages
  ) {
    return (
      requiredStages.includes(
        stageId
      ) ||
      stageDefinition
        .requiredByDefault === true
    );
  }

  /* =====================================================
     DIAGNOSTICS
  ===================================================== */

  function createDiagnostics(
    executionMode
  ) {
    return {
      executionMode,

      stages: [],

      warnings: [],

      errors: [],

      skippedStages: [],

      completedStages: [],

      failedStages: [],

      startedAt:
        nowIso(),

      completedAt:
        null,

      durationMs:
        0
    };
  }

  function summarizeOutput(
    stageId,
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

    switch (stageId) {
      case STAGE_IDS.TURN_INTAKE:
        return {
          turnId:
            firstNonEmptyString(
              output.turnId,
              output.currentTurnId,
              output.currentTurn &&
                output.currentTurn
                  .turnId,
              output.turn &&
                output.turn.turnId
            ),

          role:
            firstNonEmptyString(
              output.role,
              output.currentTurn &&
                output.currentTurn.role,
              output.turn &&
                output.turn.role
            )
        };

      case STAGE_IDS.SEMANTIC:
        return {
          authority:
            output.authority ||
            null,

          present:
            true
        };

      case STAGE_IDS.CONVERSATION_FUNCTION:
        return {
          authority:
            output.authority ||
            null,

          function:
            firstNonEmptyString(
              output.function,
              output
                .conversationFunction,
              output.type
            )
        };

      case STAGE_IDS.SAFETY:
        return {
          authority:
            output.authority ||
            null,

          severity:
            firstNonEmptyString(
              output.severity,
              output.level,
              output.riskLevel
            )
        };

      case STAGE_IDS.CONVERSATION_OS:
        return {
          ok:
            output.ok !== false,

          conversationId:
            firstNonEmptyString(
              output.conversationId,
              output
                .controllerResult &&
                output
                  .controllerResult
                  .conversationId
            ),

          activeThreadId:
            output.state &&
            firstNonEmptyString(
              output.state
                .activeConversationThreadId,
              output.state
                .conversationOSState &&
                output.state
                  .conversationOSState
                  .activeThreadId
            )
        };

      case STAGE_IDS.MODEL:
        return {
          ok:
            output.ok !== false,

          hasText:
            Boolean(
              firstNonEmptyString(
                output.text,
                output.response,
                output.content,
                output.message
              )
            )
        };

      case STAGE_IDS.FINAL_RESPONSE:
        return {
          hasText:
            Boolean(
              firstNonEmptyString(
                output.text,
                output.response,
                output.content,
                output.message
              )
            )
        };

      default:
        return {
          ok:
            output.ok !== false,

          component:
            output.component ||
            null,

          authority:
            output.authority ||
            null,

          status:
            output.status ||
            null
        };
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
      return output
        .diagnostics.warnings;
    }

    if (
      output.validation &&
      Array.isArray(
        output.validation.warnings
      )
    ) {
      return output
        .validation.warnings;
    }

    return [];
  }

  function recordStage(
    diagnostics,
    {
      stageId,
      componentKey,
      authority,
      status,
      required,
      startedAt,
      output = null,
      error = null,
      reason = null
    }
  ) {
    const warnings =
      extractWarnings(output);

    const entry = {
      stage:
        stageId,

      component:
        componentKey,

      authority:
        authority || null,

      required:
        required === true,

      status,

      durationMs:
        elapsedMilliseconds(
          startedAt
        ),

      reason:
        reason || null,

      outputSummary:
        summarizeOutput(
          stageId,
          output
        ),

      warningCount:
        warnings.length,

      warnings:
        safeClone(warnings),

      error:
        error
          ? safeError(error)
          : null
    };

    diagnostics.stages.push(
      entry
    );

    if (
      status ===
      STAGE_STATUS.COMPLETED
    ) {
      diagnostics
        .completedStages
        .push(stageId);
    }

    if (
      status ===
      STAGE_STATUS.SKIPPED
    ) {
      diagnostics
        .skippedStages
        .push(stageId);
    }

    if (
      status ===
      STAGE_STATUS.FAILED
    ) {
      diagnostics
        .failedStages
        .push(stageId);
    }

    if (warnings.length > 0) {
      diagnostics.warnings.push(
        ...warnings.map(
          (warning) => ({
            stage:
              stageId,

            ...safeClone(
              warning
            )
          })
        )
      );
    }

    if (error) {
      diagnostics.errors.push({
        stage:
          stageId,

        ...safeError(error)
      });
    }

    return entry;
  }

  /* =====================================================
     AUTHORITY SNAPSHOTS
  ===================================================== */

  function readFirstAuthorityValue(
    state,
    keys
  ) {
    for (const key of keys) {
      const value =
        state &&
        state[key];

      if (isObject(value)) {
        return value;
      }
    }

    return null;
  }

  function captureAuthoritySnapshot(
    state
  ) {
    return {
      semantic:
        safeClone(
          readFirstAuthorityValue(
            state,
            AUTHORITY_STATE_KEYS
              .semantic
          )
        ),

      conversationFunction:
        safeClone(
          readFirstAuthorityValue(
            state,
            AUTHORITY_STATE_KEYS
              .conversationFunction
          )
        ),

      safety:
        safeClone(
          readFirstAuthorityValue(
            state,
            AUTHORITY_STATE_KEYS
              .safety
          )
        )
    };
  }

  function validateAuthorityPreservation(
    before,
    after,
    {
      allowSemanticChange = false,
      allowConversationFunctionChange =
        false,
      allowSafetyChange = false
    } = {}
  ) {
    const errors = [];

    if (
      !allowSemanticChange &&
      before.semantic &&
      after.semantic &&
      !deepEquivalent(
        before.semantic,
        after.semantic
      )
    ) {
      errors.push({
        code:
          "REBIRTH_RUNTIME_SEMANTIC_AUTHORITY_OVERWRITE"
      });
    }

    if (
      !allowConversationFunctionChange &&
      before
        .conversationFunction &&
      after
        .conversationFunction &&
      !deepEquivalent(
        before
          .conversationFunction,
        after
          .conversationFunction
      )
    ) {
      errors.push({
        code:
          "REBIRTH_RUNTIME_CONVERSATION_FUNCTION_OVERWRITE"
      });
    }

    if (
      !allowSafetyChange &&
      before.safety &&
      after.safety &&
      !deepEquivalent(
        before.safety,
        after.safety
      )
    ) {
      errors.push({
        code:
          "REBIRTH_RUNTIME_SAFETY_AUTHORITY_OVERWRITE"
      });
    }

    return {
      valid:
        errors.length === 0,

      errors
    };
  }

  /* =====================================================
     STATE HELPERS
  ===================================================== */

  function ensureRuntimeStateShape(
    value,
    input
  ) {
    const state =
      isObject(value)
        ? safeClone(value)
        : {};

    state.schemaVersion =
      firstNonEmptyString(
        state.schemaVersion
      ) ||
      SCHEMA_VERSION;

    state.authority =
      firstNonEmptyString(
        state.authority
      ) ||
      "rebirth_runtime_state";

    state.component =
      firstNonEmptyString(
        state.component
      ) ||
      "rebirth-runtime-state";

    state.requestId =
      firstNonEmptyString(
        state.requestId,
        input.requestId
      ) || null;

    state.conversationId =
      firstNonEmptyString(
        state.conversationId,
        input.conversationId
      ) || null;

    state.userId =
      firstNonEmptyString(
        state.userId,
        input.userId
      ) || null;

    state.sessionId =
      firstNonEmptyString(
        state.sessionId,
        input.sessionId
      ) || null;

    state.rawInput =
      firstDefined(
        state.rawInput,
        input.message
      );

    state.message =
      firstDefined(
        state.message,
        input.message
      );

    state.history =
      Array.isArray(state.history)
        ? state.history
        : safeClone(
            input.history
          );

    state.userContext =
      isObject(state.userContext)
        ? state.userContext
        : safeClone(
            input.userContext
          );

    state.applicationContext =
      isObject(
        state.applicationContext
      )
        ? state.applicationContext
        : safeClone(
            input.applicationContext
          );

    state.uiMetadata =
      isObject(state.uiMetadata)
        ? state.uiMetadata
        : safeClone(
            input.uiMetadata
          );

    state.metadata =
      isObject(state.metadata)
        ? state.metadata
        : safeClone(
            input.metadata
          );

    state.commands =
      isObject(state.commands)
        ? state.commands
        : safeClone(
            input.commands
          );

    state.stageOutputs =
      isObject(state.stageOutputs)
        ? state.stageOutputs
        : {};

    state.stageStatus =
      isObject(state.stageStatus)
        ? state.stageStatus
        : {};

    state.revision =
      Math.max(
        0,
        normalizeInteger(
          state.revision,
          0
        )
      );

    state.createdAt =
      firstNonEmptyString(
        state.createdAt
      ) ||
      nowIso();

    state.updatedAt =
      nowIso();

    return state;
  }

  function mergeStageOutputIntoState(
    state,
    stageId,
    output
  ) {
    let next =
      safeClone(state);

    if (
      output &&
      isObject(output.state)
    ) {
      next = {
        ...next,
        ...safeClone(
          output.state
        )
      };
    } else if (
      stageId ===
      STAGE_IDS.STATE &&
      isObject(output)
    ) {
      next = {
        ...next,
        ...safeClone(output)
      };
    }

    next.stageOutputs =
      isObject(next.stageOutputs)
        ? next.stageOutputs
        : {};

    next.stageStatus =
      isObject(next.stageStatus)
        ? next.stageStatus
        : {};

    next.stageOutputs[
      stageId
    ] = safeClone(output);

    next.stageStatus[
      stageId
    ] = STAGE_STATUS.COMPLETED;

    switch (stageId) {
      case STAGE_IDS.TURN_INTAKE: {
        const turn =
          isObject(
            output.currentTurn
          )
            ? output.currentTurn
            : isObject(output.turn)
              ? output.turn
              : isObject(output)
                ? output
                : null;

        if (turn) {
          next.currentTurn =
            safeClone(turn);
        }

        break;
      }

      case STAGE_IDS.CONVERSATION:
        next.conversationRuntimeResult =
          safeClone(output);
        break;

      case STAGE_IDS.SEMANTIC:
        next.semanticPacket =
          safeClone(
            isObject(
              output.semanticPacket
            )
              ? output.semanticPacket
              : isObject(
                  output.semanticFrame
                )
                ? output.semanticFrame
                : output
          );
        break;

      case STAGE_IDS.CONVERSATION_FUNCTION:
        next.conversationFunction =
          safeClone(
            isObject(
              output
                .conversationFunction
            )
              ? output
                  .conversationFunction
              : output
          );
        break;

      case STAGE_IDS.SAFETY:
        next.safetyContext =
          safeClone(
            isObject(
              output.safetyContext
            )
              ? output.safetyContext
              : output
          );
        break;

      case STAGE_IDS.AUTHORITY_ORCHESTRATION:
        next.authorityResult =
          safeClone(output);
        break;

      case STAGE_IDS.CONVERSATION_OS:
        next.conversationOSStageResult =
          safeClone(output);

        if (
          output &&
          isObject(output.state)
        ) {
          next = {
            ...next,
            ...safeClone(
              output.state
            )
          };
        }

        break;

      case STAGE_IDS.CONTEXT:
        next.contextPacket =
          safeClone(
            isObject(
              output.contextPacket
            )
              ? output.contextPacket
              : output
          );
        break;

      case STAGE_IDS.RESPONSE:
        next.responsePlan =
          safeClone(
            isObject(
              output.responsePlan
            )
              ? output.responsePlan
              : output
          );
        break;

      case STAGE_IDS.MODEL:
        next.modelResult =
          safeClone(output);
        break;

      case STAGE_IDS.FINAL_RESPONSE:
        next.finalResponse =
          safeClone(output);
        break;

      default:
        break;
    }

    next.activeRuntimeStage =
      stageId;

    next.updatedAt =
      nowIso();

    return next;
  }

  function markSkippedStage(
    state,
    stageId,
    reason
  ) {
    const next =
      safeClone(state);

    next.stageStatus =
      isObject(next.stageStatus)
        ? next.stageStatus
        : {};

    next.stageOutputs =
      isObject(next.stageOutputs)
        ? next.stageOutputs
        : {};

    next.stageStatus[
      stageId
    ] = STAGE_STATUS.SKIPPED;

    next.stageOutputs[
      stageId
    ] = {
      skipped: true,
      reason
    };

    next.updatedAt =
      nowIso();

    return next;
  }

  /* =====================================================
     STAGE INPUT BUILDERS
  ===================================================== */

  function buildStageInput(
    stageId,
    input,
    state,
    options
  ) {
    const common = {
      requestId:
        firstNonEmptyString(
          state.requestId,
          input.requestId
        ) || null,

      conversationId:
        firstNonEmptyString(
          state.conversationId,
          input.conversationId
        ) || null,

      userId:
        firstNonEmptyString(
          state.userId,
          input.userId
        ) || null,

      sessionId:
        firstNonEmptyString(
          state.sessionId,
          input.sessionId
        ) || null,

      message:
        firstDefined(
          state.message,
          input.message
        ),

      currentTurn:
        isObject(state.currentTurn)
          ? safeClone(
              state.currentTurn
            )
          : input.currentTurn
            ? safeClone(
                input.currentTurn
              )
            : null,

      history:
        Array.isArray(state.history)
          ? safeClone(
              state.history
            )
          : safeClone(
              input.history
            ),

      state:
        safeClone(state),

      runtimeState:
        safeClone(state),

      userContext:
        safeClone(
          state.userContext ||
          input.userContext
        ),

      applicationContext:
        safeClone(
          state.applicationContext ||
          input.applicationContext
        ),

      uiMetadata:
        safeClone(
          state.uiMetadata ||
          input.uiMetadata
        ),

      metadata:
        safeClone(
          state.metadata ||
          input.metadata
        ),

      commands:
        safeClone(
          state.commands ||
          input.commands
        ),

      options:
        safeClone(options)
    };

    switch (stageId) {
      case STAGE_IDS.CONTRACT:
        return {
          ...common,

          input:
            safeClone(input)
        };

      case STAGE_IDS.STATE:
        return {
          ...common,

          input:
            safeClone(input),

          existingState:
            safeClone(
              input.runtimeState
            )
        };

      case STAGE_IDS.TURN_INTAKE:
        return {
          ...common,

          rawMessage:
            input.message,

          suppliedTurn:
            input.currentTurn
              ? safeClone(
                  input.currentTurn
                )
              : null
        };

      case STAGE_IDS.CONVERSATION:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null
        };

      case STAGE_IDS.SEMANTIC:
        return {
          ...common,

          conversationRuntime:
            state
              .conversationRuntimeResult ||
            null
        };

      case STAGE_IDS.CONVERSATION_FUNCTION:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationRuntime:
            state
              .conversationRuntimeResult ||
            null
        };

      case STAGE_IDS.SAFETY:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null
        };

      case STAGE_IDS.AUTHORITY_ORCHESTRATION:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null,

          safetyContext:
            state.safetyContext ||
            null,

          authorityPackets: {
            semantic:
              state.semanticPacket ||
              null,

            conversationFunction:
              state
                .conversationFunction ||
              null,

            safety:
              state.safetyContext ||
              null
          }
        };

      case STAGE_IDS.CONVERSATION_OS:
        return safeClone(state);

      case STAGE_IDS.CONTEXT:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null,

          safetyContext:
            state.safetyContext ||
            null,

          authorityResult:
            state.authorityResult ||
            null,

          conversationOSPacket:
            state
              .conversationOSPacket ||
            state.cosPacket ||
            null,

          conversationPlacement:
            state
              .conversationPlacement ||
            state.cosPlacement ||
            null,

          referenceResolution:
            state
              .referenceResolution ||
            state
              .cosReferenceResolution ||
            null,

          conversationContinuity:
            state
              .conversationContinuity ||
            null
        };

      case STAGE_IDS.RESPONSE:
        return {
          ...common,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null,

          safetyContext:
            state.safetyContext ||
            null,

          authorityResult:
            state.authorityResult ||
            null,

          contextPacket:
            state.contextPacket ||
            null,

          conversationOSPacket:
            state
              .conversationOSPacket ||
            state.cosPacket ||
            null,

          conversationPlacement:
            state
              .conversationPlacement ||
            state.cosPlacement ||
            null,

          referenceResolution:
            state
              .referenceResolution ||
            null
        };

      case STAGE_IDS.MODEL:
        return {
          ...common,

          responsePlan:
            state.responsePlan ||
            null,

          contextPacket:
            state.contextPacket ||
            null,

          safetyContext:
            state.safetyContext ||
            null,

          semanticPacket:
            state.semanticPacket ||
            null,

          conversationFunction:
            state
              .conversationFunction ||
            null,

          conversationOSPacket:
            state
              .conversationOSPacket ||
            state.cosPacket ||
            null
        };

      case STAGE_IDS.FINAL_RESPONSE:
        return {
          ...common,

          responsePlan:
            state.responsePlan ||
            null,

          modelResult:
            state.modelResult ||
            null,

          safetyContext:
            state.safetyContext ||
            null,

          conversationOSPacket:
            state
              .conversationOSPacket ||
            state.cosPacket ||
            null
        };

      case STAGE_IDS.RESULT:
        return {
          ...common,

          finalResponse:
            state.finalResponse ||
            null,

          modelResult:
            state.modelResult ||
            null,

          responsePlan:
            state.responsePlan ||
            null,

          contextPacket:
            state.contextPacket ||
            null
        };

      default:
        return common;
    }
  }

  /* =====================================================
     STAGE EXECUTION
  ===================================================== */

  async function executeInstalledStage(
    stageDefinition,
    stageInput,
    options
  ) {
    const execute =
      resolveCallable(
        stageDefinition.component,
        stageDefinition.methods,
        stageDefinition.id
      );

    if (
      stageDefinition.id ===
      STAGE_IDS.CONVERSATION_OS
    ) {
      return execute(
        stageInput,
        {
          ...options,

          controller:
            options
              .conversationOSController,

          cosComponents:
            isObject(
              options.cosComponents
            )
              ? options.cosComponents
              : {},

          persistence:
            options
              .conversationOSPersistence !==
            false,

          loadState:
            options
              .conversationOSLoadState !==
            false,

          saveState:
            options
              .conversationOSSaveState !==
            false,

          migrateState:
            options
              .conversationOSMigrateState !==
            false,

          storageAdapter:
            options
              .conversationOSStorageAdapter,

          storageKeyPrefix:
            options
              .conversationOSStorageKeyPrefix,

          stateSourcePolicy:
            options
              .conversationOSStateSourcePolicy,

          throwOnFailure:
            false,

          freeze:
            false
        }
      );
    }

    return execute(
      stageInput,
      {
        ...options,

        freeze:
          false
      }
    );
  }

  function validateStageOutput(
    stageId,
    output
  ) {
    if (
      output === undefined
    ) {
      return {
        valid: false,

        errors: [
          {
            code:
              "REBIRTH_RUNTIME_STAGE_OUTPUT_UNDEFINED",

            stage:
              stageId
          }
        ]
      };
    }

    if (
      isObject(output) &&
      output.ok === false
    ) {
      return {
        valid: false,

        errors:
          Array.isArray(
            output.errors
          )
            ? safeClone(
                output.errors
              )
            : [
                {
                  code:
                    "REBIRTH_RUNTIME_STAGE_REPORTED_FAILURE",

                  stage:
                    stageId
                }
              ]
      };
    }

    return {
      valid: true,
      errors: []
    };
  }

  /* =====================================================
     FALLBACK STAGES
  ===================================================== */

  function executeFallbackStage(
    stageId,
    input,
    state
  ) {
    switch (stageId) {
      case STAGE_IDS.CONTRACT:
        return {
          valid:
            isNonEmptyString(
              input.message
            ) ||
            isObject(
              input.currentTurn
            ),

          warnings: []
        };

      case STAGE_IDS.STATE:
        return ensureRuntimeStateShape(
          input.runtimeState,
          input
        );

      case STAGE_IDS.TURN_INTAKE: {
        const supplied =
          input.currentTurn;

        const turn =
          supplied
            ? safeClone(supplied)
            : {
                turnId:
                  `rebirth_turn_${Date.now()
                    .toString(36)}_${Math.random()
                    .toString(36)
                    .slice(2, 9)}`,

                role:
                  "user",

                text:
                  input.message,

                timestamp:
                  nowIso(),

                sequence:
                  Array.isArray(
                    input.history
                  )
                    ? input.history.length
                    : 0
              };

        return {
          currentTurn:
            turn,

          turn,

          turnId:
            firstNonEmptyString(
              turn.turnId,
              turn.id
            ),

          role:
            firstNonEmptyString(
              turn.role
            ) || "user"
        };
      }

      case STAGE_IDS.RESULT:
        return buildDefaultRuntimeResultPayload(
          state
        );

      default:
        return null;
    }
  }

  /* =====================================================
     FINAL RESPONSE READERS
  ===================================================== */

  function readResponseText(
    value
  ) {
    if (!value) {
      return null;
    }

    if (isNonEmptyString(value)) {
      return value.trim();
    }

    if (!isObject(value)) {
      return null;
    }

    return firstNonEmptyString(
      value.text,
      value.response,
      value.content,
      value.message,
      value.answer,
      value.outputText,
      value.output_text,
      value.finalText,
      value.final_text,
      value.modelResult &&
        value.modelResult.text,
      value.modelResult &&
        value.modelResult.response
    );
  }

  function buildDefaultFinalResponse(
    state
  ) {
    const modelText =
      readResponseText(
        state.modelResult
      );

    if (modelText) {
      return {
        text:
          modelText,

        source:
          "model_orchestration",

        complete:
          true
      };
    }

    const plannedText =
      readResponseText(
        state.responsePlan
      );

    if (plannedText) {
      return {
        text:
          plannedText,

        source:
          "response_orchestration",

        complete:
          true
      };
    }

    return {
      text: null,

      source:
        "unavailable",

      complete:
        false,

      reason:
        "No response-producing stage is installed or no response text was produced."
    };
  }

  function buildDefaultRuntimeResultPayload(
    state
  ) {
    const finalResponse =
      isObject(state.finalResponse)
        ? state.finalResponse
        : buildDefaultFinalResponse(
            state
          );

    return {
      response:
        safeClone(
          finalResponse
        ),

      text:
        readResponseText(
          finalResponse
        ),

      state:
        safeClone(state)
    };
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    overrides = {},
    options = {}
  ) {
    const executionMode =
      normalizeExecutionMode(
        options.executionMode
      );

    const components =
      resolveComponents(
        overrides
      );

    const definitions =
      createStageDefinitions(
        components
      );

    const requiredStages =
      determineRequiredStages({
        ...options,
        executionMode
      });

    const installed = {};
    const missingRequired = [];
    const missingOptional = [];

    for (
      const stageId of
        CANONICAL_STAGE_ORDER
    ) {
      const definition =
        definitions[stageId];

      const required =
        isStageRequired(
          stageId,
          definition,
          requiredStages
        );

      const available =
        Boolean(
          definition.component
        );

      installed[stageId] = {
        available,

        required,

        component:
          definition.componentKey,

        version:
          definition.component &&
          firstNonEmptyString(
            definition.component
              .version,
            definition.component
              .VERSION
          ),

        authority:
          definition.authority
      };

      if (!available) {
        if (required) {
          missingRequired.push(
            stageId
          );
        } else {
          missingOptional.push(
            stageId
          );
        }
      }
    }

    const ready =
      missingRequired.length === 0;

    return {
      ok:
        ready,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      executionMode,

      status:
        ready
          ? (
              missingOptional.length >
              0
                ? "ready_degraded"
                : "ready"
            )
          : "not_ready",

      canonicalStageOrder:
        [
          ...CANONICAL_STAGE_ORDER
        ],

      requiredStages,

      installed,

      missingRequired,

      missingOptional,

      checkedAt:
        nowIso()
    };
  }

  function assertReady(
    overrides = {},
    options = {}
  ) {
    const report =
      health(
        overrides,
        options
      );

    if (!report.ok) {
      throw new RebirthRuntimeControllerError(
        "REBIRTH_RUNTIME_NOT_READY",
        "ARI Rebirth runtime is not ready.",
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
     MAIN EXECUTION
  ===================================================== */

  async function run(
    rawInput = {},
    options = {}
  ) {
    const runtimeStartedAt =
      monotonicNow();

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

    const executionMode =
      normalizeExecutionMode(
        firstNonEmptyString(
          mergedOptions.executionMode,
          mergedOptions.execution_mode
        ) ||
        DEFAULT_EXECUTION_MODE
      );

    mergedOptions.executionMode =
      executionMode;

    const strict =
      executionMode ===
      "strict";

    const freeze =
      mergedOptions.freeze !== false;

    const throwOnFailure =
      mergedOptions.throwOnFailure ===
      true;

    const stopOnRequiredFailure =
      mergedOptions
        .stopOnRequiredFailure !==
      false;

    const continueAfterOptionalFailure =
      mergedOptions
        .continueAfterOptionalFailure !==
      false;

    const diagnostics =
      createDiagnostics(
        executionMode
      );

    const components =
      resolveComponents(
        isObject(
          mergedOptions.components
        )
          ? mergedOptions.components
          : {}
      );

    const definitions =
      createStageDefinitions(
        components
      );

    const requiredStages =
      determineRequiredStages(
        mergedOptions
      );

    let state =
      ensureRuntimeStateShape(
        input.runtimeState,
        input
      );

    let finalStageResult =
      null;

    let fatalError =
      null;

    const mark =
      isFunction(
        mergedOptions.mark
      )
        ? mergedOptions.mark
        : () => {};

    try {
      const readiness =
        health(
          isObject(
            mergedOptions.components
          )
            ? mergedOptions.components
            : {},
          mergedOptions
        );

      if (
        strict &&
        !readiness.ok
      ) {
        throw new RebirthRuntimeControllerError(
          "REBIRTH_RUNTIME_REQUIRED_COMPONENTS_MISSING",
          "Strict Rebirth runtime execution cannot begin because required stages are missing.",
          {
            stage:
              "component_resolution",

            details:
              readiness
          }
        );
      }

      for (
        const stageId of
          CANONICAL_STAGE_ORDER
      ) {
        const definition =
          definitions[stageId];

        const required =
          isStageRequired(
            stageId,
            definition,
            requiredStages
          );

        const stageStartedAt =
          monotonicNow();

        mark(
          `before:${stageId}`
        );

        if (
          !definition.component
        ) {
          const canFallback =
            [
              STAGE_IDS.CONTRACT,
              STAGE_IDS.STATE,
              STAGE_IDS.TURN_INTAKE,
              STAGE_IDS.RESULT
            ].includes(stageId);

          if (
            canFallback &&
            !strict
          ) {
            const fallbackOutput =
              executeFallbackStage(
                stageId,
                input,
                state
              );

            const validation =
              validateStageOutput(
                stageId,
                fallbackOutput
              );

            if (!validation.valid) {
              const error =
                new RebirthRuntimeControllerError(
                  "REBIRTH_RUNTIME_FALLBACK_STAGE_INVALID",
                  `Fallback stage failed: ${stageId}`,
                  {
                    stage:
                      stageId,

                    details:
                      validation
                  }
                );

              recordStage(
                diagnostics,
                {
                  stageId,
                  componentKey:
                    definition.componentKey,
                  authority:
                    definition.authority,
                  status:
                    STAGE_STATUS.FAILED,
                  required,
                  startedAt:
                    stageStartedAt,
                  error
                }
              );

              fatalError =
                error;

              break;
            }

            state =
              mergeStageOutputIntoState(
                state,
                stageId,
                fallbackOutput
              );

            if (
              stageId ===
              STAGE_IDS.RESULT
            ) {
              finalStageResult =
                fallbackOutput;
            }

            recordStage(
              diagnostics,
              {
                stageId,
                componentKey:
                  definition.componentKey,
                authority:
                  definition.authority,
                status:
                  STAGE_STATUS.DEGRADED,
                required,
                startedAt:
                  stageStartedAt,
                output:
                  fallbackOutput,
                reason:
                  "Development fallback executed because the production component is not installed."
              }
            );

            mark(
              `after:${stageId}`
            );

            continue;
          }

          const reason =
            required
              ? "Required stage component is not installed."
              : "Optional stage component is not installed.";

          state =
            markSkippedStage(
              state,
              stageId,
              reason
            );

          recordStage(
            diagnostics,
            {
              stageId,
              componentKey:
                definition.componentKey,
              authority:
                definition.authority,
              status:
                STAGE_STATUS.SKIPPED,
              required,
              startedAt:
                stageStartedAt,
              reason
            }
          );

          mark(
            `skipped:${stageId}`
          );

          if (required) {
            const error =
              new RebirthRuntimeControllerError(
                "REBIRTH_RUNTIME_REQUIRED_STAGE_MISSING",
                `Required Rebirth stage is missing: ${stageId}`,
                {
                  stage:
                    stageId,

                  details: {
                    component:
                      definition
                        .componentKey
                  }
                }
              );

            diagnostics.errors.push(
              safeError(error)
            );

            fatalError =
              error;

            if (
              stopOnRequiredFailure
            ) {
              break;
            }
          }

          continue;
        }

        const authorityBefore =
          captureAuthoritySnapshot(
            state
          );

        try {
          const stageInput =
            buildStageInput(
              stageId,
              input,
              state,
              mergedOptions
            );

          const output =
            await executeInstalledStage(
              definition,
              stageInput,
              mergedOptions
            );

          const validation =
            validateStageOutput(
              stageId,
              output
            );

          if (!validation.valid) {
            throw new RebirthRuntimeControllerError(
              "REBIRTH_RUNTIME_STAGE_RESULT_INVALID",
              `Rebirth stage returned an invalid result: ${stageId}`,
              {
                stage:
                  stageId,

                details:
                  validation
              }
            );
          }

          state =
            mergeStageOutputIntoState(
              state,
              stageId,
              output
            );

          const authorityAfter =
            captureAuthoritySnapshot(
              state
            );

          const authorityValidation =
            validateAuthorityPreservation(
              authorityBefore,
              authorityAfter,
              {
                allowSemanticChange:
                  stageId ===
                  STAGE_IDS.SEMANTIC,

                allowConversationFunctionChange:
                  stageId ===
                  STAGE_IDS
                    .CONVERSATION_FUNCTION,

                allowSafetyChange:
                  stageId ===
                  STAGE_IDS.SAFETY
              }
            );

          if (
            !authorityValidation.valid
          ) {
            throw new RebirthRuntimeControllerError(
              "REBIRTH_RUNTIME_AUTHORITY_BOUNDARY_VIOLATION",
              `Stage violated an upstream authority boundary: ${stageId}`,
              {
                stage:
                  stageId,

                details:
                  authorityValidation
              }
            );
          }

          if (
            stageId ===
            STAGE_IDS.RESULT
          ) {
            finalStageResult =
              output;
          }

          recordStage(
            diagnostics,
            {
              stageId,
              componentKey:
                definition.componentKey,
              authority:
                definition.authority,
              status:
                STAGE_STATUS.COMPLETED,
              required,
              startedAt:
                stageStartedAt,
              output
            }
          );

          mark(
            `after:${stageId}`
          );
        } catch (error) {
          const wrapped =
            error instanceof
            RebirthRuntimeControllerError
              ? error
              : new RebirthRuntimeControllerError(
                  "REBIRTH_RUNTIME_STAGE_FAILED",
                  `Rebirth runtime stage failed: ${stageId}`,
                  {
                    stage:
                      stageId,

                    cause:
                      error,

                    details: {
                      originalError:
                        safeError(
                          error
                        )
                    },

                    recoverable:
                      !required,

                    fatal:
                      required
                  }
                );

          recordStage(
            diagnostics,
            {
              stageId,
              componentKey:
                definition.componentKey,
              authority:
                definition.authority,
              status:
                STAGE_STATUS.FAILED,
              required,
              startedAt:
                stageStartedAt,
              error:
                wrapped
            }
          );

          state.stageStatus[
            stageId
          ] = STAGE_STATUS.FAILED;

          state.stageOutputs[
            stageId
          ] = {
            ok: false,

            error:
              safeError(
                wrapped
              )
          };

          mark(
            `failed:${stageId}`
          );

          if (required) {
            fatalError =
              wrapped;

            if (
              stopOnRequiredFailure
            ) {
              break;
            }
          } else if (
            !continueAfterOptionalFailure
          ) {
            fatalError =
              wrapped;

            break;
          }
        }
      }
    } catch (error) {
      fatalError =
        error instanceof
        RebirthRuntimeControllerError
          ? error
          : new RebirthRuntimeControllerError(
              "REBIRTH_RUNTIME_EXECUTION_FAILED",
              "ARI Rebirth runtime execution failed.",
              {
                cause:
                  error,

                details: {
                  originalError:
                    safeError(error)
                }
              }
            );
    }

    diagnostics.completedAt =
      nowIso();

    diagnostics.durationMs =
      elapsedMilliseconds(
        runtimeStartedAt
      );

    state.revision =
      Math.max(
        0,
        normalizeInteger(
          state.revision,
          0
        )
      ) + 1;

    state.updatedAt =
      nowIso();

    state.runtimeDiagnostics =
      safeClone(
        diagnostics
      );

    const failedRequiredStages =
      diagnostics.stages
        .filter(
          (stage) =>
            stage.required &&
            (
              stage.status ===
                STAGE_STATUS.FAILED ||
              stage.status ===
                STAGE_STATUS.SKIPPED
            )
        )
        .map(
          (stage) =>
            stage.stage
        );

    const degraded =
      diagnostics
        .skippedStages.length >
        0 ||
      diagnostics
        .failedStages.length >
        0 ||
      diagnostics.stages.some(
        (stage) =>
          stage.status ===
          STAGE_STATUS.DEGRADED
      );

    const ok =
      !fatalError &&
      failedRequiredStages.length ===
        0;

    const defaultPayload =
      buildDefaultRuntimeResultPayload(
        state
      );

    const response =
      finalStageResult &&
      isObject(
        finalStageResult.response
      )
        ? safeClone(
            finalStageResult.response
          )
        : isObject(
            state.finalResponse
          )
          ? safeClone(
              state.finalResponse
            )
          : safeClone(
              defaultPayload.response
            );

    const result = {
      ok,

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

      executionMode,

      status:
        ok
          ? (
              degraded
                ? "completed_degraded"
                : "completed"
            )
          : "failed",

      requestId:
        firstNonEmptyString(
          state.requestId,
          input.requestId
        ) || null,

      conversationId:
        firstNonEmptyString(
          state.conversationId,
          input.conversationId,
          state
            .conversationOSState &&
            state
              .conversationOSState
              .conversationId
        ) || null,

      currentTurn:
        state.currentTurn
          ? safeClone(
              state.currentTurn
            )
          : null,

      currentTurnId:
        firstNonEmptyString(
          state.currentTurn &&
            state.currentTurn
              .turnId,
          state.currentTurn &&
            state.currentTurn.id,
          state
            .conversationOSState &&
            state
              .conversationOSState
              .activeTurnId
        ) || null,

      response,

      text:
        readResponseText(
          response
        ),

      state:
        safeClone(state),

      semanticPacket:
        state.semanticPacket
          ? safeClone(
              state.semanticPacket
            )
          : null,

      conversationFunction:
        state
          .conversationFunction
          ? safeClone(
              state
                .conversationFunction
            )
          : null,

      safetyContext:
        state.safetyContext
          ? safeClone(
              state.safetyContext
            )
          : null,

      authorityResult:
        state.authorityResult
          ? safeClone(
              state.authorityResult
            )
          : null,

      conversationOS: {
        result:
          state
            .conversationOSResult
            ? safeClone(
                state
                  .conversationOSResult
              )
            : state
                .conversationOSStageResult
              ? safeClone(
                  state
                    .conversationOSStageResult
                )
              : null,

        state:
          state
            .conversationOSState
            ? safeClone(
                state
                  .conversationOSState
              )
            : null,

        packet:
          state
            .conversationOSPacket
            ? safeClone(
                state
                  .conversationOSPacket
              )
            : state.cosPacket
              ? safeClone(
                  state.cosPacket
                )
              : null,

        placement:
          state
            .conversationPlacement
            ? safeClone(
                state
                  .conversationPlacement
              )
            : state.cosPlacement
              ? safeClone(
                  state.cosPlacement
                )
              : null,

        referenceResolution:
          state
            .referenceResolution
            ? safeClone(
                state
                  .referenceResolution
              )
            : state
                .cosReferenceResolution
              ? safeClone(
                  state
                    .cosReferenceResolution
                )
              : null,

        continuity:
          state
            .conversationContinuity
            ? safeClone(
                state
                  .conversationContinuity
              )
            : null
      },

      contextPacket:
        state.contextPacket
          ? safeClone(
              state.contextPacket
            )
          : null,

      responsePlan:
        state.responsePlan
          ? safeClone(
              state.responsePlan
            )
          : null,

      modelResult:
        state.modelResult
          ? safeClone(
              state.modelResult
            )
          : null,

      finalResponse:
        state.finalResponse
          ? safeClone(
              state.finalResponse
            )
          : response,

      completedStages:
        [
          ...diagnostics
            .completedStages
        ],

      skippedStages:
        [
          ...diagnostics
            .skippedStages
        ],

      failedStages:
        [
          ...diagnostics
            .failedStages
        ],

      failedRequiredStages,

      degraded,

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

      errors:
        fatalError
          ? [
              safeError(
                fatalError
              )
            ]
          : safeClone(
              diagnostics.errors
            )
    };

    if (
      fatalError &&
      throwOnFailure
    ) {
      throw fatalError;
    }

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

        throwOnFailure:
          false
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

  async function runDevelopment(
    input = {},
    options = {}
  ) {
    return run(
      input,
      {
        ...options,

        executionMode:
          "development"
      }
    );
  }

  async function runStrict(
    input = {},
    options = {}
  ) {
    return run(
      input,
      {
        ...options,

        executionMode:
          "strict"
      }
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const rebirthRuntimeController = {
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

    executionModes:
      EXECUTION_MODES,

    defaultExecutionMode:
      DEFAULT_EXECUTION_MODE,

    stageStatus:
      STAGE_STATUS,

    stageIds:
      STAGE_IDS,

    canonicalStageOrder:
      CANONICAL_STAGE_ORDER,

    defaultRequiredStages:
      DEFAULT_REQUIRED_STAGES,

    productionRequiredStages:
      PRODUCTION_REQUIRED_STAGES,

    authorityNames:
      AUTHORITY_NAMES,

    RebirthRuntimeControllerError,

    run,

    execute,

    process,

    safeRun,

    runDevelopment,

    runStrict,

    health,

    assertReady,

    normalizeInput:
      normalizeRuntimeInput,

    normalizeExecutionMode,

    resolveComponents,

    resolveCallable,

    createStageDefinitions,

    determineRequiredStages,

    buildStageInput,

    validateStageOutput,

    captureAuthoritySnapshot,

    validateAuthorityPreservation,

    ensureRuntimeStateShape,

    mergeStageOutputIntoState,

    buildDefaultFinalResponse,

    buildDefaultRuntimeResultPayload,

    readResponseText
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  Core.runtimeController =
    rebirthRuntimeController;

  Core.rebirthRuntimeController =
    rebirthRuntimeController;

  Rebirth.runtimeController =
    rebirthRuntimeController;

  root.AriRebirthRuntimeController =
    rebirthRuntimeController;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      rebirthRuntimeController;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);