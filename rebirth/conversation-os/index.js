// rebirth/conversation-os/index.js
// ARI Rebirth — Conversation Operating System Public Index
//
// Purpose:
// Expose the complete Conversation Operating System through one stable,
// public integration surface.
//
// V2.0.0 — Expanded COS Public Integration Surface
//
// Canonical responsibility:
//
// - Discover every installed COS component.
// - Verify required component installation.
// - Expose core placement and continuity services.
// - Expose reference candidate construction and adjudication.
// - Expose pending-interaction, artifact, and delivery-sequence services.
// - Expose persistence and migration infrastructure.
// - Provide one stable COS run entry point.
// - Provide one stable health and installation-inspection API.
// - Preserve all authority boundaries established by COS.
//
// Non-responsibility:
//
// This file must not:
//
// - interpret user language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotional state,
// - infer safety severity,
// - resolve references independently,
// - determine placement independently,
// - mutate conversation state independently,
// - generate responses.
//
// Architectural rule:
//
// This file is a public barrel and integration surface only.
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

  const VERSION = "2.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "conversation-os-index";

  const CORE_COMPONENTS = Object.freeze([
    "contract",
    "state",
    "historyIndex",
    "turnRegister",
    "referenceCandidateBuilder",
    "referenceAdjudicator",
    "referenceResolver",
    "placementEngine",
    "threadStateManager",
    "placementValidator",
    "packetBuilder",
    "runtime",
    "controller"
  ]);

  const CONTINUITY_COMPONENTS = Object.freeze([
    "pendingInteractionManager",
    "artifactRegister",
    "deliverySequenceManager"
  ]);

  const INFRASTRUCTURE_COMPONENTS = Object.freeze([
    "stateMigrator",
    "stateStore",
    "manifest"
  ]);

  const REQUIRED_COMPONENTS = Object.freeze([
    ...CORE_COMPONENTS,
    ...CONTINUITY_COMPONENTS,
    ...INFRASTRUCTURE_COMPONENTS
  ]);

  const OPTIONAL_COMPONENTS = Object.freeze([
    "smokeTest",
    "regressionSuite",
    "integrationStage"
  ]);

  const ALL_COMPONENTS = Object.freeze([
    ...REQUIRED_COMPONENTS,
    ...OPTIONAL_COMPONENTS
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

    pendingInteractionManager:
      Object.freeze([
        "pendingInteractionManager",
        "cosPendingInteractionManager",
        "CosPendingInteractionManager",
        "COSPendingInteractionManager"
      ]),

    artifactRegister: Object.freeze([
      "artifactRegister",
      "cosArtifactRegister",
      "CosArtifactRegister",
      "COSArtifactRegister"
    ]),

    deliverySequenceManager:
      Object.freeze([
        "deliverySequenceManager",
        "cosDeliverySequenceManager",
        "CosDeliverySequenceManager",
        "COSDeliverySequenceManager"
      ]),

    referenceCandidateBuilder:
      Object.freeze([
        "referenceCandidateBuilder",
        "cosReferenceCandidateBuilder",
        "CosReferenceCandidateBuilder",
        "COSReferenceCandidateBuilder"
      ]),

    referenceAdjudicator:
      Object.freeze([
        "referenceAdjudicator",
        "cosReferenceAdjudicator",
        "CosReferenceAdjudicator",
        "COSReferenceAdjudicator"
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

    threadStateManager:
      Object.freeze([
        "threadStateManager",
        "cosThreadStateManager",
        "CosThreadStateManager",
        "COSThreadStateManager"
      ]),

    placementValidator:
      Object.freeze([
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

    stateMigrator: Object.freeze([
      "stateMigrator",
      "cosStateMigrator",
      "CosStateMigrator",
      "COSStateMigrator"
    ]),

    stateStore: Object.freeze([
      "stateStore",
      "cosStateStore",
      "CosStateStore",
      "COSStateStore"
    ]),

    manifest: Object.freeze([
      "manifest",
      "cosManifest",
      "CosManifest",
      "COSManifest"
    ]),

    runtime: Object.freeze([
      "runtime",
      "cosRuntime",
      "CosRuntime",
      "COSRuntime"
    ]),

    controller: Object.freeze([
      "controller",
      "cosController",
      "CosController",
      "COSController"
    ]),

    smokeTest: Object.freeze([
      "smokeTest",
      "cosSmokeTest"
    ]),

    regressionSuite: Object.freeze([
      "regressionSuite",
      "cosRegressionSuite"
    ]),

    integrationStage: Object.freeze([
      "conversationOSStage",
      "cosStage",
      "rebirthConversationOSStage"
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
     NAMESPACE DISCOVERY
  ===================================================== */

  function getNamespaces() {
    return [
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
      ConversationOS.persistence,
      ConversationOS.migrations,
      ConversationOS.components,

      ConversationOS.testing,

      root.Ari &&
        root.Ari.Rebirth &&
        root.Ari.Rebirth.Integration,

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
      const namespace of
        namespaces
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
        ALL_COMPONENTS
    ) {
      components[
        componentName
      ] = resolveComponent(
        componentName,
        overrides[
          componentName
        ]
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
     COMPONENT CALLABILITY
  ===================================================== */

  function getExpectedMethods(
    componentName
  ) {
    const methodMap = {
      contract: [
        "validate",
        "validateInput",
        "assert"
      ],

      state: [
        "create",
        "initialize",
        "createInitialState",
        "validate",
        "validateState"
      ],

      historyIndex: [
        "build",
        "index",
        "createIndex",
        "run"
      ],

      turnRegister: [
        "register",
        "run",
        "create"
      ],

      pendingInteractionManager: [
        "transition",
        "apply",
        "run"
      ],

      artifactRegister: [
        "transition",
        "apply",
        "run"
      ],

      deliverySequenceManager: [
        "transition",
        "apply",
        "run"
      ],

      referenceCandidateBuilder: [
        "build",
        "buildCandidates",
        "run"
      ],

      referenceAdjudicator: [
        "adjudicate",
        "resolve",
        "run"
      ],

      referenceResolver: [
        "resolve",
        "run"
      ],

      placementEngine: [
        "place",
        "determine",
        "run"
      ],

      threadStateManager: [
        "transition",
        "apply",
        "run"
      ],

      placementValidator: [
        "validate",
        "validatePlacement",
        "run"
      ],

      packetBuilder: [
        "build",
        "create",
        "run"
      ],

      stateMigrator: [
        "migrate",
        "upgrade",
        "run"
      ],

      stateStore: [
        "load",
        "save"
      ],

      manifest: [
        "inspectInstallation",
        "createLoadPlan"
      ],

      runtime: [
        "run",
        "execute",
        "process"
      ],

      controller: [
        "run",
        "execute",
        "process"
      ],

      smokeTest: [
        "run",
        "test",
        "assertAll"
      ],

      regressionSuite: [
        "run",
        "test",
        "assertAll"
      ],

      integrationStage: [
        "run",
        "execute",
        "process"
      ]
    };

    return methodMap[
      componentName
    ] || [];
  }

  function isComponentCallable(
    componentName,
    component
  ) {
    if (!component) {
      return false;
    }

    if (isFunction(component)) {
      return true;
    }

    const expectedMethods =
      getExpectedMethods(
        componentName
      );

    return expectedMethods.some(
      (methodName) =>
        isFunction(
          component[
            methodName
          ]
        )
    );
  }

  /* =====================================================
     INSTALLATION INSPECTION
  ===================================================== */

  function inspect(
    overrides = {},
    options = {}
  ) {
    const components =
      resolveComponents(overrides);

    const installed = {};
    const missingRequired = [];
    const missingOptional = [];
    const authorityMismatches = [];
    const nonCallableComponents = [];
    const warnings = [];

    const requireInfrastructure =
      options.requireInfrastructure !==
      false;

    const requiredSet =
      new Set(
        requireInfrastructure
          ? REQUIRED_COMPONENTS
          : [
              ...CORE_COMPONENTS,
              ...CONTINUITY_COMPONENTS
            ]
      );

    for (
      const componentName of
        ALL_COMPONENTS
    ) {
      const component =
        components[
          componentName
        ];

      const available =
        Boolean(component);

      const required =
        requiredSet.has(
          componentName
        );

      if (!available) {
        if (required) {
          missingRequired.push(
            componentName
          );
        } else {
          missingOptional.push(
            componentName
          );
        }
      }

      const authority =
        readComponentAuthority(
          component
        );

      if (
        available &&
        authority &&
        authority !== AUTHORITY &&
        componentName !==
          "integrationStage"
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

      const callable =
        available
          ? isComponentCallable(
              componentName,
              component
            )
          : false;

      if (
        available &&
        !callable
      ) {
        nonCallableComponents.push(
          componentName
        );
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

      installed[
        componentName
      ] = {
        available,

        required,

        callable,

        name:
          readComponentName(
            component,
            componentName
          ),

        version,

        authority,

        expectedMethods:
          getExpectedMethods(
            componentName
          )
      };
    }

    const ready =
      missingRequired.length === 0 &&
      authorityMismatches.length === 0 &&
      nonCallableComponents
        .filter(
          (componentName) =>
            requiredSet.has(
              componentName
            )
        )
        .length === 0;

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
        Array.from(
          requiredSet
        ),

      optionalComponents:
        [...OPTIONAL_COMPONENTS],

      installed,

      missingRequired,

      missingOptional,

      authorityMismatches,

      nonCallableComponents,

      warnings,

      inspectedAt:
        nowIso()
    };
  }

  function assertReady(
    overrides = {},
    options = {}
  ) {
    const inspection =
      inspect(
        overrides,
        options
      );

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
      requireReady = false,
      requireInfrastructure = true
    } = {}
  ) {
    if (requireReady) {
      assertReady(
        overrides,
        {
          requireInfrastructure
        }
      );
    }

    return resolveComponents(
      overrides
    );
  }

  function requireInstalledComponent(
    componentName,
    overrides = {}
  ) {
    const component =
      resolveComponent(
        componentName,
        overrides[
          componentName
        ]
      );

    if (!component) {
      throw new ConversationOSIndexError(
        "COS_COMPONENT_MISSING",
        `Conversation OS component is not installed: ${componentName}`,
        {
          details: {
            componentName
          }
        }
      );
    }

    return component;
  }

  function getController(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "controller",
      overrides
    );
  }

  function getRuntime(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "runtime",
      overrides
    );
  }

  function getContract(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "contract",
      overrides
    );
  }

  function getStateComponent(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "state",
      overrides
    );
  }

  function getStateStore(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "stateStore",
      overrides
    );
  }

  function getStateMigrator(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "stateMigrator",
      overrides
    );
  }

  function getManifest(
    overrides = {}
  ) {
    return requireInstalledComponent(
      "manifest",
      overrides
    );
  }

  /* =====================================================
     PUBLIC EXECUTION
  ===================================================== */

  async function run(
    input = {},
    options = {}
  ) {
    const overrides =
      isObject(options.components)
        ? options.components
        : {};

    const components =
      resolveComponents(
        overrides
      );

    if (
      options.strictInstallation !==
      false
    ) {
      assertReady(
        overrides,
        {
          requireInfrastructure:
            options
              .requireInfrastructure !==
            false
        }
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

            historyIndex:
              components.historyIndex,

            turnRegister:
              components.turnRegister,

            pendingInteractionManager:
              components
                .pendingInteractionManager,

            artifactRegister:
              components
                .artifactRegister,

            deliverySequenceManager:
              components
                .deliverySequenceManager,

            referenceCandidateBuilder:
              components
                .referenceCandidateBuilder,

            referenceAdjudicator:
              components
                .referenceAdjudicator,

            referenceResolver:
              components.referenceResolver,

            placementEngine:
              components.placementEngine,

            threadStateManager:
              components
                .threadStateManager,

            placementValidator:
              components
                .placementValidator,

            packetBuilder:
              components.packetBuilder,

            stateMigrator:
              components.stateMigrator,

            stateStore:
              components.stateStore,

            runtime:
              components.runtime
          }
        }
      );
    } catch (error) {
      if (
        options.throwOnFailure ===
        true
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
            ? safeClone(
                input.state
              )
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
     PACKET EXECUTION
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
      isFunction(
        controller.place
      )
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
        result &&
        result.ok === true,

      packet:
        result &&
        result.ok === true
          ? result.packet
          : null,

      state:
        result &&
        result.state
          ? result.state
          : null,

      errors:
        result &&
        Array.isArray(
          result.errors
        )
          ? result.errors
          : []
    };
  }

  async function getPacket(
    input = {},
    options = {}
  ) {
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
     REFERENCE SERVICES
  ===================================================== */

  function buildReferenceCandidates(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "referenceCandidateBuilder",
        options.components || {}
      );

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

    return build(
      input,
      options
    );
  }

  function adjudicateReferences(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "referenceAdjudicator",
        options.components || {}
      );

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

    return adjudicate(
      input,
      options
    );
  }

  function resolveReferences(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "referenceResolver",
        options.components || {}
      );

    const resolve =
      resolveCallable(
        component,
        [
          "resolve",
          "run",
          "execute"
        ],
        "cos-reference-resolver"
      );

    return resolve(
      input,
      options
    );
  }

  /* =====================================================
     CONTINUITY SERVICES
  ===================================================== */

  function transitionPendingInteraction(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "pendingInteractionManager",
        options.components || {}
      );

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

    return transition(
      input,
      options
    );
  }

  function transitionArtifact(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "artifactRegister",
        options.components || {}
      );

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

    return transition(
      input,
      options
    );
  }

  function transitionDeliverySequence(
    input = {},
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "deliverySequenceManager",
        options.components || {}
      );

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

    return transition(
      input,
      options
    );
  }

  /* =====================================================
     STATE CREATION
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
          "createInitialState",
          "createEmptyState"
        ],
        "cos-state"
      );

    const result =
      create({
        conversationId:
          options.conversationId ||
          null,

        components:
          resolveComponents(
            options.components || {}
          )
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
          "createInitialState",
          "createEmptyState"
        ],
        "cos-state"
      );

    return await create({
      conversationId:
        options.conversationId ||
        null,

      components:
        resolveComponents(
          options.components || {}
        )
    });
  }

  /* =====================================================
     PERSISTENCE
  ===================================================== */

  async function loadState(
    conversationId,
    options = {}
  ) {
    const store =
      getStateStore(
        options.components || {}
      );

    if (
      isFunction(
        store.loadState
      )
    ) {
      return store.loadState(
        conversationId,
        options
      );
    }

    const load =
      resolveCallable(
        store,
        ["load"],
        "cos-state-store"
      );

    const result =
      await load(
        conversationId,
        options
      );

    return result &&
      result.found
      ? result.state
      : null;
  }

  async function saveState(
    conversationId,
    state,
    options = {}
  ) {
    const store =
      getStateStore(
        options.components || {}
      );

    const save =
      resolveCallable(
        store,
        ["save"],
        "cos-state-store"
      );

    return save(
      conversationId,
      state,
      options
    );
  }

  async function removeState(
    conversationId,
    options = {}
  ) {
    const store =
      getStateStore(
        options.components || {}
      );

    const remove =
      resolveCallable(
        store,
        [
          "remove",
          "delete",
          "clear"
        ],
        "cos-state-store"
      );

    return remove(
      conversationId,
      options
    );
  }

  async function migrateState(
    state,
    options = {}
  ) {
    const migrator =
      getStateMigrator(
        options.components || {}
      );

    const migrate =
      resolveCallable(
        migrator,
        [
          "migrate",
          "upgrade",
          "normalize",
          "run"
        ],
        "cos-state-migrator"
      );

    return migrate(
      {
        state,

        conversationId:
          options.conversationId,

        fromVersion:
          options.fromVersion,

        toVersion:
          options.toVersion
      },
      options
    );
  }

  /* =====================================================
     PACKET VALIDATION
  ===================================================== */

  function validatePacket(
    packet,
    options = {}
  ) {
    const packetBuilder =
      requireInstalledComponent(
        "packetBuilder",
        options.components || {}
      );

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
      requireInstalledComponent(
        "packetBuilder",
        options.components || {}
      );

    if (
      isFunction(
        packetBuilder
          .assertPacket
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
            safeClone(
              validation
            )
        }
      );
    }

    return validation;
  }

  /* =====================================================
     TESTING
  ===================================================== */

  async function runSmokeTest(
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "smokeTest",
        options.components || {}
      );

    const runTest =
      resolveCallable(
        component,
        [
          "run",
          "execute",
          "test",
          "assertAll"
        ],
        "cos-smoke-test"
      );

    return runTest(options);
  }

  async function runRegressionSuite(
    options = {}
  ) {
    const component =
      requireInstalledComponent(
        "regressionSuite",
        options.components || {}
      );

    const runTest =
      resolveCallable(
        component,
        [
          "run",
          "execute",
          "test",
          "assertAll"
        ],
        "cos-regression-suite"
      );

    return runTest(options);
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    overrides = {},
    options = {}
  ) {
    const inspection =
      inspect(
        overrides,
        options
      );

    const controller =
      resolveComponent(
        "controller",
        overrides.controller
      );

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
            overrides
          );
      } catch (error) {
        controllerError =
          safeError(error);
      }
    }

    return {
      ok:
        inspection.ready &&
        !controllerError,

      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      status:
        inspection.ready &&
        !controllerError
          ? "ready"
          : "not_ready",

      installation:
        inspection,

      controller:
        controllerHealth,

      checkedAt:
        nowIso(),

      errors:
        controllerError
          ? [controllerError]
          : []
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

    coreComponents:
      CORE_COMPONENTS,

    continuityComponents:
      CONTINUITY_COMPONENTS,

    infrastructureComponents:
      INFRASTRUCTURE_COMPONENTS,

    requiredComponents:
      REQUIRED_COMPONENTS,

    optionalComponents:
      OPTIONAL_COMPONENTS,

    allComponents:
      ALL_COMPONENTS,

    componentAliases:
      COMPONENT_ALIASES,

    ConversationOSIndexError,

    run,

    execute,

    process,

    place,

    getPacket,

    buildReferenceCandidates,

    adjudicateReferences,

    resolveReferences,

    transitionPendingInteraction,

    transitionArtifact,

    transitionDeliverySequence,

    createState,

    createStateAsync,

    loadState,

    saveState,

    removeState,

    migrateState,

    validatePacket,

    assertPacket,

    runSmokeTest,

    runRegressionSuite,

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

    getStateComponent,

    getStateStore,

    getStateMigrator,

    getManifest
  };

  /* =====================================================
     STABLE COMPONENT GETTERS
  ===================================================== */

  for (
    const componentName of
      ALL_COMPONENTS
  ) {
    Object.defineProperty(
      conversationOSIndex,
      componentName,
      {
        enumerable: true,

        configurable: false,

        get() {
          return resolveComponent(
            componentName
          );
        }
      }
    );
  }

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

  ConversationOS
    .buildReferenceCandidates =
    buildReferenceCandidates;

  ConversationOS
    .adjudicateReferences =
    adjudicateReferences;

  ConversationOS
    .resolveReferences =
    resolveReferences;

  ConversationOS
    .transitionPendingInteraction =
    transitionPendingInteraction;

  ConversationOS
    .transitionArtifact =
    transitionArtifact;

  ConversationOS
    .transitionDeliverySequence =
    transitionDeliverySequence;

  ConversationOS.loadState =
    loadState;

  ConversationOS.saveState =
    saveState;

  ConversationOS.removeState =
    removeState;

  ConversationOS.migrateState =
    migrateState;

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