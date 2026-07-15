// rebirth/conversation-os/cos-controller.js
// ARI Rebirth — Conversation Operating System Controller
//
// Purpose:
// Provide the single public integration entry point for the ARI Rebirth
// Conversation Operating System.
//
// V1.0.0 — Canonical COS Integration Controller
//
// Canonical flow:
//
// Rebirth Runtime / App Bridge
//      ↓
// COS Controller
//      ↓
// Installation Verification
//      ↓
// Runtime Input Preparation
//      ↓
// COS Runtime Execution
//      ↓
// Result Verification
//      ↓
// Authoritative Conversation Placement Packet
//
// Authority:
//
// The COS Controller is authoritative only for:
//
// - exposing the public COS execution API,
// - locating installed COS components,
// - verifying minimum COS installation readiness,
// - preparing runtime input without interpreting language,
// - invoking the canonical COS runtime,
// - preserving the runtime result,
// - exposing the authoritative placement packet,
// - exposing structured installation and health diagnostics.
//
// Non-authority:
//
// This controller must not:
//
// - interpret semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve natural-language references,
// - independently determine conversation placement,
// - override runtime conclusions,
// - repair invalid placement by guessing,
// - alter the current-turn text,
// - plan or generate a response.
//
// Architectural rule:
//
// The controller coordinates the Conversation Operating System as a whole.
//
// All placement authority remains inside the canonical COS runtime chain:
//
// - history index,
// - turn register,
// - reference resolver,
// - placement engine,
// - thread-state manager,
// - placement validator,
// - packet builder.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.controller
//
// CommonJS:
//
// module.exports = cosController

(function initializeCosController(globalScope) {
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
    "cos-controller";

  const REQUIRED_COMPONENTS = Object.freeze([
    "contract",
    "state",
    "runtime",
    "historyIndex",
    "turnRegister",
    "referenceResolver",
    "placementEngine",
    "threadStateManager",
    "placementValidator",
    "packetBuilder"
  ]);

  const COMPONENT_ALIASES = Object.freeze({
    contract: [
      "contract",
      "cosContract",
      "CosContract",
      "COSContract"
    ],

    state: [
      "state",
      "cosState",
      "CosState",
      "COSState"
    ],

    runtime: [
      "runtime",
      "cosRuntime",
      "CosRuntime",
      "COSRuntime"
    ],

    historyIndex: [
      "historyIndex",
      "historyIndexer",
      "cosHistoryIndex",
      "CosHistoryIndex",
      "COSHistoryIndex"
    ],

    turnRegister: [
      "turnRegister",
      "currentTurnRegister",
      "cosTurnRegister",
      "CosTurnRegister",
      "COSTurnRegister"
    ],

    referenceResolver: [
      "referenceResolver",
      "cosReferenceResolver",
      "CosReferenceResolver",
      "COSReferenceResolver"
    ],

    placementEngine: [
      "placementEngine",
      "conversationPlacementEngine",
      "cosPlacementEngine",
      "CosPlacementEngine",
      "COSPlacementEngine"
    ],

    threadStateManager: [
      "threadStateManager",
      "cosThreadStateManager",
      "CosThreadStateManager",
      "COSThreadStateManager"
    ],

    placementValidator: [
      "placementValidator",
      "cosPlacementValidator",
      "CosPlacementValidator",
      "COSPlacementValidator"
    ],

    packetBuilder: [
      "packetBuilder",
      "cosPacketBuilder",
      "CosPacketBuilder",
      "COSPacketBuilder"
    ]
  });

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosControllerError extends Error {
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
        "COS controller error"
      );

      this.name =
        "CosControllerError";

      this.code =
        code ||
        "COS_CONTROLLER_ERROR";

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
          CosControllerError
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
    return deepFreeze(
      safeClone(value)
    );
  }

  function createId(prefix = "cos") {
    const timestamp =
      Date.now().toString(36);

    let randomPart = "";

    if (
      typeof crypto !== "undefined" &&
      crypto &&
      isFunction(
        crypto.getRandomValues
      )
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

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name || "Error",

        code:
          firstNonEmptyString(
            error.code
          ) || "COS_CONTROLLER_ERROR",

        message:
          error.message ||
          "Unknown COS controller error",

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
      code: "COS_CONTROLLER_ERROR",
      message:
        isNonEmptyString(error)
          ? error
          : "Unknown COS controller error",
      recoverable: false,
      details: safeClone(error),
      cause: null
    };
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function getNamespaces() {
    return [
      ConversationOS,
      ConversationOS.core,
      ConversationOS.indexing,
      ConversationOS.turns,
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
  }

  function resolveComponent(
    componentName,
    override = null
  ) {
    if (override) {
      return override;
    }

    const aliases =
      COMPONENT_ALIASES[
        componentName
      ] || [];

    const namespaces =
      getNamespaces();

    for (
      const namespace of namespaces
    ) {
      for (const alias of aliases) {
        if (namespace[alias]) {
          return namespace[alias];
        }
      }
    }

    return null;
  }

  function resolveAllComponents(
    overrides = {}
  ) {
    const components = {};

    for (
      const componentName of
        REQUIRED_COMPONENTS
    ) {
      components[componentName] =
        resolveComponent(
          componentName,
          overrides[componentName]
        );
    }

    return components;
  }

  function readComponentVersion(
    component
  ) {
    if (!component) {
      return null;
    }

    return firstNonEmptyString(
      component.version,
      component.VERSION,
      component.componentVersion,
      component.component_version
    );
  }

  function readComponentAuthority(
    component
  ) {
    if (!component) {
      return null;
    }

    return firstNonEmptyString(
      component.authority,
      component.AUTHORITY
    );
  }

  function readComponentName(
    component,
    fallback
  ) {
    if (!component) {
      return fallback;
    }

    return (
      firstNonEmptyString(
        component.component,
        component.componentName,
        component.component_name,
        component.name
      ) || fallback
    );
  }

  /* =====================================================
     INSTALLATION INSPECTION
  ===================================================== */

  function inspectInstallation(
    overrides = {}
  ) {
    const components =
      resolveAllComponents(overrides);

    const componentStatus = {};
    const missing = [];
    const authorityMismatches = [];
    const warnings = [];

    for (
      const componentName of
        REQUIRED_COMPONENTS
    ) {
      const component =
        components[componentName];

      const available =
        Boolean(component);

      if (!available) {
        missing.push(
          componentName
        );
      }

      const componentAuthority =
        readComponentAuthority(
          component
        );

      if (
        available &&
        componentAuthority &&
        componentAuthority !==
          AUTHORITY
      ) {
        authorityMismatches.push({
          component:
            componentName,

          expectedAuthority:
            AUTHORITY,

          actualAuthority:
            componentAuthority
        });
      }

      if (
        available &&
        !readComponentVersion(
          component
        )
      ) {
        warnings.push({
          code:
            "COS_COMPONENT_VERSION_UNDECLARED",

          component:
            componentName
        });
      }

      componentStatus[
        componentName
      ] = {
        available,

        component:
          readComponentName(
            component,
            componentName
          ),

        version:
          readComponentVersion(
            component
          ),

        authority:
          componentAuthority
      };
    }

    const runtime =
      components.runtime;

    const runtimeCallable =
      Boolean(
        runtime &&
        (
          isFunction(runtime) ||
          isFunction(runtime.run)
        )
      );

    if (
      runtime &&
      !runtimeCallable
    ) {
      warnings.push({
        code:
          "COS_RUNTIME_NOT_CALLABLE"
      });
    }

    const ready =
      missing.length === 0 &&
      authorityMismatches.length ===
        0 &&
      runtimeCallable;

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      controllerVersion:
        VERSION,

      ready,

      requiredComponents:
        [...REQUIRED_COMPONENTS],

      components:
        componentStatus,

      missingComponents:
        missing,

      authorityMismatches,

      warnings,

      inspectedAt:
        nowIso()
    };
  }

  function assertInstallation(
    overrides = {}
  ) {
    const inspection =
      inspectInstallation(overrides);

    if (!inspection.ready) {
      throw new CosControllerError(
        "COS_INSTALLATION_NOT_READY",
        "Conversation Operating System installation is not ready.",
        {
          details:
            inspection
        }
      );
    }

    return inspection;
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeControllerInput(
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
        source.message,
        source.input,
        null
      );

    const history =
      firstDefined(
        source.history,
        source.turns,
        source.conversationHistory,
        source.conversation_history,
        []
      );

    const state =
      firstDefined(
        source.state,
        source.cosState,
        source.cos_state,
        source.previousState,
        source.previous_state,
        null
      );

    return {
      schemaVersion:
        firstNonEmptyString(
          source.schemaVersion,
          source.schema_version
        ) || SCHEMA_VERSION,

      requestId:
        firstNonEmptyString(
          source.requestId,
          source.request_id
        ) || createId("cos_request"),

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          state &&
            state.conversationId,
          state &&
            state.conversation_id
        ) || null,

      currentTurn,

      history:
        Array.isArray(history)
          ? history
          : [],

      state:
        isObject(state)
          ? state
          : null,

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

  function buildRuntimeInput(
    normalizedInput,
    options = {}
  ) {
    return {
      schemaVersion:
        normalizedInput.schemaVersion,

      requestId:
        normalizedInput.requestId,

      conversationId:
        normalizedInput.conversationId,

      currentTurn:
        normalizedInput.currentTurn,

      history:
        normalizedInput.history,

      state:
        normalizedInput.state,

      metadata:
        normalizedInput.metadata,

      options: {
        ...normalizedInput.options,
        ...safeClone(options.runtimeOptions || {})
      }
    };
  }

  /* =====================================================
     RUNTIME INVOCATION
  ===================================================== */

  function resolveRuntimeCallable(
    runtime
  ) {
    if (isFunction(runtime)) {
      return runtime.bind(runtime);
    }

    if (
      runtime &&
      isFunction(runtime.run)
    ) {
      return runtime.run.bind(runtime);
    }

    throw new CosControllerError(
      "COS_RUNTIME_NOT_CALLABLE",
      "Installed COS runtime does not expose a callable run method."
    );
  }

  async function invokeRuntime({
    runtime,
    runtimeInput,
    runtimeOptions
  }) {
    const run =
      resolveRuntimeCallable(
        runtime
      );

    return run(
      runtimeInput,
      runtimeOptions
    );
  }

  /* =====================================================
     RESULT VALIDATION
  ===================================================== */

  function validateRuntimeResult(result) {
    const errors = [];
    const warnings = [];

    if (!isObject(result)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_CONTROLLER_RESULT_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    if (
      typeof result.ok !== "boolean"
    ) {
      errors.push({
        code:
          "COS_CONTROLLER_RESULT_OK_INVALID"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.packet)
    ) {
      errors.push({
        code:
          "COS_CONTROLLER_SUCCESS_PACKET_MISSING"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.state)
    ) {
      errors.push({
        code:
          "COS_CONTROLLER_SUCCESS_STATE_MISSING"
      });
    }

    if (
      result.ok === false &&
      !Array.isArray(result.errors)
    ) {
      errors.push({
        code:
          "COS_CONTROLLER_FAILURE_ERRORS_MISSING"
      });
    }

    if (
      result.ok === false &&
      result.packet !== null
    ) {
      warnings.push({
        code:
          "COS_CONTROLLER_FAILURE_PACKET_PRESENT"
      });
    }

    if (
      result.packet &&
      result.packet.authority !==
        AUTHORITY
    ) {
      errors.push({
        code:
          "COS_CONTROLLER_PACKET_AUTHORITY_INVALID",

        authority:
          result.packet.authority
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  function validateAuthoritativePacket(
    packet,
    packetBuilder
  ) {
    if (!packetBuilder) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PACKET_BUILDER_UNAVAILABLE"
          }
        ],

        warnings: []
      };
    }

    const validate =
      isFunction(
        packetBuilder.validatePacket
      )
        ? packetBuilder
            .validatePacket
            .bind(packetBuilder)
        : isFunction(
            packetBuilder.validate
          )
          ? packetBuilder
              .validate
              .bind(packetBuilder)
          : null;

    if (!validate) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PACKET_VALIDATOR_UNAVAILABLE"
          }
        ],

        warnings: []
      };
    }

    const result =
      validate(packet);

    if (result === true) {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

    if (result === false) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_PACKET_VALIDATION_REJECTED"
          }
        ],

        warnings: []
      };
    }

    if (isObject(result)) {
      return {
        valid:
          result.valid !== false,

        errors:
          Array.isArray(result.errors)
            ? result.errors
            : [],

        warnings:
          Array.isArray(
            result.warnings
          )
            ? result.warnings
            : []
      };
    }

    return {
      valid: Boolean(result),
      errors: [],
      warnings: []
    };
  }

  /* =====================================================
     CONTROLLER RESULT
  ===================================================== */

  function buildControllerSuccess({
    input,
    runtimeResult,
    installation,
    packetValidation,
    options
  }) {
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

      requestId:
        input.requestId,

      conversationId:
        firstNonEmptyString(
          runtimeResult.runtime &&
            runtimeResult.runtime
              .conversationId,

          runtimeResult.state &&
            runtimeResult.state
              .conversationId,

          input.conversationId
        ) || null,

      packet:
        runtimeResult.packet,

      state:
        runtimeResult.state,

      runtimeResult,

      installation:
        options.includeInstallation ===
          true
          ? installation
          : null,

      packetValidation:
        options.includeValidation ===
          true
          ? packetValidation
          : null,

      completedAt:
        nowIso(),

      errors: []
    };

    return options.freezeResult === true
      ? freezeClone(result)
      : result;
  }

  function buildControllerFailure({
    input,
    runtimeResult = null,
    installation = null,
    error,
    options
  }) {
    const normalizedError =
      safeError(error);

    const runtimeErrors =
      runtimeResult &&
      Array.isArray(
        runtimeResult.errors
      )
        ? safeClone(
            runtimeResult.errors
          )
        : [];

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

      requestId:
        input &&
        input.requestId
          ? input.requestId
          : null,

      conversationId:
        firstNonEmptyString(
          runtimeResult &&
            runtimeResult.runtime &&
            runtimeResult.runtime
              .conversationId,

          runtimeResult &&
            runtimeResult.state &&
            runtimeResult.state
              .conversationId,

          input &&
            input.conversationId
        ) || null,

      packet: null,

      state:
        runtimeResult &&
        runtimeResult.state
          ? runtimeResult.state
          : input &&
              input.state
            ? safeClone(input.state)
            : null,

      runtimeResult,

      installation:
        options.includeInstallation ===
          true
          ? installation
          : null,

      completedAt:
        nowIso(),

      errors: [
        normalizedError,
        ...runtimeErrors
      ]
    };

    return options.freezeResult === true
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     PUBLIC EXECUTION
  ===================================================== */

  async function run(
    rawInput = {},
    controllerOptions = {}
  ) {
    const input =
      normalizeControllerInput(
        rawInput
      );

    const options = {
      strictInstallation:
        controllerOptions
          .strictInstallation !== false,

      includeInstallation:
        controllerOptions
          .includeInstallation === true,

      includeValidation:
        controllerOptions
          .includeValidation === true,

      freezeResult:
        controllerOptions
          .freezeResult === true,

      throwOnFailure:
        controllerOptions
          .throwOnFailure === true,

      runtimeOptions:
        isObject(
          controllerOptions.runtimeOptions
        )
          ? safeClone(
              controllerOptions
                .runtimeOptions
            )
          : {},

      components:
        isObject(
          controllerOptions.components
        )
          ? controllerOptions.components
          : {}
    };

    let installation = null;
    let runtimeResult = null;

    try {
      installation =
        inspectInstallation(
          options.components
        );

      if (
        options.strictInstallation &&
        !installation.ready
      ) {
        throw new CosControllerError(
          "COS_INSTALLATION_NOT_READY",
          "Conversation Operating System installation is not ready.",
          {
            details:
              installation
          }
        );
      }

      const components =
        resolveAllComponents(
          options.components
        );

      if (!components.runtime) {
        throw new CosControllerError(
          "COS_RUNTIME_MISSING",
          "Conversation Operating System runtime is not installed."
        );
      }

      const runtimeInput =
        buildRuntimeInput(
          input,
          options
        );

      runtimeResult =
        await invokeRuntime({
          runtime:
            components.runtime,

          runtimeInput,

          runtimeOptions: {
            ...options.runtimeOptions,

            components: {
              contract:
                components.contract,

              state:
                components.state,

              historyIndex:
                components.historyIndex,

              turnRegister:
                components.turnRegister,

              referenceResolver:
                components.referenceResolver,

              placementEngine:
                components.placementEngine,

              threadStateManager:
                components.threadStateManager,

              placementValidator:
                components.placementValidator,

              packetBuilder:
                components.packetBuilder
            }
          }
        });

      const runtimeValidation =
        validateRuntimeResult(
          runtimeResult
        );

      if (!runtimeValidation.valid) {
        throw new CosControllerError(
          "COS_RUNTIME_RESULT_INVALID",
          "Conversation Operating System runtime returned an invalid result.",
          {
            details:
              runtimeValidation
          }
        );
      }

      if (runtimeResult.ok !== true) {
        throw new CosControllerError(
          "COS_RUNTIME_EXECUTION_FAILED",
          "Conversation Operating System runtime execution failed.",
          {
            details: {
              errors:
                runtimeResult.errors ||
                [],

              failedStage:
                runtimeResult.runtime &&
                runtimeResult.runtime
                  .failedStage
            }
          }
        );
      }

      const packetValidation =
        validateAuthoritativePacket(
          runtimeResult.packet,
          components.packetBuilder
        );

      if (!packetValidation.valid) {
        throw new CosControllerError(
          "COS_AUTHORITATIVE_PACKET_INVALID",
          "Conversation Operating System produced an invalid authoritative placement packet.",
          {
            details:
              packetValidation
          }
        );
      }

      return buildControllerSuccess({
        input,
        runtimeResult,
        installation,
        packetValidation,
        options
      });
    } catch (error) {
      const failure =
        buildControllerFailure({
          input,
          runtimeResult,
          installation,
          error,
          options
        });

      if (options.throwOnFailure) {
        if (error instanceof Error) {
          error.cosControllerResult =
            failure;
        }

        throw error;
      }

      return failure;
    }
  }

  /* =====================================================
     PACKET-ONLY API
  ===================================================== */

  async function place(
    rawInput = {},
    controllerOptions = {}
  ) {
    const result = await run(
      rawInput,
      controllerOptions
    );

    if (!result.ok) {
      return {
        ok: false,
        packet: null,
        state: result.state,
        errors: result.errors
      };
    }

    return {
      ok: true,
      packet: result.packet,
      state: result.state,
      errors: []
    };
  }

  async function getPacket(
    rawInput = {},
    controllerOptions = {}
  ) {
    const result = await run(
      rawInput,
      {
        ...controllerOptions,
        throwOnFailure: true
      }
    );

    return result.packet;
  }

  /* =====================================================
     HEALTH API
  ===================================================== */

  function health(
    overrides = {}
  ) {
    const installation =
      inspectInstallation(overrides);

    return {
      ok:
        installation.ready,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      status:
        installation.ready
          ? "ready"
          : "not_ready",

      installation,

      checkedAt:
        nowIso()
    };
  }

  /* =====================================================
     RESET / STATE HELPERS
  ===================================================== */

  function createEmptyState({
    conversationId = null
  } = {}) {
    const stateComponent =
      resolveComponent(
        "state"
      );

    if (stateComponent) {
      const create =
        isFunction(
          stateComponent.create
        )
          ? stateComponent
              .create
              .bind(stateComponent)
          : isFunction(
              stateComponent.initialize
            )
            ? stateComponent
                .initialize
                .bind(stateComponent)
            : isFunction(
                stateComponent
                  .createInitialState
              )
              ? stateComponent
                  .createInitialState
                  .bind(stateComponent)
              : null;

      if (create) {
        const result = create({
          conversationId:
            conversationId ||
            createId("conversation")
        });

        if (
          result &&
          isFunction(result.then)
        ) {
          throw new CosControllerError(
            "COS_ASYNC_STATE_FACTORY_UNSUPPORTED",
            "Use createEmptyStateAsync when the installed COS state factory is asynchronous."
          );
        }

        return result;
      }
    }

    const timestamp = nowIso();

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      conversationId:
        conversationId ||
        createId("conversation"),

      revision: 0,

      activeThreadId: null,
      activeTurnId: null,

      threads: {},
      turns: {},

      threadStack: [],
      interruptionStack: [],

      lastPlacement: null,
      lastReferenceResolution: null,

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };
  }

  async function createEmptyStateAsync({
    conversationId = null
  } = {}) {
    const stateComponent =
      resolveComponent(
        "state"
      );

    if (stateComponent) {
      const create =
        isFunction(
          stateComponent.create
        )
          ? stateComponent
              .create
              .bind(stateComponent)
          : isFunction(
              stateComponent.initialize
            )
            ? stateComponent
                .initialize
                .bind(stateComponent)
            : isFunction(
                stateComponent
                  .createInitialState
              )
              ? stateComponent
                  .createInitialState
                  .bind(stateComponent)
              : null;

      if (create) {
        return await create({
          conversationId:
            conversationId ||
            createId("conversation")
        });
      }
    }

    return createEmptyState({
      conversationId
    });
  }

  /* =====================================================
     PUBLIC CONTROLLER
  ===================================================== */

  const cosController = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    requiredComponents:
      REQUIRED_COMPONENTS,

    CosControllerError,

    run,

    execute:
      run,

    process:
      run,

    place,

    getPacket,

    inspectInstallation,

    assertInstallation,

    health,

    normalizeInput:
      normalizeControllerInput,

    createEmptyState,

    createEmptyStateAsync
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.controller =
    cosController;

  ConversationOS.cosController =
    cosController;

  ConversationOS.run =
    run;

  root.AriCosController =
    cosController;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosController;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);