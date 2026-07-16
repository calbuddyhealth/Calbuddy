// rebirth/conversation-os/testing/cos-smoke-test.js
// ARI Rebirth — Conversation Operating System Smoke Test
//
// Purpose:
// Run a compact but meaningful deterministic validation suite against the
// installed Conversation Operating System.
//
// V2.0.0 — Integrated COS Runtime, Persistence, Migration, and Authority Test
//
// Test coverage:
//
// - COS installation readiness
// - canonical empty-state shape
// - auxiliary continuity-state presence
// - empty-conversation placement
// - active-thread continuation
// - explicit reply-to-turn resolution
// - explicit answer-target placement
// - explicit clarification-target placement
// - explicit correction-target placement
// - explicit branch placement
// - explicit interruption placement
// - return-from-interruption placement
// - unresolved-reference preservation
// - duplicate-turn rejection
// - authoritative packet boundaries
// - state revision progression
// - real state-store save and load
// - controller persistence across discarded local state
// - legacy-state migration
// - Rebirth integration authority preservation when installed
//
// Non-responsibility:
//
// This test file must not:
//
// - modify production COS authority rules,
// - provide semantic interpretation,
// - guess references,
// - repair failed placements,
// - alter production state outside isolated test conversations,
// - silently convert failures into passes.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.testing
// window.Ari.Rebirth.ConversationOS.testing.smokeTest
//
// CommonJS:
//
// module.exports = cosSmokeTest

(function initializeCosSmokeTest(globalScope) {
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
  root.Ari.Rebirth.Integration =
    root.Ari.Rebirth.Integration || {};

  const ConversationOS =
    root.Ari.Rebirth.ConversationOS;

  const Integration =
    root.Ari.Rebirth.Integration;

  ConversationOS.testing =
    ConversationOS.testing || {};

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "2.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-smoke-test";

  const SMOKE_RESULT_TYPE =
    "conversation_operating_system_smoke_test_result";

  const PACKET_TYPE =
    "authoritative_conversation_placement_packet";

  const DEFAULT_STORAGE_ADAPTER =
    "memory";

  const REQUIRED_PACKET_KEYS =
    Object.freeze([
      "schemaVersion",
      "authority",
      "packetType",
      "conversationId",
      "currentTurn",
      "placement",
      "referenceResolution"
    ]);

  const FORBIDDEN_PACKET_KEYS =
    Object.freeze([
      "semanticMeaning",
      "semanticFrame",
      "intent",
      "emotion",
      "safety",
      "safetySeverity",
      "responsePlan",
      "responseText",
      "generatedResponse",
      "modelPrompt",
      "confidence",
      "candidates"
    ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosSmokeTestError extends Error {
    constructor(
      code,
      message,
      {
        test = null,
        details = null,
        cause = null
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS smoke test error"
      );

      this.name =
        "CosSmokeTestError";

      this.code =
        code ||
        "COS_SMOKE_TEST_ERROR";

      this.test =
        test || null;

      this.details =
        details;

      this.cause =
        cause;

      if (
        Error.captureStackTrace &&
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          CosSmokeTestError
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

    for (const value of asArray(values)) {
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

  function nowMs() {
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

  function elapsedMs(startedAtMs) {
    const elapsed =
      nowMs() - startedAtMs;

    return Number.isFinite(elapsed)
      ? Math.max(
          0,
          Math.round(
            elapsed * 1000
          ) / 1000
        )
      : 0;
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

  function createId(
    prefix = "test"
  ) {
    const time =
      Date.now().toString(36);

    let random = "";

    if (
      typeof crypto !== "undefined" &&
      crypto &&
      isFunction(
        crypto.getRandomValues
      )
    ) {
      const values =
        new Uint32Array(2);

      crypto.getRandomValues(
        values
      );

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

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name || "Error",

        code:
          firstNonEmptyString(
            error.code
          ) ||
          "COS_SMOKE_TEST_ERROR",

        message:
          error.message ||
          "Unknown smoke-test error",

        test:
          firstNonEmptyString(
            error.test
          ) || null,

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
        "COS_SMOKE_TEST_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown smoke-test error",

      test: null,

      details:
        safeClone(error),

      cause: null
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
     ASSERTIONS
  ===================================================== */

  function assert(
    condition,
    message,
    details = null
  ) {
    if (condition) {
      return;
    }

    throw new CosSmokeTestError(
      "COS_SMOKE_ASSERTION_FAILED",
      message,
      {
        details
      }
    );
  }

  function assertEqual(
    actual,
    expected,
    message
  ) {
    assert(
      actual === expected,
      message ||
        `Expected ${String(
          expected
        )} but received ${String(
          actual
        )}.`,
      {
        actual:
          safeClone(actual),

        expected:
          safeClone(expected)
      }
    );
  }

  function assertNotEqual(
    actual,
    unexpected,
    message
  ) {
    assert(
      actual !== unexpected,
      message ||
        `Did not expect ${String(
          unexpected
        )}.`,
      {
        actual:
          safeClone(actual),

        unexpected:
          safeClone(unexpected)
      }
    );
  }

  function assertObject(
    value,
    message
  ) {
    assert(
      isObject(value),
      message ||
        "Expected an object.",
      {
        actual:
          safeClone(value)
      }
    );
  }

  function assertArray(
    value,
    message
  ) {
    assert(
      Array.isArray(value),
      message ||
        "Expected an array.",
      {
        actual:
          safeClone(value)
      }
    );
  }

  function assertArrayIncludes(
    array,
    expected,
    message
  ) {
    assertArray(
      array,
      message ||
        "Expected an array."
    );

    assert(
      array.includes(expected),
      message ||
        `Expected array to include ${String(
          expected
        )}.`,
      {
        actual:
          safeClone(array),

        expected:
          safeClone(expected)
      }
    );
  }

  function assertNonEmptyString(
    value,
    message
  ) {
    assert(
      isNonEmptyString(value),
      message ||
        "Expected a non-empty string.",
      {
        actual:
          safeClone(value)
      }
    );
  }

  function assertGreaterThan(
    actual,
    minimum,
    message
  ) {
    assert(
      Number(actual) >
        Number(minimum),
      message ||
        `Expected ${String(
          actual
        )} to be greater than ${String(
          minimum
        )}.`,
      {
        actual,
        minimum
      }
    );
  }

  /* =====================================================
     COS DISCOVERY
  ===================================================== */

  function resolveConversationOS(
    override = null
  ) {
    if (override) {
      return override;
    }

    return (
      ConversationOS.index ||
      ConversationOS.api ||
      ConversationOS.publicApi ||
      root.AriConversationOS ||
      ConversationOS.controller ||
      ConversationOS.cosController ||
      null
    );
  }

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

  function resolveStateComponent(
    override = null
  ) {
    return (
      override ||
      ConversationOS.state ||
      ConversationOS.cosState ||
      root.AriCosState ||
      null
    );
  }

  function resolveStateStore(
    override = null
  ) {
    return (
      override ||
      ConversationOS.stateStore ||
      ConversationOS.cosStateStore ||
      root.AriCosStateStore ||
      null
    );
  }

  function resolveStateMigrator(
    override = null
  ) {
    return (
      override ||
      ConversationOS.stateMigrator ||
      ConversationOS.cosStateMigrator ||
      root.AriCosStateMigrator ||
      null
    );
  }

  function resolveIntegrationStage(
    override = null
  ) {
    return (
      override ||
      Integration.conversationOSStage ||
      Integration.cosStage ||
      Integration
        .rebirthConversationOSStage ||
      root
        .AriRebirthConversationOSStage ||
      null
    );
  }

  function resolveCallable(
    component,
    methods,
    errorCode,
    errorMessage
  ) {
    if (isFunction(component)) {
      return component.bind(
        component
      );
    }

    if (component) {
      for (const method of methods) {
        if (
          isFunction(
            component[method]
          )
        ) {
          return component[
            method
          ].bind(component);
        }
      }
    }

    throw new CosSmokeTestError(
      errorCode,
      errorMessage,
      {
        details: {
          methods
        }
      }
    );
  }

  function resolveRun(
    conversationOS
  ) {
    return resolveCallable(
      conversationOS,
      [
        "run",
        "execute",
        "process"
      ],
      "COS_SMOKE_RUNTIME_UNAVAILABLE",
      "Conversation Operating System does not expose a callable run method."
    );
  }

  function resolveInspect(
    conversationOS
  ) {
    if (!conversationOS) {
      return null;
    }

    for (
      const method of [
        "inspect",
        "inspectInstallation",
        "health"
      ]
    ) {
      if (
        isFunction(
          conversationOS[method]
        )
      ) {
        return conversationOS[
          method
        ].bind(
          conversationOS
        );
      }
    }

    return null;
  }

  /* =====================================================
     TEST DATA
  ===================================================== */

  function createTurn({
    turnId,
    role,
    text,
    sequence,
    threadId = null,
    parentTurnId = null,
    sourceTurnIds = [],
    placementType = null,
    replyToTurnId = null,
    answerTargetTurnId = null,
    clarificationTargetTurnId = null,
    correctionTargetTurnId = null,
    branchOriginTurnId = null,
    interruptionOriginTurnId = null,
    resumeTargetTurnId = null
  }) {
    return {
      turnId,
      role,
      text,
      sequence,

      timestamp:
        nowIso(),

      ...(threadId
        ? {
            threadId
          }
        : {}),

      ...(parentTurnId
        ? {
            parentTurnId
          }
        : {}),

      ...(sourceTurnIds.length > 0
        ? {
            sourceTurnIds:
              [...sourceTurnIds]
          }
        : {}),

      ...(placementType
        ? {
            placementType
          }
        : {}),

      ...(replyToTurnId
        ? {
            replyToTurnId
          }
        : {}),

      ...(answerTargetTurnId
        ? {
            answerTargetTurnId
          }
        : {}),

      ...(clarificationTargetTurnId
        ? {
            clarificationTargetTurnId
          }
        : {}),

      ...(correctionTargetTurnId
        ? {
            correctionTargetTurnId
          }
        : {}),

      ...(branchOriginTurnId
        ? {
            branchOriginTurnId
          }
        : {}),

      ...(interruptionOriginTurnId
        ? {
            interruptionOriginTurnId
          }
        : {}),

      ...(resumeTargetTurnId
        ? {
            resumeTargetTurnId
          }
        : {})
    };
  }

  function appendHistory(
    history,
    turn,
    packet
  ) {
    const placement =
      packet &&
      isObject(packet.placement)
        ? packet.placement
        : {};

    return [
      ...history,

      {
        ...safeClone(turn),

        threadId:
          firstNonEmptyString(
            placement.threadId,
            placement.thread_id,
            turn.threadId
          ) || null,

        parentTurnId:
          firstNonEmptyString(
            placement.parentTurnId,
            placement.parent_turn_id,
            turn.parentTurnId
          ) || null,

        sourceTurnIds:
          uniqueStrings([
            ...asArray(
              placement.sourceTurnIds
            ),

            ...asArray(
              placement.source_turn_ids
            ),

            ...asArray(
              turn.sourceTurnIds
            )
          ])
      }
    ];
  }

  function createLegacyState(
    conversationId
  ) {
    const timestamp =
      nowIso();

    return {
      schemaVersion:
        "0.0.0",

      conversation_id:
        conversationId,

      state_revision: 3,

      active_thread_id:
        "legacy_thread_1",

      active_turn_id:
        "legacy_turn_1",

      turns: {
        legacy_turn_1: {
          id:
            "legacy_turn_1",

          speaker:
            "user",

          message:
            "Legacy state turn.",

          sequence: 0,

          thread_id:
            "legacy_thread_1",

          created_at:
            timestamp
        }
      },

      threads: {
        legacy_thread_1: {
          id:
            "legacy_thread_1",

          status:
            "active",

          turn_ids: [
            "legacy_turn_1"
          ],

          first_turn_id:
            "legacy_turn_1",

          last_turn_id:
            "legacy_turn_1",

          created_at:
            timestamp
        }
      },

      thread_stack: [
        "legacy_thread_1"
      ],

      interruption_stack: [],

      created_at:
        timestamp,

      updated_at:
        timestamp
    };
  }

  /* =====================================================
     RESULT READERS
  ===================================================== */

  function readPlacementType(
    packetOrResult
  ) {
    const placement =
      packetOrResult &&
      isObject(
        packetOrResult.placement
      )
        ? packetOrResult.placement
        : packetOrResult &&
          packetOrResult.packet &&
          isObject(
            packetOrResult
              .packet.placement
          )
          ? packetOrResult
              .packet.placement
          : {};

    return firstNonEmptyString(
      placement.type,
      placement.placementType,
      placement.placement_type
    );
  }

  function readPlacementThreadId(
    packetOrResult
  ) {
    const placement =
      packetOrResult &&
      isObject(
        packetOrResult.placement
      )
        ? packetOrResult.placement
        : packetOrResult &&
          packetOrResult.packet &&
          isObject(
            packetOrResult
              .packet.placement
          )
          ? packetOrResult
              .packet.placement
          : {};

    return firstNonEmptyString(
      placement.threadId,
      placement.thread_id
    );
  }

  function readPlacementParentTurnId(
    packetOrResult
  ) {
    const placement =
      packetOrResult &&
      isObject(
        packetOrResult.placement
      )
        ? packetOrResult.placement
        : packetOrResult &&
          packetOrResult.packet &&
          isObject(
            packetOrResult
              .packet.placement
          )
          ? packetOrResult
              .packet.placement
          : {};

    return firstNonEmptyString(
      placement.parentTurnId,
      placement.parent_turn_id
    );
  }

  function readReferenceResolution(
    result
  ) {
    if (
      result &&
      isObject(
        result.referenceResolution
      )
    ) {
      return result
        .referenceResolution;
    }

    if (
      result &&
      result.packet &&
      isObject(
        result.packet
          .referenceResolution
      )
    ) {
      return result.packet
        .referenceResolution;
    }

    return null;
  }

  function readInspectionReady(
    inspection
  ) {
    if (!isObject(inspection)) {
      return false;
    }

    if (
      typeof inspection.ready ===
      "boolean"
    ) {
      return inspection.ready;
    }

    if (
      typeof inspection.ok ===
      "boolean"
    ) {
      return inspection.ok;
    }

    return (
      inspection.status ===
      "ready"
    );
  }

  /* =====================================================
     RESULT ASSERTIONS
  ===================================================== */

  function assertSuccess(
    result
  ) {
    assertObject(
      result,
      "COS result must be an object."
    );

    assertEqual(
      result.ok,
      true,
      "COS execution should succeed."
    );

    assertObject(
      result.packet,
      "Successful COS result requires a packet."
    );

    assertObject(
      result.state,
      "Successful COS result requires state."
    );
  }

  function assertStructuredFailure(
    result,
    message
  ) {
    assertObject(
      result,
      message ||
        "Expected a structured COS failure result."
    );

    assertEqual(
      result.ok,
      false,
      message ||
        "COS execution should fail."
    );

    assertArray(
      result.errors,
      "COS failure must expose an errors array."
    );

    assertGreaterThan(
      result.errors.length,
      0,
      "COS failure must expose at least one error."
    );
  }

  function assertPacketShape(
    packet
  ) {
    assertObject(
      packet,
      "Packet must be an object."
    );

    for (
      const requiredKey of
        REQUIRED_PACKET_KEYS
    ) {
      assert(
        hasOwn(
          packet,
          requiredKey
        ),
        `Packet is missing required field: ${requiredKey}`,
        {
          requiredKey,

          actualKeys:
            Object.keys(packet)
        }
      );
    }

    assertEqual(
      packet.schemaVersion,
      SCHEMA_VERSION,
      "Packet schema version mismatch."
    );

    assertEqual(
      packet.authority,
      AUTHORITY,
      "Packet authority mismatch."
    );

    assertEqual(
      packet.packetType,
      PACKET_TYPE,
      "Packet type mismatch."
    );

    assertObject(
      packet.currentTurn,
      "Packet requires currentTurn."
    );

    assertObject(
      packet.placement,
      "Packet requires placement."
    );

    assertObject(
      packet.referenceResolution,
      "Packet requires referenceResolution."
    );

    for (
      const forbiddenKey of
        FORBIDDEN_PACKET_KEYS
    ) {
      assert(
        !hasOwn(
          packet,
          forbiddenKey
        ),
        `Authoritative COS packet must not expose ${forbiddenKey}.`,
        {
          forbiddenKey,

          actualKeys:
            Object.keys(packet)
        }
      );
    }
  }

  function assertAuxiliaryStateShape(
    state
  ) {
    assertObject(
      state.pendingInteractionState,
      "COS state requires pendingInteractionState."
    );

    assertObject(
      state
        .pendingInteractionState
        .interactions,
      "Pending-interaction state requires interactions."
    );

    assertArray(
      state
        .pendingInteractionState
        .order,
      "Pending-interaction state requires order."
    );

    assertObject(
      state.artifactState,
      "COS state requires artifactState."
    );

    assertObject(
      state.artifactState.artifacts,
      "Artifact state requires artifacts."
    );

    assertArray(
      state.artifactState.order,
      "Artifact state requires order."
    );

    assertObject(
      state
        .deliverySequenceState,
      "COS state requires deliverySequenceState."
    );

    assertObject(
      state
        .deliverySequenceState
        .sequences,
      "Delivery-sequence state requires sequences."
    );

    assertArray(
      state
        .deliverySequenceState
        .order,
      "Delivery-sequence state requires order."
    );
  }

  /* =====================================================
     TEST RUNNER
  ===================================================== */

  async function executeTest(
    name,
    handler,
    {
      optional = false
    } = {}
  ) {
    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    try {
      const details =
        await handler();

      if (
        details &&
        details.skipped === true
      ) {
        return {
          name,

          passed: true,

          skipped: true,

          optional,

          status:
            "skipped",

          startedAt,

          completedAt:
            nowIso(),

          durationMs:
            elapsedMs(
              startedAtMs
            ),

          details:
            safeClone(details),

          error: null
        };
      }

      return {
        name,

        passed: true,

        skipped: false,

        optional,

        status:
          "passed",

        startedAt,

        completedAt:
          nowIso(),

        durationMs:
          elapsedMs(
            startedAtMs
          ),

        details:
          details === undefined
            ? null
            : safeClone(details),

        error: null
      };
    } catch (error) {
      return {
        name,

        passed: false,

        skipped: false,

        optional,

        status:
          optional
            ? "optional_failed"
            : "failed",

        startedAt,

        completedAt:
          nowIso(),

        durationMs:
          elapsedMs(
            startedAtMs
          ),

        details: null,

        error:
          safeError(error)
      };
    }
  }

  /* =====================================================
     PERSISTENCE HELPERS
  ===================================================== */

  async function removeStoredState(
    controller,
    conversationId,
    persistenceOptions
  ) {
    if (!controller) {
      return null;
    }

    const remove =
      isFunction(
        controller.removeState
      )
        ? controller.removeState.bind(
            controller
          )
        : null;

    if (!remove) {
      return null;
    }

    try {
      return await remove(
        conversationId,
        {
          persistence: true,

          storageAdapter:
            persistenceOptions
              .storageAdapter,

          storageKeyPrefix:
            persistenceOptions
              .storageKeyPrefix,

          freeze: false
        }
      );
    } catch (error) {
      return {
        ok: false,

        error:
          safeError(error)
      };
    }
  }

  /* =====================================================
     PUBLIC RUN
  ===================================================== */

  async function run(
    options = {}
  ) {
    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    const conversationOS =
      resolveConversationOS(
        options.conversationOS
      );

    const controller =
      resolveController(
        options.controller
      );

    const stateComponent =
      resolveStateComponent(
        options.stateComponent
      );

    const stateStore =
      resolveStateStore(
        options.stateStore
      );

    const stateMigrator =
      resolveStateMigrator(
        options.stateMigrator
      );

    const integrationStage =
      resolveIntegrationStage(
        options.integrationStage
      );

    assert(
      conversationOS,
      "Conversation Operating System is not installed."
    );

    const execute =
      resolveRun(
        conversationOS
      );

    const inspect =
      resolveInspect(
        conversationOS
      );

    const conversationId =
      options.conversationId ||
      createId(
        "cos_smoke_conversation"
      );

    const persistenceConversationId =
      createId(
        "cos_smoke_persistence"
      );

    const migrationConversationId =
      createId(
        "cos_smoke_migration"
      );

    const integrationConversationId =
      createId(
        "cos_smoke_integration"
      );

    const storageAdapter =
      firstDefined(
        options.storageAdapter,
        options.adapter,
        DEFAULT_STORAGE_ADAPTER
      );

    const storageKeyPrefix =
      firstNonEmptyString(
        options.storageKeyPrefix,
        options.keyPrefix
      ) ||
      `ari.rebirth.cos.smoke.${createId(
        "namespace"
      )}`;

    const persistenceOptions = {
      storageAdapter,
      storageKeyPrefix
    };

    const runtimeOptions = {
      persistence: false,

      loadState: false,

      saveState: false,

      strictInstallation:
        options.strictInstallation !==
        false,

      requireInfrastructure:
        true,

      throwOnFailure: false,

      freeze: false,

      includeRuntimeStageOutputs:
        true,

      includeReferenceDiagnostics:
        true,

      ...(isObject(
        options.runtimeOptions
      )
        ? safeClone(
            options.runtimeOptions
          )
        : {})
    };

    const persistentRuntimeOptions = {
      ...runtimeOptions,

      persistence: true,

      loadState: true,

      saveState: true,

      stateSourcePolicy:
        "prefer_persisted",

      storageAdapter,

      storageKeyPrefix,

      persistenceOptions: {
        adapter:
          storageAdapter,

        keyPrefix:
          storageKeyPrefix
      }
    };

    let state = null;
    let history = [];

    let lastSuccessfulPacket =
      null;

    const IDs = Object.freeze({
      userOne:
        "smoke_turn_user_1",

      assistantOne:
        "smoke_turn_assistant_1",

      userTwo:
        "smoke_turn_user_2",

      userAnswer:
        "smoke_turn_user_answer",

      userClarification:
        "smoke_turn_user_clarification",

      userCorrection:
        "smoke_turn_user_correction",

      userBranch:
        "smoke_turn_user_branch",

      userInterruption:
        "smoke_turn_user_interruption",

      userReturn:
        "smoke_turn_user_return",

      unresolved:
        "smoke_turn_unresolved",

      unknownTarget:
        "smoke_turn_missing_target",

      persistenceOne:
        "smoke_persistence_turn_1",

      persistenceTwo:
        "smoke_persistence_turn_2",

      integration:
        "smoke_integration_turn_1"
    });

    const tests = [];

    /* ===================================================
       INSTALLATION
    =================================================== */

    tests.push(
      await executeTest(
        "installation readiness",
        async () => {
          assert(
            inspect,
            "COS installation inspection is unavailable."
          );

          const inspection =
            await inspect(
              {},
              {
                requireInfrastructure:
                  true
              }
            );

          assertEqual(
            readInspectionReady(
              inspection
            ),
            true,
            "COS installation should report ready."
          );

          return {
            status:
              inspection.status ||
              (
                readInspectionReady(
                  inspection
                )
                  ? "ready"
                  : "not_ready"
              ),

            missingRequired:
              safeClone(
                inspection
                  .missingRequired ||
                inspection.missing ||
                []
              )
          };
        }
      )
    );

    /* ===================================================
       EMPTY STATE
    =================================================== */

    tests.push(
      await executeTest(
        "canonical empty-state shape",
        async () => {
          assert(
            stateComponent,
            "COS state component is not installed."
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
              "COS_SMOKE_STATE_FACTORY_UNAVAILABLE",
              "COS state component does not expose a state factory."
            );

          const emptyState =
            await create(
              {
                conversationId
              },
              {
                conversationId,
                freeze: false
              }
            );

          assertObject(
            emptyState,
            "State factory must return an object."
          );

          assertEqual(
            emptyState.schemaVersion,
            SCHEMA_VERSION,
            "Empty-state schema version mismatch."
          );

          assertEqual(
            emptyState.authority,
            AUTHORITY,
            "Empty-state authority mismatch."
          );

          assertEqual(
            emptyState.conversationId,
            conversationId,
            "Empty state must preserve conversation ID."
          );

          assertObject(
            emptyState.turns,
            "Empty state requires turns."
          );

          assertObject(
            emptyState.threads,
            "Empty state requires threads."
          );

          assertArray(
            emptyState.threadStack,
            "Empty state requires threadStack."
          );

          assertArray(
            emptyState
              .interruptionStack,
            "Empty state requires interruptionStack."
          );

          assertAuxiliaryStateShape(
            emptyState
          );

          return {
            revision:
              emptyState.revision,

            auxiliaryDomains: [
              "pendingInteractionState",
              "artifactState",
              "deliverySequenceState"
            ]
          };
        }
      )
    );

    /* ===================================================
       FIRST TURN
    =================================================== */

    tests.push(
      await executeTest(
        "empty conversation creates new thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userOne,

              role:
                "user",

              text:
                "Hello, Ari.",

              sequence: 0
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertPacketShape(
            result.packet
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "new_thread",
            "First turn should create a new thread."
          );

          assertNonEmptyString(
            readPlacementThreadId(
              result.packet
            ),
            "New-thread placement requires a thread ID."
          );

          const referenceResolution =
            readReferenceResolution(
              result
            );

          assertObject(
            referenceResolution,
            "First-turn result requires reference resolution."
          );

          assertEqual(
            referenceResolution.status,
            "not_required",
            "First turn should not require reference resolution."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            placementType:
              readPlacementType(
                result.packet
              ),

            threadId:
              readPlacementThreadId(
                result.packet
              )
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "state preserves active thread and auxiliary domains",
        async () => {
          assertObject(
            state,
            "State should exist after first turn."
          );

          assertNonEmptyString(
            state.activeThreadId,
            "State should contain an active thread."
          );

          assertEqual(
            state.activeTurnId,
            IDs.userOne,
            "First turn should be active."
          );

          assertObject(
            state.threads[
              state.activeThreadId
            ],
            "Active-thread record should exist."
          );

          assertObject(
            state.turns[
              IDs.userOne
            ],
            "First-turn record should exist."
          );

          assertAuxiliaryStateShape(
            state
          );

          return {
            activeThreadId:
              state.activeThreadId,

            activeTurnId:
              state.activeTurnId,

            revision:
              state.revision
          };
        }
      )
    );

    /* ===================================================
       CONTINUATION
    =================================================== */

    tests.push(
      await executeTest(
        "active-thread continuation",
        async () => {
          const priorThreadId =
            state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.assistantOne,

              role:
                "assistant",

              text:
                "Hello, Jose.",

              sequence: 1
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "continue_thread",
            "Second turn should continue the active thread."
          );

          assertEqual(
            readPlacementThreadId(
              result.packet
            ),
            priorThreadId,
            "Continuation should remain on the active thread."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            threadId:
              state.activeThreadId,

            activeTurnId:
              state.activeTurnId
          };
        }
      )
    );

    /* ===================================================
       EXPLICIT REPLY
    =================================================== */

    tests.push(
      await executeTest(
        "explicit reply reference",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userTwo,

              role:
                "user",

              text:
                "Tell me more.",

              sequence: 2,

              replyToTurnId:
                IDs.assistantOne
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          const resolution =
            readReferenceResolution(
              result
            );

          assertObject(
            resolution,
            "Reply turn requires reference resolution."
          );

          assertEqual(
            resolution.status,
            "resolved",
            "Explicit reply target should resolve."
          );

          assertArrayIncludes(
            resolution.resolvedTurnIds,
            IDs.assistantOne,
            "Resolved turn IDs should include the reply target."
          );

          assertEqual(
            readPlacementParentTurnId(
              result.packet
            ),
            IDs.assistantOne,
            "Reply target should become the structural parent."
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "continue_thread",
            "Generic explicit reply should continue the thread."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            resolvedTurnIds:
              resolution
                .resolvedTurnIds,

            parentTurnId:
              readPlacementParentTurnId(
                result.packet
              )
          };
        }
      )
    );

    /* ===================================================
       ANSWER
    =================================================== */

    tests.push(
      await executeTest(
        "explicit answer target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userAnswer,

              role:
                "user",

              text:
                "Yes.",

              sequence: 3,

              answerTargetTurnId:
                IDs.assistantOne
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "answer_to_turn",
            "Answer target should produce answer_to_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result.packet
            ),
            IDs.assistantOne,
            "Answer target should become the parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            placementType:
              readPlacementType(
                result.packet
              )
          };
        }
      )
    );

    /* ===================================================
       CLARIFICATION
    =================================================== */

    tests.push(
      await executeTest(
        "explicit clarification target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userClarification,

              role:
                "user",

              text:
                "I meant the runtime file.",

              sequence: 4,

              clarificationTargetTurnId:
                IDs.userTwo
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "clarification_of_turn",
            "Clarification target should produce clarification_of_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result.packet
            ),
            IDs.userTwo,
            "Clarification target should become the parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            placementType:
              readPlacementType(
                result.packet
              )
          };
        }
      )
    );

    /* ===================================================
       CORRECTION
    =================================================== */

    tests.push(
      await executeTest(
        "explicit correction target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userCorrection,

              role:
                "user",

              text:
                "Correction: use version 2.",

              sequence: 5,

              correctionTargetTurnId:
                IDs.userClarification
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "correction_of_turn",
            "Correction target should produce correction_of_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result.packet
            ),
            IDs.userClarification,
            "Correction target should become the parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            placementType:
              readPlacementType(
                result.packet
              )
          };
        }
      )
    );

    /* ===================================================
       BRANCH
    =================================================== */

    let branchThreadId =
      null;

    tests.push(
      await executeTest(
        "explicit branch creates distinct thread",
        async () => {
          const originThreadId =
            state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.userBranch,

              role:
                "user",

              text:
                "Start a separate branch.",

              sequence: 6,

              branchOriginTurnId:
                IDs.userTwo
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "branch_from_turn",
            "Branch origin should produce branch_from_turn."
          );

          branchThreadId =
            readPlacementThreadId(
              result.packet
            );

          assertNonEmptyString(
            branchThreadId,
            "Branch placement requires a thread ID."
          );

          assertNotEqual(
            branchThreadId,
            originThreadId,
            "Branch thread must differ from the origin thread."
          );

          assertEqual(
            readPlacementParentTurnId(
              result.packet
            ),
            IDs.userTwo,
            "Branch origin should become the parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            originThreadId,
            branchThreadId
          };
        }
      )
    );

    /* ===================================================
       INTERRUPTION
    =================================================== */

    let interruptionThreadId =
      null;

    tests.push(
      await executeTest(
        "explicit interruption creates interruption-stack entry",
        async () => {
          const interruptedThreadId =
            state.activeThreadId;

          const stackBefore =
            state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                IDs.userInterruption,

              role:
                "user",

              text:
                "Pause that. New issue.",

              sequence: 7,

              placementType:
                "interruption",

              interruptionOriginTurnId:
                IDs.userBranch
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "interruption",
            "Explicit interruption should remain interruption."
          );

          interruptionThreadId =
            readPlacementThreadId(
              result.packet
            );

          assertNonEmptyString(
            interruptionThreadId,
            "Interruption requires a new thread ID."
          );

          assertNotEqual(
            interruptionThreadId,
            interruptedThreadId,
            "Interruption must create a distinct thread."
          );

          assertArray(
            result.state
              .interruptionStack,
            "State requires interruptionStack."
          );

          assertGreaterThan(
            result.state
              .interruptionStack
              .length,
            stackBefore,
            "Interruption should push an interruption record."
          );

          const entry =
            result.state
              .interruptionStack[
                result.state
                  .interruptionStack
                  .length - 1
              ];

          assertEqual(
            entry
              .interruptedThreadId,
            interruptedThreadId,
            "Interruption record should preserve the interrupted thread."
          );

          assertEqual(
            entry
              .interruptionThreadId,
            interruptionThreadId,
            "Interruption record should preserve the interruption thread."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            interruptedThreadId,
            interruptionThreadId
          };
        }
      )
    );

    /* ===================================================
       RETURN
    =================================================== */

    tests.push(
      await executeTest(
        "return from interruption restores prior thread",
        async () => {
          const stackBefore =
            state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                IDs.userReturn,

              role:
                "user",

              text:
                "Return to the earlier branch.",

              sequence: 8,

              placementType:
                "return_from_interruption",

              threadId:
                branchThreadId,

              resumeTargetTurnId:
                IDs.userBranch
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "return_from_interruption",
            "Return placement should remain return_from_interruption."
          );

          assertEqual(
            readPlacementThreadId(
              result.packet
            ),
            branchThreadId,
            "Return should restore the interrupted branch thread."
          );

          assertEqual(
            result.state
              .activeThreadId,
            branchThreadId,
            "Returned thread should become active."
          );

          assert(
            result.state
              .interruptionStack
              .length <
              stackBefore,
            "Return should pop the matching interruption entry."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          lastSuccessfulPacket =
            result.packet;

          return {
            restoredThreadId:
              result.state
                .activeThreadId,

            remainingInterruptions:
              result.state
                .interruptionStack
                .length
          };
        }
      )
    );

    /* ===================================================
       UNRESOLVED REFERENCE
    =================================================== */

    tests.push(
      await executeTest(
        "unknown structural reference remains unresolved without inventing placement",
        async () => {
          const priorActiveThreadId =
            state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.unresolved,

              role:
                "user",

              text:
                "Continue from the missing turn.",

              sequence: 9,

              replyToTurnId:
                IDs.unknownTarget
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(
            result
          );

          const resolution =
            readReferenceResolution(
              result
            );

          assertObject(
            resolution,
            "Unknown reference requires a reference-resolution result."
          );

          assertEqual(
            resolution.status,
            "unresolved",
            "Unknown turn reference should remain unresolved."
          );

          assertEqual(
            readPlacementType(
              result.packet
            ),
            "unresolved_placement",
            "Unknown reference should produce unresolved_placement."
          );

          assertEqual(
            readPlacementThreadId(
              result.packet
            ),
            null,
            "Unresolved placement must not claim a thread."
          );

          assertObject(
            result.state.turns[
              turn.turnId
            ],
            "Unresolved turn should remain registered for audit and clarification."
          );

          assertEqual(
            result.state
              .activeThreadId,
            priorActiveThreadId,
            "Unresolved placement must not fabricate a replacement active thread."
          );

          return {
            status:
              resolution.status,

            activeTurnId:
              result.state
                .activeTurnId,

            activeThreadId:
              result.state
                .activeThreadId
          };
        }
      )
    );

    /* ===================================================
       DUPLICATE TURN
    =================================================== */

    tests.push(
      await executeTest(
        "duplicate current-turn ID is rejected",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userOne,

              role:
                "user",

              text:
                "This ID already exists.",

              sequence: 10
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn:
                  turn,
                history,
                state
              },
              runtimeOptions
            );

          assertStructuredFailure(
            result,
            "Duplicate turn ID should fail."
          );

          return {
            errors:
              result.errors
          };
        }
      )
    );

    /* ===================================================
       PACKET AUTHORITY
    =================================================== */

    tests.push(
      await executeTest(
        "authoritative packet preserves authority boundaries",
        async () => {
          assertObject(
            lastSuccessfulPacket,
            "At least one successful packet is required."
          );

          assertPacketShape(
            lastSuccessfulPacket
          );

          return {
            packetKeys:
              Object.keys(
                lastSuccessfulPacket
              )
          };
        }
      )
    );

    /* ===================================================
       REVISION
    =================================================== */

    tests.push(
      await executeTest(
        "state revision advances across applied turns",
        async () => {
          assertObject(
            state,
            "Final structural state is missing."
          );

          assert(
            Number.isInteger(
              state.revision
            ),
            "State revision must be an integer."
          );

          assertGreaterThan(
            state.revision,
            0,
            "State revision should advance after transitions."
          );

          assertObject(
            state.threads,
            "State should preserve threads."
          );

          assertObject(
            state.turns,
            "State should preserve turns."
          );

          assertGreaterThan(
            Object.keys(
              state.turns
            ).length,
            7,
            "State should preserve applied smoke-test turns."
          );

          assertAuxiliaryStateShape(
            state
          );

          return {
            revision:
              state.revision,

            threadCount:
              Object.keys(
                state.threads
              ).length,

            turnCount:
              Object.keys(
                state.turns
              ).length
          };
        }
      )
    );

    /* ===================================================
       DIRECT STORE SAVE / LOAD
    =================================================== */

    tests.push(
      await executeTest(
        "state store saves and loads canonical state",
        async () => {
          assert(
            stateStore,
            "COS state store is not installed."
          );

          const save =
            resolveCallable(
              stateStore,
              [
                "save",
                "safeSave"
              ],
              "COS_SMOKE_STATE_STORE_SAVE_UNAVAILABLE",
              "COS state store does not expose save()."
            );

          const load =
            resolveCallable(
              stateStore,
              [
                "load",
                "safeLoad"
              ],
              "COS_SMOKE_STATE_STORE_LOAD_UNAVAILABLE",
              "COS state store does not expose load()."
            );

          const saveResult =
            await save(
              conversationId,
              state,
              {
                adapter:
                  storageAdapter,

                keyPrefix:
                  storageKeyPrefix,

                validateBeforeSave:
                  true,

                includeRecord:
                  false,

                freeze: false
              }
            );

          assertEqual(
            saveResult.ok,
            true,
            "State-store save should succeed."
          );

          const loadResult =
            await load(
              conversationId,
              {
                adapter:
                  storageAdapter,

                keyPrefix:
                  storageKeyPrefix,

                migrate: false,

                validate: true,

                includeRecord:
                  false,

                freeze: false
              }
            );

          assertEqual(
            loadResult.ok,
            true,
            "State-store load should succeed."
          );

          assertEqual(
            loadResult.found,
            true,
            "Saved state should be found."
          );

          assertObject(
            loadResult.state,
            "Loaded record should contain state."
          );

          assertEqual(
            loadResult.state
              .conversationId,
            conversationId,
            "Loaded state should preserve conversation ID."
          );

          assertEqual(
            loadResult.state
              .revision,
            state.revision,
            "Loaded state should preserve revision."
          );

          assert(
            deepEquivalent(
              loadResult.state.turns,
              state.turns
            ),
            "Loaded turns should match saved turns."
          );

          assertAuxiliaryStateShape(
            loadResult.state
          );

          return {
            adapterType:
              loadResult
                .adapterType,

            storageRevision:
              loadResult
                .storageRevision,

            stateRevision:
              loadResult
                .state.revision
          };
        }
      )
    );

    /* ===================================================
       CONTROLLER PERSISTENCE
    =================================================== */

    tests.push(
      await executeTest(
        "controller restores persisted state after local state is discarded",
        async () => {
          assert(
            controller,
            "COS controller is not installed."
          );

          await removeStoredState(
            controller,
            persistenceConversationId,
            persistenceOptions
          );

          const controllerRun =
            resolveCallable(
              controller,
              [
                "run",
                "execute",
                "process",
                "safeRun"
              ],
              "COS_SMOKE_CONTROLLER_RUN_UNAVAILABLE",
              "COS controller does not expose run()."
            );

          const firstTurn =
            createTurn({
              turnId:
                IDs.persistenceOne,

              role:
                "user",

              text:
                "Persist this conversation.",

              sequence: 0
            });

          const firstResult =
            await controllerRun(
              {
                conversationId:
                  persistenceConversationId,

                currentTurn:
                  firstTurn,

                history: [],

                state: null
              },
              {
                ...persistentRuntimeOptions,

                stateSourcePolicy:
                  "prefer_persisted",

                freeze: false
              }
            );

          assertSuccess(
            firstResult
          );

          assertEqual(
            firstResult.stateSaved,
            true,
            "First persistent controller run should save state."
          );

          const firstThreadId =
            firstResult.state
              .activeThreadId;

          assertNonEmptyString(
            firstThreadId,
            "First persistent run should create an active thread."
          );

          const secondTurn =
            createTurn({
              turnId:
                IDs.persistenceTwo,

              role:
                "assistant",

              text:
                "This turn should load the saved state.",

              sequence: 1
            });

          const secondResult =
            await controllerRun(
              {
                conversationId:
                  persistenceConversationId,

                currentTurn:
                  secondTurn,

                history: [],

                state: null
              },
              {
                ...persistentRuntimeOptions,

                stateSourcePolicy:
                  "prefer_persisted",

                freeze: false
              }
            );

          assertSuccess(
            secondResult
          );

          assertEqual(
            secondResult.stateLoaded,
            true,
            "Second controller run should load persisted state."
          );

          assertEqual(
            secondResult.stateSource,
            "persisted",
            "Second run should select persisted state."
          );

          assertEqual(
            readPlacementType(
              secondResult.packet
            ),
            "continue_thread",
            "Second persisted turn should continue the stored active thread."
          );

          assertEqual(
            secondResult.state
              .activeThreadId,
            firstThreadId,
            "Reloaded state should preserve the original thread."
          );

          assertObject(
            secondResult.state.turns[
              IDs.persistenceOne
            ],
            "Reloaded state should preserve the first turn."
          );

          assertObject(
            secondResult.state.turns[
              IDs.persistenceTwo
            ],
            "Reloaded state should contain the second turn."
          );

          assertAuxiliaryStateShape(
            secondResult.state
          );

          return {
            loaded:
              secondResult
                .stateLoaded,

            stateSource:
              secondResult
                .stateSource,

            threadId:
              secondResult.state
                .activeThreadId,

            stateSaved:
              secondResult
                .stateSaved
          };
        }
      )
    );

    /* ===================================================
       MIGRATION
    =================================================== */

    tests.push(
      await executeTest(
        "legacy state migrates to current schema",
        async () => {
          assert(
            stateMigrator,
            "COS state migrator is not installed."
          );

          const migrate =
            resolveCallable(
              stateMigrator,
              [
                "migrate",
                "upgrade",
                "run",
                "normalize"
              ],
              "COS_SMOKE_MIGRATOR_UNAVAILABLE",
              "COS state migrator does not expose migrate()."
            );

          const legacyState =
            createLegacyState(
              migrationConversationId
            );

          const result =
            await migrate(
              {
                state:
                  legacyState,

                conversationId:
                  migrationConversationId,

                fromVersion:
                  "0.0.0",

                toVersion:
                  SCHEMA_VERSION
              },
              {
                freeze: false,

                freezeState: false,

                validate: true
              }
            );

          assertObject(
            result,
            "Migration must return a result object."
          );

          assertObject(
            result.state,
            "Migration result must contain state."
          );

          assertEqual(
            result.toVersion,
            SCHEMA_VERSION,
            "Migration target version mismatch."
          );

          assertEqual(
            result.state
              .schemaVersion,
            SCHEMA_VERSION,
            "Migrated state should use the current schema."
          );

          assertEqual(
            result.state
              .authority,
            AUTHORITY,
            "Migrated state authority mismatch."
          );

          assertEqual(
            result.state
              .conversationId,
            migrationConversationId,
            "Migrated state should preserve conversation ID."
          );

          assertObject(
            result.state.turns[
              "legacy_turn_1"
            ],
            "Migrated state should preserve the legacy turn."
          );

          assertObject(
            result.state.threads[
              "legacy_thread_1"
            ],
            "Migrated state should preserve the legacy thread."
          );

          assertAuxiliaryStateShape(
            result.state
          );

          return {
            migrated:
              result.migrated,

            fromVersion:
              result.fromVersion,

            toVersion:
              result.toVersion,

            stepCount:
              result.stepCount
          };
        }
      )
    );

    /* ===================================================
       PERSISTED MIGRATION THROUGH CONTROLLER
    =================================================== */

    tests.push(
      await executeTest(
        "controller migrates a persisted legacy record",
        async () => {
          assert(
            controller,
            "COS controller is not installed."
          );

          assert(
            stateStore,
            "COS state store is not installed."
          );

          await removeStoredState(
            controller,
            migrationConversationId,
            persistenceOptions
          );

          const save =
            resolveCallable(
              stateStore,
              [
                "save",
                "safeSave"
              ],
              "COS_SMOKE_STATE_STORE_SAVE_UNAVAILABLE",
              "COS state store does not expose save()."
            );

          const legacyState =
            createLegacyState(
              migrationConversationId
            );

          const saveResult =
            await save(
              migrationConversationId,
              legacyState,
              {
                adapter:
                  storageAdapter,

                keyPrefix:
                  storageKeyPrefix,

                validateBeforeSave:
                  false,

                includeRecord:
                  false,

                freeze: false
              }
            );

          assertEqual(
            saveResult.ok,
            true,
            "Legacy state record should be saved for migration testing."
          );

          const controllerRun =
            resolveCallable(
              controller,
              [
                "run",
                "execute",
                "process",
                "safeRun"
              ],
              "COS_SMOKE_CONTROLLER_RUN_UNAVAILABLE",
              "COS controller does not expose run()."
            );

          const newTurn =
            createTurn({
              turnId:
                "smoke_migrated_turn_2",

              role:
                "assistant",

              text:
                "Continue after migration.",

              sequence: 1
            });

          const result =
            await controllerRun(
              {
                conversationId:
                  migrationConversationId,

                currentTurn:
                  newTurn,

                history: [],

                state: null
              },
              {
                ...persistentRuntimeOptions,

                stateSourcePolicy:
                  "prefer_persisted",

                migrateState: true,

                freeze: false
              }
            );

          assertSuccess(
            result
          );

          assertEqual(
            result.stateLoaded,
            true,
            "Controller should load the persisted legacy record."
          );

          assertEqual(
            result.stateMigrated,
            true,
            "Controller should report that the persisted state was migrated."
          );

          assertEqual(
            result.state
              .schemaVersion,
            SCHEMA_VERSION,
            "Controller should execute with the current state schema."
          );

          assertObject(
            result.state.turns[
              "legacy_turn_1"
            ],
            "Controller migration should preserve the legacy turn."
          );

          assertObject(
            result.state.turns[
              "smoke_migrated_turn_2"
            ],
            "Controller should register the post-migration turn."
          );

          return {
            stateLoaded:
              result.stateLoaded,

            stateMigrated:
              result.stateMigrated,

            stateSaved:
              result.stateSaved,

            schemaVersion:
              result.state
                .schemaVersion
          };
        }
      )
    );

    /* ===================================================
       REBIRTH INTEGRATION AUTHORITY
    =================================================== */

    tests.push(
      await executeTest(
        "Rebirth integration preserves semantic, conversation-function, and safety authority",
        async () => {
          if (!integrationStage) {
            return {
              skipped: true,

              reason:
                "Rebirth COS integration stage is not installed."
            };
          }

          const integrationRun =
            resolveCallable(
              integrationStage,
              [
                "run",
                "execute",
                "process"
              ],
              "COS_SMOKE_INTEGRATION_RUN_UNAVAILABLE",
              "Rebirth COS integration stage does not expose run()."
            );

          const semanticPacket = {
            authority:
              "semantic_frame_builder",

            subject:
              "runtime file",

            action:
              "continue",

            semanticMeaning:
              "Continue work on the runtime file."
          };

          const conversationFunction = {
            authority:
              "conversation_function_engine",

            function:
              "continuation_request"
          };

          const safetyContext = {
            authority:
              "safety_context",

            severity:
              "none",

            governance:
              "normal"
          };

          const runtimeState = {
            conversationId:
              integrationConversationId,

            currentTurn:
              createTurn({
                turnId:
                  IDs.integration,

                role:
                  "user",

                text:
                  "Continue.",

                sequence: 0
              }),

            conversationHistory: [],

            semanticPacket:
              safeClone(
                semanticPacket
              ),

            conversationFunction:
              safeClone(
                conversationFunction
              ),

            safetyContext:
              safeClone(
                safetyContext
              )
          };

          const result =
            await integrationRun(
              runtimeState,
              {
                persistence: false,

                loadState: false,

                saveState: false,

                migrateState: true,

                strictInstallation:
                  true,

                strictRuntimeInstallation:
                  true,

                throwOnFailure:
                  false,

                freeze: false
              }
            );

          assertObject(
            result,
            "Integration stage must return an object."
          );

          assertObject(
            result.state,
            "Integration result requires merged runtime state."
          );

          assert(
            deepEquivalent(
              result.state
                .semanticPacket,
              semanticPacket
            ),
            "COS integration must not alter the semantic packet."
          );

          assert(
            deepEquivalent(
              result.state
                .conversationFunction,
              conversationFunction
            ),
            "COS integration must not alter the conversation-function packet."
          );

          assert(
            deepEquivalent(
              result.state
                .safetyContext,
              safetyContext
            ),
            "COS integration must not alter the safety-context packet."
          );

          assertObject(
            result.state
              .conversationOSResult,
            "Integration should attach the COS result."
          );

          assertObject(
            result.state
              .conversationOSState,
            "Integration should attach COS state."
          );

          return {
            ok:
              result.ok,

            semanticPreserved:
              true,

            conversationFunctionPreserved:
              true,

            safetyPreserved:
              true
          };
        },
        {
          optional: true
        }
      )
    );

    /* ===================================================
       CLEANUP
    =================================================== */

    const cleanup = [];

    for (
      const id of [
        conversationId,
        persistenceConversationId,
        migrationConversationId,
        integrationConversationId
      ]
    ) {
      cleanup.push(
        await removeStoredState(
          controller,
          id,
          persistenceOptions
        )
      );
    }

    /* ===================================================
       FINAL RESULT
    =================================================== */

    const requiredTests =
      tests.filter(
        (test) =>
          test.optional !== true
      );

    const optionalTests =
      tests.filter(
        (test) =>
          test.optional === true
      );

    const passedCount =
      tests.filter(
        (test) =>
          test.passed &&
          !test.skipped
      ).length;

    const skippedCount =
      tests.filter(
        (test) =>
          test.skipped
      ).length;

    const failedRequiredCount =
      requiredTests.filter(
        (test) =>
          !test.passed
      ).length;

    const failedOptionalCount =
      optionalTests.filter(
        (test) =>
          !test.passed
      ).length;

    const failedCount =
      failedRequiredCount +
      failedOptionalCount;

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      resultType:
        SMOKE_RESULT_TYPE,

      ok:
        failedRequiredCount === 0,

      status:
        failedRequiredCount === 0
          ? (
              failedOptionalCount > 0
                ? "passed_with_optional_failures"
                : "passed"
            )
          : "failed",

      conversationId,

      storageAdapter:
        typeof storageAdapter ===
          "string"
          ? storageAdapter
          : firstNonEmptyString(
              storageAdapter &&
                storageAdapter.type,
              storageAdapter &&
                storageAdapter.name
            ) ||
            "custom",

      storageKeyPrefix,

      startedAt,

      completedAt:
        nowIso(),

      durationMs:
        elapsedMs(
          startedAtMs
        ),

      testCount:
        tests.length,

      requiredTestCount:
        requiredTests.length,

      optionalTestCount:
        optionalTests.length,

      passedCount,

      skippedCount,

      failedCount,

      failedRequiredCount,

      failedOptionalCount,

      tests,

      cleanup:
        safeClone(cleanup),

      finalState:
        options.includeFinalState ===
          true
          ? safeClone(state)
          : null,

      finalHistory:
        options.includeFinalHistory ===
          true
          ? safeClone(history)
          : null
    };

    if (
      options.log !== false &&
      typeof console !==
        "undefined"
    ) {
      const logger =
        result.ok
          ? console.log
          : console.error;

      if (isFunction(logger)) {
        logger.call(
          console,
          "[ARI Rebirth COS Smoke Test]",
          result
        );
      }

      if (
        isFunction(
          console.table
        )
      ) {
        console.table(
          tests.map(
            (test) => ({
              Test:
                test.name,

              Status:
                test.status,

              Required:
                !test.optional,

              Duration:
                `${test.durationMs}ms`,

              Error:
                test.error
                  ? test.error.message
                  : ""
            })
          )
        );
      }
    }

    return options.freeze === true
      ? freezeClone(result)
      : result;
  }

  /* =====================================================
     ASSERT ALL
  ===================================================== */

  async function assertAll(
    options = {}
  ) {
    const result =
      await run({
        ...options,

        log:
          options.log !== false
      });

    if (!result.ok) {
      throw new CosSmokeTestError(
        "COS_SMOKE_TEST_FAILED",
        `${result.failedRequiredCount} required Conversation OS smoke test(s) failed.`,
        {
          details:
            result
        }
      );
    }

    return result;
  }

  /* =====================================================
     SUMMARY
  ===================================================== */

  function summarize(
    result
  ) {
    if (!isObject(result)) {
      return null;
    }

    return {
      ok:
        result.ok === true,

      status:
        result.status || null,

      testCount:
        normalizeInteger(
          result.testCount,
          0
        ),

      passedCount:
        normalizeInteger(
          result.passedCount,
          0
        ),

      skippedCount:
        normalizeInteger(
          result.skippedCount,
          0
        ),

      failedRequiredCount:
        normalizeInteger(
          result
            .failedRequiredCount,
          0
        ),

      failedOptionalCount:
        normalizeInteger(
          result
            .failedOptionalCount,
          0
        ),

      failedTests:
        Array.isArray(result.tests)
          ? result.tests
              .filter(
                (test) =>
                  !test.passed
              )
              .map(
                (test) => ({
                  name:
                    test.name,

                  optional:
                    test.optional,

                  error:
                    test.error
                })
              )
          : []
    };
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosSmokeTest = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    resultType:
      SMOKE_RESULT_TYPE,

    requiredPacketKeys:
      REQUIRED_PACKET_KEYS,

    forbiddenPacketKeys:
      FORBIDDEN_PACKET_KEYS,

    CosSmokeTestError,

    run,

    execute:
      run,

    test:
      run,

    assertAll,

    summarize,

    assertPacketShape,

    assertAuxiliaryStateShape,

    readPlacementType,

    readPlacementThreadId,

    readPlacementParentTurnId,

    readReferenceResolution
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.testing.smokeTest =
    cosSmokeTest;

  ConversationOS.testing.cosSmokeTest =
    cosSmokeTest;

  ConversationOS.smokeTest =
    cosSmokeTest;

  root.AriCosSmokeTest =
    cosSmokeTest;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosSmokeTest;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);