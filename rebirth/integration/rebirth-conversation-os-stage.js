// rebirth/integration/rebirth-conversation-os-stage.js
// ARI Rebirth — Conversation Operating System Integration Stage
//
// Purpose:
// Execute the Conversation Operating System as an early Rebirth runtime stage
// and attach its authoritative conversation-placement output to runtime state.
//
// V1.0.0 — Canonical COS-to-Rebirth Integration
//
// Canonical flow:
//
// Rebirth Runtime State
//      ↓
// Conversation OS Input Projection
//      ↓
// Conversation OS Execution
//      ↓
// COS Result Validation
//      ↓
// Authoritative Placement Packet Attachment
//      ↓
// COS State Persistence
//      ↓
// Updated Rebirth Runtime State
//
// Authority:
//
// This stage is authoritative only for:
//
// - projecting Rebirth runtime data into COS input,
// - invoking the installed Conversation Operating System,
// - preserving the COS runtime result,
// - attaching the authoritative COS placement packet,
// - persisting the next COS state,
// - exposing COS execution status to later Rebirth stages.
//
// Non-authority:
//
// This stage must not:
//
// - interpret the user's language,
// - infer semantic meaning,
// - classify intent,
// - classify conversation function,
// - infer emotion,
// - infer safety severity,
// - resolve references independently,
// - determine placement independently,
// - alter the COS placement packet,
// - rewrite the current turn,
// - choose a response,
// - generate a response.
//
// Architectural rule:
//
// The Conversation Operating System owns conversation placement.
//
// This integration stage only carries its authoritative result into the
// broader Rebirth runtime.
//
// Browser namespace:
//
// window.Ari
// window.Ari.Rebirth
// window.Ari.Rebirth.Integration
// window.Ari.Rebirth.Integration.conversationOSStage
//
// CommonJS:
//
// module.exports = rebirthConversationOSStage

(function initializeRebirthConversationOSStage(globalScope) {
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
  root.Ari.Rebirth.Integration =
    root.Ari.Rebirth.Integration || {};

  const Rebirth =
    root.Ari.Rebirth;

  const Integration =
    Rebirth.Integration;

  /* =====================================================
     CONSTANTS
  ===================================================== */

  const VERSION = "1.0.0";
  const SCHEMA_VERSION = "1.0.0";

  const COMPONENT_NAME =
    "rebirth-conversation-os-stage";

  const STAGE_NAME =
    "conversation_os";

  const COS_AUTHORITY =
    "conversation_operating_system";

  const STATUS_VALUES = Object.freeze([
    "not_started",
    "running",
    "completed",
    "failed",
    "skipped"
  ]);

  /* =====================================================
     ERROR TYPE
  ===================================================== */

  class RebirthConversationOSStageError extends Error {
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
        "Rebirth Conversation OS stage error"
      );

      this.name =
        "RebirthConversationOSStageError";

      this.code =
        code ||
        "REBIRTH_CONVERSATION_OS_STAGE_ERROR";

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
          RebirthConversationOSStageError
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

  function normalizeInteger(
    value,
    fallback = 0
  ) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.trunc(numeric);
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

    if (!Number.isFinite(elapsed)) {
      return 0;
    }

    return Math.max(
      0,
      Math.round(elapsed * 1000) / 1000
    );
  }

  function createId(prefix = "rebirth") {
    const timestamp =
      Date.now().toString(36);

    let randomPart = "";

    if (
      typeof crypto !== "undefined" &&
      crypto &&
      isFunction(crypto.getRandomValues)
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

  function safeError(error) {
    if (error instanceof Error) {
      return {
        name:
          error.name || "Error",

        code:
          firstNonEmptyString(
            error.code
          ) ||
          "REBIRTH_CONVERSATION_OS_STAGE_ERROR",

        message:
          error.message ||
          "Unknown Conversation OS integration error",

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
        "REBIRTH_CONVERSATION_OS_STAGE_ERROR",

      message:
        isNonEmptyString(error)
          ? error
          : "Unknown Conversation OS integration error",

      recoverable: false,

      details:
        safeClone(error),

      cause: null
    };
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

    const namespace =
      Rebirth.ConversationOS || {};

    return (
      namespace.index ||
      namespace.api ||
      namespace.publicApi ||
      root.AriConversationOS ||
      namespace.controller ||
      namespace.cosController ||
      null
    );
  }

  function resolveCosCallable(
    conversationOS
  ) {
    if (isFunction(conversationOS)) {
      return conversationOS.bind(
        conversationOS
      );
    }

    const methods = [
      "run",
      "execute",
      "process"
    ];

    for (const method of methods) {
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

    throw new RebirthConversationOSStageError(
      "REBIRTH_COS_NOT_CALLABLE",
      "The Conversation Operating System does not expose a callable execution method."
    );
  }

  /* =====================================================
     RUNTIME STATE READERS
  ===================================================== */

  function readRequestId(state) {
    return (
      firstNonEmptyString(
        state.requestId,
        state.request_id,
        state.runtimeId,
        state.runtime_id,
        state.executionId,
        state.execution_id
      ) ||
      createId("rebirth_request")
    );
  }

  function readConversationId(state) {
    return firstNonEmptyString(
      state.conversationId,
      state.conversation_id,
      state.threadId,
      state.thread_id,
      state.cosState &&
        state.cosState.conversationId,
      state.conversationOSState &&
        state.conversationOSState
          .conversationId
    );
  }

  function readCurrentTurn(state) {
    const candidate =
      firstDefined(
        state.currentTurn,
        state.current_turn,
        state.turn,
        state.inputTurn,
        state.input_turn,
        state.userTurn,
        state.user_turn
      );

    if (isObject(candidate)) {
      return safeClone(candidate);
    }

    const rawText =
      firstDefined(
        state.message,
        state.text,
        state.input,
        state.userMessage,
        state.user_message,
        ""
      );

    return {
      turnId:
        firstNonEmptyString(
          state.turnId,
          state.turn_id
        ) || null,

      role: "user",

      text:
        rawText === null ||
        rawText === undefined
          ? ""
          : String(rawText),

      sequence:
        normalizeInteger(
          firstDefined(
            state.sequence,
            state.turnSequence,
            state.turn_sequence
          ),
          0
        )
    };
  }

  function readConversationHistory(state) {
    const history =
      firstDefined(
        state.history,
        state.turns,
        state.conversationHistory,
        state.conversation_history,
        state.threadHistory,
        state.thread_history,
        []
      );

    return Array.isArray(history)
      ? safeClone(history)
      : [];
  }

  function readCosState(state) {
    const candidate =
      firstDefined(
        state.cosState,
        state.cos_state,
        state.conversationOSState,
        state.conversation_os_state,
        state.authorityState &&
          state.authorityState
            .conversationOS,
        null
      );

    return isObject(candidate)
      ? safeClone(candidate)
      : null;
  }

  /* =====================================================
     INPUT PROJECTION
  ===================================================== */

  function buildCosInput(
    runtimeState,
    options = {}
  ) {
    const currentTurn =
      readCurrentTurn(runtimeState);

    const history =
      readConversationHistory(
        runtimeState
      );

    const existingCosState =
      readCosState(runtimeState);

    return {
      schemaVersion:
        SCHEMA_VERSION,

      requestId:
        readRequestId(runtimeState),

      conversationId:
        readConversationId(
          runtimeState
        ),

      currentTurn,

      history,

      state:
        existingCosState,

      metadata: {
        source:
          COMPONENT_NAME,

        rebirthStage:
          STAGE_NAME,

        runtimeRevision:
          normalizeInteger(
            runtimeState.revision,
            0
          ),

        projectedAt:
          nowIso(),

        ...(
          isObject(options.metadata)
            ? safeClone(
                options.metadata
              )
            : {}
        )
      },

      options:
        isObject(options.cosOptions)
          ? safeClone(
              options.cosOptions
            )
          : {}
    };
  }

  /* =====================================================
     INPUT VALIDATION
  ===================================================== */

  function validateStageInput(
    runtimeState
  ) {
    const errors = [];
    const warnings = [];

    if (!isObject(runtimeState)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "REBIRTH_COS_STAGE_STATE_NOT_OBJECT"
          }
        ],

        warnings
      };
    }

    const currentTurn =
      readCurrentTurn(
        runtimeState
      );

    if (!isObject(currentTurn)) {
      errors.push({
        code:
          "REBIRTH_COS_STAGE_CURRENT_TURN_MISSING"
      });
    }

    if (
      !isString(currentTurn.text)
    ) {
      errors.push({
        code:
          "REBIRTH_COS_STAGE_CURRENT_TURN_TEXT_INVALID"
      });
    }

    const history =
      readConversationHistory(
        runtimeState
      );

    if (!Array.isArray(history)) {
      errors.push({
        code:
          "REBIRTH_COS_STAGE_HISTORY_INVALID"
      });
    }

    if (
      !readConversationId(
        runtimeState
      )
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_STAGE_CONVERSATION_ID_UNDECLARED",

        message:
          "The Conversation Operating System may create a conversation ID."
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings
    };
  }

  /* =====================================================
     COS RESULT VALIDATION
  ===================================================== */

  function validateCosResult(result) {
    const errors = [];
    const warnings = [];

    if (!isObject(result)) {
      return {
        valid: false,

        errors: [
          {
            code:
              "REBIRTH_COS_RESULT_NOT_OBJECT"
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
          "REBIRTH_COS_RESULT_OK_INVALID"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.packet)
    ) {
      errors.push({
        code:
          "REBIRTH_COS_RESULT_PACKET_MISSING"
      });
    }

    if (
      result.ok === true &&
      !isObject(result.state)
    ) {
      errors.push({
        code:
          "REBIRTH_COS_RESULT_STATE_MISSING"
      });
    }

    if (
      result.ok === false &&
      !Array.isArray(result.errors)
    ) {
      warnings.push({
        code:
          "REBIRTH_COS_RESULT_ERRORS_MISSING"
      });
    }

    if (
      result.packet &&
      result.packet.authority !==
        COS_AUTHORITY
    ) {
      errors.push({
        code:
          "REBIRTH_COS_PACKET_AUTHORITY_INVALID",

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

  /* =====================================================
     STAGE RECORD
  ===================================================== */

  function createStageRecord({
    status,
    startedAt,
    completedAt = null,
    durationMs = 0,
    warnings = [],
    errors = []
  }) {
    return {
      schemaVersion:
        SCHEMA_VERSION,

      stage:
        STAGE_NAME,

      component:
        COMPONENT_NAME,

      version:
        VERSION,

      status:
        STATUS_VALUES.includes(status)
          ? status
          : "failed",

      startedAt,

      completedAt,

      durationMs,

      warningCount:
        warnings.length,

      errorCount:
        errors.length,

      warnings:
        safeClone(warnings),

      errors:
        safeClone(errors)
    };
  }

  /* =====================================================
     STATE ATTACHMENT
  ===================================================== */

  function attachCosSuccess({
    runtimeState,
    cosInput,
    cosResult,
    stageRecord,
    freezePacket = true
  }) {
    const packet =
      freezePacket
        ? freezeClone(
            cosResult.packet
          )
        : safeClone(
            cosResult.packet
          );

    const nextCosState =
      safeClone(
        cosResult.state
      );

    const conversationId =
      firstNonEmptyString(
        cosResult.conversationId,
        cosResult.runtime &&
          cosResult.runtime
            .conversationId,
        nextCosState &&
          nextCosState
            .conversationId,
        cosInput.conversationId
      );

    return {
      ...runtimeState,

      conversationId:
        conversationId ||
        runtimeState.conversationId ||
        null,

      conversationOS: {
        status: "completed",

        authority:
          COS_AUTHORITY,

        packet,

        state:
          nextCosState,

        result:
          safeClone(cosResult),

        stage:
          stageRecord
      },

      conversationOSPacket:
        packet,

      conversationPlacementPacket:
        packet,

      cosPacket:
        packet,

      conversationOSState:
        nextCosState,

      cosState:
        nextCosState,

      authoritativePackets: {
        ...(
          isObject(
            runtimeState
              .authoritativePackets
          )
            ? runtimeState
                .authoritativePackets
            : {}
        ),

        conversationPlacement:
          packet
      },

      authorityState: {
        ...(
          isObject(
            runtimeState.authorityState
          )
            ? runtimeState.authorityState
            : {}
        ),

        conversationOS:
          nextCosState
      },

      stageResults: {
        ...(
          isObject(
            runtimeState.stageResults
          )
            ? runtimeState.stageResults
            : {}
        ),

        [STAGE_NAME]:
          stageRecord
      },

      activeStage:
        STAGE_NAME,

      lastCompletedStage:
        STAGE_NAME,

      updatedAt:
        nowIso()
    };
  }

  function attachCosFailure({
    runtimeState,
    cosInput,
    cosResult,
    stageRecord,
    failurePolicy
  }) {
    const errors =
      Array.isArray(
        cosResult &&
        cosResult.errors
      )
        ? safeClone(
            cosResult.errors
          )
        : safeClone(
            stageRecord.errors
          );

    return {
      ...runtimeState,

      conversationOS: {
        status: "failed",

        authority:
          COS_AUTHORITY,

        packet: null,

        state:
          cosResult &&
          isObject(cosResult.state)
            ? safeClone(
                cosResult.state
              )
            : readCosState(
                runtimeState
              ),

        result:
          cosResult
            ? safeClone(cosResult)
            : null,

        stage:
          stageRecord
      },

      conversationOSPacket:
        null,

      conversationPlacementPacket:
        null,

      cosPacket:
        null,

      stageResults: {
        ...(
          isObject(
            runtimeState.stageResults
          )
            ? runtimeState.stageResults
            : {}
        ),

        [STAGE_NAME]:
          stageRecord
      },

      runtimeErrors: [
        ...(
          Array.isArray(
            runtimeState.runtimeErrors
          )
            ? runtimeState.runtimeErrors
            : []
        ),

        ...errors
      ],

      blocked:
        failurePolicy === "block",

      blockReason:
        failurePolicy === "block"
          ? "conversation_os_failure"
          : runtimeState.blockReason ||
            null,

      activeStage:
        STAGE_NAME,

      updatedAt:
        nowIso(),

      conversationId:
        firstNonEmptyString(
          runtimeState.conversationId,
          cosInput.conversationId
        ) || null
    };
  }

  /* =====================================================
     PUBLIC RUN
  ===================================================== */

  async function run(
    runtimeState = {},
    runtime = {}
  ) {
    const startedAt =
      nowIso();

    const startedAtMs =
      nowMs();

    const options = {
      conversationOS:
        runtime.conversationOS ||
        runtime.cos ||
        null,

      strict:
        runtime.strict !== false,

      failurePolicy:
        firstNonEmptyString(
          runtime.failurePolicy,
          runtime.cosFailurePolicy
        ) || "block",

      freezePacket:
        runtime.freezePacket !== false,

      includeCosResult:
        runtime.includeCosResult !== false,

      throwOnFailure:
        runtime.throwOnFailure === true,

      metadata:
        isObject(runtime.metadata)
          ? runtime.metadata
          : {},

      cosOptions:
        isObject(runtime.cosOptions)
          ? runtime.cosOptions
          : {}
    };

    const inputValidation =
      validateStageInput(
        runtimeState
      );

    if (!inputValidation.valid) {
      const error =
        new RebirthConversationOSStageError(
          "REBIRTH_COS_STAGE_INPUT_INVALID",
          "Conversation OS integration stage received invalid runtime state.",
          {
            details:
              inputValidation
          }
        );

      const normalizedError =
        safeError(error);

      const stageRecord =
        createStageRecord({
          status: "failed",

          startedAt,

          completedAt:
            nowIso(),

          durationMs:
            elapsedMs(
              startedAtMs
            ),

          warnings:
            inputValidation.warnings,

          errors: [
            normalizedError
          ]
        });

      const failedState =
        attachCosFailure({
          runtimeState:
            isObject(runtimeState)
              ? runtimeState
              : {},

          cosInput: {
            conversationId: null
          },

          cosResult: null,

          stageRecord,

          failurePolicy:
            options.failurePolicy
        });

      if (options.throwOnFailure) {
        error.rebirthState =
          failedState;

        throw error;
      }

      return failedState;
    }

    const cosInput =
      buildCosInput(
        runtimeState,
        options
      );

    try {
      const conversationOS =
        resolveConversationOS(
          options.conversationOS
        );

      if (!conversationOS) {
        throw new RebirthConversationOSStageError(
          "REBIRTH_COS_NOT_INSTALLED",
          "Conversation Operating System is not installed."
        );
      }

      const execute =
        resolveCosCallable(
          conversationOS
        );

      const cosResult =
        await execute(
          cosInput,
          {
            strictInstallation:
              options.strict,

            throwOnFailure:
              false,

            ...safeClone(
              options.cosOptions
            )
          }
        );

      const resultValidation =
        validateCosResult(
          cosResult
        );

      if (!resultValidation.valid) {
        throw new RebirthConversationOSStageError(
          "REBIRTH_COS_RESULT_INVALID",
          "Conversation Operating System returned an invalid result.",
          {
            details:
              resultValidation
          }
        );
      }

      if (cosResult.ok !== true) {
        throw new RebirthConversationOSStageError(
          "REBIRTH_COS_EXECUTION_FAILED",
          "Conversation Operating System execution failed.",
          {
            details: {
              errors:
                Array.isArray(
                  cosResult.errors
                )
                  ? cosResult.errors
                  : [],

              result:
                safeClone(
                  cosResult
                )
            }
          }
        );
      }

      const stageRecord =
        createStageRecord({
          status: "completed",

          startedAt,

          completedAt:
            nowIso(),

          durationMs:
            elapsedMs(
              startedAtMs
            ),

          warnings: [
            ...inputValidation.warnings,
            ...resultValidation.warnings
          ],

          errors: []
        });

      const nextState =
        attachCosSuccess({
          runtimeState,

          cosInput,

          cosResult:
            options.includeCosResult
              ? cosResult
              : {
                  ok: true,

                  packet:
                    cosResult.packet,

                  state:
                    cosResult.state,

                  errors: []
                },

          stageRecord,

          freezePacket:
            options.freezePacket
        });

      return nextState;
    } catch (error) {
      const normalizedError =
        safeError(error);

      const stageRecord =
        createStageRecord({
          status: "failed",

          startedAt,

          completedAt:
            nowIso(),

          durationMs:
            elapsedMs(
              startedAtMs
            ),

          warnings:
            inputValidation.warnings,

          errors: [
            normalizedError
          ]
        });

      const failedState =
        attachCosFailure({
          runtimeState,

          cosInput,

          cosResult:
            error &&
            error.details &&
            error.details.result
              ? error.details.result
              : null,

          stageRecord,

          failurePolicy:
            options.failurePolicy
        });

      if (options.throwOnFailure) {
        if (error instanceof Error) {
          error.rebirthState =
            failedState;
        }

        throw error;
      }

      return failedState;
    }
  }

  /* =====================================================
     PACKET ACCESS
  ===================================================== */

  function getPacket(runtimeState) {
    if (!isObject(runtimeState)) {
      return null;
    }

    return (
      runtimeState
        .conversationOSPacket ||
      runtimeState
        .conversationPlacementPacket ||
      runtimeState.cosPacket ||
      (
        runtimeState
          .conversationOS &&
        runtimeState
          .conversationOS.packet
      ) ||
      (
        runtimeState
          .authoritativePackets &&
        runtimeState
          .authoritativePackets
          .conversationPlacement
      ) ||
      null
    );
  }

  function getCosState(runtimeState) {
    if (!isObject(runtimeState)) {
      return null;
    }

    return (
      runtimeState
        .conversationOSState ||
      runtimeState.cosState ||
      (
        runtimeState
          .conversationOS &&
        runtimeState
          .conversationOS.state
      ) ||
      (
        runtimeState
          .authorityState &&
        runtimeState
          .authorityState
          .conversationOS
      ) ||
      null
    );
  }

  function hasCompleted(runtimeState) {
    if (!isObject(runtimeState)) {
      return false;
    }

    return Boolean(
      getPacket(runtimeState) &&
      runtimeState
        .conversationOS &&
      runtimeState
        .conversationOS.status ===
        "completed"
    );
  }

  /* =====================================================
     PUBLIC COMPONENT
  ===================================================== */

  const rebirthConversationOSStage = {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    component:
      COMPONENT_NAME,

    stage:
      STAGE_NAME,

    authority:
      COS_AUTHORITY,

    statuses:
      STATUS_VALUES,

    RebirthConversationOSStageError,

    run,

    execute:
      run,

    process:
      run,

    validateInput:
      validateStageInput,

    validateResult:
      validateCosResult,

    buildCosInput,

    getPacket,

    getCosState,

    hasCompleted
  };

  /* =====================================================
     NAMESPACE EXPORTS
  ===================================================== */

  Integration.conversationOSStage =
    rebirthConversationOSStage;

  Integration.cosStage =
    rebirthConversationOSStage;

  Integration
    .rebirthConversationOSStage =
    rebirthConversationOSStage;

  Rebirth.conversationOSStage =
    rebirthConversationOSStage;

  root.AriRebirthConversationOSStage =
    rebirthConversationOSStage;

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports =
      rebirthConversationOSStage;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this
);