// rebirth/conversation-os/testing/cos-regression-suite.js
// ARI Rebirth — Conversation Operating System Regression Suite
//
// Purpose:
// Run deterministic regression scenarios against the complete Conversation
// Operating System and verify that future changes do not break conversation
// placement, reference binding, thread state, or packet authority boundaries.
//
// V1.0.0 — Canonical COS Structural Regression Suite
//
// Test groups:
//
// - installation
// - new conversation
// - active-thread continuation
// - explicit reply placement
// - answer placement
// - clarification placement
// - correction placement
// - branch placement
// - interruption placement
// - interruption return
// - resumed thread placement
// - unresolved references
// - partially resolved references
// - duplicate turn protection
// - state immutability
// - packet immutability
// - packet authority boundaries
// - thread membership
// - parent-child preservation
// - state revision progression
// - repeated execution isolation
//
// Non-responsibility:
//
// This suite does not:
//
// - interpret natural language,
// - test semantic understanding,
// - test intent classification,
// - test conversation-function classification,
// - infer implicit references,
// - modify production authority,
// - repair invalid placements.
//
// Architectural rule:
//
// The suite tests only the structural authority currently assigned to COS.
//
// Natural-language references such as:
//
// - "Next"
// - "Why?"
// - "What about that?"
// - "Send it"
// - "Do the other one"
//
// are not resolved by this structural suite unless an upstream authority has
// already supplied explicit turn-reference metadata.
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

  const ConversationOS =
    root.Ari.Rebirth.ConversationOS;

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

  const PACKET_TYPE =
    "authoritative_conversation_placement_packet";

  const EXPECTED_PACKET_KEYS = Object.freeze([
    "authority",
    "conversationId",
    "currentTurn",
    "packetType",
    "placement",
    "referenceResolution",
    "requestId",
    "schemaVersion"
  ]);

  const EXPECTED_CURRENT_TURN_KEYS = Object.freeze([
    "role",
    "sequence",
    "text",
    "timestamp",
    "turnId"
  ]);

  const EXPECTED_PLACEMENT_KEYS = Object.freeze([
    "parentTurnId",
    "sourceTurnIds",
    "threadId",
    "type"
  ]);

  const EXPECTED_REFERENCE_KEYS = Object.freeze([
    "resolvedTurnIds",
    "status",
    "unresolvedReferences"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosRegressionSuiteError extends Error {
    constructor(
      code,
      message,
      {
        details = null,
        cause = null
      } = {}
    ) {
      super(
        message ||
        code ||
        "COS regression suite error"
      );

      this.name =
        "CosRegressionSuiteError";

      this.code =
        code ||
        "COS_REGRESSION_SUITE_ERROR";

      this.details = details;
      this.cause = cause;

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
      typeof structuredClone === "function"
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

  function elapsedMs(startedAtMs) {
    const value =
      nowMs() - startedAtMs;

    return Number.isFinite(value)
      ? Math.max(
          0,
          Math.round(value * 1000) / 1000
        )
      : 0;
  }

  function createId(prefix = "cos_test") {
    const timestamp =
      Date.now().toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 12);

    return `${prefix}_${timestamp}_${random}`;
  }

  function sortKeys(value) {
    return Object.keys(
      value || {}
    ).sort();
  }

  function arraysEqual(
    left,
    right
  ) {
    return (
      JSON.stringify(left) ===
      JSON.stringify(right)
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
          "COS_REGRESSION_SUITE_ERROR",

        message:
          error.message ||
          "Unknown regression error",

        details:
          error.details === undefined
            ? null
            : safeClone(
                error.details
              )
      };
    }

    return {
      name: "Error",

      code:
        "COS_REGRESSION_SUITE_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown regression error",

      details:
        safeClone(error)
    };
  }

  /* =====================================================
     ASSERTIONS
  ===================================================== */

  function fail(
    message,
    details = null
  ) {
    throw new CosRegressionSuiteError(
      "COS_REGRESSION_ASSERTION_FAILED",
      message,
      {
        details
      }
    );
  }

  function assert(
    condition,
    message,
    details = null
  ) {
    if (!condition) {
      fail(message, details);
    }
  }

  function assertEqual(
    actual,
    expected,
    message
  ) {
    assert(
      actual === expected,
      message ||
        `Expected ${String(expected)} but received ${String(actual)}.`,
      {
        actual,
        expected
      }
    );
  }

  function assertNotEqual(
    actual,
    expected,
    message
  ) {
    assert(
      actual !== expected,
      message ||
        `Expected values to differ, but both were ${String(actual)}.`,
      {
        actual,
        expected
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

  function assertIncludes(
    array,
    value,
    message
  ) {
    assertArray(
      array,
      message
    );

    assert(
      array.includes(value),
      message ||
        `Expected array to include ${String(value)}.`,
      {
        array:
          safeClone(array),
        value
      }
    );
  }

  function assertKeys(
    object,
    expectedKeys,
    message
  ) {
    assertObject(
      object,
      message
    );

    const actualKeys =
      sortKeys(object);

    const expected =
      [...expectedKeys].sort();

    assert(
      arraysEqual(
        actualKeys,
        expected
      ),
      message ||
        "Object keys do not match the canonical shape.",
      {
        actualKeys,
        expectedKeys:
          expected
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

  function resolveRun(
    conversationOS
  ) {
    if (isFunction(conversationOS)) {
      return conversationOS.bind(
        conversationOS
      );
    }

    for (
      const method of [
        "run",
        "execute",
        "process"
      ]
    ) {
      if (
        conversationOS &&
        isFunction(
          conversationOS[method]
        )
      ) {
        return conversationOS[
          method
        ].bind(conversationOS);
      }
    }

    throw new CosRegressionSuiteError(
      "COS_REGRESSION_RUNTIME_MISSING",
      "Conversation Operating System does not expose a callable run method."
    );
  }

  function resolveInspect(
    conversationOS
  ) {
    for (
      const method of [
        "inspect",
        "inspectInstallation",
        "health"
      ]
    ) {
      if (
        conversationOS &&
        isFunction(
          conversationOS[method]
        )
      ) {
        return conversationOS[
          method
        ].bind(conversationOS);
      }
    }

    return null;
  }

  /* =====================================================
     TURN FACTORY
  ===================================================== */

  function createTurn({
    turnId,
    role = "user",
    text = "",
    sequence = 0,
    timestamp = null,

    threadId = null,
    placementType = null,

    parentTurnId = null,
    replyToTurnId = null,

    sourceTurnIds = [],
    referenceTurnIds = [],

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
        timestamp || nowIso(),

      ...(threadId
        ? {
            threadId
          }
        : {}),

      ...(placementType
        ? {
            placementType
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

      ...(sourceTurnIds.length > 0
        ? {
            sourceTurnIds:
              [...sourceTurnIds]
          }
        : {}),

      ...(referenceTurnIds.length > 0
        ? {
            referenceTurnIds:
              [...referenceTurnIds]
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

  function appendAppliedTurn(
    history,
    originalTurn,
    packet
  ) {
    return [
      ...history,

      {
        ...safeClone(
          originalTurn
        ),

        threadId:
          packet.placement.threadId,

        parentTurnId:
          packet.placement
            .parentTurnId,

        sourceTurnIds:
          [
            ...packet.placement
              .sourceTurnIds
          ]
      }
    ];
  }

  /* =====================================================
     RESULT ASSERTIONS
  ===================================================== */

  function assertSuccess(result) {
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
      "Successful COS result requires packet."
    );

    assertObject(
      result.state,
      "Successful COS result requires state."
    );
  }

  function assertFailure(result) {
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

    assert(
      result.errors.length > 0,
      "COS failure should contain at least one error."
    );
  }

  function assertCanonicalPacket(packet) {
    assertKeys(
      packet,
      EXPECTED_PACKET_KEYS,
      "Packet top-level shape changed."
    );

    assertEqual(
      packet.schemaVersion,
      SCHEMA_VERSION,
      "Packet schema version changed."
    );

    assertEqual(
      packet.packetType,
      PACKET_TYPE,
      "Packet type changed."
    );

    assertEqual(
      packet.authority,
      AUTHORITY,
      "Packet authority changed."
    );

    assertKeys(
      packet.currentTurn,
      EXPECTED_CURRENT_TURN_KEYS,
      "Current-turn packet shape changed."
    );

    assertKeys(
      packet.placement,
      EXPECTED_PLACEMENT_KEYS,
      "Placement packet shape changed."
    );

    assertKeys(
      packet.referenceResolution,
      EXPECTED_REFERENCE_KEYS,
      "Reference packet shape changed."
    );

    const forbiddenKeys = [
      "intent",
      "meaning",
      "semanticMeaning",
      "conversationFunction",
      "emotion",
      "safety",
      "responsePlan",
      "confidence",
      "score",
      "candidates",
      "diagnostics",
      "timing",
      "reasoning"
    ];

    for (
      const forbiddenKey of
        forbiddenKeys
    ) {
      assert(
        !Object.prototype
          .hasOwnProperty.call(
            packet,
            forbiddenKey
          ),
        `Packet leaked forbidden field: ${forbiddenKey}`
      );
    }
  }

  /* =====================================================
     TEST CONTEXT
  ===================================================== */

  function createTestContext({
    conversationId,
    runCos,
    runtimeOptions
  }) {
    return {
      conversationId,
      runCos,
      runtimeOptions,

      history: [],
      state: null,

      packets: [],
      results: [],

      turns: {},
      threads: {},

      async executeTurn(turn) {
        const result =
          await runCos(
            {
              conversationId:
                this.conversationId,

              currentTurn:
                turn,

              history:
                this.history,

              state:
                this.state
            },
            this.runtimeOptions
          );

        this.results.push(
          result
        );

        if (result.ok === true) {
          this.packets.push(
            result.packet
          );

          this.state =
            result.state;

          this.history =
            appendAppliedTurn(
              this.history,
              turn,
              result.packet
            );

          this.turns[
            turn.turnId
          ] = {
            input:
              safeClone(turn),

            packet:
              result.packet,

            state:
              result.state
          };

          const threadId =
            result.packet
              .placement.threadId;

          if (threadId) {
            this.threads[
              threadId
            ] = true;
          }
        }

        return result;
      }
    };
  }

  /* =====================================================
     TEST EXECUTOR
  ===================================================== */

  async function executeTest(
    group,
    name,
    handler
  ) {
    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    try {
      const details =
        await handler();

      return {
        group,
        name,

        passed: true,
        status: "passed",

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
            : safeClone(
                details
              ),

        error: null
      };
    } catch (error) {
      return {
        group,
        name,

        passed: false,
        status: "failed",

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
     REGRESSION SUITE
  ===================================================== */

  async function run(
    options = {}
  ) {
    const suiteStartedAt =
      nowIso();

    const suiteStartedAtMs =
      nowMs();

    const conversationOS =
      resolveConversationOS(
        options.conversationOS
      );

    assert(
      conversationOS,
      "Conversation Operating System is not installed."
    );

    const runCos =
      resolveRun(
        conversationOS
      );

    const inspect =
      resolveInspect(
        conversationOS
      );

    const runtimeOptions = {
      strictInstallation:
        options.strictInstallation !==
          false,

      throwOnFailure: false,

      freezeResult:
        false,

      ...(isObject(
        options.runtimeOptions
      )
        ? safeClone(
            options.runtimeOptions
          )
        : {})
    };

    const context =
      createTestContext({
        conversationId:
          options.conversationId ||
          createId(
            "cos_regression"
          ),

        runCos,

        runtimeOptions
      });

    const tests = [];

    const IDs = Object.freeze({
      rootUser:
        "regression_root_user",

      rootAssistant:
        "regression_root_assistant",

      continuation:
        "regression_continuation",

      answer:
        "regression_answer",

      clarification:
        "regression_clarification",

      correction:
        "regression_correction",

      branch:
        "regression_branch",

      branchReply:
        "regression_branch_reply",

      interruption:
        "regression_interruption",

      interruptionReply:
        "regression_interruption_reply",

      returnTurn:
        "regression_return",

      resumeTurn:
        "regression_resume",

      unresolved:
        "regression_unresolved",

      partial:
        "regression_partial",

      duplicate:
        "regression_duplicate",

      unknownOne:
        "regression_unknown_one",

      unknownTwo:
        "regression_unknown_two"
    });

    let rootThreadId = null;
    let branchThreadId = null;
    let interruptionThreadId = null;

    /* ===================================================
       INSTALLATION
    =================================================== */

    tests.push(
      await executeTest(
        "installation",
        "complete installation reports ready",
        async () => {
          assert(
            inspect,
            "COS inspection API is unavailable."
          );

          const inspection =
            await inspect();

          const ready =
            typeof inspection.ready ===
              "boolean"
              ? inspection.ready
              : inspection.ok;

          assertEqual(
            ready,
            true,
            "COS installation must be ready."
          );

          return inspection;
        }
      )
    );

    /* ===================================================
       NEW CONVERSATION
    =================================================== */

    tests.push(
      await executeTest(
        "placement",
        "first turn creates new thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.rootUser,

              text:
                "Initial user turn.",

              sequence: 0
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);
          assertCanonicalPacket(
            result.packet
          );

          assertEqual(
            result.packet
              .placement.type,
            "new_thread",
            "First turn must create a thread."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            null,
            "New thread must not have a parent."
          );

          assertEqual(
            result.packet
              .referenceResolution
              .status,
            "not_required",
            "First turn should not require references."
          );

          rootThreadId =
            result.packet
              .placement.threadId;

          assert(
            isNonEmptyString(
              rootThreadId
            ),
            "New thread ID is required."
          );

          return {
            rootThreadId
          };
        }
      )
    );

    /* ===================================================
       CONTINUATION
    =================================================== */

    tests.push(
      await executeTest(
        "placement",
        "active conversation continues active thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.rootAssistant,

              role:
                "assistant",

              text:
                "Initial assistant turn.",

              sequence: 1
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "continue_thread",
            "Active conversation should continue."
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId,
            "Continuation changed threads."
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "placement",
        "second continuation remains on root thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.continuation,

              text:
                "Continue structurally.",

              sequence: 2
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "continue_thread"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       ANSWER
    =================================================== */

    tests.push(
      await executeTest(
        "references",
        "answer target resolves exact source",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.answer,

              text: "Yes.",

              sequence: 3,

              answerTargetTurnId:
                IDs.rootAssistant
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "answer_to_turn"
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.rootAssistant
          );

          assertIncludes(
            result.packet
              .referenceResolution
              .resolvedTurnIds,
            IDs.rootAssistant
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       CLARIFICATION
    =================================================== */

    tests.push(
      await executeTest(
        "references",
        "clarification binds to exact target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.clarification,

              text:
                "Clarifying the prior user turn.",

              sequence: 4,

              clarificationTargetTurnId:
                IDs.continuation
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "clarification_of_turn"
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.continuation
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       CORRECTION
    =================================================== */

    tests.push(
      await executeTest(
        "references",
        "correction binds to exact target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.correction,

              text:
                "Correcting the clarification.",

              sequence: 5,

              correctionTargetTurnId:
                IDs.clarification
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "correction_of_turn"
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.clarification
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       BRANCH
    =================================================== */

    tests.push(
      await executeTest(
        "threads",
        "branch creates distinct thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.branch,

              text:
                "Create an explicit branch.",

              sequence: 6,

              branchOriginTurnId:
                IDs.continuation
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "branch_from_turn"
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.continuation
          );

          branchThreadId =
            result.packet
              .placement.threadId;

          assertNotEqual(
            branchThreadId,
            rootThreadId,
            "Branch reused root thread."
          );

          assertEqual(
            result.state.activeThreadId,
            branchThreadId
          );

          return {
            rootThreadId,
            branchThreadId
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "threads",
        "branch continuation remains on branch",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.branchReply,

              role:
                "assistant",

              text:
                "Continue the branch.",

              sequence: 7
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "continue_thread"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            branchThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       INTERRUPTION
    =================================================== */

    tests.push(
      await executeTest(
        "threads",
        "interruption creates separate active thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.interruption,

              text:
                "Create an interruption.",

              sequence: 8,

              placementType:
                "interruption",

              interruptionOriginTurnId:
                IDs.branchReply
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "interruption"
          );

          interruptionThreadId =
            result.packet
              .placement.threadId;

          assertNotEqual(
            interruptionThreadId,
            branchThreadId,
            "Interruption reused interrupted thread."
          );

          assertEqual(
            result.state.activeThreadId,
            interruptionThreadId
          );

          assert(
            result.state
              .interruptionStack
              .length > 0,
            "Interruption stack was not updated."
          );

          const lastEntry =
            result.state
              .interruptionStack[
                result.state
                  .interruptionStack
                  .length - 1
              ];

          assertEqual(
            lastEntry
              .interruptedThreadId,
            branchThreadId
          );

          assertEqual(
            lastEntry
              .interruptionThreadId,
            interruptionThreadId
          );

          return {
            branchThreadId,
            interruptionThreadId
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "threads",
        "interruption thread can continue",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.interruptionReply,

              role:
                "assistant",

              text:
                "Continue interruption.",

              sequence: 9
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "continue_thread"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            interruptionThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       RETURN
    =================================================== */

    tests.push(
      await executeTest(
        "threads",
        "return from interruption restores branch",
        async () => {
          const stackBefore =
            context.state
              .interruptionStack
              .length;

          const turn =
            createTurn({
              turnId:
                IDs.returnTurn,

              text:
                "Return structurally.",

              sequence: 10,

              placementType:
                "return_from_interruption",

              threadId:
                branchThreadId,

              resumeTargetTurnId:
                IDs.branchReply
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "return_from_interruption"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            branchThreadId
          );

          assertEqual(
            result.state.activeThreadId,
            branchThreadId
          );

          assert(
            result.state
              .interruptionStack
              .length <
              stackBefore,
            "Return did not pop interruption."
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       RESUME
    =================================================== */

    tests.push(
      await executeTest(
        "threads",
        "explicit resume returns to root thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.resumeTurn,

              text:
                "Resume root structurally.",

              sequence: 11,

              placementType:
                "resume_thread",

              threadId:
                rootThreadId,

              resumeTargetTurnId:
                IDs.correction
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "resume_thread"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            rootThreadId
          );

          assertEqual(
            result.state.activeThreadId,
            rootThreadId
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       UNRESOLVED
    =================================================== */

    tests.push(
      await executeTest(
        "failure handling",
        "unknown explicit reference remains unresolved",
        async () => {
          const activeThreadBefore =
            context.state.activeThreadId;

          const activeTurnBefore =
            context.state.activeTurnId;

          const turn =
            createTurn({
              turnId:
                IDs.unresolved,

              text:
                "Reference an unknown turn.",

              sequence: 12,

              replyToTurnId:
                IDs.unknownOne
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .referenceResolution
              .status,
            "unresolved"
          );

          assertEqual(
            result.packet
              .placement.type,
            "unresolved_placement"
          );

          assertEqual(
            result.packet
              .placement.threadId,
            null
          );

          assertEqual(
            result.state.activeThreadId,
            activeThreadBefore,
            "Unresolved placement changed active thread."
          );

          assertEqual(
            result.state.activeTurnId,
            activeTurnBefore,
            "Unresolved placement changed active turn."
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "failure handling",
        "mixed known and unknown references remain partially resolved",
        async () => {
          const activeThreadBefore =
            context.state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.partial,

              text:
                "Reference one known and one unknown turn.",

              sequence: 13,

              referenceTurnIds: [
                IDs.rootAssistant,
                IDs.unknownTwo
              ]
            });

          const result =
            await context.executeTurn(
              turn
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .referenceResolution
              .status,
            "partially_resolved"
          );

          assertIncludes(
            result.packet
              .referenceResolution
              .resolvedTurnIds,
            IDs.rootAssistant
          );

          assertEqual(
            result.packet
              .placement.type,
            "unresolved_placement"
          );

          assertEqual(
            result.state.activeThreadId,
            activeThreadBefore
          );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    /* ===================================================
       DUPLICATE TURN
    =================================================== */

    tests.push(
      await executeTest(
        "identity",
        "duplicate turn ID is rejected",
        async () => {
          const stateBefore =
            safeClone(
              context.state
            );

          const historyLengthBefore =
            context.history.length;

          const turn =
            createTurn({
              turnId:
                IDs.rootUser,

              text:
                "Duplicate ID.",

              sequence: 14
            });

          const result =
            await runCos(
              {
                conversationId:
                  context.conversationId,

                currentTurn:
                  turn,

                history:
                  context.history,

                state:
                  context.state
              },
              runtimeOptions
            );

          assertFailure(result);

          assertEqual(
            context.history.length,
            historyLengthBefore,
            "Failed duplicate test mutated test history."
          );

          assertEqual(
            JSON.stringify(
              context.state
            ),
            JSON.stringify(
              stateBefore
            ),
            "Failed duplicate test mutated retained state."
          );

          return {
            errors:
              result.errors
          };
        }
      )
    );

    /* ===================================================
       THREAD MEMBERSHIP
    =================================================== */

    tests.push(
      await executeTest(
        "state",
        "thread records preserve turn membership",
        async () => {
          const state =
            context.state;

          assertObject(
            state.threads[
              rootThreadId
            ]
          );

          assertObject(
            state.threads[
              branchThreadId
            ]
          );

          assertObject(
            state.threads[
              interruptionThreadId
            ]
          );

          assertIncludes(
            state.threads[
              rootThreadId
            ].turnIds,
            IDs.rootUser
          );

          assertIncludes(
            state.threads[
              branchThreadId
            ].turnIds,
            IDs.branch
          );

          assertIncludes(
            state.threads[
              interruptionThreadId
            ].turnIds,
            IDs.interruption
          );

          return {
            rootTurnCount:
              state.threads[
                rootThreadId
              ].turnIds.length,

            branchTurnCount:
              state.threads[
                branchThreadId
              ].turnIds.length,

            interruptionTurnCount:
              state.threads[
                interruptionThreadId
              ].turnIds.length
          };
        }
      )
    );

    /* ===================================================
       PARENT PRESERVATION
    =================================================== */

    tests.push(
      await executeTest(
        "state",
        "state preserves authoritative parent relationships",
        async () => {
          const state =
            context.state;

          assertEqual(
            state.turns[
              IDs.answer
            ].parentTurnId,
            IDs.rootAssistant
          );

          assertEqual(
            state.turns[
              IDs.clarification
            ].parentTurnId,
            IDs.continuation
          );

          assertEqual(
            state.turns[
              IDs.correction
            ].parentTurnId,
            IDs.clarification
          );

          assertEqual(
            state.turns[
              IDs.branch
            ].parentTurnId,
            IDs.continuation
          );

          return {
            verifiedTurnIds: [
              IDs.answer,
              IDs.clarification,
              IDs.correction,
              IDs.branch
            ]
          };
        }
      )
    );

    /* ===================================================
       PACKET AUTHORITY
    =================================================== */

    tests.push(
      await executeTest(
        "authority",
        "all successful packets preserve canonical lean shape",
        async () => {
          assert(
            context.packets.length > 0,
            "No packets were produced."
          );

          for (
            const packet of
              context.packets
          ) {
            assertCanonicalPacket(
              packet
            );
          }

          return {
            packetCount:
              context.packets.length
          };
        }
      )
    );

    /* ===================================================
       PACKET IMMUTABILITY
    =================================================== */

    tests.push(
      await executeTest(
        "immutability",
        "authoritative packets are frozen",
        async () => {
          const packet =
            context.packets[0];

          assert(
            Object.isFrozen(packet),
            "Packet root should be frozen."
          );

          assert(
            Object.isFrozen(
              packet.currentTurn
            ),
            "Current-turn section should be frozen."
          );

          assert(
            Object.isFrozen(
              packet.placement
            ),
            "Placement section should be frozen."
          );

          assert(
            Object.isFrozen(
              packet.referenceResolution
            ),
            "Reference section should be frozen."
          );

          return {
            frozen: true
          };
        }
      )
    );

    /* ===================================================
       INPUT IMMUTABILITY
    =================================================== */

    tests.push(
      await executeTest(
        "immutability",
        "runtime does not mutate supplied input history",
        async () => {
          const isolatedConversationId =
            createId(
              "cos_input_immutability"
            );

          const history = [
            createTurn({
              turnId:
                "immutability_history_1",

              text:
                "Stored turn.",

              sequence: 0,

              threadId:
                "immutability_thread"
            })
          ];

          const original =
            JSON.stringify(history);

          await runCos(
            {
              conversationId:
                isolatedConversationId,

              currentTurn:
                createTurn({
                  turnId:
                    "immutability_current_1",

                  text:
                    "Current turn.",

                  sequence: 1,

                  threadId:
                    "immutability_thread",

                  placementType:
                    "continue_thread"
                }),

              history,

              state: {
                schemaVersion:
                  SCHEMA_VERSION,

                authority:
                  AUTHORITY,

                conversationId:
                  isolatedConversationId,

                revision: 1,

                activeThreadId:
                  "immutability_thread",

                activeTurnId:
                  "immutability_history_1",

                threads: {
                  immutability_thread: {
                    threadId:
                      "immutability_thread",

                    status: "active",

                    turnIds: [
                      "immutability_history_1"
                    ],

                    firstTurnId:
                      "immutability_history_1",

                    lastTurnId:
                      "immutability_history_1"
                  }
                },

                turns: {
                  immutability_history_1: {
                    turnId:
                      "immutability_history_1",

                    threadId:
                      "immutability_thread",

                    role: "user",

                    sequence: 0
                  }
                },

                threadStack: [
                  "immutability_thread"
                ],

                interruptionStack: []
              }
            },
            runtimeOptions
          );

          assertEqual(
            JSON.stringify(history),
            original,
            "COS mutated supplied history."
          );

          return {
            unchanged: true
          };
        }
      )
    );

    /* ===================================================
       REVISION
    =================================================== */

    tests.push(
      await executeTest(
        "state",
        "state revision progresses monotonically",
        async () => {
          const successfulStates =
            context.results
              .filter(
                (result) =>
                  result &&
                  result.ok === true &&
                  result.state
              )
              .map(
                (result) =>
                  result.state.revision
              );

          assert(
            successfulStates.length > 1,
            "Insufficient states for revision test."
          );

          for (
            let index = 1;
            index <
            successfulStates.length;
            index += 1
          ) {
            assert(
              successfulStates[index] >
                successfulStates[
                  index - 1
                ],
              "State revision did not increase.",
              {
                previous:
                  successfulStates[
                    index - 1
                  ],

                current:
                  successfulStates[
                    index
                  ]
              }
            );
          }

          return {
            revisions:
              successfulStates
          };
        }
      )
    );

    /* ===================================================
       EXECUTION ISOLATION
    =================================================== */

    tests.push(
      await executeTest(
        "isolation",
        "separate conversations receive separate state",
        async () => {
          const conversationA =
            createId(
              "conversation_a"
            );

          const conversationB =
            createId(
              "conversation_b"
            );

          const resultA =
            await runCos(
              {
                conversationId:
                  conversationA,

                currentTurn:
                  createTurn({
                    turnId:
                      "isolation_a_1",

                    text:
                      "Conversation A.",

                    sequence: 0
                  }),

                history: [],
                state: null
              },
              runtimeOptions
            );

          const resultB =
            await runCos(
              {
                conversationId:
                  conversationB,

                currentTurn:
                  createTurn({
                    turnId:
                      "isolation_b_1",

                    text:
                      "Conversation B.",

                    sequence: 0
                  }),

                history: [],
                state: null
              },
              runtimeOptions
            );

          assertSuccess(resultA);
          assertSuccess(resultB);

          assertNotEqual(
            resultA.packet
              .conversationId,
            resultB.packet
              .conversationId
          );

          assertNotEqual(
            resultA.packet
              .placement.threadId,
            resultB.packet
              .placement.threadId
          );

          return {
            conversationA:
              resultA.packet
                .conversationId,

            conversationB:
              resultB.packet
                .conversationId
          };
        }
      )
    );

    /* ===================================================
       FINAL RESULT
    =================================================== */

    const passedCount =
      tests.filter(
        (test) => test.passed
      ).length;

    const failedCount =
      tests.length -
      passedCount;

    const groupSummary = {};

    for (const test of tests) {
      groupSummary[test.group] =
        groupSummary[test.group] || {
          testCount: 0,
          passedCount: 0,
          failedCount: 0
        };

      groupSummary[
        test.group
      ].testCount += 1;

      if (test.passed) {
        groupSummary[
          test.group
        ].passedCount += 1;
      } else {
        groupSummary[
          test.group
        ].failedCount += 1;
      }
    }

    const result = {
      schemaVersion:
        SCHEMA_VERSION,

      authority:
        AUTHORITY,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      ok:
        failedCount === 0,

      status:
        failedCount === 0
          ? "passed"
          : "failed",

      conversationId:
        context.conversationId,

      startedAt:
        suiteStartedAt,

      completedAt:
        nowIso(),

      durationMs:
        elapsedMs(
          suiteStartedAtMs
        ),

      testCount:
        tests.length,

      passedCount,

      failedCount,

      groupSummary,

      tests,

      finalState:
        options.includeFinalState ===
          true
          ? safeClone(
              context.state
            )
          : null,

      finalHistory:
        options.includeFinalHistory ===
          true
          ? safeClone(
              context.history
            )
          : null,

      packets:
        options.includePackets ===
          true
          ? safeClone(
              context.packets
            )
          : null
    };

    if (
      options.log !== false &&
      typeof console !== "undefined"
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
          tests.map(
            (test) => ({
              Group:
                test.group,

              Test:
                test.name,

              Status:
                test.status,

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

    return result;
  }

  /* =====================================================
     ASSERT ALL
  ===================================================== */

  async function assertAll(
    options = {}
  ) {
    const result =
      await run(options);

    if (!result.ok) {
      throw new CosRegressionSuiteError(
        "COS_REGRESSION_SUITE_FAILED",
        `${result.failedCount} COS regression test(s) failed.`,
        {
          details:
            result
        }
      );
    }

    return result;
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

    CosRegressionSuiteError,

    run,

    execute:
      run,

    test:
      run,

    assertAll
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