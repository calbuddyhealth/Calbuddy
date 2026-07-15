// rebirth/conversation-os/testing/cos-smoke-test.js
// ARI Rebirth — Conversation Operating System Smoke Test
//
// Purpose:
// Run a compact deterministic validation suite against the installed
// Conversation Operating System.
//
// V1.0.0 — Canonical COS Installation and Runtime Smoke Test
//
// Test coverage:
//
// - COS installation readiness
// - empty-conversation placement
// - active-thread continuation
// - explicit reply-to-turn resolution
// - explicit answer-target placement
// - explicit clarification-target placement
// - explicit correction-target placement
// - explicit branch placement
// - explicit interruption placement
// - return-from-interruption placement
// - unknown-reference rejection
// - duplicate-turn rejection
// - authoritative packet shape
// - state persistence across turns
// - authority-boundary preservation
//
// Non-responsibility:
//
// This test file must not:
//
// - modify production COS authority rules,
// - provide semantic interpretation,
// - guess references,
// - repair failed placements,
// - alter production state outside test execution.
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
    "cos-smoke-test";

  const PACKET_TYPE =
    "authoritative_conversation_placement_packet";

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class CosSmokeTestError extends Error {
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
        "COS smoke test error"
      );

      this.name =
        "CosSmokeTestError";

      this.code =
        code ||
        "COS_SMOKE_TEST_ERROR";

      this.details = details;
      this.cause = cause;

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
    const elapsed =
      nowMs() - startedAtMs;

    return Number.isFinite(elapsed)
      ? Math.max(
          0,
          Math.round(elapsed * 1000) / 1000
        )
      : 0;
  }

  function createId(prefix = "test") {
    const time =
      Date.now().toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

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
          ) || "COS_SMOKE_TEST_ERROR",

        message:
          error.message ||
          "Unknown smoke test error",

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
        "COS_SMOKE_TEST_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown smoke test error",

      details:
        safeClone(error)
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
        `Expected ${String(expected)} but received ${String(actual)}.`,
      {
        actual,
        expected
      }
    );
  }

  function assertArrayIncludes(
    array,
    expected,
    message
  ) {
    assert(
      Array.isArray(array),
      message ||
        "Expected an array.",
      {
        actual:
          safeClone(array)
      }
    );

    assert(
      array.includes(expected),
      message ||
        `Expected array to include ${String(expected)}.`,
      {
        actual:
          safeClone(array),
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

  function resolveRun(conversationOS) {
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

    throw new CosSmokeTestError(
      "COS_SMOKE_RUNTIME_UNAVAILABLE",
      "Conversation Operating System does not expose a callable run method."
    );
  }

  function resolveInspect(conversationOS) {
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
     TEST DATA HELPERS
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
      packet.placement
        ? packet.placement
        : {};

    return [
      ...history,

      {
        ...safeClone(turn),

        threadId:
          firstNonEmptyString(
            placement.threadId,
            turn.threadId
          ) || null,

        parentTurnId:
          firstNonEmptyString(
            placement.parentTurnId,
            turn.parentTurnId
          ) || null,

        sourceTurnIds:
          Array.isArray(
            placement.sourceTurnIds
          )
            ? [
                ...placement
                  .sourceTurnIds
              ]
            : Array.isArray(
                turn.sourceTurnIds
              )
              ? [
                  ...turn.sourceTurnIds
                ]
              : []
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
      "Successful COS result requires a packet."
    );

    assertObject(
      result.state,
      "Successful COS result requires state."
    );
  }

  function assertPacketShape(packet) {
    assertObject(
      packet,
      "Packet must be an object."
    );

    assertEqual(
      packet.schemaVersion,
      SCHEMA_VERSION,
      "Packet schema version mismatch."
    );

    assertEqual(
      packet.packetType,
      PACKET_TYPE,
      "Packet type mismatch."
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

    const topLevelKeys =
      Object.keys(packet).sort();

    const expectedKeys = [
      "authority",
      "conversationId",
      "currentTurn",
      "packetType",
      "placement",
      "referenceResolution",
      "requestId",
      "schemaVersion"
    ].sort();

    assertEqual(
      JSON.stringify(topLevelKeys),
      JSON.stringify(expectedKeys),
      "Packet contains unexpected top-level fields."
    );

    assert(
      !Object.prototype.hasOwnProperty.call(
        packet,
        "diagnostics"
      ),
      "Authoritative packet must not expose diagnostics."
    );

    assert(
      !Object.prototype.hasOwnProperty.call(
        packet,
        "confidence"
      ),
      "Authoritative packet must not expose confidence scores."
    );

    assert(
      !Object.prototype.hasOwnProperty.call(
        packet,
        "candidates"
      ),
      "Authoritative packet must not expose candidates."
    );
  }

  /* =====================================================
     TEST RUNNER
  ===================================================== */

  async function executeTest(
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
            : safeClone(details),

        error: null
      };
    } catch (error) {
      return {
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
      createId("cos_smoke_conversation");

    const runtimeOptions = {
      strictInstallation:
        options.strictInstallation !==
          false,

      throwOnFailure:
        false,

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

    let state = null;
    let history = [];

    const IDs = Object.freeze({
      userOne: "smoke_turn_user_1",
      assistantOne:
        "smoke_turn_assistant_1",
      userTwo: "smoke_turn_user_2",
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
      unknownTarget:
        "smoke_turn_missing_target",
      duplicate:
        "smoke_turn_duplicate"
    });

    const tests = [];

    tests.push(
      await executeTest(
        "installation readiness",
        async () => {
          assert(
            inspect,
            "COS installation inspection is unavailable."
          );

          const inspection =
            await inspect();

          const ready =
            typeof inspection.ok ===
              "boolean"
              ? inspection.ok
              : inspection.ready;

          assertEqual(
            ready,
            true,
            "COS installation should report ready."
          );

          return inspection;
        }
      )
    );

    tests.push(
      await executeTest(
        "empty conversation creates new thread",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userOne,

              role: "user",

              text:
                "Hello, Ari.",

              sequence: 0
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);
          assertPacketShape(
            result.packet
          );

          assertEqual(
            result.packet
              .placement.type,
            "new_thread",
            "First turn should create a new thread."
          );

          assert(
            isNonEmptyString(
              result.packet
                .placement.threadId
            ),
            "New-thread placement requires a thread ID."
          );

          assertEqual(
            result.packet
              .referenceResolution
              .status,
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

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "state preserves active thread",
        async () => {
          assert(
            state,
            "State should exist after first turn."
          );

          const threadId =
            state.activeThreadId;

          assert(
            isNonEmptyString(
              threadId
            ),
            "State should contain an active thread."
          );

          assertEqual(
            state.activeTurnId,
            IDs.userOne,
            "First turn should be active."
          );

          assertObject(
            state.threads[
              threadId
            ],
            "Active thread record should exist."
          );

          assertObject(
            state.turns[
              IDs.userOne
            ],
            "First turn state record should exist."
          );

          return {
            activeThreadId:
              threadId,

            activeTurnId:
              state.activeTurnId
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "active thread continuation",
        async () => {
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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "continue_thread",
            "Second turn should continue the active thread."
          );

          assertEqual(
            result.packet
              .placement.threadId,
            state.activeThreadId,
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

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "explicit reply reference",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userTwo,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .referenceResolution
              .status,
            "resolved",
            "Explicit reply target should resolve."
          );

          assertArrayIncludes(
            result.packet
              .referenceResolution
              .resolvedTurnIds,
            IDs.assistantOne,
            "Resolved turn IDs should include reply target."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.assistantOne,
            "Reply target should become structural parent."
          );

          assertEqual(
            result.packet
              .placement.type,
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

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "explicit answer target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userAnswer,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "answer_to_turn",
            "Answer target should produce answer_to_turn."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.assistantOne,
            "Answer target should become parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
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
        "explicit clarification target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userClarification,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "clarification_of_turn",
            "Clarification target should produce clarification_of_turn."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.userTwo,
            "Clarification target should become parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
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
        "explicit correction target",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userCorrection,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "correction_of_turn",
            "Correction target should produce correction_of_turn."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.userClarification,
            "Correction target should become parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          return {
            packet:
              result.packet
          };
        }
      )
    );

    let preBranchThreadId = null;
    let branchThreadId = null;

    tests.push(
      await executeTest(
        "explicit branch creates distinct thread",
        async () => {
          preBranchThreadId =
            state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.userBranch,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "branch_from_turn",
            "Branch origin should produce branch_from_turn."
          );

          branchThreadId =
            result.packet
              .placement.threadId;

          assert(
            isNonEmptyString(
              branchThreadId
            ),
            "Branch placement requires a new thread ID."
          );

          assert(
            branchThreadId !==
              preBranchThreadId,
            "Branch thread must differ from origin thread."
          );

          assertEqual(
            result.packet
              .placement.parentTurnId,
            IDs.userTwo,
            "Branch origin should become parent turn."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          return {
            originThreadId:
              preBranchThreadId,

            branchThreadId
          };
        }
      )
    );

    let interruptionThreadId = null;

    tests.push(
      await executeTest(
        "explicit interruption creates interruption stack entry",
        async () => {
          const interruptedThreadId =
            state.activeThreadId;

          const turn =
            createTurn({
              turnId:
                IDs.userInterruption,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "interruption",
            "Explicit interruption should remain interruption."
          );

          interruptionThreadId =
            result.packet
              .placement.threadId;

          assert(
            interruptionThreadId !==
              interruptedThreadId,
            "Interruption should create a distinct thread."
          );

          assert(
            Array.isArray(
              result.state
                .interruptionStack
            ),
            "State requires interruptionStack."
          );

          assert(
            result.state
              .interruptionStack
              .length > 0,
            "Interruption should push an interruption record."
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
            interruptedThreadId,
            "Interruption record should preserve interrupted thread."
          );

          assertEqual(
            lastEntry
              .interruptionThreadId,
            interruptionThreadId,
            "Interruption record should preserve interruption thread."
          );

          state =
            result.state;

          history =
            appendHistory(
              history,
              turn,
              result.packet
            );

          return {
            interruptedThreadId,
            interruptionThreadId
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "return from interruption restores prior thread",
        async () => {
          const stackBefore =
            state.interruptionStack.length;

          const turn =
            createTurn({
              turnId:
                IDs.userReturn,

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .placement.type,
            "return_from_interruption",
            "Return placement should remain return_from_interruption."
          );

          assertEqual(
            result.packet
              .placement.threadId,
            branchThreadId,
            "Return should restore the interrupted branch thread."
          );

          assertEqual(
            result.state.activeThreadId,
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

          return {
            packet:
              result.packet
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "unknown structural reference remains unresolved",
        async () => {
          const turn =
            createTurn({
              turnId:
                "smoke_turn_unknown_reference",

              role: "user",

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
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertSuccess(result);

          assertEqual(
            result.packet
              .referenceResolution
              .status,
            "unresolved",
            "Unknown turn reference should remain unresolved."
          );

          assertEqual(
            result.packet
              .placement.type,
            "unresolved_placement",
            "Unresolved reference should produce unresolved placement."
          );

          assertEqual(
            result.packet
              .placement.threadId,
            null,
            "Unresolved placement must not claim a thread."
          );

          assert(
            result.state.activeTurnId !==
              turn.turnId,
            "Unresolved turn must not become the active structural turn."
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
        "duplicate current-turn ID is rejected",
        async () => {
          const turn =
            createTurn({
              turnId:
                IDs.userOne,

              role: "user",

              text:
                "This ID already exists.",

              sequence: 10
            });

          const result =
            await execute(
              {
                conversationId,
                currentTurn: turn,
                history,
                state
              },
              runtimeOptions
            );

          assertObject(
            result,
            "Duplicate-ID execution should return a structured result."
          );

          assertEqual(
            result.ok,
            false,
            "Duplicate turn ID should fail."
          );

          assert(
            Array.isArray(
              result.errors
            ) &&
              result.errors.length > 0,
            "Duplicate-ID failure should expose structured errors."
          );

          return {
            errors:
              result.errors
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "authoritative packet excludes semantic authority",
        async () => {
          const packet =
            state.lastPlacement
              ? null
              : null;

          const validPackets =
            tests
              .filter(
                (test) =>
                  test.passed &&
                  test.details &&
                  test.details.packet
              )
              .map(
                (test) =>
                  test.details.packet
              );

          assert(
            validPackets.length > 0,
            "At least one successful packet is required."
          );

          for (
            const authoritativePacket of
              validPackets
          ) {
            assertPacketShape(
              authoritativePacket
            );

            assert(
              !Object.prototype.hasOwnProperty.call(
                authoritativePacket,
                "semanticMeaning"
              ),
              "COS packet must not contain semantic meaning."
            );

            assert(
              !Object.prototype.hasOwnProperty.call(
                authoritativePacket,
                "intent"
              ),
              "COS packet must not contain intent."
            );

            assert(
              !Object.prototype.hasOwnProperty.call(
                authoritativePacket,
                "emotion"
              ),
              "COS packet must not contain emotion."
            );

            assert(
              !Object.prototype.hasOwnProperty.call(
                authoritativePacket,
                "safety"
              ),
              "COS packet must not contain safety classification."
            );

            assert(
              !Object.prototype.hasOwnProperty.call(
                authoritativePacket,
                "responsePlan"
              ),
              "COS packet must not contain response planning."
            );
          }

          return {
            packetCount:
              validPackets.length
          };
        }
      )
    );

    tests.push(
      await executeTest(
        "state revision advances across applied turns",
        async () => {
          assert(
            Number.isInteger(
              state.revision
            ),
            "State revision must be an integer."
          );

          assert(
            state.revision > 0,
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

          assert(
            Object.keys(
              state.turns
            ).length >= 8,
            "State should preserve applied smoke-test turns."
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

    const passedCount =
      tests.filter(
        (test) => test.passed
      ).length;

    const failedCount =
      tests.length - passedCount;

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

      conversationId,

      startedAt,

      completedAt:
        nowIso(),

      durationMs:
        elapsedMs(
          startedAtMs
        ),

      testCount:
        tests.length,

      passedCount,

      failedCount,

      tests,

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
              Test: test.name,
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
      await run({
        ...options,
        log:
          options.log !== false
      });

    if (!result.ok) {
      throw new CosSmokeTestError(
        "COS_SMOKE_TEST_FAILED",
        `${result.failedCount} Conversation OS smoke test(s) failed.`,
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

  const cosSmokeTest = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    authority:
      AUTHORITY,

    component:
      COMPONENT_NAME,

    CosSmokeTestError,

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