// rebirth/conversation-os/index.js
// ARI Rebirth — Conversation Operating System Public Index
//
// Purpose:
// Expose the complete Conversation Operating System through one stable,
// public integration surface.
//
// V1.0.0 — Canonical COS Public Module Index
//
// Canonical responsibility:
//
// - Verify that all COS components are installed.
// - Expose the canonical controller and runtime.
// - Expose supporting COS components for diagnostics and testing.
// - Provide one stable `run()` entry point.
// - Provide one stable `place()` entry point.
// - Provide COS health and installation inspection.
// - Preserve all authority boundaries established by the COS architecture.
//
// Non-responsibility:
//
// This file must not:
//
// - interpret user language,
// - classify semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve references,
// - determine placement independently,
// - mutate COS state independently,
// - build placement packets independently,
// - generate a response.
//
// Architectural rule:
//
// This file is a public barrel and integration surface only.
//
// All actual conversation-placement authority remains inside:
//
// - cos-contract.js
// - cos-state.js
// - cos-runtime.js
// - cos-history-index.js
// - cos-turn-register.js
// - cos-reference-resolver.js
// - cos-placement-engine.js
// - cos-thread-state-manager.js
// - cos-placement-validator.js
// - cos-packet-builder.js
// - cos-controller.js
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
//
// Public aliases:
//
// window.Ari.Rebirth.ConversationOS.index
// window.Ari.Rebirth.ConversationOS.api
// window.AriConversationOS
//
// CommonJS:
//
// module.exports = conversationOSIndex

(function initializeConversationOSIndex(globalScope) {
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
    "conversation-os-index";

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
    "packetBuilder",
    "controller"
  ]);

  const COMPONENT_ALIASES = Object.freeze({
    contract: Object.freeze([
      "contract",
      "cosContract",
      "CosContract",
      "COSContract"
    ]),

    state: Object.freeze([
      "state",
      "cosState",
      "CosState",
      "COSState"
    ]),

    runtime: Object.freeze([
      "runtime",
      "cosRuntime",
      "CosRuntime",
      "COSRuntime"
    ]),

    historyIndex: Object.freeze([
      "historyIndex",
      "historyIndexer",
      "cosHistoryIndex",
      "CosHistoryIndex",
      "COSHistoryIndex"
    ]),

    turnRegister: Object.freeze([
      "turnRegister",
      "currentTurnRegister",
      "cosTurnRegister",
      "CosTurnRegister",
      "COSTurnRegister"
    ]),

    referenceResolver: Object.freeze([
      "referenceResolver",
      "cosReferenceResolver",
      "CosReferenceResolver",
      "COSReferenceResolver"
    ]),

    placementEngine: Object.freeze([
      "placementEngine",
      "conversationPlacementEngine",
      "cosPlacementEngine",
      "CosPlacementEngine",
      "COSPlacementEngine"
    ]),

    threadStateManager: Object.freeze([
      "threadStateManager",
      "cosThreadStateManager",
      "CosThreadStateManager",
      "COSThreadStateManager"
    ]),

    placementValidator: Object.freeze([
      "placementValidator",
      "cosPlacementValidator",
      "CosPlacementValidator",
      "COSPlacementValidator"
    ]),

    packetBuilder: Object.freeze([
      "packetBuilder",
      "cosPacketBuilder",
      "CosPacketBuilder",
      "COSPacketBuilder"
    ]),

    controller: Object.freeze([
      "controller",
      "cosController",
      "CosController",
      "COSController"
    ])
  });

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class ConversationOSIndexError extends Error {
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
        "Conversation OS index error"
      );

      this.name =
        "ConversationOSIndexError";

      this.code =
        code ||
        "CONVERSATION_OS_INDEX_ERROR";

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
          ConversationOSIndexError
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
          ) ||
          "CONVERSATION_OS_INDEX_ERROR",

        message:
          error.message ||
          "Unknown Conversation OS error",

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

      code:
        "CONVERSATION_OS_INDEX_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown Conversation OS error",

      recoverable: false,

      details:
        safeClone(error),

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

  function resolveComponents(
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

  function resolveCallable(
    component,
    methodNames = [],
    componentName = "component"
  ) {
    if (isFunction(component)) {
      return component.bind(component);
    }

    if (component) {
      for (const methodName of methodNames) {
        if (
          isFunction(
            component[methodName]
          )
        ) {
          return component[
            methodName
          ].bind(component);
        }
      }
    }

    throw new ConversationOSIndexError(
      "COS_COMPONENT_NOT_CALLABLE",
      `Conversation OS component is not callable: ${componentName}`,
      {
        details: {
          componentName,
          methodNames
        }
      }
    );
  }

  /* =====================================================
     INSTALLATION INSPECTION
  ===================================================== */

  function inspect(
    overrides = {}
  ) {
    const components =
      resolveComponents(overrides);

    const installed = {};
    const missingComponents = [];
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
        missingComponents.push(
          componentName
        );
      }

      const authority =
        readComponentAuthority(
          component
        );

      if (
        available &&
        authority &&
        authority !== AUTHORITY
      ) {
        authorityMismatches.push({
          component:
            componentName,

          expected:
            AUTHORITY,

          actual:
            authority
        });
      }

      const version =
        readComponentVersion(
          component
        );

      if (
        available &&
        !version
      ) {
        warnings.push({
          code:
            "COS_COMPONENT_VERSION_MISSING",

          component:
            componentName
        });
      }

      installed[componentName] = {
        available,

        name:
          readComponentName(
            component,
            componentName
          ),

        version,

        authority
      };
    }

    const controller =
      components.controller;

    const runtime =
      components.runtime;

    const controllerCallable =
      Boolean(
        controller &&
        (
          isFunction(controller) ||
          isFunction(controller.run) ||
          isFunction(controller.execute)
        )
      );

    const runtimeCallable =
      Boolean(
        runtime &&
        (
          isFunction(runtime) ||
          isFunction(runtime.run)
        )
      );

    if (
      controller &&
      !controllerCallable
    ) {
      warnings.push({
        code:
          "COS_CONTROLLER_NOT_CALLABLE"
      });
    }

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
      missingComponents.length === 0 &&
      authorityMismatches.length === 0 &&
      controllerCallable &&
      runtimeCallable;

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      ready,

      status:
        ready
          ? "ready"
          : "not_ready",

      requiredComponents:
        [...REQUIRED_COMPONENTS],

      installed,

      missingComponents,

      authorityMismatches,

      warnings,

      inspectedAt:
        nowIso()
    };
  }

  function assertReady(
    overrides = {}
  ) {
    const inspection =
      inspect(overrides);

    if (!inspection.ready) {
      throw new ConversationOSIndexError(
        "CONVERSATION_OS_NOT_READY",
        "Conversation Operating System is not fully installed.",
        {
          details:
            inspection
        }
      );
    }

    return inspection;
  }

  /* =====================================================
     COMPONENT ACCESS
  ===================================================== */

  function getComponents(
    overrides = {},
    {
      requireReady = false
    } = {}
  ) {
    if (requireReady) {
      assertReady(overrides);
    }

    return resolveComponents(
      overrides
    );
  }

  function getController(
    overrides = {}
  ) {
    const controller =
      resolveComponent(
        "controller",
        overrides.controller
      );

    if (!controller) {
      throw new ConversationOSIndexError(
        "COS_CONTROLLER_MISSING",
        "Conversation OS controller is not installed."
      );
    }

    return controller;
  }

  function getRuntime(
    overrides = {}
  ) {
    const runtime =
      resolveComponent(
        "runtime",
        overrides.runtime
      );

    if (!runtime) {
      throw new ConversationOSIndexError(
        "COS_RUNTIME_MISSING",
        "Conversation OS runtime is not installed."
      );
    }

    return runtime;
  }

  function getContract(
    overrides = {}
  ) {
    const contract =
      resolveComponent(
        "contract",
        overrides.contract
      );

    if (!contract) {
      throw new ConversationOSIndexError(
        "COS_CONTRACT_MISSING",
        "Conversation OS contract is not installed."
      );
    }

    return contract;
  }

  function getStateComponent(
    overrides = {}
  ) {
    const state =
      resolveComponent(
        "state",
        overrides.state
      );

    if (!state) {
      throw new ConversationOSIndexError(
        "COS_STATE_COMPONENT_MISSING",
        "Conversation OS state component is not installed."
      );
    }

    return state;
  }

  /* =====================================================
     PUBLIC EXECUTION
  ===================================================== */

  async function run(
    input = {},
    options = {}
  ) {
    const components =
      resolveComponents(
        options.components || {}
      );

    if (
      options.strictInstallation !== false
    ) {
      assertReady(
        options.components || {}
      );
    }

    const controller =
      components.controller;

    const execute =
      resolveCallable(
        controller,
        [
          "run",
          "execute",
          "process"
        ],
        "cos-controller"
      );

    try {
      return await execute(
        input,
        {
          ...options,

          components: {
            contract:
              components.contract,

            state:
              components.state,

            runtime:
              components.runtime,

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
      );
    } catch (error) {
      if (
        options.throwOnFailure === true
      ) {
        throw error;
      }

      return {
        ok: false,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        packet: null,

        state:
          isObject(input) &&
          isObject(input.state)
            ? safeClone(input.state)
            : null,

        errors: [
          safeError(error)
        ]
      };
    }
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
     PACKET-FOCUSED EXECUTION
  ===================================================== */

  async function place(
    input = {},
    options = {}
  ) {
    const controller =
      getController(
        options.components || {}
      );

    if (
      isFunction(controller.place)
    ) {
      return controller.place(
        input,
        options
      );
    }

    const result =
      await run(
        input,
        options
      );

    return {
      ok:
        result.ok === true,

      packet:
        result.ok === true
          ? result.packet
          : null,

      state:
        result.state || null,

      errors:
        Array.isArray(result.errors)
          ? result.errors
          : []
    };
  }

  async function getPacket(
    input = {},
    options = {}
  ) {
    const controller =
      getController(
        options.components || {}
      );

    if (
      isFunction(
        controller.getPacket
      )
    ) {
      return controller.getPacket(
        input,
        options
      );
    }

    const result =
      await run(
        input,
        {
          ...options,
          throwOnFailure: true
        }
      );

    if (
      !result ||
      result.ok !== true ||
      !result.packet
    ) {
      throw new ConversationOSIndexError(
        "COS_PACKET_UNAVAILABLE",
        "Conversation OS did not produce an authoritative placement packet.",
        {
          details: {
            result:
              safeClone(result)
          }
        }
      );
    }

    return result.packet;
  }

  /* =====================================================
     STATE HELPERS
  ===================================================== */

  function createState(
    options = {}
  ) {
    const controller =
      resolveComponent(
        "controller",
        options.controller
      );

    if (
      controller &&
      isFunction(
        controller.createEmptyState
      )
    ) {
      return controller
        .createEmptyState({
          conversationId:
            options.conversationId ||
            null
        });
    }

    const stateComponent =
      getStateComponent(
        options.components || {}
      );

    const create =
      resolveCallable(
        stateComponent,
        [
          "create",
          "initialize",
          "createInitialState"
        ],
        "cos-state"
      );

    const result = create({
      conversationId:
        options.conversationId ||
        null
    });

    if (
      result &&
      isFunction(result.then)
    ) {
      throw new ConversationOSIndexError(
        "COS_ASYNC_STATE_FACTORY",
        "The installed COS state factory is asynchronous. Use createStateAsync()."
      );
    }

    return result;
  }

  async function createStateAsync(
    options = {}
  ) {
    const controller =
      resolveComponent(
        "controller",
        options.controller
      );

    if (
      controller &&
      isFunction(
        controller.createEmptyStateAsync
      )
    ) {
      return controller
        .createEmptyStateAsync({
          conversationId:
            options.conversationId ||
            null
        });
    }

    if (
      controller &&
      isFunction(
        controller.createEmptyState
      )
    ) {
      return await controller
        .createEmptyState({
          conversationId:
            options.conversationId ||
            null
        });
    }

    const stateComponent =
      getStateComponent(
        options.components || {}
      );

    const create =
      resolveCallable(
        stateComponent,
        [
          "create",
          "initialize",
          "createInitialState"
        ],
        "cos-state"
      );

    return await create({
      conversationId:
        options.conversationId ||
        null
    });
  }

  /* =====================================================
     VALIDATION HELPERS
  ===================================================== */

  function validatePacket(
    packet,
    options = {}
  ) {
    const packetBuilder =
      resolveComponent(
        "packetBuilder",
        options.packetBuilder
      );

    if (!packetBuilder) {
      throw new ConversationOSIndexError(
        "COS_PACKET_BUILDER_MISSING",
        "Conversation OS packet builder is not installed."
      );
    }

    const validate =
      resolveCallable(
        packetBuilder,
        [
          "validatePacket",
          "validate"
        ],
        "cos-packet-builder"
      );

    return validate(packet);
  }

  function assertPacket(
    packet,
    options = {}
  ) {
    const packetBuilder =
      resolveComponent(
        "packetBuilder",
        options.packetBuilder
      );

    if (!packetBuilder) {
      throw new ConversationOSIndexError(
        "COS_PACKET_BUILDER_MISSING",
        "Conversation OS packet builder is not installed."
      );
    }

    if (
      isFunction(
        packetBuilder.assertPacket
      )
    ) {
      return packetBuilder
        .assertPacket(packet);
    }

    const validation =
      validatePacket(
        packet,
        options
      );

    if (
      validation === false ||
      (
        isObject(validation) &&
        validation.valid === false
      )
    ) {
      throw new ConversationOSIndexError(
        "COS_PACKET_INVALID",
        "Conversation OS placement packet failed validation.",
        {
          details:
            safeClone(validation)
        }
      );
    }

    return validation;
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    overrides = {}
  ) {
    const inspection =
      inspect(overrides);

    const controller =
      resolveComponent(
        "controller",
        overrides.controller
      );

    if (
      controller &&
      isFunction(controller.health)
    ) {
      try {
        const controllerHealth =
          controller.health(
            overrides
          );

        return {
          ...controllerHealth,

          schemaVersion:
            SCHEMA_VERSION,

          authority:
            AUTHORITY,

          component:
            COMPONENT_NAME,

          version:
            VERSION,

          installation:
            inspection
        };
      } catch (error) {
        return {
          ok: false,

          schemaVersion:
            SCHEMA_VERSION,

          authority:
            AUTHORITY,

          component:
            COMPONENT_NAME,

          version:
            VERSION,

          status:
            "error",

          installation:
            inspection,

          checkedAt:
            nowIso(),

          errors: [
            safeError(error)
          ]
        };
      }
    }

    return {
      ok:
        inspection.ready,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      status:
        inspection.ready
          ? "ready"
          : "not_ready",

      installation:
        inspection,

      checkedAt:
        nowIso(),

      errors: []
    };
  }

  /* =====================================================
     PUBLIC INDEX
  ===================================================== */

  const conversationOSIndex = {
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

    componentAliases:
      COMPONENT_ALIASES,

    ConversationOSIndexError,

    run,

    execute,

    process,

    place,

    getPacket,

    createState,

    createStateAsync,

    validatePacket,

    assertPacket,

    inspect,

    inspectInstallation:
      inspect,

    assertReady,

    assertInstallation:
      assertReady,

    health,

    getComponents,

    getController,

    getRuntime,

    getContract,

    getStateComponent
  };

  /* =====================================================
     STABLE COMPONENT GETTERS
  ===================================================== */

  Object.defineProperties(
    conversationOSIndex,
    {
      contract: {
        enumerable: true,

        get() {
          return resolveComponent(
            "contract"
          );
        }
      },

      state: {
        enumerable: true,

        get() {
          return resolveComponent(
            "state"
          );
        }
      },

      runtime: {
        enumerable: true,

        get() {
          return resolveComponent(
            "runtime"
          );
        }
      },

      historyIndex: {
        enumerable: true,

        get() {
          return resolveComponent(
            "historyIndex"
          );
        }
      },

      turnRegister: {
        enumerable: true,

        get() {
          return resolveComponent(
            "turnRegister"
          );
        }
      },

      referenceResolver: {
        enumerable: true,

        get() {
          return resolveComponent(
            "referenceResolver"
          );
        }
      },

      placementEngine: {
        enumerable: true,

        get() {
          return resolveComponent(
            "placementEngine"
          );
        }
      },

      threadStateManager: {
        enumerable: true,

        get() {
          return resolveComponent(
            "threadStateManager"
          );
        }
      },

      placementValidator: {
        enumerable: true,

        get() {
          return resolveComponent(
            "placementValidator"
          );
        }
      },

      packetBuilder: {
        enumerable: true,

        get() {
          return resolveComponent(
            "packetBuilder"
          );
        }
      },

      controller: {
        enumerable: true,

        get() {
          return resolveComponent(
            "controller"
          );
        }
      }
    }
  );

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.index =
    conversationOSIndex;

  ConversationOS.api =
    conversationOSIndex;

  ConversationOS.publicApi =
    conversationOSIndex;

  ConversationOS.execute =
    execute;

  ConversationOS.process =
    process;

  ConversationOS.place =
    place;

  ConversationOS.getPacket =
    getPacket;

  ConversationOS.health =
    health;

  ConversationOS.inspect =
    inspect;

  root.AriConversationOS =
    conversationOSIndex;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      conversationOSIndex;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);