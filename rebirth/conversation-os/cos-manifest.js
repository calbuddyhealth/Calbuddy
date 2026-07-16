// rebirth/conversation-os/cos-manifest.js
// ARI Rebirth — Conversation Operating System Manifest
//
// Purpose:
// Define the canonical Conversation Operating System component inventory,
// browser load order, dependency graph, installation requirements, and
// runtime readiness checks.
//
// V1.0.0 — Canonical COS Load and Dependency Manifest
//
// Canonical flow:
//
// COS Manifest
//      ↓
// Component Inventory
//      ↓
// Dependency Validation
//      ↓
// Script Load-Order Resolution
//      ↓
// Namespace Installation Inspection
//      ↓
// Runtime Readiness Report
//
// Authority:
//
// This component is authoritative only for:
//
// - declaring the canonical COS component inventory,
// - declaring canonical browser script paths,
// - declaring component dependency relationships,
// - declaring deterministic browser load order,
// - inspecting namespace installation,
// - identifying missing components,
// - identifying dependency-order violations,
// - exposing production and testing load plans.
//
// Non-authority:
//
// This component must not:
//
// - dynamically reinterpret conversation state,
// - interpret user language,
// - classify intent,
// - classify conversation function,
// - infer semantic meaning,
// - infer emotion,
// - infer safety severity,
// - resolve references,
// - determine conversation placement,
// - mutate COS runtime state,
// - generate responses.
//
// Architectural rule:
//
// The manifest describes and verifies the COS installation.
//
// It does not perform conversational work.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.manifest
//
// CommonJS:
//
// module.exports = cosManifest

(function initializeCosManifest(globalScope) {
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
    "cos-manifest";

  const MANIFEST_TYPE =
    "conversation_operating_system_manifest";

  const BASE_PATH =
    "rebirth/conversation-os";

  const INTEGRATION_BASE_PATH =
    "rebirth/integration";

  const COMPONENT_GROUPS = Object.freeze([
    "core",
    "indexing",
    "turns",
    "interactions",
    "artifacts",
    "sequences",
    "references",
    "placement",
    "threads",
    "validation",
    "packets",
    "persistence",
    "migrations",
    "integration",
    "public",
    "testing"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosManifestError extends Error {
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
        "COS manifest error"
      );

      this.name =
        "CosManifestError";

      this.code =
        code ||
        "COS_MANIFEST_ERROR";

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
          CosManifestError
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

  function uniqueStrings(values = []) {
    const output = [];
    const seen = new Set();

    for (
      const value of
        Array.isArray(values)
          ? values
          : [values]
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

  /* =====================================================
     COMPONENT DEFINITIONS
  ===================================================== */

  const COMPONENTS = Object.freeze([
    {
      id: "contract",
      name: "COS Contract",
      componentName: "cos-contract",
      group: "core",
      path:
        `${BASE_PATH}/core/cos-contract.js`,
      namespaceKeys: [
        "contract",
        "cosContract"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: []
    },

    {
      id: "state",
      name: "COS State",
      componentName: "cos-state",
      group: "core",
      path:
        `${BASE_PATH}/core/cos-state.js`,
      namespaceKeys: [
        "state",
        "cosState"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract"
      ]
    },

    {
      id: "historyIndex",
      name: "COS History Index",
      componentName:
        "cos-history-index",
      group: "indexing",
      path:
        `${BASE_PATH}/indexing/cos-history-index.js`,
      namespaceKeys: [
        "historyIndex",
        "historyIndexer",
        "cosHistoryIndex"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract"
      ]
    },

    {
      id: "turnRegister",
      name: "COS Turn Register",
      componentName:
        "cos-turn-register",
      group: "turns",
      path:
        `${BASE_PATH}/turns/cos-turn-register.js`,
      namespaceKeys: [
        "turnRegister",
        "currentTurnRegister",
        "cosTurnRegister"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "state",
        "historyIndex"
      ]
    },

    {
      id:
        "pendingInteractionManager",
      name:
        "COS Pending Interaction Manager",
      componentName:
        "cos-pending-interaction-manager",
      group: "interactions",
      path:
        `${BASE_PATH}/interactions/cos-pending-interaction-manager.js`,
      namespaceKeys: [
        "pendingInteractionManager",
        "cosPendingInteractionManager"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "state"
      ]
    },

    {
      id: "artifactRegister",
      name:
        "COS Artifact Register",
      componentName:
        "cos-artifact-register",
      group: "artifacts",
      path:
        `${BASE_PATH}/artifacts/cos-artifact-register.js`,
      namespaceKeys: [
        "artifactRegister",
        "cosArtifactRegister"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "state"
      ]
    },

    {
      id:
        "deliverySequenceManager",
      name:
        "COS Delivery Sequence Manager",
      componentName:
        "cos-delivery-sequence-manager",
      group: "sequences",
      path:
        `${BASE_PATH}/sequences/cos-delivery-sequence-manager.js`,
      namespaceKeys: [
        "deliverySequenceManager",
        "cosDeliverySequenceManager"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "state",
        "artifactRegister",
        "pendingInteractionManager"
      ]
    },

    {
      id:
        "referenceCandidateBuilder",
      name:
        "COS Reference Candidate Builder",
      componentName:
        "cos-reference-candidate-builder",
      group: "references",
      path:
        `${BASE_PATH}/references/cos-reference-candidate-builder.js`,
      namespaceKeys: [
        "referenceCandidateBuilder",
        "cosReferenceCandidateBuilder"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "historyIndex",
        "turnRegister",
        "pendingInteractionManager",
        "artifactRegister",
        "deliverySequenceManager"
      ]
    },

    {
      id:
        "referenceAdjudicator",
      name:
        "COS Reference Adjudicator",
      componentName:
        "cos-reference-adjudicator",
      group: "references",
      path:
        `${BASE_PATH}/references/cos-reference-adjudicator.js`,
      namespaceKeys: [
        "referenceAdjudicator",
        "cosReferenceAdjudicator"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "referenceCandidateBuilder"
      ]
    },

    {
      id: "referenceResolver",
      name:
        "COS Reference Resolver",
      componentName:
        "cos-reference-resolver",
      group: "references",
      path:
        `${BASE_PATH}/references/cos-reference-resolver.js`,
      namespaceKeys: [
        "referenceResolver",
        "cosReferenceResolver"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "historyIndex",
        "turnRegister",
        "referenceCandidateBuilder",
        "referenceAdjudicator"
      ]
    },

    {
      id: "placementEngine",
      name:
        "COS Placement Engine",
      componentName:
        "cos-placement-engine",
      group: "placement",
      path:
        `${BASE_PATH}/placement/cos-placement-engine.js`,
      namespaceKeys: [
        "placementEngine",
        "conversationPlacementEngine",
        "cosPlacementEngine"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "state",
        "historyIndex",
        "turnRegister",
        "referenceResolver"
      ]
    },

    {
      id:
        "threadStateManager",
      name:
        "COS Thread State Manager",
      componentName:
        "cos-thread-state-manager",
      group: "threads",
      path:
        `${BASE_PATH}/threads/cos-thread-state-manager.js`,
      namespaceKeys: [
        "threadStateManager",
        "cosThreadStateManager"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "state",
        "placementEngine"
      ]
    },

    {
      id:
        "placementValidator",
      name:
        "COS Placement Validator",
      componentName:
        "cos-placement-validator",
      group: "validation",
      path:
        `${BASE_PATH}/validation/cos-placement-validator.js`,
      namespaceKeys: [
        "placementValidator",
        "cosPlacementValidator"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "state",
        "historyIndex",
        "placementEngine",
        "threadStateManager"
      ]
    },

    {
      id: "packetBuilder",
      name:
        "COS Packet Builder",
      componentName:
        "cos-packet-builder",
      group: "packets",
      path:
        `${BASE_PATH}/packets/cos-packet-builder.js`,
      namespaceKeys: [
        "packetBuilder",
        "cosPacketBuilder"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "contract",
        "placementValidator"
      ]
    },

    {
      id: "stateMigrator",
      name:
        "COS State Migrator",
      componentName:
        "cos-state-migrator",
      group: "migrations",
      path:
        `${BASE_PATH}/migrations/cos-state-migrator.js`,
      namespaceKeys: [
        "stateMigrator",
        "cosStateMigrator"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "state",
        "pendingInteractionManager",
        "artifactRegister",
        "deliverySequenceManager"
      ]
    },

    {
      id: "stateStore",
      name:
        "COS State Store",
      componentName:
        "cos-state-store",
      group: "persistence",
      path:
        `${BASE_PATH}/persistence/cos-state-store.js`,
      namespaceKeys: [
        "stateStore",
        "cosStateStore"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "state",
        "stateMigrator"
      ]
    },

    {
      id: "runtime",
      name: "COS Runtime",
      componentName: "cos-runtime",
      group: "core",
      path:
        `${BASE_PATH}/core/cos-runtime.js`,
      namespaceKeys: [
        "runtime",
        "cosRuntime"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
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
      ]
    },

    {
      id: "controller",
      name: "COS Controller",
      componentName:
        "cos-controller",
      group: "public",
      path:
        `${BASE_PATH}/cos-controller.js`,
      namespaceKeys: [
        "controller",
        "cosController"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "runtime",
        "stateStore"
      ]
    },

    {
      id: "index",
      name: "COS Public Index",
      componentName:
        "conversation-os-index",
      group: "public",
      path:
        `${BASE_PATH}/index.js`,
      namespaceKeys: [
        "index",
        "api",
        "publicApi"
      ],
      required: true,
      production: true,
      testing: false,
      dependencies: [
        "controller"
      ]
    },

    {
      id: "integrationStage",
      name:
        "Rebirth Conversation OS Stage",
      componentName:
        "rebirth-conversation-os-stage",
      group: "integration",
      path:
        `${INTEGRATION_BASE_PATH}/rebirth-conversation-os-stage.js`,
      namespacePath:
        [
          "Ari",
          "Rebirth",
          "Integration"
        ],
      namespaceKeys: [
        "conversationOSStage",
        "cosStage",
        "rebirthConversationOSStage"
      ],
      required: false,
      production: true,
      testing: false,
      dependencies: [
        "index"
      ]
    },

    {
      id: "smokeTest",
      name: "COS Smoke Test",
      componentName:
        "cos-smoke-test",
      group: "testing",
      path:
        `${BASE_PATH}/testing/cos-smoke-test.js`,
      namespacePath:
        [
          "Ari",
          "Rebirth",
          "ConversationOS",
          "testing"
        ],
      namespaceKeys: [
        "smokeTest",
        "cosSmokeTest"
      ],
      required: false,
      production: false,
      testing: true,
      dependencies: [
        "index"
      ]
    },

    {
      id: "regressionSuite",
      name:
        "COS Regression Suite",
      componentName:
        "cos-regression-suite",
      group: "testing",
      path:
        `${BASE_PATH}/testing/cos-regression-suite.js`,
      namespacePath:
        [
          "Ari",
          "Rebirth",
          "ConversationOS",
          "testing"
        ],
      namespaceKeys: [
        "regressionSuite",
        "cosRegressionSuite"
      ],
      required: false,
      production: false,
      testing: true,
      dependencies: [
        "index",
        "smokeTest"
      ]
    }
  ]);

  /* =====================================================
     COMPONENT LOOKUP
  ===================================================== */

  const COMPONENT_BY_ID = Object.freeze(
    COMPONENTS.reduce(
      (output, component) => {
        output[component.id] =
          component;

        return output;
      },
      {}
    )
  );

  function getComponent(
    componentId
  ) {
    return (
      COMPONENT_BY_ID[
        componentId
      ] || null
    );
  }

  function requireComponent(
    componentId
  ) {
    const component =
      getComponent(componentId);

    if (!component) {
      throw new CosManifestError(
        "COS_MANIFEST_COMPONENT_UNKNOWN",
        "Unknown COS manifest component.",
        {
          details: {
            componentId
          }
        }
      );
    }

    return component;
  }

  /* =====================================================
     DEPENDENCY VALIDATION
  ===================================================== */

  function validateDefinitions() {
    const errors = [];
    const warnings = [];

    const ids = new Set();

    for (
      const component of
        COMPONENTS
    ) {
      if (
        !isNonEmptyString(
          component.id
        )
      ) {
        errors.push({
          code:
            "COS_MANIFEST_COMPONENT_ID_MISSING"
        });

        continue;
      }

      if (ids.has(component.id)) {
        errors.push({
          code:
            "COS_MANIFEST_DUPLICATE_COMPONENT_ID",

          componentId:
            component.id
        });
      }

      ids.add(component.id);

      if (
        !COMPONENT_GROUPS.includes(
          component.group
        )
      ) {
        errors.push({
          code:
            "COS_MANIFEST_COMPONENT_GROUP_INVALID",

          componentId:
            component.id,

          group:
            component.group
        });
      }

      if (
        !isNonEmptyString(
          component.path
        )
      ) {
        errors.push({
          code:
            "COS_MANIFEST_COMPONENT_PATH_MISSING",

          componentId:
            component.id
        });
      }

      if (
        !Array.isArray(
          component.dependencies
        )
      ) {
        errors.push({
          code:
            "COS_MANIFEST_DEPENDENCIES_INVALID",

          componentId:
            component.id
        });
      }

      if (
        !Array.isArray(
          component.namespaceKeys
        ) ||
        component.namespaceKeys
          .length === 0
      ) {
        warnings.push({
          code:
            "COS_MANIFEST_NAMESPACE_KEYS_MISSING",

          componentId:
            component.id
        });
      }
    }

    for (
      const component of
        COMPONENTS
    ) {
      for (
        const dependencyId of
          component.dependencies
      ) {
        if (!ids.has(dependencyId)) {
          errors.push({
            code:
              "COS_MANIFEST_DEPENDENCY_UNKNOWN",

            componentId:
              component.id,

            dependencyId
          });
        }

        if (
          dependencyId ===
          component.id
        ) {
          errors.push({
            code:
              "COS_MANIFEST_SELF_DEPENDENCY",

            componentId:
              component.id
          });
        }
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
     TOPOLOGICAL SORT
  ===================================================== */

  function resolveLoadOrder(
    {
      includeProduction = true,
      includeTesting = false,
      includeIntegration = true,
      componentIds = null
    } = {}
  ) {
    const selectedIds =
      Array.isArray(componentIds)
        ? new Set(componentIds)
        : null;

    const selected =
      COMPONENTS.filter(
        (component) => {
          if (
            selectedIds &&
            !selectedIds.has(
              component.id
            )
          ) {
            return false;
          }

          if (
            component.testing &&
            !includeTesting
          ) {
            return false;
          }

          if (
            component.production &&
            !includeProduction
          ) {
            return false;
          }

          if (
            component.group ===
              "integration" &&
            !includeIntegration
          ) {
            return false;
          }

          return true;
        }
      );

    const selectedMap =
      new Map(
        selected.map(
          (component) => [
            component.id,
            component
          ]
        )
      );

    function addDependencyTree(
      componentId
    ) {
      const component =
        requireComponent(
          componentId
        );

      if (
        selectedMap.has(
          componentId
        )
      ) {
        return;
      }

      selectedMap.set(
        componentId,
        component
      );

      for (
        const dependencyId of
          component.dependencies
      ) {
        addDependencyTree(
          dependencyId
        );
      }
    }

    if (selectedIds) {
      for (
        const componentId of
          selectedIds
      ) {
        addDependencyTree(
          componentId
        );
      }
    }

    const visiting = new Set();
    const visited = new Set();
    const order = [];

    function visit(componentId) {
      if (visited.has(componentId)) {
        return;
      }

      if (visiting.has(componentId)) {
        throw new CosManifestError(
          "COS_MANIFEST_DEPENDENCY_CYCLE",
          "COS manifest contains a dependency cycle.",
          {
            details: {
              componentId,
              visiting:
                Array.from(visiting)
            }
          }
        );
      }

      const component =
        selectedMap.get(
          componentId
        );

      if (!component) {
        return;
      }

      visiting.add(componentId);

      for (
        const dependencyId of
          component.dependencies
      ) {
        if (
          selectedMap.has(
            dependencyId
          )
        ) {
          visit(dependencyId);
        }
      }

      visiting.delete(componentId);
      visited.add(componentId);
      order.push(component);
    }

    for (
      const component of
        selectedMap.values()
    ) {
      visit(component.id);
    }

    return order;
  }

  /* =====================================================
     CANONICAL LOAD PLANS
  ===================================================== */

  const PRODUCTION_LOAD_ORDER =
    Object.freeze(
      resolveLoadOrder({
        includeProduction: true,
        includeTesting: false,
        includeIntegration: false
      }).map(
        (component) =>
          component.id
      )
    );

  const PRODUCTION_WITH_INTEGRATION_LOAD_ORDER =
    Object.freeze(
      resolveLoadOrder({
        includeProduction: true,
        includeTesting: false,
        includeIntegration: true
      }).map(
        (component) =>
          component.id
      )
    );

  const DEVELOPMENT_LOAD_ORDER =
    Object.freeze(
      resolveLoadOrder({
        includeProduction: true,
        includeTesting: true,
        includeIntegration: true
      }).map(
        (component) =>
          component.id
      )
    );

  /* =====================================================
     NAMESPACE LOOKUP
  ===================================================== */

  function readNamespacePath(
    component
  ) {
    return (
      Array.isArray(
        component.namespacePath
      )
        ? component.namespacePath
        : [
            "Ari",
            "Rebirth",
            "ConversationOS"
          ]
    );
  }

  function resolveNamespace(
    path
  ) {
    let current = root;

    for (
      const segment of path
    ) {
      if (
        !current ||
        !isObject(current) &&
        !isFunction(current)
      ) {
        return null;
      }

      current =
        current[segment];

      if (
        current === undefined ||
        current === null
      ) {
        return null;
      }
    }

    return current;
  }

  function locateInstalledComponent(
    component
  ) {
    const namespace =
      resolveNamespace(
        readNamespacePath(
          component
        )
      );

    if (!namespace) {
      return {
        installed: false,
        namespace: null,
        key: null,
        value: null
      };
    }

    for (
      const key of
        component.namespaceKeys
    ) {
      if (namespace[key]) {
        return {
          installed: true,
          namespace,
          key,
          value:
            namespace[key]
        };
      }
    }

    return {
      installed: false,
      namespace,
      key: null,
      value: null
    };
  }

  function readInstalledVersion(
    value
  ) {
    if (!value) {
      return null;
    }

    return firstNonEmptyString(
      value.version,
      value.VERSION,
      value.componentVersion,
      value.component_version
    );
  }

  function readInstalledAuthority(
    value
  ) {
    if (!value) {
      return null;
    }

    return firstNonEmptyString(
      value.authority,
      value.AUTHORITY
    );
  }

  function readInstalledComponentName(
    value
  ) {
    if (!value) {
      return null;
    }

    return firstNonEmptyString(
      value.component,
      value.componentName,
      value.component_name,
      value.name
    );
  }

  /* =====================================================
     INSTALLATION INSPECTION
  ===================================================== */

  function inspectInstallation(
    options = {}
  ) {
    const includeTesting =
      options.includeTesting === true;

    const includeIntegration =
      options.includeIntegration !==
        false;

    const components =
      COMPONENTS.filter(
        (component) => {
          if (
            component.testing &&
            !includeTesting
          ) {
            return false;
          }

          if (
            component.group ===
              "integration" &&
            !includeIntegration
          ) {
            return false;
          }

          return true;
        }
      );

    const inspection = {};
    const missingRequired = [];
    const missingOptional = [];
    const authorityMismatches = [];
    const componentNameMismatches = [];
    const warnings = [];

    for (
      const component of components
    ) {
      const located =
        locateInstalledComponent(
          component
        );

      const version =
        readInstalledVersion(
          located.value
        );

      const authority =
        readInstalledAuthority(
          located.value
        );

      const installedComponentName =
        readInstalledComponentName(
          located.value
        );

      inspection[
        component.id
      ] = {
        id:
          component.id,

        name:
          component.name,

        componentName:
          component.componentName,

        path:
          component.path,

        group:
          component.group,

        required:
          component.required,

        installed:
          located.installed,

        namespaceKey:
          located.key,

        version,

        authority,

        installedComponentName,

        dependencies:
          [...component.dependencies]
      };

      if (!located.installed) {
        if (component.required) {
          missingRequired.push(
            component.id
          );
        } else {
          missingOptional.push(
            component.id
          );
        }

        continue;
      }

      if (
        authority &&
        authority !== AUTHORITY
      ) {
        authorityMismatches.push({
          componentId:
            component.id,

          expectedAuthority:
            AUTHORITY,

          actualAuthority:
            authority
        });
      }

      if (
        installedComponentName &&
        installedComponentName !==
          component.componentName
      ) {
        componentNameMismatches.push({
          componentId:
            component.id,

          expectedComponentName:
            component.componentName,

          actualComponentName:
            installedComponentName
        });
      }

      if (!version) {
        warnings.push({
          code:
            "COS_MANIFEST_INSTALLED_VERSION_MISSING",

          componentId:
            component.id
        });
      }
    }

    const dependencyViolations = [];

    for (
      const component of components
    ) {
      const status =
        inspection[
          component.id
        ];

      if (!status.installed) {
        continue;
      }

      for (
        const dependencyId of
          component.dependencies
      ) {
        const dependencyStatus =
          inspection[
            dependencyId
          ];

        if (
          !dependencyStatus ||
          !dependencyStatus.installed
        ) {
          dependencyViolations.push({
            componentId:
              component.id,

            missingDependencyId:
              dependencyId
          });
        }
      }
    }

    const ready =
      missingRequired.length === 0 &&
      authorityMismatches.length === 0 &&
      dependencyViolations.length === 0;

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      manifestType:
        MANIFEST_TYPE,

      ready,

      status:
        ready
          ? "ready"
          : "not_ready",

      includeTesting,

      includeIntegration,

      components:
        inspection,

      missingRequired,

      missingOptional,

      authorityMismatches,

      componentNameMismatches,

      dependencyViolations,

      warnings,

      inspectedAt:
        nowIso()
    };
  }

  function assertInstallation(
    options = {}
  ) {
    const inspection =
      inspectInstallation(
        options
      );

    if (!inspection.ready) {
      throw new CosManifestError(
        "COS_MANIFEST_INSTALLATION_NOT_READY",
        "Conversation Operating System installation is incomplete or invalid.",
        {
          details:
            inspection
        }
      );
    }

    return inspection;
  }

  /* =====================================================
     LOAD-ORDER VALIDATION
  ===================================================== */

  function validateLoadOrder(
    componentIds
  ) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(componentIds)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "COS_MANIFEST_LOAD_ORDER_NOT_ARRAY"
          }
        ],

        warnings
      };
    }

    const positions = {};

    componentIds.forEach(
      (componentId, index) => {
        if (
          positions[
            componentId
          ] !== undefined
        ) {
          errors.push({
            code:
              "COS_MANIFEST_LOAD_ORDER_DUPLICATE",

            componentId,

            firstPosition:
              positions[
                componentId
              ],

            duplicatePosition:
              index
          });
        }

        positions[
          componentId
        ] = index;
      }
    );

    for (
      const componentId of
        componentIds
    ) {
      const component =
        getComponent(
          componentId
        );

      if (!component) {
        errors.push({
          code:
            "COS_MANIFEST_LOAD_ORDER_UNKNOWN_COMPONENT",

          componentId
        });

        continue;
      }

      for (
        const dependencyId of
          component.dependencies
      ) {
        if (
          positions[
            dependencyId
          ] === undefined
        ) {
          errors.push({
            code:
              "COS_MANIFEST_LOAD_ORDER_DEPENDENCY_MISSING",

            componentId,
            dependencyId
          });

          continue;
        }

        if (
          positions[
            dependencyId
          ] >
          positions[
            componentId
          ]
        ) {
          errors.push({
            code:
              "COS_MANIFEST_LOAD_ORDER_DEPENDENCY_AFTER_COMPONENT",

            componentId,

            dependencyId,

            componentPosition:
              positions[
                componentId
              ],

            dependencyPosition:
              positions[
                dependencyId
              ]
          });
        }
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
     SCRIPT PLAN
  ===================================================== */

  function createLoadPlan(
    options = {}
  ) {
    const components =
      resolveLoadOrder({
        includeProduction:
          options.includeProduction !==
          false,

        includeTesting:
          options.includeTesting ===
          true,

        includeIntegration:
          options.includeIntegration !==
          false,

        componentIds:
          Array.isArray(
            options.componentIds
          )
            ? options.componentIds
            : null
      });

    const validation =
      validateLoadOrder(
        components.map(
          (component) =>
            component.id
        )
      );

    if (!validation.valid) {
      throw new CosManifestError(
        "COS_MANIFEST_GENERATED_LOAD_ORDER_INVALID",
        "Generated COS load order failed validation.",
        {
          details:
            validation
        }
      );
    }

    return freezeClone({
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      manifestType:
        MANIFEST_TYPE,

      componentCount:
        components.length,

      componentIds:
        components.map(
          (component) =>
            component.id
        ),

      scriptPaths:
        components.map(
          (component) =>
            component.path
        ),

      entries:
        components.map(
          (component, index) => ({
            order:
              index + 1,

            id:
              component.id,

            name:
              component.name,

            group:
              component.group,

            path:
              component.path,

            required:
              component.required,

            dependencies:
              [...component.dependencies]
          })
        ),

      generatedAt:
        nowIso()
    });
  }

  /* =====================================================
     HTML SCRIPT TAGS
  ===================================================== */

  function createScriptTags(
    options = {}
  ) {
    const plan =
      createLoadPlan(options);

    const attributes =
      isObject(options.attributes)
        ? options.attributes
        : {};

    const attributeText =
      Object.entries(
        attributes
      )
        .map(
          ([key, value]) => {
            if (value === true) {
              return key;
            }

            if (
              value === false ||
              value === null ||
              value === undefined
            ) {
              return null;
            }

            const escaped =
              String(value)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;");

            return `${key}="${escaped}"`;
          }
        )
        .filter(Boolean)
        .join(" ");

    return plan.scriptPaths
      .map(
        (path) =>
          `<script src="${path}"${
            attributeText
              ? ` ${attributeText}`
              : ""
          }></script>`
      )
      .join("\n");
  }

  /* =====================================================
     OPTIONAL DYNAMIC LOADER
  ===================================================== */

  function isScriptAlreadyPresent(
    path
  ) {
    if (
      typeof document ===
        "undefined" ||
      !document ||
      !isFunction(
        document.querySelectorAll
      )
    ) {
      return false;
    }

    const scripts =
      document.querySelectorAll(
        "script[src]"
      );

    for (const script of scripts) {
      const source =
        script.getAttribute("src");

      if (
        source === path ||
        (
          script.src &&
          script.src.endsWith(
            `/${path}`
          )
        )
      ) {
        return true;
      }
    }

    return false;
  }

  function loadScript(
    path,
    options = {}
  ) {
    if (
      typeof document ===
        "undefined" ||
      !document ||
      !isFunction(
        document.createElement
      )
    ) {
      return Promise.reject(
        new CosManifestError(
          "COS_MANIFEST_DOCUMENT_UNAVAILABLE",
          "Dynamic browser loading requires a document."
        )
      );
    }

    if (
      options.skipExisting !== false &&
      isScriptAlreadyPresent(path)
    ) {
      return Promise.resolve({
        path,
        status: "already_present"
      });
    }

    return new Promise(
      (resolve, reject) => {
        const script =
          document.createElement(
            "script"
          );

        script.src = path;

        script.async =
          options.async === true;

        script.defer =
          options.defer === true;

        if (
          isNonEmptyString(
            options.type
          )
        ) {
          script.type =
            options.type;
        }

        if (
          isObject(
            options.attributes
          )
        ) {
          for (
            const [
              attribute,
              value
            ] of Object.entries(
              options.attributes
            )
          ) {
            if (
              value === false ||
              value === null ||
              value === undefined
            ) {
              continue;
            }

            script.setAttribute(
              attribute,
              value === true
                ? ""
                : String(value)
            );
          }
        }

        script.onload = () => {
          resolve({
            path,
            status: "loaded"
          });
        };

        script.onerror =
          (event) => {
            reject(
              new CosManifestError(
                "COS_MANIFEST_SCRIPT_LOAD_FAILED",
                "Failed to load COS script.",
                {
                  details: {
                    path,
                    eventType:
                      event &&
                      event.type
                  },

                  recoverable: true
                }
              )
            );
          };

        const target =
          document.head ||
          document.body ||
          document.documentElement;

        target.appendChild(script);
      }
    );
  }

  async function load(
    options = {}
  ) {
    const plan =
      createLoadPlan(options);

    const results = [];

    for (
      const path of
        plan.scriptPaths
    ) {
      const result =
        await loadScript(
          path,
          {
            async: false,
            defer: false,
            skipExisting:
              options.skipExisting !==
              false,

            type:
              options.type,

            attributes:
              options.attributes
          }
        );

      results.push(result);
    }

    const installation =
      inspectInstallation({
        includeTesting:
          options.includeTesting ===
          true,

        includeIntegration:
          options.includeIntegration !==
          false
      });

    if (
      options.assertReady !== false &&
      !installation.ready
    ) {
      throw new CosManifestError(
        "COS_MANIFEST_DYNAMIC_LOAD_INCOMPLETE",
        "COS scripts loaded, but the installation is not ready.",
        {
          details:
            installation
        }
      );
    }

    return freezeClone({
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

      operation:
        "dynamic_load",

      plan,

      results,

      installation,

      completedAt:
        nowIso()
    });
  }

  /* =====================================================
     MANIFEST VALIDATION
  ===================================================== */

  function validateManifest() {
    const definitionValidation =
      validateDefinitions();

    const productionValidation =
      validateLoadOrder(
        PRODUCTION_LOAD_ORDER
      );

    const integrationValidation =
      validateLoadOrder(
        PRODUCTION_WITH_INTEGRATION_LOAD_ORDER
      );

    const developmentValidation =
      validateLoadOrder(
        DEVELOPMENT_LOAD_ORDER
      );

    const errors = [
      ...definitionValidation.errors,

      ...productionValidation.errors.map(
        (error) => ({
          plan: "production",
          ...error
        })
      ),

      ...integrationValidation.errors.map(
        (error) => ({
          plan:
            "production_with_integration",
          ...error
        })
      ),

      ...developmentValidation.errors.map(
        (error) => ({
          plan: "development",
          ...error
        })
      )
    ];

    const warnings = [
      ...definitionValidation.warnings,

      ...productionValidation.warnings,

      ...integrationValidation.warnings,

      ...developmentValidation.warnings
    ];

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  const MANIFEST_VALIDATION =
    validateManifest();

  if (!MANIFEST_VALIDATION.valid) {
    throw new CosManifestError(
      "COS_MANIFEST_DEFINITION_INVALID",
      "Conversation Operating System manifest definition is invalid.",
      {
        details:
          MANIFEST_VALIDATION
      }
    );
  }

  /* =====================================================
     PUBLIC MANIFEST
  ===================================================== */

  const cosManifest = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    manifestType:
      MANIFEST_TYPE,

    basePath:
      BASE_PATH,

    integrationBasePath:
      INTEGRATION_BASE_PATH,

    componentGroups:
      COMPONENT_GROUPS,

    components:
      COMPONENTS,

    componentById:
      COMPONENT_BY_ID,

    productionLoadOrder:
      PRODUCTION_LOAD_ORDER,

    productionWithIntegrationLoadOrder:
      PRODUCTION_WITH_INTEGRATION_LOAD_ORDER,

    developmentLoadOrder:
      DEVELOPMENT_LOAD_ORDER,

    validation:
      freezeClone(
        MANIFEST_VALIDATION
      ),

    CosManifestError,

    getComponent,

    requireComponent,

    validateDefinitions,

    validateManifest,

    validateLoadOrder,

    resolveLoadOrder,

    createLoadPlan,

    createScriptTags,

    inspectInstallation,

    assertInstallation,

    locateInstalledComponent,

    isScriptAlreadyPresent,

    loadScript,

    load
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.manifest =
    cosManifest;

  ConversationOS.cosManifest =
    cosManifest;

  root.AriCosManifest =
    cosManifest;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosManifest;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);