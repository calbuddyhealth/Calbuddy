// ari/continuity/ari-conversation-operating-state-resilience-patch.js
// Ari Conversation Operating State — Resilient Continuity / Non-Blocking Runtime
//
// V2.1.0 — Recoverable COS / Non-Blocking Continuity Authority
//
// Purpose:
// - Keep COS authoritative over conversation state.
// - Prevent continuity defects from blocking normal runtime execution.
// - Validate the canonical Turn Packet itself, not the intake wrapper.
// - Preserve strict diagnostics while exposing a usable degraded current turn.
// - Separate COS completion from persistence success.
//
// Load order:
// 1. ari/conversation/ari-turn-packet.js
// 2. ari/conversation/ari-turn-intake-engine.js
// 3. ari/continuity/ari-conversation-operating-state.js
// 4. THIS FILE
//
// Runtime policy:
// - Missing usable current-turn text: unusable; master runtime may stop.
// - Missing/invalid canonical Turn Packet: degraded but usable when text exists.
// - Missing thread history/store: degraded or warning; continue.
// - Persistence failure: completed but not persisted; delivery remains valid.
//
// Important:
// The master pipeline must gate on conversationOperatingStateUsable,
// not conversationOperatingStateReady.

window.Ari = window.Ari || {};

(function installAriConversationOperatingStateResiliencePatch() {
  const cos =
    window.AriConversationOperatingState ||
    window.Ari?.conversationOperatingState ||
    null;

  if (!cos) {
    console.error(
      "ARI COS RESILIENCE PATCH FAILED:",
      "AriConversationOperatingState_not_loaded"
    );
    return;
  }

  const originalCompleteTurn =
    typeof cos.completeTurn === "function"
      ? cos.completeTurn.bind(cos)
      : null;

  const originalAttachCompatibilityAliases =
    typeof cos.attachCompatibilityAliases === "function"
      ? cos.attachCompatibilityAliases.bind(cos)
      : null;

  const originalGetAuthorityBoundaries =
    typeof cos.getAuthorityBoundaries === "function"
      ? cos.getAuthorityBoundaries.bind(cos)
      : null;

  const originalValidate =
    typeof cos.validate === "function"
      ? cos.validate.bind(cos)
      : null;

  /* =====================================================
     LOCAL UTILITIES
  ===================================================== */

  const readObject = value =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? value
      : null;

  const toArray = value =>
    Array.isArray(value)
      ? value
      : value === null ||
        value === undefined ||
        value === ""
        ? []
        : [value];

  const cleanText = value =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

  const unique = values =>
    [
      ...new Set(
        toArray(values)
          .flat(Infinity)
          .filter(
            value =>
              value !== null &&
              value !== undefined &&
              value !== ""
          )
      )
    ];

  const firstText = (...values) => {
    for (const value of values) {
      const text = cleanText(value);

      if (text) {
        return text;
      }
    }

    return "";
  };

  const safeCall = (
    operation,
    fallback,
    label
  ) => {
    try {
      return operation();
    } catch (error) {
      console.warn(
        `Ari COS operation failed: ${label}`,
        error
      );

      return fallback;
    }
  };

  cos.readObject =
    cos.readObject ||
    readObject;

  /* =====================================================
     CURRENT-TURN EXTRACTION
  ===================================================== */

  cos.extractUsableCurrentTurnText =
    function extractUsableCurrentTurnText(
      summary = {},
      request = null
    ) {
      const resolvedRequest =
        readObject(request) ||
        readObject(summary.request) ||
        {};

      const requestTurn =
        readObject(
          resolvedRequest.turn
        ) ||
        readObject(
          summary.turn
        ) ||
        {};

      return firstText(
        requestTurn.originalMessage,
        requestTurn.originalText,
        requestTurn.message,
        resolvedRequest.message,
        summary.originalUserMessage,
        summary.effectiveUserMessage,
        summary.userMessage,
        summary.message,
        summary.input
      );
    };

  cos.hasUsableCurrentTurn =
    function hasUsableCurrentTurn(
      summary = {}
    ) {
      return Boolean(
        firstText(
          summary
            .conversationOperatingState
            ?.currentTurn
            ?.effectiveText,
          summary
            .conversationOperatingState
            ?.currentTurn
            ?.originalText,
          summary
            .currentTurn
            ?.effectiveText,
          summary
            .currentTurn
            ?.originalText,
          summary
            .turnPacket
            ?.originalMessage,
          this.extractUsableCurrentTurnText(
            summary
          )
        )
      );
    };

  /* =====================================================
     TURN INTAKE COORDINATION
  ===================================================== */

  cos.runTurnIntake =
    async function runTurnIntake({
      summary = {},
      storedState = {},
      recentTurns = []
    } = {}) {
      const intakeEngine =
        window.AriTurnIntakeEngine ||
        window.Ari?.turnIntakeEngine ||
        null;

      const existingRequest =
        readObject(
          summary.request
        ) || {};

      const suppliedTurn =
        readObject(
          existingRequest.turn
        ) ||
        readObject(
          summary.turn
        ) ||
        {};

      const suppliedConversation =
        readObject(
          existingRequest.conversation
        ) ||
        readObject(
          summary.conversation
        ) ||
        {};

      const suppliedThread =
        readObject(
          existingRequest.thread
        ) ||
        readObject(
          summary.thread
        ) ||
        {};

      const originalMessage =
        this.extractUsableCurrentTurnText(
          summary,
          existingRequest
        );

      const lastTurn =
        recentTurns.length
          ? recentTurns[
              recentTurns.length - 1
            ]
          : null;

      const request = {
        ...existingRequest,

        turn: {
          ...suppliedTurn,

          turnId:
            suppliedTurn.turnId ||
            summary.currentTurnId ||
            summary.turnId ||
            null,

          timestamp:
            suppliedTurn.timestamp ||
            suppliedTurn.createdAt ||
            summary.timestamp ||
            summary.createdAt ||
            new Date().toISOString(),

          source:
            suppliedTurn.source ||
            existingRequest.source ||
            summary.requestSource ||
            summary.source ||
            "user",

          originalMessage
        },

        conversation: {
          ...suppliedConversation,

          conversationId:
            suppliedConversation
              .conversationId ||
            storedState.conversationId ||
            summary.conversationId ||
            null
        },

        thread: {
          ...suppliedThread,

          threadId:
            suppliedThread.threadId ||
            storedState.threadId ||
            summary.threadId ||
            null,

          previousTurn:
            suppliedThread.previousTurn ||
            lastTurn ||
            null,

          lastTurn:
            suppliedThread.lastTurn ||
            lastTurn ||
            null,

          history:
            Array.isArray(
              suppliedThread.history
            )
              ? suppliedThread.history
              : recentTurns
        },

        metadata: {
          ...(
            readObject(
              summary.metadata
            ) || {}
          ),

          ...(
            readObject(
              existingRequest.metadata
            ) || {}
          )
        },

        message:
          existingRequest.message ||
          originalMessage
      };

      if (!originalMessage) {
        return {
          ...summary,

          request,

          turnPacket:
            null,

          turnIntakeEngineRan:
            false,

          turnIntakeEngineReady:
            false,

          turnIntakeEngineUsable:
            false,

          turnIntakeEngineSource:
            intakeEngine
              ? "ari-turn-intake-engine"
              : "not-loaded",

          turnIntakeEngineVersion:
            intakeEngine?.version ||
            null,

          turnIntakeEngineError:
            "current_turn_text_not_available",

          turnIntakeValidation: {
            valid:
              false,

            errors: [
              "current_turn_text_not_available"
            ],

            warnings:
              []
          }
        };
      }

      if (
        !intakeEngine ||
        typeof intakeEngine.run !==
          "function"
      ) {
        return {
          ...summary,

          request,

          turnPacket:
            null,

          turnIntakeEngineRan:
            false,

          turnIntakeEngineReady:
            false,

          // Text exists, so COS can construct a provisional projection.
          turnIntakeEngineUsable:
            true,

          turnIntakeEngineSource:
            "not-loaded",

          turnIntakeEngineVersion:
            null,

          turnIntakeEngineError:
            "ari_turn_intake_engine_not_loaded",

          turnIntakeValidation: {
            valid:
              false,

            errors: [
              "ari_turn_intake_engine_not_loaded"
            ],

            warnings: [
              "degraded_current_turn_projection_required"
            ]
          }
        };
      }

      try {
        const result =
          await intakeEngine.run({
            ...summary,
            request
          });

        if (
          !result ||
          typeof result !==
            "object" ||
          Array.isArray(result)
        ) {
          return {
            ...summary,

            request,

            turnPacket:
              null,

            turnIntakeEngineRan:
              true,

            turnIntakeEngineReady:
              false,

            turnIntakeEngineUsable:
              true,

            turnIntakeEngineSource:
              "invalid-result",

            turnIntakeEngineVersion:
              intakeEngine.version ||
              null,

            turnIntakeEngineError:
              "ari_turn_intake_engine_invalid_result",

            turnIntakeValidation: {
              valid:
                false,

              errors: [
                "ari_turn_intake_engine_invalid_result"
              ],

              warnings: [
                "degraded_current_turn_projection_required"
              ]
            }
          };
        }

        const turnPacket =
          readObject(
            result.turnPacket
          );

        let validation =
          turnPacket?.validation ||
          null;

        try {
          if (
            typeof intakeEngine
              .validateTurnPacket ===
              "function"
          ) {
            validation =
              intakeEngine
                .validateTurnPacket(
                  turnPacket
                );
          } else if (
            typeof window
              .AriTurnPacket
              ?.validate ===
              "function"
          ) {
            validation =
              window.AriTurnPacket
                .validate(
                  turnPacket
                );
          } else if (
            typeof intakeEngine
              .validate ===
              "function"
          ) {
            // Validate the packet itself, never the intake wrapper.
            validation =
              intakeEngine.validate(
                turnPacket
              );
          }
        } catch (error) {
          validation = {
            valid:
              false,

            errors: [
              error?.message ||
              String(error)
            ],

            warnings:
              []
          };
        }

        const ready =
          Boolean(
            turnPacket &&
            validation?.valid ===
              true
          );

        return {
          ...summary,
          ...result,

          request,

          turnPacket:
            turnPacket ||
            null,

          turnIntakeValidation:
            validation || {
              valid:
                false,

              errors: [
                "canonical_turn_packet_validation_unavailable"
              ],

              warnings:
                []
            },

          turnIntakeEngineRan:
            true,

          turnIntakeEngineReady:
            ready,

          turnIntakeEngineUsable:
            ready ||
            Boolean(
              originalMessage
            ),

          turnIntakeEngineSource:
            result
              .turnIntakeEngineSource ||
            result.source ||
            intakeEngine.source ||
            "ari-turn-intake-engine",

          turnIntakeEngineVersion:
            result
              .turnIntakeEngineVersion ||
            result.version ||
            intakeEngine.version ||
            null,

          turnIntakeEngineError:
            ready
              ? null
              : (
                  toArray(
                    validation?.errors
                  )[0] ||
                  (
                    turnPacket
                      ? "canonical_turn_packet_invalid"
                      : "canonical_turn_packet_missing"
                  )
                )
        };
      } catch (error) {
        console.error(
          "Ari COS turn intake failed:",
          error
        );

        return {
          ...summary,

          request,

          turnPacket:
            null,

          turnIntakeEngineRan:
            true,

          turnIntakeEngineReady:
            false,

          turnIntakeEngineUsable:
            Boolean(
              originalMessage
            ),

          turnIntakeEngineSource:
            "execution-error",

          turnIntakeEngineVersion:
            intakeEngine.version ||
            null,

          turnIntakeEngineError:
            error?.message ||
            String(error),

          turnIntakeValidation: {
            valid:
              false,

            errors: [
              error?.message ||
              String(error)
            ],

            warnings: [
              "degraded_current_turn_projection_required"
            ]
          }
        };
      }
    };

  /* =====================================================
     CANONICAL TURN PROJECTION
  ===================================================== */

  cos.normalizeCurrentTurnInput =
    function normalizeCurrentTurnInput(
      summary = {}
    ) {
      const turnPacket =
        readObject(
          summary.turnPacket
        );

      if (!turnPacket) {
        return {
          turnPacket:
            null,

          currentTurn:
            null
        };
      }

      const originalText =
        firstText(
          turnPacket.originalMessage,
          this.extractUsableCurrentTurnText(
            summary
          )
        );

      return {
        turnPacket,

        currentTurn: {
          schema:
            "ari_conversation_turn_projection",

          schemaVersion:
            this.schemaVersion,

          id:
            turnPacket.turnId ||
            null,

          turnId:
            turnPacket.turnId ||
            null,

          role:
            "user",

          source:
            turnPacket.source ||
            "user",

          conversationId:
            turnPacket.conversationId ||
            null,

          threadId:
            turnPacket.threadId ||
            null,

          originalText,

          resolvedText:
            null,

          effectiveText:
            originalText,

          normalizedText:
            turnPacket.normalizedMessage ||
            (
              typeof this
                .normalizeForComparison ===
                "function"
                ? this.normalizeForComparison(
                    originalText
                  )
                : originalText
                    .toLowerCase()
            ),

          createdAt:
            turnPacket.timestamp ||
            new Date().toISOString(),

          previousTurnAvailable:
            turnPacket.previousTurnAvailable ===
            true,

          resolutionStatus:
            "unresolved",

          textWasRewritten:
            false,

          originalTextPreserved:
            true,

          authority: {
            owner:
              "ari-conversation-operating-state",

            sourceAuthority:
              "ari-turn-packet",

            projection:
              true,

            canonical:
              false,

            provisional:
              false,

            canReplaceTurnPacket:
              false,

            role:
              "continuity_facing_projection_of_canonical_turn_packet"
          }
        }
      };
    };

  /* =====================================================
     DEGRADED OPERATING STATE
  ===================================================== */

  cos.buildDegradedOperatingState =
    function buildDegradedOperatingState({
      summary = {},
      intakeState = {},
      storedState = {},
      recentTurns = [],
      reason =
        "authoritative_conversation_state_not_ready"
    } = {}) {
      const request =
        readObject(
          intakeState.request
        ) ||
        readObject(
          summary.request
        ) ||
        {};

      const requestTurn =
        readObject(
          request.turn
        ) ||
        readObject(
          summary.turn
        ) ||
        {};

      const originalText =
        firstText(
          requestTurn.originalMessage,
          requestTurn.originalText,
          requestTurn.message,
          request.message,
          intakeState.originalUserMessage,
          intakeState.userMessage,
          summary.originalUserMessage,
          summary.userMessage,
          summary.message,
          summary.input
        );

      if (!originalText) {
        return {
          ...summary,
          ...intakeState,

          conversationOperatingState:
            null,

          conversationOperatingStateRan:
            true,

          conversationOperatingStateReady:
            false,

          conversationOperatingStateUsable:
            false,

          conversationOperatingStateDegraded:
            false,

          conversationOperatingStateMode:
            "unavailable",

          conversationOperatingStateSource:
            this.source,

          conversationOperatingStateVersion:
            this.version,

          conversationOperatingStateError:
            "current_turn_text_not_available",

          conversationOperatingStateErrors:
            unique([
              reason,
              intakeState
                .turnIntakeEngineError,
              "current_turn_text_not_available"
            ]),

          conversationOperatingStateWarnings:
            []
        };
      }

      const immediate =
        typeof this
          .resolveImmediateHorizon ===
          "function"
          ? this.resolveImmediateHorizon(
              recentTurns
            )
          : {
              available:
                recentTurns.length >
                0,

              recentTurns,

              previousUserTurn:
                null,

              previousAssistantTurn:
                null
            };

      const currentTurn = {
        schema:
          "ari_conversation_turn_projection",

        schemaVersion:
          this.schemaVersion,

        id:
          requestTurn.turnId ||
          summary.currentTurnId ||
          summary.turnId ||
          null,

        turnId:
          requestTurn.turnId ||
          summary.currentTurnId ||
          summary.turnId ||
          null,

        role:
          "user",

        source:
          requestTurn.source ||
          summary.turnSource ||
          "user",

        conversationId:
          request.conversation
            ?.conversationId ||
          storedState.conversationId ||
          summary.conversationId ||
          null,

        threadId:
          request.thread
            ?.threadId ||
          storedState.threadId ||
          summary.threadId ||
          null,

        originalText,

        resolvedText:
          null,

        effectiveText:
          originalText,

        normalizedText:
          typeof this
            .normalizeForComparison ===
            "function"
            ? this.normalizeForComparison(
                originalText
              )
            : originalText
                .toLowerCase(),

        createdAt:
          requestTurn.timestamp ||
          summary.timestamp ||
          new Date().toISOString(),

        previousTurnAvailable:
          immediate.available ===
          true,

        resolutionStatus:
          "degraded_unresolved",

        textWasRewritten:
          false,

        originalTextPreserved:
          true,

        authority: {
          owner:
            "ari-conversation-operating-state",

          sourceAuthority:
            "runtime_request_fallback",

          projection:
            true,

          canonical:
            false,

          provisional:
            true,

          canReplaceTurnPacket:
            false,

          role:
            "degraded_current_turn_projection"
        }
      };

      const activeFrame =
        typeof this
          .buildActiveFrame ===
          "function"
          ? this.buildActiveFrame({
              summary: {
                ...summary,
                ...intakeState
              },

              storedState,
              immediate
            })
          : {};

      const activeHorizon =
        typeof this
          .buildActiveHorizon ===
          "function"
          ? this.buildActiveHorizon({
              summary: {
                ...summary,
                ...intakeState
              },

              storedState,
              activeFrame
            })
          : {
              openLoops:
                [],

              unresolvedItems:
                []
            };

      const historicalHorizon =
        typeof this
          .buildHistoricalHorizon ===
          "function"
          ? this.buildHistoricalHorizon({
              summary: {
                ...summary,
                ...intakeState
              },

              storedState,
              recentTurns,
              activeFrame,
              activeHorizon,
              currentTurn
            })
          : {
              referenceCandidates:
                [],

              topCandidates:
                []
            };

      const continuityMode =
        typeof this
          .resolveContinuityMode ===
          "function"
          ? this.resolveContinuityMode({
              currentTurn,
              immediate,
              activeFrame,
              historicalHorizon
            })
          : "direct_current_turn";

      const referenceSignal =
        typeof this
          .buildReferenceSignal ===
          "function"
          ? this.buildReferenceSignal(
              currentTurn
            )
          : {
              detected:
                false,

              resolutionRequired:
                false
            };

      const operatingState = {
        schema:
          "ari_conversation_operating_state",

        schemaVersion:
          this.schemaVersion,

        source:
          this.source,

        version:
          this.version,

        authorityLevel:
          "degraded_conversation_operating_state",

        createdAt:
          new Date().toISOString(),

        conversationId:
          currentTurn.conversationId ||
          storedState.conversationId ||
          null,

        turnIndex:
          typeof this
            .resolveTurnIndex ===
            "function"
            ? this.resolveTurnIndex({
                summary,
                storedState,
                recentTurns
              })
            : null,

        turnPacket:
          null,

        currentTurn,

        immediateHorizon:
          immediate,

        activeHorizon,

        historicalHorizon,

        activeFrame,

        continuityMode,

        referenceSignal,

        priorContextAvailable:
          immediate.available ===
          true,

        referenceCandidates:
          historicalHorizon
            .referenceCandidates ||
          [],

        openLoops:
          activeHorizon.openLoops ||
          [],

        unresolvedItems:
          activeHorizon
            .unresolvedItems ||
          [],

        confidence:
          typeof this
            .calculateOperatingStateConfidence ===
            "function"
            ? this.calculateOperatingStateConfidence({
                currentTurn,
                immediate,
                activeFrame,
                recentTurns
              })
            : 0.5,

        degraded:
          true,

        degradedReason:
          reason,

        limitations: [
          "canonical_turn_packet_not_available",
          "authoritative_continuity_not_confirmed",
          "reference_resolution_not_authoritative"
        ],

        compactContext:
          typeof this
            .buildCompactContext ===
            "function"
            ? this.buildCompactContext({
                currentTurn,
                immediate,
                activeFrame,
                activeHorizon,
                historicalHorizon,
                continuityMode,
                referenceSignal
              })
            : {
                currentTurn: {
                  originalText
                }
              },

        rawStoredState:
          storedState,

        authority:
          typeof this
            .getAuthorityBoundaries ===
            "function"
            ? this.getAuthorityBoundaries()
            : {}
      };

      const projected = {
        ...summary,
        ...intakeState,

        conversationOperatingState:
          operatingState,

        currentTurn,

        turnPacket:
          null,

        originalUserMessage:
          originalText,

        userMessage:
          originalText,

        effectiveUserMessage:
          originalText
      };

      return {
        ...summary,
        ...intakeState,
        ...projected,

        conversationOperatingState:
          operatingState,

        currentTurn,

        originalUserMessage:
          originalText,

        userMessage:
          originalText,

        effectiveUserMessage:
          originalText,

        conversationOperatingStateRan:
          true,

        conversationOperatingStateReady:
          false,

        conversationOperatingStateUsable:
          true,

        conversationOperatingStateDegraded:
          true,

        conversationOperatingStateMode:
          "degraded_current_turn",

        conversationOperatingStateSource:
          this.source,

        conversationOperatingStateVersion:
          this.version,

        conversationOperatingStateError:
          reason,

        conversationOperatingStateErrors:
          unique([
            intakeState
              .turnIntakeValidation
              ?.errors,
            intakeState
              .turnIntakeEngineError,
            reason
          ]),

        conversationOperatingStateWarnings:
          unique([
            intakeState
              .turnIntakeValidation
              ?.warnings,
            "runtime_continued_without_authoritative_turn_packet"
          ])
      };
    };

  /* =====================================================
     BEGIN TURN
  ===================================================== */

  cos.buildAuthoritativeOrDegradedState =
    async function buildAuthoritativeOrDegradedState(
      summary = {}
    ) {
      let storedState =
        null;

      let storedStateError =
        null;

      try {
        storedState =
          typeof this
            .loadStoredState ===
            "function"
            ? await this.loadStoredState()
            : null;
      } catch (error) {
        storedStateError =
          error?.message ||
          String(error);

        console.warn(
          "Ari COS stored-state load failed; continuing without stored state:",
          error
        );

        storedState =
          null;
      }

      const normalizedStored =
        typeof this
          .normalizeStoredState ===
          "function"
          ? this.normalizeStoredState(
              storedState
            )
          : (
              readObject(
                storedState
              ) || {}
            );

      const recentTurns =
        typeof this
          .buildRecentTurns ===
          "function"
          ? this.buildRecentTurns({
              summary,
              storedState:
                normalizedStored
            })
          : [];

      const intakeState =
        await this.runTurnIntake({
          summary,
          storedState:
            normalizedStored,
          recentTurns
        });

      if (
        intakeState
          .turnIntakeEngineReady !==
          true ||
        !intakeState.turnPacket
      ) {
        return this
          .buildDegradedOperatingState({
            summary,
            intakeState,
            storedState:
              normalizedStored,
            recentTurns,
            reason:
              intakeState
                .turnIntakeEngineError ||
              "canonical_turn_packet_not_ready"
          });
      }

      const input =
        this.normalizeCurrentTurnInput(
          intakeState
        );

      if (
        !input.currentTurn ||
        !input.turnPacket
      ) {
        return this
          .buildDegradedOperatingState({
            summary,
            intakeState,
            storedState:
              normalizedStored,
            recentTurns,
            reason:
              "canonical_turn_projection_failed"
          });
      }

      const immediate =
        this.resolveImmediateHorizon(
          recentTurns
        );

      const activeFrame =
        this.buildActiveFrame({
          summary:
            intakeState,
          storedState:
            normalizedStored,
          immediate
        });

      const activeHorizon =
        this.buildActiveHorizon({
          summary:
            intakeState,
          storedState:
            normalizedStored,
          activeFrame
        });

      const historicalHorizon =
        this.buildHistoricalHorizon({
          summary:
            intakeState,
          storedState:
            normalizedStored,
          recentTurns,
          activeFrame,
          activeHorizon,
          currentTurn:
            input.currentTurn
        });

      const continuityMode =
        this.resolveContinuityMode({
          currentTurn:
            input.currentTurn,
          immediate,
          activeFrame,
          historicalHorizon
        });

      const referenceSignal =
        this.buildReferenceSignal(
          input.currentTurn
        );

      const operatingState = {
        schema:
          "ari_conversation_operating_state",

        schemaVersion:
          this.schemaVersion,

        source:
          this.source,

        version:
          this.version,

        authorityLevel:
          this.authorityLevel,

        createdAt:
          new Date().toISOString(),

        conversationId:
          input.turnPacket
            ?.conversationId ||
          normalizedStored
            .conversationId ||
          intakeState
            .conversationId ||
          (
            typeof this
              .createConversationId ===
              "function"
              ? this.createConversationId()
              : null
          ),

        turnIndex:
          this.resolveTurnIndex({
            summary:
              intakeState,
            storedState:
              normalizedStored,
            recentTurns
          }),

        turnPacket:
          input.turnPacket,

        currentTurn:
          input.currentTurn,

        immediateHorizon:
          immediate,

        activeHorizon,

        historicalHorizon,

        activeFrame,

        continuityMode,

        referenceSignal,

        priorContextAvailable:
          recentTurns.length >
          0,

        referenceCandidates:
          historicalHorizon
            .referenceCandidates,

        openLoops:
          activeHorizon
            .openLoops,

        unresolvedItems:
          activeHorizon
            .unresolvedItems,

        confidence:
          this.calculateOperatingStateConfidence({
            currentTurn:
              input.currentTurn,
            immediate,
            activeFrame,
            recentTurns
          }),

        degraded:
          false,

        degradedReason:
          null,

        limitations:
          [],

        compactContext:
          this.buildCompactContext({
            currentTurn:
              input.currentTurn,
            immediate,
            activeFrame,
            activeHorizon,
            historicalHorizon,
            continuityMode,
            referenceSignal
          }),

        rawStoredState:
          normalizedStored,

        authority:
          this.getAuthorityBoundaries()
      };

      let result =
        originalAttachCompatibilityAliases
          ? originalAttachCompatibilityAliases({
              summary:
                intakeState,
              operatingState,
              storedState:
                normalizedStored,
              recentTurns,
              immediate,
              activeFrame,
              activeHorizon
            })
          : {
              ...intakeState,

              conversationOperatingState:
                operatingState
            };

      return {
        ...summary,
        ...intakeState,
        ...result,

        conversationOperatingState:
          operatingState,

        currentTurn:
          input.currentTurn,

        conversationOperatingStateRan:
          true,

        conversationOperatingStateReady:
          true,

        conversationOperatingStateUsable:
          true,

        conversationOperatingStateDegraded:
          false,

        conversationOperatingStateMode:
          "authoritative",

        conversationOperatingStateSource:
          this.source,

        conversationOperatingStateVersion:
          this.version,

        conversationOperatingStateError:
          null,

        conversationOperatingStateErrors:
          [],

        conversationOperatingStateWarnings:
          unique([
            intakeState
              .turnIntakeValidation
              ?.warnings,

            storedStateError
              ? "stored_conversation_state_unavailable"
              : null
          ])
      };
    };

  cos.beginTurn =
    async function beginTurn(
      summary = {}
    ) {
      try {
        return await this
          .buildAuthoritativeOrDegradedState(
            summary
          );
      } catch (error) {
        console.error(
          "Ari COS beginTurn failed; recovering with minimal current-turn state:",
          error
        );

        const originalText =
          this.extractUsableCurrentTurnText(
            summary
          );

        if (!originalText) {
          return {
            ...summary,

            conversationOperatingState:
              null,

            conversationOperatingStateRan:
              true,

            conversationOperatingStateReady:
              false,

            conversationOperatingStateUsable:
              false,

            conversationOperatingStateDegraded:
              false,

            conversationOperatingStateMode:
              "unavailable",

            conversationOperatingStateSource:
              this.source,

            conversationOperatingStateVersion:
              this.version,

            conversationOperatingStateError:
              "current_turn_text_not_available",

            conversationOperatingStateErrors:
              unique([
                error?.message ||
                String(error),
                "current_turn_text_not_available"
              ]),

            conversationOperatingStateWarnings:
              []
          };
        }

        const currentTurn = {
          schema:
            "ari_conversation_turn_projection",

          schemaVersion:
            this.schemaVersion,

          id:
            summary.currentTurnId ||
            summary.turnId ||
            null,

          turnId:
            summary.currentTurnId ||
            summary.turnId ||
            null,

          role:
            "user",

          source:
            summary.turnSource ||
            "user",

          conversationId:
            summary.conversationId ||
            summary.request
              ?.conversation
              ?.conversationId ||
            null,

          threadId:
            summary.threadId ||
            summary.request
              ?.thread
              ?.threadId ||
            null,

          originalText,

          resolvedText:
            null,

          effectiveText:
            originalText,

          normalizedText:
            cleanText(originalText)
              .toLowerCase(),

          createdAt:
            summary.timestamp ||
            new Date().toISOString(),

          previousTurnAvailable:
            false,

          resolutionStatus:
            "emergency_degraded_unresolved",

          textWasRewritten:
            false,

          originalTextPreserved:
            true,

          authority: {
            owner:
              "ari-conversation-operating-state",

            sourceAuthority:
              "runtime_request_emergency_fallback",

            projection:
              true,

            canonical:
              false,

            provisional:
              true,

            canReplaceTurnPacket:
              false,

            role:
              "minimal_emergency_current_turn_projection"
          }
        };

        const operatingState = {
          schema:
            "ari_conversation_operating_state",

          schemaVersion:
            this.schemaVersion,

          source:
            this.source,

          version:
            this.version,

          authorityLevel:
            "emergency_degraded_conversation_operating_state",

          createdAt:
            new Date().toISOString(),

          conversationId:
            currentTurn.conversationId,

          turnIndex:
            null,

          turnPacket:
            null,

          currentTurn,

          immediateHorizon: {
            available:
              false,

            recentTurns:
              [],

            previousUserTurn:
              null,

            previousAssistantTurn:
              null
          },

          activeHorizon: {
            openLoops:
              [],

            unresolvedItems:
              []
          },

          historicalHorizon: {
            referenceCandidates:
              [],

            topCandidates:
              []
          },

          activeFrame:
            {},

          continuityMode:
            "direct_current_turn",

          referenceSignal: {
            detected:
              false,

            resolutionRequired:
              false
          },

          priorContextAvailable:
            false,

          referenceCandidates:
            [],

          openLoops:
            [],

          unresolvedItems:
            [],

          confidence:
            0.25,

          degraded:
            true,

          degradedReason:
            "conversation_operating_state_execution_failed",

          limitations: [
            "canonical_turn_packet_not_available",
            "continuity_processing_failed",
            "reference_resolution_not_authoritative"
          ],

          compactContext: {
            currentTurn: {
              originalText
            }
          },

          rawStoredState:
            {},

          authority:
            safeCall(
              () =>
                this.getAuthorityBoundaries(),
              {},
              "getAuthorityBoundaries_emergency"
            )
        };

        return {
          ...summary,

          conversationOperatingState:
            operatingState,

          currentTurn,

          turnPacket:
            null,

          originalUserMessage:
            originalText,

          userMessage:
            originalText,

          effectiveUserMessage:
            originalText,

          conversationOperatingStateRan:
            true,

          conversationOperatingStateReady:
            false,

          conversationOperatingStateUsable:
            true,

          conversationOperatingStateDegraded:
            true,

          conversationOperatingStateMode:
            "emergency_degraded_current_turn",

          conversationOperatingStateSource:
            this.source,

          conversationOperatingStateVersion:
            this.version,

          conversationOperatingStateError:
            "conversation_operating_state_execution_failed",

          conversationOperatingStateErrors:
            unique([
              error?.message ||
              String(error),
              "conversation_operating_state_execution_failed"
            ]),

          conversationOperatingStateWarnings: [
            "runtime_continued_with_minimal_current_turn_state"
          ]
        };
      }
    };

  cos.build =
    function build(
      summary = {}
    ) {
      return this.beginTurn(
        summary
      );
    };

  /* =====================================================
     COMPATIBILITY PROJECTION
  ===================================================== */

  cos.attachCompatibilityAliases =
    function attachCompatibilityAliases(
      input = {}
    ) {
      const summary =
        input.summary ||
        {};

      const operatingState =
        input.operatingState ||
        {};

      let result = {
        ...summary,

        conversationOperatingState:
          operatingState
      };

      if (
        originalAttachCompatibilityAliases
      ) {
        result =
          originalAttachCompatibilityAliases(
            input
          );
      }

      const turnPacket =
        operatingState.turnPacket ||
        summary.turnPacket ||
        null;

      const currentTurn =
        operatingState.currentTurn ||
        result.currentTurn ||
        null;

      const originalMessage =
        firstText(
          turnPacket
            ?.originalMessage,
          currentTurn
            ?.originalText,
          summary
            .originalUserMessage,
          summary.userMessage,
          summary.message,
          summary.input
        );

      const effectiveMessage =
        firstText(
          currentTurn
            ?.effectiveText,
          originalMessage
        );

      const degraded =
        operatingState.degraded ===
        true;

      const usable =
        Boolean(
          effectiveMessage
        );

      return {
        ...result,

        conversationOperatingState:
          operatingState,

        turnPacket,

        currentTurn,

        currentTurnId:
          currentTurn?.turnId ||
          turnPacket?.turnId ||
          null,

        originalUserMessage:
          originalMessage,

        userMessage:
          effectiveMessage,

        effectiveUserMessage:
          effectiveMessage,

        turnIntakeEngineRan:
          summary
            .turnIntakeEngineRan ===
          true,

        turnIntakeEngineReady:
          summary
            .turnIntakeEngineReady ===
          true,

        turnIntakeEngineUsable:
          summary
            .turnIntakeEngineUsable ===
          true ||
          usable,

        turnIntakeEngineSource:
          summary
            .turnIntakeEngineSource ||
          null,

        turnIntakeEngineVersion:
          summary
            .turnIntakeEngineVersion ||
          null,

        turnIntakeEngineError:
          summary
            .turnIntakeEngineError ||
          null,

        turnIntakeValidation:
          summary
            .turnIntakeValidation ||
          turnPacket?.validation ||
          null,

        conversationOperatingStateRan:
          true,

        conversationOperatingStateReady:
          !degraded &&
          usable,

        conversationOperatingStateUsable:
          usable,

        conversationOperatingStateDegraded:
          degraded,

        conversationOperatingStateMode:
          degraded
            ? "degraded_current_turn"
            : "authoritative",

        conversationOperatingStateSource:
          this.source,

        conversationOperatingStateVersion:
          this.version
      };
    };

  /* =====================================================
     COMPLETION / PERSISTENCE SEPARATION
  ===================================================== */

  if (originalCompleteTurn) {
    cos.completeTurn =
      async function completeTurn(
        summary = {}
      ) {
        try {
          const result =
            await originalCompleteTurn(
              summary
            );

          const persistence =
            result
              ?.conversationOperatingState
              ?.persistence ||
            result?.persistence ||
            {};

          const persisted =
            persistence.saved ===
              true ||
            result.threadSaveSucceeded ===
              true ||
            result.threadStatePersisted ===
              true;

          const persistenceAttempted =
            result.threadSaveRan ===
              true ||
            persistence.attempted ===
              true;

          return {
            ...summary,
            ...result,

            // Turn lifecycle completion is independent from storage success.
            conversationOperatingStateCompleted:
              true,

            conversationOperatingStateCompletionRan:
              true,

            conversationOperatingStateCompletionReason:
              persisted
                ? "completed_and_persisted"
                : persistenceAttempted
                  ? "completed_persistence_failed"
                  : "completed_without_persistence",

            conversationOperatingStatePersisted:
              persisted,

            conversationOperatingStatePersistenceRequired:
              false,

            conversationOperatingStateCompletionSource:
              this.source,

            conversationOperatingStateCompletionVersion:
              this.version
          };
        } catch (error) {
          console.error(
            "Ari COS completion failed:",
            error
          );

          return {
            ...summary,

            conversationOperatingStateCompleted:
              true,

            conversationOperatingStateCompletionRan:
              true,

            conversationOperatingStateCompletionReason:
              "completed_persistence_or_cleanup_failed",

            conversationOperatingStateCompletionError:
              error?.message ||
              String(error),

            conversationOperatingStatePersisted:
              false,

            conversationOperatingStatePersistenceRequired:
              false,

            conversationOperatingStateCompletionSource:
              this.source,

            conversationOperatingStateCompletionVersion:
              this.version
          };
        }
      };
  }

  /* =====================================================
     AUTHORITY BOUNDARIES
  ===================================================== */

  cos.getAuthorityBoundaries =
    function getAuthorityBoundaries() {
      const existing =
        originalGetAuthorityBoundaries
          ? originalGetAuthorityBoundaries()
          : {};

      return {
        ...existing,

        canCoordinateTurnIntake:
          true,

        canConsumeCanonicalTurnPacket:
          true,

        canProjectTurnForContinuity:
          true,

        canBuildDegradedCurrentTurnProjection:
          true,

        canReportRuntimeUsability:
          true,

        canStopGlobalRuntime:
          false,

        canCreateCanonicalTurnPacket:
          false,

        canGenerateCanonicalTurnId:
          false,

        canCreateConversationId:
          false,

        persistenceRequiredForCompletion:
          false,

        role:
          "authoritative_conversation_state_provider_not_global_runtime_gatekeeper"
      };
    };

  /* =====================================================
     VALIDATION
  ===================================================== */

  cos.validate =
    function validate() {
      const existing =
        originalValidate
          ? originalValidate()
          : {
              valid:
                true,

              errors:
                [],

              warnings:
                [],

              checks:
                {}
            };

      const authority =
        this.getAuthorityBoundaries();

      const degradableErrors =
        new Set([
          "AriTurnIntakeEngine_not_loaded",
          "ari_turn_intake_engine_not_loaded",
          "AriTurnPacket_not_loaded",
          "ari_turn_packet_not_loaded",
          "conversation_store_not_loaded",
          "thread_store_not_loaded",
          "stored_state_not_available",
          "canonical_turn_packet_validation_unavailable"
        ]);

      const inheritedErrors =
        unique(
          existing.errors
        );

      const errors =
        inheritedErrors.filter(
          error =>
            !degradableErrors.has(
              error
            )
        );

      const warnings =
        unique([
          existing.warnings,

          inheritedErrors.filter(
            error =>
              degradableErrors.has(
                error
              )
          )
        ]);

      if (
        authority
          .canCreateCanonicalTurnPacket ===
        true
      ) {
        errors.push(
          "canCreateCanonicalTurnPacket_must_be_false"
        );
      }

      if (
        authority
          .canGenerateCanonicalTurnId ===
        true
      ) {
        errors.push(
          "canGenerateCanonicalTurnId_must_be_false"
        );
      }

      if (
        authority
          .canStopGlobalRuntime ===
        true
      ) {
        errors.push(
          "canStopGlobalRuntime_must_be_false"
        );
      }

      if (
        !window.AriTurnPacket ||
        (
          typeof window
            .AriTurnPacket
            .validate !==
            "function" &&
          typeof window
            .AriTurnPacket
            .create !==
            "function"
        )
      ) {
        warnings.push(
          "AriTurnPacket_not_loaded_authoritative_mode_unavailable"
        );
      }

      if (
        !window
          .AriTurnIntakeEngine ||
        typeof window
          .AriTurnIntakeEngine
          .run !==
          "function"
      ) {
        warnings.push(
          "AriTurnIntakeEngine_not_loaded_degraded_mode_available"
        );
      }

      const dedupedErrors =
        unique(
          errors
        );

      const dedupedWarnings =
        unique(
          warnings
        );

      return {
        ...existing,

        valid:
          dedupedErrors.length ===
          0,

        ready:
          dedupedErrors.length ===
            0 &&
          Boolean(
            window
              .AriTurnIntakeEngine &&
            typeof window
              .AriTurnIntakeEngine
              .run ===
              "function"
          ),

        moduleUsable:
          dedupedErrors.length ===
          0,

        degradedModeAvailable:
          typeof this
            .buildDegradedOperatingState ===
            "function",

        source:
          "ari-conversation-operating-state-resilience-validation",

        errors:
          dedupedErrors,

        warnings:
          dedupedWarnings,

        checks: {
          ...(
            existing.checks ||
            {}
          ),

          turnIntakeCoordinationEnabled:
            authority
              .canCoordinateTurnIntake ===
            true,

          canonicalTurnPacketConsumptionEnabled:
            authority
              .canConsumeCanonicalTurnPacket ===
            true,

          continuityTurnProjectionEnabled:
            authority
              .canProjectTurnForContinuity ===
            true,

          degradedCurrentTurnProjectionEnabled:
            authority
              .canBuildDegradedCurrentTurnProjection ===
            true,

          runtimeUsabilityReportingEnabled:
            authority
              .canReportRuntimeUsability ===
            true,

          globalRuntimeGatekeepingDisabled:
            authority
              .canStopGlobalRuntime ===
            false,

          canonicalTurnCreationSeparated:
            authority
              .canCreateCanonicalTurnPacket ===
            false,

          canonicalTurnIdGenerationSeparated:
            authority
              .canGenerateCanonicalTurnId ===
            false,

          persistenceSeparatedFromCompletion:
            authority
              .persistenceRequiredForCompletion ===
            false
        }
      };
    };

  /*
   * COS must never generate a competing canonical Turn ID.
   */
  cos.createTurnId =
    function createTurnId() {
      throw new Error(
        "AriConversationOperatingState cannot create canonical turn IDs. Use AriTurnPacket.create()."
      );
    };

  cos.version =
    "2.1.0";

  window.AriConversationOperatingState =
    cos;

  window.Ari.conversationOperatingState =
    cos;

  const validation =
    cos.validate();

  const status =
    validation.valid !==
    true
      ? "INVALID"
      : validation.ready ===
        true
        ? "READY"
        : "DEGRADED_READY";

  console.log(
    "ARI COS RESILIENCE PATCH LOADED:",
    cos.version,
    status,
    validation
  );
})();
