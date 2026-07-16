// rebirth/conversation-os/cos-controller.js
// ARI Rebirth — Conversation Operating System Controller
//
// Purpose:
// Provide the canonical application-facing controller for the Conversation
// Operating System.
//
// V2.0.0 — Persistent COS Runtime Controller
//
// Canonical execution flow:
//
// Controller Input
//      ↓
// Conversation Identity Resolution
//      ↓
// Persisted State Load
//      ↓
// State Migration
//      ↓
// State Normalization
//      ↓
// COS Runtime Execution
//      ↓
// Resulting State Persistence
//      ↓
// Canonical Controller Result
//
// Authority:
//
// This component is authoritative only for:
//
// - resolving the conversation ID supplied to COS,
// - loading persisted COS state,
// - migrating loaded COS state,
// - selecting persisted or supplied state according to explicit policy,
// - invoking the canonical COS runtime,
// - saving successful resulting COS state,
// - exposing controller-level diagnostics,
// - returning one stable application-facing result.
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
// - independently determine conversation placement,
// - independently mutate thread relationships,
// - independently generate responses.
//
// Architectural rule:
//
// The controller owns lifecycle orchestration around the COS runtime.
//
// The runtime owns execution ordering inside COS.
//
// Persistence owns storage.
//
// Migration owns schema upgrades.
//
// Conversation authorities retain ownership of conversational decisions.
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
    "cos-controller";

  const CONTROLLER_RESULT_TYPE =
    "conversation_operating_system_controller_result";

  const STATE_SOURCE_POLICIES = Object.freeze([
    "prefer_supplied",
    "prefer_persisted",
    "persisted_only",
    "supplied_only"
  ]);

  const DEFAULT_STATE_SOURCE_POLICY =
    "prefer_supplied";

  const CONTROLLER_STAGES = Object.freeze([
    "component_resolution",
    "conversation_id_resolution",
    "state_load",
    "state_migration",
    "state_selection",
    "state_normalization",
    "runtime_execution",
    "state_save"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosControllerError extends Error {
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
        "COS controller error"
      );

      this.name =
        "CosControllerError";

      this.code =
        code ||
        "COS_CONTROLLER_ERROR";

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
          "COS_CONTROLLER_ERROR",

        message:
          error.message ||
          "Unknown COS controller error",

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
        "COS_CONTROLLER_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown COS controller error",

      stage: null,

      recoverable: false,

      details:
        safeClone(error),

      cause: null
    };
  }

  /* =====================================================
     ID GENERATION
  ===================================================== */

  function createConversationId() {
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

    return `cos_conversation_${timestamp}_${randomPart}`;
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
      ConversationOS.persistence,
      ConversationOS.migrations,
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
      runtime:
        overrides.runtime ||
        resolveFromNamespace([
          "runtime",
          "cosRuntime",
          "AriCosRuntime"
        ]),

      state:
        overrides.state ||
        resolveFromNamespace([
          "state",
          "cosState",
          "AriCosState"
        ]),

      stateStore:
        overrides.stateStore ||
        resolveFromNamespace([
          "stateStore",
          "cosStateStore",
          "AriCosStateStore"
        ]),

      stateMigrator:
        overrides.stateMigrator ||
        resolveFromNamespace([
          "stateMigrator",
          "cosStateMigrator",
          "AriCosStateMigrator"
        ]),

      manifest:
        overrides.manifest ||
        resolveFromNamespace([
          "manifest",
          "cosManifest",
          "AriCosManifest"
        ])
    };
  }

  function assertRequiredComponents(
    components,
    {
      requirePersistence = true,
      requireMigration = true
    } = {}
  ) {
    const missing = [];

    if (!components.runtime) {
      missing.push("runtime");
    }

    if (!components.state) {
      missing.push("state");
    }

    if (
      requirePersistence &&
      !components.stateStore
    ) {
      missing.push("stateStore");
    }

    if (
      requireMigration &&
      !components.stateMigrator
    ) {
      missing.push("stateMigrator");
    }

    if (missing.length > 0) {
      throw new CosControllerError(
        "COS_CONTROLLER_COMPONENTS_MISSING",
        "Required COS controller components are missing.",
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

    throw new CosControllerError(
      "COS_CONTROLLER_COMPONENT_NOT_CALLABLE",
      `COS controller component is not callable: ${componentName}`,
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

  function normalizeControllerInput(
    rawInput = {}
  ) {
    const source =
      isObject(rawInput)
        ? rawInput
        : {
            currentTurn:
              rawInput
          };

    const options =
      isObject(source.options)
        ? safeClone(
            source.options
          )
        : {};

    const suppliedState =
      firstDefined(
        source.state,
        source.cosState,
        source.cos_state,
        null
      );

    return {
      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          suppliedState &&
            suppliedState
              .conversationId,
          suppliedState &&
            suppliedState
              .conversation_id
        ) || null,

      state:
        isObject(suppliedState)
          ? safeClone(
              suppliedState
            )
          : null,

      currentTurn:
        isObject(
          firstDefined(
            source.currentTurn,
            source.current_turn,
            source.turn,
            source.message
          )
        )
          ? safeClone(
              firstDefined(
                source.currentTurn,
                source.current_turn,
                source.turn,
                source.message
              )
            )
          : {
              text:
                firstDefined(
                  source.currentTurn,
                  source.current_turn,
                  source.turn,
                  source.message,
                  ""
                ) === null ||
                firstDefined(
                  source.currentTurn,
                  source.current_turn,
                  source.turn,
                  source.message,
                  ""
                ) === undefined
                  ? ""
                  : String(
                      firstDefined(
                        source.currentTurn,
                        source.current_turn,
                        source.turn,
                        source.message,
                        ""
                      )
                    )
            },

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
        ),

      artifactCommand:
        firstDefined(
          source.artifactCommand,
          source.artifact_command,
          source.commands &&
            source.commands.artifact,
          null
        ),

      deliverySequenceCommand:
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

      options
    };
  }

  /* =====================================================
     DIAGNOSTICS
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
    const entry = {
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
        summarizeOutput(
          stage,
          output
        ),

      metadata:
        isObject(metadata)
          ? safeClone(metadata)
          : {}
    };

    diagnostics.stages.push(
      entry
    );

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

  function summarizeOutput(
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
      case "state_load":
        return {
          found:
            output.found === true,

          adapterType:
            output.adapterType ||
            null,

          storageRevision:
            output.storageRevision ||
            null
        };

      case "state_migration":
        return {
          migrated:
            output.migrated === true,

          fromVersion:
            output.fromVersion ||
            null,

          toVersion:
            output.toVersion ||
            null,

          stepCount:
            output.stepCount || 0
        };

      case "state_selection":
        return {
          source:
            output.source ||
            null,

          hadSuppliedState:
            output.hadSuppliedState ===
            true,

          hadPersistedState:
            output.hadPersistedState ===
            true
        };

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

      case "runtime_execution":
        return {
          ok:
            output.ok === true,

          currentTurnId:
            output.currentTurnId ||
            null,

          durationMs:
            output.durationMs || 0,

          errorCount:
            Array.isArray(
              output.errors
            )
              ? output.errors.length
              : 0
        };

      case "state_save":
        return {
          ok:
            output.ok === true,

          adapterType:
            output.adapterType ||
            null,

          storageRevision:
            output.storageRevision ||
            null,

          bytes:
            output.bytes || 0
        };

      default:
        return {
          ok:
            output.ok !== false,

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
      Array.isArray(output.warnings)
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

      recordStage(
        diagnostics,
        {
          stage,
          startedAt,
          status:
            "completed",
          output,
          warnings:
            extractWarnings(output)
        }
      );

      return output;
    } catch (error) {
      const wrapped =
        error instanceof
        CosControllerError
          ? error
          : new CosControllerError(
              "COS_CONTROLLER_STAGE_FAILED",
              `COS controller stage failed: ${stage}`,
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

          metadata: {
            error:
              safeError(wrapped)
          }
        }
      );

      throw wrapped;
    }
  }

  /* =====================================================
     CONVERSATION ID
  ===================================================== */

  function resolveConversationId(
    input,
    options = {}
  ) {
    const supplied =
      firstNonEmptyString(
        input.conversationId,
        options.conversationId,
        options.conversation_id
      );

    if (supplied) {
      return {
        conversationId:
          supplied,

        generated: false,

        source:
          "supplied"
      };
    }

    if (
      options.generateConversationId ===
      false
    ) {
      throw new CosControllerError(
        "COS_CONTROLLER_CONVERSATION_ID_REQUIRED",
        "COS controller requires a conversation ID.",
        {
          stage:
            "conversation_id_resolution"
        }
      );
    }

    return {
      conversationId:
        createConversationId(),

      generated: true,

      source:
        "generated"
    };
  }

  /* =====================================================
     STATE SOURCE POLICY
  ===================================================== */

  function normalizeStateSourcePolicy(
    value
  ) {
    return STATE_SOURCE_POLICIES.includes(
      value
    )
      ? value
      : DEFAULT_STATE_SOURCE_POLICY;
  }

  function selectState({
    suppliedState,
    persistedState,
    policy
  }) {
    const hadSuppliedState =
      isObject(suppliedState);

    const hadPersistedState =
      isObject(persistedState);

    switch (policy) {
      case "persisted_only":
        return {
          state:
            hadPersistedState
              ? safeClone(
                  persistedState
                )
              : null,

          source:
            hadPersistedState
              ? "persisted"
              : "none",

          hadSuppliedState,
          hadPersistedState
        };

      case "supplied_only":
        return {
          state:
            hadSuppliedState
              ? safeClone(
                  suppliedState
                )
              : null,

          source:
            hadSuppliedState
              ? "supplied"
              : "none",

          hadSuppliedState,
          hadPersistedState
        };

      case "prefer_persisted":
        if (hadPersistedState) {
          return {
            state:
              safeClone(
                persistedState
              ),

            source:
              "persisted",

            hadSuppliedState,
            hadPersistedState
          };
        }

        if (hadSuppliedState) {
          return {
            state:
              safeClone(
                suppliedState
              ),

            source:
              "supplied",

            hadSuppliedState,
            hadPersistedState
          };
        }

        return {
          state: null,
          source: "none",
          hadSuppliedState,
          hadPersistedState
        };

      case "prefer_supplied":
      default:
        if (hadSuppliedState) {
          return {
            state:
              safeClone(
                suppliedState
              ),

            source:
              "supplied",

            hadSuppliedState,
            hadPersistedState
          };
        }

        if (hadPersistedState) {
          return {
            state:
              safeClone(
                persistedState
              ),

            source:
              "persisted",

            hadSuppliedState,
            hadPersistedState
          };
        }

        return {
          state: null,
          source: "none",
          hadSuppliedState,
          hadPersistedState
        };
    }
  }

  /* =====================================================
     STATE LOAD
  ===================================================== */

  async function loadPersistedState(
    stateStore,
    conversationId,
    options = {}
  ) {
    if (
      options.loadState === false ||
      options.persistence === false
    ) {
      return {
        ok: true,
        found: false,

        skipped: true,

        conversationId,

        state: null,

        adapterType: null,

        storageRevision: null,

        warnings: []
      };
    }

    const load =
      resolveCallable(
        stateStore,
        [
          "load",
          "safeLoad"
        ],
        "cos-state-store"
      );

    const result =
      await load(
        conversationId,
        {
          ...(
            isObject(
              options.persistenceOptions
            )
              ? options
                  .persistenceOptions
              : {}
          ),

          adapter:
            firstDefined(
              options.storageAdapter,
              options.adapter,
              options
                .persistenceOptions &&
                options
                  .persistenceOptions
                  .adapter
            ),

          keyPrefix:
            firstDefined(
              options.storageKeyPrefix,
              options.keyPrefix,
              options
                .persistenceOptions &&
                options
                  .persistenceOptions
                  .keyPrefix
            ),

          migrate: false,

          validate: false,

          persistMigration: false,

          includeRecord:
            options.includePersistenceRecord ===
            true,

          freeze: false
        }
      );

    if (
      result &&
      result.ok === false
    ) {
      if (
        options.ignoreLoadFailure ===
        true
      ) {
        return {
          ok: false,
          found: false,

          skipped: false,

          conversationId,

          state: null,

          adapterType:
            result.adapterType ||
            null,

          storageRevision:
            result.storageRevision ||
            null,

          warnings: [
            {
              code:
                "COS_CONTROLLER_STATE_LOAD_IGNORED",

              errors:
                safeClone(
                  result.errors || []
                )
            }
          ],

          errors:
            safeClone(
              result.errors || []
            )
        };
      }

      throw new CosControllerError(
        "COS_CONTROLLER_STATE_LOAD_FAILED",
        "Failed to load persisted COS state.",
        {
          stage:
            "state_load",

          details:
            result
        }
      );
    }

    return {
      ...safeClone(result),

      ok: true,

      found:
        result &&
        result.found === true,

      skipped: false,

      state:
        result &&
        result.found &&
        isObject(result.state)
          ? safeClone(
              result.state
            )
          : null
    };
  }

  /* =====================================================
     STATE MIGRATION
  ===================================================== */

  async function migrateState(
    stateMigrator,
    state,
    conversationId,
    options = {}
  ) {
    if (!isObject(state)) {
      return {
        migrated: false,

        skipped: true,

        conversationId,

        fromVersion: null,

        toVersion:
          SCHEMA_VERSION,

        stepCount: 0,

        steps: [],

        warnings: [],

        state: null
      };
    }

    if (
      options.migrateState === false
    ) {
      return {
        migrated: false,

        skipped: true,

        conversationId,

        fromVersion:
          firstNonEmptyString(
            state.schemaVersion,
            state.schema_version
          ) || null,

        toVersion:
          firstNonEmptyString(
            state.schemaVersion,
            state.schema_version
          ) || null,

        stepCount: 0,

        steps: [],

        warnings: [],

        state:
          safeClone(state)
      };
    }

    const migrate =
      resolveCallable(
        stateMigrator,
        [
          "migrate",
          "upgrade",
          "normalize",
          "run"
        ],
        "cos-state-migrator"
      );

    const result =
      await migrate(
        {
          state:
            safeClone(state),

          conversationId,

          fromVersion:
            firstNonEmptyString(
              state.schemaVersion,
              state.schema_version
            ),

          toVersion:
            firstNonEmptyString(
              options.targetSchemaVersion
            ) ||
            stateMigrator
              .currentSchemaVersion ||
            stateMigrator
              .schemaVersion ||
            SCHEMA_VERSION
        },
        {
          freeze: false,

          freezeState: false,

          validate:
            options
              .validateMigratedState !==
            false,

          validator:
            options.stateValidator,

          allowFutureVersion:
            options.allowFutureVersion ===
            true,

          allowNonCurrentTarget:
            options
              .allowNonCurrentTarget ===
            true
        }
      );

    if (
      !isObject(result) ||
      !isObject(result.state)
    ) {
      throw new CosControllerError(
        "COS_CONTROLLER_MIGRATION_RESULT_INVALID",
        "COS state migrator returned an invalid result.",
        {
          stage:
            "state_migration",

          details:
            result
        }
      );
    }

    return safeClone(result);
  }

  /* =====================================================
     STATE NORMALIZATION
  ===================================================== */

  async function normalizeState(
    stateComponent,
    state,
    conversationId,
    options = {}
  ) {
    const hasState =
      isObject(state);

    const operation =
      hasState
        ? resolveCallable(
            stateComponent,
            [
              "normalize",
              "normalizeState"
            ],
            "cos-state"
          )
        : resolveCallable(
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
      hasState
        ? await operation(
            state,
            {
              conversationId,
              freeze: false
            }
          )
        : await operation(
            {
              conversationId
            },
            {
              conversationId,
              freeze: false
            }
          );

    if (!isObject(result)) {
      throw new CosControllerError(
        "COS_CONTROLLER_NORMALIZED_STATE_INVALID",
        "COS state component returned an invalid normalized state.",
        {
          stage:
            "state_normalization"
        }
      );
    }

    result.conversationId =
      firstNonEmptyString(
        result.conversationId,
        conversationId
      ) || conversationId;

    return safeClone(result);
  }

  /* =====================================================
     RUNTIME EXECUTION
  ===================================================== */

  async function executeRuntime(
    runtime,
    {
      input,
      state,
      conversationId,
      options
    }
  ) {
    const execute =
      resolveCallable(
        runtime,
        [
          "run",
          "execute",
          "process",
          "safeRun"
        ],
        "cos-runtime"
      );

    const runtimeOptions = {
      ...(
        isObject(
          options.runtimeOptions
        )
          ? options.runtimeOptions
          : {}
      ),

      components:
        isObject(options.runtimeComponents)
          ? options.runtimeComponents
          : isObject(options.components)
            ? options.components
            : {},

      strictInstallation:
        firstDefined(
          options.strictRuntimeInstallation,
          options.strictInstallation
        ) !== false,

      throwOnFailure:
        options.throwOnRuntimeFailure ===
        true,

      freeze: false,

      includeStageOutputs:
        options.includeRuntimeStageOutputs !==
        false,

      includeReferenceDiagnostics:
        options
          .includeReferenceDiagnostics !==
        false
    };

    const result =
      await execute(
        {
          conversationId,

          state,

          history:
            input.history,

          currentTurn:
            input.currentTurn,

          semanticPacket:
            input.semanticPacket,

          conversationFunction:
            input.conversationFunction,

          upstreamCandidates:
            input.upstreamCandidates,

          uiMetadata:
            input.uiMetadata,

          pendingInteractionCommand:
            input
              .pendingInteractionCommand,

          artifactCommand:
            input.artifactCommand,

          deliverySequenceCommand:
            input
              .deliverySequenceCommand,

          placementEvidence:
            input.placementEvidence,

          metadata:
            input.metadata,

          options:
            runtimeOptions
        },
        runtimeOptions
      );

    if (!isObject(result)) {
      throw new CosControllerError(
        "COS_CONTROLLER_RUNTIME_RESULT_INVALID",
        "COS runtime returned an invalid result.",
        {
          stage:
            "runtime_execution"
        }
      );
    }

    return safeClone(result);
  }

  /* =====================================================
     STATE SAVE
  ===================================================== */

  async function saveResultingState(
    stateStore,
    conversationId,
    state,
    options = {}
  ) {
    if (
      options.saveState === false ||
      options.persistence === false
    ) {
      return {
        ok: true,

        skipped: true,

        conversationId,

        adapterType: null,

        storageRevision: null,

        bytes: 0,

        warnings: []
      };
    }

    if (!isObject(state)) {
      throw new CosControllerError(
        "COS_CONTROLLER_STATE_SAVE_STATE_INVALID",
        "Cannot persist an invalid COS state.",
        {
          stage:
            "state_save"
        }
      );
    }

    const save =
      resolveCallable(
        stateStore,
        [
          "save",
          "safeSave"
        ],
        "cos-state-store"
      );

    const result =
      await save(
        conversationId,
        state,
        {
          ...(
            isObject(
              options.persistenceOptions
            )
              ? options
                  .persistenceOptions
              : {}
          ),

          adapter:
            firstDefined(
              options.storageAdapter,
              options.adapter,
              options
                .persistenceOptions &&
                options
                  .persistenceOptions
                  .adapter
            ),

          keyPrefix:
            firstDefined(
              options.storageKeyPrefix,
              options.keyPrefix,
              options
                .persistenceOptions &&
                options
                  .persistenceOptions
                  .keyPrefix
            ),

          metadata: {
            controllerVersion:
              VERSION,

            runtimeVersion:
              firstNonEmptyString(
                options.runtimeVersion
              ) || null,

            savedBy:
              COMPONENT_NAME,

            ...(
              isObject(
                options.persistenceMetadata
              )
                ? safeClone(
                    options
                      .persistenceMetadata
                  )
                : {}
            )
          },

          validateBeforeSave:
            options
              .validateBeforeSave !==
            false,

          replaceCorruptRecord:
            options
              .replaceCorruptRecord ===
            true,

          includeRecord:
            options
              .includePersistenceRecord ===
            true,

          freeze: false
        }
      );

    if (
      result &&
      result.ok === false
    ) {
      if (
        options.ignoreSaveFailure ===
        true
      ) {
        return {
          ...safeClone(result),

          ok: false,

          skipped: false,

          warnings: [
            {
              code:
                "COS_CONTROLLER_STATE_SAVE_IGNORED",

              errors:
                safeClone(
                  result.errors || []
                )
            }
          ]
        };
      }

      throw new CosControllerError(
        "COS_CONTROLLER_STATE_SAVE_FAILED",
        "Failed to save resulting COS state.",
        {
          stage:
            "state_save",

          details:
            result
        }
      );
    }

    return {
      ...safeClone(result),

      ok: true,

      skipped: false
    };
  }

  /* =====================================================
     MAIN EXECUTION
  ===================================================== */

  async function run(
    rawInput = {},
    options = {}
  ) {
    const controllerStartedAt =
      monotonicNow();

    const diagnostics =
      createDiagnostics();

    const input =
      normalizeControllerInput(
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

    const persistenceEnabled =
      mergedOptions.persistence !==
      false;

    const migrationEnabled =
      mergedOptions.migrateState !==
      false;

    let components;
    let identityResolution;
    let loadResult;
    let migrationResult;
    let selectionResult;
    let normalizedState;
    let runtimeResult;
    let saveResult;

    try {
      components =
        await executeStage(
          diagnostics,
          "component_resolution",
          async () => {
            const resolved =
              resolveComponents(
                isObject(
                  mergedOptions.components
                )
                  ? mergedOptions
                      .components
                  : {}
              );

            assertRequiredComponents(
              resolved,
              {
                requirePersistence:
                  persistenceEnabled,

                requireMigration:
                  migrationEnabled
              }
            );

            return resolved;
          }
        );

      identityResolution =
        await executeStage(
          diagnostics,
          "conversation_id_resolution",
          async () =>
            resolveConversationId(
              input,
              mergedOptions
            )
        );

      const conversationId =
        identityResolution
          .conversationId;

      loadResult =
        await executeStage(
          diagnostics,
          "state_load",
          async () => {
            if (!persistenceEnabled) {
              return {
                ok: true,
                found: false,
                skipped: true,
                conversationId,
                state: null,
                warnings: []
              };
            }

            return loadPersistedState(
              components.stateStore,
              conversationId,
              mergedOptions
            );
          }
        );

      const persistedState =
        loadResult &&
        loadResult.found &&
        isObject(loadResult.state)
          ? safeClone(
              loadResult.state
            )
          : null;

      let migratedPersistedState =
        persistedState;

      migrationResult =
        await executeStage(
          diagnostics,
          "state_migration",
          async () => {
            if (
              !migrationEnabled ||
              !persistedState
            ) {
              return {
                migrated: false,

                skipped: true,

                conversationId,

                fromVersion:
                  persistedState
                    ? firstNonEmptyString(
                        persistedState
                          .schemaVersion,
                        persistedState
                          .schema_version
                      )
                    : null,

                toVersion:
                  persistedState
                    ? firstNonEmptyString(
                        persistedState
                          .schemaVersion,
                        persistedState
                          .schema_version
                      )
                    : SCHEMA_VERSION,

                stepCount: 0,

                steps: [],

                warnings: [],

                state:
                  persistedState
                    ? safeClone(
                        persistedState
                      )
                    : null
              };
            }

            return migrateState(
              components.stateMigrator,
              persistedState,
              conversationId,
              mergedOptions
            );
          }
        );

      if (
        migrationResult &&
        isObject(
          migrationResult.state
        )
      ) {
        migratedPersistedState =
          safeClone(
            migrationResult.state
          );
      }

      selectionResult =
        await executeStage(
          diagnostics,
          "state_selection",
          async () =>
            selectState({
              suppliedState:
                input.state,

              persistedState:
                migratedPersistedState,

              policy:
                normalizeStateSourcePolicy(
                  firstNonEmptyString(
                    mergedOptions
                      .stateSourcePolicy,
                    mergedOptions
                      .state_source_policy
                  ) ||
                  DEFAULT_STATE_SOURCE_POLICY
                )
            })
        );

      normalizedState =
        await executeStage(
          diagnostics,
          "state_normalization",
          async () =>
            normalizeState(
              components.state,
              selectionResult.state,
              conversationId,
              mergedOptions
            )
        );

      runtimeResult =
        await executeStage(
          diagnostics,
          "runtime_execution",
          async () =>
            executeRuntime(
              components.runtime,
              {
                input,

                state:
                  normalizedState,

                conversationId,

                options:
                  mergedOptions
              }
            )
        );

      const runtimeSucceeded =
        runtimeResult.ok === true;

      const shouldSave =
        persistenceEnabled &&
        (
          runtimeSucceeded ||
          mergedOptions
            .saveFailedRuntimeState ===
            true
        );

      saveResult =
        await executeStage(
          diagnostics,
          "state_save",
          async () => {
            if (!shouldSave) {
              return {
                ok: true,

                skipped: true,

                conversationId,

                adapterType:
                  loadResult &&
                  loadResult.adapterType
                    ? loadResult
                        .adapterType
                    : null,

                storageRevision:
                  null,

                bytes: 0,

                warnings:
                  runtimeSucceeded
                    ? []
                    : [
                        {
                          code:
                            "COS_CONTROLLER_SAVE_SKIPPED_AFTER_RUNTIME_FAILURE"
                        }
                      ]
              };
            }

            return saveResultingState(
              components.stateStore,
              conversationId,
              runtimeResult.state,
              {
                ...mergedOptions,

                runtimeVersion:
                  firstNonEmptyString(
                    components.runtime &&
                      components.runtime
                        .version
                  )
              }
            );
          }
        );

      diagnostics.completedAt =
        nowIso();

      diagnostics.durationMs =
        elapsedMilliseconds(
          controllerStartedAt
        );

      const controllerSucceeded =
        runtimeResult.ok === true &&
        (
          saveResult.ok === true ||
          saveResult.skipped === true ||
          mergedOptions
            .ignoreSaveFailure ===
            true
        );

      const result = {
        ok:
          controllerSucceeded,

        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        version:
          VERSION,

        controllerResultType:
          CONTROLLER_RESULT_TYPE,

        conversationId,

        conversationIdGenerated:
          identityResolution
            .generated === true,

        conversationIdSource:
          identityResolution.source,

        stateSource:
          selectionResult.source,

        stateSourcePolicy:
          normalizeStateSourcePolicy(
            firstNonEmptyString(
              mergedOptions
                .stateSourcePolicy,
              mergedOptions
                .state_source_policy
            ) ||
            DEFAULT_STATE_SOURCE_POLICY
          ),

        loadedPersistedState:
          loadResult &&
          loadResult.found === true,

        persistenceEnabled,

        stateLoaded:
          loadResult &&
          loadResult.found === true,

        stateMigrated:
          migrationResult &&
          migrationResult.migrated ===
            true,

        stateSaved:
          saveResult &&
          saveResult.ok === true &&
          saveResult.skipped !== true,

        packet:
          runtimeResult.packet
            ? safeClone(
                runtimeResult.packet
              )
            : null,

        state:
          runtimeResult.state
            ? safeClone(
                runtimeResult.state
              )
            : safeClone(
                normalizedState
              ),

        currentTurn:
          runtimeResult.currentTurn
            ? safeClone(
                runtimeResult
                  .currentTurn
              )
            : safeClone(
                input.currentTurn
              ),

        currentTurnId:
          runtimeResult.currentTurnId ||
          null,

        placement:
          runtimeResult.placement
            ? safeClone(
                runtimeResult.placement
              )
            : null,

        referenceResolution:
          runtimeResult
            .referenceResolution
            ? safeClone(
                runtimeResult
                  .referenceResolution
              )
            : null,

        runtime:
          safeClone(
            runtimeResult
          ),

        persistence: {
          load:
            safeClone(
              loadResult
            ),

          migration:
            safeClone(
              migrationResult
            ),

          save:
            safeClone(
              saveResult
            )
        },

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
          Array.isArray(
            runtimeResult.errors
          )
            ? safeClone(
                runtimeResult.errors
              )
            : []
      };

      return freeze
        ? freezeClone(result)
        : result;
    } catch (error) {
      return handleControllerFailure({
        error,

        input,

        diagnostics,

        controllerStartedAt,

        throwOnFailure,

        freeze,

        partial: {
          components,
          identityResolution,
          loadResult,
          migrationResult,
          selectionResult,
          normalizedState,
          runtimeResult,
          saveResult
        }
      });
    }
  }

  /* =====================================================
     FAILURE RESULT
  ===================================================== */

  function handleControllerFailure({
    error,
    input,
    diagnostics,
    controllerStartedAt,
    throwOnFailure,
    freeze,
    partial = {}
  }) {
    diagnostics.completedAt =
      nowIso();

    diagnostics.durationMs =
      elapsedMilliseconds(
        controllerStartedAt
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

    const conversationId =
      firstNonEmptyString(
        partial.identityResolution &&
          partial.identityResolution
            .conversationId,
        input.conversationId,
        partial.normalizedState &&
          partial.normalizedState
            .conversationId,
        partial.runtimeResult &&
          partial.runtimeResult
            .conversationId
      ) || null;

    const state =
      partial.runtimeResult &&
      isObject(
        partial.runtimeResult.state
      )
        ? safeClone(
            partial.runtimeResult.state
          )
        : isObject(
            partial.normalizedState
          )
          ? safeClone(
              partial.normalizedState
            )
          : isObject(input.state)
            ? safeClone(
                input.state
              )
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

      controllerResultType:
        CONTROLLER_RESULT_TYPE,

      conversationId,

      conversationIdGenerated:
        partial.identityResolution
          ? partial
              .identityResolution
              .generated === true
          : false,

      conversationIdSource:
        partial.identityResolution
          ? partial
              .identityResolution
              .source
          : null,

      stateSource:
        partial.selectionResult
          ? partial
              .selectionResult
              .source
          : null,

      stateSourcePolicy:
        normalizeStateSourcePolicy(
          firstNonEmptyString(
            input.options &&
              input.options
                .stateSourcePolicy,
            input.options &&
              input.options
                .state_source_policy
          ) ||
          DEFAULT_STATE_SOURCE_POLICY
        ),

      loadedPersistedState:
        partial.loadResult &&
        partial.loadResult.found ===
          true,

      persistenceEnabled:
        input.options
          .persistence !== false,

      stateLoaded:
        partial.loadResult &&
        partial.loadResult.found ===
          true,

      stateMigrated:
        partial.migrationResult &&
        partial.migrationResult
          .migrated === true,

      stateSaved:
        partial.saveResult &&
        partial.saveResult.ok ===
          true &&
        partial.saveResult.skipped !==
          true,

      packet:
        partial.runtimeResult &&
        partial.runtimeResult.packet
          ? safeClone(
              partial.runtimeResult
                .packet
            )
          : null,

      state,

      currentTurn:
        partial.runtimeResult &&
        partial.runtimeResult
          .currentTurn
          ? safeClone(
              partial.runtimeResult
                .currentTurn
            )
          : safeClone(
              input.currentTurn
            ),

      currentTurnId:
        partial.runtimeResult &&
        partial.runtimeResult
          .currentTurnId
          ? partial.runtimeResult
              .currentTurnId
          : null,

      placement:
        partial.runtimeResult &&
        partial.runtimeResult
          .placement
          ? safeClone(
              partial.runtimeResult
                .placement
            )
          : null,

      referenceResolution:
        partial.runtimeResult &&
        partial.runtimeResult
          .referenceResolution
          ? safeClone(
              partial.runtimeResult
                .referenceResolution
            )
          : null,

      runtime:
        partial.runtimeResult
          ? safeClone(
              partial.runtimeResult
            )
          : null,

      persistence: {
        load:
          partial.loadResult
            ? safeClone(
                partial.loadResult
              )
            : null,

        migration:
          partial.migrationResult
            ? safeClone(
                partial
                  .migrationResult
              )
            : null,

        save:
          partial.saveResult
            ? safeClone(
                partial.saveResult
              )
            : null
      },

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
     DIRECT STATE OPERATIONS
  ===================================================== */

  async function loadState(
    conversationId,
    options = {}
  ) {
    const components =
      resolveComponents(
        isObject(options.components)
          ? options.components
          : {}
      );

    if (!components.stateStore) {
      throw new CosControllerError(
        "COS_CONTROLLER_STATE_STORE_MISSING",
        "COS state store is not installed.",
        {
          stage:
            "state_load"
        }
      );
    }

    const result =
      await loadPersistedState(
        components.stateStore,
        conversationId,
        {
          ...options,
          loadState: true,
          persistence: true
        }
      );

    if (
      !result.found ||
      !isObject(result.state)
    ) {
      return null;
    }

    let state =
      safeClone(result.state);

    if (
      options.migrateState !== false &&
      components.stateMigrator
    ) {
      const migration =
        await migrateState(
          components.stateMigrator,
          state,
          conversationId,
          options
        );

      state =
        safeClone(
          migration.state
        );
    }

    if (
      components.state &&
      options.normalize !== false
    ) {
      state =
        await normalizeState(
          components.state,
          state,
          conversationId,
          options
        );
    }

    return options.freeze === false
      ? state
      : freezeClone(state);
  }

  async function saveState(
    conversationId,
    state,
    options = {}
  ) {
    const components =
      resolveComponents(
        isObject(options.components)
          ? options.components
          : {}
      );

    if (!components.stateStore) {
      throw new CosControllerError(
        "COS_CONTROLLER_STATE_STORE_MISSING",
        "COS state store is not installed.",
        {
          stage:
            "state_save"
        }
      );
    }

    let normalizedState =
      safeClone(state);

    if (
      components.state &&
      options.normalize !== false
    ) {
      normalizedState =
        await normalizeState(
          components.state,
          normalizedState,
          conversationId,
          options
        );
    }

    return saveResultingState(
      components.stateStore,
      conversationId,
      normalizedState,
      {
        ...options,
        saveState: true,
        persistence: true
      }
    );
  }

  async function removeState(
    conversationId,
    options = {}
  ) {
    const components =
      resolveComponents(
        isObject(options.components)
          ? options.components
          : {}
      );

    if (!components.stateStore) {
      throw new CosControllerError(
        "COS_CONTROLLER_STATE_STORE_MISSING",
        "COS state store is not installed.",
        {
          stage:
            "state_save"
        }
      );
    }

    const remove =
      resolveCallable(
        components.stateStore,
        [
          "remove",
          "delete",
          "clear"
        ],
        "cos-state-store"
      );

    return remove(
      conversationId,
      {
        ...(
          isObject(
            options.persistenceOptions
          )
            ? options
                .persistenceOptions
            : {}
        ),

        adapter:
          firstDefined(
            options.storageAdapter,
            options.adapter
          ),

        keyPrefix:
          firstDefined(
            options.storageKeyPrefix,
            options.keyPrefix
          ),

        freeze:
          options.freeze
      }
    );
  }

  async function createEmptyState(
    {
      conversationId = null,
      freeze = true,
      components: overrides = {}
    } = {}
  ) {
    const components =
      resolveComponents(
        isObject(overrides)
          ? overrides
          : {}
      );

    if (!components.state) {
      throw new CosControllerError(
        "COS_CONTROLLER_STATE_COMPONENT_MISSING",
        "COS state component is not installed.",
        {
          stage:
            "state_normalization"
        }
      );
    }

    const resolvedConversationId =
      firstNonEmptyString(
        conversationId
      ) ||
      createConversationId();

    const state =
      await normalizeState(
        components.state,
        null,
        resolvedConversationId,
        {
          freeze: false
        }
      );

    return freeze
      ? freezeClone(state)
      : state;
  }

  /* =====================================================
     RUN WITHOUT PERSISTENCE
  ===================================================== */

  async function runEphemeral(
    input = {},
    options = {}
  ) {
    return run(
      input,
      {
        ...options,

        persistence: false,

        loadState: false,

        saveState: false
      }
    );
  }

  /* =====================================================
     RUN WITH PERSISTENCE
  ===================================================== */

  async function runPersistent(
    input = {},
    options = {}
  ) {
    return run(
      input,
      {
        ...options,

        persistence: true,

        loadState:
          options.loadState !== false,

        saveState:
          options.saveState !== false
      }
    );
  }

  /* =====================================================
     HEALTH
  ===================================================== */

  function health(
    overrides = {},
    options = {}
  ) {
    const components =
      resolveComponents(
        overrides
      );

    const persistenceRequired =
      options.requirePersistence !==
      false;

    const migrationRequired =
      options.requireMigration !==
      false;

    const installed = {
      runtime: {
        available:
          Boolean(
            components.runtime
          ),

        version:
          components.runtime &&
          firstNonEmptyString(
            components.runtime.version,
            components.runtime.VERSION
          )
      },

      state: {
        available:
          Boolean(
            components.state
          ),

        version:
          components.state &&
          firstNonEmptyString(
            components.state.version,
            components.state.VERSION
          )
      },

      stateStore: {
        available:
          Boolean(
            components.stateStore
          ),

        required:
          persistenceRequired,

        version:
          components.stateStore &&
          firstNonEmptyString(
            components.stateStore
              .version,
            components.stateStore
              .VERSION
          )
      },

      stateMigrator: {
        available:
          Boolean(
            components.stateMigrator
          ),

        required:
          migrationRequired,

        version:
          components.stateMigrator &&
          firstNonEmptyString(
            components.stateMigrator
              .version,
            components.stateMigrator
              .VERSION
          )
      },

      manifest: {
        available:
          Boolean(
            components.manifest
          ),

        required: false,

        version:
          components.manifest &&
          firstNonEmptyString(
            components.manifest
              .version,
            components.manifest
              .VERSION
          )
      }
    };

    const missing = [];

    if (!installed.runtime.available) {
      missing.push("runtime");
    }

    if (!installed.state.available) {
      missing.push("state");
    }

    if (
      persistenceRequired &&
      !installed.stateStore.available
    ) {
      missing.push("stateStore");
    }

    if (
      migrationRequired &&
      !installed
        .stateMigrator.available
    ) {
      missing.push(
        "stateMigrator"
      );
    }

    let runtimeHealth = null;
    let manifestInspection = null;
    const warnings = [];

    if (
      components.runtime &&
      isFunction(
        components.runtime.health
      )
    ) {
      try {
        runtimeHealth =
          components.runtime.health(
            overrides
          );
      } catch (error) {
        warnings.push({
          code:
            "COS_CONTROLLER_RUNTIME_HEALTH_FAILED",

          error:
            safeError(error)
        });
      }
    }

    if (
      components.manifest &&
      isFunction(
        components.manifest
          .inspectInstallation
      )
    ) {
      try {
        manifestInspection =
          components.manifest
            .inspectInstallation({
              includeTesting:
                options
                  .includeTesting ===
                true,

              includeIntegration:
                options
                  .includeIntegration !==
                false
            });
      } catch (error) {
        warnings.push({
          code:
            "COS_CONTROLLER_MANIFEST_INSPECTION_FAILED",

          error:
            safeError(error)
        });
      }
    }

    const ready =
      missing.length === 0 &&
      (
        !runtimeHealth ||
        runtimeHealth.ok !== false
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

      status:
        ready
          ? "ready"
          : "not_ready",

      installed,

      missing,

      runtime:
        runtimeHealth,

      manifest:
        manifestInspection,

      warnings,

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
      throw new CosControllerError(
        "COS_CONTROLLER_NOT_READY",
        "Conversation Operating System controller is not ready.",
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

  const cosController = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    controllerResultType:
      CONTROLLER_RESULT_TYPE,

    stateSourcePolicies:
      STATE_SOURCE_POLICIES,

    defaultStateSourcePolicy:
      DEFAULT_STATE_SOURCE_POLICY,

    stages:
      CONTROLLER_STAGES,

    CosControllerError,

    run,

    execute,

    process,

    safeRun,

    runEphemeral,

    runPersistent,

    loadState,

    saveState,

    removeState,

    createEmptyState,

    createEmptyStateAsync:
      createEmptyState,

    health,

    assertReady,

    normalizeInput:
      normalizeControllerInput,

    resolveComponents,

    assertRequiredComponents,

    resolveConversationId,

    normalizeStateSourcePolicy,

    selectState,

    loadPersistedState,

    migrateState,

    normalizeState,

    executeRuntime,

    saveResultingState
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.controller =
    cosController;

  ConversationOS.cosController =
    cosController;

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