// rebirth/conversation-os/testing/cos-regression-suite.js
// ARI Rebirth — Conversation Operating System Regression Suite
//
// Purpose:
// Run deterministic behavioral, structural, persistence, migration,
// immutability, and authority-boundary regression tests against the installed
// Conversation Operating System.
//
// V1.0.0 — Canonical COS Regression Harness
//
// Canonical responsibilities:
//
// - verify deterministic COS behavior across repeated executions,
// - verify structural placement across common conversation relationships,
// - verify thread, branch, interruption, and return behavior,
// - verify unresolved and invalid references remain unresolved,
// - verify duplicate identities are rejected,
// - verify pending-interaction continuity,
// - verify artifact continuity,
// - verify multipart delivery-sequence continuity,
// - verify persistence across controller restarts,
// - verify legacy-state migration,
// - verify packet authority boundaries,
// - verify state and packet immutability when freezing is enabled,
// - verify Rebirth integration preserves upstream authority packets,
// - provide reusable scenario registration and execution APIs,
// - provide compact and full diagnostic reports.
//
// Non-responsibility:
//
// This file must not:
//
// - modify production authority rules,
// - reinterpret user language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer safety severity,
// - repair failed production outputs,
// - silently weaken failed assertions,
// - write to production conversation IDs.
//
// Architectural rule:
//
// Regression tests supply explicit structural evidence.
//
// They do not depend on natural-language phrase interpretation.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.ConversationOS
// window.Ari.Rebirth.ConversationOS.testing
// window.Ari.Rebirth.ConversationOS.testing.regressionSuite
//
// CommonJS:
//
// module.exports = cosRegressionSuite

(function initializeCosRegressionSuite(globalScope) {
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

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const AUTHORITY =
    "conversation_operating_system";

  const COMPONENT_NAME =
    "cos-regression-suite";

  const RESULT_TYPE =
    "conversation_operating_system_regression_result";

  const SCENARIO_RESULT_TYPE =
    "conversation_operating_system_regression_scenario_result";

  const DEFAULT_STORAGE_ADAPTER =
    "memory";

  const DEFAULT_PERFORMANCE_LIMITS =
    Object.freeze({
      singleTurnMs: 2000,
      repeatedTurnAverageMs: 1000,
      historyBuildMs: 5000,
      largeHistoryTurnCount: 250
    });

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
      "modelResponse",
      "confidence",
      "candidates"
    ]);

  const STANDARD_SCENARIO_IDS =
    Object.freeze([
      "installation_readiness",
      "empty_state_shape",
      "first_turn_new_thread",
      "active_thread_continuation",
      "explicit_reply",
      "explicit_answer",
      "explicit_clarification",
      "explicit_correction",
      "explicit_branch",
      "nested_branch",
      "explicit_interruption",
      "nested_interruption",
      "return_from_nested_interruption",
      "return_from_outer_interruption",
      "unresolved_reference",
      "duplicate_turn_rejection",
      "packet_authority_boundary",
      "state_revision_progression",
      "packet_determinism",
      "history_index_determinism",
      "frozen_result_immutability",
      "pending_interaction_continuity",
      "artifact_continuity",
      "delivery_sequence_continuity",
      "direct_store_round_trip",
      "controller_persistence_restart",
      "legacy_state_migration",
      "controller_persisted_migration",
      "rebirth_authority_preservation",
      "large_history_indexing"
    ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosRegressionSuiteError extends Error {
    constructor(
      code,
      message,
      {
        scenarioId = null,
        details = null,
        cause = null,
        recoverable = false
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS regression-suite error"
      );

      this.name =
        "CosRegressionSuiteError";

      this.code =
        code ||
        "COS_REGRESSION_SUITE_ERROR";

      this.scenarioId =
        scenarioId || null;

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
          CosRegressionSuiteError
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

  function normalizeNumber(
    value,
    fallback = 0
  ) {
    const numeric =
      Number(value);

    return Number.isFinite(numeric)
      ? numeric
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

  function stableClone(value) {
    if (Array.isArray(value)) {
      return value.map(
        stableClone
      );
    }

    if (isObject(value)) {
      const output = {};

      for (
        const key of
          Object.keys(value).sort()
      ) {
        output[key] =
          stableClone(
            value[key]
          );
      }

      return output;
    }

    return value;
  }

  function stableStringify(value) {
    try {
      return JSON.stringify(
        stableClone(value)
      );
    } catch (error) {
      return String(value);
    }
  }

  function deepEquivalent(
    left,
    right
  ) {
    return (
      stableStringify(left) ===
      stableStringify(right)
    );
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

  function createId(
    prefix = "regression"
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
          "COS_REGRESSION_SUITE_ERROR",

        message:
          error.message ||
          "Unknown regression-suite error",

        scenarioId:
          firstNonEmptyString(
            error.scenarioId
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
      name:
        "Error",

      code:
        "COS_REGRESSION_SUITE_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown regression-suite error",

      scenarioId:
        null,

      recoverable:
        false,

      details:
        safeClone(error),

      cause:
        null
    };
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
      return true;
    }

    throw new CosRegressionSuiteError(
      "COS_REGRESSION_ASSERTION_FAILED",
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
    return assert(
      actual === expected,
      message ||
        `Expected ${String(
          expected
        )}, received ${String(
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
    return assert(
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
    return assert(
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
    return assert(
      Array.isArray(value),
      message ||
        "Expected an array.",
      {
        actual:
          safeClone(value)
      }
    );
  }

  function assertNonEmptyString(
    value,
    message
  ) {
    return assert(
      isNonEmptyString(value),
      message ||
        "Expected a non-empty string.",
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

    return assert(
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

  function assertGreaterThan(
    actual,
    minimum,
    message
  ) {
    return assert(
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

  function assertLessThanOrEqual(
    actual,
    maximum,
    message
  ) {
    return assert(
      Number(actual) <=
        Number(maximum),
      message ||
        `Expected ${String(
          actual
        )} to be less than or equal to ${String(
          maximum
        )}.`,
      {
        actual,
        maximum
      }
    );
  }

  function assertDeepEqual(
    actual,
    expected,
    message
  ) {
    return assert(
      deepEquivalent(
        actual,
        expected
      ),
      message ||
        "Expected values to be deeply equivalent.",
      {
        actual:
          safeClone(actual),

        expected:
          safeClone(expected)
      }
    );
  }

  /* =====================================================
     COMPONENT DISCOVERY
  ===================================================== */

  function resolveConversationOS(
    override = null
  ) {
    return (
      override ||
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

  function resolveHistoryIndex(
    override = null
  ) {
    return (
      override ||
      ConversationOS.historyIndex ||
      ConversationOS.historyIndexer ||
      ConversationOS.cosHistoryIndex ||
      root.AriCosHistoryIndex ||
      null
    );
  }

  function resolvePendingInteractionManager(
    override = null
  ) {
    return (
      override ||
      ConversationOS
        .pendingInteractionManager ||
      ConversationOS
        .cosPendingInteractionManager ||
      root
        .AriCosPendingInteractionManager ||
      null
    );
  }

  function resolveArtifactRegister(
    override = null
  ) {
    return (
      override ||
      ConversationOS.artifactRegister ||
      ConversationOS
        .cosArtifactRegister ||
      root.AriCosArtifactRegister ||
      null
    );
  }

  function resolveDeliverySequenceManager(
    override = null
  ) {
    return (
      override ||
      ConversationOS
        .deliverySequenceManager ||
      ConversationOS
        .cosDeliverySequenceManager ||
      root
        .AriCosDeliverySequenceManager ||
      null
    );
  }

  function resolveIntegrationStage(
    override = null
  ) {
    return (
      override ||
      Integration
        .conversationOSStage ||
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
    methodNames,
    {
      code =
        "COS_REGRESSION_COMPONENT_UNAVAILABLE",

      message =
        "Required regression component is unavailable."
    } = {}
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

    throw new CosRegressionSuiteError(
      code,
      message,
      {
        details: {
          methodNames
        }
      }
    );
  }

  /* =====================================================
     STRUCTURAL READERS
  ===================================================== */

  function readPlacement(
    packetOrResult
  ) {
    if (
      packetOrResult &&
      isObject(
        packetOrResult.placement
      )
    ) {
      return packetOrResult
        .placement;
    }

    if (
      packetOrResult &&
      packetOrResult.packet &&
      isObject(
        packetOrResult
          .packet.placement
      )
    ) {
      return packetOrResult
        .packet.placement;
    }

    return null;
  }

  function readPlacementType(
    packetOrResult
  ) {
    const placement =
      readPlacement(
        packetOrResult
      ) || {};

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
      readPlacement(
        packetOrResult
      ) || {};

    return firstNonEmptyString(
      placement.threadId,
      placement.thread_id
    );
  }

  function readPlacementParentTurnId(
    packetOrResult
  ) {
    const placement =
      readPlacement(
        packetOrResult
      ) || {};

    return firstNonEmptyString(
      placement.parentTurnId,
      placement.parent_turn_id
    );
  }

  function readReferenceResolution(
    packetOrResult
  ) {
    if (
      packetOrResult &&
      isObject(
        packetOrResult
          .referenceResolution
      )
    ) {
      return packetOrResult
        .referenceResolution;
    }

    if (
      packetOrResult &&
      packetOrResult.packet &&
      isObject(
        packetOrResult
          .packet
          .referenceResolution
      )
    ) {
      return packetOrResult
        .packet
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
     TEST DATA HELPERS
  ===================================================== */

  function createTurn({
    turnId,
    role = "user",
    text = "",
    sequence = 0,
    timestamp = null,
    threadId = null,
    parentTurnId = null,
    replyToTurnId = null,
    answerTargetTurnId = null,
    clarificationTargetTurnId = null,
    correctionTargetTurnId = null,
    branchOriginTurnId = null,
    interruptionOriginTurnId = null,
    resumeTargetTurnId = null,
    placementType = null,
    sourceTurnIds = [],
    metadata = null
  } = {}) {
    return {
      turnId:
        turnId ||
        createId("turn"),

      role,

      text,

      sequence,

      timestamp:
        timestamp ||
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
        : {}),

      ...(placementType
        ? {
            placementType
          }
        : {}),

      ...(sourceTurnIds.length > 0
        ? {
            sourceTurnIds:
              uniqueStrings(
                sourceTurnIds
              )
          }
        : {}),

      ...(isObject(metadata)
        ? {
            metadata:
              safeClone(metadata)
          }
        : {})
    };
  }

  function appendHistory(
    history,
    turn,
    packetOrResult
  ) {
    const placement =
      readPlacement(
        packetOrResult
      ) || {};

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

      state_revision:
        4,

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
            "Legacy turn.",

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
            timestamp,

          updated_at:
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

  function createLargeHistory(
    count,
    {
      threadId =
        "large_history_thread",

      startSequence = 0
    } = {}
  ) {
    const history = [];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      history.push(
        createTurn({
          turnId:
            `large_history_turn_${index}`,

          role:
            index % 2 === 0
              ? "user"
              : "assistant",

          text:
            `Large-history turn ${index}.`,

          sequence:
            startSequence + index,

          threadId,

          parentTurnId:
            index > 0
              ? `large_history_turn_${index - 1}`
              : null
        })
      );
    }

    return history;
  }

  /* =====================================================
     ASSERTION HELPERS
  ===================================================== */

  function assertSuccessfulResult(
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
      "Successful COS execution requires a packet."
    );

    assertObject(
      result.state,
      "Successful COS execution requires state."
    );

    return result;
  }

  function assertStructuredFailure(
    result
  ) {
    assertObject(
      result,
      "COS failure must be structured."
    );

    assertEqual(
      result.ok,
      false,
      "COS execution should fail."
    );

    assertArray(
      result.errors,
      "COS failure requires errors."
    );

    assertGreaterThan(
      result.errors.length,
      0,
      "COS failure requires at least one error."
    );

    return result;
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
        `Packet is missing required key: ${requiredKey}.`,
        {
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
        `COS packet must not expose ${forbiddenKey}.`,
        {
          actualKeys:
            Object.keys(packet)
        }
      );
    }

    return true;
  }

  function assertAuxiliaryStateShape(
    state
  ) {
    assertObject(
      state.pendingInteractionState,
      "State requires pendingInteractionState."
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
      "State requires artifactState."
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
      state.deliverySequenceState,
      "State requires deliverySequenceState."
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

    return true;
  }

  function assertFrozen(
    value,
    message
  ) {
    assert(
      Object.isFrozen(value),
      message ||
        "Expected object to be frozen."
    );

    return true;
  }

  /* =====================================================
     SCENARIO REGISTRY
  ===================================================== */

  const scenarioRegistry =
    new Map();

  function registerScenario(
    definition
  ) {
    if (!isObject(definition)) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SCENARIO_INVALID",
        "Regression scenario definition must be an object."
      );
    }

    const id =
      firstNonEmptyString(
        definition.id
      );

    if (!id) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SCENARIO_ID_MISSING",
        "Regression scenario requires an ID."
      );
    }

    if (
      !isFunction(
        definition.run
      )
    ) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SCENARIO_RUN_MISSING",
        "Regression scenario requires a run function.",
        {
          scenarioId:
            id
        }
      );
    }

    if (
      scenarioRegistry.has(id) &&
      definition.replace !== true
    ) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SCENARIO_DUPLICATE",
        "Regression scenario ID is already registered.",
        {
          scenarioId:
            id
        }
      );
    }

    const normalized = {
      id,

      name:
        firstNonEmptyString(
          definition.name
        ) || id,

      description:
        firstNonEmptyString(
          definition.description
        ) || null,

      group:
        firstNonEmptyString(
          definition.group
        ) || "general",

      required:
        definition.required !==
        false,

      enabled:
        definition.enabled !==
        false,

      tags:
        uniqueStrings(
          definition.tags
        ),

      run:
        definition.run
    };

    scenarioRegistry.set(
      id,
      normalized
    );

    return normalized;
  }

  function unregisterScenario(
    scenarioId
  ) {
    return scenarioRegistry.delete(
      scenarioId
    );
  }

  function getScenario(
    scenarioId
  ) {
    return (
      scenarioRegistry.get(
        scenarioId
      ) || null
    );
  }

  function listScenarios() {
    return Array.from(
      scenarioRegistry.values()
    ).map(
      (scenario) => ({
        id:
          scenario.id,

        name:
          scenario.name,

        description:
          scenario.description,

        group:
          scenario.group,

        required:
          scenario.required,

        enabled:
          scenario.enabled,

        tags:
          [...scenario.tags]
      })
    );
  }

  /* =====================================================
     EXECUTION CONTEXT
  ===================================================== */

  function createExecutionContext(
    options = {}
  ) {
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

    const historyIndex =
      resolveHistoryIndex(
        options.historyIndex
      );

    const pendingInteractionManager =
      resolvePendingInteractionManager(
        options.pendingInteractionManager
      );

    const artifactRegister =
      resolveArtifactRegister(
        options.artifactRegister
      );

    const deliverySequenceManager =
      resolveDeliverySequenceManager(
        options.deliverySequenceManager
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
      resolveCallable(
        conversationOS,
        [
          "run",
          "execute",
          "process"
        ],
        {
          code:
            "COS_REGRESSION_RUN_UNAVAILABLE",

          message:
            "Conversation Operating System does not expose run()."
        }
      );

    const inspect =
      conversationOS &&
      (
        isFunction(
          conversationOS.inspect
        )
          ? conversationOS.inspect.bind(
              conversationOS
            )
          : isFunction(
              conversationOS
                .inspectInstallation
            )
            ? conversationOS
                .inspectInstallation
                .bind(
                  conversationOS
                )
            : isFunction(
                conversationOS.health
              )
              ? conversationOS
                  .health
                  .bind(
                    conversationOS
                  )
              : null
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
      `ari.rebirth.cos.regression.${createId(
        "namespace"
      )}`;

    const baseRuntimeOptions = {
      persistence: false,
      loadState: false,
      saveState: false,
      strictInstallation:
        options.strictInstallation !==
        false,
      requireInfrastructure: true,
      throwOnFailure: false,
      freeze: false,
      includeRuntimeStageOutputs: true,
      includeReferenceDiagnostics: true,
      ...(isObject(
        options.runtimeOptions
      )
        ? safeClone(
            options.runtimeOptions
          )
        : {})
    };

    const persistentRuntimeOptions = {
      ...baseRuntimeOptions,

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

    return {
      options,

      conversationOS,

      controller,

      stateComponent,

      stateStore,

      stateMigrator,

      historyIndex,

      pendingInteractionManager,

      artifactRegister,

      deliverySequenceManager,

      integrationStage,

      execute,

      inspect,

      storageAdapter,

      storageKeyPrefix,

      baseRuntimeOptions,

      persistentRuntimeOptions,

      performanceLimits: {
        ...DEFAULT_PERFORMANCE_LIMITS,

        ...(
          isObject(
            options.performanceLimits
          )
            ? options.performanceLimits
            : {}
        )
      },

      ids: {
        suite:
          createId(
            "cos_regression_suite"
          ),

        primaryConversation:
          createId(
            "cos_regression_primary"
          ),

        persistenceConversation:
          createId(
            "cos_regression_persistence"
          ),

        migrationConversation:
          createId(
            "cos_regression_migration"
          ),

        integrationConversation:
          createId(
            "cos_regression_integration"
          )
      },

      shared: {
        state: null,
        history: [],
        packets: [],
        results: [],
        branchThreadId: null,
        outerInterruptionThreadId: null,
        innerInterruptionThreadId: null
      },

      cleanupConversationIds:
        new Set()
    };
  }

  /* =====================================================
     SCENARIO EXECUTION
  ===================================================== */

  async function executeScenario(
    scenario,
    context
  ) {
    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    try {
      const details =
        await scenario.run(
          context
        );

      const skipped =
        Boolean(
          details &&
          details.skipped === true
        );

      return {
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        resultType:
          SCENARIO_RESULT_TYPE,

        id:
          scenario.id,

        name:
          scenario.name,

        group:
          scenario.group,

        required:
          scenario.required,

        tags:
          [...scenario.tags],

        passed: true,

        skipped,

        status:
          skipped
            ? "skipped"
            : "passed",

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

        error:
          null
      };
    } catch (error) {
      const normalized =
        safeError(error);

      normalized.scenarioId =
        scenario.id;

      return {
        schemaVersion:
          SCHEMA_VERSION,

        authority:
          AUTHORITY,

        component:
          COMPONENT_NAME,

        resultType:
          SCENARIO_RESULT_TYPE,

        id:
          scenario.id,

        name:
          scenario.name,

        group:
          scenario.group,

        required:
          scenario.required,

        tags:
          [...scenario.tags],

        passed: false,

        skipped: false,

        status:
          scenario.required
            ? "failed"
            : "optional_failed",

        startedAt,

        completedAt:
          nowIso(),

        durationMs:
          elapsedMs(
            startedAtMs
          ),

        details:
          null,

        error:
          normalized
      };
    }
  }

  /* =====================================================
     CLEANUP
  ===================================================== */

  async function removeStoredState(
    context,
    conversationId
  ) {
    if (
      !context.controller ||
      !isFunction(
        context.controller
          .removeState
      )
    ) {
      return {
        ok: true,
        skipped: true,
        conversationId
      };
    }

    try {
      return await context
        .controller
        .removeState(
          conversationId,
          {
            storageAdapter:
              context
                .storageAdapter,

            storageKeyPrefix:
              context
                .storageKeyPrefix,

            persistence: true,

            freeze: false
          }
        );
    } catch (error) {
      return {
        ok: false,

        conversationId,

        error:
          safeError(error)
      };
    }
  }

  async function cleanupContext(
    context
  ) {
    const results = [];

    for (
      const conversationId of
        context
          .cleanupConversationIds
    ) {
      results.push(
        await removeStoredState(
          context,
          conversationId
        )
      );
    }

    return results;
  }

  /* =====================================================
     STANDARD SCENARIOS
  ===================================================== */

  function registerStandardScenarios() {
    if (
      scenarioRegistry.size > 0
    ) {
      return;
    }

    registerScenario({
      id:
        "installation_readiness",

      name:
        "Installation readiness",

      group:
        "installation",

      tags: [
        "installation",
        "health"
      ],

      run:
        async (context) => {
          assert(
            context.inspect,
            "COS installation inspection is unavailable."
          );

          const inspection =
            await context.inspect(
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
              "ready",

            missing:
              safeClone(
                inspection
                  .missingRequired ||
                inspection.missing ||
                []
              )
          };
        }
    });

    registerScenario({
      id:
        "empty_state_shape",

      name:
        "Canonical empty-state shape",

      group:
        "state",

      tags: [
        "state",
        "schema",
        "auxiliary"
      ],

      run:
        async (context) => {
          assert(
            context.stateComponent,
            "COS state component is unavailable."
          );

          const create =
            resolveCallable(
              context.stateComponent,
              [
                "create",
                "initialize",
                "createInitialState",
                "createEmptyState"
              ],
              {
                code:
                  "COS_REGRESSION_STATE_FACTORY_UNAVAILABLE",

                message:
                  "COS state factory is unavailable."
              }
            );

          const state =
            await create(
              {
                conversationId:
                  context.ids
                    .primaryConversation
              },
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                freeze: false
              }
            );

          assertObject(
            state,
            "State factory must return an object."
          );

          assertEqual(
            state.schemaVersion,
            SCHEMA_VERSION,
            "State schema version mismatch."
          );

          assertEqual(
            state.authority,
            AUTHORITY,
            "State authority mismatch."
          );

          assertObject(
            state.turns,
            "State requires turns."
          );

          assertObject(
            state.threads,
            "State requires threads."
          );

          assertArray(
            state.threadStack,
            "State requires threadStack."
          );

          assertArray(
            state.interruptionStack,
            "State requires interruptionStack."
          );

          assertAuxiliaryStateShape(
            state
          );

          return {
            revision:
              state.revision,

            stateType:
              state.stateType
          };
        }
    });

    registerScenario({
      id:
        "first_turn_new_thread",

      name:
        "First turn creates a new thread",

      group:
        "placement",

      tags: [
        "placement",
        "thread"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_1",

              role:
                "user",

              text:
                "Initial turn.",

              sequence: 0
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertPacketShape(
            result.packet
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "new_thread",
            "First turn should create a new thread."
          );

          assertNonEmptyString(
            readPlacementThreadId(
              result
            ),
            "New thread requires a thread ID."
          );

          const resolution =
            readReferenceResolution(
              result
            );

          assertObject(
            resolution,
            "Result requires reference resolution."
          );

          assertEqual(
            resolution.status,
            "not_required",
            "First turn should not require reference resolution."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          context.shared.packets.push(
            safeClone(
              result.packet
            )
          );

          context.shared.results.push(
            safeClone(result)
          );

          return {
            threadId:
              result.state
                .activeThreadId,

            turnId:
              result.state
                .activeTurnId
          };
        }
    });

    registerScenario({
      id:
        "active_thread_continuation",

      name:
        "Active thread continuation",

      group:
        "placement",

      tags: [
        "placement",
        "continuation"
      ],

      run:
        async (context) => {
          const priorThreadId =
            context.shared.state
              .activeThreadId;

          const turn =
            createTurn({
              turnId:
                "regression_turn_2",

              role:
                "assistant",

              text:
                "Continuation.",

              sequence: 1
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "continue_thread",
            "Second turn should continue the active thread."
          );

          assertEqual(
            readPlacementThreadId(
              result
            ),
            priorThreadId,
            "Continuation should preserve the active thread."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          context.shared.packets.push(
            safeClone(
              result.packet
            )
          );

          return {
            threadId:
              result.state
                .activeThreadId
          };
        }
    });

    registerScenario({
      id:
        "explicit_reply",

      name:
        "Explicit reply resolution",

      group:
        "references",

      tags: [
        "reference",
        "reply"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_reply",

              role:
                "user",

              text:
                "Reply.",

              sequence: 2,

              replyToTurnId:
                "regression_turn_2"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          const resolution =
            readReferenceResolution(
              result
            );

          assertEqual(
            resolution.status,
            "resolved",
            "Explicit reply should resolve."
          );

          assertArrayIncludes(
            resolution.resolvedTurnIds,
            "regression_turn_2",
            "Reply target should be resolved."
          );

          assertEqual(
            readPlacementParentTurnId(
              result
            ),
            "regression_turn_2",
            "Reply target should become the parent turn."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            resolvedTurnIds:
              resolution
                .resolvedTurnIds
          };
        }
    });

    registerScenario({
      id:
        "explicit_answer",

      name:
        "Explicit answer placement",

      group:
        "references",

      tags: [
        "reference",
        "answer"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_answer",

              role:
                "user",

              text:
                "Yes.",

              sequence: 3,

              answerTargetTurnId:
                "regression_turn_2"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "answer_to_turn",
            "Answer target should produce answer_to_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result
            ),
            "regression_turn_2",
            "Answer target should become the parent."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            placementType:
              readPlacementType(
                result
              )
          };
        }
    });

    registerScenario({
      id:
        "explicit_clarification",

      name:
        "Explicit clarification placement",

      group:
        "references",

      tags: [
        "reference",
        "clarification"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_clarification",

              role:
                "user",

              text:
                "I meant the other file.",

              sequence: 4,

              clarificationTargetTurnId:
                "regression_turn_reply"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "clarification_of_turn",
            "Clarification target should produce clarification_of_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result
            ),
            "regression_turn_reply",
            "Clarification target should become the parent."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            placementType:
              readPlacementType(
                result
              )
          };
        }
    });

    registerScenario({
      id:
        "explicit_correction",

      name:
        "Explicit correction placement",

      group:
        "references",

      tags: [
        "reference",
        "correction"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_correction",

              role:
                "user",

              text:
                "Correction.",

              sequence: 5,

              correctionTargetTurnId:
                "regression_turn_clarification"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "correction_of_turn",
            "Correction target should produce correction_of_turn."
          );

          assertEqual(
            readPlacementParentTurnId(
              result
            ),
            "regression_turn_clarification",
            "Correction target should become the parent."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            placementType:
              readPlacementType(
                result
              )
          };
        }
    });

    registerScenario({
      id:
        "explicit_branch",

      name:
        "Explicit branch placement",

      group:
        "threads",

      tags: [
        "branch",
        "thread"
      ],

      run:
        async (context) => {
          const originThreadId =
            context.shared.state
              .activeThreadId;

          const turn =
            createTurn({
              turnId:
                "regression_turn_branch_1",

              role:
                "user",

              text:
                "Branch.",

              sequence: 6,

              branchOriginTurnId:
                "regression_turn_reply"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "branch_from_turn",
            "Branch target should produce branch_from_turn."
          );

          const branchThreadId =
            readPlacementThreadId(
              result
            );

          assertNonEmptyString(
            branchThreadId,
            "Branch requires a thread ID."
          );

          assertNotEqual(
            branchThreadId,
            originThreadId,
            "Branch thread must differ from the origin thread."
          );

          context.shared
            .branchThreadId =
            branchThreadId;

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            originThreadId,
            branchThreadId
          };
        }
    });

    registerScenario({
      id:
        "nested_branch",

      name:
        "Nested branch placement",

      group:
        "threads",

      tags: [
        "branch",
        "nested"
      ],

      run:
        async (context) => {
          const parentBranchThreadId =
            context.shared.state
              .activeThreadId;

          const turn =
            createTurn({
              turnId:
                "regression_turn_branch_2",

              role:
                "user",

              text:
                "Nested branch.",

              sequence: 7,

              branchOriginTurnId:
                "regression_turn_branch_1"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "branch_from_turn",
            "Nested branch should remain branch_from_turn."
          );

          assertNotEqual(
            readPlacementThreadId(
              result
            ),
            parentBranchThreadId,
            "Nested branch requires another distinct thread."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            parentBranchThreadId,

            nestedBranchThreadId:
              result.state
                .activeThreadId
          };
        }
    });

    registerScenario({
      id:
        "explicit_interruption",

      name:
        "Explicit interruption",

      group:
        "interruptions",

      tags: [
        "interruption",
        "thread"
      ],

      run:
        async (context) => {
          const interruptedThreadId =
            context.shared.state
              .activeThreadId;

          const stackBefore =
            context.shared.state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                "regression_turn_interrupt_1",

              role:
                "user",

              text:
                "Interrupt.",

              sequence: 8,

              placementType:
                "interruption",

              interruptionOriginTurnId:
                "regression_turn_branch_2"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "interruption",
            "Explicit interruption should remain interruption."
          );

          assertNotEqual(
            result.state
              .activeThreadId,
            interruptedThreadId,
            "Interruption should activate a new thread."
          );

          assertGreaterThan(
            result.state
              .interruptionStack
              .length,
            stackBefore,
            "Interruption should push the stack."
          );

          context.shared
            .outerInterruptionThreadId =
            result.state
              .activeThreadId;

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            interruptedThreadId,

            interruptionThreadId:
              result.state
                .activeThreadId
          };
        }
    });

    registerScenario({
      id:
        "nested_interruption",

      name:
        "Nested interruption",

      group:
        "interruptions",

      tags: [
        "interruption",
        "nested"
      ],

      run:
        async (context) => {
          const interruptedThreadId =
            context.shared.state
              .activeThreadId;

          const stackBefore =
            context.shared.state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                "regression_turn_interrupt_2",

              role:
                "user",

              text:
                "Interrupt again.",

              sequence: 9,

              placementType:
                "interruption",

              interruptionOriginTurnId:
                "regression_turn_interrupt_1"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "interruption",
            "Nested interruption should remain interruption."
          );

          assertGreaterThan(
            result.state
              .interruptionStack
              .length,
            stackBefore,
            "Nested interruption should push another entry."
          );

          context.shared
            .innerInterruptionThreadId =
            result.state
              .activeThreadId;

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            interruptedThreadId,

            nestedInterruptionThreadId:
              result.state
                .activeThreadId,

            stackDepth:
              result.state
                .interruptionStack
                .length
          };
        }
    });

    registerScenario({
      id:
        "return_from_nested_interruption",

      name:
        "Return from nested interruption",

      group:
        "interruptions",

      tags: [
        "return",
        "nested"
      ],

      run:
        async (context) => {
          const stackBefore =
            context.shared.state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                "regression_turn_return_1",

              role:
                "user",

              text:
                "Return once.",

              sequence: 10,

              placementType:
                "return_from_interruption",

              threadId:
                context.shared
                  .outerInterruptionThreadId,

              resumeTargetTurnId:
                "regression_turn_interrupt_1"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "return_from_interruption",
            "Nested return should remain return_from_interruption."
          );

          assertEqual(
            result.state
              .activeThreadId,
            context.shared
              .outerInterruptionThreadId,
            "Nested return should restore the outer interruption thread."
          );

          assert(
            result.state
              .interruptionStack
              .length <
              stackBefore,
            "Nested return should pop the stack."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            restoredThreadId:
              result.state
                .activeThreadId,

            stackDepth:
              result.state
                .interruptionStack
                .length
          };
        }
    });

    registerScenario({
      id:
        "return_from_outer_interruption",

      name:
        "Return from outer interruption",

      group:
        "interruptions",

      tags: [
        "return",
        "thread"
      ],

      run:
        async (context) => {
          const stackBefore =
            context.shared.state
              .interruptionStack
              .length;

          const expectedThreadId =
            context.shared
              .branchThreadId;

          const turn =
            createTurn({
              turnId:
                "regression_turn_return_2",

              role:
                "user",

              text:
                "Return again.",

              sequence: 11,

              placementType:
                "return_from_interruption",

              threadId:
                expectedThreadId,

              resumeTargetTurnId:
                "regression_turn_branch_1"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "return_from_interruption",
            "Outer return should remain return_from_interruption."
          );

          assertEqual(
            result.state
              .activeThreadId,
            expectedThreadId,
            "Outer return should restore the original branch thread."
          );

          assert(
            result.state
              .interruptionStack
              .length <
              stackBefore,
            "Outer return should pop the stack."
          );

          context.shared.state =
            result.state;

          context.shared.history =
            appendHistory(
              context.shared.history,
              turn,
              result
            );

          return {
            restoredThreadId:
              result.state
                .activeThreadId
          };
        }
    });

    registerScenario({
      id:
        "unresolved_reference",

      name:
        "Unresolved reference remains unresolved",

      group:
        "references",

      tags: [
        "reference",
        "unresolved"
      ],

      run:
        async (context) => {
          const priorActiveThreadId =
            context.shared.state
              .activeThreadId;

          const turn =
            createTurn({
              turnId:
                "regression_turn_unresolved",

              role:
                "user",

              text:
                "Missing reference.",

              sequence: 12,

              replyToTurnId:
                "missing_turn_id"
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertSuccessfulResult(
            result
          );

          const resolution =
            readReferenceResolution(
              result
            );

          assertEqual(
            resolution.status,
            "unresolved",
            "Missing reference must remain unresolved."
          );

          assertEqual(
            readPlacementType(
              result
            ),
            "unresolved_placement",
            "Missing reference must produce unresolved_placement."
          );

          assertEqual(
            readPlacementThreadId(
              result
            ),
            null,
            "Unresolved placement must not claim a thread."
          );

          assertEqual(
            result.state
              .activeThreadId,
            priorActiveThreadId,
            "Unresolved placement must not fabricate a new active thread."
          );

          assertObject(
            result.state.turns[
              turn.turnId
            ],
            "Unresolved turn should remain registered."
          );

          return {
            status:
              resolution.status,

            activeThreadId:
              result.state
                .activeThreadId
          };
        }
    });

    registerScenario({
      id:
        "duplicate_turn_rejection",

      name:
        "Duplicate turn identity rejection",

      group:
        "validation",

      tags: [
        "duplicate",
        "turn"
      ],

      run:
        async (context) => {
          const turn =
            createTurn({
              turnId:
                "regression_turn_1",

              role:
                "user",

              text:
                "Duplicate.",

              sequence: 13
            });

          const result =
            await context.execute(
              {
                conversationId:
                  context.ids
                    .primaryConversation,

                currentTurn:
                  turn,

                history:
                  context.shared
                    .history,

                state:
                  context.shared
                    .state
              },
              context
                .baseRuntimeOptions
            );

          assertStructuredFailure(
            result
          );

          return {
            errors:
              result.errors
          };
        }
    });

    registerScenario({
      id:
        "packet_authority_boundary",

      name:
        "Packet authority boundary",

      group:
        "authority",

      tags: [
        "packet",
        "authority"
      ],

      run:
        async (context) => {
          assertGreaterThan(
            context.shared
              .packets.length,
            0,
            "At least one packet is required."
          );

          for (
            const packet of
              context.shared.packets
          ) {
            assertPacketShape(
              packet
            );
          }

          return {
            packetCount:
              context.shared
                .packets.length
          };
        }
    });

    registerScenario({
      id:
        "state_revision_progression",

      name:
        "State revision progression",

      group:
        "state",

      tags: [
        "revision",
        "state"
      ],

      run:
        async (context) => {
          const state =
            context.shared.state;

          assertObject(
            state,
            "Shared state is unavailable."
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
            "State revision should advance."
          );

          assertGreaterThan(
            Object.keys(
              state.turns
            ).length,
            8,
            "State should preserve applied turns."
          );

          assertAuxiliaryStateShape(
            state
          );

          return {
            revision:
              state.revision,

            turnCount:
              Object.keys(
                state.turns
              ).length,

            threadCount:
              Object.keys(
                state.threads
              ).length
          };
        }
    });

    registerScenario({
      id:
        "packet_determinism",

      name:
        "Packet determinism",

      group:
        "determinism",

      tags: [
        "packet",
        "determinism"
      ],

      run:
        async (context) => {
          const conversationId =
            createId(
              "cos_regression_determinism"
            );

          const turn =
            createTurn({
              turnId:
                "determinism_turn_1",

              role:
                "user",

              text:
                "Deterministic turn.",

              sequence: 0,

              timestamp:
                "2026-01-01T00:00:00.000Z"
            });

          const input = {
            conversationId,
            currentTurn:
              turn,
            history: [],
            state: null
          };

          const first =
            await context.execute(
              input,
              {
                ...context
                  .baseRuntimeOptions,

                freeze: false
              }
            );

          const second =
            await context.execute(
              input,
              {
                ...context
                  .baseRuntimeOptions,

                freeze: false
              }
            );

          assertSuccessfulResult(
            first
          );

          assertSuccessfulResult(
            second
          );

          const normalizePacket =
            (packet) => {
              const clone =
                safeClone(packet);

              delete clone.requestId;
              delete clone.createdAt;
              delete clone.updatedAt;
              delete clone.generatedAt;
              delete clone.completedAt;
              delete clone.durationMs;

              return clone;
            };

          assertDeepEqual(
            normalizePacket(
              first.packet
            ),
            normalizePacket(
              second.packet
            ),
            "Equivalent input should produce equivalent packet structure."
          );

          return {
            deterministic:
              true
          };
        }
    });

    registerScenario({
      id:
        "history_index_determinism",

      name:
        "History-index determinism",

      group:
        "determinism",

      tags: [
        "history",
        "index"
      ],

      run:
        async (context) => {
          assert(
            context.historyIndex,
            "History-index component is unavailable."
          );

          const build =
            resolveCallable(
              context.historyIndex,
              [
                "build",
                "index",
                "createIndex",
                "run"
              ],
              {
                code:
                  "COS_REGRESSION_HISTORY_INDEX_UNAVAILABLE",

                message:
                  "History-index build method is unavailable."
              }
            );

          const history = [
            createTurn({
              turnId:
                "det_index_turn_2",

              sequence: 2,

              role:
                "assistant",

              text:
                "Second.",

              timestamp:
                "2026-01-01T00:00:02.000Z"
            }),

            createTurn({
              turnId:
                "det_index_turn_1",

              sequence: 1,

              role:
                "user",

              text:
                "First.",

              timestamp:
                "2026-01-01T00:00:01.000Z"
            })
          ];

          const first =
            await build(
              {
                history,
                strict: true,
                freeze: false
              },
              {
                strict: true,
                freeze: false
              }
            );

          const second =
            await build(
              {
                history:
                  safeClone(history),

                strict: true,
                freeze: false
              },
              {
                strict: true,
                freeze: false
              }
            );

          assertDeepEqual(
            first.orderedTurnIds,
            second.orderedTurnIds,
            "History index ordering must be deterministic."
          );

          assertDeepEqual(
            first.bySequence,
            second.bySequence,
            "History sequence index must be deterministic."
          );

          assertEqual(
            first.orderedTurnIds[0],
            "det_index_turn_1",
            "Sequence ordering should place turn 1 first."
          );

          return {
            orderedTurnIds:
              first.orderedTurnIds
          };
        }
    });

    registerScenario({
      id:
        "frozen_result_immutability",

      name:
        "Frozen result immutability",

      group:
        "immutability",

      tags: [
        "freeze",
        "immutability"
      ],

      run:
        async (context) => {
          const conversationId =
            createId(
              "cos_regression_freeze"
            );

          const result =
            await context.execute(
              {
                conversationId,

                currentTurn:
                  createTurn({
                    turnId:
                      "freeze_turn_1",

                    role:
                      "user",

                    text:
                      "Freeze.",

                    sequence: 0
                  }),

                history: [],

                state: null
              },
              {
                ...context
                  .baseRuntimeOptions,

                freeze: true
              }
            );

          assertSuccessfulResult(
            result
          );

          assertFrozen(
            result,
            "Top-level result should be frozen."
          );

          assertFrozen(
            result.state,
            "Returned state should be frozen."
          );

          assertFrozen(
            result.packet,
            "Returned packet should be frozen."
          );

          return {
            resultFrozen:
              Object.isFrozen(
                result
              ),

            stateFrozen:
              Object.isFrozen(
                result.state
              ),

            packetFrozen:
              Object.isFrozen(
                result.packet
              )
          };
        }
    });

    registerScenario({
      id:
        "pending_interaction_continuity",

      name:
        "Pending-interaction continuity",

      group:
        "auxiliary",

      tags: [
        "pending",
        "interaction"
      ],

      run:
        async (context) => {
          if (
            !context
              .pendingInteractionManager
          ) {
            return {
              skipped: true,
              reason:
                "Pending-interaction manager is unavailable."
            };
          }

          const manager =
            context
              .pendingInteractionManager;

          const createState =
            resolveCallable(
              manager,
              [
                "createEmptyState",
                "createState",
                "create"
              ],
              {
                code:
                  "COS_REGRESSION_PENDING_STATE_FACTORY_UNAVAILABLE",

                message:
                  "Pending-interaction state factory is unavailable."
              }
            );

          const transition =
            resolveCallable(
              manager,
              [
                "transition",
                "apply",
                "run"
              ],
              {
                code:
                  "COS_REGRESSION_PENDING_TRANSITION_UNAVAILABLE",

                message:
                  "Pending-interaction transition is unavailable."
              }
            );

          const conversationId =
            createId(
              "pending_regression"
            );

          let pendingState =
            await createState({
              conversationId
            });

          const createResult =
            await transition(
              {
                conversationId,

                state:
                  pendingState,

                currentTurn:
                  createTurn({
                    turnId:
                      "pending_source_turn",

                    role:
                      "assistant",

                    text:
                      "Choose A or B.",

                    sequence: 0
                  }),

                command: {
                  type:
                    "create",

                  interactionId:
                    "pending_interaction_1",

                  interactionType:
                    "choice",

                  sourceTurnId:
                    "pending_source_turn",

                  choices: [
                    "A",
                    "B"
                  ]
                }
              },
              {
                freeze: false
              }
            );

          assertObject(
            createResult.state,
            "Pending create transition requires state."
          );

          pendingState =
            createResult.state;

          assertNonEmptyString(
            pendingState
              .activeInteractionId,
            "Pending interaction should become active."
          );

          const resolveResult =
            await transition(
              {
                conversationId,

                state:
                  pendingState,

                currentTurn:
                  createTurn({
                    turnId:
                      "pending_answer_turn",

                    role:
                      "user",

                    text:
                      "A",

                    sequence: 1
                  }),

                command: {
                  type:
                    "resolve",

                  interactionId:
                    pendingState
                      .activeInteractionId,

                  resolution: {
                    selected:
                      "A"
                  }
                }
              },
              {
                freeze: false
              }
            );

          assertObject(
            resolveResult.state,
            "Pending resolve transition requires state."
          );

          return {
            created:
              true,

            resolved:
              true,

            activeInteractionId:
              resolveResult.state
                .activeInteractionId
          };
        }
    });

    registerScenario({
      id:
        "artifact_continuity",

      name:
        "Artifact continuity",

      group:
        "auxiliary",

      tags: [
        "artifact",
        "revision"
      ],

      run:
        async (context) => {
          if (
            !context.artifactRegister
          ) {
            return {
              skipped: true,
              reason:
                "Artifact register is unavailable."
            };
          }

          const register =
            context.artifactRegister;

          const createState =
            resolveCallable(
              register,
              [
                "createEmptyState",
                "createState",
                "create"
              ],
              {
                code:
                  "COS_REGRESSION_ARTIFACT_STATE_FACTORY_UNAVAILABLE",

                message:
                  "Artifact state factory is unavailable."
              }
            );

          const transition =
            resolveCallable(
              register,
              [
                "transition",
                "apply",
                "run"
              ],
              {
                code:
                  "COS_REGRESSION_ARTIFACT_TRANSITION_UNAVAILABLE",

                message:
                  "Artifact transition is unavailable."
              }
            );

          const conversationId =
            createId(
              "artifact_regression"
            );

          let artifactState =
            await createState({
              conversationId
            });

          const createResult =
            await transition(
              {
                conversationId,

                state:
                  artifactState,

                currentTurn:
                  createTurn({
                    turnId:
                      "artifact_source_turn",

                    role:
                      "assistant",

                    text:
                      "Created file.",

                    sequence: 0
                  }),

                command: {
                  type:
                    "create",

                  artifactId:
                    "artifact_1",

                  artifactType:
                    "code_file",

                  filePath:
                    "rebirth/test.js",

                  title:
                    "Regression Artifact",

                  sourceTurnId:
                    "artifact_source_turn"
                }
              },
              {
                freeze: false
              }
            );

          artifactState =
            createResult.state;

          assertNonEmptyString(
            artifactState
              .activeArtifactId,
            "Created artifact should become active."
          );

          const updateResult =
            await transition(
              {
                conversationId,

                state:
                  artifactState,

                currentTurn:
                  createTurn({
                    turnId:
                      "artifact_update_turn",

                    role:
                      "assistant",

                    text:
                      "Updated file.",

                    sequence: 1
                  }),

                command: {
                  type:
                    "update",

                  artifactId:
                    artifactState
                      .activeArtifactId,

                  revisionNote:
                    "Regression update",

                  sourceTurnId:
                    "artifact_update_turn"
                }
              },
              {
                freeze: false
              }
            );

          assertObject(
            updateResult.state,
            "Artifact update requires state."
          );

          return {
            artifactId:
              updateResult.state
                .activeArtifactId,

            artifactCount:
              Object.keys(
                updateResult.state
                  .artifacts
              ).length
          };
        }
    });

    registerScenario({
      id:
        "delivery_sequence_continuity",

      name:
        "Delivery-sequence continuity",

      group:
        "auxiliary",

      tags: [
        "sequence",
        "next"
      ],

      run:
        async (context) => {
          if (
            !context
              .deliverySequenceManager
          ) {
            return {
              skipped: true,
              reason:
                "Delivery-sequence manager is unavailable."
            };
          }

          const manager =
            context
              .deliverySequenceManager;

          const createState =
            resolveCallable(
              manager,
              [
                "createEmptyState",
                "createState",
                "create"
              ],
              {
                code:
                  "COS_REGRESSION_SEQUENCE_STATE_FACTORY_UNAVAILABLE",

                message:
                  "Delivery-sequence state factory is unavailable."
              }
            );

          const transition =
            resolveCallable(
              manager,
              [
                "transition",
                "apply",
                "run"
              ],
              {
                code:
                  "COS_REGRESSION_SEQUENCE_TRANSITION_UNAVAILABLE",

                message:
                  "Delivery-sequence transition is unavailable."
              }
            );

          const conversationId =
            createId(
              "sequence_regression"
            );

          let sequenceState =
            await createState({
              conversationId
            });

          const createResult =
            await transition(
              {
                conversationId,

                state:
                  sequenceState,

                currentTurn:
                  createTurn({
                    turnId:
                      "sequence_source_turn",

                    role:
                      "assistant",

                    text:
                      "Part 1.",

                    sequence: 0
                  }),

                command: {
                  type:
                    "create",

                  sequenceId:
                    "delivery_sequence_1",

                  sequenceType:
                    "multipart_code",

                  sourceTurnId:
                    "sequence_source_turn",

                  items: [
                    {
                      itemId:
                        "part_1",

                      position: 1,

                      status:
                        "pending"
                    },

                    {
                      itemId:
                        "part_2",

                      position: 2,

                      status:
                        "pending"
                    },

                    {
                      itemId:
                        "part_3",

                      position: 3,

                      status:
                        "pending"
                    }
                  ]
                }
              },
              {
                freeze: false
              }
            );

          sequenceState =
            createResult.state;

          assertNonEmptyString(
            sequenceState
              .activeSequenceId,
            "Created sequence should become active."
          );

          const deliveryResult =
            await transition(
              {
                conversationId,

                state:
                  sequenceState,

                currentTurn:
                  createTurn({
                    turnId:
                      "sequence_delivery_turn",

                    role:
                      "assistant",

                    text:
                      "Delivered part 1.",

                    sequence: 1
                  }),

                command: {
                  type:
                    "mark_delivered",

                  sequenceId:
                    sequenceState
                      .activeSequenceId,

                  itemId:
                    "part_1",

                  sourceTurnId:
                    "sequence_delivery_turn"
                }
              },
              {
                freeze: false
              }
            );

          assertObject(
            deliveryResult.state,
            "Delivery transition requires state."
          );

          return {
            sequenceId:
              deliveryResult.state
                .activeSequenceId,

            sequenceCount:
              Object.keys(
                deliveryResult.state
                  .sequences
              ).length
          };
        }
    });

    registerScenario({
      id:
        "direct_store_round_trip",

      name:
        "Direct state-store round trip",

      group:
        "persistence",

      tags: [
        "store",
        "save",
        "load"
      ],

      run:
        async (context) => {
          assert(
            context.stateStore,
            "COS state store is unavailable."
          );

          const conversationId =
            createId(
              "direct_store_round_trip"
            );

          context
            .cleanupConversationIds
            .add(
              conversationId
            );

          const save =
            resolveCallable(
              context.stateStore,
              [
                "save",
                "safeSave"
              ],
              {
                code:
                  "COS_REGRESSION_STORE_SAVE_UNAVAILABLE",

                message:
                  "State-store save is unavailable."
              }
            );

          const load =
            resolveCallable(
              context.stateStore,
              [
                "load",
                "safeLoad"
              ],
              {
                code:
                  "COS_REGRESSION_STORE_LOAD_UNAVAILABLE",

                message:
                  "State-store load is unavailable."
              }
            );

          const state = {
            ...safeClone(
              context.shared.state
            ),

            conversationId
          };

          const saveResult =
            await save(
              conversationId,
              state,
              {
                adapter:
                  context
                    .storageAdapter,

                keyPrefix:
                  context
                    .storageKeyPrefix,

                validateBeforeSave:
                  true,

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
                  context
                    .storageAdapter,

                keyPrefix:
                  context
                    .storageKeyPrefix,

                migrate: false,

                validate: true,

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

          assertEqual(
            loadResult.state
              .conversationId,
            conversationId,
            "Round-trip state should preserve conversation ID."
          );

          assertDeepEqual(
            loadResult.state.turns,
            state.turns,
            "Round-trip turns should remain equal."
          );

          return {
            storageRevision:
              loadResult
                .storageRevision,

            stateRevision:
              loadResult.state
                .revision
          };
        }
    });

    registerScenario({
      id:
        "controller_persistence_restart",

      name:
        "Controller persistence across restart",

      group:
        "persistence",

      tags: [
        "controller",
        "restart"
      ],

      run:
        async (context) => {
          assert(
            context.controller,
            "COS controller is unavailable."
          );

          const conversationId =
            context.ids
              .persistenceConversation;

          context
            .cleanupConversationIds
            .add(
              conversationId
            );

          await removeStoredState(
            context,
            conversationId
          );

          const runController =
            resolveCallable(
              context.controller,
              [
                "run",
                "execute",
                "process",
                "safeRun"
              ],
              {
                code:
                  "COS_REGRESSION_CONTROLLER_RUN_UNAVAILABLE",

                message:
                  "COS controller run is unavailable."
              }
            );

          const first =
            await runController(
              {
                conversationId,

                currentTurn:
                  createTurn({
                    turnId:
                      "persistence_restart_turn_1",

                    role:
                      "user",

                    text:
                      "Persist me.",

                    sequence: 0
                  }),

                history: [],

                state: null
              },
              {
                ...context
                  .persistentRuntimeOptions,

                freeze: false
              }
            );

          assertSuccessfulResult(
            first
          );

          assertEqual(
            first.stateSaved,
            true,
            "Initial controller run should save state."
          );

          const threadId =
            first.state
              .activeThreadId;

          const second =
            await runController(
              {
                conversationId,

                currentTurn:
                  createTurn({
                    turnId:
                      "persistence_restart_turn_2",

                    role:
                      "assistant",

                    text:
                      "Restored.",

                    sequence: 1
                  }),

                history: [],

                state: null
              },
              {
                ...context
                  .persistentRuntimeOptions,

                freeze: false
              }
            );

          assertSuccessfulResult(
            second
          );

          assertEqual(
            second.stateLoaded,
            true,
            "Second run should load state."
          );

          assertEqual(
            second.stateSource,
            "persisted",
            "Second run should use persisted state."
          );

          assertEqual(
            second.state
              .activeThreadId,
            threadId,
            "Restart should preserve the thread."
          );

          assertObject(
            second.state.turns[
              "persistence_restart_turn_1"
            ],
            "Restart should preserve the first turn."
          );

          return {
            threadId,

            stateLoaded:
              second.stateLoaded,

            stateSaved:
              second.stateSaved
          };
        }
    });

    registerScenario({
      id:
        "legacy_state_migration",

      name:
        "Legacy state migration",

      group:
        "migration",

      tags: [
        "legacy",
        "migration"
      ],

      run:
        async (context) => {
          assert(
            context.stateMigrator,
            "COS state migrator is unavailable."
          );

          const migrate =
            resolveCallable(
              context.stateMigrator,
              [
                "migrate",
                "upgrade",
                "run",
                "normalize"
              ],
              {
                code:
                  "COS_REGRESSION_MIGRATOR_UNAVAILABLE",

                message:
                  "COS state migration is unavailable."
              }
            );

          const conversationId =
            context.ids
              .migrationConversation;

          const result =
            await migrate(
              {
                conversationId,

                state:
                  createLegacyState(
                    conversationId
                  ),

                fromVersion:
                  "0.0.0",

                toVersion:
                  SCHEMA_VERSION
              },
              {
                freeze: false,

                freezeState:
                  false,

                validate: true
              }
            );

          assertObject(
            result.state,
            "Migration requires resulting state."
          );

          assertEqual(
            result.state
              .schemaVersion,
            SCHEMA_VERSION,
            "Migrated state should use current schema."
          );

          assertObject(
            result.state.turns[
              "legacy_turn_1"
            ],
            "Migration should preserve the legacy turn."
          );

          assertObject(
            result.state.threads[
              "legacy_thread_1"
            ],
            "Migration should preserve the legacy thread."
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
              result.toVersion
          };
        }
    });

    registerScenario({
      id:
        "controller_persisted_migration",

      name:
        "Controller migration of persisted legacy state",

      group:
        "migration",

      tags: [
        "controller",
        "legacy",
        "persistence"
      ],

      run:
        async (context) => {
          assert(
            context.controller,
            "COS controller is unavailable."
          );

          assert(
            context.stateStore,
            "COS state store is unavailable."
          );

          const conversationId =
            createId(
              "persisted_legacy"
            );

          context
            .cleanupConversationIds
            .add(
              conversationId
            );

          await removeStoredState(
            context,
            conversationId
          );

          const save =
            resolveCallable(
              context.stateStore,
              [
                "save",
                "safeSave"
              ],
              {
                code:
                  "COS_REGRESSION_STORE_SAVE_UNAVAILABLE",

                message:
                  "State-store save is unavailable."
              }
            );

          const runController =
            resolveCallable(
              context.controller,
              [
                "run",
                "execute",
                "process",
                "safeRun"
              ],
              {
                code:
                  "COS_REGRESSION_CONTROLLER_RUN_UNAVAILABLE",

                message:
                  "Controller run is unavailable."
              }
            );

          const saveResult =
            await save(
              conversationId,
              createLegacyState(
                conversationId
              ),
              {
                adapter:
                  context
                    .storageAdapter,

                keyPrefix:
                  context
                    .storageKeyPrefix,

                validateBeforeSave:
                  false,

                freeze: false
              }
            );

          assertEqual(
            saveResult.ok,
            true,
            "Legacy record should be saved."
          );

          const result =
            await runController(
              {
                conversationId,

                currentTurn:
                  createTurn({
                    turnId:
                      "post_migration_turn",

                    role:
                      "assistant",

                    text:
                      "Post migration.",

                    sequence: 1
                  }),

                history: [],

                state: null
              },
              {
                ...context
                  .persistentRuntimeOptions,

                migrateState:
                  true,

                stateSourcePolicy:
                  "prefer_persisted",

                freeze: false
              }
            );

          assertSuccessfulResult(
            result
          );

          assertEqual(
            result.stateLoaded,
            true,
            "Controller should load the legacy state."
          );

          assertEqual(
            result.stateMigrated,
            true,
            "Controller should report migration."
          );

          assertEqual(
            result.state
              .schemaVersion,
            SCHEMA_VERSION,
            "Controller should execute current schema."
          );

          assertObject(
            result.state.turns[
              "legacy_turn_1"
            ],
            "Controller should preserve the legacy turn."
          );

          assertObject(
            result.state.turns[
              "post_migration_turn"
            ],
            "Controller should register the post-migration turn."
          );

          return {
            stateLoaded:
              result.stateLoaded,

            stateMigrated:
              result.stateMigrated,

            stateSaved:
              result.stateSaved
          };
        }
    });

    registerScenario({
      id:
        "rebirth_authority_preservation",

      name:
        "Rebirth authority preservation",

      group:
        "authority",

      required:
        false,

      tags: [
        "integration",
        "authority"
      ],

      run:
        async (context) => {
          if (
            !context.integrationStage
          ) {
            return {
              skipped: true,

              reason:
                "Rebirth COS integration stage is unavailable."
            };
          }

          const runIntegration =
            resolveCallable(
              context.integrationStage,
              [
                "run",
                "execute",
                "process"
              ],
              {
                code:
                  "COS_REGRESSION_INTEGRATION_UNAVAILABLE",

                message:
                  "Rebirth COS integration execution is unavailable."
              }
            );

          const semanticPacket = {
            authority:
              "semantic_frame_builder",

            subject:
              "runtime",

            action:
              "continue",

            semanticMeaning:
              "Continue the runtime work."
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
              context.ids
                .integrationConversation,

            currentTurn:
              createTurn({
                turnId:
                  "integration_regression_turn",

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
            await runIntegration(
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
                freeze:
                  false
              }
            );

          assertObject(
            result.state,
            "Integration requires merged runtime state."
          );

          assertDeepEqual(
            result.state
              .semanticPacket,
            semanticPacket,
            "Integration must preserve semantic authority."
          );

          assertDeepEqual(
            result.state
              .conversationFunction,
            conversationFunction,
            "Integration must preserve conversation-function authority."
          );

          assertDeepEqual(
            result.state
              .safetyContext,
            safetyContext,
            "Integration must preserve safety authority."
          );

          assertObject(
            result.state
              .conversationOSState,
            "Integration should attach COS state."
          );

          assertObject(
            result.state
              .conversationOSResult,
            "Integration should attach COS result."
          );

          return {
            semanticPreserved:
              true,

            conversationFunctionPreserved:
              true,

            safetyPreserved:
              true
          };
        }
    });

    registerScenario({
      id:
        "large_history_indexing",

      name:
        "Large-history indexing",

      group:
        "performance",

      tags: [
        "history",
        "performance"
      ],

      run:
        async (context) => {
          assert(
            context.historyIndex,
            "History-index component is unavailable."
          );

          const build =
            resolveCallable(
              context.historyIndex,
              [
                "build",
                "index",
                "createIndex",
                "run"
              ],
              {
                code:
                  "COS_REGRESSION_HISTORY_INDEX_UNAVAILABLE",

                message:
                  "History-index build is unavailable."
              }
            );

          const count =
            normalizeInteger(
              context
                .performanceLimits
                .largeHistoryTurnCount,
              250
            );

          const history =
            createLargeHistory(
              count
            );

          const startedAt =
            nowMs();

          const index =
            await build(
              {
                history,
                strict: true,
                freeze: false
              },
              {
                strict: true,
                freeze: false
              }
            );

          const durationMs =
            elapsedMs(
              startedAt
            );

          assertEqual(
            index.count,
            count,
            "Large-history index count mismatch."
          );

          assertEqual(
            index.orderedTurnIds
              .length,
            count,
            "Large-history ordered-turn count mismatch."
          );

          assertLessThanOrEqual(
            durationMs,
            context
              .performanceLimits
              .historyBuildMs,
            "Large-history indexing exceeded the configured performance limit."
          );

          return {
            count,
            durationMs,

            limitMs:
              context
                .performanceLimits
                .historyBuildMs
          };
        }
    });
  }

  /* =====================================================
     SCENARIO FILTERING
  ===================================================== */

  function selectScenarios(
    options = {}
  ) {
    const includeIds =
      uniqueStrings(
        options.scenarioIds ||
        options.includeScenarioIds
      );

    const excludeIds =
      new Set(
        uniqueStrings(
          options.excludeScenarioIds
        )
      );

    const includeGroups =
      new Set(
        uniqueStrings(
          options.groups ||
          options.includeGroups
        )
      );

    const includeTags =
      new Set(
        uniqueStrings(
          options.tags ||
          options.includeTags
        )
      );

    return Array.from(
      scenarioRegistry.values()
    ).filter(
      (scenario) => {
        if (!scenario.enabled) {
          return false;
        }

        if (
          includeIds.length > 0 &&
          !includeIds.includes(
            scenario.id
          )
        ) {
          return false;
        }

        if (
          excludeIds.has(
            scenario.id
          )
        ) {
          return false;
        }

        if (
          includeGroups.size > 0 &&
          !includeGroups.has(
            scenario.group
          )
        ) {
          return false;
        }

        if (
          includeTags.size > 0 &&
          !scenario.tags.some(
            (tag) =>
              includeTags.has(tag)
          )
        ) {
          return false;
        }

        if (
          options.requiredOnly ===
            true &&
          !scenario.required
        ) {
          return false;
        }

        return true;
      }
    );
  }

  /* =====================================================
     PUBLIC RUN
  ===================================================== */

  async function run(
    options = {}
  ) {
    registerStandardScenarios();

    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    const context =
      createExecutionContext(
        options
      );

    const selectedScenarios =
      selectScenarios(
        options
      );

    const results = [];

    for (
      const scenario of
        selectedScenarios
    ) {
      const result =
        await executeScenario(
          scenario,
          context
        );

      results.push(result);

      if (
        result.passed === false &&
        scenario.required &&
        options.stopOnFailure ===
          true
      ) {
        break;
      }
    }

    const cleanup =
      options.cleanup === false
        ? []
        : await cleanupContext(
            context
          );

    const requiredResults =
      results.filter(
        (result) =>
          result.required === true
      );

    const optionalResults =
      results.filter(
        (result) =>
          result.required !== true
      );

    const failedRequired =
      requiredResults.filter(
        (result) =>
          result.passed === false
      );

    const failedOptional =
      optionalResults.filter(
        (result) =>
          result.passed === false
      );

    const skipped =
      results.filter(
        (result) =>
          result.skipped === true
      );

    const passed =
      results.filter(
        (result) =>
          result.passed === true &&
          result.skipped !== true
      );

    const status =
      failedRequired.length > 0
        ? "failed"
        : failedOptional.length > 0
          ? "passed_with_optional_failures"
          : "passed";

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
        RESULT_TYPE,

      suiteId:
        context.ids.suite,

      ok:
        failedRequired.length === 0,

      status,

      startedAt,

      completedAt:
        nowIso(),

      durationMs:
        elapsedMs(
          startedAtMs
        ),

      scenarioCount:
        results.length,

      requiredScenarioCount:
        requiredResults.length,

      optionalScenarioCount:
        optionalResults.length,

      passedCount:
        passed.length,

      skippedCount:
        skipped.length,

      failedCount:
        failedRequired.length +
        failedOptional.length,

      failedRequiredCount:
        failedRequired.length,

      failedOptionalCount:
        failedOptional.length,

      storageAdapter:
        typeof context
          .storageAdapter ===
          "string"
          ? context
              .storageAdapter
          : firstNonEmptyString(
              context
                .storageAdapter &&
                context
                  .storageAdapter
                  .type,

              context
                .storageAdapter &&
                context
                  .storageAdapter
                  .name
            ) ||
            "custom",

      storageKeyPrefix:
        context.storageKeyPrefix,

      performanceLimits:
        safeClone(
          context
            .performanceLimits
        ),

      scenarios:
        results,

      failures:
        results
          .filter(
            (scenario) =>
              scenario.passed ===
              false
          )
          .map(
            (scenario) => ({
              id:
                scenario.id,

              name:
                scenario.name,

              group:
                scenario.group,

              required:
                scenario.required,

              error:
                scenario.error
            })
          ),

      cleanup:
        safeClone(cleanup),

      finalSharedState:
        options
          .includeFinalState ===
          true
          ? safeClone(
              context.shared.state
            )
          : null,

      finalSharedHistory:
        options
          .includeFinalHistory ===
          true
          ? safeClone(
              context.shared.history
            )
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
          "[ARI Rebirth COS Regression Suite]",
          result
        );
      }

      if (
        isFunction(
          console.table
        )
      ) {
        console.table(
          results.map(
            (scenario) => ({
              Scenario:
                scenario.name,

              ID:
                scenario.id,

              Group:
                scenario.group,

              Required:
                scenario.required,

              Status:
                scenario.status,

              Duration:
                `${scenario.durationMs}ms`,

              Error:
                scenario.error
                  ? scenario
                      .error.message
                  : ""
            })
          )
        );
      }
    }

    return options.freeze ===
      true
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
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SUITE_FAILED",
        `${result.failedRequiredCount} required COS regression scenario(s) failed.`,
        {
          details:
            result
        }
      );
    }

    return result;
  }

  /* =====================================================
     RUN SINGLE SCENARIO
  ===================================================== */

  async function runScenario(
    scenarioId,
    options = {}
  ) {
    registerStandardScenarios();

    const scenario =
      getScenario(
        scenarioId
      );

    if (!scenario) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SCENARIO_UNKNOWN",
        "Unknown COS regression scenario.",
        {
          scenarioId
        }
      );
    }

    const context =
      createExecutionContext(
        options
      );

    const prerequisites =
      firstDefined(
        options.runPrerequisites,
        true
      ) !== false;

    if (
      prerequisites &&
      scenarioId !==
        "installation_readiness"
    ) {
      const installation =
        getScenario(
          "installation_readiness"
        );

      const installationResult =
        await executeScenario(
          installation,
          context
        );

      if (
        !installationResult.passed
      ) {
        return {
          schemaVersion:
            SCHEMA_VERSION,

          authority:
            AUTHORITY,

          component:
            COMPONENT_NAME,

          version:
            VERSION,

          resultType:
            RESULT_TYPE,

          ok: false,

          status:
            "failed",

          scenarioCount: 1,

          scenarios: [
            installationResult
          ],

          failures: [
            {
              id:
                installationResult.id,

              error:
                installationResult
                  .error
            }
          ]
        };
      }
    }

    const result =
      await executeScenario(
        scenario,
        context
      );

    if (
      options.cleanup !== false
    ) {
      await cleanupContext(
        context
      );
    }

    return {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      resultType:
        RESULT_TYPE,

      ok:
        result.passed === true,

      status:
        result.status,

      scenarioCount: 1,

      scenarios: [
        result
      ],

      failures:
        result.passed
          ? []
          : [
              {
                id:
                  result.id,

                error:
                  result.error
              }
            ]
    };
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

      scenarioCount:
        normalizeInteger(
          result.scenarioCount,
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

      durationMs:
        normalizeNumber(
          result.durationMs,
          0
        ),

      failures:
        Array.isArray(
          result.failures
        )
          ? safeClone(
              result.failures
            )
          : []
    };
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const cosRegressionSuite = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    resultType:
      RESULT_TYPE,

    scenarioResultType:
      SCENARIO_RESULT_TYPE,

    standardScenarioIds:
      STANDARD_SCENARIO_IDS,

    defaultPerformanceLimits:
      DEFAULT_PERFORMANCE_LIMITS,

    requiredPacketKeys:
      REQUIRED_PACKET_KEYS,

    forbiddenPacketKeys:
      FORBIDDEN_PACKET_KEYS,

    CosRegressionSuiteError,

    run,

    execute:
      run,

    test:
      run,

    assertAll,

    runScenario,

    summarize,

    registerScenario,

    unregisterScenario,

    getScenario,

    listScenarios,

    selectScenarios,

    registerStandardScenarios,

    createExecutionContext,

    createTurn,

    createLegacyState,

    createLargeHistory,

    appendHistory,

    assertPacketShape,

    assertAuxiliaryStateShape,

    readPlacement,

    readPlacementType,

    readPlacementThreadId,

    readPlacementParentTurnId,

    readReferenceResolution
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  ConversationOS.testing
    .regressionSuite =
    cosRegressionSuite;

  ConversationOS.testing
    .cosRegressionSuite =
    cosRegressionSuite;

  ConversationOS.regressionSuite =
    cosRegressionSuite;

  root.AriCosRegressionSuite =
    cosRegressionSuite;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      cosRegressionSuite;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);