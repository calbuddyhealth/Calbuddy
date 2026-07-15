// rebirth/conversation-os/core/cos-runtime.js
// ARI Rebirth — Conversation Operating System Runtime
//
// Purpose:
// Orchestrate deterministic conversation-placement processing for the
// Conversation Operating System.
//
// V1.0.0 — Deterministic Conversation Placement Runtime
//
// Canonical flow:
//
// Runtime Input
//      ↓
// Contract Validation
//      ↓
// COS State Initialization
//      ↓
// History Indexing
//      ↓
// Current-Turn Registration
//      ↓
// Reference Resolution
//      ↓
// Conversation Placement
//      ↓
// Thread-State Transition
//      ↓
// Placement Validation
//      ↓
// Authoritative Conversation Placement Packet
//      ↓
// COS Runtime Result
//
// Authority:
//
// The Conversation Operating System is authoritative only for:
//
// - conversation placement,
// - turn attachment,
// - structural thread continuity,
// - source-turn binding,
// - structural reference resolution,
// - conversation-thread lifecycle state.
//
// Non-authority:
//
// This runtime must not:
//
// - interpret semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - determine the user's goal,
// - select response strategy,
// - plan a response,
// - generate a response,
// - reinterpret raw language,
// - override semantic authorities,
// - convert uncertain references into fabricated certainty.
//
// Architectural rule:
//
// This runtime orchestrates authoritative COS components.
// It does not replace those components with hidden language understanding.
//
// Dependencies:
//
// Required:
// - rebirth/conversation-os/core/cos-contract.js
// - rebirth/conversation-os/core/cos-state.js
//
// Pluggable components:
// - cos-history-index.js
// - cos-turn-register.js
// - cos-reference-resolver.js
// - cos-placement-engine.js
// - cos-thread-state-manager.js
// - cos-placement-validator.js
// - cos-packet-builder.js
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.runtime

(function initializeCosRuntime(globalScope) {
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

  const ConversationOS = root.Ari.Rebirth.ConversationOS;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY = "conversation_operating_system";
  const RUNTIME_NAME = "cos-runtime";

  const STAGES = Object.freeze({
    CONTRACT_VALIDATION: "contract_validation",
    STATE_INITIALIZATION: "state_initialization",
    HISTORY_INDEXING: "history_indexing",
    TURN_REGISTRATION: "turn_registration",
    REFERENCE_RESOLUTION: "reference_resolution",
    CONVERSATION_PLACEMENT: "conversation_placement",
    THREAD_STATE_TRANSITION: "thread_state_transition",
    PLACEMENT_VALIDATION: "placement_validation",
    PACKET_BUILDING: "packet_building",
    RESULT_FINALIZATION: "result_finalization"
  });

  const STAGE_ORDER = Object.freeze([
    STAGES.CONTRACT_VALIDATION,
    STAGES.STATE_INITIALIZATION,
    STAGES.HISTORY_INDEXING,
    STAGES.TURN_REGISTRATION,
    STAGES.REFERENCE_RESOLUTION,
    STAGES.CONVERSATION_PLACEMENT,
    STAGES.THREAD_STATE_TRANSITION,
    STAGES.PLACEMENT_VALIDATION,
    STAGES.PACKET_BUILDING,
    STAGES.RESULT_FINALIZATION
  ]);

  const PLACEMENT_TYPES = Object.freeze([
    "new_thread",
    "continue_thread",
    "resume_thread",
    "branch_from_turn",
    "answer_to_turn",
    "clarification_of_turn",
    "correction_of_turn",
    "interruption",
    "return_from_interruption",
    "unresolved_placement"
  ]);

  const REFERENCE_STATUSES = Object.freeze([
    "not_required",
    "resolved",
    "partially_resolved",
    "unresolved"
  ]);

  const THREAD_STATUSES = Object.freeze([
    "active",
    "paused",
    "interrupted",
    "resumed",
    "closed",
    "unknown"
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

  class CosRuntimeError extends Error {
    constructor(
      code,
      message,
      {
        stage = null,
        cause = null,
        details = null,
        recoverable = false
      } = {}
    ) {
      super(message || code || "COS runtime error");

      this.name = "CosRuntimeError";
      this.code = code || "COS_RUNTIME_ERROR";
      this.stage = stage;
      this.cause = cause || null;
      this.details = details || null;
      this.recoverable = recoverable === true;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace === "function"
      ) {
        Error.captureStackTrace(this, CosRuntimeError);
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
    return isString(value) && value.trim().length > 0;
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

  function normalizeBoolean(value, fallback = false) {
    return typeof value === "boolean"
      ? value
      : fallback;
  }

  function normalizeInteger(value, fallback = 0) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.trunc(numeric);
  }

  function normalizeTimestamp(value, fallback = null) {
    if (value instanceof Date) {
      const timestamp = value.toISOString();
      return timestamp;
    }

    if (isNonEmptyString(value)) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return fallback;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function nowMs() {
    if (
      typeof performance !== "undefined" &&
      performance &&
      isFunction(performance.now)
    ) {
      return performance.now();
    }

    return Date.now();
  }

  function elapsedMs(start) {
    const value = nowMs() - start;

    return Number.isFinite(value)
      ? Math.max(0, Math.round(value * 1000) / 1000)
      : 0;
  }

  function createId(prefix = "cos") {
    const time = Date.now().toString(36);

    let random = "";

    if (
      typeof crypto !== "undefined" &&
      crypto &&
      isFunction(crypto.getRandomValues)
    ) {
      const values = new Uint32Array(2);
      crypto.getRandomValues(values);

      random =
        values[0].toString(36) +
        values[1].toString(36);
    } else {
      random =
        Math.random()
          .toString(36)
          .slice(2, 12);
    }

    return `${prefix}_${time}_${random}`;
  }

  function safeClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (error) {
        // Continue to fallback clone.
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function deepFreeze(value, seen = new WeakSet()) {
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

    const properties = Reflect.ownKeys(value);

    for (const property of properties) {
      const child = value[property];

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

  function safeError(error, fallbackCode = "COS_RUNTIME_ERROR") {
    if (error instanceof CosRuntimeError) {
      return {
        name: error.name,
        code: error.code,
        message: error.message,
        stage: error.stage,
        recoverable: error.recoverable,
        details: safeClone(error.details),
        cause:
          error.cause instanceof Error
            ? {
                name: error.cause.name,
                message: error.cause.message
              }
            : safeClone(error.cause)
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name || "Error",
        code: fallbackCode,
        message: error.message || "Unknown error",
        stage: null,
        recoverable: false,
        details: null,
        cause: null
      };
    }

    return {
      name: "Error",
      code: fallbackCode,
      message:
        isNonEmptyString(error)
          ? error
          : "Unknown error",
      stage: null,
      recoverable: false,
      details: safeClone(error),
      cause: null
    };
  }

  function readPath(source, path) {
    if (!source || !isNonEmptyString(path)) {
      return undefined;
    }

    const segments = path.split(".");
    let cursor = source;

    for (const segment of segments) {
      if (
        cursor === null ||
        cursor === undefined
      ) {
        return undefined;
      }

      cursor = cursor[segment];
    }

    return cursor;
  }

  function readFirstPath(source, paths = []) {
    for (const path of paths) {
      const value = readPath(source, path);

      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveComponent({
    explicit = null,
    componentKey,
    required = false
  }) {
    if (explicit) {
      return explicit;
    }

    const aliases =
      COMPONENT_ALIASES[componentKey] || [];

    const namespaces = [
      ConversationOS,
      ConversationOS.core,
      ConversationOS.components,
      root.Ari,
      root
    ].filter(Boolean);

    for (const namespace of namespaces) {
      for (const alias of aliases) {
        if (namespace[alias]) {
          return namespace[alias];
        }
      }
    }

    if (required) {
      throw new CosRuntimeError(
        "COS_COMPONENT_MISSING",
        `Required COS component is missing: ${componentKey}`,
        {
          stage: STAGES.CONTRACT_VALIDATION,
          details: {
            componentKey,
            aliases
          }
        }
      );
    }

    return null;
  }

  function resolveComponents(overrides = {}) {
    return {
      contract: resolveComponent({
        explicit: overrides.contract,
        componentKey: "contract",
        required: true
      }),

      state: resolveComponent({
        explicit: overrides.state,
        componentKey: "state",
        required: true
      }),

      historyIndex: resolveComponent({
        explicit:
          overrides.historyIndex ||
          overrides.historyIndexer,
        componentKey: "historyIndex",
        required: false
      }),

      turnRegister: resolveComponent({
        explicit:
          overrides.turnRegister ||
          overrides.currentTurnRegister,
        componentKey: "turnRegister",
        required: false
      }),

      referenceResolver: resolveComponent({
        explicit: overrides.referenceResolver,
        componentKey: "referenceResolver",
        required: false
      }),

      placementEngine: resolveComponent({
        explicit: overrides.placementEngine,
        componentKey: "placementEngine",
        required: false
      }),

      threadStateManager: resolveComponent({
        explicit: overrides.threadStateManager,
        componentKey: "threadStateManager",
        required: false
      }),

      placementValidator: resolveComponent({
        explicit: overrides.placementValidator,
        componentKey: "placementValidator",
        required: false
      }),

      packetBuilder: resolveComponent({
        explicit: overrides.packetBuilder,
        componentKey: "packetBuilder",
        required: false
      })
    };
  }

  function resolveCallable(
    component,
    methodNames = [],
    {
      required = false,
      componentName = "component",
      stage = null
    } = {}
  ) {
    if (isFunction(component)) {
      return component.bind(component);
    }

    if (component) {
      for (const methodName of methodNames) {
        if (isFunction(component[methodName])) {
          return component[methodName].bind(component);
        }
      }
    }

    if (required) {
      throw new CosRuntimeError(
        "COS_COMPONENT_METHOD_MISSING",
        `No callable method found for ${componentName}`,
        {
          stage,
          details: {
            componentName,
            methodNames
          }
        }
      );
    }

    return null;
  }

  /* =====================================================
     INPUT NORMALIZATION
  ===================================================== */

  function normalizeTurn(rawTurn, {
    fallbackRole = "user",
    fallbackSequence = 0
  } = {}) {
    const source =
      isObject(rawTurn)
        ? rawTurn
        : {
            text:
              rawTurn === null ||
              rawTurn === undefined
                ? ""
                : String(rawTurn)
          };

    const text = firstDefined(
      source.text,
      source.content,
      source.message,
      source.rawText,
      ""
    );

    const turnId = firstNonEmptyString(
      source.turnId,
      source.turn_id,
      source.id
    );

    const role =
      firstNonEmptyString(
        source.role,
        source.speaker,
        fallbackRole
      ) || fallbackRole;

    const sequence = normalizeInteger(
      firstDefined(
        source.sequence,
        source.turnIndex,
        source.turn_index,
        source.index
      ),
      fallbackSequence
    );

    const timestamp = normalizeTimestamp(
      firstDefined(
        source.timestamp,
        source.createdAt,
        source.created_at,
        source.time
      ),
      null
    );

    return {
      ...safeClone(source),

      turnId,
      role,
      text:
        text === null ||
        text === undefined
          ? ""
          : String(text),
      sequence,
      timestamp
    };
  }

  function normalizeHistory(rawHistory = []) {
    const source = Array.isArray(rawHistory)
      ? rawHistory
      : [];

    return source.map((turn, index) =>
      normalizeTurn(turn, {
        fallbackRole: "unknown",
        fallbackSequence: index
      })
    );
  }

  function normalizeRuntimeInput(rawInput = {}) {
    const source = isObject(rawInput)
      ? rawInput
      : {
          currentTurn: rawInput
        };

    const history = normalizeHistory(
      firstDefined(
        source.history,
        source.turns,
        source.conversationHistory,
        source.conversation_history,
        []
      )
    );

    const currentTurnSource = firstDefined(
      source.currentTurn,
      source.current_turn,
      source.turn,
      source.message,
      source.input,
      null
    );

    const currentTurn = normalizeTurn(
      currentTurnSource,
      {
        fallbackRole: "user",
        fallbackSequence: history.length
      }
    );

    if (!currentTurn.turnId) {
      currentTurn.turnId = createId("turn");
    }

    if (
      currentTurn.sequence === 0 &&
      history.length > 0 &&
      !Number.isFinite(
        Number(
          currentTurnSource &&
          currentTurnSource.sequence
        )
      )
    ) {
      currentTurn.sequence = history.length;
    }

    const existingState = firstDefined(
      source.state,
      source.cosState,
      source.cos_state,
      source.previousState,
      source.previous_state,
      null
    );

    const metadata = isObject(source.metadata)
      ? safeClone(source.metadata)
      : {};

    const runtimeOptions = isObject(source.options)
      ? safeClone(source.options)
      : {};

    return {
      schemaVersion:
        firstNonEmptyString(
          source.schemaVersion,
          source.schema_version
        ) || SCHEMA_VERSION,

      requestId:
        firstNonEmptyString(
          source.requestId,
          source.request_id,
          source.executionId,
          source.execution_id
        ) || createId("cos_request"),

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          source.conversation_id,
          source.threadRootId,
          source.thread_root_id
        ) || null,

      currentTurn,
      history,
      existingState:
        existingState === null ||
        existingState === undefined
          ? null
          : safeClone(existingState),

      metadata,
      options: runtimeOptions,

      rawInput: source
    };
  }

  /* =====================================================
     DIAGNOSTICS AND TIMING
  ===================================================== */

  function createRuntimeContext(input, options = {}) {
    return {
      runtimeId: createId("cos_runtime"),
      requestId: input.requestId,
      conversationId: input.conversationId,
      startedAt: nowIso(),
      startedAtMs: nowMs(),
      completedAt: null,

      currentStage: null,

      options: {
        strict:
          options.strict !== false,

        allowStructuralFallbacks:
          options.allowStructuralFallbacks !== false,

        freezePacket:
          options.freezePacket !== false,

        freezeResult:
          options.freezeResult === true,

        collectDiagnostics:
          options.collectDiagnostics !== false,

        collectTiming:
          options.collectTiming !== false,

        throwOnFailure:
          options.throwOnFailure === true
      },

      timings: {
        totalMs: 0,
        stages: {}
      },

      diagnostics: {
        runtime: {
          name: RUNTIME_NAME,
          version: VERSION,
          schemaVersion: SCHEMA_VERSION,
          authority: AUTHORITY
        },

        componentAvailability: {},

        stages: [],

        warnings: [],

        notes: []
      },

      errors: []
    };
  }

  function addWarning(context, warning) {
    if (!context.options.collectDiagnostics) {
      return;
    }

    const normalized = isObject(warning)
      ? {
          code:
            firstNonEmptyString(warning.code) ||
            "COS_RUNTIME_WARNING",

          message:
            firstNonEmptyString(warning.message) ||
            "COS runtime warning",

          stage:
            firstNonEmptyString(
              warning.stage,
              context.currentStage
            ) || null,

          details:
            warning.details === undefined
              ? null
              : safeClone(warning.details)
        }
      : {
          code: "COS_RUNTIME_WARNING",
          message: String(warning),
          stage: context.currentStage,
          details: null
        };

    context.diagnostics.warnings.push(normalized);
  }

  function addNote(context, note) {
    if (!context.options.collectDiagnostics) {
      return;
    }

    context.diagnostics.notes.push(
      isObject(note)
        ? safeClone(note)
        : {
            message: String(note)
          }
    );
  }

  function recordComponentAvailability(
    context,
    components
  ) {
    if (!context.options.collectDiagnostics) {
      return;
    }

    const availability = {};

    for (const [name, component] of Object.entries(components)) {
      availability[name] = Boolean(component);
    }

    context.diagnostics.componentAvailability =
      availability;
  }

  async function runStage(
    context,
    stageName,
    handler
  ) {
    context.currentStage = stageName;

    const started = nowMs();
    const stageRecord = {
      stage: stageName,
      status: "running",
      startedAt: nowIso(),
      completedAt: null,
      durationMs: 0
    };

    if (context.options.collectDiagnostics) {
      context.diagnostics.stages.push(stageRecord);
    }

    try {
      const value = await handler();

      stageRecord.status = "completed";

      return value;
    } catch (error) {
      stageRecord.status = "failed";

      if (error instanceof CosRuntimeError) {
        if (!error.stage) {
          error.stage = stageName;
        }

        throw error;
      }

      throw new CosRuntimeError(
        "COS_STAGE_FAILURE",
        `COS stage failed: ${stageName}`,
        {
          stage: stageName,
          cause: error
        }
      );
    } finally {
      const duration = elapsedMs(started);

      stageRecord.completedAt = nowIso();
      stageRecord.durationMs = duration;

      if (context.options.collectTiming) {
        context.timings.stages[stageName] = duration;
      }
    }
  }

  /* =====================================================
     CONTRACT ADAPTER
  ===================================================== */

  async function validateRuntimeInput({
    contract,
    input,
    context
  }) {
    const validate = resolveCallable(
      contract,
      [
        "validateRuntimeInput",
        "validateInput",
        "validate",
        "assertRuntimeInput",
        "assertInput"
      ],
      {
        required: false,
        componentName: "cos-contract",
        stage: STAGES.CONTRACT_VALIDATION
      }
    );

    if (!validate) {
      validateMinimumInput(input);
      return {
        valid: true,
        source: "runtime_minimum_validation"
      };
    }

    const result = await validate(input, {
      authority: AUTHORITY,
      runtime: RUNTIME_NAME,
      version: VERSION
    });

    const normalized = normalizeValidationResult(result);

    if (!normalized.valid) {
      throw new CosRuntimeError(
        "COS_INPUT_CONTRACT_REJECTED",
        "COS runtime input failed contract validation",
        {
          stage: STAGES.CONTRACT_VALIDATION,
          details: {
            errors: normalized.errors,
            warnings: normalized.warnings
          }
        }
      );
    }

    for (const warning of normalized.warnings) {
      addWarning(context, {
        code: "COS_CONTRACT_WARNING",
        message:
          firstNonEmptyString(
            warning.message,
            warning
          ) || "COS contract warning",
        stage: STAGES.CONTRACT_VALIDATION,
        details: warning
      });
    }

    return normalized;
  }

  function validateMinimumInput(input) {
    if (!isObject(input)) {
      throw new CosRuntimeError(
        "COS_INPUT_INVALID",
        "COS runtime input must be an object",
        {
          stage: STAGES.CONTRACT_VALIDATION
        }
      );
    }

    if (!isObject(input.currentTurn)) {
      throw new CosRuntimeError(
        "COS_CURRENT_TURN_MISSING",
        "COS runtime requires a current turn",
        {
          stage: STAGES.CONTRACT_VALIDATION
        }
      );
    }

    if (!isNonEmptyString(input.currentTurn.turnId)) {
      throw new CosRuntimeError(
        "COS_CURRENT_TURN_ID_MISSING",
        "Current turn requires a turnId",
        {
          stage: STAGES.CONTRACT_VALIDATION
        }
      );
    }

    if (!isString(input.currentTurn.text)) {
      throw new CosRuntimeError(
        "COS_CURRENT_TURN_TEXT_INVALID",
        "Current turn text must be a string",
        {
          stage: STAGES.CONTRACT_VALIDATION
        }
      );
    }

    if (!Array.isArray(input.history)) {
      throw new CosRuntimeError(
        "COS_HISTORY_INVALID",
        "Conversation history must be an array",
        {
          stage: STAGES.CONTRACT_VALIDATION
        }
      );
    }
  }

  function normalizeValidationResult(result) {
    if (result === undefined || result === null) {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

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
            code: "COS_CONTRACT_REJECTED"
          }
        ],
        warnings: []
      };
    }

    if (!isObject(result)) {
      return {
        valid: Boolean(result),
        errors: [],
        warnings: []
      };
    }

    const errors = asArray(
      firstDefined(
        result.errors,
        result.violations,
        result.failures,
        []
      )
    );

    const warnings = asArray(
      firstDefined(
        result.warnings,
        result.notices,
        []
      )
    );

    const explicitValid = firstDefined(
      result.valid,
      result.ok,
      result.passed,
      result.success
    );

    return {
      ...safeClone(result),
      valid:
        typeof explicitValid === "boolean"
          ? explicitValid
          : errors.length === 0,
      errors,
      warnings
    };
  }

  async function validateFinalPacketWithContract({
    contract,
    packet
  }) {
    const validate = resolveCallable(
      contract,
      [
        "validatePlacementPacket",
        "validatePacket",
        "assertPlacementPacket",
        "assertPacket"
      ],
      {
        required: false,
        componentName: "cos-contract",
        stage: STAGES.PACKET_BUILDING
      }
    );

    if (!validate) {
      validateMinimumPacket(packet);

      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

    const result = await validate(packet, {
      authority: AUTHORITY,
      runtime: RUNTIME_NAME,
      version: VERSION
    });

    const normalized = normalizeValidationResult(result);

    if (!normalized.valid) {
      throw new CosRuntimeError(
        "COS_PACKET_CONTRACT_REJECTED",
        "Final placement packet failed contract validation",
        {
          stage: STAGES.PACKET_BUILDING,
          details: {
            errors: normalized.errors,
            warnings: normalized.warnings
          }
        }
      );
    }

    return normalized;
  }

  /* =====================================================
     STATE ADAPTER
  ===================================================== */

  async function initializeState({
    stateComponent,
    input,
    context
  }) {
    const initialize = resolveCallable(
      stateComponent,
      [
        "initialize",
        "create",
        "createInitialState",
        "from",
        "hydrate",
        "load"
      ],
      {
        required: false,
        componentName: "cos-state",
        stage: STAGES.STATE_INITIALIZATION
      }
    );

    let state;

    if (initialize) {
      state = await initialize({
        existingState: input.existingState,
        conversationId: input.conversationId,
        currentTurn: input.currentTurn,
        history: input.history,
        metadata: input.metadata,
        requestId: input.requestId
      });
    } else if (input.existingState) {
      state = safeClone(input.existingState);
    } else {
      state = createMinimumState(input);
    }

    if (!isObject(state)) {
      throw new CosRuntimeError(
        "COS_STATE_INITIALIZATION_INVALID",
        "COS state initializer did not return an object",
        {
          stage: STAGES.STATE_INITIALIZATION,
          details: {
            returnedType: typeof state
          }
        }
      );
    }

    state = ensureMinimumStateShape(state, input);

    const validate = resolveCallable(
      stateComponent,
      [
        "validate",
        "validateState",
        "assert",
        "assertState"
      ],
      {
        required: false,
        componentName: "cos-state",
        stage: STAGES.STATE_INITIALIZATION
      }
    );

    if (validate) {
      const result = normalizeValidationResult(
        await validate(state)
      );

      if (!result.valid) {
        throw new CosRuntimeError(
          "COS_STATE_INVALID",
          "COS state failed state validation",
          {
            stage: STAGES.STATE_INITIALIZATION,
            details: {
              errors: result.errors,
              warnings: result.warnings
            }
          }
        );
      }

      for (const warning of result.warnings) {
        addWarning(context, {
          code: "COS_STATE_WARNING",
          message:
            firstNonEmptyString(
              warning.message,
              warning
            ) || "COS state warning",
          stage: STAGES.STATE_INITIALIZATION,
          details: warning
        });
      }
    }

    return state;
  }

  function createMinimumState(input) {
    return {
      schemaVersion: SCHEMA_VERSION,
      authority: AUTHORITY,

      conversationId:
        input.conversationId ||
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

      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  function ensureMinimumStateShape(state, input) {
    const output = {
      ...safeClone(state)
    };

    output.schemaVersion =
      firstNonEmptyString(output.schemaVersion) ||
      SCHEMA_VERSION;

    output.authority =
      firstNonEmptyString(output.authority) ||
      AUTHORITY;

    output.conversationId =
      firstNonEmptyString(
        output.conversationId,
        input.conversationId
      ) || createId("conversation");

    output.revision = Math.max(
      0,
      normalizeInteger(output.revision, 0)
    );

    output.activeThreadId =
      firstNonEmptyString(output.activeThreadId) ||
      null;

    output.activeTurnId =
      firstNonEmptyString(output.activeTurnId) ||
      null;

    output.threads = isObject(output.threads)
      ? output.threads
      : {};

    output.turns = isObject(output.turns)
      ? output.turns
      : {};

    output.threadStack = Array.isArray(output.threadStack)
      ? output.threadStack
      : [];

    output.interruptionStack = Array.isArray(
      output.interruptionStack
    )
      ? output.interruptionStack
      : [];

    output.lastPlacement = isObject(output.lastPlacement)
      ? output.lastPlacement
      : null;

    output.lastReferenceResolution = isObject(
      output.lastReferenceResolution
    )
      ? output.lastReferenceResolution
      : null;

    output.createdAt =
      normalizeTimestamp(output.createdAt, nowIso());

    output.updatedAt = nowIso();

    return output;
  }

  /* =====================================================
     HISTORY INDEXING
  ===================================================== */

  async function buildHistoryIndex({
    component,
    input,
    state,
    context
  }) {
    const build = resolveCallable(
      component,
      [
        "build",
        "index",
        "create",
        "createIndex",
        "run"
      ],
      {
        required: false,
        componentName: "cos-history-index",
        stage: STAGES.HISTORY_INDEXING
      }
    );

    if (build) {
      const result = await build({
        history: input.history,
        currentTurn: input.currentTurn,
        state,
        conversationId: state.conversationId
      });

      if (!isObject(result)) {
        throw new CosRuntimeError(
          "COS_HISTORY_INDEX_INVALID",
          "History index component must return an object",
          {
            stage: STAGES.HISTORY_INDEXING
          }
        );
      }

      return result;
    }

    addWarning(context, {
      code: "COS_HISTORY_INDEX_FALLBACK",
      message:
        "History index component is unavailable; using deterministic structural indexing.",
      stage: STAGES.HISTORY_INDEXING
    });

    return createStructuralHistoryIndex(
      input.history,
      state
    );
  }

  function createStructuralHistoryIndex(history, state) {
    const byTurnId = {};
    const orderedTurnIds = [];
    const userTurnIds = [];
    const assistantTurnIds = [];
    const byThreadId = {};

    for (let index = 0; index < history.length; index += 1) {
      const source = history[index];

      const turn = normalizeTurn(source, {
        fallbackRole: "unknown",
        fallbackSequence: index
      });

      if (!turn.turnId) {
        turn.turnId = `history_turn_${index}`;
      }

      const threadId = firstNonEmptyString(
        turn.threadId,
        turn.thread_id,
        state.turns &&
          state.turns[turn.turnId] &&
          state.turns[turn.turnId].threadId
      );

      const indexedTurn = {
        ...turn,
        threadId: threadId || null,
        historyIndex: index
      };

      byTurnId[indexedTurn.turnId] = indexedTurn;
      orderedTurnIds.push(indexedTurn.turnId);

      if (indexedTurn.role === "user") {
        userTurnIds.push(indexedTurn.turnId);
      }

      if (indexedTurn.role === "assistant") {
        assistantTurnIds.push(indexedTurn.turnId);
      }

      if (indexedTurn.threadId) {
        byThreadId[indexedTurn.threadId] =
          byThreadId[indexedTurn.threadId] || [];

        byThreadId[indexedTurn.threadId].push(
          indexedTurn.turnId
        );
      }
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      authority: AUTHORITY,

      count: orderedTurnIds.length,

      orderedTurnIds,
      byTurnId,
      byThreadId,

      userTurnIds,
      assistantTurnIds,

      firstTurnId:
        orderedTurnIds.length > 0
          ? orderedTurnIds[0]
          : null,

      lastTurnId:
        orderedTurnIds.length > 0
          ? orderedTurnIds[
              orderedTurnIds.length - 1
            ]
          : null,

      lastUserTurnId:
        userTurnIds.length > 0
          ? userTurnIds[userTurnIds.length - 1]
          : null,

      lastAssistantTurnId:
        assistantTurnIds.length > 0
          ? assistantTurnIds[
              assistantTurnIds.length - 1
            ]
          : null
    };
  }

  /* =====================================================
     CURRENT-TURN REGISTRATION
  ===================================================== */

  async function registerCurrentTurn({
    component,
    input,
    state,
    historyIndex,
    context
  }) {
    const register = resolveCallable(
      component,
      [
        "register",
        "registerTurn",
        "create",
        "run"
      ],
      {
        required: false,
        componentName: "cos-turn-register",
        stage: STAGES.TURN_REGISTRATION
      }
    );

    let registeredTurn;

    if (register) {
      registeredTurn = await register({
        currentTurn: input.currentTurn,
        history: input.history,
        historyIndex,
        state,
        conversationId: state.conversationId,
        requestId: input.requestId
      });
    } else {
      addWarning(context, {
        code: "COS_TURN_REGISTER_FALLBACK",
        message:
          "Turn register component is unavailable; using deterministic structural registration.",
        stage: STAGES.TURN_REGISTRATION
      });

      registeredTurn = createRegisteredTurn({
        currentTurn: input.currentTurn,
        historyIndex,
        state
      });
    }

    if (!isObject(registeredTurn)) {
      throw new CosRuntimeError(
        "COS_REGISTERED_TURN_INVALID",
        "Turn registration must return an object",
        {
          stage: STAGES.TURN_REGISTRATION
        }
      );
    }

    registeredTurn = normalizeRegisteredTurn(
      registeredTurn,
      input.currentTurn,
      historyIndex,
      state
    );

    if (
      historyIndex.byTurnId &&
      historyIndex.byTurnId[registeredTurn.turnId]
    ) {
      throw new CosRuntimeError(
        "COS_DUPLICATE_TURN_ID",
        `Current turn ID already exists in history: ${registeredTurn.turnId}`,
        {
          stage: STAGES.TURN_REGISTRATION,
          details: {
            turnId: registeredTurn.turnId
          }
        }
      );
    }

    return registeredTurn;
  }

  function createRegisteredTurn({
    currentTurn,
    historyIndex,
    state
  }) {
    return {
      ...safeClone(currentTurn),

      turnId:
        currentTurn.turnId ||
        createId("turn"),

      role:
        firstNonEmptyString(currentTurn.role) ||
        "user",

      text:
        currentTurn.text === null ||
        currentTurn.text === undefined
          ? ""
          : String(currentTurn.text),

      sequence:
        Number.isFinite(Number(currentTurn.sequence))
          ? normalizeInteger(currentTurn.sequence, 0)
          : historyIndex.count,

      timestamp:
        normalizeTimestamp(
          currentTurn.timestamp,
          nowIso()
        ),

      conversationId: state.conversationId,

      registeredAt: nowIso()
    };
  }

  function normalizeRegisteredTurn(
    registeredTurn,
    fallbackTurn,
    historyIndex,
    state
  ) {
    const normalized = {
      ...safeClone(fallbackTurn),
      ...safeClone(registeredTurn)
    };

    normalized.turnId =
      firstNonEmptyString(
        normalized.turnId,
        normalized.turn_id,
        fallbackTurn.turnId
      ) || createId("turn");

    normalized.role =
      firstNonEmptyString(
        normalized.role,
        fallbackTurn.role
      ) || "user";

    normalized.text =
      firstDefined(
        normalized.text,
        normalized.content,
        fallbackTurn.text,
        ""
      );

    normalized.text =
      normalized.text === null ||
      normalized.text === undefined
        ? ""
        : String(normalized.text);

    normalized.sequence = normalizeInteger(
      firstDefined(
        normalized.sequence,
        fallbackTurn.sequence,
        historyIndex.count
      ),
      historyIndex.count
    );

    normalized.timestamp =
      normalizeTimestamp(
        firstDefined(
          normalized.timestamp,
          fallbackTurn.timestamp
        ),
        nowIso()
      );

    normalized.conversationId =
      firstNonEmptyString(
        normalized.conversationId,
        state.conversationId
      ) || state.conversationId;

    normalized.registeredAt =
      normalizeTimestamp(
        normalized.registeredAt,
        nowIso()
      );

    return normalized;
  }

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  async function resolveReferences({
    component,
    input,
    state,
    historyIndex,
    currentTurn,
    context
  }) {
    const resolve = resolveCallable(
      component,
      [
        "resolve",
        "resolveReferences",
        "run"
      ],
      {
        required: false,
        componentName: "cos-reference-resolver",
        stage: STAGES.REFERENCE_RESOLUTION
      }
    );

    let result;

    if (resolve) {
      result = await resolve({
        currentTurn,
        history: input.history,
        historyIndex,
        state,
        conversationId: state.conversationId,
        metadata: input.metadata
      });
    } else {
      addWarning(context, {
        code: "COS_REFERENCE_RESOLVER_UNAVAILABLE",
        message:
          "Reference resolver is unavailable; unresolved structural references will not be guessed.",
        stage: STAGES.REFERENCE_RESOLUTION
      });

      result = createConservativeReferenceResolution({
        currentTurn
      });
    }

    return normalizeReferenceResolution(
      result,
      historyIndex
    );
  }

  function createConservativeReferenceResolution({
    currentTurn
  }) {
    const explicitSourceTurnIds = uniqueStrings(
      firstDefined(
        currentTurn.sourceTurnIds,
        currentTurn.source_turn_ids,
        currentTurn.referenceTurnIds,
        currentTurn.reference_turn_ids,
        currentTurn.replyToTurnId,
        currentTurn.reply_to_turn_id,
        []
      )
    );

    const explicitParentTurnId =
      firstNonEmptyString(
        currentTurn.parentTurnId,
        currentTurn.parent_turn_id,
        currentTurn.replyToTurnId,
        currentTurn.reply_to_turn_id
      );

    if (
      explicitParentTurnId &&
      !explicitSourceTurnIds.includes(
        explicitParentTurnId
      )
    ) {
      explicitSourceTurnIds.unshift(
        explicitParentTurnId
      );
    }

    if (explicitSourceTurnIds.length > 0) {
      return {
        status: "resolved",
        required: true,
        resolvedTurnIds: explicitSourceTurnIds,
        unresolvedReferences: [],
        parentTurnId:
          explicitParentTurnId ||
          explicitSourceTurnIds[0],
        source: "explicit_turn_metadata"
      };
    }

    return {
      status: "not_required",
      required: false,
      resolvedTurnIds: [],
      unresolvedReferences: [],
      parentTurnId: null,
      source: "no_explicit_structural_reference"
    };
  }

  function normalizeReferenceResolution(
    result,
    historyIndex
  ) {
    const source = isObject(result)
      ? safeClone(result)
      : {};

    let resolvedTurnIds = uniqueStrings(
      firstDefined(
        source.resolvedTurnIds,
        source.resolved_turn_ids,
        source.sourceTurnIds,
        source.source_turn_ids,
        source.turnIds,
        source.turn_ids,
        []
      )
    );

    const parentTurnId =
      firstNonEmptyString(
        source.parentTurnId,
        source.parent_turn_id,
        source.primaryTurnId,
        source.primary_turn_id
      );

    if (
      parentTurnId &&
      !resolvedTurnIds.includes(parentTurnId)
    ) {
      resolvedTurnIds.unshift(parentTurnId);
    }

    const unresolvedReferences = asArray(
      firstDefined(
        source.unresolvedReferences,
        source.unresolved_references,
        source.unresolved,
        []
      )
    ).map((item) => safeClone(item));

    const unknownResolvedTurnIds =
      resolvedTurnIds.filter(
        (turnId) =>
          !historyIndex.byTurnId ||
          !historyIndex.byTurnId[turnId]
      );

    if (unknownResolvedTurnIds.length > 0) {
      resolvedTurnIds = resolvedTurnIds.filter(
        (turnId) =>
          historyIndex.byTurnId &&
          historyIndex.byTurnId[turnId]
      );

      for (const turnId of unknownResolvedTurnIds) {
        unresolvedReferences.push({
          type: "unknown_turn_id",
          turnId
        });
      }
    }

    const required = normalizeBoolean(
      firstDefined(
        source.required,
        source.referenceRequired,
        source.reference_required
      ),
      resolvedTurnIds.length > 0 ||
        unresolvedReferences.length > 0
    );

    let status = firstNonEmptyString(
      source.status,
      source.resolutionStatus,
      source.resolution_status
    );

    if (!REFERENCE_STATUSES.includes(status)) {
      if (!required) {
        status = "not_required";
      } else if (
        resolvedTurnIds.length > 0 &&
        unresolvedReferences.length === 0
      ) {
        status = "resolved";
      } else if (
        resolvedTurnIds.length > 0 &&
        unresolvedReferences.length > 0
      ) {
        status = "partially_resolved";
      } else {
        status = "unresolved";
      }
    }

    return {
      ...source,

      status,
      required,

      resolvedTurnIds,
      unresolvedReferences,

      parentTurnId:
        parentTurnId &&
        resolvedTurnIds.includes(parentTurnId)
          ? parentTurnId
          : resolvedTurnIds[0] || null
    };
  }

  /* =====================================================
     CONVERSATION PLACEMENT
  ===================================================== */

  async function determinePlacement({
    component,
    input,
    state,
    historyIndex,
    currentTurn,
    referenceResolution,
    context
  }) {
    const place = resolveCallable(
      component,
      [
        "place",
        "determinePlacement",
        "resolvePlacement",
        "run"
      ],
      {
        required: false,
        componentName: "cos-placement-engine",
        stage: STAGES.CONVERSATION_PLACEMENT
      }
    );

    let placement;

    if (place) {
      placement = await place({
        currentTurn,
        history: input.history,
        historyIndex,
        referenceResolution,
        state,
        conversationId: state.conversationId,
        metadata: input.metadata
      });
    } else {
      addWarning(context, {
        code: "COS_PLACEMENT_ENGINE_FALLBACK",
        message:
          "Placement engine is unavailable; using conservative structural placement.",
        stage: STAGES.CONVERSATION_PLACEMENT
      });

      placement = createConservativePlacement({
        state,
        historyIndex,
        currentTurn,
        referenceResolution
      });
    }

    return normalizePlacement({
      placement,
      state,
      historyIndex,
      currentTurn,
      referenceResolution
    });
  }

  function createConservativePlacement({
    state,
    historyIndex,
    currentTurn,
    referenceResolution
  }) {
    const explicitPlacementType =
      firstNonEmptyString(
        currentTurn.placementType,
        currentTurn.placement_type
      );

    const explicitThreadId =
      firstNonEmptyString(
        currentTurn.threadId,
        currentTurn.thread_id
      );

    const sourceTurnIds =
      referenceResolution.resolvedTurnIds;

    const parentTurnId =
      referenceResolution.parentTurnId ||
      sourceTurnIds[0] ||
      null;

    if (
      explicitPlacementType &&
      PLACEMENT_TYPES.includes(explicitPlacementType)
    ) {
      return {
        type: explicitPlacementType,
        threadId:
          explicitThreadId ||
          deriveThreadIdFromParent(
            parentTurnId,
            historyIndex,
            state
          ) ||
          state.activeThreadId ||
          createId("thread"),
        parentTurnId,
        sourceTurnIds
      };
    }

    if (
      referenceResolution.status === "unresolved" ||
      referenceResolution.status ===
        "partially_resolved"
    ) {
      return {
        type: "unresolved_placement",
        threadId:
          explicitThreadId ||
          state.activeThreadId ||
          null,
        parentTurnId,
        sourceTurnIds
      };
    }

    if (sourceTurnIds.length > 0) {
      return {
        type: "continue_thread",
        threadId:
          explicitThreadId ||
          deriveThreadIdFromParent(
            parentTurnId,
            historyIndex,
            state
          ) ||
          state.activeThreadId ||
          createId("thread"),
        parentTurnId,
        sourceTurnIds
      };
    }

    if (state.activeThreadId) {
      return {
        type: "continue_thread",
        threadId: state.activeThreadId,
        parentTurnId:
          state.activeTurnId ||
          historyIndex.lastTurnId ||
          null,
        sourceTurnIds: []
      };
    }

    if (historyIndex.count > 0) {
      const lastTurnId = historyIndex.lastTurnId;

      return {
        type: "continue_thread",
        threadId:
          deriveThreadIdFromParent(
            lastTurnId,
            historyIndex,
            state
          ) || createId("thread"),
        parentTurnId: lastTurnId,
        sourceTurnIds: []
      };
    }

    return {
      type: "new_thread",
      threadId:
        explicitThreadId ||
        createId("thread"),
      parentTurnId: null,
      sourceTurnIds: []
    };
  }

  function deriveThreadIdFromParent(
    parentTurnId,
    historyIndex,
    state
  ) {
    if (!parentTurnId) {
      return null;
    }

    const indexedTurn =
      historyIndex.byTurnId &&
      historyIndex.byTurnId[parentTurnId];

    const stateTurn =
      state.turns &&
      state.turns[parentTurnId];

    return firstNonEmptyString(
      indexedTurn && indexedTurn.threadId,
      stateTurn && stateTurn.threadId
    );
  }

  function normalizePlacement({
    placement,
    state,
    historyIndex,
    currentTurn,
    referenceResolution
  }) {
    const source = isObject(placement)
      ? safeClone(placement)
      : {};

    let type = firstNonEmptyString(
      source.type,
      source.placementType,
      source.placement_type
    );

    if (!PLACEMENT_TYPES.includes(type)) {
      type = "unresolved_placement";
    }

    let sourceTurnIds = uniqueStrings(
      firstDefined(
        source.sourceTurnIds,
        source.source_turn_ids,
        referenceResolution.resolvedTurnIds,
        []
      )
    );

    const parentTurnId =
      firstNonEmptyString(
        source.parentTurnId,
        source.parent_turn_id,
        referenceResolution.parentTurnId
      );

    if (
      parentTurnId &&
      !sourceTurnIds.includes(parentTurnId) &&
      referenceResolution.resolvedTurnIds.includes(
        parentTurnId
      )
    ) {
      sourceTurnIds.unshift(parentTurnId);
    }

    sourceTurnIds = sourceTurnIds.filter(
      (turnId) =>
        historyIndex.byTurnId &&
        historyIndex.byTurnId[turnId]
    );

    let threadId = firstNonEmptyString(
      source.threadId,
      source.thread_id,
      currentTurn.threadId,
      currentTurn.thread_id
    );

    if (!threadId && parentTurnId) {
      threadId = deriveThreadIdFromParent(
        parentTurnId,
        historyIndex,
        state
      );
    }

    if (!threadId && type !== "unresolved_placement") {
      threadId =
        state.activeThreadId ||
        createId("thread");
    }

    if (
      type === "new_thread" &&
      parentTurnId
    ) {
      type = "branch_from_turn";
    }

    if (
      type === "continue_thread" &&
      !threadId
    ) {
      type = "unresolved_placement";
    }

    return {
      ...source,

      type,
      threadId: threadId || null,
      parentTurnId: parentTurnId || null,
      sourceTurnIds
    };
  }

  /* =====================================================
     THREAD-STATE TRANSITION
  ===================================================== */

  async function transitionThreadState({
    component,
    input,
    state,
    historyIndex,
    currentTurn,
    referenceResolution,
    placement,
    context
  }) {
    const transition = resolveCallable(
      component,
      [
        "transition",
        "apply",
        "update",
        "updateState",
        "run"
      ],
      {
        required: false,
        componentName: "cos-thread-state-manager",
        stage: STAGES.THREAD_STATE_TRANSITION
      }
    );

    let result;

    if (transition) {
      result = await transition({
        state,
        currentTurn,
        history: input.history,
        historyIndex,
        referenceResolution,
        placement,
        conversationId: state.conversationId,
        requestId: input.requestId
      });
    } else {
      addWarning(context, {
        code: "COS_THREAD_MANAGER_FALLBACK",
        message:
          "Thread-state manager is unavailable; using deterministic structural state transition.",
        stage: STAGES.THREAD_STATE_TRANSITION
      });

      result = applyStructuralStateTransition({
        state,
        currentTurn,
        placement,
        referenceResolution
      });
    }

    return normalizeStateTransitionResult(
      result,
      state,
      currentTurn,
      placement,
      referenceResolution
    );
  }

  function applyStructuralStateTransition({
    state,
    currentTurn,
    placement,
    referenceResolution
  }) {
    const nextState = ensureMinimumStateShape(
      state,
      {
        conversationId: state.conversationId
      }
    );

    const threadId = placement.threadId;

    if (
      threadId &&
      placement.type !== "unresolved_placement"
    ) {
      const existingThread = isObject(
        nextState.threads[threadId]
      )
        ? nextState.threads[threadId]
        : {};

      const previousStatus =
        firstNonEmptyString(
          existingThread.status
        ) || "unknown";

      const nextStatus = determineThreadStatus(
        placement.type,
        previousStatus
      );

      const existingTurnIds = uniqueStrings(
        existingThread.turnIds || []
      );

      if (
        !existingTurnIds.includes(
          currentTurn.turnId
        )
      ) {
        existingTurnIds.push(currentTurn.turnId);
      }

      nextState.threads[threadId] = {
        ...existingThread,

        threadId,

        status: nextStatus,

        rootTurnId:
          firstNonEmptyString(
            existingThread.rootTurnId
          ) ||
          placement.parentTurnId ||
          currentTurn.turnId,

        turnIds: existingTurnIds,

        lastTurnId: currentTurn.turnId,

        updatedAt: nowIso(),

        createdAt:
          normalizeTimestamp(
            existingThread.createdAt,
            nowIso()
          )
      };

      nextState.turns[currentTurn.turnId] = {
        ...(isObject(nextState.turns[currentTurn.turnId])
          ? nextState.turns[currentTurn.turnId]
          : {}),

        turnId: currentTurn.turnId,
        threadId,

        role: currentTurn.role,
        sequence: currentTurn.sequence,

        parentTurnId:
          placement.parentTurnId,

        sourceTurnIds:
          placement.sourceTurnIds,

        placementType:
          placement.type,

        createdAt:
          currentTurn.timestamp ||
          nowIso()
      };

      nextState.activeThreadId = threadId;
      nextState.activeTurnId = currentTurn.turnId;

      if (
        !nextState.threadStack.includes(threadId)
      ) {
        nextState.threadStack.push(threadId);
      }

      if (placement.type === "interruption") {
        const previousActiveThreadId =
          state.activeThreadId;

        if (
          previousActiveThreadId &&
          previousActiveThreadId !== threadId
        ) {
          nextState.interruptionStack.push({
            interruptedThreadId:
              previousActiveThreadId,
            interruptionThreadId: threadId,
            interruptionTurnId:
              currentTurn.turnId,
            createdAt: nowIso()
          });
        }
      }

      if (
        placement.type ===
          "return_from_interruption" &&
        nextState.interruptionStack.length > 0
      ) {
        nextState.interruptionStack.pop();
      }
    }

    nextState.lastPlacement =
      safeClone(placement);

    nextState.lastReferenceResolution =
      safeClone(referenceResolution);

    nextState.revision =
      Math.max(
        0,
        normalizeInteger(nextState.revision, 0)
      ) + 1;

    nextState.updatedAt = nowIso();

    return {
      state: nextState,
      transition: {
        applied:
          placement.type !==
          "unresolved_placement",

        threadId:
          placement.threadId,

        turnId:
          currentTurn.turnId,

        placementType:
          placement.type
      }
    };
  }

  function determineThreadStatus(
    placementType,
    previousStatus
  ) {
    switch (placementType) {
      case "new_thread":
      case "continue_thread":
      case "branch_from_turn":
      case "answer_to_turn":
      case "clarification_of_turn":
      case "correction_of_turn":
        return "active";

      case "resume_thread":
      case "return_from_interruption":
        return "resumed";

      case "interruption":
        return "interrupted";

      case "unresolved_placement":
        return THREAD_STATUSES.includes(previousStatus)
          ? previousStatus
          : "unknown";

      default:
        return "active";
    }
  }

  function normalizeStateTransitionResult(
    result,
    previousState,
    currentTurn,
    placement,
    referenceResolution
  ) {
    let nextState;
    let transition;

    if (
      isObject(result) &&
      isObject(result.state)
    ) {
      nextState = result.state;
      transition = isObject(result.transition)
        ? result.transition
        : {};
    } else if (isObject(result)) {
      nextState = result;
      transition = {};
    } else {
      throw new CosRuntimeError(
        "COS_STATE_TRANSITION_INVALID",
        "Thread-state transition must return a state object",
        {
          stage: STAGES.THREAD_STATE_TRANSITION
        }
      );
    }

    nextState = ensureMinimumStateShape(
      nextState,
      {
        conversationId:
          previousState.conversationId
      }
    );

    nextState.lastPlacement =
      isObject(nextState.lastPlacement)
        ? nextState.lastPlacement
        : safeClone(placement);

    nextState.lastReferenceResolution =
      isObject(nextState.lastReferenceResolution)
        ? nextState.lastReferenceResolution
        : safeClone(referenceResolution);

    if (
      placement.type !== "unresolved_placement" &&
      placement.threadId
    ) {
      nextState.activeThreadId =
        firstNonEmptyString(
          nextState.activeThreadId,
          placement.threadId
        );

      nextState.activeTurnId =
        firstNonEmptyString(
          nextState.activeTurnId,
          currentTurn.turnId
        );
    }

    nextState.updatedAt = nowIso();

    return {
      state: nextState,

      transition: {
        applied:
          placement.type !==
          "unresolved_placement",

        threadId:
          placement.threadId,

        turnId:
          currentTurn.turnId,

        placementType:
          placement.type,

        ...safeClone(transition)
      }
    };
  }

  /* =====================================================
     PLACEMENT VALIDATION
  ===================================================== */

  async function validatePlacement({
    component,
    state,
    historyIndex,
    currentTurn,
    referenceResolution,
    placement,
    transition,
    context
  }) {
    const validate = resolveCallable(
      component,
      [
        "validate",
        "validatePlacement",
        "assert",
        "run"
      ],
      {
        required: false,
        componentName: "cos-placement-validator",
        stage: STAGES.PLACEMENT_VALIDATION
      }
    );

    let result;

    if (validate) {
      result = await validate({
        state,
        historyIndex,
        currentTurn,
        referenceResolution,
        placement,
        transition
      });
    } else {
      result = validateMinimumPlacement({
        state,
        historyIndex,
        currentTurn,
        referenceResolution,
        placement
      });
    }

    const normalized = normalizeValidationResult(
      result
    );

    for (const warning of normalized.warnings) {
      addWarning(context, {
        code:
          firstNonEmptyString(warning.code) ||
          "COS_PLACEMENT_WARNING",

        message:
          firstNonEmptyString(
            warning.message,
            warning
          ) || "COS placement warning",

        stage: STAGES.PLACEMENT_VALIDATION,

        details: warning
      });
    }

    if (!normalized.valid) {
      throw new CosRuntimeError(
        "COS_PLACEMENT_INVALID",
        "Conversation placement failed validation",
        {
          stage: STAGES.PLACEMENT_VALIDATION,
          details: {
            errors: normalized.errors,
            warnings: normalized.warnings,
            placement
          }
        }
      );
    }

    return normalized;
  }

  function validateMinimumPlacement({
    state,
    historyIndex,
    currentTurn,
    referenceResolution,
    placement
  }) {
    const errors = [];
    const warnings = [];

    if (
      !PLACEMENT_TYPES.includes(
        placement.type
      )
    ) {
      errors.push({
        code: "INVALID_PLACEMENT_TYPE",
        placementType: placement.type
      });
    }

    if (
      placement.type !==
        "unresolved_placement" &&
      !isNonEmptyString(placement.threadId)
    ) {
      errors.push({
        code: "THREAD_ID_REQUIRED",
        placementType: placement.type
      });
    }

    if (
      placement.parentTurnId &&
      (!historyIndex.byTurnId ||
        !historyIndex.byTurnId[
          placement.parentTurnId
        ])
    ) {
      errors.push({
        code: "UNKNOWN_PARENT_TURN",
        parentTurnId:
          placement.parentTurnId
      });
    }

    for (const turnId of placement.sourceTurnIds) {
      if (
        !historyIndex.byTurnId ||
        !historyIndex.byTurnId[turnId]
      ) {
        errors.push({
          code: "UNKNOWN_SOURCE_TURN",
          turnId
        });
      }
    }

    if (
      referenceResolution.status ===
        "unresolved" &&
      placement.type !==
        "unresolved_placement"
    ) {
      errors.push({
        code:
          "UNRESOLVED_REFERENCE_REQUIRES_UNRESOLVED_PLACEMENT"
      });
    }

    if (
      placement.type === "new_thread" &&
      placement.parentTurnId
    ) {
      errors.push({
        code:
          "NEW_THREAD_CANNOT_HAVE_PARENT"
      });
    }

    if (
      placement.type ===
        "unresolved_placement" &&
      isNonEmptyString(placement.threadId)
    ) {
      warnings.push({
        code:
          "UNRESOLVED_PLACEMENT_HAS_THREAD_ID",
        message:
          "Unresolved placement retains a provisional thread ID."
      });
    }

    if (
      state.activeTurnId ===
        currentTurn.turnId &&
      placement.type ===
        "unresolved_placement"
    ) {
      warnings.push({
        code:
          "UNRESOLVED_TURN_SET_ACTIVE",
        message:
          "An unresolved turn should generally not become the active structural turn."
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /* =====================================================
     PACKET BUILDING
  ===================================================== */

  async function buildPlacementPacket({
    component,
    contract,
    input,
    state,
    currentTurn,
    referenceResolution,
    placement,
    validation,
    context
  }) {
    const build = resolveCallable(
      component,
      [
        "build",
        "buildPacket",
        "create",
        "run"
      ],
      {
        required: false,
        componentName: "cos-packet-builder",
        stage: STAGES.PACKET_BUILDING
      }
    );

    let packet;

    if (build) {
      packet = await build({
        schemaVersion: SCHEMA_VERSION,
        authority: AUTHORITY,
        conversationId: state.conversationId,
        currentTurn,
        placement,
        referenceResolution,
        state,
        validation,
        requestId: input.requestId
      });
    } else {
      packet = createCanonicalPlacementPacket({
        input,
        state,
        currentTurn,
        referenceResolution,
        placement
      });
    }

    packet = normalizePlacementPacket({
      packet,
      input,
      state,
      currentTurn,
      referenceResolution,
      placement
    });

    const contractValidation =
      await validateFinalPacketWithContract({
        contract,
        packet
      });

    for (
      const warning of contractValidation.warnings
    ) {
      addWarning(context, {
        code: "COS_PACKET_CONTRACT_WARNING",
        message:
          firstNonEmptyString(
            warning.message,
            warning
          ) || "Placement packet warning",
        stage: STAGES.PACKET_BUILDING,
        details: warning
      });
    }

    return context.options.freezePacket
      ? freezeClone(packet)
      : packet;
  }

  function createCanonicalPlacementPacket({
    input,
    state,
    currentTurn,
    referenceResolution,
    placement
  }) {
    return {
      schemaVersion: SCHEMA_VERSION,
      authority: AUTHORITY,

      conversationId:
        state.conversationId,

      requestId:
        input.requestId,

      currentTurn: {
        turnId: currentTurn.turnId,
        role: currentTurn.role,
        text: currentTurn.text,
        sequence: currentTurn.sequence,
        timestamp:
          currentTurn.timestamp || null
      },

      placement: {
        type: placement.type,
        threadId: placement.threadId,
        parentTurnId:
          placement.parentTurnId,
        sourceTurnIds:
          placement.sourceTurnIds
      },

      referenceResolution: {
        status:
          referenceResolution.status,

        resolvedTurnIds:
          referenceResolution.resolvedTurnIds,

        unresolvedReferences:
          referenceResolution.unresolvedReferences
      }
    };
  }

  function normalizePlacementPacket({
    packet,
    input,
    state,
    currentTurn,
    referenceResolution,
    placement
  }) {
    const source = isObject(packet)
      ? safeClone(packet)
      : {};

    const packetCurrentTurn = isObject(
      source.currentTurn
    )
      ? source.currentTurn
      : {};

    const packetPlacement = isObject(
      source.placement
    )
      ? source.placement
      : {};

    const packetReferenceResolution =
      isObject(source.referenceResolution)
        ? source.referenceResolution
        : {};

    return {
      schemaVersion:
        firstNonEmptyString(
          source.schemaVersion
        ) || SCHEMA_VERSION,

      authority:
        firstNonEmptyString(source.authority) ||
        AUTHORITY,

      conversationId:
        firstNonEmptyString(
          source.conversationId,
          state.conversationId
        ) || state.conversationId,

      requestId:
        firstNonEmptyString(
          source.requestId,
          input.requestId
        ) || input.requestId,

      currentTurn: {
        turnId:
          firstNonEmptyString(
            packetCurrentTurn.turnId,
            currentTurn.turnId
          ) || currentTurn.turnId,

        role:
          firstNonEmptyString(
            packetCurrentTurn.role,
            currentTurn.role
          ) || "user",

        text:
          firstDefined(
            packetCurrentTurn.text,
            currentTurn.text,
            ""
          ),

        sequence: normalizeInteger(
          firstDefined(
            packetCurrentTurn.sequence,
            currentTurn.sequence
          ),
          0
        ),

        timestamp:
          normalizeTimestamp(
            firstDefined(
              packetCurrentTurn.timestamp,
              currentTurn.timestamp
            ),
            null
          )
      },

      placement: {
        type:
          PLACEMENT_TYPES.includes(
            packetPlacement.type
          )
            ? packetPlacement.type
            : placement.type,

        threadId:
          firstNonEmptyString(
            packetPlacement.threadId,
            placement.threadId
          ) || null,

        parentTurnId:
          firstNonEmptyString(
            packetPlacement.parentTurnId,
            placement.parentTurnId
          ) || null,

        sourceTurnIds:
          uniqueStrings(
            firstDefined(
              packetPlacement.sourceTurnIds,
              placement.sourceTurnIds,
              []
            )
          )
      },

      referenceResolution: {
        status:
          REFERENCE_STATUSES.includes(
            packetReferenceResolution.status
          )
            ? packetReferenceResolution.status
            : referenceResolution.status,

        resolvedTurnIds:
          uniqueStrings(
            firstDefined(
              packetReferenceResolution
                .resolvedTurnIds,
              referenceResolution
                .resolvedTurnIds,
              []
            )
          ),

        unresolvedReferences:
          asArray(
            firstDefined(
              packetReferenceResolution
                .unresolvedReferences,
              referenceResolution
                .unresolvedReferences,
              []
            )
          ).map((item) => safeClone(item))
      }
    };
  }

  function validateMinimumPacket(packet) {
    if (!isObject(packet)) {
      throw new CosRuntimeError(
        "COS_PACKET_INVALID",
        "Placement packet must be an object",
        {
          stage: STAGES.PACKET_BUILDING
        }
      );
    }

    if (packet.authority !== AUTHORITY) {
      throw new CosRuntimeError(
        "COS_PACKET_AUTHORITY_INVALID",
        "Placement packet has an invalid authority",
        {
          stage: STAGES.PACKET_BUILDING,
          details: {
            authority: packet.authority
          }
        }
      );
    }

    if (!isObject(packet.currentTurn)) {
      throw new CosRuntimeError(
        "COS_PACKET_CURRENT_TURN_MISSING",
        "Placement packet requires currentTurn",
        {
          stage: STAGES.PACKET_BUILDING
        }
      );
    }

    if (!isObject(packet.placement)) {
      throw new CosRuntimeError(
        "COS_PACKET_PLACEMENT_MISSING",
        "Placement packet requires placement",
        {
          stage: STAGES.PACKET_BUILDING
        }
      );
    }

    if (
      !PLACEMENT_TYPES.includes(
        packet.placement.type
      )
    ) {
      throw new CosRuntimeError(
        "COS_PACKET_PLACEMENT_TYPE_INVALID",
        "Placement packet contains an invalid placement type",
        {
          stage: STAGES.PACKET_BUILDING,
          details: {
            placementType:
              packet.placement.type
          }
        }
      );
    }

    if (
      !isObject(
        packet.referenceResolution
      )
    ) {
      throw new CosRuntimeError(
        "COS_PACKET_REFERENCE_RESOLUTION_MISSING",
        "Placement packet requires referenceResolution",
        {
          stage: STAGES.PACKET_BUILDING
        }
      );
    }

    if (
      !REFERENCE_STATUSES.includes(
        packet.referenceResolution.status
      )
    ) {
      throw new CosRuntimeError(
        "COS_PACKET_REFERENCE_STATUS_INVALID",
        "Placement packet contains an invalid reference-resolution status",
        {
          stage: STAGES.PACKET_BUILDING,
          details: {
            status:
              packet.referenceResolution.status
          }
        }
      );
    }
  }

  /* =====================================================
     RESULT FINALIZATION
  ===================================================== */

  function createSuccessResult({
    input,
    context,
    packet,
    state,
    transition,
    validation
  }) {
    context.completedAt = nowIso();
    context.timings.totalMs = elapsedMs(
      context.startedAtMs
    );

    const result = {
      ok: true,

      schemaVersion: SCHEMA_VERSION,

      runtime: {
        name: RUNTIME_NAME,
        version: VERSION,
        authority: AUTHORITY,
        runtimeId: context.runtimeId,
        requestId: input.requestId,
        conversationId:
          state.conversationId,
        startedAt: context.startedAt,
        completedAt: context.completedAt
      },

      packet,

      state: safeClone(state),

      transition:
        safeClone(transition),

      validation:
        safeClone(validation),

      diagnostics:
        context.options.collectDiagnostics
          ? safeClone(context.diagnostics)
          : null,

      timing:
        context.options.collectTiming
          ? safeClone(context.timings)
          : null,

      errors: []
    };

    return context.options.freezeResult
      ? freezeClone(result)
      : result;
  }

  function createFailureResult({
    input,
    context,
    error,
    state = null,
    partial = {}
  }) {
    context.completedAt = nowIso();
    context.timings.totalMs = elapsedMs(
      context.startedAtMs
    );

    const normalizedError = safeError(error);

    context.errors.push(normalizedError);

    return {
      ok: false,

      schemaVersion: SCHEMA_VERSION,

      runtime: {
        name: RUNTIME_NAME,
        version: VERSION,
        authority: AUTHORITY,
        runtimeId: context.runtimeId,
        requestId:
          input && input.requestId
            ? input.requestId
            : null,
        conversationId:
          state && state.conversationId
            ? state.conversationId
            : input && input.conversationId
              ? input.conversationId
              : null,
        startedAt: context.startedAt,
        completedAt: context.completedAt,
        failedStage:
          normalizedError.stage ||
          context.currentStage
      },

      packet: null,

      state:
        state === null
          ? null
          : safeClone(state),

      partial: safeClone(partial),

      diagnostics:
        context.options.collectDiagnostics
          ? safeClone(context.diagnostics)
          : null,

      timing:
        context.options.collectTiming
          ? safeClone(context.timings)
          : null,

      errors: safeClone(context.errors)
    };
  }

  /* =====================================================
     PUBLIC RUNTIME
  ===================================================== */

  const cosRuntime = {
    version: VERSION,
    schemaVersion: SCHEMA_VERSION,
    authority: AUTHORITY,

    stages: STAGES,
    stageOrder: STAGE_ORDER,

    placementTypes: PLACEMENT_TYPES,
    referenceStatuses: REFERENCE_STATUSES,
    threadStatuses: THREAD_STATUSES,

    CosRuntimeError,

    /**
     * Execute the Conversation Operating System.
     *
     * @param {Object} rawInput
     * @param {Object} runtimeOptions
     * @returns {Promise<Object>}
     */
    async run(
      rawInput = {},
      runtimeOptions = {}
    ) {
      let input;

      try {
        input = normalizeRuntimeInput(rawInput);
      } catch (error) {
        const fallbackInput = {
          requestId: createId("cos_request"),
          conversationId: null
        };

        const fallbackContext =
          createRuntimeContext(
            fallbackInput,
            runtimeOptions
          );

        const result = createFailureResult({
          input: fallbackInput,
          context: fallbackContext,
          error: new CosRuntimeError(
            "COS_INPUT_NORMALIZATION_FAILED",
            "COS runtime input normalization failed",
            {
              stage:
                STAGES.CONTRACT_VALIDATION,
              cause: error
            }
          )
        });

        if (runtimeOptions.throwOnFailure === true) {
          throw error;
        }

        return result;
      }

      const mergedOptions = {
        ...input.options,
        ...runtimeOptions
      };

      const context = createRuntimeContext(
        input,
        mergedOptions
      );

      let components = null;
      let state = null;
      let historyIndex = null;
      let currentTurn = null;
      let referenceResolution = null;
      let placement = null;
      let transitionResult = null;
      let validation = null;
      let packet = null;

      try {
        components = resolveComponents(
          mergedOptions.components || {}
        );

        recordComponentAvailability(
          context,
          components
        );

        await runStage(
          context,
          STAGES.CONTRACT_VALIDATION,
          async () => {
            await validateRuntimeInput({
              contract: components.contract,
              input,
              context
            });
          }
        );

        state = await runStage(
          context,
          STAGES.STATE_INITIALIZATION,
          async () =>
            initializeState({
              stateComponent: components.state,
              input,
              context
            })
        );

        historyIndex = await runStage(
          context,
          STAGES.HISTORY_INDEXING,
          async () =>
            buildHistoryIndex({
              component:
                components.historyIndex,
              input,
              state,
              context
            })
        );

        currentTurn = await runStage(
          context,
          STAGES.TURN_REGISTRATION,
          async () =>
            registerCurrentTurn({
              component:
                components.turnRegister,
              input,
              state,
              historyIndex,
              context
            })
        );

        referenceResolution = await runStage(
          context,
          STAGES.REFERENCE_RESOLUTION,
          async () =>
            resolveReferences({
              component:
                components.referenceResolver,
              input,
              state,
              historyIndex,
              currentTurn,
              context
            })
        );

        placement = await runStage(
          context,
          STAGES.CONVERSATION_PLACEMENT,
          async () =>
            determinePlacement({
              component:
                components.placementEngine,
              input,
              state,
              historyIndex,
              currentTurn,
              referenceResolution,
              context
            })
        );

        transitionResult = await runStage(
          context,
          STAGES.THREAD_STATE_TRANSITION,
          async () =>
            transitionThreadState({
              component:
                components.threadStateManager,
              input,
              state,
              historyIndex,
              currentTurn,
              referenceResolution,
              placement,
              context
            })
        );

        state = transitionResult.state;

        validation = await runStage(
          context,
          STAGES.PLACEMENT_VALIDATION,
          async () =>
            validatePlacement({
              component:
                components.placementValidator,
              state,
              historyIndex,
              currentTurn,
              referenceResolution,
              placement,
              transition:
                transitionResult.transition,
              context
            })
        );

        packet = await runStage(
          context,
          STAGES.PACKET_BUILDING,
          async () =>
            buildPlacementPacket({
              component:
                components.packetBuilder,
              contract: components.contract,
              input,
              state,
              currentTurn,
              referenceResolution,
              placement,
              validation,
              context
            })
        );

        return await runStage(
          context,
          STAGES.RESULT_FINALIZATION,
          async () =>
            createSuccessResult({
              input,
              context,
              packet,
              state,
              transition:
                transitionResult.transition,
              validation
            })
        );
      } catch (error) {
        const failure = createFailureResult({
          input,
          context,
          error,
          state,
          partial: {
            historyIndex,
            currentTurn,
            referenceResolution,
            placement,
            transition:
              transitionResult &&
              transitionResult.transition
                ? transitionResult.transition
                : null,
            validation
          }
        });

        if (context.options.throwOnFailure) {
          if (error instanceof Error) {
            error.cosRuntimeResult = failure;
          }

          throw error;
        }

        return failure;
      }
    },

    /**
     * Normalize runtime input without executing COS.
     */
    normalizeInput(rawInput = {}) {
      return normalizeRuntimeInput(rawInput);
    },

    /**
     * Discover currently installed COS components.
     */
    inspectComponents(overrides = {}) {
      const components =
        resolveComponents(overrides);

      return Object.fromEntries(
        Object.entries(components).map(
          ([name, component]) => [
            name,
            {
              available: Boolean(component),
              version:
                component &&
                firstNonEmptyString(
                  component.version,
                  component.VERSION
                )
                  ? firstNonEmptyString(
                      component.version,
                      component.VERSION
                    )
                  : null
            }
          ]
        )
      );
    },

    /**
     * Validate a placement packet using the installed contract.
     */
    async validatePacket(
      packet,
      {
        contract = null
      } = {}
    ) {
      const resolvedContract =
        resolveComponent({
          explicit: contract,
          componentKey: "contract",
          required: true
        });

      return validateFinalPacketWithContract({
        contract: resolvedContract,
        packet
      });
    }
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.runtime = cosRuntime;
  ConversationOS.cosRuntime = cosRuntime;

  root.AriCosRuntime = cosRuntime;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports = cosRuntime;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);